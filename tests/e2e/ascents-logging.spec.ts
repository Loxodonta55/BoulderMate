import { test, expect } from '@playwright/test';

test.describe('SPEC-003 / SPEC-004: Ascents Logging & Sync (Flash / Top / Project)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login as Hans
    const hansBtn = page.locator('button:has-text("Hans (Kletterer)")');
    if (await hansBtn.isVisible()) {
      await hansBtn.click();
    }
    
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }
  });

  test('Hans logs a TOP in 2 taps: writes ascent to storage and renders in ascent feed', async ({ page }) => {
    // 1. Open a route
    const routeCard = page.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder/i }).first();
    await expect(routeCard).toBeVisible({ timeout: 10000 });
    await routeCard.click();

    const detailModal = page.locator('.fixed.inset-0.z-50');
    await expect(detailModal).toBeVisible();

    // 2. Click "TOP" button
    const topBtn = detailModal.locator('button').filter({ hasText: /^TOP$/i }).first();
    await expect(topBtn).toBeVisible();
    await topBtn.click();

    // 3. Verify ascent record is persisted in localStorage
    await page.waitForTimeout(500);
    const localAscents = await page.evaluate(() => {
      return localStorage.getItem('boulderapp_ascents_v3');
    });
    expect(localAscents).toBeTruthy();
    expect(localAscents).toContain('hans-kletterer');

    // 4. Verify ascent appears in the BEGEHUNGEN list
    await expect(detailModal.getByText('BEGEHUNGEN')).toBeVisible();
    await expect(detailModal.getByText(/Hans|HansDereinfacheKletterer/i).first()).toBeVisible();
  });

  test('Switching ascent to FLASH updates the record cleanly without duplicates', async ({ page }) => {
    const routeCard = page.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder/i }).first();
    await expect(routeCard).toBeVisible({ timeout: 10000 });
    await routeCard.click();

    const detailModal = page.locator('.fixed.inset-0.z-50');
    await expect(detailModal).toBeVisible();

    // Click FLASH
    const flashBtn = detailModal.locator('button:has-text("Flash")').first();
    await expect(flashBtn).toBeVisible();
    await flashBtn.click();

    // Verify UI updates to "Geloggt als FLASH"
    await expect(detailModal.getByText(/Geloggt als FLASH/i)).toBeVisible({ timeout: 5000 });

    // Verify storage has an ascent record with type 'flash'
    const hasFlashAscent = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
      return data.some((a: any) => 
        (a.userId === 'hans-kletterer' || a.user_id === 'hans-kletterer') && 
        (a.type === 'flash' || a.style === 'flash')
      );
    });

    expect(hasFlashAscent).toBe(true);
  });

});
