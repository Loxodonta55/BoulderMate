import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { setPlannedRebuild } from '../lib/batchBoulderService';
import { formatPlannedDate } from '../lib/wallNews';
import { Sector } from '../types/boulder';

/**
 * SPEC-031 F5 · Schrauber-Studio: Umbau ankündigen («Wird abgeschraubt am …»).
 */
interface RebuildAnnounceDialogProps {
  open: boolean;
  sector: Sector;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const RebuildAnnounceDialog: React.FC<RebuildAnnounceDialogProps> = ({ open, sector, onClose, onSaved }) => {
  const [date, setDate] = useState<string>(sector.rebuildPlannedFor || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setDate(sector.rebuildPlannedFor || '');
      setError('');
    }
  }, [open, sector.id, sector.rebuildPlannedFor]);

  if (!open) return null;

  const save = () => {
    if (!date) {
      setError('Bitte ein Datum wählen.');
      return;
    }
    try {
      setPlannedRebuild(sector.id, date);
      onSaved(`Umbau angekündigt: ${formatPlannedDate(date)}`);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  const clear = () => {
    setPlannedRebuild(sector.id, null);
    onSaved('Ankündigung entfernt.');
    onClose();
  };

  return (
    <Sheet open onClose={onClose} fitContent testId="rebuild-announce-dialog" ariaLabel="Umbau ankündigen">
      <div className="px-5 pb-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <CalendarClock className="w-6 h-6 text-[var(--bm-text)]" aria-hidden />
          <h2 className="text-[20px] font-semibold text-[var(--bm-text)]">Umbau ankündigen</h2>
        </div>
        <p className="text-[16px] text-[var(--bm-text-2)]">{sector.name}</p>
        <label className="block space-y-1.5">
          <span className="text-[16px] font-semibold text-[var(--bm-text)]">Wird abgeschraubt am</span>
          <input
            type="date"
            value={date}
            min={todayIso()}
            onChange={e => {
              setDate(e.target.value);
              setError('');
            }}
            className="w-full min-h-[48px] px-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[17px] text-[var(--bm-text)]"
            data-testid="rebuild-announce-date"
          />
        </label>
        {error && (
          <p role="alert" className="text-[15px] font-semibold text-[var(--bm-danger)]" data-testid="rebuild-announce-error">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={save}
          className="w-full min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
          data-testid="rebuild-announce-save"
        >
          Ankündigen
        </button>
        {sector.rebuildPlannedFor && (
          <button
            type="button"
            onClick={clear}
            className="w-full min-h-[48px] rounded-xl bg-[var(--bm-surface)] text-[var(--bm-danger)] text-[16px] font-semibold"
            data-testid="rebuild-announce-clear"
          >
            Ankündigung entfernen
          </button>
        )}
      </div>
    </Sheet>
  );
};
