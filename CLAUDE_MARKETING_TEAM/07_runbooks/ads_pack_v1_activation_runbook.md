# Ads Pack Draft V1 — n8n Production Activation Runbook (Owner-gated)

**Date:** 2026-06-17
**Status:** Implementation PASS. **Production activation NOT STARTED (Owner-gated).**
**Goal:** When the Owner chooses to activate, import the n8n Ads Pack workflow and
connect Core to it via the Vercel env `VITE_N8N_ADS_PACK_WEBHOOK_URL`, so Ads Pack
generation runs through the n8n AI Provider `external_module` path instead of local
fallback.

**Scope:** Ads STRATEGY / SPEC / DRAFT NOTES only (text). **No ad creation. No
campaign / ad-set / ad / audience / budget / pixel / post / scheduled-launch
creation.** No image generation. No video generation. No Canva / ComfyUI / Fal.ai
/ Meta / TikTok / Zalo / Google Ads. No auto-post. No auto-ads. No platform launch.

---

## 0. Implementation summary (what is already done)

- **Core UI:** the Automation Factory tab now has a **Generate Ads Pack** external
  module job, mirroring Content Pack, Design Briefs, and Video Scripts. Mode-aware:
  - env configured → **"n8n AI Provider · External module job"**, button
    **"Generate Ads Pack with n8n AI Provider"**.
  - env missing → **"Local fallback mode · External module job"**, button
    **"Generate Ads Pack with Local fallback"**.
- **Env var expected later:** `VITE_N8N_ADS_PACK_WEBHOOK_URL` (its own
  external_module path, separate from Content / Design / Video factories).
- **n8n workflow file:** `n8n-workflows/ads_pack_v1.workflow.json`
  (webhook path `ads-pack-v1/ads-pack`).
- **Production activation remains Owner-gated** — not started; no Vercel env set;
  workflow not imported/activated yet.
- Commit: `5f839cc` (feature). Build PASS, test PASS 61/61, Codex review PASS.

### Workflow file contents (verified)

| Requirement | Present? | Where |
|---|---|---|
| Production webhook endpoint | ✅ Yes | Node **Receive Ads Pack Request** (`n8n-nodes-base.webhook`), path `ads-pack-v1/ads-pack`, `responseMode: responseNode` |
| Contract + safety validation | ✅ Yes | Node **Validate Contract + Safety** — rejects unless `workflow_type === 'ads_pack'`, `generate_images=false`, `generate_videos=false`, `create_ads=false`, `launch_ads=false`, `no_auto_post=true`, `no_auto_ads=true`, `no_live_connectors=true`, `no_platform_launch=true`, `no_image_generation=true`, `no_video_generation=true`, `no_secrets=true`, `owner_approval_required=true` |
| Branch on validity | ✅ Yes | Node **Valid Request?** (`if`) → success path or **Return Validation Failure** (HTTP 400) |
| Normalize → ads draft items | ✅ Yes | Node **AI Provider Placeholder** returns normalized `items[]` (5 specs) + `job.item_count` + response envelope |
| Webhook JSON response | ✅ Yes | Node **Return Structured Ads Pack** (`respondToWebhook`) |
| Per item + envelope metadata | ✅ Yes | `workflow_type: ads_pack`, `content_type: ads_draft`, `status: pending_approval`, `owner_approval_required: true`, `generated_by: n8n-ai-provider` |
| Safety flags echoed | ✅ Yes | `safety: request.safety` in the response |
| No image/video generation node | ✅ Yes | Node types are only webhook / code / if / respondToWebhook |
| No ad creation / launch node | ✅ Yes | No campaign / ad-set / ad / audience / budget / pixel / post / scheduled-launch node |
| No live connector node | ✅ Yes | No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads node |

> ⚠️ **IMPORTANT — read before activating.** The AI step is currently a
> **deterministic placeholder Code node** named **AI Provider Placeholder**, NOT a
> real OpenAI node. Its note says: *"Replace this Code node with an
> OpenAI/Claude/Gemini n8n node using n8n Credentials (credential-placeholder
> only — never commit an API key). STRATEGY/DRAFT NOTES ONLY."*
>
> - `source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode: external_module`
>   are produced correctly by **Core** whenever the webhook responds with items.
>   So **all stated test criteria pass even with the placeholder.**
> - The only difference: with the placeholder, item TEXT is deterministic template
>   text, not real AI-written draft copy.
>
> **Two valid activation paths — choose one:**
> - **Path A (recommended first): Activate as-is (placeholder).** Validates the
>   full Core → n8n `external_module` round-trip safely. Do Section 1 → 3 → 4 → 5,
>   skip Section 2.
> - **Path B: Swap in a real OpenAI node before activating.** Do Section 1 → 2 → 3
>   → 4 → 5. Gives real AI-written drafts; key stays only in n8n Credentials.

---

## Expected 5 output items (per run)

1. **Campaign Angle & Offer Draft**
2. **Ad Copy Variants Draft**
3. **Audience & Targeting Notes**
4. **Budget & Testing Plan Draft**
5. **Ads Manager Handoff Checklist**

Each is a `ContentPlanItem` with `content_type = 'ads_draft'`, auto-submitted for
approval (`status: needs_review`). The caption carries a readable spec block
(objective, focus, target audience notes, draft, key points/variants, budget/testing
note, CTA, safety note) plus a metadata footer. **These are strategy/draft notes
only — no ads are created, launched, scheduled, or spent.**

### Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `ads_pack` |
| `content_type` | `ads_draft` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |
| `no_live_connectors` | `true` |
| `no_platform_launch` | `true` |

---

## 1. Import the workflow into n8n

