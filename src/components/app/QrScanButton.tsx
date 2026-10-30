import React, { useState } from 'react';
import { ScanLine } from 'lucide-react';
import { t } from '../../lib/i18n';
import { isNativeApp } from '../../lib/app/platform';
import { parseAppLink } from '../../lib/app/appLinks';
import { handleAppUrl } from '../../lib/app/nativeShell';
import { showToast } from '../ui/Toast';

/** Ereignis: Wandliste öffnen (Ausweg, wenn der Scanner nicht geht) */
export const OPEN_WALL_LIST_EVENT = 'bouldermate:open-wall-list';

export type ScanOutcome = 'wall' | 'not-ours' | 'cancelled' | 'failed';

/** Ergebnis eines Scans einordnen (testbar ohne Kamera). */
export function classifyScan(rawValue: string | null | undefined): ScanOutcome {
  if (!rawValue) return 'cancelled';
  return parseAppLink(rawValue).kind === 'wall' ? 'wall' : 'not-ours';
}

async function scanOnce(): Promise<string | null> {
  const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
  // Kamera-Erlaubnis erst jetzt, beim Tippen (SPEC-045 AC-10)
  const perm = await BarcodeScanner.requestPermissions();
  if (perm.camera !== 'granted' && perm.camera !== 'limited') throw new Error('camera-denied');
  const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
  return barcodes[0]?.rawValue ?? null;
}

/**
 * SPEC-045 §4.2: QR-Scanner in der Kopfzeile (nur App). Löst automatisch aus, sobald ein Code erkannt ist.
 * Ausweg, wenn die Kamera nicht geht: Wandliste.
 */
export const QrScanButton: React.FC = () => {
  const [busy, setBusy] = useState(false);
  if (!isNativeApp()) return null;

  const openWallList = () => window.dispatchEvent(new CustomEvent(OPEN_WALL_LIST_EVENT));

  const onScan = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const raw = await scanOnce();
      const outcome = classifyScan(raw);
      if (outcome === 'wall') await handleAppUrl(raw!);
      else if (outcome === 'not-ours') showToast({ message: t('Das ist kein BoulderMate-Code einer Wand.') });
    } catch (err) {
      const cancelled = /cancel/i.test(String((err as any)?.message ?? err));
      if (!cancelled) {
        showToast({
          message: t('Scannen geht gerade nicht.'),
          actionLabel: t('Wand aus Liste wählen'),
          onAction: openWallList,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onScan}
      disabled={busy}
      className="w-12 h-12 rounded-full bg-[var(--bm-elevated)] text-[var(--bm-text)] flex items-center justify-center shrink-0"
      aria-label={t('QR-Code an der Wand scannen')}
      title={t('QR-Code scannen')}
      data-testid="app-scan"
    >
      <ScanLine className="w-6 h-6" aria-hidden />
    </button>
  );
};
