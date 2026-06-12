# PC2 Handoff Summary for Core Mapping

This document provides a concise reference for the Core team to map and integrate the PC2 automation workflows (`n8n` + specialist modules + contracts). 

> [!IMPORTANT]
> **Safety Boundary Reminder**: The PC2 workstream operates entirely in a mock/dry-run local sandbox. It does not use real external connectors, secrets, production URLs, credentials, or actual Core production APIs. No real ads spend, publishing, or customer messaging is executed. Transitioning to a live integration requires explicit owner approval.

---

## 1. Workflow Files and Repository-Relative Paths

The PC2 automation backbone consists of the following workflows located in the repository:

* **E2E Dry Run**: `n8n-workflows/n11_e2e_dry_run.workflow.json`
  * Stitches the router, health verification, module runner, unified callbacks, approval gate, and error logging into a single local validation workflow.
* **Module Health Check**: `n8n-workflows/n10_module_health_check.workflow.json`
  * Checks health status for all registered modules and produces aggregate status dashboards.
* **Error & Retry Handling**: `n8n-workflows/n9_error_retry_logging.workflow.json`
  * Performs standard error envelope creation, retry evaluation, logging, and dead-letter queueing.
* **Callback & Approval Gate**: `n8n-workflows/n8_unified_callback_approval_gate.workflow.json`
  * Normalizes module output and evaluates manual/system approval decisions.
* **Full Multi-Module Integration**: `n8n-workflows/n7_full_multi_module_stub_integration.workflow.json`
  * Connects the event router directly to local mock stubs for execution.
* **Multi-Module Router**: `n8n-workflows/n5_multi_module_event_router.workflow.json`
  * Directs incoming events to target workflows based on the event type.
* **ComfyUI Integration Test**: `n8n-workflows/n4_comfyui_stub_integration_test.workflow.json`
  * Basic integration verification node for the ComfyUI local pipeline stub.
* **Core Event Router**: `n8n-workflows/core_event_router.workflow.json`
  * Handles routing of inbound events from the Core system trigger.
* **Module Callback to Core**: `n8n-workflows/module_result_callback_to_core.workflow.json`
  * Prepares outbound callback preview payloads.
* **Approved Design to ComfyUI**: `n8n-workflows/approved_design_to_comfyui.workflow.json`
  * Directs approved inputs to the ComfyUI image generator.

---

## 2. Supported Event Types

The n8n router inspects incoming event envelopes and routes them based on the `event_type` field. The 5 supported event types are:

1. `creative_asset.requested`: Triggers ComfyUI image generation.
2. `content_pack.requested`: Triggers social content pack drafts.
3. `ads_pack.requested`: Triggers advertising draft package generation.
4. `crm_followup.requested`: Triggers CRM mockup draft messages.
5. `analytics_report.requested`: Triggers performance report compiling.

---

## 3. Module Registry Summary

PC2 registers 5 specialist modules. In local/mock mode, all external connections are disabled, and mock stubs run on local ports:

| Module ID | Supported Event Type | Local `/run` Endpoint | Local `/health` Endpoint | Mode | Real APIs | Approval Gate |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `creative_asset_comfyui` | `creative_asset.requested` | `http://localhost:8188/run` | `http://localhost:8188/health` | `local_stub` | Disabled | Required |
| `content_pack_generator` | `content_pack.requested` | `http://localhost:8191/run` | `http://localhost:8191/health` | `local_stub` | Disabled | Required |
| `ads_pack_generator` | `ads_pack.requested` | `http://localhost:8192/run` | `http://localhost:8192/health` | `local_stub` | Disabled | Required |
| `crm_followup_generator` | `crm_followup.requested` | `http://localhost:8193/run` | `http://localhost:8193/health` | `local_stub` | Disabled | Required |
| `analytics_report_generator` | `analytics_report.requested` | `http://localhost:8194/run` | `http://localhost:8194/health` | `local_stub` | Disabled | Required |

---

## 4. Callback Preview Contract

When an execution completes, n8n prepares a callback preview according to the `unified_callback_v0.1` format:

* **contract_version** (string): `"unified_callback_v0.1"`
* **request_id** (string): UUID matching the original event request.
* **event_type** (string): E.g., `creative_asset.requested`.
* **brand_id** (string): `"brand_demo_001"` (mock brand).
* **campaign_id** (string): Campaign ID.
* **module_id** (string): The executing module's ID.
* **module_status** (string): Status of execution (`mock_completed`, `failed`, `skipped`).
* **approval_status** (string): Current state (`pending_approval`, `approved`, `rejected`, `needs_revision`).
* **output** (object): Generated payload (e.g., mock asset paths or text variants).
* **errors** (array of strings): List of warning or error messages.
* **source** (string): Payload origin, e.g. `"n8n_n11_e2e_dry_run_mock"`.
* **generated_at** (string): ISO-8601 generation timestamp.

