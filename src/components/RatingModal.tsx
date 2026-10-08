import React, { useState, useEffect } from 'react';
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
  Sliders,
  Trash2,
  ArrowRight
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
  onDeleteRating?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  boulder,
  gradeScale,
  existingRating,
  isOpen,
  isTriggeredByAscent = false,
  onClose,
  onSave,
  onDeleteRating,
}) => {
  // Step 1: GradeFeel ('soft' | 'fair' | 'stiff')
  // Step 2: Quality Stars (1-5) & optional Radar attributes
  const [step, setStep] = useState<1 | 2>(1);

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

  // Reset to step 1 whenever modal opens (or boulder rating ID changes)
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setGradeFeel(existingRating?.gradeFeel || undefined);
      setQualityStars(existingRating?.qualityStars || 5);
    }
  }, [isOpen, existingRating?.id]);

  if (!isOpen) return null;

  const handleSliderChange = (axis: keyof RadarAttributes, val: number) => {
    setRadarValues(prev => {
      const next = { ...prev, [axis]: val };
      if (axis === 'maximalkraft') next.kraft = val;
      if (axis === 'kraft') next.maximalkraft = val;
      return next;
    });
  };

  const handleSelectGradeFeel = (feel: GradeFeel) => {
    setGradeFeel(feel);
    // Sofort zum zweiten Schritt (Sterne & Radar) uebergehen
    setStep(2);
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
      <div className="w-full max-w-md bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bm-line)] flex items-center justify-between bg-[var(--bm-bg)]">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-xl border border-black/30 shrink-0"
              style={{ backgroundColor: gradeScale?.colorHex || 'var(--bm-text-3)' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-headline text-[var(--bm-text)] flex items-center gap-1.5">
                  <span>{boulder.name || `${gradeScale?.colorName || 'Boulder'} Problem`}</span>
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-line)]">
                  Schritt {step}/2
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--bm-text-2)]">
                {step === 1
                  ? 'Wie fandest du den Grad / die Schwierigkeit?'
                  : 'Routenqualität & Spaß bewerten'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] transition cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: NUR Grad-Empfinden */}
        {step === 1 && (
          <div className="p-4 sm:p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-mono font-bold text-[var(--bm-text-2)] block text-center">
                Grad-Empfinden (Schwierigkeit)
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectGradeFeel('soft')}
                  className={`py-4 px-2 rounded-xl text-xs font-mono font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 ${
                    gradeFeel === 'soft'
                      ? 'bg-[var(--bm-elevated)] border-[var(--bm-success)] text-[var(--bm-success)] border-2'
                      : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-success)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <span className="font-headline text-sm">Soft</span>
                  <span className="text-[10px] font-normal text-[var(--bm-text-2)]">eher leicht</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGradeFeel('fair')}
                  className={`py-4 px-2 rounded-xl text-xs font-mono font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 ${
                    gradeFeel === 'fair'
                      ? 'bg-[var(--bm-elevated)] border-[var(--bm-accent)] text-[var(--bm-accent)] border-2'
                      : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-accent)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <span className="font-headline text-sm">Fair</span>
                  <span className="text-[10px] font-normal text-[var(--bm-text-2)]">genau passend</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGradeFeel('stiff')}
                  className={`py-4 px-2 rounded-xl text-xs font-mono font-bold border transition flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 ${
                    gradeFeel === 'stiff'
                      ? 'bg-[var(--bm-elevated)] border-[var(--bm-danger)] text-[var(--bm-danger)] border-2'
                      : 'bg-[var(--bm-bg)] border-[var(--bm-line)] text-[var(--bm-text-2)] hover:border-[var(--bm-danger)] hover:text-[var(--bm-text)]'
                  }`}
                >
                  <span className="font-headline text-sm">Stiff</span>
                  <span className="text-[10px] font-normal text-[var(--bm-text-2)]">ziemlich hart</span>
                </button>
              </div>
            </div>

            {/* Action Row Step 1 */}
            <div className="flex items-center gap-3 pt-2">
              {existingRating && onDeleteRating && (
                <button
                  type="button"
                  data-testid="delete-rating-modal-btn"
                  onClick={() => {
                    onDeleteRating();
                    onClose();
                  }}
                  className="py-2 px-3 text-xs font-mono font-semibold text-[var(--bm-danger)] hover:text-[var(--bm-danger)] bg-[var(--bm-danger)]/10 hover:bg-[var(--bm-danger)]/15 border border-[var(--bm-danger)]/40 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  title="Eigene Bewertung löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Löschen</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 text-xs font-mono font-semibold text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition text-center cursor-pointer"
              >
                {isTriggeredByAscent ? 'Überspringen' : 'Abbrechen'}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 px-4 text-xs font-headline font-bold text-[var(--bm-bg)] bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Weiter</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Qualität 1-5 Sterne & optional Radar bewerten */}
        {step === 2 && (
          <div className="p-4 sm:p-5 space-y-6 animate-in fade-in duration-150">
            {/* Ausgewaehltes Grad-Empfinden als kompakter Badge mit Zurueck-Option */}
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] text-xs font-mono">
              <span className="text-[var(--bm-text-2)]">Grad-Empfinden:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--bm-text)]">
                  {gradeFeel ? (
                    <>
                      {gradeFeel === 'soft' && 'Soft'}
                      {gradeFeel === 'fair' && 'Fair'}
                      {gradeFeel === 'stiff' && 'Stiff'}
                    </>
                  ) : (
                    'Nicht angegeben'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-[var(--bm-accent)] hover:underline cursor-pointer ml-1"
                >
                  Ändern
                </button>
              </div>
            </div>

            {/* Sterne-Bewertung (1-5 Sterne) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[var(--bm-text-2)] block">
                  Routenqualität & Spaß
                </label>
                <span className="text-xs font-mono font-bold text-[var(--bm-accent)]">
                  {hoverStars !== null ? hoverStars : qualityStars} von 5 Sternen
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 py-3 bg-[var(--bm-bg)] rounded-xl border border-[var(--bm-line)]">
                {[1, 2, 3, 4, 5].map(star => {
                  const isActive = (hoverStars !== null ? hoverStars : qualityStars) >= star;
                  return (
                    <button
                      key={`star-${star}`}
                      type="button"
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(null)}
                      onClick={() => setQualityStars(star)}
                      className="p-1 transition-opacity hover:opacity-80 active:opacity-60 focus:outline-none cursor-pointer"
                      aria-label={`${star} Sterne`}
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isActive
                            ? 'fill-[var(--bm-star)] text-[var(--bm-accent)]'
                            : 'text-[var(--bm-line)] hover:text-[var(--bm-text-3)]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optionales Radar (wie gehabt optional einklappbar) */}
            <div className="border border-[var(--bm-line)] rounded-xl overflow-hidden bg-[var(--bm-bg)]">
              <button
                type="button"
                onClick={() => setIsRadarExpanded(!isRadarExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-headline text-[var(--bm-text)] hover:bg-[var(--bm-surface)] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                  <span>Klettereigenschaften bewerten (Radar-Chart)</span>
                  <span className="text-[10px] font-mono text-[var(--bm-text-2)] normal-case tracking-normal">
                    (optional)
                  </span>
                </div>
                {isRadarExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[var(--bm-text-2)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--bm-text-2)]" />
                )}
              </button>

              {isRadarExpanded && (
                <div className="p-4 space-y-4 border-t border-[var(--bm-line)] bg-[var(--bm-surface)] animate-in slide-in-from-top-2 duration-150">
                  <p className="text-[11px] font-mono text-[var(--bm-text-2)]">
                    Passe die 6 Achsen nach deinem Empfinden an (1 = minimal, 5 = dominant).
                    Fließt mit in den Community-Schnitt ein!
                  </p>

                  {RADAR_AXIS_DEFINITIONS.map(axisDef => (
                    <div key={axisDef.key} className="space-y-1 font-mono">
                      <div className="flex justify-between text-[11px] font-bold text-[var(--bm-text)]">
                        <span>{axisDef.fullLabel}</span>
                        <span className="text-[var(--bm-accent)] font-bold">{radarValues[axisDef.key]}/5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={radarValues[axisDef.key]}
                        onChange={e => handleSliderChange(axisDef.key, parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--bm-accent)] bg-[var(--bm-bg)] h-2 rounded-xl cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Row Step 2 */}
            <div className="flex items-center gap-3 pt-2">
              {existingRating && onDeleteRating && (
                <button
                  type="button"
                  data-testid="delete-rating-modal-btn"
                  onClick={() => {
                    onDeleteRating();
                    onClose();
                  }}
                  className="py-2 px-3 text-xs font-mono font-semibold text-[var(--bm-danger)] hover:text-[var(--bm-danger)] bg-[var(--bm-danger)]/10 hover:bg-[var(--bm-danger)]/15 border border-[var(--bm-danger)]/40 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  title="Eigene Bewertung löschen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Löschen</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2 px-3 text-xs font-mono font-semibold text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] rounded-xl transition text-center cursor-pointer"
              >
                Zurück
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 px-4 text-xs font-headline font-bold text-[var(--bm-bg)] bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                <span>Bewertung speichern</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
