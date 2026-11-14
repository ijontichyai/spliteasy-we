# AUTH-002.2 — Roles administrativos y auditoría (solo diseño)

This step is design only. After approval I write the design document `docs/architecture/auth-002-2-admin-roles.md` and add an entry to the CHANGELOG. The database is not touched; the actual change will be a separate step once you authorise it.

## 1. Principles
- Platform roles (admin/support) are completely separate from group roles (owner/admin/member in `plan_members`) and from Premium.
- Default deny. Nobody gets a role from the app: roles are granted only by a server-side procedure or from the backend by the project owner.
- Being an administrator does **not** mean reading private data. There are no "admin sees everything" policies on plans, expenses, profiles or settlements.
- Every admin action goes through one audited function. There are no direct writes.

## 2. Tables
**`app_role` enum:** `admin`, `support`.

**`user_roles`:**
- `id`, `user_id` → auth.users ON DELETE CASCADE, `role`, `granted_by`, `granted_at`, `revoked_at`, `note`.
- UNIQUE(user_id, role) for active roles.

**`admin_audit_log`** (append-only):
- `id`, `actor_id`, `action` (text, e.g. `role.grant`, `user.suspend`).
- `target_type`, `target_id`: the affected resource.
- `result`: `success` / `denied` / `error`.
- `reason` (mandatory text) and `details` jsonb (no personal data: ids and fields only).
- `created_at` default now().

## 3. Functions (SECURITY DEFINER, search_path fixed)
- `has_role(_user uuid, _role app_role) → boolean`
  - STABLE; looks for an active role (revoked_at IS NULL).
  - EXECUTE for authenticated, but it only answers for oneself: if `_user <> auth.uid()` it returns false. This prevents enumerating who is an admin.
- `is_admin() → boolean`: wrapper around `has_role(auth.uid(),'admin')`.
- `admin_grant_role(_user, _role, _reason)` / `admin_revoke_role(_user, _role, _reason)`
  - Only an admin can call them.
  - An admin cannot revoke their own last admin role, so the platform is never left without one.
  - Every attempt is logged, including denied ones (`denied`).
- Internal `log_admin_action(...)`:
  - No EXECUTE for authenticated; only the admin functions use it.
  - Denied attempts by non-admins are also logged, with actor = auth.uid().
- The first admin is created by the project owner from the backend: a manual insert with a documented reason. There is no "first user becomes admin" path.

## 4. Permission matrix
| Action | Visitor | Free/Premium | Organizer/Participant | Admin | Support |
|---|---|---|---|---|---|
| Read own role | – | yes | yes | yes | yes |
| Read other people's roles | no | no | no | via audited function | no |
| Grant/revoke roles | no | no | no | via audited function | no |
| Read audit log | no | no | no | own entries + the last 90 days, read only | no |
| Edit/delete audit log | no | no | no | no (nobody) | no |
| Read private plans, expenses, profiles | no | only their plans | only their plans | no (unless member) | no |
| Activate Premium | no | no | no | not in this phase (AUTH-002.3, audited) | no |

## 5. Proposed RLS and grants
**`user_roles`:**
- GRANT SELECT to authenticated. No INSERT/UPDATE/DELETE grants. Policy: `user_id = auth.uid()`.
- service_role has ALL.
- No grants to anon.

**`admin_audit_log`:**
- GRANT SELECT to authenticated only. Policy: `public.is_admin()`.
- No INSERT/UPDATE/DELETE for anyone except the definer functions.
- A trigger blocks UPDATE/DELETE even for service_role (immutability).

**Existing tables:** unchanged. R1/R2 and the AUTH-002.1b results stay valid.

## 6. Migration plan (on approval, a single migration)
1. Create the enum and the tables, then the GRANTs, then enable RLS, then the policies, in that order.
2. Create the functions and the immutability trigger.
3. REVOKE EXECUTE on `log_admin_action` from public/authenticated.
4. Nothing else changes: login, plans, Premium and the test accounts.
5. No first admin is created. I'll ask you which account it should be, and suggest a test account (test-a) for the tests.

The change is purely additive, and it can be rolled back by removing the new objects.

## 7. Test plan (with the four AUTH-002.1b accounts)
**Escalation:**
- B inserts or updates a row in `user_roles` for themselves → denied.
- B calls `admin_grant_role` → `FORBIDDEN`, and a `denied` entry is logged.
- B changes `user_metadata` to say role=admin → it gives no privilege.

**Enumeration:** C calls `has_role(A,'admin')` → false, even when A is an admin.

**Improper access:**
- An admin with no plans reads plans, expenses, profiles and settlements → 0 rows.
- C reads `admin_audit_log` → 0 rows.

**Audit:**
- A grants `support` to D → `success` entry with the actor, action, target, time and result.
- A revokes their own last admin role → denied and logged.
- UPDATE or DELETE on the log → denied (also for service_role).

**Regression:** run the AUTH-002.1b script again (8/8 must still pass).

## 8. Risks
- Admin keys live only in the backend. If the server key leaks, roles can be bypassed (mitigation: never in the frontend, rotation).
- The audit log could grow with denied attempts → rate limit or periodic summarisation (future).
- Admin panel and support actions (suspending users, data deletion requests) are not in scope; they'll come with their own audited functions.
- R3–R6 from AUTH-002 remain open, plus the missing "leave plan" feature.

After approval I only write the document. Database changes wait for your explicit authorisation.

## Anexo A — Borrador SQL (NO aplicado)

```sql
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

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user = auth.uid() AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user AND role = _role AND revoked_at IS NULL)
$$;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin() AND created_at > now() - interval '90 days');

-- log_admin_action / admin_grant_role / admin_revoke_role: SECURITY DEFINER,
--   validan is_admin(), registran success/denied, impiden revocar el último admin propio.
--   Para registrar 'denied' sin que el RAISE revierta el log, devuelven un resultado
--   (no lanzan excepción) tras insertar el registro.
-- REVOKE EXECUTE ON FUNCTION public.log_admin_action(...) FROM PUBLIC, authenticated, anon;
-- Trigger BEFORE UPDATE OR DELETE en admin_audit_log → RAISE 'audit log is immutable'.
```

Nota de diseño: una excepción revierte toda la transacción, incluido el registro de auditoría; por eso las funciones admin devuelven `{ok:false, error:'FORBIDDEN'}` en lugar de lanzar excepción cuando deniegan.
