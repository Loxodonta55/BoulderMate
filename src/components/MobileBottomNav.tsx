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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A]/95 backdrop-blur-md border-t border-[#333333] px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl"
      data-testid="mobile-bottom-nav"
    >
      <button
        type="button"
        onClick={() => onSelectTab('wall')}
        data-testid="mobile-tab-wall"
        className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline uppercase tracking-wider transition ${
          activeTab === 'wall'
            ? 'text-[#F5F0E8] font-bold'
            : 'text-[#8B8680] hover:text-[#E8E0D4]'
        }`}
      >
        <div className={`p-1 rounded-none transition ${activeTab === 'wall' ? 'bg-[#2A2A2A] text-[#C9A96E]' : ''}`}>
          <Layers className="w-5 h-5" />
        </div>
        <span className="mt-0.5">Wand</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('stats')}
        data-testid="mobile-tab-stats"
        className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline uppercase tracking-wider transition ${
          activeTab === 'stats'
            ? 'text-[#F5F0E8] font-bold'
            : 'text-[#8B8680] hover:text-[#E8E0D4]'
        }`}
      >
        <div className={`p-1 rounded-none transition ${activeTab === 'stats' ? 'bg-[#2A2A2A] text-[#C9A96E]' : ''}`}>
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className="mt-0.5">Statistiken</span>
      </button>

      {canAccessPrivilegedWorkspace && (
        <button
          type="button"
          onClick={onOpenRoleGateway}
          data-testid="mobile-workspace-btn"
          className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline uppercase tracking-wider text-[#C9A96E] hover:text-[#F5F0E8] transition"
        >
          <div className="p-1 rounded-none bg-[#2A2A2A] border border-[#333333]">
            <Wrench className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <span className="mt-0.5">Studio</span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenLoginModal}
        data-testid="mobile-bottom-login-btn"
        className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-headline uppercase tracking-wider text-[#8B8680] hover:text-[#E8E0D4] transition"
        title="Konto wechseln / Anmelden"
      >
        <div className="p-1 rounded-none bg-[#2A2A2A] border border-[#333333]">
          <LogIn className="w-5 h-5 text-[#C9A96E]" />
        </div>
        <span className="mt-0.5 max-w-[55px] truncate font-bold text-[#E8E0D4]">
          {isLoggedIn ? nickname : 'Login'}
        </span>
      </button>
    </nav>
  );
};
