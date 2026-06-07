# CURRENT PHASE — Phase 12: Export Pack Foundation ✅ DONE

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 12 — Export Pack Foundation
- **Mục tiêu:** Tạo nền tảng Export Pack để gom dữ liệu campaign thành bộ xuất nội dung phục vụ team/client.
- **Trạng thái:** ✅ DONE — ExportPackTab, exportPackGenerator, types extended, coreData extended, App wired, build pass.

---

## 📋 Checklist Phase 12

### Data Layer
- [x] `src/types/core.ts` — added `ExportPackType` (6 values), `ExportPackFormat` (3 values), `ExportPackStatus` (4 values), `LocalExportPack` interface.
- [x] `src/lib/core/coreData.ts` — added `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()` (max 50 packs). Storage key: `core_agency_export_pack_data_v1`. Updated import to include `LocalExportPack`.

### Export Logic
- [x] `src/lib/core/exportPackGenerator.ts` — NEW
  - [x] `generateExportPack()` — main entry point
  - [x] `buildCampaignSummary()` — client + brand + campaign + brief
  - [x] `buildContentCalendar()` — all content items with internal fields gated
  - [x] `buildApprovedContent()` — approved items only (client-safe)
  - [x] `buildClientReport()` — calls `generateLocalReport()` from reportGenerator
  - [x] `buildAssetChecklist()` — all assets, internal notes gated
  - [x] `buildFullCampaignPack()` — combines all 5 sections with `===` dividers
  - [x] `formatContent()` — markdown / plain_text / json_preview
  - [x] `CLIENT_SAFE_EXPORT_TYPES` — campaign_summary, approved_content, client_report
  - [x] All section builders: empty state messages if no data found
  - [x] Disclaimer block in every section
  - [x] No AI API calls. No external service calls. No file upload.

### Components
- [x] `src/components/core/ExportPackTab.tsx` — NEW
  - [x] Safety banner (always visible)
  - [x] Header: phase badge + history toggle
  - [x] History panel: last 50 generated packs, load previous pack
  - [x] Configure panel: client → brand → campaign (cascading), export type selector (role-gated), format selector
  - [x] Generate button: `canExportPacks(role)` gate, disabled for viewer/client
  - [x] Preview panel: pack meta, textarea (monospace), copy-to-clipboard, clipboard fallback note
  - [x] Regenerate button
  - [x] Governance reminders note
  - [x] Permission gate: `canViewExportPacks(role)` required

### App Shell
- [x] `src/App.tsx` — updated
  - [x] Import `Package` icon from lucide-react
  - [x] Import `ExportPackTab`
  - [x] Sidebar "Export Pack" button (under Reports in Core section)
  - [x] Tab routing `export-pack`
  - [x] Phase badge → "Real Operations MVP — Phase 12"

### Docs
- [x] `CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`

### Safety
- [x] No secrets in source
- [x] No auto-post / auto-ads / auto-message
- [x] No file upload to external service
- [x] No email sending
- [x] No AI/external API calls
- [x] No PDF/DOCX generation (local text only)
- [x] Safety banner always visible in ExportPackTab
- [x] Client-safe exports strip: content_calendar, asset_checklist, full_campaign_pack, and internal fields (angle, owner_note, publish_note, asset.notes)
- [x] Build pass

---

## 🗂️ Export Chain Quick Reference

```
ExportPackTab (scope selector)
  └── generateExportPack()
        ├── campaign_summary    → client + brand + campaign + brief
        ├── content_calendar   → all items (internal fields stripped for client)
        ├── approved_content   → status=approved items only (client-safe)
        ├── client_report      → reportGenerator.generateLocalReport()
        ├── asset_checklist    → asset inventory (notes stripped for client)
        └── full_campaign_pack → all 5 sections combined
```

**Storage:** localStorage key `core_agency_export_pack_data_v1` (max 50 packs)  
**Permission:** `canExportPacks` = owner/manager | `canViewExportPacks` = owner/manager/client  
**Formats:** markdown / plain_text / json_preview  
**Next phase (13):** Connector Registry + Module Event Inbox Foundation

---

## 🛡️ Safety Guard (Phase 12)
- Auto-post: NO
- Real Ads: NO
- Real Messaging: NO
- Real Connectors: NO
- Secrets Added: NO
- Service Role Key in Frontend: NO
- File Upload: NO
- Email Sending: NO
- AI API Calls: NO
- Build Pass: YES (0 errors)

---

## 📝 Closeout Note
Phase 12 adds the Export Pack layer. Users can select campaign scope, choose export type, generate local markdown/text/JSON export, preview and copy to clipboard. Client-safe export types restrict internal data. Full campaign pack aggregates all 5 sections. No files are uploaded, no emails sent, no AI called. Approved content remains NOT published until a separate publish action (future phase).

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
| Phase 10 | Asset Library Foundation | (committed) |
| Phase 11 | Report Module Foundation | 6e15e25 |
| Phase 12 | Export Pack Foundation | (this phase) |
