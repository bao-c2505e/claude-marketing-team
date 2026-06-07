# Content Calendar Foundation — Phase 7

## Overview

The Content Calendar is a planning-only view that lets the team view, filter, and manage content items generated from Phase 6 (Content Generation). It is **not** a publishing tool.

## Architecture Position

```
Client → Brand → Campaign → Brief → Generation Job → Content Items → [Content Calendar]
```

The Content Calendar reads from the same `GenerationDataStore` (localStorage key: `core_agency_gen_data_v1`) that Phase 6 writes to. It never creates new generation jobs — it only manages metadata on existing `ContentPlanItem` records.

## Data Model

### ContentPlanItem (extended in Phase 7)

All new fields are optional with `null` defaults for backward compatibility:

| Field | Type | Description |
|---|---|---|
| `scheduled_time` | `string \| null` | Optional HH:MM time within planned_date |
| `publish_note` | `string \| null` | Note for manual publisher reference |
| `owner_note` | `string \| null` | Internal team note |
| `last_moved_at` | `string \| null` | ISO timestamp of last date reschedule |

### CalendarSafeStatus (Phase 7 editable statuses)

Only these statuses can be set via the Calendar:

- `generated`
- `needs_review`
- `revision_requested`
- `rejected`
- `archived`

**Not available in Phase 7:**
- `approved` — requires Phase 8 Approval Workflow
- `scheduled` — requires Approval + publish pipeline
- `published` — owner-only after full approval

## Component

**File:** `src/components/core/ContentCalendarTab.tsx`

### Props

```typescript
{
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  generationJobs: ContentPlanJob[];
  onUpdate: (updated: GenerationDataStore) => void;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
}
```

### Permissions

| Action | Allowed Roles |
|---|---|
| View calendar | owner, manager, client, viewer |
| Edit metadata (date/channel/note/status) | owner, manager |
| Set approved/scheduled/published | NOT available in Phase 7 |

### Features

- **Filter bar**: client → brand → campaign (cascading), channel, status
- **Day-grouped list**: sorted by `planned_date`, items grouped per date
- **Item card**: collapsed row showing day number, date, channel, hook preview, caption preview, status badge
- **Expanded detail**: full caption, visual brief, hashtags, CTA, angle, pillar, approval note
- **Edit panel**: safe-field edit (date, time, channel, owner_note, publish_note, status)
- **Safety banner**: always visible, clearly states planning-only constraints
- **Empty states**: no content generated / no filter match

## Helper Functions (coreData.ts)

```typescript
// Patch a single ContentPlanItem in GenerationDataStore
function updateContentItemInStore(
  store: GenerationDataStore,
  itemId: string,
  patch: CalendarItemPatch,
): GenerationDataStore

// Safe statuses Phase 7 can set
const CALENDAR_SAFE_STATUSES: CalendarSafeStatus[]
```

## Safety Rules

- Calendar is **planning only**. No publish action exists.
- Setting `approved`, `scheduled`, or `published` is blocked at the UI level.
- All items display a permanent approval note reminder.
- Safety banner is always visible, cannot be dismissed.

## Integration (App.tsx)

```
Sidebar: ... → Brief Intake → Content Generation → Content Calendar → Workspace
Route: activeTab === 'content-calendar'
```

## Storage

Uses the same `GenerationDataStore` from `core_agency_gen_data_v1` in localStorage. When Supabase is configured, this can be swapped for real CRUD (deferred to post-Phase 8).

## Next Phase

**Phase 8 — Approval Workflow Foundation**

Will add:
- Submit for approval flow
- Approval request CRUD
- Review/approve/reject/revision_requested transitions
- Approved status becomes settable (via approval record, not direct edit)
