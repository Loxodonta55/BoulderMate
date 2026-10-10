import { Ascent, BoulderRating, GradeFeel, GymGradeScale, Sector, UserProfile, WallBoulder } from '../types/boulder';
import { getGradeScales, getSectors, getWallBoulders } from './batchBoulderService';
import { computeBoulderStatsAggregate, getAscents, getRatings } from './ratingAndAscentService';
import { getProfiles } from './profileService';
import { DEMO_USERS, SUPABASE_UUID_TO_DEMO_KEY } from './authService';
import { getGymTeamMembers } from './roleService';
import { TOP_RATED_MIN_STARS } from './climberWallFilters';

/**
 * SPEC-030 · Hallen-Auswertung für Betreiber (Admin-Tab «Zahlen»).
 * Reine Berechnung aus dem lokalen Speicher (Begehungen und Bewertungen werden vollständig synchronisiert).
 * Zeigt nur Summen, keine Kletterer-Namen (F10).
 */

export type InsightsScope = 'active' | 'all';

export const INSIGHTS_TOP_MIN_RATINGS = 3;
export const INSIGHTS_UNLOVED_MIN_DAYS = 7;
export const INSIGHTS_CLIMBERS_DAYS = 30;
export const INSIGHTS_LIST_LIMIT = 5;
export const UNKNOWN_SETTER_ID = 'unknown';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface InsightsBoulderRow {
  boulderId: string;
  label: string;
  sectorName: string;
  colorHex?: string;
  avgStars: number;
  totalRatings: number;
  ascents: number;
}

export interface InsightsGradeRow {
  scaleId: string;
  colorName: string;
  colorHex: string;
  boulders: number;
  ascents: number;
  avgStars: number | null;
  dominantFeel: GradeFeel | null;
}

export interface InsightsSectorRow {
  sectorId: string;
  name: string;
  boulders: number;
  ascents: number;
  avgStars: number | null;
  /** Tage seit dem Umbau bzw. seit dem ältesten aktiven Boulder; null ohne aktive Boulder */
  ageDays: number | null;
}

export interface InsightsSetterRow {
  setterId: string;
  name: string;
  routes: number;
  topRoutes: number;
  avgStars: number | null;
  ascents: number;
  stiffPercent: number;
  softPercent: number;
}

export interface GymInsights {
  scope: InsightsScope;
  kpis: {
    boulders: number;
    ascents: number;
    climbers30d: number;
    avgStars: number | null;
  };
  grades: InsightsGradeRow[];
  top: InsightsBoulderRow[];
  unloved: InsightsBoulderRow[];
  sectors: InsightsSectorRow[];
  setters: InsightsSetterRow[];
}

/** Demo-UUIDs und Demo-Schlüssel auf eine ID bringen, damit derselbe Schrauber nicht doppelt erscheint */
export function normalizeSetterId(setterId?: string): string {
  if (!setterId) return UNKNOWN_SETTER_ID;
  const id = setterId.trim();
  if (!id || id === 'system' || id === 'setter-system' || id === 'setter-1') return UNKNOWN_SETTER_ID;
  return SUPABASE_UUID_TO_DEMO_KEY[id.toLowerCase()] || id;
}

export function setterDisplayName(setterId: string, profiles: UserProfile[] = getProfiles()): string {
  const id = normalizeSetterId(setterId);
  if (id === UNKNOWN_SETTER_ID) return 'Unbekannt';
  const profile = profiles.find(p => p.id === id || p.id === setterId);
  if (profile?.nickname) return profile.nickname;
  const demo = DEMO_USERS[id];
  if (demo?.nickname) return demo.nickname;
  return 'Unbekannt';
}

