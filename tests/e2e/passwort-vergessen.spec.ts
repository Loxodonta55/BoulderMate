import { test, expect, Page, Route } from '@playwright/test';

/**
 * SPEC-049: Passwort vergessen und Anmelden mit E-Mail
 * Kein echtes Supabase und keine echte Mail: Die Auth-Endpunkte werden abgefangen und beantwortet,
 * alles andere zu supabase.co wird blockiert. Den Link aus der Mail öffnet der Test direkt.
 */

const USER = {
  id: '22222222-3333-4444-8555-666666666666',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'lea@klettern.ch',
  created_at: '2026-10-20T20:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { nickname: 'Lea' },
  identities: [{ id: 'i1', provider: 'email' }],
};

function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, role: 'authenticated', exp })}.sig`;
}

function session() {
  return {
    access_token: fakeJwt(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'refresh-test',
    user: USER,
  };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

interface Calls {
  recover: { email: string; redirectTo: string | null }[];
  verify: { token_hash: string; type: string }[];
  updateUser: { password?: string }[];
  logoutScopes: (string | null)[];
  resend: { email: string; type: string }[];
  signup: number;
}

type Reply = { status: number; body: unknown };

interface FakeOptions {
  signup?: Reply;
  login?: Reply;
  verify?: Reply;
}

async function fakeSupabase(page: Page, opts: FakeOptions = {}): Promise<Calls> {
  const calls: Calls = { recover: [], verify: [], updateUser: [], logoutScopes: [], resend: [], signup: 0 };
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });

  await page.context().route(/supabase\.co/, async route => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const body = req.postData() ? JSON.parse(req.postData()!) : {};

    switch (url.pathname) {
      case '/auth/v1/settings':
        return json(route, { external: { google: false, apple: false, email: true } });
      case '/auth/v1/recover':
        calls.recover.push({ email: body.email, redirectTo: url.searchParams.get('redirect_to') });
        return json(route, {});
      case '/auth/v1/verify': {
        calls.verify.push({ token_hash: body.token_hash, type: body.type });
        const reply = opts.verify || { status: 200, body: session() };
        return json(route, reply.body, reply.status);
      }
      case '/auth/v1/user':
        if (req.method() === 'PUT') calls.updateUser.push(body);
        return json(route, USER);
      case '/auth/v1/logout':
        calls.logoutScopes.push(url.searchParams.get('scope'));
        return route.fulfill({ status: 204, headers: CORS });
      case '/auth/v1/resend':
        calls.resend.push({ email: body.email, type: body.type });
        return json(route, {});
      case '/auth/v1/signup': {
        calls.signup++;
        const reply = opts.signup || { status: 200, body: { ...USER, email: body.email } };
        return json(route, reply.body, reply.status);
      }
      case '/auth/v1/token': {
        const reply = opts.login || { status: 200, body: session() };
        return json(route, reply.body, reply.status);
      }
      case '/rest/v1/user_profiles':
        return json(route, [{ id: USER.id, nickname: 'Lea', avatar_url: null, is_platform_admin: false }]);
      case '/rest/v1/gym_members':
        return json(route, []);
      default:
        return route.abort();
    }
  });
  return calls;
}

async function openLoginTab(page: Page) {
  await page.goto('/');
  await page.getByTestId('login-modal-btn').click();
  await page.getByTestId('tab-login').click();
}

const storedSession = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('boulder_auth_session_v1') || 'null'));

test.describe('SPEC-049: Passwort vergessen', () => {
  test('AC-1–4: Link anfordern, Adresse wird übernommen, immer dieselbe Bestätigung', async ({ page, baseURL }) => {
    const sb = await fakeSupabase(page);
    await openLoginTab(page);

    await expect(page.getByText(/Magic Link/i)).toHaveCount(0);
    const forgot = page.getByTestId('btn-forgot-password');
    expect((await forgot.boundingBox())!.height).toBeGreaterThanOrEqual(48);

    await page.getByTestId('input-login-email').fill('Lea@Klettern.ch');
    await forgot.click();
    await expect(page.getByTestId('input-forgot-email')).toHaveValue('Lea@Klettern.ch');
    await expect(page.getByTestId('forgot-email-help')).not.toHaveAttribute('open');

    await page.getByTestId('input-forgot-email').press('Enter');
    await expect(page.getByTestId('check-email-view')).toBeVisible();
    await expect(page.getByTestId('check-email-address')).toHaveText('lea@klettern.ch');
    await expect(page.getByTestId('btn-resend')).toBeDisabled();
    await expect(page.getByTestId('btn-resend')).toContainText(/Nochmal senden in \d+ s/);

    expect(sb.recover).toEqual([{ email: 'lea@klettern.ch', redirectTo: `${new URL(baseURL!).origin}/?auth=recovery` }]);

    await page.getByTestId('btn-check-email-back').click();
    await expect(page.getByTestId('input-login-email')).toBeVisible();
  });

  test('AC-6/8: Link aus der Mail → neues Passwort → Wand, andere Geräte abgemeldet', async ({ page }) => {
    const sb = await fakeSupabase(page);
    await page.goto('/?token_hash=abc123&type=recovery');

    const sheet = page.getByTestId('new-password-sheet');
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId('new-password-for')).toHaveText('Für: lea@klettern.ch');
    expect(page.url()).not.toContain('token_hash');
    expect(sb.verify).toEqual([{ token_hash: 'abc123', type: 'recovery' }]);

    // zu kurz
    await page.getByTestId('input-new-password').fill('123');
    await page.getByTestId('btn-new-password-save').click();
    await expect(page.getByTestId('new-password-error')).toContainText('mindestens 6 Zeichen');

    // Auge zeigt das Getippte
    await page.getByTestId('input-new-password-toggle').click();
    await expect(page.getByTestId('input-new-password')).toHaveAttribute('type', 'text');

    await page.getByTestId('input-new-password').fill('neuesPasswort');
    await page.getByTestId('input-new-password').press('Enter');
    await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByText('Passwort geändert.')).toBeVisible();

    expect(sb.updateUser).toEqual([expect.objectContaining({ password: 'neuesPasswort' })]);
    expect(sb.logoutScopes).toEqual(['others']);
    expect(await storedSession(page)).toMatchObject({ id: USER.id, provider: 'email' });
  });

  test('AC-9: abgelaufener Link öffnet «Passwort vergessen» statt einer Google-Meldung', async ({ page }) => {
    await fakeSupabase(page);
    await page.goto('/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

    await expect(page.getByTestId('forgot-password-view')).toBeVisible();
    await expect(page.getByTestId('forgot-error-msg')).toHaveText('Der Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an.');
    await expect(page.getByText('Google-Anmeldung abgebrochen. Bitte nochmal versuchen.')).toHaveCount(0);
    expect(page.url()).not.toContain('otp_expired');
  });

  test('AC-9: benutzter Link (verify scheitert) führt ebenfalls zu «Passwort vergessen»', async ({ page }) => {
    await fakeSupabase(page, { verify: { status: 403, body: { code: 403, error_code: 'otp_expired', msg: 'Email link is invalid or has expired' } } });
    await page.goto('/?token_hash=alt&type=recovery');

    await expect(page.getByTestId('forgot-error-msg')).toContainText('Der Link ist abgelaufen');
    expect(await storedSession(page)).toBeNull();
  });
});

test.describe('SPEC-049: Registrieren und Anmelden mit E-Mail', () => {
  test('AC-10: Registrieren mit Bestätigung zeigt «Fast geschafft», niemand ist angemeldet', async ({ page }) => {
    const sb = await fakeSupabase(page);
    await page.goto('/');
    await page.getByTestId('hero-login-btn').click();
    await page.getByTestId('input-register-nickname').fill('Neu');
    await page.getByTestId('input-register-email').fill('neu@klettern.ch');
    await page.getByTestId('input-register-password').fill('kreide123');
    await page.getByTestId('btn-register-submit').click();

    await expect(page.getByTestId('check-email-view')).toHaveAttribute('data-mode', 'confirm');
    await expect(page.getByTestId('check-email-view')).toContainText('Fast geschafft');
    await expect(page.getByTestId('check-email-address')).toHaveText('neu@klettern.ch');
    expect(sb.signup).toBe(1);
    expect(await storedSession(page)).toBeNull();
    await expect(page.getByTestId('climber-wall-view')).toHaveCount(0);

    await page.getByTestId('btn-check-email-back').click();
    await expect(page.getByTestId('input-register-email')).toHaveValue('neu@klettern.ch');
  });

  test('AC-11: vorhandene Adresse wird beim Registrieren gesagt', async ({ page }) => {
    await fakeSupabase(page, { signup: { status: 200, body: { ...USER, identities: [] } } });
    await page.goto('/');
    await page.getByTestId('hero-login-btn').click();
    await page.getByTestId('input-register-email').fill('lea@klettern.ch');
    await page.getByTestId('input-register-password').fill('kreide123');
    await page.getByTestId('btn-register-submit').click();

    await expect(page.getByTestId('register-error-msg')).toContainText('Mit dieser Adresse gibt es schon ein Konto.');
    await page.getByTestId('error-go-login').click();
    await expect(page.getByTestId('input-login-email')).toHaveValue('lea@klettern.ch');
  });

  test('AC-12: Bestätigungslink meldet direkt an', async ({ page }) => {
    const sb = await fakeSupabase(page);
    await page.goto('/?token_hash=xyz&type=email');

    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    await expect(page.getByText('E-Mail bestätigt. Willkommen bei BoulderMate!')).toBeVisible();
    expect(sb.verify).toEqual([{ token_hash: 'xyz', type: 'email' }]);
    await expect(page.getByTestId('new-password-sheet')).toHaveCount(0);
  });

  test('AC-13: unbestätigte Adresse → Bestätigungsmail nochmal senden', async ({ page }) => {
    const sb = await fakeSupabase(page, {
      login: { status: 400, body: { code: 400, error_code: 'email_not_confirmed', msg: 'Email not confirmed' } },
    });
    await openLoginTab(page);
    await page.getByTestId('input-login-email').fill('lea@klettern.ch');
    await page.getByTestId('input-login-password').fill('kreide123');
    await page.getByTestId('btn-login-submit').click();

    await expect(page.getByTestId('register-error-msg')).toContainText('Bitte bestätige zuerst deine E-Mail-Adresse.');
    await page.getByTestId('btn-resend-confirmation').click();
    await expect(page.getByTestId('resend-confirmation-info')).toBeVisible();
    await expect(page.getByTestId('btn-resend-confirmation')).toBeDisabled();
    expect(sb.resend).toEqual([{ email: 'lea@klettern.ch', type: 'signup' }]);
  });

  test('AC-14: falsches Passwort → Meldung mit «Passwort vergessen?»', async ({ page }) => {
    await fakeSupabase(page, {
      login: { status: 400, body: { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' } },
    });
    await openLoginTab(page);
    await page.getByTestId('input-login-email').fill('lea@klettern.ch');
    await page.getByTestId('input-login-password').fill('falsch1');
    await page.getByTestId('input-login-password').press('Enter');

    await expect(page.getByTestId('register-error-msg')).toContainText('E-Mail oder Passwort stimmt nicht.');
    await page.getByTestId('error-forgot-password').click();
    await expect(page.getByTestId('input-forgot-email')).toHaveValue('lea@klettern.ch');
  });

  test('Anmelden mit E-Mail und Passwort, Abmelden beendet die Supabase-Session', async ({ page, isMobile }) => {
    const sb = await fakeSupabase(page);
    await openLoginTab(page);
    await page.getByTestId('input-login-email').fill('lea@klettern.ch');
    await page.getByTestId('input-login-password').fill('kreide123');
    await page.getByTestId('btn-login-submit').click();

    await expect(page.getByTestId('climber-wall-view')).toBeVisible();
    expect(await storedSession(page)).toMatchObject({ id: USER.id, email: 'lea@klettern.ch', provider: 'email' });

    await page.getByTestId(isMobile ? 'mobile-tab-stats' : 'tab-stats').click();
    await page.getByTestId('open-settings-btn').click();
    await page.getByTestId('settings-logout').click();
    await expect(page.getByTestId('login-modal-btn')).toBeVisible();
    await expect.poll(() => sb.logoutScopes.length).toBe(1);
    expect(await storedSession(page)).toBeNull();
  });

  test('AC-16: Englisch', async ({ page }) => {
    await fakeSupabase(page);
    await page.addInitScript(() => localStorage.setItem('boulderapp_lang_v1', 'en'));
    await page.goto('/#error=access_denied&error_code=otp_expired');
    await expect(page.getByTestId('forgot-error-msg')).toHaveText('This link has expired or was already used. Request a new one.');
    await expect(page.getByTestId('btn-forgot-submit')).toHaveText('Send link');
  });
});
