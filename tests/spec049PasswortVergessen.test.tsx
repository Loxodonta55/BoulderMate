// SPEC-049: Passwort vergessen und Anmelden mit E-Mail (Unit-Tests, Supabase-Auth durch Ersatz-Client)
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Profil-Abgleich nach dem Anmelden geht nie ins Netz
vi.mock('../src/lib/supabase', () => {
  const profileQuery = {
    eq: () => ({
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    }),
  };
  return {
    supabase: {
      auth: { signOut: vi.fn(async () => ({ error: null })), getSession: vi.fn(async () => ({ data: { session: null } })) },
      from: () => ({ select: () => profileQuery }),
    },
    isSupabaseConfigured: true,
    supabaseUrl: 'https://test-projekt.supabase.co',
    supabaseAnonKey: 'anon-key-fuer-tests-0123456789',
    uploadSectorPhoto: vi.fn(),
  };
});

import {
  setAuthClientForTests,
  requestPasswordReset,
  resendConfirmation,
  readEmailLinkFromUrl,
  verifyEmailLink,
  updatePassword,
  signUpWithEmail,
  signInWithPassword,
  signOut,
  getCurrentAuthUser,
  AuthFlowError,
  AUTH_MSG,
} from '../src/lib/authService';
import { LoginModal } from '../src/components/LoginModal';
import { NewPasswordSheet } from '../src/components/auth/NewPasswordSheet';
import { PasswordField } from '../src/components/auth/PasswordField';
import { setLang, resetLang, EN } from '../src/lib/i18n';
import { EN_AUTH } from '../src/lib/i18n/en-auth';

const USER = {
  id: '22222222-3333-4444-8555-666666666666',
  email: 'lea@klettern.ch',
  created_at: '2026-10-20T20:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: { nickname: 'Lea' },
  identities: [{ id: 'x' }],
};

function fakeAuth() {
  return {
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null as unknown })),
    resend: vi.fn(async () => ({ data: {}, error: null as unknown })),
    verifyOtp: vi.fn(async () => ({ data: { user: USER, session: { access_token: 'a' } }, error: null as unknown })),
    updateUser: vi.fn(async () => ({ data: { user: USER }, error: null as unknown })),
    signOut: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({ data: { user: USER, session: null as unknown }, error: null as unknown })),
    signInWithPassword: vi.fn(async () => ({ data: { user: USER, session: {} }, error: null as unknown })),
  };
}

let auth: ReturnType<typeof fakeAuth>;

beforeEach(async () => {
  localStorage.clear();
  await signOut();
  auth = fakeAuth();
  setAuthClientForTests({ auth } as any);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  setAuthClientForTests(undefined);
  resetLang();
});

describe('SPEC-049 authService: Passwort vergessen', () => {
  it('AC-3: schickt den Link mit Rückkehr auf ?auth=recovery und kleingeschriebener Adresse', async () => {
    await requestPasswordReset('  Lea@Klettern.CH ');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('lea@klettern.ch', {
      redirectTo: `${window.location.origin}/?auth=recovery`,
    });
  });

  it('AC-3/F4: verrät nicht, ob es das Konto gibt (Fehler von Supabase wird verschluckt)', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: { message: 'User not found', status: 400 } });
    await expect(requestPasswordReset('niemand@klettern.ch')).resolves.toBeUndefined();
  });

  it('AC-4: Supabase-Sperre ergibt verständlichen Text', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: { message: 'email rate limit exceeded', status: 429 } });
    await expect(requestPasswordReset('lea@klettern.ch')).rejects.toThrow(AUTH_MSG.rateLimit);
  });

  it('lehnt eine ungültige Adresse ab, ohne Supabase zu fragen', async () => {
    await expect(requestPasswordReset('lea')).rejects.toThrow(AUTH_MSG.invalidEmail);
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('AC-10/13: Bestätigungsmail nochmal senden', async () => {
    await resendConfirmation('Lea@klettern.ch');
    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'lea@klettern.ch',
      options: { emailRedirectTo: window.location.origin },
    });
  });
});

