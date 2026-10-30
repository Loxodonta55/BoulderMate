// SPEC-052: KI-Routenerfassung in der App – Hallen-Einstellungen, Aufträge (mit Offline-Warteschlange),
// Status, «Ergebnis zurücknehmen», «Kurz prüfen» und Meldungen von Kletterern.
import { supabase, isSupabaseConfigured, uploadSectorPhoto } from '../supabase';
import { isTestEnv } from '../authService';
import * as gymStorage from '../gymStorage';
import { getStorageJson, setStorageJson } from '../storageUtils';
import { dataUrlToBlob } from '../imageUtils';
import {
  SECTOR_ALIAS_MAP,
  deleteWallBoulder,
  getSectorById,
  getWallBoulders,
  setBouldersArchived,
  updateBoulderDetails,
  updateSectorPhoto,
} from '../batchBoulderService';
import { getAscents, getRatings } from '../ratingAndAscentService';
import type { WallBoulder } from '../../types/boulder';
import { GRADE_HINT_MAX, GRADE_SYMBOL_MAX, isGradeMarker, type AiJobStatus, type AiPublishMode, type CaptureMode, type GradeMarker, type RouteNameStyle } from './types';

export const UNDO_HOURS = 24;
export const REVIEW_DAYS = 7;
export const DAILY_LIMIT = 30;
const QUEUE_KEY = 'bouldermate_ai_capture_queue_v1';
const JOBS_KEY = 'bouldermate_ai_capture_jobs_v1';
const ISSUES_KEY = 'bouldermate_route_issues_v1';

const GYM_ID_MAP: Record<string, string> = {
  'gym-6a-plus': 'f2b11564-ca86-4ed4-b51c-3affb346144b',
  'gym-minimum-zh': '814696b2-303e-4897-9bdb-d83505a63489',
};
const remoteGymId = (id: string) => GYM_ID_MAP[id] || id;
const remoteSectorId = (id: string) => SECTOR_ALIAS_MAP[id] || id;
const online = () => Boolean(supabase && isSupabaseConfigured && !isTestEnv && (typeof navigator === 'undefined' || navigator.onLine !== false));
const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bouldermate:ai_capture_updated'));
};

// ---------------------------------------------------------------------------
// Hallen-Einstellungen (F2, F4, F6, F9)
// ---------------------------------------------------------------------------

export interface GymAiSettings {
  enabled: boolean;
  gradeMarker: GradeMarker;
  /** Zeichen am Start je Farbe (scaleId → «★★, 2 Sterne») */
  gradeSymbols: Record<string, string>;
  /** Hinweis der Halle an die KI */
  gradeHint: string;
  nameStyle: RouteNameStyle;
  publishMode: AiPublishMode;
}

export function getGymAiSettings(gymId: string): GymAiSettings {
  const gym = gymStorage.getGyms().find(g => g.id === gymId);
  return {
    enabled: gym?.ai_capture_enabled === true,
    gradeMarker: isGradeMarker(gym?.grade_marker) ? gym!.grade_marker! : 'holds',
    gradeSymbols: gym?.grade_symbols ?? {},
    gradeHint: gym?.ai_grade_hint ?? '',
    nameStyle: gym?.route_name_style ?? 'fun',
    publishMode: gym?.ai_publish_mode === 'review' ? 'review' : 'direct',
  };
}

const SETTINGS_COLUMNS: Record<keyof GymAiSettings, string> = {
  enabled: 'ai_capture_enabled',
  gradeMarker: 'grade_marker',
  gradeSymbols: 'grade_symbols',
  gradeHint: 'ai_grade_hint',
  nameStyle: 'route_name_style',
  publishMode: 'ai_publish_mode',
};

