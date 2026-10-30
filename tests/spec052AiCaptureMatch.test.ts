import { describe, it, expect } from 'vitest';
import {
  buildCapturePlan,
  compareWithReference,
  isRadarRated,
  processCaptureResponse,
  summarizeReports,
  validateCaptureResult,
  type CaptureContext,
  type ExistingRoute,
} from '../src/lib/aiCapture';

const palette = [
  { id: 'g-gelb', colorName: 'Gelb' },
  { id: 'g-blau', colorName: 'Blau' },
  { id: 'g-rot', colorName: 'Rot' },
];
const existing: ExistingRoute[] = [
  { id: 'old-gelb', x: 0.2, y: 0.8, gradeScaleId: 'g-gelb', name: 'Alt Gelb' },
  { id: 'old-blau', x: 0.5, y: 0.8, gradeScaleId: 'g-blau', name: 'Alt Blau' },
  { id: 'old-rot', x: 0.8, y: 0.8, gradeScaleId: 'g-rot', name: 'Alt Rot' },
];
const ctx = (over: Partial<CaptureContext> = {}): CaptureContext => ({
  gradeMarker: 'holds', palette, nameStyle: 'plain', mode: 'new', ...over,
});
const route = (x: number, y: number, color: string | null, confidence = 0.9, extra: Record<string, unknown> = {}) =>
  ({ start_x: x, start_y: y, grade_color: color, hold_color: color, confidence, ...extra });

describe('SPEC-052 Plan: neu und Ganze Wand neu', () => {
  it('neu: alle Routen anlegen, nichts archivieren, Status direkt = aktiv', () => {
    const { plan } = processCaptureResponse({ routes: [route(0.1, 0.9, 'Gelb'), route(0.4, 0.9, null)] }, ctx());
    expect(plan.create).toHaveLength(2);
    expect(plan.create.every(c => c.status === 'active')).toBe(true);
    expect(plan.archive).toEqual([]);
    expect(plan.review).toEqual([{ reason: 'grade', index: 1 }]);
  });

  it('Ganze Wand neu: alle alten archivieren; «Erst prüfen» legt Entwürfe an', () => {
    const { plan } = processCaptureResponse({ routes: [route(0.1, 0.9, 'Gelb')] }, ctx({ mode: 'full', existing }), 'review');
    expect(plan.archive.sort()).toEqual(['old-blau', 'old-gelb', 'old-rot']);
    expect(plan.create[0].status).toBe('draft');
  });

  it('Namen im Plan: Schlicht ergibt «Gelb 1»', () => {
    const { plan } = processCaptureResponse({ routes: [route(0.1, 0.9, 'Gelb')] }, ctx());
    expect(plan.create[0].name).toBe('Gelb 1');
    expect(plan.create[0].nameSource).toBe('plain');
  });
});

describe('SPEC-052 Plan: Nur einzelne Routen neu', () => {
  const partial = ctx({ mode: 'partial', existing });

  it('zugeordnete bleiben, entfernte werden archiviert, neue angelegt', () => {
    const result = validateCaptureResult({
      routes: [route(0.21, 0.8, 'Gelb', 0.9, { existing_id: 'old-gelb' }), route(0.65, 0.5, 'Blau')],
      removed_existing_ids: ['old-blau', 'old-rot'],
    }, partial);
    const plan = buildCapturePlan({ result, names: [], mode: 'partial', existing, publishMode: 'direct' });
    expect(plan.keep).toEqual(['old-gelb']);
    expect(plan.archive.sort()).toEqual(['old-blau', 'old-rot']);
    expect(plan.create.map(c => c.index)).toEqual([1]);
  });

  it('gleiche Farbe an fast gleicher Stelle gilt als gleich geblieben, auch ohne Id', () => {
    const result = validateCaptureResult({ routes: [route(0.51, 0.81, 'Blau')], removed_existing_ids: ['old-gelb', 'old-rot'] }, partial);
    const plan = buildCapturePlan({ result, names: [], mode: 'partial', existing, publishMode: 'direct' });
    expect(plan.keep).toEqual(['old-blau']);
    expect(plan.create).toHaveLength(0);
  });

  it('unsichere Zuordnung: alte Route bleibt, neue wird nicht angelegt, Kurz prüfen', () => {
    const result = validateCaptureResult({ routes: [route(0.56, 0.82, 'Rot', 0.4)], removed_existing_ids: ['old-gelb', 'old-rot'] }, partial);
    const plan = buildCapturePlan({ result, names: [], mode: 'partial', existing, publishMode: 'direct' });
    expect(plan.create).toHaveLength(0);
    expect(plan.keep).toContain('old-blau');
    expect(plan.review).toContainEqual({ reason: 'uncertain_match', index: 0, existingId: 'old-blau' });
  });

  it('nicht gesehene alte Route ohne «entfernt» bleibt und kommt in Kurz prüfen', () => {
    const result = validateCaptureResult({ routes: [], removed_existing_ids: ['old-gelb', 'old-blau'] }, partial);
    const plan = buildCapturePlan({ result, names: [], mode: 'partial', existing, publishMode: 'direct' });
    expect(plan.archive.sort()).toEqual(['old-blau', 'old-gelb']);
    expect(plan.keep).toEqual(['old-rot']);
    expect(plan.review).toContainEqual({ reason: 'old_not_seen', existingId: 'old-rot' });
  });

  it('zugeordnete Route mit geringer Sicherheit bleibt, aber Kurz prüfen', () => {
    const result = validateCaptureResult({ routes: [route(0.2, 0.8, 'Gelb', 0.3, { existing_id: 'old-gelb' })], removed_existing_ids: ['old-blau', 'old-rot'] }, partial);
    const plan = buildCapturePlan({ result, names: [], mode: 'partial', existing, publishMode: 'direct' });
    expect(plan.keep).toEqual(['old-gelb']);
    expect(plan.review[0].reason).toBe('uncertain_match');
  });
});

