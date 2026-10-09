import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { App } from '../src/App';
import { setSessionUser, signOut } from '../src/lib/authService';
import { navigationHistory } from '../src/lib/navigationHistory';
import * as gymStorage from '../src/lib/gymStorage';
import { MobileBottomNav } from '../src/components/MobileBottomNav';
import { TreffSettingsGroup } from '../src/components/treff/TreffSettingsGroup';
import { GymTreffToggle } from '../src/components/treff/GymTreffToggle';
import { hideToast } from '../src/components/ui/Toast';
import { getWallBoulders, getSectors } from '../src/lib/batchBoulderService';
import {
  TreffEntry,
  TREFF_STORE_KEY,
  getTreffSettings,
  saveTreffSettings,
  reportTreffEntry,
  isTreffEnabledForGym,
} from '../src/lib/treffService';

const GYM = 'gym-6a-plus';

function inHours(h: number): string {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}

function foreignEntry(over: Partial<TreffEntry> = {}): TreffEntry {
  return {
    id: 'fremd-1',
    userId: 'treff-mia',
    gymId: GYM,
    startsAt: inHours(-0.5),
    endsAt: inHours(2),
    nickname: 'Mia',
    gradeMin: '6a',
    gradeMax: '6b',
    note: 'Bin am Überhang, siehe https://example.com',
    createdAt: inHours(-1),
    ...over,
  };
}

function seedStore(entries: TreffEntry[]) {
  localStorage.setItem(TREFF_STORE_KEY, JSON.stringify({ entries, blocks: [], reports: [], banned: [] }));
}

async function openTreffTab() {
  fireEvent.click(screen.getByTestId('mobile-tab-treff'));
  return screen.findByTestId('treff-view');
}

