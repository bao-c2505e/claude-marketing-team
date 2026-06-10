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
import type { Client, Brand, Campaign } from '../../types/core';
import type { ClientRepository, BrandRepository, CampaignRepository, CampaignListParams, CampaignGetParams, CampaignScopedParams } from './coreRepository';
import type { ClientFormData, BrandFormData, CampaignFormData } from './coreData';

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
      duration_days: 0,
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
