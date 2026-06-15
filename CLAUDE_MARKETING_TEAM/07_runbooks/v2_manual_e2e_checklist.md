# V2 Manual E2E Checklist — The Core Agency

**Work package:** V2-D1.5 (manual E2E verification prep) — documentation/checklist only.
**Date:** 2026-06-12
**Baseline:** Core MVP 18/18 closed; V2-A/V2-B/V2-C DONE/PASS; V2-D1 audit & runbook DONE; **V2-D2 staging execution 🔴 NOT STARTED, Owner-gated**. PC2 n8n/modules workstream at **N12 post-merge cleanup (integration-ready handoff, `stabilized_mock_ready`)**. Latest reviewed commit: `3c8f853`. Build 0 TS errors; tests 45/45.

> **Scope guard:** This is a manual verification checklist. Running it does **not** create a Supabase staging project, run SQL, connect to any database, add secrets, or enable any connector. It exercises the Core UI in its default **Local Data Only** mode (browser localStorage) and inspects PC2 callback artifacts as **read-only JSON metadata**. Nothing posts, sends, spends, or messages anywhere.

> **Companion docs:** `V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` (broad 28-item UI QA), `V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md` (Supabase staging — Owner-gated), `V2E_CORE_PC2_MAPPING_SPEC.md` + `V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md` (Core↔PC2 contract). This checklist focuses on **tenant scope, approval-state safety, and PC2 callback-as-metadata** with explicit evidence capture.

---

## 1. Purpose and scope

**Purpose:** Give the Owner/tester a repeatable, evidence-producing manual pass that proves the Core data flow (client → brand → campaign → brief → generation → content items → assets → approval) is correctly tenant-scoped, that approval state only changes via authenticated Core UI actions, and that any PC2 callback/module output is displayed as **non-authoritative metadata** that never mutates Core approval state.

**In scope:**
- Core UI CRUD + read scoping for the wired entities.
- Approval-state safety (generated stays generated; pending stays pending unless a human acts in Core UI).
- PC2 callback **preview** artifacts treated as metadata only.
- localStorage-vs-Supabase UUID gating expectations (in Local mode, all ids are local-format).

**Out of scope (do NOT do here):**
- Creating/connecting a Supabase staging project or running any SQL (that is V2-D2, Owner-gated — see §6 stop conditions).
- Live n8n calls, real connectors, real ads/posting/messaging.
- Any code/test/repository/RLS change.

---

## 2. Preflight checks

Run before every pass. Record results in the evidence table (§5).

| # | Check | Command / action | Pass condition |
|---|---|---|---|
| PF1 | Branch & sync | `git status -sb` | On `main`, `## main...origin/main` with no divergence (or a known docs-only WIP) |
| PF2 | Latest commit | `git log --oneline -1` | Matches the expected reviewed commit (e.g. `3c8f853` or later reviewed) |
| PF3 | Build | `npm run build` | PASS — 0 TS errors |
| PF4 | Tests | `npm run test` | PASS — 45/45 |
| PF5 | No secrets | `git grep -nEi "service_role|sk-[a-z0-9]|VITE_SUPABASE_ANON_KEY=ey" -- . ':!*.example'` (expect nothing real) | Only `.env.example` placeholders; no real keys tracked |
| PF6 | No live connectors | Open **Connector Registry** tab | All connectors shown **registered / disabled** — none ACTIVE/connected |
| PF7 | Data mode | Inspect header badge | **"Local Data Only"** (amber). If "Supabase Data" appears unexpectedly, STOP and check env |
| PF8 | No staging SQL | Confirm V2-D2 checkpoint A status | **No SQL is run** unless Owner **checkpoint A** is explicitly logged in the V2-D2 record. Default: not logged → no SQL, ever, this pass |

> **PF8 is a hard gate.** If checkpoint A is not logged in `08_logs/` / the V2-D2 record, this pass stays 100% in Local mode. Do not set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.

---

## 3. Manual scenario checklist — Core UI

Sign in with the demo account (`owner@thecore.agency` / `demo1234`, pre-filled in Local mode). All ids created in Local mode are **local-format** (`client-*`, `brand-*`, `campaign-*`, `brief-*`, `generation-*`/`job-*`, `item-*`, `asset-*`, `col-*`) — that is correct (see §3.10).

