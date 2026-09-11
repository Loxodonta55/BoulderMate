import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import {
  deleteWallBoulder,
  getWallBoulders,
  createDraftBoulder,
  publishBatch,
} from '../src/lib/batchBoulderService';
import * as gymStorage from '../src/lib/gymStorage';
import {
  getAscents,
  getRatings,
  getComments,
  logAscent,
  saveRating,
  addComment,
} from '../src/lib/ratingAndAscentService';
import { WallBoulder, GymGradeScale, Sector, CurrentUser } from '../src/types/boulder';

describe('Route Loeschen im Kletterbereich (AC-13)', () => {
  const sampleSector: Sector = {
    id: 'sector-delete-test',
    gymId: 'gym-6a-plus',
    name: 'Test Sektor',
    wallPhotoUrl: '/images/walls/6aplus/SlapVorne.jpg',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  };

  const sampleScale: GymGradeScale = {
    id: 'scale_6a_blau',
    gymId: 'gym-6a-plus',
    colorName: 'Blau',
    colorHex: '#3b82f6',
    difficultyLabel: 'Gemütlich',
    fontRangeMin: '3',
    fontRangeMax: '4+',
    sortOrder: 1,
  };

  const sampleBoulder: WallBoulder = {
    id: 'boulder-to-delete-123',
    sectorId: sampleSector.id,
    gradeScaleId: sampleScale.id,
    positionX: 0.5,
    positionY: 0.5,
    name: 'Zu löschende Route',
    setterId: 'schrauber-6aplus',
    status: 'active',
    radar: {
      kraft: 3,
      maximalkraft: 3,
      kraftausdauer: 3,
      technik: 3,
      balance: 3,
      koordination: 3,
      flexibilitaet: 3,
    },
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  const borisUser: CurrentUser = {
    id: 'user-boris',
    nickname: 'Boris',
    role: 'member',
    isPlatformAdmin: true,
  };

  const normalClimber: CurrentUser = {
    id: 'hans-kletterer',
    nickname: 'Hans',
    role: 'member',
    isPlatformAdmin: false,
  };

  beforeEach(() => {
    localStorage.clear();
    gymStorage.ensureInitialGymData();
  });

  describe('deleteWallBoulder Service Logic', () => {
    it('permanently deletes wall boulder and cleans up ratings, ascents, and comments', () => {
      const draft = createDraftBoulder({
        sectorId: sampleSector.id,
        gradeScaleId: sampleScale.id,
        positionX: 0.4,
        positionY: 0.6,
        name: 'Delete Me Route',
        setterId: 'schrauber-6aplus',
      });

      publishBatch(sampleSector.id, 'schrauber-6aplus');
      const activeBouldersBefore = getWallBoulders().filter(b => b.id === draft.id);
      expect(activeBouldersBefore.length).toBe(1);

      logAscent(borisUser.id, borisUser.nickname, draft.id, 'top');
      saveRating(borisUser.id, borisUser.nickname, draft.id, {
        qualityStars: 5,
        gradeFeel: 'fair',
      });
      addComment(borisUser.id, borisUser.nickname, draft.id, 'Toller Boulder!');

      expect(getAscents(draft.id).length).toBe(1);
      expect(getRatings(draft.id).length).toBe(1);
      expect(getComments(draft.id).length).toBe(1);

      deleteWallBoulder(draft.id);

      const activeBouldersAfter = getWallBoulders().filter(b => b.id === draft.id);
      expect(activeBouldersAfter.length).toBe(0);

      expect(getAscents(draft.id).length).toBe(0);
      expect(getRatings(draft.id).length).toBe(0);
      expect(getComments(draft.id).length).toBe(0);
    });

    it('dispatches bouldermate:boulders_updated custom event upon deletion', () => {
      const listener = vi.fn();
      window.addEventListener('bouldermate:boulders_updated', listener);

      deleteWallBoulder('some-dummy-id');

      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener('bouldermate:boulders_updated', listener);
    });
  });

  describe('Route Deletion Isolated from Climber View', () => {
    it('does not render delete buttons in header or footer even for admin/boris in climber view', () => {
      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleScale}
          currentUser={borisUser}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByTestId('delete-boulder-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-boulder-footer-btn')).not.toBeInTheDocument();
    });

    it('does not render delete buttons for normal climbers', () => {
      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleScale}
          currentUser={normalClimber}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByTestId('delete-boulder-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-boulder-footer-btn')).not.toBeInTheDocument();
    });

    it('does not render delete buttons for route setter in climber view', () => {
      const setterUser: CurrentUser = {
        id: 'schrauber-6aplus',
        nickname: 'Schrauber',
        role: 'setter',
        isPlatformAdmin: false,
      };

      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleScale}
          currentUser={setterUser}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByTestId('delete-boulder-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-boulder-footer-btn')).not.toBeInTheDocument();
    });
  });

  describe('ClimberSectorView Integration', () => {
    it('reactively updates and removes route from list upon bouldermate:boulders_updated event', async () => {
      // Create and publish a test boulder in 6a plus default sector
      const sectors = gymStorage.getSectors('gym-6a-plus');
      const targetSector = sectors[0];
      const scales = gymStorage.getGradeScales('gym-6a-plus');

      const testRoute = createDraftBoulder({
        sectorId: targetSector.id,
        gradeScaleId: scales[0].id,
        positionX: 0.3,
        positionY: 0.4,
        name: 'Reactive Delete Boulder',
        setterId: 'schrauber-6aplus',
      });
      publishBatch(targetSector.id, 'schrauber-6aplus');

      render(
        <ClimberSectorView
          currentUser={borisUser}
          activeGymId="gym-6a-plus"
        />
      );

      // Verify route appears in the sector view (both as canvas pin and route card)
      expect(screen.getAllByText('Reactive Delete Boulder').length).toBeGreaterThan(0);

      // Trigger deleteWallBoulder
      act(() => {
        deleteWallBoulder(testRoute.id);
      });

      // Verify route is reactively removed from the view
      await waitFor(() => {
        expect(screen.queryAllByText('Reactive Delete Boulder').length).toBe(0);
      });
    });
  });
});
