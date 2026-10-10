import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-029: QR-Codes an der Wand.
 * Läuft rein lokal: Supabase ist blockiert.
 */

async function blockSupabase(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
}

/** Admin-Konsole → Halle 6a plus (feste Sektor-IDs) → Tab «Halle» → «QR-Codes drucken»; liefert Link und Name des 2. Sektors */
async function readSecondQrLink(page: Page): Promise<{ href: string; name: string }> {
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  await page.getByTestId('role-gateway-admin-btn').click();
  await page.getByTestId('admin-gym-button').click();
  await page.getByTestId('admin-gym-row-gym-6a-plus').click();
  await page.getByTestId('admin-tab-gym').click();
  await page.getByTestId('wall-qr-print-btn').click();
  const sheet = page.getByTestId('wall-qr-sheet');
  await expect(sheet).toBeVisible();
  const cards = sheet.locator('[data-testid^="wall-qr-card-"]');
  expect(await cards.count()).toBeGreaterThan(1);
  const card = cards.nth(1);
  await expect(card).toContainText('Scannen und Boulder loggen');
  await expect(card.getByTestId('wall-qr-code').locator('path')).toHaveCount(1);
  const href = (await card.getByTestId('wall-qr-code').getAttribute('data-qr-text'))!;
  expect(href).toMatch(/^https:\/\/bouldermate\.ch\/\?wand=[0-9a-f-]{36}$/);
  const name = (await card.locator('h4').textContent())!.trim();
  await page.getByTestId('wall-qr-close').click();
  return { href, name };
}

const localPath = (href: string) => href.replace('https://bouldermate.ch/', '/');

test.describe('SPEC-029: QR-Codes an der Wand', () => {
  test('Admin druckt Aufkleber; angemeldet führt der Link direkt zur Wand', async ({ page }) => {
    await blockSupabase(page);
    const { href, name } = await readSecondQrLink(page);

    await page.goto(localPath(href));
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('sector-pill-name')).toContainText(name);
    await expect(page).not.toHaveURL(/wand=/);
  });

  test('Gast: Landing nennt die Wand, nach dem Anmelden geht es dorthin', async ({ page, browser }) => {
    await blockSupabase(page);
    const { href, name } = await readSecondQrLink(page);

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.context().route(/supabase\.co/, route => route.abort());
    await guestPage.goto(localPath(href));
    await expect(guestPage.getByTestId('wall-link-notice')).toContainText(name);
    await guestPage.getByTestId('quick-login-hans').click();
    await expect(guestPage.getByTestId('sector-pill-name')).toContainText(name);
    await guest.close();
  });

  test('Unbekannte Wand: normaler Start mit Hinweis', async ({ page }) => {
    await blockSupabase(page);
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await page.goto('/?wand=00000000-0000-4000-8000-000000000000');
    await expect(page.getByText('Diese Wand gibt es nicht mehr.')).toBeVisible();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  });
});
