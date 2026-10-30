import React, { useEffect, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { t } from '../../lib/i18n';
import { DELETE_CONFIRM_WORD, deleteAccountEverywhere, isDeleteConfirmed } from '../../lib/profileService';
import { isNativeApp } from '../../lib/app/platform';
import { clearPhotoCache } from '../../lib/app/photoCache';

/**
 * SPEC-045 §6 / AC-12: Konto löschen mit Erklärung und Eintippen von «LÖSCHEN» (App und Web).
 */
export const DeleteAccountSheet: React.FC<{
  open: boolean;
  userId: string;
  onClose: () => void;
  onDeleted: () => void;
}> = ({ open, userId, onClose, onDeleted }) => {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInput('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const confirmed = isDeleteConfirmed(input);

  const run = async () => {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccountEverywhere(userId);
      await clearPhotoCache();
      onDeleted();
    } catch {
      setError(t('Löschen hat nicht geklappt. Prüfe die Verbindung und versuche es nochmal.'));
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} fitContent testId="delete-account-sheet" ariaLabel={t('Konto löschen')}>
      <div className="px-5 pt-2 pb-4 space-y-4" data-testid="app-delete-account">
        <h2 className="text-[22px] font-bold text-[var(--bm-text)]">{t('Konto löschen')}</h2>
        <div className="space-y-2 text-[16px] text-[var(--bm-text)]">
          {isNativeApp() && (
            <p>
              <strong>{t('App löschen:')}</strong> {t('nur die Daten auf diesem Handy sind weg. Dein Konto bleibt.')}
            </p>
          )}
          <p>
            <strong>{t('Konto löschen:')}</strong>{' '}
            {t('alles ist weg, auch auf dem Server: Begehungen, Bewertungen, Beta, Treff und dein Profil. Das lässt sich nicht rückgängig machen.')}
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="block text-[16px] text-[var(--bm-text-2)]">
            {t('Tippe {word} ein, um zu bestätigen.', { word: DELETE_CONFIRM_WORD })}
          </span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            data-testid="delete-account-input"
            aria-label={t('Bestätigung eintippen')}
            className="w-full min-h-[48px] px-4 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[18px] text-[var(--bm-text)]"
          />
        </label>
        {error && (
          <p role="alert" className="text-[16px] text-[var(--bm-danger)]" data-testid="delete-account-error">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--bm-elevated)] text-[16px] font-semibold text-[var(--bm-text)]"
            data-testid="delete-account-cancel"
          >
            {t('Abbrechen')}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!confirmed || busy}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--bm-danger)] text-white text-[16px] font-semibold disabled:opacity-40"
            data-testid="delete-account-confirm"
          >
            {busy ? t('Wird gelöscht …') : t('Endgültig löschen')}
          </button>
        </div>
      </div>
    </Sheet>
  );
};
