/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Uploads a sector wall photo to Supabase Storage bucket 'sector-photos'.
 * If Supabase is not configured, returns the local processed base64 dataUrl.
 */
export async function uploadSectorPhoto(
  file: File | Blob, 
  fileName: string, 
  fallbackDataUrl?: string
): Promise<string> {
  if (!supabase || !isSupabaseConfigured) {
    if (fallbackDataUrl) return fallbackDataUrl;
    throw new Error('Supabase Storage nicht konfiguriert und keine lokale Fallback-URL vorhanden.');
  }

  const cleanFileName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = 'walls/' + cleanFileName;

  const { data, error } = await supabase.storage
    .from('sector-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Fehler beim Upload in Supabase Storage:', error);
    if (fallbackDataUrl) {
      console.warn('Verwende lokalen Fallback fuer Wandfoto');
      return fallbackDataUrl;
    }
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('sector-photos')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
