import { test, expect } from '@playwright/test';
import { loginHans, openFirstOpenBoulder, openMe, openSettings } from './_basis';

/** SPEC-033 Sichtbarkeit + CSV, SPEC-035 Projekte/Versuche, SPEC-037 Statistik-Verlauf. */
test.describe('SPEC-033/035/037: Ich', () => {
  test('SPEC-033: Namens-Schalter zeigt «Jemand», CSV-Export lädt eine Tabelle', async ({ page, isMobile }) => {
    await loginHans(page);
    await openSettings(page, isMobile);
    const sw = page.getByTestId('settings-show-in-lists');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('visibility-preview-name')).toHaveText('Jemand');

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('settings-export-csv').click()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const body = await (await download.createReadStream()).toArray();
    expect(Buffer.concat(body).toString('utf8')).toContain('Datum;Halle;Sektor');
  });

  test('SPEC-035: «+1» macht ein Projekt, das unter «Ich» erscheint', async ({ page, isMobile }) => {
    await loginHans(page);
    const id = await openFirstOpenBoulder(page);
    await page.getByTestId('attempt-plus-btn').click();
    await page.getByTestId('attempt-plus-btn').click();
    await expect(page.getByTestId('attempts-count')).toContainText('2');
    await page.getByTestId('boulder-sheet-close').click();
    await openMe(page, isMobile);
    await expect(page.getByTestId('my-projects-section')).toBeVisible();
    await expect(page.getByTestId(`my-project-${id}`)).toBeVisible();
  });

  test('SPEC-037: Verlauf und Deep Dive «Dein Stil im Verlauf»', async ({ page, isMobile }) => {
    await loginHans(page);
    await openFirstOpenBoulder(page);
    await page.getByTestId('log-flash-btn').click();
    await openMe(page, isMobile);
    await expect(page.getByTestId('weekly-section')).toBeVisible();
    await page.getByTestId('me-open-deep-dive').click();
    await expect(page.getByTestId('deep-dive-trend').or(page.getByTestId('deep-dive-trend-empty')).first()).toBeVisible();
  });
});