---

## 5. Scenario Payload Examples

### A. Input Event Envelope (Core Trigger)
This payload is dispatched from the Core system to trigger n8n:

```json
{
  "contract_version": "e2e_dry_run_v0.1",
  "event_type": "creative_asset.requested",
  "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
  "brand_id": "brand_demo_001",
  "campaign_id": "campaign_demo_001",
  "requested_by": "user_demo_001@example.com",
  "callback_url": "http://localhost:5678/mock-callback",
  "payload": {
    "asset_type": "image",
    "creative_brief": "A modern co-working space banner with glassmorphism effects",
    "dimensions": "1024x1024",
    "style_notes": "Vibrant accents, futuristic neon lighting"
  },
  "metadata": {
    "client": "local_dev_test",
    "workflow_engine": "n8n_v1"
  }
}
```

### B. Callback Preview Payload
This payload represents the normalized output from n8n to be ingested by Core:

```json
{
  "contract_version": "unified_callback_v0.1",
  "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
  "event_type": "creative_asset.requested",
  "brand_id": "brand_demo_001",
  "campaign_id": "campaign_demo_001",
  "module_id": "creative_asset_comfyui",
  "module_status": "mock_completed",
  "approval_status": "approved",
  "output": {
    "asset_preview": "mock://assets/workspace_generated_001.png",
    "mock_asset_url": "mock://assets/workspace_generated_001.png",
    "mock_output_path": "storage/assets/placeholder_workspace_001.png"
  },
  "errors": [],
  "metadata": {
    "workflow": "workspace_creative_v1"
  },
  "source": "n8n_n11_e2e_dry_run_mock",
  "generated_at": "2026-06-12T03:00:00Z",
  "notes": "Generated output ready for approval gate review."
}
```

---

## 6. Expected Outputs

### A. Success Output (Approved Asset Flow)
When a module succeeds and passes the approval gate:

```json
{
  "contract_version": "e2e_dry_run_v0.1",
  "run_id": "88a31e84-18f9-4475-a89c-8eb139f4a088",
  "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
  "event_type": "creative_asset.requested",
  "brand_id": "brand_demo_001",
  "campaign_id": "campaign_demo_001",
  "module_id": "creative_asset_comfyui",
  "health_status": "healthy",
  "route_status": "routed",
  "module_status": "completed",
  "approval_status": "approved",
  "final_status": "completed_mock",
  "module_response": {
    "status": "success",
    "output_file": "storage/assets/placeholder_workspace_001.png"
  },
  "unified_callback_preview": {
    "contract_version": "unified_callback_v0.1",
    "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
    "event_type": "creative_asset.requested",
    "brand_id": "brand_demo_001",
    "campaign_id": "campaign_demo_001",
    "module_id": "creative_asset_comfyui",
    "module_status": "mock_completed",
    "approval_status": "approved",
    "output": {
      "asset_preview": "mock://assets/workspace_generated_001.png",
      "mock_asset_url": "mock://assets/workspace_generated_001.png",
      "mock_output_path": "storage/assets/placeholder_workspace_001.png"
    },
    "errors": [],
    "metadata": {
      "workflow": "workspace_creative_v1"
    },
    "source": "n8n_n11_e2e_dry_run_mock",
    "generated_at": "2026-06-12T03:00:00Z"
  },
  "approval_result": {
    "approval_id": "app_dec_001_88921",
    "decision": "approved",
    "reviewer": "owner_mock",
    "reviewed_at": "2026-06-12T03:01:00Z",
    "reason": "All checks passed. Creative styling complies with mock requirements.",
    "revision_notes": "",
    "next_action": "ready_for_mock_callback_preview",
    "safety_flags": {
      "brand_safe": true,
      "copyright_clear": true,
      "no_secrets": true
    }
  },
  "error_result": null,
  "execution_trace": [
    "manual_trigger_received",
    "mock_event_loaded",
    "event_normalized",
    "target_module_resolved: creative_asset_comfyui",
    "health_check_passed: healthy",
    "module_stub_called: http://localhost:8188/run",
    "callback_payload_normalized",
    "approval_gate_passed: approved",
    "dry_run_completed"
  ],
  "source": "n8n_n11_e2e_dry_run_mock",
  "generated_at": "2026-06-12T03:02:00Z"
}
```

### B. Error Output (Unavailable Module Flow)
When a module fails the health check check before routing:

