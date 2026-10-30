import React from 'react';
import { Copy, X } from 'lucide-react';
import {
  PARTNER_BEDINGUNGEN_URL,
  PARTNER_PAGE_URL,
  PROVISION_SATZ_BASIS,
  PROVISION_SATZ_HOCH,
  beispielUmsatz,
  formatPct,
  rechenbeispielText,
} from '../../lib/vertriebspartner';
import { copyText } from '../hallen/HalleRedenSheet';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';

interface PartnerPageProps {
  isLoggedIn: boolean;
  onClose: () => void;
  /** «Demo: 6a plus Zürich» */
  onDemo: () => void;
  /** angemeldet: zu «Ich» → Partner; Gast: Anmelden */
  onBecomePartner: () => void;
}

/** SPEC-054 F1: Seite «Partner werden» – öffnet sich über `bouldermate.ch/?partner`, ohne Login lesbar. */
export const PartnerPage: React.FC<PartnerPageProps> = ({ isLoggedIn, onClose, onDemo, onBecomePartner }) => {
  const beispiel = beispielUmsatz();

  return (
    <div
      className="fixed inset-0 z-[2500] overflow-y-auto bg-[var(--bm-bg)] text-[var(--bm-text)]"
      role="dialog"
      aria-label={t('Partner werden')}
      data-testid="partner-page"
    >
      <main className="max-w-[42rem] mx-auto px-4 pt-4 pb-12 space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center"
            aria-label={t('Schließen')}
            data-testid="partner-page-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <header className="space-y-2">
          <p className="text-[16px] font-semibold text-[var(--bm-text-2)]">{t('BoulderMate-Partner')}</p>
          <h1 className="text-[30px] font-bold leading-tight">{t('Hallen gewinnen, mitverdienen')}</h1>
        </header>

        <p className="rounded-xl border-2 border-[var(--bm-text)] p-4 text-[17px]" data-testid="partner-page-eine-stufe">
          <strong>{t('Eine Stufe, kein Schneeballsystem:')}</strong> {t('Provision gibt es nur für Hallen, nie für das Werben anderer Partner.')}
        </p>

        <section className="space-y-2">
          <h2 className="text-[21px] font-bold">{t('Was BoulderMate kann')}</h2>
          <ul className="space-y-2 text-[18px] list-disc pl-6">
            <li>{t('Routen mit Foto an der Wand – immer aktuell')}</li>
            <li>{t('Kletterer loggen und bewerten eure Routen')}</li>
            <li>{t('Schrauber sehen, wie ihre Routen ankommen')}</li>
          </ul>
          <button
            type="button"
            onClick={onDemo}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold"
            data-testid="partner-page-demo"
          >
            {t('Demo: 6a plus Zürich')}
          </button>
        </section>

        <section className="space-y-2">
          <h2 className="text-[21px] font-bold">{t('So geht’s')}</h2>
          <ol className="space-y-2 text-[18px] list-decimal pl-6">
            <li>{t('Halle auf der Karte übernehmen.')}</li>
            <li>{t('Den fertigen Text an die Hallenleitung schicken.')}</li>
            <li>{t('BoulderMate macht Angebot und Vertrag.')}</li>
          </ol>
        </section>

        <section className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-2" data-testid="partner-page-provision">
          <h2 className="text-[21px] font-bold">{t('Deine Provision')}</h2>
          <p className="text-[19px] font-bold">
            {t('{basis} von dem, was die Halle im ersten Jahr an BoulderMate zahlt.', { basis: formatPct(PROVISION_SATZ_BASIS) })}
          </p>
          <p className="text-[17px]">
            {t('Ab deiner 3. Halle {hoch}, auch für jede weitere; die ersten beiden bleiben bei {basis}.', {
              hoch: formatPct(PROVISION_SATZ_HOCH),
              basis: formatPct(PROVISION_SATZ_BASIS),
            })}
          </p>
          <p className="text-[17px]" data-testid="partner-page-beispiel">
            <span className="font-semibold">{beispiel.echt ? t('Mit dem aktuellen Preis:') : t('Rechenbeispiel:')}</span> {rechenbeispielText()}
          </p>
          <p className="text-[16px] text-[var(--bm-text-2)]">{t('Den Preis nennt BoulderMate der Halle direkt.')}</p>
        </section>

        <section className="rounded-2xl border-2 border-[var(--bm-line)] p-4 space-y-2" data-testid="partner-page-selbstaendig">
          <h2 className="text-[21px] font-bold">{t('Selbständig, ohne Pflichten')}</h2>
          <ul className="space-y-1 text-[17px] list-disc pl-6">
            <li>{t('Keine Ziele, keine Mindestzahlen, kein Gebiet.')}</li>
            <li>{t('Du verhandelst keine Preise und schliesst keine Verträge ab.')}</li>
            <li>{t('Du sagst offen, dass du eine Provision bekommst.')}</li>
            <li>{t('Du versteuerst die Provision selbst.')}</li>
          </ul>
          <p className="text-[17px] font-bold">{t('Keine Rechts- oder Steuerberatung.')}</p>
        </section>

        <button
          type="button"
          onClick={onBecomePartner}
          className="w-full min-h-[56px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[18px] font-bold"
          data-testid="partner-page-become"
        >
          {isLoggedIn ? t('Partner werden') : t('Anmelden und Partner werden')}
        </button>

        <p className="flex flex-wrap items-center gap-x-4 text-[16px] font-semibold">
          <button
            type="button"
            className="underline min-h-[44px] inline-flex items-center gap-1"
            onClick={async () => showToast({ message: (await copyText(PARTNER_PAGE_URL)) ? t('Link kopiert') : t('Kopieren nicht möglich') })}
            data-testid="partner-page-copy-link"
          >
            <Copy className="w-4 h-4" aria-hidden />
            {t('Link kopieren')}
          </button>
          <a href={PARTNER_BEDINGUNGEN_URL} target="_blank" rel="noreferrer" className="underline min-h-[44px] inline-flex items-center">
            {t('Partnerbedingungen')}
          </a>
        </p>
      </main>
    </div>
  );
};
