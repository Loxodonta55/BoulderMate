import { test, expect, Page } from '@playwright/test';
import { blockSupabase, loginHans, openSettings, tab } from './_basis';

/**
 * SPEC-046: Person melden und ausblenden.
 * Läuft rein lokal (Supabase blockiert). «Mia» hat einen Boulder geklettert, Hans meldet sie und blendet sie aus.
 */

async function seedMiaOnFirstRoute(page: Page): Promise<string> {
  const row = page.locator('[data-testid^="route-row-"]').first();
  await expect(row).toBeVisible();
  const routeTestId = (await row.getAttribute('data-testid'))!;
  const boulderId = routeTestId.replace('route-row-', '');
  await page.evaluate(id => {
    const list = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
    list.push({ id: 'a-mia', userId: 'mia', userNickname: 'Mia', boulderId: id, type: 'top', createdAt: new Date().toISOString() });
    localStorage.setItem('boulderapp_ascents_v3', JSON.stringify(list));
    const profiles = JSON.parse(localStorage.getItem('boulderapp_profiles_v1') || '[]');
    profiles.push({ id: 'mia', nickname: 'Mia', createdAt: '2026-01-01T10:00:00Z' });
    localStorage.setItem('boulderapp_profiles_v1', JSON.stringify(profiles));
  }, boulderId);
  await page.reload();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  return routeTestId;
}

test.describe('SPEC-046: Melden und Ausblenden', () => {
  test('Hans meldet Mia wegen Belästigung, sie ist ausgeblendet; Boris erledigt die Meldung', async ({ page, isMobile }) => {
    await loginHans(page);
    const route = await seedMiaOnFirstRoute(page);

    await page.getByTestId(route).click();
    await expect(page.getByTestId('boulder-sheet')).toBeVisible();
    await page.getByTestId('boulder-sheet-more').click();
    await page.getByTestId('community-ascent-row-mia').click();
    await expect(page.getByTestId('public-profile-modal')).toBeVisible();
    await page.getByTestId('profile-report').click();

    const sheet = page.getByTestId('report-sheet');
    await expect(sheet.getByRole('heading', { name: 'Mia melden' })).toBeVisible();
    await sheet.getByTestId('report-reason-belaestigung').click();
    await expect(sheet.getByTestId('report-also-hide')).toBeChecked();
    await sheet.getByTestId('report-note').fill('Schreibt mir dauernd');
    await sheet.getByTestId('report-submit').click();
    await expect(sheet.getByTestId('report-thanks')).toBeVisible();
    await sheet.getByTestId('report-close').click();

    // Profil ist zu, in «Wer war schon oben» steht jetzt «Jemand»
    await expect(page.getByTestId('public-profile-modal')).toBeHidden();
    const miaRow = page.getByTestId('community-ascent-row-mia');
    await expect(miaRow).toHaveAttribute('data-anonymous', 'true');
    await expect(miaRow).toContainText('Jemand');
    await page.keyboard.press('Escape');

    // In den Einstellungen wieder anzeigen
    await page.goto('/');
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await openSettings(page, isMobile);
    await page.getByTestId('settings-treff-blocks').click();
    await expect(page.getByTestId('treff-block-mia')).toBeVisible();
    await page.getByTestId('treff-unblock-mia').click();
    await expect(page.getByTestId('treff-block-mia')).toBeHidden();

    // Boris (Plattform-Admin) sieht die Meldung und erledigt sie
    await page.getByTestId('treff-blocks-sheet-scrim').click({ position: { x: 20, y: 20 } });
    await expect(page.getByTestId('treff-blocks-sheet')).toBeHidden();
    await page.getByTestId('settings-logout').click();
    await page.getByTestId('quick-login-boris').click();
    await page.getByTestId('role-gateway-climber-btn').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await page.getByTestId(tab(isMobile, 'stats')).click();
    await expect(page.getByTestId('moderation-open-count')).toHaveText('1');
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-treff-reports').click();
    const card = page.locator('[data-testid^="admin-profile-report-"]').first();
    await expect(card).toContainText('Belästigt mich');
    await expect(card).toContainText('Schreibt mir dauernd');
    await card.locator('[data-testid^="admin-done-"]').click();
    await expect(page.locator('[data-testid^="admin-profile-report-"]')).toHaveCount(0);
  });

  test('Eigener Name mit Schimpfwort wird nicht gespeichert; Regeln-Seite ist erreichbar', async ({ page, isMobile }) => {
    await loginHans(page);
    await openSettings(page, isMobile);
    await expect(page.getByTestId('settings-rules-consent')).toContainText('Fair bleiben');
    const input = page.getByTestId('settings-name-input');
    await input.fill('4rschl0ch');
    await input.press('Enter');
    await expect(page.getByTestId('settings-name-error')).toBeVisible();

    await page.getByTestId('settings-safety-help').click();
    await expect(page.getByTestId('safety-help-sheet')).toBeVisible();

    await blockSupabase(page);
    await page.goto('/regeln.html');
    await expect(page.getByRole('heading', { name: 'Fair bleiben' })).toBeVisible();
    await expect(page.locator('body')).toContainText('112');
  });
});
