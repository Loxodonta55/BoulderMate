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
