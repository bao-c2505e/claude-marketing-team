import type { Client, Brand, Campaign, CampaignBrief, ResourceStatus, CampaignStatus, BriefStatus, ContentPlanJob, ContentPlanItem, ContentApprovalRequest, ContentApprovalEvent, ContentApprovalComment, ContentApprovalStatus, ApprovalActionType, ApprovalPriority, AssetType, AssetSourceType, AssetApprovalStatus, AssetItem, LocalAssetCollection, LocalExportPack, GenerationMode } from '../../types/core';

// ---------------------------------------------------------------------------
// Local form types for create operations
// ---------------------------------------------------------------------------

export interface ClientFormData {
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  notes: string;
}

export interface BrandFormData {
  client_id: string;
  name: string;
  industry: string;
  hero_product: string;
  tone_of_voice: string;
  target_audience: string;
  primary_channels: string;
}

export interface CampaignFormData {
  client_id: string;
  brand_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  budget_estimate: string;
  status: CampaignStatus;
}

export interface BriefFormData {
  campaign_id: string;
  brand_id: string;
  client_id: string;
  // denormalised from the selected brand — stored on campaign_briefs
  brand_name: string;
  industry: string;
  brief_title: string;
  campaign_goal: string;
  product_focus: string;
  offer: string;
  target_audience: string;
  channels: string;
  tone_of_voice: string;
  content_pillars: string;
  key_messages: string;
  must_include: string;
  must_avoid: string;
  competitors: string;
  reference_links: string;
  budget_note: string;
  timeline_note: string;
  approval_requirements: string;
}

