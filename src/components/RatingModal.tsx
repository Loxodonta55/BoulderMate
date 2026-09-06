import React, { useState } from 'react';
import {
  WallBoulder,
  GymGradeScale,
  GradeFeel,
  RadarAttributes,
  BoulderRating,
  RatingInput,
  CurrentUser,
  RADAR_AXIS_DEFINITIONS
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
    maximalkraft:
      existingRating?.radar?.maximalkraft ||
      existingRating?.radar?.kraft ||
      boulder.radar.maximalkraft ||
      boulder.radar.kraft ||
      3,
    kraftausdauer:
      existingRating?.radar?.kraftausdauer ||
      boulder.radar.kraftausdauer ||
      3,
    technik: existingRating?.radar?.technik || boulder.radar.technik || 3,
    balance: existingRating?.radar?.balance || boulder.radar.balance || 3,
    koordination: existingRating?.radar?.koordination || boulder.radar.koordination || 3,
    flexibilitaet: existingRating?.radar?.flexibilitaet || boulder.radar.flexibilitaet || 3,
    kraft:
      existingRating?.radar?.maximalkraft ||
      existingRating?.radar?.kraft ||
      boulder.radar.maximalkraft ||
      boulder.radar.kraft ||
      3,
  });

  if (!isOpen) return null;

  const handleSliderChange = (axis: keyof RadarAttributes, val: number) => {
    setRadarValues(prev => {
      const next = { ...prev, [axis]: val };
      if (axis === 'maximalkraft') next.kraft = val;
      if (axis === 'kraft') next.maximalkraft = val;
      return next;
    });
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333333] rounded-none overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#333333] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-none border border-black/30 shrink-0"
              style={{ backgroundColor: gradeScale?.colorHex || '#C9A96E' }}
            />
            <div>
              <h2 className="text-base font-headline uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                <span>{boulder.name || `${gradeScale?.colorName || 'Boulder'} Problem`}</span>
                {existingRating && (
                  <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-[#C9A96E] bg-[#2A2A2A] px-2 py-0.5 rounded-none border border-[#333333]">
                    Aktualisieren
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-[#A89F91]">
                {isTriggeredByAscent
                  ? 'Glückwunsch zum Top! Wie fandest du die Route?'
                  : 'Bewerte Schwierigkeit & Spaßfaktor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] transition"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-6">
          {/* Section 1: Grad-Empfinden (AC-6) */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A89F91] block">
              Grad-Empfinden (Schwierigkeit)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGradeFeel('soft')}
                className={`py-3 px-2 rounded-[2px] text-xs font-mono font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'soft'
                    ? 'bg-[#2A2A2A] border-[#4A5D3A] text-[#86A369] border-2'
                    : 'bg-[#121212] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8]'
                }`}
              >
                <span className="text-base">🟢</span>
                <span className="font-headline uppercase tracking-wider">Soft</span>
                <span className="text-[10px] font-normal text-[#A89F91]">eher leicht</span>
              </button>

              <button
                type="button"
                onClick={() => setGradeFeel('fair')}
                className={`py-3 px-2 rounded-[2px] text-xs font-mono font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'fair'
                    ? 'bg-[#2A2A2A] border-[#C9A96E] text-[#C9A96E] border-2'
                    : 'bg-[#121212] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8]'
                }`}
              >
                <span className="text-base">🟡</span>
                <span className="font-headline uppercase tracking-wider">Fair</span>
                <span className="text-[10px] font-normal text-[#A89F91]">genau passend</span>
              </button>

              <button
                type="button"
                onClick={() => setGradeFeel('stiff')}
                className={`py-3 px-2 rounded-[2px] text-xs font-mono font-bold border transition flex flex-col items-center gap-1 ${
                  gradeFeel === 'stiff'
                    ? 'bg-[#2A2A2A] border-[#A0522D] text-[#D97D5B] border-2'
                    : 'bg-[#121212] border-[#333333] text-[#A89F91] hover:border-[#F5F0E8]'
                }`}
              >
                <span className="text-base">🔴</span>
                <span className="font-headline uppercase tracking-wider">Stiff</span>
                <span className="text-[10px] font-normal text-[#A89F91]">ziemlich hart</span>
              </button>
            </div>
          </div>

          {/* Section 2: Sterne-Bewertung (AC-6) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A89F91] block">
                Routenqualität & Spaß
              </label>
              <span className="text-xs font-mono font-bold text-[#C9A96E]">
                {hoverStars !== null ? hoverStars : qualityStars} von 5 Sternen
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 py-3 bg-[#121212] rounded-none border border-[#333333]">
              {[1, 2, 3, 4, 5].map(star => {
                const isActive = (hoverStars !== null ? hoverStars : qualityStars) >= star;
                return (
                  <button
                    key={`star-${star}`}
                    type="button"
                    onMouseEnter={() => setHoverStars(star)}
                    onMouseLeave={() => setHoverStars(null)}
                    onClick={() => setQualityStars(star)}
                    className="p-1 transition-opacity hover:opacity-80 active:opacity-60 focus:outline-none"
                    aria-label={`${star} Sterne`}
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isActive
                          ? 'fill-[#C9A96E] text-[#C9A96E]'
                          : 'text-[#333333] hover:text-[#6B6358]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Einklappbarer Bereich für Radar-Slider (AC-6) */}
          <div className="border border-[#333333] rounded-none overflow-hidden bg-[#121212]">
            <button
              type="button"
              onClick={() => setIsRadarExpanded(!isRadarExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-headline uppercase tracking-wider text-[#E8E0D4] hover:bg-[#1E1E1E] transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Klettereigenschaften bewerten (Radar-Chart)</span>
              </div>
              {isRadarExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#A89F91]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A89F91]" />
              )}
            </button>

            {isRadarExpanded && (
              <div className="p-4 space-y-4 border-t border-[#333333] bg-[#1E1E1E] animate-in slide-in-from-top-2 duration-150">
                <p className="text-[11px] font-mono text-[#A89F91]">
                  Passe die 6 Achsen nach deinem Empfinden an (1 = minimal, 5 = dominant).
                  Fließt mit in den Community-Schnitt ein!
                </p>

                {RADAR_AXIS_DEFINITIONS.map(axisDef => (
                  <div key={axisDef.key} className="space-y-1 font-mono">
                    <div className="flex justify-between text-[11px] font-bold text-[#E8E0D4]">
                      <span>{axisDef.fullLabel}</span>
                      <span className="text-[#C9A96E] font-bold">{radarValues[axisDef.key]}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={radarValues[axisDef.key]}
                      onChange={e => handleSliderChange(axisDef.key, parseInt(e.target.value, 10))}
                      className="w-full accent-[#C9A96E] bg-[#121212] h-2 rounded-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            {isTriggeredByAscent && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] rounded-[2px] transition text-center"
              >
                Überspringen
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2 px-4 text-xs font-headline uppercase font-bold tracking-wider text-[#121212] bg-[#F5F0E8] hover:bg-[#E8E0D4] rounded-[2px] transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
              <span>Bewertung speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
