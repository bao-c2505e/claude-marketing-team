# SYSTEM LOG — Nhật Ký Tiến Độ Dự Án CLAUDE_MARKETING_TEAM

Nhật ký theo dõi các mốc hoàn thành kỹ thuật qua các Phase.

---

## 📅 Nhật Ký Sự Kiện (Event Logs)

### 🗓️ Ngày 09/06/2026 — Phase 16A CLOSED: Codex PASS
- **Sự kiện:** Phase 16A chính thức đóng sau Codex PASS.
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Clients và Brands. Repository pattern: interface → factory → Supabase/localStorage impls. Wired vào App.tsx.
- **Tenant-scope contract cuối:** `BrandRepository.list(clientId: string)` — bắt buộc. Tất cả brand ops (`get`, `update`, `archive`) require `clientId`. Supabase luôn apply `.eq('client_id', clientId)`. TypeScript enforce tại compile time.
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved.
- **Không wired:** Campaign / Brief / Generation / Calendar / Approval / Reports — deferred to Phase 16B+.
- **Codex result:** PASS.
- **Commits:** `54c8281` → `bccd1d1` → `53e8450` → `df7e6aa`
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 3: Mandatory clientId on BrandRepository.list
- **Sự kiện:** `BrandRepository.list(clientId?: string)` vẫn cho phép gọi không có `clientId` — TypeScript không bắt lỗi.
- **Fix:** Đổi `clientId?: string` → `clientId: string` trong interface và cả 2 implementations.
- **Supabase:** Bỏ điều kiện `if (clientId)` — luôn apply `.eq('client_id', clientId)`. Không có code path nào đọc all brands nữa.
- **LocalStorage:** Bỏ ternary `clientId ? filter : brands` — luôn filter theo `clientId`.
- **Call site:** App.tsx:275 đã gọi `repos.brands.list(c.id)` — không cần sửa.
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — `BrandRepository.list` giờ bắt buộc `clientId`. TypeScript enforce tại compile time.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 2: Scope brand operations by client_id
- **Sự kiện:** Codex phát hiện brand operations chưa được scoped theo `client_id` — đã fix toàn bộ.
- **Fix 1 (Unscoped list):** `App.tsx` gọi `repos.brands.list()` không có `clientId`. Fix: load clients trước, rồi `Promise.all(clients.map(c => repos.brands.list(c.id)))`.
- **Fix 2 (Unscoped get):** `SupabaseBrandRepository.get(id)` chỉ filter theo `id`. Fix: thêm `clientId` bắt buộc + `.eq('client_id', clientId)`.
- **Fix 3 (Unscoped update):** `SupabaseBrandRepository.update(id, patch)` chỉ filter theo `id`. Fix: thêm `clientId` + `.eq('client_id', clientId)` + lỗi PGRST116 typed.
- **Fix 4 (Unscoped archive):** `SupabaseBrandRepository.archive(id)` chỉ filter theo `id`. Fix: thêm `clientId` + `.eq('client_id', clientId)` + throw nếu không có row nào bị affected.
- **Fix 5 (Interface):** `BrandRepository` interface không enforce `clientId`. Fix: `get/update/archive` giờ require `clientId: string` — TypeScript bắt lỗi tại compile time.
- **Fix 6 (LocalStorage):** `LocalStorageBrandRepository.get/update/archive` chỉ filter theo `id`. Fix: filter/verify theo cả `id` và `client_id`, throw nếu không tìm thấy.
- **Files sửa:** `coreRepository.ts`, `supabaseRepositories.ts`, `localStorageRepositories.ts`, `App.tsx`
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — Brand operations fully scoped by client_id. Cross-client access prevented at repo layer.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 1: Route mutations through repos, surface errors
- **Sự kiện:** Codex phát hiện 3 vấn đề nghiêm trọng trong Phase 16A — đã fix toàn bộ.
- **Fix 1 (UUID bypass):** Xóa `syncClientsBrandsToSupabase` — function này insert local ID `client-*/brand-*` vào UUID column trong Supabase DB. Không dùng nữa.
- **Fix 2 (Silent errors):** Xóa `.catch(() => {})` — lỗi Supabase write không còn bị nuốt. Lỗi create → hiện trong `formError` của tab. Lỗi archive/activate → hiện trong `actionError` của tab.
- **Fix 3 (Repo bypass):** ClientsTab và BrandsTab không còn tự tạo ID local (`generateId`). Mutations đi qua `repos.clients`/`repos.brands` trong App.tsx. Row trả về từ DB (UUID thật) cập nhật React state.
- **Files sửa:** `ClientsTab.tsx` (async props, formLoading, actionError), `BrandsTab.tsx` (async props, formLoading), `App.tsx` (3 typed handlers, remove sync bypass)
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check exit 0.
- **Trạng thái:** ✅ DONE — UUID bug fixed, errors surfaced, repo contract enforced.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A: Supabase CRUD Wiring — Clients + Brands
- **Sự kiện:** Implement repository pattern cho Clients và Brands. Wiring vào App.tsx với async Supabase load và diff-based write.
- **Files mới:**
  - `src/lib/core/localStorageRepositories.ts` — `LocalStorageClientRepository`, `LocalStorageBrandRepository`
  - `src/lib/core/supabaseRepositories.ts` — `SupabaseClientRepository`, `SupabaseBrandRepository`
  - `src/lib/core/repositoryFactory.ts` — factory `createPhase16aRepositories`
