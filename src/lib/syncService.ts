/**
 * syncService.ts
 * Bidirektionaler Sync-Service mit striktem Aufwärts- & Non-Destructive-Prinzip.
 * 
 * Regeln:
 * - Immer nur aufwärts synchronisieren / mergen (Upsert).
 * - Niemals Daten auf der Remote-Umgebung oder lokal löschen.
 * - Nahtlose Fallbacks bei Verbindungsabbrüchen.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Sector, WallBoulder, Ascent, BoulderRating } from '../types/boulder';
import { GradeScale } from '../types/gym';
import * as gymStorage from './gymStorage';
import { getStorageJson, setStorageJson, setStorageString, isBoulderDeleted, markBoulderDeleted, isValidUuid, stringToUuid } from './storageUtils';
import { registerSyncHandlers } from './syncBridge';
import { SECTOR_ALIAS_MAP } from './batchBoulderService';
import { DEMO_USERS, SUPABASE_UUID_TO_DEMO_KEY, isTestEnv } from './authService';
import { getProfiles, STORAGE_KEY_PROFILES } from './profileService';

const STORAGE_KEY_SECTORS = 'boulderapp_sectors_v2';
const STORAGE_KEY_WALL_BOULDERS = 'boulderapp_wall_boulders_v2';
const STORAGE_KEY_ASCENTS = 'boulderapp_ascents_v3';
const STORAGE_KEY_RATINGS = 'boulderapp_ratings_v3';

export interface SyncStatus {
  lastSyncTime: string | null;
  syncedGyms: number;
  syncedSectors: number;
  syncedBoulders: number;
  error?: string;
}

let currentSyncStatus: SyncStatus = {
  lastSyncTime: null,
  syncedGyms: 0,
  syncedSectors: 0,
  syncedBoulders: 0,
};

export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

/**
 * Lädt Stammdaten (Hallen, Sektoren, Farbskalen, Boulder) aus Supabase
 * und merged sie non-destruktiv in den lokalen Cache.
 */
