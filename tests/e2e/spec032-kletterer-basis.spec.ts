import { test, expect } from '@playwright/test';
import { loginHans, openFirstOpenBoulder } from './_basis';

/** SPEC-032: Nummer, erste Schritte, Beta-Spoilerschutz, Offline-Chip, Icon. */
test.describe('SPEC-032: Kletterer-Basis', () => {
  test('Erste Schritte einmal, Nummer im Sheet, Beta erst auf Tippen', async ({ page }) => {
    await loginHans(page);
    await openFirstOpenBoulder(page);
    await expect(page.getByTestId('boulder-sheet-number')).toHaveText(/\d+/);
    await expect(page.getByTestId('first-steps-card')).toBeVisible();
    await page.getByTestId('first-steps-ok').click();
    await expect(page.getByTestId('first-steps-card')).toHaveCount(0);

    await page.getByTestId('boulder-sheet-more').click();
    await expect(page.getByTestId('beta-toggle')).toBeVisible();
    await expect(page.getByTestId('boulder-comment-input')).toHaveCount(0);
    await page.getByTestId('beta-toggle').click();
    await expect(page.getByTestId('boulder-comment-input')).toBeVisible();

    await page.getByTestId('boulder-sheet-close').click();
    await openFirstOpenBoulder(page);
    await expect(page.getByTestId('first-steps-card')).toHaveCount(0);
  });

  test('Offline: Ticken klappt, Chip zeigt den Stand', async ({ page, context }) => {
    await loginHans(page);
    await context.setOffline(true);
    await openFirstOpenBoulder(page);
    await page.getByTestId('log-top-btn').click();
    await expect(page.getByTestId('boulder-sheet')).toHaveCount(0);
    await expect(page.getByTestId('offline-chip')).toBeVisible();
    await context.setOffline(false);
  });

  test('App-Icon und Manifest sind vorhanden', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const manifest = await (await page.request.get(href!)).json();
    expect(manifest.icons.length).toBeGreaterThan(0);
    const icon = await page.request.get(manifest.icons[0].src);
    expect(icon.ok()).toBe(true);
  });
});