- **Files sửa:** `src/App.tsx` — `useMemo` repos, `useEffect` Supabase initial load, `supabaseLoadError` banner, `handleCoreUpdate` diff sync
- **Vẫn localStorage:** Campaigns, Briefs, Generation, Approval, Assets, Export Packs, Connector Registry, Automation Logs
- **An toàn:** Không secrets, không service role key, production Supabase env vẫn OFF, Demo Sign In preserved
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — Clients + Brands repository wiring complete. Phase 16B: Campaigns + Briefs.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 3: Finalize Tenant-Scoped RLS Plan
- **Sự kiện:** Codex review lần 3 — 5 remaining issues addressed in plan. Policies/tests pending real Supabase execution. Codex PASS required before Phase 16.
- **Fix 1 (Content 3-tier):** `content_items_read` nay có 3 tiers: global staff (all), scoped manager (all statuses in tenant), client/viewer (approved only). Scoped manager giờ review được draft.
- **Fix 2 (Approval comments 3-tier):** Split `approval_comments_staff_all` → 3 policies: global staff all, scoped staff read all-in-tenant, client/viewer non-internal-in-tenant. Warning ghi rõ Tier 2 phải dùng `has_scoped_role` không phải `can_access_campaign`.
- **Fix 3 (Test matrix):** Thêm U5 (viewer-a), U6 (viewer-b). 18 tests → 32 tests. Tất cả `✅ PASS` → `☐ EXPECTED`. Thêm disclaimer note.
- **Fix 4 (Helper reference):** supabase_wiring_README.md Phase 16 checklist — xóa stale `current_user_has_role()` → 4 helper tên đầy đủ.
- **Fix 5 (Language):** SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md không dùng "all fixed" — ghi rõ plan updated, policies chưa apply thật.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE — plan finalized. Vẫn là plan-only. Phase 16 apply + test.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 2: Tighten RLS Tenant Isolation
- **Sự kiện:** Codex review lần 2 phát hiện 5 vấn đề tiếp theo — issues addressed in plan. Policies/tests pending real Supabase execution.
- **Vấn đề 1:** `roles` bị bỏ sót — 27 bảng trong schema nhưng audit chỉ có 26. Fix: thêm roles vào danh sách enable RLS (16 bảng thiếu), cập nhật Step 0, cập nhật bootstrap note.
- **Vấn đề 2:** `current_user_has_role()` không phân biệt global vs scoped. Fix: thay bằng 4 helpers tenant-aware với SECURITY DEFINER + SET search_path.
- **Vấn đề 3+4:** `approval_events_staff_read` + `approval_comments_client_public` expose cross-tenant data. Fix: policies giờ scope qua join chain approval_request→campaign→client.
- **Vấn đề 5:** Docs ghi "all fixed" không đúng. Fix: section 9 safety invariants dùng ✅/⏳/⚠️ status.
- **Thêm mới:** Section 14 trong rls_policy_plan.md — 18 cross-tenant tests (T01–T18) với 4 test users.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE — plan tighter. Vẫn là plan-only. Phase 16 sẽ apply + test.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix: Harden RLS + CRUD Plan
- **Sự kiện:** Codex review Phase 15 phát hiện 6 vấn đề — issues addressed in plan. Policies/tests pending real Supabase execution.
- **Vấn đề 1:** README khẳng định "RLS enabled on all tables" — sai. schema_v1.sql chỉ bật RLS trên 11/27 bảng. Fix: database/README.md cập nhật danh sách chính xác.
- **Vấn đề 2:** `user_roles` có RLS nhưng 0 policies → `fetchUserRole()` trả về 'viewer' cho mọi user. Fix: thêm bootstrap policies vào rls_policy_plan.md + warning trong docs.
- **Vấn đề 3:** Policy mẫu chỉ check role, không check tenant ownership → nguy cơ lộ dữ liệu đa tenant. Fix: supabase_wiring_README.md section 1.4 — thêm pattern tenant-scoped với `resource_id` check.
- **Vấn đề 4:** `coreRepository.ts` thiếu `ReportRepository` + `ReportMetricRepository`. Fix: thêm 2 interfaces + cập nhật CoreRepositories bundle (16→18 repos).
- **Vấn đề 5:** Phase 16 checklist thiếu reports, report_metrics, export_packs, connectors, modules, module_events, automation_logs. Fix: expand checklist đủ 10 domains + thêm Step 0 RLS trước CRUD.
- **Vấn đề 6:** Flow diagram dùng `AuthProvider.useEffect()` — không rõ file path. Fix: thêm `src/lib/auth/AuthContext.tsx` reference.
- **File mới:** `CLAUDE_MARKETING_TEAM/03_core/database/rls_policy_plan.md` — 13 sections: current RLS status, Step 0 enable RLS 15 bảng thiếu, helper function, bootstrap policies, Group A–G policies, apply order, safety checklist.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 09/06/2026 — Phase 15: Supabase Auth + Database Wiring Plan
- **Sự kiện:** Hoàn thành Phase 15 — Supabase Auth + Database Wiring Plan.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. **Audit toàn bộ trạng thái sẵn sàng Supabase:**
     - Auth: `AuthContext.tsx` + `supabaseClient.ts` + `LoginScreen.tsx` đã đầy đủ (supabase/demo/unconfigured modes, role fetch from DB, demo fallback). Không cần sửa.
     - Schema: `schema_v1.sql` đầy đủ 7 groups, match TypeScript types. Sẵn sàng apply.
     - `.env.example`: đúng (VITE_ prefix, SERVICE_ROLE_KEY warning). Không cần sửa.
     - UI indicator: Login screen banner + demo credentials prefill khi unconfigured. Không cần sửa.
  2. **Tạo `CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`** (NEW): Full audit (auth status, schema status, localStorage→Supabase mapping 7 stores, RLS requirements patterns, missing/deferred items), env vars guide, auth flow diagram, repository interface plan, SQL apply guide 7 bước, Phase 16 CRUD checklist, safety invariants.
  3. **Tạo `src/lib/core/coreRepository.ts`** (NEW): TypeScript interfaces cho 16 repositories (Client, Brand, Campaign, Brief, GenerationJob, ContentItem, ApprovalRequest, ApprovalEvent, ApprovalComment, Asset, AssetCollection, ExportPack, Connector, Module, ModuleEvent, AutomationLog) + `CoreRepositories` bundle. Phase 16 wiring strategy trong comments.
  4. **Cập nhật `CLAUDE_MARKETING_TEAM/03_core/database/README.md`**: Full 7-step SQL apply guide, service role key warning, related docs links.
  5. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **Audit kết quả:** Auth + supabaseClient + LoginScreen + .env.example đều đã ready. Không cần sửa code auth. Chỉ cần: apply schema_v1.sql + set env vars + assign owner role.
- **Không thực hiện:** Full CRUD wiring (defer Phase 16). RLS policies (defer Phase 16). Supabase project creation (chờ owner cấp env vars).
- **Safety:** No secrets. No real API. Demo Sign In + localStorage fallbacks preserved. Build PASS (0 errors).
- **Build:** tsc + vite PASS — 0 errors. Bundle unchanged (~879KB, coreRepository.ts is interfaces only, tree-shaken).
- **Trạng thái Phase 15:** ✅ DONE.
- **Next:** Phase 16 — Supabase CRUD Wiring Core Objects.

---

### 🗓️ Ngày 09/06/2026 — Phase 14: Automation Logs Foundation
- **Sự kiện:** Hoàn thành Automation Logs Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1). Session trước bị limit — tiếp tục từ files dở.
- **Hành động đã hoàn tất:**
  1. Thêm Phase 14 types vào `src/types/core.ts`: `AutomationLogType` (10 values), `AutomationLogSource` (7), `AutomationLogSeverity` (4), `AutomationLogStatus` (5), `LocalAutomationLog` interface (đã có từ session trước — giữ nguyên).
  2. Hoàn thiện `src/lib/core/automationLogs.ts`: display maps (TYPE/SOURCE/SEVERITY/STATUS label+color), 9 seed mock logs, `AutomationLogStore`, localStorage helpers (max 200 logs, key: `core_agency_automation_logs_v1`), `createAutomationLog()`, `updateLogStatus()`, `AutomationLogStats`, `computeLogStats()`. Fixed unused `NOW` variable.
  3. Hoàn thiện `src/components/core/AutomationLogsTab.tsx`: permission gate (`canViewAutomationLogs`), header + Phase 14 badge + Create Mock Log form (5 templates), safety disclaimer bar, stats row (5 cards: Total/Warnings/Errors/Unresolved/Success), filter bar (search + 4 dropdowns), log list (expand/collapse), expanded detail (message + payload JSON + related refs + timestamps + actions: Mark Reviewed/Resolved/Ignore), footer notice. Fixed unused `LocalAutomationLog` import + unused `actorLabel` param.
  4. Cập nhật `src/App.tsx`: import `Activity` icon + `AutomationLogsTab` + log lib; `logData` state + `handleLogUpdate`; sidebar "Automation Logs" button (owner/manager only, with unresolved error badge); tab routing `automation-logs`; phase badge → Phase 14.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/automation_logs_README.md`.
  6. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **TypeScript fixes:** 3 TS6133/TS6196 errors fixed (unused NOW, unused LocalAutomationLog import, unused actorLabel destructuring).
- **Safety:** No real API calls. No real webhooks. No real workflow execution. No auto-post/ads/messaging. Safety disclaimer always visible. Logs hidden from client/viewer.
- **Permissions:** `canViewAutomationLogs` = owner/manager (set in Phase 13); `canManageConnectors` (owner) OR owner/manager = manage log status + create mock logs. Client/viewer: tab hidden + component-level gate.
- **Build:** tsc + vite PASS — 0 errors. ~879KB bundle.
- **Trạng thái Phase 14:** ✅ DONE.
- **Next:** Phase 15 — Real Supabase Auth + Database Wiring Plan.

---

### 🗓️ Ngày 08/06/2026 — Phase 13: Connector Registry + Module Event Inbox Foundation
- **Sự kiện:** Hoàn thành Connector Registry + Module Event Inbox Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm Phase 13 types vào `src/types/core.ts`: `LocalConnectorType` (12), `LocalConnectorStatus`, `LocalConnectorMode`, `LocalConnectorRegistryItem`, `LocalModuleName` (11), `LocalModuleStatus`, `LocalModuleRegistryItem`, `LocalModuleEventType` (12), `ModuleEventDirection`, `LocalModuleEventStatus`, `LocalModuleEvent`.
  2. Tạo `src/lib/core/connectorRegistry.ts`: seed data (11 connectors, 10 modules, 5 events), display maps (CONNECTOR_TYPE/STATUS/MODE_LABEL/COLOR, MODULE_NAME/STATUS_LABEL/COLOR, MODULE_EVENT_TYPE/STATUS_LABEL/COLOR), `ConnectorRegistryStore`, localStorage helpers, CRUD: `updateConnectorStatus()`, `simulateHealthCheck()`, `updateModuleStatus()`, `updateEventStatus()`, `addMockEvent()`. Storage key: `core_agency_connector_registry_v1`.
  3. Tạo `src/components/core/ConnectorRegistryTab.tsx`: 3 sub-tabs (Connectors / Modules / Event Inbox). Safety banner. Connectors: 11 cards với status/mode badges, required env keys, safety note, actions (Simulate Health Check / Mark Configured / Disable / Re-enable). Modules: 10 cards với contract info, owner, actions (Mark Mock Ready / Disable). Event Inbox: filter bar (module/connector/direction/status/event_type), expandable event rows với payload preview, status actions (Mark Processed/Needs Review/Ignore), Create Mock Event form. Governance footer.
  4. Cập nhật `src/App.tsx`: import `Network` icon + `ConnectorRegistryTab`; sidebar "Connector Registry" button (sau Export Pack trong Core section); tab routing `connector-registry`; phase badge → Phase 13.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/connector_registry_README.md`.
  6. Cập nhật CURRENT_PHASE.md và phase_log.md.
