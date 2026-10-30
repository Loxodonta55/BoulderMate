// SPEC-052 F2 · Zweiter Blick auf die Farbe: Nach dem ersten Durchgang (Routen finden) bekommt
// das Modell vergrößerte Ausschnitte um jeden Start (nummerierte Kacheln) und liest nur noch
// die Grad-Markierung (Griff-Farbe, Zettel-Farbe oder Zeichen, je nach Halle). Blindtests zeigten: Routen findet Gemini ordentlich, die
// Tape-Farbe auf dem Gesamtbild verwechselt es oft (v. a. Rot ↔ Blau/Weiss/Grün).
import { HOLD_COLORS, matchPaletteColor, matchPaletteSymbol, type PaletteEntry } from './colors';
import type { GradeMarker } from './types';

/** Kacheln pro Kontaktbogen (4 × 4) */
export const COLOR_CHECK_TILES = 16;
/** Ab dieser Sicherheit gilt die Farbe aus dem zweiten Blick */
export const COLOR_CHECK_MIN_CONFIDENCE = 0.5;

export function buildColorCheckPrompt(palette: PaletteEntry[], tileCount: number, marker: GradeMarker): string {
  const names = palette.map(p => `"${p.colorName}"`).join(', ');
  const intro = `This image is a contact sheet of ${tileCount} numbered tiles. Each tile is an enlarged crop of an indoor bouldering wall, centred on the start of one route. The dashed cyan ring marks the start; if several markings are visible, use the one inside or closest to the ring.`;
  if (marker === 'symbol') {
    const list = palette.map(p => `- "${p.colorName}": ${p.markerSymbols?.length ? p.markerSymbols.map(m => `"${m.replace(/["&|<>^%]/g, '+')}"`).join(' or ') : '(no symbol)'}`).join('\n');
    return [
      intro,
      'For every tile, read the SYMBOL, NUMBER or GRADE written or stuck at the start (stars, dots, digits, letters or a grade on a tag). Ignore the colour of the holds.',
      'Known symbols of this gym and the grade name they mean:',
      list,
      'Give "grade_symbol" exactly as listed and "grade_color" as the matching name. If you cannot read it clearly, or it is not in the list, answer null for both.',
      'Also give a confidence 0..1.',
      '',
      'Answer with JSON only:',
      '{"tiles":[{"n":1,"grade_symbol":"★★","grade_color":"Gelb","confidence":0.9}]}',
    ].join('\n');
  }
  const what = marker === 'tape'
    ? 'the colour of the START TAPE (the strip of tape stuck on or right next to the start hold, often with handwriting). Ignore the colour of the holds themselves.'
    : 'the colour of the START HOLD in the middle of the tile.';
  return [
    intro,
    `For every tile, read ${what}`,
    `Answer with one of the gym colour names: ${names}. If you cannot see it clearly, or it could be either of two colours, answer null.`,
    'Typical confusions to avoid: red vs. pink/orange, white vs. beige/grey, blue vs. turquoise. Look at the tape itself, not shadows or the wall colour.',
    `Also give "tape_color" from: ${HOLD_COLORS.map(c => `"${c}"`).join(', ')} (or null) and a confidence 0..1.`,
    ...(marker === 'tape' ? ['If a route name is handwritten on the start tape and clearly legible in this zoomed crop, include it as "tape_name" (else null). Do not guess letters.'] : []),
    '',
    'Answer with JSON only:',
    marker === 'tape'
      ? '{"tiles":[{"n":1,"grade_color":"Rot","tape_color":"Rot","tape_name":null,"confidence":0.9}]}'
      : '{"tiles":[{"n":1,"grade_color":"Rot","tape_color":"Rot","confidence":0.9}]}',
  ].join('\n');
}

export interface ColorCheckTile { n: number; gradeColor: string | null; gradeSymbol?: string | null; tapeName?: string | null; confidence: number }

