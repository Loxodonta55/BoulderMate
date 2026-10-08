import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-022: Kletterer-UX – Ordnung, Übersicht, wenig Text
 * Läuft rein lokal: Supabase wird blockiert, damit keine Testdaten in der Produktion landen.
 */

async function loginAsHans(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

/** Springt zum ersten Sektor mit einem offenen Boulder und gibt dessen Zeile zurück. */
async function firstOpenRoute(page: Page) {
  await page.getByTestId('filter-chip-open').click();
  for (let i = 0; i < 10; i++) {
    const row = page.locator('[data-testid^="route-row-"]').first();
    if (await row.isVisible().catch(() => false)) return row;
    await page.getByTestId('sector-next-btn').click();
  }
  throw new Error('Kein offener Boulder gefunden');
}

async function openMe(page: Page, isMobile: boolean) {
  await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
  await expect(page.getByTestId('user-profile-view')).toBeVisible();
}

test.describe('SPEC-022: Kletterer-UX', () => {
  test('Wand: Foto zuerst, darunter Sektor-Pill und Filter, nur eine Hallenwahl', async ({ page }) => {
    await loginAsHans(page);

    const photo = await page.getByTestId('climber-wall-photo').boundingBox();
    const pill = await page.getByTestId('sector-pill').boundingBox();
    const chips = await page.getByTestId('climber-filter-chips').boundingBox();
    expect(photo && pill && chips).toBeTruthy();
    expect(photo!.y).toBeLessThan(pill!.y);
    expect(pill!.y).toBeLessThan(chips!.y);
    // Foto beginnt direkt unter dem Header
    const header = await page.getByTestId('climber-header').boundingBox();
    expect(photo!.y - (header!.y + header!.height)).toBeLessThanOrEqual(24);

    await expect(page.getByTestId('header-gym-select')).toBeVisible();
    await expect(page.getByTestId('climber-wall-view').locator('select')).toHaveCount(0);

    // Filter: genau Alle / Offen / (Neu) / ★ Top, keine Sortierung, kein Reset-Link
    await expect(page.getByTestId('filter-chip-all')).toBeVisible();
    await expect(page.getByTestId('filter-chip-open')).toBeVisible();
    await expect(page.getByTestId('filter-chip-top_rated')).toBeVisible();
    await expect(page.getByText('Beliebt')).toHaveCount(0);
    await expect(page.getByText('Filter zurücksetzen')).toHaveCount(0);
  });

  test('2-Tap-Logging: Zeile → Flash, Sheet schliesst, Toast mit Rückgängig', async ({ page }) => {
    await loginAsHans(page);
    const row = await firstOpenRoute(page);
    const rowId = (await row.getAttribute('data-testid'))!.replace('route-row-', '');

    await row.click();
    await expect(page.getByTestId('boulder-sheet')).toBeVisible();
    await page.getByTestId('log-flash-btn').click();

    await expect(page.getByTestId('boulder-sheet')).toHaveCount(0);
    await expect(page.getByText('Flash geloggt')).toBeVisible();

    const logged = await page.evaluate(id => {
      const all = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
      return all.some((a: any) => a.boulderId === id && a.type === 'flash');
    }, rowId);
    expect(logged).toBe(true);

    await page.getByRole('button', { name: 'Rückgängig' }).click();
    const afterUndo = await page.evaluate(id => {
      const all = JSON.parse(localStorage.getItem('boulderapp_ascents_v3') || '[]');
      return all.some((a: any) => a.boulderId === id && a.type === 'flash');
    }, rowId);
    expect(afterUndo).toBe(false);
  });

  test('F19: Geschaffte Route zeigt grosses «Flash» in der Liste, Abzeichen am Pin und den Fortschritt', async ({ page }) => {
    await loginAsHans(page);
    const row = await firstOpenRoute(page);
    const rowId = (await row.getAttribute('data-testid'))!.replace('route-row-', '');
    await page.getByTestId('filter-chip-all').click();
    const before = await page.getByTestId('climber-progress').textContent();
    const doneBefore = parseInt(before!.trim(), 10);

    await page.getByTestId(`route-row-${rowId}`).click();
    await page.getByTestId('log-flash-btn').click();
    await expect(page.getByTestId('boulder-sheet')).toHaveCount(0);

    const status = page.getByTestId(`route-status-${rowId}`);
    await expect(status).toHaveText(/Flash/);
    const font = await status.locator('span').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(font).toBeGreaterThanOrEqual(15);
    await expect(page.getByTestId(`pin-status-${rowId}`)).toBeVisible();
    await expect(page.getByTestId('climber-progress')).toContainText(`${doneBefore + 1} von`);
  });

  test('F20: Hallen-Klassiker-Stern am Pin ist mindestens 20 px gross und ohne Mini-Text', async ({ page }) => {
    await loginAsHans(page);
    const badge = page.locator('[data-testid^="classic-badge-"]').first();
    for (let i = 0; i < 10 && !(await badge.isVisible().catch(() => false)); i++) {
      await page.getByTestId('sector-next-btn').click();
    }
    await expect(badge).toBeVisible();
    const box = (await badge.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(20);
    await expect(badge).not.toContainText('5.0');
  });

  test('Details zeigen Community und «Wer war schon oben»', async ({ page }) => {
    await loginAsHans(page);
    await page.locator('[data-testid^="route-row-"]').first().click();
    await page.getByTestId('boulder-sheet-more').click();
    await expect(page.getByTestId('boulder-sheet-details')).toBeVisible();
    await expect(page.getByTestId('community-ratings-section')).toBeVisible();
    await expect(page.getByText('Wer war schon oben')).toBeVisible();
  });

  test('Text-Diät (SPEC-020): keine UUIDs, keine Farbkreise, keine Erklärtexte', async ({ page, isMobile }) => {
    await loginAsHans(page);
    const body = page.locator('body');
    for (const t of [/Sektoren & Wandansicht/, /Filter:/, /Sortierung:/, /SPEC-005/, /Pin antippen/]) {
      await expect(body).not.toContainText(t);
    }
    await expect(page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats')).toHaveText(/Ich/);

    await page.locator('[data-testid^="route-row-"]').first().click();
    await page.getByTestId('boulder-sheet-more').click();
    const sheet = page.getByTestId('boulder-sheet');
    await expect(sheet).toContainText('Geschraubt von');
    await expect(sheet).not.toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
    await expect(sheet).not.toContainText(/Aggregiert aus/);
    await expect(sheet).not.toContainText(/🟢|🟡|🔴/);

    await page.getByTestId('open-rating-btn').click();
    await expect(page.getByRole('button', { name: /^Soft/ }).first()).toBeVisible();
    await expect(body).not.toContainText(/🟢|🟡|🔴/);
  });

  test('«Wer war schon oben» zeigt jede Person nur einmal, auch bei doppelt gespeicherter Begehung', async ({ page }) => {
    await loginAsHans(page);
    const row = page.locator('[data-testid^="route-row-"]').first();
    const boulderId = (await row.getAttribute('data-testid'))!.replace('route-row-', '');
    // Doppelte Begehung derselben Person (Demo-ID und Supabase-UUID) einspielen
    await page.evaluate((id) => {
      const key = 'boulderapp_ascents_v3';
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      all.push(
        { id: 'dup-1', userId: 'admin-minimum', userNickname: 'AdminMinimum', boulderId: id, type: 'top', createdAt: '2026-09-01T10:00:00Z' },
        { id: 'dup-2', userId: '00000000-2ff9-4000-8000-b7902cb24230', userNickname: 'AdminMinimum', boulderId: id, type: 'flash', createdAt: '2026-09-02T10:00:00Z' },
      );
      localStorage.setItem(key, JSON.stringify(all));
    }, boulderId);
    await row.click();
    await page.getByTestId('boulder-sheet-more').click();
    const section = page.getByTestId('community-ratings-section');
    await expect(section.getByText('AdminMinimum', { exact: true })).toHaveCount(1);
  });

  test('Sektorwechsel per Pill und Sektor-Liste', async ({ page }) => {
    await loginAsHans(page);
    const name = page.getByTestId('sector-pill-name');
    await expect(name).toContainText('1/');
    await page.getByTestId('sector-next-btn').click();
    await expect(name).toContainText('2/');

    await name.click();
    const sheet = page.getByTestId('sector-list-sheet');
    await expect(sheet).toBeVisible();
    const items = sheet.locator('[data-testid^="sector-list-item-"]');
    expect(await items.count()).toBeGreaterThan(1);
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'true');
    await items.first().click();
    await expect(sheet).toHaveCount(0);
    await expect(name).toContainText('1/');
  });

  test('Ich: eine Seite ohne Unter-Tabs, Einstellungen mit Abmelden', async ({ page, isMobile }) => {
    await loginAsHans(page);
    await openMe(page, isMobile);
    await expect(page.getByTestId('me-kpis')).toBeVisible();
    await expect(page.getByTestId('subtab-deep-dive')).toHaveCount(0);
    await expect(page.getByText('Overall Statistik')).toHaveCount(0);

    await page.getByTestId('open-settings-btn').click();
    await expect(page.getByTestId('settings-view')).toBeVisible();
    // Hans ist reiner Kletterer: kein Arbeitsbereich
    await expect(page.getByTestId('settings-open-studio')).toHaveCount(0);
    await page.getByTestId('settings-logout').click();
    await expect(page.getByTestId('hero-login-btn')).toBeVisible();
  });

  test('Untere Leiste: genau zwei Tabs, kein Login- oder Studio-Knopf', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Bottom-Nav gibt es nur auf dem Handy');
    await loginAsHans(page);
    const nav = page.getByTestId('mobile-bottom-nav');
    await expect(nav.getByRole('button')).toHaveCount(2);
    await expect(page.getByTestId('mobile-bottom-login-btn')).toHaveCount(0);
    await expect(page.getByTestId('mobile-workspace-btn')).toHaveCount(0);
    await expect(page.getByTestId('login-modal-btn')).toHaveCount(0);
    await expect(page.getByTestId('climber-switch-workspace-btn')).toHaveCount(0);
  });

  test('Bugfix: Studio → Kletterer-App bleibt in der App (frischer Tab, auch mit Zurück-Taste)', async ({ page }) => {
    await page.context().route(/supabase\.co/, route => route.abort());
    await page.goto('/');
    await page.getByTestId('quick-login-schrauber').click();
    await page.getByTestId('role-gateway-setter-btn').click();
    await expect(page.getByTestId('studio-back-to-climber-btn')).toBeVisible();

    await page.getByTestId('studio-back-to-climber-btn').click();
    await expect(page.getByTestId('climber-header')).toBeVisible();
    expect(page.url()).toContain('localhost');

    // Erneut ins Studio und per Browser-Zurück verlassen
    await page.getByTestId('climber-switch-workspace-btn').click();
    await page.getByTestId('role-gateway-setter-btn').click();
    await expect(page.getByTestId('studio-back-to-climber-btn')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('climber-header')).toBeVisible();
    expect(page.url()).toContain('localhost');
  });
});
