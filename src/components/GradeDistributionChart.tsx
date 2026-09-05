import React from 'react';
import { GradeDistributionItem } from '../types/boulder';
import { Zap, Trophy, Mountain } from 'lucide-react';

interface GradeDistributionChartProps {
  distribution: GradeDistributionItem[];
  onNavigateToWall?: () => void;
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  distribution,
  onNavigateToWall,
}) => {
  const totalAscents = distribution.reduce((sum, item) => sum + item.totalCount, 0);
  const maxTotal = Math.max(...distribution.map(d => d.totalCount), 1);

  return (
    <div className="p-5 rounded-2xl bg-[#181614] border border-[#38332e] shadow-sm space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6]">
            Grad-Verteilung
          </h3>
          <p className="text-[11px] font-mono text-[#a89f91]">
            Erfolgreiche Begehungen nach Hallenfarben
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#a89f91]">
          <span className="flex items-center gap-1 text-[#f59e0b]">
            <Zap className="w-3.5 h-3.5 fill-[#f59e0b]" /> Flash
          </span>
          <span>│</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Trophy className="w-3.5 h-3.5" /> Top
          </span>
        </div>
      </div>

      {/* Empty State (AC-8) */}
      {totalAscents === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-[#121110] border border-[#2a2622] flex flex-col items-center justify-center gap-3" data-testid="empty-distribution-state">
          <div className="w-12 h-12 rounded-full bg-[#221f1c] border border-[#38332e] flex items-center justify-center text-[#d97706]">
            <Mountain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-headline uppercase tracking-wider text-[#f4efe6]">
              Noch keine Begehungen erfasst
            </p>
            <p className="text-xs font-mono text-[#78716c] mt-1">
              Logge deinen ersten Boulder an der Wand, um deine persönliche Leistungsverteilung zu sehen!
            </p>
          </div>
          {onNavigateToWall && (
            <button
              type="button"
              onClick={onNavigateToWall}
              className="mt-1 px-4 py-1.5 rounded-lg text-xs font-headline uppercase tracking-wider font-bold bg-[#d97706] hover:bg-[#b45309] text-[#121110] transition shadow"
            >
              Zu den Sektoren & Wänden
            </button>
          )}
        </div>
      ) : (
        /* Stacked Horizontal Bar Chart (AC-3) */
        <div className="space-y-2.5 pt-1" data-testid="grade-distribution-bars">
          {distribution.map(item => {
            const barWidthPercent = (item.totalCount / maxTotal) * 100;
            const flashRatio = item.totalCount > 0 ? (item.flashCount / item.totalCount) * 100 : 0;
            const topRatio = item.totalCount > 0 ? (item.topCount / item.totalCount) * 100 : 0;

            return (
              <div key={item.gradeScale.id} className="flex items-center gap-3 text-xs">
                {/* Grade / Color label */}
                <div className="w-24 sm:w-28 shrink-0 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/30 shadow-sm"
                    style={{ backgroundColor: item.gradeScale.colorHex }}
                  />
                  <span className="font-mono font-bold text-[#d4cdc3] truncate text-[11px] sm:text-xs">
                    {item.gradeScale.colorName}
                  </span>
                </div>

                {/* Bar track container */}
                <div className="flex-1 h-6 rounded-md bg-[#121110] border border-[#2a2622] overflow-hidden flex items-center p-0.5 relative">
                  {item.totalCount > 0 ? (
                    <div
                      className="h-full rounded transition-all duration-500 flex overflow-hidden shadow-inner"
                      style={{ width: `${barWidthPercent}%` }}
                    >
                      {/* Flashes (Lighter section with subtle brightness & pattern) */}
                      {item.flashCount > 0 && (
                        <div
                          className="h-full flex items-center justify-center relative transition-all"
                          style={{
                            width: `${flashRatio}%`,
                            backgroundColor: item.gradeScale.colorHex,
                            filter: 'brightness(1.4) saturate(1.1)',
                          }}
                          title={`${item.flashCount} Flash(es)`}
                        >
                          <div className="absolute inset-0 bg-black/15 bg-stripes" />
                          {item.flashCount >= 2 && (
                            <span className="relative z-10 text-[9px] font-mono font-black text-black px-1 flex items-center drop-shadow-sm">
                              ⚡{item.flashCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Regular Tops (Solid section in exact gym color) */}
                      {item.topCount > 0 && (
                        <div
                          className="h-full flex items-center justify-center transition-all"
                          style={{
                            width: `${topRatio}%`,
                            backgroundColor: item.gradeScale.colorHex,
                            filter: 'brightness(0.95)',
                          }}
                          title={`${item.topCount} reguläre Top(s)`}
                        >
                          {item.topCount >= 2 && (
                            <span className="text-[9px] font-mono font-black text-black px-1 drop-shadow-sm">
                              {item.topCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-[#57534e] px-2">–</span>
                  )}
                </div>

                {/* Total label at end of bar */}
                <div className="w-16 sm:w-20 shrink-0 text-right font-mono text-[11px]">
                  {item.totalCount > 0 ? (
                    <span className="text-[#f4efe6] font-bold">
                      {item.totalCount}
                      {item.flashCount > 0 && (
                        <span className="text-[#f59e0b] text-[10px] ml-1">
                          ({item.flashCount}⚡)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[#57534e]">0</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
