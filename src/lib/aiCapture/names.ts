// SPEC-052 F4: Namen für erkannte Routen.
// Reihenfolge: lesbarer Tape-Name der Halle > Stil (Witzig = KI-Vorschlag, Schlicht = «<Farbe> <Nr>», Keine = leer).
// Höchstens 24 Zeichen, eindeutig unter den aktiven Namen der Halle.
import type { CapturedRoute, NameSource, RouteNameStyle } from './types';

export const MAX_NAME_LENGTH = 24;

export interface NamedRoute {
  name: string;
  nameSource: NameSource | null;
}

function cleanName(raw: string): string {
  const s = raw.replace(/["„“”«»]/g, '').replace(/\s+/g, ' ').trim();
  if (s.length <= MAX_NAME_LENGTH) return s;
  const cut = s.slice(0, MAX_NAME_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= 12 ? cut.slice(0, lastSpace) : cut).trim();
}

const key = (s: string) => s.trim().toLocaleLowerCase('de');

function makeUnique(base: string, taken: Set<string>): string {
  if (!taken.has(key(base))) return base;
  for (let i = 2; i < 100; i++) {
    const suffix = ` ${i}`;
    const candidate = base.slice(0, MAX_NAME_LENGTH - suffix.length).trimEnd() + suffix;
    if (!taken.has(key(candidate))) return candidate;
  }
  return base;
}

/**
 * Vergibt Namen in der Reihenfolge der Routen.
 * @param colorLabel liefert den Farbnamen für «Schlicht» (z. B. Farbsystem-Name)
 */
export function assignRouteNames(
  routes: Pick<CapturedRoute, 'tapeName' | 'nameSuggestion' | 'gradeScaleId'>[],
  style: RouteNameStyle,
  takenNames: string[] = [],
  colorLabel: (gradeScaleId: string | null) => string = () => 'Route',
): NamedRoute[] {
  const taken = new Set(takenNames.filter(Boolean).map(key));
  const plainCounter = new Map<string, number>();

  return routes.map(r => {
    let base = '';
    let source: NameSource | null = null;

    if (r.tapeName && cleanName(r.tapeName).length >= 2) {
      base = cleanName(r.tapeName);
      source = 'tape';
    } else if (style === 'fun' && r.nameSuggestion && cleanName(r.nameSuggestion).length >= 2) {
      base = cleanName(r.nameSuggestion);
      source = 'ai';
    } else if (style === 'plain' || style === 'fun') {
      const label = colorLabel(r.gradeScaleId);
      let n = (plainCounter.get(label) ?? 0) + 1;
      while (taken.has(key(`${label} ${n}`))) n++;
      plainCounter.set(label, n);
      base = cleanName(`${label} ${n}`);
      source = 'plain';
    }

    if (!base) return { name: '', nameSource: null };
    const name = makeUnique(base, taken);
    taken.add(key(name));
    return { name, nameSource: source };
  });
}
