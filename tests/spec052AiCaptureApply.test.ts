import { describe, it, expect, beforeEach } from 'vitest';
import { applyPlan } from '../scripts/ai-capture/worker';
import { processCaptureResponse, type CaptureContext } from '../src/lib/aiCapture';
import { aiFieldsFromRow, aiFieldsToRow, isRadarEstimated } from '../src/lib/aiCapture/boulderFields';
import {
  REVIEW_DAYS,
  canUndoCapture,
  captureStatusText,
  getGymAiSettings,
  getReviewItems,
  getSectorCaptureStatus,
  isRadarStillEstimated,
  rememberCaptureJob,
  reportRouteIssue,
  getOpenIssues,
  hasReportedIssue,
  resolveReview,
  setGymAiSettings,
  submitCapture,
  undoCapture,
  countAscentsForJob,
  type CaptureJob,
} from '../src/lib/aiCapture/aiCaptureService';
import { getWallBoulders, updateBoulderDetails } from '../src/lib/batchBoulderService';
import { STORAGE_KEY_ASCENTS, STORAGE_KEY_RATINGS } from '../src/lib/ratingAndAscentService';
import * as gymStorage from '../src/lib/gymStorage';
import { clearMemoryStore } from '../src/lib/storageUtils';
import type { WallBoulder } from '../src/types/boulder';

// --- Supabase-Attrappe: zeichnet alle Schreibzugriffe auf ---------------------------
type Call = { table: string; op: string; payload?: unknown; filters: string[] };
function fakeSupabase() {
  const calls: Call[] = [];
  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] };
    calls.push(call);
    const b: any = {
      insert: (p: unknown) => { call.op = 'insert'; call.payload = p; return b; },
      update: (p: unknown) => { call.op = 'update'; call.payload = p; return b; },
      select: () => b,
      eq: (c: string, v: unknown) => { call.filters.push(`${c}=${v}`); return b; },
      in: (c: string, v: unknown[]) => { call.filters.push(`${c} in ${v.join(',')}`); return b; },
      is: (c: string, v: unknown) => { call.filters.push(`${c} is ${v}`); return b; },
      then: (res: (v: { error: null; data: null }) => unknown) => Promise.resolve(res({ error: null, data: null })),
    };
    return b;
  };
  return { client: { from } as any, calls };
}

const palette = [{ id: 'g-gelb', colorName: 'Gelb' }, { id: 'g-blau', colorName: 'Blau' }];
const baseCtx = (over: Partial<CaptureContext> = {}): CaptureContext => ({ gradeMarker: 'tape', palette, nameStyle: 'fun', mode: 'full', ...over });
const job = (mode: CaptureContext['mode']) => ({ id: 'job-1', gym_id: 'gym', sector_id: 'sec', mode, photo_url: 'https://x/neu.jpg', status: 'running', created_by: 'setter-uuid' });

