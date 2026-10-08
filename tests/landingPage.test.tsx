import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LandingPage } from '../src/components/LandingPage';
import { App } from '../src/App';
import { resetAllGymData } from '../src/lib/gymStorage';
import { signOut, setSessionUser } from '../src/lib/authService';

describe('Landing Page für unangemeldete User (Reine Info & Registrierungs-Gate)', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    signOut();
  });

  describe('Komponenten-Tests: LandingPage.tsx', () => {
    it('rendert Brand, Claim und drei Kernpunkte auf einem Screen (SPEC-020 AC-9.1)', () => {
      render(
        <LandingPage
          onOpenLogin={vi.fn()}
        />
      );

      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();
      expect(screen.getByText('Perlen finden')).toBeInTheDocument();
      expect(screen.getByText('Passt zu dir')).toBeInTheDocument();
      expect(screen.getByText('2 Taps loggen')).toBeInTheDocument();

      // Keine Gast-Bypass-Buttons
      expect(screen.queryByTestId('explore-guest-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hero-explore-guest-btn')).not.toBeInTheDocument();
    });

    it('triggert onOpenLogin bei Klick auf Login & Registrier-Buttons', () => {
      const onOpenLogin = vi.fn();

      render(
        <LandingPage
          onOpenLogin={onOpenLogin}
        />
      );

      fireEvent.click(screen.getByTestId('hero-login-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('login-modal-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration in App.tsx: Ausschließlich Landing Page für unangemeldete User', () => {
    it('zeigt unangemeldeten Besuchern NUR die Landing Page und keine internen App-Sektoren', () => {
      render(<App />);

      // Standalone Landing Page ist aktiv
      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();

      // Interne App-Navigation und Hallenwände sind für unangemeldete User NICHT sichtbar
      expect(screen.queryByTestId('climber-header')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-stats')).not.toBeInTheDocument();
      expect(screen.queryByTestId('header-gym-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('studio-gym-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-gym-select')).not.toBeInTheDocument();
    });

    it('erlaubt das einfache Erstellen eines neuen Kletterer-Kontos direkt im Modal', async () => {
      render(<App />);

      // Klick auf "Kostenlos Konto erstellen"
      const registerBtn = screen.getByTestId('hero-login-btn');
      fireEvent.click(registerBtn);

      // Modal öffnet sich mit Registrierungs-Formular
      expect(screen.getByText('Anmeldung & Konto')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-nickname')).toBeInTheDocument();
      expect(screen.getByTestId('input-register-email')).toBeInTheDocument();

      // Neue Nutzerdaten eingeben
      fireEvent.change(screen.getByTestId('input-register-nickname'), {
        target: { value: 'Petra' }
      });
      fireEvent.change(screen.getByTestId('input-register-email'), {
        target: { value: 'petra@klettern.ch' }
      });
      fireEvent.change(screen.getByTestId('input-register-password'), {
        target: { value: 'kreide123' }
      });

      // Absenden
      fireEvent.click(screen.getByTestId('btn-register-submit'));

      // Nach erfolgreicher Registrierung gelangt der neue User in die App
      await waitFor(() => {
        expect(screen.getByTestId('climber-header')).toBeInTheDocument();
      });
    });

    it('führt nach Login über Quick-Login oder Modal zur daraus resultierenden Wahl (Role Gateway für Boris)', () => {
      render(<App />);

      // Schnellanmeldung als Boris (OverAdmin / Schrauber / Admin)
      const borisQuickLogin = screen.getByTestId('quick-login-boris');
      fireEvent.click(borisQuickLogin);

      // Sofort öffnet sich das Role Gateway (die daraus resultierende Wahl)
      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();
      expect(screen.getByText(/Hallo/i)).toHaveTextContent('Boris');
      expect(screen.getByRole('button', { name: /Kletterer-App/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Schrauber-Studio/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Hallen-Administration/i })).toBeInTheDocument();
    });

    it('führt nach Login als reiner Kletterer (Hans) direkt in die Kletterer-App ohne Gateway-Zwang', () => {
      render(<App />);

      // Schnellanmeldung als Hans (Kletterer)
      const hansQuickLogin = screen.getByTestId('quick-login-hans');
      fireEvent.click(hansQuickLogin);

      // Hans hat keine Schrauber/Admin-Berechtigungen -> direkt Kletterer-App
      expect(screen.queryByText('Arbeitsbereich wählen')).not.toBeInTheDocument();
      expect(screen.getByTestId('climber-header')).toBeInTheDocument();
      expect(screen.getByTestId('tab-stats')).toHaveTextContent('Ich');
    });

    it('führt nach Logout aus dem Profil direkt zurück auf die Standalone Landing Page', () => {
      // Vorab als Hans anmelden
      setSessionUser('hans-kletterer');
      render(<App />);

      // Zu Statistiken navigieren
      const statsTab = screen.getByTestId('tab-stats');
      fireEvent.click(statsTab);

      // Einstellungen öffnen
      const settingsBtn = screen.getByTestId('open-settings-btn');
      fireEvent.click(settingsBtn);

      // Logout button klicken
      const logoutBtn = screen.getByTestId('settings-logout');
      fireEvent.click(logoutBtn);

      // Nun befindet sich der Nutzer wieder exklusiv auf der Landing Page
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();
      expect(screen.getByTestId('hero-login-btn')).toBeInTheDocument();
      expect(screen.queryByTestId('climber-header')).not.toBeInTheDocument();
    });

    it('schließt das Role Gateway beim Klick auf X und bringt den Nutzer unangemeldet auf die Landing Page zurück', () => {
      render(<App />);

      // Schnellanmeldung als Boris -> Role Gateway öffnet sich
      const borisQuickLogin = screen.getByTestId('quick-login-boris');
      fireEvent.click(borisQuickLogin);

      expect(screen.getByText('Arbeitsbereich wählen')).toBeInTheDocument();
      expect(screen.getByTestId('role-gateway-close-btn')).toBeInTheDocument();

      // Klick auf das X (role-gateway-close-btn)
      const closeBtn = screen.getByTestId('role-gateway-close-btn');
      fireEvent.click(closeBtn);

      // Auswahlfenster ist weg
      expect(screen.queryByText('Arbeitsbereich wählen')).not.toBeInTheDocument();

      // Nutzer ist abgemeldet / unangemeldet auf der Landing Page mit allen Informationen
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();
      expect(screen.getByTestId('hero-login-btn')).toBeInTheDocument();

      // Interne App-Bereiche sind nicht zugänglich
      expect(screen.queryByTestId('climber-header')).not.toBeInTheDocument();
      expect(screen.queryByText('Schrauber-Studio')).not.toBeInTheDocument();
    });
  });
});
