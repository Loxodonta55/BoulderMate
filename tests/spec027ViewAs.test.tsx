import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../src/App';
import { ViewAsSwitcher } from '../src/components/ViewAsSwitcher';
import {
  setSessionUser,
  signOut,
  isPlatformAdmin,
  isRealPlatformAdmin,
  canUseViewAs,
  getActiveViewAs,
  demoLoginsAllowedFor,
  isDemoSession,
  DEMO_USERS,
} from '../src/lib/authService';
import { getUserRoleInfo } from '../src/lib/roleService';
import { isGymAdmin, resetAllGymData } from '../src/lib/gymStorage';
import { applyViewAs, setStoredViewAs, getStoredViewAs, VIEW_AS_OPTIONS } from '../src/lib/viewAsService';

describe('SPEC-027: «Ansehen als …» und Test-Konten', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    setSessionUser('user-boris');
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    setStoredViewAs('echt');
    await signOut();
  });

  describe('AC-2: Vorschau nimmt nur Rechte weg', () => {
    const boris = () => getUserRoleInfo('user-boris', 'gym-6a-plus');

    it('Meine echten Rechte: unverändert', () => {
      expect(applyViewAs(boris(), 'echt')).toEqual(boris());
    });

    it('Hallen-Admin: Admin + Schrauber, aber keine Plattform-Rechte', () => {
      const info = applyViewAs(boris(), 'hallen-admin');
      expect(info.roles.sort()).toEqual(['admin', 'member', 'setter']);
      expect(info.canAccessAdminConsole).toBe(true);
      expect(info.canAccessSetterStudio).toBe(true);
      expect(info.isPlatformAdmin).toBe(false);
      expect(info.canCreateGyms).toBe(false);
    });

    it('Schrauber: nur Studio', () => {
      const info = applyViewAs(boris(), 'schrauber');
      expect(info.roles.sort()).toEqual(['member', 'setter']);
      expect(info.canAccessSetterStudio).toBe(true);
      expect(info.canAccessAdminConsole).toBe(false);
      expect(info.canAppointSetters).toBe(false);
    });

    it('Nur Kletterer: keine Sonderrechte', () => {
      const info = applyViewAs(boris(), 'kletterer');
      expect(info.roles).toEqual(['member']);
      expect(info.isSetter || info.isAdmin || info.isPlatformAdmin).toBe(false);
      expect(info.canAccessSetterStudio || info.canAccessAdminConsole).toBe(false);
    });

    it('bietet genau vier Ansichten an', () => {
      expect(VIEW_AS_OPTIONS.map(o => o.mode)).toEqual(['echt', 'hallen-admin', 'schrauber', 'kletterer']);
    });

    it('unbekannte gespeicherte Werte zählen als «echt»', () => {
      localStorage.setItem('bm_view_as_v1', JSON.stringify('super-admin'));
      expect(getStoredViewAs()).toBe('echt');
    });
  });

  describe('AC-1/AC-2: Wirkung nur für den angemeldeten Plattform-Admin', () => {
    it('Plattform-Admin in Vorschau «Nur Kletterer» verliert Studio, Admin und Plattform-Rechte', () => {
      setStoredViewAs('kletterer');
      expect(getActiveViewAs()).toBe('kletterer');
      const info = getUserRoleInfo('user-boris', 'gym-6a-plus');
      expect(info.canAccessSetterStudio).toBe(false);
      expect(info.canAccessAdminConsole).toBe(false);
      expect(isPlatformAdmin('user-boris')).toBe(false);
      expect(isRealPlatformAdmin('user-boris')).toBe(true);
      expect(canUseViewAs()).toBe(true);
    });

    it('Vorschau «Hallen-Admin»: Admin jeder Halle, aber kein Plattform-Admin', () => {
      setStoredViewAs('hallen-admin');
      expect(isGymAdmin('gym-minimum-zh', 'user-boris')).toBe(true);
      expect(isPlatformAdmin('user-boris')).toBe(false);
      expect(getUserRoleInfo('user-boris', 'gym-minimum-zh').canCreateGyms).toBe(false);
    });

    it('andere Nutzer werden von der Vorschau nicht verändert', () => {
      setStoredViewAs('kletterer');
      expect(getUserRoleInfo('schrauber-6aplus', 'gym-6a-plus').canAccessSetterStudio).toBe(true);
      expect(getActiveViewAs('schrauber-6aplus')).toBe('echt');
    });

    it('Nicht-Admins sehen keinen Umschalter und eine gespeicherte Vorschau wirkt nicht', () => {
      setSessionUser('schrauber-6aplus');
      setStoredViewAs('hallen-admin');
      expect(canUseViewAs()).toBe(false);
      expect(getActiveViewAs()).toBe('echt');
      const info = getUserRoleInfo('schrauber-6aplus', 'gym-6a-plus');
      expect(info.canAccessAdminConsole).toBe(false);
      expect(isGymAdmin('gym-6a-plus', 'schrauber-6aplus')).toBe(false);
    });

    it('ohne Anmeldung keine Vorschau', async () => {
      setStoredViewAs('schrauber');
      await signOut();
      expect(canUseViewAs()).toBe(false);
      expect(getActiveViewAs()).toBe('echt');
    });
  });

  describe('AC-5: Abschalten per VITE_ROLLEN_VORSCHAU=aus', () => {
    it('schaltet Umschalter und Wirkung ab', () => {
      setStoredViewAs('kletterer');
      vi.stubEnv('VITE_ROLLEN_VORSCHAU', 'aus');
      expect(canUseViewAs()).toBe(false);
      expect(getActiveViewAs()).toBe('echt');
      expect(isPlatformAdmin('user-boris')).toBe(true);
    });
  });

  describe('AC-6: Test-Personen live gesperrt', () => {
    it('Test-Personen nur im Dev-Build, in Tests oder ohne Supabase', () => {
      expect(demoLoginsAllowedFor({ isTest: false, isDev: false, supabaseReady: true })).toBe(false);
      expect(demoLoginsAllowedFor({ isTest: false, isDev: true, supabaseReady: true })).toBe(true);
      expect(demoLoginsAllowedFor({ isTest: true, isDev: false, supabaseReady: true })).toBe(true);
      expect(demoLoginsAllowedFor({ isTest: false, isDev: false, supabaseReady: false })).toBe(true);
    });

    it('erkennt gespeicherte Test-Personen', () => {
      expect(isDemoSession(DEMO_USERS['user-boris'])).toBe(true);
      expect(isDemoSession({ ...DEMO_USERS['hans-kletterer'], id: 'user_email_abc', provider: 'email' })).toBe(true);
      expect(isDemoSession({
        id: '6f1c2c0e-1111-4a4a-8888-123456789abc', email: 'x@y.ch', nickname: 'X',
        isPlatformAdmin: false, provider: 'google', createdAt: '2026-10-08T00:00:00Z',
      })).toBe(false);
    });
  });

  describe('AC-3/AC-4: Umschalter in der App', () => {
    it('Komponente: zeigt Vorschau groß an und meldet die Wahl', () => {
      const onChange = vi.fn();
      const { rerender } = render(<ViewAsSwitcher mode="echt" onChange={onChange} />);
      expect(screen.getByTestId('view-as-label')).toHaveTextContent('Ansehen als …');
      fireEvent.click(screen.getByTestId('view-as-toggle'));
      expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
      fireEvent.click(screen.getByTestId('view-as-option-schrauber'));
      expect(onChange).toHaveBeenCalledWith('schrauber');
      expect(screen.queryByTestId('view-as-menu')).not.toBeInTheDocument();

      rerender(<ViewAsSwitcher mode="schrauber" onChange={onChange} />);
      expect(screen.getByTestId('view-as-label')).toHaveTextContent('Ansicht: Schrauber');
    });

    it('Escape schließt das Menü', () => {
      render(<ViewAsSwitcher mode="echt" onChange={() => {}} />);
      fireEvent.click(screen.getByTestId('view-as-toggle'));
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('view-as-menu')).not.toBeInTheDocument();
    });

    it('App: Plattform-Admin sieht den Umschalter, «Nur Kletterer» führt direkt zur Wand', () => {
      render(<App />);
      // Arbeitsbereich wählen, damit die App offen ist
      fireEvent.click(screen.getByRole('button', { name: /Kletterer-App/i }));
      expect(screen.getByTestId('view-as-toggle')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('view-as-toggle'));
      act(() => {
        fireEvent.click(screen.getByTestId('view-as-option-kletterer'));
      });
      expect(screen.getByTestId('view-as-label')).toHaveTextContent('Ansicht: Nur Kletterer');
      expect(screen.getByTestId('climber-header')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Kletterer-App/i })).not.toBeInTheDocument();
    });

    it('App: Wechsel auf «Hallen-Admin» fragt den Arbeitsbereich neu ab', () => {
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: /Kletterer-App/i }));
      fireEvent.click(screen.getByTestId('view-as-toggle'));
      act(() => {
        fireEvent.click(screen.getByTestId('view-as-option-hallen-admin'));
      });
      expect(screen.getByRole('button', { name: /Kletterer-App/i })).toBeInTheDocument();
      expect(screen.getByText('Hallen-Administration')).toBeInTheDocument();
    });

    it('App: reiner Kletterer sieht keinen Umschalter', () => {
      setSessionUser('hans-kletterer');
      render(<App />);
      expect(screen.queryByTestId('view-as-toggle')).not.toBeInTheDocument();
    });
  });
});
