CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.plan_type AS ENUM ('dinner','getaway','trip','celebration','activity','other');
CREATE TYPE public.plan_status AS ENUM ('draft','active','closed');
CREATE TYPE public.member_role AS ENUM ('owner','admin','member');
CREATE TYPE public.member_status AS ENUM ('active','left','removed');
CREATE TYPE public.place_category AS ENUM ('restaurant','activity','lodging','sight','transport','other');
CREATE TYPE public.plan_place_status AS ENUM ('proposed','chosen','discarded');
CREATE TYPE public.expense_category AS ENUM ('food','transport','lodging','tickets','other');
CREATE TYPE public.split_type AS ENUM ('equal','custom');

-- ========== CORE 1 ==========
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  type public.plan_type NOT NULL DEFAULT 'other',
  start_date date, end_date date,
  city text CHECK (city IS NULL OR char_length(city) <= 120),
  estimated_budget numeric(12,2) CHECK (estimated_budget IS NULL OR estimated_budget >= 0),
  currency char(3) NOT NULL DEFAULT 'EUR',
  status public.plan_status NOT NULL DEFAULT 'active',
  archived_at timestamptz, archived_by uuid REFERENCES public.profiles(id),
  premium_sponsored boolean NOT NULL DEFAULT false,
  sponsor_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (sponsor_id IS NULL OR premium_sponsored)
);
CREATE TABLE public.plan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  role public.member_role NOT NULL DEFAULT 'member',
  status public.member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  UNIQUE (plan_id, user_id)
);
CREATE UNIQUE INDEX one_active_owner_per_plan ON public.plan_members(plan_id) WHERE role='owner' AND status='active';
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  token_hash text NOT NULL UNIQUE,
  role_granted public.member_role NOT NULL DEFAULT 'member' CHECK (role_granted <> 'owner'),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  use_count int NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (use_count <= max_uses)
);
CREATE TABLE public.invitation_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.invitations(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invitation_id, user_id)
);

-- ========== CORE 2 ==========
CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'manual' CHECK (provider IN ('manual','google')),
  provider_place_id text,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category public.place_category NOT NULL DEFAULT 'other',
  address text CHECK (address IS NULL OR char_length(address) <= 200),
  url text CHECK (url IS NULL OR url ~ '^https?://'),
  price_level smallint CHECK (price_level IS NULL OR price_level BETWEEN 1 AND 4),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX places_provider_uniq ON public.places(provider, provider_place_id) WHERE provider_place_id IS NOT NULL;
CREATE TABLE public.plan_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
  added_by uuid NOT NULL REFERENCES public.profiles(id),
  note text CHECK (note IS NULL OR char_length(note) <= 300),
  status public.plan_place_status NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, place_id)
);
CREATE TABLE public.favorite_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

-- ========== CORE 3 ==========
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  paid_by uuid NOT NULL REFERENCES public.profiles(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 120),
  category public.expense_category NOT NULL DEFAULT 'other',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'EUR',
  expense_date date NOT NULL DEFAULT current_date,
  split_type public.split_type NOT NULL DEFAULT 'equal',
  idempotency_key uuid NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, idempotency_key)
);
CREATE TABLE public.expense_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  UNIQUE (expense_id, user_id)
);
CREATE TYPE public.settlement_status AS ENUM ('proposed','confirmed','rejected','cancelled');
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  from_user uuid NOT NULL REFERENCES public.profiles(id),
  to_user uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status public.settlement_status NOT NULL DEFAULT 'proposed',
  proposed_by uuid NOT NULL REFERENCES public.profiles(id),
  confirmed_by uuid REFERENCES public.profiles(id),
  confirmed_at timestamptz,
  note text,
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user <> to_user),
  UNIQUE (proposed_by, idempotency_key)
);
CREATE UNIQUE INDEX one_open_settlement_per_pair ON public.settlements(plan_id, from_user, to_user) WHERE status='proposed';

