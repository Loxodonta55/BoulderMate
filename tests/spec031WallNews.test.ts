import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerWallVisit,
  newBouldersSince,
  newCountsBySector,
  isRebuildAnnounced,
  daysUntil,
  formatPlannedDate,
  formatPlannedWeekday,
  lastChanceSectors,
  isWallNewsDismissed,
  dismissWallNews,
  NEW_VISIT_GAP_MS,
} from '../src/lib/wallNews';
import {
  clearBatchServiceStorage,
  getSectors,
  getSectorById,
  setPlannedRebuild,
  setRebuildPhoto,
  createDraftBoulder,
  completeSectorRebuild,
} from '../src/lib/batchBoulderService';
import type { Ascent, Sector, WallBoulder } from '../src/types/boulder';

/** SPEC-031 · «Neu an der Wand» und «Letzte Chance» */

const H = 60 * 60 * 1000;
const T0 = Date.parse('2026-10-09T10:00:00Z');

const b = (id: string, sectorId: string, publishedAt: string, status: WallBoulder['status'] = 'active'): WallBoulder => ({
  id, sectorId, gradeScaleId: 'x', positionX: 0.5, positionY: 0.5, setterId: 's', status,
  radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 }, createdAt: publishedAt, publishedAt,
});

describe('SPEC-031 Besuche (F3)', () => {
  beforeEach(() => localStorage.clear());

  it('AC-1: erster Besuch liefert keinen Vergleichspunkt', () => {
    expect(registerWallVisit('u', 'g', T0)).toBeNull();
  });

  it('unter 4 Stunden ist es derselbe Besuch', () => {
    registerWallVisit('u', 'g', T0);
    expect(registerWallVisit('u', 'g', T0 + 1 * H)).toBeNull();
    expect(registerWallVisit('u', 'g', T0 + 3 * H)).toBeNull();
  });

  it('nach mehr als 4 Stunden beginnt ein neuer Besuch; Vergleichspunkt = letztes Öffnen', () => {
    registerWallVisit('u', 'g', T0);
    registerWallVisit('u', 'g', T0 + 1 * H);
    const since = registerWallVisit('u', 'g', T0 + 1 * H + NEW_VISIT_GAP_MS + 1);
    expect(since).toBe(T0 + 1 * H);
    // Während des neuen Besuchs bleibt der Vergleichspunkt stehen
    expect(registerWallVisit('u', 'g', T0 + 6 * H)).toBe(T0 + 1 * H);
  });

  it('getrennt nach Person und Halle', () => {
    registerWallVisit('u', 'g', T0);
    expect(registerWallVisit('u', 'andere', T0 + 10 * H)).toBeNull();
    expect(registerWallVisit('v', 'g', T0 + 10 * H)).toBeNull();
  });

  it('F4: Wegklicken gilt nur für diesen Besuch', () => {
    registerWallVisit('u', 'g', T0);
    registerWallVisit('u', 'g', T0 + 5 * H);
    dismissWallNews('u', 'g');
    expect(isWallNewsDismissed('u', 'g')).toBe(true);
    registerWallVisit('u', 'g', T0 + 10 * H);
    expect(isWallNewsDismissed('u', 'g')).toBe(false);
  });
});

describe('SPEC-031 Neu (F2)', () => {
  const since = T0;
  const boulders = [
    b('alt', 's1', new Date(T0 - H).toISOString()),
    b('neu1', 's1', new Date(T0 + H).toISOString()),
    b('neu2', 's2', new Date(T0 + 2 * H).toISOString()),
    b('neu-weg', 's2', new Date(T0 + 2 * H).toISOString(), 'archived'),
    b('entwurf', 's2', '', 'draft'),
  ];

  it('zählt aktive Boulder, die nach dem letzten Besuch veröffentlicht wurden', () => {
    expect(newBouldersSince(boulders, since).map(x => x.id)).toEqual(['neu1', 'neu2']);
    expect(newBouldersSince(boulders, null)).toEqual([]);
  });

  it('AC-3: «n neu» pro Sektor', () => {
    const counts = newCountsBySector(boulders, since);
    expect(counts.get('s1')).toBe(1);
    expect(counts.get('s2')).toBe(1);
  });
});

