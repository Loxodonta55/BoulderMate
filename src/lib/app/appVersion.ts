import { useEffect, useState } from 'react';
import { isNativeApp, getPlatform } from './platform';

/**
 * SPEC-045 §4.6: Versionen und Updates.
 * `public/app-version.json` liegt auf Vercel; die App fragt es beim Start ab.
 * - App < minVersion   → Vollbild «Bitte aktualisieren» (nur wenn alte Apps sonst kaputtgehen)
 * - App < latestVersion → ruhiger Punkt am Zahnrad, Zeile in den Einstellungen
 * - stores.ios/android: Store-Adressen; solange null, gibt es keine Store-Knöpfe und keinen Hinweis «Auch als App»
 */

export interface AppVersionInfo {
  minVersion: string;
  latestVersion: string;
  stores: { ios: string | null; android: string | null };
}

export type UpdateState = 'required' | 'available' | 'ok';

export const APP_VERSION_URL = 'https://bouldermate.ch/app-version.json';

/** -1, 0, 1 wie bei sort; fehlende Stellen zählen als 0 («1.2» = «1.2.0») */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function getUpdateState(appVersion: string, info: Pick<AppVersionInfo, 'minVersion' | 'latestVersion'>): UpdateState {
  if (compareVersions(appVersion, info.minVersion) < 0) return 'required';
  if (compareVersions(appVersion, info.latestVersion) < 0) return 'available';
  return 'ok';
}

export function parseAppVersionInfo(data: unknown): AppVersionInfo | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as any;
  if (typeof d.minVersion !== 'string' || typeof d.latestVersion !== 'string') return null;
  const s = d.stores && typeof d.stores === 'object' ? d.stores : {};
  return {
    minVersion: d.minVersion,
    latestVersion: d.latestVersion,
    stores: {
      ios: typeof s.ios === 'string' && s.ios ? s.ios : null,
      android: typeof s.android === 'string' && s.android ? s.android : null,
    },
  };
}

let cachedInfo: Promise<AppVersionInfo | null> | null = null;

/** In der App vom Server (die gebündelte Datei wäre so alt wie die App), im Web von der eigenen Seite. */
export function loadAppVersionInfo(fetcher: typeof fetch = fetch): Promise<AppVersionInfo | null> {
  if (!cachedInfo) {
    const url = isNativeApp() ? APP_VERSION_URL : '/app-version.json';
    cachedInfo = fetcher(url, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(parseAppVersionInfo)
      .catch(() => null);
  }
  return cachedInfo;
}

export function resetAppVersionCache(): void {
  cachedInfo = null;
}

export interface InstalledAppInfo {
  version: string;
  build: string;
}

export async function getInstalledAppInfo(): Promise<InstalledAppInfo | null> {
  if (!isNativeApp()) return null;
  const forced = typeof window !== 'undefined' ? (window as any).__BM_APP_INFO__ : null;
  if (forced?.version) return { version: String(forced.version), build: String(forced.build ?? '') };
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return { version: info.version, build: info.build };
  } catch {
    return null;
  }
}

export function storeUrlForThisDevice(info: AppVersionInfo | null): string | null {
  if (!info) return null;
  const p = getPlatform();
  if (p === 'ios') return info.stores.ios;
  if (p === 'android') return info.stores.android;
  return null;
}

export interface AppUpdateStatus {
  state: UpdateState;
  installed: InstalledAppInfo | null;
  info: AppVersionInfo | null;
  storeUrl: string | null;
}

/** Hook für App.tsx und Einstellungen. Im Web immer «ok». */
export function useAppUpdateStatus(): AppUpdateStatus {
  const [status, setStatus] = useState<AppUpdateStatus>({ state: 'ok', installed: null, info: null, storeUrl: null });
  useEffect(() => {
    if (!isNativeApp()) return;
    let alive = true;
    Promise.all([getInstalledAppInfo(), loadAppVersionInfo()]).then(([installed, info]) => {
      if (!alive) return;
      const state = installed && info ? getUpdateState(installed.version, info) : 'ok';
      setStatus({ state, installed, info, storeUrl: storeUrlForThisDevice(info) });
    });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
