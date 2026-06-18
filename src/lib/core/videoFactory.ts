// Video Scripts Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// VIDEO SCRIPT (text/spec/script) approval items via the same n8n AI Provider
// external_module path as the Content Factory and Design Factory. It never
// generates video or images and never touches Canva / ComfyUI / Fal.ai / Meta /
// TikTok / Zalo. Output is approval-first text scripts only — nothing is posted,
// launched, scheduled, or rendered.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// video scripts unchanged (content_type = 'video_script'), so there is NO DB
// schema change. Structured script fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata
// pattern the Content Factory and Design Factory already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct mirrors the
// Design Factory fix so video items never mislabel as content_pack/design_brief.
const WORKFLOW_TYPE = 'video_scripts';
const CONTENT_TYPE = 'video_script';

// Fixed V1 set of video script items produced per run. Text/script only.
interface VideoScriptSpec {
  key: string;
  title: string;
  platform: string;
  format: string;
  objective: string;
}

// Platforms cover the short-form surfaces a Vietnamese FnB brand actually uses:
// TikTok, Facebook Reels, YouTube Shorts and Zalo short video. Formats are
// phone-shootable (9:16 vertical), not studio productions.
const VIDEO_SCRIPT_SPECS: VideoScriptSpec[] = [
  { key: 'hook_first_3s',            title: 'Hook / First 3 Seconds Script',                  platform: 'TikTok / Facebook Reels',                          format: '3 giây đầu của video dọc 9:16',              objective: 'Chặn lướt trong 1–3 giây đầu' },
  { key: 'short_form_script',        title: 'Short-Form Video Script (Reels/TikTok, 15–30s)', platform: 'TikTok / Facebook Reels / YouTube Shorts',         format: '15–30s dọc 9:16',                            objective: 'Kể trọn thông điệp trong 15–30s' },
  { key: 'voiceover_caption_script', title: 'Voiceover / Caption Script',                     platform: 'Đa kênh (TikTok · Reels · YouTube Shorts · Zalo)', format: '20–35s dọc 9:16, VO + caption khớp nhau',    objective: 'VO + caption khớp nhau, dẫn người xem tới CTA' },
  { key: 'shot_list_broll',          title: 'Shot List + B-roll Direction',                   platform: 'Production — quay bằng điện thoại',                format: 'Shot list / B-roll cho video 15–30s',        objective: 'Danh sách cảnh quay rõ ràng, quay được bằng điện thoại' },
  { key: 'editor_handoff_notes',     title: 'Editor Handoff Notes',                           platform: 'Internal — bàn giao dựng',                        format: 'Tài liệu bàn giao dựng (9:16)',              objective: 'Bàn giao bản dựng gọn cho người edit' },
];

export interface VideoScriptRequestPayload {
  request_id: string;
  workflow_type: 'video_scripts';
  generated_by: string;
  owner_approval_required: true;
  requested_at: string;
  client: { id: string; name: string };
  brand: {
    id: string;
    name: string;
    industry: string | null;
    hero_product: string | null;
    tone_of_voice: string | null;
    target_audience: string | null;
  };
  campaign: { id: string; name: string; description: string | null };
  brief: {
    id: string;
    title: string | null;
    campaign_goal: string | null;
    product_focus: string | null;
    offer: string | null;
    channels: string[] | null;
    must_include: string | null;
    must_avoid: string | null;
  };
  options: { channel: ContentFactoryOptions['channel']; goal: ContentFactoryOptions['goal'] };
  video_script_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_image_generation: true;
    no_video_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nVideoScriptItem {
  key?: string;
  title?: string;
  platform?: string;
  channel?: string;
  format?: string;
  objective?: string;
  target_audience?: string;
  customer_insight?: string;
  hook?: string;
  // scene_script is the preferred field; script_body is kept as a backward-compat
  // alias for the original V1 contract.
  scene_script?: string;
  script_body?: string;
  voiceover_text?: string;
  on_screen_text?: string;
  shot_direction?: string;
  food_styling?: string;
  duration?: string;
  cta?: string;
  owner_checklist?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nVideoScriptResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nVideoScriptItem[];
  error?: { code?: string; message?: string };
}

export interface VideoFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: VideoScriptRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class VideoFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoFactoryError';
  }
}

