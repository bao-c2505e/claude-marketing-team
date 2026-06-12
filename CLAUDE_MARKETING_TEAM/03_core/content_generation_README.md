# Phase 6 — Content Generation Foundation

## Overview

Deterministic mock content generation from approved briefs. No real AI API calls. No auto-post. No real ads.

**Chain**: Brief (`approved_for_generation`) → Generate → `ContentPlanJob` + `ContentPlanItem[]`

---

## Files Changed / Created

| File | Change |
|---|---|
| `src/types/core.ts` | Added Phase 6 types: `ContentPlanJobStatus`, `GenerationMode`, `PlanLengthDays`, `ContentItemStatus6`, `ContentPlanJob`, `ContentPlanItem` |
| `src/lib/core/coreData.ts` | Added `GenerationDataStore`, `loadGenerationData()`, `saveGenerationData()`, display helpers |
| `src/lib/core/contentGenerator.ts` | Created — deterministic mock generator |
| `src/components/core/ContentGenerationTab.tsx` | Created — full generation UI (list + detail) |
| `src/components/core/BriefIntakeTab.tsx` | Added `onNavigateToGenerate` prop; enabled Generate button for approved briefs |
| `src/App.tsx` | Added `Wand2` import, `ContentGenerationTab` import, generation state, sidebar button, tab rendering; phase badge → Phase 6 |

---

## Data Model

### ContentPlanJob
```
id, brief_id, campaign_id, brand_id, client_id,
plan_length_days: 7 | 15 | 30,
generation_mode: 'mock' | 'ai_ready' | 'external_module',
status: 'draft' | 'queued' | 'generating' | 'completed' | 'failed' | 'archived',
item_count, requested_by, created_at, updated_at, completed_at, error_message
```

### ContentPlanItem
```
id, generation_job_id, brief_id, campaign_id, brand_id, client_id,
day_number, planned_date, channel, content_type, pillar, angle,
hook, caption, visual_brief, cta, hashtags,
status: 'needs_review' (default — never auto-approved/published),
created_at, updated_at
```

---

## Storage Strategy

Separate `GenerationDataStore` with key `core_agency_gen_data_v1` — isolated from `CoreDataStore` (`core_agency_core_data_v1`). This avoids cascade TypeScript prop changes to all existing tabs.

---

## Generator Logic (`contentGenerator.ts`)

- **Input**: `CampaignBrief` (approved) + `PlanLengthDays` (7/15/30) + optional `requestedBy`
- **Output**: `{ job: ContentPlanJob, items: ContentPlanItem[] }`
- **ContentAngles** (7, cycling): `product_showcase`, `social_proof`, `behind_scenes`, `edu_tip`, `offer_urgency`, `lifestyle_aspiration`, `brand_story`
- **Templates**: Vietnamese content with brand/product/offer/key_messages context from brief
- **Industry-aware CTA**: F&B vs premium furniture vs default
- **Per-channel visual briefs**: Facebook, Instagram, TikTok, YouTube
- **Job mode**: always `'mock'` (no real AI)
- **Item status**: always `'needs_review'` (safety invariant)

---

## Permission Integration

| Action | Required Role |
|---|---|
| View content generation tab | `can.viewContent` — owner, manager, client, viewer |
| Generate content plan | `can.generateContent` — owner, manager only |
| Enable Generate button in Brief Intake | `canEdit` + `onNavigateToGenerate` provided + brief is `approved_for_generation` |

---

## Safety Invariants

- `Generated ≠ Approved. Approved ≠ Published.`
- Default item status: `needs_review` — never changes on creation
- No AI API calls. No auto-post. No auto-ads. No real messaging.
- No secrets/API keys hardcoded.
- Supabase service role key never used in frontend.
- Safety banner visible in both list and detail views.

---

## UX

- **List view**: approved briefs at a glance, generate form (brief selector + plan length 7/15/30), job history table
- **Detail view**: job summary card, expandable content items (hook → caption → visual brief → CTA → hashtags)
- **Navigation**: Brief Intake "Generate Content" button navigates directly to Content Generation tab with brief pre-selected
- Mock/safety labels visible throughout

---

## Phase 7 Recommendation

**Content Calendar Foundation** — assign approved content items to calendar dates, view by week/month, channel filter.
