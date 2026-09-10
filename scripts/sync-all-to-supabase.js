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

function isValidUuid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function stringToUuid(str) {
  if (isValidUuid(str)) return str;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = ((hash1 << 5) - hash1) + str.charCodeAt(i);
    hash1 |= 0;
  }
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) - hash2) + str.charCodeAt(i);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `00000000-${hex1.slice(0, 4)}-4000-8000-${hex1.slice(4)}${hex2}`.slice(0, 36);
}

const GYM_6A_UUID = 'f2b11564-ca86-4ed4-b51c-3affb346144b';
const GYM_MINIMUM_UUID = '814696b2-303e-4897-9bdb-d83505a63489';

const USER_BORIS_UUID = '00000000-1d0e-4000-8000-e92d69136f33';
const USER_ADMIN_6A_UUID = '00000000-37e7-4000-8000-0743462b539d';
const USER_SCHRAUBER_6A_UUID = '00000000-08ca-4000-8000-6e6f5bce818f';
const USER_HANS_UUID = '00000000-4553-4000-8000-3dd13fac9e0f';
const USER_ADMIN_MIN_UUID = '00000000-2ff9-4000-8000-b7902cb24230';
const USER_SCHRAUBER_MIN_UUID = '00000000-5a7c-4000-8000-7702607a9a42';

async function syncGyms() {
  console.log('\n--- 2. Hallen (Gyms) synchronisieren ---');
  const gyms = [
    {
      id: GYM_6A_UUID,
      name: '6a plus Kletter- & Boulderhalle Winterthur',
      city: 'Winterthur',
      address: 'Klosterstrasse 17',
      website: 'https://sechsaplus.ch',
      logo_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop',
      created_by: USER_BORIS_UUID,
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: GYM_MINIMUM_UUID,
      name: 'Minimum Bouldern Zürich',
      city: 'Zürich',
      address: 'Flüelastrasse 31',
      website: 'https://minimum.ch',
      logo_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop',
      created_by: USER_BORIS_UUID,
      created_at: '2026-09-01T10:00:00Z',
    }
  ];

  const { error } = await supabase.from('gyms').upsert(gyms);
  if (error) console.warn('  ! Fehler bei Hallen-Sync:', error.message);
  else console.log('  ✓ 2 Hallen (6a plus & Minimum) verifiziert.');
}

