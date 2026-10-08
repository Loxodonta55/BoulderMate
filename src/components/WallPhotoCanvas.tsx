import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WallBoulder, GymGradeScale, Ascent, BoulderStatsAggregate } from '../types/boulder';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Archive,
  Sparkles,
  Camera,
  Zap,
  Trophy,
  Clock,
  Maximize2,
  BoxSelect,
  Check,
  Edit3,
  Star,
} from 'lucide-react';

export interface WallPhotoCanvasProps {
  mode?: 'setter' | 'climber';
  photoUrl: string;
  sectorName?: string;
  boulders: WallBoulder[];
  gradeScales: GymGradeScale[];

  // Setter mode props
  pendingArchiveIds?: string[];
  pendingModifiedIds?: string[];
  selectedBoulderId?: string | null;
  selectedBoulderIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onPhotoClick?: (x: number, y: number) => void;
  onPinClick?: (boulder: WallBoulder) => void;
  onPinMove?: (boulderId: string, newX: number, newY: number) => void;
  isAddingEnabled?: boolean;
  onChangePhoto?: () => void;

  // Climber mode props
  filterMode?: 'all' | 'top_rated' | 'popular' | 'projects';
  filteredBoulderIds?: Set<string>;
  statsMap?: Map<string, BoulderStatsAggregate>;
  userAscentMap?: Map<string, Ascent | null>;
  newBoulderIds?: Set<string>; // SPEC-021 AC-10: «Neu»-Badge
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onZoomChange?: (zoomLevel: number) => void;
}


