import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

/** SPEC-049 F10: große, volle Breite, Text auch im gesperrten Zustand voll lesbar (Runde 3). */
const BASE =
  'w-full min-h-[48px] px-4 rounded-xl text-[16px] font-headline font-bold flex items-center justify-center gap-2 transition disabled:cursor-not-allowed';

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`${BASE} bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] disabled:bg-[var(--bm-elevated)] disabled:text-[var(--bm-text)] disabled:border disabled:border-dashed disabled:border-[var(--bm-line)] ${className}`}
  />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    {...props}
    className={`${BASE} bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] border border-[var(--bm-line)] disabled:border-dashed ${className}`}
  />
);

/** Fehler mit Symbol (nicht nur Farbe) und Vorlesen (role="alert"). */
export const AuthAlert: React.FC<{ testId?: string; children: React.ReactNode }> = ({ testId, children }) => (
  <div
    role="alert"
    className="p-3 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-danger)]/60 text-[var(--bm-text)] text-[16px] space-y-3"
    data-testid={testId}
  >
    <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--bm-danger)]" aria-hidden="true" />
      <div className="space-y-3 min-w-0 flex-1">{children}</div>
    </div>
  </div>
);

/** Erfolg mit Symbol, wird vorgelesen (role="status"). */
export const AuthSuccess: React.FC<{ testId?: string; children: React.ReactNode }> = ({ testId, children }) => (
  <div
    role="status"
    className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-success)] text-[var(--bm-text)] text-[16px] flex items-start gap-2"
    data-testid={testId}
  >
    <Check className="w-5 h-5 shrink-0 mt-0.5 text-[var(--bm-success)]" aria-hidden="true" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);
