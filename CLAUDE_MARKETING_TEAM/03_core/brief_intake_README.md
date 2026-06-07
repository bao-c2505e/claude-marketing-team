# Brief Intake Foundation — Phase 5

Phase 5 adds the **Brief Intake** module to The Core Agency Real Operations MVP. Briefs are the input layer before AI content generation (Phase 6+).

---

## Data Model

```
Campaign
  └── CampaignBrief (1:1 per campaign)
        ├── Core: brief_title, campaign_goal, product_focus, offer
        ├── Audience: target_audience, channels, tone_of_voice
        ├── Content Strategy: content_pillars, key_messages
        ├── Constraints: must_include, must_avoid, competitors, reference_links
        └── Admin: budget_note, timeline_note, approval_requirements, status
```

**Storage:** localStorage key `core_agency_core_data_v1` (`.briefs` field added to `CoreDataStore`).

**Status state machine:**
```
draft → ready_for_generation → approved_for_generation
                            ↘ needs_revision → draft
                                                    ↘ archived
```

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/types/core.ts` | Added `BriefStatus` union type; extended `CampaignBrief` with 15 new fields |
| `src/lib/core/coreData.ts` | Added `BriefFormData`, `SEED_BRIEFS` (3), extended `CoreDataStore` with `briefs`, added `BRIEF_STATUS_LABEL/COLOR/EMPTY_BRIEF_FORM` helpers |
| `src/components/core/BriefIntakeTab.tsx` | NEW — Full brief management UI: list, create, edit, detail, status transitions |
| `src/components/core/ClientsTab.tsx` | Added `briefs` prop; pass-through to `onUpdate` |
| `src/components/core/BrandsTab.tsx` | Added `briefs` prop; pass-through to `onUpdate` |
| `src/components/core/CampaignsTab.tsx` | Added `briefs` prop; pass-through to `onUpdate` |
| `src/App.tsx` | Imported `BriefIntakeTab`, `ClipboardList`; added Brief Intake sidebar button + tab rendering; phase badge → Phase 5 |

---

## BriefIntakeTab Features

- **List view**: filter by client/brand/campaign/status; brief cards with `StatusBadge`; "Mark Ready" quick-action; "Campaigns without a brief" helper panel
- **Detail view**: all fields displayed; status transition buttons (owner/manager); disabled "Generate — Phase 6" placeholder button
- **Create/Edit form**: grouped into 5 sections (Campaign Selection, Core Brief, Content Strategy, Constraints & Safety, Admin & Approval); auto-populate brand defaults; required field validation
- **Safety notice**: "Brief = Input only. Generation requires Phase 6. Generated ≠ Approved. Approved ≠ Published. No auto-post."

---

## Permissions

| Action | Permission |
|--------|-----------|
| View briefs | all roles |
| Create / edit brief | `can.createCampaigns` OR `can.generateContent` |
| Approve / mark ready | `can.approveContent` (owner/manager) |

---

## Seed Data

| Brief | Campaign | Status |
|-------|----------|--------|
| `brief-vi-cuon-he` | Hè 2026 — Cuộn Cá Hồi | `draft` |
| `brief-com-tam-menu` | Menu Cơm Tấm Mới | `ready_for_generation` |
| `brief-forme-f1` | Forme F1 Launch | `approved_for_generation` |

---

## Safety Guard (Phase 5)

- Auto-post: NO
- Real Ads: NO
- Real Messaging: NO
- Secrets Added: NO
- Service Role Key in Frontend: NO
- "Generate" button: DISABLED (label: "Generate — Phase 6")
- Generated ≠ Approved ≠ Published: ENFORCED
- Build Pass: YES (tsc + vite, 0 errors, ~634KB bundle)
