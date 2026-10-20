import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react';
import { requestPasswordReset } from '../../lib/authService';
import { t } from '../../lib/i18n';
import { AuthAlert, PrimaryButton, SecondaryButton } from './authUi';

interface ForgotPasswordPanelProps {
  initialEmail: string;
  /** z. B. «Der Link ist abgelaufen …» (SPEC-049 AC-9) */
  notice?: string | null;
  onBack: () => void;
  onSent: (email: string) => void;
}

/** SPEC-049 6.2 / 6.3: «Passwort vergessen?» mit Hilfe «E-Mail-Adresse vergessen?». */
export const ForgotPasswordPanel: React.FC<ForgotPasswordPanelProps> = ({ initialEmail, notice, onBack, onSent }) => {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice || null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Runde 3: Fokus ins erste Feld, damit Screenreader wissen, wo sie sind
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse angeben.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      onSent(email.trim().toLowerCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt. Bitte nochmal versuchen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl space-y-4" data-testid="forgot-password-view">
      <div className="space-y-1">
        <h4 className="font-headline font-bold text-[18px] text-[var(--bm-text)]">{t('Passwort vergessen?')}</h4>
        <p className="text-[16px] text-[var(--bm-text-2)]">
          {t('Wir schicken dir einen Link. Damit legst du ein neues Passwort fest.')}
        </p>
      </div>

      {error && (
        <AuthAlert testId="forgot-error-msg">
          <span>{t(error)}</span>
        </AuthAlert>
      )}

      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="input-forgot-email" className="block text-[14px] text-[var(--bm-text-2)]">
            {t('E-Mail-Adresse')}
          </label>
          <div className="relative">
            <input
              id="input-forgot-email"
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="deine.email@beispiel.ch"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 min-h-[48px] bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text)] placeholder-[var(--bm-text-3)] text-[16px] focus:outline-none focus:border-[var(--bm-accent)]"
              data-testid="input-forgot-email"
            />
            <Mail className="w-5 h-5 text-[var(--bm-text-3)] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        <PrimaryButton type="submit" disabled={busy} data-testid="btn-forgot-submit">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
          <span>{busy ? t('Wird gesendet …') : t('Link senden')}</span>
        </PrimaryButton>
      </form>

      <SecondaryButton type="button" onClick={onBack} data-testid="btn-forgot-back">
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        <span>{t('Zurück zum Anmelden')}</span>
      </SecondaryButton>

      <details className="rounded-xl border border-[var(--bm-line)] bg-[var(--bm-surface)]" data-testid="forgot-email-help">
        <summary className="cursor-pointer min-h-[48px] px-4 flex items-center text-[16px] font-bold text-[var(--bm-text)]">
          {t('E-Mail-Adresse vergessen?')}
        </summary>
        <ol className="px-4 pb-4 space-y-2 text-[16px] text-[var(--bm-text)] list-decimal list-inside">
          <li>{t('Du meldest dich mit deiner E-Mail-Adresse an, nicht mit deinem Spitznamen.')}</li>
          <li>{t('Such in deinen Postfächern nach einer Mail von BoulderMate.')}</li>
          <li>{t('Mit Google oder Apple angemeldet? Dann tippe oben auf diesen Knopf. Ein Passwort brauchst du nicht.')}</li>
          <li>
            {t('Das Hallenpersonal kann dein Passwort nicht sehen oder ändern. Kommst du nicht weiter, schreib uns:')}{' '}
            <a href="/datenschutz.html" target="_blank" rel="noopener" className="underline text-[var(--bm-accent)]">
              {t('Kontakt in der Datenschutzerklärung')}
            </a>
          </li>
        </ol>
      </details>
    </div>
  );
};
