# THE CORE AGENCY — Database Schema V1

**Status:** Phase 2 DONE (2026-06-07)
**Database:** Supabase Postgres (recommended for MVP)
**SQL file:** `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql`
**TypeScript types:** `src/types/core.ts`

---

## Core Principle

> **Core database is the single source of truth.**
> n8n does NOT store data. Modules do NOT store data.
> All generated content flows back via webhook and is saved in Core DB.
> `Generated ≠ Approved`. `Approved ≠ Published`.

---

## Status Enum (applied across content lifecycle)

```
draft              — created, not yet submitted
generated          — AI/module output received, not yet reviewed
needs_review       — flagged for human review
revision_requested — reviewer asked for changes
approved           — approved by authorized user
scheduled          — approved + queued for publish
published          — live (only after final approval)
rejected           — rejected, not to be used
archived           — soft-deleted / historical record
failed             — generation or processing error
```

**State machine rule:**
- `generated` → `needs_review` → `approved` → `scheduled` → `published`
- Any state → `rejected` or `revision_requested` (resets to review cycle)
- `published` is a terminal state requiring explicit human action

---

## Schema Groups

### A. Identity / Access

| Table | Purpose |
|-------|---------|
| `users` | Thin wrapper around Supabase auth.users |
| `user_profiles` | Display name, avatar, preferences |
| `roles` | Role definitions (owner, manager, client, viewer) |
| `user_roles` | Role assignments, scoped to resource if needed |

### B. Business Objects

| Table | Purpose |
|-------|---------|
| `clients` | Client companies / accounts |
| `brands` | Brands per client (a client may have multiple brands) |
| `campaigns` | Campaign instances per brand |
| `campaign_briefs` | Brief submitted for a campaign |

### C. Content Production

| Table | Purpose |
|-------|---------|
| `generation_jobs` | Track AI/module generation task runs |
| `content_items` | Individual pieces of content (caption, script, hook, etc.) |
| `content_calendar_items` | Scheduled content per day/platform |
| `creative_briefs` | Design / video instructions |
| `ad_briefs` | Paid ads configuration briefs |

### D. Approval Workflow

| Table | Purpose |
|-------|---------|
| `approval_requests` | Approval requests for any resource |
| `approval_events` | Event log per approval (submitted, approved, rejected…) |
| `approval_comments` | Review comments on approval requests |

### E. Assets / Reports

| Table | Purpose |
|-------|---------|
| `assets` | Uploaded or generated creative assets |
| `asset_collections` | Grouped asset sets per brand/campaign |
| `reports` | Campaign performance reports |
| `report_metrics` | Individual metric rows per report |

### F. Automation / Modules

| Table | Purpose |
|-------|---------|
| `connector_registry` | Registered n8n / module / webhook connectors |
| `module_registry` | Registered processing modules |
| `module_events` | Inbound events from modules (Module Event Inbox) |
| `webhook_callbacks` | Raw webhook payloads received from modules |
| `automation_logs` | Full automation audit trail |

### G. Safety / Governance

| Table | Purpose |
|-------|---------|
| `audit_logs` | All user + system actions (append-only) |
| `system_settings` | Key-value config store |

---

## Key Relationships

```
clients
  └── brands
        └── campaigns
              ├── campaign_briefs
              ├── generation_jobs
              │     └── content_items
              ├── content_calendar_items
              ├── creative_briefs
              ├── ad_briefs
              ├── approval_requests
              │     ├── approval_events
              │     └── approval_comments
              ├── assets
              └── reports
                    └── report_metrics

module_registry
  └── module_events
        └── webhook_callbacks

connector_registry  (standalone, references campaigns loosely)
automation_logs     (global log, references any resource)
audit_logs          (global audit, append-only)
```

---

## Environment Variables Required

See `.env.example` in repo root. Required for Phase 3+:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=do_not_commit_real_secret
DATABASE_URL=
WEBHOOK_SHARED_SECRET=do_not_commit_real_secret
```

---

## Phase Dependency Map

| Phase | Uses These Tables |
|-------|------------------|
| Phase 3 — Auth | `users`, `user_profiles`, `roles`, `user_roles` |
| Phase 4 — Roles/Permissions | `roles`, `user_roles` |
| Phase 5 — Client/Brand CRUD | `clients`, `brands` |
| Phase 6 — Campaign/Brief | `campaigns`, `campaign_briefs` |
| Phase 7 — AI Generation | `generation_jobs`, `content_items` |
| Phase 8 — Content Calendar | `content_calendar_items` |
| Phase 9 — Approval Workflow | `approval_requests`, `approval_events`, `approval_comments` |
| Phase 10 — Client View | All, read-only scoped by `user_roles` |
| Phase 11 — Asset Library | `assets`, `asset_collections` |
| Phase 12 — Reports | `reports`, `report_metrics` |
| Phase 13 — Export Pack | `content_items`, `assets`, `campaigns` |
| Phase 14 — Connector Registry | `connector_registry`, `module_registry` |
| Phase 15 — Module Event Inbox | `module_events`, `webhook_callbacks`, `automation_logs` |
| Phase 16 — Webhook Endpoint | `webhook_callbacks`, `module_events` |
| Phase 17 — n8n Trigger | `connector_registry`, `generation_jobs` |
| Phase 18 — Production | All |

---

_Last updated: Phase 2 — 2026-06-07_
