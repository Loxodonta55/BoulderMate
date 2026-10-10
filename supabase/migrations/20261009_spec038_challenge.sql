-- SPEC-038 · Hallen-Challenge
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.
-- Unabhängig von SPEC-034 (eigene Prüfung «Admin der Halle»).

CREATE TABLE IF NOT EXISTS public.challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  rule        TEXT NOT NULL CHECK (rule IN ('new', 'sector')),
  -- Sektor als Text (lokale oder Supabase-ID), weil die App beide Formen kennt
  sector_id   TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT challenge_dates CHECK (ends_at > starts_at AND ends_at <= starts_at + interval '32 days'),
  CONSTRAINT challenge_sector CHECK (rule = 'new' OR sector_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS challenges_gym_idx ON public.challenges (gym_id, ends_at);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname     TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 60),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

CREATE OR REPLACE FUNCTION public.challenge_is_gym_admin(gym UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    COALESCE((SELECT is_platform_admin FROM public.user_profiles WHERE id = auth.uid()), false)
    OR EXISTS (SELECT 1 FROM public.gym_members m WHERE m.gym_id = gym AND m.user_id = auth.uid() AND m.role = 'admin')
  );
$$;
REVOKE ALL ON FUNCTION public.challenge_is_gym_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.challenge_is_gym_admin(UUID) TO authenticated;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.challenges, public.challenge_participants FROM anon;

-- Challenges: lesen alle Angemeldeten, schreiben nur Admins der Halle
DROP POLICY IF EXISTS "challenges read" ON public.challenges;
CREATE POLICY "challenges read" ON public.challenges FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "challenges admin insert" ON public.challenges;
CREATE POLICY "challenges admin insert" ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.challenge_is_gym_admin(gym_id));
DROP POLICY IF EXISTS "challenges admin update" ON public.challenges;
CREATE POLICY "challenges admin update" ON public.challenges FOR UPDATE TO authenticated
  USING (public.challenge_is_gym_admin(gym_id)) WITH CHECK (public.challenge_is_gym_admin(gym_id));
DROP POLICY IF EXISTS "challenges admin delete" ON public.challenges;
CREATE POLICY "challenges admin delete" ON public.challenges FOR DELETE TO authenticated
  USING (public.challenge_is_gym_admin(gym_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;

-- Teilnehmer: Rangliste lesen nur Angemeldete; nur die eigene Zeile anlegen/ändern/löschen
DROP POLICY IF EXISTS "challenge_participants read" ON public.challenge_participants;
CREATE POLICY "challenge_participants read" ON public.challenge_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "challenge_participants own insert" ON public.challenge_participants;
CREATE POLICY "challenge_participants own insert" ON public.challenge_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "challenge_participants own update" ON public.challenge_participants;
CREATE POLICY "challenge_participants own update" ON public.challenge_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "challenge_participants own delete" ON public.challenge_participants;
CREATE POLICY "challenge_participants own delete" ON public.challenge_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;

-- Kontrolle:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'challenge%' ORDER BY 1, 2;
