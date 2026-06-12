# V2-E1 — Core ↔ PC2 Contract Mapping Spec

**Status:** 📋 MAPPING SPEC ONLY — no runtime integration exists or is implemented by this document.
**Date:** 2026-06-12
**Workstream:** Post-MVP / Ver2 — Core (PC1) ↔ PC2 n8n/modules mock backbone
**Owner approval required before any implementation (V2-E2).**

> **Naming note:** Owner calls this package **V2-E** (V2-E1 = mapping spec, V2-E2 = dry-run implementation, Owner-gated). In `PHASE_19_VER2_ROADMAP.md`, the PC2 n8n dry-run package was listed as **roadmap-V2-C** and "V2-E" was UI polish. This document follows the Owner's naming — same precedent as V2-B/V2-C/V2-D.

> [!IMPORTANT]
> **This phase is documentation/contract mapping only.** Nothing in this spec:
> - implements runtime integration, calls n8n, or fires any HTTP request;
> - adds secrets, env values, or live connectors;
> - enables real ads, posting, messaging, or production automation;
> - changes Supabase runtime behavior, repository logic, auth flow, UUID gating, tenant scope, sanitizers, or RLS.
>
> Every endpoint, payload, and route in this document describes the **future V2-E2 dry-run shape** mapped against the PC2 mock contracts as they exist at PC2 N12 (`contracts/pc2_validation_manifest.json`, status `stabilized_mock_ready`).

---

## 0. Source Documents (canonical inputs to this mapping)

| Side | Document | Role |
|---|---|---|
| PC2 | `contracts/core_to_n8n_event.schema.json` | Core→n8n event envelope (JSON Schema, UPPERCASE event types) |
| PC2 | `contracts/e2e_dry_run_contract.md` | N11 dry-run envelope `e2e_dry_run_v0.1` (lowercase `*.requested` event types) + final output schema |
| PC2 | `contracts/module_to_core_callback.schema.json` | Module/n8n→Core callback envelope (JSON Schema) |
| PC2 | `contracts/unified_callback_contract.md` | `unified_callback_v0.1` callback preview + approval decision schema |
| PC2 | `contracts/error_handling_retry_logging_contract.md` | `error_retry_logging_v0.1` error / retry / dead-letter / log objects |
| PC2 | `contracts/event_types.md`, `contracts/callback_statuses.md` | Legacy event/status vocabulary (UPPERCASE) |
| PC2 | `contracts/module_registry.md` | 5 module stubs, localhost ports, modes |
| PC2 | `docs/pc2/pc2_handoff_to_core_integration.md` | N12 handoff: callback endpoint / approval-state / module-output ingestion mapping (all TBD) |
| Core | `src/types/core.ts` | Core entity types |
| Core | `src/lib/core/coreRepository.ts`, `supabaseRepositories.ts`, `repoRouting.ts` | Wired Supabase tables + UUID gating rules |
| Core | `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md` | Wired-vs-legacy table duality, RLS posture |

**Contract version vocabulary.** PC2 carries two envelope generations: the legacy JSON-Schema envelopes (`CoreToN8nEvent` / `ModuleToCoreCallback`, UPPERCASE event types and statuses) and the N11 dry-run generation (`e2e_dry_run_v0.1` request envelope + `unified_callback_v0.1` callback preview, lowercase `*.requested` event types). **For V2-E2 dry-run mapping, the N11 generation is canonical** — it is what `n11_e2e_dry_run.workflow.json` actually validates and emits. The UPPERCASE vocabulary is recorded here only where a field must be cross-walked.

---

## 1. Core → PC2 Event Mapping

### 1.1 Core event types → PC2 event types → expected n8n route

