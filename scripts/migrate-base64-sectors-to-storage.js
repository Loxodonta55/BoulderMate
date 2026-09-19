import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vuladpswvflfwwgdjejr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGFkcHN3dmZsZnd3Z2RqZWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExMzcsImV4cCI6MjEwNDIzNzEzN30.55_ouHyzW_ALlTc45HJCHQgEn50T0xXm1d5jTTUPr1o';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateBase64Sectors() {
  console.log('--- Migrating base64 wall photos from sectors table to Supabase Storage ---');

  const { data: sectors, error: fetchErr } = await supabase
    .from('sectors')
    .select('id, name, wall_photo_url')
    .order('sort_order', { ascending: true });

  if (fetchErr) {
    console.error('Error fetching sectors:', fetchErr);
    return;
  }

  const base64Sectors = sectors.filter(s => s.wall_photo_url && s.wall_photo_url.startsWith('data:'));
  console.log(`Found ${base64Sectors.length} sectors with base64 images out of ${sectors.length} total.`);

  for (const sector of base64Sectors) {
    console.log(`\nProcessing sector: "${sector.name}" (${sector.id})...`);
    try {
      const arr = sector.wall_photo_url.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
      const buffer = Buffer.from(arr[1], 'base64');
      const remoteKey = `sectors/${sector.id}.${ext}`;

      console.log(`  Uploading ${buffer.length} bytes to sector-photos/${remoteKey} (${mime})...`);
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('sector-photos')
        .upload(remoteKey, buffer, {
          contentType: mime,
          upsert: true,
        });

      if (uploadErr) {
        console.error(`  ❌ Failed upload for sector ${sector.name}:`, uploadErr);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('sector-photos')
        .getPublicUrl(remoteKey);

      const publicUrl = urlData.publicUrl;
      console.log(`  ✅ Uploaded! Public URL: ${publicUrl}`);

      const { error: updateErr } = await supabase
        .from('sectors')
        .update({ wall_photo_url: publicUrl })
        .eq('id', sector.id);

      if (updateErr) {
        console.error(`  ❌ Failed updating sector record:`, updateErr);
      } else {
        console.log(`  ✅ Successfully updated sector "${sector.name}" in DB.`);
      }
    } catch (err) {
      console.error(`  ❌ Exception processing sector ${sector.name}:`, err);
    }
  }

  console.log('\n--- Migration finished! ---');
}

migrateBase64Sectors().catch(console.error);
