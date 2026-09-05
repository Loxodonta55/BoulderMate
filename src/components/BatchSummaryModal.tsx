import React from 'react';
import { WallBoulder, GymGradeScale, Sector } from '../types/boulder';
import { X, Sparkles, Archive, Rocket, Camera, CheckCircle2 } from 'lucide-react';

interface BatchSummaryModalProps {
  isOpen: boolean;
  sector: Sector | null;
  draftBoulders: WallBoulder[];
  archivedBoulders: WallBoulder[];
  gradeScales: GymGradeScale[];
  hasPhotoUpdated: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  isPublishing?: boolean;
}

export const BatchSummaryModal: React.FC<BatchSummaryModalProps> = ({
  isOpen,
  sector,
  draftBoulders,
  archivedBoulders,
  gradeScales,
  hasPhotoUpdated,
  onClose,
  onConfirmPublish,
  isPublishing = false,
}) => {
  if (!isOpen || !sector) return null;

  const scaleMap = new Map<string, GymGradeScale>();
  gradeScales.forEach(s => scaleMap.set(s.id, s));

  // Count drafts per color
  const draftCountsByScale: Record<string, number> = {};
  draftBoulders.forEach(b => {
    draftCountsByScale[b.gradeScaleId] = (draftCountsByScale[b.gradeScaleId] || 0) + 1;
  });

  // Count archives per color
  const archiveCountsByScale: Record<string, number> = {};
  archivedBoulders.forEach(b => {
    archiveCountsByScale[b.gradeScaleId] = (archiveCountsByScale[b.gradeScaleId] || 0) + 1;
  });

  const totalNew = draftBoulders.length;
  const totalArchived = archivedBoulders.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121110]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#181614] border border-[#38332e] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#38332e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#221f1c] text-[#d97706] border border-[#38332e]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-headline uppercase tracking-wider text-[#f4efe6]">Batch-Veröffentlichung</h2>
              <p className="text-xs font-mono text-[#a89f91]">{sector.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78716c] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Overview Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#121110] border border-emerald-600/40 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#221f1c] text-emerald-400 border border-[#38332e]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-mono font-black text-emerald-400">+{totalNew}</p>
                <p className="text-xs font-headline uppercase tracking-wider text-[#d4cdc3]">Neue Boulder</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#121110] border border-red-800/40 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#221f1c] text-red-400 border border-[#38332e]">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-mono font-black text-red-400">-{totalArchived}</p>
                <p className="text-xs font-headline uppercase tracking-wider text-[#d4cdc3]">Archiviert</p>
              </div>
            </div>
          </div>

          {/* Wall Photo Status */}
          <div className="p-3 rounded-xl bg-[#121110] border border-[#38332e] flex items-center gap-2.5 text-xs font-mono text-[#d4cdc3]">
            <Camera className="w-4 h-4 text-[#d97706]" />
            <span>
              Wandfoto:{' '}
              <strong className="text-[#f4efe6]">
                {hasPhotoUpdated ? 'Frisch aktualisiert' : 'Bestehendes Foto beibehalten'}
              </strong>
            </span>
          </div>

          {/* New Boulders Breakdown */}
          {totalNew > 0 ? (
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#a89f91] mb-2">
                Neue Boulder nach Farbe:
              </p>
              <div className="space-y-2">
                {Object.entries(draftCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-xl bg-[#121110] border border-[#38332e] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-sm"
                          style={{ backgroundColor: scale?.colorHex || '#fff' }}
                        />
                        <span className="font-headline uppercase tracking-wider text-sm text-[#f4efe6]">{scale?.colorName || 'Unbekannt'}</span>
                        <span className="text-[#a89f91] font-mono text-[11px]">({scale?.difficultyLabel})</span>
                      </div>
                      <span className="font-bold font-mono text-[#f59e0b] bg-[#221f1c] px-2.5 py-0.5 rounded border border-[#38332e]">
                        {count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-[#78716c] italic">Keine neuen Entwürfe vorhanden.</p>
          )}

          {/* Archived Boulders Breakdown */}
          {totalArchived > 0 && (
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#a89f91] mb-2">
                Als archiviert (abgeschraubt) markiert:
              </p>
              <div className="space-y-2">
                {Object.entries(archiveCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-xl bg-[#121110] border border-[#38332e] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full opacity-60"
                          style={{ backgroundColor: scale?.colorHex || '#fff' }}
                        />
                        <span className="font-headline uppercase tracking-wider text-[#d4cdc3]">{scale?.colorName}</span>
                      </div>
                      <span className="text-red-400 font-mono font-semibold">{count}× entfernt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#221f1c] border border-[#38332e] text-xs font-mono text-[#d4cdc3] leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
            <span>
              Nach dem Klick auf "Jetzt veröffentlichen" sind alle neuen Boulder sofort für alle Kletterer der Halle sichtbar und können geloggt werden.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#38332e] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#221f1c] hover:bg-[#2a2622] text-[#d4cdc3] text-xs font-mono border border-[#38332e] hover:border-[#a89f91] transition"
          >
            ← Zurück zum Bearbeiten
          </button>

          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || (totalNew === 0 && totalArchived === 0)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-[#121110] font-headline uppercase font-bold tracking-wider text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            <Rocket className="w-4 h-4" />
            <span>{isPublishing ? 'Veröffentliche...' : 'Jetzt veröffentlichen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
