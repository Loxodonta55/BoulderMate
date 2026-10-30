import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { getPlatform, isNativeApp, setPlatformOverride, mobileBrowserOs } from '../src/lib/app/platform';
import { parseAppLink, WALL_LINK_EVENT } from '../src/lib/app/appLinks';
import {
  compareVersions,
  getUpdateState,
  parseAppVersionInfo,
  resetAppVersionCache,
  AppUpdateStatus,
} from '../src/lib/app/appVersion';
import { decideBackAction, clampTextZoom, EXIT_PRESS_WINDOW_MS, handleAppUrl } from '../src/lib/app/nativeShell';
import {
  photoFileName,
  isCacheableUrl,
  cachedPhotoSrc,
  photoCacheBytes,
  PHOTO_CACHE_KEY,
  resetPhotoCacheMemory,
} from '../src/lib/app/photoCache';
import { WALL_PHOTO_MAX_PX, WALL_PHOTO_QUALITY } from '../src/lib/app/nativeCamera';
import { classifyScan, QrScanButton } from '../src/components/app/QrScanButton';
import { DeleteAccountSheet } from '../src/components/app/DeleteAccountSheet';
import { AppSettingsGroup, formatMegabytes } from '../src/components/app/AppSettingsGroup';
import { UpdateRequiredScreen } from '../src/components/app/UpdateRequiredScreen';
import { WebAppHint, WEB_APP_HINT_KEY } from '../src/components/app/WebAppHint';
import { StoreLinks } from '../src/components/app/StoreLinks';
import { MeView } from '../src/components/MeView';
import { isDeleteConfirmed, DELETE_CONFIRM_WORD } from '../src/lib/profileService';
import { getPendingWallLink, clearPendingWallLink } from '../src/lib/wallLink';
import { CurrentUser } from '../src/types/boulder';
import { UserRoleInfo } from '../src/lib/roleService';

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const GYM = 'gym-6a-plus';
const climber: CurrentUser = { id: 'spec045-climber', nickname: 'Rosemarie', role: 'member', isPlatformAdmin: false };
const roleInfo = { canAccessSetterStudio: false, canAccessAdminConsole: false } as UserRoleInfo;

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';

function mockVersionFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  setPlatformOverride(null);
  resetAppVersionCache();
  resetPhotoCacheMemory();
  localStorage.clear();
});

