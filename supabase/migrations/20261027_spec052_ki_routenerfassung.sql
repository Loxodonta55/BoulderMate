-- SPEC-052 · KI erfasst Routen aus dem Sektorfoto
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.
-- Setzt SPEC-034 voraus (bm_can_edit_gym, bm_is_gym_admin, bm_sector_gym). Wiederholbar.

-- ===========================================================================
-- Teil 0: Hilfsfunktionen aus SPEC-034 (falls noch nicht eingespielt)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.bm_is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM public.user_profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.bm_can_edit_gym(gym UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.bm_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.gym_members m
      WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role IN ('admin', 'setter')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.bm_is_gym_admin(gym UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.bm_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.gym_members m
      WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role = 'admin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.bm_sector_gym(sector UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT gym_id FROM public.sectors WHERE id = sector;
$$;

REVOKE ALL ON FUNCTION public.bm_is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_can_edit_gym(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_is_gym_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bm_sector_gym(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bm_is_platform_admin(), public.bm_can_edit_gym(UUID),
  public.bm_is_gym_admin(UUID), public.bm_sector_gym(UUID) TO anon, authenticated;

-- ===========================================================================
-- Teil 1: Hallen-Einstellungen
-- ===========================================================================
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS ai_capture_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grade_marker       TEXT    NOT NULL DEFAULT 'holds',
  ADD COLUMN IF NOT EXISTS route_name_style   TEXT    NOT NULL DEFAULT 'fun',
  ADD COLUMN IF NOT EXISTS ai_publish_mode    TEXT    NOT NULL DEFAULT 'direct',
  -- v5 (2026-10-29): Zeichen am Start je Farbe und Hinweis der Halle an die KI
  ADD COLUMN IF NOT EXISTS grade_symbols      JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_grade_hint      TEXT;

ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_grade_marker_check;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_grade_marker_check CHECK (grade_marker IN ('holds', 'tape', 'symbol'));
ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_grade_symbols_check;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_grade_symbols_check CHECK (jsonb_typeof(grade_symbols) = 'object' AND length(grade_symbols::text) <= 4000);
ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_ai_grade_hint_check;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_ai_grade_hint_check CHECK (ai_grade_hint IS NULL OR char_length(ai_grade_hint) <= 300);
ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_route_name_style_check;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_route_name_style_check CHECK (route_name_style IN ('fun', 'plain', 'none'));
ALTER TABLE public.gyms DROP CONSTRAINT IF EXISTS gyms_ai_publish_mode_check;
ALTER TABLE public.gyms ADD CONSTRAINT gyms_ai_publish_mode_check CHECK (ai_publish_mode IN ('direct', 'review'));

-- ===========================================================================
-- Teil 2: Routen
-- grade_scale_id bleibt NOT NULL; «Grad folgt» = grade_pending (die App zeigt dann ? statt Farbe)
-- ===========================================================================
ALTER TABLE public.boulders
  ADD COLUMN IF NOT EXISTS capture_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS ai_confidence  REAL,
  ADD COLUMN IF NOT EXISTS hold_color     TEXT,
  ADD COLUMN IF NOT EXISTS grade_pending  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_source    TEXT NOT NULL DEFAULT 'setter',
  ADD COLUMN IF NOT EXISTS radar_source   TEXT NOT NULL DEFAULT 'setter',
  ADD COLUMN IF NOT EXISTS ai_run_id      UUID,
  ADD COLUMN IF NOT EXISTS ai_review      TEXT[];

ALTER TABLE public.boulders DROP CONSTRAINT IF EXISTS boulders_capture_source_check;
ALTER TABLE public.boulders ADD CONSTRAINT boulders_capture_source_check CHECK (capture_source IN ('manual', 'ai'));
ALTER TABLE public.boulders DROP CONSTRAINT IF EXISTS boulders_name_source_check;
ALTER TABLE public.boulders ADD CONSTRAINT boulders_name_source_check CHECK (name_source IN ('setter', 'ai', 'tape', 'plain'));
ALTER TABLE public.boulders DROP CONSTRAINT IF EXISTS boulders_radar_source_check;
ALTER TABLE public.boulders ADD CONSTRAINT boulders_radar_source_check CHECK (radar_source IN ('setter', 'ai'));
ALTER TABLE public.boulders DROP CONSTRAINT IF EXISTS boulders_ai_confidence_check;
ALTER TABLE public.boulders ADD CONSTRAINT boulders_ai_confidence_check CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1));
CREATE INDEX IF NOT EXISTS boulders_ai_run_idx ON public.boulders (ai_run_id) WHERE ai_run_id IS NOT NULL;

-- ===========================================================================
-- Teil 3: Aufträge
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.ai_capture_jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id               UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  sector_id            UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  mode                 TEXT NOT NULL CHECK (mode IN ('new', 'full', 'partial')),
  photo_url            TEXT NOT NULL,
  photo_hash           TEXT,
  status               TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed', 'undone')),
  result               JSONB,
  error                TEXT,
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at           TIMESTAMPTZ,
  finished_at          TIMESTAMPTZ,
  archived_boulder_ids UUID[] NOT NULL DEFAULT '{}',
  previous_photo_url   TEXT
);
CREATE INDEX IF NOT EXISTS ai_capture_jobs_queue_idx ON public.ai_capture_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS ai_capture_jobs_sector_idx ON public.ai_capture_jobs (sector_id, created_at DESC);
-- Gleiches Foto nicht doppelt verarbeiten (F10)
CREATE UNIQUE INDEX IF NOT EXISTS ai_capture_jobs_hash_uniq ON public.ai_capture_jobs (sector_id, photo_hash)
  WHERE photo_hash IS NOT NULL AND status IN ('queued', 'running', 'done');

ALTER TABLE public.ai_capture_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_capture_jobs FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.ai_capture_jobs TO authenticated;

DROP POLICY IF EXISTS "ai jobs read" ON public.ai_capture_jobs;
CREATE POLICY "ai jobs read" ON public.ai_capture_jobs FOR SELECT TO authenticated
  USING (public.bm_can_edit_gym(gym_id));
DROP POLICY IF EXISTS "ai jobs insert" ON public.ai_capture_jobs;
CREATE POLICY "ai jobs insert" ON public.ai_capture_jobs FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'queued'
    AND public.bm_can_edit_gym(gym_id)
    AND public.bm_sector_gym(sector_id) = gym_id
    AND EXISTS (SELECT 1 FROM public.gyms g WHERE g.id = gym_id AND g.ai_capture_enabled)
  );
