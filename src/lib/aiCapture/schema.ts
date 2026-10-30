// SPEC-052: Antwort der KI prüfen und auf sichere Werte bringen.
// Die KI darf nie etwas Ungültiges in die Datenbank bringen: Koordinaten 0–1,
// Merkmale 1–5, Farbe nur aus dem Farbsystem der Halle, sonst «Grad folgt».
import { matchPaletteColor, matchPaletteSymbol, toHoldColor } from './colors';
import type { CaptureContext, CaptureResult, CapturedRoute } from './types';

export const REVIEW_CONFIDENCE = 0.6;
export const MAX_ROUTES_PER_PHOTO = 80;
const DUPLICATE_DISTANCE = 0.02;

const RADAR_KEYS = ['maximalkraft', 'kraftausdauer', 'technik', 'balance', 'koordination', 'flexibilitaet'] as const;

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Erstes vorhandenes Feld (deutsche und englische Schlüssel werden akzeptiert). */
function pick(o: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

function toRadar(raw: unknown): CapturedRoute['radar'] {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = {} as CapturedRoute['radar'];
  for (const k of RADAR_KEYS) {
    const v = num(src[k]);
    out[k] = v === null ? 3 : Math.round(clamp(v, 1, 5));
  }
  return out;
}

/** Koordinate 0–1 (scale = 100, wenn die Antwort Prozentangaben enthält). */
function toCoord(v: unknown, scale: number): number | null {
  const n = num(v);
  if (n === null) return null;
  const scaled = n / scale;
  if (scaled < -0.05 || scaled > 1.05) return null;
  return clamp(scaled, 0, 1);
}

export function validateCaptureResult(raw: unknown, ctx: CaptureContext): CaptureResult {
  const warnings: string[] = [];
  const root = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const list = pick(root, 'routes', 'routen');
  if (!Array.isArray(list)) {
    return { routes: [], removedExistingIds: [], warnings: ['Antwort enthält keine Routenliste'] };
  }

  const existingIds = new Set((ctx.existing ?? []).map(e => e.id));
  const usedExisting = new Set<string>();
  const routes: CapturedRoute[] = [];

  // Antwortet das Modell in Prozent (0–100), gilt das für alle Routen
  const coords = list.flatMap(item => {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return [num(pick(o, 'start_x', 'x')), num(pick(o, 'start_y', 'y'))].filter((n): n is number => n !== null);
  });
  const scale = coords.some(c => c > 1.5) && coords.every(c => c <= 100.5) ? 100 : 1;

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const x = toCoord(pick(r, 'start_x', 'x'), scale);
    const y = toCoord(pick(r, 'start_y', 'y'), scale);
    if (x === null || y === null) {
      warnings.push('Route ohne gültige Position verworfen');
      continue;
    }

    const holdRaw = str(pick(r, 'hold_color', 'griff_farbe'));
    const tapeRaw = str(pick(r, 'tape_color', 'tape_farbe'));
    const symbolRaw = str(pick(r, 'grade_symbol', 'symbol', 'zeichen'));
    const explicitPending = 'grade_color_first' in r && r.grade_color === null;
    const gradeRaw = explicitPending
      ? null
      : ctx.gradeMarker === 'symbol'
      ? symbolRaw ?? str(pick(r, 'grade_color', 'grad_farbe'))
      : str(pick(r, 'grade_color', 'grad_farbe')) ?? (ctx.gradeMarker === 'tape' ? tapeRaw : holdRaw);
    // Zeichen-Hallen: ein gelesenes Zeichen entscheidet allein (unbekannt → «Grad folgt»);
    // nur ohne Zeichen zählt ein Farbname aus dem Farbsystem
    const palette = ctx.gradeMarker === 'symbol'
      ? (symbolRaw ? matchPaletteSymbol(symbolRaw, ctx.palette) : matchPaletteColor(str(pick(r, 'grade_color', 'grad_farbe')), ctx.palette))
      : matchPaletteColor(gradeRaw, ctx.palette);

    const confRaw = num(pick(r, 'confidence', 'sicherheit'));
    const confidence = confRaw === null ? 0.5 : clamp(confRaw > 1 ? confRaw / 100 : confRaw, 0, 1);

    let matchesExistingId: string | null = null;
    const ex = str(pick(r, 'existing_id', 'matches_existing_id'));
    if (ex && ctx.mode === 'partial' && existingIds.has(ex) && !usedExisting.has(ex)) {
      matchesExistingId = ex;
      usedExisting.add(ex);
    }

    const reviewReasons: string[] = [];
    if (!palette) reviewReasons.push('grade');
    if (confidence < REVIEW_CONFIDENCE) reviewReasons.push('unsure');

    const name = str(pick(r, 'name', 'name_suggestion'));
    routes.push({
      x,
      y,
      holdColor: toHoldColor(holdRaw),
      gradeColorRaw: gradeRaw,
      gradeScaleId: palette?.id ?? null,
      gradePending: !palette,
      confidence,
      radar: toRadar(pick(r, 'radar', 'merkmale')),
      tapeName: str(pick(r, 'tape_name', 'tape_text')),
      nameSuggestion: name,
      matchesExistingId,
      reviewReasons,
    });
  }

  // Doppelt erkannte Routen (gleiche Stelle, gleiche Farbe) zusammenfassen
  const deduped: CapturedRoute[] = [];
  for (const r of routes) {
    const dup = deduped.find(d =>
      Math.hypot(d.x - r.x, d.y - r.y) < DUPLICATE_DISTANCE &&
      d.gradeScaleId === r.gradeScaleId && d.holdColor === r.holdColor);
    if (dup) {
      warnings.push('Doppelte Route zusammengefasst');
      if (r.confidence > dup.confidence) Object.assign(dup, r);
      continue;
    }
    deduped.push(r);
  }

  if (deduped.length > MAX_ROUTES_PER_PHOTO) {
    warnings.push(`Mehr als ${MAX_ROUTES_PER_PHOTO} Routen – Rest verworfen`);
    deduped.sort((a, b) => b.confidence - a.confidence);
    deduped.length = MAX_ROUTES_PER_PHOTO;
  }

  const removedRaw = pick(root, 'removed_existing_ids', 'removed');
  const removedExistingIds = ctx.mode === 'partial' && Array.isArray(removedRaw)
    ? [...new Set(removedRaw.filter((id): id is string =>
        typeof id === 'string' && existingIds.has(id) && !usedExisting.has(id)))]
    : [];

  return { routes: deduped, removedExistingIds, warnings };
}
