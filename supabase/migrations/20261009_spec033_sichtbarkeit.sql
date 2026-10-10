-- SPEC-033 · Sichtbarkeit: «In Listen zeigen» (Wer war schon oben, Bewertungen, Beta)
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.
-- Der Code kommt ohne die Spalte aus (dann gilt «sichtbar»).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS show_in_lists BOOLEAN NOT NULL DEFAULT true;

-- Lesen: die Spalte gehört zu den öffentlich lesbaren Spalten (E-Mail bleibt gesperrt, SPEC-028 F13)
GRANT SELECT (show_in_lists) ON public.user_profiles TO anon, authenticated;
-- Ändern: nur das eigene Profil (Regel «Own profile update» aus SPEC-024 gilt weiter)
GRANT UPDATE (show_in_lists) ON public.user_profiles TO authenticated;

-- Kontrolle:
-- SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--   WHERE table_name = 'user_profiles' AND column_name IN ('show_in_lists', 'email') ORDER BY 1, 2, 3;
