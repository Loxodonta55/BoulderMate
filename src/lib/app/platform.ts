import { Capacitor } from '@capacitor/core';

/**
 * SPEC-045 §8: Eine Stelle für alle App-Sonderwege.
 * Im Browser ist `isNativeApp()` false und alles verhält sich wie bisher.
 */

export type AppPlatform = 'ios' | 'android' | 'web';

/** Für Tests: erzwingt eine Plattform (null = echte Erkennung). */
let platformOverride: AppPlatform | null = null;

export function setPlatformOverride(p: AppPlatform | null): void {
  platformOverride = p;
}

function readWindowOverride(): AppPlatform | null {
  if (typeof window === 'undefined') return null;
  const v = (window as any).__BM_PLATFORM__;
  return v === 'ios' || v === 'android' || v === 'web' ? v : null;
}

export function getPlatform(): AppPlatform {
  const forced = platformOverride ?? readWindowOverride();
  if (forced) return forced;
  try {
    const p = Capacitor.getPlatform();
    return p === 'ios' || p === 'android' ? p : 'web';
  } catch {
    return 'web';
  }
}

export function isNativeApp(): boolean {
  return getPlatform() !== 'web';
}

/** Handy im Browser (nicht App, nicht vom Startbildschirm) – für den Hinweis «Auch als App». */
export function mobileBrowserOs(ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): 'ios' | 'android' | null {
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipod/i.test(ua)) return 'ios';
  return null;
}

export function isStandaloneWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true
    );
  } catch {
    return false;
  }
}
