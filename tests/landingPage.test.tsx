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
    it('rendert Brand, Headline und Kletterer-Fokus standardmäßig ohne Gast-Bypass', () => {
      const onOpenLogin = vi.fn();

      render(
        <LandingPage
          onOpenLogin={onOpenLogin}
        />
      );

      // 1. Standalone Header
      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText('Digitales Wand-Topo')).toBeInTheDocument();
      expect(screen.getByText('Gast')).toBeInTheDocument();

      // Keine Gast-Bypass-Buttons
      expect(screen.queryByTestId('explore-guest-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hero-explore-guest-btn')).not.toBeInTheDocument();

      // 2. Hero Headline & Information
      expect(screen.getByText(/Vom Schrauberschlüssel/i)).toBeInTheDocument();
      expect(screen.getByText(/direkt an die Wand/i)).toBeInTheDocument();

      // 3. Rollen-Tabs: Kletterer ist standardmäßig aktiv mit Fokus-Tag
      const climberTab = screen.getByTestId('role-tab-climber');
      expect(climberTab).toBeInTheDocument();
      expect(climberTab).toHaveTextContent(/Fokus/i);

      // Kletterer-Features sind sichtbar
      expect(screen.getByText('Interaktive Wand & Sektoren')).toBeInTheDocument();
      expect(screen.getByText('Chalk-Proof 2-Tap Logging')).toBeInTheDocument();
      expect(screen.getByText('Profil & Performance-Radar')).toBeInTheDocument();
      expect(screen.getByText('Community Barometer')).toBeInTheDocument();
    });

    it('erlaubt das Umschalten auf die Schrauber-Rolle und zeigt deren Workflow', () => {
      render(
        <LandingPage
          onOpenLogin={vi.fn()}
        />
      );

      // Klick auf "Für Schrauber & Routenbau"
      const setterTab = screen.getByTestId('role-tab-setter');
      fireEvent.click(setterTab);

      // Schrauber-Features sichtbar
      expect(screen.getByText('Batch-Umschrauben in Rekordzeit')).toBeInTheDocument();
      expect(screen.getByText('Echtzeit-Feedback & Hallen-Monitoring')).toBeInTheDocument();
      expect(screen.getByText(/Vom Akkuschrauber direkt ins digitale Topo/i)).toBeInTheDocument();
    });

    it('wechselt die Feature-Vorschau bei Klick auf ein Feature', () => {
      render(
        <LandingPage
          onOpenLogin={vi.fn()}
        />
      );

      // Klick auf "Chalk-Proof 2-Tap Logging"
      const loggingCard = screen.getByText('Chalk-Proof 2-Tap Logging');
      fireEvent.click(loggingCard);

      expect(screen.getByText('Vorschau: Chalk-Proof 2-Tap Logging')).toBeInTheDocument();
      expect(screen.getByText(/Für eingekreidete Hände optimiert/i)).toBeInTheDocument();
      expect(screen.getByText('FLASH ⚡')).toBeInTheDocument();
      expect(screen.getByText('TOP ✅')).toBeInTheDocument();
    });

    it('triggert onOpenLogin bei Klick auf Login & Registrier-Buttons', () => {
      const onOpenLogin = vi.fn();

      render(
        <LandingPage
          onOpenLogin={onOpenLogin}
        />
      );

      // Hero Register Button
      fireEvent.click(screen.getByTestId('hero-login-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(1);

      // Header Login Button
      fireEvent.click(screen.getByTestId('login-modal-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(2);

      // Header Register Button
      fireEvent.click(screen.getByTestId('landing-primary-start-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration in App.tsx: Ausschließlich Landing Page für unangemeldete User', () => {
    it('zeigt unangemeldeten Besuchern NUR die Landing Page und keine internen App-Sektoren', () => {
      render(<App />);

      // Standalone Landing Page ist aktiv
      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText(/Vom Schrauberschlüssel/i)).toBeInTheDocument();

      // Interne App-Navigation und Hallenwände sind für unangemeldete User NICHT sichtbar
      expect(screen.queryByText('Wand & Sektoren')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tab-profile')).not.toBeInTheDocument();
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

      // Absenden
      fireEvent.click(screen.getByTestId('btn-register-submit'));

      // Nach erfolgreicher Registrierung gelangt der neue User in die App
      await waitFor(() => {
        expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();
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
      expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();
      expect(screen.getByText('Mein Profil')).toBeInTheDocument();
    });

    it('führt nach Logout aus dem Profil direkt zurück auf die Standalone Landing Page', () => {
      // Vorab als Hans anmelden
      setSessionUser('hans-kletterer');
      render(<App />);

      // Zu Profil navigieren
      const profileTab = screen.getByTestId('tab-profile');
      fireEvent.click(profileTab);

      // Einstellungen öffnen
      const settingsBtn = screen.getByTestId('btn-open-settings');
      fireEvent.click(settingsBtn);

      // Logout button klicken
      const logoutBtn = screen.getByTestId('btn-logout');
      fireEvent.click(logoutBtn);

      // Nun befindet sich der Nutzer wieder exklusiv auf der Landing Page
      expect(screen.getByText(/Vom Schrauberschlüssel/i)).toBeInTheDocument();
      expect(screen.getByTestId('hero-login-btn')).toBeInTheDocument();
      expect(screen.queryByText('Wand & Sektoren')).not.toBeInTheDocument();
    });
  });
});
