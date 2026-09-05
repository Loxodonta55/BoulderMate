import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGym,
  getMembers,
  isGymAdmin,
  setGymGradeScales,
  createSector,
  getSectors,
  reorderSectors,
  updateSectorWallPhoto,
  deleteSector,
  searchGymsWithSectors,
  getBoulders,
  saveBoulders,
  resetAllGymData,
  CURRENT_USER
} from '../src/lib/gymStorage';
import type { BoulderReference } from '../src/types/gym';
import {
  getGyms as getBatchGyms,
  getSectors as getBatchSectors,
  getGradeScales as getBatchGradeScales,
  createDraftBoulder,
  publishBatch,
  getWallBoulders
} from '../src/lib/batchBoulderService';

describe('SPEC-001: Hallen- & Sektor-Verwaltung', () => {
  beforeEach(() => {
    resetAllGymData();
  });

  it('AC-1: creates a new gym with mandatory name and gives creator admin role', () => {
    // Missing name throws error
    expect(() => createGym({ name: '' })).toThrow('Hallenname ist ein Pflichtfeld.');

    // Valid gym
    const gym = createGym({
      name: 'Minimum Bouldern Zürich',
      city: 'Zürich',
      address: 'Flüelastrasse 31',
      website: 'https://minimum.ch',
      logo_url: 'https://minimum.ch/logo.png'
    });

    expect(gym.name).toBe('Minimum Bouldern Zürich');
    expect(gym.city).toBe('Zürich');
    expect(gym.created_by).toBe(CURRENT_USER.id);

    // Verify creator is assigned admin role in gym_members
    const members = getMembers();
    const adminMembership = members.find(m => m.gym_id === gym.id && m.user_id === CURRENT_USER.id);
    expect(adminMembership).toBeDefined();
    expect(adminMembership?.role).toBe('admin');
    expect(isGymAdmin(gym.id, CURRENT_USER.id)).toBe(true);

    // Another user is not admin
    expect(isGymAdmin(gym.id, 'other_user_456')).toBe(false);
  });

  it('AC-2: allows gym admin to configure hallenspezifisches Farbsystem (grade_scales)', () => {
    const gym = createGym({ name: 'Blockfeld' });

    const customScales = [
      {
        gym_id: gym.id,
        color_name: 'Gelb',
        color_hex: '#facc15',
        difficulty_label: 'Einsteiger',
        font_range_min: '3',
        font_range_max: '4+',
        sort_order: 1
      },
      {
        gym_id: gym.id,
        color_name: 'Blau',
        color_hex: '#2563eb',
        difficulty_label: 'Fortgeschritten',
        font_range_min: '6A',
        font_range_max: '6C',
        sort_order: 2
      }
    ];

    // Admin can update
    const updated = setGymGradeScales(gym.id, CURRENT_USER.id, customScales);
    expect(updated.length).toBe(2);
    expect(updated[0].color_name).toBe('Gelb');
    expect(updated[1].font_range_max).toBe('6C');

    // Non-admin is rejected
    expect(() => setGymGradeScales(gym.id, 'random_climber_789', customScales)).toThrow(
      'Nur Hallen-Admins dürfen das Bewertungssystem konfigurieren.'
    );
  });

  it('AC-3: requires name and valid wall_photo_url for sectors', () => {
    const gym = createGym({ name: 'Griffig Uster' });

    // Missing name
    expect(() => createSector(gym.id, CURRENT_USER.id, { name: '', wall_photo_url: 'https://example.com/wall.jpg' }))
      .toThrow('Sektorname ist ein Pflichtfeld.');

    // Missing photo
    expect(() => createSector(gym.id, CURRENT_USER.id, { name: 'Wettkampfwand', wall_photo_url: '' }))
      .toThrow('Wandfoto (wall_photo_url) ist ein Pflichtfeld.');

    // Valid sector
    const sector = createSector(gym.id, CURRENT_USER.id, {
      name: 'Wettkampfwand',
      wall_photo_url: 'https://images.unsplash.com/photo-climbing-wall-1'
    });

    expect(sector.id).toBeDefined();
    expect(sector.name).toBe('Wettkampfwand');
    expect(sector.wall_photo_url).toBe('https://images.unsplash.com/photo-climbing-wall-1');
  });

  it('AC-4: reorders sectors and updates sort_order', () => {
    const gym = createGym({ name: 'Bimano' });
    const s1 = createSector(gym.id, CURRENT_USER.id, { name: 'Sektor A', wall_photo_url: 'https://url/a.jpg' });
    const s2 = createSector(gym.id, CURRENT_USER.id, { name: 'Sektor B', wall_photo_url: 'https://url/b.jpg' });
    const s3 = createSector(gym.id, CURRENT_USER.id, { name: 'Sektor C', wall_photo_url: 'https://url/c.jpg' });

    // Initial order
    expect(getSectors(gym.id).map(s => s.name)).toEqual(['Sektor A', 'Sektor B', 'Sektor C']);

    // Reorder: Sektor C first, then Sektor A, then Sektor B
    const reordered = reorderSectors(gym.id, CURRENT_USER.id, [s3.id, s1.id, s2.id]);
    expect(reordered[0].id).toBe(s3.id);
    expect(reordered[0].sort_order).toBe(1);
    expect(reordered[1].id).toBe(s1.id);
    expect(reordered[1].sort_order).toBe(2);
    expect(reordered[2].id).toBe(s2.id);
    expect(reordered[2].sort_order).toBe(3);
  });

  it('AC-5: preserves relative boulder coordinates (0.0 - 1.0) when sector photo is updated', () => {
    const gym = createGym({ name: 'Boulder Lounge' });
    const sector = createSector(gym.id, CURRENT_USER.id, {
      name: 'Dachbereich',
      wall_photo_url: 'https://photos/old-wall.jpg'
    });

    // Create existing boulders with relative coordinates
    const testBoulders: BoulderReference[] = [
      { id: 'b1', sector_id: sector.id, grade_scale_id: 'sc1', position_x: 0.25, position_y: 0.80, status: 'active', name: 'Start Roof' },
      { id: 'b2', sector_id: sector.id, grade_scale_id: 'sc2', position_x: 0.65, position_y: 0.35, status: 'active', name: 'Lip Traverse' }
    ];
    saveBoulders(testBoulders);

    // Admin updates wall photo for reset/new setters season
    const updatedSector = updateSectorWallPhoto(sector.id, CURRENT_USER.id, 'https://photos/new-wall-2026.jpg');
    expect(updatedSector.wall_photo_url).toBe('https://photos/new-wall-2026.jpg');

    // Verify coordinates of all boulders on this sector are strictly preserved
    const currentBoulders = getBoulders(sector.id);
    expect(currentBoulders.find(b => b.id === 'b1')?.position_x).toBe(0.25);
    expect(currentBoulders.find(b => b.id === 'b1')?.position_y).toBe(0.80);
    expect(currentBoulders.find(b => b.id === 'b2')?.position_x).toBe(0.65);
    expect(currentBoulders.find(b => b.id === 'b2')?.position_y).toBe(0.35);
  });

  it('AC-6: prevents deletion of sectors that contain active boulders', () => {
    const gym = createGym({ name: 'Kraftreaktor' });
    const sector = createSector(gym.id, CURRENT_USER.id, {
      name: 'Plattenwald',
      wall_photo_url: 'https://photos/slab.jpg'
    });

    // Add active boulder
    saveBoulders([
      { id: 'b_active_1', sector_id: sector.id, grade_scale_id: 'scale_1', position_x: 0.5, position_y: 0.5, status: 'active' }
    ]);

    // Deletion must throw error
    expect(() => deleteSector(sector.id, CURRENT_USER.id)).toThrow(
      /kann nicht gelöscht werden, da er noch 1 aktive Boulder enthält/
    );

    // Archive or remove the active boulder
    saveBoulders([
      { id: 'b_active_1', sector_id: sector.id, grade_scale_id: 'scale_1', position_x: 0.5, position_y: 0.5, status: 'archived' }
    ]);

    // Deletion should now succeed
    const success = deleteSector(sector.id, CURRENT_USER.id);
    expect(success).toBe(true);
    expect(getSectors(gym.id).length).toBe(0);
  });

  it('AC-7: allows climbers to search gyms and view sector overview with wall photos & active boulder count', () => {
    const gym1 = createGym({ name: 'Minimum Zürich', city: 'Zürich' });
    const sec1 = createSector(gym1.id, CURRENT_USER.id, { name: 'Höhle', wall_photo_url: 'https://photos/cave.jpg' });
    createSector(gym1.id, CURRENT_USER.id, { name: 'Platte', wall_photo_url: 'https://photos/slab.jpg' });

    const gym2 = createGym({ name: 'Blockfeld Winterthur', city: 'Winterthur' });
    createSector(gym2.id, CURRENT_USER.id, { name: 'Haupthalle', wall_photo_url: 'https://photos/main.jpg' });

    // Add active boulders to gym1 sec1
    saveBoulders([
      { id: 'b_1', sector_id: sec1.id, grade_scale_id: 's1', position_x: 0.1, position_y: 0.2, status: 'active' },
      { id: 'b_2', sector_id: sec1.id, grade_scale_id: 's1', position_x: 0.3, position_y: 0.4, status: 'active' },
      { id: 'b_3', sector_id: sec1.id, grade_scale_id: 's1', position_x: 0.5, position_y: 0.6, status: 'draft' } // not active
    ]);

    // Search for "Zürich"
    const results = searchGymsWithSectors('Zürich');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Minimum Zürich');
    expect(results[0].sectors.length).toBe(2);

    const caveSector = results[0].sectors.find(s => s.name === 'Höhle');
    expect(caveSector?.wall_photo_url).toBe('https://photos/cave.jpg');
    expect(caveSector?.active_boulder_count).toBe(2); // only 2 active, draft not counted

    const slabSector = results[0].sectors.find(s => s.name === 'Platte');
    expect(slabSector?.active_boulder_count).toBe(0);
  });

  it('AC-8: allows setters to seamlessly switch to created gym and screw/publish routes on its sectors', () => {
    const gym = createGym({ name: 'Griffig Uster', city: 'Uster' });
    const sec = createSector(gym.id, CURRENT_USER.id, {
      name: 'Wettkampfwand',
      wall_photo_url: 'https://photos/griffig-comp.jpg'
    });

    // Verify batchBoulderService sees custom gym & sector
    const allGyms = getBatchGyms();
    expect(allGyms.some(g => g.id === gym.id)).toBe(true);

    const sectors = getBatchSectors(gym.id);
    expect(sectors.length).toBe(1);
    expect(sectors[0].id).toBe(sec.id);
    expect(sectors[0].name).toBe('Wettkampfwand');

    const scales = getBatchGradeScales(gym.id);
    expect(scales.length).toBeGreaterThan(0);

    // Setter screws a route on this custom gym sector
    const draft = createDraftBoulder(
      {
        sectorId: sec.id,
        gradeScaleId: scales[0].id,
        positionX: 0.5,
        positionY: 0.5,
        name: 'Uster Testroute',
        setterId: CURRENT_USER.id
      },
      'setter'
    );
    expect(draft.id).toBeDefined();

    // Publish route
    const publishResult = publishBatch(sec.id, CURRENT_USER.id, []);
    expect(publishResult.publishedCount).toBe(1);

    // Verify Climber view and gym search see the active boulder
    const activeBoulders = getWallBoulders(sec.id).filter(b => b.status === 'active');
    expect(activeBoulders.length).toBe(1);
    expect(activeBoulders[0].name).toBe('Uster Testroute');

    const gymsWithStats = searchGymsWithSectors('Uster');
    expect(gymsWithStats.length).toBe(1);
    expect(gymsWithStats[0].sectors[0].active_boulder_count).toBe(1);
  });
});