- **Safety:** No real API calls. No real webhooks sent. All connectors start as `not_configured / mock`. Mock events local only. Safety banner + governance footer always visible.
- **Permissions:** `canViewConnectors` = owner/manager; `canManageConnectors` = owner; `canViewAutomationLogs` = owner/manager.
- **Trạng thái Phase 13:** ✅ DONE.
- **Next:** Phase 14 — Supabase CRUD Wiring.

---

### 🗓️ Ngày 08/06/2026 — Phase 12: Export Pack Foundation
- **Sự kiện:** Hoàn thành Export Pack Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `ExportPackType` (6 loại), `ExportPackFormat`, `ExportPackStatus`, `LocalExportPack`.
  2. Mở rộng `src/lib/core/coreData.ts`: `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()` (max 50 packs). Storage key: `core_agency_export_pack_data_v1`.
  3. Tạo `src/lib/core/exportPackGenerator.ts`: `generateExportPack()` deterministic, 6 content builders, format converter (markdown/plain_text/json_preview), `CLIENT_SAFE_EXPORT_TYPES`.
  4. Tạo `src/components/core/ExportPackTab.tsx`: safety banner, configure panel (scope/type/format/generate), preview panel (textarea + copy + regenerate), history panel (50 recent packs), governance reminders, permission gate.
  5. Cập nhật `src/App.tsx`: import `Package`, `ExportPackTab`; sidebar "Export Pack" button; tab routing `export-pack`; phase badge → Phase 12.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`.
- **Safety:** No real API, no upload, no email, no auto-post. Safety banner always visible. Approved ≠ Published.
- **Permissions:** `canViewExportPacks` = owner/manager/client; `canExportPacks` (generate) = owner/manager. Client/viewer restricted to 3 client-safe types.
- **Trạng thái Phase 12:** ✅ DONE.
- **Next:** Phase 13 — Connector Registry + Module Event Inbox Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 11: Report Module Foundation
- **Sự kiện:** Hoàn thành Report Module Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `LocalReportType` (6 loại), `LocalReportStatus`, `ReportMetrics`, `LocalReport`.
  2. Tạo `src/lib/core/reportGenerator.ts`: `generateLocalReport()` deterministic (không gọi AI thật), display maps cho content/approval/asset status, `CLIENT_ACCESSIBLE_REPORT_TYPES`, `buildClientSummaryText()`, `buildSummaryText()`.
  3. Tạo `src/components/core/ReportsTab.tsx`: filter bar (client/brand/campaign cascading + report type), Generate button (owner/manager only), metric cards (6 cards: total content, approved, pending, revision, assets, progress%), progress bar visual, detailed breakdown (4 sections: by status, by channel, approval by status, asset by status), client summary text (copyable), internal summary (copyable, internal only), governance note.
  4. Cập nhật `src/App.tsx`: import `BarChart2`, `ReportsTab`; sidebar "Reports" button (indigo, under Approvals in Core section); tab routing `reports`.
- **Safety:** No real API calls. No auto-post/ads/message. Report clearly labeled "Core workspace data only. No real platform analytics." Approved ≠ Published.
- **Permissions:** `canViewReports` = all roles; `canGenerateReports` = owner/manager. Client/viewer chỉ thấy client_summary và campaign_progress types.
- **Trạng thái Phase 11:** ✅ DONE. Commit: 6e15e25.
- **Next:** Phase 12 — Export Pack Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 10: Asset Library Foundation
- **Sự kiện:** Hoàn thành Asset Library Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `AssetType`, `AssetSourceType`, `AssetApprovalStatus`, `AssetItem`, `LocalAssetCollection`.
  2. Mở rộng `src/lib/core/coreData.ts`: `AssetDataStore`, `SEED_COLLECTIONS` (3), `SEED_ASSETS` (6 cho Vị Cuốn/Cơm Tấm/Forme), `loadAssetData`, `saveAssetData`, `createAsset`, `updateAsset`, display maps.
  3. Tạo `src/components/core/AssetLibraryTab.tsx`: filter bar (client/brand/campaign/type/status cascading), asset card list (expand detail), create/edit metadata form, archive action, asset collections panel, safety banner, permission guard.
  4. Cập nhật `src/App.tsx`: import `FolderOpen`, `AssetLibraryTab`, `loadAssetData/saveAssetData`, state `assetData`, handler `handleAssetUpdate`, sidebar "Asset Library" button, tab routing `asset-library`.
- **Safety:** Metadata only, no real file upload. Usage rights note field required. Storage upload deferred. Approved asset ≠ published content. No auto-post/ads/messaging.
- **Permissions:** `canViewAssets` = all roles; `canManageAssets` = owner/manager. Client/viewer only see approved assets.
- **Trạng thái Phase 10:** ✅ DONE. Commit: 2ff8007.
- **Next:** Phase 11 — Report Module Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 9: Client View Foundation
- **Sự kiện:** Hoàn thành Client View Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `src/components/core/ClientViewTab.tsx` — Client Portal với campaign selector, campaign overview card, content summary stats (Approved/Pending/Revision), content item cards (hook, caption, visual_brief, cta, hashtags — không lộ internal data), feedback form (lưu vào approvalComments), safety banner, empty states, "Internal Preview" badge cho owner/manager.
  2. Cập nhật `src/App.tsx` — import `UserCheck`, `ClientViewTab`; thêm "Client" sidebar section với "Client Portal" button; thêm tab routing `client-view`.
  3. Tạo `CLAUDE_MARKETING_TEAM/03_core/client_view_README.md`.
  4. Cập nhật logs và SESSION_SUMMARY.
- **Client-visible statuses:** `approved` → "Approved", `needs_review`/`generated` → "Pending Review", `revision_requested` → "Revision Requested". Hidden: rejected, archived, failed, draft.
- **Client actions:** Add feedback comment (stored via `addApprovalComment(..., isInternal=false)`). No publish, no approve, no internal edits.
- **Permission gate:** canViewContent = all roles. canAddFeedback = all roles (requires active approval request). canApprove = Approvals tab only (owner/manager).
- **Safety:** Approved ≠ Published. No publish action in Phase 9. Safety banner always visible. No auto-post/ads/messaging.
- **Trạng thái Phase 9:** ✅ DONE.
- **Next:** Phase 10 — Asset Library Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 8: Approval Workflow Foundation
- **Sự kiện:** Hoàn thành Approval Workflow Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm Phase 8 types: `ContentApprovalStatus`, `ApprovalPriority`, `ApprovalActionType`, `ContentApprovalRequest`, `ContentApprovalEvent`, `ContentApprovalComment`.
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `ApprovalDataStore`, `loadApprovalData()`, `saveApprovalData()`, display helpers (APPROVAL_STATUS_LABEL/COLOR, PRIORITY_LABEL/COLOR, ACTION_LABEL), `SUBMITTABLE_ITEM_STATUSES`, `getActiveRequestForItem()`, `canSubmitItem()`, `submitForApproval()`, `executeApprovalAction()`, `addApprovalComment()`. Storage key: `core_agency_approval_data_v1`.
  3. Tạo `src/components/core/ApprovalsTab.tsx` — list view (submit panel, filter bar, request cards) + detail view (content preview, approval metadata, action buttons [Approve/Reject/Request Revision/Cancel], comment form, history timeline). Safety banner.
  4. Cập nhật `src/components/core/ContentGenerationTab.tsx` — thêm `onNavigateToApprovals` + `submittableItemIds` props; "→ Submit for Approval" button trên expanded items đủ điều kiện.
  5. Cập nhật `src/components/core/ContentCalendarTab.tsx` — thêm `approvalRequests` + `onNavigateToApprovals` props; hiển thị approval status badge trên item cards; `approvalStatusByItemId` map computed via useMemo.
  6. Cập nhật `src/App.tsx` — import `ClipboardCheck`, `ApprovalsTab`; `approvalData` state; `handleApprovalUpdate()` (atomic update cả hai stores); `handleNavigateToApprovals()`; `actorLabel`; `submittableItemIds`; sidebar "Approvals" button với pending count badge; tab routing `approvals`.
  7. Tạo `CLAUDE_MARKETING_TEAM/03_core/approval_workflow_README.md`.
  8. Cập nhật logs và SESSION_SUMMARY.
- **Status transition:** submitted → approved/rejected/revision_requested/cancelled. approve → content item `approved`. reject → `rejected`. revision → `revision_requested`. cancel → reverts to `needs_review`.
- **Permission gate:** canApproveContent = owner + manager. canSubmit = generateContent OR editCampaigns. canView = all roles.
- **Safety:** Approved ≠ Published. No publish action in Phase 8. Safety banner always visible.
- **Trạng thái Phase 8:** ✅ DONE.
- **Next:** Phase 9 — Client View Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 7: Content Calendar Foundation
- **Sự kiện:** Hoàn thành Content Calendar Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm 4 optional calendar fields vào `ContentPlanItem`: `scheduled_time`, `publish_note`, `owner_note`, `last_moved_at`. Backward-compatible với data cũ (all optional).
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `CalendarSafeStatus`, `CALENDAR_SAFE_STATUSES`, `CalendarItemPatch`, `updateContentItemInStore()`. Safe statuses Phase 7: generated, needs_review, revision_requested, rejected, archived. approved/scheduled/published bị block.
  3. Tạo `src/components/core/ContentCalendarTab.tsx` — full calendar feature: safety banner, cascading filter bar (client→brand→campaign→channel→status), day-grouped item list sorted by planned_date, item cards với expand inline, detail view (caption/visual brief/hashtags/CTA/angle/pillar/approval note), edit panel (planned_date/scheduled_time/channel/owner_note/publish_note/status), permission gate, empty states, summary stats.
  4. Cập nhật `src/App.tsx` — import `CalendarDays` icon + `ContentCalendarTab`; sidebar button "Content Calendar" (sau Content Generation, trước Workspace section); tab routing `content-calendar`.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/content_calendar_README.md`.
  6. Cập nhật logs: CURRENT_PHASE.md, phase_log.md, agent_activity_log.md, SESSION_SUMMARY.md.
