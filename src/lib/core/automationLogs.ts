import type {
  LocalAutomationLog,
  AutomationLogType,
  AutomationLogSource,
  AutomationLogSeverity,
  AutomationLogStatus,
} from '../../types/core';
import { generateId } from './coreData';

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const LOG_TYPE_LABEL: Record<AutomationLogType, string> = {
  workflow:  'Workflow',
  connector: 'Connector',
  module:    'Module',
  webhook:   'Webhook',
  approval:  'Approval',
  export:    'Export',
  report:    'Report',
  safety:    'Safety',
  error:     'Error',
  system:    'System',
};

export const LOG_SOURCE_LABEL: Record<AutomationLogSource, string> = {
  core:        'Core',
  n8n:         'n8n',
  module:      'Module',
  connector:   'Connector',
  webhook:     'Webhook',
  user_action: 'User Action',
  system:      'System',
};

export const LOG_SEVERITY_LABEL: Record<AutomationLogSeverity, string> = {
  info:    'Info',
  warning: 'Warning',
  error:   'Error',
  success: 'Success',
};

export const LOG_SEVERITY_COLOR: Record<AutomationLogSeverity, string> = {
  info:    '#60a5fa',
  warning: '#f59e0b',
  error:   '#f87171',
  success: '#34d399',
};

export const LOG_STATUS_LABEL: Record<AutomationLogStatus, string> = {
  recorded: 'Recorded',
  reviewed: 'Reviewed',
  ignored:  'Ignored',
  resolved: 'Resolved',
  failed:   'Failed',
};

export const LOG_STATUS_COLOR: Record<AutomationLogStatus, string> = {
  recorded: '#60a5fa',
  reviewed: '#818cf8',
  ignored:  '#71717a',
  resolved: '#34d399',
  failed:   '#f87171',
};

export const LOG_TYPES: AutomationLogType[] = [
  'workflow', 'connector', 'module', 'webhook', 'approval',
  'export', 'report', 'safety', 'error', 'system',
];

export const LOG_SOURCES: AutomationLogSource[] = [
  'core', 'n8n', 'module', 'connector', 'webhook', 'user_action', 'system',
];

export const LOG_SEVERITIES: AutomationLogSeverity[] = ['info', 'warning', 'error', 'success'];

export const LOG_STATUSES: AutomationLogStatus[] = [
  'recorded', 'reviewed', 'ignored', 'resolved', 'failed',
];

// ---------------------------------------------------------------------------
// Seed data — Phase 14 mock logs
// ---------------------------------------------------------------------------

const PAST = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

