import React, { useEffect, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { showToast } from '../ui/Toast';
import { EMPFEHLUNG_STATUS_LABEL, EmpfehlungStatus, HALLEN_CHANGED_EVENT, formatChf, formatCodeForReading } from '../../lib/hallenVerzeichnis';
import {
  PARTNER_ROLLE_LABEL,
  PARTNER_STATUS_ORDER,
  PROVISION_SATZ_BASIS,
  PROVISION_SATZ_HOCH,
  VertriebEintrag,
  adminBetreuungBeenden,
  berechneProvision,
  formatDatum,
  formatPct,
  isAktiv,
  loadVertriebUebersicht,
  offenZurAuszahlung,
  satzVorschlag,
  updateVertriebEintrag,
} from '../../lib/vertriebspartner';
import { t } from '../../lib/i18n';

const EintragForm: React.FC<{ adminId: string; e: VertriebEintrag }> = ({ adminId, e }) => {
  const [status, setStatus] = useState<EmpfehlungStatus>(e.status);
  const [umsatz, setUmsatz] = useState(e.umsatzErstesJahrChf != null ? String(e.umsatzErstesJahrChf) : '');
  const [satz, setSatz] = useState(satzVorschlag(e));
  const umsatzZahl = umsatz.trim() === '' ? null : Number(umsatz.replace(/[’']/g, '').replace(',', '.'));
  const provision = umsatzZahl != null && Number.isFinite(umsatzZahl) ? berechneProvision(umsatzZahl, satz) : null;
  const offen = e.status === 'betreut' || e.status === 'im_gespraech';
  const abgelaufen = offen && !isAktiv(e);

  return (
    <li className="rounded-xl bg-[var(--bm-elevated)] p-3 space-y-2" data-testid={`vertrieb-eintrag-${e.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[17px] font-bold">{e.halleName}</p>
          <p className="text-[14px] text-[var(--bm-text-2)]">
            {[e.partnerName, e.partnerRolle ? t(PARTNER_ROLLE_LABEL[e.partnerRolle]) : null, e.partnerRegion, e.code ? formatCodeForReading(e.code) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {offen && e.betreutBis && (
            <p className="text-[14px] text-[var(--bm-text-2)]">
              {abgelaufen ? t('Abgelaufen') : t('Betreut bis {datum}', { datum: formatDatum(e.betreutBis) })}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="text-[14px]">
          {t('Status')}
          <select
            value={status}
            onChange={ev => setStatus(ev.target.value as EmpfehlungStatus)}
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[var(--bm-surface)] border border-[var(--bm-line)] px-2 text-[16px]"
            data-testid={`vertrieb-status-${e.id}`}
          >
            {PARTNER_STATUS_ORDER.map(s => (
              <option key={s} value={s}>
                {t(s === 'betreut' ? 'Betreut' : EMPFEHLUNG_STATUS_LABEL[s])}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[14px]">
          {t('Umsatz erstes Jahr (CHF)')}
          <input
            inputMode="decimal"
            value={umsatz}
            onChange={ev => setUmsatz(ev.target.value)}
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[var(--bm-surface)] border border-[var(--bm-line)] px-2 text-[16px] tabular-nums"
            data-testid={`vertrieb-umsatz-${e.id}`}
          />
        </label>
        <label className="text-[14px]">
          {t('Satz')}
          <select
            value={String(satz)}
            onChange={ev => setSatz(Number(ev.target.value))}
            className="mt-1 w-full min-h-[44px] rounded-lg bg-[var(--bm-surface)] border border-[var(--bm-line)] px-2 text-[16px]"
            data-testid={`vertrieb-satz-${e.id}`}
          >
            {[PROVISION_SATZ_BASIS, PROVISION_SATZ_HOCH].map(s => (
              <option key={s} value={String(s)}>
                {formatPct(s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-[16px] font-bold" data-testid={`vertrieb-provision-${e.id}`}>
        {t('Provision')}: {provision != null ? formatChf(provision) : '–'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            const ok = await updateVertriebEintrag(adminId, e.id, {
              status,
              umsatzErstesJahrChf: umsatzZahl != null && Number.isFinite(umsatzZahl) ? umsatzZahl : null,
              provisionSatz: satz,
            });
            showToast({ message: ok ? t('Gespeichert') : t('Das hat nicht geklappt.') });
          }}
          className="min-h-[44px] px-4 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold"
          data-testid={`vertrieb-save-${e.id}`}
        >
          {t('Speichern')}
        </button>
        {offen && (
          <button
            type="button"
            onClick={async () => {
              const ok = await adminBetreuungBeenden(adminId, e.id);
              showToast({ message: ok ? t('Betreuung beendet.') : t('Das hat nicht geklappt.') });
            }}
            className="min-h-[44px] px-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] text-[16px] font-semibold"
            data-testid={`vertrieb-beenden-${e.id}`}
          >
            {t('Betreuung beenden')}
          </button>
        )}
      </div>
    </li>
  );
};

/** SPEC-054 F6: «Ich → Einstellungen → Vertrieb» (nur Plattform-Admin) */
export const VertriebSettingsGroup: React.FC<{ userId: string; isPlatformAdmin: boolean }> = ({ userId, isPlatformAdmin }) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<VertriebEintrag[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const on = () => setTick(x => x + 1);
    window.addEventListener(HALLEN_CHANGED_EVENT, on);
    return () => window.removeEventListener(HALLEN_CHANGED_EVENT, on);
  }, []);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    let cancelled = false;
    loadVertriebUebersicht(userId).then(r => {
      if (!cancelled) setRows(r);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isPlatformAdmin, tick, open]);

  if (!isPlatformAdmin) return null;
  const offenCount = rows.filter(r => r.status !== 'ausgezahlt').length;

  return (
    <>
      <ListGroup title={t('Vertrieb')}>
        <ListRow
          testId="settings-vertrieb"
          icon={<Briefcase className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title={t('Vertriebspartner und Hallen')}
          subtitle={t('Nur für Plattform-Admins')}
          value={offenCount || undefined}
          onClick={() => setOpen(true)}
        />
      </ListGroup>
      <Sheet open={open} onClose={() => setOpen(false)} detent="full" testId="vertrieb-sheet" ariaLabel={t('Vertrieb')}>
        <div className="px-4 pb-8 space-y-3">
          <h2 className="text-[24px] font-bold">{t('Vertrieb')}</h2>
          <p className="text-[18px] font-bold" data-testid="vertrieb-offen">
            {t('Offen zur Auszahlung: {betrag}', { betrag: formatChf(offenZurAuszahlung(rows)) })}
          </p>
          <p className="text-[15px] text-[var(--bm-text-2)]">
            {t('Auszahlung, Gutschrift und Kontakt zu Partnern machst du ausserhalb der App.')}
          </p>
          {rows.length === 0 ? (
            <p className="text-[16px]" data-testid="vertrieb-empty">
              {t('Noch keine Hallen in Arbeit.')}
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map(e => (
                <EintragForm key={`${e.id}-${e.updatedAt}`} adminId={userId} e={e} />
              ))}
            </ul>
          )}
        </div>
      </Sheet>
    </>
  );
};
