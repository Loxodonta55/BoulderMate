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
import { WallPhotoCanvas } from './WallPhotoCanvas';
import {
  Layers,
  Zap,
  Trophy,
  Clock,
  Star,
  Info,
  ChevronRight,
  Building2,
  Sparkles,
  Flame,
  ArrowUpDown,
  Filter,
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
    gradeScales,
    scaleMap,
    setSelectedSectorId,
    handleGymChange,
  } = useGymSectorData(activeGymId, onSelectGym);

  const [boulders, setBoulders] = useState<WallBoulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  type RatingFilter = 'all' | 'top_rated' | 'popular' | 'projects';
  const [filterMode, setFilterMode] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'name_asc'>('rating_desc');

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

  // Filter & Sort Boulders (AC-10 & AC-11)
  const processedBoulders = useMemo(() => {
    let list = [...boulders];

    if (filterMode === 'top_rated') {
      list = list.filter(b => {
        const stats = statsMap.get(b.id);
        return stats && stats.avgStars >= 4.0;
      });
    } else if (filterMode === 'popular') {
      list = list.filter(b => {
        const stats = statsMap.get(b.id);
        return stats && (stats.totalTops + stats.totalFlashes) >= 2;
      });
    } else if (filterMode === 'projects') {
      list = list.filter(b => {
        const ascent = userAscentMap.get(b.id);
        return ascent?.type === 'project';
      });
    }

    list.sort((a, b) => {
      const statsA = statsMap.get(a.id);
      const statsB = statsMap.get(b.id);
      if (sortBy === 'rating_desc') {
        const starsA = statsA?.avgStars || 0;
        const starsB = statsB?.avgStars || 0;
        if (starsB !== starsA) return starsB - starsA;
        return (statsB?.totalRatings || 0) - (statsA?.totalRatings || 0);
      } else if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return list;
  }, [boulders, filterMode, sortBy, statsMap, userAscentMap]);

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
          <div className="space-y-3">
            {/* Quick-Filter Pills (AC-10 & AC-11) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1E1E1E] border border-[#333333]">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] font-mono text-[#6B6358] uppercase mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Filter:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-none transition flex items-center gap-1.5 ${
                    filterMode === 'all'
                      ? 'bg-[#F5F0E8] text-[#121212] border-[#F5F0E8]'
                      : 'bg-[#121212] text-[#A89F91] hover:text-[#E8E0D4] border-[#333333]'
                  }`}
                >
                  <span>Alle ({boulders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('top_rated')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-none transition flex items-center gap-1.5 ${
                    filterMode === 'top_rated'
                      ? 'bg-[#C9A96E] text-[#121212] border-[#C9A96E] font-bold shadow-sm'
                      : 'bg-[#121212] text-[#C9A96E] hover:bg-[#2A2A2A] border-[#333333]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>★ Top-Bewertet (≥ 4.0)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('popular')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-none transition flex items-center gap-1.5 ${
                    filterMode === 'popular'
                      ? 'bg-[#C9A96E] text-[#121212] border-[#C9A96E] font-bold shadow-sm'
                      : 'bg-[#121212] text-[#A89F91] hover:text-[#E8E0D4] border-[#333333]'
                  }`}
                >
                  <Flame className="w-3 h-3 text-[#A0522D]" />
                  <span>Beliebt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('projects')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-none transition flex items-center gap-1.5 ${
                    filterMode === 'projects'
                      ? 'bg-[#F5F0E8] text-[#121212] border-[#F5F0E8] font-bold'
                      : 'bg-[#121212] text-[#A89F91] hover:text-[#E8E0D4] border-[#333333]'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Meine Projekte</span>
                </button>
              </div>

              {filterMode !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-[11px] font-mono text-[#A89F91] hover:text-[#C9A96E] underline cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#A89F91]">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>Tippe auf einen Pin im Foto für Detailansicht, Bewertungen & Logging</span>
              </span>
              <span className="font-semibold text-[#E8E0D4]">
                {filterMode === 'all'
                  ? `${boulders.length} ${boulders.length === 1 ? 'aktiver Boulder' : 'aktive Boulder'}`
                  : `${processedBoulders.length} von ${boulders.length} Bouldern`}
              </span>
            </div>

            <WallPhotoCanvas
              mode="climber"
              photoUrl={selectedSector.wallPhotoUrl}
              sectorName={selectedSector.name}
              boulders={boulders}
              gradeScales={gradeScales}
              filterMode={filterMode}
              filteredBoulderIds={new Set(processedBoulders.map(p => p.id))}
              statsMap={statsMap}
              userAscentMap={userAscentMap}
              onPinClick={setSelectedBoulder}
            />
          </div>

          {/* Boulder Route List in this Sector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <h3 className="text-base font-headline font-bold uppercase tracking-wider text-[#E8E0D4] flex items-center gap-2">
                <span>Routen in {selectedSector.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-none bg-[#2A2A2A] text-[#A89F91] font-mono font-semibold border border-[#333333]">
                  {processedBoulders.length} {filterMode !== 'all' ? `/ ${boulders.length}` : ''}
                </span>
              </h3>

              {/* Sort selector (AC-11) */}
              <div className="flex items-center gap-2 text-xs font-mono text-[#A89F91]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span className="text-[11px] uppercase text-[#6B6358]">Sortierung:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'rating_desc' | 'name_asc')}
                  className="bg-[#121212] border border-[#333333] text-[#E8E0D4] text-xs font-mono rounded-none px-2.5 py-1 focus:outline-none focus:border-[#C9A96E]"
                >
                  <option value="rating_desc">Beste Bewertung ↓</option>
                  <option value="name_asc">Name (A–Z)</option>
                </select>
              </div>
            </div>

            {processedBoulders.length === 0 ? (
              <div className="p-8 text-center bg-[#1E1E1E] border border-[#333333] text-sm font-mono text-[#A89F91]">
                Keine Boulder gefunden für den aktuellen Filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {processedBoulders.map(boulder => {
                  const scale = scaleMap.get(boulder.gradeScaleId);
                  const userAscent = userAscentMap.get(boulder.id);
                  const stats = statsMap.get(boulder.id) || {
                    avgStars: 0,
                    totalRatings: 0,
                    totalTops: 0,
                    totalFlashes: 0,
                    topsCount: 0,
                    flashesCount: 0,
                    projectsCount: 0,
                    gradeFeelPercentages: { soft: 0, fair: 0, stiff: 0 }
                  };
                  const isFavorite = stats.avgStars >= 4.2 && stats.totalRatings >= 1;

                  return (
                    <div
                      key={boulder.id}
                      onClick={() => setSelectedBoulder(boulder)}
                      className={`p-4 rounded-none bg-[#1E1E1E] border transition cursor-pointer flex flex-col justify-between group ${
                        isFavorite ? 'border-[#C9A96E]/50 hover:border-[#C9A96E]' : 'border-[#333333] hover:border-[#8B8680]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Badge outside wall photo: square 0px */}
                            <div
                              className="w-5 h-5 rounded-none border border-black/40 shrink-0"
                              style={{ backgroundColor: scale?.colorHex || '#F5F0E8' }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-headline font-bold uppercase tracking-wider text-[#E8E0D4] group-hover:text-[#F5F0E8] transition truncate">
                                {boulder.name || `${scale?.colorName || 'Boulder'} Problem`}
                              </h4>
                              <span className="text-[11px] font-mono text-[#A89F91]">
                                {scale?.difficultyLabel} • Fb {scale?.fontRangeMin} - {scale?.fontRangeMax}
                              </span>
                            </div>
                          </div>

                          {/* Top-Right Badges: Rating & Ascent Status */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Compact Rating Tag (AC-10 & AC-11) */}
                            {stats.totalRatings > 0 && (
                              <span
                                className={`px-2 py-0.5 rounded-none text-[10px] font-mono font-bold flex items-center gap-1 border ${
                                  isFavorite
                                    ? 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/40'
                                    : 'bg-[#2A2A2A] text-[#E8E0D4] border-[#333333]'
                                }`}
                                title={`${stats.avgStars.toFixed(1)} Sterne (${stats.totalRatings} Wertungen)`}
                              >
                                <Star className="w-2.5 h-2.5 fill-current text-[#C9A96E]" />
                                <span>{stats.avgStars.toFixed(1)}</span>
                                {isFavorite && <Sparkles className="w-2.5 h-2.5 text-[#C9A96E]" />}
                              </span>
                            )}

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
                            ({stats.totalRatings} {stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'})
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
            )}
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
