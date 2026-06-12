# Module Health Check Contract

**Version:** module_health_check_v0.1

---

## 1. Goal & Objectives
This contract standardizes the health checking and readiness protocols for the specialist modules integrated under the PC2 workstream. It ensures:
- The n8n router and orchestrator workflows can verify module availability prior to triggering long-running generation pipelines.
- Standard individual module health formats, aggregate readiness reports, and dashboard data schemas are established for mock environments.
- Zero production telemetry or database side-effects are introduced.

---

## 2. Module Health Response Standard
Each individual specialist module stub must expose a standard health endpoint (`GET /health`) returning a payload matching this structure:

### Required Fields
- `contract_version` (string): Must be `"module_health_check_v0.1"`.
- `module_id` (string): The identifier of the module (e.g. `creative_asset_comfyui`).
- `module_name` (string): The human-readable name of the module.
- `status` (string): The current operational state (see Section 3).
- `mode` (string): The mode of execution (see Section 4).
- `version` (string): Semantic version of the module.
- `uptime_mock` (integer): Simulated uptime in seconds.
- `local_base_url` (string): Base URL of the local stub.
- `endpoints` (array of strings): List of registered endpoints.
- `last_checked_at` (string): ISO-8601 timestamp.
- `source` (string): The source system/stub identifier.
- `notes` (string): Operator comments.

---

## 3. Allowed Status Values
The individual health `status` must match one of:
- `healthy`: Module is fully operational and ready to process requests.
- `degraded`: Module is running but experiencing performance anomalies (mock status).
- `unavailable`: Module is offline, crashed, or unreachable.
- `unknown`: Module status cannot be verified.

---

## 4. Allowed Mode Values
The individual health `mode` must match one of:
- `mock`: Running in simulation/static parameter mode.
- `local_stub`: Running as a local stub server on localhost.
- `real_disabled`: Real production integrations are currently disabled.

---

## 5. Health Check Aggregate Standard
The n8n health orchestrator compiles individual health responses into an aggregate readiness report:

- `contract_version` (string): Must be `"module_health_check_v0.1"`.
- `overall_status` (string): Combined status of all modules (e.g., `"healthy"`, `"degraded"`, `"unavailable"`).
- `checked_at` (string): ISO-8601 timestamp.
- `modules` (object / array): Map or array of normalized individual module health status objects.
- `healthy_count` (integer): Total number of healthy modules.
- `degraded_count` (integer): Total number of degraded modules.
- `unavailable_count` (integer): Total number of unavailable modules.
- `unknown_count` (integer): Total number of unknown modules.
- `readiness_status` (string): Workflow readiness state (see Section 6).
- `blocking_modules` (array of strings): List of module IDs that are preventing full run capability.
- `source` (string): Aggregate compiler identifier.
- `notes` (string): Summary comments.

---

## 6. Allowed Readiness Status Values
- `ready_for_mock_run`: All modules are healthy.
- `partially_ready`: Non-blocking modules are degraded/unavailable; execution can proceed with limitations.
- `blocked`: One or more blocking/critical modules are unavailable; execution must be suspended.

---

## 7. Dashboard Data Standard
For presenting registry health to operators, the n8n check compiles a dashboard data block:

- `dashboard_id` (string): Unique identifier for the dashboard instance.
- `generated_at` (string): ISO-8601 timestamp.
- `overall_status` (string): E.g. `"healthy"`, `"degraded"`, `"unavailable"`.
- `cards` (object): Metric summaries (e.g., counts, system status).
- `module_table` (array of objects): Tabular array of modules and their basic uptime/endpoints.
- `warnings` (array of strings): Active error warnings or degraded alerts.
- `next_actions` (array of strings): Suggested actions (e.g. "Restart CRM module stub").
- `source` (string): Dashboard generator.
- `notes` (string): Remark notes.

---

## 8. Safety & Security Rules
1.  **Mock/Local Only:** Health check nodes must only target local mock stub addresses on `localhost`.
2.  **No Production Monitoring:** Do not configure telemetry channels to production monitoring infrastructure.
3.  **No Secrets:** Workflows must run with zero credentials.
4.  **No Real External APIs:** Do not check the status of actual external provider APIs during mock tests.
5.  **No Auto-Start Servers:** Workflows must not issue terminal commands to start local stub servers automatically.
6.  **No Auto-Heal:** Workflows must not execute recovery/restart commands on failed stubs.
7.  **No Auto-Post/Ads/Messaging:** Uptime statuses and health failures must not trigger real alert emails or SMS messaging.

---

## 9. E2E Dry Run (Phase N11)
- Phase N11 dry run composes the router, health check, module run, approval gate, and error handling into one local/mock workflow (`n11_e2e_dry_run.workflow.json`).
- Real Core integration remains a future phase and requires owner approval.

