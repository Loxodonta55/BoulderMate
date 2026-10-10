import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeGymInsights,
  normalizeSetterId,
  setterDisplayName,
  getSetterOptions,
  UNKNOWN_SETTER_ID,
} from '../src/lib/gymInsights';
import {
  clearBatchServiceStorage,
  getLastSelectedSetterId,
  setLastSelectedSetterId,
  createDraftBoulder,
  updateBoulderDetails,
  getWallBoulders,
  getSectors,
} from '../src/lib/batchBoulderService';
import { resetAllGymData, ensureInitialGymData } from '../src/lib/gymStorage';
import { appointGymSetter } from '../src/lib/roleService';
import type { Ascent, BoulderRating, GymGradeScale, Sector, UserProfile, WallBoulder } from '../src/types/boulder';

/** SPEC-030 · Hallen-Auswertung: reine Berechnung */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-09T12:00:00Z');
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const sectors: Sector[] = [
  { id: 's1', gymId: 'g', name: 'Dach', wallPhotoUrl: '', sortOrder: 1, createdAt: iso(100), rebuiltAt: iso(42) },
  { id: 's2', gymId: 'g', name: 'Platte', wallPhotoUrl: '', sortOrder: 2, createdAt: iso(100) },
];
const scales: GymGradeScale[] = [
  { id: 'gelb', gymId: 'g', colorName: 'Gelb', colorHex: '#ff0', difficultyLabel: '', fontRangeMin: '4', fontRangeMax: '5', sortOrder: 1 },
  { id: 'rot', gymId: 'g', colorName: 'Rot', colorHex: '#f00', difficultyLabel: '', fontRangeMin: '6c', fontRangeMax: '7a', sortOrder: 3 },
  { id: 'blau', gymId: 'g', colorName: 'Blau', colorHex: '#00f', difficultyLabel: '', fontRangeMin: '6a', fontRangeMax: '6b', sortOrder: 2 },
];
const boulder = (id: string, sectorId: string, gradeScaleId: string, setterId: string, daysAgo: number, status: WallBoulder['status'] = 'active'): WallBoulder => ({
  id, sectorId, gradeScaleId, setterId, status, positionX: 0.5, positionY: 0.5,
  radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
  createdAt: iso(daysAgo), publishedAt: iso(daysAgo),
  ...(status === 'archived' ? { archivedAt: iso(1) } : {}),
});
const boulders: WallBoulder[] = [
  boulder('b1', 's1', 'gelb', 'anna', 20),
  boulder('b2', 's1', 'gelb', 'anna', 20),
  boulder('b3', 's2', 'blau', 'ben', 10),
  boulder('b4', 's2', 'blau', 'ben', 2),
  boulder('old', 's2', 'rot', 'ben', 60, 'archived'),
  boulder('fremd', 'andere-halle', 'gelb', 'anna', 5),
];
const ascent = (boulderId: string, userId: string, type: Ascent['type'], daysAgo: number): Ascent => ({
  id: `${boulderId}-${userId}`, boulderId, userId, userNickname: userId, type, createdAt: iso(daysAgo),
});
const ascents: Ascent[] = [
  ascent('b1', 'k1', 'flash', 1),
  ascent('b1', 'k2', 'top', 3),
  ascent('b1', 'k3', 'project', 2),
  ascent('b2', 'k1', 'top', 40),
  ascent('b3', 'k2', 'top', 5),
  ascent('old', 'k4', 'top', 50),
];
const rating = (boulderId: string, userId: string, stars: number, gradeFeel?: BoulderRating['gradeFeel']): BoulderRating => ({
  id: `${boulderId}-${userId}-r`, boulderId, userId, userNickname: userId, qualityStars: stars, gradeFeel, createdAt: iso(1), updatedAt: iso(1),
});
const ratings: BoulderRating[] = [
  rating('b1', 'k1', 5, 'stiff'),
  rating('b1', 'k2', 5, 'stiff'),
  rating('b1', 'k3', 4, 'fair'),
  rating('b3', 'k2', 2, 'soft'),
  rating('old', 'k4', 5),
];
const profiles: UserProfile[] = [
  { id: 'anna', nickname: 'Anna', createdAt: '' },
  { id: 'ben', nickname: 'Ben', createdAt: '' },
];

const run = (scope: 'active' | 'all' = 'active') =>
  computeGymInsights({ gymId: 'g', scope, now: NOW, sectors, boulders, gradeScales: scales, ascents, ratings, profiles });

