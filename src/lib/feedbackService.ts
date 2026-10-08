import { supabase, isSupabaseConfigured } from './supabase';
import { toKnownAuthUserUuid } from './syncService';

/**
 * SPEC-026 · Nutzer-Feedback an das App-Team.
 * Schreibt nur (RLS erlaubt INSERT, kein SELECT). Ohne Netz landet die Meldung in einer
 * lokalen Warteschlange und wird beim nächsten Start bzw. bei `online` duplikatfrei nachgesendet.
 */

export type FeedbackCategory = 'bug' | 'idea' | 'praise';

export const FEEDBACK_MIN_LENGTH = 5;
export const FEEDBACK_MAX_LENGTH = 2000;
export const FEEDBACK_RATE_LIMIT = 5;
export const FEEDBACK_RATE_WINDOW_MS = 60 * 60 * 1000;
export const FEEDBACK_QUEUE_KEY = 'boulderapp_feedback_queue_v1';
export const FEEDBACK_SENT_LOG_KEY = 'boulderapp_feedback_sent_v1';

export interface FeedbackRow {
  id: string;
  created_at: string;
  user_id: string | null;
  nickname: string | null;
  email: string | null;
  contact_ok: boolean;
  category: FeedbackCategory;
  message: string;
  gym_id: string | null;
  gym_name: string | null;
  app_view: string;
  user_agent: string | null;
  screen: string | null;
  status: 'neu';
}

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  contactOk: boolean;
  userId?: string;
  nickname?: string;
  email?: string;
  gymId?: string;
  gymName?: string;
  appView?: string;
}

export type FeedbackValidation = 'ok' | 'too_short' | 'too_long';

export function validateFeedbackMessage(message: string): FeedbackValidation {
  const len = message.trim().length;
  if (len < FEEDBACK_MIN_LENGTH) return 'too_short';
  if (len > FEEDBACK_MAX_LENGTH) return 'too_long';
  return 'ok';
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function buildFeedbackRow(input: FeedbackInput, now: Date = new Date()): FeedbackRow {
  const hasWindow = typeof window !== 'undefined';
  const email = input.contactOk && input.email && input.email.includes('@') ? input.email : null;
  return {
    id: newId(),
    created_at: now.toISOString(),
    user_id: input.userId ? toKnownAuthUserUuid(input.userId) : null,
    nickname: input.nickname || null,
    email,
    contact_ok: input.contactOk,
    category: input.category,
    message: input.message.trim().slice(0, FEEDBACK_MAX_LENGTH),
    gym_id: input.gymId || null,
    gym_name: input.gymName || null,
    app_view: input.appView || 'settings',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    screen: hasWindow ? `${window.innerWidth}×${window.innerHeight}` : null,
    status: 'neu',
  };
}

// ---------------------------------------------------------------------------
// Lokaler Speicher: Warteschlange & Ratenbremse
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
    // Speicher voll oder gesperrt: Feedback geht dann nur online
  }
}

export function getFeedbackQueue(): FeedbackRow[] {
  return readJson<FeedbackRow[]>(FEEDBACK_QUEUE_KEY, []);
}

function enqueue(row: FeedbackRow): void {
  const queue = getFeedbackQueue().filter(r => r.id !== row.id);
  queue.push(row);
  writeJson(FEEDBACK_QUEUE_KEY, queue);
}

function recentSends(now: number): number[] {
  return readJson<number[]>(FEEDBACK_SENT_LOG_KEY, []).filter(t => now - t < FEEDBACK_RATE_WINDOW_MS);
}

export function isFeedbackRateLimited(now: number = Date.now()): boolean {
  return recentSends(now).length >= FEEDBACK_RATE_LIMIT;
}

function recordSend(now: number): void {
  writeJson(FEEDBACK_SENT_LOG_KEY, [...recentSends(now), now]);
}

// ---------------------------------------------------------------------------
// Senden
// ---------------------------------------------------------------------------

async function insertRows(rows: FeedbackRow[]): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured || rows.length === 0) return false;
  try {
    // ignoreDuplicates → ON CONFLICT DO NOTHING: Nachsenden erzeugt nie doppelte Meldungen
    const { error } = await supabase.from('app_feedback').upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.warn('[Feedback] Senden fehlgeschlagen:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Feedback] Senden fehlgeschlagen:', e);
    return false;
  }
}

export type FeedbackResult = 'sent' | 'queued' | 'rate_limited' | 'invalid';

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  if (validateFeedbackMessage(input.message) !== 'ok') return 'invalid';
  const now = Date.now();
  if (isFeedbackRateLimited(now)) return 'rate_limited';

  const row = buildFeedbackRow(input, new Date(now));
  recordSend(now);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (!offline && (await insertRows([row]))) return 'sent';
  enqueue(row);
  return 'queued';
}

let flushing: Promise<number> | null = null;

/** Sendet alle wartenden Meldungen. Gibt die Zahl der gesendeten Meldungen zurück. */
export function flushFeedbackQueue(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    const queue = getFeedbackQueue();
    if (queue.length === 0) return 0;
    const ok = await insertRows(queue);
    if (!ok) return 0;
    const sentIds = new Set(queue.map(r => r.id));
    // Während des Sendens neu hinzugekommene Meldungen bleiben in der Warteschlange
    writeJson(FEEDBACK_QUEUE_KEY, getFeedbackQueue().filter(r => !sentIds.has(r.id)));
    return queue.length;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Beim App-Start einmal aufrufen: sendet sofort nach und erneut bei jedem `online`. */
export function startFeedbackQueueSync(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onOnline = () => {
    void flushFeedbackQueue();
  };
  void flushFeedbackQueue();
  window.addEventListener('online', onOnline);
  return () => window.removeEventListener('online', onOnline);
}
