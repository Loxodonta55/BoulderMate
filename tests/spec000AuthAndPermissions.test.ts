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
  setSessionUser
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

      const jonas = getUserRoleInfo('user-jonas', 'gym-any');
      expect(jonas.isClimber).toBe(true);
      expect(jonas.roles).toContain('member');

      const lena = getUserRoleInfo('user-lena', 'gym-any');
      expect(lena.isClimber).toBe(true);
      expect(lena.roles).toContain('member');

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
      expect(current.id).toBe(user.id);
    });

    it('allows signing in with email or switching test users', async () => {
      const user = await signInWithEmail('jonas@boulderapp.ch');
      expect(user.id).toBe('user-jonas');
      expect(user.nickname).toBe('Jonas');

      await signOut();
      // After sign out, fallback or null
      setSessionUser('user-lena');
      expect(getCurrentAuthUser().id).toBe('user-lena');
    });
  });

  describe('AC-4: Hallenbezogene Schrauber-Rolle (Gym Scoping)', () => {
    it('grants setter studio access only for the specific gym', () => {
      // Create two distinct gyms via Platform Admin Boris
      const gymA = createGym({ name: 'Minimum Zürich' }, 'user_boris_001');
      const gymB = createGym({ name: 'Bouldergarten Berlin' }, 'user_boris_001');

      // Appoint Jonas as setter exclusively for Gym A
      appointGymSetter(gymA.id, 'user-jonas', 'user_boris_001');

      // In Gym A: Jonas has setter rights and can access setter studio
      const jonasInGymA = getUserRoleInfo('user-jonas', gymA.id);
      expect(jonasInGymA.isSetter).toBe(true);
      expect(jonasInGymA.canAccessSetterStudio).toBe(true);
      expect(jonasInGymA.isAdmin).toBe(false);

      // In Gym B: Jonas is a pure climber! No setter studio access!
      const jonasInGymB = getUserRoleInfo('user-jonas', gymB.id);
      expect(jonasInGymB.isSetter).toBe(false);
      expect(jonasInGymB.canAccessSetterStudio).toBe(false);
      expect(jonasInGymB.isAdmin).toBe(false);
      expect(jonasInGymB.isClimber).toBe(true);
    });

    it('grants Boris setter permissions explicitly for 6a plus (gym-6a-plus)', () => {
      const boris6a = getUserRoleInfo('user-boris', 'gym-6a-plus');
      expect(boris6a.isSetter).toBe(true);
      expect(boris6a.isAdmin).toBe(true);
      expect(boris6a.canAccessSetterStudio).toBe(true);

      const boris0016a = getUserRoleInfo('user_boris_001', 'gym-6a-plus');
      expect(boris0016a.isSetter).toBe(true);
      expect(boris0016a.canAccessSetterStudio).toBe(true);
    });
  });

  describe('AC-5 & AC-6: Rollen-Delegation durch Hallen-Admins', () => {
    it('allows a gym admin to appoint and revoke setters in their own gym', () => {
      const gym = createGym({ name: 'Kraftreaktor Lenzburg' }, 'user_boris_001');
      
      // Appoint Sophie as Admin for this gym
      appointGymAdmin(gym.id, 'user-sophie', 'user_boris_001');

      // Sophie (Gym Admin) can appoint Lena as setter
      appointGymSetter(gym.id, 'user-lena', 'user-sophie');

      let lenaInfo = getUserRoleInfo('user-lena', gym.id);
      expect(lenaInfo.isSetter).toBe(true);
      expect(lenaInfo.canAccessSetterStudio).toBe(true);

      // Sophie can revoke Lena's setter rights
      revokeGymSetter(gym.id, 'user-lena', 'user-sophie');
      lenaInfo = getUserRoleInfo('user-lena', gym.id);
      expect(lenaInfo.isSetter).toBe(false);
      expect(lenaInfo.canAccessSetterStudio).toBe(false);
    });

    it('forbids a regular user from appointing setters', () => {
      const gym = createGym({ name: 'Griffig Uster' }, 'user_boris_001');

      // Lena is not an admin
      expect(() => {
        appointGymSetter(gym.id, 'user-jonas', 'user-lena');
      }).toThrow('Nur Hallen-Administratoren dieser Halle dürfen Schrauber ernennen.');
    });

    it('protects against removing the last gym admin (Lockout-Schutz)', () => {
      const gym = createGym({ name: 'Bimano Bern' }, 'user_boris_001');
      appointGymAdmin(gym.id, 'user-sophie', 'user_boris_001');

      // First remove user_boris_001 from this gym so only Sophie is admin
      revokeGymAdmin(gym.id, 'user_boris_001', 'user_boris_001');

      // Now Sophie is the sole remaining admin for this gym
      // Attempting to remove Sophie without platform admin authority throws
      expect(() => {
        revokeGymAdmin(gym.id, 'user-sophie', 'user-sophie');
      }).toThrow('Der letzte Hallen-Administrator kann nicht entfernt werden (Schutz vor verwaisten Hallen).');
    });

    it('allows inspecting team members of a gym', () => {
      const gym = createGym({ name: 'City Bouldering' }, 'user_boris_001');
      appointGymSetter(gym.id, 'user-jonas', 'user_boris_001');
      appointGymAdmin(gym.id, 'user-sophie', 'user_boris_001');

      const team = getGymTeamMembers(gym.id);
      expect(team.length).toBeGreaterThanOrEqual(2);
      expect(team.some(m => m.user_id === 'user-jonas' && m.role === 'setter')).toBe(true);
      expect(team.some(m => m.user_id === 'user-sophie' && m.role === 'admin')).toBe(true);
    });
  });

  describe('AC-7: Plattform-Admin Rolle & Hallenerstellung-Schutz', () => {
    it('allows only platform admins to create new gyms', () => {
      expect(canUserCreateGym('user-boris')).toBe(true);
      expect(canUserCreateGym('user_boris_001')).toBe(true);
      expect(canUserCreateGym('user-jonas')).toBe(false);
      expect(canUserCreateGym('user-lena')).toBe(false);

      // Platform admin successfully creates gym
      const newGym = createGym({ name: 'Boulderwelt München' }, 'user-boris');
      expect(newGym.name).toBe('Boulderwelt München');

      // Regular climber throws forbidden error
      expect(() => {
        createGym({ name: 'Illegal Gym' }, 'user-lena');
      }).toThrow('Nur Plattform-Administratoren dürfen neue Hallen anlegen.');

      // Even a gym admin of another gym cannot create a new gym unless platform admin
      expect(() => {
        createGym({ name: 'Illegal Gym 2' }, 'user-jonas');
      }).toThrow('Nur Plattform-Administratoren dürfen neue Hallen anlegen.');
    });
  });
});
