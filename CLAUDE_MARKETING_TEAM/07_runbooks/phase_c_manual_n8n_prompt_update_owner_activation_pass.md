# Phase C — Manual n8n Prompt Update Pack / Owner Activation Pass

**Date:** 2026-06-18
**Phase:** C — Manual n8n Prompt Update Pack / Owner Activation Pass
**Status:** Documentation/runbook only — Owner-gated manual action. No code, no n8n
workflow JSON, no Core redeploy, no Vercel env change.
**Predecessor:** Phase B — AI Factory V1 FnB Output Quality Tuning ✅ PASS
(rollup: `08_logs/phase_b_ai_factory_fnb_quality_tuning_rollup_20260618.md`).

---

## Purpose (read first)

Phase B tuned the **prompt/copy** for all 5 AI Factory V1 modules so generated
approval items read like a senior Vietnamese F&B specialist wrote them. **But the
production AI quality lever is a real OpenAI node whose prompt lives only inside
n8n (server-side, never in the repo).** Committing Phase B did **not** upgrade any
production prompt automatically.

This pack lets the **Owner** open the upgraded prompts (extracted verbatim from the
Phase B runbooks), copy each one, paste it into the correct production n8n OpenAI
node, **Save**, activate, and smoke test — entirely as an **n8n-only edit**.

> **This pack does NOT invent any new prompt.** Every prompt below is the exact
> upgraded prompt already living in the module's Phase B activation runbook. Each
> module's "COPY THIS PROMPT" section names the source file + exact heading so the
> Owner can verify against the source of truth.

### What this pack does NOT require — all true

- ❌ **No n8n workflow JSON re-import.** Updating a prompt is an in-node text edit
  + Save. The repo `n8n-workflows/*_v1.workflow.json` files are unchanged and do
  **not** need to be re-imported for a prompt update.
- ❌ **No Core redeploy.** Core already enforces safety, exact item counts, and
  senior-FnB force-fill regardless of the n8n prompt text.
- ❌ **No Vercel env change.** Webhook URLs and `VITE_*` vars are untouched.
- ✅ **OpenAI API key remains only in n8n Credentials.** Never paste the key into
  Core, Vercel, the repo, or this runbook.

### Per-module production status (important — read before editing)

| Module | Production status today | What "update the prompt" means here |
|---|---|---|
| **Content Factory V1** | **Production-active** via `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL`; n8n runs a real OpenAI node. | Direct edit: paste the new system prompt into the existing OpenAI node → Save. |
| **Design Factory V1** | Owner-gated. Production runs **Local fallback**; n8n workflow ships the deterministic **AI Provider Placeholder** (no real OpenAI node yet). | Applies **only if/when** the Owner has swapped in a real OpenAI node (Path B of that runbook). If a real OpenAI node exists, paste the new prompt into it. Otherwise use this prompt during Path B activation. |
| **Video Scripts V1** | Owner-gated. Local fallback; placeholder in n8n. | Same as Design Factory. |
| **Ads Pack Draft V1** | Owner-gated. Local fallback; placeholder in n8n. | Same as Design Factory. |
| **Report Draft V1** | Owner-gated. Local fallback; placeholder in n8n. | Same as Design Factory. |

> So for **4 of 5 modules** there may be **no production OpenAI node to edit yet** —
> production runs the safe Local fallback (which already shows Phase B quality). The
> prompt below is what to paste when the Owner runs that module's Path B activation
> (swap placeholder → real OpenAI node). Until then, no action is required for those
> modules and production stays safe on Local fallback. **Content Factory V1 is the
> one module with a live OpenAI node to edit today.**

---

## A. Owner checklist before editing n8n

Tick every box before changing any node:

- [ ] **Production n8n is open** (the same instance that hosts the Content Factory
      workflow), logged in.
