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
  LogIn, 
  Mail, 
  Loader2,
  KeyRound,
  RotateCw
} from 'lucide-react';
import {
  getCurrentAuthUser,
  signOut,
  setSessionUser,
  getAvailableTestUsers,
  signInWithPassword,
  signUpWithEmail,
  resendConfirmation,
  requestPasswordReset,
  AuthFlowError,
  AuthFlowCode,
  AuthUser
} from '../lib/authService';
import { t } from '../lib/i18n';
import { useBackHandler } from '../hooks/useBackHandler';
import { ForgotPasswordPanel } from './auth/ForgotPasswordPanel';
import { CheckEmailPanel } from './auth/CheckEmailPanel';
import { PasswordField } from './auth/PasswordField';
import { AuthAlert, SecondaryButton } from './auth/authUi';
import { useCooldown } from './auth/useCooldown';
import { GoogleSignInButton, useGoogleLoginAvailable, useGoogleSignIn } from './GoogleSignInButton';
import { AppleSignInButton, useAppleLoginAvailable, useAppleSignIn } from './AppleSignInButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: AuthUser | null) => void;
  initialMode?: 'login' | 'register' | 'forgot';
  /** SPEC-049 AC-9: Meldung beim Öffnen, z. B. «Der Link ist abgelaufen …» */
  initialNotice?: string | null;
}

