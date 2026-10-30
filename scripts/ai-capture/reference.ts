// SPEC-052 F11: Holt Hans' von Hand eingetragene Routen einer Halle als Vergleichsdaten.
// Aufruf (auf Hans' PC, braucht Internet):
//   npx vite-node scripts/ai-capture/reference.ts -- --gym "6a"
// Ergebnis: ai-capture/reference/<halle>/reference.json + Fotos (Ordner ist gitignored).
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { arg, loadEnv, loadPhoto, projectRoot, slug, type ReferenceFile } from './lib';

const RADAR = ['maximalkraft', 'kraftausdauer', 'technik', 'balance', 'koordination', 'flexibilitaet'] as const;

export function slug(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen in .env');
  const supabase = createClient(url, key);
  const gymQuery = (arg('gym', '6a') ?? '6a').toLowerCase();

  const { data: gyms, error: gErr } = await supabase.from('gyms').select('*');
  if (gErr) throw gErr;
  const gym = (gyms ?? []).find(g => g.name.toLowerCase().includes(gymQuery) || g.id === gymQuery);
  if (!gym) throw new Error(`Keine Halle zu «${gymQuery}» gefunden`);

  const [scales, sectors, boulders] = await Promise.all([
    supabase.from('grade_scales').select('*').eq('gym_id', gym.id).order('sort_order'),
    supabase.from('sectors').select('*').eq('gym_id', gym.id).order('sort_order'),
    supabase.from('boulders').select('*').eq('status', 'active'),
  ]);
  for (const r of [scales, sectors, boulders]) if (r.error) throw r.error;

  // Farbskalen gibt es teils doppelt (gleicher Name, mehrere Ids) → je Name eine Farbe
  const palette: ReferenceFile['palette'] = [];
  const canonical = new Map<string, string>();
  for (const s of scales.data ?? []) {
    const nameKey = String(s.color_name).trim().toLowerCase();
    let entry = palette.find(p => p.colorName.trim().toLowerCase() === nameKey);
    if (!entry) {
      entry = { id: s.id, colorName: s.color_name, colorHex: s.color_hex, fontRangeMin: s.font_range_min, fontRangeMax: s.font_range_max, aliasIds: [] };
      palette.push(entry);
    } else entry.aliasIds.push(s.id);
    canonical.set(s.id, entry.id);
  }

  const outDir = path.join(projectRoot, 'ai-capture', 'reference', slug(gym.name));
  fs.mkdirSync(path.join(outDir, 'photos'), { recursive: true });

  const out: ReferenceFile = {
    gym: {
      id: gym.id, name: gym.name,
      // SPEC-052 v5: Einstellungen der Halle (fehlen, solange die Migration nicht eingespielt ist)
      gradeMarker: gym.grade_marker, gradeSymbols: gym.grade_symbols, gradeHint: gym.ai_grade_hint,
      aliases: Object.fromEntries(canonical),
    }, exportedAt: new Date().toISOString(), palette, sectors: [] };
  for (const s of sectors.data ?? []) {
    let photoFile: string | null = null;
    if (s.wall_photo_url) {
      try {
        const buf = await loadPhoto(s.wall_photo_url);
        photoFile = `photos/${slug(s.name)}.jpg`;
        fs.writeFileSync(path.join(outDir, photoFile), buf);
      } catch (e) {
        console.warn(`⚠️  Foto für ${s.name} nicht ladbar: ${(e as Error).message}`);
      }
    }
    const routes = (boulders.data ?? [])
      .filter(b => b.sector_id === s.id)
      .map(b => {
        const gradeScaleId = canonical.get(b.grade_scale_id) ?? b.grade_scale_id;
        const radar: Record<string, number> = {};
        for (const k of RADAR) radar[k] = Number(b[`radar_${k}`] ?? (k === 'maximalkraft' ? b.radar_kraft : null) ?? 3);
        return {
          id: b.id, x: Number(b.position_x), y: Number(b.position_y), gradeScaleId,
          colorName: palette.find(p => p.id === gradeScaleId)?.colorName ?? '?', name: b.name ?? '', radar,
        };
      });
    out.sectors.push({ id: s.id, name: s.name, wallPhotoUrl: s.wall_photo_url, photoFile, routes });
    console.log(`• ${s.name}: ${routes.length} Routen${photoFile ? '' : ' (kein Foto)'}`);
  }

  fs.writeFileSync(path.join(outDir, 'reference.json'), JSON.stringify(out, null, 2));
  console.log(`\n✅ ${path.relative(projectRoot, path.join(outDir, 'reference.json'))}`);
}

main().catch(e => { console.error('❌', e.message ?? e); process.exit(1); });
