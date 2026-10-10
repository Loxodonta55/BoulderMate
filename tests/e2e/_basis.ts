import { expect, Page } from '@playwright/test';

/** Gemeinsame Schritte für SPEC-032 bis SPEC-043. Supabase ist immer blockiert. */
export async function blockSupabase(page: Page) {
  await page.context().route(/supabase\.co/, route => route.abort());
}

export async function loginHans(page: Page) {
  await blockSupabase(page);
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

export async function loginBorisAs(page: Page, area: 'climber' | 'admin') {
  await blockSupabase(page);
  await page.goto('/');
  await page.getByTestId('quick-login-boris').click();
  await page.getByTestId(`role-gateway-${area}-btn`).click();
  await expect(page.getByTestId(area === 'admin' ? 'admin-tabs' : 'climber-wall-view')).toBeVisible();
}

export function tab(isMobile: boolean | undefined, name: 'wall' | 'stats' | 'treff') {
  return isMobile ? `mobile-tab-${name}` : `tab-${name}`;
}

export async function openMe(page: Page, isMobile: boolean | undefined) {
  await page.getByTestId(tab(isMobile, 'stats')).click();
  await expect(page.getByTestId('user-profile-view')).toBeVisible();
}

export async function openSettings(page: Page, isMobile: boolean | undefined) {
  await openMe(page, isMobile);
  await page.getByTestId('open-settings-btn').click();
  await expect(page.getByTestId('settings-view')).toBeVisible();
}

/** Erster Boulder mit Filter «Offen»; gibt die ID zurück. */
export async function openFirstOpenBoulder(page: Page): Promise<string> {
  await page.getByTestId('filter-chip-open').click();
  for (let i = 0; i < 10; i++) {
    const row = page.locator('[data-testid^="route-row-"]').first();
    if (await row.isVisible().catch(() => false)) {
      const id = (await row.getAttribute('data-testid'))!.replace('route-row-', '');
      await row.click();
      await expect(page.getByTestId('boulder-sheet')).toBeVisible();
      return id;
    }
    await page.getByTestId('sector-next-btn').click();
  }
  throw new Error('Kein offener Boulder gefunden');
}