describe('SPEC-028 Treff – Oberfläche', () => {
  beforeEach(() => {
    localStorage.clear();
    gymStorage.resetAllGymData();
    gymStorage.ensureInitialGymData();
    navigationHistory.reset();
    signOut();
  });

  afterEach(() => {
    act(() => hideToast());
  });

  it('AC-1: dritter Tab «Treff» rechts, Start auf der Wand, keine Zahl am Tab', () => {
    setSessionUser('hans-kletterer');
    render(<App />);
    const nav = screen.getByTestId('mobile-bottom-nav');
    const labels = within(nav).getAllByRole('button').map(b => b.textContent);
    expect(labels).toEqual(['Wand', 'Ich', 'Treff']);
    expect(screen.getByTestId('mobile-tab-wall')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mobile-tab-treff').textContent).toBe('Treff');
    expect(screen.getByTestId('tab-treff')).toBeInTheDocument();
  });

  it('MobileBottomNav ohne showTreff bleibt bei zwei Tabs', () => {
    render(<MobileBottomNav activeTab="wall" onSelectTab={() => {}} />);
    expect(screen.queryByTestId('mobile-tab-treff')).toBeNull();
  });

  it('AC-2/AC-3/AC-4: Hinweis + Häkchen, dann «Ich bin jetzt da» → «Meine Einträge»', async () => {
    setSessionUser('hans-kletterer');
    render(<App />);
    await openTreffTab();
    expect(screen.getByText('Wer ist da?')).toBeInTheDocument();
    expect(await screen.findByTestId('treff-section-now')).toHaveTextContent('Noch niemand eingetragen.');

    fireEvent.click(screen.getByTestId('treff-now'));
    expect(screen.getByTestId('treff-consent')).toBeInTheDocument();
    expect(screen.getByTestId('treff-consent-ok')).toBeDisabled();
    fireEvent.click(screen.getByTestId('treff-consent-age'));
    fireEvent.click(screen.getByTestId('treff-consent-ok'));

    const mine = await screen.findByTestId('treff-mine');
    expect(mine).toHaveTextContent('Heute');
    expect(getTreffSettings('hans-kletterer').ageConfirmed).toBe(true);
  });

  it('AC-4: Formular – «bis» vor «von» zeigt eine Meldung, gültig trägt ein', async () => {
    await saveTreffSettings({ userId: 'hans-kletterer', consentAt: new Date().toISOString(), ageConfirmed: true });
    setSessionUser('hans-kletterer');
    render(<App />);
    await openTreffTab();
    fireEvent.click(screen.getByTestId('treff-new'));
    expect(screen.getByTestId('treff-form')).toBeInTheDocument();

    const days = within(screen.getByTestId('treff-form-days')).getAllByRole('button');
    expect(days).toHaveLength(15);
    fireEvent.click(days[1]); // Morgen
    fireEvent.change(screen.getByTestId('treff-form-from'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByTestId('treff-form-to'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByTestId('treff-form-submit'));
    expect(await screen.findByTestId('treff-form-error')).toHaveTextContent('«Bis» muss nach «Von» liegen.');

    fireEvent.change(screen.getByTestId('treff-form-to'), { target: { value: '21:30' } });
    fireEvent.change(screen.getByTestId('treff-form-note'), { target: { value: 'Lust auf Beta-Tausch' } });
    fireEvent.click(screen.getByTestId('treff-form-submit'));
    const mine = await screen.findByTestId('treff-mine');
    expect(mine).toHaveTextContent('Morgen');
    expect(mine).toHaveTextContent('19–21:30 Uhr');
  });

  it('AC-6/AC-7: fremder Eintrag → Sheet mit Boulder, Satz als Text, «Ich komme auch»', async () => {
    const sector = getSectors(GYM)[0];
    const boulder = getWallBoulders().find(b => b.sectorId === sector?.id && b.status === 'active');
    seedStore([foreignEntry({ boulderRef: boulder?.id })]);
    await saveTreffSettings({ userId: 'hans-kletterer', consentAt: new Date().toISOString(), ageConfirmed: true });
    setSessionUser('hans-kletterer');
    render(<App />);
    await openTreffTab();

    const row = await screen.findByTestId('treff-row-fremd-1');
    expect(within(screen.getByTestId('treff-section-now')).getByText('Mia')).toBeInTheDocument();
    expect(row).toHaveTextContent('6A–6B');
    fireEvent.click(row);

    const sheet = screen.getByTestId('treff-entry-sheet');
    expect(within(sheet).getByTestId('treff-entry-note').querySelector('a')).toBeNull();
    if (boulder) {
      fireEvent.click(within(sheet).getByTestId('treff-entry-boulder'));
      expect(await screen.findByTestId('boulder-sheet')).toBeInTheDocument();
    }

    fireEvent.click(within(sheet).getByTestId('treff-join'));
    await waitFor(() => expect(screen.queryByTestId('treff-entry-sheet')).toBeNull());
    expect(await screen.findByTestId('treff-mine')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('treff-row-fremd-1'));
    expect(screen.getByTestId('treff-entry-companions')).toHaveTextContent('Auch da: Du');
  });

  it('AC-8/AC-9: Ausblenden und Melden', async () => {
    seedStore([foreignEntry()]);
    setSessionUser('hans-kletterer');
    render(<App />);
    await openTreffTab();

    fireEvent.click(await screen.findByTestId('treff-row-fremd-1'));
    fireEvent.click(screen.getByTestId('treff-report'));
    fireEvent.click(screen.getByTestId('treff-report-spam'));
    await waitFor(() => expect(screen.queryByTestId('treff-report-sheet')).toBeNull());
    const store = JSON.parse(localStorage.getItem(TREFF_STORE_KEY) || '{}');
    expect(store.reports).toHaveLength(1);
    expect(store.reports[0].snapshot).toContain('Mia');
    expect(screen.queryByTestId('treff-entry-sheet')).toBeNull();

    fireEvent.click(screen.getByTestId('treff-row-fremd-1'));
    fireEvent.click(screen.getByTestId('treff-block'));
    fireEvent.click(screen.getByTestId('confirm-ok'));
    await waitFor(() => expect(screen.queryByTestId('treff-row-fremd-1')).toBeNull());
  });

  it('AC-12: Halle ohne Treff zeigt einen Satz statt der Knöpfe', async () => {
    setSessionUser('hans-kletterer');
    gymStorage.saveGyms(gymStorage.getGyms().map(g => (g.id === GYM ? { ...g, treff_enabled: false } : g)));
    render(<App />);
    await openTreffTab();
    expect(screen.getByTestId('treff-gym-disabled')).toHaveTextContent('nutzt Treff nicht');
    expect(screen.queryByTestId('treff-now')).toBeNull();
  });

  it('AC-11: Einstellungen – Treff ausblenden entfernt den Tab, einblenden bringt ihn zurück', async () => {
    setSessionUser('hans-kletterer');
    render(<App />);
    fireEvent.click(screen.getByTestId('mobile-tab-stats'));
    fireEvent.click(screen.getByTestId('open-settings-btn'));
    fireEvent.click(screen.getByTestId('settings-treff-hide'));
    await waitFor(() => expect(screen.queryByTestId('mobile-tab-treff')).toBeNull());
    expect(screen.getByTestId('settings-treff-hide')).toHaveTextContent('Treff einblenden');
    fireEvent.click(screen.getByTestId('settings-treff-hide'));
    expect(await screen.findByTestId('mobile-tab-treff')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('settings-treff-show-grade'));
    await waitFor(() => expect(getTreffSettings('hans-kletterer').showGrade).toBe(false));
    expect(screen.queryByTestId('settings-treff-reports')).toBeNull();
  });

  it('AC-11: «Meine Einträge löschen» und ausgeblendete Personen wieder zeigen', async () => {
    seedStore([foreignEntry({ id: 'eigen', userId: 'hans-kletterer', nickname: 'Hans' })]);
    localStorage.setItem(
      TREFF_STORE_KEY,
      JSON.stringify({
        entries: [foreignEntry({ id: 'eigen', userId: 'hans-kletterer', nickname: 'Hans' })],
        blocks: [{ blockerId: 'hans-kletterer', blockedId: 'treff-mia', blockedNickname: 'Mia' }],
        reports: [],
        banned: [],
      })
    );
    render(<TreffSettingsGroup userId="hans-kletterer" isPlatformAdmin={false} />);
    expect(await screen.findByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-treff-blocks'));
    fireEvent.click(await screen.findByTestId('treff-unblock-treff-mia'));
    await waitFor(() => expect(screen.queryByTestId('treff-block-treff-mia')).toBeNull());

    fireEvent.click(screen.getByTestId('settings-treff-delete'));
    fireEvent.click(screen.getByTestId('confirm-ok'));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(TREFF_STORE_KEY) || '{}').entries).toHaveLength(0));
  });

  it('AC-9: Plattform-Admin prüft Meldungen und löscht den Eintrag', async () => {
    seedStore([foreignEntry()]);
    await reportTreffEntry('hans-kletterer', foreignEntry(), 'belaestigung');
    render(<TreffSettingsGroup userId="user-boris" isPlatformAdmin />);
    fireEvent.click(screen.getByTestId('settings-treff-reports'));
    const sheet = await screen.findByTestId('treff-reports-sheet');
    expect(await within(sheet).findByText(/Belästigung/)).toBeInTheDocument();
    const del = sheet.querySelector('[data-testid^="treff-report-delete-"]') as HTMLElement;
    fireEvent.click(del);
    expect(await within(sheet).findByText('Keine offenen Meldungen.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(TREFF_STORE_KEY) || '{}').entries).toHaveLength(0);
  });

  it('AC-10: Gäste sehen auf der Landing Page Einträge ohne Namen und den Anmelde-Knopf', async () => {
    seedStore([foreignEntry()]);
    render(<App />);
    fireEvent.click(screen.getByTestId('landing-show-treff'));
    const sheet = await screen.findByTestId('treff-guest-sheet');
    expect(await within(sheet).findByTestId('treff-guest-row-fremd-1')).toHaveTextContent('Jemand');
    expect(sheet).not.toHaveTextContent('Mia');
    expect(sheet).not.toHaveTextContent('Überhang');
    fireEvent.click(within(sheet).getByTestId('treff-login-cta'));
    await waitFor(() => expect(screen.queryByTestId('treff-guest-sheet')).toBeNull());
  });

  it('AC-12: Admin-Schalter «Treff in dieser Halle erlauben»', () => {
    render(<GymTreffToggle gymId={GYM} userId="admin-6aplus" />);
    const toggle = screen.getByTestId('gym-treff-toggle');
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(isTreffEnabledForGym(GYM)).toBe(false);
  });

  it('AC-12: Kletterer dürfen den Hallen-Schalter nicht umlegen', () => {
    render(<GymTreffToggle gymId={GYM} userId="hans-kletterer" />);
    fireEvent.click(screen.getByTestId('gym-treff-toggle'));
    expect(isTreffEnabledForGym(GYM)).toBe(true);
  });

  it('AC-13 / F13: user_profiles wird nur mit ausdrücklichen Spalten gelesen (kein email, kein *)', () => {
    for (const file of ['src/lib/syncService.ts', 'src/lib/authService.ts']) {
      const src = readFileSync(resolve(__dirname, '..', file), 'utf-8');
      const blocks = src.split(".from('user_profiles')").slice(1).map(s => s.slice(0, 300));
      for (const b of blocks) {
        const sel = b.match(/\.select\('([^']*)'\)/);
        if (!sel) continue;
        expect(sel[1]).not.toBe('*');
        expect(sel[1]).not.toContain('email');
      }
    }
  });
});
