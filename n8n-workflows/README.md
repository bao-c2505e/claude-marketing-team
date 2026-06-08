# n8n Workflows Placeholder Skeletons

This directory contains placeholder JSON workflows representing the automation backbone configuration of The Core Agency.

## Workflow List

1. **[Core Event Router](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/core_event_router.workflow.json)**:
   - Receives events from Core webhook, parses safety flags, and routes them to downstream flows or module endpoints.
2. **[Approved Design to ComfyUI](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/approved_design_to_comfyui.workflow.json)**:
   - Evaluates design briefs, checks final approval, and schedules generation jobs on ComfyUI.
3. **[Module Result Callback to Core](file:///c:/Users/DELL/claude-marketing-team/n8n-workflows/module_result_callback_to_core.workflow.json)**:
   - Handles callbacks from specialist modules, formats payloads, and triggers the callback back to the Core webhook.

## Importing Into n8n

These JSON files are ready to be imported into any n8n instance:
1. Open n8n UI.
2. Create a new workflow.
3. Click on the top-right menu (three dots) -> **Import from File** or copy/paste the JSON content directly.
4. Replace placeholder environment parameters and setup credentials in the n8n UI securely.

## Safety & Approval Architecture
- **Router-Level Gates**: The `Core Event Router` implements early-stage IF nodes (`IF: Safety Gate - ...`) to validate safety flags and block real-world action requests (like publishing to Facebook or spending Meta Ads budget) before invoking downstream modules.
- **Double Validation**: While the router performs validation, each specialized module must still validate incoming request payload safety flags (e.g. `safety.final_approval_granted = true`) as a secondary security layer.
- **Execution Rules**: Publishing, ad spend, and customer messaging workflows are strictly prohibited from execution unless both `final_approval_granted` and their respective `allow_*` flags are explicitly evaluated as `true`.

