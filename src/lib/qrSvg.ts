import qrcode from 'qrcode-generator';

/**
 * SPEC-029 F8 · QR-Code als SVG-Pfad (Fehlerkorrektur M, verträgt Kratzer und Kreide).
 * Ein Modul = 1 Einheit im viewBox; der Rand (Ruhezone) ist 4 Module breit.
 */
export interface QrSvgData {
  /** Seitenlänge inkl. Ruhezone in Modulen */
  size: number;
  /** SVG-Pfad aller dunklen Module */
  path: string;
}

export const QR_QUIET_ZONE = 4;

export function buildQrSvgData(text: string): QrSvgData {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  const parts: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        parts.push(`M${col + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`);
      }
    }
  }
  return { size: count + QR_QUIET_ZONE * 2, path: parts.join('') };
}
