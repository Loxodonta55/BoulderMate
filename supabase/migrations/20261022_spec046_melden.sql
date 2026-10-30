-- SPEC-046 · Person melden und ausblenden
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.
-- Setzt SPEC-028 (Treff: treff_blocks, treff_reports, treff_set_banned) voraus. Wiederholbar.

-- ===========================================================================
-- Teil 1: Spalten
-- ===========================================================================

-- Moderation am Profil: nur über die Funktionen unten änderbar (keine UPDATE-Rechte für Nutzer)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS banned            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS name_hidden       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_hidden     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_notice TEXT;

-- Öffentlich lesbar, damit alle Geräte gesperrte/versteckte Profile als «Jemand» zeigen
GRANT SELECT (banned, name_hidden, avatar_hidden) ON public.user_profiles TO anon, authenticated;

-- Meldungen: eine Tabelle für Treff und Profile (§4.5)
ALTER TABLE public.treff_reports
  ADD COLUMN IF NOT EXISTS context           TEXT NOT NULL DEFAULT 'treff',
  ADD COLUMN IF NOT EXISTS note              TEXT,
  ADD COLUMN IF NOT EXISTS reported_note     TEXT,
  ADD COLUMN IF NOT EXISTS reporter_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS decision          TEXT;

ALTER TABLE public.treff_reports DROP CONSTRAINT IF EXISTS treff_reports_context_check;
ALTER TABLE public.treff_reports ADD CONSTRAINT treff_reports_context_check CHECK (context IN ('treff', 'profil'));
ALTER TABLE public.treff_reports DROP CONSTRAINT IF EXISTS treff_reports_note_check;
ALTER TABLE public.treff_reports ADD CONSTRAINT treff_reports_note_check CHECK (note IS NULL OR char_length(note) <= 200);
ALTER TABLE public.treff_reports DROP CONSTRAINT IF EXISTS treff_reports_reported_note_check;
ALTER TABLE public.treff_reports ADD CONSTRAINT treff_reports_reported_note_check CHECK (reported_note IS NULL OR char_length(reported_note) <= 500);
ALTER TABLE public.treff_reports DROP CONSTRAINT IF EXISTS treff_reports_reason_check;
ALTER TABLE public.treff_reports ADD CONSTRAINT treff_reports_reason_check
  CHECK (reason IN ('belaestigung', 'spam', 'unangemessen', 'anderes', 'name', 'bild'));

-- §5: Löscht die meldende Person ihr Konto, bleibt die Meldung ohne Namen
ALTER TABLE public.treff_reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE public.treff_reports DROP CONSTRAINT IF EXISTS treff_reports_reporter_id_fkey;
ALTER TABLE public.treff_reports ADD CONSTRAINT treff_reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS treff_reports_target_idx ON public.treff_reports (reported_user_id, context, created_at);

-- Profil-Meldungen nur über report_profile(); direktes Einfügen bleibt für Treff
DROP POLICY IF EXISTS "treff_reports insert" ON public.treff_reports;
CREATE POLICY "treff_reports insert" ON public.treff_reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND handled_at IS NULL AND context = 'treff');

-- ===========================================================================
-- Teil 2: Wortliste (§4.6) – Hans pflegt sie im Dashboard, ohne neue App-Version
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.blocked_words (
  word TEXT PRIMARY KEY CHECK (word = lower(word) AND char_length(word) BETWEEN 2 AND 40)
);
ALTER TABLE public.blocked_words ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blocked_words FROM anon, authenticated;
GRANT SELECT ON public.blocked_words TO authenticated;
GRANT INSERT, DELETE ON public.blocked_words TO authenticated;
DROP POLICY IF EXISTS "blocked_words read" ON public.blocked_words;
CREATE POLICY "blocked_words read" ON public.blocked_words FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "blocked_words admin insert" ON public.blocked_words;
CREATE POLICY "blocked_words admin insert" ON public.blocked_words FOR INSERT TO authenticated WITH CHECK (public.treff_is_platform_admin());
DROP POLICY IF EXISTS "blocked_words admin delete" ON public.blocked_words;
CREATE POLICY "blocked_words admin delete" ON public.blocked_words FOR DELETE TO authenticated USING (public.treff_is_platform_admin());

