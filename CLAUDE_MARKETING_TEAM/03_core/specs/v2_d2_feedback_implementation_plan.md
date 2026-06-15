# V2-D2 Checkpoint E — Client Feedback Implementation Plan

**Status:** 🟡 **IMPLEMENTATION PLAN ONLY — NOT IMPLEMENTED.**
**Workstream:** Post-MVP / Ver2 — V2-D2 Supabase Staging Execution, Checkpoint E.
**Date:** 2026-06-15
**Authored by:** PC1 (Claude Code Builder) — planning for Owner/Codex review.
**Companions:** `v2_d2_client_feedback_policy.md` (accepted policy) ·
`v2_d2_checkpoint_c_decision_record.md` (Owner decision A/B/C/D) ·
`v2_d2_feedback_future_checkpoints.md` (Checkpoints F–J outline).

> **Scope guard:** Documentation / specification / implementation-plan only. This document
> changes **no** runtime/product behavior, repository logic, Supabase migrations/RLS/auth,
> tests, secrets, or connectors. It contains **no executable migration** — all SQL/DDL shown
> is illustrative draft for a future, separately Owner-gated phase. Nothing here is wired,
> run, or executed.

---

## 1. Purpose

Produce the engineering plan to implement the **Owner-approved client feedback policy**
(Checkpoints C/D) as a real feature in a future phase — a separate `client_feedback` table,
scoped RLS, repository/API methods, and UI — **without** changing approval authority. The
plan exists so that, when the Owner gates implementation (Checkpoint F onward), there is a
reviewed, safety-first blueprint to execute against. This checkpoint produces **only the
plan**; it builds nothing.

---

## 2. Scope

In scope (this checkpoint = docs/spec only):

- A concrete data-model design for a separate feedback table (fields, scope, audit).
- A suggested RLS design expressed against the existing helper family.
- Suggested repository/API interfaces and safe create/list methods.
- Suggested UI changes (feedback panel, labeling, role-gated controls).
- Audit/logging, migration outline, test-plan outline, rollout plan, risks, open questions.
- A future-checkpoint outline (F–J), captured in the companion doc.

---

## 3. Non-Goals

- ⛔ No code, repository, component, type, or test changes in this checkpoint.
- ⛔ No executable SQL migration; no `.sql` file added; no SQL run.
- ⛔ No Supabase/RLS/auth changes; no production or staging connection.
- ⛔ No secrets; no connectors enabled.
- ⛔ No change to approval authority, approval workflow, or the `approval_status` state machine.
- ⛔ No change to viewer policy — **client viewer remains strictly read-only**.
- ⛔ No path by which client/viewer feedback or a PC2/module callback mutates Core approval state.

---

## 4. Current Accepted Policy Summary (from Checkpoints C/D)

The implementation must preserve, exactly, the accepted policy:

- **Client approver** may submit feedback and request a revision.
- **Client approver "approved-like" feedback is metadata only** — it is never an approval.
- **Core Owner/Internal confirmation is required before any real approval state change.**
  Only an authenticated Owner/Internal action in the Core Approvals UI transitions
  `approval_status` (`draft | submitted | approved | rejected | revision_requested | cancelled`).
- **Client viewer remains read-only** — cannot create feedback/comment, request revision,
  submit approved-like / rejected-like / needs_revision-like feedback, or mutate approval state.
- **PC2 / module callbacks remain metadata / log / echo only** — non-authoritative; never
  mutate approval decisions, never impersonate a client/human role.
- **No feedback- or callback-driven posting, ads, messaging, or customer contact.**

Any future change to viewer permissions is **out of scope** and requires a separate
Owner-gated policy change (not part of accepted V2-D2).

---

## 5. Proposed Data Model

**Separate table — suggested name: `client_feedback`** (carried from policy §6; never
overload `content_approval_comments` or any approval/state column).

### 5.1 Required fields (illustrative draft — NOT a migration)

