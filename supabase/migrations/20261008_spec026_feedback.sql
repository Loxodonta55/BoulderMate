-- SPEC-026: Nutzer-Feedback an das App-Team
-- Einmalig im Supabase SQL-Editor ausführen. Rein additiv, bestehende Daten bleiben unverändert.
-- Lesen: Table Editor → app_feedback (neueste zuerst). Status von Hand auf 'gelesen' / 'erledigt' setzen.

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id          UUID PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID,
  nickname    TEXT,
  email       TEXT,
  contact_ok  BOOLEAN NOT NULL DEFAULT false,
  category    TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'praise')),
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  gym_id      TEXT,
  gym_name    TEXT,
  app_view    TEXT,
  user_agent  TEXT,
  screen      TEXT,
  status      TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu', 'gelesen', 'erledigt')),
  CONSTRAINT app_feedback_email_only_with_consent CHECK (contact_ok OR email IS NULL)
);

CREATE INDEX IF NOT EXISTS app_feedback_created_at_idx ON public.app_feedback (created_at DESC);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- Nur Schreiben. Bewusst KEINE Select-/Update-/Delete-Regel: Feedback ist nur im Dashboard lesbar.
DROP POLICY IF EXISTS "Insert app_feedback" ON public.app_feedback;
CREATE POLICY "Insert app_feedback" ON public.app_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'neu');

-- Kontrolle: SELECT created_at, category, nickname, gym_name, message, status FROM public.app_feedback ORDER BY created_at DESC;