- **Calendar features:** filter by client/brand/campaign/channel/status; group by planned_date; expand/collapse per item; inline edit safe fields; safety banner always visible.
- **Permission gate:** canViewContent = all roles; canEditContent || canGenerateContent = owner + manager only.
- **Safety:** Calendar is planning only. Scheduled ≠ Published. Generated ≠ Approved. Approved ≠ Published. No auto-post. No publish action in Phase 7.
- **Trạng thái Phase 7:** ✅ DONE.
- **Next:** Phase 8 — Approval Workflow Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 6: Content Generation Foundation
- **Sự kiện:** Hoàn thành Content Generation Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm Phase 6 types: `ContentPlanJobStatus`, `GenerationMode`, `PlanLengthDays`, `ContentItemStatus6`, `ContentPlanJob`, `ContentPlanItem`.
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `GenerationDataStore`, `loadGenerationData()`, `saveGenerationData()`, `JOB_STATUS_LABEL/COLOR`, `CONTENT_ITEM_STATUS_LABEL/COLOR`. Storage key riêng: `core_agency_gen_data_v1`.
  3. Tạo `src/lib/core/contentGenerator.ts` — deterministic mock generator. 7 ContentAngles, Vietnamese templates, industry-aware CTA, per-channel visual brief. Default item status: `needs_review`.
  4. Tạo `src/components/core/ContentGenerationTab.tsx` — list view (approved briefs, generate form, job history) + detail view (job summary, expandable content items: hook/caption/visual brief/CTA/hashtags). Safety banner required.
  5. Cập nhật `src/components/core/BriefIntakeTab.tsx` — thêm `onNavigateToGenerate` prop, enable Generate button khi brief = `approved_for_generation`.
  6. Cập nhật `src/App.tsx` — import `Wand2`, `ContentGenerationTab`, generation data imports; thêm `genData` state + `handleGenerationUpdate` + `genNavBriefId`; sidebar "Content Generation" button; tab rendering; phase badge → Phase 6.
  7. Tạo `CLAUDE_MARKETING_TEAM/03_core/content_generation_README.md`.
  8. Build pass (tsc + vite, 0 errors, ~663KB bundle). Commit + push.