- [ ] **Correct production workflow selected — NOT a test workflow.** Confirm the
      workflow name matches the table in Section B (e.g. "Content Factory V1 -
      Content Pack"). Do not edit a duplicate/test copy.
- [ ] **OpenAI credential already exists in n8n Credentials.** You are pasting
      prompt TEXT only — you should not need to touch the API key. If a node asks
      for a credential, select the existing one; never paste a raw key into a
      prompt field or the repo.
- [ ] **No webhook URL is copied into the repo or any doc.** Do not paste a
      Production/Test webhook URL into this runbook, the logs, commits, or chat.
- [ ] **Current workflow backed up inside the n8n UI** (only if the Owner wants a
      one-click rollback): open the workflow → **⋮ menu → Download** (exports the
      JSON to your machine, NOT to the repo), or copy the existing prompt text into
      a local scratch note before overwriting. n8n also keeps node/version history
      you can restore from.
- [ ] **Smoke-test method is the existing safe Owner-approved one** — trigger via
      the Core UI Automation Factory cards on https://coreagency.digital. Do **not**
      curl/expose the webhook URL.

---

## B. Manual update table for the 5 OpenAI nodes

> "Paste target" = the OpenAI node's **System prompt** field. After pasting, click
> **Save** in n8n. Do **not** touch the **Validate Contract + Safety** or **Return
> Validation Failure** nodes — they are the safety gate.

| # | Module | Production n8n workflow → node to find | Source runbook (exact prompt) | Exact heading to copy from | Paste target in n8n | Expected pending approval items | Smoke test (Owner-approved) | PASS condition | FAIL condition | Rollback note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Content Factory V1** | Workflow **"Content Factory V1 - Content Pack"** → the **OpenAI** node that replaced **AI Provider Placeholder** (between *Valid Request?* true → *Return Structured Content Pack*) | `07_runbooks/content_factory_v1_activation_runbook.md` | **"## 1. Upgraded system prompt (paste into the n8n OpenAI node)"** (the fenced block under it) | OpenAI node → **System prompt** field | **7-day content pack** (7 items, `needs_review`) | Core UI → **Automation Factory** → **Generate Content Pack** card (chip = *n8n AI Provider*) with a safe FnB brief (e.g. Vị Cuốn) | 7 pending items, Vietnamese senior-FnB copy, varied hooks, concrete `visual_brief`, metadata `workflow_type: content_pack` / `source: n8n` / `status: pending_approval`; nothing posted | Invented price/%/address/phone/award/metric appears; or items auto-post/launch; or count ≠ 7; or item mislabeled | Paste previous prompt back → Save (instant). Full fallback: blank `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL` in Vercel → redeploy |
| 2 | **Design Factory V1** | Workflow **"Design Factory V1 - Design Briefs"** → OpenAI node (Path B; replaces *AI Provider Placeholder*). *If still placeholder, no node to edit yet.* | `07_runbooks/design_factory_v1_activation_runbook.md` | **"## 2. (Path B only) Swap placeholder → real OpenAI node"** → step **4. System prompt** (the fenced block) | OpenAI node → **System prompt** field | **Exactly 5** design brief items (`needs_review`) | Core UI → **Generate Design Briefs** card | Success: "5 design brief approval items were created via n8n AI Provider. Nothing was posted or launched." 5 pending items, text/spec only, no `Owner to confirm` (missing → `Assumption: …`) | Any image/asset URL produced; invented metric/price; count ≠ 5; mislabeled `content_pack` | Paste previous prompt back → Save. Full fallback: blank `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` → redeploy / toggle workflow Inactive |
| 3 | **Video Scripts V1** | Workflow **"Video Scripts V1 - Video Scripts"** → OpenAI node (Path B; replaces *AI Provider Placeholder*). *If still placeholder, no node to edit yet.* | `07_runbooks/video_scripts_v1_activation_runbook.md` | **"## 2. (Path B only) Swap placeholder → real OpenAI node"** → step **4. System prompt** (the fenced block) | OpenAI node → **System prompt** field | **Exactly 5** video script items (`needs_review`) | Core UI → **Generate Video Scripts** card | Success: "5 video script approval items were created via n8n AI Provider. Nothing was posted or launched." 5 pending items, text/script only, phone-shootable, no video/image generated | Video/image generated or asset URL; invented views/likes/ROAS; count ≠ 5; mislabeled | Paste previous prompt back → Save. Full fallback: blank `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` → redeploy / toggle Inactive |
| 4 | **Ads Pack Draft V1** | Workflow **"Ads Pack Draft V1 - Ads Pack"** → OpenAI node (Path B; replaces *AI Provider Placeholder*). *If still placeholder, no node to edit yet.* | `07_runbooks/ads_pack_v1_activation_runbook.md` | **"## 2. (Path B only) Swap placeholder → real OpenAI node"** → step **4. System prompt** (the fenced block) | OpenAI node → **System prompt** field | **Exactly 5** ads draft items (`needs_review`) | Core UI → **Generate Ads Pack** card | Success: "5 ads draft approval items were created via n8n AI Provider. These are drafts only — no ads were created, launched, scheduled, or spent." 5 pending items, strategy/draft only | Any ad/campaign/ad-set created, launched, scheduled, or spent; invented CPM/CPC/CTR/ROAS; fake urgency; count ≠ 5 | Paste previous prompt back → Save. Full fallback: blank `VITE_N8N_ADS_PACK_WEBHOOK_URL` → redeploy / toggle Inactive |
| 5 | **Report Draft V1** | Workflow **"Report Draft V1 - Report Draft"** → OpenAI node (Path B; replaces *AI Provider Placeholder*). *If still placeholder, no node to edit yet.* | `07_runbooks/report_draft_v1_activation_runbook.md` | **"## 2. (Path B only) Swap placeholder → real OpenAI node"** → step **4. System prompt** (the fenced block) | OpenAI node → **System prompt** field | **Exactly 5** report draft items (`needs_review`) | Core UI → **Generate Report Draft** card | Success: "5 report draft approval items were created via n8n AI Provider. These are drafts only — no live analytics were pulled and nothing was posted or launched." 5 pending items; `data_status` states no live analytics; no fabricated numbers | Any live-analytics pull/claim; any invented metric; testimonial fabricated; count ≠ 5 | Paste previous prompt back → Save. Full fallback: blank `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` → redeploy / toggle Inactive |

> **Safety net regardless of prompt:** Core force-fills missing fields with the
> Phase B senior-FnB defaults, force-sets `workflow_type`/`content_type`, enforces
> the exact item count, and appends safety lines — so even an imperfect or older
> prompt cannot mislabel items, fabricate metrics, or break the count. A conformant
> prompt + Normalize node is still preferred for best-quality copy.

---

## C. Copy-paste prompt sections

> Each prompt below is reproduced **verbatim** from the named Phase B runbook. The
> runbook remains the source of truth; if a prompt ever differs, trust the runbook
> and update this pack. Paste only the text **inside** the code block into the
> OpenAI node's **System prompt** field, then **Save**.

### CONTENT FACTORY V1 — COPY THIS PROMPT
*Source: `07_runbooks/content_factory_v1_activation_runbook.md` → "## 1. Upgraded
system prompt (paste into the n8n OpenAI node)".*

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

### DESIGN FACTORY V1 — COPY THIS PROMPT
*Source: `07_runbooks/design_factory_v1_activation_runbook.md` → "## 2. (Path B
only) Swap placeholder → real OpenAI node" → step 4 (System prompt).*

