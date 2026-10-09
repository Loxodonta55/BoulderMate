import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentAuthUser, isDemoSession, isPlatformAdmin, isTestEnv } from './authService';
import { isValidUuid } from './storageUtils';
import * as gymStorage from './gymStorage';
import { FONT_GRADE_LADDER } from './gradeConverter';

/**
 * SPEC-028 · Treff – «Wer ist da?»
 * Kletterer tragen ein, wann sie in der Halle sind und Lust auf Austausch haben.
 * Keine Nachrichten, keine Anfragen: man spricht sich in der Halle an.
 *
 * Echte Konten (Google/E-Mail) speichern in Supabase (RLS, Migration 20261009_spec028_treff.sql).
 * Test-Personen, Tests und Dev-Gäste speichern lokal im Browser (F17).
 */

export const TREFF_MAX_OPEN_ENTRIES = 3;
export const TREFF_MAX_DAYS_AHEAD = 14;
export const TREFF_NOTE_MAX = 120;
export const TREFF_NOW_DURATION_MIN = 120;
export const TREFF_KEEP_AFTER_END_MS = 24 * 60 * 60 * 1000;
export const TREFF_STORE_KEY = 'boulderapp_treff_v1';
export const TREFF_SETTINGS_KEY = 'boulderapp_treff_settings_v1';
export const TREFF_CHANGED_EVENT = 'bouldermate:treff_updated';

export interface TreffEntry {
  id: string;
  userId: string;
  gymId: string;
  startsAt: string;
  endsAt: string;
  gradeMin?: string;
  gradeMax?: string;
  boulderRef?: string;
  note?: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

/** Gast-Ansicht: ohne Personen-Daten (F10). */
export type PublicTreffEntry = Pick<TreffEntry, 'id' | 'gymId' | 'startsAt' | 'endsAt' | 'gradeMin' | 'gradeMax'>;

export interface TreffBlock {
  blockerId: string;
  blockedId: string;
  blockedNickname?: string;
}

export type TreffReportReason = 'belaestigung' | 'spam' | 'unangemessen' | 'anderes';

export const TREFF_REPORT_REASONS: { value: TreffReportReason; label: string }[] = [
  { value: 'belaestigung', label: 'Belästigung' },
  { value: 'spam', label: 'Spam' },
  { value: 'unangemessen', label: 'Unangemessen' },
  { value: 'anderes', label: 'Anderes' },
];

export interface TreffReport {
  id: string;
  reporterId: string;
  entryId: string;
  reportedUserId: string;
  reason: TreffReportReason;
  snapshot: string;
  createdAt: string;
  handledAt?: string;
}

export interface TreffSettings {
  userId: string;
  consentAt?: string;
  ageConfirmed: boolean;
  showGrade: boolean;
  hidden: boolean;
  banned: boolean;
}

export interface TreffEntryInput {
  gymId: string;
  day: string; // YYYY-MM-DD (lokale Zeit)
  from: string; // HH:MM
  to: string; // HH:MM
  gradeMin?: string;
  gradeMax?: string;
  boulderRef?: string;
  note?: string;
}

export interface TreffUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export type TreffError =
  | 'gym_missing'
  | 'day_missing'
  | 'time_order'
  | 'in_past'
  | 'too_far'
  | 'note_too_long'
  | 'grade_order'
  | 'limit'
  | 'no_consent'
  | 'banned'
  | 'gym_disabled'
  | 'already'
  | 'guest'
  | 'offline'
  | 'failed';

export const TREFF_ERROR_TEXT: Record<TreffError, string> = {
  gym_missing: 'Bitte eine Halle wählen.',
  day_missing: 'Bitte einen Tag wählen.',
  time_order: '«Bis» muss nach «Von» liegen.',
  in_past: 'Diese Zeit ist schon vorbei.',
  too_far: `Höchstens ${TREFF_MAX_DAYS_AHEAD} Tage im Voraus.`,
  note_too_long: `Der Satz darf höchstens ${TREFF_NOTE_MAX} Zeichen haben.`,
  grade_order: 'Das Niveau «von» muss leichter sein als «bis».',
  limit: `Du hast schon ${TREFF_MAX_OPEN_ENTRIES} Einträge. Lösche zuerst einen.`,
  no_consent: 'Bitte zuerst den Hinweis bestätigen.',
  banned: 'Du kannst dich bei Treff nicht mehr eintragen.',
  gym_disabled: 'Diese Halle nutzt Treff nicht.',
  already: 'Du bist zu dieser Zeit schon eingetragen.',
  guest: 'Bitte zuerst anmelden.',
  offline: 'Keine Verbindung. Bitte später nochmal versuchen.',
  failed: 'Das hat nicht geklappt. Bitte nochmal versuchen.',
};

export type TreffResult<T> = { ok: true; value: T } | { ok: false; error: TreffError };

// ---------------------------------------------------------------------------
// Reine Hilfsfunktionen
// ---------------------------------------------------------------------------

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lokaler Zeitpunkt aus Tag + Uhrzeit. */
export function combineDayTime(day: string, time: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Tage für die Auswahl: heute + 14 Tage. */
export function treffDayOptions(now: Date = new Date()): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = 0; i <= TREFF_MAX_DAYS_AHEAD; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({ key: toDayKey(d), label: formatTreffDay(d.toISOString(), now) });
  }
  return out;
}

