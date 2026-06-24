import { describe, expect, it } from 'vitest';
import {
  buildManualPublishingChecklist,
  renderManualPublishingChecklistText,
  MANUAL_PUBLISHING_SAFETY_NOTICE,
  MANUAL_PUBLISHING_ONLY_NOTE,
  type ChecklistItem,
  type ManualPublishingChecklist,
} from './manualPublishingChecklist';
import { resolveCampaignPackContext, collectCampaignPackItems } from './campaignPack';
import { APPROVED_NOT_PUBLISHED_REMINDER } from './brandBrain';
import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalEvent,
} from '../../types/core';
import type { ManualDeliveryMap } from './manualDelivery';

const NOW = new Date('2026-06-24T10:00:00.000Z');

// ---------------------------------------------------------------------------
// Fixtures (fictional FnB/SME brand — CLAUDE.md scope) — mirrors campaignPack.test
// ---------------------------------------------------------------------------

const clients: Client[] = [
  { id: 'cli-1', name: 'Cơm Tấm Bản Khói', contact_name: 'Chị Lan', status: 'active', created_at: '', updated_at: '' } as Client,
];
const brands: Brand[] = [
  {
    id: 'br-1', client_id: 'cli-1', name: 'Bản Khói', slug: 'ban-khoi',
    industry: 'F&B / Cơm tấm', hero_product: 'Cơm tấm sườn',
    target_audience: 'Dân văn phòng quận 1',
    tone_of_voice: 'Thân thiện, ngon miệng',
    primary_channels: ['Facebook', 'TikTok'],
    brand_colors: { primary: '#8B4513', accent: '#F4A300' },
    logo_url: null, created_by: 'owner',
    status: 'active', created_at: '', updated_at: '2026-06-20T00:00:00.000Z',
  } as Brand,
];
const campaigns: Campaign[] = [
  { id: 'cmp-1', client_id: 'cli-1', brand_id: 'br-1', name: 'Tháng 6 Launch', status: 'active', duration_days: 7, created_at: '', updated_at: '' } as Campaign,
];
const briefs: CampaignBrief[] = [
  {
    id: 'brief-1', campaign_id: 'cmp-1',
    product_focus: 'Cơm tấm sườn bì chả',
    target_audience: 'Dân văn phòng quận 1',
    tone_of_voice: 'Thân thiện, ngon miệng',
    content_pillars: ['Món signature', 'Combo & ưu đãi'],
    key_messages: ['Sườn nướng than thật'],
    must_include: 'Ảnh món thật',
    must_avoid: 'Không bịa giá',
    offer: '',
    approval_requirements: 'Owner xác nhận giá',
    additional_notes: '',
    channels: ['Facebook'],
    campaign_goal: 'Tăng nhận diện',
    status: 'approved_for_generation',
    submitted_at: '2026-06-20T00:00:00.000Z',
  } as unknown as CampaignBrief,
];

function makeItem(id: string, contentType: string, caption: string, extra: Partial<ContentPlanItem> = {}): ContentPlanItem {
  return {
    id, generation_job_id: 'job-1', brief_id: 'brief-1', campaign_id: 'cmp-1',
    brand_id: 'br-1', client_id: 'cli-1', day_number: 1, planned_date: null,
    channel: 'Facebook', content_type: contentType, pillar: 'Món signature',
    angle: 'Giới thiệu món', hook: `${id} hook`, caption,
    visual_brief: `${id} visual`, cta: `${id} cta`, hashtags: '#banhkhoi',
    status: 'approved', created_at: '', updated_at: '', ...extra,
  };
}

const contentBody = 'Hôm nay quán có món signature thơm lừng.';
const contentCaption = `${contentBody}\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack\ncontent_type: caption\nsource: n8n`;

const reportBody = 'Tổng quan chiến dịch.\nData source status: Provided (owner cấp), Simulated (demo), Missing, Owner input required.';
const reportCaption = `${reportBody}\n\n---\nReport Draft V1 metadata:\nworkflow_type: report_draft\ncontent_type: report_draft\nsource: n8n`;

const contentItems: ContentPlanItem[] = [
  makeItem('item-content', 'caption', contentCaption),
  makeItem('item-report', 'report_draft', reportCaption),
  makeItem('item-design', 'design_brief', 'Brief thiết kế poster.'),
];

function req(id: string, contentItemId: string, status: ContentApprovalRequest['status'], title: string, campaign_id = 'cmp-1'): ContentApprovalRequest {
  return {
    id, content_item_id: contentItemId, generation_job_id: 'job-1', brief_id: 'brief-1',
    campaign_id, brand_id: 'br-1', client_id: 'cli-1', title, status, priority: 'normal',
    requested_by: 'owner', assigned_to_role: null, due_date: null,
    created_at: '2026-06-24T09:00:00.000Z', updated_at: '2026-06-24T09:30:00.000Z',
    resolved_at: '2026-06-24T09:30:00.000Z',
  };
}

