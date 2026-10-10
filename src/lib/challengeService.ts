import { supabase } from './supabase';
import * as gymStorage from './gymStorage';
import { getSectors, getWallBoulders } from './batchBoulderService';
import { getAscents } from './ratingAndAscentService';
import { stringToUuid } from './storageUtils';
import { useRemote, toRemoteGymId, fromRemoteGymId } from './treffService';
import { WallBoulder } from '../types/boulder';

/**
 * SPEC-038 · Hallen-Challenge.
 * Admins der Halle legen im Admin-Tab «Halle» eine Challenge an (höchstens 31 Tage).
 * Kletterer machen in «Ich» freiwillig mit; die Rangliste sehen nur Teilnehmer.
 * Echte Konten speichern in Supabase, Test-Personen und Tests lokal (wie Treff).
 */
export const CHALLENGE_STORE_KEY = 'boulderapp_challenges_v1';
export const CHALLENGE_CHANGED_EVENT = 'bouldermate:challenges_updated';
export const CHALLENGE_NAME_MAX = 40;
export const CHALLENGE_MAX_DAYS = 31;

export type ChallengeRule = 'new' | 'sector';

export interface Challenge {
  id: string;
  gymId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  rule: ChallengeRule;
  sectorId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  nickname: string;
  joinedAt: string;
}

export interface ChallengeInput {
  gymId: string;
  name: string;
  /** YYYY-MM-DD, lokal; gilt ab 00:00 */
  startDay: string;
  /** YYYY-MM-DD, lokal; gilt bis 23:59 */
  endDay: string;
  rule: ChallengeRule;
  sectorId?: string;
}

export type ChallengeError = 'not_admin' | 'name_missing' | 'name_too_long' | 'date_order' | 'too_long' | 'sector_missing' | 'failed';

export const CHALLENGE_ERROR_TEXT: Record<ChallengeError, string> = {
  not_admin: 'Nur Admins der Halle können Challenges anlegen.',
  name_missing: 'Bitte einen Namen eingeben.',
  name_too_long: `Der Name darf höchstens ${CHALLENGE_NAME_MAX} Zeichen haben.`,
  date_order: 'Das Ende muss nach dem Start liegen.',
  too_long: `Eine Challenge dauert höchstens ${CHALLENGE_MAX_DAYS} Tage.`,
  sector_missing: 'Bitte einen Sektor wählen.',
  failed: 'Das hat nicht geklappt. Bitte nochmal versuchen.',
};

interface LocalStore {
  challenges: Challenge[];
  participants: ChallengeParticipant[];
}

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(CHALLENGE_STORE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    return { challenges: s.challenges || [], participants: s.participants || [] };
  } catch {
    return { challenges: [], participants: [] };
  }
}

function writeLocal(s: LocalStore): void {
  try {
    localStorage.setItem(CHALLENGE_STORE_KEY, JSON.stringify(s));
  } catch {
    // Speicher gesperrt
  }
}

