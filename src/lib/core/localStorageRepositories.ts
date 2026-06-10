// =============================================================================
// THE CORE AGENCY — localStorage Repository Implementations
// Phase 16A — Supabase CRUD Wiring: Clients + Brands
//
// Fallback: used when Supabase is not configured (no env vars / demo mode).
// Wraps existing coreData.ts helpers into the ClientRepository / BrandRepository
// interfaces defined in coreRepository.ts.
//
// These implementations are the default — Demo Sign In + localhost always lands here.
// =============================================================================

import type { Client, Brand, Campaign, CampaignBrief, ContentPlanJob, ContentPlanItem } from '../../types/core';
import type { ClientRepository, BrandRepository, CampaignRepository, CampaignListParams, CampaignGetParams, CampaignScopedParams, BriefRepository, BriefListParams, BriefScopedParams, BriefUpdatePatch, GenerationRepository, GenerationListParams, GenerationScopedParams, GenerationCreateInput, GenerationListResult, GenerationDetailResult, GenerationUpdatePatch } from './coreRepository';
import { sanitizeBriefPatch, sanitizeGenerationPatch } from './coreRepository';
import type { ClientFormData, BrandFormData, CampaignFormData, BriefFormData } from './coreData';
import { loadCoreData, saveCoreData, generateId, calculateCampaignDurationDays, parseLines, parseComma, loadGenerationData, saveGenerationData } from './coreData';
import { generateContentPlan } from './contentGenerator';

// ---------------------------------------------------------------------------
// A. LocalStorageClientRepository
// ---------------------------------------------------------------------------

export class LocalStorageClientRepository implements ClientRepository {
  async list(): Promise<Client[]> {
    return loadCoreData().clients;
  }

  async get(id: string): Promise<Client | null> {
    return loadCoreData().clients.find(c => c.id === id) ?? null;
  }

  async create(data: ClientFormData): Promise<Client> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    const client: Client = {
      id: generateId('client'),
      name: data.name.trim(),
      slug: data.name.trim().toLowerCase().replace(/\s+/g, '-'),
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: null,
      status: 'active',
      notes: data.notes.trim() || null,
      created_by: 'demo-owner-000',
      created_at: now,
      updated_at: now,
    };
    saveCoreData({ ...store, clients: [client, ...store.clients] });
    return client;
  }

  async update(id: string, patch: Partial<Client>): Promise<Client> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    const clients = store.clients.map(c =>
      c.id === id ? { ...c, ...patch, updated_at: now } : c,
    );
    saveCoreData({ ...store, clients });
    return clients.find(c => c.id === id)!;
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { status: 'archived' });
  }
}

// ---------------------------------------------------------------------------
// B. LocalStorageBrandRepository
// ---------------------------------------------------------------------------

export class LocalStorageBrandRepository implements BrandRepository {
  async list(clientId: string): Promise<Brand[]> {
    return loadCoreData().brands.filter(b => b.client_id === clientId);
  }

  async get(id: string, clientId: string): Promise<Brand | null> {
    return loadCoreData().brands.find(b => b.id === id && b.client_id === clientId) ?? null;
  }

  async create(data: BrandFormData): Promise<Brand> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    const brand: Brand = {
      id: generateId('brand'),
      client_id: data.client_id,
      name: data.name.trim(),
      slug: data.name.trim().toLowerCase().replace(/\s+/g, '-'),
      industry: data.industry.trim() || null,
      hero_product: data.hero_product.trim() || null,
      tone_of_voice: data.tone_of_voice.trim() || null,
      target_audience: data.target_audience.trim() || null,
      primary_channels: data.primary_channels.split(',').map(s => s.trim()).filter(Boolean),
      brand_colors: null,
      logo_url: null,
      status: 'active',
      created_by: 'demo-owner-000',
      created_at: now,
      updated_at: now,
    };
    saveCoreData({ ...store, brands: [brand, ...store.brands] });
    return brand;
  }

  async update(id: string, clientId: string, patch: Partial<Brand>): Promise<Brand> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    let found: Brand | undefined;
    const brands = store.brands.map(b => {
      if (b.id === id && b.client_id === clientId) {
        found = { ...b, ...patch, updated_at: now };
        return found;
      }
      return b;
    });
    if (!found) throw new Error(`Brand ${id} not found for client ${clientId}`);
    saveCoreData({ ...store, brands });
    return found;
  }

  async archive(id: string, clientId: string): Promise<void> {
    await this.update(id, clientId, { status: 'archived' });
  }
}

