import React, { useEffect, useState } from 'react';

/**
 * SPEC-020 · Toast mit optionaler Aktion ("Rückgängig").
 * Globaler, abhängigkeitsfreier Store: showToast() von überall aufrufbar,
 * <ToastHost /> einmal in App rendern.
 */
export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optionaler Zusatzinhalt (z. B. Inline-Sterne) */
  content?: React.ReactNode;
  durationMs?: number;
}

type Listener = (t: (ToastOptions & { id: number }) | null) => void;
const listeners = new Set<Listener>();
let counter = 0;

export function showToast(opts: ToastOptions): void {
  counter += 1;
  const t = { ...opts, id: counter };
  listeners.forEach(l => l(t));
}

export function hideToast(): void {
  listeners.forEach(l => l(null));
}

export const ToastHost: React.FC = () => {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);

  useEffect(() => {
    const l: Listener = t => setToast(t);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.durationMs ?? 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      data-testid="toast"
      className="fixed left-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-[80] w-[calc(100%-2rem)] max-w-md bm-toast-in"
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="bm-material rounded-2xl shadow-xl px-4 py-3 text-[15px] text-[var(--bm-text)]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              data-testid="toast-action"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="text-[var(--bm-accent)] font-semibold shrink-0 min-h-[32px]"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        {toast.content && <div className="mt-2">{toast.content}</div>}
      </div>
    </div>
  );
};
