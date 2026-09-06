import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectorManager } from '../src/components/SectorManager';
import {
  createGym,
  createSector,
  getSectors as getGymSectors,
  reorderSectors,
  resetAllGymData,
  CURRENT_USER
} from '../src/lib/gymStorage';
import {
  getSectors as getBatchSectors,
  reorderSectors as reorderBatchSectors,
  clearBatchServiceStorage
} from '../src/lib/batchBoulderService';
import type { Sector } from '../src/types/gym';

describe('SPEC-001 AC-4: Sektor-Sortierung per Drag & Drop (SectorManager)', () => {
  const gymId = 'gym-test-drag-drop';
  const adminUserId = CURRENT_USER.id;

  beforeEach(() => {
    resetAllGymData();
    clearBatchServiceStorage();
  });

  it('renders drag handles and ordering badges for admin users', () => {
    const mockSectors: (Sector & { active_boulder_count: number })[] = [
      { id: 'sec-1', gym_id: gymId, name: 'Sektor 1 (Eingang)', wall_photo_url: '/img1.jpg', sort_order: 1, created_at: '', active_boulder_count: 5 },
      { id: 'sec-2', gym_id: gymId, name: 'Sektor 2 (Mitte)', wall_photo_url: '/img2.jpg', sort_order: 2, created_at: '', active_boulder_count: 3 },
      { id: 'sec-3', gym_id: gymId, name: 'Sektor 3 (Dach)', wall_photo_url: '/img3.jpg', sort_order: 3, created_at: '', active_boulder_count: 2 },
    ];

    render(
      <SectorManager
        gymId={gymId}
        userId={adminUserId}
        isAdmin={true}
        sectors={mockSectors}
        onRefresh={vi.fn()}
      />
    );

    // Guide banner is visible for admins when more than 1 sector exists
    expect(screen.getByText(/Drag & Drop Sortierung/i)).toBeInTheDocument();

    // Check all drag handles
    expect(screen.getByTestId('drag-handle-sec-1')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-sec-2')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-sec-3')).toBeInTheDocument();

    // Badges #1, #2, #3
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('does NOT render drag handles or reorder arrows for non-admin members', () => {
    const mockSectors: (Sector & { active_boulder_count: number })[] = [
      { id: 'sec-1', gym_id: gymId, name: 'Sektor 1', wall_photo_url: '/img1.jpg', sort_order: 1, created_at: '', active_boulder_count: 1 },
      { id: 'sec-2', gym_id: gymId, name: 'Sektor 2', wall_photo_url: '/img2.jpg', sort_order: 2, created_at: '', active_boulder_count: 0 },
    ];

    render(
      <SectorManager
        gymId={gymId}
        userId="regular-climber-id"
        isAdmin={false}
        sectors={mockSectors}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.queryByText(/Drag & Drop Sortierung/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('drag-handle-sec-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('move-up-sec-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('move-down-sec-1')).not.toBeInTheDocument();
  });

  it('handles HTML5 Drag & Drop reordering and updates order via reorderSectors', () => {
    createGym({ id: gymId, name: 'Drag Test Gym' });
    const s1 = createSector(gymId, adminUserId, { name: 'Sektor A', wall_photo_url: '/a.jpg', sort_order: 1 });
    const s2 = createSector(gymId, adminUserId, { name: 'Sektor B', wall_photo_url: '/b.jpg', sort_order: 2 });
    const s3 = createSector(gymId, adminUserId, { name: 'Sektor C', wall_photo_url: '/c.jpg', sort_order: 3 });

    const sectorsWithCounts = [
      { ...s1, active_boulder_count: 0 },
      { ...s2, active_boulder_count: 0 },
      { ...s3, active_boulder_count: 0 },
    ];

    const onRefresh = vi.fn();

    render(
      <SectorManager
        gymId={gymId}
        userId={adminUserId}
        isAdmin={true}
        sectors={sectorsWithCounts}
        onRefresh={onRefresh}
      />
    );

    const card1 = screen.getByTestId(`sector-card-${s1.id}`);
    const card3 = screen.getByTestId(`sector-card-${s3.id}`);

    // Create a mock DataTransfer
    const dataStore: Record<string, string> = {};
    const dataTransfer = {
      setData: (format: string, val: string) => { dataStore[format] = val; },
      getData: (format: string) => dataStore[format] || '',
      dropEffect: 'none',
      effectAllowed: 'all',
    };

    // 1. Drag start on Sektor A (index 0)
    fireEvent.dragStart(card1, { dataTransfer });

    // 2. Drag over on Sektor C (index 2)
    fireEvent.dragOver(card3, { dataTransfer });

    // 3. Drop on Sektor C
    fireEvent.drop(card3, { dataTransfer });

    // onRefresh must be called after reorder
    expect(onRefresh).toHaveBeenCalled();

    // Verify in storage: Sektor A moved to position 3 (after Sektor B and C: [s2, s3, s1])
    const updatedSectors = getGymSectors(gymId);
    expect(updatedSectors[0].id).toBe(s2.id);
    expect(updatedSectors[0].sort_order).toBe(1);
    expect(updatedSectors[1].id).toBe(s3.id);
    expect(updatedSectors[1].sort_order).toBe(2);
    expect(updatedSectors[2].id).toBe(s1.id);
    expect(updatedSectors[2].sort_order).toBe(3);
  });

  it('allows reordering via accessible up/down arrow buttons as fallback', () => {
    createGym({ id: gymId, name: 'Arrow Test Gym' });
    const s1 = createSector(gymId, adminUserId, { name: 'Eingang', wall_photo_url: '/e.jpg', sort_order: 1 });
    const s2 = createSector(gymId, adminUserId, { name: 'Dach', wall_photo_url: '/d.jpg', sort_order: 2 });

    const sectorsWithCounts = [
      { ...s1, active_boulder_count: 0 },
      { ...s2, active_boulder_count: 0 },
    ];

    const onRefresh = vi.fn();

    render(
      <SectorManager
        gymId={gymId}
        userId={adminUserId}
        isAdmin={true}
        sectors={sectorsWithCounts}
        onRefresh={onRefresh}
      />
    );

    // Click move-down on first sector (Eingang)
    const downBtn = screen.getByTestId(`move-down-${s1.id}`);
    fireEvent.click(downBtn);

    expect(onRefresh).toHaveBeenCalled();

    const inStorage = getGymSectors(gymId);
    expect(inStorage[0].id).toBe(s2.id);
    expect(inStorage[0].sort_order).toBe(1);
    expect(inStorage[1].id).toBe(s1.id);
    expect(inStorage[1].sort_order).toBe(2);
  });

  it('synchronizes reordered sectors seamlessly with batchBoulderService (Schrauber-Studio & Kletterer-Ansicht)', () => {
    createGym({ id: gymId, name: 'Sync Gym' });
    const s1 = createSector(gymId, adminUserId, { name: 'Wand 1', wall_photo_url: '/w1.jpg', sort_order: 1 });
    const s2 = createSector(gymId, adminUserId, { name: 'Wand 2', wall_photo_url: '/w2.jpg', sort_order: 2 });
    const s3 = createSector(gymId, adminUserId, { name: 'Wand 3', wall_photo_url: '/w3.jpg', sort_order: 3 });

    // Initial batchBoulderService order
    let batchSectors = getBatchSectors(gymId);
    expect(batchSectors.map(s => s.name)).toEqual(['Wand 1', 'Wand 2', 'Wand 3']);

    // Reorder: Move Wand 3 to first position [s3, s1, s2]
    reorderSectors(gymId, adminUserId, [s3.id, s1.id, s2.id]);

    // Query batchBoulderService again: must reflect new sort order immediately
    batchSectors = getBatchSectors(gymId);
    expect(batchSectors[0].id).toBe(s3.id);
    expect(batchSectors[0].sortOrder).toBe(1);
    expect(batchSectors[1].id).toBe(s1.id);
    expect(batchSectors[1].sortOrder).toBe(2);
    expect(batchSectors[2].id).toBe(s2.id);
    expect(batchSectors[2].sortOrder).toBe(3);

    // Also test reorderBatchSectors helper
    reorderBatchSectors(gymId, [s2.id, s3.id, s1.id]);
    const afterBatchReorder = getBatchSectors(gymId);
    expect(afterBatchReorder[0].id).toBe(s2.id);
    expect(afterBatchReorder[1].id).toBe(s3.id);
    expect(afterBatchReorder[2].id).toBe(s1.id);
  });
});
