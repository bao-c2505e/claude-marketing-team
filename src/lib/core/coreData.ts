import type { Client, Brand, Campaign, CampaignBrief, ResourceStatus, CampaignStatus, BriefStatus, ContentPlanJob, ContentPlanItem } from '../../types/core';

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
  scheduled:          '#818cf8',
  published:          '#10b981',
  rejected:           '#f87171',
  archived:           '#71717a',
};

export const EMPTY_BRIEF_FORM: BriefFormData = {
  campaign_id: '',
  brand_id: '',
  client_id: '',
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
