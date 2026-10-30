import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { isPlatformAdmin } from '../authService';
import { getProfile, getProfiles, isShownInLists } from '../profileService';
import { getAscents, isUserMatch } from '../ratingAndAscentService';
import { blockTreffUser, listLocalTreffBlocks, listOpenTreffReports, unblockTreffUser, useRemote } from '../treffService';

/**
 * SPEC-046: Person melden und ausblenden.
 * Speicher wie Treff (F17): Supabase für echte Konten, sonst lokal (Test-Personen, Tests).
 * Ausblenden nutzt `treff_blocks` als Liste für die ganze App.
 */

export const MODERATION_CHANGED_EVENT = 'bouldermate:moderation_changed';
/** SPEC-033: so heißen verborgene Personen in Listen */
export const ANONYMOUS_NAME = 'Jemand';
export const REPORT_DAILY_LIMIT = 5;
export const ELIGIBLE_MIN_AGE_DAYS = 7;
export const AUTO_HIDE_THRESHOLD = 3;
export const AUTO_HIDE_WINDOW_DAYS = 14;
export const REPORT_NOTE_MAX = 200;

export type ProfileReportReason = 'name' | 'bild' | 'belaestigung' | 'anderes';

export const PROFILE_REPORT_REASONS: { value: ProfileReportReason; label: string }[] = [
  { value: 'name', label: 'Name ist beleidigend' },
  { value: 'bild', label: 'Bild ist anstößig' },
  { value: 'belaestigung', label: 'Belästigt mich' },
  { value: 'anderes', label: 'Etwas anderes' },
];

export type ModerationRule = 'nacktheit' | 'gewalt' | 'hass' | 'werbung';
export const MODERATION_RULES: { value: ModerationRule; label: string }[] = [
  { value: 'nacktheit', label: 'Nacktheit' },
  { value: 'gewalt', label: 'Gewalt' },
  { value: 'hass', label: 'Hass' },
  { value: 'werbung', label: 'Werbung' },
];

export type ModerationAction = 'reset_name' | 'remove_avatar' | 'ban' | 'restore' | 'done';

export interface ReportTarget {
  userId: string;
  nickname: string;
  avatarUrl?: string;
}

export type ReportResult = 'ok' | 'queued' | 'limit' | 'self' | 'failed';

export interface PublicModeration {
  banned: boolean;
  nameHidden: boolean;
  avatarHidden: boolean;
}

export interface MyModeration extends PublicModeration {
  /** pending_bild · pending_name · decided_name_reset · decided_bild_removed:<regel> · restored · banned */
  notice?: string;
}

export interface ProfileReport {
  id: string;
  reporterId: string | null;
  reportedUserId: string;
  reason: ProfileReportReason;
  note?: string;
  snapshot: string;
  createdAt: string;
  reporterEligible: boolean;
  reportedNote?: string;
  handledAt?: string;
  decision?: ModerationAction;
}

export interface AdminProfileReport extends ProfileReport {
  reportedNickname: string;
  reportedAvatar?: string;
  nameHidden: boolean;
  avatarHidden: boolean;
  banned: boolean;
  timesReported: number;
  reporterReports: number;
  isTrainer: boolean;
}

// ---------------------------------------------------------------------------
// Lokaler Speicher
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'boulderapp_moderation_v1';
const CACHE_KEY = 'boulderapp_moderation_cache_v1';
const OUTBOX_KEY = 'boulderapp_moderation_outbox_v1';

interface LocalStore {
  reports: ProfileReport[];
  flags: Record<string, MyModeration>;
}

interface RemoteCache {
  viewerId?: string;
  hidden: string[];
  flags: Record<string, PublicModeration>;
  me?: MyModeration;
}

type OutboxItem =
  | { kind: 'report'; reporterId: string; targetId: string; reason: ProfileReportReason; note?: string }
  | { kind: 'block'; viewerId: string; targetId: string; nickname?: string };

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
    // Speicher gesperrt: dann nur im Arbeitsspeicher
  }
}

function readLocal(): LocalStore {
  const s = readJson<Partial<LocalStore>>(LOCAL_KEY, {});
  return { reports: s.reports || [], flags: s.flags || {} };
}

