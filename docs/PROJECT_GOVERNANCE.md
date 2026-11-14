# SplitEasy | GitHub Governance
Updated: 2026-11-14
Status: proposed governance policy (documentation-only branch; not yet merged into main)

## Decision authority and Lovable prompts
- Armando (Commander) **directs, prioritizes, and authorizes** all scope, major decisions, implementation prompts, releases, and material changes.
- Anémona (ChatGPT) is the GitHub governance coordinator and **prepares, reviews, and controls prompts sent to Lovable** in coordination with Armando. Nothing is sent to Lovable on Armando's behalf without their authorization, and Armando may agree explicitly to exceptions.
- Default workflow: Armando requests/approves objective → Anémona drafts or checks exact Lovable prompt → Armando approves the prompt → Lovable executes → Anémona verifies resulting commits, documentation and test evidence → Armando accepts.
- No independent scope expansion, unapproved deployments, spending, paid services, secrets exposure, or production payment activation.
- Prompt log records approved prompt, purpose, change scope, resulting commit references and verification status; proposed/pending/implemented/verified must be distinct.

## Roles and source of truth
- Product owner and release approver: Armando Romero Mariscal Guasp.
- Technical coordination, documentation review, audit and backlog: Anémona (ChatGPT), operating through authorized GitHub actions.
- Application implementation and automatic source synchronization: Lovable.
- Canonical source code and version history: private repository `ijontichyai/spliteasy-we`.
- Lovable Cloud databases, Stripe Sandbox settings, deployment state and secrets are **not** fully represented or backed up by Git; audit and back them up separately when appropriate.

## Single-writer rules
1. Lovable is the default writer of application code. Do not modify the same app files simultaneously through GitHub or local edits.
2. ChatGPT first reads current remote files and commit SHAs; edits its own review branch. Prefer small, documented pull requests.
3. Prior to merging or changing `main`, assess Lovable's bidirectional sync and check for intervening commits.
4. No force-push to `main`, destructive history rewrites, mass file replacements, or production releases without explicit product-owner approval.
5. Never mark a task as implemented merely because it is proposed in chat, a Markdown backlog, or a Lovable plan.
6. Every completed feature needs a matching change record, test evidence and commit reference. Mark unresolved tests clearly.
7. Never commit API keys, personal financial data, real payment cards, credentials, or user test records.

## Proposed workflow
Idea → prioritized issue/backlog → approved scope → Lovable implementation → review commits/diff → tests (including manual tests) → acceptance → release tag.
- `main`: Lovable-integrated working branch; check its actual state before calling it stable.
- `docs/*`: documentation-only proposals.
- `feature/*` or `fix/*`: isolated changes only when compatible with Lovable sync.
- Releases: signed-off annotated versions/tags after acceptance; not merely after a successful build.

## November 2026 priorities
P0: finish Stripe Sandbox tests (cancellation, failed card); regression, privacy/RLS, mobile bugs.
P1: expense editing, split methods, tips; minimal personal expense mode and German i18n when feasible.
P2: PDF/CSV export, reports, manual subscription tracking, reviews.
Later: receipt AI, bank integrations, contactless payments, merchant POS, personal AI finance.
Legal/IP: trademark clearance and patentability assessment before disclosures; no unauthorized filings or payments.

## Immediate audit questions
- Does every Lovable change reach the connected private GitHub repository?
- Which plans/reports/docs exist in Git and which only inside Lovable or chat?
- Do CI and tests run against the committed code, or are results only reported by Lovable?
- Are GitHub branch protection, backups, and least-privilege access configured?
- Are cloud backend schema, RLS policies, Stripe metadata, and deployment config recoverable independently?
