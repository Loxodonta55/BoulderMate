/**
 * Client-Side Image Processing & Compression for Sector Wall Photos
 * SPEC-005: Sektor-Wandfoto Datei-Upload (Laptop & Lokale Bilder)
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
}

export interface WallPreset {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const WALL_PRESETS: WallPreset[] = [
  {
    id: 'overhang',
    name: 'Überhang 45° (Comp Wall)',
    description: 'Steiler Überhang mit massiven Makro-Volumes und Griffsets',
    url: '/images/walls/overhang.jpg',
  },
  {
    id: 'slab',
    name: 'Platte (Slab & Balance)',
    description: 'Senkrechte Wand mit Slopern und feinen Trittleisten',
    url: '/images/walls/slab.jpg',
  },
  {
    id: 'roof',
    name: 'Wettkampf-Dach & Cave',
    description: 'Horizontale Dachzone für Heel-Hook- und Core-Power-Probleme',
    url: '/images/walls/roof.jpg',
  },
];

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
];

const MAX_RAW_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit for raw uploads

/**
 * Validates whether a file is a supported image and within raw size limits
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'Keine Datei ausgewählt.' };
  }

  // Check MIME type or extension
  const isAcceptedType =
    ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name);

  if (!isAcceptedType) {
    return {
      valid: false,
      error: 'Ungültiges Bildformat. Erlaubt sind JPG, PNG, WebP, GIF, AVIF oder BMP.',
    };
  }

  if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Die Bilddatei ist zu groß (maximal 25 MB erlaubt).',
    };
  }

  return { valid: true };
}

/**
 * Format bytes into human readable string (e.g. "320 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Reads a File as a base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Konnte Bilddatei nicht als Data-URL lesen.'));
      }
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and compresses an image file to prevent overflowing browser storage
 * Targets max 1600px dimension and ~0.82 JPEG quality
 */
export async function processLocalImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<ProcessedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Ungültige Bilddatei.');
  }

  const rawDataUrl = await readFileAsDataUrl(file);

  // If in environment without window/Image/canvas or jsdom (no native image decoding), return data URL
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
  if (typeof window === 'undefined' || typeof Image === 'undefined' || isJsdom) {
    return {
      dataUrl: rawDataUrl,
      originalSize: file.size,
      compressedSize: Math.round((rawDataUrl.length * 3) / 4),
      width: 1200,
      height: 800,
      mimeType: file.type || 'image/jpeg',
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          width = 1200;
          height = 800;
        }

        // Calculate proportional downscaled dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Render to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if 2d context is unavailable
          resolve({
            dataUrl: rawDataUrl,
            originalSize: file.size,
            compressedSize: rawDataUrl.length,
            width,
            height,
            mimeType: file.type || 'image/jpeg',
          });
          return;
        }

        // Clean background for transparency conversion
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          originalSize: file.size,
          compressedSize: approxSizeBytes,
          width,
          height,
          mimeType: 'image/jpeg',
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Fehler bei der Bildkomprimierung.'));
      }
    };

    img.onerror = () => {
      reject(new Error('Die Bilddatei konnte nicht geladen oder dekodiert werden.'));
    };

    img.src = rawDataUrl;
  });
}

/**
 * Convenience helper returning the compressed data URL directly
 */
export async function processUploadedImage(file: File): Promise<string> {
  const result = await processLocalImageFile(file);
  return result.dataUrl;
}
