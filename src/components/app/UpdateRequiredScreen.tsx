import React from 'react';
import { Mountain } from 'lucide-react';
import { t } from '../../lib/i18n';
import { openExternal } from '../../lib/app/openExternal';

/** SPEC-045 §4.6 / AC-11: Vollbild nur, wenn die App älter als die Mindestversion ist. */
export const UpdateRequiredScreen: React.FC<{ storeUrl: string | null }> = ({ storeUrl }) => (
  <div
    className="fixed inset-0 z-[100] bg-[var(--bm-bg)] flex flex-col items-center justify-center px-8 text-center pt-safe pb-safe"
    role="alertdialog"
    aria-labelledby="app-update-title"
    data-testid="app-update-required"
  >
    <span className="w-16 h-16 rounded-2xl bg-[var(--bm-elevated)] flex items-center justify-center mb-6" aria-hidden>
      <Mountain className="w-8 h-8 text-[var(--bm-text)]" />
    </span>
    <h1 id="app-update-title" className="text-[26px] font-bold text-[var(--bm-text)]">
      {t('Bitte aktualisieren')}
    </h1>
    <p className="text-[17px] text-[var(--bm-text-2)] mt-3 max-w-sm">
      {t('Diese Version von BoulderMate ist zu alt und funktioniert nicht mehr richtig. Die neue Version ist kostenlos.')}
    </p>
    {storeUrl ? (
      <button
        type="button"
        onClick={() => openExternal(storeUrl)}
        className="mt-8 min-h-[52px] px-8 rounded-2xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
        data-testid="app-update-store-btn"
      >
        {t('Zum Store')}
      </button>
    ) : (
      <p className="mt-8 text-[16px] text-[var(--bm-text-2)]">{t('Öffne den App Store oder Google Play und suche nach BoulderMate.')}</p>
    )}
  </div>
);
