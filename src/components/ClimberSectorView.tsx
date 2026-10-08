import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WallBoulder,
  CurrentUser,
  Ascent,
  BoulderStatsAggregate,
  GymGradeScale,
} from '../types/boulder';
import { getWallBoulders, isSectorInRebuild, isRecentlyNew } from '../lib/batchBoulderService';
import {
  getUserAscent,
  getRatings,
  getAscents,
  computeBoulderStatsAggregate,
} from '../lib/ratingAndAscentService';
import { useGymSectorData } from '../hooks/useGymSectorData';
import { syncFromSupabase } from '../lib/syncService';
import { BoulderDetailModal } from './BoulderDetailModal';
import { WallPhotoCanvas } from './WallPhotoCanvas';
import { useBackHandler } from '../hooks/useBackHandler';
import {
  Layers,
  Zap,
  Trophy,
  Clock,
  Star,
  Info,
  ChevronRight,
  ChevronLeft,
  Building2,
  Sparkles,
  Flame,
  ArrowUpDown,
  Maximize2,
  Minimize2,
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
    refreshGymData,
  } = useGymSectorData(activeGymId, onSelectGym);

  const [boulders, setBoulders] = useState<WallBoulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  type RatingFilter = 'all' | 'top_rated' | 'popular' | 'projects';
  const [filterMode, setFilterMode] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'name_asc'>('rating_desc');
  const [isSectorFullscreen, setIsSectorFullscreen] = useState<boolean>(false);
  const [isWallZoomed, setIsWallZoomed] = useState<boolean>(false);

  // Reset wall zoom when sector changes or fullscreen exits
  useEffect(() => {
    setIsWallZoomed(false);
  }, [selectedSectorId, isSectorFullscreen]);

  // Automatischer Non-destruktiver Live-Sync aus Supabase beim Laden der Sektoransicht
  useEffect(() => {
    let isMounted = true;
    syncFromSupabase()
      .then(synced => {
        if (synced && isMounted) {
          refreshGymData();
          setDataVersion(v => v + 1);
        }
      })
      .catch(err => {
        console.warn('[ClimberSectorView] Background auto-sync warning:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [refreshGymData]);

  // SPEC-015: Mobile-First Android Back-Button Handling
  useBackHandler({
    id: 'fullscreen-sector',
    isOpen: isSectorFullscreen,
    onBack: () => setIsSectorFullscreen(false),
  });

  useBackHandler({
    id: 'boulder-detail-modal',
    isOpen: Boolean(selectedBoulder),
    onBack: () => setSelectedBoulder(null),
  });

  const sectorTabsContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Auto-scroll active sector button into view whenever selectedSectorId changes
  useEffect(() => {
    if (!selectedSectorId || !sectorTabsContainerRef.current) return;

    const container = sectorTabsContainerRef.current;
    const activeBtn = container.querySelector<HTMLButtonElement>(`[data-sector-id="${selectedSectorId}"]`);

    if (activeBtn) {
      const behavior = isFirstRender.current ? 'auto' : 'smooth';
      isFirstRender.current = false;

      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      let targetScrollLeft = 0;

      if (containerRect.width > 0) {
        targetScrollLeft =
          container.scrollLeft +
          (btnRect.left - containerRect.left) -
          container.clientWidth / 2 +
          activeBtn.offsetWidth / 2;
      } else {
        targetScrollLeft =
          activeBtn.offsetLeft -
          container.clientWidth / 2 +
          activeBtn.offsetWidth / 2;
      }

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior,
        });
      } else {
        container.scrollLeft = Math.max(0, targetScrollLeft);
      }

      if (typeof activeBtn.scrollIntoView === 'function') {
        try {
          activeBtn.scrollIntoView({
            behavior,
            block: 'nearest',
            inline: 'center',
          });
        } catch {
          // ignore if options unsupported
        }
      }
    }
  }, [selectedSectorId, sectors]);

  // Sector indexing & swipe switching (Requirement 1 & 4, User Update: immediate sector change)
  const currentSectorIndex = useMemo(() => {
    return sectors.findIndex(s => s.id === selectedSectorId);
  }, [sectors, selectedSectorId]);

  const hasPreviousSector = sectors.length > 1;
  const hasNextSector = sectors.length > 1;

  const goToPreviousSector = () => {
    if (sectors.length <= 1) return;
    const prevIndex = currentSectorIndex > 0 ? currentSectorIndex - 1 : sectors.length - 1;
    setSelectedSectorId(sectors[prevIndex].id);
  };

  const goToNextSector = () => {
    if (sectors.length <= 1) return;
    const nextIndex = currentSectorIndex >= 0 && currentSectorIndex < sectors.length - 1 ? currentSectorIndex + 1 : 0;
    setSelectedSectorId(sectors[nextIndex].id);
  };

  // Touch Swipe Gesture Detection with Immediate Switching (onTouchMove + onTouchEnd)
  const touchStartPos = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeTriggeredRef = React.useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isWallZoomed || e.touches.length !== 1) {
      touchStartPos.current = null;
      swipeTriggeredRef.current = false;
      return;
    }
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    swipeTriggeredRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isWallZoomed || !touchStartPos.current || swipeTriggeredRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartPos.current.x;
    const deltaY = e.touches[0].clientY - touchStartPos.current.y;

    // Detect predominantly horizontal movement and immediately switch sector
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      swipeTriggeredRef.current = true;
      if (deltaX < 0) {
        // Swiped left -> Immediately go to next sector
        goToNextSector();
      } else {
        // Swiped right -> Immediately go to previous sector
        goToPreviousSector();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isWallZoomed || !touchStartPos.current || e.changedTouches.length === 0) {
      touchStartPos.current = null;
      swipeTriggeredRef.current = false;
      return;
    }

    if (!swipeTriggeredRef.current) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartPos.current.x;
      const deltaY = endY - touchStartPos.current.y;
      const duration = Date.now() - touchStartPos.current.time;
      const threshold = duration < 300 ? 25 : 35;

      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX < 0) {
          goToNextSector();
        } else {
          goToPreviousSector();
        }
      }
    }
    touchStartPos.current = null;
    swipeTriggeredRef.current = false;
  };

  // Trackpad horizontal scroll / wheel handler for fullscreen
  const wheelLockRef = React.useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    if (!isSectorFullscreen || e.ctrlKey || isWallZoomed) return;
    if (Math.abs(e.deltaX) > 35 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const now = Date.now();
      if (now - wheelLockRef.current > 300) {
        wheelLockRef.current = now;
        if (e.deltaX > 0) {
          goToNextSector();
        } else {
          goToPreviousSector();
        }
      }
    }
  };

  // Keyboard navigation when in fullscreen mode
  useEffect(() => {
    if (!isSectorFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        goToNextSector();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        goToPreviousSector();
      } else if (e.key === 'Escape') {
        setIsSectorFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSectorFullscreen, currentSectorIndex, sectors]);

  // Progressive HTML5 Fullscreen API integration for true full-screen hardware monitor usage
  useEffect(() => {
    if (isSectorFullscreen) {
      try {
        const docEl = document.documentElement;
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(() => {});
          } else if ((docEl as any).webkitRequestFullscreen) {
            (docEl as any).webkitRequestFullscreen();
          }
        }
      } catch {
        // Fullscreen API may not be permitted in some contexts
      }
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isSectorFullscreen]);

  // Sync state if user exits native fullscreen via browser controls or Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isSectorFullscreen) {
        setIsSectorFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isSectorFullscreen]);


  // Listen to cross-component boulder events (such as deletion or batch publish)
  useEffect(() => {
    const handleBouldersUpdated = () => {
      setDataVersion(v => v + 1);
      setSelectedBoulder(prev => {
        if (!prev) return null;
        const all = getWallBoulders();
        const stillExists = all.find(b => b.id === prev.id && b.status === 'active');
        return stillExists || null;
      });
    };

    window.addEventListener('bouldermate:boulders_updated', handleBouldersUpdated);
    return () => {
      window.removeEventListener('bouldermate:boulders_updated', handleBouldersUpdated);
    };
  }, []);

  // Listen to remote sector updates
  useEffect(() => {
    const handleSectorsUpdated = () => {
      refreshGymData();
    };

    window.addEventListener('bouldermate:sectors_updated', handleSectorsUpdated);
    return () => {
      window.removeEventListener('bouldermate:sectors_updated', handleSectorsUpdated);
    };
  }, [refreshGymData]);

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

  // AC-15: Echtzeit-Aktualisierung der Pins & Routenkarten bei externen Bewertungen/Begehungen
  useEffect(() => {
    const handleUpdate = () => {
      setDataVersion(v => v + 1);
    };
    window.addEventListener('bouldermate:ratings_updated', handleUpdate);
    window.addEventListener('bouldermate:ascents_updated', handleUpdate);
    window.addEventListener('bouldermate:boulders_updated', handleUpdate);
    return () => {
      window.removeEventListener('bouldermate:ratings_updated', handleUpdate);
      window.removeEventListener('bouldermate:ascents_updated', handleUpdate);
      window.removeEventListener('bouldermate:boulders_updated', handleUpdate);
    };
  }, []);

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
  // SPEC-021 AC-10: Einzelne neue Routen bekommen «Neu»; bei einer komplett neuen Wand trägt nur der Sektor das Badge
  const newBoulderIds = useMemo(() => {
    const wallRebuiltAt = isRecentlyNew(selectedSector?.rebuiltAt) ? Date.parse(selectedSector!.rebuiltAt!) : null;
    const ids = new Set<string>();
    for (const b of boulders) {
      if (!isRecentlyNew(b.publishedAt)) continue;
      if (wallRebuiltAt !== null && Math.abs(Date.parse(b.publishedAt!) - wallRebuiltAt) < 60 * 1000) continue;
      ids.add(b.id);
    }
    return ids;
  }, [boulders, selectedSector?.rebuiltAt]);

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
      // Refresh current selected boulder object or deselect if deleted
      const updated = getWallBoulders(selectedSectorId).find(b => b.id === selectedBoulder.id && b.status === 'active');
      setSelectedBoulder(updated || null);
    }
  };

  const resolveBoulderScale = (b: WallBoulder): GymGradeScale | undefined => {
    if (b.gradeScaleId && scaleMap.has(b.gradeScaleId)) {
      return scaleMap.get(b.gradeScaleId);
    }
    const query = `${b.gradeScaleId || ''} ${b.name || ''}`.toLowerCase().replace(/ß/g, 'ss');
    const matchedByName = gradeScales.find(s => {
      const norm = s.colorName.toLowerCase().trim().replace(/ß/g, 'ss');
      return query.includes(norm);
    });
    if (matchedByName) return matchedByName;

    if (b.fontGrade) {
      const matchedByFont = gradeScales.find(s => s.fontRangeMin === b.fontGrade || s.fontRangeMax === b.fontGrade);
      if (matchedByFont) return matchedByFont;
    }

    return gradeScales[0];
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Sector Selection Bar — Compact & Mobile-First */}
      <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] p-3 sm:p-4 rounded-xl space-y-3 max-w-full">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--bm-accent)] mb-0.5">
              <Layers className="w-4 h-4 text-[var(--bm-accent)] shrink-0" />
              <span className="truncate">{gym?.name || 'Boulderhalle'}</span>
            </div>
            <h2 className="text-base sm:text-xl font-headline font-bold text-[var(--bm-text)] truncate" title={selectedSector?.name || 'Wandansicht'}>
              {selectedSector?.name || 'Wandansicht'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {gyms.length > 1 && (
              <div className="flex items-center gap-1.5 bg-[var(--bm-bg)] border border-[var(--bm-line)] px-2 py-1 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-[var(--bm-accent)] shrink-0" />
                <span className="text-[10px] font-mono text-[var(--bm-text-2)] hidden md:inline">Halle:</span>
                <select
                  value={selectedGymId}
                  onChange={e => handleGymChange(e.target.value)}
                  className="bg-transparent text-[var(--bm-text)] text-xs font-mono rounded-xl focus:outline-none max-w-[120px] sm:max-w-[180px] truncate cursor-pointer"
                  title="Halle wählen"
                >
                  {gyms.map(g => (
                    <option key={g.id} value={g.id} className="bg-[var(--bm-surface)] text-[var(--bm-text)]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vollbild Button (Requirement 1) */}
            {selectedSector && (
              <button
                type="button"
                onClick={() => setIsSectorFullscreen(true)}
                data-testid="toggle-fullscreen-btn"
                className="px-2.5 py-1.5 bg-[var(--bm-elevated)] hover:bg-[var(--bm-line)] border border-[var(--bm-line)] hover:border-[var(--bm-accent)] text-[var(--bm-accent)] hover:text-[var(--bm-strong)] rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                title="Sektor im Vollbild öffnen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Vollbild</span>
              </button>
            )}
          </div>
        </div>

        {/* Sector Tabs & Mobile Switcher */}
        {sectors.length > 0 && (
          <div className="flex items-center gap-1.5 w-full pt-2 border-t border-[var(--bm-elevated)] min-w-0">
            {/* Prev sector button */}
            <button
              type="button"
              onClick={goToPreviousSector}
              disabled={!hasPreviousSector}
              className="p-1.5 rounded-xl bg-[var(--bm-bg)] hover:bg-[var(--bm-elevated)] disabled:opacity-25 text-[var(--bm-text-2)] border border-[var(--bm-line)] transition cursor-pointer shrink-0"
              title="Vorheriger Sektor (oder nach rechts wischen)"
              aria-label="Vorheriger Sektor"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Sector List */}
            <div
              ref={sectorTabsContainerRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0 relative scroll-smooth"
            >
              {sectors.map(sector => {
                const isSelected = sector.id === selectedSectorId;
                return (
                  <button
                    key={sector.id}
                    data-sector-id={sector.id}
                    type="button"
                    onClick={() => setSelectedSectorId(sector.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-headline transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] font-bold shadow-sm'
                        : 'bg-[var(--bm-elevated)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border border-[var(--bm-line)]'
                    }`}
                  >
                    <span>{sector.name}</span>
                    {isSectorInRebuild(sector) ? (
                      <span className="text-[9px] font-mono font-bold text-[var(--bm-accent)]">Im Umbau</span>
                    ) : isRecentlyNew(sector.rebuiltAt) ? (
                      <span className="px-1 rounded-xl text-[9px] font-mono font-black bg-[var(--bm-accent)] text-[var(--bm-on-accent)]">Neu</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Next sector button */}
            <button
              type="button"
              onClick={goToNextSector}
              disabled={!hasNextSector}
              className="p-1.5 rounded-xl bg-[var(--bm-bg)] hover:bg-[var(--bm-elevated)] disabled:opacity-25 text-[var(--bm-text-2)] border border-[var(--bm-line)] transition cursor-pointer shrink-0"
              title="Nächster Sektor (oder nach links wischen)"
              aria-label="Nächster Sektor"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Swipe Hint Badge */}
      {sectors.length > 1 && (
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--bm-text-2)] px-2 -mt-3 sm:hidden">
          <span>{currentSectorIndex + 1}/{sectors.length}</span>
        </div>
      )}


      {sectors.length === 0 && (
        <div className="bg-[var(--bm-surface)] border border-[var(--bm-line)] rounded-xl p-8 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-[var(--bm-accent)] mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-headline font-bold text-[var(--bm-text)] mb-2">
            Keine Sektoren in "{gym?.name || 'dieser Halle'}"
          </h3>
          <p className="text-sm font-sans text-[var(--bm-text-2)]">
            Noch keine Sektoren.
          </p>
        </div>
      )}

      {selectedSector && (
        <>
          {/* Wall Photo Canvas with Interactive Pins (AC-1) */}
          <div className="space-y-3">
            {/* Quick-Filter Pills (AC-10 & AC-11) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[var(--bm-surface)] border border-[var(--bm-line)]">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-xl transition flex items-center gap-1.5 ${
                    filterMode === 'all'
                      ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] border-[var(--bm-strong)]'
                      : 'bg-[var(--bm-bg)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border-[var(--bm-line)]'
                  }`}
                >
                  <span>Alle ({boulders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('top_rated')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-xl transition flex items-center gap-1.5 ${
                    filterMode === 'top_rated'
                      ? 'bg-[var(--bm-accent)] text-[var(--bm-bg)] border-[var(--bm-accent)] font-bold shadow-sm'
                      : 'bg-[var(--bm-bg)] text-[var(--bm-accent)] hover:bg-[var(--bm-elevated)] border-[var(--bm-line)]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Top</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('popular')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-xl transition flex items-center gap-1.5 ${
                    filterMode === 'popular'
                      ? 'bg-[var(--bm-accent)] text-[var(--bm-bg)] border-[var(--bm-accent)] font-bold shadow-sm'
                      : 'bg-[var(--bm-bg)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border-[var(--bm-line)]'
                  }`}
                >
                  <Flame className="w-3 h-3 text-[var(--bm-danger)]" />
                  <span>Beliebt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('projects')}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold border rounded-xl transition flex items-center gap-1.5 ${
                    filterMode === 'projects'
                      ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)] border-[var(--bm-strong)] font-bold'
                      : 'bg-[var(--bm-bg)] text-[var(--bm-text-2)] hover:text-[var(--bm-text)] border-[var(--bm-line)]'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Projekte</span>
                </button>
              </div>

              {filterMode !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="text-[11px] font-mono text-[var(--bm-text-2)] hover:text-[var(--bm-accent)] underline cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>

            {/* SPEC-021 AC-5: Wand wird gerade neu geschraubt */}
            {isSectorInRebuild(selectedSector) && (
              <div
                data-testid="climber-rebuild-notice"
                className="px-1 text-xs font-mono font-bold text-[var(--bm-accent)]"
              >
                Im Umbau
              </div>
            )}

            <div className="flex items-center justify-between px-1 text-xs font-mono text-[var(--bm-text-2)]">
              <span className="font-semibold text-[var(--bm-text)]">
                {filterMode !== 'all' && `${processedBoulders.length}/${boulders.length}`}
              </span>
            </div>

            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="touch-pan-y relative"
            >
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
                newBoulderIds={newBoulderIds}
                onPinClick={setSelectedBoulder}
                isFullscreen={isSectorFullscreen}
                onToggleFullscreen={() => setIsSectorFullscreen(true)}
                onZoomChange={(zoom) => setIsWallZoomed(zoom > 1.05)}
              />
            </div>
          </div>

          {/* Boulder Route List in this Sector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <h3 className="text-base font-headline font-bold text-[var(--bm-text)] flex items-center gap-2">
                <span>Routen in {selectedSector.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-xl bg-[var(--bm-elevated)] text-[var(--bm-text-2)] font-mono font-semibold border border-[var(--bm-line)]">
                  {processedBoulders.length} {filterMode !== 'all' ? `/ ${boulders.length}` : ''}
                </span>
              </h3>

              {/* Sort selector (AC-11) */}
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--bm-text-2)]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'rating_desc' | 'name_asc')}
                  className="bg-[var(--bm-bg)] border border-[var(--bm-line)] text-[var(--bm-text)] text-xs font-mono rounded-xl px-2.5 py-1 focus:outline-none focus:border-[var(--bm-accent)]"
                >
                  <option value="rating_desc">Beste Bewertung ↓</option>
                  <option value="name_asc">Name (A–Z)</option>
                </select>
              </div>
            </div>

            {processedBoulders.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bm-surface)] border border-[var(--bm-line)] text-sm font-mono text-[var(--bm-text-2)]">
                Keine Boulder gefunden für den aktuellen Filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {processedBoulders.map(boulder => {
                  const scale = resolveBoulderScale(boulder);
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
                  const isFiveStar = stats.avgStars >= 4.8 && stats.totalRatings >= 1;
                  const isFavorite = stats.avgStars >= 4.2 && stats.totalRatings >= 1;

                  return (
                    <div
                      key={boulder.id}
                      onClick={() => setSelectedBoulder(boulder)}
                      className={`p-4 rounded-xl bg-[var(--bm-surface)] transition cursor-pointer flex flex-col justify-between group relative ${
                        isFiveStar
                          ? 'border-2 border-[var(--bm-accent)] gold-glow hover:border-[var(--bm-strong)]'
                          : isFavorite
                          ? 'border border-[var(--bm-accent)]/50 hover:border-[var(--bm-accent)]'
                          : 'border border-[var(--bm-line)] hover:border-[var(--bm-text-2)]'
                      }`}
                    >
                      {/* Top Ribbon Badge for 5.0 King Lines (SPEC-003 AC-18) */}
                      {isFiveStar && (
                        <div
                          data-testid="five-star-ribbon"
                          className="absolute -top-3 left-4 bg-[var(--bm-accent)] text-[var(--bm-bg)] px-2.5 py-0.5 text-[10px] font-headline font-bold shadow-md flex items-center gap-1 z-10"
                        >
                          <Star className="w-2.5 h-2.5 fill-[var(--bm-bg)] text-[var(--bm-bg)]" />
                          <span>5.0 HALLEN-KLASSIKER</span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Badge outside wall photo: square 0px */}
                            <div
                              className="w-5 h-5 rounded-xl border border-black/40 shrink-0"
                              style={{ backgroundColor: scale?.colorHex || 'var(--bm-text-3)' }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-headline font-bold text-[var(--bm-text)] group-hover:text-[var(--bm-strong)] transition truncate">
                                {boulder.name || `${scale?.colorName || 'Boulder'} Problem`}
                              </h4>
                              <span className="text-[11px] font-mono text-[var(--bm-text-2)]">
                                {scale?.difficultyLabel} • Fb {scale?.fontRangeMin} - {scale?.fontRangeMax}
                              </span>
                            </div>
                          </div>

                          {/* Top-Right Badges: Hero Rating Badge & Ascent Status */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Ascent Badge */}
                            {userAscent?.type === 'flash' && (
                              <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-accent)] border border-[var(--bm-accent)]/40 flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-[var(--bm-star)]" />
                                <span>Flash</span>
                              </span>
                            )}
                            {userAscent?.type === 'top' && (
                              <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-success)] border border-[var(--bm-success)]/50 flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-[var(--bm-success)]" />
                                <span>Top</span>
                              </span>
                            )}
                            {userAscent?.type === 'project' && (
                              <span className="px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--bm-elevated)] text-[var(--bm-text-2)] border border-[var(--bm-line)] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--bm-text-2)]" />
                                <span>Projekt</span>
                              </span>
                            )}

                            {/* Hero Score Badge (Vorschlag 1: Sofortige Mobile Erfassung) */}
                            {isFiveStar ? (
                              <div
                                data-testid={`hero-score-${boulder.id}`}
                                className="bg-[var(--bm-accent)] text-[var(--bm-bg)] px-2.5 py-1 flex flex-col items-center justify-center shrink-0 border border-[var(--bm-strong)]/50 shadow-md"
                                title={`${stats.avgStars.toFixed(1)} Sterne (${stats.totalRatings} ${stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'})`}
                              >
                                <div className="flex items-center gap-1 font-mono font-black text-sm leading-none">
                                  <span>{stats.avgStars.toFixed(1)}</span>
                                  <Star className="w-3 h-3 fill-[var(--bm-bg)] text-[var(--bm-bg)]" />
                                </div>
                                <span className="text-[9px] font-mono font-bold tracking-tight mt-0.5">
                                  {stats.totalRatings} {stats.totalRatings === 1 ? 'Vote' : 'Votes'}
                                </span>
                              </div>
                            ) : stats.totalRatings > 0 ? (
                              <div
                                data-testid={`hero-score-${boulder.id}`}
                                className="bg-[var(--bm-elevated)] text-[var(--bm-text)] px-2.5 py-1 flex flex-col items-center justify-center shrink-0 border border-[var(--bm-line)]"
                                title={`${stats.avgStars.toFixed(1)} Sterne (${stats.totalRatings} ${stats.totalRatings === 1 ? 'Wertung' : 'Wertungen'})`}
                              >
                                <div className="flex items-center gap-1 font-mono font-bold text-xs leading-none text-[var(--bm-accent)]">
                                  <span>{stats.avgStars.toFixed(1)}</span>
                                  <Star className="w-2.5 h-2.5 fill-[var(--bm-star)] text-[var(--bm-accent)]" />
                                </div>
                                <span className="text-[9px] font-mono text-[var(--bm-text-2)] mt-0.5">
                                  {stats.totalRatings} {stats.totalRatings === 1 ? 'Vote' : 'Votes'}
                                </span>
                              </div>
                            ) : (
                              <div
                                data-testid={`hero-score-${boulder.id}`}
                                className="bg-[var(--bm-bg)] text-[var(--bm-text-2)] px-2 py-1 flex flex-col items-center justify-center shrink-0 border border-dashed border-[var(--bm-line)] group-hover:border-[var(--bm-accent)]/50 transition"
                                title="Noch nicht bewertet – sei der Erste!"
                              >
                                <span className="text-[10px] font-mono font-bold text-[var(--bm-accent)] leading-none">
                                  + Bewerten
                                </span>
                                <span className="text-[8px] font-mono text-[var(--bm-text-3)] mt-0.5">
                                  0 Wertung
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {boulder.notes && (
                          <p className="text-xs font-mono text-[var(--bm-text-2)] line-clamp-2 my-2 italic">
                            "{boulder.notes}"
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Immersive Fullscreen Sector View (Requirement 1, 1a, 1b: Edge-to-Edge Wall, Zero Header, Zero Footer) */}
      {isSectorFullscreen && selectedSector && (
        <div
          className="fixed inset-0 z-50 bg-black w-full h-full h-[100dvh] flex items-center justify-center select-none animate-in fade-in duration-150 overflow-hidden"
          data-testid="sector-fullscreen-modal"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Floating Exit Fullscreen Button (Zero Layout Height) */}
          <button
            type="button"
            onClick={() => setIsSectorFullscreen(false)}
            data-testid="exit-fullscreen-btn"
            className="absolute top-3 right-3 z-40 p-2 sm:p-2.5 rounded-xl bg-black/60 hover:bg-black/85 text-[var(--bm-strong)] border border-[var(--bm-line)] hover:border-[var(--bm-accent)] backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Vollbild beenden"
            aria-label="Vollbild beenden"
          >
            <Minimize2 className="w-4 h-4 text-[var(--bm-accent)]" />
            <span className="text-[10px] font-mono font-bold text-[var(--bm-text)] hidden xs:inline">Beenden</span>
          </button>

          {/* Minimal Floating Sector HUD (Top-Left, Zero Layout Height) */}
          <div
            data-testid="fullscreen-sector-hud"
            className="absolute top-3 left-3 z-40 bg-black/60 backdrop-blur-md border border-[var(--bm-line)] px-2.5 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none text-xs font-mono shadow-lg max-w-[calc(100%-90px)]"
          >
            <div className="w-2 h-2 bg-[var(--bm-accent)] shrink-0" />
            <span className="font-headline font-bold text-[var(--bm-text)] truncate">
              {selectedSector.name}
            </span>
            <span className="text-[var(--bm-text-2)] text-[10px] shrink-0">
              {currentSectorIndex + 1}/{sectors.length}
            </span>
            {isSectorInRebuild(selectedSector) && (
              <span className="text-[10px] font-mono font-bold text-[var(--bm-accent)] shrink-0">Im Umbau</span>
            )}
            {boulders.length === 0 && (
              <span className="text-[10px] font-mono text-[var(--bm-accent)] bg-[var(--bm-elevated)] px-1.5 py-0.5 border border-[var(--bm-accent)]/30 shrink-0">
                0 Routen
              </span>
            )}
          </div>

          {/* Empty Sector Notice in Fullscreen (so climbers immediately know the wall is empty) */}
          {boulders.length === 0 && (
            <div
              data-testid="fullscreen-empty-notice"
              className="absolute top-14 left-3 z-40 bg-black/80 backdrop-blur-md border border-[var(--bm-accent)]/40 px-3 py-1.5 rounded-xl text-[11px] font-mono text-[var(--bm-text)] shadow-lg flex items-center gap-2 pointer-events-none max-w-[calc(100%-24px)] animate-in fade-in duration-200"
            >
              <Info className="w-3.5 h-3.5 text-[var(--bm-accent)] shrink-0" />
              <span>In diesem Sektor wurden noch keine Routen gesetzt (Wische für nächsten Sektor)</span>
            </div>
          )}

          {/* Quick Floating Lateral Switch Arrows (Left & Right Edge) - Discreet & non-obstructive */}
          {sectors.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousSector();
                }}
                data-testid="fullscreen-prev-sector-btn"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/80 active:scale-95 text-[var(--bm-text)] border border-white/10 hover:border-[var(--bm-accent)] backdrop-blur-sm transition-all cursor-pointer shadow-md opacity-40 hover:opacity-100"
                title="Vorheriger Sektor (oder nach rechts wischen)"
                aria-label="Vorheriger Sektor"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--bm-accent)]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextSector();
                }}
                data-testid="fullscreen-next-sector-btn"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/80 active:scale-95 text-[var(--bm-text)] border border-white/10 hover:border-[var(--bm-accent)] backdrop-blur-sm transition-all cursor-pointer shadow-md opacity-40 hover:opacity-100"
                title="Nächster Sektor (oder nach links wischen)"
                aria-label="Nächster Sektor"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--bm-accent)]" />
              </button>
            </>
          )}

          {/* Fullscreen Canvas filling 100% of Screen */}
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
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
                newBoulderIds={newBoulderIds}
              onPinClick={setSelectedBoulder}
              isFullscreen={true}
              onToggleFullscreen={() => setIsSectorFullscreen(false)}
              onZoomChange={(zoom) => setIsWallZoomed(zoom > 1.05)}
            />
          </div>

          {/* Minimal Floating Swipe Hint Badge (Bottom-Center, Zero Layout Height) */}
          {sectors.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 bg-black/60 backdrop-blur-md border border-[var(--bm-line)] px-3 py-1 rounded-xl text-[10px] font-mono text-[var(--bm-text-2)] pointer-events-none whitespace-nowrap opacity-80 transition-opacity">
              ← Wischen für Sektorwechsel →
            </div>
          )}
        </div>
      )}

      {/* Boulder Detail Modal */}
      {selectedBoulder && (
        <BoulderDetailModal
          boulder={selectedBoulder}
          sector={selectedSector || undefined}
          gradeScale={resolveBoulderScale(selectedBoulder)}
          currentUser={currentUser}
          isOpen={Boolean(selectedBoulder)}
          onClose={() => setSelectedBoulder(null)}
          onDataChanged={handleRefreshData}
        />
      )}
    </div>
  );
};
