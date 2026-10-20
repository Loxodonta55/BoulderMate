import { BoulderRating, GradeFeel, GymGradeScale, LogbookEntry, RadarAttributes, Sector, WallBoulder } from '../types/boulder';
import { getAthletePerformanceReport } from './performanceService';
import { getProfileData } from './profileService';
import { getGradeScales, getSectors, getWallBoulders, isSectorInRebuild } from './batchBoulderService';
import { computeAggregatedRadar, getRatings, getUserAscent } from './ratingAndAscentService';
import { compareFontGrades, getFontGradeIndex, normalizeFontGrade, resolveBoulderFontGrade } from './gradeConverter';
import { AttributeHighlight, DEEP_DIVE_AXES, DeepDiveAxis, axisLabel, toAxisValues } from './deepDiveService';

/**
 * SPEC-051 «Challenge Today» · Eine Route über deinem sicheren Grad, die zu deinen Stärken passt.
 * Alles wird nur auf dem Gerät berechnet und gespeichert (keine Datenbank).
 */

export const STRENGTH_MIN = 3.5;
export const STRENGTH_FALLBACK_MIN = 3.2;
export const WEAKNESS_MAX = 2.5;
/** Anforderung ab der eine Stärke «stark gefordert» ist. */
export const DEMAND_STRONG = 4;
/** Anforderung, die eine Schwäche höchstens haben darf («kaum nötig»). */
export const DEMAND_LOW_MAX = 3;
export const MIN_STARS = 3;
export const SAFE_GRADE_DAYS = 90;
export const MAX_SWAPS = 2;
export const POOL_SIZE = 3;
export const BANNER_CHANCE = 0.4;
export const BANNER_GUARANTEE_AFTER = 3;
export const BANNER_PAUSE_DAYS = 14;

export const STORE_KEY = 'boulderapp_challenge_today_v1';
export const BANNER_SETTING_KEY = 'boulderapp_challenge_banner_v1';
export const CHALLENGE_TODAY_EVENT = 'bouldermate:challenge_today_updated';

// ---------------------------------------------------------------------------
// Reine Berechnung
// ---------------------------------------------------------------------------

export interface ChallengeCandidate {
  boulder: WallBoulder;
  scale?: GymGradeScale;
  sector?: Sector;
  /** Effektiver Fb-Grad (Stiff +1, Soft −1). */
  fontGrade: string;
  feel: GradeFeel | null;
  /** Stufen über dem sicheren Grad (1 oder 2). */
  steps: number;
  safeGrade: string;
  /** Höchstens 2 deiner Stärken, die die Route stark fordert (Wert = Anforderung der Route). */
  strengths: AttributeHighlight[];
  /** Höchstens 1 deiner Schwächen, die kaum nötig ist. */
  lowNeeds: AttributeHighlight[];
  stars: number | null;
  score: number;
}

