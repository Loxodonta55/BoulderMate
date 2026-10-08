// SPEC-000: Authentifizierung & Identity Service
// Verwaltet Sessions, echte Supabase Auth (E-Mail/Passwort, Google OAuth, OTP) und Benutzerprofile.

import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from './supabase';
import {
  getStorageJson,
  setStorageJson,
  removeStorageItem,
} from './storageUtils';
import { getMembers, saveMembers } from './gymStorage';
import { GymMember } from '../types/gym';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  isPlatformAdmin: boolean;
  roleDescription?: string;
  provider: 'google' | 'email' | 'apple' | 'simulation';
  createdAt: string;
}

const STORAGE_AUTH_KEY = 'boulder_auth_session_v1';

export const isTestEnv = Boolean(
  (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) ||
  (typeof import.meta !== 'undefined' && ((import.meta as any).env?.MODE === 'test' || (import.meta as any).env?.VITEST)) ||
  (typeof window !== 'undefined' && ((window as any).__vitest__ || (window as any).VITEST))
);

export const DEMO_USERS: Record<string, AuthUser> = {
  // 1) Boris - Der OverAdmin der Halle anlegen kann und die Admins der Hallen festlegen
  'user-boris': {
    id: 'user-boris',
    email: 'boris@bouldermate.ch',
    nickname: 'Boris',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop',
    isPlatformAdmin: true,
    roleDescription: 'OverAdmin (Hallen & Admins verwalten)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  // 2) Admin6APlus - HallenAdmin fürs 6aPlus
  'admin-6aplus': {
    id: 'admin-6aplus',
    email: 'admin@6aplus.ch',
    nickname: 'Admin6APlus',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    roleDescription: 'HallenAdmin (6a plus)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  // 3) Schrauber6aPlus - Schrauber im 6a Plus
  'schrauber-6aplus': {
    id: 'schrauber-6aplus',
    email: 'schrauber@6aplus.ch',
    nickname: 'Schrauber6aPlus',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    roleDescription: 'Schrauber (6a plus)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  // 4) HansDereinfacheKletterer - der standard User
  'hans-kletterer': {
    id: 'hans-kletterer',
    email: 'hans@kletterer.ch',
    nickname: 'HansDereinfacheKletterer',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    roleDescription: 'Standard Kletterer (Universell)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  // 5) AdminMinimum - Hallenadmin im Minimum
  'admin-minimum': {
    id: 'admin-minimum',
    email: 'admin@minimum.ch',
    nickname: 'AdminMinimum',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    roleDescription: 'HallenAdmin (Minimum Zürich)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  // 6) Schrauber Minimum - Schrauber im Minimum
  'schrauber-minimum': {
    id: 'schrauber-minimum',
    email: 'schrauber@minimum.ch',
    nickname: 'Schrauber Minimum',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    roleDescription: 'Schrauber (Minimum Zürich)',
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  }
};

// UUID-Mapping für Seed-Accounts in Supabase
export const SUPABASE_UUID_TO_DEMO_KEY: Record<string, string> = {
  '00000000-1d0e-4000-8000-e92d69136f33': 'user-boris',
  '00000000-37e7-4000-8000-0743462b539d': 'admin-6aplus',
  '00000000-08ca-4000-8000-6e6f5bce818f': 'schrauber-6aplus',
  '00000000-4553-4000-8000-3dd13fac9e0f': 'hans-kletterer',
  '00000000-2ff9-4000-8000-b7902cb24230': 'admin-minimum',
  '00000000-5a7c-4000-8000-7702607a9a42': 'schrauber-minimum',
};

let currentSessionUser: AuthUser | null = null;
const authListeners: Array<(user: AuthUser | null) => void> = [];
let hasSubscribedToSupabaseAuth = false;

function notifyListeners(): void {
  for (const listener of authListeners) {
    try {
      listener(currentSessionUser);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  }
}

/**
 * Holt Profil & Rollen des Nutzers aus Supabase und synchronisiert sie lokal.
 */
export async function syncUserProfileWithSupabase(userId: string): Promise<Partial<AuthUser>> {
  if (!supabase || !isSupabaseConfigured) return {};

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: members } = await supabase
      .from('gym_members')
      .select('*')
      .eq('user_id', userId);

    if (members && members.length > 0) {
      const localMembers = getMembers();
      const memberMap = new Map(localMembers.map(m => [`${m.gym_id}_${m.user_id}`, m]));
      for (const m of members) {
        memberMap.set(`${m.gym_id}_${m.user_id}`, {
          id: m.id,
          gym_id: m.gym_id,
          user_id: m.user_id,
          role: m.role,
          appointed_by: m.appointed_by,
          created_at: m.created_at || new Date().toISOString()
        } as GymMember);
      }
      saveMembers(Array.from(memberMap.values()));
    }

    if (profile) {
      return {
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url || undefined,
        isPlatformAdmin: Boolean(profile.is_platform_admin),
      };
    }
  } catch (err) {
    console.warn('[Auth] Fehler beim Synchronisieren des Benutzerprofils:', err);
  }

  return {};
}

/**
 * Wandelt ein Supabase Auth User-Objekt in unser kanonisches AuthUser-Modell um.
 */
export async function mapSupabaseUserToAuthUser(sbUser: any): Promise<AuthUser> {
  const isBoris = sbUser.email === 'boris@bouldermate.ch' || sbUser.id === '00000000-1d0e-4000-8000-e92d69136f33';
  
  // Standard-Metadaten (SPEC-024 F3: bei Google der Vorname, wie im DB-Trigger handle_new_user)
  const meta = sbUser.user_metadata || {};
  const fullName: string = meta.full_name || meta.name || '';
  let nickname = meta.nickname ||
                 fullName.trim().split(/\s+/)[0] ||
                 sbUser.email?.split('@')[0] ||
                 'Kletterer';
  let avatarUrl = meta.avatar_url || meta.picture || undefined;
  let isPlatformAdmin = isBoris;

  // Ergänzende Profildaten aus DB holen
  const synced = await syncUserProfileWithSupabase(sbUser.id);
  if (synced.nickname) nickname = synced.nickname;
  if (synced.avatarUrl) avatarUrl = synced.avatarUrl;
  if (synced.isPlatformAdmin !== undefined) isPlatformAdmin = isPlatformAdmin || synced.isPlatformAdmin;

  const provider = (sbUser.app_metadata?.provider === 'google') ? 'google' : 'email';

  // Demo Persona Verknüpfung prüfen
  const demoKey = SUPABASE_UUID_TO_DEMO_KEY[sbUser.id];
  const demoInfo = demoKey ? DEMO_USERS[demoKey] : null;

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    nickname: demoInfo?.nickname || nickname,
    avatarUrl: avatarUrl || demoInfo?.avatarUrl,
    isPlatformAdmin: isPlatformAdmin || Boolean(demoInfo?.isPlatformAdmin),
    roleDescription: demoInfo?.roleDescription || (isPlatformAdmin ? 'OverAdmin (Hallen & Admins verwalten)' : 'Kletterer (Universell)'),
    provider,
    createdAt: sbUser.created_at || new Date().toISOString()
  };
}

/**
 * Initialisiert die Auth-Session aus dem Cache und synchronisiert mit Supabase Auth.
 */
export function initAuthSession(): AuthUser | null {
  currentSessionUser = getStorageJson<AuthUser | null>(STORAGE_AUTH_KEY, null);

  // SPEC-024 G2: Alte Versionen haben beim Google-Klick einen erfundenen Nutzer gespeichert. Diesen verwerfen.
  if (!isTestEnv && currentSessionUser?.provider === 'google' && currentSessionUser.id.startsWith('google_')) {
    currentSessionUser = null;
    removeStorageItem(STORAGE_AUTH_KEY);
  }

  // Supabase Auth Listener einmalig registrieren (im Browser, nicht im Test)
  if (typeof window !== 'undefined' && supabase && isSupabaseConfigured && !isTestEnv && !hasSubscribedToSupabaseAuth) {
    hasSubscribedToSupabaseAuth = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const mapped = await mapSupabaseUserToAuthUser(session.user);
        currentSessionUser = mapped;
        setStorageJson(STORAGE_AUTH_KEY, currentSessionUser);
        notifyListeners();
      }
    }).catch(err => {
      console.warn('[Auth] getSession Fehler:', err);
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const mapped = await mapSupabaseUserToAuthUser(session.user);
          currentSessionUser = mapped;
          setStorageJson(STORAGE_AUTH_KEY, currentSessionUser);
          notifyListeners();
        }
      } else if (event === 'SIGNED_OUT') {
        currentSessionUser = null;
        removeStorageItem(STORAGE_AUTH_KEY);
        notifyListeners();
      }
    });
  }

  return currentSessionUser;
}

