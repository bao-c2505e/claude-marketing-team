# Phase N11: E2E Dry Run Integration Documentation

## 1. Overview & Goal
Phase N11 introduces the **End-to-End Dry Run** integration workflow (`n11_e2e_dry_run.workflow.json`). This workflow stitches together the event routing, preflight health verification, specialist module mock invocation, unified callback normalization, and approval gate checks into a single local validation pipeline. 

It provides dry run previews of both the success pathways and the error paths without dispatching real webhook calls, modifying production databases, or triggering real marketing activities (ads, messaging, posting).

---

## 2. E2E Dry Run Flow Architecture
The workflow acts as an isolated dry run harness following these steps:

```
[Manual Trigger]
       │
       ▼
[Set Mock Event]  <-- Select test input payload
       │
       ▼
[Normalize Event] <-- Parse attributes, resolve target module, endpoints & run_id
       │
 ┌─────┴──────────────────────────────────────────────────────┐
 │ If Event Type is Supported?                                │
 ├───────────────────────────────┬────────────────────────────┤
 │ YES                           │ NO                         │
 ▼                               ▼                            │
[HTTP GET Health Check]      [Code: Build Unsupported Error]  │
 │                             (final_status:                 │
 ▼                              unsupported_event_type)       │
[Code: Analyze Health]           │                            │
 ┌─────┴──────────────────┐      ▼                            │
 │ Is Module Healthy?     │  [Final E2E Output Preview]       │
 ├───────────┬────────────┤                                   │
 │ YES       │ NO         │                                   │
 ▼           ▼            │                                   │
[HTTP POST] [Code: Build  │                                   │
[/run stub]  Unavailable] │                                   │
 │           (final_status│                                   │
 ▼           blocked_modu_│                                   │
[Normalize   unavailable) │                                   │
 Callback]   │            │                                   │
 │           ▼            │                                   │
 ▼      [Final E2E Output]│                                   │
[Switch:                  │                                   │
 Approval Gate Decision]  │                                   │
 ├───────────┬────────────┼───────────┬───────────────────────┤
 │ approved  │ rejected   │ revision  │ pending               │
 ▼           ▼            ▼           ▼                       │
[Prepare    [Prepare     [Prepare    [Prepare                 │
 Approved]   Rejected]    Revision]   Pending]                │
 (completed_ (stopped_    (revision_  (waiting_for_           │
  mock)       rejected)    required)   owner_approval)        │
 └───────────┴────────────┼───────────┴───────────────────────┘
                          │
                          ▼
              [Final E2E Output Preview]
```

---

## 3. Local Stubs Startup
To run the E2E dry run against live local stubs, open your terminal and run the following startup commands in the background:

### ComfyUI Local Pipeline Stub (Port 8188)
```bash
cd modules/comfyui-pipeline
node src/server.js
```

### Social Content Pack Generator Stub (Port 8191)
```bash
cd modules/content-pack-generator
npm start
```

### Advertising Creative Pack Generator Stub (Port 8192)
```bash
cd modules/ads-pack-generator
npm start
```

### CRM Sequence Draft Generator Stub (Port 8193)
```bash
cd modules/crm-followup-generator
npm start
```

### Performance Analytics Report Stub (Port 8194)
```bash
cd modules/analytics-report-generator
npm start
```

---

