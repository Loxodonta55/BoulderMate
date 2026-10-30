import { test, expect, Page } from '@playwright/test';
import { loginHans, openSettings, openFirstOpenBoulder, blockSupabase } from './_basis';

/**
 * SPEC-045: BoulderMate als App.
 * Die echte Hülle (Capacitor) läuft nur auf dem Handy; hier wird sie simuliert
 * (window.__BM_PLATFORM__). Was nur das Gerät kann, steht in docs/app/geraete-checkliste.md.
 */

const VERSION_URL = 'https://bouldermate.ch/app-version.json';

async function simulateApp(page: Page, opts: { version: string; min: string; latest: string; android?: string | null }) {
  await page.addInitScript(v => {
    (window as any).__BM_PLATFORM__ = 'android';
    (window as any).__BM_APP_INFO__ = { version: v, build: '7' };
  }, opts.version);
  await page.context().route(VERSION_URL, route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        minVersion: opts.min,
        latestVersion: opts.latest,
        stores: { ios: null, android: opts.android ?? 'https://play.google.com/store/apps/details?id=ch.bouldermate.app' },
      }),
    })
  );
}

test.describe('SPEC-045: BoulderMate als App', () => {
  test('Web bleibt wie es war: kein Scanner, kein App-Hinweis, keine Store-Knöpfe (AC-1, AC-14)', async ({ page }) => {
    await loginHans(page);
    await expect(page.getByTestId('app-scan')).toHaveCount(0);
    await expect(page.getByTestId('web-app-hint')).toHaveCount(0);
    await page.goto('/');
    await expect(page.getByTestId('store-links')).toHaveCount(0);
  });

  test('Webseite liefert .well-known-Dateien und app-version.json (AC-14)', async ({ page }) => {
    for (const p of ['/.well-known/assetlinks.json', '/.well-known/apple-app-site-association', '/app-version.json']) {
      const res = await page.request.get(p);
      expect(res.ok(), p).toBe(true);
      const body = await res.text();
      expect(() => JSON.parse(body), p).not.toThrow();
    }
  });

  test('Keine Anfragen an fremde Dienste (Schrift liegt bei uns) (AC-13)', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', r => {
      const host = new URL(r.url()).hostname;
      if (!/localhost|127\.0\.0\.1|supabase\.co|bouldermate\.ch|tile\.openstreetmap\.org|images\.unsplash\.com/.test(host)) {
        foreign.push(host);
      }
    });
    await loginHans(page);
    expect(foreign).toEqual([]);
  });

  test('App: Scanner in der Kopfzeile, Punkt am Zahnrad, Einstellungen «App» (§4.6, §4.7)', async ({ page, isMobile }) => {
    await simulateApp(page, { version: '1.0.0', min: '1.0.0', latest: '1.1.0' });
    await loginHans(page);
    await expect(page.getByTestId('app-scan')).toBeVisible();
    await openSettings(page, isMobile);
    await expect(page.getByTestId('app-version-row')).toContainText('1.0.0 (Build 7)');
    await expect(page.getByTestId('app-update-available')).toBeVisible();
    await expect(page.getByTestId('app-photo-cache')).toContainText('Wandfotos offline');
    await page.getByTestId('settings-back').click();
    await expect(page.getByTestId('app-update-dot')).toBeVisible();
  });

  test('App: zu alte Version sperrt mit «Bitte aktualisieren» (AC-11)', async ({ page }) => {
    await simulateApp(page, { version: '0.9.0', min: '1.0.0', latest: '1.0.0' });
    await blockSupabase(page);
    await page.goto('/');
    await expect(page.getByTestId('app-update-required')).toBeVisible();
    await expect(page.getByTestId('app-update-store-btn')).toBeVisible();
  });

  test('App: Startseite sagt, dass das Konto von bouldermate.ch gilt (§4.3)', async ({ page }) => {
    await simulateApp(page, { version: '1.0.0', min: '1.0.0', latest: '1.0.0' });
    await blockSupabase(page);
    await page.goto('/');
    await expect(page.getByTestId('app-account-notice')).toBeVisible();
  });

  test('Konto löschen erst nach «LÖSCHEN», danach abgemeldet (AC-12)', async ({ page, isMobile }) => {
    await loginHans(page);
    await openSettings(page, isMobile);
    await page.getByTestId('settings-delete-account').click();
    await expect(page.getByTestId('delete-account-confirm')).toBeDisabled();
    await page.getByTestId('delete-account-input').fill('löschen');
    await page.getByTestId('delete-account-confirm').click();
    await expect(page.getByTestId('hero-login-btn')).toBeVisible();
  });

  test('Boulder teilen: Knopf im Boulder-Sheet (§4.5)', async ({ page }) => {
    await loginHans(page);
    await openFirstOpenBoulder(page);
    await expect(page.getByTestId('boulder-sheet-share')).toBeVisible();
    await expect(page.getByTestId('boulder-sheet-share')).toHaveAttribute('aria-label', 'Boulder teilen');
  });

  test('Handy-Browser: «Auch als App», sobald es den Store-Eintrag gibt; Schließen bleibt (AC-14)', async ({ page, isMobile, browserName }) => {
    test.skip(!isMobile, 'nur auf Handys');
    const ios = browserName === 'webkit';
    await page.context().route('**/app-version.json', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          minVersion: '1.0.0',
          latestVersion: '1.0.0',
          stores: ios ? { ios: 'https://apps.apple.com/app/id1', android: null } : { ios: null, android: 'https://play.google.com/x' },
        }),
      })
    );
    await loginHans(page);
    await expect(page.getByTestId('web-app-hint')).toBeVisible();
    await page.getByTestId('web-app-hint-close').click();
    await expect(page.getByTestId('web-app-hint')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('web-app-hint')).toHaveCount(0);
  });

  test('Große Schrift (200 %): Startseite, Wand und Einstellungen ohne Querscrollen (AC-7)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Handy-Ansicht');
    const size = page.viewportSize()!;
    // 200 % Zoom = halb so viele CSS-Pixel
    await page.setViewportSize({ width: Math.round(size.width / 2), height: Math.round(size.height / 2) });
    const noSideScroll = async (where: string) => {
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, where).toBeLessThanOrEqual(1);
    };
    await blockSupabase(page);
    await page.goto('/');
    await expect(page.getByTestId('hero-login-btn')).toBeVisible();
    await noSideScroll('Startseite');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await noSideScroll('Wand');
    await openSettings(page, isMobile);
    await noSideScroll('Einstellungen');
  });
});