1. Open your n8n instance (the same one hosting Content / Design / Video factories).
2. **Workflows** → **Add workflow** ▾ → **Import from File…**
3. Select `n8n-workflows/ads_pack_v1.workflow.json` from this repo.
4. The canvas shows 6 nodes: Receive Ads Pack Request → Validate Contract + Safety
   → Valid Request? → (AI Provider Placeholder → Return Structured Ads Pack) /
   Return Validation Failure.
5. **Save**. Name stays "Ads Pack Draft V1 - Ads Pack".

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
4. System prompt must instruct: produce EXACTLY the 5 ads draft items above, in
   order, strategy/draft notes only; NEVER create, launch, schedule, or spend ads;
   NEVER generate images or video; NEVER call any platform connector; if information
   is missing, prefix the value with `Assumption: ` (never "Owner to confirm").
5. Add a **Code** node after OpenAI ("Normalize Ads Pack") that shapes the AI output
   into the SAME envelope the placeholder produced — keep `ok: true`, `request_id`,
   `workflow_type: 'ads_pack'`, `content_type: 'ads_draft'`,
   `generated_by: 'n8n-ai-provider'`, `owner_approval_required: true`,
   `status: 'pending_approval'`, `job.item_count`, `items[]`,
   `safety: request.safety`. **Do not** add any image/video/asset URL field or any
   campaign/ad/audience/budget object.
6. Connect Normalize → **Return Structured Ads Pack**. **Save**.

> Keep **Validate Contract + Safety** and **Return Validation Failure** exactly
> as-is — they are the safety gate (requires exactly `workflow_type: ads_pack`,
> `create_ads=false`, `launch_ads=false`, `no_platform_launch=true`).

---

## 3. Activate + copy the Production Webhook URL

1. Toggle the workflow **Active**.
2. Click **Receive Ads Pack Request** → open the **Production URL** tab.
3. Copy the **Production Webhook URL**:
   `https://<your-n8n-host>/webhook/ads-pack-v1/ads-pack`
   - Do NOT use the Test URL (`/webhook-test/…`) for Core.

---

## 4. Set the Vercel env + redeploy

1. Vercel → Core project → **Settings** → **Environment Variables** → **Add New**:
   - **Key:** `VITE_N8N_ADS_PACK_WEBHOOK_URL`
   - **Value:** the **Production Webhook URL** from Section 3.
   - **Environments:** **Production**. Save.
2. **Redeploy Production** (Vite inlines `VITE_*` at build time) — Deployments →
   latest → **⋮** → **Redeploy**, build cache **off**.
3. Wait for **Ready**.

> ⚠️ Never commit the real webhook URL. It lives only in Vercel.

---

## 5. UI test on https://coreagency.digital

1. Log in (Owner or Manager) → **Automation Factory** tab.
2. On the **Generate Ads Pack** card, confirm the chip shows **"n8n AI Provider ·
   External module job"** and the button reads **"Generate Ads Pack with n8n AI
   Provider"** (NOT "Local fallback").
3. Select a Client / Brand / Campaign / Brief, then click the button.
4. Expect: **"5 ads draft approval items were created via n8n AI Provider. These
   are drafts only — no ads were created, launched, scheduled, or spent."**
5. **Approval Board** → confirm **5 new pending ads draft items** (`needs_review`).
6. Open one item and confirm metadata: `source: n8n`, `generated_by:
   n8n-ai-provider`, `generation_mode: external_module`, `workflow_type: ads_pack`,
   `content_type: ads_draft`, `status: pending_approval`, `owner_approval_required:
   true`, and `safety: no_auto_post=true; no_auto_ads=true; no_platform_launch=true;
   no_image_generation=true; no_video_generation=true; no_live_connectors=true`.
7. Confirm items are **strategy/draft notes only** (no ad created, no image, no
   video, no asset URL) and that nothing was posted, launched, published, scheduled,
   sent to ads, or spent.

### Activation checklist (tick all when activating)

- [ ] Import `n8n-workflows/ads_pack_v1.workflow.json` into n8n
- [ ] Select/reuse OpenAI Credential **inside n8n only** (Path B; skip for Path A)
- [ ] Activate the workflow
- [ ] Copy the **Production** Webhook URL
- [ ] Add `VITE_N8N_ADS_PACK_WEBHOOK_URL` to Vercel **Production** env
- [ ] Redeploy production (build cache off)
- [ ] Test on Core UI
- [ ] Confirm 5 pending ads draft approval items created via n8n AI Provider
- [ ] Confirm nothing was posted / launched / published / scheduled / sent to ads / spent

---

## Rollback / troubleshooting

- **UI still "Local fallback mode" after redeploy:** env name must be exactly
  `VITE_N8N_ADS_PACK_WEBHOOK_URL`, scoped to Production; redeploy with build cache
  OFF. A non-`https://` value is ignored by Core (`getAdsFactoryWebhookUrl()`
  returns null → fallback).
- **HTTP 400 `REJECTED_BY_SAFETY` / `INVALID_CONTRACT`:** the request failed the
  safety gate — do not bypass it. The gate requires exactly `workflow_type: ads_pack`
  plus `create_ads=false`, `launch_ads=false`, and all `no_*` flags true (including
  `no_platform_launch`).
- **Full rollback to safe local fallback:** remove/blank the Vercel env → redeploy
  (cache off); optionally toggle the n8n workflow Inactive. No Core code change, no
  approval-logic change, no data migration. Local fallback keeps creating the same 5
  approval-first ads draft items, clearly labelled "Local fallback mode". Content,
  Design, and Video factories are unaffected.

> **Approved ≠ Published.** Approving an ads draft item only marks the draft as
> reviewed. It does NOT create, launch, schedule, or spend any ad. All real Ads
> Manager setup is a manual, human, Owner-gated step performed off-platform.
