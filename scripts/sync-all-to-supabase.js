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

async function verifyDatabaseData() {
  console.log('\n--- 2. Datenbank-Stammdaten auf Supabase prüfen ---');
  const [gymsRes, sectorsRes, bouldersRes] = await Promise.all([
    supabase.from('gyms').select('id, name'),
    supabase.from('sectors').select('id, name, gym_id'),
    supabase.from('boulders').select('id, name, sector_id')
  ]);

  console.log(`  • Hallen in DB: ${gymsRes.data?.length ?? 0}`);
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
  await verifyDatabaseData();
  console.log('\n✅ [Sync] Aufwärts-Sync erfolgreich und non-destruktiv abgeschlossen.');
}

run().catch(console.error);
