import { test, expect, Page } from '@playwright/test';
import { openMe, openSettings } from './_basis';

/**
 * SPEC-054: Vertriebspartner – Seite «Partner werden», Partner-Bereich, Halle betreuen, Texte, Admin.
 * Läuft rein lokal: Supabase ist blockiert, das Verzeichnis kommt aus den Beispiel-Hallen (wie SPEC-053).
 */

const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

/** Beispiel-Hallen als «letzter Stand» – greift, wenn das Verzeichnis aus Supabase geladen werden soll (blockiert) */
const DIRECTORY_CACHE = [
  { id: 'vz-demo-winterthur', name: 'Boulderhalle Winterthur (Beispiel)', ort: 'Winterthur', lat: 47.4999, lng: 8.7241, email: 'info@example.com', pruefStatus: 'ok', gymId: null, ausgeblendet: false },
  { id: 'vz-demo-bern', name: 'Kletterhalle Bern (Beispiel)', ort: 'Bern', lat: 46.9466, lng: 7.4219, pruefStatus: 'ok', gymId: null, ausgeblendet: false },
];

async function stubNetwork(page: Page) {
  const ctx = page.context();
  await ctx.route(/supabase\.co/, route => route.abort());
  await ctx.route(/tile\.openstreetmap\.org/, route => route.fulfill({ status: 200, contentType: 'image/png', body: TILE }));
  await ctx.addInitScript(rows => {
    if (!localStorage.getItem('bouldermate_hallen_verzeichnis_cache_v1')) {
      localStorage.setItem('bouldermate_hallen_verzeichnis_cache_v1', JSON.stringify(rows));
    }
  }, DIRECTORY_CACHE);
}

async function login(page: Page, who: 'hans' | 'boris') {
  await page.goto('/');
  await page.getByTestId(`quick-login-${who}`).click();
  // Plattform-Admin bekommt die Bereichswahl; als Kletterer weiter
  if (who === 'boris') await page.getByTestId('role-gateway-climber-btn').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

test.describe('SPEC-054: Vertriebspartner', () => {
  test('Link ?partner öffnet ohne Login die Seite «Partner werden»', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/?partner');
    const p = page.getByTestId('partner-page');
    await expect(p).toBeVisible();
    await expect(p.getByTestId('partner-page-eine-stufe')).toContainText('kein Schneeballsystem');
    await expect(p.getByTestId('partner-page-beispiel')).toContainText('CHF 300 (ab der 3. Halle CHF 400)');
    await expect(p.getByTestId('partner-page-selbstaendig')).toContainText('Keine Rechts- oder Steuerberatung.');
    await expect(page).not.toHaveURL(/partner/);
    await expect(p.getByTestId('partner-page-become')).toHaveText('Anmelden und Partner werden');
    await p.getByTestId('partner-page-become').click();
    await expect(page.getByTestId('partner-page')).toHaveCount(0);
    await expect(page.getByTestId('login-modal-close-btn')).toBeVisible();
  });

  test('Partner werden, Halle betreuen, Texte mit Offenlegung, «Im Gespräch»', async ({ page, isMobile }) => {
    await stubNetwork(page);
    await login(page, 'hans');
    await openMe(page, isMobile);

    const section = page.getByTestId('partner-section');
    await section.getByTestId('partner-open-form').click();
    await expect(section.getByTestId('partner-join')).toBeDisabled();
    await section.getByTestId('partner-rolle-stammgast').click();
    await section.getByTestId('partner-region').fill('Winterthur');
    await section.getByTestId('partner-adult').check();
    await section.getByTestId('partner-join').click();
    await expect(section.getByTestId('partner-dashboard')).toBeVisible();
    await expect(section.getByTestId('partner-satz')).toHaveText('30 %');
    await expect(section.getByTestId('partner-empty')).toBeVisible();

    // Halle auf der Karte übernehmen
    await section.getByTestId('partner-open-finder').click();
    await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
    await page.getByTestId('gym-row-vz-demo-winterthur').click();
    await page.getByTestId('gym-card-partner-take').click();
    await expect(page.getByTestId('gym-card-partner-mine')).toContainText('Von dir betreut bis');

    await page.getByTestId('gym-card-partner-texte').click();
    const kit = page.getByTestId('partner-kit-sheet');
    await expect(kit.getByTestId('partner-kit-email-text')).toContainText('Ich bin BoulderMate-Partner und bekomme eine Provision');
    await expect(kit.getByTestId('partner-kit-nachricht-text')).toContainText('ref=BM-');
    await expect(kit.getByTestId('partner-kit-leitfaden-text')).toContainText('Nach der Hallenleitung fragen');
    await kit.getByTestId('partner-kit-close').click();
    await page.getByTestId('gym-finder-close').click();

    // «Ich» zeigt die Halle mit Schritt 1 von 5; «Im Gespräch» → Schritt 2
    const row = section.locator('[data-testid^="partner-halle-status-"]').first();
    await expect(row).toContainText('Von dir betreut');
    await expect(row).toContainText('Schritt 1 von 5');
    await section.locator('[data-testid^="partner-halle-gespraech-"]').first().click();
    await expect(row).toContainText('Schritt 2 von 5');
    await expect(section.locator('[data-testid^="partner-einwand-"]')).toHaveCount(7);
  });

  test('Allgemeiner Partner-Link ?ref= ohne Halle öffnet «Für Hallen» mit «Ich klettere – Halle suchen»', async ({ page }) => {
    await stubNetwork(page);
    await page.goto('/?ref=BM-K7Q4AC');
    const p = page.getByTestId('fuer-hallen-page');
    await expect(p).toBeVisible();
    await expect(p.getByTestId('fuer-hallen-name')).toContainText('BoulderMate für eure Halle');
    await expect(p.getByTestId('fuer-hallen-ref-note')).toContainText('BoulderMate-Partner');
    await expect(p.getByTestId('fuer-hallen-code')).toHaveText('BM-K7Q 4AC');
    await p.getByTestId('fuer-hallen-find-gym').click();
    await expect(page.getByTestId('fuer-hallen-page')).toHaveCount(0);
    await expect(page.getByTestId('gym-finder-sheet')).toBeVisible();
  });

  test('Plattform-Admin sieht «Vertrieb» in den Einstellungen', async ({ page, isMobile }) => {
    await stubNetwork(page);
    await login(page, 'boris');
    await openSettings(page, isMobile);
    await page.getByTestId('settings-vertrieb').click();
    await expect(page.getByTestId('vertrieb-sheet')).toBeVisible();
    await expect(page.getByTestId('vertrieb-offen')).toContainText('Offen zur Auszahlung');
  });
});
