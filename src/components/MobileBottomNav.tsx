import React from 'react';
import { Layers, User } from 'lucide-react';

/**
 * SPEC-022 F11 · Untere Leiste mit genau zwei Tabs: Wand und Ich.
 * Arbeitsbereich und Abmelden liegen unter Ich → Einstellungen.
 */
export interface MobileBottomNavProps {
  activeTab: 'wall' | 'stats';
  onSelectTab: (tab: 'wall' | 'stats') => void;
}

const TABS: { id: 'wall' | 'stats'; label: string; Icon: typeof Layers; testId: string }[] = [
  { id: 'wall', label: 'Wand', Icon: Layers, testId: 'mobile-tab-wall' },
  { id: 'stats', label: 'Ich', Icon: User, testId: 'mobile-tab-stats' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bm-surface)]/95 backdrop-blur-md border-t border-[var(--bm-line)] pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-stretch"
      data-testid="mobile-bottom-nav"
    >
      {TABS.map(({ id, label, Icon, testId }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTab(id)}
            data-testid={testId}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              active ? 'text-[var(--bm-text)]' : 'text-[var(--bm-text-2)]'
            }`}
          >
            <Icon className="w-6 h-6" strokeWidth={active ? 2.25 : 1.75} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
