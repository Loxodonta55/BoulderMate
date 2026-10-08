import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Boulder, GymMemberRole, Gym } from './types/boulder';
import {
  getStoredBoulders,
  createBoulder,
} from './lib/storage';
import { SEED_CRUD_BOULDERS } from './lib/seedData';
import { BatchBoulderWorkflow } from './components/BatchBoulderWorkflow';
import { GymManagement } from './components/GymManagement';
import { ensureInitialGymData } from './lib/gymStorage';
import { getGyms } from './lib/batchBoulderService';
import { ClimberSectorView } from './components/ClimberSectorView';
import { MeView } from './components/MeView';
import { ToastHost } from './components/ui/Toast';
import { getProfile } from './lib/profileService';
import { AppMode, getUserRoleInfo, UserRoleInfo } from './lib/roleService';
import { RoleGatewayModal } from './components/RoleGatewayModal';
import { LoginModal } from './components/LoginModal';
import { LandingPage } from './components/LandingPage';
import { initAuthSession, getCurrentAuthUser, signOut, setSessionUser, onAuthStateChange, AuthUser, readOAuthReturnFromUrl, finishOAuthRedirect, OAUTH_ERROR_FAILED } from './lib/authService';
import { syncFromSupabase, startRealtimeSync } from './lib/syncService';
import { startFeedbackQueueSync } from './lib/feedbackService';
import { AppHeader } from './components/AppHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useBackHandler } from './hooks/useBackHandler';
import { GymFinderSheet } from './components/GymFinderSheet';
import { getGymFinderEntries } from './lib/gymFinder';

