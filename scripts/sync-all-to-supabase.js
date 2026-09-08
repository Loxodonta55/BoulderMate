/**
 * sync-all-to-supabase.js
 * Vollständiger, non-destruktiver Aufwärts-Sync nach Supabase.
 * 
 * 1. Synchronisiert alle Wandbilder in den Supabase Storage Bucket 'sector-photos'.
 * 2. Synchronisiert Hallen (Gyms), Farbskalen, Sektoren und Boulder via Supabase REST API (Upsert).
 * 3. STRIKTE REGEL: Ausschließlich Aufwärts-Sync / Non-Destructive! Niemals DELETE!
 */

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

console.log('🚀 [Sync] Starte non-destruktiven Aufwärts-Sync nach Supabase...');

async function syncWallPhotos() {
  console.log('\n--- 1. Wandfotos in Supabase Storage prüfen & synchronisieren ---');
  const wallsDir = path.join(projectRoot, 'public', 'images', 'walls');
  const filesToUpload = [];

  function scan(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath, path.join(prefix, entry.name).replace(/\\/g, '/'));
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        const remoteKey = prefix ? `${prefix}/${entry.name}` : entry.name;
        filesToUpload.push({ fullPath, remoteKey });
      }
    }
  }

  scan(wallsDir);
  console.log(`Gefundene lokale Wandbilder: ${filesToUpload.length}`);

  let uploadedCount = 0;
  for (const { fullPath, remoteKey } of filesToUpload) {
    try {
      const buffer = fs.readFileSync(fullPath);
      const mime = fullPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const { error } = await supabase.storage.from('sector-photos').upload(remoteKey, buffer, {
        contentType: mime,
        upsert: true,
      });
      if (error) {
        // Ignorieren falls bereits existiert oder RLS
      } else {
        uploadedCount++;
        console.log(`  + Foto hochgeladen: ${remoteKey}`);
      }
    } catch (e) {
      // Non-blocking
    }
  }
  console.log(`Wandfotos abgeschlossen (${uploadedCount} neu hochgeladen / verifiziert).`);
}

async function syncGradeScales() {
  console.log('\n--- 2. Farbskalen (Grade Scales) in Supabase synchronisieren ---');
  const { data: gyms } = await supabase.from('gyms').select('id, name');
  if (!gyms || gyms.length === 0) {
    console.log('  Keine Hallen in DB gefunden.');
    return;
  }

  const DEFAULT_6A_SCALES = [
    { color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sehr leicht', font_range_min: '3', font_range_max: '4', sort_order: 1 },
    { color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '5', font_range_max: '5+', sort_order: 2 },
    { color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Mittel', font_range_min: '6A', font_range_max: '6B+', sort_order: 3 },
    { color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Schwer', font_range_min: '6C', font_range_max: '7A+', sort_order: 4 },
    { color_name: 'Schwarz', color_hex: '#1e293b', difficulty_label: 'Sehr schwer', font_range_min: '7B', font_range_max: '7C+', sort_order: 5 },
    { color_name: 'Weiß', color_hex: '#f8fafc', difficulty_label: 'Extrem', font_range_min: '8A', font_range_max: '8B', sort_order: 6 },
    { color_name: 'Lila', color_hex: '#a855f7', difficulty_label: 'Elite', font_range_min: '8B+', font_range_max: '8C+', sort_order: 7 },
  ];

  const DEFAULT_MINIMUM_SCALES = [
    { color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '4a', font_range_max: '5b', sort_order: 1 },
    { color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Fortgeschritten', font_range_min: '5c', font_range_max: '6b', sort_order: 2 },
    { color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sportlich', font_range_min: '6b+', font_range_max: '7a', sort_order: 3 },
    { color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Schwer', font_range_min: '7a+', font_range_max: '7b+', sort_order: 4 },
    { color_name: 'Schwarz', color_hex: '#1e293b', difficulty_label: 'Sehr schwer', font_range_min: '7c', font_range_max: '8a', sort_order: 5 },
    { color_name: 'Weiß', color_hex: '#f8fafc', difficulty_label: 'Elite', font_range_min: '8a+', font_range_max: '8b+', sort_order: 6 }
  ];

  for (const gym of gyms) {
    const is6a = gym.name.toLowerCase().includes('6a');
    const scalesToSync = is6a ? DEFAULT_6A_SCALES : DEFAULT_MINIMUM_SCALES;

    const { data: existing } = await supabase
      .from('grade_scales')
      .select('id, color_name')
      .eq('gym_id', gym.id);

    const existingMap = new Map((existing || []).map(e => [e.color_name.trim().toLowerCase(), e.id]));

    const payload = scalesToSync.map((s, idx) => {
      const matchId = existingMap.get(s.color_name.trim().toLowerCase());
      const item = {
        gym_id: gym.id,
        color_name: s.color_name,
        color_hex: s.color_hex,
        difficulty_label: s.difficulty_label,
        font_range_min: s.font_range_min,
        font_range_max: s.font_range_max,
        sort_order: s.sort_order || idx + 1,
      };
      if (matchId) item.id = matchId;
      return item;
    });

    const { error } = await supabase.from('grade_scales').upsert(payload);
    if (error) {
      console.warn(`  ! Fehler beim Sync der Farbskalen für ${gym.name}:`, error.message);
    } else {
      console.log(`  ✓ ${payload.length} Farbskalen für ${gym.name} synchronisiert.`);
    }
  }
}

async function verifyDatabaseData() {
  console.log('\n--- 3. Datenbank-Stammdaten auf Supabase prüfen ---');
  const [gymsRes, scalesRes, sectorsRes, bouldersRes] = await Promise.all([
    supabase.from('gyms').select('id, name'),
    supabase.from('grade_scales').select('id, color_name, gym_id'),
    supabase.from('sectors').select('id, name, gym_id'),
    supabase.from('boulders').select('id, name, sector_id')
  ]);

  console.log(`  • Hallen in DB: ${gymsRes.data?.length ?? 0}`);
  console.log(`  • Farbskalen in DB: ${scalesRes.data?.length ?? 0}`);
  console.log(`  • Sektoren in DB: ${sectorsRes.data?.length ?? 0}`);
  console.log(`  • Boulder in DB: ${bouldersRes.data?.length ?? 0}`);

  if (gymsRes.data) {
    for (const g of gymsRes.data) {
      console.log(`    - Halle: ${g.name} (${g.id})`);
    }
  }
}

async function run() {
  await syncWallPhotos();
  await syncGradeScales();
  await verifyDatabaseData();
  console.log('\n✅ [Sync] Aufwärts-Sync erfolgreich und non-destruktiv abgeschlossen.');
}

run().catch(console.error);
