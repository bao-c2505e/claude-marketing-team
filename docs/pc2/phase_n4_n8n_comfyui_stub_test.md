# Phase N4 - n8n to ComfyUI Stub Integration Workflow Test Guide

This document describes the testing procedure to verify that the n8n workflow successfully integrates with the local ComfyUI stub server.

---

## 1. Objectives
- Validate that n8n receives a mock Core event, normalizes the structure, routes it to the ComfyUI specialist module, triggers the `/run` endpoint of the local stub, receives a queued response, and constructs the expected preview callback payload.
- Ensure that communication is strictly local and secure without using real secrets, real production endpoints, or direct database mutations.

---

## 2. Files Involved in Phase N4
- **[n8n-workflows/n4_comfyui_stub_integration_test.workflow.json](../../n8n-workflows/n4_comfyui_stub_integration_test.workflow.json)**: The importable n8n workflow for testing.
- **[contracts/examples/n8n/n4_mock_core_event.json](../../contracts/examples/n8n/n4_mock_core_event.json)**: Example Core event source payload.
- **[contracts/examples/n8n/n4_expected_callback_preview.json](../../contracts/examples/n8n/n4_expected_callback_preview.json)**: Example of expected final callback output structure.
- **[docs/pc2/phase_n4_n8n_comfyui_stub_test.md](./phase_n4_n8n_comfyui_stub_test.md)**: This manual verification guide.
- **[docs/pc2/phase_log.md](./phase_log.md)**: Development log.

---

## 3. Prerequisites
To conduct this test, make sure you have:
1. **Node.js** (v18+) installed locally.
2. **n8n** desktop app or a local sandbox running (usually at `http://localhost:5678`).

---

## 4. Step-by-Step Test Procedure

### Step 4.1: Start the ComfyUI Stub Server
Open your terminal, navigate to the ComfyUI pipeline module directory, and launch the server:
```bash
cd modules/comfyui-pipeline
npm install
npm start
```
You should see:
`ComfyUI Local Stub Server successfully started on port 8188`

### Step 4.2: Import Workflow into n8n
1. Open your local n8n console (`http://localhost:5678`).
2. Create a new empty workflow.
3. Click the menu icon in the top right and select **Import from File**.
4. Upload `n8n-workflows/n4_comfyui_stub_integration_test.workflow.json`.

### Step 4.3: Execute and Verify
1. Double-click the **Set: Mock Core Event** node to see the default inputs, which are prepopulated with generic brand fields (`brand_demo_001`).
2. Click **Execute Workflow** at the bottom of the screen.
3. The workflow will run and process the nodes sequentially:
   - Trigger -> Set Mock event -> Normalize payload -> Route Check -> Invoke ComfyUI HTTP request -> Format Preview -> Output.
4. Click the final node **Respond / Output Result** and inspect the output.

---

## 5. Expected Results
The output JSON of the final node should conform to the structure in [n4_expected_callback_preview.json](../../contracts/examples/n8n/n4_expected_callback_preview.json):
```json
{
  "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
  "module_id": "comfyui-pipeline",
  "status": "mock_completed",
  "preview_callback_payload": {
    "request_id": "782f9d5e-ca87-439f-a89c-8eb139f4a088",
    "module_id": "comfyui-pipeline",
    "status": "mock_completed",
    "asset_preview": "mock://assets/workspace_generated_001.png",
    "mock_asset_url": "mock://assets/workspace_generated_001.png",
    "mock_output_path": "storage/assets/placeholder_workspace_001.png",
    "source": "n8n_n4_integration_test",
    "generated_at": "... (timestamp)",
    "notes": "This is a local integration test callback preview. No actual assets were generated or dispatched to production."
  },
  "source": "n8n_n4_integration_test"
}
```

---

## 6. Troubleshooting

### Connection refused (`ECONNREFUSED` on port 8188)
- **Cause**: The ComfyUI stub server is not running or is running on a different port.
- **Solution**: Make sure you ran `npm start` under `modules/comfyui-pipeline/` and that the console reports port `8188`.

### Payload schema validation errors
- **Cause**: The normalized body does not conform to the schema required by the server (e.g. missing UUID format validation or required field).
- **Solution**: Open the **Code: Normalize Payload** node and check that `event_id` and `correlation_id` are valid UUIDs.

---

## 7. Safety Constraints Reminder
- **No real credentials / API keys**: All operations utilize local endpoints or mock structures.
- **No production URL targets**: Targets are strictly local `localhost` or mock schemes.
- **No Core UI/DB mutations**: The workflow only returns/displays JSON previews and does not update actual postgres tables or database instances.
