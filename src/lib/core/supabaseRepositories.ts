// =============================================================================
// THE CORE AGENCY — Supabase Repository Implementations
// Phase 16A — Supabase CRUD Wiring: Clients + Brands
//
// Only instantiated when isSupabaseConfigured is true.
// Uses the anon key + RLS policies — no service role key, no tenant bypass.
// Throws on Supabase errors so callers can handle gracefully.
//
// Column names match schema_v1.sql exactly.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Client, Brand, Campaign, CampaignBrief, ContentPlanJob, ContentPlanItem, ContentApprovalRequest, ContentApprovalEvent, ContentApprovalComment, AssetItem, LocalAssetCollection } from '../../types/core';
import type { ClientRepository, BrandRepository, CampaignRepository, CampaignListParams, CampaignGetParams, CampaignScopedParams, BriefRepository, BriefListParams, BriefScopedParams, BriefUpdatePatch, GenerationRepository, GenerationListParams, GenerationScopedParams, GenerationCreateInput, GenerationListResult, GenerationDetailResult, GenerationUpdatePatch, ApprovalRepository, ApprovalListParams, ApprovalScopedParams, ApprovalListResult, ApprovalDetailResult, ApprovalCreateInput, ApprovalSubmitResult, ApprovalActionResult, ApprovalCommentResult, ResolvingApprovalAction, AssetRepository, AssetListParams, AssetScopedParams, AssetCreateInput, AssetUpdatePatch, AssetCollectionRepository, AssetCollectionListParams, AssetCollectionCreateInput } from './coreRepository';
import { sanitizeBriefPatch, sanitizeGenerationPatch, sanitizeAssetPatch } from './coreRepository';
import type { ClientFormData, BrandFormData, CampaignFormData, BriefFormData } from './coreData';
import { calculateCampaignDurationDays, parseLines, parseComma, ACTION_TO_APPROVAL_STATUS, ACTION_TO_ITEM_STATUS } from './coreData';
import { generateContentPlan } from './contentGenerator';

// Postgres error code returned by Supabase when a single-row query finds nothing
const PGRST_NOT_FOUND = 'PGRST116';

// ---------------------------------------------------------------------------
// A. SupabaseClientRepository
// ---------------------------------------------------------------------------

export class SupabaseClientRepository implements ClientRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list(): Promise<Client[]> {
    const { data, error } = await this.sb
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Client[];
  }

  async get(id: string): Promise<Client | null> {
    const { data, error } = await this.sb
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) return null;
      throw error;
    }
    return data as Client | null;
  }

  async create(data: ClientFormData): Promise<Client> {
    const row = {
      name: data.name.trim(),
      slug: data.name.trim().toLowerCase().replace(/\s+/g, '-'),
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: null,
      status: 'active',
      notes: data.notes.trim() || null,
    };
    const { data: created, error } = await this.sb
      .from('clients')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return created as Client;
  }

  async update(id: string, patch: Partial<Client>): Promise<Client> {
    // Strip read-only fields before sending to DB
    const { id: _id, created_at: _ca, created_by: _cb, ...safe } = patch as Record<string, unknown>;
    const { data, error } = await this.sb
      .from('clients')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Client;
  }

  async archive(id: string): Promise<void> {
    const { error } = await this.sb
      .from('clients')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// B. SupabaseBrandRepository
// ---------------------------------------------------------------------------

export class SupabaseBrandRepository implements BrandRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list(clientId: string): Promise<Brand[]> {
    const { data, error } = await this.sb
      .from('brands')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Brand[];
  }

  async get(id: string, clientId: string): Promise<Brand | null> {
    const { data, error } = await this.sb
      .from('brands')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) return null;
      throw error;
    }
    return data as Brand | null;
  }

  async create(data: BrandFormData): Promise<Brand> {
    const row = {
      client_id: data.client_id,
      name: data.name.trim(),
      slug: data.name.trim().toLowerCase().replace(/\s+/g, '-'),
      industry: data.industry.trim() || null,
      hero_product: data.hero_product.trim() || null,
      tone_of_voice: data.tone_of_voice.trim() || null,
      target_audience: data.target_audience.trim() || null,
      primary_channels: data.primary_channels.split(',').map((s: string) => s.trim()).filter(Boolean),
      brand_colors: null,
      logo_url: null,
      status: 'active',
    };
    const { data: created, error } = await this.sb
      .from('brands')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return created as Brand;
  }

  async update(id: string, clientId: string, patch: Partial<Brand>): Promise<Brand> {
    // Strip read-only fields before sending to DB
    const { id: _id, created_at: _ca, created_by: _cb, client_id: _cid, ...safe } = patch as Record<string, unknown>;
    const { data, error } = await this.sb
      .from('brands')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Brand ${id} not found for client ${clientId}`);
      throw error;
    }
    return data as Brand;
  }

  async archive(id: string, clientId: string): Promise<void> {
    const { data, error } = await this.sb
      .from('brands')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('id')
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Brand ${id} not found for client ${clientId}`);
      throw error;
    }
    void data;
  }
}

