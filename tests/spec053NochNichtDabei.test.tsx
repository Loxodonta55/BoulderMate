import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Leaflet braucht echtes Layout; im Unit-Test ersetzen wir die Karte durch klickbare Pins
vi.mock('../src/components/GymMap', () => ({
  GymMap: ({ points, onSelect, testId = 'gym-finder-map' }: any) => (
    <div data-testid={testId}>
      {points.filter((p: any) => typeof p.lat === 'number').map((p: any) => (
        <button key={p.id} data-testid={`gym-pin-${p.id}`} data-registered={String(p.registered !== false)} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

import { GymFinderSheet } from '../src/components/GymFinderSheet';
import { FuerHallenPage } from '../src/components/hallen/FuerHallenPage';
import { HalleEmpfehlenSection } from '../src/components/hallen/HalleEmpfehlenSection';
import { GymFinderEntry } from '../src/lib/gymFinder';
import { createMyCode, setWish } from '../src/lib/hallenVerzeichnis';

import { clearMemoryStore } from '../src/lib/storageUtils';

/** SPEC-053 · «Noch nicht dabei» – Karte/Liste, Hallen-Blatt, «Mit der Halle reden», «Für Hallen», «Ich» */

const ACTIVE: GymFinderEntry[] = [
  { id: 'gym-6a-plus', name: '6a plus Zürich', city: 'Zürich', lat: 47.39, lng: 8.51, activeBoulders: 12, newBoulders: 0 },
];

const geo = (coords = { latitude: 47.5, longitude: 8.73 }) =>
  ({ getCurrentPosition: (success: any) => success({ coords }) }) as unknown as Geolocation;

function renderFinder(props: Partial<React.ComponentProps<typeof GymFinderSheet>> = {}) {
  return render(
    <GymFinderSheet open onClose={vi.fn()} entries={ACTIVE} activeGymId="gym-6a-plus" onSelectGym={vi.fn()} userId="user-a" {...props} />
  );
}

beforeEach(() => {
  localStorage.clear();
  clearMemoryStore();
});

describe('SPEC-053 · Karte und Liste', () => {
  it('ohne Standort: aktive zuerst, dann Abschnitt «Noch nicht bei BoulderMate» mit Schild (AC-1, AC-3)', async () => {
    renderFinder();
    await screen.findByTestId('gym-finder-directory-heading');
    const rows = screen.getAllByTestId(/^gym-row-(gym|vz)-[a-z0-9-]+$/).map(r => r.getAttribute('data-testid'));
    expect(rows).toEqual(['gym-row-gym-6a-plus', 'gym-row-vz-demo-stgallen', 'gym-row-vz-demo-winterthur', 'gym-row-vz-demo-bern']);
    expect(screen.getByTestId('gym-row-not-yet-vz-demo-bern')).toHaveTextContent('Noch nicht dabei');
    expect(screen.queryByTestId('gym-row-vz-demo-unsicher')).not.toBeInTheDocument();
    expect(screen.getByTestId('gym-pin-vz-demo-bern')).toHaveAttribute('data-registered', 'false');
    expect(screen.getByTestId('gym-pin-gym-6a-plus')).toHaveAttribute('data-registered', 'true');
    expect(screen.getByTestId('gym-finder-missing')).toHaveTextContent('Halle fehlt? Melden');
  });

  it('mit Standort: eine Liste nach Entfernung, ohne Abschnitt (AC-2)', async () => {
    renderFinder({ geolocation: geo() });
    await screen.findByTestId('gym-row-vz-demo-winterthur');
    fireEvent.click(screen.getByTestId('gym-finder-locate'));
    const rows = screen.getAllByTestId(/^gym-row-(gym|vz)-[a-z0-9-]+$/).map(r => r.getAttribute('data-testid'));
    expect(rows[0]).toBe('gym-row-vz-demo-winterthur');
    expect(rows[1]).toBe('gym-row-gym-6a-plus');
    expect(screen.queryByTestId('gym-finder-directory-heading')).not.toBeInTheDocument();
  });

  it('«Nur aktive Hallen» blendet aus, wird gemerkt; Suche zeigt «+ n Hallen …» (AC-4)', async () => {
    const { unmount } = renderFinder();
    await screen.findByTestId('gym-row-vz-demo-bern');
    fireEvent.click(screen.getByTestId('gym-finder-only-active'));
    expect(screen.queryByTestId('gym-row-vz-demo-bern')).not.toBeInTheDocument();
    unmount();

    renderFinder();
    await screen.findByTestId('gym-finder-only-active');
    expect(screen.getByTestId('gym-finder-only-active')).toBeChecked();
    expect(screen.queryByTestId('gym-row-vz-demo-bern')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('gym-finder-search'), { target: { value: 'Bern' } });
    const more = screen.getByTestId('gym-finder-show-directory');
    expect(more).toHaveTextContent('+ 1 Hallen noch nicht dabei – zeigen');
    fireEvent.click(more);
    expect(screen.getByTestId('gym-row-vz-demo-bern')).toBeInTheDocument();
    expect(screen.getByTestId('gym-finder-only-active')).not.toBeChecked();
  });
});

describe('SPEC-053 · Hallen-Blatt einer Verzeichnis-Halle (AC-5, AC-6)', () => {
  it('kein «Zur Wand»; Wunsch setzen und zurücknehmen; Zahl ab 3', async () => {
    renderFinder();
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-winterthur'));
    const card = screen.getByTestId('gym-card-vz-demo-winterthur');
    expect(within(card).queryByTestId('gym-card-select')).not.toBeInTheDocument();
    expect(card).toHaveTextContent('Noch keine Routen in BoulderMate.');
    expect(screen.getByTestId('gym-card-wishes')).toHaveTextContent('11 Kletterer wünschen sich BoulderMate hier');
    expect(screen.getByTestId('gym-card-website')).toHaveAttribute('href', 'https://example.com/winterthur');

    fireEvent.click(screen.getByTestId('gym-card-wish'));
    await waitFor(() => expect(screen.getByTestId('gym-card-wished')).toHaveTextContent('Gewünscht'));
    await waitFor(() => expect(screen.getByTestId('gym-card-wishes')).toHaveTextContent('12 Kletterer'));

    fireEvent.click(screen.getByTestId('gym-card-unwish'));
    await waitFor(() => expect(screen.getByTestId('gym-card-wish')).toBeInTheDocument());
  });

  it('unter 3 Wünschen: «Sei unter den Ersten»', async () => {
    renderFinder();
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-bern'));
    expect(screen.getByTestId('gym-card-wishes')).toHaveTextContent('Sei unter den Ersten');
  });

  it('Gast: «Anmelden und wünschen» öffnet die Anmeldung', async () => {
    const onRequestLogin = vi.fn();
    renderFinder({ userId: null, onRequestLogin });
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-bern'));
    const btn = screen.getByTestId('gym-card-wish');
    expect(btn).toHaveTextContent('Anmelden und wünschen');
    fireEvent.click(btn);
    expect(onRequestLogin).toHaveBeenCalled();
  });
});

describe('SPEC-053 · «Mit der Halle reden» (AC-7)', () => {
  it('Dankeschön oben, Text mit Link, Code erst nach Haken', async () => {
    renderFinder();
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-winterthur'));
    fireEvent.click(screen.getByTestId('gym-card-talk'));
    const sheet = await screen.findByTestId('halle-reden-sheet');
    expect(within(sheet).getByTestId('halle-reden-dankeschoen')).toHaveTextContent('kein Schneeballsystem');
    expect(within(sheet).getByTestId('halle-reden-betrag')).toHaveTextContent('30 % von dem, was die Halle im ersten Jahr an BoulderMate zahlt');
    expect(within(sheet).getByTestId('halle-reden-text')).toHaveTextContent('?halle=vz-demo-winterthur');
    expect(within(sheet).getByTestId('halle-reden-text')).not.toHaveTextContent('ref=');
    expect(within(sheet).getByTestId('halle-reden-mail')).toHaveAttribute('href', expect.stringMatching(/^mailto:info@example\.com/));

    const create = within(sheet).getByTestId('halle-reden-create-code');
    expect(create).toBeDisabled();
    fireEvent.click(within(sheet).getByTestId('halle-reden-adult'));
    fireEvent.click(create);
    const code = await within(sheet).findByTestId('halle-reden-code-value');
    expect(code.textContent).toMatch(/^BM-[A-Z0-9]{3} [A-Z0-9]{3}$/);
    expect(within(sheet).getByTestId('halle-reden-text')).toHaveTextContent('ref=BM-');
  });

  it('QR an der Theke: Vollbild mit SVG', async () => {
    renderFinder();
    fireEvent.click(await screen.findByTestId('gym-row-vz-demo-winterthur'));
    fireEvent.click(screen.getByTestId('gym-card-talk'));
    fireEvent.click(await screen.findByTestId('halle-reden-qr'));
    expect(screen.getByTestId('halle-qr-fullscreen')).toHaveTextContent('Scannen für die Hallenleitung');
    expect(screen.getByTestId('halle-qr-svg').querySelector('path')?.getAttribute('d')).toBeTruthy();
    fireEvent.click(screen.getByTestId('halle-qr-close'));
    expect(screen.queryByTestId('halle-qr-fullscreen')).not.toBeInTheDocument();
  });
});

describe('SPEC-053 · Seite «Für Hallen» (AC-8)', () => {
  it('zeigt Halle, Wunsch-Zahl, Code und den offenen Dankeschön-Satz', async () => {
    const onDemo = vi.fn();
    render(<FuerHallenPage halleId="vz-demo-winterthur" refCode="BM-K7Q4AC" onClose={vi.fn()} onDemo={onDemo} />);
    await waitFor(() => expect(screen.getByTestId('fuer-hallen-name')).toHaveTextContent('Boulderhalle Winterthur (Beispiel)'));
    expect(screen.getByTestId('fuer-hallen-wishes')).toHaveTextContent('11 Kletterer');
    expect(screen.getByTestId('fuer-hallen-code')).toHaveTextContent('BM-K7Q 4AC');
    expect(screen.getByTestId('fuer-hallen-ref-note')).toHaveTextContent('euch kostet das nichts extra');
    expect(screen.getByTestId('fuer-hallen-mail').getAttribute('href')).toContain(encodeURIComponent('Empfehlungscode: BM-K7Q4AC'));
    fireEvent.click(screen.getByTestId('fuer-hallen-demo'));
    expect(onDemo).toHaveBeenCalled();
  });

  it('ohne Code kein Dankeschön-Satz', async () => {
    render(<FuerHallenPage halleId="vz-demo-bern" refCode={null} onClose={vi.fn()} onDemo={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('fuer-hallen-name')).toHaveTextContent('Kletterhalle Bern'));
    expect(screen.queryByTestId('fuer-hallen-ref-note')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fuer-hallen-wishes')).not.toBeInTheDocument();
  });
});

describe('SPEC-053 · «Ich» → «Halle empfehlen» (AC-9)', () => {
  it('leerer Zustand mit Knopf zur Karte', async () => {
    const onOpenFinder = vi.fn();
    render(<HalleEmpfehlenSection userId="user-a" onOpenFinder={onOpenFinder} />);
    expect(await screen.findByTestId('halle-empfehlen-empty')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('halle-empfehlen-open-finder'));
    expect(onOpenFinder).toHaveBeenCalled();
  });

  it('zeigt Code und gewünschte Hallen; Code löschen mit Rückfrage', async () => {
    await setWish('vz-demo-bern', 'user-a', true);
    const code = await createMyCode('user-a', true);
    render(<HalleEmpfehlenSection userId="user-a" onOpenFinder={vi.fn()} />);
    expect(await screen.findByTestId('halle-empfehlen-code')).toHaveTextContent(code!.slice(0, 6));
    expect(screen.getByTestId('halle-empfehlen-wished')).toHaveTextContent('Kletterhalle Bern');
    fireEvent.click(screen.getByTestId('halle-empfehlen-delete'));
    fireEvent.click(screen.getByTestId('halle-empfehlen-delete-confirm'));
    await waitFor(() => expect(screen.queryByTestId('halle-empfehlen-code')).not.toBeInTheDocument());
  });

  it('Gast sieht den Abschnitt nicht', () => {
    const { container } = render(<HalleEmpfehlenSection userId={null} onOpenFinder={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
