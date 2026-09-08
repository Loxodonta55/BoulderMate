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
    <div className="p-5 rounded-none bg-[#1E1E1E] border border-[#333333] space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-headline uppercase tracking-wider text-[#E8E0D4]">
            Grad-Verteilung
          </h3>
          <p className="text-[11px] font-mono text-[#A89F91]">
            Erfolgreiche Begehungen nach Fontainebleau-Skala
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[#A89F91]">
          <span className="flex items-center gap-1 text-[#C9A96E]">
            <Zap className="w-3.5 h-3.5 fill-[#C9A96E]" /> Flash
          </span>
          <span>│</span>
          <span className="flex items-center gap-1 text-[#86A369]">
            <Trophy className="w-3.5 h-3.5" /> Top
          </span>
        </div>
      </div>

      {/* Empty State (AC-8) */}
      {totalAscents === 0 ? (
        <div className="py-8 px-4 text-center rounded-none bg-[#121212] border border-[#333333] flex flex-col items-center justify-center gap-3" data-testid="empty-distribution-state">
          <div className="w-10 h-10 rounded-none bg-[#1E1E1E] border border-[#333333] flex items-center justify-center text-[#C9A96E]">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-headline uppercase tracking-wider text-[#E8E0D4]">
              Noch keine Begehungen erfasst
            </p>
            <p className="text-xs font-mono text-[#6B6358] mt-1">
              Logge deinen ersten Boulder an der Wand, um deine persönliche Leistungsverteilung zu sehen!
            </p>
          </div>
          {onNavigateToWall && (
            <button
              type="button"
              onClick={onNavigateToWall}
              className="mt-1 px-4 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider font-bold bg-[#F5F0E8] hover:bg-[#E8E0D4] text-[#121212] transition"
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
              <div key={item.fontGrade ? `fg-${item.fontGrade}` : item.gradeScale.id} className="flex items-center gap-3 text-xs">
                {/* Grade / Color label */}
                <div className="w-28 sm:w-32 shrink-0 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-none shrink-0 border border-black/30"
                    style={{ backgroundColor: item.gradeScale.colorHex }}
                  />
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-mono font-bold text-[#E8E0D4] text-[11px] sm:text-xs">
                      {item.fontGrade ? `Fb ${item.fontGrade}` : item.gradeScale.colorName}
                    </span>
                    {item.fontGrade && item.gradeScale.colorName && (
                      <span className="text-[10px] font-mono text-[#A89F91] truncate">
                        {item.gradeScale.colorName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bar track container (0px radius) */}
                <div className="flex-1 h-6 rounded-none bg-[#121212] border border-[#333333] overflow-hidden flex items-center p-0.5 relative">
                  {item.totalCount > 0 ? (
                    <div
                      className="h-full rounded-none transition-all duration-300 flex overflow-hidden"
                      style={{ width: `${barWidthPercent}%` }}
                    >
                      {/* Flashes (Lighter section with subtle pattern) */}
                      {item.flashCount > 0 && (
                        <div
                          className="h-full flex items-center justify-center relative transition-all"
                          style={{
                            width: `${flashRatio}%`,
                            backgroundColor: item.gradeScale.colorHex,
                            filter: 'brightness(1.35) saturate(1.1)',
                          }}
                          title={`${item.flashCount} Flash(es)`}
                        >
                          <div className="absolute inset-0 bg-black/15 bg-stripes" />
                          {item.flashCount >= 2 && (
                            <span className="relative z-10 text-[9px] font-mono font-black text-black px-1 flex items-center">
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
                            <span className="text-[9px] font-mono font-black text-black px-1">
                              {item.topCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-[#6B6358] px-2">–</span>
                  )}
                </div>

                {/* Total label at end of bar */}
                <div className="w-16 sm:w-20 shrink-0 text-right font-mono text-[11px]">
                  {item.totalCount > 0 ? (
                    <span className="text-[#E8E0D4] font-bold">
                      {item.totalCount}
                      {item.flashCount > 0 && (
                        <span className="text-[#C9A96E] text-[10px] ml-1">
                          ({item.flashCount}⚡)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[#6B6358]">0</span>
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
