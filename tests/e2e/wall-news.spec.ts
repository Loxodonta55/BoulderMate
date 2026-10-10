import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-031: «Neu seit deinem letzten Besuch» und «Umbau ankündigen».
 * Läuft rein lokal: Supabase ist blockiert.
 */

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function openStudioAsSetter(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Schrauber 6aPlus' }).click();
  await page.getByTestId('role-gateway-setter-btn').click();
  await expect(page.getByTestId('start-rebuild-btn')).toBeVisible();
}

test.describe('SPEC-031: Neu an der Wand und Letzte Chance', () => {
  test('neuer Boulder seit dem letzten Besuch → Streifen → «1 neu» in der Sektor-Liste', async ({ page }) => {
    await openStudioAsSetter(page);
    const photo = page.locator('img[alt="Überhang Vorne"]').first();
    const box = await photo.boundingBox();
    if (!box) throw new Error('Wandfoto nicht gefunden');
    await page.mouse.click(box.x + box.width * 0.88, box.y + box.height * 0.2);
    await page.getByTestId('save-boulder-sheet-btn').click();
    await page.getByTestId('publish-batch-btn').click();
    await page.getByRole('button', { name: /Jetzt veröffentlichen|Veröffentlichen & Speichern/ }).click();

    // Letzter Besuch der Halle vor 5 Stunden
    await page.evaluate(() => {
      const t = Date.now() - 5 * 60 * 60 * 1000;
      localStorage.setItem('bouldermate_wall_visits_v1', JSON.stringify({
        'schrauber-6aplus::gym-6a-plus': { lastSeenAt: t, visitStartedAt: t, previousVisitAt: null },
      }));
    });
    await page.reload();
    await page.getByTestId('role-gateway-climber-btn').click();

    await expect(page.getByTestId('wall-news-count')).toHaveText('1 neuer Boulder seit deinem letzten Besuch');
    await page.getByTestId('wall-news-show').click();
    const sheet = page.getByTestId('sector-list-sheet');
    await expect(sheet.locator('[data-testid^="sector-new-count-"]')).toHaveText(['1 neu']);
  });

  test('Schrauber kündigt Umbau an → Kletterer sieht Badge und Satz', async ({ page }) => {
    await openStudioAsSetter(page);
    await page.getByTestId('announce-rebuild-btn').click();
    await page.getByTestId('rebuild-announce-date').fill(inDays(3));
    await page.getByTestId('rebuild-announce-save').click();
    await expect(page.getByTestId('announce-rebuild-btn')).toContainText('Umbau am');

    await page.getByTestId('studio-back-to-climber-btn').click();
    await expect(page.getByTestId('sector-pill-name')).toContainText('Überhang Vorne');
    await expect(page.getByTestId('sector-pill').getByTestId('sector-planned-badge')).toContainText('bis');
    await expect(page.getByTestId('climber-planned-notice')).toContainText('abgeschraubt');
  });
});
