import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { ListRow } from '../ui/primitives';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { showToast } from '../ui/Toast';
import { getProfileData } from '../../lib/profileService';
import {
  ImportedTick,
  IMPORT_CHANGED_EVENT,
  getImportedTicks,
  importTicks,
  importResultText,
  deleteImportedTicks,
} from '../../lib/importService';
import { t } from '../../lib/i18n';

/** SPEC-043: importierte Ticks dieser Person (aktualisiert sich bei Import/Löschen). */
export function useImportedTicks(userId: string): ImportedTick[] {
  const [ticks, setTicks] = useState<ImportedTick[]>(() => getImportedTicks(userId));
  useEffect(() => {
    const load = () => setTicks(getImportedTicks(userId));
    load();
    window.addEventListener(IMPORT_CHANGED_EVENT, load);
    return () => window.removeEventListener(IMPORT_CHANGED_EVENT, load);
  }, [userId]);
  return ticks;
}

/** SPEC-043 F4: Einstellungen → Daten: «Ticks importieren (CSV)» und «Importierte Ticks löschen». */
export const ImportRows: React.FC<{ userId: string }> = ({ userId }) => {
  const ticks = useImportedTicks(userId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const res = importTicks(userId, text, getProfileData(userId, 'all').logbook);
    showToast({ message: importResultText(res), durationMs: 8000 });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <ListRow
        testId="settings-import-csv"
        icon={<Upload className="w-5 h-5 text-[var(--bm-text-2)]" />}
        title={t('Ticks importieren (CSV)')}
        subtitle={t('Eigene BoulderMate-Tabelle, z. B. aus Hallen ohne BoulderMate')}
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        data-testid="settings-import-file"
        onChange={e => void onFile(e.target.files?.[0])}
      />
      {ticks.length > 0 && (
        <ListRow
          testId="settings-import-delete"
          icon={<Trash2 className="w-5 h-5 text-[var(--bm-danger)]" />}
          title={t('Importierte Ticks löschen ({n})', { n: ticks.length })}
          destructive
          onClick={() => setConfirm(true)}
        />
      )}
      <ConfirmDialog
        open={confirm}
        title={t('Importierte Ticks löschen?')}
        message={t('Deine Ticks aus BoulderMate bleiben. Nur die importierten werden entfernt.')}
        confirmLabel={t('Löschen')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          const n = deleteImportedTicks(userId);
          showToast({ message: t('{n} importierte Ticks gelöscht.', { n }) });
        }}
      />
    </>
  );
};
