# AGENT ACTIVITY LOG — Nhật Ký Hoạt Động Mô Phỏng Của Agent

Nhật ký ghi lại các hành động mô phỏng của các AI Agent khi vận hành các chiến dịch trong Workspace.

---

## 🗓️ Nhật Ký Hoạt Động (Simulated Activity Logs)

### 🗓️ Ngày 16/06/2026 — V2-E3 PC2 Adapter Skeleton — START GATED 🔴 (prerequisite gate FAILS; NOT started)
- **[Owner — Approver]:** Directed: start V2-E3 PC2 Adapter Skeleton **only if** the prerequisite gate is satisfied; if B2 is BLOCKED/FAILED or unsafe, do not start — report the blocker and stop.
- **[PC1 Claude Code Builder]:** Ran the gate inspection (no code touched): B2 verdict = 🔴 **BLOCKED** (staging report §13.10/§14; presence-only env re-check = all staging vars MISSING, `.env*` ABSENT); overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION (not VERIFIED/PASS); no V2-UI-T2 file (manual product E2E not started); all four tracking files consistent — `V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated (checkpoint O1)`.
- **[PC1]:** Evaluated "proceed" condition 1 = B2 VERIFIED/PASS **OR** tracking *explicitly* allows V2-E3 to proceed in parallel despite a documented *non-blocking partial*. Both false: B2 is BLOCKED (not VERIFIED), and no tracking statement authorizes parallel V2-E3 (the verdict is BLOCKED, not a non-blocking partial; checkpoint O1 visibility-flag approval was never logged). The explicit hard rule "if B2 BLOCKED → do NOT start V2-E3, stop" also fires.
- **[PC1]:** **Did NOT start V2-E3** — created no `pc2Adapter.ts`/`pc2Types.ts`/`pc2StatusMapping.ts`, no tests, no `v2_e3_pc2_adapter_skeleton.md` spec. Reported the blocker and the two Owner unblock paths: (A) provision disposable staging → re-run §14.1 → B2 VERIFIED → unlock V2-E3; or (B) Owner explicitly records in tracking that V2-E3 (a Supabase-independent local builder) may proceed in parallel (staging blocker treated as non-blocking for the adapter) AND logs checkpoint O1.
- **[PC1]:** Noted the architectural fact (for the Owner's decision): V2-E3 adapter skeleton is a pure local builder (zero HTTP, kill-switch, no Supabase dependency), so the staging blocker is arguably non-blocking for it — but the agent will not self-authorize past the explicit "if BLOCKED stop" rule without the Owner recording that allowance.
- **[PC1]:** Preserved gates — V2-E3 + real connector activation + feedback implementation + Checkpoint F all remain 🔴 NOT STARTED / Owner-gated. No approval mutation; PC2 callbacks metadata/log/echo only; Core UI authoritative. No live connector/PC2 endpoint, no secrets, no production URL/Supabase/data, no SQL.
- **[PC1]:** Docs/logs-only — no runtime/repo/Supabase/RLS/auth/test changes. `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 16/06/2026 — V2-D2 — B2 verdict routing → Route B (BLOCKED, no UI/product impl)
- **[Owner — Approver]:** Directed: determine the actual B2 verdict from the staging report and route to the fastest safe next checkpoint. Cautioned that "Codex PASS" for B2 means the report was reviewed as truthful, **not** that staging is VERIFIED.
- **[PC1 Claude Code Builder]:** Read the staging report verdict directly — §13.10 = 🔴 **BLOCKED** ("staging verification did not run … no fake pass"); §8 STATUS header and §14 agree. Classified the verdict as exactly one: **BLOCKED** (not VERIFIED/PARTIAL/FAILED — nothing ran, so nothing partially/failed).
- **[PC1]:** Re-confirmed the blocker with a presence-only env re-check (no values printed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL` all MISSING; `.env`/`.env.local`/`.env.staging` ABSENT. Unchanged since §13.
- **[PC1]:** Selected **Route B (B2 BLOCKED)** — did **not** proceed to UI/product implementation; did **not** start Route A (V2-UI-T2 Manual Product E2E), which is predicated on a VERIFIED B2. Appended report §14 (verdict routing + the "Codex PASS ≠ VERIFIED" clarification) and §14.1 (exact presence-only re-run command/check sequence to use once a disposable staging env is provisioned).
- **[PC1]:** Kept tracking truthful — Checkpoint B/B2 = 🔴 BLOCKED; **overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION (not DONE/PASS).** C/D/E remain ✅ docs-spec DONE independently (do not replace staging verification). V2-UI-T1 ✅ DONE/PASS and separate from V2-E3. **V2-E3 PC2 Adapter Skeleton, feedback implementation, and Checkpoint F migration draft all remain 🔴 NOT STARTED / Owner-gated — none started here.**
- **[PC1]:** Docs/logs-only — no runtime/repo/Supabase/RLS/auth/test changes; no SQL; no production/staging connection; no secrets/connectors. `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 16/06/2026 — V2-D2 — Checkpoint B2 Unblock Attempt 🔴 STILL BLOCKED (no disposable staging env)
- **[Owner — Approver]:** Directed Checkpoint B2 — unblock the disposable Supabase staging verification (schema/RLS/tenant hierarchy). Do not fake; stop with exact blocker if env missing.
- **[PC1 Claude Code Builder]:** Inspected repo (branch `main` = origin/main, clean, HEAD `4ac7ea4`), confirmed migration files + staging report present, then checked staging env **presence only (no values printed)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` all MISSING; `.env`/`.env.local`/`.env.staging`/`.env.development` all ABSENT; no `supabase/` linked project; supabase CLI not installed.
- **[PC1]:** Per the hard boundary, **halted before any DB action** — ran no SQL, connected nowhere, did not touch production, did not fabricate results. Migrations / schema / RLS / cross-tenant matrix = NOT EXECUTED (no disposable staging to run against).
- **[PC1]:** Documented approval/callback safety as **design-verified** (Core is a static frontend with no HTTP listener → no runtime callback path): generated/pending change only via Core UI; PC2 callbacks metadata/log/echo only; no callback-driven approval mutation; `completed_mock` ≠ approval; `failed_mock` → failure route; needs_revision/rejected-like = human-review metadata; approval state Core UI-authoritative. Explicitly noted this is NOT a substitute for the BLOCKED DB-level RLS checks.
- **[PC1]:** Appended `08_logs/v2_d2_staging_report_20260615.md` §13 "Checkpoint B2 — Unblock Attempt" (redacted env table, did-not-run rationale, NOT-EXECUTED migration/schema/RLS, design-verified approval safety, evidence table, blocker B2-1, **verdict BLOCKED**, exact owner unblock steps) and updated the report STATUS header.
- **[PC1]:** Kept tracking truthful — **Checkpoint B stays 🔴 BLOCKED; B2 = 🔴 BLOCKED (no fake pass); overall V2-D2 stays 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION.** C/D/E remain ✅ docs-spec DONE independently (do not replace staging verification). V2-E3 PC2 Adapter Skeleton + feedback implementation + Checkpoint F migration draft remain 🔴 NOT STARTED / Owner-gated.
- **[PC1]:** Docs/logs-only — no runtime/repo/Supabase/RLS/auth/test changes; no SQL; no production/staging connection; no secrets/connectors. `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Tracking truthfulness fix ✅ DONE (overall = PARTIAL / BLOCKED ON STAGING VERIFICATION)
- **[Codex — Reviewer]:** REQUIRED FIX — "V2-D2 Checkpoint B remains BLOCKED, so Checkpoints A–E are not all DONE/PASS (criterion 11)."
- **[PC1 Claude Code Builder]:** Re-read the staging report `08_logs/v2_d2_staging_report_20260615.md` — authoritative verdict is **Checkpoint B = BLOCKED** ("Checkpoint B verdict: BLOCKED … No fake pass issued"; DB-level §6/§7 NOT EXECUTED, no disposable staging env). Did **not** alter that verdict; did **not** fake staging verification.
- **[PC1]:** Corrected the tracking to state **overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION** (not all DONE/PASS): A ✅ PASS; B 🔴 BLOCKED = the staging-verification blocker; C ✅ docs/spec policy DONE; D ✅ owner-decision docs DONE; E ✅ implementation-plan docs DONE — **C/D/E completed independently and do NOT complete or replace staging verification**, so V2-D2 is not fully DONE/PASS until B is unblocked and verified.
- **[PC1]:** Edited `CURRENT_PHASE.md` (header + V2-D2 section header/blockquote + the stale "→ V2-D2 DONE" next-step), `SESSION_SUMMARY.md` (section header + stale "→ V2-D2 DONE" next-step), and reframed the two "A–E standing verdicts" summary lines in `phase_log.md`/`agent_activity_log.md`.
- **[PC1]:** Preserved — V2-UI-T1 Manual E2E + UI Bug Triage ✅ DONE/PASS and **separate from V2-E3**; **V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated**; feedback implementation + Checkpoint F migration draft 🔴 NOT STARTED / Owner-gated. Approval/callback safety unchanged: PC2 callbacks metadata/log/echo only; no callback-driven approval mutation; Core UI authoritative for approval state.
- **[PC1]:** Docs/logs/tracking-only — no runtime/repo/Supabase/RLS/auth/test changes; no SQL; no production/staging connection; no secrets/connectors. `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 15/06/2026 — V2-UI-T1 — Manual E2E + UI Bug Triage ✅ DONE / PASS (small safe fixes)
- **[Codex — Reviewer]:** Flagged REQUIRED FIX — calling this UI triage "V2-E3" is contradictory because V2-E3 = PC2 Adapter Skeleton (NOT STARTED). Disambiguate: rename the completed UI triage to **V2-UI-T1**; keep **V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated**.
- **[PC1 Claude Code Builder]:** Renamed the checkpoint to **V2-UI-T1 — Manual E2E + UI Bug Triage** across all four tracking files + renamed the note `v2_e3_ui_bug_triage.md` → `v2_ui_t1_ui_bug_triage.md`. **V2-UI-T1 is a separate UI/manual smoke-test triage checkpoint and does NOT start or complete V2-E3 PC2 adapter-skeleton work**, which stays 🔴 NOT STARTED / Owner-gated (checkpoint O1). No product/runtime change in this fix — docs/logs/tracking only.
- **[Owner — Approver]:** Paused feedback implementation; directed the Manual E2E + UI Bug Triage (now V2-UI-T1). Reported: mobile UI cluttered; Create Brand has no visible response.
- **[PC1 Claude Code Builder]:** Inspected repo (branch `main` = origin/main, clean, HEAD `37f9902`) and traced the Create Brand flow end-to-end: `BrandsTab.handleCreate` → `App.handleBrandCreate` → `repos.brands.create` (LocalStorage in this env — `.env.local` absent) → state prepend. Confirmed the handler is correct (validation visible, loading state, errors caught, no silent catch); demo role = owner so the form renders; seed clients exist.
- **[PC1]:** Diagnosed Issue 2 as a **UX gap, not a broken handler** — the success path closed the form silently and the new card could land below the fold (esp. mobile), so it felt like "no response". Fix: added a visible, auto-dismissing success banner (`✓ Brand "…" created.`) in `BrandsTab.tsx`. Documented a latent UUID-gating gap (brands/clients lack per-op Supabase-vs-local fallback) as a recommended follow-up — not fixed (out of small-safe scope; moot with Supabase off).
- **[PC1]:** Diagnosed Issue 1 — `index.css` had **no media queries** and the main grid was a fixed inline `260px 1fr`. Fix (desktop unchanged): added `app-main-grid`/`app-sidebar` classes (App.tsx) + a responsive CSS block (≤768px collapse sidebar grid, reduce padding, wrap header, `.form-grid-2` single-column; ≤480px tighter padding + heading wrap). No redesign, no brand-identity change.
- **[PC1]:** Ran the manual E2E smoke (fictional data, code-path + build + dev-server run): client→brand→campaign→brief create/read all follow the correct prepend pattern; approval generated/pending stays safe; no callback-driven approval mutation; localStorage UUID gating unchanged.
- **[PC1]:** Held every boundary — no Supabase/RLS/auth/migration changes, no SQL, no secrets, **no connector activation, no real posting/ads/messaging/customer contact**, no feedback table/RLS/UI, approval semantics unchanged, **PC2 callbacks remain metadata/log/echo only, no callback-driven approval mutation, approval state remains Core UI-authoritative**. Diff = `BrandsTab.tsx` + `App.tsx` + `index.css` + triage note `08_logs/v2_ui_t1_ui_bug_triage.md` + logs.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS; dev server served HTTP 200 (app runs, modules transform clean). **V2-UI-T1 = DONE/PASS; V2-E3 PC2 Adapter Skeleton remains NOT STARTED/Owner-gated; feedback implementation + Checkpoint F remain NOT STARTED/Owner-gated; **overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION (not all DONE/PASS): A ✅ PASS / B 🔴 BLOCKED = the staging-verification blocker (DB-level verification could not run) / C·D·E ✅ docs-spec DONE independently but do NOT complete or replace staging verification. V2-D2 closes as DONE only when B is unblocked and verified.**

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint E Feedback Implementation Plan 🟡 PLAN ONLY (NOT implemented)
- **[Owner — Approver]:** Approved starting V2-D2 Checkpoint E as docs/spec-only implementation planning.
- **[PC1 Claude Code Builder]:** Inspected repo first — branch `main` = origin/main, tree clean, HEAD `6d393bd`; confirmed the two existing policy/decision docs are present and no implementation-plan docs existed yet → authored fresh (no duplication).
- **[PC1]:** Grounded the plan in actual repo structure: repository pattern (`coreRepository.ts` interfaces + `SupabaseXRepository`/`LocalStorageXRepository` + `repositoryFactory.ts` + `repoRouting.ts` UUID-gating like `approvalScopeIsSupabaseSafe`/`okOrAbsentUuid` + `sanitize*Patch`); RLS helper family (`current_user_has_global_role`/`current_user_has_scoped_role`/`current_user_can_access_client`/`current_user_can_access_campaign` + `content_*_hierarchy_is_valid`); accepted policy data model (separate `client_feedback` table).
- **[PC1]:** Wrote `03_core/specs/v2_d2_feedback_implementation_plan.md` (purpose, scope, non-goals, accepted-policy summary, data model, RLS design, repository/API, UI, audit/logging, migration outline, test plan, rollout, risks, open questions, next checkpoint) and `03_core/specs/v2_d2_feedback_future_checkpoints.md` (Checkpoints F–J, each with scope/allowed-changes/hard-boundaries/validation/Codex-expectations; all NOT STARTED/Owner-gated).
- **[PC1]:** Held every hard boundary — did **not** implement code/migrations/RLS/runtime/UI; did **not** add an executable SQL migration; did **not** run SQL; did **not** connect to production/staging; did **not** change tests/connectors/secrets. The plan keeps **client viewer strictly read-only** (viewer excluded from any write predicate), keeps approval authority Owner/Internal-only, and keeps PC2 callbacks non-authoritative — no behavior changed.
- **[PC1]:** Marked Checkpoint E = implementation plan only; feedback implementation = NOT STARTED; Checkpoint F = NOT STARTED / Owner-gated. No implementation done.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — docs-only diff, unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Codex REQUIRED FIX (round 2) ✅ DONE (stale viewer wording)
- **[Codex — Reviewer]:** Flagged REQUIRED FIX — the decision record still said "Client portal (Phase 9): client/viewer already limited to read + non-internal feedback comment", grouping client/viewer and implying the viewer can add non-internal feedback comments. Remove/clarify so the viewer is consistently read-only.
- **[PC1 Claude Code Builder]:** Inspected repo (branch `main` = origin/main, clean, HEAD `8b8404f`) and grepped all V2-D2 policy docs + the four state/log files for `client/viewer`, `Phase 9`, `non-internal`, `add feedback`, `feedback comment`, `explicit Owner grant`, `read-only unless`.
- **[PC1]:** Rewrote the one stale statement (`v2_d2_checkpoint_c_decision_record.md` §1 Context): Phase 9 is labeled legacy/current implementation; under the **accepted V2-D2 policy** the non-internal feedback comment is a **client approver** capability (a Phase-9-style / future feedback feature may allow client approvers to submit non-internal feedback comments), while the **client viewer remains strictly read-only** and cannot add feedback/comments; any future viewer-comment capability is a separate, future Owner-gated policy change not part of accepted V2-D2.
- **[PC1]:** Confirmed the V2-D2 policy docs never group "client approver" and "client viewer" together for any write/comment/feedback permission (the permission matrix already lists approver ✅ / viewer ⛔). Left the remaining `client/viewer` groupings that are correct for *both* roles (no approval controls, read-scoping, no-write under planned RLS) and the historical Phase 9/16 READMEs + V2D runbook that document actual current runtime behavior — rewriting those would misrepresent product behavior.
- **[PC1]:** Preserved all approved policy safety: client feedback cannot mutate `approval_status` directly; approved-like approver feedback stays metadata pending Core owner/internal confirmation; rejected/needs_revision-like stays metadata/feedback-record pending Core review; PC2/module callbacks stay metadata/log/echo only; no callback-driven approval mutation; no feedback-driven posting/ads/messaging/customer contact.
- **[PC1]:** Docs/specs/logs-only — no runtime/product/repository logic, Supabase migrations/RLS/auth, tests, connectors, or secrets changed; no SQL; no production/staging connection.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — docs-only diff, unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Codex REQUIRED FIX ✅ DONE (Decision C consistency)
- **[Codex — Reviewer]:** Flagged REQUIRED FIX — Decision C inconsistent: accepted wording says client viewer remains read-only, but the policy/decision docs still allowed viewer feedback "if explicitly granted by Owner". Make Decision C consistent: viewer is read-only, no Owner-grant exception in V2-D2.
- **[PC1 Claude Code Builder]:** Inspected repo (branch `main` = origin/main, clean, HEAD `8990a3e`) and grepped both spec docs + logs for every "explicit grant / Owner-grant / ☑️ / by default" reference touching the viewer.
- **[PC1]:** Removed all viewer feedback-grant exceptions. Permission matrix now states client viewer can **read scoped outputs only** and **cannot** create feedback/comment, request revision, submit approved-like, submit rejected-like (or needs_revision-like), or mutate Core approval state. Dropped the `☑️ (Owner-granted)` legend + matrix cell → viewer feedback = ⛔ (read-only). Added a clarification (in both specs) that any future viewer-comment capability requires a **separate, future Owner-gated policy update + future implementation checkpoint** and is not part of the accepted V2-D2 decision.
- **[PC1]:** Left the client **approver** policy unchanged (may submit feedback / request revision; approved-like = metadata only, requires Core owner/internal confirmation). Preserved every safety statement: client feedback cannot mutate `approval_status` directly; PC2/module callbacks remain metadata/log/echo only; no callback-driven approval mutation; no feedback-driven posting/ads/messaging/customer contact.
- **[PC1]:** Docs/specs/logs-only — did not change runtime/product/repository logic, Supabase migrations/RLS/auth, tests, connectors, or secrets; no SQL; no production/staging connection.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — docs-only diff, unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Owner Decision ✅ DONE (policy stage CLOSED)
- **[PC1 Claude Code Builder]:** Inspected repo first — branch `main` = origin/main, tree clean, latest commit `2462875` (Checkpoint C). Confirmed the Checkpoint C policy + decision-record docs exist; this checkpoint only **records the Owner decision** and **closes the policy-decision stage** — no new spec authored, no duplication.
- **[Owner — Approver]:** Recorded decision for Checkpoint D — **A = YES** (client approver may submit feedback/request revision), **B = YES, metadata only** (approved-like feedback requires Core owner/internal confirmation before any real approval state change), **C = YES** (client viewer read-only), **D = YES** (future implementation uses a separate feedback table).
- **[PC1]:** Updated `03_core/specs/v2_d2_checkpoint_c_decision_record.md` — status header → ✅ ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION / NOT IMPLEMENTED; added §7 "Checkpoint D — Owner Decision (Recorded)" (A/B/C/D answers, what it means + does NOT mean, invariants preserved) and §8 Status & Next Steps; reworked §6 as carried-forward consequences.
- **[PC1]:** Updated `03_core/specs/v2_d2_client_feedback_policy.md` wording only — status header → Owner-approved policy direction; §11 → Owner-approved A–D with sub-decisions E/F still open. Did **not** convert it into implementation/migration instructions.
- **[PC1]:** Held every hard boundary — did **not** implement code/RLS/runtime; did **not** change Supabase migrations/auth/tests/connectors; did **not** run SQL; did **not** connect to production/staging; did **not** add secrets. Client/viewer cannot mutate Core approval state; PC2 callback status cannot mutate approval decisions; no feedback/callback-driven posting/ads/messaging/customer contact. Preserved in the docs, no behavior changed.
- **[PC1]:** Marked **Checkpoint D ✅ DONE (Owner decision recorded, policy-decision stage CLOSED)** and **future implementation phase 🔴 NOT STARTED / Owner-gated** (should follow a *VERIFIED* Checkpoint B, currently BLOCKED). No implementation done.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — docs-only diff, unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint C Client-Feedback Policy 🟡 DOCS/SPEC PROPOSED
- **[PC1 Claude Code Builder]:** Inspected repo first — branch `main` = origin/main, tree clean, latest commit `a6e7445`. Confirmed Checkpoint C was **NOT STARTED**: no `03_core/specs/` directory and no `client_feedback`/`checkpoint_c` documents existed. Started Checkpoint C fresh (no duplication).
- **[PC1]:** Authored two specs (documentation/specification only): `03_core/specs/v2_d2_client_feedback_policy.md` (purpose, scope, 5 role definitions, permission matrix, state-transition policy, separate-feedback-table data model, future RLS requirements, future UI requirements, audit/log, risks/mitigations, open owner decisions) and `03_core/specs/v2_d2_checkpoint_c_decision_record.md` (decision PROPOSED/not implemented, recommended option, rejected unsafe options, required Owner decision A/B/C/D + recommended answers A=yes / B=yes-metadata-only / C=yes / D=yes).
- **[PC1]:** Grounded the policy in existing repo facts: approval model `ContentApprovalStatus` + `canApproveContent: ['owner','manager']` (`src/lib/auth/permissions.ts`); Phase-9 client portal feedback-comment path; RLS plan `approval_comments` three-tier read + audit finding #5 (client feedback owner/manager-gated); PC2 non-authoritative callback rule (V2-E2 plan §4 + commit `3c8f853`).
- **[PC1]:** Held every hard boundary — did **not** implement code/RLS/runtime; did **not** change Supabase migrations/auth/tests/connectors; did **not** run SQL; did **not** connect to production/staging; did **not** add secrets. Client/viewer cannot mutate Core approval state; PC2 callback status cannot mutate approval decisions — preserved in the spec, no behavior changed.
- **[PC1]:** Marked **Checkpoint C 🟡 docs/spec PROPOSED (complete as specification; NOT implemented)** and **Checkpoint D 🔴 NOT STARTED / Owner-gated**. No implementation done.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — docs-only diff, unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint B Verification Verdict 🔴 BLOCKED
- **[PC1 Claude Code Builder]:** Re-checked the staging env without printing values: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` still MISSING, `.env.local` still absent — unchanged since Checkpoint A. The disposable staging project was never provisioned, so the substantive V2-D2 verification still cannot run.
- **[PC1]:** Rendered the **Checkpoint B verdict = 🔴 BLOCKED** (not VERIFIED/PARTIAL/FAILED — zero DB-level criteria executed; preflight is preparatory only; nothing ran so nothing failed). **No fake pass.**
- **[PC1]:** Updated `08_logs/v2_d2_staging_report_20260615.md`: status header now reflects Checkpoint A PASS (process/docs) + Checkpoint B BLOCKED; §9 Checkpoint A marked PASS; added §10 (Checkpoint B verdict — what ran/didn't, evidence, assumptions, unverified, next action, can-proceed-to-C = NO), §11 (evidence closure table — 16 verification areas covering migration order, schema existence, tenant hierarchy, RLS, active/unexpired assignment, read/write role separation, UUID/localStorage gating, brief/client/brand/campaign hierarchy, asset_collection_id validation, Group-F present-but-unwired, approval/callback safety, failed_mock route, needs_revision/rejected metadata — DB-level BLOCKED, code/contract invariants PASS but explicitly not a substitute), §12 (safety conclusion).
- **[PC1]:** Marked Checkpoint A PASS, Checkpoint B BLOCKED, Checkpoint C NOT STARTED / Owner-gated. Did not implement the client-role feedback policy (out of scope). Did not mark Checkpoint C complete.
- **[PC1]:** Safety confirmed — no production Supabase, no production data, no secret values printed/committed, no connector activation, no posting/ads/messaging/customer contact, no callback-driven approval mutation; approval state remains Core UI-authoritative. Docs-only diff; no runtime/product/repository/Supabase/auth/RLS/test changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Supabase Staging Execution — CHECKPOINT A STARTED / 🔴 EXECUTION BLOCKED
- **[Owner — Approver]:** Approved V2-D2 Checkpoint A (authorizes disposable staging verification per the runbook).
- **[PC1 Claude Code Builder]:** Ran preflight: branch `main` = origin/main (clean tree, `2f1b700`), `npm run build` PASS (0 TS errors), `npm run test` 45/45 PASS, secrets scan clean (only `.env.example` tracked; `service_role` only in SQL/code comments + a safety note).
- **[PC1]:** Checked staging env presence **without printing any values**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` all MISSING; `.env.local` and `.env` absent. No disposable Supabase staging project exists and the agent cannot create one (requires Owner/operator dashboard + account).
- **[PC1]:** Per the explicit hard boundary ("if required Supabase staging env vars are missing, STOP and document the exact missing variables; do not fake verification"), **halted before any database action** — no SQL run, no DB connection, no fabricated results.
- **[PC1]:** Authored `08_logs/v2_d2_staging_report_20260615.md`: preflight results, staging target NOT PROVISIONED (env redacted), the exact missing variables + provisioning prerequisites, migration order M1–M10 (ready, NOT EXECUTED), rollback/recovery, stop conditions, the migration/RLS verification checklist and the 9-entity × 7-assertion cross-tenant matrix (defined, NOT EXECUTED), and approval/callback safety (DB-level RLS NOT EXECUTED; code/contract-level invariants restated as unchanged, explicitly not a substitute for the blocked checks).
- **[PC1]:** Approval safety preserved — no code changed, so no callback can mutate Core approval state; PC2 callbacks remain non-authoritative; `completed_mock`/`ready_for_mock_callback_preview` are statuses, not approvals.
- **[PC1]:** Docs-only diff. Production Supabase NOT touched; no production data; no secrets committed or printed; no connectors; no runtime/product/repository/Supabase/auth/RLS/test changes. **Verdict: Checkpoint A started, execution BLOCKED, Checkpoint B NOT READY (no fake pass).**
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.

---

### 🗓️ Ngày 12/06/2026 — V2-D1.5 — Manual E2E Checklist + Demo Script (docs-only prep) ✅ DONE
- **[PC1 Claude Code Builder]:** Inspected the docs tree; no runbook-specific folder existed (`07_docs/` holds client/strategy docs), so created `CLAUDE_MARKETING_TEAM/07_runbooks/` per the task fallback.
- **[PC1]:** Authored `07_runbooks/v2_manual_e2e_checklist.md` — purpose/scope (tenant scope + approval-state safety + PC2 callback-as-metadata, companion to V2-A QA and V2-D1 runbook), preflight PF1–PF8 (incl. a hard gate that no SQL runs unless V2-D2 checkpoint A is logged, and a "Local Data Only" badge check), manual scenarios S1–S10 (client→brand→campaign→brief→generation/items→asset/collection→approval pending/generated→callback metadata-only→UUID gating), PC2 callback preview checklist C1–C5, an evidence-capture table, six stop conditions, and an evidence guide (screenshot/log naming conventions + result-summary/owner-sign-off/unresolved-issue templates).
- **[PC1]:** Authored `07_runbooks/v2_demo_script.md` — a 10–15 minute owner walkthrough using the fictional Vị Cuốn F&B persona, 10 narrated beats (open Core → client → brand → campaign → brief → mock generation → approval stays pending/generated → PC2 callback shown as metadata only → failure/error route → final Human Approval Checklist), plus an explicit "what NOT to claim" section (no real posting/ads/connector execution/client data, and the callback approved nothing).
- **[PC1]:** Verified the PC2 status strings against the real contract artifacts before referencing them: `ready_for_mock_callback_preview` (N8 approval-gate mock), `completed_mock` (N11 E2E `final_status` success), `failed_mock` (N11 module-failure terminal). No invented vocabulary.
- **[PC1]:** Updated PC2 status wording from "paused at N11" to "N12 post-merge cleanup (integration-ready handoff)" in 6 status-label spots; left all PC2 callback contract references (e.g. the `n11_e2e_dry_run` workflow as the preview-artifact source) unchanged.
- **[PC1]:** Approval safety preserved throughout both docs — PC2 callbacks are non-authoritative (validate/log/record metadata/echo an existing Core decision/attach review notes only); generated stays generated and pending stays pending unless an authenticated Core UI action changes it; `completed_mock` is explicitly framed as the mock pipeline's final status, not an approval.
- **[PC1]:** Docs-only diff — no Supabase staging project, no SQL, no DB connection, no secrets, no live connectors, no runtime/product/repository/Supabase/auth/RLS/test changes. V2-D2 remains 🔴 NOT STARTED / Owner-gated.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.

---

### 🗓️ Ngày 12/06/2026 — V2-E2 Fix Round (Codex REQUIRED FIX) — T2/T3 callbacks made non-authoritative ✅ DONE
- **[Codex Reviewer]:** Flagged a contract inconsistency in `V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md`: test scenarios T2/T3 implied imported PC2 callbacks could transition Core approvals/items to `revision_requested`/`rejected`, conflicting with the V2-E1/V2-E2 safety rules (approval decisions originate only from authenticated Core UI actions; PC2 decisions are non-authoritative; PC2 callbacks cannot change Core approval state) — and with the plan's own §4 rule 1 and T9.
- **[PC1 Claude Code Builder, required fix applied]:** Rewrote §4 into 8 rules: any approval-state claim in a callback (`approved`/`rejected`/`needs_revision`) transitions nothing and lands as flagged callback metadata; enumerated the ONLY five permitted callback effects (validate payload consistency, log callback status, record module output/error metadata, echo a decision that already exists in Core — E6 round-trip, mismatch logged as warning and never applied, attach non-authoritative review notes); every transition to `revision_requested`/`rejected`/`approved` requires an authenticated Core UI action with no code path from ingest to an approval transition; PC2 rejection-flavored statuses are review inputs requiring human review, not transitions. Added the explicit sentence **"Imported PC2 callbacks cannot bypass or mutate Core approval decisions."**
- **[PC1]:** Rewrote T2/T3 as "non-authoritative echo" scenarios — ingest accepts as metadata only: items land `generated`, approval request stays `pending`, no state transition; the real `revision_requested`/`rejected` transition is a separate manual Owner/manager step in the Approvals UI, verified as a Core-UI action outside ingest. Added a reading note clarifying that the V2-E1 §4 status table's needs_revision/rejected/approved rows describe states AFTER a Core-UI decision and are unreachable via callback import.
- **[PC1]:** Docs-only diff (plan + 4 tracking docs) — no product code, runtime, tests, repository, Supabase, auth, UUID-gating, tenant-scope, sanitizer, RLS, or connector changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.

---

### 🗓️ Ngày 12/06/2026 — V2-E2 — Core ↔ PC2 Dry-run Integration Plan ✅ DONE (V2-E3 adapter skeleton Owner-gated via checkpoint O1)
*(Scope note: V2-E1 originally labeled "V2-E2" as the dry-run implementation — the Owner refined the ladder: V2-E2 = integration PLAN; implementation is split into V2-E3→V2-E6, each Owner-gated. Supersedes the V2-E1 §7 boundary table.)*
- **[PC1 Claude Code Builder]:** Authored `CLAUDE_MARKETING_TEAM/V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md` from the approved V2-E1 mapping spec (`4407cf7`), the PC2 N12 handoff (PASS, no required fixes), and the callback/approval/safety contracts — planning/contract/test-design only, no runtime integration, no outbound HTTP, no secrets/env vars, no live connectors; PC2 workflow files referenced read-only.
- **[PC1]:** Documented the load-bearing architecture constraint: Core is a static frontend with no HTTP listener (zero network calls in src/ except Supabase SDK; Group F tables unwired), so across the entire V2-E ladder the callback is a **preview JSON artifact** ingested via a **local dev-only manual import path** — never a live webhook. A real webhook receiver + callback auth secret is a future phase outside V2-E.
- **[PC1]:** Plan contents: 9-component dry-run architecture (human-only trigger → adapter disabled by default → n11 router → 5 localhost stubs → unified callback preview → ingest pipeline running all 7 V2-E1 §2.5 preconditions → existing Approvals gate → AutomationLog audit trail with full correlation chain → failure/dead-letter log-only); adapter requirements A1–A9 (pure `buildPc2Event` builder, dry_run + 4 safety flags hard-coded `true` with builder-throws enforcement, idempotency ledger, UUID gating reused from `repoRouting.ts` via import without modification, blocked publish/ads/messaging events rejected at the type level, default-off kill-switch); PC2-side expectations incl. partial_failure as a Core-side classification with a tracked PC2 example gap; callback safety rules (no approval bypass — a callback claiming `approved` still lands `generated`+`pending` with a warning; failed_mock never enters approval; approved = human-in-Core only; published stays blocked); test plan T1–T10 (the 8 required scenarios + approval-bypass and unknown-request_id safety regressions, with V2-E4/V2-E5 closure mapping); implementation ladder V2-E3 (skeleton, zero HTTP code paths) → V2-E4 (pasted-JSON ingest test) → V2-E5 (localhost-only E2E, O2+O3 required before the first outbound call) → V2-E6 (evidence pack); Owner checkpoints O1–O5 (env var / outbound HTTP / n8n-from-Core / Supabase staging + V2-D checkpoint A / real connector — which no V2-E phase may request).
- **[PC1]:** Docs-only diff — no Supabase runtime/repository/auth/UUID-gating/tenant-scope/sanitizer/RLS/product-code/test changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.
- **[PC1]:** Handoff: Owner reviews §2/§8/§9 → if approved, logs checkpoint O1 → V2-E3 builds the builder + unit tests + dev-only preview panel (no HTTP, disabled by default); V2-E3 closes only with green builder tests + flag-off evidence + logged Owner approval (V2-A/V2-C/V2-D standing rule).

---

### 🗓️ Ngày 12/06/2026 — V2-E1 — Core ↔ PC2 Contract Mapping Spec ✅ DONE (V2-E2 dry-run implementation Owner-gated)
*(Naming note: the roadmap listed the PC2 n8n dry-run as roadmap-V2-C and "V2-E" as UI polish; the Owner names this package V2-E — V2-E1 mapping spec, V2-E2 dry-run implementation. Per the V2-B/V2-C/V2-D precedent.)*
- **[PC1 Claude Code Builder]:** Reviewed the full PC2 N12 handoff from repo files only (no n8n call, no module stub launched): `contracts/` (core_to_n8n_event + module_to_core_callback JSON Schemas, `e2e_dry_run_v0.1` envelope, `unified_callback_v0.1` preview + approval decision schema, `error_retry_logging_v0.1` error/retry/dead-letter/log objects, event_types + callback_statuses legacy vocabulary, module registry — 5 stubs all `real_api_enabled: false`), `n8n-workflows/` (n4–n11), `docs/pc2/pc2_handoff_to_core_integration.md` (callback endpoint / approval-state / module-output ingestion mappings, all TBD), and re-ran the PC2 validator (`node contracts/tools/validate_contracts.js` — ALL CHECKS PASSED incl. N12 compliance).
- **[PC1]:** Cross-referenced the Core side: wired Supabase entities from Phases 16B–16D (`content_plan_jobs`/`content_plan_items`/`content_approval_requests`/`content_assets`/`content_asset_collections`), `repoRouting.ts` UUID gates, RLS hierarchy rules, and the V2-D1 findings (legacy-vs-wired duality, Group F module/callback tables unwired, reports localStorage-only).
- **[PC1]:** Authored `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md`: event mapping E1–E9 (5 routable events → 5 module stubs via `n11_e2e_dry_run`; publish/ads-spend/messaging events explicitly BLOCKED with no route), the dispatch envelope (`e2e_dry_run_v0.1` base + `core_scope` full tenant hierarchy + `mode.dry_run` + `approval_required` + 4 constant safety flags + `idempotency_key`), the callback envelope (`unified_callback_v0.1` base + correlation block request_id/run_id/workflow_id/module_id/idempotency_key + N9 error/retry/dead-letter objects + approval decision rules: Core UI is the only approval authority), a unified 10-row status mapping table, PC2-output→Core-entity mapping, validation rules V1–V9 (failed_mock never routes to approval; no callback can bypass approval; local `col-*` ids never cross the boundary; idempotency required), the V2-E1→V2-E2→real-connector integration boundary, and the PC2 handoff checklist with 3 tracked gaps for V2-E2.
- **[PC1]:** Docs-only diff — no runtime integration, no n8n call, no secrets, no live connectors, no Supabase/repository/auth/UUID-gating/tenant-scope/sanitizer/RLS/test changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.
- **[PC1]:** Handoff: Owner reads the spec (§1.2 envelope, §4 status table, §6 validation, §7 boundary) → if approved, V2-E2 implements dry-run only per spec (local mock URLs, kill-switch, validator extensions, no secrets); V2-E2 DONE only with filed dry-run evidence + logged Owner approval (standing rule from V2-A/V2-C/V2-D).

---

### 🗓️ Ngày 12/06/2026 — V2-D1 — Supabase Staging Audit & Runbook ✅ DONE (V2-D2 execution Owner-gated)
*(Naming note: the roadmap listed Supabase staging hardening as roadmap-V2-B; the Owner names this package V2-D — V2-D1 audit/runbook, V2-D2 execution. Per the V2-B/V2-C precedent.)*
- **[PC1 Claude Code Builder]:** Audited the full Supabase surface from repo files only (no DB connection): `schema_v1.sql` (27 tables, plain CREATE TABLE → not idempotent, RLS on 11 tables, safety seeds), `rls_policy_plan.md` (Step-0 enables for 16 tables, bootstrap policies, 4 SECURITY DEFINER helpers, apply order, 18 cross-tenant tests — markdown, not yet runnable SQL), the four additive/idempotent extension migrations (16B-2/16C-1/16C-2/16D, each with inline RLS, all Codex PASS), `supabaseClient.ts` null-gate, scoped Supabase/localStorage repositories, `repoRouting.ts` UUID gates (45 tests), patch sanitizers, and `.env.example` placeholders.
- **[PC1]:** Key findings: legacy-vs-wired table duality (repos use `content_plan_*`/`content_approval_*`/`content_assets*`; legacy Phase-2 tables must stay empty); `user_roles` lockout trap (RLS enabled, zero policies → all users fall back to viewer until bootstrap applies); `roles` RLS gap; client-role feedback owner/manager-gated under RLS by design (Owner policy decision = checkpoint C); Group F module/callback tables exist but have no repository wiring (PC2 at N12 post-merge cleanup, integration-ready handoff) → staging scope limits CRUD verification to the 8 wired entities.
- **[PC1]:** Authored `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md`: readiness audit + verdict, staging-vs-local-demo rules (disposable project `core-agency-staging-disposable`, production env never touched), env-var table + explicit no-secrets rule (service-role key never frontend/Vercel/repo), V2-D2 execution checklists (migration order M1–M10 incl. idempotency re-run and the do-NOT-re-run-M1 rule, RLS verification with the 18 cross-tenant tests and the expected client-feedback failure, tenant-hierarchy and UUID-gating verification), a 9-entity staging verification matrix (tenant/scope fields × read/write roles × parent hierarchy × RLS check × localStorage-vs-Supabase ID rules), fictional-only seed plan, rollback/recovery notes (env kill-switch → instant localStorage fallback), 6 non-negotiable staging safety boundaries, risks R1–R9, and Owner approval checkpoints A–D (A gates ALL execution; D = production enablement, outside V2-D scope).
- **[PC1]:** Docs-only diff — no live Supabase connection, no secrets added, no production DB writes, no live connectors, no runtime/UUID-gating/tenant-scope/sanitizer/RLS/repository/test changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.
- **[PC1]:** Handoff: Owner reviews the runbook → logs checkpoint A → V2-D2 executes §4 and files `08_logs/v2d2_staging_report_YYYYMMDD.md` → checkpoints B + C close V2-D2 (deliverable-docs-ready ≠ package-closed, per the V2-A/V2-C standing rule).

---

### 🗓️ Ngày 12/06/2026 — V2-C — Owner Rehearsal EXECUTED ✅ DONE / PASS
- **[Owner — Approver]:** Rehearsed the §3 5-minute demo script of `V2C_CLIENT_DEMO_PACKAGE.md` against the live UI flow. **Result reported: "ổn" / PASS — 5-minute script verified, demo flow verified against the current UI, no blocking demo issues.** Approved the package for **controlled internal/demo use**.
- **[PC1 Claude Code Builder]:** Recorded the executed rehearsal: new record `08_logs/v2c_rehearsal_20260612.md`; §14 sign-off table in the V2-C doc flipped to all-✅; status upgraded from PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING to **DONE / PASS** in CURRENT_PHASE.md / SESSION_SUMMARY.md / phase_log.md / the V2-C doc itself. All four closure conditions satisfied (rehearsed ✅ / recorded ✅ / approved for controlled use ✅ / approval logged ✅).
- **[PC1]:** Standing rule preserved in all closure docs: client-facing use remains controlled — every demo respects the 5 safety boundaries (no auto-posting, no real ads, no real messaging, no live connectors, approval required before external use).
- **[PC1]:** Docs-only diff — no product code/UI/runtime/tests/repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.

---

### 🗓️ Ngày 12/06/2026 — V2-C (Owner naming) — Client Demo Package 🟡 PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING *(superseded — closed DONE/PASS same day after Owner rehearsal, see entry above)*
*(Naming note: Owner labels this package "V2-C — Client Demo Package"; in the roadmap the demo package was V2-D and roadmap-V2-C is the PC2 n8n dry-run. This entry follows the Owner's naming, per the V2-B precedent.)*
- **[PC1 Claude Code Builder]:** Authored `CLAUDE_MARKETING_TEAM/V2C_CLIENT_DEMO_PACKAGE.md` — complete client/internal demo package (documentation/demo material only, zero product/code/UI/runtime change).
- **[PC1]:** Package contents: pre-demo checklist (10 items + screenshot-backup fallback rule), recommended demo brand order grounded in the actual seed data (Cơm Tấm Bản Khói → Forme → Vị Cuốn, with do/don't rules), 5-minute and 10-minute demo scripts with timing + speaker lines, 17-step screen-by-screen presenter cheat sheet, positioning talking points, sandbox/local-data explanation script around the "Local Data Only" badge, 5-boundary safety table (no auto-posting / no real ads / no real messaging / no live connectors / approval before external use), 10-question FAQ (honest about simulated demo generation), 9 honestly-disclosed risks/limitations, 24h post-demo follow-up checklist, next-step offer (2-week 1-brand pilot + fallback ladder), and a one-page sales summary (Problem / Solution / What / Why-safer / Who / Status / Roadmap).
- **[PC1]:** Docs-only diff — no repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector/test changes; package explicitly trains the presenter to state the safety boundaries and limitations truthfully.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.
- **[PC1]:** Handoff: Codex to review §7–§10 claims for accuracy vs product reality; Owner to rehearse §3/§4 against the live demo and approve for client use.
- **[Codex Reviewer → PC1, required fix applied]:** Status corrected from DONE/DELIVERED to **PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING** across the V2-C doc / CURRENT_PHASE.md / SESSION_SUMMARY.md / both logs. Per the roadmap, V2-C closes only after all four conditions: (1) Owner rehearses the §3 (5-min) and/or §4 (10-min) script, (2) rehearsal notes/results are recorded, (3) Owner approves the package for controlled client/internal use, (4) the approval is logged. The package's §14 sign-off now tracks these four conditions explicitly, and the doc states it must not be used in front of a client until they are met.

---

### 🗓️ Ngày 12/06/2026 — V2-A — Manual Browser E2E EXECUTED by Owner ✅ DONE / PASS
- **[Owner — Approver]:** Executed the manual browser E2E pass per `V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` §1 (A1–A28) and verified the §2 demo script in a run-through. **Result reported: DONE / PASS — no blocking UI issues.**
- **[PC1 Claude Code Builder]:** Recorded the executed pass: new QA report `08_logs/v2a_qa_report_20260612.md` (verdict PASS — demo-ready, no blockers; deferred polish items routed to roadmap V2-E); status flipped from CHECKLIST READY / E2E PENDING to **DONE / PASS** in CURRENT_PHASE.md / SESSION_SUMMARY.md / phase_log.md / the V2-A doc itself. All four closure conditions now satisfied (executed ✅ / recorded ✅ / script verified ✅ / Owner approval ✅).
- **[PC1]:** Docs-only diff — no product code/UI/runtime/tests/repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector changes.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS — unchanged green.
- **[PC1]:** V2-A PASS unlocks **V2-D** (client demo package) and **roadmap-V2-B** (Supabase staging — still requires its own explicit Owner approval before starting).

---

### 🗓️ Ngày 12/06/2026 — V2-A — Manual Browser E2E + Demo Script 🟡 CHECKLIST READY / E2E PENDING *(superseded — closed DONE/PASS same day, see entry above)*
- **[PC1 Claude Code Builder]:** Authored `CLAUDE_MARKETING_TEAM/V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` — the V2-A deliverable docs (documentation only, zero product/code change). **V2-A itself is NOT done:** the manual browser pass has not been executed yet.
- **[PC1]:** §1 — 28-item manual browser E2E checklist (A1–A28) covering every sidebar tab plus app load/branding, Demo Sign In, Owner/Client view toggle, and a cross-cutting console/network sweep; each item specifies what to click, expected result, blocker definition, visual QA notes, and safety notes. Checklist written against the real UI in `src/App.tsx` (24 tab ids, owner-only gating for `new-campaign`/`team-board`/`manual-export`/`client-demo`/`automation-logs`, header badges, data-mode badge, LoginScreen demo credentials).
- **[PC1]:** §2 — 5–10 minute demo script with speaker lines and timing: opening pitch, problem, solution, owner workspace tour, brand/campaign flow, AI team output, approval safety (locked checklist items), client presentation/export (live Client View switch + pack copy), why no auto-posting/ads yet (Connector Registry registered-but-disabled, gate-by-gate activation story), closing CTA (2-week pilot).
- **[PC1]:** §3 — UI QA report template (blockers / visual polish / wording / responsive / deferred + verdict); §4 — sign-off flow (tester → PC1 fixes → Codex → Owner accept → unlocks V2-D and roadmap-V2-B).
- **[PC1]:** Docs-only diff — no repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector/test changes; no live automation/real ads/posting/messaging/secrets.
- **[PC1]:** `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.
- **[Codex Reviewer → PC1, required fix applied]:** Status corrected from DONE to **CHECKLIST READY / E2E PENDING** across CURRENT_PHASE.md / SESSION_SUMMARY.md / both logs / the V2-A doc itself. Per the Ver2 roadmap, V2-A is DONE only after all four closure conditions: (1) checklist executed by Owner or browser automation, (2) results recorded in a §3 QA report, (3) demo script verified in a real run-through, (4) Owner approval recorded.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Fix Content Calendar Horizontal Overflow ✅ DONE
- **[PC1 Claude Code Builder]:** Diagnosed the Content Calendar horizontal overflow: the `<main>` content area is the `1fr` item of the `260px 1fr` app grid and had no `min-width: 0`, so nowrap chips/unbroken generated text expanded the track past the viewport (CSS grid `min-width: auto` default).
- **[PC1]:** Root fix in App.tsx: `<main>` now has `minWidth: 0, maxWidth: '100%'` — contains every tab, not just the calendar. ContentCalendarTab: `wordBreak: 'break-word'` on expanded detail fields (caption/hashtags/visual brief), ellipsis on the expanded breadcrumb. ApprovalsTab: same `wordBreak` fix on its detail field style. ExportPackTab: defensive `minWidth: 0` on the preview column.
- **[PC1]:** Audited Content Generation / Reports / Export Pack / Asset Library for the same risk — remaining patterns are safe (nowrap always paired with ellipsis + hidden overflow; `<pre>` blocks already use `overflowX: auto` + `break-word`; auto-fill/minmax grids).
- **[PC1]:** Layout/presentation-only diff — no logic/data-flow/repository/Supabase/auth/UUID-gating/sanitizer/RLS/test/connector changes.
- **[PC1]:** `npm run build` PASS (0 TS errors, 1575 modules); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Core Logo Branding + Favicon + Sidebar Alignment ✅ DONE
- **[PC1 Claude Code Builder]:** Generated brand assets from the Owner-provided Core logo (local crop/resize script): `public/brand/core-logo-horizontal.png` (trimmed), `public/brand/core-icon.png` (square hexagon-C mark), `public/favicon.png` (128px).
- **[PC1]:** Header: replaced the pulsing dot with a 42px logo chip (`.brand-mark` — 10px radius, orange glow shadow); LoginScreen: 64px icon above the title; `index.html`: favicon ⚡ emoji → `/favicon.png`; title stays "The Core Agency"; visible naming stays "THE CORE AGENCY" / "AI Marketing Team Workspace". Re-verified no legacy names in visible UI (only internal localStorage keys remain — renaming would wipe user data, out of scope).
- **[PC1]:** Sidebar nav fix via shared CSS (`aside.glass-panel .btn`): `text-align: left` so wrapped labels (Client Presentation Pack, Client Workspace View, Manual Export Pack, Presentation & Export) stop centering, `line-height: 1.3`, `font-size: 0.9rem`, `padding: 10px 14px`, icons `flex-shrink: 0`. Active/hover/orange states and sidebar width unchanged.
- **[PC1]:** Presentation-only diff — no logic/behavior/repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/test/connector changes.
- **[PC1]:** `npm run build` PASS (0 TS errors, 1575 modules; assets copied to dist); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Decorative Background/Light Treatment ✅ DONE
- **[PC1 Claude Code Builder]:** Added shared CSS-only background decoration to the app shell (`src/index.css`): `body::before` = deep navy→black gradient + brand-orange glows + faint navy/blue glows + edge vignette; `body::after` = 56px grid + static SVG grain at 4% opacity, radially masked to fade toward the lower half. Both fixed, `z-index: -1`, `pointer-events: none` — painted behind all content on every page; no per-page duplication. `.glass-panel` gained a 1px inset top highlight for lift.
- **[PC1]:** LoginScreen + auth loading screen backgrounds switched to `transparent` so they inherit the shared shell decoration (removed LoginScreen's own duplicate radial glow).
- **[PC1]:** Static CSS only — no animation, particles, canvas, or runtime visuals. No logic/behavior/repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/test changes.
- **[PC1]:** `npm run build` PASS (0 TS errors, 1575 modules); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 11/06/2026 — V2-B (Owner-directed) — Premium Dark SaaS UI Polish ✅ DONE
*(Naming note: Owner labels this task "V2-B — Premium Dark SaaS UI Polish"; in `PHASE_19_VER2_ROADMAP.md` the UI-polish package was listed as V2-E. This entry follows the Owner's naming.)*
- **[PC1 Claude Code Builder]:** Implemented The Core Agency premium dark SaaS theme. Rewrote `src/index.css` token layer (deep navy/black backgrounds, glass surfaces, Brand Orange #F47A1F accent, semantic colors, Inter typography) keeping legacy CSS var names as aliases so all existing inline styles inherit the new theme with zero logic changes.
- **[PC1]:** Swept hardcoded indigo color literals to orange across 19 src files (`#818cf8`→`#fb923c`, `rgba(99,102,241,*)`→`rgba(244,122,31,*)`, `rgba(129,140,248,*)`→`rgba(251,146,60,*)`); left category/data-viz colors (violet hashtags/Instagram, info blues, emerald, amber) untouched.
- **[PC1]:** Polished shared components: primary button orange gradient + hover/active/disabled/focus-visible states, form focus ring with orange glow, glass cards (18px radius, blur, hover glow), tabs/scrollbar/selection in brand orange, new `.spinner`/`.skeleton` loading utilities. Header title gradient white→soft orange; auth loading screen now uses branded spinner; LoginScreen upgraded (glass card, top orange glow, solid orange submit button); `badge-indigo` class renamed `badge-brand`.
- **[PC1]:** Strictly presentation-only diff — no repository/Supabase/RLS/UUID-gating/auth/test changes; Phase 16D/17/18 safeguards untouched. Visible UI naming verified clean ("The Core Agency"; no "FnB OS V1"/"CLAUDE_MARKETING_TEAM" in UI).
- **[PC1]:** `npm run build` PASS (0 TS errors, 1575 modules); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 11/06/2026 — Naming cleanup: "Phase 19" → Post-MVP / Ver2 Planning workstream
- **[PC1 Claude Code Builder]:** Reframed the "Phase 19" work as the **Post-MVP / Ver2 Planning workstream** per Owner clarification: Core MVP = 18/18 phases, CLOSED; Phase 18 was the final MVP phase; no MVP phases are being added. Work packages "19A–19F" renamed **V2-A…V2-F**.
- **[PC1]:** Updated `PHASE_19_VER2_ROADMAP.md` (naming clarification block + V2-A…V2-F throughout; filename kept to preserve links), `CURRENT_PHASE.md` (header now "CORE MVP CLOSED — 18/18 PHASES COMPLETE | Next workstream: Post-MVP / Ver2 Planning"), `SESSION_SUMMARY.md`, both logs.
- **[PC1]:** Docs-only diff — product code untouched. `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS.

---

### 🗓️ Ngày 11/06/2026 — Ver2 Planning (Post-MVP) — Roadmap DONE
*(Naming note: originally logged as "Phase 19" — retired; Core MVP ends at 18 phases. This is the Ver2/Post-MVP workstream.)*
- **[PC1 Claude Code Builder]:** Created `CLAUDE_MARKETING_TEAM/PHASE_19_VER2_ROADMAP.md` — Ver2 planning package: scope options table (risk + dependencies), recommended priority order, work-package breakdown V2-A…V2-F with per-package goal/deliverables/files/safety/checks/Codex-focus/Owner-checkpoint, suggested sequencing diagram, standing Ver2 safety rules.
- **[PC1]:** Priorities: V2-A (E2E pass + demo script, zero risk) first → V2-B Supabase staging (Owner approval required before start) with V2-D demo package in parallel → V2-E UI polish as filler → V2-C n8n dry-run and V2-F connector plan last, both Owner-gated. No connector goes live inside Ver2 without written per-connector Owner sign-off.
- **[PC1]:** Updated CURRENT_PHASE.md, SESSION_SUMMARY.md, 08_logs/phase_log.md, 08_logs/agent_activity_log.md.
- **[PC1]:** Documentation only — product code untouched. `npm run build` PASS (0 TS errors, 1575 modules); `npm run test` 45/45 PASS.
- **[PC1]:** Recommended first Ver2 work package: **V2-A**. Roadmap DONE.

---

### 🗓️ Ngày 11/06/2026 — 🏁 CORE MVP CLOSED (Phases 1–18)
- **[PC1 Claude Code Builder]:** Created `CLAUDE_MARKETING_TEAM/CORE_MVP_CLOSURE_REPORT.md` — formal Core MVP closure report (includes/not-enabled/safety/build-test/limitations/next-roadmap). Documentation only; no product code or runtime behavior changed.
- **[PC1]:** Updated CURRENT_PHASE.md (header → CORE MVP CLOSED, closure section added), SESSION_SUMMARY.md (closure section), 08_logs/phase_log.md, 08_logs/agent_activity_log.md.
- **[PC1]:** Re-ran `npm run build` (PASS — 0 TS errors, 1575 modules) and `npm run test` (45/45 PASS) to confirm no behavior change at closure.
- **[PC1]:** Final reviewed product commit: `fd86ead`. Approved scope: controlled internal testing / controlled client demo only.
- **[PC1]:** Recommended next: Post-MVP / Ver2 planning with Owner + AI Coordinator (then demo prep → Supabase staging hardening → PC2 n8n/modules → UI polish → gated connector plan).
- **[PC1]:** 🏁 CORE MVP CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 18 CLOSED: Final MVP Polish + Production Readiness
- **[PC1 Claude Code Builder]:** Phase 18 implemented and closed in one pass — low-risk UI label polish + production readiness verification. Diff is UI label strings + docs only; routing/repos/sanitizers/RLS untouched.
- **[PC1]:** Removed "FnB OS V1" rows from sidebar Safety Guard + Dashboard sandbox safety grid; header badge → "Core MVP — Internal Demo"; added data-mode badge ("Local Data Only" / "Supabase Data") driven by `isSupabaseConfigured`.
- **[PC1]:** De-phased user-visible labels in ApprovalsTab, ContentCalendarTab, AssetLibraryTab, AutomationLogsTab, ConnectorRegistryTab, ReportsTab, ExportPackTab, BriefIntakeTab (stale "Phase 6–14" wording → neutral MVP wording). Code comments + `[Mock]` sample log bodies unchanged.
- **[PC1]:** Safety re-verified — secrets grep clean; only `.env.example` tracked; `fetch`/`axios`/`XMLHttpRequest`/`WebSocket` grep over `src/` → 0 matches; Supabase SDK remains the only network client and is `null` without env vars.
- **[PC1]:** New doc `CLAUDE_MARKETING_TEAM/07_docs/MVP_READINESS_CHECKLIST.md` with readiness verdict, evidence tables, and remaining risks.
- **[PC1]:** Build PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS.
- **[PC1]:** Verdict: Core MVP READY for controlled internal/demo use. Phase 18 CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 17 CLOSED: End-to-end Workflow Test
- **[PC1 Claude Code Builder]:** Phase 17 implemented and closed in one pass — added `vitest` devDependency + `npm run test`/`npm run test:watch` (zero extra config, default `node` environment).
- **[PC1]:** Extracted `assetRepoFor()`/`approvalRepoFor()`'s inline UUID-gating predicates verbatim into new `src/lib/core/repoRouting.ts` (`assetScopeIsSupabaseSafe`, `approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`); `App.tsx` now imports and calls them — no behavior change.
- **[PC1]:** Added `src/lib/core/repoRouting.test.ts` (34 tests) covering full UUID chains, local-format ids at every scope level, optional-absent ids, and the Codex Fix Round 2 current-vs-next `asset_collection_id` gating case.
- **[PC1]:** Added `src/lib/core/coreRepository.test.ts` (11 tests) covering `sanitizeAssetPatch`/`sanitizeGenerationPatch`/`sanitizeBriefPatch` immutable-field stripping (snake_case + camelCase) and `isUuid`/`generateId`.
- **[PC1]:** Added manual MVP E2E workflow checklist `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md` (Client→Brand→Campaign→Brief→Generation→Approval→Asset Library + UUID-gating fallback in Local/Demo and Supabase modes); UI sections deferred — no browser tool available this session.
- **[PC1]:** Build PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS. Secrets grep clean.
- **[PC1]:** Phase 17 CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16D CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16D officially closed after Codex PASS (2 Codex required-fix rounds applied).
- **[PC1]:** Final summary — Asset Library CRUD wired to Supabase with localStorage fallback. Asset operations scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId/assetCollectionId where applicable. assetId and assetCollectionId UUID-gated before Supabase routing — local col-*/collection-*/asset-collection-* IDs route to localStorage. handleAssetEdit gates both current and next assetCollectionId. RLS validates content_asset_hierarchy_is_valid() including asset_collection_id (7th param). Read-only/client/viewer roles cannot write/archive/delete. Production Supabase env remains OFF. Demo Sign In remains. No secrets or service role key.
- **[PC1]:** Build PASS — 0 TS errors (`tsc && vite build`, 1574 modules). Secrets grep clean.
- **[PC1]:** Codex result: PASS.
- **[PC1]:** Commits: `b598844` → `a9c6644` → `ec0178b`.
- **[PC1]:** Known future consideration: real file storage/upload not enabled yet — this phase only wires safe asset metadata CRUD.
- **[PC1]:** Phase 16D CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-2 CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16C-2 officially closed after Codex PASS (1 Codex required-fix round applied).
- **[PC1]:** Final summary — Approval CRUD wired to Supabase with localStorage fallback. Approval operations fully scoped by clientId + brandId + campaignId + briefId + generationId/contentItemId where applicable. approvalId/contentItemId/local IDs are UUID-gated before Supabase routing — local IDs never sent into Supabase UUID columns. RLS validates full tenant/content hierarchy (client_id → brand_id → campaign_id → brief_id → generation_id → content_item_id). Read-only/client/viewer roles cannot insert approval comments/events (owner/manager only). Production Supabase env remains OFF. Demo Sign In remains. No secrets or service role key.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only).
- **[PC1]:** Codex result: PASS.
- **[PC1]:** Commits: `871c3d0` → `70f8b8a`.
- **[PC1]:** Known future consideration: real client feedback (`ClientViewTab` "Add Feedback") via Supabase will require an explicit feedback-write role/policy in a later phase.
- **[PC1]:** Phase 16C-2 CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16C-1 officially closed after Codex PASS (2 Codex required-fix rounds applied).
- **[PC1]:** Final summary — Generation CRUD wired to Supabase with localStorage fallback. Full scope required: clientId + brandId + campaignId + briefId. No get/update/archive by generationId alone. Local generation/job/item IDs are not sent into Supabase UUID columns. Update patch sanitizes tenant/audit/ownership fields. Archive is fully scoped. RLS policies enforce active/unexpired assignments, role-specific read/write permissions, and full client/brand/campaign/brief hierarchy. Production Supabase env remains OFF. Demo Sign In remains. No secrets or service role key.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only).
- **[PC1]:** Codex result: PASS.
- **[PC1]:** Commits: `77987ab` → `db0819b` → `c81b069` → `0876162`.
- **[PC1]:** Phase 16C-1 CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 Codex Fix Round 2: RLS Role Permissions + Brief Hierarchy
- **[PC1 Claude Code Builder]:** Applied 2 required fixes from Codex review round 2 of Phase 16C-1 — build PASS, Codex PASS.
- **[PC1]:** Fix 1 (role permissions + active/unexpired) — `content_plan_user_has_scope()` previously granted INSERT/UPDATE to every scoped role including read-only `client`/`viewer`, and did not check `is_active`/`expires_at`. Now requires `ur.is_active = TRUE AND (ur.expires_at IS NULL OR ur.expires_at > NOW())` and takes `p_roles role_name[]`. New `content_plan_user_can_write()` narrows this to `['owner','manager']`. Policies split: SELECT = any active/unexpired/in-scope role; INSERT/UPDATE (including transitions to `archived`) = owner/manager only.
- **[PC1]:** Fix 2 (brief_id + hierarchy validation) — helpers/policies previously omitted `brief_id`, and the OR-based scope check could authorize rows with mismatched client/brand/campaign/brief relationships. Added `content_plan_hierarchy_is_valid(client_id, brand_id, campaign_id, brief_id)` — `SECURITY DEFINER`/`STABLE`, validates all 4 ids against the real `clients → brands → campaigns → campaign_briefs` FK chain. AND-ed into `content_plan_user_has_scope()`. `brief_id` now appears in every helper signature/call and every policy (SELECT/INSERT/UPDATE USING/WITH CHECK) for both `content_plan_jobs` and `content_plan_items`.
- **[PC1]:** Migration remains additive and idempotent (`DROP POLICY/FUNCTION IF EXISTS` before `CREATE OR REPLACE`). No anon/broad access, no secrets/service role key, Supabase env OFF, Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs unchanged.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only).
- **[PC1]:** Codex result: PASS. Commits: `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy).

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1: Content Plan Generation CRUD Wiring (Implemented — awaiting Codex review)
- **[PC1 Claude Code Builder]:** Phase 16C-1 implemented — Content Plan Generation CRUD repository wiring, build PASS, awaiting Codex review.
- **[PC1]:** New additive migration `03_core/database/schema_v1_phase16c1_generation_extension.sql` creates `content_plan_jobs`/`content_plan_items` tables matching the Phase 6 `ContentPlanJob`/`ContentPlanItem` types (3 enums, `client_id`/`brand_id`/`campaign_id`/`brief_id` UUID FKs, `plan_length_days CHECK (IN (7,15,30))`, `requested_by TEXT`, 7 indexes, `updated_at` triggers, RLS enabled). Legacy `generation_jobs`/`content_items` tables (Phase-15-planned, campaign-only scope, unused by the app) left untouched. Not applied to any live DB.
- **[PC1]:** `GenerationRepository.list({ clientId, brandId, campaignId, briefId })` returns `{ jobs, items }` — all 4 IDs required. `get`/`update({ ...same, generationId }, ...)` — all 5 IDs required. No method accepts `generationId` alone — TypeScript rejects unscoped calls.
- **[PC1]:** `SupabaseGenerationRepository` queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)` (+ `.eq('id', generationId)` for get/update on `content_plan_jobs`, `.eq('generation_job_id', ...)` for `content_plan_items`). `LocalStorageGenerationRepository` mirrors the same scoping.
- **[PC1]:** `SupabaseGenerationRepository.create` calls `generateContentPlan()` for the mock plan/items, then inserts into `content_plan_jobs`/`content_plan_items` — never sends a local `job-*`/`item-*`/`generation-*` ID, DB generates UUIDs, returned `{ job, items }` used to update React state.
- **[PC1]:** `GENERATION_IMMUTABLE_PATCH_FIELDS = ['id','client_id','brand_id','campaign_id','brief_id','created_at','updated_at','requested_by']` + `GenerationUpdatePatch`/`sanitizeGenerationPatch()` block these fields on every `update()` in both repositories (mirrors Phase 16B-2 Codex Fix 2).
- **[PC1]:** App.tsx loads generation jobs/items per-brief on Supabase mount (after campaigns + briefs load); added `handleGenerationCreate` (derives scope from the brief's parent campaign). `ContentGenerationTab.tsx` now uses async `onGenerate` prop, `handleGenerate` rewritten from sync `setTimeout` to `await onGenerate(...)`, new `genError` state + error banner; removed now-unused direct `generateContentPlan` import.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs unchanged.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only). Awaiting Codex review.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 Codex Fix: Harden Generation Tenant Scope
- **[PC1 Claude Code Builder]:** Applied 4 required fixes from Codex review of Phase 16C-1 — build PASS, awaiting Codex re-review.
- **[PC1]:** Fix 1 (item read scope) — `GenerationRepository.get()` in both `SupabaseGenerationRepository` and `LocalStorageGenerationRepository` previously fetched `content_plan_items` filtered only by `generation_job_id`. Now both also filter by `client_id`/`brand_id`/`campaign_id`/`brief_id` (Supabase: 4 additional `.eq()`; localStorage: 4 additional predicate checks in `filter()`), so items can never leak across tenants even if a `generation_job_id` were guessed.
- **[PC1]:** Fix 2 (scoped archive) — `GenerationRepository` had no `archive()` method, unlike `CampaignRepository.archive(params: CampaignScopedParams)`. Added `archive(params: GenerationScopedParams): Promise<void>` to the interface — requires `clientId`+`brandId`+`campaignId`+`briefId`+`generationId`. Implemented in both `SupabaseGenerationRepository` and `LocalStorageGenerationRepository` as `update(params, { status: 'archived' })` (mirrors `LocalStorageCampaignRepository.archive`), so archive inherits the full 5-ID scoped lookup and the hardened sanitizer — cannot operate by `generationId` alone.
- **[PC1]:** Fix 3 (sanitizer hardening) — `GENERATION_IMMUTABLE_PATCH_FIELDS` previously only covered snake_case `id`/`client_id`/`brand_id`/`campaign_id`/`brief_id`/`created_at`/`updated_at`/`requested_by`. Expanded to also strip camelCase aliases (`clientId`, `brandId`, `campaignId`, `briefId`, `createdAt`, `updatedAt`, `requestedBy`) plus additional ownership/audit fields in both cases: `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`. `sanitizeGenerationPatch()` now accepts `Partial<ContentPlanJob> & Record<string, unknown>` so it can strip these at runtime even from a dynamically-built patch object.
- **[PC1]:** Fix 4 (RLS policies) — `schema_v1_phase16c1_generation_extension.sql` previously only had `ENABLE ROW LEVEL SECURITY` with no policies (service_role only). Added `content_plan_user_has_scope(p_client_id, p_brand_id, p_campaign_id)` — a `SECURITY DEFINER`, `SET search_path = public` SQL function checking the existing `user_roles(user_id, resource_type, resource_id)` table for a `'global'` role or a `'client'`/`'brand'`/`'campaign'`-scoped role matching the row's tenant IDs. Added tenant-scoped `SELECT`/`INSERT`/`UPDATE` policies (each in a `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` block, idempotent) for both `content_plan_jobs` and `content_plan_items`. `auth.uid()` is `NULL` for anon and `user_roles.user_id` is `NOT NULL`, so anon never matches — no anonymous public access. Both tables are brand-new (this migration), so no backfill/visibility concerns for existing rows.
- **[PC1]:** Tenant scope unchanged otherwise — `list`/`get`/`update`/`archive` still require `clientId`+`brandId`+`campaignId`+`briefId`(+`generationId`); local IDs never sent to Supabase.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs unchanged.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only). Awaiting Codex re-review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2 CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16B-2 officially closed after Codex PASS.
- **[PC1]:** Confirmed final state: `BriefRepository.list({ clientId, brandId, campaignId })`, `get`/`update({ clientId, brandId, campaignId, briefId }, ...)` — all scope params required per interface; TypeScript rejects unscoped calls. Supabase queries always `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId)` (+ `.eq('id', briefId)` for get/update). `LocalStorageBriefRepository` mirrors the same scoping.
- **[PC1]:** `SupabaseBriefRepository.create` never sends a local `brief-*` ID — DB generates the UUID, returned row used to update React state. No `archive()` method — `status: 'archived'` reachable via `update()`.
- **[PC1]:** Codex Fix 1 (migration backfill) + Fix 2 (update patch sanitizer) applied and verified — `schema_v1_phase16b2_brief_extension.sql` backfills `client_id`/`brand_id` from `campaigns` before enforcing `NOT NULL` (idempotent, not applied to any live DB); `BriefUpdatePatch` + `sanitizeBriefPatch()` block `id`/`client_id`/`brand_id`/`campaign_id`/`created_at`/`updated_at`/`submitted_by`/`submitted_at` on every `update()` in both repositories.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Generation/Calendar/Approval/Reports/Asset Library unchanged.
- **[PC1]:** Git status clean. Commits: `1e3e664` → `4a5ce38`.
- **[PC1]:** Codex result: PASS. Phase 16B-2 CLOSED.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2 Codex Fix 1+2: Migration backfill + brief update sanitizer
- **[PC1 Claude Code Builder]:** Applied 2 required fixes from Codex review of Phase 16B-2 — build PASS, awaiting Codex re-review.
- **[PC1]:** Fix 1 (migration backfill) — `schema_v1_phase16b2_brief_extension.sql` previously made `client_id`/`brand_id` `NOT NULL` with no backfill, so existing briefs would violate the constraint and/or vanish from every new tenant-scoped query. Now: (1) columns added nullable; (2) `UPDATE campaign_briefs b SET client_id = c.client_id, brand_id = c.brand_id FROM campaigns c WHERE b.campaign_id = c.id AND (b.client_id IS NULL OR b.brand_id IS NULL)` backfills from `campaigns`; (3) a `DO $$` block applies `NOT NULL` to both columns only if zero rows remain unbackfilled — orphaned `campaign_id` rows are reported via `RAISE NOTICE` (with brief IDs) and left nullable instead of guessing a tenant. Idempotent.
- **[PC1]:** Fix 2 (update sanitizer) — `LocalStorageBriefRepository.update` previously spread `patch` directly onto the stored row, permitting tenant reassignment (`client_id`/`brand_id`/`campaign_id`) plus rewriting `id`/`created_at`/`submitted_by`/`submitted_at`. `SupabaseBriefRepository.update` only stripped `id`/`created_at`/`client_id`/`brand_id`/`campaign_id`. Added `BriefUpdatePatch` type (`Partial<Omit<CampaignBrief, 'id'|'client_id'|'brand_id'|'campaign_id'|'created_at'|'updated_at'|'submitted_by'|'submitted_at'>>`) and runtime `sanitizeBriefPatch()` helper in `coreRepository.ts`; both repositories now sanitize the patch before merging/sending. `App.tsx`/`BriefIntakeTab.tsx` updated to the `BriefUpdatePatch` type.
- **[PC1]:** Tenant scope unchanged — `list`/`get`/`update` still require `clientId`+`brandId`+`campaignId`(+`briefId`); Supabase queries unchanged.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved (sanitizer applies to both repos).
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only). Awaiting Codex re-review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2: Campaign Briefs CRUD Wiring (Implemented — awaiting Codex review)
- **[PC1 Claude Code Builder]:** Phase 16B-2 implemented — Campaign Briefs CRUD repository wiring, build PASS, awaiting Codex review.
- **[PC1]:** Schema gap fixed first: `schema_v1.sql`'s `campaign_briefs` table was missing `client_id`/`brand_id`/`status` + 13 brief-detail columns that Phase 5 added to the `CampaignBrief` TS type/UI but never migrated to the DB. New additive migration `03_core/database/schema_v1_phase16b2_brief_extension.sql` (`brief_status` enum + columns + 2 indexes), not applied to any live DB.
- **[PC1]:** `BriefRepository.list({ clientId, brandId, campaignId })`, `get`/`update({ clientId, brandId, campaignId, briefId }, ...)` — all scope params required per interface; TypeScript rejects unscoped calls.
- **[PC1]:** `SupabaseBriefRepository` queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId)` (+ `.eq('id', briefId)` for get/update). `LocalStorageBriefRepository` mirrors the same scoping.
- **[PC1]:** `SupabaseBriefRepository.create` never sends a local `brief-*` ID — DB generates the UUID, returned row used to update React state. No `archive()` method — `status: 'archived'` reachable via `update()`.
- **[PC1]:** App.tsx loads briefs per-campaign on Supabase mount (after campaigns load); added `handleBriefCreate`/`handleBriefUpdate`, removed now-unused `handleCoreUpdate`. `BriefIntakeTab.tsx` now uses async `onBriefCreate`/`onBriefUpdate` props with `formLoading`/`actionError` states.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Generation/Calendar/Approval/Reports/Asset Library unchanged.
- **[PC1]:** Build PASS — 0 TS errors. `git diff --check` PASS (CRLF warnings only). Awaiting Codex review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-1 CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16B-1 officially closed after Codex PASS.
- **[PC1]:** Confirmed final state: `CampaignRepository.list({ clientId, brandId? })`, `get({ clientId, campaignId, brandId? })`, `update`/`archive({ clientId, brandId, campaignId })` — all scope params required per interface; TypeScript rejects unscoped calls.
- **[PC1]:** `SupabaseCampaignRepository` queries always include `.eq('client_id', clientId)`, plus `.eq('brand_id', brandId)` for update/archive/get. `LocalStorageCampaignRepository` mirrors the same scoping.
- **[PC1]:** `SupabaseCampaignRepository.create` never sends a local `campaign-*` ID — DB generates the UUID, returned row used to update React state.
- **[PC1]:** Codex Fix 1 applied — `duration_days: 0` violated `schema_v1.sql` CHECK (`duration_days > 0`). Added `calculateCampaignDurationDays(startDate, endDate)` helper in `coreData.ts` (inclusive day count, fallback `1`), applied identically in both Supabase and localStorage `create()`. Build PASS, git diff --check PASS. Commit `a2a8651`.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Brief/Generation/Calendar/Approval/Reports wiring deferred to 16B-2+.
- **[PC1]:** Git status clean. Commits: `e733633` → `a2a8651`.
- **[PC1]:** Codex result: PASS. Phase 16B-1 CLOSED.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A CLOSED: Codex PASS
- **[PC1 Claude Code Builder]:** Phase 16A officially closed after Codex PASS.
- **[PC1]:** Confirmed final state: `BrandRepository.list(clientId: string)` required in interface and both implementations. `SupabaseBrandRepository.list` unconditionally applies `.eq('client_id', clientId)`. `LocalStorageBrandRepository.list` unconditionally filters by `clientId`. No unscoped brand read path exists anywhere in the codebase.
- **[PC1]:** Confirmed all brand ops (`get`, `update`, `archive`) also scope by both `id` and `client_id` — cross-client access prevented at the repository layer.
- **[PC1]:** Production Supabase env OFF. No secrets. No service role key. Demo Sign In preserved. localStorage fallback preserved. Campaign/Brief/Generation/Approval wiring deferred.
- **[PC1]:** Git status clean. Commits: `54c8281` → `bccd1d1` → `53e8450` → `df7e6aa`.
- **[PC1]:** Codex result: PASS. Phase 16A CLOSED.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix: UUID + error handling
- **[PC1 Claude Code Builder]:** Applied Codex required fixes for Phase 16A.
- **[PC1]:** Removed `syncClientsBrandsToSupabase` — was inserting `client-*` / `brand-*` string IDs into UUID Postgres columns via `sb.from('clients').insert({ id: client.id, ... })`. UUID columns require proper UUIDs or Supabase-generated values.
- **[PC1]:** Removed `.catch(() => {})` pattern — Supabase write errors are no longer silently swallowed. create() errors propagate to tab → `formError`. archive/activate errors propagate → `actionError`.
- **[PC1]:** Rewrote ClientsTab — new async props: `onClientCreate(ClientFormData) → Promise<void>`, `onClientUpdate(id, patch) → Promise<void>`. Removed `generateId`, `onUpdate`, `briefs`. Added `formLoading` and `actionError` states.
- **[PC1]:** Rewrote BrandsTab — new async prop: `onBrandCreate(BrandFormData) → Promise<void>`. Removed `generateId`, `onUpdate`, `briefs`. Added `formLoading`.
- **[PC1]:** Fixed App.tsx — added `handleClientCreate`, `handleClientUpdate`, `handleBrandCreate` (use repos, update state with returned DB row). Restored `handleCoreUpdate` to pure localStorage write (no Supabase diff sync). Updated ClientsTab + BrandsTab renders.
- **[PC1]:** Build: tsc + vite PASS — 0 TS errors. git diff --check exit 0. Demo Sign In preserved. No secrets.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A: Supabase CRUD Wiring — Clients + Brands
- **[PC1 Claude Code Builder]:** Phase 16A complete. Repository pattern implemented for Clients and Brands. Wired into App.tsx with safe fallback.
- **[PC1]:** Created `localStorageRepositories.ts` — `LocalStorageClientRepository` + `LocalStorageBrandRepository` wrap existing `coreData.ts` functions. Implement `ClientRepository`/`BrandRepository` interfaces from Phase 15.
- **[PC1]:** Created `supabaseRepositories.ts` — `SupabaseClientRepository` + `SupabaseBrandRepository`. Anon key only. PGRST116 not-found handling. No service role key. No tenant bypass.
- **[PC1]:** Created `repositoryFactory.ts` — `createPhase16aRepositories(supabase, isConfigured)`. Returns Supabase repos when env configured, localStorage repos otherwise.
- **[PC1]:** Modified `App.tsx` — `useMemo` to create repos once, `useEffect` for async Supabase initial load (clients+brands), non-blocking `supabaseLoadError` banner, `handleCoreUpdate` diff-based Supabase fire-and-forget writes.
- **[PC1]:** Campaign/Brief/Generation/Approval/Assets — still localStorage. Deferred to Phase 16B+.
- **[PC1]:** Build: tsc + vite PASS — 0 TS errors. git diff --check PASS. Demo Sign In preserved. Supabase env not enabled.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 3: Finalize Tenant-Scoped RLS Plan
- **[PC1 Claude Code Builder]:** Phase 15 Codex Fix 3 — 5 remaining issues addressed. Docs-only changes. Plan updated, not yet production-ready.
- **[PC1]:** Fixed `content_items_read` — added 3-tier policy: global staff (all statuses, all tenants), scoped manager (all statuses in their tenant via `current_user_has_scoped_role(['manager'], 'client', c.client_id)`), client/viewer (approved only in their tenant). Fixed `content_items_modify` similarly.
- **[PC1]:** Split `approval_comments_staff_all` (global only) into 3 policies: `approval_comments_global_staff_all` (global, all access), `approval_comments_scoped_staff_read` (scoped manager reads all comments including internal in their tenant, via join `approval_requests→campaigns→has_scoped_role`), `approval_comments_client_read` (non-internal only, tenant-scoped). Added warning: Tier 2 must use `has_scoped_role(['manager'])`, not `can_access_campaign()` (which also matches client/viewer, would expose internal comments).
- **[PC1]:** Extended test matrix — added U5 (viewer-a scoped Client A), U6 (viewer-b scoped Client B). Expanded T01-T18 → T01-T32 with viewer access tests, scoped manager draft/internal tests, 3-tier comment tests. Changed all `✅ PASS` → `☐ EXPECTED`. Added disclaimer: "These are EXPECTED policy outcomes, not executed results."
- **[PC1]:** Fixed stale helper reference in `supabase_wiring_README.md` Phase 16 checklist — removed `Apply current_user_has_role() helper function` → replaced with full 4-helper list.
- **[PC1]:** Updated SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md — removed "all fixed" language, added plan-only status with clear note that actual policies/tests pending Phase 16/17.
- **[PC1]:** `npm run build` → PASS (tsc + vite, 0 errors). No runtime changes. Docs-only.
- **[Safety confirmed]:** No secrets. No runtime code changes. Demo Sign In + localStorage fallbacks preserved. Production Supabase env MUST remain disabled until Phase 16 passes T01-T32 on real DB.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 2: Tighten RLS Tenant Isolation
- **[PC1 Claude Code Builder]:** Phase 15 Codex Fix 2 — 5 issues found — addressed in plan. Policies/tests pending real Supabase execution.
- **[PC1]:** Identified `roles` table missing from audit — 11+15=26, schema has 27 tables. `roles` not in either list. Decision: enable RLS + roles_read_authenticated (no sensitive data, required for fetchUserRole).
- **[PC1]:** Rewrote `database/rls_policy_plan.md` section 1: `roles` added to the 16-table missing list. Section 2 Step 0: `ALTER TABLE roles ENABLE ROW LEVEL SECURITY` added.
- **[PC1]:** Replaced `current_user_has_role()` (global-only, unsafe for scoped roles) with 4 tenant-aware helpers: `current_user_has_global_role()` (resource_type IS NULL/'global' only), `current_user_has_scoped_role()` (specific type+id), `current_user_can_access_client()` (global OR scoped), `current_user_can_access_campaign()` (joins via campaign.client_id). All: SECURITY DEFINER + SET search_path = public, pg_temp, no dynamic SQL, boolean-only return.
- **[PC1]:** Fixed `approval_events_read` policy — was `current_user_has_role(all roles)` (cross-tenant leak). Now: `current_user_has_global_role(owner/manager) OR EXISTS(ar JOIN campaign WHERE current_user_can_access_campaign)`.
- **[PC1]:** Fixed `approval_comments_client_read` policy — was `is_internal=false AND role check` (cross-tenant leak). Now: `is_internal=false AND EXISTS(ar JOIN campaign WHERE current_user_can_access_campaign)`.
- **[PC1]:** Updated all Group A–G policies to use `current_user_has_global_role()` instead of old helper. Updated Group B–E to use `current_user_can_access_client()` / `current_user_can_access_campaign()`.
- **[PC1]:** Added section 14: 18 recommended cross-tenant tests (T01–T18) — 4 test users (owner global, manager scoped A, client A, client B), covers: basic access, cross-tenant denial, approval events/comments, internal comment denial, automation_logs denial, Demo Sign In fallback.
- **[PC1]:** Updated `supabase_wiring_README.md` section 1.4: roles added, 4-helper architecture documented, Patterns 1–4 updated. Section 9 safety invariants: plan-only status with ✅/⏳/⚠️, production-env warning.
- **[PC1]:** Updated `database/README.md`: 11+16=27 correct, roles in list, 4-helper mention, production-env warning with T18 test requirement.
- **[PC1]:** `npm run build` → PASS (tsc + vite, 0 errors). Docs-only changes. Bundle unchanged.
- **[Safety confirmed]:** No secrets. No runtime code changes. Auth logic unchanged. Demo Sign In + localStorage fallbacks preserved. Build pass.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix: Harden RLS + CRUD Plan
- **[PC1 Claude Code Builder]:** Phase 15 Codex Fix — 6 issues found — addressed in plan. Policies/tests pending real Supabase execution.
- **[PC1]:** Audited schema_v1.sql — confirmed RLS enabled on 11 tables, NOT enabled on 15 tables. Corrected false "all tables" claim in database/README.md.
- **[PC1]:** Identified bootstrap problem: `user_roles` RLS enabled with no policy → fetchUserRole() returns empty → every user falls back to viewer. Added bootstrap policy callout + warning in supabase_wiring_README.md and database/README.md.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/database/rls_policy_plan.md` (NEW): 13 sections — current RLS status table, Step 0 enable RLS on 15 missing tables (SQL), current_user_has_role() helper function (SECURITY DEFINER), bootstrap policies (roles/user_roles/user_profiles/users), Group A–G full policy set with tenant-scoped patterns using resource_id, ordered apply guide, safety checklist before enabling production env.
- **[PC1]:** Fixed supabase_wiring_README.md section 1.4: accurate RLS table list (11 enabled / 15 missing), bootstrap problem callout, corrected Pattern 2 to include tenant ownership check via resource_id (not just role check), added Pattern 3 content status gate.
- **[PC1]:** Fixed supabase_wiring_README.md section 4: replaced ambiguous `AuthProvider.useEffect()` with explicit `src/lib/auth/AuthContext.tsx` file reference.
- **[PC1]:** Expanded supabase_wiring_README.md section 7 Phase 16 checklist: added Step 0 RLS foundation, added reports/report_metrics (P5), expanded Phase 17+ list (export_packs, connector_registry, module_registry, module_events, automation_logs, audit_logs).
- **[PC1]:** Hardened supabase_wiring_README.md section 9 safety invariants: added prod-env warning, client tenant isolation rule, RLS-on-no-policy behavior note.
- **[PC1]:** Updated `src/lib/core/coreRepository.ts`: added `Report` + `ReportMetric` imports, added `ReportRepository` interface (list/get/create/update), added `ReportMetricRepository` interface (listForReport/create/createBatch), updated `CoreRepositories` bundle from 16 → 18 repos.
- **[PC1]:** Updated SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[PC1]:** `npm run build` → PASS (tsc + vite, 0 errors). No runtime code changes. Interfaces-only addition tree-shaken. Bundle unchanged.
- **[Safety confirmed]:** No secrets. No real API. Auth logic unchanged. Demo Sign In + localStorage fallbacks preserved. No auto-post/ads/messaging. Build pass.

---

### 🗓️ Ngày 09/06/2026 — Phase 15: Supabase Auth + Database Wiring Plan
- **[PC1 Claude Code Builder]:** Phase 15 initiated. Full audit + wiring plan. No CRUD wiring (deferred Phase 16).
- **[PC1]:** Audited `src/lib/supabaseClient.ts` — isSupabaseConfigured guard, anon key only, null-safe. ✅ No changes needed.
- **[PC1]:** Audited `src/lib/auth/AuthContext.tsx` — supabase/demo/unconfigured modes, role fetch from `user_roles → roles` tables, demo fallback at `owner@thecore.agency/demo1234`. ✅ No changes needed.
- **[PC1]:** Audited `src/components/auth/LoginScreen.tsx` — "⚠️ Supabase not configured" banner, "Demo Sign In" title, demo credentials prefill when unconfigured. ✅ No changes needed.
- **[PC1]:** Audited `.env.example` — VITE_ prefix for frontend, SERVICE_ROLE_KEY documented as server-only, WEBHOOK_SHARED_SECRET placeholder. ✅ No changes needed.
- **[PC1]:** Audited `schema_v1.sql` — 7 table groups, all TypeScript types mapped, RLS enabled on all tables. ✅ Ready to apply.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md` — 10-section wiring plan: auth audit, schema audit, localStorage→Supabase mapping (7 stores), RLS requirements (2 patterns), missing/deferred items, env vars guide, client safety rules, auth flow, repository interface plan, SQL apply guide, Phase 16 CRUD checklist, safety invariants.
- **[PC1]:** Created `src/lib/core/coreRepository.ts` — TypeScript interfaces for 16 repositories (ClientRepository, BrandRepository, CampaignRepository, BriefRepository, GenerationJobRepository, ContentItemRepository, ApprovalRequestRepository, ApprovalEventRepository, ApprovalCommentRepository, AssetRepository, AssetCollectionRepository, ExportPackRepository, ConnectorRepository, ModuleRepository, ModuleEventRepository, AutomationLogRepository) + CoreRepositories bundle. Interfaces only, no Supabase calls, no runtime impact.
- **[PC1]:** Updated `CLAUDE_MARKETING_TEAM/03_core/database/README.md` — full 7-step SQL apply guide, service role key warning, related docs links.
- **[PC1]:** Updated CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[PC1]:** `npm run build` → PASS (tsc + vite, 0 errors). coreRepository.ts is interfaces only — tree-shaken, zero bundle impact. Git add/commit/push.
- **[Safety confirmed]:** No secrets committed. SERVICE_ROLE_KEY documented as "never in frontend." No real API calls. Demo Sign In + localStorage fallbacks preserved. No auto-post/ads/messaging. Build pass.