// ---------------------------------------------------------------------------
// Seed data — 3 clients, 3 brands, 3 campaigns
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const ISO_DATE = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const SEED_CLIENTS: Client[] = [
  {
    id: 'client-vi-cuon',
    name: 'Vị Cuốn',
    slug: 'vi-cuon',
    contact_name: 'Nguyễn Văn A',
    contact_email: 'owner@vicuon.vn',
    contact_phone: null,
    status: 'active' as ResourceStatus,
    notes: 'F&B premium street food tại TP Vinh, Nghệ An. Sản phẩm chủ lực: Bánh tráng cuốn heo quay.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'client-com-tam',
    name: 'Cơm Tấm Bản Khói',
    slug: 'com-tam-ban-khoi',
    contact_name: 'Trần Thị B',
    contact_email: 'contact@comtambankhoi.vn',
    contact_phone: null,
    status: 'active' as ResourceStatus,
    notes: 'F&B cơm tấm Sài Gòn tại TP.HCM. Thương hiệu mới 2024.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'client-forme',
    name: 'Forme',
    slug: 'forme',
    contact_name: 'Lê Minh C',
    contact_email: 'hello@forme.vn',
    contact_phone: null,
    status: 'active' as ResourceStatus,
    notes: 'Nội thất cao cấp, showroom tại HCM và HN. Target: gia đình thu nhập cao.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_BRANDS: Brand[] = [
  {
    id: 'brand-vi-cuon',
    client_id: 'client-vi-cuon',
    name: 'Vị Cuốn',
    slug: 'vi-cuon-brand',
    industry: 'F&B / Street Food Premium',
    hero_product: 'Bánh tráng cuốn heo quay',
    tone_of_voice: 'Gần gũi, ngon miệng, thực tế, mang chất địa phương Vinh',
    target_audience: 'Dân văn phòng, học sinh sinh viên, gia đình trẻ tại TP Vinh',
    primary_channels: ['Facebook', 'TikTok', 'Instagram'],
    brand_colors: { primary: '#c84b31', secondary: '#2d6a4f' },
    logo_url: null,
    status: 'active' as ResourceStatus,
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'brand-com-tam',
    client_id: 'client-com-tam',
    name: 'Cơm Tấm Bản Khói',
    slug: 'com-tam-ban-khoi-brand',
    industry: 'F&B / Cơm Tấm',
    hero_product: 'Cơm tấm sườn bì chả',
    tone_of_voice: 'Ấm áp, truyền thống Sài Gòn, chân thật',
    target_audience: 'Người đi làm, gia đình, dân văn phòng tại TP.HCM',
    primary_channels: ['Facebook', 'TikTok'],
    brand_colors: { primary: '#f4a261', secondary: '#2a9d8f' },
    logo_url: null,
    status: 'active' as ResourceStatus,
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'brand-forme',
    client_id: 'client-forme',
    name: 'Forme',
    slug: 'forme-brand',
    industry: 'Nội thất cao cấp / Premium Furniture',
    hero_product: 'Sofa da Series F-1',
    tone_of_voice: 'Tinh tế, hiện đại, sang trọng nhưng gần gũi',
    target_audience: 'Gia đình thu nhập cao, người trẻ thành đạt 28–45 tuổi tại HCM/HN',
    primary_channels: ['Facebook', 'Instagram', 'YouTube'],
    brand_colors: { primary: '#1a1a2e', secondary: '#c9a84c' },
    logo_url: null,
    status: 'active' as ResourceStatus,
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-vi-cuon-he',
    brand_id: 'brand-vi-cuon',
    client_id: 'client-vi-cuon',
    name: 'Heo Quay Mùa Hè 2026',
    description: 'Chiến dịch mùa hè tập trung tăng nhận diện thương hiệu và traffic cửa hàng. Kênh chính: Facebook, TikTok.',
    campaign_type: '7_day',
    duration_days: 7,
    start_date: ISO_DATE(3),
    end_date: ISO_DATE(10),
    status: 'draft' as CampaignStatus,
    budget_estimate: null,
    currency: 'VND',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'campaign-com-tam-menu',
    brand_id: 'brand-com-tam',
    client_id: 'client-com-tam',
    name: 'Ra Mắt Menu Mới Q3/2026',
    description: 'Giới thiệu 3 món mới, tạo buzz trên Facebook/TikTok, khuyến mãi combo giá tốt. Kênh chính: Facebook, TikTok.',
    campaign_type: '15_day',
    duration_days: 15,
    start_date: ISO_DATE(1),
    end_date: ISO_DATE(16),
    status: 'active' as CampaignStatus,
    budget_estimate: 5000000,
    currency: 'VND',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'campaign-forme-f1',
    brand_id: 'brand-forme',
    client_id: 'client-forme',
    name: 'Sofa F-1 Launch Campaign',
    description: 'Ra mắt dòng Sofa da cao cấp F-1, target gia đình thu nhập cao. Kênh chính: Facebook, Instagram, YouTube.',
    campaign_type: '30_day',
    duration_days: 30,
    start_date: ISO_DATE(7),
    end_date: ISO_DATE(37),
    status: 'active' as CampaignStatus,
    budget_estimate: 30000000,
    currency: 'VND',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_BRIEFS: CampaignBrief[] = [
  {
    id: 'brief-vi-cuon-he',
    campaign_id: 'campaign-vi-cuon-he',
    brand_id: 'brand-vi-cuon',
    client_id: 'client-vi-cuon',
    brand_name: 'Vị Cuốn',
    brief_title: 'Brief Heo Quay Mùa Hè 2026',
    campaign_goal: 'Tăng nhận diện thương hiệu và lượt ghé thăm cửa hàng trong mùa hè 2026. Mục tiêu: +30% lượt khách mới trong 7 ngày chiến dịch.',
    hero_product: 'Bánh tráng cuốn heo quay',
    product_focus: 'Bánh tráng cuốn heo quay — heo quay lu đất truyền thống, da giòn, thịt mềm, cuốn cùng rau rừng xứ Nghệ.',
    offer: 'Combo mùa hè: 2 phần cuốn + 1 nước ép miễn phí. Áp dụng 11h–14h các ngày trong tuần.',
    industry: 'F&B / Street Food Premium',
    tone: 'Gần gũi, ngon miệng, thực tế',
    tone_of_voice: 'Gần gũi, ngon miệng, thực tế, mang chất địa phương Vinh. Tránh ngôn ngữ quá trang trọng.',
    target_audience: 'Dân văn phòng, học sinh sinh viên, gia đình trẻ tại TP Vinh và lân cận. Độ tuổi 18–35.',
    campaign_goals: ['Tăng nhận diện thương hiệu', 'Tăng traffic cửa hàng', 'Ra mắt combo mùa hè'],
    key_messages: ['Da heo quay giòn rụm — chuẩn vị Vinh', 'Combo mùa hè — giá tốt, no căng', 'Street food premium cho người Vinh'],
    channels: ['Facebook', 'TikTok'],
    content_pillars: ['Ẩm thực địa phương', 'Combo tiết kiệm', 'Cảnh bếp & chế biến', 'Review khách hàng'],
    must_include: 'Hình ảnh da heo quay giòn, bánh tráng cuốn đẹp mắt. Thông tin địa chỉ cửa hàng tại TP Vinh.',
    must_avoid: 'Tránh so sánh trực tiếp với đối thủ. Không dùng hình ảnh cẩu thả hoặc không đồng nhất màu sắc.',
    competitors: 'Các quán heo quay, bánh cuốn truyền thống tại TP Vinh.',
    reference_links: null,
    budget_note: 'TBD — chủ thương hiệu xác nhận sau',
    timeline_note: '7 ngày, chạy từ đầu mùa hè',
    approval_requirements: 'Owner phê duyệt trước khi boost ads. Mọi hình ảnh cần owner kiểm duyệt trực tiếp.',
    duration_days: 7,
    additional_notes: null,
    status: 'draft' as BriefStatus,
    submitted_by: 'demo-owner-000',
    submitted_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'brief-com-tam-menu',
    campaign_id: 'campaign-com-tam-menu',
    brand_id: 'brand-com-tam',
    client_id: 'client-com-tam',
    brand_name: 'Cơm Tấm Bản Khói',
    brief_title: 'Brief Ra Mắt Menu Mới Q3/2026',
    campaign_goal: 'Giới thiệu 3 món mới ra thị trường, tạo buzz trên mạng xã hội, tăng đơn đặt hàng online trong 15 ngày.',
    hero_product: 'Cơm tấm sườn bì chả',
    product_focus: '3 món mới Q3: Cơm tấm sườn nướng lu, Cơm tấm bì cuộn, Bún bì Sài Gòn. Hero vẫn là Cơm tấm sườn bì chả truyền thống.',
    offer: 'Giảm 20% combo 2 người trong tuần ra mắt (7 ngày đầu). Tặng nước ngọt cho đơn từ 120k.',
    industry: 'F&B / Cơm Tấm',
    tone: 'Ấm áp, truyền thống',
    tone_of_voice: 'Ấm áp, truyền thống Sài Gòn, chân thật. Gợi nhớ vị quê nhà, bữa cơm gia đình.',
    target_audience: 'Người đi làm 25–40 tuổi, gia đình có con nhỏ, dân văn phòng quanh khu vực Quận 7, 8, Bình Chánh.',
    campaign_goals: ['Ra mắt 3 món mới', 'Tăng đơn online', 'Tạo buzz mạng xã hội'],
    key_messages: ['Món mới – vị Sài Gòn thật', 'Cơm ngon như cơm nhà', 'Ưu đãi ra mắt – combo 2 người'],
    channels: ['Facebook', 'TikTok'],
    content_pillars: ['Giới thiệu món mới', 'Behind the kitchen', 'Review khách hàng thật', 'Ưu đãi & promo'],
    must_include: 'Hình ảnh món ăn thật – không dùng ảnh stock. Bật âm thanh ASMR nếu làm video.',
    must_avoid: 'Không dùng hình ảnh đối thủ. Không claim "ngon nhất Sài Gòn" nếu chưa có bằng chứng.',
    competitors: 'Cơm tấm Kiều Giang, Cơm tấm Ba Ghiền, các quán cơm tấm truyền thống khu vực Q7.',
    reference_links: null,
    budget_note: '5,000,000 VND cho 15 ngày. Phân bổ: 60% Facebook Ads, 40% TikTok Ads.',
    timeline_note: '15 ngày, bắt đầu Q3 2026',
    approval_requirements: 'Manager review content trước. Owner phê duyệt budget và ads trước khi chạy.',
    duration_days: 15,
    additional_notes: null,
    status: 'ready_for_generation' as BriefStatus,
    submitted_by: 'demo-owner-000',
    submitted_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'brief-forme-f1',
    campaign_id: 'campaign-forme-f1',
    brand_id: 'brand-forme',
    client_id: 'client-forme',
    brand_name: 'Forme',
    brief_title: 'Brief Sofa F-1 Launch Campaign',
    campaign_goal: 'Ra mắt dòng Sofa da cao cấp F-1, xây dựng nhận thức thương hiệu trong phân khúc premium, thu lead qualified tại HCM và HN.',
    hero_product: 'Sofa da Series F-1',
    product_focus: 'Sofa da thật Series F-1 – Frame gỗ sồi Mỹ, da bò Ý cao cấp, 5 màu tùy chọn, bảo hành 5 năm. Giá: 45–85 triệu VNĐ.',
    offer: 'Ưu đãi ra mắt: Giảm 15% cho đơn đặt trước trong 30 ngày đầu. Tặng thảm handmade trị giá 5 triệu cho đơn trên 60 triệu.',
    industry: 'Nội thất cao cấp / Premium Furniture',
    tone: 'Tinh tế, sang trọng',
    tone_of_voice: 'Tinh tế, hiện đại, sang trọng nhưng gần gũi. Không dùng từ "đẳng cấp" hay "luxury" quá nhiều – thay bằng "chất lượng thật", "thiết kế để sống".',
    target_audience: 'Gia đình thu nhập cao 50tr+/tháng, người trẻ thành đạt 28–45 tuổi, nội trợ cao cấp tại HCM (Q2, Q7, Thủ Đức) và HN (Tây Hồ, Cầu Giấy).',
    campaign_goals: ['Ra mắt dòng F-1', 'Thu lead showroom HCM & HN', 'Xây dựng brand equity premium'],
    key_messages: ['Thiết kế để sống – không chỉ để trưng bày', 'Da bò Ý thật – không pha', 'Bảo hành 5 năm – cam kết dài hạn'],
    channels: ['Facebook', 'Instagram', 'YouTube'],
    content_pillars: ['Product showcase', 'Interior design inspiration', 'Craftmanship & materials', 'Client testimonials', 'Showroom experience'],
    must_include: 'Hình ảnh chụp trong showroom thật. Video lifestyle với gia đình trẻ thành đạt. Thông tin showroom HCM + HN.',
    must_avoid: 'Tránh so sánh giá với sản phẩm tầm thấp hơn. Không dùng hình ảnh phòng khách quá nhỏ hay cũ kỹ.',
    competitors: 'AA International, Nội thất Xuân Hòa (phân khúc cao), IKEA (phân khúc khác nhưng hay được so sánh).',
    reference_links: null,
    budget_note: '30,000,000 VND cho 30 ngày. Facebook: 40%, Instagram: 35%, YouTube: 25%.',
    timeline_note: '30 ngày, bắt đầu đầu tháng tới',
    approval_requirements: 'Owner phê duyệt tất cả creative trước khi chạy. Riêng YouTube cần duyệt thêm từ CMO.',
    duration_days: 30,
    additional_notes: null,
    status: 'approved_for_generation' as BriefStatus,
    submitted_by: 'demo-owner-000',
    submitted_at: NOW,
    created_at: NOW,
    updated_at: NOW,
  },
];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'core_agency_core_data_v1';

export interface CoreDataStore {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
}

export function loadCoreData(): CoreDataStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<CoreDataStore>;
      return {
        clients: parsed.clients ?? SEED_CLIENTS,
        brands: parsed.brands ?? SEED_BRANDS,
        campaigns: parsed.campaigns ?? SEED_CAMPAIGNS,
        briefs: parsed.briefs ?? SEED_BRIEFS,
      };
    }
  } catch (_) { /* ignore */ }
  return {
    clients: SEED_CLIENTS,
    brands: SEED_BRANDS,
    campaigns: SEED_CAMPAIGNS,
    briefs: SEED_BRIEFS,
  };
}

