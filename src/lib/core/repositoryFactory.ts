// =============================================================================
// THE CORE AGENCY — Repository Factory
// Phase 16A — Supabase CRUD Wiring: Clients + Brands
// Phase 16B-1 — Supabase CRUD Wiring: Campaigns
// Phase 16B-2 — Supabase CRUD Wiring: Campaign Briefs
// Phase 16C-1 — Supabase CRUD Wiring: Content Plan Generation
// Phase 16C-2 — Supabase CRUD Wiring: Approval
// Phase 16D — Supabase CRUD Wiring: Asset Library
//
// Returns Supabase-backed repositories when configured,
// localStorage repositories otherwise (demo mode / no env vars).
//
// Calendar / Reports / Connector Inbox / Automation Logs / Publishing wiring
// is deferred to later phases.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClientRepository, BrandRepository, CampaignRepository, BriefRepository, GenerationRepository, ApprovalRepository, AssetRepository, AssetCollectionRepository } from './coreRepository';
import {
  LocalStorageClientRepository,
  LocalStorageBrandRepository,
  LocalStorageCampaignRepository,
  LocalStorageBriefRepository,
  LocalStorageGenerationRepository,
  LocalStorageApprovalRepository,
  LocalStorageAssetRepository,
  LocalStorageAssetCollectionRepository,
} from './localStorageRepositories';
import {
  SupabaseClientRepository,
  SupabaseBrandRepository,
  SupabaseCampaignRepository,
  SupabaseBriefRepository,
  SupabaseGenerationRepository,
  SupabaseApprovalRepository,
  SupabaseAssetRepository,
  SupabaseAssetCollectionRepository,
} from './supabaseRepositories';

export interface Phase16aRepositories {
  clients: ClientRepository;
  brands: BrandRepository;
  campaigns: CampaignRepository;
  briefs: BriefRepository;
  generations: GenerationRepository;
  approvals: ApprovalRepository;
  assets: AssetRepository;
  assetCollections: AssetCollectionRepository;
}

/**
 * Creates the appropriate repository implementations based on configuration.
 *
 * Fallback (demo / no Supabase env):
 *   Returns localStorage-backed repos. No network calls. Always works.
 *
 * Supabase mode (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set and valid):
 *   Returns Supabase-backed repos. Uses anon key + RLS policies.
 *   No service role key. No tenant bypass.
 */
export function createPhase16aRepositories(
  supabase: SupabaseClient | null,
  isConfigured: boolean,
): Phase16aRepositories {
  if (isConfigured && supabase) {
    return {
      clients: new SupabaseClientRepository(supabase),
      brands: new SupabaseBrandRepository(supabase),
      campaigns: new SupabaseCampaignRepository(supabase),
      briefs: new SupabaseBriefRepository(supabase),
      generations: new SupabaseGenerationRepository(supabase),
      approvals: new SupabaseApprovalRepository(supabase),
      assets: new SupabaseAssetRepository(supabase),
      assetCollections: new SupabaseAssetCollectionRepository(supabase),
    };
  }
  // Fallback — localStorage / demo mode
  return {
    clients: new LocalStorageClientRepository(),
    brands: new LocalStorageBrandRepository(),
    campaigns: new LocalStorageCampaignRepository(),
    briefs: new LocalStorageBriefRepository(),
    generations: new LocalStorageGenerationRepository(),
    approvals: new LocalStorageApprovalRepository(),
    assets: new LocalStorageAssetRepository(),
    assetCollections: new LocalStorageAssetCollectionRepository(),
  };
}
