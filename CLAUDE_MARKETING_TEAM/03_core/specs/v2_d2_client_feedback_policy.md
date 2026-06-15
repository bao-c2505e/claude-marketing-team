# V2-D2 Checkpoint C — Client-Role Feedback Policy

**Status:** 🟡 PROPOSED — documentation/specification only. **No implementation.**
**Workstream:** Post-MVP / Ver2 — V2-D2 Supabase Staging Execution, Checkpoint C.
**Date:** 2026-06-15
**Owner of this document:** PC1 (Claude Code Builder) — proposal for Owner decision.
**Scope guard:** This document does **not** change runtime/product behavior, repository
logic, Supabase migrations/RLS/auth, tests, or any connector. It describes the *future*
policy that a later (separately Owner-gated) implementation phase would apply. Nothing
here is wired or executed.

> **Companion document:** `v2_d2_checkpoint_c_decision_record.md` (the decision record /
> required Owner answers). Read the two together.

---

## 1. Purpose

Define a **safe, explicit policy** for how a *client-side* role may participate in the
content review loop — i.e. give feedback, request a revision, or signal an
approved-like / rejected-like opinion — **without ever mutating the Core approval state**.

The policy exists to resolve V2-D2 audit finding #5: under the planned RLS
(`03_core/database/rls_policy_plan.md`), client/viewer roles are **owner/manager-gated**
and currently have **no safe write path** for feedback. Checkpoint C is the Owner policy
decision on whether and how to open a narrow, audited feedback write path while keeping
**approval authority strictly with internal Core roles**.

The single most important invariant this policy protects:

> **Client feedback is an *input* to human review. It is never an approval, a
> publish trigger, or a state transition. Only an authenticated Owner/internal action
> inside the Core Approvals UI can change `approval_status`.**

---

## 2. Scope

**In scope (policy/spec only):**

- Role definitions for everyone who touches the review loop, including service/module callbacks.
- A permission matrix (read / feedback / approval / publish / edit / delete) per role.
- State-transition policy: what may and may not change `approval_status`; how a separate
  `feedback_status` maps into the human review workflow.
- A recommended **data model** for client feedback (separate table, fields, audit columns).
- **Future** RLS requirements (to be implemented in a later, separately-gated phase).
- **Future** UI requirements (labeling, button visibility).
- Audit/log, risk, and open-decision sections.

**Out of scope (explicitly NOT done here):**

- Writing or running any SQL, migration, or RLS policy.
- Changing `src/lib/auth/permissions.ts`, repositories, or any component.
- Changing tests, connectors, secrets, or environment.
- Connecting to production or staging.
- Implementing the separate feedback table.

This document is the *blueprint*; implementation is a future phase gated by the Owner
(see Checkpoint D and the decision record).

---

## 3. Role Definitions

The current codebase defines exactly four role names
(`src/types/core.ts` → `RoleName = 'owner' | 'manager' | 'client' | 'viewer'`).
"Client approver" vs "client viewer" below is a **policy-level distinction layered on the
existing `client` / `viewer` roles** — it does not require a new enum value to start; an
"approver" is a `client` user designated as the brand's approval contact, while a pure
read-only stakeholder is a `viewer`. The distinction is called out so the permission
matrix can be precise and a future implementation can choose how to encode it
(designation flag on the assignment, or a future role value).

