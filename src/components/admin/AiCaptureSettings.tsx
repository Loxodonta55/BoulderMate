import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getGymAiSettings, getMonthlyCaptureCount, setGymAiSettings, type GymAiSettings } from '../../lib/aiCapture/aiCaptureService';
import { GRADE_HINT_MAX, GRADE_SYMBOL_MAX, type GradeMarker } from '../../lib/aiCapture/types';
import { getGradeScales } from '../../lib/batchBoulderService';
import { showToast } from '../ui/Toast';

/**
 * SPEC-052 F2/F4/F6/F9/F10 · Admin-Tab «Halle»: KI-Routenerfassung.
 * Einschalten (mit Datenschutz-Satz), Grad-Markierung (Griff-Farbe / Zettel / Zeichen, v5), Namensstil,
 * Veröffentlichung, Monatszähler.
 */
/** SPEC-052 F2 v5: drei Arten, je mit Beispielsatz */
const MARKER_OPTIONS: { value: GradeMarker; label: string; example: string }[] = [
  { value: 'holds', label: 'Farbe der Griffe', example: 'Alle Griffe einer Route haben die Farbe des Grads.' },
  { value: 'tape', label: 'Farbiger Zettel am Start', example: 'Am Startgriff klebt ein Zettel oder Tape in der Farbe des Grads.' },
  { value: 'symbol', label: 'Zeichen am Start', example: 'Am Start steht ein Zeichen, eine Zahl oder ein Grad (z. B. ★★, 5, 6b+).' },
];