- **Generation flow:** Brief (approved_for_generation) → generate() → ContentPlanJob + ContentPlanItem[]. Job mode: mock. Item status: needs_review (never auto-approved/published).
- **Permission gate:** generateContent = owner + manager only. viewContent = all roles.
- **Safety:** Generated ≠ Approved ≠ Published. No AI API. No auto-post. No ads.
- **Trạng thái Phase 6:** ✅ DONE.
- **Next:** Phase 7 — Content Calendar Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 5: Brief Intake Foundation
- **Sự kiện:** Hoàn thành Brief Intake Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm `BriefStatus` union type, mở rộng `CampaignBrief` với 15 fields mới (brief_title, campaign_goal, product_focus, offer, tone_of_voice, content_pillars, must_include, must_avoid, competitors, reference_links, budget_note, timeline_note, approval_requirements, brand_id, client_id).
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `BriefFormData`, `SEED_BRIEFS` (3 briefs), mở rộng `CoreDataStore` với `briefs`, migration trong `loadCoreData()`, helpers BRIEF_STATUS_LABEL/COLOR/EMPTY_BRIEF_FORM.
  3. Tạo `src/components/core/BriefIntakeTab.tsx` — list view (filter, cards, quick-actions), detail view (all fields, status transitions, disabled Generate placeholder), create/edit form (5 sections, auto-populate, validation), safety notice.
  4. Cập nhật `ClientsTab.tsx`, `BrandsTab.tsx`, `CampaignsTab.tsx` — thêm `briefs` prop và pass-through trong `onUpdate`.
  5. Cập nhật `src/App.tsx` — import BriefIntakeTab + ClipboardList, Brief Intake sidebar button + tab rendering, phase badge → Phase 5.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/brief_intake_README.md`.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite, 0 errors, ~634KB bundle). Push to GitHub.
- **Status machine:** draft → ready_for_generation → approved_for_generation | needs_revision → archived.
- **Safety:** Generate button disabled (Phase 6 placeholder). Brief = input only. Generated ≠ Approved ≠ Published.
- **Trạng thái Phase 5:** ✅ DONE.
- **Next:** Phase 6 — Content Generation (enable Generate button for approved_for_generation briefs).

---

### 🗓️ Ngày 07/06/2026 — Phase 4: Client/Brand/Campaign Management Foundation
- **Sự kiện:** Hoàn thành Core Management layer cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `src/lib/core/coreData.ts` — seed data (3 clients, 3 brands, 3 campaigns), localStorage store, form types, display helpers.
  2. Tạo `src/components/core/ClientsTab.tsx` — list, create form, detail view, archive/activate, cross-tab nav.
  3. Tạo `src/components/core/BrandsTab.tsx` — card grid, filter by client, create form, detail view, cross-tab nav.
  4. Tạo `src/components/core/CampaignsTab.tsx` — table, filter by client+brand, create form, status update, detail view.
  5. Cập nhật `src/App.tsx` — imports, coreData state, handleCoreUpdate, handleCoreNavigate, sidebar "Core" section (Clients/Brands/Campaigns), tab rendering, phase badge → Phase 4.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/client_brand_campaign_README.md`.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite, 0 errors, 606KB bundle). Push to GitHub.
- **Permission integration:** canManageClients / canManageBrands / canCreateCampaigns / canEditCampaigns applied.
- **Data mode:** Local demo (localStorage `core_agency_core_data_v1`). Supabase wired in Phase 5+.
- **Trạng thái Phase 4:** ✅ DONE.
- **Next:** Phase 5 — Brief Intake Foundation + Supabase CRUD wiring.

---

### 🗓️ Ngày 07/06/2026 — Phase 3: Auth/Login + Role Permission Foundation
- **Sự kiện:** Hoàn thành Auth foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cài `@supabase/supabase-js` (9 packages).
  2. Tạo `src/vite-env.d.ts` — Vite env type declarations.
  3. Tạo `src/lib/supabaseClient.ts` — null-safe Supabase client.
  4. Tạo `src/lib/auth/AuthContext.tsx` — React context, 3 modes, signIn/signOut, fetchUserRole.
  5. Tạo `src/lib/auth/permissions.ts` — 30+ permission keys, `can.*` helpers, role colors/labels.
  6. Tạo `src/components/auth/LoginScreen.tsx` — login UI, demo fallback.
  7. Cập nhật `src/main.tsx` — wrap `<AuthProvider>`.
  8. Cập nhật `src/App.tsx` — auth gate, user status header.
  9. Tạo `src/vite-env.d.ts` — fix ImportMeta.env types.
  10. Tạo `CLAUDE_MARKETING_TEAM/03_core/auth/README.md`.
  11. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  12. Build pass (tsc + vite). Push to GitHub.
- **Trạng thái Phase 3:** ✅ DONE.
- **Next:** Phase 4 — Client/Brand/Campaign Management + RLS policies.

---

