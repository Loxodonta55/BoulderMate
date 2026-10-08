import React, { useState, useEffect } from 'react';
import { GradeScale } from '../types/gym';
import { setGymGradeScales } from '../lib/gymStorage';
import { syncGradeScalesToSupabase } from '../lib/syncService';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Check, Palette, RefreshCw } from 'lucide-react';
import { isValidUuid, stringToUuid } from '../lib/storageUtils';

interface Props {
  gymId: string;
  userId: string;
  initialScales: GradeScale[];
  onSaved: () => void;
}

export const GradeScaleConfig: React.FC<Props> = ({ gymId, userId, initialScales, onSaved }) => {
  const [scales, setScales] = useState<GradeScale[]>(initialScales);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setScales(initialScales);
  }, [initialScales]);

  const handleFieldChange = (index: number, field: keyof GradeScale, value: any) => {
    const next = [...scales];
    next[index] = { ...next[index], [field]: value };
    setScales(next);
  };

  const addColor = () => {
    const newOrder = scales.length + 1;
    const newColor: GradeScale = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : stringToUuid(`scale_${gymId}_new_${Date.now()}`),
      gym_id: gymId,
      color_name: 'Neue Farbe',
      color_hex: '#8b5cf6',
      difficulty_label: 'Mittel',
      font_range_min: '6A',
      font_range_max: '6B',
      sort_order: newOrder,
      created_at: new Date().toISOString()
    };
    setScales([...scales, newColor]);
  };

  const removeColor = (index: number) => {
    const next = scales.filter((_, i) => i !== index);
    setScales(next);
  };

  const moveColor = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === scales.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...scales];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setScales(next.map((s, idx) => ({ ...s, sort_order: idx + 1 })));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Sicherstellen, dass jede Farbstufe eine echte UUID besitzt
      const scalesWithUuids: GradeScale[] = scales.map((s, idx) => ({
        ...s,
        id: (s.id && isValidUuid(s.id))
          ? s.id
          : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : stringToUuid(`scale_${gymId}_${s.color_name}_${idx}`)),
        sort_order: idx + 1,
      }));

      // 1. Sofort lokal persistieren
      const validated = setGymGradeScales(gymId, userId, scalesWithUuids);
      setScales(validated);

      // 2. Sofort in Supabase synchronisieren und auf Bestätigung warten
      await syncGradeScalesToSupabase(gymId, validated);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Fehler beim Speichern der Farbskala.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--bm-surface)] p-3.5 sm:p-5 space-y-4 sm:space-y-5 border border-[var(--bm-line)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--bm-line)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)] shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-headline font-bold text-[var(--bm-text)]">
              Hallenspezifisches Farbsystem (Grade Scales)
            </h3>
            <p className="text-[11px] font-mono text-[var(--bm-text-2)]">
              Farbstufen, Schwierigkeitsgrade & Fontainebleau-Bänder
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addColor}
          className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] border border-[var(--bm-line)] hover:border-[var(--bm-accent)] rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--bm-accent)]" /> Farbe hinzufügen
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[var(--bm-bg)] border border-[var(--bm-danger)] rounded-xl text-[var(--bm-danger)] text-xs font-mono">
          {error}
        </div>
      )}

      {/* Desktop Column Header Guide */}
      <div className="hidden sm:flex items-center gap-3 px-3 py-1 text-[10px] font-mono text-[var(--bm-text-3)] border-b border-[var(--bm-elevated)]">
        <span className="w-12 text-center">Sort</span>
        <span className="w-10 text-center">Farbe</span>
        <span className="w-32">Farbname</span>
        <span className="w-40">Schwierigkeitsgrad</span>
        <span className="w-36 text-center">Fontainebleau-Spanne</span>
        <span className="flex-1 min-w-[90px]">Vorschau</span>
        <span className="w-8 text-right">Löschen</span>
      </div>

      <div className="space-y-2.5">
        {scales.map((scale, idx) => (
          <div
            key={scale.id || idx}
            className="p-3 bg-[var(--bm-bg)] border border-[var(--bm-line)] hover:border-[var(--bm-text-2)] rounded-xl text-xs transition space-y-2.5 sm:space-y-0"
            data-testid={`scale-row-${idx}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              {/* Row 1 on mobile / Left group on desktop: Sort, Color picker, Color name, Mobile Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Order & Sort Handle / Move */}
                <div className="flex items-center gap-0.5">
                  <span className="sm:hidden w-6 h-6 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-[10px] font-mono font-bold text-[var(--bm-accent)] flex items-center justify-center mr-1">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveColor(idx, 'up')}
                    className="p-1.5 sm:p-1 hover:text-[var(--bm-accent)] disabled:opacity-20 text-[var(--bm-text-3)] transition rounded-xl"
                    title="Nach oben verschieben"
                    aria-label="Farbe nach oben verschieben"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === scales.length - 1}
                    onClick={() => moveColor(idx, 'down')}
                    className="p-1.5 sm:p-1 hover:text-[var(--bm-accent)] disabled:opacity-20 text-[var(--bm-text-3)] transition rounded-xl"
                    title="Nach unten verschieben"
                    aria-label="Farbe nach unten verschieben"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color Swatch / Color Picker */}
                <div className="relative shrink-0 flex items-center">
                  <div
                    className="w-8 h-8 rounded-xl border border-black/40 shadow-sm relative overflow-hidden cursor-pointer shrink-0"
                    style={{ backgroundColor: scale.color_hex }}
                    title="Farbe anklicken zum Auswählen"
                  >
                    <input
                      type="color"
                      value={scale.color_hex}
                      onChange={(e) => handleFieldChange(idx, 'color_hex', e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title="Farbe ändern"
                      aria-label={`Farbe für ${scale.color_name || 'Farbstufe'}`}
                    />
                  </div>
                </div>

                {/* Color Name */}
                <div className="flex-1 sm:w-32 sm:flex-none">
                  <label className="sm:hidden block text-[10px] font-mono text-[var(--bm-text-2)] mb-0.5 font-bold">
                    Farbname
                  </label>
                  <input
                    type="text"
                    value={scale.color_name}
                    onChange={(e) => handleFieldChange(idx, 'color_name', e.target.value)}
                    placeholder="Farbname"
                    title="Farbname"
                    className="w-full bg-[var(--bm-surface)] border border-[var(--bm-line)] focus:border-[var(--bm-accent)] rounded-xl px-2.5 py-1.5 text-[var(--bm-text)] font-semibold focus:outline-none font-mono text-xs"
                  />
                </div>

                {/* Mobile Delete Button (placed on top-right row for thumb reach) */}
                <div className="sm:hidden ml-auto">
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="p-1.5 text-[var(--bm-text-3)] hover:text-[var(--bm-danger)] hover:bg-[var(--bm-surface)] rounded-xl transition"
                    title="Farbe entfernen"
                    aria-label="Farbe entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Difficulty Label — Full width on mobile with prominent label, 160px on desktop */}
              <div className="w-full sm:w-40 sm:flex-none">
                <label className="sm:hidden block text-[10px] font-mono text-[var(--bm-text-2)] mb-0.5 font-bold">
                  Schwierigkeitsgrad (Hallengrad) <span className="text-[var(--bm-accent)]">*</span>
                </label>
                <input
                  type="text"
                  value={scale.difficulty_label}
                  onChange={(e) => handleFieldChange(idx, 'difficulty_label', e.target.value)}
                  placeholder="z.B. Leicht, Moderat, Schwer"
                  title="Schwierigkeitsgrad"
                  className="w-full bg-[var(--bm-surface)] border border-[var(--bm-line)] focus:border-[var(--bm-accent)] rounded-xl px-2.5 py-1.5 text-[var(--bm-text)] focus:outline-none font-sans text-xs"
                />
              </div>

              {/* Font Range Min & Max */}
              <div className="w-full sm:w-36 sm:flex-none">
                <label className="sm:hidden block text-[10px] font-mono text-[var(--bm-text-2)] mb-0.5 font-bold">
                  Fontainebleau-Spanne
                </label>
                <div className="flex items-center justify-between sm:justify-start gap-1.5">
                  <span className="text-[var(--bm-text-3)] font-mono text-[11px] shrink-0 sm:inline">Font:</span>
                  <input
                    type="text"
                    value={scale.font_range_min}
                    onChange={(e) => handleFieldChange(idx, 'font_range_min', e.target.value)}
                    placeholder="Min"
                    title="Font Minimalgrad"
                    className="flex-1 sm:flex-none sm:w-12 bg-[var(--bm-surface)] border border-[var(--bm-line)] focus:border-[var(--bm-accent)] rounded-xl px-1.5 py-1.5 text-[var(--bm-text)] text-center focus:outline-none font-mono font-bold text-xs"
                  />
                  <span className="text-[var(--bm-text-3)]">–</span>
                  <input
                    type="text"
                    value={scale.font_range_max}
                    onChange={(e) => handleFieldChange(idx, 'font_range_max', e.target.value)}
                    placeholder="Max"
                    title="Font Maximalgrad"
                    className="flex-1 sm:flex-none sm:w-12 bg-[var(--bm-surface)] border border-[var(--bm-line)] focus:border-[var(--bm-accent)] rounded-xl px-1.5 py-1.5 text-[var(--bm-text)] text-center focus:outline-none font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Badge (Shows exact Topo representation) */}
              <div className="flex-1 min-w-[90px] hidden sm:flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-elevated)] text-[10px] font-mono text-[var(--bm-text-2)] truncate max-w-full">
                  <span className="w-2.5 h-2.5 rounded-xl border border-black/40 shrink-0" style={{ backgroundColor: scale.color_hex }} />
                  <span className="truncate text-[var(--bm-text)] font-bold">{scale.color_name}</span>
                  <span className="truncate">({scale.difficulty_label})</span>
                </span>
              </div>

              {/* Desktop Delete Button */}
              <div className="hidden sm:block ml-auto shrink-0 w-8 text-right">
                <button
                  type="button"
                  onClick={() => removeColor(idx)}
                  className="p-1.5 text-[var(--bm-text-3)] hover:text-[var(--bm-danger)] hover:bg-[var(--bm-elevated)] rounded-xl transition-colors"
                  title="Farbe entfernen"
                  aria-label="Farbe entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile-Only Live Preview Badge Bar */}
            <div className="sm:hidden flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--bm-surface)] text-[11px] font-mono">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] text-[var(--bm-text-3)]">Vorschau:</span>
                <span className="w-3 h-3 rounded-xl border border-black/50 shrink-0" style={{ backgroundColor: scale.color_hex }} />
                <span className="text-[var(--bm-text)] font-bold">{scale.color_name || 'Farbe'}</span>
                <span className="text-[var(--bm-text-2)]">({scale.difficulty_label || 'Grad'})</span>
              </div>
              <span className="text-[var(--bm-accent)] font-bold shrink-0">
                {scale.font_range_min}–{scale.font_range_max}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] disabled:opacity-50 text-[var(--bm-bg)] font-headline font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Wird synchronisiert...' : savedSuccess ? 'Gespeichert!' : 'Farbsystem speichern'}
        </button>
      </div>
    </div>
  );
};
