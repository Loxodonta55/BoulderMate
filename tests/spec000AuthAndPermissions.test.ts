import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserRoleInfo,
  appointGymSetter,
  revokeGymSetter,
  appointGymAdmin,
  revokeGymAdmin,
  getGymTeamMembers,
  canUserCreateGym
} from '../src/lib/roleService';
import {
  createGym,
  resetAllGymData
} from '../src/lib/gymStorage';
import {
  signInWithGoogle,
  signInWithEmail,
  signOut,
  getCurrentAuthUser,
  setSessionUser,
  getAvailableTestUsers
} from '../src/lib/authService';

describe('SPEC-000: Authentifizierung, Rollen- & Berechtigungskonzept (Feature 0)', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    setSessionUser('user-boris');
  });

  describe('AC-1: Universelle Kletterer-Rolle (Climber Base Role)', () => {
    it('guarantees that every user is always a climber across all gyms', () => {
      const boris = getUserRoleInfo('user-boris', 'gym-any');
      expect(boris.isClimber).toBe(true);
      expect(boris.roles).toContain('member');

      const hans = getUserRoleInfo('hans-kletterer', 'gym-any');
      expect(hans.isClimber).toBe(true);
      expect(hans.roles).toContain('member');

      const schrauber = getUserRoleInfo('schrauber-6aplus', 'gym-any');
      expect(schrauber.isClimber).toBe(true);
      expect(schrauber.roles).toContain('member');

      const randomClimber = getUserRoleInfo('random-climber-999', 'gym-any');
      expect(randomClimber.isClimber).toBe(true);
      expect(randomClimber.roles).toContain('member');
    });
  });

  describe('AC-2 & AC-3: Authentifizierung via Google OAuth & E-Mail', () => {
    it('allows signing in with Google and initializes profile', async () => {
      const user = await signInWithGoogle({ email: 'outdoor.climber@gmail.com', nickname: 'RockClimber' });
      expect(user).toBeDefined();
      expect(user.provider).toBe('google');
      expect(user.email).toBe('outdoor.climber@gmail.com');
      expect(user.nickname).toBe('RockClimber');
      expect(user.isPlatformAdmin).toBe(false);

      const current = getCurrentAuthUser();
      expect(current).not.toBeNull();
      expect(current?.id).toBe(user.id);
    });

    it('allows signing in with email or switching test users', async () => {
      const user = await signInWithEmail('hans@kletterer.ch');
      expect(user.id).toBe('hans-kletterer');
      expect(user.nickname).toBe('HansDereinfacheKletterer');

      await signOut();
      expect(getCurrentAuthUser()).toBeNull();
      // After sign out, fallback or null
      setSessionUser('admin-6aplus');
      expect(getCurrentAuthUser()?.id).toBe('admin-6aplus');
    });
  });

  describe('AC-4: Hallenbezogene Schrauber-Rolle (Gym Scoping)', () => {
    it('grants setter studio access only for the specific gym', () => {
      // Create two distinct gyms via Platform Admin Boris
      const gymA = createGym({ name: 'Minimum Zürich' }, 'user-boris');
      const gymB = createGym({ name: 'Bouldergarten Berlin' }, 'user-boris');

      // Appoint Hans as setter exclusively for Gym A
      appointGymSetter(gymA.id, 'hans-kletterer', 'user-boris');

      // In Gym A: Hans has setter rights and can access setter studio
      const hansInGymA = getUserRoleInfo('hans-kletterer', gymA.id);
      expect(hansInGymA.isSetter).toBe(true);
      expect(hansInGymA.canAccessSetterStudio).toBe(true);
      expect(hansInGymA.isAdmin).toBe(false);

      // In Gym B: Hans is a pure climber! No setter studio access!
      const hansInGymB = getUserRoleInfo('hans-kletterer', gymB.id);
      expect(hansInGymB.isSetter).toBe(false);
      expect(hansInGymB.canAccessSetterStudio).toBe(false);
      expect(hansInGymB.isAdmin).toBe(false);
      expect(hansInGymB.isClimber).toBe(true);
    });

    it('grants Boris setter permissions explicitly for 6a plus (gym-6a-plus)', () => {
      const boris6a = getUserRoleInfo('user-boris', 'gym-6a-plus');
      expect(boris6a.isSetter).toBe(true);
      expect(boris6a.isAdmin).toBe(true);
      expect(boris6a.canAccessSetterStudio).toBe(true);
    });
  });

  describe('AC-5 & AC-6: Rollen-Delegation durch Hallen-Admins', () => {
    it('allows a gym admin to appoint and revoke setters in their own gym', () => {
      const gym = createGym({ name: 'Kraftreaktor Lenzburg' }, 'user-boris');
      
      // Appoint AdminMinimum as Admin for this gym
      appointGymAdmin(gym.id, 'admin-minimum', 'user-boris');

      // AdminMinimum (Gym Admin) can appoint Hans as setter
      appointGymSetter(gym.id, 'hans-kletterer', 'admin-minimum');

      let hansInfo = getUserRoleInfo('hans-kletterer', gym.id);
      expect(hansInfo.isSetter).toBe(true);
      expect(hansInfo.canAccessSetterStudio).toBe(true);

      // AdminMinimum can revoke Hans's setter rights
      revokeGymSetter(gym.id, 'hans-kletterer', 'admin-minimum');
      hansInfo = getUserRoleInfo('hans-kletterer', gym.id);
      expect(hansInfo.isSetter).toBe(false);
      expect(hansInfo.canAccessSetterStudio).toBe(false);
    });

    it('forbids a regular user from appointing setters', () => {
      const gym = createGym({ name: 'Griffig Uster' }, 'user-boris');

      // Hans is not an admin
      expect(() => {
        appointGymSetter(gym.id, 'schrauber-6aplus', 'hans-kletterer');
      }).toThrow('Nur Hallen-Administratoren dieser Halle dürfen Schrauber ernennen.');
    });

    it('protects against removing the last gym admin (Lockout-Schutz)', () => {
      const gym = createGym({ name: 'Bimano Bern' }, 'user-boris');
      appointGymAdmin(gym.id, 'admin-minimum', 'user-boris');

      // First remove user-boris from this gym so only AdminMinimum is admin
      revokeGymAdmin(gym.id, 'user-boris', 'user-boris');

      // Now AdminMinimum is the sole remaining admin for this gym
      // Attempting to remove AdminMinimum without platform admin authority throws
      expect(() => {
        revokeGymAdmin(gym.id, 'admin-minimum', 'admin-minimum');
      }).toThrow('Der letzte Hallen-Administrator kann nicht entfernt werden (Schutz vor verwaisten Hallen).');
    });

    it('allows inspecting team members of a gym', () => {
      const gym = createGym({ name: 'City Bouldering' }, 'user-boris');
      appointGymSetter(gym.id, 'schrauber-6aplus', 'user-boris');
      appointGymAdmin(gym.id, 'admin-6aplus', 'user-boris');

      const team = getGymTeamMembers(gym.id);
      expect(team.length).toBeGreaterThanOrEqual(2);
      expect(team.some(m => m.user_id === 'schrauber-6aplus' && m.role === 'setter')).toBe(true);
      expect(team.some(m => m.user_id === 'admin-6aplus' && m.role === 'admin')).toBe(true);
    });
  });

  describe('AC-7: Plattform-Admin Rolle & Hallenerstellung-Schutz', () => {
    it('allows only platform admins to create new gyms', () => {
      expect(canUserCreateGym('user-boris')).toBe(true);
      expect(canUserCreateGym('hans-kletterer')).toBe(false);
      expect(canUserCreateGym('schrauber-6aplus')).toBe(false);
      expect(canUserCreateGym('admin-6aplus')).toBe(false);

      // Platform admin successfully creates gym
      const newGym = createGym({ name: 'Boulderwelt München' }, 'user-boris');
      expect(newGym.name).toBe('Boulderwelt München');

      // Regular climber throws forbidden error
      expect(() => {
        createGym({ name: 'Illegal Gym' }, 'hans-kletterer');
      }).toThrow('Nur Plattform-Administratoren dürfen neue Hallen anlegen.');

      // Even a gym admin of another gym cannot create a new gym unless platform admin
      expect(() => {
        createGym({ name: 'Illegal Gym 2' }, 'admin-6aplus');
      }).toThrow('Nur Plattform-Administratoren dürfen neue Hallen anlegen.');
    });
  });

  describe('AC-8: Spezifische 6 Fake-Profile & Berechtigungsmatrix', () => {
    it('provides all 6 fake users in getAvailableTestUsers() in exact order', () => {
      const users = getAvailableTestUsers();
      expect(users.length).toBe(6);
      expect(users[0].id).toBe('user-boris');
      expect(users[0].nickname).toBe('Boris');
      expect(users[0].isPlatformAdmin).toBe(true);

      expect(users[1].id).toBe('admin-6aplus');
      expect(users[1].nickname).toBe('Admin6APlus');
      expect(users[1].isPlatformAdmin).toBe(false);

      expect(users[2].id).toBe('schrauber-6aplus');
      expect(users[2].nickname).toBe('Schrauber6aPlus');
      expect(users[2].isPlatformAdmin).toBe(false);

      expect(users[3].id).toBe('hans-kletterer');
      expect(users[3].nickname).toBe('HansDereinfacheKletterer');
      expect(users[3].isPlatformAdmin).toBe(false);

      expect(users[4].id).toBe('admin-minimum');
      expect(users[4].nickname).toBe('AdminMinimum');
      expect(users[4].isPlatformAdmin).toBe(false);

      expect(users[5].id).toBe('schrauber-minimum');
      expect(users[5].nickname).toBe('Schrauber Minimum');
      expect(users[5].isPlatformAdmin).toBe(false);
    });

    it('validates Boris as OverAdmin who can create gyms and appoint admins', () => {
      expect(canUserCreateGym('user-boris')).toBe(true);
      const newGym = createGym({
        name: 'Aranea Schaffhausen',
        initial_admin_user_id: 'admin-6aplus'
      }, 'user-boris');
      expect(newGym.name).toBe('Aranea Schaffhausen');

      // Boris can appoint admins for this gym
      const team = getGymTeamMembers(newGym.id);
      expect(team.some(m => m.user_id === 'admin-6aplus' && m.role === 'admin')).toBe(true);

      // Boris has systemwide admin console and setter studio access
      const borisRole = getUserRoleInfo('user-boris', newGym.id);
      expect(borisRole.isPlatformAdmin).toBe(true);
      expect(borisRole.canCreateGyms).toBe(true);
      expect(borisRole.canAppointAdmins).toBe(true);
      expect(borisRole.canAppointSetters).toBe(true);
      expect(borisRole.canAccessAdminConsole).toBe(true);
      expect(borisRole.canAccessSetterStudio).toBe(true);
    });

    it('validates Admin6APlus: HallenAdmin in 6aPlus, but purely a climber in Minimum', () => {
      // In 6a plus: Admin & Setter
      const in6a = getUserRoleInfo('admin-6aplus', 'gym-6a-plus');
      expect(in6a.isAdmin).toBe(true);
      expect(in6a.isSetter).toBe(true);
      expect(in6a.canAccessAdminConsole).toBe(true);
      expect(in6a.canAccessSetterStudio).toBe(true);
      expect(in6a.canCreateGyms).toBe(false);

      // In Minimum: standard climber
      const inMin = getUserRoleInfo('admin-6aplus', 'gym-minimum-zh');
      expect(inMin.isAdmin).toBe(false);
      expect(inMin.isSetter).toBe(false);
      expect(inMin.canAccessAdminConsole).toBe(false);
      expect(inMin.canAccessSetterStudio).toBe(false);
      expect(inMin.isClimber).toBe(true);
    });

    it('validates Schrauber6aPlus: Setter in 6aPlus, but purely a climber in Minimum', () => {
      // In 6a plus: Setter only, NO Admin
      const in6a = getUserRoleInfo('schrauber-6aplus', 'gym-6a-plus');
      expect(in6a.isSetter).toBe(true);
      expect(in6a.isAdmin).toBe(false);
      expect(in6a.canAccessSetterStudio).toBe(true);
      expect(in6a.canAccessAdminConsole).toBe(false);
      expect(in6a.canCreateGyms).toBe(false);

      // In Minimum: standard climber
      const inMin = getUserRoleInfo('schrauber-6aplus', 'gym-minimum-zh');
      expect(inMin.isSetter).toBe(false);
      expect(inMin.isAdmin).toBe(false);
      expect(inMin.canAccessSetterStudio).toBe(false);
      expect(inMin.canAccessAdminConsole).toBe(false);
      expect(inMin.isClimber).toBe(true);
    });

    it('validates HansDereinfacheKletterer: Pure climber across all gyms', () => {
      const in6a = getUserRoleInfo('hans-kletterer', 'gym-6a-plus');
      expect(in6a.isClimber).toBe(true);
      expect(in6a.isAdmin).toBe(false);
      expect(in6a.isSetter).toBe(false);
      expect(in6a.canAccessSetterStudio).toBe(false);
      expect(in6a.canAccessAdminConsole).toBe(false);
      expect(in6a.canCreateGyms).toBe(false);

      const inMin = getUserRoleInfo('hans-kletterer', 'gym-minimum-zh');
      expect(inMin.isClimber).toBe(true);
      expect(inMin.isAdmin).toBe(false);
      expect(inMin.isSetter).toBe(false);
      expect(inMin.canAccessSetterStudio).toBe(false);
      expect(inMin.canAccessAdminConsole).toBe(false);
    });

    it('validates AdminMinimum: HallenAdmin in Minimum, but purely a climber in 6aPlus', () => {
      // In Minimum: Admin & Setter
      const inMin = getUserRoleInfo('admin-minimum', 'gym-minimum-zh');
      expect(inMin.isAdmin).toBe(true);
      expect(inMin.isSetter).toBe(true);
      expect(inMin.canAccessAdminConsole).toBe(true);
      expect(inMin.canAccessSetterStudio).toBe(true);
      expect(inMin.canCreateGyms).toBe(false);

      // In 6a plus: standard climber
      const in6a = getUserRoleInfo('admin-minimum', 'gym-6a-plus');
      expect(in6a.isAdmin).toBe(false);
      expect(in6a.isSetter).toBe(false);
      expect(in6a.canAccessAdminConsole).toBe(false);
      expect(in6a.canAccessSetterStudio).toBe(false);
      expect(in6a.isClimber).toBe(true);
    });

    it('validates Schrauber Minimum: Setter in Minimum, but purely a climber in 6aPlus', () => {
      // In Minimum: Setter only, NO Admin
      const inMin = getUserRoleInfo('schrauber-minimum', 'gym-minimum-zh');
      expect(inMin.isSetter).toBe(true);
      expect(inMin.isAdmin).toBe(false);
      expect(inMin.canAccessSetterStudio).toBe(true);
      expect(inMin.canAccessAdminConsole).toBe(false);
      expect(inMin.canCreateGyms).toBe(false);

      // In 6a plus: standard climber
      const in6a = getUserRoleInfo('schrauber-minimum', 'gym-6a-plus');
      expect(in6a.isSetter).toBe(false);
      expect(in6a.isAdmin).toBe(false);
      expect(in6a.canAccessSetterStudio).toBe(false);
      expect(in6a.canAccessAdminConsole).toBe(false);
      expect(in6a.isClimber).toBe(true);
    });
  });
});
