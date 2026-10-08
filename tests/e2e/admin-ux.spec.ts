import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-023: Admin-UX «Ordnung & wenig Text»
 * Läuft rein lokal: Supabase wird blockiert, damit kein Test Sektoren, Farben oder Rollen in der Produktion ändert.
 */

async function openAdmin(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  const gatewayAdmin = page.getByTestId('role-gateway-admin-btn');
  await expect(gatewayAdmin).toBeVisible();
  await gatewayAdmin.click();
  await expect(page.getByTestId('admin-tabs')).toBeVisible();
}

const sectorRows = (page: Page) => page.locator('[data-testid^="sector-row-"]');

test.describe('SPEC-023: Admin-Bereich', () => {
  test('AC-1/2/12: Tabs direkt sichtbar, Header mit Hallenname + einem Knopf, 8 Sektoren passen auf den Schirm', async ({ page }) => {
    await openAdmin(page);

    await expect(page.getByTestId('admin-gym-button')).toBeVisible();
    await expect(page.getByTestId('admin-switch-workspace-btn')).toBeVisible();
    await expect(page.getByTestId('admin-back-to-climber-btn')).toHaveCount(0);
    await expect(page.getByPlaceholder(/Halle suchen/i)).toHaveCount(0);
    for (const bad of ['SPEC-', 'Topo-Tafeln', 'Grade Scales', 'Gebietsführer', 'Nutzer-ID']) {
      await expect(page.getByText(bad, { exact: false })).toHaveCount(0);
    }

    // AC-12: Platz für 8 Zeilen unter Header und Tabs
    const first = sectorRows(page).first();
    await expect(first).toBeVisible();
    const box = await first.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error('Kein Layout');
    expect(box.y + 8 * box.height).toBeLessThanOrEqual(viewport.height);
  });

  test('AC-4/5/6: Sektor umbenennen, sortieren, Löschen mit Rückfrage', async ({ page }) => {
    await openAdmin(page);

    const firstRow = sectorRows(page).first();
    const firstId = (await firstRow.getAttribute('data-testid'))!.replace('sector-row-', '');

    // Umbenennen
    await firstRow.click();
    await expect(page.getByTestId('sector-sheet')).toBeVisible();
    await page.getByTestId('sector-rename-input').fill('Slab Vorne E2E');
    await page.getByTestId('sector-rename-save').click();
    await expect(page.getByTestId(`sector-row-${firstId}`)).toContainText('Slab Vorne E2E');

    // Löschen fragt nach, «Abbrechen» behält den Sektor
    await page.getByTestId('sector-delete-btn').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await page.getByTestId('confirm-cancel').click();
    await expect(page.getByTestId('confirm-dialog')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByTestId('sector-sheet-scrim').click({ force: true }).catch(() => {});
    await expect(page.getByTestId('sector-sheet')).toHaveCount(0);
    await expect(page.getByTestId(`sector-row-${firstId}`)).toBeVisible();

    // Sortieren: Pfeile nur im Modus, ↓ schiebt den ersten Sektor nach unten
    await expect(page.getByTestId(`move-down-${firstId}`)).toHaveCount(0);
    await page.getByTestId('toggle-reorder-mode-btn').click();
    await page.getByTestId(`move-down-${firstId}`).click();
    await expect(sectorRows(page).nth(1)).toHaveAttribute('data-testid', `sector-row-${firstId}`);
    await page.getByTestId('toggle-reorder-mode-btn').click();
    await expect(page.getByTestId(`move-down-${firstId}`)).toHaveCount(0);
  });

  test('AC-7: Farbe im Sheet ändern', async ({ page }) => {
    await openAdmin(page);
    await page.getByTestId('admin-tab-grades').click();
    await page.getByTestId('grade-row-0').click();
    await expect(page.getByTestId('grade-sheet')).toBeVisible();
    await page.getByTestId('grade-name-input').fill('Sonnengelb');
    await page.getByTestId('grade-save-btn').click();
    await expect(page.getByTestId('grade-sheet')).toHaveCount(0);
    await expect(page.getByTestId('grade-row-0')).toContainText('Sonnengelb');
  });

  test('AC-8: Person suchen, als Schrauber hinzufügen, Rolle mit Rückfrage entziehen', async ({ page }) => {
    await openAdmin(page);
    await page.getByTestId('admin-tab-team').click();

    await page.getByTestId('add-team-member-btn').click();
    await page.getByTestId('team-search-input').fill('hans');
    await page.getByTestId('team-candidate-hans-kletterer').click();
    await page.getByTestId('team-role-setter').click();
    await page.getByTestId('team-add-confirm').click();

    const row = page.getByTestId('team-row-hans-kletterer');
    await expect(row).toContainText('Schrauber');

    await row.click();
    await page.getByTestId('team-revoke-setter').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await page.getByTestId('confirm-ok').click();
    await expect(page.getByTestId('team-row-hans-kletterer')).toHaveCount(0);
  });

  test('AC-3: Halle über das Header-Sheet wechseln', async ({ page }) => {
    await openAdmin(page);
    const gymButton = page.getByTestId('admin-gym-button');
    const before = (await gymButton.textContent())?.trim();

    await gymButton.click();
    const sheet = page.getByTestId('admin-gym-sheet');
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId('admin-new-gym-btn')).toBeVisible();

    const other = sheet.locator('[data-testid^="admin-gym-row-"]:not([aria-current="true"])').first();
    const otherName = (await other.locator('span span').first().textContent())?.trim();
    await other.click();
    await expect(sheet).toHaveCount(0);
    await expect(gymButton).toContainText(otherName!);
    expect(otherName).not.toBe(before);
    await expect(page.getByTestId('admin-tabs')).toBeVisible();
  });
});
