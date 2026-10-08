import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Leaflet braucht echtes Layout; im Unit-Test ersetzen wir die Karte durch klickbare Pins
vi.mock('../src/components/GymMap', () => ({
  GymMap: ({ points, onSelect, selectedId, testId = 'gym-finder-map' }: any) => (
    <div data-testid={testId}>
      {points.filter((p: any) => typeof p.lat === 'number').map((p: any) => (
        <button key={p.id} data-testid={`gym-pin-${p.id}`} data-highlighted={String(p.id === selectedId)} onClick={() => onSelect(p.id)}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}));

import { GymFinderSheet } from '../src/components/GymFinderSheet';
import { GymLocationEditor } from '../src/components/GymLocationEditor';
import { LandingPage } from '../src/components/LandingPage';
import { GymFinderEntry } from '../src/lib/gymFinder';
import { resetAllGymData, ensureInitialGymData, getGyms as getV1Gyms } from '../src/lib/gymStorage';

const ENTRIES: GymFinderEntry[] = [
  { id: 'gym-6a-plus', name: '6a plus Winterthur', city: 'Winterthur', address: 'Klosterstrasse 17', lat: 47.4895, lng: 8.7136, activeBoulders: 12, newBoulders: 3 },
  { id: 'gym-minimum-zh', name: 'Minimum Bouldern Zürich', city: 'Zürich', address: 'Flüelastrasse 31', lat: 47.3829, lng: 8.5079, activeBoulders: 5, newBoulders: 0 },
  { id: 'gym-ohne', name: 'Neue Halle', city: 'Bern', activeBoulders: 0, newBoulders: 0 },
];

const geo = (ok: boolean, coords = { latitude: 47.38, longitude: 8.54 }) =>
  ({
    getCurrentPosition: (success: any, error: any) => (ok ? success({ coords }) : error({ code: 1 })),
  }) as unknown as Geolocation;

describe('SPEC-025 · GymFinderSheet', () => {
  it('zeigt Karte und Liste; Pins nur für Hallen mit Koordinaten (AC-1, AC-2)', () => {
    render(<GymFinderSheet open onClose={vi.fn()} entries={ENTRIES} activeGymId="gym-6a-plus" onSelectGym={vi.fn()} />);
    expect(screen.getByTestId('gym-finder-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('gym-finder-map')).toBeInTheDocument();
    expect(screen.getByTestId('gym-row-gym-ohne')).toBeInTheDocument();
    expect(screen.getByTestId('gym-pin-gym-6a-plus')).toBeInTheDocument();
    expect(screen.queryByTestId('gym-pin-gym-ohne')).not.toBeInTheDocument();
    // Gewählte Halle ist hervorgehoben (AC-3)
    expect(screen.getByTestId('gym-row-gym-6a-plus')).toHaveAttribute('aria-current', 'true');
    // Ohne Standort: nach Namen sortiert
    const rows = screen.getAllByTestId(/^gym-row-gym-/).map(r => r.getAttribute('data-testid'));
    expect(rows).toEqual(['gym-row-gym-6a-plus', 'gym-row-gym-minimum-zh', 'gym-row-gym-ohne']);
  });

  it('Pin öffnet die Hallen-Karte; «Zur Wand» wählt die Halle und schließt (AC-4)', () => {
    const onSelectGym = vi.fn();
    const onClose = vi.fn();
    render(<GymFinderSheet open onClose={onClose} entries={ENTRIES} activeGymId="gym-6a-plus" onSelectGym={onSelectGym} />);
    fireEvent.click(screen.getByTestId('gym-pin-gym-minimum-zh'));
    const card = screen.getByTestId('gym-card-gym-minimum-zh');
    expect(card).toHaveTextContent('Minimum Bouldern Zürich');
    expect(card).toHaveTextContent('5 Boulder');
    expect(screen.getByTestId('gym-card-navigate')).toHaveAttribute('href', expect.stringContaining('47.3829%2C8.5079'));
    expect(screen.getByTestId('gym-card-navigate')).toHaveTextContent('Navigation starten');
    fireEvent.click(screen.getByTestId('gym-card-select'));
    expect(onSelectGym).toHaveBeenCalledWith('gym-minimum-zh');
    expect(onClose).toHaveBeenCalled();
  });

  it('zeigt «n neu» nur, wenn es neue Boulder gibt', () => {
    render(<GymFinderSheet open onClose={vi.fn()} entries={ENTRIES} onSelectGym={vi.fn()} />);
    fireEvent.click(screen.getByTestId('gym-row-gym-6a-plus'));
    expect(screen.getByTestId('gym-card-stats')).toHaveTextContent('3 neu');
    fireEvent.click(screen.getByTestId('gym-row-gym-minimum-zh'));
    expect(screen.getByTestId('gym-card-stats')).not.toHaveTextContent('neu');
  });

  it('«In meiner Nähe» sortiert nach Entfernung und zeigt km (AC-5)', async () => {
    render(<GymFinderSheet open onClose={vi.fn()} entries={ENTRIES} onSelectGym={vi.fn()} geolocation={geo(true)} />);
    fireEvent.click(screen.getByTestId('gym-finder-locate'));
    await waitFor(() => expect(screen.getByTestId('gym-row-distance-gym-minimum-zh')).toBeInTheDocument());
    const rows = screen.getAllByTestId(/^gym-row-gym-/).map(r => r.getAttribute('data-testid'));
    expect(rows[0]).toBe('gym-row-gym-minimum-zh');
    expect(rows[2]).toBe('gym-row-gym-ohne');
    expect(screen.getByTestId('gym-row-distance-gym-minimum-zh')).toHaveTextContent(/km/);
  });

  it('ohne Standort-Erlaubnis erscheint ein Hinweis, Liste bleibt nach Namen (AC-5)', () => {
    render(<GymFinderSheet open onClose={vi.fn()} entries={ENTRIES} onSelectGym={vi.fn()} geolocation={geo(false)} />);
    fireEvent.click(screen.getByTestId('gym-finder-locate'));
    expect(screen.getByTestId('gym-finder-locate-denied')).toHaveTextContent('Standort nicht freigegeben');
    expect(screen.queryByTestId(/gym-row-distance-/)).not.toBeInTheDocument();
  });

  it('Suche filtert Liste und Pins (AC-6)', () => {
    render(<GymFinderSheet open onClose={vi.fn()} entries={ENTRIES} onSelectGym={vi.fn()} />);
    fireEvent.change(screen.getByTestId('gym-finder-search'), { target: { value: 'zur' } });
    expect(screen.getByTestId('gym-row-gym-minimum-zh')).toBeInTheDocument();
    expect(screen.queryByTestId('gym-row-gym-6a-plus')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gym-pin-gym-6a-plus')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('gym-finder-search'), { target: { value: 'xyz' } });
    expect(screen.getByTestId('gym-finder-empty')).toHaveTextContent('Keine Halle gefunden');
  });
});

describe('SPEC-025 · Landing «Hallen ansehen» (AC-7)', () => {
  it('Knopf erscheint und ruft onShowGyms', () => {
    const onShowGyms = vi.fn();
    render(<LandingPage onOpenLogin={vi.fn()} onShowGyms={onShowGyms} />);
    fireEvent.click(screen.getByTestId('landing-show-gyms'));
    expect(onShowGyms).toHaveBeenCalled();
  });
});

describe('SPEC-025 · GymLocationEditor (AC-8)', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    ensureInitialGymData();
  });

  it('Adresse suchen → Pin → speichern schreibt Koordinaten', async () => {
    const geocode = vi.fn().mockResolvedValue({ lat: 46.95, lng: 7.44 });
    const onSaved = vi.fn();
    render(
      <GymLocationEditor
        gymId="gym-6a-plus"
        userId="admin-6aplus"
        onSaved={onSaved}
        geocode={geocode}
      />
    );
    expect(screen.getByTestId('gym-location-query')).toHaveValue('Klosterstrasse 17, Winterthur');
    expect(screen.getByTestId('gym-location-save')).toBeDisabled();
    fireEvent.click(screen.getByTestId('gym-geocode-btn'));
    await waitFor(() => expect(screen.getByTestId('gym-location-coords')).toHaveTextContent('46.95000'));
    expect(geocode).toHaveBeenCalledWith('Klosterstrasse 17, Winterthur');
    fireEvent.click(screen.getByTestId('gym-location-save'));
    expect(onSaved).toHaveBeenCalled();
    const saved = getV1Gyms().find(g => g.id === 'gym-6a-plus')!;
    expect(saved.lat).toBe(46.95);
    expect(saved.lng).toBe(7.44);
  });

  it('meldet, wenn die Adresse nicht gefunden wird, und zeigt den Hinweis ohne Standort', async () => {
    render(
      <GymLocationEditor
        gymId="gym-unbekannt"
        userId="admin-6aplus"
        geocode={vi.fn().mockResolvedValue(null)}
      />
    );
    expect(screen.getByTestId('gym-location-missing')).toBeInTheDocument();
    expect(screen.getByTestId('gym-geocode-btn')).toBeDisabled();
    fireEvent.change(screen.getByTestId('gym-location-query'), { target: { value: 'Nirgendwo 1' } });
    fireEvent.click(screen.getByTestId('gym-geocode-btn'));
    await waitFor(() => expect(screen.getByTestId('gym-location-message')).toHaveTextContent('nicht gefunden'));
  });

  it('Kletterer können nicht speichern', async () => {
    render(
      <GymLocationEditor
        gymId="gym-6a-plus"
        userId="hans-kletterer"
        geocode={vi.fn().mockResolvedValue({ lat: 47, lng: 8 })}
      />
    );
    fireEvent.click(screen.getByTestId('gym-geocode-btn'));
    await waitFor(() => expect(screen.getByTestId('gym-location-save')).toBeEnabled());
    fireEvent.click(screen.getByTestId('gym-location-save'));
    expect(screen.getByTestId('gym-location-message')).toHaveTextContent('Nur Hallen-Admins');
  });
});


describe('SPEC-025 · Ortsangabe ohne Doppelung', () => {
  it('lässt den Ort weg, wenn er schon in der Adresse steht', async () => {
    const { formatPlace } = await import('../src/components/GymFinderSheet');
    expect(formatPlace({ address: 'Flüelastrasse 31, 8048 Zürich', city: 'Zürich' })).toBe('Flüelastrasse 31, 8048 Zürich');
    expect(formatPlace({ address: 'Klosterstrasse 17', city: 'Winterthur' })).toBe('Klosterstrasse 17, Winterthur');
    expect(formatPlace({ city: 'Bern' })).toBe('Bern');
  });
});