| Policy role | Maps to today | Description |
|---|---|---|
| **Owner / Admin** | `owner` | Full authority. Final approval, publish, user/role management, audit, system settings. The only role that can publish. |
| **Internal team / Editor** | `manager` | Agency-internal editor/reviewer. Creates/edits campaigns & content, runs generation, and performs approve / reject / request-revision in the Approvals UI. Holds approval authority alongside Owner. |
| **Client approver** | `client` (designated approval contact) | Client-side stakeholder authorized to **submit feedback, request a revision, and record an approved-like / rejected-like *opinion***. This opinion is **advisory metadata** — it does **not** change `approval_status`. Scoped to its assigned tenant (client → brands) only. |
| **Client viewer** | `viewer` | Read-only client-side stakeholder. Sees approved/pending content within its tenant. **No write path by default** (no feedback) unless the Owner explicitly grants it (see Open Decision C). |
| **PC2 / module callback** | service identity (no human role) | Automation backbone (n8n / modules) posting results back to Core. **Non-authoritative by contract.** May deliver previews, statuses, and notes as **metadata only**; can **never** impersonate a client or internal role, and can **never** set `approval_status`. Confirmed by V2-E2 plan §4 items 1, 4, 7 and the V2-E2 t2/t3 fix (commit `3c8f853`). |

---

## 4. Permission Matrix

Legend: ✅ allowed · ⛔ denied · 🟡 allowed only as **advisory metadata** (never mutates Core state)
· ☑️ allowed **only if Owner explicitly grants** (default = denied).

| Capability | Owner/Admin | Internal/Editor | Client approver | Client viewer | PC2/module callback |
|---|:---:|:---:|:---:|:---:|:---:|
| Read clients / brands / campaigns / briefs (own tenant) | ✅ (all) | ✅ (scoped) | ✅ (assigned tenant) | ✅ (assigned tenant) | ⛔ (no human-data read) |
| Read generated outputs | ✅ (all statuses) | ✅ (all statuses, scoped) | ✅ (client-visible statuses) | ✅ (client-visible statuses) | ⛔ |
| Create feedback / comment | ✅ | ✅ | ✅ (own tenant) | ☑️ (Owner-granted) | 🟡 (annotation metadata only, system-attributed) |
| Request revision | ✅ (and transitions) | ✅ (and transitions) | 🟡 (records a revision *request*; no transition) | ⛔ | 🟡 (recommendation only) |
| Mark **approved-like** feedback | ✅ (is the approval) | ✅ (is the approval) | 🟡 (opinion metadata only) | ⛔ | 🟡 (echo/sim only) |
| Mark **rejected-like** feedback | ✅ (is the rejection) | ✅ (is the rejection) | 🟡 (opinion metadata only) | ⛔ | 🟡 (recommendation only) |
| **Mutate Core `approval_status`** | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| Publish / post / send / ads execution | ✅ (Owner-only, manual) | ⛔ | ⛔ | ⛔ | ⛔ |
| Edit tenant hierarchy fields (client/brand/campaign/brief) | ✅ | ✅ (scoped) | ⛔ | ⛔ | ⛔ |
| Edit generated output | ✅ | ✅ (scoped) | ⛔ | ⛔ | ⛔ |
| Archive / delete | ✅ | 🟡 (per existing policy; delete-campaign is Owner-only) | ⛔ | ⛔ | ⛔ |

Notes:
- "Publish" is **Owner-only and manual** today (`canPublishContent: ['owner']`) and remains
  so. No client action, and no callback, may trigger publish/ads/send.
- "Mark approved-like / rejected-like" for a **client** is intentionally *not* the same
  capability as the internal approve/reject. For internal roles the action **is** the
  state transition; for a client it is **only an opinion recorded as metadata** that a human
  must still action.
- Client viewer feedback defaults to **denied** — opening it requires an explicit Owner grant
  (Open Decision C) and must still obey all tenant-scope and immutability rules.

---

## 5. State-Transition Policy

### 5.1 What CAN change `approval_status`

`approval_status` (`ContentApprovalStatus = draft | submitted | approved | rejected |
revision_requested | cancelled`) may change **only** via an authenticated **Owner/Internal**
action in the Core Approvals UI (`executeApprovalAction(...)`), exactly as today:

```
submitted → approved            (Owner/Internal: approve)
submitted → rejected            (Owner/Internal: reject)
submitted → revision_requested  (Owner/Internal: request revision)
submitted → cancelled           (Owner/Internal: cancel)
```

