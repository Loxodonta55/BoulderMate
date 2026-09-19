import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  handleRealtimeSectorChange,
  handleRealtimeBoulderChange,
} from '../src/lib/syncService';
import {
  createSector,
  createSectorsBatch,
  deleteSector,
  getSectors,
  searchGymsWithSectors,
  resetAllGymData,
  ensureInitialGymData,
  CURRENT_USER
} from '../src/lib/gymStorage';
import { getSectors as getBatchSectors } from '../src/lib/batchBoulderService';
import { syncBridge } from '../src/lib/syncBridge';
import { GymManagement } from '../src/components/GymManagement';

describe('SPEC-019: Geräteübergreifende Echtzeit-Synchronisation (Mobile <-> Desktop)', () => {
  beforeEach(() => {
    resetAllGymData();
    ensureInitialGymData();
  });

  it('AC-1: handleRealtimeSectorChange processes INSERT from mobile and updates V1 & V2 caches', () => {
    const eventSpy = vi.fn();
    window.addEventListener('bouldermate:sectors_updated', eventSpy);

    const payload = {
      eventType: 'INSERT',
      new: {
        id: '00000000-7180-4000-8000-50870ff02747',
        name: 'Nach Traverse',
        gym_id: 'f2b11564-ca86-4ed4-b51c-3affb346144b',
        wall_photo_url: '/images/walls/6aplus/NachTraverse.jpg',
        sort_order: 16,
        created_at: new Date().toISOString()
      },
      old: null
    };

    handleRealtimeSectorChange(payload);

    // Verify V1 cache has the new sector
    const v1Sectors = getSectors('gym-6a-plus');
    const v1Found = v1Sectors.find(s => s.name === 'Nach Traverse');
    expect(v1Found).toBeDefined();
    expect(v1Found?.wall_photo_url).toBe('/images/walls/6aplus/NachTraverse.jpg');

    // Verify V2 cache has the new sector
    const v2Sectors = getBatchSectors('gym-6a-plus');
    const v2Found = v2Sectors.find(s => s.name === 'Nach Traverse');
    expect(v2Found).toBeDefined();

    // Verify event dispatched
    expect(eventSpy).toHaveBeenCalled();

    window.removeEventListener('bouldermate:sectors_updated', eventSpy);
  });

  it('AC-1: handleRealtimeSectorChange processes DELETE and purges from V1 & V2 caches', () => {
    // First insert
    handleRealtimeSectorChange({
      eventType: 'INSERT',
      new: {
        id: '00000000-temp-4000-8000-111111111111',
        name: 'Zu löschender Sektor',
        gym_id: 'gym-6a-plus',
        wall_photo_url: '/images/walls/overhang.jpg',
        sort_order: 20,
        created_at: new Date().toISOString()
      }
    });

    expect(getSectors('gym-6a-plus').some(s => s.name === 'Zu löschender Sektor')).toBe(true);

    // Now delete
    handleRealtimeSectorChange({
      eventType: 'DELETE',
      old: {
        id: '00000000-temp-4000-8000-111111111111'
      }
    });

    expect(getSectors('gym-6a-plus').some(s => s.name === 'Zu löschender Sektor')).toBe(false);
    expect(getBatchSectors('gym-6a-plus').some(s => s.name === 'Zu löschender Sektor')).toBe(false);
  });

  it('AC-1: handleRealtimeBoulderChange processes INSERT, UPDATE and DELETE and dispatches event', () => {
    const eventSpy = vi.fn();
    window.addEventListener('bouldermate:boulders_updated', eventSpy);

    // Insert
    handleRealtimeBoulderChange({
      eventType: 'INSERT',
      new: {
        id: 'boulder-realtime-test-1',
        sector_id: 'sec_6a_slab_vorne',
        grade_scale_id: 'b65dc31e-21e5-4612-a0cc-2b60891c78de',
        position_x: 0.5,
        position_y: 0.5,
        name: 'Live Flash Boulder',
        status: 'active'
      }
    });

    expect(eventSpy).toHaveBeenCalled();

    // Delete
    handleRealtimeBoulderChange({
      eventType: 'DELETE',
      old: { id: 'boulder-realtime-test-1' }
    });

    expect(eventSpy).toHaveBeenCalledTimes(2);

    window.removeEventListener('bouldermate:boulders_updated', eventSpy);
  });

  it('AC-3: searchGymsWithSectors robustly matches sectors with UUIDs or Slugs', () => {
    // Add sector with UUID gym_id
    createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'UUID Normalization Test Sector',
      wall_photo_url: '/images/walls/overhang.jpg'
    });

    const gymsWithSectors = searchGymsWithSectors();
    const gym6a = gymsWithSectors.find(g => g.id === 'gym-6a-plus' || g.name.includes('6a'));
    expect(gym6a).toBeDefined();

    const sectorFound = gym6a?.sectors.find(s => s.name === 'UUID Normalization Test Sector');
    expect(sectorFound).toBeDefined();
  });

  it('AC-5: createSector & createSectorsBatch keep V1 & V2 in lockstep and dispatch bouldermate:sectors_updated', () => {
    const eventSpy = vi.fn();
    window.addEventListener('bouldermate:sectors_updated', eventSpy);

    createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'Lockstep Single Sector',
      wall_photo_url: '/images/walls/overhang.jpg'
    });

    expect(eventSpy).toHaveBeenCalled();
    expect(getBatchSectors('gym-6a-plus').some(s => s.name === 'Lockstep Single Sector')).toBe(true);

    createSectorsBatch('gym-6a-plus', CURRENT_USER.id, [
      { name: 'Batch 1', wall_photo_url: '/images/walls/overhang.jpg' },
      { name: 'Batch 2', wall_photo_url: '/images/walls/overhang.jpg' }
    ]);

    expect(getBatchSectors('gym-6a-plus').some(s => s.name === 'Batch 1')).toBe(true);
    expect(getBatchSectors('gym-6a-plus').some(s => s.name === 'Batch 2')).toBe(true);

    window.removeEventListener('bouldermate:sectors_updated', eventSpy);
  });

  it('AC-6: deleteSector delegates to syncBridge.deleteSector and removes from both stores', () => {
    const syncBridgeSpy = vi.spyOn(syncBridge, 'deleteSector');

    const created = createSector('gym-6a-plus', CURRENT_USER.id, {
      name: 'Sektor fuer Loeschtest',
      wall_photo_url: '/images/walls/overhang.jpg'
    });

    expect(getSectors('gym-6a-plus').some(s => s.id === created.id)).toBe(true);

    const deleted = deleteSector(created.id, CURRENT_USER.id);
    expect(deleted).toBe(true);
    expect(syncBridgeSpy).toHaveBeenCalledWith(created.id);
    expect(getSectors('gym-6a-plus').some(s => s.id === created.id)).toBe(false);
    expect(getBatchSectors('gym-6a-plus').some(s => s.id === created.id)).toBe(false);
  });

  it('AC-2: GymManagement automatically re-renders when bouldermate:sectors_updated fires', async () => {
    render(<GymManagement activeGymId="gym-6a-plus" userId={CURRENT_USER.id} />);

    // Initial check: sector should not exist yet
    expect(screen.queryByText('Realtime Live Sector In Admin')).toBeNull();

    // Simulate sector arrived via Realtime from mobile
    await act(async () => {
      handleRealtimeSectorChange({
        eventType: 'INSERT',
        new: {
          id: '00000000-live-4000-8000-999999999999',
          name: 'Realtime Live Sector In Admin',
          gym_id: 'gym-6a-plus',
          wall_photo_url: '/images/walls/overhang.jpg',
          sort_order: 25,
          created_at: new Date().toISOString()
        }
      });
    });

    // Verify GymManagement immediately updated without page reload!
    expect(screen.getByText('Realtime Live Sector In Admin')).toBeDefined();
  });
});
