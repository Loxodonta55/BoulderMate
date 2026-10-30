import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import {
  EMPFEHLUNG_STATUS_LABEL,
  EMPFEHLUNG_STATUS_ORDER,
  Empfehlung,
  HALLEN_CHANGED_EVENT,
  TEILNAHME_URL,
  VerzeichnisHalle,
  deleteMyCode,
  findNowActive,
  formatChf,
  formatCodeForReading,
  loadDirectory,
  loadMyCode,
  loadMyReferrals,
  loadMyWishes,
  markNowActiveSeen,
} from '../../lib/hallenVerzeichnis';
import { loadPartner } from '../../lib/vertriebspartner';
import { t } from '../../lib/i18n';

interface HalleEmpfehlenSectionProps {
  userId: string | null;
  /** Öffnet «Halle wählen» (Karte) */
  onOpenFinder: () => void;
}

/** SPEC-053 F5/F6: «Ich» → «Halle empfehlen» */
export const HalleEmpfehlenSection: React.FC<HalleEmpfehlenSectionProps> = ({ userId, onOpenFinder }) => {
  const [code, setCode] = useState<string | null>(null);
  const [wished, setWished] = useState<VerzeichnisHalle[]>([]);
  const [nowActive, setNowActive] = useState<VerzeichnisHalle[]>([]);
  const [referrals, setReferrals] = useState<Empfehlung[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // SPEC-054: Partner sehen Code und Hallen im Abschnitt «Partner»
  const [isPartner, setIsPartner] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const on = () => setTick(x => x + 1);
    window.addEventListener(HALLEN_CHANGED_EVENT, on);
    return () => window.removeEventListener(HALLEN_CHANGED_EVENT, on);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([loadMyCode(userId), loadMyWishes(userId), loadDirectory(), loadMyReferrals(userId), loadPartner(userId)]).then(
      ([c, wishIds, rows, refs, partner]) => {
        if (cancelled) return;
        setIsPartner(Boolean(partner));
        setCode(partner ? null : c);
        setReferrals(partner ? [] : refs);
        const ids = new Set(wishIds);
        setWished(rows.filter(r => ids.has(r.id) && !r.gymId));
        const fresh = findNowActive(wishIds, rows);
        setNowActive(fresh);
        if (fresh.length) markNowActiveSeen(fresh.map(r => r.id));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

  if (!userId) return null;

  const empty = !isPartner && !code && wished.length === 0 && referrals.length === 0;

  return (
    <section className="space-y-2.5" data-testid="halle-empfehlen-section">
      <h2 className="text-[20px] font-semibold flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden />
        {t('Halle empfehlen')}
      </h2>

      {nowActive.map(h => (
        <p
          key={h.id}
          className="rounded-xl border-2 border-[var(--bm-success)] p-3 text-[17px] font-semibold"
          role="status"
          data-testid={`halle-jetzt-dabei-${h.id}`}
        >
          {t('Deine Halle ist jetzt dabei: {name}', { name: h.name })}
        </p>
      ))}

      <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3">
        {empty && (
          <p className="text-[16px]" data-testid="halle-empfehlen-empty">
            {t('Deine Halle ist noch nicht dabei? Wünsch sie dir auf der Karte.')}
          </p>
        )}

        {code && (
          <div>
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Dein Empfehlungscode')}</p>
            <p className="text-[24px] font-bold tracking-[0.12em]" data-testid="halle-empfehlen-code">
              {formatCodeForReading(code)}
            </p>
          </div>
        )}

        {wished.length > 0 && (
          <div>
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Gewünscht')}</p>
            <ul className="text-[17px] font-semibold" data-testid="halle-empfehlen-wished">
              {wished.map(h => (
                <li key={h.id}>{h.name}</li>
              ))}
            </ul>
          </div>
        )}

        {referrals.length > 0 && (
          <div>
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Deine Empfehlungen')}</p>
            <ul className="space-y-1" data-testid="halle-empfehlen-referrals">
              {referrals.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-[17px]">
                  <span className="font-semibold">{r.halleName}</span>
                  <span className="text-[15px] font-bold" aria-label={t('Schritt {n} von {m}', { n: EMPFEHLUNG_STATUS_ORDER.indexOf(r.status) + 1, m: EMPFEHLUNG_STATUS_ORDER.length })}>
                    {t(EMPFEHLUNG_STATUS_LABEL[r.status])}
                    {typeof r.betragChf === 'number' && r.betragChf > 0 && ` · ${formatChf(r.betragChf)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenFinder}
          className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
          data-testid="halle-empfehlen-open-finder"
        >
          {t('Halle auf der Karte suchen')}
        </button>

        <div className="flex flex-wrap items-center gap-x-4 text-[15px]">
          <a href={TEILNAHME_URL} target="_blank" rel="noreferrer" className="underline min-h-[44px] inline-flex items-center">
            {t('Teilnahmebedingungen')}
          </a>
          {code &&
            (confirmDelete ? (
              <span className="inline-flex items-center gap-3">
                <span>{t('Code wirklich löschen?')}</span>
                <button
                  type="button"
                  className="min-h-[44px] font-bold underline"
                  onClick={async () => {
                    await deleteMyCode(userId);
                    setConfirmDelete(false);
                    setCode(null);
                  }}
                  data-testid="halle-empfehlen-delete-confirm"
                >
                  {t('Löschen')}
                </button>
                <button type="button" className="min-h-[44px] underline" onClick={() => setConfirmDelete(false)}>
                  {t('Abbrechen')}
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="min-h-[44px] underline"
                onClick={() => setConfirmDelete(true)}
                data-testid="halle-empfehlen-delete"
              >
                {t('Code löschen')}
              </button>
            ))}
        </div>
      </div>
    </section>
  );
};
