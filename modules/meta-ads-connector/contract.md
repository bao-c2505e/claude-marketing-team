# Meta Ads Connector Contract

This document specifies the integration contract, inputs, outputs, and safety policies for the Meta Ads Connector Module.

## 1. Input Specification
Conforms to `n8n_to_module_request.schema.json`.

Key payload fields:
- `campaign_name`: String.
- `daily_budget`: Integer. Budget in cents (e.g. 5000 = $50.00).
- `targeting`: Object (e.g. locations, age_min, interests).
- `creatives`: Array of asset URLs to use as ad images/videos.

## 2. Output Specification
Conforms to `module_to_core_callback.schema.json`.

Key payload fields:
- `fb_campaign_id`: String. Meta Campaign ID.
- `fb_adset_id`: String. Meta Ad Set ID.
- `status`: String (`SUCCESS` or `FAILED`).

## 3. Safety Rules
- **No Ads Spend without Approval**: If `safety.allow_ads_spend` is `false` or `safety.final_approval_granted` is `false`, the module must refuse the execution and callback with status `REJECTED_BY_SAFETY`.
- **Sandbox Mode**: During testing, the module should direct API calls to the Meta Sandbox Ad Account or use a mock client, unless `safety.allow_real_world_action` is `true`.
- **Forbidden actions in V1**: Modifying billing setups, deleting existing campaigns, raising budgets above predefined threshold.
