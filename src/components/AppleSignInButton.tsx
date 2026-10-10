import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isAppleLoginAvailable, signInWithApple } from '../lib/authService';
import { t } from '../lib/i18n';

/** SPEC-040 F2: true, sobald Supabase bestätigt, dass Apple eingeschaltet ist. */
export function useAppleLoginAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    isAppleLoginAvailable().then(ok => {
      if (active) setAvailable(ok);
    });
    return () => {
      active = false;
    };
  }, []);
  return available;
}

/** Startet die Weiterleitung zu Apple; Fehler kommen als verständlicher Text zurück. */
export function useAppleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('Apple-Anmeldung fehlgeschlagen.'));
      setBusy(false);
    }
  };
  return { busy, error, start };
}

const AppleLogo: React.FC = () => (
  <svg width="20" height="22" viewBox="0 0 17 20" aria-hidden="true" className="shrink-0" fill="currentColor">
    <path d="M14.06 10.63c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.52zM11.88 4.16c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.55 1.31-.56.65-1.05 1.69-.92 2.69.97.07 1.96-.49 2.57-1.23z" />
  </svg>
);

/**
 * SPEC-040 F3: «Mit Apple anmelden» – schwarz mit weißer Schrift, im dunklen Modus weiß mit schwarzer Schrift.
 * Gleich groß wie der Google-Knopf.
 */
export const AppleSignInButton: React.FC<{ onClick: () => void; busy?: boolean; className?: string }> = ({
  onClick,
  busy = false,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`w-full min-h-[52px] rounded-xl bg-black text-white dark:bg-white dark:text-black text-[16px] font-semibold flex items-center justify-center gap-3 active:opacity-80 disabled:opacity-60 ${className}`}
    data-testid="btn-apple-login"
  >
    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleLogo />}
    <span>{busy ? t('Weiterleitung zu Apple …') : t('Mit Apple anmelden')}</span>
  </button>
);
