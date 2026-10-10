-- SPEC-034 · Datenbank-Schreibrechte: nur Berechtigte ändern Hallen, Wände und Boulder
--
-- So einspielen (Supabase → SQL Editor):
--   1. Zuerst die VORHER-ABFRAGE unten (Schritt 0) allein ausführen.
--      Kommen Zeilen zurück, diese Personen zuerst im Admin-Tab «Team» als Schrauber eintragen.
--   2. Dann diese ganze Datei ausführen. Sie läuft in einer Transaktion und darf mehrfach laufen.
--   3. Danach die NACHHER-ABFRAGE (ganz unten) ausführen und kurz in der App testen:
--      als Schrauber einen Boulder anlegen, als Kletterer einen Top loggen.
--   Geht in der Halle etwas nicht mehr: 20261009_spec034_notfall_zurueck.sql ausführen.
--
-- Lesen bleibt wie bisher offen. Nur Schreiben wird eingeschränkt.

-- ---------------------------------------------------------------------------
-- Schritt 0 · VORHER-ABFRAGE (nur lesen, einzeln ausführen)
-- Wer hat in den letzten 60 Tagen Boulder geschraubt, hat aber in dieser Halle
-- keine Rolle admin/setter und ist kein Plattform-Admin?
-- ---------------------------------------------------------------------------
-- SELECT DISTINCT s.gym_id, g.name AS halle, b.setter_id, p.nickname
-- FROM public.boulders b
-- JOIN public.sectors s ON s.id = b.sector_id
-- JOIN public.gyms g ON g.id = s.gym_id
-- LEFT JOIN public.user_profiles p ON p.id = b.setter_id
-- WHERE b.setter_id IS NOT NULL
--   AND b.created_at > now() - interval '60 days'
--   AND NOT COALESCE(p.is_platform_admin, false)
--   AND NOT EXISTS (
--     SELECT 1 FROM public.gym_members m
--     WHERE m.gym_id = s.gym_id AND m.user_id = b.setter_id AND m.role IN ('admin', 'setter')
--   );

BEGIN;

-- ---------------------------------------------------------------------------
-- Teil 1 · Prüf-Funktionen (F2)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bm_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM public.user_profiles WHERE id = auth.uid()), false);
$$;

-- Plattform-Admin, Admin oder Schrauber dieser Halle
CREATE OR REPLACE FUNCTION public.bm_can_edit_gym(gym UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.bm_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.gym_members m
      WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role IN ('admin', 'setter')
    )
  );
$$;

-- Plattform-Admin oder Admin dieser Halle
CREATE OR REPLACE FUNCTION public.bm_is_gym_admin(gym UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.bm_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.gym_members m
      WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role = 'admin'
    )
  );
$$;

