import React, { useEffect, useState } from 'react';
import { Flame, X, Star, Check } from 'lucide-react';
import { WallBoulder } from '../../types/boulder';
import { ListGroup } from '../ui/primitives';
import { NumberDot } from '../me/MeSections';
import { InfoTip } from '../basis/InfoTip';
import { getBoulderNumber } from '../../lib/boulderNumbers';
import { formatAxisValue } from '../../lib/deepDiveService';
import { t, useLang } from '../../lib/i18n';
import {
  CHALLENGE_TODAY_EVENT,
  ChallengeCandidate,
  ChallengeToday,
  getChallengeToday,
  isBannerEnabled,
  isTodaysChallenge,
  setBannerEnabled,
  swapChallengeToday,
} from '../../lib/challengeToday';

/**
 * SPEC-051 «Challenge Today» · Zeile in «Ich», Streifen an der Wand, Zeile im BoulderSheet, Schalter.
 * Ruhig: keine Punkte, kein Ton, eingeklappt, Flamme statt Pokal (Hallen-Challenge SPEC-038).
 */

export const CHALLENGE_HELP =
  'Deine Stärken kommen aus deinem Stil. Die Route liegt 1–2 Stufen über deinem sicheren Grad (mind. 2 Tops). Wird nur auf deinem Gerät berechnet.';

/** «Weiß Nr. 12» */
export function challengeTitle(c: ChallengeCandidate): string {
  const color = c.scale?.colorName ? t(c.scale.colorName) : 'Boulder';
  const n = getBoulderNumber(c.boulder);
  return n ? t('{color} Nr. {n}', { color, n }) : c.boulder.name || color;
}

/** «6a+ (stiff)» */
export function challengeGrade(c: ChallengeCandidate): string {
  return c.feel === 'stiff' || c.feel === 'soft' ? `${c.fontGrade} (${c.feel})` : c.fontGrade;
}

export function reasonLines(c: ChallengeCandidate): string[] {
  const lines = [
    t('Liegt dir: {list}', { list: c.strengths.map(s => `${t(s.label)} ${formatAxisValue(s.value)}`).join(' · ') }),
  ];
  for (const w of c.lowNeeds) lines.push(t('Kaum {label} nötig', { label: t(w.label) }));
  lines.push(
    c.steps === 1
      ? t('1 Stufe über deinem sicheren Grad {grade}', { grade: c.safeGrade })
      : t('{n} Stufen über deinem sicheren Grad {grade}', { n: c.steps, grade: c.safeGrade })
  );
  return lines;
}

/** Lädt die Tages-Challenge und folgt Begehungen, Bewertungen und Tausch. */
export function useChallengeToday(userId: string, gymId: string, version = 0): [ChallengeToday, () => void] {
  const load = () => getChallengeToday(userId, gymId);
  const [state, setState] = useState<ChallengeToday>(load);
  useEffect(() => {
    setState(load());
    const refresh = () => setState(load());
    const events = [CHALLENGE_TODAY_EVENT, 'bouldermate:ascents_updated', 'bouldermate:ratings_updated', 'bouldermate:boulders_updated'];
    events.forEach(e => window.addEventListener(e, refresh));
    return () => events.forEach(e => window.removeEventListener(e, refresh));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, gymId, version]);
  return [state, () => setState(swapChallengeToday(userId, gymId))];
}

