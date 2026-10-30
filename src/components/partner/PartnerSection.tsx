import React, { useState } from 'react';
import { Briefcase, ChevronDown, Copy } from 'lucide-react';
import { Chip } from '../ui/primitives';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { copyText } from '../hallen/HalleRedenSheet';
import { EMPFEHLUNG_STATUS_LABEL, formatChf, formatCodeForReading, useHallenVerzeichnis } from '../../lib/hallenVerzeichnis';
import {
  PARTNER_BEDINGUNGEN_URL,
  PARTNER_ROLLEN,
  PARTNER_ROLLE_LABEL,
  PARTNER_STATUS_ORDER,
  PartnerHalle,
  PartnerRolle,
  becomePartner,
  buildPartnerLink,
  einwaende,
  formatDatum,
  formatPct,
  freigeben,
  isAktiv,
  isPartnerEingabeComplete,
  leavePartner,
  partnerZahlen,
  rechenbeispielText,
  setImGespraech,
  statusSchritt,
  usePartnerState,
} from '../../lib/vertriebspartner';
import { PartnerKitSheet } from './PartnerKitSheet';
import { t } from '../../lib/i18n';

interface PartnerSectionProps {
  userId: string | null;
  /** «Halle auf der Karte suchen» */
  onOpenFinder: () => void;
  /** «Mehr erfahren» → Seite «Partner werden» */
  onOpenPartnerPage?: () => void;
}

