import React, { useState, useEffect } from 'react';
import {
  Gym,
  Sector,
  GymGradeScale,
  WallBoulder,
  CurrentUser
} from '../types/boulder';
import {
  getGyms,
  getSectors,
  getGradeScales,
  getWallBoulders
} from '../lib/batchBoulderService';
import {
  getUserAscent,
  getRatings,
  getAscents,
  computeBoulderStatsAggregate
} from '../lib/ratingAndAscentService';
import { BoulderDetailModal } from './BoulderDetailModal';
import {
  Layers,
  Zap,
  Trophy,
  Clock,
  Star,
  Info,
  ChevronRight
} from 'lucide-react';

interface ClimberSectorViewProps {
  currentUser: CurrentUser;
}

export const ClimberSectorView: React.FC<ClimberSectorViewProps> = ({ currentUser }) => {
  const [gym, setGym] = useState<Gym | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [gradeScales, setGradeScales] = useState<GymGradeScale[]>([]);
  const [boulders, setBoulders] = useState<WallBoulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Load initial gym & sectors
  useEffect(() => {
    const gyms = getGyms();
    if (gyms.length > 0) {
      const currentGym = gyms[0];
      setGym(currentGym);
      const gymSectors = getSectors(currentGym.id);
      setSectors(gymSectors);
      if (gymSectors.length > 0) {
        setSelectedSectorId(gymSectors[0].id);
      }
      const scales = getGradeScales(currentGym.id);
      setGradeScales(scales);
    }
  }, []);

  // Reload boulders when sector changes or data updates
  useEffect(() => {
    if (selectedSectorId) {
      // Only active (published) boulders for climbers
      const allBoulders = getWallBoulders(selectedSectorId);
      const activeBoulders = allBoulders.filter(b => b.status === 'active');
      setBoulders(activeBoulders);
    }
  }, [selectedSectorId, dataVersion]);

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || null;
  const scaleMap = new Map<string, GymGradeScale>();
  gradeScales.forEach(s => scaleMap.set(s.id, s));

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
      <div className="bg-[#181614] border border-[#38332e] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#d97706] uppercase tracking-widest mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{gym?.name || 'Boulderhalle'}</span>
          </div>
          <h2 className="text-lg font-headline uppercase tracking-wider text-[#f4efe6]">Sektoren & Wandansicht</h2>
        </div>

        {/* Sector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {sectors.map(sector => {
            const isSelected = sector.id === selectedSectorId;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setSelectedSectorId(sector.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-headline uppercase tracking-wider transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#d97706] text-[#121110] font-bold shadow'
                    : 'bg-[#221f1c] text-[#a89f91] hover:text-[#f4efe6] border border-[#38332e]'
                }`}
              >
                <span>{sector.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSector && (
        <>
          {/* Wall Photo Canvas with Interactive Pins (AC-1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#a89f91]">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Tippe auf einen Pin im Foto für Detailansicht, Bewertungen & Logging</span>
              </span>
              <span className="font-semibold text-[#f4efe6]">
                {boulders.length} {boulders.length === 1 ? 'aktiver Boulder' : 'aktive Boulder'}
              </span>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden topo-plate border border-[#38332e] shadow-2xl">
              <div className="relative w-full max-h-[600px] overflow-hidden flex items-center justify-center bg-black/40">
                <img
                  src={selectedSector.wallPhotoUrl}
                  alt={selectedSector.name}
                  className="w-full h-auto object-cover max-h-[600px] block select-none pointer-events-none"
                />

                {/* Pin Overlay (AC-1) */}
                {boulders.map(boulder => {
                  const scale = scaleMap.get(boulder.gradeScaleId);
                  const userAscent = getUserAscent(currentUser.id, boulder.id);
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
                        style={{ backgroundColor: scale?.colorHex || '#f59e0b' }}
                      />

                      {/* Main Pin Disc */}
                      <div
                        className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#121110] shadow-xl flex items-center justify-center transition-all group-hover:ring-4 group-hover:ring-[#f4efe6]/30"
                        style={{ backgroundColor: scale?.colorHex || '#f59e0b' }}
                      >
                        {/* Status Icon Indicator */}
                        {isFlash && <Zap className="w-4 h-4 text-[#121110] fill-[#121110]" />}
                        {isTop && !isFlash && <Trophy className="w-3.5 h-3.5 text-[#121110]" />}
                        {isProject && <Clock className="w-3.5 h-3.5 text-[#121110]" />}
                        {!userAscent && (
                          <span className="text-[11px] font-headline font-bold text-[#121110] drop-shadow">
                            {scale?.colorName?.[0] || '●'}
                          </span>
                        )}
                      </div>

                      {/* Pin Label Tag */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md bg-[#181614] border border-[#38332e] text-[10px] font-mono font-bold text-[#f4efe6] whitespace-nowrap opacity-90 group-hover:opacity-100 shadow-md">
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
            <h3 className="text-base font-headline uppercase tracking-wider text-[#f4efe6] px-1 flex items-center gap-2">
              <span>Routen in {selectedSector.name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#221f1c] text-[#a89f91] font-mono font-semibold border border-[#38332e]">
                {boulders.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boulders.map(boulder => {
                const scale = scaleMap.get(boulder.gradeScaleId);
                const userAscent = getUserAscent(currentUser.id, boulder.id);
                const ratings = getRatings(boulder.id);
                const ascents = getAscents(boulder.id);
                const stats = computeBoulderStatsAggregate(boulder, ratings, ascents);

                return (
                  <div
                    key={boulder.id}
                    onClick={() => setSelectedBoulder(boulder)}
                    className="p-4 rounded-xl bg-[#181614] border border-[#38332e] hover:border-[#d97706] transition cursor-pointer flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-black/30 shadow-sm shrink-0"
                            style={{ backgroundColor: scale?.colorHex || '#f59e0b' }}
                          />
                          <div>
                            <h4 className="text-sm font-headline uppercase tracking-wider text-[#f4efe6] group-hover:text-[#f59e0b] transition">
                              {boulder.name || `${scale?.colorName || 'Boulder'} Problem`}
                            </h4>
                            <span className="text-[11px] font-mono text-[#a89f91]">
                              {scale?.difficultyLabel} • Fb {scale?.fontRangeMin} - {scale?.fontRangeMax}
                            </span>
                          </div>
                        </div>

                        {/* Ascent Badge */}
                        {userAscent?.type === 'flash' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#221f1c] text-[#f59e0b] border border-[#d97706]/40 flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-[#f59e0b]" />
                            <span>Flash</span>
                          </span>
                        )}
                        {userAscent?.type === 'top' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#221f1c] text-emerald-400 border border-emerald-600/40 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            <span>Top</span>
                          </span>
                        )}
                        {userAscent?.type === 'project' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#221f1c] text-sky-400 border border-sky-600/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Projekt</span>
                          </span>
                        )}
                      </div>

                      {boulder.notes && (
                        <p className="text-xs font-mono text-[#a89f91] line-clamp-2 my-2 italic">
                          "{boulder.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer KPI of Route Card */}
                    <div className="pt-3 mt-2 border-t border-[#38332e] flex items-center justify-between text-xs font-mono text-[#a89f91]">
                      <div className="flex items-center gap-1 text-[#f59e0b] font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#f59e0b]" />
                        <span>{stats.avgStars > 0 ? stats.avgStars.toFixed(1) : '–'}</span>
                        <span className="text-[10px] text-[#78716c] font-normal">
                          ({stats.totalRatings})
                        </span>
                      </div>

                      <span className="text-[11px] text-[#d4cdc3] flex items-center gap-1 group-hover:text-[#f59e0b] transition font-semibold">
                        <span>Details & Log</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#d97706]" />
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
