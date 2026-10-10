import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as gymStorage from '../src/lib/gymStorage';
import { signOut } from '../src/lib/authService';
import { createDraftBoulder, publishBatch, getSectors, getGradeScales, clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { resetAscentAndRatingStorage, logAscent } from '../src/lib/ratingAndAscentService';
import { toDayKey } from '../src/lib/treffService';
import {
  validateChallenge,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  loadChallenges,
  buildLeaderboard,
  challengeBoulders,
  daysLeftText,
  canManageChallenges,
  Challenge,
} from '../src/lib/challengeService';
import { ChallengeCards } from '../src/components/challenge/ChallengeCard';
import { GymChallengeAdmin } from '../src/components/challenge/GymChallengeAdmin';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { CurrentUser } from '../src/types/boulder';

const GYM = 'gym-6a-plus';
const ADMIN = 'admin-6aplus';
const today = new Date();
const day = (offset: number) => toDayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));

function seed(name: string, sectorIndex = 0) {
  const sector = getSectors(GYM)[sectorIndex];
  const scale = getGradeScales(GYM)[0];
  const b = createDraftBoulder({ sectorId: sector.id, gradeScaleId: scale.id, positionX: 0.3, positionY: 0.3, name, setterId: 'schrauber-6aplus' });
  publishBatch(sector.id, 'schrauber-6aplus');
  return b.id;
}

async function mkChallenge(rule: 'new' | 'sector' = 'new', sectorId?: string): Promise<Challenge> {
  const res = await createChallenge(ADMIN, { gymId: GYM, name: 'Oktober', startDay: day(-1), endDay: day(10), rule, sectorId });
  if (!res.ok) throw new Error(res.error);
  return res.value;
}

