import React, { useState, useEffect, useRef } from 'react';
import { WallBoulder, GymGradeScale, RadarAttributes, DEFAULT_RADAR, RADAR_AXIS_DEFINITIONS } from '../types/boulder';
import { X, Check, Trash2, Archive, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { SEED_GRADE_SCALES } from '../lib/seedData';
import * as gymStorage from '../lib/gymStorage';

export function resolveScaleId(
  boulder: WallBoulder | null,
  gradeScales: GymGradeScale[],
  defaultScaleId?: string
): string {
  if (!boulder || gradeScales.length === 0) {
    return defaultScaleId || gradeScales[0]?.id || '';
  }

  const targetScaleId = boulder.gradeScaleId || (boulder as any).grade_scale_id;

  // If this boulder has NO scale id at all (e.g. brand new pin before any selection), use defaultScaleId
  if (!targetScaleId) {
    if (defaultScaleId && gradeScales.some(s => s.id === defaultScaleId)) {
      return defaultScaleId;
    }
    return gradeScales[0]?.id || '';
  }

  // 1. Direct ID match
  const directMatch = gradeScales.find(s => s.id === targetScaleId);
  if (directMatch) return directMatch.id;

  // 2. Normalized colorName match (e.g. "Schwarz", "schwarz", "weiß", "weiss")
  const normGradeScaleId = targetScaleId.toLowerCase().trim().replace(/ß/g, 'ss');
  const colorMatch = gradeScales.find(s =>
    s.colorName.toLowerCase().trim().replace(/ß/g, 'ss') === normGradeScaleId
  );
  if (colorMatch) return colorMatch.id;

  // 3. Alias format matching (e.g. "scale_6a_schwarz" -> "schwarz", "scale_minimum_blau" -> "blau")
  const cleanKey = normGradeScaleId.replace(/^scale_(6a|minimum)_/, '');
  const aliasMatch = gradeScales.find(s => {
    const norm = s.colorName.toLowerCase().trim().replace(/ß/g, 'ss');
    return norm === cleanKey || cleanKey === norm;
  });
  if (aliasMatch) return aliasMatch.id;

  // 4. Match via boulder name or gradeScaleId containing color name
  const query = `${targetScaleId} ${boulder.name || ''}`.toLowerCase().replace(/ß/g, 'ss');
  const nameMatch = gradeScales.find(s => {
    const norm = s.colorName.toLowerCase().trim().replace(/ß/g, 'ss');
    return query.includes(norm);
  });
  if (nameMatch) return nameMatch.id;

  // 5. Match by Font grade
  if (boulder.fontGrade) {
    const fontMatch = gradeScales.find(
      s => s.fontRangeMin === boulder.fontGrade || s.fontRangeMax === boulder.fontGrade
    );
    if (fontMatch) return fontMatch.id;
  }

  // 6. Look up targetScaleId in known gymStorage / SEED grade scales to find its real color name
  try {
    const allKnownScales = [...SEED_GRADE_SCALES, ...gymStorage.getGradeScales().map(sc => ({
      id: sc.id,
      colorName: sc.color_name,
    }))];
    const matchedKnown = allKnownScales.find(s => s.id === targetScaleId);
    if (matchedKnown?.colorName) {
      const normKnown = matchedKnown.colorName.toLowerCase().trim().replace(/ß/g, 'ss');
      const foundInCurrent = gradeScales.find(s =>
        s.colorName.toLowerCase().trim().replace(/ß/g, 'ss') === normKnown
      );
      if (foundInCurrent) return foundInCurrent.id;
    }
  } catch (e) {}

  // 7. AC-15: For an EXISTING boulder with a configured scale, NEVER fall back to defaultScaleId
  // (which is the color selected for the previous route!). Return the first scale of the gym instead.
  return gradeScales[0]?.id || '';
}

interface BoulderBottomSheetProps {
  isOpen: boolean;
  boulder: WallBoulder | null;
  gradeScales: GymGradeScale[];
  defaultGradeScaleId: string;
  isMarkedForArchive: boolean;
  onClose: () => void;
  onSave: (data: {
    gradeScaleId: string;
    name?: string;
    notes?: string;
    radar: RadarAttributes;
  }) => void;
  onDeleteDraft?: (boulderId: string) => void;
  onToggleArchive?: (boulderId: string) => void;
  onDeleteBoulder?: (boulderId: string) => void;
  onResetBoulder?: (boulderId: string) => void; // SPEC-021 AC-9: «Neu geschraubt»
}

export const BoulderBottomSheet: React.FC<BoulderBottomSheetProps> = ({
  isOpen,
  boulder,
  gradeScales,
  defaultGradeScaleId,
  isMarkedForArchive,
  onClose,
  onSave,
  onDeleteDraft,
  onToggleArchive,
  onDeleteBoulder,
  onResetBoulder,
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [radar, setRadar] = useState<RadarAttributes>(DEFAULT_RADAR);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const currentBoulderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !boulder) {
      currentBoulderIdRef.current = null;
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setValidationError('');
      return;
    }

    // Only initialize form fields when opening sheet or switching to a different boulder
    if (currentBoulderIdRef.current !== boulder.id) {
      currentBoulderIdRef.current = boulder.id;
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setValidationError('');

      const resolvedId = resolveScaleId(boulder, gradeScales, defaultGradeScaleId);
      setSelectedScaleId(resolvedId);
      setName(boulder.name || '');
      const initialRadar: RadarAttributes = {
        maximalkraft: boulder.radar?.maximalkraft ?? (boulder as any).radar_maximalkraft ?? boulder.radar?.kraft ?? (boulder as any).radar_kraft ?? DEFAULT_RADAR.maximalkraft,
        kraftausdauer: boulder.radar?.kraftausdauer ?? (boulder as any).radar_kraftausdauer ?? DEFAULT_RADAR.kraftausdauer,
        technik: boulder.radar?.technik ?? (boulder as any).radar_technik ?? DEFAULT_RADAR.technik,
        balance: boulder.radar?.balance ?? (boulder as any).radar_balance ?? DEFAULT_RADAR.balance,
        koordination: boulder.radar?.koordination ?? (boulder as any).radar_koordination ?? DEFAULT_RADAR.koordination,
        flexibilitaet: boulder.radar?.flexibilitaet ?? (boulder as any).radar_flexibilitaet ?? DEFAULT_RADAR.flexibilitaet,
        kraft: boulder.radar?.kraft ?? (boulder as any).radar_kraft ?? boulder.radar?.maximalkraft ?? (boulder as any).radar_maximalkraft ?? DEFAULT_RADAR.kraft,
      };
      setRadar(initialRadar);
      setShowAdvanced(Boolean(boulder.name || boulder.notes));
    }
  }, [boulder, defaultGradeScaleId, gradeScales, isOpen]);

  if (!isOpen || !boulder) return null;

  const isDraft = boulder.status === 'draft';
  const selectedScale = gradeScales.find(s => s.id === selectedScaleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScaleId) {
      setValidationError('Bitte wähle eine Hallenfarbe/Schwierigkeit.');
      return;
    }
    onSave({
      gradeScaleId: selectedScaleId,
      name: name.trim() || undefined,
      notes: notes.trim() || undefined,
      radar,
    });
  };

  const handleRadarChange = (key: keyof RadarAttributes, val: number) => {
    setRadar(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'maximalkraft') next.kraft = val;
      if (key === 'kraft') next.maximalkraft = val;
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg bg-[var(--bm-surface)] border-t sm:border border-[var(--bm-line)] rounded-t-lg sm:rounded-xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-150 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header with Drag Handle */}
        <div className="pt-2 pb-3 px-5 flex flex-col items-center border-b border-[var(--bm-line)] relative bg-[var(--bm-bg)] shrink-0">
          <div className="w-12 h-1 rounded-full bg-[var(--bm-line)] mb-2.5" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-xl border border-black/40 shrink-0"
                style={{ backgroundColor: selectedScale?.colorHex || 'var(--bm-text-3)' }}
              />
              <h3 className="font-headline text-base text-[var(--bm-text)] truncate">
                {isDraft ? 'Neuer Boulder (Entwurf)' : 'Boulder bearbeiten'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {!isDraft && onDeleteBoulder && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-danger)] hover:bg-[var(--bm-danger)]/10 transition cursor-pointer"
                  title="Route endgültig löschen"
                  aria-label="Route endgültig löschen"
                  data-testid="delete-boulder-sheet-header-btn"
                >
                  <Trash2 className="w-4 h-4 text-[var(--bm-danger)]" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition cursor-pointer"
                title="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-[var(--bm-danger)]/20 border border-[var(--bm-danger)] text-[var(--bm-danger)] text-xs font-mono">
              {validationError}
            </div>
          )}

          {/* If existing active boulder, show direct archive & delete options */}
          {!isDraft && (onToggleArchive || onDeleteBoulder) && (
            <div className="p-3.5 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-headline text-[var(--bm-text)]">Routen-Status</p>
                <p className="text-[11px] font-mono text-[var(--bm-text-2)]">
                  {isMarkedForArchive
                    ? 'Als abgeschraubt vorgemerkt'
                    : 'Aktiv an der Wand'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onResetBoulder && !isMarkedForArchive && (
                  <button
                    type="button"
                    onClick={() => onResetBoulder(boulder.id)}
                    className="px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 hover:bg-[var(--bm-accent)]/30 transition cursor-pointer"
                    data-testid="reset-boulder-btn"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Neu geschraubt</span>
                  </button>
                )}
                {onToggleArchive && (
                  <button
                    type="button"
                    onClick={() => onToggleArchive(boulder.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isMarkedForArchive
                        ? 'bg-[var(--bm-accent)]/20 text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 hover:bg-[var(--bm-accent)]/30'
                        : 'bg-[var(--bm-danger)]/20 text-[var(--bm-danger)] border border-[var(--bm-danger)] hover:bg-[var(--bm-danger)]/30'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{isMarkedForArchive ? 'Wiederherstellen' : 'Abgeschraubt'}</span>
                  </button>
                )}
                {onDeleteBoulder && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 bg-[var(--bm-danger)]/10 text-[var(--bm-danger)] border border-[var(--bm-danger)]/40 hover:bg-[var(--bm-danger)]/10 hover:border-[var(--bm-danger)]/40 transition cursor-pointer"
                    title="Route endgültig löschen"
                    data-testid="delete-boulder-sheet-status-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Route löschen</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Color & Grade Selection (MANDATORY) — Mobile-First Grid with min 48px Touch Targets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-[var(--bm-text-2)]">
                Farbe / Grad <span className="text-[var(--bm-accent)]">*</span>
              </label>
              {selectedScale && (
                <span className="text-xs font-mono text-[var(--bm-text)] font-bold">
                  {selectedScale.colorName} · {selectedScale.difficultyLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gradeScales.map(scale => {
                const isSelected = selectedScaleId === scale.id;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => setSelectedScaleId(scale.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      isSelected
                        ? 'bg-[var(--bm-elevated)] border-2 border-[var(--bm-strong)] shadow-md ring-1 ring-[var(--bm-strong)]'
                        : 'bg-[var(--bm-bg)] border-[var(--bm-line)] hover:border-[var(--bm-text-2)] active:bg-[var(--bm-surface)]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-xl shrink-0 border border-black/40 shadow-sm"
                      style={{ backgroundColor: scale.colorHex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-headline font-bold text-[var(--bm-text)] truncate">
                        {scale.colorName}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--bm-text-2)] truncate">
                        {scale.difficultyLabel} ({scale.fontRangeMin})
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar Attributes — Mobile-First Touch Stepper with min 38-40px Touch Targets */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline text-[var(--bm-text)] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                Charakteristik (1–5)
              </span>
              <span className="text-[10px] font-mono text-[var(--bm-text-2)]">Standard: 3/5</span>
            </div>

            <div className="space-y-2">
              {RADAR_AXIS_DEFINITIONS.map(({ key, label, emoji }) => {
                const currentVal = radar[key] ?? 3;
                return (
                  <div key={key} className="flex items-center justify-between py-0.5">
                    <span className="text-[var(--bm-text)] text-xs flex items-center gap-1.5 font-medium min-w-[100px]">
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </span>

                    {/* 1-5 Step selector with generous touch targets (36x36px min) */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {[1, 2, 3, 4, 5].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleRadarChange(key, step)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
                            step <= currentVal
                              ? 'bg-[var(--bm-accent)] text-[var(--bm-bg)] font-extrabold shadow-sm'
                              : 'bg-[var(--bm-surface)] text-[var(--bm-text-3)] border border-[var(--bm-line)] hover:border-[var(--bm-text-2)] active:bg-[var(--bm-line)]'
                          }`}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Details Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-mono text-[var(--bm-text-2)] hover:text-[var(--bm-text)] flex items-center gap-1.5 transition py-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
              <span>{showAdvanced ? 'Details verbergen' : '+ Name & Notizen (optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-mono text-[var(--bm-text-2)] mb-1">
                    Name / Nummer (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. 'Dynamo Extreme' oder '#14'"
                    className="w-full px-3 py-2.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text)] text-xs font-mono placeholder:text-[var(--bm-text-3)] focus:outline-none focus:border-[var(--bm-strong)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[var(--bm-text-2)] mb-1">
                    Schrauber-Notizen (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="z.B. 'Großer Dyno, Einstieg tief mit links'"
                    className="w-full px-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text)] text-xs font-mono placeholder:text-[var(--bm-text-3)] focus:outline-none focus:border-[var(--bm-strong)] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer (Never requires scrolling to save) */}
        <div className="p-3 sm:p-4 bg-[var(--bm-bg)] border-t border-[var(--bm-line)] flex items-center gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {isDraft && onDeleteDraft && (
            <button
              type="button"
              onClick={() => onDeleteDraft(boulder.id)}
              className="p-3 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-danger)] hover:bg-[var(--bm-danger)]/20 border border-[var(--bm-line)] hover:border-[var(--bm-danger)] transition min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Entwurf verwerfen"
              data-testid="delete-draft-btn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {!isDraft && onDeleteBoulder && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-danger)] hover:bg-[var(--bm-danger)]/10 border border-[var(--bm-line)] hover:border-[var(--bm-danger)]/40 transition min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Route unwiderruflich löschen"
              data-testid="delete-boulder-sheet-footer-btn"
            >
              <Trash2 className="w-4 h-4 text-[var(--bm-danger)]" />
            </button>
          )}

          <button
            type="button"
            data-testid="save-boulder-sheet-btn"
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-xl bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition min-h-[48px] shadow-lg cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isDraft ? 'Speichern & Weiter' : 'Änderung übernehmen'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal Dialog (AC-13) */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--bm-surface)] border border-[var(--bm-danger)]/40 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[var(--bm-danger)]">
              <div className="p-2 rounded-xl bg-[var(--bm-danger)]/10 border border-[var(--bm-danger)]/40">
                <Trash2 className="w-6 h-6 text-[var(--bm-danger)]" />
              </div>
              <h3 className="text-lg font-headline font-bold text-[var(--bm-text)]">
                Route unwiderruflich löschen?
              </h3>
            </div>
            <p className="text-sm font-sans text-[var(--bm-text-2)] leading-relaxed">
              Möchtest du die Route <span className="font-bold text-[var(--bm-text)]">„{boulder.name || `${selectedScale?.colorName || 'Boulder'} #${boulder.id.slice(-4)}`}“</span> wirklich vollständig und endgültig aus dem Schrauberbereich löschen?
            </p>
            <p className="text-xs font-mono text-[var(--bm-text-2)]">
              Hinweis: Alle Begehungen, Bewertungen und Kommentare für diese Route werden ebenfalls unwiderruflich gelöscht.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--bm-line)]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] text-xs font-mono font-bold transition cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!onDeleteBoulder) return;
                  setIsDeleting(true);
                  try {
                    onDeleteBoulder(boulder.id);
                    setShowDeleteConfirm(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-[var(--bm-danger)] hover:bg-[var(--bm-danger)]/90 disabled:opacity-50 text-white text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                data-testid="confirm-delete-boulder-sheet-btn"
              >
                {isDeleting ? (
                  <span>Wird gelöscht...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Endgültig löschen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

