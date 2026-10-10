import { GradeDistributionItem, GymGradeScale, LogbookEntry } from '../types/boulder';
import { getFontGradeIndex, normalizeFontGrade } from './gradeConverter';
import { CSV_HEADER } from './meStats';
import { t } from './i18n';

/**
 * SPEC-043 · Ticks importieren (Runde 1: die eigene CSV aus SPEC-033).
 * Importierte Ticks erscheinen nur in der Statistik «Alle Hallen» mit «importiert»,
 * nicht an der Wand, nicht bei «Wer war schon oben», nicht in Challenges.
 * Gespeichert vorerst nur im Gerät.
 */
export const IMPORT_STORE_KEY = 'boulderapp_imported_ticks_v1';
export const IMPORT_CHANGED_EVENT = 'bouldermate:imports_updated';
export const IMPORTED_SUFFIX = ' (importiert)';

export interface ImportedTick {
  id: string;
  userId: string;
  /** ISO-Zeitpunkt */
  date: string;
  gymName: string;
  sectorName?: string;
  colorName?: string;
  fontGrade: string;
  type: 'top' | 'flash';
  importedAt: string;
}

export interface ImportResult {
  added: number;
  skipped: number;
  invalid: number;
  ignoredProjects: number;
}

function readAll(): ImportedTick[] {
  try {
    const raw = localStorage.getItem(IMPORT_STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list: ImportedTick[]): void {
  try {
    localStorage.setItem(IMPORT_STORE_KEY, JSON.stringify(list));
  } catch {
    // Speicher gesperrt
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(IMPORT_CHANGED_EVENT));
}

export function getImportedTicks(userId: string): ImportedTick[] {
  return readAll().filter(t => t.userId === userId);
}

/** AC-3: «Importierte Ticks löschen». */
export function deleteImportedTicks(userId: string): number {
  const all = readAll();
  const rest = all.filter(t => t.userId !== userId);
  writeAll(rest);
  return all.length - rest.length;
}

/** Eine CSV-Zeile mit `;` und Anführungszeichen zerlegen. */
export function splitCsvLine(line: string, sep = ';'): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === sep) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** «2026-10-01 09:05» oder «01.10.2026» → ISO (lokale Zeit). */
export function parseCsvDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 12), +(m[5] || 0)).toISOString();
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 12), +(m[5] || 0)).toISOString();
  return null;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Doppelt = gleicher Tag, Halle, Grad und Stil (F3). */
export function tickKey(t: { date: string; gymName: string; fontGrade: string; type: string }): string {
  return [dayKey(t.date), t.gymName.trim().toLowerCase().replace(IMPORTED_SUFFIX, ''), normalizeFontGrade(t.fontGrade), t.type].join('|');
}

export interface ParsedRow {
  date: string;
  gymName: string;
  sectorName?: string;
  colorName?: string;
  fontGrade: string;
  type: 'top' | 'flash' | 'project';
}

/** Liest die eigene CSV (SPEC-033: Datum;Halle;Sektor;Nummer;Boulder;Farbe;Grad;Stil;Versuche). */
export function parseOwnCsv(text: string): { rows: ParsedRow[]; invalid: number; headerOk: boolean } {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return { rows: [], invalid: 0, headerOk: false };
  const header = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  const iDate = col('Datum');
  const iGym = col('Halle');
  const iGrade = col('Grad');
  const iStyle = col('Stil');
  const headerOk = iDate >= 0 && iGym >= 0 && iGrade >= 0 && iStyle >= 0;
  if (!headerOk) return { rows: [], invalid: lines.length - 1, headerOk };
  const iSector = col('Sektor');
  const iColor = col('Farbe');
  const rows: ParsedRow[] = [];
  let invalid = 0;
  for (const line of lines.slice(1)) {
    const c = splitCsvLine(line);
    const date = parseCsvDate(c[iDate] || '');
    const gymName = (c[iGym] || '').trim();
    const rawGrade = (c[iGrade] || '').trim();
    const grade = rawGrade ? normalizeFontGrade(rawGrade) : '';
    const styleRaw = (c[iStyle] || '').trim().toLowerCase();
    const type = styleRaw === 'flash' ? 'flash' : styleRaw === 'top' ? 'top' : styleRaw === 'projekt' || styleRaw === 'project' ? 'project' : null;
    if (!date || !gymName || !type || !grade || getFontGradeIndex(grade) < 0) {
      invalid++;
      continue;
    }
    rows.push({
      date,
      gymName,
      sectorName: iSector >= 0 ? (c[iSector] || '').trim() || undefined : undefined,
      colorName: iColor >= 0 ? (c[iColor] || '').trim() || undefined : undefined,
      fontGrade: grade,
      type,
    });
  }
  return { rows, invalid, headerOk };
}

