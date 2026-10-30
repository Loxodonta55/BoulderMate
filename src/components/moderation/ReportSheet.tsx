import React, { useEffect, useRef, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contact';
import {
  hidePerson,
  PROFILE_REPORT_REASONS,
  ProfileReportReason,
  REPORT_NOTE_MAX,
  reportPerson,
  ReportResult,
  ReportTarget,
} from '../../lib/moderation/moderationService';

/**
 * SPEC-046 §4.2: Person melden. Gründe als große Zeilen, Knöpfe fest unten,
 * fester Satz, wer die Meldung sieht, Notruf-Hinweis.
 */
export const ReportSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  viewerId: string;
  target: ReportTarget;
  onHidden?: () => void;
}> = ({ open, onClose, viewerId, target, onHidden }) => {
  const [reason, setReason] = useState<ProfileReportReason | null>(null);
  const [note, setNote] = useState('');
  const [alsoHide, setAlsoHide] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [hiddenNow, setHiddenNow] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) {
      setReason(null);
      setNote('');
      setAlsoHide(true);
      setBusy(false);
      setResult(null);
      setHiddenNow(false);
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [open]);

  const send = async () => {
    if (!reason || busy) return;
    setBusy(true);
    const res = await reportPerson(viewerId, target, reason, note);
    let hidden = false;
    if ((res === 'ok' || res === 'queued') && reason === 'belaestigung' && alsoHide) {
      hidden = await hidePerson(viewerId, target);
    }
    setBusy(false);
    if (res === 'failed' || res === 'self') {
      showToast({ message: t('Das hat nicht geklappt. Bitte nochmal versuchen.') });
      return;
    }
    setResult(res);
    setHiddenNow(hidden);
  };

  // Erst nach der Danke-Seite schließen, sonst verschwindet sie mit dem Profil
  const close = () => {
    onClose();
    if (hiddenNow) onHidden?.();
  };

  const rowCls = (active: boolean) =>
    `w-full min-h-[56px] px-4 flex items-center gap-3 text-left text-[17px] rounded-xl border-2 ${
      active ? 'border-[var(--bm-accent)] bg-[var(--bm-elevated)] font-semibold' : 'border-[var(--bm-line)]'
    }`;

  return (
    <Sheet open={open} onClose={close} fitContent testId="report-sheet" ariaLabel={t('Melden')}>
      {result ? (
        <div className="px-5 pt-2 pb-5 space-y-4" data-testid="report-thanks">
          <h2 ref={headingRef} tabIndex={-1} className="text-[22px] font-bold outline-none">
            {result === 'limit' ? t('Du hast heute schon viel gemeldet.') : t('Danke. Wir schauen uns das an.')}
          </h2>
          {result === 'limit' && (
            <p className="text-[17px]" data-testid="report-limit">
              {t('Schreib uns bei Bedarf:')}{' '}
              <a href={CONTACT_MAILTO} className="underline text-[var(--bm-accent)]">{CONTACT_EMAIL}</a>
            </p>
          )}
          {result === 'queued' && (
            <p className="text-[17px] text-[var(--bm-text-2)]" data-testid="report-queued">
              {t('Ohne Netz: Die Meldung geht raus, sobald du wieder online bist.')}
            </p>
          )}
          <button
            type="button"
            onClick={close}
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
            data-testid="report-close"
          >
            {t('Schließen')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 pt-2 pb-3 space-y-4">
            <h2 ref={headingRef} tabIndex={-1} className="text-[22px] font-bold outline-none">
              {t('{name} melden', { name: target.nickname })}
            </h2>
            <p className="text-[16px]" data-testid="report-who-sees">
              {t('Deine Meldung sieht nur das BoulderMate-Team. Nicht die Halle, nicht der Trainer, nicht die gemeldete Person.')}
            </p>
            <div role="radiogroup" aria-label={t('Grund')} className="space-y-2">
              {PROFILE_REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={reason === r.value}
                  onClick={() => setReason(r.value)}
                  className={rowCls(reason === r.value)}
                  data-testid={`report-reason-${r.value}`}
                >
                  <span
                    aria-hidden
                    className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                      reason === r.value ? 'border-[var(--bm-accent)] bg-[var(--bm-accent)]' : 'border-[var(--bm-text-2)]'
                    }`}
                  />
                  {t(r.label)}
                </button>
              ))}
            </div>
            {reason === 'belaestigung' && (
              <label className="flex items-center gap-3 min-h-[48px] text-[17px]">
                <input
                  type="checkbox"
                  checked={alsoHide}
                  onChange={e => setAlsoHide(e.target.checked)}
                  className="w-6 h-6"
                  data-testid="report-also-hide"
                />
                {t('Person auch ausblenden')}
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="block text-[16px] text-[var(--bm-text-2)]">{t('Möchtest du etwas dazu sagen? (freiwillig)')}</span>
              <textarea
                value={note}
                maxLength={REPORT_NOTE_MAX}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[17px]"
                data-testid="report-note"
              />
            </label>
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Erst mit «Meldung senden» wird etwas verschickt.')}</p>
            <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="report-emergency">
              {t('Bei Gefahr: 112 · Polizei 110 (DE) / 117 (CH). Du kannst dich auch an deine Halle wenden.')}
            </p>
          </div>
          <div className="sticky bottom-0 px-5 py-3 flex gap-3 bg-[var(--bm-surface)] border-t border-[var(--bm-line)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[52px] rounded-xl bg-[var(--bm-elevated)] text-[17px] font-semibold"
              data-testid="report-cancel"
            >
              {t('Abbrechen')}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!reason || busy}
              className="flex-1 min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold disabled:opacity-40"
              data-testid="report-submit"
            >
              {t('Meldung senden')}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
