import React from 'react';
import { BoulderStats } from '../types/boulder';
import { Mountain, Zap, CheckCircle2, Crosshair, BarChart3 } from 'lucide-react';

interface Props {
  stats: BoulderStats;
}

export const BoulderStatsBar: React.FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Hardest Send */}
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)] rounded-xl shrink-0">
            <Mountain className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--bm-text-2)] font-headline">
              Hardest Send
            </div>
            <div className="text-xl font-bold text-[var(--bm-text)] font-mono leading-tight mt-0.5">
              {stats.hardestGradeFont ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[var(--bm-accent)] font-black">{stats.hardestGradeFont}</span>
                  <span className="text-xs font-medium text-[var(--bm-text-2)] font-sans">
                    ({stats.hardestGradeV})
                  </span>
                </span>
              ) : (
                <span className="text-[var(--bm-text-3)]">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Tops */}
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-success)] rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--bm-text-2)] font-headline">
              Getoppt
            </div>
            <div className="text-xl font-bold text-[var(--bm-text)] font-mono leading-tight mt-0.5">
              <span>{stats.totalTops}</span>
              <span className="text-xs text-[var(--bm-text-2)] font-sans ml-1 font-normal">
                / {stats.totalLogged}
              </span>
            </div>
          </div>
        </div>

        {/* Flash Rate */}
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-accent)] rounded-xl shrink-0">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--bm-text-2)] font-headline">
              Flash-Quote
            </div>
            <div className="text-xl font-bold text-[var(--bm-accent)] font-mono leading-tight mt-0.5">
              {stats.flashRatePercent}%
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[var(--bm-elevated)] border border-[var(--bm-line)] text-[var(--bm-danger)] rounded-xl shrink-0">
            <Crosshair className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--bm-text-2)] font-headline">
              Projekte
            </div>
            <div className="text-xl font-bold text-[var(--bm-danger)] font-mono leading-tight mt-0.5">
              {stats.totalProjects}
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution chalk board */}
      {Object.keys(stats.gradeDistribution).length > 0 && (
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--bm-text-2)] flex items-center gap-1.5 font-headline text-[11px] font-bold mr-1">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--bm-accent)]" /> Tops nach Grad:
          </span>
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[var(--bm-text)] font-mono text-xs"
            >
              <span className="font-bold">{grade}</span>
              <span className="bg-[var(--bm-elevated)] text-[var(--bm-accent)] font-semibold px-1.5 py-0.2 rounded-xl text-[10px]">
                {count}×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
