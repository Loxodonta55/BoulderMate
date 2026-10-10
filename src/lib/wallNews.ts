import { Ascent, Sector, WallBoulder } from '../types/boulder';
import { getStorageJson, setStorageJson } from './storageUtils';
import { isSectorInRebuild } from './batchBoulderService';

/**
 * SPEC-031 · «Neu seit deinem letzten Besuch» und «Letzte Chance» vor dem Umschrauben.
 * Besuche werden nur auf dem Gerät gespeichert (localStorage), pro Person und Halle.
 */

export const WALL_VISITS_KEY = 'bouldermate_wall_visits_v1';
/** F3: Ein neuer Besuch beginnt nach mehr als 4 Stunden Pause */
export const NEW_VISIT_GAP_MS = 4 * 60 * 60 * 1000;
/** F6: «Letzte Chance» im Hinweis-Streifen, wenn der Umbau in höchstens 7 Tagen ist */
export const LAST_CHANCE_DAYS = 7;

interface VisitRecord {
  /** Letztes Öffnen der Wand */
  lastSeenAt: number;
  /** Beginn des laufenden Besuchs */
  visitStartedAt: number;
  /** Ende des vorherigen Besuchs (Vergleichspunkt für «neu»); null beim ersten Besuch */
  previousVisitAt: number | null;
}

type VisitStore = Record<string, VisitRecord>;

function visitKey(userId: string, gymId: string): string {
  return `${userId}::${gymId}`;
}

/**
 * Wand geöffnet: Besuch fortsetzen oder neuen beginnen.
 * Liefert den Zeitpunkt, ab dem Boulder als «neu seit deinem letzten Besuch» zählen (null beim ersten Besuch).
 */
export function registerWallVisit(userId: string, gymId: string, now: number = Date.now()): number | null {
  const store = getStorageJson<VisitStore>(WALL_VISITS_KEY, {});
  const key = visitKey(userId, gymId);
  const existing = store[key];
  let record: VisitRecord;
  if (!existing) {
    record = { lastSeenAt: now, visitStartedAt: now, previousVisitAt: null };
  } else if (now - existing.lastSeenAt > NEW_VISIT_GAP_MS) {
    record = { lastSeenAt: now, visitStartedAt: now, previousVisitAt: existing.lastSeenAt };
  } else {
    record = { ...existing, lastSeenAt: now };
  }
  store[key] = record;
  setStorageJson(WALL_VISITS_KEY, store);
  return record.previousVisitAt;
}

/** F4: Hinweis für diesen Besuch weggeklickt */
const DISMISSED_KEY = 'bouldermate_wall_news_dismissed_v1';

export function isWallNewsDismissed(userId: string, gymId: string): boolean {
  const store = getStorageJson<VisitStore>(WALL_VISITS_KEY, {});
  const record = store[visitKey(userId, gymId)];
  if (!record) return false;
  const dismissed = getStorageJson<Record<string, number>>(DISMISSED_KEY, {});
  return dismissed[visitKey(userId, gymId)] === record.visitStartedAt;
}

export function dismissWallNews(userId: string, gymId: string): void {
  const store = getStorageJson<VisitStore>(WALL_VISITS_KEY, {});
  const record = store[visitKey(userId, gymId)];
  if (!record) return;
  const dismissed = getStorageJson<Record<string, number>>(DISMISSED_KEY, {});
  dismissed[visitKey(userId, gymId)] = record.visitStartedAt;
  setStorageJson(DISMISSED_KEY, dismissed);
}

function publishedTime(b: WallBoulder): number {
  return Date.parse(b.publishedAt || '');
}

/** F2: Aktive Boulder, die nach `since` veröffentlicht wurden */
export function newBouldersSince(boulders: WallBoulder[], since: number | null): WallBoulder[] {
  if (since === null) return [];
  return boulders.filter(b => b.status === 'active' && publishedTime(b) > since);
}

/** AC-3: «n neu» pro Sektor */
export function newCountsBySector(boulders: WallBoulder[], since: number | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const b of newBouldersSince(boulders, since)) {
    counts.set(b.sectorId, (counts.get(b.sectorId) || 0) + 1);
  }
  return counts;
}

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** F7: Ankündigung zählt nur bis einschließlich zum Datum */
export function isRebuildAnnounced(sector?: Pick<Sector, 'rebuildPlannedFor'> | null, now: Date = new Date()): boolean {
  const planned = sector?.rebuildPlannedFor;
  if (!planned || !/^\d{4}-\d{2}-\d{2}$/.test(planned)) return false;
  return planned >= todayKey(now);
}

/** Tage bis zum Umbau (0 = heute) */
export function daysUntil(date: string, now: Date = new Date()): number {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** «Mo 13.10.» */
export function formatPlannedDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

/** «Mo» (für den Hinweis-Streifen) */
export function formatPlannedWeekday(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

/** Offene Projekte des Kletterers an einer Wand */
export function openProjectCount(
  sectorBoulders: WallBoulder[],
  getUserAscent: (boulderId: string) => Ascent | null | undefined
): number {
  return sectorBoulders.filter(b => b.status === 'active' && getUserAscent(b.id)?.type === 'project').length;
}

export interface LastChanceEntry {
  sector: Sector;
  plannedFor: string;
  openProjects: number;
}

/** AC-7: Wände, die in ≤ 7 Tagen abgeschraubt werden und an denen der Kletterer offene Projekte hat */
export function lastChanceSectors(
  sectors: Sector[],
  boulders: WallBoulder[],
  getUserAscent: (boulderId: string) => Ascent | null | undefined,
  now: Date = new Date()
): LastChanceEntry[] {
  return sectors
    .filter(s => isRebuildAnnounced(s, now) && !isSectorInRebuild(s) && daysUntil(s.rebuildPlannedFor!, now) <= LAST_CHANCE_DAYS)
    .map(s => ({
      sector: s,
      plannedFor: s.rebuildPlannedFor!,
      openProjects: openProjectCount(boulders.filter(b => b.sectorId === s.id), getUserAscent),
    }))
    .filter(e => e.openProjects > 0)
    .sort((a, b) => a.plannedFor.localeCompare(b.plannedFor));
}
