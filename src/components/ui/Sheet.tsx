import React, { useEffect, useRef, useState } from 'react';

/**
 * SPEC-020 · Bottom Sheet (iOS-Detents: "half" | "full").
 * - Grabber oben: nach oben ziehen = voll, nach unten ziehen = halb/schliessen.
 * - Tap auf Scrim schliesst.
 */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Kontrollierter Detent. Default: "half" (Inhalt bestimmt Höhe, max. 60dvh) */
  detent?: 'half' | 'full';
  onDetentChange?: (d: 'half' | 'full') => void;
  /** Sheet ohne Detent-Logik, Höhe passt sich dem Inhalt an (max 90dvh) */
  fitContent?: boolean;
  testId?: string;
  ariaLabel?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  children,
  detent = 'half',
  onDetentChange,
  fitContent = false,
  testId,
  ariaLabel,
}) => {
  const startY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!open) setDragOffset(0);
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    setDragOffset(Math.max(dy, -80));
  };
  const onTouchEnd = () => {
    const dy = dragOffset;
    startY.current = null;
    setDragOffset(0);
    if (dy < -40 && detent === 'half' && onDetentChange && !fitContent) {
      onDetentChange('full');
    } else if (dy > 70) {
      if (detent === 'full' && onDetentChange && !fitContent) onDetentChange('half');
      else onClose();
    }
  };

  const heightClass = fitContent
    ? 'max-h-[90dvh]'
    : detent === 'full'
    ? 'h-[92dvh]'
    : 'max-h-[62dvh]';

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={ariaLabel} data-testid={testId}>
      <div
        className="absolute inset-0 bg-[var(--bm-scrim)] bm-fade-in"
        onClick={onClose}
        data-testid={testId ? `${testId}-scrim` : undefined}
      />
      <div
        className={`absolute left-0 right-0 bottom-0 mx-auto w-full max-w-xl bg-[var(--bm-surface)] text-[var(--bm-text)] rounded-t-[20px] shadow-2xl flex flex-col bm-sheet-in ${heightClass} transition-[height] duration-300`}
        style={{ transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined }}
      >
        <div
          className="pt-2 pb-1 flex justify-center cursor-grab touch-none shrink-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => {
            if (!fitContent && onDetentChange) onDetentChange(detent === 'half' ? 'full' : 'half');
          }}
          aria-label={detent === 'half' ? 'Mehr anzeigen' : 'Weniger anzeigen'}
          role="button"
        >
          <span className="w-9 h-[5px] rounded-full bg-[var(--bm-line)]" />
        </div>
        <div className="overflow-y-auto overscroll-contain flex-1 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </div>
    </div>
  );
};
