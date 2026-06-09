# CURRENT PHASE — Phase 15: Supabase Auth + Database Wiring Plan ✅ DONE

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 15 — Supabase Auth + Database Wiring Plan
- **Mục tiêu:** Kiểm tra schema/database readiness, chuẩn hóa Supabase client/env, tạo wiring plan, chuẩn bị repository interface, tạo SQL apply guide. CRUD wiring full được defer sang Phase 16.
- **Trạng thái:** ✅ DONE — Audit done, plan docs written, repository interface created, build pass.

---

## 📋 Checklist Phase 15

### A. Supabase Readiness Audit
- [x] Auth status audit — AuthContext, supabaseClient, LoginScreen: ✅ all ready
- [x] Schema audit — all 7 groups + tables mapped in schema_v1.sql ✅
- [x] localStorage → Supabase tables mapping (all 7 stores)
- [x] RLS requirements documented (2 patterns + content visibility rules)
- [x] Missing/deferred items listed (export_packs table, RLS policies, calendar_items CRUD)
- [x] Created `CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`

### B. Environment Standardization
- [x] `.env.example` verified: VITE_ prefix for frontend, SERVICE_ROLE_KEY with warning, WEBHOOK_SHARED_SECRET placeholder — ✅ already correct, no changes needed
- [x] Safety rules documented: service role key never in frontend/Vercel public env

### C. Supabase Client Safety
- [x] `src/lib/supabaseClient.ts` verified: anon key only, null-safe, isSupabaseConfigured, HTTPS check — ✅ already correct, no changes needed

### D. Auth Wiring Foundation
- [x] `src/lib/auth/AuthContext.tsx` verified: supabase/demo/unconfigured modes all work, role fetch from DB, demo fallback intact — ✅ already correct, no changes needed
- [x] Auth flow documented in supabase_wiring_README.md section 4
- [x] Demo Sign In fallback confirmed working

### E. Repository Interface Plan
- [x] Created `src/lib/core/coreRepository.ts` — TypeScript interfaces for all 10 data domains:
  - ClientRepository, BrandRepository, CampaignRepository, BriefRepository
  - GenerationJobRepository, ContentItemRepository
  - ApprovalRequestRepository, ApprovalEventRepository, ApprovalCommentRepository
  - AssetRepository, AssetCollectionRepository
  - ExportPackRepository
  - ConnectorRepository, ModuleRepository, ModuleEventRepository
  - AutomationLogRepository
  - CoreRepositories bundle interface
- [x] Phase 16 wiring strategy documented in file comments + supabase_wiring_README.md section 5

### F. SQL Apply Guide
- [x] Updated `CLAUDE_MARKETING_TEAM/03_core/database/README.md` with:
  - Step-by-step guide (create project → apply SQL → configure auth → assign owner role → set env vars → redeploy → verify)
  - SQL snippet for assigning owner role
  - Service role key warning
  - Related docs links

### G. UI Indicator
- [x] Verified existing indicators — ✅ no changes needed:
  - Login screen: "⚠️ Supabase not configured" banner when unconfigured
  - "Demo Sign In" title when unconfigured (vs "Sign in" when configured)
  - Demo credentials pre-filled when unconfigured
  - `isSupabaseConfigured` badge used in ConnectorRegistry, AutomationLogs, ExportPack tabs

### H. Docs / Logs
- [x] CURRENT_PHASE.md updated
- [x] SESSION_SUMMARY.md updated
- [x] 08_logs/phase_log.md updated
- [x] 08_logs/agent_activity_log.md updated

### Safety
- [x] No secrets in any file
- [x] No real API calls
- [x] Service role key documented as "never in frontend"
- [x] Demo Sign In fallback preserved
- [x] localStorage fallback preserved
- [x] Build pass (tsc + vite, 0 errors)

---

## 🗂️ Phase 15 Deliverables

| File | Type | Action |
|---|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md` | Docs | NEW — full audit + wiring plan |
| `src/lib/core/coreRepository.ts` | Code | NEW — TypeScript repository interfaces |
| `CLAUDE_MARKETING_TEAM/03_core/database/README.md` | Docs | UPDATED — full SQL apply guide |
| `src/lib/supabaseClient.ts` | Code | No changes needed |
| `src/lib/auth/AuthContext.tsx` | Code | No changes needed |
| `.env.example` | Config | No changes needed |

---

## 🔌 localStorage → Supabase Mapping (Quick Reference)

| Store Key | Tables | Phase 16? |
|---|---|---|
| `core_agency_core_data_v1` | clients, brands, campaigns, campaign_briefs | ✅ P16 |
| `core_agency_gen_data_v1` | generation_jobs, content_items | ✅ P16 |
| `core_agency_approval_data_v1` | approval_requests, approval_events, approval_comments | ✅ P16 |
| `core_agency_asset_data_v1` | assets, asset_collections | ✅ P16 |
| `core_agency_export_pack_data_v1` | (no table yet — local only) | P17+ |
| `core_agency_connector_registry_v1` | connector_registry, module_registry, module_events | P17+ |
| `core_agency_automation_logs_v1` | automation_logs | P17+ |

---

## 🛡️ Safety Guard (Phase 15)
- Secrets committed: NO
- Service role key in frontend: NO
- Real API called: NO
- Demo Sign In fallback: PRESERVED
- localStorage fallback: PRESERVED
- Auto-post/ads/messaging: NO
- Build: PASS (0 errors)

---

## ✅ Previous Phases (CLOSED)

| Phase | Feature | Commit |
|---|---|---|
| Phase 1 | Strategy + Branding | 317c6c8 |
| Phase 2 | Database Schema V1 | d0cb365 |
| Phase 3 | Auth + Role Permission | d8b972a |
| Phase 4 | Client/Brand/Campaign Management | (committed) |
| Phase 5 | Brief Intake | (committed) |
| Phase 6 | Content Generation | (committed) |
| Phase 7 | Content Calendar | (committed) |
| Phase 8 | Approval Workflow | (committed) |
| Phase 9 | Client View Foundation | (committed) |
| Phase 10 | Asset Library Foundation | 2ff8007 |
| Phase 11 | Report Module Foundation | 6e15e25 |
| Phase 12 | Export Pack Foundation | 860d06e |
| Phase 13 | Connector Registry + Module Event Inbox | f21dbf7 |
| Phase 14 | Automation Logs Foundation | 2d3c009 |
| Phase 14 Codex Fix | Restrict Automation Logs to Internal View | 894b751 |
| Phase 15 | Supabase Auth + Database Wiring Plan | (this phase) |