### 5.2 What CANNOT change `approval_status`

- ⛔ **Client approver** feedback — including an "approved-like" opinion — **never** transitions state.
- ⛔ **Client viewer** — no write path; certainly no transition.
- ⛔ **PC2 / module callback** — non-authoritative by contract. A callback carrying
  `approval_status: "approved"` (or any decision-flavored field) is recorded as metadata,
  flagged for human review, and **must not** transition Core state
  (V2-E2 plan §4.1 + test T9 "approval-bypass attempt").
- ⛔ No automated rule, trigger, or aggregation of client opinions auto-approves anything.

### 5.3 `feedback_status` → review-workflow mapping

Client/callback signals live in a **separate** `feedback_status` field (on the proposed
feedback table — see §6), entirely distinct from `approval_status`:

| `feedback_status` (client/callback) | Meaning | Effect on `approval_status` | Reviewer workflow |
|---|---|---|---|
| `comment` | General note | none | Surfaced in review thread |
| `revision_requested` | Client/PC2 asks for changes | **none** | Flag item for reviewer; reviewer *may* manually set `revision_requested` |
| `approved_like` | Client signals approval intent | **none** | Reviewer sees the signal; only a human action sets `approved` |
| `rejected_like` | Client signals rejection intent | **none** | Reviewer sees the signal; only a human action sets `rejected` |

**Mapping rule:** `feedback_status` is **advisory routing metadata** — it changes *what the
reviewer sees and is prompted to do*, never the canonical `approval_status`. The mapping is
one-way and manual: feedback can *prompt* a human transition; it can never *be* one.

### 5.4 Safe handling of needs_revision / rejected / approved feedback

- **needs_revision-like feedback:** Recorded as `feedback_status='revision_requested'`; the
  item is flagged in the Approvals queue. If no human acts, the request **stays `submitted`/pending** — there is no silent transition. Matches V2-E2 plan §4 item 4.
- **rejected-like feedback:** Recorded as `feedback_status='rejected_like'` + reason text,
  flagged for review. **No** transition to `rejected` until an Owner/Internal acts
  (mirrors V2-E2 test T3 "rejected non-authoritative echo").
- **approved-like feedback:** Recorded as `feedback_status='approved_like'` (metadata only,
  per Decision B). It is **never** auto-promoted to `approved`. Only an authenticated
  Owner/Internal action produces `approved` (V2-E2 plan §4 item 7).

---

## 6. Data-Model Recommendation

**Recommendation: a separate `client_feedback` table** rather than overloading
`approval_comments` or any approval/state column. Rationale: clear separation between
*advisory client/callback input* and the *authoritative approval audit trail*; simpler,
tighter RLS (client INSERT scoped to one table); immutable client submissions; no risk of a
feedback write accidentally touching an approval column.

### 6.1 Proposed fields (illustrative — not a migration)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | Server-generated. |
| **Tenant / scope** | | |
| `client_id` | uuid (fk → clients) | Tenant root; RLS anchor. |
| `brand_id` | uuid (fk → brands), nullable | Validated as child of `client_id`. |
| `campaign_id` | uuid (fk → campaigns), nullable | Validated as child of `brand_id`/`client_id`. |
| **Parent entity references** | | |
| `content_item_id` | uuid (fk → content item), nullable | The output being reviewed. |
| `approval_request_id` | uuid (fk → approval request), nullable | Links feedback to the live review, **read-only link** (does not write the request). |
| **Feedback payload** | | |
| `feedback_kind` | enum (`comment` \| `revision_request` \| `opinion`) | What the client intended. |
| `feedback_status` | enum (`comment` \| `revision_requested` \| `approved_like` \| `rejected_like`) | Advisory only (see §5.3); **never** mirrors into `approval_status`. |
| `body` | text | Comment/reason. |
| **Actor identity** | | |
| `actor_user_id` | uuid (fk → auth user) | Set from `auth.uid()` server-side, **not** client-supplied. |
| `actor_role` | text | Role at submission time (snapshot). |
| `actor_label` | text | Display label. |
| `source` | enum (`client` \| `internal` \| `module_callback`) | Distinguishes human client feedback from non-authoritative callback metadata. |
| **Immutable audit** | | |
| `created_at` | timestamptz default now() | Server-set; immutable. |
| `updated_at` | timestamptz | Present for schema symmetry; for client rows treated as immutable post-insert (no client UPDATE — see §7). |
| `is_deleted` | boolean default false | Soft-delete only; hard delete is Owner/Internal only. |