describe('SPEC-049 readEmailLinkFromUrl', () => {
  it('AC-6: token_hash + type=recovery wird erkannt und aus der Adresse entfernt', () => {
    window.history.replaceState(null, '', '/?token_hash=abc123&type=recovery&wand=s1');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'verify', tokenHash: 'abc123', type: 'recovery' });
    expect(window.location.search).toBe('?wand=s1');
  });

  it('AC-12: Bestätigungslink type=email', () => {
    window.history.replaceState(null, '', '/?token_hash=xyz&type=email');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'verify', tokenHash: 'xyz', type: 'email' });
    expect(window.location.search).toBe('');
  });

  it('AC-7: Rückfall ?auth=recovery&code= lässt den Code für Supabase stehen', () => {
    window.history.replaceState(null, '', '/?auth=recovery&code=c0de');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'recovery-code' });
    expect(window.location.search).toBe('?code=c0de');
  });

  it('AC-9: abgelaufener Link (Hash) ist «expired» und wird entfernt', () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'expired' });
    expect(window.location.hash).toBe('');
  });

  it('AC-9: abgelaufener Link (Query) ist «expired»', () => {
    window.history.replaceState(null, '', '/?auth=recovery&error=access_denied&error_code=otp_expired');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'expired' });
    expect(window.location.search).toBe('');
  });

  it('lässt Google-Rückkehr und fremde Parameter in Ruhe', () => {
    window.history.replaceState(null, '', '/?code=google&wand=s1');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'none' });
    expect(window.location.search).toBe('?code=google&wand=s1');
    window.history.replaceState(null, '', '/?token_hash=abc&type=boese');
    expect(readEmailLinkFromUrl()).toEqual({ kind: 'none' });
  });
});

describe('SPEC-049 verifyEmailLink und updatePassword', () => {
  it('AC-6: löst den Link mit verifyOtp ein und meldet an', async () => {
    const user = await verifyEmailLink('abc123', 'recovery');
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'recovery' });
    expect(user).toMatchObject({ id: USER.id, email: 'lea@klettern.ch', provider: 'email' });
    expect(getCurrentAuthUser()?.id).toBe(USER.id);
  });

  it('AC-6/12: derselbe Link wird nur einmal eingelöst, auch bei doppeltem Aufruf', async () => {
    auth.verifyOtp.mockClear();
    const [a, b] = await Promise.all([verifyEmailLink('einmal', 'email'), verifyEmailLink('einmal', 'email')]);
    expect(auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('AC-9: ungültiger Link ergibt «abgelaufen», niemand ist angemeldet', async () => {
    auth.verifyOtp.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Token has expired or is invalid', status: 403, code: 'otp_expired' } });
    await expect(verifyEmailLink('alt', 'recovery')).rejects.toThrow(AUTH_MSG.linkExpired);
    expect(getCurrentAuthUser()).toBeNull();
  });

  it('AC-8: speichert das Passwort und meldet andere Geräte ab', async () => {
    await updatePassword('neuesPasswort');
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'neuesPasswort' });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    expect(auth.updateUser.mock.invocationCallOrder[0]).toBeLessThan(auth.signOut.mock.invocationCallOrder[0]);
  });

  it('AC-8: zu kurz und gleiches Passwort ergeben verständliche Meldungen', async () => {
    await expect(updatePassword('12345')).rejects.toThrow(AUTH_MSG.passwordTooShort);
    expect(auth.updateUser).not.toHaveBeenCalled();
    auth.updateUser.mockResolvedValueOnce({ data: { user: null } as any, error: { message: 'New password should be different from the old password.', status: 422, code: 'same_password' } });
    await expect(updatePassword('altesPasswort')).rejects.toThrow(AUTH_MSG.samePassword);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('SPEC-049 Registrieren und Anmelden mit echtem Supabase-Verhalten', () => {
  it('AC-10: ohne Session (Bestätigung nötig) wird niemand angemeldet', async () => {
    const err = await signUpWithEmail('Lea@klettern.ch', 'kreide123', 'Lea').catch(e => e);
    expect(err).toBeInstanceOf(AuthFlowError);
    expect(err).toMatchObject({ code: 'confirm_email', email: 'lea@klettern.ch' });
    expect(getCurrentAuthUser()).toBeNull();
    expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'lea@klettern.ch',
      options: expect.objectContaining({ emailRedirectTo: window.location.origin, data: { nickname: 'Lea' } }),
    }));
    // kein verstecktes Anmelden mehr
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('AC-11: vorhandene Adresse (leere identities) wird beim Registrieren gesagt', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { ...USER, identities: [] }, session: null }, error: null });
    await expect(signUpWithEmail('lea@klettern.ch', 'kreide123')).rejects.toMatchObject({ code: 'account_exists', message: AUTH_MSG.accountExists });
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'User already registered', status: 422, code: 'user_already_exists' } });
    await expect(signUpWithEmail('lea@klettern.ch', 'kreide123')).rejects.toMatchObject({ code: 'account_exists' });
    expect(getCurrentAuthUser()).toBeNull();
  });

  it('mit Session (Bestätigung aus) ist man direkt angemeldet', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: USER, session: { access_token: 'a' } }, error: null });
    const user = await signUpWithEmail('lea@klettern.ch', 'kreide123', 'Lea');
    expect(user.id).toBe(USER.id);
    expect(getCurrentAuthUser()?.id).toBe(USER.id);
  });

  it('AC-13: unbestätigte Adresse ist nicht «falsches Passwort»', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Email not confirmed', status: 400, code: 'email_not_confirmed' } });
    await expect(signInWithPassword('lea@klettern.ch', 'kreide123')).rejects.toMatchObject({ code: 'email_not_confirmed', message: AUTH_MSG.emailNotConfirmed });
  });

  it('AC-14: falsche Daten sagen nicht, welches von beiden falsch ist', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' } });
    await expect(signInWithPassword('lea@klettern.ch', 'falsch')).rejects.toMatchObject({ code: 'invalid_credentials', message: 'E-Mail oder Passwort stimmt nicht.' });
  });

  it('Netzwerkfehler ergibt «Keine Verbindung»', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Failed to fetch', status: 0, name: 'AuthRetryableFetchError' } });
    await expect(signInWithPassword('lea@klettern.ch', 'kreide123')).rejects.toThrow(AUTH_MSG.network);
  });

  it('Anmelden und Abmelden mit echtem Konto', async () => {
    const user = await signInWithPassword('lea@klettern.ch', 'kreide123');
    expect(user).toMatchObject({ id: USER.id, nickname: 'Lea' });
    await signOut();
    expect(getCurrentAuthUser()).toBeNull();
  });
});

