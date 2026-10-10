-- SPEC-034 · Prüfungen der Schreibrechte (AC-1 bis AC-6). Aufruf: scripts/test-rls-spec034.sh
\set ON_ERROR_STOP 1

-- Führt eine Anweisung als Rolle/Person aus, rollt immer zurück und meldet 'ok:<zeilen>' oder 'denied'
CREATE OR REPLACE FUNCTION pg_temp.try_as(r text, uid text, q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  n bigint;
  res text;
BEGIN
  BEGIN
    PERFORM set_config('request.jwt.claim.sub', COALESCE(uid, ''), true);
    EXECUTE format('SET LOCAL ROLE %I', r);
    EXECUTE q;
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE EXCEPTION 'ROLLBACK_OK:%', n;
  EXCEPTION WHEN OTHERS THEN
    res := SQLERRM;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  IF res LIKE 'ROLLBACK_OK:%' THEN
    RETURN 'ok:' || substr(res, 13);
  END IF;
  RETURN 'denied';
END $$;

-- Erwartung prüfen: 'ok:N' genau, 'blocked' = denied oder 0 Zeilen
CREATE OR REPLACE FUNCTION pg_temp.check(label text, r text, uid text, q text, expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  got text := pg_temp.try_as(r, uid, q);
  pass boolean;
BEGIN
  IF expected = 'blocked' THEN
    pass := got IN ('denied', 'ok:0');
  ELSE
    pass := got = expected;
  END IF;
  IF NOT pass THEN
    RAISE EXCEPTION 'FEHLER %: erwartet %, bekommen % (% als %)', label, expected, got, q, r;
  END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

\set P '''00000000-0000-0000-0000-0000000000a1'''
\set ADM '''00000000-0000-0000-0000-0000000000a2'''
\set SET '''00000000-0000-0000-0000-0000000000a3'''
\set K '''00000000-0000-0000-0000-0000000000a4'''

-- Lesen bleibt offen
SELECT pg_temp.check('Lesen anon boulders', 'anon', NULL, 'SELECT * FROM public.boulders', 'ok:2');
SELECT pg_temp.check('Lesen anon ascents', 'anon', NULL, 'SELECT * FROM public.ascents', 'ok:1');
SELECT pg_temp.check('Lesen anon gym_members', 'anon', NULL, 'SELECT * FROM public.gym_members', 'ok:2');

-- AC-1: anon schreibt nirgends
SELECT pg_temp.check('AC-1 anon sector insert', 'anon', NULL, $q$INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000a', 'Hack')$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon boulder update', 'anon', NULL, $q$UPDATE public.boulders SET name = 'Hack'$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon boulder delete', 'anon', NULL, $q$DELETE FROM public.boulders$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon gyms update', 'anon', NULL, $q$UPDATE public.gyms SET name = 'Hack'$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon grade_scales delete', 'anon', NULL, $q$DELETE FROM public.grade_scales$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon gym_members insert', 'anon', NULL, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'admin')$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon ascents insert', 'anon', NULL, $q$INSERT INTO public.ascents (boulder_id, user_id, ascent_style) VALUES ('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 'top')$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon ratings insert', 'anon', NULL, $q$INSERT INTO public.ratings (boulder_id, user_id, stars) VALUES ('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 5)$q$, 'blocked');
SELECT pg_temp.check('AC-1 anon Foto hochladen', 'anon', NULL, $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('sector-photos', 'walls/x.jpg')$q$, 'blocked');

