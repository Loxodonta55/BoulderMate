-- AC-8: Nach der Notfall-Datei ist Schreiben wieder offen
\set ON_ERROR_STOP 1
DO $$
DECLARE ok boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  SET LOCAL ROLE anon;
  INSERT INTO public.sectors (gym_id, name) VALUES ('10000000-0000-0000-0000-00000000000a', 'Notfall-Test');
  RESET ROLE;
  DELETE FROM public.sectors WHERE name = 'Notfall-Test';
  RAISE NOTICE 'ok  AC-8 Notfall: anon kann wieder schreiben';
END $$;
