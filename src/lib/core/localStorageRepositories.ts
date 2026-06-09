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

import type { Client, Brand } from '../../types/core';
import type { ClientRepository, BrandRepository } from './coreRepository';
import type { ClientFormData, BrandFormData } from './coreData';
import { loadCoreData, saveCoreData, generateId } from './coreData';

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
  async list(clientId?: string): Promise<Brand[]> {
    const brands = loadCoreData().brands;
    return clientId ? brands.filter(b => b.client_id === clientId) : brands;
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
