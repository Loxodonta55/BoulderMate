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
      expect(screen.getByText('Wand-Topo & Community')).toBeInTheDocument();
      expect(screen.getByText('Gast')).toBeInTheDocument();

      // Keine Gast-Bypass-Buttons
      expect(screen.queryByTestId('explore-guest-btn')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hero-explore-guest-btn')).not.toBeInTheDocument();

      // 2. Hero Headline & Information (Constitution Marketing: Coolness, Match, Tracking, Discussion)
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();
      expect(screen.getByText(/Finden, was zu dir passt/i)).toBeInTheDocument();

      // 3. Rollen-Tabs: Kletterer ist standardmäßig aktiv mit Fokus-Tag
      const climberTab = screen.getByTestId('role-tab-climber');
      expect(climberTab).toBeInTheDocument();
      expect(climberTab).toHaveTextContent(/Fokus/i);

      // Kletterer-Features sind sichtbar (Marketing-Value Propositions)
      expect(screen.getByText('Welche Boulder sind cool?')).toBeInTheDocument();
      expect(screen.getByText('Welche passen zu mir?')).toBeInTheDocument();
      expect(screen.getByText('Tracken ohne Frust')).toBeInTheDocument();
      expect(screen.getByText('Diskutieren & Beta-Talk')).toBeInTheDocument();
      expect(screen.getByText('Faire Grade im Barometer')).toBeInTheDocument();
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

      // Schrauber-Features sichtbar (Constitution Mission & Workflow)
      expect(screen.getByText('Batch-Foto-Erfassung in unter 3 Minuten')).toBeInTheDocument();
      expect(screen.getByText('Echtzeit-Feedback & Community-Resonanz')).toBeInTheDocument();
      expect(screen.getByText(/Nach dem Schraubtag eine Wand mit ~8 Bouldern in unter 3 Minuten erfassen/i)).toBeInTheDocument();
    });

    it('wechselt die Feature-Vorschau bei Klick auf ein Feature', () => {
      render(
        <LandingPage
          onOpenLogin={vi.fn()}
        />
      );

      // Klick auf "Tracken ohne Frust"
      const loggingCard = screen.getByText('Tracken ohne Frust');
      fireEvent.click(loggingCard);

      expect(screen.getByText('Vorschau: Tracken ohne Frust')).toBeInTheDocument();
      expect(screen.getByText(/Erfolge mit kreidigen Fingern/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();

      // Interne App-Navigation und Hallenwände sind für unangemeldete User NICHT sichtbar
      expect(screen.queryByText('Wand & Sektoren')).not.toBeInTheDocument();
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
      expect(screen.getByText('Meine Statistiken')).toBeInTheDocument();
    });

    it('führt nach Logout aus dem Profil direkt zurück auf die Standalone Landing Page', () => {
      // Vorab als Hans anmelden
      setSessionUser('hans-kletterer');
      render(<App />);

      // Zu Statistiken navigieren
      const statsTab = screen.getByTestId('tab-stats');
      fireEvent.click(statsTab);

      // Einstellungen öffnen
      const settingsBtn = screen.getByTestId('btn-open-settings');
      fireEvent.click(settingsBtn);

      // Logout button klicken
      const logoutBtn = screen.getByTestId('btn-logout');
      fireEvent.click(logoutBtn);

      // Nun befindet sich der Nutzer wieder exklusiv auf der Landing Page
      expect(screen.getByText(/Erkennen, welche Boulder cool sind/i)).toBeInTheDocument();
      expect(screen.getByTestId('hero-login-btn')).toBeInTheDocument();
      expect(screen.queryByText('Wand & Sektoren')).not.toBeInTheDocument();
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
      expect(screen.getByText('Gast')).toBeInTheDocument();

      // Interne App-Bereiche sind nicht zugänglich
      expect(screen.queryByText('Wand & Sektoren')).not.toBeInTheDocument();
      expect(screen.queryByText('Schrauber-Studio')).not.toBeInTheDocument();
    });
  });
});
