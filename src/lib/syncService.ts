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
import { getStorageJson, setStorageJson, isBoulderDeleted, markBoulderDeleted } from './storageUtils';

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

      setStorageJson(STORAGE_KEY_SECTORS, Array.from(sectorMap.values()));
      gymStorage.saveSectors(Array.from(v1SecMap.values()));
      currentSyncStatus.syncedSectors = sectorMap.size;
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

      for (const b of dbBoulders) {
        if (isBoulderDeleted(b.id)) {
          continue;
        }

        let resolvedSectorId = b.sector_id;
        const matchingSec = dbSectors?.find(ds => ds.id === b.sector_id);
        if (matchingSec && sectorIdByName.has(matchingSec.name.trim().toLowerCase())) {
          resolvedSectorId = sectorIdByName.get(matchingSec.name.trim().toLowerCase())!;
        }

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

        // Deduplizierung: Falls Boulder mit gleichem Namen im Sektor existiert -> updaten
        let foundBoulderId: string | null = null;
        for (const [id, eb] of boulderMap.entries()) {
          if (id === b.id || (eb.name && b.name && eb.name.trim().toLowerCase() === b.name.trim().toLowerCase() && eb.sectorId === resolvedSectorId)) {
            foundBoulderId = id;
            break;
          }
        }

        const bId = foundBoulderId || b.id;
        boulderMap.set(bId, { ...boulderObj, id: bId });

        v1BoulderMap.set(bId, {
          id: bId,
          sector_id: resolvedSectorId,
          grade_scale_id: b.grade_scale_id,
          position_x: b.position_x,
          position_y: b.position_y,
          status: b.status || 'active',
          name: b.name,
        });
      }

      setStorageJson(STORAGE_KEY_WALL_BOULDERS, Array.from(boulderMap.values()));
      gymStorage.saveBoulders(Array.from(v1BoulderMap.values()));
      currentSyncStatus.syncedBoulders = boulderMap.size;
    }

    // 4. Ascents laden & mergen (non-destructive)
    const { data: dbAscents } = await supabase.from('ascents').select('*');
    if (dbAscents && dbAscents.length > 0) {
      const localAscents = getStorageJson<Ascent[]>(STORAGE_KEY_ASCENTS, []);
      const ascentMap = new Map(localAscents.map(a => [a.id, a]));
      for (const a of dbAscents) {
        if (!ascentMap.has(a.id)) {
          ascentMap.set(a.id, {
            id: a.id,
            userId: a.user_id,
            userNickname: 'Kletterer',
            boulderId: a.boulder_id,
            type: (a.ascent_style as any) || 'top',
            createdAt: a.created_at,
          });
        }
      }
      setStorageJson(STORAGE_KEY_ASCENTS, Array.from(ascentMap.values()));
    }

    // 5. Ratings laden & mergen (non-destructive)
    const { data: dbRatings } = await supabase.from('ratings').select('*');
    if (dbRatings && dbRatings.length > 0) {
      const localRatings = getStorageJson<BoulderRating[]>(STORAGE_KEY_RATINGS, []);
      const ratingMap = new Map(localRatings.map(r => [r.id, r]));
      for (const r of dbRatings) {
        if (!ratingMap.has(r.id)) {
          ratingMap.set(r.id, {
            id: r.id,
            boulderId: r.boulder_id,
            userId: r.user_id,
            userNickname: 'Kletterer',
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
      setStorageJson(STORAGE_KEY_RATINGS, Array.from(ratingMap.values()));
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
  if (!supabase || !isSupabaseConfigured) return false;

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
        remoteByName.set(r.color_name.trim().toLowerCase(), r.id);
      }
    }

    const upsertPayload = scales.map((s, idx) => {
      // Wenn es bereits eine passende UUID in Supabase gibt, diese wiederverwenden
      const remoteId = remoteByName.get(s.color_name.trim().toLowerCase()) ||
        (s.id && s.id.includes('-') && s.id.length > 30 ? s.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined));

      const item: any = {
        gym_id: supabaseGymId,
        color_name: s.color_name.trim(),
        color_hex: s.color_hex.trim(),
        difficulty_label: s.difficulty_label.trim(),
        font_range_min: s.font_range_min.trim(),
        font_range_max: s.font_range_max.trim(),
        sort_order: s.sort_order !== undefined ? s.sort_order : idx + 1,
      };
      if (remoteId) {
        item.id = remoteId;
      }
      return item;
    });

    const { error } = await supabase
      .from('grade_scales')
      .upsert(upsertPayload);

    if (error) {
      console.warn('[Sync] Fehler beim Aufwärts-Sync der Farbskalen:', error.message);
      return false;
    }

    console.log(`[Sync] ${upsertPayload.length} Farbskalen erfolgreich nach Supabase synchronisiert.`);
    return true;
  } catch (err) {
    console.warn('[Sync] Ausnahme beim Aufwärts-Sync der Farbskalen:', err);
    return false;
  }
}

