import { describe, it, expect, beforeEach } from 'vitest';
import {
  colorWeightedBaseline,
  computeSetterHints,
  computeSetterRouteDetail,
  computeSetterStats,
  dismissSetterHint,
  getDismissedSetterHints,
  getSetterStatsLastViewed,
  hintKey,
  isOwnRoute,
  median,
  setSetterStatsLastViewed,
  sortSetterRoutes,
  SETTER_HINT_LIMIT,
} from '../src/lib/setterStats';
import type { Ascent, BoulderComment, BoulderRating, GymGradeScale, Sector, WallBoulder } from '../src/types/boulder';

/** SPEC-044 · Schrauber-Statistik «Meine Routen»: reine Berechnung */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-20T12:00:00Z');
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const sectors: Sector[] = [
  { id: 's1', gymId: 'g', name: 'Dach', wallPhotoUrl: '', sortOrder: 1, createdAt: iso(100) },
  { id: 's2', gymId: 'g', name: 'Platte', wallPhotoUrl: '', sortOrder: 2, createdAt: iso(100) },
];
const scales: GymGradeScale[] = [
  { id: 'gelb', gymId: 'g', colorName: 'Gelb', colorHex: '#ff0', difficultyLabel: '', fontRangeMin: '4', fontRangeMax: '5', sortOrder: 1 },
  { id: 'schwarz', gymId: 'g', colorName: 'Schwarz', colorHex: '#000', difficultyLabel: '', fontRangeMin: '7a', fontRangeMax: '8a', sortOrder: 2 },
];
const boulder = (id: string, sectorId: string, gradeScaleId: string, setterId: string, daysAgo: number, extra: Partial<WallBoulder> = {}): WallBoulder => ({
  id, sectorId, gradeScaleId, setterId, status: 'active', positionX: 0.5, positionY: 0.5,
  radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
  createdAt: iso(daysAgo), publishedAt: iso(daysAgo), ...extra,
});

// «mara» schraubt viel Schwarz, «ben» Gelb und Schwarz
const boulders: WallBoulder[] = [
  boulder('m1', 's1', 'schwarz', 'mara', 20, { name: 'Dachquergang' }),
  boulder('m2', 's1', 'schwarz', 'mara', 3, { name: 'Leiste' }),
  boulder('m3', 's2', 'gelb', 'mara', 14, { name: 'Pinke Platte' }),
  boulder('m-old', 's2', 'gelb', 'mara', 60, { status: 'archived', archivedAt: iso(10), name: 'Alt' }),
  boulder('m-draft', 's2', 'gelb', 'mara', 1, { status: 'draft' }),
  boulder('b1', 's1', 'schwarz', 'ben', 20),
  boulder('b2', 's2', 'gelb', 'ben', 20),
  boulder('b3', 's2', 'gelb', 'ben', 20),
  boulder('fremd', 'andere-halle', 'gelb', 'mara', 5),
];
const asc = (boulderId: string, userId: string, type: Ascent['type'], daysAgo: number, attempts?: number): Ascent => ({
  id: `${boulderId}-${userId}-${type}-${daysAgo}`, boulderId, userId, userNickname: `Kletterer ${userId}`, type, createdAt: iso(daysAgo), ...(attempts ? { attempts } : {}),
});
const ascents: Ascent[] = [
  // m1: 4 Personen, 1 Flash, 3 Top (mit Versuchen), 1 Projekt
  asc('m1', 'k1', 'flash', 5),
  asc('m1', 'k2', 'top', 4, 3),
  asc('m1', 'k3', 'top', 3, 5),
  asc('m1', 'k4', 'top', 2, 2),
  asc('m1', 'k5', 'project', 1),
  // doppelte ältere Begehung derselben Person zählt nicht
  asc('m1', 'k1', 'top', 10),
  // m3: 5 Flashes, 1 Top → «fast alle flashen»
  ...['k1', 'k2', 'k3', 'k4', 'k5'].map((k, i) => asc('m3', k, 'flash', 2 + i)),
  asc('m3', 'k6', 'top', 2),
  // ben: Schwarz b1 9 Tops + 3 Flash; Gelb b2/b3 je 6 Begehungen, 3 Flash
  ...Array.from({ length: 9 }, (_, i) => asc('b1', `x${i}`, 'top', 5)),
  ...Array.from({ length: 3 }, (_, i) => asc('b1', `y${i}`, 'flash', 5)),
  ...Array.from({ length: 3 }, (_, i) => asc('b2', `x${i}`, 'flash', 5)),
  ...Array.from({ length: 3 }, (_, i) => asc('b2', `y${i}`, 'top', 5)),
  ...Array.from({ length: 6 }, (_, i) => asc('b3', `x${i}`, 'top', 5)),
];
const rate = (boulderId: string, userId: string, stars?: number, gradeFeel?: BoulderRating['gradeFeel'], daysAgo = 1, radar?: BoulderRating['radar']): BoulderRating => ({
  id: `${boulderId}-${userId}-r`, boulderId, userId, userNickname: `Kletterer ${userId}`, qualityStars: stars, gradeFeel,
  createdAt: iso(daysAgo), updatedAt: iso(daysAgo), ...(radar ? { radar } : {}),
});
const r3 = { technik: 5, balance: 4, koordination: 2, flexibilitaet: 1, maximalkraft: 3 };
const ratings: BoulderRating[] = [
  // m1: 4 Bewertungen, 3× hart
  rate('m1', 'k1', 3, 'stiff', 1, r3),
  rate('m1', 'k2', 3, 'stiff', 1, r3),
  rate('m1', 'k3', 4, 'stiff', 1, r3),
  rate('m1', 'k4', 2, 'fair', 1),
  // m3: Lieblingsroute
  rate('m3', 'k1', 5, 'fair'),
  rate('m3', 'k2', 5, 'soft'),
  rate('m3', 'k3', 4, 'fair'),
  // m2: nur 1 Bewertung
  rate('m2', 'k1', 5, 'stiff'),
  // ben Schwarz: Ø 4, Gelb: Ø 3
  rate('b1', 'x1', 4, 'fair'),
  rate('b1', 'x2', 4, 'fair'),
  rate('b2', 'x1', 3, 'fair'),
  rate('b3', 'x1', 3, 'fair'),
];
const comments: BoulderComment[] = [
  { id: 'c1', boulderId: 'm1', userId: 'k1', userNickname: 'Lena Geheim', text: 'Start ist brutal', createdAt: iso(2) },
  { id: 'c2', boulderId: 'm1', userId: 'k2', userNickname: 'Tim Geheim', text: 'Ferse rechts!', createdAt: iso(1) },
  { id: 'c3', boulderId: 'b1', userId: 'k2', userNickname: 'Tim Geheim', text: 'fremd', createdAt: iso(1) },
];

