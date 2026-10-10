import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { LastChanceEntry, formatPlannedWeekday } from '../lib/wallNews';

/**
 * SPEC-031 F2/F6 · Hinweis-Streifen an der Wand:
 * «5 neue Boulder seit deinem letzten Besuch» und «Letzte Chance: ‹Sektor› wird am Mo abgeschraubt».
 */
interface WallNewsBannerProps {
  newCount: number;
  lastChance: LastChanceEntry[];
  onShow: () => void;
  onDismiss: () => void;
}

export const WallNewsBanner: React.FC<WallNewsBannerProps> = ({ newCount, lastChance, onShow, onDismiss }) => {
  const firstChance = lastChance[0];
  return (
    <div
      className="rounded-2xl bg-[var(--bm-surface)] border border-[var(--bm-line)] pl-4 pr-1.5 py-2 flex items-center gap-3"
      role="status"
      data-testid="wall-news-banner"
    >
      <Sparkles className="w-5 h-5 text-[var(--bm-star)] shrink-0" aria-hidden />
      <div className="flex-1 min-w-0 space-y-0.5">
        {newCount > 0 && (
          <p className="text-[16px] font-semibold text-[var(--bm-text)]" data-testid="wall-news-count">
            {newCount === 1 ? '1 neuer Boulder' : `${newCount} neue Boulder`} seit deinem letzten Besuch
          </p>
        )}
        {firstChance && (
          <p className="text-[15px] font-semibold text-[var(--bm-warning)]" data-testid="wall-news-last-chance">
            Letzte Chance: {firstChance.sector.name} wird am {formatPlannedWeekday(firstChance.plannedFor)} abgeschraubt
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onShow}
        className="min-h-[44px] px-3.5 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] text-[15px] font-semibold shrink-0"
        data-testid="wall-news-show"
      >
        Zeigen
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--bm-text-2)] shrink-0"
        aria-label="Hinweis schließen"
        data-testid="wall-news-dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
