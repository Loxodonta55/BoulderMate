// SPEC-052 F11: Testlauf «KI gegen Hans' Routen».
// 1. Vergleichsdaten holen:  npx vite-node scripts/ai-capture/reference.ts -- --gym 6a
// 2. Gemini laufen lassen:   npx vite-node scripts/ai-capture/eval.ts -- --backend cli --marker tape
//    (api = GEMINI_API_KEY, cli = Gemini-CLI, manual = Aufträge als Ordner, result.json von Hand/Antigravity)
// 3. Vorhandenes Ergebnis prüfen: ... eval.ts -- --from <ordner oder ergebnis.json> --label claude
// Ergebnis: ai-capture/eval/runs/<zeit>-<label>/report.md (+ Prüfbilder je Sektor), Verlauf in ai-capture/eval/history.md
import fs from 'node:fs';
import path from 'node:path';
import {
  buildCapturePrompt,
  compareWithReference,
  extractJson,
  isGradeMarker,
  withMarkerSymbols,
  normalizeColorName,
  PROMPT_VERSION,
  summarizeReports,
  validateCaptureResult,
  type CaptureContext,
  type EvalReport,
  type GradeMarker,
} from '../../src/lib/aiCapture';
import { arg, callModel, loadEnv, prepareImage, projectRoot, refineColors, renderOverlay, slug, toUpright, type Backend, type ReferenceFile } from './lib';

const pct = (v: number) => `${Math.round(v * 100)} %`;

/** Unter diesem Median-Abstand (bei ≥ 10 Treffern) sieht ein Ergebnis abgeschrieben aus: echte Modelle liegen bei 0.02–0.04. */
const COPY_SUSPECT_MEDIAN = 0.012;

function findReference(): string {
  const given = arg('ref');
  if (given) return path.resolve(given);
  const dir = path.join(projectRoot, 'ai-capture', 'reference');
  const first = fs.existsSync(dir) ? fs.readdirSync(dir).find(d => fs.existsSync(path.join(dir, d, 'reference.json'))) : undefined;
  if (!first) throw new Error('Keine Vergleichsdaten. Erst: npx vite-node scripts/ai-capture/reference.ts -- --gym 6a');
  return path.join(dir, first, 'reference.json');
}

/** Ergebnisse aus einem früheren Lauf: Ordner mit <sektor>/result.json bzw. <sektor>.json, oder ergebnis.json (sektoren[]). */
function loadFromExisting(from: string, sectorName: string): unknown | null {
  const s = slug(sectorName);
  if (fs.statSync(from).isFile()) {
    const data = JSON.parse(fs.readFileSync(from, 'utf8'));
    const list = data.sektoren ?? data.sectors ?? [];
    const hit = list.find((x: { sektor?: string; sector?: string; name?: string }) =>
      normalizeColorName(x.sektor ?? x.sector ?? x.name ?? '') === normalizeColorName(sectorName));
    return hit ?? null;
  }
  for (const p of [path.join(from, s, 'result.json'), path.join(from, `${s}.json`), path.join(from, s, 'raw.txt')]) {
    if (fs.existsSync(p)) return extractJson(fs.readFileSync(p, 'utf8'));
  }
  return null;
}