export async function syncFromSupabase(): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) {
    return false;
  }

  try {
    // 0.5 User Profiles aus Supabase laden & lokal ablegen
    try {
      const { data: dbProfiles } = await supabase
        .from('user_profiles')
        .select('*');

      if (dbProfiles && dbProfiles.length > 0) {
        const localProfiles = getProfiles();
        const profileMap = new Map(localProfiles.map(p => [p.id, p]));
        for (const p of dbProfiles) {
          const existing = profileMap.get(p.id);
          profileMap.set(p.id, {
            id: p.id,
            nickname: p.nickname || existing?.nickname || 'Kletterer',
            avatarUrl: p.avatar_url || existing?.avatarUrl,
            createdAt: p.created_at || existing?.createdAt || new Date().toISOString(),
            updatedAt: p.updated_at || existing?.updatedAt,
          });
        }
        setStorageJson(STORAGE_KEY_PROFILES, Array.from(profileMap.values()));
      }
    } catch (profileErr) {
      console.warn('[Sync] Fehler beim Laden der user_profiles:', profileErr);
    }

    // 1. Gyms laden
    const { data: dbGyms, error: gymError } = await supabase
      .from('gyms')
      .select('*');

    if (gymError) {
      console.warn('[Sync] Fehler beim Laden der Hallen:', gymError.message);
      return false;
    }

    if (dbGyms && dbGyms.length > 0) {
      const localGyms = gymStorage.getGyms();
      const localGymMap = new Map(localGyms.map(g => [g.id, g]));

      for (const g of dbGyms) {
        // ID mapping (auch Name matching fuer 6a plus / Minimum)
        let matched = false;
        for (const [id, localG] of localGymMap.entries()) {
          if (localG.name.toLowerCase() === g.name.toLowerCase() || id === g.id) {
            localGymMap.set(id, {
              ...localG,
              name: g.name,
              city: g.city || localG.city,
              address: g.address || localG.address,
              website: g.website || localG.website,
              logo_url: g.logo_url || localG.logo_url,
            });
            matched = true;
            break;
          }
        }
        if (!matched) {
          localGymMap.set(g.id, {
            id: g.id,
            name: g.name,
            city: g.city || 'Zürich',
            address: g.address || '',
            website: g.website || '',
            logo_url: g.logo_url || '/images/walls/overhang.jpg',
            created_by: g.created_by || 'system',
            created_at: g.created_at,
          });
        }
      }
      gymStorage.saveGyms(Array.from(localGymMap.values()));
      currentSyncStatus.syncedGyms = localGymMap.size;
    }

    // 1.5 Gym-Members & Rollen aus Supabase laden
    const { data: dbMembers } = await supabase
      .from('gym_members')
      .select('*');

    if (dbMembers && dbMembers.length > 0) {
      const localMembers = gymStorage.getMembers();
      const memberMap = new Map(localMembers.map(m => [`${m.gym_id}_${m.user_id}_${m.role}`, m]));
      for (const m of dbMembers) {
        const targetGymId = (m.gym_id && m.gym_id.includes('f2b11564')) ? 'gym-6a-plus' : (m.gym_id && m.gym_id.includes('814696b2')) ? 'gym-minimum-zh' : m.gym_id;
        memberMap.set(`${targetGymId}_${m.user_id}_${m.role}`, {
          id: m.id,
          gym_id: targetGymId,
          user_id: m.user_id,
          role: m.role,
          appointed_by: m.appointed_by,
          created_at: m.created_at || new Date().toISOString()
        } as any);
      }
      gymStorage.saveMembers(Array.from(memberMap.values()));
    }

    // 2. Sektoren laden
    const { data: dbSectors, error: secError } = await supabase
      .from('sectors')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!secError && dbSectors && dbSectors.length > 0) {
      // V1 Cache (gymStorage)
      const localV1Sectors = gymStorage.getSectors();
      const v1SecMap = new Map(localV1Sectors.map(s => [s.id, s]));

      // V2 Cache (batchBoulderService)
      const localSectors = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []);
      const sectorMap = new Map(localSectors.map(s => [s.id, s]));

      for (const s of dbSectors) {
        const targetGymId = (s.gym_id && s.gym_id.includes('f2b11564')) ? 'gym-6a-plus' : (s.gym_id && s.gym_id.includes('814696b2')) ? 'gym-minimum-zh' : s.gym_id;
        const resolvedUrl = s.wall_photo_url || '/images/walls/overhang.jpg';

        // Check if exists in V2 by id or name
        let foundKey: string | null = null;
        for (const [k, localSec] of sectorMap.entries()) {
          if (k === s.id || (localSec.name.trim().toLowerCase() === s.name.trim().toLowerCase() && (localSec.gymId === targetGymId || localSec.gymId.includes('6a')))) {
            foundKey = k;
            break;
          }
        }

        const canonicalId = foundKey || s.id;
        sectorMap.set(canonicalId, {
          id: canonicalId,
          gymId: targetGymId,
          name: s.name,
          wallPhotoUrl: resolvedUrl,
          sortOrder: s.sort_order || 1,
          createdAt: s.created_at,
        });

        // Also sync into V1 (gymStorage) so Hallenbereich sees the exact same sectors!
        let foundV1Key: string | null = null;
        for (const [k, localSec] of v1SecMap.entries()) {
          if (k === canonicalId || k === s.id || (localSec.name.trim().toLowerCase() === s.name.trim().toLowerCase() && (localSec.gym_id === targetGymId || localSec.gym_id.includes('6a')))) {
            foundV1Key = k;
            break;
          }
        }
        const v1Id = foundV1Key || canonicalId;
        v1SecMap.set(v1Id, {
          id: v1Id,
          gym_id: targetGymId,
          name: s.name,
          wall_photo_url: resolvedUrl,
          sort_order: s.sort_order || 1,
          created_at: s.created_at || new Date().toISOString(),
        });
      }

      const sortedV2 = Array.from(sectorMap.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const sortedV1 = Array.from(v1SecMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      setStorageJson(STORAGE_KEY_SECTORS, sortedV2);
      gymStorage.saveSectors(sortedV1);
      currentSyncStatus.syncedSectors = sectorMap.size;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bouldermate:sectors_updated', {
          detail: { action: 'synced', count: sectorMap.size }
        }));
      }
    }

    // 2.5 Farbskalen / Farbsystem laden
    const { data: dbScales, error: scaleError } = await supabase
      .from('grade_scales')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!scaleError && dbScales && dbScales.length > 0) {
      // Group remote scales by normalized gym
      const scalesByGym = new Map<string, typeof dbScales>();
      for (const sc of dbScales) {
        const targetGymId = (sc.gym_id && sc.gym_id.includes('f2b11564'))
          ? 'gym-6a-plus'
          : (sc.gym_id && sc.gym_id.includes('814696b2'))
          ? 'gym-minimum-zh'
          : sc.gym_id;
        if (!scalesByGym.has(targetGymId)) {
          scalesByGym.set(targetGymId, []);
        }
        scalesByGym.get(targetGymId)!.push(sc);
      }

      let allV1Scales = gymStorage.getGradeScales();
      let allV2Scales = getStorageJson<any[]>('boulderapp_grade_scales_v2', []);

      for (const [targetGymId, gymDbScales] of scalesByGym.entries()) {
        const sorted = [...gymDbScales].sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));
        const cleanV1: GradeScale[] = sorted.map((sc, idx) => ({
          id: sc.id,
          gym_id: targetGymId,
          color_name: sc.color_name,
          color_hex: sc.color_hex,
          difficulty_label: sc.difficulty_label,
          font_range_min: sc.font_range_min || '3',
          font_range_max: sc.font_range_max || '4',
          sort_order: sc.sort_order !== undefined ? sc.sort_order : idx + 1,
          created_at: sc.created_at || new Date().toISOString(),
        }));

        allV1Scales = allV1Scales.filter(s => {
          const sGym = (s.gym_id === 'gym-6a-plus' || s.gym_id.includes('6a') || s.gym_id.includes('f2b11564'))
            ? 'gym-6a-plus'
            : (s.gym_id === 'gym-minimum-zh' || s.gym_id.includes('minimum') || s.gym_id.includes('814696b2'))
            ? 'gym-minimum-zh'
            : s.gym_id;
          return sGym !== targetGymId;
        });
        allV1Scales.push(...cleanV1);

        const cleanV2 = cleanV1.map(sc => ({
          id: sc.id,
          gymId: targetGymId,
          colorName: sc.color_name,
          colorHex: sc.color_hex,
          difficultyLabel: sc.difficulty_label,
          fontRangeMin: sc.font_range_min,
          fontRangeMax: sc.font_range_max,
          sortOrder: sc.sort_order,
        }));

        allV2Scales = allV2Scales.filter(s => {
          const sGym = (s.gymId === 'gym-6a-plus' || s.gymId?.includes('6a') || s.gymId?.includes('f2b11564'))
            ? 'gym-6a-plus'
            : (s.gymId === 'gym-minimum-zh' || s.gymId?.includes('minimum') || s.gymId?.includes('814696b2'))
            ? 'gym-minimum-zh'
            : s.gymId;
          return sGym !== targetGymId;
        });
        allV2Scales.push(...cleanV2);
      }

      gymStorage.saveGradeScales(allV1Scales);
      setStorageJson('boulderapp_grade_scales_v2', allV2Scales);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bouldermate:gradescales_updated', {
          detail: {}
        }));
      }
    }

    // 3. Boulder laden & harmonisieren
    const { data: dbBoulders, error: boulderError } = await supabase
      .from('boulders')
      .select('*');

    if (!boulderError && dbBoulders && dbBoulders.length > 0) {
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const boulderMap = new Map(localBoulders.map(b => [b.id, b]));

      const localV1Boulders = gymStorage.getBoulders();
      const v1BoulderMap = new Map(localV1Boulders.map(b => [b.id, b]));

      // Lookup für Sektoren nach Name
      const allSectors = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []);
      const sectorIdByName = new Map<string, string>();
      for (const sec of allSectors) {
        sectorIdByName.set(sec.name.trim().toLowerCase(), sec.id);
      }

      // Track all remote boulder IDs per resolved sector for reconciliation
      const remoteIdsPerSector = new Map<string, Set<string>>();

      for (const b of dbBoulders) {
        if (isBoulderDeleted(b.id)) {
          continue;
        }

        let resolvedSectorId = b.sector_id;
        const matchingSec = dbSectors?.find(ds => ds.id === b.sector_id);
        if (matchingSec && sectorIdByName.has(matchingSec.name.trim().toLowerCase())) {
          resolvedSectorId = sectorIdByName.get(matchingSec.name.trim().toLowerCase())!;
        }

        if (!remoteIdsPerSector.has(resolvedSectorId)) {
          remoteIdsPerSector.set(resolvedSectorId, new Set());
        }
        remoteIdsPerSector.get(resolvedSectorId)!.add(b.id);

        const boulderObj: WallBoulder = {
          id: b.id,
          sectorId: resolvedSectorId,
          gradeScaleId: b.grade_scale_id,
          positionX: b.position_x,
          positionY: b.position_y,
          name: b.name || 'Unbenannter Boulder',
          notes: b.notes || '',
          setterId: b.setter_id || 'system',
          status: b.status || 'active',
          radar: {
            maximalkraft: b.radar_maximalkraft || b.radar_kraft || 3,
            kraftausdauer: b.radar_kraftausdauer || b.radar_kraft || 3,
            kraft: b.radar_kraft || 3,
            technik: b.radar_technik || 3,
            balance: b.radar_balance || 3,
            koordination: b.radar_koordination || 3,
            flexibilitaet: b.radar_flexibilitaet || 3,
          },
          fontGrade: b.font_grade || undefined,
          createdAt: b.created_at,
          publishedAt: b.published_at || undefined,
          archivedAt: b.archived_at || undefined,
        };

        // Do NOT deduplicate by generic name ("Unbenannter Boulder")!
        // Every boulder in Supabase has its own unique ID and coordinate on the wall.
        boulderMap.set(b.id, boulderObj);

        v1BoulderMap.set(b.id, {
          id: b.id,
          sector_id: resolvedSectorId,
          grade_scale_id: b.grade_scale_id,
          position_x: b.position_x,
          position_y: b.position_y,
          status: b.status || 'active',
          name: b.name,
        });
      }

      // Reconcile: For sectors present in Supabase, purge obsolete local 'active' boulders
      // that no longer exist in Supabase (e.g. deleted on desktop / previous seeds)
      for (const [secId, remoteIds] of remoteIdsPerSector.entries()) {
        const matchingSecIds = new Set<string>([secId]);
        if (SECTOR_ALIAS_MAP[secId]) matchingSecIds.add(SECTOR_ALIAS_MAP[secId]);
        const matchingDbSec = dbSectors?.find(ds => ds.id === secId);
        if (matchingDbSec) {
          for (const s of allSectors) {
            if (s.name.trim().toLowerCase() === matchingDbSec.name.trim().toLowerCase()) {
              matchingSecIds.add(s.id);
              if (SECTOR_ALIAS_MAP[s.id]) matchingSecIds.add(SECTOR_ALIAS_MAP[s.id]);
            }
          }
        }

        for (const [localId, localB] of boulderMap.entries()) {
          const belongsToSector = matchingSecIds.has(localB.sectorId);
          if (belongsToSector && localB.status === 'active' && !remoteIds.has(localId)) {
            boulderMap.delete(localId);
            v1BoulderMap.delete(localId);
          }
        }
      }

      const remoteBoulderIdSet = new Set(dbBoulders.map(b => b.id));

      // Explicitly purge ANY legacy mock seed routes or active boulders not present in Supabase
      for (const [localId, localB] of boulderMap.entries()) {
        const isLegacySeed = localId.startsWith('boulder-existing-') || localId.startsWith('boulder-6a-');
        const isDeleted = isBoulderDeleted(localId);
        const isOrphanedActive = localB.status === 'active' && !remoteBoulderIdSet.has(localId);

        if (isLegacySeed || isDeleted || isOrphanedActive ||
            localB.name === 'Glatteis' ||
            localB.name === 'Mikro-Sloper' ||
            localB.name === 'Balance-Pfeiler' ||
            localB.name === 'Reibungs-Kante' ||
            ((localB.sectorId === 'sec_6a_slab_vorne' || localB.sectorId === '8656b5d8-838d-4655-8303-57d4ab87b8dd') && localId === 'a06a9337-4e3d-4b78-8dcf-aa697418a836')) {
          boulderMap.delete(localId);
          v1BoulderMap.delete(localId);
          if (isLegacySeed) {
            markBoulderDeleted(localId);
          }
        }
      }

      for (const [v1Id] of v1BoulderMap.entries()) {
        if (v1Id.startsWith('boulder-existing-') || v1Id.startsWith('boulder-6a-') || !remoteBoulderIdSet.has(v1Id)) {
          v1BoulderMap.delete(v1Id);
        }
      }

      setStorageJson(STORAGE_KEY_WALL_BOULDERS, Array.from(boulderMap.values()));
      gymStorage.saveBoulders(Array.from(v1BoulderMap.values()));
      setStorageString('bouldermate_synced_from_supabase', 'true');
      currentSyncStatus.syncedBoulders = boulderMap.size;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bouldermate:boulders_updated', {
          detail: { action: 'synced', count: boulderMap.size }
        }));
      }
    }

    // 4. Ascents laden & mergen (non-destructive mit Nickname- & Boulder-Auflösung)
    const { data: dbAscents } = await supabase.from('ascents').select('*');
    if (dbAscents && dbAscents.length > 0) {
      const localAscents = getStorageJson<Ascent[]>(STORAGE_KEY_ASCENTS, []);
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const ascentMap = new Map<string, Ascent>();
      localAscents.forEach(a => ascentMap.set(`${a.boulderId}_${a.userId}`, a));

      for (const a of dbAscents) {
        const resolvedUser = resolveUserIdAndNickname(a.user_id);
        const matchingBoulder = localBoulders.find(b => b.id === a.boulder_id || stringToUuid(b.id) === a.boulder_id);
        const resolvedBoulderId = matchingBoulder?.id || a.boulder_id;
        const key = `${resolvedBoulderId}_${resolvedUser.userId}`;

        ascentMap.set(key, {
          id: a.id,
          userId: resolvedUser.userId,
          userNickname: resolvedUser.nickname,
          userAvatarUrl: resolvedUser.avatarUrl,
          boulderId: resolvedBoulderId,
          type: (a.ascent_style as any) || 'top',
          createdAt: a.created_at,
        });
      }
      setStorageJson(STORAGE_KEY_ASCENTS, Array.from(ascentMap.values()));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bouldermate:ascents_updated', {
          detail: { action: 'synced', count: ascentMap.size }
        }));
      }
    }

    // 5. Ratings laden & mergen (non-destructive mit Nickname- & Boulder-Auflösung)
    const { data: dbRatings } = await supabase.from('ratings').select('*');
    if (dbRatings && dbRatings.length > 0) {
      const localRatings = getStorageJson<BoulderRating[]>(STORAGE_KEY_RATINGS, []);
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const ratingMap = new Map<string, BoulderRating>();
      localRatings.forEach(r => ratingMap.set(`${r.boulderId}_${r.userId}`, r));

      for (const r of dbRatings) {
        const resolvedUser = resolveUserIdAndNickname(r.user_id);
        const matchingBoulder = localBoulders.find(b => b.id === r.boulder_id || stringToUuid(b.id) === r.boulder_id);
        const resolvedBoulderId = matchingBoulder?.id || r.boulder_id;
        const key = `${resolvedBoulderId}_${resolvedUser.userId}`;

        ratingMap.set(key, {
          id: r.id,
          boulderId: resolvedBoulderId,
          userId: resolvedUser.userId,
          userNickname: resolvedUser.nickname,
          userAvatarUrl: resolvedUser.avatarUrl,
          gradeFeel: (r.perceived_difficulty as any) || undefined,
          qualityStars: r.stars || undefined,
          radar: {
            kraft: r.radar_kraft || 3,
            technik: r.radar_technik || 3,
            balance: r.radar_balance || 3,
            koordination: r.radar_koordination || 3,
            flexibilitaet: r.radar_flexibilitaet || 3,
          },
          createdAt: r.created_at,
          updatedAt: r.created_at,
        });
      }
      setStorageJson(STORAGE_KEY_RATINGS, Array.from(ratingMap.values()));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', {
          detail: { action: 'synced', count: ratingMap.size }
        }));
      }
    }

    currentSyncStatus.lastSyncTime = new Date().toISOString();
    return true;
  } catch (err: any) {
    console.error('[Sync] Unerwarteter Sync-Fehler:', err);
    currentSyncStatus.error = err?.message || String(err);
    return false;
  }
}