/**
 * AC-1/AC-2: Import. Projekte werden nicht übernommen (nur Statistik von Tops/Flashes).
 * Doppelte gegen schon importierte Ticks und gegen das eigene BoulderMate-Logbuch.
 */
export function importTicks(userId: string, text: string, ownLogbook: LogbookEntry[] = []): ImportResult & { headerOk: boolean } {
  const { rows, invalid, headerOk } = parseOwnCsv(text);
  const all = readAll();
  const seen = new Set<string>([
    ...all.filter(t => t.userId === userId).map(tickKey),
    ...ownLogbook
      .filter(e => e.type === 'top' || e.type === 'flash')
      .map(e => tickKey({ date: e.createdAt, gymName: e.gymName, fontGrade: e.fontGrade, type: e.type })),
  ]);
  let added = 0;
  let skipped = 0;
  let ignoredProjects = 0;
  const now = new Date().toISOString();
  for (const r of rows) {
    if (r.type === 'project') {
      ignoredProjects++;
      continue;
    }
    const key = tickKey(r);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    all.push({
      id: `import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      date: r.date,
      gymName: r.gymName,
      sectorName: r.sectorName,
      colorName: r.colorName,
      fontGrade: r.fontGrade,
      type: r.type,
      importedAt: now,
    });
    added++;
  }
  if (added > 0) writeAll(all);
  return { added, skipped, invalid, ignoredProjects, headerOk };
}

export function importResultText(r: ImportResult & { headerOk: boolean }): string {
  if (!r.headerOk) return t('Die Datei passt nicht. Erwartet wird die Kopfzeile: {header}', { header: CSV_HEADER.join(';') });
  const parts = [t('{n} Ticks importiert', { n: r.added })];
  if (r.skipped) parts.push(t('{n} übersprungen (schon vorhanden)', { n: r.skipped }));
  if (r.invalid) parts.push(t('{n} Zeilen unlesbar', { n: r.invalid }));
  if (r.ignoredProjects) parts.push(t('{n} Projekte nicht übernommen', { n: r.ignoredProjects }));
  return parts.join(', ') + '.';
}

const IMPORT_SCALE = (colorName = 'Importiert'): GymGradeScale => ({
  id: 'import',
  gymId: 'import',
  colorName,
  colorHex: '#9A948C',
  difficultyLabel: '',
  fontRangeMin: '',
  fontRangeMax: '',
  sortOrder: 0,
});

/** Für die Statistik «Alle Hallen»: als Logbuch-Einträge mit «(importiert)» im Hallennamen. */
export function importedAsLogbook(ticks: ImportedTick[]): LogbookEntry[] {
  return ticks.map(t => ({
    id: t.id,
    ascentId: t.id,
    boulderId: '',
    type: t.type,
    createdAt: t.date,
    gymId: `import:${t.gymName.toLowerCase()}`,
    gymName: t.gymName + IMPORTED_SUFFIX,
    sectorId: '',
    sectorName: t.sectorName || '',
    gradeScale: IMPORT_SCALE(t.colorName),
    fontGrade: t.fontGrade,
  }));
}

/** Pyramide um importierte Ticks ergänzen, schwerster Grad oben (wie in «Ich»). */
export function mergePyramid(pyramid: GradeDistributionItem[], ticks: ImportedTick[]): GradeDistributionItem[] {
  if (ticks.length === 0) return pyramid;
  const map = new Map<string, GradeDistributionItem>();
  for (const p of pyramid) map.set(p.fontGrade || p.gradeScale.id, { ...p });
  for (const t of ticks) {
    const key = t.fontGrade;
    const cur = map.get(key) || { fontGrade: key, gradeScale: IMPORT_SCALE(), flashCount: 0, topCount: 0, totalCount: 0 };
    if (t.type === 'flash') cur.flashCount++;
    else cur.topCount++;
    cur.totalCount++;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => getFontGradeIndex(b.fontGrade || '') - getFontGradeIndex(a.fontGrade || ''));
}