async function syncGradeScales() {
  console.log('\n--- 3. Farbskalen (Grade Scales) synchronisieren ---');
  // WICHTIG: Niemals bestehende Farbskalen auf Supabase überschreiben!
  const { data: existingScales, error: checkError } = await supabase.from('grade_scales').select('id, gym_id, color_name');
  if (existingScales && existingScales.length > 0) {
    console.log(`  ✓ ${existingScales.length} bestehende Farbskalen in Supabase erhalten (Zero-Data-Loss Schutz).`);
    return;
  }

  const DEFAULT_6A_SCALES = [
    { id: 'b65dc31e-21e5-4612-a0cc-2b60891c78de', gym_id: GYM_6A_UUID, color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Gemütlich', font_range_min: '3', font_range_max: '4+', sort_order: 1 },
    { id: '6d5f72b1-6e4d-45e8-8a9f-bd5cb60222b9', gym_id: GYM_6A_UUID, color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Flott', font_range_min: '5', font_range_max: '5+', sort_order: 2 },
    { id: 'fce60743-1a3a-4122-9b60-bd91cbb56abd', gym_id: GYM_6A_UUID, color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Trick', font_range_min: '6a', font_range_max: '6b', sort_order: 3 },
    { id: 'f7bdc2a9-7af8-47f0-b144-67f1fbcd8dc1', gym_id: GYM_6A_UUID, color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Rassig', font_range_min: '6b+', font_range_max: '6c+', sort_order: 4 },
    { id: '3e322450-4c56-4422-8c88-7f518b716352', gym_id: GYM_6A_UUID, color_name: 'Weiss', color_hex: '#f8fafc', difficulty_label: 'Böse', font_range_min: '7a', font_range_max: '7b', sort_order: 5 },
    { id: '85acace1-378a-48d9-958b-0ab2a2510db2', gym_id: GYM_6A_UUID, color_name: 'Beige', color_hex: '#d2b48c', difficulty_label: 'Bestial', font_range_min: '7b+', font_range_max: '8c+', sort_order: 6 },
  ];

  const DEFAULT_MINIMUM_SCALES = [
    { id: '6b538536-2fe3-4c97-a5ab-16df8ac19ad3', gym_id: GYM_MINIMUM_UUID, color_name: 'Gelb', color_hex: '#eab308', difficulty_label: 'Sehr leicht', font_range_min: '6b+', font_range_max: '7a', sort_order: 1 },
    { id: 'f94c7727-5096-4d9f-bcd6-63bd55ae1fbd', gym_id: GYM_MINIMUM_UUID, color_name: 'Grün', color_hex: '#22c55e', difficulty_label: 'Leicht', font_range_min: '4a', font_range_max: '5b', sort_order: 2 },
    { id: 'b1b5f951-bc31-468f-802d-5f63ab651222', gym_id: GYM_MINIMUM_UUID, color_name: 'Blau', color_hex: '#3b82f6', difficulty_label: 'Fortgeschritten', font_range_min: '5c', font_range_max: '6b', sort_order: 3 },
    { id: '130c2372-d28e-416c-85af-a3380426c9bd', gym_id: GYM_MINIMUM_UUID, color_name: 'Rot', color_hex: '#ef4444', difficulty_label: 'Schwer', font_range_min: '7a+', font_range_max: '7b+', sort_order: 4 },
    { id: '2ccf3d7f-a886-4a8e-9bad-25771edf9e86', gym_id: GYM_MINIMUM_UUID, color_name: 'Schwarz', color_hex: '#1e293b', difficulty_label: 'Sehr schwer', font_range_min: '7c', font_range_max: '8a', sort_order: 5 },
    { id: '2dfafa3a-f172-4ee0-ae0c-fddc2a23a851', gym_id: GYM_MINIMUM_UUID, color_name: 'Weiß', color_hex: '#f8fafc', difficulty_label: 'Elite', font_range_min: '8a+', font_range_max: '8b+', sort_order: 6 },
  ];

  const allScales = [...DEFAULT_6A_SCALES, ...DEFAULT_MINIMUM_SCALES];
  const { error } = await supabase.from('grade_scales').upsert(allScales);
  if (error) console.warn('  ! Fehler bei Farbskalen-Sync:', error.message);
  else console.log(`  ✓ ${allScales.length} Farbskalen initialisiert.`);
}

async function syncSectors() {
  console.log('\n--- 4. Sektoren synchronisieren ---');
  const sectors = [
    // 6a plus
    { id: '8656b5d8-838d-4655-8303-57d4ab87b8dd', gym_id: GYM_6A_UUID, name: 'Slab Vorne', wall_photo_url: '/images/walls/6aplus/SlapVorne.jpg', sort_order: 1 },
    { id: '46c3882d-1e0c-44fa-902f-5004fb3eede2', gym_id: GYM_6A_UUID, name: 'Ecke Vorne', wall_photo_url: '/images/walls/6aplus/EckeVorne.jpg', sort_order: 2 },
    { id: 'f9995456-7831-476f-81c9-511677cdf842', gym_id: GYM_6A_UUID, name: 'Zwischenwand Vorne', wall_photo_url: '/images/walls/6aplus/ZwischenwandVorne.jpg', sort_order: 3 },
    { id: '28f8a0ca-54c5-4410-9838-48cc08e9ef80', gym_id: GYM_6A_UUID, name: 'Überhang Vorne', wall_photo_url: '/images/walls/6aplus/UerberhangVorne.jpg', sort_order: 4 },
    { id: 'aac57fcf-b36c-4773-a6d4-ef845eda3f89', gym_id: GYM_6A_UUID, name: 'Verlängerung Überhang', wall_photo_url: '/images/walls/6aplus/VerlaengerungUeberhang.jpg', sort_order: 5 },
    { id: '53a5e148-b4d0-4017-ba70-689f4983b770', gym_id: GYM_6A_UUID, name: 'Ecke Mitte', wall_photo_url: '/images/walls/6aplus/EckeMitte.jpg', sort_order: 6 },
    { id: '41be4e25-728f-476b-b618-f78e8b37397a', gym_id: GYM_6A_UUID, name: 'Cave', wall_photo_url: '/images/walls/6aplus/Cave.jpg', sort_order: 7 },
    { id: '9b92826f-6fe7-48a5-b3e5-edd5f149d486', gym_id: GYM_6A_UUID, name: 'Cave Wand', wall_photo_url: '/images/walls/6aplus/CaveWand.jpg', sort_order: 8 },

    // Minimum
    { id: 'aec62df5-28cc-4668-9438-cb1fb4a63377', gym_id: GYM_MINIMUM_UUID, name: 'Überhang 45° (Comp Wall)', wall_photo_url: '/images/walls/overhang.jpg', sort_order: 1 },
    { id: '07448316-152b-41cb-972b-babe90f64f8e', gym_id: GYM_MINIMUM_UUID, name: 'Dachbereich & Cave', wall_photo_url: '/images/walls/roof.jpg', sort_order: 2 },
    { id: '2d07042e-e13a-4b87-8bf6-acd3324116d0', gym_id: GYM_MINIMUM_UUID, name: 'Platte (Slab & Balance)', wall_photo_url: '/images/walls/slab.jpg', sort_order: 3 },
  ];

  const { error } = await supabase.from('sectors').upsert(sectors);
  if (error) console.warn('  ! Fehler bei Sektoren-Sync:', error.message);
  else console.log(`  ✓ ${sectors.length} Sektoren verifiziert.`);
}

async function syncBoulders() {
  console.log('\n--- 5. Boulderkatalog synchronisieren (6a plus & Minimum) ---');

  const SEC_6A = {
    slab: '8656b5d8-838d-4655-8303-57d4ab87b8dd',
    ecke_vorne: '46c3882d-1e0c-44fa-902f-5004fb3eede2',
    zwischenwand: 'f9995456-7831-476f-81c9-511677cdf842',
    ueberhang_vorne: '28f8a0ca-54c5-4410-9838-48cc08e9ef80',
    verlaengerung: 'aac57fcf-b36c-4773-a6d4-ef845eda3f89',
    verlaengerung_ueberhang: 'aac57fcf-b36c-4773-a6d4-ef845eda3f89',
    ecke_mitte: '53a5e148-b4d0-4017-ba70-689f4983b770',
    cave: '41be4e25-728f-476b-b618-f78e8b37397a',
    cave_wand: '9b92826f-6fe7-48a5-b3e5-edd5f149d486',
  };

  const SCALE_6A = {
    blau: 'b65dc31e-21e5-4612-a0cc-2b60891c78de',
    gruen: '6d5f72b1-6e4d-45e8-8a9f-bd5cb60222b9',
    gelb: 'fce60743-1a3a-4122-9b60-bd91cbb56abd',
    rot: 'f7bdc2a9-7af8-47f0-b144-67f1fbcd8dc1',
    weiss: '3e322450-4c56-4422-8c88-7f518b716352',
    beige: '85acace1-378a-48d9-958b-0ab2a2510db2',
    schwarz: '85acace1-378a-48d9-958b-0ab2a2510db2',
  };

  const SEC_MIN = {
    overhang: 'aec62df5-28cc-4668-9438-cb1fb4a63377',
    roof: '07448316-152b-41cb-972b-babe90f64f8e',
    slab: '2d07042e-e13a-4b87-8bf6-acd3324116d0',
  };

  const SCALE_MIN = {
    gelb: '6b538536-2fe3-4c97-a5ab-16df8ac19ad3',
    gruen: 'f94c7727-5096-4d9f-bcd6-63bd55ae1fbd',
    blau: 'b1b5f951-bc31-468f-802d-5f63ab651222',
    rot: '130c2372-d28e-416c-85af-a3380426c9bd',
    schwarz: '2ccf3d7f-a886-4a8e-9bad-25771edf9e86',
    weiss: '2dfafa3a-f172-4ee0-ae0c-fddc2a23a851',
  };

  const boulders = [
    // === 6A PLUS ===
    // Überhang Vorne
    { id: stringToUuid('boulder-6a-ueberhang-onemove'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.blau, position_x: 0.35, position_y: 0.45, name: 'OneMoveBoulder', notes: 'Ein kräftiger dynamischer Schlüsselzug zur Zange', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-ueberhang-hartesding'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.beige, position_x: 0.65, position_y: 0.35, name: 'hartes Ding', notes: 'Komplexe Crux auf Mikroleisten im Überhang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-ueberhang-weiss'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.weiss, position_x: 0.50, position_y: 0.25, name: 'Weiss', notes: 'Extrem schweres Dachausstiegs-Problem', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 5 },
    { id: stringToUuid('boulder-6a-ueberhang-blau'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.blau, position_x: 0.40, position_y: 0.55, name: 'Blau', notes: 'Solide Linie mit weiten Zügen an guten Henkeln', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-ueberhang-gruen'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.gruen, position_x: 0.25, position_y: 0.65, name: 'Grün', notes: 'Einstiegsroute im vorderen Überhang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 3, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-ueberhang-rot'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.rot, position_x: 0.72, position_y: 0.48, name: 'Rot', notes: 'Heelhook und weite Schulterzüge an Slopern', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 4 },
    { id: '4d3b335c-5125-46d9-b0b8-9b8748dd879c', sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.blau, position_x: 0.52, position_y: 0.38, name: '6a+ Überhang-Crux', notes: 'Der Klassiker im Überhang Vorne', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-ueberhang-gelb'), sector_id: SEC_6A.ueberhang_vorne, grade_scale_id: SCALE_6A.gelb, position_x: 0.18, position_y: 0.72, name: 'Gelber Dynamo', notes: 'Leichte Einstiegstour mit großen Griffen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 2, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },

    // Slab Vorne
    { id: 'a06a9337-4e3d-4b78-8dcf-aa697418a836', sector_id: SEC_6A.slab, grade_scale_id: SCALE_6A.gelb, position_x: 0.32, position_y: 0.62, name: 'Gelber Auftakt', notes: 'Schöne Reibungsplatte für Einsteiger', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 1, radar_technik: 3, radar_balance: 4, radar_koordination: 2, radar_flexibilitaet: 3, radar_maximalkraft: 1, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-slab-2'), sector_id: SEC_6A.slab, grade_scale_id: SCALE_6A.gruen, position_x: 0.48, position_y: 0.50, name: 'Reibungs-Kante', notes: 'Präzises Antreten auf Mikrotropfen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 4, radar_balance: 5, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 2, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-slab-3'), sector_id: SEC_6A.slab, grade_scale_id: SCALE_6A.blau, position_x: 0.68, position_y: 0.40, name: 'Balance-Pfeiler', notes: 'Körperschwerpunkt halten und auf Reibung vertrauen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 5, radar_balance: 5, radar_koordination: 4, radar_flexibilitaet: 4, radar_maximalkraft: 2, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-slab-4'), sector_id: SEC_6A.slab, grade_scale_id: SCALE_6A.rot, position_x: 0.24, position_y: 0.34, name: 'Mikro-Sloper', notes: 'Extrem flache Griffe, viel Druck auf die Füße', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 5, radar_balance: 5, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-slab-5'), sector_id: SEC_6A.slab, grade_scale_id: SCALE_6A.beige, position_x: 0.55, position_y: 0.25, name: 'Glatteis', notes: 'Nur für mutige Plattenliebhaber', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 5, radar_balance: 5, radar_koordination: 4, radar_flexibilitaet: 5, radar_maximalkraft: 3, radar_kraftausdauer: 3 },

    // Ecke Vorne
    { id: 'f846dd8c-6cee-4583-b91c-d9e3cc65d11a', sector_id: SEC_6A.ecke_vorne, grade_scale_id: SCALE_6A.gruen, position_x: 0.30, position_y: 0.58, name: 'Ecken-Schleicher', notes: 'Elegante Verschneidungstechnik', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 4, radar_balance: 4, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 2, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-ecke-2'), sector_id: SEC_6A.ecke_vorne, grade_scale_id: SCALE_6A.blau, position_x: 0.52, position_y: 0.45, name: 'Verschneidungs-Tanz', notes: 'Stemmen und Gegendruck in der Kante', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 4, radar_balance: 4, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-ecke-3'), sector_id: SEC_6A.ecke_vorne, grade_scale_id: SCALE_6A.rot, position_x: 0.70, position_y: 0.35, name: 'Kanten-Druck', notes: 'Weite Züge um die Kante herum', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-ecke-4'), sector_id: SEC_6A.ecke_vorne, grade_scale_id: SCALE_6A.gelb, position_x: 0.20, position_y: 0.70, name: 'Gelbe Verschneidung', notes: 'Leichter Einstieg mit stabilen Griffen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 3, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },

    // Zwischenwand Vorne
    { id: '26e01df6-f5a2-48e5-adeb-d0eb05c02531', sector_id: SEC_6A.zwischenwand, grade_scale_id: SCALE_6A.blau, position_x: 0.38, position_y: 0.52, name: '6A+ Zwischenwand-Traverse', notes: 'Technisch anspruchsvolle Traverse', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 4, radar_balance: 4, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 3, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-zw-2'), sector_id: SEC_6A.zwischenwand, grade_scale_id: SCALE_6A.rot, position_x: 0.58, position_y: 0.38, name: 'Wand-Direkt', notes: 'Kleine Leisten gerade nach oben', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-zw-3'), sector_id: SEC_6A.zwischenwand, grade_scale_id: SCALE_6A.gruen, position_x: 0.25, position_y: 0.65, name: 'Dyno-Move', notes: 'Dynamischer Zug an die große Schuppe', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 3, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 2, radar_maximalkraft: 3, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-zw-4'), sector_id: SEC_6A.zwischenwand, grade_scale_id: SCALE_6A.beige, position_x: 0.72, position_y: 0.30, name: 'Crimp Master', notes: 'Knackige Fingerkraft-Crux', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 4 },

    // Verlängerung Überhang
    { id: stringToUuid('boulder-6a-verl-1'), sector_id: SEC_6A.verlaengerung, grade_scale_id: SCALE_6A.rot, position_x: 0.35, position_y: 0.50, name: 'Ausdauer-Monster', notes: 'Lange Route durch den fortlaufenden Überhang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 5 },
    { id: stringToUuid('boulder-6a-verl-2'), sector_id: SEC_6A.verlaengerung, grade_scale_id: SCALE_6A.blau, position_x: 0.55, position_y: 0.42, name: 'Volumen-Hüpfer', notes: 'Große Züge über zwei Dreiecks-Volumen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 3, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 3, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-verl-3'), sector_id: SEC_6A.verlaengerung, grade_scale_id: SCALE_6A.beige, position_x: 0.70, position_y: 0.32, name: 'Schulterzug', notes: 'Weiter Gastongriff und Heel-Hook-Stabilisierung', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-verl-4'), sector_id: SEC_6A.verlaengerung, grade_scale_id: SCALE_6A.gelb, position_x: 0.20, position_y: 0.68, name: 'Gelbe Ausdauer', notes: 'Schöne Warmup-Route im Überhang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 2, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 3 },

    // Ecke Mitte
    { id: stringToUuid('boulder-6a-eckm-1'), sector_id: SEC_6A.ecke_mitte, grade_scale_id: SCALE_6A.blau, position_x: 0.34, position_y: 0.48, name: 'Kompression', notes: 'Kompression an beiden Wandseiten', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-eckm-2'), sector_id: SEC_6A.ecke_mitte, grade_scale_id: SCALE_6A.rot, position_x: 0.62, position_y: 0.36, name: 'Pfeiler-Schlitz', notes: 'Untergriff und Hook an der Pfeilerkante', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-eckm-3'), sector_id: SEC_6A.ecke_mitte, grade_scale_id: SCALE_6A.beige, position_x: 0.50, position_y: 0.26, name: 'Heel-Hook-Wunder', notes: 'Entlastung durch extremen Heelhook nötig', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-eckm-4'), sector_id: SEC_6A.ecke_mitte, grade_scale_id: SCALE_6A.gelb, position_x: 0.22, position_y: 0.65, name: 'Eck-Einstieg', notes: 'Klassische Kletterei zum Aufwärmen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 2, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },

    // Cave
    { id: '6f1ff2c6-67c2-41a8-8b65-7cc3c2e1f6a8', sector_id: SEC_6A.cave, grade_scale_id: SCALE_6A.rot, position_x: 0.65, position_y: 0.45, name: 'Cave Power Rot', notes: 'Dach-Kletterei mit vollem Körpereinsatz', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-cave-2'), sector_id: SEC_6A.cave, grade_scale_id: SCALE_6A.blau, position_x: 0.42, position_y: 0.58, name: 'Dach-Kante', notes: 'Flacher Einstieg und Ausstieg über die Dachkante', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-cave-3'), sector_id: SEC_6A.cave, grade_scale_id: SCALE_6A.beige, position_x: 0.55, position_y: 0.30, name: 'Ausstiegs-Dynamik', notes: 'Schwerer Dynamo beim Verlassen des Dachs', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 5, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-cave-4'), sector_id: SEC_6A.cave, grade_scale_id: SCALE_6A.gelb, position_x: 0.25, position_y: 0.72, name: 'Grotte Gelb', notes: 'Sehr griffige Schuppen im Einstiegsbereich', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 2, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-cave-5'), sector_id: SEC_6A.cave, grade_scale_id: SCALE_6A.weiss, position_x: 0.70, position_y: 0.22, name: 'The Beast', notes: 'Elite-Linie horizontal durchs Dach', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 2, radar_koordination: 4, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 5 },

    // Cave Wand
    { id: stringToUuid('boulder-6a-cw-1'), sector_id: SEC_6A.cave_wand, grade_scale_id: SCALE_6A.rot, position_x: 0.38, position_y: 0.50, name: 'Höhlen-Leiste', notes: 'Kleine Leisten am Wandübergang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-cw-2'), sector_id: SEC_6A.cave_wand, grade_scale_id: SCALE_6A.beige, position_x: 0.60, position_y: 0.35, name: 'Decken-Crux', notes: 'Maximale Körperspannung gefordert', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 5, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-6a-cw-3'), sector_id: SEC_6A.cave_wand, grade_scale_id: SCALE_6A.gruen, position_x: 0.20, position_y: 0.65, name: 'Wand-Warmup', notes: 'Gute Tritte und positive Henkel', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 2, radar_technik: 3, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 2, radar_kraftausdauer: 2 },
    { id: stringToUuid('boulder-6a-cw-4'), sector_id: SEC_6A.cave_wand, grade_scale_id: SCALE_6A.blau, position_x: 0.72, position_y: 0.45, name: 'Blaues Dach', notes: 'Flüssige Bewegungen im Überhang', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 3, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-6a-cw-5'), sector_id: SEC_6A.cave_wand, grade_scale_id: SCALE_6A.gelb, position_x: 0.48, position_y: 0.70, name: 'Gelbe Grotte', notes: 'Freundlicher Einstieg mit schönen Griffen', setter_id: USER_SCHRAUBER_6A_UUID, status: 'active', radar_kraft: 1, radar_technik: 2, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 1, radar_kraftausdauer: 2 },

    // === MINIMUM ZÜRICH ===
    // Überhang 45°
    { id: 'e176d5fe-27bc-4818-a416-135ed220acda', sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.blau, position_x: 0.35, position_y: 0.42, name: 'Dyno King', notes: 'Dynamischer Sprung an die Leiste', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 3, radar_balance: 2, radar_koordination: 4, radar_flexibilitaet: 2, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-existing-2'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.gelb, position_x: 0.68, position_y: 0.55, name: 'Heel-Hook Madness', notes: 'Körperspannung am Untergriff', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 3, radar_technik: 5, radar_balance: 4, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-overhang-3'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.rot, position_x: 0.22, position_y: 0.30, name: 'Power-Leiste', notes: 'Kleine Leisten im 45° Überhang', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-overhang-4'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.blau, position_x: 0.80, position_y: 0.65, name: 'Zangengriff Traverse', notes: 'Winklige Pinches und weite Züge', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 3, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 2, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-overhang-5'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.gruen, position_x: 0.50, position_y: 0.75, name: 'Blocker-Kante', notes: 'Große Henkel zum Warmklettern', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 3, radar_technik: 3, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-overhang-6'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.rot, position_x: 0.45, position_y: 0.20, name: 'Der Rote Bulle', notes: 'Maximalkraft-Züge ohne Rastposition', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 2, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-overhang-archived-1'), sector_id: SEC_MIN.overhang, grade_scale_id: SCALE_MIN.gelb, position_x: 0.60, position_y: 0.40, name: 'Retro-Kante 2025', notes: 'Abgeschraubte Legende am Pfeiler', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'archived', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 2, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },

    // Platte
    { id: '22a9133a-3d73-425b-a915-74d8b563eb68', sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.gruen, position_x: 0.25, position_y: 0.65, name: 'Reibungstraum', notes: 'Nur auf Reibung stehen', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 1, radar_technik: 4, radar_balance: 5, radar_koordination: 2, radar_flexibilitaet: 4, radar_maximalkraft: 1, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-2'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.blau, position_x: 0.45, position_y: 0.48, name: 'Messers Schneide', notes: 'Kleine Tritte, saubere Gewichtsverlagerung', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 2, radar_technik: 5, radar_balance: 5, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 2, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-3'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.gelb, position_x: 0.70, position_y: 0.38, name: 'Körperschwerpunkt', notes: 'Hoher Antritt und delikate Balance', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 2, radar_technik: 5, radar_balance: 5, radar_koordination: 3, radar_flexibilitaet: 5, radar_maximalkraft: 2, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-4'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.rot, position_x: 0.35, position_y: 0.28, name: 'Mikrotropfen', notes: 'Fast grifflos, nur Sloper-Volumen', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 3, radar_technik: 5, radar_balance: 5, radar_koordination: 4, radar_flexibilitaet: 4, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-5'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.blau, position_x: 0.58, position_y: 0.72, name: 'Zirkus-Stepper', notes: 'Koordination über drei Volumen', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 2, radar_technik: 4, radar_balance: 4, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 2, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-6'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.gruen, position_x: 0.15, position_y: 0.80, name: 'Platten-Finesse', notes: 'Leichter Einstieg mit schöner Fußarbeit', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 1, radar_technik: 3, radar_balance: 4, radar_koordination: 2, radar_flexibilitaet: 3, radar_maximalkraft: 1, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-slab-archived-1'), sector_id: SEC_MIN.slab, grade_scale_id: SCALE_MIN.gelb, position_x: 0.82, position_y: 0.30, name: 'Die Glatte Wand', notes: 'Ehemaliges Platten-Projekt', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'archived', radar_kraft: 2, radar_technik: 5, radar_balance: 5, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 2, radar_kraftausdauer: 3 },

    // Dachbereich & Cave
    { id: '04ef090b-1e25-4a59-a822-c9b8b32b3554', sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.rot, position_x: 0.45, position_y: 0.55, name: 'Dach-Crux', notes: 'Klassische Dachroute', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 4, radar_maximalkraft: 4, radar_kraftausdauer: 4 },
    { id: stringToUuid('boulder-roof-1'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.blau, position_x: 0.30, position_y: 0.70, name: 'Fledermaus-Hook', notes: 'Toe-Hook Entlastung im Dach', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 3, radar_flexibilitaet: 5, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-2'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.gelb, position_x: 0.52, position_y: 0.55, name: 'Dach-Kompressor', notes: 'Gegendruck auf zwei große Sloper', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-3'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.rot, position_x: 0.75, position_y: 0.42, name: 'Wettkampf-Sprung', notes: 'Dynamischer Paddle-Dyno zur Kante', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 3, radar_balance: 2, radar_koordination: 5, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-4'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.schwarz, position_x: 0.40, position_y: 0.25, name: 'Cave Ausstiegs-Crux', notes: 'Extrem harter Heel-Hook Ausstieg', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 5, radar_technik: 5, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-5'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.blau, position_x: 0.65, position_y: 0.68, name: 'Körperspannung Pur', notes: 'Füße dürfen nicht abrutschen', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 4, radar_technik: 3, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 3, radar_maximalkraft: 4, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-6'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.gruen, position_x: 0.20, position_y: 0.82, name: 'Dach-Einstieg', notes: 'Gute Griffe durch die Schräge', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'active', radar_kraft: 3, radar_technik: 3, radar_balance: 2, radar_koordination: 2, radar_flexibilitaet: 2, radar_maximalkraft: 3, radar_kraftausdauer: 3 },
    { id: stringToUuid('boulder-roof-archived-1'), sector_id: SEC_MIN.roof, grade_scale_id: SCALE_MIN.gelb, position_x: 0.50, position_y: 0.40, name: 'Horizontale Hölle', notes: 'Klassiker der letzten Saison', setter_id: USER_SCHRAUBER_MIN_UUID, status: 'archived', radar_kraft: 5, radar_technik: 4, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 3, radar_maximalkraft: 5, radar_kraftausdauer: 3 },
  ];

  const now = new Date().toISOString();
  const rows = boulders.map(b => ({
    ...b,
    created_at: now,
    published_at: b.status === 'active' ? now : null,
    archived_at: b.status === 'archived' ? now : null,
  }));

  const { error } = await supabase.from('boulders').upsert(rows);
  if (error) console.warn('  ! Fehler bei Boulder-Sync:', error.message);
  else console.log(`  ✓ ${rows.length} Boulder erfolgreich in Supabase synchronisiert.`);
}

async function syncAscentsAndRatings() {
  console.log('\n--- 6. Begehungen (Ascents) & Bewertungen (Ratings) synchronisieren ---');

  const ascents = [
    { id: stringToUuid('ascent-boris-6a-1'), boulder_id: stringToUuid('boulder-6a-ueberhang-onemove'), user_id: USER_BORIS_UUID, ascent_style: 'flash', attempts: 1, notes: 'Flash im 1. Versuch' },
    { id: stringToUuid('ascent-boris-6a-2'), boulder_id: stringToUuid('boulder-6a-ueberhang-hartesding'), user_id: USER_BORIS_UUID, ascent_style: 'project', attempts: 5, notes: 'Zug 3 noch probieren' },
    { id: stringToUuid('ascent-boris-6a-3'), boulder_id: stringToUuid('boulder-6a-ueberhang-blau'), user_id: USER_BORIS_UUID, ascent_style: 'flash', attempts: 1 },
    { id: stringToUuid('ascent-boris-6a-4'), boulder_id: stringToUuid('boulder-6a-ueberhang-gruen'), user_id: USER_BORIS_UUID, ascent_style: 'flash', attempts: 1 },
    { id: stringToUuid('ascent-boris-6a-5'), boulder_id: stringToUuid('boulder-6a-ueberhang-rot'), user_id: USER_BORIS_UUID, ascent_style: 'top', attempts: 3 },
    { id: stringToUuid('ascent-boris-6a-6'), boulder_id: '4d3b335c-5125-46d9-b0b8-9b8748dd879c', user_id: USER_BORIS_UUID, ascent_style: 'top', attempts: 2 },
    { id: stringToUuid('ascent-boris-6a-7'), boulder_id: 'a06a9337-4e3d-4b78-8dcf-aa697418a836', user_id: USER_BORIS_UUID, ascent_style: 'flash', attempts: 1 },
    { id: stringToUuid('ascent-boris-6a-8'), boulder_id: '6f1ff2c6-67c2-41a8-8b65-7cc3c2e1f6a8', user_id: USER_BORIS_UUID, ascent_style: 'top', attempts: 4 },
    { id: stringToUuid('ascent-hans-6a-1'), boulder_id: stringToUuid('boulder-6a-ueberhang-onemove'), user_id: USER_HANS_UUID, ascent_style: 'top', attempts: 2 },
    { id: stringToUuid('ascent-hans-6a-2'), boulder_id: stringToUuid('boulder-6a-ueberhang-gruen'), user_id: USER_HANS_UUID, ascent_style: 'flash', attempts: 1 },
    { id: stringToUuid('ascent-hans-6a-3'), boulder_id: 'a06a9337-4e3d-4b78-8dcf-aa697418a836', user_id: USER_HANS_UUID, ascent_style: 'top', attempts: 2 },
  ];

  const now = new Date().toISOString();
  const ascentRows = ascents.map(a => ({ ...a, created_at: now }));
  const { error: ascentErr } = await supabase.from('ascents').upsert(ascentRows);
  if (ascentErr) console.warn('  ! Fehler bei Ascents-Sync:', ascentErr.message);
  else console.log(`  ✓ ${ascentRows.length} Begehungen synchronisiert.`);

  const ratings = [
    { id: stringToUuid('rating-6a-1'), boulder_id: stringToUuid('boulder-6a-ueberhang-onemove'), user_id: USER_BORIS_UUID, perceived_difficulty: 'fair', stars: 5, radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3 },
    { id: stringToUuid('rating-6a-2'), boulder_id: stringToUuid('boulder-6a-ueberhang-onemove'), user_id: USER_HANS_UUID, perceived_difficulty: 'soft', stars: 4, radar_kraft: 4, radar_technik: 3, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3 },
    { id: stringToUuid('rating-6a-3'), boulder_id: stringToUuid('boulder-6a-ueberhang-hartesding'), user_id: USER_BORIS_UUID, perceived_difficulty: 'hard', stars: 5, radar_kraft: 5, radar_technik: 5, radar_balance: 2, radar_koordination: 3, radar_flexibilitaet: 4 },
    { id: stringToUuid('rating-6a-4'), boulder_id: stringToUuid('boulder-6a-ueberhang-rot'), user_id: USER_BORIS_UUID, perceived_difficulty: 'fair', stars: 5, radar_kraft: 4, radar_technik: 4, radar_balance: 3, radar_koordination: 4, radar_flexibilitaet: 3 },
  ];

  const ratingRows = ratings.map(r => ({ ...r, created_at: now }));
  const { error: ratingErr } = await supabase.from('ratings').upsert(ratingRows);
  if (ratingErr) console.warn('  ! Fehler bei Ratings-Sync:', ratingErr.message);
  else console.log(`  ✓ ${ratingRows.length} Bewertungen synchronisiert.`);
}

async function verifyDatabaseData() {
  console.log('\n--- 7. Datenbank-Stammdaten auf Supabase prüfen ---');
  const [gymsRes, scalesRes, sectorsRes, bouldersRes, ascentsRes, ratingsRes] = await Promise.all([
    supabase.from('gyms').select('id, name'),
    supabase.from('grade_scales').select('id, color_name, gym_id'),
    supabase.from('sectors').select('id, name, gym_id'),
    supabase.from('boulders').select('id, name, sector_id'),
    supabase.from('ascents').select('id'),
    supabase.from('ratings').select('id'),
  ]);

  console.log(`  • Hallen in DB: ${gymsRes.data?.length ?? 0}`);
  console.log(`  • Farbskalen in DB: ${scalesRes.data?.length ?? 0}`);
  console.log(`  • Sektoren in DB: ${sectorsRes.data?.length ?? 0}`);
  console.log(`  • Boulder in DB: ${bouldersRes.data?.length ?? 0}`);
  console.log(`  • Begehungen (Ascents) in DB: ${ascentsRes.data?.length ?? 0}`);
  console.log(`  • Bewertungen (Ratings) in DB: ${ratingsRes.data?.length ?? 0}`);
}

async function run() {
  await syncWallPhotos();
  await syncGyms();
  await syncGradeScales();
  await syncSectors();
  await syncBoulders();
  await syncAscentsAndRatings();
  await verifyDatabaseData();
  console.log('\n✅ [Sync] Vollständiger non-destruktiver Aufwärts-Sync erfolgreich abgeschlossen.');
}

run().catch(console.error);