/** Halbstündliche Zeiten 06:00–23:30. */
export const TREFF_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${pad(h)}:00`, `${pad(h)}:30`);
  }
  return out;
})();

/** Nächste volle oder halbe Stunde nach `now` (für Vorbelegung). */
export function nextHalfHour(now: Date = new Date()): string {
  const d = new Date(now);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  if (m === 0 || m === 30) return `${pad(d.getHours())}:${pad(m)}`;
  if (m < 30) d.setMinutes(30);
  else d.setHours(d.getHours() + 1, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** «Heute», «Morgen» oder «Do 16.». */
export function formatTreffDay(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((that.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.`;
}

function hourLabel(d: Date): string {
  return d.getMinutes() === 0 ? String(d.getHours()) : `${d.getHours()}:${pad(d.getMinutes())}`;
}

/** «18–21 Uhr», «18:30–21 Uhr». */
export function formatTreffTime(entry: Pick<TreffEntry, 'startsAt' | 'endsAt'>): string {
  return `${hourLabel(new Date(entry.startsAt))}–${hourLabel(new Date(entry.endsAt))} Uhr`;
}

/** Fontainebleau-Grade für die Niveau-Auswahl (ohne «3» und «9a»). */
export const TREFF_GRADE_OPTIONS: string[] = FONT_GRADE_LADDER.filter(g => g !== '3' && g !== '9a');

export function displayGrade(g: string): string {
  return g.toUpperCase();
}

