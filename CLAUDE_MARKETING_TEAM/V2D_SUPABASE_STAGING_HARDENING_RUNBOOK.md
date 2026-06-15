# V2-D — Supabase Staging Hardening Runbook (V2-D1: Audit & Runbook)

**Workstream:** Post-MVP / Ver2 — work package **V2-D1 (Owner naming) — Supabase Staging Audit & Runbook**
**Date:** 2026-06-12
**Status:** ✅ **V2-D1 (audit + runbook) DELIVERED** | 🔴 **STAGING EXECUTION (V2-D2) NOT STARTED — requires explicit Owner approval BEFORE any staging project is created or any SQL is applied.**
**Baseline:** Core MVP 18/18 closed; V2-A/V2-B/V2-C DONE/PASS; latest reviewed commit `a4b3cdb`; build 0 TS errors; tests 45/45.

> **Naming note:** In `PHASE_19_VER2_ROADMAP.md` Supabase staging hardening was listed as **roadmap-V2-B**. The Owner names this work package **V2-D** (V2-D1 = audit/runbook, V2-D2 = staging execution). This doc follows the Owner's naming — same precedent as V2-B/V2-C.

> **Scope guard (V2-D1):** Audit/documentation/checklist only. No live Supabase connection, no real secrets, no production DB writes, no live connectors, no real ads/posting/messaging/automation, no runtime behavior change, no weakening of UUID gating / tenant scope / sanitizers / RLS / repository safety.

---

## 1. Current Supabase readiness status (audit result — 2026-06-12)

### 1.1 What exists and is reviewed

| Artifact | Location | State |
|---|---|---|
| Base schema (27 tables, enums, indexes, triggers, safety seeds) | `03_core/database/schema_v1.sql` | ✅ Written. ⚠️ **NOT idempotent** (plain `CREATE TABLE`) — fresh-database only |
| RLS policy plan (Step-0 enables, bootstrap policies, 4 helper functions, group policies, apply order, 18 cross-tenant tests) | `03_core/database/rls_policy_plan.md` | ✅ Written, Codex-reviewed. ⚠️ **Markdown, not a runnable .sql file** — SQL must be extracted in §12 order |
| Brief extension (brief_status enum, 13 detail columns, backfill) | `schema_v1_phase16b2_brief_extension.sql` | ✅ Additive, idempotent |
| Generation extension (`content_plan_jobs`/`content_plan_items` + own RLS) | `schema_v1_phase16c1_generation_extension.sql` | ✅ Additive, idempotent, Codex PASS |
| Approval extension (`content_approval_requests`/`events`/`comments` + own RLS) | `schema_v1_phase16c2_approval_extension.sql` | ✅ Additive, idempotent, Codex PASS |
| Asset extension (`content_assets`/`content_asset_collections` + own RLS) | `schema_v1_phase16d_asset_extension.sql` | ✅ Additive, idempotent, Codex PASS |
| Supabase client gate | `src/lib/supabaseClient.ts` | ✅ `isSupabaseConfigured` requires non-placeholder `https://` URL + anon key; client is `null` otherwise |
| Supabase repositories (per-entity, scoped, UUID-asserted) | `src/lib/core/supabaseRepositories.ts` | ✅ Wired for clients/brands/campaigns/briefs/generation/approval/assets/collections |
| localStorage fallback repositories | `src/lib/core/localStorageRepositories.ts` | ✅ Full parity for wired entities |
| UUID routing gates | `src/lib/core/repoRouting.ts` (+ 34 tests) | ✅ `assetScopeIsSupabaseSafe` / `approvalScopeIsSupabaseSafe` / `okOrAbsentUuid` |
| Patch sanitizers | `src/lib/core/coreRepository.ts` (+ 11 tests) | ✅ `sanitizeBriefPatch` / `sanitizeGenerationPatch` / `sanitizeAssetPatch` strip tenant/identity/audit fields |
| Env template | `.env.example` | ✅ Placeholders only; service-role key explicitly marked server-side-only |
| Apply guide (fresh project) | `03_core/database/README.md` | ✅ Steps 1–7 + CLI option |
| Wiring plan / fallback docs | `03_core/supabase_wiring_README.md`, `07_docs/MVP_READINESS_CHECKLIST.md` | ✅ Exist; describe local-fallback architecture |

