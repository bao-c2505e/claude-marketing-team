# V2-E2 — Core ↔ PC2 Dry-run Integration Plan

**Status:** 📋 PLANNING / CONTRACT / TEST-DESIGN ONLY — no runtime integration is implemented by this document.
**Date:** 2026-06-12
**Workstream:** Post-MVP / Ver2 — Core (PC1) ↔ PC2 n8n/modules mock backbone
**Builds on:** `V2E_CORE_PC2_MAPPING_SPEC.md` (V2-E1, PASS at Core commit `4407cf7`) + PC2 N12 handoff (PASS, no required fixes).

> **Naming/scope note:** V2-E1 originally described "V2-E2" as the dry-run *implementation*. The Owner has refined the ladder: **V2-E2 = this integration PLAN; implementation is split into V2-E3 → V2-E6 (§8), each Owner-gated.** This supersedes the V2-E1 §7 two-row boundary table. Same precedent as earlier V2 naming clarifications.

> [!IMPORTANT]
> **Hard boundaries of this phase (V2-E2):**
> - No runtime n8n calls, no outbound HTTP of any kind added to Core.
> - No secrets, no env values, no live connector endpoints.
> - No real ads, posting, messaging, or production automation — and none planned for any V2-E sub-phase.
> - No Supabase runtime behavior change; no repository logic / auth flow / UUID gating / tenant scope / sanitizer / RLS change.
> - PC2 workflow files are referenced read-only as docs (`contracts/`, `n8n-workflows/`, `docs/pc2/` already in this repo); Core never edits them.

---

## 0. Inputs (canonical, already reviewed)

