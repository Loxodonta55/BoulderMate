import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { navigationHistory } from '../src/lib/navigationHistory';
import { App } from '../src/App';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { UserProfileView } from '../src/components/UserProfileView';
import { BatchBoulderWorkflow } from '../src/components/BatchBoulderWorkflow';
import { GymManagement } from '../src/components/GymManagement';
import { resetAllGymData, createGym, createSector, CURRENT_USER } from '../src/lib/gymStorage';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';
import { setSessionUser } from '../src/lib/authService';
import { WallBoulder, DEFAULT_RADAR, GymGradeScale } from '../src/types/boulder';

const mockGradeScale: GymGradeScale = {
  id: 'scale-yellow',
  gymId: 'gym-test',
  colorName: 'Gelb',
  colorHex: '#FACC15',
  difficultyLabel: 'Leicht',
  fontRangeMin: '3',
  fontRangeMax: '4',
  sortOrder: 1,
};

const mockBoulder: WallBoulder = {
  id: 'boulder-spec015-1',
  sectorId: 'sec-1',
  name: 'Test Traverse',
  gradeScaleId: 'scale-yellow',
  positionX: 0.4,
  positionY: 0.6,
  status: 'active',
  setterId: 'setter-1',
  createdAt: new Date().toISOString(),
  radar: DEFAULT_RADAR,
};

