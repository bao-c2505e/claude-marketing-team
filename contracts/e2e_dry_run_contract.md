# End-to-End Dry Run Contract

**Version:** e2e_dry_run_v0.1

---

## 1. Goal & Objectives
This contract defines the behavior, interface, and output specification for the **Phase N11 End-to-End Dry Run** workflow (`n11_e2e_dry_run.workflow.json`). The workflow integrates all prior modules and contracts into a unified local flow: simulating an incoming event from the Core system, verifying target module health, invoking the local module's `/run` stub, parsing and normalizing the callback, passing through the approval gate, and presenting a final mock execution preview. It also validates error handling branches for unsupported event types and unavailable modules.

---

## 2. Standard Input Envelope (Core Event Envelope)
The workflow is triggered manually and takes a Core event payload matching the standard format:
- `contract_version` (string): Must be `"e2e_dry_run_v0.1"`.
- `event_type` (string): The requested task category (e.g. `creative_asset.requested`).
- `request_id` (string): A unique UUIDv4 string.
- `brand_id` (string): Strictly `"brand_demo_001"` (no hardcoding of brand specific real-world terms).
- `campaign_id` (string): Campaign identifier (e.g. `campaign_demo_001`).
- `requested_by` (string): Trigger initiator (e.g. `owner_mock`).
- `callback_url` (string): Mock local callback url (e.g. `http://localhost:8080/callback`).
- `payload` (object): Event specific parameters.
- `metadata` (object): Optional configurations.

---

## 3. Preflight & Routing Table
For any incoming event, the workflow resolves the target module, checks its health status, and routes to the appropriate mock `/run` endpoint.

| Event Type | Target Module | Health Endpoint | Run Endpoint |
| :--- | :--- | :--- | :--- |
| `creative_asset.requested` | `creative_asset_comfyui` | `http://localhost:8188/health` | `http://localhost:8188/run` |
| `content_pack.requested` | `content_pack_generator` | `http://localhost:8191/health` | `http://localhost:8191/run` |
| `ads_pack.requested` | `ads_pack_generator` | `http://localhost:8192/health` | `http://localhost:8192/run` |
| `crm_followup.requested` | `crm_followup_generator` | `http://localhost:8193/health` | `http://localhost:8193/run` |
| `analytics_report.requested` | `analytics_report_generator` | `http://localhost:8194/health` | `http://localhost:8194/run` |

---

## 4. Execution Paths

### A. Success Path (Healthy Module & Valid Payload)
1. **Trigger & Parse**: Accept mock Core event.
2. **Health Check**: Issue health check request to target module's health URL.
3. **Route**: If `healthy`, issue HTTP POST request to target module's `/run` endpoint.
4. **Normalize Callback**: Transform module response into the unified callback payload format.
5. **Approval Gate**: Apply simulated approval decision (e.g., `approved`, `rejected`, `needs_revision`, `pending_approval`).
6. **Final Preview**: Format and output the final dry run results list.

### B. Error Path (Unavailable Module, Unsupported Event, or Invalid Payload)
1. **Unsupported Event Type**: If `event_type` does not match the 5 supported events, route directly to Error Handling.
2. **Unavailable/Degraded Module**: If health check returns anything other than `healthy`, route directly to Error Handling.
3. **Error Normalization**: Build a Phase N9-style error object.
4. **Error Callback Preview**: Output the final dry run results indicating the routing/module failure.

---

## 5. Final Output Schema Specification
The final execution node must output a JSON object containing the following fields:

- `contract_version` (string): Value must be `"e2e_dry_run_v0.1"`.
- `run_id` (string): A unique UUIDv4 execution ID.
- `request_id` (string): Copied from the input request.
- `event_type` (string): Copied from the input request.
- `brand_id` (string): Must be `"brand_demo_001"`.
- `campaign_id` (string): Copied from the input request.
- `module_id` (string): Resolved target module ID, or `"unknown_module"` / `"n8n_event_router"`.
- `health_status` (string): Status of the health check (e.g. `"healthy"`, `"unavailable"`, `"unknown"`).
- `route_status` (string): Event routing status (e.g. `"routed"`, `"failed_unsupported"`, `"failed_unavailable"`).
- `module_status` (string): Response status from the module stub (e.g. `"completed"`, `"failed"`, `"not_called"`).
- `approval_status` (string): State from the approval gate (e.g. `"approved"`, `"rejected"`, `"needs_revision"`, `"pending_approval"`, `"skipped"`).
- `final_status` (string): The overall execution status. Must be one of the allowed statuses below.
- `module_response` (object): Raw JSON response returned from the module `/run` call (empty object if not run).
- `unified_callback_preview` (object): Normalized callback payload according to `unified_callback_contract.md` (null if error).
- `approval_result` (object): Result object containing details of the approval decision (null if error).
- `error_result` (object): N9-style error information (null if success).
- `execution_trace` (array of strings): A list of audit steps executed during the dry run.
- `source` (string): Must be `"n8n_n11_e2e_dry_run_mock"`.
- `generated_at` (string): ISO 8601 Timestamp of generation.
- `notes` (string): Narrative notes explaining the dry run state.

### Allowed `final_status` Values
- `completed_mock`: Process ran successfully and approved.
- `waiting_for_owner_approval`: Process ran successfully, pending approval.
- `revision_required`: Process ran successfully, but revision was requested.
- `stopped_rejected`: Process ran successfully, but rejected at approval gate.
- `failed_mock`: Unexpected execution failure in stub invocation.
- `blocked_module_unavailable`: Health check failed; module is degraded or offline.
- `unsupported_event_type`: Event type is not recognized by the router.

---

## 6. Safety & Verification Rules
1. **Local/Mock Only**: All HTTP requests are bound to `localhost` and local stubs. No external HTTP requests.
2. **No Credentials/Secrets**: No real API keys, tokens, or security credentials may be configured.
3. **No Production URLs**: No references to live endpoints or domains (e.g. `thecoreagency.com`).
4. **No Forbidden Brand Hardcoding**: Strictly use `brand_demo_001` (no hardcoding of "Vị Cuốn" or "vicuon").
5. **Validation Compliance**: The workflow and all N11 examples must be fully validated by `validate_contracts.js`.