describe('SPEC-049 Login-Fenster', () => {
  const openLogin = (props: Partial<React.ComponentProps<typeof LoginModal>> = {}) =>
    render(<LoginModal isOpen onClose={vi.fn()} initialMode="login" {...props} />);

  it('AC-1: «Passwort vergessen?» ist ein großer Knopf, «Magic Link» gibt es nicht mehr', () => {
    openLogin();
    const btn = screen.getByTestId('btn-forgot-password');
    expect(btn).toHaveTextContent('Passwort vergessen?');
    expect(btn.className).toContain('min-h-[48px]');
    expect(screen.queryByText(/Magic Link/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('input-login-password')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByTestId('input-login-email')).toHaveAttribute('autocomplete', 'email');
  });

  it('AC-2/3: übernimmt die Adresse, sendet den Link und zeigt immer dieselbe Bestätigung', async () => {
    openLogin();
    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'lea@klettern.ch' } });
    fireEvent.click(screen.getByTestId('btn-forgot-password'));

    expect(screen.getByTestId('forgot-password-view')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-login')).not.toBeInTheDocument();
    expect(screen.getByTestId('input-forgot-email')).toHaveValue('lea@klettern.ch');
    expect(screen.getByTestId('input-forgot-email')).toHaveFocus();

    fireEvent.click(screen.getByTestId('btn-forgot-submit'));
    const view = await screen.findByTestId('check-email-view');
    expect(view).toHaveAttribute('data-mode', 'reset');
    expect(screen.getByTestId('check-email-address')).toHaveTextContent('lea@klettern.ch');
    expect(view).toHaveTextContent('Wenn es ein Konto mit dieser Adresse gibt');
    expect(view).toHaveTextContent('Spam-Ordner');
    expect(view).toHaveTextContent('Mit Google oder Apple angemeldet?');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });

  it('AC-4: «Nochmal senden» ist nach dem Senden 60 s gesperrt', async () => {
    openLogin();
    fireEvent.click(screen.getByTestId('btn-forgot-password'));
    fireEvent.change(screen.getByTestId('input-forgot-email'), { target: { value: 'lea@klettern.ch' } });
    fireEvent.click(screen.getByTestId('btn-forgot-submit'));
    const resend = await screen.findByTestId('btn-resend');
    expect(resend).toBeDisabled();
    expect(resend).toHaveTextContent('Nochmal senden in 60 s');
  });

  it('AC-2: «Zurück zum Anmelden» führt zu den Tabs zurück', () => {
    openLogin();
    fireEvent.click(screen.getByTestId('btn-forgot-password'));
    fireEvent.click(screen.getByTestId('btn-forgot-back'));
    expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
    expect(screen.queryByTestId('forgot-password-view')).not.toBeInTheDocument();
  });

  it('AC-5: Hilfe «E-Mail-Adresse vergessen?» ist zugeklappt und hat vier Punkte', () => {
    openLogin();
    fireEvent.click(screen.getByTestId('btn-forgot-password'));
    const help = screen.getByTestId('forgot-email-help') as HTMLDetailsElement;
    expect(help.open).toBe(false);
    const items = within(help).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent('nicht mit deinem Spitznamen');
    expect(items[2]).toHaveTextContent('Google oder Apple');
    expect(items[3]).toHaveTextContent('Hallenpersonal');
    expect(within(help).getByRole('link')).toHaveAttribute('href', '/datenschutz.html');
  });

  it('AC-14: falsches Passwort bietet «Passwort vergessen?» direkt in der Meldung an', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' } });
    openLogin();
    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'lea@klettern.ch' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'falsch1' } });
    fireEvent.click(screen.getByTestId('btn-login-submit'));
    const alert = await screen.findByTestId('register-error-msg');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('E-Mail oder Passwort stimmt nicht.');
    fireEvent.click(within(alert).getByTestId('error-forgot-password'));
    expect(screen.getByTestId('input-forgot-email')).toHaveValue('lea@klettern.ch');
  });

  it('AC-13: unbestätigt → «Bestätigungsmail nochmal senden»', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null, session: null } as any, error: { message: 'Email not confirmed', status: 400, code: 'email_not_confirmed' } });
    openLogin();
    fireEvent.change(screen.getByTestId('input-login-email'), { target: { value: 'lea@klettern.ch' } });
    fireEvent.change(screen.getByTestId('input-login-password'), { target: { value: 'kreide123' } });
    fireEvent.click(screen.getByTestId('btn-login-submit'));
    const resend = await screen.findByTestId('btn-resend-confirmation');
    expect(screen.getByTestId('register-error-msg')).toHaveTextContent('Bitte bestätige zuerst deine E-Mail-Adresse');
    fireEvent.click(resend);
    await screen.findByTestId('resend-confirmation-info');
    expect(auth.resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: 'lea@klettern.ch' }));
    expect(screen.getByTestId('btn-resend-confirmation')).toBeDisabled();
  });

  it('AC-10: Registrieren mit Bestätigung zeigt «Fast geschafft» statt einer Schein-Anmeldung', async () => {
    const onUserChanged = vi.fn();
    render(<LoginModal isOpen onClose={vi.fn()} onUserChanged={onUserChanged} />);
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'Neu@Klettern.ch' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'kreide123' } });
    fireEvent.click(screen.getByTestId('btn-register-submit'));

    const view = await screen.findByTestId('check-email-view');
    expect(view).toHaveAttribute('data-mode', 'confirm');
    expect(view).toHaveTextContent('Fast geschafft');
    expect(screen.getByTestId('check-email-address')).toHaveTextContent('neu@klettern.ch');
    expect(onUserChanged).not.toHaveBeenCalled();
    expect(getCurrentAuthUser()).toBeNull();

    fireEvent.click(screen.getByTestId('btn-check-email-back'));
    expect(screen.getByTestId('input-register-email')).toHaveValue('Neu@Klettern.ch');
  });

  it('AC-11: vorhandene Adresse beim Registrieren mit Wegen «Anmelden» und «Passwort vergessen?»', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { ...USER, identities: [] }, session: null }, error: null });
    render(<LoginModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('input-register-email'), { target: { value: 'lea@klettern.ch' } });
    fireEvent.change(screen.getByTestId('input-register-password'), { target: { value: 'kreide123' } });
    fireEvent.click(screen.getByTestId('btn-register-submit'));
    const alert = await screen.findByTestId('register-error-msg');
    expect(alert).toHaveTextContent('Mit dieser Adresse gibt es schon ein Konto.');
    expect(within(alert).getByTestId('error-forgot-password')).toBeInTheDocument();
    fireEvent.click(within(alert).getByTestId('error-go-login'));
    expect(screen.getByTestId('input-login-email')).toHaveValue('lea@klettern.ch');
  });

  it('AC-9: öffnet direkt «Passwort vergessen» mit Meldung', () => {
    render(<LoginModal isOpen onClose={vi.fn()} initialMode="forgot" initialNotice={AUTH_MSG.linkExpired} />);
    expect(screen.getByTestId('forgot-password-view')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-error-msg')).toHaveTextContent('Der Link ist abgelaufen oder wurde schon benutzt.');
    expect(screen.queryByText(/Google-Anmeldung abgebrochen/)).not.toBeInTheDocument();
  });
});

