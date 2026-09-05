import { GymMemberRole } from '../types/boulder';
import { GymMember } from '../types/gym';
import { getMembers, saveMembers } from './gymStorage';
import { isPlatformAdmin as checkPlatformAdmin } from './authService';

export type AppMode = 'climber' | 'setter' | 'admin';

export interface UserRoleInfo {
  userId: string;
  gymId?: string;
  roles: GymMemberRole[];
  isClimber: true; // SPEC-000: Jeder Nutzer ist IMMER ein Kletterer
  isAdmin: boolean;
  isSetter: boolean;
  isPlatformAdmin: boolean;
  canAccessSetterStudio: boolean;
  canAccessAdminConsole: boolean;
  canCreateGyms: boolean;
  canAppointSetters: boolean;
  canAppointAdmins: boolean;
}

export function isPlatformAdmin(userId: string): boolean {
  return checkPlatformAdmin(userId);
}

export function canUserCreateGym(userId: string): boolean {
  return isPlatformAdmin(userId);
}

/**
 * Ermittelt die Rollen und Berechtigungen eines Nutzers.
 * Falls `gymId` angegeben ist, wird die Prüfung strikt auf diese Halle isoliert (Gym Scoping).
 */
export function getUserRoleInfo(userId: string, gymId?: string): UserRoleInfo {
  const roles = new Set<GymMemberRole>(['member']);
  const platformAdmin = isPlatformAdmin(userId);
  const isBoris = userId === 'user-boris' || userId === 'user_boris_001';

  // Boris ist Plattform-Admin und spezifisch Schrauber und Admin für 6a plus!
  if (isBoris) {
    if (!gymId || gymId === 'gym-6a-plus' || gymId.toLowerCase().includes('6a') || gymId === 'gym-minimum-zh') {
      roles.add('admin');
      roles.add('setter');
    }
  } else if (userId === 'climber-1') {
    roles.add('setter');
  }

  // Hallenspezifische Rollen aus Storage abfragen
  try {
    const allMembers = getMembers();
    const relevantMembers = allMembers.filter(m => 
      (m.user_id === userId || (isBoris && (m.user_id === 'user-boris' || m.user_id === 'user_boris_001'))) &&
      (!gymId || m.gym_id === gymId)
    );

    for (const m of relevantMembers) {
      if (m.role === 'admin') {
        roles.add('admin');
        roles.add('setter'); // Admins dürfen in ihrer Halle auch schrauben
      } else if (m.role === 'setter') {
        roles.add('setter');
      }
    }
  } catch (e) {
    // Graceful fallback in environments without storage
  }

  const rolesArray = Array.from(roles);
  const isAdmin = roles.has('admin');
  const isSetter = roles.has('setter');

  return {
    userId,
    gymId,
    roles: rolesArray,
    isClimber: true,
    isAdmin,
    isSetter,
    isPlatformAdmin: platformAdmin,
    canAccessSetterStudio: isSetter || isAdmin || platformAdmin,
    canAccessAdminConsole: isAdmin || platformAdmin,
    canCreateGyms: platformAdmin,
    canAppointSetters: isAdmin || platformAdmin,
    canAppointAdmins: isAdmin || platformAdmin,
  };
}

/**
 * Hallen-Admin ernennt einen Nutzer zum Schrauber für eine spezifische Halle.
 */
export function appointGymSetter(gymId: string, targetUserId: string, callerUserId: string): GymMember {
  const callerInfo = getUserRoleInfo(callerUserId, gymId);
  if (!callerInfo.canAppointSetters) {
    throw new Error('Nur Hallen-Administratoren dieser Halle dürfen Schrauber ernennen.');
  }

  const members = getMembers();
  const existing = members.find(m => m.gym_id === gymId && m.user_id === targetUserId);

  if (existing) {
    existing.role = 'setter';
    existing.appointed_by = callerUserId;
    saveMembers([...members]);
    return existing;
  }

  const newMember: GymMember = {
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    gym_id: gymId,
    user_id: targetUserId,
    role: 'setter',
    appointed_by: callerUserId,
    created_at: new Date().toISOString(),
  };

  saveMembers([...members, newMember]);
  return newMember;
}

/**
 * Hallen-Admin entzieht einem Nutzer die Schrauber-Rolle für eine spezifische Halle.
 */
export function revokeGymSetter(gymId: string, targetUserId: string, callerUserId: string): void {
  const callerInfo = getUserRoleInfo(callerUserId, gymId);
  if (!callerInfo.canAppointSetters) {
    throw new Error('Nur Hallen-Administratoren dieser Halle dürfen Schrauber-Rechte entziehen.');
  }

  const members = getMembers();
  const filtered = members.filter(m => !(m.gym_id === gymId && m.user_id === targetUserId && m.role === 'setter'));
  saveMembers(filtered);
}

/**
 * Hallen-Admin oder Plattform-Admin ernennt einen weiteren Nutzer zum Hallen-Admin.
 */
export function appointGymAdmin(gymId: string, targetUserId: string, callerUserId: string): GymMember {
  const callerInfo = getUserRoleInfo(callerUserId, gymId);
  if (!callerInfo.canAppointAdmins) {
    throw new Error('Nur bestehende Hallen-Administratoren oder Plattform-Admins dürfen neue Hallen-Admins ernennen.');
  }

  const members = getMembers();
  const existing = members.find(m => m.gym_id === gymId && m.user_id === targetUserId);

  if (existing) {
    existing.role = 'admin';
    existing.appointed_by = callerUserId;
    saveMembers([...members]);
    return existing;
  }

  const newAdmin: GymMember = {
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    gym_id: gymId,
    user_id: targetUserId,
    role: 'admin',
    appointed_by: callerUserId,
    created_at: new Date().toISOString(),
  };

  saveMembers([...members, newAdmin]);
  return newAdmin;
}

/**
 * Entzieht die Hallen-Admin-Rolle (inklusive Schutz vor verwaisten Hallen).
 */
export function revokeGymAdmin(gymId: string, targetUserId: string, callerUserId: string): void {
  const callerInfo = getUserRoleInfo(callerUserId, gymId);
  if (!callerInfo.canAppointAdmins) {
    throw new Error('Nur Hallen-Administratoren dürfen Admin-Rechte verwalten.');
  }

  const members = getMembers();
  const gymAdmins = members.filter(m => m.gym_id === gymId && m.role === 'admin');

  // Schutz vor verwaister Halle: Wenn dies der einzige Admin ist und der Caller kein Plattform-Admin ist
  if (gymAdmins.length <= 1 && gymAdmins.some(a => a.user_id === targetUserId) && !callerInfo.isPlatformAdmin) {
    throw new Error('Der letzte Hallen-Administrator kann nicht entfernt werden (Schutz vor verwaisten Hallen).');
  }

  const filtered = members.filter(m => !(m.gym_id === gymId && m.user_id === targetUserId && m.role === 'admin'));
  saveMembers(filtered);
}

/**
 * Ruft alle Schrauber und Admins für eine gegebene Halle ab.
 */
export function getGymTeamMembers(gymId: string): GymMember[] {
  return getMembers().filter(m => m.gym_id === gymId && (m.role === 'setter' || m.role === 'admin'));
}