/**
 * Prüft, ob ein gegebener String eine gültige UUID v4 ist.
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Konvertiert beliebige lokale String-IDs deterministisch in eine valide UUID,
 * damit Supabase UUID-Spalten und Foreign Keys niemals scheitern.
 */
export function stringToUuid(str: string): string {
  if (isValidUuid(str)) return str;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = ((hash1 << 5) - hash1) + str.charCodeAt(i);
    hash1 |= 0;
  }
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) - hash2) + str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `00000000-${hex1.slice(0, 4)}-4000-8000-${hex1.slice(4)}${hex2}`.slice(0, 36);
}

export const KNOWN_AUTH_USER_UUIDS = new Set([
  '00000000-1d0e-4000-8000-e92d69136f33', // Boris
  '00000000-37e7-4000-8000-0743462b539d', // Admin6APlus
  '00000000-08ca-4000-8000-6e6f5bce818f', // Schrauber6aPlus
  '00000000-4553-4000-8000-3dd13fac9e0f', // HansDereinfacheKletterer
  '00000000-2ff9-4000-8000-b7902cb24230', // AdminMinimum
  '00000000-5a7c-4000-8000-7702607a9a42', // Schrauber Minimum
]);

export function toKnownAuthUserUuid(userId?: string): string {
  if (!userId) return '00000000-1d0e-4000-8000-e92d69136f33';
  if (KNOWN_AUTH_USER_UUIDS.has(userId)) return userId;
  const converted = stringToUuid(userId);
  if (KNOWN_AUTH_USER_UUIDS.has(converted)) return converted;
  return '00000000-1d0e-4000-8000-e92d69136f33';
}

/**
 * Synchronisiert einen Sektor in Echtzeit aufwärts nach Supabase.
 */
export async function syncSectorToSupabase(sector: any): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !sector) return false;
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
 * Synchronisiert neu erstellte oder geänderte Boulder in Echtzeit aufwärts nach Supabase.
 */
export async function syncBouldersToSupabase(boulders: WallBoulder[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || !boulders || boulders.length === 0) return false;
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

    for (const b of boulders) {
      // 1. Sektor auflösen
      let resolvedSectorId: string | null = null;
      if (isValidUuid(b.sectorId) && remoteSectors.some(s => s.id === b.sectorId)) {
        resolvedSectorId = b.sectorId;
      } else {
        const localSec = localSectors.find(s => s.id === b.sectorId);
        if (localSec) {
          const matchedRemote = remoteSectors.find(rs => rs.name.trim().toLowerCase() === localSec.name.trim().toLowerCase());
          if (matchedRemote) resolvedSectorId = matchedRemote.id;
        }
      }
      if (!resolvedSectorId && remoteSectors.length > 0) {
        resolvedSectorId = remoteSectors[0].id;
      }

      // 2. Farbskala auflösen
      let resolvedScaleId: string | null = null;
      if (isValidUuid(b.gradeScaleId) && remoteScales.some(s => s.id === b.gradeScaleId)) {
        resolvedScaleId = b.gradeScaleId;
      } else {
        const localSc = localScales.find(s => s.id === b.gradeScaleId);
        if (localSc) {
          const matchedScale = remoteScales.find(rs => rs.color_name.trim().toLowerCase() === localSc.color_name.trim().toLowerCase());
          if (matchedScale) resolvedScaleId = matchedScale.id;
        }
      }
      if (!resolvedScaleId && remoteScales.length > 0) {
        resolvedScaleId = remoteScales[0].id;
      }

      if (!resolvedSectorId || !resolvedScaleId) continue;

      const boulderUuid = isValidUuid(b.id) ? b.id : stringToUuid(b.id);
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
  if (!supabase || !isSupabaseConfigured || !ascent) return false;
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
  if (!supabase || !isSupabaseConfigured || !rating) return false;
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
  if (!supabase || !isSupabaseConfigured || !boulderId) return false;
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
  if (!supabase || !isSupabaseConfigured || !userId || !boulderId) return false;
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



