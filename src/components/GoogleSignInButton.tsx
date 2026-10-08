import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { isGoogleLoginAvailable, signInWithGoogle } from '../lib/authService';

/** SPEC-024 AC-5.2: true, sobald Supabase bestätigt, dass Google eingeschaltet ist. */
export function useGoogleLoginAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    isGoogleLoginAvailable().then(ok => {
      if (active) setAvailable(ok);
    });
    return () => {
      active = false;
    };
  }, []);
  return available;
}

/** Startet die Weiterleitung zu Google; Fehler kommen als verständlicher Text zurück. */
export function useGoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Erfolgreich: Der Browser verlässt gleich die Seite, busy bleibt stehen.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google-Anmeldung fehlgeschlagen.');
      setBusy(false);
    }
  };
  return { busy, error, start };
}

interface GoogleSignInButtonProps {
  onClick: () => void;
  busy?: boolean;
  className?: string;
}

/** Offizielles Google-«G» (Branding-Richtlinie: Farben nicht verändern). */
const GoogleLogo: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/**
 * SPEC-024 AC-1: «Mit Google fortfahren», groß und kontrastreich.
 * Weißer Knopf mit dunkler Schrift in hellem und dunklem Modus (Google-Vorgabe).
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onClick, busy = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={`w-full min-h-[52px] rounded-xl bg-white text-[#1F1F1F] border border-[#747775] text-[16px] font-semibold flex items-center justify-center gap-3 active:opacity-80 disabled:opacity-60 ${className}`}
    data-testid="btn-google-login"
  >
    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleLogo />}
    <span>{busy ? 'Weiterleitung zu Google …' : 'Mit Google fortfahren'}</span>
  </button>
);