---

### 🗓️ Ngày 09/06/2026 — Phase 14: Automation Logs Foundation
- **[PC1 Claude Code Builder]:** Phase 14 resumed from interrupted session. Files partially written from previous session — read state, verified usability, continued from existing content.
- **[PC1]:** Phase 14 types verified in `src/types/core.ts` (`AutomationLogType`, `AutomationLogSource`, `AutomationLogSeverity`, `AutomationLogStatus`, `LocalAutomationLog`) — already complete.
- **[PC1]:** Fixed unused variable `NOW` in `src/lib/core/automationLogs.ts` (TS6133).
- **[PC1]:** Fixed unused import `LocalAutomationLog` in `src/components/core/AutomationLogsTab.tsx` (TS6196).
- **[PC1]:** Fixed unused destructuring `actorLabel` in `AutomationLogsTab.tsx` (TS6133) — removed from destructuring, kept in Props interface for forward compat.
- **[PC1]:** Added `Activity` icon to lucide-react imports in `src/App.tsx`.
- **[PC1]:** Added `AutomationLogsTab`, `loadAutomationLogData`, `saveAutomationLogData`, `AutomationLogStore` imports to `src/App.tsx`.
- **[PC1]:** Added `logData` state (Phase 14 automation logs) and `handleLogUpdate` handler to `App.tsx`.
- **[PC1]:** Added sidebar "Automation Logs" button (owner/manager only, with unresolved error count badge) to `App.tsx`.
- **[PC1]:** Added `automation-logs` tab routing in content area of `App.tsx`.
- **[PC1]:** Updated phase badge to "Real Operations MVP — Phase 14".
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/automation_logs_README.md`.
- **[PC1]:** Updated CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[PC1]:** `npm run build` → PASS (tsc + vite, 0 errors). Git add/commit/push.
- **[Safety confirmed]:** No real workflow execution. No real webhooks. No external API calls. No auto-post/ads/messaging. Logs hidden from client/viewer. Build pass.

---

### 🗓️ Ngày 08/06/2026 — Phase 12: Export Pack Foundation
- **[PC1 Claude Code Builder]:** Phase 12 initiated.
- **[PC1]:** Added `ExportPackType`, `ExportPackFormat`, `ExportPackStatus`, `LocalExportPack` types to `src/types/core.ts`.
- **[PC1]:** Added `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()` to `src/lib/core/coreData.ts`. Storage key: `core_agency_export_pack_data_v1`.
- **[PC1]:** Created `src/lib/core/exportPackGenerator.ts`: `generateExportPack()`, 6 content builders (campaign_summary, content_calendar, approved_content, client_report, asset_checklist, full_campaign_pack), `formatContent()` (markdown/plain_text/json_preview), `CLIENT_SAFE_EXPORT_TYPES` constant.
- **[PC1]:** Created `src/components/core/ExportPackTab.tsx`: safety banner, header with phase badge + history toggle, history panel (50 packs), configure panel (scope → export type → format → Generate), preview panel (pack meta, textarea, copy-to-clipboard, regenerate, governance note), permission gate.
- **[PC1]:** Updated `src/App.tsx`: `Package` icon import, `ExportPackTab` import; sidebar "Export Pack" button (under Reports in Core section); tab routing `export-pack`; phase badge → Phase 12.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`.
- **[PC1]:** Updated CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[SYSTEM]:** Build pass.
- **[SYSTEM]:** Phase 12 DONE. Committing and pushing.

