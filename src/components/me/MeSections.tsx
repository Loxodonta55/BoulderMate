import React, { useMemo, useState } from 'react';
import { Target, Sparkles, Eye, EyeOff, UserRound } from 'lucide-react';
import { LogbookEntry, WallBoulder, GymGradeScale } from '../../types/boulder';
import { ListGroup, ListRow } from '../ui/primitives';
import { getBoulderNumber, readableTextOn } from '../../lib/boulderNumbers';
import { weeklyTops, monthComparison, perGymSummary, GymRow, Recommendation } from '../../lib/meStats';
import { getProfile, isShownInLists, setShowInLists } from '../../lib/profileService';
import { showToast } from '../ui/Toast';
import { t, useLang } from '../../lib/i18n';

/** Farbpunkt mit Nummer (SPEC-032 F7), auch in «Ich» */
export const NumberDot: React.FC<{ colorHex?: string; number?: number; testId?: string }> = ({ colorHex, number, testId }) => (
  <span
    className="w-8 h-8 rounded-full ring-1 ring-black/10 flex items-center justify-center text-[15px] font-bold tabular-nums"
    style={{ backgroundColor: colorHex || 'var(--bm-text-3)', color: readableTextOn(colorHex) }}
    data-testid={testId}
  >
    {number ?? ''}
  </span>
);

// ---------------------------------------------------------------------------
// SPEC-035 F1: Meine Projekte
// ---------------------------------------------------------------------------
export const MyProjectsSection: React.FC<{
  projects: LogbookEntry[];
  attemptsOf: (boulderId: string) => number | undefined;
  showGym: boolean;
  onOpen: (entry: LogbookEntry) => void;
}> = ({ projects, attemptsOf, showGym, onOpen }) => {
  if (projects.length === 0) return null;
  return (
    <section className="space-y-2.5" data-testid="my-projects-section">
      <h2 className="text-[20px] font-semibold flex items-center gap-2">
        <Target className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden />
        {t('Meine Projekte')} <span className="text-[var(--bm-text-2)] font-normal">({projects.length})</span>
      </h2>
      <ListGroup>
        {projects.map(p => {
          const attempts = attemptsOf(p.boulderId);
          return (
            <ListRow
              key={p.id}
              testId={`my-project-${p.boulderId}`}
              icon={<NumberDot colorHex={p.gradeScale.colorHex} number={getBoulderNumber({ id: p.boulderId, sectorId: p.sectorId })} />}
              title={p.boulderName || p.gradeScale.colorName}
              subtitle={[p.fontGrade, p.sectorName, showGym ? p.gymName : null].filter(Boolean).join(' · ')}
              value={attempts ? (attempts === 1 ? t('{n} Versuch', { n: attempts }) : t('{n} Versuche', { n: attempts })) : undefined}
              onClick={() => onOpen(p)}
            />
          );
        })}
      </ListGroup>
    </section>
  );
};

// ---------------------------------------------------------------------------
// SPEC-037 F4: Für dich
// ---------------------------------------------------------------------------
export const ForYouSection: React.FC<{
  axisLabel: string;
  items: Recommendation[];
  scaleOf: (b: WallBoulder) => GymGradeScale | undefined;
  sectorName: (b: WallBoulder) => string;
  onOpen: (b: WallBoulder) => void;
}> = ({ axisLabel, items, scaleOf, sectorName, onOpen }) => {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2.5" data-testid="for-you-section">
      <h2 className="text-[20px] font-semibold flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--bm-star)]" aria-hidden />
        {t('Für dich')} <span className="text-[16px] font-normal text-[var(--bm-text-2)]">· {t('Baustelle {label}', { label: axisLabel })}</span>
      </h2>
      <ListGroup>
        {items.map(r => {
          const scale = scaleOf(r.boulder);
          return (
            <ListRow
              key={r.boulder.id}
              testId={`for-you-${r.boulder.id}`}
              icon={<NumberDot colorHex={scale?.colorHex} number={getBoulderNumber(r.boulder)} />}
              title={r.boulder.name || scale?.colorName || 'Boulder'}
              subtitle={[r.fontGrade, sectorName(r.boulder)].filter(Boolean).join(' · ')}
              value={`${axisLabel} ${r.value}`}
              onClick={() => onOpen(r.boulder)}
            />
          );
        })}
      </ListGroup>
    </section>
  );
};

