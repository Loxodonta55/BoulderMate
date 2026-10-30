import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { CurrentUser } from '../src/types/boulder';

// SPEC-045 AC-2: Halle ohne geladene Wände
vi.mock('../src/lib/batchBoulderService', async orig => ({
  ...(await orig<typeof import('../src/lib/batchBoulderService')>()),
  getSectors: () => [],
}));

const user: CurrentUser = { id: 'spec045-offline', nickname: 'Fabio', role: 'member', isPlatformAdmin: false };

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value });
}

afterEach(() => setOnline(true));

describe('SPEC-045 AC-2: erster Start ohne Netz und ohne Daten', () => {
  it('ohne Netz: ehrlicher Satz statt «Noch keine Wände»', () => {
    setOnline(false);
    render(<ClimberSectorView currentUser={user} activeGymId="gym-6a-plus" />);
    expect(screen.getByTestId('app-offline-empty')).toHaveTextContent('Verbinde dich einmal mit dem Netz');
    expect(screen.queryByTestId('climber-empty-gym')).toBeNull();
  });

  it('Netz kommt zurück: wieder die normale Meldung', () => {
    setOnline(false);
    render(<ClimberSectorView currentUser={user} activeGymId="gym-6a-plus" />);
    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByTestId('climber-empty-gym')).toBeInTheDocument();
    expect(screen.queryByTestId('app-offline-empty')).toBeNull();
  });
});
