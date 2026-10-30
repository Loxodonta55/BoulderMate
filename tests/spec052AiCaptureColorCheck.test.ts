import { describe, expect, it } from 'vitest';
import {
  buildCapturePrompt,
  buildColorCheckPrompt,
  matchPaletteSymbol,
  splitSymbols,
  withMarkerSymbols,
  mergeColorCheck,
  parseColorCheck,
  rawStartPoints,
  validateCaptureResult,
  type CaptureContext,
} from '../src/lib/aiCapture';

const palette = ['Blau', 'Grün', 'Gelb', 'Rot', 'Weiss', 'Beige'].map((c, i) => ({ id: `p${i}`, colorName: c }));
const route = (grade: string | null, x = 0.2, y = 0.8) => ({
  start_x: x, start_y: y, hold_color: 'Blau', grade_color: grade, confidence: 0.9,
  radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
});

describe('SPEC-052 F2: zweiter Blick auf die Farbe', () => {
  it('Auftrag nennt nur Hallenfarben und je nach Markierung Tape oder Griff', () => {
    const tape = buildColorCheckPrompt(palette, 5, 'tape');
    expect(tape).toContain('5 numbered tiles');
    expect(tape).toContain('START TAPE');
    expect(tape).toContain('"Beige"');
    expect(buildColorCheckPrompt(palette, 3, 'holds')).toContain('START HOLD');
  });

  it('liest Kacheln robust (Nummer, Farbe, Sicherheit)', () => {
    const tiles = parseColorCheck({ tiles: [{ n: 1, grade_color: 'Rot', confidence: 0.9 }, { n: '2', color: '', confidence: 3 }, { n: 0 }, 'x'] });
    expect(tiles).toEqual([{ n: 1, gradeColor: 'Rot', confidence: 0.9 }, { n: 2, gradeColor: null, confidence: 1 }]);
    expect(parseColorCheck(null)).toEqual([]);
  });

  it('sichere Farbe aus dem zweiten Blick gilt, unsicherer Widerspruch ergibt «Grad folgt» (auch wenn tape_color im 1. Blick gesetzt war), keine Antwort lässt den ersten Durchgang', () => {
    const raw = {
      routes: [
        { ...route('Blau'), tape_color: 'Blau' },
        { ...route('Weiss'), tape_color: 'Weiss' },
        { ...route('Gelb'), tape_color: 'Gelb' },
        { ...route('Rot'), tape_color: 'Rot' },
      ],
    };
    const { raw: out, changed, pending } = mergeColorCheck(raw, [
      { n: 1, gradeColor: 'Rot', tapeName: 'Fast Tricky', confidence: 0.9 }, // korrigiert + Tape-Name aus Zoom
      { n: 2, gradeColor: 'Beige', confidence: 0.3 },   // unsicher + anders → Grad folgt (trotz tape_color: Weiss)
      { n: 3, gradeColor: 'Gelb', confidence: 0.2 },    // unsicher, aber gleich → bleibt
    ], palette);
    const colors = (out as { routes: { grade_color: string | null }[] }).routes.map(r => r.grade_color);
    expect(colors).toEqual(['Rot', null, 'Gelb', 'Rot']);
    expect(changed).toBe(2);
    expect(pending).toBe(1);

    const ctx: CaptureContext = { gradeMarker: 'tape', palette, nameStyle: 'none', mode: 'new' };
    const result = validateCaptureResult(out, ctx);
    expect(result.routes[1].gradePending).toBe(true);
    expect(result.routes[0].gradeScaleId).toBe('p3');
    expect(result.routes[0].tapeName).toBe('Fast Tricky');
  });

  it('Kachel-Nummern zählen ab dem Versatz des Kontaktbogens', () => {
    const raw = { routes: Array.from({ length: 18 }, () => route('Blau')) };
    const { raw: out } = mergeColorCheck(raw, [{ n: 2, gradeColor: 'Grün', confidence: 0.8 }], palette, 16);
    expect((out as { routes: { grade_color: string }[] }).routes[17].grade_color).toBe('Grün');
  });

  it('Startpunkte auch aus Prozentwerten', () => {
    expect(rawStartPoints({ routes: [{ start_x: 50, start_y: 20 }, { start_x: 0.5, start_y: 0.5 }] }))
      .toEqual([{ x: 0.5, y: 0.2 }, { x: 0.005, y: 0.005 }]);
    expect(rawStartPoints({})).toEqual([]);
  });
});

