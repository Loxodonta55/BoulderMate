import React, { useEffect, useState } from 'react';
import { Users, Trash2, BarChart3 } from 'lucide-react';
import { ListGroup, ListRow } from '../ui/primitives';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { TREFF_CHANGED_EVENT, getTreffSettings, saveTreffSettings, deleteAllMyTreffEntries } from '../../lib/treffService';

/**
 * SPEC-028 F12 · Ich → Einstellungen → Treff.
 * «Ausgeblendete Personen» und «Meldungen prüfen» liegen seit SPEC-046 unter «Sicherheit» (SafetySettingsGroup).
 */
export interface TreffSettingsGroupProps {
  userId: string;
}

export const TreffSettingsGroup: React.FC<TreffSettingsGroupProps> = ({ userId }) => {
  const [settings, setSettings] = useState(() => getTreffSettings(userId));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const refresh = () => setSettings(getTreffSettings(userId));
    refresh();
    window.addEventListener(TREFF_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TREFF_CHANGED_EVENT, refresh);
  }, [userId]);

  const update = async (patch: { showGrade?: boolean; hidden?: boolean }) => {
    setSettings(await saveTreffSettings({ userId, ...patch }));
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

    </>
  );
};
