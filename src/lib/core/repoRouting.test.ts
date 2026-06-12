// =============================================================================
// THE CORE AGENCY — Repository Routing Gates: Unit Tests
// Phase 17 — End-to-end Workflow Test
//
// Covers the UUID-gating predicates extracted in repoRouting.ts:
// - okOrAbsentUuid: optional-scope-id gate (absent or valid UUID)
// - assetScopeIsSupabaseSafe: Asset Library routing gate (incl. Codex Fix
//   Round 2 current-vs-next asset_collection_id gating)
// - approvalScopeIsSupabaseSafe: Approval routing gate
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  okOrAbsentUuid,
  assetScopeIsSupabaseSafe,
  approvalScopeIsSupabaseSafe,
  type AssetRouteIds,
  type ApprovalRouteIds,
} from './repoRouting';

// Valid v4-shaped UUIDs (third group starts with 4, fourth group starts with 8)
const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';
const UUID_C = '33333333-3333-4333-8333-333333333333';
const UUID_D = '44444444-4444-4444-8444-444444444444';
const UUID_E = '55555555-5555-4555-8555-555555555555';
const UUID_F = '66666666-6666-4666-8666-666666666666';
const UUID_G = '77777777-7777-4777-8777-777777777777';
const UUID_H = '88888888-8888-4888-8888-888888888888';

const fullAssetIds: AssetRouteIds = {
  clientId: UUID_A,
  brandId: UUID_B,
  campaignId: UUID_C,
  briefId: UUID_D,
  generationId: UUID_E,
  contentItemId: UUID_F,
  assetCollectionId: UUID_G,
  currentAssetCollectionId: UUID_G,
  assetId: UUID_H,
};

const fullApprovalIds: ApprovalRouteIds = {
  clientId: UUID_A,
  brandId: UUID_B,
  campaignId: UUID_C,
  briefId: UUID_D,
  generationId: UUID_E,
  approvalId: UUID_F,
  contentItemId: UUID_G,
};

describe('okOrAbsentUuid', () => {
  it('returns true for undefined', () => {
    expect(okOrAbsentUuid(undefined)).toBe(true);
  });

  it('returns true for null', () => {
    expect(okOrAbsentUuid(null)).toBe(true);
  });

  it('returns true for a valid UUID', () => {
    expect(okOrAbsentUuid(UUID_A)).toBe(true);
  });

  it('returns false for a local-format id', () => {
    expect(okOrAbsentUuid('col-1718000000-abcde')).toBe(false);
  });
});

describe('assetScopeIsSupabaseSafe', () => {
  it('returns true when every id in the chain is a valid UUID', () => {
    expect(assetScopeIsSupabaseSafe(fullAssetIds)).toBe(true);
  });

  it('returns false when clientId is local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, clientId: 'client-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when brandId is local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, brandId: 'brand-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns true when all optional scope ids are absent (undefined)', () => {
    expect(
      assetScopeIsSupabaseSafe({ clientId: UUID_A, brandId: UUID_B }),
    ).toBe(true);
  });

  it('returns true when all optional scope ids are explicitly null', () => {
    expect(
      assetScopeIsSupabaseSafe({
        clientId: UUID_A,
        brandId: UUID_B,
        campaignId: null,
        briefId: null,
        generationId: null,
        contentItemId: null,
        assetCollectionId: null,
        currentAssetCollectionId: null,
      }),
    ).toBe(true);
  });

  it('returns false when campaignId is present but local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, campaignId: 'campaign-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when briefId is present but local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, briefId: 'brief-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when generationId is present but local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, generationId: 'generation-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when contentItemId is present but local-format', () => {
    expect(
      assetScopeIsSupabaseSafe({ ...fullAssetIds, contentItemId: 'item-1718000000-abcde' }),
    ).toBe(false);
  });

  it.each(['col-1718000000-abcde', 'collection-1718000000-abcde', 'asset-collection-1718000000-abcde'])(
    'returns false when assetCollectionId is local-format (%s)',
    (localId) => {
      expect(
        assetScopeIsSupabaseSafe({ ...fullAssetIds, assetCollectionId: localId }),
      ).toBe(false);
    },
  );

  it.each(['col-1718000000-abcde', 'collection-1718000000-abcde', 'asset-collection-1718000000-abcde'])(
    'returns false when currentAssetCollectionId is local-format (%s)',
    (localId) => {
      expect(
        assetScopeIsSupabaseSafe({ ...fullAssetIds, currentAssetCollectionId: localId }),
      ).toBe(false);
    },
  );

  it.each(['ast-1718000000-abcde', 'asset-1718000000-abcde'])(
    'returns false when assetId is present but local-format (%s)',
    (localId) => {
      expect(
        assetScopeIsSupabaseSafe({ ...fullAssetIds, assetId: localId }),
      ).toBe(false);
    },
  );

  it('returns true when assetId is absent', () => {
    const { assetId, ...rest } = fullAssetIds;
    expect(assetScopeIsSupabaseSafe(rest)).toBe(true);
  });

  // Codex Fix Round 2 (2026-06-11): a local CURRENT asset_collection_id must
  // keep the operation on localStorage even when the patch's NEXT collection
  // id is null or a valid UUID.
  it('returns false when currentAssetCollectionId is local and next assetCollectionId is null', () => {
    expect(
      assetScopeIsSupabaseSafe({
        ...fullAssetIds,
        currentAssetCollectionId: 'col-1718000000-abcde',
        assetCollectionId: null,
      }),
    ).toBe(false);
  });

  it('returns false when currentAssetCollectionId is local and next assetCollectionId is a valid UUID', () => {
    expect(
      assetScopeIsSupabaseSafe({
        ...fullAssetIds,
        currentAssetCollectionId: 'col-1718000000-abcde',
        assetCollectionId: UUID_G,
      }),
    ).toBe(false);
  });
});

describe('approvalScopeIsSupabaseSafe', () => {
  it('returns true when all 5 tenant-scope ids are valid UUIDs', () => {
    expect(approvalScopeIsSupabaseSafe(fullApprovalIds)).toBe(true);
  });

  it('returns false when clientId is local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, clientId: 'client-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when brandId is local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, brandId: 'brand-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when campaignId is local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, campaignId: 'campaign-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when briefId is local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, briefId: 'brief-1718000000-abcde' }),
    ).toBe(false);
  });

  it.each(['generation-1718000000-abcde', 'job-1718000000-abcde'])(
    'returns false when generationId is local-format (%s)',
    (localId) => {
      expect(
        approvalScopeIsSupabaseSafe({ ...fullApprovalIds, generationId: localId }),
      ).toBe(false);
    },
  );

  it('returns true when approvalId and contentItemId are absent', () => {
    const { approvalId, contentItemId, ...rest } = fullApprovalIds;
    expect(approvalScopeIsSupabaseSafe(rest)).toBe(true);
  });

  it('returns false when approvalId is present but local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, approvalId: 'approval-1718000000-abcde' }),
    ).toBe(false);
  });

  it('returns false when contentItemId is present but local-format', () => {
    expect(
      approvalScopeIsSupabaseSafe({ ...fullApprovalIds, contentItemId: 'item-1718000000-abcde' }),
    ).toBe(false);
  });
});
