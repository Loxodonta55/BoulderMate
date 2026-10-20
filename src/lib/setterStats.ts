import {
  Ascent,
  BoulderComment,
  BoulderRating,
  GradeFeel,
  GymGradeScale,
  RADAR_AXIS_DEFINITIONS,
  RadarAxisKey,
  Sector,
  WallBoulder,
} from '../types/boulder';
import { getGradeScales, getSectors, getWallBoulders } from './batchBoulderService';
import { getAscents, getComments, getRatings, isUserMatch } from './ratingAndAscentService';
import { TOP_RATED_MIN_STARS } from './climberWallFilters';
import { InsightsScope, normalizeSetterId } from './gymInsights';

/**
 * SPEC-044 · Schrauber-Statistik «Meine Routen».
 * Reine Berechnung aus dem lokalen Speicher. Keine Kletterer-Namen (§7),
 * Mindestzahl 3 für Sterne, Grad-Gefühl, Merkmale und Versuche.
 * Vergleich nur mit den Routen der anderen Schrauber in denselben Farben, keine Rangliste.
 */

export const SETTER_STATS_MIN_RATINGS = 3;
export const SETTER_STATS_MIN_TOPS_FOR_ATTEMPTS = 3;
export const SETTER_HINT_LIMIT = 3;
export const SETTER_HINT_DISMISS_DAYS = 14;
export const SETTER_HINT_FEEL_SHARE = 0.6;
export const SETTER_HINT_FLASH_MIN_ASCENTS = 5;
export const SETTER_HINT_FLASH_SHARE = 0.8;
export const SETTER_HINT_UNLOVED_MIN_DAYS = 7;
/** «Kaum geklettert» erst, wenn die anderen in dieser Farbe im Schnitt mindestens 3 Begehungen haben */
export const SETTER_HINT_UNLOVED_MIN_OTHERS_AVG = 3;
export const SETTER_ROUTE_COMMENT_LIMIT = 20;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SetterStatsSort = 'newest' | 'favorite' | 'least';
export type SetterHintKind = 'favorite' | 'hard' | 'easy' | 'flash' | 'unloved';

export interface FeelCounts {
  soft: number;
  fair: number;
  stiff: number;
}

export interface SetterRouteRow {
  boulderId: string;
  sectorId: string;
  /** Name oder leer */
  name: string;
  /** Name, sonst «Farbe · Sektor» */
  label: string;
  colorName: string;
  colorHex?: string;
  scaleId: string;
  sectorName: string;
  status: WallBoulder['status'];
  publishedAt: string;
  archivedAt?: string;
  /** Tage an der Wand (bis heute oder bis zum Abschrauben) */
  daysUp: number;
  flashes: number;
  tops: number;
  projects: number;
  /** Flash + Top */
  ascents: number;
  /** 0..1, null ohne Begehung */
  flashRate: number | null;
  /** Anzahl Sternbewertungen */
  ratingsCount: number;
  /** Ø Sterne, erst ab 3 Bewertungen */
  avgStars: number | null;
  /** fehlende Bewertungen bis zur Mindestzahl */
  missingRatings: number;
  feel: FeelCounts;
  feelTotal: number;
  /** häufigstes Grad-Gefühl, erst ab 3 Angaben */
  dominantFeel: GradeFeel | null;
}

export interface ColorBaseline {
  avgStars: number | null;
  /** 0..1 */
  flashRate: number | null;
}

export interface SetterStats {
  scope: InsightsScope;
  routes: SetterRouteRow[];
  kpis: {
    routes: number;
    ascents: number;
    avgStars: number | null;
    flashRate: number | null;
  };
  /** Andere Schrauber, gleiche Farben, gewichtet nach den eigenen Routen */
  baseline: ColorBaseline;
  /** Ø Begehungen pro Route der anderen Schrauber je Farbe (für «Kaum geklettert») */
  othersAscentsByScale: Record<string, number>;
  /** häufigstes Grad-Gefühl der anderen Schrauber je Farbe */
  othersFeelByScale: Record<string, GradeFeel | null>;
  /** Zuwachs seit dem letzten Öffnen; null beim ersten Mal oder ohne Neues */
  since: { ascents: number; ratings: number; comments: number } | null;
  hasAnyRatings: boolean;
}