```
Bạn là GIÁM ĐỐC SÁNG TẠO (creative director) của một agency F&B Việt Nam,
viết DESIGN BRIEF (chỉ text/spec, KHÔNG tạo ảnh, KHÔNG xuất link ảnh) cho quán
ăn/nhà hàng, street food, quán ăn vặt, cà phê/trà sữa và F&B bán mang đi/giao
hàng (vd: Vị Cuốn, cơm tấm, bún đậu, chè, cà phê, trà sữa, quán địa phương).

Dựa trên request JSON (brand, brief, campaign, options), tạo ĐÚNG 5 design
brief item, theo thứ tự, với các `key`:
  1. facebook_post          — Facebook Post Design Brief
  2. story_reels_cover      — Story / Reels Cover Design Brief
  3. menu_promo_visual      — Menu / Promo Visual Design Brief
  4. key_visual_direction   — Key Visual Direction
  5. designer_handoff_notes — Designer Handoff Notes

Với MỖI item, điền ĐẦY ĐỦ các field sau bằng tiếng Việt cụ thể, bám brand/brief
và thực thi được bởi designer/chủ quán địa phương:
  title, platform, format (tỉ lệ + px; gợi ý Facebook 4:5, Story/Reels 9:16,
    menu/poster A5 in, banner nếu hợp), objective (mục tiêu thiết kế),
  target_audience, customer_insight (insight khách hàng),
  key_message (thông điệp chính), visual_direction (concept hình ảnh),
  food_styling (cách bày/chụp món, hero là MÓN), layout_guidance (bố cục),
  typography (hướng font, dễ đọc mobile), copy_text (headline/dòng chữ thật),
  copy_placement (vị trí đặt text), brand_style (màu sắc/nhận diện),
  image_requirements (ghi rõ: CHỈ ảnh món thật do quán cung cấp — không tạo ảnh
    AI), designer_notes (ghi chú kỹ thuật cho designer),
  owner_checklist (checklist để Owner duyệt), cta.

Giọng: hiện đại, "premium street food", sạch, ngon mắt, dễ đọc; tránh ngôn ngữ
thiết kế "doanh nghiệp" sáo rỗng và tránh ý tưởng quá phức tạp mà chủ quán
không làm được.

TUYỆT ĐỐI KHÔNG: tạo ảnh; nói đã tạo file ảnh; nói dùng Canva/ComfyUI/Fal.ai;
bịa giá/% giảm/địa chỉ/SĐT/giải thưởng/số liệu/đánh giá/khách nói gì; nói nội
dung đã đăng/chạy ads/chi tiền/analytics. Mọi item là BẢN NHÁP chờ Owner duyệt.
Nếu thiếu thông tin, ghi "Assumption: ..." hoặc "Owner xác nhận ..." — KHÔNG
viết "Owner to confirm".

Chỉ trả về JSON hợp lệ: { "items": [ {…5 item…} ] }. Không prose, không markdown.
```

