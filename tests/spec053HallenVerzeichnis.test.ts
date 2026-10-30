import { describe, it, expect, beforeEach } from 'vitest';
import {
  CODE_ALPHABET,
  LOCAL_VERZEICHNIS_SEED,
  VerzeichnisHalle,
  buildHallenLink,
  buildShareText,
  createMyCode,
  dankeschoenText,
  deleteMyCode,
  findNowActive,
  formatChf,
  formatCodeForReading,
  generateCode,
  getOnlyActive,
  getPendingRef,
  isShownInFinder,
  loadDirectory,
  loadMyCode,
  loadMyWishes,
  loadWishCounts,
  markNowActiveSeen,
  normalizeCode,
  readHallenLinkFromUrl,
  savePendingRef,
  setOnlyActive,
  setWish,
  toDirectoryEntries,
  wishCountLabel,
} from '../src/lib/hallenVerzeichnis';
import { sortGymEntries } from '../src/lib/gymFinder';

import { clearMemoryStore } from '../src/lib/storageUtils';

/** SPEC-053 · «Noch nicht dabei» – reine Logik (lokaler Speicher, kein Supabase) */

const H = (over: Partial<VerzeichnisHalle> = {}): VerzeichnisHalle => ({
  id: 'vz-1',
  name: 'Boulderhalle Test',
  ort: 'Winterthur',
  lat: 47.5,
  lng: 8.72,
  pruefStatus: 'ok',
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  clearMemoryStore();
});

describe('SPEC-053 · Verzeichnis-Filter (AC-10)', () => {
  it('zeigt nur sichtbare, sichere Einträge mit Koordinaten und ohne gym_id', () => {
    expect(isShownInFinder(H())).toBe(true);
    expect(isShownInFinder(H({ ausgeblendet: true }))).toBe(false);
    expect(isShownInFinder(H({ gymId: 'abc' }))).toBe(false);
    expect(isShownInFinder(H({ pruefStatus: 'unsicher' }))).toBe(false);
    expect(isShownInFinder(H({ lat: undefined }))).toBe(false);
    expect(isShownInFinder(H({ pruefStatus: 'korrigiert' }))).toBe(true);
  });

  it('keine Dublette, wenn eine aktive Halle gleich heißt (auch mit Akzenten)', () => {
    const rows = [H({ id: 'a', name: '6a plus Zürich' }), H({ id: 'b', name: 'Andere Halle' })];
    const out = toDirectoryEntries(rows, [{ name: '6A Plus Zurich' }], { b: 4 });
    expect(out.map(e => e.id)).toEqual(['b']);
    expect(out[0]).toMatchObject({ registered: false, wishCount: 4, activeBoulders: 0 });
  });

  it('lokale Beispieldaten: unsichere und koordinatenlose Einträge fallen raus', async () => {
    const rows = await loadDirectory();
    expect(rows).toHaveLength(LOCAL_VERZEICHNIS_SEED.length);
    const shown = toDirectoryEntries(rows, [], {}).map(e => e.id);
    expect(shown).toEqual(['vz-demo-winterthur', 'vz-demo-bern', 'vz-demo-stgallen']);
  });

  it('mit Standort: Verzeichnis-Hallen mischen sich nach Entfernung unter die aktiven (AC-2)', () => {
    const active = [{ id: 'gym-6a-plus', name: '6a plus', lat: 47.39, lng: 8.51, activeBoulders: 10, newBoulders: 0 }];
    const dir = toDirectoryEntries([H({ id: 'near', lat: 47.5, lng: 8.72 })], [], {});
    const sorted = sortGymEntries([...active, ...dir], { lat: 47.5, lng: 8.73 });
    expect(sorted.map(e => e.id)).toEqual(['near', 'gym-6a-plus']);
  });
});

describe('SPEC-053 · Schalter «Nur aktive Hallen» (AC-4)', () => {
  it('wird gemerkt', () => {
    expect(getOnlyActive()).toBe(false);
    setOnlyActive(true);
    expect(getOnlyActive()).toBe(true);
    setOnlyActive(false);
    expect(getOnlyActive()).toBe(false);
  });
});

describe('SPEC-053 · Wünsche (AC-6)', () => {
  it('setzen und zurücknehmen, Zahl zählt Beispiel-Wünsche mit', async () => {
    expect((await loadWishCounts())['vz-demo-winterthur']).toBe(11);
    expect(await setWish('vz-demo-winterthur', 'user-a', true)).toBe(true);
    expect(await setWish('vz-demo-winterthur', 'user-a', true)).toBe(true);
    expect((await loadWishCounts())['vz-demo-winterthur']).toBe(12);
    expect(await loadMyWishes('user-a')).toEqual(['vz-demo-winterthur']);
    expect(await loadMyWishes('user-b')).toEqual([]);
    await setWish('vz-demo-winterthur', 'user-a', false);
    expect((await loadWishCounts())['vz-demo-winterthur']).toBe(11);
    expect(await loadMyWishes(null)).toEqual([]);
  });

  it('Zahl erst ab 3', () => {
    expect(wishCountLabel(0)).toBeNull();
    expect(wishCountLabel(2)).toBeNull();
    expect(wishCountLabel(3)).toBe('3 Kletterer wünschen sich BoulderMate hier');
  });
});

