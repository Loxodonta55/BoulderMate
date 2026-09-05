import {
  Ascent,
  AscentType,
  BoulderRating,
  RatingInput,
  BoulderStatsAggregate,
  WallBoulder,
  RadarAttributes,
  GradeFeel
} from '../types/boulder';

export const STORAGE_KEY_ASCENTS = 'boulderapp_ascents_v3';
export const STORAGE_KEY_RATINGS = 'boulderapp_ratings_v3';

// Initial realistic seed data for community engagement
export const SEED_ASCENTS: Ascent[] = [
  {
    id: 'ascent-1',
    userId: 'user-jonas',
    userNickname: 'Jonas K.',
    boulderId: 'boulder-existing-1',
    type: 'flash',
    createdAt: '2026-09-02T16:30:00Z',
  },
  {
    id: 'ascent-2',
    userId: 'user-lena',
    userNickname: 'Lena Berg',
    boulderId: 'boulder-existing-1',
    type: 'top',
    createdAt: '2026-09-03T11:15:00Z',
  },
  {
    id: 'ascent-3',
    userId: 'user-max',
    userNickname: 'Max Mustermann',
    boulderId: 'boulder-existing-1',
    type: 'top',
    createdAt: '2026-09-03T18:45:00Z',
  },
  {
    id: 'ascent-4',
    userId: 'user-sophie',
    userNickname: 'Sophie T.',
    boulderId: 'boulder-existing-1',
    type: 'project',
    createdAt: '2026-09-04T10:00:00Z',
  },
  {
    id: 'ascent-5',
    userId: 'user-alex',
    userNickname: 'Alex M.',
    boulderId: 'boulder-existing-2',
    type: 'top',
    createdAt: '2026-09-02T19:00:00Z',
  },
  {
    id: 'ascent-6',
    userId: 'user-jonas',
    userNickname: 'Jonas K.',
    boulderId: 'boulder-existing-2',
    type: 'flash',
    createdAt: '2026-09-04T14:20:00Z',
  }
];

export const SEED_RATINGS: BoulderRating[] = [
  {
    id: 'rating-1',
    boulderId: 'boulder-existing-1',
    userId: 'user-jonas',
    userNickname: 'Jonas K.',
    gradeFeel: 'soft',
    qualityStars: 5,
    radar: { kraft: 4, technik: 3, balance: 2, koordination: 4, flexibilitaet: 2 },
    createdAt: '2026-09-02T16:35:00Z',
    updatedAt: '2026-09-02T16:35:00Z',
  },
  {
    id: 'rating-2',
    boulderId: 'boulder-existing-1',
    userId: 'user-lena',
    userNickname: 'Lena Berg',
    gradeFeel: 'fair',
    qualityStars: 4,
    radar: { kraft: 5, technik: 3, balance: 3, koordination: 4, flexibilitaet: 2 },
    createdAt: '2026-09-03T11:20:00Z',
    updatedAt: '2026-09-03T11:20:00Z',
  },
  {
    id: 'rating-3',
    boulderId: 'boulder-existing-1',
    userId: 'user-max',
    userNickname: 'Max Mustermann',
    gradeFeel: 'soft',
    qualityStars: 4,
    radar: { kraft: 3, technik: 3, balance: 2, koordination: 4, flexibilitaet: 3 },
    createdAt: '2026-09-03T18:50:00Z',
    updatedAt: '2026-09-03T18:50:00Z',
  },
  {
    id: 'rating-4',
    boulderId: 'boulder-existing-2',
    userId: 'user-alex',
    userNickname: 'Alex M.',
    gradeFeel: 'stiff',
    qualityStars: 5,
    radar: { kraft: 4, technik: 5, balance: 4, koordination: 3, flexibilitaet: 4 },
    createdAt: '2026-09-02T19:05:00Z',
    updatedAt: '2026-09-02T19:05:00Z',
  }
];

let memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    memoryStore[key] = value;
  }
}

export function resetAscentAndRatingStorage(): void {
  memoryStore = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_ASCENTS);
    window.localStorage.removeItem(STORAGE_KEY_RATINGS);
  }
}

// ----------------------------------------------------
// Ascents (AC-3, AC-4, AC-9)
// ----------------------------------------------------

export function getAscents(boulderId?: string): Ascent[] {
  const raw = getStorageItem(STORAGE_KEY_ASCENTS);
  let list: Ascent[] = [];
  if (!raw) {
    list = [...SEED_ASCENTS];
    setStorageItem(STORAGE_KEY_ASCENTS, JSON.stringify(list));
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_ASCENTS];
    }
  }

  if (boulderId) {
    return list.filter(a => a.boulderId === boulderId);
  }
  return list;
}

