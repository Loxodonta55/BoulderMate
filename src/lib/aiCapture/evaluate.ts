// SPEC-052 F11: Qualitäts-Tor. Vergleicht das KI-Ergebnis mit den von Hand
// eingetragenen Routen eines Sektors. Nicht bewertete Merkmale (alle 3 bzw. leer)
// zählen nicht als Fehler.
import type { RadarAttributes } from '../../types/boulder';

export const RADAR_AXES = ['maximalkraft', 'kraftausdauer', 'technik', 'balance', 'koordination', 'flexibilitaet'] as const;

export interface RefRoute {
  id: string;
  x: number;
  y: number;
  gradeScaleId: string;
  name?: string;
  radar?: Partial<RadarAttributes> | null;
}

export interface AiRouteForEval {
  x: number;
  y: number;
  gradeScaleId: string | null;
  radar?: Partial<RadarAttributes> | null;
  name?: string;
}

export interface EvalOptions {
  /** Höchster Abstand eines Treffers (in Bildhöhen, Breite über aspect umgerechnet) */
  maxDist?: number;
  /** Bildbreite / Bildhöhe des aufrechten Fotos */
  aspect?: number;
}

export interface EvalPair { refIndex: number; aiIndex: number; dist: number; sameGrade: boolean | null }

export interface EvalReport {
  refCount: number;
  aiCount: number;
  matched: number;
  /** gefundene Routen / Hans' Routen */
  foundRate: number;
  /** KI-Routen ohne Gegenstück / KI-Routen (kann auch eine Route sein, die Hans nicht eingetragen hat) */
  extraRate: number;
  /** gleiche Farbe / Treffer mit gelesener Farbe */
  gradeRate: number;
  gradePending: number;
  meanDist: number;
  /** Treffer, bei denen Hans Merkmale bewertet hat */
  radarRated: number;
  /** mittlere Abweichung je Merkmal (1–5-Skala), null wenn nichts bewertet */
  radarMae: number | null;
  /** Anteil Merkmale mit Abweichung ≤ 1 */
  radarWithin1: number | null;
  pairs: EvalPair[];
  missedRefIndexes: number[];
  extraAiIndexes: number[];
}

/** true, wenn Hans die Merkmale dieser Route wirklich bewertet hat (nicht alles 3/leer). */
export function isRadarRated(radar?: Partial<RadarAttributes> | null): boolean {
  if (!radar) return false;
  return RADAR_AXES.some(k => typeof radar[k] === 'number' && radar[k] !== 3);
}

export function compareWithReference(ai: AiRouteForEval[], ref: RefRoute[], opts: EvalOptions = {}): EvalReport {
  const maxDist = opts.maxDist ?? 0.08;
  const aspect = opts.aspect ?? 1;
  const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);

  // Alle möglichen Paare, gleiche Farbe leicht bevorzugt, dann gierig zuordnen
  const candidates: (EvalPair & { cost: number })[] = [];
  ai.forEach((a, aiIndex) => ref.forEach((r, refIndex) => {
    const dist = d(a, r);
    if (dist > maxDist) return;
    const sameGrade = a.gradeScaleId === null ? null : a.gradeScaleId === r.gradeScaleId;
    candidates.push({ refIndex, aiIndex, dist, sameGrade, cost: dist + (sameGrade === false ? maxDist / 2 : 0) });
  }));
  candidates.sort((p, q) => p.cost - q.cost);

  const usedAi = new Set<number>();
  const usedRef = new Set<number>();
  const pairs: EvalPair[] = [];
  for (const c of candidates) {
    if (usedAi.has(c.aiIndex) || usedRef.has(c.refIndex)) continue;
    usedAi.add(c.aiIndex);
    usedRef.add(c.refIndex);
    pairs.push({ refIndex: c.refIndex, aiIndex: c.aiIndex, dist: c.dist, sameGrade: c.sameGrade });
  }

  const graded = pairs.filter(p => p.sameGrade !== null);
  let radarRated = 0;
  let absSum = 0;
  let within1 = 0;
  let axisCount = 0;
  for (const p of pairs) {
    const rr = ref[p.refIndex].radar;
    const ar = ai[p.aiIndex].radar;
    if (!isRadarRated(rr) || !ar) continue;
    radarRated++;
    for (const k of RADAR_AXES) {
      const rv = rr?.[k];
      const av = ar[k];
      if (typeof rv !== 'number' || typeof av !== 'number') continue;
      const diff = Math.abs(rv - av);
      absSum += diff;
      if (diff <= 1) within1++;
      axisCount++;
    }
  }

  const ratio = (a: number, b: number) => (b === 0 ? 0 : a / b);
  return {
    refCount: ref.length,
    aiCount: ai.length,
    matched: pairs.length,
    foundRate: ratio(pairs.length, ref.length),
    extraRate: ratio(ai.length - pairs.length, ai.length),
    gradeRate: ratio(graded.filter(p => p.sameGrade).length, graded.length),
    gradePending: pairs.length - graded.length,
    meanDist: ratio(pairs.reduce((s, p) => s + p.dist, 0), pairs.length),
    radarRated,
    radarMae: axisCount ? absSum / axisCount : null,
    radarWithin1: axisCount ? within1 / axisCount : null,
    pairs,
    missedRefIndexes: ref.map((_, i) => i).filter(i => !usedRef.has(i)),
    extraAiIndexes: ai.map((_, i) => i).filter(i => !usedAi.has(i)),
  };
}

export interface GateResult { passed: boolean; foundRate: number; gradeRate: number; extraRate: number }

/** Summe über mehrere Sektoren und Prüfung gegen die Schwellen aus F11. */
export function summarizeReports(reports: EvalReport[]): GateResult & { refCount: number; aiCount: number; matched: number } {
  const refCount = reports.reduce((s, r) => s + r.refCount, 0);
  const aiCount = reports.reduce((s, r) => s + r.aiCount, 0);
  const matched = reports.reduce((s, r) => s + r.matched, 0);
  const graded = reports.reduce((s, r) => s + (r.matched - r.gradePending), 0);
  const gradeHits = reports.reduce((s, r) => s + Math.round(r.gradeRate * (r.matched - r.gradePending)), 0);
  const foundRate = refCount ? matched / refCount : 0;
  const gradeRate = graded ? gradeHits / graded : 0;
  const extraRate = aiCount ? (aiCount - matched) / aiCount : 0;
  return {
    refCount, aiCount, matched, foundRate, gradeRate, extraRate,
    passed: foundRate >= 0.9 && gradeRate >= 0.95 && extraRate <= 0.05,
  };
}
