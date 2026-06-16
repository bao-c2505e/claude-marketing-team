import type {
  LocalConnectorType,
  LocalConnectorStatus,
  LocalConnectorMode,
  LocalConnectorRegistryItem,
  LocalModuleName,
  LocalModuleStatus,
  LocalModuleRegistryItem,
  LocalModuleEventType,
  LocalModuleEventStatus,
  LocalModuleEvent,
} from '../../types/core';
import { generateId } from './coreData';

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const CONNECTOR_TYPE_LABEL: Record<LocalConnectorType, string> = {
  n8n:           'n8n Workflow',
  openai:        'OpenAI',
  anthropic:     'Anthropic / Claude',
  gemini:        'Google Gemini',
  canva:         'Canva',
  meta_ads:      'Meta Ads',
  google_drive:  'Google Drive',
  google_sheets: 'Google Sheets',
  comfyui:       'ComfyUI',
  storage:       'Storage',
  webhook:       'Webhook',
  other:         'Other',
};

export const CONNECTOR_STATUS_LABEL: Record<LocalConnectorStatus, string> = {
  not_configured: 'Not Configured',
  configured:     'Configured',
  connected:      'Connected',
  error:          'Error',
  disabled:       'Disabled',
};

export const CONNECTOR_STATUS_COLOR: Record<LocalConnectorStatus, string> = {
  not_configured: '#71717a',
  configured:     '#60a5fa',
  connected:      '#34d399',
  error:          '#f87171',
  disabled:       '#52525b',
};

export const CONNECTOR_MODE_LABEL: Record<LocalConnectorMode, string> = {
  mock:       'Mock',
  sandbox:    'Sandbox',
  production: 'Production',
};

export const CONNECTOR_MODE_COLOR: Record<LocalConnectorMode, string> = {
  mock:       '#f59e0b',
  sandbox:    '#22d3ee',
  production: '#f87171',
};

export const MODULE_NAME_LABEL: Record<LocalModuleName, string> = {
  content_auto:                    'Content Auto',
  creative_asset_auto:             'Creative Asset Auto',
  ads_pack_auto:                   'Ads Pack Auto',
  crm_followup_auto:               'CRM Follow-up Auto',
  comment_inbox_reply_assistant:   'Comment/Inbox Reply Assistant',
  approval_publishing_automation:  'Approval + Publishing Automation',
  analytics_intelligence:          'Analytics Intelligence',
  competitor_intelligence:         'Competitor Intelligence',
  website_landing_intelligence:    'Website/Landing Intelligence',
  comfyui_creative_module:         'ComfyUI Creative Module',
  other:                           'Other',
};

export const MODULE_STATUS_LABEL: Record<LocalModuleStatus, string> = {
  planned:       'Planned',
  mock_ready:    'Mock Ready',
  sandbox_ready: 'Sandbox Ready',
  connected:     'Connected',
  disabled:      'Disabled',
  error:         'Error',
};

export const MODULE_STATUS_COLOR: Record<LocalModuleStatus, string> = {
  planned:       '#94a3b8',
  mock_ready:    '#f59e0b',
  sandbox_ready: '#22d3ee',
  connected:     '#34d399',
  disabled:      '#52525b',
  error:         '#f87171',
};

export const MODULE_EVENT_TYPE_LABEL: Record<LocalModuleEventType, string> = {
  generation_requested:  'Generation Requested',
  generation_completed:  'Generation Completed',
  creative_requested:    'Creative Requested',
  creative_completed:    'Creative Completed',
  ads_pack_requested:    'Ads Pack Requested',
  ads_pack_completed:    'Ads Pack Completed',
  approval_submitted:    'Approval Submitted',
  approval_completed:    'Approval Completed',
  report_generated:      'Report Generated',
  webhook_received:      'Webhook Received',
  error:                 'Error',
  other:                 'Other',
};

export const MODULE_EVENT_STATUS_LABEL: Record<LocalModuleEventStatus, string> = {
  received:     'Received',
  processed:    'Processed',
  needs_review: 'Needs Review',
  failed:       'Failed',
  ignored:      'Ignored',
};

