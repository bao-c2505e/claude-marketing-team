# Design Factory V1 — n8n Production Activation Runbook (Owner-gated)

**Date:** 2026-06-17
**Goal:** Activate the n8n Design Factory workflow and connect Core to it via the
Vercel env `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL`, so Design Brief Generation runs
through the n8n AI Provider `external_module` path instead of local fallback.

**Scope:** Design brief TEXT/SPEC generation only. No image generation. No Canva /
ComfyUI / Fal.ai / Meta / TikTok / Zalo. No auto-post. No auto-ads.

---

## 0. Workflow file confirmation — `n8n-workflows/design_factory_v1.workflow.json`

What the file actually contains (verified):

| Requirement | Present? | Where |
|---|---|---|
| Production webhook endpoint | ✅ Yes | Node **Receive Design Brief Request** (`n8n-nodes-base.webhook`), path `design-factory-v1/design-briefs`, `responseMode: responseNode` |
| Contract + safety validation | ✅ Yes | Node **Validate Contract + Safety** — rejects unless `workflow_type=design_brief`, `generate_images=false`, `no_auto_post=true`, `no_auto_ads=true`, `no_image_generation=true`, `no_live_connectors=true`, `no_secrets=true`, `owner_approval_required=true` |
| Branch on validity | ✅ Yes | Node **Valid Request?** (`if`) → success path or **Return Validation Failure** (HTTP 400) |
| Normalize → design brief items | ✅ Yes | Node **AI Provider Placeholder** returns normalized `items[]` (5 specs) + `job.item_count` + response envelope |
| Webhook JSON response | ✅ Yes | Node **Return Structured Design Briefs** (`respondToWebhook`) |
| `generated_by: n8n-ai-provider` | ✅ Yes | Set on every item and on the envelope |
| `workflow_type: design_brief`, `status: pending_approval`, `owner_approval_required: true` | ✅ Yes | Per item + envelope |
| Safety flags echoed (`no_auto_post`, `no_auto_ads`, …) | ✅ Yes | `safety: request.safety` in the response |

> ⚠️ **IMPORTANT — read before activating.** The AI step is currently a
> **deterministic placeholder Code node** named **AI Provider Placeholder**, NOT a
> real OpenAI node. Its inline note says: *"Replace this Code node with
> OpenAI/Claude/Gemini n8n node using n8n Credentials."*
>
> - `source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode: external_module`
>   are produced correctly by **Core** whenever the webhook responds with items
>   (Core derives `source`/`generation_mode` from the n8n mode in
>   `src/lib/core/designFactory.ts`). So **all of your stated test criteria pass
>   even with the placeholder.**
> - The only difference: with the placeholder, item TEXT is deterministic template
>   text, not real AI-written copy.
>
> **Two valid activation paths — choose one:**
>
> - **Path A (recommended first): Activate as-is (placeholder).** Validates the full
>   Core → n8n `external_module` round-trip safely and quickly. Content is
>   deterministic. Do Section 1 → 3 → 4 → 5, skip Section 2.
> - **Path B: Swap in a real OpenAI node before activating.** Do Section 1 → 2 → 3
>   → 4 → 5. Gives real AI-written briefs; key stays only in n8n Credentials.

---

## 1. Import the workflow into n8n

1. Open your n8n instance (the same instance hosting the Content Factory workflow).
2. Left sidebar → **Workflows** → top-right **Add workflow** ▾ → **Import from File…**
   - (Or, inside a blank workflow: top-right **⋮** menu → **Import from File…**.)
3. Select `n8n-workflows/design_factory_v1.workflow.json` from this repo.
4. The canvas should show 6 nodes: Receive Design Brief Request → Validate Contract
   + Safety → Valid Request? → (AI Provider Placeholder → Return Structured Design
   Briefs) / Return Validation Failure.
5. **Save** (top-right **Save**). Name stays "Design Factory V1 - Design Briefs".

> Do NOT activate yet if you are doing Path B — finish Section 2 first.

---

## 2. (Path B only) Swap placeholder → real OpenAI node

> Skip this entire section for Path A.

1. Click the **AI Provider Placeholder** node → delete it (keep note of its position).
2. Add an **OpenAI** node (search "OpenAI" → "Message a Model" / Chat). Connect
   **Valid Request? (true output)** → OpenAI node.
3. **Credential:** in the OpenAI node's *Credential to connect with*, select your
   existing OpenAI credential, or **＋ Create New** → paste the API key **here in
   n8n Credentials only**. (Never put the key in Core/Vercel/repo.)
4. Prompt: instruct it to return **TEXT/SPEC ONLY** design briefs for the 5 types
   (facebook_post, story_reels_cover, menu_promo_visual, key_visual_direction,
   designer_handoff_notes). Explicitly forbid image generation / image URLs.
5. Add a **Code** node after OpenAI ("Normalize Design Briefs") that shapes the AI
   output into the SAME response envelope the placeholder produced — it MUST keep:
   - `ok: true`, `request_id`, `workflow_type: 'design_brief'`,
     `generated_by: 'n8n-ai-provider'`, `owner_approval_required: true`,
     `status: 'pending_approval'`, `job.item_count`, `items[]`, `safety: request.safety`.
   - Each item with: `key, title, platform, format, objective, target_audience,
     visual_direction, layout_guidance, copy_text, brand_style, image_requirements,
     cta, generated_by:'n8n-ai-provider', workflow_type:'design_brief',
     status:'pending_approval', owner_approval_required:true`.
   - **Do not** add any image/asset URL fields.
6. Connect Normalize → **Return Structured Design Briefs**. **Save**.

