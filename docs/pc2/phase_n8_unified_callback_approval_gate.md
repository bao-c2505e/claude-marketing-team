# Phase N8 Manual Testing Guide: Unified Callback + Approval Gate Mock

This guide details how to import and manually test the Phase N8 Unified Callback and Approval Gate workflow in n8n.

---

## 1. Objectives of Phase N8
- Standardize callback payloads sent back to Core.
- Implement a mock approval gate inside n8n to handle reviewer decisions: `approved`, `rejected`, `needs_revision`, and `pending`.
- Map those decisions to standard final statuses:
  - `approved` → `ready_for_mock_callback_preview`
  - `rejected` → `stopped_rejected`
  - `needs_revision` → `revision_required`
  - `pending` / `pending_approval` → `waiting_for_owner_approval`
- Return callback previews containing: `request_id`, `event_type`, `module_id`, `approval_status`, `final_status`, `callback_preview`, `next_action`, `source: n8n_n8_approval_gate_mock`, and `notes`.
- Enforce strict safety constraints: no production URLs, no real credentials, brand `brand_demo_001` only.

---

## 2. Files Created & Updated

### New Files
- `contracts/unified_callback_contract.md` (Unified callback payload & gate schema specification)
- `contracts/examples/n8n/n8/unified_callback_*.json` (4 mock callback examples)
- `contracts/examples/n8n/n8/approval_decisions/approval_decision_*.json` (4 mock approval decisions)
- `contracts/examples/n8n/n8/expected_outputs/*_expected_output.json` (4 expected output files)
- `n8n-workflows/n8_unified_callback_approval_gate.workflow.json` (Approval gate n8n workflow)
- `docs/pc2/phase_n8_unified_callback_approval_gate.md` (This guide)

### Updated Files
- `contracts/module_registry.md` (Registry notes updated to route callbacks through approval gate)
- `contracts/n8n_event_router_contract.md` (Router contract updated with callback normalization details)
- `contracts/tools/validate_contracts.js` (Phase N8 validation checks added)
- `docs/pc2/phase_log.md` (Appended Phase N8 log)

---

## 3. Decision to Status Mapping

The workflow routes decisions through four branches and maps them to final statuses:

| Decision | approval_status | final_status | next_action |
| :--- | :--- | :--- | :--- |
| `"approved"` | `approved` | `ready_for_mock_callback_preview` | `ready_for_mock_callback_preview` |
| `"rejected"` | `rejected` | `stopped_rejected` | `stop_no_callback` |
| `"needs_revision"` | `needs_revision` | `revision_required` | `return_to_module_or_human_revision` |
| `"pending"` | `pending_approval` | `waiting_for_owner_approval` | `wait_for_owner` |

---

## 4. How to Import the N8 Workflow
1. Open n8n in your web browser.
2. Create a new workflow.
3. Click the **three dots** in the top right corner and choose **Import from File**.
4. Select `n8n-workflows/n8_unified_callback_approval_gate.workflow.json`.

---

## 5. How to Test Each State

You can simulate decisions by configuring the mock input nodes inside the workflow:

### A. Testing the "Approved" Branch
1. Double-click the **Set: Mock Approval Decision** node.
2. Replace its parameters with the JSON from `contracts/examples/n8n/n8/approval_decisions/approval_decision_approved.json`:
   - `decision`: `"approved"`
   - `next_action`: `"ready_for_mock_callback_preview"`
3. Execute the workflow.
4. Verify that:
   - The workflow routes to **Code: Prepare Approved Callback Preview**.
   - The final node (**Respond / Output Final Approval Gate Result**) yields a payload matching `contracts/examples/n8n/n8/expected_outputs/approved_expected_output.json`.

### B. Testing the "Rejected" Branch
1. Double-click the **Set: Mock Approval Decision** node.
2. Replace its parameters with the JSON from `contracts/examples/n8n/n8/approval_decisions/approval_decision_rejected.json`:
   - `decision`: `"rejected"`
   - `next_action`: `"stop_no_callback"`
