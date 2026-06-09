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

## ✅ Phase 15 Codex Fix — Harden RLS + CRUD Plan (DONE — 2026-06-09)

### Vấn đề Codex phát hiện:
1. README khẳng định "RLS enabled on all tables" — sai (schema_v1.sql chỉ bật 11/27 bảng)
2. `user_roles` có RLS nhưng chưa có bootstrap policy → `fetchUserRole()` luôn trả về 'viewer'
3. Policy mẫu chỉ check role, chưa check tenant/ownership scope → nguy cơ lộ dữ liệu đa tenant
4. `coreRepository.ts` thiếu `ReportRepository` + `ReportMetricRepository`
5. Phase 16 checklist thiếu 7 domains: reports, report_metrics, export_packs, connector_registry, module_registry, module_events, automation_logs
6. Flow diagram dùng `AuthProvider.useEffect()` không rõ file path

### Đã fix:
1. **`CLAUDE_MARKETING_TEAM/03_core/database/README.md`**: Fix "RLS enabled on all tables" → danh sách chính xác 11 bảng enabled / 15 bảng chưa. Thêm bootstrap warning. Link tới rls_policy_plan.md.
2. **`CLAUDE_MARKETING_TEAM/03_core/database/rls_policy_plan.md`** (NEW): Full 13-section RLS plan — current status, Step 0 enable RLS on 15 missing tables, `current_user_has_role()` helper function, bootstrap policies, Group A–G policies với tenant-scoped patterns, apply order, safety checklist trước khi enable production env.
3. **`CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`**: Fix section 1.4 (accurate RLS table list, bootstrap problem callout, tenant-scoped policy patterns), fix section 4 (AuthProvider reference → `src/lib/auth/AuthContext.tsx`), expand section 7 Phase 16 checklist to cover all 10 domains + RLS step first, harden section 9 safety invariants (prod env warning, client tenant isolation rule).
4. **`src/lib/core/coreRepository.ts`**: Added `ReportRepository`, `ReportMetricRepository` interfaces + `Report`/`ReportMetric` type imports. Updated `CoreRepositories` bundle (18 repos now).

### Safety:
- Không thay đổi code runtime. Không sửa auth logic. Demo Sign In + localStorage fallbacks preserved. Build PASS.

---

## ✅ Phase 15 — Supabase Auth + Database Wiring Plan (DONE — 2026-06-09)

### Mục tiêu:
Kiểm tra schema/database readiness, chuẩn hóa Supabase client/env, tạo wiring plan + repository interface + SQL apply guide. Không migrate full CRUD ở Phase 15.

### Audit kết quả:
- **Auth:** AuthContext.tsx + supabaseClient.ts + LoginScreen.tsx đã sẵn sàng cho Supabase thật. Không cần sửa code.
- **Schema:** schema_v1.sql đầy đủ 7 groups, match TypeScript types. Sẵn sàng apply.
- **.env.example:** Đã đúng (VITE_ prefix, SERVICE_ROLE_KEY warning). Không cần sửa.
- **UI Indicator:** Login screen banner + demo credentials prefill khi unconfigured. Không cần sửa.

### Đã build:
1. **`CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`** (NEW): Full audit — auth status, schema status, localStorage→Supabase mapping (7 stores), RLS requirements (2 patterns), missing/deferred items, environment variables guide, auth flow diagram, repository interface plan, SQL apply guide (7 steps), Phase 16 CRUD checklist, safety invariants.
2. **`src/lib/core/coreRepository.ts`** (NEW): TypeScript interfaces for 16 repositories (Client, Brand, Campaign, Brief, GenerationJob, ContentItem, ApprovalRequest, ApprovalEvent, ApprovalComment, Asset, AssetCollection, ExportPack, Connector, Module, ModuleEvent, AutomationLog) + CoreRepositories bundle. Phase 16 wiring strategy in comments.
3. **`CLAUDE_MARKETING_TEAM/03_core/database/README.md`** (UPDATED): Full 7-step SQL apply guide (create project → apply SQL → configure auth → assign owner role SQL snippet → set env vars local+Vercel → redeploy → verify). Service role key warning. Related docs links.