// ---------------------------------------------------------------------------
// F3: Zeile in «Ich»
// ---------------------------------------------------------------------------
export const ChallengeTodayRow: React.FC<{
  userId: string;
  gymId: string;
  gymName: string;
  version?: number;
  onOpen: (b: WallBoulder) => void;
}> = ({ userId, gymId, gymName, version, onOpen }) => {
  useLang();
  const [today, swap] = useChallengeToday(userId, gymId, version);
  const [open, setOpen] = useState(false);
  if (!today.unlocked) return null;
  const c = today.candidate;

  return (
    <section data-testid="challenge-today-row">
      <ListGroup>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          data-testid="challenge-today-toggle"
          className="w-full text-left flex items-center gap-3 px-4 min-h-[56px] py-2.5 active:bg-[var(--bm-elevated)]"
        >
          <Flame className="w-6 h-6 text-[var(--bm-warning)] shrink-0" aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block text-[17px] font-semibold text-[var(--bm-text)]">{t('Deine Challenge heute')}</span>
            <span className="block text-[15px] text-[var(--bm-text-2)] truncate" data-testid="challenge-today-subtitle">
              {c
                ? [challengeTitle(c), challengeGrade(c), c.sector?.name].filter(Boolean).join(' · ')
                : t('Heute keine passende Route in {gym}. Schau morgen wieder.', { gym: gymName })}
            </span>
          </span>
          {today.done && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--bm-success)]" data-testid="challenge-today-done">
              <Check className="w-4 h-4" aria-hidden />
              {t('Geschafft')}
            </span>
          )}
        </button>
        {open && c && (
          <div className="px-4 py-3 space-y-3" data-testid="challenge-today-details">
            <div className="flex items-center gap-3">
              <NumberDot colorHex={c.scale?.colorHex} number={getBoulderNumber(c.boulder)} />
              <p className="flex-1 min-w-0 text-[17px] font-semibold text-[var(--bm-text)]">
                {challengeTitle(c)} · {challengeGrade(c)}
              </p>
              {c.stars !== null && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[15px] text-[var(--bm-text-2)] tabular-nums">
                  <Star className="w-4 h-4 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-hidden />
                  {formatAxisValue(c.stars)}
                </span>
              )}
            </div>
            <ul className="space-y-1" data-testid="challenge-today-reasons">
              {reasonLines(c).map(line => (
                <li key={line} className="text-[16px] text-[var(--bm-text)]">{line}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpen(c.boulder)}
                data-testid="challenge-today-open"
                className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[16px] font-semibold"
              >
                {t('Route öffnen')}
              </button>
              {today.canSwap && (
                <button
                  type="button"
                  onClick={swap}
                  data-testid="challenge-today-swap"
                  className="min-h-[48px] px-4 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-text)] text-[16px] font-semibold"
                >
                  {t('Andere zeigen')}
                </button>
              )}
              <span className="ml-auto flex flex-wrap items-center">
                <InfoTip text={CHALLENGE_HELP} label="Wie wird die Challenge gewählt?" testId="challenge-today-help" />
              </span>
            </div>
          </div>
        )}
      </ListGroup>
    </section>
  );
};

// ---------------------------------------------------------------------------
// F4: Streifen an der Wand
// ---------------------------------------------------------------------------
export const ChallengeTodayBanner: React.FC<{
  candidate: ChallengeCandidate;
  onShow: () => void;
  onDismiss: () => void;
}> = ({ candidate, onShow, onDismiss }) => {
  useLang();
  return (
    <div
      className="rounded-2xl bg-[var(--bm-surface)] border border-[var(--bm-line)] pl-4 pr-1.5 py-2 flex items-center gap-3"
      role="status"
      data-testid="challenge-today-banner"
    >
      <Flame className="w-5 h-5 text-[var(--bm-warning)] shrink-0" aria-hidden />
      <p className="flex-1 min-w-0 text-[16px] font-semibold text-[var(--bm-text)]">
        {t('Deine Challenge heute')}: {[challengeTitle(candidate), candidate.sector?.name].filter(Boolean).join(' · ')}
      </p>
      <button
        type="button"
        onClick={onShow}
        className="min-h-[44px] px-3.5 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[15px] font-semibold shrink-0"
        data-testid="challenge-today-banner-show"
      >
        {t('Zeigen')}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--bm-text-2)] shrink-0"
        aria-label={t('Hinweis schließen')}
        data-testid="challenge-today-banner-dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// F6: Zeile im BoulderSheet
// ---------------------------------------------------------------------------
export const ChallengeTodaySheetLine: React.FC<{ userId: string; boulderId: string }> = ({ userId, boulderId }) => {
  useLang();
  if (!isTodaysChallenge(userId, boulderId)) return null;
  return (
    <p className="flex items-center gap-2 pb-2 text-[16px] font-semibold text-[var(--bm-text)]" data-testid="challenge-today-sheet-line">
      <Flame className="w-5 h-5 text-[var(--bm-warning)] shrink-0" aria-hidden />
      {t('Deine Challenge heute')}
    </p>
  );
};

// ---------------------------------------------------------------------------
// F5: Schalter in den Einstellungen
// ---------------------------------------------------------------------------
export const ChallengeBannerSetting: React.FC = () => {
  useLang();
  const [on, setOn] = useState(isBannerEnabled);
  const toggle = () => {
    setBannerEnabled(!on);
    setOn(!on);
  };
  return (
    <ListGroup title={t('Challenge')} footer={t('«Deine Challenge heute» bleibt in «Ich» immer erreichbar.')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        data-testid="settings-challenge-banner"
        onClick={toggle}
        className="w-full text-left flex items-center gap-3 px-4 min-h-[56px] py-2.5"
      >
        <Flame className="w-5 h-5 text-[var(--bm-text-2)]" aria-hidden />
        <span className="flex-1 text-[16px]">{t('Challenge-Hinweis an der Wand')}</span>
        <span
          className={`w-[52px] h-[32px] rounded-full p-0.5 flex items-center transition ${on ? 'bg-[var(--bm-success)] justify-end' : 'bg-[var(--bm-line)] justify-start'}`}
          aria-hidden
        >
          <span className="w-7 h-7 rounded-full bg-white shadow" />
        </span>
      </button>
    </ListGroup>
  );
};
