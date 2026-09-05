export type GymRole = 'admin' | 'setter' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_platform_admin?: boolean;
}

export interface Gym {
  id: string;
  name: string;
  address?: string;
  city?: string;
  logo_url?: string;
  website?: string;
  created_by: string;
  created_at: string;
}

export interface GymMember {
  id: string;
  gym_id: string;
  user_id: string;
  role: GymRole;
  appointed_by?: string;
  created_at: string;
}

export interface UserGymPermissions {
  userId: string;
  gymId?: string;
  isClimber: true; // IMMER true
  isSetter: boolean;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  canAccessSetterStudio: boolean;
  canAccessAdminConsole: boolean;
  canAppointSetters: boolean;
  canAppointAdmins: boolean;
  canCreateGyms: boolean;
}

export interface GradeScale {
  id: string;
  gym_id: string;
  color_name: string;
  color_hex: string;
  difficulty_label: string;
  font_range_min: string;
  font_range_max: string;
  sort_order: number;
  created_at: string;
}

export interface Sector {
  id: string;
  gym_id: string;
  name: string;
  wall_photo_url: string;
  sort_order: number;
  created_at: string;
}

export interface BoulderReference {
  id: string;
  sector_id: string;
  grade_scale_id: string;
  position_x: number; // 0.0 to 1.0
  position_y: number; // 0.0 to 1.0
  status: 'draft' | 'active' | 'archived';
  name?: string;
}

export interface GymDetails extends Gym {
  role?: GymRole;
  grade_scales: GradeScale[];
  sectors: (Sector & { active_boulder_count: number })[];
}
