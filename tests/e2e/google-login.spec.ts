import { test, expect, Page, Route } from '@playwright/test';

/**
 * SPEC-024: Login mit Google-Konto
 * Kein echtes Google und kein echtes Supabase: Die Auth-Endpunkte werden abgefangen
 * und beantwortet, alles andere zu supabase.co wird blockiert.
 */

const GOOGLE_USER = {
  id: '11111111-2222-4333-8444-555555555555',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'hans.feckl@gmail.com',
  created_at: '2026-10-08T20:00:00Z',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { full_name: 'Hans Feckl', avatar_url: 'https://lh3.googleusercontent.com/a/hans' },
};

function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: GOOGLE_USER.id, role: 'authenticated', exp })}.sig`;
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

interface FakeSupabase {
  authorizeUrls: URL[];
  tokenRequests: number;
  logoutRequests: number;
}

async function fakeSupabase(page: Page, opts: { googleEnabled: boolean }): Promise<FakeSupabase> {
  const state: FakeSupabase = { authorizeUrls: [], tokenRequests: 0, logoutRequests: 0 };
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });

  await page.context().route(/supabase\.co/, async route => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

    if (url.pathname === '/auth/v1/settings') {
      return json(route, { external: { google: opts.googleEnabled, email: true } });
    }
    if (url.pathname === '/auth/v1/authorize') {
      // Statt Google: sofort zurück zur App, wie nach erfolgreicher Zustimmung
      state.authorizeUrls.push(url);
      const back = new URL(url.searchParams.get('redirect_to')!);
      back.searchParams.set('code', 'test-code');
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/html' },
        body: `<script>location.replace(${JSON.stringify(back.toString())})</script>`,
      });
    }
    if (url.pathname === '/auth/v1/token') {
      state.tokenRequests++;
      return json(route, {
        access_token: fakeJwt(),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'refresh-test',
        user: GOOGLE_USER,
      });
    }
    if (url.pathname === '/auth/v1/user') return json(route, GOOGLE_USER);
    if (url.pathname === '/auth/v1/logout') {
      state.logoutRequests++;
      return route.fulfill({ status: 204, headers: CORS });
    }
    if (url.pathname === '/rest/v1/user_profiles') {
      return json(route, [{ id: GOOGLE_USER.id, email: GOOGLE_USER.email, nickname: 'Hans', avatar_url: null, is_platform_admin: false }]);
    }
    if (url.pathname === '/rest/v1/gym_members') return json(route, []);
    return route.abort();
  });
  return state;
}

test.describe('SPEC-024: Login mit Google', () => {
  test('Weiterleitung startet mit PKCE und führt zurück zur App', async ({ page, baseURL }) => {
    const sb = await fakeSupabase(page, { googleEnabled: true });
    // Rückkehr abfangen: Hier zählt nur die Weiterleitung selbst
    await page.context().route(/[?&]code=test-code/, route => route.abort());
    await page.goto('/');

    const button = page.getByTestId('btn-google-login');
    await expect(button).toHaveText('Mit Google fortfahren');
    await button.click();

    await expect.poll(() => sb.authorizeUrls.length).toBe(1);
    const authorize = sb.authorizeUrls[0];
    expect(authorize.searchParams.get('provider')).toBe('google');
    expect(new URL(authorize.searchParams.get('redirect_to')!).origin).toBe(new URL(baseURL!).origin);
    expect(authorize.searchParams.get('code_challenge')).toBeTruthy();
    expect(authorize.searchParams.get('code_challenge_method')).toBe('s256');
  });

  test('Rückkehr von Google meldet an, zeigt die Wand und räumt die Adresse auf', async ({ page, isMobile }) => {
    const sb = await fakeSupabase(page, { googleEnabled: true });
    await page.goto('/');
    expect(await page.evaluate(() => localStorage.getItem('boulder_auth_session_v1'))).toBeNull();

    await page.getByTestId('btn-google-login').click();

    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    expect(sb.tokenRequests).toBe(1);
    expect(page.url()).not.toContain('code=');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('boulder_auth_session_v1') || 'null'));
    expect(stored).toMatchObject({ id: GOOGLE_USER.id, provider: 'google', nickname: 'Hans', isPlatformAdmin: false });

    // Abmelden beendet auch die Supabase-Session
    await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-logout').click();
    await expect(page.getByTestId('btn-google-login')).toBeVisible();
    await expect.poll(() => sb.logoutRequests).toBe(1);
  });

  test('Abbruch bei Google zeigt eine Meldung auf der Startseite', async ({ page }) => {
    await fakeSupabase(page, { googleEnabled: true });
    await page.goto('/?error=access_denied&error_description=The+user+denied+access');

    await expect(page.getByTestId('landing-auth-notice')).toHaveText('Google-Anmeldung abgebrochen. Bitte nochmal versuchen.');
    expect(page.url()).not.toContain('error=');
  });

  test('ungültiger Code: Meldung statt Hängenbleiben', async ({ page }) => {
    await fakeSupabase(page, { googleEnabled: true });
    await page.goto('/?code=ohne-verifier');

    await expect(page.getByTestId('landing-auth-notice')).toHaveText('Anmeldung fehlgeschlagen. Bitte nochmal versuchen.');
    expect(page.url()).not.toContain('code=');
  });

  test('Google in Supabase aus: kein Google-Knopf, E-Mail bleibt', async ({ page }) => {
    await fakeSupabase(page, { googleEnabled: false });
    await page.goto('/');

    await expect(page.getByTestId('hero-login-btn')).toHaveText('Konto erstellen');
    await expect(page.getByTestId('btn-google-login')).toHaveCount(0);
  });

  test('Google-Knopf ist groß genug und ohne Scrollen sichtbar', async ({ page }) => {
    await fakeSupabase(page, { googleEnabled: true });
    await page.goto('/');

    const button = page.getByTestId('btn-google-login');
    await expect(button).toBeInViewport();
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Datenschutz-Seite ist von der Startseite erreichbar', async ({ page }) => {
    await fakeSupabase(page, { googleEnabled: false });
    await page.goto('/');
    await page.getByTestId('link-datenschutz').click();
    await expect(page.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeVisible();
  });
});
