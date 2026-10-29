-- SPEC-053 · «Noch nicht dabei» – Hallen-Verzeichnis, Wünsche und Empfehlungen
-- Reihenfolge: diese Datei im Supabase-SQL-Editor ausführen, danach den Seed
-- supabase/seed/20261029_hallen_verzeichnis_deutschschweiz.sql (Thread «Kletterhallen Deutschschweiz erfassen»).
-- Setzt public.treff_is_platform_admin() voraus (SPEC-028). Wiederholbar.

-- ===========================================================================
-- Teil 1: Verzeichnis aller Hallen (auch die, die noch nicht mitmachen)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.hallen_verzeichnis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  adresse          TEXT,
  plz              TEXT,
  ort              TEXT,
  kanton           TEXT,
  land             TEXT NOT NULL DEFAULT 'CH',
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  website          TEXT,
  telefon          TEXT,
  email            TEXT,
  art              TEXT CHECK (art IS NULL OR art IN ('boulder', 'seil', 'beides')),
  betreiber_typ    TEXT CHECK (betreiber_typ IS NULL OR betreiber_typ IN ('kommerziell', 'verein', 'sac', 'gemeinde', 'andere')),
  oeffnungszeiten  TEXT,
  preise           TEXT,
  quelle_urls      TEXT[],
  pruef_status     TEXT CHECK (pruef_status IS NULL OR pruef_status IN ('ok', 'korrigiert', 'unsicher')),
  geprueft_am      DATE,
  notiz            TEXT,
  -- gesetzt, sobald die Halle bei BoulderMate mitmacht (F6)
  gym_id           UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  -- Halle will nicht erscheinen (F4)
  ausgeblendet     BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hallen_verzeichnis_name_plz ON public.hallen_verzeichnis ((lower(name)), plz);

ALTER TABLE public.hallen_verzeichnis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hallen_verzeichnis lesen" ON public.hallen_verzeichnis;
CREATE POLICY "hallen_verzeichnis lesen" ON public.hallen_verzeichnis
  FOR SELECT TO anon, authenticated USING (NOT ausgeblendet OR public.treff_is_platform_admin());

DROP POLICY IF EXISTS "hallen_verzeichnis admin schreiben" ON public.hallen_verzeichnis;
CREATE POLICY "hallen_verzeichnis admin schreiben" ON public.hallen_verzeichnis
  FOR ALL TO authenticated USING (public.treff_is_platform_admin()) WITH CHECK (public.treff_is_platform_admin());

-- Telefon, Preise, Notizen usw. braucht die App nicht; öffentlich nur, was angezeigt wird
REVOKE SELECT ON public.hallen_verzeichnis FROM anon, authenticated;
GRANT SELECT (id, name, adresse, plz, ort, kanton, land, lat, lng, website, email, art, pruef_status, gym_id, ausgeblendet)
  ON public.hallen_verzeichnis TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hallen_verzeichnis TO authenticated;

-- ===========================================================================
-- Teil 2: Wünsche «Ich will BoulderMate hier» (F2)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.hallen_wuensche (
  verzeichnis_id UUID NOT NULL REFERENCES public.hallen_verzeichnis(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (verzeichnis_id, user_id)
);

ALTER TABLE public.hallen_wuensche ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hallen_wuensche eigene lesen" ON public.hallen_wuensche;
CREATE POLICY "hallen_wuensche eigene lesen" ON public.hallen_wuensche
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Nur sichtbare, noch nicht aktive Hallen nehmen Wünsche an (Runde 2, V1)
DROP POLICY IF EXISTS "hallen_wuensche eigene anlegen" ON public.hallen_wuensche;
CREATE POLICY "hallen_wuensche eigene anlegen" ON public.hallen_wuensche
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.hallen_verzeichnis v
      WHERE v.id = verzeichnis_id AND NOT v.ausgeblendet AND v.gym_id IS NULL
    )
  );

DROP POLICY IF EXISTS "hallen_wuensche eigene loeschen" ON public.hallen_wuensche;
CREATE POLICY "hallen_wuensche eigene loeschen" ON public.hallen_wuensche
  FOR DELETE TO authenticated USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.hallen_wuensche TO authenticated;

