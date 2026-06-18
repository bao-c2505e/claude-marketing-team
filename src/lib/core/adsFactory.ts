// Ads Pack Draft Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// ADS PACK (strategy/spec/draft) approval items via the same n8n AI Provider
// external_module path as the Content / Design / Video factories. It is
// STRATEGY & DRAFT NOTES ONLY: it never creates, launches, schedules, or spends
// ads, never generates images or video, and never touches any live
// Meta / TikTok / Zalo / Google Ads / Canva / ComfyUI / Fal.ai connector.
// Output is approval-first text drafts only — nothing is posted or launched.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// ads drafts unchanged (content_type = 'ads_draft'), so there is NO DB schema
// change. Structured ads fields that have no dedicated column are rendered into
// the item caption as a readable spec block (same metadata pattern the Content,
// Design, and Video factories already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryGoal, ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct mirrors the
// Video Scripts fix so ads items never mislabel as content_pack/video_script.
const WORKFLOW_TYPE = 'ads_pack';
const CONTENT_TYPE = 'ads_draft';

// Fixed V1 set of ads draft items produced per run. Strategy/draft notes only —
// no campaigns, ad sets, ads, audiences, budgets, or launches are ever created.
interface AdsPackSpec {
  key: string;
  title: string;
  focus: string;
  objective: string;
}

const ADS_PACK_SPECS: AdsPackSpec[] = [
  { key: 'campaign_angle_offer', title: 'Campaign Angle & Offer Draft',  focus: 'Định vị & offer',           objective: 'Chốt góc chiến dịch chính + offer để test' },
  { key: 'ad_copy_variants',     title: 'Ad Copy Variants Draft',        focus: 'Primary text & headline',   objective: 'Nháp nhiều biến thể copy để Owner A/B' },
  { key: 'audience_targeting',   title: 'Audience & Targeting Notes',    focus: 'Chiến lược tệp khách',      objective: 'Phác tệp khách & ghi chú target (không tạo tệp thật)' },
  { key: 'budget_testing_plan',  title: 'Budget & Testing Plan Draft',   focus: 'Ngân sách & cấu trúc test', objective: 'Nháp cách chia ngân sách test để Owner duyệt (không set / chi tiền)' },
  { key: 'ads_manager_handoff',  title: 'Ads Manager Handoff Checklist', focus: 'Bàn giao set tay',          objective: 'Checklist để người thật set tay trên Ads Manager sau khi duyệt' },
];

export interface AdsPackRequestPayload {
  request_id: string;
  workflow_type: 'ads_pack';
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
  ads_pack_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  // Ads creation / launch are explicitly out of scope — drafts only.
  create_ads: false;
  launch_ads: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_platform_launch: true;
    no_image_generation: true;
    no_video_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nAdsItem {
  key?: string;
  title?: string;
  focus?: string;
  objective?: string;
  // Phase B4 senior-FnB fields. campaign_objective is the suggested Meta/social
  // campaign objective (awareness / engagement / messages / traffic / store-visit
  // / order-intent); the copy fields are draft-only ad copy.
  campaign_objective?: string;
  target_audience?: string;
  customer_insight?: string;
  offer_angle?: string;
  primary_text?: string;
  headline?: string;
  description?: string;
  creative_direction?: string;
  placement?: string;
  cta?: string;
  owner_checklist?: string;
  // Backward-compat aliases from the original V1 contract: draft_body → primary
  // text, key_points → offer/message angle. Still accepted so an older n8n
  // Normalize node keeps working.
  draft_body?: string;
  key_points?: string;
  testing_note?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nAdsResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nAdsItem[];
  error?: { code?: string; message?: string };
}

export interface AdsFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: AdsPackRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class AdsFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdsFactoryError';
  }
}

