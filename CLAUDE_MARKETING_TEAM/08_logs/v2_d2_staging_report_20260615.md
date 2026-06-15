# V2-D2 Staging Verification Report — 2026-06-15

**Work package:** V2-D2 — Supabase Staging Execution (per `V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md`).
**Owner approval:** ✅ **Checkpoint A APPROVED** by Owner (2026-06-15) — authorizes creating a disposable staging project and applying migrations per the runbook.
**Executed by:** PC1 (Claude Code).
**Commit under test:** `2f1b700` (origin/main).

## STATUS: ✅ CHECKPOINT A PASS (process/docs) — 🔴 CHECKPOINT B VERDICT = BLOCKED (DB verification could not run) — Checkpoint C NOT STARTED / Owner-gated

> **No SQL was run. No database was connected. No staging project was created. No verification was faked.**
> Owner approved Checkpoint A, but the execution prerequisites — a provisioned disposable Supabase staging project and its env vars — do not exist in this environment. Per the runbook §3 and the task's hard boundary ("If required Supabase staging env vars are missing, STOP and document the exact missing variables. Do not fake verification."), execution is halted pending provisioning. **Checkpoint A (the honest preflight + blocked-execution report) passed Codex review; Checkpoint B renders the verification verdict: BLOCKED** (see §10–§12). All DB-level verification sections remain **NOT EXECUTED**. Re-checked 2026-06-15: env still MISSING, `.env.local` still absent — nothing has changed since Checkpoint A.

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

## 9. Verdict & required action (Checkpoint A)

- **Checkpoint A:** ✅ **PASS** (Owner-approved; preflight executed; honest blocked-execution report produced and Codex-reviewed PASS). *This PASS is on the Checkpoint-A process/documentation — not a claim that DB verification succeeded.*
- **Execution:** 🔴 **BLOCKED** — no disposable Supabase staging project and no staging env vars exist; agent cannot provision them.

**Exact blocker:** the four env vars in §2 are MISSING and no `core-agency-staging-disposable` project exists.

**To unblock (Owner/operator actions — runbook §4.1):**
1. Create a **disposable** Supabase project named `core-agency-staging-disposable` (NOT production).
2. Create 4 staging auth users (owner/manager/client/viewer; fictional addresses; throwaway passwords).
3. Put the project's **anon** URL + key into a local `.env.local` (gitignored) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Never commit; never put the service-role key in frontend/Vercel/repo.
4. Hand back control (or run M1–M10 with PC1 driving the SQL from the runbook) so §3–§8 can execute against the disposable project.

Until step 1–3 are done, V2-D2 stays blocked. Production Supabase env remains OFF; no SQL has run.

---

## 10. Checkpoint B — Verification Verdict (2026-06-15)

### Overall result: 🔴 **BLOCKED**

The substantive V2-D2 verification (migrations, schema objects, tenant hierarchy, RLS, role separation) **could not run** because no disposable Supabase staging environment exists (env re-checked 2026-06-15: still MISSING). This is **BLOCKED**, not VERIFIED/PARTIAL/FAILED:
- Not **VERIFIED** — none of the DB-level checks executed.
- Not **FAILED** — nothing ran, so nothing failed; no defect was observed.
- Not **PARTIAL** — the executed portion (preflight) is preparatory only; zero of the staging verification criteria (§6–§7) ran.

### What actually ran
- ✅ Preflight: branch/sync, `npm run build` (0 TS errors), `npm run test` (45/45), secrets scan (clean), staging-env presence check (all MISSING — values never printed).
- ✅ Documentation: migration plan (M1–M10), cross-tenant matrix (9×7), rollback, stop conditions, and the approval/callback safety restatement were authored and are ready to execute.

### What did not run
- 🔴 Every DB-level item in §6 (schema/RLS/hierarchy/helpers/role-separation/UUID-gating) and §7 (cross-tenant matrix + the 18 rls_policy_plan §14 tests) — **0 executed**.
- 🔴 DB-level enforcement of approval/callback role separation (§8 DB-level).

### What evidence exists
- The preflight command outputs (build PASS, tests 45/45, env-presence MISSING) — reproducible via the §1 table.
- This report itself as the audit trail. **No screenshots/SQL logs exist because no DB session occurred.**

### What assumptions were made
- That the existing repo SQL artifacts (schema_v1 + 4 extension migrations + rls_policy_plan) are the intended migration set — based on the V2-D1 audit, **not** re-validated against a live DB.
- That code/contract-level approval-safety invariants hold — based on the existing 45 passing tests + V2-E review, **not** on DB-level RLS execution.

### What remains unverified
- All of §6 and §7 (the actual purpose of V2-D2). Nothing about the live database behavior has been confirmed.