function writeLocal(s: LocalStore): void {
  writeJson(LOCAL_KEY, s);
}

let cache: RemoteCache | null = null;

function readCache(): RemoteCache {
  if (!cache) cache = readJson<RemoteCache>(CACHE_KEY, { hidden: [], flags: {} });
  return cache;
}

function writeCache(c: RemoteCache): void {
  cache = c;
  writeJson(CACHE_KEY, c);
}

function notifyChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(MODERATION_CHANGED_EVENT));
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Nur für Tests */
export function resetModerationState(): void {
  cache = null;
  for (const k of [LOCAL_KEY, CACHE_KEY, OUTBOX_KEY]) {
    try {
      localStorage.removeItem(k);
    } catch {
      // egal
    }
  }
}

// ---------------------------------------------------------------------------
// Lesen: wer ist für wen «Jemand»?
// ---------------------------------------------------------------------------

/** Ausgeblendet in eine der beiden Richtungen (§4.3) */
export function isHiddenBetween(viewerId: string | undefined, otherId: string): boolean {
  if (!viewerId || isUserMatch(viewerId, otherId)) return false;
  const local = listLocalTreffBlocks().some(
    b => (isUserMatch(b.blockerId, viewerId) && isUserMatch(b.blockedId, otherId)) || (isUserMatch(b.blockerId, otherId) && isUserMatch(b.blockedId, viewerId))
  );
  if (local) return true;
  const c = readCache();
  return Boolean(c.viewerId && isUserMatch(c.viewerId, viewerId) && c.hidden.some(id => isUserMatch(id, otherId)));
}

export function getPublicModeration(userId: string): PublicModeration {
  const none: PublicModeration = { banned: false, nameHidden: false, avatarHidden: false };
  const local = Object.entries(readLocal().flags).find(([id]) => isUserMatch(id, userId))?.[1];
  const remote = Object.entries(readCache().flags).find(([id]) => isUserMatch(id, userId))?.[1];
  const f = { ...none, ...(remote || {}), ...(local || {}) };
  return { banned: Boolean(f.banned), nameHidden: Boolean(f.nameHidden), avatarHidden: Boolean(f.avatarHidden) };
}

/**
 * Erscheint die Person für den Betrachter als «Jemand»?
 * Ja, wenn sie nicht in Listen erscheinen will (SPEC-033), ausgeblendet ist, gesperrt ist oder ihr Name vorläufig versteckt ist.
 * Die eigene Person sieht sich immer.
 */
export function isAnonymousFor(viewerId: string | undefined, userId: string): boolean {
  if (viewerId && isUserMatch(viewerId, userId)) return false;
  if (!isShownInLists(userId)) return true;
  const m = getPublicModeration(userId);
  if (m.banned || m.nameHidden) return true;
  return isHiddenBetween(viewerId, userId);
}

/** Profilbild nur, wenn es nicht versteckt oder gesperrt ist */
export function visibleAvatar(userId: string, url?: string): string | undefined {
  if (!url) return undefined;
  const m = getPublicModeration(userId);
  return m.banned || m.avatarHidden ? undefined : url;
}

/** Status der eigenen Person (Hinweis in «Ich») */
export function getMyModeration(userId: string): MyModeration {
  if (!useRemote(userId)) {
    const f = Object.entries(readLocal().flags).find(([id]) => isUserMatch(id, userId))?.[1];
    return { banned: false, nameHidden: false, avatarHidden: false, ...(f || {}) };
  }
  const c = readCache();
  return c.me && c.viewerId && isUserMatch(c.viewerId, userId) ? c.me : { banned: false, nameHidden: false, avatarHidden: false };
}