### 🗓️ Ngày 07/06/2026 — Phase 2: Database Schema V1
- **Sự kiện:** Hoàn thành Database Schema V1 cho The Core Agency Real Operations MVP.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md` — tài liệu schema đầy đủ, phase dependency map.
  2. Tạo `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql` — SQL Supabase Postgres: 30+ bảng, 7 nhóm, enums, indexes, triggers, RLS.
  3. Tạo `CLAUDE_MARKETING_TEAM/03_core/database/README.md` — hướng dẫn apply schema.
  4. Tạo `src/types/core.ts` — TypeScript types khớp hoàn toàn với schema.
  5. Tạo `.env.example` — placeholder an toàn cho Supabase, webhook, n8n, Anthropic.
  6. Kiểm tra `.gitignore` — `.env.local`, `.env` đã được gitignore ✅.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite). Push to GitHub.
- **Trạng thái Phase 2:** ✅ DONE.
- **Next:** Phase 3 — Auth/Login + Role Permission Foundation (Supabase Auth, RLS policies).

---

### 🗓️ Ngày 07/06/2026 — Real Operations MVP Start
- **Sự kiện:** Bắt đầu The Core Agency Real Operations MVP — Phase 1.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Đọc toàn bộ docs hiện có: CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  2. Khoá scope sản phẩm: 18 phases / 7 days plan.
  3. Tạo `00_strategy/THE_CORE_AGENCY_7_DAY_REAL_MVP_PLAN.md` — plan 18 phase đầy đủ.
  4. Tạo `00_strategy/THE_CORE_AGENCY_MODULES_AND_N8N_WORKSTREAM.md` — architecture + module contracts.
  5. Cập nhật UI branding: `CLAUDE MARKETING TEAM` → `THE CORE AGENCY` trong App.tsx header.
  6. Cập nhật tagline: `Multi-brand AI Marketing Team Workspace` → `AI Marketing Team Workspace`.
  7. Cập nhật phase badge: `Phase H.7 — Owner & Client Views` → `Real Operations MVP — Phase 1`.
  8. Cập nhật pitch text: `Đội ngũ Claude AI Marketing Team` → `Đội ngũ The Core Agency`.
  9. Cập nhật `index.html` title: `AI Marketing Team Workspace` → `The Core Agency`.
  10. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  11. Build pass (tsc + vite build). Push to GitHub.
- **Trạng thái Phase 1:** ✅ DONE.
- **Next:** Phase 2 — Database Schema V1 (Supabase).

---

### 🗓️ Ngày 03/06/2026 19:10:51 (Local Time)
- **Sự kiện:** Khởi tạo dự án độc lập `CLAUDE_MARKETING_TEAM`.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Thiết lập toàn bộ cấu trúc thư mục từ `00_brand_inputs` đến `08_logs`.
  2. Tạo tài liệu hướng dẫn nền tảng: `README.md`, `PROJECT_BLUEPRINT.md`, `AGENTS.md`, `CURRENT_PHASE.md`, `SESSION_SUMMARY.md`.
  3. Tạo dữ liệu thương hiệu mẫu `sample_brand_brief.md` và template chiến dịch `campaign_brief_template.md`.
  4. Thiết kế hệ thống templates V1 đầu ra tại `03_templates/` cho cả 5 vai trò AI.
  5. Định nghĩa các quy trình phối hợp nhóm, luồng chiến dịch mẫu 7 ngày và quy trình duyệt thủ công tại `04_workflows/`.
  6. Xây dựng chi tiết kỹ năng cho từng Agent tại `05_skills/`.
  7. Thiết lập demo case mẫu tại `06_demo_cases/local_business_demo/`.
  8. Soạn thảo luật hệ thống, luật an toàn bảo mật và hướng dẫn kết nối API thật trong tương lai tại `07_docs/`.
  9. Khởi tạo nhật ký hệ thống này tại `08_logs/phase_log.md`.
- **Trạng thái Phase A:** Hoàn thành 100% việc thiết lập móng Workspace.

### 🗓️ Ngày 03/06/2026 19:24:13 (Local Time)
- **Sự kiện:** Triển khai Phase B — First Demo Campaign Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase B — First Demo Campaign Pack.
  2. Sản xuất thành công đầu ra chi tiết của Copywriter gồm 7 caption, 7 hook, 3 slogan, 5 CTA.
  3. Soạn thảo kịch bản video chi tiết của Video Editor gồm 7 script TikTok/Reels phân cảnh.
  4. Thiết lập 7 Design brief và Prompts tiếng Anh tạo ảnh cho Designer.
  5. Thiết lập kế hoạch phân phối quảng cáo giả định (5 angles, 3 objectives, 3 ad sets, 5 creative testings) của Ads Manager.
  6. Tổng hợp báo cáo hiệu quả chiến dịch 7 ngày mô phỏng (Simulated Data) của Data Reporter.
  7. Đóng gói toàn bộ sản phẩm sáng tạo và cấu hình vào file pack tổng hợp `demo_7_day_campaign_pack.md`.
- **Trạng thái Phase B:** Hoàn thành 100% gói demo chiến dịch 7 ngày.

### 🗓️ Ngày 03/06/2026 19:26:25 (Local Time)
- **Sự kiện:** Triển khai Phase C — Brief To Output Operating System.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase C — Brief To Output Operating System.
  2. Tạo biểu mẫu thu thập dữ liệu đầu vào chuẩn hóa [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md).
  3. Lên quy trình vận hành tiêu chuẩn gồm 7 bước cụ thể tại [brief_to_output_sop.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/04_workflows/brief_to_output_sop.md).
  4. Thiết lập template tổng hợp gói chiến dịch cuối cùng [final_campaign_pack_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/03_templates/final_campaign_pack_template.md).
  5. Viết cẩm nang hướng dẫn sử dụng phi kỹ thuật dành cho Owner tại [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md).
  6. Xây dựng bảng ranh giới phân biệt các cấp độ vận hành [demo_vs_real_boundary.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/demo_vs_real_boundary.md).
- **Trạng thái Phase C:** Hoàn thành 100% việc xây dựng hệ điều hành quy trình (SOP & Manuals).

### 🗓️ Ngày 03/06/2026 19:28:33 (Local Time)
- **Sự kiện:** Triển khai Phase D — Antigravity Commands.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase D — Antigravity Commands.
  2. Tạo thư mục `.antigravity/commands/` tại thư mục gốc.
  3. Xây dựng tệp lệnh khởi tạo [.antigravity/commands/start_campaign.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/start_campaign.md).
  4. Xây dựng tệp lệnh kiểm tra [.antigravity/commands/review_outputs.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/review_outputs.md).
  5. Xây dựng tệp lệnh đóng gói [.antigravity/commands/finalize_pack.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/finalize_pack.md).
  6. Cập nhật tài liệu hướng dẫn [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md) để hướng dẫn gọi các lệnh mới này.
- **Trạng thái Phase D:** Hoàn thành 100% việc xây dựng thư mục tập lệnh Antigravity Commands.

### 🗓️ Ngày 03/06/2026 19:30:30 (Local Time)
- **Sự kiện:** Triển khai Phase E — Local Web UI Prototype.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase E — Local Web UI Prototype.
  2. Tạo các tệp cấu hình Vite/React/TS tại thư mục gốc: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`.
  3. Xây dựng hệ thống biến HSL CSS & styling cao cấp (Dark theme, glassmorphism, glowing accents) tại `src/index.css`.
  4. Chuẩn bị tệp dữ liệu mock phong phú cho trà sữa Vinh tại `src/mockData.ts`.
  5. Phát triển component chính `src/App.tsx` tích hợp 5 màn hình tương tác (Dashboard, Campaign Brief Form, AI Team Board, Campaign Outputs, Approval Checklist) có hỗ trợ mô phỏng tiến độ làm việc của Agent.
  6. Tạo tệp entry point React `src/main.tsx`.
  7. Cập nhật tài liệu hướng dẫn khởi chạy cục bộ vào `CLAUDE_MARKETING_TEAM/README.md`.
- **Trạng thái Phase E:** Hoàn thành 100% việc xây dựng giao diện web UI prototype local.

### 🗓️ Ngày 03/06/2026 19:45:00 (Local Time)
- **Sự kiện:** Khắc phục lỗi biên dịch Vite (Compile Error) trong Phase E.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Sửa lỗi cú pháp CSS variable không có dấu nháy ở inline style dòng 245 của [src/App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx) (`color: var(--accent-indigo)` thành `color: 'var(--accent-indigo)'`).
  2. Kiểm duyệt lại toàn bộ file `src/App.tsx` đảm bảo tất cả các biến CSS dùng trong inline style đều có dấu nháy hợp lệ.
  3. Đăng ký lệnh chạy `npm.cmd run dev` để chạy thử nghiệm.
- **Trạng thái:** Toàn bộ dự án đã sẵn sàng, khắc phục hoàn toàn lỗi biên dịch Vite.

### 🗓️ Ngày 03/06/2026 20:15:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase F — Universal AI Coordinator Prompt.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase F — Universal AI Coordinator Prompt và cập nhật checklist.
  2. Tạo lập tệp Prompt vạn năng [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md) tích hợp định nghĩa 5 Agent AI Marketing, các ranh giới bảo mật nghiêm ngặt và quy tắc gắn nhãn Simulated Data.
  3. Tạo lập tệp Prompt ví dụ thực tế [example_owner_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/example_owner_prompt.md) sử dụng Brief của quán Trà Sữa Tôm Tép tại Vinh để chạy thử trực tiếp trên các chatbot ngoài.
  4. Cập nhật cẩm nang hướng dẫn sử dụng [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md) để hỗ trợ Owner copy-paste chạy mô phỏng thuận tiện.
- **Trạng thái Phase F:** Hoàn thành 100%, toàn bộ lộ trình mô phỏng AI Marketing Team đã được đóng gói hoàn tất.

### 🗓️ Ngày 03/06/2026 20:15:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase G — Client Demo Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase G — Client Demo Pack.
  2. Tạo tệp [client_pitch_deck_outline.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_pitch_deck_outline.md) phác thảo slide giới thiệu khách hàng.
  3. Tạo tệp [client_demo_script.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_demo_script.md) kịch bản nói chuyện demo 10 phút.
  4. Tạo tệp [service_packages.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/service_packages.md) đề xuất 3 gói dịch vụ Basic/Growth/Automation linh hoạt.
  5. Tạo tệp [faq_for_clients.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/faq_for_clients.md) giải đáp các thắc mắc an toàn cho khách hàng.
- **Trạng thái Phase G:** Hoàn thành 100% việc chuẩn bị bộ tài liệu demo và bán hàng thương mại cho SMEs.

### 🗓️ Ngày 04/06/2026 23:30:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase H.2 — Client Demo Mode.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Commit:** `75ac881` — feat: add phase h2 client demo mode
- **Hành động đã hoàn tất:**
  1. Thêm tab **Client Demo Mode** vào Sidebar Navigation của Web UI (`src/App.tsx`).
  2. Triển khai **Client View** gồm: Campaign Overview (Thương hiệu, Sản phẩm, Ý tưởng, Kênh), Key Deliverables, What Client Can Approve.
  3. Triển khai **Approval Status Demo** với đủ 3 trạng thái: Draft → Waiting for Owner Review → Approved for Manual Use.
  4. Triển khai **AI Team Workspace** với đủ 5 role cards: Copywriter, Video Editor, Designer, Ads Manager, Data Reporter — mỗi role có Nhiệm vụ chính, Demo Output và nhãn Human Sign-off Required.
  5. Sửa lỗi build TypeScript (unused import `Eye`) gây cascade 20+ lỗi compile — fix: xóa `Eye` khỏi lucide-react import.
  6. Codex review PASS. Production (Vercel) Owner checked PASS.