| # | Core trigger (UI/repo action) | Core event type (proposed) | PC2 `event_type` | PC2 target module | n8n workflow route | Dry-run allowed in V2-E2 |
|---|---|---|---|---|---|---|
| E1 | Content plan generation requested (`content_plan_jobs` create) | `core.content_generation.requested` | `content_pack.requested` | `content_pack_generator` (`localhost:8191`) | `n11_e2e_dry_run` → router → content-pack stub | ✅ yes (mock only) |
| E2 | Creative/visual asset generation requested | `core.creative_asset.requested` | `creative_asset.requested` | `creative_asset_comfyui` (`localhost:8188`) | `n11_e2e_dry_run` → router → ComfyUI stub | ✅ yes (mock only) |
| E3 | Ads draft pack requested | `core.ads_pack.requested` | `ads_pack.requested` | `ads_pack_generator` (`localhost:8192`) | `n11_e2e_dry_run` → router → ads-pack stub | ✅ yes — **draft pack only, never live ads** |
| E4 | CRM follow-up draft requested | `core.crm_followup.requested` | `crm_followup.requested` | `crm_followup_generator` (`localhost:8193`) | `n11_e2e_dry_run` → router → CRM stub | ✅ yes — **drafts only, never sent** |
| E5 | Analytics/report preview requested | `core.analytics_report.requested` | `analytics_report.requested` | `analytics_report_generator` (`localhost:8194`) | `n11_e2e_dry_run` → router → analytics stub | ✅ yes (static mock data) |
| E6 | Approval decision propagated to PC2 | `core.approval.decision` | (approval decision object, §3.6 — not a router event) | `n8_unified_callback_approval_gate` | approval gate workflow | ✅ yes (simulated decision) |
| E7 | Publish requested | `core.publish.requested` | — **BLOCKED** | — | — | 🚫 **NO route exists; planning status only (§4)** |
| E8 | Ads spend / activation requested | `core.ads_spend.requested` | — **BLOCKED** | — | — | 🚫 **NO route exists; planning status only (§4)** |
| E9 | Customer messaging send requested | `core.messaging.send.requested` | — **BLOCKED** | — | — | 🚫 **NO route exists; planning status only (§4)** |

Unmapped/unknown event types must be rejected by the PC2 router as `unsupported_event_type` → `final_status: "unsupported_event_type"` (N11 contract §5) — Core must treat that as a terminal mock failure, never retry into a different route.

> Legacy cross-walk (record only, not used by V2-E2): `CONTENT_GENERATION_REQUESTED`≈E1, `DESIGN_ASSET_REQUESTED`/`COMFYUI_GENERATION_REQUESTED`≈E2, `ADS_PACK_REQUESTED`≈E3, `INBOX_REPLY_DRAFT_REQUESTED`≈E4, `ANALYTICS_REPORT_REQUESTED`≈E5, `APPROVAL_STATUS_CHANGED`≈E6, `CAMPAIGN_PUBLISH_REQUESTED`≈E7 (blocked), `ADS_SPEND_REQUESTED`≈E8 (blocked), `BILLING_SYNC_REQUESTED` — out of Ver2 scope entirely.

### 1.2 Core → PC2 event envelope (required payload fields)

Base envelope = PC2 `e2e_dry_run_v0.1`, **extended** with a `core_scope` object and a `safety` object. PC2's N11 envelope only carries `brand_id` + `campaign_id`; Core's tenant model is deeper, so the full scope rides in `core_scope` (additive — PC2 router keys on the existing top-level fields and ignores unknown extension keys until V2-E2 updates the validator).

