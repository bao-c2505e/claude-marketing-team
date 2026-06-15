# SESSION SUMMARY — Tóm Tắt Phiên Làm Việc

Tài liệu này tóm tắt bối cảnh, ranh giới an toàn hiện tại của dự án và các bước tiếp theo cần triển khai.

## 📝 Bối cảnh dự án (Project Context)
Chúng ta đang xây dựng **The Core Agency — Real Operations MVP**. Đây là hệ thống quản lý marketing agency thực sự với đầy đủ backend, database, auth, approval workflow, và automation integration. Public brand: **The Core Agency**. Repo kỹ thuật: claude-marketing-team (giữ nguyên).

**Kiến trúc chốt:**
- Core (this repo) = quản lý + phê duyệt + source of truth DB
- n8n = automation backbone (không phải database)
- Modules = xử lý chuyên môn
- Webhook = modules → Core callback
- UI = chỉ đọc từ Core DB

## 🔒 Ranh giới an toàn cốt lõi (Safety Boundaries)
- **Không auto-post**
- **Không auto-ads spending**
- **Không auto-message khách thật**
- **Không hardcode secrets** — chỉ dùng .env.example
- **Generated ≠ Approved ≠ Published** — approval gate bắt buộc
- **Không làm vỡ production** (Vercel deploy vẫn đang live)

---

## ✅ V2-UI-T1 — Manual E2E + UI Bug Triage ✅ DONE / PASS (2026-06-15)

> **V2-UI-T1 ✅ DONE / PASS — small safe fixes only.** Owner paused feedback
> implementation and directed Manual E2E + UI bug triage for two reported
> issues.
>
> **Checkpoint disambiguation:** this is **V2-UI-T1**, a *separate UI / manual
> smoke-test triage checkpoint* — it is **not** V2-E3. **V2-E3 = PC2 Adapter
> Skeleton, which remains 🔴 NOT STARTED / Owner-gated** (checkpoint O1).
> V2-UI-T1 being DONE/PASS does **not** start or complete any V2-E3 PC2
> adapter-skeleton work. **Feedback implementation (Checkpoint F) also remains
> 🔴 NOT STARTED / Owner-gated.**

- **Issue 2 — Create Brand "no visible response":** root cause was a **UX gap,
  not a broken handler**. In local mode the flow is correct (`BrandsTab.handleCreate`
  → `App.handleBrandCreate` → `LocalStorageBrandRepository.create` → state prepend
  → card renders); but the success path closed the form silently and the new card
  could land below the fold on mobile. **Fix:** added a visible, auto-dismissing
  success banner (`✓ Brand "…" created.`) in `BrandsTab.tsx`. Documented a latent
  UUID-gating gap (brands/clients lack the per-operation Supabase-vs-local fallback
  that assets/approvals have) as a recommended follow-up — **not** fixed (out of
  small-safe scope; moot with Supabase off).
- **Issue 1 — mobile cluttered/"rối":** root cause = `src/index.css` had **no
  `@media` queries** and the main layout grid was a fixed inline `260px 1fr` that
  never collapses. **Fix (desktop unchanged):** added `app-main-grid`/`app-sidebar`
  classes (App.tsx) + a responsive CSS block — ≤768px collapses the sidebar grid to
  one column, reduces container padding, wraps the header, and a new `.form-grid-2`
  helper stacks 2-column forms; ≤480px tighter padding + heading wrap. No redesign,
  no brand-identity/color/font change.
- **Manual E2E smoke (fictional data):** client → brand → campaign → brief
  create/read all follow the same correct prepend pattern; generated/pending
  approval stays safe; no callback-driven approval mutation; localStorage UUID
  gating unchanged (45 tests green). Verified via build + dev-server run (HTTP 200)
  + code reading.
- **Safety:** no Supabase/RLS/auth/migration changes; no SQL; no secrets; **no
  connector activation; no real posting/ads/messaging/customer contact**; no feedback
  table/RLS/UI; approval semantics unchanged; **PC2 callbacks remain metadata/log/echo
  only; no callback-driven approval mutation; approval state remains Core UI-authoritative.**
  Diff = `BrandsTab.tsx` + `App.tsx` + `index.css` + triage note
  `08_logs/v2_ui_t1_ui_bug_triage.md` + logs.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.

---

## 🟡 V2-D2 — Checkpoint E — Feedback Implementation Plan 🟡 PLAN ONLY (2026-06-15)

> **Checkpoint E 🟡 PLAN ONLY — NOT implemented.** Owner approved starting
> Checkpoint E as docs/spec-only implementation **planning**. Feedback
> implementation 🔴 **NOT STARTED**; **Checkpoint F (migration draft)
> 🔴 NOT STARTED / Owner-gated** (build checkpoints G+ also need a VERIFIED
> Checkpoint B — currently BLOCKED).

- **Deliverables (mới):**
  - `03_core/specs/v2_d2_feedback_implementation_plan.md` — Purpose / Scope /
    Non-goals / accepted-policy summary / proposed data model (separate
    `client_feedback` table: required fields, tenant/scope, parent refs, actor
    identity, feedback_type/feedback_status, immutable audit, created_at/
    updated_at) / suggested RLS design (scoped reads only; **client approver
    INSERT only in assigned tenant**; **viewer read-only — excluded from every
    write predicate**; inactive/expired denied; read/write role separation;
    parent hierarchy validation; no broad OR-scope bypass; no callback
    impersonation) / suggested repository-API (interfaces, safe create/list,
    **no client update/delete**, UUID-gating) / suggested UI (feedback panel,
    "Client feedback" label, approval controls owner/internal-only & separated,
    viewer read-only) / audit-logging / migration outline (future-only, NOT
    executable, staging-first) / test plan / rollout / risks R1–R8 / open
    questions / recommended next checkpoint.
  - `03_core/specs/v2_d2_feedback_future_checkpoints.md` — Checkpoints
    F (migration draft) / G (staging RLS verify) / H (repository-API) /
    I (UI) / J (manual E2E + evidence); each with scope / allowed changes /
    hard boundaries / validation / Codex review expectations; all 🔴 NOT
    STARTED / Owner-gated.
- **Invariants preserved (KHÔNG nới lỏng):** client/viewer feedback KHÔNG mutate
  Core `approval_status`; **client viewer remains strictly read-only**; client
  approver may submit feedback/request revision, approved-like = metadata only
  cần Core owner/internal confirmation; PC2/module callbacks = metadata/log/echo
  only (non-authoritative); KHÔNG feedback/callback-driven posting/ads/messaging/
  customer contact.
- **No implementation:** không code/migrations/RLS/SQL/tests/secrets/connectors;
  không add executable SQL migration; không kết nối production/staging. Diff =
  docs/specs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).

---

## ✅ V2-D2 — Checkpoint D — Owner Decision ✅ DONE (policy stage CLOSED — 2026-06-15)

> **Checkpoint D ✅ DONE — Owner decision recorded; policy-decision stage
> CLOSED.** Documentation/log/decision-record only. **Decision status:
> ✅ ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION — NOT implemented.**
> Owner approval phủ policy *direction*; KHÔNG authorize build bây giờ.

- **Owner decision (recorded):**
  - **A = YES** — client approver may submit feedback / request revision (no state mutation).
  - **B = YES, metadata only** — approved-like feedback requires Core owner/internal
    confirmation before any real approval state change (no auto-approve).
  - **C = YES** — client viewer remains **strictly read-only**: read scoped outputs only;
    cannot create feedback/comment, request revision, submit approved-like/rejected-like/
    needs_revision-like feedback, or mutate Core approval state. **No Owner-grant exception**
    in this V2-D2 policy (Codex consistency fix — any future viewer-comment capability is a
    separate, future Owner-gated policy change).
  - **D = YES** — future implementation uses a separate feedback table.
- **Invariants preserved (không nới lỏng):** client feedback KHÔNG mutate Core
  `approval_status` directly; approved-like = metadata only; rejected/needs_revision-like
  = metadata/feedback-record only; viewer read-only; PC2 callbacks = metadata/log/echo
  only (non-authoritative); KHÔNG feedback/callback-driven posting/ads/messaging/customer
  contact.
- **Updated docs (wording/decision-record only):** `03_core/specs/v2_d2_checkpoint_c_decision_record.md`
  (+§7 Checkpoint D Owner Decision, +§8 Status; header → ACCEPTED/NOT IMPLEMENTED) +
  `03_core/specs/v2_d2_client_feedback_policy.md` (status header + §11 → approved A–D;
  E/F open). KHÔNG chuyển thành implementation/migration instructions.
- **No implementation:** không code/RLS/SQL/migrations/tests/secrets/connectors; không
  kết nối production/staging. Diff = docs/specs/logs only.
- **Future implementation phase 🔴 NOT STARTED / Owner-gated** — theo sau một Checkpoint B
  *VERIFIED* (hiện BLOCKED). **Next recommended checkpoint:** future Owner-gated
  implementation phase (design + Codex-review `client_feedback` table + scoped RLS, build
  behind approved policy) — chỉ bắt đầu sau Checkpoint B VERIFIED.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).

---

## ✅ V2-D2 — Checkpoint C — Client-Feedback Policy ✅ DOCS/SPEC DONE (2026-06-15)

> **Checkpoint C ✅ DOCS/SPEC DONE — NOT implemented.** Author client-role
> feedback policy decision dưới dạng **documentation/specification only**
> (Owner-approved docs/spec scope). Checkpoint C trước đó = NOT STARTED → tạo
> mới (không duplicate). **Owner đã approve policy direction tại Checkpoint D
> (xem section trên).**

- **Deliverables (mới):**
  - `03_core/specs/v2_d2_client_feedback_policy.md` — Purpose / Scope /
    5 role definitions (owner-admin, internal-editor, client approver,
    client viewer, PC2/module callback) / permission matrix / state-transition
    policy (cái gì CAN/CANNOT đổi `approval_status`; `feedback_status` → review
    mapping) / data model (separate `client_feedback` table) / future RLS /
    future UI / audit-log / risks (R1–R9) / open owner decisions.
  - `03_core/specs/v2_d2_checkpoint_c_decision_record.md` — Decision PROPOSED/
    not implemented; rejected unsafe options; required Owner decision A/B/C/D.
- **Invariant cốt lõi:** Client feedback = **input cho human review**, KHÔNG bao
  giờ là approval / publish trigger / state transition. Chỉ authenticated
  Owner/Internal action trong Core Approvals UI mới đổi `approval_status`. PC2
  callbacks non-authoritative. Client/viewer KHÔNG mutate Core approval.
- **Recommended Owner answers:** A=yes (feedback/request-revision only),
  B=yes nhưng **metadata only**, C=yes (viewer read-only), D=yes (separate
  feedback table, future phase).
- **No implementation:** không code/RLS/SQL/migrations/tests/secrets/connectors;
  không kết nối production/staging. Diff = docs/specs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).

---

## 🟡 V2-D2 — Supabase Staging Execution — OVERALL 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION (Checkpoint A ✅ PASS / Checkpoint B 🔴 VERDICT BLOCKED — 2026-06-15)

> **Overall V2-D2: 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION — NOT fully DONE/PASS.**
> Checkpoint B (the staging-verification blocker) is 🔴 BLOCKED. Checkpoints C/D/E are
> independent docs/spec/policy/planning work that is DONE but **does not complete or replace
> staging verification**. V2-D2 must not be claimed fully DONE/PASS until B is unblocked and
> verified.
>
> **Checkpoint B2 unblock attempt (2026-06-16): 🔴 STILL BLOCKED.** Presence-only env check
> (no values printed) found all staging vars MISSING (`VITE_SUPABASE_URL`,
> `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`,
> service-role) and all `.env*` files ABSENT; no linked `supabase/` project; CLI not
> installed. No disposable staging exists → verification did **not** run (no SQL, no DB
> connection, no production, no fake pass). See staging report §13 for the evidence table +
> exact owner unblock steps.
>
> **B2 verdict routing (2026-06-16) → Route B.** Actual B2 verdict (report §13.10/§14) =
> 🔴 BLOCKED — "Codex PASS" meant the report was reviewed as *truthful*, **not** that staging
> is VERIFIED. Because B2 is BLOCKED (not VERIFIED), **Route A (V2-UI-T2 Manual Product E2E)
> was NOT started**; no UI/product implementation proceeds on a verified-staging basis.
> Report §14.1 has the exact presence-only re-run command/check for when a disposable staging
> env is provisioned. V2-E3 PC2 Adapter Skeleton, feedback implementation, and Checkpoint F
> all remain 🔴 NOT STARTED / Owner-gated.
>
> **V2-E3 start attempt (2026-06-16): GATED 🔴 — NOT started.** Owner requested starting the
> PC2 Adapter Skeleton; the prerequisite gate failed because B2 = BLOCKED (not VERIFIED) and
> the tracking does not explicitly authorize parallel V2-E3 (checkpoint O1 not logged). Per
> the explicit "if B2 BLOCKED → do not start V2-E3, stop" rule, no adapter code/tests/spec
> were created. The PC2 adapter is a Supabase-independent local builder, so the Owner may
> unblock it either by getting B2 VERIFIED, **or** by explicitly recording in tracking that
> V2-E3 may proceed in parallel (staging treated as non-blocking for the adapter) **and**
> logging checkpoint O1.

