import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { t } from '../../lib/i18n';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId: string;
  autoComplete: 'current-password' | 'new-password';
  hint?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** SPEC-049 6.6: Passwortfeld mit beschriftetem Auge (Anzeigen / Verbergen). */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  testId,
  autoComplete,
  hint,
  autoFocus,
  inputRef,
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = `${testId}-field`;
  const hintId = hint ? `${testId}-hint` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-[14px] text-[var(--bm-text-2)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          placeholder="••••••••"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-describedby={hintId}
          className="w-full pl-10 pr-14 min-h-[48px] bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl text-[var(--bm-text)] placeholder-[var(--bm-text-3)] text-[16px] focus:outline-none focus:border-[var(--bm-accent)]"
          data-testid={testId}
        />
        <Lock className="w-5 h-5 text-[var(--bm-text-3)] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? t('Passwort verbergen') : t('Passwort anzeigen')}
          aria-pressed={visible}
          className="absolute right-0 top-0 h-full min-w-[48px] flex items-center justify-center text-[var(--bm-text)] rounded-r-xl hover:bg-[var(--bm-elevated)]"
          data-testid={`${testId}-toggle`}
        >
          {visible ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-[14px] text-[var(--bm-text-2)]">
          {hint}
        </p>
      )}
    </div>
  );
};
