import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileKPIsBar } from '../src/components/ProfileKPIsBar';
import { GradeDistributionChart } from '../src/components/GradeDistributionChart';
import { ProfileSettingsModal } from '../src/components/ProfileSettingsModal';
import { PublicProfileModal } from '../src/components/PublicProfileModal';
import { UserProfileView } from '../src/components/UserProfileView';
import { ProfileKPIs, GradeDistributionItem, CurrentUser } from '../src/types/boulder';
import { resetProfileStorage } from '../src/lib/profileService';
import { resetAscentAndRatingStorage } from '../src/lib/ratingAndAscentService';
import { clearBatchServiceStorage } from '../src/lib/batchBoulderService';

const mockScale = {
  id: 'scale-red',
  gymId: 'gym-minimum-zh',
  colorName: 'Rot',
  colorHex: '#ef4444',
  difficultyLabel: 'Schwer',
  fontRangeMin: '7a+',
  fontRangeMax: '7b+',
  sortOrder: 4,
};

const mockScaleBlue = {
  id: 'scale-blue',
  gymId: 'gym-minimum-zh',
  colorName: 'Blau',
  colorHex: '#3b82f6',
  difficultyLabel: 'Mittel',
  fontRangeMin: '5c',
  fontRangeMax: '6b',
  sortOrder: 2,
};

