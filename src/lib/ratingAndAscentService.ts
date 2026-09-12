import {
  Ascent,
  AscentType,
  BoulderRating,
  RatingInput,
  BoulderStatsAggregate,
  WallBoulder,
  RadarAttributes,
  GradeFeel,
  BoulderComment
} from '../types/boulder';

import { SEED_ASCENTS, SEED_RATINGS } from './seedData';
import {
  getStorageString,
  setStorageJson,
  removeStorageItem,
} from './storageUtils';

export { SEED_ASCENTS, SEED_RATINGS };

export const STORAGE_KEY_ASCENTS = 'boulderapp_ascents_v3';
export const STORAGE_KEY_RATINGS = 'boulderapp_ratings_v3';
export const STORAGE_KEY_COMMENTS = 'boulderapp_comments_v3';

export const SEED_COMMENTS: BoulderComment[] = [
  {
    id: 'comment-seed-1',
    boulderId: 'boulder-existing-1',
    userId: 'hans-kletterer',
    userNickname: 'HansDereinfacheKletterer',
    text: 'Der Dyno geht super, wenn man den rechten Fuß etwas höher auf Reibung stellt! Geniale Route.',
    createdAt: '2026-09-02T16:36:00Z'
  },
  {
    id: 'comment-seed-2',
    boulderId: 'boulder-existing-1',
    userId: 'admin-minimum',
    userNickname: 'AdminMinimum',
    text: 'Schöne Linie. Zieht ordentlich in die Unterarme, aber sehr fair bewertet.',
    createdAt: '2026-09-03T11:22:00Z'
  },
  {
    id: 'comment-seed-3',
    boulderId: 'boulder-existing-2',
    userId: 'schrauber-minimum',
    userNickname: 'Schrauber Minimum',
    text: 'Heel-Hook gut setzen, dann spart man enorm Kraft für den finalen Zug.',
    createdAt: '2026-09-02T19:08:00Z'
  }
];

let lastTimestamp = 0;
export function notifyRatingsChanged(boulderId?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bouldermate:ratings_updated', {
      detail: { boulderId, timestamp: Date.now() }
    }));
  }
}

export function notifyAscentsChanged(boulderId?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bouldermate:ascents_updated', {
      detail: { boulderId, timestamp: Date.now() }
    }));
  }
}

export function getUniqueIsoTimestamp(): string {
  let now = Date.now();
  if (now <= lastTimestamp) {
    now = lastTimestamp + 1;
  }
  lastTimestamp = now;
  return new Date(now).toISOString();
}

export function resetAscentAndRatingStorage(): void {
  lastTimestamp = 0;
  removeStorageItem(STORAGE_KEY_ASCENTS);
  removeStorageItem(STORAGE_KEY_RATINGS);
  removeStorageItem(STORAGE_KEY_COMMENTS);
}

export function deleteBoulderInteractions(boulderId: string): void {
  const ascents = getAscents().filter(a => a.boulderId !== boulderId);
  setStorageJson(STORAGE_KEY_ASCENTS, ascents);
  const ratings = getRatings().filter(r => r.boulderId !== boulderId);
  setStorageJson(STORAGE_KEY_RATINGS, ratings);
  const comments = getComments().filter(c => c.boulderId !== boulderId);
  setStorageJson(STORAGE_KEY_COMMENTS, comments);
}

// ----------------------------------------------------
// Ascents (AC-3, AC-4, AC-9)
// ----------------------------------------------------

export function getAscents(boulderId?: string): Ascent[] {
  const raw = getStorageString(STORAGE_KEY_ASCENTS);
  let list: Ascent[];
  if (!raw) {
    list = [...SEED_ASCENTS];
    setStorageJson(STORAGE_KEY_ASCENTS, list);
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_ASCENTS];
    }
  }

  return boulderId ? list.filter(a => a.boulderId === boulderId) : list;
}

export function isUserMatch(u1?: string, u2?: string): boolean {
  if (!u1 || !u2) return false;
  if (u1 === u2) return true;
  const DEMO_MAP: Record<string, string> = {
    'user-boris': '00000000-1d0e-4000-8000-e92d69136f33',
    'admin-6aplus': '00000000-37e7-4000-8000-0743462b539d',
    'schrauber-6aplus': '00000000-08ca-4000-8000-6e6f5bce818f',
    'hans-kletterer': '00000000-4553-4000-8000-3dd13fac9e0f',
    'admin-minimum': '00000000-2ff9-4000-8000-b7902cb24230',
    'schrauber-minimum': '00000000-5a7c-4000-8000-7702607a9a42',
  };
  if (DEMO_MAP[u1] === u2 || DEMO_MAP[u2] === u1) return true;
  return false;
}

