import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { t, useLang } from '../../lib/i18n';

/**
 * SPEC-032 F10 · Rundes «?» mit 44-px-Tippfläche. Tippen klappt genau einen Satz auf.
 */
export const GRADE_FEEL_HELP = 'Soft = fühlt sich leichter an als angeschrieben, Fair = passt, Stiff = fühlt sich schwerer an.';
export const FONT_HELP = 'Font ist die übliche Boulder-Skala (z. B. 6a). Jede Halle ordnet ihre Farben einem Font-Bereich zu.';

export const InfoTip: React.FC<{ text: string; label: string; testId: string }> = ({ text, label, testId }) => {
  const [open, setOpen] = useState(false);
  useLang();
  return (
    <>
      <button
        type="button"
        aria-label={t(label)}
        aria-expanded={open}
        data-testid={testId}
        onClick={e => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className="inline-flex items-center justify-center w-11 h-11 -m-2.5 shrink-0 text-[var(--bm-text-2)]"
      >
        <HelpCircle className="w-5 h-5" aria-hidden />
      </button>
      {open && (
        <span
          role="note"
          data-testid={`${testId}-text`}
          className="block basis-full w-full mt-1 rounded-xl bg-[var(--bm-surface)] px-3 py-2 text-[15px] leading-snug text-[var(--bm-text)]"
        >
          {t(text)}
        </span>
      )}
    </>
  );
};
