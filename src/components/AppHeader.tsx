import React from 'react';
import { Gym, GymMemberRole } from '../types/boulder';
import { AppMode, UserRoleInfo } from '../lib/roleService';
import { Mountain, Wrench, Layers, ArrowLeft, User, Building2, ChevronDown } from 'lucide-react';

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
  onOpenRoleGateway,
  onSwitchToClimber,
}) => {
  if (appMode === 'setter') {
    return (
      <header className="border-b border-[var(--bm-line)] bg-[var(--bm-surface)] sticky top-0 z-40 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Studio Brand & Gym Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center text-[var(--bm-accent)] shrink-0">
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-base font-headline text-[var(--bm-text)] shrink-0">
                <span className="inline sm:hidden">Studio</span>
                <span className="hidden sm:inline">Schrauber-Studio</span>
              </span>
              {gyms.length > 0 && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-mono text-[var(--bm-text-3)] hidden sm:inline">•</span>
                  <select
                    value={activeGymId}
                    onChange={(e) => onSelectGym(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-mono font-semibold text-[var(--bm-text-2)] hover:text-[var(--bm-text)] focus:outline-none cursor-pointer border-b border-dashed border-[var(--bm-line)] pb-0.5 max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] truncate min-w-0"
                    title="Aktive Boulderhalle wechseln"
                    data-testid="studio-gym-select"
                  >
                    {gyms.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
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
            <span className="text-[11px] font-mono text-[var(--bm-text-2)] hidden md:inline">
              Schrauber: <strong className="text-[var(--bm-text)]">{currentUser.nickname}</strong>
            </span>

            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] transition flex items-center gap-1"
              data-testid="studio-switch-workspace-btn"
              title="Arbeitsbereich wechseln"
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--bm-accent)]" />
              <span className="hidden xs:inline">Bereich</span>
              <span className="hidden sm:inline"> wechseln</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToClimber}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-headline font-bold bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] border border-[var(--bm-line)] hover:border-[var(--bm-strong)] transition flex items-center gap-1"
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
      <header className="border-b border-[var(--bm-line)] bg-[var(--bm-surface)] sticky top-0 z-40 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Admin Brand & Gym Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)] flex items-center justify-center text-[var(--bm-accent)] shrink-0">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-base font-headline text-[var(--bm-text)] shrink-0">
                <span className="inline sm:hidden">Admin</span>
                <span className="hidden sm:inline">Hallen-Administration</span>
              </span>
              {gyms.length > 0 && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-mono text-[var(--bm-text-3)] hidden sm:inline">•</span>
                  <select
                    value={activeGymId}
                    onChange={(e) => onSelectGym(e.target.value)}
                    className="bg-transparent text-[11px] sm:text-xs font-mono font-semibold text-[var(--bm-text-2)] hover:text-[var(--bm-text)] focus:outline-none cursor-pointer border-b border-dashed border-[var(--bm-line)] pb-0.5 max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] truncate min-w-0"
                    title="Aktive Boulderhalle wechseln"
                    data-testid="admin-gym-select"
                  >
                    {gyms.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
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
            <span className="text-[11px] font-mono text-[var(--bm-text-2)] hidden md:inline">
              Admin: <strong className="text-[var(--bm-text)]">{currentUser.nickname}</strong>
            </span>

            <button
              type="button"
              onClick={onOpenRoleGateway}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono text-[var(--bm-text-2)] hover:text-[var(--bm-text)] bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] transition flex items-center gap-1"
              data-testid="admin-switch-workspace-btn"
              title="Arbeitsbereich wechseln"
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--bm-accent)]" />
              <span className="hidden xs:inline">Bereich</span>
              <span className="hidden sm:inline"> wechseln</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToClimber}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-headline font-bold bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] text-[var(--bm-text)] border border-[var(--bm-line)] hover:border-[var(--bm-strong)] transition flex items-center gap-1"
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

  // Kletterer-Header (SPEC-022 F2/F12): Hallenwahl als einziges Element auf dem Handy
  const showPersonaSwitcher = import.meta.env.DEV;
  return (
    <header className="bg-[var(--bm-surface)]/95 backdrop-blur-md sticky top-0 z-40 w-full overflow-hidden" data-testid="climber-header">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-4 w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[var(--bm-elevated)] flex items-center justify-center text-[var(--bm-text)] shrink-0" aria-hidden>
            <Mountain className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="hidden md:inline text-base font-semibold text-[var(--bm-text)] shrink-0">BoulderMate</span>
          {gyms.length > 0 && (
            <div className="relative flex items-center min-w-0">
              <select
                value={activeGymId}
                onChange={(e) => onSelectGym(e.target.value)}
                className="appearance-none bg-transparent text-[17px] font-semibold text-[var(--bm-text)] focus:outline-none cursor-pointer pr-6 min-h-[44px] truncate min-w-0 max-w-[70vw] md:max-w-[320px]"
                title="Halle wählen"
                aria-label="Halle wählen"
                data-testid="header-gym-select"
              >
                {gyms.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--bm-text-2)] absolute right-1 pointer-events-none" aria-hidden />
            </div>
          )}
        </div>

        {/* Desktop: zwei Tabs wie die untere Leiste auf dem Handy */}
        <nav className="hidden md:flex items-center p-0.5 rounded-xl bg-[var(--bm-bg)] shrink-0" aria-label="Bereiche">
          <button
            type="button"
            onClick={() => onSelectTab('wall')}
            data-testid="tab-wall"
            aria-current={activeTab === 'wall' ? 'page' : undefined}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              activeTab === 'wall' ? 'bg-[var(--bm-elevated)] text-[var(--bm-text)]' : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Wand</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('stats')}
            data-testid="tab-stats"
            aria-current={activeTab === 'stats' ? 'page' : undefined}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              activeTab === 'stats' ? 'bg-[var(--bm-elevated)] text-[var(--bm-text)]' : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ich</span>
          </button>
        </nav>

        {/* SPEC-022 F12: Schrauber/Admins wechseln oft – kompakter Knopf nur für sie, reine Kletterer sehen ihn nie */}
        {(roleInfo.canAccessSetterStudio || roleInfo.canAccessAdminConsole) && (
          <button
            type="button"
            onClick={onOpenRoleGateway}
            className="w-10 h-10 rounded-full bg-[var(--bm-elevated)] text-[var(--bm-text)] flex items-center justify-center shrink-0"
            title="Arbeitsbereich wechseln"
            aria-label="Arbeitsbereich wechseln"
            data-testid="climber-switch-workspace-btn"
          >
            <Wrench className="w-4 h-4" />
          </button>
        )}

        {/* Test-Personas wechseln: nur im Dev-Build (SPEC-020 AC-9.4) */}
        {showPersonaSwitcher && (
          <select
            value={climberId || ''}
            onChange={(e) => onSelectClimber(e.target.value)}
            className="hidden sm:block bg-transparent text-[var(--bm-text-2)] text-xs focus:outline-none cursor-pointer max-w-[140px] truncate shrink-0"
            title="Aktiven Kletterer wechseln für Multi-User-Bewertungen & Logbuch"
            data-testid="dev-persona-select"
          >
            {selectableClimbers.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
                {c.nickname}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
};