describe('SPEC-004: UI Components Integration', () => {
  beforeEach(() => {
    resetProfileStorage();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
  });

  describe('ProfileKPIsBar (AC-2, AC-8)', () => {
    it('renders 4 KPI tiles with values and badges, showing Fontainebleau grade prominently', () => {
      const kpis: ProfileKPIs = {
        totalTops: 14,
        totalFlashes: 5,
        bestTop: mockScale,
        bestFlash: mockScaleBlue,
        bestTopFont: '7b+',
        bestFlashFont: '6b',
      };

      render(<ProfileKPIsBar kpis={kpis} />);

      expect(screen.getByTestId('kpi-total-tops').textContent).toBe('14');
      expect(screen.getByTestId('kpi-total-flashes').textContent).toBe('5');
      expect(screen.getByTestId('kpi-best-top').textContent).toContain('Fb 7b+');
      expect(screen.getByTestId('kpi-best-top').textContent).toContain('Rot');
      expect(screen.getByTestId('kpi-best-flash').textContent).toContain('Fb 6b');
      expect(screen.getByTestId('kpi-best-flash').textContent).toContain('Blau');
    });

    it('renders dashes "–" when best top and best flash are null (empty state)', () => {
      const kpis: ProfileKPIs = {
        totalTops: 0,
        totalFlashes: 0,
        bestTop: null,
        bestFlash: null,
      };

      render(<ProfileKPIsBar kpis={kpis} />);

      expect(screen.getByTestId('kpi-total-tops').textContent).toBe('0');
      expect(screen.getByTestId('kpi-total-flashes').textContent).toBe('0');
      expect(screen.getByTestId('kpi-best-top').textContent).toBe('–');
      expect(screen.getByTestId('kpi-best-flash').textContent).toBe('–');
    });
  });

  describe('GradeDistributionChart (AC-3, AC-8)', () => {
    it('renders empty state message when 0 ascents exist (AC-8)', () => {
      const emptyDistribution: GradeDistributionItem[] = [
        { gradeScale: mockScaleBlue, fontGrade: '6a', topCount: 0, flashCount: 0, totalCount: 0 },
      ];

      render(<GradeDistributionChart distribution={emptyDistribution} />);

      expect(screen.getByTestId('empty-distribution-state')).toBeInTheDocument();
      expect(screen.getByText(/Noch keine Begehungen erfasst/i)).toBeInTheDocument();
    });

    it('renders horizontal bars when ascents exist with Fontainebleau grades (AC-3)', () => {
      const distribution: GradeDistributionItem[] = [
        { gradeScale: mockScaleBlue, fontGrade: '6a', topCount: 3, flashCount: 2, totalCount: 5 },
        { gradeScale: mockScale, fontGrade: '7b+', topCount: 1, flashCount: 0, totalCount: 1 },
      ];

      render(<GradeDistributionChart distribution={distribution} />);

      expect(screen.getByTestId('grade-distribution-bars')).toBeInTheDocument();
      expect(screen.getByText('Fb 6a')).toBeInTheDocument();
      expect(screen.getByText('Blau')).toBeInTheDocument();
      expect(screen.getByText('Fb 7b+')).toBeInTheDocument();
      expect(screen.getByText('Rot')).toBeInTheDocument();
    });
  });

  describe('ProfileSettingsModal (AC-7)', () => {
    it('allows updating nickname and saving', () => {
      const onSave = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileSettingsModal
          profile={{ id: 'user-boris', nickname: 'Boris', createdAt: '2026-05-15T00:00:00Z' }}
          isOpen={true}
          onClose={onClose}
          onSave={onSave}
          onLogout={vi.fn()}
          onDeleteAccount={vi.fn()}
        />
      );

      const input = screen.getByTestId('input-nickname');
      fireEvent.change(input, { target: { value: 'Boris Bergsteiger' } });

      const saveBtn = screen.getByTestId('btn-save-profile');
      fireEvent.click(saveBtn);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'Boris Bergsteiger' })
      );
    });

    it('requires confirmation before deleting account', () => {
      const onDelete = vi.fn();

      render(
        <ProfileSettingsModal
          profile={{ id: 'user-boris', nickname: 'Boris', createdAt: '2026-05-15T00:00:00Z' }}
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          onLogout={vi.fn()}
          onDeleteAccount={onDelete}
        />
      );

      // Trigger deletion dialog
      const triggerBtn = screen.getByTestId('btn-delete-account-trigger');
      fireEvent.click(triggerBtn);

      expect(screen.getByTestId('delete-account-confirmation')).toBeInTheDocument();

      // Click confirm
      const confirmBtn = screen.getByTestId('btn-confirm-delete-account');
      fireEvent.click(confirmBtn);

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('PublicProfileModal (AC-6)', () => {
    it('renders header, KPIs, and grade distribution, but strictly NO logbook and NO settings gear', () => {
      render(
        <PublicProfileModal
          userId="hans-kletterer"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('public-profile-modal')).toBeInTheDocument();
      expect(screen.getByText(/HansDereinfacheKletterer/i)).toBeInTheDocument();
      expect(screen.getByTestId('kpi-total-tops')).toBeInTheDocument();

      // Ensure logbook section does NOT exist
      expect(screen.queryByTestId('private-logbook-section')).not.toBeInTheDocument();
      // Ensure settings gear does NOT exist
      expect(screen.queryByTestId('btn-open-settings')).not.toBeInTheDocument();
      // Ensure private notice is shown
      expect(screen.getByText(/Das persönliche Logbuch dieses Kletterers ist privat/i)).toBeInTheDocument();
    });
  });

  describe('UserProfileView (AC-1, AC-4, AC-5)', () => {
    it('renders complete profile view with header, settings button, gym filter, and logbook', () => {
      const user: CurrentUser = {
        id: 'hans-kletterer',
        nickname: 'HansDereinfacheKletterer',
        role: 'member',
      };

      render(<UserProfileView currentUser={user} />);

      // AC-1: Header with nickname, join date, settings button
      expect(screen.getByTestId('profile-nickname').textContent).toBe('HansDereinfacheKletterer');
      expect(screen.getByTestId('btn-open-settings')).toBeInTheDocument();

      // AC-4: Gym filter dropdown
      expect(screen.getByTestId('select-gym-filter')).toBeInTheDocument();

      // AC-5: Private Logbook section
      expect(screen.getByTestId('private-logbook-section')).toBeInTheDocument();
    });
  });
});
