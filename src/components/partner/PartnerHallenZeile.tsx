import React, { useState } from 'react';
import { Check, Handshake } from 'lucide-react';
import { DirectoryEntry } from '../../lib/hallenVerzeichnis';
import { MAX_BETREUUNGEN, betreueHalle, formatDatum, isAktiv, usePartnerState } from '../../lib/vertriebspartner';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';
import { PartnerKitSheet } from './PartnerKitSheet';

/**
 * SPEC-054 F3: Zeile im Hallen-Blatt einer Verzeichnis-Halle.
 * Partner: «Als Partner betreuen» / «Von dir betreut». Alle Angemeldeten: Hinweis, wenn ein anderer Partner betreut.
 */
export const PartnerHallenZeile: React.FC<{ entry: DirectoryEntry; userId: string | null }> = ({ entry, userId }) => {
  const state = usePartnerState(userId);
  const [busy, setBusy] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);

  if (!userId || !state.loaded) return null;

  const mine = state.hallen.find(h => h.verzeichnisId === entry.id && isAktiv(h));
  const takenByOther = !mine && state.betreut.has(entry.id);

  if (takenByOther) {
    return (
      <p className="rounded-xl bg-[var(--bm-surface)] p-3 text-[16px]" data-testid="gym-card-partner-taken">
        {t('Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch.')}
      </p>
    );
  }
  if (!state.partner) return null;

  if (mine) {
    return (
      <>
        <div className="min-h-[48px] rounded-xl border-2 border-[var(--bm-line)] flex items-center justify-between gap-2 px-3" data-testid="gym-card-partner-mine">
          <span className="flex items-center gap-2 text-[16px] font-semibold">
            <Check className="w-5 h-5" aria-hidden />
            {t('Von dir betreut bis {datum}', { datum: formatDatum(mine.betreutBis) })}
          </span>
          {state.code && (
            <button type="button" className="min-h-[44px] text-[16px] underline" onClick={() => setKitOpen(true)} data-testid="gym-card-partner-texte">
              {t('Texte')}
            </button>
          )}
        </div>
        {kitOpen && state.code && (
          <PartnerKitSheet
            open
            onClose={() => setKitOpen(false)}
            halleId={entry.id}
            halleName={entry.name}
            halleEmail={entry.email}
            wishCount={entry.wishCount}
            code={state.code}
            partnerName={state.partner.anzeigename}
          />
        )}
      </>
    );
  }

  const laufend = state.hallen.filter(h => (h.status === 'betreut' || h.status === 'im_gespraech') && isAktiv(h)).length;
  if (laufend >= MAX_BETREUUNGEN) {
    return (
      <p className="rounded-xl bg-[var(--bm-surface)] p-3 text-[16px]" data-testid="gym-card-partner-limit">
        {t('Du betreust schon {n} Hallen. Gib eine frei, um eine neue zu übernehmen.', { n: MAX_BETREUUNGEN })}
      </p>
    );
  }

  const take = async () => {
    setBusy(true);
    const res = await betreueHalle(userId, { id: entry.id, name: entry.name, lat: entry.lat, lng: entry.lng, email: entry.email });
    setBusy(false);
    if (res.ok) {
      showToast({ message: t('Du betreust jetzt {name} bis {datum}.', { name: entry.name, datum: formatDatum(res.halle.betreutBis) }) });
    } else if (res.fehler === 'schon_betreut') {
      showToast({ message: t('Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch.') });
    } else if (res.fehler === 'limit') {
      showToast({ message: t('Du betreust schon {n} Hallen. Gib eine frei, um eine neue zu übernehmen.', { n: MAX_BETREUUNGEN }) });
    } else {
      showToast({ message: t('Hat nicht geklappt. Bitte später nochmal.') });
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={take}
      className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-[var(--bm-line)] px-3 text-[16px] font-semibold flex items-center justify-center gap-2"
      data-testid="gym-card-partner-take"
    >
      <Handshake className="w-5 h-5" aria-hidden />
      {t('Als Partner betreuen')}
    </button>
  );
};
