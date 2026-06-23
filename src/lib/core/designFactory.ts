// Design Brief Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// DESIGN BRIEF (text/spec) approval items via the same n8n AI Provider
// external_module path as the Content Factory. It never generates images and
// never touches Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo. Output is
// approval-first text specs only — nothing is posted, launched, or scheduled.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// design briefs unchanged (content_type = 'design_brief'), so there is NO DB
// schema change. Structured design fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata
// pattern the Content Factory already uses).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';
import { buildAiFactoryBrandContext, type BrandContextSnapshot } from './brandBrain';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct fixes the
// earlier metadata bug where design items showed workflow_type: content_pack.
const WORKFLOW_TYPE = 'design_factory';
const CONTENT_TYPE = 'design_brief';

// brand_colors is a JSON map on the model; render it as a readable spec string.
function formatBrandColors(colors: Record<string, string> | null): string | null {
  if (!colors) return null;
  const entries = Object.entries(colors);
  if (!entries.length) return null;
  return entries.map(([name, value]) => `${name}: ${value}`).join(', ');
}

// Fixed V1 set of design brief items produced per run. Text/spec only.
interface DesignBriefSpec {
  key: string;
  title: string;
  platform: string;
  format: string;
  objective: string;
}

const DESIGN_BRIEF_SPECS: DesignBriefSpec[] = [
  { key: 'facebook_post',          title: 'Facebook Post Design Brief',        platform: 'Facebook',      format: '4:5 dọc (1080x1350) — tối ưu diện tích feed',          objective: 'Dừng lướt & tạo tương tác ở feed' },
  { key: 'story_reels_cover',      title: 'Story / Reels Cover Design Brief',  platform: 'Story / Reels', format: '9:16 dọc (1080x1920)',                                  objective: 'Cover tương phản cao để khách bấm xem' },
  { key: 'menu_promo_visual',      title: 'Menu / Promo Visual Design Brief',  platform: 'Facebook',      format: 'A5 in (148×210mm, 300dpi) + bản 4:5 cho social',        objective: 'Truyền đạt menu / ưu đãi rõ ràng' },
  { key: 'key_visual_direction',   title: 'Key Visual Direction',              platform: 'Cross-channel', format: 'Key visual chủ đạo (suy ra 4:5 / 9:16 / banner ngang)',  objective: 'Định hình hệ hình ảnh chủ đạo của chiến dịch' },
  { key: 'designer_handoff_notes', title: 'Designer Handoff Notes',            platform: 'Internal',      format: 'Tài liệu bàn giao (handoff)',                           objective: 'Bàn giao spec gọn gàng cho designer' },
];

export interface DesignBriefRequestPayload {
  request_id: string;
  workflow_type: 'design_factory';
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
    brand_colors: string | null;
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
  // Phase N: shared normalized Brand Brain context (same source as the Content
  // Factory) so design briefs stay grounded in one brand identity / voice.
  brand_brain_context: BrandContextSnapshot;
  design_brief_types: string[];
  // Image generation is explicitly out of scope for this V1 flow.
  generate_images: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_image_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nDesignBriefItem {
  key?: string;
  title?: string;
  platform?: string;
  channel?: string;
  format?: string;
  objective?: string;
  target_audience?: string;
  customer_insight?: string;
  key_message?: string;
  visual_direction?: string;
  food_styling?: string;
  layout_guidance?: string;
  typography?: string;
  copy_text?: string;
  copy_placement?: string;
  brand_style?: string;
  image_requirements?: string;
  designer_notes?: string;
  owner_checklist?: string;
  cta?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nDesignBriefResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nDesignBriefItem[];
  error?: { code?: string; message?: string };
}

export interface DesignFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: DesignBriefRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class DesignFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DesignFactoryError';
  }
}

