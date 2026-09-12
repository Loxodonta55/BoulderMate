import React, { useState, useEffect, useMemo } from 'react';
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
import { UserProfileView } from './components/UserProfileView';
import { getProfile } from './lib/profileService';
import { AppMode, getUserRoleInfo, UserRoleInfo } from './lib/roleService';
import { RoleGatewayModal } from './components/RoleGatewayModal';
import { LoginModal } from './components/LoginModal';
import { LandingPage } from './components/LandingPage';
import { initAuthSession, getCurrentAuthUser, signOut, setSessionUser, onAuthStateChange, AuthUser } from './lib/authService';
import { syncFromSupabase, startRealtimeSync } from './lib/syncService';
import { AppHeader } from './components/AppHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Mountain } from 'lucide-react';

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
  const [hasChosenModeForUser, setHasChosenModeForUser] = useState<Record<string, boolean>>({});

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [activeGymId, setActiveGymId] = useState<string>('gym-6a-plus');
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [climberNicknames, setClimberNicknames] = useState<Record<string, string>>({});

  const [authSession, setAuthSession] = useState<AuthUser | null>(() => initAuthSession());
  const [climberId, setClimberId] = useState<string | null>(() => authSession ? authSession.id : null);

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

    return () => {
      cleanupRealtime();
    };
  }, []);

  const refreshData = () => {
    setBoulders(getStoredBoulders());
    refreshGyms();
  };

  // Dedicated Standalone Landing Page for unauthenticated visitors
  if (!authSession) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#E8E0D4] flex flex-col font-sans">
        <LandingPage
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onQuickLogin={(user) => {
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
            if (user) {
              setAuthSession(user);
              setClimberId(user.id);
            } else {
              setAuthSession(null);
              setClimberId(null);
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
    <div className="min-h-screen bg-[#121212] text-[#E8E0D4] flex flex-col font-sans overflow-x-hidden w-full max-w-full">
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
      />

      {/* Main Content Area — Mobile-First paddings with room for bottom navigation */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-6 pb-24 md:pb-8">
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
          /* 3. Kletterer-App: Meine Statistiken (Persönlicher Bereich mit Sub-Bereichen Overall Statistik & Deep Dive) */
          <UserProfileView
            currentUser={currentUser}
            boulders={boulders}
            onDataChanged={refreshData}
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
            onNavigateToWall={() => setActiveTab('wall')}
            onOpenRoleGateway={
              (roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole)
                ? () => setIsRoleGatewayOpen(true)
                : undefined
            }
          />
        )}
      </main>

      {/* Clean, quiet Footer (SPEC-005) */}
      <footer className="border-t border-[#333333] bg-[#121212] py-5 text-center text-xs text-[#6B6358] font-mono mb-14 md:mb-0">
        <div className="flex items-center justify-center gap-1.5">
          <Mountain className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span>BOULDERMATE // SPEC-005 DESIGN SYSTEM AKTIV</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (SPEC-005 & Mobile-First Daumen-Ergonomie) */}
      {appMode === 'climber' && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          canAccessPrivilegedWorkspace={roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole}
          onOpenRoleGateway={() => setIsRoleGatewayOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          isLoggedIn={Boolean(authSession)}
          nickname={currentUser.nickname}
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
    </div>
  );
};

export default App;
