import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { WallPhotoCanvas } from '../src/components/WallPhotoCanvas';
import { createGym, createSector, resetAllGymData, CURRENT_USER } from '../src/lib/gymStorage';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { CurrentUser, GymGradeScale, WallBoulder, DEFAULT_RADAR } from '../src/types/boulder';

const CURRENT_CLIMBER: CurrentUser = {
  id: 'climber-hans',
  nickname: 'Hans',
  role: 'member',
  isPlatformAdmin: false,
};

const sampleGradeScales: GymGradeScale[] = [
  {
    id: 'scale-yellow',
    gymId: 'gym-test',
    colorName: 'Gelb',
    colorHex: '#eab308',
    difficultyLabel: 'Einfach',
    fontRangeMin: '4a',
    fontRangeMax: '5b',
    sortOrder: 1,
  },
  {
    id: 'scale-blue',
    gymId: 'gym-test',
    colorName: 'Blau',
    colorHex: '#3b82f6',
    difficultyLabel: 'Mittel',
    fontRangeMin: '5c',
    fontRangeMax: '6b',
    sortOrder: 2,
  },
];

const testBoulders: WallBoulder[] = [
  {
    id: 'boulder-fs-1',
    sectorId: 'sec-1',
    gradeScaleId: 'scale-yellow',
    positionX: 0.35,
    positionY: 0.65,
    name: 'Wand Route Gelb',
    setterId: 'setter-boris',
    status: 'active',
    radar: { ...DEFAULT_RADAR },
    createdAt: '2026-09-12T10:00:00Z',
  },
];

