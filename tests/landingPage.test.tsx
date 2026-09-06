import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../src/components/LandingPage';
import { App } from '../src/App';
import { resetAllGymData } from '../src/lib/gymStorage';
import { signOut, setSessionUser } from '../src/lib/authService';

describe('Landing Page für unangemeldete User (SPEC-005 Standalone Experience)', () => {
  beforeEach(() => {
    resetAllGymData();
    localStorage.clear();
    signOut();
  });

  describe('Komponenten-Tests: LandingPage.tsx', () => {
    it('rendert Brand, Headline und Kletterer-Fokus standardmäßig', () => {
      const onOpenLogin = vi.fn();
      const onExploreGuest = vi.fn();

      render(
        <LandingPage
          onOpenLogin={onOpenLogin}
          onExploreAsGuest={onExploreGuest}
        />
      );

      // 1. Standalone Header
      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText('Digitales Wand-Topo')).toBeInTheDocument();
      expect(screen.getByText('Gast')).toBeInTheDocument();

      // 2. Hero Headline
      expect(screen.getByText(/Faire Grade\. Beliebte Boulder\./i)).toBeInTheDocument();
      expect(screen.getByText(/Erfolge & Community/i)).toBeInTheDocument();

      // 3. Rollen-Tabs: Kletterer ist standardmäßig aktiv mit Fokus-Tag
      const climberTab = screen.getByTestId('role-tab-climber');
      expect(climberTab).toBeInTheDocument();
      expect(climberTab).toHaveTextContent(/Fokus/i);

      // Kletterer-Features sind sichtbar
      expect(screen.getByText('Faire Grade & Beliebte Boulder')).toBeInTheDocument();
      expect(screen.getByText('Routen-Diskussion & Beta-Tipps')).toBeInTheDocument();
      expect(screen.getByText('Erfolge tracken & Selbsteinschätzung')).toBeInTheDocument();
      expect(screen.getByText('Interaktive Wand & 2-Tap Logging')).toBeInTheDocument();
    });

    it('erlaubt das Umschalten auf die Schrauber-Rolle und zeigt deren Workflow', () => {
      render(
        <LandingPage
          onOpenLogin={vi.fn()}
          onExploreAsGuest={vi.fn()}
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
          onExploreAsGuest={vi.fn()}
        />
      );

      // Klick auf "Routen-Diskussion & Beta-Tipps"
      const discussionCard = screen.getByText('Routen-Diskussion & Beta-Tipps');
      fireEvent.click(discussionCard);

      expect(screen.getByText('Vorschau: Routen-Diskussion & Beta-Tipps')).toBeInTheDocument();
      expect(screen.getByText(/Die Hallen-Diskussion direkt an der Route/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Routen-Diskussion & Beta/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Rechten Fuß hoch auf die Kante/i)).toBeInTheDocument();
    });

    it('triggert onOpenLogin und onExploreAsGuest bei Klick auf die entsprechenden Buttons', () => {
      const onOpenLogin = vi.fn();
      const onExploreGuest = vi.fn();

      render(
        <LandingPage
          onOpenLogin={onOpenLogin}
          onExploreAsGuest={onExploreGuest}
        />
      );

      // Hero Login Button
      fireEvent.click(screen.getByTestId('hero-login-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(1);

      // Hero Explore Guest Button
      fireEvent.click(screen.getByTestId('hero-explore-guest-btn'));
      expect(onExploreGuest).toHaveBeenCalledTimes(1);

      // Header Login Button
      fireEvent.click(screen.getByTestId('login-modal-btn'));
      expect(onOpenLogin).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration in App.tsx: Unangemeldeter vs. angemeldeter User-Flow', () => {
    it('zeigt unbegleiteten/unangemeldeten Besuchern die Landing Page als Einstiegsansicht', () => {
      render(<App />);

      // Standalone Landing Page ist aktiv
      expect(screen.getByText('BoulderMate')).toBeInTheDocument();
      expect(screen.getByText(/Faire Grade\. Beliebte Boulder\./i)).toBeInTheDocument();
      expect(screen.queryByTestId('studio-gym-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-gym-select')).not.toBeInTheDocument();
    });

    it('ermöglicht den Wechsel in den Gast-Modus und zurück zur Landing Page', () => {
      render(<App />);

      // Gast klickt "Halle als Gast ansehen"
      const exploreBtn = screen.getByTestId('hero-explore-guest-btn');
      fireEvent.click(exploreBtn);

      // Nun ist der Besucher in der Wand & Sektoren Ansicht
      expect(screen.getByText('Wand & Sektoren')).toBeInTheDocument();
      expect(screen.getByTestId('back-to-landing-btn')).toBeInTheDocument();

      // Klick auf "Landing Page" bringt den Besucher zurück
      fireEvent.click(screen.getByTestId('back-to-landing-btn'));
      expect(screen.getByText(/Faire Grade\. Beliebte Boulder\./i)).toBeInTheDocument();
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

      // Nun befindet sich der Nutzer wieder auf der Landing Page
      expect(screen.getByText(/Faire Grade\. Beliebte Boulder\./i)).toBeInTheDocument();
      expect(screen.getByTestId('hero-login-btn')).toBeInTheDocument();
    });
  });
});
