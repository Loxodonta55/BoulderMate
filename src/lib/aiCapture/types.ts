// SPEC-052: Typen der KI-Routenerfassung (geteilt von App, Worker und Eval-Skript).
import type { RadarAttributes } from '../../types/boulder';
import type { HoldColor, PaletteEntry } from './colors';

/** Woran die Halle den Grad zeigt: Griff-Farbe, farbiger Zettel/Tape am Start oder Zeichen am Start (SPEC-052 F2 v5) */
export type GradeMarker = 'holds' | 'tape' | 'symbol';
export const GRADE_MARKERS: GradeMarker[] = ['holds', 'tape', 'symbol'];
export const isGradeMarker = (v: unknown): v is GradeMarker => v === 'holds' || v === 'tape' || v === 'symbol';
/** Höchstlänge des Hinweises der Halle an die KI */
export const GRADE_HINT_MAX = 300;
/** Höchstlänge der Zeichen je Farbe */
export const GRADE_SYMBOL_MAX = 40;
export type RouteNameStyle = 'fun' | 'plain' | 'none';
export type AiPublishMode = 'direct' | 'review';
/** neu = Sektor ohne aktive Routen, full = Ganze Wand neu, partial = Nur einzelne Routen neu */
export type CaptureMode = 'new' | 'full' | 'partial';
export type AiJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'undone';
export type NameSource = 'tape' | 'ai' | 'plain' | 'setter';

/** Aktive Route, die beim Teil-Umbau mitgeschickt wird. */
export interface ExistingRoute {
  id: string;
  x: number;
  y: number;
  gradeScaleId: string;
  colorName?: string;
  holdColor?: string | null;
  name?: string;
}

export interface CaptureContext {
  gymName?: string;
  sectorName?: string;
  gradeMarker: GradeMarker;
  /** Hinweis der Halle an die KI (Admin, ≤ 300 Zeichen) */
  gradeHint?: string;
  palette: PaletteEntry[];
  nameStyle: RouteNameStyle;
  mode: CaptureMode;
  /** Aktive Routen des Sektors (nur für partial nötig) */
  existing?: ExistingRoute[];
  /** Aktive Namen der ganzen Halle (Eindeutigkeit) */
  takenNames?: string[];
}

/** Eine geprüfte, erkannte Route. Koordinaten 0–1 relativ zum aufrecht gedrehten Foto. */
export interface CapturedRoute {
  x: number;
  y: number;
  holdColor: HoldColor | null;
  /** Farbe, die den Grad bestimmt (Griff- oder Tape-Farbe, je nach Halle) – Rohtext der KI */
  gradeColorRaw: string | null;
  gradeScaleId: string | null;
  gradePending: boolean;
  confidence: number;
  radar: Required<Pick<RadarAttributes, 'maximalkraft' | 'kraftausdauer' | 'technik' | 'balance' | 'koordination' | 'flexibilitaet'>>;
  /** Auf dem Tape lesbarer Name (falls vorhanden) */
  tapeName: string | null;
  /** Namensvorschlag der KI */
  nameSuggestion: string | null;
  /** Teil-Umbau: Id einer bestehenden Route, die gleich geblieben ist */
  matchesExistingId: string | null;
  /** Gründe für «Kurz prüfen» */
  reviewReasons: string[];
}

export interface CaptureResult {
  routes: CapturedRoute[];
  /** Teil-Umbau: Ids alter Routen, die laut KI nicht mehr an der Wand sind */
  removedExistingIds: string[];
  warnings: string[];
}
