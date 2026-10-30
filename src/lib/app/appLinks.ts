import { WALL_LINK_PARAM } from '../wallLink';

/**
 * SPEC-045 §4.2: Universal Links (iPhone) und App Links (Android).
 * QR-Codes (`https://bouldermate.ch/?wand=…`) und der Login-Rücksprung (`?code=…`) öffnen die App.
 */

export const APP_LINK_HOSTS = ['bouldermate.ch', 'www.bouldermate.ch'];
/** Rücksprung nach Google/Apple im System-Browser (muss in Supabase → Auth → URL Configuration stehen) */
export const APP_AUTH_REDIRECT_URL = 'https://bouldermate.ch/';

export type AppLink =
  | { kind: 'wall'; sectorId: string }
  | { kind: 'auth'; code: string }
  | { kind: 'email-link'; search: string }
  | { kind: 'auth-error'; message: string }
  | { kind: 'home' }
  | { kind: 'unknown' };

export function parseAppLink(raw: string): AppLink {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: 'unknown' };
  }
  if (url.protocol !== 'https:' || !APP_LINK_HOSTS.includes(url.hostname.toLowerCase())) {
    return { kind: 'unknown' };
  }
  // SPEC-049: Bestätigungs- und «Passwort vergessen»-Links aus der E-Mail behandelt App.tsx selbst
  if (url.searchParams.has('token_hash') || url.searchParams.get('auth') === 'recovery') {
    return { kind: 'email-link', search: url.search };
  }
  const wall = url.searchParams.get(WALL_LINK_PARAM)?.trim();
  if (wall) return { kind: 'wall', sectorId: wall };
  const code = url.searchParams.get('code')?.trim();
  if (code) return { kind: 'auth', code };
  const error = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (error) return { kind: 'auth-error', message: error };
  return { kind: 'home' };
}

/** Ereignis, mit dem die App einen Wand-Link an App.tsx weiterreicht. */
export const WALL_LINK_EVENT = 'bouldermate:wall-link';
