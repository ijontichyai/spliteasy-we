CREATE TYPE public.support_target AS ENUM ('account','plan');

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  topic text NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','closed')),
  assigned_to uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.support_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.support_requests(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  staff_id uuid NOT NULL REFERENCES public.profiles(id),
  target public.support_target NOT NULL,
  plan_id uuid REFERENCES public.plans(id),
  needs_organizer boolean NOT NULL DEFAULT false,
  organizer_approved_by uuid REFERENCES public.profiles(id),
  organizer_approved_at timestamptz,
  nonce_hash text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  start_deadline timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  started_at timestamptz,
  expires_at timestamptz,
  ended_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id),
  end_reason text,
  CHECK ((target = 'plan') = (plan_id IS NOT NULL)),
  CHECK (expires_at IS NULL OR (started_at IS NOT NULL AND expires_at <= started_at + interval '15 minutes'))
);
CREATE INDEX support_grants_user_idx ON public.support_grants(user_id);
CREATE INDEX support_grants_staff_idx ON public.support_grants(staff_id);

CREATE TABLE public.support_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  grant_id uuid NOT NULL REFERENCES public.support_grants(id),
  kind text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX support_notifications_user_idx ON public.support_notifications(user_id);

REVOKE ALL ON public.support_requests, public.support_grants, public.support_notifications FROM anon, authenticated;
GRANT SELECT ON public.support_requests TO authenticated;
GRANT SELECT (id, request_id, user_id, staff_id, target, plan_id, needs_organizer, organizer_approved_by, organizer_approved_at,
  used, authorized_at, start_deadline, started_at, expires_at, ended_at, revoked_at, revoked_by, end_reason) ON public.support_grants TO authenticated;
GRANT SELECT ON public.support_notifications TO authenticated;
GRANT ALL ON public.support_requests, public.support_grants, public.support_notifications TO service_role;

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_support_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'support')
$$;