## 4. How to Import the Workflow
1. Start your local n8n instance.
2. Click **Workflows** -> **Add Workflow** -> **Import from File**.
3. Select [n11_e2e_dry_run.workflow.json](file:///C:/Users/DELL/claude-marketing-team/n8n-workflows/n11_e2e_dry_run.workflow.json).
4. Click **Import**.

---

## 5. Testing Scenarios

We have prepared 7 mock inputs under `contracts/examples/n8n/n11/` to verify all execution branches. Copy the content of the chosen input file and paste it into the `Set Mock Core Event` node in the n8n editor.

### Scenario A: Success Path Testing (All 5 Modules)
Paste the corresponding input files:
- **Creative Asset**: [e2e_input_creative_asset.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_creative_asset.json)
- **Content Pack**: [e2e_input_content_pack.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_content_pack.json)
- **Ads Pack**: [e2e_input_ads_pack.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_ads_pack.json)
- **CRM Followup**: [e2e_input_crm_followup.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_crm_followup.json)
- **Analytics Report**: [e2e_input_analytics_report.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_analytics_report.json)

**Expected Output**:
- The flow executes preflight health, hits the local stub's `/run` endpoint, normalizes callback payload, runs mock approval, and generates the final output object showing `final_status: "completed_mock"`.

### Scenario B: Approval Decision Branches
Configure `metadata.simulate_approval_decision` in the mock event:
1. `"approved"`: Output shows `approval_status: "approved"` and `final_status: "completed_mock"`.
2. `"rejected"`: Output shows `approval_status: "rejected"` and `final_status: "stopped_rejected"`.
3. `"needs_revision"`: Output shows `approval_status: "needs_revision"` and `final_status: "revision_required"`.
4. `"pending_approval"`: Output shows `approval_status: "pending_approval"` and `final_status: "waiting_for_owner_approval"`.

### Scenario C: Unsupported Event Type
Paste [e2e_input_unsupported_event.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_unsupported_event.json) into `Set Mock Core Event`.

**Expected Output**:
- The workflow immediately branches to `Code: Build Unsupported Event Error`.
- Output shows `final_status: "unsupported_event_type"`.
- `error_result` contains an N9-style error.

### Scenario D: Module Unavailable (Outage)
Paste [e2e_input_module_unavailable.json](file:///C:/Users/DELL/claude-marketing-team/contracts/examples/n8n/n11/e2e_input_module_unavailable.json) into `Set Mock Core Event`. Alternatively, stop the target local stub server.

**Expected Output**:
- Preflight health check fails (or detects `simulate_outage: true`).
- The flow branches to `Code: Build Unavailable Error`.
- Output shows `final_status: "blocked_module_unavailable"`.
- `error_result` contains an N9-style error mapping `module_unavailable`.

---

## 6. Reading Final Output Preview
The final output node exports a standardized JSON matching the E2E contract. Inspect the payload for these key fields:
- `final_status`: One of the allowed status strings (e.g. `completed_mock`, `blocked_module_unavailable`, etc.).
- `execution_trace`: List of audit trace messages.
- `unified_callback_preview`: The structured mock callback that would be returned to the Core.
- `error_result`: The N9 error wrapper (if failed).

---

## 7. Troubleshooting

### `ECONNREFUSED` / Health check unavailable or fails
- **Cause**: The target local stub server is not running on its designated localhost port, or the port is blocked.
- **Solution**: Confirm the startup script of the module is running (see section 3).
- **Graceful handling**: In n8n, health nodes use `onError: continueRegularOutput`, allowing the workflow to route to `blocked_module_unavailable` instead of crashing.

### Unsupported event_type
- **Cause**: An invalid or typo-ridden `event_type` was provided in the input envelope.
- **Solution**: Check event name against the list of 5 supported types.

### Missing field in input payload
- **Cause**: The mock event lacks one or more required envelope properties (e.g. `contract_version`, `event_type`, `request_id`).
- **Solution**: Refer to Section 2 of this document or check the input JSON schemas to ensure all required root fields are populated.

### Invalid JSON structure
- **Cause**: The input string pasted in the trigger/mock node has syntactic JSON syntax errors.
- **Solution**: Paste the payload into a JSON validator/linter and correct commas, brackets, or quotes.

### Unsupported approval_status / decision
- **Cause**: The input's `metadata.simulate_approval_decision` value is not recognized.
- **Solution**: Ensure the decision is one of `approved`, `rejected`, `needs_revision`, or `pending_approval` to resolve the final routing path correctly.

### Docker host.docker.internal issues
- **Cause**: If n8n runs inside a Docker container, it cannot resolve `localhost` directly.
- **Solution**: Configure n8n container network or replace `localhost` with `host.docker.internal` in development mappings (subject to local workstation setup).

---

## 8. Safety Notes
- **Mock/Local Only**: No production callbacks or live messaging channels are connected.
- **No Credentials**: No secret API keys or credentials can be configured or stored.
- **No production URL**: Under no circumstances should `thecoreagency.com` be queried.
- **Owner Approval**: Promotion to production or hooking up real webhooks requires explicit approval.
