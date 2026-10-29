import { test, expect, Page } from '@playwright/test';
import { openMe } from './_basis';

/**
 * SPEC-053: «Noch nicht dabei» – alle Hallen zeigen und Hallen empfehlen.
 * Läuft rein lokal: Supabase ist blockiert, das Verzeichnis kommt aus den Beispiel-Hallen (Entwicklung).
 */

const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function stubNetwork(page: Page) {
  const ctx = page.context();
  await ctx.route(/supabase\.co/, route => route.abort());
  await ctx.route(/tile\.openstreetmap\.org/, route => route.fulfill({ status: 200, contentType: 'image/png', body: TILE }));
}

async function loginAsHans(page: Page) {
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

async function openFinder(page: Page) {
  await page.getByTestId('header-gym-select').click();
  await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
  await expect(page.getByTestId('gym-finder-directory-heading')).toBeVisible();
}

test.describe('SPEC-053: Noch nicht dabei', () => {
  test('Liste und Karte zeigen Verzeichnis-Hallen getrennt; Schalter «Nur aktive Hallen» wird gemerkt', async ({ page }) => {
    await stubNetwork(page);
    await loginAsHans(page);
    await openFinder(page);

    await expect(page.getByTestId('gym-row-not-yet-vz-demo-bern')).toContainText('Noch nicht dabei');
    await expect(page.locator('[data-testid^="gym-pin-vz-"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="gym-pin-vz-demo-bern"]')).toHaveAttribute('data-registered', 'false');
    await expect(page.getByTestId('gym-row-vz-demo-unsicher')).toHaveCount(0);

    await page.getByTestId('gym-finder-only-active').check();
    await expect(page.getByTestId('gym-row-vz-demo-bern')).toHaveCount(0);
    await expect(page.locator('[data-testid^="gym-pin-vz-"]')).toHaveCount(0);

    // Nach dem Neuladen bleibt der Schalter an; Suche zeigt die versteckten Treffer an
    await page.reload();
    await page.getByTestId('header-gym-select').click();
    await expect(page.getByTestId('gym-finder-only-active')).toBeChecked();
    await page.getByTestId('gym-finder-search').fill('Bern');
    await expect(page.getByTestId('gym-finder-show-directory')).toContainText('+ 1 Hallen noch nicht dabei');
    await page.getByTestId('gym-finder-show-directory').click();
    await expect(page.getByTestId('gym-row-vz-demo-bern')).toBeVisible();
  });

  test('Hallen-Blatt: wünschen, «Mit der Halle reden», Code ab 18, QR an der Theke; «Ich» zeigt alles', async ({ page, isMobile }) => {
    await stubNetwork(page);
    await loginAsHans(page);
    await openFinder(page);

    await page.getByTestId('gym-row-vz-demo-winterthur').click();
    const card = page.getByTestId('gym-card-vz-demo-winterthur');
    await expect(card).toContainText('Noch keine Routen in BoulderMate.');
    await expect(card.getByTestId('gym-card-select')).toHaveCount(0);
    await expect(page.getByTestId('gym-card-wishes')).toContainText('11 Kletterer wünschen sich BoulderMate hier');

    await page.getByTestId('gym-card-wish').click();
    await expect(page.getByTestId('gym-card-wished')).toContainText('Gewünscht');
    await expect(page.getByTestId('gym-card-wishes')).toContainText('12 Kletterer');

    await page.getByTestId('gym-card-talk').click();
    const sheet = page.getByTestId('halle-reden-sheet');
    await expect(sheet.getByTestId('halle-reden-dankeschoen')).toContainText('kein Schneeballsystem');
    await expect(sheet.getByTestId('halle-reden-text')).toContainText('Hallo zusammen!');
    await expect(sheet.getByTestId('halle-reden-create-code')).toBeDisabled();
    await sheet.getByTestId('halle-reden-adult').check();
    await sheet.getByTestId('halle-reden-create-code').click();
    await expect(sheet.getByTestId('halle-reden-code-value')).toHaveText(/^BM-[A-Z0-9]{3} [A-Z0-9]{3}$/);
    await expect(sheet.getByTestId('halle-reden-text')).toContainText('ref=BM-');

    await sheet.getByTestId('halle-reden-qr').click();
    await expect(page.getByTestId('halle-qr-fullscreen')).toBeVisible();
    await expect(page.getByTestId('halle-qr-svg')).toBeVisible();
    const box = await page.getByTestId('halle-qr-svg').boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(259);
    await page.getByTestId('halle-qr-close').click();
    await sheet.getByTestId('halle-reden-close').click();
    await page.getByTestId('gym-finder-close').click();

    // «Ich» → «Halle empfehlen»
    await openMe(page, isMobile);
    const section = page.getByTestId('halle-empfehlen-section');
    await expect(section.getByTestId('halle-empfehlen-code')).toHaveText(/^BM-/);
    await expect(section.getByTestId('halle-empfehlen-wished')).toContainText('Boulderhalle Winterthur');
  });

  test('Geteilter Link öffnet ohne Login die Seite «Für Hallen»', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/?halle=vz-demo-winterthur&ref=BM-K7Q4AC');
    const p = page.getByTestId('fuer-hallen-page');
    await expect(p).toBeVisible();
    await expect(p.getByTestId('fuer-hallen-name')).toContainText('Boulderhalle Winterthur (Beispiel)');
    await expect(p.getByTestId('fuer-hallen-wishes')).toContainText('11 Kletterer');
    await expect(p.getByTestId('fuer-hallen-code')).toHaveText('BM-K7Q 4AC');
    await expect(p.getByTestId('fuer-hallen-ref-note')).toContainText('euch kostet das nichts extra');
    // Parameter verschwinden aus der Adresszeile
    await expect(page).not.toHaveURL(/halle=/);

    await p.getByTestId('fuer-hallen-demo').click();
    await expect(page.getByTestId('fuer-hallen-page')).toHaveCount(0);
    await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
  });

  test('Gast: «Anmelden und wünschen» öffnet die Anmeldung', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/');
    await page.getByTestId('landing-show-gyms').click();
    await page.getByTestId('gym-row-vz-demo-bern').click();
    await expect(page.getByTestId('gym-card-wish')).toHaveText('Anmelden und wünschen');
    await page.getByTestId('gym-card-wish').click();
    await expect(page.getByTestId('login-modal-close-btn')).toBeVisible();
  });
});
