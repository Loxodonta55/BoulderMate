// SPEC-052: Farben für die KI-Routenerfassung.
// Griff-Farben (hold_color) sind eine feste Liste; die Grad-Farbe wird auf das
// Farbsystem der Halle (grade_scales) abgebildet.

export const HOLD_COLORS = [
  'Gelb',
  'Orange',
  'Rot',
  'Rosa',
  'Lila',
  'Blau',
  'Türkis',
  'Grün',
  'Hellgrün',
  'Weiß',
  'Grau',
  'Schwarz',
  'Braun',
] as const;

export type HoldColor = typeof HOLD_COLORS[number];

/** Kleinbuchstaben, Umlaute ausgeschrieben, nur a–z. */
export function normalizeColorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');
}

// Synonyme (auch Englisch, weil Modelle gern englisch antworten) → Griff-Farbe
const SYNONYMS: Record<string, HoldColor> = {
  gelb: 'Gelb', yellow: 'Gelb',
  orange: 'Orange',
  rot: 'Rot', red: 'Rot',
  rosa: 'Rosa', pink: 'Rosa', magenta: 'Rosa',
  lila: 'Lila', violett: 'Lila', violet: 'Lila', purple: 'Lila', purpur: 'Lila',
  blau: 'Blau', blue: 'Blau', dunkelblau: 'Blau', navy: 'Blau',
  tuerkis: 'Türkis', turquoise: 'Türkis', cyan: 'Türkis', petrol: 'Türkis', hellblau: 'Türkis', lightblue: 'Türkis', mint: 'Türkis',
  gruen: 'Grün', green: 'Grün', dunkelgruen: 'Grün',
  hellgruen: 'Hellgrün', lime: 'Hellgrün', limette: 'Hellgrün', neongruen: 'Hellgrün', lightgreen: 'Hellgrün',
  weiss: 'Weiß', white: 'Weiß',
  grau: 'Grau', grey: 'Grau', gray: 'Grau', silber: 'Grau', silver: 'Grau',
  schwarz: 'Schwarz', black: 'Schwarz',
  braun: 'Braun', brown: 'Braun', holz: 'Braun', wood: 'Braun', beige: 'Braun',
};

/** Freitext-Farbe → Griff-Farbe aus HOLD_COLORS oder null. */
export function toHoldColor(raw: unknown): HoldColor | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = normalizeColorName(raw);
  if (SYNONYMS[n]) return SYNONYMS[n];
  // «Lila / Pink», «Blau (Mittel)» o. ä.: erstes bekanntes Wort
  const words = raw.split(/[^A-Za-zÄÖÜäöüß]+/).map(normalizeColorName).filter(Boolean);
  for (const w of words) if (SYNONYMS[w]) return SYNONYMS[w];
  return null;
}

export interface PaletteEntry {
  id: string;
  colorName: string;
  colorHex?: string;
  fontRangeMin?: string;
  fontRangeMax?: string;
  /** Zeichen am Start, die diesen Grad bedeuten (Halle mit Art «symbol») */
  markerSymbols?: string[];
}

/**
 * Grad-Farbe der KI → Eintrag im Farbsystem der Halle.
 * Erst exakter Name, dann über die Griff-Farb-Synonyme. Kein Treffer → null («Grad folgt»).
 */
export function matchPaletteColor<T extends PaletteEntry>(raw: unknown, palette: T[]): T | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = normalizeColorName(raw);
  const exact = palette.find(p => normalizeColorName(p.colorName) === n);
  if (exact) return exact;
  const hold = toHoldColor(raw);
  if (!hold) return null;
  const candidates = palette.filter(p => toHoldColor(p.colorName) === hold);
  return candidates.length === 1 ? candidates[0] : null;
}

/** Zeichen vergleichbar machen: ohne Groß/Klein, Leerzeichen und typografische Varianten. */
export function normalizeSymbol(raw: string): string {
  return raw.normalize('NFKC').toLowerCase().replace(/[\s"'«»„“”]/g, '').replace(/[☆✩✪✫✬✭✮✯✰*]/g, '★');
}

/** «★★, 2 Sterne» → ["★★", "2 Sterne"] */
export function splitSymbols(raw: string | undefined | null): string[] {
  return (raw ?? '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}

/**
 * Zeichen-Zuordnung der Halle (`gyms.grade_symbols`) in die Palette übernehmen.
 * `canonical` bildet doppelte Farb-Ids auf die Id in der Palette ab (gleiche Farbe, mehrere Einträge).
 */
export function withMarkerSymbols<T extends PaletteEntry>(
  palette: T[], symbols: Record<string, string> | null | undefined, canonical?: Map<string, string>,
): (T & { markerSymbols: string[] })[] {
  if (!symbols || typeof symbols !== 'object') return palette.map(p => ({ ...p, markerSymbols: [] }));
  const byId = new Map<string, string[]>();
  for (const [id, raw] of Object.entries(symbols)) {
    const target = canonical?.get(id) ?? id;
    byId.set(target, [...(byId.get(target) ?? []), ...splitSymbols(raw)]);
  }
  return palette.map(p => ({ ...p, markerSymbols: [...new Set(byId.get(p.id) ?? [])] }));
}

/** Gelesenes Zeichen → Eintrag im Farbsystem. Nur eindeutige Treffer, sonst null («Grad folgt»). */
export function matchPaletteSymbol<T extends PaletteEntry>(raw: unknown, palette: T[]): T | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = normalizeSymbol(raw);
  const hits = palette.filter(p => (p.markerSymbols ?? []).some(s => normalizeSymbol(s) === n));
  return hits.length === 1 ? hits[0] : null;
}