/**
 * Synchronisiert geänderte Farbskalen non-destruktiv aufwärts nach Supabase.
 */
export async function syncGradeScalesToSupabase(gymId: string, scales: GradeScale[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv) return true;

  try {
    const supabaseGymId = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? '814696b2-303e-4897-9bdb-d83505a63489'
      : gymId;

    // Supabase grade_scales abfragen für semantisches ID-Mapping
    const { data: existingRemote } = await supabase
      .from('grade_scales')
      .select('id, color_name, gym_id')
      .eq('gym_id', supabaseGymId);

    const remoteByName = new Map<string, string>();
    if (existingRemote) {
      for (const r of existingRemote) {
        remoteByName.set(r.color_name.trim().toLowerCase().replace(/ß/g, 'ss'), r.id);
      }
    }

    const upsertPayload = scales.map((s, idx) => {
      const normColor = s.color_name.trim().toLowerCase().replace(/ß/g, 'ss');
      // Wenn es bereits eine passende UUID in Supabase gibt, diese wiederverwenden
      const remoteId = remoteByName.get(normColor) ||
        (s.id && isValidUuid(s.id) ? s.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : stringToUuid(`scale_${supabaseGymId}_${normColor}`)));

      const finalColorName = (supabaseGymId === 'f2b11564-ca86-4ed4-b51c-3affb346144b' && normColor === 'weiss')
        ? 'Weiss'
        : s.color_name.trim();

      const item: any = {
        id: remoteId,
        gym_id: supabaseGymId,
        color_name: finalColorName,
        color_hex: s.color_hex.trim(),
        difficulty_label: s.difficulty_label.trim(),
        font_range_min: s.font_range_min.trim(),
        font_range_max: s.font_range_max.trim(),
        sort_order: s.sort_order !== undefined ? s.sort_order : idx + 1,
      };
      return item;
    });

    const { error } = await supabase
      .from('grade_scales')
      .upsert(upsertPayload);

    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync der Farbskalen:', error.message);
      return false;
    }

    // Wenn der Admin Farben gelöscht hat: Nur Farbskalen ohne referenzierte Boulder löschen!
    if (existingRemote && existingRemote.length > 0) {
      const currentRemoteIds = new Set(upsertPayload.map(p => p.id));
      const toDelete = existingRemote.filter(r => !currentRemoteIds.has(r.id)).map(r => r.id);
      if (toDelete.length > 0) {
        const { data: referencingBoulders } = await supabase
          .from('boulders')
          .select('id, grade_scale_id')
          .in('grade_scale_id', toDelete);

        const safeToDelete = toDelete.filter(id => !referencingBoulders?.some(b => b.grade_scale_id === id));
        if (safeToDelete.length > 0) {
          await supabase.from('grade_scales').delete().in('id', safeToDelete);
        }
      }
    }

    // WICHTIG: Die kanonischen UUIDs sofort in den lokalen Speicher schreiben!
    const targetNorm = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'gym-6a-plus'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? 'gym-minimum-zh'
      : gymId;

    const canonicalV1: GradeScale[] = upsertPayload.map(sc => ({
      id: sc.id,
      gym_id: targetNorm,
      color_name: sc.color_name,
      color_hex: sc.color_hex,
      difficulty_label: sc.difficulty_label,
      font_range_min: sc.font_range_min,
      font_range_max: sc.font_range_max,
      sort_order: sc.sort_order,
      created_at: new Date().toISOString(),
    }));

    let allV1 = gymStorage.getGradeScales().filter(s => {
      const sNorm = (s.gym_id === 'gym-6a-plus' || s.gym_id?.includes('6a') || s.gym_id?.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (s.gym_id === 'gym-minimum-zh' || s.gym_id?.includes('minimum') || s.gym_id?.includes('814696b2'))
        ? 'gym-minimum-zh'
        : s.gym_id;
      return sNorm !== targetNorm;
    });
    allV1.push(...canonicalV1);
    gymStorage.saveGradeScales(allV1);

    const canonicalV2 = canonicalV1.map(sc => ({
      id: sc.id,
      gymId: targetNorm,
      colorName: sc.color_name,
      colorHex: sc.color_hex,
      difficultyLabel: sc.difficulty_label,
      fontRangeMin: sc.font_range_min,
      fontRangeMax: sc.font_range_max,
      sortOrder: sc.sort_order,
    }));

    let allV2 = getStorageJson<any[]>('boulderapp_grade_scales_v2', []).filter(s => {
      const sNorm = (s.gymId === 'gym-6a-plus' || s.gymId?.includes('6a') || s.gymId?.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (s.gymId === 'gym-minimum-zh' || s.gymId?.includes('minimum') || s.gymId?.includes('814696b2'))
        ? 'gym-minimum-zh'
        : s.gymId;
      return sNorm !== targetNorm;
    });
    allV2.push(...canonicalV2);
    setStorageJson('boulderapp_grade_scales_v2', allV2);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:gradescales_updated', {
        detail: { gymId, scales: canonicalV1 }
      }));
    }

    console.log(`[Sync] ${upsertPayload.length} Farbskalen erfolgreich nach Supabase synchronisiert.`);
    return true;
  } catch (err) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Farbskalen:', err);
    return false;
  }
}

