# PHASE 19 — VER2 SCOPE PLANNING + CONTROLLED DEMO ROADMAP

**Date:** 2026-06-11
**Baseline:** Core MVP CLOSED at `e3f1ed7` (closure report: `CORE_MVP_CLOSURE_REPORT.md`)
**Nature of this phase:** documentation/planning ONLY — no product code, no connectors, no secrets, no live automation.

This document is the Ver2 planning package: scope options, recommended priority order, and a breakdown into small, individually reviewable phases (19A–19F), each with goal, deliverables, files touched, safety rules, checks, Codex review focus, and an Owner approval checkpoint.

---

## 1. Ver2 scope options (the menu)

| # | Option | What it is | Risk level | Depends on |
|---|---|---|---|---|
| 1 | Manual browser E2E pass (Phase 17 checklist B–G) | Human click-through of the full workflow in both Local/Demo and (later) Supabase modes | 🟢 None — verification only | Nothing |
| 2 | Controlled client demo preparation | Demo script rehearsal, sample-data tailoring, Vercel deploy check, demo-day runbook | 🟢 Low — content/docs | Option 1 (don't demo unverified UI) |
| 3 | Supabase staging hardening | Apply migrations to a **staging** project, create real role rows, verify every RLS policy per role, resolve client-feedback policy | 🟡 Medium — first time SQL touches a live (staging) DB | Options 1 (verified app) |
| 4 | PC2 n8n/modules integration (dry-run) | Webhook callback surface + event inbox wiring against a local/dry-run n8n — registry stays inert | 🟠 Medium-high — first external process talks to Core | Option 3 (needs a real DB + secret handling on a backend) |
| 5 | UI/brand polish | Code-splitting (920 kB bundle), ESLint, accessibility pass, brand refinement | 🟢 Low — but touches many files | Nothing (parallel-safe) |
| 6 | Real connector readiness plan → activation | Gate design + per-connector rollout (n8n first), each behind Owner sign-off | 🔴 High — this is the boundary to the real world | Options 3 + 4 + Owner sign-off |

## 2. Recommended priority order

**Do first (now):**
1. **Phase 19A — Manual E2E pass + demo script** (option 1 + start of 2). Zero risk, unblocks everything: it is the only remaining verification gap in the closed MVP, and both the demo and the Supabase work assume a verified UI.

**Do second:**
2. **Phase 19B — Supabase staging hardening** (option 3). The highest-value technical step: every later option needs a real database with verified RLS. Staging project only — production env stays OFF.
3. **Phase 19D — Client demo package** (option 2) can run **in parallel** with 19B — it is content/docs work on a different file set.

**Can wait / parallel when idle:**
4. **Phase 19E — UI/brand polish** (option 5). Valuable but never urgent; safe to schedule into gaps. Code-splitting before any public-facing deployment.

**Do last + gated (needs Owner approval to even start):**
5. **Phase 19C — PC2 n8n/modules dry-run** (option 4). First time an external process talks to Core; requires a backend for `WEBHOOK_SHARED_SECRET` (never frontend) and the staging DB from 19B.
6. **Phase 19F — Real connector readiness plan** (option 6). Planning doc first; any actual activation is a separate, individually Owner-approved phase per connector. **No connector goes live inside Ver2 without a written Owner sign-off per connector.**

**Risky items requiring explicit Owner approval before starting:**
- Applying SQL to ANY live database (19B — staging counts).
- Running n8n against Core, even dry-run (19C).
- Any connector activation, auto-post, ads, or messaging (19F — and these stay OFF for all of Ver2 planning).
- Putting real client data anywhere (not in Ver2 scope at all until RLS is verified in 19B and the Owner approves).

## 3. Ver2 phase breakdown

### Phase 19A — Manual Browser E2E Pass + Demo Script Verification
- **Goal:** close the last verification gap in the MVP — execute Phase 17 checklist sections B–G in a real browser (Local/Demo mode), and verify the demo script against the actual UI.
- **Deliverables:**
  - `08_logs/phase_17_e2e_checklist.md` filled in (PASS/FAIL + notes per item, sections B–G).
  - `08_logs/phase_19a_e2e_results.md` — run log: environment, browser, date, defects found.
  - Defect list (if any) triaged: blocker / demo-blocker / cosmetic. Blockers fixed in a separate, minimal fix commit (label-level fixes only without re-scoping; anything structural goes back to Owner).
  - `07_docs/client_demo_script.md` walked through and corrected where it drifts from the real UI.
- **Files likely touched:** `08_logs/phase_17_e2e_checklist.md`, new `08_logs/phase_19a_e2e_results.md`, `07_docs/client_demo_script.md`; product code ONLY for triaged blocker fixes (each its own commit).
- **Safety rules:** Local/Demo mode only (no Supabase env); no schema/routing/sanitizer changes; no new features.
- **Checks:** `npm run build`, `npm run test` (must stay 45/45); manual checklist completion is the primary artifact.
- **Codex review focus:** any blocker-fix diffs (should be tiny and label/UI-level); checklist completeness — no section silently skipped.
- **Owner checkpoint:** Owner reviews results doc and approves "demo-able" status. **Gate to 19B/19D.**

### Phase 19B — Supabase Staging Hardening
- **Goal:** prove the entire SQL + RLS layer on a disposable **staging** Supabase project before any real use.
- **Deliverables:**
  - Staging Supabase project (new, empty, clearly named `-staging`; free tier fine).
  - All migrations applied **in order** (schema_v1 → 16B-2 → 16C-1 → 16C-2 → 16D) with an applied-order log: new `03_core/database/MIGRATION_ORDER.md`.
  - Seed script/checklist for test users + `user_roles` rows covering all 4 roles (owner/manager/client/viewer), incl. expired/inactive assignments.
  - RLS verification matrix: new `08_logs/phase_19b_rls_verification.md` — per table × per role × per operation (SELECT/INSERT/UPDATE), expected vs actual, incl. the known client-feedback case.
  - **Decision doc for client-role feedback policy** (`07_docs/client_feedback_policy_decision.md`): either a narrow feedback-write policy (comments only, own scope, `is_internal=false`) or keep owner/manager-only and route client feedback off-platform. Owner decides; implementation is a follow-up migration in its own commit.
  - App smoke test against staging via `.env.local` (never committed): mount loads, CRUD round-trips, UUID-gating fallback observed for local-format records.
- **Files likely touched:** `03_core/database/` (new MIGRATION_ORDER.md, possibly a feedback-policy migration after Owner decision), `08_logs/phase_19b_rls_verification.md`, `07_docs/client_feedback_policy_decision.md`. Product code: none expected; any RLS bug fix = additive idempotent migration only.
- **Safety rules:** staging project only — production env vars stay OFF; anon key + RLS only, service-role key used only inside the Supabase dashboard/SQL editor, never in the repo or frontend; `.env.local` gitignored (verify before first run); no real client data — synthetic test data only; no weakening of tenant hierarchy validation, UUID gating, or sanitizers.
- **Checks:** `npm run build`, `npm run test`; full RLS matrix completed; secrets grep clean after every commit.
- **Codex review focus:** any new migration (idempotency, no broad grants, no anon access); RLS matrix gaps; accidental env/secret leakage in commits.
- **Owner checkpoint:** (1) approval to create the staging project and apply migrations **before starting**; (2) sign-off on the feedback-policy decision; (3) review of the RLS matrix. **Gate to 19C.**

### Phase 19C — PC2 n8n/Modules Callback Dry-Run Integration
- **Goal:** stand up the locked architecture's automation backbone in **dry-run only**: n8n (local/PC2) can call a Core-side webhook endpoint that validates, logs to the event inbox, and does nothing else.
- **Deliverables:**
  - Design doc first (`07_docs/pc2_n8n_dryrun_design.md`): endpoint shape, auth (`WEBHOOK_SHARED_SECRET` via backend — Supabase Edge Function or small server; NEVER the React frontend), payload schema, idempotency/replay handling, kill switch.
  - Backend webhook receiver (dry-run mode hardcoded ON): validates secret + schema, writes a `connector_events`-style row, returns 200. No side effects on content/approvals.
  - Connector Registry / Event Inbox wired to read those real (dry-run) events alongside mock ones, clearly labeled `dry_run`.
  - n8n test workflow (exported JSON in `04_workflows/`, no credentials inside) that pings the endpoint.
  - Runbook: `08_logs/phase_19c_dryrun_runbook.md` — how to run, how to verify, how to kill.
- **Files likely touched:** new backend function dir (e.g. `supabase/functions/webhook-inbox/` or equivalent), `src/lib/core/connectorRegistry.ts` + `ConnectorRegistryTab.tsx` (read/label dry-run events only), `04_workflows/`, `07_docs/`, `08_logs/`, possibly an additive `connector_events` migration.
- **Safety rules:** dry-run flag hardcoded ON for the whole phase; webhook can only INSERT event rows — it must not mutate content/approval/asset state; secret lives in backend env only; reject unsigned/invalid payloads; rate-limit or size-cap inbound payloads; no outbound calls from Core to any platform; staging DB only.
- **Checks:** `npm run build`, `npm run test` + new unit tests for payload validation/signature check; manual: valid ping accepted + logged, tampered signature rejected, replay handled; secrets grep clean.
- **Codex review focus:** the webhook receiver (auth, injection, schema validation, no state mutation beyond event insert); that the frontend gained zero new network calls; migration idempotency.
- **Owner checkpoint:** design doc approved **before any code**; demo of dry-run ping + kill switch at phase end. **Gate to 19F planning having any teeth.**

### Phase 19D — Client Demo Package
- **Goal:** everything needed to run a controlled client demo confidently, as a repeatable kit.
- **Deliverables:**
  - `07_docs/demo_day_runbook.md`: pre-flight checklist (reset localStorage, browser/zoom settings, Client View default, which brand/campaign to open), 15–20 min walkthrough with talk track, Q&A annex reusing `faq_for_clients.md` + `demo_vs_real_boundary.md`, recovery steps if something breaks mid-demo.
  - Sample-data review: ensure demo brands/campaigns read well for the target audience (extend `coreData.ts` seed data only if Owner asks; default = keep F&B samples).
  - Vercel deploy verification: production URL serves the closure-baseline build (or newer reviewed commit); document the deployed commit hash in the runbook.
  - One rehearsal run logged in `08_logs/`.
- **Files likely touched:** `07_docs/demo_day_runbook.md` (new), `07_docs/client_demo_script.md` (refresh), `08_logs/` rehearsal log; optionally `src/lib/core/coreData.ts` seed text (Owner-requested only).
- **Safety rules:** demo runs in Local/Demo mode (no Supabase env on the demo machine unless Owner explicitly wants the staging demo); no real client names/data in samples; Client View for the audience-facing portion.
- **Checks:** `npm run build`, `npm run test`; rehearsal completed end-to-end without touching Owner-only tabs in Client View.
- **Codex review focus:** doc accuracy vs actual UI (no promised features that don't exist); any seed-data diff stays cosmetic.
- **Owner checkpoint:** Owner attends/reviews the rehearsal and approves the runbook before any external audience.
- **Parallel-safe with 19B.**

### Phase 19E — UI/Brand Polish
- **Goal:** production-grade frontend hygiene without behavior change.
- **Deliverables:**
  - Code-splitting: lazy-load heavy tabs (`React.lazy`/dynamic import) to get the main chunk well under 500 kB; document before/after sizes.
  - ESLint (+ typescript-eslint) with a minimal, repo-appropriate config + `npm run lint`; fix only mechanical findings, suppress-with-comment anything risky.
  - Accessibility pass on the core flow (labels, focus states, contrast on badges) — fixes limited to attributes/styles.
  - Optional (Owner call): favicon/og-meta/brand asset refresh.
- **Files likely touched:** `src/App.tsx` (lazy imports), `package.json` (lint script + devDeps), new `.eslintrc`/`eslint.config`, tab components (a11y attributes), `index.html` (meta).
- **Safety rules:** zero behavior change — routing/repos/sanitizers untouched; every sub-step its own commit; bundle-split verified by loading every tab manually after the change.
- **Checks:** `npm run build` (record chunk sizes), `npm run test`, new `npm run lint` clean; manual tab-by-tab load check after splitting.
- **Codex review focus:** lazy-loading didn't change mount/data-load order (Supabase mount effect timing!); lint autofixes didn't alter logic.
- **Owner checkpoint:** none required to start (low risk); review at end. Can fill idle time between other phases.

### Phase 19F — Real Connector Readiness Plan (plan only inside Ver2)
- **Goal:** a written, gated activation framework — so that when the Owner says "go", the path is already safe. **This phase produces documents, not connections.**
- **Deliverables:**
  - `07_docs/connector_activation_framework.md`: the 5 mandatory gates per connector — (a) written Owner approval, (b) backend-proxy secrets (never frontend), (c) dry-run mode first with logged would-be actions, (d) per-connector kill switch + global kill switch, (e) audit logging of every outbound action. Plus rollback procedure and incident contact.
  - Per-connector one-pagers (n8n first, then Meta/Canva/Google/ComfyUI): scopes/permissions needed, data sent/received, failure modes, cost, minimum viable dry-run.
  - Explicit "never list" carried from MVP: no auto-post, no auto-ads-spend, no auto-messaging to real customers — these require their own future framework revision, not just a connector gate.
  - Activation order recommendation: n8n (backbone, 19C already dry-ran it) → content tools (Canva) → analytics read-only (Meta/Google insights) → anything that *writes* to the outside world last.
- **Files likely touched:** `07_docs/` only (+ updates to `future_real_connectors.md`).
- **Safety rules:** no code, no env vars, no API registrations in this phase.
- **Checks:** `npm run build` / `npm run test` (unchanged), docs review.
- **Codex review focus:** gate completeness; no doc implies activation is pre-approved.
- **Owner checkpoint:** Owner signs the framework itself; each future activation then needs its own per-connector sign-off against it.

## 4. Suggested sequencing

```
19A (E2E + script)  ──►  19B (Supabase staging) ──►  19C (n8n dry-run) ──► 19F (connector plan sign-off)
        │                       │
        └──►  19D (demo package, parallel with 19B)
19E (UI polish) — parallel filler anytime after 19A
```

Every phase: small commits → build + test green → Codex review → Owner checkpoint → close in CURRENT_PHASE.md + logs (same discipline as Phases 16A–18).

## 5. Standing safety rules for ALL of Ver2

- No real ads, posting, messaging, or live automation — at any point, in any phase.
- No secrets in the repo, ever; backend-only secret handling; `.env.local` gitignored.
- Production Supabase env stays OFF until a dedicated, Owner-approved production phase (not in this roadmap).
- Phase 16D UUID gating, tenant scoping, sanitizers, and RLS validation are load-bearing — no phase may weaken them; any change to them requires its own Codex review.
- FnB OS V1 stays untouched.
- Anything not listed in a phase's deliverables is out of that phase's scope.

---

**Recommended first implementation phase: 19A — Manual Browser E2E Pass + Demo Script Verification.** Zero risk, no approvals needed to start, closes the MVP's only open verification gap, and gates everything else.