export function getCurrentAuthUser(): AuthUser | null {
  if (!currentSessionUser) {
    return initAuthSession();
  }
  return currentSessionUser;
}

export function setSessionUser(userOrId: AuthUser | string): AuthUser {
  if (typeof userOrId === 'string') {
    const found = DEMO_USERS[userOrId];
    if (found) {
      currentSessionUser = { ...found };
    } else {
      currentSessionUser = {
        id: userOrId,
        email: `${userOrId}@user.boulderapp.ch`,
        nickname: userOrId,
        isPlatformAdmin: false,
        provider: 'simulation',
        createdAt: new Date().toISOString()
      };
    }
  } else {
    currentSessionUser = { ...userOrId };
  }

  setStorageJson(STORAGE_AUTH_KEY, currentSessionUser);
  notifyListeners();
  return currentSessionUser;
}

/**
 * Registriert einen echten neuen Kletterer mit E-Mail und Passwort bei Supabase.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  nickname?: string
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }
  if (!password || password.length < 6) {
    throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.');
  }

  const cleanNickname = nickname?.trim() || cleanEmail.split('@')[0];

  // In Testumgebungen sofortigen Benutzer erzeugen ohne Netzwerk-Latenz
  if (isTestEnv || !supabase || !isSupabaseConfigured) {
    const fallbackUser: AuthUser = {
      id: 'user_email_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: cleanNickname,
      isPlatformAdmin: false,
      provider: 'email',
      createdAt: new Date().toISOString()
    };
    return setSessionUser(fallbackUser);
  }

  // In realem Supabase registrieren
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        nickname: cleanNickname
      }
    }
  });

  if (signUpError) {
    const msg = signUpError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      throw new Error('Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.');
    }
    throw new Error(`Fehler bei der Registrierung: ${signUpError.message}`);
  }

  if (signUpData.user) {
    // Falls noch keine aktive Session vorliegt, direkt anmelden
    if (!signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (!signInError && signInData.user) {
        const authUser = await mapSupabaseUserToAuthUser(signInData.user);
        return setSessionUser(authUser);
      }
    }

    const authUser = await mapSupabaseUserToAuthUser(signUpData.user);
    return setSessionUser(authUser);
  }

  throw new Error('Registrierung fehlgeschlagen.');
}

/**
 * Meldet einen echten Nutzer mit E-Mail und Passwort an.
 */
