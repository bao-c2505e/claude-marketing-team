# Phase N7 Manual Testing Guide: Full Multi-Module Stub Integration

This guide details how to run the multi-module HTTP request routing integration workflow in n8n and test it against the local specialist stubs.

---

## 1. Objectives of Phase N7
- Connect the n8n router workflow to all five local module stubs via HTTP Request `POST /run` endpoints.
- Support standard mock event envelopes and route requests automatically based on `event_type`.
- Standardize callback previews into a unified JSON format.
- Ensure strict compliance with the project isolation guidelines (no external APIs, no real credentials, brand `brand_demo_001` only).

---

## 2. Files Created & Updated

### New Files
- `n8n-workflows/n7_full_multi_module_stub_integration.workflow.json` (Full router workflow)
- `contracts/examples/n8n/n7/*.json` (5 test request payloads)
- `contracts/examples/n8n/n7/expected_outputs/*.json` (5 expected output responses)
- `docs/pc2/phase_n7_full_multi_module_stub_integration.md` (This document)

### Updated Files
- `contracts/module_registry.md` (Registry notes)
- `contracts/tools/validate_contracts.js` (Phase N7 checks)
- `docs/pc2/phase_log.md` (Appended Phase N7 metadata log)

---

## 3. Specialist Module Endpoints

| Event Type | Specialist Module ID | Local Endpoints (`POST /run`) |
| :--- | :--- | :--- |
| `creative_asset.requested` | `creative_asset_comfyui` | `http://localhost:8188/run` |
| `content_pack.requested` | `content_pack_generator` | `http://localhost:8191/run` |
| `ads_pack.requested` | `ads_pack_generator` | `http://localhost:8192/run` |
| `crm_followup.requested` | `crm_followup_generator` | `http://localhost:8193/run` |
| `analytics_report.requested` | `analytics_report_generator`| `http://localhost:8194/run` |

---

## 4. Prerequisites before Testing
Before executing the workflow, you must have all five stub servers running concurrently.

Open a separate terminal window for each directory and run the commands to start each server:

### A. ComfyUI Image generation stub (Port 8188)
```powershell
cd modules/comfyui-pipeline
npm install
npm start
```

### B. Content Pack Generator stub (Port 8191)
```powershell
cd modules/content-pack-generator
npm install
npm start
```

### C. Ads Pack Generator stub (Port 8192)
```powershell
cd modules/ads-pack-generator
npm install
npm start
```

### D. CRM Follow-up Generator stub (Port 8193)
```powershell
cd modules/crm-followup-generator
npm install
npm start
```

### E. Analytics Report Generator stub (Port 8194)
```powershell
cd modules/analytics-report-generator
npm install
npm start
```

---

## 5. How to Import the N7 Workflow
1. Open n8n in your web browser.
2. Create a new workflow.
3. Click the **three dots** in the top right corner and choose **Import from File**.
4. Select `n8n-workflows/n7_full_multi_module_stub_integration.workflow.json`.

---

## 6. How to Test Each Event Type
1. Double click the **Set: Mock Core Event** node.
2. Select and copy the contents of the desired test file in `contracts/examples/n8n/n7/`:
   - For ComfyUI: `creative_asset_test_event.json`
   - For Content: `content_pack_test_event.json`
   - For Ads: `ads_pack_test_event.json`
   - For CRM: `crm_followup_test_event.json`
   - For Analytics: `analytics_report_test_event.json`
3. Replace the node's parameters or JSON configuration with the copied text.
4. Execute the workflow.
5. Verify that:
   - The path routes correctly through the Switch node to the corresponding HTTP Request node.
   - The response from the target module stub is logged.
   - The final node (**Respond / Output Unified Result**) produces the standardized callback shape matching the files in `contracts/examples/n8n/n7/expected_outputs/`.

---

## 7. Troubleshooting

### `ECONNREFUSED`
*   **Cause:** The target module stub server on the requested port is not running.
*   **Resolution:** Start the stub server on the corresponding port as described in Section 4.

### Docker n8n Needs `host.docker.internal`
*   **Context:** This applies **only to local Docker troubleshooting** (not a production URL).
*   **Cause:** n8n running in a Docker container cannot resolve `localhost` representing the host system.
*   **Resolution:** Update the URL inside the HTTP Request node of the failing branch from `http://localhost:XXXX/run` to `http://host.docker.internal:XXXX/run`.

### `Unsupported event_type / Falling back`
*   **Cause:** If you input an unrecognized event type, the switch routes to the fallback node (**Code: Handle Unsupported Event Type**).
*   **Resolution:** Verify the mock event uses one of the five supported types.

### `HTTP Request Body is not valid JSON`
*   **Cause:** Malformed variables inside the `jsonBody` property of the HTTP node.
*   **Resolution:** Ensure that variables are correctly wrapped (e.g. `{{ JSON.stringify($json.payload) }}`) to prevent invalid JSON compilation.

---

## 8. Safety & Isolation Policy
- **Sandbox Environment:** All servers run on `localhost`. No live external endpoints are hit.
- **No Production URLs:** Production URLs like `thecoreagency.com` are prohibited.
- **No Secrets:** Workflows utilize zero API tokens, secrets, or authentication parameters.
- **No Auto-Actions:** Generation outputs are draft-only and cannot be published automatically.
- **No Core UI Impact:** This does not load or alter any Core UI modules.
