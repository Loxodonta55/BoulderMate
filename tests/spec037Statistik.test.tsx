import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { weeklyTops, monthComparison, perGymSummary, flashShare, recommendBoulders, styleTrend } from '../src/lib/meStats';
import { WeeklySection, PerGymTable } from '../src/components/me/MeSections';
import { Ascent, GymGradeScale, LogbookEntry, WallBoulder } from '../src/types/boulder';

const scale = (min: string, max: string): GymGradeScale =>
  ({ id: `s-${min}`, gymId: 'g', colorName: min, colorHex: '#123456', difficultyLabel: '', fontRangeMin: min, fontRangeMax: max, sortOrder: 1 });

function entry(createdAt: string, type: LogbookEntry['type'] = 'top', gymId = 'g1', fontGrade = '6a', boulderId = 'b'): LogbookEntry {
  return {
    id: createdAt + type + gymId + boulderId, ascentId: 'a', boulderId, type, createdAt,
    gymId, gymName: gymId === 'g1' ? '6a Plus' : 'Minimum', sectorId: 's', sectorName: 'S',
    gradeScale: scale('6a', '6a'), fontGrade,
  } as LogbookEntry;
}

function wb(id: string, radar: Partial<WallBoulder['radar']>, fontGrade?: string): WallBoulder {
  return {
    id, sectorId: 's', gradeScaleId: 'x', positionX: 0, positionY: 0, setterId: 'x', status: 'active',
    radar: { technik: 3, balance: 3, koordination: 3, flexibilitaet: 3, ...radar }, createdAt: '2026-09-01', fontGrade,
  } as WallBoulder;
}