export async function signInWithPassword(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }
  if (!password) {
    throw new Error('Bitte ein Passwort angeben.');
  }

  if (isTestEnv || !supabase || !isSupabaseConfigured) {
    const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedDemo) {
      return setSessionUser(matchedDemo);
    }
    const user: AuthUser = {
      id: 'user_email_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: cleanEmail.split('@')[0],
      isPlatformAdmin: false,
      provider: 'email',
      createdAt: new Date().toISOString()
    };
    return setSessionUser(user);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  });

  if (error) {
    // Falls es sich um ein lokales Testkonto handelt und Supabase fehlschlägt
    const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedDemo && password === 'bouldermate2026') {
      return setSessionUser(matchedDemo);
    }
    throw new Error('Ungültige Anmeldedaten. Bitte E-Mail und Passwort prüfen.');
  }

  if (data.user) {
    const authUser = await mapSupabaseUserToAuthUser(data.user);
    return setSessionUser(authUser);
  }

  throw new Error('Anmeldung fehlgeschlagen.');
}

/**
 * Meldet den Nutzer per E-Mail an (mit oder ohne Passwort, abwärtskompatibel).
 */
export async function signInWithEmail(email: string, password?: string): Promise<AuthUser> {
  if (!email || !email.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }

  // Wenn Passwort übergeben wurde, echter Supabase Login
  if (password) {
    return signInWithPassword(email, password);
  }

  // Suche in Demo-Accounts (z.B. für vitest Unit-Tests)
  const matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (matched) {
    return setSessionUser(matched);
  }

  // Test-Fallback
  const generatedId = 'user_email_' + Math.random().toString(36).substring(2, 9);
  const user: AuthUser = {
    id: generatedId,
    email,
    nickname: email.split('@')[0],
    isPlatformAdmin: false,
    provider: 'email',
    createdAt: new Date().toISOString()
  };

  return setSessionUser(user);
}

