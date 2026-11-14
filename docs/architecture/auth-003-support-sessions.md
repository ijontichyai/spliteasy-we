# AUTH-003 — Secure admin support & "view as user" (Phase 1: design only)

Status: PROPOSAL, nothing implemented. Builds on AUTH-002.1 (R1/R2), AUTH-002.1b, AUTH-002.2 (`user_roles`, `has_role`, `is_admin`, immutable `admin_audit_log`).

## 1. Architecture proposal
Core idea: **impersonation is never real.** The staff member always acts as themselves (`auth.uid()` = staff). Access to a user's data is granted by a **support grant**: a short-lived, scoped, consented row the backend checks inside dedicated read-only functions.

Two tiers, A preferred:
- **Tier A — Redacted preview (default).** `support_view_*` functions return the user's *structure* with personal and financial values masked: plan names → "Plan 1", other members → "Participante 2", amounts → bucketed or hidden, places → category only. This is enough for most problems (empty screen, wrong tab, limit reached, invitation expired). It needs a grant with scope `preview`.
- **Tier B — Real data, read-only.** The same functions return real values only for the resources listed in the grant (`plan:<id>`, `profile`, `expenses:<plan_id>`). It needs the scope `real` **and** the user ticking a separate "show real data" box.
- **No write tier in this feature.** "Read-only by default" is implemented as "read-only always" in v1. Any later write capability would need its own ADR.

The frontend has a `/support/session/$id` route that renders the existing `PlanView` with the data returned by `support_view_*`. It shows a permanent red "Modo soporte — solo lectura — expira en mm:ss" banner and an "End session" button, and it never touches the user's session.

## 2. Database changes required (additive)
- **Enum `support_scope`:** `preview`, `real`.
- **Enum `support_status`:** `requested`, `accepted`, `authorized`, `active`, `ended`, `expired`, `revoked`, `rejected`.
- **`support_requests`:**
  - `id`, `user_id`, `topic` (text ≤ 500, no secrets), `status`, `created_at`.
  - `assigned_to` (staff id, nullable), `resolved_at`.
- **`support_grants`:**
  - `id`, `request_id`, `user_id`, `staff_id`, `scope`, `resources` jsonb (allow-list: `[{"type":"plan","id":…}]`).
  - `authorized_at`, `authorization_method` (`in_app_consent`), `nonce_hash` (sha256 of a one-time token).
  - `started_at`, `expires_at` (≤ `started_at` + 15 min, CHECK), `ended_at`, `revoked_at`, `revoked_by`, `end_reason`.
  - `used` boolean: single activation.
- **`admin_audit_log`:** unchanged table. New `action` values `support.*`, with `details` carrying `support_session_id`, `user_id`, `resources`, `scope` and `expires_at`. An index on `(details->>'support_session_id')`.
- **RLS:**
  - `support_requests`: the user sees and creates their own; assigned staff see the ones assigned to them; admins see all request metadata (topic only).
  - `support_grants`: the user sees their own; the staff member sees their own grants. No direct INSERT/UPDATE/DELETE for anyone, only definer functions.
- **Grants:** authenticated SELECT only (writes via functions); service_role ALL; anon nothing.

## 3. Functions (SECURITY DEFINER, fixed search_path, never RAISE on denial; log + return `{ok:false}`)
| Function | Caller | Effect |
|---|---|---|
| `support_request_create(topic)` | user | creates the request (rate limit: 3 open per user) |
| `support_request_accept(request)` | admin/support | assigns it to self |
| `support_grant_authorize(request, scope, resources, show_real)` | **the user** | creates the grant; validates that every resource belongs to the user (active member); returns a one-time token (only its hash is stored) |
| `support_session_start(grant, token)` | assigned staff | checks hash, unused, not revoked, staff = assignee, staff still has role; sets `started_at`, `expires_at = now()+15m`, `used=true` |
| `support_view_plan(grant, plan)` / `support_view_profile(grant)` / `support_view_expenses(grant, plan)` | staff | `assert_grant()` → returns redacted or real data per scope; logs `support.view` with the resource |
| `support_session_end(grant)` | staff or user | ends the session |
| `support_grant_revoke(grant)` | user (or admin) | immediate revoke |
| `assert_grant(grant, resource)` (internal, no EXECUTE) | – | `staff_id = auth.uid()` AND active role AND `started_at` NOT NULL AND `now() < expires_at` AND `revoked_at`/`ended_at` IS NULL AND resource ∈ `resources` |

Expiry is evaluated on every call (`now() < expires_at`), so no scheduled job is needed. A housekeeping status update can be done lazily by the same functions (0 €).

## 4. Security model
- `auth.uid()` is never changed. No user token is issued, copied or minted. No service_role is used in the browser.
- Existing RLS is untouched. Staff get **no new SELECT policy** on plans, expenses or profiles; data flows only through `support_view_*`, which re-check the grant on every call.
- Least privilege: the scope and resource allow-list are chosen by the user, the default is `preview`, and real financial values require explicit `real`.
- Never returned: emails, auth data, invitation tokens, payment data (none stored), or other members' real names in `preview`.
- Replay: the activation token is one-time (`used`), bound to grant + staff, and stored hashed. Calls also bind to `grant_id`, and the grant is useless after `ended_at`/`revoked_at`/`expires_at`.
- Escalation: `support` and `admin` can't create grants for themselves (the user must authorize). Staff can't widen resources. A grant to a staff member who has since lost their role is rejected. A user can't grant access to plans they aren't an active member of.
- Other members of a shared plan: in `real` scope, co-members' data appear only as display names already visible to the user (R1 rules). Their expenses are shown because the user can already see them. This is documented in the consent text.

