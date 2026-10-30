-- SPEC-054 · Vertriebspartner – Partner-Profil, Betreuung von Hallen, Provision
-- Setzt SPEC-053 voraus (20261029_spec053_hallen_verzeichnis.sql) und public.treff_is_platform_admin() (SPEC-028).
-- Wiederholbar.

-- ===========================================================================
-- Teil 1: Partner-Profil (F2) – nur Rolle, Region, optional Anzeigename (Runde 2: kein Kanal-Link)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.vertriebspartner (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle         TEXT NOT NULL CHECK (rolle IN ('trainer', 'stammgast', 'influencer', 'hallenteam', 'studierend', 'andere')),
  region        TEXT NOT NULL CHECK (char_length(region) BETWEEN 2 AND 60),
  anzeigename   TEXT CHECK (anzeigename IS NULL OR char_length(anzeigename) <= 40),
  -- Haken «mindestens 18 und Partnerbedingungen akzeptiert»
  akzeptiert_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vertriebspartner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vertriebspartner eigene lesen" ON public.vertriebspartner;
CREATE POLICY "vertriebspartner eigene lesen" ON public.vertriebspartner
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.treff_is_platform_admin());

DROP POLICY IF EXISTS "vertriebspartner eigene anlegen" ON public.vertriebspartner;
CREATE POLICY "vertriebspartner eigene anlegen" ON public.vertriebspartner
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vertriebspartner eigene aendern" ON public.vertriebspartner;
CREATE POLICY "vertriebspartner eigene aendern" ON public.vertriebspartner
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "vertriebspartner eigene loeschen" ON public.vertriebspartner;
CREATE POLICY "vertriebspartner eigene loeschen" ON public.vertriebspartner
  FOR DELETE TO authenticated USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vertriebspartner TO authenticated;

-- ===========================================================================
-- Teil 2: hallen_empfehlungen erweitern (Betreuung, Umsatz, Satz)
-- ===========================================================================
ALTER TABLE public.hallen_empfehlungen ADD COLUMN IF NOT EXISTS betreut_bis TIMESTAMPTZ;
ALTER TABLE public.hallen_empfehlungen ADD COLUMN IF NOT EXISTS verlaengert BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.hallen_empfehlungen ADD COLUMN IF NOT EXISTS umsatz_erstes_jahr_chf NUMERIC(10, 2);
ALTER TABLE public.hallen_empfehlungen ADD COLUMN IF NOT EXISTS provision_satz NUMERIC(4, 3)
  CHECK (provision_satz IS NULL OR provision_satz IN (0.3, 0.4));

ALTER TABLE public.hallen_empfehlungen DROP CONSTRAINT IF EXISTS hallen_empfehlungen_status_check;
ALTER TABLE public.hallen_empfehlungen ADD CONSTRAINT hallen_empfehlungen_status_check
  CHECK (status IN ('betreut', 'im_gespraech', 'registriert', 'bezahlt', 'ausgezahlt'));

CREATE INDEX IF NOT EXISTS hallen_empfehlungen_verzeichnis ON public.hallen_empfehlungen (verzeichnis_id);
CREATE INDEX IF NOT EXISTS hallen_empfehlungen_user ON public.hallen_empfehlungen (user_id);

-- Neue Spalten für den Partner lesbar (notiz bleibt Admin-only, SPEC-053)
GRANT SELECT (betreut_bis, verlaengert, umsatz_erstes_jahr_chf, provision_satz)
  ON public.hallen_empfehlungen TO authenticated;

-- «Aktiv betreut»: betreut/im Gespräch und nicht abgelaufen, oder ab registriert
CREATE OR REPLACE FUNCTION public.hallen_empfehlung_aktiv(p_status TEXT, p_bis TIMESTAMPTZ)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN p_status IN ('betreut', 'im_gespraech') THEN p_bis IS NOT NULL AND p_bis > now()
              ELSE true END;
$$;

-- ===========================================================================
-- Teil 3: RPCs für Partner (F3, F2)
-- ===========================================================================

