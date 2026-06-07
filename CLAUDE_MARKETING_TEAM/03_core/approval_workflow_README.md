# Approval Workflow Foundation — Phase 8

## Overview

Phase 8 adds the approval gate between content generation and publishing.
Content items must go through explicit human approval before their status can become `approved`.
Approval does NOT publish — it only unlocks the next workflow stage.

## Architecture Position

```
Content Items (needs_review) → [Submit for Approval] → ApprovalRequest (submitted)
→ [Approve / Reject / Request Revision] → ApprovalRequest resolved + ContentItem status updated
→ approved item → (Phase 9+) client view / publishing gate
```

## Data Types (src/types/core.ts)

### ContentApprovalStatus
```
draft | submitted | approved | rejected | revision_requested | cancelled
```

### ApprovalPriority
```
low | normal | high
```

### ApprovalActionType
```
submitted | approved | rejected | revision_requested | commented | cancelled
```

### ContentApprovalRequest
| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID |
| `content_item_id` | string | FK → ContentPlanItem |
| `generation_job_id` | string \| null | FK → ContentPlanJob |
| `brief_id` | string \| null | FK → CampaignBrief |
| `campaign_id` | string | FK → Campaign |
| `brand_id` | string \| null | FK → Brand |
| `client_id` | string \| null | FK → Client |
| `title` | string | Content hook (truncated) |
| `status` | ContentApprovalStatus | Current status |
| `priority` | ApprovalPriority | low/normal/high |
| `requested_by` | string | Actor label |
| `assigned_to_role` | string \| null | Target reviewer role |
| `due_date` | string \| null | Optional deadline |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |
| `resolved_at` | string \| null | When resolved |

### ContentApprovalEvent (audit trail)
| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID |
| `approval_request_id` | string | FK → request |
| `content_item_id` | string | FK → content item |
| `action` | ApprovalActionType | What happened |
| `actor_label` | string | Who did it |
| `comment` | string \| null | Optional comment |
| `previous_status` | ContentApprovalStatus \| null | Before |
| `new_status` | ContentApprovalStatus \| null | After |
| `created_at` | string | ISO timestamp |

### ContentApprovalComment
| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID |
| `approval_request_id` | string | FK → request |
| `content_item_id` | string | FK → content item |
| `actor_label` | string | Who commented |
| `comment` | string | Comment body |
| `is_internal` | boolean | Internal vs client-facing |
| `created_at` | string | ISO timestamp |

## Data Store (src/lib/core/coreData.ts)

### ApprovalDataStore
```typescript
{
  approvalRequests: ContentApprovalRequest[];
  approvalEvents:   ContentApprovalEvent[];
  approvalComments: ContentApprovalComment[];
}
```
**localStorage key:** `core_agency_approval_data_v1`

### Key Helpers

```typescript
// Get the active (submitted) request for an item
getActiveRequestForItem(store, contentItemId)

// Check if an item can be submitted (status + no active request)
canSubmitItem(store, contentItem)

// Submit a content item for approval (creates request + event)
submitForApproval(approvalStore, genStore, contentItem, actorLabel, options?)
// → { approval: ApprovalDataStore, gen: GenerationDataStore }

// Execute approve/reject/revision/cancel (updates request + content item status)
executeApprovalAction(approvalStore, genStore, requestId, action, actorLabel, comment?)
// → { approval: ApprovalDataStore, gen: GenerationDataStore }

// Add a comment (no status change)
addApprovalComment(approvalStore, requestId, contentItemId, actorLabel, commentText)
// → ApprovalDataStore
```

## Status Transition Map

### ContentApprovalRequest status
```
submitted → approved           (approve action)
submitted → rejected           (reject action)
submitted → revision_requested (revision action)
submitted → cancelled          (cancel action)
```

### ContentPlanItem status on approval action
```
approve action           → content item status: approved
reject action            → content item status: rejected
revision_requested action → content item status: revision_requested
cancel action            → content item status: needs_review (reverts)
```

## Eligible Items for Submission

Items eligible to be submitted: status in `['generated', 'needs_review', 'revision_requested']`
AND no currently active (submitted) request for that item.

## Component — ApprovalsTab (src/components/core/ApprovalsTab.tsx)

### Props
```typescript
{
  clients, brands, campaigns: ...,
  contentItems: ContentPlanItem[];
  generationJobs: ContentPlanJob[];
  approvalData: ApprovalDataStore;
  genData: GenerationDataStore;
  onUpdate: (approval: ApprovalDataStore, gen: GenerationDataStore) => void;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}
```

### Views
1. **List view**: eligible-to-submit panel + filter bar + request list
2. **Detail view**: content preview + approval metadata + action buttons + comment form + history timeline

### Permissions

| Action | Required Permission |
|---|---|
| View approvals | `canViewContent` |
| Submit for approval | `canGenerateContent` OR `canEditCampaigns` |
| Approve / Reject / Request Revision | `canApproveContent` |
| Add comment | `canViewContent` (all roles) |
| Cancel request | `canGenerateContent` OR `canEditCampaigns` |

## Integration

### ContentGenerationTab
- Shows "→ Submit for Approval" button on expanded items that are submittable
- Navigates to Approvals tab via `onNavigateToApprovals` prop

### ContentCalendarTab
- Shows approval status badge on items that have an approval request
- Badge links to Approvals tab via `onNavigateToApprovals` prop

### App.tsx
- `approvalData` state with `loadApprovalData()` / `saveApprovalData()`
- `handleApprovalUpdate(approval, gen)` — updates both stores atomically
- Sidebar "Approvals" button with pending count badge

## Safety Rules

- **Approved ≠ Published** — approval only unlocks next stage
- No publish action in Phase 8
- No `scheduled` or `published` status can be set
- Safety banner always visible
- Publishing is blocked until Phase 9+

## Storage

localStorage key: `core_agency_approval_data_v1`
Separate from `core_agency_gen_data_v1` and `core_agency_core_data_v1`.
When Supabase is configured, these stores can be swapped to real CRUD (deferred post-Phase 9).

## Next Phase

**Phase 9 — Client View Foundation**
- Client-facing read-only view of approved content
- Shareable link or mode for client review
- Publishing gate (owner-only, explicit action)
