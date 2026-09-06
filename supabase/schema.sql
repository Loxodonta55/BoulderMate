-- ============================================================
-- BoulderMate — Supabase Schema & Initial Setup
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. GYMS
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  logo_url TEXT,
  website TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. GYM MEMBERS (Rollen pro Halle)
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'setter', 'member')),
  appointed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_gym_user_role UNIQUE (gym_id, user_id, role)
);

-- 5. SECTORS (Wände / Bereiche)
CREATE TABLE IF NOT EXISTS public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wall_photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. GRADE SCALES (Farbsysteme der Halle)
CREATE TABLE IF NOT EXISTS public.grade_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  difficulty_label TEXT NOT NULL,
  font_range_min TEXT,
  font_range_max TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. BOULDERS (Routen & Pins)
DO  BEGIN
  CREATE TYPE boulder_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END ;

CREATE TABLE IF NOT EXISTS public.boulders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  grade_scale_id UUID NOT NULL REFERENCES public.grade_scales(id) ON DELETE RESTRICT,
  position_x REAL NOT NULL CHECK (position_x >= 0.0 AND position_x <= 1.0),
  position_y REAL NOT NULL CHECK (position_y >= 0.0 AND position_y <= 1.0),
  name TEXT,
  notes TEXT,
  setter_id UUID REFERENCES auth.users(id),
  status boulder_status NOT NULL DEFAULT 'draft',
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5) DEFAULT 3,
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5) DEFAULT 3,
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5) DEFAULT 3,
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5) DEFAULT 3,
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5) DEFAULT 3,
  font_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- 8. ASCENTS & RATINGS (Logbuch & Bewertungen)
CREATE TABLE IF NOT EXISTS public.ascents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id UUID NOT NULL REFERENCES public.boulders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ascent_style TEXT NOT NULL CHECK (ascent_style IN ('flash', 'onsight', 'top', 'project', 'repeat')),
  attempts INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_boulder_ascent UNIQUE (boulder_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boulder_id UUID NOT NULL REFERENCES public.boulders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perceived_difficulty TEXT CHECK (perceived_difficulty IN ('soft', 'fair', 'stiff', 'hard')),
  stars SMALLINT CHECK (stars BETWEEN 1 AND 5),
  radar_kraft SMALLINT CHECK (radar_kraft BETWEEN 1 AND 5),
  radar_technik SMALLINT CHECK (radar_technik BETWEEN 1 AND 5),
  radar_balance SMALLINT CHECK (radar_balance BETWEEN 1 AND 5),
  radar_koordination SMALLINT CHECK (radar_koordination BETWEEN 1 AND 5),
  radar_flexibilitaet SMALLINT CHECK (radar_flexibilitaet BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_boulder_rating UNIQUE (boulder_id, user_id)
);

-- 9. STORAGE BUCKET FUER WANDFOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sector-photos', 'sector-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Jeder darf Fotos lesen
CREATE POLICY "Public read for sector photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'sector-photos');

-- Storage Policy: Authentifizierte & Anon Upload (damit es direkt funktioniert)
CREATE POLICY "Public upload for sector photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sector-photos');

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boulders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ascents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Leserechte fuer alle (Open Access fuer Kletterer)
CREATE POLICY "Public read gyms" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Public read sectors" ON public.sectors FOR SELECT USING (true);
CREATE POLICY "Public read grade_scales" ON public.grade_scales FOR SELECT USING (true);
CREATE POLICY "Public read boulders" ON public.boulders FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read ascents" ON public.ascents FOR SELECT USING (true);
CREATE POLICY "Public read ratings" ON public.ratings FOR SELECT USING (true);

-- Schreibrechte (fuer schnellen Start zulaessig fuer authentifizierte Nutzer)
CREATE POLICY "Allow insert sectors" ON public.sectors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert boulders" ON public.boulders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert grade_scales" ON public.grade_scales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);
