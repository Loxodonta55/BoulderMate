import { describe, it, expect } from 'vitest';
import {
  computeSetterDetail,
  computeSetterReport,
  sortSetterReport,
  REPORT_COMMENT_LIMIT,
} from '../src/lib/setterReport';
import { UNKNOWN_SETTER_ID } from '../src/lib/gymInsights';
import type { Ascent, BoulderComment, BoulderRating, GymGradeScale, Sector, UserProfile, WallBoulder } from '../src/types/boulder';

/** SPEC-050 · Schrauber-Auswertung für die Hallenleitung: reine Berechnung */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-20T12:00:00Z');
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const sectors: Sector[] = [
  { id: 's1', gymId: 'g', name: 'Dach', wallPhotoUrl: '', sortOrder: 1, createdAt: iso(100) },
  { id: 's2', gymId: 'g', name: 'Platte', wallPhotoUrl: '', sortOrder: 2, createdAt: iso(100) },
];
const scales: GymGradeScale[] = [
  { id: 'gelb', gymId: 'g', colorName: 'Gelb', colorHex: '#ff0', difficultyLabel: '', fontRangeMin: '4', fontRangeMax: '5', sortOrder: 1 },
  { id: 'blau', gymId: 'g', colorName: 'Blau', colorHex: '#00f', difficultyLabel: '', fontRangeMin: '6a', fontRangeMax: '6b', sortOrder: 2 },
  { id: 'schwarz', gymId: 'g', colorName: 'Schwarz', colorHex: '#000', difficultyLabel: '', fontRangeMin: '7a', fontRangeMax: '8a', sortOrder: 3 },
];
const boulder = (id: string, gradeScaleId: string, setterId: string, daysAgo: number, extra: Partial<WallBoulder> = {}): WallBoulder => ({
  id, sectorId: 's1', gradeScaleId, setterId, status: 'active', positionX: 0.5, positionY: 0.5,
  radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
  createdAt: iso(daysAgo), publishedAt: iso(daysAgo), ...extra,
});
// Anna: 2× Gelb (14 Tage), Ben: 2× Schwarz (14 Tage) + 1× Gelb, Neu: 1× Blau (frisch), ohne Schrauber: 1× Gelb
const boulders: WallBoulder[] = [
  boulder('a1', 'gelb', 'anna', 14, { name: 'Gelbe Kante' }),
  boulder('a2', 'gelb', 'anna', 14),
  boulder('b1', 'schwarz', 'ben', 14, { name: 'Schwarzer Leisten' }),
  boulder('b2', 'schwarz', 'ben', 14),
  boulder('b3', 'gelb', 'ben', 7),
  boulder('n1', 'blau', 'neu', 1),
  boulder('u1', 'gelb', '', 14),
  boulder('old', 'blau', 'anna', 60, { status: 'archived', archivedAt: iso(30) }),
  boulder('fremd', 'gelb', 'anna', 5, { sectorId: 'andere-halle' }),
];
let n = 0;
const ascent = (boulderId: string, userId: string, type: Ascent['type']): Ascent => ({
  id: `asc-${n++}`, boulderId, userId, userNickname: `Kletterer ${userId}`, type, createdAt: iso(1),
});
const ascents: Ascent[] = [
  // a1: 4 Begehungen, davon 3 Flash
  ascent('a1', 'k1', 'flash'), ascent('a1', 'k2', 'flash'), ascent('a1', 'k3', 'flash'), ascent('a1', 'k4', 'top'),
  // a2: 2 Tops, 1 Projekt
  ascent('a2', 'k1', 'top'), ascent('a2', 'k2', 'top'), ascent('a2', 'k5', 'project'),
  // b1: 1 Top
  ascent('b1', 'k1', 'top'),
  // b3: 2 Flash
  ascent('b3', 'k1', 'flash'), ascent('b3', 'k2', 'flash'),
  ascent('old', 'k1', 'top'),
];
const rating = (boulderId: string, userId: string, stars: number, gradeFeel?: BoulderRating['gradeFeel']): BoulderRating => ({
  id: `${boulderId}-${userId}`, boulderId, userId, userNickname: `Kletterer ${userId}`, qualityStars: stars, gradeFeel, createdAt: iso(1), updatedAt: iso(1),
});
const ratings: BoulderRating[] = [
  rating('a1', 'k1', 5, 'fair'), rating('a1', 'k2', 5, 'fair'), rating('a1', 'k3', 4, 'soft'),
  rating('a2', 'k1', 3, 'soft'),
  rating('b1', 'k1', 3, 'stiff'), rating('b1', 'k2', 2, 'stiff'), rating('b1', 'k3', 3, 'stiff'),
  rating('b2', 'k1', 4, 'fair'),
  rating('n1', 'k1', 1, 'stiff'),
];
const comment = (id: string, boulderId: string, daysAgo: number): BoulderComment => ({
  id, boulderId, userId: 'k1', userNickname: 'Kletterer Geheim', userAvatarUrl: 'https://x/y.png', text: `Beta ${id}`, createdAt: iso(daysAgo),
});
const comments: BoulderComment[] = [
  ...Array.from({ length: 7 }, (_, i) => comment(`c${i}`, 'a1', i + 1)),
  comment('cb', 'b1', 2),
];
const profiles: UserProfile[] = [
  { id: 'anna', nickname: 'Anna', createdAt: '' },
  { id: 'ben', nickname: 'Ben', createdAt: '' },
  { id: 'neu', nickname: 'Neu', createdAt: '' },
];
const input = (scope: 'active' | 'all' = 'active') => ({
  gymId: 'g', scope, now: NOW, sectors, boulders, gradeScales: scales, ascents, ratings, comments, profiles,
});
const byId = (rows: ReturnType<typeof computeSetterReport>, id: string) => rows.find(r => r.setterId === id)!;