- **Trạng thái Phase H.2:** DONE + BUILT + REVIEWED + PUSHED + PRODUCTION CHECKED.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Demo/Mock Data Only: YES

### 🗓️ Ngày 04/06/2026 21:40:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase H-lite — Manual Export Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Nâng cấp giao diện Web UI ([src/App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx)) bằng cách tạo thêm tab **Manual Export Pack**.
  2. Triển khai 6 khối xuất dữ liệu markdown/text dạng văn bản tĩnh có ô textarea readonly và tích hợp nút Copy nhanh cho:
     * Full Campaign Pack
     * Client Summary
     * Editor Handoff
     * Designer Handoff
     * Ads Draft Pack
     * Approval Checklist
  3. Gắn kèm disclaimer pháp lý bắt buộc: Chỉ sử dụng cho mục đích demo mock-up, yêu cầu duyệt thủ công bằng con người trước khi đăng bài hay chạy quảng cáo thực tế.
  4. Biên dịch và kiểm duyệt chất lượng cục bộ thành công (build & dev PASS).
  5. Đẩy code lên GitHub main branch (commit `1eb9fdc`).
- **Trạng thái Phase H-lite:** Hoàn thành 100% việc cung cấp gói dữ liệu thủ công phục vụ triển khai offline an toàn.

### 🗓️ Ngày 04/06/2026 (Local Time)
- **Sự kiện:** Triển khai Phase H.3 — Demo Polish & Sales Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Commits:**
  - `0a36ea4` — feat: add phase h3 demo polish and sales readiness (session 1)
  - `7b90faf` — feat: add phase h3 full sales readiness features (session 2)
- **Hành động đã hoàn tất:**
  1. Cập nhật header badge Web UI → "Phase H.3 — Demo Polish & Sales Readiness".
  2. Dashboard: Thêm **Presenter Demo Guide** 5-step clickable card (Dashboard → Brief → Outputs → Client Demo → Export Pack). Bấm vào từng step là chuyển tab tương ứng.
  3. Client Demo Mode: Thêm **Sales Readiness** section — 5 card row: Vấn đề KH / Giải pháp AI Team / Khách nhận được gì / Cần duyệt thủ công gì / Tại sao an toàn.
  4. Client Demo Mode: Thêm **Value Proposition** section — 4 cards với mock ROI và key benefits (⚡ 3 phút, 🤝 Human-in-the-loop, 🎯 5 chuyên gia, 📊 mock ROI tiết kiệm 15h/tuần).
  5. Client Demo Mode: Thêm **Before/After Comparison** — Manual vs AI-Assisted table (10–16 giờ → ~2 giờ mock estimate).
  6. Client Demo Mode: Thêm **CTA Block** 3 nút clickable: Duyệt Campaign Pack → Approval tab | Xuất File Gửi Khách → Manual Export tab | Chuẩn Bị Brief Tiếp Theo → New Campaign tab.
  7. Client Demo Pack: Thêm **Service Packages Teaser** — 3 gói static mock: Starter / Growth / Scale.
  8. Build local PASS (`npm run build`) — 0 TypeScript/Vite errors.
- **Trạng thái Phase H.3:** DONE + BUILT + CODEX REVIEWED + PUSHED — Codex review PASS (UI/code/safety); docs/log stale status fixed.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Demo/Mock Data Only: YES
  - Backend added: NO | Database added: NO | Real API: NO

### 🗓️ Ngày 04/06/2026 (Local Time) — Phase H.3 CLOSED
- **Sự kiện:** Đóng Phase H.3 — Demo Polish & Sales Readiness.
- **Người thực hiện:** Owner + Codex reviewer.
- **Kết quả Codex re-review:** PASS — UI/code/safety PASS, no required fixes.
- **git status:** working tree clean. main = origin/main.
- **Trạng thái Phase H.3:** ✅ CLOSED
- **Next phase:** Phase H.4 — Export/Presentation Readiness.





### 🗓️ Ngày 04/06/2026 (Local Time) — Phase H.4 START
- **Sự kiện:** Triển khai Phase H.4 — Export/Presentation Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Hành động đã hoàn tất:**
  1. Cập nhật header badge Web UI → "Phase H.4 — Export/Presentation Readiness".
  2. Thêm nav sidebar button **"Presentation & Export"** (icon BookOpen).
  3. Thêm state mới: `approvalSheetItems` (7 rows), `exportChecklist` (7 items).
  4. Xây dựng tab `presentation-export` gồm 5 sections:
     - **Presentation View**: 6-step client explanation (Problem → AI Solution → Outputs → Approval → Manual Publishing → Safety)
     - **Export Pack Preview**: 7 deliverable cards với badge, description, "View in workspace →" button
     - **Client Approval Sheet Preview**: 5-cột table với clickable status badges (cycle 4 states)
     - **Sales Demo Script**: 5-step timeline (0:00–5:30) + "Copy Script" button
     - **Export Readiness Checklist**: 7-item, 3 safety-locked, live x/7 counter badge
  5. Build local PASS (`npm run build`) — 0 TypeScript/Vite errors.
- **Trạng thái Phase H.4:** IMPLEMENTED — build PASS, pushed to GitHub (`d823c17`), Codex review PASS.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Backend: NO | Database: NO | Real API: NO
  - Demo/Mock Data Only: YES

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.4 Codex Review Result
- **Sự kiện:** Codex review Phase H.4 hoàn tất.
- **Kết quả:** UI/code/build/safety PASS. Phát hiện duy nhất: trạng thái docs/log còn stale.
- **Fix:** Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md, phase_h4_handoff.md để phản ánh đúng trạng thái đã push và Codex review PASS.
- **Commits pushed:** `d2e7bd8`, `d823c17`
- **Trạng thái Phase H.4:** ✅ IMPLEMENTED + CODEX REVIEWED — docs/log stale status fixed.
### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.4 CLOSED
- **Sự kiện:** Đóng Phase H.4 — Export/Presentation Readiness.
- **Người thực hiện:** Owner + Codex reviewer.
- **Kết quả Codex re-review:** PASS — UI/code/build/safety PASS, no required fixes.
- **git status:** working tree clean. main = origin/main.
- **Trạng thái Phase H.4:** ✅ CLOSED
- **Next phase:** Phase H.5 — Multi-brand Workspace Readiness.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 START
- **Sự kiện:** Triển khai Phase H.5 — Multi-brand Workspace Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Framing correction:** Reframe từ "Multi-brand Demo Readiness" → "Multi-brand Workspace Readiness" theo chỉ đạo Owner. Workspace là sản phẩm thực tế, không phải demo toy.
- **Hành động đã hoàn tất:**
  1. `mockData.ts`: Thêm 2 seed brands — Cơm Tấm Bản Khói (F&B/HCM) và Forme (nội thất cao cấp/HCM+HN). Vị Cuốn giữ nguyên.
  2. `src/App.tsx`: localStorage v3, header badge H.5, sidebar "Brand Workspace" tab, Dashboard Brand Switcher, Brand Gallery tab, dynamic Client Demo Mode.
  3. Language: "Sample Data", "Sandbox Safe Mode", "Workspace" — không dùng "demo" là main framing.
