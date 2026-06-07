# THE CORE AGENCY — 7-Day Real Operations MVP Plan

**Status:** Phase 1 Active (2026-06-07)
**Target:** 18 Phases / 7 Days — Core Product only
**Repo:** claude-marketing-team (technical name preserved)
**Production:** Vercel (claude-marketing-team-demo.vercel.app)

---

## Architecture (Locked)

```
Core (this repo)       = Management + Approval + Source of Truth DB
n8n                    = Automation backbone / orchestrator
Modules                = Specialized processing (copywriter, designer, etc.)
Webhook                = Modules → Core callback (results only)
UI                     = Reads from Core DB only, displays stored data
```

**Rules:**
- Core database = single source of truth. n8n is NOT a database.
- `Generated ≠ Approved`. `Approved ≠ Published`.
- Real-world actions require final human approval.
- No auto-post. No auto-ads spending. No auto-message to real customers.
- No hardcoded secrets/API keys/tokens.
- All env vars via `.env.example` — never commit real secrets.

---

## 18-Phase Plan

### Day 1 — Foundation
| Phase | Title | Status |
|-------|-------|--------|
| Phase 1 | Product Scope Lock + Source Strategy + Branding | ✅ ACTIVE |
| Phase 2 | Database Schema V1 (Supabase) | pending |
| Phase 3 | Auth / Login (NextAuth or Supabase Auth) | pending |

### Day 2 — Core Data Layer
| Phase | Title | Status |
|-------|-------|--------|
| Phase 4 | Role & Permission System (Owner / Manager / Client) | pending |
| Phase 5 | Client & Brand Management CRUD | pending |
| Phase 6 | Campaign Management + Brief Intake Form | pending |

### Day 3 — AI Generation Layer
| Phase | Title | Status |
|-------|-------|--------|
| Phase 7 | AI Content Generation (7 / 15 / 30 days) | pending |
| Phase 8 | Content Calendar View | pending |
| Phase 9 | Approval Workflow (Generated → Approved → Published states) | pending |

### Day 4 — Client-facing Layer
| Phase | Title | Status |
|-------|-------|--------|
| Phase 10 | Client View (read-only, approval-gated) | pending |
| Phase 11 | Asset Library | pending |
| Phase 12 | Report Module | pending |

### Day 5 — Export & Packs
| Phase | Title | Status |
|-------|-------|--------|
| Phase 13 | Export Pack (PDF / ZIP / markdown) | pending |
| Phase 14 | Connector Registry (n8n/module contracts) | pending |
| Phase 15 | Module Event Inbox + Automation Logs | pending |

### Day 6 — Integration Layer
| Phase | Title | Status |
|-------|-------|--------|
| Phase 16 | Webhook Callback Endpoint (modules → Core) | pending |
| Phase 17 | n8n Trigger Surface + Event Schema | pending |

### Day 7 — Ship
| Phase | Title | Status |
|-------|-------|--------|
| Phase 18 | Production Deploy + Smoke Test + Handoff Docs | pending |

---

## Core Product Scope

The Core Agency Core Product handles:
- **Branding** — Public UI as "The Core Agency"
- **Auth/Login** — Real authentication
- **Database** — Persistent, real data (not mock)
- **Role Permissions** — Owner / Manager / Client tiers
- **Client & Brand Management** — CRUD for clients, brands
- **Campaign Management** — Brief intake, campaign lifecycle
- **AI Generation** — 7 / 15 / 30 day content plans
- **Content Calendar** — Visual calendar of scheduled content
- **Approval Workflow** — Generated → Approved → Published state machine
- **Client View** — Gated, clean presentation layer
- **Asset Library** — Approved assets store
- **Report Module** — Campaign performance summaries
- **Export Pack** — PDF/ZIP/markdown bundles
- **Connector Registry** — Registered n8n/module integrations
- **Module Event Inbox** — Incoming results from modules
- **Automation Logs** — Audit trail of all automation events
- **Production Deploy** — Live, stable, scalable

## Out of Scope for Core (Phase 1–18)
- Individual module builds (copywriter engine, designer engine, etc.)
- Real n8n workflow implementation
- Real social platform connectors (Meta, TikTok, Google Ads)
- Real payment processing

---

## Previous Work (Phase A–H)

The repo contains a complete demo/workspace UI (React + Vite, static frontend).
- **Phase A–G:** Core workspace infrastructure, React UI, mock data, AI agents simulation
- **Phase H.1–H.7:** Export, presentation, multi-brand, owner/client view modes

These phases remain in the codebase as the UI foundation.
Phase 1 (Real MVP) adds strategy, branding, and prepares for real backend from Phase 2 onward.

---

_Last updated: Phase 1 — 2026-06-07_
