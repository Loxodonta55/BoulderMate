export type GradeScale = 'font' | 'v_scale' | 'color';

export const FONT_GRADES = [
  '3', '4', '4+', '5', '5+',
  '6A', '6A+', '6B', '6B+', '6C', '6C+',
  '7A', '7A+', '7B', '7B+', '7C', '7C+',
  '8A', '8A+', '8B', '8B+', '8C', '8C+'
] as const;

export type FontGrade = typeof FONT_GRADES[number];

export const V_GRADES = [
  'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5',
  'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12',
  'V13', 'V14', 'V15', 'V16', 'V17'
] as const;

export type VGrade = typeof V_GRADES[number];

export const COLOR_GRADES = [
  { name: 'Gelb (Sehr leicht)', value: 'Gelb', hex: '#eab308', equivalentFont: '3-4', equivalentV: 'VB-V0' },
  { name: 'Grün (Leicht)', value: 'Grün', hex: '#22c55e', equivalentFont: '5-5+', equivalentV: 'V1-V2' },
  { name: 'Blau (Mittel)', value: 'Blau', hex: '#3b82f6', equivalentFont: '6A-6B+', equivalentV: 'V3-V4' },
  { name: 'Rot (Schwer)', value: 'Rot', hex: '#ef4444', equivalentFont: '6C-7A+', equivalentV: 'V5-V7' },
  { name: 'Schwarz (Sehr schwer)', value: 'Schwarz', hex: '#1e293b', equivalentFont: '7B-7C+', equivalentV: 'V8-V10' },
  { name: 'Weiß (Extrem)', value: 'Weiß', hex: '#f8fafc', equivalentFont: '8A-8B', equivalentV: 'V11-V13' },
  { name: 'Lila / Pink (Elite)', value: 'Lila', hex: '#a855f7', equivalentFont: '8B+-8C+', equivalentV: 'V14-V17' }
] as const;

export type ColorGrade = typeof COLOR_GRADES[number]['value'];

export type AscentStyle = 'flash' | 'onsight' | 'top' | 'project' | 'repeat';