- **Safety Guard H.5 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Trạng thái Phase H.5:** IN PROGRESS — build pending.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 Codex Review + Fix
- **Sự kiện:** Codex review Phase H.5.
- **Kết quả:** 1 required fix — campaign workspace wording alignment.
- **Fix applied:** Commit `147487d` — fix: align phase h5 campaign workspace wording.
- **Build:** `npm run build` PASS — 0 errors. Working tree clean.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 CLOSED
- **Sự kiện:** Đóng Phase H.5 — Multi-brand Workspace Readiness.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex review:** PASS — fix applied, build PASS, git clean.
- **Commits:** `e313f8f` (feat: add phase h5 multi brand workspace readiness), `147487d` (fix: align phase h5 campaign workspace wording).
- **Note:** H.5 upgraded the app into a multi-brand AI Marketing Team Workspace with Vị Cuốn, Cơm Tấm Bản Khói, and Forme using sample/seed data and Sandbox Safe Mode. Product framing corrected from demo wording to workspace wording.
- **Trạng thái Phase H.5:** ✅ DONE + CODEX PASS + FIX APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK
- **Next phase:** Phase H.6 — Client-ready Workspace Polish.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 DONE
- **Sự kiện:** Hoàn thành Phase H.6 — Client-ready Workspace Polish.
- **Người thực hiện:** Builder Agent (Claude Code). Continued from previous session hit usage limit.
- **Hành động đã hoàn tất:**
  1. Header badge → "Phase H.6 — Client-ready Workspace Polish".
  2. Nav sidebar renames: "Client Demo Pack" → "Client Presentation Pack", "Client Demo Mode" → "Client Workspace View".
  3. Demo Pack tab h2 → "Client Presentation Pack"; Client Demo Mode h2 → "Client Workspace View" badge → "Client-Ready".
  4. Manual Export Pack title: removed "Phase H.1 —" prefix; badge → "Production Ready".
  5. Approval hint: replaced hardcoded Vị Cuốn/product text with `activeCampaign.brief.heroProduct` and `activeCampaign.brief.brandName`.
  6. Added "How to Use This Workspace" owner/client guide card (6 steps, emerald) on Dashboard.
  7. Renamed existing guide to "Presenter Walkthrough Guide", updated step 4 to "Client Workspace View".
  8. Pitch text in demo-pack tab now uses dynamic brand name and hero product.
  9. Brand gallery "Current (H.5)" → "Current (H.6)"; service packages "Client Demo Mode" → "Client Workspace View".
- **Safety Guard H.6 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Build:** `npm run build` PASS — 0 errors.
- **Trạng thái Phase H.6:** ✅ DONE + BUILT + PUSHED (initial)

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 Codex Review Round 1 + Fix
- **Sự kiện:** Codex review Phase H.6.
- **Kết quả:** NEEDS FIX — visible demo/mock wording in 5 required locations.
- **Fixes applied:** Commit `4d2f3bd` — fix: align phase h6 workspace wording.
  - `Demo/Mock Data Only` → `Sample Data Only`
  - `Mock Pricing — Demo Only` → `Sample Pricing — Sandbox Mode`
  - `Demo/mock only` → `Sample data only`
  - `Approval Status Demo` → `Approval Status Preview`
  - `Every output is demo/mock data only` → `...sample data only until live connectors are approved`
  - `Sales Demo Script` → `Presenter Walkthrough Script`
  - `client-facing demo script` → `client workspace walkthrough`
  - Copy text: `SALES DEMO SCRIPT`, `fill demo data`, `That's the full demo` → workspace equivalents
- **Build:** `npm run build` PASS — 0 errors.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 Codex Review Round 2 + Fix
- **Sự kiện:** Codex re-review Phase H.6 — 15 additional visible demo/mock strings found.
- **Fixes applied:** Commit `c7b4f7d` — fix: remove remaining h6 demo wording.
  - `Mock Data` dashboard badge → `Sample Data`
  - `Mock Ad Units` → `Sample Ad Units`
  - `demo mock-up` disclaimer → `sandbox minh họa`
  - `Offline Mock-up` → `Offline Sandbox`
  - `Mock workspace only` → `Sandbox Safe Mode`
  - `White-label demo` → `White-label workspace`
  - `dữ liệu demo giả lập` → `dữ liệu mẫu`
  - `(mock est.)` → `(sample est.)`
  - `Mock Estimate — Demo Only` → `Sample Estimate — Sandbox Only`
  - `phục vụ demo` → `phục vụ minh họa`
  - `mock ads` / `mock ad copy units` → `sample ads` / `sample ad copy units`
  - `Mock data` export badge → `Sample data`
- **Build:** `npm run build` PASS — 0 errors.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 CLOSED
- **Sự kiện:** Đóng Phase H.6 — Client-ready Workspace Polish.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex re-review:** PASS — all fixes applied, build PASS, git clean.
- **Commits:** `95dfeee` (feat: polish phase h6), `4d2f3bd` (fix: round 1), `c7b4f7d` (fix: round 2).
- **Note:** H.6 polished the app into a more client-ready AI Marketing Team Workspace. Visible product wording was corrected from demo/mock framing to Workspace, Sample Data, Sandbox Safe Mode, Client Presentation Pack, and Client Workspace View. Owner/client guide flow and approval-safe framing are now clearer.
- **Trạng thái Phase H.6:** ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK

### 🗓️ Ngày 05/06/2026 — Phase H.7: Owner View + Client View
- **Sự kiện:** Triển khai Phase H.7 — Owner View + Client View.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Hành động đã hoàn tất:**
  1. `Eye` icon thêm vào lucide-react imports.
  2. `viewMode` state (`'owner' | 'client'`, default `'owner'`) + `handleViewModeSwitch()` handler.
  3. Header: phase badge H.6 → H.7, segmented toggle (🔧 Owner View | 👁 Client View).
  4. Sidebar: 4 tabs ẩn trong Client View (New Campaign Brief, AI Team Board, Manual Export Pack, Client Workspace View).
  5. Sidebar: Safety Guard → Trust & Safety trong Client View (ẩn FnB OS V1, Secrets, Connectors labels).
  6. Dashboard: View context card (indigo cho Owner, emerald cho Client) với quick-switch button.
  7. Auto-redirect về Dashboard khi switch sang Client View từ owner-only tab.
- **Safety Guard H.7 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Build:** `npm run build` PASS — 0 errors. 342.52 kB JS bundle.
- **Trạng thái Phase H.7:** ✅ DONE + BUILT + PUSHED (initial)

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.7 Codex Review + Fix
- **Sự kiện:** Codex review Phase H.7.
- **Kết quả:** NEEDS FIX — Client View still exposing internal technical clutter in 2 locations.
- **Fix applied:** Commit `2037f61` — fix: clean h7 client view technical wording.
  - Brand Workspace connector boundary: conditional render — Owner View keeps technical arch notes; Client View shows "🛡️ Workspace Scope" with client-facing trust language (sample data, approval required, live connectors in future approved phase).
  - Presentation & Export step 06 Safety Boundaries body: conditional — Owner View keeps "100% offline sandbox / no backend / no database" internal text; Client View uses "Sample Data only / Approval Required / No Live Publishing" language.
  - Stale "Current (H.6)" label → "Current (H.7)" fixed.
- **Build:** `npm run build` PASS — 0 errors. 343.60 kB JS.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.7 CLOSED
- **Sự kiện:** Đóng Phase H.7 — Owner View + Client View.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex re-review:** PASS — fix applied, build PASS, git clean.
- **Commits:** `9dc235a` (feat: add phase h7 owner and client views), `2037f61` (fix: clean h7 client view technical wording).
- **Note:** H.7 added Owner View and Client View inside the same AI Marketing Team Workspace. Owner View keeps internal review/control information, while Client View is cleaner for client presentation and hides internal technical clutter. Client View now uses trust/scope wording such as Sample Data, Approval Required, No Live Publishing, and No Real Ads unless approved.
- **Trạng thái Phase H.7:** ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK

