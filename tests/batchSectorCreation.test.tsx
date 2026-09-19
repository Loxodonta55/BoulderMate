import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  createGym,
  createSector,
  createSectorsBatch,
  getSectors,
  resetAllGymData,
  CURRENT_USER
} from '../src/lib/gymStorage';
import { cleanFileNameToSectorName } from '../src/lib/imageUtils';
import { BatchSectorModal } from '../src/components/BatchSectorModal';
import { SectorManager } from '../src/components/SectorManager';
import type { Sector } from '../src/types/gym';

describe('SPEC-018: Multi-Sektor-Batch-Erstellung & Multi-Foto-Upload', () => {
  const gymId = 'gym-batch-test';
  const adminUserId = CURRENT_USER.id;

  beforeEach(() => {
    resetAllGymData();
    createGym({ name: 'Batch Test Gym' });
  });

  describe('1. gymStorage: createSectorsBatch', () => {
    it('enforces admin permissions and validates inputs', () => {
      // Non-admin throws
      expect(() =>
        createSectorsBatch(gymId, 'stranger-id', [
          { name: 'Sektor 1', wall_photo_url: '/img1.jpg' }
        ])
      ).toThrow(/Nur Hallen-Admins/);

      // Empty batch throws
      expect(() => createSectorsBatch(gymId, adminUserId, [])).toThrow(
        /Mindestens ein Sektor/
      );

      // Empty name in one sector throws
      expect(() =>
        createSectorsBatch(gymId, adminUserId, [
          { name: 'Gültig', wall_photo_url: '/img.jpg' },
          { name: '', wall_photo_url: '/img.jpg' }
        ])
      ).toThrow(/Sektorname ist ein Pflichtfeld/);

      // Empty photo URL throws
      expect(() =>
        createSectorsBatch(gymId, adminUserId, [
          { name: 'Wand 1', wall_photo_url: '' }
        ])
      ).toThrow(/Wandfoto .* ist ein Pflichtfeld/);
    });

    it('creates multiple sectors in one batch with sequential sort_order', () => {
      // Initial single sector
      createSector(gymId, adminUserId, {
        name: 'Initialer Sektor',
        wall_photo_url: '/init.jpg'
      });

      const batch = [
        { name: 'Wettkampfwand', wall_photo_url: '/wall1.jpg' },
        { name: 'Dach & Höhle', wall_photo_url: '/wall2.jpg' },
        { name: 'Platte', wall_photo_url: '/wall3.jpg' },
      ];

      const created = createSectorsBatch(gymId, adminUserId, batch);
      expect(created).toHaveLength(3);
      expect(created[0].sort_order).toBe(2);
      expect(created[1].sort_order).toBe(3);
      expect(created[2].sort_order).toBe(4);

      const all = getSectors(gymId);
      expect(all).toHaveLength(4);
      expect(all.map(s => s.name)).toEqual([
        'Initialer Sektor',
        'Wettkampfwand',
        'Dach & Höhle',
        'Platte'
      ]);
    });
  });

  describe('2. imageUtils: cleanFileNameToSectorName', () => {
    it('cleans filenames with dashes, underscores, and extensions', () => {
      expect(cleanFileNameToSectorName('Wettkampf_Wand_Links.jpg')).toBe('Wettkampf Wand Links');
      expect(cleanFileNameToSectorName('Dach-Ueberhang-01.png')).toBe('Dach Ueberhang 01');
      expect(cleanFileNameToSectorName('Platte.webp')).toBe('Platte');
    });

    it('handles generic filenames with fallback numbers', () => {
      expect(cleanFileNameToSectorName('IMG_4021.jpg', 3)).toBe('Sektor 3 (IMG 4021)');
      expect(cleanFileNameToSectorName('', 5)).toBe('Sektor 5');
    });
  });

  describe('3. BatchSectorModal Component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <BatchSectorModal
          isOpen={false}
          gymId={gymId}
          userId={adminUserId}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );
      expect(screen.queryByTestId('batch-sector-modal')).not.toBeInTheDocument();
    });

    it('allows selecting presets, editing names, auto-numbering, and batch saving', async () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      render(
        <BatchSectorModal
          isOpen={true}
          gymId={gymId}
          userId={adminUserId}
          existingSectorCount={0}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      expect(screen.getByTestId('batch-sector-modal')).toBeInTheDocument();

      // Switch to Presets Tab
      fireEvent.click(screen.getByTestId('tab-presets-btn'));

      // Click on presets to add them
      const presetÜberhang = screen.getByTestId('preset-item-overhang');
      fireEvent.click(presetÜberhang);

      const presetPlatte = screen.getByTestId('preset-item-slab');
      fireEvent.click(presetPlatte);

      // Now 2 sectors are selected
      expect(screen.getByText(/Ausgewählte Sektoren \(2\)/i)).toBeInTheDocument();
      expect(screen.getByTestId('draft-sector-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('draft-sector-item-1')).toBeInTheDocument();

      // Test Auto-numbering
      const autoNumBtn = screen.getByText(/Durchnummerieren/i);
      fireEvent.click(autoNumBtn);

      // Verify names updated
      const inputs = screen.getAllByPlaceholderText(/Sektorname eingeben/i);
      expect(inputs[0]).toHaveValue('Sektor 1');
      expect(inputs[1]).toHaveValue('Sektor 2');

      // Edit first name manually
      fireEvent.change(inputs[0], { target: { value: 'Bühnenwand' } });
      expect(inputs[0]).toHaveValue('Bühnenwand');

      // Submit batch save
      const submitBtn = screen.getByTestId('batch-save-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(2);
        expect(onClose).toHaveBeenCalled();
      });

      // Verify sectors were created in gymStorage
      const sectorsInGym = getSectors(gymId);
      expect(sectorsInGym).toHaveLength(2);
      expect(sectorsInGym[0].name).toBe('Bühnenwand');
      expect(sectorsInGym[1].name).toBe('Sektor 2');
    });

    it('allows uploading multiple files and removing individual items', async () => {
      render(
        <BatchSectorModal
          isOpen={true}
          gymId={gymId}
          userId={adminUserId}
          existingSectorCount={0}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const file1 = new File(['dummy1'], 'Cave_Nord.jpg', { type: 'image/jpeg' });
      const file2 = new File(['dummy2'], 'Campus_Board.png', { type: 'image/png' });

      const fileInput = screen.getByTestId('multi-sector-file-input');
      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Cave Nord')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Campus Board')).toBeInTheDocument();
      });

      // Remove the second file
      const removeBtn = screen.getByLabelText(/Entferne Sektor 2/i);
      fireEvent.click(removeBtn);

      expect(screen.queryByDisplayValue('Campus Board')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('Cave Nord')).toBeInTheDocument();
      expect(screen.getByText(/Ausgewählte Sektoren \(1\)/i)).toBeInTheDocument();
    });
  });

  describe('4. SectorManager Integration', () => {
    it('opens BatchSectorModal when clicking "Mehrere anlegen" in header', () => {
      const mockSector: Sector & { active_boulder_count: number } = {
        id: 'sec-existing-1',
        gym_id: gymId,
        name: 'Sektor 1',
        wall_photo_url: '/wall.jpg',
        sort_order: 1,
        created_at: '',
        active_boulder_count: 0
      };

      render(
        <SectorManager
          gymId={gymId}
          userId={adminUserId}
          isAdmin={true}
          sectors={[mockSector]}
          onRefresh={vi.fn()}
        />
      );

      const batchBtn = screen.getByTestId('batch-add-sector-btn');
      expect(batchBtn).toBeInTheDocument();

      fireEvent.click(batchBtn);
      expect(screen.getByTestId('batch-sector-modal')).toBeInTheDocument();
    });

    it('provides batch creation button in empty state when no sectors exist', () => {
      render(
        <SectorManager
          gymId={gymId}
          userId={adminUserId}
          isAdmin={true}
          sectors={[]}
          onRefresh={vi.fn()}
        />
      );

      const emptyBatchBtn = screen.getByTestId('empty-batch-add-sector-btn');
      expect(emptyBatchBtn).toBeInTheDocument();

      fireEvent.click(emptyBatchBtn);
      expect(screen.getByTestId('batch-sector-modal')).toBeInTheDocument();
    });

    it('switches from single add form to batch modal on clicking switch link', () => {
      render(
        <SectorManager
          gymId={gymId}
          userId={adminUserId}
          isAdmin={true}
          sectors={[]}
          onRefresh={vi.fn()}
        />
      );

      // Open single add form
      fireEvent.click(screen.getByTestId('empty-add-sector-btn'));
      expect(screen.getByText(/Neuen Sektor im Topo anlegen/i)).toBeInTheDocument();

      // Click switch link
      const switchBtn = screen.getByTestId('switch-to-batch-modal-btn');
      fireEvent.click(switchBtn);

      // Batch modal opens, single form closes
      expect(screen.getByTestId('batch-sector-modal')).toBeInTheDocument();
      expect(screen.queryByText(/Neuen Sektor im Topo anlegen/i)).not.toBeInTheDocument();
    });
  });
});