export const AiCaptureSettings: React.FC<{ gymId: string; userId: string }> = ({ gymId, userId }) => {
  const [settings, setSettings] = useState<GymAiSettings>(() => getGymAiSettings(gymId));
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [hint, setHint] = useState(settings.gradeHint);
  const [symbols, setSymbols] = useState<Record<string, string>>(settings.gradeSymbols);
  // Farbsystem der Halle, doppelte Namen nur einmal
  const scales = getGradeScales(gymId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((sc, i, all) => all.findIndex(o => o.colorName.trim().toLowerCase() === sc.colorName.trim().toLowerCase()) === i);

  useEffect(() => {
    if (settings.enabled) getMonthlyCaptureCount(gymId).then(setMonthCount);
  }, [gymId, settings.enabled]);

  const save = (patch: Partial<GymAiSettings>) => {
    if (setGymAiSettings(gymId, userId, patch)) setSettings(s => ({ ...s, ...patch }));
    else showToast({ message: 'Nur Hallen-Admins dürfen das ändern.' });
  };

  const choice = <K extends keyof GymAiSettings>(key: K, value: GymAiSettings[K], label: string, testId: string) => (
    <button
      type="button"
      aria-pressed={settings[key] === value}
      data-testid={testId}
      onClick={() => save({ [key]: value } as Partial<GymAiSettings>)}
      className={`flex-1 min-h-[52px] px-3 rounded-xl text-[16px] font-semibold border-2 ${
        settings[key] === value
          ? 'border-[var(--bm-accent)] bg-[var(--bm-accent)] text-[var(--bm-on-accent)]'
          : 'border-[var(--bm-line)] bg-[var(--bm-elevated)] text-[var(--bm-text)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-4" data-testid="ai-capture-settings">
      <label className="flex items-center gap-3 min-h-[52px] cursor-pointer">
        <Sparkles className="w-6 h-6 text-[var(--bm-text-2)] shrink-0" aria-hidden />
        <span className="flex-1 text-[17px] font-semibold">Routen per Foto erkennen (KI)</span>
        <input
          type="checkbox"
          role="switch"
          checked={settings.enabled}
          data-testid="ai-capture-enable"
          className="w-7 h-7 accent-[var(--bm-accent)]"
          onChange={e => save({ enabled: e.target.checked })}
        />
      </label>
      <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="ai-capture-privacy">
        Das Sektorfoto wird zur Erkennung an einen KI-Dienst geschickt (im Pilot Google Gemini) und dort nicht zum Training verwendet. Bitte ohne Personen fotografieren.
      </p>

      {settings.enabled && (
        <>
          <fieldset className="space-y-2">
            <legend className="text-[16px] font-semibold mb-2">Woran erkennt man bei euch den Grad?</legend>
            <div className="flex flex-col gap-2" role="group" data-testid="grade-marker-toggle">
              {MARKER_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={settings.gradeMarker === o.value}
                  data-testid={`grade-marker-${o.value}`}
                  onClick={() => save({ gradeMarker: o.value })}
                  className={`w-full min-h-[64px] px-4 py-2 rounded-xl border-2 text-left ${
                    settings.gradeMarker === o.value
                      ? 'border-[var(--bm-accent)] bg-[var(--bm-accent)] text-[var(--bm-on-accent)]'
                      : 'border-[var(--bm-line)] bg-[var(--bm-elevated)] text-[var(--bm-text)]'
                  }`}
                >
                  <span className="block text-[17px] font-bold">{o.label}</span>
                  <span className="block text-[15px] opacity-90">{o.example}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {settings.gradeMarker === 'symbol' && (
            <div className="space-y-3" data-testid="grade-symbols">
              <p className="text-[16px] font-semibold">Welches Zeichen steht bei welcher Farbe?</p>
              <p className="text-[15px] text-[var(--bm-text-2)]">Mehrere Schreibweisen mit Komma trennen, z. B. «★★, 2 Sterne».</p>
              {scales.map(sc => {
                const value = symbols[sc.id] ?? '';
                return (
                  <div key={sc.id} className="space-y-1">
                    <label className="flex items-center gap-3" htmlFor={`grade-symbol-${sc.id}`}>
                      <span className="w-7 h-7 rounded-full border-2 border-[var(--bm-line)] shrink-0" style={{ background: sc.colorHex }} aria-hidden />
                      <span className="text-[17px] font-semibold">{sc.colorName}</span>
                      {sc.fontRangeMin && <span className="text-[15px] text-[var(--bm-text-2)]">{sc.fontRangeMin}{sc.fontRangeMax && sc.fontRangeMax !== sc.fontRangeMin ? `–${sc.fontRangeMax}` : ''}</span>}
                    </label>
                    <input
                      id={`grade-symbol-${sc.id}`}
                      data-testid={`grade-symbol-${sc.id}`}
                      type="text"
                      maxLength={GRADE_SYMBOL_MAX}
                      value={value}
                      placeholder="Zeichen am Start"
                      onChange={e => setSymbols(prev => ({ ...prev, [sc.id]: e.target.value }))}
                      onBlur={() => save({ gradeSymbols: symbols })}
                      className="w-full min-h-[52px] px-3 rounded-xl border-2 border-[var(--bm-line)] bg-[var(--bm-bg)] text-[18px]"
                    />
                    {!value.trim() && (
                      <p className="text-[15px] text-[var(--bm-text-2)]" data-testid={`grade-symbol-missing-${sc.id}`}>
                        Bei dieser Farbe fehlt das Zeichen. Routen damit bekommen «Grad folgt».
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="ai-grade-hint" className="block text-[16px] font-semibold">Was sollte die KI noch wissen?</label>
            <textarea
              id="ai-grade-hint"
              data-testid="ai-grade-hint"
              rows={3}
              maxLength={GRADE_HINT_MAX}
              value={hint}
              placeholder="z. B. Zettel klebt unten links am Startgriff. Kinderrouten mit Tierbild ignorieren."
              onChange={e => setHint(e.target.value)}
              onBlur={() => { if (hint !== settings.gradeHint) save({ gradeHint: hint }); }}
              className="w-full px-3 py-2 rounded-xl border-2 border-[var(--bm-line)] bg-[var(--bm-bg)] text-[17px]"
            />
            <p className="text-[14px] text-[var(--bm-text-2)] text-right tabular-nums">{hint.length} / {GRADE_HINT_MAX}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[16px] font-semibold">Namen für neue Routen</p>
            <div className="flex gap-2" role="group">
              {choice('nameStyle', 'fun', 'Witzig', 'name-style-fun')}
              {choice('nameStyle', 'plain', 'Schlicht', 'name-style-plain')}
              {choice('nameStyle', 'none', 'Keine', 'name-style-none')}
            </div>
            <p className="text-[15px] text-[var(--bm-text-2)]">Steht ein Name auf dem Tape, nimmt die KI immer diesen.</p>
          </div>

          <div className="space-y-2">
            <p className="text-[16px] font-semibold">KI-Ergebnis</p>
            <div className="flex gap-2" role="group">
              {choice('publishMode', 'direct', 'Direkt live', 'publish-mode-direct')}
              {choice('publishMode', 'review', 'Erst prüfen', 'publish-mode-review')}
            </div>
          </div>

          {monthCount !== null && (
            <p className="text-[16px]" data-testid="ai-capture-month-count">
              Diesen Monat ausgewertet: <strong>{monthCount}</strong> {monthCount === 1 ? 'Foto' : 'Fotos'}
            </p>
          )}
        </>
      )}
    </section>
  );
};
