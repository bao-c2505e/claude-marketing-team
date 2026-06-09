# Phase N9 — Error Handling + Retry + Logging Contract

## 1. Objectives & Overview
In a distributed microservice environment, transient network blips, system timeouts, format changes, and incorrect input payloads are inevitable. Phase N9 establishes a standard contract for error representation, retry policies, execution logging, and dead-letter staging within the n8n and specialist modules workstream (PC2).

By standardizing error outputs, we ensure:
1.  **Uniformity:** Every module error reports back under the same wrapper structure.
2.  **Predictability:** The n8n engine can automatically decide to retry transient errors or route non-retryable errors immediately.
3.  **Auditability:** Standard execution logs and dead-letter queues capture context without polluting production log files or databases.
4.  **Aesthetics & Control:** Error responses can be previewed as mock callbacks before manual reviewer review.

---

## 2. Files Created & Updated
- **Contracts:**
  - `contracts/error_handling_retry_logging_contract.md` (New Contract)
  - `contracts/unified_callback_contract.md` (Updated)
  - `contracts/n8n_event_router_contract.md` (Updated)
  - `contracts/module_registry.md` (Updated)
- **JSON Examples (`contracts/examples/n8n/n9/`):**
  - Errors: `error_http_error.json`, `error_timeout.json`, `error_validation_error.json`, `error_unsupported_event_type.json`, `error_schema_mismatch.json`
  - Retry Policies: `retry_policies/default_retry_policy.json`, `retry_policies/no_retry_policy.json`
  - Log Entries: `log_entries/execution_log_success.json`, `log_entries/execution_log_retry_scheduled.json`, `log_entries/execution_log_dead_lettered.json`
  - Dead Letters: `dead_letters/dead_letter_timeout_exhausted.json`, `dead_letters/dead_letter_schema_mismatch.json`
  - Expected Outputs: `expected_outputs/retry_scheduled_expected_output.json`, `expected_outputs/dead_letter_expected_output.json`, `expected_outputs/validation_error_expected_output.json`, `expected_outputs/unsupported_event_expected_output.json`
- **Workflows:**
  - `n8n-workflows/n9_error_retry_logging.workflow.json` (New Workflow)
- **Tooling & Logs:**
  - `contracts/tools/validate_contracts.js` (Updated)
  - `docs/pc2/phase_log.md` (Updated)

---

## 3. Core Concepts & Mappings

### A. Allowed Error Types
- `http_error`: Network issues or 5xx server responses.
- `timeout`: Module exceeded execution time.
- `validation_error`: Invalid inputs (non-retryable).
- `unsupported_event_type`: Event cannot be routed (non-retryable).
- `module_unavailable`: Stub offline or unreachable.
- `schema_mismatch`: Output does not match contract specifications.
- `unknown_error`: Unclassified failures.

### B. Retry Decisions
- `retry_scheduled`: Transient errors when `attempt < max_attempts`.
- `no_retry`: Non-retryable errors.
- `exhausted_to_dead_letter`: Transient errors when `attempt >= max_attempts`.
- `manual_review_required`: Special route failures (e.g. unknown events).

---

## 4. How to Import the Workflow into n8n
1.  Open your n8n local instance (`http://localhost:5678`).
2.  Create a new blank workflow.
3.  Click the top-right menu (three dots icon) and choose **Import from File**.
4.  Select `n8n-workflows/n9_error_retry_logging.workflow.json`.
5.  Save the workflow.

---

## 5. Manual Testing Scenarios
To simulate and test error states, edit parameters in the **Set: Mock Error Scenario** node of the workflow.

### Scenario 1: `http_error` (Retry Scheduled)
- **Mock parameters:**
  - `error_type`: `"http_error"`
  - `attempt`: `1`
  - `max_attempts`: `3`
- **Expected Outcome:** The workflow routes to the `retry_scheduled` branch, producing an execution log with status `"retry_scheduled"` and setting the error callback status to `"retrying"`.

### Scenario 2: `timeout` (Attempts Exhausted -> Dead Letter Queue)
- **Mock parameters:**
  - `error_type`: `"timeout"`
  - `attempt`: `3`
  - `max_attempts`: `3`
- **Expected Outcome:** The workflow routes to `exhausted_to_dead_letter`, creating a `dead_letter_preview` object with `final_status: "exhausted_to_dead_letter"` and marking the callback status as `"failed"`.

### Scenario 3: `validation_error` (No Retry)
- **Mock parameters:**
  - `error_type`: `"validation_error"`
  - `attempt`: `1`
  - `max_attempts`: `3`
- **Expected Outcome:** The workflow routes to `no_retry`. Since validation failures are logical errors, they cannot be resolved by retrying. The callback status is immediately `"failed"`.

### Scenario 4: `unsupported_event_type` (Manual Review Required)
- **Mock parameters:**
  - `error_type`: `"unsupported_event_type"`
  - `attempt`: `1`
  - `max_attempts`: `1`
- **Expected Outcome:** The workflow routes to `manual_review_required`. The DLQ preview is populated with `final_status: "manual_review_required"` to prompt operator investigation.

### Scenario 5: `schema_mismatch` (No Retry)
- **Mock parameters:**
  - `error_type`: `"schema_mismatch"`
  - `attempt`: `1`
  - `max_attempts`: `3`
- **Expected Outcome:** Schema mismatch indicates a design contract drift. The workflow routes to the `no_retry` path for safety.

---

## 6. Troubleshooting Guide
-   **Unsupported `error_type`:** If the error type parameter in the Set node is not recognized, the normalization code default-classifies it as `unknown_error` or throws a validation error. Check Section 3.A for valid error types.
-   **Missing Fields:** If the incoming error payload is missing key parameters (such as `request_id` or `event_type`), the "Code: Normalize Error Object" node automatically fills them with fallback defaults or raises validation issues.
-   **Invalid JSON:** Ensure that formatting in the Set node contains valid Javascript primitives or JSON objects.
-   **Retryable Flag Mismatch:** If a validation error is marked `retryable: true` in the source mock, the Normalize node JS Code overrides this because the policy defines validation errors as strictly non-retryable.
-   **Attempt >= Max Attempts:** If the mock input attempt number is greater than or equal to `max_attempts`, the logic automatically switches the decision from `retry_scheduled` to `exhausted_to_dead_letter` on transient errors.

---

## 7. Safety & Security Rules
-   **Mock Only:** All queues, dead-letters, and notifications are simulated inside the n8n JSON context.
-   **No Real Queues:** Do not configure AWS SQS, RabbitMQ, or other brokers.
-   **No Real Databases:** Do not attempt to write logs to PostgreSQL or MySQL.
-   **No Real Logging Services:** Do not dispatch telemetry to Datadog or ELK stack.
-   **No Real Callback:** Do not send webhook callbacks to live external URLs.
-   **No Production URLs:** Do not use `thecoreagency.com` in workflows or examples.
-   **No Secrets:** Running workflows require zero API keys or passwords.
-   **No Auto-Post:** Social content packs under error states must never automatically publish.
-   **No Real Ads:** Do not spend mock budgets on live platforms.
-   **No Real Messaging:** No actual notification emails or SMS should be generated.
-   **Owner Approval Required:** Transitioning to live webhook integrations requires explicit owner approval.
