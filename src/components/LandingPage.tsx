import React from 'react';
import { Mountain, Wrench, Shield, Star, TrendingUp, MessageCircle, LogIn, MapPin, Users } from 'lucide-react';
import { AuthUser, DEMO_USERS } from '../lib/authService';
import { GoogleSignInButton, useGoogleLoginAvailable, useGoogleSignIn } from './GoogleSignInButton';

interface LandingPageProps {
  onOpenLogin: () => void;
  onQuickLogin?: (user: AuthUser) => void;
  /** SPEC-025 F5: Hallen-Karte ohne Konto ansehen */
  onShowGyms?: () => void;
  /** SPEC-028 F10: «Wer ist heute da?» anonym ansehen */
  onShowTreff?: () => void;
  /** SPEC-024 AC-5.1: Meldung nach abgebrochener oder fehlgeschlagener Google-Anmeldung */
  notice?: string | null;
  /** Angemeldet über das Logo geöffnet: «Zur App» statt Anmelden (SPEC-011 AC-8) */
  onContinue?: () => void;
}

/** SPEC-020 AC-9.1: Landing auf einen Screen. Claim, 3 Punkte, Login. */
const FEATURES = [
  { icon: Star, label: 'Perlen finden' },
  { icon: TrendingUp, label: 'Erfolge tracken' },
  { icon: MessageCircle, label: 'Know-how teilen' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onQuickLogin, notice, onContinue, onShowGyms, onShowTreff }) => {
  // AC-9.4: Test-Personas nur im Dev-Build
  const showDemo = import.meta.env.DEV && onQuickLogin && !onContinue;
  // SPEC-024 AC-1.1: Google als Hauptknopf, sobald der Provider in Supabase aktiv ist (nicht für Angemeldete)
  const googleAvailable = useGoogleLoginAvailable();
  const showGoogle = googleAvailable && !onContinue;
  const google = useGoogleSignIn();
  const alert = onContinue ? null : google.error || notice;

  return (
    <div className="min-h-screen bg-[var(--bm-bg)] text-[var(--bm-text)] font-sans flex flex-col">
      <header className="pt-safe">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text)]">
              <Mountain className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <span className="text-[17px] font-semibold">BoulderMate</span>
          </div>
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="min-h-[40px] px-3.5 rounded-xl text-[15px] font-semibold flex items-center gap-1.5 text-[var(--bm-text)] active:bg-[var(--bm-elevated)]"
              data-testid="landing-continue-btn"
            >
              <span>Zur App</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="min-h-[40px] px-3.5 rounded-xl text-[15px] font-semibold flex items-center gap-1.5 text-[var(--bm-text)] active:bg-[var(--bm-elevated)]"
              data-testid="login-modal-btn"
            >
              <LogIn className="w-4 h-4" strokeWidth={1.75} />
              <span>Anmelden</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto px-4 pb-10 gap-10">
        <div className="space-y-3">
          <h1 className="text-[30px] sm:text-[40px] leading-[1.1] font-bold tracking-tight text-balance">
            Erkenne, welche Boulder zu dir passen und beliebt sind.
          </h1>
          <p className="text-[17px] leading-snug text-balance text-[var(--bm-text-2)]">
            Tracke deine Erfolge und teile dein Know-how.
          </p>
        </div>

        <ul className="grid grid-cols-3 gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="rounded-2xl bg-[var(--bm-surface)] px-2 py-4 flex flex-col items-center gap-2 text-center">
              <Icon className="w-[22px] h-[22px] text-[var(--bm-star)]" strokeWidth={1.75} />
              <span className="text-[13px] font-medium leading-tight">{label}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          {alert && (
            <p
              role="alert"
              className="rounded-xl border border-[var(--bm-danger)] px-4 py-3 text-[16px] font-medium text-[var(--bm-danger)]"
              data-testid="landing-auth-notice"
            >
              {alert}
            </p>
          )}
          {showGoogle && <GoogleSignInButton onClick={google.start} busy={google.busy} />}
          <button
            type="button"
            onClick={onContinue ?? onOpenLogin}
            className={`w-full min-h-[52px] rounded-xl text-[16px] font-semibold ${
              showGoogle
                ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] active:bg-[var(--bm-elevated)]'
                : 'bg-[var(--bm-accent)] text-[var(--bm-on-accent)] active:opacity-80'
            }`}
            data-testid={onContinue ? 'hero-continue-btn' : 'hero-login-btn'}
          >
            {onContinue ? 'Weiter zur App' : showGoogle ? 'Mit E-Mail fortfahren' : 'Konto erstellen'}
          </button>
          {onShowGyms && (
            <button
              type="button"
              onClick={onShowGyms}
              className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-[var(--bm-elevated)]"
              data-testid="landing-show-gyms"
            >
              <MapPin className="w-5 h-5" strokeWidth={1.75} aria-hidden />
              Hallen ansehen
            </button>
          )}
          {onShowTreff && (
            <button
              type="button"
              onClick={onShowTreff}
              className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[16px] font-semibold flex items-center justify-center gap-2 active:bg-[var(--bm-elevated)]"
              data-testid="landing-show-treff"
            >
              <Users className="w-5 h-5" strokeWidth={1.75} aria-hidden />
              Wer ist heute da?
            </button>
          )}
          {showDemo && (
            <button
              type="button"
              onClick={() => onQuickLogin(DEMO_USERS['hans-kletterer'])}
              className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[16px] font-semibold active:bg-[var(--bm-elevated)]"
              data-testid="hero-quick-start-btn"
            >
              Als Kletterer testen
            </button>
          )}
        </div>

        {showDemo && (
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Test-Profile (nur Dev)">
            <button
              type="button"
              onClick={() => onQuickLogin(DEMO_USERS['hans-kletterer'])}
              className="px-2.5 py-1 rounded-xl bg-[var(--bm-surface)] text-xs text-[var(--bm-text-2)] flex items-center gap-1.5"
              title="Als Hans (Kletterer) anmelden"
              data-testid="quick-login-hans"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Hans (Kletterer)</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickLogin(DEMO_USERS['schrauber-6aplus'])}
              className="px-2.5 py-1 rounded-xl bg-[var(--bm-surface)] text-xs text-[var(--bm-text-2)] flex items-center gap-1.5"
              title="Als Schrauber anmelden"
              data-testid="quick-login-schrauber"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Schrauber 6aPlus</span>
            </button>
            <button
              type="button"
              onClick={() => onQuickLogin(DEMO_USERS['user-boris'])}
              className="px-2.5 py-1 rounded-xl bg-[var(--bm-surface)] text-xs text-[var(--bm-text-2)] flex items-center gap-1.5"
              title="Als Boris (OverAdmin) anmelden"
              data-testid="quick-login-boris"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Boris (OverAdmin)</span>
            </button>
          </div>
        )}
      </main>

      <footer className="pb-safe">
        <div className="max-w-xl mx-auto px-4 pb-4 text-center">
          <a href="/datenschutz.html" className="text-[14px] text-[var(--bm-text-2)] underline" data-testid="link-datenschutz">
            Datenschutz
          </a>
        </div>
      </footer>
    </div>
  );
};
