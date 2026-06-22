import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  runCanvaSandboxConnector,
  buildCanvaSandboxAuditLog,
  CANVA_SANDBOX_COPY,
  CANVA_SANDBOX_SAFETY_FLAGS,
} from './canvaSandboxConnector';
import { CANVA_CONTRACT_COPY } from './canvaApprovalContract';
import type { Brand, Campaign, CampaignBrief, Client } from '../../../types/core';

const client: Client = {
  id: 'client-1',
  name: 'Demo Client',
  slug: 'demo-client',
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  status: 'active',
  notes: null,
  created_by: null,
  created_at: '2026-06-17T00:00:00.000Z',
  updated_at: '2026-06-17T00:00:00.000Z',
};

const brand: Brand = {
  id: 'brand-1',
  client_id: client.id,
  name: 'Vị Cuốn',
  slug: 'vi-cuon',
  industry: 'F&B',
  hero_product: 'Gỏi cuốn tôm thịt',
  tone_of_voice: 'Warm and direct',
  target_audience: 'Local diners',
  primary_channels: ['Facebook'],
  brand_colors: { primary: '#8B0000', support: 'cream' },
  logo_url: null,
  status: 'active',
  created_by: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const campaign: Campaign = {
  id: 'campaign-1',
  brand_id: brand.id,
  client_id: client.id,
  name: 'Hè 2026 Launch',
  description: 'Launch campaign',
  campaign_type: '7_day',
  duration_days: 7,
  start_date: null,
  end_date: null,
  status: 'active',
  budget_estimate: null,
  currency: 'VND',
  created_by: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const brief: CampaignBrief = {
  id: 'brief-1',
  campaign_id: campaign.id,
  brand_id: brand.id,
  client_id: client.id,
  brand_name: brand.name,
  hero_product: brand.hero_product,
  industry: brand.industry,
  brief_title: 'Demo Brief',
  campaign_goal: 'Increase awareness',
  product_focus: 'Gỏi cuốn tôm thịt',
  offer: 'Opening combo',
  tone_of_voice: brand.tone_of_voice,
  tone: null,
  target_audience: brand.target_audience,
  campaign_goals: ['branding'],
  key_messages: ['Fresh and fast'],
  channels: ['Facebook'],
  content_pillars: ['Product'],
  must_include: 'Address',
  must_avoid: 'Unverified claims',
  competitors: null,
  reference_links: null,
  budget_note: null,
  timeline_note: null,
  approval_requirements: 'Owner approval required',
  duration_days: 7,
  additional_notes: null,
  status: 'approved_for_generation',
  submitted_by: null,
  submitted_at: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const input = {
  client,
  brand,
  campaign,
  brief,
  requestedBy: 'owner@example.com',
  options: {
    planLengthDays: 7 as const,
    channel: 'Facebook' as const,
    goal: 'branding' as const,
  },
};

// Any copy that would falsely *affirm* a real-world / Canva execution happened.
// Phrased to match affirmative claims only — never the negated safety copy the
// connector intentionally emits ("Nothing was published", "No Canva design was
// created").
const unsafeExecutionCopy =
  /(design (created|generated) on canva|real canva design|successfully published|has been published|is now live|published live|went live|ads? (launched|are live)|spent budget|generated an image|image was generated)/i;

describe('canvaSandboxConnector', () => {
  beforeEach(() => {
    // Trip wire: the sandbox connector must NEVER touch the network.
    vi.stubGlobal('fetch', vi.fn());
  });

  it('produces a sandbox-mode result with one preview per supported format', () => {
    const result = runCanvaSandboxConnector(input);

    expect(result.mode).toBe('sandbox');
    expect(result.connector_type).toBe('canva');
    expect(result.previews).toHaveLength(5);
    const formats = result.previews.map(p => p.format).sort();
    expect(formats).toEqual(['facebook_post', 'menu_a5', 'story', 'tiktok_cover', 'zalo_post']);
    // Every preview carries the brand/campaign and the mock spec fields.
    expect(result.previews.every(p => p.brand_name === 'Vị Cuốn')).toBe(true);
    expect(result.previews.every(p => p.campaign_name === 'Hè 2026 Launch')).toBe(true);
    expect(result.previews.every(p => p.preview_status === 'sandbox_preview_only')).toBe(true);
  });

  it('NEVER calls the real Canva API or any external URL', () => {
    runCanvaSandboxConnector(input);
    // No network call at all in sandbox mode.
    expect(fetch).not.toHaveBeenCalled();

    // No real Canva endpoint / link appears anywhere in the output.
    const result = runCanvaSandboxConnector(input);
    const blob = JSON.stringify(result);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/https?:\/\//i);
    // Design references are explicitly fake, not real Canva ids.
    expect(result.previews.every(p => p.sandbox_design_ref.startsWith('sandbox-canva-'))).toBe(true);
    expect(result.previews.every(p => p.mock_canva_design_id.startsWith('MOCK-CANVA-'))).toBe(true);
  });

  it('does NOT require a CANVA_API_KEY / token to run', () => {
    // No Canva env stubbed at all — it must still produce previews offline.
    expect(import.meta.env.CANVA_API_KEY).toBeUndefined();
    expect(import.meta.env.VITE_CANVA_API_KEY).toBeUndefined();
    const result = runCanvaSandboxConnector(input);
    expect(result.previews).toHaveLength(5);
  });

  it('lands sandbox output as needs_review approval items (never auto-approved/published)', () => {
    const result = runCanvaSandboxConnector(input);

    expect(result.items).toHaveLength(5);
    expect(result.items.every(i => i.content_type === 'canva_sandbox_preview')).toBe(true);
    // Approval-first: review-gated. Ceiling for sandbox alone is the queue.
    expect(result.items.every(i => i.status === 'needs_review')).toBe(true);
    // A sandbox run can never itself reach a terminal external-world state.
    expect(result.items.some(i => i.status === 'published')).toBe(false);
    expect(result.items.some(i => i.status === 'scheduled')).toBe(false);
    expect(result.job.status).toBe('completed');
    expect(result.job.generation_mode).toBe('mock');
    expect(result.job.item_count).toBe(5);
  });

  it('embeds the required sandbox safety copy in every item', () => {
    const result = runCanvaSandboxConnector(input);

    for (const item of result.items) {
      expect(item.caption).toContain(CANVA_SANDBOX_COPY.title);
      expect(item.caption).toContain(CANVA_SANDBOX_COPY.noDesign);
      expect(item.caption).toContain(CANVA_SANDBOX_COPY.noPublish);
      expect(item.caption).toContain(CANVA_SANDBOX_COPY.approvalRequired);
      expect(item.caption).toContain('mode: sandbox');
      expect(item.caption).toContain('no_live_canva_api=true');
      expect(item.caption).toContain('no_publish=true');
      expect(item.caption).toContain('preview_status: sandbox_preview_only');
      // No false claim of a real Canva design / publish / launch.
      expect(unsafeExecutionCopy.test(item.caption)).toBe(false);
    }
  });

  it('keeps the mirrored contract copy in sync with the sandbox copy', () => {
    expect(CANVA_CONTRACT_COPY.title).toBe(CANVA_SANDBOX_COPY.title);
    expect(CANVA_CONTRACT_COPY.noDesign).toBe(CANVA_SANDBOX_COPY.noDesign);
    expect(CANVA_CONTRACT_COPY.noPublish).toBe(CANVA_SANDBOX_COPY.noPublish);
    expect(CANVA_CONTRACT_COPY.approvalRequired).toBe(CANVA_SANDBOX_COPY.approvalRequired);
  });

  it('carries a sandbox approval contract on every preview (never published, no real action)', () => {
    const result = runCanvaSandboxConnector(input);
    for (const preview of result.previews) {
      const c = preview.approval_contract;
      expect(c.connector).toBe('canva');
      expect(c.mode).toBe('sandbox');
      expect(c.preview_status).toBe('sandbox_preview_only');
      expect(c.approval_status).toBe('needs_review');
      expect(c.publish_status).toBe('not_published');
      expect(c.real_connector_action).toBe('none');
      expect(c.safety_flags).toMatchObject({
        no_live_canva_api: true,
        no_publish: true,
        approval_required: true,
      });
    }
    // The contract fields are embedded in the queue item caption.
    for (const item of result.items) {
      expect(item.caption).toContain('publish_status: not_published');
      expect(item.caption).toContain('real_connector_action: none');
      expect(item.caption).toContain('approval_status: needs_review');
      expect(item.caption).toContain('Internal approval only');
    }
  });

  it('carries immutable sandbox safety flags on every preview', () => {
    const result = runCanvaSandboxConnector(input);
    expect(CANVA_SANDBOX_SAFETY_FLAGS).toMatchObject({
      no_live_canva_api: true,
      no_publish: true,
      approval_required: true,
      no_real_design_created: true,
      no_image_generation: true,
      no_secrets: true,
    });
    expect(result.previews.every(p => p.safety_flags.no_live_canva_api === true)).toBe(true);
    expect(result.previews.every(p => p.safety_flags.no_publish === true)).toBe(true);
    expect(result.previews.every(p => p.safety_flags.approval_required === true)).toBe(true);
  });

  it('builds an audit-trail log entry describing the sandbox action', () => {
    const result = runCanvaSandboxConnector(input);
    const log = buildCanvaSandboxAuditLog(input, result);

    expect(log.log_type).toBe('connector');
    expect(log.source).toBe('connector');
    expect(log.related_connector_id).toBe('conn-canva');
    expect(log.message).toContain(CANVA_SANDBOX_COPY.noDesign);
    expect(log.message).toContain(CANVA_SANDBOX_COPY.noPublish);
    expect(log.payload_preview).toContain('"mode":"sandbox"');
    expect(log.payload_preview).toContain('"no_live_canva_api":true');
    expect(unsafeExecutionCopy.test(log.message)).toBe(false);
  });
});
