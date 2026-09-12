import React from 'react';
import { Gym, GymMemberRole } from '../types/boulder';
import { AppMode, UserRoleInfo } from '../lib/roleService';
import { Mountain, Wrench, BarChart3, Layers, ArrowLeft, User, Building2, LogIn } from 'lucide-react';

export interface AppHeaderProps {
  appMode: AppMode;
  gyms: Gym[];
  activeGymId: string;
  onSelectGym: (id: string) => void;
  currentUser: {
    id: string;
    nickname: string;
    role: GymMemberRole;
    isPlatformAdmin: boolean;
  };
  climberId: string | null;
  selectableClimbers: { id: string; nickname: string }[];
  onSelectClimber: (id: string) => void;
  activeTab: 'wall' | 'stats';
  onSelectTab: (tab: 'wall' | 'stats') => void;
  roleInfo: UserRoleInfo;
  isLoggedIn: boolean;
  onOpenRoleGateway: () => void;
  onOpenLoginModal: () => void;
  onSwitchToClimber: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  appMode,
  gyms,
  activeGymId,
  onSelectGym,
  currentUser,
  climberId,
  selectableClimbers,
  onSelectClimber,
  activeTab,
  onSelectTab,
  roleInfo,
  isLoggedIn,
  onOpenRoleGateway,
  onOpenLoginModal,
  onSwitchToClimber,
}) => {
  if (appMode === 'setter') {
    return (
      <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Studio Brand & Gym Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] shrink-0">
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-base font-headline uppercase tracking-wider text-[#E8E0D4] shrink-0">
                <span className="inline sm:hidden">Studio</span>
                <span className="hidden sm:inline">Schrauber-Studio</span>
              </span>
              {gyms.length > 0 && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                  <select
                    value={activeGymId}
                    onChange={(e) => onSelectGym(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5 max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] truncate min-w-0"
                    title="Aktive Boulderhalle wechseln"
                    data-testid="studio-gym-select"
                  >
                    {gyms.map((g) => (
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span className="text-[11px] font-mono text-[#A89F91] hidden md:inline">
              Schrauber: <strong className="text-[#E8E0D4]">{currentUser.nickname}</strong>
            </span>

            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-[2px] text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] transition flex items-center gap-1"
              data-testid="studio-switch-workspace-btn"
              title="Arbeitsbereich wechseln"
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A96E]" />
              <span className="hidden xs:inline">Bereich</span>
              <span className="hidden sm:inline"> wechseln</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToClimber}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-[2px] text-xs font-headline uppercase font-bold tracking-wider bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#F5F0E8] transition flex items-center gap-1"
              data-testid="studio-back-to-climber-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Kletterer-App</span>
              <span className="inline xs:hidden">Wand</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  if (appMode === 'admin') {
    return (
      <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Admin Brand & Gym Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-base font-headline uppercase tracking-wider text-[#E8E0D4] shrink-0">
                <span className="inline sm:hidden">Admin</span>
                <span className="hidden sm:inline">Hallen-Administration</span>
              </span>
              {gyms.length > 0 && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                  <select
                    value={activeGymId}
                    onChange={(e) => onSelectGym(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5 max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] truncate min-w-0"
                    title="Aktive Boulderhalle wechseln"
                    data-testid="admin-gym-select"
                  >
                    {gyms.map((g) => (
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span className="text-[11px] font-mono text-[#A89F91] hidden md:inline">
              Admin: <strong className="text-[#E8E0D4]">{currentUser.nickname}</strong>
            </span>

            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-[2px] text-xs font-mono text-[#A89F91] hover:text-[#E8E0D4] bg-[#2A2A2A] hover:bg-[#333333] border border-[#333333] transition flex items-center gap-1"
              data-testid="admin-switch-workspace-btn"
              title="Arbeitsbereich wechseln"
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A96E]" />
              <span className="hidden xs:inline">Bereich</span>
              <span className="hidden sm:inline"> wechseln</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToClimber}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-[2px] text-xs font-headline uppercase font-bold tracking-wider bg-[#2A2A2A] hover:bg-[#333333] text-[#E8E0D4] border border-[#333333] hover:border-[#F5F0E8] transition flex items-center gap-1"
              data-testid="admin-back-to-climber-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Kletterer-App</span>
              <span className="inline xs:hidden">Wand</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Climber Header (SPEC-005)
  return (
    <header className="border-b border-[#333333] bg-[#1E1E1E] sticky top-0 z-40 w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Brand & Gym Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[2px] bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#C9A96E] shrink-0">
            <Mountain className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xs sm:text-base font-headline uppercase tracking-wider text-[#E8E0D4] shrink-0">
              BoulderMate
            </span>
            {gyms.length > 0 && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[10px] font-mono text-[#6B6358] hidden sm:inline">•</span>
                <select
                  value={activeGymId}
                  onChange={(e) => onSelectGym(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs font-mono font-semibold text-[#A89F91] hover:text-[#E8E0D4] focus:outline-none cursor-pointer border-b border-dashed border-[#333333] pb-0.5 max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] truncate min-w-0"
                  title="Aktive Boulderhalle wechseln"
                  data-testid="header-gym-select"
                >
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Primary Focused Navigation */}
        <nav className="hidden md:flex items-center p-0.5 rounded-none bg-[#121212] border border-[#333333] shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('wall')}
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
            onClick={() => onSelectTab('stats')}
            className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider flex items-center gap-1.5 transition ${
              activeTab === 'stats'
                ? 'bg-[#2A2A2A] text-[#F5F0E8] border-b-2 border-[#F5F0E8] font-bold'
                : 'text-[#A89F91] hover:text-[#E8E0D4]'
            }`}
            data-testid="tab-stats"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>Meine Statistiken</span>
          </button>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Climber Switcher / Auth indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#121212] border border-[#333333] text-xs">
            <User className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span className="text-[#6B6358] text-[10px] uppercase font-mono hidden md:inline">Kletterer:</span>
            <select
              value={climberId || ''}
              onChange={(e) => onSelectClimber(e.target.value)}
              className="bg-transparent text-[#E8E0D4] font-mono font-bold focus:outline-none cursor-pointer text-xs max-w-[120px] truncate"
              title="Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch"
            >
              {selectableClimbers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1E1E1E] text-[#E8E0D4]">
                  {c.nickname}
                </option>
              ))}
            </select>
          </div>

          {/* Login / Profile Modal Trigger (SPEC-000) */}
          <button
            type="button"
            onClick={onOpenLoginModal}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-[2px] bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F5F0E8] text-[#A89F91] hover:text-[#E8E0D4] text-xs font-mono flex items-center gap-1 sm:gap-1.5 transition shrink-0"
            title="Anmelden oder Konto verwalten (SPEC-000)"
            data-testid="login-modal-btn"
          >
            <LogIn className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <span className="text-[11px] sm:text-xs max-w-[65px] xs:max-w-[90px] sm:max-w-none truncate font-bold sm:font-normal">
              {isLoggedIn ? currentUser.nickname : 'Login'}
            </span>
          </button>

          {/* Discreet Privileged Workspace Switcher */}
          {(roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole) && (
            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-[2px] text-xs font-mono transition flex items-center gap-1 bg-[#2A2A2A] hover:bg-[#333333] text-[#A89F91] hover:text-[#E8E0D4] border border-[#333333] shrink-0"
              title="Arbeitsbereich wählen (Kletterer, Schrauber, Admin)"
              data-testid="climber-switch-workspace-btn"
            >
              <Wrench className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
              <span className="hidden xs:inline">Bereich</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
