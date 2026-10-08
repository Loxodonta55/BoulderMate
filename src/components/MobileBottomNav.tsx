import React from 'react';
import { Layers, BarChart3, Wrench, LogIn } from 'lucide-react';

export interface MobileBottomNavProps {
  activeTab: 'wall' | 'stats';
  onSelectTab: (tab: 'wall' | 'stats') => void;
  canAccessPrivilegedWorkspace: boolean;
  onOpenRoleGateway: () => void;
  onOpenLoginModal: () => void;
  isLoggedIn: boolean;
  nickname: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  canAccessPrivilegedWorkspace,
  onOpenRoleGateway,
  onOpenLoginModal,
  isLoggedIn,
  nickname,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bm-surface)]/95 backdrop-blur-md border-t border-[var(--bm-line)] px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl"
      data-testid="mobile-bottom-nav"
    >
      <button
        type="button"
        onClick={() => onSelectTab('wall')}
        data-testid="mobile-tab-wall"
        className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline transition ${
          activeTab === 'wall'
            ? 'text-[var(--bm-strong)] font-bold'
            : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${activeTab === 'wall' ? 'bg-[var(--bm-elevated)] text-[var(--bm-accent)]' : ''}`}>
          <Layers className="w-5 h-5" />
        </div>
        <span className="mt-0.5">Wand</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('stats')}
        data-testid="mobile-tab-stats"
        className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline transition ${
          activeTab === 'stats'
            ? 'text-[var(--bm-strong)] font-bold'
            : 'text-[var(--bm-text-2)] hover:text-[var(--bm-text)]'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${activeTab === 'stats' ? 'bg-[var(--bm-elevated)] text-[var(--bm-accent)]' : ''}`}>
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="mt-0.5">Ich</span>
      </button>

      {canAccessPrivilegedWorkspace && (
        <button
          type="button"
          onClick={onOpenRoleGateway}
          data-testid="mobile-workspace-btn"
          className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline text-[var(--bm-accent)] hover:text-[var(--bm-strong)] transition"
        >
          <div className="p-1 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)]">
            <Wrench className="w-5 h-5 text-[var(--bm-accent)]" />
          </div>
          <span className="mt-0.5">Studio</span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenLoginModal}
        data-testid="mobile-bottom-login-btn"
        className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline text-[var(--bm-text-2)] hover:text-[var(--bm-text)] transition"
        title="Konto wechseln / Anmelden"
      >
        <div className="p-1 rounded-xl bg-[var(--bm-elevated)] border border-[var(--bm-line)]">
          <LogIn className="w-5 h-5 text-[var(--bm-accent)]" />
        </div>
        <span className="mt-0.5 max-w-[55px] truncate font-bold text-[var(--bm-text)]">
          {isLoggedIn ? nickname : 'Login'}
        </span>
      </button>
    </nav>
  );
};