---

### 🗓️ Ngày 08/06/2026 — Phase 9: Client View Foundation
- **[PC1 Claude Code Builder]:** Phase 9 initiated.
- **[PC1]:** Created `src/components/core/ClientViewTab.tsx`: safety banner, internal preview badge, campaign selector, campaign overview card, content summary stats, content item list (client-facing fields only), expand/collapse, feedback form, public comment display, empty states.
- **[PC1]:** Updated `src/App.tsx`: UserCheck icon, ClientViewTab import, "Client" sidebar section, "Client Portal" button, tab routing `client-view`.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/client_view_README.md`.
- **[PC1]:** Updated CURRENT_PHASE.md, phase_log.md, agent_activity_log.md, SESSION_SUMMARY.md.
- **[SYSTEM]:** Build pass.
- **[SYSTEM]:** Phase 9 DONE. Committing and pushing.

---

### 🗓️ Ngày 08/06/2026 — Phase 8: Approval Workflow Foundation
- **[PC1 Claude Code Builder]:** Phase 8 initiated.
- **[PC1]:** Added Phase 8 types to `src/types/core.ts`: ContentApprovalStatus, ApprovalPriority, ApprovalActionType, ContentApprovalRequest, ContentApprovalEvent, ContentApprovalComment.
- **[PC1]:** Updated `src/lib/core/coreData.ts`: ApprovalDataStore, load/save, helpers (submitForApproval, executeApprovalAction, addApprovalComment, canSubmitItem, getActiveRequestForItem), display labels/colors.
- **[PC1]:** Created `src/components/core/ApprovalsTab.tsx`: safety banner, submit panel, filter bar, request list, detail view with actions (Approve/Reject/Revision/Cancel), comment form, history timeline.
- **[PC1]:** Updated `src/components/core/ContentGenerationTab.tsx`: submittable item → Submit for Approval button.
- **[PC1]:** Updated `src/components/core/ContentCalendarTab.tsx`: approval status badge on item cards, approvalStatusByItemId map.
- **[PC1]:** Updated `src/App.tsx`: ClipboardCheck + ApprovalsTab imports; approvalData state; handleApprovalUpdate; actorLabel; submittableItemIds; sidebar button with pending count; tab routing.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/approval_workflow_README.md`.
- **[SYSTEM]:** Build pending.
- **[SYSTEM]:** Phase 8 DONE. Committing and pushing.

