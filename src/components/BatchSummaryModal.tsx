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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-none bg-[#2A2A2A] text-[#C9A96E] border border-[#333333]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">Batch-Veröffentlichung</h2>
              <p className="text-xs font-mono text-[#A89F91]">{sector.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[2px] text-[#6B6358] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Overview Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-none bg-[#121212] border border-[#4A5D3A] flex items-center gap-3">
              <div className="p-2.5 rounded-none bg-[#2A2A2A] text-[#4A5D3A] border border-[#333333]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-[#4A5D3A]">+{totalNew}</p>
                <p className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">Neue Boulder</p>
              </div>
            </div>

            <div className="p-4 rounded-none bg-[#121212] border border-[#A0522D] flex items-center gap-3">
              <div className="p-2.5 rounded-none bg-[#2A2A2A] text-[#A0522D] border border-[#333333]">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-[#A0522D]">-{totalArchived}</p>
                <p className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">Archiviert</p>
              </div>
            </div>
          </div>

          {/* Wall Photo Status */}
          <div className="p-3 rounded-none bg-[#121212] border border-[#333333] flex items-center gap-2.5 text-xs font-mono text-[#E8E0D4]">
            <Camera className="w-4 h-4 text-[#C9A96E]" />
            <span>
              Wandfoto:{' '}
              <strong className="text-[#F5F0E8]">
                {hasPhotoUpdated ? 'Frisch aktualisiert' : 'Bestehendes Foto beibehalten'}
              </strong>
            </span>
          </div>

          {/* New Boulders Breakdown */}
          {totalNew > 0 ? (
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A89F91] mb-2">
                Neue Boulder nach Farbe:
              </p>
              <div className="space-y-2">
                {Object.entries(draftCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-none bg-[#121212] border border-[#333333] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-none border border-black/40"
                          style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                        />
                        <span className="font-headline font-bold uppercase tracking-wider text-sm text-[#E8E0D4]">{scale?.colorName || 'Unbekannt'}</span>
                        <span className="text-[#A89F91] font-mono text-[11px]">({scale?.difficultyLabel})</span>
                      </div>
                      <span className="font-bold font-mono text-[#C9A96E] bg-[#2A2A2A] px-2.5 py-0.5 rounded-none border border-[#333333]">
                        {count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-[#6B6358] italic">Keine neuen Entwürfe vorhanden.</p>
          )}

          {/* Archived Boulders Breakdown */}
          {totalArchived > 0 && (
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A89F91] mb-2">
                Als archiviert (abgeschraubt) markiert:
              </p>
              <div className="space-y-2">
                {Object.entries(archiveCountsByScale).map(([scaleId, count]) => {
                  const scale = scaleMap.get(scaleId);
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-none bg-[#121212] border border-[#333333] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-none opacity-60"
                          style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                        />
                        <span className="font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">{scale?.colorName}</span>
                      </div>
                      <span className="text-[#A0522D] font-mono font-semibold">{count}× entfernt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-none bg-[#2A2A2A] border border-[#333333] text-xs font-mono text-[#A89F91] leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#4A5D3A] shrink-0 mt-0.5" />
            <span>
              Nach dem Klick auf "Jetzt veröffentlichen" sind alle neuen Boulder sofort für alle Kletterer der Halle sichtbar und können geloggt werden.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#333333] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[2px] bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] text-xs font-mono border border-[#333333] transition"
          >
            ← Zurück zum Bearbeiten
          </button>

          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || (totalNew === 0 && totalArchived === 0)}
            className="flex-1 py-2.5 px-4 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            <Rocket className="w-4 h-4" />
            <span>{isPublishing ? 'Veröffentliche...' : 'Jetzt veröffentlichen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
