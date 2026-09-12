import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Check, 
  Crown, 
  Wrench, 
  Building2, 
  Mountain, 
  UserPlus, 
  Globe, 
  LogIn, 
  Lock, 
  Mail, 
  KeyRound, 
  Send,
  Loader2
} from 'lucide-react';
import {
  getCurrentAuthUser,
  signOut,
  setSessionUser,
  getAvailableTestUsers,
  signInWithGoogle,
  signInWithPassword,
  signUpWithEmail,
  signInWithOtp,
  AuthUser
} from '../lib/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: AuthUser | null) => void;
  initialMode?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onUserChanged,
  initialMode = 'register'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLinkInput, setShowMagicLinkInput] = useState(false);

  // Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentAuthUser());
    setErrorMsg(null);
    setMessage(null);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

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

  // Echter Login mit E-Mail & Passwort
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginEmail.includes('@')) {
      setErrorMsg('Bitte eine gültige E-Mail-Adresse angeben.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Bitte dein Passwort eingeben.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await signInWithPassword(loginEmail, loginPassword);
      setCurrentUser(user);
      setMessage(`Willkommen zurück, ${user.nickname}!`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler bei der Anmeldung';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Echte Registrierung neuer Kletterer
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerEmail.includes('@')) {
      setErrorMsg('Bitte eine gültige E-Mail-Adresse angeben.');
      return;
    }
    
    // Falls kein Passwort eingegeben wurde, sicheres Standardpasswort nutzen
    const passwordToUse = registerPassword.trim() || 'bouldermate2026';

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await signUpWithEmail(registerEmail, passwordToUse, registerNickname);
      setCurrentUser(user);
      setMessage(`Konto erfolgreich erstellt! Willkommen bei BoulderMate, ${user.nickname}!`);
      onUserChanged?.(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Erstellen des Kontos';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Magic Link anfordern
  const handleSendMagicLink = async () => {
    const targetEmail = activeTab === 'login' ? loginEmail : registerEmail;
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Bitte gib zuerst eine gültige E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithOtp(targetEmail);
      setMagicLinkSent(true);
      setMessage(`Login-Link wurde an ${targetEmail} gesendet! Bitte prüfe dein Postfach.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Senden des Login-Links';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const email = registerEmail.trim() || loginEmail.trim() || undefined;
      const nickname = registerNickname.trim() || undefined;
      const user = await signInWithGoogle({ email, nickname });
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
    if (u.id.includes('admin') || u.roleDescription?.includes('Admin')) return <Building2 className="w-4 h-4 text-[#C9A96E]" />;
    if (u.id.includes('schrauber') || u.roleDescription?.includes('Schrauber')) return <Wrench className="w-4 h-4 text-[#A89F91]" />;
    return <Mountain className="w-4 h-4 text-[#8B8680]" />;
  };

  const getGymScopeBadge = (u: AuthUser) => {
    if (u.id === 'user-boris' || u.isPlatformAdmin) return 'Alle Hallen (OverAdmin)';
    if (u.id.includes('6aplus') || u.email.includes('6aplus')) return '6a plus Winterthur';
    if (u.id.includes('minimum') || u.email.includes('minimum')) return 'Minimum Zürich';
    return 'Universal Kletterer (alle Hallen)';
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/85 font-sans animate-in fade-in duration-200 flex items-start sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[#1E1E1E] border border-[#333333] rounded-none w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#333333] flex items-center justify-between bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] shrink-0">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-headline uppercase tracking-wider font-bold text-base text-[#E8E0D4]">
                Anmeldung & Konto
              </h3>
              <p className="text-xs text-[#A89F91]">
                Mit echtem Benutzerkonto anmelden oder neu registrieren
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A89F91] hover:text-[#E8E0D4] min-w-[44px] min-h-[44px] p-2 rounded-[2px] bg-[#2A2A2A]/80 sm:bg-transparent hover:bg-[#2A2A2A] transition flex items-center justify-center shrink-0 border border-[#333333] sm:border-transparent"
            title="Schließen"
            aria-label="Schließen"
            data-testid="login-modal-close-btn"
          >
            <X className="w-5 h-5 text-[#E8E0D4] sm:text-[#6B6358] sm:hover:text-[#E8E0D4]" />
          </button>
        </div>

        {/* Tab Navigation between Register & Login */}
        <div className="flex border-b border-[#333333] bg-[#141414]">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 px-3 sm:px-4 text-xs font-headline uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeTab === 'register'
                ? 'border-[#C9A96E] text-[#E8E0D4] bg-[#1E1E1E]'
                : 'border-transparent text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#1A1A1A]'
            }`}
            data-testid="tab-register"
          >
            <UserPlus className="w-4 h-4 text-[#C9A96E]" />
            <span>Konto erstellen</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 px-3 sm:px-4 text-xs font-headline uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeTab === 'login'
                ? 'border-[#C9A96E] text-[#E8E0D4] bg-[#1E1E1E]'
                : 'border-transparent text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#1A1A1A]'
            }`}
            data-testid="tab-login"
          >
            <LogIn className="w-4 h-4 text-[#C9A96E]" />
            <span>Anmelden</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {message && (
            <div className="p-3 rounded-none bg-[#121212] border border-[#4A5D3A] text-[#86efac] text-xs flex items-center gap-2 font-mono">
              <Check className="w-4 h-4 shrink-0 text-[#86efac]" />
              <span>{message}</span>
            </div>
          )}

          {errorMsg && (
            <div 
              className="p-3 rounded-none bg-[#1F1212] border border-[#ef4444]/40 text-[#ef4444] text-xs flex items-center gap-2 font-mono"
              data-testid="register-error-msg"
            >
              <span>{errorMsg}</span>
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
                type="button"
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

          {/* TAB 1: REGISTRIERUNG */}
          {activeTab === 'register' && (
            <div className="p-4 bg-[#161616] border border-[#333333] rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#C9A96E]" />
                  <span>Neues Kletterer-Konto erstellen</span>
                </span>
                <span className="text-[10px] font-mono text-[#86efac] bg-[#4A5D3A]/30 border border-[#86efac]/30 px-1.5 py-0.5">
                  Kostenlos & sofort startklar
                </span>
              </div>

              <form onSubmit={handleRegister} noValidate className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#A89F91] uppercase tracking-wider">Kletter-Name (Nickname)</label>
                  <input
                    type="text"
                    placeholder="z.B. Alex oder Boulderer99"
                    value={registerNickname}
                    onChange={e => setRegisterNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                    data-testid="input-register-nickname"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#A89F91] uppercase tracking-wider">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="deine.email@beispiel.ch"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                      data-testid="input-register-email"
                    />
                    <Mail className="w-4 h-4 text-[#6B6358] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#A89F91] uppercase tracking-wider">Passwort (mind. 6 Zeichen)</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                      data-testid="input-register-password"
                    />
                    <Lock className="w-4 h-4 text-[#6B6358] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-xs tracking-wider transition rounded-[2px] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    data-testid="btn-register-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Konto wird erstellt...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Konto erstellen & starten</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#8B8680] font-mono text-xs transition rounded-[2px] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    title="Mit Google anmelden"
                    data-testid="btn-google-login"
                  >
                    <Globe className="w-4 h-4 text-[#C9A96E]" />
                    <span>Mit Google</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ANMELDUNG (LOGIN) */}
          {activeTab === 'login' && (
            <div className="p-4 bg-[#161616] border border-[#333333] rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#E8E0D4] flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-[#C9A96E]" />
                  <span>Mit bestehendem Konto anmelden</span>
                </span>
                <span className="text-[10px] font-mono text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-1.5 py-0.5">
                  Supabase Auth
                </span>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#A89F91] uppercase tracking-wider">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="deine.email@beispiel.ch"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                      data-testid="input-login-email"
                    />
                    <Mail className="w-4 h-4 text-[#6B6358] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-[#A89F91] uppercase tracking-wider">Passwort</label>
                    <button
                      type="button"
                      onClick={() => setShowMagicLinkInput(!showMagicLinkInput)}
                      className="text-[10px] font-mono text-[#C9A96E] hover:underline"
                    >
                      Passwort vergessen? / Magic Link
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#333333] text-[#E8E0D4] placeholder-[#6B6358] text-xs font-mono focus:outline-none focus:border-[#C9A96E]"
                      data-testid="input-login-password"
                    />
                    <Lock className="w-4 h-4 text-[#6B6358] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {showMagicLinkInput && (
                  <div className="p-3 bg-[#1A1A1A] border border-[#C9A96E]/30 rounded-none space-y-2">
                    <div className="text-[11px] font-mono text-[#E8E0D4] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>Passwortloser Login via Magic Link:</span>
                    </div>
                    <p className="text-[10px] text-[#A89F91]">
                      Wir senden einen sofortigen Einlogg-Link an deine E-Mail-Adresse.
                    </p>
                    {magicLinkSent ? (
                      <div className="p-2 bg-[#4A5D3A]/20 border border-[#86efac]/40 text-[#86efac] text-xs font-mono flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#86efac]" />
                        <span>Link wurde verschickt! Bitte Postfach prüfen.</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendMagicLink}
                        disabled={isSubmitting || !loginEmail}
                        className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-xs font-mono text-[#C9A96E] border border-[#333333] flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>Magic Link jetzt senden</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] font-headline uppercase font-bold text-xs tracking-wider transition rounded-[2px] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    data-testid="btn-login-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Wird angemeldet...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Anmelden</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#8B8680] font-mono text-xs transition rounded-[2px] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    title="Mit Google anmelden"
                    data-testid="btn-google-login"
                  >
                    <Globe className="w-4 h-4 text-[#C9A96E]" />
                    <span>Mit Google</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 6 PROFILE CARDS GRID (TEST PERSONAS IMMER ZUGÄNGLICH) */}
          <div className="pt-2">
            <div className="text-[11px] text-[#A89F91] uppercase font-headline tracking-wider font-bold mb-3 flex items-center justify-between">
              <span>Oder mit bestehendem Test-Profil einloggen ({testUsers.length})</span>
              <span className="text-[10px] font-mono text-[#6B6358]">Passwort: bouldermate2026</span>
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

        {/* Footer for Mobile / Quick Dismiss */}
        <div className="p-3.5 sm:p-4 border-t border-[#333333] bg-[#1A1A1A] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#6B6358]">BoulderMate Supabase Authentication</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[#E8E0D4] bg-[#2A2A2A] border border-[#333333] hover:bg-[#333333] transition"
            data-testid="login-modal-cancel-btn"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
