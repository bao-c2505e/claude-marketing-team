// Report Draft Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// REPORT DRAFT (notes/spec) approval items via the same n8n AI Provider
// external_module path as the Content / Design / Video / Ads factories. It is
// REPORT DRAFT NOTES ONLY: it never pulls live analytics, never claims real
// metrics (unless they are explicitly provided in the Core request), never
// generates images or video, and never touches any live Meta / TikTok / Zalo /
// Google Ads / GA4 / CRM / POS / ShopeeFood / GrabFood / Canva / ComfyUI /
// Fal.ai connector. Output is approval-first text drafts only — nothing is
// posted, launched, spent, or sent to a client.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// report drafts unchanged (content_type = 'report_draft'), so there is NO DB
// schema change. Structured report fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata pattern
// the Content, Design, Video, and Ads factories already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryGoal, ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';
import { buildAiFactoryBrandContext, type BrandContextSnapshot } from './brandBrain';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them aligned to report_draft
// so report items never mislabel as content_pack/ads_draft/etc.
const WORKFLOW_TYPE = 'report_draft';
const CONTENT_TYPE = 'report_draft';

// Fixed V1 set of report draft items produced per run. Notes/draft only — no live
// analytics is pulled and no metric is claimed unless provided in the request.
interface ReportDraftSpec {
  key: string;
  title: string;
  focus: string;
  objective: string;
}

const REPORT_DRAFT_SPECS: ReportDraftSpec[] = [
  { key: 'campaign_status_summary', title: 'Campaign Status Summary Draft',      focus: 'Tổng quan trạng thái',   objective: 'Tổng hợp trạng thái chiến dịch từ brief & tiến độ duyệt (không kéo dữ liệu live)' },
  { key: 'performance_insight',     title: 'Performance Insight Notes',          focus: 'Khung trình bày insight', objective: 'Dựng khung insight hiệu suất chỉ bằng số liệu Owner cấp (không bịa chỉ số)' },
  { key: 'content_creative_review', title: 'Content & Creative Review Notes',    focus: 'Rà soát nội dung & sáng tạo', objective: 'Rà soát định tính nội dung/sáng tạo đã có trong Core cho Owner' },
  { key: 'risks_learnings_actions', title: 'Risks, Learnings & Next Actions',    focus: 'Rủi ro & việc cần làm',  objective: 'Nháp rủi ro, bài học và hành động tiếp theo để Owner duyệt' },
  { key: 'report_handoff',          title: 'Owner / Client Report Handoff Draft', focus: 'Khung báo cáo bàn giao', objective: 'Lắp khung báo cáo Owner/khách để rà soát & điền số liệu thủ công' },
];

export interface ReportDraftRequestPayload {
  request_id: string;
  workflow_type: 'report_draft';
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
  // Phase N: shared normalized Brand Brain context (same source as the Content
  // Factory) so report drafts stay grounded in one brand identity / context.
  brand_brain_context: BrandContextSnapshot;
  report_draft_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  // Live analytics pulls and unverified metrics are explicitly out of scope —
  // report drafts only, built from the request payload and Core-side data.
  pull_live_analytics: false;
  use_unverified_metrics: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_platform_launch: true;
    no_image_generation: true;
    no_video_generation: true;
    no_live_analytics_pull: true;
    no_unverified_metrics: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nReportItem {
  key?: string;
  title?: string;
  focus?: string;
  objective?: string;
  period?: string;
  // Phase B5 senior-FnB fields. data_status is the explicit data-source status
  // (provided / simulated / missing / owner-input-required); the rest are the
  // draft report sections.
  data_status?: string;
  exec_summary?: string;
  key_observations?: string;
  content_review?: string;
  campaign_ads_review?: string;
  customer_insight?: string;
  next_actions?: string;
  owner_questions?: string;
  owner_checklist?: string;
  // Backward-compat aliases from the original V1 contract: data_basis →
  // data_status, summary_body → exec_summary, key_points → key_observations.
  data_basis?: string;
  summary_body?: string;
  key_points?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nReportResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nReportItem[];
  error?: { code?: string; message?: string };
}

export interface ReportFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: ReportDraftRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class ReportFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportFactoryError';
  }
}

