import React, { useEffect, useState } from 'react';
import { Users, EyeOff, Trash2, Flag, BarChart3 } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import {
  TreffBlock,
  TreffReport,
  TreffReportAction,
  TREFF_CHANGED_EVENT,
  TREFF_REPORT_REASONS,
  getTreffSettings,
  saveTreffSettings,
  deleteAllMyTreffEntries,
  listMyTreffBlocks,
  unblockTreffUser,
  listOpenTreffReports,
  handleTreffReport,
} from '../../lib/treffService';

/**
 * SPEC-028 F12/F14/F15 · Ich → Einstellungen → Treff.
 */
export interface TreffSettingsGroupProps {
  userId: string;
  isPlatformAdmin: boolean;
}

const actionBtn =
  'min-h-[48px] px-4 rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold bg-[var(--bm-surface)] active:bg-[var(--bm-elevated)]';

export const TreffSettingsGroup: React.FC<TreffSettingsGroupProps> = ({ userId, isPlatformAdmin }) => {
  const [settings, setSettings] = useState(() => getTreffSettings(userId));
  const [blocks, setBlocks] = useState<TreffBlock[]>([]);
  const [isBlocksOpen, setIsBlocksOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [reports, setReports] = useState<TreffReport[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setSettings(getTreffSettings(userId));
      void listMyTreffBlocks(userId).then(setBlocks);
    };
    refresh();
    window.addEventListener(TREFF_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TREFF_CHANGED_EVENT, refresh);
  }, [userId]);

  useEffect(() => {
    if (isReportsOpen) void listOpenTreffReports(userId).then(setReports);
  }, [isReportsOpen, userId]);

  const update = async (patch: { showGrade?: boolean; hidden?: boolean }) => {
    setSettings(await saveTreffSettings({ userId, ...patch }));
  };

  const act = async (r: TreffReport, action: TreffReportAction) => {
    const ok = await handleTreffReport(userId, r, action);
    showToast({ message: ok ? 'Erledigt.' : 'Das hat nicht geklappt.' });
    setReports(await listOpenTreffReports(userId));
  };

  return (
    <>
      <ListGroup title="Treff" footer="Treff zeigt anderen, wann du in der Halle bist.">
        <ListRow
          testId="settings-treff-show-grade"
          icon={<BarChart3 className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title="Niveau zeigen"
          value={settings.showGrade ? 'Ja' : 'Nein'}
          chevron={false}
          onClick={() => update({ showGrade: !settings.showGrade })}
        />
        <ListRow
          testId="settings-treff-blocks"
          icon={<EyeOff className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title="Ausgeblendete Personen"
          value={blocks.length}
          onClick={() => setIsBlocksOpen(true)}
        />
        <ListRow
          testId="settings-treff-hide"
          icon={<Users className="w-5 h-5 text-[var(--bm-text-2)]" />}
          title={settings.hidden ? 'Treff einblenden' : 'Treff ausblenden'}
          subtitle={settings.hidden ? 'Der Tab «Treff» ist ausgeblendet.' : 'Blendet den Tab «Treff» aus.'}
          chevron={false}
          onClick={() => update({ hidden: !settings.hidden })}
        />
        <ListRow
          testId="settings-treff-delete"
          icon={<Trash2 className="w-5 h-5 text-[var(--bm-danger)]" />}
          title="Meine Einträge löschen"
          destructive
          chevron={false}
          onClick={() => setConfirmDelete(true)}
        />
        {isPlatformAdmin && (
          <ListRow
            testId="settings-treff-reports"
            icon={<Flag className="w-5 h-5 text-[var(--bm-text-2)]" />}
            title="Meldungen prüfen"
            subtitle="Nur für Plattform-Admins"
            onClick={() => setIsReportsOpen(true)}
          />
        )}
      </ListGroup>

      <ConfirmDialog
        open={confirmDelete}
        title="Alle deine Treff-Einträge löschen?"
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          const ok = await deleteAllMyTreffEntries(userId);
          showToast({ message: ok ? 'Deine Einträge sind gelöscht.' : 'Das hat nicht geklappt.' });
        }}
      />

      <Sheet open={isBlocksOpen} onClose={() => setIsBlocksOpen(false)} fitContent testId="treff-blocks-sheet" ariaLabel="Ausgeblendete Personen">
        <div className="px-5 pt-2 space-y-3">
          <h2 className="text-[24px] font-bold">Ausgeblendete Personen</h2>
          {blocks.length === 0 && <p className="text-[17px] text-[var(--bm-text-2)]">Niemand ausgeblendet.</p>}
          {blocks.map(b => (
            <div key={b.blockedId} className="flex items-center gap-3 min-h-[56px]" data-testid={`treff-block-${b.blockedId}`}>
              <span className="flex-1 text-[17px] font-semibold truncate">{b.blockedNickname || 'Kletterer'}</span>
              <button
                type="button"
                className={actionBtn}
                data-testid={`treff-unblock-${b.blockedId}`}
                onClick={async () => {
                  await unblockTreffUser(userId, b.blockedId);
                  setBlocks(await listMyTreffBlocks(userId));
                }}
              >
                Wieder zeigen
              </button>
            </div>
          ))}
        </div>
      </Sheet>

      {isPlatformAdmin && (
        <Sheet open={isReportsOpen} onClose={() => setIsReportsOpen(false)} fitContent testId="treff-reports-sheet" ariaLabel="Meldungen">
          <div className="px-5 pt-2 space-y-4">
            <h2 className="text-[24px] font-bold">Meldungen</h2>
            {reports.length === 0 && <p className="text-[17px] text-[var(--bm-text-2)]">Keine offenen Meldungen.</p>}
            {reports.map(r => (
              <div key={r.id} className="rounded-2xl bg-[var(--bm-elevated)] p-4 space-y-3" data-testid={`treff-report-item-${r.id}`}>
                <p className="text-[15px] font-semibold text-[var(--bm-text-2)]">
                  {TREFF_REPORT_REASONS.find(x => x.value === r.reason)?.label || r.reason} ·{' '}
                  {new Date(r.createdAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className="text-[17px] break-words">{r.snapshot}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={actionBtn} onClick={() => act(r, 'delete_entry')} data-testid={`treff-report-delete-${r.id}`}>
                    Eintrag löschen
                  </button>
                  <button type="button" className={actionBtn} onClick={() => act(r, 'ban_user')} data-testid={`treff-report-ban-${r.id}`}>
                    Person sperren
                  </button>
                  <button type="button" className={actionBtn} onClick={() => act(r, 'done')} data-testid={`treff-report-done-${r.id}`}>
                    Erledigt
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
