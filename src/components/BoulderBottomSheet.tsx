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
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [radar, setRadar] = useState<RadarAttributes>(DEFAULT_RADAR);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-md bg-[#1E1E1E] border-t sm:border border-[#333333] rounded-none overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="py-3 px-5 flex flex-col items-center border-b border-[#333333] relative bg-[#121212]">
          <div className="w-10 h-0.5 bg-[#333333] mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-none border border-black/40"
                style={{ backgroundColor: selectedScale?.colorHex || '#C9A96E' }}
              />
              <h3 className="font-headline text-base uppercase tracking-wider text-[#E8E0D4]">
                {isDraft ? 'Neuer Boulder (Entwurf)' : 'Bestehender Boulder'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {validationError && (
            <div className="p-3 rounded-none bg-[#A0522D]/20 border border-[#A0522D] text-[#D97D5B] text-xs font-mono">
              {validationError}
            </div>
          )}

          {/* If existing active boulder, show direct archive option */}
          {!isDraft && onToggleArchive && (
            <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-between">
              <div>
                <p className="text-sm font-headline uppercase tracking-wide text-[#E8E0D4]">Routen-Status</p>
                <p className="text-xs font-mono text-[#A89F91]">
                  {isMarkedForArchive
                    ? 'Als abgeschraubt vorgemerkt'
                    : 'Aktiv an der Wand'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleArchive(boulder.id)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                  isMarkedForArchive
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/40 hover:bg-[#C9A96E]/30'
                    : 'bg-[#A0522D]/20 text-[#D97D5B] border border-[#A0522D] hover:bg-[#A0522D]/30'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isMarkedForArchive ? 'Archivierung rückgängig' : 'Archivieren (abgeschraubt)'}</span>
              </button>
            </div>
          )}

          {/* Color & Grade Selection (MANDATORY) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#A89F91]">
                Farbe / Schwierigkeit <span className="text-[#C9A96E]">*</span>
              </label>
              {selectedScale && (
                <span className="text-xs font-mono text-[#E8E0D4]">
                  {selectedScale.colorName} · {selectedScale.difficultyLabel} ({selectedScale.fontRangeMin}–{selectedScale.fontRangeMax})
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {gradeScales.map(scale => {
                const isSelected = selectedScaleId === scale.id;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => setSelectedScaleId(scale.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-[2px] border text-left transition-all ${
                      isSelected
                        ? 'bg-[#2A2A2A] border-2 border-[#F5F0E8]'
                        : 'bg-[#121212] border-[#333333] hover:border-[#A89F91]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-none shrink-0 border border-black/30"
                      style={{ backgroundColor: scale.colorHex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-headline uppercase tracking-wider text-[#E8E0D4] truncate">{scale.colorName}</p>
                      <p className="text-[10px] font-mono text-[#A89F91] truncate">{scale.difficultyLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar Attributes (1 - 5 with smart default 3) */}
          <div className="p-4 rounded-none bg-[#2A2A2A] border border-[#333333] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                Charakteristik (Radar)
              </span>
              <span className="text-[10px] font-mono text-[#A89F91]">Standard: 3/5</span>
            </div>

            <div className="space-y-2.5">
              {RADAR_AXIS_DEFINITIONS.map(({ key, label, emoji }) => {
                const currentVal = radar[key] ?? 3;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-[#E8E0D4] w-28 flex items-center gap-1.5 font-medium">
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </span>

                    {/* 1-5 Step selector */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleRadarChange(key, step)}
                          className={`w-6 h-6 rounded-[2px] text-[11px] font-mono font-bold transition-all ${
                            step <= currentVal
                              ? 'bg-[#C9A96E] text-[#121212]'
                              : 'bg-[#1E1E1E] text-[#6B6358] border border-[#333333] hover:border-[#A89F91]'
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
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] flex items-center gap-1.5 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>{showAdvanced ? 'Optionale Details verbergen' : 'Optionale Details (Name, Notizen) hinzufügen'}</span>
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
                    className="w-full px-3 py-2 bg-[#121212] border border-[#333333] rounded-none text-[#E8E0D4] text-xs font-mono placeholder:text-[#6B6358] focus:outline-none focus:border-[#F5F0E8]"
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

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {isDraft && onDeleteDraft && (
              <button
                type="button"
                onClick={() => onDeleteDraft(boulder.id)}
                className="p-2.5 rounded-[2px] bg-[#2A2A2A] text-[#D97D5B] hover:bg-[#A0522D]/20 border border-[#333333] hover:border-[#A0522D] transition"
                title="Diesen Entwurf verwerfen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-[2px] bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Speichern & Nächster Boulder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
