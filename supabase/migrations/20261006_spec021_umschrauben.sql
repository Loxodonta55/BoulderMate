-- SPEC-021: Umschrauben im Schrauber-Studio
-- Einmalig im Supabase SQL-Editor ausführen. Rein additiv, keine Daten werden verändert.

-- Umbau-Status pro Wand
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS draft_photo_url TEXT;
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuild_started_at TIMESTAMPTZ;
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuilt_at TIMESTAMPTZ;

-- Foto-Historie: Wandfoto, auf dem eine abgeschraubte Route hing
ALTER TABLE public.boulders ADD COLUMN IF NOT EXISTS wall_photo_url TEXT;

-- Ältere archivierte Routen bleiben ohne Foto (welches Foto damals hing, ist unbekannt).
