import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSectors,
  getWallBoulders,
  createDraftBoulder,
  publishBatch,
  getGradeScales,
} from '../src/lib/batchBoulderService';
import {
  logAscent,
  saveRating,
  getUserAscent,
  computeBoulderStatsAggregate,
} from '../src/lib/ratingAndAscentService';
import {
  getAthletePerformanceReport,
} from '../src/lib/performanceService';
import {
  getUserRoleInfo,
  appointGymSetter,
} from '../src/lib/roleService';
import { ensureInitialGymData } from '../src/lib/gymStorage';
import { signInWithGoogle } from '../src/lib/authService';

describe('SPEC-009: End-to-End User Flow & Journey Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    ensureInitialGymData();
  });

  it('Phase 1: Zero-Friction Registration & Profile Creation', async () => {
    // 1-Tap Google Sign-In
    const user = await signInWithGoogle();
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.nickname).toBeDefined();

    // Universal climber role is immediately granted
    const roleInfo = getUserRoleInfo(user.id, 'gym-6a-plus');
    expect(roleInfo.isClimber).toBe(true);
    expect(roleInfo.canAccessSetterStudio).toBe(false);
    expect(roleInfo.canAccessAdminConsole).toBe(false);
  });

  it('Phase 2: Admin Workflow (Setup Scale, Wall & Appoint Setter)', () => {
    const gymId = 'gym-6a-plus';
    const adminId = 'user-boris';

    const adminRole = getUserRoleInfo(adminId, gymId);
    expect(adminRole.isAdmin).toBe(true);
    expect(adminRole.canAppointSetters).toBe(true);

    // Appoint a new setter
    const newSetterId = 'climber-alex-id';
    appointGymSetter(gymId, newSetterId, adminId);

    // Verify the new setter now has setter access in this gym
    const setterRole = getUserRoleInfo(newSetterId, gymId);
    expect(setterRole.isSetter).toBe(true);
    expect(setterRole.canAccessSetterStudio).toBe(true);
    expect(setterRole.canAccessAdminConsole).toBe(false);
  });

  it('Phase 3: Route Setter Batch Creation & Publishing (< 3 min workflow)', () => {
    const gymId = 'gym-6a-plus';
    const sectors = getSectors(gymId);
    expect(sectors.length).toBeGreaterThan(0);
    const sector = sectors[0];

    const scales = getGradeScales(gymId);
    expect(scales.length).toBeGreaterThan(0);
    const scale = scales[0];
    const setterId = 'user-boris';

    // Setter drops 2 pins on the wall photo with radar parameters
    const draft1 = createDraftBoulder(
      {
        sectorId: sector.id,
        gradeScaleId: scale.id,
        positionX: 0.25,
        positionY: 0.60,
        setterId,
        radar: {
          kraft: 4,
          technik: 3,
          balance: 2,
          koordination: 5,
          flexibilitaet: 1,
        },
      },
      'setter'
    );

    const draft2 = createDraftBoulder(
      {
        sectorId: sector.id,
        gradeScaleId: scale.id,
        positionX: 0.50,
        positionY: 0.40,
        setterId,
        radar: {
          kraft: 2,
          technik: 5,
          balance: 5,
          koordination: 2,
          flexibilitaet: 4,
        },
      },
      'setter'
    );

    expect(draft1.status).toBe('draft');
    expect(draft2.status).toBe('draft');

    // 1-Click Publish
    const result = publishBatch(sector.id, setterId);
    expect(result.publishedCount).toBeGreaterThanOrEqual(2);

    const activeWallBoulders = getWallBoulders(sector.id).filter(b => b.status === 'active');
    expect(activeWallBoulders.some(b => b.id === draft1.id)).toBe(true);
    expect(activeWallBoulders.some(b => b.id === draft2.id)).toBe(true);
  });

  it('Phase 4: Climber Core Journey (Find pin, 2-click log, rate, see athlete radar)', () => {
    const gymId = 'gym-6a-plus';
    const sector = getSectors(gymId)[0];
    const scales = getGradeScales(gymId);
    const setterId = 'user-boris';
    const climberId = 'climber-user-test';

    // Setter created and published boulder
    const draft = createDraftBoulder(
      {
        sectorId: sector.id,
        gradeScaleId: scales[0].id,
        positionX: 0.45,
        positionY: 0.55,
        setterId,
        radar: {
          kraft: 3,
          technik: 4,
          balance: 5,
          koordination: 3,
          flexibilitaet: 4,
        },
      },
      'setter'
    );
    publishBatch(sector.id, setterId);

    // 1. Climber logs Flash ascent in 1 click
    logAscent(climberId, 'Test Climber', draft.id, 'flash');

    const userAscent = getUserAscent(climberId, draft.id);
    expect(userAscent).toBeDefined();
    expect(userAscent?.type).toBe('flash');

    // 2. Climber gives quick feedback: Soft/Fair/Stiff + 5-star quality
    saveRating(climberId, 'Test Climber', draft.id, {
      qualityStars: 5,
      gradeFeel: 'fair',
    });

    const stats = computeBoulderStatsAggregate(draft);
    expect(stats.totalTops).toBe(1);
    expect(stats.totalFlashes).toBe(1);
    expect(stats.avgStars).toBe(5);
    expect(stats.gradeFeelCounts.fair).toBe(1);

    // 3. Climber checks their personal athlete radar & report
    const report = getAthletePerformanceReport(climberId, gymId);
    expect(report.loggedAscentsCount).toBe(1);
    expect(report.userRadar).toBeDefined();

    // Check unlocked report with seed climber Boris
    const borisReport = getAthletePerformanceReport('user-boris', 'gym-minimum-zh');
    expect(borisReport.isUnlocked).toBe(true);
    expect(borisReport.strength).not.toBeNull();
    expect(borisReport.userRadar.kraft).toBeGreaterThan(0);
  });
});

