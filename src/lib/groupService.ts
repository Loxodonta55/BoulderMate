import { supabase } from './supabase';
import { useRemote } from './treffService';
import { getProfileData } from './profileService';
import { weeklyTops, WeekBar } from './meStats';
import { LogbookEntry } from '../types/boulder';
import { FONT_GRADE_LADDER, normalizeFontGrade } from './gradeConverter';
import { t } from './i18n';

/**
 * SPEC-042 · Trainings-Gruppe.
 * Ein Trainer gründet eine Gruppe und gibt den 6-stelligen Code weiter.
 * Mitglieder stimmen beim Beitritt zu, dass der Trainer ihre Tops, Flashes und
 * Projekte der letzten 8 Wochen sieht. Versuche und Bewertungen sieht er nie.
 */
export const GROUP_STORE_KEY = 'boulderapp_groups_v1';
export const GROUP_CHANGED_EVENT = 'bouldermate:groups_updated';
export const GROUP_NAME_MAX = 40;
export const GROUP_MAX_OWNED = 3;
export const GROUP_MAX_MEMBERS = 40;
/** Ohne 0/O und 1/I (AC-1) */
export const GROUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface TrainingGroup {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerNickname: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  nickname: string;
  joinedAt: string;
}

export type GroupError = 'name_missing' | 'name_too_long' | 'too_many_groups' | 'code_invalid' | 'not_found' | 'full' | 'own_group' | 'guest' | 'failed';

export const GROUP_ERROR_TEXT: Record<GroupError, string> = {
  name_missing: 'Bitte einen Namen eingeben.',
  name_too_long: `Der Name darf höchstens ${GROUP_NAME_MAX} Zeichen haben.`,
  too_many_groups: `Du hast schon ${GROUP_MAX_OWNED} Gruppen. Löse zuerst eine auf.`,
  code_invalid: 'Der Code hat 6 Zeichen, nur Buchstaben und Ziffern.',
  not_found: 'Diesen Code gibt es nicht. Bitte nochmal prüfen.',
  full: `Die Gruppe ist voll (${GROUP_MAX_MEMBERS} Mitglieder).`,
  own_group: 'Das ist deine eigene Gruppe.',
  guest: 'Bitte zuerst anmelden.',
  failed: 'Das hat nicht geklappt. Bitte nochmal versuchen.',
};

interface LocalStore {
  groups: TrainingGroup[];
  members: GroupMember[];
}

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(GROUP_STORE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    return { groups: s.groups || [], members: s.members || [] };
  } catch {
    return { groups: [], members: [] };
  }
}

function writeLocal(s: LocalStore): void {
  try {
    localStorage.setItem(GROUP_STORE_KEY, JSON.stringify(s));
  } catch {
    // Speicher gesperrt
  }
}

function notify(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(GROUP_CHANGED_EVENT));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------------------
// Reine Hilfsfunktionen
// ---------------------------------------------------------------------------

export function generateGroupCode(random: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += GROUP_CODE_ALPHABET[Math.floor(random() * GROUP_CODE_ALPHABET.length)];
  return out;
}

/** Eingabe säubern: Grossbuchstaben, ohne Leerzeichen/Bindestriche; 0→O und 1→I gibt es nicht. */
export function normalizeGroupCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '');
}

export function isValidGroupCode(code: string): boolean {
  return new RegExp(`^[${GROUP_CODE_ALPHABET}]{6}$`).test(code);
}

/** Beitritts-Satz (F2/F4). */
export function consentSentence(ownerNickname: string): string {
  return t('{name} sieht deine Tops, Flashes und Projekte der letzten 8 Wochen. Du kannst jederzeit austreten. Unter 16? Frag zuerst deine Eltern.', { name: ownerNickname });
}

function gradeRank(g: string): number {
  const i = (FONT_GRADE_LADDER as readonly string[]).indexOf(normalizeFontGrade(g));
  return i >= 0 ? i : -1;
}

export interface MemberSummary {
  userId: string;
  nickname: string;
  topsLast4Weeks: number;
  bestGrade: string | null;
  lastVisit: string | null;
  lastVisitText: string;
}

/** «heute», «gestern», «vor 3 Tagen», «noch nie». */
export function lastVisitText(iso: string | null, now: Date = new Date()): string {
  if (!iso) return t('noch nie');
  const d = new Date(iso);
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((a - b) / 86400000);
  if (days <= 0) return t('heute');
  if (days === 1) return t('gestern');
  return t('vor {n} Tagen', { n: days });
}

