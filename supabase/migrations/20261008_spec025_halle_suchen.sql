-- SPEC-025: Halle suchen – Koordinaten für die Hallen-Karte
-- Einmalig im Supabase SQL-Editor ausführen. Rein additiv, keine Daten werden verändert.
-- Danach setzt der Hallen-Admin den Standort in der Admin-Konsole («Adresse suchen» → «Standort speichern»).

ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gyms_lat_range') THEN
    ALTER TABLE public.gyms ADD CONSTRAINT gyms_lat_range CHECK (lat IS NULL OR lat BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gyms_lng_range') THEN
    ALTER TABLE public.gyms ADD CONSTRAINT gyms_lng_range CHECK (lng IS NULL OR lng BETWEEN -180 AND 180);
  END IF;
END $$;

-- Kontrolle: SELECT name, city, lat, lng FROM public.gyms ORDER BY name;
