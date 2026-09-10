import { Gym, GymMember, GradeScale, Sector, BoulderReference, GymRole, User } from '../types/gym';
import { isPlatformAdmin } from './authService';
import { SEED_EXISTING_BOULDERS } from './seedData';

export type { GradeScale };

const GYMS_KEY = 'boulder_gyms_v1';
const MEMBERS_KEY = 'boulder_gym_members_v1';
const GRADE_SCALES_KEY = 'boulder_grade_scales_v1';
const SECTORS_KEY = 'boulder_sectors_v1';
const BOULDERS_KEY = 'boulder_routes_v1';

// Default current user simulation (Boris / Admin)
export const CURRENT_USER: User = {
  id: 'user-boris',
  name: 'Boris',
  email: 'boris@bouldermate.ch'
};

import {
  getStorageJson,
  setStorageJson,
  removeStorageItem,
} from './storageUtils';

export function resetAllGymData(): void {
  removeStorageItem(GYMS_KEY);
  removeStorageItem(MEMBERS_KEY);
  removeStorageItem(GRADE_SCALES_KEY);
  removeStorageItem(SECTORS_KEY);
  removeStorageItem(BOULDERS_KEY);
}

export function getGyms(): Gym[] {
  return getStorageJson<Gym[]>(GYMS_KEY, []);
}

export function saveGyms(gyms: Gym[]): void {
  setStorageJson(GYMS_KEY, gyms);
}

export function getMembers(): GymMember[] {
  return getStorageJson<GymMember[]>(MEMBERS_KEY, []);
}

export function saveMembers(members: GymMember[]): void {
  setStorageJson(MEMBERS_KEY, members);
}