/** Lädt Ausblenden-Liste, öffentliche Sperren/Verstecke und den eigenen Status; sendet Liegengebliebenes nach. */
export async function refreshModeration(viewerId?: string): Promise<void> {
  if (!supabase || !useRemote(viewerId ?? null)) {
    notifyChanged();
    return;
  }
  if (isOffline()) return;
  const next: RemoteCache = { ...readCache() };
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, banned, name_hidden, avatar_hidden')
      .or('banned.eq.true,name_hidden.eq.true,avatar_hidden.eq.true');
    if (data) {
      next.flags = {};
      for (const r of data as any[]) {
        next.flags[r.id] = { banned: Boolean(r.banned), nameHidden: Boolean(r.name_hidden), avatarHidden: Boolean(r.avatar_hidden) };
      }
    }
  } catch {
    // Spalten fehlen noch (Migration nicht eingespielt): alte Liste behalten
  }
  if (viewerId && useRemote(viewerId)) {
    await flushOutbox();
    try {
      const { data } = await supabase.rpc('my_hidden_user_ids');
      if (Array.isArray(data)) {
        next.viewerId = viewerId;
        next.hidden = data.map((r: any) => (typeof r === 'string' ? r : r.my_hidden_user_ids)).filter(Boolean);
      }
    } catch {
      // ohne Netz: alte Liste behalten
    }
    try {
      const { data } = await supabase.rpc('my_moderation_status');
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        next.viewerId = viewerId;
        next.me = { banned: Boolean(row.banned), nameHidden: Boolean(row.name_hidden), avatarHidden: Boolean(row.avatar_hidden), notice: row.notice || undefined };
      }
    } catch {
      // egal
    }
  }
  writeCache(next);
  notifyChanged();
}

/** Komponenten zeichnen neu, sobald sich Ausblenden oder Sperren ändern */
export function useModerationVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV(x => x + 1);
    window.addEventListener(MODERATION_CHANGED_EVENT, on);
    return () => window.removeEventListener(MODERATION_CHANGED_EVENT, on);
  }, []);
  return v;
}

// ---------------------------------------------------------------------------
// Ausblenden (§4.3)
// ---------------------------------------------------------------------------

function addHiddenToCache(viewerId: string, targetId: string): void {
  const c = { ...readCache() };
  if (!c.viewerId || !isUserMatch(c.viewerId, viewerId)) {
    c.viewerId = viewerId;
    c.hidden = [];
  }
  if (!c.hidden.some(id => isUserMatch(id, targetId))) c.hidden = [...c.hidden, targetId];
  writeCache(c);
}

/** Wirkt sofort; ohne Netz wird nachgesendet (v4) */
export async function hidePerson(viewerId: string, target: ReportTarget): Promise<boolean> {
  if (isUserMatch(viewerId, target.userId)) return false;
  if (!useRemote(viewerId)) {
    const ok = await blockTreffUser(viewerId, target.userId, target.nickname);
    notifyChanged();
    return ok;
  }
  addHiddenToCache(viewerId, target.userId);
  notifyChanged();
  const ok = isOffline() ? false : await blockTreffUser(viewerId, target.userId, target.nickname);
  if (!ok) pushOutbox({ kind: 'block', viewerId, targetId: target.userId, nickname: target.nickname });
  return true;
}

export async function showPersonAgain(viewerId: string, targetId: string): Promise<boolean> {
  const ok = await unblockTreffUser(viewerId, targetId);
  const c = readCache();
  if (c.hidden.some(id => isUserMatch(id, targetId))) writeCache({ ...c, hidden: c.hidden.filter(id => !isUserMatch(id, targetId)) });
  notifyChanged();
  return ok;
}

// ---------------------------------------------------------------------------
// Melden (§4.2, §4.4)
// ---------------------------------------------------------------------------

function dayAgo(now: Date): number {
  return now.getTime() - 24 * 3600 * 1000;
}

/** Lokale Nachbildung von «eingesessen»: Konto älter als 7 Tage und mindestens eine Begehung */
export function isEligibleReporter(userId: string, now: Date = new Date()): boolean {
  const p = getProfiles().find(x => isUserMatch(x.id, userId));
  const created = p?.createdAt ? new Date(p.createdAt).getTime() : now.getTime();
  const oldEnough = created < now.getTime() - ELIGIBLE_MIN_AGE_DAYS * 24 * 3600 * 1000;
  return oldEnough && getAscents().some(a => isUserMatch(a.userId, userId));
}

