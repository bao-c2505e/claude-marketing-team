# CURRENT PHASE — Phase 4: Client/Brand/Campaign Management Foundation ✅ DONE

Tài liệu này dùng để theo dõi tiến độ thực hiện và trạng thái của Phase hiện tại.

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 4 — Client/Brand/Campaign Management Foundation
- **Mục tiêu:** Tạo nền tảng quản lý Client / Brand / Campaign trong Core Product.
- **Trạng thái:** ✅ DONE — Core data layer, 3 tab components, permission integration, build pass, pushed.

---

## 📋 Checklist Phase 4

### Core Data Layer
- [x] `src/lib/core/coreData.ts`
  - [x] `ClientFormData`, `BrandFormData`, `CampaignFormData` form types
  - [x] `SEED_CLIENTS` — 3 clients: Vị Cuốn, Cơm Tấm Bản Khói, Forme
  - [x] `SEED_BRANDS` — 3 brands (1 per client)
  - [x] `SEED_CAMPAIGNS` — 3 campaigns (1 per brand, 3 different statuses)
  - [x] `loadCoreData()` / `saveCoreData()` — localStorage-backed store
  - [x] `generateId()` — prefixed local IDs
  - [x] `CLIENT_STATUS_LABEL/COLOR`, `CAMPAIGN_STATUS_LABEL/COLOR` display helpers
  - [x] Storage key: `core_agency_core_data_v1`

### Components
- [x] `src/components/core/ClientsTab.tsx`
  - [x] Client list with status badges (active/paused/archived)
  - [x] Create client form (name, industry, contact_name, contact_email, notes)
  - [x] Client detail: info + brands summary + navigate-to-brands
  - [x] Archive / Reactivate actions (owner/manager only)
  - [x] "Local demo data · Supabase not configured" badge
- [x] `src/components/core/BrandsTab.tsx`
  - [x] Brand cards grid, filterable by client
  - [x] Create brand form (client, name, industry, hero_product, tone, target, channels)
  - [x] Brand detail: full info + campaigns summary + navigate-to-campaigns
  - [x] `initialFilterClientId` prop for cross-tab navigation
- [x] `src/components/core/CampaignsTab.tsx`
  - [x] Campaign table, filterable by client + brand
  - [x] Create campaign form (client, brand, name, description, dates, budget, status)
  - [x] Campaign detail view with status update
  - [x] Inline status dropdown for owner/manager (edit permission)
  - [x] `initialFilterClientId`, `initialFilterBrandId` props

### App Shell
- [x] `src/App.tsx`
  - [x] Imports: `ClientsTab`, `BrandsTab`, `CampaignsTab`, `loadCoreData`, `saveCoreData`, `CoreDataStore`, `isSupabaseConfigured`, `Zap`
  - [x] State: `coreData`, `coreNavFilter`
  - [x] `handleCoreUpdate(updated)` — saves to localStorage
  - [x] `handleCoreNavigate(tab, filter)` — cross-tab navigation
  - [x] Sidebar: "Core" section header + Clients / Brands / Campaigns buttons
  - [x] Sidebar: "Workspace" section header before existing tabs
  - [x] Rendering: `{activeTab === 'clients'}`, `{activeTab === 'brands'}`, `{activeTab === 'campaigns'}`
  - [x] Phase badge: "Real Operations MVP — Phase 4"

### Permission Integration
- [x] `can.manageClients(role)` — show/hide create/archive in ClientsTab
- [x] `can.manageBrands(role)` — show/hide create in BrandsTab
- [x] `can.createCampaigns(role)` — show/hide create in CampaignsTab
- [x] `can.editCampaigns(role)` — show/hide status dropdown in CampaignsTab
- [x] Read-only hint shown to lower roles

### Docs
- [x] `CLAUDE_MARKETING_TEAM/03_core/client_brand_campaign_README.md`

### Safety
- [x] No secrets in source
- [x] No auto-post / auto-ads / auto-message
- [x] All data local/demo — no real client data committed
- [x] Service role key never used
- [x] "Local demo data" badge visible when Supabase not configured
- [x] Build pass: tsc + vite (0 errors, 606KB bundle — Supabase + new components)

---

## 🗂️ Data Model Quick Reference

```
Client (id, name, slug, contact_name, contact_email, status, notes)
  └── Brand (id, client_id, name, industry, hero_product, tone_of_voice, target_audience, channels)
        └── Campaign (id, brand_id, client_id, name, description, start_date, end_date, status, budget)
```

**Storage:** localStorage key `core_agency_core_data_v1`  
**Supabase:** wired in Phase 5+ via `coreRepository.ts`

---

## 🛡️ Safety Guard (Phase 4)
- Auto-post: NO
- Real Ads: NO
- Real Messaging: NO
- Real Connectors: NO
- Secrets Added: NO
- Service Role Key in Frontend: NO
- Build Pass: YES (0 errors)

---

## 📝 Closeout Note
Phase 4 lays the management layer for Client → Brand → Campaign. All data is local/demo via localStorage. Permission matrix fully applied — owners/managers can create/edit, viewers/clients are read-only. Cross-tab navigation works (Clients → Brands → Campaigns by filter). Phase 5 will wire Supabase CRUD and add Brief Intake form.

---

## ✅ Phase 3 (tiền nhiệm) — CLOSED
- Commit: `d8b972a` — feat: add auth and role permission foundation
- Features: Supabase Auth, AuthContext, permissions matrix, LoginScreen, auth gate.

## ✅ Phase 2 (tiền nhiệm) — CLOSED
- Commit: `d0cb365` — feat: add database schema v1 for the core agency

## ✅ Phase 1 (tiền nhiệm) — CLOSED
- Commit: `317c6c8` — docs: add the core agency real mvp strategy and branding
