// SPEC-027: «Ansehen als …» – Rollen-Vorschau für Plattform-Admins.
// Die Vorschau kann Rechte nur wegnehmen, nie dazugeben. Wer sie benutzen darf,
// entscheidet authService (getActiveViewAs / canUseViewAs); dieses Modul kennt keine Nutzer.

import { getStorageJson, setStorageJson } from './storageUtils';
import type { UserRoleInfo } from './roleService';
import type { GymMemberRole } from '../types/boulder';

export type ViewAsMode = 'echt' | 'hallen-admin' | 'schrauber' | 'kletterer';

export const VIEW_AS_OPTIONS: { mode: ViewAsMode; label: string; hint: string }[] = [
  { mode: 'echt', label: 'Meine echten Rechte', hint: 'Alle Hallen, alles erlaubt' },
  { mode: 'hallen-admin', label: 'Hallen-Admin', hint: 'Admin + Schrauber + Kletterer' },
  { mode: 'schrauber', label: 'Schrauber', hint: 'Schrauber + Kletterer' },
  { mode: 'kletterer', label: 'Nur Kletterer', hint: 'Keine Sonderrechte' },
];

const STORAGE_KEY = 'bm_view_as_v1';
const MODES: ViewAsMode[] = VIEW_AS_OPTIONS.map(o => o.mode);
const listeners = new Set<(mode: ViewAsMode) => void>();

/**
 * AC-5: Abschalten ohne Code-Änderung. In Vercel (oder .env.local) `VITE_ROLLEN_VORSCHAU=aus` setzen
 * und neu bauen; dann gibt es den Umschalter nirgends mehr und jede gespeicherte Vorschau ist wirkungslos.
 */
export function isViewAsFeatureEnabled(): boolean {
  const flag = import.meta.env.VITE_ROLLEN_VORSCHAU;
  return String(flag ?? '').trim().toLowerCase() !== 'aus';
}

export function getStoredViewAs(): ViewAsMode {
  const stored = getStorageJson<string>(STORAGE_KEY, 'echt');
  return MODES.includes(stored as ViewAsMode) ? (stored as ViewAsMode) : 'echt';
}

export function setStoredViewAs(mode: ViewAsMode): void {
  if (!MODES.includes(mode)) return;
  setStorageJson(STORAGE_KEY, mode);
  listeners.forEach(l => l(mode));
}

export function onViewAsChange(listener: (mode: ViewAsMode) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getViewAsLabel(mode: ViewAsMode): string {
  return VIEW_AS_OPTIONS.find(o => o.mode === mode)?.label ?? 'Meine echten Rechte';
}

/**
 * AC-2: Ersetzt die Rollen eines Plattform-Admins durch die gewählte Vorschau.
 * Wird nur auf Plattform-Admins angewendet, deshalb ist jede Vorschau eine echte Teilmenge.
 */
export function applyViewAs(info: UserRoleInfo, mode: ViewAsMode): UserRoleInfo {
  if (mode === 'echt') return info;

  const isAdmin = mode === 'hallen-admin';
  const isSetter = isAdmin || mode === 'schrauber';
  const roles: GymMemberRole[] = ['member'];
  if (isSetter) roles.push('setter');
  if (isAdmin) roles.push('admin');

  return {
    ...info,
    roles,
    isAdmin,
    isSetter,
    isPlatformAdmin: false,
    canAccessSetterStudio: isSetter,
    canAccessAdminConsole: isAdmin,
    canCreateGyms: false,
    canAppointSetters: isAdmin,
    canAppointAdmins: isAdmin,
  };
}