> **Checkpoint A ✅ PASS** (process/docs — Codex-reviewed honest blocked
> report). **Checkpoint B verdict 🔴 BLOCKED** — DB-level verification
> không chạy được (env re-check 2026-06-15: vẫn MISSING, `.env.local` vẫn
> absent). **Checkpoint C 🟡 DOCS/SPEC PROPOSED** (2026-06-15, see section
> above) — policy authored docs/spec only, NOT implemented.

- **Checkpoint B verdict (report §10):** Overall = **BLOCKED** (không
  VERIFIED/PARTIAL/FAILED — 0 DB-level criteria chạy; nothing failed vì
  nothing ran). Ran = preflight + documentation; Did not run = toàn bộ
  §6/§7 + §8 DB-level (0 executed). Evidence = preflight outputs + report
  audit trail (no screenshots/SQL logs — no DB session). Remains
  unverified = tất cả live DB behavior.
- **Report additions:** §10 verdict, §11 evidence closure table (16 areas
  — preflight/secrets PASS; migration/schema/RLS/hierarchy/role-sep/
  asset-collection/Group-F BLOCKED at DB; code/contract approval-safety
  invariants noted PASS but NOT a substitute), §12 safety conclusion.
- **Safety:** production Supabase NOT used; no production data; no secrets
  printed/committed; no connectors; no posting/ads/messaging; no
  callback-driven approval mutation; approval state Core UI-authoritative.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** Owner/operator provision disposable staging → PC1 drives
  M1–M10 + §6–§7 → re-issue Checkpoint B verdict.

---

### Checkpoint A (2026-06-15) — original record

> **Owner approved Checkpoint A (2026-06-15).** Execution BLOCKED: không có
> disposable Supabase staging project + env vars. Đã STOP đúng hard-boundary
> — KHÔNG chạy SQL, KHÔNG kết nối DB, KHÔNG fake verification.

- **Preflight:** branch main=origin/main, tree clean, commit `2f1b700`;
  build PASS (0 TS errors); tests 45/45; secrets clean (chỉ `.env.example`
  tracked).
- **BLOCKER (PF8):** presence check (giá trị KHÔNG in): `VITE_SUPABASE_URL`
  /`VITE_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`DATABASE_URL` đều
  MISSING; `.env.local`/`.env` absent. Agent không thể tạo Supabase project
  (cần dashboard/account của Owner/operator).
- **Deliverable:** `08_logs/v2_d2_staging_report_20260615.md` — staging
  target NOT PROVISIONED (env redacted), exact missing env vars + unblock
  steps, migration order M1–M10 (READY/NOT EXECUTED), rollback, stop
  conditions, migration/RLS checklist + cross-tenant matrix 9×7 (DEFINED/
  NOT EXECUTED), approval-callback safety (DB-level NOT EXECUTED; code/
  contract invariants unchanged).
- **Verdict:** Migration/RLS/cross-tenant = NOT EXECUTED; **Checkpoint B
  NOT READY (no fake pass).** Production Supabase NOT touched; no secrets;
  approval semantics unchanged; PC2 callbacks still non-authoritative.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** Owner/operator provision disposable staging (project + 4 users
  + `.env.local` anon URL/key) → hand back → PC1 drives M1–M10 + verification.

---

## 🏁 V2-D1.5 — Manual E2E Checklist + Demo Script (docs-only prep) — DONE (2026-06-12)

> **Status:** Documentation/checklist/demo-script prep cho manual E2E
> verification. **KHÔNG tạo Supabase staging project, KHÔNG chạy SQL,
> KHÔNG kết nối DB, KHÔNG secrets, KHÔNG live connector, KHÔNG đổi
> runtime/product/repository/Supabase/auth/RLS/tests. V2-D2 vẫn 🔴 NOT
> STARTED / Owner-gated (checkpoint A).**

- **Deliverables (new folder `CLAUDE_MARKETING_TEAM/07_runbooks/`):**
  - `v2_manual_e2e_checklist.md` — purpose/scope; preflight PF1–PF8
    (branch/build/test/no-secrets/no-connectors/Local-Data-Only badge/
    **PF8 hard gate: no SQL trừ khi checkpoint A logged**); manual
    scenario S1–S10 (client→brand→campaign→brief→generation/items→asset/
    collection→approval pending/generated→callback metadata-only→UUID
    gating); PC2 callback preview C1–C5 (`ready_for_mock_callback_preview`
    N8 echo, `completed_mock` = N11/N12 final mock KHÔNG phải approval,
    `failed_mock`/N9 error route, `needs_revision`/`rejected` = metadata
    cho human review, C5 no callback-driven mutation); evidence capture
    table; stop conditions; evidence guide (naming + result-summary/
    owner-sign-off/unresolved-issue templates).
  - `v2_demo_script.md` — 10–15 min owner demo, persona Vị Cuốn
    (fictional F&B), 10 beats có narrator lines (open→client→brand→
    campaign→brief→mock generation→approval stays pending/generated→PC2
    callback metadata-only→failure/error route→Human Approval Checklist),
    "what NOT to claim" rules.
- **PC2 status wording:** "paused at N11" → "N12 post-merge cleanup
  (integration-ready handoff)" ở 6 chỗ status-label. KHÔNG đổi PC2 callback
  contract.
- **Approval safety preserved:** PC2 callbacks non-authoritative; generated
  stays generated / pending stays pending unless authenticated Core UI
  action; `completed_mock` ≠ approval shortcut.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** Owner/tester chạy checklist §2–§4 trong Local mode + file
  evidence; V2-D2 chỉ bắt đầu sau checkpoint A.

---

## 🏁 V2-E2 (Owner naming) — Core ↔ PC2 Dry-run Integration Plan — DONE (2026-06-12)

> **Scope note:** Owner refine ladder — V2-E2 = integration PLAN;
> implementation tách thành V2-E3 (adapter skeleton, disabled by default)
> → V2-E4 (local-only ingest test) → V2-E5 (E2E với mock endpoint only)
> → V2-E6 (closure/evidence pack), mỗi phase Owner-gated (checkpoints
> O1–O5). Supersede bảng boundary V2-E1 §7.

> **Status:** V2-E2 (plan) ✅ DONE. **V2-E3 🔴 NOT STARTED — checkpoint O1
> bắt buộc trước. KHÔNG runtime n8n calls, KHÔNG outbound HTTP, KHÔNG
> secrets/env vars, KHÔNG live connectors trong V2-E2.**

**Planning/contract/test-design only — KHÔNG đổi Supabase runtime/
repository/auth/UUID gating/tenant scope/sanitizers/RLS; PC2 workflow
files chỉ đọc làm reference.**

- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md` —
  §0 inputs + constraint chốt: **Core không có HTTP listener → callback
  toàn ladder = preview JSON artifact, ingest = local dev-only manual
  import, không bao giờ live webhook**; §1 architecture 9 thành phần
  (trigger → adapter disabled-by-default → n11 router → stubs → preview
  → local ingest → Approvals gate → AutomationLog trail → failure/DLQ
  log-only); §2 adapter reqs A1–A9 (pure builder, dry_run + 4 safety
  flags hard-coded `true` — builder throws nếu khác, idempotency ledger,
  correlation IDs, scope hierarchy validation, UUID gating reuse qua
  import, blocked events reject ở type level, kill-switch default-off);
  §3 PC2 expectations (5 event types, workflows, registry, examples,
  validator, status rules, failed_mock fail-safe, partial_failure =
  Core-side classification); §4 callback safety (no approval bypass,
  failed_mock never→approval, partial = logs+partial only, approved =
  human-in-Core, published = blocked); §5 test plan T1–T10 (8 yêu cầu +
  T9 approval-bypass + T10 unknown request_id); §8 ladder V2-E3→E6 với
  hard limits + closure evidence; §9 checkpoints O1–O5 (env var / HTTP /
  n8n-from-Core / Supabase staging+V2-D-A / real connector = ngoài V2-E);
  §10 non-goals.
- **Codex REQUIRED FIX applied (2026-06-12):** T2/T3 từng để PC2 callback
  chuyển approvals/items sang `revision_requested`/`rejected` — mâu thuẫn
  safety rules (Core UI = approval authority duy nhất). Đã sửa (docs-only):
  imported PC2 callbacks **non-authoritative mọi trường hợp** — chỉ
  validate / log status / record output-error metadata / echo decision
  đã có trong Core / attach review notes; T2/T3 = "non-authoritative
  echo" (items `generated`, approval `pending`, PC2 status = metadata
  cho human review); mọi transition chỉ từ authenticated Core UI action;
  **callbacks cannot bypass or mutate Core approval decisions** — stated
  explicitly (§4 → 8 rules + reading note cho bảng V2-E1 §4).
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS.
- **Next:** Owner duyệt plan → log checkpoint O1 → V2-E3 adapter skeleton
  (builder + tests + dev panel, zero HTTP, disabled by default).

---

## 🏁 V2-E1 (Owner naming) — Core ↔ PC2 Contract Mapping Spec — DONE (2026-06-12)

> **Naming:** Owner gọi package này là V2-E (V2-E1 = mapping spec, V2-E2 =
> dry-run implementation); trong roadmap, PC2 n8n dry-run vốn là
> roadmap-V2-C còn "V2-E" là UI polish. Theo naming của Owner, giống tiền
> lệ V2-B/V2-C/V2-D.

> **Status:** V2-E1 (mapping spec) ✅ DONE. **V2-E2 (dry-run implementation)
> 🔴 NOT STARTED — KHÔNG implement runtime integration, KHÔNG gọi n8n,
> cho tới khi Owner approval được log.**

**Documentation/contract mapping only — KHÔNG runtime integration, KHÔNG
gọi n8n, KHÔNG secrets, KHÔNG live connectors, KHÔNG real ads/posting/
messaging/automation, KHÔNG đổi Supabase runtime/repository/auth/UUID
gating/tenant scope/sanitizers/RLS.**

- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md` —
  mapping spec giữa Core (PC1) và PC2 n8n/modules mock backbone (PC2 N12,
  `stabilized_mock_ready`): §1 Core→PC2 events E1–E9 (5 events routable
  tới 5 module stubs; **E7–E9 publish/ads/messaging BLOCKED**) + envelope
  `e2e_dry_run_v0.1` + extensions `core_scope` (full tenant hierarchy,
  UUID-only), `mode.dry_run`, `approval_required`, 4 safety flags
  (constant `true`), `idempotency_key`; §2 PC2→Core callback
  `unified_callback_v0.1` + correlation block (`request_id`/`run_id`/
  `workflow_id`/`module_id`/`idempotency_key`) + N9 error/retry/
  dead-letter + approval decision (**Core UI là nguồn approval duy nhất**)
  + 7 acceptance preconditions; §4 unified status table (10 statuses,
  published/planned_publish = blocked/planning-only); §5 outputs → wired
  entities (content_plan_jobs/items, content_assets/collections,
  approval_requests; Group F logs unwired → local surface); §6 validation
  V1–V9 (failed_mock never→approval, no callback bypasses approval,
  local ids stay local…); §7 boundary V2-E1→V2-E2 (Owner-gated)→real
  connectors (dedicated phase); §8 PC2 handoff checklist (validator
  re-run ALL PASS) + 3 gaps cho V2-E2; §9 non-goals.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS.
- **Next:** Owner đọc spec → nếu duyệt → V2-E2 dry-run implementation
  (local mock only, kill-switch, no secrets). V2-E2 DONE chỉ khi dry-run
  evidence filed + Owner approval logged.

---

## 🏁 V2-D1 (Owner naming) — Supabase Staging Audit & Runbook — DONE (2026-06-12)

> **Naming:** Owner gọi package này là V2-D (V2-D1 = audit/runbook, V2-D2 =
> staging execution); trong roadmap, Supabase staging hardening vốn là
> roadmap-V2-B. Theo naming của Owner, giống tiền lệ V2-B/V2-C.

> **Status:** V2-D1 (audit + runbook) ✅ DONE. **V2-D2 (staging execution)
> 🔴 NOT STARTED — runbook checkpoint A: KHÔNG tạo staging project, KHÔNG
> apply SQL cho tới khi Owner approval được log.**

**Audit/documentation only — KHÔNG live Supabase connection, KHÔNG secrets,
KHÔNG production DB writes, KHÔNG live connectors/ads/posting/messaging/
automation, KHÔNG đổi runtime/UUID gating/tenant scope/sanitizers/RLS.**

- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md`
  (11 sections): §1 audit toàn bộ Supabase surface (6 SQL/plan artifacts,
  client gate, repos, routing gates, sanitizers, env) + 8 findings chính
  (legacy-vs-wired table duality; **user_roles lockout trap** — RLS bật
  nhưng zero policies → mọi user thành viewer; roles RLS gap; 16/27 tables
  chưa RLS tới khi apply plan; client-feedback owner/manager-gated by
  design; Group F module tables unwired — PC2 at N12 post-merge cleanup;
  Calendar/Reports không wired; mixed local/UUID ids là hành vi đúng) + verdict
  "ready to plan, not yet ready to execute"; §2 staging vs local demo;
  §3 env vars + no-secrets rule; §4 V2-D2 execution checklists (migration
  order M1–M10, RLS verification gồm 18 cross-tenant tests, tenant
  hierarchy, UUID gating); §5 verification matrix 9 entities × scope ×
  roles × hierarchy × RLS × ID rules; §6 seed data plan (fictional only);
  §7 rollback/recovery (env kill-switch → instant localStorage fallback);
  §8 6 staging safety boundaries; §9 risks R1–R9; §10 Owner checkpoints
  A–D (A gate mọi execution; D production enablement NGOÀI scope);
  §11 V2-D1→V2-D2 handoff.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** Owner đọc runbook → log checkpoint A nếu duyệt → V2-D2 thực
  thi §4 + file staging report → checkpoint B staging verification. **B vẫn 🔴
  BLOCKED → overall V2-D2 vẫn 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION**
  (C/D/E docs/spec done độc lập, KHÔNG thay thế staging verification). V2-D2
  chỉ DONE khi B unblocked + verified. *(Older plan này chỉ liệt kê B+C; model
  sau mở rộng thành Checkpoints A–F.)*

