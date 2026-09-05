import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getUserRoleInfo } from '../src/lib/roleService';
import { RoleGatewayModal } from '../src/components/RoleGatewayModal';
import { App } from '../src/App';
import { resetAllGymData } from '../src/lib/gymStorage';

describe('SPEC-006: Rollenbasierte App-Trennung & Role Gateway', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
  });

  describe('roleService: getUserRoleInfo', () => {
    it('identifies pure climbers and forbids setter/admin access', () => {
      const info = getUserRoleInfo('user-jonas');
      expect(info.isAdmin).toBe(false);
      expect(info.isSetter).toBe(false);
      expect(info.canAccessSetterStudio).toBe(false);
      expect(info.canAccessAdminConsole).toBe(false);
    });

    it('identifies setters with access to studio only', () => {
      const info = getUserRoleInfo('climber-1');
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
      const roleInfo = getUserRoleInfo('climber-1');

      render(
        <RoleGatewayModal
          isOpen={true}
          nickname="Alex"
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

    it('never shows setter/admin buttons to pure climber Jonas', () => {
      render(<App />);

      // First close gateway for initial Boris
      const climberBtn = screen.getByRole('button', { name: /Kletterer-App/i });
      fireEvent.click(climberBtn);

      // Switch active climber to Jonas (pure climber)
      const climberSelect = screen.getByTitle('Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch');
      fireEvent.change(climberSelect, { target: { value: 'user-jonas' } });

      // Gateway modal does NOT open for Jonas
      expect(screen.queryByText('Arbeitsbereich wählen')).not.toBeInTheDocument();

      // Climber-switch-workspace button is NOT rendered for Jonas
      expect(screen.queryByTestId('climber-switch-workspace-btn')).not.toBeInTheDocument();
    });
  });
});