export function getUserAscent(userId: string, boulderId: string): Ascent | null {
  const all = getAscents(boulderId);
  return all.find(a => a.userId === userId) || null;
}

/**
 * Logs or updates an ascent for a user on a boulder.
 * AC-3: Users can set 'flash', 'top', or 'project'.
 * A new 'top' or 'flash' replaces a previous 'project'.
 * AC-4: Returns isFirstTopOrFlash = true if this is a newly achieved top/flash
 * to trigger the rating bottom sheet.
 */
export function logAscent(
  userId: string,
  userNickname: string,
  boulderId: string,
  type: AscentType,
  userAvatarUrl?: string
): { ascent: Ascent; isFirstTopOrFlash: boolean } {
  const all = getAscents();
  const existingIdx = all.findIndex(a => a.userId === userId && a.boulderId === boulderId);
  const now = new Date().toISOString();

  let isFirstTopOrFlash = false;
  let resultAscent: Ascent;

  if (existingIdx >= 0) {
    const prev = all[existingIdx];
    // Check if transition from no-top/project to top/flash
    if (prev.type === 'project' && (type === 'top' || type === 'flash')) {
      isFirstTopOrFlash = true;
    }
    resultAscent = {
      ...prev,
      type,
      userNickname,
      userAvatarUrl: userAvatarUrl || prev.userAvatarUrl,
      createdAt: now,
    };
    all[existingIdx] = resultAscent;
  } else {
    if (type === 'top' || type === 'flash') {
      isFirstTopOrFlash = true;
    }
    resultAscent = {
      id: `ascent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      userNickname,
      userAvatarUrl,
      boulderId,
      type,
      createdAt: now,
    };
    all.push(resultAscent);
  }

  setStorageItem(STORAGE_KEY_ASCENTS, JSON.stringify(all));
  return { ascent: resultAscent, isFirstTopOrFlash };
}

export function deleteAscent(userId: string, boulderId: string): boolean {
  const all = getAscents();
  const filtered = all.filter(a => !(a.userId === userId && a.boulderId === boulderId));
  if (filtered.length !== all.length) {
    setStorageItem(STORAGE_KEY_ASCENTS, JSON.stringify(filtered));
    return true;
  }
  return false;
}

export function deleteUserAscentsAndRatings(userId: string): void {
  const allAscents = getAscents();
  const filteredAscents = allAscents.filter(a => a.userId !== userId);
  setStorageItem(STORAGE_KEY_ASCENTS, JSON.stringify(filteredAscents));

  const allRatings = getRatings();
  const filteredRatings = allRatings.filter(r => r.userId !== userId);
  setStorageItem(STORAGE_KEY_RATINGS, JSON.stringify(filteredRatings));
}

// ----------------------------------------------------
// Ratings (AC-5, AC-6, AC-7)
// ----------------------------------------------------

export function getRatings(boulderId?: string): BoulderRating[] {
  const raw = getStorageItem(STORAGE_KEY_RATINGS);
  let list: BoulderRating[] = [];
  if (!raw) {
    list = [...SEED_RATINGS];
    setStorageItem(STORAGE_KEY_RATINGS, JSON.stringify(list));
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_RATINGS];
    }
  }

  if (boulderId) {
    return list.filter(r => r.boulderId === boulderId);
  }
  return list;
}

export function getUserRating(userId: string, boulderId: string): BoulderRating | null {
  const all = getRatings(boulderId);
  return all.find(r => r.userId === userId) || null;
}

/**
 * Saves or updates a user rating for a boulder.
 * AC-7: One rating per user per boulder. Later submissions update existing rating.
 */
export function saveRating(
  userId: string,
  userNickname: string,
  boulderId: string,
  input: RatingInput
): BoulderRating {
  const all = getRatings();
  const existingIdx = all.findIndex(r => r.userId === userId && r.boulderId === boulderId);
  const now = new Date().toISOString();

  let result: BoulderRating;

  if (existingIdx >= 0) {
    const prev = all[existingIdx];
    result = {
      ...prev,
      userNickname,
      gradeFeel: input.gradeFeel !== undefined ? input.gradeFeel : prev.gradeFeel,
      qualityStars: input.qualityStars !== undefined ? input.qualityStars : prev.qualityStars,
      radar: input.radar !== undefined ? input.radar : prev.radar,
      updatedAt: now,
    };
    all[existingIdx] = result;
  } else {
    result = {
      id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      boulderId,
      userId,
      userNickname,
      gradeFeel: input.gradeFeel,
      qualityStars: input.qualityStars,
      radar: input.radar,
      createdAt: now,
      updatedAt: now,
    };
    all.push(result);
  }

  setStorageItem(STORAGE_KEY_RATINGS, JSON.stringify(all));
  return result;
}

// ----------------------------------------------------
// Aggregation & Statistics (AC-2, AC-8, AC-9)
// ----------------------------------------------------

/**
 * Radar aggregation formula from SPEC-003:
 * For each axis A in {kraft, technik, balance, koordination, flexibilitaet}:
 *   Wert_A = (W_setter * Initial_A + sum(User_i_A)) / (W_setter + N)
 * with W_setter = 5 as base weight, and N being ratings with radar values.
 */
export function computeAggregatedRadar(
  setterRadar: RadarAttributes,
  ratings: BoulderRating[]
): RadarAttributes {
  const W_SETTER = 5;
  const ratingsWithRadar = ratings.filter(r => r.radar !== undefined);
  const n = ratingsWithRadar.length;

  const axes: (keyof RadarAttributes)[] = [
    'kraft',
    'technik',
    'balance',
    'koordination',
    'flexibilitaet'
  ];

  const result: Partial<RadarAttributes> = {};

  for (const axis of axes) {
    const setterVal = setterRadar[axis] || 3;
    const userSum = ratingsWithRadar.reduce((acc, r) => acc + (r.radar?.[axis] || 3), 0);
    const weighted = (W_SETTER * setterVal + userSum) / (W_SETTER + n);
    // Round to 1 decimal place
    result[axis] = Math.round(weighted * 10) / 10;
  }

  return result as RadarAttributes;
}

/**
 * Aggregates all statistics, star ratings, soft/fair/stiff breakdown,
 * and radar chart values for a given boulder.
 */
export function computeBoulderStatsAggregate(
  boulder: WallBoulder,
  ratings: BoulderRating[],
  ascents: Ascent[]
): BoulderStatsAggregate {
  const boulderRatings = ratings.filter(r => r.boulderId === boulder.id);
  const boulderAscents = ascents.filter(a => a.boulderId === boulder.id);

  // Quality stars average
  const starsRatings = boulderRatings.filter(r => typeof r.qualityStars === 'number');
  const avgStars = starsRatings.length > 0
    ? Math.round((starsRatings.reduce((sum, r) => sum + (r.qualityStars || 0), 0) / starsRatings.length) * 10) / 10
    : 0;

  // Grade feel counts & percentages (Soft / Fair / Stiff)
  const gradeFeelCounts = {
    soft: 0,
    fair: 0,
    stiff: 0,
  };

  boulderRatings.forEach(r => {
    if (r.gradeFeel && gradeFeelCounts[r.gradeFeel] !== undefined) {
      gradeFeelCounts[r.gradeFeel]++;
    }
  });

  const totalFeels = gradeFeelCounts.soft + gradeFeelCounts.fair + gradeFeelCounts.stiff;
  const gradeFeelPercentages = {
    soft: totalFeels > 0 ? Math.round((gradeFeelCounts.soft / totalFeels) * 100) : 0,
    fair: totalFeels > 0 ? Math.round((gradeFeelCounts.fair / totalFeels) * 100) : 0,
    stiff: totalFeels > 0 ? Math.round((gradeFeelCounts.stiff / totalFeels) * 100) : 0,
  };

  // Dominant grade feel
  let dominantGradeFeel: GradeFeel | null = null;
  if (totalFeels > 0) {
    if (gradeFeelCounts.soft > gradeFeelCounts.fair && gradeFeelCounts.soft > gradeFeelCounts.stiff) {
      dominantGradeFeel = 'soft';
    } else if (gradeFeelCounts.stiff > gradeFeelCounts.fair && gradeFeelCounts.stiff > gradeFeelCounts.soft) {
      dominantGradeFeel = 'stiff';
    } else if (gradeFeelCounts.fair >= gradeFeelCounts.soft && gradeFeelCounts.fair >= gradeFeelCounts.stiff) {
      dominantGradeFeel = 'fair';
    }
  }

  // Ascents breakdown
  const totalFlashes = boulderAscents.filter(a => a.type === 'flash').length;
  const totalTopsOnly = boulderAscents.filter(a => a.type === 'top').length;
  const totalProjects = boulderAscents.filter(a => a.type === 'project').length;
  const totalTops = totalFlashes + totalTopsOnly; // Flashes count as tops

  // Radar aggregation (AC-2)
  const radarAggregate = computeAggregatedRadar(boulder.radar, boulderRatings);

  // Sorted ascents (newest first)
  const sortedAscents = [...boulderAscents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    boulderId: boulder.id,
    totalRatings: boulderRatings.length,
    avgStars,
    gradeFeelCounts,
    gradeFeelPercentages,
    dominantGradeFeel,
    totalTops,
    totalFlashes,
    totalProjects,
    radarAggregate,
    ascents: sortedAscents,
  };
}