// ---------------------------------------------------------------------------
// C. LocalStorageCampaignRepository
// ---------------------------------------------------------------------------

export class LocalStorageCampaignRepository implements CampaignRepository {
  async list({ clientId, brandId }: CampaignListParams): Promise<Campaign[]> {
    let campaigns = loadCoreData().campaigns.filter(c => c.client_id === clientId);
    if (brandId) campaigns = campaigns.filter(c => c.brand_id === brandId);
    return campaigns;
  }

  async get({ clientId, campaignId, brandId }: CampaignGetParams): Promise<Campaign | null> {
    return (
      loadCoreData().campaigns.find(
        c => c.id === campaignId && c.client_id === clientId && (!brandId || c.brand_id === brandId),
      ) ?? null
    );
  }

  async create(data: CampaignFormData): Promise<Campaign> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    const budgetNum = data.budget_estimate.trim()
      ? parseFloat(data.budget_estimate.replace(/,/g, ''))
      : null;
    const campaign: Campaign = {
      id: generateId('campaign'),
      client_id: data.client_id,
      brand_id: data.brand_id,
      name: data.name.trim(),
      description: data.description.trim() || null,
      campaign_type: 'custom',
      duration_days: calculateCampaignDurationDays(data.start_date, data.end_date),
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      status: data.status,
      budget_estimate: budgetNum,
      currency: 'VND',
      created_by: 'demo-owner-000',
      created_at: now,
      updated_at: now,
    };
    saveCoreData({ ...store, campaigns: [campaign, ...store.campaigns] });
    return campaign;
  }

  async update({ clientId, brandId, campaignId }: CampaignScopedParams, patch: Partial<Campaign>): Promise<Campaign> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    let found: Campaign | undefined;
    const campaigns = store.campaigns.map(c => {
      if (c.id === campaignId && c.client_id === clientId && c.brand_id === brandId) {
        found = { ...c, ...patch, updated_at: now };
        return found;
      }
      return c;
    });
    if (!found) throw new Error(`Campaign ${campaignId} not found for client ${clientId} / brand ${brandId}`);
    saveCoreData({ ...store, campaigns });
    return found;
  }

  async archive(params: CampaignScopedParams): Promise<void> {
    await this.update(params, { status: 'archived' });
  }
}

// ---------------------------------------------------------------------------
// D. LocalStorageBriefRepository
// ---------------------------------------------------------------------------

export class LocalStorageBriefRepository implements BriefRepository {
  async list({ clientId, brandId, campaignId }: BriefListParams): Promise<CampaignBrief[]> {
    return loadCoreData().briefs.filter(
      b => b.client_id === clientId && b.brand_id === brandId && b.campaign_id === campaignId,
    );
  }

  async get({ clientId, brandId, campaignId, briefId }: BriefScopedParams): Promise<CampaignBrief | null> {
    return (
      loadCoreData().briefs.find(
        b => b.id === briefId && b.client_id === clientId && b.brand_id === brandId && b.campaign_id === campaignId,
      ) ?? null
    );
  }

  async create(data: BriefFormData): Promise<CampaignBrief> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    const brief: CampaignBrief = {
      id: generateId('brief'),
      campaign_id: data.campaign_id,
      brand_id: data.brand_id,
      client_id: data.client_id,
      brand_name: data.brand_name.trim(),
      hero_product: data.product_focus.trim() || null,
      industry: data.industry.trim() || null,
      brief_title: data.brief_title.trim() || null,
      campaign_goal: data.campaign_goal.trim() || null,
      product_focus: data.product_focus.trim() || null,
      offer: data.offer.trim() || null,
      tone_of_voice: data.tone_of_voice.trim() || null,
      tone: data.tone_of_voice.trim() || null,
      target_audience: data.target_audience.trim() || null,
      campaign_goals: data.campaign_goal.trim() ? [data.campaign_goal.trim()] : null,
      key_messages: data.key_messages ? parseLines(data.key_messages) : null,
      channels: parseComma(data.channels),
      content_pillars: data.content_pillars ? parseLines(data.content_pillars) : null,
      must_include: data.must_include.trim() || null,
      must_avoid: data.must_avoid.trim() || null,
      competitors: data.competitors.trim() || null,
      reference_links: data.reference_links.trim() || null,
      budget_note: data.budget_note.trim() || null,
      timeline_note: data.timeline_note.trim() || null,
      approval_requirements: data.approval_requirements.trim() || null,
      duration_days: null,
      additional_notes: null,
      status: 'draft',
      submitted_by: 'demo-owner-000',
      submitted_at: now,
      created_at: now,
      updated_at: now,
    };
    saveCoreData({ ...store, briefs: [brief, ...store.briefs] });
    return brief;
  }

  async update({ clientId, brandId, campaignId, briefId }: BriefScopedParams, patch: BriefUpdatePatch): Promise<CampaignBrief> {
    const store = loadCoreData();
    const now = new Date().toISOString();
    // Strip id/tenant/audit fields — patch can never reassign a brief to another tenant/campaign
    const safe = sanitizeBriefPatch(patch);
    let found: CampaignBrief | undefined;
    const briefs = store.briefs.map(b => {
      if (b.id === briefId && b.client_id === clientId && b.brand_id === brandId && b.campaign_id === campaignId) {
        found = { ...b, ...safe, updated_at: now };
        return found;
      }
      return b;
    });
    if (!found) throw new Error(`Brief ${briefId} not found for campaign ${campaignId}`);
    saveCoreData({ ...store, briefs });
    return found;
  }
}

