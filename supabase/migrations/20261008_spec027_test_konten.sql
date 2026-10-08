-- ============================================================
-- SPEC-027: Test-Konten + «Ansehen als …»
-- Einmal im Supabase SQL-Editor ausführen. Mehrfach ausführen schadet nicht.
--
-- VORHER im Dashboard: Authentication → Users → «Add user» → «Create new user»,
-- jeweils mit Passwort und Haken bei «Auto Confirm User»:
--   test-admin@bouldermate.ch       (Hallen-Admin 6a Plus)
--   test-schrauber@bouldermate.ch   (Schrauber 6a Plus)
--   test-kletterer@bouldermate.ch   (nur Kletterer)
--
-- UND unten bei «2.» die Adresse deines eigenen Kontos eintragen (die Google-Adresse,
-- mit der du dich auf bouldermate.ch anmeldest). Dieses Konto wird Plattform-Admin und
-- bekommt den Umschalter «Ansehen als …».
-- ============================================================

-- 1. Jeder angemeldete Nutzer darf seine eigenen Hallen-Rollen lesen
--    (sonst kennt die App die Rollen der Test-Konten nicht)
DROP POLICY IF EXISTS "Read own memberships" ON public.gym_members;
CREATE POLICY "Read own memberships" ON public.gym_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Plattform-Admins (sehen «Ansehen als …»)
INSERT INTO public.user_profiles (id, email, nickname, is_platform_admin)
SELECT u.id, u.email, COALESCE(NULLIF(split_part(u.email, '@', 1), ''), 'Admin'), true
FROM auth.users u
WHERE lower(u.email) IN (
  lower('DEINE-ADRESSE@gmail.com'),   -- ← hier deine Adresse eintragen
  'boris@bouldermate.ch'
)
ON CONFLICT (id) DO UPDATE SET is_platform_admin = true;

-- 3. Profile der Test-Konten (Name in der App)
INSERT INTO public.user_profiles (id, email, nickname)
SELECT u.id, u.email, t.nickname
FROM auth.users u
JOIN (VALUES
  ('test-admin@bouldermate.ch', 'Test Admin'),
  ('test-schrauber@bouldermate.ch', 'Test Schrauber'),
  ('test-kletterer@bouldermate.ch', 'Test Kletterer')
) AS t(email, nickname) ON lower(u.email) = t.email
ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_platform_admin = false;

-- 4. Rollen in der Halle «6a Plus» (Admin schließt Schrauber ein)
INSERT INTO public.gym_members (gym_id, user_id, role)
SELECT g.id, u.id, t.role
FROM auth.users u
JOIN (VALUES
  ('test-admin@bouldermate.ch', 'admin'),
  ('test-schrauber@bouldermate.ch', 'setter')
) AS t(email, role) ON lower(u.email) = t.email
CROSS JOIN (
  SELECT id FROM public.gyms WHERE name ILIKE '6a%plus%' ORDER BY created_at LIMIT 1
) AS g
ON CONFLICT ON CONSTRAINT uq_gym_user_role DO NOTHING;

-- 5. Kontrolle: sollte die Test-Konten mit ihren Rollen zeigen
SELECT p.email, p.nickname, p.is_platform_admin, m.role, g.name AS halle
FROM public.user_profiles p
LEFT JOIN public.gym_members m ON m.user_id = p.id
LEFT JOIN public.gyms g ON g.id = m.gym_id
WHERE p.is_platform_admin OR p.email LIKE 'test-%@bouldermate.ch'
ORDER BY p.email;
