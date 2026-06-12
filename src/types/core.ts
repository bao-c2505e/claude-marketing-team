// =============================================================================
// THE CORE AGENCY — Core TypeScript Types
// Generated from Database Schema V1 (Phase 2 — 2026-06-07)
//
// These types mirror the Supabase Postgres schema.
// Phase 3+ will use the Supabase-generated types (via `supabase gen types`).
// =============================================================================

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

export type ContentStatus =
  | 'draft'
  | 'generated'
  | 'needs_review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'failed';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'withdrawn';

export type ResourceStatus = 'active' | 'inactive' | 'archived';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type BriefStatus =
  | 'draft'
  | 'ready_for_generation'
  | 'needs_revision'
  | 'approved_for_generation'
  | 'archived';

// Phase 6: Content Generation
export type ContentPlanJobStatus = 'draft' | 'queued' | 'generating' | 'completed' | 'failed' | 'archived';

// Phase 8: Approval Workflow
export type ContentApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'cancelled';

export type ApprovalPriority = 'low' | 'normal' | 'high';

export type ApprovalActionType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'commented'
  | 'cancelled';

export interface ContentApprovalRequest {
  id: string;
  content_item_id: string;
  generation_job_id: string | null;
  brief_id: string | null;
  campaign_id: string;
  brand_id: string | null;
  client_id: string | null;
  title: string;
  status: ContentApprovalStatus;
  priority: ApprovalPriority;
  requested_by: string;
  assigned_to_role: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ContentApprovalEvent {
  id: string;
  approval_request_id: string;
  content_item_id: string;
  action: ApprovalActionType;
  actor_label: string;
  comment: string | null;
  previous_status: ContentApprovalStatus | null;
  new_status: ContentApprovalStatus | null;
  created_at: string;
}

export interface ContentApprovalComment {
  id: string;
  approval_request_id: string;
  content_item_id: string;
  actor_label: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}
export type GenerationMode = 'mock' | 'ai_ready' | 'external_module';
export type PlanLengthDays = 7 | 15 | 30;
export type ContentItemStatus6 = 'generated' | 'needs_review' | 'revision_requested' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'archived';

export interface ContentPlanJob {
  id: string;
  brief_id: string;
  campaign_id: string;
  brand_id: string | null;
  client_id: string | null;
  plan_length_days: PlanLengthDays;
  generation_mode: GenerationMode;
  status: ContentPlanJobStatus;
  requested_by: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ContentPlanItem {
  id: string;
  generation_job_id: string;
  brief_id: string;
  campaign_id: string;
  brand_id: string | null;
  client_id: string | null;
  day_number: number;
  planned_date: string | null;
  channel: string;
  content_type: string;
  pillar: string;
  angle: string;
  hook: string;
  caption: string;
  visual_brief: string;
  cta: string;
  hashtags: string;
  status: ContentItemStatus6;
  created_at: string;
  updated_at: string;
  // Phase 7 — Calendar metadata (all optional for backward compat)
  scheduled_time?: string | null;
  publish_note?: string | null;
  owner_note?: string | null;
  last_moved_at?: string | null;
}

export type CampaignType = '7_day' | '15_day' | '30_day' | 'custom';

export type ModuleType =
  | 'copywriter'
  | 'designer'
  | 'video_scripter'
  | 'ads_manager'
  | 'reporter'
  | 'custom';

export type ConnectorType = 'n8n_workflow' | 'module' | 'webhook' | 'api';

export type TriggerSource = 'manual' | 'n8n' | 'api' | 'system';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'google' | 'youtube' | 'other';

export type ContentType =
  | 'caption'
  | 'headline'
  | 'video_script'
  | 'design_brief'
  | 'ad_copy'
  | 'report'
  | 'hook'
  | 'cta'
  | 'slogan'
  | 'other';

export type RoleName = 'owner' | 'manager' | 'client' | 'viewer';

// ---------------------------------------------------------------------------
// A. IDENTITY / ACCESS
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  resource_type: string | null;
  resource_id: string | null;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// B. BUSINESS OBJECTS
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  slug: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ResourceStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  industry: string | null;
  hero_product: string | null;
  tone_of_voice: string | null;
  target_audience: string | null;
  primary_channels: string[] | null;
  brand_colors: Record<string, string> | null;
  logo_url: string | null;
  status: ResourceStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  client_id: string;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  budget_estimate: number | null;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignBrief {
  id: string;
  campaign_id: string;
  // denormalised refs (Phase 5+)
  brand_id: string | null;
  client_id: string | null;
  brand_name: string;
  hero_product: string | null;
  industry: string | null;
  // Phase 5 fields — all nullable for backward compat
  brief_title: string | null;
  campaign_goal: string | null;
  product_focus: string | null;
  offer: string | null;
  tone_of_voice: string | null;
  tone: string | null;
  target_audience: string | null;
  campaign_goals: string[] | null;
  key_messages: string[] | null;
  channels: string[] | null;
  content_pillars: string[] | null;
  must_include: string | null;
  must_avoid: string | null;
  competitors: string | null;
  reference_links: string | null;
  budget_note: string | null;
  timeline_note: string | null;
  approval_requirements: string | null;
  duration_days: number | null;
  additional_notes: string | null;
  status: BriefStatus | null;
  submitted_by: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// C. CONTENT PRODUCTION
// ---------------------------------------------------------------------------

export interface GenerationJob {
  id: string;
  campaign_id: string;
  module: ModuleType;
  status: JobStatus;
  triggered_by: string | null;
  trigger_source: TriggerSource;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  n8n_execution_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItemMetadata {
  platform?: Platform;
  format?: string;
  duration?: string;
  day_number?: number;
  dimensions?: string;
  [key: string]: unknown;
}

export interface ContentItem {
  id: string;
  campaign_id: string;
  generation_job_id: string | null;
  content_type: ContentType;
  title: string | null;
  body: string;
  metadata: ContentItemMetadata | null;
  status: ContentStatus;
  generated_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_by: string | null;
  approved_by: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendarItem {
  id: string;
  campaign_id: string;
  content_item_id: string | null;
  scheduled_date: string | null;
  day_number: number | null;
  platform: Platform;
  content_type: ContentType;
  title: string | null;
  description: string | null;
  status: ContentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeBrief {
  id: string;
  campaign_id: string;
  content_item_id: string | null;
  module: ModuleType;
  instructions: string;
  dimensions: string | null;
  format: string | null;
  references: Record<string, unknown> | null;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdBrief {
  id: string;
  campaign_id: string;
  platform: Platform;
  objective: string;
  budget_estimate: number | null;
  target_audience_description: string | null;
  ad_formats: string[] | null;
  key_message: string | null;
  cta: string | null;
  status: ContentStatus;
  approved_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// D. APPROVAL WORKFLOW
// ---------------------------------------------------------------------------

export type ApprovalResourceType =
  | 'content_item'
  | 'ad_brief'
  | 'creative_brief'
  | 'campaign'
  | 'export_pack';

export interface ApprovalRequest {
  id: string;
  resource_type: ApprovalResourceType;
  resource_id: string;
  campaign_id: string | null;
  title: string;
  status: ApprovalStatus;
  requested_by: string;
  assigned_to: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export type ApprovalEventType =
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'withdrawn'
  | 'reassigned'
  | 'comment_added';

export interface ApprovalEvent {
  id: string;
  approval_request_id: string;
  event_type: ApprovalEventType;
  actor_id: string;
  previous_status: ApprovalStatus | null;
  new_status: ApprovalStatus | null;
  notes: string | null;
  created_at: string;
}

export interface ApprovalComment {
  id: string;
  approval_request_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// E. ASSETS / REPORTS
// ---------------------------------------------------------------------------

export interface AssetCollection {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  brand_id: string;
  campaign_id: string | null;
  collection_id: string | null;
  name: string;
  file_type: string;
  mime_type: string | null;
  file_url: string;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
  metadata: Record<string, unknown> | null;
  status: ContentStatus;
  approval_request_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  campaign_id: string;
  generation_job_id: string | null;
  report_type: string;
  title: string;
  body: string | null;
  period_start: string | null;
  period_end: string | null;
  status: ContentStatus;
  generated_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportMetric {
  id: string;
  report_id: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: string | null;
  platform: string | null;
  date_recorded: string | null;
  is_estimated: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// F. AUTOMATION / MODULES
// ---------------------------------------------------------------------------

export interface ConnectorRegistry {
  id: string;
  name: string;
  type: ConnectorType;
  description: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  config: Record<string, unknown> | null;
  registered_by: string | null;
  registered_at: string;
  updated_at: string;
}

export interface ModuleRegistry {
  id: string;
  name: string;
  module_type: ModuleType;
  version: string;
  description: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  registered_at: string;
  updated_at: string;
}

export interface ModuleEvent {
  id: string;
  module_id: string | null;
  generation_job_id: string | null;
  campaign_id: string | null;
  event_type: string;
  status: string;
  payload_summary: string | null;
  created_at: string;
}

export interface WebhookCallback {
  id: string;
  module_event_id: string | null;
  generation_job_id: string | null;
  source: string;
  http_method: string;
  endpoint_path: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: Record<string, unknown> | null;
  is_processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  received_at: string;
}

export interface AutomationLog {
  id: string;
  log_level: LogLevel;
  source: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// G. SAFETY / GOVERNANCE
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// PHASE 10 — ASSET LIBRARY
// ---------------------------------------------------------------------------

export type AssetType =
  | 'image'
  | 'video'
  | 'design'
  | 'document'
  | 'logo'
  | 'raw_footage'
  | 'reference'
  | 'other';

export type AssetSourceType =
  | 'local_placeholder'
  | 'external_url'
  | 'storage_ready'
  | 'generated_placeholder';

export type AssetApprovalStatus =
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface AssetItem {
  id: string;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  brief_id: string | null;
  generation_job_id: string | null;
  content_item_id: string | null;
  asset_collection_id: string | null;
  name: string;
  asset_type: AssetType;
  source_type: AssetSourceType;
  url: string | null;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size_note: string | null;
  mime_type: string | null;
  tags: string[];
  usage_rights_note: string | null;
  approval_status: AssetApprovalStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalAssetCollection {
  id: string;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// PHASE 11 — REPORT MODULE
// ---------------------------------------------------------------------------

export type LocalReportType =
  | 'internal_summary'
  | 'client_summary'
  | 'campaign_progress'
  | 'content_status'
  | 'approval_status'
  | 'asset_status';

export type LocalReportStatus = 'draft' | 'generated' | 'approved' | 'archived';

export interface ReportMetrics {
  total_briefs: number;
  total_generation_jobs: number;
  total_content_items: number;
  content_by_status: Record<string, number>;
  content_by_channel: Record<string, number>;
  approval_requests_total: number;
  approval_by_status: Record<string, number>;
  pending_approval_count: number;
  approved_content_count: number;
  revision_requested_count: number;
  rejected_count: number;
  asset_count: number;
  approved_asset_count: number;
  campaign_progress_percent: number;
}

export interface LocalReport {
  id: string;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  report_type: LocalReportType;
  title: string;
  period_start: string | null;
  period_end: string | null;
  summary: string;
  metrics: ReportMetrics;
  client_summary_text: string;
  status: LocalReportStatus;
  generated_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// COMPOSITE / VIEW TYPES (used by UI)
// ---------------------------------------------------------------------------

export interface BrandWithClient extends Brand {
  client: Client;
}

export interface CampaignWithBrand extends Campaign {
  brand: Brand;
  client: Client;
  brief?: CampaignBrief;
}

export interface ContentItemWithApproval extends ContentItem {
  approval_request?: ApprovalRequest;
}

export interface ApprovalRequestWithEvents extends ApprovalRequest {
  events: ApprovalEvent[];
  comments: ApprovalComment[];
}

export interface ModuleEventWithCallback extends ModuleEvent {
  webhook_callback?: WebhookCallback;
  module?: ModuleRegistry;
}

// ---------------------------------------------------------------------------
// PHASE 12 — EXPORT PACK
// ---------------------------------------------------------------------------

export type ExportPackType =
  | 'campaign_summary'
  | 'content_calendar'
  | 'approved_content'
  | 'client_report'
  | 'asset_checklist'
  | 'full_campaign_pack';

export type ExportPackFormat = 'markdown' | 'plain_text' | 'json_preview';

export type ExportPackStatus = 'draft' | 'generated' | 'copied' | 'archived';

export interface LocalExportPack {
  id: string;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  export_type: ExportPackType;
  title: string;
  format: ExportPackFormat;
  status: ExportPackStatus;
  content: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// PHASE 13 — CONNECTOR REGISTRY + MODULE EVENT INBOX
// ---------------------------------------------------------------------------

export type LocalConnectorType =
  | 'n8n'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'canva'
  | 'meta_ads'
  | 'google_drive'
  | 'google_sheets'
  | 'comfyui'
  | 'storage'
  | 'webhook'
  | 'other';

export type LocalConnectorStatus =
  | 'not_configured'
  | 'configured'
  | 'connected'
  | 'error'
  | 'disabled';

export type LocalConnectorMode = 'mock' | 'sandbox' | 'production';

export interface LocalConnectorRegistryItem {
  id: string;
  name: string;
  connector_type: LocalConnectorType;
  status: LocalConnectorStatus;
  mode: LocalConnectorMode;
  description: string | null;
  required_env_keys: string[];
  last_checked_at: string | null;
  health_note: string | null;
  safety_note: string | null;
  created_at: string;
  updated_at: string;
}

export type LocalModuleName =
  | 'content_auto'
  | 'creative_asset_auto'
  | 'ads_pack_auto'
  | 'crm_followup_auto'
  | 'comment_inbox_reply_assistant'
  | 'approval_publishing_automation'
  | 'analytics_intelligence'
  | 'competitor_intelligence'
  | 'website_landing_intelligence'
  | 'comfyui_creative_module'
  | 'other';

export type LocalModuleStatus =
  | 'planned'
  | 'mock_ready'
  | 'sandbox_ready'
  | 'connected'
  | 'disabled'
  | 'error';

export interface LocalModuleRegistryItem {
  id: string;
  module_name: LocalModuleName;
  module_type: string;
  status: LocalModuleStatus;
  description: string | null;
  input_contract_name: string | null;
  output_contract_name: string | null;
  callback_endpoint_note: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export type LocalModuleEventType =
  | 'generation_requested'
  | 'generation_completed'
  | 'creative_requested'
  | 'creative_completed'
  | 'ads_pack_requested'
  | 'ads_pack_completed'
  | 'approval_submitted'
  | 'approval_completed'
  | 'report_generated'
  | 'webhook_received'
  | 'error'
  | 'other';

export type ModuleEventDirection = 'inbound' | 'outbound';

export type LocalModuleEventStatus =
  | 'received'
  | 'processed'
  | 'needs_review'
  | 'failed'
  | 'ignored';

export interface LocalModuleEvent {
  id: string;
  module_id: string | null;
  connector_id: string | null;
  event_type: LocalModuleEventType;
  direction: ModuleEventDirection;
  status: LocalModuleEventStatus;
  related_client_id: string | null;
  related_brand_id: string | null;
  related_campaign_id: string | null;
  related_content_item_id: string | null;
  payload_preview: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// PHASE 14 — AUTOMATION LOGS
// ---------------------------------------------------------------------------

export type AutomationLogType =
  | 'workflow'
  | 'connector'
  | 'module'
  | 'webhook'
  | 'approval'
  | 'export'
  | 'report'
  | 'safety'
  | 'error'
  | 'system';

export type AutomationLogSource =
  | 'core'
  | 'n8n'
  | 'module'
  | 'connector'
  | 'webhook'
  | 'user_action'
  | 'system';

export type AutomationLogSeverity = 'info' | 'warning' | 'error' | 'success';

export type AutomationLogStatus =
  | 'recorded'
  | 'reviewed'
  | 'ignored'
  | 'resolved'
  | 'failed';

export interface LocalAutomationLog {
  id: string;
  log_type: AutomationLogType;
  source: AutomationLogSource;
  severity: AutomationLogSeverity;
  status: AutomationLogStatus;
  title: string;
  message: string;
  payload_preview: string | null;
  related_connector_id: string | null;
  related_module_id: string | null;
  related_event_id: string | null;
  related_client_id: string | null;
  related_brand_id: string | null;
  related_campaign_id: string | null;
  related_content_item_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
}
