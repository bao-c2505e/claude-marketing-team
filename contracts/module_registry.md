# Module Registry

This document lists all active specialist modules integrated under the PC2 workstream.

---

## Registry Entries

### 1. Creative Asset Pipeline
*   **module_id:** `creative_asset_comfyui`
*   **module_name:** ComfyUI Image Generation Pipeline
*   **local_base_url:** `http://localhost:8188`
*   **health_endpoint:** `http://localhost:8188/health`
*   **health_check_required:** `true`
*   **supported_event_type:** `creative_asset.requested`
*   **endpoints:**
    *   `GET /health`
    *   `POST /run`
    *   `POST /simulate-callback`
*   **current_mode:** `local_stub`
*   **real_api_enabled:** `false`
*   **owner_approval_required:** `true`

### 2. Content Pack Generator
*   **module_id:** `content_pack_generator`
*   **module_name:** Social Content Pack Generator Stub
*   **local_base_url:** `http://localhost:8191`
*   **health_endpoint:** `http://localhost:8191/health`
*   **health_check_required:** `true`
*   **supported_event_type:** `content_pack.requested`
*   **endpoints:**
    *   `GET /health`
    *   `POST /run`
    *   `POST /simulate-callback`
*   **current_mode:** `local_stub`
*   **real_api_enabled:** `false`
*   **owner_approval_required:** `true`

### 3. Ads Pack Generator
*   **module_id:** `ads_pack_generator`
*   **module_name:** Advertising Creative Pack Generator Stub
*   **local_base_url:** `http://localhost:8192`
*   **health_endpoint:** `http://localhost:8192/health`
*   **health_check_required:** `true`
*   **supported_event_type:** `ads_pack.requested`
*   **endpoints:**
    *   `GET /health`
    *   `POST /run`
    *   `POST /simulate-callback`
*   **current_mode:** `local_stub`
*   **real_api_enabled:** `false`
*   **owner_approval_required:** `true`

### 4. CRM Follow-up Generator
*   **module_id:** `crm_followup_generator`
*   **module_name:** CRM Sequence Draft Generator Stub
*   **local_base_url:** `http://localhost:8193`
*   **health_endpoint:** `http://localhost:8193/health`
*   **health_check_required:** `true`
*   **supported_event_type:** `crm_followup.requested`
*   **endpoints:**
    *   `GET /health`
    *   `POST /run`
    *   `POST /simulate-callback`
*   **current_mode:** `local_stub`
*   **real_api_enabled:** `false`
*   **owner_approval_required:** `true`

### 5. Analytics Report Generator
*   **module_id:** `analytics_report_generator`
*   **module_name:** Performance Analytics Report Stub
*   **local_base_url:** `http://localhost:8194`
*   **health_endpoint:** `http://localhost:8194/health`
*   **health_check_required:** `true`
*   **supported_event_type:** `analytics_report.requested`
*   **endpoints:**
    *   `GET /health`
    *   `POST /run`
    *   `POST /simulate-callback`
*   **current_mode:** `local_stub`
*   **real_api_enabled:** `false`
*   **owner_approval_required:** `true`

---

## Integration Notes (Phase N7)
- The Phase N7 integration workflow (`n7_full_multi_module_stub_integration.workflow.json`) connects to these local stubs via their `POST /run` endpoints.
- `real_api_enabled` remains `false` across all modules.
- `owner_approval_required` remains `true` across all modules.
- `current_mode` remains `mock` or `local_stub` across all modules. No production URL or real-world actions are enabled.

## Integration Notes (Phase N8)
- All specialist module callback payloads must route through the Unified Callback Approval Gate workflow (`n8_unified_callback_approval_gate.workflow.json`).
- Callbacks from stubs are normalized into the `unified_callback_v0.1` format, and checked against the approval gate before final callback dispatch is mocked.
- Rejection, revision, and pending states are routed to mock endpoints or queues without hitting real customer-facing integrations or firing live callbacks to Core callback URLs.

## Integration Notes (Phase N9)
- All module failures must produce a standardized error object and execution log before future Core callback using the specifications in [error_handling_retry_logging_contract.md](file:///c:/Users/DELL/claude-marketing-team/contracts/error_handling_retry_logging_contract.md).

## Integration Notes (Phase N10)
- The health checking workflow (`n10_module_health_check.workflow.json`) queries each module's `health_endpoint` (`GET /health`) to build aggregate readiness statuses and dashboard reports.
- Checking health is required prior to router executions in future phases.