const base = { setterId: 'mara', gymId: 'g', now: NOW, sectors, boulders, gradeScales: scales, ascents, ratings, comments };
const run = (extra: Partial<Parameters<typeof computeSetterStats>[0]> = {}) => computeSetterStats({ ...base, ...extra });

beforeEach(() => localStorage.clear());

describe('AC-2 nur eigene Routen', () => {
  it('zeigt nur aktive eigene Routen dieser Halle, keine Entwürfe, keine fremden Hallen', () => {
    const ids = run().routes.map(r => r.boulderId).sort();
    expect(ids).toEqual(['m1', 'm2', 'm3']);
  });

  it('Demo-Schlüssel und Supabase-UUID zählen als dieselbe Person', () => {
    const b = boulder('x', 's1', 'gelb', '00000000-1d0e-4000-8000-e92d69136f33', 1);
    expect(isOwnRoute(b, 'user-boris')).toBe(true);
    expect(isOwnRoute(b, 'schrauber-6aplus')).toBe(false);
  });
});

describe('AC-3 Zeitraum', () => {
  it('«Alle» nimmt abgeschraubte Routen mit', () => {
    const all = run({ scope: 'all' });
    expect(all.routes.map(r => r.boulderId)).toContain('m-old');
    const old = all.routes.find(r => r.boulderId === 'm-old')!;
    expect(old.status).toBe('archived');
    expect(old.daysUp).toBe(50);
  });
});

describe('AC-4 Kacheln und Vergleich mit den anderen Schraubern', () => {
  it('zählt Flash + Top ohne Projekte, eine Begehung pro Person', () => {
    const s = run();
    const m1 = s.routes.find(r => r.boulderId === 'm1')!;
    expect([m1.flashes, m1.tops, m1.projects, m1.ascents]).toEqual([1, 3, 1, 4]);
    expect(s.kpis.ascents).toBe(4 + 6);
    expect(s.kpis.flashRate).toBeCloseTo(6 / 10);
  });

  it('Ø Sterne aller eigenen Bewertungen', () => {
    // 3,3,4,2,5,5,4,5 → 31/8 = 3,875 → 3,9
    expect(run().kpis.avgStars).toBe(3.9);
  });

  it('Vergleich nur mit anderen Schraubern derselben Farben, gewichtet nach eigenen Routen', () => {
    const s = run();
    // eigene: 2× Schwarz, 1× Gelb. Ben Schwarz Ø 4, Gelb Ø 3 → (4·2 + 3·1)/3 = 3,67 → 3,7
    expect(s.baseline.avgStars).toBe(3.7);
    // Flash: Ben Schwarz 3/12 = 0,25, Gelb 3/12 = 0,25 → 0,25
    expect(s.baseline.flashRate).toBeCloseTo(0.25);
  });

  it('colorWeightedBaseline lässt Farben ohne Vergleich weg und liefert null ohne Daten', () => {
    expect(colorWeightedBaseline([boulder('a', 's1', 'blau', 'x', 1)], boulders, ratings, ascents)).toEqual({ avgStars: null, flashRate: null });
  });

  it('ohne Bewertungen bleiben Sterne leer', () => {
    const s = run({ ratings: [] });
    expect(s.kpis.avgStars).toBeNull();
    expect(s.hasAnyRatings).toBe(false);
  });
});

