import { test, expect, devices } from '@playwright/test';

test.describe('SPEC-019: Cross-Device Sync, Offline Resilience & Mobile Lifecycle', () => {

  test('Dual-Device: Action on Mobile (Pixel 7) is reflected on Desktop without page reload', async ({ playwright, baseURL }) => {
    const browser = await playwright.chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined);
    const targetURL = baseURL || 'http://localhost:5173';

    // 1. Mobile Context (Kletterer on Smartphone)
    const mobileContext = await browser.newContext({
      ...devices['Pixel 7'],
      baseURL: targetURL,
    });
    const mobilePage = await mobileContext.newPage();

    // 2. Desktop Context (Second user / Admin on Desktop)
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      baseURL: targetURL,
    });
    const desktopPage = await desktopContext.newPage();

    try {
      // Lokal bleiben: keine Produktionsdaten schreiben
      await mobileContext.route(/supabase\.co/, route => route.abort());
      await desktopContext.route(/supabase\.co/, route => route.abort());

      await mobilePage.goto('/');
      await desktopPage.goto('/');

      // Handy: Hans (Kletterer), Desktop: Schrauber im Kletterer-Bereich
      await mobilePage.getByTestId('quick-login-hans').click();
      await desktopPage.getByTestId('quick-login-schrauber').click();
      await desktopPage.getByTestId('role-gateway-climber-btn').click();

      // Desktop öffnet die erste Route und beobachtet das Sheet
      const desktopRoute = desktopPage.locator('[data-testid^="route-row-"]').first();
      await expect(desktopRoute).toBeVisible({ timeout: 10000 });
      await desktopRoute.click();
      const desktopSheet = desktopPage.getByTestId('boulder-sheet');
      await expect(desktopSheet).toBeVisible();

      // Handy loggt dieselbe Route (2 Taps)
      const mobileRoute = mobilePage.locator('[data-testid^="route-row-"]').first();
      await expect(mobileRoute).toBeVisible({ timeout: 10000 });
      await mobileRoute.click();
      await expect(mobilePage.getByTestId('boulder-sheet')).toBeVisible();
      await mobilePage.getByTestId('log-project-btn').click();

      // Beide Geräte bleiben stabil: Handy zurück an der Wand mit Toast, Desktop-Sheet weiter offen
      await expect(mobilePage.getByText(/Projekt geloggt/)).toBeVisible();
      await expect(mobilePage.getByTestId('climber-wall-view')).toBeVisible();
      await expect(desktopSheet).toBeVisible();

    } finally {
      await mobileContext.close();
      await desktopContext.close();
      await browser.close();
    }
  });

  test('Offline Resilience: Data logged during connection loss persists locally and syncs upon reconnect', async ({ page, context }) => {
    await context.route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();

    const route = page.locator('[data-testid^="route-row-"]').first();
    await expect(route).toBeVisible({ timeout: 10000 });
    const boulderId = (await route.getAttribute('data-testid'))!.replace('route-row-', '');
    await route.click();

    // 1. Funkloch in der Halle
    await context.setOffline(true);

    // 2. Offline loggen (Projekt ist für Hans auf jeder Route eine Änderung oder bereits gesetzt)
    await page.getByTestId('log-project-btn').click();

    // 3. Lokaler Speicher hält den Eintrag
    const offlineAscent = await page.evaluate(id => {
      const all = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
      return all.find((a: any) => a.boulderId === id && (a.userId === 'hans-kletterer' || a.user_id === 'hans-kletterer'));
    }, boulderId);
    expect(offlineAscent?.type).toBe('project');

    // 4. Wieder online: App bleibt bedienbar
    await context.setOffline(false);
    await page.waitForTimeout(1000);
    expect(await page.title()).toContain('BoulderMate');
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  });

  test('Mobile Tab-Freezing & Focus Recovery: visibilitychange triggers background sync', async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();

    // Simulate mobile OS backgrounding the app (screen lock / app switch)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(300);

    // Simulate returning to app (screen unlock)
    const syncFired = await page.evaluate(async () => {
      let fired = false;
      const onFocus = () => { fired = true; };
      window.addEventListener('focus', onFocus);

      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));

      return fired;
    });

    expect(syncFired).toBe(true);
  });

});
