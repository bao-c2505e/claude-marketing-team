# Phase H.5 Handoff — Multi-brand Workspace Readiness

## 📌 Phase Info
- **Phase:** H.5 — Multi-brand Workspace Readiness
- **Status:** IN PROGRESS → pending build + Codex review
- **Date started:** 2026-06-05
- **Builder:** Claude Code

---

## 🎯 Goal

Upgrade the workspace from single-brand (Vị Cuốn only) to a multi-brand AI Marketing Team Workspace that:
- Supports 3 seed brand workspaces out of the box
- Feels like a real workspace, not a one-time presentation
- Uses sample/seed data safely until real connectors are approved in Phase I
- Makes the multi-brand capability obvious within 5 seconds of opening

---

## 🔑 Key Framing Rule

**Do NOT frame as "demo workspace" or "demo toy."**
Use: Workspace, Brand Workspace, Campaign Workspace, Sample Data, Seed Data, Sandbox Safe Mode, Preview Mode.
This is a real workspace architecture prepared for future real data and connectors.

---

## 🏗️ What Was Built

### 1. mockData.ts — 3 Seed Brand Workspaces

| Brand | ID | Industry | Hero Product | Location |
|-------|----|----------|--------------|----------|
| Vị Cuốn | CAMP-VICUON-001 | F&B / street food premium | Bánh tráng cuốn heo quay | TP. Vinh, Nghệ An |
| Cơm Tấm Bản Khói | CAMP-COMTAM-001 | F&B / cơm tấm / quán địa phương | Cơm tấm sườn bì chả | TP.HCM — Quận Bình Thạnh |
| Forme | CAMP-FORME-001 | Nội thất cao cấp / premium furniture | Sofa da Series F-1 | TP.HCM + Hà Nội |

Each brand has:
- `brief`: All 13 fields (brandName, industry, heroProduct, pricing, targetCustomer, location, goal, duration, offer, channels, toneOfVoice, exclusions, assets)
- `calendar`: 7 days (Day 1–7, theme, channel, content, visual, cta, approval)
- `checklist`: 10 items (brand voice, product info, price integrity, visual, caption, ads, no-autopost, no-real-ads, no-real-messaging, human-approval)
- `outputs.copywriter`: slogans[], hooks[], ctas[], shortCaptions[], hashtags[], captions[]
- `outputs.videoEditor`: scripts[] (2–3 scripts, 3 scenes each)
- `outputs.designer`: briefs[] (2 briefs with layout, textOverlay, prompt, visualDirection, colorStyleNote)
- `outputs.adsManager`: angles[], objectives[], adSets[], testIdeas[], mockAds[]
- `outputs.dataReporter`: metrics[], audienceBreakdown[], recommendations[], kpiAssumptions[], reportTemplate

### 2. src/App.tsx Changes

- **Import**: Added `Store` from lucide-react
- **localStorage**: key bump `_v2` → `_v3` (force fresh load). Legacy `_v2` keys removed in cleanup useEffect.
- **Header badge**: "Phase H.5 — Multi-brand Workspace Readiness"
- **Sidebar**:
  - New tab: "Brand Workspace" (Store icon) — positioned 2nd after Dashboard
  - "Active Campaign" label → "Active Brand"
- **Dashboard**:
  - New Brand Switcher section at the TOP (before stats grid)
  - Shows all campaign brands as compact cards
  - 1-click brand activation
  - "Sandbox Safe Mode" badge
- **New tab `brand-gallery`** (Brand Workspace Gallery):
  - Full brand cards in responsive grid
  - Each card: name, industry, hero product, target customer, location, channels, campaign goal, AI output counts
  - Workspace status per brand (Auto-post: OFF, Real Ads: OFF, Approval Required: YES)
  - "Select Brand →" button (or "Currently Active Workspace" if active)
  - Phase I connector boundary section: Current vs Future vs Never
- **Client Demo Mode updates**:
  - Campaign Overview: brandName, heroProduct, industry, channels now dynamic via `activeCampaign.brief.*`
  - Campaign description: dynamic `activeCampaign.brief.goal`
  - AI Team Workspace cards: "Sample Output" with counts from `activeCampaign.outputs.*`

---

## 🛡️ Safety Guard (H.5)

| Check | Status |
|-------|--------|
| Auto-post | NO |
| Real Ads launched | NO |
| Real Messaging | NO |
| Real Connectors | NO |
| Secrets/API keys | NO |
| FnB OS V1 touched | NO |
| Backend added | NO |
| Database added | NO |
| Real API | NO |
| Sample/Seed Data Only | YES |
| Human Approval Required | YES (all outputs) |

---

## 📋 Human Approval Checklist (H.5)

- [ ] Owner: visual inspection of Brand Workspace Gallery (3 brands visible)
- [ ] Owner: brand switcher on Dashboard works for all 3 brands
- [ ] Owner: Campaign Outputs tab shows correct data per brand
- [ ] Owner: Client Demo Mode shows dynamic brand info
- [ ] Owner: Vị Cuốn workspace still intact
- [ ] Owner: Safety labels present and correct
- [ ] Codex: code review pass

---

## ⚠️ What Is NOT Connected

- No real Facebook/Meta Ads connector
- No real Zalo OA connector
- No real Instagram connector
- No real Canva connector
- No real Google Drive connector
- No real n8n workflow
- No backend, no database, no authentication
- No real auto-post capability
- All data is sample/seed data — must be replaced with real brand data before external use

---

## 🔜 Phase I Connector Boundary (Future)

Phase I will add real connectors (pending Owner approval):
- Real brand brief input form with data persistence
- Meta Ads API sandbox connector
- Canva API connector
- Google Drive export connector
- n8n workflow integration
- All still with mandatory human approval before execution

**Phase I will NOT start until Owner explicitly approves.**
