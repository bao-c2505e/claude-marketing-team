# Phase N6 Manual Testing Guide: Local Mock Module Stubs

This document explains how to launch and manually verify the four expanded Node.js local mock stub servers.

---

## 1. Objectives of Phase N6
- Expand local specialist modules by introducing stub servers for the rest of the workstream components.
- Expose standardized API endpoints following `contracts/module_api_standard.md`:
  - `GET /health`
  - `POST /run`
  - `POST /simulate-callback`
- Enforce strict data isolation and safety policies (mock only, no secrets, no real APIs, no production domains).

---

## 2. Port Allocation Map

| Module ID | Module Name | Port | Base URL |
| :--- | :--- | :--- | :--- |
| `content_pack_generator` | Content Pack Generator | `8191` | `http://localhost:8191` |
| `ads_pack_generator` | Ads Pack Generator | `8192` | `http://localhost:8192` |
| `crm_followup_generator` | CRM Follow-up Generator | `8193` | `http://localhost:8193` |
| `analytics_report_generator`| Analytics Report Generator | `8194` | `http://localhost:8194` |

---

## 3. How to Launch the Stub Servers

To test each server, you must run it in a command shell. Open a terminal and run the following for the desired module:

### A. Content Pack Generator
```powershell
cd modules/content-pack-generator
npm install
npm start
```

### B. Ads Pack Generator
```powershell
cd modules/ads-pack-generator
npm install
npm start
```

### C. CRM Follow-up Generator
```powershell
cd modules/crm-followup-generator
npm install
npm start
```

### D. Analytics Report Generator
```powershell
cd modules/analytics-report-generator
npm install
npm start
```

---

## 4. How to Verify Endpoints Manually

Once the servers are running, open a separate terminal to run health checks and query tests.

### A. Testing Health Checks (`GET /health`)
You can use `curl` or a web browser to query the health endpoints:

```bash
# Content Pack
curl http://localhost:8191/health

# Ads Pack
curl http://localhost:8192/health

# CRM Followup
curl http://localhost:8193/health

# Analytics Report
curl http://localhost:8194/health
```

**Expected Healthy Response:**
```json
{
  "ok": true,
  "module_id": "content_pack_generator",
  "status": "healthy",
  "mode": "mock",
  "version": "0.1.0"
}
```

---

### B. Testing Run Execution (`POST /run`)
Submit a mock payload request using `curl` or PowerShell.

#### 1. Content Pack Generator
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"request_id\":\"test-content-001\",\"brand_id\":\"brand_demo_001\",\"payload\":{\"channels\":[\"facebook\",\"linkedin\"]}}" http://localhost:8191/run
```
**Expected Output Includes:**
*   `content_pack_id`
*   `channels`
*   `posts` array containing `post_id`, `channel`, `caption`, `hook`, `cta`, and `safety_status: "draft_only"`

#### 2. Ads Pack Generator
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"request_id\":\"test-ads-001\",\"brand_id\":\"brand_demo_001\",\"payload\":{\"platform\":\"meta\",\"offer\":\"10% off\"}}" http://localhost:8192/run
```
**Expected Output Includes:**
*   `ads_pack_id`
*   `platform`
*   `objective`
*   `ad_variants` array containing `ad_id`, `primary_text`, `headline`, `description`, `cta`, and `safety_status: "draft_only"`
*   `budget_mode: "mock"`

#### 3. CRM Follow-up Generator
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"request_id\":\"test-crm-001\",\"brand_id\":\"brand_demo_001\",\"payload\":{\"scenario\":\"abandoned_cart\",\"message_count\":2}}" http://localhost:8193/run
```
**Expected Output Includes:**
*   `crm_pack_id`
*   `scenario`
*   `messages` array containing `message_id`, `step`, `text`, and `safety_status: "draft_only"`
*   `real_messaging_enabled: false`

#### 4. Analytics Report Generator
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"request_id\":\"test-analytics-001\",\"brand_id\":\"brand_demo_001\",\"payload\":{\"reporting_period\":\"last_30_days\"}}" http://localhost:8194/run
```
**Expected Output Includes:**
*   `report_id`
*   `reporting_period`
*   `metrics_summary` containing clicks, CTR, conversions, etc.
*   `insights` and `recommendations` arrays
*   `data_source: "mock"`
*   `real_data_used: false`

---

## 5. Troubleshooting

### `Port already in use`
*   **Cause:** Another service is already using the port (8191-8194).
*   **Resolution:** Stop the conflicting process or change the port by running `PORT=xxxx npm start` in bash, or `$env:PORT=xxxx; npm start` in PowerShell.

### `npm install missing / ECONNREFUSED`
*   **Cause:** Missing `node_modules` folder or dependencies didn't install successfully, or the stub server is not running when making a request.
*   **Resolution:** Run `npm install` within the target directory, and ensure the console displays `successfully started on port XXXX` before making requests.

### Windows PowerShell `curl` Alias Issue
*   **Context:** In PowerShell, `curl` is an alias to `Invoke-WebRequest` which behaves differently from real curl.
*   **Resolution:** Use `curl.exe` instead of `curl`, or use PowerShell syntax:
    ```powershell
    Invoke-RestMethod -Method Post -Uri "http://localhost:8191/run" -ContentType "application/json" -Body '{"brand_id":"brand_demo_001","payload":{"channels":["facebook"]}}'
    ```

---

## 6. Safety Notes & Policy Compliance
- **Mock Only:** Stub servers produce purely randomized or hardcoded mock text. No LLM APIs are contacted.
- **No Real Actions:** No emails or CRM systems are hooked up. No social channels are posted to.
- **No Production URLs:** Local servers execute on `localhost` only.
- **No Secrets:** The servers require zero authentication or API tokens to execute.
