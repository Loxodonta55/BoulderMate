// SPEC-052 Stufe 1: Worker auf Hans' PC. Holt Aufträge aus der App, lässt Gemini auswerten
// und schreibt das Ergebnis nach Supabase (mit dem Worker-Konto aus .env.worker).
//
//   npx vite-node scripts/ai-capture/worker.ts -- --backend cli            fetch + run + push, einmal
//   npx vite-node scripts/ai-capture/worker.ts -- --backend cli --loop 15  alle 15 Minuten
//   npx vite-node scripts/ai-capture/worker.ts -- fetch | run | push       einzelne Schritte
//
// Ordner: ai-capture/inbox/<jobId>/ (photo.jpg, prompt.txt, context.json, result.json) → ai-capture/done/<jobId>/
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  buildCapturePrompt,
  extractJson,
  isGradeMarker,
  processCaptureResponse,
  PROMPT_VERSION,
  withMarkerSymbols,
  type AiPublishMode,
  type CaptureContext,
  type CaptureMode,
  type CapturePlan,
} from '../../src/lib/aiCapture';
import { arg, callModel, loadEnv, loadPhoto, prepareImage, projectRoot, refineColors, toUpright, type Backend } from './lib';

const INBOX = path.join(projectRoot, 'ai-capture', 'inbox');
const DONE = path.join(projectRoot, 'ai-capture', 'done');

interface JobRow {
  id: string;
  gym_id: string;
  sector_id: string;
  mode: CaptureMode;
  photo_url: string;
  status: string;
  created_by: string | null;
}

interface JobContext {
  job: JobRow;
  ctx: CaptureContext;
  publishMode: AiPublishMode;
  orientation: number;
  previousPhotoUrl: string | null;
  sectorName: string;
  fallbackScaleId: string;
}

const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString('de-CH')}] ${msg}`);

async function connect(): Promise<SupabaseClient> {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.WORKER_EMAIL;
  const password = process.env.WORKER_PASSWORD;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen in .env');
  if (!email || !password) throw new Error('WORKER_EMAIL / WORKER_PASSWORD fehlen in .env.worker');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Anmeldung Worker-Konto fehlgeschlagen: ${error.message}`);
  return supabase;
}

