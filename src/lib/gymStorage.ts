import { Gym, GymMember, GradeScale, Sector, BoulderReference, GymRole, User } from '../types/gym';
import { isPlatformAdmin } from './authService';

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

// Helpers for localStorage with in-memory fallback
let memoryGyms: Gym[] = [];
let memoryMembers: GymMember[] = [];
let memoryGradeScales: GradeScale[] = [];
let memorySectors: Sector[] = [];
let memoryBoulders: BoulderReference[] = [];

function getStorage<T>(key: string, memoryFallback: T[]): T[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(`Failed reading ${key} from localStorage`, e);
    }
  }
  return [...memoryFallback];
}

function setStorage<T>(key: string, data: T[], setMemory: (val: T[]) => void): void {
  setMemory([...data]);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed writing ${key} to localStorage`, e);
    }
  }
}

export function resetAllGymData(): void {
  memoryGyms = [];
  memoryMembers = [];
  memoryGradeScales = [];
  memorySectors = [];
  memoryBoulders = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(GYMS_KEY);
    window.localStorage.removeItem(MEMBERS_KEY);
    window.localStorage.removeItem(GRADE_SCALES_KEY);
    window.localStorage.removeItem(SECTORS_KEY);
    window.localStorage.removeItem(BOULDERS_KEY);
  }
}

export function getGyms(): Gym[] {
  return getStorage<Gym>(GYMS_KEY, memoryGyms);
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

    const s1 = createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Überhang 45° (Comp Wall)',
      wall_photo_url: '/images/walls/overhang.jpg',
      sort_order: 1
    });

    const s2 = createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Dachbereich & Cave',
      wall_photo_url: '/images/walls/roof.jpg',
      sort_order: 2
    });

    const s3 = createSector(defaultGym.id, CURRENT_USER.id, {
      name: 'Platte (Slab & Balance)',
      wall_photo_url: '/images/walls/slab.jpg',
      sort_order: 3
    });

    const scales = getGradeScales(defaultGym.id);
    const yellowScale = scales[0]?.id || 's_yellow';
    const blueScale = scales[2]?.id || 's_blue';
    const redScale = scales[3]?.id || 's_red';

    saveBoulders([
      { id: 'b_sample_1', sector_id: s1.id, grade_scale_id: yellowScale, position_x: 0.28, position_y: 0.65, status: 'active', name: 'Gelbe 1' },
      { id: 'b_sample_2', sector_id: s1.id, grade_scale_id: blueScale, position_x: 0.52, position_y: 0.42, status: 'active', name: 'Blaues Volumen-Problem' },
      { id: 'b_sample_3', sector_id: s1.id, grade_scale_id: redScale, position_x: 0.74, position_y: 0.31, status: 'active', name: 'Rote Leiste' },
      { id: 'b_sample_4', sector_id: s2.id, grade_scale_id: redScale, position_x: 0.45, position_y: 0.55, status: 'active', name: 'Dach-Crux' },
      { id: 'b_sample_5', sector_id: s3.id, grade_scale_id: blueScale, position_x: 0.35, position_y: 0.60, status: 'active', name: 'Platten-Reibung' }
    ]);
  }

  // 2. Ensure 6a plus (Winterthur) exists & Boris has setter permissions
  const currentGyms = getGyms();
  let gym6a = currentGyms.find(g => 
    g.id === 'gym-6a-plus' || 
    g.name.toLowerCase().includes('6a plus') || 
    g.name.toLowerCase().includes('6aplus')
  );

  if (!gym6a) {
    gym6a = createGym({
      id: 'gym-6a-plus',
      name: '6a plus Kletter- & Boulderhalle Winterthur',
      city: 'Winterthur',
      address: 'Klosterstrasse 17',
      website: 'https://sechsaplus.ch',
      logo_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop'
    }, CURRENT_USER.id);

    createSector(gym6a.id, CURRENT_USER.id, {
      name: 'Halle 1',
      wall_photo_url: '/images/walls/six-a-comp.jpg',
      sort_order: 1
    });

    const s1 = createSector(gym6a.id, CURRENT_USER.id, {
      name: 'Wettkampfwand (Comp Wall)',
      wall_photo_url: '/images/walls/six-a-comp.jpg',
      sort_order: 2
    });

    const s2 = createSector(gym6a.id, CURRENT_USER.id, {
      name: 'Dachgrotte & Überhang',
      wall_photo_url: '/images/walls/six-a-roof.jpg',
      sort_order: 3
    });

    const s3 = createSector(gym6a.id, CURRENT_USER.id, {
      name: 'Platte (Slab & Reibung)',
      wall_photo_url: '/images/walls/six-a-slab.jpg',
      sort_order: 4
    });

    const scales = getGradeScales(gym6a.id);
    const yellowScale = scales[0]?.id || 's_yellow_6a';
    const blueScale = scales[2]?.id || 's_blue_6a';
    const redScale = scales[3]?.id || 's_red_6a';

    const existingBoulders = getBoulders();
    saveBoulders([
      ...existingBoulders,
      { id: 'b_6a_1', sector_id: s1.id, grade_scale_id: yellowScale, position_x: 0.32, position_y: 0.62, status: 'active', name: 'Gelber Auftakt' },
      { id: 'b_6a_2', sector_id: s1.id, grade_scale_id: blueScale, position_x: 0.52, position_y: 0.38, status: 'active', name: '6a+ Boulder-Crux' },
      { id: 'b_6a_3', sector_id: s2.id, grade_scale_id: redScale, position_x: 0.65, position_y: 0.45, status: 'active', name: 'Dach-Problem Rot' },
      { id: 'b_6a_4', sector_id: s3.id, grade_scale_id: blueScale, position_x: 0.38, position_y: 0.52, status: 'active', name: '6A+ Platten-Traverse' }
    ]);
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
}

export function saveGyms(gyms: Gym[]): void {
  setStorage<Gym>(GYMS_KEY, gyms, val => { memoryGyms = val; });
}

export function getMembers(): GymMember[] {
  return getStorage<GymMember>(MEMBERS_KEY, memoryMembers);
}

export function saveMembers(members: GymMember[]): void {
  setStorage<GymMember>(MEMBERS_KEY, members, val => { memoryMembers = val; });
}

export function getGradeScales(gym_id?: string): GradeScale[] {
  const all = getStorage<GradeScale>(GRADE_SCALES_KEY, memoryGradeScales);
  return gym_id ? all.filter(g => g.gym_id === gym_id).sort((a, b) => a.sort_order - b.sort_order) : all;
}

export function saveGradeScales(scales: GradeScale[]): void {
  setStorage<GradeScale>(GRADE_SCALES_KEY, scales, val => { memoryGradeScales = val; });
}

export function getSectors(gym_id?: string): Sector[] {
  let all = getStorage<Sector>(SECTORS_KEY, memorySectors);
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
  setStorage<Sector>(SECTORS_KEY, sectors, val => { memorySectors = val; });
}

export function getBoulders(sector_id?: string): BoulderReference[] {
  const all = getStorage<BoulderReference>(BOULDERS_KEY, memoryBoulders);
  return sector_id ? all.filter(b => b.sector_id === sector_id) : all;
}

export function saveBoulders(boulders: BoulderReference[]): void {
  setStorage<BoulderReference>(BOULDERS_KEY, boulders, val => { memoryBoulders = val; });
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

  const all = getStorage<GradeScale>(GRADE_SCALES_KEY, memoryGradeScales);
  const others = all.filter(s => s.gym_id !== gym_id);
  saveGradeScales([...others, ...validated]);
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

  const all = getStorage<Sector>(SECTORS_KEY, memorySectors);
  saveSectors([...all, newSector]);
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

  const all = getStorage<Sector>(SECTORS_KEY, memorySectors);
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
  return updatedGymSectors.sort((a, b) => a.sort_order - b.sort_order);
}

// AC-5: Bei Aktualisierung des Sektor-Wandfotos bleiben bestehende relative
// Boulder-Koordinaten (position_x, position_y als 0.0-1.0) unverändert erhalten.
export function updateSectorWallPhoto(
  sector_id: string,
  user_id: string,
  new_wall_photo_url: string
): Sector {
  const all = getStorage<Sector>(SECTORS_KEY, memorySectors);
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
  const all = getStorage<Sector>(SECTORS_KEY, memorySectors);
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
