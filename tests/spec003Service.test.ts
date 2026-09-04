import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeAggregatedRadar,
  computeBoulderStatsAggregate,
  logAscent,
  saveRating,
  getUserAscent,
  getUserRating,
  getAscents,
  getRatings,
  resetAscentAndRatingStorage,
} from '../src/lib/ratingAndAscentService';
import { WallBoulder, BoulderRating, Ascent } from '../src/types/boulder';

const testBoulder: WallBoulder = {
  id: 'test-boulder-1',
  sectorId: 'sector-overhang',
  gradeScaleId: 'scale-blue',
  positionX: 0.5,
  positionY: 0.5,
  name: 'Test Problem',
  setterId: 'setter-1',
  status: 'active',
  radar: { kraft: 3, technik: 4, balance: 2, koordination: 5, flexibilitaet: 1 },
  createdAt: '2026-09-01T10:00:00Z',
};

describe('SPEC-003: Rating and Ascent Service', () => {
  beforeEach(() => {
    resetAscentAndRatingStorage();
  });

  describe('AC-2: Radar-Chart Aggregation Formula', () => {
    it('returns exact setter radar when no user ratings exist', () => {
      const emptyRatings: BoulderRating[] = [];
      const aggregated = computeAggregatedRadar(testBoulder.radar, emptyRatings);

      expect(aggregated.kraft).toBe(3);
      expect(aggregated.technik).toBe(4);
      expect(aggregated.balance).toBe(2);
      expect(aggregated.koordination).toBe(5);
      expect(aggregated.flexibilitaet).toBe(1);
    });

    it('calculates weighted average with W_setter = 5 and single user rating', () => {
      // Setter kraft = 3. User kraft = 5.
      // Weighted kraft = (5 * 3 + 5) / (5 + 1) = 20 / 6 = 3.333... -> 3.3
      const ratings: BoulderRating[] = [
        {
          id: 'r1',
          boulderId: testBoulder.id,
          userId: 'user-1',
          userNickname: 'U1',
          radar: { kraft: 5, technik: 4, balance: 2, koordination: 5, flexibilitaet: 1 },
          createdAt: '2026-09-04T10:00:00Z',
          updatedAt: '2026-09-04T10:00:00Z',
        }
      ];

      const aggregated = computeAggregatedRadar(testBoulder.radar, ratings);
      expect(aggregated.kraft).toBe(3.3);
    });

    it('community influence increases as number of user ratings grows', () => {
      // 5 users all rate kraft = 5
      // Weighted kraft = (5 * 3 + 5 * 5) / (5 + 5) = 40 / 10 = 4.0
      const fiveRatings: BoulderRating[] = Array.from({ length: 5 }, (_, i) => ({
        id: `r-${i}`,
        boulderId: testBoulder.id,
        userId: `user-${i}`,
        userNickname: `User ${i}`,
        radar: { kraft: 5, technik: 4, balance: 2, koordination: 5, flexibilitaet: 1 },
        createdAt: '2026-09-04T10:00:00Z',
        updatedAt: '2026-09-04T10:00:00Z',
      }));

      const aggregated = computeAggregatedRadar(testBoulder.radar, fiveRatings);
      expect(aggregated.kraft).toBe(4.0);
    });
  });

  describe('AC-3 & AC-4: Ascent Logging & Trigger', () => {
    it('logs an initial flash or top and triggers first top/flash flag', () => {
      const res = logAscent('user-new', 'New Climber', testBoulder.id, 'flash');

      expect(res.ascent.type).toBe('flash');
      expect(res.ascent.userId).toBe('user-new');
      expect(res.isFirstTopOrFlash).toBe(true);

      const saved = getUserAscent('user-new', testBoulder.id);
      expect(saved).not.toBeNull();
      expect(saved?.type).toBe('flash');
    });

    it('logging a project does not trigger rating sheet', () => {
      const res = logAscent('user-proj', 'Project Climber', testBoulder.id, 'project');

      expect(res.ascent.type).toBe('project');
      expect(res.isFirstTopOrFlash).toBe(false);
    });

    it('transitioning from project to top triggers rating trigger (AC-4)', () => {
      // First, log project
      logAscent('user-transition', 'Climber T', testBoulder.id, 'project');
      expect(getUserAscent('user-transition', testBoulder.id)?.type).toBe('project');

      // Now send the top!
      const sendRes = logAscent('user-transition', 'Climber T', testBoulder.id, 'top');
      expect(sendRes.isFirstTopOrFlash).toBe(true);
      expect(sendRes.ascent.type).toBe('top');

      // Check only 1 ascent exists for this user on this boulder (AC-3 upsert)
      const userAscents = getAscents(testBoulder.id).filter(a => a.userId === 'user-transition');
      expect(userAscents.length).toBe(1);
    });
  });

  describe('AC-5, AC-6 & AC-7: Rating Submissions & Upsert', () => {
    it('creates a new rating and allows reading it', () => {
      const rating = saveRating('user-rater', 'Rater 1', testBoulder.id, {
        gradeFeel: 'soft',
        qualityStars: 5,
        radar: { kraft: 4, technik: 4, balance: 3, koordination: 4, flexibilitaet: 2 }
      });

      expect(rating.userId).toBe('user-rater');
      expect(rating.gradeFeel).toBe('soft');
      expect(rating.qualityStars).toBe(5);

      const fetched = getUserRating('user-rater', testBoulder.id);
      expect(fetched?.qualityStars).toBe(5);
    });

    it('AC-7: subsequent rating updates existing rating without duplicating', () => {
      saveRating('user-rater', 'Rater 1', testBoulder.id, {
        gradeFeel: 'soft',
        qualityStars: 4,
      });

      // Update to 5 stars and fair
      const updated = saveRating('user-rater', 'Rater 1', testBoulder.id, {
        gradeFeel: 'fair',
        qualityStars: 5,
      });

      expect(updated.gradeFeel).toBe('fair');
      expect(updated.qualityStars).toBe(5);

      const allForBoulder = getRatings(testBoulder.id).filter(r => r.userId === 'user-rater');
      expect(allForBoulder.length).toBe(1);
    });
  });

  describe('AC-8 & AC-9: Community Aggregate & Feed', () => {
    it('computes star average, Soft/Fair/Stiff percentage barometer and dominant feel', () => {
      const ratings: BoulderRating[] = [
        {
          id: 'r1',
          boulderId: testBoulder.id,
          userId: 'u1',
          userNickname: 'U1',
          gradeFeel: 'soft',
          qualityStars: 5,
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 'r2',
          boulderId: testBoulder.id,
          userId: 'u2',
          userNickname: 'U2',
          gradeFeel: 'soft',
          qualityStars: 4,
          createdAt: '2026-09-02T10:00:00Z',
          updatedAt: '2026-09-02T10:00:00Z',
        },
        {
          id: 'r3',
          boulderId: testBoulder.id,
          userId: 'u3',
          userNickname: 'U3',
          gradeFeel: 'fair',
          qualityStars: 5,
          createdAt: '2026-09-03T10:00:00Z',
          updatedAt: '2026-09-03T10:00:00Z',
        }
      ];

      const ascents: Ascent[] = [
        {
          id: 'a1',
          userId: 'u1',
          userNickname: 'U1',
          boulderId: testBoulder.id,
          type: 'flash',
          createdAt: '2026-09-01T10:00:00Z',
        },
        {
          id: 'a2',
          userId: 'u2',
          userNickname: 'U2',
          boulderId: testBoulder.id,
          type: 'top',
          createdAt: '2026-09-02T10:00:00Z',
        },
        {
          id: 'a3',
          userId: 'u3',
          userNickname: 'U3',
          boulderId: testBoulder.id,
          type: 'project',
          createdAt: '2026-09-03T10:00:00Z',
        }
      ];

      const stats = computeBoulderStatsAggregate(testBoulder, ratings, ascents);

      // (5 + 4 + 5) / 3 = 14 / 3 = 4.666... -> 4.7
      expect(stats.avgStars).toBe(4.7);

      // 2 soft, 1 fair -> 67% soft, 33% fair, 0% stiff
      expect(stats.gradeFeelCounts.soft).toBe(2);
      expect(stats.gradeFeelCounts.fair).toBe(1);
      expect(stats.gradeFeelPercentages.soft).toBe(67);
      expect(stats.gradeFeelPercentages.fair).toBe(33);
      expect(stats.gradeFeelPercentages.stiff).toBe(0);
      expect(stats.dominantGradeFeel).toBe('soft');

      // Ascents
      expect(stats.totalFlashes).toBe(1);
      expect(stats.totalTops).toBe(2); // flash + top
      expect(stats.totalProjects).toBe(1);

      // Feed sorted descending by date (a3, a2, a1)
      expect(stats.ascents[0].id).toBe('a3');
      expect(stats.ascents[1].id).toBe('a2');
      expect(stats.ascents[2].id).toBe('a1');
    });
  });
});
