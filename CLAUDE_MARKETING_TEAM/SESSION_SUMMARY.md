# SESSION SUMMARY — Tóm Tắt Phiên Làm Việc

Tài liệu này tóm tắt bối cảnh, ranh giới an toàn hiện tại của dự án và các bước tiếp theo cần triển khai.

## 📝 Bối cảnh dự án (Project Context)
Chúng ta đang xây dựng **The Core Agency — Real Operations MVP**. Đây là hệ thống quản lý marketing agency thực sự với đầy đủ backend, database, auth, approval workflow, và automation integration. Public brand: **The Core Agency**. Repo kỹ thuật: claude-marketing-team (giữ nguyên).

**Kiến trúc chốt:**
- Core (this repo) = quản lý + phê duyệt + source of truth DB
- n8n = automation backbone (không phải database)
- Modules = xử lý chuyên môn
- Webhook = modules → Core callback
- UI = chỉ đọc từ Core DB

## 🔒 Ranh giới an toàn cốt lõi (Safety Boundaries)
- **Không auto-post**
- **Không auto-ads spending**
- **Không auto-message khách thật**
- **Không hardcode secrets** — chỉ dùng .env.example
- **Generated ≠ Approved ≠ Published** — approval gate bắt buộc
- **Không làm vỡ production** (Vercel deploy vẫn đang live)

---

## ✅ Phase 5 — Brief Intake Foundation (DONE + BUILT + PUSHED — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Brief Intake — input layer trước khi AI content generation (Phase 6+).

### Đã build:
1. **`src/types/core.ts`**: Added `BriefStatus` union; extended `CampaignBrief` with 15 new fields.
2. **`src/lib/core/coreData.ts`**: Added `BriefFormData`, `SEED_BRIEFS` (3), extended `CoreDataStore`, migration in `loadCoreData()`, display helpers.
3. **`src/components/core/BriefIntakeTab.tsx`** (NEW): List view (filters, cards, quick-actions), Detail view (all fields, status transitions, disabled Generate placeholder), Create/Edit form (5 sections, auto-populate brand, validation), Safety notice.
4. **ClientsTab / BrandsTab / CampaignsTab**: Added `briefs` prop + pass-through in `onUpdate`.
5. **`src/App.tsx`**: Imported `BriefIntakeTab`, `ClipboardList`; Brief Intake sidebar button; tab rendering; phase badge → Phase 5.
6. **`CLAUDE_MARKETING_TEAM/03_core/brief_intake_README.md`**: Created.

### Brief Status Machine:
`draft → ready_for_generation → approved_for_generation | needs_revision → archived`

### Safety:
- "Generate" button disabled (label: "Generate — Phase 6")
- Brief = Input only. Generated ≠ Approved ≠ Published. No auto-post.
- Build PASS: tsc + vite, 0 errors, ~634KB bundle.

---

## ✅ Phase 4 — Client/Brand/Campaign Management Foundation (DONE + BUILT + PUSHED — 2026-06-07)

### Đã build:
Core data layer (coreData.ts), ClientsTab, BrandsTab, CampaignsTab, App.tsx updates, permission integration, localStorage store.

---

## ✅ Phase H.7 — Owner View + Client View (DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK — 2026-06-05)

### Mục tiêu:
Thêm two-mode workspace experience: Owner View (manage/review/approve) và Client View (present/feedback/export).

### Đã build:
1. **`viewMode` state** (`'owner' | 'client'`), default `'owner'`.
2. **`handleViewModeSwitch()`**: switches view + auto-redirects to Dashboard if current tab is owner-only.
3. **Header mode toggle**: segmented control (🔧 Owner View | 👁 Client View), indigo/emerald highlight.
4. **Phase badge**: H.6 → H.7 — Owner & Client Views.
5. **Client View — 4 tabs hidden**: New Campaign Brief, AI Team Board, Manual Export Pack, Client Workspace View.
6. **Client View — simplified sidebar safety**: Trust & Safety (Sample Data, Approval Required, No Live Publishing, No Real Ads) instead of full internal Guard.
7. **Dashboard view context card**: Owner card (indigo, manage/approve) + Client card (emerald, present/export), each with a quick-switch button.
8. **Codex fix (`2037f61`)**: Brand Workspace connector boundary card conditional — Owner View keeps technical notes; Client View shows "Workspace Scope" trust card. Presentation & Export step 06 body conditional — Owner keeps internal details; Client View uses Sample Data / Approval Required / No Live Publishing language.