| Group | Field | Type | Notes |
|---|---|---|---|
| **PK** | `id` | uuid (pk) | Server-generated (`gen_random_uuid()`). |
| **Tenant / scope** | `client_id` | uuid (fk → clients), NOT NULL | Tenant root; RLS anchor. |
| | `brand_id` | uuid (fk → brands), nullable | Validated as child of `client_id`. |
| | `campaign_id` | uuid (fk → campaigns), nullable | Validated as child of `brand_id`/`client_id`. |
| **Parent entity refs** | `content_item_id` | uuid (fk → content_plan_items), nullable | The output being reviewed. |
| | `approval_request_id` | uuid (fk → content_approval_requests), nullable | **Read-only link** — feedback never writes the request row. |
| **Feedback payload** | `feedback_type` | enum `feedback_kind` (`comment` \| `revision_request` \| `opinion`) | What the client intended. |
| | `feedback_status` | enum (`comment` \| `revision_requested` \| `approved_like` \| `rejected_like`) | **Advisory only**; never mirrors into `approval_status`. |
| | `body` | text | Comment / reason. |
| **Actor identity** | `actor_user_id` | uuid (fk → auth.users) | Set from `auth.uid()` **server-side**, never client-supplied. |
| | `actor_role` | text | Role snapshot at submission time. |
| | `actor_label` | text | Display label. |
| | `source` | enum (`client` \| `internal` \| `module_callback`) | Separates human client feedback from non-authoritative callback metadata. |
| **Immutable audit** | `created_at` | timestamptz default now() | Server-set; immutable. |
| | `updated_at` | timestamptz | Schema symmetry; client rows insert-only (no client UPDATE). |
| | `is_deleted` | boolean default false | Soft-delete only; hard delete Owner/Internal only. |

### 5.2 `feedback_type` / `feedback_status`

- **`feedback_type`** captures *intent* (`comment`, `revision_request`, `opinion`).
- **`feedback_status`** is the *advisory signal* (`comment`, `revision_requested`,
  `approved_like`, `rejected_like`). It is **strictly separate** from `approval_status` and
  is never copied into it. Mapping into the review workflow is one-way and manual: feedback
  may *prompt* a human transition; it can never *be* one (policy §5.3–§5.4).

### 5.3 created_at / updated_at handling

- Both server-managed. `created_at` immutable. For client-sourced rows the row is
  **insert-only** — no client UPDATE path, so `updated_at` only ever moves under an
  Owner/Internal moderation action (e.g. soft-delete), never under client edit.

### 5.4 Data-model rules (unchanged from policy §6.2)

Separate table; tenant/scope fields required and hierarchy-validated; immutable audit
(`created_at`/`actor_user_id`/`source` server-set, never client-writable); actor identity
server-derived from `auth.uid()`; parent references validated within actor's tenant scope;
client rows insert-only.

---

## 6. Suggested RLS Design

*(Illustrative — expressed against the existing helper family in
`03_core/database/rls_policy_plan.md`; **no SQL is run in this checkpoint**.)*

Helpers reused (no new bypass helper): `current_user_has_global_role`,
`current_user_has_scoped_role`, `current_user_can_access_client`,
`current_user_can_access_campaign`, plus a hierarchy validator in the family of
`content_plan_hierarchy_is_valid` / `content_approval_hierarchy_is_valid`.

