import {
  Gym,
  Sector,
  GymGradeScale,
  WallBoulder,
  DraftBoulderInput,
  BatchPublishResult,
  GymMemberRole,
  DEFAULT_RADAR,
  RadarAttributes
} from '../types/boulder';
import * as gymStorage from './gymStorage';

const STORAGE_KEY_GYMS = 'boulderapp_gyms_v2';
const STORAGE_KEY_SECTORS = 'boulderapp_sectors_v2';
const STORAGE_KEY_GRADE_SCALES = 'boulderapp_grade_scales_v2';
const STORAGE_KEY_WALL_BOULDERS = 'boulderapp_wall_boulders_v2';
const STORAGE_KEY_LAST_COLOR_PREFIX = 'boulderapp_last_color_';

// Initial realistic seed data
export const SEED_GYM: Gym = {
  id: 'gym-minimum-zh',
  name: 'Minimum Boulder Zürich',
  city: 'Zürich',
  address: 'Flüelastrasse 31, 8048 Zürich',
  createdBy: 'user-admin-1',
  createdAt: '2026-09-01T10:00:00Z',
};

export const SEED_GRADE_SCALES: GymGradeScale[] = [
  { id: 'scale-green', gymId: 'gym-minimum-zh', colorName: 'Grün', colorHex: '#22c55e', difficultyLabel: 'Leicht', fontRangeMin: '4a', fontRangeMax: '5b', sortOrder: 1 },
  { id: 'scale-blue', gymId: 'gym-minimum-zh', colorName: 'Blau', colorHex: '#3b82f6', difficultyLabel: 'Fortgeschritten', fontRangeMin: '5c', fontRangeMax: '6b', sortOrder: 2 },
  { id: 'scale-yellow', gymId: 'gym-minimum-zh', colorName: 'Gelb', colorHex: '#eab308', difficultyLabel: 'Sportlich', fontRangeMin: '6b+', fontRangeMax: '7a', sortOrder: 3 },
  { id: 'scale-red', gymId: 'gym-minimum-zh', colorName: 'Rot', colorHex: '#ef4444', difficultyLabel: 'Schwer', fontRangeMin: '7a+', fontRangeMax: '7b+', sortOrder: 4 },
  { id: 'scale-black', gymId: 'gym-minimum-zh', colorName: 'Schwarz', colorHex: '#1e293b', difficultyLabel: 'Sehr schwer', fontRangeMin: '7c', fontRangeMax: '8a', sortOrder: 5 },
  { id: 'scale-white', gymId: 'gym-minimum-zh', colorName: 'Weiß', colorHex: '#f8fafc', difficultyLabel: 'Elite', fontRangeMin: '8a+', fontRangeMax: '8b+', sortOrder: 6 },
];

export const SEED_SECTORS: Sector[] = [
  {
    id: 'sector-overhang',
    gymId: 'gym-minimum-zh',
    name: 'Überhang 45°',
    wallPhotoUrl: '/images/walls/overhang.jpg',
    sortOrder: 1,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'sector-slab',
    gymId: 'gym-minimum-zh',
    name: 'Platte (Slab & Balance)',
    wallPhotoUrl: '/images/walls/slab.jpg',
    sortOrder: 2,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'sector-roof',
    gymId: 'gym-minimum-zh',
    name: 'Wettkampf-Dach & Cave',
    wallPhotoUrl: '/images/walls/roof.jpg',
    sortOrder: 3,
    createdAt: '2026-09-01T10:00:00Z',
  },
];

export const SEED_EXISTING_BOULDERS: WallBoulder[] = [
  {
    id: 'boulder-existing-1',
    sectorId: 'sector-overhang',
    gradeScaleId: 'scale-blue',
    positionX: 0.35,
    positionY: 0.42,
    name: 'Dyno King',
    notes: 'Dynamischer Zug an die Leiste',
    setterId: 'setter-1',
    status: 'active',
    radar: { kraft: 4, technik: 3, balance: 2, koordination: 4, flexibilitaet: 2 },
    createdAt: '2026-08-25T14:00:00Z',
    publishedAt: '2026-08-25T18:00:00Z',
  },
  {
    id: 'boulder-existing-2',
    sectorId: 'sector-overhang',
    gradeScaleId: 'scale-yellow',
    positionX: 0.68,
    positionY: 0.55,
    name: 'Heel-Hook Madness',
    notes: 'Körperspannung am Untergriff',
    setterId: 'setter-1',
    status: 'active',
    radar: { kraft: 3, technik: 5, balance: 4, koordination: 3, flexibilitaet: 4 },
    createdAt: '2026-08-25T14:30:00Z',
    publishedAt: '2026-08-25T18:00:00Z',
  }
];