export function getVideoFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createVideoScriptPayload(input: ContentFactoryRunInput): VideoScriptRequestPayload {
  return {
    request_id: generateId('vf'),
    workflow_type: WORKFLOW_TYPE,
    generated_by: input.requestedBy,
    owner_approval_required: true,
    requested_at: new Date().toISOString(),
    client: { id: input.client.id, name: input.client.name },
    brand: {
      id: input.brand.id,
      name: input.brand.name,
      industry: input.brand.industry,
      hero_product: input.brand.hero_product,
      tone_of_voice: input.brand.tone_of_voice,
      target_audience: input.brand.target_audience,
    },
    campaign: { id: input.campaign.id, name: input.campaign.name, description: input.campaign.description },
    brief: {
      id: input.brief.id,
      title: input.brief.brief_title,
      campaign_goal: input.brief.campaign_goal,
      product_focus: input.brief.product_focus,
      offer: input.brief.offer,
      channels: input.brief.channels,
      must_include: input.brief.must_include,
      must_avoid: input.brief.must_avoid,
    },
    options: { channel: input.options.channel, goal: input.options.goal },
    video_script_types: VIDEO_SCRIPT_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_image_generation: true,
      no_video_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runVideoFactory(input: ContentFactoryRunInput): Promise<VideoFactoryResult> {
  const payload = createVideoScriptPayload(input);
  const webhookUrl = getVideoFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new VideoFactoryError(`n8n Video Scripts failed (${response.status}). No video scripts were created.`);
  }

  const data = await response.json() as N8nVideoScriptResponse;
  if (data.ok === false) {
    throw new VideoFactoryError(data.error?.message || 'n8n Video Scripts returned a failure response.');
  }
  // Exact-five enforcement: a non-array response is a contract breach (throw),
  // but an empty/short/overlong array is normalized to exactly 5 approval items
  // in buildResult — so the Approval Board always gets the expected 5 drafts.
  if (!Array.isArray(data.items)) {
    throw new VideoFactoryError('n8n Video Scripts returned invalid video script items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// ── Phase B3: senior-FnB Vietnamese short-form video defaults ──
// Written like a senior short-form video strategist for Vietnamese restaurants /
// local food brands (premium street food, modern, appetizing, visual-first). All
// scripts are phone-shootable by a small team — no impossible production. Derived
// from the brand/brief only: NEVER invents prices, discounts, addresses, phones,
// awards, testimonials, views/likes/reach/ROAS, or any metric (missing info
// becomes an "Owner xác nhận" / "Assumption" note). Shared by the local fallback
// and by mapVideoItem's per-field fallbacks, so an n8n response that omits fields
// still reads like a real strategist wrote it. Text/script only — no video gen.
function fnbVideoDefaults(input: ContentFactoryRunInput, spec: VideoScriptSpec) {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `món chủ lực của ${brand}`;
  const audience = input.brief.target_audience || input.brand.target_audience || 'khách địa phương mục tiêu của quán';
  const tone = input.brand.tone_of_voice || 'ấm áp, đáng tin, thèm ăn';
  const offer = input.brief.offer || null;
  const keyMessage = input.brief.key_messages?.[0] || `${product} chuẩn vị, tươi nóng mỗi ngày tại ${brand}`;
  const goal = input.options.goal;

  const cta =
    goal === 'sales'       ? 'Inbox/Zalo để đặt món ngay (Owner xác nhận thông tin liên hệ)' :
    goal === 'lead'        ? 'Để lại liên hệ để quán tư vấn & giữ chỗ' :
    goal === 'khai_truong' ? 'Lưu bài & ghé quán dịp khai trương nha' :
    goal === 'tuyen_sinh'  ? 'Nhắn tin để được tư vấn ngay' :
                             'Theo dõi quán để xem món mới mỗi ngày';

  // Shared across all 5 specs.
  const customerInsight = `${audience} thường vừa lướt điện thoại vừa đói, quyết định xem tiếp hay lướt qua chỉ trong 1–2 giây. Hình ${product} nóng/tươi kèm chuyển động (chan nước sốt, kéo sợi, cắt, rót) giữ chân tốt hơn lời giới thiệu dài dòng.`;
  const foodStyling = `Hero là MÓN: quay cận ${product} lúc ngon nhất — khói bốc nhẹ nếu nóng, nước sốt bóng, topping rõ. Nền mộc (gỗ/khay quán), ánh sáng tự nhiên gần cửa sổ. Quay món thật của quán, KHÔNG dàn dựng giả, KHÔNG tạo video/ảnh bằng AI.`;
  const ownerChecklist = '[ ] đúng nhận diện & giọng thương hiệu  [ ] quay món thật của quán (không AI)  [ ] giá/ưu đãi/địa chỉ/SĐT đã xác nhận nếu có nhắc tới  [ ] đúng chính tả & dấu tiếng Việt  [ ] nhạc nền hợp & không vi phạm bản quyền  [ ] caption + CTA đúng kênh đăng';

  // Per-spec script detail. Each stays shootable by phone / a small content team.
  let hook: string;
  let scenes: string;
  let voiceover: string;
  let onScreenText: string;
  let shotList: string;
  let duration: string;

  switch (spec.key) {
    case 'hook_first_3s':
      hook = `0–1s: cận cảnh ${product} đang "bốc khói" / chan nước sốt kèm tiếng động thật (ASMR). Chữ to: "Khoan đã 👀".`;
      scenes = `Chỉ tập trung 3 giây đầu — làm 2–3 biến thể để test: (A) cận động tác chan/kéo/cắt ${product}; (B) tay bưng món đặt xuống "cộp"; (C) khách vừa cắn vừa gật gù. Mỗi biến thể gắn 1 dòng chữ tò mò khác nhau.`;
      voiceover = `Gợi ý VO (giọng ${tone}): "Đợi đã… nhìn ${product} này đã rồi hẵng lướt." Hoặc bỏ VO, để tiếng động thật của món làm hook.`;
      onScreenText = `"Khoan đã 👀" / "Đợi xíu, ngon nè" — chữ to, tương phản cao, đặt 1/3 trên khung, tránh che phần ngon nhất của món.`;
      shotList = `1 cú cận duy nhất, lia chậm hoặc giữ yên; quay dọc 9:16 bằng điện thoại, khóa nét vào món, lau ống kính trước khi quay.`;
      duration = '3 giây đầu (trong tổng video 15–30s)';
      break;
    case 'short_form_script':
      hook = `0–3s: cận ${product} ngon mắt + chữ "${keyMessage}".`;
      scenes = `0–3s Hook: cận ${product} + chuyển động ngon mắt. 3–10s: khoe món + 1 lý do nên thử (tươi/nóng/đặc trưng của quán). 10–22s: cảnh ăn thật & phản ứng khách${offer ? `, nhắc ưu đãi (Owner xác nhận): ${offer}` : ''}. 22–30s: end card tên ${brand} + CTA.`;
      voiceover = `VO ngắn theo từng cảnh (giọng ${tone}): câu hook → "đây là ${product}" → vì sao đáng thử → câu chốt CTA. Mỗi câu một hơi, nói tự nhiên như đang rủ bạn đi ăn.`;
      onScreenText = `Caption chạy theo VO; tên món + điểm hấp dẫn ở giữa video;${offer ? ' ưu đãi (Owner xác nhận) hiện ở đoạn 10–22s;' : ''} CTA hiện ở cảnh cuối.`;
      shotList = `4–6 cảnh ngắn 2–4s: (1) cận món, (2) thao tác chế biến/bày, (3) bưng ra, (4) ăn & phản ứng, (5) không gian quán, (6) end card. Quay dọc 9:16 bằng điện thoại.`;
      duration = '15–30s (dọc 9:16)';
      break;
    case 'voiceover_caption_script':
      hook = `Câu mở VO: "${keyMessage}" — đọc trong lúc màn hình hiện cận ${product}.`;
      scenes = `Kịch bản theo từng câu, mỗi câu = 1 cảnh 2–4s + 1 dòng caption khớp: (1) Hook. (2) Đây là gì — ${product}. (3) Vì sao đáng thử (tươi/nóng/đặc trưng). (4) ${offer ? `Ưu đãi (Owner xác nhận): ${offer}` : 'Điểm đặc trưng của quán'}. (5) Câu chốt + CTA.`;
      voiceover = `Toàn bộ lời đọc, giọng ${tone}, ngắt câu rõ để dễ khớp caption. Đọc chậm vừa, thân thiện, không "đọc quảng cáo".`;
      onScreenText = `Caption bám sát VO từng câu (sub chạy), từ khóa quan trọng tô đậm; chừa vùng an toàn cho khung TikTok/Reels/Shorts (tránh nút che chữ).`;
      shotList = `Mỗi câu VO một cảnh: cận món, thao tác, bưng ra, khách ăn, end card. Có thể tái dùng cảnh từ kịch bản 15–30s.`;
      duration = '20–35s (dọc 9:16, VO + caption)';
      break;
    case 'shot_list_broll':
      hook = `(Phần này là hướng dẫn quay, không phải video đăng.) Ưu tiên quay cảnh hero ${product} trước để chắc chắn có "miếng" đẹp nhất.`;
      scenes = `Danh sách cảnh theo thứ tự quay: 1) cận ${product} (hero) — chan/kéo/cắt; 2) B-roll sơ chế/chế biến thật; 3) bưng món ra bàn; 4) khách ăn & phản ứng thật; 5) không gian / biển hiệu quán; 6) chỗ trống cho end card + CTA. Quay mỗi cảnh 2–3 lần cho an toàn khi dựng.`;
      voiceover = `Chưa cần VO ở bước quay — ghi chú giọng dự kiến (${tone}) để người dựng đọc đè sau. Nhớ thu vài đoạn tiếng động thật (xèo, rót, cắt) làm ASMR.`;
      onScreenText = `Chừa "đất trống" trong khung (1/3 trên hoặc dưới) để khi dựng chèn chữ mà không che món.`;
      shotList = `Thiết bị: điện thoại quay dọc 9:16, lau ống kính, khóa nét & khóa sáng, quay gần cửa sổ. Tránh zoom số — lại gần thay vì zoom. Quay ngang tầm món + thêm 1–2 góc 45° và top-down.`;
      duration = 'Đủ cảnh cho video 15–30s (quay dư ~2–3× thời lượng)';
      break;
    case 'editor_handoff_notes':
    default:
      hook = `(Tài liệu nội bộ cho người dựng.) Mục tiêu: bản dựng dọc 9:16 giữ chân trong 3 giây đầu và rõ CTA ở cuối.`;
      scenes = `Trình tự dựng: hook (3s) → thân (khoe ${product} + lý do nên thử) → cao trào (ăn & phản ứng${offer ? ' + nhắc ưu đãi' : ''}) → end card CTA. Cắt nhịp nhanh ở mở đầu, giữ cảnh ăn lâu hơn một nhịp.`;
      voiceover = `Lồng VO (nếu có) ở mức vừa, hạ nhạc nền xuống dưới giọng (ducking). Nếu không có VO thì để tiếng động món + nhạc nhẹ.`;
      onScreenText = `Sub/caption burn-in, font dễ đọc trên mobile, tương phản cao; tên món${offer ? ' & ưu đãi (Owner xác nhận)' : ''} & CTA hiện đủ lâu để đọc. Đúng chính tả & dấu tiếng Việt.`;
      shotList = `Thông số xuất: dọc 9:16 (1080×1920), H.264, ~30fps; chừa vùng an toàn tránh nút của TikTok/Reels/Shorts. Xuất kèm 1 bản không chữ để tái dùng.`;
      duration = 'Bản dựng cuối 15–30s (dọc 9:16)';
      break;
  }

  return {
    audience,
    customerInsight,
    foodStyling,
    ownerChecklist,
    keyMessage,
    hook,
    scenes,
    voiceover,
    onScreenText,
    shotList,
    duration,
    cta,
  };
}

function createFallbackVideoScriptItem(input: ContentFactoryRunInput, spec: VideoScriptSpec): N8nVideoScriptItem {
  const d = fnbVideoDefaults(input, spec);
  return {
    key: spec.key,
    title: spec.title,
    platform: spec.platform,
    format: spec.format,
    objective: spec.objective,
    target_audience: d.audience,
    customer_insight: d.customerInsight,
    hook: d.hook,
    scene_script: d.scenes,
    voiceover_text: d.voiceover,
    on_screen_text: d.onScreenText,
    shot_direction: d.shotList,
    food_styling: d.foodStyling,
    duration: d.duration,
    cta: d.cta,
    owner_checklist: d.ownerChecklist,
  };
}

function buildMockResult(input: ContentFactoryRunInput, payload: VideoScriptRequestPayload): VideoFactoryResult {
  const items: N8nVideoScriptItem[] = VIDEO_SCRIPT_SPECS.map(spec => createFallbackVideoScriptItem(input, spec));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

// Exact-five enforcement: drop non-object entries, cap an overlong response to
// the first 5, and pad a short/empty response with safe fallback video script
// drafts — so every run yields exactly 5 approval items.
function normalizeVideoScriptItems(input: ContentFactoryRunInput, sourceItems: N8nVideoScriptItem[]): N8nVideoScriptItem[] {
  const items = sourceItems
    .filter(item => item && typeof item === 'object')
    .slice(0, VIDEO_SCRIPT_SPECS.length);

  while (items.length < VIDEO_SCRIPT_SPECS.length) {
    items.push(createFallbackVideoScriptItem(input, VIDEO_SCRIPT_SPECS[items.length]));
  }

  return items;
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: VideoScriptRequestPayload,
  sourceItems: N8nVideoScriptItem[],
  mode: VideoFactoryResult['mode'],
  generatedBy: string,
): VideoFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const normalizedItems = normalizeVideoScriptItems(input, sourceItems);
  const items = normalizedItems.map((item, idx) => mapVideoItem(input, item, jobId, idx + 1, now, generatedBy, mode));

  const job: ContentPlanJob = {
    id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    plan_length_days: input.options.planLengthDays,
    generation_mode: mode === 'n8n' ? 'external_module' : 'mock',
    status: 'completed',
    requested_by: input.requestedBy,
    item_count: items.length,
    created_at: now,
    updated_at: now,
    completed_at: now,
    error_message: null,
  };

  return { mode, payload, job, items };
}

function mapVideoItem(
  input: ContentFactoryRunInput,
  item: N8nVideoScriptItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: VideoFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/platform/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = VIDEO_SCRIPT_SPECS.find(s => s.key === item.key)
    ?? VIDEO_SCRIPT_SPECS[sequence - 1]
    ?? VIDEO_SCRIPT_SPECS[0];

  const d = fnbVideoDefaults(input, spec);

  // Prefer AI/source values; fall back to senior-FnB Vietnamese defaults derived
  // from the brand/brief — never a generic "Owner to confirm".
  const title        = item.title || spec.title;
  const platform     = item.platform || item.channel || spec.platform;
  const objective    = item.objective || spec.objective;
  const audience     = item.target_audience || d.audience;
  const insight      = item.customer_insight || d.customerInsight;
  const hook         = item.hook || d.hook;
  const scenes       = item.scene_script || item.script_body || d.scenes;
  const voiceover    = item.voiceover_text || d.voiceover;
  const onScreenText = item.on_screen_text || d.onScreenText;
  const shotList     = item.shot_direction || d.shotList;
  const foodStyling  = item.food_styling || d.foodStyling;
  const duration     = item.duration || item.format || d.duration;
  const cta          = item.cta || d.cta;
  const ownerChecklist = item.owner_checklist || d.ownerChecklist;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Mục tiêu video: ${objective}`,
    `Nền tảng đề xuất: ${platform}`,
    `Khách hàng mục tiêu: ${audience}`,
    `Insight khách hàng: ${insight}`,
    `Hook 1–3 giây đầu: ${hook}`,
    `Kịch bản theo cảnh: ${scenes}`,
    `Voiceover / lời thoại: ${voiceover}`,
    `Chữ trên màn hình (on-screen text): ${onScreenText}`,
    `Shot list / hướng dẫn quay: ${shotList}`,
    `Food styling / hero món: ${foodStyling}`,
    `Thời lượng đề xuất: ${duration}`,
    `CTA: ${cta}`,
    `Checklist Owner duyệt: ${ownerChecklist}`,
    'An toàn: Draft video script only · Pending approval · Not generated as video · Not published.',
    '',
    '---',
    'Video Scripts V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_image_generation=true; no_video_generation=true',
  ].join('\n');

  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    day_number: sequence,
    planned_date: null,
    channel: platform,
    content_type: CONTENT_TYPE,
    pillar: 'Video Script',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: shotList,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #VideoScript`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