afterEach(() => {
  setPlatformOverride(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SPEC-045: BoulderMate als App', () => {
  describe('Plattform (§8)', () => {
    it('im Browser «web», mit Override App', () => {
      expect(getPlatform()).toBe('web');
      expect(isNativeApp()).toBe(false);
      setPlatformOverride('android');
      expect(isNativeApp()).toBe(true);
      expect(getPlatform()).toBe('android');
    });

    it('erkennt Handy-Browser für den Hinweis «Auch als App»', () => {
      expect(mobileBrowserOs(ANDROID_UA)).toBe('android');
      expect(mobileBrowserOs('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios');
      expect(mobileBrowserOs('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBeNull();
    });
  });

  describe('App-Links (§4.2, AC-3)', () => {
    it('QR-Code der Wand, Login-Rücksprung, Fehler, fremde Seiten', () => {
      expect(parseAppLink('https://bouldermate.ch/?wand=abc-123')).toEqual({ kind: 'wall', sectorId: 'abc-123' });
      expect(parseAppLink('https://www.bouldermate.ch/?wand=x')).toEqual({ kind: 'wall', sectorId: 'x' });
      expect(parseAppLink('https://bouldermate.ch/?code=pkce42')).toEqual({ kind: 'auth', code: 'pkce42' });
      expect(parseAppLink('https://bouldermate.ch/?error=access_denied').kind).toBe('auth-error');
      expect(parseAppLink('https://bouldermate.ch/').kind).toBe('home');
      expect(parseAppLink('https://example.com/?wand=x').kind).toBe('unknown');
      expect(parseAppLink('http://bouldermate.ch/?wand=x').kind).toBe('unknown');
      expect(parseAppLink('kein link').kind).toBe('unknown');
      // SPEC-049: E-Mail-Links gehen an App.tsx (Neuladen mit denselben Parametern)
      expect(parseAppLink('https://bouldermate.ch/?token_hash=t1&type=signup')).toEqual({ kind: 'email-link', search: '?token_hash=t1&type=signup' });
      expect(parseAppLink('https://bouldermate.ch/?auth=recovery&code=c9')).toEqual({ kind: 'email-link', search: '?auth=recovery&code=c9' });
    });

    it('Wand-Link merkt das Ziel und meldet es an die App', async () => {
      clearPendingWallLink();
      const seen: string[] = [];
      const listener = (e: Event) => seen.push((e as CustomEvent<string>).detail);
      window.addEventListener(WALL_LINK_EVENT, listener);
      await handleAppUrl('https://bouldermate.ch/?wand=sektor-7');
      window.removeEventListener(WALL_LINK_EVENT, listener);
      expect(seen).toEqual(['sektor-7']);
      expect(getPendingWallLink()).toBe('sektor-7');
    });

    it('Scanner: nur BoulderMate-Wandcodes werden geöffnet', () => {
      expect(classifyScan('https://bouldermate.ch/?wand=s1')).toBe('wall');
      expect(classifyScan('https://example.com')).toBe('not-ours');
      expect(classifyScan(null)).toBe('cancelled');
    });

    it('Scanner-Knopf gibt es nur in der App, mit Namen und ≥ 48 px', () => {
      const { unmount } = render(<QrScanButton />);
      expect(screen.queryByTestId('app-scan')).toBeNull();
      unmount();
      setPlatformOverride('ios');
      render(<QrScanButton />);
      const btn = screen.getByTestId('app-scan');
      expect(btn).toHaveAttribute('aria-label', 'QR-Code an der Wand scannen');
      expect(btn.className).toContain('w-12 h-12');
    });
  });

  describe('Versionen (§4.6, AC-11)', () => {
    it('vergleicht Versionen und entscheidet Sperre / Punkt / ok', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.2', '1.10.0')).toBe(-1);
      expect(compareVersions('2.0.1', '2.0')).toBe(1);
      const info = { minVersion: '1.1.0', latestVersion: '1.3.0' };
      expect(getUpdateState('1.0.9', info)).toBe('required');
      expect(getUpdateState('1.2.0', info)).toBe('available');
      expect(getUpdateState('1.3.0', info)).toBe('ok');
    });

    it('public/app-version.json ist gültig; Store-Adressen sind noch leer', () => {
      const info = parseAppVersionInfo(JSON.parse(read('public/app-version.json')));
      expect(info).not.toBeNull();
      expect(info!.stores).toEqual({ ios: null, android: null });
      expect(parseAppVersionInfo({ minVersion: 1 })).toBeNull();
    });

    it('«Bitte aktualisieren» mit Knopf zum Store', () => {
      render(<UpdateRequiredScreen storeUrl="https://play.google.com/store/apps/details?id=ch.bouldermate.app" />);
      expect(screen.getByTestId('app-update-required')).toHaveTextContent('Bitte aktualisieren');
      expect(screen.getByTestId('app-update-store-btn')).toHaveTextContent('Zum Store');
    });
  });

  describe('Android-Zurück und Systemschrift (§4.4, AC-6)', () => {
    it('erst Ebene schließen, dann Ansicht, auf der Startansicht zweimal drücken', () => {
      expect(decideBackAction({ layers: 1, canGoBack: false, lastPressAt: null, now: 0 })).toBe('close-layer');
      expect(decideBackAction({ layers: 0, canGoBack: true, lastPressAt: null, now: 0 })).toBe('history-back');
      expect(decideBackAction({ layers: 0, canGoBack: false, lastPressAt: null, now: 1000 })).toBe('confirm-exit');
      expect(decideBackAction({ layers: 0, canGoBack: false, lastPressAt: 1000, now: 1000 + EXIT_PRESS_WINDOW_MS })).toBe('exit');
      expect(decideBackAction({ layers: 0, canGoBack: false, lastPressAt: 1000, now: 1001 + EXIT_PRESS_WINDOW_MS })).toBe('confirm-exit');
    });

    it('Systemschrift wird übernommen, höchstens 200 %, nie kleiner als normal', () => {
      expect(clampTextZoom(1.3)).toBe(1.3);
      expect(clampTextZoom(3.1)).toBe(2);
      expect(clampTextZoom(0.8)).toBe(1);
      expect(clampTextZoom(NaN)).toBe(1);
    });

    it('Zoom mit zwei Fingern ist nicht mehr gesperrt', () => {
      const html = read('index.html');
      expect(html).not.toMatch(/user-scalable=no/);
      expect(html).not.toMatch(/maximum-scale=1/);
      expect(read('capacitor.config.ts')).toMatch(/zoomEnabled: true/);
    });
  });

  describe('Wandfotos offline (§4.1, AC-2) und Kamera (§4.5, AC-9)', () => {
    it('nur echte Netz-Fotos werden gespeichert; Dateinamen sind stabil', () => {
      expect(isCacheableUrl('https://x.supabase.co/storage/v1/object/public/sector-photos/walls/a.jpg')).toBe(true);
      expect(isCacheableUrl('/images/walls/slab.jpg')).toBe(false);
      expect(isCacheableUrl('data:image/jpeg;base64,xx')).toBe(false);
      expect(photoFileName('https://a/b.jpg')).toBe(photoFileName('https://a/b.jpg'));
      expect(photoFileName('https://a/b.jpg')).not.toBe(photoFileName('https://a/c.jpg'));
    });

    it('im Web immer die Original-Adresse, in der App die gespeicherte Datei', () => {
      const url = 'https://x/walls/a.jpg';
      localStorage.setItem(
        PHOTO_CACHE_KEY,
        JSON.stringify({ gymId: GYM, entries: { [url]: { file: 'a.jpg', uri: 'file:///data/wall-photos/a.jpg', bytes: 3 * 1024 * 1024 } } })
      );
      expect(cachedPhotoSrc(url)).toBe(url);
      setPlatformOverride('android');
      resetPhotoCacheMemory();
      expect(cachedPhotoSrc(url)).not.toBe(url);
      expect(cachedPhotoSrc('https://x/anderes.jpg')).toBe('https://x/anderes.jpg');
      expect(formatMegabytes(photoCacheBytes())).toBe('3 MB');
    });

    it('Wandfoto: lange Seite 2400 px, Qualität 85 %', () => {
      expect(WALL_PHOTO_MAX_PX).toBe(2400);
      expect(WALL_PHOTO_QUALITY).toBe(85);
    });
  });

  describe('Einstellungen in der App (§4.7)', () => {
    const update: AppUpdateStatus = {
      state: 'available',
      installed: { version: '1.0.0', build: '12' },
      info: { minVersion: '1.0.0', latestVersion: '1.1.0', stores: { ios: null, android: 'https://play.google.com/x' } },
      storeUrl: 'https://play.google.com/x',
    };

    it('nur in der App sichtbar: Version, neue Version, Wandfotos offline', () => {
      const { unmount } = render(<AppSettingsGroup update={update} />);
      expect(screen.queryByTestId('app-version-row')).toBeNull();
      unmount();
      setPlatformOverride('android');
      render(<AppSettingsGroup update={update} />);
      expect(screen.getByTestId('app-version-row')).toHaveTextContent('1.0.0 (Build 12)');
      expect(screen.getByTestId('app-update-available')).toHaveTextContent('Neue Version im Store');
      expect(screen.getByTestId('app-photo-cache')).toHaveTextContent('Wandfotos offline: 0 MB');
    });
  });

  describe('Konto löschen (§6, AC-12)', () => {
    it('erst nach Eintippen von LÖSCHEN (Groß/klein egal)', () => {
      expect(DELETE_CONFIRM_WORD).toBe('LÖSCHEN');
      expect(isDeleteConfirmed('löschen')).toBe(true);
      expect(isDeleteConfirmed(' LÖSCHEN ')).toBe(true);
      expect(isDeleteConfirmed('loeschen')).toBe(false);
      expect(isDeleteConfirmed('')).toBe(false);
    });

    it('Sheet: Knopf gesperrt, bis bestätigt; löscht und meldet ab', async () => {
      const onDeleted = vi.fn();
      render(<DeleteAccountSheet open userId={climber.id} onClose={() => {}} onDeleted={onDeleted} />);
      const confirm = screen.getByTestId('delete-account-confirm');
      expect(confirm).toBeDisabled();
      fireEvent.change(screen.getByTestId('delete-account-input'), { target: { value: 'LÖSCHEN' } });
      expect(confirm).not.toBeDisabled();
      await act(async () => {
        fireEvent.click(confirm);
      });
      await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    });

    it('App erklärt den Unterschied «App löschen» / «Konto löschen»', () => {
      setPlatformOverride('ios');
      render(<DeleteAccountSheet open userId={climber.id} onClose={() => {}} onDeleted={() => {}} />);
      expect(screen.getByTestId('app-delete-account')).toHaveTextContent('App löschen:');
      expect(screen.getByTestId('app-delete-account')).toHaveTextContent('auch auf dem Server');
    });

    it('«Ich» → Einstellungen → Konto löschen öffnet das Sheet statt eines Browser-Dialogs', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');
      render(<MeView currentUser={climber} activeGymId={GYM} roleInfo={roleInfo} onSwitchMode={() => {}} onLogout={() => {}} />);
      fireEvent.click(screen.getByTestId('open-settings-btn'));
      fireEvent.click(screen.getByTestId('settings-delete-account'));
      expect(screen.getByTestId('app-delete-account')).toBeInTheDocument();
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('Migration löscht nur das eigene Konto (auth.uid) und behält Hallen und Boulder', () => {
      const sql = read('supabase/migrations/20261020_spec045_konto_loeschen.sql');
      expect(sql).toMatch(/SECURITY DEFINER/);
      expect(sql).toMatch(/auth\.uid\(\)/);
      expect(sql).toMatch(/DELETE FROM auth\.users WHERE id = me/);
      expect(sql).toMatch(/UPDATE public\.boulders\s+SET setter_id\s+= NULL/);
      expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.delete_my_account\(\) FROM PUBLIC, anon/);
    });
  });

  describe('Webseite (§5, AC-14)', () => {
    it('kein Hinweis «Auch als App», solange es keinen Store-Eintrag gibt', async () => {
      vi.stubGlobal('navigator', { ...navigator, userAgent: ANDROID_UA });
      mockVersionFetch({ minVersion: '1.0.0', latestVersion: '1.0.0', stores: { ios: null, android: null } });
      render(<WebAppHint />);
      await act(async () => {});
      expect(screen.queryByTestId('web-app-hint')).toBeNull();
    });

    it('Hinweis auf Android mit Store-Eintrag; Schließen bleibt gemerkt', async () => {
      vi.stubGlobal('navigator', { ...navigator, userAgent: ANDROID_UA });
      mockVersionFetch({ minVersion: '1.0.0', latestVersion: '1.0.0', stores: { ios: null, android: 'https://play.google.com/x' } });
      const { unmount } = render(<WebAppHint />);
      const hint = await screen.findByTestId('web-app-hint');
      expect(hint).toHaveTextContent('Deine Daten sind dieselben');
      fireEvent.click(screen.getByTestId('web-app-hint-close'));
      expect(screen.queryByTestId('web-app-hint')).toBeNull();
      expect(localStorage.getItem(WEB_APP_HINT_KEY)).toBe('1');
      unmount();
      render(<WebAppHint />);
      await act(async () => {});
      expect(screen.queryByTestId('web-app-hint')).toBeNull();
    });

    it('Store-Knöpfe nur mit Adresse', async () => {
      mockVersionFetch({ minVersion: '1.0.0', latestVersion: '1.0.0', stores: { ios: 'https://apps.apple.com/x', android: null } });
      render(<StoreLinks />);
      expect(await screen.findByTestId('store-link-ios')).toHaveAttribute('href', 'https://apps.apple.com/x');
      expect(screen.queryByTestId('store-link-android')).toBeNull();
    });

    it('.well-known-Dateien sind gültiges JSON für ch.bouldermate.app', () => {
      const aasa = JSON.parse(read('public/.well-known/apple-app-site-association'));
      expect(aasa.applinks.details[0].appIDs[0]).toMatch(/\.ch\.bouldermate\.app$/);
      const links = JSON.parse(read('public/.well-known/assetlinks.json'));
      expect(links[0].target.package_name).toBe('ch.bouldermate.app');
      const vercel = JSON.parse(read('vercel.json'));
      expect(JSON.stringify(vercel)).toContain('apple-app-site-association');
    });
  });

  describe('App-Hülle (§8)', () => {
    it('Capacitor: Kennung, gebündelter Inhalt, Startbild bis die Wand steht', () => {
      const cfg = read('capacitor.config.ts');
      expect(cfg).toMatch(/appId: 'ch\.bouldermate\.app'/);
      expect(cfg).toMatch(/webDir: 'dist'/);
      expect(cfg).toMatch(/launchAutoHide: false/);
      expect(cfg).not.toMatch(/server:\s*\{[^}]*url/);
    });

    it('Android: App Links mit Prüfung, Hochformat, Kamera erst bei Bedarf', () => {
      const m = read('android/app/src/main/AndroidManifest.xml');
      expect(m).toMatch(/android:autoVerify="true"/);
      expect(m).toMatch(/android:host="bouldermate\.ch"/);
      expect(m).toMatch(/android:screenOrientation="portrait"/);
      expect(m).toMatch(/android\.permission\.CAMERA/);
      expect(read('android/variables.gradle')).toMatch(/minSdkVersion = 24/);
    });

    it('iPhone: Universal Links, nur iPhone, Hochformat, Erlaubnis-Texte DE/EN', () => {
      expect(read('ios/App/App/App.entitlements')).toMatch(/applinks:bouldermate\.ch/);
      const pbx = read('ios/App/App.xcodeproj/project.pbxproj');
      expect(pbx).toMatch(/TARGETED_DEVICE_FAMILY = 1;/);
      expect(pbx).toMatch(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/);
      const plist = read('ios/App/App/Info.plist');
      expect(plist).toMatch(/NSCameraUsageDescription<\/key>\s*<string>Für Fotos von der Wand[^<]*To take photos/);
      expect(plist).not.toMatch(/UIInterfaceOrientationLandscapeLeft<\/string>\s*<\/array>\s*<!-- SPEC-045/);
    });

    it('kein Tracking: keine Analyse- oder Absturzdienste im Code (§6)', () => {
      const pkg = JSON.parse(read('package.json'));
      const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ');
      expect(deps).not.toMatch(/firebase|sentry|analytics|mixpanel|amplitude|posthog|crashlytics/i);
    });
  });
});
