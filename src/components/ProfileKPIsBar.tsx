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
      <div className="p-4 rounded-none bg-[#1E1E1E] border border-[#333333] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A89F91] mb-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Tops gesamt</span>
          <Trophy className="w-4 h-4 text-[#86A369]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-bold text-[#E8E0D4]" data-testid="kpi-total-tops">
            {kpis.totalTops}
          </span>
          <span className="text-xs font-mono text-[#6B6358]">Routen</span>
        </div>
        <span className="text-[10px] font-mono text-[#6B6358] mt-1">inkl. aller Flashes</span>
      </div>

      {/* 2. Total Flashes */}
      <div className="p-4 rounded-none bg-[#1E1E1E] border border-[#333333] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A89F91] mb-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Flashes</span>
          <Zap className="w-4 h-4 text-[#C9A96E] fill-[#C9A96E]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-bold text-[#C9A96E]" data-testid="kpi-total-flashes">
            {kpis.totalFlashes}
          </span>
          <span className="text-xs font-mono text-[#6B6358]">im 1. Versuch</span>
        </div>
        <span className="text-[10px] font-mono text-[#6B6358] mt-1">
          {kpis.totalTops > 0 ? `${Math.round((kpis.totalFlashes / kpis.totalTops) * 100)}% Flash-Quote` : 'Noch keine Tops'}
        </span>
      </div>

      {/* 3. Bester Top */}
      <div className="p-4 rounded-none bg-[#1E1E1E] border border-[#333333] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A89F91] mb-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Bester Top</span>
          <Award className="w-4 h-4 text-[#C9A96E]" />
        </div>
        <div className="flex items-center gap-2" data-testid="kpi-best-top">
          {kpis.bestTop ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-none border border-black/40 shrink-0"
                style={{ backgroundColor: kpis.bestTop.colorHex }}
              />
              <div className="truncate">
                <span className="text-base font-headline uppercase font-bold text-[#E8E0D4] block truncate">
                  {kpis.bestTop.colorName}
                </span>
                <span className="text-[10px] font-mono text-[#A89F91] block">
                  {kpis.bestTop.difficultyLabel} {kpis.bestTop.fontRangeMax ? `(Fb ${kpis.bestTop.fontRangeMax})` : ''}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-mono font-bold text-[#6B6358]">–</span>
          )}
        </div>
        <span className="text-[10px] font-mono text-[#6B6358] mt-1">Höchstes Farbband</span>
      </div>

      {/* 4. Bester Flash */}
      <div className="p-4 rounded-none bg-[#1E1E1E] border border-[#333333] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#A89F91] mb-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider">Bester Flash</span>
          <Flame className="w-4 h-4 text-[#C9A96E]" />
        </div>
        <div className="flex items-center gap-2" data-testid="kpi-best-flash">
          {kpis.bestFlash ? (
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-none border border-black/40 shrink-0"
                style={{ backgroundColor: kpis.bestFlash.colorHex }}
              />
              <div className="truncate">
                <span className="text-base font-headline uppercase font-bold text-[#E8E0D4] block truncate">
                  {kpis.bestFlash.colorName}
                </span>
                <span className="text-[10px] font-mono text-[#A89F91] block">
                  {kpis.bestFlash.difficultyLabel} {kpis.bestFlash.fontRangeMax ? `(Fb ${kpis.bestFlash.fontRangeMax})` : ''}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-2xl font-mono font-bold text-[#6B6358]">–</span>
          )}
        </div>
        <span className="text-[10px] font-mono text-[#6B6358] mt-1">Geflashtes Maximum</span>
      </div>
    </div>
  );
};