-- ========== Grants (authenticated only; writes go through functions) ==========
GRANT SELECT ON public.plans, public.plan_members, public.invitations, public.places, public.plan_places, public.expenses, public.expense_shares, public.settlements TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorite_places TO authenticated;
GRANT UPDATE (name, type, start_date, end_date, city, estimated_budget, status) ON public.plans TO authenticated;
GRANT ALL ON public.plans, public.plan_members, public.invitations, public.invitation_redemptions, public.places, public.plan_places, public.favorite_places, public.expenses, public.expense_shares, public.settlements TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- ========== Helpers ==========
CREATE OR REPLACE FUNCTION public.is_plan_member(_plan uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM plan_members WHERE plan_id=_plan AND user_id=auth.uid() AND status='active')
$$;
CREATE OR REPLACE FUNCTION public.plan_role(_plan uuid)
RETURNS public.member_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM plan_members WHERE plan_id=_plan AND user_id=auth.uid() AND status='active'
$$;
CREATE OR REPLACE FUNCTION public.plan_is_writable(_plan uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM plans WHERE id=_plan AND archived_at IS NULL)
$$;
CREATE OR REPLACE FUNCTION public.shares_plan_with(_other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM plan_members a JOIN plan_members b ON a.plan_id=b.plan_id
    WHERE a.user_id=auth.uid() AND a.status='active' AND b.user_id=_other)
$$;
REVOKE EXECUTE ON FUNCTION public.is_plan_member(uuid), public.plan_role(uuid), public.plan_is_writable(uuid), public.shares_plan_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_plan_member(uuid), public.plan_role(uuid), public.plan_is_writable(uuid), public.shares_plan_with(uuid) TO authenticated;

-- ========== Policies ==========
CREATE POLICY "Co-members read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.shares_plan_with(id));
CREATE POLICY "Members read plans" ON public.plans FOR SELECT TO authenticated USING (public.is_plan_member(id));
CREATE POLICY "Owner/admin update plans" ON public.plans FOR UPDATE TO authenticated
  USING (public.plan_role(id) IN ('owner','admin') AND archived_at IS NULL)
  WITH CHECK (public.plan_role(id) IN ('owner','admin'));
CREATE POLICY "Members read members" ON public.plan_members FOR SELECT TO authenticated USING (public.is_plan_member(plan_id));
CREATE POLICY "Owner/admin read invitations" ON public.invitations FOR SELECT TO authenticated USING (public.plan_role(plan_id) IN ('owner','admin'));
CREATE POLICY "Read places in my plans or mine" ON public.places FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.plan_places pp WHERE pp.place_id = places.id AND public.is_plan_member(pp.plan_id)));
CREATE POLICY "Members read plan places" ON public.plan_places FOR SELECT TO authenticated USING (public.is_plan_member(plan_id));
CREATE POLICY "Own favorites read" ON public.favorite_places FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own favorites insert" ON public.favorite_places FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own favorites delete" ON public.favorite_places FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members read expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_plan_member(plan_id));
CREATE POLICY "Members read shares" ON public.expense_shares FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND public.is_plan_member(e.plan_id)));
CREATE POLICY "Members read settlements" ON public.settlements FOR SELECT TO authenticated USING (public.is_plan_member(plan_id));

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== Plan delete guard: never delete with financial history ==========
CREATE OR REPLACE FUNCTION public.plans_block_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM expenses WHERE plan_id=OLD.id) OR EXISTS (SELECT 1 FROM settlements WHERE plan_id=OLD.id) THEN
    RAISE EXCEPTION 'plan has financial history; archive it instead';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER plans_no_delete_with_history BEFORE DELETE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.plans_block_delete();

