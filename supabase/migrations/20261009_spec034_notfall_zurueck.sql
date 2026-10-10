-- SPEC-034 · NOTFALL: Schreibrechte wieder öffnen (Zustand vor 20261009_spec034_schreibrechte.sql)
-- Nur ausführen, wenn nach SPEC-034 in der Halle etwas nicht mehr geht
-- (z. B. ein Schrauber kann keine Boulder mehr anlegen). Danach Bescheid geben,
-- dann tragen wir die fehlende Rolle ein und spielen SPEC-034 erneut ein.
--
-- Achtung: Danach darf wieder JEDER mit dem öffentlichen Schlüssel schreiben.

BEGIN;

DO $$
DECLARE
  r record;
BEGIN
  -- Regeln von SPEC-034 entfernen
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('gyms', 'sectors', 'grade_scales', 'boulders', 'gym_members', 'ascents', 'ratings')
      AND policyname LIKE 'bm %'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Offene Regeln wie in schema.sql vor SPEC-034
DROP POLICY IF EXISTS "Allow insert sectors" ON public.sectors;
CREATE POLICY "Allow insert sectors" ON public.sectors FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert boulders" ON public.boulders;
CREATE POLICY "Allow insert boulders" ON public.boulders FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert grade_scales" ON public.grade_scales;
CREATE POLICY "Allow insert grade_scales" ON public.grade_scales FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert gyms" ON public.gyms;
CREATE POLICY "Allow insert gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);
-- Diese drei standen nie in schema.sql; offen für Angemeldete ist der sichere Rückweg
DROP POLICY IF EXISTS "Notfall write gym_members" ON public.gym_members;
CREATE POLICY "Notfall write gym_members" ON public.gym_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Notfall write ascents" ON public.ascents;
CREATE POLICY "Notfall write ascents" ON public.ascents FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Notfall write ratings" ON public.ratings;
CREATE POLICY "Notfall write ratings" ON public.ratings FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.gyms, public.sectors, public.grade_scales, public.boulders TO anon;

DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "bm sector photos upload" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "bm sector photos update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Public upload for sector photos" ON storage.objects';
    EXECUTE 'CREATE POLICY "Public upload for sector photos" ON storage.objects FOR INSERT
             WITH CHECK (bucket_id = ''sector-photos'')';
  END IF;
END $$;

COMMIT;
