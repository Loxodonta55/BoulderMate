import { Ascent, GradeDistributionItem, GymGradeScale, LogbookEntry, WallBoulder } from '../types/boulder';
import { compareFontGrades, getFontGradeIndex, resolveBoulderFontGrade } from './gradeConverter';
import { DEEP_DIVE_AXES, DeepDiveAxis, axisLabel, toAxisValues } from './deepDiveService';
import { t as tr } from './i18n';

/**
 * Reine Auswertungen für «Ich» (SPEC-033 CSV, SPEC-035 Projekte, SPEC-037 Statistik).
 * Ohne Storage-Zugriff, damit sie direkt testbar sind.
 */

const STYLE_LABEL: Record<string, string> = { flash: 'Flash', top: 'Top', project: 'Projekt' };

// ---------------------------------------------------------------------------
// SPEC-033 F6: CSV-Export
// ---------------------------------------------------------------------------
export const CSV_HEADER = ['Datum', 'Halle', 'Sektor', 'Nummer', 'Boulder', 'Farbe', 'Grad', 'Stil', 'Versuche'];

function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatCsvDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface CsvRowExtras {
  number?: number;
  attempts?: number;
}

/** UTF-8 mit BOM, Semikolon getrennt (Excel in DACH), älteste Zeile zuerst. */
export function buildLogbookCsv(entries: LogbookEntry[], extras: (e: LogbookEntry) => CsvRowExtras = () => ({})): string {
  const rows = [...entries]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(e => {
      const x = extras(e);
      return [
        formatCsvDate(e.createdAt),
        e.gymName,
        e.sectorName,
        x.number ?? '',
        e.boulderName || e.gradeScale.colorName,
        e.gradeScale.colorName,
        e.fontGrade,
        STYLE_LABEL[e.type] || e.type,
        e.type === 'flash' ? 1 : x.attempts ?? '',
      ]
        .map(csvCell)
        .join(';');
    });
  return '﻿' + [CSV_HEADER.join(';'), ...rows].join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// SPEC-035 F1: Meine Projekte
// ---------------------------------------------------------------------------
export function selectMyProjects(logbook: LogbookEntry[], boulders: WallBoulder[]): LogbookEntry[] {
  const active = new Set(boulders.filter(b => b.status === 'active').map(b => b.id));
  return logbook
    .filter(e => e.type === 'project' && active.has(e.boulderId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ---------------------------------------------------------------------------
// SPEC-037 F1: Flash-Anteil pro Grad
// ---------------------------------------------------------------------------
export function flashShare(item: Pick<GradeDistributionItem, 'flashCount' | 'totalCount'>): number {
  return item.totalCount > 0 ? Math.round((item.flashCount / item.totalCount) * 100) : 0;
}

// ---------------------------------------------------------------------------
// SPEC-037 F2: Verlauf 8 Wochen + Monatssatz
// ---------------------------------------------------------------------------
export interface WeekBar {
  /** Montag der Woche (lokal), YYYY-MM-DD */
  weekStart: string;
  label: string;
  tops: number;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Montag = 0
  x.setDate(x.getDate() - day);
  return x;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const isSend = (e: Pick<LogbookEntry, 'type'>) => e.type === 'top' || e.type === 'flash';

export function weeklyTops(logbook: LogbookEntry[], now: Date = new Date(), weeks = 8): WeekBar[] {
  const current = startOfWeek(now);
  const bars: WeekBar[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(current);
    start.setDate(current.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const tops = logbook.filter(e => {
      if (!isSend(e)) return false;
      const t = new Date(e.createdAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
    bars.push({ weekStart: dayKey(start), label: `${start.getDate()}.${start.getMonth() + 1}.`, tops });
  }
  return bars;
}

export function monthComparison(logbook: LogbookEntry[], now: Date = new Date()): { thisMonth: number; lastMonth: number; sentence: string } {
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  let thisMonth = 0;
  let lastMonth = 0;
  for (const e of logbook) {
    if (!isSend(e)) continue;
    const t = new Date(e.createdAt).getTime();
    if (t >= thisStart && t < nextStart) thisMonth++;
    else if (t >= lastStart && t < thisStart) lastMonth++;
  }
  return {
    thisMonth,
    lastMonth,
    sentence:
      thisMonth === 1
        ? tr('Diesen Monat {n} Top, letzten Monat {m}.', { n: thisMonth, m: lastMonth })
        : tr('Diesen Monat {n} Tops, letzten Monat {m}.', { n: thisMonth, m: lastMonth }),
  };
}

// ---------------------------------------------------------------------------
// SPEC-037 F5: Pro Halle
// ---------------------------------------------------------------------------
export interface GymRow {
  gymId: string;
  gymName: string;
  tops: number;
  bestGrade: string;
}

export function perGymSummary(logbook: LogbookEntry[]): GymRow[] {
  const map = new Map<string, GymRow>();
  for (const e of logbook) {
    if (!isSend(e)) continue;
    const row = map.get(e.gymId) || { gymId: e.gymId, gymName: e.gymName, tops: 0, bestGrade: '' };
    row.tops++;
    if (!row.bestGrade || compareFontGrades(e.fontGrade, row.bestGrade) > 0) row.bestGrade = e.fontGrade;
    map.set(e.gymId, row);
  }
  return Array.from(map.values()).sort((a, b) => b.tops - a.tops);
}

// ---------------------------------------------------------------------------
// SPEC-037 F4: «Für dich»
// ---------------------------------------------------------------------------
export interface Recommendation {
  boulder: WallBoulder;
  fontGrade: string;
  value: number;
}

export function recommendBoulders(params: {
  axis: DeepDiveAxis;
  boulders: WallBoulder[]; // aktive Boulder der aktuellen Halle
  scaleOf: (b: WallBoulder) => GymGradeScale | undefined;
  myAscents: Map<string, Ascent | null | undefined>;
  bestGrade: string | null | undefined;
  max?: number;
}): Recommendation[] {
  const { axis, boulders, scaleOf, myAscents, bestGrade, max = 3 } = params;
  const bestIdx = bestGrade ? getFontGradeIndex(bestGrade) : -1;
  const out: (Recommendation & { distance: number })[] = [];
  for (const b of boulders) {
    if (b.status !== 'active') continue;
    const mine = myAscents.get(b.id);
    if (mine && (mine.type === 'top' || mine.type === 'flash')) continue;
    const value = toAxisValues(b.radar)[axis];
    if (value < 4) continue;
    const fontGrade = resolveBoulderFontGrade(scaleOf(b), null, b.fontGrade);
    const idx = getFontGradeIndex(fontGrade);
    if (bestIdx >= 0 && idx >= 0 && Math.abs(idx - bestIdx) > 1) continue;
    out.push({ boulder: b, fontGrade, value, distance: bestIdx >= 0 && idx >= 0 ? Math.abs(idx - bestIdx) : 0 });
  }
  return out
    .sort((a, b) => b.value - a.value || a.distance - b.distance || (a.boulder.name || '').localeCompare(b.boulder.name || ''))
    .slice(0, max)
    .map(({ distance: _d, ...r }) => r);
}

// ---------------------------------------------------------------------------
// SPEC-037 F3: Stil-Verlauf (letzte 4 Wochen vs. 4 Wochen davor)
// ---------------------------------------------------------------------------
export interface StyleTrend {
  key: DeepDiveAxis;
  label: string;
  recent: number | null;
  before: number | null;
  arrow: '↑' | '↓' | '=' | '';
}

export function styleTrend(logbook: LogbookEntry[], radarOf: (boulderId: string) => WallBoulder['radar'] | undefined, now: Date = new Date()): StyleTrend[] {
  const day = 24 * 60 * 60 * 1000;
  const t0 = now.getTime();
  const recent: ReturnType<typeof toAxisValues>[] = [];
  const before: ReturnType<typeof toAxisValues>[] = [];
  for (const e of logbook) {
    if (!isSend(e)) continue;
    const t = new Date(e.createdAt).getTime();
    const radar = radarOf(e.boulderId);
    if (!radar) continue;
    if (t > t0 - 28 * day && t <= t0) recent.push(toAxisValues(radar));
    else if (t > t0 - 56 * day && t <= t0 - 28 * day) before.push(toAxisValues(radar));
  }
  const avg = (list: ReturnType<typeof toAxisValues>[], k: DeepDiveAxis) =>
    list.length ? Math.round((list.reduce((s, v) => s + v[k], 0) / list.length) * 10) / 10 : null;
  return DEEP_DIVE_AXES.map(k => {
    const r = avg(recent, k);
    const b = avg(before, k);
    let arrow: StyleTrend['arrow'] = '';
    if (r !== null && b !== null) arrow = r - b >= 0.3 ? '↑' : b - r >= 0.3 ? '↓' : '=';
    return { key: k, label: axisLabel(k), recent: r, before: b, arrow };
  });
}