### 1.2 Audit findings that shape this runbook (read before executing V2-D2)

1. **Legacy-vs-wired table duality.** `schema_v1.sql` contains Phase-2 tables (`generation_jobs`, `content_items`, `approval_requests`, `approval_events`, `approval_comments`, `assets`, `asset_collections`) that the **code does not use** — the wired repositories use the extension tables (`content_plan_*`, `content_approval_*`, `content_assets`, `content_asset_collections`). Legacy tables stay empty in staging; do not seed or test against them, and do not drop them in V2-D2 (out of scope).
2. **`user_roles` lockout trap.** schema_v1 enables RLS on `user_roles` with **zero policies** → `fetchUserRole()` reads nothing → every signed-in user falls back to `viewer`. The bootstrap policies (rls_policy_plan §3) MUST be applied immediately after Step 0 or the staging owner account will appear role-less.
3. **`roles` table RLS gap.** `roles` needs RLS enabled + an authenticated-read policy (documented in rls_policy_plan; previously missed in an earlier audit).
4. **16 of 27 base tables have no RLS until the plan is applied.** rls_policy_plan §2 (Step 0) enables them. Extension tables ship with their own RLS inline.
5. **Client-role feedback is owner/manager-gated under RLS** (16C-2 Codex fix): `content_approval_events_insert`/`content_approval_comments_insert` are owner/manager-only. In a staging test with a client-role user, ClientViewTab "Add Feedback" **will fail by design**. Policy decision (dedicated feedback role vs relaxed policy) is an explicit Owner checkpoint (§12) — do NOT relax the policy ad hoc during staging.
6. **Module/callback tables are present but unwired.** `module_events`, `webhook_callbacks`, `connector_registry`, `module_registry`, `automation_logs` exist in schema_v1 (Group F) with no repository wiring — Connector Inbox/Automation Logs remain localStorage-only, and the PC2 n8n/modules workstream is at **N12 post-merge cleanup (integration-ready handoff, `stabilized_mock_ready`)**. They get RLS via Step 0 but are otherwise out of staging-test scope (see §5 matrix row 9).
7. **Calendar/Reports are not Supabase-wired** — excluded from staging CRUD verification.
8. **Mixed-ID browsers.** A browser that used the demo accumulates local-format ids (`client-*`, `brand-*`, `campaign-*`, `brief-*`, `generation-*`, `item-*`, `approval-*`, `asset-*`, `col-*`). With Supabase ON, the UUID gates route any operation touching those ids back to localStorage **per operation** — this is correct behavior, not a bug; testers must understand it before filing issues (§7.4).

### 1.3 Verdict

**Ready to plan, not yet ready to execute.** All SQL artifacts, code gates, and fallback paths exist and are reviewed; the open work is operational (apply order, verification, seed data, policy decision) — exactly what V2-D2 will execute under this runbook, after Owner approval.

---

## 2. Staging vs local demo — the distinction

| | Local demo (today, production Vercel) | Staging (V2-D2 target) |
|---|---|---|
| Supabase env | Unset → `supabase = null` | Set in `.env.local` (dev) or a **separate** Vercel preview env |
| Data location | Browser localStorage only | Disposable Supabase project (staging tenant) |
| Auth | "Demo Sign In" (`owner@thecore.agency` / `demo1234`, local) | Real Supabase email auth, staging-only users |
| Header badge | Amber **"Local Data Only"** | Emerald **"Supabase Data"** |
| Login screen | "Demo Sign In" + pre-filled credentials | "Sign in" (no demo hint) |
| Data realness | Seeded fictional brands | **Fictional sample data ONLY** (§8) — never real customer data |
| Blast radius | One browser | One throwaway DB, deletable at any time |
| Production `claude-marketing-team-demo.vercel.app` | Stays in local-demo mode | **UNCHANGED — staging must never touch the production deployment's env** |

**Rule:** staging uses a dedicated Supabase project created for this purpose and named so it cannot be mistaken for production (e.g. `core-agency-staging-disposable`). The existing production Vercel env stays OFF.

---

## 3. Required environment variables