```jsonc
{
  // ---- PC2 e2e_dry_run_v0.1 base (unchanged, required by PC2 validator) ----
  "contract_version": "e2e_dry_run_v0.1",
  "event_type": "content_pack.requested",          // §1.1 column "PC2 event_type"
  "request_id": "<uuid-v4>",                        // NEW per request; primary correlation ID
  "brand_id": "<core brands.id UUID>",              // mock runs may keep "brand_demo_001"
  "campaign_id": "<core campaigns.id UUID>",
  "requested_by": "<core auth user id or email>",
  "callback_url": "<local/mock URL only in dry-run>",
  "payload": { /* event-specific input, see §1.5 */ },
  "metadata": {},

  // ---- Core extension: full tenant scope (required for every event) ----
  "core_scope": {
    "client_id": "<core clients.id UUID>",          // REQUIRED always
    "brand_id": "<core brands.id UUID>",            // REQUIRED always (mirror of top-level)
    "campaign_id": "<core campaigns.id UUID>",      // REQUIRED always
    "brief_id": "<core campaign_briefs.id UUID | null>",          // required for E1–E3 if generation is brief-driven
    "generation_id": "<core content_plan_jobs.id UUID | null>",   // required for E1/E2 when a job row exists
    "content_item_id": "<core content_plan_items.id UUID | null>",// when event concerns one item
    "asset_collection_id": "<core content_asset_collections.id UUID | null>"
  },

  // ---- Core extension: run-mode + safety flags (required for every event) ----
  "mode": {
    "dry_run": true,                 // MUST be true for all of V2-E2; false is reserved for a future Owner-approved phase
    "environment": "local_mock"      // "local_mock" only in V2-E2; "staging"/"production" forbidden
  },
  "approval_required": true,         // MUST be true for E1–E5 (every generated output passes the Core approval gate)
  "safety": {
    "no_auto_post": true,            // MUST be true — no value other than true is valid in Ver2
    "no_real_ads": true,             // MUST be true
    "no_real_messaging": true,       // MUST be true
    "no_live_connectors": true       // MUST be true
  },

  // ---- Core extension: idempotency ----
  "idempotency_key": "<request_id reused, or '<request_id>:<attempt>'>"
}
```

Cross-walk to PC2's legacy `safety` block (for the day the JSON-Schema envelope is reconciled): `no_auto_post` ⇔ `allow_auto_publish: false`; `no_real_ads` ⇔ `allow_ads_spend: false`; `no_real_messaging` ⇔ `allow_customer_messaging: false`; `no_live_connectors` ⇔ `allow_real_world_action: false`; `approval_required` ⇔ `requires_approval: true` with `final_approval_granted: false` at dispatch time. **In Ver2 the four `allow_*` flags are constants (`false`); any event carrying a `true` value is invalid and PC2 must answer `REJECTED_BY_SAFETY` / `failed_mock`.**

### 1.3 Tenant/scope field rules

| Field | Source of truth (Core) | Required | UUID required for Supabase routing |
|---|---|---|---|
| `client_id` | `clients.id` | ✅ always | ✅ |
| `brand_id` | `brands.id` | ✅ always | ✅ |
| `campaign_id` | `campaigns.id` | ✅ always | ✅ |
| `brief_id` | `campaign_briefs.id` | when generation is brief-driven (E1–E3) | ✅ or explicit `null` |
| `generation_id` | `content_plan_jobs.id` | when a generation job row exists (E1/E2) | ✅ or explicit `null` |
| `content_item_id` | `content_plan_items.id` | when event concerns a single item | ✅ or explicit `null` |
| `asset_collection_id` | `content_asset_collections.id` | when output should land in a collection | ✅ or explicit `null` |

Scope follows the same hierarchy already enforced by Core RLS (`client → brand → campaign → brief → generation → content_item`, Phase 16C/16D): a child ID may only appear together with all of its ancestors, and the ancestors must be the child's real parents. PC2 never validates this hierarchy — **Core validates before dispatch** (same predicate family as `repoRouting.ts`).

### 1.4 ID-format rule (col-*/local IDs)

Core's demo/localStorage mode uses local IDs (`col-*`, `collection-*`, `asset-collection-*`, `approval-*`, `item-*`, `generation-*`, `job-*`, `client-*`, `brand-*`, `campaign-*`, `brief-*`…). **These IDs must never appear in any Core→PC2 event or PC2→Core callback that would be persisted to Supabase.** Rule: an event may only be dispatched to PC2 if every non-null scope ID passes the same `isUuid()` gate used by `repoRouting.ts`. If any scope ID is local-format, the entity is demo-local and has no PC2 integration path — the dispatch is skipped, not translated.

