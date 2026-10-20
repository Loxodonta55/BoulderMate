import { test, expect, Page } from '@playwright/test';
import { loginHans, openMe, openSettings, tab } from './_basis';

/**
 * SPEC-051 «Deine Challenge heute» (lokal, Supabase blockiert).
 * Vorbereitung im Browser: 5 Kraft-Routen in 5c als Tops für Hans, 2 Kraft-Routen in 6a+ als mögliche Challenge.
 */
async function setupChallenge(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const bs: any = await import('/src/lib/batchBoulderService.ts');
    const rs: any = await import('/src/lib/ratingAndAscentService.ts');
    const sectorIds = new Set(bs.getSectors('gym-6a-plus').map((s: any) => s.id));
    const active = bs.getWallBoulders().filter((b: any) => b.status === 'active' && sectorIds.has(b.sectorId));
    const power = { maximalkraft: 5, kraft: 5, kraftausdauer: 3, technik: 2, balance: 2, koordination: 4, flexibilitaet: 2 };
    const balanced = { maximalkraft: 3, kraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 };
    // Alle übrigen Routen neutral und weit weg vom Zielgrad
    for (const b of active) bs.updateBoulderDetails(b.id, { fontGrade: '8a', radar: balanced });
    const tops = active.slice(0, 5);
    const targets = active.slice(5, 7);
    for (const b of tops) {
      bs.updateBoulderDetails(b.id, { fontGrade: '5c', radar: power });
      rs.logAscent('hans-kletterer', 'Hans', b.id, 'top');
    }
    for (const b of targets) bs.updateBoulderDetails(b.id, { fontGrade: '6a+', radar: power });
    window.dispatchEvent(new CustomEvent('bouldermate:boulders_updated'));
    return targets.map((b: any) => b.id);
  });
}

async function openWall(page: Page, isMobile: boolean | undefined) {
  await page.getByTestId(tab(isMobile, 'wall')).click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
}

test.describe('SPEC-051: Deine Challenge heute', () => {
  test('«Ich»: eingeklappte Zeile, Begründung, andere zeigen, Route öffnen, Top = «Challenge geschafft!»', async ({ page, isMobile }) => {
    await loginHans(page);
    const targets = await setupChallenge(page);
    await openMe(page, isMobile);

    const toggle = page.getByTestId('challenge-today-toggle');
    await expect(toggle).toContainText('Deine Challenge heute');
    await expect(page.getByTestId('challenge-today-subtitle')).toContainText('6a+');
    await expect(page.getByTestId('challenge-today-details')).toHaveCount(0);

    await toggle.click();
    await expect(page.getByTestId('challenge-today-reasons')).toContainText('Liegt dir: Maximalkraft 5');
    await expect(page.getByTestId('challenge-today-reasons')).toContainText('über deinem sicheren Grad 5c');

    const before = await page.getByTestId('challenge-today-subtitle').textContent();
    await page.getByTestId('challenge-today-swap').click();
    await expect(page.getByTestId('challenge-today-subtitle')).not.toHaveText(before || '');
    await expect(page.getByTestId('challenge-today-swap')).toHaveCount(0); // nur 2 Kandidatinnen

    await page.getByTestId('challenge-today-open').click();
    await expect(page.getByTestId('boulder-sheet')).toBeVisible();
    await expect(page.getByTestId('challenge-today-sheet-line')).toContainText('Deine Challenge heute');
    await page.getByTestId('log-top-btn').click();
    await expect(page.getByTestId('toast')).toContainText('Challenge geschafft!');
    await expect(page.getByTestId('toast-feel')).toBeVisible();
    await expect(page.getByTestId('challenge-today-done')).toBeVisible();
    expect(targets).toHaveLength(2);
  });

  test('Wand: Streifen erscheint (Garantie), «Zeigen» öffnet die Route, danach heute nicht mehr', async ({ page, isMobile }) => {
    await loginHans(page);
    await setupChallenge(page);
    await page.evaluate(() =>
      localStorage.setItem('boulderapp_challenge_today_v1', JSON.stringify({ 'hans-kletterer': { days: {}, banner: { dismissStreak: 0, visitsWithout: 3 } } }))
    );
    await openMe(page, isMobile);
    await openWall(page, isMobile);

    const banner = page.getByTestId('challenge-today-banner');
    await expect(banner).toContainText('Deine Challenge heute');
    await page.getByTestId('challenge-today-banner-show').click();
    await expect(page.getByTestId('boulder-sheet')).toBeVisible();
    await expect(page.getByTestId('challenge-today-sheet-line')).toBeVisible();
    await page.getByTestId('boulder-sheet-scrim').click({ position: { x: 20, y: 20 } });
    await expect(page.getByTestId('boulder-sheet')).toHaveCount(0);

    await openMe(page, isMobile);
    await openWall(page, isMobile);
    await page.waitForTimeout(800);
    await expect(page.getByTestId('challenge-today-banner')).toHaveCount(0);
  });

  test('Einstellungen: Schalter «Challenge-Hinweis an der Wand» schaltet den Streifen ab', async ({ page, isMobile }) => {
    await loginHans(page);
    await setupChallenge(page);
    await openSettings(page, isMobile);
    const sw = page.getByTestId('settings-challenge-banner');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => localStorage.getItem('boulderapp_challenge_banner_v1'))).toBe('off');
  });
});