const approvalRequests: ContentApprovalRequest[] = [
  req('appr-content', 'item-content', 'approved', 'Content Day 1'),
  req('appr-report', 'item-report', 'approved', 'Report Draft'),
  req('appr-design', 'item-design', 'approved', 'Design Poster'),
];

const approvalEvents: ContentApprovalEvent[] = [];

const context = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands, briefs });

function collect(items = contentItems, requests = approvalRequests): ReturnType<typeof collectCampaignPackItems> {
  return collectCampaignPackItems({
    campaignId: 'cmp-1',
    contentItems: items,
    approvalRequests: requests,
    approvalEvents,
    deliveryMap: {} as ManualDeliveryMap,
  });
}

function flatItems(cl: ManualPublishingChecklist): ChecklistItem[] {
  return cl.sections.flatMap(s => s.items);
}
function itemById(cl: ManualPublishingChecklist, id: string): ChecklistItem | undefined {
  return flatItems(cl).find(i => i.id === id);
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('buildManualPublishingChecklist — structure', () => {
  it('emits all eight canonical sections in order', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    expect(cl.sections.map(s => s.key)).toEqual([
      'owner_approval',
      'approved_not_published',
      'copy_captions',
      'creative_assets',
      'channel_formatting',
      'manual_publishing_prep',
      'client_handoff',
      'metrics_disclaimer',
    ]);
  });

  it('every item carries the required deterministic fields', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    for (const it of flatItems(cl)) {
      expect(typeof it.id).toBe('string');
      expect(it.label.length).toBeGreaterThan(0);
      expect(it.description.length).toBeGreaterThan(0);
      expect(['ready', 'needs_owner_review', 'blocked', 'manual_action_required']).toContain(it.status);
      expect(['info', 'warning', 'critical']).toContain(it.severity);
      expect(['owner', 'internal_team', 'client']).toContain(it.owner);
      expect(it.action_hint.length).toBeGreaterThan(0);
    }
  });

  it('summary counts add up to total_items', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const s = cl.summary;
    expect(s.ready_count + s.blocked_count + s.needs_owner_review_count + s.manual_action_required_count).toBe(s.total_items);
    expect(s.total_items).toBe(flatItems(cl).length);
  });
});

// ---------------------------------------------------------------------------
// Approved ≠ Published is enforced, never treated as published
// ---------------------------------------------------------------------------

describe('Approved ≠ Published', () => {
  it('an approved pack is ready for MANUAL publishing — never marked published/launched', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    expect(cl.summary.overall_status).toBe('ready_for_manual_publishing');
    // There is no "published"/"launched" status anywhere in the model.
    const statuses = flatItems(cl).map(i => i.status);
    expect(statuses).not.toContain('published');
    expect(statuses).not.toContain('launched');
  });

  it('carries an explicit Approved ≠ Published safety item + summary notice', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const anp = itemById(cl, 'anp_internal_only')!;
    expect(anp.status).toBe('ready');
    expect(anp.label).toMatch(/not published/i);
    expect(anp.description).toBe(APPROVED_NOT_PUBLISHED_REMINDER);
    expect(cl.summary.safety_notice).toBe(MANUAL_PUBLISHING_SAFETY_NOTICE);
    expect(cl.summary.safety_notice).toMatch(/Approved ≠ Published/);
    expect(cl.summary.safety_notice).toMatch(/manually/i);
  });
});

// ---------------------------------------------------------------------------
// Missing owner approval blocks readiness
// ---------------------------------------------------------------------------

describe('Owner approval gating', () => {
  it('blocks readiness when there are no approved deliverables', () => {
    const cl = buildManualPublishingChecklist({ context, items: [], approvalRequests: [], now: NOW });
    expect(cl.summary.overall_status).toBe('blocked');
    expect(cl.summary.blocked_count).toBeGreaterThan(0);
    expect(itemById(cl, 'owner_approval_all')!.status).toBe('blocked');
  });

  it('downgrades to needs-review when items are still pending approval', () => {
    const pendingReq = req('appr-pending', 'item-extra', 'submitted', 'Pending item');
    const cl = buildManualPublishingChecklist({
      context, items: collect(), approvalRequests: [...approvalRequests, pendingReq], now: NOW,
    });
    expect(itemById(cl, 'owner_approval_pending')!.status).toBe('needs_owner_review');
    expect(cl.summary.overall_status).toBe('needs_review_before_manual_publishing');
  });
});

// ---------------------------------------------------------------------------
// Missing captions / assets → needs_review or blocked
// ---------------------------------------------------------------------------