---

### VIDEO SCRIPTS V1 — COPY THIS PROMPT
*Source: `07_runbooks/video_scripts_v1_activation_runbook.md` → "## 2. (Path B
only) Swap placeholder → real OpenAI node" → step 4 (System prompt).*

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

---

### ADS PACK DRAFT V1 — COPY THIS PROMPT
*Source: `07_runbooks/ads_pack_v1_activation_runbook.md` → "## 2. (Path B only)
Swap placeholder → real OpenAI node" → step 4 (System prompt).*

```
Bạn là CHUYÊN GIA PERFORMANCE MARKETING (quảng cáo) của một agency F&B Việt
Nam, viết BẢN NHÁP QUẢNG CÁO (chỉ text/strategy/spec — KHÔNG tạo chiến dịch,
KHÔNG tạo ad set, KHÔNG tạo/đăng/lên lịch quảng cáo, KHÔNG set hay chi ngân
sách, KHÔNG tạo ảnh/video, KHÔNG gọi tài khoản quảng cáo thật) cho quán
ăn/nhà hàng, street food, quán ăn vặt, cà phê/trà sữa và F&B bán mang đi/giao
hàng (vd: Vị Cuốn, cơm tấm, bún đậu, chè, cà phê, trà sữa, quán địa phương).

Dựa trên request JSON (brand, brief, campaign, options), tạo ĐÚNG 5 ads draft
item, theo thứ tự, với các `key`:
  1. campaign_angle_offer — Campaign Angle & Offer Draft
  2. ad_copy_variants     — Ad Copy Variants Draft
  3. audience_targeting   — Audience & Targeting Notes
  4. budget_testing_plan  — Budget & Testing Plan Draft
  5. ads_manager_handoff  — Ads Manager Handoff Checklist

Với MỖI item, điền ĐẦY ĐỦ các field sau bằng tiếng Việt cụ thể, bám brand/brief
và THỰC TẾ với quán địa phương:
  title, focus, objective (mục đích của bản nháp này),
  campaign_objective (mục tiêu chiến dịch đề xuất — chọn trong: nhận diện
    /awareness, tương tác/engagement, tin nhắn·inbox/messages, traffic, ghé
    quán/local store visit, đặt món·giao hàng/delivery·order intent),
  target_audience (giả thuyết tệp khách), customer_insight (insight khách hàng),
  offer_angle (góc tiếp cận / thông điệp), primary_text (nháp primary text),
  headline (nháp headline), description (nháp description nếu hợp),
  creative_direction (food hero / combo·menu / không gian quán / câu chuyện chủ
    quán / UGC·review-style), placement (Facebook Feed / Facebook Reels /
    Instagram·Reels nếu hợp / Zalo·social chỉ là ý tưởng nháp),
  cta, owner_checklist (checklist Owner duyệt).

Giọng: hiện đại, ngon mắt, hướng chuyển đổi nhưng không "giật"; viết như một
marketer giỏi cho quán địa phương, không generic AI.

TUYỆT ĐỐI KHÔNG: tạo/đăng/lên lịch/bật quảng cáo; tạo chiến dịch hay ad set;
set hay chi ngân sách; nói đã chạy ads/đã tiêu tiền; tạo ảnh/video hay nói đã
tạo file; nói đã kết nối/đăng Meta·TikTok·Zalo·Google Ads·Canva·ComfyUI·Fal.ai;
bịa giá/% giảm/địa chỉ/SĐT/giải thưởng/đánh giá/lượng khách; bịa số liệu
CPM/CPC/CTR/ROAS/reach/impressions/clicks/messages/orders; tạo cảm giác khan
hiếm giả hay khuyến mãi giả; hứa hẹn kết quả / nhắm mục tiêu bất khả thi. Mọi
item là BẢN NHÁP chờ Owner duyệt. Nếu thiếu thông tin, ghi "Assumption: ..."
hoặc "Owner xác nhận ..." — KHÔNG viết "Owner to confirm".

Chỉ trả về JSON hợp lệ: { "items": [ {…5 item…} ] }. Không prose, không markdown.
```

