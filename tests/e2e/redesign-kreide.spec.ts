import { test, expect, Page } from '@playwright/test';

/**
 * SPEC-020 §2.3 Palette «Kreide» + Text-Diät (06.10.2026)
 * Läuft auf allen Projekten (Desktop, Pixel 7, iPhone 15) gegen den Dev-Server.
 * Wand, «Ich»-Seite und Boulder-Detail testet tests/e2e/climber-ux.spec.ts (SPEC-022).
 */

async function cssVar(page: Page, name: string): Promise<string> {
  return page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toUpperCase(), name);
}

test.describe('SPEC-020 Redesign «Kreide»', () => {
  test('hell: Kreide-Tokens, Graphit-Button, kein Systemblau', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    expect(await cssVar(page, '--bm-bg')).toBe('#F4F2EE');
    expect(await cssVar(page, '--bm-accent')).toBe('#1A1918');
    expect(await cssVar(page, '--bm-star')).toBe('#8C6A2A');

    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe('rgb(244, 242, 238)');

    const ctaBg = await page.getByTestId('hero-login-btn').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(ctaBg).toBe('rgb(26, 25, 24)');
  });

  test('dunkel: Kreide-Tokens folgen prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    expect(await cssVar(page, '--bm-bg')).toBe('#121110');
    expect(await cssVar(page, '--bm-accent')).toBe('#F4F2EE');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe('rgb(18, 17, 16)');
  });
});

test.describe('SPEC-020 Text-Diät', () => {
  test('Landing passt ohne Scrollen auf einen Screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Erkenne, welche Boulder zu dir passen und beliebt sind.')).toBeVisible();
    await expect(page.getByText('Perlen finden')).toBeVisible();
    await expect(page.getByText('Erfolge tracken')).toBeVisible();
    await expect(page.getByText('Know-how teilen')).toBeVisible();
    await expect(page.getByText('Tracke deine Erfolge und teile dein Know-how.')).toBeVisible();
    await expect(page.getByTestId('hero-login-btn')).toBeInViewport();

    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