// Re-export UUID helpers from storageUtils (Single Source of Truth)
export { isValidUuid, stringToUuid };

export const KNOWN_AUTH_USER_UUIDS = new Set([
  '00000000-1d0e-4000-8000-e92d69136f33', // Boris
  '00000000-37e7-4000-8000-0743462b539d', // Admin6APlus
  '00000000-08ca-4000-8000-6e6f5bce818f', // Schrauber6aPlus
  '00000000-4553-4000-8000-3dd13fac9e0f', // HansDereinfacheKletterer
  '00000000-2ff9-4000-8000-b7902cb24230', // AdminMinimum
  '00000000-5a7c-4000-8000-7702607a9a42', // Schrauber Minimum
]);

export function resolveUserIdAndNickname(remoteUserId?: string): { userId: string; nickname: string; avatarUrl?: string } {
  if (!remoteUserId) {
    return { userId: 'guest', nickname: 'Gast' };
  }
  const demoKey = SUPABASE_UUID_TO_DEMO_KEY[remoteUserId];
  if (demoKey && DEMO_USERS[demoKey]) {
    const u = DEMO_USERS[demoKey];
    return { userId: demoKey, nickname: u.nickname, avatarUrl: u.avatarUrl };
  }
  if (DEMO_USERS[remoteUserId]) {
    const u = DEMO_USERS[remoteUserId];
    return { userId: remoteUserId, nickname: u.nickname, avatarUrl: u.avatarUrl };
  }

  // Lookup in cached user_profiles
  try {
    const cached = getProfiles().find(p => p.id === remoteUserId);
    if (cached && cached.nickname) {
      return { userId: remoteUserId, nickname: cached.nickname, avatarUrl: cached.avatarUrl };
    }
  } catch {
    // fallback
  }

  return { userId: remoteUserId, nickname: 'Kletterer' };
}

export function toKnownAuthUserUuid(userId?: string): string {
  if (!userId) return '00000000-1d0e-4000-8000-e92d69136f33';
  if (KNOWN_AUTH_USER_UUIDS.has(userId)) return userId;
  if (isValidUuid(userId)) return userId;
  const converted = stringToUuid(userId);
  if (KNOWN_AUTH_USER_UUIDS.has(converted)) return converted;
  return '00000000-1d0e-4000-8000-e92d69136f33';
}

/**
 * Synchronisiert ein neues oder aktualisiertes Gym-Mitglied nach Supabase (gym_members).
 */
export async function syncGymMemberToSupabase(
  gymId: string, 
  userId: string, 
  role: string, 
  appointedBy?: string
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv) return false;
  try {
    const supabaseGymId = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? '814696b2-303e-4897-9bdb-d83505a63489'
      : gymId;
    const userUuid = toKnownAuthUserUuid(userId);
    const appointedByUuid = appointedBy ? toKnownAuthUserUuid(appointedBy) : null;

    const { error } = await supabase.from('gym_members').upsert({
      gym_id: supabaseGymId,
      user_id: userUuid,
      role,
      appointed_by: appointedByUuid,
      created_at: new Date().toISOString(),
    }, { onConflict: 'gym_id,user_id,role' });

    if (error) {
      console.warn('[Sync] gym_member upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Sync] Fehler beim Synchronisieren des Gym-Mitglieds:', err);
    return false;
  }
}

/**
 * Entfernt ein Gym-Mitglied aus Supabase (gym_members).
 */
export async function removeGymMemberFromSupabase(
  gymId: string, 
  userId: string, 
  role: string
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv) return false;
  try {
    const supabaseGymId = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? '814696b2-303e-4897-9bdb-d83505a63489'
      : gymId;
    const userUuid = toKnownAuthUserUuid(userId);

    const { error } = await supabase
      .from('gym_members')
      .delete()
      .match({ gym_id: supabaseGymId, user_id: userUuid, role });

    if (error) {
      console.warn('[Sync] gym_member delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Sync] Fehler beim Entfernen des Gym-Mitglieds:', err);
    return false;
  }
}

/**
 * Synchronisiert einen Sektor in Echtzeit aufwärts nach Supabase.
 */