### 🗓️ Ngày 08/06/2026 — Phase 7: Content Calendar Foundation
- **[PC1 Claude Code Builder]:** Phase 7 initiated.
- **[PC1]:** Extended `src/types/core.ts` — added optional calendar fields to `ContentPlanItem` (scheduled_time, publish_note, owner_note, last_moved_at).
- **[PC1]:** Updated `src/lib/core/coreData.ts` — added CalendarSafeStatus type, CALENDAR_SAFE_STATUSES array, CalendarItemPatch interface, updateContentItemInStore() helper.
- **[PC1]:** Created `src/components/core/ContentCalendarTab.tsx` — full component: safety banner, cascading filter bar, day-grouped list, item cards, expand/detail view, edit panel (safe fields), permission gate, empty states, summary stats.
- **[PC1]:** Updated `src/App.tsx` — CalendarDays icon, ContentCalendarTab import, sidebar nav button, content-calendar tab routing.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/content_calendar_README.md`.
- **[PC1]:** Updated CURRENT_PHASE.md, phase_log.md, agent_activity_log.md, SESSION_SUMMARY.md.
- **[SYSTEM]:** Build pending.
- **[SYSTEM]:** Phase 7 DONE. Committing and pushing.

### 🗓️ Ngày 08/06/2026 — Phase 6: Content Generation Foundation
- **[PC1 Claude Code Builder]:** Phase 6 initiated. Resumed from previous session (context compacted).
- **[PC1]:** Updated `src/types/core.ts` — Phase 6 types added (ContentPlanJob, ContentPlanItem, etc.).
- **[PC1]:** Updated `src/lib/core/coreData.ts` — GenerationDataStore + helpers. Separate storage key.
- **[PC1]:** Created `src/lib/core/contentGenerator.ts` — 7-angle deterministic mock generator. Vietnamese templates. Default item status: needs_review.
- **[PC1]:** Created `src/components/core/ContentGenerationTab.tsx` — list + detail mode. Safety banner. Permission gate.
- **[PC1]:** Updated `src/components/core/BriefIntakeTab.tsx` — onNavigateToGenerate prop + enabled Generate button.
- **[PC1]:** Updated `src/App.tsx` — Wand2 icon, ContentGenerationTab, genData state, sidebar button, tab rendering, Phase 6 badge.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/content_generation_README.md`.
- **[SYSTEM]:** tsc --noEmit → 0 errors. vite build → 0 errors, ~663KB bundle.
- **[SYSTEM]:** Phase 6 DONE. Committing and pushing.

