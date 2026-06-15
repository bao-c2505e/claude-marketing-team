# V2-D2 Checkpoint C — Implementation Decision Record

**Decision status:** 🟡 **PROPOSED — NOT IMPLEMENTED.**
**Type:** Architecture / policy decision record (ADR-style).
**Workstream:** Post-MVP / Ver2 — V2-D2 Supabase Staging Execution, Checkpoint C.
**Date:** 2026-06-15
**Authored by:** PC1 (Claude Code Builder) — for Owner decision.
**Companion:** `v2_d2_client_feedback_policy.md` (full policy/spec).

> **Scope guard:** Documentation/specification only. This record changes **no** runtime
> behavior, repository logic, Supabase migration/RLS/auth, tests, secrets, or connectors. It
> records a *proposed* policy and the answers the Owner must confirm before any future,
> separately-gated implementation phase.

---

## 1. Context

V2-D2 audit finding #5: under the planned RLS (`03_core/database/rls_policy_plan.md`),
client/viewer roles are owner/manager-gated and have **no safe write path** for feedback.
The product invariant — *generated ≠ approved ≠ published*, and approval is a human
Owner/Internal action — must hold. Checkpoint C decides **whether and how** to give the
client side a narrow, audited feedback channel **without** letting it (or any module
callback) touch Core approval state.

This record sits downstream of:
- Approval workflow: `approval_status ∈ {draft, submitted, approved, rejected,
  revision_requested, cancelled}`, transitioned only by `canApproveContent` (`owner`/`manager`).
- Client portal (Phase 9): client/viewer already limited to read + non-internal feedback comment.
- PC2 non-authoritative callback rule (V2-E2 plan §4; t2/t3 fix, commit `3c8f853`).

---

## 2. Decision (Recommended Policy Option)

**Adopt the "advisory client feedback, human-authoritative approval" model** described in
`v2_d2_client_feedback_policy.md`:

1. Client **approver** may submit feedback, request revisions, and record approved-like /
   rejected-like **opinions as metadata only**.
2. Client **viewer** stays read-only by default.
3. `approval_status` is transitioned **only** by an authenticated Owner/Internal action in
   the Core Approvals UI.
4. Feedback is stored in a **separate `client_feedback` table** with immutable audit fields,
   server-derived actor identity, tenant-scoped INSERT, and insert-only client rows.
5. PC2 / module callbacks remain **non-authoritative**; callback metadata never transitions
   state and never impersonates a human role.

This is the **recommended** option because it opens the needed feedback channel while keeping
every approval/publish authority where it already is, and keeps advisory signals provably
separate from canonical state.

---

## 3. Rejected (Unsafe) Options

These options are explicitly **rejected** as unsafe:

| # | Rejected option | Why rejected |
|---|---|---|
| X1 | **Client directly mutates `approval_status`** | Breaks the core invariant that approval is an Owner/Internal human action; lets a client self-approve/publish-gate. ⛔ |
| X2 | **PC2 / module callback directly approves/rejects** | Callbacks are non-authoritative by contract (V2-E2 §4, test T9). An automated echo must never transition Core state. ⛔ |
| X3 | **Viewer can write feedback without explicit permission** | Viewer is read-only by default; a silent write path widens attack surface and confuses the audit trail. Requires explicit Owner grant. ⛔ |
| X4 | **Client feedback triggers publish / ads / send** | Publish is Owner-only and manual; no feedback (client or callback) may trigger any external action. ⛔ |
| X5 | *(supporting)* Storing client feedback in an approval column / overloading `approval_comments` write path | Risks a feedback write touching authoritative state and complicates RLS; rejected in favor of a separate table. ⛔ |

---

## 4. Required Owner Decision

| Key | Decision | Recommended answer |
|---|---|---|
| **A** | Allow **client approver** to submit feedback / request revision **only** (no state mutation). | **A = yes** |
| **B** | Allow **client approver** to submit **approved-like** feedback, but require Core Owner/Internal confirmation (no auto-approve). | **B = yes, but metadata only** |
| **C** | Keep **client viewer read-only** (feedback only if explicitly granted). | **C = yes** |
| **D** | Create a **separate feedback table** in the future implementation. | **D = yes** |

### Recommended answer (summary)

- **A = yes** — client approver: feedback + revision request only, never a transition.
- **B = yes, but metadata only** — approved-like signal is advisory metadata; only an
  authenticated Owner/Internal action produces `approved`.
- **C = yes** — viewer stays read-only by default.
- **D = yes** — separate `client_feedback` table with immutable audit + tenant-scoped,
  insert-only RLS.

---

## 5. Consequences

**If approved (future, separately-gated implementation phase):**
- A `client_feedback` table + scoped RLS policies would be designed and reviewed (Codex)
  before any migration is run against a disposable staging env.
- UI would add a labeled client-feedback entry + reviewer surfacing; approval controls stay
  Owner/Internal-only.
- The approval/publish authority model is unchanged — no new path to `approved`/publish.

**If deferred / rejected:** the status quo holds — client/viewer remain owner/manager-gated
with no feedback write path; this remains audit finding #5 as an open item.

**Non-consequences (guaranteed by this record):** no change to `approval_status` semantics,
to publish authority, to PC2's non-authoritative status, or to existing tests.

---

## 6. Status & Next Steps

- **Checkpoint C:** 🟡 **docs/spec PROPOSED — complete as a specification; NOT implemented.**
- **Checkpoint D:** 🔴 **NOT STARTED / Owner-gated** — any implementation (table, RLS, UI)
  is a future phase that the Owner must explicitly approve. Implementation should follow a
  *VERIFIED* Checkpoint B (live RLS behavior observed on disposable staging), which is
  currently 🔴 BLOCKED (no disposable staging env).
- **No implementation was done in this checkpoint.** No SQL, no RLS, no code, no tests, no
  connectors, no secrets, no production/staging connection.

**Next action for Owner:** review this record + `v2_d2_client_feedback_policy.md`, confirm
A/B/C/D (and sub-decisions E/F in the policy doc §11), then decide whether to gate Checkpoint D.
