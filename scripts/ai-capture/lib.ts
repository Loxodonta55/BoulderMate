// SPEC-052: Gemeinsame Helfer für Worker und Eval-Skript (laufen auf Hans' PC mit vite-node).
// Gemini im Pilot über: api (GEMINI_API_KEY, bezahlte Stufe), cli (Gemini-CLI mit Google-Anmeldung)
// oder manual (Auftrag liegt als Ordner bereit, Antigravity/Mensch schreibt result.json).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildColorCheckPrompt, CAPTURE_RESPONSE_SCHEMA, COLOR_CHECK_TILES, extractJson, mergeColorCheck, parseColorCheck,
  rawStartPoints, rawToUpright, readJpegOrientation, type GradeMarker, type PaletteEntry,
} from '../../src/lib/aiCapture';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Liest .env, .env.local und .env.worker (ohne Abhängigkeit), ohne vorhandene Variablen zu überschreiben. */
export function loadEnv(): void {
  for (const file of ['.env', '.env.local', '.env.worker']) {
    const p = path.join(projectRoot, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return process.argv.includes(`--${name}`) ? 'true' : fallback;
}

/** Foto laden: http(s), data:-URL oder Pfad im public-Ordner (/images/...). */
export async function loadPhoto(url: string): Promise<Buffer> {
  if (url.startsWith('data:')) return Buffer.from(url.split(',')[1] ?? '', 'base64');
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Foto nicht ladbar (${res.status}): ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const local = path.join(projectRoot, 'public', url.replace(/^\//, ''));
  if (fs.existsSync(local)) return fs.readFileSync(local);
  if (fs.existsSync(url)) return fs.readFileSync(url);
  throw new Error(`Foto nicht gefunden: ${url}`);
}

export interface PreparedImage {
  /** JPEG, aufrecht gedreht wenn möglich */
  jpeg: Buffer;
  width: number;
  height: number;
  /** Orientierung, die das Modell noch sieht (1 = aufrecht). Koordinaten werden mit rawToUpright zurückgerechnet. */
  remainingOrientation: number;
}

/** Dreht das Foto aufrecht und verkleinert auf max. 2048 px (mit sharp, falls installiert). */
export async function prepareImage(input: Buffer, maxSide = 2048): Promise<PreparedImage> {
  try {
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(input).rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 }).toBuffer({ resolveWithObject: true });
    return { jpeg: data, width: info.width, height: info.height, remainingOrientation: 1 };
  } catch {
    // Ohne sharp: Rohbild schicken, Koordinaten nachher umrechnen
    const orientation = readJpegOrientation(new Uint8Array(input));
    return { jpeg: input, width: 0, height: 0, remainingOrientation: orientation };
  }
}

export function toUpright<T extends { start_x?: unknown; start_y?: unknown }>(raw: unknown, orientation: number): unknown {
  if (orientation === 1 || !raw || typeof raw !== 'object') return raw;
  const o = raw as { routes?: T[] };
  if (!Array.isArray(o.routes)) return raw;
  return {
    ...o,
    routes: o.routes.map(r => {
      const x = Number(r.start_x);
      const y = Number(r.start_y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return r;
      const p = rawToUpright(x, y, orientation);
      return { ...r, start_x: p.x, start_y: p.y };
    }),
  };
}

export type Backend = 'api' | 'cli' | 'manual';

export interface ModelCall {
  backend: Backend;
  prompt: string;
  image: Buffer;
  /** Arbeitsordner für cli/manual */
  workDir: string;
  model?: string;
  /** Antwort-Schema für die API (Standard: Routen-Schema) */
  schema?: object | null;
}

/** Ruft Gemini auf und liefert den Antworttext (JSON). Bei manual: null, solange result.json fehlt. */
export async function callModel({ backend, prompt, image, workDir, model, schema = CAPTURE_RESPONSE_SCHEMA }: ModelCall): Promise<string | null> {
  fs.mkdirSync(workDir, { recursive: true });
  const modelName = model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';

  if (backend === 'api') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY fehlt (.env.worker). Nur bezahlte Stufe verwenden (keine Trainingsnutzung).');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: image.toString('base64') } }, { text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json', ...(schema ? { responseSchema: schema } : {}) },
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Gemini API ${res.status}: ${text.slice(0, 400)}`);
    return text;
  }

  const photo = path.join(workDir, 'photo.jpg');
  fs.writeFileSync(photo, image);
  fs.writeFileSync(path.join(workDir, 'prompt.txt'), prompt);

  if (backend === 'manual') {
    const result = path.join(workDir, 'result.json');
    return fs.existsSync(result) ? fs.readFileSync(result, 'utf8') : null;
  }

  // Gemini-CLI: Bild über @-Verweis, Antwort als JSON-Hülle
  const bin = process.env.GEMINI_CLI ?? 'gemini';
  const fullPrompt = `${prompt}\n\nThe photo: @photo.jpg`;
  return await new Promise<string>((resolve, reject) => {
    const isWin = process.platform === 'win32';
    // Unter Windows zerschneidet cmd.exe mehrzeilige -p-Argumente bei shell:true → über stdin übergeben
    const args = isWin
      ? ['-m', modelName, '--output-format', 'json', '-p', 'The photo: @photo.jpg']
      : ['-m', modelName, '--output-format', 'json', '-p', fullPrompt];
    const child = spawn(bin, args, {
      cwd: workDir, shell: isWin, env: process.env,
    });
    if (isWin && child.stdin) {
      child.stdin.on('error', () => {});
      child.stdin.end(prompt);
    }
    let out = '';
    let err = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Gemini-CLI: Zeitüberschreitung (5 min)')); }, 5 * 60_000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => {
      clearTimeout(timer);
      fs.writeFileSync(path.join(workDir, 'cli-output.txt'), out + (err ? `\n--- stderr ---\n${err}` : ''));
      if (code === 0) resolve(out);
      else reject(new Error(`Gemini-CLI beendet mit ${code}: ${err.slice(0, 400)}`));
    });
  });
}

/**
 * Kontaktbogen für den zweiten Blick: je Start ein vergrößerter Ausschnitt (4 × 4 Kacheln, nummeriert ab 1).
 * Braucht sharp; ohne sharp null.
 */
export async function makeContactSheet(image: Buffer, points: { x: number; y: number }[], tile = 320): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(image).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return null;
    const side = Math.round(Math.min(W, H) * 0.14);
    const cols = 4;
    const rows = Math.ceil(points.length / cols);
    const tiles = await Promise.all(points.map(async (p, i) => {
      const cx = Math.max(0, Math.min(1, p.x)) * W;
      const cy = Math.max(0, Math.min(1, p.y)) * H;
      const cropW = Math.min(side, W);
      const cropH = Math.min(side, H);
      const left = Math.round(Math.max(0, Math.min(W - cropW, cx - cropW / 2)));
      const top = Math.round(Math.max(0, Math.min(H - cropH, cy - cropH / 2)));
      const ringX = Math.round(((cx - left) / cropW) * tile);
      const ringY = Math.round(((cy - top) / cropH) * tile);
      const crop = await sharp(image).extract({ left, top, width: cropW, height: cropH }).resize(tile, tile).toBuffer();
      const r = tile * 0.09;
      const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}"><rect x="0" y="0" width="${tile}" height="${tile}" fill="none" stroke="#000" stroke-width="6"/><circle cx="${ringX}" cy="${ringY}" r="${tile * 0.16}" fill="none" stroke="#00e5ff" stroke-width="3" stroke-dasharray="10 6"/><circle cx="${r * 1.4}" cy="${r * 1.4}" r="${r}" fill="#000"/><text x="${r * 1.4}" y="${r * 1.85}" font-size="${r * 1.3}" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#fff">${i + 1}</text></svg>`);
      return { input: await sharp(crop).composite([{ input: label }]).toBuffer(), left: (i % cols) * tile, top: Math.floor(i / cols) * tile };
    }));
    return await sharp({ create: { width: cols * tile, height: rows * tile, channels: 3, background: '#808080' } })
      .composite(tiles).jpeg({ quality: 90 }).toBuffer();
  } catch {
    return null;
  }
}

