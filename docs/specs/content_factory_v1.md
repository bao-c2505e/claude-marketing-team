# Content Factory V1 Contract

Status: draft implementation spec
Scope: Core UI -> n8n -> AI provider -> Core output queue -> Owner approval

## Safety Rules

- No auto-post.
- No auto-ads.
- No live Meta/TikTok/Zalo posting APIs in this phase.
- No secrets in code or workflow JSON.
- n8n credentials must be configured inside n8n, not committed to git.
- Every generated output must require Owner approval before use.

## Core Request Payload

Core sends this JSON to `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL` only when that env value is configured. If absent, Core uses local mock generation.

```json
{
  "request_id": "cf-...",
  "workflow_type": "content_pack",
  "generated_by": "owner@example.com",
  "owner_approval_required": true,
  "requested_at": "2026-06-16T00:00:00.000Z",
  "client": { "id": "client-id", "name": "Client Name" },
  "brand": {
    "id": "brand-id",
    "name": "Brand Name",
    "industry": "F&B",
    "hero_product": "Hero product",
    "tone_of_voice": "Brand tone",
    "target_audience": "Audience"
  },
  "campaign": {
    "id": "campaign-id",
    "name": "Campaign Name",
    "description": "Campaign description"
  },
  "brief": {
    "id": "brief-id",
    "title": "Brief title",
    "campaign_goal": "Goal",
    "product_focus": "Product focus",
    "offer": "Offer",
    "channels": ["Facebook", "TikTok"],
    "content_pillars": ["Product", "Promo"],
    "key_messages": ["Message 1"],
    "must_include": "Required details",
    "must_avoid": "Restrictions",
    "approval_requirements": "Owner review"
  },
  "options": {
    "plan_length_days": 7,
    "channel": "Facebook",
    "goal": "branding"
  },
  "safety": {
    "no_auto_post": true,
    "no_auto_ads": true,
    "no_live_connectors": true,
    "no_secrets": true,
    "owner_approval_required": true
  }
}
```

## n8n Response / Callback Payload

n8n should return synchronously for V1. A later backend callback can reuse the same `job` and `items` envelope.

```json
{
  "ok": true,
  "request_id": "cf-...",
  "workflow_type": "content_pack",
  "generated_by": "n8n-ai-provider",
  "owner_approval_required": true,
  "status": "pending_approval",
  "job": {
    "external_execution_id": "n8n-execution-id",
    "item_count": 7
  },
  "items": [
    {
      "day_number": 1,
      "planned_date": "2026-06-17",
      "channel": "Facebook",
      "content_type": "caption",
      "pillar": "Product",
      "angle": "Hook angle",
      "hook": "Short hook",
      "caption": "Draft caption",
      "visual_brief": "Draft visual direction",
      "cta": "Call to action",
      "hashtags": "#Brand",
      "generated_by": "n8n-ai-provider",
      "workflow_type": "content_pack",
      "status": "pending_approval",
      "owner_approval_required": true
    }
  ],
  "safety": {
    "no_auto_post": true,
    "no_auto_ads": true,
    "no_live_connectors": true,
    "owner_approval_required": true
  }
}
```

## Core Content Item Mapping

The current Core UI storage uses `ContentPlanItem.status = "needs_review"` for pending approval. Content Factory V1 maps:

- Contract `status = "pending_approval"` -> Core item `status = "needs_review"`
- Contract `owner_approval_required = true` -> approval request `status = "submitted"`
- `generated_by`, `workflow_type`, `owner_approval_required`, and contract status are stored visibly in the generated item text until database metadata fields exist.

## Failure Handling

- Missing webhook env: Core uses local mock response and marks job `generation_mode = "mock"`.
- Configured webhook network/HTTP/contract failure: Core shows an error and does not create content.
- n8n validation failure should return `{ "ok": false, "error": { "code": "...", "message": "..." } }`.
- Failed outputs must not create approved, published, scheduled, or launched records.

## Approval Rules

- Generated items enter Core as `needs_review`.
- Core creates approval requests with `status = submitted`.
- Owner may approve, request revision, or reject in the Approval Board.
- Approved content is still not posted or scheduled by this phase.
