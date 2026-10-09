import React, { useEffect, useMemo, useState } from 'react';
import { Gym } from '../../types/boulder';
import { Sheet } from '../ui/Sheet';
import {
  PublicTreffEntry,
  loadPublicTreffEntries,
  splitTreffEntries,
  filterByGym,
  formatTreffDay,
  formatTreffTime,
} from '../../lib/treffService';
import { GradeBadge, TreffAvatar } from './TreffView';

/**
 * SPEC-028 F10 · Gäste auf der Landing Page: «Wer ist heute da?»
 * Nur Halle, Zeit und Niveau – keine Namen, keine Bilder.
 */
export interface TreffGuestSheetProps {
  open: boolean;
  onClose: () => void;
  gyms: Gym[];
  activeGymId: string;
  onLogin: () => void;
}

export const TreffGuestSheet: React.FC<TreffGuestSheetProps> = ({ open, onClose, gyms, activeGymId, onLogin }) => {
  const [entries, setEntries] = useState<PublicTreffEntry[]>([]);
  const [gymId, setGymId] = useState(activeGymId);

  useEffect(() => {
    if (!open) return;
    setGymId(activeGymId);
    void loadPublicTreffEntries().then(r => setEntries(r.entries));
  }, [open, activeGymId]);

  const { now, later } = useMemo(() => splitTreffEntries(filterByGym(entries, 'gym', gymId)), [entries, gymId]);

  const list = (title: string, items: PublicTreffEntry[], testId: string) => (
    <section className="space-y-1.5" data-testid={testId}>
      <h3 className="text-[20px] font-bold">
        {title} <span className="text-[var(--bm-text-2)]">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-[17px] text-[var(--bm-text-2)]">Noch niemand eingetragen.</p>
      ) : (
        <div className="rounded-2xl bg-[var(--bm-elevated)] divide-y divide-[var(--bm-line)]">
          {items.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 min-h-[64px]" data-testid={`treff-guest-row-${e.id}`}>
              <TreffAvatar />
              <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-semibold">Jemand</span>
                <span className="block text-[20px] font-bold">
                  {formatTreffDay(e.startsAt)} · {formatTreffTime(e)}
                </span>
              </span>
              <GradeBadge min={e.gradeMin} max={e.gradeMax} />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <Sheet open={open} onClose={onClose} fitContent testId="treff-guest-sheet" ariaLabel="Wer ist heute da?">
      <div className="px-5 pt-2 space-y-5">
        <h2 className="text-[24px] font-bold">Wer ist da?</h2>
        {gyms.length > 1 && (
          <select
            value={gymId}
            onChange={e => setGymId(e.target.value)}
            aria-label="Halle"
            data-testid="treff-guest-gym"
            className="w-full min-h-[52px] rounded-xl bg-[var(--bm-surface)] border-2 border-[var(--bm-line)] px-3 text-[17px] font-semibold"
          >
            {gyms.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
        {list('Jetzt da', now, 'treff-guest-now')}
        {list('Kommt noch', later, 'treff-guest-later')}
        <button
          type="button"
          onClick={onLogin}
          className="w-full min-h-[56px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-bold"
          data-testid="treff-login-cta"
        >
          Anmelden, um dich einzutragen
        </button>
      </div>
    </Sheet>
  );
};
