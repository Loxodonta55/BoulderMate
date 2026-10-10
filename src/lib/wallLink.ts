import { Sector } from '../types/boulder';
import { getStorageJson, setStorageJson, removeStorageItem, stringToUuid } from './storageUtils';

/**
 * SPEC-029 · QR-Codes an der Wand.
 * Link `https://bouldermate.ch/?wand=<Sektor-UUID>` öffnet direkt die Wand eines Sektors.
 */

export const WALL_LINK_PARAM = 'wand';
export const WALL_LINK_BASE_URL = 'https://bouldermate.ch/';
export const PENDING_WALL_LINK_KEY = 'bouldermate_pending_wall_link_v1';
/** F4: Ein gemerktes Ziel verfällt nach 30 Minuten */
export const PENDING_WALL_LINK_MAX_AGE_MS = 30 * 60 * 1000;

interface PendingWallLink {
  sectorId: string;
  savedAt: number;
}

/** F2: Link mit der Supabase-UUID, damit er auf jedem Gerät funktioniert */
export function buildWallLink(sectorId: string, baseUrl: string = WALL_LINK_BASE_URL): string {
  const url = new URL(baseUrl);
  url.searchParams.set(WALL_LINK_PARAM, stringToUuid(sectorId));
  return url.toString();
}

/** Kurzform für den Aufkleber: «bouldermate.ch/?wand=…» */
export function displayWallLink(sectorId: string, baseUrl: string = WALL_LINK_BASE_URL): string {
  return buildWallLink(sectorId, baseUrl).replace(/^https?:\/\//, '');
}

export function readWallLinkFromUrl(href?: string): string | null {
  const source = href ?? (typeof window !== 'undefined' ? window.location.href : '');
  if (!source) return null;
  try {
    const value = new URL(source).searchParams.get(WALL_LINK_PARAM);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/** AC-1: `?wand=` aus der Adresszeile entfernen, damit ein Neuladen nicht erneut springt */
export function clearWallLinkFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(WALL_LINK_PARAM)) return;
    url.searchParams.delete(WALL_LINK_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // ignore
  }
}

export function savePendingWallLink(sectorId: string, now: number = Date.now()): void {
  setStorageJson<PendingWallLink>(PENDING_WALL_LINK_KEY, { sectorId, savedAt: now });
}

export function getPendingWallLink(now: number = Date.now()): string | null {
  const pending = getStorageJson<PendingWallLink | null>(PENDING_WALL_LINK_KEY, null);
  if (!pending?.sectorId || typeof pending.savedAt !== 'number') return null;
  if (now - pending.savedAt > PENDING_WALL_LINK_MAX_AGE_MS) {
    clearPendingWallLink();
    return null;
  }
  return pending.sectorId;
}

export function clearPendingWallLink(): void {
  removeStorageItem(PENDING_WALL_LINK_KEY);
}

/** AC-2: Sektor über lokale ID oder Supabase-UUID finden */
export function resolveWallLinkSector<T extends Pick<Sector, 'id'>>(linkId: string, sectors: T[]): T | null {
  const wanted = linkId.toLowerCase();
  return (
    sectors.find(s => s.id.toLowerCase() === wanted) ||
    sectors.find(s => stringToUuid(s.id).toLowerCase() === wanted) ||
    null
  );
}