-- ========== Transactional functions ==========
CREATE OR REPLACE FUNCTION public.create_plan(_name text, _type public.plan_type, _start date, _end date, _city text, _budget numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_limit int; v_count int; v_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('create_plan:' || uid::text));
  SELECT max_active_owned_plans INTO v_limit FROM plan_limits WHERE tier='free';
  SELECT count(*) INTO v_count FROM plans WHERE owner_id=uid AND archived_at IS NULL;
  IF v_limit IS NOT NULL AND v_count >= v_limit THEN RAISE EXCEPTION 'FREE_PLAN_LIMIT'; END IF;
  INSERT INTO plans(owner_id, name, type, start_date, end_date, city, estimated_budget)
  VALUES (uid, trim(_name), _type, _start, _end, nullif(trim(_city),''), _budget) RETURNING id INTO v_id;
  INSERT INTO plan_members(plan_id, user_id, role) VALUES (v_id, uid, 'owner');
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.archive_plan(_plan uuid, _archive boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_limit int; v_count int;
BEGIN
  IF plan_role(_plan) IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _archive THEN
    UPDATE plans SET archived_at=now(), archived_by=uid WHERE id=_plan AND archived_at IS NULL;
    UPDATE invitations SET revoked_at=now() WHERE plan_id=_plan AND revoked_at IS NULL;
  ELSE
    SELECT max_active_owned_plans INTO v_limit FROM plan_limits WHERE tier='free';
    SELECT count(*) INTO v_count FROM plans WHERE owner_id=uid AND archived_at IS NULL;
    IF v_limit IS NOT NULL AND v_count >= v_limit THEN RAISE EXCEPTION 'FREE_PLAN_LIMIT'; END IF;
    UPDATE plans SET archived_at=NULL, archived_by=NULL WHERE id=_plan;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_invitation(_plan uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_token text;
BEGIN
  IF plan_role(_plan) NOT IN ('owner','admin') OR plan_role(_plan) IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'PLAN_ARCHIVED'; END IF;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO invitations(plan_id, created_by, token_hash) VALUES (_plan, auth.uid(), encode(extensions.digest(v_token, 'sha256'), 'hex'));
  RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_invitation(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan uuid;
BEGIN
  SELECT plan_id INTO v_plan FROM invitations WHERE id=_id;
  IF v_plan IS NULL OR plan_role(v_plan) IS NULL OR plan_role(v_plan) NOT IN ('owner','admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE invitations SET revoked_at=now() WHERE id=_id AND revoked_at IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE uid uuid := auth.uid(); inv invitations%ROWTYPE; v_limit int; v_members int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO inv FROM invitations WHERE token_hash = encode(extensions.digest(coalesce(_token,''), 'sha256'), 'hex') FOR UPDATE;
  IF NOT FOUND OR inv.revoked_at IS NOT NULL OR inv.expires_at < now() OR inv.use_count >= inv.max_uses OR NOT plan_is_writable(inv.plan_id) THEN
    RAISE EXCEPTION 'INVALID_INVITATION';
  END IF;
  IF EXISTS (SELECT 1 FROM plan_members WHERE plan_id=inv.plan_id AND user_id=uid AND status='active') THEN
    RETURN inv.plan_id;
  END IF;
  PERFORM 1 FROM plans WHERE id=inv.plan_id FOR UPDATE;
  SELECT max_members_per_plan INTO v_limit FROM plan_limits WHERE tier='free';
  SELECT count(*) INTO v_members FROM plan_members WHERE plan_id=inv.plan_id AND status='active';
  IF v_limit IS NOT NULL AND v_members >= v_limit THEN RAISE EXCEPTION 'FREE_MEMBER_LIMIT'; END IF;
  UPDATE invitations SET use_count = use_count + 1 WHERE id=inv.id;
  INSERT INTO invitation_redemptions(invitation_id, user_id) VALUES (inv.id, uid);
  INSERT INTO plan_members(plan_id, user_id, role) VALUES (inv.plan_id, uid, inv.role_granted)
    ON CONFLICT (plan_id, user_id) DO UPDATE SET status='active', role=EXCLUDED.role, left_at=NULL, joined_at=now();
  RETURN inv.plan_id;
END $$;

CREATE OR REPLACE FUNCTION public.add_place_to_plan(_plan uuid, _name text, _category public.place_category, _address text, _url text, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_place uuid;
BEGIN
  IF NOT is_plan_member(_plan) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'PLAN_ARCHIVED'; END IF;
  INSERT INTO places(name, category, address, url, created_by)
  VALUES (trim(_name), _category, nullif(trim(_address),''), nullif(trim(_url),''), uid) RETURNING id INTO v_place;
  INSERT INTO plan_places(plan_id, place_id, added_by, note) VALUES (_plan, v_place, uid, nullif(trim(_note),''));
  RETURN v_place;
END $$;

CREATE OR REPLACE FUNCTION public.set_plan_place_status(_plan_place uuid, _status public.plan_place_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan uuid; v_by uuid;
BEGIN
  SELECT plan_id, added_by INTO v_plan, v_by FROM plan_places WHERE id=_plan_place;
  IF v_plan IS NULL OR NOT is_plan_member(v_plan) OR NOT plan_is_writable(v_plan)
     OR (v_by <> auth.uid() AND plan_role(v_plan) NOT IN ('owner','admin')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE plan_places SET status=_status WHERE id=_plan_place;
END $$;

-- _shares: [{"user_id": "...", "amount": 12.34}, ...]
CREATE OR REPLACE FUNCTION public.save_expense(_plan uuid, _description text, _category public.expense_category, _amount numeric,
  _paid_by uuid, _split public.split_type, _shares jsonb, _idempotency_key uuid, _date date DEFAULT current_date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_id uuid; v_sum numeric(12,2); v_bad int; v_n int; v_currency char(3);
BEGIN
  IF uid IS NULL OR NOT is_plan_member(_plan) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'PLAN_ARCHIVED'; END IF;
  SELECT id INTO v_id FROM expenses WHERE created_by=uid AND idempotency_key=_idempotency_key;
  IF FOUND THEN RETURN v_id; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount <> round(_amount, 2) THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
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
  SELECT currency INTO v_currency FROM plans WHERE id=_plan;
  INSERT INTO expenses(plan_id, paid_by, created_by, description, category, amount, currency, expense_date, split_type, idempotency_key)
  VALUES (_plan, _paid_by, uid, trim(_description), _category, _amount, v_currency, coalesce(_date, current_date), _split, _idempotency_key)
  RETURNING id INTO v_id;
  INSERT INTO expense_shares(expense_id, user_id, amount)
  SELECT v_id, (s->>'user_id')::uuid, (s->>'amount')::numeric FROM jsonb_array_elements(_shares) s;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.delete_expense(_expense uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e expenses%ROWTYPE;
BEGIN
  SELECT * INTO e FROM expenses WHERE id=_expense;
  IF NOT FOUND OR NOT is_plan_member(e.plan_id) OR NOT plan_is_writable(e.plan_id)
     OR (e.created_by <> auth.uid() AND plan_role(e.plan_id) NOT IN ('owner','admin')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE expenses SET deleted_at=now() WHERE id=_expense AND deleted_at IS NULL;
END $$;

-- Safety net: shares must always sum to the expense amount at commit time
CREATE OR REPLACE FUNCTION public.check_expense_shares_sum()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_exp uuid := coalesce(NEW.expense_id, OLD.expense_id); v_amount numeric; v_sum numeric;
BEGIN
  SELECT amount INTO v_amount FROM expenses WHERE id=v_exp;
  IF v_amount IS NULL THEN RETURN NULL; END IF;
  SELECT coalesce(sum(amount),0) INTO v_sum FROM expense_shares WHERE expense_id=v_exp;
  IF v_sum <> v_amount THEN RAISE EXCEPTION 'SHARES_SUM_MISMATCH'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER expense_shares_sum AFTER INSERT OR UPDATE OR DELETE ON public.expense_shares
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_expense_shares_sum();

CREATE OR REPLACE FUNCTION public.propose_settlement(_plan uuid, _to uuid, _amount numeric, _idempotency_key uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF uid IS NULL OR NOT is_plan_member(_plan) OR NOT plan_is_writable(_plan) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT id INTO v_id FROM settlements WHERE proposed_by=uid AND idempotency_key=_idempotency_key;
  IF FOUND THEN RETURN v_id; END IF;
  IF NOT EXISTS (SELECT 1 FROM plan_members WHERE plan_id=_plan AND user_id=_to AND status='active') THEN RAISE EXCEPTION 'NOT_MEMBER'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount <> round(_amount,2) THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF EXISTS (SELECT 1 FROM settlements WHERE plan_id=_plan AND from_user=uid AND to_user=_to AND status='proposed') THEN RAISE EXCEPTION 'DUPLICATE_SETTLEMENT'; END IF;
  INSERT INTO settlements(plan_id, from_user, to_user, amount, proposed_by, idempotency_key)
  VALUES (_plan, uid, _to, _amount, uid, _idempotency_key) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.respond_settlement(_id uuid, _status public.settlement_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s settlements%ROWTYPE;
BEGIN
  SELECT * INTO s FROM settlements WHERE id=_id FOR UPDATE;
  IF NOT FOUND OR s.status <> 'proposed' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  IF _status IN ('confirmed','rejected') AND s.to_user <> auth.uid() THEN RAISE EXCEPTION 'ONLY_RECEIVER'; END IF;
  IF _status = 'cancelled' AND s.proposed_by <> auth.uid() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _status NOT IN ('confirmed','rejected','cancelled') THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  UPDATE settlements SET status=_status,
    confirmed_by = CASE WHEN _status='confirmed' THEN auth.uid() END,
    confirmed_at = CASE WHEN _status='confirmed' THEN now() END
  WHERE id=_id;
END $$;

-- Balances: paid - owed + confirmed settlements sent - received
CREATE OR REPLACE FUNCTION public.plan_balances(_plan uuid)
RETURNS TABLE(user_id uuid, paid numeric, owed numeric, balance numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_plan_member(_plan) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN QUERY
  WITH m AS (SELECT pm.user_id FROM plan_members pm WHERE pm.plan_id=_plan),
  p AS (SELECT e.paid_by u, sum(e.amount) s FROM expenses e WHERE e.plan_id=_plan AND e.deleted_at IS NULL GROUP BY 1),
  o AS (SELECT sh.user_id u, sum(sh.amount) s FROM expense_shares sh JOIN expenses e ON e.id=sh.expense_id
        WHERE e.plan_id=_plan AND e.deleted_at IS NULL GROUP BY 1),
  ss AS (SELECT st.from_user u, sum(st.amount) s FROM settlements st WHERE st.plan_id=_plan AND st.status='confirmed' GROUP BY 1),
  sr AS (SELECT st.to_user u, sum(st.amount) s FROM settlements st WHERE st.plan_id=_plan AND st.status='confirmed' GROUP BY 1)
  SELECT m.user_id, coalesce(p.s,0)::numeric, coalesce(o.s,0)::numeric,
    (coalesce(p.s,0) - coalesce(o.s,0) + coalesce(ss.s,0) - coalesce(sr.s,0))::numeric
  FROM m LEFT JOIN p ON p.u=m.user_id LEFT JOIN o ON o.u=m.user_id LEFT JOIN ss ON ss.u=m.user_id LEFT JOIN sr ON sr.u=m.user_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_plan(text, public.plan_type, date, date, text, numeric), public.archive_plan(uuid, boolean),
  public.create_invitation(uuid), public.revoke_invitation(uuid), public.accept_invitation(text),
  public.add_place_to_plan(uuid, text, public.place_category, text, text, text), public.set_plan_place_status(uuid, public.plan_place_status),
  public.save_expense(uuid, text, public.expense_category, numeric, uuid, public.split_type, jsonb, uuid, date), public.delete_expense(uuid),
  public.propose_settlement(uuid, uuid, numeric, uuid), public.respond_settlement(uuid, public.settlement_status), public.plan_balances(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_plan(text, public.plan_type, date, date, text, numeric), public.archive_plan(uuid, boolean),
  public.create_invitation(uuid), public.revoke_invitation(uuid), public.accept_invitation(text),
  public.add_place_to_plan(uuid, text, public.place_category, text, text, text), public.set_plan_place_status(uuid, public.plan_place_status),
  public.save_expense(uuid, text, public.expense_category, numeric, uuid, public.split_type, jsonb, uuid, date), public.delete_expense(uuid),
  public.propose_settlement(uuid, uuid, numeric, uuid), public.respond_settlement(uuid, public.settlement_status), public.plan_balances(uuid)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.plans_block_delete(), public.check_expense_shares_sum() FROM PUBLIC, anon, authenticated;