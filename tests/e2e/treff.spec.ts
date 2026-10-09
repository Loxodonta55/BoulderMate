import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-028: Treff – «Wer ist da?»
 * Läuft rein lokal (Test-Personen speichern Treff im Browser), Supabase ist blockiert.
 */

async function blockSupabase(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
}

async function loginHans(page: Page) {
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

async function loginSchrauber(page: Page) {
  await page.getByTestId('quick-login-schrauber').click();
  const gateway = page.getByTestId('role-gateway-climber-btn');
  await expect(gateway.or(page.getByTestId('climber-wall-view')).first()).toBeVisible();
  if (await gateway.isVisible()) await gateway.click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

async function loginBoris(page: Page) {
  await page.getByTestId('quick-login-boris').click();
  const gateway = page.getByTestId('role-gateway-climber-btn');
  await expect(gateway).toBeVisible();
  await gateway.click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

function tab(isMobile: boolean, name: 'wall' | 'stats' | 'treff') {
  return isMobile ? `mobile-tab-${name}` : `tab-${name}`;
}

async function logout(page: Page, isMobile: boolean) {
  await page.getByTestId(tab(isMobile, 'stats')).click();
  await page.getByTestId('open-settings-btn').click();
  await page.getByTestId('settings-logout').click();
  await expect(page.getByTestId('landing-show-treff')).toBeVisible();
}

async function checkInNow(page: Page) {
  await page.getByTestId('treff-now').click();
  const consent = page.getByTestId('treff-consent');
  if (await consent.isVisible().catch(() => false)) {
    await page.getByTestId('treff-consent-age').check();
    await page.getByTestId('treff-consent-ok').click();
  }
  await expect(page.getByTestId('treff-mine')).toBeVisible();
}

test.describe('SPEC-028: Treff – Wer ist da?', () => {
  test.beforeEach(async ({ page }) => {
    await blockSupabase(page);
  });

  test('Wand bleibt Start; Treff ist der dritte Tab ohne Zahl', async ({ page, isMobile }) => {
    await loginHans(page);
    if (isMobile) {
      const labels = await page.getByTestId('mobile-bottom-nav').getByRole('button').allTextContents();
      expect(labels).toEqual(['Wand', 'Ich', 'Treff']);
    }
    await expect(page.getByTestId(tab(!!isMobile, 'wall'))).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId(tab(!!isMobile, 'treff'))).toHaveText('Treff');

    // SPEC-022: das Wandfoto ist weiterhin das erste Element der Wand
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByTestId('treff-view')).toHaveCount(0);
  });

  test('A trägt sich ein, B kommt auch, B blendet A aus', async ({ page, isMobile }) => {
    const mobile = !!isMobile;
    await loginHans(page);
    await page.getByTestId(tab(mobile, 'treff')).click();
    await expect(page.getByTestId('treff-view')).toBeVisible();

    // Hinweis + Häkchen
    await page.getByTestId('treff-now').click();
    await expect(page.getByTestId('treff-consent')).toContainText('Andere sehen deinen Spitznamen');
    await expect(page.getByTestId('treff-consent-ok')).toBeDisabled();
    await page.getByTestId('treff-consent-age').check();
    await page.getByTestId('treff-consent-ok').click();
    await expect(page.getByTestId('treff-mine')).toContainText('Heute');

    // Lesbarkeit: große Uhrzeit und große Knöpfe
    const timeSize = await page.getByTestId('treff-mine').locator('span.text-\\[20px\\]').first().evaluate(el => getComputedStyle(el).fontSize);
    expect(parseFloat(timeSize)).toBeGreaterThanOrEqual(20);
    const btn = await page.getByTestId('treff-now').boundingBox();
    expect(btn!.height).toBeGreaterThanOrEqual(52);

    await logout(page, mobile);
    await loginSchrauber(page);
    await page.getByTestId(tab(mobile, 'treff')).click();
    const section = page.getByTestId('treff-section-now');
    await expect(section).toContainText('HansDereinfacheKletterer');
    await section.locator('[data-testid^="treff-row-"]').first().click();

    const sheet = page.getByTestId('treff-entry-sheet');
    await page.getByTestId('treff-join').click();
    await page.getByTestId('treff-consent-age').check();
    await page.getByTestId('treff-consent-ok').click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('treff-mine')).toBeVisible();

    await section.locator('[data-testid^="treff-row-"]').first().click();
    await expect(page.getByTestId('treff-entry-companions')).toContainText('Auch da: Du');

    await page.getByTestId('treff-block').click();
    await page.getByTestId('confirm-ok').click();
    await expect(section).toContainText('Noch niemand eingetragen.');
  });

  test('Melden → Plattform-Admin löscht den Eintrag', async ({ page, isMobile }) => {
    const mobile = !!isMobile;
    await loginHans(page);
    await page.getByTestId(tab(mobile, 'treff')).click();
    await checkInNow(page);
    await logout(page, mobile);

    await loginSchrauber(page);
    await page.getByTestId(tab(mobile, 'treff')).click();
    await page.getByTestId('treff-section-now').locator('[data-testid^="treff-row-"]').first().click();
    await page.getByTestId('treff-report').click();
    await page.getByTestId('treff-report-unangemessen').click();
    await expect(page.getByTestId('treff-report-sheet')).toHaveCount(0);
    await logout(page, mobile);

    await loginBoris(page);
    await page.getByTestId(tab(mobile, 'stats')).click();
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-treff-reports').click();
    const reports = page.getByTestId('treff-reports-sheet');
    await expect(reports).toContainText('Unangemessen');
    await expect(reports).toContainText('HansDereinfacheKletterer');
    await reports.locator('[data-testid^="treff-report-delete-"]').first().click();
    await expect(reports).toContainText('Keine offenen Meldungen.');
  });

  test('Gast: Landing «Wer ist heute da?» zeigt Einträge ohne Namen', async ({ page, isMobile }) => {
    const mobile = !!isMobile;
    await loginHans(page);
    await page.getByTestId(tab(mobile, 'treff')).click();
    await checkInNow(page);
    await logout(page, mobile);

    await page.getByTestId('landing-show-treff').click();
    const sheet = page.getByTestId('treff-guest-sheet');
    await expect(sheet.getByTestId('treff-guest-now')).toContainText('Jemand');
    await expect(sheet).not.toContainText('HansDereinfacheKletterer');
    await sheet.getByTestId('treff-login-cta').click();
    await expect(sheet).toHaveCount(0);
  });

  test('Einstellungen: Treff ausblenden und wieder einblenden', async ({ page, isMobile }) => {
    const mobile = !!isMobile;
    await loginHans(page);
    await page.getByTestId(tab(mobile, 'stats')).click();
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-treff-hide').click();
    await expect(page.getByTestId(tab(mobile, 'treff'))).toHaveCount(0);
    await page.getByTestId('settings-treff-hide').click();
    await expect(page.getByTestId(tab(mobile, 'treff'))).toBeVisible();
  });
});