---

### REPORT DRAFT V1 — COPY THIS PROMPT
*Source: `07_runbooks/report_draft_v1_activation_runbook.md` → "## 2. (Path B
only) Swap placeholder → real OpenAI node" → step 4 (System prompt).*

```
Bạn là CHIẾN LƯỢC GIA (strategist) cấp cao của một agency F&B Việt Nam, soạn
BẢN NHÁP BÁO CÁO (chỉ text/notes/spec) cho quán ăn/nhà hàng, street food, cà
phê/trà sữa, chè, cơm tấm, bún đậu, quán địa phương (vd: Vị Cuốn). Giọng: hiện
đại, thân thiện với khách, KHÔNG quá "doanh nghiệp"; giúp Owner hiểu cần kiểm
tra gì tiếp theo.

Dựa trên request JSON (brand, brief, campaign, options), tạo ĐÚNG 5 report
draft item, theo thứ tự, với các `key`:
  1. campaign_status_summary — Campaign Status Summary Draft
  2. performance_insight     — Performance Insight Notes
  3. content_creative_review — Content & Creative Review Notes
  4. risks_learnings_actions — Risks, Learnings & Next Actions
  5. report_handoff          — Owner / Client Report Handoff Draft

Với MỖI item, điền ĐẦY ĐỦ các field sau bằng tiếng Việt cụ thể:
  title, focus, objective (mục tiêu báo cáo),
  period (kỳ báo cáo — chỉ là placeholder, ghi "Owner cấp ngày" nếu chưa có,
    KHÔNG suy đoán ngày),
  data_status (tình trạng nguồn dữ liệu — nêu rõ 4 trạng thái: provided data /
    simulated data / missing data / owner input required),
  exec_summary (tóm tắt điều hành — KHÔNG có số bịa),
  key_observations (quan sát chính — chỉ dựa trên dữ liệu được cấp, nếu không
    có thì ghi rõ là giả định/cần Owner cấp),
  content_review (rà soát nội dung & sáng tạo),
  campaign_ads_review (rà soát chiến dịch/quảng cáo — bản nháp, KHÔNG số liệu
    hiệu suất giả),
  customer_insight (insight khách/đơn — CHỈ điền khi có dữ liệu Owner cấp),
  next_actions (hành động đề xuất tiếp theo),
  owner_questions (câu hỏi cho Owner/khách trước khi chốt),
  owner_checklist (checklist Owner duyệt).

TUYỆT ĐỐI KHÔNG: kéo/giả vờ kéo analytics; nói có quyền truy cập dữ liệu
Meta/TikTok/Zalo/Google/Google Analytics/POS/ShopeeFood/GrabFood/CRM; bịa bất
kỳ con số nào — chi phí, doanh thu, ROAS, click, hiển thị, tiếp cận, lượt
xem/like/comment, tin nhắn, đơn, tỉ lệ chuyển đổi, số khách; bịa đánh
giá/testimonial; nói đã chạy ads/đã đăng bài/đã gửi báo cáo cho khách; thêm
hành vi connector live; tạo ảnh/video. Nếu thiếu số liệu, để placeholder có
nhãn "Owner cấp" / "Assumption: ..." — KHÔNG bịa số, KHÔNG viết "Owner to
confirm". Chỉ kết luận hiệu quả khi có số liệu thật do Owner cấp; nếu không có,
nói rõ "chưa có dữ liệu để kết luận".

Chỉ trả về JSON hợp lệ: { "items": [ {…5 item…} ] }. Không prose, không markdown.
```

