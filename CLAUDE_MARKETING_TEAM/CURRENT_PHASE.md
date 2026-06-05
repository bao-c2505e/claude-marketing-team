# CURRENT PHASE — Phase H.7: Owner View + Client View ✅ DONE

Tài liệu này dùng để theo dõi tiến độ thực hiện và trạng thái của Phase hiện tại.

## 📌 Thông tin chung
- **Phase hiện tại:** Phase H.7 — Owner View + Client View
- **Mục tiêu:** Thêm two-mode workspace experience: Owner/Internal View để quản lý AI Marketing Team workspace, và Client/Presentation View để trình bày campaign cho khách hàng mà không có technical clutter nội bộ.
- **Trạng thái:** ✅ DONE + BUILT + PUSHED

---

## 📋 Checklist Phase H.7

### Mode Switch Toggle
- [x] `viewMode` state (`'owner' | 'client'`) added
- [x] `handleViewModeSwitch()` function — auto-redirects to dashboard when switching to Client View if current tab is owner-only
- [x] Toggle in header (right side, alongside phase badge): 🔧 Owner View | 👁 Client View
- [x] Active mode visually highlighted (indigo = Owner, emerald = Client)

### Owner View (default)
- [x] All 9 tabs visible: Dashboard, Brand Workspace, New Campaign Brief, AI Team Board, Campaign Outputs, Approval Checklist, Client Presentation Pack, Client Workspace View, Manual Export Pack, Presentation & Export
- [x] Full Safety Guard sidebar (Auto-post, Real Ads, Real Message, Real Connectors, Secrets, FnB OS V1, Sample Data)
- [x] Dashboard shows Owner View context card (indigo) with "Switch to Client View" button

### Client View
- [x] 4 owner-only tabs hidden: New Campaign Brief, AI Team Board, Manual Export Pack, Client Workspace View
- [x] 6 tabs remain: Dashboard, Brand Workspace, Campaign Outputs, Approval Checklist, Client Presentation Pack, Presentation & Export
- [x] Sidebar Safety Guard simplified to Trust & Safety: Sample Data, Approval Required, No Live Publishing, No Real Ads
- [x] Dashboard shows Client View context card (emerald) with "Back to Owner View" button
- [x] Auto-redirect to Dashboard if active tab is owner-only when switching to Client View

### Dashboard View Context Card
- [x] Owner View card: "Manage brands, review AI outputs, run approval, configure campaigns. Switch to Client View before presenting."
- [x] Client View card: "Present campaign plan and outputs to your client. Internal tools hidden. Sample data — approval required before export."

### Safety Labels (preserved in both views)
- [x] Sample Data ✅ (shown in both views)
- [x] Approval Required ✅ (shown in both views)
- [x] No Auto-post ✅
- [x] No Real Ads ✅
- [x] No Live Publishing ✅

### Build & Safety
- [x] npm run build PASS — 0 errors (342.52 kB JS)
- [x] Push to GitHub
- [x] No backend/database/API/secrets/connectors added
- [x] FnB OS V1 not touched

### Docs & Logs
- [x] CURRENT_PHASE.md (file này)
- [x] SESSION_SUMMARY.md
- [x] phase_log.md
- [x] agent_activity_log.md

---

## 🔀 View Mode Spec

| Aspect | Owner View | Client View |
|--------|-----------|-------------|
| Purpose | Manage, review, approve | Present campaign, collect feedback, export |
| Tabs shown | All 9 tabs | 6 tabs (internal tools hidden) |
| Safety sidebar | Full Guard (7 items) | Trust & Safety (4 items, client-friendly) |
| New Campaign Brief | ✅ Visible | ❌ Hidden |
| AI Team Board | ✅ Visible | ❌ Hidden |
| Manual Export Pack | ✅ Visible | ❌ Hidden |
| Client Workspace View | ✅ Visible | ❌ Hidden |
| Technical labels | FnB OS V1, Secrets, Connectors visible | Hidden |
| Brand switching | ✅ Available | ✅ Available |

---

## 🛡️ Safety Guard (H.7 — confirmed)
- Auto-post: NO
- Real Ads: NO
- Real Messaging: NO
- Real Connectors: NO
- Secrets Added: NO
- FnB OS V1 Touched: NO
- Backend added: NO
- Database added: NO
- Real API: NO
- Sample/Seed Data Only: YES

---

## 📝 Closeout Note
H.7 adds a two-mode workspace experience. Owner View keeps all internal controls visible; Client View presents a clean campaign view with internal tools and technical clutter hidden. The toggle sits in the header for instant access. Switching to Client View while on an owner-only tab automatically redirects to Dashboard. Multi-brand switching and all 3 seed brands remain fully functional.

---

## ✅ Phase H.6 (tiền nhiệm) — CLOSED
- Commit: `1f83eb1` — docs: close phase h6 client ready workspace polish
- Status: DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK

## ✅ Phase H.5 (tiền nhiệm) — CLOSED
- Commit: `45c141a` — docs: close phase h5 multi brand workspace readiness
- Features: 3 seed brands (Vị Cuốn, Cơm Tấm Bản Khói, Forme), Brand Workspace Gallery, Brand Switcher, localStorage v3
