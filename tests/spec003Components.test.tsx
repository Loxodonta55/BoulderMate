import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarChart } from '../src/components/RadarChart';
import { RatingModal } from '../src/components/RatingModal';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import {
  WallBoulder,
  GymGradeScale,
  Sector,
  CurrentUser,
  RadarAttributes
} from '../src/types/boulder';
import { resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';

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

const sampleUser: CurrentUser = {
  id: 'user-boris',
  nickname: 'Boris',
  role: 'member',
};

describe('SPEC-003: UI Components Integration', () => {
  beforeEach(() => {
    resetAscentAndRatingStorage();
  });

  describe('RadarChart (AC-2)', () => {
    it('renders all 6 axes with correct German labels and values', () => {
      render(<RadarChart data={sampleRadar} size={280} />);

      expect(screen.getByText('Max-Kraft')).toBeInTheDocument();
      expect(screen.getByText('Kraft-Ausd.')).toBeInTheDocument();
      expect(screen.getByText('Technik')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
      expect(screen.getByText('Koordination')).toBeInTheDocument();
      expect(screen.getByText('Flexibilität')).toBeInTheDocument();

      // Check values rendered
      expect(screen.getByText('4.0/5')).toBeInTheDocument();
      expect(screen.getAllByText('3.0/5').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('5.0/5')).toBeInTheDocument();
    });
  });

  describe('RatingModal (AC-4, AC-5, AC-6, AC-7)', () => {
    it('renders Soft/Fair/Stiff options, stars, and saves user rating', () => {
      const handleSave = vi.fn();
      const handleClose = vi.fn();

      render(
        <RatingModal
          boulder={sampleBoulder}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          existingRating={null}
          isOpen={true}
          onClose={handleClose}
          onSave={handleSave}
        />
      );

      // Verify AC-6 Soft/Fair/Stiff buttons exist
      expect(screen.getByText('Soft')).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
      expect(screen.getByText('Stiff')).toBeInTheDocument();

      // Select Soft
      fireEvent.click(screen.getByText('Soft'));

      // Click save
      const saveBtn = screen.getByText('Bewertung speichern');
      fireEvent.click(saveBtn);

      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          gradeFeel: 'soft',
          qualityStars: 5,
        })
      );
    });

    it('shows skip button when triggered automatically by ascent (AC-4)', () => {
      const handleClose = vi.fn();

      render(
        <RatingModal
          boulder={sampleBoulder}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          existingRating={null}
          isOpen={true}
          isTriggeredByAscent={true}
          onClose={handleClose}
          onSave={vi.fn()}
        />
      );

      const skipBtn = screen.getByText('Überspringen');
      expect(skipBtn).toBeInTheDocument();
      fireEvent.click(skipBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('BoulderDetailModal (AC-1, AC-3, AC-8, AC-9)', () => {
    it('displays boulder details, barometer, logging buttons, and ascent feed', () => {
      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Verify Header details (AC-1)
      expect(screen.getByText('Dyno King')).toBeInTheDocument();
      expect(screen.getByText('Fortgeschritten')).toBeInTheDocument();
      expect(screen.getByText('Überhang 45°')).toBeInTheDocument();

      // Verify 3 ascent buttons (AC-3)
      expect(screen.getAllByText('Flash').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Top').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Projekt').length).toBeGreaterThan(0);

      // Verify Barometer & Stars (AC-8)
      expect(screen.getByText('Grad-Barometer')).toBeInTheDocument();
      expect(screen.getByText('Community-Bewertung')).toBeInTheDocument();

      // Verify Ascent feed (AC-9) - seed has HansDereinfacheKletterer and AdminMinimum
      expect(screen.getAllByText('HansDereinfacheKletterer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AdminMinimum').length).toBeGreaterThan(0);
    });

    it('allows logging a Top and updates UI', () => {
      const handleDataChanged = vi.fn();

      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          isOpen={true}
          onClose={vi.fn()}
          onDataChanged={handleDataChanged}
        />
      );

      const topBtn = screen.getByRole('button', { name: /Top/i });
      fireEvent.click(topBtn);

      expect(handleDataChanged).toHaveBeenCalled();
    });

    it('renders route discussion feed and allows posting a beta comment', () => {
      const handleDataChanged = vi.fn();

      render(
        <BoulderDetailModal
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          isOpen={true}
          onClose={vi.fn()}
          onDataChanged={handleDataChanged}
        />
      );

      // Verify discussion section exists
      expect(screen.getByText(/Routen-Diskussion & Beta/i)).toBeInTheDocument();
      // Seed comment is shown
      expect(screen.getByText(/Der Dyno geht super/i)).toBeInTheDocument();

      // Submit new comment
      const input = screen.getByTestId('boulder-comment-input');
      const submitBtn = screen.getByTestId('boulder-comment-submit');

      fireEvent.change(input, { target: { value: 'Crux mit links blockieren!' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Crux mit links blockieren!')).toBeInTheDocument();
      expect(handleDataChanged).toHaveBeenCalled();
    });
  });

  describe('ClimberSectorView (AC-1, AC-10, AC-11)', () => {
    it('renders sector name and wall photo with active boulder pins', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

      expect(screen.getByText('Sektoren & Wandansicht')).toBeInTheDocument();
      // Should show the sector button
      expect(screen.getAllByText('Überhang 45°').length).toBeGreaterThan(0);

      // Pins on photo have labels
      expect(screen.getAllByText('Dyno King').length).toBeGreaterThan(0);
    });

    it('renders compact micro-ratings and favorite highlights on pins and route cards (AC-10)', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

      // Dyno King has 3 ratings (5, 4, 4) -> avg 4.3 stars
      // Check micro-rating rendered on pin label / route cards
      expect(screen.getAllByText('4.3').length).toBeGreaterThan(0);

      // Dyno King has 4.3 stars >= 4.2, so it has favorite aura / title
      const favoritePin = screen.getByTitle(/Dyno King \(4.3 ★\) \(Tippen für Details\)/i);
      expect(favoritePin).toBeInTheDocument();
    });

    it('provides quick-filter pills and sort dropdown to filter and order routes (AC-11)', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

      // Filter pills exist
      const allFilter = screen.getByRole('button', { name: /Alle/i });
      const topRatedFilter = screen.getByRole('button', { name: /Top-Bewertet/i });
      const popularFilter = screen.getByRole('button', { name: /Beliebt/i });
      const projectsFilter = screen.getByRole('button', { name: /Meine Projekte/i });

      expect(allFilter).toBeInTheDocument();
      expect(topRatedFilter).toBeInTheDocument();
      expect(popularFilter).toBeInTheDocument();
      expect(projectsFilter).toBeInTheDocument();

      // Sort select exists
      expect(screen.getByText(/Sortierung:/i)).toBeInTheDocument();

      // Click "Top-Bewertet"
      fireEvent.click(topRatedFilter);

      // "Filter zurücksetzen" link appears
      const resetBtn = screen.getByText('Filter zurücksetzen');
      expect(resetBtn).toBeInTheDocument();

      // Click reset
      fireEvent.click(resetBtn);
      expect(screen.queryByText('Filter zurücksetzen')).not.toBeInTheDocument();
    });
  });
});