describe('SPEC-052 Worker: Ergebnis anwenden', () => {
  it('Ganze Wand neu, direkt: Routen anlegen, alte archivieren, Foto live, Auftrag fertig', async () => {
    const ctx = baseCtx({ existing: [{ id: 'old-1', x: 0.5, y: 0.5, gradeScaleId: 'g-gelb' }] });
    const { plan, result } = processCaptureResponse({ routes: [
      { start_x: 0.2, start_y: 0.8, hold_color: 'Türkis', tape_color: 'Blau', confidence: 0.9, name: 'Faultier', radar: { balance: 5 } },
      { start_x: 0.6, start_y: 0.8, hold_color: 'Rosa', tape_color: null, confidence: 0.5 },
    ] }, ctx, 'direct');
    const { client, calls } = fakeSupabase();
    const summary = await applyPlan(client, {
      job: job('full') as any, ctx, publishMode: 'direct', orientation: 1, previousPhotoUrl: 'https://x/alt.jpg', sectorName: 'Cave', fallbackScaleId: 'g-gelb',
    }, plan, result.warnings);

    const insert = calls.find(c => c.table === 'boulders' && c.op === 'insert')!;
    const rows = insert.payload as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ grade_scale_id: 'g-blau', hold_color: 'Türkis', name: 'Faultier', name_source: 'ai', capture_source: 'ai', radar_source: 'ai', radar_balance: 5, setter_id: 'setter-uuid', status: 'active', ai_run_id: 'job-1', grade_pending: false });
    // «Grad folgt»: vorläufige Farbe in der Pflichtspalte, aber grade_pending + Kurz prüfen
    expect(rows[1]).toMatchObject({ grade_scale_id: 'g-gelb', grade_pending: true, ai_review: ['grade', 'unsure'] });

    const archive = calls.find(c => c.table === 'boulders' && c.op === 'update')!;
    expect(archive.payload).toMatchObject({ status: 'archived', wall_photo_url: 'https://x/alt.jpg' });
    expect(archive.filters).toEqual(['id in old-1']);

    const sector = calls.find(c => c.table === 'sectors')!;
    expect(sector.payload).toMatchObject({ wall_photo_url: 'https://x/neu.jpg', rebuild_started_at: null });

    const done = calls.find(c => c.table === 'ai_capture_jobs')!;
    expect(done.payload).toMatchObject({ status: 'done', archived_boulder_ids: ['old-1'], previous_photo_url: 'https://x/alt.jpg' });
    expect(summary).toMatchObject({ created: 2, archived: 1, gradePending: 1 });
  });

  it('Erst prüfen, Ganze Wand: Entwürfe + Entwurfsfoto, nichts archiviert', async () => {
    const ctx = baseCtx({ existing: [{ id: 'old-1', x: 0.5, y: 0.5, gradeScaleId: 'g-gelb' }] });
    const { plan } = processCaptureResponse({ routes: [{ start_x: 0.2, start_y: 0.8, tape_color: 'Blau', confidence: 0.9 }] }, ctx, 'review');
    const { client, calls } = fakeSupabase();
    await applyPlan(client, { job: job('full') as any, ctx, publishMode: 'review', orientation: 1, previousPhotoUrl: 'a', sectorName: 'Cave', fallbackScaleId: 'g-gelb' }, plan, []);
    expect((calls.find(c => c.op === 'insert')!.payload as any[])[0]).toMatchObject({ status: 'draft', published_at: null });
    expect(calls.some(c => c.table === 'boulders' && c.op === 'update')).toBe(false);
    expect(calls.find(c => c.table === 'sectors')!.payload).toMatchObject({ draft_photo_url: 'https://x/neu.jpg' });
  });

  it('Teil-Umbau: alte Route nicht gesehen → bleibt, bekommt datierten Prüf-Hinweis', async () => {
    const ctx = baseCtx({ mode: 'partial', existing: [{ id: 'old-1', x: 0.5, y: 0.5, gradeScaleId: 'g-gelb' }] });
    const { plan } = processCaptureResponse({ routes: [] }, ctx, 'direct');
    const { client, calls } = fakeSupabase();
    await applyPlan(client, { job: job('partial') as any, ctx, publishMode: 'direct', orientation: 1, previousPhotoUrl: 'a', sectorName: 'Cave', fallbackScaleId: 'g-gelb' }, plan, []);
    const flag = calls.find(c => c.table === 'boulders' && c.op === 'update')!;
    expect((flag.payload as any).ai_review[0]).toMatch(/^old_not_seen:\d{4}-\d{2}-\d{2}$/);
    // Teil-Umbau setzt nur das Foto, kein «Wand fertig»
    expect(calls.find(c => c.table === 'sectors')!.payload).toEqual({ wall_photo_url: 'https://x/neu.jpg' });
  });
});

describe('SPEC-052 KI-Felder im Sync', () => {
  it('manuelle Routen schicken keine KI-Spalten (Sync läuft auch ohne Migration)', () => {
    expect(aiFieldsToRow({ captureSource: 'manual' })).toEqual({});
    expect(aiFieldsFromRow({ id: 'x', capture_source: 'manual', grade_pending: false })).toEqual({});
  });

  it('KI-Route hin und zurück', () => {
    const row = aiFieldsToRow({ captureSource: 'ai', holdColor: 'Rosa', gradePending: true, radarSource: 'ai', aiReview: ['grade'], aiConfidence: 0.7 });
    expect(row).toMatchObject({ capture_source: 'ai', hold_color: 'Rosa', grade_pending: true, ai_review: ['grade'] });
    const back = aiFieldsFromRow(row);
    expect(back).toMatchObject({ captureSource: 'ai', holdColor: 'Rosa', gradePending: true, aiReview: ['grade'] });
    expect(isRadarEstimated(back)).toBe(true);
  });

  it('erledigter Prüf-Hinweis an alter Route wird als leer gesendet', () => {
    expect(aiFieldsToRow({ captureSource: 'manual', aiReview: [] })).toMatchObject({ ai_review: null, capture_source: 'manual' });
  });
});