describe('SPEC-049 Neues Passwort und Auge', () => {
  it('AC-15: Auge schaltet Anzeigen/Verbergen mit Beschriftung', () => {
    const Wrapper = () => {
      const [v, setV] = React.useState('geheim1');
      return <PasswordField label="Passwort" value={v} onChange={setV} testId="pw" autoComplete="new-password" />;
    };
    render(<Wrapper />);
    const input = screen.getByTestId('pw');
    const toggle = screen.getByTestId('pw-toggle');
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-label', 'Passwort anzeigen');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-label', 'Passwort verbergen');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('AC-6/8: zeigt das Konto, prüft die Länge und speichert', async () => {
    const onSaved = vi.fn();
    render(<NewPasswordSheet open email="lea@klettern.ch" onClose={vi.fn()} onSaved={onSaved} />);
    expect(screen.getByTestId('new-password-for')).toHaveTextContent('Für: lea@klettern.ch');
    expect(screen.getByTestId('input-new-password')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByTestId('input-new-password')).toHaveFocus();
    expect(screen.getByText('Mindestens 6 Zeichen.')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: '123' } });
    fireEvent.click(screen.getByTestId('btn-new-password-save'));
    expect(await screen.findByTestId('new-password-error')).toHaveTextContent('mindestens 6 Zeichen');
    expect(auth.updateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'neuesPasswort' } });
    fireEvent.click(screen.getByTestId('btn-new-password-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
  });

  it('AC-8: gleiches Passwort wird freundlich abgelehnt', async () => {
    auth.updateUser.mockResolvedValueOnce({ data: { user: null } as any, error: { message: 'New password should be different from the old password.', status: 422, code: 'same_password' } });
    const onSaved = vi.fn();
    render(<NewPasswordSheet open email="lea@klettern.ch" onClose={vi.fn()} onSaved={onSaved} />);
    fireEvent.change(screen.getByTestId('input-new-password'), { target: { value: 'altesPasswort' } });
    fireEvent.click(screen.getByTestId('btn-new-password-save'));
    expect(await screen.findByTestId('new-password-error')).toHaveTextContent('Das ist dein bisheriges Passwort.');
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe('SPEC-049 AC-16: Englisch', () => {
  it('hat für jeden neuen Text einen englischen Eintrag', () => {
    for (const msg of Object.values(AUTH_MSG)) {
      expect(EN[msg], msg).toBeTruthy();
    }
    for (const key of Object.keys(EN_AUTH)) expect(EN[key]).toBeTruthy();
  });

  it('zeigt das Login-Fenster auf Englisch', () => {
    setLang('en');
    render(<LoginModal isOpen onClose={vi.fn()} initialMode="forgot" />);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByTestId('btn-forgot-submit')).toHaveTextContent('Send link');
    expect(screen.getByText('Forgot your email address?')).toBeInTheDocument();
  });
});
