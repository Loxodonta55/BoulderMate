-- SPEC-052 · Prüfungen KI-Routenerfassung. Aufruf: scripts/test-db-spec052.sh
\set ON_ERROR_STOP 1

CREATE OR REPLACE FUNCTION pg_temp.val_as(uid text, q text) RETURNS text LANGUAGE plpgsql AS $$
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
  ELSIF expected LIKE 'denied:%' THEN
    IF got IS NULL OR got NOT LIKE '%' || substr(expected, 9) || '%' THEN RAISE EXCEPTION 'FEHLER %: erwartet %, bekommen %', label, expected, got; END IF;
  ELSIF got IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FEHLER %: erwartet %, bekommen %', label, expected, got;
  END IF;
  RAISE NOTICE 'ok  %', label;
END $$;

DO $$
DECLARE
  admin_x text := '00000000-0000-0000-0000-0000000000a2';
  setter_x text := '00000000-0000-0000-0000-0000000000a3';
  climber text := '00000000-0000-0000-0000-0000000000a4';
  gx text := '10000000-0000-0000-0000-00000000000a';
  gy text := '10000000-0000-0000-0000-00000000000b';
  sx text := '20000000-0000-0000-0000-00000000000a';
  sy text := '20000000-0000-0000-0000-00000000000b';
  bx text := '40000000-0000-0000-0000-00000000000a';
  ins text;
