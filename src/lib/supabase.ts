/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vuladpswvflfwwgdjejr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bGFkcHN3dmZsZnd3Z2RqZWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NjExMzcsImV4cCI6MjEwNDIzNzEzN30.55_ouHyzW_ALlTc45HJCHQgEn50T0xXm1d5jTTUPr1o';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
