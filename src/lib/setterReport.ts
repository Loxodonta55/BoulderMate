import { Ascent, BoulderComment, BoulderRating, GymGradeScale, Sector, UserProfile, WallBoulder } from '../types/boulder';
import { getGradeScales, getSectors, getWallBoulders } from './batchBoulderService';
import { computeBoulderStatsAggregate, getAscents, getComments, getRatings } from './ratingAndAscentService';
import { getProfiles } from './profileService';
import { TOP_RATED_MIN_STARS } from './climberWallFilters';
import { INSIGHTS_TOP_MIN_RATINGS, InsightsScope, normalizeSetterId, setterDisplayName, UNKNOWN_SETTER_ID } from './gymInsights';

/**
 * SPEC-050 · Schrauber-Auswertung für die Hallenleitung (Admin-Tab «Zahlen» → «Schrauber»).
 * Reine Berechnung aus dem lokalen Speicher. Keine Kletterer-Namen, keine Versuche (§7).
 * Gleiche Regeln wie SPEC-044: Mindestzahl 3, Top-Route = Ø ≥ 4,0, Vergleich mit den ANDEREN Schraubern
 * in denselben Farben (ohne eigene Routen), gewichtet nach der Farbverteilung.
 */

export const REPORT_MIN_RATINGS = INSIGHTS_TOP_MIN_RATINGS;
export const REPORT_MIN_FEEL_VOTES = 3;
export const REPORT_MIN_ASCENTS_FIRST_TRY = 5;
export const REPORT_TENDENCY_SHARE = 0.6;
export const REPORT_COMMENT_LIMIT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SetterReportSort = 'routes' | 'stars' | 'grade' | 'name';
export type ColorTendency = 'stiff' | 'soft' | null;

export interface FeelCounts { soft: number; fair: number; stiff: number }

export interface SetterReportRow {
  setterId: string;
  name: string;
  routes: number;
  activeRoutes: number;
  topRoutes: number;
  ratings: number;
  /** null unter REPORT_MIN_RATINGS */
  avgStars: number | null;
  hallStars: number | null;
  feel: FeelCounts;
  feelTotal: number;
  /** «passt»-Stimmen; null unter REPORT_MIN_FEEL_VOTES */
  gradeFair: number | null;
  ascents: number;
  flashes: number;
  /** Anteil im 1. Versuch (0–1); null unter REPORT_MIN_ASCENTS_FIRST_TRY */
  firstTryRate: number | null;
  hallFirstTryRate: number | null;
  weekly: number | null;
  hallWeekly: number | null;
}

export interface SetterColorRow {
  scaleId: string;
  colorName: string;
  colorHex: string;
  routes: number;
  avgStars: number | null;
  hallStars: number | null;
  feel: FeelCounts;
  feelTotal: number;
  tendency: ColorTendency;
}

export interface SetterRouteComment { id: string; text: string; createdAt: string }

export interface SetterRouteRow {
  boulderId: string;
  label: string;
  hasName: boolean;
  colorName: string;
  colorHex?: string;
  sectorName: string;
  status: WallBoulder['status'];
  archivedAt?: string;
  since: number;
  ascents: number;
  flashes: number;
  tops: number;
  projects: number;
  ratings: number;
  avgStars: number | null;
  feel: FeelCounts;
  feelTotal: number;
  dominantFeel: 'soft' | 'fair' | 'stiff' | null;
  /** neueste zuerst, höchstens REPORT_COMMENT_LIMIT, ohne Namen */
  comments: SetterRouteComment[];
}

export interface SetterDetail {
  summary: SetterReportRow;
  favorite: SetterRouteRow | null;
  colors: SetterColorRow[];
  routes: SetterRouteRow[];
}

export interface SetterReportInput {
  gymId: string;
  scope?: InsightsScope;
  now?: number;
  sectors?: Sector[];
  boulders?: WallBoulder[];
  gradeScales?: GymGradeScale[];
  ascents?: Ascent[];
  ratings?: BoulderRating[];
  comments?: BoulderComment[];
  profiles?: UserProfile[];
}

