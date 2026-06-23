import type { Brand, Campaign, CampaignBrief, Client, ContentPlanItem, ContentPlanJob, PlanLengthDays } from '../../types/core';
import { generateId } from './coreData';
import { buildAiFactoryBrandContext, type BrandContextSnapshot } from './brandBrain';

export type ContentFactoryChannel = 'Facebook' | 'TikTok' | 'Zalo';
export type ContentFactoryGoal = 'branding' | 'sales' | 'khai_truong' | 'lead' | 'tuyen_sinh';

export interface ContentFactoryOptions {
  planLengthDays: PlanLengthDays;
  channel: ContentFactoryChannel;
  goal: ContentFactoryGoal;
}

export interface ContentFactoryRunInput {
  client: Client;
  brand: Brand;
  campaign: Campaign;
  brief: CampaignBrief;
  options: ContentFactoryOptions;
  requestedBy: string;
}

export interface ContentFactoryRequestPayload {
  request_id: string;
  workflow_type: 'content_pack';
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
  campaign: {
    id: string;
    name: string;
    description: string | null;
  };
  brief: {
    id: string;
    title: string | null;
    campaign_goal: string | null;
    product_focus: string | null;
    offer: string | null;
    channels: string[] | null;
    content_pillars: string[] | null;
    key_messages: string[] | null;
    must_include: string | null;
    must_avoid: string | null;
    approval_requirements: string | null;
  };
  options: {
    plan_length_days: PlanLengthDays;
    channel: ContentFactoryChannel;
    goal: ContentFactoryGoal;
  };
  // Phase N: shared normalized Brand Brain context so every module grounds its
  // drafts in the SAME brand identity / voice / pillars / compliance notes.
  brand_brain_context: BrandContextSnapshot;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nContentItem {
  day_number: number;
  planned_date?: string | null;
  channel?: string;
  content_type?: string;
  pillar?: string;
  angle?: string;
  hook?: string;
  caption?: string;
  visual_brief?: string;
  cta?: string;
  hashtags?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
  owner_approval_required?: boolean;
}

interface N8nContentFactoryResponse {
  ok?: boolean;
  request_id?: string;
  workflow_type?: string;
  generated_by?: string;
  owner_approval_required?: boolean;
  status?: string;
  job?: {
    external_execution_id?: string | null;
    item_count?: number;
  };
  items?: N8nContentItem[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ContentFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: ContentFactoryRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class ContentFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentFactoryError';
  }
}

const WORKFLOW_TYPE = 'content_pack';

export function getContentFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createContentFactoryPayload(input: ContentFactoryRunInput): ContentFactoryRequestPayload {
  return {
    request_id: generateId('cf'),
    workflow_type: WORKFLOW_TYPE,
    generated_by: input.requestedBy,
    owner_approval_required: true,
    requested_at: new Date().toISOString(),
    client: {
      id: input.client.id,
      name: input.client.name,
    },
    brand: {
      id: input.brand.id,
      name: input.brand.name,
      industry: input.brand.industry,
      hero_product: input.brand.hero_product,
      tone_of_voice: input.brand.tone_of_voice,
      target_audience: input.brand.target_audience,
    },
    campaign: {
      id: input.campaign.id,
      name: input.campaign.name,
      description: input.campaign.description,
    },
    brief: {
      id: input.brief.id,
      title: input.brief.brief_title,
      campaign_goal: input.brief.campaign_goal,
      product_focus: input.brief.product_focus,
      offer: input.brief.offer,
      channels: input.brief.channels,
      content_pillars: input.brief.content_pillars,
      key_messages: input.brief.key_messages,
      must_include: input.brief.must_include,
      must_avoid: input.brief.must_avoid,
      approval_requirements: input.brief.approval_requirements,
    },
    options: {
      plan_length_days: input.options.planLengthDays,
      channel: input.options.channel,
      goal: input.options.goal,
    },
    brand_brain_context: buildAiFactoryBrandContext({
      brand: input.brand,
      client: input.client,
      campaign: input.campaign,
      brief: input.brief,
    }),
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runContentFactory(input: ContentFactoryRunInput): Promise<ContentFactoryResult> {
  const payload = createContentFactoryPayload(input);
  const webhookUrl = getContentFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ContentFactoryError(`n8n Content Factory failed (${response.status}). No content was created.`);
  }

  const data = await response.json() as N8nContentFactoryResponse;
  if (data.ok === false) {
    throw new ContentFactoryError(data.error?.message || 'n8n Content Factory returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ContentFactoryError('n8n Content Factory returned no content items.');
  }

  return buildResultFromItems(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// ── Phase B1: senior-FnB local fallback content (natural Vietnamese) ──
// Used when no n8n webhook is configured (dev / demo / offline). Produces a
// 7-day content pack that reads like a Vietnamese FnB agency wrote it, not
// generic AI. It NEVER invents prices, discounts, addresses, phone numbers,
// awards, customer counts, or performance metrics — anything unknown stays an
// Owner-confirm note. Item shape, count, the metadata block, and approval-first
// semantics are unchanged. (Production quality comes from the n8n OpenAI node;
// see CLAUDE_MARKETING_TEAM/07_runbooks/content_factory_v1_activation_runbook.md.)

const GOAL_LABEL_VI: Record<ContentFactoryGoal, string> = {
  branding:    'Tăng nhận diện thương hiệu',
  sales:       'Tăng đơn / chốt đơn',
  khai_truong: 'Khai trương',
  lead:        'Thu data khách quan tâm',
  tuyen_sinh:  'Tuyển sinh / tuyển dụng',
};

const OWNER_REVIEW_NOTE =
  'Ghi chú duyệt (Owner): bản nháp — cần Owner duyệt trước khi đăng. Xác nhận giá / ưu đãi / địa chỉ / SĐT / số liệu nếu có nhắc tới. Không tự đăng, không chạy ads. (Draft only · Pending approval · Not published)';

interface PlayContext {
  brand: string;
  product: string;
  audience: string | null;
  offer: string | null;
  mustInclude: string | null;
  message: string | null;
  channel: ContentFactoryChannel;
}

interface FnbPlay {
  pillar: string;
  objective: string;
  build: (c: PlayContext) => { hook: string; bodyLines: string[]; visual: string; cta: string };
}

function orderCta(channel: ContentFactoryChannel): string {
  if (channel === 'Zalo') return 'Nhắn Zalo để đặt món / giữ chỗ';
  if (channel === 'TikTok') return 'Bình luận "MÓN" để được nhắn cách đặt';
  return 'Inbox Trang để đặt món & nhận tư vấn';
}

// Platform-aware caption: a short shootable script for TikTok, a lead-with-hook
// social caption for Facebook / Zalo.
function assembleCaption(channel: ContentFactoryChannel, hook: string, bodyLines: string[], cta: string): string {
  if (channel === 'TikTok') {
    return [
      '🎬 Kịch bản TikTok ngắn (15–25s):',
      `• 0–2s (Hook): ${hook}`,
      `• 3–12s (Thân): ${bodyLines.join(' ')}`,
      `• 12–20s (Chốt): ${cta}`,
    ].join('\n');
  }
  return [hook, '', ...bodyLines, '', `👉 ${cta}`].join('\n');
}

// 7 reusable FnB "plays" cycled across the pack. Each adapts to brand / product
// / audience / offer from the brief and to the chosen platform.
const FNB_PLAYS: FnbPlay[] = [
  {
    pillar: 'Món signature',
    objective: 'Khoe món chủ lực, kích thích vị giác',
    build: (c) => ({
      hook: `${c.product} – món "tủ" của ${c.brand} đây rồi 😋`,
      bodyLines: [
        'Làm nóng tới đâu phục vụ tới đó, ăn là thấy mê.',
        c.message ? `${c.message}.` : `Một lần thử là nhớ vị ${c.brand}.`,
      ],
      visual: `Cận cảnh ${c.product}: thấy rõ topping/độ tươi, khói bốc nhẹ, ánh sáng tự nhiên, nền gỗ hoặc khay quán. 3–5 ảnh hoặc clip 10s xoay quanh món.`,
      cta: orderCta(c.channel),
    }),
  },
  {
    pillar: 'Câu chuyện thương hiệu',
    objective: 'Kể lý do ra đời & giá trị quán',
    build: (c) => ({
      hook: `Vì sao ${c.brand} làm ${c.product} theo kiểu "chậm mà chất"?`,
      bodyLines: [
        'Tụi mình muốn mỗi phần ăn đều tươi, sạch và đúng vị.',
        c.audience ? `Hợp với ${c.audience} thích ăn ngon mà yên tâm.` : 'Hợp với người thích ăn ngon mà yên tâm.',
      ],
      visual: 'Ảnh/clip chủ quán & gian bếp, khoảnh khắc chế biến thật, không gian quán ấm cúng.',
      cta: c.channel === 'TikTok' ? 'Theo dõi để xem hành trình làm món mỗi ngày' : 'Theo dõi Trang để không bỏ lỡ món mới',
    }),
  },
  {
    pillar: 'Combo & ưu đãi',
    objective: 'Giới thiệu combo tiện lợi (giá do Owner xác nhận)',
    build: (c) => ({
      hook: `Đói mà lười nghĩ? Để ${c.brand} lo combo cho!`,
      bodyLines: [
        c.offer ? `Gợi ý theo brief: ${c.offer}.` : 'Combo no nê cho bữa trưa/tối, hợp ăn một mình hay rủ thêm bạn.',
        'Tiện – gọn – đủ vị. (Để trống giá/ưu đãi tới khi Owner xác nhận.)',
      ],
      visual: 'Set combo bày đầy đặn trên khay, thấy rõ từng món, tông màu ấm. Có thể gắn nhãn "Combo" — không ghi giá nếu chưa được duyệt.',
      cta: orderCta(c.channel),
    }),
  },
  {
    pillar: 'Tương tác & UGC',
    objective: 'Khơi tương tác, mời khách chia sẻ (không bịa review)',
    build: (c) => ({
      hook: `Team "ăn là phải ngon" điểm danh! Bạn hợp món nào ở ${c.brand}?`,
      bodyLines: [
        'Comment món bạn mê nhất, hoặc tag đứa bạn hay rủ đi ăn 👇',
        'Tụi mình hóng gợi ý để ra thêm món mới.',
      ],
      visual: 'Ảnh nhóm bạn ăn uống vui vẻ quanh bàn món của quán; hoặc vài món xếp cạnh nhau để khách "chọn phe".',
      cta: c.channel === 'Zalo' ? 'Nhắn Zalo nếu muốn đặt thử món bạn chọn' : 'Comment + tag bạn bè nhé',
    }),
  },
  {
    pillar: 'Hậu trường & nguyên liệu',
    objective: 'Tạo niềm tin bằng quy trình & độ tươi',
    build: (c) => ({
      hook: `Ngon là có lý do: nhìn cách ${c.brand} chuẩn bị ${c.product} nè 👀`,
      bodyLines: [
        'Nguyên liệu chọn trong ngày, sơ chế sạch, làm nóng tới đâu phục vụ tới đó.',
        c.message ? `${c.message}.` : 'Quán giữ vệ sinh & chất lượng ổn định cho từng phần ăn.',
      ],
      visual: 'Clip ngắn/ảnh các bước sơ chế, nguyên liệu tươi, khu bếp gọn gàng. Tránh quay thông tin nhạy cảm.',
      cta: 'Lưu bài để ghé thử khi tiện',
    }),
  },
  {
    pillar: 'Giờ vàng & giao hàng',
    objective: 'Đẩy đơn theo khung giờ, gợi ý đặt giao',
    build: (c) => ({
      hook: c.channel === 'TikTok'
        ? 'Trưa đói mà chưa biết ăn gì? 3… 2… 1…'
        : `Tới giờ ăn rồi — ${c.product} của ${c.brand} sẵn sàng phục vụ!`,
      bodyLines: [
        c.mustInclude ? `Khu vực phục vụ/giao: ${c.mustInclude} (Owner xác nhận lại).` : 'Nhận giao quanh khu vực quán (Owner xác nhận khu vực).',
        'Đặt sớm giờ cao điểm để khỏi chờ lâu nha.',
      ],
      visual: 'Ảnh phần ăn đóng gói gọn gàng, chắc chắn, sẵn sàng giao; hoặc ảnh món nóng giờ trưa/tối.',
      cta: orderCta(c.channel),
    }),
  },
  {
    pillar: 'Nhắc nhớ & chốt tuần',
    objective: 'Nhắc nhớ thương hiệu, mời ghé cuối tuần',
    build: (c) => ({
      hook: `Cuối tuần ăn gì chưa? ${c.brand} gợi ý liền 👇`,
      bodyLines: [
        `Gợi ý vài món hợp gọi cuối tuần tại ${c.brand}.`,
        c.audience ? `Rủ ${c.audience} ghé đổi vị nhé.` : 'Rủ hội bạn ghé đổi vị nhé.',
      ],
      visual: 'Ghép 3–4 món nổi bật thành 1 ảnh lưới (collage), tông màu đồng nhất với thương hiệu.',
      cta: c.channel === 'Zalo' ? 'Nhắn Zalo đặt bàn/đặt món cuối tuần' : 'Lưu bài & ghé quán cuối tuần',
    }),
  },
];

function buildMockResult(input: ContentFactoryRunInput, payload: ContentFactoryRequestPayload): ContentFactoryResult {
  const items: N8nContentItem[] = [];
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || 'món chủ lực';
  const audience = input.brief.target_audience || input.brand.target_audience || null;
  const messages = input.brief.key_messages?.length ? input.brief.key_messages : [];
  const briefPillars = input.brief.content_pillars?.length ? input.brief.content_pillars : [];
  const goalVi = GOAL_LABEL_VI[input.options.goal];
  const channel = input.options.channel;

  for (let day = 1; day <= input.options.planLengthDays; day++) {
    const planned = new Date();
    planned.setDate(planned.getDate() + day);
    const play = FNB_PLAYS[(day - 1) % FNB_PLAYS.length];
    const message = messages.length ? messages[(day - 1) % messages.length] : null;
    const briefPillar = briefPillars.length ? briefPillars[(day - 1) % briefPillars.length] : null;
    const built = play.build({
      brand, product, audience, channel,
      offer: input.brief.offer,
      mustInclude: input.brief.must_include,
      message,
    });
    const caption = `${assembleCaption(channel, built.hook, built.bodyLines, built.cta)}\n\n${OWNER_REVIEW_NOTE}`;

    items.push({
      day_number: day,
      planned_date: planned.toISOString().slice(0, 10),
      channel,
      content_type: channel === 'TikTok' ? 'video_script' : 'caption',
      pillar: play.pillar,
      angle: `${goalVi} · ${play.objective}${briefPillar ? ` · ${briefPillar}` : ''}`,
      hook: built.hook,
      caption,
      visual_brief: built.visual,
      cta: built.cta,
      hashtags: [`#${brand.replace(/\s+/g, '')}`, '#monngon', '#quanngon', '#FnB', `#${channel}`].join(' '),
    });
  }
  return buildResultFromItems(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildResultFromItems(
  input: ContentFactoryRunInput,
  payload: ContentFactoryRequestPayload,
  sourceItems: N8nContentItem[],
  mode: ContentFactoryResult['mode'],
  generatedBy: string,
): ContentFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.slice(0, input.options.planLengthDays).map((item, idx) =>
    mapFactoryItem(input, item, jobId, idx + 1, now, generatedBy, mode),
  );

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

function mapFactoryItem(
  input: ContentFactoryRunInput,
  item: N8nContentItem,
  jobId: string,
  fallbackDay: number,
  now: string,
  generatedBy: string,
  mode: ContentFactoryResult['mode'],
): ContentPlanItem {
  const day = Number.isFinite(item.day_number) && item.day_number > 0 ? item.day_number : fallbackDay;
  const metadata = [
    '',
    '---',
    'Content Factory V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    `workflow_type: ${item.workflow_type || WORKFLOW_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${mode}`,
    'safety: no_auto_post=true; no_auto_ads=true',
  ].join('\n');

  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    day_number: day,
    planned_date: item.planned_date ?? null,
    channel: item.channel || input.options.channel,
    content_type: item.content_type || 'caption',
    pillar: item.pillar || 'Nội dung FnB',
    angle: item.angle || goalLabel(input.options.goal),
    hook: item.hook || `Bản nháp nội dung cho ${input.brand.name}`,
    caption: `${item.caption || `Bản nháp nội dung do Content Factory V1 tạo cho ${input.brand.name}. Owner duyệt trước khi đăng — không tự đăng, không chạy ads.`}${metadata}`,
    visual_brief: item.visual_brief || 'Gợi ý hình ảnh: ảnh/clip món thật của quán, ánh sáng tự nhiên, đúng nhận diện thương hiệu. Owner duyệt trước khi dùng.',
    cta: item.cta || 'Inbox/Zalo để đặt món (Owner xác nhận CTA & thông tin liên hệ).',
    hashtags: item.hashtags || `#${input.brand.name.replace(/\s+/g, '')} #monngon #FnB`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}

function goalLabel(goal: ContentFactoryGoal): string {
  return GOAL_LABEL_VI[goal];
}
