# Connector Registry + Module Event Inbox — Phase 13

## Overview

Phase 13 adds a Connector Registry and Module Event Inbox to The Core Agency workspace.
This is a **registry-only** implementation — no real API calls, no real webhooks sent.

## Architecture

```
Core Workspace
└── Connector Registry Tab
    ├── Connectors      — 11 external service connectors (all: not_configured / mock)
    ├── Modules         — 10 specialist automation modules
    └── Event Inbox     — Mock/simulated inbound events from modules/n8n
```

## Connectors (11)

| ID | Name | Type |
|---|---|---|
| conn-n8n | n8n Webhook Backbone | n8n |
| conn-openai | OpenAI | openai |
| conn-anthropic | Anthropic / Claude | anthropic |
| conn-gemini | Google Gemini | gemini |
| conn-canva | Canva | canva |
| conn-meta-ads | Meta Ads | meta_ads |
| conn-google-drive | Google Drive | google_drive |
| conn-google-sheets | Google Sheets | google_sheets |
| conn-comfyui | ComfyUI | comfyui |
| conn-storage | Supabase Storage | storage |
| conn-webhook | Webhook Callback | webhook |

All connectors seed as `status: not_configured, mode: mock`.

## Modules (10)

| Module Name | Type | Default Status |
|---|---|---|
| content_auto | copywriter | mock_ready |
| creative_asset_auto | designer | planned |
| ads_pack_auto | ads_manager | planned |
| crm_followup_auto | custom | planned |
| comment_inbox_reply_assistant | custom | planned |
| approval_publishing_automation | custom | planned |
| analytics_intelligence | reporter | planned |
| competitor_intelligence | reporter | planned |
| website_landing_intelligence | reporter | planned |
| comfyui_creative_module | designer | planned |

## Event Types (12)

`generation_requested` · `generation_completed` · `creative_requested` · `creative_completed`
`ads_pack_requested` · `ads_pack_completed` · `approval_submitted` · `approval_completed`
`report_generated` · `webhook_received` · `error` · `other`

## Data Layer

- Storage key: `core_agency_connector_registry_v1`
- File: `src/lib/core/connectorRegistry.ts`
- Types: `src/types/core.ts` (Phase 13 section)

## Permissions

| Action | Roles |
|---|---|
| View connectors | owner, manager |
| Manage connectors (actions) | owner |
| View automation logs (event inbox actions) | owner, manager |

## Safety Boundaries (Phase 13)

- No real API calls to any connector
- No real webhooks sent or received
- No real ads created or budget spent
- No auto-post, no auto-message, no auto-publish
- API keys/tokens NEVER in frontend — backend proxy required when real connectors are activated
- Production mode requires manual .env setup + owner approval (Phase 14+)
- Mock events are local only — simulated via `addMockEvent()`, stored in localStorage

## UI Components

- `src/components/core/ConnectorRegistryTab.tsx`
  - Safety banner (always visible)
  - 3 sub-tabs: Connectors / Modules / Event Inbox
  - Connector cards: status/mode badges, required env keys, safety note, actions
  - Module cards: contract info, owner, status actions
  - Event Inbox: filter bar, expandable rows, payload preview, status actions, Create Mock Event form
  - Governance footer with Phase 13 safety reminders

## Next Phase

Phase 14 — Supabase CRUD Wiring: replace localStorage with real Supabase tables,
implement RLS policies, wire real Supabase Auth.
