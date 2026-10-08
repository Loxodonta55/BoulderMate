import React from 'react';
import { ProfileKPIs } from '../types/boulder';
import { Trophy, Zap, Award, Flame } from 'lucide-react';

interface ProfileKPIsBarProps {
  kpis: ProfileKPIs;
}

export const ProfileKPIsBar: React.FC<ProfileKPIsBarProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Tops (Flash + Top) */}
      <div className="p-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[var(--bm-text-2)] mb-2">
          <span className="text-[10px] font-mono font-bold">Tops gesamt</span>
          <Trophy className="w-4 h-4 text-[var(--bm-success)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-bold text-[var(--bm-text)]" data-testid="kpi-total-tops">
            {kpis.totalTops}
          </span>
        </div>
      </div>

      {/* 2. Total Flashes */}
      <div className="p-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[var(--bm-text-2)] mb-2">
          <span className="text-[10px] font-mono font-bold">Flashes</span>
          <Zap className="w-4 h-4 text-[var(--bm-accent)] fill-[var(--bm-star)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-bold text-[var(--bm-accent)]" data-testid="kpi-total-flashes">
            {kpis.totalFlashes}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--bm-text-3)] mt-1">
          {kpis.totalTops > 0 ? `${Math.round((kpis.totalFlashes / kpis.totalTops) * 100)}% Flash-Quote` : 'Noch keine Tops'}
        </span>
      </div>

      {/* 3. Bester Top */}
      <div className="p-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[var(--bm-text-2)] mb-2">
          <span className="text-[10px] font-mono font-bold">Bester Top</span>
          <Award className="w-4 h-4 text-[var(--bm-accent)]" />
        </div>
        <div className="flex items-center gap-2" data-testid="kpi-best-top">
          {kpis.bestTop ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-xl border border-black/40 shrink-0"
                style={{ backgroundColor: kpis.bestTop.colorHex }}
              />
              <div className="truncate">
                <span className="text-base font-headline font-bold text-[var(--bm-text)] block truncate">
                  {kpis.bestTopFont ? `Fb ${kpis.bestTopFont}` : kpis.bestTop.colorName}
                </span>
                <span className="text-[10px] font-mono text-[var(--bm-text-2)] block">
                  {kpis.bestTop.colorName} ({kpis.bestTop.difficultyLabel})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-mono font-bold text-[var(--bm-text-3)]">–</span>
          )}
        </div>
      </div>

      {/* 4. Bester Flash */}
      <div className="p-4 rounded-xl bg-[var(--bm-surface)] border border-[var(--bm-line)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[var(--bm-text-2)] mb-2">
          <span className="text-[10px] font-mono font-bold">Bester Flash</span>
          <Flame className="w-4 h-4 text-[var(--bm-accent)]" />
        </div>
        <div className="flex items-center gap-2" data-testid="kpi-best-flash">
          {kpis.bestFlash ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-xl border border-black/40 shrink-0"
                style={{ backgroundColor: kpis.bestFlash.colorHex }}
              />
              <div className="truncate">
                <span className="text-base font-headline font-bold text-[var(--bm-text)] block truncate">
                  {kpis.bestFlashFont ? `Fb ${kpis.bestFlashFont}` : kpis.bestFlash.colorName}
                </span>
                <span className="text-[10px] font-mono text-[var(--bm-text-2)] block">
                  {kpis.bestFlash.colorName} ({kpis.bestFlash.difficultyLabel})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-mono font-bold text-[var(--bm-text-3)]">–</span>
          )}
        </div>
      </div>
    </div>
  );
};
