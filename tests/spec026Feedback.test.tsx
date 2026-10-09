import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * SPEC-026 · Nutzer-Feedback: Service (Prüfung, Zeile, Warteschlange, Ratenbremse),
 * FeedbackSheet und Einstieg in «Ich» → Einstellungen.
 */

const upsert = vi.fn();
vi.mock('../src/lib/supabase', () => ({
  supabase: { from: vi.fn(() => ({ upsert })) },
  isSupabaseConfigured: true,
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key-test-anon-key',
  uploadSectorPhoto: vi.fn(),
}));

import { supabase } from '../src/lib/supabase';
import {
  validateFeedbackMessage,
  buildFeedbackRow,
  submitFeedback,
  flushFeedbackQueue,
  getFeedbackQueue,
  isFeedbackRateLimited,
  FEEDBACK_QUEUE_KEY,
  FEEDBACK_SENT_LOG_KEY,
} from '../src/lib/feedbackService';
import { FeedbackSheet } from '../src/components/FeedbackSheet';
import { MeView } from '../src/components/MeView';
import { AppHeader, AppHeaderProps } from '../src/components/AppHeader';
import { CurrentUser } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

beforeEach(() => {
  localStorage.removeItem(FEEDBACK_QUEUE_KEY);
  localStorage.removeItem(FEEDBACK_SENT_LOG_KEY);
  upsert.mockReset();
  upsert.mockResolvedValue({ error: null });
  vi.mocked(supabase!.from).mockClear();
});

