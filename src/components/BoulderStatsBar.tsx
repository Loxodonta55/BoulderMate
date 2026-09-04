import React from 'react';
import { BoulderStats } from '../types/boulder';
import { Trophy, Zap, CheckCircle2, CircleDashed, Award } from 'lucide-react';

interface Props {
  stats: BoulderStats;
}

export const BoulderStatsBar: React.FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Hardest Send */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm hover:border-emerald-500/40 transition-colors">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Hardest Send</div>
            <div className="text-lg font-bold text-slate-100">
              {stats.hardestGradeFont ? (
                <span>
                  {stats.hardestGradeFont}{' '}
                  <span className="text-xs font-normal text-slate-400">({stats.hardestGradeV})</span>
                </span>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Tops */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm hover:border-blue-500/40 transition-colors">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Getoppt</div>
            <div className="text-lg font-bold text-slate-100">
              {stats.totalTops} <span className="text-xs text-slate-400">/ {stats.totalLogged}</span>
            </div>
          </div>
        </div>

        {/* Flash Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm hover:border-amber-500/40 transition-colors">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Flash-Quote</div>
            <div className="text-lg font-bold text-slate-100">
              {stats.flashRatePercent}%
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm hover:border-orange-500/40 transition-colors">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
            <CircleDashed className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Projekte</div>
            <div className="text-lg font-bold text-slate-100">
              {stats.totalProjects}
            </div>
          </div>
        </div>
      </div>

      {/* Grade distribution mini bar */}
      {Object.keys(stats.gradeDistribution).length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Tops nach Grad:
          </span>
          {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold"
            >
              <span>{grade}</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full text-[10px]">
                {count}×
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