### View Mode Table:
| | Owner View | Client View |
|--|--|--|
| Tabs | All 9 | 6 (client-appropriate) |
| Safety sidebar | Full 7-item guard | 4-item trust summary |
| New Campaign Brief | ✅ | ❌ |
| AI Team Board | ✅ | ❌ |
| Manual Export Pack | ✅ | ❌ |
| Client Workspace View | ✅ | ❌ |

---

## ✅ Phase H.6 — Client-ready Workspace Polish (DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK — 2026-06-05)

### Mục tiêu:
Polish workspace để client-ready: chuẩn hoá ngôn ngữ, loại bỏ demo/prototype framing, dynamic approval hint, owner/client guide card.

### Đã build:
1. **Header badge** → "Phase H.6 — Client-ready Workspace Polish"
2. **Nav renames**: "Client Demo Pack" → "Client Presentation Pack", "Client Demo Mode" → "Client Workspace View"
3. **Tab titles updated**: Demo Pack tab h2, Client Demo Mode h2 + badge → "Client-Ready"
4. **Manual Export Pack title**: Removed "Phase H.1 —" prefix; badge "Production Demo Ready" → "Production Ready"
5. **Approval hint**: Replaced hardcoded "Vị Cuốn / Bánh tráng cuốn heo quay" with dynamic `activeCampaign.brief.heroProduct` and `activeCampaign.brief.brandName`
6. **"How to Use This Workspace" card** (emerald, Dashboard): 6-step owner/client guide — Choose Brand → Review Plan → Review Outputs → Approve → Export Pack → Phase I boundary note
7. **Presenter guide renamed** to "Presenter Walkthrough Guide"; step 4 updated to "Client Workspace View"
8. **Pitch text** in demo-pack: dynamic brand name and hero product
9. **Brand gallery label**: "Current (H.5)" → "Current (H.6)"
10. **Service packages**: "Client Demo Mode" item → "Client Workspace View"
11. **Codex fixes (round 1)**: `Demo/Mock Data Only`, `Mock Pricing — Demo Only`, `Demo/mock only`, `Approval Status Demo`, `demo/mock data only` in Safety Boundaries step
12. **Codex fixes (round 2)**: 15 additional visible demo/mock strings replaced — `Mock Data` badge, `Mock Ad Units`, `Offline Mock-up`, `Mock workspace only`, `White-label demo`, `Mock Pricing`, `Mock Estimate`, `mock est.`, `mock estimate`, `mock ads`, `Mock data` badge, and more → workspace/sample/sandbox framing throughout

---

## ✅ Phase H.5 — Multi-brand Workspace Readiness (DONE + CODEX PASS + FIX APPLIED + BUILT + PUSHED — 2026-06-05)

### Đã build:
1. **mockData.ts**: Thêm 2 brand mới — Cơm Tấm Bản Khói (F&B/HCM) và Forme (premium furniture/HCM+HN).
2. **localStorage v3**: Key bump từ v2→v3 để force fresh seed data load.
3. **Header badge** → "Phase H.5 — Multi-brand Workspace Readiness"
4. **Sidebar**: Thêm "Brand Workspace" tab (icon: Store). "Active Campaign" → "Active Brand".
5. **Dashboard Brand Switcher**: Brand cards ở đầu Dashboard — click để switch brand workspace.
6. **Brand Workspace Gallery tab**: Full brand cards với details, Phase I connector boundary note.
7. **Client Demo Mode**: Campaign Overview và AI Team Workspace descriptions dùng dynamic `activeCampaign.brief.*`.
8. **Framing**: "Sample Data", "Sandbox Safe Mode", "Workspace", không dùng "demo" là main framing.

