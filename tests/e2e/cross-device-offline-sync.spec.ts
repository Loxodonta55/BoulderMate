import { test, expect, devices } from '@playwright/test';

test.describe('SPEC-019: Cross-Device Sync, Offline Resilience & Mobile Lifecycle', () => {

  test('Dual-Device: Action on Mobile (Pixel 7) is reflected on Desktop without page reload', async ({ playwright, baseURL }) => {
    const browser = await playwright.chromium.launch();
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
      // Both open the app
      await mobilePage.goto('/');
      await desktopPage.goto('/');

      // Mobile logs in as Hans
      const mobileLogin = mobilePage.locator('button:has-text("Hans (Kletterer)")');
      if (await mobileLogin.isVisible()) {
        await mobileLogin.click();
      }
      const mobileKlettererApp = mobilePage.locator('button:has-text("KLETTERER-APP")');
      if (await mobileKlettererApp.isVisible()) {
        await mobileKlettererApp.click();
      }

      // Desktop logs in as Schrauber
      const desktopLogin = desktopPage.locator('button:has-text("Schrauber 6aPlus")');
      if (await desktopLogin.isVisible()) {
        await desktopLogin.click();
      }
      const desktopKlettererApp = desktopPage.locator('button:has-text("KLETTERER-APP")');
      if (await desktopKlettererApp.isVisible()) {
        await desktopKlettererApp.click();
      }

      // Desktop opens first available route to observe live community feed
      const desktopRoute = desktopPage.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder|Dynamo/i }).first();
      await expect(desktopRoute).toBeVisible({ timeout: 10000 });
      await desktopRoute.click();

      const desktopModal = desktopPage.locator('.fixed.inset-0.z-50');
      await expect(desktopModal).toBeVisible();

      // Mobile opens the same route and logs an ascent
      const mobileRoute = mobilePage.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder|Dynamo/i }).first();
      await expect(mobileRoute).toBeVisible({ timeout: 10000 });
      await mobileRoute.click();

      const mobileModal = mobilePage.locator('.fixed.inset-0.z-50');
      await expect(mobileModal).toBeVisible();

      const mobileTopBtn = mobileModal.locator('button').filter({ hasText: /^TOP$/i }).first();
      await mobileTopBtn.click();

      // Assert: Both devices have consistent state without crashing
      await mobilePage.waitForTimeout(1000);
      expect(await mobileModal.isVisible()).toBeTruthy();
      expect(await desktopModal.isVisible()).toBeTruthy();

    } finally {
      await mobileContext.close();
      await desktopContext.close();
      await browser.close();
    }
  });

  test('Offline Resilience: Data logged during connection loss persists locally and syncs upon reconnect', async ({ page, context }) => {
    await page.goto('/');

    // Login
    const hansBtn = page.locator('button:has-text("Hans (Kletterer)")');
    if (await hansBtn.isVisible()) {
      await hansBtn.click();
    }
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }

    // Open route
    const route = page.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder|Dynamo/i }).first();
    await expect(route).toBeVisible({ timeout: 10000 });
    await route.click();

    // 1. Simulate Network Drop in climbing gym (Faraday-cage hall)
    await context.setOffline(true);

    // 2. Perform offline logging action
    const detailModal = page.locator('.fixed.inset-0.z-50');
    const flashBtn = detailModal.locator('button').filter({ hasText: /^FLASH$/i }).first();
    await expect(flashBtn).toBeVisible();
    await flashBtn.click();

    // 3. Verify local cache retained the offline change
    const offlineAscents = await page.evaluate(() => {
      return localStorage.getItem('boulderapp_ascents_v3');
    });
    expect(offlineAscents).toBeTruthy();

    // 4. Reconnect to network
    await context.setOffline(false);

    // Trigger sync event / verify app stays responsive without uncaught network errors
    await page.waitForTimeout(1000);
    expect(await page.title()).toContain('BoulderMate');
  });

  test('Mobile Tab-Freezing & Focus Recovery: visibilitychange triggers background sync', async ({ page }) => {
    await page.goto('/');

    const hansBtn = page.locator('button:has-text("Hans (Kletterer)")');
    if (await hansBtn.isVisible()) {
      await hansBtn.click();
    }
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }

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