-- Gleiche Liste wie src/lib/moderation/nicknameFilter.ts (ganze Wörter, Kleinschreibung)
INSERT INTO public.blocked_words (word) VALUES
  ('arschloch'), ('wichser'), ('wixer'), ('fotze'), ('hurensohn'), ('hure'), ('nutte'), ('schlampe'),
  ('missgeburt'), ('spast'), ('spasti'), ('schwuchtel'), ('kanake'), ('neger'), ('zigeuner'),
  ('ficken'), ('fick'), ('ficker'), ('titten'), ('porno'), ('vergewaltiger'), ('kinderficker'),
  ('judensau'), ('untermensch'), ('nazi'), ('hitler'), ('siegheil'),
  ('fuck'), ('fucker'), ('motherfucker'), ('shit'), ('bitch'), ('cunt'), ('whore'), ('slut'),
  ('nigger'), ('nigga'), ('faggot'), ('fag'), ('retard'), ('rapist'), ('porn'), ('cock'),
  ('pussy'), ('asshole'), ('dickhead'), ('wanker'), ('twat'),
  ('88'), ('1488'), ('14words'), ('hh'), ('kkk')
ON CONFLICT (word) DO NOTHING;

-- true = Name ist erlaubt. Prüft jedes Wort für sich und mit Ziffern-Tricks (4→a, 3→e, 0→o, 1→i, 5→s).
CREATE OR REPLACE FUNCTION public.nickname_allowed(name TEXT)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tok TEXT;
BEGIN
  FOREACH tok IN ARRAY regexp_split_to_array(lower(COALESCE(name, '')), '[^a-z0-9äöüß]+') LOOP
    CONTINUE WHEN tok = '';
    IF EXISTS (SELECT 1 FROM public.blocked_words w WHERE w.word = tok OR w.word = translate(tok, '43015', 'aeois')) THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.nickname_allowed(TEXT) TO anon, authenticated;

-- ===========================================================================
-- Teil 3: Schutz der Profilzeile
-- ===========================================================================

