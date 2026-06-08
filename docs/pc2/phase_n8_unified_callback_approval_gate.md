# Phase N8 Manual Testing Guide: Unified Callback + Approval Gate Mock

This guide details how to import and manually test the Phase N8 Unified Callback and Approval Gate workflow in n8n.

---

## 1. Objectives of Phase N8
- Standardize callback payloads sent back to Core.
- Implement a mock approval gate inside n8n to handle reviewer decisions: `approved`, `rejected`, `needs_revision`, and `pending`.
- Map those decisions to standard final statuses:
  - `approved` → `ready_for_mock_callback`
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
| `"approved"` | `approved` | `ready_for_mock_callback` | `ready_for_mock_callback` |
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
   - `next_action`: `"ready_for_mock_callback"`
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

## 6. Safety & Security Policy
- **No real callback dispatch:** No HTTP request callback node is allowed in this workflow. Testing is entirely self-contained.
- **No credentials:** Zero tokens or secrets are stored in the n8n JSON file.
- **Mock brand only:** Brand is strictly set to `brand_demo_001`.
- **No production URLs:** The workflow does not reference `thecoreagency.com` anywhere.