```json
{
  "contract_version": "e2e_dry_run_v0.1",
  "run_id": "34b31e84-18f9-4475-a89c-8eb139f4a094",
  "request_id": "348f9d5e-ca87-439f-a89c-8eb139f4a094",
  "event_type": "creative_asset.requested",
  "brand_id": "brand_demo_001",
  "campaign_id": "campaign_demo_001",
  "module_id": "creative_asset_comfyui",
  "health_status": "unavailable",
  "route_status": "failed_unavailable",
  "module_status": "not_called",
  "approval_status": "skipped",
  "final_status": "blocked_module_unavailable",
  "module_response": {},
  "unified_callback_preview": null,
  "approval_result": null,
  "error_result": {
    "contract_version": "error_retry_logging_v0.1",
    "request_id": "348f9d5e-ca87-439f-a89c-8eb139f4a094",
    "event_type": "creative_asset.requested",
    "brand_id": "brand_demo_001",
    "campaign_id": "campaign_demo_001",
    "module_id": "creative_asset_comfyui",
    "error_type": "module_unavailable",
    "error_code": "ERR_MODULE_HEALTH_CHECK_FAILED",
    "error_message": "Module creative_asset_comfyui is unavailable/degraded at health check preflight.",
    "retryable": true,
    "attempt": 1,
    "max_attempts": 3,
    "next_action": "retry_scheduled",
    "timestamp": "2026-06-12T03:00:00Z",
    "source": "n8n_n11_e2e_dry_run_mock",
    "metadata": {
      "health_check_url": "http://localhost:8188/health"
    }
  },
  "execution_trace": [
    "manual_trigger_received",
    "mock_event_loaded",
    "event_normalized",
    "target_module_resolved: creative_asset_comfyui",
    "health_check_failed: unavailable",
    "routing_blocked: module_unavailable",
    "error_callback_preview_generated"
  ],
  "source": "n8n_n11_e2e_dry_run_mock",
  "generated_at": "2026-06-12T03:02:00Z"
}
```

---

## 7. Validator Commands

To verify contract syntax, schema compliance, and workflow structures, run the validator script from the repository root:

```bash
node contracts/tools/validate_contracts.js
```

The validator performs static checks on all mock payloads under `contracts/examples/` against the JSON schemas, checks workflows for unreachable nodes, and asserts that no forbidden strings are present.

---

## 8. Status Mapping

During the Core system integration, the Core web interface maps n8n states into database entities and UI components:

* **pending_approval** &rarr; Maps to `waiting_for_owner_approval`. The generated preview draft is held in a Core review queue.
* **approved** &rarr; Maps to `completed_mock`. Assets are promoted to approved status. Note: Live posting/dispatch remains disabled in PC2.
* **rejected** &rarr; Maps to `stopped_rejected`. Processing halts and the rejection state is recorded along with reviewer notes.
* **needs_revision** &rarr; Maps to `revision_required`. The draft is returned to the authoring queue for manual modifications.
* **skipped / error states** &rarr; Maps to `blocked_module_unavailable` or other error statuses. Prevents draft advancement.

---

## 9. Failure/Error/Retry Routing

* **Allowed Error Types**: `http_error`, `timeout`, `validation_error`, `unsupported_event_type`, `module_unavailable`, `schema_mismatch`, `unknown_error`.
* **Retry Policy**:
  * Errors classified as transient (e.g. `http_error`, `timeout`, `module_unavailable`) are eligible for retry.
  * Validation and Unsupported Event errors immediately abort execution (`no_retry`).
  * Default maximum retries: `3`.
* **Dead-Letter Queue (DLQ)**:
  * When attempts are exhausted or a non-retryable error occurs, the task state is wrapped in a DLQ payload with a status of `"exhausted_to_dead_letter"` or `"manual_review_required"`.

---

## 10. Known Limitations

* **No Actual Generation GPU Calls**: Stubs simulate processing latencies and output preset mock files instead of making real calls to GPU-bound instance engines.
* **No Database Sync**: Workflows do not execute SQL or sync directly with a database. Data is handled strictly in memory/HTTP variables.
* **No Real Client Webhooks**: Workflows do not post callback HTTP requests back to active production Core servers.

---

## 11. Safety Boundaries

* **No Real Connectors**: All outbound requests map to local addresses (`localhost`, `127.0.0.1`, `host.docker.internal`, or `mock.local`).
* **No Secrets**: No production API keys, passwords, or secrets are contained in workflows or configurations.
* **No Real Core Production Calls**: All callback dispatches are mocked as preview objects.
* **No Ads/Posting/Messaging**: Posting nodes, advertising budget actions, and user messages are local stubs and do not publish or spend funds.
* **Dry-Run/Mock Only**: Workflows enforce mock mode natively.
* **Owner Approval**: Moving from mock/sandbox to staging or production requires explicit sign-off by the workstream owner.
