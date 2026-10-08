// SPEC-024: Login mit Google-Konto (Unit-Tests, Supabase gemockt, kein echtes Google)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const sb = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  getSession: vi.fn(),
  profile: null as Record<string, unknown> | null,
}));

vi.mock('../src/lib/supabase', () => {
  const profileQuery = {
    eq: () => ({
      maybeSingle: async () => ({ data: sb.profile, error: null }),
      then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
    }),
  };
  return {
    supabase: {
      auth: {
        signInWithOAuth: (...args: unknown[]) => sb.signInWithOAuth(...args),
        getSession: (...args: unknown[]) => sb.getSession(...args),
        signOut: vi.fn(async () => ({ error: null })),
      },
      from: () => ({ select: () => profileQuery }),
    },
    isSupabaseConfigured: true,
    supabaseUrl: 'https://test-projekt.supabase.co',
    supabaseAnonKey: 'anon-key-fuer-tests-0123456789',
    uploadSectorPhoto: vi.fn(),
  };
});

import {
  signInWithGoogle,
  mockGoogleSignIn,
  isGoogleLoginAvailable,
  resetGoogleLoginAvailabilityCache,
  readOAuthReturnFromUrl,
  finishOAuthRedirect,
  mapSupabaseUserToAuthUser,
  getCurrentAuthUser,
  signOut,
  OAUTH_ERROR_CANCELLED,
  OAUTH_ERROR_FAILED,
} from '../src/lib/authService';
import { getUserRoleInfo } from '../src/lib/roleService';
import { LoginModal } from '../src/components/LoginModal';
import { LandingPage } from '../src/components/LandingPage';

const settingsFetch = (google: boolean) =>
  vi.fn(async () => new Response(JSON.stringify({ external: { google, email: true } }), { status: 200 })) as unknown as typeof fetch;

const googleUser = {
  id: '11111111-2222-4333-8444-555555555555',
  email: 'hans.feckl@gmail.com',
  created_at: '2026-10-08T20:00:00Z',
  app_metadata: { provider: 'google' },
  user_metadata: { full_name: 'Hans Feckl', avatar_url: 'https://lh3.googleusercontent.com/a/hans' },
};

beforeEach(async () => {
  localStorage.clear();
  sb.signInWithOAuth.mockReset().mockResolvedValue({ data: { url: 'https://accounts.google.com/' }, error: null });
  sb.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  sb.profile = null;
  resetGoogleLoginAvailabilityCache();
  await signOut();
  window.history.replaceState(null, '', '/');
});

describe('SPEC-024 AC-2: signInWithGoogle startet nur die Weiterleitung', () => {
  it('ruft signInWithOAuth mit provider google und der aktuellen Origin als redirectTo auf', async () => {
    await signInWithGoogle();
    expect(sb.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  });

  it('legt keinen lokalen Nutzer an (behebt G2)', async () => {
    await signInWithGoogle();
    expect(getCurrentAuthUser()).toBeNull();
    expect(localStorage.getItem('boulder_auth_session_v1')).toBeNull();
  });

  it('gibt einen Supabase-Fehler als deutsche Meldung weiter', async () => {
    sb.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'Unsupported provider' } });
    await expect(signInWithGoogle()).rejects.toThrow('Google-Anmeldung fehlgeschlagen: Unsupported provider');
  });
});

describe('SPEC-024 AC-5.2: isGoogleLoginAvailable', () => {
  it('liefert true, wenn Supabase external.google meldet, und fragt die Settings mit Anon-Key ab', async () => {
    const fetchImpl = settingsFetch(true);
    expect(await isGoogleLoginAvailable(fetchImpl)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('https://test-projekt.supabase.co/auth/v1/settings', {
      headers: { apikey: 'anon-key-fuer-tests-0123456789' },
    });
  });

  it('liefert false, wenn Google in Supabase aus ist', async () => {
    expect(await isGoogleLoginAvailable(settingsFetch(false))).toBe(false);
  });

  it('liefert false bei Netzwerkfehler', async () => {
    const failing = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await isGoogleLoginAvailable(failing)).toBe(false);
  });

  it('geht im Unit-Test ohne eigenes fetch nie ins Netz', async () => {
    expect(await isGoogleLoginAvailable()).toBe(false);
  });
});