describe('SPEC-050 computeSetterReport', () => {
  it('gruppiert nach Schrauber, nur Routen dieser Halle und des Zeitraums (AC-2)', () => {
    const rows = computeSetterReport(input());
    expect(byId(rows, 'anna').routes).toBe(2);
    expect(byId(rows, 'ben').routes).toBe(3);
    expect(byId(rows, UNKNOWN_SETTER_ID).routes).toBe(1);
    const all = computeSetterReport(input('all'));
    expect(byId(all, 'anna').routes).toBe(3);
    expect(byId(all, 'anna').activeRoutes).toBe(2);
  });

  it('Mindestzahlen: Sterne ab 3 Bewertungen, Grad ab 3 Stimmen, 1. Versuch ab 5 Begehungen (§6)', () => {
    const rows = computeSetterReport(input());
    const neu = byId(rows, 'neu');
    expect(neu.avgStars).toBeNull();
    expect(neu.gradeFair).toBeNull();
    expect(neu.firstTryRate).toBeNull();
    const anna = byId(rows, 'anna');
    expect(anna.ratings).toBe(4);
    expect(anna.avgStars).toBe(4.3);
    expect(anna.gradeFair).toBe(2);
    expect(anna.feelTotal).toBe(4);
    expect(anna.ascents).toBe(6);
    expect(anna.firstTryRate).toBeCloseTo(3 / 6);
  });

  it('Top-Routen nur mit mindestens 3 Bewertungen und Ø ≥ 4,0', () => {
    const rows = computeSetterReport(input());
    expect(byId(rows, 'anna').topRoutes).toBe(1);
    expect(byId(rows, 'neu').topRoutes).toBe(0);
  });

  it('Hallenwert gewichtet nach der Farbverteilung des Schraubers', () => {
    const rows = computeSetterReport(input());
    // Gelb in der Halle: a1 5,5,4 + a2 3 = 4,25; Schwarz: 3,2,3,4 = 3,0
    expect(byId(rows, 'anna').hallStars).toBe(4.3);
    // Ben: 2× Schwarz + 1× Gelb → (3,0 + 3,0 + 4,25) / 3 = 3,4
    expect(byId(rows, 'ben').hallStars).toBe(3.4);
  });

  it('Begehungen pro Woche hängen von der Zeit an der Wand ab (v3)', () => {
    const rows = computeSetterReport(input());
    // a1: 4 in 2 Wochen = 2, a2: 2 in 2 Wochen = 1 → 1,5
    expect(byId(rows, 'anna').weekly).toBe(1.5);
    // n1 hängt 1 Tag → mindestens 1 Woche
    expect(byId(rows, 'neu').weekly).toBe(0);
    // abgeschraubt: bis archivedAt (30 Tage → ~4,3 Wochen)
    const all = computeSetterReport(input('all'));
    expect(byId(all, 'anna').weekly).toBeCloseTo((2 + 1 + 1 / (30 / 7)) / 3, 1);
  });

  it('Sortierung: Sterne nach Abstand zum Hallenwert, ohne Daten unten, Unbekannt zuletzt (AC-4)', () => {
    const rows = computeSetterReport(input());
    expect(rows[rows.length - 1].setterId).toBe(UNKNOWN_SETTER_ID);
    expect(rows.map(r => r.setterId).slice(0, 2)).toEqual(['ben', 'anna']);

    const stars = sortSetterReport(rows, 'stars');
    // Anna 4,3 vs Halle 4,3 = 0; Ben 3,0 vs 3,4 = −0,4; Neu ohne Daten
    expect(stars.map(r => r.setterId)).toEqual(['anna', 'ben', 'neu', UNKNOWN_SETTER_ID]);

    const grade = sortSetterReport(rows, 'grade');
    expect(grade.map(r => r.setterId)).toEqual(['anna', 'ben', 'neu', UNKNOWN_SETTER_ID]);

    const names = sortSetterReport(rows, 'name');
    expect(names.map(r => r.setterId)).toEqual(['anna', 'ben', 'neu', UNKNOWN_SETTER_ID]);
  });
});