---

## D. Production smoke test plan (per module)

Run the smoke test for **each module whose prompt you updated**. Use the existing
safe Owner-approved method — the Core UI — never the raw webhook.

For each module:

1. **Trigger via Core UI**, not the webhook: open https://coreagency.digital → log
   in (Owner/Manager) → **Automation Factory** tab → use that module's Generate
   card. **Do not expose or paste the webhook URL anywhere.**
2. **Use a safe FnB brief** (e.g. a real local brand like Vị Cuốn) — select Client
   / Brand / Campaign / Brief, then click Generate.
3. **Confirm Core receives items as pending approval only** — go to the **Approval
   Board**: items are `needs_review` / pending approval (counts in Section E).
4. **Confirm nothing was posted, launched, scheduled, spent, or published.** The
   success toast explicitly says "Nothing was posted or launched" (Ads adds
   "no ads were created, launched, scheduled, or spent"; Report adds "no live
   analytics were pulled").
5. **Confirm Approved ≠ Published.** Approving an item only marks the draft
   reviewed; it never posts, launches, schedules, spends, or sends.
6. **Confirm no fake analytics are presented as real** (all modules) — no invented
   spend/revenue/ROAS/clicks/impressions/reach/views/likes/comments/messages/
   orders/conversion/customer counts/testimonials.
7. **(Report Draft only) Confirm the report labels simulated/provided data
   correctly** — each item's `data_status` states no live analytics were pulled and
   marks figures as provided / simulated / missing / owner-input-required; missing
   numbers stay labelled "Owner cấp" / "Assumption", never invented.

> If a module is still on the placeholder/Local fallback (no real OpenAI node),
> the smoke test still passes safely — the only difference is the copy is the safe
> deterministic/fallback text, not freshly AI-written.

---

## E. Expected output counts

| Module | Expected pending approval items |
|---|---|
| **Content Factory V1** | **7-day content pack** (7 items / daily plays) |
| **Design Factory V1** | **exactly 5** design brief approval items |
| **Video Scripts V1** | **exactly 5** video script approval items |
| **Ads Pack Draft V1** | **exactly 5** ads draft approval items |
| **Report Draft V1** | **exactly 5** report draft approval items |

Core enforces these counts (`normalize*Items()` caps overlong responses to the
first 5 and pads short/empty ones with safe fallback drafts; Content Factory keeps
its 7-day pack). `job.item_count` matches the visible count.

---

## F. Rollback plan

If any updated prompt produces bad or unsafe output:

1. **Restore the previous prompt text** — paste the prior system prompt back into
   the OpenAI node from your manual backup (Section A) or n8n node/version history
   → **Save**. Instant; no Core change.
2. **Do not change credentials** — leave the OpenAI credential in n8n untouched.
3. **Do not change the webhook URL** — it stays exactly as-is in Vercel.
4. **Do not change Core** — no redeploy, no code, no Vercel env edit.
5. **Re-run the Section D smoke test** for that module after rollback to confirm it
   is back to the previous safe behavior.

**Full fallback to safe local content (if needed):** blank that module's
`VITE_N8N_*_WEBHOOK_URL` in Vercel → Redeploy (build cache off) → Core reverts to
Local fallback mode (same approval-first items, labelled "Local fallback mode").
Optionally toggle the n8n workflow **Inactive**. No code or approval-logic change.

---

## G. PASS / FAIL criteria

### PASS only if ALL of the following hold
- [ ] All **5 production prompts are documented for Owner copy-paste** (Section C).
- [ ] **Manual update steps are clear** (Sections A + B).
- [ ] **Smoke test steps are clear** (Section D).
- [ ] **Safety rules are preserved** — approval-first; Approved ≠ Published; no
      auto-post; no auto-ads; no live connectors; no image/video generation; no
      live analytics pull; no fake metrics.
- [ ] **No n8n workflow JSON is changed** unless explicitly justified (none here).
- [ ] **No secrets / webhook URLs committed.**
- [ ] **No live connectors added.**
- [ ] **No image/video generation added.**
- [ ] **No fake metrics introduced.**
- [ ] `npm run build` **PASS**.
- [ ] `npm run test` **PASS**.
- [ ] Contract validation **PASS** (`node contracts/tools/validate_contracts.js`).

### FAIL if ANY of the following occur
- [ ] Any real webhook URL is committed.
- [ ] Any API key / secret is committed.
- [ ] Any live connector is added.
- [ ] Any module auto-posts, auto-launches ads, schedules posts, spends money, or
      publishes content.
- [ ] Approved is treated as Published.
- [ ] Any report uses unverified metrics as real.
- [ ] Workflow JSON changes without explicit need.
- [ ] Tests fail.

---

## Owner next manual steps inside n8n (quick path)

1. Open production n8n → run **Section A** checklist.
2. **Content Factory V1 (live today):** open "Content Factory V1 - Content Pack" →
   OpenAI node → paste the **CONTENT FACTORY V1** prompt (Section C) into **System
   prompt** → **Save** → smoke test via Core UI (Section D) → expect **7** pending
   items.
3. **Design / Video / Ads / Report (Owner-gated):** these run Local fallback in
   production today. When you activate a module's Path B (swap placeholder → real
   OpenAI node, per its runbook), paste that module's **COPY THIS PROMPT** block
   (Section C) into the new OpenAI node → **Save** → smoke test → expect **5**
   pending items each. If a real OpenAI node already exists, just paste + Save.
4. Confirm every run lands as **pending approval only** and that **nothing was
   posted, launched, scheduled, spent, or published**.
5. Keep the OpenAI key only in n8n Credentials. No re-import, no Core redeploy, no
   Vercel env change for a prompt update.

---

## Safety guarantees (unchanged)

Approval-first only. **Approved ≠ Published.** No auto-post, no auto-ads, no live
Meta/TikTok/Zalo/Google Ads/Canva/ComfyUI/Fal.ai connectors, no image/video
generation, no live analytics pull, no unverified metrics. OpenAI API key stays
only in n8n Credentials. No webhook URL/token/secret in the repo. Production
workflow JSON unchanged. Publishing/ads remain blocked for a later Owner-approved
phase.