### 1.5 Event-specific `payload` minimums

| Event | Required `payload` fields |
|---|---|
| E1 `content_pack.requested` | `brief_summary` (string), `pillars` (array), `quantity` (int), `platforms` (array) |
| E2 `creative_asset.requested` | `asset_type` (`"image"`/`"video"`), `creative_brief` (string), `dimensions` (string, optional) |
| E3 `ads_pack.requested` | `objective` (string), `platforms` (array), `budget_note` (string — informational only, **never a spend instruction**) |
| E4 `crm_followup.requested` | `scenario` (string), `tone` (string), `audience_note` (string) |
| E5 `analytics_report.requested` | `report_type` (string), `period_start`/`period_end` (ISO dates) |

---

## 2. PC2 → Core Callback Mapping

### 2.1 Callback envelope (unified_callback_v0.1 + Core extensions)

Canonical shape = PC2 `unified_callback_contract.md` §2, extended with correlation/idempotency fields Core requires:

```jsonc
{
  // ---- PC2 unified_callback_v0.1 base ----
  "contract_version": "unified_callback_v0.1",
  "request_id": "<uuid — MUST equal the originating event's request_id>",
  "event_type": "content_pack.requested",
  "brand_id": "<echo of dispatched brand_id>",
  "campaign_id": "<echo of dispatched campaign_id>",
  "module_id": "content_pack_generator",            // §1.1 module column
  "module_status": "mock_completed",                // mock_completed | completed | failed | skipped
  "approval_status": "pending_approval",            // pending_approval | approved | rejected | needs_revision
  "output": { /* module output object, §2.2 */ },
  "errors": [],                                     // array of strings; non-empty only on failure paths
  "metadata": {},
  "source": "n8n_n11_e2e_dry_run_mock",             // must be an allowed source (§2.5)
  "generated_at": "<ISO-8601>",
  "notes": "<remarks/disclaimers>",

  // ---- Core extension: correlation block (required by Core ingestion) ----
  "correlation": {
    "request_id": "<same as top-level>",
    "run_id": "<uuid — PC2 N11 run_id (execution instance)>",
    "workflow_id": "<n8n workflow file id, e.g. 'n11_e2e_dry_run'>",
    "module_id": "<same as top-level>",
    "idempotency_key": "<echo of dispatched idempotency_key>"
  },

  // ---- Core extension: echo of tenant scope (required; must equal dispatched core_scope) ----
  "core_scope": { /* identical shape to §1.2 core_scope */ },

  // ---- Optional structured objects (exactly as defined by PC2 contracts) ----
  "error_result": { /* N9 error object, §2.3 — null unless failed */ },
  "retry_summary": { /* { attempt, max_attempts, strategy } — null if first-try success */ },
  "dead_letter": { /* N9 dead-letter wrapper §6 — null unless exhausted/manual_review_required */ },
  "approval_decision": { /* approval decision object, §2.4 — only on E6 decision callbacks */ }
}
```

**Callback status field:** Core keys off `module_status` × `approval_status` × (`error_result` present?) per the §4 status table. The N11 `final_status` (`completed_mock` / `waiting_for_owner_approval` / `revision_required` / `stopped_rejected` / `failed_mock` / `blocked_module_unavailable` / `unsupported_event_type`) is logged verbatim for audit and must be consistent with the §4 mapping — on conflict, Core treats the callback as invalid (no entity write, log-only).

### 2.2 Module `output` object

Per `unified_callback_v0.1` the `output` object is module-shaped. Minimum Core ingestion requirements:

