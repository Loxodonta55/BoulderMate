// SPEC-052 F5/F6: Aus dem geprüften KI-Ergebnis wird ein Plan:
// welche Routen neu angelegt, welche alten behalten und welche archiviert werden.
// Grundsatz: im Zweifel bleibt die alte Route (Begehungen gehen nie verloren).
import { REVIEW_CONFIDENCE } from './schema';
import type { NamedRoute } from './names';
import type { AiPublishMode, CaptureMode, CaptureResult, CapturedRoute, ExistingRoute } from './types';

/** Abstand (Anteil der Bildbreite/-höhe), bis zu dem eine alte Route als «gleich geblieben» gilt */
export const MATCH_DISTANCE = 0.04;
/** Abstand, ab dem eine unsichere neue Route nicht mehr «vielleicht die alte» ist */
export const UNSURE_MATCH_DISTANCE = 0.08;

export type ReviewReason = 'grade' | 'unsure' | 'uncertain_match' | 'old_not_seen';

export interface PlannedCreate {
  index: number;
  route: CapturedRoute;
  name: string;
  nameSource: NamedRoute['nameSource'];
  status: 'active' | 'draft';
  reviewReasons: ReviewReason[];
}

export interface PlannedReview {
  reason: ReviewReason;
  /** Index der neuen Route (falls vorhanden) */
  index?: number;
  existingId?: string;
}

export interface CapturePlan {
  create: PlannedCreate[];
  keep: string[];
  archive: string[];
  review: PlannedReview[];
}

export interface BuildPlanInput {
  result: CaptureResult;
  names: NamedRoute[];
  mode: CaptureMode;
  existing: ExistingRoute[];
  publishMode: AiPublishMode;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export function buildCapturePlan({ result, names, mode, existing, publishMode }: BuildPlanInput): CapturePlan {
  const status = publishMode === 'review' ? 'draft' : 'active';
  const create: PlannedCreate[] = [];
  const review: PlannedReview[] = [];
  const keep = new Set<string>();
  const archive = new Set<string>();

  const pushCreate = (index: number) => {
    const route = result.routes[index];
    const reasons = route.reviewReasons.filter((r): r is ReviewReason => r === 'grade' || r === 'unsure');
    create.push({ index, route, name: names[index]?.name ?? '', nameSource: names[index]?.nameSource ?? null, status, reviewReasons: reasons });
    for (const reason of reasons) review.push({ reason, index });
  };

  if (mode !== 'partial') {
    result.routes.forEach((_, i) => pushCreate(i));
    if (mode === 'full') existing.forEach(e => archive.add(e.id));
    return { create, keep: [], archive: [...archive], review };
  }

  // --- Teil-Umbau ---
  const removed = new Set(result.removedExistingIds);
  const matched = new Set<string>();
  const unmatchedIdx: number[] = [];

  result.routes.forEach((r, i) => {
    if (r.matchesExistingId) {
      matched.add(r.matchesExistingId);
      keep.add(r.matchesExistingId);
      if (r.confidence < REVIEW_CONFIDENCE) review.push({ reason: 'uncertain_match', index: i, existingId: r.matchesExistingId });
    } else {
      unmatchedIdx.push(i);
    }
  });

  const free = () => existing.filter(e => !matched.has(e.id));

  for (const i of unmatchedIdx) {
    const r = result.routes[i];
    // Geometrische Rückfallebene: gleiche Farbe, fast gleiche Stelle → gleich geblieben
    const byDistance = free()
      .filter(e => !removed.has(e.id))
      .map(e => ({ e, d: dist(e, r) }))
      .sort((a, b) => a.d - b.d);
    const sameColor = byDistance.find(c => r.gradeScaleId === null || c.e.gradeScaleId === r.gradeScaleId);
    if (sameColor && sameColor.d <= MATCH_DISTANCE) {
      matched.add(sameColor.e.id);
      keep.add(sameColor.e.id);
      continue;
    }
    // Unsicher und eine alte Route (egal welche Farbe) liegt in der Nähe → alte bleibt, neue wird nicht angelegt
    const nearest = byDistance[0];
    if (r.confidence < REVIEW_CONFIDENCE && nearest && nearest.d <= UNSURE_MATCH_DISTANCE) {
      matched.add(nearest.e.id);
      keep.add(nearest.e.id);
      review.push({ reason: 'uncertain_match', index: i, existingId: nearest.e.id });
      continue;
    }
    pushCreate(i);
  }

  for (const e of existing) {
    if (matched.has(e.id)) continue;
    if (removed.has(e.id)) archive.add(e.id);
    else {
      // KI hat die alte Route weder gesehen noch als entfernt gemeldet → bleibt, kurz prüfen
      keep.add(e.id);
      review.push({ reason: 'old_not_seen', existingId: e.id });
    }
  }

  return { create, keep: [...keep], archive: [...archive], review };
}
