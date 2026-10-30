import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-052: KI erfasst Routen aus dem Sektorfoto.
 * Läuft rein lokal: Supabase ist blockiert, das Foto wartet deshalb in der Warteschlange («Wartet auf Netz …»).
 * Die Auswertung selbst (Worker + Gemini) prüfen die Unit-Tests und scripts/ai-capture/eval.ts.
 */

const SEED_BOULDER = '00000000-1482-4000-8000-a572260ce38e';
const PHOTO = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
);

async function login(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
}

async function enableAiAsAdmin(page: Page) {
  await page.getByTestId('role-gateway-admin-btn').click();
  await page.getByTestId('admin-gym-button').click();
  await page.getByTestId('admin-gym-row-gym-6a-plus').click();
  await page.getByTestId('admin-tab-gym').click();
  const settings = page.getByTestId('ai-capture-settings');
  await expect(settings).toContainText('Routen per Foto erkennen (KI)');
  await expect(page.getByTestId('ai-capture-privacy')).toContainText('nicht zum Training');
  await page.getByTestId('ai-capture-enable').check();
  await page.getByTestId('grade-marker-tape').click();
  await expect(page.getByTestId('grade-marker-tape')).toHaveAttribute('aria-pressed', 'true');
}

/** Markiert die Seed-Route als KI-Route mit «Grad folgt» und Prüfgrund (wie es der Worker täte). */
async function markSeedAsAiRoute(page: Page) {
  await page.evaluate(id => {
    const key = 'boulderapp_wall_boulders_v2';
    const today = new Date().toISOString().slice(0, 10);
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    for (const b of list) {
      if (b.id === id) Object.assign(b, { captureSource: 'ai', gradePending: true, holdColor: 'Türkis', radarSource: 'ai', aiReview: [`grade:${today}`] });
    }
    localStorage.setItem(key, JSON.stringify(list));
  }, SEED_BOULDER);
}

async function toStudio(page: Page) {
  await page.goto('/');
  await page.getByTestId('role-gateway-setter-btn').click();
  await expect(page.getByTestId('start-rebuild-btn')).toBeVisible();
  await page.getByRole('button', { name: 'Überhang Vorne', exact: true }).click();
}