### 3 Seed Brands:
| Brand | Industry | Hero Product |
|-------|----------|--------------|
| Vị Cuốn | F&B / street food premium / TP Vinh | Bánh tráng cuốn heo quay |
| Cơm Tấm Bản Khói | F&B / cơm tấm / TP.HCM | Cơm tấm sườn bì chả |
| Forme | Nội thất cao cấp / premium furniture | Sofa da Series F-1 |

---

## ✅ Phase H.4 — Export/Presentation Readiness (CLOSED — 2026-06-05)
- Presentation View (6-step), Export Pack Preview (7 cards), Client Approval Sheet, Sales Demo Script, Export Readiness Checklist

## ✅ Các Phase trước (CLOSED)
- **Phase H.3**: Presenter Demo Guide, Sales Readiness, Value Proposition, Before/After, CTA Block, Service Packages
- **Phase H.2**: Client Demo Mode (Client View, Approval Status, AI Team Workspace)
- **Phase H.1 / H-lite**: Manual Export Pack (6 copy blocks)
- **Phase A–G**: Core workspace infrastructure, React UI, mock data, AI agents simulation

## ➡️ Bước tiếp theo

### ✅ Phase 1 — DONE (2026-06-07, commit 317c6c8)
Scope lock. Strategy docs. Branding: CLAUDE MARKETING TEAM → THE CORE AGENCY.

### ✅ Phase 2 — DONE (2026-06-07, commit d0cb365)
Database Schema V1: 30+ tables, Supabase Postgres, TypeScript types, .env.example.

### ✅ Phase 3 — DONE (2026-06-07)
Auth/Login + Role Permission Foundation:
- `@supabase/supabase-js` installed
- `src/lib/supabaseClient.ts` — null-safe client (demo mode if env missing)
- `src/lib/auth/AuthContext.tsx` — React context, 3 modes (supabase/demo/unconfigured)
- `src/lib/auth/permissions.ts` — 30+ permission keys, 4 roles, `can.*` helpers
- `src/components/auth/LoginScreen.tsx` — login UI with demo fallback
- `src/main.tsx` — wrapped with `<AuthProvider>`
- `src/App.tsx` — auth gate (loading → spinner, !authenticated → LoginScreen, authenticated → workspace)
- Header: user email + role badge + sign-out button
- `src/vite-env.d.ts` — Vite env types

### ✅ Phase 4 — DONE (2026-06-07)
Client/Brand/Campaign Management Foundation:
- `src/lib/core/coreData.ts` — seed data (3 clients/brands/campaigns), localStorage store, display helpers
- `src/components/core/ClientsTab.tsx` — list, create, detail, archive, cross-tab nav
- `src/components/core/BrandsTab.tsx` — card grid, filter, create, detail, cross-tab nav
- `src/components/core/CampaignsTab.tsx` — table, filter, create, status update, detail
- `src/App.tsx` — coreData state, Core sidebar section, tab rendering, Phase 4 badge
- Permission integration: canManageClients / canManageBrands / canCreateCampaigns / canEditCampaigns
- Local demo data mode with "Supabase not configured" badge

### Phase 5 — Brief Intake Foundation (Next)
- Wire `campaign_briefs` table to campaigns
- Brief intake form (brand summary, hero product, tone, target, goals, channels, duration)
- Brief submitted → campaign status changes to "active"
- Supabase CRUD wiring for clients/brands/campaigns (coreRepository.ts)
- RLS policies applied

---

## ✅ Phase H.7 (tiền nhiệm) — CLOSED
- Status: DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED
- H.7 added Owner View and Client View inside the same AI Marketing Team Workspace.

## ✅ Phase H.6 (tiền nhiệm) — CLOSED
- H.6 polished the app into a more client-ready workspace. Demo/mock framing corrected throughout.

## ✅ Phase H.5 (tiền nhiệm) — CLOSED
- 3 seed brands, Brand Workspace Gallery, Brand Switcher, localStorage v3.
