import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, X } from 'lucide-react';
import { PASSWORD_MIN_LENGTH, updatePassword } from '../../lib/authService';
import { t } from '../../lib/i18n';
import { AuthAlert, PrimaryButton, SecondaryButton } from './authUi';
import { PasswordField } from './PasswordField';

interface NewPasswordSheetProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onSaved: () => void;
}

/** SPEC-049 6.5: «Neues Passwort festlegen» nach dem Link aus der Mail. */
export const NewPasswordSheet: React.FC<NewPasswordSheetProps> = ({ open, email, onClose, onSaved }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setError(null);
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt. Bitte nochmal versuchen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto p-3 sm:p-4 bg-black/85 flex items-start sm:items-center justify-center font-sans">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-password-title"
        className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl my-auto"
        data-testid="new-password-sheet"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <KeyRound className="w-6 h-6 shrink-0 text-[var(--bm-accent)]" aria-hidden="true" />
            <h3 id="new-password-title" className="font-headline font-bold text-[18px] text-[var(--bm-text)]">
              {t('Neues Passwort festlegen')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Später')}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-[var(--bm-text)] hover:bg-[var(--bm-elevated)]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-[16px] text-[var(--bm-text)] break-all" data-testid="new-password-for">
          {t('Für: {email}', { email })}
        </p>

        {error && (
          <AuthAlert testId="new-password-error">
            <span>{t(error)}</span>
          </AuthAlert>
        )}

        <form onSubmit={save} noValidate className="space-y-4">
          <PasswordField
            label={t('Neues Passwort')}
            value={password}
            onChange={setPassword}
            testId="input-new-password"
            autoComplete="new-password"
            hint={t('Mindestens 6 Zeichen.')}
            inputRef={inputRef}
          />
          <p className="text-[14px] text-[var(--bm-text-2)]">
            {t('Danach wirst du auf deinen anderen Geräten abgemeldet.')}
          </p>
          <PrimaryButton type="submit" disabled={busy} data-testid="btn-new-password-save">
            {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
            <span>{busy ? t('Wird gespeichert …') : t('Passwort speichern')}</span>
          </PrimaryButton>
        </form>

        <SecondaryButton type="button" onClick={onClose} data-testid="btn-new-password-later">
          {t('Später')}
        </SecondaryButton>
      </div>
    </div>
  );
};