export const MODULE_EVENT_STATUS_COLOR: Record<LocalModuleEventStatus, string> = {
  received:     '#60a5fa',
  processed:    '#34d399',
  needs_review: '#f59e0b',
  failed:       '#f87171',
  ignored:      '#71717a',
};

export const MODULE_EVENT_TYPES: LocalModuleEventType[] = [
  'generation_requested', 'generation_completed',
  'creative_requested', 'creative_completed',
  'ads_pack_requested', 'ads_pack_completed',
  'approval_submitted', 'approval_completed',
  'report_generated', 'webhook_received',
  'error', 'other',
];

export const MODULE_STATUSES: LocalModuleStatus[] = [
  'planned', 'mock_ready', 'sandbox_ready', 'connected', 'disabled', 'error',
];

export const CONNECTOR_STATUSES: LocalConnectorStatus[] = [
  'not_configured', 'configured', 'connected', 'error', 'disabled',
];

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const PAST = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

export const SEED_CONNECTORS: LocalConnectorRegistryItem[] = [
  {
    id: 'conn-n8n',
    name: 'n8n Webhook Backbone',
    connector_type: 'n8n',
    status: 'not_configured',
    mode: 'mock',
    description: 'n8n automation backbone for orchestrating generation triggers, content routing, module callbacks, and workflow automation.',
    required_env_keys: ['N8N_WEBHOOK_URL', 'N8N_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'Phase 13 — registry only. No real n8n webhook sent. Requires manual env setup and owner approval before any production use.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-openai',
    name: 'OpenAI',
    connector_type: 'openai',
    status: 'not_configured',
    mode: 'mock',
    description: 'OpenAI GPT-4o API for content generation modules. Used by Content Auto module for hook/caption/CTA generation.',
    required_env_keys: ['OPENAI_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'API key must NEVER be stored in frontend code. Backend proxy required. Phase 13 — registry only, no real API calls.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-anthropic',
    name: 'Anthropic / Claude',
    connector_type: 'anthropic',
    status: 'not_configured',
    mode: 'mock',
    description: 'Anthropic Claude API for advanced content reasoning, multi-step generation, and strategy synthesis.',
    required_env_keys: ['ANTHROPIC_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'API key must NEVER be stored in frontend. Backend proxy required. Phase 13 — registry only.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-gemini',
    name: 'Google Gemini',
    connector_type: 'gemini',
    status: 'not_configured',
    mode: 'mock',
    description: 'Google Gemini API — optional AI provider for multilingual content generation and analytics summaries.',
    required_env_keys: ['GEMINI_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'API key must NEVER be stored in frontend. Backend proxy required.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-canva',
    name: 'Canva',
    connector_type: 'canva',
    status: 'not_configured',
    mode: 'mock',
    description: 'Canva Connect API for design asset creation, brand kit sync, and creative brief automation.',
    required_env_keys: ['CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'OAuth 2.0 flow required. Phase 13 — registry only. No real Canva API calls.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-meta-ads',
    name: 'Meta Ads',
    connector_type: 'meta_ads',
    status: 'not_configured',
    mode: 'mock',
    description: 'Meta Marketing API for Facebook/Instagram ad creation and campaign management. REQUIRES owner approval before use.',
    required_env_keys: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID', 'META_APP_ID'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'NO REAL ADS will be created or budget spent in Phase 13. Requires explicit owner approval and human review for any production use.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-google-drive',
    name: 'Google Drive',
    connector_type: 'google_drive',
    status: 'not_configured',
    mode: 'mock',
    description: 'Google Drive API for asset storage, export pack delivery, and document management.',
    required_env_keys: ['GOOGLE_SERVICE_ACCOUNT_KEY', 'GOOGLE_DRIVE_FOLDER_ID'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'Service account key must NEVER be in frontend. Phase 13 — registry only.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-google-sheets',
    name: 'Google Sheets',
    connector_type: 'google_sheets',
    status: 'not_configured',
    mode: 'mock',
    description: 'Google Sheets API for content calendar export, reporting, and KPI tracking.',
    required_env_keys: ['GOOGLE_SERVICE_ACCOUNT_KEY', 'GOOGLE_SHEETS_ID'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'Service account key must NEVER be in frontend. Phase 13 — registry only.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-comfyui',
    name: 'ComfyUI',
    connector_type: 'comfyui',
    status: 'not_configured',
    mode: 'mock',
    description: 'ComfyUI API for AI image/design generation via custom workflows. Used by Creative Asset Auto module.',
    required_env_keys: ['COMFYUI_API_URL', 'COMFYUI_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'Phase 13 — registry only. No real image generation. Self-hosted ComfyUI required.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-storage',
    name: 'Supabase Storage',
    connector_type: 'storage',
    status: 'not_configured',
    mode: 'mock',
    description: 'Supabase Storage for real file upload and asset management. Replaces local placeholder assets.',
    required_env_keys: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'NEVER use service_role key in frontend. Anon key + RLS policies only.',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'conn-webhook',
    name: 'Webhook Callback',
    connector_type: 'webhook',
    status: 'not_configured',
    mode: 'mock',
    description: 'Inbound webhook endpoint for receiving module completion callbacks from n8n and external modules.',
    required_env_keys: ['WEBHOOK_SECRET', 'WEBHOOK_CALLBACK_URL'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'Phase 13 — registry only. No real webhook processing. Mock events simulate inbound callbacks.',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_MODULES: LocalModuleRegistryItem[] = [
  {
    id: 'mod-content-auto',
    module_name: 'content_auto',
    module_type: 'copywriter',
    status: 'mock_ready',
    description: 'Tự động tạo content plan (hook, caption, CTA, hashtags) cho campaign từ brief qua n8n AI Provider (external module job). Approval-first: tạo Pending Approval, không auto-post/auto-ads. Có local fallback khi webhook chưa cấu hình.',
    input_contract_name: 'ContentGenerationRequest',
    output_contract_name: 'ContentPlanItems',
    callback_endpoint_note: '/api/webhooks/content-completed',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-creative-asset',
    module_name: 'creative_asset_auto',
    module_type: 'designer',
    status: 'planned',
    description: 'Tự động tạo design brief và trigger ComfyUI/Canva để sản xuất creative assets (ảnh, video thumbnail, banner).',
    input_contract_name: 'CreativeAssetRequest',
    output_contract_name: 'CreativeAssetItems',
    callback_endpoint_note: '/api/webhooks/creative-completed',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-ads-pack',
    module_name: 'ads_pack_auto',
    module_type: 'ads_manager',
    status: 'planned',
    description: 'Tự động tạo ads pack (targeting, creative, copy) từ approved content. Cần owner approval trước khi chạy thật.',
    input_contract_name: 'AdsCampaignRequest',
    output_contract_name: 'AdsCampaignPack',
    callback_endpoint_note: '/api/webhooks/ads-pack-completed',
    owner: 'owner',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-crm-followup',
    module_name: 'crm_followup_auto',
    module_type: 'custom',
    status: 'planned',
    description: 'Tự động follow-up CRM: nhắc nhở task, gửi template email/Zalo (cần owner approval), track lead status.',
    input_contract_name: 'CRMFollowUpRequest',
    output_contract_name: 'CRMFollowUpResult',
    callback_endpoint_note: '/api/webhooks/crm-followup-completed',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-comment-inbox',
    module_name: 'comment_inbox_reply_assistant',
    module_type: 'custom',
    status: 'planned',
    description: 'Trợ lý trả lời comment và inbox: đề xuất reply, phân loại sentiment, escalate nếu cần. KHÔNG tự động gửi — cần human review.',
    input_contract_name: 'CommentInboxEvent',
    output_contract_name: 'ReplyDraft',
    callback_endpoint_note: '/api/webhooks/comment-draft-ready',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-approval-publishing',
    module_name: 'approval_publishing_automation',
    module_type: 'custom',
    status: 'planned',
    description: 'Automation phê duyệt và lên lịch đăng bài. Routing approval request, notify reviewer, trigger publish khi approved. KHÔNG auto-post — approval gate bắt buộc.',
    input_contract_name: 'ApprovalPublishRequest',
    output_contract_name: 'PublishResult',
    callback_endpoint_note: '/api/webhooks/approval-result',
    owner: 'owner',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-analytics',
    module_name: 'analytics_intelligence',
    module_type: 'reporter',
    status: 'planned',
    description: 'Thu thập và tổng hợp dữ liệu analytics từ Meta/Google/TikTok. Tạo performance report tự động. Chỉ đọc dữ liệu, không thay đổi campaign.',
    input_contract_name: 'AnalyticsRequest',
    output_contract_name: 'AnalyticsReport',
    callback_endpoint_note: '/api/webhooks/analytics-ready',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-competitor',
    module_name: 'competitor_intelligence',
    module_type: 'reporter',
    status: 'planned',
    description: 'Theo dõi và phân tích hoạt động marketing của đối thủ. Output: competitive brief, content gap analysis.',
    input_contract_name: 'CompetitorWatchRequest',
    output_contract_name: 'CompetitorInsight',
    callback_endpoint_note: '/api/webhooks/competitor-report',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-website-landing',
    module_name: 'website_landing_intelligence',
    module_type: 'reporter',
    status: 'planned',
    description: 'Phân tích website/landing page của client: UX audit, SEO check, conversion optimization suggestions.',
    input_contract_name: 'WebsiteAnalysisRequest',
    output_contract_name: 'WebsiteInsight',
    callback_endpoint_note: '/api/webhooks/website-analysis-ready',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'mod-comfyui-creative',
    module_name: 'comfyui_creative_module',
    module_type: 'designer',
    status: 'planned',
    description: 'ComfyUI workflow runner cho AI image generation: product shots, social media creatives, banner variants. Self-hosted.',
    input_contract_name: 'ComfyUIGenerationRequest',
    output_contract_name: 'ComfyUIGenerationResult',
    callback_endpoint_note: '/api/webhooks/comfyui-completed',
    owner: 'manager',
    created_at: NOW,
    updated_at: NOW,
  },
];

export const SEED_EVENTS: LocalModuleEvent[] = [
  {
    id: 'evt-001',
    module_id:    'mod-content-auto',
    connector_id: 'conn-n8n',
    event_type:   'generation_completed',
    direction:    'inbound',
    status:       'processed',
    related_client_id:    'client-vi-cuon',
    related_brand_id:     'brand-vi-cuon',
    related_campaign_id:  'campaign-vi-cuon-he',
    related_content_item_id: null,
    payload_preview: '{"job_id":"mock-job-001","items_generated":7,"campaign":"Heo Quay Mùa Hè 2026","status":"completed","source":"mock"}',
    error_message: null,
    received_at:  PAST(90),
    processed_at: PAST(88),
    created_at:   PAST(90),
  },
  {
    id: 'evt-002',
    module_id:    'mod-content-auto',
    connector_id: 'conn-webhook',
    event_type:   'approval_submitted',
    direction:    'inbound',
    status:       'processed',
    related_client_id:    'client-com-tam',
    related_brand_id:     'brand-com-tam',
    related_campaign_id:  'campaign-com-tam-menu',
    related_content_item_id: null,
    payload_preview: '{"approval_request_id":"apr-mock-002","content_items":3,"submitted_by":"manager@agency.vn","priority":"normal","source":"mock"}',
    error_message: null,
    received_at:  PAST(60),
    processed_at: PAST(58),
    created_at:   PAST(60),
  },
  {
    id: 'evt-003',
    module_id:    'mod-analytics',
    connector_id: 'conn-n8n',
    event_type:   'report_generated',
    direction:    'inbound',
    status:       'needs_review',
    related_client_id:    'client-forme',
    related_brand_id:     'brand-forme',
    related_campaign_id:  'campaign-forme-f1',
    related_content_item_id: null,
    payload_preview: '{"report_type":"campaign_progress","scope":"Sofa F-1 Launch Campaign","period":"2026-06","items_approved":4,"items_pending":3,"source":"mock"}',
    error_message: null,
    received_at:  PAST(30),
    processed_at: null,
    created_at:   PAST(30),
  },
  {
    id: 'evt-004',
    module_id:    null,
    connector_id: 'conn-webhook',
    event_type:   'webhook_received',
    direction:    'inbound',
    status:       'received',
    related_client_id:    null,
    related_brand_id:     null,
    related_campaign_id:  null,
    related_content_item_id: null,
    payload_preview: '{"source":"external_test","action":"ping","timestamp":"2026-06-08T10:00:00Z","message":"Mock webhook test payload"}',
    error_message: null,
    received_at:  PAST(15),
    processed_at: null,
    created_at:   PAST(15),
  },
  {
    id: 'evt-005',
    module_id:    'mod-creative-asset',
    connector_id: 'conn-comfyui',
    event_type:   'error',
    direction:    'inbound',
    status:       'failed',
    related_client_id:    'client-vi-cuon',
    related_brand_id:     'brand-vi-cuon',
    related_campaign_id:  null,
    related_content_item_id: null,
    payload_preview: '{"job_id":"mock-creative-003","module":"creative_asset_auto","source":"mock"}',
    error_message: 'Mock error: ComfyUI connector not configured. Set COMFYUI_API_URL and COMFYUI_API_KEY in .env before production use.',
    received_at:  PAST(5),
    processed_at: null,
    created_at:   PAST(5),
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface ConnectorRegistryStore {
  connectors: LocalConnectorRegistryItem[];
  modules:    LocalModuleRegistryItem[];
  events:     LocalModuleEvent[];
}

const STORAGE_KEY = 'core_agency_connector_registry_v1';

export function loadConnectorRegistryData(): ConnectorRegistryStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ConnectorRegistryStore>;
      return {
        connectors: parsed.connectors ?? SEED_CONNECTORS,
        modules:    parsed.modules    ?? SEED_MODULES,
        events:     parsed.events     ?? SEED_EVENTS,
      };
    }
  } catch (_) { /* ignore */ }
  return { connectors: SEED_CONNECTORS, modules: SEED_MODULES, events: SEED_EVENTS };
}

export function saveConnectorRegistryData(data: ConnectorRegistryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export function updateConnectorStatus(
  store: ConnectorRegistryStore,
  id: string,
  status: LocalConnectorStatus,
  health_note?: string | null,
): ConnectorRegistryStore {
  const now = new Date().toISOString();
  return {
    ...store,
    connectors: store.connectors.map(c =>
      c.id === id
        ? { ...c, status, health_note: health_note ?? c.health_note, updated_at: now }
        : c
    ),
  };
}

export function simulateHealthCheck(
  store: ConnectorRegistryStore,
  id: string,
): ConnectorRegistryStore {
  const now = new Date().toISOString();
  return {
    ...store,
    connectors: store.connectors.map(c =>
      c.id === id
        ? {
            ...c,
            last_checked_at: now,
            health_note: `[Mock] Health check simulated at ${new Date().toLocaleString('vi-VN')}. No real API call made. Phase 13 — registry only.`,
            updated_at: now,
          }
        : c
    ),
  };
}

export function updateModuleStatus(
  store: ConnectorRegistryStore,
  id: string,
  status: LocalModuleStatus,
): ConnectorRegistryStore {
  const now = new Date().toISOString();
  return {
    ...store,
    modules: store.modules.map(m =>
      m.id === id ? { ...m, status, updated_at: now } : m
    ),
  };
}

export function updateEventStatus(
  store: ConnectorRegistryStore,
  id: string,
  status: LocalModuleEventStatus,
): ConnectorRegistryStore {
  const now = new Date().toISOString();
  return {
    ...store,
    events: store.events.map(e =>
      e.id === id
        ? {
            ...e,
            status,
            processed_at: status === 'processed' ? now : e.processed_at,
          }
        : e
    ),
  };
}

export function addMockEvent(
  store: ConnectorRegistryStore,
  data: Omit<LocalModuleEvent, 'id' | 'created_at'>,
): ConnectorRegistryStore {
  const now = new Date().toISOString();
  const event: LocalModuleEvent = { ...data, id: generateId('evt'), created_at: now };
  return { ...store, events: [event, ...store.events] };
}