| Module | `output` minimum fields | Core lands in (§5) |
|---|---|---|
| `content_pack_generator` | `items[]` (each: `title`, `body`, `content_type`, `platform`, `day_number?`) | `content_plan_items` (draft) |
| `creative_asset_comfyui` | `assets[]` (each: `name`, `asset_type`, `url`/`path` (mock), `thumbnail?`, `mime_type?`) | `content_assets` (metadata-only in Ver2) |
| `ads_pack_generator` | `ad_drafts[]` (each: `headline`, `primary_text`, `cta`, `platform`, `format`) | `content_plan_items` (`content_type: 'ad_copy'`, draft) |
| `crm_followup_generator` | `drafts[]` (each: `step`, `channel`, `subject?`, `body`) | `content_plan_items` (draft; **never dispatched**) |
| `analytics_report_generator` | `report` (`title`, `summary`, `metrics[]` with `is_estimated: true`) | report preview (localStorage-only in Ver2, §5 note) |

### 2.3 Error object / retry / dead-letter (failure callbacks)

Adopted verbatim from `error_retry_logging_v0.1`:

- **`error_result`** (§2 of that contract): `contract_version`, `request_id`, `event_type`, `brand_id`, `campaign_id`, `module_id`, `error_type` (one of `http_error|timeout|validation_error|unsupported_event_type|module_unavailable|schema_mismatch|unknown_error`), `error_code`, `error_message`, `retryable`, `attempt`, `max_attempts`, `next_action` (`retry|dead_letter|stop`), `timestamp`, `source`, `metadata`.
- **`retry_summary`**: `{ attempt, max_attempts, strategy }` (e.g. `mock_exponential_backoff`, max 3).
- **`dead_letter`** (§6): `dead_letter_id`, `request_id`, `event_type`, `module_id`, `error`, `attempts`, `final_status` (`exhausted_to_dead_letter | manual_review_required`), `source`, `created_at`, `notes`.

Core ingestion rule: any callback with non-null `error_result` is a **failure callback** — it can only land in logs and mark the generation job `failed`; it must never create/route an approval request (§6 V5) and never mutates content/asset rows.

### 2.4 Approval decision object (E6 / decision propagation)

Adopted verbatim from `unified_callback_v0.1` §4: `approval_id`, `request_id`, `decision` (`approved|rejected|needs_revision|pending`), `reviewer`, `reviewed_at`, `reason`, `revision_notes`, `safety_flags`, `next_action`. Decision→state mapping follows `unified_callback_v0.1` §5 (`approved → ready_for_mock_callback_preview`, `rejected → stopped_rejected`, `needs_revision → revision_required`, `pending → waiting_for_owner_approval`).

**Direction rule:** approval decisions originate **only in Core** (Owner/manager action in the Approvals UI). PC2's approval gate is a simulation surface; a PC2 callback carrying `approval_decision` can echo/preview a decision but **can never create or change a Core approval state** (§6 V6).

### 2.5 Callback acceptance preconditions (Core side, future V2-E2)

A callback is accepted for entity mapping only if ALL hold:
1. `contract_version == "unified_callback_v0.1"`.
2. `request_id` matches a Core-dispatched event (unknown `request_id` → log-only, no write).
3. `core_scope` echo equals the dispatched scope exactly (any drift → reject `schema_mismatch`).
4. All non-null scope IDs are UUIDs (§1.4).
5. `idempotency_key` present; a key already processed → idempotent no-op (return prior result, no duplicate rows) (§6 V7).
6. `source` is in the allowed set (`n8n_n11_e2e_dry_run_mock`, `n8n_n8_approval_gate_mock`, `local_mock_stub`, `n8n_n7_full_multi_module_stub_integration`).
7. Status triple is consistent with §4.

---

## 3. (merged into §2 — section kept for task numbering parity)

Callback payload fields → §2.1; callback status → §2.1/§4; module output object → §2.2; error object → §2.3; retry/dead-letter → §2.3; approval decision object → §2.4; correlation IDs (`request_id`, `run_id`, `workflow_id`, `module_id`, `idempotency_key`) → §2.1 `correlation` block.

---

## 4. Status Mapping Table (unified)