---

## 🏁 V2-C (Owner naming) — Client Demo Package — DONE / PASS (2026-06-12)

> **Naming:** Owner gọi package này là "V2-C — Client Demo Package"; trong
> roadmap, client demo package vốn là V2-D (roadmap-V2-C = PC2 n8n dry-run,
> CHƯA bắt đầu). Theo naming của Owner, giống tiền lệ V2-B.

> **Closure:** **Owner đã rehearse script 5 phút (§3) với UI flow thật**
> (2026-06-12) — kết quả **"ổn" / PASS**, demo flow verified với UI hiện
> tại, **không có blocking demo issue**. Đủ cả 4 điều kiện đóng:
> (1) rehearsal executed ✅; (2) kết quả ghi tại
> `08_logs/v2c_rehearsal_20260612.md` ✅; (3) **Owner approval ghi nhận
> cho controlled internal/demo use** ✅; (4) approval logged ✅.
> *(History: từng ở PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING
> theo Codex required fix — chỉ nâng DONE sau rehearsal thật.)*
> **Standing rule:** client-facing use vẫn controlled — mọi demo tôn
> trọng 5 safety boundaries (no auto-posting / no real ads / no real
> messaging / no live connectors / approval before external use).

**Documentation/demo-material only — KHÔNG đổi product code/UI/runtime/
repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/
connectors/tests. Không live automation/real ads/posting/messaging/secrets.**

- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2C_CLIENT_DEMO_PACKAGE.md` (14
  sections): §1 pre-demo checklist (P1–P10); §2 demo data/brand order
  (Cơm Tấm Bản Khói primary → Forme → Vị Cuốn + rules); §3 5-min script;
  §4 10-min script (10 beats, ~9:15); §5 screen-by-screen flow (17 steps
  với one-liner + "don't" mỗi bước); §6 positioning talking points;
  §7 cách giải thích sandbox/local data; §8 bảng 5 safety boundaries
  (no auto-posting / no real ads / no real messaging / no live connectors /
  approval required); §9 FAQ 10 câu; §10 risks/limitations disclose trung
  thực (9 items); §11 post-demo follow-up (F1–F8); §12 next-step offer
  (2-week 1-brand pilot + fallbacks); §13 one-page sales summary
  (Problem/Solution/What/Why-safer/Who/Status/Roadmap); §14 sign-off.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** Demo package sẵn sàng cho controlled internal/demo use. Còn
  mở: roadmap-V2-B Supabase staging (cần Owner approval riêng TRƯỚC khi
  bắt đầu), V2-E polish (code-splitting/ESLint/a11y), roadmap-V2-C n8n
  dry-run + V2-F connector plan (Owner-gated). Chờ Owner chọn.

---

## 🏁 V2-A — Manual Browser E2E + Demo Script — DONE / PASS (2026-06-12)

> **Closure:** Owner đã **thực thi manual browser E2E pass** (2026-06-12),
> kết quả **PASS — không có blocking UI issue**. Đủ cả 4 điều kiện đóng:
> (1) checklist §1 executed by Owner ✅; (2) kết quả ghi tại
> `08_logs/v2a_qa_report_20260612.md` ✅; (3) demo script §2 verified
> trong run-through của Owner ✅; (4) Owner approval ghi nhận (DONE /
> PASS) ✅. Build/tests vẫn green (0 TS errors, 45/45). *(History: từng
> ở trạng thái CHECKLIST READY / E2E PENDING theo Codex required fix —
> chỉ nâng lên DONE sau khi Owner chạy pass thật.)*

**Documentation only — KHÔNG đổi product code/behavior/repository/Supabase/
auth/UUID gating/tenant scope/sanitizers/RLS/connectors/tests. Không live
automation/real ads/posting/messaging/secrets.**

- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md`:
  - **§1 — Manual Browser E2E checklist, 28 items (A1–A28):** app load/
    favicon/branding, Demo Sign In, Owner View header, Client View toggle
    (owner-only tabs ẩn), Dashboard, Clients/Brands/Campaigns, Brief Intake,
    Content Generation, Content Calendar (verify overflow fix), Approvals,
    Reports, Export Pack, Connector Registry (highest-attention safety
    item), Automation Logs, Client Portal, Asset Library, Brand Workspace,
    New Campaign Brief, AI Team Board, Campaign Outputs, Approval Checklist
    (3 locked safety items), Client Presentation Pack, Client Workspace
    View, Manual Export Pack, Presentation & Export, console/network sweep.
    Mỗi item: click steps / expected / blocker definition / visual QA /
    safety notes.
  - **§2 — Demo script 5–10 phút** (10 beats, có lời thoại + timing):
    pitch → problem → solution → workspace tour → brand/campaign flow →
    AI team output → approval safety → client presentation/export →
    why-no-auto-posting (gate-by-gate connector story) → CTA pilot 2 tuần.
  - **§3 — UI QA report template:** blockers / visual polish / wording /
    responsive / deferred + verdict.
  - **§4 — Sign-off flow:** tester → PC1 fix → Codex → Owner accept →
    unlocks V2-D + roadmap-V2-B.
- **Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS (docs-only diff).
- **Next:** V2-A PASS mở khóa **V2-D (client demo package)** và
  **roadmap-V2-B (Supabase staging — vẫn cần Owner approval riêng trước
  khi bắt đầu)**. Chờ Owner chọn work package kế tiếp.

---

## 🏁 V2-B (Owner-directed) — Premium Dark SaaS UI Polish — DONE (2026-06-11)

> **Naming:** Owner gọi task này là "V2-B — Premium Dark SaaS UI Polish";
> trong roadmap, UI polish vốn là V2-E (roadmap-V2-B = Supabase staging,
> CHƯA bắt đầu). Section này theo naming của Owner.

**Presentation-only — KHÔNG đổi behavior/data flow/repository/Supabase/UUID
gating/tenant scope/sanitizers/RLS/auth/tests.**

- **Theme:** `src/index.css` viết lại token layer — nền `#070A0F`/`#0B1120`,
  surface `#0F172A`/`#111827`/`#151F32`, border `rgba(255,255,255,0.08)`,
  **Brand Orange `#F47A1F`** (hover `#E7680B`, glow `rgba(244,122,31,0.22)`)
  thay indigo làm brand accent; semantic success/warning/error/info. Legacy
  var names giữ làm alias → toàn bộ inline styles tự ăn theme mới.
- **Color sweep 19 files:** `#818cf8`→`#fb923c`, `#6366f1`→`#f47a1f`,
  `rgba(99,102,241,*)`→`rgba(244,122,31,*)`, `rgba(129,140,248,*)`→
  `rgba(251,146,60,*)`. Category/data-viz colors giữ nguyên.
- **Polish:** Inter font; primary button orange gradient (hover/active/
  disabled/focus-visible); form focus ring orange glow; glass cards 18px +
  hover glow; tabs/scrollbar/selection orange; `.spinner`/`.skeleton`
  utilities; header title gradient trắng→cam; branded auth loading screen;
  LoginScreen glass card + orange glow + solid orange submit.
- **Naming:** visible UI = "The Core Agency"; không còn "FnB OS V1"/
  "CLAUDE_MARKETING_TEAM" trong UI (localStorage keys/internal docs giữ).
- **Build:** PASS — 0 TS errors (1575 modules). **Tests:** 45/45 PASS.
- **Còn lại (future):** code-splitting 920 kB bundle, ESLint + a11y pass,
  responsive sidebar, branded favicon, empty-state illustrations.

---

## 🏁 Ver2 Planning (Post-MVP) — Roadmap DONE (2026-06-11)

> **Naming:** Core MVP = **18/18 phases complete and CLOSED** (Phase 18 was
> the final MVP phase). This work is the **Post-MVP / Ver2 Planning
> workstream** — NOT "MVP Phase 19". Work packages are named V2-A…V2-F.

**Documentation/planning only — no product code, connectors, secrets, or
live automation.** Deliverable: `PHASE_19_VER2_ROADMAP.md` (filename keeps
its historical prefix; content is the Ver2 roadmap).

**Contents:** Ver2 scope options (with risk levels + dependencies),
recommended priority order, and a breakdown into six small work packages —
each with goal, exact deliverables, files likely touched, safety rules,
test/check requirements, Codex review focus, and an Owner approval
checkpoint:
- **V2-A** — Manual browser E2E pass (Phase 17 checklist B–G) + demo script
  verification. Zero risk; gates everything else. **← recommended first.**
- **V2-B** — Supabase staging hardening: migrations applied in order to a
  disposable staging project, RLS verification matrix (table × role × op),
  client-feedback policy decision. Owner approval required BEFORE starting.
- **V2-C** — PC2 n8n/modules callback dry-run: design doc first, backend-held
  `WEBHOOK_SHARED_SECRET`, event-insert-only receiver, kill switch.
  Owner-gated; depends on V2-B.
- **V2-D** — Client demo package: demo-day runbook + rehearsal + Vercel
  deploy verification. Parallel-safe with V2-B.
- **V2-E** — UI/brand polish: code-splitting, ESLint, accessibility. Zero
  behavior change; parallel filler.
- **V2-F** — Real connector readiness plan (**plan only**): 5-gate activation
  framework (Owner sign-off / backend secrets / dry-run / kill switch /
  audit log), per-connector one-pagers, activation order n8n → Canva →
  read-only analytics → outbound-write last.

**Standing Ver2 safety rules:** no real ads/posting/messaging/automation
anywhere; no secrets; production Supabase OFF; UUID gating/tenant
scope/sanitizers/RLS untouchable without dedicated review; FnB OS V1
untouched.

**Build:** PASS — 0 TS errors. **Tests:** 45/45 PASS. (Unchanged — docs-only
diff.)

---

## 🏁 CORE MVP CLOSED (2026-06-11)

**Closure:** The Core MVP build cycle (Phases 1–18) is formally closed.
Final closure report: `CORE_MVP_CLOSURE_REPORT.md` — covers what the MVP
includes, what is intentionally not enabled (no real ads/posting/messaging/
connectors/AI/file storage/production Supabase/secrets), safety status at
closure, build/test status (build PASS 0 TS errors, tests 45/45), known
limitations, and the recommended next roadmap.

**Closure was documentation only** — no product code, runtime behavior, or
connector state changed. Final reviewed product commit: `fd86ead` (Phase 18,
Codex PASS).

**Approved scope:** controlled internal testing / controlled client demo.
Anything beyond (live data, live connectors, real client accounts) requires
a new phase with Owner approval.

**Recommended next roadmap (closure report §6):**
1. Post-MVP / Ver2 planning (Owner + AI Coordinator — decide Ver2 scope)
2. Client demo preparation (manual E2E pass B–G, demo script rehearsal)
3. Supabase production hardening (staging first, RLS verification per role)
4. PC2 n8n/modules integration (separate workstream, registry-only until approved)
5. UI/brand polish (code-splitting, ESLint, accessibility)
6. Real connector plan with approval gates (one connector at a time, n8n first)

---

## 🏁 Phase 18 — Final MVP Polish + Production Readiness (CLOSED — 2026-06-11)

**Scope completed:** Low-risk UI label polish only — no logic, routing,
repository, sanitizer, type, or SQL changes. Removed "FnB OS V1" rows from
both safety panels (sidebar Safety Guard + Dashboard sandbox grid); header
badge "Real Operations MVP — Phase 14" → "Core MVP — Internal Demo"; new
header data-mode badge ("Local Data Only" / "Supabase Data", driven by the
existing `isSupabaseConfigured`); stale internal phase numbers removed from
user-visible labels across ApprovalsTab, ContentCalendarTab, AssetLibraryTab,
AutomationLogsTab, ConnectorRegistryTab, ReportsTab, ExportPackTab,
BriefIntakeTab. Code comments and `[Mock]`-labeled sample log bodies keep
their phase references.

**Production safety re-verified:** secrets grep clean (placeholders only);
only `.env.example` tracked; zero direct network calls in `src/` (the
Supabase SDK is the only network client, `null` without env vars); no real
ads/posting/messaging/connectors. Phase 16D/17 safeguards (UUID gates,
current+next `asset_collection_id` gating, scoped repos, sanitizers, RLS
migrations) fully intact.

**New doc:** `07_docs/MVP_READINESS_CHECKLIST.md` — readiness verdict +
evidence tables + remaining risks.

**Build:** PASS — 0 TS errors (1575 modules). **Tests:** 45/45 PASS.