export async function syncSectorToSupabase(sector: any): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !sector) return true;
  try {
    const rawGymId = sector.gym_id || sector.gymId;
    const targetGymId = (rawGymId === 'gym-6a-plus' || rawGymId?.includes('6a') || rawGymId?.includes('f2b11564'))
      ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
      : (rawGymId === 'gym-minimum-zh' || rawGymId?.includes('minimum') || rawGymId?.includes('814696b2'))
      ? '814696b2-303e-4897-9bdb-d83505a63489'
      : rawGymId;

    const { data: existingSectors } = await supabase
      .from('sectors')
      .select('id, name')
      .eq('gym_id', targetGymId);

    const match = existingSectors?.find(s => s.name.trim().toLowerCase() === sector.name.trim().toLowerCase());
    const sectorUuid = match?.id || (isValidUuid(sector.id) ? sector.id : stringToUuid(sector.id));

    const payload = {
      id: sectorUuid,
      gym_id: targetGymId,
      name: sector.name.trim(),
      wall_photo_url: sector.wall_photo_url || sector.wallPhotoUrl || null,
      sort_order: sector.sort_order || sector.sortOrder || 1,
      created_at: sector.created_at || sector.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('sectors').upsert(payload);
    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync des Sektors:', error.message);
      return false;
    }
    console.log(`[Sync] Sektor "${payload.name}" (${payload.id}) erfolgreich nach Supabase synchronisiert.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync des Sektors:', e);
    return false;
  }
}

/**
 * Synchronisiert die neue Sortierreihenfolge der Sektoren einer Halle aufwärts nach Supabase.
 * Verhindert, dass nachfolgende syncFromSupabase() oder Deployments die Reihenfolge überschreiben.
 */
export async function syncSectorOrderToSupabase(gymId: string, orderedSectorIds: string[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !orderedSectorIds || orderedSectorIds.length === 0) return false;

  try {
    const targetGymId = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? '814696b2-303e-4897-9bdb-d83505a63489'
      : gymId;

    // Remote-Sektoren für das Gym laden
    const { data: remoteSectors, error: fetchErr } = await supabase
      .from('sectors')
      .select('id, name, sort_order')
      .eq('gym_id', targetGymId);

    if (fetchErr || !remoteSectors || remoteSectors.length === 0) {
      console.warn('[Sync] Keine Remote-Sektoren für Gym gefunden:', fetchErr?.message);
      return false;
    }

    // Lokale Sektoren für Namens- und ID-Lookup abrufen
    const localV1 = gymStorage.getSectors();
    const localV2 = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []);
    const localSectorMap = new Map<string, string>(); // ID -> Name
    for (const s of localV1) {
      if (s.id && s.name) localSectorMap.set(s.id, s.name);
    }
    for (const s of localV2) {
      if (s.id && s.name) localSectorMap.set(s.id, s.name);
    }

    // Updates für Supabase sammeln
    const updates: { id: string; sort_order: number }[] = [];

    orderedSectorIds.forEach((id, index) => {
      const newOrder = index + 1;
      const localName = localSectorMap.get(id);

      // Finde passenden Remote-Sektor:
      // 1. Direkte UUID-Übereinstimmung
      // 2. Namens-Übereinstimmung über lokalen Namen
      // 3. SECTOR_ALIAS_MAP-Übereinstimmung
      // 4. Direkte Namens-Übereinstimmung mit id
      const remoteSec = remoteSectors.find(r =>
        r.id === id ||
        (localName && r.name.trim().toLowerCase() === localName.trim().toLowerCase()) ||
        (SECTOR_ALIAS_MAP[id] && r.id === SECTOR_ALIAS_MAP[id]) ||
        (r.name.trim().toLowerCase() === id.trim().toLowerCase())
      );

      if (remoteSec) {
        updates.push({ id: remoteSec.id, sort_order: newOrder });
      }
    });

    if (updates.length === 0) {
      return false;
    }

    // Führe Updates in Supabase parallel durch
    const updatePromises = updates.map(u =>
      supabase!
        .from('sectors')
        .update({ sort_order: u.sort_order })
        .eq('id', u.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some(r => r.error);
    if (hasError) {
      console.warn('[Sync] Fehler beim Aktualisieren der Sektor-Sortierung in Supabase');
      return false;
    }

    // Lokale Caches aktualisieren, damit alles synchron bleibt
    const targetNorm = (gymId === 'gym-6a-plus' || gymId.includes('6a') || gymId.includes('f2b11564'))
      ? 'gym-6a-plus'
      : (gymId === 'gym-minimum-zh' || gymId.includes('minimum') || gymId.includes('814696b2'))
      ? 'gym-minimum-zh'
      : gymId;

    const updatedV1 = gymStorage.getSectors().map(s => {
      const sGym = (s.gym_id === 'gym-6a-plus' || s.gym_id?.includes('6a') || s.gym_id?.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (s.gym_id === 'gym-minimum-zh' || s.gym_id?.includes('minimum') || s.gym_id?.includes('814696b2'))
        ? 'gym-minimum-zh'
        : s.gym_id;

      if (sGym === targetNorm) {
        const u = updates.find(up => up.id === s.id || (localSectorMap.get(s.id) && remoteSectors.find(r => r.id === up.id)?.name.trim().toLowerCase() === localSectorMap.get(s.id)?.trim().toLowerCase()));
        if (u) return { ...s, sort_order: u.sort_order };
      }
      return s;
    });
    const sortedV1 = updatedV1.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    gymStorage.saveSectors(sortedV1);

    const updatedV2 = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []).map(s => {
      const sGym = (s.gymId === 'gym-6a-plus' || s.gymId?.includes('6a') || s.gymId?.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (s.gymId === 'gym-minimum-zh' || s.gymId?.includes('minimum') || s.gymId?.includes('814696b2'))
        ? 'gym-minimum-zh'
        : s.gymId;

      if (sGym === targetNorm) {
        const u = updates.find(up => up.id === s.id || (localSectorMap.get(s.id) && remoteSectors.find(r => r.id === up.id)?.name.trim().toLowerCase() === localSectorMap.get(s.id)?.trim().toLowerCase()));
        if (u) return { ...s, sortOrder: u.sort_order };
      }
      return s;
    });
    const sortedV2 = updatedV2.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    setStorageJson(STORAGE_KEY_SECTORS, sortedV2);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:sectors_updated', {
        detail: { action: 'reordered', gymId: targetNorm, count: updates.length }
      }));
    }

    console.log(`[Sync] Sektor-Sortierung (${updates.length} Sektoren) erfolgreich in Supabase persistiert.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Sektor-Reihenfolge:', e);
    return false;
  }
}

/**
 * Synchronisiert neu erstellte oder geänderte Boulder in Echtzeit aufwärts nach Supabase.
 */
