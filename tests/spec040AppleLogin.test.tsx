// SPEC-040: Login mit Apple (Supabase gemockt, kein echtes Apple)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const sb = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('../src/lib/supabase', () => {
  const profileQuery = {
    eq: () => ({
      maybeSingle: async () => ({ data: null, error: null }),
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
  signInWithApple,
  isAppleLoginAvailable,
  isGoogleLoginAvailable,
  resetGoogleLoginAvailabilityCache,
  mapSupabaseUserToAuthUser,
  signOut,
} from '../src/lib/authService';
import { LoginModal } from '../src/components/LoginModal';
import { LandingPage } from '../src/components/LandingPage';

const settingsFetch = (external: Record<string, boolean>) =>
  vi.fn(async () => new Response(JSON.stringify({ external: { email: true, ...external } }), { status: 200 })) as unknown as typeof fetch;

beforeEach(async () => {
  localStorage.clear();
  sb.signInWithOAuth.mockReset().mockResolvedValue({ data: { url: 'https://appleid.apple.com/' }, error: null });
  sb.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  resetGoogleLoginAvailabilityCache();
  await signOut();
});

describe('SPEC-040: Login mit Apple', () => {
  it('Apple verfügbar nur bei external.apple; eine Abfrage für beide Anbieter (F2)', async () => {
    const f = settingsFetch({ google: true, apple: true });
    expect(await isAppleLoginAvailable(f)).toBe(true);
    expect(await isGoogleLoginAvailable(f)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    resetGoogleLoginAvailabilityCache();
    expect(await isAppleLoginAvailable(settingsFetch({ google: true }))).toBe(false);
    resetGoogleLoginAvailabilityCache();
    expect(await isAppleLoginAvailable()).toBe(false);
  });

  it('signInWithApple ruft signInWithOAuth mit provider apple und Rückkehr auf die Seite (AC-3)', async () => {
    await signInWithApple();
    expect(sb.signInWithOAuth).toHaveBeenCalledWith({ provider: 'apple', options: { redirectTo: window.location.origin } });
    sb.signInWithOAuth.mockResolvedValue({ data: null, error: { message: 'provider is not enabled' } });
    await expect(signInWithApple()).rejects.toThrow('Apple-Anmeldung fehlgeschlagen: provider is not enabled');
  });

  it('Konto aus Apple hat provider apple; ohne Namen heisst es «Kletterer» oder E-Mail-Anfang (AC-4, F4)', async () => {
    const user = await mapSupabaseUserToAuthUser({
      id: '22222222-3333-4444-8555-666666666666',
      email: 'abc123@privaterelay.appleid.com',
      created_at: '2026-10-09T20:00:00Z',
      app_metadata: { provider: 'apple' },
      user_metadata: {},
    } as any);
    expect(user.provider).toBe('apple');
    expect(user.nickname).toBe('abc123');
  });

  it('ohne Apple in Supabase gibt es keinen Apple-Knopf (AC-1)', async () => {
    await isGoogleLoginAvailable(settingsFetch({ google: true }));
    render(<LandingPage onOpenLogin={vi.fn()} />);
    expect(await screen.findByTestId('btn-google-login')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-apple-login')).not.toBeInTheDocument();
  });

  it('Landing und Login-Fenster zeigen Apple unter Google; Tippen leitet weiter (AC-2/AC-3)', async () => {
    await isAppleLoginAvailable(settingsFetch({ google: true, apple: true }));
    const { unmount } = render(<LandingPage onOpenLogin={vi.fn()} />);
    const apple = await screen.findByTestId('btn-apple-login');
    const google = screen.getByTestId('btn-google-login');
    expect(apple).toHaveTextContent('Mit Apple anmelden');
    expect(google.compareDocumentPosition(apple) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    unmount();

    render(<LoginModal isOpen onClose={vi.fn()} />);
    fireEvent.click(await screen.findByTestId('btn-apple-login'));
    await waitFor(() => expect(sb.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'apple' })));
    expect(screen.getByTestId('btn-apple-login')).toHaveTextContent('Weiterleitung zu Apple');
  });
});