/** Nur Hallen-Admins. Gibt false zurück, wenn die Person kein Admin ist. */
export function setGymAiSettings(gymId: string, userId: string, patch: Partial<GymAiSettings>): boolean {
  if (!gymStorage.isGymAdmin(gymId, userId)) return false;
  const gyms = gymStorage.getGyms();
  const idx = gyms.findIndex(g => g.id === gymId);
  if (idx === -1) return false;
  const clean = { ...patch };
  if (clean.gradeHint !== undefined) clean.gradeHint = clean.gradeHint.slice(0, GRADE_HINT_MAX);
  if (clean.gradeSymbols) {
    clean.gradeSymbols = Object.fromEntries(Object.entries(clean.gradeSymbols)
      .map(([id, v]) => [id, v.trim().slice(0, GRADE_SYMBOL_MAX)]).filter(([, v]) => v));
  }
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(clean)) row[SETTINGS_COLUMNS[k as keyof GymAiSettings]] = v;
  gyms[idx] = { ...gyms[idx], ...row };
  gymStorage.saveGyms(gyms);
  if (online()) {
    supabase!.from('gyms').update(row).eq('id', remoteGymId(gymId)).then(
      ({ error }) => { if (error) console.warn('[KI] Hallen-Einstellung nicht gespeichert:', error.message); },
      () => {},
    );
  }
  notify();
  return true;
}

export async function getMonthlyCaptureCount(gymId: string): Promise<number | null> {
  if (!online()) return null;
  const { data, error } = await supabase!.rpc('ai_capture_month_count', { gym: remoteGymId(gymId) });
  return error ? null : Number(data ?? 0);
}

// ---------------------------------------------------------------------------
// Aufträge und Status (F1, F7, F10)
// ---------------------------------------------------------------------------

export interface QueuedCapture {
  localId: string;
  gymId: string;
  sectorId: string;
  mode: CaptureMode;
  dataUrl: string;
  userId: string;
  createdAt: string;
}

export interface CaptureJob {
  id: string;
  gymId: string;
  sectorId: string;
  mode: CaptureMode;
  status: AiJobStatus;
  createdAt: string;
  finishedAt?: string;
  error?: string;
  result?: {
    created?: number;
    createdIds?: string[];
    review?: number;
    archived?: number;
    publishMode?: AiPublishMode;
  };
  archivedBoulderIds?: string[];
  previousPhotoUrl?: string | null;
}

export type CaptureStatus =
  | { kind: 'waiting_network'; queued: QueuedCapture }
  | { kind: 'failed_local'; message: string }
  | { kind: 'job'; job: CaptureJob };

const getQueue = () => getStorageJson<QueuedCapture[]>(QUEUE_KEY, []);
const saveQueue = (q: QueuedCapture[]) => setStorageJson(QUEUE_KEY, q);
const getJobs = () => getStorageJson<CaptureJob[]>(JOBS_KEY, []);
const saveJobs = (jobs: CaptureJob[]) => setStorageJson(JOBS_KEY, jobs.slice(0, 200));
const localFailures = new Map<string, string>();

function sameSector(a: string, b: string): boolean {
  return a === b || remoteSectorId(a) === remoteSectorId(b);
}

function mapJob(row: Record<string, any>): CaptureJob {
  return {
    id: row.id,
    gymId: row.gym_id,
    sectorId: row.sector_id,
    mode: row.mode,
    status: row.status,
    createdAt: row.created_at,
    finishedAt: row.finished_at ?? undefined,
    error: row.error ?? undefined,
    result: row.result ?? undefined,
    archivedBoulderIds: row.archived_boulder_ids ?? [],
    previousPhotoUrl: row.previous_photo_url ?? null,
  };
}

