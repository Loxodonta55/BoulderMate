import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import * as gymStorage from '../src/lib/gymStorage';
import { signOut } from '../src/lib/authService';
import { TreffView } from '../src/components/treff/TreffView';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { CurrentUser } from '../src/types/boulder';
import {
  TreffEntry,
  TREFF_STORE_KEY,
  TREFF_MAX_OPEN_ENTRIES,
  saveTreffSettings,
  createTreffEntry,
  countOpenEntries,
  dueWeeklyFollowUps,
  ensureWeeklyFollowUps,
  stopTreffRepeat,
  splitTreffEntries,
  toPublicEntry,
  treffMarkers,
  canCreateGymEvent,
  treffDisplayName,
  plusOneWeek,
  loadTreffEntries,
} from '../src/lib/treffService';

const GYM = 'gym-6a-plus';
const NOW = new Date(2026, 9, 16, 17, 10); // Fr 16. Okt. 2026, 17:10
const LENA = { id: 'treff-lena', nickname: 'Lena' };
const ADMIN = { id: 'admin-6aplus', nickname: 'Hallen-Admin' };

function at(h: number, m = 0, dayOffset = 0): Date {
  return new Date(2026, 9, 16 + dayOffset, h, m);
}

function entry(id: string, userId: string, start: Date, end: Date, extra: Partial<TreffEntry> = {}): TreffEntry {
  return { id, userId, gymId: GYM, startsAt: start.toISOString(), endsAt: end.toISOString(), nickname: userId, createdAt: start.toISOString(), ...extra };
}

function storedEntries(): TreffEntry[] {
  return JSON.parse(localStorage.getItem(TREFF_STORE_KEY) || '{"entries":[]}').entries;
}

async function consent(userId: string) {
  await saveTreffSettings({ userId, consentAt: NOW.toISOString(), ageConfirmed: true });
}

