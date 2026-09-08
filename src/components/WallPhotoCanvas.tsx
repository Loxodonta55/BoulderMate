import React, { useState, useRef, useCallback } from 'react';
import { WallBoulder, GymGradeScale } from '../types/boulder';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Archive, Sparkles, Camera } from 'lucide-react';

interface WallPhotoCanvasProps {
  photoUrl: string;
  boulders: WallBoulder[];
  gradeScales: GymGradeScale[];
  pendingArchiveIds: string[];
  selectedBoulderId: string | null;
  onPhotoClick: (x: number, y: number) => void;
  onPinClick: (boulder: WallBoulder) => void;
  onPinMove: (boulderId: string, newX: number, newY: number) => void;
  isAddingEnabled?: boolean;
  onChangePhoto?: () => void;
}

export const WallPhotoCanvas: React.FC<WallPhotoCanvasProps> = ({
  photoUrl,
  boulders,
  gradeScales,
  pendingArchiveIds,
  selectedBoulderId,
  onPhotoClick,
  onPinClick,
  onPinMove,
  isAddingEnabled = true,
  onChangePhoto,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const scaleMap = new Map<string, GymGradeScale>();
  gradeScales.forEach(s => scaleMap.set(s.id, s));

  // Compute click coordinates relative to image (0.0 to 1.0)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If just finished dragging, prevent click
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (!containerRef.current || !isAddingEnabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Clamp between 0.0 and 1.0
    const clampedX = Math.max(0, Math.min(1, clickX));
    const clampedY = Math.max(0, Math.min(1, clickY));

    onPhotoClick(clampedX, clampedY);
  };

  // Drag handling
  const handlePinMouseDown = (e: React.MouseEvent, boulderId: string) => {
    e.stopPropagation();
    setDraggingPinId(boulderId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    isDraggingRef.current = false;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPinId || !containerRef.current || !dragStartPos) return;

    const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
    if (dist > 5) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
      const newY = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));
      onPinMove(draggingPinId, newX, newY);
    }
  }, [draggingPinId, dragStartPos, onPinMove]);

  const handleMouseUp = () => {
    if (draggingPinId) {
      setDraggingPinId(null);
      setDragStartPos(null);
      // Small timeout so click doesn't trigger immediately
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(1, Math.min(2.5, Number((prev + delta).toFixed(1)))));
  };

  return (
    <div className="relative w-full rounded-none overflow-hidden border border-[#333333] select-none">
      {/* Zoom & Instruction Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#1E1E1E] px-3 py-1.5 rounded-none border border-[#333333] text-xs font-mono text-[#E8E0D4]">
        <Crosshair className="w-3.5 h-3.5 text-[#C9A96E]" />
        <span>Tippe auf Wand für Pin</span>
        <span className="text-[#6B6358]">|</span>
        <span>Drag = Verschieben</span>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#1E1E1E] p-1 rounded-none border border-[#333333]">
        <button
          type="button"
          onClick={() => handleZoom(0.25)}
          disabled={zoomLevel >= 2.5}
          className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] disabled:opacity-30 transition"
          title="Vergrößern"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono px-1.5 text-[#E8E0D4] min-w-[3rem] text-center font-bold">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          onClick={() => handleZoom(-0.25)}
          disabled={zoomLevel <= 1}
          className="p-1.5 rounded-[2px] text-[#A89F91] hover:text-[#E8E0D4] hover:bg-[#2A2A2A] disabled:opacity-30 transition"
          title="Verkleinern"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoomLevel > 1 && (
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-[2px] text-[#C9A96E] hover:bg-[#2A2A2A] transition"
            title="Zoom zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {onChangePhoto && (
          <>
            <span className="w-px h-4 bg-[#333333] mx-0.5" />
            <button
              type="button"
              onClick={onChangePhoto}
              className="p-1.5 rounded-[2px] text-[#C9A96E] hover:text-[#F5F0E8] hover:bg-[#2A2A2A] transition flex items-center gap-1 text-xs font-mono"
              title="Foto aufnehmen oder hochladen"
              data-testid="canvas-camera-btn"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Foto</span>
            </button>
          </>
        )}
      </div>

      {/* Wall Photo & Canvas Area */}
      <div
        className="relative overflow-auto max-h-[75vh] flex items-center justify-center p-0 cursor-crosshair bg-black"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          className="relative inline-block transition-transform duration-150 ease-out w-full max-w-full rounded-none overflow-hidden border border-[#333333]"
        >
          <img
            src={photoUrl}
            alt="Wandfoto des Sektors"
            className="block w-full h-auto select-none pointer-events-none rounded-none"
          />

          {/* Render Boulders / Pins (SPEC-005: 50% circle is sole exception for wall pins) */}
          {boulders.map(boulder => {
            const scale = scaleMap.get(boulder.gradeScaleId);
            const colorHex = scale?.colorHex || '#3b82f6';
            const isDraft = boulder.status === 'draft';
            const isMarkedForArchive = pendingArchiveIds.includes(boulder.id) || boulder.status === 'archived';
            const isSelected = selectedBoulderId === boulder.id;
            const isDragging = draggingPinId === boulder.id;

            return (
              <div
                key={boulder.id}
                data-testid={`pin-${boulder.id}`}
                style={{
                  left: `${boulder.positionX * 100}%`,
                  top: `${boulder.positionY * 100}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group flex items-center justify-center"
                onMouseDown={e => handlePinMouseDown(e, boulder.id)}
                onClick={e => {
                  e.stopPropagation();
                  if (!isDraggingRef.current) {
                    onPinClick(boulder);
                  }
                }}
              >
                {/* Pin Circle */}
                <div
                  className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 border-2 border-[#121212] ${
                    isDraft
                      ? 'w-9 h-9 rounded-full ring-2 ring-[#F5F0E8] scale-105'
                      : isMarkedForArchive
                      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-35 grayscale'
                      : 'w-7 h-7 sm:w-8 sm:h-8 rounded-full opacity-85 hover:opacity-100 hover:scale-110 ring-1 ring-[#F5F0E8]/70'
                  } ${isSelected ? 'ring-2 ring-[#C9A96E] scale-125 z-30' : ''} ${
                    isDragging ? 'scale-125 opacity-90 cursor-grabbing' : ''
                  }`}
                  style={{
                    backgroundColor: colorHex,
                  }}
                >
                  {/* Inner Pin Icon / Details */}
                  {isDraft && (
                    <Sparkles className="w-4 h-4 text-[#121212]" />
                  )}
                  {isMarkedForArchive && (
                    <Archive className="w-3.5 h-3.5 text-[#121212]" />
                  )}
                  {!isDraft && !isMarkedForArchive && (
                    <div className="w-2 h-2 rounded-full bg-[#121212]/80" />
                  )}

                  {/* Strikethrough line if marked for archive */}
                  {isMarkedForArchive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-[#A0522D] rotate-45" />
                    </div>
                  )}
                </div>

                {/* Pin Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="bg-[#1E1E1E] text-[#E8E0D4] text-xs font-mono px-3 py-1.5 rounded-none border border-[#333333] whitespace-nowrap flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-none inline-block border border-black/30"
                      style={{ backgroundColor: colorHex }}
                    />
                    <span className="font-bold">{boulder.name || scale?.colorName || 'Boulder'}</span>
                    <span className="text-[#A89F91] text-[10px]">({scale?.difficultyLabel})</span>
                    {isDraft && (
                      <span className="bg-[#2A2A2A] text-[#4A5D3A] text-[10px] px-1.5 py-0.5 rounded-none border border-[#4A5D3A]/40 font-bold">
                        Entwurf
                      </span>
                    )}
                    {isMarkedForArchive && (
                      <span className="bg-[#2A2A2A] text-[#A0522D] text-[10px] px-1.5 py-0.5 rounded-none border border-[#A0522D]/40 font-bold">
                        Archivieren
                      </span>
                    )}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#1E1E1E] border-r border-b border-[#333333] rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
