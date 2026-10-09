import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { isTreffEnabledForGym, setGymTreffEnabled } from '../../lib/treffService';
import { showToast } from '../ui/Toast';

/**
 * SPEC-028 F16 · Admin-Tab «Halle»: Treff in dieser Halle erlauben.
 */
export const GymTreffToggle: React.FC<{ gymId: string; userId: string }> = ({ gymId, userId }) => {
  const [enabled, setEnabled] = useState(() => isTreffEnabledForGym(gymId));

  return (
    <section className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-2" data-testid="gym-treff-section">
      <label className="flex items-center gap-3 min-h-[52px] cursor-pointer">
        <Users className="w-6 h-6 text-[var(--bm-text-2)] shrink-0" aria-hidden />
        <span className="flex-1 text-[17px] font-semibold">Treff in dieser Halle erlauben</span>
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          data-testid="gym-treff-toggle"
          className="w-7 h-7 accent-[var(--bm-accent)]"
          onChange={e => {
            const next = e.target.checked;
            if (setGymTreffEnabled(gymId, userId, next)) {
              setEnabled(next);
            } else {
              showToast({ message: 'Nur Hallen-Admins dürfen das ändern.' });
            }
          }}
        />
      </label>
      <p className="text-[15px] text-[var(--bm-text-2)]">Kletterer können eintragen, wann sie in der Halle sind.</p>
    </section>
  );
};