/** SPEC-054 F2: «Ich» → Abschnitt «Partner» */
export const PartnerSection: React.FC<PartnerSectionProps> = ({ userId, onOpenFinder, onOpenPartnerPage }) => {
  const state = usePartnerState(userId);
  const dir = useHallenVerzeichnis(Boolean(state.partner), userId);
  const [formOpen, setFormOpen] = useState(false);
  const [rolle, setRolle] = useState<PartnerRolle | null>(null);
  const [region, setRegion] = useState('');
  const [anzeigename, setAnzeigename] = useState('');
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kitFor, setKitFor] = useState<PartnerHalle | null>(null);
  const [confirmRelease, setConfirmRelease] = useState<PartnerHalle | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!userId || !state.loaded) return null;

  const eingabe = { rolle, region, anzeigename };
  const canJoin = adult && isPartnerEingabeComplete(eingabe) && !busy;

  const join = async () => {
    if (!canJoin) return;
    setBusy(true);
    const p = await becomePartner(userId, eingabe, adult);
    setBusy(false);
    if (!p) showToast({ message: t('Hat nicht geklappt. Bitte später nochmal.') });
    else showToast({ message: t('Willkommen als BoulderMate-Partner!') });
  };

  const heading = (
    <h2 className="text-[20px] font-semibold flex items-center gap-2">
      <Briefcase className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden />
      {t('Partner')}
    </h2>
  );

  // ---------------------------------------------------------------------------
  // Noch kein Partner
  // ---------------------------------------------------------------------------
  if (!state.partner) {
    return (
      <section id="partner-section" className="space-y-2.5" data-testid="partner-section">
        {heading}
        <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3">
          <p className="text-[16px]">{t('Hallen gewinnen und 30–40 % Provision bekommen.')}</p>
          {!formOpen ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="min-h-[52px] px-4 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
                data-testid="partner-open-form"
              >
                {t('Partner werden')}
              </button>
              {onOpenPartnerPage && (
                <button
                  type="button"
                  onClick={onOpenPartnerPage}
                  className="min-h-[52px] px-4 rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[17px] font-semibold"
                  data-testid="partner-more"
                >
                  {t('Mehr erfahren')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3" data-testid="partner-form">
              <div>
                <p className="text-[15px] font-semibold mb-1.5">{t('Deine Rolle')}</p>
                <div className="flex flex-wrap gap-2">
                  {PARTNER_ROLLEN.map(r => (
                    <Chip key={r} active={rolle === r} onClick={() => setRolle(r)} testId={`partner-rolle-${r}`}>
                      {t(PARTNER_ROLLE_LABEL[r])}
                    </Chip>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[15px] font-semibold">{t('Region')}</span>
                <input
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder={t('z. B. Zürich')}
                  maxLength={60}
                  className="mt-1 w-full min-h-[48px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] px-3 text-[17px]"
                  data-testid="partner-region"
                />
              </label>
              <label className="block">
                <span className="text-[15px] font-semibold">{t('Anzeigename (optional)')}</span>
                <input
                  value={anzeigename}
                  onChange={e => setAnzeigename(e.target.value)}
                  maxLength={40}
                  className="mt-1 w-full min-h-[48px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] px-3 text-[17px]"
                  data-testid="partner-name"
                />
              </label>
              <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="partner-privacy">
                {t('Sieht nur das BoulderMate-Team. Zweck: Provision abrechnen. Keine Bankdaten in der App.')}
              </p>
              <label className="flex items-start gap-3 min-h-[44px] text-[16px]">
                <input
                  type="checkbox"
                  checked={adult}
                  onChange={e => setAdult(e.target.checked)}
                  className="mt-1 w-6 h-6 shrink-0"
                  data-testid="partner-adult"
                />
                <span>
                  {t('Ich bin mindestens 18 Jahre alt und akzeptiere die')}{' '}
                  <a href={PARTNER_BEDINGUNGEN_URL} target="_blank" rel="noreferrer" className="underline">
                    {t('Partnerbedingungen')}
                  </a>
                </span>
              </label>
              <button
                type="button"
                disabled={!canJoin}
                onClick={join}
                className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold disabled:opacity-40"
                data-testid="partner-join"
              >
                {t('Partner werden')}
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Partner
  // ---------------------------------------------------------------------------
  const zahlen = partnerZahlen(state.hallen);
  const code = state.code;
  const rows = dir.rows;

  return (
    <section id="partner-section" className="space-y-2.5" data-testid="partner-section">
      {heading}
      <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-4" data-testid="partner-dashboard">
        {code && (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[15px] text-[var(--bm-text-2)]">{t('Dein Partner-Code')}</p>
              <p className="text-[24px] font-bold tracking-[0.12em]" data-testid="partner-code">
                {formatCodeForReading(code)}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => showToast({ message: (await copyText(buildPartnerLink(code))) ? t('Link kopiert') : t('Kopieren nicht möglich') })}
              className="min-h-[48px] px-3 rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] text-[16px] font-semibold flex items-center gap-2 shrink-0"
              data-testid="partner-copy-link"
            >
              <Copy className="w-5 h-5" aria-hidden />
              {t('Link kopieren')}
            </button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 text-center" data-testid="partner-zahlen">
          <div className="rounded-xl bg-[var(--bm-surface)] p-2">
            <dt className="text-[14px] text-[var(--bm-text-2)]">{t('Dein Satz')}</dt>
            <dd className="text-[20px] font-bold tabular-nums" data-testid="partner-satz">{formatPct(zahlen.aktuellerSatz)}</dd>
          </div>
          <div className="rounded-xl bg-[var(--bm-surface)] p-2">
            <dt className="text-[14px] text-[var(--bm-text-2)]">{t('Offen')}</dt>
            <dd className="text-[20px] font-bold tabular-nums" data-testid="partner-offen">{formatChf(zahlen.offenChf)}</dd>
          </div>
          <div className="rounded-xl bg-[var(--bm-surface)] p-2">
            <dt className="text-[14px] text-[var(--bm-text-2)]">{t('Ausgezahlt')}</dt>
            <dd className="text-[20px] font-bold tabular-nums" data-testid="partner-ausgezahlt">{formatChf(zahlen.ausgezahltChf)}</dd>
          </div>
        </dl>
        <div className="text-[15px] text-[var(--bm-text-2)] space-y-1">
          <p>{t('Offen = Halle hat bezahlt, Auszahlung folgt.')}</p>
          <p>{rechenbeispielText()}</p>
          <p>{t('Du kannst deine Provision auch der Halle als Rabatt schenken.')}</p>
        </div>

        <div>
          <h3 className="text-[17px] font-bold mb-1.5">{t('Meine Hallen')}</h3>
          {state.hallen.length === 0 ? (
            <p className="text-[16px]" data-testid="partner-empty">
              {t('Schritt 1: Halle auf der Karte suchen und übernehmen.')}
            </p>
          ) : (
            <ul className="space-y-2" data-testid="partner-hallen">
              {state.hallen.map(h => {
                const aktiv = isAktiv(h);
                const offen = h.status === 'betreut' || h.status === 'im_gespraech';
                const schritt = statusSchritt(h.status);
                return (
                  <li key={h.id} className="rounded-xl bg-[var(--bm-surface)] p-3 space-y-2" data-testid={`partner-halle-${h.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[17px] font-semibold">{h.halleName}</span>
                      <span className="text-[15px] font-bold text-right" data-testid={`partner-halle-status-${h.id}`}>
                        {offen && !aktiv ? t('Abgelaufen') : t(EMPFEHLUNG_STATUS_LABEL[h.status])}
                        <span className="block font-normal text-[var(--bm-text-2)]">
                          {t('Schritt {n} von {m}', { n: schritt, m: PARTNER_STATUS_ORDER.length })}
                        </span>
                      </span>
                    </div>
                    {offen && aktiv && h.betreutBis && (
                      <p className="text-[15px] text-[var(--bm-text-2)]">{t('Betreut bis {datum}', { datum: formatDatum(h.betreutBis) })}</p>
                    )}
                    {typeof h.betragChf === 'number' && h.betragChf > 0 && (
                      <p className="text-[17px] font-bold">{t('Provision {betrag}', { betrag: formatChf(h.betragChf) })}</p>
                    )}
                    {offen && aktiv && (
                      <div className="flex flex-wrap gap-x-4 text-[16px] font-semibold">
                        {code && h.verzeichnisId && (
                          <button type="button" className="underline min-h-[44px]" onClick={() => setKitFor(h)} data-testid={`partner-halle-texte-${h.id}`}>
                            {t('Texte')}
                          </button>
                        )}
                        {h.status === 'betreut' && (
                          <button
                            type="button"
                            className="underline min-h-[44px]"
                            onClick={async () => {
                              const ok = await setImGespraech(userId, h.id);
                              showToast({ message: ok ? t('Verlängert: Du betreust die Halle 60 Tage länger.') : t('Hat nicht geklappt. Bitte später nochmal.') });
                            }}
                            data-testid={`partner-halle-gespraech-${h.id}`}
                          >
                            {t('Im Gespräch')}
                          </button>
                        )}
                        <button type="button" className="underline min-h-[44px]" onClick={() => setConfirmRelease(h)} data-testid={`partner-halle-freigeben-${h.id}`}>
                          {t('Freigeben')}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={onOpenFinder}
            className="mt-3 w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
            data-testid="partner-open-finder"
          >
            {t('Halle auf der Karte suchen')}
          </button>
        </div>

        <div data-testid="partner-einwaende">
          <h3 className="text-[17px] font-bold mb-1.5">{t('Einwände und Antworten')}</h3>
          <div className="space-y-1.5">
            {einwaende().map((e, i) => (
              <details key={i} className="group rounded-xl bg-[var(--bm-surface)]" data-testid={`partner-einwand-${i}`}>
                <summary className="min-h-[48px] px-3 flex items-center justify-between gap-2 cursor-pointer list-none text-[16px] font-semibold">
                  {e.frage}
                  <ChevronDown className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-3 pb-3 text-[16px]">{e.antwort}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 text-[15px]">
          <a href={PARTNER_BEDINGUNGEN_URL} target="_blank" rel="noreferrer" className="underline min-h-[44px] inline-flex items-center">
            {t('Partnerbedingungen')}
          </a>
          <button type="button" className="underline min-h-[44px]" onClick={() => setConfirmLeave(true)} data-testid="partner-leave">
            {t('Partner beenden')}
          </button>
        </div>
      </div>

      {kitFor && code && kitFor.verzeichnisId && (
        <PartnerKitSheet
          open
          onClose={() => setKitFor(null)}
          halleId={kitFor.verzeichnisId}
          halleName={kitFor.halleName}
          halleEmail={rows.find(r => r.id === kitFor.verzeichnisId)?.email}
          wishCount={dir.wishCounts[kitFor.verzeichnisId] || 0}
          code={code}
          partnerName={state.partner.anzeigename}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmRelease)}
        title={t('Halle freigeben?')}
        message={t('Danach kann ein anderer Partner die Halle übernehmen.')}
        confirmLabel={t('Freigeben')}
        onCancel={() => setConfirmRelease(null)}
        onConfirm={async () => {
          const h = confirmRelease;
          setConfirmRelease(null);
          if (h) await freigeben(userId, h.id);
        }}
      />
      <ConfirmDialog
        open={confirmLeave}
        title={t('Partner beenden?')}
        message={t('Dein Profil und dein Code werden gelöscht. Hallen, die schon registriert sind, rechnen wir trotzdem ab.')}
        confirmLabel={t('Beenden')}
        onCancel={() => setConfirmLeave(false)}
        onConfirm={async () => {
          setConfirmLeave(false);
          await leavePartner(userId);
        }}
      />
    </section>
  );
};