| Operation | Who | Predicate (sketch) |
|---|---|---|
| `ENABLE ROW LEVEL SECURITY` | — | On `client_feedback`; **zero-policy = zero rows** until policies applied (avoid the lockout trap, audit finding #2). |
| **SELECT** | owner/manager (global), scoped manager (tenant), client **and viewer** (tenant) | `current_user_can_access_client(client_id)` — **scoped reads only**, no global read for client/viewer. |
| **INSERT** | owner/manager + **client approver only** | `current_user_has_global_role(['owner','manager'])` OR `current_user_has_scoped_role(['client'], 'client', client_id)` **AND** hierarchy-valid(client/brand/campaign/content_item/approval_request) **AND** `source='client'` **AND** `actor_user_id = auth.uid()`. **Viewer is NOT in the insert predicate.** |
| **UPDATE** | owner/manager only | `current_user_has_global_role(['owner','manager'])` — clients/viewers have **no** UPDATE. (Optional, separately-gated "withdraw within N minutes" for approver is an Open Question, default off.) |
| **DELETE** | owner only (hard delete); soft-delete via UPDATE by owner/manager | `current_user_has_global_role(['owner'])`. |

Design requirements (must all hold):

- **Scoped reads only** — client/viewer read strictly within assigned tenant; no global read.
- **Client approver insert only within assigned tenant scope** — INSERT predicate uses
  `current_user_has_scoped_role(['client'], 'client', client_id)`; insert outside scope rejected.
- **Client viewer read-only** — `viewer` appears in SELECT predicates **only**, never in
  INSERT/UPDATE/DELETE. There is no viewer write path.
- **Inactive/expired assignments denied** — every predicate goes through helpers that check
  `user_roles.is_active = true` (and expiry); revoked/expired assignments get neither read nor write.
- **Read/write role separation** — read (SELECT) is broader (incl. client/viewer) than write
  (INSERT limited to approver + staff); writes never widen via the read predicate.
- **Parent hierarchy validation** — INSERT confirms `brand_id`'s parent is `client_id`,
  `campaign_id` chain resolves to the same `client_id`, and any `content_item_id` /
  `approval_request_id` belongs to that tenant; orphan/cross-tenant refs rejected.
- **No broad OR-scope bypass** — no `resource_type`-agnostic `current_user_has_role(...)`
  predicate (rls_policy_plan warning); a client scoped to Client A can never touch Client B.
- **No callback impersonation of client approval** — `source='module_callback'` rows are
  written only by the service path; callbacks can never carry a client identity, can never
  set `approval_status`, and the callback identity is kept distinct from any human role.

---

## 7. Suggested Repository / API Changes

Follows the existing pattern (`coreRepository.ts` interfaces + `SupabaseXRepository` /
`LocalStorageXRepository` + `repositoryFactory.ts` selection + `repoRouting.ts` UUID gating
+ `sanitizeXPatch`).

### 7.1 Interfaces needed (sketch)

```text
interface ClientFeedbackListParams {
  clientId: string; brandId?: string | null; campaignId?: string | null;
  contentItemId?: string | null; approvalRequestId?: string | null;
}
interface ClientFeedbackCreateInput {        // server derives actor identity + source
  clientId: string; brandId?: string | null; campaignId?: string | null;
  contentItemId?: string | null; approvalRequestId?: string | null;
  feedbackType: 'comment' | 'revision_request' | 'opinion';
  feedbackStatus: 'comment' | 'revision_requested' | 'approved_like' | 'rejected_like';
  body: string;
}
interface ClientFeedbackRepository {
  list(params: ClientFeedbackListParams): Promise<ClientFeedback[]>;   // scoped read
  create(input: ClientFeedbackCreateInput): Promise<ClientFeedback>;   // approver/staff only
  // NO update(), NO delete() on the client-facing interface.
}
```

### 7.2 Safe create / list methods

- **`create`** — only callable when the caller is an approver (or staff). The method must
  **not** accept `actor_user_id` / `actor_role` / `source` from the caller; these are
  server-derived (`auth.uid()`), `source='client'` for the human path. UUID-gate every id via
  `okOrAbsentUuid` and a new `feedbackScopeIsSupabaseSafe(...)` in `repoRouting.ts`
  (mirroring `approvalScopeIsSupabaseSafe`); any non-UUID/local id routes to the
  local fallback, never to Supabase.
- **`list`** — scoped read by tenant; returns client-sourced + (for staff) all sources. RLS is
  the backstop; the repository filters are defense-in-depth.

### 7.3 Prohibited update/delete behavior

- The client-facing repository exposes **no `update` and no `delete`** — client feedback is
  insert-only. Moderation (soft-delete) is a separate **staff-only** method, not on the
  client interface. No `sanitize*Patch` is needed because there is no client patch path.
- A `viewer` must never reach `create` (UI hides it, permission helper denies it, RLS rejects it).

### 7.4 Tenant hierarchy validation requirements

- Reuse the `repoRouting.ts` UUID-gating + hierarchy idea: before any Supabase write, the
  full `client → brand → campaign → content_item / approval_request` chain must be present
  and consistent (no orphan ids), matching the RLS hierarchy validator. Local/`*-` ids never
  cross the Supabase boundary.

### 7.5 Permission helper

- Add (future) `canSubmitClientFeedback` = `['owner','manager','client']` (NOT `viewer`) to
  `permissions.ts`, and keep approval controls on `canApproveContent` = `['owner','manager']`.
  `isClientRole`/`isInternalRole` unchanged.

---

## 8. Suggested UI Changes

- **Feedback panel** — a dedicated, clearly bounded "Client Feedback" panel (likely in the
  Client Portal / Approvals detail), separate from the internal approval audit trail.
- **Clear label: client feedback** — client-sourced entries carry an explicit "Client
  feedback" badge; callback-sourced notes show "PC2 / automation note (non-authoritative)".
- **Internal approval controls separated from client feedback** — Approve / Reject / Request
  Revision render **only** for `owner`/`manager` (gated by `canApproveContent`); they are
  never adjacent to or confusable with the client feedback entry.
- **Viewer read-only UI** — for `viewer`, the feedback composer is **not rendered**; the
  viewer sees content + status read-only, with no feedback entry, no revision control, no
  approval control.
- **Owner/internal-only approval buttons** — approval buttons remain owner/internal-only; an
  "approved-like" client signal is shown as a *client opinion / pending reviewer action*,
  never as a green "Approved" state. The canonical `approval_status` badge is driven solely
  by Core state.

---

## 9. Suggested Audit / Logging

Each feedback record and any related action should capture:

- **Actor** — `actor_user_id` (from `auth.uid()`), `actor_label`.
- **Role** — `actor_role` snapshot at submission.
- **Timestamp** — `created_at` (immutable); moderation timestamp on `updated_at`.
- **Target entity** — `client_id`/`brand_id`/`campaign_id` + `content_item_id` /
  `approval_request_id`.
- **Feedback payload** — `feedback_type`, `feedback_status`, `body`, `source`.
- **Status transitions if any** — feedback itself performs **no** `approval_status`
  transition. Any human approval transition continues to be recorded in the existing
  `ContentApprovalEvent` audit trail (actor/action/previous/new status) — unchanged. A
  callback-sourced row is logged with `source='module_callback'` and flagged
  non-authoritative; ingesting a decision-flavored callback is logged as a *review flag*,
  never a transition.

---

## 10. Migration Plan Outline

- **Future migration only — not executable in this checkpoint.** No `.sql` file is added now.
- When gated (Checkpoint F), the migration is an **additive, idempotent** extension in the
  family of `schema_v1_phase16c2_approval_extension.sql` (enum types + `client_feedback`
  table + RLS `ENABLE` + policies + hierarchy validator function, with
  `DROP ... IF EXISTS` for re-runnability). Legacy Phase-2 tables stay untouched.
- **Staging-first verification required** — the migration is applied and verified on a
  disposable staging project (Checkpoint G) **before** any repository/UI wiring; production
  is never the first target. This depends on a *VERIFIED* Checkpoint B (disposable staging
  env), currently 🔴 BLOCKED.

---

## 11. Test Plan Outline

- **Unit tests** — `feedbackScopeIsSupabaseSafe` UUID gating (full chains, local ids at each
  level, optional-absent ids); enum validation; server-derived actor identity (caller cannot
  spoof `actor_user_id`/`source`).
- **Repository tests** — `create` rejects viewer; `create` rejects out-of-scope tenant;
  no `update`/`delete` on the client interface; local/`*-` ids never routed to Supabase.
- **RLS staging matrix** — per role (owner/manager/scoped-manager/client/viewer/expired) ×
  operation (select/insert/update/delete) × tenant (own/other), asserting: client INSERT only
  in own tenant; viewer INSERT always denied; cross-tenant denied; inactive/expired denied;
  callback path cannot set approval or impersonate client.
- **UI role visibility checks** — viewer sees no composer/controls; client sees feedback
  composer but no approval buttons; owner/manager see approval controls; "approved-like" never
  renders as approved.
- **Callback safety regression checks** — reuse V2-E2 T9-style "approval-bypass attempt": a
  callback with `approval_status:"approved"` lands as metadata only, item stays `generated`,
  approval stays `pending`, warning logged, nothing approved.

---

## 12. Rollout Plan

Strict order; each step Owner-gated (see `v2_d2_feedback_future_checkpoints.md`):

1. **Docs / spec** (this Checkpoint E) — plan only.
2. **Migration draft** (Checkpoint F) — additive/idempotent draft, reviewed, not yet applied to prod.
3. **Staging verification** (Checkpoint G) — apply on disposable staging, run RLS matrix.
4. **Repository implementation** (Checkpoint H) — interfaces + Supabase/local repos + routing gate + factory.
5. **UI implementation** (Checkpoint I) — feedback panel, labels, role-gated controls.
6. **Codex audit** — at each of F–I, with a final pass before E2E.
7. **Owner manual E2E** (Checkpoint J) — evidence pack; controlled, no live connectors.

---

## 13. Risks and Mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | Viewer gains a write path during implementation | Viewer excluded from INSERT predicate, `create` rejects viewer, UI hides composer; RLS matrix asserts viewer-insert denied (test). |
| R2 | Client "approved-like" mistaken for approval | Separate `feedback_status`; UI labels it opinion/pending; only human action transitions `approval_status`. |
| R3 | Feedback row writes an approval column | Separate table; no FK write-back; repository has no approval-mutating method. |
| R4 | Cross-tenant / orphan feedback | Scoped INSERT + hierarchy validator + UUID gating; cross-tenant denied in matrix. |
| R5 | PC2 callback impersonates client/approval | `source='module_callback'` service-only path; callbacks non-authoritative; T9 regression test. |
| R6 | Revoked/expired client still writes | Helpers check `is_active`/expiry; expired role in RLS matrix asserts denial. |
| R7 | Migration breaks existing RLS/data | Additive/idempotent; staging-first; never first-applied to prod; rollback documented. |
| R8 | Approval authority drift | `canApproveContent` unchanged; approval transitions only via Core Approvals UI; no feedback/callback path to `approved`/publish. |

---

## 14. Open Questions

- **Q1 (sub-decision E):** Allow a narrow client-approver "withdraw own feedback within N
  minutes", or keep strictly insert-only? *Default: strictly immutable.*
- **Q2 (sub-decision F):** Encode "approver vs viewer" as a designation flag on the tenant
  assignment, or a future role value? *Default: designation flag; defer any new enum value.*
- **Q3:** Should staff (`internal`) feedback live in the same table (`source='internal'`) or
  stay in `content_approval_comments`? *Recommend: keep approval audit in
  `content_approval_comments`; use `client_feedback` for client/callback advisory input.*
- **Q4:** Soft-delete vs hard-delete default for moderation? *Recommend: soft-delete
  (`is_deleted`), hard delete owner-only.*

---

## 15. Recommended Next Checkpoint

**Checkpoint F — migration draft (Owner-gated).** Draft the additive/idempotent
`client_feedback` migration + RLS policies as a reviewable artifact (still **not applied**),
for Codex audit. It must be sequenced **before** any staging apply (G) and must wait on a
*VERIFIED* Checkpoint B (disposable staging env), currently 🔴 BLOCKED. See
`v2_d2_feedback_future_checkpoints.md`.

> **No implementation was done in this checkpoint.** No code, migration, RLS, SQL, tests,
> connectors, secrets, or production/staging connection. Viewer policy unchanged
> (read-only). Approval authority unchanged (Owner/Internal only). PC2 callbacks remain
> non-authoritative.
