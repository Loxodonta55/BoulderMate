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
        <div className="bg-[#181614] border border-[#38332e] rounded-xl p-4 flex items-center space-x-3.5 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="p-3 bg-[#24201c] border border-amber-500/30 text-amber-400 rounded-lg shrink-0">
            <Mountain className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-400 font-headline tracking-wider uppercase">
              Hardest Send
            </div>
            <div className="text-xl font-bold text-[#f4efe6] font-mono leading-tight mt-0.5">
              {stats.hardestGradeFont ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="text-amber-400 font-black">{stats.hardestGradeFont}</span>
                  <span className="text-xs font-medium text-stone-400 font-sans">
                    ({stats.hardestGradeV})
                  </span>
                </span>
              ) : (
                <span className="text-stone-600">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Tops */}
        <div className="bg-[#181614] border border-[#38332e] rounded-xl p-4 flex items-center space-x-3.5 shadow-md relative overflow-hidden group">
          <div className="p-3 bg-[#24201c] border border-stone-700 text-stone-200 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-400 font-headline tracking-wider uppercase">
              Getoppt
            </div>
            <div className="text-xl font-bold text-[#f4efe6] font-mono leading-tight mt-0.5">
              <span>{stats.totalTops}</span>
              <span className="text-xs text-stone-400 font-sans ml-1 font-normal">
                / {stats.totalLogged}
              </span>
            </div>
          </div>
        </div>

        {/* Flash Rate */}
        <div className="bg-[#181614] border border-[#38332e] rounded-xl p-4 flex items-center space-x-3.5 shadow-md relative overflow-hidden group">
          <div className="p-3 bg-[#24201c] border border-amber-600/40 text-amber-500 rounded-lg shrink-0">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-400 font-headline tracking-wider uppercase">
              Flash-Quote
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono leading-tight mt-0.5">
              {stats.flashRatePercent}%
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#181614] border border-[#38332e] rounded-xl p-4 flex items-center space-x-3.5 shadow-md relative overflow-hidden group">
          <div className="p-3 bg-[#24201c] border border-orange-600/40 text-orange-400 rounded-lg shrink-0">
            <Crosshair className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-stone-400 font-headline tracking-wider uppercase">
              Projekte
            </div>
            <div className="text-xl font-bold text-orange-400 font-mono leading-tight mt-0.5">
              {stats.totalProjects}
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution chalk board */}
      {Object.keys(stats.gradeDistribution).length > 0 && (
        <div className="bg-[#181614] border border-[#38332e] rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 flex items-center gap-1.5 font-headline uppercase tracking-wider text-[11px] font-bold mr-1">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Tops nach Grad:
          </span>
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#24201c] border border-[#443e38] text-stone-200 font-mono text-xs shadow-inner"
            >
              <span className="font-bold">{grade}</span>
              <span className="bg-amber-500/20 text-amber-400 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                {count}×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