> Keep the **Validate Contract + Safety** and **Return Validation Failure** nodes
> exactly as-is — they are the safety gate.

---

## 3. Activate + copy the Production Webhook URL

1. Toggle the workflow **Active** (top-right **Inactive → Active**).
2. Click the **Receive Design Brief Request** node.
3. In the node panel, open the **Production URL** tab (not Test URL).
4. Copy the **Production Webhook URL**. It looks like:
   `https://<your-n8n-host>/webhook/design-factory-v1/design-briefs`
   - The **Test URL** (`/webhook-test/…`) only fires while "Listen for Test Event"
     is open — do NOT use it for Core. Use the **Production** URL.

> Optional pre-Vercel sanity check (does not touch Core): from a terminal you can
> POST a minimal valid payload to the Production URL and confirm you get
> `ok: true` with 5 items. Skip if you prefer to validate via the UI in Section 5.

---

## 4. Set the Vercel env + redeploy

1. Vercel dashboard → your Core project → **Settings** → **Environment Variables**.
2. **Add New:**
   - **Key:** `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL`
   - **Value:** paste the **Production Webhook URL** from Section 3.
   - **Environments:** check **Production**.
   - Save.
3. **Redeploy Production** so the new build picks up the env (Vite inlines
   `VITE_*` at build time — an existing deploy will NOT see the new value until
   rebuilt):
   - **Deployments** → latest Production deployment → **⋮** → **Redeploy**
   - Leave "Use existing Build Cache" **unchecked** to be safe → **Redeploy**.
4. Wait for the deployment to finish (Ready).

> ⚠️ Never commit the real webhook URL to the repo. It lives only in Vercel.

---

## 5. UI test on https://coreagency.digital

1. Open https://coreagency.digital and log in (Owner or Manager).
2. Go to **Automation Factory** tab.
3. On the **Generate Design Briefs** card, confirm the mode chip shows
   **"n8n AI Provider"** and the button reads **"Generate Design Briefs with n8n
   AI Provider"** (NOT "Local fallback").
   - If it still says "Local fallback mode", the env/redeploy did not take — see
     Rollback / troubleshooting.
4. Make sure a Client / Brand / Campaign / Brief are selected (use the Content Pack
   card selectors above if needed), then click **Generate Design Briefs with n8n AI
   Provider**.
5. Expect the success message:
   **"5 design brief approval items were created via n8n AI Provider. Nothing was
   posted or launched."**
6. Go to the **Approval Board** (Approvals) tab → confirm **5 new pending design
   brief items**, each `needs_review` / pending approval.
7. Open one item and confirm the caption metadata block shows:
   - `source: n8n`
   - `generated_by: n8n-ai-provider`
   - `generation_mode: external_module`
   - `status: pending_approval`, `owner_approval_required: true`
   - `safety: no_auto_post=true; no_auto_ads=true; no_image_generation=true`
8. Confirm items are **text/spec only** (no image, no asset URL) and that nothing
   was posted, launched, published, or sent to ads.

---

## Test checklist (tick all)

- [ ] Mode chip = **n8n AI Provider** (not Local fallback)
- [ ] Button = "Generate Design Briefs with n8n AI Provider"
- [ ] Success message = "5 design brief approval items were created via n8n AI Provider. Nothing was posted or launched."
- [ ] 5 items created, all `needs_review` / pending approval
- [ ] Items are text/spec only (no images/asset URLs)
- [ ] Metadata: `source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode: external_module`
- [ ] Metadata: `no_auto_post=true`, `no_auto_ads=true`, `no_image_generation=true`
- [ ] Nothing posted / launched / published / sent to ads

---

## Expected success messages

- **Core UI (Automation Factory):** "5 design brief approval items were created via
  n8n AI Provider. Nothing was posted or launched."
- **n8n webhook response (200):** `{ "ok": true, "workflow_type": "design_brief",
  "generated_by": "n8n-ai-provider", "status": "pending_approval", "job": {
  "item_count": 5 }, "items": [ …5… ], "safety": { … } }`
- **n8n Executions list:** a new successful execution per run.

---

## Rollback / troubleshooting

**Symptom: UI still shows "Local fallback mode" after redeploy.**
- The env was not applied to the build. Re-check the variable **name** is exactly
  `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL`, scoped to **Production**, then **Redeploy
  with build cache OFF**. (Vite needs a rebuild — restarting/promoting an old build
  is not enough.)
- Verify the URL is absolute and starts with `https://`. A non-http value is
  ignored by Core (`getDesignFactoryWebhookUrl()` returns null → fallback).

**Symptom: UI shows an error like "n8n Design Factory failed (4xx/5xx). No design
briefs were created."**
- Wrong/expired URL, workflow not Active, or you pasted the **Test** URL. Re-copy
  the **Production** URL from the webhook node and ensure the workflow is **Active**.
- If you get HTTP **400** with `REJECTED_BY_SAFETY` / `INVALID_CONTRACT`: the
  request failed the safety gate — do not bypass it. This is the gate working.

**Symptom: items created but content looks like local templates.**
- You activated Path A (placeholder). That is expected and safe. Switch to Path B
  (Section 2) when you want real AI copy.

**Full rollback to safe local fallback (instant, no code change):**
1. In Vercel, **remove** (or blank) `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` from
   Production → **Redeploy** (cache off). Core reverts to **Local fallback mode**.
2. (Optional) In n8n, toggle the workflow **Inactive**.
3. No Core code change, no approval-logic change, no data migration needed. Local
   fallback continues to create the same 5 approval-first design brief items,
   clearly labelled "Local fallback mode".

> Activation is reversible and contains no secrets in the repo. Content Factory V1
> is unaffected by any step here.