### localStorage → Supabase Priority:
- Phase 16 (Core + Content): `core_agency_core_data_v1` + `core_agency_gen_data_v1` + approval + assets
- Phase 17+ (Automation): connectors, logs, export packs

### Safety:
- No secrets committed. No real API called. Demo Sign In + localStorage fallbacks preserved. Build PASS.

---

## 🔜 Phase 16 — NEXT: Supabase CRUD Wiring Core Objects

**Mục tiêu:** Kết nối Supabase Auth thật + wire các data stores (clients, brands, campaigns, briefs, generation jobs, content items, approval requests, assets, logs) vào Supabase Postgres thay vì localStorage. RLS policies áp dụng. Auth context dùng Supabase session thật.

**Prerequisite:** `.env.local` phải có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` thật (owner cấp).

**Scope (Phase 15):**
- Supabase client configured với env vars thật
- Auth: sign in / sign out / session persistence qua Supabase Auth
- RLS: enable RLS + policies trên tables core (clients, brands, campaigns, briefs)
- Data layer: `loadCoreData()` → Supabase select; `saveCoreData()` → Supabase upsert
- Fallback: nếu Supabase chưa được cấu hình → tiếp tục dùng localStorage (isSupabaseConfigured guard đã có)

**Safety:** Không hardcode key. Không commit .env.local. Không auto-post/ads/message. Generated ≠ Approved ≠ Published vẫn giữ nguyên.

---

## ✅ Phase 14 — Automation Logs Foundation (DONE — 2026-06-09)

### Mục tiêu:
Tạo Automation Logs tab để Core ghi nhận, xem, lọc và quản lý log automation nội bộ/local. Phase này chỉ local/mock — không kết nối API thật, không gọi webhook thật, không retry thật.

### Đã build:
1. **`src/types/core.ts`**: Added `AutomationLogType` (10), `AutomationLogSource` (7), `AutomationLogSeverity` (4), `AutomationLogStatus` (5), `LocalAutomationLog` interface.
2. **`src/lib/core/automationLogs.ts`** (NEW): Display maps (TYPE/SOURCE/SEVERITY/STATUS label+color), seed 9 mock logs, `AutomationLogStore`, `loadAutomationLogData()` / `saveAutomationLogData()` (max 200 logs, key: `core_agency_automation_logs_v1`), `createAutomationLog()`, `updateLogStatus()`, `AutomationLogStats`, `computeLogStats()`.
3. **`src/components/core/AutomationLogsTab.tsx`** (NEW): Permission gate (`canViewAutomationLogs`), header + Phase 14 badge + Create Mock Log form (5 templates, owner/manager only), safety disclaimer bar, stats row (5 cards), filter bar (search + type/source/severity/status), log list (expand/collapse per row), expanded detail (message + payload JSON + related refs + timestamps + action buttons), footer notice.
4. **`src/App.tsx`**: `Activity` icon import, `AutomationLogsTab` + log lib imports, `logData` state + `handleLogUpdate` handler, sidebar "Automation Logs" button (owner/manager only, with error count badge), tab routing `automation-logs`, phase badge → Phase 14.
5. **`CLAUDE_MARKETING_TEAM/03_core/automation_logs_README.md`**: Created.

### Permission Integration:
- `canViewAutomationLogs` = owner/manager (already in permissions.ts from Phase 13 planning)
- `canManageConnectors` (owner) OR owner/manager role can manage log status + create mock logs
- client/viewer: tab hidden entirely, component-level permission gate as second guard

### Stats tracked:
- Total logs, Warnings, Errors, Unresolved (recorded + failed), Success

### Actions:
- Mark Reviewed (sets `reviewed_at`)
- Mark Resolved (sets `resolved_at`)
- Ignore
- Create Mock Log (5 templates — no real action taken)

### Safety:
- No real workflow execution. No real webhook sent/retried. No external API calls.
- No auto-post, no real ads, no customer messaging.
- Safety disclaimer always visible. Logs hidden from client/viewer.
- Build pass (tsc + vite, 0 errors, ~879KB bundle).

---

## ✅ Phase 13 — Connector Registry + Module Event Inbox (DONE — 2026-06-08)

Completed in previous session. Commit: f21dbf7.

---

## ✅ Phase 12 — Export Pack Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Export Pack: gom dữ liệu campaign thành bộ xuất nội dung phục vụ team/client. Local text/markdown only — không PDF/DOCX thật, không upload, không gửi email.

### Đã build:
1. **`src/types/core.ts`**: Added `ExportPackType` (6 values), `ExportPackFormat`, `ExportPackStatus`, `LocalExportPack`.
2. **`src/lib/core/coreData.ts`**: Added `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()`. Storage key: `core_agency_export_pack_data_v1`.
3. **`src/lib/core/exportPackGenerator.ts`** (NEW): `generateExportPack()`, 6 section builders, `formatContent()`, `CLIENT_SAFE_EXPORT_TYPES`.
4. **`src/components/core/ExportPackTab.tsx`** (NEW): Safety banner, configure panel (scope/type/format/generate), preview panel (textarea + copy + regenerate), history panel (50 packs), permission gate.
5. **`src/App.tsx`**: `Package` icon, `ExportPackTab` import, sidebar "Export Pack" button, tab routing `export-pack`, phase badge → Phase 12.
6. **`CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`**: Created.

### Export Types:
| Type | Client-safe |
|---|---|
| `campaign_summary` | ✅ |
| `content_calendar` | ❌ internal |
| `approved_content` | ✅ |
| `client_report` | ✅ |
| `asset_checklist` | ❌ internal |
| `full_campaign_pack` | ❌ internal |

### Permission Integration:
- `canViewExportPacks` = owner/manager/client
- `canExportPacks` (generate) = owner/manager
- Client/viewer: restricted to 3 client-safe types, view-only

### Safety:
- No AI API, no upload, no email, no auto-post, no publish.
- Safety banner always visible.
- Internal fields (angle, owner_note, publish_note, asset.notes) stripped from client-safe exports.

---

## ✅ Phase 9 — Client View Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo Client Portal: client-facing view của campaign content. Client xem được nội dung approved/pending/revision, add feedback/comment, không lộ workspace nội bộ, không thể publish.

### Đã build:
1. **`src/components/core/ClientViewTab.tsx`** (NEW): Safety banner, "Internal Preview" badge (owner/manager), campaign selector (Phase 4 campaigns), campaign overview card (brand, brief title, goal, dates, channels, status), content summary stats (Approved/Pending Review/Revision Requested), content item list với expand/collapse. Client-facing fields: hook, caption, visual_brief, cta, hashtags. Hidden: owner_note, angle, pillar, job internals. Feedback form (stores via `addApprovalComment`, isInternal=false). Public comment display. Empty states.
2. **`src/App.tsx`**: UserCheck icon import, ClientViewTab import, "Client" sidebar section label, "Client Portal" button (emerald highlight), tab routing `client-view`.
3. **`CLAUDE_MARKETING_TEAM/03_core/client_view_README.md`**: Created.

### Client-Visible Status Mapping:
- `approved` → "Approved" (emerald)
- `needs_review` / `generated` → "Pending Review" (amber)
- `revision_requested` → "Revision Requested" (orange)
- Hidden: `rejected`, `archived`, `failed`, `draft`

### Client Actions:
- View content (all roles with `canViewContent`)
- Add feedback comment (all roles, only if approval request exists for item)
- No publish, no approve/reject, no internal data edit

### Safety:
- Approved ≠ Published. No publish action in Phase 9.
- Safety banner always visible in Client Portal.
- Internal workspace not exposed to client view.

---

## ✅ Phase 8 — Approval Workflow Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng approval workflow: Generated/Needs Review → Submit for Approval → Approve/Reject/Request Revision. Approval record là nguồn quyết định trạng thái. Không publish ở Phase 8.

### Đã build:
1. **`src/types/core.ts`**: Added `ContentApprovalStatus`, `ApprovalPriority`, `ApprovalActionType`, `ContentApprovalRequest`, `ContentApprovalEvent`, `ContentApprovalComment`.
2. **`src/lib/core/coreData.ts`**: Added `ApprovalDataStore`, `loadApprovalData()`, `saveApprovalData()`, display helpers (LABEL/COLOR maps), `SUBMITTABLE_ITEM_STATUSES`, `getActiveRequestForItem()`, `canSubmitItem()`, `submitForApproval()`, `executeApprovalAction()`, `addApprovalComment()`. Storage key: `core_agency_approval_data_v1`.
3. **`src/components/core/ApprovalsTab.tsx`** (NEW): Submit panel (eligible items), cascading filter bar, request list cards, detail view (content preview, metadata, Approve/Reject/Revision/Cancel action buttons with confirm step, comment form, history timeline). Safety banner.
4. **`src/components/core/ContentGenerationTab.tsx`**: Added `onNavigateToApprovals` + `submittableItemIds` props. "→ Submit for Approval" button on expanded eligible items.
5. **`src/components/core/ContentCalendarTab.tsx`**: Added `approvalRequests` + `onNavigateToApprovals` props. Approval status badge on item cards (links to Approvals tab).
6. **`src/App.tsx`**: `ClipboardCheck` icon, `ApprovalsTab` import; `approvalData` state; `handleApprovalUpdate(approval, gen)` atomic updater; `actorLabel`; `submittableItemIds` set; sidebar "Approvals" button with pending count badge; `approvals` tab routing.
7. **`CLAUDE_MARKETING_TEAM/03_core/approval_workflow_README.md`**: Created.

### Status Transitions:
- Submit → `approval_request.status = submitted`, `content_item.status = needs_review`
- Approve → `approval_request.status = approved`, `content_item.status = approved`
- Reject → `approval_request.status = rejected`, `content_item.status = rejected`
- Revision → `approval_request.status = revision_requested`, `content_item.status = revision_requested`
- Cancel → `approval_request.status = cancelled`, `content_item.status = needs_review`

### Safety:
- Approved ≠ Published. No publish action in Phase 8. Safety banner always visible.
- Publishing blocked until Phase 9+.

---

## ✅ Phase 7 — Content Calendar Foundation (DONE — 2026-06-08)

### Mục tiêu:
Tạo nền tảng Content Calendar để xem, lọc, chỉnh lịch và quản lý các content items đã được generate từ Phase 6.

### Đã build:
1. **`src/types/core.ts`**: Extended `ContentPlanItem` — 4 optional calendar fields: `scheduled_time`, `publish_note`, `owner_note`, `last_moved_at`. Backward-compatible (all optional).
2. **`src/lib/core/coreData.ts`**: Added `CalendarSafeStatus`, `CALENDAR_SAFE_STATUSES`, `CalendarItemPatch`, `updateContentItemInStore()`. Safe statuses: generated, needs_review, revision_requested, rejected, archived. approved/scheduled/published blocked.
3. **`src/components/core/ContentCalendarTab.tsx`** (NEW): Safety banner, cascading filter bar (client→brand→campaign→channel→status), day-grouped list sorted by planned_date, item cards (day badge, date, channel, hook preview, caption preview, status chip), detail view (full caption/visual brief/hashtags/CTA/angle/pillar/approval note), edit panel (safe fields: date/time/channel/owner_note/publish_note/status), permission gate, 2 empty states, summary stats bar.
4. **`src/App.tsx`**: CalendarDays icon import, ContentCalendarTab import, sidebar "Content Calendar" button (after Content Generation), content-calendar tab routing.
5. **`CLAUDE_MARKETING_TEAM/03_core/content_calendar_README.md`**: Created.

### Calendar Status Gate (Phase 7):
- Editable: `generated`, `needs_review`, `revision_requested`, `rejected`, `archived`
- Blocked: `approved`, `scheduled`, `published` — requires Phase 8 Approval Workflow

### Safety:
- "Calendar is planning only. Scheduled ≠ Published. Generated ≠ Approved. Approved ≠ Published. No auto-post."
- No publish action in Phase 7. Safety banner always visible.

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
