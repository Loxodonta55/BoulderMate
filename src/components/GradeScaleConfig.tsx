import React, { useState } from 'react';
import { GradeScale } from '../types/gym';
import { setGymGradeScales } from '../lib/gymStorage';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Check, Palette } from 'lucide-react';

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

  const handleFieldChange = (index: number, field: keyof GradeScale, value: any) => {
    const next = [...scales];
    next[index] = { ...next[index], [field]: value };
    setScales(next);
  };

  const addColor = () => {
    const newOrder = scales.length + 1;
    const newColor: GradeScale = {
      id: 'scale_temp_' + Date.now(),
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

  const handleSave = () => {
    try {
      setError(null);
      setGymGradeScales(gymId, userId, scales);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Fehler beim Speichern der Farbskala.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">Hallenspezifisches Farbsystem (Grade Scales)</h3>
        </div>
        <button
          onClick={addColor}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Farbe hinzufügen
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {scales.map((scale, idx) => (
          <div
            key={scale.id || idx}
            className="flex items-center gap-2 p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs"
          >
            {/* Sort Handle / Move */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveColor(idx, 'up')}
                className="p-1 hover:text-emerald-400 disabled:opacity-20 text-slate-400"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={idx === scales.length - 1}
                onClick={() => moveColor(idx, 'down')}
                className="p-1 hover:text-emerald-400 disabled:opacity-20 text-slate-400"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>

            {/* Color Hex & Preview */}
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={scale.color_hex}
                onChange={(e) => handleFieldChange(idx, 'color_hex', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700 p-0"
              />
            </div>

            {/* Color Name */}
            <div className="w-28">
              <input
                type="text"
                value={scale.color_name}
                onChange={(e) => handleFieldChange(idx, 'color_name', e.target.value)}
                placeholder="Farbname"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Difficulty Label */}
            <div className="w-36">
              <input
                type="text"
                value={scale.difficulty_label}
                onChange={(e) => handleFieldChange(idx, 'difficulty_label', e.target.value)}
                placeholder="z.B. Mittel / Fortgeschritten"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Font Range Min & Max */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">Font:</span>
              <input
                type="text"
                value={scale.font_range_min}
                onChange={(e) => handleFieldChange(idx, 'font_range_min', e.target.value)}
                placeholder="Min"
                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-slate-200 text-center focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-slate-500">–</span>
              <input
                type="text"
                value={scale.font_range_max}
                onChange={(e) => handleFieldChange(idx, 'font_range_max', e.target.value)}
                placeholder="Max"
                className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-slate-200 text-center focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeColor(idx)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg ml-auto transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Gespeichert!' : 'Farbsystem speichern'}
        </button>
      </div>
    </div>
  );
};
