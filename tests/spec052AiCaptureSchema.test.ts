import { describe, it, expect } from 'vitest';
import {
  CAPTURE_RESPONSE_SCHEMA,
  HOLD_COLORS,
  assignRouteNames,
  buildCapturePrompt,
  extractJson,
  matchPaletteColor,
  normalizeColorName,
  rawToUpright,
  readJpegOrientation,
  toHoldColor,
  validateCaptureResult,
  type CaptureContext,
} from '../src/lib/aiCapture';

const palette = [
  { id: 'g-gelb', colorName: 'Gelb', fontRangeMin: '3', fontRangeMax: '4' },
  { id: 'g-gruen', colorName: 'Grün', fontRangeMin: '5', fontRangeMax: '5+' },
  { id: 'g-blau', colorName: 'Blau', fontRangeMin: '6A', fontRangeMax: '6B+' },
  { id: 'g-rot', colorName: 'Rot', fontRangeMin: '6C', fontRangeMax: '7A+' },
  { id: 'g-weiss', colorName: 'Weiß', fontRangeMin: '8A', fontRangeMax: '8B' },
  { id: 'g-lila', colorName: 'Lila / Pink', fontRangeMin: '8B+', fontRangeMax: '8C+' },
];

const ctx = (over: Partial<CaptureContext> = {}): CaptureContext => ({
  gradeMarker: 'holds', palette, nameStyle: 'fun', mode: 'new', ...over,
});

describe('SPEC-052 Farben', () => {
  it('normalisiert Umlaute und Sonderzeichen', () => {
    expect(normalizeColorName('Weiß')).toBe('weiss');
    expect(normalizeColorName(' Grün (Leicht) ')).toBe('gruenleicht');
  });

  it('kennt Türkis und Hellgrün als Griff-Farben', () => {
    expect(HOLD_COLORS).toContain('Türkis');
    expect(HOLD_COLORS).toContain('Hellgrün');
    expect(toHoldColor('turquoise')).toBe('Türkis');
    expect(toHoldColor('lime')).toBe('Hellgrün');
    expect(toHoldColor('Lila / Pink')).toBe('Lila');
    expect(toHoldColor('kariert')).toBeNull();
    expect(toHoldColor(42)).toBeNull();
  });

  it('ordnet Grad-Farben dem Farbsystem der Halle zu (auch englisch)', () => {
    expect(matchPaletteColor('Blau', palette)?.id).toBe('g-blau');
    expect(matchPaletteColor('white', palette)?.id).toBe('g-weiss');
    expect(matchPaletteColor('purple', palette)?.id).toBe('g-lila');
    expect(matchPaletteColor('Orange', palette)).toBeNull();
    expect(matchPaletteColor(null, palette)).toBeNull();
  });
});