function localSnapshot(targetId: string, fallback: ReportTarget): string {
  const p = getProfiles().find(x => isUserMatch(x.id, targetId));
  const nick = p?.nickname || fallback.nickname;
  const avatar = p?.avatarUrl || fallback.avatarUrl;
  return `${nick} | ${avatar && avatar.startsWith('http') ? avatar : '–'}`.slice(0, 500);
}

function reportLocally(reporterId: string, target: ReportTarget, reason: ProfileReportReason, note: string | undefined, now: Date): ReportResult {
  const s = readLocal();
  const today = s.reports.filter(r => r.reporterId && isUserMatch(r.reporterId, reporterId) && new Date(r.createdAt).getTime() > dayAgo(now));
  if (today.length >= REPORT_DAILY_LIMIT) return 'limit';
  const eligible = isEligibleReporter(reporterId, now);
  s.reports.push({
    id: newId(),
    reporterId,
    reportedUserId: target.userId,
    reason,
    note: note || undefined,
    snapshot: localSnapshot(target.userId, target),
    createdAt: now.toISOString(),
    reporterEligible: eligible,
  });
  if (eligible && (reason === 'name' || reason === 'bild')) {
    const since = now.getTime() - AUTO_HIDE_WINDOW_DAYS * 24 * 3600 * 1000;
    const reporters = new Set(
      s.reports
        .filter(
          r =>
            isUserMatch(r.reportedUserId, target.userId) &&
            r.reason === reason &&
            r.reporterEligible &&
            !r.handledAt &&
            new Date(r.createdAt).getTime() > since
        )
        .map(r => r.reporterId)
    );
    if (reporters.size >= AUTO_HIDE_THRESHOLD) {
      const f = s.flags[target.userId] || { banned: false, nameHidden: false, avatarHidden: false };
      if (reason === 'bild' && !f.avatarHidden) s.flags[target.userId] = { ...f, avatarHidden: true, notice: 'pending_bild' };
      if (reason === 'name' && !f.nameHidden) s.flags[target.userId] = { ...f, nameHidden: true, notice: 'pending_name' };
    }
  }
  writeLocal(s);
  return 'ok';
}

async function reportRemotely(targetId: string, reason: ProfileReportReason, note?: string): Promise<ReportResult | 'network'> {
  try {
    const { data, error } = await supabase!.rpc('report_profile', { target: targetId, reason, note: note || null });
    if (error) return isOffline() ? 'network' : 'failed';
    if (data === 'limit') return 'limit';
    if (data === 'self') return 'self';
    return 'ok';
  } catch {
    return 'network';
  }
}

/** Grund, optionaler Satz (≤ 200 Zeichen); ohne Netz in die Warteschlange (v4) */
export async function reportPerson(
  reporterId: string,
  target: ReportTarget,
  reason: ProfileReportReason,
  note?: string,
  now: Date = new Date()
): Promise<ReportResult> {
  if (isUserMatch(reporterId, target.userId)) return 'self';
  const clean = (note || '').trim().slice(0, REPORT_NOTE_MAX) || undefined;
  if (!useRemote(reporterId)) {
    const res = reportLocally(reporterId, target, reason, clean, now);
    notifyChanged();
    return res;
  }
  const res = isOffline() ? 'network' : await reportRemotely(target.userId, reason, clean);
  if (res === 'network') {
    pushOutbox({ kind: 'report', reporterId, targetId: target.userId, reason, note: clean });
    return 'queued';
  }
  return res;
}

// ---------------------------------------------------------------------------
// Warteschlange ohne Netz
// ---------------------------------------------------------------------------

function pushOutbox(item: OutboxItem): void {
  const list = readJson<OutboxItem[]>(OUTBOX_KEY, []);
  list.push(item);
  writeJson(OUTBOX_KEY, list);
}

export function pendingModerationCount(): number {
  return readJson<OutboxItem[]>(OUTBOX_KEY, []).length;
}