// Helper: Memory fallback if localStorage is absent (e.g. Node tests without mock)
let memoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  } else {
    memoryStore[key] = value;
  }
}

export function clearBatchServiceStorage(): void {
  memoryStore = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_GYMS);
    window.localStorage.removeItem(STORAGE_KEY_SECTORS);
    window.localStorage.removeItem(STORAGE_KEY_GRADE_SCALES);
    window.localStorage.removeItem(STORAGE_KEY_WALL_BOULDERS);
  }
}

// -------------------------------------------------------------
// AC-1: Role Verification (setter or admin)
// -------------------------------------------------------------
export function checkSetterPermission(role: GymMemberRole): void {
  if (role !== 'setter' && role !== 'admin') {
    throw new Error('Zugriff verweigert: Nur Nutzer mit der Rolle "Schrauber" oder "Admin" dürfen Boulder erfassen.');
  }
}

// -------------------------------------------------------------
// Gyms, Sectors & GradeScales (Synchronized with gymStorage)
// -------------------------------------------------------------
export function getGyms(): Gym[] {
  const data = getStorageItem(STORAGE_KEY_GYMS);
  let v2Gyms: Gym[] = [];
  if (data) {
    try {
      v2Gyms = JSON.parse(data);
    } catch {
      v2Gyms = [SEED_GYM];
    }
  } else {
    v2Gyms = [SEED_GYM];
  }

  // Also include any gyms registered via gymStorage (SPEC-001)
  try {
    const v1Gyms = gymStorage.getGyms();
    const existingIds = new Set(v2Gyms.map(g => g.id));
    for (const g of v1Gyms) {
      if (!existingIds.has(g.id)) {
        v2Gyms.push({
          id: g.id,
          name: g.name,
          address: g.address,
          city: g.city,
          logoUrl: g.logo_url,
          website: g.website,
          createdBy: g.created_by,
          createdAt: g.created_at,
        });
        existingIds.add(g.id);
      }
    }
  } catch (e) {
    console.error('Error synchronizing gyms from gymStorage:', e);
  }

  return v2Gyms;
}

