# Video Scripts V1 — n8n Production Activation Runbook (Owner-gated)

**Date:** 2026-06-17
**Status:** Implementation PASS. **Production activation NOT STARTED (Owner-gated).**
**Goal:** When the Owner chooses to activate, import the n8n Video Scripts
workflow and connect Core to it via the Vercel env
`VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL`, so Video Script generation runs through the
n8n AI Provider `external_module` path instead of local fallback.

**Scope:** Video SCRIPT / SPEC generation only (text). No video generation. No
image generation. No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo. No
auto-post. No auto-ads.

---

## 0. Implementation summary (what is already done)

- **Core UI:** the Automation Factory tab now has a **Generate Video Scripts**
  external module job, mirroring Content Pack and Design Briefs. Mode-aware:
  - env configured → **"n8n AI Provider · External module job"**, button
    **"Generate Video Scripts with n8n AI Provider"**.
  - env missing → **"Local fallback mode · External module job"**, button
    **"Generate Video Scripts with Local fallback"**.
- **Env var expected later:** `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` (its own
  external_module path, separate from Content Factory and Design Factory).
- **n8n workflow file:** `n8n-workflows/video_scripts_v1.workflow.json`
  (webhook path `video-scripts-v1/video-scripts`).
- **Production activation remains Owner-gated** — not started; no Vercel env set;
  workflow not imported/activated yet.
- Commits: `3cba6a7` (feature) and `3eae344` (Codex fix: safety gate requires
  exactly `workflow_type: video_scripts`). Build PASS, test PASS 57/57, Codex PASS.

### Workflow file contents (verified)

| Requirement | Present? | Where |
|---|---|---|
| Production webhook endpoint | ✅ Yes | Node **Receive Video Script Request** (`n8n-nodes-base.webhook`), path `video-scripts-v1/video-scripts`, `responseMode: responseNode` |
| Contract + safety validation | ✅ Yes | Node **Validate Contract + Safety** — rejects unless `workflow_type === 'video_scripts'`, `generate_images=false`, `generate_videos=false`, `no_auto_post=true`, `no_auto_ads=true`, `no_live_connectors=true`, `no_image_generation=true`, `no_video_generation=true`, `no_secrets=true`, `owner_approval_required=true` |
| Branch on validity | ✅ Yes | Node **Valid Request?** (`if`) → success path or **Return Validation Failure** (HTTP 400) |
| Normalize → video script items | ✅ Yes | Node **AI Provider Placeholder** returns normalized `items[]` (5 specs) + `job.item_count` + response envelope |
| Webhook JSON response | ✅ Yes | Node **Return Structured Video Scripts** (`respondToWebhook`) |
| Per item + envelope metadata | ✅ Yes | `workflow_type: video_scripts`, `content_type: video_script`, `status: pending_approval`, `owner_approval_required: true`, `generated_by: n8n-ai-provider` |
| Safety flags echoed | ✅ Yes | `safety: request.safety` in the response |
| No image/video generation node | ✅ Yes | Node types are only webhook / code / if / respondToWebhook |
| No live connector node | ✅ Yes | No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo node |

> ⚠️ **IMPORTANT — read before activating.** The AI step is currently a
> **deterministic placeholder Code node** named **AI Provider Placeholder**, NOT a
> real OpenAI node. Its note says: *"Replace this Code node with an
> OpenAI/Claude/Gemini n8n node using n8n Credentials (credential-placeholder
> only — never commit an API key). TEXT/SCRIPT ONLY."*
>
> - `source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode: external_module`
>   are produced correctly by **Core** whenever the webhook responds with items.
>   So **all stated test criteria pass even with the placeholder.**
> - The only difference: with the placeholder, item TEXT is deterministic template
>   text, not real AI-written script copy.
>
> **Two valid activation paths — choose one:**
> - **Path A (recommended first): Activate as-is (placeholder).** Validates the
>   full Core → n8n `external_module` round-trip safely. Do Section 1 → 3 → 4 → 5,
>   skip Section 2.
> - **Path B: Swap in a real OpenAI node before activating.** Do Section 1 → 2 → 3
>   → 4 → 5. Gives real AI-written scripts; key stays only in n8n Credentials.

---

## Expected 5 output items (per run)

1. **Hook / First 3 Seconds Script**
2. **Short-Form Video Script (Reels/TikTok, 15–30s)**
3. **Voiceover / Caption Script**
4. **Shot List + B-roll Direction**
5. **Editor Handoff Notes**

Each is a `ContentPlanItem` with `content_type = 'video_script'`, auto-submitted
for approval (`status: needs_review`). The caption carries a readable spec block
(objective, target audience, format/duration, script/scene breakdown,
voiceover/on-screen text, shot/B-roll direction, CTA, safety note) plus a
metadata footer.

### Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `video_scripts` |
| `content_type` | `video_script` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |

---

## 1. Import the workflow into n8n

