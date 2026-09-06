-- ============================================================
-- Seed Data: 6a plus Winterthur mit Halle 1
-- ============================================================

DO 
DECLARE
  v_gym_id UUID;
  v_yellow_id UUID;
  v_green_id UUID;
  v_blue_id UUID;
  v_red_id UUID;
  v_black_id UUID;
  v_white_id UUID;
  v_purple_id UUID;
  v_sec_halle1 UUID;
  v_sec_comp UUID;
BEGIN
  -- Gym 6a plus anlegen falls nicht vorhanden
  INSERT INTO public.gyms (name, address, city, website, logo_url)
  VALUES (
    '6a plus Kletter- & Boulderhalle Winterthur',
    'Klosterstrasse 17',
    'Winterthur',
    'https://sechsaplus.ch',
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=128&auto=format&fit=crop'
  )
  RETURNING id INTO v_gym_id;

  -- Farbskalen fuer 6a plus anlegen
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Gelb', '#eab308', 'Sehr leicht', '3', '4', 1) RETURNING id INTO v_yellow_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Grün', '#22c55e', 'Leicht', '5', '5+', 2) RETURNING id INTO v_green_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Blau', '#3b82f6', 'Mittel', '6A', '6B+', 3) RETURNING id INTO v_blue_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Rot', '#ef4444', 'Schwer', '6C', '7A+', 4) RETURNING id INTO v_red_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Schwarz', '#1e293b', 'Sehr schwer', '7B', '7C+', 5) RETURNING id INTO v_black_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Weiß', '#f8fafc', 'Extrem', '8A', '8B', 6) RETURNING id INTO v_white_id;
  INSERT INTO public.grade_scales (gym_id, color_name, color_hex, difficulty_label, font_range_min, font_range_max, sort_order)
  VALUES 
    (v_gym_id, 'Lila', '#a855f7', 'Elite', '8B+', '8C+', 7) RETURNING id INTO v_purple_id;

  -- Sektoren anlegen, inklusive 'Halle 1'!
  INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
  VALUES (v_gym_id, 'Halle 1', '/images/walls/six-a-comp.jpg', 1)
  RETURNING id INTO v_sec_halle1;

  INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
  VALUES (v_gym_id, 'Wettkampfwand (Comp Wall)', '/images/walls/six-a-comp.jpg', 2)
  RETURNING id INTO v_sec_comp;

  INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
  VALUES (v_gym_id, 'Dachgrotte & Überhang', '/images/walls/six-a-roof.jpg', 3);

  INSERT INTO public.sectors (gym_id, name, wall_photo_url, sort_order)
  VALUES (v_gym_id, 'Platte (Slab & Reibung)', '/images/walls/six-a-slab.jpg', 4);

END ;
