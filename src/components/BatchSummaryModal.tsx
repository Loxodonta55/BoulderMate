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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch-Veröffentlichung</h2>
              <p className="text-xs text-slate-400">{sector.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Overview Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-400">+{totalNew}</p>
                <p className="text-xs text-slate-300 font-medium">Neue Boulder</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-red-400">-{totalArchived}</p>
                <p className="text-xs text-slate-300 font-medium">Archiviert</p>
              </div>
            </div>
          </div>

          {/* Wall Photo Status */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-300">
            <Camera className="w-4 h-4 text-slate-400" />
            <span>
              Wandfoto:{' '}
              <strong className="text-white">
                {hasPhotoUpdated ? 'Frisch aktualisiert' : 'Bestehendes Foto beibehalten'}
              </strong>
            </span>
          </div>

          {/* New Boulders Breakdown */}
          {totalNew > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Neue Boulder nach Farbe:
              </p>
              <div className="space-y-1.5">
                {Object.entries(draftCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: scale?.colorHex || '#fff' }}
                        />
                        <span className="font-semibold text-white">{scale?.colorName || 'Unbekannt'}</span>
                        <span className="text-slate-400">({scale?.difficultyLabel})</span>
                      </div>
                      <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        {count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Keine neuen Entwürfe vorhanden.</p>
          )}

          {/* Archived Boulders Breakdown */}
          {totalArchived > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Als archiviert (abgeschraubt) markiert:
              </p>
              <div className="space-y-1.5">
                {Object.entries(archiveCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full opacity-60"
                          style={{ backgroundColor: scale?.colorHex || '#fff' }}
                        />
                        <span className="text-slate-300">{scale?.colorName}</span>
                      </div>
                      <span className="text-red-400 font-semibold">{count}× entfernt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-blue-400" />
            Nach dem Klick auf "Jetzt veröffentlichen" sind alle neuen Boulder sofort für alle Kletterer der Halle sichtbar und können bewertet werden.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            ← Zurück zum Bearbeiten
          </button>

          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || (totalNew === 0 && totalArchived === 0)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            <Rocket className="w-4 h-4" />
            <span>{isPublishing ? 'Veröffentliche...' : 'Jetzt veröffentlichen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
