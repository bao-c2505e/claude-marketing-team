# Report Draft V1 — n8n Production Activation Runbook (Owner-gated)

**Date:** 2026-06-17
**Status:** Implementation PASS. **Production activation NOT STARTED (Owner-gated).**
**Goal:** When the Owner chooses to activate, import the n8n Report Draft workflow
and connect Core to it via the Vercel env `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL`, so
Report Draft generation runs through the n8n AI Provider `external_module` path
instead of local fallback.

**Scope:** Report DRAFT / NOTES generation only (text). No live analytics pull. No
real metrics unless owner-provided. No image generation. No video generation. No
Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads / GA4 / CRM. No
auto-post. No auto-ads. No platform launch.

---

## 0. Implementation summary (what is already done)

- **Core UI:** the Automation Factory tab now has a **Generate Report Draft**
  external module job, mirroring Content Pack, Design Briefs, Video Scripts, and
  Ads Pack. Mode-aware:
  - env configured → **"n8n AI Provider · External module job"**, button
    **"Generate Report Draft with n8n AI Provider"**.
  - env missing → **"Local fallback mode · External module job"**, button
    **"Generate Report Draft with Local fallback"**.
- **Env var expected later:** `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` (its own
  external_module path, separate from Content / Design / Video / Ads factories).
- **n8n workflow file:** `n8n-workflows/report_draft_v1.workflow.json`
  (webhook path `report-draft-v1/report-draft`).
- **Production activation remains Owner-gated** — not started; no Vercel env set;
  workflow not imported/activated yet.
- Commit: `bf414f6` (feature). Build PASS, test PASS 65/65 across 7 files,
  Codex PASS.

### Workflow file contents (verified)

| Requirement | Present? | Where |
|---|---|---|
| Production webhook endpoint | ✅ Yes | Node **Receive Report Draft Request** (`n8n-nodes-base.webhook`), path `report-draft-v1/report-draft`, `responseMode: responseNode` |
| Contract + safety validation | ✅ Yes | Node **Validate Contract + Safety** — rejects unless `workflow_type === 'report_draft'`, `generate_images=false`, `generate_videos=false`, `pull_live_analytics=false`, `use_unverified_metrics=false`, and all `no_*` flags true (`no_auto_post`, `no_auto_ads`, `no_live_connectors`, `no_platform_launch`, `no_image_generation`, `no_video_generation`, `no_live_analytics_pull`, `no_unverified_metrics`, `no_secrets`, `owner_approval_required`) |
| Branch on validity | ✅ Yes | Node **Valid Request?** (`if`) → success path or **Return Validation Failure** (HTTP 400) |
| Normalize → report draft items | ✅ Yes | Node **AI Provider Placeholder** returns normalized `items[]` (5 specs) + `job.item_count` + response envelope |
| Webhook JSON response | ✅ Yes | Node **Return Structured Report Draft** (`respondToWebhook`) |
| Per item + envelope metadata | ✅ Yes | `workflow_type: report_draft`, `content_type: report_draft`, `status: pending_approval`, `owner_approval_required: true`, `generated_by: n8n-ai-provider` |
| Data basis stated (no live analytics) | ✅ Yes | Every item carries a `data_basis` stating no live analytics were pulled and no unverified metrics are claimed |
| Safety flags echoed | ✅ Yes | `safety: request.safety` in the response |
| No image/video generation node | ✅ Yes | Node types are only webhook / code / if / respondToWebhook |
| No live analytics / connector node | ✅ Yes | No GA4 / Meta / TikTok / Zalo / Google Ads / CRM / Canva / ComfyUI / Fal.ai node, no metrics-pull node |

