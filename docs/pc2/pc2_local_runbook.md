# PC2 Local Runbook

This runbook describes how to launch, import, and test the PC2 marketing automation backbone on your local machine.

---

## 1. Prerequisites
Before running the local stubs and workflows, ensure the following are installed:
- **Node.js**: Version 18 or higher.
- **n8n**: Local instance running in a container or via npm (`npx n8n`).
- **Repository Branch**: Ensure you are on the `feature/n8n-modules-workstream` branch.

---

## 2. Launching the 5 Module Stubs
Open five terminal windows and run the commands below to launch the local mock services:

### A. ComfyUI Pipeline Mock Stub (Port 8188)
```bash
cd modules/comfyui-pipeline
node src/server.js
```

### B. Content Pack Generator Mock Stub (Port 8191)
```bash
cd modules/content-pack-generator
npm start
```

### C. Ads Pack Generator Mock Stub (Port 8192)
```bash
cd modules/ads-pack-generator
npm start
```

### D. CRM Followup Generator Mock Stub (Port 8193)
```bash
cd modules/crm-followup-generator
npm start
```

### E. Analytics Report Generator Mock Stub (Port 8194)
```bash
cd modules/analytics-report-generator
npm start
```

---

## 3. Importing Workflows into n8n
To import any workflow file:
1. Open your local n8n editor panel in your browser.
2. Click **Workflows** -> **Add Workflow** -> **Import from File**.
3. Choose one of the JSON workflow files located in `n8n-workflows/`.
4. Click **Import** to load the canvas.

---

## 4. Recommended Test Order
To verify the features step-by-step, run tests in this order:

1. **Phase N10: Health Check Verification**
   - Import `n10_module_health_check.workflow.json`.
   - Run the workflow to inspect the normalized aggregated dashboard output showing all stubs online.
2. **Phase N7: Event Routing & Stub Generation**
   - Import `n7_full_multi_module_stub_integration.workflow.json`.
   - Verify that test event inputs are routed to their designated local stub.
3. **Phase N8: Approval Gate Checks**
   - Import `n8_unified_callback_approval_gate.workflow.json`.
   - Test various approval gate outcomes (approved, rejected, needs_revision, pending_approval).
4. **Phase N9: Error Policies & Retry Logging**
   - Import `n9_error_retry_logging.workflow.json`.
   - Verify standard N9 error response mappings, retry state tracking, and logging structures.
5. **Phase N11: Full End-to-End Dry Run**
   - Import `n11_e2e_dry_run.workflow.json`.
   - Paste mock input templates to test the entire lifecycle, including healthy paths, unsupported events, preflight unavailable blocks, and execution failures.

---

## 5. Troubleshooting

### Port Already Occupied
- **Issue**: A port (e.g. 8188) is already bound by another process.
- **Solution**: Identify the process using the port and terminate it, or change the port assignment in the server script and the matching workflow node properties.

### Connection Refused (ECONNREFUSED)
- **Issue**: n8n fails to reach a local module stub.
- **Solution**: Confirm that the target stub server is running and listening on its designated localhost port.

### Docker host.docker.internal Resolution
- **Issue**: If n8n runs inside a Docker container, it cannot resolve `localhost` directly.
- **Solution**: Configure n8n networking or replace `localhost` with `host.docker.internal` in the workflow endpoints.

### Validator Failures
- **Issue**: The contract validation script fails.
- **Solution**: Run `node contracts/tools/validate_contracts.js` to see detailed error reports. Ensure no forbidden brands, production domains, or real credentials exist in new files.

---

## 6. Safety Reminders
- **Mock-Only Mode**: Stubs only simulate logic. No active advertising campaigns, live messaging, or production database writes will occur.
- **No Real Credentials**: Do not add authentic tokens, auth keys, or credentials to any local configuration files.
- **No Production URLs**: Never target the production core site during local dry run executions.
