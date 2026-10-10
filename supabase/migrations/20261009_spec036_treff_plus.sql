-- SPEC-036 · Treff+: jede Woche wiederholen, «Anfänger willkommen», «Mit Kind», Termine der Halle
-- Voraussetzung: 20261009_spec028_treff.sql ist eingespielt.
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.

-- Teil 1: neue Spalten
ALTER TABLE public.treff_entries
  ADD COLUMN IF NOT EXISTS repeat_weekly     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beginners_welcome BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS with_kids         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gym_event      BOOLEAN NOT NULL DEFAULT false;

-- Teil 2: Admin der Halle?
CREATE OR REPLACE FUNCTION public.treff_is_gym_admin(gym UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.treff_is_platform_admin()
      OR EXISTS (SELECT 1 FROM public.gym_members m WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.treff_is_gym_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.treff_is_gym_admin(UUID) TO authenticated;

-- Teil 3: Eintragen – Grenze 5 offene persönliche Einträge, Hallen-Termine nur für Admins der Halle
DROP POLICY IF EXISTS "treff_entries insert" ON public.treff_entries;
CREATE POLICY "treff_entries insert" ON public.treff_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND ends_at > now()
    AND starts_at < now() + interval '15 days'
    AND EXISTS (
      SELECT 1 FROM public.treff_settings s
      WHERE s.user_id = auth.uid() AND s.age_confirmed AND s.consent_at IS NOT NULL AND NOT s.banned
    )
    AND EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = gym_id AND g.treff_enabled)
    AND (NOT is_gym_event OR public.treff_is_gym_admin(gym_id))
    AND (
      is_gym_event
      OR (SELECT count(*) FROM public.treff_entries e
          WHERE e.user_id = auth.uid() AND e.ends_at > now() AND NOT e.is_gym_event) < 5
    )
  );

-- Teil 4: «Wiederholung beenden» – nur eigene Einträge, nur diese eine Spalte
DROP POLICY IF EXISTS "treff_entries update own" ON public.treff_entries;
CREATE POLICY "treff_entries update own" ON public.treff_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT UPDATE (repeat_weekly) ON public.treff_entries TO authenticated;

-- Teil 5: Gast-Ansicht – Markierungen, und nur bei Hallen-Terminen die Notiz
CREATE OR REPLACE VIEW public.treff_entries_public AS
  SELECT id, gym_id, starts_at, ends_at, grade_min, grade_max,
         beginners_welcome, with_kids, is_gym_event,
         CASE WHEN is_gym_event THEN note END AS note
  FROM public.treff_entries
  WHERE ends_at > now();
GRANT SELECT ON public.treff_entries_public TO anon, authenticated;

-- Kontrolle:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'treff_entries_public';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'treff_entries' ORDER BY 1;
