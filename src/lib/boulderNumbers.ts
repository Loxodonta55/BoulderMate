import { Sector, WallBoulder } from '../types/boulder';
import { getSectors, getWallBoulders } from './batchBoulderService';

/**
 * SPEC-032 F7 · Nummer pro Wand.
 *
 * Nummeriert wird nach der Schraub-Reihenfolge (Veröffentlichung, dann Anlage).
 * Abgeschraubte Boulder behalten ihren Platz, damit die Nummern der anderen gleich
 * bleiben («die 7» bleibt die 7). Nach dem Umschrauben (rebuiltAt) beginnt die Wand
 * wieder bei 1.
 */
function stamp(b: WallBoulder): number {
  const t = Date.parse(b.publishedAt || b.createdAt || '');
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

export function computeBoulderNumbers(sectorBoulders: WallBoulder[], rebuiltAt?: string): Map<string, number> {
  const since = rebuiltAt ? Date.parse(rebuiltAt) - 60 * 1000 : Number.NEGATIVE_INFINITY;
  const active = sectorBoulders.filter(b => b.status === 'active');
  if (active.length === 0) return new Map();
  const oldestActive = Math.min(...active.map(stamp));
  const candidates = sectorBoulders.filter(b => {
    if (b.status === 'active') return true;
    if (b.status !== 'archived') return false;
    // Abgeschraubt: Platz halten, wenn er gleichzeitig mit der heutigen Wand hing
    // (nach dem letzten Umbau geschraubt und erst nach dem ältesten aktiven abgeschraubt).
    const archived = Date.parse(b.archivedAt || '');
    return stamp(b) >= since && Number.isFinite(archived) && archived >= oldestActive;
  });
  const sorted = [...candidates].sort((a, b) => {
    const d = stamp(a) - stamp(b);
    if (d !== 0) return d;
    const c = (a.createdAt || '').localeCompare(b.createdAt || '');
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
  // Aktive Boulder, die vor dem Umbau geschraubt wurden (ältere Wandteile), zählen trotzdem mit.
  const map = new Map<string, number>();
  sorted.forEach((b, i) => map.set(b.id, i + 1));
  return map;
}

/** Nummer eines Boulders aus dem Speicher (für «Ich», Sheet, Export). */
export function getBoulderNumber(boulder: Pick<WallBoulder, 'id' | 'sectorId'>, sectors?: Sector[]): number | undefined {
  const sector = (sectors || getSectors()).find(s => s.id === boulder.sectorId);
  const map = computeBoulderNumbers(getWallBoulders(boulder.sectorId), sector?.rebuiltAt);
  return map.get(boulder.id);
}

/** Lesbare Schriftfarbe auf einer Grifffarbe (WCAG-Helligkeit). */
export function readableTextOn(hex?: string): '#FFFFFF' | '#121110' {
  const h = (hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return '#FFFFFF';
  const lin = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  // Kontrast gegen Weiss vs. gegen Fast-Schwarz
  const vsWhite = 1.05 / (L + 0.05);
  const vsDark = (L + 0.05) / 0.0555;
  return vsWhite >= vsDark ? '#FFFFFF' : '#121110';
}