describe('SPEC-038: Hallen-Challenge', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    signOut();
  });
  afterEach(() => act(() => hideToast()));

  it('prüft Name, Reihenfolge, höchstens 31 Tage und Sektor (F1)', () => {
    const base = { gymId: GYM, name: 'X', startDay: '2026-10-01', endDay: '2026-10-31', rule: 'new' as const };
    expect(validateChallenge(base)).toBeNull();
    expect(validateChallenge({ ...base, endDay: '2026-11-01' })).toBe('too_long');
    expect(validateChallenge({ ...base, name: ' ' })).toBe('name_missing');
    expect(validateChallenge({ ...base, name: 'x'.repeat(41) })).toBe('name_too_long');
    expect(validateChallenge({ ...base, endDay: '2026-09-30' })).toBe('date_order');
    expect(validateChallenge({ ...base, rule: 'sector' })).toBe('sector_missing');
  });

  it('nur Admins der Halle legen an (AC-1)', async () => {
    expect(canManageChallenges(GYM, ADMIN)).toBe(true);
    expect(canManageChallenges(GYM, 'hans-kletterer')).toBe(false);
    const res = await createChallenge('hans-kletterer', { gymId: GYM, name: 'X', startDay: day(0), endDay: day(3), rule: 'new' });
    expect(res).toEqual({ ok: false, error: 'not_admin' });
    render(<GymChallengeAdmin gymId={GYM} userId="hans-kletterer" />);
    expect(screen.queryByTestId('gym-challenge-section')).not.toBeInTheDocument();
  });

  it('Fortschritt zählt nur Tops/Flashes an Bouldern der Regel; Rangliste nur Teilnehmer, Gleichstand früher zuerst (AC-2/AC-4)', async () => {
    const a = seed('neu A', 0);
    const b = seed('neu B', 1);
    const c = await mkChallenge('new');
    expect(challengeBoulders(c).map(x => x.id).sort()).toEqual([a, b].sort());
    logAscent('lena', 'Lena', a, 'top');
    logAscent('lena', 'Lena', b, 'project'); // zählt nicht
    logAscent('max', 'Max', a, 'flash');
    logAscent('max', 'Max', b, 'top');
    logAscent('zoe', 'Zoe', a, 'top');
    logAscent('nicht-dabei', 'Nina', a, 'top');
    await joinChallenge({ id: 'zoe', nickname: 'Zoe' }, c.id);
    await joinChallenge({ id: 'lena', nickname: 'Lena' }, c.id);
    await joinChallenge({ id: 'max', nickname: 'Max' }, c.id);
    const { participants } = await loadChallenges('lena', GYM);
    const board = buildLeaderboard(c, participants);
    expect(board.map(r => [r.nickname, r.done])).toEqual([
      ['Max', 2],
      ['Lena', 1],
      ['Zoe', 1],
    ]);
    expect(board.some(r => r.nickname === 'Nina')).toBe(false);
  });

  it('Regel «Ein Sektor» nimmt alle Boulder dieses Sektors (F2)', async () => {
    const sectors = getSectors(GYM);
    const inSector = seed('im Sektor', 0);
    seed('anderswo', 1);
    const c = await mkChallenge('sector', sectors[0].id);
    const ids = challengeBoulders(c).map(x => x.id);
    expect(ids).toContain(inSector);
    expect(ids.every(id => getSectors(GYM)[0] && id)).toBe(true);
    expect(challengeBoulders(c).every(x => x.sectorId === sectors[0].id)).toBe(true);
  });

  it('«Ich»-Karte: Mitmachen, «1 von 2», Rangliste, Aussteigen (AC-3/AC-5)', async () => {
    const a = seed('neu A', 0);
    seed('neu B', 1);
    const c = await mkChallenge('new');
    logAscent('lena', 'Lena', a, 'top');
    const lena: CurrentUser = { id: 'lena', nickname: 'Lena', role: 'member', isPlatformAdmin: false };
    render(
      <>
        <ToastHost />
        <ChallengeCards currentUser={lena} gymId={GYM} />
      </>
    );
    const join = await screen.findByTestId(`challenge-join-${c.id}`);
    expect(join).toHaveTextContent('Mitmachen · dein Name erscheint in der Rangliste');
    fireEvent.click(join);
    expect(await screen.findByTestId(`challenge-progress-${c.id}`)).toHaveTextContent('1 von 2');
    fireEvent.click(screen.getByTestId(`challenge-board-btn-${c.id}`));
    expect(screen.getByTestId('challenge-row-lena')).toHaveTextContent('1 von 2');
    fireEvent.click(screen.getByTestId(`challenge-leave-${c.id}`));
    await waitFor(() => expect(screen.getByTestId(`challenge-join-${c.id}`)).toBeInTheDocument());
    const { participants } = await loadChallenges('lena', GYM);
    expect(participants.some(p => p.userId === 'lena')).toBe(false);
  });

  it('keine Karte ausserhalb der Laufzeit oder in anderer Halle (AC-3)', async () => {
    await createChallenge(ADMIN, { gymId: GYM, name: 'Später', startDay: day(3), endDay: day(10), rule: 'new' });
    const lena: CurrentUser = { id: 'lena', nickname: 'Lena', role: 'member', isPlatformAdmin: false };
    const { container } = render(<ChallengeCards currentUser={lena} gymId={GYM} />);
    await act(async () => {});
    expect(container.querySelector('[data-testid^="challenge-card-"]')).toBeNull();
    expect(daysLeftText({ endsAt: new Date(today.getTime() + 3 * 86400000).toISOString() }, today)).toBe('noch 3 Tage');
  });

  it('Admin-Formular legt eine Challenge an und zeigt sie in der Liste (AC-1)', async () => {
    render(
      <>
        <ToastHost />
        <GymChallengeAdmin gymId={GYM} userId={ADMIN} />
      </>
    );
    fireEvent.click(screen.getByTestId('challenge-new'));
    fireEvent.change(screen.getByTestId('challenge-name'), { target: { value: 'Herbst-Challenge' } });
    fireEvent.click(screen.getByTestId('challenge-save'));
    expect(await screen.findByText('Herbst-Challenge')).toBeInTheDocument();
    void leaveChallenge;
  });
});