describe('SPEC-052 Vergleich mit Hans\' Routen', () => {
  const ref = [
    { id: 'r1', x: 0.2, y: 0.8, gradeScaleId: 'g-gelb', radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 } },
    { id: 'r2', x: 0.5, y: 0.8, gradeScaleId: 'g-blau', radar: { maximalkraft: 4, kraftausdauer: 2, technik: 3, balance: 3, koordination: 5, flexibilitaet: 3 } },
    { id: 'r3', x: 0.8, y: 0.8, gradeScaleId: 'g-rot' },
  ];

  it('nicht bewertete Merkmale (alles 3 oder leer) zählen nicht', () => {
    expect(isRadarRated(ref[0].radar)).toBe(false);
    expect(isRadarRated(undefined)).toBe(false);
    expect(isRadarRated(ref[1].radar)).toBe(true);
  });

  it('zählt gefundene, zusätzliche Routen, Farbtreffer und Merkmal-Abweichung', () => {
    const ai = [
      { x: 0.21, y: 0.79, gradeScaleId: 'g-gelb', radar: { maximalkraft: 1, kraftausdauer: 1, technik: 1, balance: 1, koordination: 1, flexibilitaet: 1 } },
      { x: 0.52, y: 0.8, gradeScaleId: 'g-rot', radar: { maximalkraft: 4, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 } },
      { x: 0.1, y: 0.1, gradeScaleId: 'g-gelb' },
    ];
    const rep = compareWithReference(ai, ref);
    expect(rep.matched).toBe(2);
    expect(rep.foundRate).toBeCloseTo(2 / 3);
    expect(rep.extraRate).toBeCloseTo(1 / 3);
    expect(rep.gradeRate).toBeCloseTo(0.5);
    expect(rep.missedRefIndexes).toEqual([2]);
    expect(rep.extraAiIndexes).toEqual([2]);
    // nur r2 ist bewertet: Abweichungen 0,1,0,0,2,0 → 0,5
    expect(rep.radarRated).toBe(1);
    expect(rep.radarMae).toBeCloseTo(0.5);
    expect(rep.radarWithin1).toBeCloseTo(5 / 6);
  });

  it('bevorzugt bei zwei nahen Kandidaten die gleiche Farbe', () => {
    const rep = compareWithReference(
      [{ x: 0.5, y: 0.8, gradeScaleId: 'g-gelb' }, { x: 0.52, y: 0.8, gradeScaleId: 'g-blau' }],
      [{ id: 'r', x: 0.5, y: 0.8, gradeScaleId: 'g-blau' }],
    );
    expect(rep.pairs[0].aiIndex).toBe(1);
    expect(rep.gradeRate).toBe(1);
  });

  it('«Grad folgt» zählt nicht als falsche Farbe', () => {
    const rep = compareWithReference([{ x: 0.2, y: 0.8, gradeScaleId: null }], [ref[0]]);
    expect(rep.gradePending).toBe(1);
    expect(rep.gradeRate).toBe(0);
  });

  it('Qualitäts-Tor über mehrere Sektoren', () => {
    const good = compareWithReference(ref.map(r => ({ x: r.x, y: r.y, gradeScaleId: r.gradeScaleId })), ref);
    expect(summarizeReports([good, good]).passed).toBe(true);
    const bad = compareWithReference([], ref);
    expect(summarizeReports([good, bad]).passed).toBe(false);
  });
});
