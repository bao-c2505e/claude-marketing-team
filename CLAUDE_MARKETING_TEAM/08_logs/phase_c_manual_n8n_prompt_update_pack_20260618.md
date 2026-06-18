# Phase C — Manual n8n Prompt Update Pack / Owner Activation Pass (Log)

**Date:** 2026-06-18
**Status:** ✅ DONE / PASS — documentation/runbook only.
**Type:** Owner activation pack. No code, no n8n workflow JSON, no Core redeploy,
no Vercel env change, no secrets.
**Predecessor:** Phase B — AI Factory V1 FnB Output Quality Tuning ✅ PASS
(`08_logs/phase_b_ai_factory_fnb_quality_tuning_rollup_20260618.md`).

---

## 1. What Phase C delivered

A single Owner-facing activation pack that lets the Owner manually update the 5
production n8n OpenAI prompts with the upgraded Phase B FnB prompt quality —
copy → paste → Save → activate → smoke test — as an **n8n-only edit**.

**New file:**
- `07_runbooks/phase_c_manual_n8n_prompt_update_owner_activation_pass.md` — the
  activation pack. Sections A–G:
  - **A.** Owner checklist before editing n8n.
  - **B.** Manual update table for the 5 OpenAI nodes (workflow/node, source
    runbook + exact heading, paste target, expected count, smoke test, PASS/FAIL,
    rollback).
  - **C.** Five copy-paste prompt sections, each reproduced **verbatim** from the
    module's Phase B runbook (no new prompts invented).
  - **D.** Production smoke test plan (Core UI trigger only; no webhook exposure).
  - **E.** Expected output counts.
  - **F.** Rollback plan.
  - **G.** PASS/FAIL criteria.

---

## 2. Prompt provenance (extracted, not invented)

Every prompt in the pack is the exact upgraded prompt already in the Phase B
runbooks — confirmed against the source files:

| Module | Source runbook | Exact heading copied |
|---|---|---|
| Content Factory V1 | `07_runbooks/content_factory_v1_activation_runbook.md` | `## 1. Upgraded system prompt (paste into the n8n OpenAI node)` |
| Design Factory V1 | `07_runbooks/design_factory_v1_activation_runbook.md` | `## 2. (Path B only) Swap placeholder → real OpenAI node` → step 4 |
| Video Scripts V1 | `07_runbooks/video_scripts_v1_activation_runbook.md` | `## 2. (Path B only) Swap placeholder → real OpenAI node` → step 4 |
| Ads Pack Draft V1 | `07_runbooks/ads_pack_v1_activation_runbook.md` | `## 2. (Path B only) Swap placeholder → real OpenAI node` → step 4 |
| Report Draft V1 | `07_runbooks/report_draft_v1_activation_runbook.md` | `## 2. (Path B only) Swap placeholder → real OpenAI node` → step 4 |

Production workflow / node names verified against `n8n-workflows/*_v1.workflow.json`:
"Content Factory V1 - Content Pack", "Design Factory V1 - Design Briefs", "Video
Scripts V1 - Video Scripts", "Ads Pack Draft V1 - Ads Pack", "Report Draft V1 -
Report Draft" — each with an `AI Provider Placeholder` node that Path B replaces
with a real OpenAI node.

---

## 3. Per-module production status (captured in the pack)

- **Content Factory V1:** production-active (real OpenAI node via
  `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL`). The pack's prompt update is a direct
  paste-into-existing-node edit. Expected: **7-day content pack (7 items)**.
- **Design / Video / Ads / Report Draft V1:** Owner-gated. Production runs **Local
  fallback**; the n8n workflow still ships the deterministic `AI Provider
  Placeholder` (no real OpenAI node yet). The pack's prompt applies when the Owner
  runs that module's Path B activation (swap placeholder → real OpenAI node), or is
  pasted into an existing OpenAI node if one was already added. Expected: **exactly
  5 items each**.

This nuance is stated honestly in the pack so the Owner is not told to edit a
production OpenAI node that does not exist yet for those 4 modules.

---

## 4. Output counts (enforced by Core regardless of prompt)

| Module | Expected pending approval items |
|---|---|
| Content Factory V1 | 7-day content pack (7 items) |
| Design Factory V1 | exactly 5 |
| Video Scripts V1 | exactly 5 |
| Ads Pack Draft V1 | exactly 5 |
| Report Draft V1 | exactly 5 |

---

## 5. Safety assessment

- **Approval-first preserved** — every item is `needs_review` / pending approval.
- **Approved ≠ Published** — stated explicitly; approving only marks a draft
  reviewed.
- No auto-post, no auto-ads, no scheduling, no spend, no publishing.
- No live Meta/TikTok/Zalo/Google Ads/Canva/ComfyUI/Fal.ai connectors added.
- No image/video generation added.
- No live analytics pull; Report Draft labels provided/simulated/missing data.
- No fake metrics introduced.
- OpenAI API key stays only in n8n Credentials — the pack forbids pasting it into
  Core/Vercel/repo/runbook.
- **No secrets and no webhook URLs committed** — the pack uses node/workflow names
  and `VITE_*` env names only; smoke test is via the Core UI, never the raw webhook.
- **No n8n workflow JSON changed** — prompt update is an in-node edit + Save; no
  re-import, no Core redeploy, no Vercel env change required.

---

## 6. Validation (re-verified at commit time)

- `npm run build`: **PASS** — entry `index` ~357.71 kB (gzip ~89.67); no >500 kB
  warning; `vendor` 175.77 kB, `vendor-supabase` 204.73 kB; built ~3.2s.
- `npm run test`: **PASS — 75/75** across 7 files (contentFactory 4, coreRepository
  11, designFactory 6, repoRouting 34, videoFactory 6, adsFactory 7, reportFactory
  7).
- `node contracts/tools/validate_contracts.js`: **ALL CONTRACT VALIDATION CHECKS
  PASSED**.
- Secrets / webhook-URL scan on the Phase C diff: **clean** (docs only).
- n8n workflow JSON: **unchanged** (`git diff --name-only` shows docs only).

---

## 7. Git / push status

- Commit `3656059` (Phase B rollup) was **already pushed** to `origin/main` before
  Phase C started — local `main` and `origin/main` both at `3656059…`, 0 ahead /
  0 behind, working tree clean. No push of `3656059` was needed.
- Phase C is committed on top and pushed to `origin/main` (no history rewrite).

---

## 8. Owner next manual steps (inside n8n)

1. Open production n8n → run the pack's **Section A** checklist.
2. **Content Factory V1 (live):** paste the CONTENT FACTORY V1 prompt into its
   OpenAI node's System prompt → Save → smoke test via Core UI → expect 7 pending
   items.
3. **Design / Video / Ads / Report:** when activating each module's Path B (or if a
   real OpenAI node already exists), paste that module's prompt → Save → smoke test
   → expect 5 pending items each.
4. Confirm every run lands as pending approval only; nothing posted/launched/
   scheduled/spent/published. Key stays only in n8n Credentials. No re-import, no
   Core redeploy, no Vercel change.