export interface ChallengeContext {
  userRadar: RadarAttributes;
  unlocked: boolean;
  logbook: LogbookEntry[];
  boulders: WallBoulder[];
  scaleOf: (b: WallBoulder) => GymGradeScale | undefined;
  sectorOf: (b: WallBoulder) => Sector | undefined;
  ratingsOf: (boulderId: string) => BoulderRating[];
  isTopped: (boulderId: string) => boolean;
  now: Date;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export function strengthsOf(radar: RadarAttributes): DeepDiveAxis[] {
  const v = toAxisValues(radar);
  const sorted = [...DEEP_DIVE_AXES].sort((a, b) => v[b] - v[a]);
  const strong = sorted.filter(k => v[k] >= STRENGTH_MIN);
  if (strong.length) return strong;
  return v[sorted[0]] >= STRENGTH_FALLBACK_MIN ? [sorted[0]] : [];
}

export function weaknessesOf(radar: RadarAttributes): DeepDiveAxis[] {
  const v = toAxisValues(radar);
  const sorted = [...DEEP_DIVE_AXES].sort((a, b) => v[a] - v[b]);
  const weak = sorted.filter(k => v[k] <= WEAKNESS_MAX);
  if (!weak.includes(sorted[0]) && v[sorted[0]] < 3) weak.unshift(sorted[0]);
  return weak;
}

/** Schwerster Fb-Grad mit ≥ 2 Tops in 90 Tagen, sonst ≥ 2 Tops überhaupt, sonst bester Top. */
export function safeGrade(logbook: LogbookEntry[], now: Date = new Date()): string | null {
  const sends = logbook.filter(e => e.type === 'top' || e.type === 'flash');
  if (sends.length === 0) return null;
  const hardestWithTwo = (list: LogbookEntry[]) => {
    const counts = new Map<string, number>();
    const seen = new Set<string>();
    for (const e of list) {
      if (seen.has(e.boulderId)) continue;
      seen.add(e.boulderId);
      const g = normalizeFontGrade(e.fontGrade);
      counts.set(g, (counts.get(g) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([, n]) => n >= 2)
      .map(([g]) => g)
      .sort((a, b) => compareFontGrades(b, a))[0];
  };
  const recent = sends.filter(e => now.getTime() - new Date(e.createdAt).getTime() <= SAFE_GRADE_DAYS * DAY_MS);
  return (
    hardestWithTwo(recent) ||
    hardestWithTwo(sends) ||
    sends.map(e => normalizeFontGrade(e.fontGrade)).sort((a, b) => compareFontGrades(b, a))[0]
  );
}

export function majorityFeel(ratings: BoulderRating[]): GradeFeel | null {
  const c = { soft: 0, fair: 0, stiff: 0 };
  for (const r of ratings) if (r.gradeFeel) c[r.gradeFeel]++;
  if (c.soft + c.fair + c.stiff === 0) return null;
  if (c.stiff > c.fair && c.stiff > c.soft) return 'stiff';
  if (c.soft > c.fair && c.soft > c.stiff) return 'soft';
  return 'fair';
}

function avgStars(ratings: BoulderRating[]): number | null {
  const s = ratings.filter(r => typeof r.qualityStars === 'number');
  return s.length ? round1(s.reduce((sum, r) => sum + (r.qualityStars || 0), 0) / s.length) : null;
}

/**
 * Prüft einen Boulder. `ignoreTopped` erlaubt, die heutige Challenge nach dem Top weiter zu beschreiben.
 */
export function evaluateBoulder(b: WallBoulder, ctx: ChallengeContext, ignoreTopped = false): ChallengeCandidate | null {
  if (!ctx.unlocked || b.status !== 'active') return null;
  if (!ignoreTopped && ctx.isTopped(b.id)) return null;
  const sector = ctx.sectorOf(b);
  if (isSectorInRebuild(sector)) return null;
  const safe = safeGrade(ctx.logbook, ctx.now);
  if (!safe) return null;
  const strengths = strengthsOf(ctx.userRadar);
  if (strengths.length === 0) return null;
  const weaknesses = weaknessesOf(ctx.userRadar);

  const ratings = ctx.ratingsOf(b.id);
  const stars = avgStars(ratings);
  if (stars !== null && stars < MIN_STARS) return null;

  const scale = ctx.scaleOf(b);
  const feel = majorityFeel(ratings);
  const fontGrade = resolveBoulderFontGrade(scale, feel, b.fontGrade);
  const steps = getFontGradeIndex(fontGrade) - getFontGradeIndex(safe);
  if (getFontGradeIndex(fontGrade) < 0 || steps < 1 || steps > 2) return null;

  const demand = toAxisValues(computeAggregatedRadar(b.radar, ratings));
  const strong = strengths.filter(k => demand[k] >= DEMAND_STRONG);
  if (strong.length === 0) return null;
  if (weaknesses.some(k => demand[k] > DEMAND_LOW_MAX)) return null;

  const user = toAxisValues(ctx.userRadar);
  const fit = DEEP_DIVE_AXES.reduce((s, k) => s + (demand[k] - 3) * (user[k] - 3), 0);
  if (fit <= 0) return null;

  const score = round1(fit + ((stars ?? 3) - 3) + (steps === 1 ? 0.5 : 0));
  return {
    boulder: b,
    scale,
    sector,
    fontGrade,
    feel,
    steps,
    safeGrade: safe,
    strengths: strong
      .map(k => ({ key: k, label: axisLabel(k), value: round1(demand[k]) }))
      .sort((a, c) => c.value - a.value)
      .slice(0, 2),
    lowNeeds: weaknesses.slice(0, 1).map(k => ({ key: k, label: axisLabel(k), value: round1(demand[k]) })),
    stars,
    score,
  };
}

/** Alle Kandidatinnen, beste zuerst (F1). */
export function pickChallengeCandidates(ctx: ChallengeContext): ChallengeCandidate[] {
  return ctx.boulders
    .map(b => evaluateBoulder(b, ctx))
    .filter((c): c is ChallengeCandidate => c !== null)
    .sort((a, b) => b.score - a.score || a.boulder.id.localeCompare(b.boulder.id));
}

export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/** Reproduzierbarer Startwert pro Person, Halle und Tag. */
export function daySeed(userId: string, gymId: string, day: string): number {
  let h = 2166136261;
  for (const ch of `${userId}|${gymId}|${day}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Speicher (nur Gerät)
// ---------------------------------------------------------------------------

interface DayState {
  day: string;
  boulderId: string | null;
  swaps: number;
  shownIds: string[];
}

export interface BannerState {
  decidedDay?: string;
  show?: boolean;
  closedDay?: string;
  dismissStreak: number;
  pausedUntil?: string;
  visitsWithout: number;
}

interface UserState {
  days: Record<string, DayState>;
  banner: BannerState;
}

function readStore(): Record<string, UserState> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, UserState>): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* privater Modus: dann eben ohne Gedächtnis */
  }
}

function userState(store: Record<string, UserState>, userId: string): UserState {
  if (!store[userId]) store[userId] = { days: {}, banner: { dismissStreak: 0, visitsWithout: 0 } };
  return store[userId];
}

function notify(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHALLENGE_TODAY_EVENT));
}

export function isBannerEnabled(): boolean {
  try {
    return localStorage.getItem(BANNER_SETTING_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setBannerEnabled(on: boolean): void {
  try {
    localStorage.setItem(BANNER_SETTING_KEY, on ? 'on' : 'off');
  } catch {
    /* ignorieren */
  }
  notify();
}

// ---------------------------------------------------------------------------
// Tages-Challenge (F2)
// ---------------------------------------------------------------------------

export interface ChallengeToday {
  candidate: ChallengeCandidate | null;
  /** Stil-Profil frei (ab 5 Tops). */
  unlocked: boolean;
  done: boolean;
  canSwap: boolean;
}

export function buildChallengeContext(userId: string, gymId: string, now: Date = new Date()): ChallengeContext {
  const report = getAthletePerformanceReport(userId, 'all');
  const { logbook } = getProfileData(userId, 'all');
  const sectors = getSectors(gymId);
  const sectorMap = new Map(sectors.map(s => [s.id, s]));
  const scales = getGradeScales(gymId);
  const ratings = getRatings();
  return {
    userRadar: report.userRadar,
    unlocked: report.isUnlocked,
    logbook,
    boulders: getWallBoulders().filter(b => sectorMap.has(b.sectorId) && b.status === 'active'),
    scaleOf: b => scales.find(s => s.id === b.gradeScaleId),
    sectorOf: b => sectorMap.get(b.sectorId),
    ratingsOf: id => ratings.filter(r => r.boulderId === id),
    isTopped: id => {
      const a = getUserAscent(userId, id);
      return a?.type === 'top' || a?.type === 'flash';
    },
    now,
  };
}

/** Reine Variante für Tests: Kontext und Speicher-Zustand werden übergeben. */
export function resolveChallengeToday(
  ctx: ChallengeContext,
  userId: string,
  gymId: string,
  state: DayState | undefined
): { result: ChallengeToday; state: DayState } {
  const day = dayKey(ctx.now);
  const candidates = pickChallengeCandidates(ctx);
  let s: DayState = state && state.day === day ? { ...state } : { day, boulderId: null, swaps: 0, shownIds: [] };

  let candidate: ChallengeCandidate | null = null;
  if (s.boulderId) {
    const b = ctx.boulders.find(x => x.id === s.boulderId);
    candidate = b ? evaluateBoulder(b, ctx, true) : null;
  }
  if (!candidate && candidates.length) {
    const fresh = candidates.filter(c => !s.shownIds.includes(c.boulder.id));
    const pool = (fresh.length ? fresh : candidates).slice(0, POOL_SIZE);
    candidate = pool[daySeed(userId, gymId, day) % pool.length];
    s = { ...s, boulderId: candidate.boulder.id, shownIds: Array.from(new Set([...s.shownIds, candidate.boulder.id])) };
  }
  if (!candidate) s = { ...s, boulderId: null };

  const done = candidate ? ctx.isTopped(candidate.boulder.id) : false;
  const hasOther = candidates.some(c => !s.shownIds.includes(c.boulder.id));
  return {
    result: { candidate, unlocked: ctx.unlocked, done, canSwap: !done && s.swaps < MAX_SWAPS && hasOther },
    state: s,
  };
}

export function getChallengeToday(userId: string, gymId: string, now: Date = new Date()): ChallengeToday {
  if (!userId || userId === 'guest' || !gymId) return { candidate: null, unlocked: false, done: false, canSwap: false };
  const ctx = buildChallengeContext(userId, gymId, now);
  const store = readStore();
  const us = userState(store, userId);
  const { result, state } = resolveChallengeToday(ctx, userId, gymId, us.days[gymId]);
  const prev = us.days[gymId];
  if (!prev || JSON.stringify(prev) !== JSON.stringify(state)) {
    // Nur heutige Einträge behalten
    for (const g of Object.keys(us.days)) if (us.days[g].day !== state.day) delete us.days[g];
    us.days[gymId] = state;
    writeStore(store);
  }
  return result;
}

/** «Andere zeigen» (höchstens MAX_SWAPS-mal am Tag). */
export function swapChallengeToday(userId: string, gymId: string, now: Date = new Date()): ChallengeToday {
  const ctx = buildChallengeContext(userId, gymId, now);
  const store = readStore();
  const us = userState(store, userId);
  const { state } = resolveChallengeToday(ctx, userId, gymId, us.days[gymId]);
  if (state.swaps >= MAX_SWAPS) return resolveChallengeToday(ctx, userId, gymId, state).result;
  const next = pickChallengeCandidates(ctx).find(c => !state.shownIds.includes(c.boulder.id));
  if (!next) return resolveChallengeToday(ctx, userId, gymId, state).result;
  const swapped: DayState = {
    ...state,
    boulderId: next.boulder.id,
    swaps: state.swaps + 1,
    shownIds: [...state.shownIds, next.boulder.id],
  };
  us.days[gymId] = swapped;
  writeStore(store);
  notify();
  return resolveChallengeToday(ctx, userId, gymId, swapped).result;
}

/** Ist dieser Boulder heute deine Challenge (egal in welcher Halle)? Liest nur den Speicher. */
export function isTodaysChallenge(userId: string, boulderId: string, now: Date = new Date()): boolean {
  if (!userId || userId === 'guest') return false;
  const us = readStore()[userId];
  if (!us) return false;
  const day = dayKey(now);
  return Object.values(us.days).some(d => d.day === day && d.boulderId === boulderId);
}

// ---------------------------------------------------------------------------
// Streifen an der Wand (F5)
// ---------------------------------------------------------------------------

/** Reine Regel: entscheidet einmal pro Besuchstag, ob der Streifen heute kommen darf. */
export function decideBanner(b: BannerState, day: string, rand: () => number, enabled = true): { show: boolean; state: BannerState } {
  if (!enabled) return { show: false, state: b };
  if (b.pausedUntil && day < b.pausedUntil) return { show: false, state: b };
  if (b.closedDay === day) return { show: false, state: b };
  if (b.decidedDay === day) return { show: Boolean(b.show), state: b };
  const show = b.visitsWithout >= BANNER_GUARANTEE_AFTER || rand() < BANNER_CHANCE;
  return { show, state: { ...b, decidedDay: day, show, visitsWithout: show ? b.visitsWithout : b.visitsWithout + 1 } };
}

/** Reine Regel: Streifen geschlossen («Zeigen» = opened, «X» = nicht). */
export function closeBanner(b: BannerState, day: string, opened: boolean): BannerState {
  if (opened) return { ...b, closedDay: day, dismissStreak: 0 };
  const streak = b.dismissStreak + 1;
  if (streak >= 2) return { ...b, closedDay: day, dismissStreak: 0, pausedUntil: addDays(day, BANNER_PAUSE_DAYS) };
  return { ...b, closedDay: day, dismissStreak: streak };
}

export function shouldShowBannerToday(userId: string, now: Date = new Date(), rand: () => number = Math.random): boolean {
  if (!userId || userId === 'guest') return false;
  const store = readStore();
  const us = userState(store, userId);
  const { show, state } = decideBanner(us.banner, dayKey(now), rand, isBannerEnabled());
  if (state !== us.banner) {
    us.banner = state;
    writeStore(store);
  }
  return show;
}

/** Streifen war wirklich zu sehen: Garantie-Zähler zurücksetzen. */
export function markBannerSeen(userId: string): void {
  const store = readStore();
  const us = userState(store, userId);
  if (us.banner.visitsWithout === 0) return;
  us.banner = { ...us.banner, visitsWithout: 0 };
  writeStore(store);
}

export function closeBannerToday(userId: string, opened: boolean, now: Date = new Date()): void {
  const store = readStore();
  const us = userState(store, userId);
  us.banner = closeBanner(us.banner, dayKey(now), opened);
  writeStore(store);
}

export function readBannerState(userId: string): BannerState {
  return userState(readStore(), userId).banner;
}
