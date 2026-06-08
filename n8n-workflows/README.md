# n8n Workflows Placeholder Skeletons

This directory contains placeholder JSON workflows representing the automation backbone configuration of The Core Agency.

## Workflow List

1. **[Core Event Router](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/core_event_router.workflow.json)**:
   - Receives events from Core webhook.
   - Validates event payload against schema constraints (contract validation placeholder).
   - Enforces generic safety gate validation and routes tasks to specialized modules based on `event_type`.
   - Sends error callbacks (`INVALID_CONTRACT` or `REJECTED_BY_SAFETY`) to Core.
2. **[Approved Design to ComfyUI](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/approved_design_to_comfyui.workflow.json)**:
   - Evaluates design briefs, checks final approval, and schedules generation jobs on ComfyUI.
3. **[Module Result Callback to Core](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/module_result_callback_to_core.workflow.json)**:
   - Handles callbacks from specialist modules, formats payloads, and triggers the callback back to the Core webhook.

---

## Safety & Approval Architecture

- **Router-Level Gates**:
  - Early contract schema check: Calls back Core with `INVALID_CONTRACT` if critical fields (UUID, timestamp) fail parsing.
  - General Safety Gate: Structural safety check (verifies that the `safety` object is present and well-formed) to avoid errors, without blocking events before event type routing.
  - Specific Safety Gates: Real-world action approval gates (like publishing or ad spend). Prevents invoking external modules unless `final_approval_granted = true`, `allow_* = true`, and `approval_status = APPROVED`. If checks fail, routes to safety rejection callback.
- **Module-Level Gates**:
  - While the router performs early validation, each specialized module must still validate incoming request payload safety flags (e.g. `safety.final_approval_granted = true`) as a secondary security layer.
- **Strict Execution Rules**:
  - Publishing, ad spend, and customer messaging workflows are strictly prohibited from execution unless both `final_approval_granted` and their respective `allow_*` flags are explicitly evaluated as `true`.

---

## Importing & Configuration

### How to Import
1. Open your n8n dashboard.
2. Create a new workflow.
3. Click the top-right menu (three dots) -> select **Import from File** or copy-paste the JSON file contents directly into the canvas.

### Environment & Placeholder URLs
After importing, configure the following environment placeholders within n8n UI Settings or variables (DO NOT hardcode credentials or real URLs in the git repository):
- `CORE_CALLBACK_URL`: Webhook URL of the Core backend callback API.
- `MODULE_COMFYUI_URL`: Address of the ComfyUI background pipeline stub.
- `MODULE_FACEBOOK_PUBLISHER_URL`: Endpoint for Facebook Publisher.
- `MODULE_META_ADS_CONNECTOR_URL`: Endpoint for Meta Ads Manager connector.
- `MODULE_INBOX_ASSISTANT_URL`: Endpoint for Inbox Assistant AI helper.
- `MODULE_ANALYTICS_ENGINE_URL`: Endpoint for Analytics reports.
- `MODULE_BILLING_MODULE_URL`: Endpoint for Billing sync services.

> [!CAUTION]
> - Do not active production workflows in n8n unless `CORE_CALLBACK_URL` is pointing to a live, secured, and validated Core callback endpoint.
> - Never save or commit real API credentials or tokens in the workflow JSON files. Always use n8n's native Credentials system.
