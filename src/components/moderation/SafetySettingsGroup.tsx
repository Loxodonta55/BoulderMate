import React, { useEffect, useState } from 'react';
import { EyeOff, Flag, ScrollText } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { t } from '../../lib/i18n';
import { RULES_URL } from '../../lib/contact';
import { openExternal } from '../../lib/app/openExternal';
import {
  TreffBlock,
  TreffReport,
  TreffReportAction,
  TREFF_CHANGED_EVENT,
  TREFF_REPORT_REASONS,
  listMyTreffBlocks,
  listOpenTreffReports,
  handleTreffReport,
} from '../../lib/treffService';
import {
  AdminProfileReport,
  MODERATION_CHANGED_EVENT,
  MODERATION_RULES,
  ModerationAction,
  ModerationRule,
  listProfileReports,
  moderateProfile,
  reasonLabel,
  showPersonAgain,
} from '../../lib/moderation/moderationService';

/**
 * SPEC-046 §4.3/§4.5 · Ich → Einstellungen → Sicherheit:
 * «Ausgeblendete Personen» (gilt in der ganzen App), Regeln, und für Plattform-Admins «Meldungen prüfen».
 * Test-IDs der Treff-Zeit (SPEC-028) bleiben, damit bestehende Tests weiter passen.
 */
const actionBtn =
  'min-h-[48px] px-4 rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold bg-[var(--bm-surface)] active:bg-[var(--bm-elevated)]';

const ProfileReportCard: React.FC<{
  r: AdminProfileReport;
  onAct: (r: AdminProfileReport, action: ModerationAction, rule?: ModerationRule) => void;
}> = ({ r, onAct }) => {
  const [showPhoto, setShowPhoto] = useState(false);
  const [askRule, setAskRule] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const hidden = r.nameHidden || r.avatarHidden;
  return (
    <div className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3" data-testid={`admin-profile-report-${r.id}`}>
      <p className="text-[15px] font-semibold text-[var(--bm-text-2)]">
        {t(reasonLabel(r.reason))} · {new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
      <div className="flex flex-wrap gap-2">
        {hidden && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--bm-surface)] text-[15px] font-semibold" data-testid={`admin-report-hidden-${r.id}`}>
            {t('Vorläufig versteckt')}
          </span>
        )}
        {r.isTrainer && <span className="px-2.5 py-1 rounded-lg bg-[var(--bm-surface)] text-[15px] font-semibold">{t('Trainer')}</span>}
        {r.banned && <span className="px-2.5 py-1 rounded-lg bg-[var(--bm-surface)] text-[15px] font-semibold">{t('Gesperrt')}</span>}
      </div>
      <div className="flex items-center gap-3">
        {r.reportedAvatar ? (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--bm-surface)] shrink-0">
            <img
              src={r.reportedAvatar}
              alt=""
              className={`w-full h-full object-cover ${showPhoto ? '' : 'blur-xl scale-110'}`}
              data-testid={`admin-report-photo-${r.id}`}
              data-blurred={showPhoto ? 'false' : 'true'}
            />
            {!showPhoto && (
              <button
                type="button"
                onClick={() => setShowPhoto(true)}
                className="absolute inset-0 text-[15px] font-semibold text-white bg-black/40"
                data-testid={`admin-report-show-${r.id}`}
              >
                {t('Anzeigen')}
              </button>
            )}
          </div>
        ) : null}
        <p className="text-[17px] font-semibold break-words">{r.reportedNickname}</p>
      </div>
      <p className="text-[15px] text-[var(--bm-text-2)] break-words">
        {t('Kopie:')} {r.snapshot}
      </p>
      {r.note && <p className="text-[17px] break-words">«{r.note}»</p>}
      {r.reportedNote && (
        <p className="text-[17px] break-words" data-testid={`admin-report-objection-${r.id}`}>
          {t('Widerspruch:')} «{r.reportedNote}»
        </p>
      )}
      <p className="text-[15px] text-[var(--bm-text-2)]">
        {t('Schon {n}× gemeldet · meldende Person hat {m}× gemeldet', { n: r.timesReported, m: r.reporterReports })}
      </p>
      {askRule ? (
        <div className="space-y-2">
          <p className="text-[17px] font-semibold">{t('Warum wird das Bild entfernt?')}</p>
          <div className="flex flex-wrap gap-2">
            {MODERATION_RULES.map(rule => (
              <button
                key={rule.value}
                type="button"
                className={actionBtn}
                onClick={() => onAct(r, 'remove_avatar', rule.value)}
                data-testid={`admin-rule-${rule.value}-${r.id}`}
              >
                {t(rule.label)}
              </button>
            ))}
            <button type="button" className={actionBtn} onClick={() => setAskRule(false)}>
              {t('Abbrechen')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={actionBtn} onClick={() => onAct(r, 'reset_name')} data-testid={`admin-reset-name-${r.id}`}>
            {t('Name zurücksetzen')}
          </button>
          <button type="button" className={actionBtn} onClick={() => setAskRule(true)} data-testid={`admin-remove-avatar-${r.id}`}>
            {t('Bild entfernen')}
          </button>
          {hidden && (
            <button type="button" className={actionBtn} onClick={() => onAct(r, 'restore')} data-testid={`admin-restore-${r.id}`}>
              {t('Wiederherstellen')}
            </button>
          )}
          <button type="button" className={actionBtn} onClick={() => onAct(r, 'done')} data-testid={`admin-done-${r.id}`}>
            {t('Erledigt')}
          </button>
        </div>
      )}
      {/* abgesetzt und mit Nachfrage (v3) */}
      <div className="pt-3 border-t border-[var(--bm-line)]">
        <button
          type="button"
          className={`${actionBtn} text-[var(--bm-danger)]`}
          onClick={() => setConfirmBan(true)}
          data-testid={`admin-ban-${r.id}`}
        >
          {t('Person sperren')}
        </button>
      </div>
      <ConfirmDialog
        open={confirmBan}
        title={t('{name} sperren?', { name: r.reportedNickname })}
        message={t('Die Person erscheint nur noch als «Jemand», kann Name und Bild nicht ändern und nicht im Treff erscheinen.')}
        confirmLabel={t('Sperren')}
        onCancel={() => setConfirmBan(false)}
        onConfirm={() => {
          setConfirmBan(false);
          onAct(r, 'ban');
        }}
      />
    </div>
  );
};

