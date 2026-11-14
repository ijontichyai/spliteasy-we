<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Architecture source of truth: docs/architecture/phase-01.md (approved Phase 01 design); multi-row financial/invitation/archive operations go through transactional DB functions, never several client calls.
- Auth: email/password only with mandatory email confirmation; profiles created only by signup trigger; no anon grants on any table (see ADR-002).
- i18n: typed dictionaries in src/lib/i18n (es default); all locales must share keys (enforced by test).
- Plan data: authenticated users only SELECT plan tables (RLS by membership); every write goes through SECURITY DEFINER functions in the DB (see docs/architecture/sprint-demo-core.md).
- PlanView component is shared by real plans and the browser-only /demo; demo data must never be written to the database.
- Mobile navigation lives in src/components/bottom-nav.tsx (sm:hidden); the root wraps <Outlet /> in pb-safe-nav so pages never sit under it — keep that wrapper when editing __root.
- Illustrative (non-real) place content must show the "Ilustrativo" label and keep a data-google-slot area free for Places UI Kit (ADR-003).
- Editorial inspiration photographs use licensed CDN assets with responsive sources and provenance in docs/architecture/discover-photography.md; they remain separate from Google place records and reserved Google slots.
- Support UI uses authenticated server functions and the audited support_portal DB dispatcher; admin-only preview operations never use privileged clients or replace the administrator's session.
- Protected PlanView renders redacted structure only with writes disabled and monetary values hidden; one-time activation codes remain in transient component state, never storage or query caches.
