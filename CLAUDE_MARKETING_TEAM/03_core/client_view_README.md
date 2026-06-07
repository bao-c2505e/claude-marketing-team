# Client View Foundation — Phase 9

## Overview

Phase 9 adds the **Client Portal** — a client-facing read-only + limited-action view of campaign content.
Clients can view approved/pending content and leave feedback. They cannot publish, schedule, approve internally, or see workspace internals.

## Architecture Position

```
Content Items (approved/needs_review/revision_requested)
  → [Client Portal] → client sees clean content cards + approval status
  → [Add Feedback] → comment stored in ApprovalDataStore (is_internal=false)
  → [Internal review] → manager/owner acts in Approvals tab
  → (Phase 10+) publishing gate
```

## Component — ClientViewTab (src/components/core/ClientViewTab.tsx)

### Props
```typescript
{
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  genData: GenerationDataStore;
  onApprovalUpdate: (approval: ApprovalDataStore, gen: GenerationDataStore) => void;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}
```

### Views
1. **Campaign selector** — choose campaign to preview client view
2. **Campaign overview card** — brand name, brief title, campaign goal, dates, channels, status
3. **Content summary stats** — Approved / Pending Review / Revision Requested counts
4. **Content item list** — client-friendly cards with expand/collapse

### Client-Visible Content Statuses
| Internal Status | Client Label | Color |
|---|---|---|
| `approved` | Approved | Emerald |
| `needs_review` | Pending Review | Amber |
| `generated` | Pending Review | Amber |
| `revision_requested` | Revision Requested | Orange |

Hidden from client: `rejected`, `archived`, `failed`, `draft`, `scheduled`, `published`

### Content Card — Client-Facing Fields
Shown:
- Day number badge
- Planned date
- Channel
- Content type
- Hook
- Caption (full, expanded)
- Visual Direction (visual_brief)
- Call to Action (cta)
- Hashtags

NOT shown (internal only):
- owner_note
- angle
- pillar
- generation job ID / internals
- automation logs
- developer labels

### Client Actions (Phase 9)

| Action | Who | How |
|---|---|---|
| View content | All roles (`canViewContent`) | Read-only cards |
| Add feedback | All roles (`canViewContent`) | Comment form → `addApprovalComment(..., isInternal=false)` |

NOT allowed in Phase 9:
- Publish
- Schedule
- Approve/Reject (internal workflow — Approvals tab only)
- Edit internal data

### Internal Preview Mode
If `userRole === 'owner' | 'manager'`, the tab shows an "Internal Preview of Client View" badge.
Same content is shown — the badge signals this is an internal-only preview.

## Permissions

| Action | Required Permission | Roles |
|---|---|---|
| View client portal | `canViewContent` | owner, manager, client, viewer |
| Add feedback comment | `canViewContent` | owner, manager, client, viewer |
| Approve/Reject/Revision | Approvals tab only | owner, manager |

## Feedback Storage

Client feedback is stored via `addApprovalComment()` with `isInternal=false`.
- Comments are attached to the most recent approval request for that content item.
- If no approval request exists for an item, the "Add Feedback" button is not shown — a note explains to contact the account manager.
- Internal comments (`is_internal=true`) are NOT shown in Client Portal.

## Safety Rules

- **Approved ≠ Published** — approval only unlocks next stage
- No publish action in Phase 9
- No `scheduled` or `published` status can be set
- Safety banner always visible at top of Client Portal
- Publishing blocked until Phase 10+
- No auto-post, no real ads, no customer messaging

## Data Strategy

- Uses existing `ApprovalDataStore` (key: `core_agency_approval_data_v1`)
- Uses existing `GenerationDataStore` (key: `core_agency_gen_data_v1`)
- Feedback comments stored in `approvalComments` array
- `genData` passed through unchanged when adding feedback comments
- Fully functional in offline/localStorage mode (Supabase not required)

## Integration

### App.tsx
- `UserCheck` icon imported from lucide-react
- `ClientViewTab` imported and mounted under `activeTab === 'client-view'`
- "Client" sidebar section added between Core and Workspace sections
- "Client Portal" sidebar button (emerald highlight on active)

## Next Phase

**Phase 10 — Asset Library Foundation**
- Upload and manage brand assets (images, videos, docs)
- Link assets to content items and campaigns
- Asset approval workflow integration
