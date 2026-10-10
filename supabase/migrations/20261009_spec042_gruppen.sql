-- SPEC-042 · Trainings-Gruppen
-- Reihenfolge: erst den neuen Code ausliefern, dann diese Datei im Supabase-SQL-Editor ausführen.

CREATE TABLE IF NOT EXISTS public.training_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  code           TEXT NOT NULL UNIQUE CHECK (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'),
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_nickname TEXT NOT NULL CHECK (char_length(owner_nickname) BETWEEN 1 AND 60),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_group_members (
  group_id  UUID NOT NULL REFERENCES public.training_groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname  TEXT NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 60),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Bin ich in dieser Gruppe (als Besitzer oder Mitglied)? Ohne Rekursion in den Regeln.
CREATE OR REPLACE FUNCTION public.tg_can_see(grp UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.training_groups g WHERE g.id = grp AND g.owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.training_group_members m WHERE m.group_id = grp AND m.user_id = auth.uid());
$$;

-- Höchstens 3 eigene Gruppen (F5)
CREATE OR REPLACE FUNCTION public.tg_owned_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.training_groups WHERE owner_id = auth.uid();
$$;

ALTER TABLE public.training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_group_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.training_groups, public.training_group_members FROM anon;

-- Gruppen: sehen nur Besitzer und Mitglieder; Codes lassen sich nicht durchsuchen
DROP POLICY IF EXISTS "tg read" ON public.training_groups;
CREATE POLICY "tg read" ON public.training_groups FOR SELECT TO authenticated USING (public.tg_can_see(id));
DROP POLICY IF EXISTS "tg insert" ON public.training_groups;
CREATE POLICY "tg insert" ON public.training_groups FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.tg_owned_count() < 3);
DROP POLICY IF EXISTS "tg delete" ON public.training_groups;
CREATE POLICY "tg delete" ON public.training_groups FOR DELETE TO authenticated USING (owner_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.training_groups TO authenticated;

-- Mitglieder: sehen Besitzer und Mitglieder; Beitreten nur über join_training_group();
-- Austreten (eigene Zeile) oder Entfernen (Besitzer)
DROP POLICY IF EXISTS "tgm read" ON public.training_group_members;
CREATE POLICY "tgm read" ON public.training_group_members FOR SELECT TO authenticated USING (public.tg_can_see(group_id));
DROP POLICY IF EXISTS "tgm delete" ON public.training_group_members;
CREATE POLICY "tgm delete" ON public.training_group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.training_groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));
GRANT SELECT, DELETE ON public.training_group_members TO authenticated;

-- Code prüfen (zeigt nur Name und Trainer, bevor man zustimmt)
CREATE OR REPLACE FUNCTION public.preview_training_group(group_code TEXT)
RETURNS TABLE (id UUID, name TEXT, owner_id UUID, owner_nickname TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name, g.owner_id, g.owner_nickname FROM public.training_groups g
  WHERE auth.uid() IS NOT NULL AND g.code = upper(group_code);
$$;
REVOKE ALL ON FUNCTION public.preview_training_group(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_training_group(TEXT) TO authenticated;

-- Beitreten mit Code (höchstens 40 Mitglieder); doppelter Beitritt ändert nichts
CREATE OR REPLACE FUNCTION public.join_training_group(group_code TEXT, member_nickname TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gid UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Bitte zuerst anmelden';
  END IF;
  SELECT g.id INTO gid FROM public.training_groups g WHERE g.code = upper(group_code);
  IF gid IS NULL THEN
    RAISE EXCEPTION 'Code unbekannt';
  END IF;
  IF EXISTS (SELECT 1 FROM public.training_group_members WHERE group_id = gid AND user_id = auth.uid()) THEN
    RETURN gid;
  END IF;
  IF (SELECT count(*) FROM public.training_group_members WHERE group_id = gid) >= 40 THEN
    RAISE EXCEPTION 'Gruppe voll';
  END IF;
  INSERT INTO public.training_group_members (group_id, user_id, nickname)
  VALUES (gid, auth.uid(), left(COALESCE(NULLIF(trim(member_nickname), ''), 'Kletterer'), 60));
  RETURN gid;
END;
$$;
REVOKE ALL ON FUNCTION public.join_training_group(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_training_group(TEXT, TEXT) TO authenticated;

-- Kontrolle:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'training_group%' ORDER BY 1, 2;
