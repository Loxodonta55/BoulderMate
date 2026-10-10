import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-030: Hallen-Auswertung (Admin-Tab «Zahlen») und «Geschraubt von» im Schrauber-Studio.
 * Läuft rein lokal: Supabase ist blockiert.
 */

async function openAdminInsights(page: Page) {
  await page.getByTestId('admin-gym-button').click();
  await page.getByTestId('admin-gym-row-gym-6a-plus').click();
  await page.getByTestId('admin-tab-insights').click();
  await expect(page.getByTestId('gym-insights')).toBeVisible();
}

test.describe('SPEC-030: Hallen-Auswertung', () => {
  test('Tab «Zahlen» zeigt Kacheln, Farben, Sektoren und Schrauber', async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-boris').click();
    await page.getByTestId('role-gateway-admin-btn').click();
    await openAdminInsights(page);

    await expect(page.getByTestId('insights-kpi-boulders')).toContainText('Boulder');
    await expect(page.getByTestId('insights-grades').locator('[data-testid^="insights-grade-"][data-testid$="-count"]').first()).toBeVisible();
    await expect(page.getByTestId('insights-sectors').locator('li').first()).toBeVisible();
    await expect(page.getByTestId('insights-setters')).toBeVisible();

    const activeCount = Number(await page.getByTestId('insights-kpi-boulders-value').textContent());
    await page.getByTestId('insights-scope-all').click();
    await expect(page.getByTestId('insights-scope-all')).toHaveAttribute('aria-pressed', 'true');
    expect(Number(await page.getByTestId('insights-kpi-boulders-value').textContent())).toBeGreaterThanOrEqual(activeCount);
  });

  test('«Geschraubt von» umstellen → Route zählt beim gewählten Schrauber', async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-boris').click();
    await page.getByTestId('role-gateway-admin-btn').click();
    await openAdminInsights(page);
    const setterRoutes = page.getByTestId('insights-setter-schrauber-6aplus-routes');
    const before = (await setterRoutes.count()) > 0 ? parseInt((await setterRoutes.textContent())!, 10) : 0;

    // Schrauber-Studio: neuen Pin setzen, Schrauber wählen, veröffentlichen
    await page.getByTestId('admin-switch-workspace-btn').click();
    await page.getByTestId('role-gateway-setter-btn').click();
    await expect(page.getByTestId('start-rebuild-btn')).toBeVisible();
    const photo = page.locator('img[alt="Überhang Vorne"]').first();
    const box = await photo.boundingBox();
    if (!box) throw new Error('Wandfoto nicht gefunden');
    await page.mouse.click(box.x + box.width * 0.12, box.y + box.height * 0.18);
    await page.getByTestId('setter-select').selectOption('schrauber-6aplus');
    await page.getByTestId('save-boulder-sheet-btn').click();
    await page.getByTestId('publish-batch-btn').click();
    await page.getByRole('button', { name: /Jetzt veröffentlichen|Veröffentlichen & Speichern/ }).click();

    // Zurück in die Admin-Konsole
    await page.getByTestId('studio-back-to-climber-btn').click();
    await page.getByTestId('climber-switch-workspace-btn').click();
    await page.getByTestId('role-gateway-admin-btn').click();
    await openAdminInsights(page);
    await expect(page.getByTestId('insights-setter-schrauber-6aplus-routes')).toHaveText(`${before + 1} Routen`);
  });
});
