import { test, expect } from '@playwright/test';

test.describe('SPEC-003 / SPEC-019: Ratings & Review Sync (Data-Writing & Cross-User)', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/');
    
    // Login as Hans (Kletterer)
    const hansBtn = page.locator('button:has-text("Hans (Kletterer)")');
    if (await hansBtn.isVisible()) {
      await hansBtn.click();
    }
    
    // Handle role gateway if shown
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }
  });

  test('Hans submits a 4-star FAIR rating: writes to storage and recalculates community stats', async ({ page }) => {
    // 1. Select a route
    const routeCard = page.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder|Dynamo/i }).first();
    await expect(routeCard).toBeVisible({ timeout: 10000 });
    await routeCard.click();

    // 2. Open Rating Wizard (handles both first-time and editing)
    const bewertenBtn = page.locator('button:has-text("Jetzt bewerten"), button:has-text("Bewertung anpassen")').first();
    await expect(bewertenBtn).toBeVisible();
    await bewertenBtn.click({ force: true });

    // 3. Step 1: Difficulty Barometer
    const ratingModal = page.locator('.fixed.inset-0').last();
    const fairBtn = ratingModal.getByRole('button', { name: /fair/i });
    if (await fairBtn.isVisible()) {
      await fairBtn.click();
      await page.waitForTimeout(300);
    }

    const weiterBtn = ratingModal.getByRole('button', { name: /weiter/i });
    if (await weiterBtn.isVisible()) {
      await weiterBtn.click();
      await page.waitForTimeout(300);
    }

    // Step 2: Star Rating & Save
    const star4 = page.locator('button[aria-label="4 Sterne"]').first();
    await expect(star4).toBeVisible({ timeout: 5000 });
    await star4.click();

    const saveBtn = page.locator('button:has-text("BEWERTUNG SPEICHERN")').first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 5. Verify Modal closes and rating is saved in localStorage
    await expect(saveBtn).not.toBeVisible({ timeout: 5000 });

    const localRatings = await page.evaluate(() => {
      return localStorage.getItem('boulderapp_ratings_v3');
    });
    expect(localRatings).toBeTruthy();
    expect(localRatings).toContain('hans-kletterer');

    // 6. Reopen route to verify updated community review feed
    await routeCard.click();
    const detailModal = page.locator('.fixed.inset-0.z-50');
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByTestId('community-rating-row-hans-kletterer')).toBeVisible();
    await expect(detailModal.getByText(/4\s*★|4/).first()).toBeVisible();
    await expect(detailModal.getByText(/Fair/i).first()).toBeVisible();
  });

  test('Multi-User Sync: Schrauber6aPlus sees Hans rating in the community review feed', async ({ page }) => {
    // 1. Switch User to Schrauber6aPlus (handles desktop select or mobile login modal)
    const userSelect = page.locator('select').filter({ hasText: 'Schrauber6aPlus' });
    if (await userSelect.isVisible()) {
      await userSelect.selectOption('schrauber-6aplus');
    } else {
      const loginModalBtn = page.getByTestId('login-modal-btn');
      await loginModalBtn.click();
      const personaBtn = page.getByTestId('persona-login-schrauber-6aplus');
      await expect(personaBtn).toBeVisible();
      await personaBtn.click();
      await page.waitForTimeout(600);
    }

    // Handle role gateway if shown
    const klettererAppBtn = page.locator('button:has-text("KLETTERER-APP")');
    if (await klettererAppBtn.isVisible()) {
      await klettererAppBtn.click();
    }

    // 2. Open Route
    const routeCard = page.locator('div.group').filter({ hasText: /Fb|Details & Log|Ausdauer|Boulder|Dynamo/i }).first();
    await expect(routeCard).toBeVisible();
    await routeCard.click();

    // 3. Verify Hans's rating is visible to Schrauber
    const detailModal = page.locator('.fixed.inset-0.z-50');
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByText('COMMUNITY-WERTUNGEN & REVIEWS')).toBeVisible();
    await expect(detailModal.getByTestId('community-rating-row-hans-kletterer')).toBeVisible();
    await expect(detailModal.getByText(/Fair/i).first()).toBeVisible();
  });

});