// ---------------------------------------------------------------------------
// C. SupabaseCampaignRepository
// ---------------------------------------------------------------------------

export class SupabaseCampaignRepository implements CampaignRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId }: CampaignListParams): Promise<Campaign[]> {
    let q = this.sb
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (brandId) q = q.eq('brand_id', brandId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Campaign[];
  }

  async get({ clientId, campaignId, brandId }: CampaignGetParams): Promise<Campaign | null> {
    let q = this.sb
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('client_id', clientId);
    if (brandId) q = q.eq('brand_id', brandId);
    const { data, error } = await q.single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) return null;
      throw error;
    }
    return data as Campaign | null;
  }

  async create(data: CampaignFormData): Promise<Campaign> {
    const budgetNum = data.budget_estimate.trim()
      ? parseFloat(data.budget_estimate.replace(/,/g, ''))
      : null;
    // No id field — DB generates UUID; never send local campaign-* prefix IDs
    const row = {
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
    };
    const { data: created, error } = await this.sb
      .from('campaigns')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return created as Campaign;
  }

  async update({ clientId, brandId, campaignId }: CampaignScopedParams, patch: Partial<Campaign>): Promise<Campaign> {
    const { id: _id, created_at: _ca, created_by: _cb, client_id: _cid, brand_id: _bid, ...safe } = patch as Record<string, unknown>;
    const { data, error } = await this.sb
      .from('campaigns')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .select()
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Campaign ${campaignId} not found for client ${clientId}`);
      throw error;
    }
    return data as Campaign;
  }

  async archive({ clientId, brandId, campaignId }: CampaignScopedParams): Promise<void> {
    const { data, error } = await this.sb
      .from('campaigns')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .select('id')
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Campaign ${campaignId} not found for client ${clientId}`);
      throw error;
    }
    void data;
  }
}

// ---------------------------------------------------------------------------
// D. SupabaseBriefRepository
//
// Requires the Phase 16B-2 additive migration (schema_v1_phase16b2_brief_extension.sql)
// that adds client_id, brand_id, status, and the Phase 5 brief-detail columns
// to campaign_briefs.
// ---------------------------------------------------------------------------