describe('SPEC-037: Statistik genauer', () => {
  const now = new Date('2026-10-09T12:00:00'); // Freitag

  it('Flash-Anteil pro Grad in Prozent (F1)', () => {
    expect(flashShare({ flashCount: 3, totalCount: 7 })).toBe(43);
    expect(flashShare({ flashCount: 0, totalCount: 0 })).toBe(0);
  });

  it('8 Wochen-Balken, älteste links, nur Tops/Flashes (F2, AC-2)', () => {
    const bars = weeklyTops([
      entry('2026-10-08T18:00:00'),
      entry('2026-10-06T18:00:00', 'flash'),
      entry('2026-10-05T18:00:00', 'project'),
      entry('2026-09-30T18:00:00'),
      entry('2026-08-01T18:00:00'),
    ], now);
    expect(bars).toHaveLength(8);
    expect(bars[7].weekStart).toBe('2026-10-05');
    expect(bars[7].tops).toBe(2);
    expect(bars[6].tops).toBe(1);
    expect(bars.reduce((s, b) => s + b.tops, 0)).toBe(3);
  });

  it('Monatssatz mit beiden Zahlen (F2)', () => {
    const m = monthComparison([entry('2026-10-02T10:00:00'), entry('2026-10-03T10:00:00'), entry('2026-09-20T10:00:00')], now);
    expect(m.sentence).toBe('Diesen Monat 2 Tops, letzten Monat 1.');
  });

  it('Pro Halle: Tops und bester Grad, nur ab 2 Hallen sichtbar (F5, AC-5)', () => {
    const log = [entry('2026-10-01', 'top', 'g1', '6a'), entry('2026-10-02', 'top', 'g1', '6c'), entry('2026-10-03', 'flash', 'g2', '6b')];
    const rows = perGymSummary(log);
    expect(rows[0]).toMatchObject({ gymId: 'g1', tops: 2, bestGrade: '6c' });
    expect(rows[1]).toMatchObject({ gymId: 'g2', tops: 1, bestGrade: '6b' });
    const { rerender } = render(<PerGymTable logbook={log} />);
    expect(screen.getByTestId('per-gym-section')).toHaveTextContent('Minimum');
    rerender(<PerGymTable logbook={[log[0]]} />);
    expect(screen.queryByTestId('per-gym-section')).not.toBeInTheDocument();
  });

  it('«Für dich»: höchstens 3 offene Boulder im Grad-Fenster mit hohem Baustellen-Merkmal (F4, AC-4)', () => {
    const boulders = [
      wb('sloper-5', { balance: 5 }, '6a'),
      wb('sloper-4', { balance: 4 }, '6b'),
      wb('zu-schwer', { balance: 5 }, '7a'),
      wb('getoppt', { balance: 5 }, '6a'),
      wb('flach', { balance: 2 }, '6a'),
      wb('noch-einer', { balance: 4 }, '5c'),
      wb('vierter', { balance: 4 }, '6a+'),
    ];
    const mine = new Map<string, Ascent | null>([['getoppt', { type: 'top' } as Ascent]]);
    const recs = recommendBoulders({ axis: 'balance', boulders, scaleOf: () => undefined, myAscents: mine, bestGrade: '6a' });
    expect(recs).toHaveLength(3);
    expect(recs[0].boulder.id).toBe('sloper-5');
    const ids = recs.map(r => r.boulder.id);
    expect(ids).not.toContain('getoppt');
    expect(ids).not.toContain('zu-schwer');
    expect(ids).not.toContain('flach');
  });

  it('Stil-Verlauf: letzte 4 Wochen vs. davor mit Pfeil (F3, AC-3)', () => {
    const radar: Record<string, WallBoulder['radar']> = {
      neu: { technik: 5, balance: 3, koordination: 3, flexibilitaet: 3, maximalkraft: 2 },
      alt: { technik: 2, balance: 3, koordination: 3, flexibilitaet: 3, maximalkraft: 4 },
    };
    const trend = styleTrend([entry('2026-10-01', 'top', 'g1', '6a', 'neu'), entry('2026-09-01', 'top', 'g1', '6a', 'alt')], id => radar[id], now);
    expect(trend.find(t => t.key === 'technik')).toMatchObject({ recent: 5, before: 2, arrow: '↑' });
    expect(trend.find(t => t.key === 'maximalkraft')).toMatchObject({ arrow: '↓' });
    expect(trend.find(t => t.key === 'balance')).toMatchObject({ arrow: '=' });
  });

  it('Abschnitt «Verlauf 8 Wochen» zeigt 8 Balken und den Monatssatz', () => {
    render(<WeeklySection logbook={[entry('2026-10-08T18:00:00')]} now={now} />);
    expect(screen.getByTestId('weekly-section')).toHaveTextContent('Verlauf 8 Wochen');
    expect(screen.getByTestId('month-sentence')).toHaveTextContent('Diesen Monat 1 Top, letzten Monat 0.');
    expect(screen.getAllByTestId(/^week-bar-/)).toHaveLength(8);
  });
});

describe('SPEC-037 F3: Stil-Verlauf im Deep Dive', () => {
  it('zeigt den Abschnitt «Dein Stil im Verlauf» mit Hinweis, solange der Vergleich fehlt', async () => {
    const { DeepDiveView } = await import('../src/components/DeepDiveView');
    const gymStorage = await import('../src/lib/gymStorage');
    const batch = await import('../src/lib/batchBoulderService');
    const svc = await import('../src/lib/ratingAndAscentService');
    localStorage.clear();
    svc.resetAscentAndRatingStorage();
    gymStorage.ensureInitialGymData();
    const sector = batch.getSectors('gym-6a-plus')[0];
    const scale = batch.getGradeScales('gym-6a-plus')[0];
    const b = batch.createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.5, positionY: 0.5, name: 'Trend', setterId: 'schrauber-6aplus' });
    batch.publishBatch(sector.id, 'schrauber-6aplus');
    svc.logAscent('spec037-trend', 'Tina', b.id, 'top');
    render(<DeepDiveView userId="spec037-trend" gymId="all" />);
    expect(screen.getByTestId('deep-dive-trend')).toHaveTextContent('Dein Stil im Verlauf');
    expect(screen.getByTestId('deep-dive-trend-empty')).toBeInTheDocument();
  });
});
