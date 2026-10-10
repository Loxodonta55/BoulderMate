-- Zustand wie in Prod vor SPEC-034: offene Regeln aus dem alten schema.sql
-- plus Regeln, die nur in Prod stehen (Namen unbekannt, A3).
DROP POLICY IF EXISTS "Allow insert sectors" ON public.sectors;
CREATE POLICY "Allow insert sectors" ON public.sectors FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert boulders" ON public.boulders;
CREATE POLICY "Allow insert boulders" ON public.boulders FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert grade_scales" ON public.grade_scales;
CREATE POLICY "Allow insert grade_scales" ON public.grade_scales FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow insert gyms" ON public.gyms;
CREATE POLICY "Allow insert gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "prod unbekannt ascents" ON public.ascents;
CREATE POLICY "prod unbekannt ascents" ON public.ascents FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "prod unbekannt ratings" ON public.ratings;
CREATE POLICY "prod unbekannt ratings" ON public.ratings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "prod unbekannt members" ON public.gym_members;
CREATE POLICY "prod unbekannt members" ON public.gym_members FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public upload for sector photos" ON storage.objects;
CREATE POLICY "Public upload for sector photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sector-photos');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gyms, public.sectors, public.grade_scales, public.boulders,
  public.gym_members, public.ascents, public.ratings TO anon, authenticated;
