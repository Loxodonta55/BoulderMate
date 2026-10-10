import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getSectors } from '../../lib/batchBoulderService';
import { toDayKey } from '../../lib/treffService';
import {
  Challenge,
  ChallengeRule,
  CHALLENGE_CHANGED_EVENT,
  CHALLENGE_ERROR_TEXT,
  CHALLENGE_NAME_MAX,
  canManageChallenges,
  createChallenge,
  deleteChallenge,
  loadChallenges,
  isRunning,
  daysLeftText,
} from '../../lib/challengeService';
import { showToast } from '../ui/Toast';

const inputCls =
  'w-full min-h-[52px] rounded-xl bg-[var(--bm-bg)] border-2 border-[var(--bm-line)] px-3 text-[17px] text-[var(--bm-text)]';

/** SPEC-038 F1 · Admin-Tab «Halle», Gruppe «Challenges». */
export const GymChallengeAdmin: React.FC<{ gymId: string; userId: string }> = ({ gymId, userId }) => {
  const [list, setList] = useState<Challenge[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const [name, setName] = useState('');
  const [startDay, setStartDay] = useState(toDayKey(today));
  const [endDay, setEndDay] = useState(toDayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13)));
  const [rule, setRule] = useState<ChallengeRule>('new');
  const [sectorId, setSectorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sectors = getSectors(gymId);

  useEffect(() => {
    const load = () => loadChallenges(userId, gymId).then(r => setList(r.challenges));
    void load();
    window.addEventListener(CHALLENGE_CHANGED_EVENT, load);
    return () => window.removeEventListener(CHALLENGE_CHANGED_EVENT, load);
  }, [gymId, userId]);

  if (!canManageChallenges(gymId, userId)) return null;

  const submit = async () => {
    const res = await createChallenge(userId, { gymId, name, startDay, endDay, rule, sectorId: sectorId || undefined });
    if (!res.ok) {
      setError(CHALLENGE_ERROR_TEXT[res.error]);
      return;
    }
    setError(null);
    setIsOpen(false);
    setName('');
    showToast({ message: `Challenge «${res.value.name}» angelegt.` });
  };

  return (
    <section className="rounded-2xl bg-[var(--bm-surface)] p-4 space-y-3" data-testid="gym-challenge-section">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold">Challenges</h3>
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="min-h-[44px] px-3 rounded-xl border-2 border-[var(--bm-line)] text-[16px] font-semibold flex items-center gap-1.5"
            data-testid="challenge-new"
          >
            <Plus className="w-5 h-5" aria-hidden /> Challenge
          </button>
        )}
      </div>

      {list.length === 0 && !isOpen && (
        <p className="text-[15px] text-[var(--bm-text-2)]">Noch keine Challenge. Kletterer sehen sie in «Ich» und machen freiwillig mit.</p>
      )}
      {list.length > 0 && (
        <ul className="divide-y divide-[var(--bm-line)]">
          {list.map(c => (
            <li key={c.id} className="flex items-center gap-3 min-h-[56px]" data-testid={`challenge-admin-${c.id}`}>
              <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-semibold truncate">{c.name}</span>
                <span className="block text-[15px] text-[var(--bm-text-2)]">
                  {c.rule === 'new' ? 'Alle neuen Boulder' : `Sektor ${sectors.find(s => s.id === c.sectorId)?.name || ''}`} ·{' '}
                  {isRunning(c) ? daysLeftText(c) : new Date(c.endsAt).getTime() < Date.now() ? 'vorbei' : 'startet bald'}
                </span>
              </span>
              <button
                type="button"
                aria-label="Challenge löschen"
                onClick={async () => {
                  if (await deleteChallenge(userId, c)) showToast({ message: 'Challenge gelöscht.' });
                }}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                data-testid={`challenge-delete-${c.id}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && (
        <div className="space-y-3" data-testid="challenge-form">
          <label className="block">
            <span className="block text-[16px] font-semibold mb-1">Name</span>
            <input
              className={inputCls}
              value={name}
              maxLength={CHALLENGE_NAME_MAX}
              onChange={e => setName(e.target.value)}
              placeholder="z. B. Oktober-Challenge"
              data-testid="challenge-name"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[16px] font-semibold mb-1">Start</span>
              <input type="date" className={inputCls} value={startDay} onChange={e => setStartDay(e.target.value)} data-testid="challenge-start" />
            </label>
            <label className="block">
              <span className="block text-[16px] font-semibold mb-1">Ende</span>
              <input type="date" className={inputCls} value={endDay} onChange={e => setEndDay(e.target.value)} data-testid="challenge-end" />
            </label>
          </div>
          <fieldset className="space-y-1">
            <legend className="text-[16px] font-semibold mb-1">Welche Boulder zählen?</legend>
            <label className="flex items-center gap-3 min-h-[48px] text-[17px]">
              <input type="radio" name="challenge-rule" checked={rule === 'new'} onChange={() => setRule('new')} className="w-6 h-6" data-testid="challenge-rule-new" />
              Alle neuen Boulder im Zeitraum
            </label>
            <label className="flex items-center gap-3 min-h-[48px] text-[17px]">
              <input type="radio" name="challenge-rule" checked={rule === 'sector'} onChange={() => setRule('sector')} className="w-6 h-6" data-testid="challenge-rule-sector" />
              Alle Boulder eines Sektors
            </label>
          </fieldset>
          {rule === 'sector' && (
            <select className={inputCls} value={sectorId} onChange={e => setSectorId(e.target.value)} data-testid="challenge-sector">
              <option value="">Sektor wählen</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          {error && (
            <p role="alert" className="text-[16px] font-semibold text-[var(--bm-danger)]" data-testid="challenge-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsOpen(false)} className="min-h-[52px] rounded-xl border-2 border-[var(--bm-line)] text-[17px] font-semibold">
              Abbrechen
            </button>
            <button
              type="button"
              onClick={submit}
              className="min-h-[52px] rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[17px] font-semibold"
              data-testid="challenge-save"
            >
              Anlegen
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