async function fail(supabase: SupabaseClient, jobId: string, message: string) {
  log(`✗ ${jobId.slice(0, 8)}: ${message}`);
  await supabase.from('ai_capture_jobs').update({ status: 'failed', error: message.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', jobId);
}

/** Schritt 1: offene Aufträge übernehmen und mit allem Nötigen in die Inbox legen. */
async function fetchJobs(supabase: SupabaseClient): Promise<number> {
  const { data: jobs, error } = await supabase.from('ai_capture_jobs').select('*').eq('status', 'queued').order('created_at').limit(20);
  if (error) throw error;
  let count = 0;
  for (const job of (jobs ?? []) as JobRow[]) {
    const { data: claimed } = await supabase.from('ai_capture_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', job.id).eq('status', 'queued').select('id');
    if (!claimed?.length) continue; // anderer Worker war schneller

    try {
      const [{ data: gym }, { data: scales }, { data: sector }, { data: active }] = await Promise.all([
        supabase.from('gyms').select('*').eq('id', job.gym_id).single(),
        supabase.from('grade_scales').select('*').eq('gym_id', job.gym_id).order('sort_order'),
        supabase.from('sectors').select('*').eq('id', job.sector_id).single(),
        supabase.from('boulders').select('id,sector_id,name,position_x,position_y,grade_scale_id,hold_color,status').eq('status', 'active'),
      ]);
      if (!gym || !sector) throw new Error('Halle oder Sektor nicht gefunden');

      // Farbskalen gibt es teils doppelt: je Name die erste
      const palette: CaptureContext['palette'] = [];
      const canonical = new Map<string, string>();
      for (const s of scales ?? []) {
        const k = String(s.color_name).trim().toLowerCase();
        let p = palette.find(x => x.colorName.trim().toLowerCase() === k);
        if (!p) { p = { id: s.id, colorName: s.color_name, colorHex: s.color_hex, fontRangeMin: s.font_range_min, fontRangeMax: s.font_range_max }; palette.push(p); }
        canonical.set(s.id, p.id);
      }
      if (!palette.length) throw new Error('Halle hat kein Farbsystem');
      const gradeMarker = isGradeMarker(gym.grade_marker) ? gym.grade_marker : 'holds';
      const aiPalette = gradeMarker === 'symbol' ? withMarkerSymbols(palette, gym.grade_symbols, canonical) : palette;

      const { data: gymSectors } = await supabase.from('sectors').select('id').eq('gym_id', job.gym_id);
      const gymSectorIds = new Set((gymSectors ?? []).map(s => s.id));
      const gymActive = (active ?? []).filter(b => gymSectorIds.has(b.sector_id));
      const existing = gymActive.filter(b => b.sector_id === job.sector_id).map(b => ({
        id: b.id, x: Number(b.position_x), y: Number(b.position_y),
        gradeScaleId: canonical.get(b.grade_scale_id) ?? b.grade_scale_id,
        colorName: palette.find(p => p.id === (canonical.get(b.grade_scale_id) ?? b.grade_scale_id))?.colorName,
        holdColor: b.hold_color, name: b.name ?? undefined,
      }));

      const ctx: CaptureContext = {
        gymName: gym.name, sectorName: sector.name,
        gradeMarker, gradeHint: typeof gym.ai_grade_hint === 'string' ? gym.ai_grade_hint : undefined,
        palette: aiPalette, nameStyle: gym.route_name_style ?? 'fun', mode: job.mode,
        existing: job.mode === 'new' ? [] : existing,
        takenNames: gymActive.filter(b => b.sector_id !== job.sector_id || job.mode === 'partial').map(b => b.name).filter(Boolean),
      };

      const dir = path.join(INBOX, job.id);
      fs.mkdirSync(dir, { recursive: true });
      const img = await prepareImage(await loadPhoto(job.photo_url));
      fs.writeFileSync(path.join(dir, 'photo.jpg'), img.jpeg);
      fs.writeFileSync(path.join(dir, 'prompt.txt'), buildCapturePrompt(ctx));
      const jc: JobContext = {
        job, ctx, publishMode: gym.ai_publish_mode === 'review' ? 'review' : 'direct',
        orientation: img.remainingOrientation, previousPhotoUrl: sector.wall_photo_url ?? null,
        sectorName: sector.name, fallbackScaleId: palette[0].id,
      };
      fs.writeFileSync(path.join(dir, 'context.json'), JSON.stringify(jc, null, 2));
      log(`↓ ${job.id.slice(0, 8)} ${gym.name} / ${sector.name} (${job.mode})`);
      count++;
    } catch (e) {
      await fail(supabase, job.id, (e as Error).message);
    }
  }
  return count;
}

function inboxDirs(): string[] {
  if (!fs.existsSync(INBOX)) return [];
  return fs.readdirSync(INBOX).map(d => path.join(INBOX, d)).filter(d => fs.existsSync(path.join(d, 'context.json')));
}

/** Schritt 2: Gemini auswerten lassen (manual: nichts tun, result.json kommt von Hand/Antigravity). */
async function runModel(backend: Backend, model?: string): Promise<number> {
  if (backend === 'manual') return 0;
  let count = 0;
  for (const dir of inboxDirs()) {
    if (fs.existsSync(path.join(dir, 'result.json'))) continue;
    try {
      const text = await callModel({
        backend, model, workDir: dir,
        prompt: fs.readFileSync(path.join(dir, 'prompt.txt'), 'utf8'),
        image: fs.readFileSync(path.join(dir, 'photo.jpg')),
      });
      if (!text) continue;
      // Zweiter Blick auf die Farben (SPEC-052 F2); Koordinaten beziehen sich noch auf photo.jpg
      const jc: JobContext = JSON.parse(fs.readFileSync(path.join(dir, 'context.json'), 'utf8'));
      const r = await refineColors({
        raw: extractJson(text), image: fs.readFileSync(path.join(dir, 'photo.jpg')),
        palette: jc.ctx.palette, marker: jc.ctx.gradeMarker, backend, workDir: dir, model,
      });
      fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(r.raw));
      count++;
      log(`✓ Gemini ${path.basename(dir).slice(0, 8)}${r.error ? ` (Farb-Check: ${r.error})` : ` (Farb-Check: ${r.changed} geändert)`}`);
    } catch (e) {
      fs.writeFileSync(path.join(dir, 'error.txt'), (e as Error).message);
      log(`✗ Gemini ${path.basename(dir).slice(0, 8)}: ${(e as Error).message}`);
    }
  }
  return count;
}

/** Ergebnis in Supabase anwenden. Gibt die Job-Zusammenfassung zurück. */
export async function applyPlan(supabase: SupabaseClient, jc: JobContext, plan: CapturePlan, warnings: string[]) {
  const { job, publishMode } = jc;
  const now = new Date().toISOString();
  const direct = publishMode === 'direct';

  const rows = plan.create.map(c => ({
    id: randomUUID(),
    sector_id: job.sector_id,
    grade_scale_id: c.route.gradeScaleId ?? jc.fallbackScaleId,
    position_x: c.route.x,
    position_y: c.route.y,
    name: c.name || '',
    notes: '',
    setter_id: job.created_by,
    status: c.status,
    radar_maximalkraft: c.route.radar.maximalkraft,
    radar_kraftausdauer: c.route.radar.kraftausdauer,
    radar_kraft: c.route.radar.maximalkraft,
    radar_technik: c.route.radar.technik,
    radar_balance: c.route.radar.balance,
    radar_koordination: c.route.radar.koordination,
    radar_flexibilitaet: c.route.radar.flexibilitaet,
    created_at: now,
    published_at: c.status === 'active' ? now : null,
    capture_source: 'ai',
    ai_confidence: Math.round(c.route.confidence * 100) / 100,
    hold_color: c.route.holdColor,
    grade_pending: c.route.gradePending,
    name_source: c.nameSource ?? 'setter',
    radar_source: 'ai',
    ai_run_id: job.id,
    ai_review: c.reviewReasons.length ? c.reviewReasons : null,
  }));
  if (rows.length) {
    const { error } = await supabase.from('boulders').insert(rows);
    if (error) throw new Error(`Routen anlegen: ${error.message}`);
  }

  // Alte Routen: bei «Erst prüfen» + Ganze Wand archiviert «Wand fertig» in der App; sonst sofort
  const archiveNow = direct ? plan.archive : [];
  if (archiveNow.length) {
    const { error } = await supabase.from('boulders')
      .update({ status: 'archived', archived_at: now, wall_photo_url: jc.previousPhotoUrl })
      .in('id', archiveNow);
    if (error) throw new Error(`Alte Routen archivieren: ${error.message}`);
  }

  // Prüf-Hinweise an behaltenen alten Routen (Teil-Umbau), mit Datum für «läuft nach 7 Tagen ab»
  const day = now.slice(0, 10);
  for (const r of plan.review.filter(x => x.existingId)) {
    const reason = r.reason === 'old_not_seen' ? 'old_not_seen' : 'uncertain_match';
    await supabase.from('boulders').update({ ai_review: [`${reason}:${day}`] }).eq('id', r.existingId!);
  }
  // «Erst prüfen» beim Teil-Umbau: Abschrauben erst nach Bestätigung
  if (!direct && job.mode === 'partial') {
    for (const id of plan.archive) {
      await supabase.from('boulders').update({ ai_review: [`gone:${day}`] }).eq('id', id);
    }
  }

  // Sektor: Foto live (direkt) bzw. als Umbau-Entwurf (erst prüfen)
  const sectorPatch = direct
    ? { wall_photo_url: job.photo_url, ...(job.mode === 'partial' ? {} : { rebuilt_at: now, rebuild_started_at: null, draft_photo_url: null, rebuild_planned_for: null }) }
    : (job.mode === 'partial' ? {} : { draft_photo_url: job.photo_url, rebuild_started_at: now });
  if (Object.keys(sectorPatch).length) {
    const { error } = await supabase.from('sectors').update(sectorPatch).eq('id', job.sector_id);
    if (error) throw new Error(`Sektor aktualisieren: ${error.message}`);
  }

  const summary = {
    prompt: PROMPT_VERSION,
    publishMode,
    created: rows.length,
    createdIds: rows.map(r => r.id),
    kept: plan.keep.length,
    archived: archiveNow.length,
    review: plan.review.length,
    gradePending: plan.create.filter(c => c.route.gradePending).length,
    warnings,
  };
  const { error } = await supabase.from('ai_capture_jobs').update({
    status: 'done', finished_at: now, result: summary,
    archived_boulder_ids: archiveNow, previous_photo_url: jc.previousPhotoUrl,
  }).eq('id', job.id);
  if (error) throw new Error(`Auftrag abschließen: ${error.message}`);
  return summary;
}

/** Schritt 3: fertige result.json prüfen und anwenden. */
async function pushResults(supabase: SupabaseClient): Promise<number> {
  let count = 0;
  for (const dir of inboxDirs()) {
    const resultFile = path.join(dir, 'result.json');
    if (!fs.existsSync(resultFile)) continue;
    const jc: JobContext = JSON.parse(fs.readFileSync(path.join(dir, 'context.json'), 'utf8'));
    try {
      const raw = toUpright(extractJson(fs.readFileSync(resultFile, 'utf8')), jc.orientation);
      const { result, plan } = processCaptureResponse(raw, jc.ctx, jc.publishMode);
      if (!result.routes.length && jc.job.mode !== 'partial') throw new Error('Keine Route erkannt');
      const summary = await applyPlan(supabase, jc, plan, result.warnings);
      log(`↑ ${jc.job.id.slice(0, 8)} ${jc.sectorName}: ${summary.created} neu, ${summary.archived} archiviert, ${summary.review} kurz prüfen`);
      count++;
    } catch (e) {
      await fail(supabase, jc.job.id, (e as Error).message);
    }
    fs.mkdirSync(DONE, { recursive: true });
    fs.renameSync(dir, path.join(DONE, path.basename(dir)));
  }
  return count;
}

async function once(step: string, backend: Backend, model?: string) {
  const supabase = await connect();
  if (step === 'all' || step === 'fetch') await fetchJobs(supabase);
  if (step === 'all' || step === 'run') await runModel(backend, model);
  if (step === 'all' || step === 'push') await pushResults(supabase);
  await supabase.auth.signOut();
}

async function main() {
  const step = ['fetch', 'run', 'push'].find(s => process.argv.includes(s)) ?? 'all';
  const backend = (arg('backend', 'cli') as Backend);
  const model = arg('model');
  const loop = Number(arg('loop', '0'));
  do {
    try {
      await once(step, backend, model);
    } catch (e) {
      log(`Fehler: ${(e as Error).message}`);
      if (!loop) process.exitCode = 1;
    }
    if (loop) await new Promise(r => setTimeout(r, loop * 60_000));
  } while (loop);
}

if (!process.env.VITEST) main();
