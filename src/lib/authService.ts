// SPEC-000: Authentifizierung & Identity Service
// Verwaltet Sessions, Google OAuth-Anbindung und Benutzerprofile.

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  isPlatformAdmin: boolean;
  provider: 'google' | 'email' | 'apple' | 'simulation';
  createdAt: string;
}

const STORAGE_AUTH_KEY = 'boulder_auth_session_v1';

export const DEMO_USERS: Record<string, AuthUser> = {
  'user-boris': {
    id: 'user-boris',
    email: 'boris@boulderapp.ch',
    nickname: 'Boris',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop',
    isPlatformAdmin: true,
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  'user_boris_001': {
    id: 'user_boris_001',
    email: 'boris.platform@boulderapp.ch',
    nickname: 'Boris D.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop',
    isPlatformAdmin: true,
    provider: 'simulation',
    createdAt: '2026-09-01T10:00:00Z'
  },
  'user-jonas': {
    id: 'user-jonas',
    email: 'jonas@boulderapp.ch',
    nickname: 'Jonas',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    provider: 'simulation',
    createdAt: '2026-09-02T11:30:00Z'
  },
  'user-lena': {
    id: 'user-lena',
    email: 'lena@boulderapp.ch',
    nickname: 'Lena',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    provider: 'simulation',
    createdAt: '2026-09-03T14:15:00Z'
  },
  'user-sophie': {
    id: 'user-sophie',
    email: 'sophie@boulderapp.ch',
    nickname: 'Sophie',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&auto=format&fit=crop',
    isPlatformAdmin: false,
    provider: 'simulation',
    createdAt: '2026-09-04T09:00:00Z'
  },
  'climber-1': {
    id: 'climber-1',
    email: 'alex@boulderapp.ch',
    nickname: 'Alex',
    isPlatformAdmin: false,
    provider: 'simulation',
    createdAt: '2026-09-02T16:00:00Z'
  }
};

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

export function initAuthSession(): AuthUser {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_AUTH_KEY);
      if (stored) {
        currentSessionUser = JSON.parse(stored);
        return currentSessionUser!;
      }
    } catch (e) {
      console.error('Failed restoring auth session:', e);
    }
  }
  // Default fallback user (Boris)
  currentSessionUser = DEMO_USERS['user-boris'];
  return currentSessionUser;
}

export function getCurrentAuthUser(): AuthUser {
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

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(currentSessionUser));
    } catch (e) {
      console.error('Failed saving auth session:', e);
    }
  }

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
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch (e) {
      console.error('Failed clearing auth session:', e);
    }
  }
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

export function getAvailableTestUsers(): AuthUser[] {
  return Object.values(DEMO_USERS);
}

export function isPlatformAdmin(userId: string): boolean {
  if (userId === 'user-boris' || userId === 'user_boris_001') {
    return true;
  }
  const user = DEMO_USERS[userId];
  if (user?.isPlatformAdmin) return true;
  if (currentSessionUser?.id === userId && currentSessionUser.isPlatformAdmin) return true;
  return false;
}
