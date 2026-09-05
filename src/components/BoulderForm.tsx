import React, { useState, useEffect } from 'react';
import {
  Boulder,
  BoulderInput,
  GradeScale,
  FONT_GRADES,
  V_GRADES,
  COLOR_GRADES,
  ASCENT_STYLES,
  WALL_ANGLES,
  HOLD_TYPES,
  PERCEIVED_DIFFICULTIES,
  AscentStyle,
  WallAngle,
  HoldType,
  PerceivedDifficulty
} from '../types/boulder';
import { validateBoulderInput } from '../lib/storage';
import { Star, Plus, Minus, X, AlertCircle, Save, Compass } from 'lucide-react';

interface Props {
  initialData?: Boulder | null;
  onSave: (data: BoulderInput) => void;
  onCancel: () => void;
}

export const BoulderForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState(initialData?.name || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [sector, setSector] = useState(initialData?.sector || '');
  const [date, setDate] = useState(initialData?.date || today);
  const [gradeScale, setGradeScale] = useState<GradeScale>(initialData?.gradeScale || 'font');
  const [grade, setGrade] = useState<string>(initialData?.grade || '6A');
  const [colorHex, setColorHex] = useState<string | undefined>(initialData?.colorHex);
  const [ascentStyle, setAscentStyle] = useState<AscentStyle>(initialData?.ascentStyle || 'top');
  const [attempts, setAttempts] = useState<number>(initialData?.attempts || 2);
  const [wallAngle, setWallAngle] = useState<WallAngle | undefined>(initialData?.wallAngle);
  const [holdTypes, setHoldTypes] = useState<HoldType[]>(initialData?.holdTypes || []);
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty | undefined>(initialData?.perceivedDifficulty);
  const [rating, setRating] = useState<number>(initialData?.rating || 3);
  const [cruxDescription, setCruxDescription] = useState(initialData?.cruxDescription || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleScaleChange = (newScale: GradeScale) => {
    setGradeScale(newScale);
    if (newScale === 'font') {
      setGrade('6A');
      setColorHex(undefined);
    } else if (newScale === 'v_scale') {
      setGrade('V3');
      setColorHex(undefined);
    } else if (newScale === 'color') {
      setGrade('Blau');
      setColorHex(COLOR_GRADES[2].hex);
    }
  };

  useEffect(() => {
    if (ascentStyle === 'flash' || ascentStyle === 'onsight') {
      setAttempts(1);
    }
  }, [ascentStyle]);

  const toggleHoldType = (ht: HoldType) => {
    if (holdTypes.includes(ht)) {
      setHoldTypes(holdTypes.filter(h => h !== ht));
    } else {
      setHoldTypes([...holdTypes, ht]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload: BoulderInput = {
      name: name.trim(),
      location: location.trim(),
      sector: sector.trim() || undefined,
      date,
      gradeScale,
      grade,
      colorHex,
      ascentStyle,
      attempts: (ascentStyle === 'flash' || ascentStyle === 'onsight') ? 1 : Math.max(1, attempts),
      wallAngle: wallAngle || undefined,
      holdTypes,
      perceivedDifficulty: perceivedDifficulty || undefined,
      rating: rating > 0 ? rating : undefined,
      cruxDescription: cruxDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      tags
    };

    const validation = validateBoulderInput(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1E1E1E] border border-[#333333] rounded-none p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-[#333333] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#2A2A2A] border border-[#333333] text-[#C9A96E] rounded-none">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#E8E0D4] font-headline tracking-wide uppercase">
              {initialData ? 'Route bearbeiten' : 'Routen-Protokoll // Neuer Boulder'}
            </h2>
            <p className="text-[11px] text-[#A89F91] font-mono">
              Präzise Topo-Daten & Crux-Erfassung
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] rounded-[2px] transition-colors border border-transparent hover:border-[#333333]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-[#121212] border border-[#A0522D] rounded-none p-3 flex items-start gap-2.5 text-[#A0522D] text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-[#A0522D] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-1 font-headline tracking-wider uppercase">Bitte korrigiere folgende Angaben:</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Basic Info: Name, Location, Sector, Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Boulder Name <span className="text-[#C9A96E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="z.B. Midnight Lightning, Gelbe 12, Dach-Problem"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-[#121212] border ${errors.name ? 'border-[#A0522D]' : 'border-[#333333]'} rounded-none px-3.5 py-2.5 text-xs md:text-sm text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-sans`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Gebiet / Halle <span className="text-[#C9A96E]">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="z.B. Fontainebleau, Minimum Zürich, Magic Wood"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full bg-[#121212] border ${errors.location ? 'border-[#A0522D]' : 'border-[#333333]'} rounded-none px-3.5 py-2.5 text-xs md:text-sm text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-sans`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Sektor / Wandbereich <span className="text-[#6B6358]">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="z.B. Cuvier Rempart, Wettkampfwand, Höhle"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3.5 py-2.5 text-xs md:text-sm text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-sans"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Datum <span className="text-[#C9A96E]">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3.5 py-2.5 text-xs md:text-sm text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-mono"
          />
        </div>
      </div>

      {/* Grade Scale & Grade Selector */}
      <div className="bg-[#121212] border border-[#333333] rounded-none p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#E8E0D4] font-headline uppercase tracking-wider">
            Bewertungssystem & Grad <span className="text-[#C9A96E]">*</span>
          </label>
          {/* Scale Tabs */}
          <div className="flex bg-[#1E1E1E] p-1 rounded-none border border-[#333333] text-xs font-headline uppercase">
            <button
              type="button"
              onClick={() => handleScaleChange('font')}
              className={`px-3 py-1 rounded-[2px] font-bold transition-all ${
                gradeScale === 'font' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
            >
              Fontainebleau
            </button>
            <button
              type="button"
              onClick={() => handleScaleChange('v_scale')}
              className={`px-3 py-1 rounded-[2px] font-bold transition-all ${
                gradeScale === 'v_scale' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
            >
              V-Scale
            </button>
            <button
              type="button"
              onClick={() => handleScaleChange('color')}
              className={`px-3 py-1 rounded-[2px] font-bold transition-all ${
                gradeScale === 'color' ? 'bg-[#F5F0E8] text-[#121212]' : 'text-[#A89F91] hover:text-[#E8E0D4]'
              }`}
            >
              Hallen-Farben
            </button>
          </div>
        </div>

        {/* Grade Buttons Selection */}
        {gradeScale === 'font' && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#1E1E1E] rounded-none border border-[#333333]">
            {FONT_GRADES.map(g => (
              <button
                type="button"
                key={g}
                onClick={() => setGrade(g)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition-all border ${
                  grade === g
                    ? 'bg-[#F5F0E8] text-[#121212] border-[#F5F0E8]'
                    : 'bg-[#2A2A2A] border-[#333333] text-[#E8E0D4] hover:border-[#6B6358]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {gradeScale === 'v_scale' && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-[#1E1E1E] rounded-none border border-[#333333]">
            {V_GRADES.map(g => (
              <button
                type="button"
                key={g}
                onClick={() => setGrade(g)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold transition-all border ${
                  grade === g
                    ? 'bg-[#F5F0E8] text-[#121212] border-[#F5F0E8]'
                    : 'bg-[#2A2A2A] border-[#333333] text-[#E8E0D4] hover:border-[#6B6358]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {gradeScale === 'color' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {COLOR_GRADES.map(c => (
              <button
                type="button"
                key={c.value}
                onClick={() => {
                  setGrade(c.value);
                  setColorHex(c.hex);
                }}
                className={`flex items-center gap-2 p-2 rounded-none text-left border text-xs transition-all ${
                  grade === c.value
                    ? 'border-[#C9A96E] bg-[#2A2A2A] text-[#E8E0D4] font-bold'
                    : 'border-[#333333] bg-[#1E1E1E] text-[#A89F91] hover:border-[#6B6358]'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-none border border-black/40 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <div className="font-bold font-headline uppercase">{c.value}</div>
                  <div className="text-[10px] text-[#A89F91] font-mono">~{c.equivalentFont} ({c.equivalentV})</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ascent Style & Attempts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Style Selector */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider">
            Begehungsstil <span className="text-[#C9A96E]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ASCENT_STYLES.map(style => (
              <button
                type="button"
                key={style.value}
                onClick={() => setAscentStyle(style.value)}
                className={`p-2.5 rounded-none border text-left transition-all ${
                  ascentStyle === style.value
                    ? 'border-[#C9A96E] bg-[#2A2A2A] text-[#C9A96E] font-bold'
                    : 'border-[#333333] bg-[#121212] text-[#A89F91] hover:border-[#6B6358]'
                }`}
              >
                <div className="text-xs font-bold font-headline uppercase tracking-wide">{style.label}</div>
                <div className="text-[10px] text-[#6B6358] font-sans leading-tight mt-0.5">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Attempts Stepper */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider">
            Versuche (Attempts)
          </label>
          <div className="flex items-center space-x-2 bg-[#121212] border border-[#333333] rounded-none p-2 justify-between">
            <button
              type="button"
              disabled={ascentStyle === 'flash' || ascentStyle === 'onsight' || attempts <= 1}
              onClick={() => setAttempts(Math.max(1, attempts - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-[2px] bg-[#2A2A2A] border border-[#333333] text-[#E8E0D4] hover:bg-[#333333] disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold text-[#E8E0D4] min-w-[2rem] text-center font-mono">
              {attempts}
            </span>
            <button
              type="button"
              disabled={ascentStyle === 'flash' || ascentStyle === 'onsight'}
              onClick={() => setAttempts(attempts + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-[2px] bg-[#2A2A2A] border border-[#333333] text-[#E8E0D4] hover:bg-[#333333] disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {(ascentStyle === 'flash' || ascentStyle === 'onsight') && (
            <div className="text-[11px] text-[#C9A96E] font-mono italic">
              Fixiert auf 1 bei {ascentStyle === 'flash' ? 'Flash' : 'Onsight'}
            </div>
          )}
        </div>
      </div>

      {/* Wall Angle & Perceived Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Wandneigung
          </label>
          <select
            value={wallAngle || ''}
            onChange={(e) => setWallAngle((e.target.value as WallAngle) || undefined)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3.5 py-2 text-xs md:text-sm text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
          >
            <option value="">Keine Angabe</option>
            {WALL_ANGLES.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Subjektives Empfinden (Härte)
          </label>
          <select
            value={perceivedDifficulty || ''}
            onChange={(e) => setPerceivedDifficulty((e.target.value as PerceivedDifficulty) || undefined)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3.5 py-2 text-xs md:text-sm text-[#E8E0D4] focus:outline-none focus:border-[#C9A96E] font-sans"
          >
            <option value="">Keine Angabe</option>
            {PERCEIVED_DIFFICULTIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hold Types Multi-Select */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider">
          Griffformen (Mehrfachauswahl)
        </label>
        <div className="flex flex-wrap gap-2">
          {HOLD_TYPES.map(ht => {
            const isSelected = holdTypes.includes(ht.value);
            return (
              <button
                type="button"
                key={ht.value}
                onClick={() => toggleHoldType(ht.value)}
                className={`px-3 py-1.5 rounded-none text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#2A2A2A] text-[#C9A96E] border-[#C9A96E] font-bold'
                    : 'bg-[#121212] border-[#333333] text-[#A89F91] hover:text-[#E8E0D4]'
                }`}
              >
                {ht.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Star Rating */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider">
          Qualität / Charakter ({rating} von 5 Sternen)
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="p-1 text-[#333333] hover:text-[#C9A96E] focus:outline-none transition-colors"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating ? 'text-[#C9A96E] fill-[#C9A96E]' : 'text-[#333333]'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Crux Description & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Schlüsselstelle (Crux) & Beta
          </label>
          <textarea
            rows={3}
            placeholder="z.B. Hoher Heelhook rechts, weiter Zug auf Sloper, Trittwechsel vor dem Top..."
            value={cruxDescription}
            onChange={(e) => setCruxDescription(e.target.value)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#A89F91] font-headline uppercase tracking-wider mb-1">
            Feld-Notizen & Tags
          </label>
          <textarea
            rows={2}
            placeholder="Wetter, Grip, Felstemperatur..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-2 text-xs text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-mono mb-2"
          />
          <input
            type="text"
            placeholder="Tags (kommagetrennt, z.B. dyno, leiste, kniebar)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full bg-[#121212] border border-[#333333] rounded-none px-3 py-1.5 text-xs text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-mono"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#333333]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-headline uppercase tracking-wider font-semibold text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] rounded-[2px] transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-xs font-headline uppercase tracking-wider font-bold bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] rounded-[2px] transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initialData ? 'Änderungen speichern' : 'Boulder erfassen'}
        </button>
      </div>
    </form>
  );
};