export function getUserAscent(userId: string, boulderId: string): Ascent | null {
  const all = getAscents(boulderId);
  return all.find(a => isUserMatch(a.userId, userId)) || null;
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
  const now = getUniqueIsoTimestamp();

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

  setStorageJson(STORAGE_KEY_ASCENTS, all);
  notifyAscentsChanged(boulderId);

  try {
    import('./syncService').then(m => {
      const syncFn = (m as any)?.syncAscentToSupabase;
      if (typeof syncFn === 'function') {
        syncFn(resultAscent).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}

  return { ascent: resultAscent, isFirstTopOrFlash };
}

export function deleteAscent(userId: string, boulderId: string): boolean {
  const all = getAscents();
  const filtered = all.filter(a => !(a.userId === userId && a.boulderId === boulderId));
  if (filtered.length !== all.length) {
    setStorageJson(STORAGE_KEY_ASCENTS, filtered);
    notifyAscentsChanged(boulderId);

    try {
      import('./syncService').then(m => {
        const syncFn = (m as any)?.deleteAscentFromSupabase;
        if (typeof syncFn === 'function') {
          syncFn(userId, boulderId).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}

    return true;
  }
  return false;
}

export function deleteUserAscentsAndRatings(userId: string): void {
  const allAscents = getAscents();
  const filteredAscents = allAscents.filter(a => a.userId !== userId);
  setStorageJson(STORAGE_KEY_ASCENTS, filteredAscents);

  const allRatings = getRatings();
  const filteredRatings = allRatings.filter(r => r.userId !== userId);
  setStorageJson(STORAGE_KEY_RATINGS, filteredRatings);
}

// ----------------------------------------------------
// Ratings (AC-5, AC-6, AC-7)
// ----------------------------------------------------

export function getRatings(boulderId?: string): BoulderRating[] {
  const raw = getStorageString(STORAGE_KEY_RATINGS);
  let list: BoulderRating[];
  if (!raw) {
    list = [...SEED_RATINGS];
    setStorageJson(STORAGE_KEY_RATINGS, list);
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_RATINGS];
    }
  }

  return boulderId ? list.filter(r => r.boulderId === boulderId) : list;
}

export function getUserRating(userId: string, boulderId: string): BoulderRating | null {
  const all = getRatings(boulderId);
  return all.find(r => isUserMatch(r.userId, userId)) || null;
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

  setStorageJson(STORAGE_KEY_RATINGS, all);
  notifyRatingsChanged(boulderId);

  try {
    import('./syncService').then(m => {
      const syncFn = (m as any)?.syncRatingToSupabase;
      if (typeof syncFn === 'function') {
        syncFn(result).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}

  return result;
}

/**
 * Löscht die persönliche Bewertung eines Kletterers für einen Boulder.
 * Re-kalkuliert aggregierte Werte in Echtzeit und stößt den Supabase-Sync an.
 */
export function deleteRating(userId: string, boulderId: string): boolean {
  const all = getRatings();
  const filtered = all.filter(r => !(r.userId === userId && r.boulderId === boulderId));
  if (filtered.length !== all.length) {
    setStorageJson(STORAGE_KEY_RATINGS, filtered);
    notifyRatingsChanged(boulderId);

    try {
      import('./syncService').then(m => {
        const syncFn = (m as any)?.deleteRatingFromSupabase;
        if (typeof syncFn === 'function') {
          syncFn(userId, boulderId).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}

    return true;
  }
  return false;
}

// ----------------------------------------------------
// Comments & Route Discussion
// ----------------------------------------------------

export function getComments(boulderId?: string): BoulderComment[] {
  const raw = getStorageString(STORAGE_KEY_COMMENTS);
  let list: BoulderComment[];
  if (!raw) {
    list = [...SEED_COMMENTS];
    setStorageJson(STORAGE_KEY_COMMENTS, list);
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [...SEED_COMMENTS];
    }
  }

  const filtered = boulderId ? list.filter(c => c.boulderId === boulderId) : list;
  return [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addComment(
  userId: string,
  userNickname: string,
  boulderId: string,
  text: string,
  userAvatarUrl?: string
): BoulderComment {
  const all = getComments();
  const now = getUniqueIsoTimestamp();
  const newComment: BoulderComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    boulderId,
    userId,
    userNickname,
    userAvatarUrl,
    text: text.trim(),
    createdAt: now,
  };
  all.unshift(newComment);
  setStorageJson(STORAGE_KEY_COMMENTS, all);
  return newComment;
}

export function deleteComment(commentId: string, currentUserId: string, isPlatformAdmin = false): boolean {
  const all = getComments();
  const target = all.find(c => c.id === commentId);
  if (!target) return false;
  if (target.userId !== currentUserId && !isPlatformAdmin) return false;

  const filtered = all.filter(c => c.id !== commentId);
  setStorageJson(STORAGE_KEY_COMMENTS, filtered);
  return true;
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
    'maximalkraft',
    'kraftausdauer',
    'technik',
    'balance',
    'koordination',
    'flexibilitaet'
  ];

  const result: Partial<RadarAttributes> = {};

  for (const axis of axes) {
    let setterVal = setterRadar[axis];
    if (setterVal === undefined) {
      setterVal = axis === 'maximalkraft' ? (setterRadar.kraft ?? 3) : 3;
    }
    const userSum = ratingsWithRadar.reduce((acc, r) => {
      let uVal = r.radar?.[axis];
      if (uVal === undefined) {
        uVal = axis === 'maximalkraft' ? (r.radar?.kraft ?? 3) : 3;
      }
      return acc + uVal;
    }, 0);
    const weighted = (W_SETTER * setterVal + userSum) / (W_SETTER + n);
    // Round to 1 decimal place
    result[axis] = Math.round(weighted * 10) / 10;
  }

  // Preserve legacy kraft property
  result.kraft = result.maximalkraft;

  return result as RadarAttributes;
}

/**
 * Aggregates all statistics, star ratings, soft/fair/stiff breakdown,
 * and radar chart values for a given boulder.
 */
export function computeBoulderStatsAggregate(
  boulder: WallBoulder,
  ratings: BoulderRating[] = getRatings(),
  ascents: Ascent[] = getAscents(),
  comments: BoulderComment[] = getComments()
): BoulderStatsAggregate {
  const boulderRatings = ratings.filter(r => r.boulderId === boulder.id);
  const boulderAscents = ascents.filter(a => a.boulderId === boulder.id);
  const boulderComments = comments.filter(c => c.boulderId === boulder.id);

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

  // Sorted ratings (newest first)
  const sortedRatings = [...boulderRatings].sort(
    (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
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
    ratings: sortedRatings,
    comments: boulderComments,
  };
}