export const SEED_AUTOMATION_LOGS: LocalAutomationLog[] = [
  {
    id: 'log-001',
    log_type:   'system',
    source:     'system',
    severity:   'info',
    status:     'recorded',
    title:      'Phase 14 — Automation Logs Initialized',
    message:    'Automation Logs module initialized. Phase 14 local/mock mode. No real workflow execution. No real webhook retry. No external API calls. Production automation requires owner approval.',
    payload_preview: '{"phase":"14","mode":"local_mock","real_connectors":false,"real_webhooks":false}',
    related_connector_id:    null,
    related_module_id:       null,
    related_event_id:        null,
    related_client_id:       null,
    related_brand_id:        null,
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(120),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-002',
    log_type:   'module',
    source:     'module',
    severity:   'success',
    status:     'recorded',
    title:      'Content Generation Mock — Vị Cuốn Campaign Completed',
    message:    'Mock content generation job completed for campaign "Heo Quay Mùa Hè 2026". 7 content items generated (local mock). No real AI API called. Content ready for review.',
    payload_preview: '{"job_id":"mock-job-001","campaign":"Heo Quay Mùa Hè 2026","items_generated":7,"mode":"mock","source":"content_auto_module"}',
    related_connector_id:    'conn-n8n',
    related_module_id:       'mod-content-auto',
    related_event_id:        'evt-001',
    related_client_id:       'client-vi-cuon',
    related_brand_id:        'brand-vi-cuon',
    related_campaign_id:     'campaign-vi-cuon-he',
    related_content_item_id: null,
    created_at:  PAST(90),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-003',
    log_type:   'approval',
    source:     'core',
    severity:   'info',
    status:     'recorded',
    title:      'Approval Submitted — Cơm Tấm Bản Khói (3 items)',
    message:    'Approval request submitted for 3 content items from campaign "Ra Mắt Menu Mới Q3/2026". Assigned to manager review. Awaiting approval decision.',
    payload_preview: '{"approval_request_id":"apr-mock-002","campaign":"Ra Mắt Menu Mới Q3/2026","items_count":3,"priority":"normal","assigned_to_role":"manager"}',
    related_connector_id:    null,
    related_module_id:       null,
    related_event_id:        'evt-002',
    related_client_id:       'client-com-tam',
    related_brand_id:        'brand-com-tam',
    related_campaign_id:     'campaign-com-tam-menu',
    related_content_item_id: null,
    created_at:  PAST(60),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-004',
    log_type:   'connector',
    source:     'connector',
    severity:   'info',
    status:     'reviewed',
    title:      'Connector Health Check Simulated — n8n Webhook Backbone',
    message:    '[Mock] Health check simulated for connector "n8n Webhook Backbone". No real API call made. Connector status: not_configured. Phase 14 — local only.',
    payload_preview: '{"connector_id":"conn-n8n","connector_type":"n8n","status":"not_configured","mode":"mock","real_call":false}',
    related_connector_id:    'conn-n8n',
    related_module_id:       null,
    related_event_id:        null,
    related_client_id:       null,
    related_brand_id:        null,
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(55),
    reviewed_at: PAST(50),
    resolved_at: null,
  },
  {
    id: 'log-005',
    log_type:   'report',
    source:     'module',
    severity:   'info',
    status:     'recorded',
    title:      'Analytics Report Generated — Sofa F-1 Launch Campaign',
    message:    'Mock analytics intelligence report generated for "Sofa F-1 Launch Campaign". Period: 2026-06. 4 items approved, 3 pending. No real analytics data — sample metrics only.',
    payload_preview: '{"report_type":"campaign_progress","campaign":"Sofa F-1 Launch Campaign","period":"2026-06","items_approved":4,"items_pending":3,"source":"mock"}',
    related_connector_id:    'conn-n8n',
    related_module_id:       'mod-analytics',
    related_event_id:        'evt-003',
    related_client_id:       'client-forme',
    related_brand_id:        'brand-forme',
    related_campaign_id:     'campaign-forme-f1',
    related_content_item_id: null,
    created_at:  PAST(30),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-006',
    log_type:   'export',
    source:     'core',
    severity:   'success',
    status:     'resolved',
    title:      'Export Pack Generated — Campaign Summary',
    message:    'Export pack "Campaign Summary" generated successfully for internal review. Pack is in markdown format. No external delivery — manual copy only. Human approval required before sharing with client.',
    payload_preview: '{"pack_type":"campaign_summary","format":"markdown","status":"generated","auto_delivery":false}',
    related_connector_id:    null,
    related_module_id:       null,
    related_event_id:        null,
    related_client_id:       null,
    related_brand_id:        null,
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(20),
    reviewed_at: PAST(18),
    resolved_at: PAST(18),
  },
  {
    id: 'log-007',
    log_type:   'error',
    source:     'connector',
    severity:   'error',
    status:     'recorded',
    title:      'Connector Error — ComfyUI Creative Module Not Configured',
    message:    'Mock error: ComfyUI connector not configured. Creative asset auto module failed to start. Set COMFYUI_API_URL and COMFYUI_API_KEY in .env before production use. No real job failed — simulated error.',
    payload_preview: '{"connector_id":"conn-comfyui","module":"creative_asset_auto","error":"connector_not_configured","real_failure":false,"source":"mock"}',
    related_connector_id:    'conn-comfyui',
    related_module_id:       'mod-creative-asset',
    related_event_id:        'evt-005',
    related_client_id:       'client-vi-cuon',
    related_brand_id:        'brand-vi-cuon',
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(5),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-008',
    log_type:   'safety',
    source:     'system',
    severity:   'warning',
    status:     'recorded',
    title:      'Safety Gate — Publish Action Blocked (Phase 14)',
    message:    'Publish action is NOT available in Phase 14. Approved content remains in "approved" status. No auto-post. No real ads launched. No customer messaging sent. Production publishing requires Phase 15+ and owner approval.',
    payload_preview: '{"action_blocked":"publish","reason":"Phase 14 — no publish action","auto_post":false,"real_ads":false,"customer_messaging":false}',
    related_connector_id:    null,
    related_module_id:       null,
    related_event_id:        null,
    related_client_id:       null,
    related_brand_id:        null,
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(3),
    reviewed_at: null,
    resolved_at: null,
  },
  {
    id: 'log-009',
    log_type:   'webhook',
    source:     'webhook',
    severity:   'info',
    status:     'recorded',
    title:      'Webhook Ping Received — External Test',
    message:    'Mock webhook ping received from external test. No real webhook processed. No retry executed. Phase 14 — inbound webhook simulation only.',
    payload_preview: '{"source":"external_test","action":"ping","timestamp":"2026-06-08T10:00:00Z","message":"Mock webhook test payload","real_processed":false}',
    related_connector_id:    'conn-webhook',
    related_module_id:       null,
    related_event_id:        'evt-004',
    related_client_id:       null,
    related_brand_id:        null,
    related_campaign_id:     null,
    related_content_item_id: null,
    created_at:  PAST(2),
    reviewed_at: null,
    resolved_at: null,
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export interface AutomationLogStore {
  logs: LocalAutomationLog[];
}

const STORAGE_KEY = 'core_agency_automation_logs_v1';

export function loadAutomationLogData(): AutomationLogStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AutomationLogStore>;
      return { logs: parsed.logs ?? SEED_AUTOMATION_LOGS };
    }
  } catch (_) { /* ignore */ }
  return { logs: SEED_AUTOMATION_LOGS };
}

