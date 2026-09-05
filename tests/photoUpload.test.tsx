import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WallPhotoUploadModal } from '../src/components/WallPhotoUploadModal';
import { WALL_PRESETS } from '../src/lib/imageUtils';

describe('Wall Photo Upload & Realistic Presets', () => {
  it('contains the 3 realistic indoor bouldering wall presets', () => {
    expect(WALL_PRESETS.length).toBe(3);
    expect(WALL_PRESETS.find(p => p.id === 'overhang')?.url).toBe('/images/walls/overhang.jpg');
    expect(WALL_PRESETS.find(p => p.id === 'slab')?.url).toBe('/images/walls/slab.jpg');
    expect(WALL_PRESETS.find(p => p.id === 'roof')?.url).toBe('/images/walls/roof.jpg');
  });

  it('renders WallPhotoUploadModal with tabs and allows selecting presets', () => {
    const onPhotoSelected = vi.fn();
    const onClose = vi.fn();

    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Überhang 45°"
        currentPhotoUrl="/images/walls/overhang.jpg"
        onClose={onClose}
        onPhotoSelected={onPhotoSelected}
      />
    );

    expect(screen.getByText('Wandfoto auswählen oder hochladen')).toBeInTheDocument();
    expect(screen.getByText('Datei vom Computer')).toBeInTheDocument();
    expect(screen.getByText('Hallen-Wände (Presets)')).toBeInTheDocument();
    expect(screen.getByText('Web-URL')).toBeInTheDocument();

    // Switch to Presets tab
    fireEvent.click(screen.getByText('Hallen-Wände (Presets)'));
    expect(screen.getByText('Platte (Slab & Balance)')).toBeInTheDocument();
    expect(screen.getByText('Wettkampf-Dach & Cave')).toBeInTheDocument();

    // Click on Platte preset
    fireEvent.click(screen.getByText('Platte (Slab & Balance)'));

    // Confirm
    fireEvent.click(screen.getByText('Wandfoto übernehmen'));
    expect(onPhotoSelected).toHaveBeenCalledWith('/images/walls/slab.jpg');
  });

  it('allows entering a custom URL in Web-URL tab', () => {
    const onPhotoSelected = vi.fn();
    const onClose = vi.fn();

    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Wettkampf-Dach"
        onClose={onClose}
        onPhotoSelected={onPhotoSelected}
      />
    );

    // Switch to Web-URL tab
    fireEvent.click(screen.getByText('Web-URL'));

    const input = screen.getByPlaceholderText('https://...');
    fireEvent.change(input, { target: { value: 'https://example.com/custom-wall.jpg' } });
    fireEvent.click(screen.getByText('Vorschau'));

    fireEvent.click(screen.getByText('Wandfoto übernehmen'));
    expect(onPhotoSelected).toHaveBeenCalledWith('https://example.com/custom-wall.jpg');
  });

  it('handles local file drop/upload simulation', async () => {
    const onPhotoSelected = vi.fn();
    const onClose = vi.fn();

    render(
      <WallPhotoUploadModal
        isOpen={true}
        sectorName="Überhang"
        onClose={onClose}
        onPhotoSelected={onPhotoSelected}
      />
    );

    // Create a mock file
    const file = new File(['dummy content'], 'my_wall_photo.jpg', { type: 'image/jpeg' });

    // Find the drop zone or hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/my_wall_photo.jpg/)).toBeInTheDocument();
    });
  });
});
