import { test, expect, Page } from '@playwright/test';
import { loginBorisAs, loginHans, tab } from './_basis';

/** SPEC-036 Treff+ und SPEC-041 «Wie voll ist die Halle?» */
async function consentIfAsked(page: Page) {
  const consent = page.getByTestId('treff-consent');
  if (await consent.isVisible().catch(() => false)) {
    await page.getByTestId('treff-consent-age').check();
    await page.getByTestId('treff-consent-ok').click();
  }
}

async function toClimber(page: Page) {
  await page.getByTestId('admin-switch-workspace-btn').click();
  await page.getByTestId('role-gateway-climber-btn').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

test.describe('SPEC-036/041: Treff+ und Auslastung', () => {
  test('SPEC-036: Eintrag mit «Jede Woche» und «Anfänger willkommen», Wiederholung beenden', async ({ page, isMobile }) => {
    await loginHans(page);
    await page.getByTestId(tab(isMobile, 'treff')).click();
    await page.getByTestId('treff-new').click();
    await consentIfAsked(page);
    await expect(page.getByTestId('treff-form-weekly')).toBeVisible();
    await expect(page.getByTestId('treff-form-gym-event')).toHaveCount(0);
    await page.getByTestId('treff-form-days').getByRole('button').nth(1).click();
    await page.getByTestId('treff-form-weekly').click();
    await page.getByTestId('treff-form-beginners').click();
    await page.getByTestId('treff-form-submit').click();
    const mine = page.getByTestId('treff-mine');
    await expect(mine).toContainText('Anfänger willkommen');
    await expect(mine).toContainText('Jede Woche');
    const stop = page.locator('[data-testid^="treff-stop-repeat-"]').first();
    await stop.click();
    await expect(mine).not.toContainText('Jede Woche');
  });

  test('SPEC-036/041: Admin setzt «Viel los» und sieht «Als Termin der Halle»', async ({ page, isMobile }) => {
    await loginBorisAs(page, 'admin');
    await page.getByTestId('admin-tab-gym').click();
    await page.getByTestId('gym-crowd-voll').click();
    await expect(page.getByTestId('gym-crowd-current')).toContainText('Viel los');
    await toClimber(page);
    await page.getByTestId(tab(isMobile, 'treff')).click();
    await expect(page.getByTestId('treff-crowd')).toContainText('Viel los');
    await expect(page.getByTestId('treff-crowd')).toContainText('laut Halle');
    await page.getByTestId('treff-new').click();
    await consentIfAsked(page);
    await expect(page.getByTestId('treff-form-gym-event')).toBeVisible();
  });
});