-- Halle für 60 Tage betreuen; Fehlertexte: kein_partner, nicht_sichtbar, schon_betreut, limit
CREATE OR REPLACE FUNCTION public.partner_halle_betreuen(p_verzeichnis_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_code TEXT;
  v_name TEXT;
  v_id   UUID;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.vertriebspartner WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'kein_partner';
  END IF;
  SELECT code INTO v_code FROM public.empfehlungscodes WHERE user_id = v_uid;
  IF v_code IS NULL THEN
    RAISE EXCEPTION 'kein_partner';
  END IF;

  SELECT name INTO v_name FROM public.hallen_verzeichnis
  WHERE id = p_verzeichnis_id AND NOT ausgeblendet AND gym_id IS NULL
    AND lat IS NOT NULL AND coalesce(pruef_status, 'ok') <> 'unsicher';
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'nicht_sichtbar';
  END IF;

  -- gleichzeitige Anfragen auf dieselbe Halle nacheinander abarbeiten
  PERFORM pg_advisory_xact_lock(hashtext(p_verzeichnis_id::text));

  IF EXISTS (
    SELECT 1 FROM public.hallen_empfehlungen
    WHERE verzeichnis_id = p_verzeichnis_id AND public.hallen_empfehlung_aktiv(status, betreut_bis)
  ) THEN
    RAISE EXCEPTION 'schon_betreut';
  END IF;

  IF (
    SELECT count(*) FROM public.hallen_empfehlungen
    WHERE user_id = v_uid AND status IN ('betreut', 'im_gespraech') AND betreut_bis > now()
  ) >= 5 THEN
    RAISE EXCEPTION 'limit';
  END IF;

  -- abgelaufene Betreuungen dieser Halle aufräumen
  DELETE FROM public.hallen_empfehlungen
  WHERE verzeichnis_id = p_verzeichnis_id AND status IN ('betreut', 'im_gespraech') AND betreut_bis <= now();

  INSERT INTO public.hallen_empfehlungen (verzeichnis_id, halle_name, user_id, code, status, betreut_bis)
  VALUES (p_verzeichnis_id, v_name, v_uid, v_code, 'betreut', now() + interval '60 days')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.partner_halle_betreuen(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_halle_betreuen(UUID) TO authenticated;

-- «Im Gespräch»: verlängert einmal um 60 Tage
CREATE OR REPLACE FUNCTION public.partner_im_gespraech(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.hallen_empfehlungen
  SET status = 'im_gespraech',
      betreut_bis = CASE WHEN verlaengert THEN betreut_bis ELSE greatest(betreut_bis, now()) + interval '60 days' END,
      verlaengert = true,
      updated_at = now()
  WHERE id = p_id AND user_id = auth.uid() AND status = 'betreut' AND betreut_bis > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'nicht_moeglich';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.partner_im_gespraech(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_im_gespraech(UUID) TO authenticated;

-- Freigeben (nur Schritt 1–2)
CREATE OR REPLACE FUNCTION public.partner_freigeben(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.hallen_empfehlungen
  WHERE id = p_id AND user_id = auth.uid() AND status IN ('betreut', 'im_gespraech');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'nicht_moeglich';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.partner_freigeben(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_freigeben(UUID) TO authenticated;

-- Welche Hallen gerade betreut sind – nur IDs, nie Namen (F3)
CREATE OR REPLACE FUNCTION public.hallen_betreut()
RETURNS TABLE (verzeichnis_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT e.verzeichnis_id
  FROM public.hallen_empfehlungen e
  WHERE e.verzeichnis_id IS NOT NULL AND public.hallen_empfehlung_aktiv(e.status, e.betreut_bis);
$$;
REVOKE ALL ON FUNCTION public.hallen_betreut() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hallen_betreut() TO anon, authenticated;

-- ===========================================================================
-- Teil 4: Plattform-Admin «Vertrieb» (F6)
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.vertrieb_uebersicht()
RETURNS TABLE (
  id UUID, verzeichnis_id UUID, halle_name TEXT, user_id UUID, code TEXT, status TEXT,
  betreut_bis TIMESTAMPTZ, verlaengert BOOLEAN, umsatz_erstes_jahr_chf NUMERIC, provision_satz NUMERIC,
  betrag_chf NUMERIC, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  partner_rolle TEXT, partner_region TEXT, partner_name TEXT, partner_registriert_sonst INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.treff_is_platform_admin() THEN
    RAISE EXCEPTION 'nur Plattform-Admin';
  END IF;
  RETURN QUERY
    SELECT e.id, e.verzeichnis_id, e.halle_name, e.user_id, e.code, e.status,
           e.betreut_bis, e.verlaengert, e.umsatz_erstes_jahr_chf, e.provision_satz,
           e.betrag_chf, e.created_at, e.updated_at,
           p.rolle, p.region, p.anzeigename,
           (SELECT count(*)::int FROM public.hallen_empfehlungen o
            WHERE o.user_id = e.user_id AND o.id <> e.id AND o.status IN ('registriert', 'bezahlt', 'ausgezahlt'))
    FROM public.hallen_empfehlungen e
    LEFT JOIN public.vertriebspartner p ON p.user_id = e.user_id
    ORDER BY e.updated_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.vertrieb_uebersicht() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vertrieb_uebersicht() TO authenticated;

-- Prüfabfrage:
-- SELECT status, count(*), sum(betrag_chf) FROM public.hallen_empfehlungen GROUP BY 1;
