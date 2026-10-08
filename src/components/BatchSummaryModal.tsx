import React from 'react';
import { WallBoulder, GymGradeScale, Sector } from '../types/boulder';
import { X, Sparkles, Archive, Rocket, Camera, CheckCircle2, Edit3, Save } from 'lucide-react';

interface BatchSummaryModalProps {
  isOpen: boolean;
  sector: Sector | null;
  draftBoulders: WallBoulder[];
  archivedBoulders: WallBoulder[];
  modifiedBoulders?: WallBoulder[];
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
  modifiedBoulders = [],
  gradeScales,
  hasPhotoUpdated,
  onClose,
  onConfirmPublish,
  isPublishing = false,
}) => {
  if (!isOpen || !sector) return null;

  const scaleMap = new Map<string, GymGradeScale>();
  gradeScales.forEach(s => {
    scaleMap.set(s.id, s);
    if (s.colorName) {
      const colorLower = s.colorName.toLowerCase().trim();
      const colorAscii = colorLower.replace(/ß/g, 'ss');
      scaleMap.set(`scale_6a_${colorAscii}`, s);
      scaleMap.set(`scale_minimum_${colorAscii}`, s);
      scaleMap.set(colorLower, s);
      scaleMap.set(colorAscii, s);
    }
  });

  const resolveScale = (scaleIdOrName?: string): GymGradeScale | undefined => {
    if (!scaleIdOrName) return gradeScales[0];
    if (scaleMap.has(scaleIdOrName)) return scaleMap.get(scaleIdOrName);
    const clean = scaleIdOrName.replace(/^scale_(6a|minimum)_/, '').toLowerCase().trim().replace(/ß/g, 'ss');
    const matched = gradeScales.find(s => s.colorName.toLowerCase().trim().replace(/ß/g, 'ss') === clean);
    return matched || gradeScales[0];
  };

  // Count drafts per color
  const draftCountsByScale: Record<string, { scale: GymGradeScale | undefined; count: number }> = {};
  draftBoulders.forEach(b => {
    const scale = resolveScale(b.gradeScaleId);
    const key = scale?.id || b.gradeScaleId;
    if (!draftCountsByScale[key]) {
      draftCountsByScale[key] = { scale, count: 0 };
    }
    draftCountsByScale[key].count += 1;
  });

  // Count archives per color
  const archiveCountsByScale: Record<string, { scale: GymGradeScale | undefined; count: number }> = {};
  archivedBoulders.forEach(b => {
    const scale = resolveScale(b.gradeScaleId);
    const key = scale?.id || b.gradeScaleId;
    if (!archiveCountsByScale[key]) {
      archiveCountsByScale[key] = { scale, count: 0 };
    }
    archiveCountsByScale[key].count += 1;
  });

  const totalNew = draftBoulders.length;
  const totalArchived = archivedBoulders.length;
  const totalModified = modifiedBoulders.length;
  const totalChanges = totalNew + totalArchived + totalModified;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--bm-line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-line)]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-[var(--bm-text)]">Batch-Veröffentlichung</h2>
              <p className="text-xs font-mono text-[var(--bm-text-2)]">{sector.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--bm-text-3)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Overview Badges */}
          <div className={`grid ${totalModified > 0 ? 'grid-cols-3 gap-2 sm:gap-3' : 'grid-cols-2 gap-3'}`}>
            <div className="p-3 sm:p-4 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-success)] flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-success)] border border-[var(--bm-line)]">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-mono font-bold text-[var(--bm-success)]">+{totalNew}</p>
                <p className="text-[10px] sm:text-xs font-headline font-bold text-[var(--bm-text)]">Neu</p>
              </div>
            </div>

            {totalModified > 0 && (
              <div className="p-3 sm:p-4 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-accent)] flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-line)]">
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-[var(--bm-accent)]">~{totalModified}</p>
                  <p className="text-[10px] sm:text-xs font-headline font-bold text-[var(--bm-text)]">Geändert</p>
                </div>
              </div>
            )}

            <div className="p-3 sm:p-4 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-danger)] flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-danger)] border border-[var(--bm-line)]">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-mono font-bold text-[var(--bm-danger)]">-{totalArchived}</p>
                <p className="text-[10px] sm:text-xs font-headline font-bold text-[var(--bm-text)]">Archiviert</p>
              </div>
            </div>
          </div>

          {/* Wall Photo Status */}
          <div className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center gap-2.5 text-xs font-mono text-[var(--bm-text)]">
            <Camera className="w-4 h-4 text-[var(--bm-accent)]" />
            <span>
              Wandfoto:{' '}
              <strong className="text-[var(--bm-strong)]">
                {hasPhotoUpdated ? 'Frisch aktualisiert' : 'Bestehendes Foto beibehalten'}
              </strong>
            </span>
          </div>

          {/* Modified Boulders Breakdown */}
          {totalModified > 0 && (
            <div>
              <p className="text-xs font-mono font-semibold text-[var(--bm-accent)] mb-2 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Geänderte Boulder ({totalModified}):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {modifiedBoulders.map(b => {
                  const scale = resolveScale(b.gradeScaleId);
                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-xl border border-black/40"
                          style={{ backgroundColor: scale?.colorHex || 'var(--bm-text-3)' }}
                        />
                        <span className="font-headline font-bold text-sm text-[var(--bm-text)]">
                          {b.name || scale?.colorName || 'Boulder'}
                        </span>
                        <span className="text-[var(--bm-text-2)] font-mono text-[11px]">
                          ({scale?.difficultyLabel || 'Hallenfarbe'})
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--bm-accent)] bg-[var(--bm-elevated)] px-2 py-0.5 rounded-xl border border-[var(--bm-line)]">
                        Geändert
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Boulders Breakdown */}
          {totalNew > 0 ? (
            <div>
              <p className="text-xs font-mono font-semibold text-[var(--bm-text-2)] mb-2">
                Neue Boulder nach Farbe:
              </p>
              <div className="space-y-2">
                {Object.entries(draftCountsByScale).map(([scaleId, { scale, count }]) => {
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-xl border border-black/40"
                          style={{ backgroundColor: scale?.colorHex || 'var(--bm-text-3)' }}
                        />
                        <span className="font-headline font-bold text-sm text-[var(--bm-text)]">{scale?.colorName || 'Unbekannt'}</span>
                        <span className="text-[var(--bm-text-2)] font-mono text-[11px]">({scale?.difficultyLabel || 'Hallenfarbe'})</span>
                      </div>
                      <span className="font-bold font-mono text-[var(--bm-accent)] bg-[var(--bm-elevated)] px-2.5 py-0.5 rounded-xl border border-[var(--bm-line)]">
                        {count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-[var(--bm-text-3)] italic">Keine neuen Entwürfe vorhanden.</p>
          )}

          {/* Archived Boulders Breakdown */}
          {totalArchived > 0 && (
            <div>
              <p className="text-xs font-mono font-semibold text-[var(--bm-text-2)] mb-2">
                Als archiviert (abgeschraubt) markiert:
              </p>
              <div className="space-y-2">
                {Object.entries(archiveCountsByScale).map(([scaleId, { scale, count }]) => {
                  return (
                    <div
                      key={scaleId}
                      className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-xl opacity-60"
                          style={{ backgroundColor: scale?.colorHex || 'var(--bm-text-3)' }}
                        />
                        <span className="font-headline font-bold text-[var(--bm-text)]">{scale?.colorName}</span>
                      </div>
                      <span className="text-[var(--bm-danger)] font-mono font-semibold">{count}× entfernt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-xs font-mono text-[var(--bm-text-2)] leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--bm-success)] shrink-0 mt-0.5" />
            <span>
              Erst nach Klick auf den Button unten werden alle Änderungen (neue, geänderte oder archivierte Boulder) final gespeichert und live geschaltet.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[var(--bm-line)] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] text-xs font-mono border border-[var(--bm-line)] transition"
          >
            ← Zurück zum Bearbeiten
          </button>

          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing || totalChanges === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            {totalNew === 0 && totalArchived === 0 ? (
              <Save className="w-4 h-4" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            <span>
              {isPublishing
                ? 'Speichere...'
                : totalNew === 0 && totalArchived === 0
                ? `Änderungen final speichern (${totalModified})`
                : totalModified === 0 && totalArchived === 0
                ? `Jetzt veröffentlichen (+${totalNew})`
                : `Veröffentlichen & Speichern (${totalChanges})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