export function getReportFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_REPORT_DRAFT_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createReportDraftPayload(input: ContentFactoryRunInput): ReportDraftRequestPayload {
  return {
    request_id: generateId('rf'),
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
    brand_brain_context: buildAiFactoryBrandContext({
      brand: input.brand,
      client: input.client,
      campaign: input.campaign,
      brief: input.brief,
    }),
    report_draft_types: REPORT_DRAFT_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    pull_live_analytics: false,
    use_unverified_metrics: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_platform_launch: true,
      no_image_generation: true,
      no_video_generation: true,
      no_live_analytics_pull: true,
      no_unverified_metrics: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runReportFactory(input: ContentFactoryRunInput): Promise<ReportFactoryResult> {
  const payload = createReportDraftPayload(input);
  const webhookUrl = getReportFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ReportFactoryError(`n8n Report Draft failed (${response.status}). No report draft items were created and no analytics were pulled.`);
  }

  const data = await response.json() as N8nReportResponse;
  if (data.ok === false) {
    throw new ReportFactoryError(data.error?.message || 'n8n Report Draft returned a failure response.');
  }
  // Exact-five enforcement: a non-array response is a contract breach (throw),
  // but an empty/short/overlong array is normalized to exactly 5 approval items
  // in buildResult — so the Approval Board always gets the expected 5 report
  // drafts.
  if (!Array.isArray(data.items)) {
    throw new ReportFactoryError('n8n Report Draft returned invalid report draft items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// ── Phase B5: senior-FnB Vietnamese report-draft defaults ──
// Written like a senior agency strategist preparing a client-facing report draft
// for a Vietnamese FnB brand (local restaurants / street food / cà phê / trà sữa
// / chè / cơm tấm / bún đậu). REPORT DRAFT NOTES ONLY — NEVER pulls live
// analytics, NEVER claims access to Meta/TikTok/Zalo/Google/GA4/POS/ShopeeFood/
// GrabFood/CRM data, and NEVER invents any number (spend, revenue, ROAS, clicks,
// impressions, reach, views, likes, comments, messages, orders, conversion rate,
// customer counts) or testimonials. Missing figures stay labelled "Owner cấp" /
// "Assumption" — never fabricated, never "Owner to confirm". Shared by the local
// fallback and by mapReportItem's per-field fallbacks, so an n8n response that
// omits fields still reads like a real strategist wrote it and stays metric-safe.
function fnbReportDefaults(input: ContentFactoryRunInput, spec: ReportDraftSpec) {
  const brand = input.brand.name;
  const campaign = input.campaign.name;
  const product = input.brief.product_focus || input.brand.hero_product || `món chủ lực của ${brand}`;
  const audience = input.brief.target_audience || input.brand.target_audience || 'khách địa phương mục tiêu của quán';
  const channel = input.options.channel;
  const goal: ContentFactoryGoal = input.options.goal;
  const goalVi =
    goal === 'sales'       ? 'tăng đơn / chốt đơn' :
    goal === 'lead'        ? 'thu liên hệ khách quan tâm' :
    goal === 'khai_truong' ? 'khai trương quán' :
    goal === 'tuyen_sinh'  ? 'tuyển sinh / tuyển dụng' :
                             'tăng nhận diện thương hiệu';

  // #2 Reporting period — placeholder, owner-provided needed (never guessed).
  const period = 'Owner cấp ngày bắt đầu–kết thúc kỳ báo cáo (chưa có nên để trống — không suy đoán ngày).';

  // #3 Data source status — the 4 states (provided / simulated / missing / owner
  // input required). Local fallback has no real data, so it states that plainly.
  const dataStatus = 'Provided data (số liệu thật Owner cấp): CHƯA CÓ · Simulated data: chỉ là cấu trúc/demo minh hoạ bố cục, không phải số thật · Missing data: số liệu hiệu suất (tiếp cận, tương tác, tin nhắn, đơn, chi phí…) · Owner input required: CÓ — Owner cần cấp số liệu thật trước khi chốt. Không số liệu nào được kéo từ nền tảng và không số nào bị bịa.';

  // #11 Owner approval checklist (shared).
  const ownerChecklist = '[ ] mọi số liệu đều do Owner cấp & đã kiểm chứng (không số bịa)  [ ] đúng kỳ báo cáo  [ ] đúng nhận diện & giọng thương hiệu  [ ] đúng chính tả & dấu tiếng Việt  [ ] phần chưa có dữ liệu được đánh dấu rõ "cần Owner cấp"  [ ] đã trả lời các câu hỏi cho Owner/khách trước khi gửi';

  // #10 Questions for owner/client before finalizing (shared base).
  const ownerQuestions = `Kỳ báo cáo chính xác từ ngày nào đến ngày nào? Có số liệu thật từ kênh nào không (Facebook/Zalo/đơn tại quán/giao hàng)? Kỳ này ưu tiên mục tiêu gì (đang giả định: ${goalVi})? Có chi phí/ngân sách thực tế để đối chiếu không? Ai là người nhận bản cuối (Owner hay khách)?`;

  // Per-spec sections. Every field is filled for every spec (no generic "Owner to
  // confirm"), tailored to what that report draft is for. Sections that need data
  // (customer/order insight, campaign/ads numbers) stay empty-by-default with a
  // clear "chỉ điền khi Owner cấp dữ liệu" note rather than any fabricated figure.
  let reportObjective: string;
  let execSummary: string;
  let keyObservations: string;
  let contentReview: string;
  let campaignAdsReview: string;
  let customerInsight: string;
  let nextActions: string;

  switch (spec.key) {
    case 'campaign_status_summary':
      reportObjective = `Tổng hợp trạng thái chiến dịch "${campaign}" của ${brand} dựa trên brief & tiến độ duyệt trong Core (KHÔNG kéo dữ liệu nền tảng).`;
      execSummary = `Tóm tắt điều hành (nháp, không số bịa): nêu chiến dịch đang ở giai đoạn nào, đã có bao nhiêu brief/nội dung được tạo & đang chờ duyệt (đếm từ Core — Owner xác nhận con số), mục tiêu đang hướng tới (${goalVi}). CHƯA kết luận hiệu quả vì chưa có số liệu thật.`;
      keyObservations = `Quan sát chính (chỉ từ dữ liệu có trong Core): trạng thái brief, các mục nội dung đã tạo/đang chờ duyệt, kênh dự kiến (${channel}). Mọi nhận định về kết quả để trống tới khi Owner cấp số liệu; phần nào không có dữ liệu thì ghi rõ "giả định / cần Owner cấp".`;
      contentReview = `Điểm nhanh nội dung đã tạo cho chiến dịch này (đã duyệt / chờ duyệt) — chi tiết ở mục "Content & Creative Review".`;
      campaignAdsReview = `Trạng thái ads dạng nháp: chưa có số liệu quảng cáo thật, KHÔNG ghi tiếp cận/chi phí/ROAS. Owner cấp số nếu có chạy.`;
      customerInsight = `Chỉ điền khi Owner cung cấp dữ liệu đơn/khách (đơn tại quán, giao hàng, tin nhắn). Chưa có → để trống, KHÔNG suy đoán số khách/đơn.`;
      nextActions = `Chốt kỳ báo cáo; thu thập số liệu thật từ Owner; ưu tiên duyệt các mục đang chờ. Owner duyệt trước khi hành động.`;
      break;
    case 'performance_insight':
      reportObjective = `Dựng KHUNG trình bày insight hiệu suất cho ${brand} — chừa đúng chỗ để điền số liệu Owner cấp; TUYỆT ĐỐI không bịa chỉ số.`;
      execSummary = `Tóm tắt điều hành: phần này chỉ dựng khung cho các chỉ số (tiếp cận, tương tác, tin nhắn, đơn, chi phí) — mỗi ô đánh dấu "Owner cấp". Không có số liệu → không có kết luận hiệu quả.`;
      keyObservations = `Quan sát chính: để trống ô số liệu và ghi rõ "cần Owner cấp" cho từng chỉ số. Nếu Owner đã cấp vài số, chỉ nhận định trong đúng phạm vi số đó — không ngoại suy, không làm tròn lên.`;
      contentReview = `Khi có dữ liệu, gắn insight với nội dung cụ thể; hiện chỉ ghi giả thuyết "nội dung X có thể hợp tệp ${audience}", chờ số liệu kiểm chứng.`;
      campaignAdsReview = `Khung cho chỉ số ads (chỉ khi Owner chạy & cấp số): chi phí, kết quả — để trống, không bịa CPM/CPC/CTR/ROAS/tiếp cận.`;
      customerInsight = `Chỉ điền khi có dữ liệu đơn/khách thật từ Owner; chưa có → để trống.`;
      nextActions = `Owner cấp số liệu thật theo từng ô; thống nhất cách đo; chỉ kết luận sau khi có số đã kiểm chứng.`;
      break;
    case 'content_creative_review':
      reportObjective = `Rà soát định tính các nội dung/sáng tạo đã có trong Core cho ${brand}, giúp Owner biết nên giữ / sửa gì.`;
      execSummary = `Tóm tắt: điểm qua nội dung đã tạo (đã duyệt / chờ duyệt), nhận xét định tính về thông điệp, hình ${product}, tính nhất quán thương hiệu — KHÔNG gắn lượt xem/like/tương tác vì chưa có dữ liệu.`;
      keyObservations = `Quan sát định tính: mục nào thông điệp rõ & ngon mắt, mục nào cần làm lại, có nhất quán nhận diện & giọng ${brand} không. Không xếp hạng theo "hiệu suất" vì chưa có số thật.`;
      contentReview = `(Mục chính.) Liệt kê từng nội dung: tên/angle, trạng thái duyệt, nhận xét, đề xuất giữ/sửa. Thiếu thông tin → ghi "cần Owner xác nhận", không bịa.`;
      campaignAdsReview = `Nếu có creative dùng cho ads: nhận xét định tính bản nháp; không gắn số liệu quảng cáo.`;
      customerInsight = `Phản hồi khách chỉ đưa vào khi Owner có ảnh chụp bình luận/tin nhắn thật; chưa có → để trống, KHÔNG bịa review/đánh giá/testimonial.`;
      nextActions = `Chọn nội dung nổi bật để đẩy mạnh, sửa mục chưa đạt, bổ sung mục còn thiếu. Owner duyệt.`;
      break;
    case 'risks_learnings_actions':
      reportObjective = `Nêu rủi ro, bài học (cần kiểm chứng) và việc cần làm tiếp cho "${campaign}" — bản nháp để Owner quyết.`;
      execSummary = `Tóm tắt: liệt kê rủi ro (vd: thiếu số liệu thật, nhiều mục còn chờ duyệt), giả thuyết bài học (CHƯA khẳng định vì thiếu dữ liệu), và danh sách hành động ưu tiên.`;
      keyObservations = `Quan sát: phân biệt rõ "đã biết chắc" (từ Core) và "giả định / cần kiểm chứng". Không biến giả định thành kết luận, không gán số chưa có.`;
      contentReview = `Rủi ro phía nội dung: mục tồn đọng chờ duyệt, thiếu nhất quán, thông tin chưa xác nhận (giá/ưu đãi/địa chỉ/SĐT).`;
      campaignAdsReview = `Rủi ro phía ads (nháp): chưa có số để đánh giá; nhắc không chạy / không tiêu tiền tới khi Owner duyệt. Không số liệu giả.`;
      customerInsight = `Chỉ nêu khi Owner có dữ liệu đơn/khách thật; nếu không, ghi "cần Owner cấp".`;
      nextActions = `(Mục chính.) Danh sách hành động ưu tiên: xác nhận số liệu thật, ưu tiên mục chờ duyệt, quyết định thử nghiệm tiếp theo. Owner duyệt trước khi thực hiện.`;
      break;
    case 'report_handoff':
    default:
      reportObjective = `Lắp khung báo cáo Owner/khách (skeleton) để Owner điền số liệu đã kiểm chứng rồi duyệt trước khi gửi.`;
      execSummary = `Tóm tắt: bộ khung gồm tiêu đề, kỳ báo cáo, tóm tắt điều hành, insight, rà soát nội dung, rủi ro & hành động — mỗi phần ghi rõ chỗ "Owner cấp số liệu". Không điền số thay Owner.`;
      keyObservations = `Nhắc: mọi số liệu phải kiểm chứng trước khi đưa vào bản gửi; phần chưa có dữ liệu để trống có nhãn, không bịa.`;
      contentReview = `Khung mục rà soát nội dung — kéo nội dung từ "Content & Creative Review".`;
      campaignAdsReview = `Khung mục ads — chỉ điền khi có số liệu Owner cấp; mặc định ghi "chưa có dữ liệu".`;
      customerInsight = `Khung mục đơn/khách — chỉ điền khi Owner cấp dữ liệu thật.`;
      nextActions = `Owner điền số liệu đã kiểm chứng → duyệt → mới gửi khách. Approved ≠ Published: duyệt trong Core KHÔNG tự gửi báo cáo cho khách.`;
      break;
  }

  return {
    period,
    dataStatus,
    reportObjective,
    execSummary,
    keyObservations,
    contentReview,
    campaignAdsReview,
    customerInsight,
    nextActions,
    ownerQuestions,
    ownerChecklist,
  };
}

function createFallbackReportItem(input: ContentFactoryRunInput, spec: ReportDraftSpec): N8nReportItem {
  const d = fnbReportDefaults(input, spec);
  return {
    key: spec.key,
    title: spec.title,
    focus: spec.focus,
    objective: spec.objective,
    period: d.period,
    data_status: d.dataStatus,
    exec_summary: d.execSummary,
    key_observations: d.keyObservations,
    content_review: d.contentReview,
    campaign_ads_review: d.campaignAdsReview,
    customer_insight: d.customerInsight,
    next_actions: d.nextActions,
    owner_questions: d.ownerQuestions,
    owner_checklist: d.ownerChecklist,
  };
}

function buildMockResult(input: ContentFactoryRunInput, payload: ReportDraftRequestPayload): ReportFactoryResult {
  const items: N8nReportItem[] = REPORT_DRAFT_SPECS.map(spec => createFallbackReportItem(input, spec));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

// Exact-five enforcement: drop non-object entries, cap an overlong response to
// the first 5, and pad a short/empty response with safe fallback report drafts —
// so every run yields exactly 5 approval items.
function normalizeReportItems(input: ContentFactoryRunInput, sourceItems: N8nReportItem[]): N8nReportItem[] {
  const items = sourceItems
    .filter(item => item && typeof item === 'object')
    .slice(0, REPORT_DRAFT_SPECS.length);

  while (items.length < REPORT_DRAFT_SPECS.length) {
    items.push(createFallbackReportItem(input, REPORT_DRAFT_SPECS[items.length]));
  }

  return items;
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: ReportDraftRequestPayload,
  sourceItems: N8nReportItem[],
  mode: ReportFactoryResult['mode'],
  generatedBy: string,
): ReportFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const normalizedItems = normalizeReportItems(input, sourceItems);
  const items = normalizedItems.map((item, idx) => mapReportItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapReportItem(
  input: ContentFactoryRunInput,
  item: N8nReportItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: ReportFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/focus/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = REPORT_DRAFT_SPECS.find(s => s.key === item.key)
    ?? REPORT_DRAFT_SPECS[sequence - 1]
    ?? REPORT_DRAFT_SPECS[0];

  const d = fnbReportDefaults(input, spec);

  // Prefer AI/source values; fall back to senior-FnB Vietnamese defaults derived
  // from the request — never a generic "Owner to confirm". data_basis/summary_body
  // /key_points are accepted as backward-compat aliases. data_status is forced to
  // always state no-live-analytics if the source omits it, so a report draft can
  // never imply that real platform data was pulled.
  const title           = item.title || spec.title;
  const focus           = item.focus || spec.focus;
  const objective       = item.objective || spec.objective;
  const period          = item.period || d.period;
  const dataStatus      = item.data_status || item.data_basis || d.dataStatus;
  const reportObjective = item.objective || d.reportObjective;
  const execSummary     = item.exec_summary || item.summary_body || d.execSummary;
  const keyObs          = item.key_observations || item.key_points || d.keyObservations;
  const contentReview   = item.content_review || d.contentReview;
  const adsReview       = item.campaign_ads_review || d.campaignAdsReview;
  const customerInsight = item.customer_insight || d.customerInsight;
  const nextActions     = item.next_actions || d.nextActions;
  const ownerQuestions  = item.owner_questions || d.ownerQuestions;
  const ownerChecklist  = item.owner_checklist || d.ownerChecklist;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Mục tiêu báo cáo: ${reportObjective}`,
    `Kỳ báo cáo: ${period}`,
    `Tình trạng nguồn dữ liệu: ${dataStatus}`,
    `Tóm tắt điều hành (không bịa số): ${execSummary}`,
    `Quan sát chính (chỉ từ dữ liệu được cấp, hoặc nêu rõ là giả định): ${keyObs}`,
    `Rà soát nội dung & sáng tạo: ${contentReview}`,
    `Rà soát chiến dịch/quảng cáo (bản nháp, không số liệu giả): ${adsReview}`,
    `Insight khách hàng / đơn hàng (chỉ khi có dữ liệu): ${customerInsight}`,
    `Hành động đề xuất tiếp theo: ${nextActions}`,
    `Câu hỏi cho Owner/khách trước khi chốt: ${ownerQuestions}`,
    `Checklist Owner duyệt: ${ownerChecklist}`,
    'An toàn: Draft report only · Pending approval · No live analytics pull · No unverified metrics · Not published.',
    '',
    '---',
    'Report Draft V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true; no_live_analytics_pull=true; no_unverified_metrics=true',
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
    pillar: 'Report Draft',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: `${focus} · ${keyObs}`,
    cta: 'Owner review',
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #ReportDraft`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