export class SupabaseBriefRepository implements BriefRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId, campaignId }: BriefListParams): Promise<CampaignBrief[]> {
    const { data, error } = await this.sb
      .from('campaign_briefs')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignBrief[];
  }

  async get({ clientId, brandId, campaignId, briefId }: BriefScopedParams): Promise<CampaignBrief | null> {
    const { data, error } = await this.sb
      .from('campaign_briefs')
      .select('*')
      .eq('id', briefId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) return null;
      throw error;
    }
    return data as CampaignBrief | null;
  }

  async create(data: BriefFormData): Promise<CampaignBrief> {
    // No id field — DB generates UUID; never send local brief-* prefix IDs.
    // submitted_by/submitted_at left unset — 'demo-owner-000' is not a valid
    // users.id UUID, and both columns are nullable.
    const row = {
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
      status: 'draft',
    };
    const { data: created, error } = await this.sb
      .from('campaign_briefs')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return created as CampaignBrief;
  }

  async update({ clientId, brandId, campaignId, briefId }: BriefScopedParams, patch: BriefUpdatePatch): Promise<CampaignBrief> {
    // Strip id/tenant/audit fields — patch can never reassign a brief to another tenant/campaign
    const safe = sanitizeBriefPatch(patch);
    const { data, error } = await this.sb
      .from('campaign_briefs')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', briefId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .select()
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Brief ${briefId} not found for campaign ${campaignId}`);
      throw error;
    }
    return data as CampaignBrief;
  }
}

// ---------------------------------------------------------------------------
// E. SupabaseGenerationRepository (Phase 16C-1)
//
// Requires the Phase 16C-1 additive migration
// (schema_v1_phase16c1_generation_extension.sql) that creates
// content_plan_jobs / content_plan_items. Distinct from the legacy
// generation_jobs / content_items tables, which target a different,
// incompatible Phase-15-planned schema.
// ---------------------------------------------------------------------------

export class SupabaseGenerationRepository implements GenerationRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId, campaignId, briefId }: GenerationListParams): Promise<GenerationListResult> {
    const { data: jobs, error: jobsError } = await this.sb
      .from('content_plan_jobs')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false });
    if (jobsError) throw jobsError;

    const { data: items, error: itemsError } = await this.sb
      .from('content_plan_items')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .order('day_number', { ascending: true });
    if (itemsError) throw itemsError;

    return {
      jobs: (jobs ?? []) as ContentPlanJob[],
      items: (items ?? []) as ContentPlanItem[],
    };
  }

  async get({ clientId, brandId, campaignId, briefId, generationId }: GenerationScopedParams): Promise<GenerationDetailResult | null> {
    const { data: job, error: jobError } = await this.sb
      .from('content_plan_jobs')
      .select('*')
      .eq('id', generationId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .single();
    if (jobError) {
      if (jobError.code === PGRST_NOT_FOUND) return null;
      throw jobError;
    }

    const { data: items, error: itemsError } = await this.sb
      .from('content_plan_items')
      .select('*')
      .eq('generation_job_id', generationId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .order('day_number', { ascending: true });
    if (itemsError) throw itemsError;

    return {
      job: job as ContentPlanJob,
      items: (items ?? []) as ContentPlanItem[],
    };
  }

  async create(data: GenerationCreateInput): Promise<GenerationDetailResult> {
    // Mock-generate the job + items locally, then re-shape for insertion —
    // never send the local job-*/item-* prefix IDs to Supabase UUID columns.
    const { job, items } = generateContentPlan(data.brief, data.planLengthDays, data.requestedBy);

    const jobRow = {
      client_id: data.clientId,
      brand_id: data.brandId,
      campaign_id: data.campaignId,
      brief_id: data.briefId,
      plan_length_days: job.plan_length_days,
      generation_mode: job.generation_mode,
      status: job.status,
      requested_by: job.requested_by,
      item_count: job.item_count,
      completed_at: job.completed_at,
      error_message: job.error_message,
    };
    const { data: createdJob, error: jobError } = await this.sb
      .from('content_plan_jobs')
      .insert(jobRow)
      .select()
      .single();
    if (jobError) throw jobError;
    const newJob = createdJob as ContentPlanJob;

    // Items reference the DB-generated job id, not the local job-* id
    const itemRows = items.map(item => ({
      generation_job_id: newJob.id,
      client_id: data.clientId,
      brand_id: data.brandId,
      campaign_id: data.campaignId,
      brief_id: data.briefId,
      day_number: item.day_number,
      planned_date: item.planned_date,
      channel: item.channel,
      content_type: item.content_type,
      pillar: item.pillar,
      angle: item.angle,
      hook: item.hook,
      caption: item.caption,
      visual_brief: item.visual_brief,
      cta: item.cta,
      hashtags: item.hashtags,
      status: item.status,
    }));
    const { data: createdItems, error: itemsError } = await this.sb
      .from('content_plan_items')
      .insert(itemRows)
      .select();
    if (itemsError) throw itemsError;

    return {
      job: newJob,
      items: (createdItems ?? []) as ContentPlanItem[],
    };
  }

  async update({ clientId, brandId, campaignId, briefId, generationId }: GenerationScopedParams, patch: GenerationUpdatePatch): Promise<ContentPlanJob> {
    // Strip id/tenant/audit fields — patch can never reassign a job to another tenant/brief
    const safe = sanitizeGenerationPatch(patch);
    const { data, error } = await this.sb
      .from('content_plan_jobs')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', generationId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .select()
      .single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Generation job ${generationId} not found for brief ${briefId}`);
      throw error;
    }
    return data as ContentPlanJob;
  }

  async archive(params: GenerationScopedParams): Promise<void> {
    await this.update(params, { status: 'archived' });
  }
}

