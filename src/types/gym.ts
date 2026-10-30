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
  /** SPEC-025: Koordinaten für die Hallen-Karte (WGS84) */
  lat?: number;
  lng?: number;
  /** SPEC-028 F16: Treff in dieser Halle erlaubt (undefined = ja) */
  treff_enabled?: boolean;
  /** SPEC-041: Meldung der Halle «ruhig/normal/voll», gilt 90 Minuten ab crowd_updated_at */
  crowd_level?: 'ruhig' | 'normal' | 'voll';
  crowd_updated_at?: string;
  /** SPEC-052: KI-Routenerfassung */
  ai_capture_enabled?: boolean;
  grade_marker?: 'holds' | 'tape' | 'symbol';
  /** Zeichen am Start je Farbe (Art «symbol»), z. B. { "<scaleId>": "★★, 2 Sterne" } */
  grade_symbols?: Record<string, string>;
  /** Hinweis der Halle an die KI (≤ 300 Zeichen) */
  ai_grade_hint?: string;
  route_name_style?: 'fun' | 'plain' | 'none';
  ai_publish_mode?: 'direct' | 'review';
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