interface RouteCalc {
  boulder: WallBoulder;
  setterId: string;
  stars: number[];
  feel: FeelCounts;
  flashes: number;
  tops: number;
  projects: number;
  weekly: number;
  since: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((s, v) => s + v, 0) / values.length;
}

function sumFeel(list: { feel: FeelCounts }[]): FeelCounts {
  return list.reduce((acc, r) => ({ soft: acc.soft + r.feel.soft, fair: acc.fair + r.feel.fair, stiff: acc.stiff + r.feel.stiff }), { soft: 0, fair: 0, stiff: 0 });
}

const feelTotal = (f: FeelCounts) => f.soft + f.fair + f.stiff;

/** Gemeinsame Vorberechnung pro Route */
function prepare(input: SetterReportInput) {
  const scope = input.scope || 'active';
  const now = input.now ?? Date.now();
  const sectors = input.sectors ?? getSectors(input.gymId);
  const sectorById = new Map(sectors.map(s => [s.id, s]));
  const gradeScales = [...(input.gradeScales ?? getGradeScales(input.gymId))].sort((a, b) => a.sortOrder - b.sortOrder);
  const scaleById = new Map(gradeScales.map(s => [s.id, s]));
  const ascents = input.ascents ?? getAscents();
  const ratings = input.ratings ?? getRatings();
  const profiles = input.profiles ?? getProfiles();
  const boulders = (input.boulders ?? getWallBoulders()).filter(b =>
    sectorById.has(b.sectorId) && (b.status === 'active' || (scope === 'all' && b.status === 'archived'))
  );

  const routes: RouteCalc[] = boulders.map(b => {
    const agg = computeBoulderStatsAggregate(b, ratings, ascents, []);
    const flashes = agg.ascents.filter(a => a.type === 'flash').length;
    const tops = agg.ascents.filter(a => a.type === 'top').length;
    const projects = agg.ascents.filter(a => a.type === 'project').length;
    const parsedSince = Date.parse(b.publishedAt || b.createdAt);
    const since = Number.isNaN(parsedSince) ? now : parsedSince;
    const parsedEnd = b.status === 'archived' && b.archivedAt ? Date.parse(b.archivedAt) : now;
    const end = Number.isNaN(parsedEnd) ? now : parsedEnd;
    const weeks = Math.max(1, (end - since) / DAY_MS / 7);
    return {
      boulder: b,
      setterId: normalizeSetterId(b.setterId),
      stars: agg.ratings.filter(r => typeof r.qualityStars === 'number').map(r => r.qualityStars as number),
      feel: { ...agg.gradeFeelCounts },
      flashes,
      tops,
      projects,
      weekly: (flashes + tops) / weeks,
      since,
    };
  });

  return { scope, now, sectorById, gradeScales, scaleById, profiles, routes };
}

type Prepared = ReturnType<typeof prepare>;
type BaselineKey = 'stars' | 'firstTry' | 'weekly';

/** Vergleichswert einer Farbe aus den Routen der anderen Schrauber im Zeitraum */
function colorBaseline(prepared: Prepared, scaleId: string, excludeSetterId: string, key: BaselineKey): number | null {
  const others = prepared.routes.filter(r => r.boulder.gradeScaleId === scaleId && r.setterId !== excludeSetterId);
  if (key === 'stars') {
    const stars = others.flatMap(r => r.stars);
    return stars.length >= REPORT_MIN_RATINGS ? mean(stars) : null;
  }
  if (key === 'firstTry') {
    const flashes = others.reduce((s, r) => s + r.flashes, 0);
    const climbs = others.reduce((s, r) => s + r.flashes + r.tops, 0);
    return climbs >= REPORT_MIN_ASCENTS_FIRST_TRY ? flashes / climbs : null;
  }
  return mean(others.map(r => r.weekly));
}