async function main() {
  loadEnv();
  const refPath = findReference();
  const ref: ReferenceFile = JSON.parse(fs.readFileSync(refPath, 'utf8'));
  const refDir = path.dirname(refPath);
  const backend = (arg('backend', 'cli') as Backend);
  const from = arg('from') ? path.resolve(arg('from')!) : null;
  // Grad-Markierung: --marker, sonst Einstellung der Halle, sonst tape (6a plus)
  const marker: GradeMarker = isGradeMarker(arg('marker')) ? arg('marker') as GradeMarker : isGradeMarker(ref.gym.gradeMarker) ? ref.gym.gradeMarker : 'tape';
  const gradeHint = arg('hint') ?? ref.gym.gradeHint ?? undefined;
  const label = arg('label', from ? 'import' : backend)!;
  const only = arg('sector');
  const model = arg('model');
  // Zweiter Blick auf die Farben (Kontaktbogen je Start); aus mit --refine off
  const refine = !from && arg('refine', 'on') !== 'off';
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const runDir = path.join(projectRoot, 'ai-capture', 'eval', 'runs', `${stamp}-${slug(label)}`);
  fs.mkdirSync(runDir, { recursive: true });

  const basePalette = ref.palette.map(p => ({ id: p.id, colorName: p.colorName, colorHex: p.colorHex, fontRangeMin: p.fontRangeMin, fontRangeMax: p.fontRangeMax }));
  // --symbols "Gelb=★,Rot=★★" überschreibt die Zeichen der Halle
  const symbolArg = arg('symbols');
  const symbols = symbolArg
    ? Object.fromEntries(symbolArg.split(',').map(x => x.split('=')).flatMap(([name, sym]) => {
      const p = basePalette.find(q => normalizeColorName(q.colorName) === normalizeColorName(name ?? ''));
      return p && sym ? [[p.id, sym]] : [];
    }))
    : ref.gym.gradeSymbols;
  const palette = marker === 'symbol' ? withMarkerSymbols(basePalette, symbols, new Map(Object.entries(ref.gym.aliases ?? {}))) : basePalette;
  const reports: { sector: string; report: EvalReport | null; note?: string; ai: ReturnType<typeof validateCaptureResult> | null; refRoutes: ReferenceFile['sectors'][number]['routes'] }[] = [];
  let waiting = 0;

  for (const sector of ref.sectors) {
    if (only && !normalizeColorName(sector.name).includes(normalizeColorName(only))) continue;
    if (!sector.photoFile) { reports.push({ sector: sector.name, report: null, note: 'kein Foto', ai: null, refRoutes: sector.routes }); continue; }
    const sDir = path.join(runDir, slug(sector.name));
    const photo = fs.readFileSync(path.join(refDir, sector.photoFile));
    const ctx: CaptureContext = {
      gymName: ref.gym.name, sectorName: sector.name, gradeMarker: marker, gradeHint, palette, nameStyle: 'fun', mode: 'new',
      takenNames: ref.sectors.filter(s => s.id !== sector.id).flatMap(s => s.routes.map(r => r.name)).filter(Boolean),
    };

    let raw: unknown = null;
    try {
      if (from) {
        raw = loadFromExisting(from, sector.name);
      } else {
        const img = await prepareImage(photo);
        const prompt = buildCapturePrompt(ctx);
        process.stdout.write(`• ${sector.name}: ${backend} … `);
        const text = await callModel({ backend, prompt, image: img.jpeg, workDir: sDir, model });
        if (text === null) { waiting++; console.log('wartet auf result.json'); reports.push({ sector: sector.name, report: null, note: 'wartet auf result.json', ai: null, refRoutes: sector.routes }); continue; }
        fs.writeFileSync(path.join(sDir, 'raw.txt'), text);
        let first = extractJson(text);
        if (refine) {
          const r = await refineColors({ raw: first, image: img.jpeg, palette, marker, backend, workDir: sDir, model });
          first = r.raw;
          fs.writeFileSync(path.join(sDir, 'refined.json'), JSON.stringify(first, null, 2));
          process.stdout.write(r.error ? `Farbe: ${r.error} … ` : `Farbe: ${r.changed} geändert, ${r.pending} «Grad folgt» … `);
        }
        raw = toUpright(first, img.remainingOrientation);
        console.log('ok');
      }
    } catch (e) {
      console.log(`Fehler: ${(e as Error).message}`);
      reports.push({ sector: sector.name, report: null, note: `Fehler: ${(e as Error).message}`, ai: null, refRoutes: sector.routes });
      continue;
    }
    if (!raw) { reports.push({ sector: sector.name, report: null, note: 'kein Ergebnis', ai: null, refRoutes: sector.routes }); continue; }

    const ai = validateCaptureResult(raw, ctx);
    fs.mkdirSync(sDir, { recursive: true });
    fs.writeFileSync(path.join(sDir, 'parsed.json'), JSON.stringify(ai, null, 2));

    let aspect = 1;
    try {
      const sharp = (await import('sharp')).default;
      const meta = await sharp(photo).rotate().toBuffer({ resolveWithObject: true });
      aspect = meta.info.width / meta.info.height;
    } catch { /* ohne sharp: quadratisch rechnen */ }

    const report = compareWithReference(ai.routes, sector.routes, { aspect });
    reports.push({ sector: sector.name, report, ai, refRoutes: sector.routes });

    const hex = (id: string | null) => ref.palette.find(p => p.id === id)?.colorHex ?? '#888888';
    await renderOverlay(
      photo,
      sector.routes.map(r => ({ x: r.x, y: r.y, color: hex(r.gradeScaleId) })),
      ai.routes.map((r, i) => ({ x: r.x, y: r.y, color: r.gradePending ? '#888888' : hex(r.gradeScaleId), label: String(i + 1), review: r.reviewReasons.length > 0 })),
      report.pairs,
      path.join(sDir, 'overlay.jpg'),
    );
  }

  // --- Bericht ---
  const done = reports.filter(r => r.report) as (typeof reports[number] & { report: EvalReport })[];
  const total = summarizeReports(done.map(r => r.report));
  const radarPairs = done.reduce((s, r) => s + r.report.radarRated, 0);
  const maeAll = done.filter(r => r.report.radarMae !== null);
  const mae = maeAll.length ? maeAll.reduce((s, r) => s + (r.report.radarMae ?? 0) * r.report.radarRated, 0) / Math.max(1, radarPairs) : null;
  // Blindtest: nur wenn das Modell die Vergleichsdaten nicht sehen konnte (api/cli). manual/Import kann abgeschrieben sein.
  const blind = !from && backend !== 'manual';
  const dists = done.flatMap(r => r.report.pairs.map(p => p.dist)).sort((a, b) => a - b);
  const medianDist = dists.length ? dists[Math.floor(dists.length / 2)] : null;
  const copySuspect = medianDist !== null && dists.length >= 10 && medianDist < COPY_SUSPECT_MEDIAN;
  const gate = copySuspect ? 'ungültig' : total.passed ? 'ja' : 'nein';
  const colorName = (id: string | null) => (id ? ref.palette.find(p => p.id === id)?.colorName ?? '?' : 'Grad folgt');

  const md: string[] = [
    `# KI-Test ${ref.gym.name} – ${label}`,
    '',
    `Lauf: ${stamp} · Modell: ${from ? `Import aus ${path.relative(projectRoot, from)}` : `${backend}${model ? ` ${model}` : ` ${process.env.GEMINI_MODEL ?? 'gemini-2.5-pro'}`}`} · Grad-Markierung: ${marker} · Prompt: ${PROMPT_VERSION}${refine ? ' + Farb-Check' : ''}`,
    `Vergleich: Hans' Routen vom ${ref.exportedAt.slice(0, 10)} (Merkmale nur, wenn Hans sie bewertet hat)`,
    `Blindtest: ${blind ? 'ja (Modell sah nur Foto und Auftrag)' : 'nein (Import/manual – Modell konnte die Vergleichsdaten sehen)'}${medianDist !== null ? ` · Median-Abstand zu Hans' Pins ${medianDist.toFixed(3)}` : ''}`,
    ...(copySuspect ? ['', `**⚠ Ungültig:** Die KI-Punkte liegen auffällig nah an Hans' Pins (Median ${medianDist!.toFixed(3)} < ${COPY_SUSPECT_MEDIAN}). Das sieht nach abgeschriebenen Vergleichsdaten aus, nicht nach Bilderkennung.`] : []),
    '',
    `**Gesamt:** ${total.matched} von ${total.refCount} Routen gefunden (**${pct(total.foundRate)}**), Farbe richtig **${pct(total.gradeRate)}**, zusätzliche KI-Routen ${pct(total.extraRate)} · Qualitäts-Tor (≥ 90 % / ≥ 95 % / ≤ 5 %): **${copySuspect ? 'ungültig' : total.passed ? 'bestanden' : 'nicht bestanden'}**`,
    `Merkmale: ${radarPairs} bewertete Routen verglichen${mae !== null ? `, mittlere Abweichung ${mae.toFixed(2)} Punkte` : ''}`,
    '',
    '| Sektor | Hans | KI | gefunden | Farbe richtig | Grad folgt | zusätzlich | Merkmale (n / Abw.) |',
    '|---|---|---|---|---|---|---|---|',
    ...reports.map(({ sector, report, note }) => report
      ? `| ${sector} | ${report.refCount} | ${report.aiCount} | ${pct(report.foundRate)} | ${pct(report.gradeRate)} | ${report.gradePending} | ${report.aiCount - report.matched} | ${report.radarRated}${report.radarMae !== null ? ` / ${report.radarMae.toFixed(2)}` : ''} |`
      : `| ${sector} | – | – | ${note ?? ''} | | | | |`),
    '',
    'Prüfbild je Sektor: `<sektor>/overlay.jpg` – Ring = Hans, Punkt mit Nummer = KI, grüne Linie = gleiche Farbe, pinke Linie = andere Farbe, oranger Rand = «Kurz prüfen».',
    '',
  ];
  for (const { sector, report, ai, refRoutes } of done) {
    if (!ai) continue;
    md.push(`## ${sector}`, '');
    const wrong = report.pairs.filter(p => p.sameGrade === false);
    if (wrong.length) {
      md.push('Andere Farbe:', ...wrong.map(p => `- KI ${p.aiIndex + 1}: ${colorName(ai.routes[p.aiIndex].gradeScaleId)} statt ${colorName(refRoutes[p.refIndex].gradeScaleId)} (Hans: «${refRoutes[p.refIndex].name || 'ohne Name'}»)`), '');
    }
    if (report.missedRefIndexes.length) {
      md.push('Nicht gefunden:', ...report.missedRefIndexes.map(i => `- ${refRoutes[i].colorName} «${refRoutes[i].name || 'ohne Name'}» bei (${refRoutes[i].x.toFixed(2)}, ${refRoutes[i].y.toFixed(2)})`), '');
    }
    if (report.extraAiIndexes.length) {
      md.push('Nur bei der KI (Fehler oder von Hans nicht eingetragen):', ...report.extraAiIndexes.map(i => {
        const r = ai.routes[i];
        return `- KI ${i + 1}: ${colorName(r.gradeScaleId)}${r.holdColor ? `, Griffe ${r.holdColor}` : ''}, Sicherheit ${r.confidence.toFixed(2)}${r.tapeName ? `, Tape «${r.tapeName}»` : ''}`;
      }), '');
    }
  }
  fs.writeFileSync(path.join(runDir, 'report.md'), md.join('\n'));
  fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify({ label, backend, model, marker, prompt: PROMPT_VERSION, refine, blind, medianDist, copySuspect, total, sectors: reports.map(r => ({ sector: r.sector, note: r.note, report: r.report && { ...r.report, pairs: undefined } })) }, null, 2));

  const history = path.join(projectRoot, 'ai-capture', 'eval', 'history.md');
  if (!fs.existsSync(history)) fs.writeFileSync(history, '# Verlauf KI-Tests\n\n| Lauf | Label | gefunden | Farbe | zusätzlich | Merkmal-Abw. | Tor | blind |\n|---|---|---|---|---|---|---|---|\n');
  if (done.length) {
    fs.appendFileSync(history, `| ${stamp} | ${label} | ${pct(total.foundRate)} | ${pct(total.gradeRate)} | ${pct(total.extraRate)} | ${mae !== null ? mae.toFixed(2) : '–'} | ${gate} | ${blind ? 'ja' : 'nein'} |\n`);
  }

  console.log(`\n${md.slice(0, 6).join('\n')}`);
  console.log(`\n📄 ${path.relative(projectRoot, path.join(runDir, 'report.md'))}`);
  if (waiting) console.log(`⏳ ${waiting} Sektor(en) warten auf result.json (Ordner ${path.relative(projectRoot, runDir)}/<sektor>/). Danach: eval.ts -- --from ${path.relative(projectRoot, runDir)}`);
}

main().catch(e => { console.error('❌', e.message ?? e); process.exit(1); });
