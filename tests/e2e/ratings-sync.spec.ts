import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-003 / SPEC-019 / SPEC-022: Bewertung im Boulder-Sheet und Sichtbarkeit für andere Nutzer.
 * Läuft rein lokal: Supabase wird blockiert, damit keine Testdaten in der Produktion landen.
 * «Andere Nutzer» = zweite Anmeldung im selben Browser (gemeinsamer lokaler Speicher).
 */

async function openFirstRoute(page: Page) {
  const row = page.locator('[data-testid^="route-row-"]').first();
  await expect(row).toBeVisible({ timeout: 10000 });
  const id = (await row.getAttribute('data-testid'))!;
  await row.click();
  await expect(page.getByTestId('boulder-sheet')).toBeVisible();
  return id;
}

async function rateFair4(page: Page) {
  await page.getByTestId('boulder-sheet-more').click();
  await page.getByTestId('open-rating-btn').click();
  await page.getByRole('button', { name: /^Fair/ }).first().click();
  const next = page.getByRole('button', { name: /Weiter/ });
  if (await next.isVisible().catch(() => false)) await next.click();
  await page.getByRole('button', { name: '4 Sterne' }).first().click();
  await page.getByRole('button', { name: /Bewertung speichern/i }).click();
  await expect(page.getByText('Bewertung gespeichert')).toBeVisible();
}

test.describe('SPEC-003 / SPEC-019: Ratings & Review Sync (Data-Writing & Cross-User)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  });

  test('Hans submits a 4-star FAIR rating: writes to storage and shows up under «Wer war schon oben»', async ({ page }) => {
    await openFirstRoute(page);
    await rateFair4(page);

    const localRatings = await page.evaluate(() => localStorage.getItem('boulderapp_ratings_v3'));
    expect(localRatings).toContain('hans-kletterer');

    const row = page.getByTestId('community-rating-row-hans-kletterer');
    await expect(row).toBeVisible();
    await expect(row).toContainText('4');
    await expect(row).toContainText('Fair');
  });

  test('Multi-User Sync: Schrauber6aPlus sees Hans rating in the community list', async ({ page, isMobile }) => {
    const rowId = await openFirstRoute(page);
    await rateFair4(page);
    await page.getByTestId('boulder-sheet-close').click();

    // Abmelden über Ich → Einstellungen, dann als Schrauber anmelden
    await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-logout').click();
    await page.getByTestId('quick-login-schrauber').click();
    await page.getByTestId('role-gateway-climber-btn').click();

    await page.getByTestId(rowId).click();
    await page.getByTestId('boulder-sheet-more').click();
    const row = page.getByTestId('community-rating-row-hans-kletterer');
    await expect(row).toBeVisible();
    await expect(row).toContainText('Fair');
  });
});