export const ASCENT_STYLES: { value: AscentStyle; label: string; description: string; badgeColor: string }[] = [
  { value: 'flash', label: 'Flash', description: 'Im 1. Versuch mit Beta getoppt', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'onsight', label: 'Onsight', description: 'Im 1. Versuch ohne Beta getoppt', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'top', label: 'Top / Redpoint', description: 'Erfolgreich durchstiegen (ab Versuch 2)', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'project', label: 'Projekt', description: 'Noch nicht getoppt (in Arbeit)', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { value: 'repeat', label: 'Wiederholung', description: 'Zuvor schon getoppt', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export type WallAngle = 'slab' | 'vertical' | 'overhang' | 'roof' | 'traverse';

export const WALL_ANGLES: { value: WallAngle; label: string }[] = [
  { value: 'slab', label: 'Platte (Slab)' },
  { value: 'vertical', label: 'Senkrecht' },
  { value: 'overhang', label: 'Leicht überhängend' },
  { value: 'roof', label: 'Dach / Stark überhängend' },
  { value: 'traverse', label: 'Traverse' },
];

export type HoldType = 'crimp' | 'sloper' | 'pinch' | 'jug' | 'pocket' | 'volume';

export const HOLD_TYPES: { value: HoldType; label: string }[] = [
  { value: 'crimp', label: 'Leisten (Crimps)' },
  { value: 'sloper', label: 'Aufleger (Sloper)' },
  { value: 'pinch', label: 'Zangen (Pinches)' },
  { value: 'jug', label: 'Henkel (Jugs)' },
  { value: 'pocket', label: 'Löcher (Pockets)' },
  { value: 'volume', label: 'Volumen (Volumes)' },
];

export type PerceivedDifficulty = 'soft' | 'fair' | 'hard';

export const PERCEIVED_DIFFICULTIES: { value: PerceivedDifficulty; label: string }[] = [
  { value: 'soft', label: 'Soft (eher leicht für den Grad)' },
  { value: 'fair', label: 'Fair (passend bewertet)' },
  { value: 'hard', label: 'Hard (sehr hart für den Grad)' },
];

export interface Boulder {
  id: string;
  name: string;
  location: string;
  sector?: string;
  date: string; // ISO 8601: YYYY-MM-DD
  gradeScale: GradeScale;
  grade: string;
  colorHex?: string;
  ascentStyle: AscentStyle;
  attempts: number;
  wallAngle?: WallAngle;
  holdTypes: HoldType[];
  perceivedDifficulty?: PerceivedDifficulty;
  rating?: number; // 1 to 5
  cruxDescription?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BoulderInput {
  name: string;
  location: string;
  sector?: string;
  date: string;
  gradeScale: GradeScale;
  grade: string;
  colorHex?: string;
  ascentStyle: AscentStyle;
  attempts: number;
  wallAngle?: WallAngle;
  holdTypes: HoldType[];
  perceivedDifficulty?: PerceivedDifficulty;
  rating?: number;
  cruxDescription?: string;
  notes?: string;
  tags: string[];
}

export interface BoulderFilterOptions {
  searchQuery?: string;
  gradeScale?: GradeScale | 'all';
  ascentStyle?: AscentStyle | 'all';
  wallAngle?: WallAngle | 'all';
  holdType?: HoldType | 'all';
  location?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'grade_desc' | 'grade_asc' | 'rating_desc';
}

export interface BoulderStats {
  totalLogged: number;
  totalTops: number;
  totalProjects: number;
  flashRatePercent: number;
  hardestGradeFont: string | null;
  hardestGradeV: string | null;
  gradeDistribution: Record<string, number>;
}

// ==========================================
// SPEC-001 & SPEC-002: Gym, Sector & Batch Wall Boulders
// ==========================================

export type GymMemberRole = 'admin' | 'setter' | 'member';

export interface Gym {
  id: string;
  name: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  website?: string;
  createdBy: string;
  createdAt: string;
}

export interface GymMember {
  id: string;
  gymId: string;
  userId: string;
  role: GymMemberRole;
  createdAt: string;
}

export interface GymGradeScale {
  id: string;
  gymId: string;
  colorName: string;
  colorHex: string;
  difficultyLabel: string;
  fontRangeMin: string;
  fontRangeMax: string;
  sortOrder: number;
}

export interface Sector {
  id: string;
  gymId: string;
  name: string;
  wallPhotoUrl: string;
  sortOrder: number;
  createdAt: string;
}

export interface RadarAttributes {
  kraft: number; // 1 - 5, default 3
  technik: number; // 1 - 5, default 3
  balance: number; // 1 - 5, default 3
  koordination: number; // 1 - 5, default 3
  flexibilitaet: number; // 1 - 5, default 3
}

export const DEFAULT_RADAR: RadarAttributes = {
  kraft: 3,
  technik: 3,
  balance: 3,
  koordination: 3,
  flexibilitaet: 3,
};

export type BoulderStatus = 'draft' | 'active' | 'archived';

export interface WallBoulder {
  id: string;
  sectorId: string;
  gradeScaleId: string;
  positionX: number; // 0.0 - 1.0 (relative coordinates)
  positionY: number; // 0.0 - 1.0 (relative coordinates)
  name?: string;
  notes?: string;
  setterId: string;
  status: BoulderStatus;
  radar: RadarAttributes;
  fontGrade?: string;
  createdAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface DraftBoulderInput {
  id?: string;
  sectorId: string;
  gradeScaleId: string;
  positionX: number;
  positionY: number;
  name?: string;
  notes?: string;
  setterId: string;
  radar?: Partial<RadarAttributes>;
  fontGrade?: string;
}

export interface BatchPublishResult {
  publishedCount: number;
  archivedCount: number;
  sectorId: string;
  publishedBoulderIds: string[];
  archivedBoulderIds: string[];
}

// ==========================================
// SPEC-003: Boulder Details, Ratings & Logging
// ==========================================

export type AscentType = 'flash' | 'top' | 'project';
export type GradeFeel = 'soft' | 'fair' | 'stiff';

export interface Ascent {
  id: string;
  userId: string;
  userNickname: string;
  userAvatarUrl?: string;
  boulderId: string;
  type: AscentType;
  createdAt: string;
}

export interface BoulderRating {
  id: string;
  boulderId: string;
  userId: string;
  userNickname: string;
  gradeFeel?: GradeFeel;
  qualityStars?: number; // 1 - 5
  radar?: RadarAttributes;
  createdAt: string;
  updatedAt: string;
}

export interface RatingInput {
  gradeFeel?: GradeFeel;
  qualityStars?: number;
  radar?: RadarAttributes;
}

export interface BoulderStatsAggregate {
  boulderId: string;
  totalRatings: number;
  avgStars: number;
  gradeFeelCounts: {
    soft: number;
    fair: number;
    stiff: number;
  };
  gradeFeelPercentages: {
    soft: number;
    fair: number;
    stiff: number;
  };
  dominantGradeFeel: GradeFeel | null;
  totalTops: number;
  totalFlashes: number;
  totalProjects: number;
  radarAggregate: RadarAttributes;
  ascents: Ascent[];
}

export interface CurrentUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
  role: GymMemberRole;
  isPlatformAdmin?: boolean;
}

// ==========================================
// SPEC-004: Profile, Statistics & Logbook
// ==========================================

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string; // ISO timestamp, e.g. "2026-05-15T00:00:00Z"
  updatedAt?: string;
}

export interface ProfileKPIs {
  totalTops: number; // Tops + Flashes (AC-2)
  totalFlashes: number; // Flashes only (AC-2)
  bestTop: GymGradeScale | null; // Highest color band topped (AC-2)
  bestFlash: GymGradeScale | null; // Highest color band flashed (AC-2)
}

export interface GradeDistributionItem {
  gradeScale: GymGradeScale;
  flashCount: number;
  topCount: number; // regular tops (excluding flash)
  totalCount: number; // flashCount + topCount
}

export interface LogbookEntry {
  id: string;
  ascentId: string;
  boulderId: string;
  boulderName?: string;
  type: AscentType; // 'flash' | 'top' | 'project'
  createdAt: string;
  gymId: string;
  gymName: string;
  sectorId: string;
  sectorName: string;
  gradeScale: GymGradeScale;
}

export interface ProfileData {
  profile: UserProfile;
  kpis: ProfileKPIs;
  gradeDistribution: GradeDistributionItem[];
  logbook: LogbookEntry[];
}

// ==========================================
// SPEC-008: Climber Performance & Style Statistics
// ==========================================

export interface StyleAttributeMetric {
  key: keyof RadarAttributes;
  label: string;
  userScore: number;       // 1.0 - 5.0
  gymScore: number;        // 1.0 - 5.0
  delta: number;           // userScore - gymScore
  sendRatePercent: number; // 0 - 100
  flashRatePercent: number;// 0 - 100
  highestGradeTopped?: GymGradeScale;
  attemptsCount: number;
}

export interface RecommendedBoulderInsight {
  id: string;
  name: string;
  sectorName: string;
  gradeColorHex: string;
  gradeColorName: string;
  difficultyLabel: string;
  attributeValue: number;
}

export interface PerformanceInsight {
  attribute: keyof RadarAttributes;
  attributeLabel: string;
  type: 'strength' | 'weakness';
  headline: string;
  description: string;
  metricHighlight: string;
  recommendedBoulder?: RecommendedBoulderInsight;
}

export interface AthletePerformanceReport {
  userId: string;
  gymId: string;
  gymName: string;
  isUnlocked: boolean;      // true if loggedAscentsCount >= 5
  loggedAscentsCount: number;
  minRequiredAscents: number;// 5
  medianGradeOrder: number;
  userRadar: RadarAttributes;
  gymRadar: RadarAttributes;
  strength: PerformanceInsight | null;
  weakness: PerformanceInsight | null;
  attributeMetrics: StyleAttributeMetric[];
}

