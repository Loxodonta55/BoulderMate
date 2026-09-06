-- =========================================================================
-- BoulderMate — Non-destructive Upward Data Sync to Supabase
-- WICHTIG: Append-only / ON CONFLICT DO NOTHING / UPDATE. Niemals DELETE!
-- =========================================================================

DO $$
DECLARE
  v_gym_6a UUID;
  v_gym_min UUID;
  
  -- 6a plus scales
  v_6a_yellow UUID;
  v_6a_green UUID;
  v_6a_blue UUID;
  v_6a_red UUID;
  v_6a_black UUID;
  v_6a_white UUID;
  v_6a_purple UUID;

  -- 6a plus sectors
  v_sec_slab_vorne UUID;
  v_sec_ecke_vorne UUID;
  v_sec_zwischenwand UUID;
  v_sec_ueberhang_vorne UUID;
  v_sec_verlaengerung UUID;
  v_sec_ecke_mitte UUID;
  v_sec_cave UUID;
  v_sec_cave_wand UUID;

  -- Minimum scales
  v_min_green UUID;
  v_min_blue UUID;
  v_min_yellow UUID;
  v_min_red UUID;
  v_min_black UUID;
  v_min_white UUID;

  -- Minimum sectors
  v_min_sec_overhang UUID;
  v_min_sec_roof UUID;
  v_min_sec_slab UUID;