// ---------------------------------------------------------------------------
// F. SupabaseApprovalRepository (Phase 16C-2)
//
// Requires the Phase 16C-2 additive migration
// (schema_v1_phase16c2_approval_extension.sql) that creates
// content_approval_requests / content_approval_events /
// content_approval_comments. Every operation is scoped by the full
// client/brand/campaign/brief/generation chain (+ approvalId for
// get/executeAction/addComment) — never by approvalId alone.
// ---------------------------------------------------------------------------

export class SupabaseApprovalRepository implements ApprovalRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId, campaignId, briefId, generationId }: ApprovalListParams): Promise<ApprovalListResult> {
    const { data: requests, error: reqError } = await this.sb
      .from('content_approval_requests')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .order('created_at', { ascending: false });
    if (reqError) throw reqError;

    const ids = (requests ?? []).map(r => r.id as string);
    if (ids.length === 0) {
      return { requests: [], events: [], comments: [] };
    }

    const { data: events, error: eventsError } = await this.sb
      .from('content_approval_events')
      .select('*')
      .in('approval_request_id', ids)
      .order('created_at', { ascending: false });
    if (eventsError) throw eventsError;

    const { data: comments, error: commentsError } = await this.sb
      .from('content_approval_comments')
      .select('*')
      .in('approval_request_id', ids)
      .order('created_at', { ascending: false });
    if (commentsError) throw commentsError;

