import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  distanceKm,
  formatDistance,
  normalizeSearch,
  matchesGymSearch,
  sortGymEntries,
  buildNavigationUrl,
  hasCoordinates,
  geocodeAddress,
  getGymFinderEntries,
  GymFinderEntry,
} from '../src/lib/gymFinder';
import { resetAllGymData, ensureInitialGymData, getGyms as getV1Gyms, updateGymLocation, SEED_GYM_LOCATIONS } from '../src/lib/gymStorage';
import { getGyms } from '../src/lib/batchBoulderService';

const WINTERTHUR = { lat: 47.4988, lng: 8.7237 };
const ZUERICH = { lat: 47.3769, lng: 8.5417 };

const entry = (id: string, name: string, extra: Partial<GymFinderEntry> = {}): GymFinderEntry => ({
  id, name, activeBoulders: 0, newBoulders: 0, ...extra,
});

describe('SPEC-025 · Halle suchen – Logik', () => {
  it('berechnet die Luftlinie Winterthur–Zürich (≈ 19 km)', () => {
    const d = distanceKm(WINTERTHUR, ZUERICH);
    expect(d).toBeGreaterThan(18);
    expect(d).toBeLessThan(20);
    expect(distanceKm(ZUERICH, ZUERICH)).toBe(0);
  });

  it('formatiert Entfernungen deutsch («850 m», «3,2 km», «24 km»)', () => {
    expect(formatDistance(0.85)).toBe('850 m');
    expect(formatDistance(3.24)).toBe('3,2 km');
    expect(formatDistance(23.6)).toBe('24 km');
  });

  it('sucht ohne Groß-/Kleinschreibung und ohne Akzente in Name, Ort und Adresse', () => {
    expect(normalizeSearch('  Zürich ')).toBe('zurich');
    const g = { name: 'Minimum Bouldern', city: 'Zürich', address: 'Flüelastrasse 31' };
    expect(matchesGymSearch(g, 'zur')).toBe(true);
    expect(matchesGymSearch(g, 'FLUELA')).toBe(true);
    expect(matchesGymSearch(g, 'minimum')).toBe(true);
    expect(matchesGymSearch(g, 'winterthur')).toBe(false);
    expect(matchesGymSearch(g, '')).toBe(true);
  });

  it('sortiert ohne Standort nach Name, mit Standort nach Entfernung (ohne Koordinaten ans Ende)', () => {
    const list = [
      entry('w', 'Winterthur Halle', WINTERTHUR),
      entry('x', 'Ohne Ort'),
      entry('z', 'Zürich Halle', ZUERICH),
    ];
    expect(sortGymEntries(list).map(e => e.id)).toEqual(['x', 'w', 'z']);
    const near = sortGymEntries(list, { lat: 47.38, lng: 8.54 });
    expect(near.map(e => e.id)).toEqual(['z', 'w', 'x']);
    expect(near[0].distanceKm).toBeLessThan(1);
    expect(near[2].distanceKm).toBeUndefined();
  });

  it('prüft Koordinaten auf Gültigkeit', () => {
    expect(hasCoordinates({ lat: 47, lng: 8 })).toBe(true);
    expect(hasCoordinates({})).toBe(false);
    expect(hasCoordinates({ lat: 91, lng: 8 })).toBe(false);
    expect(hasCoordinates({ lat: NaN, lng: 8 })).toBe(false);
  });

  it('baut den Link «Navigation starten» für Google Maps und Apple Karten', () => {
    const g = { name: 'Minimum', lat: 47.3829, lng: 8.5079, address: 'Flüelastrasse 31', city: 'Zürich' };
    expect(buildNavigationUrl(g, false)).toBe('https://www.google.com/maps/dir/?api=1&destination=47.3829%2C8.5079');
    expect(buildNavigationUrl(g, true)).toBe('https://maps.apple.com/?daddr=47.3829%2C8.5079&dirflg=d');
    // Ohne Koordinaten: Adresse als Ziel
    expect(buildNavigationUrl({ name: 'X', address: 'Klosterstrasse 17', city: 'Winterthur' }, false))
      .toBe('https://www.google.com/maps/dir/?api=1&destination=Klosterstrasse%2017%2C%20Winterthur');
  });
});

describe('SPEC-025 · Adresssuche (Nominatim)', () => {
  it('liefert Koordinaten aus der Antwort', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ lat: '47.38', lon: '8.51' }] });
    const res = await geocodeAddress('Flüelastrasse 31, Zürich', fetchFn as any);
    expect(res).toEqual({ lat: 47.38, lng: 8.51 });
    expect(fetchFn.mock.calls[0][0]).toContain('nominatim.openstreetmap.org/search?format=json&limit=1&q=Fl%C3%BCelastrasse');
  });

  it('gibt null zurück, wenn nichts gefunden wurde, und fragt bei leerer Eingabe nicht', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    expect(await geocodeAddress('gibt es nicht', fetchFn as any)).toBeNull();
    expect(await geocodeAddress('   ', fetchFn as any)).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('wirft bei HTTP-Fehlern', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => [] });
    await expect(geocodeAddress('Zürich', fetchFn as any)).rejects.toThrow(/503/);
  });
});

describe('SPEC-025 · Standort speichern & Hallen-Einträge', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    ensureInitialGymData();
  });

  it('Seed-Hallen bekommen Startkoordinaten und erscheinen mit Koordinaten in getGyms()', () => {
    const v1 = getV1Gyms().find(g => g.id === 'gym-6a-plus')!;
    expect(v1.lat).toBe(SEED_GYM_LOCATIONS['gym-6a-plus'].lat);
    const merged = getGyms().find(g => g.id === 'gym-minimum-zh')!;
    expect(hasCoordinates(merged)).toBe(true);
  });

  it('Hallen-Admin darf den Standort setzen, Kletterer nicht', () => {
    const updated = updateGymLocation('gym-6a-plus', 'admin-6aplus', 47.5, 8.7);
    expect(updated.lat).toBe(47.5);
    expect(getGyms().find(g => g.id === 'gym-6a-plus')!.lng).toBe(8.7);
    expect(() => updateGymLocation('gym-6a-plus', 'hans-kletterer', 47, 8)).toThrow(/Hallen-Admins/);
    expect(() => updateGymLocation('gym-6a-plus', 'user-boris', 99, 8)).toThrow(/Ungültige/);
  });

  it('jede eingetragene Halle steht in der Liste, mit Boulder-Zahlen (F1)', () => {
    const entries = getGymFinderEntries();
    const ids = entries.map(e => e.id);
    expect(ids).toContain('gym-6a-plus');
    expect(ids).toContain('gym-minimum-zh');
    for (const e of entries) {
      expect(e.activeBoulders).toBeGreaterThanOrEqual(0);
      expect(e.newBoulders).toBeLessThanOrEqual(e.activeBoulders);
    }
  });
});
