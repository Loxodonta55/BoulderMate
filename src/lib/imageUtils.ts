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

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
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
  {
    id: '6a-slab-vorne',
    name: 'Slab Vorne (6a plus)',
    description: 'Plattenwand im vorderen Bereich der 6a plus',
    url: '/images/walls/6aplus/SlapVorne.jpg',
  },
  {
    id: '6a-ecke-vorne',
    name: 'Ecke Vorne (6a plus)',
    description: 'Wandbereich Ecke Vorne der 6a plus',
    url: '/images/walls/6aplus/EckeVorne.jpg',
  },
  {
    id: '6a-zwischenwand-vorne',
    name: 'Zwischenwand Vorne (6a plus)',
    description: 'Zwischenwand im vorderen Bereich der 6a plus',
    url: '/images/walls/6aplus/ZwischenwandVorne.jpg',
  },
  {
    id: '6a-ueberhang-vorne',
    name: 'Überhang Vorne (6a plus)',
    description: 'Steiler Überhang vorne in der 6a plus',
    url: '/images/walls/6aplus/UerberhangVorne.jpg',
  },
  {
    id: '6a-verlaengerung-ueberhang',
    name: 'Verlängerung Überhang (6a plus)',
    description: 'Verlängerungsbereich des vorderen Überhangs in der 6a plus',
    url: '/images/walls/6aplus/VerlaengerungUeberhang.jpg',
  },
  {
    id: '6a-ecke-mitte',
    name: 'Ecke Mitte (6a plus)',
    description: 'Eckbereich in der Mitte der Halle 6a plus',
    url: '/images/walls/6aplus/EckeMitte.jpg',
  },
  {
    id: '6a-cave',
    name: 'Cave (6a plus)',
    description: 'Cave / Dachhöhle der 6a plus',
    url: '/images/walls/6aplus/Cave.jpg',
  },
  {
    id: '6a-cave-wand',
    name: 'Cave Wand (6a plus)',
    description: 'Wandbereich der Cave in der 6a plus',
    url: '/images/walls/6aplus/CaveWand.jpg',
  },
];

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
];

const MAX_RAW_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit for raw uploads