| Variable | Where | Staging use |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` (dev) / Vercel preview env only | Staging project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` / Vercel preview env only | Staging **anon** key — the ONLY key that may reach the frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | **NEVER frontend, NEVER Vercel, NEVER repo.** Local operator machine only, if needed for admin SQL | Prefer the Supabase dashboard SQL editor instead of using this key at all |
| `DATABASE_URL` | Local operator machine only (psql/CLI apply path) | Optional; dashboard SQL editor is the default path |
| `WEBHOOK_SHARED_SECRET`, `N8N_*`, `ANTHROPIC_API_KEY` | Not used in V2-D | Stay unset — PC2 workstream paused; no AI calls in staging scope |

**Explicit no-secrets rule:** real values live ONLY in `.env.local` (gitignored) or the operator's password manager. Nothing real is ever committed, pasted into docs/logs/issues/screenshots, or added to the production Vercel project. `.env.example` keeps placeholders only. Any leaked key = rotate immediately in the Supabase dashboard, then treat the staging project as disposable (delete + recreate).

---

## 4. Runbook — V2-D2 execution checklists

> **Gate: do not start §4.1 until Owner approval is logged (§12 checkpoint A).**

### 4.1 Staging project setup
- [ ] Create new Supabase project, name `core-agency-staging-disposable`, region SE Asia, strong DB password (password manager only)
- [ ] Enable Email auth provider; disable "Confirm email" (staging convenience); create 4 staging users: `stg-owner@…`, `stg-manager@…`, `stg-client@…`, `stg-viewer@…` (fictional addresses, throwaway passwords)
- [ ] Record project ref + user UUIDs in a local (uncommitted) staging worksheet

### 4.2 Migration apply checklist (exact order — do not reorder)
| # | Apply | Source | Verify after |
|---|---|---|---|
| M1 | `schema_v1.sql` (whole file, fresh DB) | `03_core/database/` | 27 tables exist; `roles` seeded (owner/manager/client/viewer); `system_settings` shows `auto_post_enabled=false`, `auto_ads_enabled=false`, `require_approval=true` |
| M2 | rls_policy_plan **Step 0** (enable RLS on the 16 missing tables incl. `roles`) | `rls_policy_plan.md` §2 | `SELECT relname FROM pg_class JOIN pg_namespace n ON relnamespace=n.oid WHERE nspname='public' AND relkind='r' AND NOT relrowsecurity;` → 0 rows |
| M3 | rls_policy_plan **§3 bootstrap policies** (user_roles self-read, roles authenticated-read) | `rls_policy_plan.md` §3 | Signed-in staging owner resolves role `owner`, not `viewer` (finding 1.2-2) |
| M4 | rls_policy_plan **§4 helper functions** then **§5–§11 group policies**, in §12 order | `rls_policy_plan.md` | Each policy block runs without error; spot-check `pg_policies` counts per table |
| M5 | `schema_v1_phase16b2_brief_extension.sql` | `03_core/database/` | `campaign_briefs` has `brief_status` + detail columns; backfill ran (no NULL `client_id`/`brand_id`) |
| M6 | `schema_v1_phase16c1_generation_extension.sql` | `03_core/database/` | `content_plan_jobs`/`content_plan_items` exist with RLS + `content_plan_*` functions |
| M7 | `schema_v1_phase16c2_approval_extension.sql` | `03_core/database/` | `content_approval_*` tables exist; `content_approval_hierarchy_is_valid()` has the 6-arg signature |
| M8 | `schema_v1_phase16d_asset_extension.sql` | `03_core/database/` | `content_assets`/`content_asset_collections` exist; hierarchy function has the 7-arg signature |
| M9 | Re-run M5–M8 once (idempotency check) | — | All four re-run clean (extensions are `IF NOT EXISTS`/`DROP…IF EXISTS` guarded). **Do NOT re-run M1** — schema_v1 is not idempotent |
| M10 | Assign roles: staging owner→`owner`, and scoped assignments for manager/client/viewer to ONE seed client | README.md Step 4 SQL | `user_roles` rows exist, `is_active=true`, no `expires_at` in the past |

