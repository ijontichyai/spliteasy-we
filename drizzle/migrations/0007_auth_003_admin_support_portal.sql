CREATE OR REPLACE FUNCTION public.support_portal(_action text, _id uuid DEFAULT NULL, _target public.support_target DEFAULT 'account', _plan uuid DEFAULT NULL, _token text DEFAULT NULL, _topic text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); adm boolean; r jsonb; g support_grants%ROWTYPE;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','NOT_AUTHENTICATED'); END IF;
  adm := coalesce(public.is_admin(),false);
  IF _action IN ('admin','accept','start','view','exit') AND NOT adm THEN
    PERFORM public.log_admin_action('support.portal.'||_action,'support_session',_id,'denied','admin only','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  CASE _action
  WHEN 'workspace' THEN
    r := jsonb_build_object('ok',true,'admin',adm,'user_id',uid,
      'requests',(SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.created_at DESC),'[]'::jsonb) FROM public.support_requests s WHERE s.user_id=uid),
      'grants',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'request_id',s.request_id,'user_id',s.user_id,'staff_id',s.staff_id,'target',s.target,'plan_id',s.plan_id,'needs_organizer',s.needs_organizer,'organizer_approved_at',s.organizer_approved_at,'start_deadline',s.start_deadline,'started_at',s.started_at,'expires_at',s.expires_at,'ended_at',s.ended_at,'revoked_at',s.revoked_at) ORDER BY s.authorized_at DESC),'[]'::jsonb) FROM public.support_grants s WHERE s.user_id=uid OR (s.plan_id IS NOT NULL AND public.plan_role(s.plan_id)='owner')),
      'plans',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name)),'[]'::jsonb) FROM public.plans p WHERE public.is_plan_member(p.id)),
      'notifications',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',n.id,'grant_id',n.grant_id,'starts_at',n.starts_at,'ends_at',n.ends_at) ORDER BY n.created_at DESC),'[]'::jsonb) FROM public.support_notifications n WHERE n.user_id=uid));
  WHEN 'admin' THEN
    r := jsonb_build_object('ok',true,'requests',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'user_id',s.user_id,'status',s.status,'assigned_to',s.assigned_to,'created_at',s.created_at,'providers',(SELECT coalesce(jsonb_agg(DISTINCT i.provider),'[]'::jsonb) FROM auth.identities i WHERE i.user_id=s.user_id)) ORDER BY s.created_at DESC),'[]'::jsonb) FROM public.support_requests s),
      'grants',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'request_id',s.request_id,'user_id',s.user_id,'staff_id',s.staff_id,'target',s.target,'plan_id',s.plan_id,'needs_organizer',s.needs_organizer,'organizer_approved_at',s.organizer_approved_at,'start_deadline',s.start_deadline,'started_at',s.started_at,'expires_at',s.expires_at,'ended_at',s.ended_at,'revoked_at',s.revoked_at) ORDER BY s.authorized_at DESC),'[]'::jsonb) FROM public.support_grants s WHERE s.staff_id=uid));
  WHEN 'request' THEN r := public.support_request_create(_topic);
  WHEN 'accept' THEN r := public.support_request_accept(_id);
  WHEN 'authorize' THEN r := public.support_grant_authorize(_id,_target,_plan);
  WHEN 'approve' THEN r := public.support_grant_approve_plan(_id);
  WHEN 'reject' THEN
    SELECT * INTO g FROM public.support_grants WHERE id=_id;
    IF NOT FOUND OR g.plan_id IS NULL OR public.plan_role(g.plan_id) IS DISTINCT FROM 'owner'::public.member_role OR g.staff_id=uid THEN
      r := jsonb_build_object('ok',false,'error','FORBIDDEN');
    ELSE r := public.support_grant_revoke(_id); END IF;
  WHEN 'revoke' THEN r := public.support_grant_revoke(_id);
  WHEN 'start' THEN
    SELECT * INTO g FROM public.support_grants WHERE id=_id;
    IF FOUND AND g.ended_at IS NOT NULL THEN r := jsonb_build_object('ok',false,'error','ENDED');
    ELSE r := public.support_session_start(_id,_token); END IF;
  WHEN 'view' THEN
    SELECT * INTO g FROM public.support_grants WHERE id=_id;
    IF NOT FOUND THEN r := jsonb_build_object('ok',false,'error','NOT_FOUND');
    ELSIF g.target='account' THEN r := public.support_view_account(_id);
    ELSE r := public.support_view_plan(_id); END IF;
  WHEN 'exit' THEN r := public.support_session_end(_id);
  ELSE r := jsonb_build_object('ok',false,'error','INVALID_ACTION');
  END CASE;
  PERFORM public.log_admin_action('support.portal.'||_action,'support_session',_id,CASE WHEN coalesce((r->>'ok')::boolean,false) THEN 'success' ELSE 'denied' END,'protected support portal',jsonb_build_object('error',r->>'error'));
  RETURN r;
END $$;
REVOKE EXECUTE ON FUNCTION public.support_portal(text,uuid,public.support_target,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.support_portal(text,uuid,public.support_target,uuid,text,text) TO authenticated;