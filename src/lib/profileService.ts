import {
  UserProfile,
  ProfileKPIs,
  GradeDistributionItem,
  LogbookEntry,
  ProfileData,
  GymGradeScale,
  WallBoulder,
  GradeFeel,
  BoulderRating,
} from '../types/boulder';
import { getAscents, deleteUserAscentsAndRatings, getRatings } from './ratingAndAscentService';
import { getWallBoulders, getSectors, getGradeScales, getGyms } from './batchBoulderService';
import {
  resolveBoulderFontGrade,
  compareFontGrades,
  findMatchingGradeScale,
  FONT_GRADE_LADDER,
  getFontGradeIndex,
} from './gradeConverter';

import { SEED_PROFILES } from './seedData';
import {
  getStorageString,
  setStorageJson,
  removeStorageItem,
} from './storageUtils';

export { SEED_PROFILES };

export const STORAGE_KEY_PROFILES = 'boulderapp_profiles_v1';

export function resetProfileStorage(): void {
  removeStorageItem(STORAGE_KEY_PROFILES);
}

export function getProfiles(): UserProfile[] {
  const raw = getStorageString(STORAGE_KEY_PROFILES);
  let list: UserProfile[];
  if (!raw) {
    list = [...SEED_PROFILES];
    setStorageJson(STORAGE_KEY_PROFILES, list);
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_PROFILES];
    }
  }
  return list;
}

export function getProfile(userId: string): UserProfile {
  const profiles = getProfiles();
  const existing = profiles.find(p => p.id === userId);
  if (existing) return existing;

  // Auto-generate profile if new user
  const newProfile: UserProfile = {
    id: userId,
    nickname: userId.replace(/^user-/, '').replace(/^\w/, c => c.toUpperCase()) || 'Kletterer',
    createdAt: new Date().toISOString(),
  };

  const updated = [...profiles, newProfile];
  setStorageJson(STORAGE_KEY_PROFILES, updated);
  return newProfile;
}

export function updateProfile(
  userId: string,
  updates: { nickname?: string; avatarUrl?: string }
): UserProfile {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === userId);
  const now = new Date().toISOString();

  let updatedProfile: UserProfile;

  if (idx >= 0) {
    updatedProfile = {
      ...profiles[idx],
      nickname: updates.nickname !== undefined ? updates.nickname.trim() : profiles[idx].nickname,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : profiles[idx].avatarUrl,
      updatedAt: now,
    };
    profiles[idx] = updatedProfile;
  } else {
    updatedProfile = {
      id: userId,
      nickname: updates.nickname?.trim() || 'Kletterer',
      avatarUrl: updates.avatarUrl,
      createdAt: now,
      updatedAt: now,
    };
    profiles.push(updatedProfile);
  }

  setStorageJson(STORAGE_KEY_PROFILES, profiles);
  return updatedProfile;
}

/**
 * AC-7: Deletes user's account data (profile, ascents and ratings).
 */
export function deleteAccount(userId: string): void {
  // 1. Remove profile
  const profiles = getProfiles().filter(p => p.id !== userId);
  setStorageJson(STORAGE_KEY_PROFILES, profiles);

  // 2. Remove user ascents and ratings
  deleteUserAscentsAndRatings(userId);
}

function getBoulderDominantGradeFeel(bRatings: BoulderRating[]): GradeFeel | null {
  if (!bRatings || bRatings.length === 0) return null;
  const counts = { soft: 0, fair: 0, stiff: 0 };
  bRatings.forEach(r => {
    if (r.gradeFeel && counts[r.gradeFeel] !== undefined) {
      counts[r.gradeFeel]++;
    }
  });
  const totalFeels = counts.soft + counts.fair + counts.stiff;
  if (totalFeels === 0) return null;
  if (counts.soft > counts.fair && counts.soft > counts.stiff) return 'soft';
  if (counts.stiff > counts.fair && counts.stiff > counts.soft) return 'stiff';
  if (counts.fair >= counts.soft && counts.fair >= counts.stiff) return 'fair';
  return null;
}

/**
 * Aggregates all statistics, KPIs, grade distribution and chronological logbook
 * for a user, optionally filtered by a specific gym (AC-2, AC-3, AC-4, AC-5, AC-8).
 * All statistics are resolved to universal Fontainebleau grades.
 */