describe('SPEC-036: Treff+', () => {
  beforeEach(() => {
    localStorage.clear();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    signOut();
  });
  afterEach(() => act(() => hideToast()));

  it('Folgetermin +7 Tage genau einmal, erst wenn der Termin begonnen hat (F1, AC-2)', () => {
    const started = entry('w1', LENA.id, at(17), at(19), { repeatWeekly: true, beginnersWelcome: true });
    const notYet = entry('w2', LENA.id, at(19, 0, 1), at(21, 0, 1), { repeatWeekly: true });
    const due = dueWeeklyFollowUps([started, notYet], LENA.id, NOW);
    expect(due).toHaveLength(1);
    expect(due[0].startsAt).toBe(plusOneWeek(started.startsAt));
    expect(new Date(due[0].startsAt).getDate()).toBe(23);
    expect(due[0].beginnersWelcome).toBe(true);
    expect(due[0].repeatWeekly).toBe(true);
    // Zweiter Durchlauf mit dem neuen Termin: nichts mehr
    expect(dueWeeklyFollowUps([started, notYet, ...due], LENA.id, NOW)).toHaveLength(0);
    // Fremde Serien legt man nicht an
    expect(dueWeeklyFollowUps([started], 'jemand-anders', NOW)).toHaveLength(0);
  });

  it('ensureWeeklyFollowUps legt lokal an und doppelt nicht; «Wiederholung beenden» stoppt (AC-2/AC-3)', async () => {
    await consent(LENA.id);
    const first = entry('w1', LENA.id, at(17), at(19), { repeatWeekly: true });
    localStorage.setItem(TREFF_STORE_KEY, JSON.stringify({ entries: [first], blocks: [], reports: [], banned: [] }));
    expect(await ensureWeeklyFollowUps(LENA.id, [], NOW)).toBe(1);
    expect(await ensureWeeklyFollowUps(LENA.id, [], NOW)).toBe(0);
    expect(storedEntries()).toHaveLength(2);

    expect(await stopTreffRepeat(LENA.id, 'w1')).toBe(true);
    expect(storedEntries().every(e => !e.repeatWeekly)).toBe(true);
    // Der nächste Termin bleibt bestehen
    expect(storedEntries()).toHaveLength(2);
    // Fremde Einträge kann man nicht beenden
    expect(await stopTreffRepeat('jemand', 'w1')).toBe(false);
  });

  it('Grenze 5 offene persönliche Einträge, Hallen-Termine zählen nicht (F2, AC-4)', async () => {
    expect(TREFF_MAX_OPEN_ENTRIES).toBe(5);
    const list = [
      entry('a', LENA.id, at(18), at(20)),
      entry('b', LENA.id, at(18, 0, 1), at(20, 0, 1), { isGymEvent: true }),
    ];
    expect(countOpenEntries(list, LENA.id, NOW)).toBe(1);

    await consent(ADMIN.id);
    const base = { gymId: GYM, from: '18:00', to: '20:00' };
    for (let i = 0; i < 5; i++) {
      expect((await createTreffEntry(ADMIN, { ...base, day: `2026-10-${17 + i}` }, NOW)).ok).toBe(true);
    }
    expect(await createTreffEntry(ADMIN, { ...base, day: '2026-10-25' }, NOW)).toEqual({ ok: false, error: 'limit' });
    const gymEvent = await createTreffEntry(ADMIN, { ...base, day: '2026-10-25', isGymEvent: true, note: 'Technik-Abend' }, NOW);
    expect(gymEvent.ok).toBe(true);
  });

  it('Hallen-Termin nur für Admins der Halle (F4, AC-6)', async () => {
    expect(canCreateGymEvent(GYM, ADMIN.id)).toBe(true);
    expect(canCreateGymEvent(GYM, LENA.id)).toBe(false);
    expect(canCreateGymEvent(GYM, 'guest')).toBe(false);
    await consent(LENA.id);
    const res = await createTreffEntry(LENA, { gymId: GYM, day: '2026-10-17', from: '18:00', to: '20:00', isGymEvent: true }, NOW);
    expect(res).toEqual({ ok: false, error: 'not_gym_admin' });
  });

  it('Markierungen als Chips mit Wort, Hallen-Termine oben, Hallenname statt Spitzname (F3/F4, AC-5)', () => {
    expect(treffMarkers({ beginnersWelcome: true, withKids: true }).map(c => c.label)).toEqual(['🌱 Anfänger willkommen', '👧 Mit Kind']);
    const person = entry('p', LENA.id, at(18), at(20));
    const event = entry('e', ADMIN.id, at(19), at(21), { isGymEvent: true });
    const { later } = splitTreffEntries([person, event], NOW);
    expect(later.map(e => e.id)).toEqual(['e', 'p']);
    expect(treffDisplayName(event)).toBe(gymStorage.getGyms().find(g => g.id === GYM)!.name);
    expect(treffDisplayName(person)).toBe(LENA.id);
  });

  it('Gast-Ansicht: Markierungen ja, Notiz nur bei Hallen-Terminen (F6)', () => {
    const person = entry('p', LENA.id, at(18), at(20), { note: 'privat', withKids: true });
    const event = entry('e', ADMIN.id, at(19), at(21), { isGymEvent: true, note: 'Technik-Abend' });
    expect(toPublicEntry(person)).toMatchObject({ withKids: true });
    expect(toPublicEntry(person).note).toBeUndefined();
    expect(toPublicEntry(event)).toMatchObject({ isGymEvent: true, note: 'Technik-Abend' });
  });

  it('Formular: Häkchen für alle, «Als Termin der Halle» nur für Admins (AC-1)', async () => {
    const gyms = gymStorage.getGyms() as any;
    await consent(LENA.id);
    const lena: CurrentUser = { id: LENA.id, nickname: LENA.nickname, role: 'member', isPlatformAdmin: false };
    const { unmount } = render(<TreffView currentUser={lena} activeGymId={GYM} gyms={gyms} />);
    fireEvent.click(await screen.findByTestId('treff-new'));
    expect(screen.getByTestId('treff-form-weekly')).toBeInTheDocument();
    expect(screen.getByTestId('treff-form-beginners')).toBeInTheDocument();
    expect(screen.getByTestId('treff-form-kids')).toBeInTheDocument();
    expect(screen.queryByTestId('treff-form-gym-event')).not.toBeInTheDocument();
    unmount();

    await consent(ADMIN.id);
    const admin: CurrentUser = { id: ADMIN.id, nickname: ADMIN.nickname, role: 'admin', isPlatformAdmin: false };
    render(<TreffView currentUser={admin} activeGymId={GYM} gyms={gyms} />);
    fireEvent.click(await screen.findByTestId('treff-new'));
    expect(screen.getByTestId('treff-form-gym-event')).toBeInTheDocument();
  });

  it('Eintragen mit «Jede Woche» und «Anfänger willkommen» zeigt Chips und «Wiederholung beenden»', async () => {
    const gyms = gymStorage.getGyms() as any;
    await consent(LENA.id);
    const lena: CurrentUser = { id: LENA.id, nickname: LENA.nickname, role: 'member', isPlatformAdmin: false };
    render(
      <>
        <ToastHost />
        <TreffView currentUser={lena} activeGymId={GYM} gyms={gyms} />
      </>
    );
    fireEvent.click(await screen.findByTestId('treff-new'));
    const days = screen.getByTestId('treff-form-days').querySelectorAll('button');
    fireEvent.click(days[1]); // morgen
    fireEvent.click(screen.getByTestId('treff-form-weekly'));
    fireEvent.click(screen.getByTestId('treff-form-beginners'));
    fireEvent.click(screen.getByTestId('treff-form-submit'));
    const mine = await screen.findByTestId('treff-mine');
    expect(mine).toHaveTextContent('Anfänger willkommen');
    expect(mine).toHaveTextContent('Jede Woche');
    const stored = storedEntries();
    expect(stored[0]).toMatchObject({ repeatWeekly: true, beginnersWelcome: true });
    fireEvent.click(screen.getByTestId(`treff-stop-repeat-${stored[0].id}`));
    await waitFor(() => expect(storedEntries()[0].repeatWeekly).toBe(false));
  });

  it('Fremder Hallen-Termin: Hallenname und Abzeichen «Halle» in der Liste (AC-5)', async () => {
    const gyms = gymStorage.getGyms() as any;
    const ev = entry('ev', ADMIN.id, new Date(Date.now() + 3600e3), new Date(Date.now() + 3 * 3600e3), {
      isGymEvent: true,
      note: 'Technik-Abend',
      beginnersWelcome: true,
    });
    localStorage.setItem(TREFF_STORE_KEY, JSON.stringify({ entries: [ev], blocks: [], reports: [], banned: [] }));
    const lena: CurrentUser = { id: LENA.id, nickname: LENA.nickname, role: 'member', isPlatformAdmin: false };
    render(<TreffView currentUser={lena} activeGymId={GYM} gyms={gyms} />);
    const row = await screen.findByTestId('treff-row-ev');
    expect(row).toHaveTextContent(gyms.find((g: any) => g.id === GYM)!.name);
    expect(row).toHaveTextContent('Halle');
    expect(row).toHaveTextContent('Anfänger willkommen');
    expect(row).not.toHaveTextContent('Hallen-Admin');
    expect((await loadTreffEntries(LENA.id)).entries).toHaveLength(1);
  });
});