// --- App-Service ---------------------------------------------------------------------
const SECTOR = 'sec_6a_cave';
function seedBoulder(over: Partial<WallBoulder>): WallBoulder {
  const b: WallBoulder = {
    id: over.id ?? `b-${Math.random()}`, sectorId: SECTOR, gradeScaleId: 'g-gelb', positionX: 0.3, positionY: 0.7,
    name: 'KI-Route', setterId: 's', status: 'active',
    radar: { maximalkraft: 3, kraftausdauer: 3, technik: 3, balance: 3, koordination: 3, flexibilitaet: 3 },
    createdAt: new Date().toISOString(), ...over,
  };
  const list = JSON.parse(localStorage.getItem('boulderapp_wall_boulders_v2') || '[]');
  list.push(b);
  localStorage.setItem('boulderapp_wall_boulders_v2', JSON.stringify(list));
  return b;
}

describe('SPEC-052 App-Service', () => {
  beforeEach(() => {
    localStorage.clear();
    clearMemoryStore();
    localStorage.setItem('bouldermate_synced_from_supabase', 'true');
    gymStorage.ensureInitialGymData();
  });

  it('Hallen-Einstellungen: Standard aus, nur Admins dürfen ändern', () => {
    const gymId = gymStorage.getGyms()[0].id;
    expect(getGymAiSettings(gymId)).toEqual({ enabled: false, gradeMarker: 'holds', gradeSymbols: {}, gradeHint: '', nameStyle: 'fun', publishMode: 'direct' });
    expect(setGymAiSettings(gymId, 'niemand-123', { enabled: true })).toBe(false);
    expect(setGymAiSettings(gymId, 'user-boris', { enabled: true, gradeMarker: 'tape' })).toBe(true);
    expect(getGymAiSettings(gymId)).toMatchObject({ enabled: true, gradeMarker: 'tape' });
  });

  it('v5: Zeichen je Farbe und Hinweis werden gekürzt, leere Zeichen entfernt', () => {
    const gymId = gymStorage.getGyms()[0].id;
    setGymAiSettings(gymId, 'user-boris', { gradeMarker: 'symbol', gradeSymbols: { a: '  ★★ ', b: '   ', c: 'x'.repeat(60) }, gradeHint: 'y'.repeat(400) });
    const st = getGymAiSettings(gymId);
    expect(st.gradeMarker).toBe('symbol');
    expect(st.gradeSymbols).toEqual({ a: '★★', c: 'x'.repeat(40) });
    expect(st.gradeHint).toHaveLength(300);
  });

  it('ohne Netz: Foto wartet in der Warteschlange («Wartet auf Netz …»)', async () => {
    const status = await submitCapture({ gymId: 'gym-6a-plus', sectorId: SECTOR, mode: 'full', dataUrl: 'data:image/jpeg;base64,AAAA', userId: 'u1' });
    expect(status.kind).toBe('waiting_network');
    expect(captureStatusText(getSectorCaptureStatus(SECTOR)!)).toBe('Wartet auf Netz …');
  });

  it('Statustexte und 24-Stunden-Fenster fürs Zurücknehmen', () => {
    const now = new Date('2026-10-27T12:00:00Z');
    const j: CaptureJob = { id: 'j1', gymId: 'g', sectorId: SECTOR, mode: 'full', status: 'queued', createdAt: '2026-10-27T11:00:00Z' };
    expect(captureStatusText({ kind: 'job', job: j })).toBe('In Warteschlange – Routen erscheinen später');
    expect(captureStatusText({ kind: 'job', job: { ...j, status: 'running' } })).toBe('KI erkennt Routen …');
    const done = { ...j, status: 'done' as const, finishedAt: '2026-10-27T11:30:00Z', result: { created: 12, review: 2, publishMode: 'direct' as const } };
    expect(captureStatusText({ kind: 'job', job: done })).toBe('12 Routen erkannt · 2 kurz prüfen');
    expect(captureStatusText({ kind: 'job', job: { ...j, status: 'failed' } })).toMatch(/fehlgeschlagen/);
    expect(canUndoCapture(done, now)).toBe(true);
    expect(canUndoCapture(done, new Date('2026-10-28T12:00:00Z'))).toBe(false);
    expect(canUndoCapture({ ...done, result: { ...done.result, publishMode: 'review' } }, now)).toBe(false);
    rememberCaptureJob(done);
    expect(getSectorCaptureStatus(SECTOR, now)).toMatchObject({ kind: 'job' });
    expect(getSectorCaptureStatus(SECTOR, new Date('2026-10-29T12:00:00Z'))).toBeNull();
  });

  it('Zurücknehmen: neue Routen weg, alte wieder aktiv; Tops werden vorher gezählt', async () => {
    const neu = seedBoulder({ id: 'neu-1', captureSource: 'ai', aiRunId: 'j2' });
    const alt = seedBoulder({ id: 'alt-1', status: 'archived', archivedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_ASCENTS, JSON.stringify([{ id: 'a1', userId: 'u', userNickname: 'u', boulderId: neu.id, type: 'top', createdAt: new Date().toISOString() }]));
    const j: CaptureJob = { id: 'j2', gymId: 'gym-6a-plus', sectorId: SECTOR, mode: 'full', status: 'done', createdAt: new Date().toISOString(), finishedAt: new Date().toISOString(), result: { createdIds: [neu.id], created: 1, publishMode: 'direct' }, archivedBoulderIds: [alt.id] };
    expect(countAscentsForJob(j)).toBe(1);
    await undoCapture(j);
    const all = getWallBoulders(SECTOR);
    expect(all.find(b => b.id === neu.id)).toBeUndefined();
    expect(all.find(b => b.id === alt.id)?.status).toBe('active');
  });

  it('Kurz prüfen: Gründe, Ablauf nach 7 Tagen, «Passt» leert die Liste', () => {
    const b = seedBoulder({ id: 'r1', captureSource: 'ai', aiReview: ['grade'], gradePending: true });
    seedBoulder({ id: 'r2', aiReview: [`old_not_seen:2020-01-01`] });
    const items = getReviewItems(SECTOR);
    expect(items.map(i => i.boulder.id)).toEqual(['r1']);
    expect(items[0].reasons).toEqual(['grade']);
    const later = new Date(Date.now() + (REVIEW_DAYS + 1) * 86400_000);
    expect(getReviewItems(SECTOR, later)).toEqual([]);
    resolveReview(b.id, 'ok');
    expect(getReviewItems(SECTOR)).toEqual([]);
  });

  it('Farbe von Hand gesetzt: «Grad folgt» und Prüfgrund weg, Name von Hand = Schrauber-Name', () => {
    seedBoulder({ id: 'r3', captureSource: 'ai', gradePending: true, aiReview: ['grade', 'unsure'], nameSource: 'ai', radarSource: 'ai' });
    const after = updateBoulderDetails('r3', { gradeScaleId: 'g-blau', name: 'Mein Name' });
    expect(after).toMatchObject({ gradePending: false, aiReview: ['unsure'], nameSource: 'setter', radarSource: 'ai' });
    expect(updateBoulderDetails('r3', { radar: { technik: 5 } as any }).radarSource).toBe('setter');
  });

  it('«geschätzt» bis 3 Kletterer Merkmale bewertet haben', () => {
    const b = seedBoulder({ id: 'r4', radarSource: 'ai' });
    expect(isRadarStillEstimated(b)).toBe(true);
    const ratings = [1, 2, 3].map(i => ({ id: `rt${i}`, boulderId: b.id, userId: `u${i}`, userNickname: 'x', radar: { technik: 4 }, createdAt: '', updatedAt: '' }));
    localStorage.setItem(STORAGE_KEY_RATINGS, JSON.stringify(ratings));
    expect(isRadarStillEstimated(b)).toBe(false);
    expect(isRadarStillEstimated({ id: 'x', radarSource: 'setter' })).toBe(false);
  });

  it('Meldungen: einmal je Person und Grund, landen in Kurz prüfen', async () => {
    const b = seedBoulder({ id: 'r5' });
    await reportRouteIssue({ gymId: 'gym-6a-plus', sectorId: SECTOR, boulderId: b.id, kind: 'wrong_grade', userId: 'u1' });
    await reportRouteIssue({ gymId: 'gym-6a-plus', sectorId: SECTOR, boulderId: b.id, kind: 'wrong_grade', userId: 'u1' });
    expect(getOpenIssues()).toHaveLength(1);
    expect(hasReportedIssue(b.id, 'u1', 'wrong_grade')).toBe(true);
    expect(getReviewItems(SECTOR)[0]).toMatchObject({ reasons: ['issue'], issues: 1 });
    resolveReview(b.id, 'ok');
    expect(getOpenIssues()).toHaveLength(0);
  });
});
