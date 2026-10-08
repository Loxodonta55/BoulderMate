import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-004 · Deep Dive v2: nur Wand-Begehungen, gleicher Hallenfilter wie «Ich»,
 * Top 5 mit auffälligen Merkmalen. Supabase wird blockiert (lokale Seed-Daten).
 */

async function openDeepDive(page: Page, isMobile: boolean) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
  await expect(page.getByTestId('user-profile-view')).toBeVisible();
  await page.getByTestId('me-open-deep-dive').click();
  await expect(page.getByTestId('deep-dive-view')).toBeVisible();
}

test.describe('SPEC-004: Deep Dive v2', () => {
  test('zeigt die schwersten Wand-Tops mit Merkmalen, ohne manuelle Erfassung', async ({ page, isMobile }) => {
    await openDeepDive(page, isMobile);

    const top = page.getByTestId('deep-dive-top5');
    await expect(top).toBeVisible();
    const rows = top.locator('[data-testid^="deep-dive-top-"]:not([data-testid*="-trait-"]):not([data-testid$="-balanced"])');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    // jede Zeile hat entweder Merkmal-Chips («Maximalkraft 5») oder «Ausgeglichen»
    for (let i = 0; i < count; i++) {
      const traits = rows.nth(i).locator('[data-testid*="-trait-"], [data-testid$="-balanced"]');
      expect(await traits.count()).toBeGreaterThan(0);
    }
    const chip = top.locator('[data-testid*="-trait-"]').first();
    if (await chip.count()) await expect(chip).toHaveText(/^[A-Za-zÄÖÜäöüß-]+ \d(,\d)?$/);

    // keine manuelle Erfassung / Outdoor-Formular
    await expect(page.getByText('Begehung erfassen')).toHaveCount(0);
    await expect(page.getByText('Backup')).toHaveCount(0);
    await expect(page.getByTestId('deep-dive-source-note')).toContainText('an der Wand');

    await page.screenshot({ path: `test-results/deep-dive-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
  });

  test('Grad aufklappen, gleicher Hallenfilter wie «Ich», Zurück', async ({ page, isMobile }) => {
    await openDeepDive(page, isMobile);

    const level = page.getByTestId('deep-dive-levels').locator('button[aria-expanded]').first();
    await level.click();
    await expect(level).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-testid^="deep-dive-route-"]').first()).toBeVisible();

    // Filter umstellen und zurück: Einstellung gilt auch auf der Ich-Seite
    const scope = page.getByTestId('deep-dive-view').getByTestId('me-scope');
    await scope.getByRole('tab').first().click();
    await expect(scope.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
    await page.getByTestId('deep-dive-back').click();
    await expect(page.getByTestId('deep-dive-view')).toHaveCount(0);
    await expect(page.getByTestId('me-scope').getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  });
});