> ⚠️ **IMPORTANT — read before activating.** The AI step is currently a
> **deterministic placeholder Code node** named **AI Provider Placeholder**, NOT a
> real OpenAI node. Its note says: *"Replace this Code node with an
> OpenAI/Claude/Gemini n8n node using n8n Credentials (credential-placeholder only
> — never commit an API key). REPORT DRAFT NOTES ONLY."*
>
> - `source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode: external_module`
>   are produced correctly by **Core** whenever the webhook responds with items.
>   So **all stated test criteria pass even with the placeholder.**
> - The only difference: with the placeholder, item TEXT is deterministic template
>   text, not real AI-written report copy.
>
> **Two valid activation paths — choose one:**
> - **Path A (recommended first): Activate as-is (placeholder).** Validates the
>   full Core → n8n `external_module` round-trip safely. Do Section 1 → 3 → 4 → 5,
>   skip Section 2.
> - **Path B: Swap in a real OpenAI node before activating.** Do Section 1 → 2 → 3
>   → 4 → 5. Gives real AI-written report drafts; key stays only in n8n Credentials.

---

## Expected 5 output items (per run)

1. **Campaign Status Summary Draft**
2. **Performance Insight Notes**
3. **Content & Creative Review Notes**
4. **Risks, Learnings & Next Actions**
5. **Owner / Client Report Handoff Draft**

Each is a `ContentPlanItem` with `content_type = 'report_draft'`, auto-submitted
for approval (`status: needs_review`). The caption carries a readable spec block
(objective, focus, period, **data basis**, summary draft, key points/insights,
next actions, safety note) plus a metadata footer. **These are report draft notes
only — no live analytics is pulled and no real metric is claimed unless provided
in the Core request.**

### Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `report_draft` |
| `content_type` | `report_draft` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |
| `no_live_connectors` | `true` |
| `no_platform_launch` | `true` |
| `no_live_analytics_pull` | `true` |
| `no_unverified_metrics` | `true` |

---

## 1. Import the workflow into n8n

1. Open your n8n instance (the same one hosting the other factory workflows).
2. **Workflows** → **Add workflow** ▾ → **Import from File…**
3. Select `n8n-workflows/report_draft_v1.workflow.json` from this repo.
4. The canvas shows 6 nodes: Receive Report Draft Request → Validate Contract +
   Safety → Valid Request? → (AI Provider Placeholder → Return Structured Report
   Draft) / Return Validation Failure.
5. **Save**. Name stays "Report Draft V1 - Report Draft".

> Do NOT activate yet if you are doing Path B — finish Section 2 first.

---

## 2. (Path B only) Swap placeholder → real OpenAI node

> Skip this entire section for Path A.

1. Delete the **AI Provider Placeholder** node (note its position).
2. Add an **OpenAI** node ("Message a Model" / Chat). Connect **Valid Request?
   (true output)** → OpenAI node.
3. **Credential:** select your existing OpenAI credential or **＋ Create New** →
   paste the API key **here in n8n Credentials only**. Never put the key in
   Core/Vercel/repo.
4. System prompt must instruct: produce EXACTLY the 5 report draft items above, in
   order, report NOTES only; **NEVER pull or invent metrics — only use figures
   explicitly provided in the request**; if a figure is missing, leave a labelled
   placeholder (`owner to supply`) and never fabricate a number; label any
   non-live data as `Assumption: ` / owner-provided / simulated-demo; NEVER
   generate images or video and NEVER call any analytics/platform connector.
5. Add a **Code** node after OpenAI ("Normalize Report Draft") that shapes the AI
   output into the SAME envelope the placeholder produced — keep `ok: true`,
   `request_id`, `workflow_type: 'report_draft'`, `content_type: 'report_draft'`,
   `generated_by: 'n8n-ai-provider'`, `owner_approval_required: true`,
   `status: 'pending_approval'`, `job.item_count`, `items[]`,
   `safety: request.safety`. Each item must keep a `data_basis` that states no live
   analytics were pulled. **Do not** add any analytics/metrics/asset field beyond
   owner-provided values.
6. Connect Normalize → **Return Structured Report Draft**. **Save**.

> Keep **Validate Contract + Safety** and **Return Validation Failure** exactly
> as-is — they are the safety gate (requires exactly `workflow_type: report_draft`
> plus `pull_live_analytics=false`, `use_unverified_metrics=false`, and all `no_*`
> flags true).

