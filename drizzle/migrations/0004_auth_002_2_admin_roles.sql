CREATE TYPE public.app_role AS ENUM ('admin','support');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  note text
);
CREATE UNIQUE INDEX user_roles_active_uq ON public.user_roles(user_id, role) WHERE revoked_at IS NULL;

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  result text NOT NULL CHECK (result IN ('success','denied','error')),
  reason text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log(created_at DESC);

REVOKE ALL ON public.user_roles FROM anon, authenticated;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND _user = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user AND role = _role AND revoked_at IS NULL)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read recent audit" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin() AND created_at > now() - interval '90 days');

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'audit log is immutable'; END $$;
CREATE TRIGGER admin_audit_log_immutable BEFORE UPDATE OR DELETE ON public.admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _target_type text, _target uuid, _result text, _reason text, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.admin_audit_log(actor_id, action, target_type, target_id, result, reason, details)
  VALUES (auth.uid(), _action, _target_type, _target, _result, coalesce(nullif(trim(_reason),''),'(sin motivo)'), coalesce(_details,'{}'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(text,text,uuid,text,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_user uuid, _role public.app_role, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    PERFORM public.log_admin_action('role.grant','user',_user,'denied',_reason, jsonb_build_object('role',_role,'error','FORBIDDEN'));
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN
    PERFORM public.log_admin_action('role.grant','user',_user,'denied',_reason, jsonb_build_object('role',_role,'error','REASON_REQUIRED'));
    RETURN jsonb_build_object('ok',false,'error','REASON_REQUIRED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_user AND deleted_at IS NULL) THEN
    PERFORM public.log_admin_action('role.grant','user',_user,'error',_reason, jsonb_build_object('role',_role,'error','USER_NOT_FOUND'));
    RETURN jsonb_build_object('ok',false,'error','USER_NOT_FOUND');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user AND role=_role AND revoked_at IS NULL) THEN
    PERFORM public.log_admin_action('role.grant','user',_user,'success',_reason, jsonb_build_object('role',_role,'noop',true));
    RETURN jsonb_build_object('ok',true,'noop',true);
  END IF;
  INSERT INTO public.user_roles(user_id, role, granted_by, note) VALUES (_user, _role, auth.uid(), trim(_reason));
  PERFORM public.log_admin_action('role.grant','user',_user,'success',_reason, jsonb_build_object('role',_role));
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user uuid, _role public.app_role, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admins int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    PERFORM public.log_admin_action('role.revoke','user',_user,'denied',_reason, jsonb_build_object('role',_role,'error','FORBIDDEN'));
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF _reason IS NULL OR trim(_reason) = '' THEN
    PERFORM public.log_admin_action('role.revoke','user',_user,'denied',_reason, jsonb_build_object('role',_role,'error','REASON_REQUIRED'));
    RETURN jsonb_build_object('ok',false,'error','REASON_REQUIRED');
  END IF;
  IF _role = 'admin' THEN
    PERFORM pg_advisory_xact_lock(hashtext('admin_roles'));
    SELECT count(*) INTO v_admins FROM public.user_roles WHERE role='admin' AND revoked_at IS NULL;
    IF _user = auth.uid() AND v_admins <= 1 THEN
      PERFORM public.log_admin_action('role.revoke','user',_user,'denied',_reason, jsonb_build_object('role',_role,'error','LAST_ADMIN'));
      RETURN jsonb_build_object('ok',false,'error','LAST_ADMIN');
    END IF;
  END IF;
  UPDATE public.user_roles SET revoked_at=now() WHERE user_id=_user AND role=_role AND revoked_at IS NULL;
  PERFORM public.log_admin_action('role.revoke','user',_user, CASE WHEN FOUND THEN 'success' ELSE 'error' END, _reason,
    jsonb_build_object('role',_role) || CASE WHEN FOUND THEN '{}'::jsonb ELSE '{"error":"NOT_ASSIGNED"}'::jsonb END);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_roles(_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    PERFORM public.log_admin_action('role.list',NULL,NULL,'denied',_reason,'{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  PERFORM public.log_admin_action('role.list',NULL,NULL,'success',_reason,'{}');
  RETURN jsonb_build_object('ok',true,'roles', coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',user_id,'role',role,'granted_at',granted_at))
    FROM public.user_roles WHERE revoked_at IS NULL),'[]'::jsonb));
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_role(uuid,public.app_role,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid,public.app_role,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_roles(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid,public.app_role,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid,public.app_role,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_roles(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;