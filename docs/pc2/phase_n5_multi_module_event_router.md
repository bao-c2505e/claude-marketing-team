# Phase N5 Manual Testing Guide: Multi-Module n8n Event Router

This document describes how to import, execute, and verify the multi-module n8n event router skeleton.

---

## 1. Objectives of Phase N5
- Standardize the event envelope sent from the Core to n8n.
- Implement a 5-way routing flow in n8n targeting the appropriate specialist modules.
- Route `creative_asset.requested` to a local running ComfyUI stub server.
- Route other modules (Content Pack, Ads Pack, CRM Followup, Analytics Report) to safe mock execution nodes.
- Maintain full safety isolation (no production URLs, no real customer data, no real API keys, no actual ad spend/messaging).

---

## 2. Files Created & Updated

### New Files
- `contracts/n8n_event_router_contract.md`: The official contract defining the envelope schema and the routing behavior.
- `contracts/examples/n8n/router/*.json`: Five mock core event payloads (one for each supported module).
- `contracts/examples/n8n/router/expected_outputs/*.json`: Five expected output callback previews representing correct routing results.
- `n8n-workflows/n5_multi_module_event_router.workflow.json`: The importable n8n workflow file.
- `docs/pc2/phase_n5_multi_module_event_router.md`: This manual testing documentation.

### Updated Files
- `contracts/tools/validate_contracts.js`: Updated to parse and validate the new JSON files, enforce brand limits, ensure schemas conform to specifications, and check the workflow JSON.
- `docs/pc2/phase_log.md`: Appended details of Phase N5 development.

---

## 3. Supported Event Types & Routing Table

| Event Type | Target Module ID | Endpoint Type | Local Endpoint / Mode |
| :--- | :--- | :--- | :--- |
| `creative_asset.requested` | `creative_asset_comfyui` | `local_stub` | `http://localhost:8188/run` (ACTIVE_LOCAL) |
| `content_pack.requested` | `content_pack_generator` | `mock_only` | Mock JavaScript Node (MOCK) |
| `ads_pack.requested` | `ads_pack_generator` | `mock_only` | Mock JavaScript Node (MOCK) |
| `crm_followup.requested` | `crm_followup_generator` | `mock_only` | Mock JavaScript Node (MOCK) |
| `analytics_report.requested` | `analytics_report_generator`| `mock_only` | Mock JavaScript Node (MOCK) |

---

## 4. How to Import the n8n Workflow
1. Open your n8n workspace in your web browser.
2. Click on **Workflows** in the left sidebar and select **Add Workflow** (or create a new blank workflow).
3. In the upper-right menu of the workflow editor, click on the **three dots** icon and choose **Import from File**.
4. Browse and select the file:
   `n8n-workflows/n5_multi_module_event_router.workflow.json`
5. The workflow nodes, connections, and layout will populate automatically.

---

## 5. How to Test Each Event Type

### A. Testing Content Pack, Ads, CRM, and Analytics (Mock Paths)
1. Locate the first Set node: **Set: Mock Event**.
2. Double-click to open its configuration.
3. Replace the fields or edit the parameters to match one of the mock JSON files found in:
   - `contracts/examples/n8n/router/content_pack_requested.json`
   - `contracts/examples/n8n/router/ads_pack_requested.json`
   - `contracts/examples/n8n/router/crm_followup_requested.json`
   - `contracts/examples/n8n/router/analytics_report_requested.json`
4. Click **Test Step** or **Execute Workflow**.
5. Observe the execution path follow the Switch node to the corresponding mock Code node.
6. Check the output of the final node (**Respond / Output Routing Result**). It should match the corresponding JSON file inside `contracts/examples/n8n/router/expected_outputs/`.

---

### B. Testing Creative Asset with the ComfyUI Stub Server
To test the active `creative_asset.requested` path, you must run the local ComfyUI stub server:

1. Open a terminal on your host machine.
2. Navigate to the ComfyUI stub server directory:
   ```powershell
   cd modules/comfyui-pipeline
   ```
3. Install dependencies if you haven't already:
   ```powershell
   npm install
   ```
4. Start the stub server:
   ```powershell
   npm start
   ```
   *The server should run on `http://localhost:8188`.*
5. Return to the n8n workflow editor.
6. Open **Set: Mock Event** and make sure it has the payload from `contracts/examples/n8n/router/creative_asset_requested.json` (specifically `event_type: "creative_asset.requested"`).
7. Click **Execute Workflow**.
8. Verify that the workflow execution passes through the **HTTP Request: POST ComfyUI Stub /run** node and the ComfyUI stub server logs the incoming request.
9. Verify that the final node output contains the expected callback preview with `status: "mock_completed"` and the asset placeholder URL.

---

## 6. Troubleshooting

### `localhost:8188 ECONNREFUSED`
*   **Cause:** The ComfyUI local stub server is not running.
*   **Resolution:** Start the stub server by running `npm start` in `modules/comfyui-pipeline` as described above.

### Docker n8n Needs `host.docker.internal`
*   **Context:** This applies **only to local Docker troubleshooting** (this is not a production URL).
*   **Cause:** If you run n8n inside a Docker container, it cannot reach `localhost:8188` on the host machine because `localhost` refers to the container itself.
*   **Resolution:** In the n8n workflow editor, open the node **HTTP Request: POST ComfyUI Stub /run** and change the URL from:
    `http://localhost:8188/run`
    to:
    `http://host.docker.internal:8188/run`

### `Unsupported event_type`
*   **Cause:** The `event_type` parameter in **Set: Mock Event** is invalid or not recognized by the Switch node.
*   **Resolution:** Ensure the event type is one of the five supported types.

### `JSON invalid`
*   **Cause:** A copy-paste error when editing the mock event payload.
*   **Resolution:** Copy the mock payload directly from the raw files in `contracts/examples/n8n/router/` to ensure syntax correctness.

---

## 7. Safety & Isolation Policy
*   **Mock Only:** All executions are synthetic and do not invoke real marketing channels or production endpoints.
*   **No Production URLs:** No production environments (e.g. `thecoreagency.com`) are configured.
*   **No Secrets:** No real API keys, credentials, or tokens are included in the workflow JSON or documentation.
*   **No Auto-Publishing:** Content draft generation is strictly mock and requires manual approval before any real execution.
*   **No Real Ad Spend:** Ad budget limits and platforms operate purely in `"mock"` mode.
