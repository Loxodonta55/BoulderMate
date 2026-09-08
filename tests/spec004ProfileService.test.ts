import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  getProfileData,
  resetProfileStorage,
} from '../src/lib/profileService';
import {
  logAscent,
  saveRating,
  resetAscentAndRatingStorage,
} from '../src/lib/ratingAndAscentService';
import {
  createDraftBoulder,
  publishBatch,
  clearBatchServiceStorage,
  getGradeScales,
} from '../src/lib/batchBoulderService';

describe('SPEC-004: Profile, Statistics & Logbook Service', () => {
  beforeEach(() => {
    resetProfileStorage();
    resetAscentAndRatingStorage();
    clearBatchServiceStorage();
  });

  describe('AC-1 & AC-7: Profile Management & Settings', () => {
    it('returns seed profile for existing users', () => {
      const profile = getProfile('user-boris');
      expect(profile.id).toBe('user-boris');
      expect(profile.nickname).toBe('Boris');
      expect(profile.createdAt).toBeDefined();
    });

    it('auto-generates new profile if user does not exist yet', () => {
      const profile = getProfile('user-florian');
      expect(profile.id).toBe('user-florian');
      expect(profile.nickname).toBe('Florian');
      expect(profile.createdAt).toBeDefined();
    });

    it('updates user profile nickname and avatar (AC-7)', () => {
      const updated = updateProfile('user-boris', {
        nickname: 'Boris The Crusher',
        avatarUrl: 'data:image/jpeg;base64,mockavatar',
      });

      expect(updated.nickname).toBe('Boris The Crusher');
      expect(updated.avatarUrl).toBe('data:image/jpeg;base64,mockavatar');
      expect(updated.updatedAt).toBeDefined();

      const refetched = getProfile('user-boris');
      expect(refetched.nickname).toBe('Boris The Crusher');
    });

    it('deletes user account, removing profile, ascents and ratings (AC-7)', () => {
      // Create an ascent and rating
      updateProfile('user-to-delete', { nickname: 'Temp User' });
      logAscent('user-to-delete', 'Temp User', 'boulder-existing-1', 'top');
      saveRating('user-to-delete', 'Temp User', 'boulder-existing-1', { qualityStars: 4 });

      // Confirm profile exists
      expect(getProfile('user-to-delete').nickname).toBe('Temp User');

      // Delete account
      deleteAccount('user-to-delete');

      // Profile data should be clean/empty
      const data = getProfileData('user-to-delete');
      expect(data.kpis.totalTops).toBe(0);
      expect(data.logbook.length).toBe(0);
    });
  });

  describe('AC-2 & AC-8: KPIs & Empty State', () => {
    it('returns 0 tops, 0 flashes, and null for best top/flash when user has no ascents (AC-8)', () => {
      const data = getProfileData('user-empty-new');

      expect(data.kpis.totalTops).toBe(0);
      expect(data.kpis.totalFlashes).toBe(0);
      expect(data.kpis.bestTop).toBeNull();
      expect(data.kpis.bestFlash).toBeNull();
      expect(data.logbook.length).toBe(0);
    });

    it('calculates total tops (flash + top) and total flashes correctly (AC-2)', () => {
      const userId = 'user-kpi-test';

      // Log 1 flash and 2 tops and 1 project
      logAscent(userId, 'Tester', 'boulder-existing-1', 'flash'); // grade scale: blue (sortOrder 2)
      logAscent(userId, 'Tester', 'boulder-existing-2', 'top'); // grade scale: yellow (sortOrder 3)

      const data = getProfileData(userId);

      // Flashes count as tops, so 1 flash + 1 top = 2 tops total
      expect(data.kpis.totalTops).toBe(2);
      expect(data.kpis.totalFlashes).toBe(1);
      // Best top is yellow (sortOrder 3 > blue sortOrder 2, stiff feel -> 7a)
      expect(data.kpis.bestTop?.colorName).toBe('Gelb');
      expect(data.kpis.bestTopFont).toBe('7a');
      // Best flash is blue (soft feel -> 5c)
      expect(data.kpis.bestFlash?.colorName).toBe('Blau');
      expect(data.kpis.bestFlashFont).toBe('5c');
    });
  });

  describe('AC-3: Grade Distribution (Fontainebleau Scale)', () => {
    it('groups tops and flashes correctly per Fontainebleau grade with gym scale styling', () => {
      const userId = 'user-distribution-test';

      // Log flash on blue (dominant soft -> 5c), and flash on yellow (dominant stiff -> 7a)
      logAscent(userId, 'Tester', 'boulder-existing-1', 'flash');
      logAscent(userId, 'Tester', 'boulder-existing-2', 'flash');

      const data = getProfileData(userId);

      const blueItem = data.gradeDistribution.find(d => d.fontGrade === '5c');
      const yellowItem = data.gradeDistribution.find(d => d.fontGrade === '7a');
      const greenItem = data.gradeDistribution.find(d => d.fontGrade === '4a');

      expect(blueItem?.flashCount).toBe(1);
      expect(blueItem?.totalCount).toBe(1);
      expect(blueItem?.gradeScale.colorName).toBe('Blau');

      expect(yellowItem?.flashCount).toBe(1);
      expect(yellowItem?.totalCount).toBe(1);
      expect(yellowItem?.gradeScale.colorName).toBe('Gelb');

      expect(greenItem?.totalCount).toBe(0);
    });

    it('smartly translates red gym color band [7a+, 7b+] to midpoint by default and upper bound when rated stiff', () => {
      const userId = 'user-smart-translate-test';

      const scales = getGradeScales('gym-minimum-zh');
      const redScale = scales[3]; // red: fontRangeMin 7a+, fontRangeMax 7b+

      const newBoulder = createDraftBoulder({
        sectorId: 'sector-overhang',
        gradeScaleId: redScale.id,
        positionX: 0.5,
        positionY: 0.5,
        setterId: 'setter-1',
        name: 'Smart Red Route',
      });
      publishBatch('sector-overhang', 'setter-1');

      // 1. Initial ascent without ratings -> midpoint of Red [7a+, 7b+] is 7b
      logAscent(userId, 'Tester', newBoulder.id, 'top');
      let data = getProfileData(userId);
      expect(data.logbook[0].fontGrade).toBe('7b');
      expect(data.kpis.bestTopFont).toBe('7b');

      // 2. User rates it stiff -> should resolve to 7b+
      saveRating(userId, 'Tester', newBoulder.id, { gradeFeel: 'stiff' });
      data = getProfileData(userId);
      expect(data.logbook[0].fontGrade).toBe('7b+');
      expect(data.kpis.bestTopFont).toBe('7b+');

      // 3. User updates rating to soft -> should resolve to 7a+
      saveRating(userId, 'Tester', newBoulder.id, { gradeFeel: 'soft' });
      data = getProfileData(userId);
      expect(data.logbook[0].fontGrade).toBe('7a+');
      expect(data.kpis.bestTopFont).toBe('7a+');
    });
  });

  describe('AC-4: Gym Filter Synchronization', () => {
    it('filters KPIs, grade distribution, and logbook synchronously by gymId', () => {
      const userId = 'user-filter-test';

      // boulder-existing-1 belongs to 'gym-minimum-zh'
      logAscent(userId, 'Tester', 'boulder-existing-1', 'flash');

      // 'all' gym filter
      const allData = getProfileData(userId, 'all');
      expect(allData.kpis.totalTops).toBe(1);
      expect(allData.logbook.length).toBe(1);

      // matching gym
      const gymData = getProfileData(userId, 'gym-minimum-zh');
      expect(gymData.kpis.totalTops).toBe(1);
      expect(gymData.logbook.length).toBe(1);

      // non-matching gym
      const otherData = getProfileData(userId, 'gym-other-place');
      expect(otherData.kpis.totalTops).toBe(0);
      expect(otherData.kpis.bestTop).toBeNull();
      expect(otherData.logbook.length).toBe(0);
    });
  });

  describe('AC-5: Private Logbook Chronology', () => {
    it('returns ascents sorted in reverse chronological order (newest first)', () => {
      const userId = 'user-chrono-test';

      // Log ascent 1
      logAscent(userId, 'Tester', 'boulder-existing-1', 'top');

      // Small wait / create a newer boulder
      const scales = getGradeScales('gym-minimum-zh');
      const newBoulder = createDraftBoulder({
        sectorId: 'sector-overhang',
        gradeScaleId: scales[3].id, // red
        positionX: 0.5,
        positionY: 0.5,
        setterId: 'setter-1',
        name: 'New Red Route',
      });
      publishBatch('sector-overhang', 'setter-1');

      logAscent(userId, 'Tester', newBoulder.id, 'flash');

      const data = getProfileData(userId);
      expect(data.logbook.length).toBe(2);

      // First entry in logbook should be the newer flash
      expect(data.logbook[0].boulderId).toBe(newBoulder.id);
      expect(data.logbook[0].type).toBe('flash');
      expect(data.logbook[1].boulderId).toBe('boulder-existing-1');
      expect(data.logbook[1].type).toBe('top');
    });
  });
});