/**
 * Zweiter Blick auf die Farben (SPEC-052 F2): Kontaktbögen um jeden Start an das Modell,
 * Farben in die Rohantwort zurückschreiben. Ohne sharp oder bei Fehlern bleibt der erste Durchgang.
 * `raw` muss sich auf dasselbe Bild beziehen wie `image` (also vor toUpright).
 */
export async function refineColors(opts: {
  raw: unknown; image: Buffer; palette: PaletteEntry[]; marker: GradeMarker;
  backend: Backend; workDir: string; model?: string;
}): Promise<{ raw: unknown; changed: number; pending: number; sheets: number; error?: string }> {
  const points = rawStartPoints(opts.raw);
  let raw = opts.raw;
  let changed = 0;
  let pending = 0;
  let sheets = 0;
  try {
    for (let offset = 0; offset < points.length; offset += COLOR_CHECK_TILES) {
      const chunk = points.slice(offset, offset + COLOR_CHECK_TILES);
      const sheet = await makeContactSheet(opts.image, chunk);
      if (!sheet) return { raw, changed, pending, sheets, error: 'Kontaktbogen braucht sharp' };
      const dir = path.join(opts.workDir, `farbe-${offset / COLOR_CHECK_TILES + 1}`);
      const text = await callModel({
        backend: opts.backend, model: opts.model, workDir: dir, image: sheet, schema: null,
        prompt: buildColorCheckPrompt(opts.palette, chunk.length, opts.marker),
      });
      if (text === null) return { raw, changed, pending, sheets, error: 'wartet auf result.json (Farbe)' };
      fs.writeFileSync(path.join(dir, 'raw.txt'), text);
      const merged = mergeColorCheck(raw, parseColorCheck(extractJson(text)), opts.palette, offset, opts.marker);
      raw = merged.raw;
      changed += merged.changed;
      pending += merged.pending;
      sheets++;
    }
  } catch (e) {
    return { raw, changed, pending, sheets, error: (e as Error).message };
  }
  return { raw, changed, pending, sheets };
}

