import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { RadarChart } from '../src/components/RadarChart';
import { RatingModal } from '../src/components/RatingModal';
import { BoulderSheet } from '../src/components/BoulderSheet';
import { ToastHost, hideToast } from '../src/components/ui/Toast';
import { ClimberSectorView } from '../src/components/ClimberSectorView';
import {
  WallBoulder,
  GymGradeScale,
  Sector,
  CurrentUser,
  RadarAttributes
} from '../src/types/boulder';
import { resetAscentAndRatingStorage, getUserAscent, getComments } from '../src/lib/ratingAndAscentService';

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

  describe('BoulderSheet (AC-1, AC-3, AC-8, AC-9)', () => {
    it('displays boulder details, barometer, logging buttons, and ascent feed', () => {
      render(
        <BoulderSheet
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          onClose={vi.fn()}
        />
      );

      // Verify Header details (AC-1)
      expect(screen.getByTestId('boulder-sheet-title')).toHaveTextContent('Dyno King');
      expect(screen.getByText(/Fortgeschritten/)).toBeInTheDocument();
      expect(screen.getByText(/Überhang 45°/)).toBeInTheDocument();

      // Verify 3 ascent buttons (AC-3)
      expect(screen.getByTestId('log-flash-btn')).toHaveTextContent('Flash');
      expect(screen.getByTestId('log-top-btn')).toHaveTextContent('Top');
      expect(screen.getByTestId('log-project-btn')).toHaveTextContent('Projekt');

      // Details aufklappen
      fireEvent.click(screen.getByTestId('boulder-sheet-more'));
      const details = screen.getByTestId('boulder-sheet-details');

      // Verify Barometer & Stars (AC-8)
      expect(within(details).getByTestId('grade-barometer')).toBeInTheDocument();
      expect(within(details).getByText('Community')).toBeInTheDocument();
      expect(within(details).getByText(/\d+ Bewertungen?/)).toBeInTheDocument();

      // Verify Ascent feed (AC-9) - seed has HansDereinfacheKletterer and AdminMinimum
      const feed = within(details).getByTestId('community-ratings-section');
      expect(within(feed).getAllByText('HansDereinfacheKletterer').length).toBeGreaterThan(0);
      expect(within(feed).getAllByText('AdminMinimum').length).toBeGreaterThan(0);
    });

    it('allows logging a Top and updates UI', () => {
      const handleClose = vi.fn();

      const { unmount } = render(
        <>
          <BoulderSheet
            boulder={sampleBoulder}
            sector={sampleSector}
            gradeScale={sampleGradeScale}
            currentUser={sampleUser}
            onClose={handleClose}
          />
          <ToastHost />
        </>
      );

      expect(screen.getByTestId('log-top-btn')).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(screen.getByTestId('log-top-btn'));

      expect(getUserAscent(sampleUser.id, sampleBoulder.id)?.type).toBe('top');
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('toast')).toHaveTextContent('Top geloggt');
      act(() => hideToast());
      unmount();

      // Beim erneuten Öffnen ist «Top» als aktiv markiert
      render(
        <BoulderSheet
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByTestId('log-top-btn')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('log-flash-btn')).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders route discussion feed and allows posting a beta comment', () => {
      render(
        <BoulderSheet
          boulder={sampleBoulder}
          sector={sampleSector}
          gradeScale={sampleGradeScale}
          currentUser={sampleUser}
          onClose={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('boulder-sheet-more'));

      // Verify discussion section exists
      expect(screen.getByRole('heading', { name: /Beta/ })).toBeInTheDocument();
      // Seed comment is shown
      expect(screen.getByText(/Der Dyno geht super/i)).toBeInTheDocument();

      // Submit new comment
      const input = screen.getByTestId('boulder-comment-input');
      const submitBtn = screen.getByTestId('boulder-comment-submit');

      fireEvent.change(input, { target: { value: 'Crux mit links blockieren!' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Crux mit links blockieren!')).toBeInTheDocument();
      expect(getComments(sampleBoulder.id).some(c => c.text === 'Crux mit links blockieren!')).toBe(true);
    });
  });

  describe('ClimberSectorView (AC-1, AC-10, AC-11)', () => {
    it('renders sector name and wall photo with active boulder pins', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

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

    it('provides the four SPEC-022 filter chips without sort dropdown or reset link (AC-11)', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

      expect(screen.getByTestId('filter-chip-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-open')).toBeInTheDocument();
      expect(screen.getByTestId('filter-chip-top_rated')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Beliebt/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /Beste Bewertung/i })).not.toBeInTheDocument();

      // «Top» filtert auf ≥ 4 Sterne
      fireEvent.click(screen.getByTestId('filter-chip-top_rated'));
      expect(screen.getByTestId('filter-chip-top_rated')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Filter zurücksetzen')).not.toBeInTheDocument();

      // «Alle» setzt zurück
      fireEvent.click(screen.getByTestId('filter-chip-all'));
      expect(screen.getByTestId('filter-chip-all')).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders AC-18: compact star score and Hallen-Klassiker ring in the route list', () => {
      render(<ClimberSectorView currentUser={sampleUser} />);

      // boulder-existing-2 has 1 rating of 5 stars -> Hallen-Klassiker (Ring am Farbpunkt statt Banner)
      expect(screen.getByTestId('five-star-ribbon')).toBeInTheDocument();
      expect(screen.queryByText(/5.0 HALLEN-KLASSIKER/i)).not.toBeInTheDocument();

      const fiveStarHero = screen.getByTestId('hero-score-boulder-existing-2');
      expect(fiveStarHero).toHaveTextContent('5.0');

      // boulder-existing-1 has 3 ratings (5, 4, 4) -> 4.3 stars
      const ratedHero = screen.getByTestId('hero-score-boulder-existing-1');
      expect(ratedHero).toHaveTextContent('4.3');
      expect(ratedHero).not.toHaveTextContent(/Vote/i);
    });
  });
});
