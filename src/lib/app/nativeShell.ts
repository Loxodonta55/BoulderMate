import { isNativeApp, getPlatform } from './platform';
import { parseAppLink, WALL_LINK_EVENT } from './appLinks';
import { savePendingWallLink } from '../wallLink';
import { navigationHistory } from '../navigationHistory';
import { showToast, hideToast } from '../../components/ui/Toast';
import { t } from '../i18n';

/**
 * SPEC-045 §4: Handy-Funktionen der App-Hülle. Wird nur in der App aufgerufen (main.tsx).
 * Startbild, Statusleiste, Systemschrift, Android-Zurück, App-Links, Foto nach Android-Neustart.
 */

/** §4.4: Zweiter Druck auf Zurück innerhalb dieser Zeit beendet die App */
export const EXIT_PRESS_WINDOW_MS = 2000;
/** §4.4: Systemschrift bis 200 % */
export const MAX_TEXT_ZOOM = 2;

export type BackAction = 'close-layer' | 'history-back' | 'confirm-exit' | 'exit';

/** Reine Entscheidung für Android-Zurück (testbar ohne Gerät). */
export function decideBackAction(opts: { layers: number; canGoBack: boolean; lastPressAt: number | null; now: number }): BackAction {
  if (opts.layers > 0) return 'close-layer';
  if (opts.canGoBack) return 'history-back';
  if (opts.lastPressAt !== null && opts.now - opts.lastPressAt <= EXIT_PRESS_WINDOW_MS) return 'exit';
  return 'confirm-exit';
}

export function clampTextZoom(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(MAX_TEXT_ZOOM, Math.max(1, value));
}

/** Foto, das Android nach einem Neustart der App zurückgibt (§4.5). */
export const RESTORED_PHOTO_KEY = 'bouldermate_restored_photo_v1';
export const RESTORED_PHOTO_EVENT = 'bouldermate:photo-restored';

export function takeRestoredPhoto(): string | null {
  try {
    const v = sessionStorage.getItem(RESTORED_PHOTO_KEY);
    if (v) sessionStorage.removeItem(RESTORED_PHOTO_KEY);
    return v;
  } catch {
    return null;
  }
}

export async function handleAppUrl(url: string): Promise<void> {
  const link = parseAppLink(url);
  if (link.kind === 'wall') {
    savePendingWallLink(link.sectorId);
    window.dispatchEvent(new CustomEvent(WALL_LINK_EVENT, { detail: link.sectorId }));
    return;
  }
  if (link.kind === 'email-link') {
    // Neu laden mit denselben Parametern: readEmailLinkFromUrl() in App.tsx übernimmt
    window.location.replace(`/${link.search}`);
    return;
  }
  if (link.kind === 'auth' || link.kind === 'auth-error') {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.close();
    } catch {
      // auf Android gibt es nichts zu schließen
    }
    if (link.kind === 'auth') {
      const { finishNativeOAuth } = await import('../authService');
      const user = await finishNativeOAuth(link.code);
      if (!user) showToast({ message: t('Anmeldung fehlgeschlagen. Bitte nochmal versuchen.') });
    } else {
      showToast({ message: t('Anmeldung abgebrochen. Bitte nochmal versuchen.') });
    }
  }
}

let initialized = false;

export async function initNativeShell(): Promise<void> {
  if (initialized || !isNativeApp()) return;
  initialized = true;
  document.documentElement.classList.add('bm-native', `bm-native-${getPlatform()}`);

  const [{ App }, { StatusBar, Style }, { TextZoom }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
    import('@capacitor/text-zoom'),
  ]);

  // §4.1 Statusleiste: Uhr immer lesbar, hell/dunkel nach System
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)');
  const applyBar = () => StatusBar.setStyle({ style: dark?.matches ? Style.Dark : Style.Light }).catch(() => undefined);
  applyBar();
  dark?.addEventListener?.('change', applyBar);

  // §4.4 Systemschrift übernehmen (Android-Schriftgröße, iPhone-Textgröße), höchstens 200 %
  const applyZoom = async () => {
    try {
      const { value } = await TextZoom.getPreferred();
      await TextZoom.set({ value: clampTextZoom(value) });
    } catch {
      // ohne Plugin: Standard
    }
  };
  applyZoom();
  App.addListener('resume', applyZoom);

  // §4.2 App-Links (QR-Code mit der Kamera, geteilte Links, Login-Rücksprung)
  App.addListener('appUrlOpen', ({ url }) => {
    handleAppUrl(url);
  });
  const launch = await App.getLaunchUrl().catch(() => undefined);
  if (launch?.url) handleAppUrl(launch.url);

  // §4.4 Android-Zurück: erst Sheet/Dialog, dann Ansicht, auf der Startansicht zweimal drücken
  let lastPressAt: number | null = null;
  App.addListener('backButton', ({ canGoBack }) => {
    const action = decideBackAction({ layers: navigationHistory.size, canGoBack, lastPressAt, now: Date.now() });
    if (action === 'close-layer' || action === 'history-back') {
      lastPressAt = null;
      window.history.back();
    } else if (action === 'confirm-exit') {
      lastPressAt = Date.now();
      showToast({ message: t('Nochmal drücken zum Beenden'), durationMs: EXIT_PRESS_WINDOW_MS });
    } else {
      hideToast();
      App.exitApp();
    }
  });

  // §4.5 Android hat die App während der Kamera beendet: Foto übernehmen
  App.addListener('appRestoredResult', result => {
    const photo = (result?.data as any)?.dataUrl || ((result?.data as any)?.base64String ? `data:image/jpeg;base64,${(result.data as any).base64String}` : null);
    if (result?.pluginId === 'Camera' && result.success && photo) {
      try {
        sessionStorage.setItem(RESTORED_PHOTO_KEY, photo);
      } catch {
        // zu groß für den Speicher: verloren, wie bisher
      }
      window.dispatchEvent(new CustomEvent(RESTORED_PHOTO_EVENT));
    }
  });
}

/** §4.1: Startbild erst ausblenden, wenn die App gezeichnet ist */
export async function hideSplashWhenReady(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    // ignore
  }
}