Single source of truth for V2-E2. "PC2 triple" = (`module_status`, `approval_status`, `error_result?`); Core columns show the wired entity statuses (`content_plan_jobs.status` = `JobStatus`, `content_plan_items.status` = `ContentStatus`, `content_approval_requests.status` = `ApprovalStatus`).

| Unified status | PC2 triple / `final_status` | Core `content_plan_jobs` | Core `content_plan_items` | Core approval request | Routes to approval? | Notes |
|---|---|---|---|---|---|---|
| `success` | `completed`/`mock_completed` + no error | `completed` | — | — | per `approval_required` (always true E1–E5) | transport-level success; refine to `generated` |
| `generated` | `mock_completed` + `pending_approval` | `completed` | `generated` | created as `pending` | ✅ yes | the normal happy path landing state |
| `pending_approval` | `waiting_for_owner_approval` | `completed` | `needs_review` | `pending` | ✅ (already there) | waiting on Owner/manager in Core UI |
| `needs_revision` | `revision_required` / decision `needs_revision` | `completed` | `revision_requested` | `revision_requested` | stays in approval flow | revision notes from §2.4 `revision_notes` |
| `rejected` | `stopped_rejected` / decision `rejected` | `completed` | `rejected` | `rejected` | terminal in approval flow | reason logged from §2.4 `reason` |
| `approved` | decision `approved` (Core-originated only) | `completed` | `approved` | `approved` | terminal in approval flow | **approval happens in Core UI only (§2.4)**; PC2 echo is non-authoritative |
| `failed_mock` | `failed`/`failed_mock`/`blocked_module_unavailable`/`unsupported_event_type` + `error_result` | `failed` | — (no items written) | **NONE — must never create approval** (§6 V5) | 🚫 never | logs + error surface only |
| `partial_failure` | `mock_completed` with non-empty `errors[]` (some outputs OK) | `completed` (with `error_message` note) | successful items `generated`; failed ones not written | created `pending` for successful items only | ✅ for successful outputs only | failed sub-outputs follow `failed_mock` rules |
| `published` | — | — | — | — | 🚫 **BLOCKED** | **No event, route, or callback may produce `published` in Ver2.** `ContentStatus 'published'` is unreachable via PC2. Planning/record use only. |
| `planned_publish` | — | — | `scheduled` (calendar planning only) | requires prior `approved` | 🚫 no external action | a calendar/planning marker; **never** triggers posting |

Status-vocabulary cross-walk (legacy UPPERCASE → unified): `COMPLETED→success/generated`, `NEEDS_REVIEW→pending_approval`, `APPROVED→approved`, `REJECTED→rejected`, `FAILED→failed_mock`, `REJECTED_BY_SAFETY→failed_mock` (with `error_code: ERR_SAFETY_GATE`), `INVALID_CONTRACT→failed_mock` (with `error_type: validation_error`), `CANCELLED→failed_mock` (terminal, no approval), `RECEIVED/VALIDATING/QUEUED/RUNNING→` transient, log-only, no Core entity transition.

---

## 5. PC2 Outputs → Core Entity Mapping

