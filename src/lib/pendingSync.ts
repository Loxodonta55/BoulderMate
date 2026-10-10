import { getStorageJson, setStorageJson } from './storageUtils';

/**
 * SPEC-032 F3 · Sende-Warteschlange für Begehungen und Bewertungen.
 *
 * Schlägt das Senden nach Supabase fehl (z. B. kein Netz im Keller), landet der
 * Eintrag hier und wird beim Start, beim Ereignis `online` und nach jedem
 * erfolgreichen Senden erneut versucht. Pro Boulder und Person gibt es höchstens
 * einen Eintrag je Art: der neueste Stand gewinnt.
 */
export const PENDING_SYNC_KEY = 'boulderapp_pending_sync_v1';
export const PENDING_SYNC_EVENT = 'bouldermate:pending_sync_changed';
/** Nach so vielen Fehlversuchen mit Netz wird ein Eintrag verworfen (z. B. dauerhaft abgelehnt). */
export const PENDING_SYNC_MAX_TRIES = 10;

export type PendingKind = 'ascent' | 'rating';
export type PendingOp = 'upsert' | 'delete';

export interface PendingSyncItem {
  kind: PendingKind;
  op: PendingOp;
  userId: string;
  boulderId: string;
  /** Vollständiges Objekt bei `upsert` */
  payload?: any;
  queuedAt: string;
  tries: number;
}

export type PendingSender = (item: PendingSyncItem) => Promise<boolean>;

function keyOf(kind: PendingKind, userId: string, boulderId: string): string {
  return `${kind}:${userId}:${boulderId}`;
}

function notify(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PENDING_SYNC_EVENT, { detail: { count: getPendingSyncCount() } }));
  }
}

export function getPendingSyncItems(): PendingSyncItem[] {
  const list = getStorageJson<PendingSyncItem[]>(PENDING_SYNC_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function getPendingSyncCount(): number {
  return getPendingSyncItems().length;
}

function save(list: PendingSyncItem[]): void {
  setStorageJson(PENDING_SYNC_KEY, list);
  notify();
}

export function enqueuePendingSync(item: Omit<PendingSyncItem, 'queuedAt' | 'tries'>): void {
  const list = getPendingSyncItems().filter(
    i => keyOf(i.kind, i.userId, i.boulderId) !== keyOf(item.kind, item.userId, item.boulderId)
  );
  list.push({ ...item, queuedAt: new Date().toISOString(), tries: 0 });
  save(list);
}

export function clearPendingSync(kind: PendingKind, userId: string, boulderId: string): void {
  const before = getPendingSyncItems();
  const after = before.filter(i => keyOf(i.kind, i.userId, i.boulderId) !== keyOf(kind, userId, boulderId));
  if (after.length !== before.length) save(after);
}

/**
 * Wartet für diesen Boulder und diese Person noch etwas? Dann darf der Abgleich
 * mit Supabase den lokalen Stand nicht überschreiben (SPEC-032 AC-3).
 * `matchUser`/`matchBoulder` erlauben unscharfe Vergleiche (UUID vs. lokale ID).
 */
export function hasPendingSync(
  kind: PendingKind,
  userId: string,
  boulderId: string,
  matchUser: (a: string, b: string) => boolean = (a, b) => a === b,
  matchBoulder: (a: string, b: string) => boolean = (a, b) => a === b
): boolean {
  return getPendingSyncItems().some(
    i => i.kind === kind && matchUser(i.userId, userId) && matchBoulder(i.boulderId, boulderId)
  );
}

export function isDeviceOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

let flushing: Promise<number> | null = null;

/**
 * Sendet alle wartenden Einträge der Reihe nach. Gibt die Anzahl der noch
 * wartenden Einträge zurück. Läuft nie doppelt gleichzeitig.
 */
export function flushPendingSync(send: PendingSender): Promise<number> {
  if (flushing) return flushing;
  const run = (async (): Promise<number> => {
    await Promise.resolve();
    {
      if (!isDeviceOnline()) return getPendingSyncCount();
      for (const item of getPendingSyncItems()) {
        let ok = false;
        try {
          ok = await send(item);
        } catch {
          ok = false;
        }
        // Liste kann sich während des Sendens geändert haben: nur genau diesen Stand entfernen
        const current = getPendingSyncItems();
        const idx = current.findIndex(
          i => keyOf(i.kind, i.userId, i.boulderId) === keyOf(item.kind, item.userId, item.boulderId) && i.queuedAt === item.queuedAt
        );
        if (idx < 0) continue;
        if (ok) {
          current.splice(idx, 1);
        } else if (isDeviceOnline()) {
          current[idx] = { ...current[idx], tries: current[idx].tries + 1 };
          if (current[idx].tries >= PENDING_SYNC_MAX_TRIES) current.splice(idx, 1);
        }
        save(current);
        if (!ok && !isDeviceOnline()) break;
      }
      return getPendingSyncCount();
    }
  })();
  // Erst nach der Zuweisung freigeben (sonst bleibt bei sofortigem Ende ein alter Promise hängen)
  flushing = run.finally(() => {
    flushing = null;
  });
  return flushing;
}

export function resetPendingSync(): void {
  save([]);
}
