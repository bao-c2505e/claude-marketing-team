// =============================================================================
// THE CORE AGENCY — Repository Interface Plan
// Phase 15 — Supabase Auth + Database Wiring Plan
//
// This file defines TypeScript interfaces for the future repository pattern.
// Phase 15: interfaces only (no Supabase calls).
// Phase 16: implement SupabaseXxxRepository classes.
// localStorage implementations live in coreData.ts (current default).
// =============================================================================

import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanJob,
  ContentPlanItem,
  PlanLengthDays,
  ContentApprovalRequest,
  ContentApprovalEvent,
  ContentApprovalComment,
  ApprovalPriority,
  AssetItem,
  LocalAssetCollection,
  LocalExportPack,
  Report,
  ReportMetric,
  LocalConnectorRegistryItem,
  LocalModuleRegistryItem,
  LocalModuleEvent,
  LocalAutomationLog,
} from '../../types/core';

import type {
  ClientFormData,
  BrandFormData,
  CampaignFormData,
  BriefFormData,
} from './coreData';

// ---------------------------------------------------------------------------
// A. Clients
// ---------------------------------------------------------------------------

export interface ClientRepository {
  list(): Promise<Client[]>;
  get(id: string): Promise<Client | null>;
  create(data: ClientFormData): Promise<Client>;
  update(id: string, patch: Partial<Client>): Promise<Client>;
  archive(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// B. Brands
// ---------------------------------------------------------------------------

export interface BrandRepository {
  list(clientId: string): Promise<Brand[]>;
  get(id: string, clientId: string): Promise<Brand | null>;
  create(data: BrandFormData): Promise<Brand>;
  update(id: string, clientId: string, patch: Partial<Brand>): Promise<Brand>;
  archive(id: string, clientId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// C. Campaigns
// ---------------------------------------------------------------------------

export interface CampaignListParams {
  clientId: string;
  brandId?: string;
}

export interface CampaignGetParams {
  clientId: string;
  campaignId: string;
  brandId?: string;
}

// clientId + brandId + campaignId all required — prevents unscoped mutations
export interface CampaignScopedParams {
  clientId: string;
  brandId: string;
  campaignId: string;
}

export interface CampaignRepository {
  list(params: CampaignListParams): Promise<Campaign[]>;
  get(params: CampaignGetParams): Promise<Campaign | null>;
  create(data: CampaignFormData): Promise<Campaign>;
  update(params: CampaignScopedParams, patch: Partial<Campaign>): Promise<Campaign>;
  archive(params: CampaignScopedParams): Promise<void>;
}

// ---------------------------------------------------------------------------
// D. Campaign Briefs
// ---------------------------------------------------------------------------

export interface BriefListParams {
  clientId: string;
  brandId: string;
  campaignId: string;
}

// clientId + brandId + campaignId + briefId all required — prevents unscoped mutations
export interface BriefScopedParams {
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
}

// Identity, tenant-scope (FK), and audit fields — never settable via update().
// Reassigning these would let a patch move a brief to another tenant/campaign
// or rewrite its creation/submission history.
const BRIEF_IMMUTABLE_PATCH_FIELDS = [
  'id', 'client_id', 'brand_id', 'campaign_id',
  'created_at', 'updated_at', 'submitted_by', 'submitted_at',
] as const;

export type BriefImmutableField = typeof BRIEF_IMMUTABLE_PATCH_FIELDS[number];

// Compile-time contract for BriefRepository.update() patches — excludes
// identity/tenant/audit fields so callers can't even construct an unsafe patch.
export type BriefUpdatePatch = Partial<Omit<CampaignBrief, BriefImmutableField>>;

// Codex Fix 2 (2026-06-10): runtime guard mirroring BriefUpdatePatch — strips
// id/tenant/audit fields from a patch before it reaches storage. Required in
// addition to the type because patch objects can be built dynamically
// (e.g. via `as Record<string, unknown>` or object spread) and bypass
// compile-time checks.
export function sanitizeBriefPatch(patch: Partial<CampaignBrief>): BriefUpdatePatch {
  const safe = { ...patch } as Record<string, unknown>;
  for (const field of BRIEF_IMMUTABLE_PATCH_FIELDS) {
    delete safe[field];
  }
  return safe as BriefUpdatePatch;
}

export interface BriefRepository {
  list(params: BriefListParams): Promise<CampaignBrief[]>;
  get(params: BriefScopedParams): Promise<CampaignBrief | null>;
  create(data: BriefFormData): Promise<CampaignBrief>;
  update(params: BriefScopedParams, patch: BriefUpdatePatch): Promise<CampaignBrief>;
}

// ---------------------------------------------------------------------------
// D2. Content Plan Generation (Phase 16C-1)
//
// Scoped repository for ContentPlanJob / ContentPlanItem (Phase 6 mock content
// generation). Distinct from the legacy GenerationJobRepository /
// ContentItemRepository in section E below, which target a different,
// incompatible Phase-15-planned schema and are unused by the app.
// ---------------------------------------------------------------------------

export interface GenerationListParams {
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
}

// clientId + brandId + campaignId + briefId + generationId all required —
// prevents unscoped get/update on a content plan job
export interface GenerationScopedParams {
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
  generationId: string;
}

// Tenant scope is supplied explicitly (not read from CampaignBrief.client_id /
// brand_id, which are typed `string | null`) so create() always has
// guaranteed non-null tenant IDs for the inserted job/item rows.
export interface GenerationCreateInput {
  brief: CampaignBrief;
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
  planLengthDays: PlanLengthDays;
  requestedBy: string | null;
}

export interface GenerationListResult {
  jobs: ContentPlanJob[];
  items: ContentPlanItem[];
}

export interface GenerationDetailResult {
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

// Identity, tenant-scope (FK), ownership, and audit fields — never settable
// via update(). Both snake_case (DB column names) and camelCase (TS/JS object
// aliases) variants are listed so a dynamically-built patch (e.g. spread from
// an untyped JSON payload) can't smuggle a reassignment through under an
// alternate casing. requested_by is the closest ContentPlanJob equivalent to
// "submitted_by": it records who triggered the generation and must not be
// reassigned by a patch. The archive_at/deleted_at/owner_id/tenant_id/
// organization_id/user_id variants are not current ContentPlanJob columns,
// but are blocked defensively in case future columns or generic patch sources
// introduce them.
const GENERATION_IMMUTABLE_PATCH_FIELDS = [
  'id',
  'client_id', 'clientId',
  'brand_id', 'brandId',
  'campaign_id', 'campaignId',
  'brief_id', 'briefId',
  'created_at', 'createdAt',
  'updated_at', 'updatedAt',
  'requested_by', 'requestedBy',
  'submitted_by', 'submittedBy',
  'submitted_at', 'submittedAt',
  'archived_at', 'archivedAt',
  'archive_at', 'archiveAt',
  'deleted_at', 'deletedAt',
  'owner_id', 'ownerId',
  'tenant_id', 'tenantId',
  'organization_id', 'organizationId',
  'user_id', 'userId',
] as const;

export type GenerationImmutableField = typeof GENERATION_IMMUTABLE_PATCH_FIELDS[number];

// Compile-time contract for GenerationRepository.update() patches — excludes
// identity/tenant/audit fields so callers can't even construct an unsafe patch.
export type GenerationUpdatePatch = Partial<Omit<ContentPlanJob, GenerationImmutableField>>;

// Runtime guard mirroring GenerationUpdatePatch — strips id/tenant/ownership/
// audit fields (snake_case + camelCase) from a patch before it reaches
// storage. Required in addition to the type because patch objects can be
// built dynamically (e.g. spread from an untyped payload) and bypass
// compile-time checks.
export function sanitizeGenerationPatch(patch: Partial<ContentPlanJob> & Record<string, unknown>): GenerationUpdatePatch {
  const safe = { ...patch } as Record<string, unknown>;
  for (const field of GENERATION_IMMUTABLE_PATCH_FIELDS) {
    delete safe[field];
  }
  return safe as GenerationUpdatePatch;
}

export interface GenerationRepository {
  list(params: GenerationListParams): Promise<GenerationListResult>;
  get(params: GenerationScopedParams): Promise<GenerationDetailResult | null>;
  create(data: GenerationCreateInput): Promise<GenerationDetailResult>;
  update(params: GenerationScopedParams, patch: GenerationUpdatePatch): Promise<ContentPlanJob>;
  archive(params: GenerationScopedParams): Promise<void>;
}

// ---------------------------------------------------------------------------
// E. Generation Jobs + Content Items
// ---------------------------------------------------------------------------

export interface GenerationJobRepository {
  list(campaignId?: string): Promise<ContentPlanJob[]>;
  get(id: string): Promise<ContentPlanJob | null>;
  create(job: Omit<ContentPlanJob, 'id' | 'created_at' | 'updated_at'>): Promise<ContentPlanJob>;
  updateStatus(id: string, status: ContentPlanJob['status'], errorMessage?: string): Promise<void>;
}

export interface ContentItemRepository {
  list(jobId?: string, campaignId?: string): Promise<ContentPlanItem[]>;
  get(id: string): Promise<ContentPlanItem | null>;
  createBatch(items: Array<Omit<ContentPlanItem, 'id' | 'created_at' | 'updated_at'>>): Promise<ContentPlanItem[]>;
  update(id: string, patch: Partial<ContentPlanItem>): Promise<ContentPlanItem>;
}

// ---------------------------------------------------------------------------
// F. Approval Workflow (Phase 16C-2)
//
// Scoped repository for ContentApprovalRequest / ContentApprovalEvent /
// ContentApprovalComment — the Phase 8 approval workflow for content_plan_items
// (Phase 16C-1). Every approval request belongs to exactly one
// content_plan_items row, which belongs to exactly one content_plan_jobs row,
// so every operation requires the full client/brand/campaign/brief/generation
// chain — never just an approvalId. Replaces the unscoped
// ApprovalRequestRepository / ApprovalEventRepository / ApprovalCommentRepository
// placeholders that previously lived in this section (unused dead code).
// ---------------------------------------------------------------------------

export interface ApprovalListParams {
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
  generationId: string;
}

// clientId + brandId + campaignId + briefId + generationId + approvalId all
// required — prevents unscoped get/update/approve/reject/comment by
// approvalId alone.
export interface ApprovalScopedParams extends ApprovalListParams {
  approvalId: string;
}

export interface ApprovalListResult {
  requests: ContentApprovalRequest[];
  events: ContentApprovalEvent[];
  comments: ContentApprovalComment[];
}

export interface ApprovalDetailResult {
  request: ContentApprovalRequest;
  events: ContentApprovalEvent[];
  comments: ContentApprovalComment[];
}

// Tenant scope is supplied explicitly (not read from ContentPlanItem.client_id /
// brand_id, which are typed `string | null`) so create() always has
// guaranteed non-null tenant IDs for the inserted request/event rows.
export interface ApprovalCreateInput {
  contentItem: ContentPlanItem;
  clientId: string;
  brandId: string;
  campaignId: string;
  briefId: string;
  generationId: string;
  actorLabel: string;
  priority?: ApprovalPriority;
  dueDate?: string | null;
}

export interface ApprovalSubmitResult {
  request: ContentApprovalRequest;
  event: ContentApprovalEvent;
  updatedItem: ContentPlanItem;
}

export interface ApprovalActionResult {
  request: ContentApprovalRequest;
  event: ContentApprovalEvent;
  updatedItem: ContentPlanItem;
}

export interface ApprovalCommentResult {
  comment: ContentApprovalComment;
  event: ContentApprovalEvent;
}

// approve/reject/needs_revision/archive — each is a scoped status transition
// on an existing approval request, never a free-form patch. 'cancelled' is
// the closest equivalent to "archive" for ContentApprovalStatus, which has no
// separate archived state.
export type ResolvingApprovalAction = 'approved' | 'rejected' | 'revision_requested' | 'cancelled';

export interface ApprovalRepository {
  list(params: ApprovalListParams): Promise<ApprovalListResult>;
  get(params: ApprovalScopedParams): Promise<ApprovalDetailResult | null>;
  create(data: ApprovalCreateInput): Promise<ApprovalSubmitResult>;
  executeAction(params: ApprovalScopedParams, action: ResolvingApprovalAction, actorLabel: string, comment?: string): Promise<ApprovalActionResult>;
  addComment(params: ApprovalScopedParams, actorLabel: string, commentText: string, isInternal?: boolean): Promise<ApprovalCommentResult>;
}

// ---------------------------------------------------------------------------
// G. Asset Library (Phase 16D)
//
// Scoped repository for AssetItem / LocalAssetCollection (Phase 10 Asset
// Library). Unlike Generation/Approval, an asset's tenant chain is partial:
// every asset carries client_id + brand_id, but campaign_id/brief_id/
// generation_job_id/content_item_id are only set when the asset is actually
// scoped that deep (e.g. a brand-level logo has campaign_id..content_item_id
// all null). Every operation is validated against whichever of these ids the
// asset actually carries — never by assetId alone. Replaces the unscoped
// AssetRepository / AssetCollectionRepository placeholders that previously
// lived in this section (unused dead code).
// ---------------------------------------------------------------------------

// client_id/brand_id mirror AssetItem's own (string | null) typing — an asset
// with no client/brand scope (client_id/brand_id both null) can never be
// routed to Supabase (its hierarchy can't be validated against
// clients/brands), so it always falls back to localStorage. campaign_id/
// brief_id/generation_job_id/content_item_id/asset_collection_id are optional
// and only present when the asset is scoped that deep / belongs to a
// collection.
export interface AssetListParams {
  clientId: string | null;
  brandId: string | null;
  campaignId?: string | null;
  briefId?: string | null;
  generationId?: string | null;
  contentItemId?: string | null;
  assetCollectionId?: string | null;
}

// Codex Fix Round (2026-06-11): every field is required (though nullable) —
// unlike AssetListParams (where an absent key means "don't filter on this
// level" for list()), get/update/archive target ONE existing asset and must
// state its FULL applicable scope, including assetCollectionId. A caller
// can no longer omit a hierarchy level and have it silently match any value;
// it must explicitly pass `null` for levels the asset doesn't belong to.
// Adds the asset's own id — prevents unscoped get/update/archive by assetId
// alone.
export interface AssetScopedParams {
  clientId: string | null;
  brandId: string | null;
  campaignId: string | null;
  briefId: string | null;
  generationId: string | null;
  contentItemId: string | null;
  assetCollectionId: string | null;
  assetId: string;
}

// Tenant scope is supplied explicitly (verified by the caller against the
// selected client/brand/campaign, or against an existing asset's own scope
// for update/archive) — never trusted from a raw form value alone.
export interface AssetCreateInput {
  clientId: string | null;
  brandId: string | null;
  campaignId: string | null;
  briefId: string | null;
  generationId: string | null;
  contentItemId: string | null;
  data: Omit<
    AssetItem,
    'id' | 'created_at' | 'updated_at'
    | 'client_id' | 'brand_id' | 'campaign_id' | 'brief_id' | 'generation_job_id' | 'content_item_id'
  >;
}

// Identity, tenant-scope (FK), and audit/ownership fields — never settable
// via update(). Both snake_case (DB column names) and camelCase (TS/JS object
// aliases) variants are listed so a dynamically-built patch can't smuggle a
// reassignment through under an alternate casing. asset_collection_id is NOT
// listed — moving an asset between collections within the same brand is a
// normal edit. approval_request_id/uploaded_by/owner_id/etc. are not current
// AssetItem columns, but are blocked defensively in case future columns or
// generic patch sources introduce them.
const ASSET_IMMUTABLE_PATCH_FIELDS = [
  'id',
  'client_id', 'clientId',
  'brand_id', 'brandId',
  'campaign_id', 'campaignId',
  'brief_id', 'briefId',
  'generation_job_id', 'generationJobId', 'generationId',
  'content_item_id', 'contentItemId',
  'created_at', 'createdAt',
  'updated_at', 'updatedAt',
  'created_by', 'createdBy',
  'uploaded_by', 'uploadedBy',
  'approval_request_id', 'approvalRequestId',
  'archived_at', 'archivedAt',
  'archive_at', 'archiveAt',
  'deleted_at', 'deletedAt',
  'owner_id', 'ownerId',
  'tenant_id', 'tenantId',
  'organization_id', 'organizationId',
  'user_id', 'userId',
] as const;

export type AssetImmutableField = typeof ASSET_IMMUTABLE_PATCH_FIELDS[number];

export type AssetUpdatePatch = Partial<Omit<AssetItem, AssetImmutableField>>;

export function sanitizeAssetPatch(patch: Partial<AssetItem> & Record<string, unknown>): AssetUpdatePatch {
  const safe = { ...patch } as Record<string, unknown>;
  for (const field of ASSET_IMMUTABLE_PATCH_FIELDS) {
    delete safe[field];
  }
  return safe as AssetUpdatePatch;
}

export interface AssetRepository {
  list(params: AssetListParams): Promise<AssetItem[]>;
  get(params: AssetScopedParams): Promise<AssetItem | null>;
  create(data: AssetCreateInput): Promise<AssetItem>;
  update(params: AssetScopedParams, patch: AssetUpdatePatch): Promise<AssetItem>;
  archive(params: AssetScopedParams): Promise<void>;
}

// ---------------------------------------------------------------------------
// G2. Asset Collections (Phase 16D)
//
// LocalAssetCollection is brand-level (client_id + brand_id, optional
// campaign_id) — no brief/generation/content_item scope.
// ---------------------------------------------------------------------------

export interface AssetCollectionListParams {
  clientId: string | null;
  brandId: string | null;
  campaignId?: string | null;
}

export interface AssetCollectionCreateInput {
  clientId: string | null;
  brandId: string | null;
  campaignId: string | null;
  name: string;
  description: string | null;
  createdBy: string | null;
}

export interface AssetCollectionRepository {
  list(params: AssetCollectionListParams): Promise<LocalAssetCollection[]>;
  create(data: AssetCollectionCreateInput): Promise<LocalAssetCollection>;
}

// ---------------------------------------------------------------------------
// G3. Reports + Report Metrics (schema: reports, report_metrics)
// ---------------------------------------------------------------------------

export interface ReportRepository {
  list(campaignId?: string): Promise<Report[]>;
  get(id: string): Promise<Report | null>;
  create(data: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<Report>;
  update(id: string, patch: Partial<Report>): Promise<Report>;
}

export interface ReportMetricRepository {
  listForReport(reportId: string): Promise<ReportMetric[]>;
  create(metric: Omit<ReportMetric, 'id' | 'created_at'>): Promise<ReportMetric>;
  createBatch(metrics: Array<Omit<ReportMetric, 'id' | 'created_at'>>): Promise<ReportMetric[]>;
}

// ---------------------------------------------------------------------------
// H. Export Packs (local only — no Supabase table in schema V1)
// ---------------------------------------------------------------------------

export interface ExportPackRepository {
  list(): Promise<LocalExportPack[]>;
  save(pack: LocalExportPack): Promise<void>;
  clear(): Promise<void>;
}

// ---------------------------------------------------------------------------
// I. Connector Registry
// ---------------------------------------------------------------------------

export interface ConnectorRepository {
  list(): Promise<LocalConnectorRegistryItem[]>;
  get(id: string): Promise<LocalConnectorRegistryItem | null>;
  update(id: string, patch: Partial<LocalConnectorRegistryItem>): Promise<LocalConnectorRegistryItem>;
}

export interface ModuleRepository {
  list(): Promise<LocalModuleRegistryItem[]>;
  update(id: string, patch: Partial<LocalModuleRegistryItem>): Promise<LocalModuleRegistryItem>;
}

export interface ModuleEventRepository {
  list(): Promise<LocalModuleEvent[]>;
  create(event: Omit<LocalModuleEvent, 'id' | 'created_at'>): Promise<LocalModuleEvent>;
  update(id: string, patch: Partial<LocalModuleEvent>): Promise<LocalModuleEvent>;
}

// ---------------------------------------------------------------------------
// J. Automation Logs
// ---------------------------------------------------------------------------

export interface AutomationLogRepository {
  list(): Promise<LocalAutomationLog[]>;
  create(log: Omit<LocalAutomationLog, 'id' | 'created_at' | 'reviewed_at' | 'resolved_at'>): Promise<LocalAutomationLog>;
  update(id: string, patch: Partial<LocalAutomationLog>): Promise<LocalAutomationLog>;
}

// ---------------------------------------------------------------------------
// Repository bundle — injected into app context in Phase 16
// ---------------------------------------------------------------------------

export interface CoreRepositories {
  clients:          ClientRepository;
  brands:           BrandRepository;
  campaigns:        CampaignRepository;
  briefs:           BriefRepository;
  generationJobs:   GenerationJobRepository;
  contentItems:     ContentItemRepository;
  approvals:        ApprovalRepository;
  assets:           AssetRepository;
  assetCollections: AssetCollectionRepository;
  reports:          ReportRepository;
  reportMetrics:    ReportMetricRepository;
  exportPacks:      ExportPackRepository;
  connectors:       ConnectorRepository;
  modules:          ModuleRepository;
  moduleEvents:     ModuleEventRepository;
  automationLogs:   AutomationLogRepository;
}

// ---------------------------------------------------------------------------
// Phase 16 wiring note:
//
// When isSupabaseConfigured:
//   import { createSupabaseRepositories } from './supabaseRepositories'; // Phase 16
//   const repos = createSupabaseRepositories(supabase!);
//
// When not configured (fallback):
//   import { createLocalStorageRepositories } from './localStorageRepositories'; // Phase 16
//   const repos = createLocalStorageRepositories();
//
// Current state (Phase 15): localStorage functions in coreData.ts,
// automationLogs.ts, connectorRegistry.ts are used directly.
// Phase 16 will wrap these in LocalStorageXxxRepository classes.
// ---------------------------------------------------------------------------