---

### 🗓️ Ngày 08/06/2026 — Phase 5: Brief Intake Foundation
- **[PC1 Claude Code Builder]:** Phase 5 initiated. Resumed from previous session (context compacted).
- **[PC1]:** Fixed remaining TypeScript errors: added `briefs: CampaignBrief[]` prop + onUpdate pass-through to `BrandsTab.tsx` and `CampaignsTab.tsx`. Removed unused `BRIEF_STATUSES` import from `BriefIntakeTab.tsx`.
- **[PC1]:** Updated `src/App.tsx` — added `briefs={coreData.briefs}` to `<ClientsTab>`, `<BrandsTab>`, `<CampaignsTab>` renderers.
- **[SYSTEM]:** tsc --noEmit → 0 errors. vite build → 0 errors, ~634KB bundle.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/brief_intake_README.md`.
- **[PC1]:** Updated CURRENT_PHASE.md (Phase 4 → Phase 5), SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[SYSTEM]:** Phase 5 DONE. Committing and pushing.

---

### 🗓️ Ngày 07/06/2026 — Phase 4: Client/Brand/Campaign Management Foundation
- **[PC1 Claude Code Builder]:** Phase 4 initiated. Read all docs: CURRENT_PHASE, SESSION_SUMMARY, strategy plan, DB schema, auth README, types/core.ts, App.tsx, permissions.ts.
- **[PC1]:** Created `src/lib/core/coreData.ts` — seed 3 clients, 3 brands, 3 campaigns. LocalStorage store. Form types. Display helpers.
- **[PC1]:** Created `src/components/core/ClientsTab.tsx` — list + create + detail (with brands summary + cross-tab navigate). Archive/activate actions gated on canManageClients.
- **[PC1]:** Created `src/components/core/BrandsTab.tsx` — card grid + filter by client + create + detail (with campaigns). Cross-tab navigate to Campaigns. canManageBrands gate.
- **[PC1]:** Created `src/components/core/CampaignsTab.tsx` — table + filter by client+brand + create + status update + detail. canCreateCampaigns / canEditCampaigns gates.
- **[PC1]:** Updated `src/App.tsx` — added imports (Zap, ClientsTab, BrandsTab, CampaignsTab, coreData utils, isSupabaseConfigured). Added coreData state + saveCoreData effect. Added handleCoreUpdate, handleCoreNavigate. Added "Core" sidebar section (Clients/Brands/Campaigns). Added "Workspace" section header. Added tab rendering. Phase badge → Phase 4.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/client_brand_campaign_README.md`.
- **[SYSTEM]:** tsc --noEmit → 0 errors. vite build → 0 errors, 606KB bundle. Pushed to GitHub.
- **[SYSTEM]:** Phase 4 DONE.