-- Worker-Konto und Schrauber (Zurücknehmen) aktualisieren den Status
DROP POLICY IF EXISTS "ai jobs update" ON public.ai_capture_jobs;
CREATE POLICY "ai jobs update" ON public.ai_capture_jobs FOR UPDATE TO authenticated
  USING (public.bm_can_edit_gym(gym_id)) WITH CHECK (public.bm_can_edit_gym(gym_id));

-- Höchstens 30 Fotos pro Halle und Tag (F10)
CREATE OR REPLACE FUNCTION public.ai_capture_jobs_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.ai_capture_jobs
      WHERE gym_id = NEW.gym_id AND created_at > now() - interval '1 day') >= 30 THEN
    RAISE EXCEPTION 'ai_capture_daily_limit' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ai_capture_jobs_limit ON public.ai_capture_jobs;
CREATE TRIGGER ai_capture_jobs_limit BEFORE INSERT ON public.ai_capture_jobs
  FOR EACH ROW EXECUTE FUNCTION public.ai_capture_jobs_limit();

-- Monatszähler für Admin → Halle
CREATE OR REPLACE FUNCTION public.ai_capture_month_count(gym UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.bm_can_edit_gym(gym)
    THEN (SELECT count(*)::int FROM public.ai_capture_jobs
          WHERE gym_id = gym AND created_at >= date_trunc('month', now()) AND status <> 'failed')
    ELSE 0 END;
$$;
REVOKE ALL ON FUNCTION public.ai_capture_month_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_capture_month_count(UUID) TO authenticated;

-- ===========================================================================
-- Teil 4: Meldungen von Kletterern (F8)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.route_issue_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  sector_id   UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  boulder_id  UUID REFERENCES public.boulders(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('wrong_grade', 'not_exists', 'wrong_pin', 'missing')),
  position_x  REAL CHECK (position_x IS NULL OR (position_x >= 0 AND position_x <= 1)),
  position_y  REAL CHECK (position_y IS NULL OR (position_y >= 0 AND position_y <= 1)),
  color       TEXT CHECK (color IS NULL OR char_length(color) <= 40),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  handled_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS route_issue_reports_once ON public.route_issue_reports (boulder_id, user_id, kind)
  WHERE boulder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS route_issue_reports_sector_idx ON public.route_issue_reports (sector_id, created_at DESC);

ALTER TABLE public.route_issue_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.route_issue_reports FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.route_issue_reports TO authenticated;

DROP POLICY IF EXISTS "route issues insert" ON public.route_issue_reports;
CREATE POLICY "route issues insert" ON public.route_issue_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND handled_at IS NULL AND public.bm_sector_gym(sector_id) = gym_id);
DROP POLICY IF EXISTS "route issues read" ON public.route_issue_reports;
CREATE POLICY "route issues read" ON public.route_issue_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.bm_can_edit_gym(gym_id));
DROP POLICY IF EXISTS "route issues handle" ON public.route_issue_reports;
CREATE POLICY "route issues handle" ON public.route_issue_reports FOR UPDATE TO authenticated
  USING (public.bm_can_edit_gym(gym_id)) WITH CHECK (public.bm_can_edit_gym(gym_id));

-- ===========================================================================
-- Prüfabfrage (danach ausführen, alle Werte sollten true sein)
-- ===========================================================================
-- SELECT
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gyms' AND column_name = 'ai_capture_enabled') AS gyms_ok,
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boulders' AND column_name = 'grade_pending') AS boulders_ok,
--   to_regclass('public.ai_capture_jobs') IS NOT NULL AS jobs_ok,
--   to_regclass('public.route_issue_reports') IS NOT NULL AS reports_ok;
