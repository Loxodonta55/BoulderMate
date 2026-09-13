import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { createGym, createSector, resetAllGymData, CURRENT_USER } from '../src/lib/gymStorage';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { CurrentUser } from '../src/types/boulder';

const SAMPLE_CLIMBER: CurrentUser = {
  id: 'climber-user-1',
  nickname: 'Kletterer',
  role: 'member',
  isPlatformAdmin: false,
};

describe('ClimberSectorView Header Layout & Typography (Bugfix Verification)', () => {
  beforeEach(() => {
    resetAllGymData();
    clearBatchServiceStorage();
  });

  it('renders full sector name "Überhang vorne" and readable breadcrumbs without truncation', () => {
    // Setup gym with realistic long name like the user reported
    createGym({ id: 'gym-6a-plus', name: '6a plus Kletter- & Boulderhalle Winterthur' });
    createGym({ id: 'gym-other', name: 'Minimum Bouldern Zürich' });

    createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'Überhang vorne',
      wall_photo_url: '/img-ueberhang.jpg',
    });
    createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'Zwischenwand vorne',
      wall_photo_url: '/img-zwischenwand.jpg',
    });
    createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'Verlängerung Überhang',
      wall_photo_url: '/img-verlaengerung.jpg',
    });

    render(
      <ClimberSectorView
        currentUser={SAMPLE_CLIMBER}
        activeGymId="gym-6a-plus"
      />
    );

    // 1. Breadcrumbs: Must contain "Sektoren & Wandansicht"
    expect(screen.getByText('Sektoren & Wandansicht')).toBeInTheDocument();

    // 2. Sector heading: Must display full "Überhang vorne" as an uppercase headline and NOT be truncated into "Ü..."
    const headings = screen.getAllByText(/Überhang vorne/i);
    expect(headings.length).toBeGreaterThanOrEqual(2); // One in h2 title, one in sector tabs
    const h2Title = screen.getByRole('heading', { name: /Überhang vorne/i, level: 2 });
    expect(h2Title).toBeInTheDocument();
    expect(h2Title.textContent).toMatch(/Überhang vorne/i);
    expect(h2Title.getAttribute('title')).toMatch(/Überhang vorne/i);

    // 3. Sector tabs: All sectors must be rendered in tabs
    expect(screen.getByRole('button', { name: /Zwischenwand vorne/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verlängerung Überhang/i })).toBeInTheDocument();

    // 4. Action buttons: Manual sync button is removed (everything syncs automatically in the background)
    expect(screen.queryByTestId('sync-boulders-btn')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Sync$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('toggle-fullscreen-btn')).toBeInTheDocument();

    // 5. Gym select dropdown exists and contains both gyms
    const select = screen.getByTitle('Halle wählen') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('gym-6a-plus');
    expect(screen.getAllByText(/6a plus Kletter- & Boulderhalle Winterthur/i).length).toBeGreaterThanOrEqual(2);
  });
});