| # | Scenario | Action | Expected result | Scope/safety assertion |
|---|---|---|---|---|
| S1 | **Client create/read** | Clients tab → create a client → reload | Client persists; appears in lists/dropdowns | Root tenant entity; new id is `client-*` (local) |
| S2 | **Brand create/read (scoped to client)** | Brands tab → create a brand under the S1 client → reload | Brand persists under that client only | Brand carries `client_id`; not visible under a different client |
| S3 | **Campaign create/read (scoped to brand/client)** | Campaigns tab → create a campaign for S1 client + S2 brand → reload | Campaign persists with computed duration; scoped to client+brand | Carries `client_id`+`brand_id`; duration is a number (not NaN) |
| S4 | **Brief create/read (scoped to campaign/brand/client)** | Brief Intake tab → create a brief for the S3 campaign → reload | Brief persists with full parent chain | Carries `client_id`+`brand_id`+`campaign_id`; editing cannot re-parent it |
| S5 | **Generation / content items create/read** | Content Generation tab → select the S4 brief → run generation | Job + content items created; items land **`generated`**; persist on reload | Items inherit client/brand/campaign/brief scope; generation is mock/local |
| S6 | **Asset + asset collection scope** | Asset Library tab → create a collection + an asset under S1 client/S2 brand → edit asset | Create/edit/archive work; in edit mode Client/Brand/Campaign are **disabled (immutable)** | Asset carries `client_id`+`brand_id` (+ optional deeper nulls); collection is brand-scoped |
| S7 | **Approval — pending/generated behavior** | Approvals tab → submit an S5 item → as approver leave it un-acted, then reload | Submitted request shows **pending**; the item stays **`generated`**; nothing auto-advances | **No state change without an explicit authenticated Core UI action** |
| S8 | **Approval — human action** | Approve one item; request changes on another; add a comment | Status changes only on the clicked action; trail records the event + actor | Transition source = authenticated Core UI action (the only approval authority) |
| S9 | **Callback / module output display = metadata only** | Open any surface that shows PC2/module output (e.g. Automation Logs / a callback preview JSON) | Module output/status shown as **read-only metadata/notes**; no button mutates approval from here | Callback content is non-authoritative (see §4) |
| S10 | **UUID gating expectations** | With DevTools console open, repeat S1–S8; watch network/console | In Local mode: zero Supabase network calls; all ids local-format; no errors | localStorage path only; UUID gates would route local ids to localStorage even if Supabase were ON |

### 3.10 localStorage-vs-Supabase UUID gating expectations (reference)

- **Local mode (this pass):** Supabase is unconfigured → `isSupabaseConfigured = false` → every repository call uses the localStorage implementation. All ids are local-format. No UUID ever required.
- **If Supabase were ON (V2-D2 only, not now):** `repoRouting.ts` gates (`assetScopeIsSupabaseSafe`, `approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`) route any operation whose scope ids are local-format **back to localStorage**, per operation — so a browser with pre-existing local data never sends `client-*`/`col-*`/etc. into a Supabase UUID column. Observing local data "stay local" with Supabase ON is **correct behavior, not a bug**.
- **Assertion for this pass:** no local-format id appears in any Supabase network payload (there are none in Local mode), and `npm run test` 45/45 (gates unchanged).

---

## 4. PC2 callback preview checklist

PC2 callback artifacts are **preview JSON** produced by the PC2 mock backbone (n8n + module stubs). Core is a static frontend with **no HTTP listener** — there is no live webhook; any callback is a JSON artifact inspected manually/read-only. **Callbacks are non-authoritative**: they may only (a) validate payload consistency, (b) log/record status, (c) record module output/error metadata, (d) echo a decision that **already exists** in Core, (e) attach review notes. **A callback never mutates Core approval state.**

| # | Callback case | PC2 status string | Expected Core-side handling | Must NOT happen |
|---|---|---|---|---|
| C1 | **Approved → ready for preview** | `ready_for_mock_callback_preview` (N8 approval-gate mock, `source: n8n_n8_approval_gate_mock`) | Indicates the N8 mock gate saw an **already-approved-in-Core** decision and is ready to emit a preview. Echo only — Core approval state was set by a human in Core UI beforehand | Callback creating or flipping an approval to `approved` |
| C2 | **Final mock success** | `final_status: "completed_mock"` (N11/N12 E2E terminal) | Recorded as the E2E mock pipeline's final status; module outputs attach as metadata to the (already-existing) generation/items | `completed_mock` treated as an approval shortcut — it is **not** an approval |
| C3 | **Failure / error route** | `final_status: "failed_mock"` (module failed), or N9 error/retry/dead-letter objects | Logged as a failure/error metadata record; routed to the failure/dead-letter log surface; **never enters the approval flow** | A failed/error callback touching approval state at all |
| C4 | **needs_revision / rejected-like** | `needs_revision` / `rejected` (PC2 metadata) | Recorded as **callback metadata flagged for human review** — a note, not a transition. Any actual `revision_requested`/`rejected` state must come from an authenticated Core UI action | Importing the callback auto-setting the Core item/approval to `revision_requested`/`rejected` |
| C5 | **No callback-driven mutation (umbrella)** | any | For every case above: item stays `generated`, approval stays `pending`, unless/until a human acts in Core UI | Any Core approval/item state change attributable to a callback rather than a Core UI action |

**Mapping note (from V2-E spec, for reference — do not change here):** in the unified vocabulary, `published`/`planned_publish` are **BLOCKED** (planning-only, no route); a callback claiming `approved` still lands the item `generated` + approval `pending` with a mismatch **warning**, not an apply.

---

## 5. Evidence capture table

Fill one row per executed step (PF1–PF8, S1–S10, C1–C5). Save as `08_logs/v2_manual_e2e_evidence_YYYYMMDD.md` (see §7 naming).

