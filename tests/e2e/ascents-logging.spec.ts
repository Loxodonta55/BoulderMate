import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-003 / SPEC-004 / SPEC-022: Begehungen loggen über das Boulder-Sheet.
 * Läuft rein lokal: Supabase wird blockiert, damit keine Testdaten in der Produktion landen.
 */
// Entfernt Hans' Eintrag für einen Boulder, damit das Loggen sicher eine Änderung ist (Seed-Daten enthalten Begehungen)
async function clearHansAscent(page: Page, boulderId: string) {
  await page.evaluate(id => {
    const all = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
    localStorage.setItem(
      'boulderapp_ascents_v3',
      JSON.stringify(all.filter((a: any) => !(a.boulderId === id && (a.userId === 'hans-kletterer' || a.user_id === 'hans-kletterer'))))
    );
  }, boulderId);
}

test.describe('SPEC-003 / SPEC-004: Ascents Logging & Sync (Flash / Top / Project)', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  });

  test('Hans logs a TOP in 2 taps: writes ascent to storage and shows up in «Wer war schon oben»', async ({ page }) => {
    const row = page.locator('[data-testid^="route-row-"]').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    const boulderId = (await row.getAttribute('data-testid'))!.replace('route-row-', '');

    await clearHansAscent(page, boulderId);

    // Tap 1: Route öffnen, Tap 2: Top
    await row.click();
    await page.getByTestId('log-top-btn').click();
    await expect(page.getByText('Top geloggt')).toBeVisible();

    const localAscents = await page.evaluate(() => localStorage.getItem('boulderapp_ascents_v3'));
    expect(localAscents).toContain('hans-kletterer');

    // Erneut öffnen: Top ist aktiv, Hans steht in «Wer war schon oben»
    await row.click();
    await expect(page.getByTestId('log-top-btn')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('boulder-sheet-more').click();
    await expect(page.getByTestId('community-ratings-section').getByText(/Hans|HansDereinfacheKletterer/i).first()).toBeVisible();
  });

  test('Switching ascent to FLASH updates the record cleanly without duplicates', async ({ page }) => {
    const row = page.locator('[data-testid^="route-row-"]').first();
    await expect(row).toBeVisible({ timeout: 10000 });
    const boulderId = (await row.getAttribute('data-testid'))!.replace('route-row-', '');

    await clearHansAscent(page, boulderId);

    await row.click();
    await page.getByTestId('log-top-btn').click();
    await expect(page.getByTestId('boulder-sheet')).toHaveCount(0);
    await row.click();
    await page.getByTestId('log-flash-btn').click();
    await expect(page.getByText('Flash geloggt')).toBeVisible();

    const hansAscents = await page.evaluate(id => {
      const data = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
      return data.filter((a: any) =>
        (a.userId === 'hans-kletterer' || a.user_id === 'hans-kletterer') && a.boulderId === id
      );
    }, boulderId);

    expect(hansAscents).toHaveLength(1);
    expect(hansAscents[0].type).toBe('flash');
  });

});
