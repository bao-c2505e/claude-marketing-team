# Phase N10 — Module Registry + Health Check Dashboard Contract

## 1. Objectives & Overview
To prevent routing failures and campaign blocks, Phase N10 introduces a standard health-checking contract for all specialist modules in the PC2 workstream. 
It establishes a pre-flight system scan: n8n queries the `GET /health` endpoints of all 5 local stubs to generate an aggregate readiness report and dashboard representation. Workflows can inspect this readiness prior to dispatching creative requests.

---

## 2. Endpoint Mappings
The following 5 local mock endpoints must be queried for health status checks:
- **creative_asset_comfyui:** `http://localhost:8188/health`
- **content_pack_generator:** `http://localhost:8191/health`
- **ads_pack_generator:** `http://localhost:8192/health`
- **crm_followup_generator:** `http://localhost:8193/health`
- **analytics_report_generator:** `http://localhost:8194/health`

---

## 3. How to Start the 5 Local Module Stubs
To run health check integrations locally:
1.  Open 5 terminal windows.
2.  Boot each local stub server:
    - **comfyui-pipeline:** `node modules/comfyui-pipeline/server.js` (listening on port 8188)
    - **content-pack-generator:** `node modules/content-pack-generator/server.js` (listening on port 8191)
    - **ads-pack-generator:** `node modules/ads-pack-generator/server.js` (listening on port 8192)
    - **crm-followup-generator:** `node modules/crm-followup-generator/server.js` (listening on port 8193)
    - **analytics-report-generator:** `node modules/analytics-report-generator/server.js` (listening on port 8194)

---

## 4. How to Import and Execute the Workflow in n8n
1.  Open your n8n local instance (`http://localhost:5678`).
2.  Create a blank workflow.
3.  Click the top-right menu (three dots icon) and choose **Import from File**.
4.  Select `n8n-workflows/n10_module_health_check.workflow.json`.
5.  Click **Execute Workflow** to run the readiness scan.

---

## 5. How to Read Output Readiness Statuses

The workflow normalize and aggregate stubs health values into one of the following overall status patterns:

### A. All Healthy
- **Readiness:** `ready_for_mock_run`
- **Scenario:** All 5 mock stubs are running and respond with `status: "healthy"`.
- **Output Notes:** `"All modules online. System fully ready."`

### B. Partially Ready
- **Readiness:** `partially_ready`
- **Scenario:** One or more non-critical modules (such as CRM follow-up generator) are offline (`unavailable`) or `degraded`.
- **Output Notes:** `"Non-blocking module degraded or unavailable. System remains partially ready."`

### C. Blocked
- **Readiness:** `blocked`
- **Scenario:** Critical blocking modules (specifically `creative_asset_comfyui` or `analytics_report_generator`) are offline (`unavailable`).
- **Output Notes:** `"Critical modules unavailable (creative_asset_comfyui). Router execution blocked."`
- **Blocking Modules List:** Populated with the failed critical module IDs (e.g. `["creative_asset_comfyui"]`).

---

## 6. Troubleshooting
-   **ECONNREFUSED / Offline Stubs:** If the HTTP request fails, n8n will catch the exception (due to `"onError": "continueRegularOutput"`) and pass it to the Normalization node. The normalization code automatically marks the stub as `status: "unavailable"`.
-   **Port not running:** Verify that the server stubs are successfully bound to their respective ports.
-   **Docker container host settings:** If n8n runs inside Docker, it cannot resolve `localhost` directly. Change `localhost` in the HTTP Request node URLs to `host.docker.internal` to route correctly.
-   **Malformed Health JSON:** If a custom server stub returns a malformed body, the normalization node gracefully overrides it and outputs `status: "unavailable"` as a safe fallback.
-   **Readiness Blocked:** If execution is blocked, check the `blocking_modules` list and restart the corresponding stubs.

---

## 7. Safety & Security Rules
-   **Mock / Local Only:** Health check nodes target local mock stub addresses on `localhost`.
-   **No Production Monitoring:** Do not hook up datadog or monitoring platforms.
-   **No Real External APIs:** Do not check statuses of live external API providers.
-   **No Secrets:** Workflows run with zero credentials.
-   **No Auto-Heal / Restart:** Workflows do not attempt recovery actions or auto-restart failed stubs.
-   **No Auto-Post/Ads/Messaging:** Uptime states and failures do not trigger notification messaging.
