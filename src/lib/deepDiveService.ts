import { GymGradeScale, LogbookEntry, RadarAttributes, RADAR_AXIS_DEFINITIONS } from '../types/boulder';
import { getProfileData } from './profileService';
import { getWallBoulders } from './batchBoulderService';
import { getRatings, computeAggregatedRadar } from './ratingAndAscentService';
import { compareFontGrades } from './gradeConverter';

/**
 * SPEC-004 (Deep Dive v2, 2026-10-08): Auswertung ausschliesslich aus Bouldern, die an der Wand
 * als Top oder Flash abgehakt wurden. Keine manuell erfassten Begehungen.
 */

export type DeepDiveAxis = 'maximalkraft' | 'kraftausdauer' | 'technik' | 'balance' | 'koordination' | 'flexibilitaet';

export const DEEP_DIVE_AXES: DeepDiveAxis[] = [
  'maximalkraft',
  'kraftausdauer',
  'technik',
  'balance',
  'koordination',
  'flexibilitaet',
];

/** Ab diesem Wert (Skala 1–5) gilt ein Merkmal als auffällig. */
export const HIGHLIGHT_THRESHOLD = 4;
/** Ab diesem Durchschnitt gilt ein Merkmal als typisch für einen Grad. */
export const LEVEL_DEMAND_THRESHOLD = 3.5;
/** Mindestabstand, ab dem die Top 5 sich vom Rest unterscheiden. */
export const PATTERN_MIN_DELTA = 0.5;
export const TOP_N = 5;

export type AxisValues = Record<DeepDiveAxis, number>;

export interface AttributeHighlight {
  key: DeepDiveAxis;
  label: string;
  value: number;
}

export interface DeepDiveRoute {
  boulderId: string;
  name: string;
  fontGrade: string;
  gradeScale: GymGradeScale;
  sectorName: string;
  type: 'flash' | 'top';
  createdAt: string;
  radar: AxisValues;
  /** Merkmale ≥ HIGHLIGHT_THRESHOLD, stärkstes zuerst. */
  highlights: AttributeHighlight[];
}

export interface DeepDiveLevel {
  fontGrade: string;
  gradeScale: GymGradeScale;
  sendCount: number;
  flashCount: number;
  avgRadar: AxisValues;
  /** Bis zu zwei Merkmale mit Ø ≥ LEVEL_DEMAND_THRESHOLD, stärkstes zuerst. */
  demands: AttributeHighlight[];
  routes: DeepDiveRoute[];
}

export interface DeepDivePattern {
  key: DeepDiveAxis;
  label: string;
  topAvg: number;
  restAvg: number;
  delta: number;
}

export interface DeepDiveReport {
  sendCount: number;
  flashCount: number;
  top5: DeepDiveRoute[];
  /** Merkmale, die in den Top 5 deutlich stärker ausgeprägt sind als bei den übrigen Tops. */
  top5Pattern: DeepDivePattern[];
  /** Ein Eintrag pro Fb-Grad, schwerster zuerst. */
  levels: DeepDiveLevel[];
}

const LABELS: Record<DeepDiveAxis, string> = Object.fromEntries(
  RADAR_AXIS_DEFINITIONS.map(d => [d.key, d.label])
) as Record<DeepDiveAxis, string>;