describe('SPEC-053 · Empfehlungscode (AC-7)', () => {
  it('Format BM- + 6 vorlesbare Zeichen', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      expect(c).toMatch(/^BM-[A-Z0-9]{6}$/);
      expect(c.slice(3)).not.toMatch(/[0O1IB8S5Z2]/);
      for (const ch of c.slice(3)) expect(CODE_ALPHABET).toContain(ch);
    }
    expect(generateCode(() => 0)).toBe('BM-AAAAAA');
    expect(generateCode(() => 0.9999)).toBe('BM-999999');
  });

  it('normalizeCode akzeptiert nur gültige Codes', () => {
    expect(normalizeCode(' bm-k7q4ac ')).toBe('BM-K7Q4AC');
    expect(normalizeCode('BM-K7Q0AC')).toBeNull();
    expect(normalizeCode('XY-AAAAAA')).toBeNull();
    expect(normalizeCode(null)).toBeNull();
  });

  it('formatCodeForReading teilt in Dreiergruppen', () => {
    expect(formatCodeForReading('BM-K7Q4AC')).toBe('BM-K7Q 4AC');
  });

  it('Code nur mit Haken «mindestens 18»; bleibt gleich; löschen geht', async () => {
    expect(await createMyCode('user-a', false)).toBeNull();
    expect(await loadMyCode('user-a')).toBeNull();
    const code = await createMyCode('user-a', true);
    expect(code).toMatch(/^BM-/);
    expect(await createMyCode('user-a', true)).toBe(code);
    expect(await loadMyCode('user-a')).toBe(code);
    expect(await deleteMyCode('user-a')).toBe(true);
    expect(await loadMyCode('user-a')).toBeNull();
  });
});

describe('SPEC-053 · Link, Text, Dankeschön', () => {
  it('Link enthält ?halle= und ref=', () => {
    expect(buildHallenLink('vz-1', 'BM-K7Q4AC')).toBe('https://bouldermate.ch/?halle=vz-1&ref=BM-K7Q4AC');
    expect(buildHallenLink('vz-1', null)).toBe('https://bouldermate.ch/?halle=vz-1');
  });

  it('Link wird wieder gelesen; ungültiger Code fällt weg', () => {
    expect(readHallenLinkFromUrl('https://bouldermate.ch/?halle=vz-1&ref=BM-K7Q4AC')).toEqual({ halleId: 'vz-1', ref: 'BM-K7Q4AC' });
    expect(readHallenLinkFromUrl('https://bouldermate.ch/?halle=vz-1&ref=quatsch')).toEqual({ halleId: 'vz-1', ref: null });
    expect(readHallenLinkFromUrl('https://bouldermate.ch/?wand=x')).toBeNull();
    // SPEC-054 F5: allgemeiner Partner-Link ohne Halle
    expect(readHallenLinkFromUrl('https://bouldermate.ch/?ref=BM-K7Q4AC')).toEqual({ halleId: null, ref: 'BM-K7Q4AC' });
    expect(readHallenLinkFromUrl('https://bouldermate.ch/?ref=quatsch')).toBeNull();
  });

  it('Teilen-Text per Du, Zahl erst ab 3', () => {
    const link = 'https://bouldermate.ch/?halle=vz-1';
    const few = buildShareText({ wishCount: 2, link });
    expect(few).toMatch(/^Hallo zusammen!/);
    expect(few).not.toContain('wünschen sich');
    expect(few).toContain(link);
    expect(buildShareText({ wishCount: 12, link })).toContain('12 Kletterer wünschen sich das schon.');
  });

  it('Dankeschön: «Betrag folgt» ohne Gebühr, sonst 30 % in CHF', () => {
    // SPEC-054 §1.2: gleiche Regel wie die Partner-Provision
    expect(dankeschoenText()).toBe('Dein Dankeschön: 30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt.');
    expect(formatChf(1500)).toBe('CHF 1’500');
  });

  it('Code aus dem Link wird 30 Tage gemerkt', () => {
    savePendingRef('BM-K7Q4AC', 0);
    expect(getPendingRef(29 * 24 * 3600 * 1000)).toBe('BM-K7Q4AC');
    expect(getPendingRef(31 * 24 * 3600 * 1000)).toBeNull();
  });
});

describe('SPEC-053 · F6 «Deine Halle ist jetzt dabei»', () => {
  it('meldet gewünschte Hallen mit gym_id genau einmal', () => {
    const rows = [H({ id: 'a', gymId: 'g1' }), H({ id: 'b' }), H({ id: 'c', gymId: 'g2' })];
    expect(findNowActive(['a', 'b'], rows).map(r => r.id)).toEqual(['a']);
    markNowActiveSeen(['a']);
    expect(findNowActive(['a', 'b'], rows)).toEqual([]);
  });
});