// ---------------------------------------------------------------------------
// E. LocalStorageGenerationRepository (Phase 16C-1)
//
// Operates on GenerationDataStore (separate localStorage key from
// CoreDataStore) — mirrors the same client/brand/campaign/brief scoping as
// LocalStorageBriefRepository.
// ---------------------------------------------------------------------------

export class LocalStorageGenerationRepository implements GenerationRepository {
  async list({ clientId, brandId, campaignId, briefId }: GenerationListParams): Promise<GenerationListResult> {
    const store = loadGenerationData();
    const jobs = store.generationJobs.filter(
      j => j.client_id === clientId && j.brand_id === brandId && j.campaign_id === campaignId && j.brief_id === briefId,
    );
    const items = store.contentItems.filter(
      i => i.client_id === clientId && i.brand_id === brandId && i.campaign_id === campaignId && i.brief_id === briefId,
    );
    return { jobs, items };
  }

  async get({ clientId, brandId, campaignId, briefId, generationId }: GenerationScopedParams): Promise<GenerationDetailResult | null> {
    const store = loadGenerationData();
    const job = store.generationJobs.find(
      j => j.id === generationId && j.client_id === clientId && j.brand_id === brandId && j.campaign_id === campaignId && j.brief_id === briefId,
    );
    if (!job) return null;
    const items = store.contentItems.filter(
      i => i.generation_job_id === job.id && i.client_id === clientId && i.brand_id === brandId && i.campaign_id === campaignId && i.brief_id === briefId,
    );
    return { job, items };
  }

  async create(data: GenerationCreateInput): Promise<GenerationDetailResult> {
    const store = loadGenerationData();
    const { job, items } = generateContentPlan(data.brief, data.planLengthDays, data.requestedBy);
    // Tenant fields come from the verified scope params, not from
    // brief.client_id/brand_id (typed string | null).
    const scopedJob: ContentPlanJob = {
      ...job,
      client_id: data.clientId,
      brand_id: data.brandId,
      campaign_id: data.campaignId,
      brief_id: data.briefId,
    };
    const scopedItems: ContentPlanItem[] = items.map(item => ({
      ...item,
      client_id: data.clientId,
      brand_id: data.brandId,
      campaign_id: data.campaignId,
      brief_id: data.briefId,
    }));
    saveGenerationData({
      generationJobs: [scopedJob, ...store.generationJobs],
      contentItems: [...scopedItems, ...store.contentItems],
    });
    return { job: scopedJob, items: scopedItems };
  }

  async update({ clientId, brandId, campaignId, briefId, generationId }: GenerationScopedParams, patch: GenerationUpdatePatch): Promise<ContentPlanJob> {
    const store = loadGenerationData();
    const now = new Date().toISOString();
    // Strip id/tenant/audit fields — patch can never reassign a job to another tenant/brief
    const safe = sanitizeGenerationPatch(patch);
    let found: ContentPlanJob | undefined;
    const generationJobs = store.generationJobs.map(j => {
      if (j.id === generationId && j.client_id === clientId && j.brand_id === brandId && j.campaign_id === campaignId && j.brief_id === briefId) {
        found = { ...j, ...safe, updated_at: now };
        return found;
      }
      return j;
    });
    if (!found) throw new Error(`Generation job ${generationId} not found for brief ${briefId}`);
    saveGenerationData({ ...store, generationJobs });
    return found;
  }

  async archive(params: GenerationScopedParams): Promise<void> {
    await this.update(params, { status: 'archived' });
  }
}