describe('SPEC-031 Ankündigung (F5–F7)', () => {
  const now = new Date(2026, 9, 9, 12, 0); // Do 09.10.2026

  it('Datum und Wochentag', () => {
    expect(formatPlannedDate('2026-10-13')).toBe('Di 13.10.');
    expect(formatPlannedWeekday('2026-10-12')).toBe('Mo');
    expect(daysUntil('2026-10-09', now)).toBe(0);
    expect(daysUntil('2026-10-16', now)).toBe(7);
  });

  it('AC-6: vergangene Daten zählen nicht mehr', () => {
    expect(isRebuildAnnounced({ rebuildPlannedFor: '2026-10-09' }, now)).toBe(true);
    expect(isRebuildAnnounced({ rebuildPlannedFor: '2026-10-08' }, now)).toBe(false);
    expect(isRebuildAnnounced({}, now)).toBe(false);
    expect(isRebuildAnnounced({ rebuildPlannedFor: 'kaputt' }, now)).toBe(false);
  });

  it('AC-7: Letzte Chance nur bei ≤ 7 Tagen und offenen Projekten', () => {
    const sectors: Sector[] = [
      { id: 'bald', gymId: 'g', name: 'Dach', wallPhotoUrl: '', sortOrder: 1, createdAt: '', rebuildPlannedFor: '2026-10-12' },
      { id: 'spaet', gymId: 'g', name: 'Platte', wallPhotoUrl: '', sortOrder: 2, createdAt: '', rebuildPlannedFor: '2026-10-30' },
      { id: 'ohne', gymId: 'g', name: 'Wand', wallPhotoUrl: '', sortOrder: 3, createdAt: '', rebuildPlannedFor: '2026-10-11' },
    ];
    const boulders = [b('p1', 'bald', ''), b('p2', 'spaet', ''), b('t1', 'ohne', '')];
    const ascents: Record<string, Ascent['type']> = { p1: 'project', p2: 'project', t1: 'top' };
    const result = lastChanceSectors(sectors, boulders, id => (ascents[id] ? ({ type: ascents[id] } as Ascent) : null), now);
    expect(result.map(r => r.sector.id)).toEqual(['bald']);
    expect(result[0].openProjects).toBe(1);
  });
});

describe('SPEC-031 setPlannedRebuild (AC-4/AC-6)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearBatchServiceStorage();
  });
  const today = new Date(2026, 9, 9);

  it('speichert, lehnt Vergangenheit ab und löscht', () => {
    const sector = getSectors('gym-minimum-zh')[0];
    setPlannedRebuild(sector.id, '2026-10-13', today);
    expect(getSectorById(sector.id)!.rebuildPlannedFor).toBe('2026-10-13');
    expect(() => setPlannedRebuild(sector.id, '2026-10-01', today)).toThrow(/Vergangenheit/);
    expect(() => setPlannedRebuild(sector.id, '13.10.2026', today)).toThrow(/gültiges Datum/);
    setPlannedRebuild(sector.id, null, today);
    expect(getSectorById(sector.id)!.rebuildPlannedFor).toBeUndefined();
  });

  it('«Wand fertig» löscht die Ankündigung', () => {
    const sector = getSectors('gym-minimum-zh')[0];
    setPlannedRebuild(sector.id, '2099-01-01');
    setRebuildPhoto(sector.id, '/images/walls/slab.jpg');
    createDraftBoulder({ sectorId: sector.id, gradeScaleId: 'scale-green', positionX: 0.5, positionY: 0.5, setterId: 's' });
    completeSectorRebuild(sector.id);
    expect(getSectorById(sector.id)!.rebuildPlannedFor).toBeUndefined();
  });
});
