import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-021: Umschrauben im Schrauber-Studio
 * Läuft rein lokal: Supabase wird blockiert, damit kein Test Routen in der Produktion abschraubt.
 */

const SEED_PIN = 'pin-00000000-1482-4000-8000-a572260ce38e';

async function openStudio(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Schrauber 6aPlus' }).click();
  const gatewaySetter = page.getByTestId('role-gateway-setter-btn');
  await expect(gatewaySetter).toBeVisible();
  await gatewaySetter.click();
  await expect(page.getByTestId('start-rebuild-btn')).toBeVisible();
}

async function startRebuild(page: Page) {
  await page.getByTestId('start-rebuild-btn').click();
  await page.getByRole('button', { name: 'Hallen-Wände (Presets)' }).click();
  await page.getByRole('button', { name: /Platte \(Slab & Balance\)/ }).click();
  await page.getByRole('button', { name: 'Wandfoto übernehmen' }).click();
  await expect(page.getByTestId('rebuild-badge')).toBeVisible();
}

async function addDraftPin(page: Page) {
  const photo = page.locator('img[alt="Überhang Vorne"]').first();
  const box = await photo.boundingBox();
  if (!box) throw new Error('Wandfoto nicht gefunden');
  await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.2);
  await page.getByTestId('save-boulder-sheet-btn').click();
}

// Bereichswechsel über die echten Buttons (prüft zugleich, dass «Kletterer-App» in der App bleibt)
async function toClimber(page: Page) {
  await page.getByTestId('studio-back-to-climber-btn').click();
  await expect(page).toHaveURL(/localhost/);
  await expect(page.getByTestId('climber-switch-workspace-btn')).toBeVisible();
}

async function toStudio(page: Page) {
  await page.getByTestId('climber-switch-workspace-btn').click();
  await page.getByTestId('role-gateway-setter-btn').click();
  await expect(page.getByTestId('start-rebuild-btn').or(page.getByTestId('rebuild-badge'))).toBeVisible();
}

test.describe('SPEC-021: Umschrauben', () => {
  test('Wand neu schrauben: Kletterer sehen bis «Wand fertig» die alte Wand, danach die neue', async ({ page }) => {
    await openStudio(page);
    await expect(page.getByTestId(SEED_PIN)).toBeVisible();

    await startRebuild(page);

    // AC-3: Im Umbau zeigt das Studio nur Entwürfe, «Wand fertig» erst mit mindestens einem Entwurf
    await expect(page.getByTestId(SEED_PIN)).toHaveCount(0);
    await expect(page.getByTestId('complete-rebuild-btn')).toBeDisabled();
    await addDraftPin(page);
    await expect(page.getByTestId('complete-rebuild-btn')).toBeEnabled();

    // AC-5: Kletterer sehen die alte Wand mit Hinweis «Im Umbau»
    await toClimber(page);
    await expect(page.getByTestId('climber-rebuild-notice')).toBeVisible();
    await expect(page.getByTestId(SEED_PIN)).toBeVisible();

    // AC-6: «Wand fertig»
    await toStudio(page);
    await page.getByTestId('complete-rebuild-btn').click();
    await page.getByRole('button', { name: /Veröffentlichen & Speichern/ }).click();
    await expect(page.getByText(/Wand ist live: 1 neu/)).toBeVisible();
    await expect(page.getByTestId('rebuild-badge')).toHaveCount(0);

    // Kletterer: alte Route weg, kein Umbau-Hinweis, Sektor trägt «Neu»
    await toClimber(page);
    await expect(page.getByTestId('climber-rebuild-notice')).toHaveCount(0);
    await expect(page.getByTestId(SEED_PIN)).toHaveCount(0);
    // Sektor-Tab bzw. Sektor-Pill (Kletterer-Redesign) trägt «Neu»
    await expect(
      page.locator('[data-testid="sector-pill"], button').filter({ hasText: 'Überhang Vorne' }).filter({ hasText: 'Neu' }).first()
    ).toBeVisible();

    // AC-11: Die alte Route ist archiviert und kennt ihr Wandfoto
    const archived = await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('boulderapp_wall_boulders_v2') || '[]');
      return all.find((b: any) => b.id === '00000000-1482-4000-8000-a572260ce38e');
    });
    expect(archived?.status).toBe('archived');
    expect(archived?.wallPhotoUrl).toBeTruthy();
  });

  test('Umbau verwerfen: Entwürfe weg, Wand unverändert', async ({ page }) => {
    await openStudio(page);
    await startRebuild(page);
    await addDraftPin(page);

    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('discard-rebuild-btn').click();

    await expect(page.getByTestId('rebuild-badge')).toHaveCount(0);
    await expect(page.getByTestId(SEED_PIN)).toBeVisible();
    await expect(page.getByText('Umbau verworfen.')).toBeVisible();
  });

  test('Neu geschraubt: Route wird ersetzt und trägt für Kletterer «Neu»', async ({ page }) => {
    await openStudio(page);
    await page.getByTestId(SEED_PIN).click();
    await page.getByTestId('reset-boulder-btn').click();
    await expect(page.getByText('Neu geschraubt vorgemerkt.')).toBeVisible();

    await page.getByTestId('publish-batch-btn').click();
    await page.getByRole('button', { name: /Veröffentlichen & Speichern/ }).click();

    await toClimber(page);
    await expect(page.getByTestId(SEED_PIN)).toHaveCount(0);
    await expect(page.locator('[data-testid^="new-badge-"]')).toHaveCount(1);
  });
});