test.describe('SPEC-052: KI-Routenerfassung', () => {
  test('Admin schaltet ein; Studio: Foto mit Moduswahl, Status ohne Netz, Kurz prüfen', async ({ page }) => {
    await login(page);
    await enableAiAsAdmin(page);
    await markSeedAsAiRoute(page);
    await toStudio(page);

    const sectorBtn = page.locator('[data-testid^="ai-capture-btn-"]');
    await expect(sectorBtn).toBeVisible();
    const box = await sectorBtn.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56);
    await expect(sectorBtn).toHaveAttribute('aria-label', /^Foto für Sektor /);

    // AC-2: Sektor mit aktiven Routen fragt zuerst
    await sectorBtn.click();
    await expect(page.getByTestId('ai-capture-mode-full')).toBeVisible();
    const chooser = page.waitForEvent('filechooser');
    await page.getByTestId('ai-capture-mode-partial').click();
    await (await chooser).setFiles({ name: 'wand.jpg', mimeType: 'image/jpeg', buffer: PHOTO });

    // AC-4: ohne Netz wartet das Foto
    await expect(page.locator('[data-testid^="ai-capture-status-"]')).toContainText('Wartet auf Netz …');

    // AC-7/AC-13: «Grad folgt» am Pin, Kurz prüfen mit Grund und Knöpfen
    await expect(page.getByTestId(`pin-grade-pending-${SEED_BOULDER}`)).toBeVisible();
    await page.locator('[data-testid^="ai-review-count-"]').click();
    const item = page.getByTestId(`ai-review-item-${SEED_BOULDER}`);
    await expect(item).toContainText('Grad nicht sicher lesbar');
    await page.getByTestId(`ai-review-recolor-${SEED_BOULDER}`).click();
    await page.locator('[data-testid^="ai-review-color-"]').first().click();
    await expect(item).toHaveCount(0);
    await page.getByTestId('ai-review-close').click();
    await expect(page.getByTestId(`pin-grade-pending-${SEED_BOULDER}`)).toHaveCount(0);
  });

  test('Admin stellt «Zeichen am Start» ein, Zeichen je Farbe und Hinweis bleiben; Studio zeigt die Art', async ({ page }) => {
    await login(page);
    await enableAiAsAdmin(page);
    await expect(page.getByTestId('grade-marker-holds')).toContainText('Farbe der Griffe');
    await page.getByTestId('grade-marker-symbol').click();
    await expect(page.getByTestId('grade-marker-symbol')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('grade-marker-tape')).toHaveAttribute('aria-pressed', 'false');
    const first = page.locator('[data-testid^="grade-symbol-"]:not([data-testid^="grade-symbol-missing-"])').first();
    const id = (await first.getAttribute('data-testid'))!.replace('grade-symbol-', '');
    await expect(page.getByTestId(`grade-symbol-missing-${id}`)).toContainText('Grad folgt');
    await first.fill('★★, 2 Sterne');
    await page.getByTestId('ai-grade-hint').fill('Schild unten links am Startgriff');
    await page.getByTestId('ai-grade-hint').blur();
    await expect(page.getByTestId(`grade-symbol-missing-${id}`)).toHaveCount(0);
    const box = await page.getByTestId('grade-marker-symbol').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56);

    const gym = await page.evaluate(() => JSON.parse(localStorage.getItem('boulder_gyms_v1') || '[]').find((g: { id: string }) => g.id === 'gym-6a-plus'));
    expect(gym.grade_marker).toBe('symbol');
    expect(gym.grade_symbols[id]).toBe('★★, 2 Sterne');
    expect(gym.ai_grade_hint).toBe('Schild unten links am Startgriff');

    await toStudio(page);
    await expect(page.getByTestId('ai-capture-marker-hint')).toContainText('KI liest den Grad an: Zeichen am Start');
  });

  test('Kletterer: Grad folgt, Griff-Farbe, geschätzt, «Stimmt was nicht?», «Hier fehlt eine Route»', async ({ page }) => {
    await login(page);
    await markSeedAsAiRoute(page);
    // KI-Erfassung der Halle an (sonst keine Meldeknöpfe, AC-14)
    await page.evaluate(() => {
      const list = JSON.parse(localStorage.getItem('boulder_gyms_v1') || '[]');
      for (const g of list) if (g.id === 'gym-6a-plus') g.ai_capture_enabled = true;
      localStorage.setItem('boulder_gyms_v1', JSON.stringify(list));
    });
    await page.reload();
    await page.getByTestId('role-gateway-climber-btn').click().catch(() => {});
    await page.getByTestId('sector-pill-name').click();
    await page.getByTestId('sector-list-sheet').getByRole('button', { name: /Überhang Vorne/ }).first().click();

    const pending = page.getByTestId(`pin-grade-pending-${SEED_BOULDER}`);
    await expect(pending).toBeVisible();
    await page.getByTestId(`pin-${SEED_BOULDER}`).click();
    await expect(page.getByTestId('boulder-sheet-number')).toHaveText('?');
    await expect(page.getByTestId('boulder-sheet-hold-color')).toContainText('Türkis');
    await page.getByTestId('boulder-sheet-more').click();
    await expect(page.getByTestId('radar-estimated')).toBeVisible();
    await page.getByTestId('route-issue-btn').click();
    await page.getByTestId('route-issue-wrong_grade').click();
    await expect(page.getByText('Danke! Die Schrauber schauen es sich an.')).toBeVisible();
    await page.getByTestId('boulder-sheet-close').click();

    await page.getByTestId('route-missing-btn').click();
    await expect(page.getByTestId('route-missing-hint')).toBeVisible();
    const photo = page.getByTestId('climber-wall-photo');
    const b = await photo.boundingBox();
    await page.mouse.click(b!.x + b!.width * 0.1, b!.y + b!.height * 0.15);
    await expect(page.getByTestId('route-missing-hint')).toHaveCount(0);
    const issues = await page.evaluate(() => JSON.parse(localStorage.getItem('bouldermate_route_issues_v1') || '[]'));
    expect(issues.map((i: { kind: string }) => i.kind).sort()).toEqual(['missing', 'wrong_grade']);
  });
});