describe('SPEC-052 validateCaptureResult', () => {
  it('begrenzt Koordinaten, Merkmale und Sicherheit', () => {
    const res = validateCaptureResult({
      routes: [
        { start_x: 1.02, start_y: '0,45', hold_color: 'Blau', confidence: 95, radar: { maximalkraft: 9, technik: 0, balance: '4' } },
      ],
    }, ctx());
    const r = res.routes[0];
    expect(r.x).toBe(1);
    expect(r.y).toBeCloseTo(0.45);
    expect(r.confidence).toBeCloseTo(0.95);
    expect(r.radar).toEqual({ maximalkraft: 5, kraftausdauer: 3, technik: 1, balance: 4, koordination: 3, flexibilitaet: 3 });
    expect(r.gradeScaleId).toBe('g-blau');
    expect(r.gradePending).toBe(false);
  });

  it('erkennt Prozentangaben', () => {
    const res = validateCaptureResult({ routes: [{ start_x: 25, start_y: 80 }, { start_x: 0.5, start_y: 90 }] }, ctx());
    expect(res.routes.map(r => [r.x, r.y])).toEqual([[0.25, 0.8], [0.005, 0.9]]);
  });

  it('verwirft Routen ohne Position und meldet fehlende Liste', () => {
    expect(validateCaptureResult({ foo: 1 }, ctx()).warnings[0]).toMatch(/Routenliste/);
    const res = validateCaptureResult({ routes: [{ start_x: 'abc', start_y: 0.5 }, { start_x: -0.5, start_y: 0.5 }] }, ctx());
    expect(res.routes).toHaveLength(0);
  });

  it('nicht lesbarer Grad → «Grad folgt» und Kurz prüfen', () => {
    const res = validateCaptureResult({ routes: [{ start_x: 0.2, start_y: 0.8, hold_color: 'Orange', confidence: 0.9 }] }, ctx());
    expect(res.routes[0].gradePending).toBe(true);
    expect(res.routes[0].gradeScaleId).toBeNull();
    expect(res.routes[0].holdColor).toBe('Orange');
    expect(res.routes[0].reviewReasons).toContain('grade');
  });

  it('Tape-Halle: Grad kommt aus der Tape-Farbe, Griff-Farbe bleibt erhalten', () => {
    const res = validateCaptureResult({ routes: [{ start_x: 0.2, start_y: 0.8, hold_color: 'Rosa', tape_color: 'Rot', confidence: 0.8 }] }, ctx({ gradeMarker: 'tape' }));
    expect(res.routes[0].gradeScaleId).toBe('g-rot');
    expect(res.routes[0].holdColor).toBe('Rosa');
  });

  it('unsichere Routen gehen in Kurz prüfen', () => {
    const res = validateCaptureResult({ routes: [{ start_x: 0.2, start_y: 0.8, grade_color: 'Gelb', confidence: 0.4 }] }, ctx());
    expect(res.routes[0].reviewReasons).toEqual(['unsure']);
  });

  it('fasst doppelt erkannte Routen zusammen (höhere Sicherheit gewinnt)', () => {
    const res = validateCaptureResult({ routes: [
      { start_x: 0.5, start_y: 0.5, grade_color: 'Gelb', hold_color: 'Gelb', confidence: 0.6, name: 'A' },
      { start_x: 0.505, start_y: 0.5, grade_color: 'Gelb', hold_color: 'Gelb', confidence: 0.9, name: 'B' },
      { start_x: 0.505, start_y: 0.5, grade_color: 'Blau', hold_color: 'Blau', confidence: 0.9 },
    ] }, ctx());
    expect(res.routes).toHaveLength(2);
    expect(res.routes[0].nameSuggestion).toBe('B');
  });

  it('akzeptiert das deutsche Format des ersten Testlaufs (ergebnis.json)', () => {
    const res = validateCaptureResult({ routen: [{ start_x: 0.1, start_y: 0.9, griff_farbe: 'Grün', tape_farbe: 'Blau', sicherheit: 0.7, merkmale: { balance: 5 } }] }, ctx({ gradeMarker: 'tape' }));
    expect(res.routes[0].gradeScaleId).toBe('g-blau');
    expect(res.routes[0].radar.balance).toBe(5);
  });

  it('Teil-Umbau: nur bekannte Ids, jede höchstens einmal', () => {
    const existing = [{ id: 'old-1', x: 0.2, y: 0.8, gradeScaleId: 'g-gelb' }, { id: 'old-2', x: 0.6, y: 0.8, gradeScaleId: 'g-blau' }];
    const res = validateCaptureResult({
      routes: [
        { start_x: 0.2, start_y: 0.8, grade_color: 'Gelb', confidence: 0.9, existing_id: 'old-1' },
        { start_x: 0.3, start_y: 0.8, grade_color: 'Gelb', confidence: 0.9, existing_id: 'old-1' },
        { start_x: 0.4, start_y: 0.8, grade_color: 'Gelb', confidence: 0.9, existing_id: 'fremd' },
      ],
      removed_existing_ids: ['old-2', 'old-1', 'fremd'],
    }, ctx({ mode: 'partial', existing }));
    expect(res.routes.map(r => r.matchesExistingId)).toEqual(['old-1', null, null]);
    expect(res.removedExistingIds).toEqual(['old-2']);
  });

  it('ignoriert existing_id außerhalb des Teil-Umbaus', () => {
    const res = validateCaptureResult({ routes: [{ start_x: 0.2, start_y: 0.8, existing_id: 'old-1' }], removed_existing_ids: ['old-1'] },
      ctx({ mode: 'full', existing: [{ id: 'old-1', x: 0.2, y: 0.8, gradeScaleId: 'g-gelb' }] }));
    expect(res.routes[0].matchesExistingId).toBeNull();
    expect(res.removedExistingIds).toEqual([]);
  });
});