describe('Climber Fullscreen Wall Optimization & Navigation Suite', () => {
  beforeEach(() => {
    resetAllGymData();
    clearBatchServiceStorage();
  });

  describe('1) Fullscreen Mode Layout (Zero Header & Zero Footer — Req 1, 1a, 1b)', () => {
    it('enters fullscreen mode and renders pure wall edge-to-edge without header or footer', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      // 1. Enter fullscreen
      const fullscreenBtn = screen.getByTestId('toggle-fullscreen-btn');
      fireEvent.click(fullscreenBtn);

      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      expect(fullscreenModal).toBeInTheDocument();
      expect(fullscreenModal.className).toContain('fixed inset-0');
      expect(fullscreenModal.className).toContain('bg-black');
      expect(fullscreenModal.className).toContain('h-[100dvh]');

      // 2. Req 1a & 1b: Verify there are NO static header bars or footer bars taking layout space in fullscreen
      expect(screen.queryByText(/Boulder aktiv/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Vorheriger Sektor/i)).not.toBeInTheDocument();

      // 3. Floating exit button exists and functions
      const exitBtn = screen.getByTestId('exit-fullscreen-btn');
      expect(exitBtn).toBeInTheDocument();
      expect(exitBtn.className).toContain('absolute');

      // 4. Floating minimal HUD displays sector name and counter
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');
      expect(hud).toHaveTextContent('Sektor Alpha');
      expect(hud).toHaveTextContent('1/2');

      // 5. Exit fullscreen
      fireEvent.click(exitBtn);
      expect(screen.queryByTestId('sector-fullscreen-modal')).not.toBeInTheDocument();
    });
  });

  describe('2) Immediate Sector Switching (Swipe, Wheel, Keyboard, Arrows — Req 2)', () => {
    it('immediately switches to next sector on left swipe during touchmove', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      fireEvent.click(screen.getByTestId('toggle-fullscreen-btn'));
      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');
      expect(hud).toHaveTextContent('Sektor Alpha');

      // Touch start at clientX = 200, clientY = 100
      fireEvent.touchStart(fullscreenModal, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      // Swipe left by 50px (clientX = 150)
      fireEvent.touchMove(fullscreenModal, {
        touches: [{ clientX: 150, clientY: 102 }],
      });

      // Swiping left triggers next sector immediately
      expect(hud).toHaveTextContent('Sektor Beta');
      expect(hud).toHaveTextContent('2/2');
    });

    it('immediately switches to previous sector on right swipe and wraps around', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      fireEvent.click(screen.getByTestId('toggle-fullscreen-btn'));
      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');

      // Swipe right from Sektor Alpha -> wraps around to Sektor Beta
      fireEvent.touchStart(fullscreenModal, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(fullscreenModal, {
        touches: [{ clientX: 160, clientY: 100 }],
      });

      expect(hud).toHaveTextContent('Sektor Beta');
    });

    it('switches sector on keyboard ArrowRight and ArrowLeft in fullscreen', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      fireEvent.click(screen.getByTestId('toggle-fullscreen-btn'));
      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');

      // Press ArrowRight
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });
      expect(hud).toHaveTextContent('Sektor Beta');

      // Press ArrowLeft
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });
      expect(hud).toHaveTextContent('Sektor Alpha');
    });

    it('switches sector on horizontal mouse wheel / trackpad swipe', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      fireEvent.click(screen.getByTestId('toggle-fullscreen-btn'));
      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');

      // Horizontal wheel right
      fireEvent.wheel(fullscreenModal, { deltaX: 50, deltaY: 0 });
      expect(hud).toHaveTextContent('Sektor Beta');
    });

    it('switches sector when tapping lateral floating arrow buttons', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Alpha', wall_photo_url: '/img-alpha.jpg' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Beta', wall_photo_url: '/img-beta.jpg' });

      render(
        <ClimberSectorView
          currentUser={CURRENT_CLIMBER}
          activeGymId="gym-test"
        />
      );

      fireEvent.click(screen.getByTestId('toggle-fullscreen-btn'));
      const fullscreenModal = screen.getByTestId('sector-fullscreen-modal');
      const hud = within(fullscreenModal).getByTestId('fullscreen-sector-hud');

      const nextSectorBtn = screen.getByTestId('fullscreen-next-sector-btn');
      fireEvent.click(nextSectorBtn);
      expect(hud).toHaveTextContent('Sektor Beta');

      const prevSectorBtn = screen.getByTestId('fullscreen-prev-sector-btn');
      fireEvent.click(prevSectorBtn);
      expect(hud).toHaveTextContent('Sektor Alpha');
    });
  });

  describe('3) Ideal Image Adaptation & Zooming (Req 3)', () => {
    it('adapts image in fullscreen mode and preserves pin coordinates', () => {
      const onPinClick = vi.fn();

      render(
        <WallPhotoCanvas
          mode="climber"
          photoUrl="/img-wall.jpg"
          sectorName="Test Wand"
          boulders={testBoulders}
          gradeScales={sampleGradeScales}
          isFullscreen={true}
          onPinClick={onPinClick}
        />
      );

      // Verify image uses object-fill in fullscreen to prevent letterbox mismatch
      const img = screen.getByAltText('Test Wand');
      expect(img.className).toContain('object-fill');
      expect(img.className).toContain('w-full');
      expect(img.className).toContain('h-full');

      // Verify pin exists with exact relative percentage coordinates
      const pin = screen.getByTestId('pin-boulder-fs-1');
      expect(pin).toBeInTheDocument();
      expect(pin.style.left).toBe('35%');
      expect(pin.style.top).toBe('65%');

      // Click pin
      fireEvent.click(pin);
      expect(onPinClick).toHaveBeenCalledWith(testBoulders[0]);
    });

    it('renders floating zoom controls in fullscreen and adjusts zoom level', () => {
      render(
        <WallPhotoCanvas
          mode="climber"
          photoUrl="/img-wall.jpg"
          sectorName="Test Wand"
          boulders={testBoulders}
          gradeScales={sampleGradeScales}
          isFullscreen={true}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();

      // Click zoom in
      const zoomInBtn = screen.getByRole('button', { name: /Vergr/i });
      fireEvent.click(zoomInBtn);
      expect(screen.getByText('125%')).toBeInTheDocument();

      // Click zoom out
      const zoomOutBtn = screen.getByRole('button', { name: /Verkleinern/i });
      fireEvent.click(zoomOutBtn);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('4) Landscape Orientation & Complete Route Name Suppression (User Follow-up Requirements)', () => {
    it('strictly suppresses route name badges on climber wall pins in all modes (fullscreen and normal view)', () => {
      // Simulate rotating mobile phone into landscape (844px wide > 640px sm breakpoint)
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 844 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 390 });

      // 1. In fullscreen mode: route names MUST NOT be rendered under pins
      const { unmount } = render(
        <WallPhotoCanvas
          mode="climber"
          photoUrl="/img-wall.jpg"
          sectorName="Test Wand"
          boulders={testBoulders}
          gradeScales={sampleGradeScales}
          isFullscreen={true}
        />
      );

      expect(screen.queryByText('Wand Route Gelb')).not.toBeInTheDocument();
      unmount();

      // 2. In normal view: route names MUST ALSO NOT be rendered under pins
      render(
        <WallPhotoCanvas
          mode="climber"
          photoUrl="/img-wall.jpg"
          sectorName="Test Wand"
          boulders={testBoulders}
          gradeScales={sampleGradeScales}
          isFullscreen={false}
        />
      );

      expect(screen.queryByText('Wand Route Gelb')).not.toBeInTheDocument();
    });

    it('constrains canvas container with maxWidth 100% and maxHeight 100% in fullscreen to prevent edge clipping', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 844 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 390 });

      render(
        <WallPhotoCanvas
          mode="climber"
          photoUrl="/img-wall.jpg"
          sectorName="Test Wand"
          boulders={testBoulders}
          gradeScales={sampleGradeScales}
          isFullscreen={true}
        />
      );

      const img = screen.getByAltText('Test Wand');
      const container = img.parentElement as HTMLElement;
      expect(container).toBeInTheDocument();
      expect(container.style.maxWidth).toBe('100%');
      expect(container.style.maxHeight).toBe('100%');
      // minWidth must NOT be set to prevent horizontal edge cut-off
      expect(container.style.minWidth).toBe('');
    });
  });
});