function notify(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHALLENGE_CHANGED_EVENT));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function dayStart(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

// ---------------------------------------------------------------------------
// Reine Hilfsfunktionen
// ---------------------------------------------------------------------------

export function canManageChallenges(gymId: string, userId: string): boolean {
  if (!userId || userId === 'guest') return false;
  try {
    return gymStorage.isGymAdmin(gymId, userId);
  } catch {
    return false;
  }
}

export function validateChallenge(input: ChallengeInput): ChallengeError | null {
  const name = input.name.trim();
  if (!name) return 'name_missing';
  if (name.length > CHALLENGE_NAME_MAX) return 'name_too_long';
  const start = dayStart(input.startDay);
  const end = dayEnd(input.endDay);
  if (!(end.getTime() > start.getTime())) return 'date_order';
  const days = Math.round((dayStart(input.endDay).getTime() - start.getTime()) / 86400000) + 1;
  if (days > CHALLENGE_MAX_DAYS) return 'too_long';
  if (input.rule === 'sector' && !input.sectorId) return 'sector_missing';
  return null;
}

export function isRunning(c: Pick<Challenge, 'startsAt' | 'endsAt'>, now: Date = new Date()): boolean {
  return new Date(c.startsAt).getTime() <= now.getTime() && now.getTime() <= new Date(c.endsAt).getTime();
}

/** «noch 12 Tage», «noch 1 Tag», «letzter Tag». */
export function daysLeftText(c: Pick<Challenge, 'endsAt'>, now: Date = new Date()): string {
  const end = new Date(c.endsAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.round((endDay.getTime() - today.getTime()) / 86400000);
  if (diff <= 0) return 'letzter Tag';
  return diff === 1 ? 'noch 1 Tag' : `noch ${diff} Tage`;
}

function sameRef(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a === b || stringToUuid(a) === b || a === stringToUuid(b);
}

/** Boulder, die zur Regel gehören (F2). */
export function challengeBoulders(c: Challenge, boulders: WallBoulder[] = getWallBoulders()): WallBoulder[] {
  const start = new Date(c.startsAt).getTime();
  const end = new Date(c.endsAt).getTime();
  const sectorIds = getSectors(c.gymId).map(s => s.id);
  const inGym = (b: WallBoulder) => sectorIds.some(id => sameRef(id, b.sectorId));
  const hungDuring = (b: WallBoulder) => {
    if (b.status === 'draft') return false;
    const pub = new Date(b.publishedAt || b.createdAt).getTime();
    const gone = b.archivedAt ? new Date(b.archivedAt).getTime() : Infinity;
    return pub <= end && gone >= start;
  };
  if (c.rule === 'new') {
    return boulders.filter(b => {
      if (!inGym(b) || b.status === 'draft') return false;
      const pub = new Date(b.publishedAt || b.createdAt).getTime();
      return pub >= start && pub <= end;
    });
  }
  return boulders.filter(b => sameRef(c.sectorId, b.sectorId) && hungDuring(b));
}

export interface ChallengeStanding {
  userId: string;
  nickname: string;
  done: number;
  /** Zeitpunkt, an dem die aktuelle Zahl erreicht wurde (für Gleichstand) */
  reachedAt?: string;
  rank: number;
}

/** Tops/Flashes je Person im Zeitraum an Bouldern der Regel (AC-2). */
export function countDone(c: Challenge, userId: string, boulderIds: Set<string>): { done: number; reachedAt?: string } {
  const start = new Date(c.startsAt).getTime();
  const end = new Date(c.endsAt).getTime();
  let done = 0;
  let reachedAt: string | undefined;
  for (const a of getAscents()) {
    if (!sameRef(a.userId, userId) && a.userId !== userId) continue;
    if (!boulderIds.has(a.boulderId)) continue;
    if (a.type !== 'top' && a.type !== 'flash') continue;
    const t = new Date(a.createdAt).getTime();
    if (t < start || t > end) continue;
    done++;
    if (!reachedAt || a.createdAt > reachedAt) reachedAt = a.createdAt;
  }
  return { done, reachedAt };
}

/** Rangliste nur aus Teilnehmern; mehr geschafft zuerst, bei Gleichstand wer früher dort war (AC-4). */
export function buildLeaderboard(c: Challenge, participants: ChallengeParticipant[]): ChallengeStanding[] {
  const ids = new Set(challengeBoulders(c).map(b => b.id));
  const rows = participants
    .filter(p => p.challengeId === c.id)
    .map(p => ({ userId: p.userId, nickname: p.nickname, ...countDone(c, p.userId, ids) }));
  rows.sort((a, b) => b.done - a.done || (a.reachedAt || '9').localeCompare(b.reachedAt || '9') || a.nickname.localeCompare(b.nickname));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Lesen und Schreiben
// ---------------------------------------------------------------------------

function rowToChallenge(r: any): Challenge {
  return {
    id: r.id,
    gymId: fromRemoteGymId(r.gym_id),
    name: r.name,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    rule: r.rule === 'sector' ? 'sector' : 'new',
    sectorId: r.sector_id || undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export async function loadChallenges(viewerId: string, gymId?: string): Promise<{ challenges: Challenge[]; participants: ChallengeParticipant[] }> {
  if (!useRemote(viewerId)) {
    const s = readLocal();
    return { challenges: s.challenges.filter(c => !gymId || c.gymId === gymId), participants: s.participants };
  }
  try {
    let q = supabase!.from('challenges').select('*').order('starts_at', { ascending: false });
    if (gymId) q = q.eq('gym_id', toRemoteGymId(gymId));
    const { data, error } = await q;
    if (error) throw error;
    const challenges = (data || []).map(rowToChallenge);
    const ids = challenges.map(c => c.id);
    let participants: ChallengeParticipant[] = [];
    if (ids.length) {
      const { data: p } = await supabase!.from('challenge_participants').select('*').in('challenge_id', ids);
      participants = (p || []).map((r: any) => ({ challengeId: r.challenge_id, userId: r.user_id, nickname: r.nickname, joinedAt: r.joined_at }));
    }
    return { challenges, participants };
  } catch (e) {
    console.warn('[Challenge] Laden fehlgeschlagen:', e);
    return { challenges: [], participants: [] };
  }
}

export async function createChallenge(userId: string, input: ChallengeInput): Promise<{ ok: true; value: Challenge } | { ok: false; error: ChallengeError }> {
  if (!canManageChallenges(input.gymId, userId)) return { ok: false, error: 'not_admin' };
  const invalid = validateChallenge(input);
  if (invalid) return { ok: false, error: invalid };
  const c: Challenge = {
    id: newId(),
    gymId: input.gymId,
    name: input.name.trim(),
    startsAt: dayStart(input.startDay).toISOString(),
    endsAt: dayEnd(input.endDay).toISOString(),
    rule: input.rule,
    sectorId: input.rule === 'sector' ? input.sectorId : undefined,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
  if (!useRemote(userId)) {
    const s = readLocal();
    s.challenges.push(c);
    writeLocal(s);
    notify();
    return { ok: true, value: c };
  }
  const { error } = await supabase!.from('challenges').insert({
    id: c.id,
    gym_id: toRemoteGymId(c.gymId),
    name: c.name,
    starts_at: c.startsAt,
    ends_at: c.endsAt,
    rule: c.rule,
    sector_id: c.sectorId || null,
    created_by: userId,
  });
  if (error) {
    console.warn('[Challenge] Anlegen fehlgeschlagen:', error.message);
    return { ok: false, error: 'failed' };
  }
  notify();
  return { ok: true, value: c };
}

export async function deleteChallenge(userId: string, challenge: Challenge): Promise<boolean> {
  if (!canManageChallenges(challenge.gymId, userId)) return false;
  if (!useRemote(userId)) {
    const s = readLocal();
    s.challenges = s.challenges.filter(c => c.id !== challenge.id);
    s.participants = s.participants.filter(p => p.challengeId !== challenge.id);
    writeLocal(s);
    notify();
    return true;
  }
  const { error } = await supabase!.from('challenges').delete().eq('id', challenge.id);
  notify();
  return !error;
}

export async function joinChallenge(user: { id: string; nickname: string }, challengeId: string): Promise<boolean> {
  if (!user.id || user.id === 'guest') return false;
  const p: ChallengeParticipant = { challengeId, userId: user.id, nickname: user.nickname, joinedAt: new Date().toISOString() };
  if (!useRemote(user.id)) {
    const s = readLocal();
    if (!s.participants.some(x => x.challengeId === challengeId && x.userId === user.id)) s.participants.push(p);
    writeLocal(s);
    notify();
    return true;
  }
  const { error } = await supabase!
    .from('challenge_participants')
    .upsert({ challenge_id: challengeId, user_id: user.id, nickname: user.nickname }, { onConflict: 'challenge_id,user_id' });
  notify();
  return !error;
}

/** AC-5: «Aussteigen» jederzeit. */
export async function leaveChallenge(userId: string, challengeId: string): Promise<boolean> {
  if (!useRemote(userId)) {
    const s = readLocal();
    s.participants = s.participants.filter(x => !(x.challengeId === challengeId && x.userId === userId));
    writeLocal(s);
    notify();
    return true;
  }
  const { error } = await supabase!.from('challenge_participants').delete().eq('challenge_id', challengeId).eq('user_id', userId);
  notify();
  return !error;
}
