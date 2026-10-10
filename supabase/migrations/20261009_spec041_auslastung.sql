-- SPEC-041 · Wie voll ist die Halle? Meldung der Halle (Ruhig / Normal / Viel los), gilt 90 Minuten.
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.
-- Schreiben dürfen nur Admins der Halle (Regel «bm gyms update» aus SPEC-034).

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS crowd_level TEXT CHECK (crowd_level IS NULL OR crowd_level IN ('ruhig', 'normal', 'voll')),
  ADD COLUMN IF NOT EXISTS crowd_updated_at TIMESTAMPTZ;

-- Kontrolle:
-- SELECT name, crowd_level, crowd_updated_at FROM public.gyms ORDER BY name;
