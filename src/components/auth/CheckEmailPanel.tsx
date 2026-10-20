import React, { useState } from 'react';
import { ArrowLeft, Loader2, MailCheck, RotateCw } from 'lucide-react';
import { t } from '../../lib/i18n';
import { AuthAlert, AuthSuccess, PrimaryButton, SecondaryButton } from './authUi';
import { useCooldown } from './useCooldown';

interface CheckEmailPanelProps {
  /** reset: nach «Link senden»; confirm: Registrieren wartet auf Bestätigung («Fast geschafft») */
  mode: 'reset' | 'confirm';
  email: string;
  onResend: () => Promise<void>;
  onBack: () => void;
}

/** SPEC-049 6.4: «Schau in dein Postfach» bzw. «Fast geschafft», mit 60-s-Sperre fürs Nochmal-Senden. */
export const CheckEmailPanel: React.FC<CheckEmailPanelProps> = ({ mode, email, onResend, onBack }) => {
  // Gerade wurde eine Mail verschickt: Sperre läuft sofort
  const cooldown = useCooldown(undefined, true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const resend = async () => {
    setBusy(true);
    setError(null);
    setResent(false);
    try {
      await onResend();
      setResent(true);
      cooldown.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt. Bitte nochmal versuchen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl space-y-4" data-testid="check-email-view" data-mode={mode}>
      <div className="flex items-start gap-3" role="status">
        <MailCheck className="w-7 h-7 shrink-0 text-[var(--bm-success)]" aria-hidden="true" />
        <div className="space-y-1 min-w-0">
          <h4 className="font-headline font-bold text-[18px] text-[var(--bm-text)]">
            {mode === 'reset' ? t('Schau in dein Postfach.') : t('Fast geschafft')}
          </h4>
          <p className="text-[18px] font-bold text-[var(--bm-text)] break-all" data-testid="check-email-address">
            {email}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-[16px] text-[var(--bm-text)]">
        {mode === 'reset' ? (
          <>
            <p>{t('Wenn es ein Konto mit dieser Adresse gibt, kommt gleich eine Mail von BoulderMate.')}</p>
            <p>{t('Nichts angekommen? Schau im Spam-Ordner oder prüfe die Adresse.')}</p>
            <p>{t('Mit Google oder Apple angemeldet? Dann nimm den Knopf oben.')}</p>
          </>
        ) : (
          <>
            <p>{t('Öffne die Mail von BoulderMate und tippe auf «E-Mail bestätigen». Danach bist du angemeldet.')}</p>
            <p>{t('Nichts angekommen? Schau im Spam-Ordner.')}</p>
          </>
        )}
      </div>

      {error && (
        <AuthAlert testId="check-email-error">
          <span>{t(error)}</span>
        </AuthAlert>
      )}
      {resent && !error && (
        <AuthSuccess testId="check-email-resent">{t('Mail ist nochmal unterwegs.')}</AuthSuccess>
      )}

      <PrimaryButton type="button" onClick={resend} disabled={busy || cooldown.remaining > 0} data-testid="btn-resend">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <RotateCw className="w-5 h-5" aria-hidden="true" />}
        <span>
          {cooldown.remaining > 0
            ? t('Nochmal senden in {n} s', { n: cooldown.remaining })
            : t('Nochmal senden')}
        </span>
      </PrimaryButton>

      <SecondaryButton type="button" onClick={onBack} data-testid="btn-check-email-back">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        <span>{mode === 'reset' ? t('Zurück zum Anmelden') : t('Adresse falsch? Zurück')}</span>
      </SecondaryButton>
    </div>
  );
};