### 4.3 RLS verification checklist
- [ ] All `public` tables report `relrowsecurity = true` (M2 query)
- [ ] `user_roles` bootstrap works: each staging user can read their own assignment; none can read others'
- [ ] Run all **18 cross-tenant tests** from `rls_policy_plan.md` §14 (two clients A/B, manager scoped to A must not see/write B) — record pass/fail per test in the staging worksheet
- [ ] Extension-table policies: owner/manager can insert/update `content_plan_*`, `content_approval_*`, `content_assets*`; **client/viewer roles are read-only everywhere** (writes rejected)
- [ ] Confirm expected failure: client-role "Add Feedback" insert into `content_approval_comments` is rejected (finding 1.2-5) — log it as "by design, pending policy decision", NOT as a bug
- [ ] Hierarchy validators reject forged scope: insert attempt with mismatched `client_id`/`brand_id`/…/`content_item_id` chain fails on `content_plan_hierarchy_is_valid` / `content_approval_hierarchy_is_valid` / `content_asset_hierarchy_is_valid`
- [ ] Collection tenant check: asset referencing a collection from another brand/campaign is rejected (7th-arg check, 16D fix round 1)

### 4.4 Tenant hierarchy verification checklist (per the §5 matrix)
- [ ] Create via UI as staging owner: Client → Brand → Campaign → Brief → Generation → Approval → Asset (+1 collection) — every row lands with the full parent chain populated
- [ ] Verify each child's scope columns equal its parent's (SQL spot-check per matrix row)
- [ ] Attempt cross-tenant reads as scoped manager (client A) against client B rows → 0 rows on every entity
- [ ] Verify briefs/generations/approvals/assets cannot be re-parented via update (sanitizers strip; RLS rejects)

### 4.5 UUID gating verification checklist
- [ ] Fresh browser + Supabase ON: all creates produce DB UUIDs; rows visible in dashboard
- [ ] Browser with pre-existing local data + Supabase ON: operations on local-format ids route to localStorage (no Supabase errors in console); operations on UUID rows route to Supabase
- [ ] Mixed case (16D fix round 2): editing an asset whose CURRENT `asset_collection_id` is local-format stays on localStorage even when the patch sets a UUID/null collection
- [ ] No local-format id ever appears in a Supabase error or network payload (DevTools network sweep)
- [ ] `npm run test` 45/45 still green (routing gates + sanitizers unchanged)

---

## 5. Staging verification matrix (entity × scope × roles × RLS × ID rules)

**Legend:** Read/Write = expected staging behavior with the full RLS plan applied. O=owner, M=manager (scoped), C=client, V=viewer. "Local ID prefixes" = formats the UUID gates must keep OUT of Supabase.

| # | Entity (wired table) | Tenant/scope fields | Read | Write | Required parent hierarchy | RLS check needed | localStorage vs Supabase ID rules |
|---|---|---|---|---|---|---|---|
| 1 | **Clients** — `clients` | `id` (tenant root) | O/M(scoped)/C(own)/V(scoped) | O (M per policy plan) | — (root) | Tenant-root policies; scoped manager sees only assigned clients (§6 of plan) | Local `client-*` → localStorage; UUID required for any Supabase op |
| 2 | **Brands** — `brands` | `client_id` | scoped roles of that client | O/M(scoped) | client | Brand reads/writes bounded by `current_user_can_access_client` | `brand-*` local; list/get/create/update scoped by `clientId` (must be UUID) |
| 3 | **Campaigns** — `campaigns` | `client_id`, `brand_id` | scoped | O/M | client → brand | Campaign policies + client/brand chain | `campaign-*` local; repo requires clientId+brandId UUIDs |
| 4 | **Briefs** — `campaign_briefs` | `client_id`, `brand_id`, `campaign_id` | scoped | O/M | client → brand → campaign | Chain check; `sanitizeBriefPatch` strips tenant/identity/audit on update | `brief-*` local; +`briefId` UUID for get/update |
| 5 | **Approval requests** — `content_approval_requests` | `client_id`, `brand_id`, `campaign_id`, `brief_id`, `generation_job_id`, `content_item_id` | scoped (C/V can read) | **O/M only** (insert/update + events/comments insert) | client → brand → campaign → brief → generation → content_item (FULL 6-level chain) | `content_approval_hierarchy_is_valid()` 6-arg; child events/comments must match parent's `content_item_id`; client feedback rejected (pending policy) | `approval-*`/`item-*` local; all 5 scope ids + `approvalId` + `contentItemId` UUID-gated per op (`approvalScopeIsSupabaseSafe`) |
| 6 | **Generations / content items** — `content_plan_jobs` / `content_plan_items` | `client_id`, `brand_id`, `campaign_id`, `brief_id` (+`generation_job_id` on items) | scoped (C/V read-only) | O/M | client → brand → campaign → brief | `content_plan_user_has_scope`/`_can_write` (active, unexpired assignment); `content_plan_hierarchy_is_valid` | `generation-*`/`job-*`/`item-*` local; `sanitizeGenerationPatch` strips ownership fields |
| 7 | **Asset collections** — `content_asset_collections` | `client_id`, `brand_id`, `campaign_id?` (nullable) | scoped | O/M | client → brand (campaign optional) | Brand-level `content_asset_collection_*` scope/write functions | `col-*`/`collection-*`/`asset-collection-*` local; list/create scoped clientId+brandId UUIDs |
| 8 | **Content assets** — `content_assets` | `client_id`, `brand_id` + nullable `campaign_id`, `brief_id`, `generation_job_id`, `content_item_id`, `asset_collection_id` | scoped (C/V read-only) | O/M | client → brand; each deeper level requires its parent non-null (NULL-tolerant chain) | `content_asset_hierarchy_is_valid()` 7-arg incl. collection tenant match; `sanitizeAssetPatch` | `asset-*` + collection prefixes local; **full scope stated on get/update/archive** (`AssetScopedParams`, explicit nulls); CURRENT + NEXT collection id both gated on edit |
| 9 | **Callback / module outputs** — `module_events`, `webhook_callbacks` (+ `connector_registry`, `module_registry`, `automation_logs`) | n/a (global staff tables, Group F) | Staff-only per plan §10 | **Nobody in staging** | — | Step-0 RLS enable only; NO repository wiring exists (UI is localStorage-only); PC2 workstream at N12 post-merge cleanup (integration-ready handoff) | **Out of staging CRUD scope** — verify only that RLS is enabled and anon/client roles cannot read them. No seeding, no writes, no callback simulation in V2-D |

