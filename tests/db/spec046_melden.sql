-- SPEC-046 · Prüfungen Melden und Ausblenden. Aufruf: scripts/test-db-spec046.sh
\set ON_ERROR_STOP 1

-- Wert einer Abfrage als Person (Rolle authenticated, Gast = anon); Fehler → 'denied: …'. Änderungen bleiben.
CREATE OR REPLACE FUNCTION pg_temp.val_as(uid text, q text, keep boolean DEFAULT false) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid, ''), true);
  IF uid IS NULL THEN SET LOCAL ROLE anon; ELSE SET LOCAL ROLE authenticated; END IF;
  BEGIN
    EXECUTE q INTO v;
  EXCEPTION WHEN OTHERS THEN
    v := 'denied: ' || SQLERRM;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.eq(label text, got text, expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF expected = 'denied' THEN
    IF got IS NULL OR got NOT LIKE 'denied%' THEN RAISE EXCEPTION 'FEHLER %: erwartet denied, bekommen %', label, got; END IF;
  ELSIF got IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FEHLER %: erwartet %, bekommen %', label, expected, got;
  END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

-- Personen: a1 Plattform-Admin, b1–b4 eingesessen (alt + Begehung), n1 neu, t Ziel
INSERT INTO auth.users (id, email, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000b1', 'b1@test', now() - interval '30 days'),
  ('00000000-0000-0000-0000-0000000000b2', 'b2@test', now() - interval '30 days'),
  ('00000000-0000-0000-0000-0000000000b3', 'b3@test', now() - interval '30 days'),
  ('00000000-0000-0000-0000-0000000000b4', 'b4@test', now() - interval '30 days'),
  ('00000000-0000-0000-0000-0000000000c1', 'neu1@test', now()),
  ('00000000-0000-0000-0000-0000000000c2', 'neu2@test', now()),
  ('00000000-0000-0000-0000-0000000000c3', 'neu3@test', now()),
  ('00000000-0000-0000-0000-0000000000d1', 'ziel@test', now() - interval '30 days')
ON CONFLICT DO NOTHING;
UPDATE public.user_profiles SET avatar_url = 'https://example.com/bild.png' WHERE id = '00000000-0000-0000-0000-0000000000d1';
INSERT INTO public.ascents (boulder_id, user_id, ascent_style)
SELECT '40000000-0000-0000-0000-00000000000a', u, 'top' FROM unnest(ARRAY[
  '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2',
  '00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000b4']::uuid[]) u
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  adm text := '00000000-0000-0000-0000-0000000000a1';
  b1 text := '00000000-0000-0000-0000-0000000000b1';
  b2 text := '00000000-0000-0000-0000-0000000000b2';
  b3 text := '00000000-0000-0000-0000-0000000000b3';
  b4 text := '00000000-0000-0000-0000-0000000000b4';
  c1 text := '00000000-0000-0000-0000-0000000000c1';
  tgt text := '00000000-0000-0000-0000-0000000000d1';
  rid uuid;
BEGIN
  -- AC-9 Wortliste
  PERFORM pg_temp.eq('Hakan erlaubt', public.nickname_allowed('Hakan')::text, 'true');
  PERFORM pg_temp.eq('Dick erlaubt', public.nickname_allowed('Dick')::text, 'true');
  PERFORM pg_temp.eq('Dickfinger erlaubt', public.nickname_allowed('Dickfinger')::text, 'true');
  PERFORM pg_temp.eq('Klettermax1988 erlaubt', public.nickname_allowed('Klettermax1988')::text, 'true');
  PERFORM pg_temp.eq('4rschl0ch abgelehnt', public.nickname_allowed('4rschl0ch')::text, 'false');
  PERFORM pg_temp.eq('Max 88 abgelehnt', public.nickname_allowed('Max 88')::text, 'false');
  PERFORM pg_temp.eq('Name ändern: grob abgelehnt',
    pg_temp.val_as(b1, format($q$UPDATE public.user_profiles SET nickname = 'Fuck you' WHERE id = %L RETURNING nickname$q$, b1)), 'denied');
  PERFORM pg_temp.eq('Name ändern: normal erlaubt',
    pg_temp.val_as(b1, format($q$UPDATE public.user_profiles SET nickname = 'Bea' WHERE id = %L RETURNING nickname$q$, b1)), 'Bea');
  PERFORM pg_temp.eq('Sperre nicht selbst änderbar',
    pg_temp.val_as(b1, format($q$UPDATE public.user_profiles SET banned = true WHERE id = %L RETURNING 'x'$q$, b1)), 'denied');
  PERFORM pg_temp.eq('Flags öffentlich lesbar',
    pg_temp.val_as(NULL, format($q$SELECT banned::text FROM public.user_profiles WHERE id = %L$q$, tgt)), 'false');
  PERFORM pg_temp.eq('Hinweis nicht öffentlich lesbar',
    pg_temp.val_as(b1, format($q$SELECT moderation_notice FROM public.user_profiles WHERE id = %L$q$, tgt)), 'denied');

  -- Melden
  PERFORM pg_temp.eq('Gast kann nicht melden', pg_temp.val_as(NULL, format($q$SELECT public.report_profile(%L, 'bild')$q$, tgt)), 'denied');
  PERFORM pg_temp.eq('sich selbst melden', pg_temp.val_as(b1, format($q$SELECT public.report_profile(%L, 'bild')$q$, b1)), 'self');
  PERFORM pg_temp.eq('Profil-Meldung nicht direkt einfügbar',
    pg_temp.val_as(b1, format($q$INSERT INTO public.treff_reports (reporter_id, reported_user_id, reason, snapshot, context) VALUES (%L, %L, 'bild', 'x', 'profil') RETURNING 'x'$q$, b1, tgt)), 'denied');
  PERFORM pg_temp.eq('Meldungen nicht für alle lesbar',
    pg_temp.val_as(b1, $q$SELECT count(*)::text FROM public.treff_reports$q$), '0');
END $$;

-- Meldungen bleiben (keep): eigene Transaktion je Aufruf, nicht zurückgerollt
CREATE OR REPLACE FUNCTION pg_temp.report_as(uid text, tgt text, reason text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid, true);
  SET LOCAL ROLE authenticated;
  v := public.report_profile(tgt::uuid, reason, 'Testnotiz');
  RESET ROLE;
  RETURN v;
END $$;

DO $$
DECLARE
  tgt text := '00000000-0000-0000-0000-0000000000d1';
BEGIN
  -- AC-11: drei neue Konten verstecken nichts
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000c1', tgt, 'bild');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000c2', tgt, 'bild');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000c3', tgt, 'bild');
  PERFORM pg_temp.eq('AC-11 neue Konten verstecken nichts', (SELECT avatar_hidden::text FROM public.user_profiles WHERE id = tgt::uuid), 'false');
  -- AC-6: drei eingesessene Konten verstecken das Bild sofort
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b1', tgt, 'bild');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b2', tgt, 'bild');
  PERFORM pg_temp.eq('2 Meldungen: noch sichtbar', (SELECT avatar_hidden::text FROM public.user_profiles WHERE id = tgt::uuid), 'false');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b3', tgt, 'bild');
  PERFORM pg_temp.eq('AC-6 drei Meldungen: Bild versteckt', (SELECT avatar_hidden::text FROM public.user_profiles WHERE id = tgt::uuid), 'true');
  PERFORM pg_temp.eq('Hinweis an Betroffene', pg_temp.val_as(tgt, $q$SELECT notice FROM public.my_moderation_status()$q$), 'pending_bild');
  PERFORM pg_temp.eq('Kopie vom Server', (SELECT snapshot FROM public.treff_reports WHERE reporter_id = '00000000-0000-0000-0000-0000000000b1'::uuid LIMIT 1), 'ziel | https://example.com/bild.png');
  -- AC-8: Grenze 5 pro Tag
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes');
  PERFORM pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes');
  PERFORM pg_temp.eq('5. Meldung geht', pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes'), 'ok');
  PERFORM pg_temp.eq('AC-8 6. Meldung abgelehnt', pg_temp.report_as('00000000-0000-0000-0000-0000000000b4', tgt, 'anderes'), 'limit');
  -- «Das ist ein Fehler»
  PERFORM pg_temp.eq('Widerspruch', pg_temp.val_as(tgt, $q$SELECT public.object_moderation('Das ist Kunst')::text$q$), '11');
END $$;
-- object_moderation wurde oben zurückgerollt; jetzt dauerhaft
DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.object_moderation('Das ist Kunst');
  RESET ROLE;
END $$;

DO $$
DECLARE
  adm text := '00000000-0000-0000-0000-0000000000a1';
  b1 text := '00000000-0000-0000-0000-0000000000b1';
  tgt text := '00000000-0000-0000-0000-0000000000d1';
  rid text;
BEGIN
  -- AC-7: nur Plattform-Admin
  PERFORM pg_temp.eq('Liste nur für Admin', pg_temp.val_as(b1, $q$SELECT count(*)::text FROM public.admin_profile_reports()$q$), 'denied');
  PERFORM pg_temp.eq('Admin sieht 11 Meldungen', pg_temp.val_as(adm, $q$SELECT count(*)::text FROM public.admin_profile_reports()$q$), '11');
  PERFORM pg_temp.eq('Widerspruch und Zähler sichtbar',
    pg_temp.val_as(adm, $q$SELECT reported_note || ' / ' || times_reported FROM public.admin_profile_reports() LIMIT 1$q$), 'Das ist Kunst / 11');
  rid := pg_temp.val_as(adm, $q$SELECT id::text FROM public.admin_profile_reports() LIMIT 1$q$);
  PERFORM pg_temp.eq('Entscheiden nur Admin', pg_temp.val_as(b1, format($q$SELECT public.moderate_profile(%L, 'ban')::text$q$, rid)), 'denied');
  PERFORM pg_temp.eq('Bild entfernen braucht Regel', pg_temp.val_as(adm, format($q$SELECT public.moderate_profile(%L, 'remove_avatar')::text$q$, rid)), 'denied');
END $$;

-- Admin entfernt das Bild (dauerhaft)
DO $$ DECLARE rid uuid; BEGIN
  SELECT id INTO rid FROM public.treff_reports WHERE context = 'profil' LIMIT 1;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.moderate_profile(rid, 'remove_avatar', 'nacktheit');
  RESET ROLE;
END $$;

DO $$
DECLARE
  adm text := '00000000-0000-0000-0000-0000000000a1';
  tgt text := '00000000-0000-0000-0000-0000000000d1';
BEGIN
  PERFORM pg_temp.eq('AC-12 Rückmeldung mit Regel', pg_temp.val_as(tgt, $q$SELECT notice FROM public.my_moderation_status()$q$), 'decided_bild_removed:nacktheit');
  PERFORM pg_temp.eq('Bild weg, nicht mehr versteckt', (SELECT (avatar_url IS NULL)::text || avatar_hidden::text FROM public.user_profiles WHERE id = tgt::uuid), 'truefalse');
  PERFORM pg_temp.eq('alle Meldungen erledigt', pg_temp.val_as(adm, $q$SELECT count(*)::text FROM public.admin_profile_reports()$q$), '0');
  PERFORM pg_temp.val_as(tgt, $q$SELECT public.ack_moderation_notice()::text$q$);
  PERFORM pg_temp.eq('Rückmeldung gelesen', pg_temp.val_as(tgt, $q$SELECT COALESCE(notice, 'leer') FROM public.my_moderation_status()$q$), 'leer');
END $$;

-- Sperre (dauerhaft), danach kann die Person Name nicht ändern
DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b4', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.report_profile('00000000-0000-0000-0000-0000000000c1', 'belaestigung', NULL);
  RESET ROLE;
END $$;
-- b4 hat schon 6 Versuche heute → 'limit'; also meldet b3
DO $$ DECLARE rid uuid; BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b3', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.report_profile('00000000-0000-0000-0000-0000000000c1', 'belaestigung', NULL);
  RESET ROLE;
  SELECT id INTO rid FROM public.treff_reports WHERE context = 'profil' AND reported_user_id = '00000000-0000-0000-0000-0000000000c1' AND handled_at IS NULL LIMIT 1;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.moderate_profile(rid, 'ban');
  RESET ROLE;
END $$;

DO $$
DECLARE
  c1 text := '00000000-0000-0000-0000-0000000000c1';
  b1 text := '00000000-0000-0000-0000-0000000000b1';
  b2 text := '00000000-0000-0000-0000-0000000000b2';
BEGIN
  PERFORM pg_temp.eq('gesperrt', (SELECT banned::text FROM public.user_profiles WHERE id = c1::uuid), 'true');
  PERFORM pg_temp.eq('auch im Treff gesperrt', (SELECT banned::text FROM public.treff_settings WHERE user_id = c1::uuid), 'true');
  PERFORM pg_temp.eq('Gesperrte ändern Namen nicht',
    pg_temp.val_as(c1, format($q$UPDATE public.user_profiles SET nickname = 'Neu' WHERE id = %L RETURNING nickname$q$, c1)), 'denied');
  PERFORM pg_temp.val_as(c1, $q$SELECT public.ack_moderation_notice()::text$q$);
  PERFORM pg_temp.eq('Sperr-Hinweis bleibt nach Lesen', pg_temp.val_as(c1, $q$SELECT notice FROM public.my_moderation_status()$q$), 'banned');

  -- Ausblenden in beide Richtungen
  INSERT INTO public.treff_blocks (blocker_id, blocked_id) VALUES (b1::uuid, b2::uuid) ON CONFLICT DO NOTHING;
  PERFORM pg_temp.eq('Blocker sieht Ausgeblendete nicht', pg_temp.val_as(b1, $q$SELECT string_agg(x::text, ',') FROM public.my_hidden_user_ids() x$q$), b2);
  PERFORM pg_temp.eq('Ausgeblendete sieht Blocker nicht', pg_temp.val_as(b2, $q$SELECT string_agg(x::text, ',') FROM public.my_hidden_user_ids() x$q$), b1);
  PERFORM pg_temp.eq('Gast: keine Liste', pg_temp.val_as(NULL, $q$SELECT count(*)::text FROM public.my_hidden_user_ids()$q$), 'denied');
END $$;

-- Neues Konto mit grobem Google-Namen scheitert nicht
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'grob@test', '{"nickname": "Wichser"}') ON CONFLICT DO NOTHING;
DO $$ BEGIN
  PERFORM pg_temp.eq('Neues Konto mit grobem Namen → Kletterer',
    (SELECT nickname FROM public.user_profiles WHERE id = '00000000-0000-0000-0000-0000000000e1'), 'Kletterer');
END $$;

-- §5: Meldende löscht Konto → Meldung bleibt ohne Namen
DO $$ BEGIN
  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000c2';
  PERFORM pg_temp.eq('Meldung bleibt ohne meldende Person',
    (SELECT count(*)::text FROM public.treff_reports WHERE reporter_id IS NULL AND context = 'profil'), '1');
END $$;