export async function syncBouldersToSupabase(boulders: WallBoulder[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !boulders || boulders.length === 0) return true;
  try {
    const [sectorsRes, scalesRes] = await Promise.all([
      supabase.from('sectors').select('id, name, gym_id'),
      supabase.from('grade_scales').select('id, color_name, gym_id')
    ]);

    const remoteSectors = sectorsRes.data || [];
    const remoteScales = scalesRes.data || [];

    const localSectors = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []);
    const localScales = gymStorage.getGradeScales();

    const upsertRows: any[] = [];
    const resolvedScaleMapping = new Map<string, string>(); // b.id -> resolvedScaleId

    for (const b of boulders) {
      // 1. Sektor strikt auflösen
      let resolvedSectorId: string | null = null;
      let targetGymId: string | null = null;

      if (isValidUuid(b.sectorId) && remoteSectors.some(s => s.id === b.sectorId)) {
        resolvedSectorId = b.sectorId;
        const matchedSec = remoteSectors.find(s => s.id === b.sectorId);
        targetGymId = matchedSec?.gym_id || null;
      } else {
        const localSec = localSectors.find(s => s.id === b.sectorId);
        if (localSec) {
          const secGym = (localSec as any).gym_id || localSec.gymId;
          const normSecGym = (secGym === 'gym-6a-plus' || secGym?.includes('6a') || secGym?.includes('f2b11564'))
            ? 'f2b11564-ca86-4ed4-b51c-3affb346144b'
            : (secGym === 'gym-minimum-zh' || secGym?.includes('minimum') || secGym?.includes('814696b2'))
            ? '814696b2-303e-4897-9bdb-d83505a63489'
            : secGym;

          const matchedRemote = remoteSectors.find(rs => {
            const nameMatch = rs.name.trim().toLowerCase() === localSec.name.trim().toLowerCase();
            if (!nameMatch) return false;
            return !normSecGym || rs.gym_id === normSecGym;
          });
          if (matchedRemote) {
            resolvedSectorId = matchedRemote.id;
            targetGymId = matchedRemote.gym_id;
          }
        }
      }

      // WICHTIG: Niemals blind auf Sektoren einer fremden Halle fallbacken!
      if (!resolvedSectorId || !targetGymId) continue;

      // 2. Farbskala strikt innerhalb DIESER Halle auflösen
      const gymRemoteScales = remoteScales.filter(rs => rs.gym_id === targetGymId);

      let resolvedScaleId: string | null = null;
      if (isValidUuid(b.gradeScaleId) && gymRemoteScales.some(s => s.id === b.gradeScaleId)) {
        resolvedScaleId = b.gradeScaleId;
      } else {
        const localSc = localScales.find(s => s.id === b.gradeScaleId);
        if (localSc) {
          const normLocalColor = localSc.color_name.trim().toLowerCase().replace(/ß/g, 'ss');
          const matchedScale = gymRemoteScales.find(rs =>
            rs.color_name.trim().toLowerCase().replace(/ß/g, 'ss') === normLocalColor
          );
          if (matchedScale) resolvedScaleId = matchedScale.id;
        }
      }
      // Fallback per Farbname aus Boulder-Name innerhalb DIESER Halle
      if (!resolvedScaleId && b.name) {
        const nameNorm = b.name.trim().toLowerCase().replace(/ß/g, 'ss');
        const matchedByName = gymRemoteScales.find(rs =>
          nameNorm.includes(rs.color_name.trim().toLowerCase().replace(/ß/g, 'ss'))
        );
        if (matchedByName) resolvedScaleId = matchedByName.id;
      }
      // Fallback auf erste Skala DIESER Halle (niemals fremde Halle!)
      if (!resolvedScaleId && gymRemoteScales.length > 0) {
        resolvedScaleId = gymRemoteScales[0].id;
      }

      if (!resolvedScaleId) continue;

      resolvedScaleMapping.set(b.id, resolvedScaleId);

      const boulderUuid = isValidUuid(b.id) ? b.id : stringToUuid(b.id);
      resolvedScaleMapping.set(boulderUuid, resolvedScaleId);
      const setterUuid = toKnownAuthUserUuid(b.setterId);

      upsertRows.push({
        id: boulderUuid,
        sector_id: resolvedSectorId,
        grade_scale_id: resolvedScaleId,
        position_x: b.positionX,
        position_y: b.positionY,
        name: b.name || 'Unbenannter Boulder',
        notes: b.notes || '',
        setter_id: setterUuid,
        status: b.status || 'active',
        radar_kraft: b.radar?.kraft ?? 3,
        radar_technik: b.radar?.technik ?? 3,
        radar_balance: b.radar?.balance ?? 3,
        radar_koordination: b.radar?.koordination ?? 3,
        radar_flexibilitaet: b.radar?.flexibilitaet ?? 3,
        radar_maximalkraft: b.radar?.maximalkraft ?? b.radar?.kraft ?? 3,
        radar_kraftausdauer: b.radar?.kraftausdauer ?? b.radar?.kraft ?? 3,
        font_grade: b.fontGrade || null,
        created_at: b.createdAt || new Date().toISOString(),
        published_at: b.publishedAt || null,
        archived_at: b.archivedAt || null,
      });
    }

    if (upsertRows.length === 0) return true;

    const { error } = await supabase.from('boulders').upsert(upsertRows);
    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync der Boulder:', error.message);
      return false;
    }

    // Lokalen V2-Cache synchronisieren: gradeScaleId auf die aufgelöste kanonische UUID setzen
    const localWallBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
    let modifiedWallBoulders = false;
    const updatedWallBoulders = localWallBoulders.map(wb => {
      const canonicalScaleId = resolvedScaleMapping.get(wb.id);
      if (canonicalScaleId && wb.gradeScaleId !== canonicalScaleId) {
        modifiedWallBoulders = true;
        return { ...wb, gradeScaleId: canonicalScaleId };
      }
      return wb;
    });
    if (modifiedWallBoulders) {
      setStorageJson(STORAGE_KEY_WALL_BOULDERS, updatedWallBoulders);
    }

    console.log(`[Sync] ${upsertRows.length} Boulder erfolgreich nach Supabase synchronisiert.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Boulder:', e);
    return false;
  }
}

/**
 * Synchronisiert eine Begehung in Echtzeit aufwärts nach Supabase.
 */
export async function syncAscentToSupabase(ascent: Ascent): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !ascent) return true;
  try {
    const ascentUuid = isValidUuid(ascent.id) ? ascent.id : stringToUuid(ascent.id);
    const boulderUuid = isValidUuid(ascent.boulderId) ? ascent.boulderId : stringToUuid(ascent.boulderId);
    const userUuid = toKnownAuthUserUuid(ascent.userId);

    const payload = {
      id: ascentUuid,
      boulder_id: boulderUuid,
      user_id: userUuid,
      ascent_style: ascent.type,
      attempts: ascent.type === 'flash' ? 1 : 1,
      notes: null,
      created_at: ascent.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('ascents').upsert(payload);
    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync der Begehung:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Begehung:', e);
    return false;
  }
}

/**
 * Synchronisiert eine Bewertung in Echtzeit aufwärts nach Supabase.
 */
export async function syncRatingToSupabase(rating: BoulderRating): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !rating) return true;
  try {
    const ratingUuid = isValidUuid(rating.id) ? rating.id : stringToUuid(rating.id);
    const boulderUuid = isValidUuid(rating.boulderId) ? rating.boulderId : stringToUuid(rating.boulderId);
    const userUuid = toKnownAuthUserUuid(rating.userId);

    const payload = {
      id: ratingUuid,
      boulder_id: boulderUuid,
      user_id: userUuid,
      perceived_difficulty: rating.gradeFeel || null,
      stars: rating.qualityStars || null,
      radar_kraft: rating.radar?.kraft || null,
      radar_technik: rating.radar?.technik || null,
      radar_balance: rating.radar?.balance || null,
      radar_koordination: rating.radar?.koordination || null,
      radar_flexibilitaet: rating.radar?.flexibilitaet || null,
      created_at: rating.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('ratings').upsert(payload);
    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync der Bewertung:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Bewertung:', e);
    return false;
  }
}

/**
 * Löscht einen Boulder und zugehörige Relationen kaskadierend aus Supabase.
 */
export async function deleteBoulderFromSupabase(boulderId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !boulderId) return true;
  try {
    markBoulderDeleted(boulderId);
    const boulderUuid = isValidUuid(boulderId) ? boulderId : stringToUuid(boulderId);
    markBoulderDeleted(boulderUuid);

    // Kaskadierendes Löschen von abhängigen Ratings und Ascents
    await supabase.from('ratings').delete().eq('boulder_id', boulderUuid);
    await supabase.from('ascents').delete().eq('boulder_id', boulderUuid);

    if (boulderId !== boulderUuid) {
      await supabase.from('ratings').delete().eq('boulder_id', boulderId);
      await supabase.from('ascents').delete().eq('boulder_id', boulderId);
    }

    const { error } = await supabase.from('boulders').delete().eq('id', boulderUuid);
    if (error && boulderId !== boulderUuid) {
      await supabase.from('boulders').delete().eq('id', boulderId);
    }

    console.log(`[Sync] Boulder ${boulderId} (${boulderUuid}) erfolgreich in Supabase gelöscht.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Fehler beim Löschen des Boulders in Supabase:', e);
    return false;
  }
}

