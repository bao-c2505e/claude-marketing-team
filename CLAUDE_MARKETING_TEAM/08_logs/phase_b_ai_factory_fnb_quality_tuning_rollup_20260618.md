# Phase B — AI Factory V1 FnB Output Quality Tuning (Rollup)

**Date:** 2026-06-18
**Status:** ✅ ALL B1–B5 DONE (committed, not pushed — Owner pushes per repo convention)
**Type:** Documentation/rollup only — no code, no n8n workflow, no secrets changed.
**Scope:** Records that all 5 AI Factory V1 modules now produce senior-quality
Vietnamese FnB output while keeping every approval-first safety boundary intact.

---

## 1. Summary of B1–B5

Phase B took each of the 5 AI Factory V1 modules and tuned **prompt/copy only** so
the generated approval items read like they were prepared by a senior Vietnamese
FnB specialist (local restaurants / street food / cà phê / trà sữa / chè / cơm tấm
/ bún đậu / Vị Cuốn-style brands) — not generic AI — while remaining strictly
draft/spec and approval-first.

**Key architecture fact (applies to all 5):** production AI quality comes from a
real OpenAI node whose prompt lives **in n8n (server)**, NOT in the repo. Each repo
workflow JSON ships only a deterministic "AI Provider Placeholder" stub (left
**UNCHANGED** in every phase). So the two prompt/copy surfaces the repo controls
are: (1) the Core local fallback in `src/lib/core/<module>Factory.ts`, and (2) a
runbook prompt-spec the Owner pastes into the production n8n OpenAI node.

| Phase | Module | Commit | Local fallback source | Runbook |
|---|---|---|---|---|
| **B1** | Content Factory V1 | `c929caf` | `src/lib/core/contentFactory.ts` | `07_runbooks/content_factory_v1_activation_runbook.md` |
| **B2** | Design Factory V1 | `4e5663c` | `src/lib/core/designFactory.ts` | `07_runbooks/design_factory_v1_activation_runbook.md` |
| **B3** | Video Scripts V1 | `ff8c689` | `src/lib/core/videoFactory.ts` | `07_runbooks/video_scripts_v1_activation_runbook.md` |
| **B4** | Ads Pack Draft V1 | `74bc496` | `src/lib/core/adsFactory.ts` | `07_runbooks/ads_pack_v1_activation_runbook.md` |
| **B5** | Report Draft V1 | `c2d4ef0` | `src/lib/core/reportFactory.ts` | `07_runbooks/report_draft_v1_activation_runbook.md` |

Common pattern applied in B2–B5: a shared senior-FnB Vietnamese `fnb*Defaults()`
helper feeds both the local fallback and the per-field fallbacks in `map*Item`, so
an n8n response that omits fields still reads like a real specialist wrote it; a
multi-element Vietnamese caption spec block; **exact-item-count enforcement** via a
`normalize*Items()` function; and a `unsafe*Copy` safety-regression test guard.
B1 established the senior-FnB tone + honest-by-construction approach; B2 added
exact-five; B3–B5 carried both forward and added the safety-regression guard.

Per-phase detail logs:
- `08_logs/content_factory_v1_fnb_quality_tuning_20260618.md`
- `08_logs/design_factory_v1_fnb_quality_tuning_20260618.md`
- `08_logs/video_scripts_v1_fnb_quality_tuning_20260618.md`
- `08_logs/ads_pack_v1_fnb_quality_tuning_20260618.md`
- `08_logs/report_draft_v1_fnb_quality_tuning_20260618.md`

---

## 2. Each module's output type and exact item count

| Module | Output type | `workflow_type` | `content_type` | Exact item count |
|---|---|---|---|---|
| Content Factory | 7-day content pack | `content_pack` | `content` | **7-day content pack** (7 items / daily plays) |
| Design Factory | Design brief items | `design_factory` | `design_brief` | **exactly 5** design brief items |
| Video Scripts | Video script items | `video_scripts` | `video_script` | **exactly 5** video script items |
| Ads Pack Draft | Ads draft items | `ads_pack` | `ads_draft` | **exactly 5** ads draft items |
| Report Draft | Report draft items | `report_draft` | `report_draft` | **exactly 5** report draft items |

**Exact-count enforcement (Design / Video / Ads / Report):** each module's
`normalize*Items()` caps an overlong n8n response to the first 5, pads a
short/empty response with safe fallback drafts, and the `run*Factory` throws only
on a non-array `items` payload (contract breach). So the Approval Board always
receives exactly the expected count; `job.item_count` matches; padded/capped items
keep correct n8n provenance (`source: n8n`, `generation_mode: external_module`).
Content Factory produces the 7-day pack as before (unchanged count).

---

## 3. Safety preserved (all 5 modules)

Every Phase B change was prompt/copy + count-normalization only. None of the
following changed in any phase:

- **Approval-first** — every generated item is created with `status: needs_review`
  and `owner_approval_required: true`; nothing is auto-approved.
- **Approved ≠ Published** — approving an item only marks the draft reviewed; it
  never posts, launches, schedules, spends, or sends anything.