-- Halle eines Sektors (für Boulder)
CREATE OR REPLACE FUNCTION public.bm_sector_gym(sector UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM public.sectors WHERE id = sector;
$$;

REVOKE ALL ON FUNCTION public.bm_is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_can_edit_gym(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_is_gym_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_sector_gym(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bm_is_platform_admin(), public.bm_can_edit_gym(UUID),
  public.bm_is_gym_admin(UUID), public.bm_sector_gym(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Teil 2 · Alle bisherigen Schreib-Regeln entfernen (F3)
-- Prod hat Regeln, die nicht in schema.sql stehen: deshalb selbst suchen statt Namen raten.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('gyms', 'sectors', 'grade_scales', 'boulders', 'gym_members', 'ascents', 'ratings')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Teil 3 · Lesen bleibt offen (eine entfernte «ALL»-Regel hat evtl. auch Lesen erlaubt)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['gyms', 'sectors', 'grade_scales', 'boulders', 'gym_members', 'ascents', 'ratings']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "bm read %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "bm read %s" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Teil 4 · Neue Schreib-Regeln (F1)
-- ---------------------------------------------------------------------------

-- Hallen: anlegen/löschen nur Plattform-Admin, ändern auch Admin der Halle
CREATE POLICY "bm gyms insert" ON public.gyms FOR INSERT TO authenticated
  WITH CHECK (public.bm_is_platform_admin());
CREATE POLICY "bm gyms update" ON public.gyms FOR UPDATE TO authenticated
  USING (public.bm_is_gym_admin(id)) WITH CHECK (public.bm_is_gym_admin(id));
CREATE POLICY "bm gyms delete" ON public.gyms FOR DELETE TO authenticated
  USING (public.bm_is_platform_admin());

-- Sektoren und Farben: Admin oder Schrauber der Halle
CREATE POLICY "bm sectors insert" ON public.sectors FOR INSERT TO authenticated
  WITH CHECK (public.bm_can_edit_gym(gym_id));
CREATE POLICY "bm sectors update" ON public.sectors FOR UPDATE TO authenticated
  USING (public.bm_can_edit_gym(gym_id)) WITH CHECK (public.bm_can_edit_gym(gym_id));
CREATE POLICY "bm sectors delete" ON public.sectors FOR DELETE TO authenticated
  USING (public.bm_can_edit_gym(gym_id));

CREATE POLICY "bm grade_scales insert" ON public.grade_scales FOR INSERT TO authenticated
  WITH CHECK (public.bm_can_edit_gym(gym_id));
CREATE POLICY "bm grade_scales update" ON public.grade_scales FOR UPDATE TO authenticated
  USING (public.bm_can_edit_gym(gym_id)) WITH CHECK (public.bm_can_edit_gym(gym_id));
CREATE POLICY "bm grade_scales delete" ON public.grade_scales FOR DELETE TO authenticated
  USING (public.bm_can_edit_gym(gym_id));

-- Boulder: Admin oder Schrauber der Halle, zu der der Sektor gehört
CREATE POLICY "bm boulders insert" ON public.boulders FOR INSERT TO authenticated
  WITH CHECK (public.bm_can_edit_gym(public.bm_sector_gym(sector_id)));
CREATE POLICY "bm boulders update" ON public.boulders FOR UPDATE TO authenticated
  USING (public.bm_can_edit_gym(public.bm_sector_gym(sector_id)))
  WITH CHECK (public.bm_can_edit_gym(public.bm_sector_gym(sector_id)));
CREATE POLICY "bm boulders delete" ON public.boulders FOR DELETE TO authenticated
  USING (public.bm_can_edit_gym(public.bm_sector_gym(sector_id)));

-- Rollen: nur Admin der Halle (oder Plattform-Admin)
CREATE POLICY "bm gym_members insert" ON public.gym_members FOR INSERT TO authenticated
  WITH CHECK (public.bm_is_gym_admin(gym_id));
CREATE POLICY "bm gym_members update" ON public.gym_members FOR UPDATE TO authenticated
  USING (public.bm_is_gym_admin(gym_id)) WITH CHECK (public.bm_is_gym_admin(gym_id));
CREATE POLICY "bm gym_members delete" ON public.gym_members FOR DELETE TO authenticated
  USING (public.bm_is_gym_admin(gym_id));

-- Begehungen und Bewertungen: nur eigene Zeilen
CREATE POLICY "bm ascents insert" ON public.ascents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "bm ascents update" ON public.ascents FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "bm ascents delete" ON public.ascents FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "bm ratings insert" ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "bm ratings update" ON public.ratings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "bm ratings delete" ON public.ratings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Teil 5 · Wandfotos: Hochladen nur noch angemeldet
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public upload for sector photos" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "bm sector photos upload" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "bm sector photos update" ON storage.objects';
    EXECUTE 'CREATE POLICY "bm sector photos upload" ON storage.objects FOR INSERT TO authenticated
             WITH CHECK (bucket_id = ''sector-photos'')';
    -- Hochladen mit «upsert» braucht auch Ändern
    EXECUTE 'CREATE POLICY "bm sector photos update" ON storage.objects FOR UPDATE TO authenticated
             USING (bucket_id = ''sector-photos'') WITH CHECK (bucket_id = ''sector-photos'')';
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- NACHHER-ABFRAGE (einzeln ausführen): Es darf keine Schreib-Regel mit «true» mehr geben.
-- ---------------------------------------------------------------------------
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname IN ('public', 'storage')
--   AND tablename IN ('gyms', 'sectors', 'grade_scales', 'boulders', 'gym_members', 'ascents', 'ratings', 'objects')
-- ORDER BY tablename, cmd, policyname;