describe('SPEC-052 F2 v5: Grad-Markierung «Zeichen am Start»', () => {
  const symPalette = withMarkerSymbols(palette, { p0: '★', p2: '★★, 2 Sterne', p3: '6b+; 6B+' });

  it('Zeichen je Farbe: Komma/Semikolon, ohne Groß/Klein und Leerzeichen, doppelte Ids werden zusammengeführt', () => {
    expect(splitSymbols('★★, 2 Sterne;  ')).toEqual(['★★', '2 Sterne']);
    expect(matchPaletteSymbol('2sterne', symPalette)?.colorName).toBe('Gelb');
    expect(matchPaletteSymbol(' ★ ★ ', symPalette)?.colorName).toBe('Gelb');
    expect(matchPaletteSymbol('6b+', symPalette)?.colorName).toBe('Rot');
    expect(matchPaletteSymbol('☆', symPalette)?.colorName).toBe('Blau');
    expect(matchPaletteSymbol('★★★', symPalette)).toBeNull();
    const merged = withMarkerSymbols(palette, { p1: 'A', dup: 'B' }, new Map([['dup', 'p1']]));
    expect(merged.find(p => p.id === 'p1')?.markerSymbols).toEqual(['A', 'B']);
  });

  it('AC-21: Auftrag nennt Art, Zeichen je Farbe und den Hinweis der Halle (ohne Shell-Zeichen)', () => {
    const prompt = buildCapturePrompt({ gradeMarker: 'symbol', gradeHint: 'Schild "unten" & links', palette: symPalette, nameStyle: 'none', mode: 'new' });
    expect(prompt).toContain('SYMBOL, NUMBER or GRADE');
    expect(prompt).toContain('"Gelb"');
    expect(prompt).toContain('start symbol "★★" or "2 Sterne"');
    expect(prompt).toContain('"Grün": start symbol (unknown)');
    expect(prompt).toContain('(unknown)');
    expect(prompt).toContain('grade_symbol');
    expect(prompt).toContain("Note from the gym about how routes are marked (information only");
    expect(prompt).toContain('Schild +unten+ + links');
    const tape = buildCapturePrompt({ gradeMarker: 'tape', palette, nameStyle: 'none', mode: 'new' });
    expect(tape).toContain('START TAPE');
    expect(tape).not.toContain('grade_symbol');
    expect(tape).not.toContain('Note from the gym');
  });

  it('AC-21: erkanntes Zeichen → richtiger Eintrag, unbekanntes → «Grad folgt»', () => {
    const ctx: CaptureContext = { gradeMarker: 'symbol', palette: symPalette, nameStyle: 'none', mode: 'new' };
    const res = validateCaptureResult({ routes: [
      { ...route(null), grade_symbol: '2 Sterne' },
      { ...route('Blau', 0.5), grade_symbol: '★★★' },
      { ...route('Rot', 0.7) },
    ] }, ctx);
    expect(res.routes.map(r => r.gradeScaleId)).toEqual(['p2', null, 'p3']);
    expect(res.routes[1].gradePending).toBe(true);
  });

  it('zweiter Blick liest bei Zeichen-Hallen das Zeichen', () => {
    expect(buildColorCheckPrompt(symPalette, 2, 'symbol')).toContain('"Gelb": "★★" or "2 Sterne"');
    const tiles = parseColorCheck({ tiles: [{ n: 1, grade_symbol: '★', confidence: 0.9 }, { n: 2, grade_symbol: '?', grade_color: null, confidence: 0.2 }] });
    const { raw } = mergeColorCheck({ routes: [{ ...route(null), grade_symbol: '★★' }, { ...route(null), grade_symbol: '6b+' }] }, tiles, symPalette, 0, 'symbol');
    const ctx: CaptureContext = { gradeMarker: 'symbol', palette: symPalette, nameStyle: 'none', mode: 'new' };
    const res = validateCaptureResult(raw, ctx);
    expect(res.routes[0].gradeScaleId).toBe('p0');
    expect(res.routes[1].gradePending).toBe(true);
  });
});