export const SafetySettingsGroup: React.FC<{ userId: string; isPlatformAdmin: boolean; openReportsCount?: number }> = ({
  userId,
  isPlatformAdmin,
  openReportsCount,
}) => {
  const [blocks, setBlocks] = useState<TreffBlock[]>([]);
  const [isBlocksOpen, setIsBlocksOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [treffReports, setTreffReports] = useState<TreffReport[]>([]);
  const [profileReports, setProfileReports] = useState<AdminProfileReport[]>([]);

  useEffect(() => {
    const refresh = () => void listMyTreffBlocks(userId).then(setBlocks);
    refresh();
    window.addEventListener(TREFF_CHANGED_EVENT, refresh);
    window.addEventListener(MODERATION_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(TREFF_CHANGED_EVENT, refresh);
      window.removeEventListener(MODERATION_CHANGED_EVENT, refresh);
    };
  }, [userId]);

  const loadReports = async () => {
    const [p, tr] = await Promise.all([listProfileReports(userId), listOpenTreffReports(userId)]);
    setProfileReports(p);
    setTreffReports(tr);
  };

  useEffect(() => {
    if (isReportsOpen) void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReportsOpen, userId]);

  const actTreff = async (r: TreffReport, action: TreffReportAction) => {
    const ok = await handleTreffReport(userId, r, action);
    showToast({ message: ok ? t('Erledigt.') : t('Das hat nicht geklappt.') });
    await loadReports();
  };

  const actProfile = async (r: AdminProfileReport, action: ModerationAction, rule?: ModerationRule) => {
    const ok = await moderateProfile(userId, r, action, rule);
    showToast({ message: ok ? t('Erledigt.') : t('Das hat nicht geklappt.') });
    await loadReports();
  };

  const total = profileReports.length + treffReports.length;

  return (
    <>
      <ListGroup title={t('Sicherheit')}>
        <ListRow
          testId="settings-treff-blocks"
          icon={<EyeOff className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title={t('Ausgeblendete Personen')}
          value={blocks.length}
          onClick={() => setIsBlocksOpen(true)}
        />
        <ListRow
          testId="settings-rules"
          icon={<ScrollText className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title={t('Regeln «Fair bleiben»')}
          onClick={() => openExternal(RULES_URL)}
        />
        {isPlatformAdmin && (
          <ListRow
            testId="settings-treff-reports"
            icon={<Flag className="w-5 h-5 text-[var(--bm-text-2)]" />}
            title={t('Meldungen prüfen')}
            subtitle={t('Nur für Plattform-Admins')}
            value={openReportsCount ? openReportsCount : undefined}
            onClick={() => setIsReportsOpen(true)}
          />
        )}
      </ListGroup>

      <Sheet open={isBlocksOpen} onClose={() => setIsBlocksOpen(false)} fitContent testId="treff-blocks-sheet" ariaLabel={t('Ausgeblendete Personen')}>
        <div className="px-5 pt-2 pb-4 space-y-3">
          <h2 className="text-[24px] font-bold">{t('Ausgeblendete Personen')}</h2>
          <p className="text-[16px] text-[var(--bm-text-2)]" data-testid="blocks-scope-note">
            {t('Gilt in der ganzen App: Treff, Ranglisten, «Wer war schon oben».')}
          </p>
          {blocks.length === 0 && <p className="text-[17px] text-[var(--bm-text-2)]">{t('Niemand ausgeblendet.')}</p>}
          {blocks.map(b => (
            <div key={b.blockedId} className="flex items-center gap-3 min-h-[56px]" data-testid={`treff-block-${b.blockedId}`}>
              <span className="flex-1 text-[17px] font-semibold truncate">{b.blockedNickname || t('Kletterer')}</span>
              <button
                type="button"
                className={actionBtn}
                data-testid={`treff-unblock-${b.blockedId}`}
                onClick={async () => {
                  await showPersonAgain(userId, b.blockedId);
                  setBlocks(await listMyTreffBlocks(userId));
                }}
              >
                {t('Wieder anzeigen')}
              </button>
            </div>
          ))}
        </div>
      </Sheet>

      {isPlatformAdmin && (
        <Sheet open={isReportsOpen} onClose={() => setIsReportsOpen(false)} fitContent testId="treff-reports-sheet" ariaLabel={t('Meldungen')}>
          <div className="px-5 pt-2 pb-4 space-y-4">
            <h2 className="text-[24px] font-bold">{t('Meldungen')}</h2>
            {total === 0 && <p className="text-[17px] text-[var(--bm-text-2)]">{t('Keine offenen Meldungen.')}</p>}
            {profileReports.map(r => (
              <ProfileReportCard key={r.id} r={r} onAct={actProfile} />
            ))}
            {treffReports.map(r => (
              <div key={r.id} className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3" data-testid={`treff-report-item-${r.id}`}>
                <p className="text-[15px] font-semibold text-[var(--bm-text-2)]">
                  {t('Treff')} · {t(TREFF_REPORT_REASONS.find(x => x.value === r.reason)?.label || r.reason)} ·{' '}
                  {new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className="text-[17px] break-words">{r.snapshot}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={actionBtn} onClick={() => actTreff(r, 'delete_entry')} data-testid={`treff-report-delete-${r.id}`}>
                    {t('Eintrag löschen')}
                  </button>
                  <button type="button" className={actionBtn} onClick={() => actTreff(r, 'ban_user')} data-testid={`treff-report-ban-${r.id}`}>
                    {t('Person sperren')}
                  </button>
                  <button type="button" className={actionBtn} onClick={() => actTreff(r, 'done')} data-testid={`treff-report-done-${r.id}`}>
                    {t('Erledigt')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
};