/** F8: Auswahl «Geschraubt von» = Hallen-Team (Schrauber und Admins), eine Zeile pro Person */
export function getSetterOptions(gymId: string, profiles: UserProfile[] = getProfiles()): { id: string; name: string }[] {
  const seen = new Set<string>();
  const options: { id: string; name: string }[] = [];
  for (const m of getGymTeamMembers(gymId)) {
    const id = normalizeSetterId(m.user_id);
    if (id === UNKNOWN_SETTER_ID || seen.has(id)) continue;
    seen.add(id);
    options.push({ id, name: setterDisplayName(id, profiles) });
  }
  return options.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round1(values.reduce((s, v) => s + v, 0) / values.length);
}

function dominantFeel(counts: { soft: number; fair: number; stiff: number }): GradeFeel | null {
  const total = counts.soft + counts.fair + counts.stiff;
  if (total === 0) return null;
  if (counts.soft > counts.fair && counts.soft > counts.stiff) return 'soft';
  if (counts.stiff > counts.fair && counts.stiff > counts.soft) return 'stiff';
  return 'fair';
}

export interface GymInsightsInput {
  gymId: string;
  scope?: InsightsScope;
  now?: number;
  sectors?: Sector[];
  boulders?: WallBoulder[];
  gradeScales?: GymGradeScale[];
  ascents?: Ascent[];
  ratings?: BoulderRating[];
  profiles?: UserProfile[];
}