export function ensureInitialGymData(): void {
  const existing = getGyms();

  // 1. Ensure Minimum Bouldern Zürich exists
  if (!existing.some(g => g.name.toLowerCase().includes('minimum') || g.id === 'gym-minimum-zh')) {
    const defaultGym = createGym({
      id: 'gym-minimum-zh',
      name: 'Minimum Bouldern Zürich',
      city: 'Zürich',
      address: 'Flüelastrasse 31',
      website: 'https://minimum.ch',
      logo_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop'
    }, CURRENT_USER.id);

    createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Überhang 45° (Comp Wall)',
      wall_photo_url: '/images/walls/overhang.jpg',
      sort_order: 1
    });

    createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Dachbereich & Cave',
      wall_photo_url: '/images/walls/roof.jpg',
      sort_order: 2
    });

    createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Platte (Slab & Balance)',
      wall_photo_url: '/images/walls/slab.jpg',
      sort_order: 3
    });

    setGymGradeScales(defaultGym.id, CURRENT_USER.id, [
      { id: 'scale-green', gym_id: defaultGym.id, color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '4a', font_range_max: '5b', sort_order: 1 },
      { id: 'scale-blue', gym_id: defaultGym.id, color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Fortgeschritten', font_range_min: '5c', font_range_max: '6b', sort_order: 2 },
      { id: 'scale-yellow', gym_id: defaultGym.id, color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sportlich', font_range_min: '6b+', font_range_max: '7a', sort_order: 3 },
      { id: 'scale-red', gym_id: defaultGym.id, color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Schwer', font_range_min: '7a+', font_range_max: '7b+', sort_order: 4 },
      { id: 'scale-black', gym_id: defaultGym.id, color_name: 'Schwarz', color_hex: '#1e293b', difficulty_label: 'Sehr schwer', font_range_min: '7c', font_range_max: '8a', sort_order: 5 },
      { id: 'scale-white', gym_id: defaultGym.id, color_name: 'Weiß', color_hex: '#f8fafc', difficulty_label: 'Elite', font_range_min: '8a+', font_range_max: '8b+', sort_order: 6 }
    ]);

    // (Boulders will be comprehensively populated from SEED_EXISTING_BOULDERS below)
  }

  // 2. Ensure 6a plus (Winterthur) exists & Boris has setter permissions
  const currentGyms = getGyms();
  let gym6a = currentGyms.find(g => 
    g.id === 'gym-6a-plus' || 
    g.name.toLowerCase().includes('6a plus') || 
    g.name.toLowerCase().includes('6aplus')
  );

  const gym6aNewlyCreated = !gym6a;
  if (!gym6a) {
    gym6a = createGym({
      id: 'gym-6a-plus',
      name: '6a plus Kletter- & Boulderhalle Winterthur',
      city: 'Winterthur',
      address: 'Klosterstrasse 17',
      website: 'https://sechsaplus.ch',
      logo_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop'
    }, CURRENT_USER.id);
  }

  // Ensure 6a plus has all 6 official grade scales: Blau, Grün, Gelb, Rot, Weiss, Beige
  const current6aScales = getGradeScales(gym6a.id);
  const needs6aMigration = gym6aNewlyCreated || current6aScales.length === 0 ||
    current6aScales.some(s => s.color_name === 'Schwarz' || s.color_name === 'Lila' || s.color_name === 'Weiß') ||
    !current6aScales.some(s => s.color_name === 'Beige');

  if (needs6aMigration) {
    setGymGradeScales(gym6a.id, CURRENT_USER.id, [
      { id: 'scale_6a_blau', gym_id: gym6a.id, color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Gemütlich', font_range_min: '3', font_range_max: '4+', sort_order: 1 },
      { id: 'scale_6a_gruen', gym_id: gym6a.id, color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Flott', font_range_min: '5', font_range_max: '5+', sort_order: 2 },
      { id: 'scale_6a_gelb', gym_id: gym6a.id, color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Trick', font_range_min: '6a', font_range_max: '6b', sort_order: 3 },
      { id: 'scale_6a_rot', gym_id: gym6a.id, color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Rassig', font_range_min: '6b+', font_range_max: '6c+', sort_order: 4 },
      { id: 'scale_6a_weiss', gym_id: gym6a.id, color_name: 'Weiss', color_hex: '#f8fafc', difficulty_label: 'Böse', font_range_min: '7a', font_range_max: '7b', sort_order: 5 },
      { id: 'scale_6a_beige', gym_id: gym6a.id, color_name: 'Beige', color_hex: '#d2b48c', difficulty_label: 'Bestial', font_range_min: '7b+', font_range_max: '8c+', sort_order: 6 },
    ]);
  }

  // Auto-migrate legacy boulders referencing deprecated scale IDs
  const allBoulders = getBoulders();
  let bouldersMigrated = false;
  const migratedBoulders = allBoulders.map(b => {
    if (b.grade_scale_id === 'scale_6a_schwarz' || b.grade_scale_id === 'scale_6a_lila') {
      bouldersMigrated = true;
      return { ...b, grade_scale_id: 'scale_6a_beige' };
    }
    return b;
  });
  if (bouldersMigrated) {
    saveBoulders(migratedBoulders);
  }

  // Ensure 6a plus has default sectors if none exist yet
  const current6aSectors = getStorageJson<Sector[]>(SECTORS_KEY, []).filter(s => s.gym_id === gym6a.id);
  if (current6aSectors.length === 0) {
    const otherSectors = getStorageJson<Sector[]>(SECTORS_KEY, []).filter(s => s.gym_id !== gym6a.id);
    const new6aSectors: Sector[] = [
      { id: 'sec_6a_slab_vorne', gym_id: gym6a.id, name: 'Slab Vorne', wall_photo_url: '/images/walls/6aplus/SlapVorne.jpg', sort_order: 1, created_at: new Date().toISOString() },
      { id: 'sec_6a_ecke_vorne', gym_id: gym6a.id, name: 'Ecke Vorne', wall_photo_url: '/images/walls/6aplus/EckeVorne.jpg', sort_order: 2, created_at: new Date().toISOString() },
      { id: 'sec_6a_zwischenwand_vorne', gym_id: gym6a.id, name: 'Zwischenwand Vorne', wall_photo_url: '/images/walls/6aplus/ZwischenwandVorne.jpg', sort_order: 3, created_at: new Date().toISOString() },
      { id: 'sec_6a_ueberhang_vorne', gym_id: gym6a.id, name: 'Überhang Vorne', wall_photo_url: '/images/walls/6aplus/UerberhangVorne.jpg', sort_order: 4, created_at: new Date().toISOString() },
      { id: 'sec_6a_verlaengerung_ueberhang', gym_id: gym6a.id, name: 'Verlängerung Überhang', wall_photo_url: '/images/walls/6aplus/VerlaengerungUeberhang.jpg', sort_order: 5, created_at: new Date().toISOString() },
      { id: 'sec_6a_ecke_mitte', gym_id: gym6a.id, name: 'Ecke Mitte', wall_photo_url: '/images/walls/6aplus/EckeMitte.jpg', sort_order: 6, created_at: new Date().toISOString() },
      { id: 'sec_6a_cave', gym_id: gym6a.id, name: 'Cave', wall_photo_url: '/images/walls/6aplus/Cave.jpg', sort_order: 7, created_at: new Date().toISOString() },
      { id: 'sec_6a_cave_wand', gym_id: gym6a.id, name: 'Cave Wand', wall_photo_url: '/images/walls/6aplus/CaveWand.jpg', sort_order: 8, created_at: new Date().toISOString() },
    ];
    saveSectors([...otherSectors, ...new6aSectors]);

    // (Boulders will be comprehensively populated from SEED_EXISTING_BOULDERS below)
  }

  // 3. Register default roles for fake personas across gyms
  const allGyms = getGyms();
  const currentMembers = getMembers();
  let membersChanged = false;

  const ensureMember = (gymId: string, userId: string, role: GymRole) => {
    if (!currentMembers.some(m => m.gym_id === gymId && m.user_id === userId && m.role === role)) {
      currentMembers.push({
        id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        gym_id: gymId,
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      });
      membersChanged = true;
    }
  };

  const gym6aFound = allGyms.find(g => g.id === 'gym-6a-plus' || g.name.toLowerCase().includes('6a'));
  if (gym6aFound) {
    ensureMember(gym6aFound.id, 'user-boris', 'admin');
    ensureMember(gym6aFound.id, 'user-boris', 'setter');
    ensureMember(gym6aFound.id, 'admin-6aplus', 'admin');
    ensureMember(gym6aFound.id, 'schrauber-6aplus', 'setter');
  }

  const gymMinimumFound = allGyms.find(g => g.id === 'gym-minimum-zh' || g.name.toLowerCase().includes('minimum'));
  if (gymMinimumFound) {
    ensureMember(gymMinimumFound.id, 'user-boris', 'admin');
    ensureMember(gymMinimumFound.id, 'user-boris', 'setter');
    ensureMember(gymMinimumFound.id, 'admin-minimum', 'admin');
    ensureMember(gymMinimumFound.id, 'schrauber-minimum', 'setter');
  }

  if (membersChanged) {
    saveMembers(currentMembers);
  }

  // 4. Ensure all seed boulders exist in local storage for both gyms
  const currentBoulders = getBoulders();
  const existingIds = new Set(currentBoulders.map(b => b.id));
  const missingSeedBoulders = SEED_EXISTING_BOULDERS
    .filter(b => !existingIds.has(b.id))
    .map(b => ({
      id: b.id,
      sector_id: b.sectorId,
      grade_scale_id: b.gradeScaleId,
      position_x: b.positionX,
      position_y: b.positionY,
      status: b.status,
      name: b.name
    }));
  if (missingSeedBoulders.length > 0) {
    saveBoulders([...currentBoulders, ...missingSeedBoulders]);
  }
}

export function deduplicateGradeScales(scales: GradeScale[]): GradeScale[] {
  const map = new Map<string, GradeScale>();
  for (const s of scales) {
    const normGym = (s.gym_id && (s.gym_id === 'gym-6a-plus' || s.gym_id.includes('6a') || s.gym_id.includes('f2b11564')))
      ? 'gym-6a-plus'
      : (s.gym_id && (s.gym_id === 'gym-minimum-zh' || s.gym_id.includes('minimum') || s.gym_id.includes('814696b2')))
      ? 'gym-minimum-zh'
      : s.gym_id;
    const key = `${normGym}:::${s.color_name.trim().toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...s, gym_id: normGym });
    } else {
      map.set(key, {
        ...existing,
        ...s,
        id: existing.id || s.id,
        gym_id: normGym,
        color_hex: s.color_hex || existing.color_hex,
        difficulty_label: s.difficulty_label || existing.difficulty_label,
        font_range_min: s.font_range_min || existing.font_range_min,
        font_range_max: s.font_range_max || existing.font_range_max,
        sort_order: s.sort_order ?? existing.sort_order,
      });
    }
  }
  return Array.from(map.values());
}

export function getGradeScales(gym_id?: string): GradeScale[] {
  let all = getStorageJson<GradeScale[]>(GRADE_SCALES_KEY, []);
  const deduped = deduplicateGradeScales(all);
  if (deduped.length !== all.length) {
    setStorageJson(GRADE_SCALES_KEY, deduped);
    all = deduped;
  }
  if (!gym_id) return all;

  const targetGymNorm = (gym_id === 'gym-6a-plus' || gym_id.includes('6a') || gym_id.includes('f2b11564'))
    ? 'gym-6a-plus'
    : (gym_id === 'gym-minimum-zh' || gym_id.includes('minimum') || gym_id.includes('814696b2'))
    ? 'gym-minimum-zh'
    : gym_id;

  return all
    .filter(g => {
      const gGymNorm = (g.gym_id === 'gym-6a-plus' || g.gym_id.includes('6a') || g.gym_id.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (g.gym_id === 'gym-minimum-zh' || g.gym_id.includes('minimum') || g.gym_id.includes('814696b2'))
        ? 'gym-minimum-zh'
        : g.gym_id;
      return gGymNorm === targetGymNorm;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function saveGradeScales(scales: GradeScale[]): void {
  const deduped = deduplicateGradeScales(scales);
  setStorageJson(GRADE_SCALES_KEY, deduped);
}

export function getSectors(gym_id?: string): Sector[] {
  let all = getStorageJson<Sector[]>(SECTORS_KEY, []);
  let hasMigrated = false;
  all = all.map(s => {
    if (s.wall_photo_url.includes('photo-1522163182402')) {
      hasMigrated = true;
      return { ...s, wall_photo_url: '/images/walls/overhang.jpg' };
    }
    if (s.wall_photo_url.includes('photo-1564769625905') || s.wall_photo_url.includes('photo-1564769662533')) {
      hasMigrated = true;
      return { ...s, wall_photo_url: '/images/walls/roof.jpg' };
    }
    // 6a plus sectors: ensure they have their own dedicated photos instead of Minimum's
    if (s.gym_id === 'gym-6a-plus') {
      if (s.name.includes('Wettkampf') && s.wall_photo_url === '/images/walls/overhang.jpg') {
        hasMigrated = true;
        return { ...s, wall_photo_url: '/images/walls/six-a-comp.jpg' };
      }
      if (s.name.includes('Dach') && s.wall_photo_url === '/images/walls/roof.jpg') {
        hasMigrated = true;
        return { ...s, wall_photo_url: '/images/walls/six-a-roof.jpg' };
      }
      if (s.name.includes('Platte') && s.wall_photo_url === '/images/walls/slab.jpg') {
        hasMigrated = true;
        return { ...s, wall_photo_url: '/images/walls/six-a-slab.jpg' };
      }
    }
    return s;
  });
  if (hasMigrated) {
    saveSectors(all);
  }
  return gym_id ? all.filter(s => s.gym_id === gym_id).sort((a, b) => a.sort_order - b.sort_order) : all;
}

export function saveSectors(sectors: Sector[]): void {
  setStorageJson(SECTORS_KEY, sectors);
}

export function getBoulders(sector_id?: string): BoulderReference[] {
  const all = getStorageJson<BoulderReference[]>(BOULDERS_KEY, []);
  return sector_id ? all.filter(b => b.sector_id === sector_id) : all;
}

export function saveBoulders(boulders: BoulderReference[]): void {
  setStorageJson(BOULDERS_KEY, boulders);
}

// User role check in gym
export function getUserRoleInGym(gym_id: string, user_id: string): GymRole | null {
  const members = getMembers();
  const membership = members.find(m => m.gym_id === gym_id && m.user_id === user_id);
  return membership ? membership.role : null;
}

export function isGymAdmin(gym_id: string, user_id: string): boolean {
  if (isPlatformAdmin(user_id)) return true;
  return getUserRoleInGym(gym_id, user_id) === 'admin';
}

// SPEC-000: Nur Plattform-Administratoren dürfen neue Hallen anlegen.
// Der Ersteller erhält automatisch die Rolle `admin` in `gym_members`.
// Optional kann der Plattform-Admin direkt einen initialen Hallen-Admin festlegen.
export function createGym(
  input: { id?: string; name: string; address?: string; city?: string; logo_url?: string; website?: string; initial_admin_user_id?: string },
  user_id: string = CURRENT_USER.id
): Gym {
  if (!isPlatformAdmin(user_id)) {
    throw new Error('Nur Plattform-Administratoren dürfen neue Hallen anlegen.');
  }

  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Hallenname ist ein Pflichtfeld.');
  }

  const gymId = input.id || ('gym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
  const now = new Date().toISOString();

  const newGym: Gym = {
    id: gymId,
    name: input.name.trim(),
    address: input.address?.trim() || undefined,
    city: input.city?.trim() || undefined,
    logo_url: input.logo_url?.trim() || undefined,
    website: input.website?.trim() || undefined,
    created_by: user_id,
    created_at: now
  };

  const gyms = getGyms();
  saveGyms([...gyms, newGym]);

  // Assign admin role to creator (AC-1)
  const member: GymMember = {
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    gym_id: gymId,
    user_id,
    role: 'admin',
    created_at: now
  };

  const members = getMembers();
  const newMembers = [...members, member];

  // If initial_admin_user_id was specified by the platform admin, assign admin role to that user as well
  if (input.initial_admin_user_id && input.initial_admin_user_id !== user_id) {
    newMembers.push({
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      gym_id: gymId,
      user_id: input.initial_admin_user_id,
      role: 'admin',
      appointed_by: user_id,
      created_at: now
    });
  }

  saveMembers(newMembers);

  // Initialize with standard default grade scale for this gym (AC-2 convenience)
  const defaultScales: Omit<GradeScale, 'id' | 'created_at'>[] = [
    { gym_id: gymId, color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sehr leicht', font_range_min: '3', font_range_max: '4+', sort_order: 1 },
    { gym_id: gymId, color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '5', font_range_max: '5+', sort_order: 2 },
    { gym_id: gymId, color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Mittel', font_range_min: '6A', font_range_max: '6B+', sort_order: 3 },
    { gym_id: gymId, color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Schwer', font_range_min: '6C', font_range_max: '7A+', sort_order: 4 },
    { gym_id: gymId, color_name: 'Schwarz', color_hex: '#1e293b', difficulty_label: 'Sehr schwer', font_range_min: '7B', font_range_max: '7C+', sort_order: 5 },
    { gym_id: gymId, color_name: 'Weiß', color_hex: '#f8fafc', difficulty_label: 'Extrem', font_range_min: '8A', font_range_max: '8B+', sort_order: 6 }
  ];

  setGymGradeScales(gymId, user_id, defaultScales);

  return newGym;
}

// AC-2: Hallen-Admin kann das hallenspezifische Farbsystem anlegen und bearbeiten.
export function setGymGradeScales(
  gym_id: string,
  user_id: string,
  scales: Array<Omit<GradeScale, 'id' | 'created_at'> & { id?: string }>
): GradeScale[] {
  if (!isGymAdmin(gym_id, user_id)) {
    throw new Error('Nur Hallen-Admins dürfen das Bewertungssystem konfigurieren.');
  }

  const now = new Date().toISOString();
  const validated: GradeScale[] = scales.map((s, idx) => {
    if (!s.color_name?.trim()) throw new Error('Jede Farbe benötigt einen color_name.');
    if (!s.color_hex?.trim()) throw new Error('Jede Farbe benötigt einen color_hex Farbwert.');
    if (!s.difficulty_label?.trim()) throw new Error('Jede Farbe benötigt ein difficulty_label.');
    if (!s.font_range_min?.trim() || !s.font_range_max?.trim()) {
      throw new Error('Jede Farbe benötigt font_range_min und font_range_max.');
    }

    return {
      id: s.id || 'scale_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
      gym_id,
      color_name: s.color_name.trim(),
      color_hex: s.color_hex.trim(),
      difficulty_label: s.difficulty_label.trim(),
      font_range_min: s.font_range_min.trim(),
      font_range_max: s.font_range_max.trim(),
      sort_order: s.sort_order !== undefined ? s.sort_order : idx + 1,
      created_at: now
    };
  });

  const all = getGradeScales();
  const targetGymNorm = (gym_id === 'gym-6a-plus' || gym_id.includes('6a') || gym_id.includes('f2b11564'))
    ? 'gym-6a-plus'
    : (gym_id === 'gym-minimum-zh' || gym_id.includes('minimum') || gym_id.includes('814696b2'))
    ? 'gym-minimum-zh'
    : gym_id;

  const others = all.filter(s => {
    const sNorm = (s.gym_id === 'gym-6a-plus' || s.gym_id.includes('6a') || s.gym_id.includes('f2b11564'))
      ? 'gym-6a-plus'
      : (s.gym_id === 'gym-minimum-zh' || s.gym_id.includes('minimum') || s.gym_id.includes('814696b2'))
      ? 'gym-minimum-zh'
      : s.gym_id;
    return sNorm !== targetGymNorm;
  });
  saveGradeScales([...others, ...validated]);

  // Synchronize with V2 store (batchBoulderService) immediately
  try {
    const v2Scales = getStorageJson<any[]>('boulderapp_grade_scales_v2', []);
    const otherV2 = v2Scales.filter(s => {
      const sNorm = (s.gymId === 'gym-6a-plus' || s.gymId?.includes('6a') || s.gymId?.includes('f2b11564'))
        ? 'gym-6a-plus'
        : (s.gymId === 'gym-minimum-zh' || s.gymId?.includes('minimum') || s.gymId?.includes('814696b2'))
        ? 'gym-minimum-zh'
        : s.gymId;
      return sNorm !== targetGymNorm && s.gymId !== gym_id;
    });
    const newV2 = validated.map(sc => ({
      id: sc.id,
      gymId: gym_id,
      colorName: sc.color_name,
      colorHex: sc.color_hex,
      difficultyLabel: sc.difficulty_label,
      fontRangeMin: sc.font_range_min,
      fontRangeMax: sc.font_range_max,
      sortOrder: sc.sort_order,
    }));
    setStorageJson('boulderapp_grade_scales_v2', [...otherV2, ...newV2]);
  } catch (e) {}

  // SPEC-001 AC-2.1: Reaktivität für Schrauber- und Kletterer-Bereich auslösen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bouldermate:gradescales_updated', {
      detail: { gymId: gym_id, normalizedGymId: targetGymNorm }
    }));
  }

  // Asynchroner non-destruktiver Aufwärts-Sync nach Supabase
  try {
    import('./syncService').then(m => {
      if (m && typeof m.syncGradeScalesToSupabase === 'function') {
        m.syncGradeScalesToSupabase(gym_id, validated).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}

  return validated.sort((a, b) => a.sort_order - b.sort_order);
}

// AC-3: Sektoren erfordern `name` und ein valides `wall_photo_url`.
export function createSector(
  gym_id: string,
  user_id: string,
  input: { name: string; wall_photo_url: string; sort_order?: number }
): Sector {
  if (!isGymAdmin(gym_id, user_id)) {
    throw new Error('Nur Hallen-Admins dürfen Sektoren anlegen.');
  }

  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Sektorname ist ein Pflichtfeld.');
  }

  if (!input.wall_photo_url || input.wall_photo_url.trim().length === 0) {
    throw new Error('Wandfoto (wall_photo_url) ist ein Pflichtfeld.');
  }

  const existingSectors = getSectors(gym_id);
  const now = new Date().toISOString();

  const newSector: Sector = {
    id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    gym_id,
    name: input.name.trim(),
    wall_photo_url: input.wall_photo_url.trim(),
    sort_order: input.sort_order !== undefined ? input.sort_order : existingSectors.length + 1,
    created_at: now
  };

  const all = getSectors();
  saveSectors([...all, newSector]);

  try {
    import('./syncService').then(m => {
      const syncFn = (m as any)?.syncSectorToSupabase;
      if (typeof syncFn === 'function') {
        syncFn(newSector).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}

  return newSector;
}

// AC-4: Sektoren können in ihrer Anzeigereihenfolge (sort_order) sortiert werden.
export function reorderSectors(
  gym_id: string,
  user_id: string,
  orderedSectorIds: string[]
): Sector[] {
  if (!isGymAdmin(gym_id, user_id)) {
    throw new Error('Nur Hallen-Admins dürfen Sektoren sortieren.');
  }

  const all = getSectors();
  const gymSectors = all.filter(s => s.gym_id === gym_id);
  const otherSectors = all.filter(s => s.gym_id !== gym_id);

  const updatedGymSectors = gymSectors.map(sec => {
    const newIndex = orderedSectorIds.indexOf(sec.id);
    return {
      ...sec,
      sort_order: newIndex !== -1 ? newIndex + 1 : sec.sort_order
    };
  });

  saveSectors([...otherSectors, ...updatedGymSectors]);

  // Synchronize to batchBoulderService storage (v2) if present
  try {
    const v2Sectors = getStorageJson<any[]>('boulderapp_sectors_v2', []);
    if (v2Sectors && v2Sectors.length > 0) {
      let changed = false;
      const updatedV2 = v2Sectors.map(s => {
        if (s.gymId === gym_id) {
          const newIndex = orderedSectorIds.indexOf(s.id);
          if (newIndex !== -1 && s.sortOrder !== newIndex + 1) {
            changed = true;
            return { ...s, sortOrder: newIndex + 1 };
          }
        }
        return s;
      });
      if (changed) {
        setStorageJson('boulderapp_sectors_v2', updatedV2);
      }
    }
  } catch (e) {
    // Ignore error
  }

  return updatedGymSectors.sort((a, b) => a.sort_order - b.sort_order);
}

// AC-5: Bei Aktualisierung des Sektor-Wandfotos bleiben bestehende relative
// Boulder-Koordinaten (position_x, position_y als 0.0-1.0) unverändert erhalten.
export function updateSectorWallPhoto(
  sector_id: string,
  user_id: string,
  new_wall_photo_url: string
): Sector {
  const all = getSectors();
  const sector = all.find(s => s.id === sector_id);
  if (!sector) throw new Error('Sektor nicht gefunden.');

  if (!isGymAdmin(sector.gym_id, user_id)) {
    throw new Error('Nur Hallen-Admins dürfen Wandfotos aktualisieren.');
  }

  if (!new_wall_photo_url || new_wall_photo_url.trim().length === 0) {
    throw new Error('Neues Wandfoto (wall_photo_url) ist erforderlich.');
  }

  // Verify that all boulders belonging to this sector keep their exact position_x & position_y
  const existingBoulders = getBoulders(sector_id);
  const originalCoordinates = existingBoulders.map(b => ({
    id: b.id,
    x: b.position_x,
    y: b.position_y
  }));

  sector.wall_photo_url = new_wall_photo_url.trim();
  saveSectors(all);

  try {
    import('./syncService').then(m => {
      const syncFn = (m as any)?.syncSectorToSupabase;
      if (typeof syncFn === 'function') {
        syncFn(sector).catch(() => {});
      }
    }).catch(() => {});
  } catch (e) {}

  // Assert coordinates remain untouched (AC-5 verification guarantee)
  const currentBoulders = getBoulders(sector_id);
  for (const orig of originalCoordinates) {
    const cur = currentBoulders.find(b => b.id === orig.id);
    if (cur && (cur.position_x !== orig.x || cur.position_y !== orig.y)) {
      throw new Error(`Kritischer Fehler: Koordinaten von Boulder ${orig.id} wurden unerlaubt verändert!`);
    }
  }

  return sector;
}

// AC-6: Sektoren mit aktiven Bouldern können nicht versehentlich gelöscht werden (Sicherheitsabfrage / Validierung).
export function deleteSector(
  sector_id: string,
  user_id: string
): boolean {
  const all = getSectors();
  const sector = all.find(s => s.id === sector_id);
  if (!sector) return false;

  if (!isGymAdmin(sector.gym_id, user_id)) {
    throw new Error('Nur Hallen-Admins dürfen Sektoren löschen.');
  }

  const boulders = getBoulders(sector_id);
  const activeBoulders = boulders.filter(b => b.status === 'active');

  if (activeBoulders.length > 0) {
    throw new Error(
      `Sektor "${sector.name}" kann nicht gelöscht werden, da er noch ${activeBoulders.length} aktive Boulder enthält. Bitte archiviere oder lösche diese zuerst.`
    );
  }

  const remaining = all.filter(s => s.id !== sector_id);
  saveSectors(remaining);
  return true;
}

// AC-7: Kletterer können Hallen suchen und eine Übersicht aller Sektoren mit Wandfoto und aktiver Boulder-Anzahl einsehen.
export function searchGymsWithSectors(query?: string): Array<Gym & { sectors: Array<Sector & { active_boulder_count: number }> }> {
  const gyms = getGyms();
  const sectors = getSectors();
  const boulders = getBoulders();

  const filteredGyms = query?.trim()
    ? gyms.filter(g =>
        g.name.toLowerCase().includes(query.toLowerCase().trim()) ||
        (g.city && g.city.toLowerCase().includes(query.toLowerCase().trim())) ||
        (g.address && g.address.toLowerCase().includes(query.toLowerCase().trim()))
      )
    : gyms;

  return filteredGyms.map(gym => {
    const gymSectors = sectors
      .filter(s => s.gym_id === gym.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(sec => {
        const activeCount = boulders.filter(b => b.sector_id === sec.id && b.status === 'active').length;
        return {
          ...sec,
          active_boulder_count: activeCount
        };
      });

    return {
      ...gym,
      sectors: gymSectors
    };
  });
}