export function axisLabel(key: DeepDiveAxis): string {
  return LABELS[key] || key;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** «5» statt «5,0», sonst eine Nachkommastelle mit Komma. */
export function formatAxisValue(value: number): string {
  const r = round1(value);
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}

export function toAxisValues(radar: RadarAttributes | undefined): AxisValues {
  const out = {} as AxisValues;
  for (const key of DEEP_DIVE_AXES) {
    let v = radar?.[key];
    if (v === undefined && key === 'maximalkraft') v = radar?.kraft;
    out[key] = typeof v === 'number' ? v : 3;
  }
  return out;
}

export function getHighlights(values: AxisValues, threshold = HIGHLIGHT_THRESHOLD, max = 3): AttributeHighlight[] {
  return DEEP_DIVE_AXES.filter(k => values[k] >= threshold)
    .map(k => ({ key: k, label: axisLabel(k), value: round1(values[k]) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

function average(list: AxisValues[]): AxisValues {
  const out = {} as AxisValues;
  for (const key of DEEP_DIVE_AXES) {
    out[key] = list.length ? round1(list.reduce((s, v) => s + v[key], 0) / list.length) : 3;
  }
  return out;
}

/** Schwerster Grad zuerst, bei Gleichstand Flash vor Top, dann neueste zuerst. */
function compareRoutes(a: DeepDiveRoute, b: DeepDiveRoute): number {
  const g = compareFontGrades(b.fontGrade, a.fontGrade);
  if (g !== 0) return g;
  if (a.type !== b.type) return a.type === 'flash' ? -1 : 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Reine Berechnung (testbar ohne Storage): nimmt das aufgelöste Logbuch und
 * eine Funktion, die das Anforderungsprofil eines Boulders liefert.
 */
export function buildDeepDiveReport(
  logbook: LogbookEntry[],
  radarFor: (boulderId: string) => RadarAttributes | undefined
): DeepDiveReport {
  // Nur abgehakte Wand-Boulder (Top/Flash), ein Eintrag pro Boulder (Flash schlägt Top).
  const byBoulder = new Map<string, LogbookEntry>();
  for (const e of logbook) {
    if (e.type !== 'top' && e.type !== 'flash') continue;
    const prev = byBoulder.get(e.boulderId);
    if (!prev || (prev.type === 'top' && e.type === 'flash')) byBoulder.set(e.boulderId, e);
  }

  const routes: DeepDiveRoute[] = Array.from(byBoulder.values()).map(e => {
    const radar = toAxisValues(radarFor(e.boulderId));
    return {
      boulderId: e.boulderId,
      name: e.boulderName || `${e.gradeScale.colorName} #${e.boulderId.slice(-4)}`,
      fontGrade: e.fontGrade,
      gradeScale: e.gradeScale,
      sectorName: e.sectorName && !/unbekannt/i.test(e.sectorName) ? e.sectorName : '',
      type: e.type as 'flash' | 'top',
      createdAt: e.createdAt,
      radar,
      highlights: getHighlights(radar),
    };
  });
  routes.sort(compareRoutes);

  const top5 = routes.slice(0, TOP_N);
  const rest = routes.slice(TOP_N);

  let top5Pattern: DeepDivePattern[] = [];
  if (top5.length > 0 && rest.length > 0) {
    const topAvg = average(top5.map(r => r.radar));
    const restAvg = average(rest.map(r => r.radar));
    top5Pattern = DEEP_DIVE_AXES.map(k => ({
      key: k,
      label: axisLabel(k),
      topAvg: topAvg[k],
      restAvg: restAvg[k],
      delta: round1(topAvg[k] - restAvg[k]),
    }))
      .filter(p => p.delta >= PATTERN_MIN_DELTA)
      .sort((a, b) => b.delta - a.delta);
  }

  const levelMap = new Map<string, DeepDiveRoute[]>();
  for (const r of routes) {
    if (!levelMap.has(r.fontGrade)) levelMap.set(r.fontGrade, []);
    levelMap.get(r.fontGrade)!.push(r);
  }
  const levels: DeepDiveLevel[] = Array.from(levelMap.entries())
    .map(([fontGrade, list]) => {
      const avgRadar = average(list.map(r => r.radar));
      return {
        fontGrade,
        gradeScale: list[0].gradeScale,
        sendCount: list.length,
        flashCount: list.filter(r => r.type === 'flash').length,
        avgRadar,
        demands: getHighlights(avgRadar, LEVEL_DEMAND_THRESHOLD, 2),
        routes: list,
      };
    })
    .sort((a, b) => compareFontGrades(b.fontGrade, a.fontGrade));

  return {
    sendCount: routes.length,
    flashCount: routes.filter(r => r.type === 'flash').length,
    top5,
    top5Pattern,
    levels,
  };
}

/**
 * Deep Dive für einen Kletterer. `selectedGymId` ist derselbe Hallenfilter wie
 * auf der Ich-Seite ('all' = alle Hallen). Das Anforderungsprofil eines Boulders
 * ist das Schrauber-Radar, gewichtet mit den Einschätzungen der Community (SPEC-003).
 */
export function getDeepDiveReport(userId: string, selectedGymId: string = 'all'): DeepDiveReport {
  const { logbook } = getProfileData(userId, selectedGymId);
  const boulders = new Map(getWallBoulders().map(b => [b.id, b]));
  const ratings = getRatings();
  return buildDeepDiveReport(logbook, boulderId => {
    const b = boulders.get(boulderId);
    if (!b) return undefined;
    return computeAggregatedRadar(b.radar, ratings.filter(r => r.boulderId === boulderId));
  });
}
