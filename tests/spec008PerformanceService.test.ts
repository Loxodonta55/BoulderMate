import { describe, it, expect, beforeEach } from 'vitest';
import { getAthletePerformanceReport } from '../src/lib/performanceService';
import { resetAscentAndRatingStorage, logAscent } from '../src/lib/ratingAndAscentService';
import { clearBatchServiceStorage, getWallBoulders } from '../src/lib/batchBoulderService';
import { resetProfileStorage } from '../src/lib/profileService';

describe('SPEC-008: Athlete Performance & Style Statistics Service', () => {
  beforeEach(() => {
    resetProfileStorage();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
  });

  describe('AC-1, AC-2, AC-3: Boris in Minimum Boulder Zürich (Seed Data)', () => {
    it('unlocks performance report for Boris who has >= 5 ascents (16 seed logs)', () => {
      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      expect(report.isUnlocked).toBe(true);
      expect(report.loggedAscentsCount).toBe(16);
      expect(report.minRequiredAscents).toBe(5);
      expect(report.userId).toBe('user-boris');
      expect(report.gymName).toContain('Minimum');
    });

    it('calculates 5-axis user radar and gym radar', () => {
      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      const axes = ['kraft', 'technik', 'balance', 'koordination', 'flexibilitaet'] as const;

      axes.forEach(axis => {
        expect(report.userRadar[axis]).toBeGreaterThanOrEqual(1.0);
        expect(report.userRadar[axis]).toBeLessThanOrEqual(5.0);

        expect(report.gymRadar[axis]).toBeGreaterThanOrEqual(1.0);
        expect(report.gymRadar[axis]).toBeLessThanOrEqual(5.0);
      });
    });

    it('identifies Kraft as a primary strength and Koordination as a weakness for Boris', () => {
      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      expect(report.strength).not.toBeNull();
      expect(report.weakness).not.toBeNull();

      // Boris has logged multiple red tops and flashes on power overhangs
      expect(['kraft', 'balance']).toContain(report.strength?.attribute);

      // Boris has open projects on high-coordination dynos (Dyno King, Wettkampf-Sprung)
      expect(report.weakness?.attribute).toBe('koordination');
      expect(report.weakness?.headline).toContain('KOORDINATION');
      expect(report.weakness?.metricHighlight).toContain('unter Hallenschnitt');
    });

    it('attaches an active recommended training boulder for Boris weakness', () => {
      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      expect(report.weakness?.recommendedBoulder).toBeDefined();
      const rec = report.weakness?.recommendedBoulder;

      expect(rec?.id).toBeDefined();
      expect(rec?.name).toBeDefined();
      expect(rec?.sectorName).toBeDefined();
      expect(rec?.attributeValue).toBeGreaterThanOrEqual(4);
    });

    it('includes archived boulders in user performance statistics (Domain Requirement)', () => {
      // Boris has logged:
      // 'boulder-overhang-archived-1' (status: archived)
      // 'boulder-slab-archived-1' (status: archived)
      const allBoulders = getWallBoulders();
      const archivedBoulders = allBoulders.filter(b => b.status === 'archived');
      expect(archivedBoulders.length).toBe(3);

      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      // If archived boulders were excluded, count would only be 14 instead of 16
      expect(report.loggedAscentsCount).toBe(16);
    });
  });

  describe('AC-7: Fallback / Locked state for users with < 5 ascents', () => {
    it('returns isUnlocked=false with remaining count for novice users', () => {
      const userId = 'user-novice';
      // Log only 2 ascents
      logAscent(userId, 'Novice', 'boulder-existing-1', 'top');
      logAscent(userId, 'Novice', 'boulder-existing-2', 'flash');

      const report = getAthletePerformanceReport(userId, 'gym-minimum-zh');

      expect(report.isUnlocked).toBe(false);
      expect(report.loggedAscentsCount).toBe(2);
      expect(report.minRequiredAscents).toBe(5);
      expect(report.strength).toBeNull();
      expect(report.weakness).toBeNull();
      expect(report.attributeMetrics).toHaveLength(0);
    });
  });

  describe('AC-4: Attribute Metrics Table', () => {
    it('calculates send-rate, flash-rate, and deltas for all 5 attributes', () => {
      const report = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');

      expect(report.attributeMetrics).toHaveLength(5);

      const kraftMetric = report.attributeMetrics.find(m => m.key === 'kraft');
      expect(kraftMetric).toBeDefined();
      expect(kraftMetric?.attemptsCount).toBeGreaterThan(0);
      expect(kraftMetric?.sendRatePercent).toBeGreaterThanOrEqual(0);
      expect(kraftMetric?.flashRatePercent).toBeGreaterThanOrEqual(0);
      expect(kraftMetric?.highestGradeTopped).toBeDefined();
    });
  });

  describe('AC-6: Gym Filter Consistency', () => {
    it('calculates performance for specific gym or all gyms', () => {
      const reportGym = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');
      const reportAll = getAthletePerformanceReport('user-boris', 'all');

      expect(reportGym.gymId).toBe('gym-minimum-zh');
      expect(reportAll.gymId).toBe('all');
      expect(reportAll.isUnlocked).toBe(true);
    });
  });
});
