import React, { useEffect, useRef } from 'react';

/**
 * SPEC-023 F4 · Rückfrage vor dem Löschen.
 * «Abbrechen» hat den Fokus; erst «confirm-ok» führt die Aktion aus.
 * Ohne onConfirm (z. B. gesperrtes Löschen) gibt es nur «OK».
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Löschen',
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      data-testid="confirm-dialog"
    >
      <div className="absolute inset-0 bg-[var(--bm-scrim)] bm-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {message && <p className="text-[15px] text-[var(--bm-text-2)]">{message}</p>}
        </div>
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            data-testid="confirm-cancel"
            className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-elevated)] text-[15px] font-semibold"
          >
            {onConfirm ? 'Abbrechen' : 'OK'}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              data-testid="confirm-ok"
              className="flex-1 min-h-[44px] rounded-xl bg-[var(--bm-danger)] text-[var(--bm-on-accent)] text-[15px] font-semibold"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
