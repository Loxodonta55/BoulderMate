import React, { useState, useEffect, useMemo } from 'react';
import {
  WallBoulder,
  CurrentUser,
  Ascent,
  BoulderStatsAggregate
} from '../types/boulder';
import { getWallBoulders } from '../lib/batchBoulderService';
import {
  getUserAscent,
  getRatings,
  getAscents,
  computeBoulderStatsAggregate,
} from '../lib/ratingAndAscentService';
import { useGymSectorData } from '../hooks/useGymSectorData';
import { BoulderDetailModal } from './BoulderDetailModal';
import {
  Layers,
  Zap,
  Trophy,
  Clock,
  Star,
  Info,
  ChevronRight,
  Building2
} from 'lucide-react';

interface ClimberSectorViewProps {
  currentUser: CurrentUser;
  activeGymId?: string;
  onSelectGym?: (gymId: string) => void;
}

export const ClimberSectorView: React.FC<ClimberSectorViewProps> = ({
  currentUser,
  activeGymId,
  onSelectGym,
}) => {
  const {
    gyms,
    gym,
    selectedGymId,
    sectors,
    selectedSectorId,
    selectedSector,
    scaleMap,
    setSelectedSectorId,
    handleGymChange,
  } = useGymSectorData(activeGymId, onSelectGym);

  const [boulders, setBoulders] = useState<WallBoulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Reload boulders when sector changes or data updates
  useEffect(() => {
    if (selectedSectorId) {
      // Only active (published) boulders for climbers
      const allBoulders = getWallBoulders(selectedSectorId);
      const activeBoulders = allBoulders.filter(b => b.status === 'active');
      setBoulders(activeBoulders);
    } else {
      setBoulders([]);
    }
  }, [selectedSectorId, dataVersion]);

  // Pre-index ascents and stats in a single pass to eliminate N+1 read overhead
  const { userAscentMap, statsMap } = useMemo(() => {
    const userAscents = new Map<string, Ascent | null>();
    const stats = new Map<string, BoulderStatsAggregate>();

    for (const b of boulders) {
      userAscents.set(b.id, getUserAscent(currentUser.id, b.id));
      const bRatings = getRatings(b.id);
      const bAscents = getAscents(b.id);
      stats.set(b.id, computeBoulderStatsAggregate(b, bRatings, bAscents));
    }

    return { userAscentMap: userAscents, statsMap: stats };
  }, [boulders, currentUser.id, dataVersion]);

  const handleRefreshData = () => {
    setDataVersion(v => v + 1);
    if (selectedBoulder) {
      // Refresh current selected boulder object as well
      const updated = getWallBoulders(selectedSectorId).find(b => b.id === selectedBoulder.id);
      if (updated) setSelectedBoulder(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sector Selection Bar */}
      <div className="bg-[#1E1E1E] border border-[#333333] p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{gym?.name || 'Boulderhalle'}</span>
            </div>
            <h2 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4]">Sektoren & Wandansicht</h2>
          </div>

          {gyms.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#6B6358] uppercase">Halle:</span>
              <select
                value={selectedGymId}
                onChange={e => handleGymChange(e.target.value)}
                className="bg-[#121212] border border-[#333333] text-[#E8E0D4] text-xs font-mono rounded-none px-2.5 py-1 focus:outline-none focus:border-[#C9A96E]"
              >
                {gyms.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sector Tabs */}
        {sectors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {sectors.map(sector => {
              const isSelected = sector.id === selectedSectorId;
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setSelectedSectorId(sector.id)}
                  className={`px-3.5 py-1.5 rounded-[2px] text-xs font-headline uppercase tracking-wider transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#F5F0E8] text-[#121212] font-bold'
                      : 'bg-[#2A2A2A] text-[#A89F91] hover:text-[#E8E0D4] border border-[#333333]'
                  }`}
                >
                  <span>{sector.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sectors.length === 0 && (
        <div className="bg-[#1E1E1E] border border-[#333333] rounded-none p-8 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-[#C9A96E] mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-headline font-bold uppercase tracking-wider text-[#E8E0D4] mb-2">
            Keine Sektoren in "{gym?.name || 'dieser Halle'}"
          </h3>
          <p className="text-sm font-sans text-[#A89F91]">
            In dieser Boulderhalle wurden noch keine Sektoren mit Wandfotos angelegt. Sobald die Halle Sektoren und Routen erfasst hat, werden sie hier angezeigt.
          </p>
        </div>
      )}

      {selectedSector && (
        <>
          {/* Wall Photo Canvas with Interactive Pins (AC-1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#A89F91]">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Tippe auf einen Pin im Foto für Detailansicht, Bewertungen & Logging</span>
              </span>
              <span className="font-semibold text-[#E8E0D4]">
                {boulders.length} {boulders.length === 1 ? 'aktiver Boulder' : 'aktive Boulder'}
              </span>
            </div>

            <div className="relative w-full rounded-none overflow-hidden border border-[#333333]">
              <div className="relative w-full max-h-[600px] overflow-hidden flex items-center justify-center bg-black">
                <img
                  src={selectedSector.wallPhotoUrl}
                  alt={selectedSector.name}
                  className="w-full h-auto object-cover max-h-[600px] block select-none pointer-events-none"
                />

                {/* Pin Overlay (AC-1) - Pins on photo are circular (SPEC-005 sole exception) */}
                {boulders.map(boulder => {
                  const scale = scaleMap.get(boulder.gradeScaleId);
                  const userAscent = userAscentMap.get(boulder.id);
                  const isFlash = userAscent?.type === 'flash';
                  const isTop = userAscent?.type === 'top';
                  const isProject = userAscent?.type === 'project';

                  return (
                    <button
                      key={boulder.id}
                      type="button"
                      onClick={() => setSelectedBoulder(boulder)}
                      style={{
                        left: `${boulder.positionX * 100}%`,
                        top: `${boulder.positionY * 100}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none transition-transform hover:scale-125"
                      title={`${boulder.name || scale?.colorName || 'Boulder'} (Tippen für Details)`}
                    >
                      {/* Pulse Ring */}
                      <span
                        className="absolute -inset-1.5 rounded-full opacity-75 animate-ping"
                        style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                      />

                      {/* Main Pin Disc (SPEC-005: 50% circle) */}
                      <div
                        className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#121212] flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-[#F5F0E8]"
                        style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                      >
                        {/* Status Icon Indicator */}
                        {isFlash && <Zap className="w-4 h-4 text-[#121212] fill-[#121212]" />}
                        {isTop && !isFlash && <Trophy className="w-3.5 h-3.5 text-[#121212]" />}
                        {isProject && <Clock className="w-3.5 h-3.5 text-[#121212]" />}
                        {!userAscent && (
                          <span className="text-[11px] font-mono font-bold text-[#121212]">
                            {scale?.colorName?.[0] || '●'}
                          </span>
                        )}
                      </div>

                      {/* Pin Label Tag - 0px */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-none bg-[#1E1E1E] border border-[#333333] text-[10px] font-mono font-bold text-[#E8E0D4] whitespace-nowrap opacity-90 group-hover:opacity-100">
                        {boulder.name || scale?.colorName || 'Route'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Boulder Route List in this Sector */}
          <div className="space-y-3">
            <h3 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4] px-1 flex items-center gap-2">
              <span>Routen in {selectedSector.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-none bg-[#2A2A2A] text-[#A89F91] font-mono font-semibold border border-[#333333]">
                {boulders.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boulders.map(boulder => {
                const scale = scaleMap.get(boulder.gradeScaleId);
                const userAscent = userAscentMap.get(boulder.id);
                const stats = statsMap.get(boulder.id) || {
                  avgStars: 0,
                  totalRatings: 0,
                  topsCount: 0,
                  flashesCount: 0,
                  projectsCount: 0,
                  gradeFeelPercentages: { soft: 0, fair: 0, stiff: 0 }
                };

                return (
                  <div
                    key={boulder.id}
                    onClick={() => setSelectedBoulder(boulder)}
                    className="p-4 rounded-none bg-[#1E1E1E] border border-[#333333] hover:border-[#8B8680] transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          {/* Badge outside wall photo: square 0px */}
                          <div
                            className="w-5 h-5 rounded-none border border-black/40 shrink-0"
                            style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                          />
                          <div>
                            <h4 className="text-sm font-headline font-bold uppercase tracking-wider text-[#E8E0D4] group-hover:text-[#F5F0E8] transition">
                              {boulder.name || `${scale?.colorName || 'Boulder'} Problem`}
                            </h4>
                            <span className="text-[11px] font-mono text-[#A89F91]">
                              {scale?.difficultyLabel} • Fb {scale?.fontRangeMin} - {scale?.fontRangeMax}
                            </span>
                          </div>
                        </div>

                        {/* Ascent Badge */}
                        {userAscent?.type === 'flash' && (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-[#2A2A2A] text-[#C9A96E] border border-[#C9A96E]/40 flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-[#C9A96E]" />
                            <span>Flash</span>
                          </span>
                        )}
                        {userAscent?.type === 'top' && (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-[#2A2A2A] text-[#4A5D3A] border border-[#4A5D3A]/50 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[#4A5D3A]" />
                            <span>Top</span>
                          </span>
                        )}
                        {userAscent?.type === 'project' && (
                          <span className="px-2 py-0.5 rounded-none text-[10px] font-mono font-bold bg-[#2A2A2A] text-[#A89F91] border border-[#333333] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#A89F91]" />
                            <span>Projekt</span>
                          </span>
                        )}
                      </div>

                      {boulder.notes && (
                        <p className="text-xs font-mono text-[#A89F91] line-clamp-2 my-2 italic">
                          "{boulder.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer KPI of Route Card */}
                    <div className="pt-3 mt-2 border-t border-[#333333] flex items-center justify-between text-xs font-mono text-[#A89F91]">
                      <div className="flex items-center gap-1 text-[#C9A96E] font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#C9A96E]" />
                        <span>{stats.avgStars > 0 ? stats.avgStars.toFixed(1) : '–'}</span>
                        <span className="text-[10px] text-[#6B6358] font-normal">
                          ({stats.totalRatings})
                        </span>
                      </div>

                      <span className="text-[11px] text-[#E8E0D4] flex items-center gap-1 group-hover:text-[#F5F0E8] transition font-semibold">
                        <span>Details & Log</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#C9A96E]" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Boulder Detail Modal */}
      {selectedBoulder && (
        <BoulderDetailModal
          boulder={selectedBoulder}
          sector={selectedSector || undefined}
          gradeScale={scaleMap.get(selectedBoulder.gradeScaleId)}
          currentUser={currentUser}
          isOpen={Boolean(selectedBoulder)}
          onClose={() => setSelectedBoulder(null)}
          onDataChanged={handleRefreshData}
        />
      )}
    </div>
  );
};