/** SPEC-049: Ansichten im Login-Fenster neben den beiden Tabs */
type LoginView = 'tabs' | 'forgot' | 'check-reset' | 'check-confirm';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onUserChanged,
  initialMode = 'register',
  initialNotice = null
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode === 'forgot' ? 'login' : initialMode);
  const [view, setView] = useState<LoginView>(initialMode === 'forgot' ? 'forgot' : 'tabs');
  const [checkEmail, setCheckEmail] = useState('');
  const [errorCode, setErrorCode] = useState<AuthFlowCode | null>(null);
  const [errorEmail, setErrorEmail] = useState('');
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const resendCooldown = useCooldown();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentAuthUser());
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SPEC-024 AC-1.2: ein Google-Knopf oben, für Anmelden und Registrieren gemeinsam
  const googleAvailable = useGoogleLoginAvailable();
  const google = useGoogleSignIn();
  const appleAvailable = useAppleLoginAvailable();
  const apple = useAppleSignIn();

  useEffect(() => {
    setCurrentUser(getCurrentAuthUser());
    setErrorMsg(null);
    setErrorCode(null);
    setResendInfo(null);
    setMessage(null);
    if (isOpen) {
      // SPEC-049: Jedes Öffnen beginnt bei den Tabs, ausser es soll direkt «Passwort vergessen» zeigen
      setView(initialMode === 'forgot' ? 'forgot' : 'tabs');
      if (initialMode === 'forgot') setActiveTab('login');
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // SPEC-049 AC-2: Android-Zurück führt von «Passwort vergessen» zum Anmelden
  useBackHandler({
    id: 'login-forgot-password',
    isOpen: isOpen && view !== 'tabs',
    onBack: () => setView('tabs'),
  });

  if (!isOpen) return null;

  const showError = (err: unknown, fallback: string) => {
    if (err instanceof AuthFlowError) {
      setErrorMsg(err.message);
      setErrorCode(err.code);
      setErrorEmail(err.email || '');
    } else {
      setErrorMsg(err instanceof Error ? err.message : fallback);
      setErrorCode(null);
    }
  };

  const openForgot = () => {
    setErrorMsg(null);
    setErrorCode(null);
    setActiveTab('login');
    setView('forgot');
  };

  const handleResendConfirmation = async () => {
    setResendInfo(null);
    try {
      await resendConfirmation(errorEmail || loginEmail);
      setResendInfo('Mail ist nochmal unterwegs.');
      resendCooldown.start();
    } catch (err: unknown) {
      showError(err, 'Das hat nicht geklappt. Bitte nochmal versuchen.');
    }
  };

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
    setErrorCode(null);
    setResendInfo(null);
    try {
      const user = await signInWithPassword(loginEmail, loginPassword);
      setCurrentUser(user);
      setMessage(`Willkommen zurück, ${user.nickname}!`);
      onUserChanged?.(user);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      showError(err, 'Fehler bei der Anmeldung');
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
    
    const passwordToUse = registerPassword.trim();
    if (passwordToUse.length < 6) {
      setErrorMsg('Passwort braucht mindestens 6 Zeichen.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setErrorCode(null);
    try {
      const user = await signUpWithEmail(registerEmail, passwordToUse, registerNickname);
      setCurrentUser(user);
      setMessage(`Konto erfolgreich erstellt! Willkommen bei BoulderMate, ${user.nickname}!`);
      onUserChanged?.(user);
      onClose();
    } catch (err: unknown) {
      // SPEC-049 AC-10: Bestätigung nötig → «Fast geschafft», niemand ist angemeldet
      if (err instanceof AuthFlowError && err.code === 'confirm_email') {
        setCheckEmail(err.email || registerEmail.trim().toLowerCase());
        setView('check-confirm');
      } else {
        showError(err, 'Fehler beim Erstellen des Kontos');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (u: AuthUser) => {
    if (u.isPlatformAdmin) return <Crown className="w-4 h-4 text-[var(--bm-accent)]" />;
    if (u.id.includes('admin') || u.roleDescription?.includes('Admin')) return <Building2 className="w-4 h-4 text-[var(--bm-accent)]" />;
    if (u.id.includes('schrauber') || u.roleDescription?.includes('Schrauber')) return <Wrench className="w-4 h-4 text-[var(--bm-text-2)]" />;
    return <Mountain className="w-4 h-4 text-[var(--bm-text-2)]" />;
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
        className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bm-line)] flex items-center justify-between bg-[var(--bm-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center text-[var(--bm-accent)] shrink-0">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[var(--bm-text)]">
                Anmeldung & Konto
              </h3>
              <p className="text-xs text-[var(--bm-text-2)]">
                Mit echtem Benutzerkonto anmelden oder neu registrieren
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--bm-text-2)] hover:text-[var(--bm-text)] min-w-[44px] min-h-[44px] p-2 rounded-xl bg-[var(--bm-elevated)]/80 sm:bg-transparent hover:bg-[var(--bm-elevated)] transition flex items-center justify-center shrink-0 border border-[var(--bm-line)] sm:border-transparent"
            title="Schließen"
            aria-label="Schließen"
            data-testid="login-modal-close-btn"
          >
            <X className="w-5 h-5 text-[var(--bm-text)] sm:text-[var(--bm-text-3)] sm:hover:text-[var(--bm-text)]" />
          </button>
        </div>

        {/* Tab Navigation between Register & Login */}
        {view === 'tabs' && (
        <div className="flex border-b border-[var(--bm-line)] bg-[var(--bm-bg)]">
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 px-3 sm:px-4 text-xs font-headline font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeTab === 'register'
                ? 'border-[var(--bm-accent)] text-[var(--bm-text)] bg-[var(--bm-surface)]'
                : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
            }`}
            data-testid="tab-register"
          >
            <UserPlus className="w-4 h-4 text-[var(--bm-accent)]" />
            <span>Konto erstellen</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 px-3 sm:px-4 text-xs font-headline font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeTab === 'login'
                ? 'border-[var(--bm-accent)] text-[var(--bm-text)] bg-[var(--bm-surface)]'
                : 'border-transparent text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-surface)]'
            }`}
            data-testid="tab-login"
          >
            <LogIn className="w-4 h-4 text-[var(--bm-accent)]" />
            <span>Anmelden</span>
          </button>
        </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {message && (
            <div className="p-3 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-success)] text-[var(--bm-success)] text-xs flex items-center gap-2 font-mono">
              <Check className="w-4 h-4 shrink-0 text-[var(--bm-success)]" />
              <span>{message}</span>
            </div>
          )}

          {(googleAvailable || appleAvailable) && (
            <div className="space-y-3">
              {googleAvailable && <GoogleSignInButton onClick={google.start} busy={google.busy} />}
              {appleAvailable && <AppleSignInButton onClick={apple.start} busy={apple.busy} />}
              <div className="flex items-center gap-3 text-[14px] text-[var(--bm-text-2)]">
                <span className="flex-1 h-px bg-[var(--bm-line)]" />
                <span>oder mit E-Mail</span>
                <span className="flex-1 h-px bg-[var(--bm-line)]" />
              </div>
            </div>
          )}

          {view === 'tabs' && (errorMsg || google.error || apple.error) && (
            <AuthAlert testId="register-error-msg">
              <span>{t(errorMsg || google.error || apple.error || '')}</span>
              {/* SPEC-049 AC-14 / AC-11: direkter Weg aus der Meldung */}
              {(errorCode === 'invalid_credentials' || errorCode === 'account_exists') && (
                <SecondaryButton type="button" onClick={openForgot} data-testid="error-forgot-password">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                  <span>{t('Passwort vergessen?')}</span>
                </SecondaryButton>
              )}
              {errorCode === 'account_exists' && activeTab === 'register' && (
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setLoginEmail(errorEmail || registerEmail);
                    setErrorMsg(null);
                    setErrorCode(null);
                    setActiveTab('login');
                  }}
                  data-testid="error-go-login"
                >
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  <span>{t('Anmelden')}</span>
                </SecondaryButton>
              )}
              {/* SPEC-049 AC-13 */}
              {errorCode === 'email_not_confirmed' && (
                <SecondaryButton
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendCooldown.remaining > 0}
                  data-testid="btn-resend-confirmation"
                >
                  <RotateCw className="w-5 h-5" aria-hidden="true" />
                  <span>
                    {resendCooldown.remaining > 0
                      ? t('Nochmal senden in {n} s', { n: resendCooldown.remaining })
                      : t('Bestätigungsmail nochmal senden')}
                  </span>
                </SecondaryButton>
              )}
              {resendInfo && (
                <p role="status" data-testid="resend-confirmation-info">{t(resendInfo)}</p>
              )}
            </AuthAlert>
          )}

          {/* SPEC-049: Passwort vergessen / Postfach prüfen */}
          {view === 'forgot' && (
            <ForgotPasswordPanel
              initialEmail={loginEmail}
              notice={initialMode === 'forgot' ? initialNotice : null}
              onBack={() => setView('tabs')}
              onSent={(email) => {
                setCheckEmail(email);
                setView('check-reset');
              }}
            />
          )}
          {(view === 'check-reset' || view === 'check-confirm') && (
            <CheckEmailPanel
              mode={view === 'check-reset' ? 'reset' : 'confirm'}
              email={checkEmail}
              onResend={() =>
                view === 'check-reset'
                  ? requestPasswordReset(checkEmail)
                  : resendConfirmation(checkEmail)
              }
              onBack={() => {
                setActiveTab(view === 'check-reset' ? 'login' : 'register');
                setView('tabs');
              }}
            />
          )}

          {/* Current Active User Status */}
          {currentUser ? (
            <div className="p-3.5 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-[var(--bm-line)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center font-bold text-[var(--bm-text)]">
                    {currentUser.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--bm-text)]">{currentUser.nickname}</span>
                    <span className="px-2 py-0.5 rounded-xl text-[9px] font-bold bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 font-mono">
                      {currentUser.roleDescription || (currentUser.isPlatformAdmin ? 'OverAdmin' : 'Kletterer')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--bm-text-2)] font-mono mt-0.5">
                    Aktiv angemeldet • {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-xs text-[var(--bm-text-2)] hover:text-[var(--bm-danger)] border border-[var(--bm-line)] font-mono transition"
              >
                Abmelden
              </button>
            </div>
          ) : null}

          {/* TAB 1: REGISTRIERUNG */}
          {view === 'tabs' && activeTab === 'register' && (
            <div className="p-4 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline font-bold text-[var(--bm-text)] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Neues Kletterer-Konto erstellen</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--bm-success)] bg-[var(--bm-success)]/30 border border-[var(--bm-success)]/30 px-1.5 py-0.5">
                  Kostenlos & sofort startklar
                </span>
              </div>

              <form onSubmit={handleRegister} noValidate className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--bm-text-2)]">Kletter-Name (Nickname)</label>
                  <input
                    type="text"
                    placeholder="z.B. Alex oder Boulderer99"
                    value={registerNickname}
                    onChange={e => setRegisterNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] text-xs font-mono focus:outline-none focus:border-[var(--bm-accent)]"
                    data-testid="input-register-nickname"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--bm-text-2)]">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="deine.email@beispiel.ch"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] text-xs font-mono focus:outline-none focus:border-[var(--bm-accent)]"
                      data-testid="input-register-email"
                    />
                    <Mail className="w-4 h-4 text-[var(--bm-text-3)] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <PasswordField
                  label={t('Passwort (mind. 6 Zeichen)')}
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  testId="input-register-password"
                  autoComplete="new-password"
                />

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs transition rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
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
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ANMELDUNG (LOGIN) */}
          {view === 'tabs' && activeTab === 'login' && (
            <div className="p-4 bg-[var(--bm-bg)] border border-[var(--bm-line)] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-headline font-bold text-[var(--bm-text)] flex items-center gap-1.5">
                  <LogIn className="w-4 h-4 text-[var(--bm-accent)]" />
                  <span>Mit bestehendem Konto anmelden</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--bm-accent)] bg-[var(--bm-accent)]/10 border border-[var(--bm-accent)]/30 px-1.5 py-0.5">
                  Supabase Auth
                </span>
              </div>

              <form onSubmit={handleLogin} noValidate className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--bm-text-2)]">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="deine.email@beispiel.ch"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[var(--bm-text)] placeholder-[var(--bm-text-3)] text-xs font-mono focus:outline-none focus:border-[var(--bm-accent)]"
                      data-testid="input-login-email"
                    />
                    <Mail className="w-4 h-4 text-[var(--bm-text-3)] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <PasswordField
                  label={t('Passwort')}
                  value={loginPassword}
                  onChange={setLoginPassword}
                  testId="input-login-password"
                  autoComplete="current-password"
                />

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 px-4 py-2.5 bg-[var(--bm-strong)] hover:bg-[var(--bm-text)] text-[var(--bm-bg)] font-headline font-bold text-xs transition rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
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
                </div>
              </form>

              {/* SPEC-049 AC-1: gut sichtbar, volle Breite, kein «Magic Link» mehr */}
              <SecondaryButton type="button" onClick={openForgot} data-testid="btn-forgot-password">
                <KeyRound className="w-5 h-5" aria-hidden="true" />
                <span>{t('Passwort vergessen?')}</span>
              </SecondaryButton>
            </div>
          )}

          {/* Test-Personas nur im Dev-Build (SPEC-020 AC-9.4) */}
          {import.meta.env.DEV && (
          <div className="pt-2">
            <div className="text-[11px] text-[var(--bm-text-2)] font-headline font-bold mb-3 flex items-center justify-between">
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
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                      isActive
                        ? 'bg-[var(--bm-elevated)] border-[var(--bm-accent)] ring-1 ring-[var(--bm-accent)]'
                        : 'bg-[var(--bm-bg)] border-[var(--bm-line)] hover:border-[var(--bm-text-2)] hover:bg-[var(--bm-surface)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border border-[var(--bm-line)] group-hover:border-[var(--bm-accent)] transition"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center font-bold text-sm text-[var(--bm-text)]">
                            {u.nickname.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-[var(--bm-surface)] border border-[var(--bm-line)] p-0.5 rounded-xl">
                          {getRoleIcon(u)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-[var(--bm-text)] truncate font-headline">
                            {u.nickname}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--bm-accent)] font-mono font-bold">
                              <Check className="w-3 h-3" /> Aktiv
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-[var(--bm-accent)] font-mono mt-0.5">
                          {u.roleDescription}
                        </div>

                        <div className="text-[10px] text-[var(--bm-text-2)] font-mono mt-1 leading-snug">
                          {getGymScopeBadge(u)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[var(--bm-elevated)] flex items-center justify-between text-[10px] font-mono text-[var(--bm-text-3)]">
                      <span>{u.email}</span>
                      <span className="text-[var(--bm-text-2)] group-hover:text-[var(--bm-text)] transition">
                        {isActive ? 'Ausgewählt' : 'Einloggen →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Footer for Mobile / Quick Dismiss */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--bm-line)] bg-[var(--bm-surface)] flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-bold text-[var(--bm-text)] bg-[var(--bm-elevated)] border border-[var(--bm-line)] hover:bg-[var(--bm-line)] transition"
            data-testid="login-modal-cancel-btn"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
