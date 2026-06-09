# Error Handling, Retry & Logging Contract

**Version:** error_retry_logging_v0.1

---

## 1. Goal & Objectives
This contract standardizes the way failures, retries, and logging are handled across the n8n workflows and specialist modules (PC2 workstream). It ensures that:
- Every error is normalized into a standard envelope.
- Retry policy decisions (e.g. retry vs. dead-letter) are structured and automated via mock engines.
- System execution logs are uniformly formatted for auditing.
- No production notifications, real database transactions, or external system notifications are executed.

---

## 2. Error Object Standard
All module and routing errors must be normalized into the following structure:

### Required Fields
- `contract_version` (string): Must be `"error_retry_logging_v0.1"`.
- `request_id` (string): Unique UUIDv4 matching the original request.
- `event_type` (string): The event type under execution (e.g., `creative_asset.requested`).
- `brand_id` (string): Strictly `"brand_demo_001"` in mock mode.
- `campaign_id` (string): Campaign ID.
- `module_id` (string): The ID of the module that failed.
- `error_type` (string): Must be one of the allowed error types (see Section 3).
- `error_code` (string): Short identifier for specific error (e.g. `ERR_HTTP_500`).
- `error_message` (string): Human-readable error description.
- `retryable` (boolean): Flag indicating if the error can be retried.
- `attempt` (integer): Current execution attempt number (1-based).
- `max_attempts` (integer): Maximum retry threshold.
- `next_action` (string): The direct next step determined (e.g., `"retry"`, `"dead_letter"`, `"stop"`).
- `timestamp` (string): ISO-8601 timestamp of failure.
- `source` (string): The origin of the error wrapper.
- `metadata` (object): Additional context, stack traces, or payload highlights.

---

## 3. Allowed Error Types
The `error_type` field must contain exactly one of the following values:
- `http_error`: Network connection failures, 5xx server responses, or request timeouts from endpoint.
- `timeout`: Module exceeded its maximum runtime limit.
- `validation_error`: Invalid payload attributes or contract mismatches on input.
- `unsupported_event_type`: Event type is unrecognized by the router.
- `module_unavailable`: Stub server is offline or unreachable.
- `schema_mismatch`: Module output failed validation against expected contract formats.
- `unknown_error`: Default fallback category for unclassified exceptions.

---

## 4. Retry Policy Standard
Retry policies determine if, when, and how a failed request is retried:

- `retry_policy_id` (string): Unique policy identifier.
- `max_attempts` (integer): Maximum execution attempts allowed (default: `3`).
- `backoff_strategy` (string): Backoff style, e.g. `"mock_exponential_backoff"`.
- `retryable_error_types` (array of strings): List of error types eligible for retry.
- `non_retryable_error_types` (array of strings): List of error types that skip retry immediately.
- `on_exhausted` (string): Action to perform when attempts are depleted (e.g., `"send_to_mock_dead_letter"`).
- `notes` (string): Explanatory documentation.

---

## 5. Execution Log Entry Standard
All execution states (successes, retries, halts, dead-letters) must compile a log entry matching:

- `log_id` (string): Unique UUIDv4 identifier for the log row.
- `request_id` (string): Matching request UUIDv4.
- `event_type` (string): Event type.
- `module_id` (string): Executing module.
- `phase` (string): Pipeline phase (e.g. `"routing"`, `"execution"`, `"callback"`, `"error_handling"`).
- `status` (string): Status of the phase (e.g. `"success"`, `"retry_scheduled"`, `"dead_lettered"`, `"failed"`).
- `message` (string): Log line detail.
- `attempt` (integer): Current execution count.
- `timestamp` (string): ISO-8601 timestamp.
- `source` (string): System logging agent identifier.
- `metadata` (object): System attributes at logging time.

---

## 6. Dead-Letter Queue Mock Standard
When retries are exhausted or non-retryable errors occur, task state is saved into a mock dead-letter wrapper:

- `dead_letter_id` (string): Unique DLQ identifier.
- `request_id` (string): original request UUID.
- `event_type` (string): original event type.
- `module_id` (string): Failed module ID.
- `error` (object): Normalized standard error object (Section 2).
- `attempts` (integer): Total execution attempts made before failure.
- `final_status` (string): Strictly `"exhausted_to_dead_letter"` or `"manual_review_required"`.
- `source` (string): Wrapper creator ID.
- `created_at` (string): ISO-8601 registration time.
- `notes` (string): Operator manual review notes.

---

## 7. Error Callback Preview Standard
The mock callback dispatched back to the Core representing a processing failure:

- `request_id` (string): Unique UUIDv4 matching the original request.
- `event_type` (string): The event type.
- `module_id` (string): Failed module ID.
- `callback_type` (string): Must be `"error_preview"`.
- `status` (string): The failure status (e.g., `"failed"`).
- `error` (object): Normalized error object summary.
- `retry_summary` (object): Attempts log (e.g. `{ attempt: 3, max_attempts: 3, strategy: "mock_exponential_backoff" }`).
- `source` (string): Output generator.
- `generated_at` (string): ISO-8601 generation timestamp.
- `notes` (string): Remarks for the operator.

---

## 8. Safety & Security Rules
1.  **No Production Callbacks:** Do not dispatch callback requests to live Core API servers.
2.  **No Real Dead-Letter Queues:** Staging is strictly local and simulated. Do not interface with AWS SQS, RabbitMQ, or other messaging providers.
3.  **No Real Database Writes:** Do not write execution logs to production tables.
4.  **No Real Logging Services:** Do not configure Datadog, Logstash, or external telemetry agents.
5.  **No Secrets:** Workflows must operate without passwords, tokens, or credential references.
6.  **No Auto-Post/Ads/Messaging:** Error states must not trigger notification emails or SMS alerts to actual users.
7.  **Owner Approval:** Moving from mock error handling to live queue routing requires explicit owner confirmation.