export function getAdsFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_ADS_PACK_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createAdsPackPayload(input: ContentFactoryRunInput): AdsPackRequestPayload {
  return {
    request_id: generateId('af'),
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
    ads_pack_types: ADS_PACK_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    create_ads: false,
    launch_ads: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_platform_launch: true,
      no_image_generation: true,
      no_video_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runAdsFactory(input: ContentFactoryRunInput): Promise<AdsFactoryResult> {
  const payload = createAdsPackPayload(input);
  const webhookUrl = getAdsFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AdsFactoryError(`n8n Ads Pack failed (${response.status}). No ads draft items were created and no ads were launched.`);
  }

  const data = await response.json() as N8nAdsResponse;
  if (data.ok === false) {
    throw new AdsFactoryError(data.error?.message || 'n8n Ads Pack returned a failure response.');
  }
  // Exact-five enforcement: a non-array response is a contract breach (throw),
  // but an empty/short/overlong array is normalized to exactly 5 approval items
  // in buildResult — so the Approval Board always gets the expected 5 ads drafts.
  if (!Array.isArray(data.items)) {
    throw new AdsFactoryError('n8n Ads Pack returned invalid ads draft items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// ── Phase B4: senior-FnB Vietnamese ads-draft defaults ──
// Written like a senior performance marketer for Vietnamese restaurants / local
// food brands (modern, appetizing, conversion-aware). All output is STRATEGY /
// DRAFT NOTES ONLY — never creates, launches, schedules, or spends ads, never
// generates images/video, never calls a live ad account. Derived from the
// brand/brief only: NEVER invents prices, discounts, addresses, phones, awards,
// testimonials, customer counts, or any metric (CPM/CPC/CTR/ROAS/reach/clicks/
// orders) — missing info becomes an "Owner xác nhận" / "Assumption" note, and
// fake urgency / impossible targeting / performance promises are avoided. Shared
// by the local fallback and by mapAdsItem's per-field fallbacks, so an n8n
// response that omits fields still reads like a real performance marketer wrote
// it.
function fnbAdsDefaults(input: ContentFactoryRunInput, spec: AdsPackSpec) {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `món chủ lực của ${brand}`;
  const audience = input.brief.target_audience || input.brand.target_audience || 'khách địa phương mục tiêu của quán';
  const tone = input.brand.tone_of_voice || 'ấm áp, đáng tin, thèm ăn';
  const offer = input.brief.offer || null;
  const goal: ContentFactoryGoal = input.options.goal;

  // #1 Campaign objective suggestion — mapped to the FnB-relevant Meta/social
  // objectives in the spec (awareness / engagement / messages / traffic /
  // local-store-visit / delivery-order intent). Suggestion only — nothing is set.
  const campaignObjective =
    goal === 'sales'       ? 'Tin nhắn/Inbox (Messages) hoặc Đơn hàng/giao hàng (delivery/order intent) — ưu tiên chốt đơn qua inbox' :
    goal === 'lead'        ? 'Tin nhắn/Inbox (Messages) để thu liên hệ khách quan tâm (lead)' :
    goal === 'khai_truong' ? 'Ghé quán (local store visit intent) + Nhận diện (Awareness) quanh khu vực quán' :
    goal === 'tuyen_sinh'  ? 'Tin nhắn/Inbox (Messages) để tư vấn & nhận đăng ký' :
                             'Nhận diện (Awareness) hoặc Tương tác (Engagement) cho thương hiệu';

  // #10 CTA suggestion, channel/goal-aware.
  const cta =
    goal === 'sales'       ? 'Inbox/Zalo để đặt món ngay (Owner xác nhận thông tin liên hệ)' :
    goal === 'lead'        ? 'Để lại liên hệ để quán tư vấn & giữ chỗ' :
    goal === 'khai_truong' ? 'Ghé quán dịp khai trương — nhắn tin để được hướng dẫn' :
    goal === 'tuyen_sinh'  ? 'Nhắn tin để được tư vấn ngay' :
                             'Theo dõi quán & inbox để biết món mới';

  const offerLine = offer
    ? `Ưu đãi (Owner xác nhận): ${offer}`
    : 'Chưa có ưu đãi cụ thể — Owner xác nhận trước khi đưa giá / % giảm vào quảng cáo (không bịa khuyến mãi)';

  // Shared across all 5 ads draft items.
  const customerInsight = `${audience} hay lướt Facebook/Reels lúc đói hoặc lúc đang chọn chỗ ăn; quyết định trong vài giây dựa trên hình món ngon mắt + lý do tin tưởng (gần, tươi, đông khách). Quảng cáo F&B địa phương ăn nhau ở hình món thật + thông điệp rõ ràng + CTA dễ hành động (inbox / chỉ đường) — không cần ngôn từ "giật".`;
  const ownerChecklist = '[ ] đúng nhận diện & giọng thương hiệu  [ ] dùng ảnh/clip món thật của quán (không AI)  [ ] giá/ưu đãi/địa chỉ/SĐT đã xác nhận nếu có nhắc tới  [ ] đúng chính tả & dấu tiếng Việt  [ ] không hứa hẹn quá đà / không cam kết doanh số  [ ] chọn đúng mục tiêu & vị trí hiển thị khi set tay trên Ads Manager';

  // Per-spec draft detail. Every field is filled for every spec (no generic
  // "Owner to confirm" placeholders), tailored to what that ads draft is for.
  let offerAngle: string;
  let primaryText: string;
  let headline: string;
  let description: string;
  let creativeDirection: string;
  let placement: string;

  switch (spec.key) {
    case 'campaign_angle_offer':
      offerAngle = `Góc chính: định vị ${product} của ${brand} là lựa chọn ngon & tiện cho ${audience} quanh khu vực. ${offerLine}. Nên test thêm 1 góc phụ (câu chuyện quán / nguyên liệu tươi) để so sánh.`;
      primaryText = `Nháp primary text: "Thèm ${product} chuẩn vị? ${brand} làm tươi mỗi ngày — ăn tại quán hay đặt giao đều ngon."${offer ? ' (Có ưu đãi — Owner xác nhận trước khi chạy.)' : ''} Nháp, chưa chạy.`;
      headline = `Nháp headline: "${product} ngon đúng điệu tại ${brand}".`;
      description = `Nháp description: "Inbox/Zalo để quán xác nhận nhanh." (Owner xác nhận thông tin liên hệ.)`;
      creativeDirection = `Food hero: cận ${product} nóng/tươi, khói nhẹ nếu món nóng, nước sốt bóng — ảnh/clip thật của quán, KHÔNG tạo ảnh/video bằng AI.`;
      placement = `Facebook Feed + Facebook Reels (ý tưởng nháp). Instagram/Reels nếu brand có IG; Zalo/social chỉ là ý tưởng nháp để Owner cân nhắc.`;
      break;
    case 'ad_copy_variants':
      offerAngle = `3 góc để A/B: (A) lợi ích "ngon & tiện", (B) đáng tin kiểu "quán quen của dân khu mình", (C) ${offer ? 'ưu đãi (Owner xác nhận)' : 'lý do nên thử hôm nay — không bịa khan hiếm/giảm giá'}.`;
      primaryText = `Variant A (lợi ích): "${product} tươi nóng mỗi ngày tại ${brand} — ăn tại quán hoặc giao tận nơi." | Variant B (đáng tin): "Chỗ ăn ${product} quen thuộc của khu mình, làm tươi từng phần." | Variant C (${offer ? 'ưu đãi' : 'kêu gọi nhẹ'}): "${offer ? offerLine : `Thử ${product} hôm nay — inbox để quán tư vấn`}." Tất cả là nháp để Owner chọn.`;
      headline = `3 headline nháp: "${product} ngon tại ${brand}" / "Đói là nhớ ${brand}" / "${product} — làm tươi mỗi ngày".`;
      description = `Description nháp ngắn cho từng variant: nhấn tươi/nóng/tiện + CTA inbox; giữ 1 thông điệp/1 variant để đo cho rõ.`;
      creativeDirection = `Combo/menu + food hero: 1 ảnh cận món chủ lực, 1 ảnh combo/menu; có thể thêm concept UGC kiểu khách quay lại (mời khách chia sẻ, KHÔNG bịa review/đánh giá).`;
      placement = `Facebook Feed & Reels — bản dọc 9:16 cho Reels, vuông/4:5 cho Feed; Instagram/Reels nếu brand có IG.`;
      break;
    case 'audience_targeting':
      offerAngle = `Thông điệp gắn theo nhóm: nhóm gần quán nhấn "tiện & nhanh"; nhóm thích món nhấn "chuẩn vị/tươi"; nhóm đã tương tác/đã nhắn tin nhấn nhắc nhớ${offer ? ' + ưu đãi (Owner xác nhận)' : ''}.`;
      primaryText = `(Ghi chú tệp khách — không phải câu quảng cáo cuối.) Mỗi nhóm dùng một biến thể copy khác nhau lấy từ "Ad Copy Variants".`;
      headline = `Ghi chú: tái dùng headline từ "Ad Copy Variants", chọn câu hợp với từng nhóm khi set tay.`;
      description = `3 nhóm gợi ý (ghi chú, KHÔNG tạo tệp thật trên Ads Manager): (1) bán kính quanh quán + sở thích ăn uống; (2) mở rộng theo món/đối thủ ngành F&B; (3) remarketing người đã tương tác/nhắn tin. Tránh nhắm "bao đậu đơn" hay claim nhắm bất khả thi.`;
      creativeDirection = `Không gian quán + food hero: nhóm gần quán hợp ảnh không gian/biển hiệu; nhóm thích món hợp cận món; nhóm remarketing hợp nhắc nhớ/UGC.`;
      placement = `Facebook Feed & Reels theo từng nhóm; Zalo/social chỉ là ý tưởng nháp. Để Ads Manager tự tối ưu vị trí ở bước test, chỉnh tay sau khi xem dữ liệu.`;
      break;
    case 'budget_testing_plan':
      offerAngle = `Ưu tiên rót "ngân sách test" vào góc/offer mạnh nhất từ "Campaign Angle & Offer", sau đó mới mở rộng góc thắng.`;
      primaryText = `(Kế hoạch test — không phải copy đăng.) Mỗi nhóm quảng cáo gắn 1 variant copy riêng để biết câu nào hiệu quả.`;
      headline = `Ghi chú: mỗi ad set một headline khác nhau để so sánh; giữ biến số ít để đọc kết quả rõ.`;
      description = `Cấu trúc nháp: 1 chiến dịch → 2–3 ad set (mỗi ad set 1 tệp/1 góc) → 2–3 mẫu quảng cáo/ad set, chạy thử ~5–7 ngày rồi cùng Owner xem lại. Đây là bản nháp để Owner duyệt — KHÔNG set ngân sách, KHÔNG lên lịch, KHÔNG chi tiền ở đây.`;
      creativeDirection = `Chuẩn bị sẵn 2–3 creative (food hero / combo / không gian) để luân phiên, tránh "chai" mẫu khi test.`;
      placement = `Đề xuất bắt đầu ở Facebook Feed + Reels; phân bổ ngân sách test do Owner quyết, không cố định con số ở bản nháp này.`;
      break;
    case 'ads_manager_handoff':
    default:
      offerAngle = `Khi duyệt xong: dùng đúng góc/offer đã chốt ở "Campaign Angle & Offer" — không tự ý đổi thông điệp lúc set tay.`;
      primaryText = `Dán primary text BẢN ĐÃ DUYỆT vào ad; không sửa thêm ngoài bản Owner đã đồng ý.`;
      headline = `Dán headline & description bản đã duyệt; kiểm tra hiển thị trên cả Feed lẫn Reels trước khi bật.`;
      description = `Checklist set tay (sau khi duyệt, do người thật làm trên Ads Manager): chọn mục tiêu đã đề xuất → dựng tệp theo ghi chú → dán copy đã duyệt → gắn ảnh/clip đã duyệt → đặt ngân sách (Owner quyết) → xem lại → bật chạy thủ công. Approved ≠ Published: duyệt ở Core KHÔNG tạo / bật / lên lịch / chi tiền cho bất kỳ ad nào.`;
      creativeDirection = `Chỉ dùng ảnh/clip món thật đã được Owner duyệt; KHÔNG tạo ảnh/video AI, KHÔNG dùng asset chưa duyệt.`;
      placement = `Set đúng vị trí đã chọn (Facebook Feed + Reels; Instagram/Zalo nếu Owner đồng ý) — chọn tay trong Ads Manager, không có kết nối live nào từ Core.`;
      break;
  }

  return {
    campaignObjective,
    audience,
    customerInsight,
    offerAngle,
    primaryText,
    headline,
    description,
    creativeDirection,
    placement,
    cta,
    ownerChecklist,
    tone,
  };
}

function createFallbackAdsItem(input: ContentFactoryRunInput, spec: AdsPackSpec): N8nAdsItem {
  const d = fnbAdsDefaults(input, spec);
  return {
    key: spec.key,
    title: spec.title,
    focus: spec.focus,
    objective: spec.objective,
    campaign_objective: d.campaignObjective,
    target_audience: d.audience,
    customer_insight: d.customerInsight,
    offer_angle: d.offerAngle,
    primary_text: d.primaryText,
    headline: d.headline,
    description: d.description,
    creative_direction: d.creativeDirection,
    placement: d.placement,
    cta: d.cta,
    owner_checklist: d.ownerChecklist,
  };
}

function buildMockResult(input: ContentFactoryRunInput, payload: AdsPackRequestPayload): AdsFactoryResult {
  const items: N8nAdsItem[] = ADS_PACK_SPECS.map(spec => createFallbackAdsItem(input, spec));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

// Exact-five enforcement: drop non-object entries, cap an overlong response to
// the first 5, and pad a short/empty response with safe fallback ads drafts — so
// every run yields exactly 5 approval items.
function normalizeAdsItems(input: ContentFactoryRunInput, sourceItems: N8nAdsItem[]): N8nAdsItem[] {
  const items = sourceItems
    .filter(item => item && typeof item === 'object')
    .slice(0, ADS_PACK_SPECS.length);

  while (items.length < ADS_PACK_SPECS.length) {
    items.push(createFallbackAdsItem(input, ADS_PACK_SPECS[items.length]));
  }

  return items;
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: AdsPackRequestPayload,
  sourceItems: N8nAdsItem[],
  mode: AdsFactoryResult['mode'],
  generatedBy: string,
): AdsFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const normalizedItems = normalizeAdsItems(input, sourceItems);
  const items = normalizedItems.map((item, idx) => mapAdsItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapAdsItem(
  input: ContentFactoryRunInput,
  item: N8nAdsItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: AdsFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/focus/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = ADS_PACK_SPECS.find(s => s.key === item.key)
    ?? ADS_PACK_SPECS[sequence - 1]
    ?? ADS_PACK_SPECS[0];

  const d = fnbAdsDefaults(input, spec);

  // Prefer AI/source values; fall back to senior-FnB Vietnamese defaults derived
  // from the brand/brief (or the canonical spec) — never a generic "Owner to
  // confirm". draft_body/key_points are accepted as backward-compat aliases.
  const title             = item.title || spec.title;
  const focus             = item.focus || spec.focus;
  const objective         = item.objective || spec.objective;
  const campaignObjective = item.campaign_objective || d.campaignObjective;
  const audience          = item.target_audience || d.audience;
  const insight           = item.customer_insight || d.customerInsight;
  const offerAngle        = item.offer_angle || item.key_points || d.offerAngle;
  const primaryText       = item.primary_text || item.draft_body || d.primaryText;
  const headline          = item.headline || d.headline;
  const description       = item.description || d.description;
  const creativeDirection = item.creative_direction || d.creativeDirection;
  const placement         = item.placement || d.placement;
  const cta               = item.cta || d.cta;
  const ownerChecklist    = item.owner_checklist || d.ownerChecklist;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Mục tiêu chiến dịch đề xuất: ${campaignObjective}`,
    `Tệp khách mục tiêu (giả định): ${audience}`,
    `Insight khách hàng: ${insight}`,
    `Góc tiếp cận / thông điệp (offer angle): ${offerAngle}`,
    `Primary text (nháp): ${primaryText}`,
    `Headline (nháp): ${headline}`,
    `Description (nháp): ${description}`,
    `Hướng sáng tạo (creative direction): ${creativeDirection}`,
    `Vị trí hiển thị đề xuất (placement): ${placement}`,
    `CTA: ${cta}`,
    `Checklist Owner duyệt: ${ownerChecklist}`,
    'An toàn: Draft ads concept only · Pending approval · Not launched · No spend · No live ad account connection.',
    '',
    '---',
    'Ads Pack Draft V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true',
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
    channel: input.options.channel,
    content_type: CONTENT_TYPE,
    pillar: 'Ads Draft',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: `${focus} · ${creativeDirection}`,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #AdsDraft`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
