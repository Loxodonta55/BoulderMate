import React, { useState, useEffect } from 'react';
import { WallBoulder, GymGradeScale, RadarAttributes, DEFAULT_RADAR, RADAR_AXIS_DEFINITIONS } from '../types/boulder';
import { X, Check, Trash2, Archive, Sparkles, SlidersHorizontal } from 'lucide-react';

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
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [radar, setRadar] = useState<RadarAttributes>(DEFAULT_RADAR);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setIsDeleting(false);
    if (boulder) {
      setSelectedScaleId(boulder.gradeScaleId || defaultGradeScaleId || (gradeScales[0]?.id ?? ''));
      setName(boulder.name || '');
      setNotes(boulder.notes || '');
      setRadar(boulder.radar ? { ...boulder.radar } : { ...DEFAULT_RADAR });
      // If boulder already has custom name or notes, open advanced section
      if (boulder.name || boulder.notes) {
        setShowAdvanced(true);
      }
    } else {
      setSelectedScaleId(defaultGradeScaleId || (gradeScales[0]?.id ?? ''));
      setName('');
      setNotes('');
      setRadar({ ...DEFAULT_RADAR });
      setShowAdvanced(false);
    }
    setValidationError('');
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
    setRadar(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg bg-[#1E1E1E] border-t sm:border border-[#333333] rounded-t-lg sm:rounded-none overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 duration-150 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header with Drag Handle */}
        <div className="pt-2 pb-3 px-5 flex flex-col items-center border-b border-[#333333] relative bg-[#121212] shrink-0">
          <div className="w-12 h-1 rounded-full bg-[#333333] mb-2.5" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-none border border-black/40 shrink-0"
                style={{ backgroundColor: selectedScale?.colorHex || '#C9A96E' }}
              />
              <h3 className="font-headline text-base uppercase tracking-wider text-[#E8E0D4] truncate">
                {isDraft ? 'Neuer Boulder (Entwurf)' : 'Boulder bearbeiten'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {!isDraft && onDeleteBoulder && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                  title="Route endgültig löschen"
                  aria-label="Route endgültig löschen"
                  data-testid="delete-boulder-sheet-header-btn"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition cursor-pointer"
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
            <div className="p-3 rounded-none bg-[#A0522D]/20 border border-[#A0522D] text-[#D97D5B] text-xs font-mono">
              {validationError}
            </div>
          )}

          {/* If existing active boulder, show direct archive & delete options */}
          {!isDraft && (onToggleArchive || onDeleteBoulder) && (
            <div className="p-3.5 rounded-none bg-[#2A2A2A] border border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-headline uppercase tracking-wide text-[#E8E0D4]">Routen-Status</p>
                <p className="text-[11px] font-mono text-[#A89F91]">
                  {isMarkedForArchive
                    ? 'Als abgeschraubt vorgemerkt'
                    : 'Aktiv an der Wand'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onToggleArchive && (
                  <button
                    type="button"
                    onClick={() => onToggleArchive(boulder.id)}
                    className={`px-3 py-2 rounded-[2px] text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      isMarkedForArchive
                        ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/40 hover:bg-[#C9A96E]/30'
                        : 'bg-[#A0522D]/20 text-[#D97D5B] border border-[#A0522D] hover:bg-[#A0522D]/30'
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
                    className="px-3 py-2 rounded-[2px] text-xs font-mono font-semibold flex items-center gap-1.5 bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-950/40 hover:border-red-500/60 transition cursor-pointer"
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
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A89F91]">
                Farbe / Grad <span className="text-[#C9A96E]">*</span>
              </label>
              {selectedScale && (
                <span className="text-xs font-mono text-[#E8E0D4] font-bold">
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
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-[2px] border text-left transition-all min-h-[48px] ${
                      isSelected
                        ? 'bg-[#2A2A2A] border-2 border-[#F5F0E8] shadow-md ring-1 ring-[#F5F0E8]'
                        : 'bg-[#141414] border-[#333333] hover:border-[#A89F91] active:bg-[#222222]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-none shrink-0 border border-black/40 shadow-sm"
                      style={{ backgroundColor: scale.colorHex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] truncate">
                        {scale.colorName}
                      </p>
                      <p className="text-[10px] font-mono text-[#A89F91] truncate">
                        {scale.difficultyLabel} ({scale.fontRangeMin})
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar Attributes — Mobile-First Touch Stepper with min 38-40px Touch Targets */}
          <div className="p-3.5 sm:p-4 rounded-none bg-[#2A2A2A] border border-[#333333] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                Charakteristik (1–5)
              </span>
              <span className="text-[10px] font-mono text-[#A89F91]">Standard: 3/5</span>
            </div>

            <div className="space-y-2">
              {RADAR_AXIS_DEFINITIONS.map(({ key, label, emoji }) => {
                const currentVal = radar[key] ?? 3;
                return (
                  <div key={key} className="flex items-center justify-between py-0.5">
                    <span className="text-[#E8E0D4] text-xs flex items-center gap-1.5 font-medium min-w-[100px]">
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
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[2px] text-xs font-mono font-bold transition-all flex items-center justify-center ${
                            step <= currentVal
                              ? 'bg-[#C9A96E] text-[#121212] font-extrabold shadow-sm'
                              : 'bg-[#1A1A1A] text-[#6B6358] border border-[#333333] hover:border-[#A89F91] active:bg-[#333333]'
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
              className="text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] flex items-center gap-1.5 transition py-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{showAdvanced ? 'Details verbergen' : '+ Name & Notizen (optional)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-mono text-[#A89F91] mb-1">
                    Name / Nummer (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. 'Dynamo Extreme' oder '#14'"
                    className="w-full px-3 py-2.5 bg-[#121212] border border-[#333333] rounded-none text-[#E8E0D4] text-xs font-mono placeholder:text-[#6B6358] focus:outline-none focus:border-[#F5F0E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A89F91] mb-1">
                    Schrauber-Notizen (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="z.B. 'Großer Dyno, Einstieg tief mit links'"
                    className="w-full px-3 py-2 bg-[#121212] border border-[#333333] rounded-none text-[#E8E0D4] text-xs font-mono placeholder:text-[#6B6358] focus:outline-none focus:border-[#F5F0E8] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer (Never requires scrolling to save) */}
        <div className="p-3 sm:p-4 bg-[#121212] border-t border-[#333333] flex items-center gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {isDraft && onDeleteDraft && (
            <button
              type="button"
              onClick={() => onDeleteDraft(boulder.id)}
              className="p-3 rounded-[2px] bg-[#2A2A2A] text-[#D97D5B] hover:bg-[#A0522D]/20 border border-[#333333] hover:border-[#A0522D] transition min-h-[48px] flex items-center justify-center cursor-pointer"
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
              className="p-3 rounded-[2px] bg-[#2A2A2A] text-red-400 hover:bg-red-950/20 border border-[#333333] hover:border-red-500/40 transition min-h-[48px] flex items-center justify-center cursor-pointer"
              title="Route unwiderruflich löschen"
              data-testid="delete-boulder-sheet-footer-btn"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}

          <button
            type="button"
            data-testid="save-boulder-sheet-btn"
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition min-h-[48px] shadow-lg cursor-pointer"
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
          <div className="bg-[#1E1E1E] border border-red-500/50 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-none bg-red-950/40 border border-red-500/40">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-headline uppercase font-bold text-[#E8E0D4]">
                Route unwiderruflich löschen?
              </h3>
            </div>
            <p className="text-sm font-sans text-[#A89F91] leading-relaxed">
              Möchtest du die Route <span className="font-bold text-[#E8E0D4]">„{boulder.name || `${selectedScale?.colorName || 'Boulder'} #${boulder.id.slice(-4)}`}“</span> wirklich vollständig und endgültig aus dem Schrauberbereich löschen?
            </p>
            <p className="text-xs font-mono text-[#8B8680]">
              Hinweis: Alle Begehungen, Bewertungen und Kommentare für diese Route werden ebenfalls unwiderruflich gelöscht.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#333333]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] text-xs font-mono font-bold uppercase transition cursor-pointer"
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase transition flex items-center gap-2 cursor-pointer shadow-md"
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

