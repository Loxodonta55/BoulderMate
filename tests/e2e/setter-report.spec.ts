import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-050: Schrauber-Auswertung für die Hallenleitung (Admin-Tab «Zahlen» → «Schrauber»).
 * Läuft rein lokal: Supabase ist blockiert.
 */

async function openSetterReport(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  await page.getByTestId('role-gateway-admin-btn').click();
  await page.getByTestId('admin-gym-button').click();
  await page.getByTestId('admin-gym-row-gym-6a-plus').click();
  await page.getByTestId('admin-tab-insights').click();
  await expect(page.getByTestId('gym-insights')).toBeVisible();
  await page.getByTestId('insights-mode-setters').click();
  await expect(page.getByTestId('setter-report')).toBeVisible();
}

test.describe('SPEC-050: Schrauber-Auswertung', () => {
  test('Übersicht: Hinweis, Karten, Sortierung; Halle zeigt keine Schrauber', async ({ page }) => {
    await openSetterReport(page);
    await expect(page.getByTestId('setter-report-note')).toContainText('Gesprächsanlass');
    const cards = page.getByTestId('insights-setters').locator('button[data-testid^="insights-setter-"]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.getByTestId('setter-report-sort-routes')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('setter-report-sort-stars').click();
    await expect(page.getByTestId('setter-report-sort-stars')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('setter-report')).not.toContainText('Platz');

    // Tap-Flächen ≥ 48 px (SPEC-032)
    const box = await page.getByTestId('setter-report-sort-grade').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);

    await page.getByTestId('insights-mode-hall').click();
    await expect(page.getByTestId('insights-grades')).toBeVisible();
    await expect(page.getByTestId('insights-setters')).toHaveCount(0);
  });

  test('Detail: Kacheln, Pro Farbe, Route aufklappen, zurück', async ({ page }) => {
    await openSetterReport(page);
    await page.getByTestId('insights-setters').locator('button[data-testid^="insights-setter-"]').first().click();
    await expect(page.getByTestId('setter-report-detail')).toBeVisible();
    for (const k of ['stars', 'grade', 'firsttry', 'weekly']) {
      await expect(page.getByTestId(`setter-detail-kpi-${k}`)).toBeVisible();
    }
    await expect(page.getByTestId('setter-detail-colors').locator('li').first()).toBeVisible();

    const route = page.getByTestId('setter-detail-routes').locator('button[data-testid^="setter-detail-route-"]').first();
    const routeId = (await route.getAttribute('data-testid'))!;
    await route.click();
    await expect(page.getByTestId(`${routeId}-more`)).toContainText('im 1. Versuch');

    await page.getByTestId('setter-report-back').click();
    await expect(page.getByTestId('setter-report')).toBeVisible();
  });
});