**Verdict:** ✅ Core MVP READY for controlled internal testing / controlled
client demo. NOT ready for live automation, real publishing, real client
data in Supabase, or file uploads. Owner should run the manual browser pass
of the Phase 17 E2E checklist (sections B–G) before the first external demo.

---

## 🏁 Phase 17 — End-to-end Workflow Test (CLOSED — 2026-06-11)

**Scope completed:** Added `vitest` as a devDependency (`npm run test` /
`npm run test:watch`, zero extra config — runs in vitest's default `node`
environment). Extracted the inline UUID-gating predicates from `App.tsx`'s
`assetRepoFor()`/`approvalRepoFor()` verbatim into new
`src/lib/core/repoRouting.ts` (`assetScopeIsSupabaseSafe`,
`approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`) — `App.tsx` now calls these,
behavior unchanged. Added `src/lib/core/repoRouting.test.ts` (34 tests,
covering full UUID chains, every local-format id, optional-absent ids, and
the Codex Fix Round 2 current-vs-next `asset_collection_id` gating case) and
`src/lib/core/coreRepository.test.ts` (11 tests, covering
`sanitizeAssetPatch`/`sanitizeGenerationPatch`/`sanitizeBriefPatch` immutable
field stripping plus `isUuid`/`generateId`).

**Manual E2E checklist:** New
`CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md` — full MVP workflow
(Client → Brand → Campaign → Brief → Generation → Approval → Asset Library)
plus UUID-gating fallback verification in Local/Demo and Supabase-configured
modes. UI sections deferred — no browser-automation tool available this
session; the routing/sanitization logic they exercise is fully covered by the
new unit tests.

**Safety:** Supabase env OFF · no secrets · no service role key · Demo Sign
In preserved · localStorage fallback preserved · pure refactor (extraction +
tests only), no behavior change.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run
test`: 45/45 PASS. Secrets grep clean.

**Trạng thái Phase 17:** ✅ CLOSED. **Next:** TBD.

---

## 🏁 Phase 16D — Asset Library CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

**Scope completed:** Supabase CRUD repository wiring for Asset Library only (Calendar/Reports/Connector Inbox/Automation Logs untouched). Same repository pattern as Phase 16A/16B-1/16B-2/16C-1/16C-2.

**New tables (additive):** New migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16d_asset_extension.sql` creates `content_assets`/`content_asset_collections` matching the Phase 10 `AssetItem`/`LocalAssetCollection` TS types. `AssetItem` extended with nullable `brief_id`/`generation_job_id` (additive — old localStorage data normalized via `loadAssetData()`). RLS enabled with hierarchy-validated policies. Idempotent (`IF NOT EXISTS`/`DROP ... IF EXISTS`) — **not applied to any live DB**.

**Final tenant-scope contract:**
- `AssetRepository.list({ clientId, brandId, campaignId?, briefId?, generationId?, contentItemId?, assetCollectionId? })` — `clientId`+`brandId` required, deeper levels optional
- `AssetRepository.get/update/archive(params: AssetScopedParams)` — standalone fully-required-but-nullable interface (`clientId`, `brandId`, `campaignId`, `briefId`, `generationId`, `contentItemId`, `assetCollectionId`, `assetId`) — callers must state the asset's FULL scope (explicit `null` where not applicable)
- `AssetCollectionRepository.list/create({ clientId, brandId, campaignId? })`
- `assetRepoFor()` in App.tsx selects Supabase vs `LocalStorageAssetRepository` **per operation** — requires `clientId`+`brandId` as valid UUIDs, treats null/undefined optional ids as "absent" (`okOrAbsent`), validates `assetId`/`assetCollectionId`/`currentAssetCollectionId` when used — local `asset-*`/`col-*`/`collection-*`/`asset-collection-*` ids never reach Supabase

**App.tsx / AssetLibraryTab.tsx wiring:**
- `handleAssetCreate`/`handleAssetEdit`/`handleAssetArchive` route through `assetRepoFor()`; Client/Brand/Campaign fields disabled in edit mode (immutable after create); async create/edit/archive with error banner + "Saving…" state; removed now-dead `createAsset`/`updateAsset`/`createCollection` helpers from `coreData.ts`

**Safety:** Supabase env OFF · no secrets · no service role key · Demo Sign In preserved · localStorage fallback preserved · Calendar/Reports/Connector Inbox/Automation Logs unchanged · local IDs never sent to Supabase UUID columns · RLS hierarchy validates client→brand→campaign→brief→generation→content_item→asset_collection.

**Known future consideration:** real file storage/upload is not enabled yet — this phase only wires safe asset metadata CRUD.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules). Secrets grep clean.

---

## ✅ Phase 16D Codex Fix Round 1 — UUID-gate asset_collection_id + Hardened Scoped Params + RLS Collection Check (2026-06-11)

**Fix 1 (asset_collection_id UUID gating):** `assetRepoFor()` now checks `assetCollectionId` for create/update/get/archive; `handleAssetEdit` computes `nextCollectionId` and routes to localStorage if either the asset's current or target collection is a local id.

**Fix 2 (AssetScopedParams hardened):** `AssetScopedParams` is now standalone and fully-required-but-nullable (8 fields) — get/update/archive must state the asset's FULL scope. `SupabaseAssetRepository` calls `assertUuid`/`assertUuidOrNull` on every id; `get`/`update` always filter on all 5 optional-hierarchy columns.

**Fix 3 (RLS collection hierarchy):** `content_asset_hierarchy_is_valid()`/`_user_has_scope()`/`_user_can_write()` extended to a 7th param `p_asset_collection_id` — validates the referenced collection shares the asset's client/brand (+campaign if set).

**Build:** PASS — 0 TS errors. Secrets grep clean. **Commit:** `a9c6644` (fix: harden asset collection uuid routing and scope).

---

## ✅ Phase 16D Codex Fix Round 2 — Gate Current asset_collection_id on Edit (2026-06-11)

**Issue:** `handleAssetEdit()` gated only the patch's NEXT collection, not the asset's CURRENT `asset_collection_id` — a local current-collection id with a patch to `null`/UUID was incorrectly routed to Supabase.

**Fix:** `assetRepoFor()` gained `currentAssetCollectionId?: string | null`, gated via `okOrAbsent`; `handleAssetEdit()` passes both `currentAssetCollectionId` and `assetCollectionId` (next) — Supabase selected only when BOTH are null/undefined/valid UUIDs.

**Diff:** `src/App.tsx` only, 12 insertions / 3 deletions. **Build:** PASS — 0 TS errors.

**Codex result:** PASS. **Commits:** `b598844` → `a9c6644` → `ec0178b`. **Trạng thái Phase 16D:** ✅ CLOSED. **Next:** TBD.

---

## 🏁 Phase 16C-2 — Approval CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

**Scope completed:** Supabase CRUD repository wiring for Approval only (Calendar/Reports/Asset Library/Connector Inbox/Automation Logs untouched). Same repository pattern as Phase 16A/16B-1/16B-2/16C-1.