-- AC-2: Kletterer ohne Rolle – nur eigene Begehungen/Bewertungen
SELECT pg_temp.check('AC-2 Kletterer sector insert', 'authenticated', :K, $q$INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000a', 'Hack')$q$, 'blocked');
SELECT pg_temp.check('AC-2 Kletterer boulder update', 'authenticated', :K, $q$UPDATE public.boulders SET name = 'Hack'$q$, 'blocked');
SELECT pg_temp.check('AC-2 Kletterer gyms update', 'authenticated', :K, $q$UPDATE public.gyms SET name = 'Hack'$q$, 'blocked');
SELECT pg_temp.check('AC-2 Kletterer macht sich zum Admin', 'authenticated', :K, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'admin')$q$, 'blocked');
SELECT pg_temp.check('AC-2 Kletterer eigener Top', 'authenticated', :K, $q$INSERT INTO public.ascents (boulder_id, user_id, ascent_style) VALUES ('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 'top')$q$, 'ok:1');
SELECT pg_temp.check('AC-2 Kletterer eigene Bewertung', 'authenticated', :K, $q$INSERT INTO public.ratings (boulder_id, user_id, stars) VALUES ('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 5)$q$, 'ok:1');
SELECT pg_temp.check('AC-2 Kletterer Top für andere', 'authenticated', :K, $q$INSERT INTO public.ascents (boulder_id, user_id, ascent_style) VALUES ('40000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a5', 'top')$q$, 'blocked');
SELECT pg_temp.check('AC-2 Angemeldet Foto hochladen', 'authenticated', :K, $q$INSERT INTO storage.objects (bucket_id, name) VALUES ('sector-photos', 'walls/x.jpg')$q$, 'ok:1');

-- AC-3: Schrauber der Halle X in X ja, in Y nein
SELECT pg_temp.check('AC-3 Schrauber sector X', 'authenticated', :SET, $q$INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000a', 'Neu')$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber sector Y', 'authenticated', :SET, $q$INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000b', 'Neu')$q$, 'blocked');
SELECT pg_temp.check('AC-3 Schrauber Farbe X', 'authenticated', :SET, $q$INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label) VALUES ('10000000-0000-0000-0000-00000000000a', 'Rot', '#f00', 'mittel')$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber Farbe Y', 'authenticated', :SET, $q$INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label) VALUES ('10000000-0000-0000-0000-00000000000b', 'Rot', '#f00', 'mittel')$q$, 'blocked');
SELECT pg_temp.check('AC-3 Schrauber Boulder X anlegen', 'authenticated', :SET, $q$INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y) VALUES ('20000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 0.2, 0.2)$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber Boulder Y anlegen', 'authenticated', :SET, $q$INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y) VALUES ('20000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b', 0.2, 0.2)$q$, 'blocked');
SELECT pg_temp.check('AC-3 Schrauber Boulder X ändern', 'authenticated', :SET, $q$UPDATE public.boulders SET name = 'Neu' WHERE id = '40000000-0000-0000-0000-00000000000a'$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber Boulder Y ändern', 'authenticated', :SET, $q$UPDATE public.boulders SET name = 'Neu' WHERE id = '40000000-0000-0000-0000-00000000000b'$q$, 'blocked');
SELECT pg_temp.check('AC-3 Schrauber Boulder X nach Y verschieben', 'authenticated', :SET, $q$UPDATE public.boulders SET sector_id = '20000000-0000-0000-0000-00000000000b' WHERE id = '40000000-0000-0000-0000-00000000000a'$q$, 'blocked');
SELECT pg_temp.check('AC-3 Schrauber Boulder X löschen', 'authenticated', :SET, $q$DELETE FROM public.boulders WHERE id = '40000000-0000-0000-0000-00000000000a'$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber Wand X Sortierung', 'authenticated', :SET, $q$UPDATE public.sectors SET sort_order = 2 WHERE id = '20000000-0000-0000-0000-00000000000a'$q$, 'ok:1');
SELECT pg_temp.check('AC-3 Schrauber Halle ändern', 'authenticated', :SET, $q$UPDATE public.gyms SET name = 'X2' WHERE id = '10000000-0000-0000-0000-00000000000a'$q$, 'blocked');

-- AC-4: Admin vergibt Rollen in X, Schrauber nicht
SELECT pg_temp.check('AC-4 Admin Rolle X', 'authenticated', :ADM, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'setter')$q$, 'ok:1');
SELECT pg_temp.check('AC-4 Admin Rolle Y', 'authenticated', :ADM, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 'setter')$q$, 'blocked');
SELECT pg_temp.check('AC-4 Schrauber Rolle X', 'authenticated', :SET, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a4', 'setter')$q$, 'blocked');
SELECT pg_temp.check('AC-4 Admin Rolle entfernen X', 'authenticated', :ADM, $q$DELETE FROM public.gym_members WHERE gym_id = '10000000-0000-0000-0000-00000000000a' AND role = 'setter'$q$, 'ok:1');
SELECT pg_temp.check('AC-4 Admin Halle X ändern', 'authenticated', :ADM, $q$UPDATE public.gyms SET lat = 47.5 WHERE id = '10000000-0000-0000-0000-00000000000a'$q$, 'ok:1');
SELECT pg_temp.check('AC-4 Admin Halle Y ändern', 'authenticated', :ADM, $q$UPDATE public.gyms SET lat = 47.5 WHERE id = '10000000-0000-0000-0000-00000000000b'$q$, 'blocked');
SELECT pg_temp.check('AC-4 Admin neue Halle', 'authenticated', :ADM, $q$INSERT INTO public.gyms (name) VALUES ('Neue Halle')$q$, 'blocked');

-- AC-5: Plattform-Admin darf alles
SELECT pg_temp.check('AC-5 Plattform neue Halle', 'authenticated', :P, $q$INSERT INTO public.gyms (name) VALUES ('Neue Halle')$q$, 'ok:1');
SELECT pg_temp.check('AC-5 Plattform sector Y', 'authenticated', :P, $q$INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000b', 'Neu')$q$, 'ok:1');
SELECT pg_temp.check('AC-5 Plattform Rolle Y', 'authenticated', :P, $q$INSERT INTO public.gym_members (gym_id, user_id, role) VALUES ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000a4', 'admin')$q$, 'ok:1');
SELECT pg_temp.check('AC-5 Plattform Halle löschen', 'authenticated', :P, $q$DELETE FROM public.gyms WHERE id = '10000000-0000-0000-0000-00000000000b'$q$, 'ok:1');

-- AC-6: fremde Begehungen kann niemand ändern oder löschen
SELECT pg_temp.check('AC-6 fremden Top ändern', 'authenticated', :K, $q$UPDATE public.ascents SET ascent_style = 'flash' WHERE user_id = '00000000-0000-0000-0000-0000000000a5'$q$, 'blocked');
SELECT pg_temp.check('AC-6 fremden Top löschen', 'authenticated', :K, $q$DELETE FROM public.ascents WHERE user_id = '00000000-0000-0000-0000-0000000000a5'$q$, 'blocked');
SELECT pg_temp.check('AC-6 Admin löscht fremden Top', 'authenticated', :ADM, $q$DELETE FROM public.ascents WHERE user_id = '00000000-0000-0000-0000-0000000000a5'$q$, 'blocked');
SELECT pg_temp.check('AC-6 Top umschreiben auf mich', 'authenticated', :K, $q$UPDATE public.ascents SET user_id = '00000000-0000-0000-0000-0000000000a4'$q$, 'blocked');
