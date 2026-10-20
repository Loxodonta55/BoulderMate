import { test, expect, Page } from '@playwright/test';
import { blockSupabase } from './_basis';

/**
 * SPEC-044: Schrauber-Statistik «Meine Routen» im Schrauber-Studio.
 * Läuft rein lokal: Supabase ist blockiert.
 */

async function openSetterStudio(page: Page) {
  await blockSupabase(page);
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  await page.getByTestId('role-gateway-setter-btn').click();
  await expect(page.getByTestId('setter-mode-walls')).toBeVisible();
}

test.describe('SPEC-044: Meine Routen', () => {
  test('Umschalter, Kacheln mit Vergleich, Liste, Route ohne Namen, «Im Studio öffnen»', async ({ page }) => {
    await openSetterStudio(page);
    await expect(page.getByTestId('setter-mode-walls')).toHaveAttribute('aria-pressed', 'true');

    // Beta von einem Kletterer an einer eigenen Route (Name darf nicht erscheinen)
    const target = await page.evaluate(() => {
      const boulders = JSON.parse(localStorage.getItem('boulderapp_wall_boulders_v2') || '[]');
      const own = boulders.find((b: any) => b.status === 'active' && /1d0e|user-boris/.test(b.setterId || ''));
      const comments = JSON.parse(localStorage.getItem('boulderapp_comments_v3') || '[]');
      comments.push({ id: 'e2e-c1', boulderId: own.id, userId: 'e2e-k', userNickname: 'Erika Geheimname', text: 'Start mit links', createdAt: new Date().toISOString() });
      localStorage.setItem('boulderapp_comments_v3', JSON.stringify(comments));
      return own.id as string;
    });

    await page.getByTestId('setter-mode-stats').click();
    await expect(page.getByTestId('setter-stats')).toBeVisible();
    await expect(page.getByTestId('publish-batch-btn')).toHaveCount(0);
    await expect(page.getByTestId('setter-kpi-routes-value')).not.toHaveText('0');
    await expect(page.getByTestId('setter-kpi-stars-baseline')).toContainText('Andere, gleiche Farben');
    await expect(page.getByTestId('setter-kpi-flash-baseline')).toContainText('Andere, gleiche Farben');
    await expect(page.getByTestId('setter-stats-transparency')).toContainText('Hallenleitung');

    // Sortierung
    await page.getByTestId('setter-stats-sort-least').click();
    await expect(page.getByTestId('setter-stats-sort-least')).toHaveAttribute('aria-pressed', 'true');

    // Route öffnen: Grad-Gefühl, Beta ohne Namen
    await page.getByTestId(`setter-route-${target}`).click();
    const sheet = page.getByTestId('setter-route-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('setter-route-feel')).toBeVisible();
    await expect(sheet.getByTestId('setter-route-comments')).toContainText('Start mit links');
    await expect(page.getByTestId('setter-stats')).not.toContainText('Erika Geheimname');
    await expect(sheet).not.toContainText('Erika Geheimname');

    // «Im Studio öffnen» → zurück bei den Wänden, Boulder-Sheet offen
    await sheet.getByTestId('setter-route-open-studio').click();
    await expect(page.getByTestId('setter-mode-walls')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('save-boulder-sheet-btn')).toBeVisible();
  });

  test('«Alle» zählt abgeschraubte Routen mit; Kletterer sehen den Bereich nicht', async ({ page }) => {
    await openSetterStudio(page);
    await page.getByTestId('setter-mode-stats').click();
    const active = Number(await page.getByTestId('setter-kpi-routes-value').textContent());
    await page.getByTestId('setter-stats-scope-all').click();
    await expect(page.getByTestId('setter-stats-scope-all')).toHaveAttribute('aria-pressed', 'true');
    expect(Number(await page.getByTestId('setter-kpi-routes-value').textContent())).toBeGreaterThanOrEqual(active);

    // Kletterer-Bereich hat keinen Umschalter
    await page.getByTestId('studio-back-to-climber-btn').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('setter-mode-stats')).toHaveCount(0);
  });
});
