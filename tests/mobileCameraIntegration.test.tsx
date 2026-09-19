import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WallPhotoUploadModal } from '../src/components/WallPhotoUploadModal';
import * as imageUtils from '../src/lib/imageUtils';

describe('SPEC-017: Mobile Schrauber-Kamera-Integration & Wandfoto-Erfassung', () => {
  let mockTracks: { stop: ReturnType<typeof vi.fn> }[];
  let mockStream: any;
  let originalMediaDevices: any;

  beforeEach(() => {
    mockTracks = [{ stop: vi.fn() }];
    mockStream = {
      getTracks: vi.fn(() => mockTracks),
      active: true,
    };

    originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: originalMediaDevices,
    });
    vi.restoreAllMocks();
  });

  it('AC-1: defaults to camera tab when opened on mobile or by setter', () => {
    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Cave"
        onClose={() => {}}
        onPhotoSelected={() => {}}
      />
    );

    const cameraTab = screen.getByRole('button', { name: /Foto machen/i });
    expect(cameraTab.className).toContain('bg-[#F5F0E8]');
  });

  it('AC-2: guarantees MediaStream binding to video element and starts playback without black screen', async () => {
    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Cave"
        initialTab="camera"
        onClose={() => {}}
        onPhotoSelected={() => {}}
      />
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });

    const videoEl = await screen.findByTestId('camera-video-viewfinder') as HTMLVideoElement;
    expect(videoEl).toBeInTheDocument();
    // Verify stream was assigned to video.srcObject (the core fix)
    expect(videoEl.srcObject).toBe(mockStream);
  });

  it('AC-4: captures live photo, displays instant review card, and allows 1-tap confirmation', async () => {
    const onPhotoSelected = vi.fn();
    const mockDataUrl = 'data:image/jpeg;base64,mockCapture123';

    vi.spyOn(imageUtils, 'captureVideoFrame').mockReturnValue(mockDataUrl);

    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Überhang"
        initialTab="camera"
        onClose={() => {}}
        onPhotoSelected={onPhotoSelected}
      />
    );

    const shutterBtn = await screen.findByTestId('capture-photo-button');
    expect(shutterBtn).toBeInTheDocument();

    fireEvent.click(shutterBtn);

    // Review card must be displayed immediately
    const previewImg = await screen.findByTestId('captured-photo-preview');
    expect(previewImg).toBeInTheDocument();
    expect(previewImg.getAttribute('src')).toBe(mockDataUrl);

    // 1-tap confirm button
    const instantConfirmBtn = screen.getByTestId('instant-confirm-photo-btn');
    expect(instantConfirmBtn).toBeInTheDocument();

    fireEvent.click(instantConfirmBtn);
    expect(onPhotoSelected).toHaveBeenCalledWith(mockDataUrl);
  });

  it('AC-4: supports instant retake to discard photo and re-open live viewfinder', async () => {
    const mockDataUrl = 'data:image/jpeg;base64,mockBlurryPhoto';
    vi.spyOn(imageUtils, 'captureVideoFrame').mockReturnValue(mockDataUrl);

    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Überhang"
        initialTab="camera"
        onClose={() => {}}
        onPhotoSelected={() => {}}
      />
    );

    const shutterBtn = await screen.findByTestId('capture-photo-button');
    fireEvent.click(shutterBtn);

    const retakeBtn = await screen.findByTestId('instant-retake-photo-btn');
    expect(retakeBtn).toBeInTheDocument();

    // Click retake
    fireEvent.click(retakeBtn);

    // Should return to live viewfinder
    expect(screen.queryByTestId('captured-photo-preview')).not.toBeInTheDocument();
    expect(await screen.findByTestId('camera-video-viewfinder')).toBeInTheDocument();
  });

  it('AC-5: allows toggling camera facing mode between environment and user', async () => {
    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Platte"
        initialTab="camera"
        onClose={() => {}}
        onPhotoSelected={() => {}}
      />
    );

    const toggleFacingBtn = await screen.findByTestId('toggle-camera-facing-btn');
    expect(toggleFacingBtn).toBeInTheDocument();

    // Initial call was with environment
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: 'environment' } }),
      })
    );

    // Click toggle facing button
    fireEvent.click(toggleFacingBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({ facingMode: { ideal: 'user' } }),
        })
      );
    });
  });

  it('AC-3: triggers native system camera input with capture="environment" when button clicked', async () => {
    const onPhotoSelected = vi.fn();
    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Platte"
        initialTab="camera"
        onClose={() => {}}
        onPhotoSelected={onPhotoSelected}
      />
    );

    const nativeInput = screen.getByTestId('native-camera-input') as HTMLInputElement;
    expect(nativeInput).toBeInTheDocument();
    expect(nativeInput.getAttribute('capture')).toBe('environment');

    const mockFile = new File(['phone-pixels'], 'handy_foto.jpg', { type: 'image/jpeg' });
    fireEvent.change(nativeInput, { target: { files: [mockFile] } });

    // Review card shows captured file
    await waitFor(() => {
      expect(screen.getByTestId('captured-photo-preview')).toBeInTheDocument();
    });

    // 1-tap confirm
    fireEvent.click(screen.getByTestId('instant-confirm-photo-btn'));
    expect(onPhotoSelected).toHaveBeenCalled();
  });

  it('AC-5: stops all active tracks when modal is closed', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Höhle"
        initialTab="camera"
        onClose={onClose}
        onPhotoSelected={() => {}}
      />
    );

    await screen.findByTestId('camera-video-viewfinder');

    // Close modal
    rerender(
      <WallPhotoUploadModal
        isOpen={false}
        sectorName="Höhle"
        initialTab="camera"
        onClose={onClose}
        onPhotoSelected={() => {}}
      />
    );

    expect(mockTracks[0].stop).toHaveBeenCalled();
  });
});
