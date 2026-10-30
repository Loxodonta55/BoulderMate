import React, { useState } from 'react';
import { EyeOff, Flag } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../../lib/contact';
import { hidePerson, ReportTarget } from '../../lib/moderation/moderationService';
import { ReportSheet } from './ReportSheet';

const quietBtn =
  'flex-1 min-h-[48px] px-3 rounded-xl border-2 border-[var(--bm-line)] text-[16px] font-medium text-[var(--bm-text-2)] flex items-center justify-center gap-2';

/** SPEC-046 §4.1: ruhige Zeile unter dem Namen – «Ausblenden» und «Melden»; Gäste sehen die Kontakt-Adresse. */
export const ProfileSafetyButtons: React.FC<{
  viewerId?: string;
  target: ReportTarget;
  onHidden?: () => void;
}> = ({ viewerId, target, onHidden }) => {
  const [confirmHide, setConfirmHide] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!viewerId) {
    return (
      <p className="text-[15px] text-[var(--bm-text-2)]" data-testid="profile-safety-guest">
        {t('Jemand stört dich? Schreib uns:')}{' '}
        <a href={CONTACT_MAILTO} className="underline text-[var(--bm-accent)]">{CONTACT_EMAIL}</a>
      </p>
    );
  }

  return (
    <div className="flex gap-3" data-testid="profile-safety">
      <button
        type="button"
        className={quietBtn}
        onClick={() => setConfirmHide(true)}
        aria-label={t('{name} ausblenden', { name: target.nickname })}
        data-testid="profile-block"
      >
        <EyeOff className="w-5 h-5" aria-hidden />
        {t('Ausblenden')}
      </button>
      <button
        type="button"
        className={quietBtn}
        onClick={() => setReportOpen(true)}
        aria-label={t('{name} melden', { name: target.nickname })}
        data-testid="profile-report"
      >
        <Flag className="w-5 h-5" aria-hidden />
        {t('Melden')}
      </button>
      <ConfirmDialog
        open={confirmHide}
        title={t('{name} ausblenden?', { name: target.nickname })}
        message={t(
          'Du siehst ihren Namen nicht mehr, sie deinen und deine Treff-Einträge auch nicht. In Ranglisten steht an deiner Stelle «Jemand»; wer genau hinschaut, kann das merken.'
        )}
        confirmLabel={t('Ausblenden')}
        onCancel={() => setConfirmHide(false)}
        onConfirm={async () => {
          setConfirmHide(false);
          const ok = await hidePerson(viewerId, target);
          showToast({
            message: ok ? t('Ausgeblendet. Rückgängig unter Einstellungen → Ausgeblendete Personen.') : t('Das hat nicht geklappt. Bitte nochmal versuchen.'),
          });
          if (ok) onHidden?.();
        }}
      />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} viewerId={viewerId} target={target} onHidden={onHidden} />
    </div>
  );
};

/** SPEC-046 §4.1: «Melden» ohne Ausblenden (Trainer-Gruppe) */
export const ReportPersonButton: React.FC<{ viewerId: string; target: ReportTarget; testId?: string }> = ({ viewerId, target, testId }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('{name} melden', { name: target.nickname })}
        className="min-w-[48px] min-h-[48px] px-2 rounded-xl flex items-center justify-center gap-1.5 text-[15px] text-[var(--bm-text-2)] shrink-0"
        data-testid={testId}
      >
        <Flag className="w-5 h-5" aria-hidden />
        {t('Melden')}
      </button>
      <ReportSheet open={open} onClose={() => setOpen(false)} viewerId={viewerId} target={target} />
    </>
  );
};