export function saveAutomationLogData(data: AutomationLogStore): void {
  try {
    const trimmed: AutomationLogStore = { logs: data.logs.slice(0, 200) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export function createAutomationLog(
  store: AutomationLogStore,
  data: Omit<LocalAutomationLog, 'id' | 'created_at' | 'reviewed_at' | 'resolved_at'>,
): AutomationLogStore {
  const now = new Date().toISOString();
  const log: LocalAutomationLog = {
    ...data,
    id:          generateId('log'),
    created_at:  now,
    reviewed_at: null,
    resolved_at: null,
  };
  return { logs: [log, ...store.logs] };
}

export function updateLogStatus(
  store: AutomationLogStore,
  logId: string,
  status: AutomationLogStatus,
): AutomationLogStore {
  const now = new Date().toISOString();
  return {
    logs: store.logs.map(l => {
      if (l.id !== logId) return l;
      return {
        ...l,
        status,
        reviewed_at: status === 'reviewed' ? now : l.reviewed_at,
        resolved_at: status === 'resolved' ? now : l.resolved_at,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Stats helper
// ---------------------------------------------------------------------------

export interface AutomationLogStats {
  total:      number;
  warnings:   number;
  errors:     number;
  unresolved: number;
  success:    number;
}

export function computeLogStats(logs: LocalAutomationLog[]): AutomationLogStats {
  return {
    total:      logs.length,
    warnings:   logs.filter(l => l.severity === 'warning').length,
    errors:     logs.filter(l => l.severity === 'error').length,
    unresolved: logs.filter(l => l.status === 'recorded' || l.status === 'failed').length,
    success:    logs.filter(l => l.severity === 'success').length,
  };
}