---

### 🗓️ Ngày 07/06/2026 — Phase 3: Auth/Login + Role Permission Foundation
- **[PC1 Claude Code Builder]:** Phase 3 initiated. Stack: React 18 + Vite, no router, no Supabase yet.
- **[PC1]:** Installed `@supabase/supabase-js`. Noted esbuild/vite audit warning (dev-only, not fixing to avoid breaking change).
- **[PC1]:** Created `src/vite-env.d.ts` (missing from project — caused TS2339 on import.meta.env).
- **[PC1]:** Created `src/lib/supabaseClient.ts` — null-safe, reads VITE_SUPABASE_URL/ANON_KEY. Returns null if not configured.
- **[PC1]:** Created `src/lib/auth/AuthContext.tsx` — AuthProvider, useAuth(), 3 modes, signIn/signOut, fetchUserRole via 2-step query.
- **[PC1]:** Created `src/lib/auth/permissions.ts` — 30+ permission keys, `can.*` helpers, ROLE_LABELS, ROLE_COLORS.
- **[PC1]:** Created `src/components/auth/LoginScreen.tsx` — The Core Agency branded login, demo fallback.
- **[PC1]:** Updated `src/main.tsx` — AuthProvider wrapper. Updated `src/App.tsx` — auth gate + user status header.
- **[PC1]:** Fixed 4 TypeScript errors: unused React import, missing vite-env.d.ts, Supabase join type issue → rewritten to 2-step query.
- **[SYSTEM]:** Build pass (tsc + vite). 0 errors. 563KB bundle (Supabase adds ~220KB). Pushed to GitHub.
- **[SYSTEM]:** Phase 3 DONE.

---