export async function flushOutbox(): Promise<number> {
  if (isOffline() || !supabase) return 0;
  const list = readJson<OutboxItem[]>(OUTBOX_KEY, []);
  if (list.length === 0) return 0;
  const rest: OutboxItem[] = [];
  let sent = 0;
  for (const item of list) {
    if (!useRemote(item.kind === 'report' ? item.reporterId : item.viewerId)) {
      rest.push(item);
      continue;
    }
    if (item.kind === 'report') {
      const res = await reportRemotely(item.targetId, item.reason, item.note);
      if (res === 'network') rest.push(item);
      else sent++;
    } else {
      const ok = await blockTreffUser(item.viewerId, item.targetId, item.nickname);
      if (ok) sent++;
      else rest.push(item);
    }
  }
  writeJson(OUTBOX_KEY, rest);
  return sent;
}

let onlineListener = false;
let viewerGetter: () => string | undefined = () => undefined;
/** Beim Start und bei jedem Personenwechsel: sobald wieder Netz da ist, nachsenden */
export function startModerationSync(getViewerId: () => string | undefined): void {
  viewerGetter = getViewerId;
  if (onlineListener || typeof window === 'undefined') return;
  onlineListener = true;
  window.addEventListener('online', () => {
    void refreshModeration(viewerGetter());
  });
}

// ---------------------------------------------------------------------------
// Die betroffene Person (§4.4)
// ---------------------------------------------------------------------------

/** «Das ist ein Fehler» */
export async function objectToModeration(userId: string, note: string = 'Das ist ein Fehler.'): Promise<boolean> {
  if (!useRemote(userId)) {
    const s = readLocal();
    let n = 0;
    s.reports = s.reports.map(r => {
      if (isUserMatch(r.reportedUserId, userId) && !r.handledAt) {
        n++;
        return { ...r, reportedNote: note.slice(0, 500) };
      }
      return r;
    });
    writeLocal(s);
    return n > 0;
  }
  try {
    const { error } = await supabase!.rpc('object_moderation', { note });
    return !error;
  } catch {
    return false;
  }
}

/** Rückmeldung gelesen; «vorläufig versteckt» und «gesperrt» bleiben stehen */
export async function acknowledgeNotice(userId: string): Promise<void> {
  const keep = (n?: string) => !n || n.startsWith('pending_') || n === 'banned';
  if (!useRemote(userId)) {
    const s = readLocal();
    const key = Object.keys(s.flags).find(id => isUserMatch(id, userId));
    if (key && !keep(s.flags[key].notice)) {
      s.flags[key] = { ...s.flags[key], notice: undefined };
      writeLocal(s);
    }
    notifyChanged();
    return;
  }
  const c = readCache();
  if (c.me && !keep(c.me.notice)) writeCache({ ...c, me: { ...c.me, notice: undefined } });
  notifyChanged();
  try {
    await supabase!.rpc('ack_moderation_notice');
  } catch {
    // beim nächsten Start nochmal
  }
}

// ---------------------------------------------------------------------------
// Plattform-Admin (§4.5)
// ---------------------------------------------------------------------------

function sortForAdmin(list: AdminProfileReport[]): AdminProfileReport[] {
  const urgent = (r: AdminProfileReport) => (r.nameHidden || r.avatarHidden || r.reportedNote ? 1 : 0);
  return [...list].sort(
    (a, b) => urgent(b) - urgent(a) || Number(b.isTrainer) - Number(a.isTrainer) || b.createdAt.localeCompare(a.createdAt)
  );
}

function isLocalTrainer(userId: string): boolean {
  try {
    const raw = localStorage.getItem('boulderapp_groups_v1');
    const groups = raw ? (JSON.parse(raw).groups as { ownerId: string }[] | undefined) : undefined;
    return Boolean(groups?.some(g => isUserMatch(g.ownerId, userId)));
  } catch {
    return false;
  }
}

