import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-027: «Ansehen als …» für Plattform-Admins
 * Läuft rein lokal: Supabase wird blockiert, damit keine Testdaten in der Produktion landen.
 */

async function loginAsBorisToWall(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  await page.getByTestId('role-gateway-climber-btn').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

async function chooseView(page: Page, mode: string) {
  await page.getByTestId('view-as-toggle').click();
  await expect(page.getByTestId('view-as-menu')).toBeVisible();
  await page.getByTestId(`view-as-option-${mode}`).click();
  await expect(page.getByTestId('view-as-menu')).toBeHidden();
}

test.describe('SPEC-027: Ansehen als …', () => {
  test('Boris wechselt durch alle Rollen', async ({ page }) => {
    await loginAsBorisToWall(page);
    await expect(page.getByTestId('view-as-label')).toHaveText('Ansehen als …');

    // Nur Kletterer: direkt an der Wand, keine Arbeitsbereich-Wahl
    await chooseView(page, 'kletterer');
    await expect(page.getByTestId('view-as-label')).toHaveText('Ansicht: Nur Kletterer');
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('role-gateway-climber-btn')).toHaveCount(0);

    // Schrauber: Studio offen, Administration gesperrt
    await chooseView(page, 'schrauber');
    await expect(page.getByTestId('role-gateway-setter-btn')).toBeVisible();
    await expect(page.getByText('Hallen-Administration (Gesperrt)')).toBeVisible();
    await page.getByTestId('role-gateway-climber-btn').click();

    // Hallen-Admin: Administration wieder offen
    await chooseView(page, 'hallen-admin');
    await expect(page.getByTestId('role-gateway-setter-btn')).toBeVisible();
    await expect(page.getByText('Hallen-Administration', { exact: true })).toBeVisible();
    await page.getByTestId('role-gateway-climber-btn').click();

    // Zurück zu den echten Rechten
    await chooseView(page, 'echt');
    await expect(page.getByTestId('view-as-label')).toHaveText('Ansehen als …');
  });

  test('Vorschau bleibt nach dem Neuladen erhalten', async ({ page }) => {
    await loginAsBorisToWall(page);
    await chooseView(page, 'kletterer');
    await page.reload();
    await expect(page.getByTestId('view-as-label')).toHaveText('Ansicht: Nur Kletterer');
    await chooseView(page, 'echt');
  });

  test('Kletterer ohne Sonderrechte sehen keinen Umschalter', async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('view-as-toggle')).toHaveCount(0);
  });

  test('Umschalter verdeckt die untere Leiste nicht', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Untere Leiste gibt es nur auf dem Handy');
    await loginAsBorisToWall(page);
    const toggle = await page.getByTestId('view-as-toggle').boundingBox();
    const nav = await page.getByTestId('mobile-bottom-nav').boundingBox();
    expect(toggle && nav).toBeTruthy();
    expect(toggle!.y + toggle!.height).toBeLessThanOrEqual(nav!.y);
    expect(toggle!.height).toBeGreaterThanOrEqual(44);
  });
});
