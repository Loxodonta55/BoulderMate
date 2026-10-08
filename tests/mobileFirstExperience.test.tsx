import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../src/App';
import { BoulderBottomSheet } from '../src/components/BoulderBottomSheet';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { SectorManager } from '../src/components/SectorManager';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { getUserAscent, getUserRating, resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
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
    // Sektor-Pill zeigt Position (SPEC-022 F3)
    expect(screen.getByTestId('sector-pill-name')).toHaveTextContent('2/3');

    // Swipe right / click prev (prev sector)
    const prevBtn = screen.getByLabelText('Vorheriger Sektor');
    fireEvent.click(prevBtn);
    expect(screen.getAllByText('Sektor A (Platte)').length).toBeGreaterThan(0);
    expect(screen.getByTestId('sector-pill-name')).toHaveTextContent('1/3');
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

    // Activate Reorder Mode (SPEC-023 F3: Pfeile nur im Modus, 44px Tippfläche)
    expect(screen.queryByTestId('move-down-sec-1')).not.toBeInTheDocument();
    fireEvent.click(toggleReorderBtn);
    expect(toggleReorderBtn).toHaveTextContent('Fertig');

    // Move sec-1 down using touch button
    const touchMoveDown = screen.getByTestId('move-down-sec-1');
    expect(touchMoveDown.className).toContain('min-h-[44px]');
    fireEvent.click(touchMoveDown);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('5b) Mobiler Neuer-Sektor-Button: immer im Portrait- & Landscape-Modus sichtbar und bedienbar', () => {
    const gymId = 'gym-new-sector-test';
    const s1: Sector & { active_boulder_count: number } = {
      id: 'sec-1',
      gym_id: gymId,
      name: 'Eingang',
      wall_photo_url: '/1.jpg',
      sort_order: 1,
      created_at: '',
      active_boulder_count: 2,
    };

    const { rerender } = render(
      <SectorManager
        gymId={gymId}
        userId={CURRENT_USER.id}
        isAdmin={true}
        sectors={[s1]}
        onRefresh={vi.fn()}
      />
    );

    // Neuer Sektor button exists and has responsive classes
    const addSectorBtn = screen.getByTestId('add-sector-btn');
    expect(addSectorBtn).toBeInTheDocument();
    expect(addSectorBtn).toHaveTextContent(/Sektor/i);
    expect(addSectorBtn.className).toContain('whitespace-nowrap');

    // Clicking it opens the sheet
    fireEvent.click(addSectorBtn);
    expect(screen.getByTestId('add-sector-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('new-sector-name')).toBeInTheDocument();

    // Cancel form
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(screen.queryByTestId('add-sector-sheet')).not.toBeInTheDocument();

    // Empty state also provides add sector button
    rerender(
      <SectorManager
        gymId={gymId}
        userId={CURRENT_USER.id}
        isAdmin={true}
        sectors={[]}
        onRefresh={vi.fn()}
      />
    );

    const emptyAddBtn = screen.getByTestId('empty-add-sector-btn');
    expect(emptyAddBtn).toBeInTheDocument();
    fireEvent.click(emptyAddBtn);
    expect(screen.getByTestId('add-sector-sheet')).toBeInTheDocument();
  });

  it('6) Schnelle Interaktion: BoulderSheet schließt sofort nach dem Loggen, Bewertung per Toast-Sternen', () => {
    resetAscentAndRatingStorage();
    const handleClose = vi.fn();

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
    const user = { id: 'climber-speed', nickname: 'Speedy', role: 'member' as const, isPlatformAdmin: false };

    render(
      <>
        <BoulderSheet boulder={sampleBoulder} currentUser={user} onClose={handleClose} />
        <ToastHost />
      </>
    );

    // Top loggen -> Sheet schließt sofort und bringt User zurück zur Wand
    fireEvent.click(screen.getByTestId('log-top-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(getUserAscent(user.id, sampleBoulder.id)?.type).toBe('top');

    // Kein automatischer Bewertungsdialog mehr, kein «Überspringen» – stattdessen Toast mit Mini-Sternen
    expect(screen.queryByText(/Schritt 1\/2/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Überspringen')).not.toBeInTheDocument();
    expect(screen.getByTestId('toast')).toHaveTextContent('Top geloggt');
    expect(screen.getByTestId('toast-action')).toHaveTextContent('Rückgängig');

    // Ein Tap auf die Sterne speichert die Bewertung, ohne weiteren Dialog
    fireEvent.click(screen.getByTestId('toast-star-4'));
    expect(getUserRating(user.id, sampleBoulder.id)?.qualityStars).toBe(4);
    expect(screen.getByTestId('toast')).toHaveTextContent('4 Sterne gespeichert');
    expect(handleClose).toHaveBeenCalledTimes(1);
    act(() => hideToast());
  });

  it('7) 2-Stufen-Bewertung & Abhaken ganz oben im Sheet', () => {
    resetAscentAndRatingStorage();
    const handleClose = vi.fn();

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
    const user = { id: 'climber-flow', nickname: 'Flowy', role: 'member' as const, isPlatformAdmin: false };

    render(<BoulderSheet boulder={sampleBoulder} currentUser={user} onClose={handleClose} />);

    // 1) Logging-Karte ist direkt im halben Sheet sichtbar
    const ascentCard = screen.getByTestId('ascent-logging-card');
    expect(ascentCard).toBeInTheDocument();
    // Verify it contains Flash, Top, Projekt
    expect(screen.getByTestId('log-flash-btn')).toHaveTextContent('Flash');
    expect(screen.getByTestId('log-top-btn')).toHaveTextContent('Top');
    expect(screen.getByTestId('log-project-btn')).toHaveTextContent('Projekt');
    expect(ascentCard.querySelectorAll('button').length).toBe(3);

    // 2) Bewerten aus dem vollen Sheet öffnen
    fireEvent.click(screen.getByTestId('boulder-sheet-more'));
    fireEvent.click(screen.getByTestId('open-rating-btn'));

    // 3) Fenster Schritt 1: NUR Grad-Empfinden sichtbar
    expect(screen.getByText('Schritt 1/2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Soft/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Fair/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Stiff/ })).toBeInTheDocument();
    // Sterne und Radar sind in Schritt 1 NICHT sichtbar
    expect(screen.queryByText(/von 5 Sternen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Klettereigenschaften bewerten/i)).not.toBeInTheDocument();

    // 4) Klick auf "Fair" -> schaltet direkt zu Schritt 2
    fireEvent.click(screen.getByRole('button', { name: /^Fair/ }));

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

    // Speichern -> schließt den Bewertungsdialog, Bewertung ist gespeichert, Sheet bleibt offen
    fireEvent.click(screen.getByText('Bewertung speichern'));
    expect(screen.queryByText('Schritt 2/2')).not.toBeInTheDocument();
    const saved = getUserRating(user.id, sampleBoulder.id);
    expect(saved?.qualityStars).toBe(4);
    expect(saved?.gradeFeel).toBe('fair');
    expect(screen.getByTestId('open-rating-btn')).toHaveTextContent('Bewertung ändern');
    expect(handleClose).not.toHaveBeenCalled();
  });
});

