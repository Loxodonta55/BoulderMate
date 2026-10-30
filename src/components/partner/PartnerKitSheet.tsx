import React, { useState } from 'react';
import { Copy, Mail, QrCode, Share2, X } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { buildMailto } from '../../lib/hallenVerzeichnis';
import { buildPartnerTexte } from '../../lib/vertriebspartner';
import { QrFullscreen, copyText } from '../hallen/HalleRedenSheet';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';

interface PartnerKitSheetProps {
  open: boolean;
  onClose: () => void;
  halleId: string;
  halleName: string;
  halleEmail?: string;
  wishCount: number;
  code: string;
  partnerName?: string | null;
}

/** SPEC-054 F4: «Texte für <Halle>» – E-Mail, kurze Nachricht, Gesprächsleitfaden; jeder Text legt die Provision offen. */
export const PartnerKitSheet: React.FC<PartnerKitSheetProps> = ({ open, onClose, halleId, halleName, halleEmail, wishCount, code, partnerName }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const texte = buildPartnerTexte({ halleId, halleName, code, wishCount, name: partnerName });
  const leitfaden = texte.leitfaden.map((p, i) => `${i + 1}. ${p}`).join('\n');

  const copy = async (value: string) => {
    showToast({ message: (await copyText(value)) ? t('Text kopiert') : t('Kopieren nicht möglich') });
  };

  const share = async (value: string) => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ text: value });
      } catch {
        // abgebrochen
      }
      return;
    }
    await copy(value);
  };

  const block = (testId: string, title: string, body: string, extra?: React.ReactNode, withShare = true) => (
    <section className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3" data-testid={testId}>
      <h3 className="text-[19px] font-bold">{title}</h3>
      <p className="text-[17px] whitespace-pre-line" data-testid={`${testId}-text`}>
        {body}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(body)}
          className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[16px] font-semibold flex items-center gap-2"
          data-testid={`${testId}-copy`}
        >
          <Copy className="w-5 h-5" aria-hidden />
          {t('Kopieren')}
        </button>
        {withShare && (
          <button
            type="button"
            onClick={() => share(body)}
            className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[16px] font-semibold flex items-center gap-2"
            data-testid={`${testId}-share`}
          >
            <Share2 className="w-5 h-5" aria-hidden />
            {t('Teilen')}
          </button>
        )}
        {extra}
      </div>
    </section>
  );

  return (
    <Sheet open={open} onClose={onClose} detent="full" testId="partner-kit-sheet" ariaLabel={t('Texte für {name}', { name: halleName })}>
      <div className="px-4 pb-8 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-bold">{t('Texte für {name}', { name: halleName })}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center shrink-0"
            aria-label={t('Schließen')}
            data-testid="partner-kit-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[16px] text-[var(--bm-text-2)]">{t('Auf Social Media als Werbung kennzeichnen.')}</p>

        {block(
          'partner-kit-email',
          t('E-Mail'),
          `${texte.emailBetreff}\n\n${texte.email}`,
          halleEmail ? (
            <a
              href={buildMailto(halleEmail, texte.emailBetreff, texte.email)}
              className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold flex items-center gap-2"
              data-testid="partner-kit-email-open"
            >
              <Mail className="w-5 h-5" aria-hidden />
              {t('E-Mail öffnen')}
            </a>
          ) : undefined,
          false
        )}
        {block('partner-kit-nachricht', t('Kurze Nachricht'), texte.nachricht)}
        {block('partner-kit-leitfaden', t('Gesprächsleitfaden'), leitfaden, undefined, false)}

        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold flex items-center justify-center gap-2"
          data-testid="partner-kit-qr"
        >
          <QrCode className="w-5 h-5" aria-hidden />
          {t('QR an der Theke zeigen')}
        </button>
      </div>
      {qrOpen && <QrFullscreen link={texte.link} onClose={() => setQrOpen(false)} />}
    </Sheet>
  );
};
