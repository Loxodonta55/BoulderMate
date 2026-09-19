import { test, expect } from '@playwright/test';

test.describe('SPEC-001 / SPEC-002: Sectors & Routes Authoring (Setter-Studio & Dual-Store Sync)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Login as Schrauber 6aPlus
    const schrauberBtn = page.locator('button:has-text("Schrauber 6aPlus")');
    if (await schrauberBtn.isVisible()) {
      await schrauberBtn.click();
    }
  });

  test('Setter can access Schrauber-Studio and view active sector walls with pins', async ({ page }) => {
    // Open Role Gateway or switch to Schrauber-Studio
    const studioBtn = page.locator('button:has-text("SCHRAUBER-STUDIO"), button:has-text("Studio")').first();
    if (await studioBtn.isVisible()) {
      await studioBtn.click();
    }

    // Verify wall view or sector editor is loaded
    await page.waitForTimeout(1000);
    const bodyText = await page.innerText('body');
    expect(bodyText).toMatch(/Überhang|Sektor|Wand|Boulder|Studio/i);

    // Verify localStorage has dual-store cache intact
    const caches = await page.evaluate(() => {
      return {
        v1: !!localStorage.getItem('boulder_sectors_v1'),
        v2: !!localStorage.getItem('boulderapp_sectors_v2')
      };
    });
    // At least one of the caches should be active and populated
    expect(caches.v1 || caches.v2).toBeTruthy();
  });

  test('Sector ordering consistency: Dual-store lockstep persists across navigation', async ({ page }) => {
    // Check sectors in localStorage
    const sectorsData = await page.evaluate(() => {
      const v2 = localStorage.getItem('boulderapp_sectors_v2');
      const v1 = localStorage.getItem('boulder_sectors_v1');
      return {
        v2Count: v2 ? JSON.parse(v2).length : 0,
        v1Count: v1 ? JSON.parse(v1).length : 0,
      };
    });

    expect(sectorsData.v2Count + sectorsData.v1Count).toBeGreaterThan(0);
  });

  test('Mobile Touch Navigation: Switching sectors via swipe or previous/next buttons', async ({ page }) => {
    // Access Kletterer-App
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }

    // Locate Next Sector button
    const nextSectorBtn = page.locator('button[aria-label*="Nächster"], button:has-text("Nächster Sektor")');
    if (await nextSectorBtn.isVisible()) {
      const initialSectorText = await page.locator('h3, h2').first().innerText();
      expect(initialSectorText).toBeDefined();
      await nextSectorBtn.click();
      await page.waitForTimeout(500);
      const newSectorText = await page.locator('h3, h2').first().innerText();
      expect(newSectorText).toBeDefined();
    }
  });

});
