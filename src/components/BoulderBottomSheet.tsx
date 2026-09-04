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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header / Drag Handle */}
        <div className="pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-800/80 relative">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-white/50 shadow"
                style={{ backgroundColor: selectedScale?.colorHex || '#3b82f6' }}
              />
              <h3 className="font-bold text-white text-base">
                {isDraft ? 'Neuer Boulder (Entwurf)' : 'Bestehender Boulder'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {validationError && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* If existing active boulder, show direct archive option */}
          {!isDraft && onToggleArchive && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Routen-Status</p>
                <p className="text-xs text-slate-400">
                  {isMarkedForArchive
                    ? 'Als abgeschraubt vorgemerkt'
                    : 'Aktiv an der Wand'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleArchive(boulder.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isMarkedForArchive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
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
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Farbe / Schwierigkeit <span className="text-red-400">*</span>
              </label>
              {selectedScale && (
                <span className="text-xs text-slate-300 font-medium">
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
                        ? 'bg-slate-800 border-white ring-2 ring-white/70 shadow-md scale-102'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-black/20 shadow-sm"
                      style={{ backgroundColor: scale.colorHex }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{scale.colorName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{scale.difficultyLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radar Attributes (1 - 5 with smart default 3) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Charakteristik (Radar)
              </span>
              <span className="text-[10px] text-slate-400">Standard: 3/5</span>
            </div>

            <div className="space-y-2.5">
              {RADAR_KEYS.map(({ key, label, emoji }) => {
                const currentVal = radar[key] ?? 3;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 w-28 flex items-center gap-1.5">
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
                          className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all ${
                            step <= currentVal
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
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
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Optionale Details verbergen' : 'Optionale Details (Name, Notizen) hinzufügen'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Name / Nummer (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="z.B. 'Dynamo Extreme' oder '#14'"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Schrauber-Notizen (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="z.B. 'Großer Dyno, Einstieg tief mit links'"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
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
                className="p-2.5 rounded-xl bg-slate-800 text-red-400 hover:bg-red-500/20 border border-slate-700 transition"
                title="Diesen Entwurf verwerfen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>Speichern & Nächster Boulder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
