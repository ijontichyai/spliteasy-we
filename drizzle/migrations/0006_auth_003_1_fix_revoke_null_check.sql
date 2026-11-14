CREATE OR REPLACE FUNCTION public.support_grant_revoke(_grant uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g support_grants%ROWTYPE; v_allowed boolean;
BEGIN
  SELECT * INTO g FROM support_grants WHERE id=_grant FOR UPDATE;
  v_allowed := FOUND AND coalesce(
      g.user_id = auth.uid()
      OR public.is_admin()
      OR (g.plan_id IS NOT NULL AND public.plan_role(g.plan_id) IS NOT DISTINCT FROM 'owner'::member_role), false);
  IF NOT v_allowed THEN
    PERFORM log_admin_action('support.session.revoke','support_session',_grant,'denied','not allowed','{"error":"FORBIDDEN"}');
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN');
  END IF;
  IF g.revoked_at IS NOT NULL THEN RETURN jsonb_build_object('ok',true,'noop',true); END IF;
  UPDATE support_grants SET revoked_at=now(), revoked_by=auth.uid(), ended_at=coalesce(ended_at,now()), end_reason=coalesce(end_reason,'revoked') WHERE id=_grant;
  PERFORM log_admin_action('support.session.revoke','support_session',_grant,'success','revoked', jsonb_build_object('support_session_id',_grant,'user_id',g.user_id,'revoked_by',auth.uid()));
  RETURN jsonb_build_object('ok',true);
END $$;