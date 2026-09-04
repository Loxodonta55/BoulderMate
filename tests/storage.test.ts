import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateBoulderInput,
  createBoulder,
  getStoredBoulders,
  saveStoredBoulders,
  updateBoulder,
  deleteBoulder,
  filterAndSortBoulders,
  computeStats,
  exportBouldersToJson,
  importBouldersFromJson
} from '../src/lib/storage';
import { Boulder, BoulderInput } from '../src/types/boulder';

describe('Storage & Validation (AC-1, AC-3, AC-4)', () => {
  beforeEach(() => {
    saveStoredBoulders([]);
  });

  it('AC-1: rejects input missing mandatory fields or invalid data', () => {
    const invalid: Partial<BoulderInput> = {
      name: 'A', // too short
      location: '',
      date: 'invalid-date',
      gradeScale: 'font',
      grade: 'invalid',
      ascentStyle: 'flash',
      attempts: 2 // conflict with flash
    };

    const res = validateBoulderInput(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.name).toBeDefined();
    expect(res.errors.location).toBeDefined();
    expect(res.errors.date).toBeDefined();
    expect(res.errors.grade).toBeDefined();
    expect(res.errors.attempts).toBeDefined();
  });

  it('AC-1: validates and accepts complete valid input', () => {
    const valid: BoulderInput = {
      name: 'Rainbow Rocket',
      location: 'Fontainebleau',
      sector: 'Cuvier',
      date: '2026-09-04',
      gradeScale: 'font',
      grade: '8A',
      ascentStyle: 'top',
      attempts: 12,
      wallAngle: 'vertical',
      holdTypes: ['sloper', 'crimp'],
      perceivedDifficulty: 'fair',
      rating: 5,
      cruxDescription: 'Dyno to distant lip sloper',
      notes: 'Best highball dyno in the forest',
      tags: ['dyno', 'classic', 'highball']
    };

    const res = validateBoulderInput(valid);
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);
  });

  it('AC-3: automatically forces attempts to 1 for Flash and Onsight', () => {
    const flashInput: BoulderInput = {
      name: 'Karma',
      location: 'Fontainebleau',
      date: '2026-09-04',
      gradeScale: 'font',
      grade: '7A',
      ascentStyle: 'flash',
      attempts: 5, // should be forced to 1
      holdTypes: ['sloper'],
      tags: []
    };

    const boulder = createBoulder(flashInput);
    expect(boulder.attempts).toBe(1);
    expect(boulder.ascentStyle).toBe('flash');
  });

  it('AC-4: preserves rich attributes (hold types, wall angle, crux, perceived difficulty)', () => {
    const input: BoulderInput = {
      name: 'Midnight Express',
      location: 'Bimano Bern',
      sector: 'Cave',
      date: '2026-09-04',
      gradeScale: 'color',
      grade: 'Schwarz',
      colorHex: '#1e293b',
      ascentStyle: 'project',
      attempts: 4,
      wallAngle: 'roof',
      holdTypes: ['pinch', 'crimp', 'volume'],
      perceivedDifficulty: 'hard',
      rating: 4,
      cruxDescription: 'Heel-toe cam before the throw',
      notes: 'Need more core tension',
      tags: ['roof', 'heelhook', 'pinch']
    };

    const created = createBoulder(input);
    expect(created.wallAngle).toBe('roof');
    expect(created.holdTypes).toContain('pinch');
    expect(created.holdTypes).toContain('volume');
    expect(created.perceivedDifficulty).toBe('hard');
    expect(created.cruxDescription).toBe('Heel-toe cam before the throw');
  });

  it('performs CRUD operations correctly', () => {
    const created = createBoulder({
      name: 'First Climb',
      location: 'Local Gym',
      date: '2026-09-01',
      gradeScale: 'v_scale',
      grade: 'V4',
      ascentStyle: 'top',
      attempts: 3,
      holdTypes: ['jug'],
      tags: []
    });

    expect(getStoredBoulders().length).toBe(1);

    const updated = updateBoulder(created.id, {
      ...created,
      name: 'First Climb (Updated)',
      attempts: 4
    });
    expect(updated.name).toBe('First Climb (Updated)');
    expect(updated.attempts).toBe(4);

    const deleted = deleteBoulder(created.id);
    expect(deleted).toBe(true);
    expect(getStoredBoulders().length).toBe(0);
  });
});