/** Nur was der Trainer sehen darf: letzte 8 Wochen, keine Versuche (F3). */
export function visibleLogbook(userId: string, now: Date = new Date()): LogbookEntry[] {
  const since = now.getTime() - 56 * 86400000;
  return getProfileData(userId, 'all').logbook.filter(e => new Date(e.createdAt).getTime() >= since);
}

export function summarizeMember(m: Pick<GroupMember, 'userId' | 'nickname'>, now: Date = new Date()): MemberSummary {
  const log = visibleLogbook(m.userId, now);
  const since4 = now.getTime() - 28 * 86400000;
  const sends = log.filter(e => e.type === 'top' || e.type === 'flash');
  const tops = sends.filter(e => new Date(e.createdAt).getTime() >= since4).length;
  const best = sends.reduce<string | null>((acc, e) => {
    const g = e.fontGrade || null;
    if (!g) return acc;
    return !acc || gradeRank(g) > gradeRank(acc) ? g : acc;
  }, null);
  const last = log.reduce<string | null>((acc, e) => (!acc || e.createdAt > acc ? e.createdAt : acc), null);
  return { userId: m.userId, nickname: m.nickname, topsLast4Weeks: tops, bestGrade: best, lastVisit: last, lastVisitText: lastVisitText(last, now) };
}

export interface MemberDetail {
  pyramid: { grade: string; tops: number; flashes: number }[];
  weeks: WeekBar[];
}

/** Detail für den Trainer: Pyramide und Verlauf 8 Wochen (aus den letzten 8 Wochen). */
export function memberDetail(userId: string, now: Date = new Date()): MemberDetail {
  const log = visibleLogbook(userId, now).filter(e => e.type === 'top' || e.type === 'flash');
  const map = new Map<string, { tops: number; flashes: number }>();
  for (const e of log) {
    const g = e.fontGrade || e.gradeScale?.colorName || '?';
    const cur = map.get(g) || { tops: 0, flashes: 0 };
    cur.tops++;
    if (e.type === 'flash') cur.flashes++;
    map.set(g, cur);
  }
  const pyramid = [...map.entries()]
    .map(([grade, v]) => ({ grade, ...v }))
    .sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));
  return { pyramid, weeks: weeklyTops(log, now) };
}


// ---------------------------------------------------------------------------
// Lesen und Schreiben
// ---------------------------------------------------------------------------

export async function loadMyGroups(userId: string): Promise<{ owned: TrainingGroup[]; joined: TrainingGroup[]; members: GroupMember[] }> {
  if (!useRemote(userId)) {
    const s = readLocal();
    const owned = s.groups.filter(g => g.ownerId === userId);
    const joinedIds = new Set(s.members.filter(m => m.userId === userId).map(m => m.groupId));
    const joined = s.groups.filter(g => joinedIds.has(g.id) && g.ownerId !== userId);
    const ids = new Set([...owned, ...joined].map(g => g.id));
    return { owned, joined, members: s.members.filter(m => ids.has(m.groupId)) };
  }
  try {
    const { data: groups, error } = await supabase!.from('training_groups').select('*');
    if (error) throw error;
    const all: TrainingGroup[] = (groups || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code || '',
      ownerId: r.owner_id,
      ownerNickname: r.owner_nickname || 'Trainer',
      createdAt: r.created_at,
    }));
    const ids = all.map(g => g.id);
    let members: GroupMember[] = [];
    if (ids.length) {
      const { data } = await supabase!.from('training_group_members').select('*').in('group_id', ids);
      members = (data || []).map((r: any) => ({ groupId: r.group_id, userId: r.user_id, nickname: r.nickname, joinedAt: r.joined_at }));
    }
    return { owned: all.filter(g => g.ownerId === userId), joined: all.filter(g => g.ownerId !== userId), members };
  } catch (e) {
    console.warn('[Gruppen] Laden fehlgeschlagen:', e);
    return { owned: [], joined: [], members: [] };
  }
}

