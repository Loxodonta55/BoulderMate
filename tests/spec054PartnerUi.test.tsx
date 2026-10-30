import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Leaflet braucht echtes Layout; im Unit-Test ersetzen wir die Karte durch klickbare Pins (wie SPEC-053)
vi.mock('../src/components/GymMap', () => ({
  GymMap: ({ points, onSelect, testId = 'gym-finder-map' }: any) => (
    <div data-testid={testId}>
      {points.filter((p: any) => typeof p.lat === 'number').map((p: any) => (
        <button key={p.id} data-testid={`gym-pin-${p.id}`} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

import { GymFinderSheet } from '../src/components/GymFinderSheet';
import { FuerHallenPage } from '../src/components/hallen/FuerHallenPage';
import { PartnerPage } from '../src/components/partner/PartnerPage';
import { PartnerSection } from '../src/components/partner/PartnerSection';
import { VertriebSettingsGroup } from '../src/components/partner/VertriebSettingsGroup';
import { GymFinderEntry } from '../src/lib/gymFinder';
import { LOCAL_VERZEICHNIS_SEED } from '../src/lib/hallenVerzeichnis';
import { becomePartner, betreueHalle } from '../src/lib/vertriebspartner';
import { clearMemoryStore } from '../src/lib/storageUtils';

/** SPEC-054 · Vertriebspartner – Seite «Partner werden», «Ich» → Partner, Hallen-Blatt, Kit, Admin */

const ACTIVE: GymFinderEntry[] = [
  { id: 'gym-6a-plus', name: '6a plus Zürich', city: 'Zürich', lat: 47.39, lng: 8.51, activeBoulders: 12, newBoulders: 0 },
];
const WINTERTHUR = LOCAL_VERZEICHNIS_SEED.find(s => s.id === 'vz-demo-winterthur')!;

function renderFinder(userId: string) {
  return render(<GymFinderSheet open onClose={vi.fn()} entries={ACTIVE} activeGymId="gym-6a-plus" onSelectGym={vi.fn()} userId={userId} />);
}

beforeEach(() => {
  localStorage.clear();
  clearMemoryStore();
});

describe('SPEC-054 · Seite «Partner werden» (AC-1)', () => {
  it('zeigt Eine Stufe, Provision mit Rechenbeispiel, Selbständig; Knopf je nach Anmeldung', () => {
    const onBecome = vi.fn();
    const { rerender } = render(<PartnerPage isLoggedIn={false} onClose={vi.fn()} onDemo={vi.fn()} onBecomePartner={onBecome} />);
    expect(screen.getByTestId('partner-page-eine-stufe')).toHaveTextContent('kein Schneeballsystem');
    const prov = screen.getByTestId('partner-page-provision');
    expect(prov).toHaveTextContent('30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt');
    expect(prov).toHaveTextContent('Ab deiner 3. Halle 40 %');
    expect(screen.getByTestId('partner-page-beispiel')).toHaveTextContent('Rechenbeispiel: Zahlt eine Halle im ersten Jahr CHF 1’000, bekommst du CHF 300 (ab der 3. Halle CHF 400).');
    expect(screen.getByTestId('partner-page-selbstaendig')).toHaveTextContent('Keine Rechts- oder Steuerberatung.');
    expect(screen.getByTestId('partner-page-become')).toHaveTextContent('Anmelden und Partner werden');
    rerender(<PartnerPage isLoggedIn onClose={vi.fn()} onDemo={vi.fn()} onBecomePartner={onBecome} />);
    fireEvent.click(screen.getByTestId('partner-page-become'));
    expect(onBecome).toHaveBeenCalled();
    expect(screen.getByTestId('partner-page-become')).toHaveTextContent('Partner werden');
  });
});

describe('SPEC-054 · «Ich» → Partner (AC-3, AC-7, AC-10)', () => {
  it('Formular: Knopf erst mit Rolle, Region und Haken; danach Partner-Bereich mit Zahlen', async () => {
    render(<PartnerSection userId="user-p" onOpenFinder={vi.fn()} onOpenPartnerPage={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('partner-open-form'));
    const join = screen.getByTestId('partner-join');
    expect(join).toBeDisabled();
    expect(screen.getByTestId('partner-privacy')).toHaveTextContent('Sieht nur das BoulderMate-Team');
    fireEvent.click(screen.getByTestId('partner-rolle-trainer'));
    fireEvent.change(screen.getByTestId('partner-region'), { target: { value: 'Winterthur' } });
    expect(join).toBeDisabled();
    fireEvent.click(screen.getByTestId('partner-adult'));
    expect(join).not.toBeDisabled();
    fireEvent.click(join);

    await screen.findByTestId('partner-dashboard');
    expect(screen.getByTestId('partner-code')).toHaveTextContent(/^BM-/);
    expect(screen.getByTestId('partner-satz')).toHaveTextContent('30 %');
    expect(screen.getByTestId('partner-offen')).toHaveTextContent('CHF 0');
    expect(screen.getByTestId('partner-empty')).toHaveTextContent('Schritt 1: Halle auf der Karte suchen und übernehmen.');
    expect(within(screen.getByTestId('partner-einwaende')).getAllByTestId(/^partner-einwand-/)).toHaveLength(7);
  });

  it('Meine Hallen: Status als Wort + Schritt, «Im Gespräch», Texte mit Offenlegung, Freigeben, Beenden', async () => {
    await becomePartner('user-p', { rolle: 'stammgast', region: 'Zürich' }, true);
    const res = await betreueHalle('user-p', WINTERTHUR);
    if (!res.ok) throw new Error('betreuen');
    const id = res.halle.id;
    render(<PartnerSection userId="user-p" onOpenFinder={vi.fn()} />);

    const status = await screen.findByTestId(`partner-halle-status-${id}`);
    expect(status).toHaveTextContent('Von dir betreut');
    expect(status).toHaveTextContent('Schritt 1 von 5');

    fireEvent.click(screen.getByTestId(`partner-halle-gespraech-${id}`));
    await waitFor(() => expect(screen.getByTestId(`partner-halle-status-${id}`)).toHaveTextContent('Im Gespräch'));
    expect(screen.getByTestId(`partner-halle-status-${id}`)).toHaveTextContent('Schritt 2 von 5');

    fireEvent.click(screen.getByTestId(`partner-halle-texte-${id}`));
    const kit = await screen.findByTestId('partner-kit-sheet');
    for (const part of ['partner-kit-email-text', 'partner-kit-nachricht-text', 'partner-kit-leitfaden-text']) {
      expect(within(kit).getByTestId(part)).toHaveTextContent('Ich bin BoulderMate-Partner und bekomme eine Provision');
    }
    expect(within(kit).getByTestId('partner-kit-email-text')).toHaveTextContent('halle=vz-demo-winterthur');
    expect(within(kit).getByTestId('partner-kit-email-text')).toHaveTextContent('ref=BM-');
    expect(within(kit).getByTestId('partner-kit-email-open')).toHaveAttribute('href', expect.stringMatching(/^mailto:info@example\.com/));
    fireEvent.click(within(kit).getByTestId('partner-kit-close'));

    fireEvent.click(screen.getByTestId(`partner-halle-freigeben-${id}`));
    fireEvent.click(await screen.findByTestId('confirm-ok'));
    await screen.findByTestId('partner-empty');

    fireEvent.click(screen.getByTestId('partner-leave'));
    fireEvent.click(await screen.findByTestId('confirm-ok'));
    await screen.findByTestId('partner-open-form');
  });
});

describe('SPEC-054 · Hallen-Blatt (AC-4)', () => {
  it('Partner: «Als Partner betreuen» → «Von dir betreut»; andere sehen «schon im Gespräch»', async () => {
    await becomePartner('user-p', { rolle: 'trainer', region: 'Zürich' }, true);
    const { unmount } = renderFinder('user-p');
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-winterthur'));
    fireEvent.click(await screen.findByTestId('gym-card-partner-take'));
    expect(await screen.findByTestId('gym-card-partner-mine')).toHaveTextContent('Von dir betreut bis');
    unmount();

    // Nicht-Partner sieht nur den Hinweis, keinen Knopf
    renderFinder('user-q');
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-winterthur'));
    expect(await screen.findByTestId('gym-card-partner-taken')).toHaveTextContent('Ein BoulderMate-Partner ist mit dieser Halle schon im Gespräch.');
    expect(screen.queryByTestId('gym-card-partner-take')).not.toBeInTheDocument();
  });

  it('Nicht-Partner sehen bei freien Hallen nichts Neues', async () => {
    renderFinder('user-q');
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-bern'));
    await screen.findByTestId('gym-card-wish');
    expect(screen.queryByTestId('gym-card-partner-take')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gym-card-partner-taken')).not.toBeInTheDocument();
  });
});

describe('SPEC-054 · «Für Hallen» ohne Halle (AC-8)', () => {
  it('?ref= ohne halle: «eure Halle», Partner-Satz, «Ich klettere – Halle suchen»', () => {
    const onFindGym = vi.fn();
    render(<FuerHallenPage halleId={null} refCode="BM-K7Q4AC" onClose={vi.fn()} onDemo={vi.fn()} onFindGym={onFindGym} />);
    expect(screen.getByTestId('fuer-hallen-name')).toHaveTextContent('BoulderMate für eure Halle');
    expect(screen.getByTestId('fuer-hallen-ref-note')).toHaveTextContent('BoulderMate-Partner');
    expect(screen.getByTestId('fuer-hallen-offerte')).toHaveTextContent('Offerte');
    fireEvent.click(screen.getByTestId('fuer-hallen-find-gym'));
    expect(onFindGym).toHaveBeenCalled();
  });
});

describe('SPEC-054 · Admin «Vertrieb» (AC-9)', () => {
  it('nur für Plattform-Admins; Umsatz und Satz ergeben die Provision', async () => {
    const { unmount } = render(<VertriebSettingsGroup userId="user-x" isPlatformAdmin={false} />);
    expect(screen.queryByTestId('settings-vertrieb')).not.toBeInTheDocument();
    unmount();

    await becomePartner('user-p', { rolle: 'influencer', region: 'Bern' }, true);
    const res = await betreueHalle('user-p', WINTERTHUR);
    if (!res.ok) throw new Error('betreuen');
    const id = res.halle.id;

    render(<VertriebSettingsGroup userId="admin" isPlatformAdmin />);
    fireEvent.click(await screen.findByTestId('settings-vertrieb'));
    const row = await screen.findByTestId(`vertrieb-eintrag-${id}`);
    expect(row).toHaveTextContent('Influencer/in');
    fireEvent.change(within(row).getByTestId(`vertrieb-status-${id}`), { target: { value: 'bezahlt' } });
    fireEvent.change(within(row).getByTestId(`vertrieb-umsatz-${id}`), { target: { value: '1500' } });
    expect(within(row).getByTestId(`vertrieb-provision-${id}`)).toHaveTextContent('CHF 450');
    fireEvent.click(within(row).getByTestId(`vertrieb-save-${id}`));
    await waitFor(() => expect(screen.getByTestId('vertrieb-offen')).toHaveTextContent('Offen zur Auszahlung: CHF 450'));
  });
});
