// =============================================================================
// THE CORE AGENCY — Repository Routing Gates
// Phase 17 — End-to-end Workflow Test
//
// Pure predicates extracted VERBATIM from App.tsx's assetRepoFor() /
// approvalRepoFor() (Phase 16C-2 / 16D + Codex fix rounds) so the UUID-gating
// rules can be unit-tested directly. Behavior is unchanged: App.tsx combines
// these with isSupabaseConfigured to pick the Supabase repo vs the
// localStorage fallback per operation.
//
// Safety contract (must never be weakened):
// - Local-format ids (client-*/brand-*/campaign-*/brief-*/generation-*/job-*/
//   item-*/approval-*/ast-*/asset-*/col-*/collection-*/asset-collection-*)
//   must NEVER be sent into a Supabase UUID column.
// - Asset gate: clientId + brandId must be valid UUIDs; every optional scope
//   id (campaign/brief/generation/contentItem/assetCollection/
//   currentAssetCollection) is only safe when null/undefined ("absent") or a
//   valid UUID; assetId, when used by the operation, must be a valid UUID.
// - Codex Fix Round 2 (2026-06-11): BOTH the asset's CURRENT
//   asset_collection_id and the NEXT (post-patch) collection id are gated on
//   edit — a local current-collection id keeps the operation on localStorage
//   even when the patch changes the collection to null or a valid UUID.
// - Approval gate: all 5 tenant-scope ids are required valid UUIDs;
//   approvalId/contentItemId are gated whenever the operation uses them.
// =============================================================================

import { isUuid } from './coreData';

/** True when an optional scope id is absent (null/undefined) or a valid UUID. */
export const okOrAbsentUuid = (v?: string | null): boolean =>
  v === undefined || v === null || isUuid(v);

export interface AssetRouteIds {
  clientId: string | null;
  brandId: string | null;
  campaignId?: string | null;
  briefId?: string | null;
  generationId?: string | null;
  contentItemId?: string | null;
  assetCollectionId?: string | null;
  currentAssetCollectionId?: string | null;
  assetId?: string;
}

/**
 * Asset Library routing gate (Phase 16D + Codex fix rounds 1–2).
 * Returns true only when every id the operation touches is Supabase-safe.
 * Callers must additionally require isSupabaseConfigured before selecting
 * the Supabase repository.
 */
export function assetScopeIsSupabaseSafe(ids: AssetRouteIds): boolean {
  return (
    isUuid(ids.clientId)
    && isUuid(ids.brandId)
    && okOrAbsentUuid(ids.campaignId)
    && okOrAbsentUuid(ids.briefId)
    && okOrAbsentUuid(ids.generationId)
    && okOrAbsentUuid(ids.contentItemId)
    && okOrAbsentUuid(ids.assetCollectionId)
    && okOrAbsentUuid(ids.currentAssetCollectionId)
    && (ids.assetId === undefined || isUuid(ids.assetId))
  );
}

export interface ApprovalRouteIds {
  clientId: string | null;
  brandId: string | null;
  campaignId: string | null;
  briefId: string | null;
  generationId: string | null;
  approvalId?: string | null;
  contentItemId?: string | null;
}

/**
 * Approval routing gate (Phase 16C-2 + Codex fix round).
 * All 5 tenant-scope ids are required valid UUIDs; approvalId/contentItemId
 * are validated whenever the operation passes them. Callers must additionally
 * require isSupabaseConfigured before selecting the Supabase repository.
 */
export function approvalScopeIsSupabaseSafe(ids: ApprovalRouteIds): boolean {
  return (
    isUuid(ids.clientId)
    && isUuid(ids.brandId)
    && isUuid(ids.campaignId)
    && isUuid(ids.briefId)
    && isUuid(ids.generationId)
    && (ids.approvalId === undefined || isUuid(ids.approvalId))
    && (ids.contentItemId === undefined || isUuid(ids.contentItemId))
  );
}
