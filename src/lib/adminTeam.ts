import { GymMember } from '../types/gym';
import { UserProfile } from '../types/boulder';

/** SPEC-023 F6 · Team-Liste: eine Zeile pro Person statt pro Rollen-Eintrag. */

export type TeamRole = 'admin' | 'setter';

export interface TeamPerson {
  userId: string;
  name: string;
  avatarUrl?: string;
  roles: TeamRole[];
}

const ROLE_ORDER: TeamRole[] = ['admin', 'setter'];

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function groupTeamByPerson(members: GymMember[], profiles: UserProfile[]): TeamPerson[] {
  const byUser = new Map<string, TeamPerson>();
  for (const m of members) {
    if (m.role !== 'admin' && m.role !== 'setter') continue;
    let person = byUser.get(m.user_id);
    if (!person) {
      const profile = profiles.find(p => p.id === m.user_id);
      person = {
        userId: m.user_id,
        name: profile?.nickname || m.user_id,
        avatarUrl: profile?.avatarUrl,
        roles: [],
      };
      byUser.set(m.user_id, person);
    }
    if (!person.roles.includes(m.role)) person.roles.push(m.role);
  }
  const list = [...byUser.values()];
  list.forEach(p => p.roles.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)));
  // Admins zuerst, dann alphabetisch
  return list.sort((a, b) => {
    const aAdmin = a.roles.includes('admin') ? 0 : 1;
    const bAdmin = b.roles.includes('admin') ? 0 : 1;
    if (aAdmin !== bAdmin) return aAdmin - bAdmin;
    return a.name.localeCompare(b.name, 'de');
  });
}

/** Personen-Suche nach Nickname, ohne Groß/Klein und Akzente. Leere Suche liefert nichts. */
export function searchTeamCandidates(query: string, profiles: UserProfile[], limit = 8): UserProfile[] {
  const q = normalize(query);
  if (!q) return [];
  return profiles
    .filter(p => normalize(p.nickname).includes(q))
    .sort((a, b) => {
      const aStarts = normalize(a.nickname).startsWith(q) ? 0 : 1;
      const bStarts = normalize(b.nickname).startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.nickname.localeCompare(b.nickname, 'de');
    })
    .slice(0, limit);
}

export const ROLE_LABEL: Record<TeamRole, string> = {
  admin: 'Admin',
  setter: 'Schrauber',
};
