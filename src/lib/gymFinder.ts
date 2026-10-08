/**
 * SPEC-025: Halle suchen – reine Logik für Karte und Liste.
 * Entfernung, Suche, Sortierung, Navigations-Link und Adresssuche (Nominatim).
 */
import { Gym } from '../types/boulder';
import { getGyms, getSectors, getWallBoulders, isRecentlyNew } from './batchBoulderService';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GymFinderEntry {
  id: string;
  name: string;
  city?: string;
  address?: string;
  logoUrl?: string;
  lat?: number;
  lng?: number;
  activeBoulders: number;
  newBoulders: number;
  /** Entfernung in km, nur wenn der Standort bekannt ist */
  distanceKm?: number;
}

export function hasCoordinates(g: { lat?: number; lng?: number }): g is { lat: number; lng: number } {
  return (
    typeof g.lat === 'number' && typeof g.lng === 'number' &&
    Number.isFinite(g.lat) && Number.isFinite(g.lng) &&
    g.lat >= -90 && g.lat <= 90 && g.lng >= -180 && g.lng <= 180
  );
}

/** Luftlinie in km (Haversine) */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** «850 m», «3,2 km», «24 km» */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/** Kleinbuchstaben, ohne Akzente (Zürich → zurich), ß → ss */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .trim();
}

export function matchesGymSearch(g: { name: string; city?: string; address?: string }, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return [g.name, g.city, g.address].some(v => v && normalizeSearch(v).includes(q));
}

/** Mit Standort nach Entfernung (Hallen ohne Koordinaten ans Ende), sonst nach Name */
export function sortGymEntries<T extends GymFinderEntry>(entries: T[], userPos?: LatLng | null): T[] {
  const withDist = entries.map(e => ({
    ...e,
    distanceKm: userPos && hasCoordinates(e) ? distanceKm(userPos, e) : undefined,
  }));
  return withDist.sort((a, b) => {
    if (userPos) {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== undefined) return -1;
      if (b.distanceKm !== undefined) return 1;
    }
    return a.name.localeCompare(b.name, 'de');
  });
}

export function isAppleDevice(userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
}

/**
 * «Navigation starten»: Apple Karten auf iPhone/iPad/Mac, sonst Google Maps.
 * Ohne Koordinaten wird die Adresse als Ziel übergeben.
 */
export function buildNavigationUrl(
  gym: { name: string; lat?: number; lng?: number; address?: string; city?: string },
  apple: boolean = isAppleDevice()
): string {
  const dest = hasCoordinates(gym)
    ? `${gym.lat},${gym.lng}`
    : [gym.address, gym.city].filter(Boolean).join(', ') || gym.name;
  const enc = encodeURIComponent(dest);
  return apple
    ? `https://maps.apple.com/?daddr=${enc}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${enc}`;
}

/** Hallen mit Boulder-Zahlen für Karte und Liste */
export function getGymFinderEntries(gyms: Gym[] = getGyms()): GymFinderEntry[] {
  let boulders: ReturnType<typeof getWallBoulders> = [];
  try {
    boulders = getWallBoulders();
  } catch {
    boulders = [];
  }
  return gyms.map(g => {
    let sectorIds = new Set<string>();
    try {
      sectorIds = new Set(getSectors(g.id).map(s => s.id));
    } catch {
      /* keine Sektoren */
    }
    const active = boulders.filter(b => sectorIds.has(b.sectorId) && b.status === 'active');
    return {
      id: g.id,
      name: g.name,
      city: g.city,
      address: g.address,
      logoUrl: g.logoUrl,
      lat: g.lat,
      lng: g.lng,
      activeBoulders: active.length,
      newBoulders: active.filter(b => isRecentlyNew(b.publishedAt)).length,
    };
  });
}

export const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Adresse → Koordinaten über OpenStreetMap (Nominatim). Gibt null zurück, wenn nichts gefunden wurde.
 * Wird nur auf Knopfdruck im Admin-Bereich aufgerufen (Nutzungsregeln: max. 1 Anfrage/Sekunde).
 */
export async function geocodeAddress(
  query: string,
  fetchFn: typeof fetch = fetch
): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetchFn(url, { headers: { 'Accept-Language': 'de' } });
  if (!res.ok) throw new Error(`Adresssuche fehlgeschlagen (${res.status})`);
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!hasCoordinates({ lat, lng })) return null;
  return { lat, lng };
}