export function saveCoreData(data: CoreDataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// RFC 4122 UUID check — local ids from generateId() never match this, so
// callers can use it to decide whether an id is safe to send to a Supabase
// UUID column or must stay on the localStorage fallback (Phase 16C-2).
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

// Shared brief field parsers — campaign_briefs stores content_pillars/key_messages
// as TEXT[] (one item per line) and channels as TEXT[] (comma-separated input).
export function parseLines(s: string): string[] {
  return s.split('\n').map(l => l.trim()).filter(Boolean);
}

export function parseComma(s: string): string[] {
  return s.split(',').map(l => l.trim()).filter(Boolean);
}

// Inclusive day count between start_date and end_date (campaigns.duration_days
// has a DB CHECK constraint requiring > 0, so always return at least 1).
export function calculateCampaignDurationDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  return Math.max(1, diffDays);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const CLIENT_STATUS_LABEL: Record<string, string> = {
  active:   'Active',
  inactive: 'Paused',
  archived: 'Archived',
};

export const CLIENT_STATUS_COLOR: Record<string, string> = {
  active:   '#34d399',
  inactive: '#f59e0b',
  archived: '#71717a',
};

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft:     'Draft',
  active:    'Active',
  paused:    'Paused',
  completed: 'Completed',
  archived:  'Archived',
};