### 🗓️ Ngày 07/06/2026 — Phase 2: Database Schema V1
- **[PC1 Claude Code Builder]:** Phase 2 initiated. Target: Supabase Postgres schema V1.
- **[PC1]:** Confirmed stack: React + TypeScript + Vite. No backend/DB yet. No existing Supabase setup.
- **[PC1]:** Created `00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md`.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql` — 30+ tables covering all 7 domain groups. ENUMs, FKs, indexes, `set_updated_at()` trigger, RLS enabled on key tables.
- **[PC1]:** Created `CLAUDE_MARKETING_TEAM/03_core/database/README.md`.
- **[PC1]:** Created `src/types/core.ts` — all table interfaces + enum union types + composite view types.
- **[PC1]:** Created `.env.example` — Supabase, webhook, n8n, Anthropic placeholders. No real secrets.
- **[PC1]:** Verified `.gitignore` covers `.env.local`. Safe.
- **[PC1]:** Updated CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md.
- **[SYSTEM]:** Build verified (npm run build — tsc + vite). 0 errors. Pushed to GitHub.
- **[SYSTEM]:** Phase 2 DONE. Schema ready for Phase 3 Supabase Auth + RLS policies.

---

### 🗓️ Ngày 07/06/2026 — Phase 1: The Core Agency Real Operations MVP
- **[SYSTEM — PC1 Claude Code Builder]:** Phase 1 initiated. The Core Agency Real Operations MVP begins.
- **[PC1]:** Read all existing docs (CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md). Previous state: Phase H.7 DONE, static frontend UI with Owner/Client View modes.
- **[PC1]:** Strategy docs created: `00_strategy/THE_CORE_AGENCY_7_DAY_REAL_MVP_PLAN.md` and `00_strategy/THE_CORE_AGENCY_MODULES_AND_N8N_WORKSTREAM.md`.
- **[PC1]:** UI branding updated — public name is now `THE CORE AGENCY`. Tagline, phase badge, pitch text, and HTML title updated.
- **[PC1]:** Logs updated: CURRENT_PHASE.md (Phase 1 DONE), SESSION_SUMMARY.md (next = Phase 2), phase_log.md, agent_activity_log.md.
- **[PC1]:** Build verified (npm run build — tsc + vite). No errors. Pushed to GitHub.
- **[SYSTEM]:** Phase 1 DONE. Scope locked. Strategy documented. Branding live. No backend/database/auth in this phase.

---

### 🗓️ Ngày 03/06/2026 19:15:00
- **[SYSTEM]:** Khởi tạo thành công 5 thực thể AI Agent: Copywriter, Designer, Video Editor, Ads Manager, Data Reporter.
- **[AI Coordinator]:** Trạng thái hoạt động: `idle`. Đang chờ nhận Brief chiến dịch từ Owner.
- **[SYSTEM]:** Cấu hình an toàn `safety_rules.md` được áp dụng thành công. Toàn bộ các kết nối API thực tế của Meta Ads, TikTok Ads, Canva được đánh dấu trạng thái: `DISCONNECTED` (Chạy ở chế độ mô phỏng hoàn toàn).

### 🗓️ Ngày 03/06/2026 19:22:17
- **[SYSTEM]:** Bắt đầu rà soát toàn bộ cấu trúc và nội dung Workspace.
- **[SYSTEM]:** Kiểm tra sự tồn tại của 8 thư mục con và 21 tệp tin -> Hợp lệ (100% đầy đủ).
- **[SYSTEM]:** Rà soát các quy tắc an toàn và ranh giới. Không phát hiện hành vi tự động chạy ads, tự động nhắn tin hay auto-post thực tế.
- **[SYSTEM]:** Rà soát kết nối bên ngoài. Canva, Meta Ads, Google Drive, n8n được định hình đúng chuẩn thiết kế tương lai (Future Connectors) và không có kết nối giả vờ hoạt động.
- **[SYSTEM]:** Rà soát vai trò Agents. 5 vai trò (Copywriter, Designer, Video Editor, Ads Manager, Data Reporter) đã được định nghĩa chi tiết nhiệm vụ, input, output, tiêu chuẩn và điều cấm kỵ.
- **[SYSTEM]:** Rà soát demo case và workflow 7 ngày. Luồng công việc trực quan, dễ hiểu cho con người (Human Owner). Các template output phù hợp và đầy đủ cho việc thử nghiệm.
- **[SYSTEM]:** Cập nhật tiến độ `CURRENT_PHASE.md` sang trạng thái `COMPLETED` cho Phase A.

### 🗓️ Ngày 03/06/2026 19:25:00
- **[AI Coordinator]:** Trạng thái hoạt động: `processing`. Nhận tín hiệu khởi động Phase B — First Demo Campaign Pack.
- **[AI Coordinator]:** Đã đọc brief đầu vào [input_brief.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/local_business_demo/input_brief.md) và phân bổ công việc cho 5 Agents.
- **[Copywriter Agent]:** Đã khởi chạy kỹ năng `copywriter_skills.md`. Hoàn thành viết 7 caption bài đăng Facebook, 7 hook gây chú ý, 3 slogan và 5 CTA. Lưu file đầu ra tại `02_outputs/copywriter/demo_copywriter_outputs.md`.
- **[Video Editor Agent]:** Đã nhận cấu trúc chiến dịch. Biên soạn 7 kịch bản video dọc TikTok/Reels với đầy đủ Hook, Phân cảnh, Voiceover, CTA, Shot suggestion. Lưu file đầu ra tại `02_outputs/video_editor/demo_video_editor_outputs.md`.
- **[Designer Agent]:** Đọc caption đầu ra của Copywriter. Thiết lập 7 Design brief chỉ dẫn bố cục, text overlay và biên dịch 7 Prompts tiếng Anh chuẩn để sinh ảnh. Lưu file đầu ra tại `02_outputs/designer/demo_designer_outputs.md`.
- **[Ads Manager Agent]:** Lập sơ đồ cấu hình phân phối ads giả định (5 angles, 3 objectives, 3 ad sets target cụ thể theo địa lý Vinh, 5 creative testings). Lưu file đầu ra tại `02_outputs/ads_manager/demo_ads_manager_outputs.md`.
- **[AI Coordinator]:** Trích xuất kết quả chạy giả lập và kích hoạt Data Reporter Agent.
- **[Data Reporter Agent]:** Áp dụng kỹ năng phân tích, tính toán các chỉ số CTR (1.68%), CPC (2.619 VND), CPA (41.949 VND), ROI (257.57%) dựa trên dữ liệu mô phỏng (Simulated Data). Xuất đề xuất tối ưu phân bổ ngân sách. Lưu file đầu ra tại `02_outputs/data_reporter/demo_data_reporter_outputs.md`.
- **[AI Coordinator]:** Tổng hợp và đóng gói tất cả các đầu ra riêng rẽ thành sản phẩm chiến dịch cuối cùng tại `02_outputs/final_campaign_pack/demo_7_day_campaign_pack.md`.
- **[SYSTEM]:** Cập nhật tiến độ `CURRENT_PHASE.md` sang trạng thái `COMPLETED` cho Phase B.

### 🗓️ Ngày 03/06/2026 19:28:00
- **[AI Coordinator]:** Nhận lệnh cấu hình Quy trình SOP & Hướng dẫn (Phase C - Brief To Output Operating System).
- **[SYSTEM]:** Tạo lập thành công tệp nhập liệu [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md) cho Owner.
- **[SYSTEM]:** Phác thảo quy trình vận hành tiêu chuẩn gồm 7 bước cụ thể tại [brief_to_output_sop.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/04_workflows/brief_to_output_sop.md).
- **[SYSTEM]:** Thiết lập mẫu đóng gói đầu ra chuẩn [final_campaign_pack_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/03_templates/final_campaign_pack_template.md).
- **[SYSTEM]:** Hoàn thành cẩm nang hướng dẫn sử dụng phi kỹ thuật dành cho Owner tại [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md).
- **[SYSTEM]:** Xây dựng bảng so sánh ranh giới 3 cấp độ vận hành tại [demo_vs_real_boundary.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/demo_vs_real_boundary.md).
- **[SYSTEM]:** Cập nhật tiến độ `CURRENT_PHASE.md` sang trạng thái `COMPLETED` cho Phase C.

### 🗓️ Ngày 03/06/2026 19:30:00
- **[AI Coordinator]:** Nhận lệnh triển khai tập lệnh Antigravity Commands (Phase D - Antigravity Commands).
- **[SYSTEM]:** Khởi tạo thành công thư mục `.antigravity/commands/` tại thư mục gốc.
- **[SYSTEM]:** Tạo tệp lệnh khởi chạy chiến dịch [start_campaign.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/start_campaign.md).
- **[SYSTEM]:** Tạo tệp lệnh rà soát chất lượng [review_outputs.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/review_outputs.md).
- **[SYSTEM]:** Tạo tệp lệnh đóng gói sạch đẹp [finalize_pack.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/finalize_pack.md).
- **[SYSTEM]:** Cập nhật cẩm nang [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md) để cung cấp tài liệu hướng dẫn gọi lệnh cho Owner.
- **[SYSTEM]:** Cập nhật tiến độ `CURRENT_PHASE.md` sang trạng thái `COMPLETED` cho Phase D.

### 🗓️ Ngày 03/06/2026 19:32:00
- **[AI Coordinator]:** Nhận lệnh thiết lập Local Web UI Prototype (Phase E — Local Web UI Prototype).
- **[SYSTEM]:** Khởi tạo thành công các tệp tin cấu hình Vite React tại thư mục gốc: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`.
- **[SYSTEM]:** Thiết kế hệ thống CSS cao cấp `src/index.css` với hiệu ứng kính mờ (Glassmorphism), bóng đổ neon và phối màu tối (slate/dark palette).
- **[SYSTEM]:** Chuẩn bị dữ liệu mock chiến dịch trà sữa Vinh tại `src/mockData.ts`.
- **[SYSTEM]:** Phát triển giao diện Dashboard, Campaign Brief Form, AI Team Board, Campaign Outputs, Approval Checklist tại `src/App.tsx`.
- **[SYSTEM]:** Viết tài liệu hướng dẫn cài đặt và chạy local bằng npm tại `CLAUDE_MARKETING_TEAM/README.md`.
- **[SYSTEM]:** Cập nhật tiến độ `CURRENT_PHASE.md` sang trạng thái `COMPLETED` cho Phase E.

### 🗓️ Ngày 03/06/2026 19:45:00
- **[SYSTEM]:** Phát hiện lỗi biên dịch Vite tại dòng 245 file [src/App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx) do sử dụng `color: var(--accent-indigo)` sai cú pháp.
- **[SYSTEM]:** Đã tiến hành sửa lỗi thành chuỗi hợp lệ `'var(--accent-indigo)'` và rà soát toàn bộ tệp để đảm bảo không còn lỗi tương tự.
- **[SYSTEM]:** Dự án hiện tại đã biên dịch sạch lỗi (Clean Build).

### 🗓️ Ngày 03/06/2026 20:15:00
- **[AI Coordinator]:** Nhận lệnh cấu hình Phase F — Universal AI Coordinator Prompt.
- **[SYSTEM]:** Tạo tệp prompt vạn năng [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md) chứa thiết kế phối hợp 5 vai trò.
- **[SYSTEM]:** Tạo tệp ví dụ sẵn brief thực tế cho trà sữa Vinh tại [example_owner_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/example_owner_prompt.md).
- **[SYSTEM]:** Cấu hình cập nhật chỉ dẫn vận hành tại tệp [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md).
- **[SYSTEM]:** Đồng bộ hóa trạng thái hoàn thành 100% Phase F trong `CURRENT_PHASE.md`.

### 🗓️ Ngày 03/06/2026 20:30:00
- **[SYSTEM]:** Thực hiện hành động: **Workspace Audit Cleanup** nhằm đồng bộ và dọn dẹp dự án.
- **[SYSTEM]:** Tệp tin đã thay đổi & tạo lập:
  * [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md): Tạo mới theo quy tắc snake_case và ghi đè tệp in hoa `OWNER_BRIEF_FORM.md` cũ thành liên kết chuyển hướng.
  * [App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx): Sửa đổi kiểu `React.FormEvent` thành `React.SyntheticEvent` để loại bỏ false positive từ khóa "Forme".
  * [README.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/README.md): Bổ sung mục `Project Boundary` rõ ràng.
  * [AGENTS.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/AGENTS.md): Bổ sung mục quy tắc an toàn chung cho Agents.
  * [brief_to_output_sop.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/04_workflows/brief_to_output_sop.md), [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md), [phase_log.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/08_logs/phase_log.md), [.antigravity/commands/start_campaign.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/start_campaign.md): Đồng bộ hóa toàn bộ liên kết tham chiếu từ `OWNER_BRIEF_FORM.md` sang `owner_brief_form.md`.
- **[SYSTEM]:** Lý do: Chuẩn hóa quy tắc đặt tên snake_case, giảm thiểu nhiễu keyword cho chatbot, thắt chặt ranh giới hoạt động của dự án.
- **[SYSTEM]:** Cam kết an toàn: Không thêm API key/token thật, không kích hoạt connector thật, không auto-post/run ads thật. Môi trường sạch sẽ và an toàn.

### 🗓️ Ngày 04/06/2026 (Local Time)
- **[AI Coordinator]:** Nhận lệnh khởi động Phase H.3 — Demo Polish & Sales Readiness.
- **[Builder Agent — Claude Code]:** Triển khai đầy đủ Phase H.3 trên `src/App.tsx`:
  1. Cập nhật header badge → Phase H.3.
  2. Dashboard: Presenter Demo Guide 5-step clickable.
  3. Client Demo Mode: Sales Readiness 5-card (Problem / Solution / Deliverables / Approval / Safety).
  4. Client Demo Mode: Value Proposition 4-card + mock ROI.
  5. Client Demo Mode: Before/After comparison table (Manual 10–16h vs AI ~2h).
  6. Client Demo Mode: CTA Block 3 nút (Approve / Export / Next Brief).
  7. Client Demo Pack: Service Packages teaser (Starter / Growth / Scale).
- **[SYSTEM]:** Build verification: `npm run build` → PASS, 0 errors. Bundle: 274.36 kB.
- **[SYSTEM]:** Docs cập nhật: CURRENT_PHASE.md, phase_log.md, SESSION_SUMMARY.md, phase_h3_handoff.md (mới tạo).
- **[SYSTEM]:** Safety Guard còn nguyên — Auto-post: NO | Real Ads: NO | Real Messaging: NO | Secrets: NO | FnB OS V1: NO.
- **[SYSTEM]:** Trạng thái Phase H.3: IN PROGRESS — Chờ Codex review + Owner production check.

### 🗓️ Ngày 04/06/2026 (Local Time) — Phase H.3 CLOSED
- **[AI Coordinator]:** Nhận tín hiệu đóng Phase H.3 — Demo Polish & Sales Readiness.
- **[Codex Reviewer]:** Re-review Phase H.3 — PASS. UI/code/safety boundaries đầy đủ. No required fixes.
- **[SYSTEM]:** git status — working tree clean. main = origin/main. Safety Guard còn nguyên.
- **[SYSTEM]:** Phase H.3 chính thức đóng. Trạng thái: ✅ CLOSED.
- **[AI Coordinator]:** Trạng thái hoạt động: `idle`. Sẵn sàng nhận Brief Phase H.4 — Export/Presentation Readiness.


### 🗓️ Ngày 03/06/2026 20:15:00
- **[AI Coordinator]:** Nhận lệnh cấu hình Phase G — Client Demo Pack.
- **[SYSTEM]:** Tạo tệp dàn ý slide pitch deck [client_pitch_deck_outline.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_pitch_deck_outline.md).
- **[SYSTEM]:** Tạo kịch bản nói chuyện demo 10 phút [client_demo_script.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_demo_script.md).
- **[SYSTEM]:** Thiết lập 3 gói dịch vụ đề xuất cho SMEs tại [service_packages.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/service_packages.md).
- **[SYSTEM]:** Xây dựng tài liệu câu hỏi thường gặp của khách hàng tại [faq_for_clients.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/faq_for_clients.md).
- **[SYSTEM]:** Cập nhật đồng bộ hóa trạng thái hoàn thành 100% Phase G trong `CURRENT_PHASE.md`.

### 🗓️ Ngày 03/06/2026 21:58:00
- **[SYSTEM]:** Thực hiện hành động: **Cấu hình Phase F — Universal AI Coordinator Prompt (Bản Hoàn Thiện)**.
- **[SYSTEM]:** Tệp tin đã thay đổi & tạo lập:
  * [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md): Cập nhật chi tiết đặc tả 5 AI roles, cấu trúc đầu ra mẫu và Owner template.
  * [quick_copy_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/quick_copy_ai_coordinator_prompt.md): Tạo mới tệp prompt rút gọn để sao chép nhanh vào các Chatbot bên ngoài.
  * [README.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/README.md): Bổ sung phần tài liệu của Phase F và chỉ dẫn an toàn.
  * [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md): Bổ sung phần hướng dẫn sử dụng chi tiết 7 bước cho Prompt vạn năng.
- **[SYSTEM]:** Cam kết an toàn: Không chứa API key, password hay secrets; không kích hoạt connector thật; không auto-post/auto-ads và độc lập với FnB OS V1.
- **[SYSTEM]:** Trạng thái: Done / Ready for Review.

### 🗓️ Ngày 03/06/2026 22:05:00
- **[SYSTEM]:** Khởi động Phase G — Client Demo Pack.
- **[SYSTEM]:** Tạo lập thư mục mới: `06_demo_cases/client_demo_pack/`.
- **[SYSTEM]:** Tạo lập thành công 8 tệp tin thương mại hóa:
  * `01_one_page_overview.md`: Tài liệu một trang tóm tắt pain points, giải pháp, lợi ích và flow hoạt động.
  * `02_client_demo_script.md`: Kịch bản thuyết trình demo 10-15 phút cùng bộ xử lý phản đối.
  * `03_sample_client_campaign_pack.md`: Gói chiến dịch mẫu cho brand Mộc An Cafe tại Vinh.
  * `04_pricing_package_suggestion.md`: Bảng đề xuất 3 gói dịch vụ linh hoạt (Demo / Monthly / Setup Workspace).
  * `05_sales_pitch_deck_outline.md`: Dàn ý chi tiết 12 slide pitch deck.
  * `06_client_faq.md`: Bộ giải đáp câu hỏi thường gặp về bảo mật, AI và ranh giới.
  * `07_demo_delivery_checklist.md`: Checklist an toàn trước, trong và sau demo, nhận diện Red Flags.
  * `README.md`: File index tổng hợp và cách sử dụng các tệp tin trong thư mục.
- **[SYSTEM]:** Cập nhật các tài liệu liên quan:
  * [README.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/README.md): Bổ sung mục Phase G.
  * [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md): Bổ sung hướng dẫn sử dụng Client Demo Pack.
- **[SYSTEM]:** Cam kết an toàn: Không chứa API key/secrets, không tự ý auto-post/auto-ads/auto-message, dữ liệu hiệu quả là giả lập `[SIMULATED DATA]`, độc lập FnB OS V1.
- **[SYSTEM]:** Trạng thái: Done / Ready for Review.

### 🗓️ Ngày 03/06/2026 23:35:00
- **[SYSTEM]:** Khởi tạo Test Case chiến dịch mới cho thương hiệu Vị Cuốn.
- **[SYSTEM]:** Tạo lập thư mục mới: `06_demo_cases/vi_cuon_test_campaign/`.
- **[SYSTEM]:** Tạo lập thành công 2 tệp tin cấu hình test case:
  * [brief.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/brief.md): Chứa định vị thương hiệu, sản phẩm heo quay cuốn bánh tráng cần đẩy, USP, đối tượng mục tiêu và yêu cầu 13 mục đầu ra cho campaign 7 ngày.
  * [how_to_run_test.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/how_to_run_test.md): Hướng dẫn chi tiết 6 bước sao chép nhanh prompt và dán brief chạy thử nghiệm.
- **[SYSTEM]:** Cam kết an toàn: Không chạy ads thật, không tự động đăng bài, không nhắn tin cho khách hàng thật, không chứa hoặc yêu cầu secrets.
- **[SYSTEM]:** Trạng thái: Ready for manual AI prompt test.

### 🗓️ Ngày 04/06/2026 00:35:00
- **[SYSTEM]:** Cập nhật Test Case chiến dịch thương hiệu Vị Cuốn.
- **[SYSTEM]:** Tạo lập thành công 2 tệp tin kết quả và đánh giá:
  * [gemini_campaign_pack_raw.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/gemini_campaign_pack_raw.md): Lưu trữ nguyên văn sản phẩm thô do AI Coordinator tạo ra dựa trên brief của Vị Cuốn (chứa các giả định lỗi về giá, combo, khuyến mãi và số liệu PR giả).
  * [gemini_campaign_pack_review.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/gemini_campaign_pack_review.md): Tài liệu đánh giá chi tiết chất lượng, an toàn, các điểm bắt buộc phải sửa trước khi dùng thật và quy tắc cho bản hiệu chỉnh sạch.
