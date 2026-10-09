-- SPEC-028: Treff – «Wer ist da?»
-- Einmalig im Supabase SQL-Editor ausführen (alles markieren → Run).
-- WICHTIG: Erst den App-Code ausliefern (Vercel), dann dieses Skript einspielen.
--          Der neue Code liest user_profiles nur noch mit ausdrücklichen Spalten (Teil 1).
-- Das Skript ist wiederholbar (IF NOT EXISTS / DROP ... IF EXISTS).

-- ===========================================================================
-- Teil 1 (F13): E-Mail-Adressen in user_profiles nicht mehr öffentlich lesbar
-- ===========================================================================
REVOKE SELECT ON public.user_profiles FROM anon, authenticated;
GRANT SELECT (id, nickname, avatar_url, is_platform_admin, created_at, updated_at)
  ON public.user_profiles TO anon, authenticated;

-- ===========================================================================
-- Teil 2: Hilfsfunktionen
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.treff_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM public.user_profiles WHERE id = auth.uid()), false);
$$;

-- ===========================================================================
-- Teil 3: Tabellen
-- ===========================================================================
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS treff_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.treff_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_at    TIMESTAMPTZ,
  age_confirmed BOOLEAN NOT NULL DEFAULT false,
  show_grade    BOOLEAN NOT NULL DEFAULT true,
  hidden        BOOLEAN NOT NULL DEFAULT false,
  banned        BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treff_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id      UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  grade_min   TEXT CHECK (grade_min IS NULL OR char_length(grade_min) <= 4),
  grade_max   TEXT CHECK (grade_max IS NULL OR char_length(grade_max) <= 4),
  boulder_ref TEXT CHECK (boulder_ref IS NULL OR char_length(boulder_ref) <= 80),
  note        TEXT CHECK (note IS NULL OR char_length(note) <= 120),
  nickname    TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 60),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT treff_time_order CHECK (ends_at > starts_at),
  CONSTRAINT treff_max_length CHECK (ends_at - starts_at <= interval '18 hours')
);
CREATE INDEX IF NOT EXISTS treff_entries_gym_time_idx ON public.treff_entries (gym_id, ends_at);
CREATE INDEX IF NOT EXISTS treff_entries_user_idx ON public.treff_entries (user_id);

CREATE TABLE IF NOT EXISTS public.treff_blocks (
  blocker_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_nickname TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT treff_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.treff_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id         UUID,               -- bewusst ohne Fremdschlüssel: Meldung bleibt, auch wenn der Eintrag weg ist
  reported_user_id UUID NOT NULL,
  reason           TEXT NOT NULL CHECK (reason IN ('belaestigung', 'spam', 'unangemessen', 'anderes')),
  snapshot         TEXT NOT NULL CHECK (char_length(snapshot) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled_at       TIMESTAMPTZ
);

-- Ausblenden in eine der beiden Richtungen? (läuft mit Rechten des Besitzers, damit
-- die ausgeblendete Person die Liste der Blockierer nicht lesen muss)
CREATE OR REPLACE FUNCTION public.treff_blocked_between(a UUID, b UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.treff_blocks
    WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a)
  );
$$;

-- ===========================================================================
-- Teil 4: RLS – nichts ist offen, alles hängt an auth.uid()
-- ===========================================================================
ALTER TABLE public.treff_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treff_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treff_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treff_reports  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.treff_settings, public.treff_entries, public.treff_blocks, public.treff_reports FROM anon;

-- Einstellungen: nur selbst; «banned» nur über treff_set_banned()
DROP POLICY IF EXISTS "treff_settings own read" ON public.treff_settings;
CREATE POLICY "treff_settings own read" ON public.treff_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.treff_is_platform_admin());
DROP POLICY IF EXISTS "treff_settings own insert" ON public.treff_settings;
CREATE POLICY "treff_settings own insert" ON public.treff_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "treff_settings own update" ON public.treff_settings;
CREATE POLICY "treff_settings own update" ON public.treff_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
REVOKE INSERT, UPDATE ON public.treff_settings FROM authenticated;
GRANT SELECT ON public.treff_settings TO authenticated;
GRANT INSERT (user_id, consent_at, age_confirmed, show_grade, hidden) ON public.treff_settings TO authenticated;
-- user_id muss dabei sein, weil die App per upsert speichert (Regel oben erzwingt user_id = auth.uid())
GRANT UPDATE (user_id, consent_at, age_confirmed, show_grade, hidden, updated_at) ON public.treff_settings TO authenticated;

