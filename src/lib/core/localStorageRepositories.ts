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

import type { Client, Brand, Campaign } from '../../types/core';
import type { ClientRepository, BrandRepository, CampaignRepository, CampaignListParams, CampaignGetParams, CampaignScopedParams } from './coreRepository';
import type { ClientFormData, BrandFormData, CampaignFormData } from './coreData';
import { loadCoreData, saveCoreData, generateId, calculateCampaignDurationDays } from './coreData';

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
