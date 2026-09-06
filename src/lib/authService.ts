// SPEC-000: Authentifizierung & Identity Service
// Verwaltet Sessions, Google OAuth-Anbindung und Benutzerprofile.

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

import {
  getStorageJson,
  setStorageJson,
  removeStorageItem,
} from './storageUtils';

let currentSessionUser: AuthUser | null = null;
const authListeners: Array<(user: AuthUser | null) => void> = [];

function notifyListeners(): void {
  for (const listener of authListeners) {
    try {
      listener(currentSessionUser);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  }
}

export function initAuthSession(): AuthUser | null {
  currentSessionUser = getStorageJson<AuthUser | null>(STORAGE_AUTH_KEY, null);
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
 * Simuliert oder führt einen Google OAuth 2.0 Login durch.
 * In Supabase: supabase.auth.signInWithOAuth({ provider: 'google' })
 */
export async function signInWithGoogle(options?: { email?: string; nickname?: string }): Promise<AuthUser> {
  const email = options?.email || 'kletterer.google@gmail.com';
  const nickname = options?.nickname || email.split('@')[0];
  const googleId = 'google_' + Math.random().toString(36).substring(2, 10);

  const newUser: AuthUser = {
    id: googleId,
    email,
    nickname,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    provider: 'google',
    createdAt: new Date().toISOString()
  };

  return setSessionUser(newUser);
}

/**
 * Meldet den Nutzer per E-Mail an oder registriert ihn.
 */
export async function signInWithEmail(email: string, _password?: string): Promise<AuthUser> {
  if (!email || !email.includes('@')) {
    throw new Error('Bitte eine gültige E-Mail-Adresse angeben.');
  }

  // Suche in Demo-Accounts
  const matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (matched) {
    return setSessionUser(matched);
  }

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
 * Loggt den aktuellen Nutzer aus und setzt Session zurück.
 */
export async function signOut(): Promise<void> {
  currentSessionUser = null;
  removeStorageItem(STORAGE_AUTH_KEY);
  notifyListeners();
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
  if (userId === 'user-boris') {
    return true;
  }
  const user = DEMO_USERS[userId];
  if (user?.isPlatformAdmin) return true;
  if (currentSessionUser?.id === userId && currentSessionUser.isPlatformAdmin) return true;
  return false;
}