export function computeGymInsights(input: GymInsightsInput): GymInsights {
  const scope = input.scope || 'active';
  const now = input.now ?? Date.now();
  const sectors = input.sectors ?? getSectors(input.gymId);
  const sectorById = new Map(sectors.map(s => [s.id, s]));
  const allBoulders = input.boulders ?? getWallBoulders();
  const gradeScales = [...(input.gradeScales ?? getGradeScales(input.gymId))].sort((a, b) => a.sortOrder - b.sortOrder);
  const scaleById = new Map(gradeScales.map(s => [s.id, s]));
  const ascents = input.ascents ?? getAscents();
  const ratings = input.ratings ?? getRatings();
  const profiles = input.profiles ?? getProfiles();

  const boulders = allBoulders.filter(b =>
    sectorById.has(b.sectorId) &&
    (b.status === 'active' || (scope === 'all' && b.status === 'archived'))
  );

  const rows = boulders.map(b => {
    const agg = computeBoulderStatsAggregate(b, ratings, ascents, []);
    const scale = scaleById.get(b.gradeScaleId);
    const stars = agg.ratings.filter(r => typeof r.qualityStars === 'number').map(r => r.qualityStars as number);
    return { boulder: b, agg, scale, stars, ascentCount: agg.totalTops };
  });

  // Kennzahlen (F3)
  const climberCutoff = now - INSIGHTS_CLIMBERS_DAYS * DAY_MS;
  const climbers = new Set<string>();
  for (const r of rows) {
    for (const a of r.agg.ascents) {
      if ((a.type === 'flash' || a.type === 'top') && Date.parse(a.createdAt) >= climberCutoff) {
        climbers.add(normalizeSetterId(a.userId));
      }
    }
  }
  const allStars = rows.flatMap(r => r.stars);

  const toBoulderRow = (r: typeof rows[number]): InsightsBoulderRow => ({
    boulderId: r.boulder.id,
    label: r.boulder.name?.trim() || r.scale?.colorName || 'Boulder',
    sectorName: sectorById.get(r.boulder.sectorId)?.name || '',
    colorHex: r.scale?.colorHex,
    avgStars: r.agg.avgStars,
    totalRatings: r.stars.length,
    ascents: r.ascentCount,
  });

  // Farben (F4): jede Hallenfarbe, auch mit 0 Bouldern
  const grades: InsightsGradeRow[] = gradeScales.map(scale => {
    const inScale = rows.filter(r => r.boulder.gradeScaleId === scale.id);
    const feel = { soft: 0, fair: 0, stiff: 0 };
    inScale.forEach(r => {
      feel.soft += r.agg.gradeFeelCounts.soft;
      feel.fair += r.agg.gradeFeelCounts.fair;
      feel.stiff += r.agg.gradeFeelCounts.stiff;
    });
    return {
      scaleId: scale.id,
      colorName: scale.colorName,
      colorHex: scale.colorHex,
      boulders: inScale.length,
      ascents: inScale.reduce((s, r) => s + r.ascentCount, 0),
      avgStars: average(inScale.flatMap(r => r.stars)),
      dominantFeel: dominantFeel(feel),
    };
  });

  // Beliebteste / Kaum geklettert (F5)
  const top = rows
    .filter(r => r.stars.length >= INSIGHTS_TOP_MIN_RATINGS)
    .sort((a, b) => b.agg.avgStars - a.agg.avgStars || b.stars.length - a.stars.length)
    .slice(0, INSIGHTS_LIST_LIMIT)
    .map(toBoulderRow);

  const unlovedCutoff = now - INSIGHTS_UNLOVED_MIN_DAYS * DAY_MS;
  const unloved = rows
    .filter(r => r.boulder.status === 'active')
    .filter(r => {
      const since = Date.parse(r.boulder.publishedAt || r.boulder.createdAt);
      return !Number.isNaN(since) && since <= unlovedCutoff;
    })
    .sort((a, b) => a.ascentCount - b.ascentCount || (a.boulder.name || '').localeCompare(b.boulder.name || '', 'de'))
    .slice(0, INSIGHTS_LIST_LIMIT)
    .map(toBoulderRow);

  // Sektoren (F6)
  const sectorRows: InsightsSectorRow[] = [...sectors]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(sector => {
      const inSector = rows.filter(r => r.boulder.sectorId === sector.id);
      const activeTimes = inSector
        .filter(r => r.boulder.status === 'active')
        .map(r => Date.parse(r.boulder.publishedAt || r.boulder.createdAt))
        .filter(t => !Number.isNaN(t));
      const rebuilt = sector.rebuiltAt ? Date.parse(sector.rebuiltAt) : NaN;
      const since = !Number.isNaN(rebuilt) ? rebuilt : activeTimes.length > 0 ? Math.min(...activeTimes) : NaN;
      return {
        sectorId: sector.id,
        name: sector.name,
        boulders: inSector.length,
        ascents: inSector.reduce((s, r) => s + r.ascentCount, 0),
        avgStars: average(inSector.flatMap(r => r.stars)),
        ageDays: Number.isNaN(since) ? null : Math.max(0, Math.floor((now - since) / DAY_MS)),
      };
    });

  // Schrauber (F7)
  const bySetter = new Map<string, typeof rows>();
  for (const r of rows) {
    const id = normalizeSetterId(r.boulder.setterId);
    const list = bySetter.get(id) || [];
    list.push(r);
    bySetter.set(id, list);
  }
  const setters: InsightsSetterRow[] = [...bySetter.entries()]
    .map(([setterId, list]) => {
      const feel = { soft: 0, fair: 0, stiff: 0 };
      list.forEach(r => {
        feel.soft += r.agg.gradeFeelCounts.soft;
        feel.fair += r.agg.gradeFeelCounts.fair;
        feel.stiff += r.agg.gradeFeelCounts.stiff;
      });
      const feelTotal = feel.soft + feel.fair + feel.stiff;
      return {
        setterId,
        name: setterDisplayName(setterId, profiles),
        routes: list.length,
        topRoutes: list.filter(r => r.stars.length > 0 && r.agg.avgStars >= TOP_RATED_MIN_STARS).length,
        avgStars: average(list.flatMap(r => r.stars)),
        ascents: list.reduce((s, r) => s + r.ascentCount, 0),
        stiffPercent: feelTotal ? Math.round((feel.stiff / feelTotal) * 100) : 0,
        softPercent: feelTotal ? Math.round((feel.soft / feelTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.topRoutes - a.topRoutes || b.routes - a.routes || a.name.localeCompare(b.name, 'de'));

  return {
    scope,
    kpis: {
      boulders: rows.length,
      ascents: rows.reduce((s, r) => s + r.ascentCount, 0),
      climbers30d: climbers.size,
      avgStars: average(allStars),
    },
    grades,
    top,
    unloved,
    sectors: sectorRows,
    setters,
  };
}
