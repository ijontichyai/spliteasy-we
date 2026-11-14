ALTER TABLE public.expenses
  ADD COLUMN split_method text NOT NULL DEFAULT 'equal',
  ADD COLUMN tip_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN split_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE public.expenses SET split_method = 'custom' WHERE split_type = 'custom';
ALTER TABLE public.expenses ADD CONSTRAINT expenses_split_method_chk CHECK (split_method IN ('equal','items','percent','custom'));
ALTER TABLE public.expenses ADD CONSTRAINT expenses_tip_chk CHECK (tip_amount >= 0 AND tip_amount < amount);

CREATE OR REPLACE FUNCTION public.expense_is_locked(_expense uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM expenses e JOIN settlements s ON s.plan_id = e.plan_id
    WHERE e.id = _expense AND s.status = 'confirmed' AND s.confirmed_at >= e.created_at)
$$;
REVOKE ALL ON FUNCTION public.expense_is_locked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expense_is_locked(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_expense_input(_plan uuid, _amount numeric, _paid_by uuid, _shares jsonb, _method text, _tip numeric)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_sum numeric; v_bad int; v_n int;
BEGIN
  IF _amount IS NULL OR _amount <= 0 OR _amount <> round(_amount, 2) THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF _method NOT IN ('equal','items','percent','custom') THEN RAISE EXCEPTION 'INVALID_SPLIT'; END IF;
  IF _tip IS NULL OR _tip < 0 OR _tip >= _amount OR _tip <> round(_tip, 2) THEN RAISE EXCEPTION 'INVALID_TIP'; END IF;
  IF jsonb_typeof(_shares) <> 'array' OR jsonb_array_length(_shares) = 0 THEN RAISE EXCEPTION 'NO_SHARES'; END IF;
  IF NOT EXISTS (SELECT 1 FROM plan_members WHERE plan_id=_plan AND user_id=_paid_by AND status='active') THEN RAISE EXCEPTION 'PAYER_NOT_MEMBER'; END IF;
  SELECT count(*) INTO v_bad FROM jsonb_array_elements(_shares) s
    WHERE NOT EXISTS (SELECT 1 FROM plan_members m WHERE m.plan_id=_plan AND m.status='active' AND m.user_id=(s->>'user_id')::uuid)
       OR (s->>'amount')::numeric < 0 OR (s->>'amount')::numeric <> round((s->>'amount')::numeric, 2);
  IF v_bad > 0 THEN RAISE EXCEPTION 'SHARE_NOT_MEMBER'; END IF;
  SELECT count(DISTINCT s->>'user_id'), count(*) INTO v_n, v_bad FROM jsonb_array_elements(_shares) s;
  IF v_n <> v_bad THEN RAISE EXCEPTION 'DUPLICATE_SHARE'; END IF;
  SELECT coalesce(sum((s->>'amount')::numeric),0) INTO v_sum FROM jsonb_array_elements(_shares) s;
  IF v_sum <> _amount THEN RAISE EXCEPTION 'SHARES_SUM_MISMATCH'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.validate_expense_input(uuid, numeric, uuid, jsonb, text, numeric) FROM PUBLIC, anon, authenticated;

DROP FUNCTION public.save_expense(uuid, text, expense_category, numeric, uuid, split_type, jsonb, uuid, date);
CREATE FUNCTION public.save_expense(_plan uuid, _description text, _category expense_category, _amount numeric, _paid_by uuid, _split split_type, _shares jsonb, _idempotency_key uuid, _date date DEFAULT CURRENT_DATE, _method text DEFAULT NULL, _tip numeric DEFAULT 0, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); v_id uuid; v_method text := coalesce(_method, _split::text); v_currency char(3);
BEGIN
  IF uid IS NULL OR NOT is_plan_member(_plan) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'PLAN_ARCHIVED'; END IF;
  SELECT id INTO v_id FROM expenses WHERE created_by=uid AND idempotency_key=_idempotency_key;
  IF FOUND THEN RETURN v_id; END IF;
  IF length(trim(coalesce(_description,''))) = 0 THEN RAISE EXCEPTION 'INVALID_DESCRIPTION'; END IF;
  PERFORM validate_expense_input(_plan, _amount, _paid_by, _shares, v_method, coalesce(_tip,0));
  SELECT currency INTO v_currency FROM plans WHERE id=_plan;
  INSERT INTO expenses(plan_id, paid_by, created_by, description, category, amount, currency, expense_date, split_type, idempotency_key, split_method, tip_amount, split_meta)
  VALUES (_plan, _paid_by, uid, trim(_description), _category, _amount, v_currency, coalesce(_date, current_date),
    CASE WHEN v_method = 'equal' THEN 'equal'::split_type ELSE 'custom'::split_type END, _idempotency_key, v_method, coalesce(_tip,0), coalesce(_meta,'{}'::jsonb))
  RETURNING id INTO v_id;
  INSERT INTO expense_shares(expense_id, user_id, amount)
  SELECT v_id, (s->>'user_id')::uuid, (s->>'amount')::numeric FROM jsonb_array_elements(_shares) s;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.save_expense(uuid, text, expense_category, numeric, uuid, split_type, jsonb, uuid, date, text, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_expense(uuid, text, expense_category, numeric, uuid, split_type, jsonb, uuid, date, text, numeric, jsonb) TO authenticated, service_role;

CREATE FUNCTION public.update_expense(_expense uuid, _expected_updated_at timestamptz, _description text, _category expense_category, _amount numeric, _paid_by uuid, _shares jsonb, _date date, _method text, _tip numeric, _meta jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e expenses%ROWTYPE;
BEGIN
  SELECT * INTO e FROM expenses WHERE id=_expense AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT is_plan_member(e.plan_id)
     OR (e.created_by <> auth.uid() AND plan_role(e.plan_id) NOT IN ('owner','admin')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(e.plan_id) THEN RAISE EXCEPTION 'PLAN_ARCHIVED'; END IF;
  IF expense_is_locked(_expense) THEN RAISE EXCEPTION 'EXPENSE_LOCKED'; END IF;
  IF _expected_updated_at IS NULL OR date_trunc('milliseconds', e.updated_at) <> date_trunc('milliseconds', _expected_updated_at) THEN RAISE EXCEPTION 'STALE_EXPENSE'; END IF;
  IF length(trim(coalesce(_description,''))) = 0 THEN RAISE EXCEPTION 'INVALID_DESCRIPTION'; END IF;
  PERFORM validate_expense_input(e.plan_id, _amount, _paid_by, _shares, _method, coalesce(_tip,0));
  UPDATE expenses SET description=trim(_description), category=_category, amount=_amount, paid_by=_paid_by,
    expense_date=coalesce(_date, e.expense_date), split_method=_method, tip_amount=coalesce(_tip,0), split_meta=coalesce(_meta,'{}'::jsonb),
    split_type = CASE WHEN _method='equal' THEN 'equal'::split_type ELSE 'custom'::split_type END
  WHERE id=_expense;
  DELETE FROM expense_shares WHERE expense_id=_expense;
  INSERT INTO expense_shares(expense_id, user_id, amount)
  SELECT _expense, (s->>'user_id')::uuid, (s->>'amount')::numeric FROM jsonb_array_elements(_shares) s;
END $$;
REVOKE ALL ON FUNCTION public.update_expense(uuid, timestamptz, text, expense_category, numeric, uuid, jsonb, date, text, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_expense(uuid, timestamptz, text, expense_category, numeric, uuid, jsonb, date, text, numeric, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_expense(_expense uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e expenses%ROWTYPE;
BEGIN
  SELECT * INTO e FROM expenses WHERE id=_expense FOR UPDATE;
  IF NOT FOUND OR NOT is_plan_member(e.plan_id) OR NOT plan_is_writable(e.plan_id)
     OR (e.created_by <> auth.uid() AND plan_role(e.plan_id) NOT IN ('owner','admin')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF expense_is_locked(_expense) THEN RAISE EXCEPTION 'EXPENSE_LOCKED'; END IF;
  UPDATE expenses SET deleted_at=now() WHERE id=_expense AND deleted_at IS NULL;
END $$;