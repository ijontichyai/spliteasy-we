CREATE OR REPLACE FUNCTION public.remove_plan_member(_plan uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); my_role member_role; target_role member_role; bal numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT role INTO my_role FROM plan_members WHERE plan_id=_plan AND user_id=uid AND status='active';
  IF my_role IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'PLAN_READ_ONLY'; END IF;
  SELECT role INTO target_role FROM plan_members WHERE plan_id=_plan AND user_id=_user AND status='active' FOR UPDATE;
  IF target_role IS NULL THEN RAISE EXCEPTION 'NOT_MEMBER'; END IF;
  IF target_role='owner' THEN RAISE EXCEPTION 'OWNER_CANNOT_LEAVE'; END IF;
  IF _user<>uid AND NOT (my_role='owner' OR (my_role='admin' AND target_role='member')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT coalesce((SELECT sum(amount) FROM expenses WHERE plan_id=_plan AND deleted_at IS NULL AND paid_by=_user),0)
       - coalesce((SELECT sum(sh.amount) FROM expense_shares sh JOIN expenses e ON e.id=sh.expense_id WHERE e.plan_id=_plan AND e.deleted_at IS NULL AND sh.user_id=_user),0)
       + coalesce((SELECT sum(amount) FROM settlements WHERE plan_id=_plan AND status='confirmed' AND from_user=_user),0)
       - coalesce((SELECT sum(amount) FROM settlements WHERE plan_id=_plan AND status='confirmed' AND to_user=_user),0)
    INTO bal;
  IF bal<>0 THEN RAISE EXCEPTION 'BALANCE_NOT_ZERO'; END IF;
  UPDATE settlements SET status='cancelled' WHERE plan_id=_plan AND status='proposed' AND (from_user=_user OR to_user=_user);
  UPDATE plan_members SET status=CASE WHEN _user=uid THEN 'left'::member_status ELSE 'removed'::member_status END, left_at=now()
    WHERE plan_id=_plan AND user_id=_user;
END $$;
REVOKE EXECUTE ON FUNCTION public.remove_plan_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_plan_member(uuid, uuid) TO authenticated;