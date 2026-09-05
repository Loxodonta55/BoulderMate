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
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[#2A2A2A] border border-[#333333] text-[#C9A96E] rounded-none shrink-0">
            <Mountain className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#A89F91] font-headline tracking-wider uppercase">
              Hardest Send
            </div>
            <div className="text-xl font-bold text-[#E8E0D4] font-mono leading-tight mt-0.5">
              {stats.hardestGradeFont ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[#C9A96E] font-black">{stats.hardestGradeFont}</span>
                  <span className="text-xs font-medium text-[#A89F91] font-sans">
                    ({stats.hardestGradeV})
                  </span>
                </span>
              ) : (
                <span className="text-[#6B6358]">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Tops */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[#2A2A2A] border border-[#333333] text-[#4A5D3A] rounded-none shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#A89F91] font-headline tracking-wider uppercase">
              Getoppt
            </div>
            <div className="text-xl font-bold text-[#E8E0D4] font-mono leading-tight mt-0.5">
              <span>{stats.totalTops}</span>
              <span className="text-xs text-[#A89F91] font-sans ml-1 font-normal">
                / {stats.totalLogged}
              </span>
            </div>
          </div>
        </div>

        {/* Flash Rate */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[#2A2A2A] border border-[#333333] text-[#C9A96E] rounded-none shrink-0">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#A89F91] font-headline tracking-wider uppercase">
              Flash-Quote
            </div>
            <div className="text-xl font-bold text-[#C9A96E] font-mono leading-tight mt-0.5">
              {stats.flashRatePercent}%
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-4 flex items-center space-x-3.5 relative overflow-hidden group">
          <div className="p-3 bg-[#2A2A2A] border border-[#333333] text-[#A0522D] rounded-none shrink-0">
            <Crosshair className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#A89F91] font-headline tracking-wider uppercase">
              Projekte
            </div>
            <div className="text-xl font-bold text-[#A0522D] font-mono leading-tight mt-0.5">
              {stats.totalProjects}
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution chalk board */}
      {Object.keys(stats.gradeDistribution).length > 0 && (
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#A89F91] flex items-center gap-1.5 font-headline uppercase tracking-wider text-[11px] font-bold mr-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#C9A96E]" /> Tops nach Grad:
          </span>
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-[#121212] border border-[#333333] text-[#E8E0D4] font-mono text-xs"
            >
              <span className="font-bold">{grade}</span>
              <span className="bg-[#2A2A2A] text-[#C9A96E] font-semibold px-1.5 py-0.2 rounded-none text-[10px]">
                {count}×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
