import {
  UserProfile,
  ProfileKPIs,
  GradeDistributionItem,
  LogbookEntry,
  ProfileData,
  GymGradeScale,
  WallBoulder,
} from '../types/boulder';
import { getAscents, deleteUserAscentsAndRatings } from './ratingAndAscentService';
import { getWallBoulders, getSectors, getGradeScales, getGyms } from './batchBoulderService';

export const STORAGE_KEY_PROFILES = 'boulderapp_profiles_v1';

export const SEED_PROFILES: UserProfile[] = [
  {
    id: 'user-boris',
    nickname: 'Boris',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'admin-6aplus',
    nickname: 'Admin6APlus',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'schrauber-6aplus',
    nickname: 'Schrauber6aPlus',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'hans-kletterer',
    nickname: 'HansDereinfacheKletterer',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'admin-minimum',
    nickname: 'AdminMinimum',
    createdAt: '2026-05-15T10:00:00Z',
  },
  {
    id: 'schrauber-minimum',
    nickname: 'Schrauber Minimum',
    createdAt: '2026-05-15T10:00:00Z',
  },
];

let memoryProfiles: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return memoryProfiles[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    memoryProfiles[key] = value;
  }
}

export function resetProfileStorage(): void {
  memoryProfiles = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_PROFILES);
  }
}

export function getProfiles(): UserProfile[] {
  const raw = getStorageItem(STORAGE_KEY_PROFILES);
  if (!raw) {
    const list = [...SEED_PROFILES];
    setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(list));
    return list;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...SEED_PROFILES];
  }
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
  setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(updated));
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

  setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  return updatedProfile;
}

/**
 * AC-7: Deletes user's account data (profile, ascents and ratings).
 */
export function deleteAccount(userId: string): void {
  // 1. Remove profile
  const profiles = getProfiles().filter(p => p.id !== userId);
  setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));

  // 2. Remove user ascents and ratings
  deleteUserAscentsAndRatings(userId);
}

/**
 * Aggregates all statistics, KPIs, grade distribution and chronological logbook
 * for a user, optionally filtered by a specific gym (AC-2, AC-3, AC-4, AC-5, AC-8).
 */
export function getProfileData(userId: string, selectedGymId: string = 'all'): ProfileData {
  const profile = getProfile(userId);
  const allAscents = getAscents();
  const userAscents = allAscents.filter(a => a.userId === userId);

  const gyms = getGyms();
  const defaultGym = gyms[0];
  const allSectors = getSectors(defaultGym?.id || 'gym-minimum-zh');
  const allScales = getGradeScales(defaultGym?.id || 'gym-minimum-zh');
  const wallBoulders = getWallBoulders();

  // Create lookup maps
  const boulderMap = new Map<string, WallBoulder>();
  wallBoulders.forEach(b => boulderMap.set(b.id, b));

  const sectorMap = new Map<string, { id: string; name: string; gymId: string }>();
  allSectors.forEach(s => sectorMap.set(s.id, { id: s.id, name: s.name, gymId: s.gymId }));

  const gymMap = new Map<string, string>();
  gyms.forEach(g => gymMap.set(g.id, g.name));

  const scaleMap = new Map<string, GymGradeScale>();
  allScales.forEach(s => scaleMap.set(s.id, s));

  // Build logbook items with full resolved metadata
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
    });
  }

  // Sort logbook descending by date (newest first - AC-5)
  resolvedLogbook.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Compute KPIs based on filtered ascents (AC-2, AC-4)
  const toppedEntries = resolvedLogbook.filter(e => e.type === 'top' || e.type === 'flash');
  const flashEntries = resolvedLogbook.filter(e => e.type === 'flash');

  const totalTops = toppedEntries.length;
  const totalFlashes = flashEntries.length;

  let bestTop: GymGradeScale | null = null;
  let bestTopOrder = -1;
  for (const entry of toppedEntries) {
    if (entry.gradeScale.sortOrder > bestTopOrder) {
      bestTopOrder = entry.gradeScale.sortOrder;
      bestTop = entry.gradeScale;
    }
  }

  let bestFlash: GymGradeScale | null = null;
  let bestFlashOrder = -1;
  for (const entry of flashEntries) {
    if (entry.gradeScale.sortOrder > bestFlashOrder) {
      bestFlashOrder = entry.gradeScale.sortOrder;
      bestFlash = entry.gradeScale;
    }
  }

  const kpis: ProfileKPIs = {
    totalTops,
    totalFlashes,
    bestTop,
    bestFlash,
  };

  // Compute Grade Distribution (AC-3, AC-4, AC-8)
  // Determine list of grade scales to represent
  const activeGymId = selectedGymId !== 'all' ? selectedGymId : defaultGym?.id || 'gym-minimum-zh';
  const targetScales = getGradeScales(activeGymId);

  const gradeDistribution: GradeDistributionItem[] = targetScales.map(scale => {
    const scaleTops = toppedEntries.filter(e => e.gradeScale.id === scale.id && e.type === 'top').length;
    const scaleFlashes = flashEntries.filter(e => e.gradeScale.id === scale.id).length;
    return {
      gradeScale: scale,
      topCount: scaleTops,
      flashCount: scaleFlashes,
      totalCount: scaleTops + scaleFlashes,
    };
  });

  return {
    profile,
    kpis,
    gradeDistribution,
    logbook: resolvedLogbook,
  };
}