/** Vergleichswert gewichtet nach der Farbverteilung der Routen; Farben ohne Vergleichswert fallen heraus */
function weightedHall(setterId: string, list: RouteCalc[], prepared: Prepared, key: BaselineKey): number | null {
  let sum = 0;
  let weight = 0;
  for (const r of list) {
    const v = colorBaseline(prepared, r.boulder.gradeScaleId, setterId, key);
    if (v === null || v === undefined) continue;
    sum += v;
    weight += 1;
  }
  return weight === 0 ? null : sum / weight;
}

function summarize(setterId: string, list: RouteCalc[], prepared: Prepared): SetterReportRow {
  const stars = list.flatMap(r => r.stars);
  const feel = sumFeel(list);
  const total = feelTotal(feel);
  const flashes = list.reduce((s, r) => s + r.flashes, 0);
  const ascents = list.reduce((s, r) => s + r.flashes + r.tops, 0);
  const weekly = mean(list.map(r => r.weekly));
  const hallStars = weightedHall(setterId, list, prepared, 'stars');
  const hallFirstTry = weightedHall(setterId, list, prepared, 'firstTry');
  const hallWeekly = weightedHall(setterId, list, prepared, 'weekly');
  return {
    setterId,
    name: setterDisplayName(setterId, prepared.profiles),
    routes: list.length,
    activeRoutes: list.filter(r => r.boulder.status === 'active').length,
    topRoutes: list.filter(r => r.stars.length >= REPORT_MIN_RATINGS && (mean(r.stars) as number) >= TOP_RATED_MIN_STARS).length,
    ratings: stars.length,
    avgStars: stars.length >= REPORT_MIN_RATINGS ? round1(mean(stars) as number) : null,
    hallStars: hallStars === null ? null : round1(hallStars),
    feel,
    feelTotal: total,
    gradeFair: total >= REPORT_MIN_FEEL_VOTES ? feel.fair : null,
    ascents,
    flashes,
    firstTryRate: ascents >= REPORT_MIN_ASCENTS_FIRST_TRY ? flashes / ascents : null,
    hallFirstTryRate: hallFirstTry,
    weekly: weekly === null ? null : round1(weekly),
    hallWeekly: hallWeekly === null ? null : round1(hallWeekly),
  };
}

function groupBySetter(routes: RouteCalc[]): Map<string, RouteCalc[]> {
  const map = new Map<string, RouteCalc[]>();
  for (const r of routes) {
    const list = map.get(r.setterId) || [];
    list.push(r);
    map.set(r.setterId, list);
  }
  return map;
}

export function computeSetterReport(input: SetterReportInput): SetterReportRow[] {
  const prepared = prepare(input);
  const rows = [...groupBySetter(prepared.routes).entries()].map(([id, list]) => summarize(id, list, prepared));
  return sortSetterReport(rows, 'routes');
}