describe('§7 Mindestzahl 3', () => {
  it('Sterne und Grad-Gefühl erst ab 3 Bewertungen, sonst «noch n»', () => {
    const m2 = run().routes.find(r => r.boulderId === 'm2')!;
    expect(m2.avgStars).toBeNull();
    expect(m2.missingRatings).toBe(2);
    expect(m2.dominantFeel).toBeNull();
    const m1 = run().routes.find(r => r.boulderId === 'm1')!;
    expect(m1.avgStars).toBe(3);
    expect(m1.dominantFeel).toBe('stiff');
  });
});

describe('AC-5 seit dem letzten Blick', () => {
  it('fehlt beim ersten Öffnen', () => {
    expect(run().since).toBeNull();
  });
  it('zählt neue Begehungen, Bewertungen und Beta an eigenen Routen', () => {
    const s = run({ lastViewedAt: NOW - 3.5 * DAY });
    // m1: k3 (3), k4 (2) → 2; m3: k1 (2), k2 (3), k6 (2) → 3
    expect(s.since).toEqual({ ascents: 5, ratings: 8, comments: 2 });
  });
  it('fehlt, wenn nichts Neues dazukam', () => {
    expect(run({ lastViewedAt: NOW }).since).toBeNull();
  });
  it('merkt den Zeitpunkt pro Halle', () => {
    expect(getSetterStatsLastViewed('g')).toBeNull();
    setSetterStatsLastViewed('g', 123);
    expect(getSetterStatsLastViewed('g')).toBe(123);
    expect(getSetterStatsLastViewed('h')).toBeNull();
  });
});

describe('AC-6 Hinweise', () => {
  it('höchstens 3, positiver zuerst, sachlich mit Zahlen', () => {
    const hints = computeSetterHints(run(), { now: NOW });
    expect(hints.length).toBeLessThanOrEqual(SETTER_HINT_LIMIT);
    expect(hints[0]).toMatchObject({ kind: 'favorite', boulderId: 'm3', positive: true });
    expect(hints[0].text).toBe('‹Pinke Platte› mögen die Leute: 4,7 ★ aus 3 Bewertungen');
    const hard = hints.find(h => h.kind === 'hard')!;
    expect(hard.text).toBe('‹Dachquergang›: 3 von 4 finden ihn hart für Schwarz');
    expect(hints.every(h => !/zu (hart|leicht)/.test(h.text))).toBe(true);
  });

  it('eine Route bekommt nur einen Hinweis (m3 ist Lieblingsroute, nicht «fast alle flashen»)', () => {
    const hints = computeSetterHints(run(), { now: NOW });
    expect(hints.filter(h => h.boulderId === 'm3')).toHaveLength(1);
  });

  it('«fast alle flashen» ab 5 Begehungen und 80 %', () => {
    const hints = computeSetterHints(run({ ratings: ratings.filter(r => r.boulderId !== 'm3') }), { now: NOW });
    expect(hints.find(h => h.kind === 'flash')?.text).toBe('‹Pinke Platte›: 5 von 6 Begehungen im ersten Versuch');
  });

  it('«kaum geklettert» gegen den Schnitt der anderen derselben Farbe, erst nach 7 Tagen', () => {
    const s = run({ ratings: [] });
    const hints = computeSetterHints(s, { now: NOW });
    // m1 hängt 20 Tage mit 4 Begehungen, Ben Schwarz 12 → 4 ≥ 12/3, kein Hinweis; m2 hängt erst 3 Tage
    expect(hints.find(h => h.kind === 'unloved')).toBeUndefined();
    const fewer = run({ ratings: [], ascents: ascents.filter(a => !(a.boulderId === 'm1' && a.userId !== 'k1')) });
    const unloved = computeSetterHints(fewer, { now: NOW }).find(h => h.kind === 'unloved')!;
    expect(unloved.text).toBe('‹Dachquergang›: 1 Begehung in 20 Tagen, Schwarz der anderen im Schnitt 12');
  });

  it('«kaum geklettert» erst, wenn die anderen im Schnitt mindestens 3 Begehungen haben', () => {
    const few = run({ ratings: [], ascents: ascents.filter(a => a.boulderId !== 'm1' && !(a.boulderId === 'b1' && a.type === 'top')) });
    // Ben Schwarz nur noch 3 Flash → Schnitt 3, m1 hat 0 → Hinweis; mit 2 im Schnitt nicht
    expect(computeSetterHints(few, { now: NOW }).some(h => h.kind === 'unloved')).toBe(true);
    const tiny = run({ ratings: [], ascents: ascents.filter(a => a.boulderId !== 'm1' && !(a.boulderId === 'b1' && a.userId !== 'y0' && a.userId !== 'y1')) });
    expect(computeSetterHints(tiny, { now: NOW }).some(h => h.kind === 'unloved')).toBe(false);
  });

  it('Platzhalter «Unbenannter Boulder» zählt als ohne Name', () => {
    const s = run({ boulders: [boulder('u', 's1', 'gelb', 'mara', 2, { name: 'Unbenannter Boulder' })] });
    expect(s.routes[0].name).toBe('');
    expect(s.routes[0].label).toBe('Gelb · Dach');
  });

  it('«Erledigt» blendet 14 Tage aus, danach kommt der Hinweis wieder', () => {
    const s = run();
    const key = hintKey('m1', 'hard');
    expect(computeSetterHints(s, { now: NOW, dismissed: { [key]: NOW - 1 * DAY } }).some(h => h.key === key)).toBe(false);
    expect(computeSetterHints(s, { now: NOW, dismissed: { [key]: NOW - 15 * DAY } }).some(h => h.key === key)).toBe(true);
    dismissSetterHint('g', key, NOW);
    expect(getDismissedSetterHints('g')).toEqual({ [key]: NOW });
  });
});

