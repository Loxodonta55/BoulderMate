import React, { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CurrentUser } from '../../types/boulder';
import { Sheet } from '../ui/Sheet';
import { showToast } from '../ui/Toast';
import {
  Challenge,
  ChallengeParticipant,
  CHALLENGE_CHANGED_EVENT,
  loadChallenges,
  isRunning,
  daysLeftText,
  challengeBoulders,
  countDone,
  buildLeaderboard,
  joinChallenge,
  leaveChallenge,
} from '../../lib/challengeService';
import { t } from '../../lib/i18n';

/** daysLeftText liefert Deutsch; hier zur Anzeige übersetzt (SPEC-039). */
const daysLeft = (c: Challenge): string => {
  const s = daysLeftText(c);
  const m = /^noch (\d+) Tage$/.exec(s);
  return m ? t('noch {n} Tage', { n: m[1] }) : t(s);
};

/**
 * SPEC-038 F3/F4 · Karte in «Ich» für die laufende Challenge der aktuellen Halle.
 * Nicht auf der Wand, kein Pop-up, keine Zahl am Tab.
 */
export const ChallengeCards: React.FC<{ currentUser: CurrentUser; gymId: string; version?: number }> = ({ currentUser, gymId, version = 0 }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [boardFor, setBoardFor] = useState<Challenge | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      loadChallenges(currentUser.id, gymId).then(r => {
        if (!active) return;
        setChallenges(r.challenges);
        setParticipants(r.participants);
        setTick(n => n + 1);
      });
    void load();
    window.addEventListener(CHALLENGE_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(CHALLENGE_CHANGED_EVENT, load);
    };
  }, [currentUser.id, gymId]);

  const running = useMemo(() => challenges.filter(c => c.gymId === gymId && isRunning(c)), [challenges, gymId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => new Map(running.map(c => {
    const ids = new Set(challengeBoulders(c).map(b => b.id));
    return [c.id, { total: ids.size, ...countDone(c, currentUser.id, ids) }];
  })), [running, currentUser.id, version, tick]);

  if (running.length === 0 || currentUser.id === 'guest') return null;

  const isIn = (c: Challenge) => participants.some(p => p.challengeId === c.id && p.userId === currentUser.id);

  return (
    <>
      {running.map(c => {
        const s = stats.get(c.id) || { total: 0, done: 0 };
        const joined = isIn(c);
        const all = joined && s.total > 0 && s.done >= s.total;
        return (
          <section key={c.id} className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-3" data-testid={`challenge-card-${c.id}`}>
            <div className="flex items-start gap-3">
              <Trophy className="w-6 h-6 text-[var(--bm-star)] shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                <h2 className="text-[19px] font-bold leading-tight">{c.name}</h2>
                <p className="text-[15px] text-[var(--bm-text-2)]">Challenge · {daysLeft(c)}</p>
              </div>
            </div>
            {joined ? (
              <>
                <p className="text-[17px] font-semibold" data-testid={`challenge-progress-${c.id}`}>
                  {all ? t('Alle geschafft 🎉') : t('{n} von {m}', { n: s.done, m: s.total })}
                </p>
                <div className="h-3 rounded-full bg-[var(--bm-elevated)] overflow-hidden" aria-hidden>
                  <div className="h-full bg-[var(--bm-star)]" style={{ width: `${s.total ? Math.min(100, (s.done / s.total) * 100) : 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBoardFor(c)}
                    className="min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
                    data-testid={`challenge-board-btn-${c.id}`}
                  >
                    {t('Rangliste')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await leaveChallenge(currentUser.id, c.id);
                      showToast({ message: t('Ausgestiegen. Dein Name ist nicht mehr in der Rangliste.') });
                    }}
                    className="min-h-[52px] rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold"
                    data-testid={`challenge-leave-${c.id}`}
                  >
                    {t('Aussteigen')}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const ok = await joinChallenge({ id: currentUser.id, nickname: currentUser.nickname }, c.id);
                  showToast({ message: ok ? t('Du machst mit.') : t('Das hat nicht geklappt. Bitte nochmal versuchen.') });
                }}
                className="w-full min-h-[52px] rounded-xl border-2 border-[var(--bm-text)] text-[17px] font-semibold"
                data-testid={`challenge-join-${c.id}`}
              >
                {t('Mitmachen · dein Name erscheint in der Rangliste')}
              </button>
            )}
          </section>
        );
      })}

      <Sheet open={Boolean(boardFor)} onClose={() => setBoardFor(null)} fitContent testId="challenge-board" ariaLabel={t('Rangliste')}>
        {boardFor && (
          <div className="px-5 pt-2 space-y-3">
            <h2 className="text-[24px] font-bold">{boardFor.name}</h2>
            <ol className="rounded-2xl bg-[var(--bm-elevated)] divide-y divide-[var(--bm-line)]">
              {buildLeaderboard(boardFor, participants).map(r => {
                const total = stats.get(boardFor.id)?.total ?? 0;
                return (
                  <li
                    key={r.userId}
                    className={`flex items-center gap-3 px-4 min-h-[52px] ${r.userId === currentUser.id ? 'font-bold' : ''}`}
                    data-testid={`challenge-row-${r.userId}`}
                  >
                    <span className="w-8 text-[17px] tabular-nums">{r.rank}.</span>
                    <span className="flex-1 text-[17px] truncate">{r.userId === currentUser.id ? t('{name} (du)', { name: r.nickname }) : r.nickname}</span>
                    <span className="text-[17px] tabular-nums">
                      {t('{n} von {m}', { n: r.done, m: total })}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="text-[15px] text-[var(--bm-text-2)]">{t('Nur Teilnehmer stehen hier. Gleichstand: wer früher dort war, steht vorne.')}</p>
          </div>
        )}
      </Sheet>
    </>
  );
};
