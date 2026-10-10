import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { CROWD_CHANGED_EVENT, CROWD_LABEL, CrowdInfo, CrowdLevel, getCrowdInfo, setGymCrowdLevel } from '../../lib/crowdService';
import { showToast } from '../ui/Toast';
import { t, useLang } from '../../lib/i18n';

/** crowdSourceText() mit Übersetzung (SPEC-039); der deutsche Text bleibt gleich. */
function sourceText(info: CrowdInfo): string {
  if (info.source === 'app') return t('laut BoulderMate-Nutzern');
  const m = info.minutesAgo ?? 0;
  return m < 1 ? t('laut Halle, gerade eben') : t('laut Halle, vor {m} Min', { m });
}

/**
 * SPEC-041 · «Gerade: Ruhig» – drei Stufen, nie eine Zahl. Ohne Daten nichts.
 */
export const CrowdBadge: React.FC<{ gymId: string; extraUserIds?: string[]; compact?: boolean; testId?: string }> = ({
  gymId,
  extraUserIds = [],
  compact = false,
  testId = 'crowd-badge',
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick(t => t + 1);
    window.addEventListener(CROWD_CHANGED_EVENT, onChange);
    window.addEventListener('bouldermate:ratings_updated', onChange);
    return () => {
      window.removeEventListener(CROWD_CHANGED_EVENT, onChange);
      window.removeEventListener('bouldermate:ratings_updated', onChange);
    };
  }, []);
  void tick;
  useLang();
  const info = getCrowdInfo(gymId, new Date(), extraUserIds);
  if (!info) return null;
  const tone =
    info.level === 'voll' ? 'text-[var(--bm-warning)]' : info.level === 'ruhig' ? 'text-[var(--bm-success)]' : 'text-[var(--bm-text)]';
  return (
    <span className={compact ? 'inline-flex items-center gap-1.5' : 'block'} data-testid={testId} data-level={info.level}>
      <span className={`inline-flex items-center gap-1.5 text-[16px] font-semibold ${tone}`}>
        <Users className="w-[18px] h-[18px]" aria-hidden />
        {t('Gerade: {level}', { level: t(CROWD_LABEL[info.level]) })}
      </span>
      {!compact && <span className="block text-[14px] text-[var(--bm-text-2)]">{sourceText(info)}</span>}
    </span>
  );
};

/** SPEC-041 F1: Admin-Tab «Halle» – Auslastung mit einem Tipp melden (gilt 90 Minuten). */
export const GymCrowdControl: React.FC<{ gymId: string; userId: string }> = ({ gymId, userId }) => {
  const [, setTick] = useState(0);
  const set = (level: CrowdLevel | null) => {
    if (!setGymCrowdLevel(gymId, userId, level)) {
      showToast({ message: 'Nur Hallen-Admins dürfen das ändern.' });
      return;
    }
    setTick(t => t + 1);
    showToast({ message: level ? `Gemeldet: ${CROWD_LABEL[level]} (gilt 90 Minuten)` : 'Meldung entfernt.' });
  };
  return (
    <section className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-3" data-testid="gym-crowd-section">
      <h3 className="text-[17px] font-semibold">Wie voll ist es gerade?</h3>
      <div className="grid grid-cols-3 gap-2">
        {(['ruhig', 'normal', 'voll'] as CrowdLevel[]).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => set(l)}
            data-testid={`gym-crowd-${l}`}
            className="min-h-[52px] rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold active:bg-[var(--bm-elevated)]"
          >
            {CROWD_LABEL[l]}
          </button>
        ))}
      </div>
      <CrowdBadge gymId={gymId} testId="gym-crowd-current" />
      <p className="text-[15px] text-[var(--bm-text-2)]">
        Kletterer sehen das im Hallen-Fenster und bei Treff. Die Meldung gilt 90 Minuten, danach zählt wieder die Aktivität in der App.
      </p>
      <button type="button" onClick={() => set(null)} className="min-h-[44px] text-[15px] font-semibold underline" data-testid="gym-crowd-clear">
        Meldung entfernen
      </button>
    </section>
  );
};