BEGIN
  PERFORM pg_temp.eq('Standardwerte Halle', (SELECT ai_capture_enabled::text || grade_marker || route_name_style || ai_publish_mode FROM public.gyms WHERE id = gx::uuid), 'falseholdsfundirect');
  PERFORM pg_temp.eq('Standardwerte Route', (SELECT capture_source || grade_pending::text || name_source || radar_source FROM public.boulders WHERE id = bx::uuid), 'manualfalsesettersetter');
  PERFORM pg_temp.eq('grade_marker nur holds|tape|symbol', pg_temp.val_as(admin_x, format('UPDATE public.gyms SET grade_marker = %L WHERE id = %L RETURNING id', 'sticker', gx)), 'denied');
  PERFORM pg_temp.eq('Admin wählt Zeichen am Start', pg_temp.val_as(admin_x, format('UPDATE public.gyms SET grade_marker = %L, grade_symbols = %L::jsonb, ai_grade_hint = %L WHERE id = %L RETURNING grade_marker || (grade_symbols->>%L)', 'symbol', '{"s1":"★★, 2 Sterne"}', 'Schild unten links', gx, 's1')), 'symbol★★, 2 Sterne');
  PERFORM pg_temp.eq('Hinweis höchstens 300 Zeichen', pg_temp.val_as(admin_x, format('UPDATE public.gyms SET ai_grade_hint = %L WHERE id = %L RETURNING id', repeat('x', 301), gx)), 'denied');
  PERFORM pg_temp.eq('Zeichen nur als Objekt', pg_temp.val_as(admin_x, format('UPDATE public.gyms SET grade_symbols = %L::jsonb WHERE id = %L RETURNING id', '["x"]', gx)), 'denied');

  ins := 'INSERT INTO public.ai_capture_jobs (gym_id, sector_id, mode, photo_url, photo_hash, created_by) VALUES (%L, %L, %L, %L, %L, %L) RETURNING status';
  PERFORM pg_temp.eq('Auftrag nur bei eingeschalteter KI', pg_temp.val_as(setter_x, format(ins, gx, sx, 'full', 'https://x/1.jpg', 'h1', setter_x)), 'denied');
  PERFORM pg_temp.eq('Admin schaltet KI ein', pg_temp.val_as(admin_x, format('UPDATE public.gyms SET ai_capture_enabled = true, grade_marker = %L WHERE id = %L RETURNING grade_marker', 'tape', gx)), 'tape');
  PERFORM pg_temp.eq('Schrauber legt Auftrag an', pg_temp.val_as(setter_x, format(ins, gx, sx, 'full', 'https://x/1.jpg', 'h1', setter_x)), 'queued');
  PERFORM pg_temp.eq('Gleiches Foto nicht doppelt', pg_temp.val_as(setter_x, format(ins, gx, sx, 'full', 'https://x/1.jpg', 'h1', setter_x)), 'denied');
  PERFORM pg_temp.eq('Kletterer darf keinen Auftrag anlegen', pg_temp.val_as(climber, format(ins, gx, sx, 'full', 'https://x/2.jpg', 'h2', climber)), 'denied');
  PERFORM pg_temp.eq('Kein Auftrag für fremde Halle', pg_temp.val_as(setter_x, format(ins, gy, sy, 'full', 'https://x/3.jpg', 'h3', setter_x)), 'denied');
  PERFORM pg_temp.eq('Kein Auftrag mit Sektor anderer Halle', pg_temp.val_as(setter_x, format(ins, gx, sy, 'full', 'https://x/4.jpg', 'h4', setter_x)), 'denied');
  PERFORM pg_temp.eq('Kein Auftrag im Namen anderer', pg_temp.val_as(setter_x, format(ins, gx, sx, 'full', 'https://x/5.jpg', 'h5', admin_x)), 'denied');
  PERFORM pg_temp.eq('Kletterer sieht keine Aufträge', pg_temp.val_as(climber, 'SELECT count(*)::text FROM public.ai_capture_jobs'), '0');
  PERFORM pg_temp.eq('Gast sieht keine Aufträge', pg_temp.val_as(NULL, 'SELECT count(*)::text FROM public.ai_capture_jobs'), 'denied');
  PERFORM pg_temp.eq('Admin sieht Auftrag', pg_temp.val_as(admin_x, 'SELECT count(*)::text FROM public.ai_capture_jobs'), '1');
  PERFORM pg_temp.eq('Worker (Schrauber) setzt Status', pg_temp.val_as(setter_x, 'UPDATE public.ai_capture_jobs SET status = ''done'' RETURNING status'), 'done');
  PERFORM pg_temp.eq('Monatszähler', pg_temp.val_as(admin_x, format('SELECT public.ai_capture_month_count(%L)::text', gx)), '1');
  PERFORM pg_temp.eq('Monatszähler fremd = 0', pg_temp.val_as(climber, format('SELECT public.ai_capture_month_count(%L)::text', gx)), '0');

  -- Tageslimit 30
  INSERT INTO public.ai_capture_jobs (gym_id, sector_id, mode, photo_url, photo_hash, created_by)
    SELECT gx::uuid, sx::uuid, 'partial', 'https://x/n.jpg', 'n' || i, setter_x::uuid FROM generate_series(1, 29) i;
  PERFORM pg_temp.eq('31. Foto am Tag abgelehnt', pg_temp.val_as(setter_x, format(ins, gx, sx, 'full', 'https://x/6.jpg', 'h6', setter_x)), 'denied:ai_capture_daily_limit');

  -- KI-Route anlegen (Schrauber/Worker)
  PERFORM pg_temp.eq('KI-Route mit Grad folgt', pg_temp.val_as(setter_x, format(
    'INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, status, capture_source, ai_confidence, hold_color, grade_pending, name_source, radar_source) VALUES (%L, %L, 0.3, 0.8, %L, %L, 0.7, %L, true, %L, %L) RETURNING grade_pending::text',
    sx, '30000000-0000-0000-0000-00000000000a', 'active', 'ai', 'Türkis', 'tape', 'ai')), 'true');
  PERFORM pg_temp.eq('Sicherheit nur 0–1', pg_temp.val_as(setter_x, format(
    'INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, status, ai_confidence) VALUES (%L, %L, 0.3, 0.8, %L, 1.5) RETURNING id', sx, '30000000-0000-0000-0000-00000000000a', 'active')), 'denied');

  -- Meldungen
  ins := 'INSERT INTO public.route_issue_reports (gym_id, sector_id, boulder_id, kind, user_id) VALUES (%L, %L, %L, %L, %L) RETURNING kind';
  PERFORM pg_temp.eq('Kletterer meldet falschen Grad', pg_temp.val_as(climber, format(ins, gx, sx, bx, 'wrong_grade', climber)), 'wrong_grade');
  PERFORM pg_temp.eq('Gleiche Meldung nur einmal', pg_temp.val_as(climber, format(ins, gx, sx, bx, 'wrong_grade', climber)), 'denied');
  PERFORM pg_temp.eq('Gast kann nicht melden', pg_temp.val_as(NULL, format(ins, gx, sx, bx, 'wrong_pin', NULL)), 'denied');
  PERFORM pg_temp.eq('Melden nur im eigenen Namen', pg_temp.val_as(climber, format(ins, gx, sx, bx, 'wrong_pin', admin_x)), 'denied');
  PERFORM pg_temp.eq('Fehlende Route mit Position', pg_temp.val_as(climber, format(
    'INSERT INTO public.route_issue_reports (gym_id, sector_id, kind, position_x, position_y, user_id) VALUES (%L, %L, %L, 0.4, 0.9, %L) RETURNING kind', gx, sx, 'missing', climber)), 'missing');
  PERFORM pg_temp.eq('Schrauber sieht Meldungen', pg_temp.val_as(setter_x, 'SELECT count(*)::text FROM public.route_issue_reports'), '2');
  PERFORM pg_temp.eq('Anderer Kletterer sieht sie nicht', pg_temp.val_as('00000000-0000-0000-0000-0000000000a5', 'SELECT count(*)::text FROM public.route_issue_reports'), '0');
  PERFORM pg_temp.eq('Kletterer kann nicht erledigen', pg_temp.val_as(climber, 'UPDATE public.route_issue_reports SET handled_at = now() RETURNING id'), NULL);
  PERFORM pg_temp.eq('Schrauber erledigt', pg_temp.val_as(setter_x, 'WITH u AS (UPDATE public.route_issue_reports SET handled_at = now() RETURNING 1) SELECT count(*)::text FROM u'), '2');
END $$;
