# Export Pack Foundation — Phase 12

## Overview

Export Pack gom dữ liệu campaign thành bộ xuất nội dung phục vụ team/client.  
Format hiện tại: **local text/markdown/plain-text/JSON preview** — không có PDF thật, không upload, không gửi email.

---

## Data Model

```
LocalExportPack {
  id:          string       — prefixed "exp-"
  client_id:   string | null
  brand_id:    string | null
  campaign_id: string | null
  export_type: ExportPackType
  title:       string
  format:      ExportPackFormat
  status:      ExportPackStatus
  content:     string       — generated text content
  created_at:  string
  updated_at:  string
}
```

### ExportPackType values
| Value | Label | Client-safe |
|---|---|---|
| `campaign_summary` | Campaign Summary | ✅ |
| `content_calendar` | Content Calendar | ❌ internal |
| `approved_content` | Approved Content Pack | ✅ |
| `client_report` | Client Report Summary | ✅ |
| `asset_checklist` | Asset Checklist | ❌ internal |
| `full_campaign_pack` | Full Campaign Pack | ❌ internal |

### ExportPackFormat values
- `markdown` — full markdown with headers, bold, lists
- `plain_text` — stripped markdown, bullet points
- `json_preview` — JSON envelope wrapping the markdown

### ExportPackStatus values
- `draft` → `generated` → `copied` → `archived`

---

## Architecture

```
ExportPackTab (UI)
  └── exportPackGenerator.ts (logic)
        └── generateExportPack()
              ├── buildCampaignSummary()
              ├── buildContentCalendar()
              ├── buildApprovedContent()
              ├── buildClientReport()    → calls generateLocalReport()
              ├── buildAssetChecklist()
              └── buildFullCampaignPack() → combines all 5 sections
```

Storage key: `core_agency_export_pack_data_v1` (max 50 most recent packs)

---

## Export Content Detail

### 1. Campaign Summary (`campaign_summary`)
- Client info (name, contact, status, notes)
- Brand profile (name, industry, hero product, tone, channels)
- Campaign details (name, description, type, duration, period, status, budget)
- Brief summary (title, goal, product focus, offer, tone, audience, pillars, must include/avoid, approvals)

### 2. Content Calendar (`content_calendar`)
- All content items for the campaign, sorted by planned_date / day_number
- Per item: date/channel, type, status, pillar, hook, caption, visual brief, CTA, hashtags
- Internal-only fields (NOT shown to client/viewer): angle, owner_note, publish_note, scheduled_time

### 3. Approved Content Pack (`approved_content`)
- Only content items with `status = 'approved'`
- Per item: hook, caption, visual brief, CTA, hashtags
- No internal fields — client-safe

### 4. Client Report Summary (`client_report`)
- Uses `generateLocalReport()` from reportGenerator.ts with `report_type: 'client_summary'`
- Includes: campaign period, content production summary, overall progress, asset library, next steps
- No real platform analytics — clearly labeled

### 5. Asset Checklist (`asset_checklist`)
- All assets in scope (filtered by campaign/brand/client)
- Per asset: name, type, approval status, source, file info, usage rights, tags, linked campaign
- Internal-only: raw `notes` field hidden from client/viewer

### 6. Full Campaign Pack (`full_campaign_pack`)
- Sections 1–5 combined with `===` dividers

---

## Permission Model

| Action | Roles |
|---|---|
| View Export Pack tab | owner, manager, client |
| Generate export | owner, manager |
| View-only | client, viewer |
| Client-safe types only | client, viewer |
| All types | owner, manager |

Client/viewer roles: see only `campaign_summary`, `approved_content`, `client_report`.  
Internal data (calendar details, asset notes, job IDs, owner notes) are stripped from client-safe exports.

---

## Safety / Governance

Export Pack does NOT:
- Upload files to any service
- Send email
- Post to social media
- Schedule content
- Call any AI/external API
- Create real PDF/DOCX (Phase 12 is text/markdown only)

Export Pack always shows the disclaimer:
> "Export pack is prepared from Core workspace data. Export does not publish content. Approved content is NOT automatically published. Usage rights must be checked before publishing."

---

## Component: ExportPackTab

Location: `src/components/core/ExportPackTab.tsx`

Props:
```tsx
interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  genData: GenerationDataStore;
  approvalData: ApprovalDataStore;
  assetData: AssetDataStore;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}
```

UI sections:
1. Safety banner (always visible)
2. Header with phase badge + history toggle
3. History panel (last 50 packs)
4. Left: Configure panel (scope → export type → format → Generate button)
5. Right: Preview panel (pack meta, preview textarea, copy button, regenerate, governance note)

Copy to clipboard: `navigator.clipboard.writeText()` with fallback to select textarea.

---

## Phase 12 Status

| Criterion | Status |
|---|---|
| Export Pack tab visible in sidebar | ✅ |
| Client/brand/campaign scope selector | ✅ |
| Export type selector (role-gated) | ✅ |
| Format selector (markdown/plain_text/json_preview) | ✅ |
| Generate button (owner/manager only) | ✅ |
| Preview content | ✅ |
| Copy to clipboard with fallback | ✅ |
| Regenerate button | ✅ |
| History panel (50 packs) | ✅ |
| Full campaign pack aggregation | ✅ |
| Client-safe export filtering | ✅ |
| No internal logs in client exports | ✅ |
| No file upload | ✅ |
| No email sending | ✅ |
| No auto-post | ✅ |
| Safety banner | ✅ |
| Permission gate | ✅ |
| Build pass | ✅ |

---

## Next Phase
Phase 13 — Connector Registry + Module Event Inbox Foundation