describe('SPEC-052 Namen', () => {
  it('Tape-Name hat Vorrang, dann KI-Vorschlag; max. 24 Zeichen, eindeutig', () => {
    const names = assignRouteNames([
      { tapeName: 'Dancing Queen', nameSuggestion: 'X', gradeScaleId: 'g-blau' },
      { tapeName: null, nameSuggestion: 'Ein wirklich sehr langer Routenname ohne Ende', gradeScaleId: 'g-blau' },
      { tapeName: null, nameSuggestion: 'Faultier', gradeScaleId: 'g-gelb' },
    ], 'fun', ['faultier']);
    expect(names[0]).toEqual({ name: 'Dancing Queen', nameSource: 'tape' });
    expect(names[1].name.length).toBeLessThanOrEqual(24);
    expect(names[1].nameSource).toBe('ai');
    expect(names[2].name).toBe('Faultier 2');
  });

  it('Schlicht = «<Farbe> <Nr>» und überspringt vergebene Nummern; Keine = leer', () => {
    const label = (id: string | null) => (id === 'g-blau' ? 'Blau' : 'Gelb');
    const plain = assignRouteNames([
      { tapeName: null, nameSuggestion: 'Egal', gradeScaleId: 'g-blau' },
      { tapeName: null, nameSuggestion: null, gradeScaleId: 'g-blau' },
    ], 'plain', ['Blau 1'], label);
    expect(plain.map(n => n.name)).toEqual(['Blau 2', 'Blau 3']);
    const none = assignRouteNames([{ tapeName: null, nameSuggestion: 'Egal', gradeScaleId: 'g-blau' }], 'none');
    expect(none[0]).toEqual({ name: '', nameSource: null });
  });
});

describe('SPEC-052 Prompt und JSON', () => {
  it('Prompt nennt Farbsystem, Tape-Regel und vergebene Namen', () => {
    const p = buildCapturePrompt(ctx({ gradeMarker: 'tape', takenNames: ['Faultier'], sectorName: 'Cave' }));
    expect(p).toContain('"Blau" (Fontainebleau 6A–6B+)');
    expect(p).toContain('START TAPE');
    expect(p).toContain('"Faultier"');
    expect(p).toContain('Cave');
  });

  it('Prompt für Teil-Umbau listet alte Routen mit Id', () => {
    const p = buildCapturePrompt(ctx({ mode: 'partial', nameStyle: 'none', existing: [{ id: 'old-1', x: 0.25, y: 0.8, gradeScaleId: 'g-gelb', colorName: 'Gelb', name: 'Alt' }] }));
    expect(p).toContain('id "old-1": Gelb, start at (0.25, 0.80), name "Alt"');
    expect(p).toContain('- name: null');
  });

  it('Schema verlangt Position, Farbe, Sicherheit und Merkmale', () => {
    expect(CAPTURE_RESPONSE_SCHEMA.properties.routes.items.required).toEqual(
      expect.arrayContaining(['start_x', 'start_y', 'grade_color', 'confidence', 'radar']));
  });

  it('extractJson liest reines JSON, Codeblock, Text und CLI-Hülle', () => {
    expect(extractJson('{"routes":[]}')).toEqual({ routes: [] });
    expect(extractJson('Hier:\n```json\n{"routes":[1]}\n```')).toEqual({ routes: [1] });
    expect(extractJson('Ergebnis {"routes":[2]} fertig')).toEqual({ routes: [2] });
    expect(extractJson(JSON.stringify({ response: '```json\n{"routes":[3]}\n```', stats: {} }))).toEqual({ routes: [3] });
    expect(extractJson(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"routes":[4]}' }] } }] }))).toEqual({ routes: [4] });
    expect(() => extractJson('keine Ahnung')).toThrow();
  });
});

describe('SPEC-052 EXIF', () => {
  function jpegWithOrientation(o: number, little = true): Uint8Array {
    const tiff = little
      ? [0x49, 0x49, 0x2a, 0x00, 0x08, 0, 0, 0, 0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0, 0, 0, o, 0, 0, 0, 0, 0, 0, 0]
      : [0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0, 0, 0, 1, 0, o, 0, 0, 0, 0, 0, 0];
    const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
    const len = app1.length + 2;
    return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 0xff, ...app1, 0xff, 0xda, 0, 2]);
  }

  it('liest die Orientierung (Intel und Motorola)', () => {
    expect(readJpegOrientation(jpegWithOrientation(6))).toBe(6);
    expect(readJpegOrientation(jpegWithOrientation(8, false))).toBe(8);
    expect(readJpegOrientation(new Uint8Array([0x89, 0x50]))).toBe(1);
  });

  it('rechnet Rohkoordinaten ins aufrechte Bild um', () => {
    expect(rawToUpright(0, 0, 6)).toEqual({ x: 1, y: 0 });
    expect(rawToUpright(1, 0, 6)).toEqual({ x: 1, y: 1 });
    expect(rawToUpright(0, 0, 8)).toEqual({ x: 0, y: 1 });
    expect(rawToUpright(0.2, 0.3, 3)).toEqual({ x: 0.8, y: 0.7 });
    expect(rawToUpright(0.2, 0.3, 1)).toEqual({ x: 0.2, y: 0.3 });
  });
});
