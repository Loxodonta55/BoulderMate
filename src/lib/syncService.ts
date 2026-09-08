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
import { Sector, WallBoulder } from '../types/boulder';
import { GradeScale } from '../types/gym';
import * as gymStorage from './gymStorage';
import { getStorageJson, setStorageJson } from './storageUtils';

const STORAGE_KEY_SECTORS = 'boulderapp_sectors_v2';
const STORAGE_KEY_WALL_BOULDERS = 'boulderapp_wall_boulders_v2';

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
      // V1 Cache (gymStorage)
      const localV1Scales = gymStorage.getGradeScales();
      const v1Map = new Map(localV1Scales.map(s => [s.id, s]));

      // V2 Cache (batchBoulderService)
      const localV2Scales = getStorageJson<any[]>('boulderapp_grade_scales_v2', []);
      const v2Map = new Map(localV2Scales.map(s => [s.id, s]));

      for (const sc of dbScales) {
        const targetGymId = (sc.gym_id && sc.gym_id.includes('f2b11564'))
          ? 'gym-6a-plus'
          : (sc.gym_id && sc.gym_id.includes('814696b2'))
          ? 'gym-minimum-zh'
          : sc.gym_id;

        // V1: Deduplizierung nach ID oder semantisch nach (gymId, color_name)
        let foundV1Key: string | null = null;
        for (const [k, localSc] of v1Map.entries()) {
          const gymMatches = localSc.gym_id === targetGymId ||
            (targetGymId === 'gym-6a-plus' && (localSc.gym_id.includes('6a') || localSc.gym_id.includes('f2b11564'))) ||
            (targetGymId === 'gym-minimum-zh' && (localSc.gym_id.includes('minimum') || localSc.gym_id.includes('814696b2')));
          if (k === sc.id || (gymMatches && localSc.color_name.trim().toLowerCase() === sc.color_name.trim().toLowerCase())) {
            foundV1Key = k;
            break;
          }
        }

        const v1Id = foundV1Key || sc.id;
        v1Map.set(v1Id, {
          id: v1Id,
          gym_id: targetGymId,
          color_name: sc.color_name,
          color_hex: sc.color_hex,
          difficulty_label: sc.difficulty_label,
          font_range_min: sc.font_range_min || '3',
          font_range_max: sc.font_range_max || '4',
          sort_order: sc.sort_order || 1,
          created_at: sc.created_at || new Date().toISOString(),
        });

        // V2: Deduplizierung nach ID oder semantisch nach (gymId, colorName)
        let foundV2Key: string | null = null;
        for (const [k, localSc] of v2Map.entries()) {
          const gymMatches = localSc.gymId === targetGymId ||
            (targetGymId === 'gym-6a-plus' && (localSc.gymId?.includes('6a') || localSc.gymId?.includes('f2b11564'))) ||
            (targetGymId === 'gym-minimum-zh' && (localSc.gymId?.includes('minimum') || localSc.gymId?.includes('814696b2')));
          if (k === sc.id || (gymMatches && localSc.colorName.trim().toLowerCase() === sc.color_name.trim().toLowerCase())) {
            foundV2Key = k;
            break;
          }
        }

        const v2Id = foundV2Key || sc.id;
        v2Map.set(v2Id, {
          id: v2Id,
          gymId: targetGymId,
          colorName: sc.color_name,
          colorHex: sc.color_hex,
          difficultyLabel: sc.difficulty_label,
          fontRangeMin: sc.font_range_min || '3',
          fontRangeMax: sc.font_range_max || '4',
          sortOrder: sc.sort_order || 1,
        });
      }

      gymStorage.saveGradeScales(Array.from(v1Map.values()));
      setStorageJson('boulderapp_grade_scales_v2', Array.from(v2Map.values()));
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
        (s.id && s.id.includes('-') && s.id.length > 30 ? s.id : undefined);

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

