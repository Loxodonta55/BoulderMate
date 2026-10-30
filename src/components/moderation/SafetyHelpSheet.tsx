import React from 'react';
import { Sheet } from '../ui/Sheet';
import { t } from '../../lib/i18n';
import { CONTACT_EMAIL, CONTACT_MAILTO, RULES_URL } from '../../lib/contact';

/** SPEC-046 §4.10: Hilfe «Jemand stört dich?» – auch für die Theke zum Zeigen */
export const SafetyHelpSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onClose={onClose} fitContent testId="safety-help-sheet" ariaLabel={t('Jemand stört dich?')}>
    <div className="px-5 pt-2 pb-5 space-y-3 text-[17px]">
      <h2 className="text-[22px] font-bold">{t('Jemand stört dich?')}</h2>
      <p>{t('Öffne das Profil, tippe «Ausblenden» oder «Melden». Die Person erfährt nicht, wer gemeldet hat.')}</p>
      <p>{t('Bei ernsten Sachen wende dich auch an deine Halle oder deinen Verein. Bei Gefahr: 112.')}</p>
      <p>
        {t('Schreib uns:')} <a href={CONTACT_MAILTO} className="underline text-[var(--bm-accent)]">{CONTACT_EMAIL}</a>
      </p>
      <p>
        <a href={RULES_URL} target="_blank" rel="noopener" className="underline text-[var(--bm-accent)]" data-testid="safety-help-rules">
          {t('Regeln «Fair bleiben»')}
        </a>
      </p>
    </div>
  </Sheet>
);
