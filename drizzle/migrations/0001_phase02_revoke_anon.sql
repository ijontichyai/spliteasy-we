REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.plan_limits FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.plan_limits FROM authenticated;