describe('SPEC-050 computeSetterDetail', () => {
  it('Lieblingsroute nur ab 3 Bewertungen und Ø ≥ 4,0 (AC-6)', () => {
    expect(computeSetterDetail('anna', input())!.favorite?.boulderId).toBe('a1');
    expect(computeSetterDetail('ben', input())!.favorite).toBeNull();
  });

  it('Pro Farbe mit Hallenwert und Tendenz ab 60 % (AC-6)', () => {
    const ben = computeSetterDetail('ben', input())!;
    expect(ben.colors.map(c => c.scaleId)).toEqual(['gelb', 'schwarz']);
    const schwarz = ben.colors.find(c => c.scaleId === 'schwarz')!;
    expect(schwarz.routes).toBe(2);
    expect(schwarz.feel).toEqual({ soft: 0, fair: 1, stiff: 3 });
    expect(schwarz.tendency).toBe('stiff');
    expect(schwarz.avgStars).toBe(3);
    expect(schwarz.hallStars).toBe(3);
    const anna = computeSetterDetail('anna', input())!;
    expect(anna.colors[0].tendency).toBeNull(); // 2 von 4 leicht = 50 %
  });

  it('Routen neueste zuerst, Flash/Top/Projekt getrennt, Ø Sterne erst ab 3', () => {
    const ben = computeSetterDetail('ben', input())!;
    expect(ben.routes[0].boulderId).toBe('b3');
    const anna = computeSetterDetail('anna', input())!;
    const a2 = anna.routes.find(r => r.boulderId === 'a2')!;
    expect(a2).toMatchObject({ flashes: 0, tops: 2, projects: 1, ascents: 2, avgStars: null, ratings: 1, label: 'Ohne Name' });
    const b1 = ben.routes.find(r => r.boulderId === 'b1')!;
    expect(b1.dominantFeel).toBe('stiff');
  });

  it('Beta-Kommentare: höchstens 5, neueste zuerst, ohne Namen und Profilbild (AC-7, AC-8)', () => {
    const a1 = computeSetterDetail('anna', input())!.routes.find(r => r.boulderId === 'a1')!;
    expect(a1.comments).toHaveLength(REPORT_COMMENT_LIMIT);
    expect(a1.comments[0].id).toBe('c0');
    const json = JSON.stringify(computeSetterDetail('anna', input()));
    expect(json).not.toContain('Kletterer');
    expect(json).not.toContain('https://x/y.png');
    expect(json).not.toContain('attempts');
  });

  it('ohne Routen im Zeitraum: null', () => {
    expect(computeSetterDetail('niemand', input())).toBeNull();
  });
});