## 5. Permission matrix
| Action | User | Co-member | External | Support (D) | Admin (A) |
|---|---|---|---|---|---|
| Create support request | own | – | own | – | – |
| See request topic | own | no | no | if assigned | yes |
| Accept/assign request | no | no | no | yes | yes |
| Authorize grant | own only | no | no | no | no |
| Start session | no | no | no | own grant | own grant |
| View redacted data | no | no | no | in scope, ≤ 15 min | in scope, ≤ 15 min |
| View real data | no | no | no | only `real` + listed | only `real` + listed |
| Write user data | – | – | – | **never** | **never** |
| Revoke grant | own | no | no | end own session | yes |
| Read audit | no | no | no | no | yes (90 d) |

## 6. User consent workflow
1. Profile → "Pedir ayuda": the user writes a topic (with a warning not to include passwords).
2. Staff accepts. The user sees "Ana (soporte) quiere ayudarte".
3. The consent screen:
   - Pick the plans to share.
   - Mode: "Vista protegida (recomendada)" or "Datos reales (solo lectura)".
   - Fixed duration: 15 minutes.
   - Clear text on what staff will see and not see.
4. "Autorizar" creates the grant. A visible banner then shows on the user's side ("Soporte tiene acceso hasta 12:15 · Revocar"). Revoke is one tap.
5. Afterwards the user sees a history: who, when, resources and an action count (read from their own grants plus a user-safe summary function).

## 7. Support session lifecycle
```text
requested → accepted → authorized → active ──► ended (staff/user)
                │            │          ├────► expired (now ≥ expires_at)
                │            │          └────► revoked (user/admin)
                └─ rejected  └─ expired if not started within 30 min
```
- A grant is single-use: once ended, expired or revoked, it is never reusable; a new one needs fresh consent.
- Max 1 active grant per user.

## 8. Audit integration (`admin_audit_log`)
| Event | action | details |
|---|---|---|
| Request accepted | `support.request.accept` | request_id, user_id |
| Grant authorized | `support.grant.authorize` (actor = user) | session id, scope, resources, method, expires window |
| Session started | `support.session.start` | session id, started_at, expires_at |
| Each read | `support.view` | session id, resource, scope |
| End / expire / revoke | `support.session.end` / `.expire` / `.revoke` | ended_at, who, reason |
| Any denial | same action, `result='denied'` | error code (EXPIRED, REVOKED, OUT_OF_SCOPE, REPLAY, NOT_ASSIGNED) |

Note: user-initiated events reuse the log with actor = user. The table stays immutable; admins read it, users get a filtered summary function.

## 9. Threat model
| Threat | Mitigation |
|---|---|
| Staff reads without consent | no RLS path; only grant-checked functions |
| Stolen or replayed activation link | hashed one-time token, bound to staff, `used` flag |
| Using an expired or revoked grant | checked on every call, not cached in the client |
| Scope creep (other plans) | resource allow-list checked per call |
| Insider exfiltration | 15 min, preview by default, every read logged, user history |
| Staff role removed mid-session | `assert_grant` re-checks role |
| Social engineering ("authorize everything") | default preview, plain-language consent, max 1 active |
| Self-grant / escalation | only the data owner can authorize; not staff-for-self |
| Audit tampering | existing immutability trigger |
| Token or password leaks | none exist in this flow; topic warns against secrets |
| Co-member privacy | preview masks them; real scope limited to what the user already sees |
| DoS via requests | 3 open requests per user; audit growth noted |

## 10. Test plan (A admin, B participant, C external, D support)
- **Unauthorized:**
  - D or A calls `support_view_plan` without a grant → denied and logged.
  - C tries to authorize a grant over B's plan → denied.
  - B authorizes for a plan B isn't in → denied.
- **Consent:** B authorizes a preview of their plan to D. D starts and sees redacted data only (no names, no amounts). Real values are absent.
- **Real scope:** B authorizes `real`. D sees real data for the listed plan only. Another plan (C's) → `OUT_OF_SCOPE`.
- **Expiry:** set a test grant's `expires_at` in the past via backend → `EXPIRED`, and it can't be restarted.
- **Revocation:** B revokes mid-session; D's next call → `REVOKED`, logged.
- **Replay:** reuse the token → `REPLAY`. A different staff member uses the token → `NOT_ASSIGNED`.
- **Escalation:**
  - D authorizes a grant for themselves → denied.
  - D updates or inserts `support_grants` → permission denied.
  - D loses the support role mid-session → denied.
- **Isolation:** during an active session, D's normal RLS reads of B's plan → 0 rows.
- **Audit integrity:** every step above has exactly one entry; UPDATE/DELETE → immutable.
- **Regression:** AUTH-002.1b 8/8 + AUTH-002.2 29/29.

## 11. Implementation roadmap (each step needs approval)
1. **AUTH-003.1:** migration (enums, 2 tables, RLS, functions, Tier A redaction) + backend tests.
2. **AUTH-003.2:** user UI (request help, consent screen, active-access banner, revoke, history), ES/EN.
3. **AUTH-003.3:** staff UI (request queue, session view with banner and countdown, end button) reusing `PlanView` read-only.
4. **AUTH-003.4:** Tier B real-data scope + extra consent.
5. **AUTH-003.5:** security review, report, ADR-005.

Cost: 0 € (database functions only, no external services, no scheduled jobs).

## Open decisions for the owner
- Should Tier B (real data) exist at all in v1, or start with preview only?
- Should co-members be notified when someone in their plan grants support access?
- Who can authorize for a shared plan: only the requesting member, or also the organizer's consent?
