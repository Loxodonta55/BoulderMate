import React, { useEffect, useState } from 'react';
import { t } from '../../lib/i18n';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contact';
import {
  acknowledgeNotice,
  getMyModeration,
  objectToModeration,
  ruleLabel,
  useModerationVersion,
} from '../../lib/moderation/moderationService';
import { showToast } from '../ui/Toast';

/** Text zum Hinweis in «Ich» (SPEC-046 §4.4/§4.5) */
export function moderationNoticeText(notice: string): string {
  if (notice === 'pending_bild') return t('Dein Profilbild ist vorläufig versteckt, weil es gemeldet wurde. Wir prüfen das.');
  if (notice === 'pending_name') return t('Dein Name ist vorläufig versteckt, weil er gemeldet wurde. Wir prüfen das.');
  if (notice === 'decided_name_reset') return t('Wir haben deinen Namen geprüft und zurückgesetzt, weil er gegen die Regeln verstößt. Du kannst einen neuen wählen.');
  if (notice.startsWith('decided_bild_removed')) {
    return t('Wir haben dein Bild geprüft und entfernt, weil {rule} nicht erlaubt ist.', { rule: t(ruleLabel(notice.split(':')[1])) });
  }
  if (notice === 'restored') return t('Wir haben dein Profil geprüft und wieder freigegeben.');
  if (notice === 'banned') return t('Dein Profil ist nicht öffentlich sichtbar. Wenn du denkst, das ist ein Fehler, schreib uns:');
  return '';
}

export const ModerationNotice: React.FC<{ userId: string }> = ({ userId }) => {
  useModerationVersion();
  const [objected, setObjected] = useState(false);
  const status = getMyModeration(userId);
  const notice = status.notice || (status.banned ? 'banned' : undefined);
  useEffect(() => setObjected(false), [notice]);
  if (!notice) return null;
  const text = moderationNoticeText(notice);
  if (!text) return null;
  const pending = notice.startsWith('pending_');
  return (
    <div role="status" className="rounded-2xl border-2 border-[var(--bm-line)] bg-[var(--bm-surface)] p-4 space-y-3" data-testid="moderation-notice">
      <p className="text-[17px]">
        {text}
        {notice === 'banned' && (
          <>
            {' '}
            <a href={CONTACT_MAILTO} className="underline text-[var(--bm-accent)]">{CONTACT_EMAIL}</a>
          </>
        )}
      </p>
      {pending && !objected && (
        <button
          type="button"
          className="min-h-[48px] px-4 rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold"
          data-testid="moderation-object"
          onClick={async () => {
            const ok = await objectToModeration(userId);
            setObjected(true);
            showToast({ message: ok ? t('Danke. Wir schauen es uns an.') : t('Das hat nicht geklappt. Bitte nochmal versuchen.') });
          }}
        >
          {t('Das ist ein Fehler')}
        </button>
      )}
      {!pending && notice !== 'banned' && (
        <button
          type="button"
          className="min-h-[48px] px-5 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
          data-testid="moderation-ack"
          onClick={() => void acknowledgeNotice(userId)}
        >
          {t('OK')}
        </button>
      )}
    </div>
  );
};