-- Einträge lesen: angemeldet, ohne gegenseitig Ausgeblendete
DROP POLICY IF EXISTS "treff_entries read" ON public.treff_entries;
CREATE POLICY "treff_entries read" ON public.treff_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR NOT public.treff_blocked_between(auth.uid(), user_id));

-- Einträge anlegen: nur für sich selbst, mit Häkchen, nicht gesperrt, Halle erlaubt,
-- höchstens 14 Tage im Voraus, höchstens 3 offene Einträge
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
    AND (SELECT count(*) FROM public.treff_entries e WHERE e.user_id = auth.uid() AND e.ends_at > now()) < 3
  );

-- Einträge löschen: eigene, oder Plattform-Admin (Meldungen). Kein Ändern.
DROP POLICY IF EXISTS "treff_entries delete" ON public.treff_entries;
CREATE POLICY "treff_entries delete" ON public.treff_entries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.treff_is_platform_admin());
GRANT SELECT, INSERT, DELETE ON public.treff_entries TO authenticated;

-- Ausblenden: nur eigene Liste
DROP POLICY IF EXISTS "treff_blocks own" ON public.treff_blocks;
CREATE POLICY "treff_blocks own" ON public.treff_blocks
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treff_blocks TO authenticated;

-- Meldungen: jeder Angemeldete darf melden, nur der Plattform-Admin liest und erledigt
DROP POLICY IF EXISTS "treff_reports insert" ON public.treff_reports;
CREATE POLICY "treff_reports insert" ON public.treff_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND handled_at IS NULL);
DROP POLICY IF EXISTS "treff_reports admin read" ON public.treff_reports;
CREATE POLICY "treff_reports admin read" ON public.treff_reports
  FOR SELECT TO authenticated USING (public.treff_is_platform_admin());
DROP POLICY IF EXISTS "treff_reports admin update" ON public.treff_reports;
CREATE POLICY "treff_reports admin update" ON public.treff_reports
  FOR UPDATE TO authenticated USING (public.treff_is_platform_admin()) WITH CHECK (public.treff_is_platform_admin());
GRANT SELECT, INSERT ON public.treff_reports TO authenticated;
GRANT UPDATE (handled_at) ON public.treff_reports TO authenticated;

-- ===========================================================================
-- Teil 5: Gast-Ansicht ohne Personen-Daten (F10)
-- ===========================================================================
CREATE OR REPLACE VIEW public.treff_entries_public AS
  SELECT id, gym_id, starts_at, ends_at, grade_min, grade_max
  FROM public.treff_entries
  WHERE ends_at > now();
GRANT SELECT ON public.treff_entries_public TO anon, authenticated;

-- ===========================================================================
-- Teil 6: Sperren (nur Plattform-Admin) und Aufräumen (F8, F19)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.treff_set_banned(target UUID, value BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.treff_is_platform_admin() THEN
    RAISE EXCEPTION 'Nur Plattform-Admins';
  END IF;
  INSERT INTO public.treff_settings (user_id, banned) VALUES (target, value)
  ON CONFLICT (user_id) DO UPDATE SET banned = EXCLUDED.banned, updated_at = now();
  IF value THEN
    DELETE FROM public.treff_entries WHERE user_id = target;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.treff_set_banned(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.treff_set_banned(UUID, BOOLEAN) TO authenticated;

-- Löscht Einträge 1 Tag nach Ende. Die App ruft das beim Öffnen von Treff auf.
CREATE OR REPLACE FUNCTION public.treff_cleanup()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH d AS (DELETE FROM public.treff_entries WHERE ends_at < now() - interval '1 day' RETURNING 1)
  SELECT count(*)::integer FROM d;
$$;
GRANT EXECUTE ON FUNCTION public.treff_cleanup() TO anon, authenticated;

-- Optional (Database → Extensions → pg_cron einschalten), dann einmal ausführen:
-- SELECT cron.schedule('treff-cleanup', '15 3 * * *', 'SELECT public.treff_cleanup()');

-- ===========================================================================
-- Kontrolle (nach dem Einspielen einzeln ausführen)
-- ===========================================================================
-- 1) Spalten-Rechte: die Zeile für «email» darf für anon NICHT erscheinen
-- SELECT grantee, column_name FROM information_schema.column_privileges
--   WHERE table_name = 'user_profiles' AND grantee IN ('anon', 'authenticated') ORDER BY 1, 2;
-- 2) Gast-Ansicht hat keine Personen-Spalten
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'treff_entries_public';
-- 3) Regeln sind aktiv
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'treff_%' ORDER BY 1, 2;