BEGIN
  -- -------------------------------------------------------------
  -- 1. GYMS: 6a plus & Minimum Bouldern Zürich
  -- -------------------------------------------------------------
  SELECT id INTO v_gym_6a FROM public.gyms WHERE name ILIKE '%6a plus%' LIMIT 1;
  IF v_gym_6a IS NULL THEN
    INSERT INTO public.gyms (name, address, city, website, logo_url)
    VALUES ('6a plus Kletter- & Boulderhalle Winterthur', 'Klosterstrasse 17', 'Winterthur', 'https://sechsaplus.ch', 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop')
    RETURNING id INTO v_gym_6a;
  END IF;

  SELECT id INTO v_gym_min FROM public.gyms WHERE name ILIKE '%minimum%' LIMIT 1;
  IF v_gym_min IS NULL THEN
    INSERT INTO public.gyms (name, address, city, website, logo_url)
    VALUES ('Minimum Bouldern Zürich', 'Flüelastrasse 31', 'Zürich', 'https://minimum.ch', 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop')
    RETURNING id INTO v_gym_min;
  END IF;

  -- -------------------------------------------------------------
  -- 2. GRADE SCALES (6a plus)
  -- -------------------------------------------------------------
  SELECT id INTO v_6a_yellow FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Gelb' LIMIT 1;
  IF v_6a_yellow IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Gelb', '#eab308', 'Sehr leicht', '3', '4', 1) RETURNING id INTO v_6a_yellow;
  END IF;

  SELECT id INTO v_6a_green FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Grün' LIMIT 1;
  IF v_6a_green IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Grün', '#22c55e', 'Leicht', '5', '5+', 2) RETURNING id INTO v_6a_green;
  END IF;

  SELECT id INTO v_6a_blue FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Blau' LIMIT 1;
  IF v_6a_blue IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Blau', '#3b82f6', 'Mittel', '6A', '6B+', 3) RETURNING id INTO v_6a_blue;
  END IF;

  SELECT id INTO v_6a_red FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Rot' LIMIT 1;
  IF v_6a_red IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Rot', '#ef4444', 'Schwer', '6C', '7A+', 4) RETURNING id INTO v_6a_red;
  END IF;

  SELECT id INTO v_6a_black FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Schwarz' LIMIT 1;
  IF v_6a_black IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Schwarz', '#1e293b', 'Sehr schwer', '7B', '7C+', 5) RETURNING id INTO v_6a_black;
  END IF;

  SELECT id INTO v_6a_white FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Weiß' LIMIT 1;
  IF v_6a_white IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Weiß', '#f8fafc', 'Extrem', '8A', '8B', 6) RETURNING id INTO v_6a_white;
  END IF;

  SELECT id INTO v_6a_purple FROM public.grade_scales WHERE gym_id = v_gym_6a AND color_name = 'Lila' LIMIT 1;
  IF v_6a_purple IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_6a, 'Lila', '#a855f7', 'Elite', '8B+', '8C+', 7) RETURNING id INTO v_6a_purple;
  END IF;

  -- -------------------------------------------------------------
  -- 3. GRADE SCALES (Minimum Bouldern Zürich)
  -- -------------------------------------------------------------
  SELECT id INTO v_min_green FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Grün' LIMIT 1;
  IF v_min_green IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Grün', '#22c55e', 'Leicht', '4a', '5b', 1) RETURNING id INTO v_min_green;
  END IF;

  SELECT id INTO v_min_blue FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Blau' LIMIT 1;
  IF v_min_blue IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Blau', '#3b82f6', 'Fortgeschritten', '5c', '6b', 2) RETURNING id INTO v_min_blue;
  END IF;

  SELECT id INTO v_min_yellow FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Gelb' LIMIT 1;
  IF v_min_yellow IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Gelb', '#eab308', 'Sportlich', '6b+', '7a', 3) RETURNING id INTO v_min_yellow;
  END IF;

  SELECT id INTO v_min_red FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Rot' LIMIT 1;
  IF v_min_red IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Rot', '#ef4444', 'Schwer', '7a+', '7b+', 4) RETURNING id INTO v_min_red;
  END IF;

  SELECT id INTO v_min_black FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Schwarz' LIMIT 1;
  IF v_min_black IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Schwarz', '#1e293b', 'Sehr schwer', '7c', '8a', 5) RETURNING id INTO v_min_black;
  END IF;

  SELECT id INTO v_min_white FROM public.grade_scales WHERE gym_id = v_gym_min AND color_name = 'Weiß' LIMIT 1;
  IF v_min_white IS NULL THEN
    INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
    VALUES (v_gym_min, 'Weiß', '#f8fafc', 'Elite', '8a+', '8b+', 6) RETURNING id INTO v_min_white;
  END IF;

  -- -------------------------------------------------------------
  -- 4. SECTORS (6a plus — 8 Sektoren)
  -- -------------------------------------------------------------
  SELECT id INTO v_sec_slab_vorne FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Slab Vorne' LIMIT 1;
  IF v_sec_slab_vorne IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Slab Vorne', '/images/walls/6aplus/SlapVorne.jpg', 1) RETURNING id INTO v_sec_slab_vorne;
  END IF;

  SELECT id INTO v_sec_ecke_vorne FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Ecke Vorne' LIMIT 1;
  IF v_sec_ecke_vorne IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Ecke Vorne', '/images/walls/6aplus/EckeVorne.jpg', 2) RETURNING id INTO v_sec_ecke_vorne;
  END IF;

  SELECT id INTO v_sec_zwischenwand FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Zwischenwand Vorne' LIMIT 1;
  IF v_sec_zwischenwand IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Zwischenwand Vorne', '/images/walls/6aplus/ZwischenwandVorne.jpg', 3) RETURNING id INTO v_sec_zwischenwand;
  END IF;

  SELECT id INTO v_sec_ueberhang_vorne FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Überhang Vorne' LIMIT 1;
  IF v_sec_ueberhang_vorne IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Überhang Vorne', '/images/walls/6aplus/UerberhangVorne.jpg', 4) RETURNING id INTO v_sec_ueberhang_vorne;
  END IF;

  SELECT id INTO v_sec_verlaengerung FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Verlängerung Überhang' LIMIT 1;
  IF v_sec_verlaengerung IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Verlängerung Überhang', '/images/walls/6aplus/VerlaengerungUeberhang.jpg', 5) RETURNING id INTO v_sec_verlaengerung;
  END IF;

  SELECT id INTO v_sec_ecke_mitte FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Ecke Mitte' LIMIT 1;
  IF v_sec_ecke_mitte IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Ecke Mitte', '/images/walls/6aplus/EckeMitte.jpg', 6) RETURNING id INTO v_sec_ecke_mitte;
  END IF;

  SELECT id INTO v_sec_cave FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Cave' LIMIT 1;
  IF v_sec_cave IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Cave', '/images/walls/6aplus/Cave.jpg', 7) RETURNING id INTO v_sec_cave;
  END IF;

  SELECT id INTO v_sec_cave_wand FROM public.sectors WHERE gym_id = v_gym_6a AND name = 'Cave Wand' LIMIT 1;
  IF v_sec_cave_wand IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_6a, 'Cave Wand', '/images/walls/6aplus/CaveWand.jpg', 8) RETURNING id INTO v_sec_cave_wand;
  END IF;

  -- -------------------------------------------------------------
  -- 5. SECTORS (Minimum Bouldern Zürich — 3 Sektoren)
  -- -------------------------------------------------------------
  SELECT id INTO v_min_sec_overhang FROM public.sectors WHERE gym_id = v_gym_min AND name ILIKE '%Überhang%' LIMIT 1;
  IF v_min_sec_overhang IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_min, 'Überhang 45° (Comp Wall)', '/images/walls/overhang.jpg', 1) RETURNING id INTO v_min_sec_overhang;
  END IF;

  SELECT id INTO v_min_sec_roof FROM public.sectors WHERE gym_id = v_gym_min AND name ILIKE '%Dach%' LIMIT 1;
  IF v_min_sec_roof IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_min, 'Dachbereich & Cave', '/images/walls/roof.jpg', 2) RETURNING id INTO v_min_sec_roof;
  END IF;

  SELECT id INTO v_min_sec_slab FROM public.sectors WHERE gym_id = v_gym_min AND name ILIKE '%Platte%' LIMIT 1;
  IF v_min_sec_slab IS NULL THEN
    INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
    VALUES (v_gym_min, 'Platte (Slab & Balance)', '/images/walls/slab.jpg', 3) RETURNING id INTO v_min_sec_slab;
  END IF;

  -- -------------------------------------------------------------
  -- 6. BOULDERS (Routen für 6a plus — Non-destructive Upsert)
  -- -------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_sec_slab_vorne AND name = 'Gelber Auftakt') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_sec_slab_vorne, v_6a_yellow, 0.32, 0.62, 'Gelber Auftakt', 'Entspannter Einstieg mit großen Griffen', 'active', 2, 2, 2, 3, 4, 2, 3, '4', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_sec_ueberhang_vorne AND name = '6a+ Überhang-Crux') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_sec_ueberhang_vorne, v_6a_blue, 0.52, 0.38, '6a+ Überhang-Crux', 'Kräftiger Zug auf die Zange', 'active', 4, 3, 4, 4, 2, 3, 2, '6B', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_sec_cave AND name = 'Cave Power Rot') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_sec_cave, v_6a_red, 0.65, 0.45, 'Cave Power Rot', 'Steiler Kanten-Boulder mit Toehook', 'active', 5, 4, 5, 4, 3, 4, 3, '7A', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_sec_zwischenwand AND name = '6A+ Zwischenwand-Traverse') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_sec_zwischenwand, v_6a_blue, 0.38, 0.52, '6A+ Zwischenwand-Traverse', 'Ausdauernde Quergang-Sequenz', 'active', 3, 5, 3, 4, 3, 3, 3, '6A+', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_sec_ecke_vorne AND name = 'Ecken-Schleicher') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_sec_ecke_vorne, v_6a_green, 0.44, 0.58, 'Ecken-Schleicher', 'Reibung und Stützen in der Verschneidung', 'active', 2, 2, 2, 4, 5, 2, 4, '5+', now());
  END IF;

  -- -------------------------------------------------------------
  -- 7. BOULDERS (Routen für Minimum Bouldern Zürich)
  -- -------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_min_sec_overhang AND name = 'Dynamo Dynamo') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_min_sec_overhang, v_min_blue, 0.45, 0.35, 'Dynamo Dynamo', 'Weiter Sprung auf die Leiste', 'active', 4, 3, 4, 3, 2, 5, 2, '6a+', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_min_sec_slab AND name = 'Reibungstraum') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_min_sec_slab, v_min_green, 0.25, 0.65, 'Reibungstraum', 'Nur auf Reibung stehen', 'active', 1, 3, 1, 4, 5, 2, 4, '5a', now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.boulders WHERE sector_id = v_min_sec_roof AND name = 'Dach-Crux') THEN
    INSERT INTO public.boulders (sector_id, grade_scale_id, position_x, position_y, name, notes, status, radar_maximalkraft, radar_kraftausdauer, radar_kraft, radar_technik, radar_balance, radar_koordination, radar_flexibilitaet, font_grade, published_at)
    VALUES (v_min_sec_roof, v_min_red, 0.50, 0.45, 'Dach-Crux', 'Schwere Körperspannung horizontal', 'active', 5, 4, 5, 4, 2, 3, 3, '7a+', now());
  END IF;

END $$;
