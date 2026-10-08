import { Ascent, BoulderStatsAggregate, GymGradeScale, WallBoulder } from '../types/boulder';

/**
 * SPEC-022 F4/F5 · Filter und Sortierung der Kletterer-Wand als reine Funktionen.
 */
export type ClimberWallFilter = 'all' | 'open' | 'new' | 'top_rated';

export const TOP_RATED_MIN_STARS = 4.0;
export const CLASSIC_MIN_STARS = 4.8;

export interface ClimberWallFilterContext {
  userAscentMap: Map<string, Ascent | null | undefined>;
  statsMap: Map<string, BoulderStatsAggregate>;
  newBoulderIds: Set<string>;
}

/** «Offen» = vom Kletterer noch nicht getoppt oder geflasht (Projekte zählen als offen). */
export function isOpenForClimber(ascent?: Ascent | null): boolean {
  return !ascent || ascent.type === 'project';
}

export function filterClimberBoulders<T extends WallBoulder>(
  boulders: T[],
  filter: ClimberWallFilter,
  ctx: ClimberWallFilterContext
): T[] {
  switch (filter) {
    case 'open':
      return boulders.filter(b => isOpenForClimber(ctx.userAscentMap.get(b.id)));
    case 'new':
      return boulders.filter(b => ctx.newBoulderIds.has(b.id));
    case 'top_rated':
      return boulders.filter(b => (ctx.statsMap.get(b.id)?.avgStars || 0) >= TOP_RATED_MIN_STARS);
    default:
      return [...boulders];
  }
}

/** Feste Sortierung: Hallenfarben-Reihenfolge (leicht → schwer), danach Name. */
export function sortByDifficulty<T extends WallBoulder>(
  boulders: T[],
  resolveScale: (b: T) => GymGradeScale | undefined
): T[] {
  return [...boulders].sort((a, b) => {
    const sa = resolveScale(a)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const sb = resolveScale(b)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return (a.name || '').localeCompare(b.name || '', 'de');
  });
}

/** Grad-Text für Liste und Sheet: «6a–6b», sonst Schwierigkeitslabel. */
export function formatGrade(scale?: GymGradeScale, fallback?: string): string {
  if (!scale) return fallback || '';
  if (scale.fontRangeMin && scale.fontRangeMax) {
    return scale.fontRangeMin === scale.fontRangeMax
      ? scale.fontRangeMin
      : `${scale.fontRangeMin}–${scale.fontRangeMax}`;
  }
  return scale.difficultyLabel || fallback || '';
}
