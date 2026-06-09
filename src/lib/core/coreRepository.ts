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
  ContentApprovalRequest,
  ContentApprovalEvent,
  ContentApprovalComment,
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
  list(clientId?: string): Promise<Brand[]>;
  get(id: string): Promise<Brand | null>;
  create(data: BrandFormData): Promise<Brand>;
  update(id: string, patch: Partial<Brand>): Promise<Brand>;
  archive(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// C. Campaigns
// ---------------------------------------------------------------------------

export interface CampaignRepository {
  list(clientId?: string, brandId?: string): Promise<Campaign[]>;
  get(id: string): Promise<Campaign | null>;
  create(data: CampaignFormData): Promise<Campaign>;
  update(id: string, patch: Partial<Campaign>): Promise<Campaign>;
}

// ---------------------------------------------------------------------------
// D. Campaign Briefs
// ---------------------------------------------------------------------------

export interface BriefRepository {
  list(campaignId?: string): Promise<CampaignBrief[]>;
  get(id: string): Promise<CampaignBrief | null>;
  create(data: BriefFormData): Promise<CampaignBrief>;
  update(id: string, patch: Partial<CampaignBrief>): Promise<CampaignBrief>;
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
// F. Approval Workflow
// ---------------------------------------------------------------------------

export interface ApprovalRequestRepository {
  list(campaignId?: string): Promise<ContentApprovalRequest[]>;
  get(id: string): Promise<ContentApprovalRequest | null>;
  create(data: Omit<ContentApprovalRequest, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>): Promise<ContentApprovalRequest>;
  update(id: string, patch: Partial<ContentApprovalRequest>): Promise<ContentApprovalRequest>;
}

export interface ApprovalEventRepository {
  listForRequest(requestId: string): Promise<ContentApprovalEvent[]>;
  create(event: Omit<ContentApprovalEvent, 'id' | 'created_at'>): Promise<ContentApprovalEvent>;
}

export interface ApprovalCommentRepository {
  listForRequest(requestId: string): Promise<ContentApprovalComment[]>;
  create(comment: Omit<ContentApprovalComment, 'id' | 'created_at'>): Promise<ContentApprovalComment>;
}

// ---------------------------------------------------------------------------
// G. Asset Library
// ---------------------------------------------------------------------------

export interface AssetRepository {
  list(brandId?: string, campaignId?: string): Promise<AssetItem[]>;
  get(id: string): Promise<AssetItem | null>;
  create(data: Omit<AssetItem, 'id' | 'created_at' | 'updated_at'>): Promise<AssetItem>;
  update(id: string, patch: Partial<AssetItem>): Promise<AssetItem>;
}

export interface AssetCollectionRepository {
  list(brandId?: string): Promise<LocalAssetCollection[]>;
  create(data: Omit<LocalAssetCollection, 'id' | 'created_at' | 'updated_at'>): Promise<LocalAssetCollection>;
}

// ---------------------------------------------------------------------------
// G2. Reports + Report Metrics (schema: reports, report_metrics)
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
  approvalRequests: ApprovalRequestRepository;
  approvalEvents:   ApprovalEventRepository;
  approvalComments: ApprovalCommentRepository;
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
