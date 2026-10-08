import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye } from 'lucide-react';
import { VIEW_AS_OPTIONS, ViewAsMode, getViewAsLabel } from '../lib/viewAsService';

/**
 * SPEC-027 · «Ansehen als …»: schwebender Umschalter für Plattform-Admins.
 * Zeigt die App so, wie ein Hallen-Admin, Schrauber oder reiner Kletterer sie sieht.
 * App.tsx blendet ihn nur für echte Plattform-Admins ein.
 */
export interface ViewAsSwitcherProps {
  mode: ViewAsMode;
  onChange: (mode: ViewAsMode) => void;
  /** Über der unteren Leiste der Kletterer-Ansicht (Handy) platzieren */
  raised?: boolean;
}

export const ViewAsSwitcher: React.FC<ViewAsSwitcherProps> = ({ mode, onChange, raised = false }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isPreview = mode !== 'echt';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const choose = (next: ViewAsMode) => {
    setOpen(false);
    if (next !== mode) onChange(next);
  };

  return (
    <div
      ref={rootRef}
      className={`fixed left-3 z-50 ${
        raised ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4' : 'bottom-4'
      }`}
      data-testid="view-as"
    >
      {open && (
        <div
          role="menu"
          aria-label="Ansehen als"
          className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-surface)] shadow-2xl p-2"
          data-testid="view-as-menu"
        >
          <div className="px-3 pt-2 pb-1 text-sm font-bold text-[var(--bm-text)]">Ansehen als …</div>
          {VIEW_AS_OPTIONS.map(opt => {
            const active = opt.mode === mode;
            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(opt.mode)}
                data-testid={`view-as-option-${opt.mode}`}
                className={`w-full min-h-[52px] flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  active ? 'bg-[var(--bm-elevated)]' : 'hover:bg-[var(--bm-elevated)]'
                }`}
              >
                <span className="flex-1">
                  <span className="block text-base font-semibold text-[var(--bm-text)]">{opt.label}</span>
                  <span className="block text-sm text-[var(--bm-text-2)]">{opt.hint}</span>
                </span>
                {active && <Check className="w-6 h-6 text-[var(--bm-accent)] shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="view-as-toggle"
        title="Ansehen als …"
        className={`min-h-[48px] flex items-center gap-2 rounded-full px-4 shadow-xl border text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bm-accent)] ${
          isPreview
            ? 'bg-[var(--bm-accent)] text-[var(--bm-on-accent)] border-transparent'
            : 'bg-[var(--bm-surface)] text-[var(--bm-text)] border-[var(--bm-line)]'
        }`}
      >
        <Eye className="w-6 h-6 shrink-0" strokeWidth={2.25} />
        <span data-testid="view-as-label">{isPreview ? `Ansicht: ${getViewAsLabel(mode)}` : 'Ansehen als …'}</span>
      </button>
    </div>
  );
};
