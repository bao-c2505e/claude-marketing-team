# Phase B5 — Report Draft V1 FnB Output Quality Tuning

**Date:** 2026-06-18
**Status:** ✅ DONE (committed, not pushed — Owner pushes per repo convention)
**Scope:** Prompt/copy tuning + exact-five enforcement for the Report Draft V1
local fallback (`src/lib/core/reportFactory.ts`) and the n8n activation runbook
system prompt. **No workflow behavior, webhook URL, approval state machine,
Supabase UUID gate, localStorage fallback, or metadata semantics changed.**

---

## Goal

Make the 5 generated Report Draft V1 approval items read like a senior agency
strategist prepared them for a Vietnamese FnB client — modern, client-friendly,
helping the Owner understand what to check next — while staying strictly safe: no
live analytics, no claimed data-source access, no invented metrics, no fake
numbers/testimonials.

## Key architecture fact (unchanged from B1–B4)

Production AI quality comes from a real OpenAI node whose prompt lives **in n8n
(server)**, NOT in the repo. The repo workflow JSON
`n8n-workflows/report_draft_v1.workflow.json` ships only a deterministic
"AI Provider Placeholder" stub (left **UNCHANGED**). So the two prompt/copy
surfaces the repo controls are:
1. Core local fallback `src/lib/core/reportFactory.ts`.
2. A runbook prompt-spec the Owner pastes into the production n8n OpenAI node.

---

## Files changed (3)

| File | Change |
|---|---|
| `src/lib/core/reportFactory.ts` | Senior-FnB Vietnamese defaults (`fnbReportDefaults`), 12-element Vietnamese caption, `createFallbackReportItem`, `normalizeReportItems` exact-five, `mapReportItem` rewrite. |
| `src/lib/core/reportFactory.test.ts` | Exact-five tests (cap/pad/empty + non-array reject), `unsafeReportCopy` fake-metric safety guard, data-source-status assertion, new caption-field assertions. |
| `CLAUDE_MARKETING_TEAM/07_runbooks/report_draft_v1_activation_runbook.md` | Path-B senior-FnB Vietnamese OpenAI system prompt, expanded Normalize node field list + exact-five note, refreshed "Expected 5 output items" description. |

No unrelated modules touched.

---

## Prompt / report quality changes

Each report draft now carries the full senior-FnB spec block (modern Vietnamese
agency tone, local-restaurant-friendly). The 12 required elements, all present per
item:

1. **Report objective.**
2. **Reporting period** — owner-provided placeholder ("Owner cấp ngày…"), never a
   guessed date.
3. **Data source status** — names all four states explicitly: **Provided data /
   Simulated data / Missing data / Owner input required**; states plainly that no
   platform data was pulled and no number was invented.
4. **Executive summary draft** — qualitative, no invented numbers.
5. **Key observations** — based only on data in Core, else clearly labelled as
   assumption / "cần Owner cấp".
6. **Content & creative review section** (qualitative; no fabricated engagement).
7. **Campaign/ads review section** — draft only, no fake performance numbers
   (explicitly "không bịa CPM/CPC/CTR/ROAS/tiếp cận").
8. **Customer/order insight section** — only filled when Owner supplies data;
   otherwise left empty with a note, never fabricated.
9. **Recommended next actions.**
10. **Questions for owner/client before finalizing.**
11. **Owner approval checklist.**
12. **Safety label** — "Draft report only · Pending approval · No live analytics
    pull · No unverified metrics · Not published."

The 5 specs (keys/titles unchanged so the workflow contract holds):
`campaign_status_summary` · `performance_insight` · `content_creative_review` ·
`risks_learnings_actions` · `report_handoff`.

**Metric-safe by construction:** never pulls/claims access to Meta/TikTok/Zalo/
Google/GA4/POS/ShopeeFood/GrabFood/CRM data; never invents spend / revenue / ROAS
/ clicks / impressions / reach / views / likes / comments / messages / orders /
conversion rate / customer counts / testimonials; the local fallback contains zero
numeric figures. Missing figures stay labelled "Owner cấp" / "Assumption:" (never
the generic "Owner to confirm"). `data_status` is force-filled to the
no-live-analytics statement even if an n8n response omits it, so a report draft can
never imply real platform data was pulled.

`fnbReportDefaults()` is shared by the local fallback and by `mapReportItem`'s
per-field fallbacks, so an n8n response that omits fields still reads like a senior
strategist wrote it and stays metric-safe.

---

## Exact-five enforcement status — ✅ IMPLEMENTED

`runReportFactory` now:
- **Non-array `items`** → throws `ReportFactoryError` (contract breach).
- **Empty / short array** → padded with safe fallback report drafts (was: threw on
  empty; old throw-on-empty test removed).