export async function createGroup(user: { id: string; nickname: string }, name: string): Promise<{ ok: true; value: TrainingGroup } | { ok: false; error: GroupError }> {
  if (!user.id || user.id === 'guest') return { ok: false, error: 'guest' };
  const clean = name.trim();
  if (!clean) return { ok: false, error: 'name_missing' };
  if (clean.length > GROUP_NAME_MAX) return { ok: false, error: 'name_too_long' };
  const { owned } = await loadMyGroups(user.id);
  if (owned.length >= GROUP_MAX_OWNED) return { ok: false, error: 'too_many_groups' };
  const group: TrainingGroup = {
    id: newId(),
    name: clean,
    code: generateGroupCode(),
    ownerId: user.id,
    ownerNickname: user.nickname,
    createdAt: new Date().toISOString(),
  };
  if (!useRemote(user.id)) {
    const s = readLocal();
    while (s.groups.some(g => g.code === group.code)) group.code = generateGroupCode();
    s.groups.push(group);
    writeLocal(s);
    notify();
    return { ok: true, value: group };
  }
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase!.from('training_groups').insert({
      id: group.id,
      name: group.name,
      code: group.code,
      owner_id: user.id,
      owner_nickname: user.nickname,
    });
    if (!error) {
      notify();
      return { ok: true, value: group };
    }
    if (!/duplicate|unique/i.test(error.message)) {
      console.warn('[Gruppen] Gründen fehlgeschlagen:', error.message);
      return { ok: false, error: /limit/i.test(error.message) ? 'too_many_groups' : 'failed' };
    }
    group.code = generateGroupCode();
  }
  return { ok: false, error: 'failed' };
}

/** Code prüfen, bevor der Zustimmungs-Satz kommt. Lokal direkt, in Supabase über eine Funktion. */
export async function previewGroup(userId: string, rawCode: string): Promise<{ ok: true; value: { id: string; name: string; ownerNickname: string; ownerId: string } } | { ok: false; error: GroupError }> {
  const code = normalizeGroupCode(rawCode);
  if (!isValidGroupCode(code)) return { ok: false, error: 'code_invalid' };
  if (!useRemote(userId)) {
    const g = readLocal().groups.find(x => x.code === code);
    if (!g) return { ok: false, error: 'not_found' };
    if (g.ownerId === userId) return { ok: false, error: 'own_group' };
    return { ok: true, value: { id: g.id, name: g.name, ownerNickname: g.ownerNickname, ownerId: g.ownerId } };
  }
  const { data, error } = await supabase!.rpc('preview_training_group', { group_code: code });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { ok: false, error: 'not_found' };
  if (row.owner_id === userId) return { ok: false, error: 'own_group' };
  return { ok: true, value: { id: row.id, name: row.name, ownerNickname: row.owner_nickname, ownerId: row.owner_id } };
}

/** Beitreten nach Zustimmung (AC-2); doppelter Beitritt ändert nichts. */
export async function joinGroup(user: { id: string; nickname: string }, rawCode: string): Promise<{ ok: true } | { ok: false; error: GroupError }> {
  if (!user.id || user.id === 'guest') return { ok: false, error: 'guest' };
  const preview = await previewGroup(user.id, rawCode);
  if (!preview.ok) return preview;
  const code = normalizeGroupCode(rawCode);
  if (!useRemote(user.id)) {
    const s = readLocal();
    const groupId = preview.value.id;
    if (s.members.some(m => m.groupId === groupId && m.userId === user.id)) return { ok: true };
    if (s.members.filter(m => m.groupId === groupId).length >= GROUP_MAX_MEMBERS) return { ok: false, error: 'full' };
    s.members.push({ groupId, userId: user.id, nickname: user.nickname, joinedAt: new Date().toISOString() });
    writeLocal(s);
    notify();
    return { ok: true };
  }
  const { error } = await supabase!.rpc('join_training_group', { group_code: code, member_nickname: user.nickname });
  if (error) return { ok: false, error: /voll|full/i.test(error.message) ? 'full' : 'failed' };
  notify();
  return { ok: true };
}

/** Austreten (Mitglied) oder Entfernen (Trainer) – wirkt sofort (AC-5). */
export async function removeMember(actorId: string, groupId: string, memberId: string): Promise<boolean> {
  if (!useRemote(actorId)) {
    const s = readLocal();
    const g = s.groups.find(x => x.id === groupId);
    if (!g || (actorId !== memberId && g.ownerId !== actorId)) return false;
    s.members = s.members.filter(m => !(m.groupId === groupId && m.userId === memberId));
    writeLocal(s);
    notify();
    return true;
  }
  const { error } = await supabase!.from('training_group_members').delete().eq('group_id', groupId).eq('user_id', memberId);
  notify();
  return !error;
}

export async function dissolveGroup(ownerId: string, groupId: string): Promise<boolean> {
  if (!useRemote(ownerId)) {
    const s = readLocal();
    const g = s.groups.find(x => x.id === groupId);
    if (!g || g.ownerId !== ownerId) return false;
    s.groups = s.groups.filter(x => x.id !== groupId);
    s.members = s.members.filter(m => m.groupId !== groupId);
    writeLocal(s);
    notify();
    return true;
  }
  const { error } = await supabase!.from('training_groups').delete().eq('id', groupId);
  notify();
  return !error;
}
