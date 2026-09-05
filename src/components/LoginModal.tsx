import React, { useState } from 'react';
import { X, LogIn, Shield, Check, Mail } from 'lucide-react';
import {
  getCurrentAuthUser,
  signInWithGoogle,
  signInWithEmail,
  signOut,
  setSessionUser,
  getAvailableTestUsers,
  AuthUser
} from '../lib/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onUserChanged
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(getCurrentAuthUser());
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const testUsers = getAvailableTestUsers();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      setCurrentUser(user);
      setMessage(`Erfolgreich als ${user.nickname} angemeldet!`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setError(e.message || 'Google Login fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithEmail(emailInput);
      setCurrentUser(user);
      setMessage(`Willkommen zurück, ${user.nickname}!`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setError(e.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (u: AuthUser) => {
    const updated = setSessionUser(u);
    setCurrentUser(updated);
    setMessage(`Gewechselt zu ${u.nickname}`);
    onUserChanged?.(updated);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(getCurrentAuthUser());
    setMessage('Abgemeldet.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-sans">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-none w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline uppercase tracking-wider font-bold text-sm text-[#E8E0D4]">
                Anmeldung & Konto
              </h3>
              <p className="text-[11px] text-[#A89F91]">
                BoulderApp Authentifizierung (SPEC-000)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6358] hover:text-[#E8E0D4] p-1 rounded-[2px] hover:bg-[#2A2A2A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {message && (
            <div className="p-3 rounded-none bg-[#121212] border border-[#4A5D3A] text-[#4A5D3A] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-none bg-[#121212] border border-[#A0522D] text-[#A0522D] text-xs">
              {error}
            </div>
          )}

          {/* Current Active User Status */}
          <div className="p-3.5 rounded-none bg-[#121212] border border-[#333333] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-none object-cover border border-[#333333]"
                />
              ) : (
                <div className="w-10 h-10 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center font-bold text-[#E8E0D4]">
                  {currentUser.nickname.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#E8E0D4]">{currentUser.nickname}</span>
                  {currentUser.isPlatformAdmin && (
                    <span className="px-1.5 py-0.2 rounded-none text-[9px] font-bold bg-[#2A2A2A] text-[#C9A96E] border border-[#333333] uppercase font-mono">
                      Superadmin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#A89F91] font-mono">{currentUser.email}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[11px] text-[#A89F91] hover:text-[#A0522D] underline font-mono transition"
            >
              Abmelden
            </button>
          </div>

          {/* Social Login Button */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-bold rounded-[2px] transition flex items-center justify-center gap-3 text-xs uppercase tracking-wider font-headline"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Mit Google fortfahren</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#333333] w-full" />
            <span className="bg-[#1E1E1E] px-2 text-[10px] text-[#6B6358] uppercase font-mono tracking-wider">
              oder E-Mail
            </span>
            <div className="border-t border-[#333333] w-full" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6358]" />
              <input
                type="email"
                placeholder="deine@email.ch"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#333333] rounded-none text-xs text-[#E8E0D4] placeholder-[#6B6358] focus:outline-none focus:border-[#C9A96E] font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] font-bold text-xs rounded-[2px] border border-[#333333] transition"
            >
              Anmelden
            </button>
          </form>

          {/* Persona Switcher for Testing & Verification */}
          <div className="pt-3 border-t border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#A89F91] uppercase font-mono font-bold tracking-wider">
                Schnell-Login Test-Profile
              </span>
              <Shield className="w-3 h-3 text-[#C9A96E]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {testUsers.map((u) => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectPersona(u)}
                    className={`p-2 rounded-none border text-left transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#2A2A2A] border-[#C9A96E] text-[#E8E0D4]'
                        : 'bg-[#121212] border-[#333333] text-[#A89F91] hover:border-[#6B6358]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[10px] font-bold text-[#E8E0D4] shrink-0">
                      {u.nickname.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">{u.nickname}</div>
                      <div className="text-[9px] text-[#6B6358] truncate">
                        {u.isPlatformAdmin ? 'Plattform-Admin' : 'Kletterer'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
