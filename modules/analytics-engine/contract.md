# Analytics Engine Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Analytics Engine Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `start_date`: String (YYYY-MM-DD).
- `end_date`: String (YYYY-MM-DD).
- `metrics`: Array of strings (e.g. `["impressions", "clicks", "spend", "conversions"]`).
- `filters`: Object (e.g. `{"campaign_id": "12345"}`).

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `summary`: Object containing aggregated metrics (`total_spend`, `total_clicks`, `ctr`, `cpc`, `roas`).
- `daily_breakdown`: Array of daily metric records.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **No mutations**: This engine must only perform analytical queries.
- **Allowed actions in V1**: Run reports, calculate derived statistics, export static CSV reports, callback values.
- **Forbidden actions in V1**: Executing any write commands to Meta Ads API, changing budget values in other databases, or sending report links to real clients directly via email.