export function formatGradeRange(min?: string, max?: string): string | null {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${displayGrade(min)}–${displayGrade(max)}`;
  return displayGrade((min || max)!);
}

export type TreffPhase = 'now' | 'later' | 'over';

export function treffPhase(entry: Pick<TreffEntry, 'startsAt' | 'endsAt'>, now: Date = new Date()): TreffPhase {
  const t = now.getTime();
  if (new Date(entry.endsAt).getTime() <= t) return 'over';
  if (new Date(entry.startsAt).getTime() <= t) return 'now';
  return 'later';
}

export function sortTreffEntries<T extends Pick<TreffEntry, 'startsAt' | 'endsAt'>>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.endsAt.localeCompare(b.endsAt));
}

/** Teilt aktive Einträge in «Jetzt da» und «Kommt noch» (abgelaufene fallen weg). */
export function splitTreffEntries<T extends Pick<TreffEntry, 'startsAt' | 'endsAt'>>(
  entries: T[],
  now: Date = new Date()
): { now: T[]; later: T[] } {
  const sorted = sortTreffEntries(entries);
  return {
    now: sorted.filter(e => treffPhase(e, now) === 'now'),
    later: sorted.filter(e => treffPhase(e, now) === 'later'),
  };
}

export function filterByGym<T extends Pick<TreffEntry, 'gymId'>>(entries: T[], scope: 'gym' | 'all', gymId: string): T[] {
  return scope === 'all' ? entries : entries.filter(e => e.gymId === gymId);
}

/** Einträge ausblenden, wenn ich die Person ausgeblendet habe oder sie mich (F14). */
export function filterBlocked(entries: TreffEntry[], viewerId: string, blocks: TreffBlock[]): TreffEntry[] {
  const hidden = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === viewerId) hidden.add(b.blockedId);
    if (b.blockedId === viewerId) hidden.add(b.blockerId);
  }
  return entries.filter(e => !hidden.has(e.userId));
}

export function toPublicEntry(e: TreffEntry): PublicTreffEntry {
  return { id: e.id, gymId: e.gymId, startsAt: e.startsAt, endsAt: e.endsAt, gradeMin: e.gradeMin, gradeMax: e.gradeMax };
}

function overlaps(a: Pick<TreffEntry, 'startsAt' | 'endsAt'>, b: Pick<TreffEntry, 'startsAt' | 'endsAt'>): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/** «Auch da»: andere Personen in derselben Halle mit überlappender Zeit. */
export function treffCompanions(entry: TreffEntry, all: TreffEntry[]): TreffEntry[] {
  const seen = new Set<string>([entry.userId]);
  const out: TreffEntry[] = [];
  for (const e of sortTreffEntries(all)) {
    if (e.gymId !== entry.gymId || seen.has(e.userId) || !overlaps(e, entry)) continue;
    seen.add(e.userId);
    out.push(e);
  }
  return out;
}

export function countOpenEntries(entries: TreffEntry[], userId: string, now: Date = new Date()): number {
  return entries.filter(e => e.userId === userId && treffPhase(e, now) !== 'over').length;
}

export function validateTreffInput(input: TreffEntryInput, now: Date = new Date()): TreffError | null {
  if (!input.gymId) return 'gym_missing';
  if (!input.day) return 'day_missing';
  const start = combineDayTime(input.day, input.from);
  const end = combineDayTime(input.day, input.to);
  if (!(end.getTime() > start.getTime())) return 'time_order';
  if (end.getTime() <= now.getTime()) return 'in_past';
  const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + TREFF_MAX_DAYS_AHEAD + 1);
  if (start.getTime() >= lastDay.getTime()) return 'too_far';
  if ((input.note || '').trim().length > TREFF_NOTE_MAX) return 'note_too_long';
  if (input.gradeMin && input.gradeMax) {
    const a = TREFF_GRADE_OPTIONS.indexOf(input.gradeMin);
    const b = TREFF_GRADE_OPTIONS.indexOf(input.gradeMax);
    if (a > b) return 'grade_order';
  }
  return null;
}

/** «Ich bin jetzt da»: heute, ab jetzt, 2 Stunden (endet spätestens um Mitternacht). */
export function buildNowInput(gymId: string, now: Date = new Date()): { startsAt: string; endsAt: string } {
  const start = new Date(now);
  start.setSeconds(0, 0);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(Math.min(start.getTime() + TREFF_NOW_DURATION_MIN * 60000, midnight.getTime() - 60000));
  void gymId;
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

/** Text für die Kopie in einer Meldung. */
export function buildReportSnapshot(e: TreffEntry): string {
  const parts = [
    `${e.nickname} · ${formatTreffDay(e.startsAt)} ${formatTreffTime(e)}`,
    formatGradeRange(e.gradeMin, e.gradeMax),
    e.note ? `«${e.note}»` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function isExpiredForCleanup(e: Pick<TreffEntry, 'endsAt'>, now: Date = new Date()): boolean {
  return new Date(e.endsAt).getTime() + TREFF_KEEP_AFTER_END_MS <= now.getTime();
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---------------------------------------------------------------------------
// Halle: Treff erlaubt? (F16)
// ---------------------------------------------------------------------------

export function isTreffEnabledForGym(gymId: string): boolean {
  try {
    const gym = gymStorage.getGyms().find(g => g.id === gymId);
    return gym?.treff_enabled !== false;
  } catch {
    return true;
  }
}

export function setGymTreffEnabled(gymId: string, userId: string, enabled: boolean): boolean {
  if (!gymStorage.isGymAdmin(gymId, userId)) return false;
  const gyms = gymStorage.getGyms();
  const idx = gyms.findIndex(g => g.id === gymId);
  if (idx === -1) return false;
  const next = [...gyms];
  next[idx] = { ...gyms[idx], treff_enabled: enabled };
  gymStorage.saveGyms(next);
  if (supabase && isSupabaseConfigured && !isTestEnv) {
    supabase
      .from('gyms')
      .update({ treff_enabled: enabled })
      .eq('id', toRemoteGymId(gymId))
      .then(
        ({ error }) => {
          if (error) console.warn('[Treff] Hallen-Schalter nicht gespeichert:', error.message);
        },
        () => {}
      );
  }
  return true;
}

// ---------------------------------------------------------------------------
// Hallen-IDs lokal ↔ Supabase (wie syncGymLocationToSupabase)
// ---------------------------------------------------------------------------

const GYM_ID_MAP: Record<string, string> = {
  'gym-6a-plus': 'f2b11564-ca86-4ed4-b51c-3affb346144b',
  'gym-minimum-zh': '814696b2-303e-4897-9bdb-d83505a63489',
};

export function toRemoteGymId(localId: string): string {
  return GYM_ID_MAP[localId] || localId;
}

export function fromRemoteGymId(remoteId: string): string {
  for (const [local, remote] of Object.entries(GYM_ID_MAP)) {
    if (remote === remoteId) return local;
  }
  return remoteId;
}

// ---------------------------------------------------------------------------
// Einstellungen (lokal gespiegelt, damit der Tab sofort richtig erscheint)
// ---------------------------------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher gesperrt: Treff läuft dann nur online
  }
}

function notifyChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TREFF_CHANGED_EVENT));
}

export function defaultTreffSettings(userId: string): TreffSettings {
  return { userId, ageConfirmed: false, showGrade: true, hidden: false, banned: false };
}

export function getTreffSettings(userId: string): TreffSettings {
  const all = readJson<Record<string, TreffSettings>>(TREFF_SETTINGS_KEY, {});
  return { ...defaultTreffSettings(userId), ...(all[userId] || {}), userId };
}

function storeSettingsLocally(s: TreffSettings): void {
  const all = readJson<Record<string, TreffSettings>>(TREFF_SETTINGS_KEY, {});
  all[s.userId] = s;
  writeJson(TREFF_SETTINGS_KEY, all);
}

export function hasTreffConsent(s: TreffSettings): boolean {
  return Boolean(s.consentAt) && s.ageConfirmed;
}

export async function saveTreffSettings(patch: Partial<TreffSettings> & { userId: string }): Promise<TreffSettings> {
  const next: TreffSettings = { ...getTreffSettings(patch.userId), ...patch, banned: getTreffSettings(patch.userId).banned };
  storeSettingsLocally(next);
  notifyChanged();
  if (useRemote(next.userId)) {
    try {
      await supabase!.from('treff_settings').upsert(
        {
          user_id: next.userId,
          consent_at: next.consentAt || null,
          age_confirmed: next.ageConfirmed,
          show_grade: next.showGrade,
          hidden: next.hidden,
        },
        { onConflict: 'user_id' }
      );
    } catch (e) {
      console.warn('[Treff] Einstellungen nicht gespeichert:', e);
    }
  }
  return next;
}

/** Holt Einstellungen (inkl. Sperre) aus Supabase und spiegelt sie lokal. */
export async function refreshTreffSettings(userId: string): Promise<TreffSettings> {
  const local = getTreffSettings(userId);
  if (!useRemote(userId)) return local;
  try {
    const { data } = await supabase!.from('treff_settings').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const merged: TreffSettings = {
        userId,
        consentAt: data.consent_at || undefined,
        ageConfirmed: Boolean(data.age_confirmed),
        showGrade: data.show_grade !== false,
        hidden: Boolean(data.hidden),
        banned: Boolean(data.banned),
      };
      storeSettingsLocally(merged);
      return merged;
    }
  } catch (e) {
    console.warn('[Treff] Einstellungen nicht geladen:', e);
  }
  return local;
}

// ---------------------------------------------------------------------------
// Speicher-Wahl: Supabase für echte Konten, sonst lokal (F17)
// ---------------------------------------------------------------------------

/** true = Supabase. Test-Personen, Tests und Gäste im Dev-Build bleiben lokal. */
export function useRemote(userId?: string | null): boolean {
  if (!supabase || !isSupabaseConfigured || isTestEnv) return false;
  if (!userId) return !((import.meta as any).env?.DEV);
  const auth = getCurrentAuthUser();
  if (!auth || auth.id !== userId) return false;
  return !isDemoSession(auth) && isValidUuid(userId);
}

interface LocalTreffStore {
  entries: TreffEntry[];
  blocks: TreffBlock[];
  reports: TreffReport[];
  banned: string[];
}

function readLocal(): LocalTreffStore {
  const s = readJson<Partial<LocalTreffStore>>(TREFF_STORE_KEY, {});
  return { entries: s.entries || [], blocks: s.blocks || [], reports: s.reports || [], banned: s.banned || [] };
}

function writeLocal(s: LocalTreffStore): void {
  writeJson(TREFF_STORE_KEY, s);
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function rowToEntry(r: any): TreffEntry {
  return {
    id: r.id,
    userId: r.user_id,
    gymId: fromRemoteGymId(r.gym_id),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    gradeMin: r.grade_min || undefined,
    gradeMax: r.grade_max || undefined,
    boulderRef: r.boulder_ref || undefined,
    note: r.note || undefined,
    nickname: r.nickname || 'Kletterer',
    avatarUrl: r.avatar_url || undefined,
    createdAt: r.created_at,
  };
}

function entryToRow(e: TreffEntry): Record<string, unknown> {
  return {
    id: e.id,
    user_id: e.userId,
    gym_id: toRemoteGymId(e.gymId),
    starts_at: e.startsAt,
    ends_at: e.endsAt,
    grade_min: e.gradeMin || null,
    grade_max: e.gradeMax || null,
    boulder_ref: e.boulderRef || null,
    note: e.note || null,
    nickname: e.nickname,
    avatar_url: e.avatarUrl || null,
    created_at: e.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

export interface TreffLoadResult<T> {
  entries: T[];
  offline: boolean;
}

const LAST_REMOTE_KEY = 'boulderapp_treff_last_remote_v1';

/** Aktive Einträge für angemeldete Nutzer (ohne Ausgeblendete). */
export async function loadTreffEntries(viewerId: string, now: Date = new Date()): Promise<TreffLoadResult<TreffEntry>> {
  if (!useRemote(viewerId)) {
    const s = readLocal();
    const active = s.entries.filter(e => treffPhase(e, now) !== 'over');
    return { entries: filterBlocked(active, viewerId, s.blocks), offline: false };
  }
  try {
    void supabase!.rpc('treff_cleanup').then(() => {}, () => {});
    const { data, error } = await supabase!
      .from('treff_entries')
      .select('*')
      .gt('ends_at', now.toISOString())
      .order('starts_at', { ascending: true });
    if (error) throw error;
    const entries = (data || []).map(rowToEntry);
    writeJson(LAST_REMOTE_KEY, entries);
    return { entries, offline: false };
  } catch (e) {
    console.warn('[Treff] Laden fehlgeschlagen:', e);
    const cached = readJson<TreffEntry[]>(LAST_REMOTE_KEY, []).filter(x => treffPhase(x, now) !== 'over');
    return { entries: cached, offline: true };
  }
}

/** Gast-Ansicht (F10): nur Halle, Zeit und Niveau. */
export async function loadPublicTreffEntries(now: Date = new Date()): Promise<TreffLoadResult<PublicTreffEntry>> {
  if (!useRemote(null)) {
    const active = readLocal().entries.filter(e => treffPhase(e, now) !== 'over');
    return { entries: active.map(toPublicEntry), offline: false };
  }
  try {
    const { data, error } = await supabase!
      .from('treff_entries_public')
      .select('*')
      .gt('ends_at', now.toISOString())
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return {
      entries: (data || []).map((r: any) => ({
        id: r.id,
        gymId: fromRemoteGymId(r.gym_id),
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        gradeMin: r.grade_min || undefined,
        gradeMax: r.grade_max || undefined,
      })),
      offline: false,
    };
  } catch (e) {
    console.warn('[Treff] Gast-Ansicht nicht geladen:', e);
    return { entries: [], offline: true };
  }
}

// ---------------------------------------------------------------------------
// Schreiben
// ---------------------------------------------------------------------------

function precheck(user: TreffUser | null, gymId: string): TreffError | null {
  if (!user || user.id === 'guest') return 'guest';
  const s = getTreffSettings(user.id);
  if (s.banned || readLocal().banned.includes(user.id)) return 'banned';
  if (!hasTreffConsent(s)) return 'no_consent';
  if (!isTreffEnabledForGym(gymId)) return 'gym_disabled';
  return null;
}

async function insertEntry(entry: TreffEntry, now: Date): Promise<TreffResult<TreffEntry>> {
  if (!useRemote(entry.userId)) {
    const s = readLocal();
    if (countOpenEntries(s.entries, entry.userId, now) >= TREFF_MAX_OPEN_ENTRIES) return { ok: false, error: 'limit' };
    s.entries.push(entry);
    writeLocal(s);
    notifyChanged();
    return { ok: true, value: entry };
  }
  if (isOffline()) return { ok: false, error: 'offline' };
  try {
    const { count } = await supabase!
      .from('treff_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', entry.userId)
      .gt('ends_at', now.toISOString());
    if ((count || 0) >= TREFF_MAX_OPEN_ENTRIES) return { ok: false, error: 'limit' };
    const { error } = await supabase!.from('treff_entries').insert(entryToRow(entry));
    if (error) {
      console.warn('[Treff] Eintragen fehlgeschlagen:', error.message);
      return { ok: false, error: 'failed' };
    }
    notifyChanged();
    return { ok: true, value: entry };
  } catch (e) {
    console.warn('[Treff] Eintragen fehlgeschlagen:', e);
    return { ok: false, error: 'offline' };
  }
}

function baseEntry(user: TreffUser, gymId: string, startsAt: string, endsAt: string, gradeVisible: { min?: string; max?: string }): TreffEntry {
  return {
    id: newId(),
    userId: user.id,
    gymId,
    startsAt,
    endsAt,
    gradeMin: gradeVisible.min,
    gradeMax: gradeVisible.max,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: new Date().toISOString(),
  };
}

export async function createTreffEntry(
  user: TreffUser | null,
  input: TreffEntryInput,
  now: Date = new Date()
): Promise<TreffResult<TreffEntry>> {
  const pre = precheck(user, input.gymId);
  if (pre) return { ok: false, error: pre };
  const invalid = validateTreffInput(input, now);
  if (invalid) return { ok: false, error: invalid };
  const showGrade = getTreffSettings(user!.id).showGrade;
  const start = combineDayTime(input.day, input.from);
  const end = combineDayTime(input.day, input.to);
  const entry: TreffEntry = {
    ...baseEntry(user!, input.gymId, start.toISOString(), end.toISOString(), showGrade ? { min: input.gradeMin, max: input.gradeMax } : {}),
    boulderRef: input.boulderRef || undefined,
    note: input.note?.trim() || undefined,
  };
  return insertEntry(entry, now);
}

/** «Ich bin jetzt da» (F4). */
export async function checkInNow(
  user: TreffUser | null,
  gymId: string,
  grade?: { min?: string; max?: string },
  now: Date = new Date()
): Promise<TreffResult<TreffEntry>> {
  const pre = precheck(user, gymId);
  if (pre) return { ok: false, error: pre };
  const { startsAt, endsAt } = buildNowInput(gymId, now);
  const showGrade = getTreffSettings(user!.id).showGrade;
  return insertEntry(baseEntry(user!, gymId, startsAt, endsAt, showGrade && grade ? grade : {}), now);
}

/** «Ich komme auch» (F6): eigener Eintrag mit gleicher Halle und Zeit. */
export async function joinTreffEntry(
  user: TreffUser | null,
  target: TreffEntry,
  allEntries: TreffEntry[],
  grade?: { min?: string; max?: string },
  now: Date = new Date()
): Promise<TreffResult<TreffEntry>> {
  const pre = precheck(user, target.gymId);
  if (pre) return { ok: false, error: pre };
  if (treffPhase(target, now) === 'over') return { ok: false, error: 'in_past' };
  const mine = allEntries.filter(e => e.userId === user!.id && e.gymId === target.gymId);
  if (mine.some(e => overlaps(e, target))) return { ok: false, error: 'already' };
  const showGrade = getTreffSettings(user!.id).showGrade;
  return insertEntry(baseEntry(user!, target.gymId, target.startsAt, target.endsAt, showGrade && grade ? grade : {}), now);
}

export async function deleteTreffEntry(userId: string, entryId: string): Promise<boolean> {
  if (!useRemote(userId)) {
    const s = readLocal();
    const entry = s.entries.find(e => e.id === entryId);
    if (!entry || (entry.userId !== userId && !isPlatformAdmin(userId))) return false;
    s.entries = s.entries.filter(e => e.id !== entryId);
    writeLocal(s);
    notifyChanged();
    return true;
  }
  try {
    const { error } = await supabase!.from('treff_entries').delete().eq('id', entryId);
    if (error) return false;
    notifyChanged();
    return true;
  } catch {
    return false;
  }
}

/** Einstellungen → «Meine Einträge löschen» (F12). */
export async function deleteAllMyTreffEntries(userId: string): Promise<boolean> {
  if (!useRemote(userId)) {
    const s = readLocal();
    s.entries = s.entries.filter(e => e.userId !== userId);
    writeLocal(s);
    notifyChanged();
    return true;
  }
  try {
    const { error } = await supabase!.from('treff_entries').delete().eq('user_id', userId);
    notifyChanged();
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Ausblenden & Melden (F14, F15)
// ---------------------------------------------------------------------------

export async function listMyTreffBlocks(userId: string): Promise<TreffBlock[]> {
  if (!useRemote(userId)) return readLocal().blocks.filter(b => b.blockerId === userId);
  try {
    const { data } = await supabase!.from('treff_blocks').select('*').eq('blocker_id', userId);
    return (data || []).map((r: any) => ({ blockerId: r.blocker_id, blockedId: r.blocked_id, blockedNickname: r.blocked_nickname || undefined }));
  } catch {
    return [];
  }
}

export async function blockTreffUser(blockerId: string, blockedId: string, blockedNickname?: string): Promise<boolean> {
  if (blockerId === blockedId) return false;
  if (!useRemote(blockerId)) {
    const s = readLocal();
    if (!s.blocks.some(b => b.blockerId === blockerId && b.blockedId === blockedId)) {
      s.blocks.push({ blockerId, blockedId, blockedNickname });
      writeLocal(s);
    }
    notifyChanged();
    return true;
  }
  try {
    const { error } = await supabase!
      .from('treff_blocks')
      .upsert({ blocker_id: blockerId, blocked_id: blockedId, blocked_nickname: blockedNickname || null }, { onConflict: 'blocker_id,blocked_id' });
    notifyChanged();
    return !error;
  } catch {
    return false;
  }
}

export async function unblockTreffUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!useRemote(blockerId)) {
    const s = readLocal();
    s.blocks = s.blocks.filter(b => !(b.blockerId === blockerId && b.blockedId === blockedId));
    writeLocal(s);
    notifyChanged();
    return true;
  }
  try {
    const { error } = await supabase!.from('treff_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
    notifyChanged();
    return !error;
  } catch {
    return false;
  }
}

export async function reportTreffEntry(reporterId: string, entry: TreffEntry, reason: TreffReportReason): Promise<boolean> {
  const report: TreffReport = {
    id: newId(),
    reporterId,
    entryId: entry.id,
    reportedUserId: entry.userId,
    reason,
    snapshot: buildReportSnapshot(entry),
    createdAt: new Date().toISOString(),
  };
  if (!useRemote(reporterId)) {
    const s = readLocal();
    s.reports.push(report);
    writeLocal(s);
    return true;
  }
  try {
    const { error } = await supabase!.from('treff_reports').insert({
      id: report.id,
      reporter_id: report.reporterId,
      entry_id: report.entryId,
      reported_user_id: report.reportedUserId,
      reason: report.reason,
      snapshot: report.snapshot,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Nur Plattform-Admin: offene Meldungen. */
export async function listOpenTreffReports(adminId: string): Promise<TreffReport[]> {
  if (!isPlatformAdmin(adminId)) return [];
  if (!useRemote(adminId)) return readLocal().reports.filter(r => !r.handledAt);
  try {
    const { data } = await supabase!.from('treff_reports').select('*').is('handled_at', null).order('created_at', { ascending: false });
    return (data || []).map((r: any) => ({
      id: r.id,
      reporterId: r.reporter_id,
      entryId: r.entry_id,
      reportedUserId: r.reported_user_id,
      reason: r.reason,
      snapshot: r.snapshot,
      createdAt: r.created_at,
      handledAt: r.handled_at || undefined,
    }));
  } catch {
    return [];
  }
}

export type TreffReportAction = 'delete_entry' | 'ban_user' | 'done';

/** Plattform-Admin: Eintrag löschen, Person sperren oder erledigt (jeweils wird die Meldung erledigt). */
export async function handleTreffReport(adminId: string, report: TreffReport, action: TreffReportAction): Promise<boolean> {
  if (!isPlatformAdmin(adminId)) return false;
  const handledAt = new Date().toISOString();
  if (!useRemote(adminId)) {
    const s = readLocal();
    if (action === 'delete_entry') s.entries = s.entries.filter(e => e.id !== report.entryId);
    if (action === 'ban_user') {
      if (!s.banned.includes(report.reportedUserId)) s.banned.push(report.reportedUserId);
      s.entries = s.entries.filter(e => e.userId !== report.reportedUserId);
    }
    s.reports = s.reports.map(r => (r.id === report.id ? { ...r, handledAt } : r));
    writeLocal(s);
    notifyChanged();
    return true;
  }
  try {
    if (action === 'delete_entry') await supabase!.from('treff_entries').delete().eq('id', report.entryId);
    if (action === 'ban_user') await supabase!.rpc('treff_set_banned', { target: report.reportedUserId, value: true });
    const { error } = await supabase!.from('treff_reports').update({ handled_at: handledAt }).eq('id', report.id);
    notifyChanged();
    return !error;
  } catch {
    return false;
  }
}

/** Lokale Aufräumung (Supabase räumt per treff_cleanup() selbst auf). */
export function cleanupLocalTreff(now: Date = new Date()): number {
  const s = readLocal();
  const before = s.entries.length;
  s.entries = s.entries.filter(e => !isExpiredForCleanup(e, now));
  if (s.entries.length !== before) writeLocal(s);
  return before - s.entries.length;
}
