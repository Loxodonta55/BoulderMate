import React, { useState, useEffect, useMemo } from 'react';
import { Boulder, GymMemberRole, Gym } from './types/boulder';
import {
  getStoredBoulders,
  createBoulder,
} from './lib/storage';
import { SEED_CRUD_BOULDERS } from './lib/seedData';
import { LegacyLogbookView } from './components/LegacyLogbookView';
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
import { initAuthSession, getCurrentAuthUser, signOut, setSessionUser, AuthUser } from './lib/authService';
import { Mountain, Wrench, Compass, Layers, ArrowLeft, User, Building2, LogIn } from 'lucide-react';

export const AVAILABLE_CLIMBERS: { id: string; nickname: string }[] = [
  { id: 'user-boris', nickname: 'Boris (OverAdmin)' },
  { id: 'admin-6aplus', nickname: 'Admin6APlus (HallenAdmin 6aPlus)' },
  { id: 'schrauber-6aplus', nickname: 'Schrauber6aPlus (Schrauber 6aPlus)' },
  { id: 'hans-kletterer', nickname: 'HansDereinfacheKletterer (Kletterer)' },
  { id: 'admin-minimum', nickname: 'AdminMinimum (HallenAdmin Minimum)' },
  { id: 'schrauber-minimum', nickname: 'Schrauber Minimum (Schrauber Minimum)' },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wall' | 'logbook' | 'profile'>('wall');
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
  const currentClimber = climberId
    ? AVAILABLE_CLIMBERS.find(c => c.id === climberId) || { id: climberId, nickname: authSession?.nickname || 'Kletterer' }
    : null;
  const activeNickname = climberId
    ? (climberNicknames[climberId] || getProfile(climberId)?.nickname || authSession?.nickname || currentClimber?.nickname || 'Kletterer')
    : 'Gast';

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
    <div className="min-h-screen bg-[#121212] text-[#E8E0D4] flex flex-col font-sans">
      {/* Mode-Specific Headers */}
      {appMode === 'setter' ? (
        /* Dedicated Schrauber-Studio Header */
        <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Studio Brand & Gym Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                <Wrench className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-headline uppercase tracking-wider text-[#E8E0D4]">
                  Schrauber-Studio
                </span>
                {gyms.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                    <select
                      value={activeGymId}
                      onChange={(e) => setActiveGymId(e.target.value)}
                      className="bg-transparent text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5"
                      title="Aktive Boulderhalle wechseln"
                      data-testid="studio-gym-select"
                    >
                      {gyms.map(g => (
                        <option key={g.id} value={g.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Studio Header Actions */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-[#A89F91] hidden sm:inline">
                Schrauber: <strong className="text-[#E8E0D4]">{currentUser.nickname}</strong>
              </span>

              <button
                type="button"
                onClick={() => setIsRoleGatewayOpen(true)}
                className="px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] transition"
                data-testid="studio-switch-workspace-btn"
                title="Arbeitsbereich wechseln"
              >
                Bereich wechseln
              </button>

              <button
                type="button"
                onClick={() => setAppMode('climber')}
                className="px-3 py-1.5 rounded-[2px] text-xs font-headline uppercase font-bold tracking-wider bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#F5F0E8] transition flex items-center gap-1.5"
                data-testid="studio-back-to-climber-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kletterer-App</span>
              </button>
            </div>
          </div>
        </header>
      ) : appMode === 'admin' ? (
        /* Dedicated Hallen-Admin Header */
        <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Admin Brand & Gym Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                <Building2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-headline uppercase tracking-wider text-[#E8E0D4]">
                  Hallen-Administration
                </span>
                {gyms.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                    <select
                      value={activeGymId}
                      onChange={(e) => setActiveGymId(e.target.value)}
                      className="bg-transparent text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5"
                      title="Aktive Boulderhalle wechseln"
                      data-testid="admin-gym-select"
                    >
                      {gyms.map(g => (
                        <option key={g.id} value={g.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Header Actions */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-[#A89F91] hidden sm:inline">
                Admin: <strong className="text-[#E8E0D4]">{currentUser.nickname}</strong>
              </span>

              <button
                type="button"
                onClick={() => setIsRoleGatewayOpen(true)}
                className="px-2.5 py-1.5 rounded-[2px] text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] transition"
                data-testid="admin-switch-workspace-btn"
                title="Arbeitsbereich wechseln"
              >
                Bereich wechseln
              </button>

              <button
                type="button"
                onClick={() => setAppMode('climber')}
                className="px-3 py-1.5 rounded-[2px] text-xs font-headline uppercase font-bold tracking-wider bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#F5F0E8] transition flex items-center gap-1.5"
                data-testid="admin-back-to-climber-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kletterer-App</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* Sleek, Clean Climber Navigation Header (SPEC-005) */
        <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Brand & Gym Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
                <Mountain className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-headline uppercase tracking-wider text-[#E8E0D4]">BoulderMate</span>
                  {gyms.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                      <select
                        value={activeGymId}
                        onChange={(e) => setActiveGymId(e.target.value)}
                        className="bg-transparent text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5"
                        title="Aktive Boulderhalle wechseln"
                        data-testid="header-gym-select"
                      >
                        {gyms.map(g => (
                          <option key={g.id} value={g.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Focused Navigation (Kletterer-Fokus: 2 Haupt-Tabs Halle & Profil + Logbuch) */}
            <nav className="flex items-center p-0.5 rounded-none bg-[#121212] border border-[#333333]">
              <button
                type="button"
                onClick={() => setActiveTab('wall')}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
                  activeTab === 'wall'
                    ? 'bg-[#2A2A2A] text-[#F5F0E8] border-b-2 border-[#F5F0E8] font-bold'
                    : 'text-[#A89F91] hover:text-[#E8E0D4]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Wand & Sektoren</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
                  activeTab === 'profile'
                    ? 'bg-[#2A2A2A] text-[#F5F0E8] border-b-2 border-[#F5F0E8] font-bold'
                    : 'text-[#A89F91] hover:text-[#E8E0D4]'
                }`}
                data-testid="tab-profile"
              >
                <User className="w-3.5 h-3.5" />
                <span>Mein Profil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logbook')}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
                  activeTab === 'logbook'
                    ? 'bg-[#2A2A2A] text-[#F5F0E8] border-b-2 border-[#F5F0E8] font-bold'
                    : 'text-[#6B6358] hover:text-[#A89F91]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kletterer-Logbuch</span>
              </button>
            </nav>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Active Climber Switcher / Auth indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#121212] border border-[#333333] text-xs">
                <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span className="text-[#6B6358] text-[10px] uppercase font-mono hidden md:inline">Kletterer:</span>
                <select
                  value={climberId || ''}
                  onChange={e => {
                    const newId = e.target.value;
                    if (newId) {
                      setSessionUser(newId);
                      setAuthSession(getCurrentAuthUser());
                      setClimberId(newId);
                    }
                  }}
                  className="bg-transparent text-[#E8E0D4] font-mono font-bold focus:outline-none cursor-pointer text-xs"
                  title="Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch"
                >
                  {AVAILABLE_CLIMBERS.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                      {c.nickname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Login / Profile Modal Trigger (SPEC-000) */}
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1.5 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-[#A89F91] hover:text-[#E8E0D4] text-xs font-mono flex items-center gap-1.5 transition"
                title="Anmelden oder Konto verwalten (SPEC-000)"
                data-testid="login-modal-btn"
              >
                <LogIn className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span className="hidden sm:inline">{authSession ? currentUser.nickname : 'Login'}</span>
              </button>

              {/* Discreet Privileged Workspace Switcher (Only visible for setters and admins!) */}
              {(roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole) && (
                <button
                  type="button"
                  onClick={() => setIsRoleGatewayOpen(true)}
                  className="px-2.5 py-1.5 rounded-[2px] text-xs font-mono transition flex items-center gap-1.5 bg-[#2A2A2A] hover:bg-[#333333] text-[#A89F91] hover:text-[#E8E0D4] border border-[#333333]"
                  title="Arbeitsbereich wählen (Kletterer, Schrauber, Admin)"
                  data-testid="climber-switch-workspace-btn"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span className="hidden sm:inline">Bereich wechseln</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
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
        ) : activeTab === 'profile' ? (
          /* 3. Kletterer-App: Mein Profil & Statistiken */
          <UserProfileView
            currentUser={currentUser}
            onProfileUpdated={(newNickname) => {
              if (climberId) {
                setClimberNicknames(prev => ({
                  ...prev,
                  [climberId]: newNickname
                }));
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
        ) : (
          /* Feature 1: Legacy Kletterer-Logbuch & Dashboard */
          <LegacyLogbookView
            boulders={boulders}
            onDataChanged={refreshData}
          />
        )}
      </main>

      {/* Clean, quiet Footer (SPEC-005) */}
      <footer className="border-t border-[#333333] bg-[#121212] py-5 text-center text-xs text-[#6B6358] font-mono">
        <div className="flex items-center justify-center gap-1.5">
          <Mountain className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span>BOULDERMATE // SPEC-005 DESIGN SYSTEM AKTIV</span>
        </div>
      </footer>

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