export const CAMPAIGN_STATUS_COLOR: Record<string, string> = {
  draft:     '#94a3b8',
  active:    '#34d399',
  paused:    '#f59e0b',
  completed: '#60a5fa',
  archived:  '#71717a',
};

export const BRIEF_STATUS_LABEL: Record<string, string> = {
  draft:                    'Draft',
  ready_for_generation:     'Ready for Generation',
  needs_revision:           'Needs Revision',
  approved_for_generation:  'Approved for Generation',
  archived:                 'Archived',
};

export const BRIEF_STATUS_COLOR: Record<string, string> = {
  draft:                    '#94a3b8',
  ready_for_generation:     '#60a5fa',
  needs_revision:           '#f59e0b',
  approved_for_generation:  '#34d399',
  archived:                 '#71717a',
};

export const BRIEF_STATUSES = [
  'draft',
  'ready_for_generation',
  'needs_revision',
  'approved_for_generation',
  'archived',
] as const;

// ---------------------------------------------------------------------------
// Generation Data Store (Phase 6) — separate localStorage key
// Keeps generation state independent from CoreDataStore to avoid cascade
// changes in existing tabs.
// ---------------------------------------------------------------------------

export interface GenerationDataStore {
  generationJobs: ContentPlanJob[];
  contentItems: ContentPlanItem[];
}

const GEN_STORAGE_KEY = 'core_agency_gen_data_v1';

export function loadGenerationData(): GenerationDataStore {
  try {
    const stored = localStorage.getItem(GEN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GenerationDataStore>;
      return {
        generationJobs: parsed.generationJobs ?? [],
        contentItems: parsed.contentItems ?? [],
      };
    }
  } catch (_) { /* ignore */ }
  return { generationJobs: [], contentItems: [] };
}

