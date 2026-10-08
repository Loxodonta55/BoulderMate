import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-025: Halle suchen – Karte aller eingetragenen Hallen.
 * Läuft rein lokal: Supabase ist blockiert, Kartenkacheln und Adresssuche werden lokal beantwortet.
 */

// 1×1 Pixel PNG als Ersatz für OpenStreetMap-Kacheln (kein Netz nötig, stabile Tests)
const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function stubNetwork(page: Page, opts: { tiles?: 'ok' | 'fail' } = {}) {
  const ctx = page.context();
  await ctx.route(/supabase\.co/, route => route.abort());
  await ctx.route(/tile\.openstreetmap\.org/, route =>
    opts.tiles === 'fail' ? route.abort() : route.fulfill({ status: 200, contentType: 'image/png', body: TILE })
  );
  await ctx.route(/nominatim\.openstreetmap\.org/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ lat: '46.948', lon: '7.4474' }]) })
  );
}

async function loginAsHans(page: Page) {
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

async function openFinder(page: Page) {
  await page.getByTestId('header-gym-select').click();
  await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
  await expect(page.getByTestId('gym-finder-map')).toBeVisible();
}

test.describe('SPEC-025: Halle suchen', () => {
  test('Hallenname → Karte mit Pins → Pin → «Zur Wand» wechselt die Halle', async ({ page }) => {
    await stubNetwork(page);
    await loginAsHans(page);
    await expect(page.getByTestId('header-gym-select')).toContainText('6a plus');

    await openFinder(page);
    await expect(page.locator('[data-testid^="gym-pin-"]')).toHaveCount(2);
    await expect(page.getByTestId('gym-row-gym-6a-plus')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByText('OpenStreetMap')).toBeVisible();

    await page.getByTestId('gym-pin-gym-minimum-zh').click();
    const card = page.getByTestId('gym-card-gym-minimum-zh');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Boulder');
    await expect(page.getByTestId('gym-card-navigate')).toHaveAttribute('href', /47\.3829%2C8\.5079/);

    await page.getByTestId('gym-card-select').click();
    await expect(page.getByTestId('gym-finder-sheet')).toHaveCount(0);
    await expect(page.getByTestId('header-gym-select')).toContainText('Minimum');
  });

  test('«In meiner Nähe» sortiert nach Entfernung', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 47.5, longitude: 8.72 }); // Winterthur
    await stubNetwork(page);
    await loginAsHans(page);
    await openFinder(page);

    await page.getByTestId('gym-finder-locate').click();
    await expect(page.getByTestId('gym-row-distance-gym-6a-plus')).toContainText('km');
    const first = page.getByTestId('gym-finder-list').locator('[data-testid^="gym-row-gym-"]').first();
    await expect(first).toHaveAttribute('data-testid', 'gym-row-gym-6a-plus');
    await expect(page.getByTestId('gym-map-user')).toBeVisible();
  });

  test('Suche «zür» zeigt nur Minimum', async ({ page }) => {
    await stubNetwork(page);
    await loginAsHans(page);
    await openFinder(page);
    await page.getByTestId('gym-finder-search').fill('zür');
    await expect(page.getByTestId('gym-row-gym-minimum-zh')).toBeVisible();
    await expect(page.getByTestId('gym-row-gym-6a-plus')).toHaveCount(0);
    await expect(page.locator('[data-testid^="gym-pin-"]')).toHaveCount(1);
  });

  test('Kacheln laden nicht: «Karte nicht verfügbar», Liste funktioniert', async ({ page }) => {
    await stubNetwork(page, { tiles: 'fail' });
    await loginAsHans(page);
    await openFinder(page);
    await expect(page.getByTestId('gym-map-unavailable')).toBeVisible();
    await page.getByTestId('gym-row-gym-minimum-zh').click();
    await expect(page.getByTestId('gym-card-gym-minimum-zh')).toBeVisible();
  });

  test('Gast: Landing «Hallen ansehen» öffnet die Karte, «Zur Wand» führt zur Anmeldung', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/');
    await page.getByTestId('landing-show-gyms').click();
    await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
    await expect(page.locator('[data-testid^="gym-pin-"]')).toHaveCount(2);
    await page.getByTestId('gym-row-gym-6a-plus').click();
    await page.getByTestId('gym-card-select').click();
    await expect(page.getByTestId('gym-finder-sheet')).toHaveCount(0);
    await expect(page.getByTestId('login-modal-close-btn')).toBeVisible();
  });

  // Der Standort-Editor (GymLocationEditor) steht seit SPEC-023 im Admin-Tab «Halle».
  test('Admin: Adresse suchen → speichern → Pin erscheint an neuer Stelle', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/');
    await page.getByTestId('quick-login-boris').click();
    // SPEC-023: Admin-Konsole → Halle 6a plus wählen → Tab «Halle»
    await page.getByTestId('role-gateway-admin-btn').click();
    await page.getByTestId('admin-gym-button').click();
    await page.getByTestId('admin-gym-row-gym-6a-plus').click();
    await page.getByTestId('admin-tab-gym').click();
    const editor = page.getByTestId('gym-location-editor');
    await expect(editor).toBeVisible();
    await page.getByTestId('gym-location-query').fill('Bundesplatz 3, Bern');
    await page.getByTestId('gym-geocode-btn').click();
    await expect(page.getByTestId('gym-location-coords')).toContainText('46.94800');
    await page.getByTestId('gym-location-save').click();
    await expect(page.getByTestId('gym-location-message')).toContainText('gespeichert');

    // Zurück in die Kletterer-App: Navigation zur Halle zeigt die neuen Koordinaten
    await page.getByTestId('admin-switch-workspace-btn').click();
    await page.getByTestId('role-gateway-climber-btn').click();
    await openFinder(page);
    await page.getByTestId('gym-row-gym-6a-plus').click();
    await expect(page.getByTestId('gym-card-navigate')).toHaveAttribute('href', /46\.948%2C7\.4474/);
  });
});