export function getSectors(gymId: string): Sector[] {
  const data = getStorageItem(STORAGE_KEY_SECTORS);
  let all: Sector[] = [];
  if (data) {
    try {
      all = JSON.parse(data);
    } catch {
      all = [...SEED_SECTORS];
    }
  } else {
    all = [...SEED_SECTORS];
  }

  // Auto-migrate legacy generic Unsplash placeholder images to realistic indoor gym photos
  let hasMigrated = false;
  all = all.map(s => {
    if (s.wallPhotoUrl.includes('photo-1522163182402')) {
      hasMigrated = true;
      return { ...s, wallPhotoUrl: '/images/walls/overhang.jpg' };
    }
    if (s.wallPhotoUrl.includes('photo-1564769662533') || s.wallPhotoUrl.includes('photo-1564769625905')) {
      hasMigrated = true;
      return { ...s, wallPhotoUrl: '/images/walls/slab.jpg' };
    }
    if (s.wallPhotoUrl.includes('photo-1516592673884')) {
      hasMigrated = true;
      return { ...s, wallPhotoUrl: '/images/walls/roof.jpg' };
    }
    return s;
  });
  if (hasMigrated) {
    setStorageItem(STORAGE_KEY_SECTORS, JSON.stringify(all));
  }

  // Also include sectors created via gymStorage for this gym
  try {
    const v1Sectors = gymStorage.getSectors(gymId);
    const existingIds = new Set(all.map(s => s.id));
    for (const s of v1Sectors) {
      if (!existingIds.has(s.id)) {
        all.push({
          id: s.id,
          gymId: s.gym_id,
          name: s.name,
          wallPhotoUrl: s.wall_photo_url || '/images/walls/overhang.jpg',
          sortOrder: s.sort_order || 1,
          createdAt: s.created_at,
        });
        existingIds.add(s.id);
      }
    }
  } catch (e) {
    console.error('Error synchronizing sectors from gymStorage:', e);
  }

  return all.filter(s => s.gymId === gymId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSectorById(sectorId: string): Sector | null {
  const gyms = getGyms();
  for (const gym of gyms) {
    const sectors = getSectors(gym.id);
    const found = sectors.find(s => s.id === sectorId);
    if (found) return found;
  }
  return null;
}

// AC-2: Update Sector Wall Photo (preserves relative coordinates of all boulders)
export function updateSectorPhoto(sectorId: string, newPhotoUrl: string): Sector {
  if (!newPhotoUrl || !newPhotoUrl.trim()) {
    throw new Error('Eine gültige Bild-URL oder Foto ist erforderlich.');
  }
  const allData = getStorageItem(STORAGE_KEY_SECTORS);
  let sectors: Sector[] = allData ? JSON.parse(allData) : [...SEED_SECTORS];
  const idx = sectors.findIndex(s => s.id === sectorId);
  if (idx === -1) {
    // If not in v2, check if it's in gymStorage and add to v2
    const sector = getSectorById(sectorId);
    if (sector) {
      const updatedSector = { ...sector, wallPhotoUrl: newPhotoUrl.trim() };
      sectors.push(updatedSector);
      setStorageItem(STORAGE_KEY_SECTORS, JSON.stringify(sectors));
      return updatedSector;
    }
    throw new Error(`Sektor mit ID "${sectorId}" wurde nicht gefunden.`);
  }

  sectors[idx] = {
    ...sectors[idx],
    wallPhotoUrl: newPhotoUrl.trim(),
  };

  setStorageItem(STORAGE_KEY_SECTORS, JSON.stringify(sectors));
  return sectors[idx];
}

export function getGradeScales(gymId: string): GymGradeScale[] {
  const data = getStorageItem(STORAGE_KEY_GRADE_SCALES);
  let all: GymGradeScale[] = [];
  if (data) {
    try {
      all = JSON.parse(data);
    } catch {
      all = [...SEED_GRADE_SCALES];
    }
  } else {
    all = [...SEED_GRADE_SCALES];
  }

  // Also include grade scales from gymStorage
  try {
    const v1Scales = gymStorage.getGradeScales(gymId);
    const existingIds = new Set(all.map(s => s.id));
    for (const sc of v1Scales) {
      if (!existingIds.has(sc.id)) {
        all.push({
          id: sc.id,
          gymId: sc.gym_id,
          colorName: sc.color_name,
          colorHex: sc.color_hex,
          difficultyLabel: sc.difficulty_label,
          fontRangeMin: sc.font_range_min,
          fontRangeMax: sc.font_range_max,
          sortOrder: sc.sort_order,
        });
        existingIds.add(sc.id);
      }
    }
  } catch (e) {
    console.error('Error synchronizing grade scales from gymStorage:', e);
  }

  const gymScales = all.filter(s => s.gymId === gymId).sort((a, b) => a.sortOrder - b.sortOrder);
  if (gymScales.length > 0) {
    return gymScales;
  }

  // Provide sensible standard gym scales for newly created gyms
  return SEED_GRADE_SCALES.map((scale, idx) => ({
    ...scale,
    id: `scale-${gymId}-${idx}`,
    gymId: gymId,
  }));
}

// -------------------------------------------------------------
// AC-5: Smart Color Memory (Remember last selected color per gym)
// -------------------------------------------------------------
export function getLastSelectedGradeScaleId(gymId: string): string | null {
  return getStorageItem(STORAGE_KEY_LAST_COLOR_PREFIX + gymId);
}

export function setLastSelectedGradeScaleId(gymId: string, scaleId: string): void {
  setStorageItem(STORAGE_KEY_LAST_COLOR_PREFIX + gymId, scaleId);
}

// -------------------------------------------------------------
// Wall Boulder Lifecycle
// -------------------------------------------------------------
export function getWallBoulders(sectorId?: string): WallBoulder[] {
  const data = getStorageItem(STORAGE_KEY_WALL_BOULDERS);
  let all: WallBoulder[] = [];
  if (!data) {
    all = [...SEED_EXISTING_BOULDERS];
    setStorageItem(STORAGE_KEY_WALL_BOULDERS, JSON.stringify(all));
  } else {
    try {
      all = JSON.parse(data);
    } catch {
      all = [...SEED_EXISTING_BOULDERS];
    }
  }

  if (sectorId) {
    return all.filter(b => b.sectorId === sectorId);
  }
  return all;
}

function saveWallBoulders(boulders: WallBoulder[]): void {
  setStorageItem(STORAGE_KEY_WALL_BOULDERS, JSON.stringify(boulders));

  try {
    const existing = gymStorage.getBoulders();
    const map = new Map(existing.map(b => [b.id, b]));
    for (const b of boulders) {
      map.set(b.id, {
        id: b.id,
        sector_id: b.sectorId,
        grade_scale_id: b.gradeScaleId,
        position_x: b.positionX,
        position_y: b.positionY,
        status: b.status,
        name: b.name
      });
    }
    gymStorage.saveBoulders(Array.from(map.values()));
  } catch (e) {
    // Non-blocking in isolated unit tests
  }
}

// AC-3 & AC-4 & AC-8: Create Draft Boulder
export function createDraftBoulder(
  input: DraftBoulderInput,
  userRole: GymMemberRole = 'setter'
): WallBoulder {
  checkSetterPermission(userRole);

  // AC-4: Only gradeScaleId (Hallen-Farbe) is mandatory
  if (!input.gradeScaleId || !input.gradeScaleId.trim()) {
    throw new Error('Farbauswahl (Hallenfarbe / Schwierigkeit) ist erforderlich.');
  }

  // AC-3: Relative coordinates must be between 0.0 and 1.0
  if (
    typeof input.positionX !== 'number' ||
    input.positionX < 0 ||
    input.positionX > 1 ||
    typeof input.positionY !== 'number' ||
    input.positionY < 0 ||
    input.positionY > 1
  ) {
    throw new Error('Ungültige relative Koordinaten: Werte müssen zwischen 0.0 und 1.0 liegen.');
  }

  const radar: RadarAttributes = {
    kraft: input.radar?.kraft ?? DEFAULT_RADAR.kraft,
    technik: input.radar?.technik ?? DEFAULT_RADAR.technik,
    balance: input.radar?.balance ?? DEFAULT_RADAR.balance,
    koordination: input.radar?.koordination ?? DEFAULT_RADAR.koordination,
    flexibilitaet: input.radar?.flexibilitaet ?? DEFAULT_RADAR.flexibilitaet,
  };

  const newBoulder: WallBoulder = {
    id: input.id || 'draft_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    sectorId: input.sectorId,
    gradeScaleId: input.gradeScaleId,
    positionX: Number(input.positionX.toFixed(4)),
    positionY: Number(input.positionY.toFixed(4)),
    name: input.name?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    setterId: input.setterId,
    status: 'draft', // AC-8: Must remain draft until published
    radar,
    fontGrade: input.fontGrade,
    createdAt: new Date().toISOString(),
  };

  const current = getWallBoulders();
  current.push(newBoulder);
  saveWallBoulders(current);

  // AC-5: Save last selected color
  setLastSelectedGradeScaleId('gym-minimum-zh', input.gradeScaleId);

  return newBoulder;
}

// AC-7: Update Boulder Position (Drag & Drop / Reposition)
export function updateBoulderPosition(
  boulderId: string,
  positionX: number,
  positionY: number
): WallBoulder {
  if (positionX < 0 || positionX > 1 || positionY < 0 || positionY > 1) {
    throw new Error('Koordinaten müssen zwischen 0.0 und 1.0 liegen.');
  }

  const all = getWallBoulders();
  const idx = all.findIndex(b => b.id === boulderId);
  if (idx === -1) {
    throw new Error(`Boulder mit ID "${boulderId}" existiert nicht.`);
  }

  all[idx] = {
    ...all[idx],
    positionX: Number(positionX.toFixed(4)),
    positionY: Number(positionY.toFixed(4)),
  };

  saveWallBoulders(all);
  return all[idx];
}

// Update Boulder Details (e.g. changing color or radar in edit modal)
export function updateBoulderDetails(
  boulderId: string,
  updates: Partial<Omit<WallBoulder, 'id' | 'sectorId' | 'status' | 'createdAt'>>
): WallBoulder {
  const all = getWallBoulders();
  const idx = all.findIndex(b => b.id === boulderId);
  if (idx === -1) {
    throw new Error(`Boulder mit ID "${boulderId}" existiert nicht.`);
  }

  all[idx] = {
    ...all[idx],
    ...updates,
    radar: {
      ...all[idx].radar,
      ...(updates.radar || {}),
    },
  };

  saveWallBoulders(all);
  return all[idx];
}

// Delete Draft Boulder
export function deleteDraftBoulder(boulderId: string): void {
  const all = getWallBoulders();
  const filtered = all.filter(b => !(b.id === boulderId && b.status === 'draft'));
  saveWallBoulders(filtered);
}

// AC-9: Transactional Batch Publish
export function publishBatch(
  sectorId: string,
  setterId: string,
  archiveBoulderIds: string[] = []
): BatchPublishResult {
  const all = getWallBoulders();
  const now = new Date().toISOString();

  const publishedBoulderIds: string[] = [];
  const archivedBoulderIds: string[] = [];

  const updated = all.map(b => {
    // 1. Publish all drafts in this sector created by this setter
    if (b.sectorId === sectorId && b.status === 'draft' && b.setterId === setterId) {
      publishedBoulderIds.push(b.id);
      return {
        ...b,
        status: 'active' as const,
        publishedAt: now,
      };
    }

    // 2. Mark specified boulders as archived
    if (archiveBoulderIds.includes(b.id) && b.sectorId === sectorId) {
      archivedBoulderIds.push(b.id);
      return {
        ...b,
        status: 'archived' as const,
        archivedAt: now,
      };
    }

    return b;
  });

  saveWallBoulders(updated);

  return {
    sectorId,
    publishedCount: publishedBoulderIds.length,
    archivedCount: archivedBoulderIds.length,
    publishedBoulderIds,
    archivedBoulderIds,
  };
}
