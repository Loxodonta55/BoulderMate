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
import { Star, Plus, Minus, X, AlertCircle, Save } from 'lucide-react';

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

  // When switching grade scale, reset grade to default of that scale
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

  // When ascent style is flash or onsight, attempts must be 1
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
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            {initialData ? 'Boulder bearbeiten' : 'Neuen Boulder erfassen'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Präzise Kletterdaten und Beta erfassen
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Bitte korrigiere folgende Eingaben:</div>
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
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Boulder Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="z.B. Midnight Lightning, Gelbe 12, Dach-Problem"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full bg-slate-950 border ${errors.name ? 'border-rose-500' : 'border-slate-800'} rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Halle / Felsgebiet <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="z.B. Minimum Zürich, Blockfeld, Fontainebleau"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full bg-slate-950 border ${errors.location ? 'border-rose-500' : 'border-slate-800'} rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Sektor / Wandbereich <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="z.B. Wettkampfwand, Höhle, Sektor 3"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Datum <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grade Scale & Grade Selector */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Schwierigkeitssystem & Grad <span className="text-rose-400">*</span>
          </label>
          {/* Scale Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleScaleChange('font')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeScale === 'font' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fontainebleau
            </button>
            <button
              type="button"
              onClick={() => handleScaleChange('v_scale')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeScale === 'v_scale' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              V-Scale
            </button>
            <button
              type="button"
              onClick={() => handleScaleChange('color')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeScale === 'color' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hallen-Farben
            </button>
          </div>
        </div>

        {/* Grade Buttons Selection */}
        {gradeScale === 'font' && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
            {FONT_GRADES.map(g => (
              <button
                type="button"
                key={g}
                onClick={() => setGrade(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  grade === g
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {gradeScale === 'v_scale' && (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
            {V_GRADES.map(g => (
              <button
                type="button"
                key={g}
                onClick={() => setGrade(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  grade === g
                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
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
                className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                  grade === c.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-100 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-slate-600 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <div className="font-semibold">{c.value}</div>
                  <div className="text-[10px] text-slate-400">~{c.equivalentFont} ({c.equivalentV})</div>
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
          <label className="block text-xs font-semibold text-slate-300">
            Begehungsstil <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ASCENT_STYLES.map(style => (
              <button
                type="button"
                key={style.value}
                onClick={() => setAscentStyle(style.value)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  ascentStyle === style.value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{style.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Attempts Stepper */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Versuche (Attempts)
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2 justify-between">
            <button
              type="button"
              disabled={ascentStyle === 'flash' || ascentStyle === 'onsight' || attempts <= 1}
              onClick={() => setAttempts(Math.max(1, attempts - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold text-slate-100 min-w-[2rem] text-center">
              {attempts}
            </span>
            <button
              type="button"
              disabled={ascentStyle === 'flash' || ascentStyle === 'onsight'}
              onClick={() => setAttempts(attempts + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {(ascentStyle === 'flash' || ascentStyle === 'onsight') && (
            <div className="text-[11px] text-amber-400/90 italic">
              Fixiert auf 1 bei {ascentStyle === 'flash' ? 'Flash' : 'Onsight'}
            </div>
          )}
        </div>
      </div>

      {/* Wall Angle & Perceived Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wall Angle */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Wandneigung
          </label>
          <select
            value={wallAngle || ''}
            onChange={(e) => setWallAngle((e.target.value as WallAngle) || undefined)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Keine Angabe</option>
            {WALL_ANGLES.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* Perceived Difficulty */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Subjektives Empfinden (Härte)
          </label>
          <select
            value={perceivedDifficulty || ''}
            onChange={(e) => setPerceivedDifficulty((e.target.value as PerceivedDifficulty) || undefined)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
        <label className="block text-xs font-semibold text-slate-300">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
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
        <label className="block text-xs font-semibold text-slate-300">
          Qualität / Spaßfaktor ({rating} von 5 Sternen)
        </label>
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="p-1 text-slate-600 hover:text-amber-400 focus:outline-none transition-colors"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Crux Description & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Schlüsselstelle (Crux) & Beta
          </label>
          <textarea
            rows={3}
            placeholder="z.B. Hoher Heelhook rechts, weiter Zug auf Sloper, Trittwechsel vor dem Top..."
            value={cruxDescription}
            onChange={(e) => setCruxDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Notizen & Tags
          </label>
          <textarea
            rows={2}
            placeholder="Allgemeine Notizen zum Zustand, Wetter, Gefühle..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-2"
          />
          <input
            type="text"
            placeholder="Tags (kommagetrennt, z.B. dyno, leiste, kniebar)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-xs md:text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-xs md:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initialData ? 'Änderungen speichern' : 'Boulder erfassen'}
        </button>
      </div>
    </form>
  );
};