- **Overlong array** → capped to the first 5.

Done via `normalizeReportItems()` (drop non-object entries → `slice(0, 5)` → pad
with `createFallbackReportItem` for the remaining canonical specs), mirroring
B2/B3/B4. Padded/capped items keep correct n8n provenance (`source: n8n`,
`generation_mode: external_module`). `job.item_count` is always 5.

---

## Tests added/updated — 7 report tests (was 4); suite 75/75 (was 72)

- payload approval-first / analytics-free (unchanged).
- local fallback → 5 items + all 12 caption labels + 4 data-source-status states +
  safety label + `/no live analytics/` present + no `unsafeReportCopy` + no
  "Owner to confirm".
- n8n provenance → now normalizes to exactly 5 (2 returned → padded), provenance +
  no-live-analytics + fake-metric guard on every item.
- **NEW** cap >5 → exactly 5.
- **NEW** pad short → exactly 5 (returned first, canonical specs appended in order).
- **NEW** pad empty → exactly 5.
- **NEW** non-array `items` → rejected as contract breach.
- **NEW** `unsafeReportCopy` regex guard (no "pulled live analytics / fetched from
  GA4·Meta·TikTok·Zalo·GrabFood·ShopeeFood·POS·CRM / connected to <source> /
  ROAS·CTR·CPC·CPM·reach·impressions·conversion-rate = <number> / <number>
  orders·messages·leads·clicks / report sent to client / posts published / ads
  launched").

---

## Safety constraints preserved

- Approval-first only — every item `status: needs_review`, `owner_approval_required`.
- Output count: exactly **5** report draft approval items (now enforced).
- Same Core callback/normalize behavior; same pending-approval item creation.
- Metadata semantics unchanged: `workflow_type=report_draft`,
  `content_type=report_draft`, `source=n8n`, `generated_by=n8n-ai-provider`,
  `generation_mode=external_module`.
- Draft/spec only. No live analytics pull, no live connector, no fake metrics, no
  fake spend/revenue/ROAS/clicks/impressions/reach/orders/messages/conversion/
  customer counts, no image/video generation, no claim of published/launched/sent.
  Payload shape unchanged (`pull_live_analytics:false`,
  `use_unverified_metrics:false`, `generate_images:false`, `generate_videos:false`,
  all `no_*` safety flags true). No secret / real-webhook changes.

---

## Validation results

- `git diff --check`: clean (no whitespace errors; only benign LF→CRLF notices).
- `npm run build`: **PASS** — entry `index` 357.71 kB (gzip 89.67), no >500 kB
  warning; vendor 175.77 kB, vendor-supabase 204.73 kB.
- `npm run test`: **PASS — 75/75** (reportFactory 7).
- `node contracts/tools/validate_contracts.js`: **ALL PASS**.
- Secrets/real-webhook scan on changed files: **clean** (only
  `n8n.example.com` test placeholders).

---

## n8n production: does it need a manual prompt update?

**Yes, to get the new quality live in production.** The repo workflow JSON was
**not** changed → no n8n re-import needed. But production AI text is produced by
the n8n OpenAI node (Path B), not the repo. To get the new senior-FnB report
drafts in production, the Owner should paste the updated **Section 2 system
prompt** from `07_runbooks/report_draft_v1_activation_runbook.md` into the existing
production OpenAI node (n8n-only edit — **no Core redeploy, no Vercel env change,
webhook URL unchanged**). Until then:
- Local fallback / dev / demo already show the new FnB output + exact-five.
- Production (if/when activated) keeps the old prompt text until the Owner pastes
  the new one. Core still force-fills/normalizes any missing fields to the new
  senior-FnB defaults, forces the no-live-analytics data status + safety lines, and
  enforces exactly 5 — so even the old/placeholder response stays specific,
  Vietnamese, metric-safe, correctly labelled, and capped at 5.

Production activation of Report Draft remains **Owner-gated** (no Vercel env set).

---

## Recommended next phase

- **B-series complete:** all five AI Factory V1 modules (Content / Design / Video /
  Ads / Report) are now FnB-quality-tuned with exact-five enforcement and a
  safety-regression guard. A natural close is a short **B6 roll-up** verifying all
  five modules together (build/test/contracts) + a one-page Owner activation
  summary listing the 5 system prompts to paste into n8n.
- **Optional cleanup:** extract the per-file `unsafeExecutionCopy` /
  `unsafeReportCopy` regexes into one shared test helper
  (`src/lib/core/factoryTestGuards.ts`) reused across all factory suites.
- **Activation (Owner-gated):** if/when the Owner wants any module live, follow its
  activation runbook (Path A placeholder first, then Path B with the new prompt).