describe('SPEC-026 feedbackService', () => {
  it('prüft die Textlänge (F5): mind. 5, max. 2000 Zeichen, Rand-Leerzeichen zählen nicht', () => {
    expect(validateFeedbackMessage('')).toBe('too_short');
    expect(validateFeedbackMessage('   abc   ')).toBe('too_short');
    expect(validateFeedbackMessage('Super')).toBe('ok');
    expect(validateFeedbackMessage('x'.repeat(2000))).toBe('ok');
    expect(validateFeedbackMessage('x'.repeat(2001))).toBe('too_long');
  });

  it('baut die Zeile mit Kontext (F7); E-Mail nur mit Häkchen (F8)', () => {
    const now = new Date('2026-10-08T20:00:00.000Z');
    const base = { category: 'bug' as const, message: '  Pin springt  ', userId: 'hans-kletterer', nickname: 'Hans', email: 'hans@kletterer.ch', gymId: 'gym-6a-plus', gymName: '6a plus' };
    const row = buildFeedbackRow({ ...base, contactOk: false }, now);
    expect(row.id).toMatch(UUID_RE);
    expect(row.created_at).toBe('2026-10-08T20:00:00.000Z');
    expect(row.user_id).toMatch(UUID_RE);
    expect(row.message).toBe('Pin springt');
    expect(row.email).toBeNull();
    expect(row.contact_ok).toBe(false);
    expect(row).toMatchObject({ category: 'bug', gym_id: 'gym-6a-plus', gym_name: '6a plus', app_view: 'settings', status: 'neu', nickname: 'Hans' });
    expect(row.screen).toMatch(/^\d+×\d+$/);
    expect(row.user_agent).toBeTruthy();

    const withContact = buildFeedbackRow({ ...base, contactOk: true }, now);
    expect(withContact.email).toBe('hans@kletterer.ch');
    expect(withContact.contact_ok).toBe(true);
  });

  it('sendet an app_feedback duplikatfrei (ignoreDuplicates)', async () => {
    const res = await submitFeedback({ category: 'idea', message: 'Dunkelmodus bitte', contactOk: false });
    expect(res).toBe('sent');
    expect(supabase!.from).toHaveBeenCalledWith('app_feedback');
    const [rows, opts] = upsert.mock.calls[0];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: 'idea', message: 'Dunkelmodus bitte' });
    expect(opts).toEqual({ onConflict: 'id', ignoreDuplicates: true });
    expect(getFeedbackQueue()).toHaveLength(0);
  });

  it('legt die Meldung bei Fehler in die Warteschlange und sendet sie später genau einmal nach (F11)', async () => {
    upsert.mockResolvedValueOnce({ error: { message: 'offline' } });
    const res = await submitFeedback({ category: 'bug', message: 'Foto lädt nicht', contactOk: false });
    expect(res).toBe('queued');
    const queued = getFeedbackQueue();
    expect(queued).toHaveLength(1);

    const sent = await flushFeedbackQueue();
    expect(sent).toBe(1);
    expect(upsert.mock.calls[1][0][0].id).toBe(queued[0].id);
    expect(getFeedbackQueue()).toHaveLength(0);

    expect(await flushFeedbackQueue()).toBe(0);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('behält die Warteschlange, wenn auch das Nachsenden scheitert', async () => {
    upsert.mockResolvedValue({ error: { message: 'offline' } });
    await submitFeedback({ category: 'bug', message: 'Foto lädt nicht', contactOk: false });
    expect(await flushFeedbackQueue()).toBe(0);
    expect(getFeedbackQueue()).toHaveLength(1);
  });

  it('bremst nach 5 Meldungen pro Stunde (F12)', async () => {
    for (let i = 0; i < 5; i++) {
      expect(await submitFeedback({ category: 'praise', message: `Toll Nr. ${i}`, contactOk: false })).toBe('sent');
    }
    expect(isFeedbackRateLimited()).toBe(true);
    expect(await submitFeedback({ category: 'praise', message: 'Noch eins', contactOk: false })).toBe('rate_limited');
    expect(isFeedbackRateLimited(Date.now() + 61 * 60 * 1000)).toBe(false);
  });

  it('lehnt ungültigen Text ab, ohne zu senden', async () => {
    expect(await submitFeedback({ category: 'bug', message: 'kurz', contactOk: false })).toBe('invalid');
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('SPEC-026 FeedbackSheet', () => {
  const renderSheet = () =>
    render(<FeedbackSheet open onClose={() => {}} userId="hans-kletterer" nickname="Hans" email="hans@kletterer.ch" gymId="gym-6a-plus" gymName="6a plus" />);

  it('zeigt drei Kacheln ohne Vorauswahl; Absenden erst bei gültiger Eingabe (AC-2, AC-4)', () => {
    renderSheet();
    for (const id of ['bug', 'idea', 'praise']) {
      expect(screen.getByTestId(`feedback-category-${id}`)).toHaveAttribute('aria-checked', 'false');
    }
    const submit = screen.getByTestId('feedback-submit');
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Die Karte ist super' } });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByTestId('feedback-category-praise'));
    expect(screen.getByTestId('feedback-category-praise')).toHaveAttribute('aria-checked', 'true');
    expect(submit).toBeEnabled();

    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'abc' } });
    expect(submit).toBeDisabled();
  });

  it('Platzhalter passt zur Art, Zähler, Hinweis und Häkchen aus (AC-3, AC-5, AC-6)', () => {
    renderSheet();
    const text = screen.getByTestId('feedback-message');
    fireEvent.click(screen.getByTestId('feedback-category-bug'));
    expect(text).toHaveAttribute('placeholder', 'Was ist passiert? Was hast du davor gemacht?');
    fireEvent.click(screen.getByTestId('feedback-category-idea'));
    expect(text).toHaveAttribute('placeholder', 'Was wünschst du dir?');
    expect(text).toHaveAttribute('maxLength', '2000');
    fireEvent.change(text, { target: { value: 'Hallo' } });
    expect(screen.getByTestId('feedback-counter')).toHaveTextContent('5 / 2000');
    expect(screen.getByTestId('feedback-context-note')).toHaveTextContent('Mitgeschickt werden: Halle, Gerät und dein Kletter-Name.');
    expect(screen.getByTestId('feedback-contact')).not.toBeChecked();
  });

  it('zeigt nach dem Senden «Danke» und schickt die E-Mail nur mit Häkchen (AC-7, AC-8)', async () => {
    renderSheet();
    fireEvent.click(screen.getByTestId('feedback-category-idea'));
    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: '  Bitte Timer für Pausen  ' } });
    fireEvent.click(screen.getByTestId('feedback-contact'));
    fireEvent.click(screen.getByTestId('feedback-submit'));

    await waitFor(() => expect(screen.getByTestId('feedback-thanks')).toBeInTheDocument());
    expect(screen.getByTestId('feedback-thanks-text')).toHaveTextContent('Dein Feedback ist angekommen.');
    const row = upsert.mock.calls[0][0][0];
    expect(row).toMatchObject({ category: 'idea', message: 'Bitte Timer für Pausen', email: 'hans@kletterer.ch', contact_ok: true, gym_name: '6a plus' });
  });

  it('zeigt bei Fehler «sobald du wieder Netz hast» (AC-9)', async () => {
    upsert.mockResolvedValueOnce({ error: { message: 'offline' } });
    renderSheet();
    fireEvent.click(screen.getByTestId('feedback-category-bug'));
    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Foto lädt nicht' } });
    fireEvent.click(screen.getByTestId('feedback-submit'));
    await waitFor(() => expect(screen.getByTestId('feedback-thanks-text')).toHaveTextContent('Wir senden es, sobald du wieder Netz hast.'));
    expect(getFeedbackQueue()).toHaveLength(1);
  });

  it('sperrt Absenden und erklärt warum, wenn die Ratenbremse greift (AC-10)', () => {
    const now = Date.now();
    localStorage.setItem(FEEDBACK_SENT_LOG_KEY, JSON.stringify([now, now, now, now, now]));
    renderSheet();
    fireEvent.click(screen.getByTestId('feedback-category-bug'));
    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Noch ein Fehler' } });
    expect(screen.getByTestId('feedback-rate-limit')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-submit')).toBeDisabled();
  });
});

