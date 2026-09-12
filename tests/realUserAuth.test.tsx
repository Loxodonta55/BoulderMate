import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  signUpWithEmail,
  signInWithPassword,
  signInWithOtp,
  signOut,
  getCurrentAuthUser,
  onAuthStateChange
} from '../src/lib/authService';
import { toKnownAuthUserUuid, resolveUserIdAndNickname } from '../src/lib/syncService';
import { updateProfile, getProfile, getProfiles } from '../src/lib/profileService';
import { LoginModal } from '../src/components/LoginModal';

describe('Real User Authentication (Supabase Auth & LoginModal MVP)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await signOut();
  });

  describe('authService: Echte Registrierung & Anmeldung', () => {
    it('erlaubt das Registrieren eines neuen Kletterers mit E-Mail, Passwort und Nickname', async () => {
      const newUser = await signUpWithEmail('lara.croft@boulder.ch', 'secretPass123', 'LaraCroft');
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('lara.croft@boulder.ch');
      expect(newUser.nickname).toBe('LaraCroft');
      expect(newUser.isPlatformAdmin).toBe(false);

      const active = getCurrentAuthUser();
      expect(active?.email).toBe('lara.croft@boulder.ch');
      expect(active?.nickname).toBe('LaraCroft');
    });

    it('verhindert Registrierung mit ungültiger E-Mail oder zu kurzem Passwort', async () => {
      await expect(signUpWithEmail('ungueltig', '123456')).rejects.toThrow(/gültige E-Mail/i);
      await expect(signUpWithEmail('test@boulder.ch', '123')).rejects.toThrow(/mindestens 6 Zeichen/i);
    });

    it('erlaubt die Anmeldung mit bestehenden Zugangsdaten', async () => {
      // Registrieren
      await signUpWithEmail('mike@climb.ch', 'mikePassword', 'MikeBoulder');
      await signOut();
      expect(getCurrentAuthUser()).toBeNull();

      // Anmelden
      const loggedIn = await signInWithPassword('mike@climb.ch', 'mikePassword');
      expect(loggedIn.email).toBe('mike@climb.ch');
      expect(getCurrentAuthUser()?.email).toBe('mike@climb.ch');
    });

    it('erlaubt die Anforderung eines Magic Links (OTP)', async () => {
      await expect(signInWithOtp('otp_climber@boulder.ch')).resolves.toBeUndefined();
      await expect(signInWithOtp('invalid-email')).rejects.toThrow(/gültige E-Mail/i);
    });

    it('informiert Listener über onAuthStateChange bei Login und Logout', async () => {
      const listener = vi.fn();
      const unsubscribe = onAuthStateChange(listener);

      await signUpWithEmail('observer@climb.ch', 'password123', 'Observer');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ email: 'observer@climb.ch' }));

      await signOut();
      expect(listener).toHaveBeenCalledWith(null);

      unsubscribe();
    });
  });

  describe('LoginModal: UI für Registrierung & Anmeldung', () => {
    it('wechselt zwischen Tabs: Konto erstellen und Anmelden', () => {
      render(<LoginModal isOpen={true} onClose={vi.fn()} />);

      // Standardmäßig auf Tab "Konto erstellen"
      expect(screen.getByTestId('input-register-email')).toBeInTheDocument();
      expect(screen.getByTestId('btn-register-submit')).toBeInTheDocument();

      // Klick auf "Anmelden"
      fireEvent.click(screen.getByTestId('tab-login'));

      // Nun sind Login-Felder sichtbar
      expect(screen.getByTestId('input-login-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-login-password')).toBeInTheDocument();
      expect(screen.getByTestId('btn-login-submit')).toBeInTheDocument();
    });

    it('erlaubt das Anmelden mit E-Mail und Passwort im LoginModal', async () => {
      const onUserChanged = vi.fn();
      const onClose = vi.fn();

      render(
        <LoginModal
          isOpen={true}
          onClose={onClose}
          onUserChanged={onUserChanged}
          initialMode="login"
        />
      );

      // Daten in Login-Maske eingeben
      fireEvent.change(screen.getByTestId('input-login-email'), {
        target: { value: 'hans@kletterer.ch' }
      });
      fireEvent.change(screen.getByTestId('input-login-password'), {
        target: { value: 'bouldermate2026' }
      });

      fireEvent.click(screen.getByTestId('btn-login-submit'));

      await waitFor(() => {
        expect(onUserChanged).toHaveBeenCalledWith(expect.objectContaining({
          email: 'hans@kletterer.ch'
        }));
      });
    });

    it('zeigt Fehler bei unvollständigen Eingaben im LoginModal an', async () => {
      render(
        <LoginModal
          isOpen={true}
          onClose={vi.fn()}
          initialMode="login"
        />
      );

      // Nur E-Mail, kein Passwort
      fireEvent.change(screen.getByTestId('input-login-email'), {
        target: { value: 'user@climb.ch' }
      });
      fireEvent.click(screen.getByTestId('btn-login-submit'));

      expect(screen.getByTestId('register-error-msg')).toHaveTextContent(/Passwort eingeben/i);
    });

    it('erlaubt das Einloggen über die Schnell-Zugang Test-Profile im Modal', () => {
      const onUserChanged = vi.fn();
      render(
        <LoginModal
          isOpen={true}
          onClose={vi.fn()}
          onUserChanged={onUserChanged}
        />
      );

      // Klick auf Boris
      const borisBtn = screen.getByTestId('persona-login-user-boris');
      fireEvent.click(borisBtn);

      expect(onUserChanged).toHaveBeenCalledWith(expect.objectContaining({
        id: 'user-boris',
        nickname: 'Boris'
      }));
    });
  });

  describe('SPEC-014: Systemische Ökosystem-Integration & UUID-Preservation', () => {
    it('bewahrt echte Supabase-UUIDs in toKnownAuthUserUuid statt sie auf Boris zurückzusetzen', () => {
      const realUserUuid = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
      const resolved = toKnownAuthUserUuid(realUserUuid);
      expect(resolved).toBe(realUserUuid);
      expect(resolved).not.toBe('00000000-1d0e-4000-8000-e92d69136f33');
    });

    it('löst Nickname und Avatar für echte registrierte Nutzer via resolveUserIdAndNickname auf', () => {
      const customUserId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      updateProfile(customUserId, {
        nickname: 'Lara Croft',
        avatarUrl: 'https://example.com/lara.jpg'
      });

      const resolved = resolveUserIdAndNickname(customUserId);
      expect(resolved.userId).toBe(customUserId);
      expect(resolved.nickname).toBe('Lara Croft');
      expect(resolved.avatarUrl).toBe('https://example.com/lara.jpg');
    });

    it('aktualisiert das Profil im lokalen Cache und stellt es für getProfiles bereit', () => {
      const testUserId = 'user-test-climber-99';
      updateProfile(testUserId, { nickname: 'SummitSeeker' });

      const profile = getProfile(testUserId);
      expect(profile.nickname).toBe('SummitSeeker');

      const all = getProfiles();
      expect(all.some(p => p.id === testUserId && p.nickname === 'SummitSeeker')).toBe(true);
    });
  });
});
