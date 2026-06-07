# THE CORE AGENCY — Modules & n8n Workstream

**Status:** Documented — Phase 1 (2026-06-07)
**Scope:** Workstream design for n8n orchestration and module integrations
**Note:** No live n8n or module builds in Phase 1–18 Core Product scope. This document defines the contracts and event schema only.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    THE CORE AGENCY                      │
│                   (Core Product)                        │
│                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │   Database   │  │  Approval     │  │  Connector  │  │
│  │  (Source of  │  │  Workflow     │  │  Registry   │  │
│  │   Truth)     │  │  Engine       │  │             │  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  Module      │  │  Automation   │  │  Webhook    │  │
│  │  Event Inbox │  │  Logs         │  │  Callback   │  │
│  │              │  │               │  │  Endpoint   │  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲                              │
         │ Webhook Callback             │ Trigger / Task
         │ (results only)              ▼
┌─────────────────────────────────────────────────────────┐
│                         n8n                             │
│                  (Automation Backbone)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Workflows: Campaign trigger, content dispatch,  │   │
│  │  approval routing, export packaging              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                      Modules                            │
│                 (Specialized Processing)                 │
│                                                         │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │ Copywriter │  │ Designer  │  │  Video Scripter  │   │
│  │  Module    │  │  Module   │  │     Module       │   │
│  └────────────┘  └───────────┘  └──────────────────┘   │
│                                                         │
│  ┌────────────┐  ┌───────────┐                          │
│  │ Ads Mgr    │  │  Report   │                          │
│  │  Module    │  │  Module   │                          │
│  └────────────┘  └───────────┘                          │
└─────────────────────────────────────────────────────────┘
```

---

## Core Principles

1. **Core is the only source of truth.** All data lives in the Core database. Modules and n8n do NOT store campaign data.
2. **n8n orchestrates, never stores.** n8n triggers modules and routes results back to Core via webhook.
3. **Modules process, then callback.** A module receives a task from n8n, processes it, and sends results to the Core webhook endpoint.
4. **UI reads from Core only.** The UI displays data stored in Core DB — it never reads directly from n8n or module outputs.
5. **Approvals are required.** n8n-generated content is marked `generated` until a human approves it in Core.

---

## Module Contracts

### Standard Module Task Schema (n8n → Module)
```json
{
  "task_id": "uuid",
  "module": "copywriter | designer | video_scripter | ads_manager | reporter",
  "campaign_id": "uuid",
  "brand_id": "uuid",
  "brief": { ... },
  "duration_days": 7 | 15 | 30,
  "callback_url": "https://core.theagency.com/api/webhooks/module-callback",
  "callback_secret": "env:WEBHOOK_SECRET"
}
```

### Standard Module Result Schema (Module → Core webhook)
```json
{
  "task_id": "uuid",
  "module": "copywriter",
  "status": "success | error",
  "campaign_id": "uuid",
  "generated_at": "ISO8601",
  "outputs": [ ... ],
  "error": null
}
```

---

## Connector Registry (Phase 14)

The Connector Registry is a Core database table + UI panel that tracks all registered n8n/module integrations.

| Field | Description |
|-------|-------------|
| `connector_id` | Unique ID |
| `name` | Human-readable name (e.g., "Copywriter Module") |
| `type` | `n8n_workflow | module | webhook` |
| `status` | `active | inactive | pending` |
| `endpoint_url` | Where to trigger / callback |
| `last_triggered_at` | Timestamp |
| `registered_at` | Timestamp |

---

## Module Event Inbox (Phase 15)

The Module Event Inbox is a Core UI panel that displays all incoming webhook callbacks from modules.

Each event shows:
- Task ID
- Module name
- Campaign / Brand
- Status (success / error)
- Timestamp
- Preview of outputs (collapsed by default)
- Action: "Review & Approve" → opens Approval Workflow

---

## n8n Trigger Surface (Phase 17)

Core will expose a trigger API that n8n can call to kick off automation:

```
POST /api/trigger/campaign-generation
POST /api/trigger/report-generation
POST /api/trigger/export-pack
```

Each endpoint validates the request, logs the trigger event, and creates a `pending` task in Core DB.
n8n polls or listens for task creation events to dispatch to modules.

---

## Safety Rules (Non-negotiable)

- No auto-post to any social platform.
- No auto-spend on ads.
- No auto-message to real customers.
- All n8n triggers require an active campaign with `status: approved` in Core DB.
- Webhook callbacks must validate `callback_secret` against env var.
- All automation events are logged in Core's Automation Logs.

---

## Phase Timeline for This Workstream

| Phase | Core Action | Workstream Action |
|-------|-------------|-------------------|
| Phase 14 | Build Connector Registry UI + DB table | Document module contracts |
| Phase 15 | Build Module Event Inbox | Design event schema |
| Phase 16 | Build webhook callback endpoint | Test with mock payload |
| Phase 17 | Build n8n trigger surface | Wire first n8n → Core test |
| Phase 18 | Production deploy | End-to-end smoke test |

---

_Last updated: Phase 1 — 2026-06-07_
