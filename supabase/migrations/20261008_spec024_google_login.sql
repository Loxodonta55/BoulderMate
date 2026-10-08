-- SPEC-024: Login mit Google-Konto
-- Einmalig im Supabase SQL-Editor ausführen. Kann gefahrlos mehrfach laufen.
-- 1) Jeder neue Nutzer (Google oder E-Mail) bekommt automatisch eine Zeile in user_profiles.
-- 2) Bestehende Nutzer ohne Profil bekommen sie nachträglich.
-- 3) Jeder darf nur sein eigenes Profil ändern, und nur Name und Bild (nie is_platform_admin).

-- 1. Profil beim Anlegen eines Nutzers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nickname', ''),
      NULLIF(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Kletterer'
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fehlende Profile für bestehende Nutzer nachtragen
INSERT INTO public.user_profiles (id, email, nickname, avatar_url)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'nickname', ''),
    NULLIF(split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1), ''),
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
    'Kletterer'
  ),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 3. Eigenes Profil ändern: nur Name, Bild und Zeitstempel
DROP POLICY IF EXISTS "Own profile update" ON public.user_profiles;
CREATE POLICY "Own profile update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE INSERT, UPDATE ON public.user_profiles FROM anon, authenticated;
GRANT UPDATE (nickname, avatar_url, updated_at) ON public.user_profiles TO authenticated;