**Legacy tables note (finding 1.2-1):** `generation_jobs`, `content_items`, `approval_requests/events/comments`, `assets`, `asset_collections` from schema_v1 are NOT used by the app — they must stay empty in staging. Any row appearing in them during testing indicates a wiring regression → stop and investigate.

---

## 6. Seed data plan (safe sample data only)

- **Source:** re-create the three fictional demo brands via the UI as the staging owner (Cơm Tấm Bản Khói primary, Forme, Vị Cuốn) — same shape as `coreData.ts` seeds, but entered through the app so rows get real UUIDs and exercise the create paths.
- **Volume target:** 2 clients (so cross-tenant tests have an A and a B), 3 brands, 3 campaigns, 3 briefs, ≥1 generation with ≥5 content items, ≥2 approval requests (1 approved / 1 changes-requested with comments), ≥1 asset collection + ≥3 assets (one linked to the collection, one campaign-level, one brand-level with nulls).
- **Hard rules:** fictional businesses only; no real customer names/phones/addresses; no real ad budgets that could be mistaken for spend commitments; Vietnamese sample text fine; nothing imported from any real client document.
- **Reset path:** staging is disposable — to reset, delete all rows child-first (assets → approvals → items/jobs → briefs → campaigns → brands → clients) or simply delete and recreate the whole project (M1–M10 again).

---

## 7. Rollback / recovery notes

