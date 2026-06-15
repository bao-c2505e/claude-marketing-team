# V2-D2 Staging Verification Report — 2026-06-15

**Work package:** V2-D2 — Supabase Staging Execution (per `V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md`).
**Owner approval:** ✅ **Checkpoint A APPROVED** by Owner (2026-06-15) — authorizes creating a disposable staging project and applying migrations per the runbook.
**Executed by:** PC1 (Claude Code).
**Commit under test:** `2f1b700` (origin/main).

## STATUS: 🟡 CHECKPOINT A STARTED — 🔴 EXECUTION BLOCKED (missing disposable staging environment)

> **No SQL was run. No database was connected. No staging project was created. No verification was faked.**
> Owner approved Checkpoint A, but the execution prerequisites — a provisioned disposable Supabase staging project and its env vars — do not exist in this environment. Per the runbook §3 and the task's hard boundary ("If required Supabase staging env vars are missing, STOP and document the exact missing variables. Do not fake verification."), execution is halted here pending provisioning. All verification sections below are marked **NOT EXECUTED**.

---

## 1. Preflight results (2026-06-15)

| # | Check | Result |
|---|---|---|
| PF1 | Branch & sync | ✅ On `main`, `## main...origin/main` (in sync), working tree clean |
| PF2 | Commit under test | ✅ `2f1b700` (docs: add manual e2e checklist and demo script) |
| PF3 | `npm run build` | ✅ PASS — 0 TS errors, 1575 modules (only the known 920 kB chunk-size warning) |
| PF4 | `npm run test` | ✅ PASS — 45/45 (repoRouting 34, coreRepository 11) |
| PF5 | No secrets in repo | ✅ Only `.env.example` / `modules/comfyui-pipeline/.env.example` tracked; `service_role` appears only in SQL/code **comments and safety notes**, no real keys |
| PF6 | No live connectors | ✅ App runs in Local mode; Connector Registry connectors are registered/disabled by design |
| PF7 | Data mode | ✅ **Local Data Only** — Supabase unconfigured → `isSupabaseConfigured = false` |
| PF8 | Staging env present | 🔴 **MISSING — BLOCKER** (see §2) |

---

## 2. Staging target confirmation & BLOCKER (env redacted)

**Target intended:** a **disposable** Supabase staging project (runbook name `core-agency-staging-disposable`), never production.
**Target actual state:** ❌ **NOT PROVISIONED.** No staging Supabase project exists, and this environment has no way to create one (project creation is a manual Supabase-dashboard action requiring a human-held account).

**Required env vars — presence check (values never printed):**

| Variable | Required for | Presence |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend → staging project URL | 🔴 **MISSING** |
| `VITE_SUPABASE_ANON_KEY` | Frontend → staging anon key (the only key allowed in frontend) | 🔴 **MISSING** |
| `SUPABASE_SERVICE_ROLE_KEY` | (Operator machine only — NOT frontend/Vercel/repo) optional admin SQL path | 🔴 **MISSING** (and must never be committed) |
| `DATABASE_URL` | (Operator machine only) optional psql/CLI apply path | 🔴 **MISSING** |

**Filesystem:** `.env.local` ❌ absent, `.env` ❌ absent. `.gitignore` correctly excludes `.env` / `.env.local` / `.env.*.local` (verified). Nothing to redact because nothing exists.

**Why this is a hard stop (not a soft skip):** the runbook §4.1 requires a human to (1) create the disposable Supabase project, (2) create staging auth users (owner/manager/client/viewer), (3) place the project's anon URL+key in `.env.local`. None of these can be performed by this agent — they require account credentials and dashboard access held only by the Owner/operator. Proceeding without them could only produce **fabricated** results, which the boundary forbids.

---

## 3. Migration files selected & intended order (READY — NOT EXECUTED)

Per runbook §4.2. To be applied **only** against the disposable staging project once provisioned:

| Step | File / source | Idempotent? | Status |
|---|---|---|---|
| M1 | `03_core/database/schema_v1.sql` (whole, fresh DB) | ❌ No — fresh DB only, never re-run | ⬜ NOT EXECUTED |
| M2 | `rls_policy_plan.md` §2 — Step 0 (enable RLS on 16 missing tables incl. `roles`) | n/a (ALTER) | ⬜ NOT EXECUTED |
| M3 | `rls_policy_plan.md` §3 — bootstrap policies (user_roles self-read, roles authenticated-read) | n/a | ⬜ NOT EXECUTED |
| M4 | `rls_policy_plan.md` §4 helpers + §5–§11 group policies (in §12 order) | CREATE OR REPLACE | ⬜ NOT EXECUTED |
| M5 | `schema_v1_phase16b2_brief_extension.sql` | ✅ Yes | ⬜ NOT EXECUTED |
| M6 | `schema_v1_phase16c1_generation_extension.sql` | ✅ Yes | ⬜ NOT EXECUTED |
| M7 | `schema_v1_phase16c2_approval_extension.sql` | ✅ Yes | ⬜ NOT EXECUTED |
| M8 | `schema_v1_phase16d_asset_extension.sql` | ✅ Yes | ⬜ NOT EXECUTED |
| M9 | Re-run M5–M8 once (idempotency check; do NOT re-run M1) | — | ⬜ NOT EXECUTED |
| M10 | Role assignments (owner→`owner`; scoped manager/client/viewer to one seed client) | — | ⬜ NOT EXECUTED |

---

## 4. Rollback / recovery plan (unchanged from runbook §7)

