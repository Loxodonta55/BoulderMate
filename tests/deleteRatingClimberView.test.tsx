import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { RatingModal } from '../src/components/RatingModal';
import {
  WallBoulder,
  GymGradeScale,
  Sector,
  CurrentUser,
  RadarAttributes,
} from '../src/types/boulder';
import {
  resetAscentAndRatingStorage,
  saveRating,
  getUserRating,
  deleteRating,
} from '../src/lib/ratingAndAscentService';

const sampleRadar: RadarAttributes = {
  maximalkraft: 4,
  kraftausdauer: 3,
  kraft: 4,
  technik: 3,
  balance: 2,
  koordination: 5,
  flexibilitaet: 1,
};

const sampleBoulder: WallBoulder = {
  id: 'boulder-existing-1',
  sectorId: 'sector-overhang',
  gradeScaleId: 'scale-blue',
  positionX: 0.35,
  positionY: 0.42,
  name: 'Dyno King',
  notes: 'Dynamischer Zug an die Leiste',
  setterId: 'setter-1',
  status: 'active',
  radar: sampleRadar,
  createdAt: '2026-08-25T14:00:00Z',
  publishedAt: '2026-08-25T18:00:00Z',
};

const sampleGradeScale: GymGradeScale = {
  id: 'scale-blue',
  gymId: 'gym-minimum-zh',
  colorName: 'Blau',
  colorHex: '#3b82f6',
  difficultyLabel: 'Fortgeschritten',
  fontRangeMin: '5c',
  fontRangeMax: '6b',
  sortOrder: 2,
};

const sampleSector: Sector = {
  id: 'sector-overhang',
  gymId: 'gym-minimum-zh',
  name: 'Überhang 45°',
  wallPhotoUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
  sortOrder: 1,
  createdAt: '2026-09-01T10:00:00Z',
};

const sampleClimber: CurrentUser = {
  id: 'user-climber-99',
  nickname: 'TestClimber',
  role: 'member',
};

describe('SPEC-003 AC-14: Deleting Climber Ratings', () => {
  beforeEach(() => {
    resetAscentAndRatingStorage();
  });

  describe('Service: deleteRating', () => {
    it('removes a saved rating from localStorage and returns true', () => {
      saveRating(sampleClimber.id, sampleClimber.nickname, sampleBoulder.id, {
        qualityStars: 4,
        gradeFeel: 'fair',
      });

      expect(getUserRating(sampleClimber.id, sampleBoulder.id)).not.toBeNull();

      const result = deleteRating(sampleClimber.id, sampleBoulder.id);
      expect(result).toBe(true);
      expect(getUserRating(sampleClimber.id, sampleBoulder.id)).toBeNull();

      // Second deletion should return false
      expect(deleteRating(sampleClimber.id, sampleBoulder.id)).toBe(false);
    });
  });

  describe('RatingModal: delete action', () => {
    it('renders delete button when existingRating is present and invokes onDeleteRating callback', () => {
      const existingRating = saveRating(
        sampleClimber.id,
        sampleClimber.nickname,
        sampleBoulder.id,
        { qualityStars: 5, gradeFeel: 'soft' }
      );

      const handleDelete = vi.fn();
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <RatingModal
          boulder={sampleBoulder}
          gradeScale={sampleGradeScale}
          currentUser={sampleClimber}
          existingRating={existingRating}
          isOpen={true}
          onClose={handleClose}
          onSave={handleSave}
          onDeleteRating={handleDelete}
        />
      );

      const deleteBtn = screen.getByTestId('delete-rating-modal-btn');
      expect(deleteBtn).toBeInTheDocument();

      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('BoulderSheet: delete rating in detail view', () => {
    it('displays user rating row with delete button and deletes rating on click', () => {
      saveRating(
        sampleClimber.id,
        sampleClimber.nickname,
        sampleBoulder.id,
        { qualityStars: 4, gradeFeel: 'stiff' }
      );

      render(
        <>
          <BoulderSheet
            boulder={sampleBoulder}
            sector={sampleSector}
            gradeScale={sampleGradeScale}
            currentUser={sampleClimber}
            onClose={vi.fn()}
          />
          <ToastHost />
        </>
      );

      fireEvent.click(screen.getByTestId('boulder-sheet-more'));

      // Verify user rating is shown
      const ownRow = screen.getByTestId(`community-rating-row-${sampleClimber.id}`);
      expect(ownRow).toHaveTextContent('Stiff');
      expect(screen.getByTestId('open-rating-btn')).toHaveTextContent('Bewertung ändern');

      // Delete button exists
      const deleteRatingBtn = screen.getByTestId('delete-rating-btn');
      expect(deleteRatingBtn).toBeInTheDocument();

      // Click delete rating
      fireEvent.click(deleteRatingBtn);

      // Rating should be deleted from storage
      expect(getUserRating(sampleClimber.id, sampleBoulder.id)).toBeNull();

      // UI should update reactively
      expect(screen.queryByTestId('delete-rating-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId(`community-rating-row-${sampleClimber.id}`)).not.toBeInTheDocument();
      expect(screen.getByTestId('open-rating-btn')).toHaveTextContent('Bewerten');

      // Undo-Toast stellt die Bewertung wieder her
      expect(screen.getByTestId('toast')).toHaveTextContent('Bewertung entfernt');
      fireEvent.click(screen.getByTestId('toast-action'));
      const restored = getUserRating(sampleClimber.id, sampleBoulder.id);
      expect(restored?.qualityStars).toBe(4);
      expect(restored?.gradeFeel).toBe('stiff');
      act(() => hideToast());
    });
  });
});
