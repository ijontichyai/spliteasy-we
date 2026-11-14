CREATE OR REPLACE FUNCTION public.shares_plan_with(_other uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM plan_members a JOIN plan_members b ON a.plan_id=b.plan_id
    WHERE a.user_id=auth.uid() AND a.status='active' AND b.user_id=_other AND b.status='active')
$$;

REVOKE UPDATE ON public.plans FROM anon, authenticated;
REVOKE ALL ON public.plans FROM anon;
GRANT UPDATE (name, type, start_date, end_date, city, estimated_budget, status) ON public.plans TO authenticated;

CREATE OR REPLACE FUNCTION public.plans_protect_columns()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF current_user = 'authenticated' AND (
     NEW.premium_sponsored IS DISTINCT FROM OLD.premium_sponsored OR
     NEW.sponsor_id IS DISTINCT FROM OLD.sponsor_id OR
     NEW.owner_id IS DISTINCT FROM OLD.owner_id OR
     NEW.archived_at IS DISTINCT FROM OLD.archived_at OR
     NEW.archived_by IS DISTINCT FROM OLD.archived_by OR
     NEW.currency IS DISTINCT FROM OLD.currency OR
     NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'protected column';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS plans_protect ON public.plans;
CREATE TRIGGER plans_protect BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.plans_protect_columns();