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
      const localSectors = getStorageJson<Sector[]>(STORAGE_KEY_SECTORS, []);
      const sectorMap = new Map(localSectors.map(s => [s.id, s]));

      for (const s of dbSectors) {
        // Check if exists by id or gymId + name
        let foundKey: string | null = null;
        for (const [k, localSec] of sectorMap.entries()) {
          if (k === s.id || (localSec.name === s.name && (localSec.gymId === s.gym_id || localSec.gymId.includes('6a')))) {
            foundKey = k;
            break;
          }
        }

        const resolvedUrl = s.wall_photo_url || '/images/walls/overhang.jpg';

        if (foundKey) {
          const existing = sectorMap.get(foundKey)!;
          sectorMap.set(foundKey, {
            ...existing,
            name: s.name,
            wallPhotoUrl: resolvedUrl,
            sortOrder: s.sort_order || existing.sortOrder,
          });
        } else {
          // Neues Sektor-Objekt non-destruktiv hinzufügen
          const targetGymId = s.gym_id.includes('f2b11564') ? 'gym-6a-plus' : s.gym_id;
          sectorMap.set(s.id, {
            id: s.id,
            gymId: targetGymId,
            name: s.name,
            wallPhotoUrl: resolvedUrl,
            sortOrder: s.sort_order || 1,
            createdAt: s.created_at,
          });
        }
      }

      setStorageJson(STORAGE_KEY_SECTORS, Array.from(sectorMap.values()));
      currentSyncStatus.syncedSectors = sectorMap.size;
    }

    // 3. Boulder laden
    const { data: dbBoulders, error: boulderError } = await supabase
      .from('boulders')
      .select('*');

    if (!boulderError && dbBoulders && dbBoulders.length > 0) {
      const localBoulders = getStorageJson<WallBoulder[]>(STORAGE_KEY_WALL_BOULDERS, []);
      const boulderMap = new Map(localBoulders.map(b => [b.id, b]));

      for (const b of dbBoulders) {
        if (!boulderMap.has(b.id)) {
          boulderMap.set(b.id, {
            id: b.id,
            sectorId: b.sector_id,
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
          });
        }
      }

      setStorageJson(STORAGE_KEY_WALL_BOULDERS, Array.from(boulderMap.values()));
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