export const WallPhotoCanvas: React.FC<WallPhotoCanvasProps> = ({
  mode = 'setter',
  photoUrl,
  sectorName,
  boulders,
  gradeScales,
  pendingArchiveIds = [],
  pendingModifiedIds = [],
  selectedBoulderId = null,
  selectedBoulderIds = [],
  onSelectionChange,
  onPhotoClick,
  onPinClick,
  onPinMove,
  isAddingEnabled = true,
  onChangePhoto,
  filterMode = 'all',
  filteredBoulderIds,
  statsMap,
  userAscentMap,
  newBoulderIds,
  isFullscreen = false,
  onToggleFullscreen,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Marquee / Box Selection State (AC-12)
  const [isBoxSelecting, setIsBoxSelecting] = useState<boolean>(false);
  const [boxSelection, setBoxSelection] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const boxStartRef = useRef<{ clientX: number; clientY: number; normX: number; normY: number } | null>(null);

  const scaleMap = new Map<string, GymGradeScale>();
  gradeScales.forEach(s => {
    scaleMap.set(s.id, s);
    if (s.colorName) {
      const colorLower = s.colorName.toLowerCase().trim();
      const colorAscii = colorLower.replace(/ß/g, 'ss');
      scaleMap.set(`scale_6a_${colorAscii}`, s);
      scaleMap.set(`scale_minimum_${colorAscii}`, s);
      scaleMap.set(colorLower, s);
      scaleMap.set(colorAscii, s);
    }
  });

  const resolveScale = (boulder: WallBoulder): GymGradeScale | undefined => {
    if (boulder.gradeScaleId && scaleMap.has(boulder.gradeScaleId)) {
      return scaleMap.get(boulder.gradeScaleId);
    }
    // Fallback: Suche über Farbname in gradeScaleId oder Boulder-Name
    const query = `${boulder.gradeScaleId || ''} ${boulder.name || ''}`.toLowerCase().replace(/ß/g, 'ss');
    const matchedByName = gradeScales.find(s => {
      const norm = s.colorName.toLowerCase().trim().replace(/ß/g, 'ss');
      return query.includes(norm);
    });
    if (matchedByName) return matchedByName;

    // Fallback: Suche über Font-Grade
    if (boulder.fontGrade) {
      const matchedByFont = gradeScales.find(s => s.fontRangeMin === boulder.fontGrade || s.fontRangeMax === boulder.fontGrade);
      if (matchedByFont) return matchedByFont;
    }

    return gradeScales[0];
  };

  // Compute click coordinates relative to image (0.0 to 1.0)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'setter') return;
    // If just finished dragging or box selecting, prevent click
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    // If boulders were previously selected and user clicks empty canvas, clear selection
    if (selectedBoulderIds && selectedBoulderIds.length > 0) {
      if (onSelectionChange) {
        onSelectionChange([]);
      }
      return;
    }
    if (!containerRef.current || !isAddingEnabled || !onPhotoClick) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Clamp between 0.01 and 0.99 with 4 decimals precision
    const clampedX = Math.max(0.01, Math.min(0.99, Number(clickX.toFixed(4))));
    const clampedY = Math.max(0.01, Math.min(0.99, Number(clickY.toFixed(4))));

    onPhotoClick(clampedX, clampedY);
  };

  // Drag handling (Setter mode only)
  const handlePinMouseDown = (e: React.MouseEvent, boulderId: string) => {
    if (mode !== 'setter' || !onPinMove) return;
    e.stopPropagation();
    boxStartRef.current = null; // Ensure box selection doesn't start
    setDraggingPinId(boulderId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    isDraggingRef.current = false;
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'setter') return;
    if (e.button !== 0) return; // Only primary/left mouse button
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    boxStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      normX,
      normY,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (mode !== 'setter' || !containerRef.current) return;

      // 1. Moving a single pin
      if (draggingPinId && dragStartPos && onPinMove) {
        const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
        if (dist > 5) {
          isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const newX = Math.max(0.01, Math.min(0.99, Number(((e.clientX - rect.left) / rect.width).toFixed(4))));
          const newY = Math.max(0.01, Math.min(0.99, Number(((e.clientY - rect.top) / rect.height).toFixed(4))));
          onPinMove(draggingPinId, newX, newY);
        }
        return;
      }

      // 2. Box / Marquee Selection Drag (AC-12)
      if (boxStartRef.current) {
        const dist = Math.hypot(e.clientX - boxStartRef.current.clientX, e.clientY - boxStartRef.current.clientY);
        if (dist > 5) {
          isDraggingRef.current = true;
          setIsBoxSelecting(true);

          const rect = containerRef.current.getBoundingClientRect();
          const currNormX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const currNormY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

          const minX = Math.min(boxStartRef.current.normX, currNormX);
          const maxX = Math.max(boxStartRef.current.normX, currNormX);
          const minY = Math.min(boxStartRef.current.normY, currNormY);
          const maxY = Math.max(boxStartRef.current.normY, currNormY);

          setBoxSelection({
            startX: minX,
            startY: minY,
            currentX: maxX,
            currentY: maxY,
          });

          // Find all boulders whose coordinates fall inside [minX, maxX] x [minY, maxY]
          const enclosedBoulderIds = boulders
            .filter(b => b.positionX >= minX && b.positionX <= maxX && b.positionY >= minY && b.positionY <= maxY)
            .map(b => b.id);

          if (onSelectionChange) {
            onSelectionChange(enclosedBoulderIds);
          }
        }
      }
    },
    [mode, draggingPinId, dragStartPos, onPinMove, boulders, onSelectionChange]
  );

  const handleMouseUp = () => {
    if (draggingPinId) {
      setDraggingPinId(null);
      setDragStartPos(null);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    }

    if (boxStartRef.current) {
      boxStartRef.current = null;
      if (isBoxSelecting) {
        setIsBoxSelecting(false);
        setBoxSelection(null);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      }
    }
  };

  const viewportRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Track image natural dimensions and aspect ratio
  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.src = photoUrl;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    } else {
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [photoUrl]);

  // Track viewport dimensions in fullscreen (dynamically responds to mobile rotation / orientation changes)
  useEffect(() => {
    if (!isFullscreen) return;

    const updateSize = () => {
      if (typeof window === 'undefined') return;

      // Prefer visualViewport if available for accurate visible area on mobile browsers
      const vvWidth = window.visualViewport?.width;
      const vvHeight = window.visualViewport?.height;
      const winW = vvWidth && vvWidth > 0 ? vvWidth : window.innerWidth;
      const winH = vvHeight && vvHeight > 0 ? vvHeight : window.innerHeight;

      // Check element client bounds
      const elW = viewportRef.current?.clientWidth;
      const elH = viewportRef.current?.clientHeight;

      const effectiveWidth = elW && elW > 50 ? elW : winW;
      const effectiveHeight = elH && elH > 50 ? elH : winH;

      setViewportSize(prev => {
        if (prev.width === effectiveWidth && prev.height === effectiveHeight) {
          return prev;
        }
        return { width: effectiveWidth, height: effectiveHeight };
      });
    };

    updateSize();

    // Multi-frame triggers for mobile orientation change settling (Safari/Chrome delay layout recalculation)
    const handleReorient = () => {
      updateSize();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(updateSize);
      }
      setTimeout(updateSize, 50);
      setTimeout(updateSize, 150);
      setTimeout(updateSize, 300);
      setTimeout(updateSize, 600);
    };

    window.addEventListener('resize', handleReorient);
    window.addEventListener('orientationchange', handleReorient);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleReorient);
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewportRef.current) {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(viewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleReorient);
      window.removeEventListener('orientationchange', handleReorient);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleReorient);
      }
      if (ro) ro.disconnect();
    };
  }, [isFullscreen]);

  // Reset zoom level on photo switch
  useEffect(() => {
    setZoomLevel(1);
  }, [photoUrl]);

  // Notify parent of zoom changes
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(zoomLevel);
    }
  }, [zoomLevel, onZoomChange]);

  // Double tap to toggle 1x (fit) and 1.8x (zoom) in fullscreen
  const lastTapTimeRef = useRef<number>(0);
  const handleTouchTap = () => {
    if (!isFullscreen) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      setZoomLevel(prev => (prev > 1.2 ? 1 : 1.8));
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(1, Math.min(3.5, Number((prev + delta).toFixed(2)))));
  };

  // 2-Finger Pinch-to-Zoom Gesture Detection (Requirement: 2-Finger Zoom in Fullscreen)
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const isPinchingRef = useRef<boolean>(false);
  const zoomLevelRef = useRef<number>(zoomLevel);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  const getPinchDistance = (touches: React.TouchList | TouchList): number => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      isPinchingRef.current = true;
      pinchStartDistRef.current = getPinchDistance(e.touches);
      pinchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1) {
      isPinchingRef.current = false;
      pinchStartDistRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinchingRef.current && e.touches.length === 2 && pinchStartDistRef.current) {
      e.stopPropagation();
      lastTapTimeRef.current = 0;
      const dist = getPinchDistance(e.touches);
      if (pinchStartDistRef.current > 10) {
        const factor = dist / pinchStartDistRef.current;
        const newZoom = Math.min(3.5, Math.max(1.0, Number((pinchStartZoomRef.current * factor).toFixed(2))));
        setZoomLevel(newZoom);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinchingRef.current && e.touches.length < 2) {
      isPinchingRef.current = false;
      pinchStartDistRef.current = null;
      return;
    }
    if (e.touches.length === 0 && !isPinchingRef.current) {
      handleTouchTap();
    }
  };

  // Trackpad pinch / wheel zoom with Ctrl key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.008;
      setZoomLevel(prev => Math.max(1.0, Math.min(3.5, Number((prev + delta).toFixed(2)))));
    }
  };

  // Native non-passive touch listeners on viewportRef for mobile Safari/Chrome to prevent gesture conflicts
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onTouchStartNative = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        pinchStartDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoomRef.current = zoomLevelRef.current;
      }
    };

    const onTouchMoveNative = (e: TouchEvent) => {
      if (isPinchingRef.current && e.touches.length === 2 && pinchStartDistRef.current) {
        if (e.cancelable) e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (pinchStartDistRef.current > 10) {
          const factor = dist / pinchStartDistRef.current;
          const newZoom = Math.min(3.5, Math.max(1.0, Number((pinchStartZoomRef.current * factor).toFixed(2))));
          setZoomLevel(newZoom);
        }
      }
    };

    const onTouchEndNative = (e: TouchEvent) => {
      if (isPinchingRef.current && e.touches.length < 2) {
        isPinchingRef.current = false;
        pinchStartDistRef.current = null;
      }
    };

    el.addEventListener('touchstart', onTouchStartNative, { passive: true });
    el.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    el.addEventListener('touchend', onTouchEndNative, { passive: true });
    el.addEventListener('touchcancel', onTouchEndNative, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStartNative);
      el.removeEventListener('touchmove', onTouchMoveNative);
      el.removeEventListener('touchend', onTouchEndNative);
      el.removeEventListener('touchcancel', onTouchEndNative);
    };
  }, [isFullscreen]);

  // Center scroll position when zooming into wall from 1x
  const prevZoomLevelRef = useRef<number>(zoomLevel);
  useEffect(() => {
    if (isFullscreen && viewportRef.current) {
      if (prevZoomLevelRef.current <= 1 && zoomLevel > 1) {
        const el = viewportRef.current;
        requestAnimationFrame(() => {
          if (el) {
            el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
            el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
          }
        });
      }
    }
    prevZoomLevelRef.current = zoomLevel;
  }, [zoomLevel, isFullscreen]);

  // Fullscreen ideal screen fit calculation
  let containerStyle: React.CSSProperties;
  if (isFullscreen) {
    const imgAspect = aspectRatio || (16 / 9);
    // Measure available viewport cleanly
    const curVpW = viewportRef.current?.clientWidth || viewportSize.width || (typeof window !== 'undefined' ? window.innerWidth : 1000);
    const curVpH = viewportRef.current?.clientHeight || viewportSize.height || (typeof window !== 'undefined' ? window.innerHeight : 800);
    const vpWidth = Math.max(100, curVpW);
    const vpHeight = Math.max(100, curVpH);
    const vpAspect = vpWidth / vpHeight;

    let baseWidth: number;
    let baseHeight: number;

    if (imgAspect >= vpAspect) {
      // Image is wider than viewport (fit width)
      baseWidth = vpWidth;
      baseHeight = vpWidth / imgAspect;
    } else {
      // Image is taller than viewport (fit height)
      baseHeight = vpHeight;
      baseWidth = vpHeight * imgAspect;
    }

    // Safety clamp: when not zoomed, base dimensions MUST NOT exceed viewport bounds to avoid cutting off edges
    if (zoomLevel <= 1) {
      baseWidth = Math.min(baseWidth, vpWidth);
      baseHeight = Math.min(baseHeight, vpHeight);
    }

    const finalWidth = Math.round(baseWidth * zoomLevel);
    const finalHeight = Math.round(baseHeight * zoomLevel);

    const isWiderThanVp = finalWidth > vpWidth;
    const isTallerThanVp = finalHeight > vpHeight;

    containerStyle = {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      maxWidth: zoomLevel <= 1 ? '100%' : undefined,
      maxHeight: zoomLevel <= 1 ? '100%' : undefined,
      aspectRatio: `${imgAspect}`,
      marginLeft: isWiderThanVp ? 0 : 'auto',
      marginRight: isWiderThanVp ? 0 : 'auto',
      marginTop: isTallerThanVp ? 0 : 'auto',
      marginBottom: isTallerThanVp ? 0 : 'auto',
      position: 'relative',
    };
  } else {
    containerStyle = {
      width: `${zoomLevel * 100}%`,
      minWidth: '100%',
    };
  }

  return (
    <div
      className={
        isFullscreen
          ? 'relative w-full h-full bg-black select-none overflow-hidden'
          : 'relative w-full rounded-xl overflow-hidden border border-[var(--bm-line)] bg-black select-none'
      }
    >
      {/* Top-Left Instruction Badge: nur Schrauber. SPEC-022 F21: Kletterer sehen keinen «Pin antippen»-Hinweis mehr. */}
      {!isFullscreen && mode === 'setter' && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[var(--bm-surface)] px-3 py-1.5 rounded-xl border border-[var(--bm-line)] text-xs font-mono text-[var(--bm-text)] shadow-md pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
          <span>Klick = Pin</span>
          <span className="text-[var(--bm-text-3)]">|</span>
          <span>Drag = Verschieben</span>
          <span className="text-[var(--bm-text-3)]">|</span>
          <BoxSelect className="w-3.5 h-3.5 text-[var(--bm-accent)]" />
          <span className="text-[var(--bm-accent)] font-semibold">Ziehen = Quadrat-Auswahl</span>
        </div>
      )}

      {/* Top-Right Zoom & Tooling Bar (Non-Fullscreen Mode) */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[var(--bm-surface)] p-1 rounded-xl border border-[var(--bm-line)] shadow-md">
          <button
            type="button"
            onClick={() => handleZoom(0.25)}
            disabled={zoomLevel >= 2.5}
            className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] disabled:opacity-30 transition cursor-pointer"
            title="Vergrößern"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1.5 text-[var(--bm-text)] min-w-[3rem] text-center font-bold">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(-0.25)}
            disabled={zoomLevel <= 1}
            className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] disabled:opacity-30 transition cursor-pointer"
            title="Verkleinern"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-xl text-[var(--bm-accent)] hover:bg-[var(--bm-elevated)] transition cursor-pointer"
              title="Zoom zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleFullscreen && (
            <>
              <span className="w-px h-4 bg-[var(--bm-line)] mx-0.5" />
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-1.5 rounded-xl text-[var(--bm-accent)] hover:text-[var(--bm-strong)] hover:bg-[var(--bm-elevated)] transition flex items-center gap-1 text-xs font-mono cursor-pointer"
                title="Sektor-Vollbildmodus"
                data-testid="canvas-fullscreen-btn"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Vollbild</span>
              </button>
            </>
          )}

          {mode === 'setter' && onChangePhoto && (
            <>
              <span className="w-px h-4 bg-[var(--bm-line)] mx-0.5" />
              <button
                type="button"
                onClick={onChangePhoto}
                className="p-1.5 rounded-xl text-[var(--bm-accent)] hover:text-[var(--bm-strong)] hover:bg-[var(--bm-elevated)] transition flex items-center gap-1 text-xs font-mono cursor-pointer"
                title="Foto aufnehmen oder hochladen"
                data-testid="canvas-camera-btn"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Foto</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Zoom Bar (Bottom-Right in Fullscreen Mode) */}
      {isFullscreen && (
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-black/70 p-1 backdrop-blur-md rounded-xl border border-[var(--bm-line)] shadow-xl">
          <button
            type="button"
            onClick={() => handleZoom(0.25)}
            disabled={zoomLevel >= 3.0}
            className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] disabled:opacity-30 transition cursor-pointer"
            title="Vergrößern"
            aria-label="Vergrößern"
          >
            <ZoomIn className="w-4 h-4 text-[var(--bm-accent)]" />
          </button>
          <span className="text-xs font-mono px-1 text-[var(--bm-text)] min-w-[2.8rem] text-center font-bold">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleZoom(-0.25)}
            disabled={zoomLevel <= 1}
            className="p-1.5 rounded-xl text-[var(--bm-text-2)] hover:text-[var(--bm-text)] hover:bg-[var(--bm-elevated)] disabled:opacity-30 transition cursor-pointer"
            title="Verkleinern"
            aria-label="Verkleinern"
          >
            <ZoomOut className="w-4 h-4 text-[var(--bm-accent)]" />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-xl text-[var(--bm-accent)] hover:bg-[var(--bm-elevated)] transition cursor-pointer"
              title="Passend zurücksetzen (100%)"
              aria-label="Zoom zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Canvas Viewport */}
      <div
        ref={viewportRef}
        className={
          isFullscreen
            ? `relative w-full h-full ${
                zoomLevel > 1 ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center'
              } bg-black touch-pan-x touch-pan-y overscroll-contain`
            : 'relative w-full overflow-auto bg-black'
        }
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          onMouseDown={handleContainerMouseDown}
          style={containerStyle}
          className={`relative block ${
            mode === 'setter' && isAddingEnabled ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          <img
            src={photoUrl}
            alt={sectorName || 'Wandfoto des Sektors'}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
            className={
              isFullscreen
                ? 'block w-full h-full object-fill select-none pointer-events-none rounded-xl'
                : 'block w-full h-auto select-none pointer-events-none rounded-xl'
            }
            draggable={false}
          />

          {/* Marquee / Box Selection Rectangle Overlay (AC-12) */}
          {isBoxSelecting && boxSelection && (
            <div
              data-testid="selection-rectangle"
              className="absolute border-2 border-dashed border-[var(--bm-accent)] bg-[var(--bm-accent)]/20 z-30 pointer-events-none"
              style={{
                left: `${boxSelection.startX * 100}%`,
                top: `${boxSelection.startY * 100}%`,
                width: `${Math.max(0, boxSelection.currentX - boxSelection.startX) * 100}%`,
                height: `${Math.max(0, boxSelection.currentY - boxSelection.startY) * 100}%`,
              }}
            >
              {/* Corner Rock Accents (SPEC-005 sharp edges) */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--bm-accent)]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--bm-accent)]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--bm-accent)]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--bm-accent)]" />
            </div>
          )}

          {/* Render Boulders / Pins with Dynamic Scaling (Circle shrinks relative to zoomed photo) */}
          {(() => {
            const pinScale = Math.max(0.40, Number((1 / Math.pow(zoomLevel, 0.75)).toFixed(3)));

            return boulders.map(boulder => {
              const scale = resolveScale(boulder);
              const colorHex = scale?.colorHex || (gradeScales[0]?.colorHex ?? '#22c55e');

              if (mode === 'climber') {
                const userAscent = userAscentMap?.get(boulder.id);
                const stats = statsMap?.get(boulder.id);
                const isFlash = userAscent?.type === 'flash';
                const isTop = userAscent?.type === 'top';
                const isProject = userAscent?.type === 'project';
                const isFiveStar = Boolean(stats && stats.avgStars >= 4.8 && stats.totalRatings >= 1);
                const isFavorite = Boolean(stats && stats.avgStars >= 4.2 && stats.totalRatings >= 1);
                const isDimmed =
                  filterMode !== 'all' && filteredBoulderIds && !filteredBoulderIds.has(boulder.id);

                return (
                  <button
                    key={boulder.id}
                    type="button"
                    data-testid={`pin-${boulder.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      if (onPinClick) onPinClick(boulder);
                    }}
                    onTouchStart={e => {
                      e.stopPropagation();
                    }}
                    style={{
                      left: `${boulder.positionX * 100}%`,
                      top: `${boulder.positionY * 100}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none transition-all flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 cursor-pointer ${
                      isDimmed ? 'opacity-25 hover:opacity-100 scale-90' : 'hover:scale-110'
                    }`}
                    title={`${boulder.name || scale?.colorName || 'Boulder'}${
                      stats && stats.totalRatings > 0 ? ` (${stats.avgStars.toFixed(1)} ★)` : ''
                    } (Tippen für Details)`}
                  >
                    {/* Visual Scaled Pin Container: visually shrinks as user zooms in, keeping holds clearly visible */}
                    <div
                      data-testid={`pin-visual-${boulder.id}`}
                      style={{
                        transform: `scale(${pinScale})`,
                        transformOrigin: 'center center',
                      }}
                      className="relative flex items-center justify-center pointer-events-none transition-transform duration-75"
                    >
                      {/* Pulse Ring / Favorite Sandstone Aura */}
                      <span
                        className={`absolute -inset-1.5 rounded-full pointer-events-none ${
                          isFiveStar
                            ? 'ring-2 ring-[var(--bm-accent)] opacity-95 animate-pulse bg-[var(--bm-accent)]/30'
                            : isFavorite
                            ? 'ring-2 ring-[var(--bm-accent)] opacity-90 animate-pulse'
                            : 'opacity-75 animate-ping'
                        }`}
                        style={{ backgroundColor: isFiveStar || isFavorite ? 'var(--bm-star)' : colorHex }}
                      />

                      {/* Main Pin Disc (SPEC-005: 50% circle) */}
                      <div
                        className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--bm-bg)] flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-[var(--bm-strong)] shadow-md ${
                          isFiveStar ? 'ring-2 ring-[var(--bm-accent)]' : ''
                        }`}
                        style={{ backgroundColor: colorHex }}
                      >
                        {/* SPEC-022 F20: Hallen-Klassiker als grosser, gut lesbarer Stern (statt winzigem «5.0») */}
                        {isFiveStar && (
                          <span
                            data-testid={`classic-badge-${boulder.id}`}
                            className="absolute -top-3.5 -right-3.5 z-30 w-6 h-6 rounded-full bg-[var(--bm-star)] border-2 border-[var(--bm-bg)] flex items-center justify-center shadow-md"
                            title={`Hallen-Klassiker (${stats?.avgStars.toFixed(1)} ★)`}
                          >
                            <Star className="w-4 h-4 fill-[var(--bm-bg)] text-[var(--bm-bg)]" />
                          </span>
                        )}

                        {/* SPEC-022 F19: Eigene Begehung als deutliches Abzeichen */}
                        {(isFlash || isTop) && (
                          <span
                            data-testid={`pin-status-${boulder.id}`}
                            aria-label={isFlash ? 'Flash' : 'Top'}
                            className={`absolute -bottom-3 -right-3.5 z-30 w-6 h-6 rounded-full border-2 border-[var(--bm-bg)] flex items-center justify-center shadow-md ${
                              isFlash ? 'bg-[var(--bm-star)]' : 'bg-[var(--bm-success)]'
                            }`}
                          >
                            {isFlash ? (
                              <Zap className="w-4 h-4 fill-[var(--bm-bg)] text-[var(--bm-bg)]" />
                            ) : (
                              <Check className="w-4 h-4 stroke-[3] text-[var(--bm-on-accent)]" />
                            )}
                          </span>
                        )}

                        {/* SPEC-021 AC-10: «Neu»-Badge */}
                        {newBoulderIds?.has(boulder.id) && (
                          <span
                            data-testid={`new-badge-${boulder.id}`}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-1 rounded-xl bg-[var(--bm-accent)] text-[var(--bm-on-accent)] border border-[var(--bm-bg)] text-[8px] font-mono font-black leading-tight shadow-md z-30"
                          >
                            Neu
                          </span>
                        )}

                        {/* Status Icon Indicator */}
                        {isFlash && <Zap className="w-4 h-4 text-[var(--bm-bg)] fill-[var(--bm-bg)]" />}
                        {isTop && !isFlash && <Trophy className="w-3.5 h-3.5 text-[var(--bm-bg)]" />}
                        {isProject && <Clock className="w-3.5 h-3.5 text-[var(--bm-bg)]" />}
                        {!userAscent && (
                          <span className="text-[11px] font-mono font-bold text-[var(--bm-bg)]">
                            {scale?.colorName?.[0] || '●'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }

              // Setter Mode
              const isDraft = boulder.status === 'draft';
              const isMarkedForArchive = pendingArchiveIds.includes(boulder.id) || boulder.status === 'archived';
              const isModified = pendingModifiedIds.includes(boulder.id);
              const isSelected = selectedBoulderId === boulder.id;
              const isMultiSelected = selectedBoulderIds.includes(boulder.id);
              const isDragging = draggingPinId === boulder.id;

              return (
                <div
                  key={boulder.id}
                  data-testid={`pin-${boulder.id}`}
                  style={{
                    left: `${boulder.positionX * 100}%`,
                    top: `${boulder.positionY * 100}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group flex items-center justify-center cursor-pointer"
                  onMouseDown={e => handlePinMouseDown(e, boulder.id)}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isDraggingRef.current && onPinClick) {
                      onPinClick(boulder);
                    }
                  }}
                >
                  {/* Scaled Pin Container for Setter Mode */}
                  <div
                    style={{
                      transform: `scale(${pinScale})`,
                      transformOrigin: 'center center',
                    }}
                    className="relative flex items-center justify-center transition-transform duration-75"
                  >
                    {/* Pin Circle */}
                    <div
                      className={`relative flex items-center justify-center transition-all duration-200 border-2 border-[var(--bm-bg)] ${
                    isDraft
                      ? 'w-9 h-9 rounded-full ring-2 ring-[var(--bm-strong)] scale-105'
                      : isMarkedForArchive
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-35 grayscale'
                      : isModified
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-95 ring-2 ring-[var(--bm-accent)] scale-105'
                      : 'w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-85 hover:opacity-100 hover:scale-110 ring-1 ring-[var(--bm-strong)]/70'
                  } ${isSelected ? 'ring-2 ring-[var(--bm-accent)] scale-125 z-30' : ''} ${
                    isMultiSelected ? 'ring-4 ring-[var(--bm-accent)] scale-125 z-30 shadow-lg' : ''
                  } ${
                    isDragging ? 'scale-125 opacity-90 cursor-grabbing' : ''
                  }`}
                  style={{
                    backgroundColor: colorHex,
                  }}
                >
                  {/* Inner Pin Icon / Details */}
                  {isDraft && <Sparkles className="w-4 h-4 text-[var(--bm-bg)]" />}
                  {isMarkedForArchive && <Archive className="w-3.5 h-3.5 text-[var(--bm-bg)]" />}
                  {isModified && !isDraft && !isMarkedForArchive && (
                    <Edit3 className="w-3 h-3 text-[var(--bm-bg)]" />
                  )}
                  {!isDraft && !isMarkedForArchive && !isModified && (
                    <div className="w-2 h-2 rounded-full bg-[var(--bm-bg)]/80" />
                  )}

                  {/* Strikethrough line if marked for archive */}
                  {isMarkedForArchive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-[var(--bm-danger)] rotate-45" />
                    </div>
                  )}

                  {/* Multi-Selection Checkmark Badge */}
                  {isMultiSelected && (
                    <span
                      data-testid={`selection-badge-${boulder.id}`}
                      className="absolute -top-1.5 -right-1.5 z-40 w-4 h-4 bg-[var(--bm-accent)] text-[var(--bm-bg)] flex items-center justify-center shadow-md font-bold rounded-xl"
                      title="Ausgewählt"
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Pin Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="bg-[var(--bm-surface)] text-[var(--bm-text)] text-xs font-mono px-3 py-1.5 rounded-xl border border-[var(--bm-line)] whitespace-nowrap flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xl inline-block border border-black/30"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span className="font-bold">{boulder.name || scale?.colorName || 'Boulder'}</span>
                    <span className="text-[var(--bm-text-2)] text-[10px]">({scale?.difficultyLabel})</span>
                    {isDraft && (
                      <span className="bg-[var(--bm-elevated)] text-[var(--bm-success)] text-[10px] px-1.5 py-0.5 rounded-xl border border-[var(--bm-success)]/40 font-bold">
                        Entwurf
                      </span>
                    )}
                    {isMarkedForArchive && (
                      <span className="bg-[var(--bm-elevated)] text-[var(--bm-danger)] text-[10px] px-1.5 py-0.5 rounded-xl border border-[var(--bm-danger)]/40 font-bold">
                        Archivieren
                      </span>
                    )}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[var(--bm-surface)] border-r border-b border-[var(--bm-line)] rotate-45 -mt-1" />
                </div>
              </div>
              </div>
            );
          })})()}
        </div>
      </div>
    </div>
  );
};
