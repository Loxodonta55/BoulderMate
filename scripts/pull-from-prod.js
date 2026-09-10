import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vuladpswvflfwwgdjejr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGFkcHN3dmZsZnd3Z2RqZWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExMzcsImV4cCI6MjEwNDIzNzEzN30.55_ouHyzW_ALlTc45HJCHQgEn50T0xXm1d5jTTUPr1o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('📡 [Pull] Lade aktuelle Daten von Supabase (PROD)...');

  const [gymsRes, scalesRes, sectorsRes, bouldersRes] = await Promise.all([
    supabase.from('gyms').select('*').order('name'),
    supabase.from('grade_scales').select('*').order('gym_id').order('sort_order'),
    supabase.from('sectors').select('*').order('gym_id').order('sort_order'),
    supabase.from('boulders').select('*').order('created_at', { ascending: false }),
  ]);

  if (scalesRes.error) {
    console.error('❌ Fehler beim Laden der Farbskalen:', scalesRes.error.message);
    process.exit(1);
  }

  const gyms = gymsRes.data || [];
  const rawScales = scalesRes.data || [];
  const sectors = sectorsRes.data || [];
  const boulders = bouldersRes.data || [];

  console.log(`\n✅ Gefunden auf Supabase PROD:`);
  console.log(`  • Hallen: ${gyms.length}`);
  console.log(`  • Farbskalen (raw): ${rawScales.length}`);
  console.log(`  • Sektoren: ${sectors.length}`);
  console.log(`  • Boulder: ${boulders.length}`);

  const dedupedByGym = new Map();
  for (const sc of rawScales) {
    const gymKey = sc.gym_id;
    if (!dedupedByGym.has(gymKey)) {
      dedupedByGym.set(gymKey, new Map());
    }
    const colorKey = sc.color_name.trim().toLowerCase();
    const existing = dedupedByGym.get(gymKey).get(colorKey);
    if (!existing) {
      dedupedByGym.get(gymKey).set(colorKey, sc);
    } else {
      if ((sc.sort_order && sc.sort_order > existing.sort_order) || sc.id === existing.id) {
        dedupedByGym.get(gymKey).set(colorKey, sc);
      }
    }
  }

  console.log('\n--- Aktuelle Farbskalen pro Halle auf Supabase: ---');
  for (const [gymId, scaleMap] of dedupedByGym.entries()) {
    const gymObj = gyms.find(g => g.id === gymId);
    const gymName = gymObj ? gymObj.name : gymId;
    console.log(`\n🏢 ${gymName} (${gymId}):`);
    const sorted = Array.from(scaleMap.values()).sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));
    for (const s of sorted) {
      console.log(`   [${s.sort_order || '-'}] ${s.color_name} (${s.color_hex}) | ${s.difficulty_label} | ${s.font_range_min}-${s.font_range_max} (ID: ${s.id})`);
    }
  }
}

main().catch(err => {
  console.error('Fataler Fehler:', err);
  process.exit(1);
});
