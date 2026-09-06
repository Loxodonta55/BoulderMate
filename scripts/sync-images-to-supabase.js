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

console.log('🚀 Starting non-destructive Upward Data Sync to Supabase...');
console.log('Target URL:', SUPABASE_URL);

async function syncImages() {
  console.log('\n--- 1. Synchronizing Wall Photos to Supabase Storage (sector-photos) ---');
  
  const wallsDir = path.join(projectRoot, 'public', 'images', 'walls');
  const filesToUpload = [];

  function collectFiles(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(fullPath, path.join(prefix, entry.name).replace(/\\/g, '/'));
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        const remoteKey = prefix ? `${prefix}/${entry.name}` : entry.name;
        filesToUpload.push({ fullPath, remoteKey });
      }
    }
  }

  collectFiles(wallsDir);
  console.log(`Found ${filesToUpload.length} local images to verify/upload.`);

  for (const { fullPath, remoteKey } of filesToUpload) {
    try {
      const fileBuffer = fs.readFileSync(fullPath);
      const mimeType = fullPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // Upsert without deleting anything
      const { data, error } = await supabase.storage
        .from('sector-photos')
        .upload(remoteKey, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.warn(`  ⚠️ Upload warning for ${remoteKey}:`, error.message);
      } else {
        console.log(`  ✅ Synced: ${remoteKey}`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to upload ${remoteKey}:`, err);
    }
  }
}

syncImages().then(() => {
  console.log('\nImage sync complete.');
}).catch(console.error);