export function getProfileData(userId: string, selectedGymId: string = 'all'): ProfileData {
  const profile = getProfile(userId);
  const allAscents = getAscents();
  const allRatings = getRatings();
  const userAscents = allAscents.filter(a => a.userId === userId);

  const gyms = getGyms();
  const defaultGym = gyms[0];
  const allSectors = gyms.length > 0 ? gyms.flatMap(g => getSectors(g.id)) : getSectors('gym-minimum-zh');
  const allScales = gyms.length > 0 ? gyms.flatMap(g => getGradeScales(g.id)) : getGradeScales('gym-minimum-zh');
  const wallBoulders = getWallBoulders();

  // Create lookup maps
  const boulderMap = new Map<string, WallBoulder>();
  wallBoulders.forEach(b => boulderMap.set(b.id, b));

  const sectorMap = new Map<string, { id: string; name: string; gymId: string }>();
  allSectors.forEach(s => sectorMap.set(s.id, { id: s.id, name: s.name, gymId: s.gymId }));

  const gymMap = new Map<string, string>();
  gyms.forEach(g => gymMap.set(g.id, g.name));

  const scaleMap = new Map<string, GymGradeScale>();
  allScales.forEach(s => {
    scaleMap.set(s.id, s);
    if (s.colorName) {
      const colorLower = s.colorName.toLowerCase().trim();
      const colorAscii = colorLower === 'weiß' ? 'weiss' : colorLower;
      scaleMap.set(`scale-${colorAscii}`, s);
      scaleMap.set(`scale-${colorLower}`, s);
      scaleMap.set(`scale_6a_${colorAscii}`, s);
      scaleMap.set(`scale_minimum_${colorAscii}`, s);
      scaleMap.set(colorLower, s);
      scaleMap.set(colorAscii, s);

      const enMap: Record<string, string> = {
        'grün': 'green',
        'gruen': 'green',
        'blau': 'blue',
        'gelb': 'yellow',
        'rot': 'red',
        'schwarz': 'black',
        'weiß': 'white',
        'weiss': 'white',
      };
      if (enMap[colorLower]) {
        scaleMap.set(`scale-${enMap[colorLower]}`, s);
      }
    }
  });

  // Build logbook items with full resolved metadata & Fontainebleau grades
  const resolvedLogbook: LogbookEntry[] = [];

  for (const ascent of userAscents) {
    const boulder = boulderMap.get(ascent.boulderId);
    const sector = boulder ? sectorMap.get(boulder.sectorId) : undefined;
    const gymId = sector?.gymId || defaultGym?.id || 'gym-minimum-zh';
    const gymName = gymMap.get(gymId) || defaultGym?.name || 'Minimum Boulder Zürich';
    const sectorName = sector?.name || 'Sektor Unbekannt';
    const sectorId = sector?.id || boulder?.sectorId || 'sector-unknown';

    // Grade scale resolution
    let gradeScale = boulder ? scaleMap.get(boulder.gradeScaleId) : undefined;
    if (!gradeScale && allScales.length > 0) {
      gradeScale = allScales[0];
    }
    const safeScale: GymGradeScale = gradeScale || {
      id: 'scale-default',
      gymId,
      colorName: 'Standard',
      colorHex: '#3b82f6',
      difficultyLabel: 'Mittel',
      fontRangeMin: '5c',
      fontRangeMax: '6a',
      sortOrder: 1,
    };

    // Filter by gym if requested
    if (selectedGymId !== 'all' && gymId !== selectedGymId) {
      continue;
    }

    // Resolve Fontainebleau grade using smart translation:
    // If the user himself submitted a gradeFeel for this boulder, prioritize the user's perception.
    // Otherwise fallback to the community's dominant grade feel (or neutral midpoint).
    const userRating = allRatings.find(r => r.boulderId === ascent.boulderId && r.userId === userId);
    const bRatings = allRatings.filter(r => r.boulderId === ascent.boulderId);
    const dominantGradeFeel = userRating?.gradeFeel ?? getBoulderDominantGradeFeel(bRatings);
    const fontGrade = resolveBoulderFontGrade(
      safeScale,
      dominantGradeFeel,
      boulder?.fontGrade
    );

    resolvedLogbook.push({
      id: `log-${ascent.id}`,
      ascentId: ascent.id,
      boulderId: ascent.boulderId,
      boulderName: boulder?.name,
      type: ascent.type,
      createdAt: ascent.createdAt,
      gymId,
      gymName,
      sectorId,
      sectorName,
      gradeScale: safeScale,
      fontGrade,
    });
  }

  // Sort logbook descending by date (newest first - AC-5)
  resolvedLogbook.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Compute KPIs based on filtered ascents (AC-2, AC-4)
  const toppedEntries = resolvedLogbook.filter(e => e.type === 'top' || e.type === 'flash');
  const flashEntries = resolvedLogbook.filter(e => e.type === 'flash');

  const totalTops = toppedEntries.length;
  const totalFlashes = flashEntries.length;

  let bestTopEntry: LogbookEntry | null = null;
  for (const entry of toppedEntries) {
    if (!bestTopEntry || compareFontGrades(entry.fontGrade, bestTopEntry.fontGrade) > 0) {
      bestTopEntry = entry;
    }
  }

  let bestFlashEntry: LogbookEntry | null = null;
  for (const entry of flashEntries) {
    if (!bestFlashEntry || compareFontGrades(entry.fontGrade, bestFlashEntry.fontGrade) > 0) {
      bestFlashEntry = entry;
    }
  }

  const kpis: ProfileKPIs = {
    totalTops,
    totalFlashes,
    bestTop: bestTopEntry ? bestTopEntry.gradeScale : null,
    bestFlash: bestFlashEntry ? bestFlashEntry.gradeScale : null,
    bestTopFont: bestTopEntry ? bestTopEntry.fontGrade : null,
    bestFlashFont: bestFlashEntry ? bestFlashEntry.fontGrade : null,
  };

  // Compute Grade Distribution on Fontainebleau Scale (AC-3, AC-4, AC-8)
  const inferredGymId = userAscents.length > 0
    ? (boulderMap.get(userAscents[0].boulderId)?.sectorId ? sectorMap.get(boulderMap.get(userAscents[0].boulderId)!.sectorId)?.gymId : undefined)
    : undefined;
  const activeGymId = selectedGymId !== 'all' ? selectedGymId : (inferredGymId || defaultGym?.id || 'gym-minimum-zh');
  const targetScales = getGradeScales(activeGymId);
  const safeScales = targetScales.length > 0 ? targetScales : allScales;

  let minIdx = safeScales.length > 0
    ? getFontGradeIndex(safeScales[0].fontRangeMin)
    : getFontGradeIndex('4a');
  let maxIdx = safeScales.length > 0
    ? getFontGradeIndex(safeScales[safeScales.length - 1].fontRangeMax)
    : getFontGradeIndex('8a');

  if (minIdx === -1) minIdx = 1; // 4a
  if (maxIdx === -1) maxIdx = 17; // 8a

  if (minIdx > maxIdx) {
    const t = minIdx;
    minIdx = maxIdx;
    maxIdx = t;
  }

  for (const entry of toppedEntries) {
    const idx = getFontGradeIndex(entry.fontGrade);
    if (idx !== -1) {
      if (idx < minIdx) minIdx = idx;
      if (idx > maxIdx) maxIdx = idx;
    }
  }

  const gradeDistribution: GradeDistributionItem[] = [];
  for (let i = minIdx; i <= maxIdx; i++) {
    const fg = FONT_GRADE_LADDER[i];
    const scale = findMatchingGradeScale(fg, safeScales) || safeScales[0] || {
      id: `scale-${fg}`,
      gymId: activeGymId,
      colorName: fg,
      colorHex: '#3b82f6',
      difficultyLabel: fg,
      fontRangeMin: fg,
      fontRangeMax: fg,
      sortOrder: i,
    };

    const tops = toppedEntries.filter(e => e.fontGrade === fg && e.type === 'top').length;
    const flashes = flashEntries.filter(e => e.fontGrade === fg).length;

    gradeDistribution.push({
      fontGrade: fg,
      displayGrade: `Fb ${fg}`,
      gradeScale: scale,
      topCount: tops,
      flashCount: flashes,
      totalCount: tops + flashes,
    });
  }

  return {
    profile,
    kpis,
    gradeDistribution,
    logbook: resolvedLogbook,
  };
}
