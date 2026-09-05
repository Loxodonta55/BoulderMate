import React, { useState, useEffect } from 'react';
import { WallBoulder, GymGradeScale, RadarAttributes, DEFAULT_RADAR } from '../types/boulder';
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

  const RADAR_KEYS: { key: keyof RadarAttributes; label: string; emoji: string }[] = [
    { key: 'kraft', label: 'Kraft', emoji: '💪' },
    { key: 'technik', label: 'Technik', emoji: '🦶' },
    { key: 'balance', label: 'Balance', emoji: '⚖️' },
    { key: 'koordination', label: 'Koordination', emoji: '🎯' },
    { key: 'flexibilitaet', label: 'Flexibilität', emoji: '🤸' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#121110]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-[#181614] border-t sm:border border-[#38332e] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header / Drag Handle */}
        <div className="pt-3 pb-2 px-6 flex flex-col items-center border-b border-[#38332e] relative">
          <div className="w-12 h-1.5 bg-[#38332e] rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full border border-black/40 shadow"
                style={{ backgroundColor: selectedScale?.colorHex || '#3b82f6' }}
              />
              <h3 className="font-headline text-lg uppercase tracking-wider text-[#f4efe6]">
                {isDraft ? 'Neuer Boulder (Entwurf)' : 'Bestehender Boulder'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-[#78716c] hover:text-[#f4efe6] hover:bg-[#221f1c] transition"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono">
              {validationError}
            </div>
          )}

          {/* If existing active boulder, show direct archive option */}
          {!isDraft && onToggleArchive && (
            <div className="p-4 rounded-xl bg-[#221f1c] border border-[#38332e] flex items-center justify-between">
              <div>
                <p className="text-sm font-headline uppercase tracking-wide text-[#f4efe6]">Routen-Status</p>
                <p className="text-xs font-mono text-[#a89f91]">
                  {isMarkedForArchive
                    ? 'Als abgeschraubt vorgemerkt'
                    : 'Aktiv an der Wand'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleArchive(boulder.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                  isMarkedForArchive
                    ? 'bg-[#d97706]/20 text-[#f59e0b] border border-[#d97706]/40 hover:bg-[#d97706]/30'
                    : 'bg-red-950/40 text-red-300 border border-red-800/60 hover:bg-red-900/40'
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
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#a89f91]">
                Farbe / Schwierigkeit <span className="text-[#d97706]">*</span>
              </label>
              {selectedScale && (
                <span className="text-xs font-mono text-[#d4cdc3]">
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
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#2a2520] border-[#d97706] ring-2 ring-[#d97706]/50 shadow-md scale-102'
                        : 'bg-[#221f1c] border-[#38332e] hover:border-[#a89f91]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-black/30 shadow-sm"
                      style={{ backgroundColor: scale.colorHex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-headline uppercase tracking-wider text-[#f4efe6] truncate">{scale.colorName}</p>
                      <p className="text-[10px] font-mono text-[#a89f91] truncate">{scale.difficultyLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar Attributes (1 - 5 with smart default 3) */}
          <div className="p-4 rounded-2xl bg-[#121110] border border-[#38332e] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline uppercase tracking-wider text-[#f4efe6] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                Charakteristik (Radar)
              </span>
              <span className="text-[10px] font-mono text-[#a89f91]">Standard: 3/5</span>
            </div>

            <div className="space-y-2.5">
              {RADAR_KEYS.map(({ key, label, emoji }) => {
                const currentVal = radar[key] ?? 3;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-[#d4cdc3] w-28 flex items-center gap-1.5 font-medium">
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
                          className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all ${
                            step <= currentVal
                              ? 'bg-[#d97706] text-[#121110] shadow-sm'
                              : 'bg-[#221f1c] text-[#78716c] hover:bg-[#2a2622]'
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
              className="text-xs font-mono text-[#a89f91] hover:text-[#f4efe6] flex items-center gap-1.5 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#d97706]" />
              <span>{showAdvanced ? 'Optionale Details verbergen' : 'Optionale Details (Name, Notizen) hinzufügen'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-mono text-[#a89f91] mb-1">
                    Name / Nummer (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. 'Dynamo Extreme' oder '#14'"
                    className="w-full px-3 py-2 bg-[#121110] border border-[#38332e] rounded-xl text-[#f4efe6] text-xs font-mono placeholder:text-[#78716c] focus:outline-none focus:border-[#d97706]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#a89f91] mb-1">
                    Schrauber-Notizen (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="z.B. 'Großer Dyno, Einstieg tief mit links'"
                    className="w-full px-3 py-2 bg-[#121110] border border-[#38332e] rounded-xl text-[#f4efe6] text-xs font-mono placeholder:text-[#78716c] focus:outline-none focus:border-[#d97706] resize-none"
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
                className="p-2.5 rounded-xl bg-[#221f1c] text-red-400 hover:bg-red-950/40 border border-[#38332e] hover:border-red-800/60 transition"
                title="Diesen Entwurf verwerfen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-[#121110] font-headline uppercase font-bold tracking-wider text-sm shadow-lg flex items-center justify-center gap-2 transition"
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
