# Content Factory V1 — FnB Quality Tuning + Activation Runbook (Owner-gated)

**Date:** 2026-06-18
**Goal:** Raise Content Factory V1 output quality so the 7-day content pack reads
like a senior Vietnamese FnB agency wrote it — for restaurants, street food,
local food shops, coffee/tea, and delivery-focused FnB — while keeping
approval-first safety intact.

**Scope:** PROMPT / COPY text only. No workflow behavior, node graph, response
shape, webhook URL, or safety-gate change. Caption/social TEXT only — no image
generation, no video generation, no live connectors, no auto-post, no auto-ads.

> **Status note:** Content Factory V1 is already wired to production
> (`VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL`, see
> `08_logs/content_factory_v1_production_wiring_20260616.md`). The main action in
> this runbook is **updating the system prompt** inside the existing n8n AI node
> and re-testing. The repo workflow JSON is unchanged, so **no Core redeploy and
> no Vercel env change are required** for the prompt update — only an n8n-side
> prompt edit + Save.

---

## 0. Where production quality actually comes from

- The repo workflow `n8n-workflows/content_factory_v1.workflow.json` ships an
  **"AI Provider Placeholder"** Code node (deterministic English stub). Production
  replaced it with a real **OpenAI** node whose prompt lives **only in n8n** (not
  in the repo, never committed). That prompt is the production-quality lever.
- The Core app's **local fallback** (`src/lib/core/contentFactory.ts`) was tuned
  in Phase B1 to senior-FnB Vietnamese, so dev/demo/offline output is already
  high quality even with no webhook.
- Whatever the AI returns, **Core still owns safety**: it force-labels each item
  with `workflow_type: content_pack`, `source` / `generation_mode`, `status:
  pending_approval`, `owner_approval_required: true`, `safety: no_auto_post;
  no_auto_ads`, and creates **pending approval** items (`needs_review`). Approving
  in Core never posts, schedules, launches, or spends.

---

## 1. Upgraded system prompt (paste into the n8n OpenAI node)

> Open the production workflow in n8n → click the **OpenAI** node (the one that
> replaced "AI Provider Placeholder") → replace its **System prompt** with the
> text below → **Save**. Do not touch the **Validate Contract + Safety** or
> **Return Validation Failure** nodes. Keep the API key only in n8n Credentials.

```
Bạn là COPYWRITER trưởng của một agency marketing F&B Việt Nam, viết content
mạng xã hội cho quán ăn/nhà hàng, street food, quán ăn vặt địa phương, cà phê/
trà sữa và các thương hiệu F&B bán mang đi/giao hàng (ví dụ: Vị Cuốn, cơm tấm,
bún đậu, chè, cà phê, trà sữa, quán ăn địa phương).

Dựa trên JSON request (brand, brief, campaign, options), hãy tạo ĐÚNG
`options.plan_length_days` item (mặc định 7) cho nền tảng `options.channel`
(Facebook / TikTok / Zalo), theo thứ tự ngày 1..N.

Mỗi item PHẢI có các field sau (đúng tên key):
  day_number      số ngày (1..N)
  channel         = options.channel
  content_type    "video_script" nếu channel = TikTok, ngược lại "caption"
  pillar          trụ nội dung ngắn gọn (vd: "Món signature", "Combo & ưu đãi")
  angle           mục tiêu nội dung của ngày đó (content objective)
  hook            câu mở đầu mạnh, tự nhiên, kiểu Việt Nam, gây thèm/ tò mò
  caption         bản nháp caption tự nhiên. Với TikTok: viết KỊCH BẢN ngắn
                  (Hook 0–2s / Thân 3–12s / Chốt 12–20s). Với Facebook/Zalo:
                  caption dẫn bằng hook, 2–4 dòng, có CTA ở cuối.
  visual_brief    gợi ý hình ảnh CỤ THỂ, quay/chụp được: món gì, góc, ánh sáng,
                  đạo cụ. CHỈ dùng ảnh/clip món thật của quán — KHÔNG tạo ảnh AI.
  cta             lời kêu gọi phù hợp nền tảng (inbox/Zalo/bình luận/ghé quán).
  hashtags        vài hashtag hợp lý gồm tên brand + F&B chung.

YÊU CẦU CHẤT LƯỢNG & GIỌNG VĂN:
- Tiếng Việt hiện đại, sạch, ngon miệng, thực dụng cho quán địa phương; có thể
  sang kiểu "premium street food". Tránh giọng AI, tránh sáo rỗng, tránh
  "doanh nghiệp hoá".
- Hook mạnh, khác nhau giữa các ngày; mỗi ngày một mục tiêu (giới thiệu món,
  câu chuyện quán, combo, tương tác/UGC, hậu trường & nguyên liệu, khung giờ
  vàng/giao hàng, nhắc nhớ cuối tuần…).
- Bám brand/brief: dùng `brief.product_focus`/`brand.hero_product`,
  `brief.target_audience`, `brief.key_messages`, `brief.offer`,
  `brief.must_include`, `brand.tone_of_voice`.

TUYỆT ĐỐI KHÔNG (an toàn):
- KHÔNG bịa giá, % giảm giá, ưu đãi, địa chỉ, số điện thoại, giải thưởng, số
  lượng khách, lượt bán, đánh giá sao hay BẤT KỲ số liệu/định lượng nào. Nếu
  thiếu thông tin, ghi chú "Owner xác nhận …" thay vì bịa.
- KHÔNG bịa review/khách hàng nói gì (ngày UGC chỉ MỜI khách chia sẻ, không
  tự tạo lời chứng thực).
- KHÔNG nói nội dung đã được đăng/xuất bản/chạy quảng cáo. Mọi item là BẢN NHÁP
  chờ Owner duyệt.
- KHÔNG tạo ảnh, KHÔNG tạo video, KHÔNG link tới ảnh/asset.

Chỉ trả về JSON hợp lệ: { "items": [ { …N item… } ] }. Không kèm prose, không
markdown.
```

