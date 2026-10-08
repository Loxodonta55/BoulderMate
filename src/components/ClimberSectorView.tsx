import React, { useState, useEffect, useMemo } from 'react';
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
import { BoulderSheet } from './BoulderSheet';
import { Sheet } from './ui/Sheet';
import {
  ClimberWallFilter,
  filterClimberBoulders,
  sortByDifficulty,
  formatGrade,
  CLASSIC_MIN_STARS,
} from '../lib/climberWallFilters';
import { WallPhotoCanvas } from './WallPhotoCanvas';
import { useBackHandler } from '../hooks/useBackHandler';
import {
  Zap,
  Check,
  Target,
  Star,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Building2,
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
    gym,
    sectors,
    selectedSectorId,
    selectedSector,
    gradeScales,
    scaleMap,
    setSelectedSectorId,
    refreshGymData,
  } = useGymSectorData(activeGymId, onSelectGym);

  const [boulders, setBoulders] = useState<WallBoulder[]>([]);
  const [selectedBoulder, setSelectedBoulder] = useState<WallBoulder | null>(null);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<ClimberWallFilter>('all');
  const [isSectorListOpen, setIsSectorListOpen] = useState<boolean>(false);
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
    id: 'sector-list-sheet',
    isOpen: isSectorListOpen,
    onBack: () => setIsSectorListOpen(false),
  });

  useBackHandler({
    id: 'boulder-detail-modal',
    isOpen: Boolean(selectedBoulder),
    onBack: () => setSelectedBoulder(null),
  });

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

  // SPEC-022 F4/F5: Filter + feste Sortierung nach Schwierigkeit
  const processedBoulders = useMemo(() => {
    const filtered = filterClimberBoulders(boulders, filterMode, { userAscentMap, statsMap, newBoulderIds });
    return sortByDifficulty(filtered, resolveBoulderScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boulders, filterMode, statsMap, userAscentMap, newBoulderIds, gradeScales, scaleMap]);

  // «Neu»-Chip nur, wenn es neue Boulder gibt; sonst Filter zurück auf «Alle»
  useEffect(() => {
    if (filterMode === 'new' && newBoulderIds.size === 0) setFilterMode('all');
  }, [filterMode, newBoulderIds]);

  // WallPhotoCanvas blendet nur aus, ob überhaupt gefiltert wird (filteredBoulderIds trägt die Auswahl)
  const canvasFilterMode = filterMode === 'all' ? 'all' : 'top_rated';

  const filteredIdSet = useMemo(() => new Set(processedBoulders.map(p => p.id)), [processedBoulders]);

  const sectorRouteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!isSectorListOpen) return counts;
    for (const s of sectors) {
      counts.set(s.id, getWallBoulders(s.id).filter(b => b.status === 'active').length);
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectors, isSectorListOpen, dataVersion]);

  function resolveBoulderScale(b: WallBoulder): GymGradeScale | undefined {
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
  }


  const filterChips: { id: ClimberWallFilter; label: React.ReactNode; show: boolean }[] = [
    { id: 'all', label: 'Alle', show: true },
    { id: 'open', label: 'Offen', show: true },
    { id: 'new', label: 'Neu', show: newBoulderIds.size > 0 },
    { id: 'top_rated', label: <><Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-star)]" />Top</>, show: true },
  ];

  const sectorBadge = (sector: typeof sectors[number]) =>
    isSectorInRebuild(sector) ? (
      <span className="text-[12px] font-semibold text-[var(--bm-warning)] shrink-0">Im Umbau</span>
    ) : isRecentlyNew(sector.rebuiltAt) ? (
      <span className="px-1.5 rounded-md text-[11px] font-bold bg-[var(--bm-accent)] text-[var(--bm-on-accent)] shrink-0">Neu</span>
    ) : null;

  return (
    <div className="max-w-3xl mx-auto w-full overflow-hidden" data-testid="climber-wall-view">
      {sectors.length === 0 && (
        <div className="px-6 py-16 text-center" data-testid="climber-empty-gym">
          <Building2 className="w-10 h-10 text-[var(--bm-text-3)] mx-auto mb-3" />
          <p className="text-[17px] font-semibold text-[var(--bm-text)]">Noch keine Wände</p>
          <p className="text-[15px] text-[var(--bm-text-2)] mt-1">{gym?.name || 'Diese Halle'} hat noch keine Sektoren.</p>
        </div>
      )}

      {selectedSector && (
        <>
          {/* SPEC-022 F1: Wandfoto als erstes Element, randlos */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="touch-pan-y relative"
            data-testid="climber-wall-photo"
          >
            <WallPhotoCanvas
              mode="climber"
              photoUrl={selectedSector.wallPhotoUrl}
              sectorName={selectedSector.name}
              boulders={boulders}
              gradeScales={gradeScales}
              filterMode={canvasFilterMode}
              filteredBoulderIds={filteredIdSet}
              statsMap={statsMap}
              userAscentMap={userAscentMap}
              newBoulderIds={newBoulderIds}
              onPinClick={setSelectedBoulder}
              isFullscreen={isSectorFullscreen}
              onToggleFullscreen={() => setIsSectorFullscreen(true)}
              onZoomChange={(zoom) => setIsWallZoomed(zoom > 1.05)}
            />
          </div>

          <div className="px-2 sm:px-0 space-y-3 mt-3">
            {/* SPEC-022 F3: Sektor-Pill */}
            <div className="flex items-center gap-2" data-testid="sector-pill">
              <button
                type="button"
                onClick={goToPreviousSector}
                disabled={!hasPreviousSector}
                className="w-11 h-11 rounded-full bg-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text)] disabled:opacity-30 shrink-0"
                aria-label="Vorheriger Sektor"
                data-testid="sector-prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSectorListOpen(true)}
                className="flex-1 min-w-0 min-h-[44px] px-4 rounded-full bg-[var(--bm-surface)] flex items-center justify-center gap-2"
                aria-label={`Sektor ${selectedSector.name}, alle Sektoren zeigen`}
                data-testid="sector-pill-name"
              >
                <h2 className="text-[17px] font-semibold text-[var(--bm-text)] truncate">{selectedSector.name}</h2>
                {sectorBadge(selectedSector)}
                <span className="text-[14px] text-[var(--bm-text-2)] tabular-nums shrink-0">
                  {currentSectorIndex + 1}/{sectors.length}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--bm-text-2)] shrink-0" />
              </button>
              <button
                type="button"
                onClick={goToNextSector}
                disabled={!hasNextSector}
                className="w-11 h-11 rounded-full bg-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text)] disabled:opacity-30 shrink-0"
                aria-label="Nächster Sektor"
                data-testid="sector-next-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSectorFullscreen(true)}
                data-testid="toggle-fullscreen-btn"
                className="w-11 h-11 rounded-full bg-[var(--bm-surface)] flex items-center justify-center text-[var(--bm-text)] shrink-0"
                title="Vollbild"
                aria-label="Vollbild"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* SPEC-021 AC-5: Wand wird gerade neu geschraubt */}
            {isSectorInRebuild(selectedSector) && (
              <p data-testid="climber-rebuild-notice" className="text-[13px] font-semibold text-[var(--bm-warning)] text-center">
                Im Umbau
              </p>
            )}

            {/* SPEC-022 F4: Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter" data-testid="climber-filter-chips">
              {filterChips.filter(c => c.show).map(chip => {
                const active = filterMode === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilterMode(chip.id)}
                    data-testid={`filter-chip-${chip.id}`}
                    className={`min-h-[36px] px-4 rounded-full text-[15px] font-medium flex items-center gap-1 shrink-0 transition ${
                      active
                        ? 'bg-[var(--bm-accent)] text-[var(--bm-on-accent)]'
                        : 'bg-[var(--bm-surface)] text-[var(--bm-text)]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* SPEC-022 F6: Routenliste */}
            {boulders.length === 0 ? (
              <p className="py-8 text-center text-[15px] text-[var(--bm-text-2)]" data-testid="climber-empty-sector">
                Noch keine Boulder an dieser Wand.
              </p>
            ) : processedBoulders.length === 0 ? (
              <div className="py-8 text-center space-y-3" data-testid="climber-empty-filter">
                <p className="text-[15px] text-[var(--bm-text-2)]">Nichts gefunden.</p>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className="min-h-[44px] px-5 rounded-full bg-[var(--bm-surface)] text-[15px] font-medium text-[var(--bm-text)]"
                >
                  Alle zeigen
                </button>
              </div>
            ) : (
              <ul className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]" data-testid="climber-route-list">
                {processedBoulders.map(boulder => {
                  const scale = resolveBoulderScale(boulder);
                  const ascent = userAscentMap.get(boulder.id);
                  const stats = statsMap.get(boulder.id);
                  const avg = stats?.avgStars || 0;
                  const isClassic = avg >= CLASSIC_MIN_STARS && (stats?.totalRatings || 0) >= 1;
                  const grade = formatGrade(scale, boulder.fontGrade);
                  return (
                    <li key={boulder.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedBoulder(boulder)}
                        data-testid={`route-row-${boulder.id}`}
                        className="w-full min-h-[56px] px-4 py-2 flex items-center gap-3 text-left active:bg-[var(--bm-elevated)]"
                      >
                        <span
                          className={`w-5 h-5 rounded-full shrink-0 ${isClassic ? 'ring-2 ring-offset-2 ring-offset-[var(--bm-surface)] ring-[var(--bm-star)]' : 'ring-1 ring-black/10'}`}
                          style={{ backgroundColor: scale?.colorHex || 'var(--bm-text-3)' }}
                          data-testid={isClassic ? 'five-star-ribbon' : undefined}
                          aria-hidden
                        />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[16px] font-medium text-[var(--bm-text)] truncate">
                              {boulder.name?.trim() || scale?.colorName || 'Boulder'}
                            </span>
                            {newBoulderIds.has(boulder.id) && (
                              <span className="px-1.5 rounded-md text-[11px] font-bold bg-[var(--bm-accent)] text-[var(--bm-on-accent)] shrink-0">Neu</span>
                            )}
                          </span>
                          <span className="block text-[13px] text-[var(--bm-text-2)] truncate">
                            {[grade, scale?.colorName && boulder.name?.trim() ? scale.colorName : null].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        {(stats?.totalRatings || 0) > 0 && (
                          <span
                            className="flex items-center gap-0.5 text-[14px] text-[var(--bm-text-2)] tabular-nums shrink-0"
                            data-testid={`hero-score-${boulder.id}`}
                            title={`${avg.toFixed(1)} Sterne (${stats!.totalRatings})`}
                          >
                            <Star className="w-3.5 h-3.5 fill-[var(--bm-star)] text-[var(--bm-star)]" />
                            {avg.toFixed(1)}
                          </span>
                        )}
                        <span className="w-6 flex justify-center shrink-0" data-testid={`route-status-${boulder.id}`}>
                          {ascent?.type === 'flash' && <Zap className="w-5 h-5 fill-[var(--bm-star)] text-[var(--bm-star)]" aria-label="Flash" />}
                          {ascent?.type === 'top' && <Check className="w-5 h-5 text-[var(--bm-success)]" aria-label="Top" />}
                          {ascent?.type === 'project' && <Target className="w-5 h-5 text-[var(--bm-text-2)]" aria-label="Projekt" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* SPEC-022 F3: Sektor-Liste */}
      {isSectorListOpen && (
        <Sheet open onClose={() => setIsSectorListOpen(false)} fitContent testId="sector-list-sheet" ariaLabel="Sektoren">
          <div className="px-5 pb-4">
            <h2 className="text-[20px] font-semibold mb-3">Sektoren</h2>
            <ul className="rounded-2xl bg-[var(--bm-elevated)] overflow-hidden divide-y divide-[var(--bm-line)]">
              {sectors.map(sector => {
                const isSelected = sector.id === selectedSectorId;
                const count = sectorRouteCounts.get(sector.id) ?? 0;
                return (
                  <li key={sector.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectorId(sector.id);
                        setIsSectorListOpen(false);
                      }}
                      data-testid={`sector-list-item-${sector.id}`}
                      aria-current={isSelected ? 'true' : undefined}
                      className="w-full min-h-[56px] px-4 flex items-center gap-3 text-left"
                    >
                      {sector.wallPhotoUrl ? (
                        <img src={sector.wallPhotoUrl} alt="" className="w-12 h-9 rounded-md object-cover shrink-0 bg-[var(--bm-line)]" />
                      ) : (
                        <span className="w-12 h-9 rounded-md shrink-0 bg-[var(--bm-line)]" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className={`block text-[16px] truncate ${isSelected ? 'font-semibold' : ''}`}>{sector.name}</span>
                        <span className="block text-[13px] text-[var(--bm-text-2)]">{count} Boulder</span>
                      </span>
                      {sectorBadge(sector)}
                      {isSelected && <Check className="w-5 h-5 text-[var(--bm-text)] shrink-0" aria-label="Aktuell" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Sheet>
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
          </div>

          {/* Empty Sector Notice in Fullscreen (so climbers immediately know the wall is empty) */}
          {boulders.length === 0 && (
            <div
              data-testid="fullscreen-empty-notice"
              className="absolute top-14 left-3 z-40 bg-black/80 backdrop-blur-md border border-[var(--bm-accent)]/40 px-3 py-1.5 rounded-xl text-[11px] font-mono text-[var(--bm-text)] shadow-lg flex items-center gap-2 pointer-events-none max-w-[calc(100%-24px)] animate-in fade-in duration-200"
            >
              <span>Noch keine Boulder</span>
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
              filterMode={canvasFilterMode}
              filteredBoulderIds={filteredIdSet}
              statsMap={statsMap}
              userAscentMap={userAscentMap}
                newBoulderIds={newBoulderIds}
              onPinClick={setSelectedBoulder}
              isFullscreen={true}
              onToggleFullscreen={() => setIsSectorFullscreen(false)}
              onZoomChange={(zoom) => setIsWallZoomed(zoom > 1.05)}
            />
          </div>

        </div>
      )}

      {/* SPEC-022 F7: Boulder-Sheet statt Detail-Modal */}
      {selectedBoulder && (
        <BoulderSheet
          boulder={selectedBoulder}
          sector={selectedSector || undefined}
          gradeScale={resolveBoulderScale(selectedBoulder)}
          currentUser={currentUser}
          onClose={() => setSelectedBoulder(null)}
        />
      )}
    </div>
  );
};