1. Open your n8n instance (the same one hosting Content Factory and Design Factory).
2. **Workflows** → **Add workflow** ▾ → **Import from File…**
3. Select `n8n-workflows/video_scripts_v1.workflow.json` from this repo.
4. The canvas shows 6 nodes: Receive Video Script Request → Validate Contract +
   Safety → Valid Request? → (AI Provider Placeholder → Return Structured Video
   Scripts) / Return Validation Failure.
5. **Save**. Name stays "Video Scripts V1 - Video Scripts".

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
4. System prompt must instruct: produce EXACTLY the 5 video script items above, in
   order, text/script only, NEVER generate video or images and NEVER output media
   URLs; if information is missing, prefix the value with `Assumption: ` (never
   "Owner to confirm").
5. Add a **Code** node after OpenAI ("Normalize Video Scripts") that shapes the AI
   output into the SAME envelope the placeholder produced — keep `ok: true`,
   `request_id`, `workflow_type: 'video_scripts'`, `content_type: 'video_script'`,
   `generated_by: 'n8n-ai-provider'`, `owner_approval_required: true`,
   `status: 'pending_approval'`, `job.item_count`, `items[]`,
   `safety: request.safety`. **Do not** add any image/video/asset URL field.
6. Connect Normalize → **Return Structured Video Scripts**. **Save**.

> Keep **Validate Contract + Safety** and **Return Validation Failure** exactly
> as-is — they are the safety gate (requires exactly `workflow_type: video_scripts`).

---

## 3. Activate + copy the Production Webhook URL

1. Toggle the workflow **Active**.
2. Click **Receive Video Script Request** → open the **Production URL** tab.
3. Copy the **Production Webhook URL**:
   `https://<your-n8n-host>/webhook/video-scripts-v1/video-scripts`
   - Do NOT use the Test URL (`/webhook-test/…`) for Core.

---

## 4. Set the Vercel env + redeploy

1. Vercel → Core project → **Settings** → **Environment Variables** → **Add New**:
   - **Key:** `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL`
   - **Value:** the **Production Webhook URL** from Section 3.
   - **Environments:** **Production**. Save.
2. **Redeploy Production** (Vite inlines `VITE_*` at build time) — Deployments →
   latest → **⋮** → **Redeploy**, build cache **off**.
3. Wait for **Ready**.

> ⚠️ Never commit the real webhook URL. It lives only in Vercel.

---

## 5. UI test on https://coreagency.digital

1. Log in (Owner or Manager) → **Automation Factory** tab.
2. On the **Generate Video Scripts** card, confirm the chip shows **"n8n AI
   Provider · External module job"** and the button reads **"Generate Video
   Scripts with n8n AI Provider"** (NOT "Local fallback").
3. Select a Client / Brand / Campaign / Brief, then click the button.
4. Expect: **"5 video script approval items were created via n8n AI Provider.
   Nothing was posted or launched."**
5. **Approval Board** → confirm **5 new pending video script items** (`needs_review`).
6. Open one item and confirm metadata: `source: n8n`, `generated_by:
   n8n-ai-provider`, `generation_mode: external_module`, `workflow_type:
   video_scripts`, `content_type: video_script`, `status: pending_approval`,
   `owner_approval_required: true`, and `safety: no_auto_post=true;
   no_auto_ads=true; no_image_generation=true; no_video_generation=true`.
7. Confirm items are **text/script only** (no video, no image, no asset URL) and
   that nothing was posted, launched, published, or sent to ads.

### Activation checklist (tick all when activating)

- [ ] Import `n8n-workflows/video_scripts_v1.workflow.json` into n8n
- [ ] Select/reuse OpenAI Credential **inside n8n only** (Path B; skip for Path A)
- [ ] Activate the workflow
- [ ] Copy the **Production** Webhook URL
- [ ] Add `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` to Vercel **Production** env
- [ ] Redeploy production (build cache off)
- [ ] Test on Core UI
- [ ] Confirm 5 pending video script approval items created via n8n AI Provider
- [ ] Confirm nothing was posted / launched / published / sent to ads

---

## Rollback / troubleshooting

- **UI still "Local fallback mode" after redeploy:** env name must be exactly
  `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL`, scoped to Production; redeploy with build
  cache OFF. A non-`https://` value is ignored by Core (`getVideoFactoryWebhookUrl()`
  returns null → fallback).
- **HTTP 400 `REJECTED_BY_SAFETY` / `INVALID_CONTRACT`:** the request failed the
  safety gate — do not bypass it. The gate requires exactly
  `workflow_type: video_scripts` and all `no_*` flags true.
- **Full rollback to safe local fallback:** remove/blank the Vercel env →
  redeploy (cache off); optionally toggle the n8n workflow Inactive. No Core code
  change, no approval-logic change, no data migration. Local fallback keeps
  creating the same 5 approval-first video script items, clearly labelled "Local
  fallback mode". Content Factory and Design Factory are unaffected.
