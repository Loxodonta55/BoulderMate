import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  formatBytes,
  readFileAsDataUrl,
  processLocalImageFile,
  processUploadedImage,
  WALL_PRESETS,
} from '../src/lib/imageUtils';

describe('imageUtils (SPEC-005)', () => {
  describe('validateImageFile', () => {
    it('should validate accepted image types', () => {
      const jpg = new File(['fake-jpg'], 'wall.jpg', { type: 'image/jpeg' });
      const png = new File(['fake-png'], 'sector.png', { type: 'image/png' });
      const webp = new File(['fake-webp'], 'topo.webp', { type: 'image/webp' });

      expect(validateImageFile(jpg).valid).toBe(true);
      expect(validateImageFile(png).valid).toBe(true);
      expect(validateImageFile(webp).valid).toBe(true);
    });

    it('should validate by file extension even if MIME type is missing', () => {
      const jpg = new File(['fake-jpg'], 'photo.JPG', { type: '' });
      expect(validateImageFile(jpg).valid).toBe(true);
    });

    it('should validate HEIC and HEIF photos from iPhone cameras', () => {
      const heicMime = new File(['fake-heic'], 'IMG_4821.HEIC', { type: 'image/heic' });
      const heifMime = new File(['fake-heif'], 'photo.heif', { type: 'image/heif' });
      const heicExtOnly = new File(['fake-heic'], 'wall_overhang.heic', { type: '' });
      const heicUpperExt = new File(['fake-heic'], 'DSC0012.HEIC', { type: 'application/octet-stream' });

      expect(validateImageFile(heicMime).valid).toBe(true);
      expect(validateImageFile(heifMime).valid).toBe(true);
      expect(validateImageFile(heicExtOnly).valid).toBe(true);
      expect(validateImageFile(heicUpperExt).valid).toBe(true);
    });

    it('should accept mobile files with empty or octet-stream MIME types if not explicitly non-image', () => {
      const mobileCameraPhoto = new File(['raw-pixel-data'], 'camera_capture_12984', { type: '' });
      const galleryExport = new File(['raw-bytes'], 'photo', { type: 'application/octet-stream' });

      expect(validateImageFile(mobileCameraPhoto).valid).toBe(true);
      expect(validateImageFile(galleryExport).valid).toBe(true);
    });

    it('should reject non-image file formats even with empty or generic MIME', () => {
      const pdf = new File(['fake-pdf'], 'topo.pdf', { type: 'application/pdf' });
      const txt = new File(['fake-txt'], 'notes.txt', { type: 'text/plain' });
      const docWithEmptyMime = new File(['doc'], 'document.docx', { type: '' });

      const pdfRes = validateImageFile(pdf);
      expect(pdfRes.valid).toBe(false);
      expect(pdfRes.error).toContain('Ungültiges Bildformat');

      const txtRes = validateImageFile(txt);
      expect(txtRes.valid).toBe(false);

      const docRes = validateImageFile(docWithEmptyMime);
      expect(docRes.valid).toBe(false);
    });

    it('should reject files that exceed maximum size', () => {
      // 26 MB file
      const hugeFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
      Object.defineProperty(hugeFile, 'size', { value: 26 * 1024 * 1024 });

      const res = validateImageFile(hugeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('zu groß');
    });

    it('should reject null or undefined file', () => {
      // @ts-expect-error testing runtime safety
      const res = validateImageFile(null);
      expect(res.valid).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 B correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes into KB', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2560)).toBe('2.5 KB');
    });

    it('should format bytes into MB', () => {
      expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    });
  });

  describe('WALL_PRESETS', () => {
    it('should contain predefined realistic wall presets', () => {
      expect(WALL_PRESETS.length).toBeGreaterThanOrEqual(3);
      WALL_PRESETS.forEach(preset => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.url).toMatch(/^(\/|https?:\/\/)/);
      });
    });
  });

  describe('readFileAsDataUrl and processLocalImageFile', () => {
    it('should read file into data URL', async () => {
      const file = new File(['hello-boulder'], 'test.png', { type: 'image/png' });
      const dataUrl = await readFileAsDataUrl(file);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('should reject processing invalid file', async () => {
      const badFile = new File(['text'], 'test.txt', { type: 'text/plain' });
      await expect(processLocalImageFile(badFile)).rejects.toThrow('Ungültiges Bildformat');
    });

    it('should process and return processed image result', async () => {
      const file = new File(['pixel'], 'boulder.jpg', { type: 'image/jpeg' });
      const result = await processLocalImageFile(file);

      expect(result.dataUrl).toBeTruthy();
      expect(result.dataUrl).toMatch(/^data:image\//);
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should process HEIC photo from iPhone without error', async () => {
      const heicFile = new File(['fake-heic-binary'], 'IMG_9942.HEIC', { type: 'image/heic' });
      const result = await processLocalImageFile(heicFile);

      expect(result.dataUrl).toBeTruthy();
      expect(result.dataUrl).toMatch(/^data:image\//);
      expect(result.originalSize).toBe(heicFile.size);
    });

    it('processUploadedImage should return dataUrl directly', async () => {
      const file = new File(['pixel'], 'boulder.jpg', { type: 'image/jpeg' });
      const url = await processUploadedImage(file);
      expect(url).toMatch(/^data:image\//);
    });
  });
});
