-- SPEC-045 §6 / AC-12: Konto in der App löschen (Apple-Pflicht, gilt auch fürs Web)
-- Löscht ausschließlich das Konto der aufrufenden Person (auth.uid()).
-- Begehungen, Bewertungen, Profil, Treff, Challenge, Gruppen hängen mit ON DELETE CASCADE an auth.users.
-- Verweise ohne CASCADE (angelegt von, ernannt von, geschraubt von) werden vorher auf NULL gesetzt,
-- damit Hallen, Boulder und Teams erhalten bleiben.
-- Einspielen: Supabase-Dashboard → SQL Editor → diese Datei ausführen.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  me UUID := auth.uid();
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet';
  END IF;

  UPDATE public.gyms        SET created_by   = NULL WHERE created_by   = me;
  UPDATE public.gym_members SET appointed_by = NULL WHERE appointed_by = me;
  UPDATE public.boulders    SET setter_id    = NULL WHERE setter_id    = me;
  UPDATE public.app_feedback SET user_id     = NULL WHERE user_id      = me;

  DELETE FROM auth.users WHERE id = me;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