    return {
      requests: requests as ContentApprovalRequest[],
      events: (events ?? []) as ContentApprovalEvent[],
      comments: (comments ?? []) as ContentApprovalComment[],
    };
  }

  async get({ clientId, brandId, campaignId, briefId, generationId, approvalId }: ApprovalScopedParams): Promise<ApprovalDetailResult | null> {
    const { data: request, error: reqError } = await this.sb
      .from('content_approval_requests')
      .select('*')
      .eq('id', approvalId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .single();
    if (reqError) {
      if (reqError.code === PGRST_NOT_FOUND) return null;
      throw reqError;
    }

    const { data: events, error: eventsError } = await this.sb
      .from('content_approval_events')
      .select('*')
      .eq('approval_request_id', approvalId)
      .order('created_at', { ascending: false });
    if (eventsError) throw eventsError;

    const { data: comments, error: commentsError } = await this.sb
      .from('content_approval_comments')
      .select('*')
      .eq('approval_request_id', approvalId)
      .order('created_at', { ascending: false });
    if (commentsError) throw commentsError;

    return {
      request: request as ContentApprovalRequest,
      events: (events ?? []) as ContentApprovalEvent[],
      comments: (comments ?? []) as ContentApprovalComment[],
    };
  }

  async create({ contentItem, clientId, brandId, campaignId, briefId, generationId, actorLabel, priority, dueDate }: ApprovalCreateInput): Promise<ApprovalSubmitResult> {
    // Reject if the content item doesn't actually belong to the claimed scope
    if (
      contentItem.client_id !== clientId || contentItem.brand_id !== brandId
      || contentItem.campaign_id !== campaignId || contentItem.brief_id !== briefId
      || contentItem.generation_job_id !== generationId
    ) {
      throw new Error(`Content item ${contentItem.id} does not match the claimed approval scope`);
    }

    const requestRow = {
      content_item_id: contentItem.id,
      generation_job_id: generationId,
      brief_id: briefId,
      campaign_id: campaignId,
      brand_id: brandId,
      client_id: clientId,
      title: contentItem.hook.slice(0, 80),
      status: 'submitted',
      priority: priority ?? 'normal',
      requested_by: actorLabel,
      assigned_to_role: 'manager',
      due_date: dueDate ?? null,
    };
    const { data: createdRequest, error: reqError } = await this.sb
      .from('content_approval_requests')
      .insert(requestRow)
      .select()
      .single();
    if (reqError) throw reqError;
    const request = createdRequest as ContentApprovalRequest;

    const eventRow = {
      approval_request_id: request.id,
      content_item_id: contentItem.id,
      action: 'submitted',
      actor_label: actorLabel,
      comment: null,
      previous_status: null,
      new_status: 'submitted',
    };
    const { data: createdEvent, error: eventError } = await this.sb
      .from('content_approval_events')
      .insert(eventRow)
      .select()
      .single();
    if (eventError) throw eventError;

    const { data: updatedItem, error: itemError } = await this.sb
      .from('content_plan_items')
      .update({ status: 'needs_review', updated_at: new Date().toISOString() })
      .eq('id', contentItem.id)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .select()
      .single();
    if (itemError) throw itemError;

    return {
      request,
      event: createdEvent as ContentApprovalEvent,
      updatedItem: updatedItem as ContentPlanItem,
    };
  }

  async executeAction({ clientId, brandId, campaignId, briefId, generationId, approvalId }: ApprovalScopedParams, action: ResolvingApprovalAction, actorLabel: string, comment?: string): Promise<ApprovalActionResult> {
    const { data: existing, error: fetchError } = await this.sb
      .from('content_approval_requests')
      .select('*')
      .eq('id', approvalId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .single();
    if (fetchError) {
      if (fetchError.code === PGRST_NOT_FOUND) throw new Error(`Approval request ${approvalId} not found in scope`);
      throw fetchError;
    }
    const previous = existing as ContentApprovalRequest;
    const now = new Date().toISOString();
    const newApprovalStatus = ACTION_TO_APPROVAL_STATUS[action];
    const newItemStatus = ACTION_TO_ITEM_STATUS[action];

    const { data: updatedRequest, error: updateError } = await this.sb
      .from('content_approval_requests')
      .update({ status: newApprovalStatus, updated_at: now, resolved_at: now })
      .eq('id', approvalId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .select()
      .single();
    if (updateError) throw updateError;

    const eventRow = {
      approval_request_id: approvalId,
      content_item_id: previous.content_item_id,
      action,
      actor_label: actorLabel,
      comment: comment ?? null,
      previous_status: previous.status,
      new_status: newApprovalStatus,
    };
    const { data: createdEvent, error: eventError } = await this.sb
      .from('content_approval_events')
      .insert(eventRow)
      .select()
      .single();
    if (eventError) throw eventError;

    const { data: updatedItem, error: itemError } = await this.sb
      .from('content_plan_items')
      .update({ status: newItemStatus, updated_at: now })
      .eq('id', previous.content_item_id)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .select()
      .single();
    if (itemError) throw itemError;

    return {
      request: updatedRequest as ContentApprovalRequest,
      event: createdEvent as ContentApprovalEvent,
      updatedItem: updatedItem as ContentPlanItem,
    };
  }

  async addComment({ clientId, brandId, campaignId, briefId, generationId, approvalId }: ApprovalScopedParams, actorLabel: string, commentText: string, isInternal = true): Promise<ApprovalCommentResult> {
    const { data: existing, error: fetchError } = await this.sb
      .from('content_approval_requests')
      .select('id, content_item_id')
      .eq('id', approvalId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId)
      .eq('campaign_id', campaignId)
      .eq('brief_id', briefId)
      .eq('generation_job_id', generationId)
      .single();
    if (fetchError) {
      if (fetchError.code === PGRST_NOT_FOUND) throw new Error(`Approval request ${approvalId} not found in scope`);
      throw fetchError;
    }
    const request = existing as Pick<ContentApprovalRequest, 'id' | 'content_item_id'>;

    const commentRow = {
      approval_request_id: approvalId,
      content_item_id: request.content_item_id,
      actor_label: actorLabel,
      comment: commentText,
      is_internal: isInternal,
    };
    const { data: createdComment, error: commentError } = await this.sb
      .from('content_approval_comments')
      .insert(commentRow)
      .select()
      .single();
    if (commentError) throw commentError;

    const eventRow = {
      approval_request_id: approvalId,
      content_item_id: request.content_item_id,
      action: 'commented',
      actor_label: actorLabel,
      comment: commentText,
      previous_status: null,
      new_status: null,
    };
    const { data: createdEvent, error: eventError } = await this.sb
      .from('content_approval_events')
      .insert(eventRow)
      .select()
      .single();
    if (eventError) throw eventError;

    return {
      comment: createdComment as ContentApprovalComment,
      event: createdEvent as ContentApprovalEvent,
    };
  }
}

// ---------------------------------------------------------------------------
// G. SupabaseAssetRepository (Phase 16D)
//
// content_assets — client_id/brand_id are NOT NULL; campaign_id/brief_id/
// generation_job_id/content_item_id are nullable and only filtered when the
// caller provides them (undefined = "don't filter on this level"). RLS
// (content_asset_user_has_scope / content_asset_user_can_write) enforces
// hierarchy + role on every row.
// ---------------------------------------------------------------------------

export class SupabaseAssetRepository implements AssetRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId, campaignId, briefId, generationId, contentItemId }: AssetListParams): Promise<AssetItem[]> {
    let query = this.sb
      .from('content_assets')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId);

    if (campaignId !== undefined) query = campaignId === null ? query.is('campaign_id', null) : query.eq('campaign_id', campaignId);
    if (briefId !== undefined) query = briefId === null ? query.is('brief_id', null) : query.eq('brief_id', briefId);
    if (generationId !== undefined) query = generationId === null ? query.is('generation_job_id', null) : query.eq('generation_job_id', generationId);
    if (contentItemId !== undefined) query = contentItemId === null ? query.is('content_item_id', null) : query.eq('content_item_id', contentItemId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AssetItem[];
  }

  async get({ assetId, clientId, brandId, campaignId, briefId, generationId, contentItemId }: AssetScopedParams): Promise<AssetItem | null> {
    let query = this.sb
      .from('content_assets')
      .select('*')
      .eq('id', assetId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId);

    if (campaignId !== undefined) query = campaignId === null ? query.is('campaign_id', null) : query.eq('campaign_id', campaignId);
    if (briefId !== undefined) query = briefId === null ? query.is('brief_id', null) : query.eq('brief_id', briefId);
    if (generationId !== undefined) query = generationId === null ? query.is('generation_job_id', null) : query.eq('generation_job_id', generationId);
    if (contentItemId !== undefined) query = contentItemId === null ? query.is('content_item_id', null) : query.eq('content_item_id', contentItemId);

    const { data, error } = await query.single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) return null;
      throw error;
    }
    return data as AssetItem;
  }

  async create(input: AssetCreateInput): Promise<AssetItem> {
    const row = {
      ...input.data,
      client_id: input.clientId,
      brand_id: input.brandId,
      campaign_id: input.campaignId,
      brief_id: input.briefId,
      generation_job_id: input.generationId,
      content_item_id: input.contentItemId,
    };
    const { data, error } = await this.sb
      .from('content_assets')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as AssetItem;
  }

  async update(params: AssetScopedParams, patch: AssetUpdatePatch): Promise<AssetItem> {
    const { assetId, clientId, brandId, campaignId, briefId, generationId, contentItemId } = params;
    const safePatch = sanitizeAssetPatch(patch);

    let query = this.sb
      .from('content_assets')
      .update({ ...safePatch, updated_at: new Date().toISOString() })
      .eq('id', assetId)
      .eq('client_id', clientId)
      .eq('brand_id', brandId);

    if (campaignId !== undefined) query = campaignId === null ? query.is('campaign_id', null) : query.eq('campaign_id', campaignId);
    if (briefId !== undefined) query = briefId === null ? query.is('brief_id', null) : query.eq('brief_id', briefId);
    if (generationId !== undefined) query = generationId === null ? query.is('generation_job_id', null) : query.eq('generation_job_id', generationId);
    if (contentItemId !== undefined) query = contentItemId === null ? query.is('content_item_id', null) : query.eq('content_item_id', contentItemId);

    const { data, error } = await query.select().single();
    if (error) {
      if (error.code === PGRST_NOT_FOUND) throw new Error(`Asset ${assetId} not found in scope`);
      throw error;
    }
    return data as AssetItem;
  }

  async archive(params: AssetScopedParams): Promise<void> {
    await this.update(params, { approval_status: 'archived' });
  }
}

// ---------------------------------------------------------------------------
// H. SupabaseAssetCollectionRepository (Phase 16D)
//
// content_asset_collections — brand-level (client_id + brand_id, optional
// campaign_id).
// ---------------------------------------------------------------------------

export class SupabaseAssetCollectionRepository implements AssetCollectionRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async list({ clientId, brandId, campaignId }: AssetCollectionListParams): Promise<LocalAssetCollection[]> {
    let query = this.sb
      .from('content_asset_collections')
      .select('*')
      .eq('client_id', clientId)
      .eq('brand_id', brandId);

    if (campaignId !== undefined) query = campaignId === null ? query.is('campaign_id', null) : query.eq('campaign_id', campaignId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LocalAssetCollection[];
  }

  async create(input: AssetCollectionCreateInput): Promise<LocalAssetCollection> {
    const row = {
      client_id: input.clientId,
      brand_id: input.brandId,
      campaign_id: input.campaignId,
      name: input.name,
      description: input.description,
      created_by: input.createdBy,
    };
    const { data, error } = await this.sb
      .from('content_asset_collections')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as LocalAssetCollection;
  }
}