| Input | Where | Status |
|---|---|---|
| V2-E1 mapping spec | `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md` | ✅ PASS at `4407cf7` — envelopes, status table (§4), validation rules V1–V9 (§6) are normative here and are NOT restated in full |
| PC2 handoff summary | `docs/pc2/core_mapping_handoff_summary.md` (merged to main 2026-06-12, commit `967cb00` — workflow paths, event types, registry, callback preview contract, scenario payloads, expected outputs, validator commands), plus `docs/pc2/pc2_handoff_to_core_integration.md`, `docs/pc2/pc2_final_summary.md`, `contracts/pc2_validation_manifest.json` (N1–N12 DONE/PASS, `stabilized_mock_ready`) | ✅ PASS, required fixes: none |
| Callback/approval/safety contracts | `contracts/unified_callback_contract.md`, `contracts/error_handling_retry_logging_contract.md`, `contracts/e2e_dry_run_contract.md`, `contracts/callback_statuses.md` | ✅ validated (`node contracts/tools/validate_contracts.js` ALL PASS, 2026-06-12) |
| Current Core callback ingest behavior | **None exists.** Core is a static Vite/React frontend with zero outbound network calls in `src/` except the Supabase SDK (Phase 18 verification). The Phase-13 Module Event Inbox / Phase-14 Automation Logs are localStorage-only UI surfaces; Group F tables (`module_events`, `webhook_callbacks`, `automation_logs`) have **no repository wiring** (V2-D1 finding #6). | ✅ documented constraint — drives §1.6 design |

**Architectural consequence (load-bearing):** Core has no HTTP listener, so in the dry-run ladder the "callback" is **never a live webhook into Core**. PC2 produces a *callback preview JSON* (its existing N11 behavior — PC2 sends nothing today), and Core ingests it through a **local, dev-only, manual import path** (§1.6). A real webhook receiver (serverless function + `WEBHOOK_SHARED_SECRET`) is a future phase outside V2-E entirely (roadmap V2-C/V2-F territory, Owner-gated).

---

## 1. Dry-run Integration Architecture

```
[1 Core UI trigger] → [2 Core outbound event builder (adapter, DISABLED by default)]
      → (V2-E5 only, Owner-approved) HTTP POST to local n8n webhook-test URL
      → [3 PC2 n8n router: n11_e2e_dry_run] → [4 module stub /run (localhost)]
      → [5 unified callback PREVIEW (JSON artifact — PC2 never POSTs to Core)]
      → [6 Core local ingest (manual import, dev-only)] → [7 Core approval gate (existing UI)]
      → [8 logging/audit trail]            [9 failure → error/dead-letter objects, log-only]
```

### 1.1 Core event trigger source
- Trigger = existing Core UI actions that already create generation intent: content plan generation request (`content_plan_jobs` create), creative/asset request, ads-draft/CRM-draft/report request — mapped to events E1–E5 of V2-E1 §1.1.
- The trigger **never fires automatically**. In every V2-E sub-phase the adapter is invoked only by an explicit user action in a dev-only UI surface, and only when the kill-switch (§2.1) is ON.
- E7–E9 (publish / ads spend / messaging) have **no trigger surface at all** — not even disabled buttons (V2-E1 §1.1 BLOCKED rows).

### 1.2 Core outbound event payload
- Exactly the V2-E1 §1.2 envelope: `e2e_dry_run_v0.1` base + `core_scope` + `mode` + `approval_required` + `safety` + `idempotency_key`. No deviations; any change goes through a V2-E1 spec revision first.
- In V2-E3/V2-E4 the "outbound" payload is **generated and displayed/saved only** (copy-to-clipboard / download JSON) — no HTTP. In V2-E5, after checkpoint O2+O3 (§9), it may be POSTed to the **local** n8n test webhook only.

### 1.3 PC2 n8n mock router/workflow
- Canonical workflow: `n8n-workflows/n11_e2e_dry_run.workflow.json` (router + health check + module run + approval gate + error handling), run inside PC2's local n8n.
- Entry: local sandbox webhook `http://localhost:5678/webhook-test/n11-e2e-dry-run` (from `core_pc2_integration_contract_stub.md` §2) or n8n manual trigger with a pasted Core-generated payload (V2-E5 fallback that requires zero Core-side HTTP).
- Components individually exercisable: `n5` router, `n10` health check, `n8` approval gate, `n9` error/retry — per PC2 handoff §5.

### 1.4 Module stub run
- Per V2-E1 §1.1 route table: `creative_asset_comfyui` :8188, `content_pack_generator` :8191, `ads_pack_generator` :8192, `crm_followup_generator` :8193, `analytics_report_generator` :8194 — all `local_stub`, `real_api_enabled: false`, health check required before `/run` (N10 rule).

### 1.5 Unified callback preview
- PC2's N11 output: `final_status` + `unified_callback_preview` (per `e2e_dry_run_contract.md` §5) conforming to `unified_callback_v0.1` + the V2-E1 §2.1 Core extensions (`correlation`, `core_scope` echo) once PC2 applies the §8-gap validator extensions.
- The preview is exported as a JSON artifact (file). **PC2 dispatches no HTTP callback to Core in any V2-E sub-phase** — consistent with PC2 safety rule "No Production Webhooks".

### 1.6 Core callback ingest target (dev-only, local)
- New (V2-E4) **local ingest surface**: a dev-only panel where the operator pastes/imports the callback-preview JSON.
- Ingest pipeline = V2-E1 §2.5 acceptance preconditions, in order: contract version → known `request_id` → `core_scope` echo equality → UUID gating → idempotency dedupe → allowed `source` → §4 status-consistency. Any failure ⇒ **log-only rejection** with reason; zero entity writes.
- Accepted callbacks write to **localStorage repositories only** in V2-E4/V2-E5 (demo entities, local IDs). Supabase ingest is NOT part of the V2-E ladder unless the Owner separately approves Supabase staging use (checkpoint O4 + V2-D checkpoint A) — and even then only staging, never production.

### 1.7 Approval gate
- The existing Core Approvals surface is the gate — unchanged. Ingested `generated` items create `pending` approval requests (V2-E1 §4); Owner/manager decides in the UI; decisions are recorded in Core only (E6 propagation back to PC2 remains preview-only).

### 1.8 Logging/audit trail
- Every adapter build, dispatch (if any), ingest accept/reject, dedupe hit, and approval transition appends to the existing local `AutomationLog` surface, carrying `request_id`/`run_id`/`workflow_id`/`module_id`/`idempotency_key` plus PC2's `execution_trace` verbatim.
- Group F Supabase wiring stays out of scope (V2-D1 finding #6). Log retention = localStorage lifetime; the V2-E6 evidence pack snapshots logs to files.

### 1.9 Failure / dead-letter behavior
- Failure callbacks (`error_result` non-null, or `final_status` ∈ {`failed_mock`, `blocked_module_unavailable`, `unsupported_event_type`}) follow V2-E1 §2.3/§4: mark the local generation job `failed`, write log entries, **never create/touch approval or content/asset rows** (V6/V5).
- Dead-letter objects (`exhausted_to_dead_letter` / `manual_review_required`) are logged and listed in the dev panel for manual review only; no automated retry from Core. Retries happen on the PC2 side per its N9 mock policy (max 3, same `idempotency_key`, incremented `attempt`).

---

## 2. Core-side Adapter Requirements (design for V2-E3 — not built in V2-E2)

| # | Requirement |
|---|---|
| A1 | **Outbound event builder:** pure function `buildPc2Event(scope, eventType, payload) → envelope` per V2-E1 §1.2; deterministic, fully unit-testable with zero I/O. Lives beside (not inside) existing repos — no change to `coreRepository.ts`/`repoRouting.ts`/sanitizers. |
| A2 | **`dry_run` flag:** `mode.dry_run` hard-coded `true`; `mode.environment` hard-coded `"local_mock"`. Not configurable by UI or env in any V2-E sub-phase — changing it is a code change in a future Owner-approved phase. |
| A3 | **Safety flags:** `safety.no_auto_post` / `no_real_ads` / `no_real_messaging` / `no_live_connectors` emitted as constant `true`. Builder throws if asked to emit anything else (defense-in-depth; mirrors V9). |
| A4 | **Idempotency key:** `idempotency_key = request_id` on first build; rebuilds for the same logical request reuse the same key. Core ingest keeps a processed-keys ledger (local) for dedupe (V4). |
| A5 | **Correlation IDs:** `request_id` minted by builder (UUID v4); `run_id`/`workflow_id`/`module_id` accepted only from callbacks and stored alongside the job for the audit trail; ingest verifies `request_id` match before anything else. |
| A6 | **Tenant/scope validation:** builder revalidates `core_scope` hierarchy (client→brand→campaign→brief→generation→item→collection ancestors-present rule, V2-E1 §1.3) before producing an envelope; invalid scope ⇒ build error, nothing emitted. |
| A7 | **UUID gating:** reuse `isUuid`/`okOrAbsentUuid` from `repoRouting.ts` **as imports** (no modification). Any non-null scope ID failing the gate ⇒ the entity is demo-local ⇒ **no PC2 path** (V2/V3); builder refuses. Demo-mode dev testing uses explicitly-marked fixture UUIDs, never `col-*` translations. |
| A8 | **Blocked events:** `buildPc2Event` rejects `core.publish.*`, `core.ads_spend.*`, `core.messaging.*` event types at the type level (not present in the allowed union) — planning statuses (`planned_publish`/`scheduled`) never produce events. |
| A9 | **Kill-switch:** adapter surface renders only when a dev-only flag (e.g. `VITE_PC2_DRYRUN_TOOLS=true`, name TBD at checkpoint O1) is set locally; flag absent (default, and always on Vercel) ⇒ no adapter UI, no code path reachable. The flag is a visibility switch only — it gates UI rendering, holds no secret, and its default-off state ships everywhere. |

---

## 3. PC2-side Expectations (consumed read-only from the N12 handoff)

| Item | Expectation |
|---|---|
| Supported event types | exactly the 5 lowercase `*.requested` types (V2-E1 §1.1 E1–E5); anything else → `unsupported_event_type` terminal error |
| Workflow paths | `n8n-workflows/n11_e2e_dry_run.workflow.json` (canonical), components n4/n5/n7/n8/n9/n10 per handoff §5 |
| Module registry route | `contracts/module_registry.md` — 5 stubs, localhost ports 8188/8191–8194, health check before run, all `owner_approval_required: true` |
| Scenario payloads | `contracts/examples/` — `valid_core_to_n8n_event.json`, `invalid_core_to_n8n_event.json`, `valid_module_callback.json`, `rejected_by_safety_callback.json`, `examples/modules/*`, `examples/n8n/*` (n4–n11) |
| Expected outputs | `e2e_dry_run_contract.md` §5 final output schema + `examples/n8n/n11/*` previews |
| Validator command | `node contracts/tools/validate_contracts.js` (re-run before every V2-E5 session; must be ALL PASS) |
| Callback preview status rules | `unified_callback_v0.1` §3 (module_status/approval_status enums) + §5 decision mapping; N11 `final_status` set per `e2e_dry_run_contract.md` §5; consistency enforced by Core ingest per V2-E1 §4 (V8) |
| `failed_mock` handling | PC2 fail-safe routing (handoff §8): module `/run` error ⇒ `failed_mock` immediately, never enters the approval branch; Core ingest mirrors this (§1.9) |
| `partial_failure` handling | PC2 N11 has no native partial_failure status — it is a **Core-side classification**: `module_status: mock_completed` + non-empty `errors[]` with usable `output` ⇒ Core ingests successful sub-outputs only, failed sub-outputs go to logs (V2-E1 §4 row 8). PC2 gap-closure: examples for this shape should be added to `contracts/examples/` during V2-E5 prep (tracked with the 3 gaps in V2-E1 §8) |

---

## 4. Callback Safety Rules (normative, restated from V2-E1 V5–V8)

1. **No callback can bypass or mutate approval — imported PC2 callbacks are non-authoritative, always.** Ingest never writes any approval state other than creating a `pending` request for generated items. A callback claiming ANY approval state — `approved`, `rejected`, or `needs_revision` — does not transition anything: the claim is recorded as callback metadata, the items still land as `generated` with the approval request at `pending`, and the claim is flagged for human review (Core UI is the only approval authority). **Imported PC2 callbacks cannot bypass or mutate Core approval decisions, in any V2-E sub-phase, under any status combination.**
2. **The only things an imported PC2 callback may do:**
   - validate payload consistency (the §1.6 precondition pipeline);
   - log callback status (`module_status` / `approval_status` / `final_status` recorded verbatim as metadata);
   - record module output/error metadata (items as `generated`, error objects to logs);
   - echo an approval decision **that already exists in Core** (E6 round-trip: Core decided first in the UI, PC2 echoes it back — ingest verifies the echo matches the existing Core state and logs it; a mismatch is logged as a warning, never applied);
   - attach non-authoritative notes for review (`revision_notes`, `reason`, gate-sim decisions — surfaced to the reviewer in the Approvals UI as PC2 annotations).
3. **Every transition to `revision_requested`, `rejected`, or `approved` is triggered only by an authenticated Core UI approval action** (Owner/manager in the Approvals surface, under existing auth + RLS). There is no code path from ingest to an approval transition.
4. **PC2 `needs_revision`/`rejected`-like statuses are review inputs, not transitions.** When a callback reports `revision_required` / `stopped_rejected` (or any rejection-flavored status), Core treats it as non-authoritative callback metadata requiring human review: the reviewer sees PC2's recommendation and its notes, and may then — manually — apply `revision_requested`/`rejected` in the UI. If the reviewer does nothing, the request simply stays `pending`.
5. **`failed_mock` never enters approval.** Any failure status ⇒ job `failed` + logs only; no item rows, no approval rows.
6. **`partial_failure` ⇒ logs + partial output only.** Successful sub-outputs land as `generated` (+ `pending` approval); failed sub-outputs produce log entries; the job records a partial-failure note.
7. **`approved` means human-approved in Core.** Only an authenticated Owner/manager action in the Approvals UI produces `approved`. PC2 approval-gate decisions are simulations/echoes — non-authoritative by contract.
8. **`published` stays planning/blocked.** No V2-E sub-phase can produce `published`. `planned_publish`/`scheduled` remain calendar markers. Real publishing requires a future dedicated real-connector phase with written per-connector Owner sign-off (V2-F framework) — outside V2-E.

> **Reading the V2-E1 §4 status table under these rules:** the `needs_revision`/`rejected`/`approved` rows of that table describe Core entity states **after an authenticated Core UI decision** (the "decision `…`" entries in its PC2-triple column, i.e. the E6 flow). They are NOT reachable by importing a PC2 callback that merely *reports* those statuses — such a callback lands per rules 1–4 above: entities stay `generated`/`pending`, the PC2 status is metadata.

---

## 5. Test Plan (executed in V2-E4/V2-E5; designed here)

Conventions: each test = (input artifact, action, expected per V2-E1 §4/§6). All fixtures are fictional; scope UUIDs are fixture UUIDs; results recorded in the V2-E6 evidence pack. "Ingest" = §1.6 manual import path.

| ID | Scenario | Input | Expected result |
|---|---|---|---|
| T1 | **Success / generated** | E1 `content_pack.requested` envelope → N11 run (approved-path sim `pending`) → preview with `mock_completed` + `pending_approval`, items in `output` | Ingest ACCEPTS; job `completed`; items `generated`; approval request `pending`; logs carry full correlation chain |
| T2 | **needs_revision (non-authoritative echo)** | T1 preview, approval-gate sim `needs_revision` (`final_status: revision_required`, `revision_notes` set) | Ingest ACCEPTS as **metadata only**: items land `generated`; approval request created/stays `pending`; **NO transition to `revision_requested`** — PC2's recommendation + `revision_notes` attached as non-authoritative review notes and logged, flagged for human review (§4.4). Separate manual step (not part of ingest): Owner/manager applies `revision_requested` in the Approvals UI, and THAT transition is verified as a Core-UI action |
| T3 | **rejected (non-authoritative echo)** | T1 preview, gate sim `rejected` (`final_status: stopped_rejected`, `reason` set) | Ingest ACCEPTS as **metadata only**: items land `generated`; approval stays `pending`; **NO transition to `rejected`** — PC2 rejection + `reason` logged as callback metadata, flagged for human review (§4.4). Separate manual step: Owner/manager applies `rejected` in the Approvals UI; ingest itself never rejects |
| T4 | **failed_mock** | Stub stopped (module_unavailable) OR `/run` 500 → N11 `final_status: failed_mock`/`blocked_module_unavailable` with `error_result` | Ingest ACCEPTS as failure: job `failed`; **zero item rows, zero approval rows**; error object + retry_summary logged; dead-letter listed if present |
| T5 | **partial_failure** | Crafted preview: `mock_completed`, 3 items in `output`, `errors: ["item 4 failed …"]` | Ingest ACCEPTS partially: 3 items `generated` + `pending` approval; failure note logged; job carries partial-failure note |
| T6 | **Duplicate callback / idempotency** | T1 preview imported twice (same `idempotency_key`) | Second import = idempotent NO-OP: no duplicate items/approvals/job transitions; dedupe hit logged (V4) |
| T7 | **Local ID / col-\* safety** | (a) Builder asked to build for a demo-local scope (`client-1`/`col-3`); (b) crafted callback whose `core_scope` echo contains `col-*` | (a) Builder REFUSES — no envelope; (b) ingest REJECTS at UUID gate — log-only, zero writes (V2/V3) |
| T8 | **Missing tenant scope** | Crafted callback without `core_scope` (or with `client_id: null`), and builder call with incomplete hierarchy | Builder refuses / ingest REJECTS (`schema_mismatch`/`validation_error`); log-only (V1) |
| T9 | **Approval-bypass attempt** *(safety regression, beyond the 8 required)* | Crafted callback `approval_status: "approved"`, `final_status: completed_mock` | Items land `generated` + approval `pending`; warning logged; nothing becomes `approved` (§4.1) |
| T10 | **Unknown request_id / bad source** *(safety regression)* | Valid-shaped preview with unmatched `request_id`, or `source` outside the allowed set | Ingest REJECTS; log-only (V2-E1 §2.5.2/§2.5.6) |

Pass criterion per scenario: expected entity states AND expected log entries AND zero forbidden writes. T1–T8 are mandatory for V2-E5 closure; T9–T10 are mandatory for V2-E4 closure (they're pure-ingest tests needing no n8n).

---

## 6. (merged into §4 — numbering parity with task list; callback safety above)

## 7. (merged into §5 — test plan above)

---

## 8. Implementation Phases After This Plan

| Phase | Scope | Hard limits | Closure evidence |
|---|---|---|---|
| **V2-E3 — Core dry-run adapter skeleton** | `buildPc2Event` builder + types + unit tests (A1–A8); dev-only panel behind kill-switch (A9), rendering payload preview/download only | **Disabled by default; zero HTTP code paths; no env vars beyond the visibility flag (checkpoint O1)**; no repo/auth/RLS/sanitizer change | builder unit tests green (incl. T7a/T8 builder halves); screenshot of flag-off = no surface; Owner approval logged |
| **V2-E4 — Local-only callback ingestion test** | §1.6 ingest surface + §2.5-precondition pipeline + processed-keys ledger; fixtures for T1–T10 callback JSONs | **Input = pasted/imported JSON only; no listener, no HTTP**; localStorage writes only | T1–T3, T5–T10 ingest-side results recorded; Owner approval logged |
| **V2-E5 — PC2 dry-run E2E with mock endpoint only** | Full loop: Core-built payload → local n8n `n11` (webhook-test URL or manual-trigger paste) → stub run → preview JSON → Core ingest → approval gate | **All URLs `localhost`; checkpoints O2+O3 required BEFORE the first outbound call; PC2 validator ALL PASS before each session; no secrets; production Vercel build never contains the flag** | T1–T8 full-loop results + PC2 `execution_trace`s archived; Owner approval logged |
| **V2-E6 — Closure / evidence pack** | `08_logs/v2e_dryrun_evidence_YYYYMMDD.md`: scenario matrix results, log snapshots, payload/preview artifacts, deviations, gap status (V2-E1 §8 a–c), updated risk list | Docs only | Evidence pack filed + **Owner approval logged** (standing rule: deliverable-ready ≠ closed) |
| **Real connectors** | — | **Remain future, separate, per-connector Owner-approved phases (V2-F framework). Nothing in V2-E3–E6 creates a path to production endpoints, real posting/ads/messaging, or secrets.** | — |

Each phase starts only after the previous phase's closure evidence + Owner approval; any scope creep returns to planning.

---

## 9. Owner Approval Checkpoints

| # | Checkpoint | Gates | Status |
|---|---|---|---|
| O1 | **Before adding any env var** (incl. the `VITE_PC2_DRYRUN_TOOLS` visibility flag name/mechanism) | V2-E3 start | 🔴 pending |
| O2 | **Before adding any outbound HTTP call** from Core (even to `localhost`) | V2-E5 (code introducing the POST) | 🔴 pending |
| O3 | **Before running n8n locally driven from Core** (first actual dispatch session) | V2-E5 (execution) | 🔴 pending |
| O4 | **Before using Supabase staging** for any dry-run ingest (otherwise everything stays localStorage) | optional V2-E5+ extension; ALSO requires V2-D checkpoint A | 🔴 pending |
| O5 | **Before any real connector** (production URL, secret, live posting/ads/messaging) | outside V2-E entirely; per-connector written sign-off (V2-F) | 🔴 pending — no V2-E phase may request this |

Approvals must be logged in `CURRENT_PHASE.md` + `08_logs/phase_log.md` before the gated work starts (V2-A/V2-C/V2-D standing rule).

---

## 10. Non-goals (restated)

- No webhook receiver/serverless function, no callback auth secrets (`WEBHOOK_SHARED_SECRET` etc.) — future phase, not V2-E.
- No Group F Supabase wiring, no report wiring, no production Supabase use ever in V2-E.
- No PC2 workflow edits from Core; PC2-side gap closures (V2-E1 §8 a–c + partial_failure examples) are PC2 workstream tasks.
- No automation that runs without a human clicking it in a dev-only, default-hidden surface.