/** Liest die Antwort des zweiten Blicks (Kachel-Nummern ab 1). */
export function parseColorCheck(raw: unknown): ColorCheckTile[] {
  const list = (raw && typeof raw === 'object' ? (raw as { tiles?: unknown }).tiles : null);
  if (!Array.isArray(list)) return [];
  return list.flatMap(t => {
    if (!t || typeof t !== 'object') return [];
    const o = t as Record<string, unknown>;
    const n = Number(o.n ?? o.tile ?? o.index);
    if (!Number.isInteger(n) || n < 1) return [];
    const c = o.grade_color ?? o.gradeColor ?? o.color;
    const sym = o.grade_symbol ?? o.symbol;
    const tn = o.tape_name ?? o.tapeName ?? o.tape_text;
    const conf = Number(o.confidence);
    const tile: ColorCheckTile = { n, gradeColor: typeof c === 'string' && c.trim() ? c.trim() : null, confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0.5 };
    if (typeof sym === 'string' && sym.trim()) tile.gradeSymbol = sym.trim();
    if (typeof tn === 'string' && tn.trim()) tile.tapeName = tn.trim();
    return [tile];
  });
}

/**
 * Führt den zweiten Blick in die Rohantwort des ersten Durchgangs zusammen.
 * - Sicherer zweiter Blick mit gültiger Farbe → diese Farbe gilt.
 * - Unsicher oder ohne Farbe: gleiche Farbe wie im ersten Durchgang → bleibt; sonst «Grad folgt» (null). Nie raten.
 * - Keine Antwort für die Kachel → erster Durchgang bleibt.
 * `offset` = Index der ersten Route dieses Kontaktbogens.
 */
export function mergeColorCheck(raw: unknown, tiles: ColorCheckTile[], palette: PaletteEntry[], offset = 0, marker: GradeMarker = 'tape'): { raw: unknown; changed: number; pending: number } {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { routes?: unknown }).routes)) return { raw, changed: 0, pending: 0 };
  const routes = [...(raw as { routes: Record<string, unknown>[] }).routes];
  let changed = 0;
  let pending = 0;
  for (const t of tiles) {
    const i = offset + t.n - 1;
    const r = routes[i];
    if (!r) continue;
    const symbolGym = marker === 'symbol';
    // Zeichen-Hallen: Zeichen zuerst, Farbname nur als Ersatz
    const firstSymbol = r.grade_symbol ?? r.symbol;
    const first = symbolGym && typeof firstSymbol === 'string' && firstSymbol.trim()
      ? matchPaletteSymbol(firstSymbol, palette)
      : matchPaletteColor(String(r.grade_color ?? r.gradeColor ?? ''), palette);
    const second = symbolGym && t.gradeSymbol
      ? matchPaletteSymbol(t.gradeSymbol, palette)
      : (t.gradeColor ? matchPaletteColor(t.gradeColor, palette) : null);
    let next: string | null;
    if (second && t.confidence >= COLOR_CHECK_MIN_CONFIDENCE) next = second.colorName;
    else if (second && first && second.id === first.id) next = first.colorName;
    else next = null;
    if ((first?.colorName ?? null) !== next) {
      changed++;
      if (next === null) pending++;
    }
    const entry = next ? palette.find(p => p.colorName === next) : null;
    const existingTapeName = typeof r.tape_name === 'string' && r.tape_name.trim() ? r.tape_name : (typeof r.tape_text === 'string' && r.tape_text.trim() ? r.tape_text : null);
    routes[i] = {
      ...r, grade_color: next, grade_color_first: r.grade_color ?? null,
      ...(marker === 'tape' && next === null ? { tape_color: null, tape_farbe: null } : {}),
      ...(t.tapeName && !existingTapeName ? { tape_name: t.tapeName } : {}),
      ...(symbolGym ? { grade_symbol: entry?.markerSymbols?.[0] ?? null } : {}),
    };
  }
  return { raw: { ...(raw as object), routes }, changed, pending };
}

/** Startpunkte (0..1) der Rohantwort, in Reihenfolge der Routen. */
export function rawStartPoints(raw: unknown): { x: number; y: number }[] {
  const list = raw && typeof raw === 'object' ? (raw as { routes?: Record<string, unknown>[] }).routes : null;
  if (!Array.isArray(list)) return [];
  const pts = list.map(r => ({ x: Number(r.start_x ?? r.x), y: Number(r.start_y ?? r.y) }));
  // Prozentwerte wie in validateCaptureResult: pro Antwort entscheiden
  const percent = pts.some(p => p.x > 1.5 || p.y > 1.5);
  return pts.map(p => ({
    x: Number.isFinite(p.x) ? (percent ? p.x / 100 : p.x) : -1,
    y: Number.isFinite(p.y) ? (percent ? p.y / 100 : p.y) : -1,
  }));
}
