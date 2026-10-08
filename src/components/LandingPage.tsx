import React from 'react';
import { Mountain, Wrench, Shield, Star, Compass, Zap, LogIn } from 'lucide-react';
import { AuthUser, DEMO_USERS } from '../lib/authService';

interface LandingPageProps {
  onOpenLogin: () => void;
  onQuickLogin?: (user: AuthUser) => void;
}

/** SPEC-020 AC-9.1: Landing auf einen Screen. Claim, 3 Punkte, Login. */
const FEATURES = [
  { icon: Star, label: 'Perlen finden' },
  { icon: Compass, label: 'Passt zu dir' },
  { icon: Zap, label: '2 Taps loggen' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin, onQuickLogin }) => {
  // AC-9.4: Test-Personas nur im Dev-Build
  const showDemo = import.meta.env.DEV && onQuickLogin;

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
          <button
            type="button"
            onClick={onOpenLogin}
            className="min-h-[40px] px-3.5 rounded-xl text-[15px] font-semibold flex items-center gap-1.5 text-[var(--bm-text)] active:bg-[var(--bm-elevated)]"
            data-testid="login-modal-btn"
          >
            <LogIn className="w-4 h-4" strokeWidth={1.75} />
            <span>Anmelden</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-xl w-full mx-auto px-4 pb-10 gap-10">
        <h1 className="text-[34px] sm:text-[44px] leading-[1.08] font-bold tracking-tight">
          Erkennen, welche Boulder cool sind.
        </h1>

        <ul className="grid grid-cols-3 gap-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="rounded-2xl bg-[var(--bm-surface)] px-2 py-4 flex flex-col items-center gap-2 text-center">
              <Icon className="w-[22px] h-[22px] text-[var(--bm-star)]" strokeWidth={1.75} />
              <span className="text-[13px] font-medium leading-tight">{label}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenLogin}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold active:opacity-80"
            data-testid="hero-login-btn"
          >
            Konto erstellen
          </button>
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
    </div>
  );
};