export function getDesignFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createDesignBriefPayload(input: ContentFactoryRunInput): DesignBriefRequestPayload {
  return {
    request_id: generateId('df'),
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
      brand_colors: formatBrandColors(input.brand.brand_colors),
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
    brand_brain_context: buildAiFactoryBrandContext({
      brand: input.brand,
      client: input.client,
      campaign: input.campaign,
      brief: input.brief,
    }),
    design_brief_types: DESIGN_BRIEF_SPECS.map(spec => spec.key),
    generate_images: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_image_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runDesignFactory(input: ContentFactoryRunInput): Promise<DesignFactoryResult> {
  const payload = createDesignBriefPayload(input);
  const webhookUrl = getDesignFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new DesignFactoryError(`n8n Design Factory failed (${response.status}). No design briefs were created.`);
  }

  const data = await response.json() as N8nDesignBriefResponse;
  if (data.ok === false) {
    throw new DesignFactoryError(data.error?.message || 'n8n Design Factory returned a failure response.');
  }
  if (!Array.isArray(data.items)) {
    throw new DesignFactoryError('n8n Design Factory returned invalid design brief items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// ── Phase B2: senior-FnB Vietnamese design-brief defaults ──
// Derived from the brand/brief only — NEVER invents prices, discounts,
// addresses, phones, awards, testimonials, or metrics (missing info becomes an
// "Owner xác nhận" note). Shared by the local fallback and by mapDesignItem's
// per-field fallbacks, so an n8n response that omits fields still reads like a
// real senior creative-director brief. Text/spec only — no image generation.
function fnbDesignDefaults(input: ContentFactoryRunInput, spec: DesignBriefSpec) {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `món chủ lực của ${brand}`;
  const audience = input.brief.target_audience || input.brand.target_audience || 'khách địa phương mục tiêu của quán';
  const tone = input.brand.tone_of_voice || 'ấm áp, đáng tin, ngon mắt';
  const colors = formatBrandColors(input.brand.brand_colors) || 'Assumption: màu thương hiệu chính + nền trung tính, tương phản cao, dễ đọc';
  const offer = input.brief.offer || null;
  const keyMessage = input.brief.key_messages?.[0] || `${product} chuẩn vị, tươi mỗi ngày tại ${brand}`;
  const isHandoff = spec.key === 'designer_handoff_notes';

  return {
    audience,
    colors,
    keyMessage,
    customerInsight: `${audience} chọn chỗ ăn trong vài giây lướt điện thoại — hình ${product} phải "ngon mắt" ngay từ cái nhìn đầu tiên và chữ phải đọc được trên màn hình nhỏ.`,
    visual: `Lấy ${product} làm nhân vật chính trong khung hình ${brand} sạch, ngon mắt. Tông: ${tone}. Dùng ảnh thật của quán, không dàn dựng quá đà, không tạo ảnh AI.`,
    foodStyling: `Chụp cận ${product}: thấy rõ độ tươi/nước sốt/độ nóng (khói nhẹ nếu món nóng). Nền mộc (gỗ/giấy kraft), props tối giản, ánh sáng tự nhiên; tránh filter làm món trông "giả".`,
    layout: isHandoff
      ? 'Kèm file gốc phân lớp, font, thông số xuất, vùng an toàn và chỗ chữ phải luôn đọc rõ.'
      : 'Một điểm nhấn rõ ràng, chừa lề an toàn rộng, một thông điệp chính; chữ đọc rõ ở cỡ thumbnail.',
    typography: 'Tiêu đề sans-serif đậm, dễ đọc trên mobile; phụ đề mảnh hơn; tránh font uốn lượn khó đọc. Giá/ưu đãi (nếu có, Owner xác nhận) để cỡ lớn, tương phản cao.',
    copyText: `Headline gợi ý: "${keyMessage}".${offer ? ` Ưu đãi (Owner xác nhận): ${offer}.` : ' (Để trống giá/ưu đãi tới khi Owner xác nhận.)'}`,
    copyPlacement: 'Headline ở 1/3 trên; tên món + điểm hấp dẫn gần hero; CTA ở đáy. Chữ không đè lên phần ngon nhất của món; chừa vùng an toàn cho khung Story/Reels.',
    designerNotes: `Xuất đúng tỉ lệ ${spec.format}; giữ vùng an toàn cho text; chuẩn bị thêm 1 bản không chữ để tái sử dụng.${spec.key === 'menu_promo_visual' ? ' Bản in A5: 300dpi + chừa bleed 3mm.' : ''}`,
    ownerChecklist: '[ ] đúng nhận diện thương hiệu  [ ] ảnh món thật, không AI  [ ] giá/ưu đãi/địa chỉ đã xác nhận nếu có nhắc tới  [ ] đúng chính tả & dấu tiếng Việt  [ ] dễ đọc trên mobile',
    imageRequirements: 'Chỉ dùng ảnh/clip món thật do quán cung cấp. No AI image generation in this V1 flow.',
    cta: input.options.goal === 'sales' ? 'Inbox/Zalo để đặt món' : input.options.goal === 'lead' ? 'Để lại liên hệ để quán tư vấn' : 'Theo dõi để xem món mới',
  };
}

function buildMockResult(input: ContentFactoryRunInput, payload: DesignBriefRequestPayload): DesignFactoryResult {
  const items: N8nDesignBriefItem[] = DESIGN_BRIEF_SPECS.map(spec => createFallbackDesignBriefItem(input, spec));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

function createFallbackDesignBriefItem(input: ContentFactoryRunInput, spec: DesignBriefSpec): N8nDesignBriefItem {
  const d = fnbDesignDefaults(input, spec);
  return {
    key: spec.key,
    title: spec.title,
    platform: spec.platform === 'Facebook' ? input.options.channel : spec.platform,
    format: spec.format,
    objective: spec.objective,
    target_audience: d.audience,
    customer_insight: d.customerInsight,
    key_message: d.keyMessage,
    visual_direction: d.visual,
    food_styling: d.foodStyling,
    layout_guidance: d.layout,
    typography: d.typography,
    copy_text: d.copyText,
    copy_placement: d.copyPlacement,
    brand_style: d.colors,
    image_requirements: d.imageRequirements,
    designer_notes: d.designerNotes,
    owner_checklist: d.ownerChecklist,
    cta: d.cta,
  };
}

function normalizeDesignBriefItems(input: ContentFactoryRunInput, sourceItems: N8nDesignBriefItem[]): N8nDesignBriefItem[] {
  const items = sourceItems
    .filter(item => item && typeof item === 'object')
    .slice(0, DESIGN_BRIEF_SPECS.length);

  while (items.length < DESIGN_BRIEF_SPECS.length) {
    items.push(createFallbackDesignBriefItem(input, DESIGN_BRIEF_SPECS[items.length]));
  }

  return items;
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: DesignBriefRequestPayload,
  sourceItems: N8nDesignBriefItem[],
  mode: DesignFactoryResult['mode'],
  generatedBy: string,
): DesignFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const normalizedItems = normalizeDesignBriefItems(input, sourceItems);
  const items = normalizedItems.map((item, idx) => mapDesignItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapDesignItem(
  input: ContentFactoryRunInput,
  item: N8nDesignBriefItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: DesignFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/format/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = DESIGN_BRIEF_SPECS.find(s => s.key === item.key)
    ?? DESIGN_BRIEF_SPECS[sequence - 1]
    ?? DESIGN_BRIEF_SPECS[0];

  const d = fnbDesignDefaults(input, spec);

  // Prefer AI/source values; fall back to senior-FnB Vietnamese defaults derived
  // from the brand/brief — never a generic "Owner to confirm".
  const title         = item.title || spec.title;
  const platform      = item.platform || item.channel || (spec.platform === 'Facebook' ? input.options.channel : spec.platform);
  const format        = item.format || spec.format;
  const objective     = item.objective || spec.objective;
  const audience      = item.target_audience || d.audience;
  const insight       = item.customer_insight || d.customerInsight;
  const keyMsg        = item.key_message || d.keyMessage;
  const visual        = item.visual_direction || d.visual;
  const foodStyling   = item.food_styling || d.foodStyling;
  const layout        = item.layout_guidance || d.layout;
  const typography    = item.typography || d.typography;
  const copy          = item.copy_text || d.copyText;
  const placement     = item.copy_placement || d.copyPlacement;
  const colors        = item.brand_style || d.colors;
  const imageReq      = item.image_requirements || d.imageRequirements;
  const designerNotes = item.designer_notes || d.designerNotes;
  const ownerChecklist = item.owner_checklist || d.ownerChecklist;
  const cta           = item.cta || d.cta;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Mục tiêu thiết kế: ${objective}`,
    `Khách hàng mục tiêu: ${audience}`,
    `Insight khách hàng: ${insight}`,
    `Key message: ${keyMsg}`,
    `Concept hình ảnh: ${visual}`,
    `Food styling / hero món: ${foodStyling}`,
    `Bố cục (layout): ${layout}`,
    `Bảng màu: ${colors}`,
    `Typography: ${typography}`,
    `Format / ratio: ${format}`,
    `Vị trí copy (text placement): ${placement}`,
    `Nội dung copy gợi ý: ${copy}`,
    `Ghi chú cho designer: ${designerNotes}`,
    `Checklist Owner duyệt: ${ownerChecklist}`,
    `Yêu cầu hình ảnh: ${imageReq}`,
    `CTA: ${cta}`,
    'An toàn: Draft design brief only · Pending approval · Not generated as image · Not published.',
    '',
    '---',
    'Design Brief V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_image_generation=true',
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
    pillar: 'Design Brief',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: visual,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #DesignBrief`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
