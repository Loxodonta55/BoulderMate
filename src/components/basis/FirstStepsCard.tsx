import React, { useState } from 'react';
import { getStorageString, setStorageString } from '../../lib/storageUtils';
import { t, useLang } from '../../lib/i18n';

/**
 * SPEC-032 F9 / SPEC-033 F1 · Erste Schritte: einmal erklären, was Flash/Top/Projekt heisst
 * und wer den eigenen Namen sieht. Nach «Verstanden» nie wieder.
 */
export const FIRST_STEPS_KEY = 'boulderapp_first_steps_seen_v1';

export function hasSeenFirstSteps(): boolean {
  return getStorageString(FIRST_STEPS_KEY) === 'true';
}

export function markFirstStepsSeen(): void {
  setStorageString(FIRST_STEPS_KEY, 'true');
}

export const FirstStepsCard: React.FC<{ showVisibilityHint?: boolean }> = ({ showVisibilityHint = true }) => {
  const [visible, setVisible] = useState(() => !hasSeenFirstSteps());
  useLang();
  if (!visible) return null;
  return (
    <div className="mt-4 rounded-2xl border-2 border-[var(--bm-line)] bg-[var(--bm-bg)] p-4 space-y-2" data-testid="first-steps-card">
      <ul className="space-y-1.5 text-[16px] leading-snug text-[var(--bm-text)]">
        <li><span className="font-semibold">⚡ Flash</span> – {t('im ersten Versuch geschafft')}</li>
        <li><span className="font-semibold">✓ Top</span> – {t('geschafft')}</li>
        <li><span className="font-semibold">◎ {t('Projekt')}</span> – {t('willst du noch schaffen')}</li>
      </ul>
      {showVisibilityHint && (
        <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="first-steps-visibility">
          {t('Andere sehen deinen Spitznamen bei Bouldern, die du loggst. Ändern unter Ich → Einstellungen.')}
        </p>
      )}
      <button
        type="button"
        data-testid="first-steps-ok"
        onClick={() => {
          markFirstStepsSeen();
          setVisible(false);
        }}
        className="w-full min-h-[48px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold"
      >
        {t('Verstanden')}
      </button>
    </div>
  );
};