- **No auto-post.**
- **No auto-ads** — Ads Pack is draft/spec only: no campaign/ad-set/ad/audience/
  budget creation, no launch, no spend, no live ad-account connection.
- **No image/video generation** — Design/Video are text/spec only.
- **No live analytics pull** — Report Draft never pulls or claims access to
  Meta/TikTok/Zalo/Google/GA4/POS/ShopeeFood/GrabFood/CRM data.
- **No fake metrics** — no invented spend/revenue/ROAS/clicks/impressions/reach/
  views/likes/comments/messages/orders/conversion/customer counts/testimonials;
  missing figures stay labelled "Owner cấp" / "Assumption" (never "Owner to
  confirm"). Honest-by-construction: prices/discounts/addresses/phones/awards are
  never invented either.
- **No live connectors** — no Meta/TikTok/Zalo/Google Ads/Canva/ComfyUI/Fal.ai
  calls; safety flags echoed in each payload.
- **No secrets / real webhook URLs committed** — only `n8n.example.com` test
  placeholders and `.env.example`-style names; OpenAI key stays only in n8n
  Credentials.

Also unchanged across B1–B5: workflow behavior, production webhook URLs, the
approval state machine, the Supabase UUID gate, and the localStorage fallback. The
per-item metadata footer semantics are preserved for every module
(`source: n8n` / `generated_by: n8n-ai-provider` / `generation_mode: external_module`
on the n8n path; `mock` / `core-local-mock` on local fallback), and
`workflow_type`/`content_type` are force-set to canonical constants so a
nonconforming AI response can never mislabel them. Safety-regression test guards
(`unsafeExecutionCopy` for Video/Ads, `unsafeReportCopy` for Report) assert no
unsafe "launched / published / spent / pulled-analytics / fabricated-metric"
language ever appears in captions.

---

## 4. Validation summary

Run at the close of B5 (current `main`, latest factory commit `c2d4ef0`):

- `git diff --check`: **clean** (no whitespace errors; only benign LF→CRLF notices).
- `npm run build`: **PASS** — entry `index` ~357.71 kB (gzip ~89.67), **no >500 kB
  warning**; `vendor` 175.77 kB, `vendor-supabase` 204.73 kB.
- `npm run test`: **PASS — 75/75** across 7 files (contentFactory 4, designFactory
  6, videoFactory 6, adsFactory 7, reportFactory 7, coreRepository 11,
  repoRouting 34).
- `node contracts/tools/validate_contracts.js`: **ALL PASS**.
- Secrets / real-webhook scan on every Phase B diff: **clean**.

(This rollup is docs-only; the build/test/contract figures above are re-verified at
commit time and reported in the final response.)

---

## 5. Manual n8n production prompt update note

**Important — production quality is NOT automatically upgraded by these commits.**

- **Repo workflow JSON was not changed** in any Phase B commit (the
  `n8n-workflows/*_v1.workflow.json` files still ship the deterministic placeholder
  stubs).
- **No re-import needed** — n8n workflows are untouched.
- **No Core redeploy needed** — the local fallback already shows the new FnB
  quality in dev/demo, and `map*Item` normalizes/force-fills any n8n response.
- **No Vercel env change needed** — webhook URLs and env vars are unchanged.
- **Owner action required for production parity:** to make a *production* module
  (one whose `VITE_N8N_*_WEBHOOK_URL` is set and whose n8n workflow uses a real
  OpenAI node) produce the new senior-FnB quality, the Owner must **manually paste
  the upgraded Section 2 system prompt** from that module's activation runbook into
  the corresponding production n8n OpenAI node. This is an **n8n-only edit** — no
  Core redeploy, no Vercel change, webhook URL unchanged.
- Until the Owner pastes the new prompt, a production module keeps its old prompt
  text, **but Core still enforces exact item count and force-fills missing fields
  with the new senior-FnB defaults + safety lines** — so output stays specific,
  Vietnamese, correctly labelled, and count-capped regardless.
- **Production activation of every module remains Owner-gated** (no
  `VITE_N8N_*_WEBHOOK_URL` is set in production today; all modules run on local
  fallback).

The 5 runbooks each contain the ready-to-paste prompt (Path B, Section 2) plus the
Normalize-node field list and exact-count note.

---

## 6. Recommended next phase

The B-series is complete: all 5 AI Factory V1 modules are FnB-quality-tuned with
exact-count enforcement and safety-regression guards. Options:

- **Owner activation pass (Owner-gated):** when desired, activate any module via its
  runbook — Path A (placeholder round-trip) first to validate the Core→n8n
  `external_module` path safely, then Path B (real OpenAI node + the new prompt) for
  live AI quality. Key stays only in n8n Credentials.
- **C-series candidate — UX surfacing of the richer drafts:** the Approval Board /
  detail view could render the new multi-element caption spec blocks more
  legibly (sectioned layout) since items now carry far more structured content.
  Presentation-only, no behavior change.
- **Optional tech cleanup:** extract the duplicated `unsafeExecutionCopy` /
  `unsafeReportCopy` regexes into one shared test helper
  (e.g. `src/lib/core/factoryTestGuards.ts`) reused across all factory suites.