/**
 * Sendet einen Magic Link (OTP) an die E-Mail-Adresse des Nutzers.
 */
export async function signInWithOtp(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }

  if (!isTestEnv && supabase && isSupabaseConfigured) {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bouldermate.ch';
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      throw new Error(`Fehler beim Senden des Login-Links: ${error.message}`);
    }
    return;
  }

  // Offline / Test Fallback
  const matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === cleanEmail);
  if (matched) {
    setSessionUser(matched);
  }
}

/**
 * SPEC-024 AC-2.1: Startet den echten Google-Login über Supabase (PKCE).
 * Der Browser verlässt danach die App; die Session entsteht erst nach der Rückkehr
 * (siehe finishOAuthRedirect). Hier wird bewusst kein lokaler Nutzer angelegt.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase || !isSupabaseConfigured || typeof window === 'undefined') {
    throw new Error('Google-Anmeldung ist gerade nicht verfügbar.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(`Google-Anmeldung fehlgeschlagen: ${error.message}`);
  }
}

/**
 * SPEC-024 AC-6.1: Mock-Login für Unit-Tests und Offline-Betrieb, getrennt vom echten Ablauf.
 */
export function mockGoogleSignIn(options?: { email?: string; nickname?: string }): AuthUser {
  const email = options?.email || 'kletterer.google@gmail.com';
  const nickname = options?.nickname || email.split('@')[0];

  return setSessionUser({
    id: 'google_' + Math.random().toString(36).substring(2, 10),
    email,
    nickname,
    isPlatformAdmin: false,
    provider: 'google',
    createdAt: new Date().toISOString(),
  });
}

let googleAvailability: Promise<boolean> | null = null;

/**
 * SPEC-024 AC-5.2: Fragt bei Supabase nach, ob der Google-Provider eingeschaltet ist.
 * Ohne Supabase, im Test oder bei Netzwerkfehlern: false (Knopf wird ausgeblendet).
 */
export function isGoogleLoginAvailable(fetchImpl?: typeof fetch): Promise<boolean> {
  if (googleAvailability) return googleAvailability;
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : undefined);
  // Unit-Tests gehen ohne eigenes fetchImpl nie ins Netz
  if (!doFetch || !isSupabaseConfigured || (isTestEnv && !fetchImpl)) {
    return Promise.resolve(false);
  }
  googleAvailability = doFetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: supabaseAnonKey },
  })
    .then(res => (res.ok ? res.json() : null))
    .then(settings => Boolean(settings?.external?.google))
    .catch(() => false);
  return googleAvailability;
}

