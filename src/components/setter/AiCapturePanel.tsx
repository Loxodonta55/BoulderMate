import React, { useEffect, useRef, useState } from 'react';
import { Camera, ClipboardCheck, Loader2, RotateCcw, WifiOff, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { GymGradeScale, Sector, WallBoulder } from '../../types/boulder';
import type { CaptureMode, GradeMarker } from '../../lib/aiCapture/types';
import {
  canUndoCapture,
  captureStatusText,
  countAscentsForJob,
  flushCaptureQueue,
  getGymAiSettings,
  getMissingRouteIssues,
  getReviewItems,
  getSectorCaptureStatus,
  refreshCaptureJobs,
  refreshRouteIssues,
  submitCapture,
  undoCapture,
  type CaptureJob,
} from '../../lib/aiCapture/aiCaptureService';
import { processLocalImageFile } from '../../lib/imageUtils';
import { showToast } from '../ui/Toast';
import { AiReviewList } from './AiReviewList';

/**
 * SPEC-052 F1/F5/F6/F7/F8: Studio-Zeile «KI erfasst Routen» für den gewählten Sektor.
 * Kamera-Knopf → (bei aktiven Routen) Frage «Ganze Wand neu / Nur einzelne Routen» → Foto → fertig.
 * Darunter die Statuszeile (aria-live), «Ergebnis zurücknehmen» und «Kurz prüfen».
 */
/** SPEC-052 F2 v5: zeigt dem Schrauber, wonach die KI sucht (falsche Einstellung fällt so auf) */
const MARKER_TEXT: Record<GradeMarker, string> = {
  holds: 'Farbe der Griffe',
  tape: 'farbigem Zettel am Start',
  symbol: 'Zeichen am Start',
};

export const AiCapturePanel: React.FC<{
  gymId: string;
  sector: Sector;
  boulders: WallBoulder[];
  gradeScales: GymGradeScale[];
  userId: string;
  inRebuild: boolean;
  onOpenBoulder: (boulder: WallBoulder) => void;
}> = ({ gymId, sector, boulders, gradeScales, userId, inRebuild, onOpenBoulder }) => {
  const [version, setVersion] = useState(0);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [undoConfirm, setUndoConfirm] = useState<{ job: CaptureJob; ascents: number } | null>(null);
  const modeRef = useRef<CaptureMode>('new');
  const fileRef = useRef<HTMLInputElement>(null);

  const settings = getGymAiSettings(gymId);
  const activeCount = boulders.filter(b => b.status === 'active').length;
  const status = getSectorCaptureStatus(sector.id);
  const reviewItems = getReviewItems(sector.id);
  const missing = getMissingRouteIssues(sector.id);
  const reviewCount = reviewItems.length + missing.length;
  void version;

  // Neu zeichnen bei Änderungen; Aufträge regelmäßig nachladen, solange einer läuft
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const onOnline = () => { flushCaptureQueue().then(bump); };
    window.addEventListener('bouldermate:ai_capture_updated', bump);
    window.addEventListener('bouldermate:boulders_updated', bump);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('bouldermate:ai_capture_updated', bump);
      window.removeEventListener('bouldermate:boulders_updated', bump);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const pending = status?.kind === 'waiting_network' || (status?.kind === 'job' && (status.job.status === 'queued' || status.job.status === 'running'));
  useEffect(() => {
    if (!settings.enabled) return;
    flushCaptureQueue();
    refreshCaptureJobs(gymId);
    refreshRouteIssues(gymId);
    if (!pending) return;
    const timer = window.setInterval(() => refreshCaptureJobs(gymId), 20_000);
    return () => window.clearInterval(timer);
  }, [gymId, settings.enabled, pending]);

  if (!settings.enabled) return null;

  const startCamera = (mode: CaptureMode) => {
    modeRef.current = mode;
    setIsModeOpen(false);
    fileRef.current?.click();
  };

  const onCameraClick = () => {
    if (activeCount > 0 && !inRebuild) setIsModeOpen(true);
    else startCamera(inRebuild ? 'full' : 'new');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { dataUrl } = await processLocalImageFile(file, 2048, 0.85);
      await submitCapture({ gymId, sectorId: sector.id, mode: modeRef.current, dataUrl, userId });
    } catch (e) {
      showToast({ message: (e as Error).message || 'Foto konnte nicht gelesen werden.' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const askUndo = (job: CaptureJob) => {
    const ascents = countAscentsForJob(job);
    if (ascents > 0) setUndoConfirm({ job, ascents });
    else doUndo(job);
  };

  const doUndo = async (job: CaptureJob) => {
    setUndoConfirm(null);
    await undoCapture(job);
    showToast({ message: 'KI-Ergebnis zurückgenommen.' });
  };

  const StatusIcon = !status ? null
    : status.kind === 'waiting_network' ? WifiOff
    : status.kind === 'failed_local' ? AlertTriangle
    : status.job.status === 'failed' ? AlertTriangle
    : status.job.status === 'done' ? CheckCircle2
    : status.job.status === 'queued' ? Clock
    : Loader2;

  return (
    <div className="rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] p-3 space-y-3" data-testid="ai-capture-panel">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCameraClick}
          disabled={busy}
          data-testid={`ai-capture-btn-${sector.id}`}
          aria-label={`Foto für Sektor ${sector.name}`}
          className="min-h-[56px] min-w-[56px] px-5 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-bold flex items-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden /> : <Camera className="w-6 h-6" aria-hidden />}
          <span>Foto</span>
          <span className="text-[15px] font-semibold opacity-90">· KI trägt die Routen ein</span>
        </button>
        {reviewCount > 0 && (
          <button
            type="button"
            onClick={() => setIsReviewOpen(true)}
            data-testid={`ai-review-count-${sector.id}`}
            className="min-h-[56px] px-4 rounded-xl bg-[var(--bm-elevated)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center gap-2"
          >
            <ClipboardCheck className="w-6 h-6" aria-hidden />
            <span>Kurz prüfen</span>
            <span className="min-w-[28px] h-7 px-2 rounded-full bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[15px] font-bold flex items-center justify-center tabular-nums">
              {reviewCount}
            </span>
          </button>
        )}
      </div>

      <p className="text-[15px] text-[var(--bm-text-2)]">Ganze Wand, gerade davor, ohne Personen, ohne Blitz.</p>
      <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="ai-capture-marker-hint">
        KI liest den Grad an: <strong className="text-[var(--bm-text)]">{MARKER_TEXT[settings.gradeMarker]}</strong>
      </p>

      <div aria-live="polite" data-testid={`ai-capture-status-${sector.id}`}>
        {status && StatusIcon && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 min-w-[200px] flex items-center gap-2 text-[17px] font-semibold text-[var(--bm-text)]">
              <StatusIcon className={`w-6 h-6 shrink-0 ${status.kind === 'job' && status.job.status === 'running' ? 'animate-spin' : ''}`} aria-hidden />
              <span>{captureStatusText(status)}</span>
            </p>
            {status.kind === 'job' && canUndoCapture(status.job) && (
              <button
                type="button"
                onClick={() => askUndo(status.job)}
                data-testid={`ai-capture-undo-${status.job.id}`}
                className="min-h-[48px] px-4 rounded-xl border-2 border-[var(--bm-line)] text-[16px] font-semibold flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" aria-hidden />
                Ergebnis zurücknehmen
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="ai-capture-file"
        onChange={e => onFile(e.target.files?.[0])}
      />

      {isModeOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ai-mode-title" data-testid="ai-capture-mode-dialog">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bm-surface)] p-5 space-y-3">
            <h2 id="ai-mode-title" className="text-[22px] font-bold">Was hast du geschraubt?</h2>
            <p className="text-[16px] text-[var(--bm-text-2)]">Ganze Wand, gerade davor, ohne Personen, ohne Blitz.</p>
            <button type="button" data-testid="ai-capture-mode-full" onClick={() => startCamera('full')}
              className="w-full min-h-[64px] px-4 rounded-xl bg-[var(--bm-elevated)] border-2 border-[var(--bm-line)] text-left">
              <span className="block text-[18px] font-bold">Ganze Wand neu</span>
              <span className="block text-[15px] text-[var(--bm-text-2)]">Alle {activeCount} alten Routen werden abgeschraubt.</span>
            </button>
            <button type="button" data-testid="ai-capture-mode-partial" onClick={() => startCamera('partial')}
              className="w-full min-h-[64px] px-4 rounded-xl bg-[var(--bm-elevated)] border-2 border-[var(--bm-line)] text-left">
              <span className="block text-[18px] font-bold">Nur einzelne Routen neu</span>
              <span className="block text-[15px] text-[var(--bm-text-2)]">Gleiche Routen bleiben mit ihren Tops.</span>
            </button>
            <button type="button" onClick={() => setIsModeOpen(false)} className="w-full min-h-[52px] text-[17px] font-semibold">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {undoConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="ai-undo-title" data-testid="ai-capture-undo-confirm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bm-surface)] p-5 space-y-4">
            <h2 id="ai-undo-title" className="text-[20px] font-bold">
              {undoConfirm.ascents} {undoConfirm.ascents === 1 ? 'Top geht' : 'Tops gehen'} verloren. Trotzdem zurücknehmen?
            </h2>
            <div className="flex gap-3">
              <button type="button" autoFocus onClick={() => setUndoConfirm(null)} data-testid="ai-capture-undo-cancel"
                className="flex-1 min-h-[56px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[17px] font-bold">
                Abbrechen
              </button>
              <button type="button" onClick={() => doUndo(undoConfirm.job)} data-testid="ai-capture-undo-confirm-btn"
                className="flex-1 min-h-[56px] rounded-xl border-2 border-[var(--bm-danger)] text-[var(--bm-danger)] text-[17px] font-bold">
                Zurücknehmen
              </button>
            </div>
          </div>
        </div>
      )}

      {isReviewOpen && (
        <AiReviewList
          items={reviewItems}
          missing={missing}
          gradeScales={gradeScales}
          onClose={() => setIsReviewOpen(false)}
          onOpenBoulder={b => { setIsReviewOpen(false); onOpenBoulder(b); }}
        />
      )}
    </div>
  );
};