export function saveGenerationData(data: GenerationDataStore): void {
  try {
    localStorage.setItem(GEN_STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

export const JOB_STATUS_LABEL: Record<string, string> = {
  draft:      'Draft',
  queued:     'Queued',
  generating: 'Generating…',
  completed:  'Completed',
  failed:     'Failed',
  archived:   'Archived',
};

export const JOB_STATUS_COLOR: Record<string, string> = {
  draft:      '#94a3b8',
  queued:     '#60a5fa',
  generating: '#f59e0b',
  completed:  '#34d399',
  failed:     '#f87171',
  archived:   '#71717a',
};

// ---------------------------------------------------------------------------
// Generation mode display — keeps UI labels accurate to how a job was produced.
// `external_module` = real n8n AI provider job; `mock` = local fallback used
// when the n8n webhook env is not configured. Centralized here so every tab
// that renders shared generation jobs shows the same truthful mode label.
// ---------------------------------------------------------------------------
export const GENERATION_MODE_LABEL: Record<GenerationMode, string> = {
  mock:            'Local fallback mode',
  ai_ready:        'AI provider',
  external_module: 'n8n AI Provider',
};

export const GENERATION_MODE_COLOR: Record<GenerationMode, string> = {
  mock:            '#f59e0b',
  ai_ready:        '#60a5fa',
  external_module: '#34d399',
};

// Source / provenance line shown under a job. Mirrors the metadata appended to
// each content item by the Content Factory (source / generated_by).
export const GENERATION_MODE_SOURCE: Record<GenerationMode, string> = {
  mock:            'Source: local / generated_by: core-local-mock',
  ai_ready:        'Source: ai / generated_by: ai-provider',
  external_module: 'Source: n8n / generated_by: n8n-ai-provider',
};

export const CONTENT_ITEM_STATUS_LABEL: Record<string, string> = {
  generated:          'Generated',
  needs_review:       'Needs Review',
  revision_requested: 'Revision Requested',
  approved:           'Approved',
  scheduled:          'Scheduled',
  published:          'Published',
  rejected:           'Rejected',
  archived:           'Archived',
};

export const CONTENT_ITEM_STATUS_COLOR: Record<string, string> = {
  generated:          '#60a5fa',
  needs_review:       '#f59e0b',
  revision_requested: '#fb923c',
  approved:           '#34d399',
  scheduled:          '#fb923c',
  published:          '#10b981',
  rejected:           '#f87171',
  archived:           '#71717a',
};

// ---------------------------------------------------------------------------
// Calendar helpers (Phase 7) — update a single ContentPlanItem in the store
// ---------------------------------------------------------------------------

export type CalendarSafeStatus = 'generated' | 'needs_review' | 'revision_requested' | 'rejected' | 'archived';

export const CALENDAR_SAFE_STATUSES: CalendarSafeStatus[] = [
  'generated',
  'needs_review',
  'revision_requested',
  'rejected',
  'archived',
];

export interface CalendarItemPatch {
  planned_date?: string | null;
  scheduled_time?: string | null;
  channel?: string;
  owner_note?: string | null;
  publish_note?: string | null;
  status?: CalendarSafeStatus;
}

export function updateContentItemInStore(
  store: GenerationDataStore,
  itemId: string,
  patch: CalendarItemPatch,
): GenerationDataStore {
  const now = new Date().toISOString();
  return {
    ...store,
    contentItems: store.contentItems.map(item =>
      item.id === itemId
        ? { ...item, ...patch, last_moved_at: patch.planned_date !== undefined ? now : item.last_moved_at, updated_at: now }
        : item
    ),
  };
}

// ---------------------------------------------------------------------------
// Approval Data Store (Phase 8) — separate localStorage key
// ---------------------------------------------------------------------------

export interface ApprovalDataStore {
  approvalRequests: ContentApprovalRequest[];
  approvalEvents:   ContentApprovalEvent[];
  approvalComments: ContentApprovalComment[];
}

const APPROVAL_STORAGE_KEY = 'core_agency_approval_data_v1';

export function loadApprovalData(): ApprovalDataStore {
  try {
    const stored = localStorage.getItem(APPROVAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ApprovalDataStore>;
      return {
        approvalRequests: parsed.approvalRequests ?? [],
        approvalEvents:   parsed.approvalEvents   ?? [],
        approvalComments: parsed.approvalComments ?? [],
      };
    }
  } catch (_) { /* ignore */ }
  return { approvalRequests: [], approvalEvents: [], approvalComments: [] };
}

export function saveApprovalData(data: ApprovalDataStore): void {
  try {
    localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

// Display helpers
export const APPROVAL_STATUS_LABEL: Record<ContentApprovalStatus, string> = {
  draft:              'Draft',
  submitted:          'Submitted',
  approved:           'Approved',
  rejected:           'Rejected',
  revision_requested: 'Revision Requested',
  cancelled:          'Cancelled',
};

export const APPROVAL_STATUS_COLOR: Record<ContentApprovalStatus, string> = {
  draft:              '#94a3b8',
  submitted:          '#60a5fa',
  approved:           '#34d399',
  rejected:           '#f87171',
  revision_requested: '#fb923c',
  cancelled:          '#71717a',
};

export const APPROVAL_PRIORITY_LABEL: Record<ApprovalPriority, string> = {
  low:    'Low',
  normal: 'Normal',
  high:   'High',
};

export const APPROVAL_PRIORITY_COLOR: Record<ApprovalPriority, string> = {
  low:    '#94a3b8',
  normal: '#60a5fa',
  high:   '#f87171',
};

export const APPROVAL_ACTION_LABEL: Record<string, string> = {
  submitted:          'Submitted for approval',
  approved:           'Approved',
  rejected:           'Rejected',
  revision_requested: 'Revision requested',
  commented:          'Comment added',
  cancelled:          'Cancelled',
};

// Statuses that allow submission
export const SUBMITTABLE_ITEM_STATUSES = ['generated', 'needs_review', 'revision_requested'] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

// Get the most recent active (submitted) request for a content item
export function getActiveRequestForItem(
  store: ApprovalDataStore,
  contentItemId: string,
): ContentApprovalRequest | undefined {
  return store.approvalRequests.find(
    r => r.content_item_id === contentItemId && r.status === 'submitted',
  );
}

// Check if a content item can be submitted for approval
export function canSubmitItem(
  store: ApprovalDataStore,
  contentItem: ContentPlanItem,
): boolean {
  if (!(SUBMITTABLE_ITEM_STATUSES as readonly string[]).includes(contentItem.status)) return false;
  return !getActiveRequestForItem(store, contentItem.id);
}

// Submit a content item for approval
export function submitForApproval(
  approvalStore: ApprovalDataStore,
  genStore: GenerationDataStore,
  contentItem: ContentPlanItem,
  actorLabel: string,
  options?: { priority?: ApprovalPriority; due_date?: string },
): { approval: ApprovalDataStore; gen: GenerationDataStore } {
  const now   = new Date().toISOString();
  const reqId = generateId('apr');

  const request: ContentApprovalRequest = {
    id:                reqId,
    content_item_id:   contentItem.id,
    generation_job_id: contentItem.generation_job_id,
    brief_id:          contentItem.brief_id,
    campaign_id:       contentItem.campaign_id,
    brand_id:          contentItem.brand_id,
    client_id:         contentItem.client_id,
    title:             contentItem.hook.slice(0, 80),
    status:            'submitted',
    priority:          options?.priority ?? 'normal',
    requested_by:      actorLabel,
    assigned_to_role:  'manager',
    due_date:          options?.due_date ?? null,
    created_at:        now,
    updated_at:        now,
    resolved_at:       null,
  };

  const event: ContentApprovalEvent = {
    id:                  generateId('aev'),
    approval_request_id: reqId,
    content_item_id:     contentItem.id,
    action:              'submitted',
    actor_label:         actorLabel,
    comment:             null,
    previous_status:     null,
    new_status:          'submitted',
    created_at:          now,
  };

  // Update content item status to needs_review (submitted for review)
  const updatedGen: GenerationDataStore = {
    ...genStore,
    contentItems: genStore.contentItems.map(i =>
      i.id === contentItem.id ? { ...i, status: 'needs_review', updated_at: now } : i
    ),
  };

  return {
    approval: {
      ...approvalStore,
      approvalRequests: [request, ...approvalStore.approvalRequests],
      approvalEvents:   [event,   ...approvalStore.approvalEvents],
    },
    gen: updatedGen,
  };
}

// Execute an approval action (approve / reject / revision_requested / cancelled)
export type ResolvingAction = 'approved' | 'rejected' | 'revision_requested' | 'cancelled';

export const ACTION_TO_APPROVAL_STATUS: Record<ResolvingAction, ContentApprovalStatus> = {
  approved:           'approved',
  rejected:           'rejected',
  revision_requested: 'revision_requested',
  cancelled:          'cancelled',
};

export const ACTION_TO_ITEM_STATUS: Record<ResolvingAction, string> = {
  approved:           'approved',
  rejected:           'rejected',
  revision_requested: 'revision_requested',
  cancelled:          'needs_review', // cancelled approval → item goes back to needs_review
};

export function executeApprovalAction(
  approvalStore: ApprovalDataStore,
  genStore: GenerationDataStore,
  requestId: string,
  action: ResolvingAction,
  actorLabel: string,
  comment?: string,
): { approval: ApprovalDataStore; gen: GenerationDataStore } {
  const now     = new Date().toISOString();
  const request = approvalStore.approvalRequests.find(r => r.id === requestId);
  if (!request) return { approval: approvalStore, gen: genStore };

  const newApprovalStatus = ACTION_TO_APPROVAL_STATUS[action];
  const newItemStatus     = ACTION_TO_ITEM_STATUS[action];

  const event: ContentApprovalEvent = {
    id:                  generateId('aev'),
    approval_request_id: requestId,
    content_item_id:     request.content_item_id,
    action:              action as ApprovalActionType,
    actor_label:         actorLabel,
    comment:             comment ?? null,
    previous_status:     request.status,
    new_status:          newApprovalStatus,
    created_at:          now,
  };

  const updatedApproval: ApprovalDataStore = {
    ...approvalStore,
    approvalRequests: approvalStore.approvalRequests.map(r =>
      r.id === requestId
        ? { ...r, status: newApprovalStatus, updated_at: now, resolved_at: now }
        : r
    ),
    approvalEvents: [event, ...approvalStore.approvalEvents],
  };

  const updatedGen: GenerationDataStore = {
    ...genStore,
    contentItems: genStore.contentItems.map(i =>
      i.id === request.content_item_id
        ? { ...i, status: newItemStatus as ContentPlanItem['status'], updated_at: now }
        : i
    ),
  };

  return { approval: updatedApproval, gen: updatedGen };
}

// Add a comment without changing status
export function addApprovalComment(
  approvalStore: ApprovalDataStore,
  requestId: string,
  contentItemId: string,
  actorLabel: string,
  commentText: string,
  isInternal = true,
): ApprovalDataStore {
  const now = new Date().toISOString();

  const comment: ContentApprovalComment = {
    id:                  generateId('acm'),
    approval_request_id: requestId,
    content_item_id:     contentItemId,
    actor_label:         actorLabel,
    comment:             commentText,
    is_internal:         isInternal,
    created_at:          now,
  };

  const event: ContentApprovalEvent = {
    id:                  generateId('aev'),
    approval_request_id: requestId,
    content_item_id:     contentItemId,
    action:              'commented',
    actor_label:         actorLabel,
    comment:             commentText,
    previous_status:     null,
    new_status:          null,
    created_at:          now,
  };

  return {
    ...approvalStore,
    approvalComments: [comment, ...approvalStore.approvalComments],
    approvalEvents:   [event,   ...approvalStore.approvalEvents],
  };
}

export const EMPTY_BRIEF_FORM: BriefFormData = {
  campaign_id: '',
  brand_id: '',
  client_id: '',
  brand_name: '',
  industry: '',
  brief_title: '',
  campaign_goal: '',
  product_focus: '',
  offer: '',
  target_audience: '',
  channels: '',
  tone_of_voice: '',
  content_pillars: '',
  key_messages: '',
  must_include: '',
  must_avoid: '',
  competitors: '',
  reference_links: '',
  budget_note: '',
  timeline_note: '',
  approval_requirements: '',
};

// ---------------------------------------------------------------------------
// Asset Data Store (Phase 10) — separate localStorage key
// ---------------------------------------------------------------------------

export interface AssetDataStore {
  assets: AssetItem[];
  collections: LocalAssetCollection[];
}

const ASSET_STORAGE_KEY = 'core_agency_asset_data_v1';

// ── Seed data ─────────────────────────────────────────────────────────────

export const SEED_COLLECTIONS: LocalAssetCollection[] = [
  {
    id: 'col-vc-brand',
    client_id: 'client-vi-cuon',
    brand_id: 'brand-vi-cuon',
    campaign_id: null,
    name: 'Vị Cuốn — Brand Assets',
    description: 'Logo, ảnh sản phẩm, brand identity chính thức của Vị Cuốn.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'col-ct-brand',
    client_id: 'client-com-tam',
    brand_id: 'brand-com-tam',
    campaign_id: null,
    name: 'Cơm Tấm Bản Khói — Brand Assets',
    description: 'Design references, brand colors và identity assets.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'col-forme-brand',
    client_id: 'client-forme',
    brand_id: 'brand-forme',
    campaign_id: null,
    name: 'Forme — Brand Guidelines & Assets',
    description: 'Brand guideline, product photography, marketing assets cao cấp.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_ASSETS: AssetItem[] = [
  {
    id: 'asset-vc-logo',
    client_id: 'client-vi-cuon',
    brand_id: 'brand-vi-cuon',
    campaign_id: null,
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: 'col-vc-brand',
    name: 'Vị Cuốn — Logo Chính',
    asset_type: 'logo',
    source_type: 'local_placeholder',
    url: null,
    thumbnail_url: null,
    file_name: 'vi-cuon-logo.png',
    file_size_note: 'Placeholder — chưa có file thật',
    mime_type: 'image/png',
    tags: ['logo', 'brand-identity', 'official'],
    usage_rights_note: 'Sở hữu bởi Vị Cuốn. Chỉ dùng cho mục đích marketing của thương hiệu. Owner cần xác nhận màu sắc thực tế trước khi dùng.',
    approval_status: 'approved',
    notes: 'Logo chính thức. Cần owner xác nhận bản màu CMYK và RGB trước khi dùng in ấn.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'asset-vc-photo-hero',
    client_id: 'client-vi-cuon',
    brand_id: 'brand-vi-cuon',
    campaign_id: 'campaign-vi-cuon-he',
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: 'col-vc-brand',
    name: 'Heo Quay Giòn — Hero Shot #1',
    asset_type: 'image',
    source_type: 'local_placeholder',
    url: null,
    thumbnail_url: null,
    file_name: 'heo-quay-gion-hero-01.jpg',
    file_size_note: '~3MB JPEG (cần chụp thực tế)',
    mime_type: 'image/jpeg',
    tags: ['product', 'hero-shot', 'mùa-hè', 'heo-quay'],
    usage_rights_note: 'Cần chụp thực tế tại cửa hàng. Chưa có ảnh chính thức. Usage rights thuộc về Vị Cuốn sau khi chụp.',
    approval_status: 'needs_review',
    notes: 'Placeholder cho ảnh chụp thực tế heo quay giòn rụm — da giòn rụm, thịt mềm. Cần nhiếp ảnh gia food photography.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'asset-vc-footage-bep',
    client_id: 'client-vi-cuon',
    brand_id: 'brand-vi-cuon',
    campaign_id: 'campaign-vi-cuon-he',
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: null,
    name: 'Raw Footage — Bếp Nướng Lu Đất',
    asset_type: 'raw_footage',
    source_type: 'local_placeholder',
    url: null,
    thumbnail_url: null,
    file_name: 'raw-bep-nuong-lu-dat.mp4',
    file_size_note: '~500MB MP4 (dự kiến sau khi quay)',
    mime_type: 'video/mp4',
    tags: ['raw-footage', 'bep', 'asmr', 'process'],
    usage_rights_note: 'Quyền sở hữu thuộc về Vị Cuốn. Cần sự đồng ý của chủ để sử dụng bên ngoài. Không chia sẻ footage thô.',
    approval_status: 'draft',
    notes: 'Cần quay thực tế tại bếp. Footage chưa có. Dự kiến quay cùng ngày chụp ảnh sản phẩm. Phong cách ASMR — tiếng nổ crackling của da heo quay.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'asset-ct-palette',
    client_id: 'client-com-tam',
    brand_id: 'brand-com-tam',
    campaign_id: 'campaign-com-tam-menu',
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: 'col-ct-brand',
    name: 'Design Reference — Brand Palette Màu Q3/2026',
    asset_type: 'reference',
    source_type: 'external_url',
    url: 'https://placeholder.example.com/ct-palette-q3-2026',
    thumbnail_url: null,
    file_name: null,
    file_size_note: null,
    mime_type: null,
    tags: ['design-reference', 'palette', 'brand-colors', 'Q3-2026'],
    usage_rights_note: 'Reference board nội bộ. Không phân phối ra bên ngoài.',
    approval_status: 'approved',
    notes: 'Palette màu chính cho chiến dịch Q3/2026 — cam đất #f4a261, xanh lá #2a9d8f. Dùng nhất quán trên tất cả creative.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'asset-forme-guideline',
    client_id: 'client-forme',
    brand_id: 'brand-forme',
    campaign_id: null,
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: 'col-forme-brand',
    name: 'Forme Brand Guideline 2026',
    asset_type: 'document',
    source_type: 'local_placeholder',
    url: null,
    thumbnail_url: null,
    file_name: 'forme-brand-guideline-2026.pdf',
    file_size_note: '~15MB PDF',
    mime_type: 'application/pdf',
    tags: ['brand-guideline', 'official-document', 'typography', 'colors', 'logo-usage'],
    usage_rights_note: 'Tài liệu nội bộ Forme. Bảo mật — không chia sẻ ra bên ngoài. Chỉ dùng trong team The Core Agency khi phục vụ Forme.',
    approval_status: 'approved',
    notes: 'Brand guideline chính thức Forme 2026. Bao gồm typography, màu sắc, quy tắc dùng logo, tone of voice. Cần owner Forme confirm version mới nhất.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'asset-forme-sofa-ref',
    client_id: 'client-forme',
    brand_id: 'brand-forme',
    campaign_id: 'campaign-forme-f1',
    brief_id: null,
    generation_job_id: null,
    content_item_id: null,
    asset_collection_id: 'col-forme-brand',
    name: 'Sofa F-1 — Lifestyle Photography Brief',
    asset_type: 'reference',
    source_type: 'local_placeholder',
    url: null,
    thumbnail_url: null,
    file_name: 'sofa-f1-photo-brief.pdf',
    file_size_note: '~2MB PDF',
    mime_type: 'application/pdf',
    tags: ['reference', 'photo-brief', 'lifestyle', 'sofa-f1'],
    usage_rights_note: 'Tài liệu brief nội bộ. Quyền sở hữu ảnh thuộc về Forme sau khi chụp. Cần hợp đồng nhiếp ảnh trước khi sử dụng thương mại.',
    approval_status: 'needs_review',
    notes: 'Brief hướng dẫn phong cách chụp ảnh lifestyle cho Sofa F-1. Phòng khách hiện đại, ánh sáng tự nhiên, gia đình trẻ thành đạt. Cần manager review.',
    created_by: 'demo-owner-000',
    created_at: NOW,
    updated_at: NOW,
  },
];

// ── Store ─────────────────────────────────────────────────────────────────

export function loadAssetData(): AssetDataStore {
  try {
    const stored = localStorage.getItem(ASSET_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AssetDataStore>;
      return {
        // brief_id/generation_job_id are additive (Phase 16D) — default to
        // null for assets persisted before this phase.
        assets: (parsed.assets ?? SEED_ASSETS).map(a => ({
          ...a,
          brief_id: a.brief_id ?? null,
          generation_job_id: a.generation_job_id ?? null,
        })),
        collections: parsed.collections ?? SEED_COLLECTIONS,
      };
    }
  } catch (_) { /* ignore */ }
  return { assets: SEED_ASSETS, collections: SEED_COLLECTIONS };
}

export function saveAssetData(data: AssetDataStore): void {
  try {
    localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

// ── Display helpers ───────────────────────────────────────────────────────

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  image:        'Image',
  video:        'Video',
  design:       'Design File',
  document:     'Document',
  logo:         'Logo',
  raw_footage:  'Raw Footage',
  reference:    'Reference',
  other:        'Other',
};

export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  image:        '#60a5fa',
  video:        '#fb923c',
  design:       '#f59e0b',
  document:     '#94a3b8',
  logo:         '#34d399',
  raw_footage:  '#fb923c',
  reference:    '#a78bfa',
  other:        '#71717a',
};

export const ASSET_SOURCE_LABEL: Record<AssetSourceType, string> = {
  local_placeholder:    'Local Placeholder',
  external_url:         'External URL',
  storage_ready:        'Storage Ready',
  generated_placeholder: 'Generated Placeholder',
};

export const ASSET_APPROVAL_LABEL: Record<AssetApprovalStatus, string> = {
  draft:        'Draft',
  needs_review: 'Needs Review',
  approved:     'Approved',
  rejected:     'Rejected',
  archived:     'Archived',
};

export const ASSET_APPROVAL_COLOR: Record<AssetApprovalStatus, string> = {
  draft:        '#94a3b8',
  needs_review: '#f59e0b',
  approved:     '#34d399',
  rejected:     '#f87171',
  archived:     '#71717a',
};

export const ASSET_TYPES: AssetType[] = [
  'image', 'video', 'design', 'document', 'logo', 'raw_footage', 'reference', 'other',
];

export const ASSET_APPROVAL_STATUSES: AssetApprovalStatus[] = [
  'draft', 'needs_review', 'approved', 'rejected', 'archived',
];

// ---------------------------------------------------------------------------
// Export Pack Data Store (Phase 12) — separate localStorage key
// ---------------------------------------------------------------------------

export interface ExportPackDataStore {
  packs: LocalExportPack[];
}

const EXPORT_PACK_STORAGE_KEY = 'core_agency_export_pack_data_v1';

export function loadExportPackData(): ExportPackDataStore {
  try {
    const stored = localStorage.getItem(EXPORT_PACK_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ExportPackDataStore>;
      return { packs: parsed.packs ?? [] };
    }
  } catch (_) { /* ignore */ }
  return { packs: [] };
}

export function saveExportPackData(data: ExportPackDataStore): void {
  try {
    const trimmed: ExportPackDataStore = { packs: data.packs.slice(0, 50) };
    localStorage.setItem(EXPORT_PACK_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (_) { /* ignore */ }
}