async function sha256(dataUrl: string): Promise<string | null> {
  try {
    const bytes = new TextEncoder().encode(dataUrl.split(',')[1] ?? dataUrl);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

/** Foto merken und – sobald Netz da ist – als Auftrag senden. Die App darf danach geschlossen werden. */
export async function submitCapture(input: Omit<QueuedCapture, 'localId' | 'createdAt'>): Promise<CaptureStatus> {
  const item: QueuedCapture = { ...input, localId: `aiq-${Date.now()}`, createdAt: new Date().toISOString() };
  localFailures.delete(input.sectorId);
  saveQueue([...getQueue().filter(q => !sameSector(q.sectorId, input.sectorId)), item]);
  notify();
  await flushCaptureQueue();
  return getSectorCaptureStatus(input.sectorId) ?? { kind: 'waiting_network', queued: item };
}

/** Wartende Fotos senden (bei «online», beim Öffnen des Studios und nach jedem neuen Foto). */
export async function flushCaptureQueue(): Promise<void> {
  if (!online()) return;
  for (const item of getQueue()) {
    try {
      const blob = dataUrlToBlob(item.dataUrl);
      const url = await uploadSectorPhoto(blob, `ki_${item.sectorId}.jpg`);
      if (!url || url.startsWith('data:')) continue;
      const { data, error } = await supabase!.from('ai_capture_jobs').insert({
        gym_id: remoteGymId(item.gymId),
        sector_id: remoteSectorId(item.sectorId),
        mode: item.mode,
        photo_url: url,
        photo_hash: await sha256(item.dataUrl),
        created_by: item.userId,
      }).select('*').single();
      if (error) {
        const msg = /daily_limit/.test(error.message)
          ? `Heute wurden schon ${DAILY_LIMIT} Fotos ausgewertet. Morgen geht es wieder.`
          : /duplicate|unique/i.test(error.message)
          ? 'Dieses Foto wurde schon ausgewertet.'
          : 'Auftrag konnte nicht angelegt werden. Routen bitte von Hand eintragen.';
        localFailures.set(item.sectorId, msg);
        saveQueue(getQueue().filter(q => q.localId !== item.localId));
        continue;
      }
      saveJobs([mapJob(data), ...getJobs()]);
      saveQueue(getQueue().filter(q => q.localId !== item.localId));
    } catch (e) {
      console.warn('[KI] Foto wartet weiter auf Netz:', e);
    }
  }
  notify();
}

/** Aufträge der Halle neu laden (die App erfährt so, wann die KI fertig ist). */
export async function refreshCaptureJobs(gymId: string): Promise<CaptureJob[]> {
  if (!online()) return getJobs();
  const { data, error } = await supabase!.from('ai_capture_jobs').select('*')
    .eq('gym_id', remoteGymId(gymId)).order('created_at', { ascending: false }).limit(100);
  if (error || !data) return getJobs();
  const fresh = data.map(mapJob);
  const others = getJobs().filter(j => !fresh.some(f => f.id === j.id) && j.gymId !== remoteGymId(gymId));
  const before = JSON.stringify(getJobs());
  saveJobs([...fresh, ...others]);
  if (JSON.stringify(getJobs()) !== before) notify();
  return fresh;
}

/** Nur für Tests und den Worker-Rückweg: Auftrag lokal ablegen. */
export function rememberCaptureJob(job: CaptureJob): void {
  saveJobs([job, ...getJobs().filter(j => j.id !== job.id)]);
  notify();
}

/** Aktueller Stand für die Statuszeile eines Sektors (null = nichts anzeigen). */
export function getSectorCaptureStatus(sectorId: string, now: Date = new Date()): CaptureStatus | null {
  const failure = localFailures.get(sectorId);
  if (failure) return { kind: 'failed_local', message: failure };
  const queued = getQueue().find(q => sameSector(q.sectorId, sectorId));
  if (queued) return { kind: 'waiting_network', queued };
  const job = getJobs().find(j => sameSector(j.sectorId, sectorId));
  if (!job || job.status === 'undone') return null;
  if (job.status === 'done' || job.status === 'failed') {
    const end = new Date(job.finishedAt ?? job.createdAt).getTime();
    if (now.getTime() - end > UNDO_HOURS * 3600_000) return null;
  }
  return { kind: 'job', job };
}

export function captureStatusText(status: CaptureStatus): string {
  if (status.kind === 'waiting_network') return 'Wartet auf Netz …';
  if (status.kind === 'failed_local') return status.message;
  const { job } = status;
  switch (job.status) {
    case 'queued': return 'In Warteschlange – Routen erscheinen später';
    case 'running': return 'KI erkennt Routen …';
    case 'failed': return 'Erkennung fehlgeschlagen. Bitte Routen von Hand eintragen.';
    case 'done': {
      const n = job.result?.created ?? 0;
      const review = job.result?.review ?? 0;
      const base = `${n} ${n === 1 ? 'Route' : 'Routen'} erkannt`;
      return review > 0 ? `${base} · ${review} kurz prüfen` : base;
    }
    default: return '';
  }
}

export function canUndoCapture(job: CaptureJob, now: Date = new Date()): boolean {
  if (job.status !== 'done' || job.result?.publishMode === 'review') return false;
  const end = new Date(job.finishedAt ?? job.createdAt).getTime();
  return now.getTime() - end <= UNDO_HOURS * 3600_000;
}

/** Anzahl Begehungen auf den Routen dieses Laufs (für die Rückfrage vor dem Zurücknehmen). */
export function countAscentsForJob(job: CaptureJob): number {
  const ids = new Set(job.result?.createdIds ?? []);
  return ids.size ? getAscents().filter(a => ids.has(a.boulderId)).length : 0;
}

/** «Ergebnis zurücknehmen»: neue Routen löschen, alte Routen und altes Wandfoto zurück. */
export async function undoCapture(job: CaptureJob): Promise<void> {
  for (const id of job.result?.createdIds ?? []) deleteWallBoulder(id);
  const localIds = getWallBoulders().filter(b => (job.archivedBoulderIds ?? []).includes(b.id)).map(b => b.id);
  setBouldersArchived(localIds, false);
  const sector = getSectorById(job.sectorId) ?? getSectorById(Object.keys(SECTOR_ALIAS_MAP).find(k => SECTOR_ALIAS_MAP[k] === job.sectorId) ?? '');
  if (sector && job.previousPhotoUrl) updateSectorPhoto(sector.id, job.previousPhotoUrl);
  rememberCaptureJob({ ...job, status: 'undone' });
  if (online()) {
    await supabase!.from('ai_capture_jobs').update({ status: 'undone' }).eq('id', job.id);
  }
}

// ---------------------------------------------------------------------------
// «Kurz prüfen» (F3, F8)
// ---------------------------------------------------------------------------

export type ReviewReasonKey = 'grade' | 'unsure' | 'uncertain_match' | 'old_not_seen' | 'gone' | 'issue';

export interface ReviewItem {
  boulder: WallBoulder;
  reasons: ReviewReasonKey[];
  issues: number;
}

export const REVIEW_REASON_TEXT: Record<ReviewReasonKey, string> = {
  grade: 'Grad nicht sicher lesbar',
  unsure: 'KI ist unsicher',
  uncertain_match: 'Unsicher, ob alt oder neu',
  old_not_seen: 'Alte Route nicht mehr gesehen',
  gone: 'Laut KI abgeschraubt',
  issue: 'Meldung von Kletterern',
};

function parseReason(raw: string): { reason: ReviewReasonKey; date?: string } {
  const [reason, date] = raw.split(':');
  return { reason: reason as ReviewReasonKey, date };
}

export function getReviewItems(sectorId: string, now: Date = new Date()): ReviewItem[] {
  const limit = now.getTime() - REVIEW_DAYS * 86400_000;
  const issues = getOpenIssues().filter(i => i.boulderId && sameSector(i.sectorId, sectorId));
  return getWallBoulders(sectorId)
    .filter(b => b.status !== 'archived')
    .map(b => {
      const reasons = (b.aiReview ?? [])
        .map(parseReason)
        .filter(({ date }) => {
          const t = new Date(date ?? b.publishedAt ?? b.createdAt).getTime();
          return !Number.isFinite(t) || t >= limit;
        })
        .map(r => r.reason);
      const issueCount = issues.filter(i => i.boulderId === b.id).length;
      if (issueCount) reasons.push('issue');
      return { boulder: b, reasons: [...new Set(reasons)], issues: issueCount };
    })
    .filter(item => item.reasons.length > 0);
}

export type ReviewAction = 'ok' | 'delete' | 'archive' | 'keep';

export function resolveReview(boulderId: string, action: ReviewAction): void {
  if (action === 'delete') { deleteWallBoulder(boulderId); handleIssuesForBoulder(boulderId); return; }
  if (action === 'archive') { setBouldersArchived([boulderId], true); handleIssuesForBoulder(boulderId); return; }
  updateBoulderDetails(boulderId, { aiReview: [] });
  handleIssuesForBoulder(boulderId);
}

/** Merkmale gelten als «geschätzt», bis 3 Kletterer Merkmale bewertet haben (F4). */
export function isRadarStillEstimated(b: Pick<WallBoulder, 'id' | 'radarSource'>): boolean {
  if (b.radarSource !== 'ai') return false;
  return getRatings(b.id).filter(r => r.radar).length < 3;
}

// ---------------------------------------------------------------------------
// Meldungen von Kletterern (F8)
// ---------------------------------------------------------------------------

export type RouteIssueKind = 'wrong_grade' | 'not_exists' | 'wrong_pin' | 'missing';

export interface RouteIssue {
  id: string;
  gymId: string;
  sectorId: string;
  boulderId?: string;
  kind: RouteIssueKind;
  x?: number;
  y?: number;
  color?: string;
  userId: string;
  createdAt: string;
  handled?: boolean;
}

export const ROUTE_ISSUE_TEXT: Record<Exclude<RouteIssueKind, 'missing'>, string> = {
  wrong_grade: 'Farbe/Grad stimmt nicht',
  not_exists: 'Route gibt es nicht',
  wrong_pin: 'Pin ist falsch',
};

const getIssues = () => getStorageJson<RouteIssue[]>(ISSUES_KEY, []);
const saveIssues = (list: RouteIssue[]) => setStorageJson(ISSUES_KEY, list.slice(0, 300));

export function getOpenIssues(): RouteIssue[] {
  return getIssues().filter(i => !i.handled);
}

export function hasReportedIssue(boulderId: string, userId: string, kind: RouteIssueKind): boolean {
  return getIssues().some(i => i.boulderId === boulderId && i.userId === userId && i.kind === kind);
}

export async function reportRouteIssue(input: Omit<RouteIssue, 'id' | 'createdAt'>): Promise<boolean> {
  if (input.boulderId && hasReportedIssue(input.boulderId, input.userId, input.kind)) return true;
  const issue: RouteIssue = { ...input, id: `issue-${Date.now()}`, createdAt: new Date().toISOString() };
  saveIssues([issue, ...getIssues()]);
  notify();
  if (!online()) return true;
  const { error } = await supabase!.from('route_issue_reports').insert({
    gym_id: remoteGymId(input.gymId),
    sector_id: remoteSectorId(input.sectorId),
    boulder_id: input.boulderId ?? null,
    kind: input.kind,
    position_x: input.x ?? null,
    position_y: input.y ?? null,
    color: input.color ?? null,
    user_id: input.userId,
  });
  if (error && !/duplicate|unique/i.test(error.message)) console.warn('[KI] Meldung nicht gesendet:', error.message);
  return true;
}

/** Für Schrauber/Admins: offene Meldungen der Halle laden. */
export async function refreshRouteIssues(gymId: string): Promise<RouteIssue[]> {
  if (!online()) return getOpenIssues();
  const { data, error } = await supabase!.from('route_issue_reports').select('*')
    .eq('gym_id', remoteGymId(gymId)).is('handled_at', null).order('created_at', { ascending: false }).limit(200);
  if (error || !data) return getOpenIssues();
  const remote: RouteIssue[] = data.map(r => ({
    id: r.id, gymId: r.gym_id, sectorId: r.sector_id, boulderId: r.boulder_id ?? undefined, kind: r.kind,
    x: r.position_x ?? undefined, y: r.position_y ?? undefined, color: r.color ?? undefined,
    userId: r.user_id, createdAt: r.created_at,
  }));
  saveIssues([...remote, ...getIssues().filter(i => i.gymId !== remoteGymId(gymId) && i.gymId !== gymId)]);
  notify();
  return remote;
}

export function getMissingRouteIssues(sectorId: string): RouteIssue[] {
  return getOpenIssues().filter(i => i.kind === 'missing' && sameSector(i.sectorId, sectorId));
}

export function handleIssue(issueId: string): void {
  saveIssues(getIssues().map(i => (i.id === issueId ? { ...i, handled: true } : i)));
  notify();
  if (online() && !issueId.startsWith('issue-')) {
    supabase!.from('route_issue_reports').update({ handled_at: new Date().toISOString() }).eq('id', issueId).then(() => {}, () => {});
  }
}

function handleIssuesForBoulder(boulderId: string): void {
  getOpenIssues().filter(i => i.boulderId === boulderId).forEach(i => handleIssue(i.id));
}