### 6.2 Data-model rules

- **Separate table** — feedback is never stored in, and never writes to, `approval_status`
  or the approval request row.
- **Tenant/scope fields required** (`client_id` mandatory; `brand_id`/`campaign_id`
  validated against the real hierarchy — no orphan/cross-tenant references).
- **Immutable audit fields** — `created_at`, `actor_user_id`, `source` are server-set and
  never client-writable.
- **Actor identity is server-derived** from `auth.uid()`; clients cannot spoof
  `actor_user_id`, `actor_role`, or `source`.
- **Parent references validated** — a feedback row may reference a content item /
  approval request **only** within the actor's assigned tenant scope.
- **`created_at`/`updated_at`** — both server-managed; client rows are insert-only.

---

## 7. Future RLS Requirements

*(To be implemented in a later, separately Owner-gated phase — not now.)*

- **Scoped reads only** — every role reads only within its tenant scope via the existing
  helper family (`current_user_can_access_client` / `current_user_can_access_campaign`,
  `03_core/database/rls_policy_plan.md`). No global read for client/viewer.
- **Client INSERT scoped to assigned tenant** — a client may `INSERT` a feedback row **only**
  when `client_id` (and any `brand_id`/`campaign_id`) resolves to a tenant the user is
  actively assigned to, using `current_user_has_scoped_role(['client'], 'client', client_id)`.
  No insert outside assigned scope.
- **No UPDATE/DELETE by client after submission** — client rows are insert-only by default.
  Editing/withdrawing is denied unless the Owner explicitly enables a narrow, audited
  "withdraw within N minutes" exception (Open Decision). Hard delete is Owner/Internal only.
- **Inactive / expired assignments cannot access** — every policy checks
  `user_roles.is_active = true` (and any expiry), so a revoked or expired client assignment
  has neither read nor write. (Reinforces audit finding #2 — the `user_roles` lockout/active
  gate.)
- **Parent hierarchy must be validated** — INSERT predicates must confirm
  `brand_id`'s parent is `client_id` and `campaign_id`'s parent chain resolves to the same
  `client_id`; reject any row whose references don't form a real ancestor chain (same
  predicate family as `repoRouting.ts` / V2-E1 §1 hierarchy validation).
- **No broad OR-scope bypass** — do **not** write a single
  `current_user_has_role(...)`-style predicate that ignores `resource_type`/`resource_id`
  (rls_policy_plan warning): a client scoped to Client A must never read or write Client B.
- **Service/module callbacks cannot impersonate client approval** — callback-sourced rows
  (`source='module_callback'`) are written only by the service path, are always
  non-authoritative metadata, and can never carry a client identity or set `approval_status`.
  RLS/role separation must keep the callback identity distinct from any human role.

---

## 8. Future UI Requirements

*(Specification only — no component changes in this checkpoint.)*

- **Feedback clearly labeled as client feedback** — client-sourced entries render with an
  explicit "Client feedback" label/badge and are visually distinct from the internal
  approval audit trail. Callback-sourced notes render as "PC2 / automation note
  (non-authoritative)".
- **Approval buttons visible only to authorized Core roles** — Approve / Reject / Request
  Revision controls are rendered **only** for `owner`/`manager` (gated by `canApproveContent`),
  exactly as today. Client/viewer never see approval controls.