export interface SetterStatsInput {
  setterId: string;
  gymId: string;
  scope?: InsightsScope;
  now?: number;
  lastViewedAt?: number | null;
  sectors?: Sector[];
  boulders?: WallBoulder[];
  gradeScales?: GymGradeScale[];
  ascents?: Ascent[];
  ratings?: BoulderRating[];
  comments?: BoulderComment[];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function dominant(feel: FeelCounts): GradeFeel | null {
  const total = feel.soft + feel.fair + feel.stiff;
  if (total === 0) return null;
  if (feel.stiff > feel.fair && feel.stiff > feel.soft) return 'stiff';
  if (feel.soft > feel.fair && feel.soft > feel.stiff) return 'soft';
  return 'fair';
}

/** Gehört die Route dieser Person? (Demo-Schlüssel und Supabase-UUID gelten als gleich) */
export function isOwnRoute(boulder: WallBoulder, setterId: string): boolean {
  if (!boulder.setterId || !setterId) return false;
  return normalizeSetterId(boulder.setterId) === normalizeSetterId(setterId) || isUserMatch(boulder.setterId, setterId);
}

/** Pro Person nur die neueste Begehung (wie computeBoulderStatsAggregate) */
function routeAscents(boulder: WallBoulder, ascents: Ascent[]): Ascent[] {
  return ascents
    .filter(a => a.boulderId === boulder.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .filter((a, i, list) => list.findIndex(x => isUserMatch(x.userId, a.userId)) === i);
}

function starValues(boulder: WallBoulder, ratings: BoulderRating[]): number[] {
  return ratings
    .filter(r => r.boulderId === boulder.id && typeof r.qualityStars === 'number')
    .map(r => r.qualityStars as number);
}

function feelCounts(boulder: WallBoulder, ratings: BoulderRating[]): FeelCounts {
  const feel: FeelCounts = { soft: 0, fair: 0, stiff: 0 };
  for (const r of ratings) {
    if (r.boulderId === boulder.id && r.gradeFeel && feel[r.gradeFeel] !== undefined) feel[r.gradeFeel]++;
  }
  return feel;
}

/**
 * Vergleichswert «andere Schrauber, gleiche Farben»: pro Farbe der eigenen Routen der Schnitt der
 * anderen Routen derselben Farbe, gewichtet mit der Anzahl eigener Routen dieser Farbe.
 * Farben ohne Vergleichswert fallen heraus. Auch genutzt von SPEC-050 (Admin-Detail pro Schrauber).
 */
export function colorWeightedBaseline(
  ownRoutes: WallBoulder[],
  otherRoutes: WallBoulder[],
  ratings: BoulderRating[],
  ascents: Ascent[]
): ColorBaseline {
  const ownByScale = new Map<string, number>();
  ownRoutes.forEach(b => ownByScale.set(b.gradeScaleId, (ownByScale.get(b.gradeScaleId) || 0) + 1));

  let starWeight = 0;
  let starSum = 0;
  let flashWeight = 0;
  let flashSum = 0;
  for (const [scaleId, weight] of ownByScale) {
    const others = otherRoutes.filter(b => b.gradeScaleId === scaleId);
    const stars = mean(others.flatMap(b => starValues(b, ratings)));
    if (stars !== null) {
      starSum += stars * weight;
      starWeight += weight;
    }
    let flashes = 0;
    let tops = 0;
    for (const b of others) {
      for (const a of routeAscents(b, ascents)) {
        if (a.type === 'flash') flashes++;
        else if (a.type === 'top') tops++;
      }
    }
    if (flashes + tops > 0) {
      flashSum += (flashes / (flashes + tops)) * weight;
      flashWeight += weight;
    }
  }
  return {
    avgStars: starWeight > 0 ? round1(starSum / starWeight) : null,
    flashRate: flashWeight > 0 ? flashSum / flashWeight : null,
  };
}

export function computeSetterStats(input: SetterStatsInput): SetterStats {
  const scope = input.scope || 'active';
  const now = input.now ?? Date.now();
  const sectors = input.sectors ?? getSectors(input.gymId);
  const sectorById = new Map(sectors.map(s => [s.id, s]));
  const scales = input.gradeScales ?? getGradeScales(input.gymId);
  const scaleById = new Map(scales.map(s => [s.id, s]));
  const ascents = input.ascents ?? getAscents();
  const ratings = input.ratings ?? getRatings();
  const comments = input.comments ?? getComments();

  const inScope = (input.boulders ?? getWallBoulders()).filter(b =>
    sectorById.has(b.sectorId) && (b.status === 'active' || (scope === 'all' && b.status === 'archived'))
  );
  const own = inScope.filter(b => isOwnRoute(b, input.setterId));
  const others = inScope.filter(b => !isOwnRoute(b, input.setterId));

  const routes: SetterRouteRow[] = own.map(b => {
    const scale = scaleById.get(b.gradeScaleId);
    const sectorName = sectorById.get(b.sectorId)?.name || '';
    const colorName = scale?.colorName || 'Ohne Farbe';
    const list = routeAscents(b, ascents);
    const flashes = list.filter(a => a.type === 'flash').length;
    const tops = list.filter(a => a.type === 'top').length;
    const projects = list.filter(a => a.type === 'project').length;
    const stars = starValues(b, ratings);
    const feel = feelCounts(b, ratings);
    const feelTotal = feel.soft + feel.fair + feel.stiff;
    const publishedAt = b.publishedAt || b.createdAt;
    const until = b.status === 'archived' && b.archivedAt ? Date.parse(b.archivedAt) : now;
    // Platzhalter aus alten Daten zählen als «ohne Name»
    const rawName = b.name?.trim() || '';
    const name = /^unbenannt/i.test(rawName) ? '' : rawName;
    return {
      boulderId: b.id,
      sectorId: b.sectorId,
      name,
      label: name || `${colorName} · ${sectorName}`,
      colorName,
      colorHex: scale?.colorHex,
      scaleId: b.gradeScaleId,
      sectorName,
      status: b.status,
      publishedAt,
      archivedAt: b.archivedAt,
      daysUp: Math.max(0, Math.floor((until - Date.parse(publishedAt)) / DAY_MS)) || 0,
      flashes,
      tops,
      projects,
      ascents: flashes + tops,
      flashRate: flashes + tops > 0 ? flashes / (flashes + tops) : null,
      ratingsCount: stars.length,
      avgStars: stars.length >= SETTER_STATS_MIN_RATINGS ? round1(mean(stars)!) : null,
      missingRatings: Math.max(0, SETTER_STATS_MIN_RATINGS - stars.length),
      feel,
      feelTotal,
      dominantFeel: feelTotal >= SETTER_STATS_MIN_RATINGS ? dominant(feel) : null,
    };
  });

  const allStars = own.flatMap(b => starValues(b, ratings));
  const totalFlashes = routes.reduce((s, r) => s + r.flashes, 0);
  const totalAscents = routes.reduce((s, r) => s + r.ascents, 0);

  const othersAscentsByScale: Record<string, number> = {};
  const othersFeelByScale: Record<string, GradeFeel | null> = {};
  for (const scaleId of new Set(own.map(b => b.gradeScaleId))) {
    const sameColor = others.filter(b => b.gradeScaleId === scaleId);
    if (sameColor.length > 0) {
      othersAscentsByScale[scaleId] =
        sameColor.reduce((s, b) => s + routeAscents(b, ascents).filter(a => a.type !== 'project').length, 0) / sameColor.length;
    }
    const feel: FeelCounts = { soft: 0, fair: 0, stiff: 0 };
    sameColor.forEach(b => {
      const f = feelCounts(b, ratings);
      feel.soft += f.soft;
      feel.fair += f.fair;
      feel.stiff += f.stiff;
    });
    othersFeelByScale[scaleId] = feel.soft + feel.fair + feel.stiff >= SETTER_STATS_MIN_RATINGS ? dominant(feel) : null;
  }

  let since: SetterStats['since'] = null;
  if (input.lastViewedAt) {
    const after = (ts: string) => Date.parse(ts) > input.lastViewedAt!;
    const ownIds = new Set(own.map(b => b.id));
    const counts = {
      ascents: ascents.filter(a => ownIds.has(a.boulderId) && a.type !== 'project' && after(a.createdAt)).length,
      ratings: ratings.filter(r => ownIds.has(r.boulderId) && after(r.updatedAt || r.createdAt)).length,
      comments: comments.filter(c => ownIds.has(c.boulderId) && after(c.createdAt)).length,
    };
    if (counts.ascents + counts.ratings + counts.comments > 0) since = counts;
  }

  return {
    scope,
    routes,
    kpis: {
      routes: routes.length,
      ascents: totalAscents,
      avgStars: allStars.length >= SETTER_STATS_MIN_RATINGS ? round1(mean(allStars)!) : null,
      flashRate: totalAscents > 0 ? totalFlashes / totalAscents : null,
    },
    baseline: colorWeightedBaseline(own, others, ratings, ascents),
    othersAscentsByScale,
    othersFeelByScale,
    since,
    hasAnyRatings: allStars.length > 0 || routes.some(r => r.feelTotal > 0),
  };
}

export function sortSetterRoutes(routes: SetterRouteRow[], sort: SetterStatsSort): SetterRouteRow[] {
  const list = [...routes];
  const newest = (a: SetterRouteRow, b: SetterRouteRow) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (sort === 'favorite') {
    return list.sort((a, b) => {
      if (a.avgStars === null && b.avgStars === null) return b.ratingsCount - a.ratingsCount || newest(a, b);
      if (a.avgStars === null) return 1;
      if (b.avgStars === null) return -1;
      return b.avgStars - a.avgStars || b.ratingsCount - a.ratingsCount;
    });
  }
  if (sort === 'least') {
    return list.sort((a, b) =>
      (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || a.ascents - b.ascents || newest(a, b)
    );
  }
  return list.sort(newest);
}

// ── Hinweise (§6) ───────────────────────────────────────────

export interface SetterHint {
  kind: SetterHintKind;
  boulderId: string;
  /** Schlüssel fürs Ausblenden */
  key: string;
  positive: boolean;
  text: string;
}

export function hintKey(boulderId: string, kind: SetterHintKind): string {
  return `${boulderId}:${kind}`;
}

const HINT_ORDER: SetterHintKind[] = ['hard', 'easy', 'flash', 'unloved'];

function formatStars(v: number): string {
  return v.toFixed(1).replace('.', ',');
}

/** Höchstens 3 Hinweise, mindestens einer positiv (falls vorhanden), einer pro Route; «Erledigt» blendet 14 Tage aus. */
export function computeSetterHints(
  stats: SetterStats,
  options: { now?: number; dismissed?: Record<string, number> } = {}
): SetterHint[] {
  const now = options.now ?? Date.now();
  const dismissed = options.dismissed || {};
  const isDismissed = (key: string) => {
    const at = dismissed[key];
    return typeof at === 'number' && now - at < SETTER_HINT_DISMISS_DAYS * DAY_MS;
  };

  const candidates: (SetterHint & { weight: number })[] = [];
  for (const r of stats.routes) {
    const quote = `‹${r.label}›`;
    if (r.feelTotal >= SETTER_STATS_MIN_RATINGS) {
      if (r.feel.stiff / r.feelTotal >= SETTER_HINT_FEEL_SHARE) {
        candidates.push({ kind: 'hard', boulderId: r.boulderId, key: hintKey(r.boulderId, 'hard'), positive: false, weight: r.feelTotal,
          text: `${quote}: ${r.feel.stiff} von ${r.feelTotal} finden ihn hart für ${r.colorName}` });
      } else if (r.feel.soft / r.feelTotal >= SETTER_HINT_FEEL_SHARE) {
        candidates.push({ kind: 'easy', boulderId: r.boulderId, key: hintKey(r.boulderId, 'easy'), positive: false, weight: r.feelTotal,
          text: `${quote}: ${r.feel.soft} von ${r.feelTotal} finden ihn leicht für ${r.colorName}` });
      }
    }
    if (r.ascents >= SETTER_HINT_FLASH_MIN_ASCENTS && r.flashRate !== null && r.flashRate >= SETTER_HINT_FLASH_SHARE) {
      candidates.push({ kind: 'flash', boulderId: r.boulderId, key: hintKey(r.boulderId, 'flash'), positive: false, weight: r.ratingsCount,
        text: `${quote}: ${r.flashes} von ${r.ascents} Begehungen im ersten Versuch` });
    }
    const othersAvg = stats.othersAscentsByScale[r.scaleId];
    if (r.status === 'active' && r.daysUp >= SETTER_HINT_UNLOVED_MIN_DAYS && othersAvg !== undefined && othersAvg >= SETTER_HINT_UNLOVED_MIN_OTHERS_AVG && r.ascents < othersAvg / 3) {
      candidates.push({ kind: 'unloved', boulderId: r.boulderId, key: hintKey(r.boulderId, 'unloved'), positive: false, weight: r.ratingsCount,
        text: `${quote}: ${r.ascents} ${r.ascents === 1 ? 'Begehung' : 'Begehungen'} in ${r.daysUp} Tagen, ${r.colorName} der anderen im Schnitt ${Math.round(othersAvg)}` });
    }
  }

  const favorite = stats.routes
    .filter(r => r.avgStars !== null && r.avgStars >= TOP_RATED_MIN_STARS)
    .sort((a, b) => b.avgStars! - a.avgStars! || b.ratingsCount - a.ratingsCount)
    .map(r => ({
      kind: 'favorite' as const, boulderId: r.boulderId, key: hintKey(r.boulderId, 'favorite'), positive: true, weight: r.ratingsCount,
      text: `‹${r.label}› mögen die Leute: ${formatStars(r.avgStars!)} ★ aus ${r.ratingsCount} Bewertungen`,
    }))
    .find(h => !isDismissed(h.key));

  const result: SetterHint[] = [];
  const usedRoutes = new Set<string>();
  if (favorite) {
    const { weight: _w, ...hint } = favorite;
    result.push(hint);
    usedRoutes.add(hint.boulderId);
  }
  const checks = candidates
    .filter(c => !isDismissed(c.key))
    .sort((a, b) => HINT_ORDER.indexOf(a.kind) - HINT_ORDER.indexOf(b.kind) || b.weight - a.weight);
  for (const c of checks) {
    if (result.length >= SETTER_HINT_LIMIT) break;
    if (usedRoutes.has(c.boulderId)) continue;
    const { weight: _w, ...hint } = c;
    result.push(hint);
    usedRoutes.add(c.boulderId);
  }
  return result;
}

// ── Route im Detail ─────────────────────────────────────────

export interface SetterRouteDetail {
  row: SetterRouteRow;
  /** häufigstes Grad-Gefühl der anderen Schrauber in dieser Farbe */
  colorFeel: GradeFeel | null;
  /** Median der Versuche bis zum Top, erst ab 3 Tops mit gezählten Versuchen */
  medianAttempts: number | null;
  /** zwei am stärksten bewertete Merkmale, erst ab 3 Bewertungen */
  traits: string[];
  /** Beta ohne Namen, neueste zuerst */
  comments: { id: string; text: string; createdAt: string }[];
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function computeSetterRouteDetail(
  stats: SetterStats,
  boulderId: string,
  input: { boulders?: WallBoulder[]; ascents?: Ascent[]; ratings?: BoulderRating[]; comments?: BoulderComment[] } = {}
): SetterRouteDetail | null {
  const row = stats.routes.find(r => r.boulderId === boulderId);
  if (!row) return null;
  const boulder = (input.boulders ?? getWallBoulders()).find(b => b.id === boulderId);
  if (!boulder) return null;
  const ascents = input.ascents ?? getAscents();
  const ratings = input.ratings ?? getRatings();
  const comments = input.comments ?? getComments();

  // SPEC-035 F4 (Folgeänderung): Versuche nur zusammengefasst
  const attempts = routeAscents(boulder, ascents)
    .filter(a => a.type === 'flash' || (a.type === 'top' && typeof a.attempts === 'number' && a.attempts > 0))
    .map(a => (a.type === 'flash' ? 1 : (a.attempts as number)));
  const medianAttempts = attempts.length >= SETTER_STATS_MIN_TOPS_FOR_ATTEMPTS ? median(attempts) : null;

  const withRadar = ratings.filter(r => r.boulderId === boulderId && r.radar);
  let traits: string[] = [];
  if (withRadar.length >= SETTER_STATS_MIN_RATINGS) {
    traits = RADAR_AXIS_DEFINITIONS
      .map(def => {
        const values = withRadar
          .map(r => r.radar?.[def.key as RadarAxisKey])
          .filter((v): v is number => typeof v === 'number');
        return { label: def.label, avg: mean(values) ?? 0, n: values.length };
      })
      .filter(t => t.n > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 2)
      .map(t => t.label);
  }

  return {
    row,
    colorFeel: stats.othersFeelByScale[row.scaleId] ?? null,
    medianAttempts,
    traits,
    comments: comments
      .filter(c => c.boulderId === boulderId && c.text?.trim())
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, SETTER_ROUTE_COMMENT_LIMIT)
      .map(c => ({ id: c.id, text: c.text, createdAt: c.createdAt })),
  };
}

// ── Lokaler Speicher (pro Gerät und Halle) ──────────────────

const lastViewedKey = (gymId: string) => `bm_setter_stats_last_viewed_${gymId}`;
const dismissedKey = (gymId: string) => `bm_setter_hints_dismissed_${gymId}`;

export function getSetterStatsLastViewed(gymId: string): number | null {
  try {
    const raw = localStorage.getItem(lastViewedKey(gymId));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setSetterStatsLastViewed(gymId: string, at: number): void {
  try {
    localStorage.setItem(lastViewedKey(gymId), String(at));
  } catch {
    /* privat/gesperrt: dann eben ohne «seit letztem Blick» */
  }
}

export function getDismissedSetterHints(gymId: string): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(dismissedKey(gymId)) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function dismissSetterHint(gymId: string, key: string, at: number = Date.now()): Record<string, number> {
  const next = { ...getDismissedSetterHints(gymId), [key]: at };
  try {
    localStorage.setItem(dismissedKey(gymId), JSON.stringify(next));
  } catch {
    /* ignorieren */
  }
  return next;
}

// ── Texte ───────────────────────────────────────────────────

export const FEEL_WORD: Record<GradeFeel, string> = { soft: 'leicht', fair: 'passt', stiff: 'hart' };

export function formatPercent(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * 100)} %`;
}

export function formatStarValue(v: number | null): string {
  return v === null ? '–' : formatStars(v);
}
