import React, { useState } from 'react';
import {
  WallBoulder,
  GymGradeScale,
  GradeFeel,
  RadarAttributes,
  BoulderRating,
  RatingInput,
  CurrentUser
} from '../types/boulder';
import {
  Star,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface RatingModalProps {
  boulder: WallBoulder;
  gradeScale?: GymGradeScale;
  currentUser: CurrentUser;
  existingRating: BoulderRating | null;
  isOpen: boolean;
  isTriggeredByAscent?: boolean; // AC-4 context
  onClose: () => void;
  onSave: (input: RatingInput) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  boulder,
  gradeScale,
  existingRating,
  isOpen,
  isTriggeredByAscent = false,
  onClose,
  onSave,
}) => {
  const [gradeFeel, setGradeFeel] = useState<GradeFeel | undefined>(
    existingRating?.gradeFeel || undefined
  );
  const [qualityStars, setQualityStars] = useState<number>(
    existingRating?.qualityStars || 5
  );
  const [hoverStars, setHoverStars] = useState<number | null>(null);

  // Expandable Radar sliders (AC-6)
  const [isRadarExpanded, setIsRadarExpanded] = useState<boolean>(false);
  const [radarValues, setRadarValues] = useState<RadarAttributes>({
    kraft: existingRating?.radar?.kraft || boulder.radar.kraft || 3,
    technik: existingRating?.radar?.technik || boulder.radar.technik || 3,
    balance: existingRating?.radar?.balance || boulder.radar.balance || 3,
    koordination: existingRating?.radar?.koordination || boulder.radar.koordination || 3,
    flexibilitaet: existingRating?.radar?.flexibilitaet || boulder.radar.flexibilitaet || 3,
  });

  if (!isOpen) return null;

  const handleSliderChange = (axis: keyof RadarAttributes, val: number) => {
    setRadarValues(prev => ({ ...prev, [axis]: val }));
  };

  const handleSave = () => {
    const payload: RatingInput = {
      gradeFeel,
      qualityStars,
      radar: isRadarExpanded || existingRating?.radar ? radarValues : undefined,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: gradeScale?.colorHex || '#f59e0b' }}
            />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{boulder.name || `${gradeScale?.colorName || 'Boulder'} Problem`}</span>
                {existingRating && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Aktualisieren
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {isTriggeredByAscent
                  ? 'Glückwunsch zum Top! Wie fandest du die Route?'
                  : 'Bewerte Schwierigkeit & Spaßfaktor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-6">
          {/* Section 1: Grad-Empfinden (AC-6) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Grad-Empfinden (Schwierigkeit)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGradeFeel('soft')}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'soft'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🟢</span>
                <span>Soft</span>
                <span className="text-[10px] font-normal text-slate-400">eher leicht</span>
              </button>

              <button
                type="button"
                onClick={() => setGradeFeel('fair')}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'fair'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🟡</span>
                <span>Fair</span>
                <span className="text-[10px] font-normal text-slate-400">genau passend</span>
              </button>

              <button
                type="button"
                onClick={() => setGradeFeel('stiff')}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'stiff'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🔴</span>
                <span>Stiff</span>
                <span className="text-[10px] font-normal text-slate-400">ziemlich hart</span>
              </button>
            </div>
          </div>

          {/* Section 2: Sterne-Bewertung (AC-6) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Routenqualität & Spaß
              </label>
              <span className="text-xs font-bold text-amber-400">
                {hoverStars !== null ? hoverStars : qualityStars} von 5 Sternen
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {[1, 2, 3, 4, 5].map(star => {
                const isActive = (hoverStars !== null ? hoverStars : qualityStars) >= star;
                return (
                  <button
                    key={`star-${star}`}
                    type="button"
                    onMouseEnter={() => setHoverStars(star)}
                    onMouseLeave={() => setHoverStars(null)}
                    onClick={() => setQualityStars(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    aria-label={`${star} Sterne`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isActive
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)]'
                          : 'text-slate-700 hover:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Einklappbarer Bereich für Radar-Slider (AC-6) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setIsRadarExpanded(!isRadarExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Klettereigenschaften bewerten (Radar-Chart)</span>
              </div>
              {isRadarExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isRadarExpanded && (
              <div className="p-4 space-y-4 border-t border-slate-800 bg-slate-950/80 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[11px] text-slate-400">
                  Passe die 5 Achsen nach deinem Empfinden an (1 = minimal, 5 = dominant).
                  Fließt mit in den Community-Schnitt ein!
                </p>

                {(['kraft', 'technik', 'balance', 'koordination', 'flexibilitaet'] as (keyof RadarAttributes)[]).map(axis => {
                  const labels: Record<keyof RadarAttributes, string> = {
                    kraft: 'Kraft / Bouldermuskeln',
                    technik: 'Technik / Präzision',
                    balance: 'Balance / Körpergefühl',
                    koordination: 'Koordination / Dynos',
                    flexibilitaet: 'Flexibilität / Mobilität',
                  };

                  return (
                    <div key={axis} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-300">
                        <span>{labels[axis]}</span>
                        <span className="text-amber-400">{radarValues[axis]}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={radarValues[axis]}
                        onChange={e => handleSliderChange(axis, parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            {isTriggeredByAscent && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-center"
              >
                Überspringen
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Bewertung speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