- **Kill switch:** blank `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` → `isSupabaseConfigured=false` → instant localStorage fallback; local data never overwritten.
- **Bad migration:** extensions (M5–M8) are idempotent → fix + re-run; `schema_v1.sql` (M1) is not → delete the disposable project and restart.
- **Lockout:** dashboard SQL editor (postgres role bypasses RLS) to fix policies; re-check §3 bootstrap first.
- **Disposable by definition:** any doubt → delete the staging project and recreate. Production Vercel env is never touched.

---

## 5. Stop conditions (active — from runbook §8 / checklist §6)

Execution must halt + escalate on: SQL attempt before this report's Checkpoint A is honored against a *disposable* target; any secret exposure; any connector activation; any approval state mutated by a PC2 callback; any tenant/scope mismatch; any build/test failure. **This run halted on the prerequisite-missing condition (no disposable staging env) — the safest possible stop, before any DB action.**

---

## 6. Migration / RLS verification (NOT EXECUTED — blocked)

All items below require a live disposable staging DB. **None ran.** They remain the exact acceptance criteria for when §2 is unblocked:

- ⬜ Schema objects exist (27 base tables + 4 extension table sets; safety seeds `auto_post_enabled=false`/`auto_ads_enabled=false`/`require_approval=true`)
- ⬜ All `public` tables report `relrowsecurity = true` after M2
- ⬜ `user_roles` bootstrap resolves owner as `owner` (not `viewer`) — the lockout-trap check
- ⬜ Tenant hierarchy constraints reject forged chains (`content_plan_hierarchy_is_valid`, `content_approval_hierarchy_is_valid` 6-arg, `content_asset_hierarchy_is_valid` 7-arg incl. collection tenant match)
- ⬜ Helper functions require **active + unexpired** `user_roles` assignments
- ⬜ Read/write role separation (owner/manager write; client/viewer read-only everywhere)
- ⬜ UUID-only assumptions hold (every id written/filtered is a UUID)
- ⬜ localStorage-format ids (`client-*`/`brand-*`/`campaign-*`/`brief-*`/`generation-*`/`item-*`/`asset-*`/`col-*`) never reach a UUID column (routing gates)
- ⬜ brief/client/brand/campaign hierarchy consistency
- ⬜ `asset_collection_id` hierarchy validation (7th-arg tenant/campaign match)
- ⬜ Callback/module Group F tables present-but-unwired (RLS enabled via Step 0; no repository wiring; anon/client cannot read)

---

## 7. Cross-tenant test matrix (DEFINED — NOT EXECUTED)

Two tenants (Client A / Client B); manager scoped to A. For each entity, the seven assertions below run once unblocked. **0 of N executed.**

| Entity | correct-tenant read | wrong-tenant read denied | write role writes | read-only denied write | inactive/expired denied | parent mismatch rejected | UUID/local gating |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| clients | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | n/a (root) | ⬜ |
| brands | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| campaigns | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| briefs | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| generations/content items | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| assets | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| asset collections | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| approvals | ⬜ | ⬜ | ⬜ (O/M only) | ⬜ (C/V denied) | ⬜ | ⬜ | ⬜ |
| callback/module outputs | ⬜ (staff only) | ⬜ | ⬜ (nobody in staging) | ⬜ | ⬜ | n/a | n/a |

Plus the full **18 cross-tenant tests** from `rls_policy_plan.md` §14 — ⬜ NOT EXECUTED.

---

## 8. Approval / callback safety verification

**DB-level (RLS) verification:** ⬜ NOT EXECUTED (blocked — needs staging DB).

**Code/contract-level invariants (already established, unchanged by this run — not a substitute for the DB-level RLS checks above):**
- ✅ `generated` stays `generated` / `pending` stays `pending` unless an authenticated Core UI action changes it — enforced in app logic; PC2 callbacks are non-authoritative (V2-E1/V2-E2; covered by the 45 passing unit tests on routing/sanitizers).
- ✅ PC2 `approved`-like callback maps only to metadata / `ready_for_mock_callback_preview` (N8 mock gate echo of an existing Core decision) — never creates/flips a Core approval.
- ✅ `completed_mock` is only the N11/N12 E2E **final mock status**, not an approval shortcut.
- ✅ `failed_mock` routes to failure/error handling (N9 error/retry/dead-letter), never into the approval flow.
- ✅ `needs_revision`/`rejected`-like PC2 statuses are metadata requiring human review, not Core state transitions.
- ✅ **No callback mutates Core approval decisions** — the load-bearing safety contract; unchanged by V2-D2 (this run added no code).

> Note: these invariants live in Core app code + contracts and are verified by the existing test suite and V2-E review. The **RLS enforcement** of read/write role separation at the database layer is what remains blocked and unverified.

---

## 9. Verdict & required action

- **Checkpoint A:** ✅ STARTED (Owner-approved).
- **Execution:** 🔴 **BLOCKED** — no disposable Supabase staging project and no staging env vars exist; agent cannot provision them.
- **Checkpoint B (ready for Codex verification):** 🔴 **NOT READY** — verification did not run. **No fake pass.**

**Exact blocker:** the four env vars in §2 are MISSING and no `core-agency-staging-disposable` project exists.

**To unblock (Owner/operator actions — runbook §4.1):**
1. Create a **disposable** Supabase project named `core-agency-staging-disposable` (NOT production).
2. Create 4 staging auth users (owner/manager/client/viewer; fictional addresses; throwaway passwords).
3. Put the project's **anon** URL + key into a local `.env.local` (gitignored) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Never commit; never put the service-role key in frontend/Vercel/repo.
4. Hand back control (or run M1–M10 with PC1 driving the SQL from the runbook) so §3–§8 can execute against the disposable project.

Until step 1–3 are done, V2-D2 stays at Checkpoint A / blocked. Production Supabase env remains OFF; no SQL has run.
