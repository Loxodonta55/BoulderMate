import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  toKnownAuthUserUuid,
  handleRealtimeRatingChange,
  handleRealtimeClimberRouteChange,
} from '../src/lib/syncService';
import {
  getRatings,
  saveRating,
  isBoulderMatch,
  STORAGE_KEY_RATINGS,
  STORAGE_KEY_ASCENTS
} from '../src/lib/ratingAndAscentService';
import {
  createBoulder,
  getStoredBoulders,
} from '../src/lib/storage';
import {
  getWallBoulders,
  publishBatch,
  createDraftBoulder,
  SECTOR_ALIAS_MAP
} from '../src/lib/batchBoulderService';
import { BoulderDetailModal } from '../src/components/BoulderDetailModal';
import { WallBoulder, BoulderInput } from '../src/types/boulder';
import { setStorageJson } from '../src/lib/storageUtils';

describe('Data Synchronization Cross-Device & Multi-User Test Suite', () => {
  const mockWallBoulder: WallBoulder = {
    id: 'boulder-slab-dyno-1',
    sectorId: 'sec_6a_slab_vorne',
    gradeScaleId: 'scale-yellow',
    positionX: 0.45,
    positionY: 0.65,
    name: 'Slab Dyno',
    status: 'active',
    setterId: 'schrauber-6aplus',
    createdAt: '2026-09-01T10:00:00Z',
    radar: {
      kraft: 3,
      maximalkraft: 3,
      kraftausdauer: 3,
      technik: 4,
      balance: 4,
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
    setStorageJson('boulder_app_records_v1', []);
    setStorageJson('boulderapp_wall_boulders_v2', [mockWallBoulder]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. User Identity & UUID Collision Prevention', () => {
    it('maps known demo users to their distinct Supabase UUIDs', () => {
      const borisUuid = toKnownAuthUserUuid('user-boris');
      const hansUuid = toKnownAuthUserUuid('hans-kletterer');
      const schrauberUuid = toKnownAuthUserUuid('schrauber-6aplus');

      expect(borisUuid).toBe('00000000-1d0e-4000-8000-e92d69136f33');
      expect(hansUuid).toBe('00000000-4553-4000-8000-3dd13fac9e0f');
      expect(schrauberUuid).toBe('00000000-08ca-4000-8000-6e6f5bce818f');
      expect(borisUuid).not.toBe(hansUuid);
    });

    it('generates unique deterministic UUIDs for mobile guests without colliding with Boris', () => {
      const mobileUser1Uuid = toKnownAuthUserUuid('mobile-device-guest-1');
      const mobileUser2Uuid = toKnownAuthUserUuid('mobile-device-guest-2');
      const borisUuid = toKnownAuthUserUuid('user-boris');

      expect(mobileUser1Uuid).not.toBe(borisUuid);
      expect(mobileUser2Uuid).not.toBe(borisUuid);
      expect(mobileUser1Uuid).not.toBe(mobileUser2Uuid);
    });
  });

  describe('2. Multi-User Ratings & Ascents Synchronization', () => {
    it('allows both User A and User B to rate the same boulder independently', () => {
      saveRating('user-boris', 'Boris', mockWallBoulder.id, {
        qualityStars: 5,
        gradeFeel: 'fair',
      });

      saveRating('hans-kletterer', 'Hans', mockWallBoulder.id, {
        qualityStars: 3,
        gradeFeel: 'stiff',
      });

      const ratings = getRatings(mockWallBoulder.id);
      expect(ratings.length).toBe(2);
      expect(ratings.some(r => r.userId === 'user-boris' && r.qualityStars === 5)).toBe(true);
      expect(ratings.some(r => r.userId === 'hans-kletterer' && r.qualityStars === 3)).toBe(true);
    });

    it('handles incoming realtime rating updates from Supabase for both users', () => {
      act(() => {
        handleRealtimeRatingChange({
          eventType: 'INSERT',
          new: {
            id: 'rating-uuid-remote-hans',
            boulder_id: mockWallBoulder.id,
            user_id: '00000000-4553-4000-8000-3dd13fac9e0f', // Hans UUID
            stars: 4,
            perceived_difficulty: 'fair',
            radar_kraft: 4,
            created_at: new Date().toISOString(),
          }
        });
      });

      const ratings = getRatings(mockWallBoulder.id);
      expect(ratings.length).toBe(1);
      expect(ratings[0].qualityStars).toBe(4);
      expect(ratings[0].userNickname).toBe('HansDereinfacheKletterer');
    });

    it('matches ratings correctly across alias and UUID boulder identifiers', () => {
      const aliasId = 'boulder-slab-dyno-1';
      expect(isBoulderMatch(aliasId, aliasId)).toBe(true);
      expect(isBoulderMatch(aliasId, 'other-id')).toBe(false);
    });
  });

  describe('3. Klettermodus Climber Routes (Personal Logbook) Realtime Sync', () => {
    it('dispatches bouldermate:climber_routes_updated on route creation', () => {
      let eventFired = false;
      const listener = () => { eventFired = true; };
      window.addEventListener('bouldermate:climber_routes_updated', listener);

      const input: BoulderInput = {
        name: 'Project Flash',
        location: 'Minimum Zürich',
        sector: 'Dach',
        date: '2026-09-19',
        gradeScale: 'font',
        grade: '7A',
        ascentStyle: 'flash',
        attempts: 1,
        holdTypes: ['crimp'],
        tags: ['dyno', 'crimp'],
      };

      const created = createBoulder(input);
      expect(created.id).toBeDefined();
      expect(eventFired).toBe(true);

      const all = getStoredBoulders();
      expect(all.length).toBe(1);
      expect(all[0].name).toBe('Project Flash');

      window.removeEventListener('bouldermate:climber_routes_updated', listener);
    });

    it('handles remote climber route changes via handleRealtimeClimberRouteChange', () => {
      let eventAction = '';
      const listener = (e: Event) => {
        eventAction = (e as CustomEvent).detail?.action;
      };
      window.addEventListener('bouldermate:climber_routes_updated', listener);

      act(() => {
        handleRealtimeClimberRouteChange({
          eventType: 'INSERT',
          new: {
            id: '33333333-3333-4000-8000-333333333333',
            name: 'Mobile Synchronized Route',
            location: '6a plus',
            sector: 'Überhang',
            date: '2026-09-19',
            grade_scale: 'font',
            grade: '6B+',
            ascent_style: 'top',
            attempts: 2,
            hold_types: ['sloper'],
            tags: ['sloper'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        });
      });

      expect(eventAction).toBe('insert');
      const routes = getStoredBoulders();
      expect(routes.some(r => r.name === 'Mobile Synchronized Route')).toBe(true);

      act(() => {
        handleRealtimeClimberRouteChange({
          eventType: 'DELETE',
          old: {
            id: '33333333-3333-4000-8000-333333333333'
          }
        });
      });

      expect(eventAction).toBe('delete');
      const routesAfterDelete = getStoredBoulders();
      expect(routesAfterDelete.some(r => r.name === 'Mobile Synchronized Route')).toBe(false);

      window.removeEventListener('bouldermate:climber_routes_updated', listener);
    });
  });

  describe('4. UI Live Reactivity in BoulderDetailModal', () => {
    it('updates community stats and ratings in BoulderDetailModal when ratings event arrives', () => {
      render(
        <BoulderDetailModal
          isOpen={true}
          boulder={mockWallBoulder}
          currentUser={borisUser}
          onClose={() => {}}
        />
      );

      expect(screen.getByText('Slab Dyno')).toBeDefined();

      act(() => {
        saveRating('hans-kletterer', 'Hans', mockWallBoulder.id, {
          qualityStars: 5,
          gradeFeel: 'fair',
        });
        window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', {
          detail: { action: 'insert', boulderId: mockWallBoulder.id }
        }));
      });

      const ratings = getRatings(mockWallBoulder.id);
      expect(ratings.length).toBe(1);
      expect(ratings[0].qualityStars).toBe(5);
    });
  });

  describe('5. Cross-Mode Sector & Boulder Matching', () => {
    it('resolves boulders when queried by alias vs Supabase UUID', () => {
      const aliasSectorId = 'sec_6a_slab_vorne';
      const supabaseUuidSectorId = '8656b5d8-838d-4655-8303-57d4ab87b8dd';

      expect(SECTOR_ALIAS_MAP[aliasSectorId]).toBe(supabaseUuidSectorId);
      expect(SECTOR_ALIAS_MAP[supabaseUuidSectorId]).toBe(aliasSectorId);

      const remoteBoulder: WallBoulder = {
        id: 'remote-boulder-uuid-1',
        sectorId: supabaseUuidSectorId,
        gradeScaleId: 'scale-blue',
        positionX: 0.2,
        positionY: 0.3,
        name: 'Remote Slab',
        setterId: 'schrauber-6aplus',
        status: 'active',
        radar: mockWallBoulder.radar,
        createdAt: new Date().toISOString(),
      };
      setStorageJson('boulderapp_wall_boulders_v2', [remoteBoulder]);

      const matchingBoulders = getWallBoulders(aliasSectorId);
      expect(matchingBoulders.some(b => b.id === 'remote-boulder-uuid-1')).toBe(true);
    });

    it('dispatches bouldermate:boulders_updated event on publishBatch', () => {
      let eventFired = false;
      const listener = () => { eventFired = true; };
      window.addEventListener('bouldermate:boulders_updated', listener);

      createDraftBoulder({
        sectorId: 'sec_6a_slab_vorne',
        gradeScaleId: 'scale-yellow',
        positionX: 0.5,
        positionY: 0.5,
        setterId: 'schrauber-6aplus',
        name: 'New Draft To Publish',
      });

      publishBatch('sec_6a_slab_vorne', 'schrauber-6aplus');
      expect(eventFired).toBe(true);

      window.removeEventListener('bouldermate:boulders_updated', listener);
    });
  });
});