**New tables (additive):** New migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c2_approval_extension.sql` creates `content_approval_requests` (full client/brand/campaign/brief/generation/content_item scope), `content_approval_events`, `content_approval_comments` (both reference `approval_request_id` + `content_item_id`) matching the Phase 8 `ContentApprovalRequest`/`ContentApprovalEvent`/`ContentApprovalComment` TS types: 3 enums, 11 indexes, `updated_at` trigger, RLS enabled with hierarchy-validated policies. Idempotent (`IF NOT EXISTS`/`DROP ... IF EXISTS`) — **not applied to any live DB**.

**Final tenant-scope contract:**
- `ApprovalRepository.list({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required
- `ApprovalRepository.get/executeAction/addComment({ ...same, approvalId })` — all 6 IDs required
- `ApprovalRepository.create(data: ApprovalCreateInput)` — requires `contentItem` + full 5-ID scope + `actorLabel`; DB generates UUIDs for `content_approval_requests`/`events` — local `approval-*`/`item-*`/`generation-*`/`job-*` IDs never sent to Supabase
- `approvalRepoFor()` in App.tsx selects Supabase vs `LocalStorageApprovalRepository` **per operation** — Supabase only if `isSupabaseConfigured` AND every UUID id used by that operation (tenant scope + `approvalId`/`contentItemId` when applicable) is a valid UUID

**App.tsx / ApprovalsTab.tsx / ClientViewTab.tsx wiring:**
- `handleApprovalSubmit`/`handleApprovalAction`/`handleApprovalComment` route through `approvalRepoFor()`, wired into `ApprovalsTab` (submit/action/comment) and `ClientViewTab` (`onComment` — client feedback)

**Safety:** Supabase env OFF · no secrets · no service role key · Demo Sign In preserved · localStorage fallback preserved · Calendar/Reports/Asset Library/Connector Inbox/Automation Logs unchanged · local IDs never sent to Supabase UUID columns.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

---

## ✅ Phase 16C-2 Codex Fix — UUID Routing + RLS Hierarchy + Comment/Event Permissions (2026-06-11)

**Fix 1 (App.tsx UUID gating):** `approvalRepoFor()` previously validated only the 5 tenant-scope ids. Now also validates `approvalId`/`contentItemId` (when used by the operation) — any local-format id (`approval-*`/`content-item-*`/`generation-*`/`job-*`/`item-*`) routes to `LocalStorageApprovalRepository` instead of Supabase.

**Fix 2 (RLS hierarchy):** `content_approval_hierarchy_is_valid()` extended to 6 args (`+ content_item_id`) — now also validates `content_item_id` belongs to the same `client/brand/campaign/brief/generation` chain via `content_plan_items`. `content_approval_request_user_has_scope()`/`..._can_write()` extended to require a child event/comment's `content_item_id` to match its parent request's `content_item_id` — prevents events/comments referencing a different content item than their parent request. All 7 policies updated.

**Fix 3 (role permissions):** `content_approval_events_insert`/`content_approval_comments_insert` are now owner/manager-only (`content_approval_request_user_can_write`) — removed the `client`/`viewer` "commented"/comment exception. Read access unchanged (any in-scope role, including `client`/`viewer`, can still SELECT).

**Known future consideration:** `ClientViewTab`'s "Add Feedback" (`onComment`, is_internal=false) would be rejected by RLS for `client`-role users once Supabase is enabled with client roles — currently moot (Supabase env OFF, localStorage has no RLS); requires an explicit feedback-write role/policy decision in a later phase if real client feedback via Supabase is needed.

**Build:** PASS — 0 TS errors. `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS. **Commits:** `871c3d0` → `70f8b8a`. **Trạng thái Phase 16C-2:** ✅ CLOSED. **Next:** TBD.

---

## 🏁 Phase 16C-1 — Content Plan Generation CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

**Scope completed:** Supabase CRUD repository wiring for Content Plan Generation only (Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs untouched). Same repository pattern as Phase 16A/16B-1/16B-2.

**New tables (additive):** `schema_v1.sql`'s legacy `generation_jobs`/`content_items` (Phase-15-planned, campaign-only scoping, unused by the app) are left untouched. New migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c1_generation_extension.sql` creates `content_plan_jobs` + `content_plan_items` tables matching the Phase 6 `ContentPlanJob`/`ContentPlanItem` TS types: 3 enums (`content_plan_job_status`, `content_plan_item_status`, `content_plan_generation_mode`), `client_id`/`brand_id`/`campaign_id`/`brief_id` UUID FKs on both tables, `plan_length_days CHECK (IN (7,15,30))`, `requested_by TEXT` (role name, not a user UUID), 7 indexes, `updated_at` triggers via existing `set_updated_at()`, RLS enabled with tenant-scoped policies (Codex Fix 4). All idempotent (`IF NOT EXISTS` / `duplicate_object`) — **not applied to any live DB**.

**Final tenant-scope contract:**
- `GenerationRepository.list({ clientId, brandId, campaignId, briefId })` — all 4 IDs required, returns `{ jobs, items }`
- `GenerationRepository.get({ clientId, brandId, campaignId, briefId, generationId })` / `update({ ...same, generationId }, patch: GenerationUpdatePatch)` / `archive({ ...same, generationId })` — all 5 IDs required
- No method accepts `generationId` alone — never get/update/archive/list by `generationId` alone
- Supabase always adds `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)` (+ `.eq('id', generationId)` for get/update on `content_plan_jobs`); the `content_plan_items` query in `get()` now also adds the same 4-ID tenant filter on top of `.eq('generation_job_id', ...)` (Codex Fix 1). `LocalStorageGenerationRepository` mirrors the same filtering, including the items tenant filter.
- TypeScript enforces: unscoped generation calls (`list()`, `get({generationId})`, `update({generationId}, patch)`, `archive({generationId})`) are compile errors
- `create(data: GenerationCreateInput)` requires `brief` + `clientId`+`brandId`+`campaignId`+`briefId`+`planLengthDays`+`requestedBy`; calls `generateContentPlan()` for the mock plan, then DB generates UUIDs for both `content_plan_jobs` and `content_plan_items` — local `job-*`/`item-*`/`generation-*` IDs never sent to Supabase
- `archive(params)` — new (Codex Fix 2), implemented as `update(params, { status: 'archived' })` in both repos, fully scoped (no `generationId`-alone path)
- `update()`/`archive()` patches sanitized via hardened `GENERATION_IMMUTABLE_PATCH_FIELDS` + `sanitizeGenerationPatch()` — strips `id`, tenant (`client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`), audit (`created_at`/`createdAt`, `updated_at`/`updatedAt`), and ownership/audit aliases (`requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`) in both snake_case and camelCase (Codex Fix 3)

**App.tsx / ContentGenerationTab.tsx wiring:**
- On Supabase mount, generation jobs/items loaded per-brief (after campaigns + briefs load): `Promise.all(loadedCampaigns.flatMap((c, idx) => briefArrays[idx].map(b => repos.generations.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id, briefId: b.id }))))`, flattened and saved via `setGenData` + `saveGenerationData`
- New handler `handleGenerationCreate(brief, planLengthDays)` — derives `clientId`/`brandId`/`campaignId` from the brief's parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`, same pattern as `handleBriefUpdate`), calls `repos.generations.create(...)`
- `ContentGenerationTab.tsx`: new async `onGenerate` prop; `handleGenerate` rewritten from sync `setTimeout` + direct `generateContentPlan()` to `await onGenerate(brief, planLength)`, then merges `{job, items}` into state via the existing `onUpdate({ generationJobs, contentItems })` callback; new `genError` state + dismissible error banner; removed now-unused direct `generateContentPlan` import

**Safety:** Supabase env OFF · no secrets · no service role key · Demo Sign In preserved · localStorage fallback preserved · Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs unchanged · local IDs never sent to Supabase UUID columns · RLS now has tenant-scoped policies (no anon access).

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

---

## ✅ Phase 16C-1 Codex Fix — Harden Generation Tenant Scope (2026-06-11)

**Issue 1 (unscoped item read):** `get()` in both repos fetched `content_plan_items` filtered only by `generation_job_id`, missing the `client_id`/`brand_id`/`campaign_id`/`brief_id` tenant filter already applied to the parent job.

**Fix 1:** both `get()` implementations now also filter `content_plan_items` by `client_id`/`brand_id`/`campaign_id`/`brief_id` (Supabase: 4 extra `.eq()`; localStorage: 4 extra predicate checks).

**Issue 2 (no scoped `archive()`):** `GenerationRepository` had no `archive()`, unlike `CampaignRepository.archive(params: CampaignScopedParams)`.

**Fix 2:** added `archive(params: GenerationScopedParams): Promise<void>` requiring all 5 IDs; both repos implement it as `update(params, { status: 'archived' })` — same pattern as `LocalStorageCampaignRepository.archive`. Cannot be called by `generationId` alone.

**Issue 3 (sanitizer gaps):** `GENERATION_IMMUTABLE_PATCH_FIELDS` only covered snake_case `id`/`client_id`/`brand_id`/`campaign_id`/`brief_id`/`created_at`/`updated_at`/`requested_by` — camelCase aliases and other ownership/audit fields (`submittedBy`, `archivedAt`, `ownerId`, `tenantId`, `organizationId`, `userId`, etc.) could pass through `sanitizeGenerationPatch()` unstripped.

**Fix 3:** expanded `GENERATION_IMMUTABLE_PATCH_FIELDS` to cover snake_case + camelCase for all of: `id`, `client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`, `created_at`/`createdAt`, `updated_at`/`updatedAt`, `requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`. `sanitizeGenerationPatch()` now accepts `Partial<ContentPlanJob> & Record<string, unknown>` so it can strip these from a dynamically-built patch at runtime.

**Issue 4 (RLS enabled, no policies):** the migration enabled RLS on both new tables but added no policies (service_role-only).

**Fix 4:** added `content_plan_user_has_scope(p_client_id, p_brand_id, p_campaign_id)` — `SECURITY DEFINER` SQL function (fixed `search_path = public`) checking the existing `user_roles(user_id, resource_type, resource_id)` table for `auth.uid()` having a `'global'`, or `'client'`/`'brand'`/`'campaign'`-scoped role matching the row's tenant IDs. Added tenant-scoped `SELECT`/`INSERT`/`UPDATE` policies for `content_plan_jobs` and `content_plan_items`, each in `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`. `auth.uid()` is `NULL` for anon, and `user_roles.user_id` is `NOT NULL`, so anon never matches — no public access. Both tables are brand-new — no backfill needed.

**Tenant scope:** unchanged otherwise — `list`/`get`/`update`/`archive` still require `clientId`+`brandId`+`campaignId`+`briefId`(+`generationId`); local IDs still never sent to Supabase.

**Build:** PASS — 0 TS errors. `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS after Round 2 RLS hardening (see closure section below). **Trạng thái Phase 16C-1:** ✅ CLOSED. **Next:** TBD.

---

## ✅ Phase 16C-1 Codex Fix Round 2 — RLS Role Permissions + Brief Hierarchy (2026-06-11)

**Fix 1 (role permissions + active/unexpired):** `content_plan_user_has_scope()` now requires `is_active = TRUE` and `(expires_at IS NULL OR expires_at > NOW())`, and takes `p_roles role_name[]`. New `content_plan_user_can_write()` narrows this to `['owner','manager']`. Policies split: SELECT = any active/unexpired/in-scope role; INSERT/UPDATE (incl. transitions to `archived`) = owner/manager only — `client`/`viewer` are read-only.

**Fix 2 (brief_id + hierarchy validation):** new `content_plan_hierarchy_is_valid(client_id, brand_id, campaign_id, brief_id)` validates all 4 ids form one real `clients → brands → campaigns → campaign_briefs` chain; AND-ed into `content_plan_user_has_scope()`, removing the prior OR-based mismatched-scope risk. `brief_id` now appears in every helper signature/call and every policy (SELECT / INSERT WITH CHECK / UPDATE USING / UPDATE WITH CHECK) for both `content_plan_jobs` and `content_plan_items`.

**Safety:** additive, idempotent (`DROP POLICY/FUNCTION IF EXISTS` before `CREATE OR REPLACE`), no anon/broad access, no secrets/service role key, Supabase env OFF, Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs unchanged.

**Build:** PASS — 0 TS errors. `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS. **Commits:** `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy).

---

## 🏁 Phase 16C-1 — CLOSED (Codex PASS — 2026-06-11)

- Generation CRUD wired to Supabase with localStorage fallback.
- Full scope required: clientId + brandId + campaignId + briefId.
- No get/update/archive by generationId alone.
- Local generation/job/item IDs are not sent into Supabase UUID columns.
- Update patch sanitizes tenant/audit/ownership fields.
- Archive is fully scoped.
- RLS policies enforce active/unexpired assignments, role-specific read/write permissions, and full client/brand/campaign/brief hierarchy.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.

**Commits:** `77987ab` → `db0819b` → `c81b069` → `0876162`. **Trạng thái Phase 16C-1:** ✅ CLOSED. **Next:** TBD.

---

## 🏁 Phase 16B-2 — Campaign Briefs CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

**Scope completed:** Supabase CRUD repository wiring for Campaign Briefs only (Generation/Calendar/Approval/Reports/Asset Library untouched). Same repository pattern as Phase 16A/16B-1.

**Schema gap fixed first:** `schema_v1.sql`'s `campaign_briefs` table was missing `client_id`, `brand_id`, `status`, and 13 fields that Phase 5 added to the `CampaignBrief` TS type/UI but never migrated to the DB. New additive migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16b2_brief_extension.sql` adds a `brief_status` enum, `client_id`/`brand_id`/`status` columns, and the 13 brief-detail columns (`brief_title`, `campaign_goal`, `product_focus`, `offer`, `tone_of_voice`, `content_pillars`, `must_include`, `must_avoid`, `competitors`, `reference_links`, `budget_note`, `timeline_note`, `approval_requirements`) plus 2 indexes. All `IF NOT EXISTS` / idempotent — **not applied to any live DB**.

**Final tenant-scope contract:**
- `BriefRepository.list({ clientId, brandId, campaignId })` — all 3 IDs required
- `BriefRepository.get({ clientId, brandId, campaignId, briefId })` / `update({ clientId, brandId, campaignId, briefId }, patch: BriefUpdatePatch)` — all 4 IDs required
- Supabase always adds `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId)` (+ `.eq('id', briefId)` for get/update); `LocalStorageBriefRepository` mirrors the same filtering
- TypeScript enforces: unscoped brief calls (`list()`, `get({briefId})`, `update({briefId}, patch)`) are compile errors
- `create(data)` requires `client_id` + `brand_id` + `campaign_id` (+ denormalised `brand_name`/`industry`); DB generates UUID — local `brief-*` IDs never sent to Supabase
- No `archive()` method — `BriefIntakeTab.tsx` has no Archive button; `status: 'archived'` remains reachable via `update()`

**App.tsx / BriefIntakeTab.tsx wiring:**
- On Supabase mount, briefs loaded per-campaign (after campaigns load): `Promise.all(loadedCampaigns.map(c => repos.briefs.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id })))`
- New handlers: `handleBriefCreate(data)`, `handleBriefUpdate(brief, patch)` — `handleBriefUpdate` derives scope IDs from the parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`); both update `coreData.briefs` + `saveCoreData`
- Removed now-unused `handleCoreUpdate` (Briefs was its last consumer)
- `BriefIntakeTab.tsx`: `onBriefCreate`/`onBriefUpdate` async props, `formLoading`/`actionError` states, removed `generateId`/`onUpdate(CoreDataStore)`; `handleStatusChange` now takes the full `brief` object; create-mode validation now requires client + brand selection

**Safety:** Supabase env OFF · no secrets · no service role key · Demo Sign In preserved · localStorage fallback preserved · Generation/Calendar/Approval/Reports/Asset Library unchanged.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

---

## ✅ Phase 16B-2 Codex Fix 1+2 — Migration Backfill + Brief Update Sanitizer (2026-06-10)

**Issue 1 (migration):** the original migration added `client_id`/`brand_id` as `NOT NULL` directly, with no backfill — any pre-existing `campaign_briefs` rows would fail the constraint and/or silently disappear from the new tenant-scoped `list`/`get`/`update` queries.

**Fix 1:** migration now (1) adds `client_id`/`brand_id` nullable, (2) backfills both from `campaigns` via `UPDATE campaign_briefs b SET client_id = c.client_id, brand_id = c.brand_id FROM campaigns c WHERE b.campaign_id = c.id AND (b.client_id IS NULL OR b.brand_id IS NULL)`, then (3) a `DO $$` block enforces `NOT NULL` on both columns only if zero rows remain unbackfilled — if a brief's `campaign_id` has no matching campaign, it `RAISE NOTICE`s the affected brief IDs, leaves those columns nullable, and skips `NOT NULL` rather than guessing/corrupting a tenant assignment. Idempotent.

**Issue 2 (sanitization):** `LocalStorageBriefRepository.update` spread `patch` directly onto the stored row (`{ ...b, ...patch, updated_at: now }`), so a patch could reassign `client_id`/`brand_id`/`campaign_id`/`id`/`created_at`/`submitted_by`/`submitted_at`. `SupabaseBriefRepository.update` only stripped `id`/`created_at`/`client_id`/`brand_id`/`campaign_id` — `submitted_by`/`submitted_at`/`updated_at` were still patchable.

**Fix 2:** new `BriefUpdatePatch` type (`Partial<Omit<CampaignBrief, 'id'|'client_id'|'brand_id'|'campaign_id'|'created_at'|'updated_at'|'submitted_by'|'submitted_at'>>`) + runtime `sanitizeBriefPatch()` helper in `coreRepository.ts`. `BriefRepository.update`'s `patch` is now typed `BriefUpdatePatch`, and both `LocalStorageBriefRepository.update` and `SupabaseBriefRepository.update` call `sanitizeBriefPatch(patch)` before merging/sending. `App.tsx handleBriefUpdate` and `BriefIntakeTab.tsx onBriefUpdate` updated to the `BriefUpdatePatch` type.

**localStorage fallback:** still safe — sanitizer runs in `LocalStorageBriefRepository.update` too; tenant/campaign/identity/audit fields cannot be reassigned via `update()` in either mode.

**Tenant scope:** unchanged — `list`/`get`/`update` still require `clientId`+`brandId`+`campaignId`(+`briefId`); Supabase queries unchanged (`.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)`, `.eq('id', briefId)` for get/update).

**Build:** PASS — 0 TS errors. `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS. **Commits:** `1e3e664` → `4a5ce38`. **Trạng thái Phase 16B-2:** ✅ CLOSED. **Next:** TBD.

---

## 🏁 Phase 16B-1 — Campaigns CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

**Scope completed:** Supabase CRUD repository wiring for Campaigns only (Briefs/Generation/Calendar/Approval/Reports deferred to 16B-2+). Same repository pattern as Phase 16A (Clients/Brands).

**Final tenant-scope contract:**
- `CampaignRepository.list({ clientId, brandId? })` — `clientId` required
- `CampaignRepository.get({ clientId, campaignId, brandId? })` — scoped by client (+ brand if given)
- `CampaignRepository.update({ clientId, brandId, campaignId }, patch)` / `archive({ clientId, brandId, campaignId })` — all 3 IDs required
- Supabase always adds `.eq('client_id', clientId)`, plus `.eq('brand_id', brandId)` when required
- TypeScript enforces: unscoped campaign calls (`list()`, `get({campaignId})`, `update({campaignId}, patch)`, `archive({campaignId})`) are compile errors
- `create(data)` requires `client_id` + `brand_id`; DB generates UUID — local `campaign-*` IDs never sent to Supabase

**App.tsx / CampaignsTab.tsx wiring:**
- On Supabase mount, campaigns loaded per-client: `Promise.all(clients.map(c => repos.campaigns.list({ clientId: c.id })))`
- New handlers: `handleCampaignCreate(data)`, `handleCampaignUpdate(campaign, patch)` — both return repo rows used to update `coreData.campaigns` + `saveCoreData`
- `CampaignsTab.tsx`: `onCampaignCreate`/`onCampaignUpdate` async props, `formLoading`/`actionError` states, removed `generateId`/`onUpdate(CoreDataStore)`/`briefs` prop

**Safety:** Supabase env OFF · no secrets · Demo Sign In preserved · localStorage fallback preserved · Brief/Generation/Calendar/Approval/Reports wiring deferred to 16B-2+

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

---

## ✅ Phase 16B-1 Codex Fix 1 — Positive `duration_days` on Create (2026-06-10)

**Issue:** `schema_v1.sql` → `campaigns.duration_days INT NOT NULL DEFAULT 7 CHECK (duration_days > 0)`. Both `SupabaseCampaignRepository.create` and `LocalStorageCampaignRepository.create` hardcoded `duration_days: 0`, which would fail the CHECK constraint on every Supabase insert.

**Fix:** New helper `calculateCampaignDurationDays(startDate, endDate)` in `src/lib/core/coreData.ts` — inclusive day count `max(1, round((end - start) / 1 day) + 1)`, falling back to `1` when dates are missing/invalid. Both repositories' `create()` now use this helper instead of `0`.

**Tenant scope:** unchanged. **Build:** PASS — 0 TS errors. `git diff --check`: PASS.

**Codex result:** PASS. **Commits:** `e733633` → `a2a8651`. **Trạng thái Phase 16B-1:** ✅ CLOSED. **Next:** Phase 16B-2 — Campaign Briefs CRUD wiring.

---

## 🏁 Phase 16A CLOSED — Codex PASS (2026-06-09)

**Scope completed:** Supabase CRUD repository wiring for Clients and Brands. Repository pattern implemented (interface → factory → Supabase/localStorage impls). All three Codex fix rounds applied and passed.

**Final tenant-scope contract:**
- `BrandRepository.list(clientId: string)` — required, no optional fallback
- All brand ops (`get`, `update`, `archive`) require `clientId`; Supabase always adds `.eq('client_id', clientId)`
- TypeScript enforces: unscoped brand calls are compile errors

**Safety:** Supabase env OFF · no secrets · Demo Sign In preserved · localStorage fallback preserved · Campaign/Brief/Generation/Approval wiring deferred to 16B+

**Commits:** `54c8281` → `bccd1d1` → `53e8450` → `df7e6aa`

---

## ✅ Phase 16A Codex Fix 3 — Mandatory clientId on BrandRepository.list (DONE — 2026-06-09)

### Issue fixed:
`BrandRepository.list(clientId?: string)` was optional — any caller could omit it and read all brands. Fixed: `clientId` is now required in the interface and both implementations. Supabase always applies `.eq('client_id', clientId)`; localStorage always filters. Only call site (`App.tsx:275`) already passed `c.id` — no change needed there.

### Files changed:
- `src/lib/core/coreRepository.ts` — `list(clientId?: string)` → `list(clientId: string)`
- `src/lib/core/supabaseRepositories.ts` — unconditional `.eq('client_id', clientId)`, no optional fallback
- `src/lib/core/localStorageRepositories.ts` — unconditional `filter(b => b.client_id === clientId)`

### Build: PASS — 0 TS errors. git diff --check: PASS.

---

## ✅ Phase 16A Codex Fix 2 — Tenant-Scoped Brand Operations (DONE — 2026-06-09)

### Issues fixed:
1. **Unscoped brand list:** `App.tsx` called `repos.brands.list()` without `clientId`. Fixed: load clients first, then `repos.brands.list(c.id)` per-client.
2. **Brand get/update/archive unscoped:** All three only filtered by brand `id`. Fixed: now require `clientId`, queries add `.eq('client_id', clientId)`.
3. **Interface not enforcing clientId:** `BrandRepository` interface allowed unscoped calls. Fixed: TypeScript now requires `clientId` in `get/update/archive`.
4. **LocalStorage not validating clientId:** Fixed: `LocalStorageBrandRepository` filters and throws on clientId mismatch.

### Files changed:
- `src/lib/core/coreRepository.ts` — `BrandRepository.get/update/archive` require `clientId: string`
- `src/lib/core/supabaseRepositories.ts` — all brand ops scoped by both `id` and `client_id`
- `src/lib/core/localStorageRepositories.ts` — same scoping in fallback path
- `src/App.tsx` — initial load now loads brands per-client (not all-at-once)

### Build: PASS — 0 TS errors. git diff --check: PASS.

---

## ✅ Phase 16A Codex Fix 1 — Route mutations through repos, surface errors (DONE — 2026-06-09)

### Issues fixed:
1. **UUID bypass:** `syncClientsBrandsToSupabase` was inserting `client-*/brand-*` local string IDs into UUID Postgres columns. Removed entirely.
2. **Silent errors:** `.catch(() => {})` swallowed all Supabase write failures. Removed. Errors now propagate as `formError` (create) or `actionError` (archive/activate) in each tab.
3. **Repo bypass:** Mutations now go exclusively through `repos.clients`/`repos.brands`. Returned DB rows with real UUIDs update React state.

### Files changed:
- `src/components/core/ClientsTab.tsx` — async `onClientCreate`/`onClientUpdate` props, `formLoading`, `actionError`, removed `generateId`/`onUpdate`/`briefs`
- `src/components/core/BrandsTab.tsx` — async `onBrandCreate` prop, `formLoading`, removed `generateId`/`onUpdate`/`briefs`
- `src/App.tsx` — removed `syncClientsBrandsToSupabase`, added `handleClientCreate`/`handleClientUpdate`/`handleBrandCreate`, pure localStorage `handleCoreUpdate`

### Build: PASS — 0 TS errors. git diff --check: exit 0.

---

## ✅ Phase 16A — Supabase CRUD Wiring: Clients + Brands (DONE — 2026-06-09)

### Deliverables:
- **NEW** `src/lib/core/localStorageRepositories.ts` — `LocalStorageClientRepository` + `LocalStorageBrandRepository` wrapping existing coreData.ts helpers
- **NEW** `src/lib/core/supabaseRepositories.ts` — `SupabaseClientRepository` + `SupabaseBrandRepository` using anon key + Supabase RLS
- **NEW** `src/lib/core/repositoryFactory.ts` — factory picks correct impl based on `isSupabaseConfigured`
- **MODIFIED** `src/App.tsx` — repos wired via `useMemo`, async initial load from Supabase on mount (when configured), diff-based fire-and-forget Supabase write in `handleCoreUpdate`, non-blocking error banner

### Wired:
- Clients: list, get, create, update, archive — Supabase when configured, localStorage always as fallback
- Brands: list (with clientId filter), get, create, update, archive — same pattern

### Still localStorage: Campaigns, Briefs, Generation, Approval, Assets, Export Packs, Connector Registry, Automation Logs

### Safety:
- No secrets, no service role key, no real Supabase env enabled
- Demo Sign In + localStorage fallback fully preserved
- Build PASS — 0 TS errors. git diff --check PASS.

---

## ✅ Phase 15 Codex Fix 3 — Finalize Tenant-Scoped RLS Plan (DONE — 2026-06-09)

### Vấn đề Codex phát hiện (lần 3):
1. `approval_comments_staff_all` chỉ global owner/manager — scoped manager của đúng tenant bị chặn không đọc được internal comments.
2. Test matrix thiếu viewer users (U5, U6). Tests T01–T18 ghi `✅ PASS` dù chưa chạy DB thật.
3. `supabase_wiring_README.md` section 7 Phase 16 checklist vẫn ghi `Apply current_user_has_role() helper` (helper cũ đã bị thay).
4. `content_items_read` chỉ cho global staff đọc draft — scoped manager không review được draft trong tenant của họ.
5. Docs vẫn dùng "all fixed" language khi policies/tests chưa apply thật.

### Đã fix:
1. **`rls_policy_plan.md` section 7 (Content)**: `content_items_read` nay có 3 tiers: global staff (all), scoped manager (all statuses in tenant), client/viewer (approved only). `content_items_modify` cũng cho scoped manager modify trong tenant.
2. **`rls_policy_plan.md` section 8 (Approval comments)**: Split thành 3 policies:
   - `approval_comments_global_staff_all` — global owner/manager all access
   - `approval_comments_scoped_staff_read` — scoped manager đọc ALL comments (internal+non-internal) trong tenant, qua join `approval_requests→campaigns→current_user_has_scoped_role(['manager'], 'client', c.client_id)`
   - `approval_comments_client_read` — client/viewer non-internal only, tenant-scoped
   - Ghi rõ warning: Tier 2 phải dùng `current_user_has_scoped_role(['manager'])`, không dùng `current_user_can_access_campaign()` (cái sau cũng match client/viewer)
3. **`rls_policy_plan.md` section 14 (Test matrix)**:
   - Thêm U5 (viewer-a scoped Client A), U6 (viewer-b scoped Client B) vào setup
   - T01–T18 → T01–T32: thêm tests cho viewer access, scoped manager draft access, approval comments 3-tier
   - Đổi tất cả `✅ PASS` → `☐ EXPECTED`
   - Thêm note: "These are EXPECTED policy outcomes, not executed results."
   - Thêm diagnostics cho T08, T22, T25 (failure scenarios mới)
4. **`supabase_wiring_README.md` section 7 Phase 16 checklist**: Xóa `Apply current_user_has_role() helper` → thay bằng 4 helper tenant-aware đầy đủ tên.

### Phase 15 status:
- RLS plan: UPDATED (plan only, không phải production-ready)
- Actual policies: chưa apply lên Supabase thật — Phase 16 phải apply + test
- Cross-tenant tests T01–T32: EXPECTED, chưa chạy DB thật
- Production Supabase env: PHẢI TẮT cho đến khi Phase 16 PASS

---

## ✅ Phase 15 Codex Fix 2 — Tighten RLS Tenant Isolation (DONE — 2026-06-09)

### Vấn đề Codex phát hiện (lần 2):
1. `roles` bị bỏ sót khỏi audit — 11+15=26 không khớp với 27 bảng trong schema. `roles` chưa bật RLS, nên `roles_read_authenticated` policy không có hiệu lực.
2. `current_user_has_role()` không phân biệt global vs scoped — manager scoped Client A bị treat như global manager, có thể đọc Client B data.
3. `approval_events_staff_read` dùng `current_user_has_role(ARRAY['owner','manager','client','viewer'])` → mọi authenticated user đọc toàn bộ approval events cross-tenant.
4. `approval_comments_client_public` chỉ check `is_internal=false` + role → mọi client/viewer đọc toàn bộ non-internal comments cross-tenant.
5. Docs ghi "all fixed" → cần tone down — đây là plan, chưa production-ready.

### Đã fix:
1. **`rls_policy_plan.md` — Toàn bộ rewrite:**
   - Section 1: Thêm `roles` vào danh sách 16 bảng cần enable RLS (total: 11+16=27 đúng). Ghi rõ quyết định: roles là public-read (không có dữ liệu nhạy cảm).
   - Section 2: Thêm `ALTER TABLE roles ENABLE ROW LEVEL SECURITY` vào Step 0.
   - Section 3: Bootstrap — note rõ roles phải enable RLS trước khi `roles_read_authenticated` có hiệu lực.
   - Section 4: Thay 1 helper → 4 helpers tenant-aware, tất cả có `SECURITY DEFINER` + `SET search_path = public, pg_temp`, không dùng dynamic SQL, chỉ trả boolean:
     - `current_user_has_global_role(role_names[])` — chỉ check `resource_type IS NULL/'global'`
     - `current_user_has_scoped_role(role_names[], type, id)` — check scope cụ thể
     - `current_user_can_access_client(client_id)` — global staff OR scoped to client
     - `current_user_can_access_campaign(campaign_id)` — joins qua campaign.client_id
   - Sections 5–11: Replace mọi `current_user_has_role()` → `current_user_has_global_role()` hoặc helper phù hợp.
   - Section 8 (Approval): Fix `approval_events_read` — scoped qua join chain `approval_request→campaign→client`. Fix `approval_comments_client_read` — is_internal=false + tenant scope (không phải global role check).
   - Section 14: NEW — 18 recommended cross-tenant tests với 4 test users (owner global, manager scoped A, client A, client B), cover T01-T18 từ basic access đến cross-tenant denial đến approval events/comments.
2. **`supabase_wiring_README.md`**: Fix section 1.4 — thêm `roles` vào danh sách 16 bảng, cập nhật 4-helper architecture, update Pattern 1–4, tighten section 9 safety invariants (plan-only status ghi rõ ✅/⏳/⚠️).
3. **`database/README.md`**: Update RLS section — 11+16=27 đúng, mention `roles`, note 4-helper architecture, production-env warning với link cross-tenant tests.

### Remaining risks (chưa resolve đến Phase 16):
- Policies chưa được apply lên Supabase thật — tất cả vẫn là plan/SQL
- Cross-tenant tests chưa chạy — cần Supabase project thật với env vars
- Scoped manager (`resource_type='client'`) chưa được test với real DB

### Safety:
- Không thay đổi code runtime. Build PASS. Demo Sign In + localStorage fallbacks preserved.

---

## ✅ Phase 15 Codex Fix — Harden RLS + CRUD Plan (DONE — 2026-06-09)

### Vấn đề Codex phát hiện:
1. README khẳng định "RLS enabled on all tables" — sai (schema_v1.sql chỉ bật 11/27 bảng)
2. `user_roles` có RLS nhưng chưa có bootstrap policy → `fetchUserRole()` luôn trả về 'viewer'
3. Policy mẫu chỉ check role, chưa check tenant/ownership scope → nguy cơ lộ dữ liệu đa tenant
4. `coreRepository.ts` thiếu `ReportRepository` + `ReportMetricRepository`
5. Phase 16 checklist thiếu 7 domains: reports, report_metrics, export_packs, connector_registry, module_registry, module_events, automation_logs
6. Flow diagram dùng `AuthProvider.useEffect()` không rõ file path

### Đã fix:
1. **`CLAUDE_MARKETING_TEAM/03_core/database/README.md`**: Fix "RLS enabled on all tables" → danh sách chính xác 11 bảng enabled / 15 bảng chưa. Thêm bootstrap warning. Link tới rls_policy_plan.md.
2. **`CLAUDE_MARKETING_TEAM/03_core/database/rls_policy_plan.md`** (NEW): Full 13-section RLS plan — current status, Step 0 enable RLS on 15 missing tables, `current_user_has_role()` helper function, bootstrap policies, Group A–G policies với tenant-scoped patterns, apply order, safety checklist trước khi enable production env.
3. **`CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`**: Fix section 1.4 (accurate RLS table list, bootstrap problem callout, tenant-scoped policy patterns), fix section 4 (AuthProvider reference → `src/lib/auth/AuthContext.tsx`), expand section 7 Phase 16 checklist to cover all 10 domains + RLS step first, harden section 9 safety invariants (prod env warning, client tenant isolation rule).
4. **`src/lib/core/coreRepository.ts`**: Added `ReportRepository`, `ReportMetricRepository` interfaces + `Report`/`ReportMetric` type imports. Updated `CoreRepositories` bundle (18 repos now).

### Safety:
- Không thay đổi code runtime. Không sửa auth logic. Demo Sign In + localStorage fallbacks preserved. Build PASS.

---

## ✅ Phase 15 — Supabase Auth + Database Wiring Plan (DONE — 2026-06-09)

### Mục tiêu:
Kiểm tra schema/database readiness, chuẩn hóa Supabase client/env, tạo wiring plan + repository interface + SQL apply guide. Không migrate full CRUD ở Phase 15.

### Audit kết quả:
- **Auth:** AuthContext.tsx + supabaseClient.ts + LoginScreen.tsx đã sẵn sàng cho Supabase thật. Không cần sửa code.
- **Schema:** schema_v1.sql đầy đủ 7 groups, match TypeScript types. Sẵn sàng apply.
- **.env.example:** Đã đúng (VITE_ prefix, SERVICE_ROLE_KEY warning). Không cần sửa.
- **UI Indicator:** Login screen banner + demo credentials prefill khi unconfigured. Không cần sửa.

### Đã build:
1. **`CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`** (NEW): Full audit — auth status, schema status, localStorage→Supabase mapping (7 stores), RLS requirements (2 patterns), missing/deferred items, environment variables guide, auth flow diagram, repository interface plan, SQL apply guide (7 steps), Phase 16 CRUD checklist, safety invariants.
2. **`src/lib/core/coreRepository.ts`** (NEW): TypeScript interfaces for 16 repositories (Client, Brand, Campaign, Brief, GenerationJob, ContentItem, ApprovalRequest, ApprovalEvent, ApprovalComment, Asset, AssetCollection, ExportPack, Connector, Module, ModuleEvent, AutomationLog) + CoreRepositories bundle. Phase 16 wiring strategy in comments.
3. **`CLAUDE_MARKETING_TEAM/03_core/database/README.md`** (UPDATED): Full 7-step SQL apply guide (create project → apply SQL → configure auth → assign owner role SQL snippet → set env vars local+Vercel → redeploy → verify). Service role key warning. Related docs links.

### localStorage → Supabase Priority:
- Phase 16 (Core + Content): `core_agency_core_data_v1` + `core_agency_gen_data_v1` + approval + assets
- Phase 17+ (Automation): connectors, logs, export packs

### Safety:
- No secrets committed. No real API called. Demo Sign In + localStorage fallbacks preserved. Build PASS.

---

## 🔜 Phase 16 — NEXT: Supabase CRUD Wiring Core Objects

**Mục tiêu:** Kết nối Supabase Auth thật + wire các data stores (clients, brands, campaigns, briefs, generation jobs, content items, approval requests, assets, logs) vào Supabase Postgres thay vì localStorage. RLS policies áp dụng. Auth context dùng Supabase session thật.

**Prerequisite:** `.env.local` phải có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` thật (owner cấp).

**Scope (Phase 15):**
- Supabase client configured với env vars thật
- Auth: sign in / sign out / session persistence qua Supabase Auth
- RLS: enable RLS + policies trên tables core (clients, brands, campaigns, briefs)
- Data layer: `loadCoreData()` → Supabase select; `saveCoreData()` → Supabase upsert
- Fallback: nếu Supabase chưa được cấu hình → tiếp tục dùng localStorage (isSupabaseConfigured guard đã có)

**Safety:** Không hardcode key. Không commit .env.local. Không auto-post/ads/message. Generated ≠ Approved ≠ Published vẫn giữ nguyên.

---

## ✅ Phase 14 — Automation Logs Foundation (DONE — 2026-06-09)

### Mục tiêu:
Tạo Automation Logs tab để Core ghi nhận, xem, lọc và quản lý log automation nội bộ/local. Phase này chỉ local/mock — không kết nối API thật, không gọi webhook thật, không retry thật.

### Đã build:
1. **`src/types/core.ts`**: Added `AutomationLogType` (10), `AutomationLogSource` (7), `AutomationLogSeverity` (4), `AutomationLogStatus` (5), `LocalAutomationLog` interface.
2. **`src/lib/core/automationLogs.ts`** (NEW): Display maps (TYPE/SOURCE/SEVERITY/STATUS label+color), seed 9 mock logs, `AutomationLogStore`, `loadAutomationLogData()` / `saveAutomationLogData()` (max 200 logs, key: `core_agency_automation_logs_v1`), `createAutomationLog()`, `updateLogStatus()`, `AutomationLogStats`, `computeLogStats()`.
3. **`src/components/core/AutomationLogsTab.tsx`** (NEW): Permission gate (`canViewAutomationLogs`), header + Phase 14 badge + Create Mock Log form (5 templates, owner/manager only), safety disclaimer bar, stats row (5 cards), filter bar (search + type/source/severity/status), log list (expand/collapse per row), expanded detail (message + payload JSON + related refs + timestamps + action buttons), footer notice.
4. **`src/App.tsx`**: `Activity` icon import, `AutomationLogsTab` + log lib imports, `logData` state + `handleLogUpdate` handler, sidebar "Automation Logs" button (owner/manager only, with error count badge), tab routing `automation-logs`, phase badge → Phase 14.
5. **`CLAUDE_MARKETING_TEAM/03_core/automation_logs_README.md`**: Created.

### Permission Integration:
- `canViewAutomationLogs` = owner/manager (already in permissions.ts from Phase 13 planning)
- `canManageConnectors` (owner) OR owner/manager role can manage log status + create mock logs
- client/viewer: tab hidden entirely, component-level permission gate as second guard

### Stats tracked:
- Total logs, Warnings, Errors, Unresolved (recorded + failed), Success

### Actions:
- Mark Reviewed (sets `reviewed_at`)
- Mark Resolved (sets `resolved_at`)
- Ignore
- Create Mock Log (5 templates — no real action taken)

### Safety:
- No real workflow execution. No real webhook sent/retried. No external API calls.
- No auto-post, no real ads, no customer messaging.
- Safety disclaimer always visible. Logs hidden from client/viewer.
- Build pass (tsc + vite, 0 errors, ~879KB bundle).

---

## ✅ Phase 13 — Connector Registry + Module Event Inbox (DONE — 2026-06-08)

Completed in previous session. Commit: f21dbf7.

---

## ✅ Phase 12 — Export Pack Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Export Pack: gom dữ liệu campaign thành bộ xuất nội dung phục vụ team/client. Local text/markdown only — không PDF/DOCX thật, không upload, không gửi email.

### Đã build:
1. **`src/types/core.ts`**: Added `ExportPackType` (6 values), `ExportPackFormat`, `ExportPackStatus`, `LocalExportPack`.
2. **`src/lib/core/coreData.ts`**: Added `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()`. Storage key: `core_agency_export_pack_data_v1`.
3. **`src/lib/core/exportPackGenerator.ts`** (NEW): `generateExportPack()`, 6 section builders, `formatContent()`, `CLIENT_SAFE_EXPORT_TYPES`.
4. **`src/components/core/ExportPackTab.tsx`** (NEW): Safety banner, configure panel (scope/type/format/generate), preview panel (textarea + copy + regenerate), history panel (50 packs), permission gate.
5. **`src/App.tsx`**: `Package` icon, `ExportPackTab` import, sidebar "Export Pack" button, tab routing `export-pack`, phase badge → Phase 12.
6. **`CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`**: Created.

### Export Types:
| Type | Client-safe |
|---|---|
| `campaign_summary` | ✅ |
| `content_calendar` | ❌ internal |
| `approved_content` | ✅ |
| `client_report` | ✅ |
| `asset_checklist` | ❌ internal |
| `full_campaign_pack` | ❌ internal |

### Permission Integration:
- `canViewExportPacks` = owner/manager/client
- `canExportPacks` (generate) = owner/manager
- Client/viewer: restricted to 3 client-safe types, view-only

### Safety:
- No AI API, no upload, no email, no auto-post, no publish.
- Safety banner always visible.
- Internal fields (angle, owner_note, publish_note, asset.notes) stripped from client-safe exports.

---

## ✅ Phase 9 — Client View Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo Client Portal: client-facing view của campaign content. Client xem được nội dung approved/pending/revision, add feedback/comment, không lộ workspace nội bộ, không thể publish.

### Đã build:
1. **`src/components/core/ClientViewTab.tsx`** (NEW): Safety banner, "Internal Preview" badge (owner/manager), campaign selector (Phase 4 campaigns), campaign overview card (brand, brief title, goal, dates, channels, status), content summary stats (Approved/Pending Review/Revision Requested), content item list với expand/collapse. Client-facing fields: hook, caption, visual_brief, cta, hashtags. Hidden: owner_note, angle, pillar, job internals. Feedback form (stores via `addApprovalComment`, isInternal=false). Public comment display. Empty states.
2. **`src/App.tsx`**: UserCheck icon import, ClientViewTab import, "Client" sidebar section label, "Client Portal" button (emerald highlight), tab routing `client-view`.
3. **`CLAUDE_MARKETING_TEAM/03_core/client_view_README.md`**: Created.

### Client-Visible Status Mapping:
- `approved` → "Approved" (emerald)
- `needs_review` / `generated` → "Pending Review" (amber)
- `revision_requested` → "Revision Requested" (orange)
- Hidden: `rejected`, `archived`, `failed`, `draft`

### Client Actions:
- View content (all roles with `canViewContent`)
- Add feedback comment (all roles, only if approval request exists for item)
- No publish, no approve/reject, no internal data edit

### Safety:
- Approved ≠ Published. No publish action in Phase 9.
- Safety banner always visible in Client Portal.
- Internal workspace not exposed to client view.

---

## ✅ Phase 8 — Approval Workflow Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng approval workflow: Generated/Needs Review → Submit for Approval → Approve/Reject/Request Revision. Approval record là nguồn quyết định trạng thái. Không publish ở Phase 8.

### Đã build:
1. **`src/types/core.ts`**: Added `ContentApprovalStatus`, `ApprovalPriority`, `ApprovalActionType`, `ContentApprovalRequest`, `ContentApprovalEvent`, `ContentApprovalComment`.
2. **`src/lib/core/coreData.ts`**: Added `ApprovalDataStore`, `loadApprovalData()`, `saveApprovalData()`, display helpers (LABEL/COLOR maps), `SUBMITTABLE_ITEM_STATUSES`, `getActiveRequestForItem()`, `canSubmitItem()`, `submitForApproval()`, `executeApprovalAction()`, `addApprovalComment()`. Storage key: `core_agency_approval_data_v1`.
3. **`src/components/core/ApprovalsTab.tsx`** (NEW): Submit panel (eligible items), cascading filter bar, request list cards, detail view (content preview, metadata, Approve/Reject/Revision/Cancel action buttons with confirm step, comment form, history timeline). Safety banner.
4. **`src/components/core/ContentGenerationTab.tsx`**: Added `onNavigateToApprovals` + `submittableItemIds` props. "→ Submit for Approval" button on expanded eligible items.
5. **`src/components/core/ContentCalendarTab.tsx`**: Added `approvalRequests` + `onNavigateToApprovals` props. Approval status badge on item cards (links to Approvals tab).
6. **`src/App.tsx`**: `ClipboardCheck` icon, `ApprovalsTab` import; `approvalData` state; `handleApprovalUpdate(approval, gen)` atomic updater; `actorLabel`; `submittableItemIds` set; sidebar "Approvals" button with pending count badge; `approvals` tab routing.
7. **`CLAUDE_MARKETING_TEAM/03_core/approval_workflow_README.md`**: Created.

### Status Transitions:
- Submit → `approval_request.status = submitted`, `content_item.status = needs_review`
- Approve → `approval_request.status = approved`, `content_item.status = approved`
- Reject → `approval_request.status = rejected`, `content_item.status = rejected`
- Revision → `approval_request.status = revision_requested`, `content_item.status = revision_requested`
- Cancel → `approval_request.status = cancelled`, `content_item.status = needs_review`

### Safety:
- Approved ≠ Published. No publish action in Phase 8. Safety banner always visible.
- Publishing blocked until Phase 9+.

---

## ✅ Phase 7 — Content Calendar Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Content Calendar để xem, lọc, chỉnh lịch và quản lý các content items đã được generate từ Phase 6.

### Đã build:
1. **`src/types/core.ts`**: Extended `ContentPlanItem` — 4 optional calendar fields: `scheduled_time`, `publish_note`, `owner_note`, `last_moved_at`. Backward-compatible (all optional).
2. **`src/lib/core/coreData.ts`**: Added `CalendarSafeStatus`, `CALENDAR_SAFE_STATUSES`, `CalendarItemPatch`, `updateContentItemInStore()`. Safe statuses: generated, needs_review, revision_requested, rejected, archived. approved/scheduled/published blocked.
3. **`src/components/core/ContentCalendarTab.tsx`** (NEW): Safety banner, cascading filter bar (client→brand→campaign→channel→status), day-grouped list sorted by planned_date, item cards (day badge, date, channel, hook preview, caption preview, status chip), detail view (full caption/visual brief/hashtags/CTA/angle/pillar/approval note), edit panel (safe fields: date/time/channel/owner_note/publish_note/status), permission gate, 2 empty states, summary stats bar.
4. **`src/App.tsx`**: CalendarDays icon import, ContentCalendarTab import, sidebar "Content Calendar" button (after Content Generation), content-calendar tab routing.
5. **`CLAUDE_MARKETING_TEAM/03_core/content_calendar_README.md`**: Created.

### Calendar Status Gate (Phase 7):
- Editable: `generated`, `needs_review`, `revision_requested`, `rejected`, `archived`
- Blocked: `approved`, `scheduled`, `published` — requires Phase 8 Approval Workflow

### Safety:
- "Calendar is planning only. Scheduled ≠ Published. Generated ≠ Approved. Approved ≠ Published. No auto-post."
- No publish action in Phase 7. Safety banner always visible.

---

## ✅ Phase 5 — Brief Intake Foundation (DONE + BUILT + PUSHED — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Brief Intake — input layer trước khi AI content generation (Phase 6+).

### Đã build:
1. **`src/types/core.ts`**: Added `BriefStatus` union; extended `CampaignBrief` with 15 new fields.
2. **`src/lib/core/coreData.ts`**: Added `BriefFormData`, `SEED_BRIEFS` (3), extended `CoreDataStore`, migration in `loadCoreData()`, display helpers.
3. **`src/components/core/BriefIntakeTab.tsx`** (NEW): List view (filters, cards, quick-actions), Detail view (all fields, status transitions, disabled Generate placeholder), Create/Edit form (5 sections, auto-populate brand, validation), Safety notice.
4. **ClientsTab / BrandsTab / CampaignsTab**: Added `briefs` prop + pass-through in `onUpdate`.
5. **`src/App.tsx`**: Imported `BriefIntakeTab`, `ClipboardList`; Brief Intake sidebar button; tab rendering; phase badge → Phase 5.
6. **`CLAUDE_MARKETING_TEAM/03_core/brief_intake_README.md`**: Created.

### Brief Status Machine:
`draft → ready_for_generation → approved_for_generation | needs_revision → archived`

### Safety:
- "Generate" button disabled (label: "Generate — Phase 6")
- Brief = Input only. Generated ≠ Approved ≠ Published. No auto-post.
- Build PASS: tsc + vite, 0 errors, ~634KB bundle.

---

## ✅ Phase 4 — Client/Brand/Campaign Management Foundation (DONE + BUILT + PUSHED — 2026-06-07)

### Đã build:
Core data layer (coreData.ts), ClientsTab, BrandsTab, CampaignsTab, App.tsx updates, permission integration, localStorage store.

---

## ✅ Phase H.7 — Owner View + Client View (DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK — 2026-06-05)

### Mục tiêu:
Thêm two-mode workspace experience: Owner View (manage/review/approve) và Client View (present/feedback/export).

### Đã build:
1. **`viewMode` state** (`'owner' | 'client'`), default `'owner'`.
2. **`handleViewModeSwitch()`**: switches view + auto-redirects to Dashboard if current tab is owner-only.
3. **Header mode toggle**: segmented control (🔧 Owner View | 👁 Client View), indigo/emerald highlight.
4. **Phase badge**: H.6 → H.7 — Owner & Client Views.
5. **Client View — 4 tabs hidden**: New Campaign Brief, AI Team Board, Manual Export Pack, Client Workspace View.
6. **Client View — simplified sidebar safety**: Trust & Safety (Sample Data, Approval Required, No Live Publishing, No Real Ads) instead of full internal Guard.
7. **Dashboard view context card**: Owner card (indigo, manage/approve) + Client card (emerald, present/export), each with a quick-switch button.
8. **Codex fix (`2037f61`)**: Brand Workspace connector boundary card conditional — Owner View keeps technical notes; Client View shows "Workspace Scope" trust card. Presentation & Export step 06 body conditional — Owner keeps internal details; Client View uses Sample Data / Approval Required / No Live Publishing language.

### View Mode Table:
| | Owner View | Client View |
|--|--|--|
| Tabs | All 9 | 6 (client-appropriate) |
| Safety sidebar | Full 7-item guard | 4-item trust summary |
| New Campaign Brief | ✅ | ❌ |
| AI Team Board | ✅ | ❌ |
| Manual Export Pack | ✅ | ❌ |
| Client Workspace View | ✅ | ❌ |

---

## ✅ Phase H.6 — Client-ready Workspace Polish (DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK — 2026-06-05)

### Mục tiêu:
Polish workspace để client-ready: chuẩn hoá ngôn ngữ, loại bỏ demo/prototype framing, dynamic approval hint, owner/client guide card.

### Đã build:
1. **Header badge** → "Phase H.6 — Client-ready Workspace Polish"
2. **Nav renames**: "Client Demo Pack" → "Client Presentation Pack", "Client Demo Mode" → "Client Workspace View"
3. **Tab titles updated**: Demo Pack tab h2, Client Demo Mode h2 + badge → "Client-Ready"
4. **Manual Export Pack title**: Removed "Phase H.1 —" prefix; badge "Production Demo Ready" → "Production Ready"
5. **Approval hint**: Replaced hardcoded "Vị Cuốn / Bánh tráng cuốn heo quay" with dynamic `activeCampaign.brief.heroProduct` and `activeCampaign.brief.brandName`
6. **"How to Use This Workspace" card** (emerald, Dashboard): 6-step owner/client guide — Choose Brand → Review Plan → Review Outputs → Approve → Export Pack → Phase I boundary note
7. **Presenter guide renamed** to "Presenter Walkthrough Guide"; step 4 updated to "Client Workspace View"
8. **Pitch text** in demo-pack: dynamic brand name and hero product
9. **Brand gallery label**: "Current (H.5)" → "Current (H.6)"
10. **Service packages**: "Client Demo Mode" item → "Client Workspace View"
11. **Codex fixes (round 1)**: `Demo/Mock Data Only`, `Mock Pricing — Demo Only`, `Demo/mock only`, `Approval Status Demo`, `demo/mock data only` in Safety Boundaries step
12. **Codex fixes (round 2)**: 15 additional visible demo/mock strings replaced — `Mock Data` badge, `Mock Ad Units`, `Offline Mock-up`, `Mock workspace only`, `White-label demo`, `Mock Pricing`, `Mock Estimate`, `mock est.`, `mock estimate`, `mock ads`, `Mock data` badge, and more → workspace/sample/sandbox framing throughout

---

## ✅ Phase H.5 — Multi-brand Workspace Readiness (DONE + CODEX PASS + FIX APPLIED + BUILT + PUSHED — 2026-06-05)

### Đã build:
1. **mockData.ts**: Thêm 2 brand mới — Cơm Tấm Bản Khói (F&B/HCM) và Forme (premium furniture/HCM+HN).
2. **localStorage v3**: Key bump từ v2→v3 để force fresh seed data load.
3. **Header badge** → "Phase H.5 — Multi-brand Workspace Readiness"
4. **Sidebar**: Thêm "Brand Workspace" tab (icon: Store). "Active Campaign" → "Active Brand".
5. **Dashboard Brand Switcher**: Brand cards ở đầu Dashboard — click để switch brand workspace.
6. **Brand Workspace Gallery tab**: Full brand cards với details, Phase I connector boundary note.
7. **Client Demo Mode**: Campaign Overview và AI Team Workspace descriptions dùng dynamic `activeCampaign.brief.*`.
8. **Framing**: "Sample Data", "Sandbox Safe Mode", "Workspace", không dùng "demo" là main framing.

### 3 Seed Brands:
| Brand | Industry | Hero Product |
|-------|----------|--------------|
| Vị Cuốn | F&B / street food premium / TP Vinh | Bánh tráng cuốn heo quay |
| Cơm Tấm Bản Khói | F&B / cơm tấm / TP.HCM | Cơm tấm sườn bì chả |
| Forme | Nội thất cao cấp / premium furniture | Sofa da Series F-1 |

---

## ✅ Phase H.4 — Export/Presentation Readiness (CLOSED — 2026-06-05)
- Presentation View (6-step), Export Pack Preview (7 cards), Client Approval Sheet, Sales Demo Script, Export Readiness Checklist

## ✅ Các Phase trước (CLOSED)
- **Phase H.3**: Presenter Demo Guide, Sales Readiness, Value Proposition, Before/After, CTA Block, Service Packages
- **Phase H.2**: Client Demo Mode (Client View, Approval Status, AI Team Workspace)
- **Phase H.1 / H-lite**: Manual Export Pack (6 copy blocks)
- **Phase A–G**: Core workspace infrastructure, React UI, mock data, AI agents simulation

## ➡️ Bước tiếp theo

### ✅ Phase 1 — DONE (2026-06-07, commit 317c6c8)
Scope lock. Strategy docs. Branding: CLAUDE MARKETING TEAM → THE CORE AGENCY.

### ✅ Phase 2 — DONE (2026-06-07, commit d0cb365)
Database Schema V1: 30+ tables, Supabase Postgres, TypeScript types, .env.example.

### ✅ Phase 3 — DONE (2026-06-07)
Auth/Login + Role Permission Foundation:
- `@supabase/supabase-js` installed
- `src/lib/supabaseClient.ts` — null-safe client (demo mode if env missing)
- `src/lib/auth/AuthContext.tsx` — React context, 3 modes (supabase/demo/unconfigured)
- `src/lib/auth/permissions.ts` — 30+ permission keys, 4 roles, `can.*` helpers
- `src/components/auth/LoginScreen.tsx` — login UI with demo fallback
- `src/main.tsx` — wrapped with `<AuthProvider>`
- `src/App.tsx` — auth gate (loading → spinner, !authenticated → LoginScreen, authenticated → workspace)
- Header: user email + role badge + sign-out button
- `src/vite-env.d.ts` — Vite env types

### ✅ Phase 4 — DONE (2026-06-07)
Client/Brand/Campaign Management Foundation:
- `src/lib/core/coreData.ts` — seed data (3 clients/brands/campaigns), localStorage store, display helpers
- `src/components/core/ClientsTab.tsx` — list, create, detail, archive, cross-tab nav
- `src/components/core/BrandsTab.tsx` — card grid, filter, create, detail, cross-tab nav
- `src/components/core/CampaignsTab.tsx` — table, filter, create, status update, detail
- `src/App.tsx` — coreData state, Core sidebar section, tab rendering, Phase 4 badge
- Permission integration: canManageClients / canManageBrands / canCreateCampaigns / canEditCampaigns
- Local demo data mode with "Supabase not configured" badge

### Phase 5 — Brief Intake Foundation (Next)
- Wire `campaign_briefs` table to campaigns
- Brief intake form (brand summary, hero product, tone, target, goals, channels, duration)
- Brief submitted → campaign status changes to "active"
- Supabase CRUD wiring for clients/brands/campaigns (coreRepository.ts)
- RLS policies applied

---

## ✅ Phase H.7 (tiền nhiệm) — CLOSED
- Status: DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED
- H.7 added Owner View and Client View inside the same AI Marketing Team Workspace.

## ✅ Phase H.6 (tiền nhiệm) — CLOSED
- H.6 polished the app into a more client-ready workspace. Demo/mock framing corrected throughout.

## ✅ Phase H.5 (tiền nhiệm) — CLOSED
- 3 seed brands, Brand Workspace Gallery, Brand Switcher, localStorage v3.
