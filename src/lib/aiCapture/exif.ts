// SPEC-052: Handyfotos sind oft nur per EXIF «gedreht». Die App zeigt sie aufrecht,
// die Pins (0–1) beziehen sich also auf das aufrechte Bild. Sieht das Modell die
// Rohpixel, müssen seine Koordinaten zurückgerechnet werden.

/** EXIF-Orientierung (1–8) aus JPEG-Bytes; 1, wenn keine gefunden. */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && bytes[offset + 4] === 0x45 && bytes[offset + 5] === 0x78 && bytes[offset + 6] === 0x69 && bytes[offset + 7] === 0x66) {
      const tiff = offset + 10;
      const little = bytes[tiff] === 0x49;
      const u16 = (p: number) => (little ? bytes[p] | (bytes[p + 1] << 8) : (bytes[p] << 8) | bytes[p + 1]);
      const u32 = (p: number) => (little
        ? (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0
        : ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0);
      const ifd = tiff + u32(tiff + 4);
      const entries = u16(ifd);
      for (let i = 0; i < entries; i++) {
        const e = ifd + 2 + i * 12;
        if (e + 10 > bytes.length) break;
        if (u16(e) === 0x0112) {
          const v = u16(e + 8);
          return v >= 1 && v <= 8 ? v : 1;
        }
      }
      return 1;
    }
    if (marker === 0xda) return 1; // Bilddaten beginnen, kein EXIF mehr
    offset += 2 + size;
  }
  return 1;
}

/** Punkt im Rohbild (0–1) → Punkt im aufrecht angezeigten Bild (0–1). */
export function rawToUpright(x: number, y: number, orientation: number): { x: number; y: number } {
  switch (orientation) {
    case 2: return { x: 1 - x, y };
    case 3: return { x: 1 - x, y: 1 - y };
    case 4: return { x, y: 1 - y };
    case 5: return { x: y, y: x };
    case 6: return { x: 1 - y, y: x };
    case 7: return { x: 1 - y, y: 1 - x };
    case 8: return { x: y, y: 1 - x };
    default: return { x, y };
  }
}

/** true, wenn Breite und Höhe beim Aufrichten getauscht werden. */
export const orientationSwapsAxes = (orientation: number) => orientation >= 5 && orientation <= 8;
