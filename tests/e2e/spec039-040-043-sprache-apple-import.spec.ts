import { test, expect, Route } from '@playwright/test';
import { loginHans, openMe, openSettings, tab } from './_basis';

/** SPEC-039 Englisch, SPEC-040 Login mit Apple, SPEC-043 Import alter Ticks. */
test.describe('SPEC-039: Englisch', () => {
  test('Umschalten in den Einstellungen wirkt sofort und bleibt nach dem Neuladen', async ({ page, isMobile }) => {
    await loginHans(page);
    await openSettings(page, isMobile);
    await page.getByTestId('settings-lang-en').click();
    await expect(page.getByTestId(tab(isMobile, 'stats'))).toHaveText(/Me/);
    await page.reload();
    await expect(page.getByTestId(tab(isMobile, 'wall'))).toHaveText(/Wall/);
    await page.getByTestId(tab(isMobile, 'wall')).click();
    await expect(page.getByTestId('filter-chip-all')).toHaveText(/All/);
    await expect(page.getByTestId('filter-chip-open')).toHaveText(/Open/);
    await openSettings(page, isMobile);
    await page.getByTestId('settings-lang-de').click();
    await expect(page.getByTestId(tab(isMobile, 'stats'))).toHaveText(/Ich/);
  });
});

test.describe('SPEC-039: Gerätesprache Englisch', () => {
  test.use({ locale: 'en-US' });
  test('Ohne Einstellung folgt die App dem Gerät', async ({ page, isMobile }) => {
    await loginHans(page);
    await expect(page.getByTestId(tab(isMobile, 'wall'))).toHaveText(/Wall/);
    await expect(page.locator('html')).toHaveAttribute('lang', /en/);
  });
});

test.describe('SPEC-040: Login mit Apple', () => {
  async function mockSettings(page: import('@playwright/test').Page, apple: boolean) {
    await page.context().route(/supabase\.co/, (route: Route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/auth/v1/settings') {
        return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify({ external: { apple, google: false, email: true } }) });
      }
      return route.abort();
    });
  }

  test('Knopf erscheint nur, wenn Apple in Supabase eingeschaltet ist', async ({ page }) => {
    await mockSettings(page, true);
    await page.goto('/');
    await expect(page.getByTestId('btn-apple-login')).toHaveText(/Mit Apple anmelden/);
  });

  test('Ausgeschaltet: kein Apple-Knopf', async ({ page }) => {
    await mockSettings(page, false);
    await page.goto('/');
    await expect(page.getByTestId('quick-login-hans')).toBeVisible();
    await expect(page.getByTestId('btn-apple-login')).toHaveCount(0);
  });
});

test.describe('SPEC-043: Import', () => {
  test('Eigene CSV importieren: Pyramide zeigt «importiert», doppelt wird übersprungen, Löschen räumt auf', async ({ page, isMobile }) => {
    await loginHans(page);
    const csv = '﻿Datum;Halle;Sektor;Nummer;Boulder;Farbe;Grad;Stil;Versuche\n2025-03-01 18:00;Alte Halle;Dach;1;;Rot;6b;Flash;1\n2025-03-02 18:00;Alte Halle;Dach;2;;Blau;6c;Top;3\n2025-03-03 18:00;Alte Halle;Dach;3;;Gelb;7a;Projekt;5\n';
    const file = { name: 'ticks.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') };
    await openSettings(page, isMobile);
    await page.getByTestId('settings-import-file').setInputFiles(file);
    await expect(page.getByText(/2 Ticks importiert/)).toBeVisible();
    await expect(page.getByText(/1 Projekte nicht übernommen/)).toBeVisible();
    await page.getByTestId('settings-import-file').setInputFiles({ ...file, name: 'ticks2.csv' });
    await expect(page.getByText(/0 Ticks importiert, 2 übersprungen/)).toBeVisible();

    await page.getByTestId('settings-back').click();
    await openMe(page, isMobile);
    await page.getByTestId('me-scope').getByText('Alle Hallen').click();
    await expect(page.getByTestId('pyramid-imported-note')).toContainText('2 importierte');

    await openSettings(page, isMobile);
    page.once('dialog', d => d.accept());
    await page.getByTestId('settings-import-delete').click();
    const confirm = page.getByRole('button', { name: /^Löschen$/ });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await expect(page.getByTestId('settings-import-delete')).toHaveCount(0);
  });
});
