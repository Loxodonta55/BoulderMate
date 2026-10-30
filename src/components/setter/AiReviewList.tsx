import React, { useState } from 'react';
import { Check, MapPin, Palette, Trash2, Archive, X } from 'lucide-react';
import type { GymGradeScale, WallBoulder } from '../../types/boulder';
import {
  REVIEW_REASON_TEXT,
  handleIssue,
  resolveReview,
  type ReviewItem,
  type RouteIssue,
} from '../../lib/aiCapture/aiCaptureService';
import { updateBoulderDetails } from '../../lib/batchBoulderService';

/**
 * SPEC-052 F3/F8: «Kurz prüfen» – Liste ohne Rot, je Eintrag Grund und große Knöpfe.
 * Passt · Farbe ändern · Löschen · Pin setzen; bei «abgeschraubt?»: Abgeschraubt · Bleibt.
 */
export const AiReviewList: React.FC<{
  items: ReviewItem[];
  missing: RouteIssue[];
  gradeScales: GymGradeScale[];
  onClose: () => void;
  onOpenBoulder: (boulder: WallBoulder) => void;
}> = ({ items, missing, gradeScales, onClose, onOpenBoulder }) => {
  const [colorFor, setColorFor] = useState<string | null>(null);
  const btn = 'min-h-[48px] px-3 rounded-xl border-2 border-[var(--bm-line)] bg-[var(--bm-elevated)] text-[16px] font-semibold flex items-center gap-1.5';

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="ai-review-title" data-testid="ai-review-list">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--bm-surface)] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <h2 id="ai-review-title" className="flex-1 text-[22px] font-bold">Kurz prüfen</h2>
          <button type="button" onClick={onClose} aria-label="Schliessen" className="w-12 h-12 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center" data-testid="ai-review-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {items.length === 0 && missing.length === 0 && (
          <p className="text-[17px]">Alles geprüft.</p>
        )}

        <ul className="space-y-3">
          {items.map(({ boulder, reasons }) => {
            const scale = gradeScales.find(s => s.id === boulder.gradeScaleId);
            const gone = reasons.includes('gone') || reasons.includes('old_not_seen');
            return (
              <li key={boulder.id} className="rounded-xl border-2 border-[var(--bm-line)] p-3 space-y-2" data-testid={`ai-review-item-${boulder.id}`}>
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full border-2 border-black shrink-0 flex items-center justify-center text-[15px] font-black"
                    style={{ backgroundColor: boulder.gradePending ? '#ffffff' : scale?.colorHex ?? '#9ca3af', color: '#000' }}
                    aria-hidden
                  >
                    {boulder.gradePending ? '?' : ''}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold truncate">{boulder.name || scale?.colorName || 'Route'}</p>
                    <p className="text-[15px] text-[var(--bm-text-2)]">
                      {[
                        boulder.holdColor ? `Griffe ${boulder.holdColor}` : null,
                        Number.isFinite(boulder.positionX) && Number.isFinite(boulder.positionY)
                          ? `${boulder.positionX < 0.33 ? 'links' : boulder.positionX > 0.66 ? 'rechts' : 'Mitte'} ${boulder.positionY < 0.33 ? 'oben' : boulder.positionY > 0.66 ? 'unten' : 'mittig'}`
                          : null,
                        ...reasons.map(r => REVIEW_REASON_TEXT[r]),
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {colorFor === boulder.id ? (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Farbe wählen">
                    {gradeScales.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        data-testid={`ai-review-color-${s.id}`}
                        onClick={() => {
                          updateBoulderDetails(boulder.id, { gradeScaleId: s.id, gradePending: false, aiReview: [] });
                          setColorFor(null);
                        }}
                        className="min-h-[48px] px-3 rounded-xl border-2 border-black text-[16px] font-semibold flex items-center gap-2 bg-[var(--bm-elevated)]"
                      >
                        <span className="w-6 h-6 rounded-full border-2 border-black" style={{ backgroundColor: s.colorHex }} aria-hidden />
                        {s.colorName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {gone ? (
                      <>
                        <button type="button" className={btn} onClick={() => resolveReview(boulder.id, 'archive')} data-testid={`ai-review-archive-${boulder.id}`}>
                          <Archive className="w-5 h-5" aria-hidden /> Abgeschraubt
                        </button>
                        <button type="button" className={btn} onClick={() => resolveReview(boulder.id, 'keep')} data-testid={`ai-review-keep-${boulder.id}`}>
                          <Check className="w-5 h-5" aria-hidden /> Bleibt
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className={btn} onClick={() => resolveReview(boulder.id, 'ok')} data-testid={`ai-review-ok-${boulder.id}`}>
                          <Check className="w-5 h-5" aria-hidden /> Passt
                        </button>
                        <button type="button" className={btn} onClick={() => setColorFor(boulder.id)} data-testid={`ai-review-recolor-${boulder.id}`}>
                          <Palette className="w-5 h-5" aria-hidden /> Farbe ändern
                        </button>
                        <button type="button" className={btn} onClick={() => resolveReview(boulder.id, 'delete')} data-testid={`ai-review-delete-${boulder.id}`}>
                          <Trash2 className="w-5 h-5" aria-hidden /> Löschen
                        </button>
                      </>
                    )}
                    <button type="button" className={btn} onClick={() => onOpenBoulder(boulder)} data-testid={`ai-review-pin-${boulder.id}`}>
                      <MapPin className="w-5 h-5" aria-hidden /> Pin setzen
                    </button>
                  </div>
                )}
              </li>
            );
          })}

          {missing.map(issue => (
            <li key={issue.id} className="rounded-xl border-2 border-[var(--bm-line)] p-3 space-y-2" data-testid={`ai-review-missing-${issue.id}`}>
              <p className="text-[17px] font-semibold">Kletterer: «Hier fehlt eine Route»</p>
              {issue.x !== undefined && issue.y !== undefined && (
                <p className="text-[15px] text-[var(--bm-text-2)]">
                  Stelle: {issue.x < 0.33 ? 'links' : issue.x > 0.66 ? 'rechts' : 'Mitte'}, {issue.y < 0.33 ? 'oben' : issue.y > 0.66 ? 'unten' : 'mittig'}
                </p>
              )}
              <button type="button" className={btn} onClick={() => handleIssue(issue.id)} data-testid={`ai-review-missing-done-${issue.id}`}>
                <Check className="w-5 h-5" aria-hidden /> Erledigt
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
