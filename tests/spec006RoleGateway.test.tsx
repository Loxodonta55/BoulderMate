import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getUserRoleInfo } from '../src/lib/roleService';
import { RoleGatewayModal } from '../src/components/RoleGatewayModal';
import { App } from '../src/App';
import { resetAllGymData } from '../src/lib/gymStorage';
import { setSessionUser, signOut } from '../src/lib/authService';

describe('SPEC-006: Rollenbasierte App-Trennung & Role Gateway', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    setSessionUser('user-boris');
  });

  describe('roleService: getUserRoleInfo', () => {
    it('identifies pure climbers and forbids setter/admin access', () => {
      const info = getUserRoleInfo('hans-kletterer');
      expect(info.isAdmin).toBe(false);
      expect(info.isSetter).toBe(false);
      expect(info.canAccessSetterStudio).toBe(false);
      expect(info.canAccessAdminConsole).toBe(false);
    });

    it('identifies setters with access to studio only', () => {
      const info = getUserRoleInfo('schrauber-6aplus', 'gym-6a-plus');
      expect(info.isSetter).toBe(true);
      expect(info.canAccessSetterStudio).toBe(true);
      expect(info.canAccessAdminConsole).toBe(false);
    });

    it('identifies admins with access to both studio and admin console', () => {
      const info = getUserRoleInfo('user-boris');
      expect(info.isAdmin).toBe(true);
      expect(info.isSetter).toBe(true);
      expect(info.canAccessSetterStudio).toBe(true);
      expect(info.canAccessAdminConsole).toBe(true);
    });
  });

  describe('RoleGatewayModal', () => {
    it('renders enabled options for admin and triggers mode selection', () => {
      const onSelect = vi.fn();
      const roleInfo = getUserRoleInfo('user-boris');

      render(
        <RoleGatewayModal
          isOpen={true}
          nickname="Boris"
          roleInfo={roleInfo}
          currentMode="climber"
          onSelectMode={onSelect}
        />
      );

      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();
      expect(screen.getByText(/Hallo/)).toHaveTextContent('Boris');
      expect(screen.getByText(/In welcher Rolle möchtest du BoulderMate heute nutzen\?/i)).toBeInTheDocument();

      // Click Schrauber-Studio
      const setterBtn = screen.getByRole('button', { name: /Schrauber-Studio/i });
      fireEvent.click(setterBtn);
      expect(onSelect).toHaveBeenCalledWith('setter');

      // Click Hallen-Administration
      const adminBtn = screen.getByRole('button', { name: /Hallen-Administration/i });
      fireEvent.click(adminBtn);
      expect(onSelect).toHaveBeenCalledWith('admin');

      // Click Kletterer-App
      const climberBtn = screen.getByRole('button', { name: /Kletterer-App/i });
      fireEvent.click(climberBtn);
      expect(onSelect).toHaveBeenCalledWith('climber');
    });

    it('locks admin console for users who are only setters', () => {
      const onSelect = vi.fn();
      const roleInfo = getUserRoleInfo('schrauber-6aplus', 'gym-6a-plus');

      render(
        <RoleGatewayModal
          isOpen={true}
          nickname="Schrauber6aPlus"
          roleInfo={roleInfo}
          currentMode="climber"
          onSelectMode={onSelect}
        />
      );

      expect(screen.getByText(/Hallen-Administration \(Gesperrt\)/i)).toBeInTheDocument();
    });
  });

  describe('App Workspace Separation Integration', () => {
    it('opens role gateway for Boris on mount and switches to Schrauber-Studio when chosen', () => {
      render(<App />);

      // Step 1: Gateway modal appears for Boris
      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();

      // Boris selects Schrauber-Studio
      const setterBtn = screen.getByRole('button', { name: /Schrauber-Studio/i });
      fireEvent.click(setterBtn);

      // Verify dedicated Schrauber-Studio header is active
      expect(screen.getByText('Schrauber-Studio')).toBeInTheDocument();
      expect(screen.getByTestId('studio-back-to-climber-btn')).toBeInTheDocument();

      // Return to Kletterer-App
      fireEvent.click(screen.getByTestId('studio-back-to-climber-btn'));
      expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();
    });

    it('never shows setter/admin buttons to pure climber Hans', () => {
      render(<App />);

      // First close gateway for initial Boris
      const climberBtn = screen.getByRole('button', { name: /Kletterer-App/i });
      fireEvent.click(climberBtn);

      // Switch active climber to Hans (pure climber)
      const climberSelect = screen.getByTitle('Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch');
      fireEvent.change(climberSelect, { target: { value: 'hans-kletterer' } });

      // Gateway modal does NOT open for Hans
      expect(screen.queryByText('Arbeitsbereich wählen')).not.toBeInTheDocument();

      // Climber-switch-workspace button is NOT rendered for Hans
      expect(screen.queryByTestId('climber-switch-workspace-btn')).not.toBeInTheDocument();
    });

    it('enforces AC-7: strict feature isolation without cross-calling between areas', () => {
      render(<App />);

      // Boris selects Hallen-Administration
      const adminBtn = screen.getByRole('button', { name: /Hallen-Administration/i });
      fireEvent.click(adminBtn);

      // 1. In Hallen-Administration: Verify absence of cross-area action buttons
      expect(screen.getByText('Hallen-Administration')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-to-setter-btn')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Routen schrauben/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Wand ansehen/i })).not.toBeInTheDocument();

      // Verify Admin-exclusive tabs are present
      expect(screen.getByRole('button', { name: /Farbsystem/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Team & Schrauber/i })).toBeInTheDocument();

      // Switch area via Role Gateway to Schrauber-Studio
      const switchAreaBtn = screen.getByTestId('admin-switch-workspace-btn');
      fireEvent.click(switchAreaBtn);
      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();

      const setterBtn = screen.getByRole('button', { name: /Schrauber-Studio/i });
      fireEvent.click(setterBtn);

      // 2. In Schrauber-Studio: Verify absence of Admin or Climber cross-area buttons
      expect(screen.getByText('Schrauber-Studio')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sektoren & Wandfotos anlegen/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Wand ansehen/i })).not.toBeInTheDocument();

      // Switch back to Kletterer-App
      const backToClimberBtn = screen.getByTestId('studio-back-to-climber-btn');
      fireEvent.click(backToClimberBtn);

      // 3. In Kletterer-App: Verify absence of setter/admin actions
      expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Zum Schrauber-Bereich/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sektoren & Wandfotos anlegen/i })).not.toBeInTheDocument();
    });

    it('does NOT recognize user as Boris before login and requires logging in first', () => {
      localStorage.clear();
      signOut();
      render(<App />);

      // Verify guest state: Role Gateway does not appear, Gast is shown in header
      expect(screen.queryByText('Arbeitsbereich wählen')).not.toBeInTheDocument();
      expect(screen.queryByText(/Hallo Boris/i)).not.toBeInTheDocument();
      expect(screen.getByText('Gast')).toBeInTheDocument();

      const loginBtn = screen.getByTestId('login-modal-btn');
      expect(loginBtn).toBeInTheDocument();

      // Open login modal
      fireEvent.click(loginBtn);
      expect(screen.getByText('Anmeldung & Konto')).toBeInTheDocument();
      expect(screen.getByText(/Aktuell nicht angemeldet/i)).toBeInTheDocument();

      // Log in as Boris via Demo account button
      const borisBtn = screen.getByTestId('persona-login-user-boris');
      fireEvent.click(borisBtn);

      // Now Boris is logged in and Role Gateway is triggered!
      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();
      expect(screen.getByText(/Hallo/i)).toHaveTextContent('Boris');
    });
  });
});
