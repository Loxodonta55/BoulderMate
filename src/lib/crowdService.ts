import { supabase, isSupabaseConfigured } from './supabase';
import { isTestEnv } from './authService';
import * as gymStorage from './gymStorage';
import { getSectors, getWallBoulders } from './batchBoulderService';
import { getAscents } from './ratingAndAscentService';
import { toRemoteGymId } from './treffService';

/**
 * SPEC-041 · Wie voll ist die Halle? Drei Stufen, nie eine Zahl.
 * Quelle 1: Meldung der Halle (Admin), gilt 90 Minuten.
 * Quelle 2: verschiedene Personen mit Log in dieser Halle in den letzten 60 Minuten (+ Treff «Jetzt da»).
 */
export type CrowdLevel = 'ruhig' | 'normal' | 'voll';

export const CROWD_LABEL: Record<CrowdLevel, string> = {
  ruhig: 'Ruhig',
  normal: 'Normal',
  voll: 'Viel los',
};

export const CROWD_ACTIVITY_WINDOW_MIN = 60;
export const CROWD_REPORT_VALID_MIN = 90;
export const CROWD_NORMAL_FROM = 5;
export const CROWD_FULL_FROM = 15;

export interface CrowdInfo {
  level: CrowdLevel;
  source: 'halle' | 'app';
  /** Nur bei Meldung der Halle: vor wie vielen Minuten */
  minutesAgo?: number;
}

export function levelFromCount(count: number): CrowdLevel | null {
  if (count <= 0) return null;
  if (count >= CROWD_FULL_FROM) return 'voll';
  if (count >= CROWD_NORMAL_FROM) return 'normal';
  return 'ruhig';
}

/** Verschiedene Personen mit Log in dieser Halle in den letzten 60 Minuten plus zusätzliche IDs (Treff «Jetzt da»). */
export function countActiveClimbers(gymId: string, now: Date = new Date(), extraUserIds: string[] = []): number {
  const sectorIds = new Set(getSectors(gymId).map(s => s.id));
  const boulderIds = new Set(getWallBoulders().filter(b => sectorIds.has(b.sectorId)).map(b => b.id));
  const since = now.getTime() - CROWD_ACTIVITY_WINDOW_MIN * 60000;
  const people = new Set<string>(extraUserIds);
  for (const a of getAscents()) {
    if (!boulderIds.has(a.boulderId)) continue;
    const t = new Date(a.createdAt).getTime();
    // kleine Uhr-Abweichungen zwischen Geräten zulassen (bis 5 Min in der Zukunft)
    if (t >= since && t <= now.getTime() + 5 * 60000) people.add(a.userId);
  }
  return people.size;
}

/** Gültige Meldung der Halle (≤ 90 Min alt) oder null. */
export function gymReport(gymId: string, now: Date = new Date()): CrowdInfo | null {
  const gym = gymStorage.getGyms().find(g => g.id === gymId);
  if (!gym?.crowd_level || !gym.crowd_updated_at) return null;
  const ageMin = Math.floor((now.getTime() - new Date(gym.crowd_updated_at).getTime()) / 60000);
  if (ageMin < 0 || ageMin >= CROWD_REPORT_VALID_MIN) return null;
  return { level: gym.crowd_level, source: 'halle', minutesAgo: ageMin };
}

/** AC-1/AC-2/AC-5: Meldung der Halle hat Vorrang; ohne Daten null. */
export function getCrowdInfo(gymId: string, now: Date = new Date(), extraUserIds: string[] = []): CrowdInfo | null {
  const report = gymReport(gymId, now);
  if (report) return report;
  const level = levelFromCount(countActiveClimbers(gymId, now, extraUserIds));
  return level ? { level, source: 'app' } : null;
}

/** «laut Halle, vor 20 Min» bzw. «laut BoulderMate-Nutzern» (F4). */
export function crowdSourceText(info: CrowdInfo): string {
  if (info.source === 'app') return 'laut BoulderMate-Nutzern';
  const m = info.minutesAgo ?? 0;
  return m < 1 ? 'laut Halle, gerade eben' : `laut Halle, vor ${m} Min`;
}

export const CROWD_CHANGED_EVENT = 'bouldermate:crowd_updated';

/** Admin der Halle meldet die Auslastung (oder null = Meldung löschen). */
export function setGymCrowdLevel(gymId: string, userId: string, level: CrowdLevel | null, now: Date = new Date()): boolean {
  if (!gymStorage.isGymAdmin(gymId, userId)) return false;
  const gyms = gymStorage.getGyms();
  const idx = gyms.findIndex(g => g.id === gymId);
  if (idx === -1) return false;
  const next = [...gyms];
  const stamp = now.toISOString();
  next[idx] = { ...gyms[idx], crowd_level: level || undefined, crowd_updated_at: level ? stamp : undefined };
  gymStorage.saveGyms(next);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CROWD_CHANGED_EVENT));
  if (supabase && isSupabaseConfigured && !isTestEnv) {
    supabase
      .from('gyms')
      .update({ crowd_level: level, crowd_updated_at: level ? stamp : null })
      .eq('id', toRemoteGymId(gymId))
      .then(
        ({ error }) => {
          if (error) console.warn('[Auslastung] Meldung nicht gespeichert:', error.message);
        },
        () => {}
      );
  }
  return true;
}