3. Execute the workflow.
4. Verify that:
   - The workflow routes to **Code: Prepare Rejected Output**.
   - The final node (**Respond / Output Final Approval Gate Result**) yields a payload matching `contracts/examples/n8n/n8/expected_outputs/rejected_expected_output.json`.

### C. Testing the "Needs Revision" Branch
1. Double-click the **Set: Mock Approval Decision** node.
2. Replace its parameters with the JSON from `contracts/examples/n8n/n8/approval_decisions/approval_decision_needs_revision.json`:
   - `decision`: `"needs_revision"`
   - `next_action`: `"return_to_module_or_human_revision"`
3. Execute the workflow.
4. Verify that:
   - The workflow routes to **Code: Prepare Revision Request Output**.
   - The final node (**Respond / Output Final Approval Gate Result**) yields a payload matching `contracts/examples/n8n/n8/expected_outputs/needs_revision_expected_output.json`.

### D. Testing the "Pending" Branch
1. Double-click the **Set: Mock Approval Decision** node.
2. Replace its parameters with the JSON from `contracts/examples/n8n/n8/approval_decisions/approval_decision_pending.json`:
   - `decision`: `"pending"`
   - `next_action`: `"wait_for_owner"`
3. Execute the workflow.
4. Verify that:
   - The workflow routes to **Code: Prepare Pending Output**.
   - The final node (**Respond / Output Final Approval Gate Result**) yields a payload matching `contracts/examples/n8n/n8/expected_outputs/pending_expected_output.json`.

---

## 6. Troubleshooting

### Invalid JSON
*   **Cause:** Input to **Set: Mock Module Response** or **Set: Mock Approval Decision** is malformed JSON.
*   **Resolution:** Verify all JSON braces, quotes, and commas are properly closed. Use a JSON validator if editing manually.

### Unsupported `approval_status` / `decision`
*   **Cause:** A decision is set to an unsupported value (e.g. `"unapproved"`, `"needs_rework"`).
*   **Resolution:** Ensure that the `decision` field in the decision payload is exactly one of: `"approved"`, `"rejected"`, `"needs_revision"`, `"pending"`. Ensure that `approval_status` in the callback payload is exactly one of: `"pending_approval"`, `"approved"`, `"rejected"`, `"needs_revision"`.

### Missing Required Fields
*   **Cause:** Expected fields (e.g. `request_id`, `event_type`, `module_id`) are missing from the inputs.
*   **Resolution:** Verify that the incoming mock callback contains all 14 required fields defined in `contracts/unified_callback_contract.md`. If fields are missing, the normalization node will default them or fail validation.

### Wrong or Missing `brand_id`
*   **Cause:** The brand ID is missing or set to a live brand name instead of `brand_demo_001`.
*   **Resolution:** Always verify the `brand_id` is strictly set to `brand_demo_001` in all testing payloads.

### Workflow Not Routing to Expected Branch
*   **Cause:** The **Switch: Route by decision** node evaluates `{{ $json.decision }}`. If the decision node did not execute or its output schema is different, the routing will fail or take the wrong path.
*   **Resolution:** Ensure that the **Set: Mock Approval Decision** node output contains a string property `decision` with a supported value. Verify that the Switch node routes match the decision value exactly.

---

## 7. Safety & Security Policy

> [!IMPORTANT]
> - **No real callback sent:** Under no circumstances does this workflow dispatch a real HTTP POST request callback to the Core callback URL. It is purely designed to generate a mock callback preview. Future real callback dispatch requires a separate explicit integration phase and owner approval.
> - **No auto-post:** Generation results or copy must never be published automatically to public/live channels.
> - **No real ads:** Ad pack stubs use mock budgets only. No real advertising campaigns can be funded or launched.
> - **No real messaging:** CRM stubs generate draft templates only. No real messages (email, SMS, etc.) can be sent to real customer contact details.
> - **No production URLs:** The workflow and mock examples are prohibited from referencing the production site `thecoreagency.com`.
> - **No secrets:** No real API credentials, keys, or tokens may be embedded in the workflow JSON or files.
> - **Owner Approval:** Live rollout and real execution integration require explicit owner sign-off.
