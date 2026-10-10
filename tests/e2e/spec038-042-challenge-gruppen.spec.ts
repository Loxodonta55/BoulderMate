import { test, expect, Page } from '@playwright/test';
import { loginBorisAs, loginHans, openMe, openSettings } from './_basis';

/** SPEC-038 Hallen-Challenge und SPEC-042 Trainer-Gruppe (lokal, Supabase blockiert). */
async function logout(page: Page, isMobile: boolean | undefined) {
  await openSettings(page, isMobile);
  await page.getByTestId('settings-logout').click();
  await expect(page.getByTestId('quick-login-schrauber')).toBeVisible();
}

test.describe('SPEC-038/042: Challenge und Gruppen', () => {
  test('SPEC-038: Admin legt Challenge an, Kletterer macht freiwillig mit und sieht die Rangliste', async ({ page, isMobile }) => {
    await loginBorisAs(page, 'admin');
    await page.getByTestId('admin-tab-gym').click();
    await page.getByTestId('challenge-new').click();
    await page.getByTestId('challenge-name').fill('Oktober-Challenge');
    await page.getByTestId('challenge-rule-new').click();
    await page.getByTestId('challenge-save').click();
    await expect(page.locator('[data-testid^="challenge-admin-"]')).toContainText('Oktober-Challenge');

    await page.getByTestId('admin-switch-workspace-btn').click();
    await page.getByTestId('role-gateway-climber-btn').click();
    await openMe(page, isMobile);
    const card = page.locator('[data-testid^="challenge-card-"]').first();
    await expect(card).toContainText('Oktober-Challenge');
    const join = card.locator('[data-testid^="challenge-join-"]');
    await expect(join).toContainText('Rangliste');
    await join.click();
    await expect(card.locator('[data-testid^="challenge-progress-"]')).toBeVisible();
    await card.locator('[data-testid^="challenge-board-btn-"]').click();
    await expect(page.getByTestId('challenge-board').locator('[data-testid^="challenge-row-"]')).toHaveCount(1);
  });

  test('SPEC-042: Trainer erstellt Gruppe, Jugendlicher tritt mit Code und Zustimmung bei', async ({ page, isMobile }) => {
    await loginHans(page);
    await openSettings(page, isMobile);
    await page.getByTestId('group-create-open').click();
    await page.getByTestId('group-create-name').fill('Jugend Mittwoch');
    await page.getByTestId('group-create-save').click();
    const code = page.getByTestId('group-code');
    if (!(await code.isVisible().catch(() => false))) {
      await page.locator('[data-testid^="group-owned-"]').first().click();
    }
    const groupCode = (await code.textContent())!.replace(/\s/g, '');
    expect(groupCode).toMatch(/^[A-Z2-9]{6}$/);
    await page.keyboard.press('Escape');
    await page.goto('/');
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await logout(page, isMobile);

    await page.getByTestId('quick-login-schrauber').click();
    const gateway = page.getByTestId('role-gateway-climber-btn');
    await expect(gateway.or(page.getByTestId('climber-wall-view')).first()).toBeVisible();
    if (await gateway.isVisible()) await gateway.click();
    await openSettings(page, isMobile);
    await page.getByTestId('group-join-open').click();
    await page.getByTestId('group-join-code').fill(groupCode.toLowerCase());
    await page.getByTestId('group-join-next').click();
    await expect(page.getByTestId('group-join-consent')).toContainText('letzten 8 Wochen');
    await page.getByTestId('group-join-confirm').click();
    await expect(page.locator('[data-testid^="group-joined-"]')).toContainText('Jugend Mittwoch');
  });
});