1. **App-level kill switch:** remove/blank `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from `.env.local` (or the Vercel preview env) and reload → `isSupabaseConfigured=false` → the entire app falls back to localStorage instantly. No data migration needed; local data was never overwritten.
2. **Bad migration:** extensions (M5–M8) are idempotent — fix the SQL, re-run. `schema_v1.sql` is NOT — if M1 itself fails midway, delete the staging project and start over rather than hand-patching.
3. **Policy mistake locking everyone out:** use the dashboard SQL editor (bypasses RLS as postgres role) to `DROP POLICY`/fix; the §3 bootstrap policies are the first thing to re-check.
4. **Mixed-ID confusion during testing:** expected behavior (finding 1.2-8). To get a clean slate, clear the browser's `core_agency_*`/`claude_marketing_team_*` localStorage keys AND use a fresh profile — don't delete DB rows to "fix" a routing observation.
5. **Suspected key exposure:** rotate keys in dashboard → if service-role key was involved, delete the staging project entirely (it is disposable by definition).
6. **Production safety:** production Vercel env vars are never touched in V2-D; rollback of staging never involves the production deployment.

---

## 8. Staging safety boundaries (non-negotiable)

1. **No service-role key in the frontend, in Vercel, or in the repo** — anon key only in the browser; RLS is the security boundary.
2. **No real customer data** — fictional sample data only (§6).
3. **No real ads / posting / messaging** — staging contains plans and drafts; nothing executes externally. `auto_post_enabled=false`, `auto_ads_enabled=false`, `require_approval=true` seeds verified at M1.
4. **No live connectors** — Group F stays unwired; PC2 n8n workstream is paused; `WEBHOOK_SHARED_SECRET`/`N8N_*` stay unset.
5. **No production DB until Owner approval** — production Supabase env stays OFF regardless of staging outcome; enabling it is a separate, Owner-approved decision after this runbook's verification passes.
6. **Staging itself starts only after explicit Owner approval** (§12 checkpoint A) — creating the staging project before approval is a process violation even though the project would be disposable.

---

## 9. Known risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | `user_roles` lockout (RLS, no policies) → everyone is `viewer` | High (blocks all testing) | M3 bootstrap immediately after M2; verify before proceeding |
| R2 | rls_policy_plan is markdown — transcription errors when extracting SQL | Medium | Extract to a working `.sql` scratch file locally; apply section by section; verify per M4; (optional V2-D2 improvement: commit the extracted file as a reviewed migration) |
| R3 | `schema_v1.sql` not idempotent — partial apply leaves a half-built DB | Medium | Fresh project per attempt; never re-run M1 on a used DB |
| R4 | Legacy/wired table duality confuses testers (empty `assets` table looks like a bug) | Medium | §5 matrix note + staging worksheet states which tables are live |
| R5 | Client-role feedback rejected under RLS (by design) misreported as blocker | Medium | §4.3 expected-failure entry; Owner policy decision is checkpoint C |
| R6 | Mixed local/UUID ids misread as data loss | Low | §7.4; tester briefing before §4.4 |
| R7 | Staging credentials leak via screenshots/logs during testing | Medium | §3 no-secrets rule; redact URLs/keys in any filed issue; rotate on suspicion |
| R8 | Drift between staging-verified SQL and repo files if fixes are made ad hoc in the dashboard | Medium | Any SQL fix made during staging MUST be backported to the repo file in the same session and noted in the worksheet |
| R9 | Accidentally configuring the PRODUCTION Vercel project instead of a preview env | High | §2 rule: staging env only in `.env.local` or a clearly-named preview environment; never edit production env vars in V2-D |

---

## 10. Owner approval checkpoints

| Checkpoint | When | What the Owner approves | Status |
|---|---|---|---|
| **A — Start staging (gate for all of §4)** | Before creating the Supabase staging project | Creating a disposable staging project + applying M1–M10 per this runbook | 🔴 **PENDING — nothing executes until this is logged** |
| **B — Verification verdict** | After §4.3–§4.5 checklists complete | Accept the staging verification results (18/18 cross-tenant tests + matrix rows) recorded in the staging worksheet → marks V2-D2 done | ⬜ Not reached |
| **C — Client-feedback policy decision** | During/after B | Either a dedicated feedback-write policy/role for client users, or keep owner/manager-only and route client feedback outside the app | ⬜ Not reached |
| **D — Any production enablement** | Separate, future decision — NOT part of V2-D | Turning Supabase env ON for the production deployment | ⬜ Not in scope; requires B+C plus its own review |

---

## 11. V2-D1 → V2-D2 handoff

**V2-D1 (this doc) delivers:** the audit (§1), the distinction and env rules (§2–§3), the executable checklists (§4), the verification matrix (§5), seed plan (§6), rollback notes (§7), boundaries (§8), risks (§9), and checkpoints (§10).

**V2-D2 (next, Owner-gated) executes:** checkpoint A approval → §4.1 setup → §4.2 migrations → §4.3–§4.5 verification with a filed staging worksheet/report (pattern: `08_logs/v2d2_staging_report_YYYYMMDD.md`) → checkpoint B verdict + checkpoint C policy decision. V2-D2 is DONE only when the report is filed and Owner approval is logged — deliverable-docs-ready ≠ package-closed (standing rule from V2-A/V2-C).