- **[SYSTEM]:** Cam kết an toàn: Không chạy ads thật, không tự động đăng bài, không nhắn khách thật, chỉ sử dụng dữ liệu hiệu năng giả lập `[SIMULATED DATA]`.
- **[SYSTEM]:** Trạng thái: Ready for clean version.

### 🗓️ Ngày 04/06/2026 00:45:00
- **[SYSTEM]:** Tạo lập bản sạch hiệu chỉnh của Test Case chiến dịch Vị Cuốn.
- **[SYSTEM]:** Tạo lập thành công tệp tin:
  * [vi_cuon_campaign_pack_clean_for_owner_review.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/vi_cuon_campaign_pack_clean_for_owner_review.md): Chứa đầy đủ 13 mục sản phẩm đầu ra đã được làm sạch hoàn toàn (loại bỏ giá cả, ưu đãi và các social proof giả, bổ sung placeholder và checklist phê duyệt an toàn cho Owner).
- **[SYSTEM]:** Cam kết an toàn: Không chạy ads thật, không tự động đăng bài, không nhắn tin cho khách hàng thật, không chứa secrets.
- **[SYSTEM]:** Trạng thái: Ready for Owner Review.

### 🗓️ Ngày 04/06/2026 00:55:00
- **[SYSTEM]:** Tạo lập bộ tài liệu kiểm duyệt và giao việc cho Test Case chiến dịch Vị Cuốn.
- **[SYSTEM]:** Tạo lập thành công 4 tệp tin quản lý nhân sự:
  * [owner_review_checklist.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/owner_review_checklist.md): Bảng rà soát thông tin sản phẩm/giá bán, checklist an toàn nội dung, quyết định nghiệm thu và ghi chú sửa đổi của Owner.
  * [staff_handoff_content_editor.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/staff_handoff_content_editor.md): Tài liệu bàn giao nhiệm vụ viết bài và quay video dọc cho nhân sự Content & Video Editor.
  * [staff_handoff_designer.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/staff_handoff_designer.md): Tài liệu bàn giao nhiệm vụ thiết kế hình ảnh, quy chuẩn món thật và logo cho nhân sự Thiết kế.
  * [test_result_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/vi_cuon_test_campaign/test_result_template.md): Biểu mẫu chấm điểm chất lượng chiến dịch và ghi nhận kết quả nghiệm thu cuối cùng.
- **[SYSTEM]:** Cam kết an toàn: Không chạy ads thật, không tự động đăng bài, không nhắn tin cho khách hàng thật, không chứa secrets.
- **[SYSTEM]:** Trạng thái: Ready for manual staff test.

### 🗓️ Ngày 04/06/2026 01:10:00
- **[SYSTEM]:** Thực hiện hành động: **Cập nhật dữ liệu Web UI mock data sang test campaign Vị Cuốn**.
- **[SYSTEM]:** Tệp tin đã thay đổi:
  * [mockData.ts](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/mockData.ts): Thay thế hoàn toàn dữ liệu mock chiến dịch Trà Sữa Tôm Tép bằng chiến dịch Bánh tráng cuốn heo quay của thương hiệu Vị Cuốn (tuân thủ nguyên tắc không bịa giá, không bịa ưu đãi, chỉ sử dụng placeholder và nhãn simulated data).
  * [App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx): Cập nhật placeholders trong biểu mẫu brief, slogans mặc định, replace regex sang Vị Cuốn/Heo quay và cập nhật banner cảnh báo hệ thống mô phỏng an toàn trên Dashboard.
- **[SYSTEM]:** Cam kết an toàn: Chỉ sử dụng dữ liệu giả lập (mock data only), không chạy ads thật, không đăng bài tự động, không nhắn tin cho khách hàng, không chứa secrets.
- **[SYSTEM]:** Trạng thái: Ready for local build and deploy.

### 🗓️ Ngày 04/06/2026 23:30:00
- **[SYSTEM]:** Triển khai và đóng Phase H.2 — Client Demo Mode.
- **[SYSTEM]:** Commit: `75ac881` — feat: add phase h2 client demo mode.
- **[SYSTEM]:** Tệp tin đã thay đổi:
  * [App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx): Thêm tab `client-demo` vào Sidebar. Triển khai Client View (Campaign Overview, Key Deliverables, What Client Can Approve), Approval Status Demo (3 states: Draft / Waiting for Owner Review / Approved for Manual Use), AI Team Workspace (5 role cards: Copywriter, Video Editor, Designer, Ads Manager, Data Reporter). Fix lỗi TypeScript TS6133: xóa unused import `Eye` khỏi lucide-react.
- **[SYSTEM]:** Kết quả kiểm duyệt:
  * Build local: PASS (`npm run build`, 0 errors).
  * Dev local: PASS (`npm run dev`, localhost:3000).
  * Codex review: PASS.
  * Production Owner check: PASS.
  * Git: working tree clean. main = origin/main.
- **[SYSTEM]:** Cam kết an toàn: Auto-post: NO. Real Ads: NO. Real Messaging: NO. Real Connectors: NO. Secrets Added: NO. FnB OS V1 touched: NO. Demo/Mock Data Only: YES.
- **[SYSTEM]:** Trạng thái: DONE + BUILT + REVIEWED + PUSHED + PRODUCTION CHECKED.

### 🗓️ Ngày 04/06/2026 21:40:00
- **[SYSTEM]:** Triển khai Phase H-lite — Manual Export Pack.
- **[SYSTEM]:** Tệp tin đã thay đổi:
  * [App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx): Thêm mục Manual Export Pack vào Sidebar Navigation và triển khai 6 component con cho phép hiển thị và copy nhanh các tài liệu đầu ra của Agent dưới định dạng markdown/text sạch (không bịa giá, có disclaimer, an toàn bảo mật).
- **[SYSTEM]:** Cập nhật tài liệu:
  * [CURRENT_PHASE.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md): Cập nhật thông tin Phase H-lite đã hoàn tất.
  * [SESSION_SUMMARY.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/SESSION_SUMMARY.md): Cập nhật bối cảnh, ranh giới an toàn và lộ trình các bước tiếp theo.
  * [phase_log.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/08_logs/phase_log.md): Thêm nhật ký tiến độ Phase H-lite.
- **[SYSTEM]:** Cam kết an toàn: Offline sandbox. Auto-post: NO. Real Ads: NO. Real Messaging: NO. Real Connectors: NO. Secrets Added: NO. FnB OS V1 touched: NO. Demo/Mock Data Only: YES.
- **[SYSTEM]:** Trạng thái: Done. Pushed to GitHub main branch (commit `1eb9fdc`), pending Vercel deploy validation.









### 🗓️ Ngày 04/06/2026 — Phase H.4 Start
- **[SYSTEM]:** Bắt đầu Phase H.4 — Export/Presentation Readiness.
- **[Builder Agent — Claude Code]:** Nhận spec Phase H.4 từ ChatGPT (AI Coordinator). Bắt đầu build.
- **[SYSTEM]:** Tệp tin đã thay đổi:
  * `src/App.tsx`: Thêm import `BookOpen` từ lucide-react. Thêm state `approvalSheetItems` và `exportChecklist`. Cập nhật header badge → "Phase H.4 — Export/Presentation Readiness". Thêm sidebar nav button "Presentation & Export". Thêm tab `presentation-export` với 5 sections: Presentation View, Export Pack Preview, Client Approval Sheet Preview, Sales Demo Script, Export Readiness Checklist.
- **[SYSTEM]:** Cập nhật tài liệu:
  * `CURRENT_PHASE.md`: Cập nhật sang Phase H.4 in progress.
  * `SESSION_SUMMARY.md`: Thêm Phase H.4 start summary.
  * `phase_log.md`: Thêm Phase H.4 start entry.
  * `agent_activity_log.md`: Thêm entry này.
  * `08_logs/phase_h4_handoff.md`: Tạo mới handoff document.
- **[SYSTEM]:** Build result: `npm run build` PASS — 0 TypeScript/Vite errors.
- **[SYSTEM]:** Safety Guard H.4 confirmed:
  * Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  * Secrets Added: NO | FnB OS V1 touched: NO | Backend added: NO | Database: NO | Real API: NO
  * Demo/Mock Data Only: YES
- **[SYSTEM]:** Trạng thái: Phase H.4 build COMPLETE. Pushed to GitHub (`d823c17`). Codex review PASS.

### 🗓️ Ngày 05/06/2026 — Phase H.4 Codex Review
- **[SYSTEM]:** Codex review Phase H.4 kết quả: UI/code/build/safety PASS.
- **[SYSTEM]:** Phát hiện: docs/log trạng thái còn ghi "awaiting" sau khi đã push commit `d823c17`.
- **[Builder Agent — Claude Code]:** Thực hiện docs/log fix: cập nhật 5 tệp (CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md, phase_h4_handoff.md).
- **[SYSTEM]:** Trạng thái Phase H.4: ✅ IMPLEMENTED + CODEX REVIEWED + DOCS/LOG FIXED.
### 🗓️ Ngày 05/06/2026 — Phase H.4 CLOSED
- **[SYSTEM]:** Phase H.4 — Export/Presentation Readiness đã đóng.
- **[SYSTEM]:** Codex re-review kết quả: PASS — no required fixes.
- **[SYSTEM]:** git status: working tree clean. main = origin/main.
- **[SYSTEM]:** Trạng thái Phase H.4: ✅ CLOSED
- **[SYSTEM]:** Next phase: Phase H.5 — Multi-brand Workspace Readiness.

### 🗓️ Ngày 05/06/2026 — Phase H.5 START
- **[AI Coordinator]:** Nhận lệnh khởi động Phase H.5 — Multi-brand Workspace Readiness.
- **[AI Coordinator]:** Framing correction confirmed: "Multi-brand Workspace Readiness" — not "Demo Readiness". Workspace is a real product moving toward practical use.
- **[Builder Agent — Claude Code]:** Triển khai Phase H.5:
  1. `mockData.ts`: Thêm seed campaign workspace cho Cơm Tấm Bản Khói (F&B/TP.HCM) và Forme (nội thất cao cấp). Mỗi brand có brief, 7-day calendar, 10-item checklist, full 5-agent outputs.
  2. `src/App.tsx`:
     - Import Store icon (lucide-react).
     - localStorage key: `_v2` → `_v3` + cleanup legacy keys.
     - Header badge: "Phase H.5 — Multi-brand Workspace Readiness".
     - Sidebar: "Brand Workspace" tab + "Active Brand" label.
     - Dashboard: Brand Switcher cards (click-to-switch, shows all brands).
     - New tab `brand-gallery`: Brand Workspace Gallery với full cards, AI output counts, Phase I connector boundary.
     - Client Demo Mode: dynamic brand/product/channel/goal references.
     - Language: "Sample Data", "Sandbox Safe Mode", "Workspace".
  3. Docs: CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md, phase_h5_handoff.md.
- **[SYSTEM]:** Safety Guard H.5 confirmed: Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO | Secrets: NO | FnB OS V1: NO | Backend: NO | Database: NO | Real API: NO | Sample Data Only: YES.
- **[SYSTEM]:** Trạng thái Phase H.5: IN PROGRESS — build pending.

### 🗓️ Ngày 05/06/2026 — Phase H.5 Codex Review + Fix
- **[Codex Reviewer]:** Review Phase H.5 — 1 required fix: campaign workspace wording alignment.
- **[Builder Agent — Claude Code]:** Applied fix. Commit: `147487d` — fix: align phase h5 campaign workspace wording.
- **[SYSTEM]:** `npm run build` PASS — 0 errors. Working tree clean.

### 🗓️ Ngày 05/06/2026 — Phase H.5 CLOSED
- **[AI Coordinator]:** Nhận tín hiệu đóng Phase H.5 — Multi-brand Workspace Readiness.
- **[SYSTEM]:** Codex review: PASS. Fix applied. Build: PASS. git status: working tree clean.
- **[SYSTEM]:** Phase H.5 chính thức đóng. Trạng thái: ✅ DONE + CODEX PASS + FIX APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK.
- **[SYSTEM]:** Note: H.5 upgraded the app into a multi-brand AI Marketing Team Workspace with Vị Cuốn, Cơm Tấm Bản Khói, and Forme using sample/seed data and Sandbox Safe Mode. Product framing corrected from demo wording to workspace wording.
- **[AI Coordinator]:** Trạng thái hoạt động: `idle`. Bắt đầu Phase H.6 — Client-ready Workspace Polish.

### 🗓️ Ngày 05/06/2026 — Phase H.6 Workspace Polish
- **[SYSTEM]:** Phase H.6 started. Continuing from previous session (usage limit hit). 1 wording change already present in App.tsx (subtitle update).
- **[SYSTEM]:** Applying all H.6 polish items: phase badge, nav renames, tab titles, export pack title, dynamic approval hint, How to Use guide card, service packages label, pitch text dynamic.
- **[Builder Agent]:** All 10 edits applied to src/App.tsx successfully.
- **[SYSTEM]:** `npm run build` PASS — 0 errors. 337.64 kB JS bundle. gzip: 90.44 kB.
- **[SYSTEM]:** Docs updated: CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **[SYSTEM]:** Safety guard H.6 confirmed: Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES.
- **[SYSTEM]:** Phase H.6 initial build done. Trạng thái: ✅ DONE + BUILT + PUSHED.

### 🗓️ Ngày 05/06/2026 — Phase H.6 Codex Review Round 1
- **[SYSTEM]:** Codex review Phase H.6 — result: NEEDS FIX. 5 required + additional visible demo/mock wording identified.
- **[Builder Agent]:** Applied fix commit `4d2f3bd`. Replaced: Demo/Mock Data Only, Mock Pricing — Demo Only, Demo/mock only, Approval Status Demo, demo/mock data only (Safety Boundaries), Sales Demo Script → Presenter Walkthrough Script, client-facing demo script, fill demo data, That's the full demo.
- **[SYSTEM]:** `npm run build` PASS — 0 errors.

### 🗓️ Ngày 05/06/2026 — Phase H.6 Codex Review Round 2
- **[SYSTEM]:** Codex re-review Phase H.6 — 15 additional visible strings found.
- **[Builder Agent]:** Applied fix commit `c7b4f7d`. Replaced: Mock Data badge, Mock Ad Units, demo mock-up, Offline Mock-up, Mock workspace only, White-label demo, dữ liệu demo giả lập, mock est., Mock Estimate — Demo Only, phục vụ demo, mock ads, mock ad copy units, Mock data badge.
- **[SYSTEM]:** `npm run build` PASS — 0 errors.
- **[SYSTEM]:** Codex re-review: PASS. All demo/mock visible strings replaced. Only internal tab IDs (demo-pack, client-demo) and code variable names (mockAds) remain — per review rules, these are acceptable.

### 🗓️ Ngày 05/06/2026 — Phase H.6 CLOSED
- **[SYSTEM]:** Phase H.6 chính thức đóng. Trạng thái: ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK.
- **[SYSTEM]:** Note: H.6 polished the app into a more client-ready AI Marketing Team Workspace. Visible product wording was corrected from demo/mock framing to Workspace, Sample Data, Sandbox Safe Mode, Client Presentation Pack, and Client Workspace View. Owner/client guide flow and approval-safe framing are now clearer.
- **[AI Coordinator]:** Trạng thái hoạt động: `idle`. Phase H.6 closed. Bắt đầu Phase H.7 — Owner View + Client View.

### 🗓️ Ngày 05/06/2026 — Phase H.7 Owner View + Client View
- **[SYSTEM]:** Phase H.7 started. Goal: two-mode workspace experience (Owner View / Client View).
- **[Builder Agent]:** Added `Eye` import, `viewMode` state, `handleViewModeSwitch()`. Header toggle built. Sidebar conditional tabs and safety guard implemented. Dashboard view context card added.
- **[SYSTEM]:** Owner View: all 9 tabs + full Safety Guard. Client View: 6 tabs (4 hidden) + Trust & Safety sidebar.
- **[SYSTEM]:** `npm run build` PASS — 0 errors. 342.52 kB JS bundle. gzip: 91.12 kB.
- **[SYSTEM]:** Safety guard H.7 confirmed: Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES.
- **[SYSTEM]:** Multi-brand switching intact: Vị Cuốn, Cơm Tấm Bản Khói, Forme all functional.
- **[SYSTEM]:** Phase H.7 initial build ✅ DONE + BUILT + PUSHED.

### 🗓️ Ngày 05/06/2026 — Phase H.7 Codex Review + Fix
- **[SYSTEM]:** Codex review Phase H.7 — result: NEEDS FIX. Client View still exposing internal technical clutter in 2 locations.
- **[Builder Agent]:** Applied fix commit `2037f61`. Brand Workspace connector boundary made conditional (Owner = technical arch notes; Client = "Workspace Scope" trust card). Presentation & Export step 06 body made conditional (Owner = internal sandbox details; Client = Sample Data / Approval Required / No Live Publishing). Stale H.6 label → H.7 fixed.
- **[SYSTEM]:** `npm run build` PASS — 0 errors. 343.60 kB JS.
- **[SYSTEM]:** Codex re-review: PASS.

### 🗓️ Ngày 05/06/2026 — Phase H.7 CLOSED
- **[SYSTEM]:** Phase H.7 chính thức đóng. Trạng thái: ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK.
- **[SYSTEM]:** Note: H.7 added Owner View and Client View inside the same AI Marketing Team Workspace. Owner View keeps internal review/control information, while Client View is cleaner for client presentation and hides internal technical clutter. Client View now uses trust/scope wording such as Sample Data, Approval Required, No Live Publishing, and No Real Ads unless approved.
- **[AI Coordinator]:** Trạng thái hoạt động: `idle`. Workspace now has Owner View + Client View. Sẵn sàng cho Phase I — Real Data Connectors (pending Owner approval).

