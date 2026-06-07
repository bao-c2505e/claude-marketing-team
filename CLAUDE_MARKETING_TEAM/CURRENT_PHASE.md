# CURRENT PHASE — Phase 2: Database Schema V1 ✅ DONE

Tài liệu này dùng để theo dõi tiến độ thực hiện và trạng thái của Phase hiện tại.

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 2 — Database Schema V1
- **Mục tiêu:** Thiết kế và đưa vào source database schema V1 cho The Core Agency Real Operations MVP. Bao phủ toàn bộ domain: Identity/Access, Business Objects, Content Production, Approval Workflow, Assets/Reports, Automation/Modules, Safety/Governance.
- **Trạng thái:** ✅ DONE — Schema SQL created, TypeScript types created, .env.example created, strategy doc created, logs updated, build pass, pushed.

---

## 📋 Checklist Phase 2

### Strategy Document
- [x] `00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md` — full schema overview, group map, phase dependency map

### SQL Schema
- [x] `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql`
  - [x] All ENUMs defined (content_status, approval_status, campaign_status, module_type, etc.)
  - [x] Group A: users, user_profiles, roles (seeded), user_roles
  - [x] Group B: clients, brands, campaigns, campaign_briefs
  - [x] Group C: generation_jobs, content_items, content_calendar_items, creative_briefs, ad_briefs
  - [x] Group D: approval_requests, approval_events, approval_comments
  - [x] Group E: asset_collections, assets, reports, report_metrics
  - [x] Group F: connector_registry, module_registry, module_events, webhook_callbacks, automation_logs
  - [x] Group G: audit_logs, system_settings (seeded: app_name, auto_post_enabled=false, require_approval=true)
  - [x] Indexes on all FK + high-cardinality query columns
  - [x] `set_updated_at()` trigger on all tables with updated_at
  - [x] RLS enabled on key tables (policies deferred to Phase 3)
- [x] `CLAUDE_MARKETING_TEAM/03_core/database/README.md`

### TypeScript Types
- [x] `src/types/core.ts` — full type definitions matching schema
  - [x] All ENUMs as TypeScript union types
  - [x] All 30+ table interfaces
  - [x] Composite view types (BrandWithClient, CampaignWithBrand, ApprovalRequestWithEvents, etc.)

### Environment Variables
- [x] `.env.example` — safe placeholders only
  - [x] VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - [x] SUPABASE_SERVICE_ROLE_KEY=do_not_commit_real_secret
  - [x] DATABASE_URL, WEBHOOK_SHARED_SECRET, N8N_API_KEY, ANTHROPIC_API_KEY
  - [x] VITE_APP_NAME, VITE_APP_TAGLINE, VITE_APP_MODE
- [x] `.gitignore` already includes .env, .env.local, *.local — verified ✅

### Safety
- [x] No real secrets in any committed file
- [x] `auto_post_enabled = false` seeded in system_settings
- [x] `auto_ads_enabled = false` seeded in system_settings
- [x] `require_approval = true` seeded in system_settings
- [x] RLS enabled on key tables (policies in Phase 3)
- [x] Generated ≠ Approved ≠ Published — enforced via content_status enum + approval workflow tables
- [x] App build pass (tsc + vite): 0 errors

---

## 🗄️ Database: Supabase Postgres (recommended)
- 7 table groups, 30+ tables
- Status enum enforces Generated → Approved → Published gate
- Core DB = single source of truth. n8n/modules do NOT store data.

---

## 🛡️ Safety Guard (Phase 2)
- Auto-post: NO (seeded system_settings.auto_post_enabled = false)
- Real Ads: NO (seeded system_settings.auto_ads_enabled = false)
- Real Messaging: NO
- Real Connectors: NO
- Secrets Added: NO (only .env.example with placeholders)
- Backend Added: NO (schema only, no live connection in Phase 2)
- Auth Added: NO (Phase 3)

---

## 📝 Closeout Note
Phase 2 delivered a complete Supabase Postgres schema covering all 7 domain groups. SQL migration file ready to run. TypeScript types ready for Phase 3 integration. `.env.example` prepared for Phase 3 backend wiring. RLS enabled on key tables — policies added in Phase 3.

---

## ✅ Phase 1 (tiền nhiệm) — CLOSED
- Commit: `317c6c8` — docs: add the core agency real mvp strategy and branding
- Features: Brand renamed to The Core Agency, strategy docs created, 18-phase plan locked.

## ✅ Phase H.7 (tiền nhiệm) — CLOSED
- Commits: `9dc235a`, `2037f61`
- Features: Owner View + Client View two-mode workspace experience.