-- Moderations-Funktionen setzen bm.moderating = on und dürfen alles
CREATE OR REPLACE FUNCTION public.user_profiles_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('bm.moderating', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    -- Neues Konto (z. B. Name von Google): nicht scheitern lassen, neutral benennen
    IF NOT public.nickname_allowed(NEW.nickname) THEN
      NEW.nickname := 'Kletterer';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.banned AND (NEW.nickname IS DISTINCT FROM OLD.nickname OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url) THEN
    RAISE EXCEPTION 'profile_banned' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.nickname IS DISTINCT FROM OLD.nickname AND NOT public.nickname_allowed(NEW.nickname) THEN
    RAISE EXCEPTION 'nickname_not_allowed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_guard ON public.user_profiles;
CREATE TRIGGER user_profiles_guard
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.user_profiles_guard();

-- ===========================================================================
-- Teil 4: Ausblenden in beide Richtungen (§4.3)
-- ===========================================================================

-- Wen sehe ich nicht, und wer sieht mich nicht? (ohne preiszugeben, in welche Richtung)
CREATE OR REPLACE FUNCTION public.my_hidden_user_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id FROM public.treff_blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM public.treff_blocks WHERE blocked_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_hidden_user_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_hidden_user_ids() TO authenticated;

-- ===========================================================================
-- Teil 5: Melden (§4.2, §4.4)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.report_profile(target UUID, reason TEXT, note TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  me UUID := auth.uid();
  eligible BOOLEAN;
  snap TEXT;
  cnt INTEGER;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet';
  END IF;
  IF target = me THEN
    RETURN 'self';
  END IF;
  IF reason NOT IN ('name', 'bild', 'belaestigung', 'anderes') THEN
    RAISE EXCEPTION 'Unbekannter Grund';
  END IF;
  -- Grenze: 5 Meldungen pro Person und Tag (Treff und Profile zusammen)
  IF (SELECT count(*) FROM public.treff_reports r WHERE r.reporter_id = me AND r.created_at > now() - interval '1 day') >= 5 THEN
    RETURN 'limit';
  END IF;

  -- Nur eingesessene Konten zählen fürs vorläufige Verstecken: älter als 7 Tage, mindestens eine Begehung
  eligible := COALESCE((SELECT u.created_at < now() - interval '7 days' FROM auth.users u WHERE u.id = me), false)
              AND EXISTS (SELECT 1 FROM public.ascents a WHERE a.user_id = me);

  -- Kopie vom Server, nicht vom Gerät
  SELECT left(p.nickname || ' | ' || COALESCE(CASE WHEN p.avatar_url LIKE 'http%' THEN p.avatar_url ELSE NULL END, '–'), 500)
    INTO snap FROM public.user_profiles p WHERE p.id = target;
  IF snap IS NULL THEN
    RETURN 'unknown';
  END IF;

  INSERT INTO public.treff_reports (reporter_id, entry_id, reported_user_id, reason, snapshot, context, note, reporter_eligible)
  VALUES (me, NULL, target, reason, snap, 'profil', NULLIF(left(btrim(COALESCE(note, '')), 200), ''), eligible);

  IF eligible AND reason IN ('name', 'bild') THEN
    SELECT count(DISTINCT r.reporter_id) INTO cnt FROM public.treff_reports r
    WHERE r.reported_user_id = target AND r.context = 'profil' AND r.reason = report_profile.reason
      AND r.reporter_eligible AND r.handled_at IS NULL AND r.created_at > now() - interval '14 days';
    IF cnt >= 3 THEN
      PERFORM set_config('bm.moderating', 'on', true);
      IF reason = 'bild' THEN
        UPDATE public.user_profiles SET avatar_hidden = true, moderation_notice = 'pending_bild' WHERE id = target AND NOT avatar_hidden;
      ELSE
        UPDATE public.user_profiles SET name_hidden = true, moderation_notice = 'pending_name' WHERE id = target AND NOT name_hidden;
      END IF;
      PERFORM set_config('bm.moderating', 'off', true);
    END IF;
  END IF;
  RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.report_profile(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_profile(UUID, TEXT, TEXT) TO authenticated;

-- ===========================================================================
-- Teil 6: Die betroffene Person (§4.4)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.my_moderation_status()
RETURNS TABLE (banned BOOLEAN, name_hidden BOOLEAN, avatar_hidden BOOLEAN, notice TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.banned, p.name_hidden, p.avatar_hidden, p.moderation_notice FROM public.user_profiles p WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.my_moderation_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_moderation_status() TO authenticated;

-- Rückmeldung gelesen (Hinweise «vorläufig versteckt» bleiben, bis entschieden ist)
CREATE OR REPLACE FUNCTION public.ack_moderation_notice()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('bm.moderating', 'on', true);
  UPDATE public.user_profiles SET moderation_notice = NULL
  WHERE id = auth.uid() AND moderation_notice IS NOT NULL AND moderation_notice NOT LIKE 'pending_%' AND moderation_notice <> 'banned';
  PERFORM set_config('bm.moderating', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public.ack_moderation_notice() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ack_moderation_notice() TO authenticated;

-- «Das ist ein Fehler»: Notiz an alle offenen Meldungen gegen mich
CREATE OR REPLACE FUNCTION public.object_moderation(note TEXT)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH u AS (
    UPDATE public.treff_reports r SET reported_note = left(COALESCE(NULLIF(btrim(object_moderation.note), ''), 'Das ist ein Fehler.'), 500)
    WHERE r.reported_user_id = auth.uid() AND r.context = 'profil' AND r.handled_at IS NULL
    RETURNING 1
  )
  SELECT count(*)::integer FROM u;
$$;
REVOKE ALL ON FUNCTION public.object_moderation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.object_moderation(TEXT) TO authenticated;

-- ===========================================================================
-- Teil 7: Plattform-Admin (§4.5)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.admin_profile_reports()
RETURNS TABLE (
  id UUID, created_at TIMESTAMPTZ, reason TEXT, note TEXT, snapshot TEXT,
  reported_user_id UUID, reported_nickname TEXT, reported_avatar TEXT,
  name_hidden BOOLEAN, avatar_hidden BOOLEAN, banned BOOLEAN, reported_note TEXT,
  times_reported INTEGER, reporter_reports INTEGER, is_trainer BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.treff_is_platform_admin() THEN
    RAISE EXCEPTION 'Nur Plattform-Admins';
  END IF;
  -- §5: erledigte Meldungen nach 6 Monaten löschen
  DELETE FROM public.treff_reports r WHERE r.handled_at IS NOT NULL AND r.handled_at < now() - interval '6 months';

  RETURN QUERY
  SELECT r.id, r.created_at, r.reason, r.note, r.snapshot,
         r.reported_user_id, p.nickname, p.avatar_url,
         COALESCE(p.name_hidden, false), COALESCE(p.avatar_hidden, false), COALESCE(p.banned, false), r.reported_note,
         (SELECT count(*)::integer FROM public.treff_reports x WHERE x.reported_user_id = r.reported_user_id),
         (SELECT count(*)::integer FROM public.treff_reports y WHERE r.reporter_id IS NOT NULL AND y.reporter_id = r.reporter_id),
         EXISTS (SELECT 1 FROM public.training_groups g WHERE g.owner_id = r.reported_user_id)
  FROM public.treff_reports r
  LEFT JOIN public.user_profiles p ON p.id = r.reported_user_id
  WHERE r.context = 'profil' AND r.handled_at IS NULL
  ORDER BY
    (COALESCE(p.name_hidden, false) OR COALESCE(p.avatar_hidden, false) OR r.reported_note IS NOT NULL) DESC,
    EXISTS (SELECT 1 FROM public.training_groups g WHERE g.owner_id = r.reported_user_id) DESC,
    r.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_profile_reports() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_profile_reports() TO authenticated;

-- action: reset_name · remove_avatar (rule: nacktheit|gewalt|hass|werbung) · ban · restore · done
CREATE OR REPLACE FUNCTION public.moderate_profile(report UUID, action TEXT, rule TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target UUID;
  was_hidden BOOLEAN;
BEGIN
  IF NOT public.treff_is_platform_admin() THEN
    RAISE EXCEPTION 'Nur Plattform-Admins';
  END IF;
  SELECT r.reported_user_id INTO target FROM public.treff_reports r WHERE r.id = report AND r.context = 'profil';
  IF target IS NULL THEN
    RAISE EXCEPTION 'Meldung nicht gefunden';
  END IF;
  IF action = 'remove_avatar' AND COALESCE(rule, '') NOT IN ('nacktheit', 'gewalt', 'hass', 'werbung') THEN
    RAISE EXCEPTION 'Regel fehlt';
  END IF;

  PERFORM set_config('bm.moderating', 'on', true);
  IF action = 'reset_name' THEN
    UPDATE public.user_profiles
    SET nickname = 'Kletterer ' || lpad((floor(random() * 10000))::int::text, 4, '0'),
        name_hidden = false, moderation_notice = 'decided_name_reset', updated_at = now()
    WHERE id = target;
  ELSIF action = 'remove_avatar' THEN
    UPDATE public.user_profiles
    SET avatar_url = NULL, avatar_hidden = false, moderation_notice = 'decided_bild_removed:' || rule, updated_at = now()
    WHERE id = target;
  ELSIF action = 'ban' THEN
    UPDATE public.user_profiles SET banned = true, moderation_notice = 'banned', updated_at = now() WHERE id = target;
    PERFORM public.treff_set_banned(target, true);
  ELSIF action = 'restore' THEN
    SELECT (p.name_hidden OR p.avatar_hidden) INTO was_hidden FROM public.user_profiles p WHERE p.id = target;
    UPDATE public.user_profiles
    SET name_hidden = false, avatar_hidden = false,
        moderation_notice = CASE WHEN was_hidden THEN 'restored' ELSE moderation_notice END
    WHERE id = target;
  ELSIF action <> 'done' THEN
    RAISE EXCEPTION 'Unbekannte Aktion';
  END IF;
  PERFORM set_config('bm.moderating', 'off', true);

  UPDATE public.treff_reports r SET handled_at = now(), decision = action
  WHERE r.reported_user_id = target AND r.context = 'profil' AND r.handled_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.moderate_profile(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_profile(UUID, TEXT, TEXT) TO authenticated;

-- Prüfabfrage nach dem Einspielen:
--   SELECT public.nickname_allowed('Hakan'), public.nickname_allowed('Klettermax1988'), public.nickname_allowed('4rschl0ch');
--   → true, true, false