---

## 3. Activate + copy the Production Webhook URL

1. Toggle the workflow **Active**.
2. Click **Receive Report Draft Request** → open the **Production URL** tab.
3. Copy the **Production Webhook URL**:
   `https://<your-n8n-host>/webhook/report-draft-v1/report-draft`
   - Do NOT use the Test URL (`/webhook-test/…`) for Core.

---

## 4. Set the Vercel env + redeploy

1. Vercel → Core project → **Settings** → **Environment Variables** → **Add New**:
   - **Key:** `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL`
   - **Value:** the **Production Webhook URL** from Section 3.
   - **Environments:** **Production**. Save.
2. **Redeploy Production** (Vite inlines `VITE_*` at build time) — Deployments →
   latest → **⋮** → **Redeploy**, build cache **off**.
3. Wait for **Ready**.

> ⚠️ Never commit the real webhook URL. It lives only in Vercel.

---

## 5. UI test on https://coreagency.digital

1. Log in (Owner or Manager) → **Automation Factory** tab.
2. On the **Generate Report Draft** card, confirm the chip shows **"n8n AI
   Provider · External module job"** and the button reads **"Generate Report Draft
   with n8n AI Provider"** (NOT "Local fallback").
3. Select a Client / Brand / Campaign / Brief, then click the button.
4. Expect: **"5 report draft approval items were created via n8n AI Provider.
   These are drafts only — no live analytics were pulled and nothing was posted or
   launched."**
5. **Approval Board** → confirm **5 new pending report draft items** (`needs_review`).
6. Open one item and confirm metadata: `source: n8n`, `generated_by:
   n8n-ai-provider`, `generation_mode: external_module`, `workflow_type:
   report_draft`, `content_type: report_draft`, `status: pending_approval`,
   `owner_approval_required: true`, and `safety: no_auto_post=true;
   no_auto_ads=true; no_platform_launch=true; no_image_generation=true;
   no_video_generation=true; no_live_connectors=true; no_live_analytics_pull=true;
   no_unverified_metrics=true`.
7. Confirm each item's **Data basis** states no live analytics were pulled and that
   figures are owner-provided/assumption/simulated-demo — no fabricated metrics.

### Activation checklist (tick all when activating)

- [ ] Import `n8n-workflows/report_draft_v1.workflow.json` into n8n
- [ ] Select/reuse OpenAI Credential **inside n8n only** (Path B; skip for Path A)
- [ ] Activate the workflow
- [ ] Copy the **Production** Webhook URL
- [ ] Add `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` to Vercel **Production** env
- [ ] Redeploy production (build cache off)
- [ ] Test on Core UI
- [ ] Confirm 5 pending report draft approval items created via n8n AI Provider
- [ ] Confirm nothing was posted / launched / published / scheduled / sent to ads / spent
- [ ] Confirm no live analytics data was pulled

---

## Rollback / troubleshooting

- **UI still "Local fallback mode" after redeploy:** env name must be exactly
  `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL`, scoped to Production; redeploy with build
  cache OFF. A non-`https://` value is ignored by Core
  (`getReportFactoryWebhookUrl()` returns null → fallback).
- **HTTP 400 `REJECTED_BY_SAFETY` / `INVALID_CONTRACT`:** the request failed the
  safety gate — do not bypass it. The gate requires exactly
  `workflow_type: report_draft`, `pull_live_analytics=false`,
  `use_unverified_metrics=false`, and all `no_*` flags true.
- **Full rollback to safe local fallback:** remove/blank the Vercel env →
  redeploy (cache off); optionally toggle the n8n workflow Inactive. No Core code
  change, no approval-logic change, no data migration. Local fallback keeps
  creating the same 5 approval-first report draft items (clearly labelled "Local
  fallback mode", explicitly no live analytics). Content Factory, Design Factory,
  Video Scripts, and Ads Pack are unaffected.
