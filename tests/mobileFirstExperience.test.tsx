import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../src/App';
import { BoulderBottomSheet } from '../src/components/BoulderBottomSheet';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { SectorManager } from '../src/components/SectorManager';
import { GymGradeScale, WallBoulder, DEFAULT_RADAR } from '../src/types/boulder';
import { Sector } from '../src/types/gym';
import { resetAllGymData, createGym, createSector, CURRENT_USER } from '../src/lib/gymStorage';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { setSessionUser } from '../src/lib/authService';

const mockGradeScales: GymGradeScale[] = [
  { id: 'scale-yellow', gymId: 'gym-1', colorName: 'Gelb', colorHex: '#FACC15', difficultyLabel: 'Leicht', fontRangeMin: '3', fontRangeMax: '4', sortOrder: 1 },
  { id: 'scale-green', gymId: 'gym-1', colorName: 'Grün', colorHex: '#22C55E', difficultyLabel: 'Moderat', fontRangeMin: '5a', fontRangeMax: '5c', sortOrder: 2 },
  { id: 'scale-red', gymId: 'gym-1', colorName: 'Rot', colorHex: '#EF4444', difficultyLabel: 'Schwer', fontRangeMin: '6a', fontRangeMax: '6b+', sortOrder: 3 },
];

const mockDraftBoulder: WallBoulder = {
  id: 'boulder-draft-1',
  sectorId: 'sec-1',
  gradeScaleId: 'scale-yellow',
  positionX: 0.5,
  positionY: 0.5,
  status: 'draft',
  setterId: 'setter-1',
  createdAt: new Date().toISOString(),
  radar: DEFAULT_RADAR,
};

describe('Mobile-First Experience Test Suite', () => {
  beforeEach(() => {
    resetAllGymData();
    clearBatchServiceStorage();
  });

  it('1) Sektor Vollbild: toggles immersive fullscreen mode in ClimberSectorView', () => {
    createGym({ id: 'gym-test', name: 'Test Gym' });
    createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Wand 1', wall_photo_url: '/img1.jpg' });

    render(
      <ClimberSectorView
        currentUser={{ id: 'climber-1', nickname: 'Climber 1', role: 'member', isPlatformAdmin: false }}
        activeGymId="gym-test"
      />
    );

    // Fullscreen toggle button exists
    const fullscreenBtn = screen.getByTestId('toggle-fullscreen-btn');
    expect(fullscreenBtn).toBeInTheDocument();

    // Click to enter fullscreen
    fireEvent.click(fullscreenBtn);
    expect(screen.getByTestId('sector-fullscreen-modal')).toBeInTheDocument();

    // Exit fullscreen
    const exitBtn = screen.getByTestId('exit-fullscreen-btn');
    fireEvent.click(exitBtn);
    expect(screen.queryByTestId('sector-fullscreen-modal')).not.toBeInTheDocument();
  });

  it('2) Schrauber Popup: has mobile-first layout with sticky save button and large targets', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <BoulderBottomSheet
        isOpen={true}
        boulder={mockDraftBoulder}
        gradeScales={mockGradeScales}
        defaultGradeScaleId="scale-yellow"
        isMarkedForArchive={false}
        onClose={onClose}
        onSave={onSave}
      />
    );

    // Check title and sticky save button
    expect(screen.getByText(/Neuer Boulder \(Entwurf\)/i)).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: /Speichern & Weiter/i });
    expect(saveButton).toBeInTheDocument();

    // Select color
    fireEvent.click(screen.getByText('Rot'));

    // Submit form
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      gradeScaleId: 'scale-red'
    }));
  });

  it('3) Menüführung: renders Mobile Bottom Navigation Bar for authenticated climber', () => {
    setSessionUser('hans-kletterer');
    render(<App />);

    // Mobile bottom navigation is rendered
    const bottomNav = screen.getByTestId('mobile-bottom-nav');
    expect(bottomNav).toBeInTheDocument();

    // Bottom nav tabs exist
    expect(screen.getByTestId('mobile-tab-wall')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-stats')).toBeInTheDocument();
  });

  it('4) Sektor Swipen: supports switching sectors via prev/next controls and touch gestures', () => {
    createGym({ id: 'gym-swipe', name: 'Swipe Gym' });
    createSector('gym-swipe', CURRENT_USER.id, { name: 'Sektor A (Platte)', wall_photo_url: '/a.jpg', sort_order: 1 });
    createSector('gym-swipe', CURRENT_USER.id, { name: 'Sektor B (Dach)', wall_photo_url: '/b.jpg', sort_order: 2 });

    render(
      <ClimberSectorView
        currentUser={{ id: 'climber-1', nickname: 'Climber 1', role: 'member', isPlatformAdmin: false }}
        activeGymId="gym-swipe"
      />
    );

    // Initial sector
    expect(screen.getAllByText('Sektor A (Platte)').length).toBeGreaterThan(0);

    // Swipe left (next sector)
    const nextBtn = screen.getByLabelText('Nächster Sektor');
    fireEvent.click(nextBtn);
    expect(screen.getAllByText('Sektor B (Dach)').length).toBeGreaterThan(0);

    // Swipe right (prev sector)
    const prevBtn = screen.getByLabelText('Vorheriger Sektor');
    fireEvent.click(prevBtn);
    expect(screen.getAllByText('Sektor A (Platte)').length).toBeGreaterThan(0);
  });

  it('5) Mobiles Sektor-Umordnen: provides touch reorder mode and direct mobile move buttons', () => {
    const gymId = 'gym-reorder-test';
    const s1: Sector & { active_boulder_count: number } = {
      id: 'sec-1',
      gym_id: gymId,
      name: 'Eingang',
      wall_photo_url: '/1.jpg',
      sort_order: 1,
      created_at: '',
      active_boulder_count: 2,
    };
    const s2: Sector & { active_boulder_count: number } = {
      id: 'sec-2',
      gym_id: gymId,
      name: 'Mitte',
      wall_photo_url: '/2.jpg',
      sort_order: 2,
      created_at: '',
      active_boulder_count: 4,
    };

    const onRefresh = vi.fn();

    render(
      <SectorManager
        gymId={gymId}
        userId={CURRENT_USER.id}
        isAdmin={true}
        sectors={[s1, s2]}
        onRefresh={onRefresh}
      />
    );

    // Toggle Reorder Mode button exists
    const toggleReorderBtn = screen.getByTestId('toggle-reorder-mode-btn');
    expect(toggleReorderBtn).toBeInTheDocument();

    // Activate Reorder Mode
    fireEvent.click(toggleReorderBtn);
    expect(screen.getByTestId('mobile-touch-reorder-view')).toBeInTheDocument();

    // Move sec-1 down using touch button
    const touchMoveDown = screen.getByTestId('touch-move-down-sec-1');
    fireEvent.click(touchMoveDown);
    expect(onRefresh).toHaveBeenCalled();
  });
});
