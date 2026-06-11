// =============================================================================
// THE CORE AGENCY — Repository Patch Sanitizers: Unit Tests
// Phase 17 — End-to-end Workflow Test
//
// Covers the pure patch-sanitizing guards that protect tenant/scope safety on
// update() patches: a dynamically-built patch (snake_case or camelCase) can
// never reassign identity/tenant-scope/audit fields.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { sanitizeAssetPatch, sanitizeGenerationPatch, sanitizeBriefPatch } from './coreRepository';
import { isUuid, generateId } from './coreData';
import type { AssetApprovalStatus, ContentPlanJobStatus } from '../../types/core';

describe('sanitizeAssetPatch', () => {
  it('strips identity/tenant/audit fields (snake_case and camelCase) but keeps editable fields', () => {
    const patch = {
      // editable fields — must survive
      name: 'New name',
      tags: ['summer', 'promo'],
      notes: 'Updated notes',
      approval_status: 'approved' as AssetApprovalStatus,
      asset_collection_id: 'collection-uuid',
      // immutable — snake_case
      id: 'asset-uuid',
      client_id: 'client-uuid',
      brand_id: 'brand-uuid',
      campaign_id: 'campaign-uuid',
      brief_id: 'brief-uuid',
      generation_job_id: 'gen-uuid',
      content_item_id: 'item-uuid',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      created_by: 'user-uuid',
      // immutable — camelCase aliases
      clientId: 'client-uuid',
      brandId: 'brand-uuid',
      campaignId: 'campaign-uuid',
      briefId: 'brief-uuid',
      generationJobId: 'gen-uuid',
      generationId: 'gen-uuid',
      contentItemId: 'item-uuid',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-uuid',
      // defensive (not current AssetItem columns)
      uploaded_by: 'user-uuid',
      uploadedBy: 'user-uuid',
      approval_request_id: 'req-uuid',
      approvalRequestId: 'req-uuid',
      tenant_id: 'tenant-uuid',
      tenantId: 'tenant-uuid',
      owner_id: 'owner-uuid',
      ownerId: 'owner-uuid',
    };

    const result = sanitizeAssetPatch(patch) as Record<string, unknown>;

    // editable fields preserved
    expect(result.name).toBe('New name');
    expect(result.tags).toEqual(['summer', 'promo']);
    expect(result.notes).toBe('Updated notes');
    expect(result.approval_status).toBe('approved');
    // moving an asset between collections is a normal edit — must NOT be stripped
    expect(result.asset_collection_id).toBe('collection-uuid');

    // immutable fields stripped
    for (const key of [
      'id',
      'client_id', 'clientId',
      'brand_id', 'brandId',
      'campaign_id', 'campaignId',
      'brief_id', 'briefId',
      'generation_job_id', 'generationJobId', 'generationId',
      'content_item_id', 'contentItemId',
      'created_at', 'createdAt',
      'updated_at', 'updatedAt',
      'created_by', 'createdBy',
      'uploaded_by', 'uploadedBy',
      'approval_request_id', 'approvalRequestId',
      'tenant_id', 'tenantId',
      'owner_id', 'ownerId',
    ]) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it('does not mutate the input patch', () => {
    const patch = { name: 'Keep', client_id: 'client-uuid' };
    sanitizeAssetPatch(patch);
    expect(patch).toHaveProperty('client_id');
  });
});

describe('sanitizeGenerationPatch', () => {
  it('strips identity/tenant/audit fields (snake_case and camelCase) but keeps status', () => {
    const patch = {
      // editable
      status: 'completed' as ContentPlanJobStatus,
      item_count: 5,
      error_message: null,
      // immutable — snake_case
      id: 'job-uuid',
      client_id: 'client-uuid',
      brand_id: 'brand-uuid',
      campaign_id: 'campaign-uuid',
      brief_id: 'brief-uuid',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      requested_by: 'user-uuid',
      submitted_by: 'user-uuid',
      submitted_at: '2026-01-01T00:00:00Z',
      // immutable — camelCase aliases
      clientId: 'client-uuid',
      brandId: 'brand-uuid',
      campaignId: 'campaign-uuid',
      briefId: 'brief-uuid',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      requestedBy: 'user-uuid',
      submittedBy: 'user-uuid',
      submittedAt: '2026-01-01T00:00:00Z',
    };

    const result = sanitizeGenerationPatch(patch) as Record<string, unknown>;

    expect(result.status).toBe('completed');
    expect(result.item_count).toBe(5);
    expect(result.error_message).toBeNull();

    for (const key of [
      'id',
      'client_id', 'clientId',
      'brand_id', 'brandId',
      'campaign_id', 'campaignId',
      'brief_id', 'briefId',
      'created_at', 'createdAt',
      'updated_at', 'updatedAt',
      'requested_by', 'requestedBy',
      'submitted_by', 'submittedBy',
      'submitted_at', 'submittedAt',
    ]) {
      expect(result).not.toHaveProperty(key);
    }
  });
});

describe('sanitizeBriefPatch', () => {
  it('strips id/tenant/audit fields but keeps content fields', () => {
    const patch = {
      // editable
      brief_title: 'New title',
      status: 'submitted',
      // immutable
      id: 'brief-uuid',
      client_id: 'client-uuid',
      brand_id: 'brand-uuid',
      campaign_id: 'campaign-uuid',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      submitted_by: 'user-uuid',
      submitted_at: '2026-01-01T00:00:00Z',
    } as unknown as Record<string, unknown>;

    const result = sanitizeBriefPatch(patch as never) as Record<string, unknown>;

    expect(result.brief_title).toBe('New title');
    expect(result.status).toBe('submitted');

    for (const key of [
      'id', 'client_id', 'brand_id', 'campaign_id',
      'created_at', 'updated_at', 'submitted_by', 'submitted_at',
    ]) {
      expect(result).not.toHaveProperty(key);
    }
  });
});

describe('isUuid', () => {
  it('returns true for a valid UUID', () => {
    expect(isUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('returns false for a local-format id', () => {
    expect(isUuid('client-1718000000-abcde')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isUuid(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUuid(null)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isUuid('')).toBe(false);
  });
});

describe('generateId', () => {
  it('produces an id prefixed with the given prefix', () => {
    const id = generateId('col');
    expect(id.startsWith('col-')).toBe(true);
  });

  it('never produces a string that passes isUuid (safe to gate on)', () => {
    const id = generateId('asset-collection');
    expect(isUuid(id)).toBe(false);
  });
});
