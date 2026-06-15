# V2-D2 Checkpoint C — Implementation Decision Record

**Decision status:** ✅ **ACCEPTED — OWNER-APPROVED FOR FUTURE IMPLEMENTATION (Checkpoint D, 2026-06-15). NOT IMPLEMENTED.**
**Type:** Architecture / policy decision record (ADR-style).
**Workstream:** Post-MVP / Ver2 — V2-D2 Supabase Staging Execution, Checkpoints C → D.
**Date:** 2026-06-15 (Checkpoint C proposed) → 2026-06-15 (Checkpoint D Owner decision recorded)
**Authored by:** PC1 (Claude Code Builder) — proposal; Owner decision recorded in §7.
**Companion:** `v2_d2_client_feedback_policy.md` (full policy/spec).

> **Scope guard:** Documentation/specification only. This record changes **no** runtime
> behavior, repository logic, Supabase migration/RLS/auth, tests, secrets, or connectors. It
> records a policy proposal (Checkpoint C) **and the Owner's accept decision (Checkpoint D)**.
> The Owner decision authorizes the policy *direction* for a future, separately-gated
> implementation phase — **it does not implement anything and does not authorize building now.**

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

## 6. Consequences (carried forward)

The §5 consequences stand: an approved policy direction means a future, separately-gated
phase would design + Codex-review a `client_feedback` table and scoped RLS before any
migration runs against a disposable staging env; UI would add labeled client-feedback entry
with approval controls remaining Owner/Internal-only; the approval/publish authority model
is unchanged. **Non-consequences guaranteed:** no change to `approval_status` semantics,
publish authority, PC2's non-authoritative status, or existing tests.

---

## 7. Checkpoint D — Owner Decision (Recorded)

**Decision status:** ✅ **ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION.**
**Recorded:** 2026-06-15 · **Decider:** Owner · **Recorded by:** PC1 (Claude Code Builder).

The Owner reviewed Checkpoint C (`v2_d2_client_feedback_policy.md` + this record) and
**approved the policy direction** with the following answers:

| Key | Decision | Owner answer |
|---|---|---|
| **A** | Client approver may submit feedback / request revision (no state mutation). | ✅ **YES** |
| **B** | Client approver may submit **approved-like** feedback — **metadata only**, requires Core Owner/Internal confirmation before any real approval state change (no auto-approve). | ✅ **YES, metadata only** |
| **C** | Client viewer remains **read-only**. | ✅ **YES** |
| **D** | Future implementation uses a **separate feedback table**. | ✅ **YES** |

### 7.1 What this Owner decision means

- It **accepts the policy direction** described in this record and in
  `v2_d2_client_feedback_policy.md` as the approved blueprint for a future build.
- It **closes the policy-decision stage** (Checkpoints C → D) for V2-D2.

### 7.2 What this Owner decision does NOT mean — explicitly

- ⛔ **Not implemented.** No code, RLS, SQL, migration, table, UI, test, connector, or
  secret was created or changed. No production/staging connection was made.
- ⛔ **Does not authorize building now.** Implementation remains a **future, separately
  Owner-gated phase**. It should still follow a *VERIFIED* Checkpoint B (live RLS behavior
  observed on a disposable staging env), which is currently 🔴 BLOCKED (no disposable
  staging env). The Owner approving the *policy* does not unblock or skip that verification.

### 7.3 Invariants preserved by this decision (unchanged)

The Owner decision explicitly **preserves** every safety invariant — none is relaxed:

- **Client feedback cannot mutate Core `approval_status` directly.** Only an authenticated
  Owner/Internal action in the Core Approvals UI transitions approval state.
- **Approved-like feedback is metadata only** (Decision B) — never an auto-approve; a human
  Owner/Internal confirmation is required before any real approval state change.
- **Rejected-like / needs_revision-like feedback is metadata or a feedback record only** —
  it flags the item for human review; it never transitions `approval_status` on its own.
- **Client viewer remains read-only** (Decision C) — no write path by default.
- **PC2 / module callbacks remain metadata / log / echo only** — non-authoritative by
  contract; a callback can never approve/reject or impersonate a human role.
- **No feedback- or callback-driven posting, ads, messaging, or customer contact.** Publish
  stays Owner-only and manual; no client/callback path triggers any external action.

---

## 8. Status & Next Steps

- **Checkpoint C:** ✅ **docs/spec COMPLETE (PROPOSED policy authored).**
- **Checkpoint D:** ✅ **DONE — Owner decision recorded (A=YES, B=YES metadata-only, C=YES,
  D=YES). Policy-decision stage CLOSED.**
- **Future implementation phase:** 🔴 **NOT STARTED / Owner-gated** — building the
  `client_feedback` table, RLS, and UI is a separate future phase requiring explicit Owner
  approval, and should follow a *VERIFIED* Checkpoint B (currently BLOCKED).
- **No implementation was done.** No SQL, RLS, code, tests, connectors, secrets, or
  production/staging connection.

**Next recommended checkpoint:** a future, separately Owner-gated **implementation phase**
(design + Codex-review the `client_feedback` table and scoped RLS, then build behind the
approved policy) — to begin only after a *VERIFIED* Checkpoint B (disposable staging env
provisioned so live RLS behavior can be observed). Until then, the status quo holds and no
build proceeds.
