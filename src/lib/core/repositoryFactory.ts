// =============================================================================
// THE CORE AGENCY — Repository Factory
// Phase 16A — Supabase CRUD Wiring: Clients + Brands
// Phase 16B-1 — Supabase CRUD Wiring: Campaigns
// Phase 16B-2 — Supabase CRUD Wiring: Campaign Briefs
// Phase 16C-1 — Supabase CRUD Wiring: Content Plan Generation
//
// Returns Supabase-backed repositories when configured,
// localStorage repositories otherwise (demo mode / no env vars).
//
// Calendar / Approval / Reports / Asset Library / etc. wiring is deferred to
// later phases.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClientRepository, BrandRepository, CampaignRepository, BriefRepository, GenerationRepository, ApprovalRepository } from './coreRepository';
import {
  LocalStorageClientRepository,
  LocalStorageBrandRepository,
  LocalStorageCampaignRepository,
  LocalStorageBriefRepository,
  LocalStorageGenerationRepository,
  LocalStorageApprovalRepository,
} from './localStorageRepositories';
import {
  SupabaseClientRepository,
  SupabaseBrandRepository,
  SupabaseCampaignRepository,
  SupabaseBriefRepository,
  SupabaseGenerationRepository,
  SupabaseApprovalRepository,
} from './supabaseRepositories';

export interface Phase16aRepositories {
  clients: ClientRepository;
  brands: BrandRepository;
  campaigns: CampaignRepository;
  briefs: BriefRepository;
  generations: GenerationRepository;
  approvals: ApprovalRepository;
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
  };
}
