-- ============================================================
-- BoulderMate — Supabase Schema & Initial Setup
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SPEC-024: Profilzeile für jeden neuen Nutzer (Google oder E-Mail)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nickname', ''),
      NULLIF(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Kletterer'
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. GYMS
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  lat DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),   -- SPEC-025
  lng DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180), -- SPEC-025
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. GYM MEMBERS (Rollen pro Halle)
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'setter', 'member')),
  appointed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_gym_user_role UNIQUE (gym_id, user_id, role)
);

-- 5. SECTORS (Wände / Bereiche)
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wall_photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_sectors_gym_name UNIQUE (gym_id, name)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sectors_gym_name_lower ON public.sectors (gym_id, lower(trim(name)));

-- 6. GRADE SCALES (Farbsysteme der Halle)
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  difficulty_label TEXT NOT NULL,
  font_range_min TEXT,
  font_range_max TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_grade_scales_gym_color UNIQUE (gym_id, color_name)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_grade_scales_gym_color_lower ON public.grade_scales (gym_id, lower(trim(color_name)));

-- 7. BOULDERS (Routen & Pins)
DO $$
BEGIN
  CREATE TYPE boulder_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.boulders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  grade_scale_id UUID NOT NULL REFERENCES public.grade_scales(id) ON DELETE RESTRICT,
  position_x REAL NOT NULL CHECK (position_x >= 0.0 AND position_x <= 1.0),
  position_y REAL NOT NULL CHECK (position_y >= 0.0 AND position_y <= 1.0),
  name TEXT,
  notes TEXT,
  setter_id UUID REFERENCES auth.users(id),
  status boulder_status NOT NULL DEFAULT 'draft',
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5) DEFAULT 3,
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5) DEFAULT 3,
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5) DEFAULT 3,
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5) DEFAULT 3,
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5) DEFAULT 3,
  font_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- 8. ASCENTS & RATINGS (Logbuch & Bewertungen)
CREATE TABLE IF NOT EXISTS public.ascents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id UUID NOT NULL REFERENCES public.boulders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ascent_style TEXT NOT NULL CHECK (ascent_style IN ('flash', 'onsight', 'top', 'project', 'repeat')),
  attempts INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_boulder_ascent UNIQUE (boulder_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id UUID NOT NULL REFERENCES public.boulders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perceived_difficulty TEXT CHECK (perceived_difficulty IN ('soft', 'fair', 'stiff', 'hard')),
  stars SMALLINT CHECK (stars BETWEEN 1 AND 5),
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5),
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5),
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5),
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5),
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_boulder_rating UNIQUE (boulder_id, user_id)
);

-- 9. STORAGE BUCKET FUER WANDFOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sector-photos', 'sector-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Jeder darf Fotos lesen
DROP POLICY IF EXISTS "Public read for sector photos" ON storage.objects;
CREATE POLICY "Public read for sector photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'sector-photos');

-- Storage Policy: Authentifizierte & Anon Upload (damit es direkt funktioniert)
DROP POLICY IF EXISTS "Public upload for sector photos" ON storage.objects;
CREATE POLICY "Public upload for sector photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sector-photos');

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boulders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ascents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Leserechte fuer alle (Open Access fuer Kletterer)
DROP POLICY IF EXISTS "Public read gyms" ON public.gyms;
CREATE POLICY "Public read gyms" ON public.gyms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sectors" ON public.sectors;
CREATE POLICY "Public read sectors" ON public.sectors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read grade_scales" ON public.grade_scales;
CREATE POLICY "Public read grade_scales" ON public.grade_scales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read boulders" ON public.boulders;
CREATE POLICY "Public read boulders" ON public.boulders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read profiles" ON public.user_profiles;
CREATE POLICY "Public read profiles" ON public.user_profiles FOR SELECT USING (true);

-- SPEC-024: Eigenes Profil ändern (nur Name, Bild, Zeitstempel); Profile legt nur der Trigger an
DROP POLICY IF EXISTS "Own profile update" ON public.user_profiles;
CREATE POLICY "Own profile update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
REVOKE INSERT, UPDATE ON public.user_profiles FROM anon, authenticated;
GRANT UPDATE (nickname, avatar_url, updated_at) ON public.user_profiles TO authenticated;

DROP POLICY IF EXISTS "Public read ascents" ON public.ascents;
CREATE POLICY "Public read ascents" ON public.ascents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ratings" ON public.ratings;
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT USING (true);

-- Schreibrechte (fuer schnellen Start zulaessig fuer authentifizierte Nutzer)
DROP POLICY IF EXISTS "Allow insert sectors" ON public.sectors;
CREATE POLICY "Allow insert sectors" ON public.sectors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert boulders" ON public.boulders;
CREATE POLICY "Allow insert boulders" ON public.boulders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert grade_scales" ON public.grade_scales;
CREATE POLICY "Allow insert grade_scales" ON public.grade_scales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert gyms" ON public.gyms;
CREATE POLICY "Allow insert gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);

-- SPEC-021: Umschrauben (siehe supabase/migrations/20261006_spec021_umschrauben.sql)
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS draft_photo_url TEXT;
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuild_started_at TIMESTAMPTZ;
ALTER TABLE public.sectors ADD COLUMN IF NOT EXISTS rebuilt_at TIMESTAMPTZ;
ALTER TABLE public.boulders ADD COLUMN IF NOT EXISTS wall_photo_url TEXT;

-- SPEC-026: Nutzer-Feedback (siehe supabase/migrations/20261008_spec026_feedback.sql)
-- Einmalig im Supabase SQL-Editor ausführen. Rein additiv, bestehende Daten bleiben unverändert.
-- Lesen: Table Editor → app_feedback (neueste zuerst). Status von Hand auf 'gelesen' / 'erledigt' setzen.

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id          UUID PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID,
  nickname    TEXT,
  email       TEXT,
  contact_ok  BOOLEAN NOT NULL DEFAULT false,
  category    TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'praise')),
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  gym_id      TEXT,
  gym_name    TEXT,
  app_view    TEXT,
  user_agent  TEXT,
  screen      TEXT,
  status      TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu', 'gelesen', 'erledigt')),
  CONSTRAINT app_feedback_email_only_with_consent CHECK (contact_ok OR email IS NULL)
);

CREATE INDEX IF NOT EXISTS app_feedback_created_at_idx ON public.app_feedback (created_at DESC);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Nur Schreiben. Bewusst KEINE Select-/Update-/Delete-Regel: Feedback ist nur im Dashboard lesbar.
DROP POLICY IF EXISTS "Insert app_feedback" ON public.app_feedback;
CREATE POLICY "Insert app_feedback" ON public.app_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'neu');

-- Kontrolle: SELECT created_at, category, nickname, gym_name, message, status FROM public.app_feedback ORDER BY created_at DESC;

-- SPEC-028: Treff – «Wer ist da?» und E-Mail nicht mehr öffentlich lesbar
-- (siehe supabase/migrations/20261009_spec028_treff.sql; erst Code ausliefern, dann einspielen)

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
