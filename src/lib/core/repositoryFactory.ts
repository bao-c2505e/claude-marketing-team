// =============================================================================
// THE CORE AGENCY — Repository Factory
// Phase 16A — Supabase CRUD Wiring: Clients + Brands
//
// Returns Supabase-backed repositories when configured,
// localStorage repositories otherwise (demo mode / no env vars).
//
// Phase 16A scope: Clients + Brands only.
// Campaign / Brief / Generation / Approval / etc. wiring is deferred to later phases.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClientRepository, BrandRepository } from './coreRepository';
import { LocalStorageClientRepository, LocalStorageBrandRepository } from './localStorageRepositories';
import { SupabaseClientRepository, SupabaseBrandRepository } from './supabaseRepositories';

export interface Phase16aRepositories {
  clients: ClientRepository;
  brands: BrandRepository;
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
    };
  }
  // Fallback — localStorage / demo mode
  return {
    clients: new LocalStorageClientRepository(),
    brands: new LocalStorageBrandRepository(),
  };
}