describe('Copy & creative gating', () => {
  it('blocks when a copy deliverable has no caption text', () => {
    const items = [
      makeItem('item-content', 'caption', '\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack'),
    ];
    const requests = [req('appr-content', 'item-content', 'approved', 'Empty caption')];
    const cl = buildManualPublishingChecklist({ context, items: collect(items, requests), approvalRequests: requests, now: NOW });
    expect(itemById(cl, 'copy_present')!.status).toBe('blocked');
    expect(cl.summary.overall_status).toBe('blocked');
  });

  it('flags design briefs for review when the brief / visual direction is empty', () => {
    const items = [makeItem('item-design', 'design_brief', '', { visual_brief: '' })];
    const requests = [req('appr-design', 'item-design', 'approved', 'Empty design')];
    const cl = buildManualPublishingChecklist({ context, items: collect(items, requests), approvalRequests: requests, now: NOW });
    expect(itemById(cl, 'creative_briefs')!.status).toBe('needs_owner_review');
    expect(cl.summary.overall_status).toBe('needs_review_before_manual_publishing');
  });

  it('always requires final creative to be produced & attached manually (briefs/specs only)', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const attach = itemById(cl, 'creative_assets_attach')!;
    expect(attach.status).toBe('manual_action_required');
    expect(attach.description).toMatch(/never generates real images or video/i);
  });
});

// ---------------------------------------------------------------------------
// Metrics & claims disclaimer
// ---------------------------------------------------------------------------

describe('Metrics & claims disclaimer', () => {
  it('always carries a no-fabricated-metrics disclaimer (metrics absent)', () => {
    const items = [makeItem('item-content', 'caption', contentCaption)];
    const requests = [req('appr-content', 'item-content', 'approved', 'Content only')];
    const cl = buildManualPublishingChecklist({ context, items: collect(items, requests), approvalRequests: requests, now: NOW });
    const disc = itemById(cl, 'metrics_no_fabrication')!;
    expect(disc.description).toMatch(/Provided \/ Simulated \/ Missing \/ Owner input required/);
    expect(itemById(cl, 'metrics_report_labels')!.status).toBe('ready'); // no reports → nothing to verify
  });

  it('requires verifying report data labels when a report draft is in the pack (simulated/provided)', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const labels = itemById(cl, 'metrics_report_labels')!;
    expect(labels.status).toBe('manual_action_required');
    expect(labels.description).toMatch(/never present simulated data as real/i);
  });
});

// ---------------------------------------------------------------------------
// Channel formatting
// ---------------------------------------------------------------------------

describe('Channel formatting', () => {
  it('lists the deliverables\' channels as a manual verification step', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const ch = itemById(cl, 'channel_format')!;
    expect(ch.status).toBe('manual_action_required');
    expect(ch.source_label).toContain('Facebook');
  });

  it('falls back to brand channels when no item channel is set', () => {
    const items = [makeItem('item-content', 'caption', contentCaption, { channel: '' })];
    const requests = [req('appr-content', 'item-content', 'approved', 'No channel')];
    const cl = buildManualPublishingChecklist({ context, items: collect(items, requests), approvalRequests: requests, now: NOW });
    expect(itemById(cl, 'channel_format')!.source_label).toContain('TikTok');
  });
});

// ---------------------------------------------------------------------------
// Manual publishing prep — no automation wording
// ---------------------------------------------------------------------------

describe('Manual publishing prep + safety regression', () => {
  it('frames publishing as a manual-only human step', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const pub = itemById(cl, 'prep_publish')!;
    expect(pub.status).toBe('manual_action_required');
    expect(pub.description).toContain(MANUAL_PUBLISHING_ONLY_NOTE);
  });

  it('never implies automated publishing / launching / spend (no connector/env/webhook assumptions)', () => {
    const serialized = JSON.stringify(buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW }));
    const forbidden = [
      /publish now/i,
      /auto[-\s]?publish/i,
      /run ads/i,
      /launch campaign/i,
      /(?<!no |never |ad )auto[-\s]?post/i, // bare/affirmative auto-post (negated forms allowed)
      /\bwebhook\b/i,
      /https?:\/\//i,
      /OAuth|access_token|api_key/i,
      /posted to (facebook|tiktok|zalo|instagram|google)/i,
    ];
    for (const re of forbidden) expect(serialized).not.toMatch(re);
  });
});

// ---------------------------------------------------------------------------
// renderManualPublishingChecklistText
// ---------------------------------------------------------------------------

describe('renderManualPublishingChecklistText', () => {
  it('renders a copyable checklist carrying the safety + manual-only notices', () => {
    const cl = buildManualPublishingChecklist({ context, items: collect(), approvalRequests, now: NOW });
    const text = renderManualPublishingChecklistText(cl, 'Bản Khói — Tháng 6 Launch');
    expect(text).toContain('MANUAL PUBLISHING CHECKLIST — Bản Khói — Tháng 6 Launch');
    expect(text).toContain(MANUAL_PUBLISHING_SAFETY_NOTICE);
    expect(text).toContain(MANUAL_PUBLISHING_ONLY_NOTE);
    expect(text).toContain('## Owner Approval');
    expect(text).toContain('## Metrics & Claims Disclaimer');
    expect(text).toMatch(/Overall: Ready for manual publishing/);
  });
});