---

## 2. Normalize node — keep the response envelope identical

After the OpenAI node, the **Normalize** Code node MUST keep the SAME envelope the
placeholder returned (Core depends on it):

- Envelope: `ok: true`, `request_id`, `workflow_type: 'content_pack'`,
  `generated_by: 'n8n-ai-provider'`, `owner_approval_required: true`,
  `status: 'pending_approval'`, `job.item_count`, `items[]`,
  `safety: request.safety`.
- Each item: `day_number, channel, content_type, pillar, angle, hook, caption,
  visual_brief, cta, hashtags, generated_by:'n8n-ai-provider',
  workflow_type:'content_pack', status:'pending_approval',
  owner_approval_required:true`.
- **Do not** add any image/asset URL field.

> Core force-fills any missing item field and forces the `content_pack` metadata
> + safety lines, so even an imperfect AI response stays specific and correctly
> labelled — but a conformant Normalize node is still preferred.

---

## 3. Re-test on https://coreagency.digital (no redeploy needed for a prompt edit)

1. Open https://coreagency.digital → log in (Owner/Manager) → **Automation Factory**.
2. On the **Generate Content Pack** card confirm the mode chip = **n8n AI Provider**.
3. Select Client / Brand / Campaign / Brief (use a real FnB brand, e.g. Vị Cuốn),
   then generate.
4. Go to **Approval Board** → confirm **7 new pending items** (`needs_review`).
5. Open a few items and confirm:
   - Vietnamese FnB copy, strong varied hooks, platform-appropriate caption
     (TikTok = short script), concrete `visual_brief`, sensible `cta`.
   - NO invented price/discount/address/phone/award/metric; missing info appears
     as "Owner xác nhận …".
   - Metadata block shows `workflow_type: content_pack`, `source: n8n`,
     `generation_mode: external_module`, `status: pending_approval`,
     `owner_approval_required: true`, `safety: no_auto_post=true; no_auto_ads=true`.
6. Confirm nothing was posted, launched, published, scheduled, or sent to ads.

---

## 4. Rollback

- **Bad prompt output:** paste the previous system prompt back into the OpenAI
  node → Save. Instant; no Core change.
- **Full fallback to safe local content (instant):** in Vercel, remove/blank
  `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL` (Production) → Redeploy (cache off). Core
  reverts to **Local fallback mode** — the same 7 approval-first FnB items,
  labelled "Local fallback mode". No code/approval-logic change.

---

## 5. Safety guarantees (unchanged)

Approval-first only. Approved ≠ Published. No auto-post, no auto-ads, no live
Meta/TikTok/Zalo/Canva/ComfyUI/Fal.ai connectors, no image/video generation, no
live analytics pull, no unverified metrics. OpenAI key stays only in n8n
Credentials. No webhook URL/token/secret in the repo. Publishing/ads remain
blocked for a later Owner-approved phase.