// ---------------------------------------------------------------------------
// SPEC-037 F2: Verlauf 8 Wochen
// ---------------------------------------------------------------------------
export const WeeklySection: React.FC<{ logbook: LogbookEntry[]; now?: Date }> = ({ logbook, now }) => {
  const bars = useMemo(() => weeklyTops(logbook, now), [logbook, now]);
  const lang = useLang();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const month = useMemo(() => monthComparison(logbook, now), [logbook, now, lang]);
  const max = Math.max(1, ...bars.map(b => b.tops));
  if (logbook.length === 0) return null;
  return (
    <section className="space-y-2.5" data-testid="weekly-section">
      <h2 className="text-[20px] font-semibold">{t('Verlauf 8 Wochen')}</h2>
      <div className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-3">
        <div className="flex items-end gap-1.5 h-28" role="img" aria-label={t('Tops pro Woche: {list}', { list: bars.map(b => b.tops).join(', ') })}>
          {bars.map(b => (
            <div key={b.weekStart} className="flex-1 flex flex-col items-center justify-end h-full gap-1" data-testid={`week-bar-${b.weekStart}`}>
              <span className="text-[14px] font-semibold tabular-nums">{b.tops || ''}</span>
              <span
                className="w-full rounded-md bg-[var(--bm-accent)]"
                style={{ height: `${Math.max(4, (b.tops / max) * 80)}%`, opacity: b.tops ? 1 : 0.15 }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          {bars.map((b, i) => (
            <span key={b.weekStart} className="flex-1 text-center text-[12px] text-[var(--bm-text-2)] tabular-nums">
              {i % 2 === 1 ? '' : b.label}
            </span>
          ))}
        </div>
        <p className="text-[16px]" data-testid="month-sentence">{month.sentence}</p>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// SPEC-037 F5: Pro Halle
// ---------------------------------------------------------------------------
export const PerGymTable: React.FC<{ logbook: LogbookEntry[] }> = ({ logbook }) => {
  const rows: GymRow[] = useMemo(() => perGymSummary(logbook), [logbook]);
  if (rows.length < 2) return null;
  return (
    <section className="space-y-2.5" data-testid="per-gym-section">
      <h2 className="text-[20px] font-semibold">{t('Pro Halle')}</h2>
      <ListGroup>
        {rows.map(r => (
          <ListRow
            key={r.gymId}
            testId={`per-gym-${r.gymId}`}
            title={r.gymName}
            subtitle={t('Bester Grad {grade}', { grade: r.bestGrade })}
            value={t('{n} Tops', { n: r.tops })}
          />
        ))}
      </ListGroup>
    </section>
  );
};

// ---------------------------------------------------------------------------
// SPEC-033 F1/F5: Sichtbarkeit
// ---------------------------------------------------------------------------
export const VisibilityGroup: React.FC<{ userId: string; onChanged?: () => void }> = ({ userId, onChanged }) => {
  const [shown, setShown] = useState(() => isShownInLists(userId));
  const profile = getProfile(userId);
  const toggle = () => {
    const next = !shown;
    setShowInLists(userId, next);
    setShown(next);
    onChanged?.();
    showToast({ message: next ? t('Andere sehen deinen Namen') : t('Andere sehen «Jemand»'), durationMs: 2500 });
  };
  return (
    <ListGroup title={t('Sichtbarkeit')} footer={t('Gilt für «Wer war schon oben» und Beta. Sterne und Status zählen weiter.')}>
      <button
        type="button"
        role="switch"
        aria-checked={shown}
        data-testid="settings-show-in-lists"
        onClick={toggle}
        className="w-full text-left flex items-center gap-3 px-4 min-h-[56px] py-2.5"
      >
        {shown ? <Eye className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden /> : <EyeOff className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden />}
        <span className="flex-1 text-[16px]">{t('Mit Namen in «Wer war schon oben»')}</span>
        <span
          className={`w-[52px] h-[32px] rounded-full p-0.5 flex items-center transition ${shown ? 'bg-[var(--bm-success)] justify-end' : 'bg-[var(--bm-line)] justify-start'}`}
          aria-hidden
        >
          <span className="w-7 h-7 rounded-full bg-white shadow" />
        </span>
      </button>
      <div className="flex items-center gap-3 px-4 min-h-[52px] py-2" data-testid="visibility-preview">
        <span className="text-[14px] text-[var(--bm-text-2)] w-24 shrink-0">{t('So sehen dich andere:')}</span>
        <span className="w-8 h-8 rounded-full bg-[var(--bm-elevated)] flex items-center justify-center text-[14px] font-semibold shrink-0">
          {shown ? profile.nickname.charAt(0).toUpperCase() : <UserRound className="w-4 h-4 text-[var(--bm-text-2)]" aria-hidden />}
        </span>
        <span className="text-[16px] truncate" data-testid="visibility-preview-name">{shown ? profile.nickname : t('Jemand')}</span>
      </div>
    </ListGroup>
  );
};

