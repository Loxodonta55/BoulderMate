import React, { useState } from 'react';
import { Building2, Check, X } from 'lucide-react';
import { DirectoryEntry, HALLEN_CONTACT_EMAIL, setWish, wishCountLabel } from '../../lib/hallenVerzeichnis';
import { buildNavigationUrl, formatDistance } from '../../lib/gymFinder';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';
import { HalleRedenSheet } from './HalleRedenSheet';

/** SPEC-053 F1: Schild «Noch nicht dabei» – dunkler Text, heller Grund, Rahmen (nicht nur Farbe) */
export const NotYetBadge: React.FC<{ testId?: string }> = ({ testId }) => (
  <span
    className="inline-block mt-1 px-2 py-0.5 rounded-md border-2 border-[#4A4744] bg-white text-[#1A1918] text-[14px] font-bold leading-tight"
    data-testid={testId}
  >
    {t('Noch nicht dabei')}
  </span>
);

interface DirectoryGymCardProps {
  entry: DirectoryEntry;
  userId: string | null;
  wished: boolean;
  onClose: () => void;
  onRequestLogin?: () => void;
}

/**
 * SPEC-053 F2: Hallen-Blatt einer Verzeichnis-Halle.
 * Kein «Zur Wand»: Hauptknopf «Ich will BoulderMate hier», Zweitknopf «Mit der Halle reden», Textlinks Website · Navigation.
 */
export const DirectoryGymCard: React.FC<DirectoryGymCardProps> = ({ entry, userId, wished, onClose, onRequestLogin }) => {
  const [busy, setBusy] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const countLabel = wishCountLabel(entry.wishCount);

  const toggleWish = async (on: boolean) => {
    if (!userId) {
      onRequestLogin?.();
      return;
    }
    setBusy(true);
    const ok = await setWish(entry.id, userId, on);
    setBusy(false);
    if (!ok) {
      showToast({ message: t('Hat nicht geklappt. Bitte später nochmal.') });
      return;
    }
    if (on) showToast({ message: t('Danke! Du bist Nummer {n}.', { n: entry.wishCount + 1 }) });
  };

  return (
    <div className="mx-4 mt-3 rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-4" data-testid={`gym-card-${entry.id}`}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-white border-2 border-dashed border-[#4A4744] flex items-center justify-center shrink-0">
          <Building2 className="w-7 h-7 text-[#1A1918]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[19px] font-bold leading-tight">{entry.name}</h3>
          <p className="text-[16px] text-[var(--bm-text-2)] mt-0.5">
            {entry.address || entry.city}
            {entry.distanceKm !== undefined && ` · ${formatDistance(entry.distanceKm)}`}
          </p>
          <NotYetBadge testId="gym-card-not-yet" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          aria-label={t('Zurück zur Liste')}
          data-testid="gym-card-close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="rounded-xl bg-[var(--bm-surface)] p-3" data-testid="gym-card-no-routes">
        <p className="text-[17px] font-semibold">{t('Noch keine Routen in BoulderMate.')}</p>
        <p className="text-[16px] text-[var(--bm-text-2)] mt-0.5">{t('Diese Halle ist noch nicht bei BoulderMate registriert.')}</p>
      </div>

      <p className="text-[17px] font-semibold" data-testid="gym-card-wishes">
        {countLabel ?? t('Sei unter den Ersten, die sich BoulderMate hier wünschen.')}
      </p>

      <div className="grid grid-cols-1 gap-2">
        {wished ? (
          <div className="min-h-[52px] rounded-xl border-2 border-[var(--bm-text)] flex items-center justify-between px-4" data-testid="gym-card-wished">
            <span className="flex items-center gap-2 text-[17px] font-bold">
              <Check className="w-5 h-5" aria-hidden />
              {t('Gewünscht')}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleWish(false)}
              className="min-h-[44px] text-[16px] underline"
              data-testid="gym-card-unwish"
            >
              {t('zurücknehmen')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => toggleWish(true)}
            className="min-h-[56px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[18px] font-bold"
            data-testid="gym-card-wish"
          >
            {userId ? t('Ich will BoulderMate hier') : t('Anmelden und wünschen')}
          </button>
        )}
        <button
          type="button"
          onClick={() => setTalkOpen(true)}
          className="min-h-[52px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-text)] text-[17px] font-semibold border-2 border-[var(--bm-line)]"
          data-testid="gym-card-talk"
        >
          {t('Mit der Halle reden')}
        </button>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[16px] font-semibold">
        {entry.website && (
          <a href={entry.website} target="_blank" rel="noreferrer" className="underline min-h-[44px] inline-flex items-center" data-testid="gym-card-website">
            {t('Website')}
          </a>
        )}
        <a
          href={buildNavigationUrl(entry)}
          target="_blank"
          rel="noreferrer"
          className="underline min-h-[44px] inline-flex items-center"
          data-testid="gym-card-navigate"
        >
          {t('Navigation')}
        </a>
      </p>

      <p className="text-[14px] text-[var(--bm-text-2)]">
        {t('Angaben ohne Gewähr')} ·{' '}
        <a
          className="underline"
          href={`mailto:${HALLEN_CONTACT_EMAIL}?subject=${encodeURIComponent(t('Fehler bei {name}', { name: entry.name }))}`}
          data-testid="gym-card-report-error"
        >
          {t('Fehler melden')}
        </a>
      </p>

      <HalleRedenSheet open={talkOpen} onClose={() => setTalkOpen(false)} entry={entry} userId={userId} onRequestLogin={onRequestLogin} />
    </div>
  );
};
