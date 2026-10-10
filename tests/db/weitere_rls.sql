-- SPEC-036/038/042 · kurze Prüfungen nach dem Einspielen (Aufruf: scripts/test-rls-spec034.sh)
\set ON_ERROR_STOP 1
CREATE OR REPLACE FUNCTION pg_temp.try_as(r text, uid text, q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE n bigint; res text;
BEGIN
  BEGIN
    PERFORM set_config('request.jwt.claim.sub', COALESCE(uid, ''), true);
    EXECUTE format('SET LOCAL ROLE %I', r);
    EXECUTE q;
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE EXCEPTION 'ROLLBACK_OK:%', n;
  EXCEPTION WHEN OTHERS THEN res := SQLERRM;
  END;
  RESET ROLE;
  IF res LIKE 'ROLLBACK_OK:%' THEN RETURN 'ok:' || substr(res, 13); END IF;
  RETURN 'denied: ' || res;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.check(label text, r text, uid text, q text, expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE got text := pg_temp.try_as(r, uid, q);
BEGIN
  IF NOT ((expected = 'blocked' AND (got LIKE 'denied%' OR got = 'ok:0')) OR got = expected) THEN
    RAISE EXCEPTION 'FEHLER %: erwartet %, bekommen %', label, expected, got;
  END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

-- Testdaten für Gruppen/Challenges (als Superuser)
INSERT INTO public.training_groups (id, name, code, owner_id, owner_nickname)
VALUES ('50000000-0000-0000-0000-000000000001', 'Jugend', 'ABC234', '00000000-0000-0000-0000-0000000000a2', 'Trainerin')
ON CONFLICT DO NOTHING;

-- SPEC-042
SELECT pg_temp.check('042 Fremder liest Gruppe nicht', 'authenticated', '00000000-0000-0000-0000-0000000000a4', 'SELECT * FROM public.training_groups', 'ok:0');
SELECT pg_temp.check('042 Code-Vorschau', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$SELECT * FROM public.preview_training_group('abc234')$q$, 'ok:1');
SELECT pg_temp.check('042 Beitreten mit Code', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$SELECT public.join_training_group('ABC234', 'Kim')$q$, 'ok:1');
SELECT pg_temp.check('042 direkt einfügen verboten', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$INSERT INTO public.training_group_members (group_id, user_id, nickname) VALUES ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a4', 'Kim')$q$, 'blocked');
SELECT pg_temp.check('042 falscher Code', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$SELECT public.join_training_group('ZZZ999', 'Kim')$q$, 'blocked');
SELECT pg_temp.check('042 anon Vorschau', 'anon', NULL, $q$SELECT * FROM public.preview_training_group('ABC234')$q$, 'blocked');

-- SPEC-038
SELECT pg_temp.check('038 Admin legt Challenge an', 'authenticated', '00000000-0000-0000-0000-0000000000a2', $q$INSERT INTO public.challenges (gym_id, name, starts_at, ends_at, rule, created_by) VALUES ('10000000-0000-0000-0000-00000000000a', 'Okt', now(), now() + interval '10 days', 'new', '00000000-0000-0000-0000-0000000000a2')$q$, 'ok:1');
SELECT pg_temp.check('038 Kletterer legt keine an', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$INSERT INTO public.challenges (gym_id, name, starts_at, ends_at, rule, created_by) VALUES ('10000000-0000-0000-0000-00000000000a', 'Okt', now(), now() + interval '10 days', 'new', '00000000-0000-0000-0000-0000000000a4')$q$, 'blocked');
SELECT pg_temp.check('038 höchstens 31 Tage', 'authenticated', '00000000-0000-0000-0000-0000000000a2', $q$INSERT INTO public.challenges (gym_id, name, starts_at, ends_at, rule, created_by) VALUES ('10000000-0000-0000-0000-00000000000a', 'Lang', now(), now() + interval '40 days', 'new', '00000000-0000-0000-0000-0000000000a2')$q$, 'blocked');

-- SPEC-036: Nicht-Admin darf keinen Hallen-Termin anlegen
INSERT INTO public.treff_settings (user_id, consent_at, age_confirmed) VALUES
  ('00000000-0000-0000-0000-0000000000a4', now(), true), ('00000000-0000-0000-0000-0000000000a2', now(), true)
ON CONFLICT DO NOTHING;
SELECT pg_temp.check('036 Kletterer kein Hallen-Termin', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$INSERT INTO public.treff_entries (user_id, gym_id, starts_at, ends_at, nickname, is_gym_event) VALUES ('00000000-0000-0000-0000-0000000000a4', '10000000-0000-0000-0000-00000000000a', now() + interval '1 hour', now() + interval '3 hours', 'Kim', true)$q$, 'blocked');
SELECT pg_temp.check('036 Admin Hallen-Termin', 'authenticated', '00000000-0000-0000-0000-0000000000a2', $q$INSERT INTO public.treff_entries (user_id, gym_id, starts_at, ends_at, nickname, is_gym_event) VALUES ('00000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-00000000000a', now() + interval '1 hour', now() + interval '3 hours', 'Admin', true)$q$, 'ok:1');
SELECT pg_temp.check('036 Kletterer normaler Eintrag', 'authenticated', '00000000-0000-0000-0000-0000000000a4', $q$INSERT INTO public.treff_entries (user_id, gym_id, starts_at, ends_at, nickname, beginners_welcome) VALUES ('00000000-0000-0000-0000-0000000000a4', '10000000-0000-0000-0000-00000000000a', now() + interval '1 hour', now() + interval '3 hours', 'Kim', true)$q$, 'ok:1');
SELECT pg_temp.check('036 Gast-Ansicht ohne Notiz privater Einträge', 'anon', NULL, $q$SELECT note FROM public.treff_entries_public WHERE NOT is_gym_event AND note IS NOT NULL$q$, 'ok:0');
-- SPEC-033
SELECT pg_temp.check('033 Sichtbarkeit lesbar', 'anon', NULL, $q$SELECT show_in_lists FROM public.user_profiles$q$, 'ok:5');
SELECT pg_temp.check('033 E-Mail weiter gesperrt', 'anon', NULL, $q$SELECT email FROM public.user_profiles$q$, 'blocked');