Wired Supabase tables only (extension tables from Phases 16B–16D — **legacy Phase-2 tables `generation_jobs`/`content_items`/`approval_*`/`assets` stay untouched/empty**, per V2-D1 finding #1):

| PC2 output | Core entity (wired table) | Mapping rule |
|---|---|---|
| Dispatch acknowledged / run started | `content_plan_jobs` (= **content_generations**) | The Core generation job row IS the request record: `id = core_scope.generation_id`; store `request_id`, `run_id`, `workflow_id`, `module_id`, `idempotency_key` in job metadata/columns (V2-E2 decides additive columns vs metadata JSON — **additive migration only if needed, separate Owner-approved change**) |
| `content_pack_generator.output.items[]`, `ads_pack_generator.output.ad_drafts[]`, `crm_followup_generator.output.drafts[]` | `content_plan_items` (= **content_items**) | one row per item, `status: 'generated'`, full scope chain from `core_scope`; CRM drafts flagged via metadata `{channel, never_send: true}` |
| `creative_asset_comfyui.output.assets[]` | `content_assets` (+ optional `content_asset_collections` = **asset_collections**) | metadata-only rows in Ver2 (`source_type: 'generated_placeholder'`, mock URL/path in `url`); collection only if `core_scope.asset_collection_id` is a UUID |
| Any callback that passes §2.5 with `approval_required` and not failed | `content_approval_requests` (= **approval_requests**) + `content_approval_events` | request `pending` per generated item batch; events appended on each Core decision; **PC2 callbacks never write events directly** |
| Every callback (success or failure), every retry, every dead-letter | callback/module/automation logs | **Group F tables (`module_events`, `webhook_callbacks`, `automation_logs`) exist in schema_v1 but have NO repo wiring (V2-D1 finding #6).** In V2-E2, log to the existing localStorage `AutomationLog` surface; Supabase wiring of Group F is a separate future phase. Field mapping reserved: callback→`webhook_callbacks` (payload, source, is_processed), run states→`module_events` (event_type, status, payload_summary), audit lines→`automation_logs` (N9 log-entry fields §5) |
| `analytics_report_generator.output.report` | reports/exports | Reports are **not Supabase-wired** (Calendar/Reports are localStorage-only — V2-D1 finding #7). V2-E2 may render the report preview in the existing local Reports surface only; `metrics[].is_estimated` must be `true` |

---

## 6. Validation Requirements (normative for V2-E2)

| # | Rule |
|---|---|
| V1 | **Tenant scope always present:** every Core→PC2 event carries `core_scope` with non-null `client_id`, `brand_id`, `campaign_id`; deeper IDs explicit (`UUID` or `null`), hierarchy-consistent (§1.3). |
| V2 | **UUIDs only toward Supabase:** every ID routed to Supabase (event scope or callback echo) passes `isUuid()`; same predicate family as `repoRouting.ts`. |
| V3 | **Local IDs stay local:** `col-*` and all other local/demo ID formats never cross the Core↔PC2 boundary for persistable flows; demo-local entities have no PC2 path (§1.4). |
| V4 | **Idempotency key required:** every event carries `idempotency_key`; every callback echoes it; Core deduplicates repeated callbacks on it (§2.5.5); PC2 retries reuse the same key with incremented `attempt`. |
| V5 | **`failed_mock` never routes to approval:** any failure status (`failed`, `failed_mock`, `blocked_module_unavailable`, `unsupported_event_type`, `REJECTED_BY_SAFETY`, `INVALID_CONTRACT`, `CANCELLED`) terminates in logs; no approval request row is created or transitioned. Mirrors PC2's own fail-safe routing (handoff §8). |
| V6 | **No callback can bypass approval:** no PC2 callback may set an item/approval to `approved` (or any post-approval state). Approval transitions originate exclusively from authenticated Core UI actions under existing RLS. PC2 `approval_decision` objects are preview/echo only. |
| V7 | **Publish/ads/messaging stay blocked:** E7–E9 have no PC2 route; `published` is unreachable via callback; `planned_publish`/`scheduled` is a planning marker only (§4). Any event/callback carrying `allow_auto_publish|allow_ads_spend|allow_customer_messaging|allow_real_world_action = true` is invalid → `failed_mock`. |
| V8 | **Status must match unified callback preview:** the §4 table is the single status authority; `module_status`×`approval_status`×`error_result` must be mutually consistent and consistent with N11 `final_status`; conflicts → callback rejected (log-only, `schema_mismatch`). |
| V9 | **Safety flags constant:** `safety.no_auto_post`, `no_real_ads`, `no_real_messaging`, `no_live_connectors` are `true` on every event in Ver2; `approval_required: true` for E1–E5; `mode.dry_run: true` and `mode.environment: "local_mock"` for all of V2-E2. |

---

## 7. Integration Boundary

| Phase | Scope | Gate |
|---|---|---|
| **V2-E1 (this doc)** | Mapping/contract documentation ONLY. No code, no runtime, no n8n calls, no secrets, no Supabase change. | Done at commit of this spec. |
| **V2-E2 (next, NOT started)** | **Dry-run only** implementation against local mock stubs per this spec: local/mock URLs only, `mode.dry_run: true` enforced, kill-switch env gate, no secrets in repo (env names per `core_pc2_integration_contract_stub.md` "TBD" list, values never committed). | 🔴 **Requires explicit Owner approval BEFORE any implementation starts.** Closure requires executed-evidence + Owner sign-off (standing rule from V2-A/V2-C/V2-D). |
| **Real connector activation** | Live n8n endpoint, real callback auth (`CALLBACK_SIGNING_SECRET` etc.), any non-mock module, any production URL. | 🔴 **Outside V2-E entirely.** Requires a later dedicated phase + per-connector written Owner sign-off (V2-F framework). No real connector goes live in Ver2. |

---

## 8. PC2 Handoff Checklist (what Core consumes from PC2 N12)

| Item | Location | Status |
|---|---|---|
| Workflow JSON (canonical dry-run) | `n8n-workflows/n11_e2e_dry_run.workflow.json` (plus n4/n5/n7/n8/n9/n10 components) | ✅ present |
| Scenario payload examples | `contracts/examples/` — `valid_core_to_n8n_event.json`, `invalid_core_to_n8n_event.json`, `valid_module_callback.json`, `rejected_by_safety_callback.json`, `examples/modules/*` (ComfyUI completed/failed, safety-rejected ads/publisher), `examples/n8n/*` (n4–n11 scenarios) | ✅ present |
| Expected outputs | `contracts/e2e_dry_run_contract.md` §5 final output schema + `examples/n8n/n11/*` previews | ✅ present |
| Validator command | `node contracts/tools/validate_contracts.js` (re-run 2026-06-12: **ALL CHECKS PASSED**, incl. N12 handoff compliance) | ✅ verified |
| Known limitations | `docs/pc2/pc2_handoff_to_core_integration.md` §7 (no real callbacks/webhooks/credentials/posting/ads/messaging/analytics) + §6 TBDs (auth, persistence, env) | ✅ recorded |
| Module registry | `contracts/module_registry.md` — 5 stubs, all `real_api_enabled: false`, `owner_approval_required: true`, `current_mode: local_stub` | ✅ present |
| Callback preview contract | `contracts/unified_callback_contract.md` (`unified_callback_v0.1`) + `contracts/module_to_core_callback.schema.json` (legacy schema) | ✅ present |
| PC2 phase status | `contracts/pc2_validation_manifest.json` — N1–N12 DONE/PASS, `stabilized_mock_ready`; N12 = "integration-ready handoff only, not production connector release" | ✅ confirmed |

**Gaps PC2 must close before/during V2-E2** (tracked, not blockers for V2-E1): (a) N11 envelope validator does not yet validate the `core_scope`/`mode`/`safety`/`idempotency_key` extensions in §1.2 — additive validator update needed; (b) callback auth method is TBD (`CALLBACK_AUTH_METHOD`/`CALLBACK_SIGNING_SECRET` placeholders — values only in approved secret store, never repo); (c) `brand_id` strictness (`brand_demo_001`) must be relaxed to accept UUID echo in dry-run mode.

---

## 9. Out of Scope / Non-Goals (restated)

- No runtime integration, no n8n call, no module stub launched by this phase.
- No secrets, env values, tokens, or live connectors.
- No real posting, ads, messaging, billing, or production automation — in any phase of Ver2.
- No Supabase runtime/schema/RLS change; no repository/auth/UUID-gating/sanitizer change.
- Group F (module/callback tables) Supabase wiring, report wiring, and production callback auth are all future, separately-gated work.