describe('SPEC-024 AC-2.3 / AC-5.1: readOAuthReturnFromUrl', () => {
  it('erkennt ?code= als laufende Anmeldung und lässt den Code für Supabase stehen', () => {
    window.history.replaceState(null, '', '/?code=abc123');
    expect(readOAuthReturnFromUrl()).toEqual({ status: 'pending' });
    expect(window.location.search).toBe('?code=abc123');
  });

  it('erkennt Abbruch bei Google und entfernt die Fehlerparameter', () => {
    window.history.replaceState(null, '', '/?error=access_denied&error_description=The+user+denied');
    expect(readOAuthReturnFromUrl()).toEqual({ status: 'error', message: OAUTH_ERROR_CANCELLED });
    expect(window.location.search).toBe('');
  });

  it('meldet andere Fehler als fehlgeschlagen, auch im Hash', () => {
    window.history.replaceState(null, '', '/#error=server_error&error_description=Database+error');
    expect(readOAuthReturnFromUrl()).toEqual({ status: 'error', message: OAUTH_ERROR_FAILED });
    expect(window.location.hash).toBe('');
  });

  it('ohne Parameter: none', () => {
    expect(readOAuthReturnFromUrl()).toEqual({ status: 'none' });
  });
});

describe('SPEC-024 AC-2.4: finishOAuthRedirect', () => {
  it('setzt den Google-Nutzer aus der Supabase-Session und räumt die Adresse auf', async () => {
    window.history.replaceState(null, '', '/?code=abc123&sb_flow_id=f1');
    sb.getSession.mockResolvedValue({ data: { session: { user: googleUser } }, error: null });

    const user = await finishOAuthRedirect();

    expect(user?.id).toBe(googleUser.id);
    expect(user?.provider).toBe('google');
    expect(getCurrentAuthUser()?.id).toBe(googleUser.id);
    expect(window.location.search).toBe('');
  });

  it('gibt null zurück und entfernt den Code, wenn keine Session entstand', async () => {
    window.history.replaceState(null, '', '/?code=kaputt');
    expect(await finishOAuthRedirect()).toBeNull();
    expect(getCurrentAuthUser()).toBeNull();
    expect(window.location.search).toBe('');
  });
});

