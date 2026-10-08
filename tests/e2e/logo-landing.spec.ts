import { test, expect } from '@playwright/test';

/** SPEC-011 AC-8: Tipp aufs BoulderMate-Logo oben links führt zur Landing Page. */
test.describe('SPEC-011 Logo führt zur Landing Page', () => {
  test('angemeldet: Logo öffnet Landing, «Weiter zur App» führt zurück', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-header')).toBeVisible();

    const brand = page.getByTestId('header-brand-btn');
    await expect(brand).toBeVisible();
    const box = await brand.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await brand.click();

    await expect(page.getByText('Erkenne, welche Boulder zu dir passen und beliebt sind.')).toBeVisible();
    await expect(page.getByTestId('climber-header')).toHaveCount(0);
    await expect(page.getByTestId('hero-login-btn')).toHaveCount(0);

    await page.getByTestId('hero-continue-btn').click();
    await expect(page.getByTestId('climber-header')).toBeVisible();
  });
});