- **Client feedback cannot be confused with final approval** — an "approved-like" client
  signal is shown as a *client opinion / pending reviewer action*, never as a green
  "Approved" state. The canonical `approval_status` badge is driven solely by Core state.
- **Human Approval Checklist remains Owner/Internal-controlled** — the final approval
  checklist/gate stays inside the internal Approvals UI and is actionable only by
  Owner/Internal. Client UI surfaces feedback entry + read-only status, never the gate.

---

## 9. Audit / Log Requirements

- Every feedback insert records immutable `actor_user_id` (from `auth.uid()`), `actor_role`,
  `source`, and `created_at`.
- Any **human** approval transition continues to be recorded in the existing
  `ContentApprovalEvent` audit trail (actor, action, previous/new status, timestamp) —
  unchanged.
- Callback-sourced metadata is logged with `source='module_callback'` and flagged
  non-authoritative; ingestion of a decision-flavored callback is logged as a *review flag*,
  never as a transition (consistent with V2-E2 plan §4 + automation logs README).
- Feedback rows and approval events are queryable for an audit of "who said what, and who
  actually transitioned the state" — the two are always distinguishable.

---

## 10. Risks and Mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | Client "approved-like" feedback mistaken for real approval | `feedback_status` is separate from `approval_status`; UI labels it as opinion; only human action transitions state (§5, §8). |
| R2 | Client writes feedback outside their tenant | RLS INSERT scoped via `current_user_has_scoped_role(['client'], 'client', client_id)` + hierarchy validation (§7). |
| R3 | PC2/module callback impersonates a client approval | Callbacks are non-authoritative by contract; distinct service identity; `source='module_callback'`; cannot set `approval_status` (V2-E2 §4, T9). |
| R4 | Viewer silently gains write ability | Viewer feedback denied by default; requires explicit Owner grant (Decision C); still immutable + scoped. |
| R5 | Client edits/deletes feedback to rewrite history | Insert-only for client rows; no UPDATE/DELETE; soft-delete + hard-delete Owner/Internal only (§7). |
| R6 | Revoked/expired client still accesses | All policies gate on `is_active = true` (+ expiry) (§7, audit finding #2). |
| R7 | Broad OR-scope predicate leaks cross-tenant data | Forbid `resource_type`-agnostic predicates; use scoped helpers only (§7, rls_policy_plan warning). |
| R8 | Feedback triggers publish/ads/send | No path from feedback to publish; publish is Owner-only manual; clients/callbacks have ⛔ on publish (§4). |
| R9 | Feedback row writes an approval column | Separate table; feedback has no write access to approval/state columns (§6). |

---

## 11. Open Owner Decisions

These are the explicit choices the Owner must confirm (also itemized in the decision record):

- **A.** Allow **client approver** to submit feedback / request a revision **only**
  (no state mutation)? → *Recommended: **yes**.*
- **B.** Allow **client approver** to submit an **approved-like** signal, but **only as
  metadata** requiring Owner/Internal confirmation (never an auto-approve)? →
  *Recommended: **yes, metadata only**.*
- **C.** Keep **client viewer read-only** by default (feedback only if explicitly granted)? →
  *Recommended: **yes** (viewer read-only).*
- **D.** Create a **separate `client_feedback` table** in the future implementation? →
  *Recommended: **yes**.*
- **E (sub-decision):** Allow a narrow client "withdraw own feedback within N minutes"
  exception, or keep client rows strictly immutable? → *Recommended default: **strictly
  immutable** unless Owner wants the withdraw window.*
- **F (sub-decision):** Encode "client approver vs client viewer" as a designation flag on
  the tenant assignment, or introduce a future role value? → *Recommended: **designation
  flag**, defer any new enum value.*

> All decisions above are **proposals**. Nothing is implemented. Implementation is a future
> phase gated by the Owner (see Checkpoint D and `v2_d2_checkpoint_c_decision_record.md`).