describe('SPEC-024 AC-3: Profil aus Google-Daten', () => {
  it('übernimmt Vorname und Google-Bild (F3, F4)', async () => {
    const user = await mapSupabaseUserToAuthUser(googleUser);
    expect(user.provider).toBe('google');
    expect(user.nickname).toBe('Hans');
    expect(user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/hans');
  });

  it('nimmt picture als Bild, wenn avatar_url fehlt', async () => {
    const user = await mapSupabaseUserToAuthUser({
      ...googleUser,
      user_metadata: { name: 'Lea Muster', picture: 'https://lh3.googleusercontent.com/a/lea' },
    });
    expect(user.nickname).toBe('Lea');
    expect(user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/lea');
  });

  it('ein später geänderter Name aus user_profiles hat Vorrang vor Google (AC-3.3)', async () => {
    sb.profile = { nickname: 'Boulder-Hans', avatar_url: null, is_platform_admin: false };
    const user = await mapSupabaseUserToAuthUser(googleUser);
    expect(user.nickname).toBe('Boulder-Hans');
  });

  it('neuer Google-Nutzer ist normaler Kletterer ohne Admin- oder Schrauber-Rechte (AC-3.4)', async () => {
    const user = await mapSupabaseUserToAuthUser(googleUser);
    expect(user.isPlatformAdmin).toBe(false);
    const roles = getUserRoleInfo(user.id, 'gym-6a-plus');
    expect(roles.isClimber).toBe(true);
    expect(roles.canAccessSetterStudio).toBe(false);
    expect(roles.canAccessAdminConsole).toBe(false);
  });
});

describe('SPEC-024 AC-6.1: mockGoogleSignIn', () => {
  it('erzeugt im Testmodus einen Google-Nutzer, getrennt vom echten Ablauf', () => {
    const user = mockGoogleSignIn({ email: 'test@gmail.com', nickname: 'Testi' });
    expect(user.provider).toBe('google');
    expect(getCurrentAuthUser()?.nickname).toBe('Testi');
    expect(sb.signInWithOAuth).not.toHaveBeenCalled();
  });
});

describe('SPEC-024 AC-1: Knöpfe', () => {
  it('Login-Fenster zeigt genau einen Google-Knopf; Klick leitet weiter ohne Erfolgsmeldung', async () => {
    await isGoogleLoginAvailable(settingsFetch(true));
    render(<LoginModal isOpen onClose={vi.fn()} />);

    const buttons = await screen.findAllByTestId('btn-google-login');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Mit Google fortfahren');

    fireEvent.click(buttons[0]);
    await waitFor(() => expect(sb.signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('btn-google-login')).toHaveTextContent('Weiterleitung zu Google');
    expect(screen.queryByText(/erfolgreich/i)).not.toBeInTheDocument();

    // Umschalten auf «Anmelden» ändert nichts: weiterhin ein Knopf
    fireEvent.click(screen.getByTestId('tab-login'));
    expect(screen.getAllByTestId('btn-google-login')).toHaveLength(1);
  });

  it('Login-Fenster zeigt den Fehler, wenn die Weiterleitung scheitert', async () => {
    await isGoogleLoginAvailable(settingsFetch(true));
    sb.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'provider is not enabled' } });
    render(<LoginModal isOpen onClose={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('btn-google-login'));
    expect(await screen.findByText(/Google-Anmeldung fehlgeschlagen/)).toBeInTheDocument();
    expect(screen.getByTestId('btn-google-login')).toHaveTextContent('Mit Google fortfahren');
  });

  it('Landing zeigt «Mit Google fortfahren» als Hauptknopf und E-Mail als zweiten Weg (F1, F2)', async () => {
    await isGoogleLoginAvailable(settingsFetch(true));
    render(<LandingPage onOpenLogin={vi.fn()} />);
    expect(await screen.findByTestId('btn-google-login')).toHaveTextContent('Mit Google fortfahren');
    expect(screen.getByTestId('hero-login-btn')).toHaveTextContent('Mit E-Mail fortfahren');
    expect(screen.getByTestId('link-datenschutz')).toHaveAttribute('href', '/datenschutz.html');
  });

  it('ohne Google in Supabase: kein Google-Knopf, «Konto erstellen» bleibt Hauptknopf', async () => {
    await isGoogleLoginAvailable(settingsFetch(false));
    render(<LandingPage onOpenLogin={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('hero-login-btn')).toHaveTextContent('Konto erstellen'));
    expect(screen.queryByTestId('btn-google-login')).not.toBeInTheDocument();
  });

  it('angemeldet über das Logo geöffnet: kein Google-Knopf, «Weiter zur App»', async () => {
    await isGoogleLoginAvailable(settingsFetch(true));
    render(<LandingPage onOpenLogin={vi.fn()} onContinue={vi.fn()} notice={OAUTH_ERROR_CANCELLED} />);
    expect(await screen.findByTestId('hero-continue-btn')).toHaveTextContent('Weiter zur App');
    await waitFor(() => expect(screen.queryByTestId('btn-google-login')).not.toBeInTheDocument());
    expect(screen.queryByTestId('landing-auth-notice')).not.toBeInTheDocument();
  });

  it('Landing zeigt die Meldung nach abgebrochenem Google-Login', () => {
    render(<LandingPage onOpenLogin={vi.fn()} notice={OAUTH_ERROR_CANCELLED} />);
    expect(screen.getByTestId('landing-auth-notice')).toHaveTextContent('Google-Anmeldung abgebrochen');
  });
});
