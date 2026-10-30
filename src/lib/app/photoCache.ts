import { Capacitor } from '@capacitor/core';
import { isNativeApp } from './platform';
import { getStorageJson, setStorageJson, removeStorageItem } from '../storageUtils';

/**
 * SPEC-045 §4.1 / AC-2: Wandfotos der zuletzt geöffneten Halle bleiben auf dem Gerät.
 * Nur EINE Halle; beim Hallenwechsel wird der Speicher ersetzt. Nur in der App.
 */

export const PHOTO_CACHE_KEY = 'bouldermate_photo_cache_v1';
const DIR = 'wall-photos';

export interface PhotoCacheEntry {
  file: string;
  uri: string;
  bytes: number;
}

export interface PhotoCacheIndex {
  gymId: string | null;
  entries: Record<string, PhotoCacheEntry>;
}

const EMPTY: PhotoCacheIndex = { gymId: null, entries: {} };
let index: PhotoCacheIndex | null = null;

function load(): PhotoCacheIndex {
  if (!index) index = getStorageJson<PhotoCacheIndex>(PHOTO_CACHE_KEY, EMPTY) || EMPTY;
  return index;
}

function save(next: PhotoCacheIndex): void {
  index = next;
  setStorageJson(PHOTO_CACHE_KEY, next);
}

/** Dateiname aus der Adresse (stabil, nur sichere Zeichen) */
export function photoFileName(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}-${url.length}.jpg`;
}

/** Nur echte Fotos aus dem Netz werden gespeichert (keine data:-URLs, keine mitgelieferten Bilder). */
export function isCacheableUrl(url: string | undefined | null): url is string {
  return Boolean(url && /^https:\/\//i.test(url));
}

/** Bild-Adresse für <img>: gespeicherte Datei, sonst die Original-Adresse. Im Web immer das Original. */
export function cachedPhotoSrc(url: string): string {
  if (!isNativeApp() || !url) return url;
  const entry = load().entries[url];
  if (!entry) return url;
  try {
    return Capacitor.convertFileSrc(entry.uri);
  } catch {
    return url;
  }
}

export function photoCacheBytes(): number {
  return Object.values(load().entries).reduce((sum, e) => sum + (e.bytes || 0), 0);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let running: Promise<void> | null = null;

/** Lädt fehlende Fotos der Halle; ersetzt den Speicher, wenn eine andere Halle offen ist. */
export function cacheWallPhotos(gymId: string, urls: (string | undefined | null)[]): Promise<void> {
  if (!isNativeApp() || !gymId) return Promise.resolve();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve();
  const wanted = Array.from(new Set(urls.filter(isCacheableUrl)));
  const job = async () => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    let current = load();
    if (current.gymId !== gymId) {
      await Filesystem.rmdir({ path: DIR, directory: Directory.Data, recursive: true }).catch(() => undefined);
      current = { gymId, entries: {} };
      save(current);
    }
    await Filesystem.mkdir({ path: DIR, directory: Directory.Data, recursive: true }).catch(() => undefined);
    const entries = { ...current.entries };
    // Fotos, die nicht mehr an der Wand sind, entfernen
    for (const url of Object.keys(entries)) {
      if (!wanted.includes(url)) {
        await Filesystem.deleteFile({ path: `${DIR}/${entries[url].file}`, directory: Directory.Data }).catch(() => undefined);
        delete entries[url];
      }
    }
    for (const url of wanted) {
      if (entries[url]) continue;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const file = photoFileName(url);
        const written = await Filesystem.writeFile({
          path: `${DIR}/${file}`,
          directory: Directory.Data,
          data: await blobToBase64(blob),
        });
        entries[url] = { file, uri: written.uri, bytes: blob.size };
        save({ gymId, entries });
      } catch {
        // Netz weg: beim nächsten Öffnen weiter
      }
    }
    save({ gymId, entries });
  };
  running = (running ?? Promise.resolve()).then(job, job);
  return running;
}

export async function clearPhotoCache(): Promise<void> {
  index = { ...EMPTY };
  removeStorageItem(PHOTO_CACHE_KEY);
  if (!isNativeApp()) return;
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    await Filesystem.rmdir({ path: DIR, directory: Directory.Data, recursive: true });
  } catch {
    // schon leer
  }
}

/** Nur für Tests */
export function resetPhotoCacheMemory(): void {
  index = null;
  running = null;
}
