import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Check, Crown, Wrench, Building2, Mountain, UserPlus, Globe } from 'lucide-react';
import {
  getCurrentAuthUser,
  signOut,
  setSessionUser,
  getAvailableTestUsers,
  signInWithGoogle,
  signInWithEmail,
  AuthUser
} from '../lib/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: AuthUser | null) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onUserChanged
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [message, setMessage] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const testUsers = getAvailableTestUsers();

  const handleSelectPersona = (u: AuthUser) => {
    const updated = setSessionUser(u);
    setCurrentUser(updated);
    setMessage(`Angemeldet als ${u.nickname} (${u.roleDescription || 'Kletterer'})`);
    onUserChanged?.(updated);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setMessage('Erfolgreich abgemeldet.');
    onUserChanged?.(null);
  };

  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setErrorMsg('Bitte eine gültige E-Mail-Adresse angeben.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await signInWithEmail(newEmail);
      if (newNickname.trim()) {
        user.nickname = newNickname.trim();
        setSessionUser(user);
      }
      setCurrentUser(user);
      setMessage(`Konto erfolgreich erstellt! Angemeldet als ${user.nickname}`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Erstellen des Kontos';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle({
        nickname: newNickname.trim() || undefined,
        email: newEmail.trim() || undefined
      });
      setCurrentUser(user);
      setMessage(`Google-Login erfolgreich! Angemeldet als ${user.nickname}`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Google-Login';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (u: AuthUser) => {
    if (u.isPlatformAdmin) return <Crown className="w-4 h-4 text-[#C9A96E]" />;
    if (u.id.includes('admin')) return <Building2 className="w-4 h-4 text-[#C9A96E]" />;
    if (u.id.includes('schrauber')) return <Wrench className="w-4 h-4 text-[#A89F91]" />;
    return <Mountain className="w-4 h-4 text-[#8B8680]" />;
  };

  const getGymScopeBadge = (u: AuthUser) => {
    if (u.id === 'user-boris') return 'Alle Hallen (OverAdmin)';
    if (u.id === 'admin-6aplus') return '6a plus Winterthur (Admin & Schrauber)';
    if (u.id === 'schrauber-6aplus') return '6a plus Winterthur (Schrauber)';
    if (u.id === 'admin-minimum') return 'Minimum Zürich (Admin & Schrauber)';
    if (u.id === 'schrauber-minimum') return 'Minimum Zürich (Schrauber)';
    return 'Universal Kletterer (alle Hallen)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 font-sans animate-in fade-in duration-200">
      <div className="bg-[#1E1E1E] border border-[#333333] rounded-none w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex items-center justify-between bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-headline uppercase tracking-wider font-bold text-base text-[#E8E0D4]">
                Anmeldung & Konto
              </h3>
              <p className="text-xs text-[#A89F91]">
                Profil & Rolle wählen oder direkt anmelden
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6358] hover:text-[#E8E0D4] p-1.5 rounded-[2px] hover:bg-[#2A2A2A] transition"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {message && (
            <div className="p-3 rounded-none bg-[#121212] border border-[#4A5D3A] text-[#86efac] text-xs flex items-center gap-2 font-mono">
              <Check className="w-4 h-4 shrink-0 text-[#86efac]" />
              <span>{message}</span>
            </div>
          )}

          {/* Current Active User Status */}
          {currentUser ? (
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
                    <span className="px-2 py-0.5 rounded-none text-[9px] font-bold bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/40 uppercase font-mono">
                      {currentUser.roleDescription || (currentUser.isPlatformAdmin ? 'OverAdmin' : 'Kletterer')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A89F91] font-mono mt-0.5">
                    Aktiv angemeldet • {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-xs text-[#A89F91] hover:text-[#ef4444] border border-[#333333] font-mono transition"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-none bg-[#121212] border border-[#333333] flex items-center justify-between text-xs text-[#A89F91]">
              <span>Aktuell nicht angemeldet (Gast)</span>
            </div>
          )}

          {/* Quick Registration / Account Creation Form */}
          <div className="p-4 bg-[#161616] border border-[#333333] rounded-none space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#C9A96E]" />
                <span>Neues Kletterer-Konto erstellen</span>
              </span>
              <span className="text-[10px] font-mono text-[#86efac] bg-[#4A5D3A]/30 border border-[#86efac]/30 px-1.5 py-0.5">
                Kostenlos & sofort
              </span>
            </div>

            <form onSubmit={handleRegisterNewUser} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Kletter-Name (z.B. Alex)"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  className="px-3 py-1.5 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                  data-testid="input-register-nickname"
                />
                <input
                  type="email"
                  placeholder="E-Mail-Adresse"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  className="px-3 py-1.5 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                  data-testid="input-register-email"
                />
              </div>

              {errorMsg && (
                <div className="text-[11px] text-[#ef4444] font-mono" data-testid="register-error-msg">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-xs tracking-wider transition rounded-[2px] disabled:opacity-50"
                  data-testid="btn-register-submit"
                >
                  Konto erstellen & starten
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#8B8680] font-mono text-xs transition rounded-[2px] disabled:opacity-50 flex items-center gap-1.5"
                  title="Mit Google anmelden"
                  data-testid="btn-google-login"
                >
                  <Globe className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Google</span>
                </button>
              </div>
            </form>
          </div>

          {/* 6 Profile Cards Grid */}
          <div>
            <div className="text-[11px] text-[#A89F91] uppercase font-headline tracking-wider font-bold mb-3 flex items-center gap-2">
              <span>Oder mit bestehendem Test-Profil einloggen ({testUsers.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testUsers.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    data-testid={`persona-login-${u.id}`}
                    onClick={() => handleSelectPersona(u)}
                    className={`p-4 rounded-none border text-left transition-all flex flex-col justify-between group ${
                      isActive
                        ? 'bg-[#2A2A2A] border-[#C9A96E] ring-1 ring-[#C9A96E]'
                        : 'bg-[#141414] border-[#333333] hover:border-[#8B8680] hover:bg-[#1E1E1E]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-11 h-11 rounded-none object-cover border border-[#333333] group-hover:border-[#C9A96E] transition"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center font-bold text-sm text-[#E8E0D4]">
                            {u.nickname.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-[#1E1E1E] border border-[#333333] p-0.5 rounded-none">
                          {getRoleIcon(u)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-[#E8E0D4] truncate font-headline uppercase tracking-wide">
                            {u.nickname}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#C9A96E] font-mono font-bold">
                              <Check className="w-3 h-3" /> Aktiv
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-[#C9A96E] font-mono mt-0.5">
                          {u.roleDescription}
                        </div>

                        <div className="text-[10px] text-[#8B8680] font-mono mt-1 leading-snug">
                          {getGymScopeBadge(u)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#6B6358]">
                      <span>{u.email}</span>
                      <span className="text-[#A89F91] group-hover:text-[#E8E0D4] transition">
                        {isActive ? 'Ausgewählt' : 'Einloggen →'}
                      </span>
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
