import React, { useState, useEffect } from 'react';
import { GradeScale } from '../types/gym';
import { setGymGradeScales } from '../lib/gymStorage';
import { syncGradeScalesToSupabase } from '../lib/syncService';
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
      syncGradeScalesToSupabase(gymId, scales).catch(err => {
        console.warn('Background sync grade scales to Supabase failed:', err);
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onSaved();
    } catch (e: any) {
      setError(e.message || 'Fehler beim Speichern der Farbskala.');
    }
  };

  return (
    <div className="rounded-none bg-[#1E1E1E] p-5 space-y-5 border border-[#333333]">
      <div className="flex items-center justify-between border-b border-[#333333] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-none bg-[#2A2A2A] border border-[#333333] text-[#C9A96E]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">
              Hallenspezifisches Farbsystem (Grade Scales)
            </h3>
            <p className="text-[11px] font-mono text-[#A89F91]">Fontainebleau Parcour Skalen & Farbstufen</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addColor}
          className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] rounded-[2px] transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#C9A96E]" /> Farbe hinzufügen
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#121212] border border-[#A0522D] rounded-none text-[#A0522D] text-xs font-mono">
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        {scales.map((scale, idx) => (
          <div
            key={scale.id || idx}
            className="flex items-center gap-2.5 p-3 bg-[#121212] border border-[#333333] hover:border-[#8B8680] rounded-none text-xs transition"
          >
            {/* Sort Handle / Move */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveColor(idx, 'up')}
                className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#6B6358] transition"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={idx === scales.length - 1}
                onClick={() => moveColor(idx, 'down')}
                className="p-1 hover:text-[#C9A96E] disabled:opacity-20 text-[#6B6358] transition"
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
                className="w-8 h-8 rounded-none cursor-pointer bg-transparent border border-[#333333] p-0"
              />
            </div>

            {/* Color Name */}
            <div className="w-28">
              <input
                type="text"
                value={scale.color_name}
                onChange={(e) => handleFieldChange(idx, 'color_name', e.target.value)}
                placeholder="Farbname"
                className="w-full bg-[#1E1E1E] border border-[#333333] focus:border-[#C9A96E] rounded-none px-2.5 py-1.5 text-[#E8E0D4] font-semibold focus:outline-none font-mono"
              />
            </div>

            {/* Difficulty Label */}
            <div className="w-36">
              <input
                type="text"
                value={scale.difficulty_label}
                onChange={(e) => handleFieldChange(idx, 'difficulty_label', e.target.value)}
                placeholder="z.B. Mittel / Fortgeschritten"
                className="w-full bg-[#1E1E1E] border border-[#333333] focus:border-[#C9A96E] rounded-none px-2.5 py-1.5 text-[#E8E0D4] focus:outline-none font-sans"
              />
            </div>

            {/* Font Range Min & Max */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B6358] font-mono text-[11px]">Font:</span>
              <input
                type="text"
                value={scale.font_range_min}
                onChange={(e) => handleFieldChange(idx, 'font_range_min', e.target.value)}
                placeholder="Min"
                className="w-14 bg-[#1E1E1E] border border-[#333333] focus:border-[#C9A96E] rounded-none px-1.5 py-1.5 text-[#E8E0D4] text-center focus:outline-none font-mono font-bold"
              />
              <span className="text-[#6B6358]">–</span>
              <input
                type="text"
                value={scale.font_range_max}
                onChange={(e) => handleFieldChange(idx, 'font_range_max', e.target.value)}
                placeholder="Max"
                className="w-14 bg-[#1E1E1E] border border-[#333333] focus:border-[#C9A96E] rounded-none px-1.5 py-1.5 text-[#E8E0D4] text-center focus:outline-none font-mono font-bold"
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeColor(idx)}
              className="p-2 text-[#6B6358] hover:text-[#A0522D] hover:bg-[#2A2A2A] rounded-[2px] ml-auto transition-colors"
              title="Farbe entfernen"
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
          className="px-5 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold tracking-wider text-xs rounded-[2px] flex items-center gap-2 transition-all"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedSuccess ? 'Gespeichert!' : 'Farbsystem speichern'}
        </button>
      </div>
    </div>
  );
};
