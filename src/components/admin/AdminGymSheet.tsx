import React, { useState } from 'react';
import { Gym } from '../../types/boulder';
import { createGym, isGymAdmin } from '../../lib/gymStorage';
import { Sheet } from '../ui/Sheet';
import { showToast } from '../ui/Toast';
import { Check, Plus } from 'lucide-react';

/**
 * SPEC-023 F7/F8 · «Halle wählen» im Admin-Header.
 * Zeigt nur Hallen, die man verwalten darf; Plattform-Admins können eine neue Halle anlegen (nur Name + Stadt).
 * Bewusst ohne Karte: die Karte aller Hallen gehört zum Kletterer-Header (SPEC-025).
 */

interface Props {
  open: boolean;
  onClose: () => void;
  gyms: Gym[];
  activeGymId: string;
  userId: string;
  isPlatformAdmin: boolean;
  onSelectGym: (id: string) => void;
  onGymsChanged?: () => void;
}

export function getManageableGyms(gyms: Gym[], userId: string, platformAdmin: boolean): Gym[] {
  return gyms.filter(g => platformAdmin || isGymAdmin(g.id, userId));
}

const inputCls =
  'w-full min-h-[44px] px-3 rounded-xl bg-[var(--bm-elevated)] text-[16px] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--bm-accent)]';

export const AdminGymSheet: React.FC<Props> = ({
  open,
  onClose,
  gyms,
  activeGymId,
  userId,
  isPlatformAdmin,
  onSelectGym,
  onGymsChanged,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const manageable = getManageableGyms(gyms, userId, isPlatformAdmin);

  const close = () => {
    setIsCreating(false);
    setName('');
    setCity('');
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = createGym({ name, city: city || undefined }, userId);
      onGymsChanged?.();
      onSelectGym(created.id);
      showToast({ message: `«${created.name}» angelegt`, durationMs: 2500 });
      close();
    } catch (err: any) {
      showToast({ message: err?.message || 'Halle nicht angelegt.' });
    }
  };

  return (
    <Sheet open={open} onClose={close} fitContent testId="admin-gym-sheet" ariaLabel="Halle wählen">
      {isCreating ? (
        <form onSubmit={handleCreate} className="px-4 pb-2 space-y-4">
          <h2 className="text-[17px] font-semibold">Neue Halle</h2>
          <input
            type="text"
            required
            placeholder="Name der Halle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="new-gym-name"
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Stadt"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            data-testid="new-gym-city"
            className={inputCls}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-elevated)] text-[15px] font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              data-testid="new-gym-save"
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-strong)] text-[var(--bm-bg)] text-[15px] font-semibold disabled:opacity-30"
            >
              Anlegen
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 pb-2 space-y-3">
          <h2 className="text-[17px] font-semibold">Halle wählen</h2>
          <ul className="rounded-2xl bg-[var(--bm-bg)] overflow-hidden divide-y divide-[var(--bm-line)]">
            {manageable.map(g => {
              const active = g.id === activeGymId;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectGym(g.id);
                      close();
                    }}
                    aria-current={active ? 'true' : undefined}
                    data-testid={`admin-gym-row-${g.id}`}
                    className="w-full text-left flex items-center gap-3 px-4 min-h-[56px]"
                  >
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[16px] truncate ${active ? 'font-semibold' : ''}`}>{g.name}</span>
                      {g.city && <span className="block text-[13px] text-[var(--bm-text-2)]">{g.city}</span>}
                    </span>
                    {active && <Check className="w-5 h-5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {isPlatformAdmin && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              data-testid="admin-new-gym-btn"
              className="w-full min-h-[48px] rounded-xl bg-[var(--bm-elevated)] text-[16px] font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Neue Halle
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
};
