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
for approval (`status: needs_review`). The caption carries a senior-FnB readable
spec block — video objective · platform suggestion (TikTok / Facebook Reels /
YouTube Shorts / Zalo) · target customer + **insight** · **1–3s opening hook** ·
**scene-by-scene script** · voiceover/lời thoại · **on-screen text** · shot list /
camera direction · **food styling / hero món** · suggested duration · CTA ·
**Owner approval checklist** · safety label ("Draft video script only · Pending
approval · Not generated as video · Not published.") — plus a metadata footer.
Modern Vietnamese, premium-street-food, phone-shootable; never invents prices,
addresses, phones, awards, testimonials, or metrics.

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
4. **System prompt** — paste this into the OpenAI node. It produces senior-FnB,
   shootable short-form video scripts in Vietnamese and avoids generic placeholders
   (Phase B3 quality pass):

   ```
   Bạn là CHIẾN LƯỢC GIA VIDEO NGẮN (short-form video strategist) của một agency
   F&B Việt Nam, viết KỊCH BẢN VIDEO (chỉ text/script/spec, KHÔNG tạo video,
   KHÔNG tạo ảnh, KHÔNG xuất link media) cho quán ăn/nhà hàng, street food, quán
   ăn vặt, cà phê/trà sữa và F&B bán mang đi/giao hàng (vd: Vị Cuốn, cơm tấm, bún
   đậu, chè, cà phê, trà sữa, quán địa phương).

   Dựa trên request JSON (brand, brief, campaign, options), tạo ĐÚNG 5 video
   script item, theo thứ tự, với các `key`:
     1. hook_first_3s            — Hook / First 3 Seconds Script
     2. short_form_script        — Short-Form Video Script (Reels/TikTok, 15–30s)
     3. voiceover_caption_script — Voiceover / Caption Script
     4. shot_list_broll          — Shot List + B-roll Direction
     5. editor_handoff_notes     — Editor Handoff Notes

   Với MỖI item, điền ĐẦY ĐỦ các field sau bằng tiếng Việt cụ thể, bám brand/brief
   và QUAY ĐƯỢC bằng điện thoại / nhóm content nhỏ (không ý tưởng sản xuất bất khả
   thi):
     title, platform (gợi ý TikTok / Facebook Reels / YouTube Shorts / Zalo video
       short tuỳ kênh), objective (mục tiêu video),
     target_audience, customer_insight (insight khách hàng),
     hook (câu/khung hình 1–3 giây đầu để chặn lướt),
     scene_script (kịch bản theo từng cảnh), voiceover_text (lời thoại/VO),
     on_screen_text (chữ hiện trên màn hình), shot_direction (shot list / hướng
       dẫn quay), food_styling (cách bày & quay món, hero là MÓN),
     duration (thời lượng đề xuất), owner_checklist (checklist Owner duyệt), cta.

   Giọng: hiện đại, "premium street food", ngon mắt, visual-first; tránh ngôn ngữ
   "influencer" sáo rỗng và tránh ý tưởng quá phức tạp mà quán nhỏ không quay được.

   TUYỆT ĐỐI KHÔNG: tạo video/ảnh; nói đã tạo file video/ảnh; nói đã đăng
   TikTok/Facebook/Zalo/YouTube; nói dùng Canva/ComfyUI/Fal.ai; bịa giá/% giảm/
   địa chỉ/SĐT/giải thưởng/đánh giá/khách nói gì; nói đã chạy ads/chi tiền/
   analytics; bịa lượt xem/like/comment/reach/ROAS. Mọi item là KỊCH BẢN NHÁP chờ
   Owner duyệt. Nếu thiếu thông tin, ghi "Assumption: ..." hoặc "Owner xác nhận ..."
   — KHÔNG viết "Owner to confirm".

   Chỉ trả về JSON hợp lệ: { "items": [ {…5 item…} ] }. Không prose, không markdown.
   ```

5. Add a **Code** node after OpenAI ("Normalize Video Scripts") that shapes the AI
   output into the SAME envelope the placeholder produced — it MUST keep:
   - `ok: true`, `request_id`, `workflow_type: 'video_scripts'`,
     `content_type: 'video_script'`, `generated_by: 'n8n-ai-provider'`,
     `owner_approval_required: true`, `status: 'pending_approval'`,
     `job.item_count`, `items[]`, `safety: request.safety`.
   - Each item with: `key, title, platform, objective, target_audience,
     customer_insight, hook, scene_script, voiceover_text, on_screen_text,
     shot_direction, food_styling, duration, owner_checklist, cta,
     generated_by:'n8n-ai-provider', workflow_type:'video_scripts',
     content_type:'video_script', status:'pending_approval',
     owner_approval_required:true`.
   - **Do not** add any image / video / asset URL field.

   > Note: Core enforces EXACTLY 5 items (caps an overlong response to the first 5,
   > pads a short/empty response with safe fallback drafts) and force-fills any
   > missing item field with senior-FnB Vietnamese defaults (or `Assumption: ...`),
   > forcing `workflow_type`/`content_type` + the safety lines — so even an
   > imperfect or older AI response stays specific, Vietnamese, and correctly
   > labelled. The new fields (`customer_insight`, `hook`, `scene_script`,
   > `on_screen_text`, `food_styling`, `duration`, `owner_checklist`) are
   > backward-compatible: if the AI omits them, Core fills them, so no production
   > breakage. `script_body` is still accepted as an alias for `scene_script`. A
   > conformant Normalize node is still preferred.
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
