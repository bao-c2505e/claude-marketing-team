# CURRENT PHASE — The Core Agency PC1

## Active Phase: Phase 13 ✅ DONE

**Phase 13 — Connector Registry + Module Event Inbox Foundation**
- Status: COMPLETED 2026-06-08
- Commit: feat: add connector registry and module event inbox foundation
- Build: pass

## Completed Phases

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Project Bootstrap | ✅ DONE |
| Phase 2 | Authentication + Role System | ✅ DONE |
| Phase 3 | UI Foundation + Dashboard | ✅ DONE |
| Phase 4 | Client/Brand/Campaign Management | ✅ DONE |
| Phase 5 | Brief Intake Foundation | ✅ DONE |
| Phase 6 | Content Generation Foundation | ✅ DONE |
| Phase 7 | Content Calendar Foundation | ✅ DONE |
| Phase 8 | Approval Workflow Foundation | ✅ DONE |
| Phase 9 | Client View Foundation | ✅ DONE |
| Phase 10 | Asset Library Foundation | ✅ DONE |
| Phase 11 | Report Module Foundation | ✅ DONE |
| Phase 12 | Export Pack Foundation | ✅ DONE |
| Phase 13 | Connector Registry + Module Event Inbox Foundation | ✅ DONE |

## Next Phase

**Phase 14 — Supabase CRUD Wiring (Real Persistence)**
- Replace localStorage stores with real Supabase tables (core_data, gen_data, approval_data, asset_data)
- RLS policies: client can only see own data
- Real auth via Supabase Auth (email/password)
- No changes to UI — data layer swap only

## Active Constraints

- Content Factory (Automation Factory → Content Pack): production n8n AI Provider `external_module` path is ACTIVE / PASS; falls back to a local generator when its webhook env is missing.
- Design Brief Generation V1 (Automation Factory → Generate Design Briefs): Core-side implementation is DONE / ready, but real n8n Design Factory activation is NOT STARTED / Owner-gated. It currently defaults to local fallback while the env is missing — it does NOT run in production via n8n yet. Activation requires: (1) importing the n8n Design Factory workflow, and (2) setting `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` in Vercel. Design briefs are text/spec only (no image generation, no Canva/ComfyUI/Fal.ai).
- Legacy in-tab Content Generation remains local-only. UI labels are mode-aware ("n8n AI Provider" / "Local fallback mode"). AI provider key stays only in n8n Credentials.
- No auto-post. No auto-ads spending. No auto-message.
- No secrets/API keys hardcoded. No .env commits.
- No Supabase service role key in frontend.
- Generated ≠ Approved. Approved ≠ Published.
- Content items default status: needs_review.
- Client Portal: feedback/comment only. No internal workspace exposed.
- Connector Registry (Phase 13): registry only. No real API calls. No real webhooks sent.
