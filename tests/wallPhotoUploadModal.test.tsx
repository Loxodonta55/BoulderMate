import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WallPhotoUploadModal } from '../src/components/WallPhotoUploadModal';
import { SectorPhotoUploader } from '../src/components/SectorPhotoUploader';
import { WALL_PRESETS } from '../src/lib/imageUtils';

describe('WallPhotoUploadModal & SectorPhotoUploader (SPEC-005 UI)', () => {
  describe('WallPhotoUploadModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <WallPhotoUploadModal
          isOpen={false}
          sectorName="Test Wand"
          onClose={() => {}}
          onPhotoSelected={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders sector name and tabs when isOpen is true', () => {
      render(
        <WallPhotoUploadModal
          isOpen={true}
          sectorName="Wettkampfwand"
          onClose={() => {}}
          onPhotoSelected={() => {}}
        />
      );

      expect(screen.getByText(/Wandfoto auswählen oder hochladen/i)).toBeInTheDocument();
      expect(screen.getByText(/Sektor: Wettkampfwand/i)).toBeInTheDocument();
      expect(screen.getByText(/Datei vom Computer/i)).toBeInTheDocument();
      expect(screen.getByText(/Hallen-Wände/i)).toBeInTheDocument();
      expect(screen.getByText(/Web-URL/i)).toBeInTheDocument();
    });

    it('allows switching to Presets tab and selecting a preset wall', () => {
      const onPhotoSelected = vi.fn();
      render(
        <WallPhotoUploadModal
          isOpen={true}
          sectorName="Dach"
          onClose={() => {}}
          onPhotoSelected={onPhotoSelected}
        />
      );

      // Click Presets tab
      fireEvent.click(screen.getByText(/Hallen-Wände/i));
      expect(screen.getByText(WALL_PRESETS[0].name)).toBeInTheDocument();

      // Click the first preset
      fireEvent.click(screen.getByText(WALL_PRESETS[0].name));

      // Click "Wandfoto übernehmen"
      fireEvent.click(screen.getByText(/Wandfoto übernehmen/i));
      expect(onPhotoSelected).toHaveBeenCalledWith(WALL_PRESETS[0].url);
    });

    it('allows switching to Web-URL tab and entering a custom image URL', () => {
      const onPhotoSelected = vi.fn();
      render(
        <WallPhotoUploadModal
          isOpen={true}
          sectorName="Platte"
          onClose={() => {}}
          onPhotoSelected={onPhotoSelected}
        />
      );

      // Click Web-URL tab
      fireEvent.click(screen.getByText(/Web-URL/i));
      const input = screen.getByPlaceholderText('https://...');
      fireEvent.change(input, { target: { value: 'https://example.com/wall.jpg' } });

      // Click "Vorschau"
      fireEvent.click(screen.getByRole('button', { name: 'Vorschau' }));

      // Click "Wandfoto übernehmen"
      fireEvent.click(screen.getByText(/Wandfoto übernehmen/i));
      expect(onPhotoSelected).toHaveBeenCalledWith('https://example.com/wall.jpg');
    });

    it('triggers onClose when Abbrechen or X is clicked', () => {
      const onClose = vi.fn();
      render(
        <WallPhotoUploadModal
          isOpen={true}
          sectorName="Höhle"
          onClose={onClose}
          onPhotoSelected={() => {}}
        />
      );

      fireEvent.click(screen.getByText(/Abbrechen/i));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('SectorPhotoUploader', () => {
    it('renders upload mode by default and supports mode switching', () => {
      const onChange = vi.fn();
      render(
        <SectorPhotoUploader
          value=""
          onChange={onChange}
          label="Sektor Foto"
        />
      );

      expect(screen.getByText(/Sektor Foto/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Vom Laptop/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bild-URL/i })).toBeInTheDocument();
      expect(screen.getByText(/Foto vom Laptop hier ablegen/i)).toBeInTheDocument();

      // Switch to URL mode
      fireEvent.click(screen.getByRole('button', { name: /Bild-URL/i }));
      expect(screen.getByPlaceholderText(/https:\/\/images.unsplash.com/i)).toBeInTheDocument();
    });

    it('allows entering URL directly in SectorPhotoUploader', () => {
      const onChange = vi.fn();
      render(
        <SectorPhotoUploader
          value=""
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Bild-URL/i }));
      const input = screen.getByPlaceholderText(/https:\/\/images.unsplash.com/i);
      fireEvent.change(input, { target: { value: 'https://images.unsplash.com/photo-1' } });
      fireEvent.click(screen.getByText(/Übernehmen/i));

      expect(onChange).toHaveBeenCalledWith('https://images.unsplash.com/photo-1');
    });

    it('displays image preview and remove button when value is set', () => {
      const onChange = vi.fn();
      render(
        <SectorPhotoUploader
          value="https://example.com/existing-wall.jpg"
          onChange={onChange}
        />
      );

      expect(screen.getByAltText(/Sektor Wandfoto Vorschau/i)).toBeInTheDocument();
      expect(screen.getByText(/Web-URL/i)).toBeInTheDocument();

      // Click "Entfernen"
      fireEvent.click(screen.getByText(/Entfernen/i));
      expect(onChange).toHaveBeenCalledWith('');
    });
  });
});
