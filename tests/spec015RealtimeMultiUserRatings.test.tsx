import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  handleRealtimeRatingChange,
  handleRealtimeAscentChange,
  resolveUserIdAndNickname,
} from '../src/lib/syncService';
import {
  getRatings,
  getAscents,
  saveRating,
  logAscent,
  isUserMatch,
  STORAGE_KEY_RATINGS,
  STORAGE_KEY_ASCENTS
} from '../src/lib/ratingAndAscentService';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { WallBoulder } from '../src/types/boulder';
import { setStorageJson } from '../src/lib/storageUtils';

describe('SPEC-003 AC-15 & AC-16: Instant Multi-User Rating Sync & Community Reviews', () => {
  const mockBoulder: WallBoulder = {
    id: '00000000-3b7e-4000-8000-75d24e53056e',
    sectorId: 'sec-slab',
    gradeScaleId: 'scale-yellow',
    positionX: 0.5,
    positionY: 0.5,
    name: 'Test Boulder Dynamo',
    status: 'active',
    setterId: 'schrauber-1',
    createdAt: '2026-09-01T10:00:00Z',
    radar: {
      kraft: 3,
      maximalkraft: 3,
      kraftausdauer: 3,
      technik: 3,
      balance: 3,
      koordination: 3,
      flexibilitaet: 3
    }
  };

  const borisUser = {
    id: 'user-boris',
    nickname: 'Boris',
    role: 'admin' as const,
    isPlatformAdmin: true,
  };

  beforeEach(() => {
    localStorage.clear();
    setStorageJson(STORAGE_KEY_RATINGS, []);
    setStorageJson(STORAGE_KEY_ASCENTS, []);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Mapping & Reconciliation (AC-17)', () => {
    it('resolves Boris UUID to user-boris and nickname Boris', () => {
      const info = resolveUserIdAndNickname('00000000-1d0e-4000-8000-e92d69136f33');
      expect(info.userId).toBe('user-boris');
      expect(info.nickname).toBe('Boris');
    });

    it('resolves Hans UUID to hans-kletterer and nickname HansDereinfacheKletterer', () => {
      const info = resolveUserIdAndNickname('00000000-4553-4000-8000-3dd13fac9e0f');
      expect(info.userId).toBe('hans-kletterer');
      expect(info.nickname).toBe('HansDereinfacheKletterer');
    });

    it('isUserMatch handles both demo string keys and Supabase UUIDs interchangeably', () => {
      expect(isUserMatch('user-boris', '00000000-1d0e-4000-8000-e92d69136f33')).toBe(true);
      expect(isUserMatch('00000000-1d0e-4000-8000-e92d69136f33', 'user-boris')).toBe(true);
      expect(isUserMatch('hans-kletterer', '00000000-4553-4000-8000-3dd13fac9e0f')).toBe(true);
      expect(isUserMatch('user-boris', 'hans-kletterer')).toBe(false);
    });
  });

  describe('Realtime Multi-User Event Handlers (AC-15)', () => {
    it('processes incoming INSERT rating from another tester and dispatches update event', () => {
      const eventSpy = vi.fn();
      window.addEventListener('bouldermate:ratings_updated', eventSpy);

      // Friend 1 (Hans) submitted a rating in Supabase
      handleRealtimeRatingChange({
        eventType: 'INSERT',
        new: {
          id: '00000000-7777-4000-8000-777777777777',
          boulder_id: mockBoulder.id,
          user_id: '00000000-4553-4000-8000-3dd13fac9e0f', // Hans
          stars: 5,
          perceived_difficulty: 'soft',
          radar_kraft: 4,
          created_at: new Date().toISOString()
        }
      });

      expect(eventSpy).toHaveBeenCalledTimes(1);

      const ratings = getRatings(mockBoulder.id);
      expect(ratings.length).toBe(1);
      expect(ratings[0].userId).toBe('hans-kletterer');
      expect(ratings[0].userNickname).toBe('HansDereinfacheKletterer');
      expect(ratings[0].qualityStars).toBe(5);
      expect(ratings[0].gradeFeel).toBe('soft');

      window.removeEventListener('bouldermate:ratings_updated', eventSpy);
    });

    it('processes incoming INSERT ascent from another tester and dispatches update event', () => {
      const eventSpy = vi.fn();
      window.addEventListener('bouldermate:ascents_updated', eventSpy);

      handleRealtimeAscentChange({
        eventType: 'INSERT',
        new: {
          id: '00000000-8888-4000-8000-888888888888',
          boulder_id: mockBoulder.id,
          user_id: '00000000-1d0e-4000-8000-e92d69136f33', // Boris
          ascent_style: 'flash',
          created_at: new Date().toISOString()
        }
      });

      expect(eventSpy).toHaveBeenCalledTimes(1);

      const ascents = getAscents(mockBoulder.id);
      expect(ascents.length).toBe(1);
      expect(ascents[0].userId).toBe('user-boris');
      expect(ascents[0].userNickname).toBe('Boris');
      expect(ascents[0].type).toBe('flash');

      window.removeEventListener('bouldermate:ascents_updated', eventSpy);
    });

    it('updates existing rating smoothly upon UPDATE event without creating duplicate', () => {
      // First save rating
      handleRealtimeRatingChange({
        eventType: 'INSERT',
        new: {
          id: 'rating-uuid-1',
          boulder_id: mockBoulder.id,
          user_id: '00000000-4553-4000-8000-3dd13fac9e0f',
          stars: 3,
          perceived_difficulty: 'fair',
          created_at: '2026-09-12T10:00:00Z'
        }
      });

      expect(getRatings(mockBoulder.id).length).toBe(1);
      expect(getRatings(mockBoulder.id)[0].qualityStars).toBe(3);

      // Tester updates rating to 5 stars
      handleRealtimeRatingChange({
        eventType: 'UPDATE',
        new: {
          id: 'rating-uuid-1',
          boulder_id: mockBoulder.id,
          user_id: '00000000-4553-4000-8000-3dd13fac9e0f',
          stars: 5,
          perceived_difficulty: 'stiff',
          created_at: '2026-09-12T10:05:00Z'
        }
      });

      const updated = getRatings(mockBoulder.id);
      expect(updated.length).toBe(1); // No duplicates!
      expect(updated[0].qualityStars).toBe(5);
      expect(updated[0].gradeFeel).toBe('stiff');
    });
  });

  describe('Community Reviews UI in BoulderDetailModal (AC-16)', () => {
    it('renders community reviews list showing what friends rated (stars, feel, ascent style)', () => {
      // Setup Hans ascent & rating
      logAscent('hans-kletterer', 'HansDereinfacheKletterer', mockBoulder.id, 'flash');
      saveRating('hans-kletterer', 'HansDereinfacheKletterer', mockBoulder.id, {
        qualityStars: 5,
        gradeFeel: 'soft'
      });

      // Boris views the boulder detail modal
      render(
        <BoulderDetailModal
          isOpen={true}
          boulder={mockBoulder}
          currentUser={borisUser}
          onClose={vi.fn()}
        />
      );

      // Check Community Ratings section exists
      expect(screen.getByTestId('community-ratings-section')).toBeInTheDocument();
      expect(screen.getByText(/Community-Wertungen & Reviews/i)).toBeInTheDocument();

      // Check Hans's specific rating card is rendered
      const hansRow = screen.getByTestId('community-rating-row-hans-kletterer');
      expect(hansRow).toBeInTheDocument();
      expect(hansRow).toHaveTextContent('HansDereinfacheKletterer');
      expect(hansRow).toHaveTextContent('5'); // 5 stars
      expect(hansRow).toHaveTextContent(/Soft/i); // Soft grade feel
      expect(hansRow).toHaveTextContent(/FLASH/i); // Logged ascent badge
    });

    it('instantly updates community reviews when a friend submits a rating in real time', async () => {
      // Boris opens modal when no ratings exist yet
      render(
        <BoulderDetailModal
          isOpen={true}
          boulder={mockBoulder}
          currentUser={borisUser}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Noch keine detaillierten Bewertungen vorhanden/i)).toBeInTheDocument();

      // Friend Hans rates the boulder on another phone in real-time
      act(() => {
        handleRealtimeRatingChange({
          eventType: 'INSERT',
          new: {
            id: 'rating-live-123',
            boulder_id: mockBoulder.id,
            user_id: '00000000-4553-4000-8000-3dd13fac9e0f', // Hans
            stars: 4,
            perceived_difficulty: 'stiff',
            created_at: new Date().toISOString()
          }
        });
      });

      // Boris's modal immediately renders Hans's new rating without reload or modal reopen!
      expect(screen.queryByText(/Noch keine detaillierten Bewertungen vorhanden/i)).not.toBeInTheDocument();
      const hansLiveRow = screen.getByTestId('community-rating-row-hans-kletterer');
      expect(hansLiveRow).toBeInTheDocument();
      expect(hansLiveRow).toHaveTextContent('HansDereinfacheKletterer');
      expect(hansLiveRow).toHaveTextContent('4');
      expect(hansLiveRow).toHaveTextContent(/Stiff/i);
    });

    it('instantly removes community review when a friend deletes their rating in real time', async () => {
      // First Hans has a rating
      handleRealtimeRatingChange({
        eventType: 'INSERT',
        new: {
          id: 'rating-live-del-1',
          boulder_id: mockBoulder.id,
          user_id: '00000000-4553-4000-8000-3dd13fac9e0f',
          stars: 5,
          perceived_difficulty: 'soft',
          created_at: new Date().toISOString()
        }
      });

      render(
        <BoulderDetailModal
          isOpen={true}
          boulder={mockBoulder}
          currentUser={borisUser}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('community-rating-row-hans-kletterer')).toBeInTheDocument();

      // Hans deletes rating in real-time
      act(() => {
        handleRealtimeRatingChange({
          eventType: 'DELETE',
          old: {
            id: 'rating-live-del-1',
            boulder_id: mockBoulder.id,
            user_id: '00000000-4553-4000-8000-3dd13fac9e0f'
          }
        });
      });

      // Boris's modal updates immediately: rating is gone
      expect(screen.queryByTestId('community-rating-row-hans-kletterer')).not.toBeInTheDocument();
      expect(screen.getByText(/Noch keine detaillierten Bewertungen vorhanden/i)).toBeInTheDocument();
    });
  });
});