/** Nur für Tests: Zwischenspeicher von isGoogleLoginAvailable leeren. */
export function resetGoogleLoginAvailabilityCache(): void {
  googleAvailability = null;
}

export type OAuthReturn =
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'error'; message: string };

export const OAUTH_ERROR_CANCELLED = 'Google-Anmeldung abgebrochen. Bitte nochmal versuchen.';
export const OAUTH_ERROR_FAILED = 'Anmeldung fehlgeschlagen. Bitte nochmal versuchen.';

/**
 * SPEC-024 AC-2.3 / AC-5.1: Erkennt die Rückkehr von Google in der Adresse.
 * `?code=` bleibt stehen, weil der Supabase-Client ihn selbst einlöst und danach entfernt.
 * Fehlerparameter werden sofort entfernt, damit Neuladen die Meldung nicht wiederholt.
 */
export function readOAuthReturnFromUrl(
  href: string = typeof window !== 'undefined' ? window.location.href : ''
): OAuthReturn {
  if (!href) return { status: 'none' };
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const error = url.searchParams.get('error') || hash.get('error');

  if (error) {
    const description = url.searchParams.get('error_description') || hash.get('error_description') || '';
    for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
    if (hash.has('error')) url.hash = '';
    if (typeof window !== 'undefined' && window.location.href === href) {
      window.history.replaceState(window.history.state, '', url.toString());
    }
    const cancelled = error === 'access_denied' || /cancel|denied/i.test(description);
    return { status: 'error', message: cancelled ? OAUTH_ERROR_CANCELLED : OAUTH_ERROR_FAILED };
  }

  if (url.searchParams.has('code')) return { status: 'pending' };
  return { status: 'none' };
}

/**
 * SPEC-024 AC-2.4: Wartet, bis der Supabase-Client den ?code= eingelöst hat, und setzt den Nutzer.
 * Gibt null zurück, wenn keine Session entstanden ist; ein liegengebliebener ?code= wird entfernt.
 */
export async function finishOAuthRedirect(): Promise<AuthUser | null> {
  let user: AuthUser | null = null;
  if (supabase && isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        user = setSessionUser(await mapSupabaseUserToAuthUser(data.session.user));
      }
    } catch (err) {
      console.warn('[Auth] OAuth-Rückkehr fehlgeschlagen:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (url.searchParams.has('code') || url.searchParams.has('sb_flow_id')) {
      url.searchParams.delete('code');
      url.searchParams.delete('sb_flow_id');
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }

  return user;
}

/**
 * Loggt den aktuellen Nutzer bei Supabase und lokal synchron aus.
 */
export async function signOut(): Promise<void> {
  currentSessionUser = null;
  removeStorageItem(STORAGE_AUTH_KEY);
  notifyListeners();

  try {
    if (!isTestEnv && supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('[Auth] Supabase signOut Warnung:', err);
  }
}

/**
 * Registriert einen Listener für Authentifizierungs-Statuswechsel.
 */
export function onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export const PRIMARY_FAKE_USERS: AuthUser[] = [
  DEMO_USERS['user-boris'],
  DEMO_USERS['admin-6aplus'],
  DEMO_USERS['schrauber-6aplus'],
  DEMO_USERS['hans-kletterer'],
  DEMO_USERS['admin-minimum'],
  DEMO_USERS['schrauber-minimum'],
];

export function getAvailableTestUsers(): AuthUser[] {
  return PRIMARY_FAKE_USERS;
}

export function isPlatformAdmin(userId: string): boolean {
  if (
    userId === 'user-boris' || 
    userId === '00000000-1d0e-4000-8000-e92d69136f33'
  ) {
    return true;
  }
  const user = DEMO_USERS[userId];
  if (user?.isPlatformAdmin) return true;
  if (currentSessionUser?.id === userId && currentSessionUser.isPlatformAdmin) return true;
  return false;
}
