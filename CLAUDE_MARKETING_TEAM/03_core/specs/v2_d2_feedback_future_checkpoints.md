# V2-D2 — Client Feedback Future Checkpoints (F–J)

**Status:** 🟡 **OUTLINE ONLY — all checkpoints NOT STARTED / Owner-gated.**
**Workstream:** Post-MVP / Ver2 — V2-D2, follow-on to Checkpoint E (implementation plan).
**Date:** 2026-06-15
**Authored by:** PC1 (Claude Code Builder).
**Companion:** `v2_d2_feedback_implementation_plan.md` (the plan these checkpoints execute).

> **Scope guard:** Outline/specification only. Defines the *future* gated checkpoints; it
> implements nothing. Each checkpoint below begins **only** after explicit Owner approval, and
> the build checkpoints (G+) additionally require a *VERIFIED* Checkpoint B (disposable
> staging env) — currently 🔴 BLOCKED.

---

## Global invariants (apply to every checkpoint F–J)

These never relax, regardless of checkpoint:

- Client/viewer feedback can **never** mutate Core `approval_status`. Only an authenticated
  Owner/Internal action in the Core Approvals UI transitions approval state.
- **Client viewer remains strictly read-only** (no feedback/comment/revision/approved-like/
  rejected-like/needs_revision-like; no approval mutation).
- **Client approver** may submit feedback / request revision; **approved-like is metadata
  only**, requiring Core Owner/Internal confirmation before any real approval state change.
- **PC2 / module callbacks remain metadata / log / echo only** — non-authoritative, never
  impersonate a client/human role, never set approval state.
- No feedback- or callback-driven posting, ads, messaging, or customer contact.
- No secrets; no connectors enabled; no production-first changes; staging-first verification.

---

## Checkpoint F — Migration Draft (🔴 NOT STARTED / Owner-gated)

- **Scope:** Draft the additive, idempotent `client_feedback` migration (enum types, table,
  RLS `ENABLE` + policies, hierarchy validator) as a **reviewable artifact**.
- **Allowed changes:** Add a new draft migration file under `03_core/database/` **plus** spec
  notes. The draft is **authored but NOT applied** to any database.
- **Hard boundaries:** Do NOT run the migration; do NOT connect to production/staging; do NOT
  modify existing migrations; do NOT touch repository/UI/tests; no secrets. Legacy Phase-2
  tables untouched. Migration must be additive + idempotent (`DROP ... IF EXISTS`, `IF NOT
  EXISTS`), never destructive.
- **Validation:** `npm run build` + `npm run test` stay green (no code paths reference the new
  table yet); SQL is lint/structure-reviewed only (not executed).
- **Codex review expectations:** additivity/idempotency; RLS predicates use the scoped helper
  family (no broad OR-scope bypass); viewer excluded from INSERT; client INSERT tenant-scoped;
  inactive/expired denied; hierarchy validation present; no approval column writable by feedback.

---

## Checkpoint G — Staging RLS Verification (🔴 NOT STARTED / Owner-gated)

- **Scope:** Apply the Checkpoint F draft on a **disposable staging** project and run the RLS
  matrix to verify behavior. **Requires a VERIFIED Checkpoint B first** (disposable staging
  env provisioned).
- **Allowed changes:** Run the migration on staging only; record results in an evidence
  report under `08_logs/`. No product code changes.
- **Hard boundaries:** Disposable staging only — never production; fictional/throwaway data
  only; secret values never printed/committed; no connectors; if the staging env is missing,
  **STOP and document** (no fake verification).
- **Validation:** RLS matrix per role × operation × tenant: client INSERT only in own tenant;
  **viewer INSERT always denied**; cross-tenant denied; inactive/expired denied; callback path
  cannot set approval or impersonate client; scoped reads only.
- **Codex review expectations:** evidence is real (not fabricated); every matrix cell has a
  PASS/FAIL + evidence; any failure blocks H; verdict is honest (BLOCKED if env absent).

---

## Checkpoint H — Repository / API Implementation (🔴 NOT STARTED / Owner-gated)

- **Scope:** Implement `ClientFeedbackRepository` (interfaces + Supabase/local repos +
  `repoRouting.ts` gate `feedbackScopeIsSupabaseSafe` + `repositoryFactory.ts` selection),
  with safe `create`/`list` and **no** client `update`/`delete`.
- **Allowed changes:** New repository code + routing/factory wiring + unit/repository tests.
  Permission helper `canSubmitClientFeedback` (owner/manager/client; **not** viewer).
- **Hard boundaries:** No UI yet; no change to approval workflow or `approval_status` machine;
  `create` must reject viewer and out-of-scope tenants; server-derives actor identity/source
  (caller cannot spoof); local/`*-` ids never routed to Supabase; no secrets.
- **Validation:** `npm run build` PASS (0 TS errors); new unit + repository tests PASS;
  existing 45 tests stay green; UUID-gating tests cover full chains + local ids.
- **Codex review expectations:** viewer cannot reach `create`; no `update`/`delete` on client
  interface; defense-in-depth UUID gating matches RLS; no approval-mutating method; types sound.

---

## Checkpoint I — UI Implementation (🔴 NOT STARTED / Owner-gated)

- **Scope:** Build the "Client Feedback" panel: labeled client feedback entry for approvers,
  read-only for viewers, approval controls owner/internal-only and visually separated.
- **Allowed changes:** Component/UI changes + presentation; wire to the Checkpoint H repository.
- **Hard boundaries:** Viewer sees **no** composer/controls; approval buttons render only for
  owner/manager (`canApproveContent`); "approved-like" never renders as "Approved"; no publish/
  ads/send anywhere; no connectors; no secrets; no change to approval authority.
- **Validation:** `npm run build` PASS; tests green; UI role-visibility checks (viewer
  read-only; client composer but no approval buttons; owner/manager approval controls).
- **Codex review expectations:** role-gated rendering correct; client feedback never confusable
  with final approval; Human Approval Checklist stays owner/internal-controlled.

---

## Checkpoint J — Manual E2E & Demo Evidence (🔴 NOT STARTED / Owner-gated)

- **Scope:** Owner-executed manual E2E across roles on staging; capture evidence; produce a
  demo/closure pack. Closes the feedback feature only on filed evidence + logged Owner approval.
- **Allowed changes:** Evidence report + checklist/demo docs under `08_logs/` / runbooks.
- **Hard boundaries:** Controlled use only — no live connectors, no auto-post/ads/messaging,
  no real customer contact; approval authority unchanged; viewer read-only confirmed in practice.
- **Validation:** E2E checklist executed by Owner (client approver submits feedback; viewer
  cannot; owner/internal confirms approval separately); callback safety regression re-run;
  results recorded.
- **Codex review expectations:** evidence complete and honest; no boundary crossed; verdict
  matches what actually ran (no fabricated PASS); sign-off logged.

---

## Sequencing & gating summary

```
E (plan, done) → F (migration draft) → G (staging RLS verify) → H (repo/API)
  → I (UI) → J (manual E2E + evidence)
```

- Each arrow is an **explicit Owner gate**; nothing auto-proceeds.
- **F → G** also requires a *VERIFIED* Checkpoint B (disposable staging env) — currently BLOCKED.
- Codex audit runs at each build checkpoint (F–I) and a final pass before/at J.
- **All of F–J are NOT STARTED.** No implementation exists yet.