CREATE POLICY "Support requests read" ON public.support_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR assigned_to = auth.uid() OR public.is_admin());
CREATE POLICY "Support grants read" ON public.support_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR staff_id = auth.uid() OR (plan_id IS NOT NULL AND public.plan_role(plan_id) = 'owner'));
CREATE POLICY "Own support notifications" ON public.support_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Internal: validates an active session for the caller. Returns error code or NULL. Lazily marks expiry.
CREATE OR REPLACE FUNCTION public.assert_support_grant(_grant uuid, _target public.support_target)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g support_grants%ROWTYPE;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant;
  IF NOT FOUND THEN RETURN 'NOT_FOUND'; END IF;
  IF g.staff_id <> auth.uid() THEN RETURN 'NOT_ASSIGNED'; END IF;
  IF NOT public.is_support_staff() THEN RETURN 'NOT_STAFF'; END IF;
  IF g.revoked_at IS NOT NULL THEN RETURN 'REVOKED'; END IF;
  IF g.started_at IS NULL THEN RETURN 'NOT_STARTED'; END IF;
  IF g.ended_at IS NOT NULL THEN RETURN CASE WHEN g.end_reason='expired' THEN 'EXPIRED' ELSE 'ENDED' END; END IF;
  IF now() >= g.expires_at THEN
    UPDATE support_grants SET ended_at=g.expires_at, end_reason='expired' WHERE id=_grant AND ended_at IS NULL;
    PERFORM log_admin_action('support.session.expire','support_session',_grant,'success','auto',
      jsonb_build_object('support_session_id',_grant,'user_id',g.user_id,'expires_at',g.expires_at));
    RETURN 'EXPIRED';
  END IF;
  IF g.target <> _target THEN RETURN 'OUT_OF_SCOPE'; END IF;
  IF g.target='plan' AND NOT EXISTS (SELECT 1 FROM plan_members WHERE plan_id=g.plan_id AND user_id=g.user_id AND status='active') THEN
    RETURN 'USER_NO_LONGER_MEMBER';
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.support_request_create(_topic text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','NOT_AUTHENTICATED'); END IF;
  IF _topic IS NULL OR char_length(trim(_topic)) NOT BETWEEN 1 AND 500 THEN RETURN jsonb_build_object('ok',false,'error','INVALID_TOPIC'); END IF;
  IF (SELECT count(*) FROM support_requests WHERE user_id=uid AND status <> 'closed') >= 3 THEN
    PERFORM log_admin_action('support.request.create','user',uid,'denied','rate limit','{"error":"TOO_MANY_OPEN"}');
    RETURN jsonb_build_object('ok',false,'error','TOO_MANY_OPEN');
  END IF;
  INSERT INTO support_requests(user_id, topic) VALUES (uid, trim(_topic)) RETURNING id INTO v_id;
  PERFORM log_admin_action('support.request.create','support_request',v_id,'success','user request', jsonb_build_object('user_id',uid));
  RETURN jsonb_build_object('ok',true,'id',v_id);
END $$;

CREATE OR REPLACE FUNCTION public.support_request_accept(_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r support_requests%ROWTYPE;
BEGIN
  IF NOT public.is_support_staff() THEN
    PERFORM log_admin_action('support.request.accept','support_request',_request,'denied','not staff','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  SELECT * INTO r FROM support_requests WHERE id=_request FOR UPDATE;
  IF NOT FOUND OR r.status <> 'requested' THEN RETURN jsonb_build_object('ok',false,'error','INVALID_STATE'); END IF;
  IF r.user_id = auth.uid() THEN
    PERFORM log_admin_action('support.request.accept','support_request',_request,'denied','own request','{"error":"SELF_SUPPORT"}');
    RETURN jsonb_build_object('ok',false,'error','SELF_SUPPORT');
  END IF;
  UPDATE support_requests SET status='accepted', assigned_to=auth.uid() WHERE id=_request;
  PERFORM log_admin_action('support.request.accept','support_request',_request,'success','assigned', jsonb_build_object('user_id',r.user_id));
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.support_grant_authorize(_request uuid, _target public.support_target, _plan uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE uid uuid := auth.uid(); r support_requests%ROWTYPE; v_token text; v_id uuid; v_needs boolean := false;
BEGIN
  SELECT * INTO r FROM support_requests WHERE id=_request;
  IF uid IS NULL OR NOT FOUND OR r.user_id <> uid THEN
    PERFORM log_admin_action('support.grant.authorize','support_request',_request,'denied','not owner of request','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF r.status <> 'accepted' OR r.assigned_to IS NULL OR r.assigned_to = uid THEN RETURN jsonb_build_object('ok',false,'error','INVALID_STATE'); END IF;
  IF _target = 'plan' THEN
    IF _plan IS NULL OR NOT public.is_plan_member(_plan) THEN
      PERFORM log_admin_action('support.grant.authorize','plan',_plan,'denied','not member','{"error":"NOT_MEMBER"}');
      RETURN jsonb_build_object('ok',false,'error','NOT_MEMBER');
    END IF;
    v_needs := public.plan_role(_plan) <> 'owner';
  ELSIF _plan IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_TARGET');
  END IF;
  IF EXISTS (SELECT 1 FROM support_grants WHERE user_id=uid AND revoked_at IS NULL AND ended_at IS NULL
             AND ((started_at IS NULL AND start_deadline > now()) OR (started_at IS NOT NULL AND expires_at > now()))) THEN
    RETURN jsonb_build_object('ok',false,'error','GRANT_ALREADY_OPEN');
  END IF;
  v_token := encode(extensions.gen_random_bytes(32),'hex');
  INSERT INTO support_grants(request_id, user_id, staff_id, target, plan_id, needs_organizer, nonce_hash)
  VALUES (_request, uid, r.assigned_to, _target, CASE WHEN _target='plan' THEN _plan END, v_needs, encode(extensions.digest(v_token,'sha256'),'hex'))
  RETURNING id INTO v_id;
  PERFORM log_admin_action('support.grant.authorize','support_session',v_id,'success','user consent',
    jsonb_build_object('support_session_id',v_id,'user_id',uid,'staff_id',r.assigned_to,'target',_target,'plan_id',_plan,
      'scope','protected_view','authorization_method','in_app_consent','needs_organizer',v_needs));
  RETURN jsonb_build_object('ok',true,'grant_id',v_id,'token',v_token,'needs_organizer',v_needs);
END $$;

CREATE OR REPLACE FUNCTION public.support_grant_approve_plan(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g support_grants%ROWTYPE;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant FOR UPDATE;
  IF NOT FOUND OR g.plan_id IS NULL OR public.plan_role(g.plan_id) IS DISTINCT FROM 'owner' OR g.staff_id = auth.uid() THEN
    PERFORM log_admin_action('support.grant.organizer_approve','support_session',_grant,'denied','not organizer','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF NOT g.needs_organizer OR g.organizer_approved_at IS NOT NULL OR g.revoked_at IS NOT NULL OR g.used OR g.start_deadline <= now() THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_STATE');
  END IF;
  UPDATE support_grants SET organizer_approved_by=auth.uid(), organizer_approved_at=now() WHERE id=_grant;
  PERFORM log_admin_action('support.grant.organizer_approve','support_session',_grant,'success','organizer consent',
    jsonb_build_object('support_session_id',_grant,'plan_id',g.plan_id,'user_id',g.user_id));
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.support_session_start(_grant uuid, _token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE g support_grants%ROWTYPE; v_err text;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant FOR UPDATE;
  IF NOT FOUND THEN v_err := 'NOT_FOUND';
  ELSIF g.staff_id <> auth.uid() THEN v_err := 'NOT_ASSIGNED';
  ELSIF NOT public.is_support_staff() THEN v_err := 'NOT_STAFF';
  ELSIF g.revoked_at IS NOT NULL THEN v_err := 'REVOKED';
  ELSIF g.used THEN v_err := 'REPLAY';
  ELSIF g.start_deadline <= now() THEN v_err := 'EXPIRED';
  ELSIF g.nonce_hash <> encode(extensions.digest(coalesce(_token,''),'sha256'),'hex') THEN v_err := 'BAD_TOKEN';
  ELSIF g.needs_organizer AND g.organizer_approved_at IS NULL THEN v_err := 'ORGANIZER_APPROVAL_REQUIRED';
  END IF;
  IF v_err IS NOT NULL THEN
    PERFORM log_admin_action('support.session.start','support_session',_grant,'denied',v_err, jsonb_build_object('support_session_id',_grant,'error',v_err));
    RETURN jsonb_build_object('ok',false,'error',v_err);
  END IF;
  UPDATE support_grants SET used=true, started_at=now(), expires_at=now()+interval '15 minutes' WHERE id=_grant RETURNING * INTO g;
  IF g.target='plan' THEN
    INSERT INTO support_notifications(user_id, grant_id, kind, starts_at, ends_at)
    SELECT pm.user_id, g.id, 'support_session_on_shared_plan', g.started_at, g.expires_at
    FROM plan_members pm WHERE pm.plan_id=g.plan_id AND pm.status='active' AND pm.user_id <> g.staff_id;
  END IF;
  PERFORM log_admin_action('support.session.start','support_session',_grant,'success','session started',
    jsonb_build_object('support_session_id',_grant,'user_id',g.user_id,'target',g.target,'plan_id',g.plan_id,
      'started_at',g.started_at,'expires_at',g.expires_at,'scope','protected_view'));
  RETURN jsonb_build_object('ok',true,'expires_at',g.expires_at);
END $$;

CREATE OR REPLACE FUNCTION public.support_view_account(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_err text; g support_grants%ROWTYPE; v jsonb;
BEGIN
  v_err := public.assert_support_grant(_grant,'account');
  IF v_err IS NOT NULL THEN
    PERFORM log_admin_action('support.view','support_session',_grant,'denied',v_err, jsonb_build_object('support_session_id',_grant,'resource','account','error',v_err));
    RETURN jsonb_build_object('ok',false,'error',v_err);
  END IF;
  SELECT * INTO g FROM support_grants WHERE id=_grant;
  SELECT jsonb_build_object(
    'user','Tú',
    'locale',(SELECT locale FROM profiles WHERE id=g.user_id),
    'member_since_days_bucket',(SELECT CASE WHEN now()-created_at < interval '7 days' THEN '<7' WHEN now()-created_at < interval '30 days' THEN '7-30' ELSE '>30' END FROM profiles WHERE id=g.user_id),
    'active_plans_member',(SELECT count(*) FROM plan_members pm JOIN plans p ON p.id=pm.plan_id WHERE pm.user_id=g.user_id AND pm.status='active' AND p.archived_at IS NULL),
    'active_plans_owned',(SELECT count(*) FROM plans WHERE owner_id=g.user_id AND archived_at IS NULL),
    'archived_plans_owned',(SELECT count(*) FROM plans WHERE owner_id=g.user_id AND archived_at IS NOT NULL),
    'free_limits',(SELECT jsonb_build_object('max_active_owned_plans',max_active_owned_plans,'max_members_per_plan',max_members_per_plan) FROM plan_limits WHERE tier='free'),
    'free_plan_limit_reached',(SELECT count(*) FROM plans WHERE owner_id=g.user_id AND archived_at IS NULL) >= coalesce((SELECT max_active_owned_plans FROM plan_limits WHERE tier='free'),1000000)
  ) INTO v;
  PERFORM log_admin_action('support.view','support_session',_grant,'success','protected view', jsonb_build_object('support_session_id',_grant,'resource','account'));
  RETURN jsonb_build_object('ok',true,'view',v,'protected',true);
END $$;

CREATE OR REPLACE FUNCTION public.support_view_plan(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_err text; g support_grants%ROWTYPE; p plans%ROWTYPE; v jsonb; v_bal numeric;
BEGIN
  v_err := public.assert_support_grant(_grant,'plan');
  IF v_err IS NOT NULL THEN
    PERFORM log_admin_action('support.view','support_session',_grant,'denied',v_err, jsonb_build_object('support_session_id',_grant,'resource','plan','error',v_err));
    RETURN jsonb_build_object('ok',false,'error',v_err);
  END IF;
  SELECT * INTO g FROM support_grants WHERE id=_grant;
  SELECT * INTO p FROM plans WHERE id=g.plan_id;
  SELECT coalesce(sum(x),0) INTO v_bal FROM (
    SELECT sum(e.amount) x FROM expenses e WHERE e.plan_id=p.id AND e.deleted_at IS NULL
    UNION ALL SELECT -sum(sh.amount) FROM expense_shares sh JOIN expenses e ON e.id=sh.expense_id WHERE e.plan_id=p.id AND e.deleted_at IS NULL) t;
  SELECT jsonb_build_object(
    'plan','Plan 1','type',p.type,'status',p.status,'archived',p.archived_at IS NOT NULL,
    'starts',CASE WHEN p.start_date IS NULL THEN 'sin fecha' WHEN p.start_date < current_date THEN 'pasado'
                  WHEN p.start_date - current_date <= 7 THEN 'esta semana' WHEN p.start_date - current_date <= 31 THEN 'este mes' ELSE 'más adelante' END,
    'has_city',p.city IS NOT NULL,'has_budget',p.estimated_budget IS NOT NULL,
    'members',(SELECT jsonb_agg(jsonb_build_object('label',CASE WHEN m.user_id=g.user_id THEN 'Tú' ELSE 'Participante '||m.rn END,'role',m.role,'status',m.status) ORDER BY m.rn)
               FROM (SELECT pm.*, row_number() OVER (ORDER BY pm.joined_at, pm.id) rn FROM plan_members pm WHERE pm.plan_id=p.id) m),
    'member_limit_reached',(SELECT count(*) FROM plan_members WHERE plan_id=p.id AND status='active') >= coalesce((SELECT max_members_per_plan FROM plan_limits WHERE tier='free'),1000000),
    'places',(SELECT coalesce(jsonb_agg(jsonb_build_object('label','Lugar '||rn,'category',category,'status',status) ORDER BY rn),'[]'::jsonb)
              FROM (SELECT pl.category, pp.status, row_number() OVER (ORDER BY pp.created_at, pp.id) rn FROM plan_places pp JOIN places pl ON pl.id=pp.place_id WHERE pp.plan_id=p.id) q),
    'expenses_count',(SELECT count(*) FROM expenses WHERE plan_id=p.id AND deleted_at IS NULL),
    'expenses_deleted_count',(SELECT count(*) FROM expenses WHERE plan_id=p.id AND deleted_at IS NOT NULL),
    'expense_categories',(SELECT coalesce(jsonb_object_agg(category,n),'{}'::jsonb) FROM (SELECT category, count(*) n FROM expenses WHERE plan_id=p.id AND deleted_at IS NULL GROUP BY 1) c),
    'shares_consistent',v_bal = 0,
    'settlements',(SELECT coalesce(jsonb_object_agg(status,n),'{}'::jsonb) FROM (SELECT status, count(*) n FROM settlements WHERE plan_id=p.id GROUP BY 1) s),
    'open_invitations',(SELECT count(*) FROM invitations WHERE plan_id=p.id AND revoked_at IS NULL AND expires_at > now() AND use_count < max_uses)
  ) INTO v;
  PERFORM log_admin_action('support.view','support_session',_grant,'success','protected view', jsonb_build_object('support_session_id',_grant,'resource','plan','plan_id',g.plan_id));
  RETURN jsonb_build_object('ok',true,'view',v,'protected',true);
END $$;

CREATE OR REPLACE FUNCTION public.support_session_end(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g support_grants%ROWTYPE;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant FOR UPDATE;
  IF NOT FOUND OR (g.staff_id <> auth.uid() AND g.user_id <> auth.uid()) THEN
    PERFORM log_admin_action('support.session.end','support_session',_grant,'denied','not participant','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF g.ended_at IS NOT NULL OR g.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'noop',true); END IF;
  UPDATE support_grants SET ended_at=now(), end_reason=CASE WHEN auth.uid()=g.staff_id THEN 'ended_by_staff' ELSE 'ended_by_user' END WHERE id=_grant;
  PERFORM log_admin_action('support.session.end','support_session',_grant,'success','ended', jsonb_build_object('support_session_id',_grant,'user_id',g.user_id,'ended_at',now()));
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.support_grant_revoke(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g support_grants%ROWTYPE;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant FOR UPDATE;
  IF NOT FOUND OR NOT (g.user_id = auth.uid() OR public.is_admin()
      OR (g.plan_id IS NOT NULL AND public.plan_role(g.plan_id) = 'owner')) THEN
    PERFORM log_admin_action('support.session.revoke','support_session',_grant,'denied','not allowed','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF g.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'noop',true); END IF;
  UPDATE support_grants SET revoked_at=now(), revoked_by=auth.uid(), ended_at=coalesce(ended_at,now()), end_reason=coalesce(end_reason,'revoked') WHERE id=_grant;
  PERFORM log_admin_action('support.session.revoke','support_session',_grant,'success','revoked', jsonb_build_object('support_session_id',_grant,'user_id',g.user_id,'revoked_by',auth.uid()));
  RETURN jsonb_build_object('ok',true);
END $$;

REVOKE EXECUTE ON FUNCTION public.assert_support_grant(uuid, public.support_target) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_support_staff() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_request_create(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_request_accept(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_grant_authorize(uuid, public.support_target, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_grant_approve_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_session_start(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_view_account(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_view_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_session_end(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_grant_revoke(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_support_staff(), public.support_request_create(text), public.support_request_accept(uuid),
  public.support_grant_authorize(uuid, public.support_target, uuid), public.support_grant_approve_plan(uuid),
  public.support_session_start(uuid, text), public.support_view_account(uuid), public.support_view_plan(uuid),
  public.support_session_end(uuid), public.support_grant_revoke(uuid) TO authenticated;