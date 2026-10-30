// SPEC-052: KI-Felder einer Route zwischen Supabase-Zeile und App-Objekt übertragen.
// Wichtig: Manuelle Routen schicken diese Spalten NIE mit – so läuft der Sync auch,
// solange die SPEC-052-Migration noch nicht eingespielt ist.
import type { WallBoulder } from '../../types/boulder';

type AiFields = Pick<WallBoulder, 'captureSource' | 'aiConfidence' | 'holdColor' | 'gradePending' | 'nameSource' | 'radarSource' | 'aiRunId' | 'aiReview'>;

/** Supabase-Zeile → KI-Felder (leer bei manuellen Routen bzw. ohne Migration). */
export function aiFieldsFromRow(row: Record<string, unknown>, existing?: Partial<WallBoulder>): AiFields {
  const reviewed = Array.isArray(row.ai_review) && row.ai_review.length > 0;
  if (row.capture_source !== 'ai' && !row.hold_color && row.grade_pending !== true && !reviewed) {
    // Lokal von Hand geänderte Griff-Farbe behalten, falls die Zeile die Spalte nicht kennt
    return existing?.captureSource === 'ai' && !('capture_source' in row)
      ? pickAi(existing)
      : {};
  }
  return {
    captureSource: row.capture_source === 'ai' ? 'ai' : 'manual',
    aiConfidence: typeof row.ai_confidence === 'number' ? row.ai_confidence : undefined,
    holdColor: typeof row.hold_color === 'string' && row.hold_color ? row.hold_color : undefined,
    gradePending: row.grade_pending === true || undefined,
    nameSource: (row.name_source as AiFields['nameSource']) || undefined,
    radarSource: (row.radar_source as AiFields['radarSource']) || undefined,
    aiRunId: typeof row.ai_run_id === 'string' ? row.ai_run_id : undefined,
    aiReview: Array.isArray(row.ai_review) && row.ai_review.length ? (row.ai_review as string[]) : undefined,
  };
}

function pickAi(b: Partial<WallBoulder>): AiFields {
  const { captureSource, aiConfidence, holdColor, gradePending, nameSource, radarSource, aiRunId, aiReview } = b;
  return { captureSource, aiConfidence, holdColor, gradePending, nameSource, radarSource, aiRunId, aiReview };
}

/** App-Objekt → Spalten für den Upsert (nur bei KI-Routen oder gesetzter Griff-Farbe). */
export function aiFieldsToRow(b: Partial<WallBoulder>): Record<string, unknown> {
  if (b.captureSource !== 'ai' && !b.holdColor && !b.aiReview) return {};
  return {
    capture_source: b.captureSource ?? 'manual',
    ai_confidence: b.aiConfidence ?? null,
    hold_color: b.holdColor ?? null,
    grade_pending: b.gradePending === true,
    name_source: b.nameSource ?? 'setter',
    radar_source: b.radarSource ?? 'setter',
    ai_run_id: b.aiRunId ?? null,
    ai_review: b.aiReview && b.aiReview.length ? b.aiReview : null,
  };
}

/** Merkmale gelten als «geschätzt», solange sie von der KI stammen. */
export const isRadarEstimated = (b: Partial<WallBoulder>) => b.radarSource === 'ai';
