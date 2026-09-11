import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../src/App';
import { BoulderBottomSheet } from '../src/components/BoulderBottomSheet';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { SectorManager } from '../src/components/SectorManager';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
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
    createSector('gym-swipe', CURRENT_USER.id, { name: 'Sektor C (Überhang)', wall_photo_url: '/c.jpg', sort_order: 3 });

    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <ClimberSectorView
        currentUser={{ id: 'climber-1', nickname: 'Climber 1', role: 'member', isPlatformAdmin: false }}
        activeGymId="gym-swipe"
      />
    );

    // Initial sector
    expect(screen.getAllByText('Sektor A (Platte)').length).toBeGreaterThan(0);

    // Swipe left / click next (next sector)
    const nextBtn = screen.getByLabelText('Nächster Sektor');
    fireEvent.click(nextBtn);
    expect(screen.getAllByText('Sektor B (Dach)').length).toBeGreaterThan(0);
    expect(scrollIntoViewMock).toHaveBeenCalled();

    // Verify the active sector tab has data-sector-id matching Sektor B
    const sectorBTabs = screen.getAllByText('Sektor B (Dach)');
    const activeTab = sectorBTabs.find(el => el.closest('button')?.getAttribute('data-sector-id'));
    expect(activeTab).toBeTruthy();

    // Swipe right / click prev (prev sector)
    scrollIntoViewMock.mockClear();
    const prevBtn = screen.getByLabelText('Vorheriger Sektor');
    fireEvent.click(prevBtn);
    expect(screen.getAllByText('Sektor A (Platte)').length).toBeGreaterThan(0);
    expect(scrollIntoViewMock).toHaveBeenCalled();
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

  it('6) Schnelle Interaktion: BoulderDetailModal schließt sofort nach Bewertungsabgabe & Überspringen', () => {
    const handleClose = vi.fn();
    const handleDataChanged = vi.fn();

    const sampleBoulder: WallBoulder = {
      id: 'boulder-fast-close-1',
      sectorId: 'sec-1',
      gradeScaleId: 'scale-1',
      setterId: 'setter-1',
      positionX: 0.5,
      positionY: 0.5,
      status: 'active',
      radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
      createdAt: new Date().toISOString(),
      name: 'Speed Route',
    };

    const { rerender } = render(
      <BoulderDetailModal
        boulder={sampleBoulder}
        currentUser={{ id: 'climber-speed', nickname: 'Speedy', role: 'member', isPlatformAdmin: false }}
        isOpen={true}
        onClose={handleClose}
        onDataChanged={handleDataChanged}
      />
    );

    // Klick auf "Jetzt bewerten"
    const rateBtn = screen.getByText('Jetzt bewerten');
    fireEvent.click(rateBtn);

    // RatingModal erscheint
    expect(screen.getByText('Soft')).toBeInTheDocument();

    // Soft auswählen & speichern
    fireEvent.click(screen.getByText('Soft'));
    fireEvent.click(screen.getByText('Bewertung speichern'));

    // Detailfenster muss sich sofort geschlossen haben (handleClose aufgerufen)
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Zweiter Test: Bei automatischer Bewertung nach Top -> Klick auf Überspringen schließt auch direkt
    handleClose.mockClear();
    rerender(
      <BoulderDetailModal
        boulder={sampleBoulder}
        currentUser={{ id: 'climber-speed-2', nickname: 'Speedy2', role: 'member', isPlatformAdmin: false }}
        isOpen={true}
        onClose={handleClose}
        onDataChanged={handleDataChanged}
      />
    );

    // Top loggen -> löst automatisches RatingModal aus
    const topBtn = screen.getByRole('button', { name: /Top/i });
    fireEvent.click(topBtn);

    // Überspringen klicken
    const skipBtn = screen.getByText('Überspringen');
    fireEvent.click(skipBtn);

    // Detailfenster schließt sich direkt und bringt User zurück zur Wand
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('7) 2-Stufen-Bewertung & Abhaken ganz oben im Frame', () => {
    const handleClose = vi.fn();
    const handleDataChanged = vi.fn();

    const sampleBoulder: WallBoulder = {
      id: 'boulder-2step-1',
      sectorId: 'sec-1',
      gradeScaleId: 'scale-1',
      setterId: 'setter-1',
      positionX: 0.5,
      positionY: 0.5,
      status: 'active',
      radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
      createdAt: new Date().toISOString(),
      name: 'Flow Route',
    };

    render(
      <BoulderDetailModal
        boulder={sampleBoulder}
        currentUser={{ id: 'climber-flow', nickname: 'Flowy', role: 'member', isPlatformAdmin: false }}
        isOpen={true}
        onClose={handleClose}
        onDataChanged={handleDataChanged}
      />
    );

    // 1) Verify Ascent card is at the top of scrollable modal content
    const ascentCard = screen.getByTestId('ascent-logging-card');
    expect(ascentCard).toBeInTheDocument();
    // Verify it contains Flash, Top, Projekt
    expect(screen.getByRole('button', { name: /Flash/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Top/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Projekt/i })).toBeInTheDocument();

    // 2) Top anklicken -> löst Rating-Modal aus
    const topBtn = screen.getByRole('button', { name: /Top/i });
    fireEvent.click(topBtn);

    // 3) Fenster Schritt 1: NUR Grad-Empfinden sichtbar
    expect(screen.getByText('Schritt 1/2')).toBeInTheDocument();
    expect(screen.getByText('Soft')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Stiff')).toBeInTheDocument();
    // Sterne und Radar sind in Schritt 1 NICHT sichtbar
    expect(screen.queryByText(/von 5 Sternen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Klettereigenschaften bewerten/i)).not.toBeInTheDocument();

    // 4) Klick auf "Fair" -> schaltet direkt zu Schritt 2
    fireEvent.click(screen.getByText('Fair'));

    // 5) Fenster Schritt 2: Qualität 1-5 Sterne & optional Radar
    expect(screen.getByText('Schritt 2/2')).toBeInTheDocument();
    expect(screen.getAllByText(/Routenqualität & Spaß/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/5 von 5 Sternen/i)).toBeInTheDocument();
    expect(screen.getByText(/Klettereigenschaften bewerten \(Radar-Chart\)/i)).toBeInTheDocument();
    expect(screen.getByText('(optional)')).toBeInTheDocument();

    // 6) 4 Sterne wählen und speichern
    const star4 = screen.getByLabelText('4 Sterne');
    fireEvent.click(star4);
    expect(screen.getByText(/4 von 5 Sternen/i)).toBeInTheDocument();

    // Speichern -> schließt Dialog
    fireEvent.click(screen.getByText('Bewertung speichern'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