| Step | Actor | Expected state | Screenshot/log evidence | Pass/Fail | Notes |
|---|---|---|---|---|---|
| PF3 | Tester | build PASS, 0 TS errors | `v2e2e-20260612-pf3-build.png` | | |
| PF4 | Tester | tests 45/45 | `v2e2e-20260612-pf4-test.png` | | |
| PF7 | Tester | "Local Data Only" badge | `v2e2e-20260612-pf7-badge.png` | | |
| S1 | Owner | client persists (`client-*`) | `v2e2e-20260612-s1-client.png` | | |
| S4 | Owner | brief carries client/brand/campaign | `v2e2e-20260612-s4-brief.png` | | |
| S5 | Owner | items land `generated` | `v2e2e-20260612-s5-generated.png` | | |
| S7 | Owner | request `pending`, item still `generated` | `v2e2e-20260612-s7-pending.png` | | |
| S8 | Owner | status changes only on click | `v2e2e-20260612-s8-approve.png` | | |
| C2 | Tester | `completed_mock` = metadata, not approval | `v2e2e-20260612-c2-callback.log` | | |
| C4 | Tester | needs_revision = review note only | `v2e2e-20260612-c4-metadata.log` | | |
| C5 | Tester | no callback-driven mutation | `v2e2e-20260612-c5-no-mutation.png` | | |

*(Add rows for every step actually run; empty Pass/Fail = not yet executed.)*

---

## 6. Stop conditions (halt the pass immediately)

Stop, record, and escalate to the Owner if **any** of these occur:

1. **SQL before checkpoint A** — any attempt to run SQL, apply a migration, or connect to a database while V2-D2 checkpoint A is not logged.
2. **Secret exposure** — any real key/credential found in tracked files, console, screenshots, or logs (redact + rotate per V2-D1 §3).
3. **Connector activation** — any connector shown as ACTIVE/connected, or any control that initiates real outbound traffic.
4. **Approval mutated by callback** — any Core approval/item state change attributable to a PC2 callback rather than an authenticated Core UI action (violates §4 C5).
5. **Tenant/scope mismatch** — an entity readable/writable outside its client/brand/campaign/brief scope, or a child re-parented to another tenant.
6. **Build/test failure** — `npm run build` or `npm run test` fails (record the output; do not "fix forward" inside this pass).

A stop condition makes the pass **FAIL**; file an unresolved-issue record (§7) and do not present/ship until resolved.

---

## 7. Evidence guide (naming + templates)

### 7.1 Screenshot naming convention
```
v2e2e-<YYYYMMDD>-<step>-<short-label>.png
```
- Example: `v2e2e-20260612-s7-pending.png`
- `<step>` = preflight/scenario/callback id (`pf3`, `s7`, `c2`). Lowercase. One concept per shot.
- Store under `08_logs/evidence/v2e2e-<YYYYMMDD>/`. Redact any URL/key before saving.

### 7.2 Log naming convention
```
v2e2e-<YYYYMMDD>-<step>-<short-label>.log     # captured console/JSON artifact
08_logs/v2_manual_e2e_evidence_<YYYYMMDD>.md  # the filled evidence table (§5)
```
- Callback artifacts saved verbatim as `.json`/`.log`; never edit them — they are evidence.

### 7.3 Demo result summary template
```markdown
# V2 Manual E2E — Result Summary — <YYYY-MM-DD> — <tester>
- Commit under test: <hash>
- Mode: Local Data Only (Supabase OFF) | checkpoint A logged? NO
- Build: PASS/FAIL (0 TS errors?)  | Tests: __/45
- Scenarios run: S1–S10 [pass count] | Callbacks: C1–C5 [pass count]
- Stop conditions hit: none | <list>
- Verdict: PASS / PASS WITH NOTES / FAIL
- Evidence folder: 08_logs/evidence/v2e2e-<YYYYMMDD>/
```

### 7.4 Owner sign-off template
```markdown
## Owner sign-off — V2 Manual E2E
- I reviewed the result summary and evidence dated: ______
- Approval safety confirmed: callbacks non-authoritative; no callback mutated Core state: YES / NO
- Tenant scoping confirmed across S1–S8: YES / NO
- Approved for: controlled internal/demo use only (no real posting/ads/messaging/connectors)
- Owner: __________  Date: __________
```

### 7.5 Unresolved issue template
```markdown
## Unresolved issue — V2 Manual E2E
- ID: V2E2E-<YYYYMMDD>-<n>
- Step: <PFx/Sx/Cx>   Severity: BLOCKER / polish
- Stop condition hit: <#1–6 or n/a>
- Expected: ______   Actual: ______
- Evidence: <files>
- Owner notified: YES/NO   Routed to: <V2-D2 / V2-E / bugfix / backlog>
```

---

## 8. Sign-off

| Role | Action | Status |
|---|---|---|
| PC1 (Claude Code) | Authored this checklist (docs-only) | ✅ DONE |
| Owner / tester | Execute §2–§4, file §5 evidence + §7.3 summary | ⬜ When scheduled |
| Owner | §7.4 sign-off → controlled use | ⬜ Pending execution |

**V2-D2 (Supabase staging execution) remains 🔴 NOT STARTED / Owner-gated — this checklist neither starts nor approves it.**