/**
 * Validates whether a file is a supported image and within raw size limits.
 * Specially tuned for mobile browsers (iOS Safari, Android Chrome) where camera intents
 * or gallery pickers may return HEIC/HEIF, empty MIME types, or application/octet-stream.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'Keine Datei ausgewählt.' };
  }

  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // Explicitly reject non-image files (documents, text, audio, video, archives, code)
  const isNonImageMime =
    type.startsWith('application/pdf') ||
    type.startsWith('text/') ||
    type.startsWith('video/') ||
    type.startsWith('audio/') ||
    type === 'application/zip' ||
    type === 'application/json';

  const isNonImageExt = /\.(pdf|txt|docx?|xlsx?|zip|tar|gz|mp4|mov|avi|mp3|wav|json|html|css|js|ts|tsx|jsx)$/i.test(
    name
  );

  if (isNonImageMime || isNonImageExt) {
    return {
      valid: false,
      error: 'Ungültiges Bildformat. Erlaubt sind JPG, PNG, WebP, GIF, AVIF, HEIC oder BMP.',
    };
  }

  // Accept any image/* mime type, recognized formats, or common mobile formats
  const isAcceptedType =
    type.startsWith('image/') ||
    ACCEPTED_MIME_TYPES.includes(type) ||
    /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i.test(name) ||
    // On mobile devices, files picked from camera or gallery often have empty type or generic type
    type === '' ||
    type === 'application/octet-stream';

  if (!isAcceptedType) {
    return {
      valid: false,
      error: 'Ungültiges Bildformat. Erlaubt sind JPG, PNG, WebP, GIF, AVIF, HEIC oder BMP.',
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
 * Targets max 1600px dimension and ~0.82 JPEG quality.
 *
 * Mobile-Hardened:
 * 1. Uses off-thread createImageBitmap where available (auto EXIF orientation).
 * 2. Uses URL.createObjectURL instead of multi-megabyte base64 strings in Image.src to prevent WebKit data URL limits.
 * 3. Provides resilient fallbacks so transient decode errors never block sector creation.
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

  // If in environment without window/Image/canvas or jsdom (no native image decoding), return data URL
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
  if (typeof window === 'undefined' || typeof Image === 'undefined' || isJsdom) {
    const rawDataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl: rawDataUrl,
      originalSize: file.size,
      compressedSize: Math.round((rawDataUrl.length * 3) / 4),
      width: 1200,
      height: 800,
      mimeType: file.type || 'image/jpeg',
    };
  }

  // 1. Off-thread decoding via createImageBitmap (modern, respects EXIF orientation)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() =>
        createImageBitmap(file)
      );
      let width = bitmap.width;
      let height = bitmap.height;

      if (!width || !height) {
        width = 1200;
        height = 800;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        if (typeof (bitmap as any).close === 'function') {
          (bitmap as any).close();
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        if (compressedDataUrl && compressedDataUrl.startsWith('data:image/jpeg')) {
          const approxSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);
          return {
            dataUrl: compressedDataUrl,
            originalSize: file.size,
            compressedSize: approxSizeBytes,
            width,
            height,
            mimeType: 'image/jpeg',
          };
        }
      } else {
        if (typeof (bitmap as any).close === 'function') {
          (bitmap as any).close();
        }
      }
    } catch {
      // Fall through to Image with ObjectURL / DataURL
    }
  }

  // 2. HTMLImageElement with ObjectURL (memory-efficient streaming, avoids base64 in memory)
  let objectUrl: string | null = null;
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      objectUrl = URL.createObjectURL(file);
    }
  } catch {
    objectUrl = null;
  }

  const srcUrl = objectUrl || (await readFileAsDataUrl(file));

  return new Promise<ProcessedImageResult>((resolve, reject) => {
    const img = new Image();

    const cleanup = () => {
      if (objectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    };

    img.onload = () => {
      cleanup();
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          width = 1200;
          height = 800;
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          readFileAsDataUrl(file).then(rawUrl => {
            resolve({
              dataUrl: rawUrl,
              originalSize: file.size,
              compressedSize: rawUrl.length,
              width,
              height,
              mimeType: file.type || 'image/jpeg',
            });
          }).catch(reject);
          return;
        }

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
        readFileAsDataUrl(file).then(rawUrl => {
          resolve({
            dataUrl: rawUrl,
            originalSize: file.size,
            compressedSize: rawUrl.length,
            width: 1200,
            height: 800,
            mimeType: file.type || 'image/jpeg',
          });
        }).catch(() => {
          reject(err instanceof Error ? err : new Error('Fehler bei der Bildkomprimierung.'));
        });
      }
    };

    img.onerror = async () => {
      cleanup();
      // Resilient fallback: If Image decode failed (e.g. WebKit memory or unknown header),
      // try reading as data URL so the user is never blocked
      try {
        const rawUrl = await readFileAsDataUrl(file);
        resolve({
          dataUrl: rawUrl,
          originalSize: file.size,
          compressedSize: rawUrl.length,
          width: 1200,
          height: 800,
          mimeType: file.type || 'image/jpeg',
        });
      } catch {
        reject(new Error('Die Bilddatei konnte nicht geladen oder dekodiert werden.'));
      }
    };

    img.src = srcUrl;
  });
}

/**
 * Convenience helper returning the compressed data URL directly
 */
export async function processUploadedImage(file: File): Promise<string> {
  const result = await processLocalImageFile(file);
  return result.dataUrl;
}

/**
 * Captures the current frame of an active HTMLVideoElement into a compressed JPEG Data URL.
 * Validates video availability and ensures proper aspect ratio preservation.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  maxDimension = 1600,
  quality = 0.85
): string {
  if (!video) {
    throw new Error('Kein Video-Element für die Aufnahme vorhanden.');
  }

  let width = video.videoWidth;
  let height = video.videoHeight;

  // If video dimensions not yet exposed (e.g. readyState < 2 or mocked in tests),
  // fallback to client dimensions or standard 1280x720 video resolution
  if (!width || !height) {
    if (video.clientWidth > 0 && video.clientHeight > 0) {
      width = video.clientWidth;
      height = video.clientHeight;
    } else {
      width = 1280;
      height = 720;
    }
  }

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  return '';
}

/**
 * Check if the current browser environment supports camera access via getUserMedia
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Derives a clean, readable sector name from an uploaded file name.
 * e.g. "Wettkampfwand_Vorne.jpg" -> "Wettkampfwand Vorne"
 */
export function cleanFileNameToSectorName(fileName: string, fallbackIndex?: number): string {
  if (!fileName) {
    return fallbackIndex !== undefined ? `Sektor ${fallbackIndex}` : 'Neuer Sektor';
  }
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[_\-.]+/g, ' ').trim();
  if (cleaned.length === 0) {
    return fallbackIndex !== undefined ? `Sektor ${fallbackIndex}` : 'Neuer Sektor';
  }
  // If it's something like "IMG 1234" or "PXL 2026", provide a friendlier name if index given
  if (/^(img|pxl|dsc|photo|image)[\s\d]+$/i.test(cleaned) && fallbackIndex !== undefined) {
    return `Sektor ${fallbackIndex} (${cleaned})`;
  }
  return cleaned;
}

