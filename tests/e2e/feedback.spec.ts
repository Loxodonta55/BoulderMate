import { test, expect, Page, Request } from '@playwright/test';

/**
 * SPEC-026: Nutzer-Feedback.
 * Läuft rein lokal: Supabase ist blockiert, nur POST /rest/v1/app_feedback wird abgefangen und geprüft.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUEUE_KEY = 'boulderapp_feedback_queue_v1';

type FeedbackMode = 'ok' | 'fail';

/** Blockiert Supabase; Feedback-POSTs werden gesammelt und je nach Modus beantwortet. */
async function stubSupabase(page: Page, mode: { current: FeedbackMode }) {
  const posts: any[] = [];
  const ctx = page.context();
  await ctx.route(/supabase\.co/, route => route.abort());
  await ctx.route(/supabase\.co\/rest\/v1\/app_feedback/, async route => {
    const req: Request = route.request();
    if (mode.current === 'fail') return route.abort();
    expect(req.method()).toBe('POST');
    expect(req.url()).toContain('on_conflict=id');
    expect(req.headers()['prefer'] || '').toContain('resolution=ignore-duplicates');
    const body = req.postDataJSON();
    posts.push(...(Array.isArray(body) ? body : [body]));
    return route.fulfill({ status: 201, body: '' });
  });
  return posts;
}

async function openFeedback(page: Page, isMobile: boolean) {
  await page.goto('/');
  await page.getByTestId('quick-login-hans').click();
  await expect(page.getByTestId('climber-wall-view')).toBeVisible();
  await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
  await page.getByTestId('open-settings-btn').click();
  await page.getByTestId('settings-feedback').click();
  await expect(page.getByTestId('feedback-sheet')).toBeVisible();
}

test.describe('SPEC-026: Nutzer-Feedback', () => {
  test('Einstellungen → Feedback → Idee senden; POST enthält Kontext, aber keine E-Mail', async ({ page, isMobile }) => {
    const posts = await stubSupabase(page, { current: 'ok' });
    await openFeedback(page, !!isMobile);

    const submit = page.getByTestId('feedback-submit');
    await expect(submit).toBeDisabled();
    await page.getByTestId('feedback-category-idea').click();
    await expect(page.getByTestId('feedback-category-idea')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('feedback-message').fill('Ein Timer für Pausen wäre super');
    await expect(page.getByTestId('feedback-counter')).toHaveText('31 / 2000');
    await submit.click();

    await expect(page.getByTestId('feedback-thanks-text')).toHaveText('Dein Feedback ist angekommen.');
    expect(posts).toHaveLength(1);
    const row = posts[0];
    expect(row.id).toMatch(UUID_RE);
    expect(new Date(row.created_at).toISOString()).toBe(row.created_at);
    expect(row).toMatchObject({
      category: 'idea',
      message: 'Ein Timer für Pausen wäre super',
      contact_ok: false,
      email: null,
      app_view: 'settings',
      status: 'neu',
      gym_id: 'gym-6a-plus',
    });
    expect(row.gym_name).toContain('6a plus');
    expect(row.user_id).toMatch(UUID_RE);
    expect(row.screen).toMatch(/^\d+×\d+$/);

    await page.getByTestId('feedback-done').click();
    await expect(page.getByTestId('feedback-sheet')).toHaveCount(0);
    await expect(page.getByTestId('settings-view')).toBeVisible();
  });

  test('Mit Häkchen wird die E-Mail des Kontos mitgeschickt', async ({ page, isMobile }) => {
    const posts = await stubSupabase(page, { current: 'ok' });
    await openFeedback(page, !!isMobile);
    await page.getByTestId('feedback-category-bug').click();
    await page.getByTestId('feedback-message').fill('Das Wandfoto lädt manchmal nicht');
    await page.getByTestId('feedback-contact').check();
    await page.getByTestId('feedback-submit').click();
    await expect(page.getByTestId('feedback-thanks')).toBeVisible();
    expect(posts[0]).toMatchObject({ category: 'bug', contact_ok: true, email: 'hans@kletterer.ch' });
  });

  test('Ohne Netz: Warteschlange, nach Neuladen genau einmal nachgesendet', async ({ page, isMobile }) => {
    const mode = { current: 'fail' as FeedbackMode };
    const posts = await stubSupabase(page, mode);
    await openFeedback(page, !!isMobile);
    await page.getByTestId('feedback-category-praise').click();
    await page.getByTestId('feedback-message').fill('Tolle App, weiter so!');
    await page.getByTestId('feedback-submit').click();

    await expect(page.getByTestId('feedback-thanks-text')).toHaveText('Wir senden es, sobald du wieder Netz hast.');
    const queued = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || '[]'), QUEUE_KEY);
    expect(queued).toHaveLength(1);
    expect(posts).toHaveLength(0);

    mode.current = 'ok';
    await page.reload();
    await expect.poll(() => posts.length).toBe(1);
    expect(posts[0].id).toBe(queued[0].id);
    await expect
      .poll(() => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '[]').length, QUEUE_KEY))
      .toBe(0);

    // Ein weiteres «online» sendet nichts doppelt
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(300);
    expect(posts).toHaveLength(1);
  });

  test('Zu kurzer Text sperrt Absenden; Bedienelemente sind groß genug', async ({ page, isMobile }) => {
    await stubSupabase(page, { current: 'ok' });
    await openFeedback(page, !!isMobile);
    await page.getByTestId('feedback-category-bug').click();
    await page.getByTestId('feedback-message').fill('kurz');
    await expect(page.getByTestId('feedback-submit')).toBeDisabled();

    for (const id of ['feedback-category-bug', 'feedback-category-idea', 'feedback-category-praise', 'feedback-submit']) {
      const box = await page.getByTestId(id).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(56);
    }
    const fontSize = await page.getByTestId('feedback-message').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(17);
  });

  test('Knopf «Feedback» im Header ist auf Wand und «Ich» sichtbar und sendet mit app_view = header', async ({ page, isMobile }) => {
    const posts = await stubSupabase(page, { current: 'ok' });
    await page.goto('/');
    await page.getByTestId('quick-login-hans').click();
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();

    const btn = page.getByTestId('header-feedback-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Feedback');
    const box = await btn.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    // Hallenname bleibt daneben sichtbar
    await expect(page.getByTestId('header-gym-select')).toBeVisible();

    await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
    await expect(page.getByTestId('user-profile-view')).toBeVisible();
    await expect(btn).toBeVisible();

    await btn.click();
    await expect(page.getByTestId('feedback-sheet')).toBeVisible();
    await page.getByTestId('feedback-category-bug').click();
    await page.getByTestId('feedback-message').fill('Header-Knopf funktioniert');
    await page.getByTestId('feedback-submit').click();
    await expect(page.getByTestId('feedback-thanks')).toBeVisible();
    expect(posts[0]).toMatchObject({ app_view: 'header', category: 'bug' });
  });

  test('Gäste sehen keinen Feedback-Knopf', async ({ page }) => {
    await stubSupabase(page, { current: 'ok' });
    await page.goto('/');
    await expect(page.getByTestId('quick-login-hans')).toBeVisible();
    await expect(page.getByTestId('header-feedback-btn')).toHaveCount(0);
  });
});