export async function listProfileReports(adminId: string): Promise<AdminProfileReport[]> {
  if (!isPlatformAdmin(adminId)) return [];
  if (!useRemote(adminId)) {
    const s = readLocal();
    const open = s.reports.filter(r => !r.handledAt);
    return sortForAdmin(
      open.map(r => {
        const p = getProfile(r.reportedUserId);
        const f = s.flags[r.reportedUserId] || { banned: false, nameHidden: false, avatarHidden: false };
        return {
          ...r,
          reportedNickname: p.nickname,
          reportedAvatar: p.avatarUrl,
          nameHidden: Boolean(f.nameHidden),
          avatarHidden: Boolean(f.avatarHidden),
          banned: Boolean(f.banned),
          timesReported: s.reports.filter(x => isUserMatch(x.reportedUserId, r.reportedUserId)).length,
          reporterReports: r.reporterId ? s.reports.filter(x => x.reporterId && isUserMatch(x.reporterId, r.reporterId!)).length : 0,
          isTrainer: isLocalTrainer(r.reportedUserId),
        };
      })
    );
  }
  try {
    const { data, error } = await supabase!.rpc('admin_profile_reports');
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({
      id: r.id,
      reporterId: null,
      reportedUserId: r.reported_user_id,
      reason: r.reason,
      note: r.note || undefined,
      snapshot: r.snapshot,
      createdAt: r.created_at,
      reporterEligible: false,
      reportedNote: r.reported_note || undefined,
      reportedNickname: r.reported_nickname || '–',
      reportedAvatar: r.reported_avatar || undefined,
      nameHidden: Boolean(r.name_hidden),
      avatarHidden: Boolean(r.avatar_hidden),
      banned: Boolean(r.banned),
      timesReported: r.times_reported ?? 0,
      reporterReports: r.reporter_reports ?? 0,
      isTrainer: Boolean(r.is_trainer),
    }));
  } catch {
    return [];
  }
}

function resetNickname(): string {
  return `Kletterer ${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

export async function moderateProfile(
  adminId: string,
  report: Pick<ProfileReport, 'id' | 'reportedUserId'>,
  action: ModerationAction,
  rule?: ModerationRule
): Promise<boolean> {
  if (!isPlatformAdmin(adminId)) return false;
  if (action === 'remove_avatar' && !rule) return false;
  if (!useRemote(adminId)) {
    const s = readLocal();
    const target = report.reportedUserId;
    const f = s.flags[target] || { banned: false, nameHidden: false, avatarHidden: false };
    // Profile liegen lokal: Name/Bild direkt ändern
    const profiles = getProfiles();
    const idx = profiles.findIndex(p => isUserMatch(p.id, target));
    if (action === 'reset_name') {
      if (idx >= 0) profiles[idx] = { ...profiles[idx], nickname: resetNickname() };
      s.flags[target] = { ...f, nameHidden: false, notice: 'decided_name_reset' };
    } else if (action === 'remove_avatar') {
      if (idx >= 0) profiles[idx] = { ...profiles[idx], avatarUrl: undefined };
      s.flags[target] = { ...f, avatarHidden: false, notice: `decided_bild_removed:${rule}` };
    } else if (action === 'ban') {
      s.flags[target] = { ...f, banned: true, notice: 'banned' };
    } else if (action === 'restore') {
      const was = f.nameHidden || f.avatarHidden;
      s.flags[target] = { ...f, nameHidden: false, avatarHidden: false, notice: was ? 'restored' : f.notice };
    }
    if (idx >= 0) writeJson('boulderapp_profiles_v1', profiles);
    const now = new Date().toISOString();
    s.reports = s.reports.map(r => (isUserMatch(r.reportedUserId, target) && !r.handledAt ? { ...r, handledAt: now, decision: action } : r));
    writeLocal(s);
    notifyChanged();
    return true;
  }
  try {
    const { error } = await supabase!.rpc('moderate_profile', { report: report.id, action, rule: rule || null });
    notifyChanged();
    return !error;
  } catch {
    return false;
  }
}

/** Zahl am Zahnrad: offene Profil- und Treff-Meldungen */
export async function countOpenReports(adminId: string): Promise<number> {
  if (!isPlatformAdmin(adminId)) return 0;
  const [p, t] = await Promise.all([listProfileReports(adminId), listOpenTreffReports(adminId)]);
  return p.length + t.length;
}

// ---------------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------------

export function ruleLabel(rule?: string): string {
  return MODERATION_RULES.find(r => r.value === rule)?.label || 'das';
}

export function reasonLabel(reason: string): string {
  return PROFILE_REPORT_REASONS.find(r => r.value === reason)?.label || reason;
}