describe('SPEC-030 computeGymInsights', () => {
  it('F3/AC-3: Kennzahlen zählen nur Flash + Top, Kletterer der letzten 30 Tage', () => {
    const r = run();
    expect(r.kpis.boulders).toBe(4);
    expect(r.kpis.ascents).toBe(4); // b1 (2), b2 (1), b3 (1); Projekt zählt nicht
    expect(r.kpis.climbers30d).toBe(2); // k1 und k2; k1s Top an b2 ist 40 Tage alt, k1 zählt über b1
    expect(r.kpis.avgStars).toBe(4); // (5+5+4+2)/4
  });

  it('F2/AC-2: «Alle» zählt abgeschraubte Boulder mit', () => {
    const r = run('all');
    expect(r.kpis.boulders).toBe(5);
    expect(r.kpis.ascents).toBe(5);
  });

  it('F4/AC-4: jede Hallenfarbe in Hallen-Reihenfolge, auch mit 0', () => {
    const r = run();
    expect(r.grades.map(g => g.colorName)).toEqual(['Gelb', 'Blau', 'Rot']);
    expect(r.grades.find(g => g.scaleId === 'rot')!.boulders).toBe(0);
    const gelb = r.grades.find(g => g.scaleId === 'gelb')!;
    expect(gelb.boulders).toBe(2);
    expect(gelb.ascents).toBe(3);
    expect(gelb.dominantFeel).toBe('stiff');
  });

  it('F5/AC-5: Beliebteste brauchen mindestens 3 Bewertungen', () => {
    const r = run();
    expect(r.top.map(t => t.boulderId)).toEqual(['b1']);
    expect(r.top[0].avgStars).toBeCloseTo(4.7, 1);
  });

  it('F5/AC-5: Kaum geklettert = aktiv, mindestens 7 Tage alt, wenigste Begehungen zuerst', () => {
    const r = run();
    expect(r.unloved.map(u => u.boulderId)).toEqual(['b2', 'b3', 'b1']);
    expect(r.unloved.some(u => u.boulderId === 'b4')).toBe(false); // erst 2 Tage alt
  });

  it('F6/AC-6: Wand-Alter seit Umbau, sonst seit ältestem aktiven Boulder', () => {
    const r = run();
    expect(r.sectors.find(s => s.sectorId === 's1')!.ageDays).toBe(42);
    expect(r.sectors.find(s => s.sectorId === 's2')!.ageDays).toBe(10);
  });

  it('F7/AC-7: Schrauber mit Top-Routen, sortiert nach Top-Routen', () => {
    const r = run();
    expect(r.setters.map(s => s.name)).toEqual(['Anna', 'Ben']);
    const anna = r.setters[0];
    expect(anna.routes).toBe(2);
    expect(anna.topRoutes).toBe(1);
    expect(anna.stiffPercent).toBe(67);
    const ben = r.setters[1];
    expect(ben.routes).toBe(2);
    expect(ben.topRoutes).toBe(0);
    expect(ben.softPercent).toBe(100);
  });

  it('AC-9: keine Kletterer-Namen im Ergebnis', () => {
    const text = JSON.stringify(run('all'));
    for (const k of ['k1', 'k2', 'k3', 'k4']) expect(text).not.toContain(`"${k}"`);
  });
});

describe('SPEC-030 Schrauber', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAllGymData();
    clearBatchServiceStorage();
    ensureInitialGymData();
  });

  it('unbekannte Schrauber werden zusammengefasst', () => {
    expect(normalizeSetterId('')).toBe(UNKNOWN_SETTER_ID);
    expect(normalizeSetterId('system')).toBe(UNKNOWN_SETTER_ID);
    expect(normalizeSetterId('00000000-08ca-4000-8000-6e6f5bce818f')).toBe('schrauber-6aplus');
    expect(setterDisplayName('system', [])).toBe('Unbekannt');
    expect(setterDisplayName('anna', profiles)).toBe('Anna');
  });

  it('F8: Team-Auswahl und letzte Wahl pro Halle', () => {
    appointGymSetter('gym-minimum-zh', 'hans-kletterer', 'user-boris');
    const options = getSetterOptions('gym-minimum-zh');
    expect(options.some(o => o.id === 'hans-kletterer')).toBe(true);

    expect(getLastSelectedSetterId('gym-minimum-zh')).toBeNull();
    setLastSelectedSetterId('gym-minimum-zh', 'hans-kletterer');
    expect(getLastSelectedSetterId('gym-minimum-zh')).toBe('hans-kletterer');
    expect(getLastSelectedSetterId('gym-6a-plus')).toBeNull();
  });

  it('AC-8: updateBoulderDetails überschreibt den Schrauber', () => {
    const sector = getSectors('gym-minimum-zh')[0];
    const draft = createDraftBoulder({ sectorId: sector.id, gradeScaleId: 'scale-green', positionX: 0.4, positionY: 0.4, setterId: 'schrauber-minimum' });
    updateBoulderDetails(draft.id, { setterId: 'hans-kletterer' });
    expect(getWallBoulders(sector.id).find(b => b.id === draft.id)!.setterId).toBe('hans-kletterer');
  });
});