describe('SPEC-015: Mobile-First Android Back-Button & Hierarchical Navigation', () => {
  beforeEach(() => {
    resetAllGymData();
    clearBatchServiceStorage();
    navigationHistory.reset();
  });

  afterEach(() => {
    navigationHistory.reset();
  });

  describe('1) NavigationHistoryManager Core Unit Tests', () => {
    it('pushes handlers onto the LIFO stack and invokes them in reverse order on popstate', () => {
      const order: string[] = [];
      const onBack1 = vi.fn(() => order.push('first'));
      const onBack2 = vi.fn(() => order.push('second'));

      navigationHistory.push('layer-1', onBack1);
      expect(navigationHistory.size).toBe(1);

      navigationHistory.push('layer-2', onBack2);
      expect(navigationHistory.size).toBe(2);

      // Simulate first Android Hardware Back tap
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(onBack2).toHaveBeenCalledTimes(1);
      expect(onBack1).not.toHaveBeenCalled();
      expect(navigationHistory.size).toBe(1);
      expect(order).toEqual(['second']);

      // Simulate second Android Hardware Back tap
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(onBack1).toHaveBeenCalledTimes(1);
      expect(navigationHistory.size).toBe(0);
      expect(order).toEqual(['second', 'first']);
    });

    it('cleans up history without ghost entries when UI action pops an entry', () => {
      const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      const onBack = vi.fn();
      navigationHistory.push('modal-test', onBack);
      expect(navigationHistory.size).toBe(1);

      // UI button triggers close (pop)
      act(() => {
        navigationHistory.pop('modal-test');
      });

      expect(historyBackSpy).toHaveBeenCalled();
      expect(navigationHistory.size).toBe(0);
      expect(onBack).not.toHaveBeenCalled();

      historyBackSpy.mockRestore();
    });
  });

  describe('2) BoulderDetailModal & Nested Overlays (AC-15.1)', () => {
    it('closes RatingModal on back without closing BoulderDetailModal', () => {
      const onClose = vi.fn();

      render(
        <BoulderDetailModal
          boulder={mockBoulder}
          gradeScale={mockGradeScale}
          currentUser={{ id: 'climber-1', nickname: 'Climber 1', role: 'member', isPlatformAdmin: false }}
          isOpen={true}
          onClose={onClose}
        />
      );

      // Open RatingModal by clicking "Jetzt bewerten"
      const rateButton = screen.getByRole('button', { name: /Jetzt bewerten/i });
      fireEvent.click(rateButton);

      expect(screen.getByText(/Schritt 1\/2/i)).toBeInTheDocument();
      expect(navigationHistory.has(`boulder-rating-modal-${mockBoulder.id}`)).toBe(true);

      // Android Hardware Back pressed: should close RatingModal ONLY
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(screen.queryByText(/Schritt 1\/2/i)).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled(); // BoulderDetailModal is still open!
      expect(navigationHistory.has(`boulder-rating-modal-${mockBoulder.id}`)).toBe(false);
    });
  });

  describe('3) ClimberSectorView: Fullscreen & Modal Back Handling (AC-15.2)', () => {
    it('exits fullscreen mode when back button is pressed', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Wand 1', wall_photo_url: '/img1.jpg' });

      render(
        <ClimberSectorView
          currentUser={{ id: 'climber-1', nickname: 'Climber 1', role: 'member', isPlatformAdmin: false }}
          activeGymId="gym-test"
        />
      );

      const fullscreenBtn = screen.getByTestId('toggle-fullscreen-btn');
      fireEvent.click(fullscreenBtn);
      expect(screen.getByTestId('sector-fullscreen-modal')).toBeInTheDocument();
      expect(navigationHistory.has('fullscreen-sector')).toBe(true);

      // Simulate Android Back Button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(screen.queryByTestId('sector-fullscreen-modal')).not.toBeInTheDocument();
      expect(navigationHistory.has('fullscreen-sector')).toBe(false);
    });
  });

  describe('4) Tab Navigation: Stats -> Wall (AC-15.3)', () => {
    it('navigates from Meine Statistiken tab back to Wand & Sektoren tab on back press', () => {
      setSessionUser('hans-kletterer');
      render(<App />);

      // Switch to stats tab
      const statsTabBtn = screen.getByTestId('tab-stats');
      fireEvent.click(statsTabBtn);

      expect(screen.getByTestId('user-profile-view')).toBeInTheDocument();
      expect(navigationHistory.has('tab-stats')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Should return to Wall tab
      expect(screen.queryByTestId('user-profile-view')).not.toBeInTheDocument();
      expect(navigationHistory.has('tab-stats')).toBe(false);
    });
  });

  describe('5) Sub-Tab Navigation in Profile (AC-15.4)', () => {
    it('navigates from Deep Dive back to Overall subtab on back press', () => {
      render(
        <UserProfileView
          currentUser={{ id: 'hans-kletterer', nickname: 'Hans', role: 'member', isPlatformAdmin: false }}
          initialSubTab="overall"
        />
      );

      // Switch to deep dive subtab
      const deepDiveTab = screen.getByTestId('subtab-deep-dive');
      fireEvent.click(deepDiveTab);

      expect(screen.getByTestId('deep-dive-view')).toBeInTheDocument();
      expect(navigationHistory.has('profile-subtab-deep-dive')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Should return to overall subtab
      expect(screen.queryByTestId('deep-dive-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('private-logbook-section')).toBeInTheDocument();
      expect(navigationHistory.has('profile-subtab-deep-dive')).toBe(false);
    });

    it('navigates from Stil & Stärken segment back to Übersicht segment on back press', () => {
      render(
        <UserProfileView
          currentUser={{ id: 'hans-kletterer', nickname: 'Hans', role: 'member', isPlatformAdmin: false }}
          initialSubTab="overall"
        />
      );

      // Switch to performance segment
      const performanceSegmentBtn = screen.getByTestId('tab-segment-performance');
      fireEvent.click(performanceSegmentBtn);

      expect(screen.getByTestId('athlete-performance-view')).toBeInTheDocument();
      expect(navigationHistory.has('profile-segment-performance')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Should return to overview segment
      expect(screen.queryByTestId('athlete-performance-view')).not.toBeInTheDocument();
      expect(navigationHistory.has('profile-segment-performance')).toBe(false);
    });

    it('closes ProfileSettingsModal on back press', () => {
      render(
        <UserProfileView
          currentUser={{ id: 'hans-kletterer', nickname: 'Hans', role: 'member', isPlatformAdmin: false }}
          initialSubTab="overall"
        />
      );

      const settingsBtn = screen.getByTestId('btn-open-settings');
      fireEvent.click(settingsBtn);

      expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
      expect(navigationHistory.has('profile-settings-modal')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(screen.queryByRole('heading', { name: 'Einstellungen' })).not.toBeInTheDocument();
      expect(navigationHistory.has('profile-settings-modal')).toBe(false);
    });
  });

  describe('6) Workspace Mode Switching (AC-15.5)', () => {
    it('returns from Schrauber-Studio back to Kletterer-App on back press', () => {
      setSessionUser('user-boris');
      render(<App />);

      // Boris selects Schrauber-Studio in role gateway
      const setterOption = screen.getByRole('button', { name: /Schrauber-Studio/i });
      fireEvent.click(setterOption);

      expect(screen.getByText(/Batch-Schraubermodus/i)).toBeInTheDocument();
      expect(navigationHistory.has('mode-privileged')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Returns to climber mode
      expect(navigationHistory.has('mode-privileged')).toBe(false);
    });
  });

  describe('7) Schrauber-Studio & Admin-Konsole Internal Back Handling', () => {
    it('closes photo modal in BatchBoulderWorkflow on back press', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });
      createSector('gym-test', CURRENT_USER.id, { name: 'Sektor Wand 1', wall_photo_url: '/img1.jpg' });

      render(
        <BatchBoulderWorkflow
          currentRole="setter"
          currentUserId="setter-1"
          activeGymId="gym-test"
        />
      );

      // Open Photo Modal
      const photoBtn = screen.getByTestId('sector-new-photo-btn');
      fireEvent.click(photoBtn);

      expect(navigationHistory.has('setter-photo-modal')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(navigationHistory.has('setter-photo-modal')).toBe(false);
    });

    it('returns from grading tab back to sectors tab in GymManagement on back press', () => {
      createGym({ id: 'gym-test', name: 'Test Gym' });

      render(
        <GymManagement
          activeGymId="gym-test"
          userId="user-boris"
        />
      );

      // Switch to grading tab
      const gradingTab = screen.getByRole('button', { name: /Farbsystem/i });
      fireEvent.click(gradingTab);

      expect(navigationHistory.has('admin-tab-grading')).toBe(true);

      // Press Android Back button
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(navigationHistory.has('admin-tab-grading')).toBe(false);
    });
  });
});
