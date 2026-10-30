import React, { useEffect, useState } from 'react';
import { Copy, Mail, Search, X } from 'lucide-react';
import {
  HALLEN_CONTACT_EMAIL,
  VerzeichnisHalle,
  buildMailto,
  formatCodeForReading,
  loadDirectory,
  loadWishCounts,
  wishCountLabel,
} from '../../lib/hallenVerzeichnis';
import { copyText } from './HalleRedenSheet';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';

interface FuerHallenPageProps {
  /** null = allgemeiner Partner-Link `?ref=<code>` ohne Halle (SPEC-054 F5) */
  halleId: string | null;
  refCode: string | null;
  onClose: () => void;
  /** «Demo: 6a plus Zürich» – Seite schließen, Wand von 6a plus als Gast zeigen */
  onDemo: () => void;
  /** SPEC-054 F5: «Ich klettere – Halle suchen» – Seite schließen, «Halle wählen» öffnen */
  onFindGym?: () => void;
}

/**
 * SPEC-053 F4: Seite «Für Hallen» – öffnet sich über den geteilten Link `?halle=<id>&ref=<code>` ohne Login.
 */
export const FuerHallenPage: React.FC<FuerHallenPageProps> = ({ halleId, refCode, onClose, onDemo, onFindGym }) => {
  const [halle, setHalle] = useState<VerzeichnisHalle | null>(null);
  const [wishes, setWishes] = useState(0);

  useEffect(() => {
    if (!halleId) return;
    let cancelled = false;
    Promise.all([loadDirectory(), loadWishCounts()]).then(([rows, counts]) => {
      if (cancelled) return;
      setHalle(rows.find(r => r.id === halleId) || null);
      setWishes(counts[halleId] || 0);
    });
    return () => {
      cancelled = true;
    };
  }, [halleId]);

  const name = halle?.name || t('eure Halle');
  const wishLabel = wishCountLabel(wishes);
  const mailBody = [
    t('Hallo BoulderMate-Team,'),
    t('wir interessieren uns für BoulderMate in unserer Halle: {name}.', { name }),
    refCode ? t('Empfehlungscode: {code}', { code: refCode }) : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const copy = async (value: string) => {
    showToast({ message: (await copyText(value)) ? t('Kopiert') : t('Kopieren nicht möglich') });
  };

  return (
    <div
      className="fixed inset-0 z-[2500] overflow-y-auto bg-[var(--bm-bg)] text-[var(--bm-text)]"
      role="dialog"
      aria-label={t('Für Hallen')}
      data-testid="fuer-hallen-page"
    >
      <main className="max-w-[42rem] mx-auto px-4 pt-4 pb-12 space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center"
            aria-label={t('Schließen')}
            data-testid="fuer-hallen-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <header className="space-y-2">
          <p className="text-[16px] font-semibold text-[var(--bm-text-2)]">{t('Für Hallen')}</p>
          <h1 className="text-[30px] font-bold leading-tight" data-testid="fuer-hallen-name">
            {t('BoulderMate für {name}', { name })}
          </h1>
          {wishLabel && (
            <p className="text-[19px] font-bold" data-testid="fuer-hallen-wishes">
              {wishLabel}
            </p>
          )}
        </header>

        <ul className="space-y-2 text-[18px] list-disc pl-6">
          <li>{t('Routen mit Foto an der Wand – immer aktuell')}</li>
          <li>{t('Kletterer loggen und bewerten eure Routen')}</li>
          <li>{t('Schrauber sehen, wie ihre Routen ankommen')}</li>
        </ul>

        {refCode && (
          <p className="rounded-xl bg-[var(--bm-elevated)] p-4 text-[17px]" data-testid="fuer-hallen-ref-note">
            {t('Diese Empfehlung kommt von einem BoulderMate-Partner. Er oder sie bekommt von BoulderMate eine Provision; euch kostet das nichts extra.')}
          </p>
        )}

        <section className="rounded-2xl border-2 border-[var(--bm-text)] p-4 space-y-4">
          <h2 className="text-[21px] font-bold">{t('Kontakt aufnehmen')}</h2>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[19px] font-bold break-all" data-testid="fuer-hallen-email">{HALLEN_CONTACT_EMAIL}</span>
            <button
              type="button"
              onClick={() => copy(HALLEN_CONTACT_EMAIL)}
              className="min-h-[48px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] font-semibold flex items-center gap-2 shrink-0"
              data-testid="fuer-hallen-copy-email"
            >
              <Copy className="w-5 h-5" aria-hidden />
              {t('Kopieren')}
            </button>
          </div>
          {refCode && (
            <div className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-[15px] text-[var(--bm-text-2)]">{t('Empfehlungscode')}</span>
                <span className="text-[24px] font-bold tracking-[0.12em]" data-testid="fuer-hallen-code">
                  {formatCodeForReading(refCode)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => copy(refCode)}
                className="min-h-[48px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] font-semibold flex items-center gap-2 shrink-0"
                data-testid="fuer-hallen-copy-code"
              >
                <Copy className="w-5 h-5" aria-hidden />
                {t('Kopieren')}
              </button>
            </div>
          )}
          <a
            href={buildMailto(HALLEN_CONTACT_EMAIL, t('BoulderMate für {name}', { name }), mailBody)}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold flex items-center justify-center gap-2"
            data-testid="fuer-hallen-mail"
          >
            <Mail className="w-5 h-5" aria-hidden />
            {t('E-Mail schreiben')}
          </a>
        </section>

        <p className="text-[16px]" data-testid="fuer-hallen-offerte">
          {t('Ihr braucht eine Offerte (Gemeinde, Verein)? Schreibt uns.')}
        </p>

        <button
          type="button"
          onClick={onDemo}
          className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold"
          data-testid="fuer-hallen-demo"
        >
          {t('Demo: 6a plus Zürich')}
        </button>

        {onFindGym && (
          <button
            type="button"
            onClick={onFindGym}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center justify-center gap-2"
            data-testid="fuer-hallen-find-gym"
          >
            <Search className="w-5 h-5" aria-hidden />
            {t('Ich klettere – Halle suchen')}
          </button>
        )}

        <p className="text-[15px] text-[var(--bm-text-2)]">
          {t('Ihr wollt hier nicht erscheinen? Kurze Mail genügt.')}{' '}
          <a className="underline" href={buildMailto(HALLEN_CONTACT_EMAIL, t('Bitte nicht anzeigen: {name}', { name }), '')}>
            {HALLEN_CONTACT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
};