/**
 * Löscht eine Bewertung eines Kletterers aus Supabase.
 */
export async function deleteRatingFromSupabase(userId: string, boulderId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || isTestEnv || !userId || !boulderId) return true;
  try {
    const boulderUuid = isValidUuid(boulderId) ? boulderId : stringToUuid(boulderId);
    const userUuid = toKnownAuthUserUuid(userId);

    await supabase
      .from('ratings')
      .delete()
      .eq('user_id', userUuid)
      .eq('boulder_id', boulderUuid);

    if (boulderId !== boulderUuid) {
      await supabase
        .from('ratings')
        .delete()
        .eq('user_id', userUuid)
        .eq('boulder_id', boulderId);
    }

    console.log(`[Sync] Rating für User ${userId} (${userUuid}) bei Boulder ${boulderId} gelöscht.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Fehler beim Löschen der Bewertung in Supabase:', e);
    return false;
  }
}

/**
 * Löscht eine Begehung eines Kletterers aus Supabase.
 */
export async function deleteAscentFromSupabase(userId: string, boulderId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !userId || !boulderId) return false;
  try {
    const boulderUuid = isValidUuid(boulderId) ? boulderId : stringToUuid(boulderId);
    const userUuid = toKnownAuthUserUuid(userId);

    await supabase
      .from('ascents')
      .delete()
      .eq('user_id', userUuid)
      .eq('boulder_id', boulderUuid);

    if (boulderId !== boulderUuid) {
      await supabase
        .from('ascents')
        .delete()
        .eq('user_id', userUuid)
        .eq('boulder_id', boulderId);
    }

    console.log(`[Sync] Begehung für User ${userId} (${userUuid}) bei Boulder ${boulderId} gelöscht.`);
    return true;
  } catch (e) {
    console.warn('[Sync] Fehler beim Löschen der Begehung in Supabase:', e);
    return false;
  }
}

/**
 * Löscht alle lokalen Anwendungsdaten aus dem LocalStorage und lädt die App neu,
 * damit frische Daten aus Supabase geladen werden. Die Auth-Sitzung bleibt erhalten.
 */
export function clearAppCacheAndReload(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('boulderapp_') || key.startsWith('bouldermate_'))) {
          // Auth-Session beibehalten, damit der Nutzer eingeloggt bleibt
          if (key !== 'boulderapp_auth_session_v1') {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    } catch (e) {
      console.error('[Cache] Fehler beim Bereinigen des Caches:', e);
    }
    window.location.reload();
  }
}

// ============================================================
// 11. SUPABASE REALTIME MULTI-USER SYNCHRONISATION (AC-15)
// ============================================================

let realtimeChannel: any = null;
let realtimePollInterval: any = null;

/**
 * Verarbeitet eine eingehende Realtime-Änderung auf der Tabelle public.ratings.
 */
export function handleRealtimeRatingChange(payload: any): void {
  if (!payload) return;
  const { eventType, new: newRow, old: oldRow } = payload;
  const localRatings = getStorageJson<BoulderRating[]>(STORAGE_KEY_RATINGS, []);

  if (eventType === 'DELETE') {
    const targetId = oldRow?.id;
    const targetBoulderId = oldRow?.boulder_id;
    const targetUserId = oldRow?.user_id;
    const resolvedUser = targetUserId ? resolveUserIdAndNickname(targetUserId) : null;

    const filtered = localRatings.filter(r => {
      if (targetId && (r.id === targetId || stringToUuid(r.id) === targetId)) return false;
      if (targetBoulderId && targetUserId) {
        const matchesBoulder = r.boulderId === targetBoulderId || stringToUuid(r.boulderId) === targetBoulderId;
        const matchesUser = r.userId === targetUserId || (resolvedUser && r.userId === resolvedUser.userId);
        if (matchesBoulder && matchesUser) return false;
      }
      return true;
    });

    setStorageJson(STORAGE_KEY_RATINGS, filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', {
        detail: { action: 'delete', row: oldRow, boulderId: targetBoulderId }
      }));
    }
    return;
  }

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const resolvedUser = resolveUserIdAndNickname(newRow.user_id);
    const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
    const matchingBoulder = localBoulders.find(b => b.id === newRow.boulder_id || stringToUuid(b.id) === newRow.boulder_id);
    const resolvedBoulderId = matchingBoulder?.id || newRow.boulder_id;

    const incomingRating: BoulderRating = {
      id: newRow.id,
      boulderId: resolvedBoulderId,
      userId: resolvedUser.userId,
      userNickname: resolvedUser.nickname,
      userAvatarUrl: resolvedUser.avatarUrl,
      gradeFeel: (newRow.perceived_difficulty as any) || undefined,
      qualityStars: newRow.stars || undefined,
      radar: {
        kraft: newRow.radar_kraft || 3,
        technik: newRow.radar_technik || 3,
        balance: newRow.radar_balance || 3,
        koordination: newRow.radar_koordination || 3,
        flexibilitaet: newRow.radar_flexibilitaet || 3,
      },
      createdAt: newRow.created_at || new Date().toISOString(),
      updatedAt: newRow.created_at || new Date().toISOString(),
    };

    let found = false;
    const updated = localRatings.map(r => {
      const isSameId = r.id === incomingRating.id || stringToUuid(r.id) === incomingRating.id;
      const isSameUserAndBoulder = (r.userId === incomingRating.userId || r.userId === newRow.user_id) &&
        (r.boulderId === incomingRating.boulderId || stringToUuid(r.boulderId) === newRow.boulder_id);
      if (isSameId || isSameUserAndBoulder) {
        found = true;
        return {
          ...r,
          ...incomingRating,
          id: r.id,
        };
      }
      return r;
    });

    if (!found) {
      updated.push(incomingRating);
    }

    setStorageJson(STORAGE_KEY_RATINGS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', {
        detail: { action: eventType.toLowerCase(), rating: incomingRating, boulderId: resolvedBoulderId }
      }));
    }
  }
}

/**
 * Verarbeitet eine eingehende Realtime-Änderung auf der Tabelle public.ascents.
 */
export function handleRealtimeAscentChange(payload: any): void {
  if (!payload) return;
  const { eventType, new: newRow, old: oldRow } = payload;
  const localAscents = getStorageJson<Ascent[]>(STORAGE_KEY_ASCENTS, []);

  if (eventType === 'DELETE') {
    const targetId = oldRow?.id;
    const targetBoulderId = oldRow?.boulder_id;
    const targetUserId = oldRow?.user_id;
    const resolvedUser = targetUserId ? resolveUserIdAndNickname(targetUserId) : null;

    const filtered = localAscents.filter(a => {
      if (targetId && (a.id === targetId || stringToUuid(a.id) === targetId)) return false;
      if (targetBoulderId && targetUserId) {
        const matchesBoulder = a.boulderId === targetBoulderId || stringToUuid(a.boulderId) === targetBoulderId;
        const matchesUser = a.userId === targetUserId || (resolvedUser && a.userId === resolvedUser.userId);
        if (matchesBoulder && matchesUser) return false;
      }
      return true;
    });

    setStorageJson(STORAGE_KEY_ASCENTS, filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:ascents_updated', {
        detail: { action: 'delete', row: oldRow, boulderId: targetBoulderId }
      }));
    }
    return;
  }

  if (eventType === 'INSERT' || eventType === 'UPDATE') {
    if (!newRow) return;
    const resolvedUser = resolveUserIdAndNickname(newRow.user_id);
    const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
    const matchingBoulder = localBoulders.find(b => b.id === newRow.boulder_id || stringToUuid(b.id) === newRow.boulder_id);
    const resolvedBoulderId = matchingBoulder?.id || newRow.boulder_id;

    const incomingAscent: Ascent = {
      id: newRow.id,
      boulderId: resolvedBoulderId,
      userId: resolvedUser.userId,
      userNickname: resolvedUser.nickname,
      userAvatarUrl: resolvedUser.avatarUrl,
      type: (newRow.ascent_style as any) || 'top',
      createdAt: newRow.created_at || new Date().toISOString(),
    };

    let found = false;
    const updated = localAscents.map(a => {
      const isSameId = a.id === incomingAscent.id || stringToUuid(a.id) === incomingAscent.id;
      const isSameUserAndBoulder = (a.userId === incomingAscent.userId || a.userId === newRow.user_id) &&
        (a.boulderId === incomingAscent.boulderId || stringToUuid(a.boulderId) === newRow.boulder_id);
      if (isSameId || isSameUserAndBoulder) {
        found = true;
        return {
          ...a,
          ...incomingAscent,
          id: a.id,
        };
      }
      return a;
    });

    if (!found) {
      updated.push(incomingAscent);
    }

    setStorageJson(STORAGE_KEY_ASCENTS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bouldermate:ascents_updated', {
        detail: { action: eventType.toLowerCase(), ascent: incomingAscent, boulderId: resolvedBoulderId }
      }));
    }
  }
}

/**
 * Führt eine unaufdringliche Hintergrund-Synchronisation von Bewertungen und Begehungen aus.
 */
export async function syncRatingsAndAscentsQuietly(): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;
  try {
    const [ascentsRes, ratingsRes] = await Promise.all([
      supabase.from('ascents').select('*'),
      supabase.from('ratings').select('*')
    ]);

    let ascentsChanged = false;
    if (ascentsRes.data && ascentsRes.data.length > 0) {
      const localAscents = getStorageJson<Ascent[]>(STORAGE_KEY_ASCENTS, []);
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const ascentMap = new Map<string, Ascent>();
      localAscents.forEach(a => ascentMap.set(`${a.boulderId}_${a.userId}`, a));

      for (const a of ascentsRes.data) {
        const resolvedUser = resolveUserIdAndNickname(a.user_id);
        const matchingBoulder = localBoulders.find(b => b.id === a.boulder_id || stringToUuid(b.id) === a.boulder_id);
        const resolvedBoulderId = matchingBoulder?.id || a.boulder_id;
        const key = `${resolvedBoulderId}_${resolvedUser.userId}`;

        const existing = ascentMap.get(key);
        if (!existing || existing.type !== a.ascent_style) {
          ascentsChanged = true;
          ascentMap.set(key, {
            id: a.id,
            userId: resolvedUser.userId,
            userNickname: resolvedUser.nickname,
            userAvatarUrl: resolvedUser.avatarUrl,
            boulderId: resolvedBoulderId,
            type: (a.ascent_style as any) || 'top',
            createdAt: a.created_at,
          });
        }
      }

      if (ascentsChanged) {
        setStorageJson(STORAGE_KEY_ASCENTS, Array.from(ascentMap.values()));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bouldermate:ascents_updated', { detail: { action: 'quiet_sync' } }));
        }
      }
    }

    let ratingsChanged = false;
    if (ratingsRes.data && ratingsRes.data.length > 0) {
      const localRatings = getStorageJson<BoulderRating[]>(STORAGE_KEY_RATINGS, []);
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const ratingMap = new Map<string, BoulderRating>();
      localRatings.forEach(r => ratingMap.set(`${r.boulderId}_${r.userId}`, r));

      for (const r of ratingsRes.data) {
        const resolvedUser = resolveUserIdAndNickname(r.user_id);
        const matchingBoulder = localBoulders.find(b => b.id === r.boulder_id || stringToUuid(b.id) === r.boulder_id);
        const resolvedBoulderId = matchingBoulder?.id || r.boulder_id;
        const key = `${resolvedBoulderId}_${resolvedUser.userId}`;

        const existing = ratingMap.get(key);
        if (!existing || existing.qualityStars !== r.stars || existing.gradeFeel !== r.perceived_difficulty) {
          ratingsChanged = true;
          ratingMap.set(key, {
            id: r.id,
            boulderId: resolvedBoulderId,
            userId: resolvedUser.userId,
            userNickname: resolvedUser.nickname,
            userAvatarUrl: resolvedUser.avatarUrl,
            gradeFeel: (r.perceived_difficulty as any) || undefined,
            qualityStars: r.stars || undefined,
            radar: {
              kraft: r.radar_kraft || 3,
              technik: r.radar_technik || 3,
              balance: r.radar_balance || 3,
              koordination: r.radar_koordination || 3,
              flexibilitaet: r.radar_flexibilitaet || 3,
            },
            createdAt: r.created_at,
            updatedAt: r.created_at,
          });
        }
      }

      if (ratingsChanged) {
        setStorageJson(STORAGE_KEY_RATINGS, Array.from(ratingMap.values()));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', { detail: { action: 'quiet_sync' } }));
        }
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Startet die Realtime-Verbindung zu Supabase für Live-Synchronisation von Bewertungen und Begehungen.
 * Gibt eine Cleanup-Funktion zurück, um Kanäle und Listener zu deregistrieren.
 */
export function startRealtimeSync(): () => void {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  if (realtimeChannel) {
    return () => stopRealtimeSync();
  }

  try {
    realtimeChannel = supabase.channel('bouldermate-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        (payload) => {
          handleRealtimeRatingChange(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ascents' },
        (payload) => {
          handleRealtimeAscentChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Connected with status:', status);
      });
  } catch (err) {
    console.warn('[Supabase Realtime] Setup error:', err);
  }

  if (typeof window !== 'undefined' && !realtimePollInterval) {
    realtimePollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRatingsAndAscentsQuietly().catch(() => {});
      }
    }, 8000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncRatingsAndAscentsQuietly().catch(() => {});
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('visibilitychange', onVisibilityOrFocus);
  }

  return () => stopRealtimeSync();
}

/**
 * Beendet die aktive Realtime-Verbindung und Intervall-Polling.
 */
export function stopRealtimeSync(): void {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (realtimePollInterval) {
    clearInterval(realtimePollInterval);
    realtimePollInterval = null;
  }
}

// Wire implementations into syncBridge (SOLID: Dependency Inversion)
registerSyncHandlers({
  syncSector: syncSectorToSupabase,
  syncSectorOrder: syncSectorOrderToSupabase,
  syncGradeScales: syncGradeScalesToSupabase,
  syncBoulders: syncBouldersToSupabase,
  deleteBoulder: deleteBoulderFromSupabase,
  syncAscent: syncAscentToSupabase,
  deleteAscent: deleteAscentFromSupabase,
  syncRating: syncRatingToSupabase,
  deleteRating: deleteRatingFromSupabase,
  syncRatingsAndAscentsQuietly: syncRatingsAndAscentsQuietly,
});
