/**
 * Unified Storage Utility with safe localStorage access and in-memory fallback.
 * Prevents storage crashes in non-browser or privacy-restricted environments.
 */

const memoryStore = new Map<string, string>();

export function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStorageString(key: string, fallback: string | null = null): string | null {
  if (isLocalStorageAvailable()) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fall through to memory store
    }
  }
  return memoryStore.has(key) ? (memoryStore.get(key) ?? fallback) : fallback;
}

export function setStorageString(key: string, value: string): void {
  memoryStore.set(key, value);
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.error(`Failed writing key "${key}" to localStorage:`, e);
    }
  }
}

export function getStorageJson<T>(key: string, fallback: T): T {
  const raw = getStorageString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorageJson<T>(key: string, value: T): void {
  setStorageString(key, JSON.stringify(value));
}

export function removeStorageItem(key: string): void {
  memoryStore.delete(key);
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
}

export function clearMemoryStore(): void {
  memoryStore.clear();
}

/**
 * Prüft, ob ein gegebener String eine gültige UUID v4 ist.
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Konvertiert beliebige lokale String-IDs deterministisch in eine valide UUID,
 * damit Supabase UUID-Spalten und Foreign Keys niemals scheitern.
 */
export function stringToUuid(str: string): string {
  if (isValidUuid(str)) return str;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = ((hash1 << 5) - hash1) + str.charCodeAt(i);
    hash1 |= 0;
  }
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) - hash2) + str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `00000000-${hex1.slice(0, 4)}-4000-8000-${hex1.slice(4)}${hex2}`.slice(0, 36);
}

// -------------------------------------------------------------
// Permanently Deleted Boulders Tombstones (AC-13)
// Verhindert die ungewollte Re-Initialisierung/Wiederauferstehung
// von gelöschten Seed- oder Remote-Bouldern in allen Komponenten.
// -------------------------------------------------------------
export const STORAGE_KEY_DELETED_BOULDERS = 'boulderapp_deleted_boulders_v1';

export const PERMANENTLY_PURGED_BOULDER_IDS = new Set<string>([
  'boulder-6a-slab-2',
  'boulder-6a-slab-3',
  'boulder-6a-slab-4',
  'boulder-6a-slab-5',
]);

export function getDeletedBoulderIds(): Set<string> {
  const list = getStorageJson<string[]>(STORAGE_KEY_DELETED_BOULDERS, []);
  return new Set(list);
}

export function isBoulderDeleted(boulderId: string): boolean {
  if (!boulderId) return false;
  if (PERMANENTLY_PURGED_BOULDER_IDS.has(boulderId)) return true;
  const set = getDeletedBoulderIds();
  if (set.has(boulderId)) return true;
  const uuid = isValidUuid(boulderId) ? boulderId : stringToUuid(boulderId);
  return set.has(uuid);
}

export function markBoulderDeleted(boulderId: string): void {
  if (!boulderId) return;
  const set = getDeletedBoulderIds();
  set.add(boulderId);
  const uuid = isValidUuid(boulderId) ? boulderId : stringToUuid(boulderId);
  set.add(uuid);
  setStorageJson(STORAGE_KEY_DELETED_BOULDERS, Array.from(set));
}

export function clearDeletedBoulders(): void {
  removeStorageItem(STORAGE_KEY_DELETED_BOULDERS);
}