-- Nur Anzahlen, nie Namen (F2)
CREATE OR REPLACE FUNCTION public.hallen_wunsch_anzahl()
RETURNS TABLE (verzeichnis_id UUID, anzahl INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.verzeichnis_id, count(*)::int
  FROM public.hallen_wuensche w
  JOIN public.hallen_verzeichnis v ON v.id = w.verzeichnis_id
  WHERE NOT v.ausgeblendet
  GROUP BY w.verzeichnis_id;
$$;
REVOKE ALL ON FUNCTION public.hallen_wunsch_anzahl() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hallen_wunsch_anzahl() TO anon, authenticated;

-- F7: Liste für Hans' Akquise
CREATE OR REPLACE FUNCTION public.hallen_wunsch_rangliste()
RETURNS TABLE (verzeichnis_id UUID, name TEXT, ort TEXT, kanton TEXT, wuensche INTEGER, email TEXT, website TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.treff_is_platform_admin() THEN
    RAISE EXCEPTION 'nur Plattform-Admin';
  END IF;
  RETURN QUERY
    SELECT v.id, v.name, v.ort, v.kanton, count(w.user_id)::int, v.email, v.website
    FROM public.hallen_verzeichnis v
    LEFT JOIN public.hallen_wuensche w ON w.verzeichnis_id = v.id
    WHERE v.gym_id IS NULL AND NOT v.ausgeblendet
    GROUP BY v.id
    ORDER BY count(w.user_id) DESC, v.name;
END;
$$;
REVOKE ALL ON FUNCTION public.hallen_wunsch_rangliste() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hallen_wunsch_rangliste() TO authenticated;

-- ===========================================================================
-- Teil 3: Empfehlungscodes und Empfehlungen (F3, F5)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.empfehlungscodes (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code          TEXT NOT NULL UNIQUE CHECK (code ~ '^BM-[ACDEFGHJKLMNPQRTUVWXY3479]{6}$'),
  -- Haken «mindestens 18 und Teilnahmebedingungen akzeptiert»
  akzeptiert_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empfehlungscodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empfehlungscodes eigene" ON public.empfehlungscodes;
CREATE POLICY "empfehlungscodes eigene" ON public.empfehlungscodes
  FOR ALL TO authenticated USING (user_id = auth.uid() OR public.treff_is_platform_admin())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.empfehlungscodes TO authenticated;

CREATE TABLE IF NOT EXISTS public.hallen_empfehlungen (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verzeichnis_id UUID REFERENCES public.hallen_verzeichnis(id) ON DELETE SET NULL,
  -- Name bleibt erhalten, auch wenn der Verzeichnis-Eintrag verschwindet
  halle_name     TEXT NOT NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'im_gespraech' CHECK (status IN ('im_gespraech', 'registriert', 'bezahlt', 'ausgezahlt')),
  betrag_chf     NUMERIC(10, 2),
  notiz          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hallen_empfehlungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hallen_empfehlungen eigene lesen" ON public.hallen_empfehlungen;
CREATE POLICY "hallen_empfehlungen eigene lesen" ON public.hallen_empfehlungen
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.treff_is_platform_admin());

DROP POLICY IF EXISTS "hallen_empfehlungen admin schreiben" ON public.hallen_empfehlungen;
CREATE POLICY "hallen_empfehlungen admin schreiben" ON public.hallen_empfehlungen
  FOR ALL TO authenticated USING (public.treff_is_platform_admin()) WITH CHECK (public.treff_is_platform_admin());

-- Interne Notiz nur für den Admin
REVOKE SELECT ON public.hallen_empfehlungen FROM authenticated;
GRANT SELECT (id, verzeichnis_id, halle_name, user_id, code, status, betrag_chf, created_at, updated_at)
  ON public.hallen_empfehlungen TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hallen_empfehlungen TO authenticated;

-- ===========================================================================
-- Prüfabfrage (nach dem Seed): wie viele Hallen sind sichtbar?
-- SELECT count(*) FILTER (WHERE lat IS NOT NULL AND NOT ausgeblendet AND gym_id IS NULL
--                         AND coalesce(pruef_status, 'ok') <> 'unsicher') AS sichtbar,
--        count(*) AS gesamt
-- FROM public.hallen_verzeichnis;