/** AC-4: ohne Platznummern; ohne genug Daten unten; «Unbekannt» immer zuletzt */
export function sortSetterReport(rows: SetterReportRow[], sort: SetterReportSort): SetterReportRow[] {
  const byName = (a: SetterReportRow, b: SetterReportRow) => a.name.localeCompare(b.name, 'de');
  const value = (r: SetterReportRow): number | null => {
    if (sort === 'stars') return r.avgStars === null ? null : r.avgStars - (r.hallStars ?? r.avgStars);
    if (sort === 'grade') return r.gradeFair === null || r.feelTotal === 0 ? null : r.gradeFair / r.feelTotal;
    return null;
  };
  return [...rows].sort((a, b) => {
    const ua = a.setterId === UNKNOWN_SETTER_ID ? 1 : 0;
    const ub = b.setterId === UNKNOWN_SETTER_ID ? 1 : 0;
    if (ua !== ub) return ua - ub;
    if (sort === 'name') return byName(a, b);
    if (sort === 'routes') return b.routes - a.routes || byName(a, b);
    const va = value(a);
    const vb = value(b);
    if (va === null && vb === null) return byName(a, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return vb - va || b.routes - a.routes || byName(a, b);
  });
}

function routeRow(r: RouteCalc, prepared: Prepared, comments: BoulderComment[]): SetterRouteRow {
  const scale = prepared.scaleById.get(r.boulder.gradeScaleId);
  const total = feelTotal(r.feel);
  let dominant: SetterRouteRow['dominantFeel'] = null;
  if (total >= REPORT_MIN_FEEL_VOTES) {
    if (r.feel.stiff > r.feel.fair && r.feel.stiff > r.feel.soft) dominant = 'stiff';
    else if (r.feel.soft > r.feel.fair && r.feel.soft > r.feel.stiff) dominant = 'soft';
    else dominant = 'fair';
  }
  const name = r.boulder.name?.trim();
  return {
    boulderId: r.boulder.id,
    label: name || 'Ohne Name',
    hasName: !!name,
    colorName: scale?.colorName || '',
    colorHex: scale?.colorHex,
    sectorName: prepared.sectorById.get(r.boulder.sectorId)?.name || '',
    status: r.boulder.status,
    archivedAt: r.boulder.archivedAt,
    since: r.since,
    ascents: r.flashes + r.tops,
    flashes: r.flashes,
    tops: r.tops,
    projects: r.projects,
    ratings: r.stars.length,
    avgStars: r.stars.length >= REPORT_MIN_RATINGS ? round1(mean(r.stars) as number) : null,
    feel: r.feel,
    feelTotal: total,
    dominantFeel: dominant,
    // Nur Text und Datum: keine Namen, keine Profilbilder (§7)
    comments: comments
      .filter(c => c.boulderId === r.boulder.id && c.text?.trim())
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, REPORT_COMMENT_LIMIT)
      .map(c => ({ id: c.id, text: c.text, createdAt: c.createdAt })),
  };
}

export function computeSetterDetail(setterId: string, input: SetterReportInput): SetterDetail | null {
  const prepared = prepare(input);
  const id = normalizeSetterId(setterId);
  const list = prepared.routes.filter(r => r.setterId === id);
  if (list.length === 0) return null;
  const comments = input.comments ?? getComments();

  const routes = list
    .map(r => routeRow(r, prepared, comments))
    .sort((a, b) => b.since - a.since);

  const favorite = routes
    .filter(r => r.avgStars !== null && r.avgStars >= TOP_RATED_MIN_STARS)
    .sort((a, b) => (b.avgStars as number) - (a.avgStars as number) || b.ratings - a.ratings)[0] || null;

  const colors: SetterColorRow[] = prepared.gradeScales
    .map(scale => {
      const inColor = list.filter(r => r.boulder.gradeScaleId === scale.id);
      if (inColor.length === 0) return null;
      const stars = inColor.flatMap(r => r.stars);
      const feel = sumFeel(inColor);
      const total = feelTotal(feel);
      let tendency: ColorTendency = null;
      if (total >= REPORT_MIN_FEEL_VOTES) {
        if (feel.stiff / total >= REPORT_TENDENCY_SHARE) tendency = 'stiff';
        else if (feel.soft / total >= REPORT_TENDENCY_SHARE) tendency = 'soft';
      }
      const hall = colorBaseline(prepared, scale.id, id, 'stars');
      return {
        scaleId: scale.id,
        colorName: scale.colorName,
        colorHex: scale.colorHex,
        routes: inColor.length,
        avgStars: stars.length >= REPORT_MIN_RATINGS ? round1(mean(stars) as number) : null,
        hallStars: hall === null ? null : round1(hall),
        feel,
        feelTotal: total,
        tendency,
      };
    })
    .filter((c): c is SetterColorRow => c !== null);

  return { summary: summarize(id, list, prepared), favorite, colors, routes };
}