export const AVAILABLE_CLIMBERS: { id: string; nickname: string }[] = [
  { id: 'user-boris', nickname: 'Boris (OverAdmin)' },
  { id: 'admin-6aplus', nickname: 'Admin6APlus (HallenAdmin 6aPlus)' },
  { id: 'schrauber-6aplus', nickname: 'Schrauber6aPlus (Schrauber 6aPlus)' },
  { id: 'hans-kletterer', nickname: 'HansDereinfacheKletterer (Kletterer)' },
  { id: 'admin-minimum', nickname: 'AdminMinimum (HallenAdmin Minimum)' },
  { id: 'schrauber-minimum', nickname: 'Schrauber Minimum (Schrauber Minimum)' },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'stats'>('wall');
  const [appMode, setAppMode] = useState<AppMode>('climber');
  const [isRoleGatewayOpen, setIsRoleGatewayOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  // SPEC-011 AC-8: Landing Page auch angemeldet über das Logo erreichbar
  const [isLandingOpen, setIsLandingOpen] = useState<boolean>(false);
  const [hasChosenModeForUser, setHasChosenModeForUser] = useState<Record<string, boolean>>({});
  // SPEC-025: «Halle wählen» mit Karte
  const [isGymFinderOpen, setIsGymFinderOpen] = useState<boolean>(false);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [activeGymId, setActiveGymId] = useState<string>('gym-6a-plus');
  // Legacy-Boulder-Store wird beim Start befüllt; die Kletterer-Screens lesen selbst aus dem Speicher
  const [, setBoulders] = useState<Boulder[]>([]);
  const [climberNicknames, setClimberNicknames] = useState<Record<string, string>>({});

  const [authSession, setAuthSession] = useState<AuthUser | null>(() => initAuthSession());
  const [climberId, setClimberId] = useState<string | null>(() => authSession ? authSession.id : null);

  // SPEC-024 AC-2.4 / AC-5.1: Rückkehr von Google (?code= oder ?error=) beim Start auswerten
  const [oauthReturn] = useState(() => readOAuthReturnFromUrl());
  const [isFinishingOAuth, setIsFinishingOAuth] = useState(oauthReturn.status === 'pending');
  const [authNotice, setAuthNotice] = useState<string | null>(oauthReturn.status === 'error' ? oauthReturn.message : null);

  useEffect(() => {
    if (oauthReturn.status !== 'pending') return;
    let active = true;
    finishOAuthRedirect().then(user => {
      if (!active) return;
      if (user) {
        setAuthSession(user);
        setClimberId(user.id);
      } else {
        setAuthNotice(OAUTH_ERROR_FAILED);
      }
      setIsFinishingOAuth(false);
    });
    return () => {
      active = false;
    };
  }, [oauthReturn]);

  const selectableClimbers = useMemo(() => {
    const list = [...AVAILABLE_CLIMBERS];
    if (authSession && !list.some(c => c.id === authSession.id)) {
      list.unshift({
        id: authSession.id,
        nickname: `${authSession.nickname} (Du)`
      });
    }
    return list;
  }, [authSession]);

  const currentClimber = climberId
    ? selectableClimbers.find(c => c.id === climberId) || { id: climberId, nickname: authSession?.nickname || 'Kletterer' }
    : null;
  const activeNickname = climberId
    ? (climberNicknames[climberId] || getProfile(climberId)?.nickname || authSession?.nickname || currentClimber?.nickname || 'Kletterer')
    : 'Gast';

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setAuthSession(user);
      setClimberId(user ? user.id : null);
    });
    return () => unsubscribe();
  }, []);

  // SPEC-000: Hallenbezogene Rollenermittlung (Gym Scoping)
  const roleInfo: UserRoleInfo = useMemo(() => {
    if (!climberId) {
      return {
        userId: 'guest',
        gymId: activeGymId,
        roles: ['member' as GymMemberRole],
        isClimber: true,
        isSetter: false,
        isAdmin: false,
        isPlatformAdmin: false,
        canAccessSetterStudio: false,
        canAccessAdminConsole: false,
        canCreateGyms: false,
        canAppointSetters: false,
        canAppointAdmins: false,
      };
    }
    return getUserRoleInfo(climberId, activeGymId);
  }, [climberId, activeGymId]);

  const currentUser = useMemo(() => {
    if (!climberId || !authSession) {
      return {
        id: 'guest',
        nickname: 'Gast',
        role: 'member' as GymMemberRole,
        isPlatformAdmin: false,
      };
    }
    return {
      id: currentClimber?.id || climberId,
      nickname: activeNickname,
      role: (roleInfo.isAdmin ? 'admin' : (roleInfo.isSetter ? 'setter' : 'member')) as GymMemberRole,
      isPlatformAdmin: roleInfo.isPlatformAdmin,
    };
  }, [climberId, authSession, currentClimber, activeNickname, roleInfo]);

  // Step 1: Detect user privileges on login, user switch, or gym switch
  useEffect(() => {
    if (!climberId) {
      setIsRoleGatewayOpen(false);
      setAppMode('climber');
      return;
    }

    if (appMode === 'setter' && !roleInfo.canAccessSetterStudio) {
      setAppMode('climber');
    }
    if (appMode === 'admin' && !roleInfo.canAccessAdminConsole) {
      setAppMode('climber');
    }

    if (!roleInfo.canAccessSetterStudio && !roleInfo.canAccessAdminConsole) {
      // Pure climber -> always climber panel
      setAppMode('climber');
      setIsRoleGatewayOpen(false);
    } else {
      // Privileged user -> open gateway modal if not yet chosen for this user
      if (!hasChosenModeForUser[climberId]) {
        setIsRoleGatewayOpen(true);
      }
    }
  }, [climberId, activeGymId, roleInfo.canAccessSetterStudio, roleInfo.canAccessAdminConsole, appMode]);

  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    if (climberId) {
      setHasChosenModeForUser(prev => ({ ...prev, [climberId]: true }));
    }
    setIsRoleGatewayOpen(false);
  };

  const handleCloseRoleGateway = () => {
    if (climberId && hasChosenModeForUser[climberId]) {
      setIsRoleGatewayOpen(false);
    } else {
      // Cancel initial post-login workspace choice: log out and return to landing page unauthenticated
      signOut();
      setAuthSession(null);
      setClimberId(null);
      setIsRoleGatewayOpen(false);
    }
  };

  // SPEC-015: Mobile-First Android Hardware Back-Button Handling
  useBackHandler({
    id: 'modal-login',
    isOpen: isLoginModalOpen,
    onBack: () => setIsLoginModalOpen(false),
  });

  useBackHandler({
    id: 'modal-role-gateway',
    isOpen: isRoleGatewayOpen,
    onBack: handleCloseRoleGateway,
  });

  useBackHandler({
    id: 'landing-page',
    isOpen: isLandingOpen && Boolean(authSession),
    onBack: () => setIsLandingOpen(false),
  });

  useBackHandler({
    id: 'mode-privileged',
    isOpen: appMode !== 'climber',
    onBack: () => setAppMode('climber'),
  });

  useBackHandler({
    id: 'tab-stats',
    isOpen: activeTab === 'stats' && appMode === 'climber',
    onBack: () => setActiveTab('wall'),
  });

  const gymFinderEntries = useMemo(
    () => (isGymFinderOpen ? getGymFinderEntries(gyms) : []),
    [isGymFinderOpen, gyms]
  );

  const refreshGyms = () => {
    const all = getGyms();
    setGyms(all);
    return all;
  };

  // Load boulders & initial gym data on mount
  useEffect(() => {
    ensureInitialGymData();
    const loadedGyms = refreshGyms();
    if (loadedGyms.length > 0) {
      const sixAPlus = loadedGyms.find(g => g.id === 'gym-6a-plus' || g.name.toLowerCase().includes('6a'));
      if (sixAPlus && (!activeGymId || !loadedGyms.some(g => g.id === activeGymId))) {
        setActiveGymId(sixAPlus.id);
      } else if (!loadedGyms.some(g => g.id === activeGymId)) {
        setActiveGymId(loadedGyms[0].id);
      }
    }
    const loaded = getStoredBoulders();
    if (loaded.length === 0) {
      for (const item of SEED_CRUD_BOULDERS) {
        createBoulder(item);
      }
      setBoulders(getStoredBoulders());
    } else {
      setBoulders(loaded);
    }

    // Non-destruktiver Live-Sync aus Supabase (aktualisiert Sektoren, Hallen & Boulder)
    syncFromSupabase().then((synced) => {
      if (synced) {
        refreshGyms();
        setBoulders(getStoredBoulders());
      }
    }).catch(err => {
      console.warn('[Supabase Sync] Background sync warning:', err);
    });

    // Start Supabase Realtime multi-user sync (AC-15)
    const cleanupRealtime = startRealtimeSync();

    // SPEC-026 AC-9: wartendes Feedback nachsenden (jetzt und bei jedem «online»)
    const cleanupFeedbackQueue = startFeedbackQueueSync();

    return () => {
      cleanupRealtime();
      cleanupFeedbackQueue();
    };
  }, []);

  if (isFinishingOAuth && !authSession) {
    return (
      <div
        className="min-h-screen bg-[var(--bm-bg)] text-[var(--bm-text)] flex flex-col items-center justify-center gap-4 font-sans"
        role="status"
        data-testid="oauth-finishing"
      >
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-[18px] font-semibold">Anmeldung läuft …</p>
      </div>
    );
  }

  // Dedicated Standalone Landing Page for unauthenticated visitors
  if (!authSession || isLandingOpen) {
    return (
      <div className="min-h-screen bg-[var(--bm-bg)] text-[var(--bm-text)] flex flex-col font-sans">
        <LandingPage
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onShowGyms={() => setIsGymFinderOpen(true)}
          notice={authNotice}
          onContinue={authSession ? () => setIsLandingOpen(false) : undefined}
          onQuickLogin={(user) => {
            setIsLandingOpen(false);
            const updated = setSessionUser(user);
            setAuthSession(updated);
            setClimberId(updated.id);
          }}
        />

        {/* Login Modal (SPEC-000) */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onUserChanged={(user) => {
            setIsLandingOpen(false);
            if (user) {
              setAuthSession(user);
              setClimberId(user.id);
            } else {
              setAuthSession(null);
              setClimberId(null);
            }
          }}
        />

        {/* SPEC-025 F5: Gäste sehen die Hallen-Karte; «Zur Wand» merkt die Halle und führt zur Anmeldung (angemeldet: direkt zur Wand) */}
        <GymFinderSheet
          open={isGymFinderOpen}
          onClose={() => setIsGymFinderOpen(false)}
          entries={gymFinderEntries}
          activeGymId={activeGymId}
          onSelectGym={(id) => {
            setActiveGymId(id);
            if (authSession) {
              // Über das Logo geöffnet: direkt zur Wand der gewählten Halle
              setIsLandingOpen(false);
              setActiveTab('wall');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
        />

        {/* Role Gateway Modal if triggered */}
        {climberId && (
          <RoleGatewayModal
            isOpen={isRoleGatewayOpen}
            nickname={currentUser.nickname}
            roleInfo={roleInfo}
            currentMode={appMode}
            onSelectMode={handleSelectMode}
            onClose={handleCloseRoleGateway}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bm-bg)] text-[var(--bm-text)] flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Application Navigation Header */}
      <AppHeader
        appMode={appMode}
        gyms={gyms}
        activeGymId={activeGymId}
        onSelectGym={setActiveGymId}
        currentUser={currentUser}
        climberId={climberId}
        selectableClimbers={selectableClimbers}
        onSelectClimber={(newId) => {
          if (newId) {
            setSessionUser(newId);
            setAuthSession(getCurrentAuthUser());
            setClimberId(newId);
          }
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        roleInfo={roleInfo}
        isLoggedIn={Boolean(authSession)}
        onOpenRoleGateway={() => setIsRoleGatewayOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onSwitchToClimber={() => setAppMode('climber')}
        onGymsChanged={refreshGyms}
        onOpenGymFinder={() => {
          refreshGyms();
          setIsGymFinderOpen(true);
        }}
        onOpenLanding={() => setIsLandingOpen(true)}
      />

      {/* Main Content Area — Mobile-First paddings with room for bottom navigation */}
      <main
        className={`flex-1 max-w-6xl w-full mx-auto pb-24 md:pb-8 ${
          appMode === 'climber' && activeTab === 'wall' ? 'px-0 sm:px-4 pt-0 sm:pt-4' : 'px-2 sm:px-4 py-3 sm:py-6'
        }`}
      >
        {appMode === 'setter' ? (
          /* 1. Schrauber-Studio */
          <BatchBoulderWorkflow
            currentUserId={currentUser.id}
            currentRole={roleInfo.isAdmin ? 'admin' : (roleInfo.isSetter ? 'setter' : 'member')}
            activeGymId={activeGymId}
            onSelectGym={(id) => {
              setActiveGymId(id);
              refreshGyms();
            }}
          />
        ) : appMode === 'admin' ? (
          /* 2. Hallen-Administration */
          <GymManagement
            activeGymId={activeGymId}
            userId={currentUser.id}
            onSelectGym={(id) => {
              setActiveGymId(id);
              refreshGyms();
            }}
          />
        ) : activeTab === 'wall' ? (
          /* 3. Kletterer-App: Wand & Sektoren */
          <ClimberSectorView
            currentUser={currentUser}
            activeGymId={activeGymId}
            onSelectGym={(id) => {
              setActiveGymId(id);
              refreshGyms();
            }}
          />
        ) : (
          /* 3. Kletterer-App: «Ich» – eine Seite ohne Unter-Tabs (SPEC-022 F10) */
          <MeView
            currentUser={currentUser}
            activeGymId={activeGymId}
            roleInfo={roleInfo}
            onSwitchMode={handleSelectMode}
            onProfileUpdated={(newNickname, newAvatar) => {
              if (climberId) {
                setClimberNicknames(prev => ({
                  ...prev,
                  [climberId]: newNickname
                }));
              }
              if (authSession && authSession.id === climberId) {
                const updated = {
                  ...authSession,
                  nickname: newNickname,
                  avatarUrl: newAvatar || authSession.avatarUrl,
                };
                setAuthSession(updated);
                setSessionUser(updated);
              }
            }}
            onLogout={() => {
              signOut();
              setAuthSession(null);
              setClimberId(null);
              setActiveTab('wall');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (SPEC-005 & Mobile-First Daumen-Ergonomie) */}
      {appMode === 'climber' && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      )}

      {/* Role Gateway Modal (Step 1 after login / switch) */}
      {climberId && (
        <RoleGatewayModal
          isOpen={isRoleGatewayOpen}
          nickname={currentUser.nickname}
          roleInfo={roleInfo}
          currentMode={appMode}
          onSelectMode={handleSelectMode}
          onClose={handleCloseRoleGateway}
        />
      )}

      {/* Login Modal (SPEC-000) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onUserChanged={(user) => {
          if (user) {
            setAuthSession(user);
            setClimberId(user.id);
          } else {
            setAuthSession(null);
            setClimberId(null);
          }
        }}
      />

      {/* SPEC-025: Halle wählen (Karte + Liste) */}
      <GymFinderSheet
        open={isGymFinderOpen && appMode === 'climber'}
        onClose={() => setIsGymFinderOpen(false)}
        entries={gymFinderEntries}
        activeGymId={activeGymId}
        onSelectGym={(id) => {
          setActiveGymId(id);
          setActiveTab('wall');
          refreshGyms();
        }}
      />

      {/* SPEC-022 AC-11: Toasts (Loggen · Rückgängig) */}
      <ToastHost />
    </div>
  );
};

export default App;
