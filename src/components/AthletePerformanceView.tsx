import React from 'react';
import { AthletePerformanceReport } from '../types/boulder';
import { RadarChart } from './RadarChart';
import {
  Zap,
  AlertCircle,
  Compass,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface AthletePerformanceViewProps {
  report: AthletePerformanceReport;
  onSelectBoulder?: (boulderId: string) => void;
  isPublicView?: boolean;
}

export const AthletePerformanceView: React.FC<AthletePerformanceViewProps> = ({
  report,
  onSelectBoulder,
  isPublicView = false,
}) => {
  if (!report.isUnlocked) {
    const remaining = report.minRequiredAscents - report.loggedAscentsCount;
    const progressPercent = Math.min(
      100,
      Math.round((report.loggedAscentsCount / report.minRequiredAscents) * 100)
    );

    return (
      <div className="bg-[#1a1a1a] border border-[#333333] p-6 text-center select-none my-4">
        <div className="w-12 h-12 bg-[#252525] border border-[#444444] flex items-center justify-center mx-auto mb-3 text-[#C9A96E]">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-wider text-[#F5F0E8] mb-1">
          Stil- & Performance-Profil gesperrt
        </h3>
        <p className="text-xs text-[#8B8680] max-w-sm mx-auto mb-4">
          Logge mindestens {report.minRequiredAscents} Boulder, um dein persönliches Athleten-Radar
          und deine Stärken/Schwächen-Analyse freizuschalten.
        </p>

        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-[11px] font-mono text-[#8B8680] mb-1.5">
            <span>Fortschritt</span>
            <span>
              {report.loggedAscentsCount} / {report.minRequiredAscents} Begehungen
            </span>
          </div>
          <div className="w-full h-2 bg-[#121212] border border-[#333333] overflow-hidden">
            <div
              className="h-full bg-[#C9A96E] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-[#C9A96E] mt-2">
            Noch {remaining} {remaining === 1 ? 'Begehung' : 'Begehungen'} bis zur Freischaltung
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* 1. Radar-Chart Header Section */}
      <div className="bg-[#1a1a1a] border border-[#333333] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F5F0E8] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C9A96E]" />
              Athleten-Radar
            </h3>
            <p className="text-[11px] font-mono text-[#8B8680]">
              Grad-normalisierte Auswertung ({report.loggedAscentsCount} Begehungen)
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#252525] border border-[#444444] text-[#C9A96E]">
              5-Achsen-Profil
            </span>
          </div>
        </div>

        {/* Dual Radar Chart (User vs Gym) */}
        <div className="flex flex-col items-center justify-center py-2">
          <RadarChart
            data={report.userRadar}
            referenceData={report.gymRadar}
            size={270}
            showLabels={true}
            accentColor="#C9A96E"
          />

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-[#2a2a2a] w-full text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#C9A96E]/30 border border-[#C9A96E] inline-block" />
              <span className="text-[#F5F0E8] font-bold">Deine Leistung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0 border-t-2 border-dashed border-[#8B8680] inline-block" />
              <span className="text-[#8B8680]">Hallenschnitt ({report.gymName.split(' ')[0]})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Insights: Stärke & Baustelle (Private View only) */}
      {!isPublicView && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stärken-Karte (Moos-Grün) */}
          {report.strength && (
            <div className="bg-[#1a1a1a] border-l-4 border-l-[#4A5D3A] border border-[#333333] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-[#4A5D3A]/20 border border-[#4A5D3A] text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Zap className="w-3 h-3" />
                    Größte Stärke
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {report.userRadar[report.strength.attribute]} / 5.0
                  </span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5F0E8] mb-1.5">
                  {report.strength.headline}
                </h4>
                <p className="text-xs text-[#a39e97] leading-relaxed mb-3">
                  {report.strength.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#2a2a2a] text-[11px] font-mono text-emerald-400 font-medium">
                {report.strength.metricHighlight}
              </div>
            </div>
          )}

          {/* Baustellen-Karte (Lehm-Rot) */}
          {report.weakness && (
            <div className="bg-[#1a1a1a] border-l-4 border-l-[#A0522D] border border-[#333333] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-[#A0522D]/20 border border-[#A0522D] text-rose-400 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3 h-3" />
                    Wichtigste Baustelle
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {report.userRadar[report.weakness.attribute]} / 5.0
                  </span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5F0E8] mb-1.5">
                  {report.weakness.headline}
                </h4>
                <p className="text-xs text-[#a39e97] leading-relaxed mb-3">
                  {report.weakness.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#2a2a2a] space-y-2">
                <div className="text-[11px] font-mono text-rose-400 font-medium">
                  {report.weakness.metricHighlight}
                </div>

                {/* Recommended Boulder Focus */}
                {report.weakness.recommendedBoulder && (
                  <div
                    onClick={() =>
                      report.weakness?.recommendedBoulder &&
                      onSelectBoulder?.(report.weakness.recommendedBoulder.id)
                    }
                    className="bg-[#222222] hover:bg-[#282828] border border-[#3a3a3a] p-2.5 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{
                          backgroundColor:
                            report.weakness.recommendedBoulder.gradeColorHex,
                        }}
                      />
                      <div>
                        <div className="text-xs font-bold text-[#F5F0E8] group-hover:text-[#C9A96E] transition-colors flex items-center gap-1.5">
                          <span>{report.weakness.recommendedBoulder.name}</span>
                          <span className="text-[10px] font-mono text-[#8B8680]">
                            · {report.weakness.recommendedBoulder.sectorName}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-[#8B8680]">
                          Trainingsfokus: {report.weakness.attributeLabel} (
                          {report.weakness.recommendedBoulder.attributeValue}/5)
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8B8680] group-hover:text-[#C9A96E] transition-colors" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Attribute Detail Matrix & Comparison Table */}
      <div className="bg-[#1a1a1a] border border-[#333333] p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F0E8] mb-3 flex items-center justify-between">
          <span>Stil-Aufschlüsselung (Du vs. Hallenschnitt)</span>
          <span className="text-[10px] font-mono text-[#8B8680] font-normal">
            Send-Quote / Flash-Quote
          </span>
        </h4>

        <div className="space-y-3.5">
          {report.attributeMetrics.map(m => {
            const isPositive = m.delta > 0;
            const isZero = m.delta === 0;

            return (
              <div
                key={m.key}
                className="bg-[#141414] border border-[#2a2a2a] p-3 hover:border-[#383838] transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wide text-[#F5F0E8] w-28">
                      {m.label}
                    </span>
                    <span className="text-[11px] font-mono text-[#a39e97]">
                      {m.userScore.toFixed(1)}{' '}
                      <span className="text-[#666666]">vs</span>{' '}
                      {m.gymScore.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.highestGradeTopped && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#222222] border border-[#333333] text-[#F5F0E8] flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 inline-block"
                          style={{
                            backgroundColor: m.highestGradeTopped.colorHex,
                          }}
                        />
                        Max: {m.highestGradeTopped.colorName}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                        isPositive
                          ? 'bg-[#4A5D3A]/20 border-[#4A5D3A] text-emerald-400'
                          : isZero
                          ? 'bg-[#333333] border-[#444444] text-[#8B8680]'
                          : 'bg-[#A0522D]/20 border-[#A0522D] text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${m.delta.toFixed(1)}` : m.delta.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar of Send & Flash Rate */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#202020] border border-[#2f2f2f] overflow-hidden flex">
                    <div
                      className="h-full bg-[#C9A96E] transition-all duration-300"
                      style={{ width: `${m.flashRatePercent}%` }}
                      title={`Flash-Rate: ${m.flashRatePercent}%`}
                    />
                    <div
                      className="h-full bg-[#8B8680] transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          0,
                          m.sendRatePercent - m.flashRatePercent
                        )}%`,
                      }}
                      title={`Reguläre Tops: ${Math.max(
                        0,
                        m.sendRatePercent - m.flashRatePercent
                      )}%`}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-[#8B8680] w-24 text-right">
                    {m.sendRatePercent}% Send ({m.flashRatePercent}% ⚡)
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#666666] mt-3 pt-2 border-t border-[#252525]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2 bg-[#C9A96E]" />
            <span>Flash (1. Versuch)</span>
            <span className="inline-block w-2.5 h-2 bg-[#8B8680] ml-2" />
            <span>Top (ab 2. Versuch)</span>
          </div>
          <span>Basis: Boulder mit Attribut ≥ 4</span>
        </div>
      </div>
    </div>
  );
};
