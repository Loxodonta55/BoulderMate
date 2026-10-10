-- SPEC-031: Umbau ankündigen («Letzte Chance»)
-- Einmalig im Supabase SQL-Editor ausführen. Rein additiv, keine Daten werden verändert.

-- Datum, an dem der Sektor abgeschraubt werden soll (nur Datum, ohne Uhrzeit)
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuild_planned_for DATE;