describe('AC-7 Sortierung', () => {
  it('Neueste, Beliebteste, Wenig geklettert', () => {
    const r = run().routes;
    expect(sortSetterRoutes(r, 'newest').map(x => x.boulderId)).toEqual(['m2', 'm3', 'm1']);
    expect(sortSetterRoutes(r, 'favorite').map(x => x.boulderId)).toEqual(['m3', 'm1', 'm2']);
    expect(sortSetterRoutes(r, 'least').map(x => x.boulderId)).toEqual(['m2', 'm1', 'm3']);
  });
});

describe('AC-8 Route im Detail', () => {
  const detail = () => computeSetterRouteDetail(run(), 'm1', { boulders, ascents, ratings, comments })!;

  it('Median der Versuche ab 3 Tops (Flash zählt 1)', () => {
    // k1 Flash 1, k2 3, k3 5, k4 2 → 1,2,3,5 → (2+3)/2 = 2,5 → 3
    expect(detail().medianAttempts).toBe(3);
    const few = computeSetterRouteDetail(run(), 'm1', { boulders, ascents: ascents.filter(a => !['k3', 'k4'].includes(a.userId)), ratings, comments })!;
    expect(few.medianAttempts).toBeNull();
  });

  it('zwei stärkste Merkmale ab 3 Bewertungen mit Radar', () => {
    expect(detail().traits).toEqual(['Technik', 'Balance']);
    expect(computeSetterRouteDetail(run(), 'm3', { boulders, ascents, ratings, comments })!.traits).toEqual([]);
  });

  it('Beta ohne Namen, neueste zuerst, nur diese Route', () => {
    const c = detail().comments;
    expect(c.map(x => x.text)).toEqual(['Ferse rechts!', 'Start ist brutal']);
    expect(JSON.stringify(c)).not.toMatch(/Geheim|userId|userNickname/);
  });

  it('Grad-Gefühl der anderen in dieser Farbe', () => {
    expect(detail().colorFeel).toBeNull(); // Ben Schwarz nur 2 Angaben
    expect(computeSetterRouteDetail(run(), 'm3', { boulders, ascents, ratings, comments })!.colorFeel).toBeNull();
  });

  it('median rechnet gerade und ungerade Längen', () => {
    expect(median([])).toBeNull();
    expect(median([4, 1, 2])).toBe(2);
  });
});

describe('AC-10 keine Kletterer-Namen', () => {
  it('Statistik enthält keine Namen oder Nutzer-IDs der Kletterer', () => {
    const text = JSON.stringify(run({ scope: 'all', lastViewedAt: NOW - 5 * DAY }));
    expect(text).not.toMatch(/Kletterer k|Geheim|"k1"|"x1"/);
  });
});
