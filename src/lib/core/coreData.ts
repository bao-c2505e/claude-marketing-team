import type { Client, Brand, Campaign, ResourceStatus, CampaignStatus } from '../../types/core';

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

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'core_agency_core_data_v1';

export interface CoreDataStore {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
}

export function loadCoreData(): CoreDataStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as CoreDataStore;
  } catch (_) { /* ignore */ }
  return {
    clients: SEED_CLIENTS,
    brands: SEED_BRANDS,
    campaigns: SEED_CAMPAIGNS,
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