/** Overlay-Bild für die Sichtprüfung: Hans' Pins (Ring), KI-Pins (Punkt mit Nummer), Linie bei Treffer. */
export async function renderOverlay(
  photo: Buffer,
  refs: { x: number; y: number; color: string; label?: string }[],
  ai: { x: number; y: number; color: string; label: string; review: boolean }[],
  pairs: { refIndex: number; aiIndex: number; sameGrade: boolean | null }[],
  outFile: string,
): Promise<boolean> {
  try {
    const sharp = (await import('sharp')).default;
    const base = sharp(photo).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
    const { data, info } = await base.jpeg().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const r = Math.round(Math.max(W, H) / 70);
    const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const parts: string[] = [];
    for (const p of pairs) {
      const a = ai[p.aiIndex];
      const b = refs[p.refIndex];
      parts.push(`<line x1="${a.x * W}" y1="${a.y * H}" x2="${b.x * W}" y2="${b.y * H}" stroke="${p.sameGrade === false ? '#ff00ff' : '#00ff66'}" stroke-width="4"/>`);
    }
    for (const b of refs) {
      parts.push(`<circle cx="${b.x * W}" cy="${b.y * H}" r="${r * 1.4}" fill="none" stroke="#000" stroke-width="7"/>`);
      parts.push(`<circle cx="${b.x * W}" cy="${b.y * H}" r="${r * 1.4}" fill="none" stroke="${b.color}" stroke-width="4"/>`);
    }
    for (const a of ai) {
      parts.push(`<circle cx="${a.x * W}" cy="${a.y * H}" r="${r}" fill="${a.color}" stroke="${a.review ? '#ff9900' : '#000'}" stroke-width="${a.review ? 6 : 3}"/>`);
      parts.push(`<text x="${a.x * W}" y="${a.y * H + r * 0.45}" font-size="${r * 1.2}" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2">${esc(a.label)}</text>`);
    }
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join('')}</svg>`);
    await sharp(data).composite([{ input: svg }]).jpeg({ quality: 85 }).toFile(outFile);
    return true;
  } catch {
    return false;
  }
}

export function slug(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Vergleichsdaten einer Halle (reference.ts schreibt sie, eval.ts liest sie). */
export interface ReferenceFile {
  gym: {
    id: string;
    name: string;
    gradeMarker?: string;
    gradeSymbols?: Record<string, string>;
    gradeHint?: string | null;
    /** doppelte Farb-Id → Id in der Palette */
    aliases?: Record<string, string>;
  };
  exportedAt: string;
  palette: { id: string; colorName: string; colorHex: string; fontRangeMin: string; fontRangeMax: string; aliasIds: string[] }[];
  sectors: {
    id: string;
    name: string;
    wallPhotoUrl: string;
    photoFile: string | null;
    routes: { id: string; x: number; y: number; gradeScaleId: string; colorName: string; name: string; radar: Record<string, number> }[];
  }[];
}