describe('SPEC-026 Einstieg in den Einstellungen', () => {
  const climber: CurrentUser = { id: 'spec026-climber', nickname: 'Feedbacker', role: 'member', isPlatformAdmin: false };
  const climberRole = {
    isClimber: true,
    isSetter: false,
    isAdmin: false,
    canAccessSetterStudio: false,
    canAccessAdminConsole: false,
  } as unknown as UserRoleInfo;

  it('«Ich» → Einstellungen → «Feedback geben» öffnet das Sheet (AC-1)', () => {
    render(<MeView currentUser={climber} activeGymId="gym-6a-plus" roleInfo={climberRole} onSwitchMode={() => {}} onLogout={() => {}} />);
    fireEvent.click(screen.getByTestId('open-settings-btn'));
    expect(screen.getByText('Hilfe')).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-sheet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-feedback'));
    expect(screen.getByTestId('feedback-sheet')).toBeInTheDocument();
  });

  const headerProps = (isLoggedIn: boolean): AppHeaderProps => ({
    appMode: 'climber' as AppHeaderProps['appMode'],
    gyms: [{ id: 'gym-6a-plus', name: '6a plus' } as AppHeaderProps['gyms'][number]],
    activeGymId: 'gym-6a-plus',
    onSelectGym: () => {},
    currentUser: { id: climber.id, nickname: climber.nickname, role: 'member', isPlatformAdmin: false },
    climberId: climber.id,
    selectableClimbers: [],
    onSelectClimber: () => {},
    activeTab: 'wall',
    onSelectTab: () => {},
    roleInfo: climberRole,
    isLoggedIn,
    onOpenRoleGateway: () => {},
    onOpenLoginModal: () => {},
    onSwitchToClimber: () => {},
  });

  it('Kletterer-Header zeigt angemeldet den Knopf «Feedback», der das Sheet öffnet (F16, AC-13)', async () => {
    render(<AppHeader {...headerProps(true)} />);
    const btn = screen.getByTestId('header-feedback-btn');
    expect(btn).toHaveTextContent('Feedback');
    fireEvent.click(btn);
    expect(screen.getByTestId('feedback-sheet')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('feedback-category-praise'));
    fireEvent.change(screen.getByTestId('feedback-message'), { target: { value: 'Gefällt mir sehr' } });
    fireEvent.click(screen.getByTestId('feedback-submit'));
    await waitFor(() => expect(screen.getByTestId('feedback-thanks')).toBeInTheDocument());
    expect(upsert.mock.calls[0][0][0]).toMatchObject({ app_view: 'header', gym_name: '6a plus', nickname: 'Feedbacker' });
  });

  it('Gäste sehen den Feedback-Knopf im Header nicht (F3)', () => {
    render(<AppHeader {...headerProps(false)} />);
    expect(screen.queryByTestId('header-feedback-btn')).not.toBeInTheDocument();
  });
});