### Exact next action recommended
- Owner/operator provisions the disposable staging project + `.env.local` (steps in §9). Then PC1 drives M1–M10 and executes §6–§7, replacing every ⬜ with PASS/FAIL + evidence, and re-issues the Checkpoint B verdict.

### Can the Owner proceed to Checkpoint C?
- 🔴 **No — not on the basis of a completed verification.** Checkpoint C (client-role feedback RLS policy decision) is **NOT STARTED / Owner-gated** and should follow a *VERIFIED* Checkpoint B, because the decision benefits from observed RLS behavior. The Owner may still discuss the policy conceptually, but it must not be implemented now (out of scope) and B is not VERIFIED.

---

## 11. Evidence closure table

| Verification area | Expected behavior | Actual observed result | Evidence location | Pass/Fail/Blocked | Notes |
|---|---|---|---|---|---|
| Preflight build | 0 TS errors | Build PASS, 1575 modules | §1 PF3 / CI run 2026-06-15 | ✅ PASS | Only known 920 kB chunk warning |
| Preflight tests | 45/45 | 45/45 PASS | §1 PF4 | ✅ PASS | repoRouting 34 + coreRepository 11 |
| Secrets hygiene | No real secrets tracked | Only `.env.example` tracked; `service_role` only in comments | §1 PF5 | ✅ PASS | No keys printed/committed |
| Staging env present | env set for disposable project | All 4 vars MISSING; `.env.local` absent | §2 | 🔴 BLOCKED | Root blocker |
| Migration order (M1–M10) | Apply in documented order | Not applied | §3 | 🔴 BLOCKED | No DB |
| Schema object existence | 27 base + 4 extension table sets, safety seeds | Not checked | §6 | 🔴 BLOCKED | — |
| Tenant hierarchy checks | Forged chains rejected by validators | Not checked | §6/§7 | 🔴 BLOCKED | `*_hierarchy_is_valid()` unexercised |
| RLS policy checks | `relrowsecurity=true` on all public tables; policies enforce scope | Not checked | §6 | 🔴 BLOCKED | incl. `user_roles` lockout-trap check |
| Active/unexpired assignment checks | Helpers require active, unexpired `user_roles` | Not checked | §6 | 🔴 BLOCKED | — |
| Read/write role separation | owner/manager write; client/viewer read-only | Not checked | §6/§7 | 🔴 BLOCKED | — |
| UUID/localStorage gating | UUID-only to Supabase; local ids stay local | Not checked at DB; **code-level gates green (45 tests)** | §6/§8; `repoRouting.test.ts` | 🔴 BLOCKED (DB) / ✅ PASS (code) | DB-level unverified |
| brief/client/brand/campaign hierarchy | Child scope = parent scope | Not checked | §7 | 🔴 BLOCKED | — |
| asset_collection_id hierarchy validation | 7-arg tenant/campaign match enforced | Not checked | §6 | 🔴 BLOCKED | 16D fix round 1 logic unexercised at DB |
| Callback/module output tables | Present but unwired; RLS on; anon/client cannot read | Not checked at DB; **code: no repo wiring exists** | §6; V2-D1 audit | 🔴 BLOCKED (DB) / ✅ confirmed unwired (code) | Group F |
| Approval/callback safety behavior | generated/pending stay until Core UI action; callbacks non-authoritative | No code changed → invariant intact; DB-level RLS not checked | §8 | 🔴 BLOCKED (DB-RLS) / ✅ PASS (code/contract) | Load-bearing contract preserved |
| failed_mock / error route | Routes to failure/error; never enters approval | Contract/code path intact; not exercised against DB | §8; V2-E1/E2 | ✅ PASS (contract) / 🔴 BLOCKED (DB) | — |
| needs_revision/rejected-like metadata | Treated as human-review metadata, not a Core transition | Contract/code intact; not exercised against DB | §8; V2-E1/E2 | ✅ PASS (contract) / 🔴 BLOCKED (DB) | — |

---

## 12. Safety conclusion (Checkpoint B)

Explicitly confirmed for this run:
- ✅ **No production Supabase was used** — no project connected; production env stays OFF.
- ✅ **No production data was used** — no DB session occurred at all.
- ✅ **No secret values were printed or committed** — env checked by presence only; only `.env.example` tracked.
- ✅ **No connector was activated** — Group F unwired; registry connectors disabled.
- ✅ **No real posting, ads, messaging, or customer contact occurred.**
- ✅ **No callback-driven approval mutation exists** — no code changed; PC2 callbacks remain metadata/log/echo only.
- ✅ **Approval state remains Core UI-authoritative** — transitions require authenticated Core UI actions; `completed_mock`/`ready_for_mock_callback_preview` are statuses, not approvals.

**Checkpoint B verdict: BLOCKED. Checkpoint C: NOT STARTED / Owner-gated. No fake pass issued.**