describe('Search, Filter & Sorting (AC-5)', () => {
  const sampleBoulders: Boulder[] = [
    {
      id: '1',
      name: 'Super Slab',
      location: 'Blockfeld Winterthur',
      sector: 'Plattenwald',
      date: '2026-08-01',
      gradeScale: 'font',
      grade: '6A',
      ascentStyle: 'flash',
      attempts: 1,
      wallAngle: 'slab',
      holdTypes: ['sloper'],
      rating: 3,
      tags: ['balance', 'friction'],
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Roof Master',
      location: 'Minimum Zürich',
      sector: 'Wettkampfwand',
      date: '2026-08-15',
      gradeScale: 'font',
      grade: '7B',
      ascentStyle: 'top',
      attempts: 6,
      wallAngle: 'roof',
      holdTypes: ['crimp', 'pinch'],
      rating: 5,
      cruxDescription: 'Bicycle hook release',
      tags: ['power', 'roof'],
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-08-15T10:00:00Z'
    },
    {
      id: '3',
      name: 'Open Project',
      location: 'Minimum Zürich',
      sector: 'Dach',
      date: '2026-09-01',
      gradeScale: 'font',
      grade: '7C',
      ascentStyle: 'project',
      attempts: 8,
      wallAngle: 'roof',
      holdTypes: ['crimp'],
      rating: 5,
      tags: ['project', 'heavy'],
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ];

  it('searches across name, sector, and tags', () => {
    const byName = filterAndSortBoulders(sampleBoulders, { searchQuery: 'Slab' });
    expect(byName.length).toBe(1);
    expect(byName[0].name).toBe('Super Slab');

    const byTag = filterAndSortBoulders(sampleBoulders, { searchQuery: 'bicycle' });
    expect(byTag.length).toBe(1);
    expect(byTag[0].name).toBe('Roof Master');
  });

  it('filters by ascent style and wall angle', () => {
    const projects = filterAndSortBoulders(sampleBoulders, { ascentStyle: 'project' });
    expect(projects.length).toBe(1);
    expect(projects[0].name).toBe('Open Project');

    const roofBoulders = filterAndSortBoulders(sampleBoulders, { wallAngle: 'roof' });
    expect(roofBoulders.length).toBe(2);
  });

  it('sorts by grade descending and date', () => {
    const sortedGrade = filterAndSortBoulders(sampleBoulders, { sortBy: 'grade_desc' });
    expect(sortedGrade[0].grade).toBe('7C');
    expect(sortedGrade[1].grade).toBe('7B');
    expect(sortedGrade[2].grade).toBe('6A');

    const sortedDateAsc = filterAndSortBoulders(sampleBoulders, { sortBy: 'date_asc' });
    expect(sortedDateAsc[0].date).toBe('2026-08-01');
    expect(sortedDateAsc[2].date).toBe('2026-09-01');
  });
});

describe('Dashboard Statistics (AC-6)', () => {
  it('computes accurate totals, flash rate, hardest send, and grade distribution', () => {
    const boulders: Boulder[] = [
      {
        id: '1',
        name: 'B1',
        location: 'Gym',
        date: '2026-09-01',
        gradeScale: 'font',
        grade: '6A',
        ascentStyle: 'flash',
        attempts: 1,
        holdTypes: [],
        tags: [],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '2',
        name: 'B2',
        location: 'Gym',
        date: '2026-09-01',
        gradeScale: 'font',
        grade: '7A+',
        ascentStyle: 'top',
        attempts: 4,
        holdTypes: [],
        tags: [],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: '3',
        name: 'B3',
        location: 'Gym',
        date: '2026-09-02',
        gradeScale: 'font',
        grade: '7C',
        ascentStyle: 'project',
        attempts: 10,
        holdTypes: [],
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ];

    const stats = computeStats(boulders);
    expect(stats.totalLogged).toBe(3);
    expect(stats.totalTops).toBe(2); // 1 flash + 1 top
    expect(stats.totalProjects).toBe(1);
    expect(stats.flashRatePercent).toBe(50); // 1 flash out of 2 tops = 50%
    expect(stats.hardestGradeFont).toBe('7A+');
    expect(stats.hardestGradeV).toBe('V7');
    expect(stats.gradeDistribution['6A']).toBe(1);
    expect(stats.gradeDistribution['7A+']).toBe(1);
  });
});

describe('JSON Export & Import (AC-7)', () => {
  it('exports and re-imports data with validation', () => {
    saveStoredBoulders([]);
    const b = createBoulder({
      name: 'Export Test',
      location: 'Test Gym',
      date: '2026-09-04',
      gradeScale: 'font',
      grade: '6B',
      ascentStyle: 'top',
      attempts: 2,
      holdTypes: ['sloper'],
      tags: ['test']
    });

    const json = exportBouldersToJson([b]);
    expect(json).toContain('Export Test');

    // clear and re-import
    saveStoredBoulders([]);
    const res = importBouldersFromJson(json, 'replace');
    expect(res.count).toBe(1);
    const restored = getStoredBoulders();
    expect(restored.length).toBe(1);
    expect(restored[0].name).toBe('Export Test');
  });

  it('rejects malformed import payload', () => {
    expect(() => importBouldersFromJson('{ invalid json', 'merge')).toThrow();
    expect(() => importBouldersFromJson(JSON.stringify([{ name: 'Invalid' }]), 'merge')).toThrow();
  });
});
