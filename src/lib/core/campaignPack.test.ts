import { describe, expect, it } from 'vitest';
import {
  resolveCampaignPackContext,
  collectCampaignPackItems,
  campaignModuleBreakdown,
  buildCampaignPack,
  campaignPackFileStem,
  CAMPAIGN_PACK_SAFETY_NOTE,
  CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED,
  CAMPAIGN_PACK_MANUALLY_POSTED_NOTE,
  type CampaignPackItem,
} from './campaignPack';
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
// Fixtures (fictional FnB/SME brand — CLAUDE.md scope)
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
    primary_channels: ['Facebook'],
    brand_colors: { primary: '#8B4513', accent: '#F4A300' },
    logo_url: null, created_by: 'owner',
    status: 'active', created_at: '', updated_at: '2026-06-20T00:00:00.000Z',
  } as Brand,
];
const campaigns: Campaign[] = [
  { id: 'cmp-1', client_id: 'cli-1', brand_id: 'br-1', name: 'Tháng 6 Launch', status: 'active', duration_days: 7, created_at: '', updated_at: '' } as Campaign,
  { id: 'cmp-2', client_id: 'cli-1', brand_id: 'br-1', name: 'Khác', status: 'active', duration_days: 7, created_at: '', updated_at: '' } as Campaign,
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
const contentCaption = `${contentBody}\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack\ncontent_type: caption\nsource: n8n\ngeneration_mode: external_module\nsafety: no_auto_post=true`;

const reportBody = 'Tổng quan chiến dịch.\nData source status: Provided (owner cấp), Simulated (demo), Missing, Owner input required.';
const reportCaption = `${reportBody}\n\n---\nReport Draft V1 metadata:\nworkflow_type: report_draft\ncontent_type: report_draft\nsource: n8n`;

const contentItems: ContentPlanItem[] = [
  makeItem('item-content', 'caption', contentCaption),
  makeItem('item-report', 'report_draft', reportCaption),
  makeItem('item-design', 'design_brief', 'Brief thiết kế poster.'),
  // Belongs to a DIFFERENT campaign — must never leak into cmp-1's pack.
  makeItem('item-other', 'caption', 'Khác', { id: 'item-other', campaign_id: 'cmp-2' }),
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
  req('appr-pending', 'item-content', 'submitted', 'Pending item'),
  req('appr-rejected', 'item-design', 'rejected', 'Rejected item'),
  req('appr-other', 'item-other', 'approved', 'Other campaign item', 'cmp-2'),
];

function evt(id: string, requestId: string, action: ContentApprovalEvent['action'], actor: string, at: string): ContentApprovalEvent {
  return {
    id, approval_request_id: requestId, content_item_id: 'x', action,
    actor_label: actor, comment: null, previous_status: 'submitted', new_status: 'approved', created_at: at,
  };
}

const approvalEvents: ContentApprovalEvent[] = [
  evt('e1', 'appr-content', 'submitted', 'owner', '2026-06-24T09:00:00.000Z'),
  evt('e2', 'appr-content', 'approved', 'Chị Lan (Owner)', '2026-06-24T09:30:00.000Z'),
];

const collectParams = {
  campaignId: 'cmp-1',
  contentItems,
  approvalRequests,
  approvalEvents,
  deliveryMap: {} as ManualDeliveryMap,
};

// ---------------------------------------------------------------------------
// resolveCampaignPackContext — brand-context cover
// ---------------------------------------------------------------------------

describe('resolveCampaignPackContext', () => {
  it('resolves brand/client and builds an internal/draft-only brand snapshot', () => {
    const ctx = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands, briefs });
    expect(ctx.brand?.name).toBe('Bản Khói');
    expect(ctx.client?.name).toBe('Cơm Tấm Bản Khói');
    expect(ctx.snapshot).not.toBeNull();
    expect(ctx.snapshot!.content_pillars).toContain('Món signature');
    expect(ctx.snapshot!.creative_donts).toContain('Không bịa giá');
    // Provenance/lifecycle stays internal & draft-only — never a published state.
    expect(ctx.snapshot!.draft_only).toBe(true);
    expect(ctx.snapshot!.internal_only).toBe(true);
    expect(ctx.snapshot!.source).toBe('internal');
  });

  it('only carries briefs for the chosen campaign', () => {
    const ctx = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands, briefs });
    expect(ctx.briefs.every(b => b.campaign_id === 'cmp-1')).toBe(true);
  });

  it('returns a null snapshot when the brand cannot be resolved', () => {
    const ctx = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands: [], briefs });
    expect(ctx.brand).toBeNull();
    expect(ctx.snapshot).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// collectCampaignPackItems
// ---------------------------------------------------------------------------

describe('collectCampaignPackItems', () => {
  it('includes ONLY approved requests for the chosen campaign (never pending/rejected/other-campaign)', () => {
    const out = collectCampaignPackItems(collectParams);
    const ids = out.map(c => c.approvalId).sort();
    expect(ids).toEqual(['appr-content', 'appr-design', 'appr-report']);
    expect(out.some(c => c.approvalId === 'appr-other')).toBe(false);
  });

  it('classifies module from caption metadata / content_type', () => {
    const byId = Object.fromEntries(collectCampaignPackItems(collectParams).map(c => [c.approvalId, c.module]));
    expect(byId['appr-content']).toBe('content');
    expect(byId['appr-report']).toBe('report');
    expect(byId['appr-design']).toBe('design');
  });

  it('attaches approval provenance from the audit log (Phase P)', () => {
    const c = collectCampaignPackItems(collectParams).find(x => x.approvalId === 'appr-content')!;
    expect(c.provenance?.actorLabel).toBe('Chị Lan (Owner)');
    expect(c.provenance?.at).toBe('2026-06-24T09:30:00.000Z');
  });

  it('falls back to resolved_at provenance when no approval event exists', () => {
    const c = collectCampaignPackItems(collectParams).find(x => x.approvalId === 'appr-design')!;
    expect(c.provenance?.actorLabel).toBe('Owner');
    expect(c.provenance?.at).toBe('2026-06-24T09:30:00.000Z');
  });

  it('reads manual-delivery status/note/link from the Phase E map', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'Đăng FB hôm qua', link: 'https://fb.com/post/1', updatedAt: NOW.toISOString(), updatedBy: 'owner' },
    };
    const c = collectCampaignPackItems({ ...collectParams, deliveryMap }).find(x => x.approvalId === 'appr-content')!;
    expect(c.deliveryStatus).toBe('manually_posted');
    expect(c.deliveryNote).toBe('Đăng FB hôm qua');
    expect(c.deliveryLink).toBe('https://fb.com/post/1');
  });
});

describe('campaignModuleBreakdown', () => {
  it('counts per module in canonical order', () => {
    const bd = campaignModuleBreakdown(collectCampaignPackItems(collectParams));
    expect(bd.map(b => b.module)).toEqual(['content', 'design', 'report']);
    expect(bd.every(b => b.count === 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildCampaignPack
// ---------------------------------------------------------------------------

describe('buildCampaignPack', () => {
  const context = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands, briefs });
  const items = collectCampaignPackItems(collectParams);

  it('always carries verbatim Approved≠Published + internal-pack safety copy', () => {
    const pack = buildCampaignPack({ context, items, title: 'June Pack', format: 'markdown', generatedBy: 'Owner', now: NOW });
    expect(pack.content).toContain(CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED);
    expect(pack.content).toContain(CAMPAIGN_PACK_SAFETY_NOTE);
    expect(pack.content).toContain(APPROVED_NOT_PUBLISHED_REMINDER);
    expect(pack.itemCount).toBe(3);
  });

  it('renders a Brand Context cover from the snapshot', () => {
    const pack = buildCampaignPack({ context, items, title: 'June Pack', format: 'markdown', generatedBy: 'Owner', now: NOW });
    expect(pack.content).toContain('## Brand Context');
    expect(pack.content).toContain('Món signature');     // content pillar
    expect(pack.content).toContain("Creative don't");
    expect(pack.content).toContain('Không bịa giá');     // creative don't
  });

  it('renders per-item approval provenance (Approved by …)', () => {
    const pack = buildCampaignPack({ context, items, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('**Approved by:** Chị Lan (Owner)');
  });

  it('includes module sections and uses the clean caption body (no metadata leaked)', () => {
    const pack = buildCampaignPack({ context, items, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('Approved Content Items');
    expect(pack.content).toContain('Report Drafts');
    expect(pack.content).toContain('Design Briefs');
    expect(pack.content).toContain(contentBody);
    expect(pack.content).not.toContain('workflow_type: content_pack');
    expect(pack.content).not.toContain('generation_mode: external_module');
  });

  it('carries report data-status labels verbatim and invents no metrics', () => {
    const pack = buildCampaignPack({ context, items, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('Data source status');
    expect(pack.content).toContain('No metrics are invented');
  });

  it('labels a manually-posted item with the verbatim note', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'posted', updatedAt: NOW.toISOString() },
    };
    const it2 = collectCampaignPackItems({ ...collectParams, deliveryMap });
    const pack = buildCampaignPack({ context, items: it2, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain(CAMPAIGN_PACK_MANUALLY_POSTED_NOTE);
  });

  it('never implies publishing / launching / spend / live analytics (safety regression)', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'n', updatedAt: NOW.toISOString() },
    };
    const pack = buildCampaignPack({
      context,
      items: collectCampaignPackItems({ ...collectParams, deliveryMap }),
      title: 'p', format: 'markdown', generatedBy: '', now: NOW,
    });
    const forbidden = [
      /auto[-\s]?post/i,
      /\bpublished to\b/i,
      /\bscheduled the post\b/i,
      /\blaunched the ad/i,
      /\bspent\s+\$/i,
      /pulled (live )?analytics/i,
    ];
    for (const re of forbidden) expect(pack.content).not.toMatch(re);
  });

  it('handles an empty selection with a safe placeholder + still carries safety copy', () => {
    const pack = buildCampaignPack({ context, items: [], title: '', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.itemCount).toBe(0);
    expect(pack.content).toContain('No approved deliverables selected');
    expect(pack.content).toContain(CAMPAIGN_PACK_SAFETY_NOTE);
  });

  it('defaults the title to "<brand> — <campaign>" when none is given', () => {
    const pack = buildCampaignPack({ context, items, title: '', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.title).toBe('Bản Khói — Tháng 6 Launch');
  });

  it('plain_text format strips markdown syntax', () => {
    const pack = buildCampaignPack({ context, items, title: 'p', format: 'plain_text', generatedBy: '', now: NOW });
    expect(pack.content).not.toMatch(/^#\s/m);
    expect(pack.content).not.toContain('**');
  });

  it('builds a cover even with no deliverables selected (cover-only pack)', () => {
    const pack = buildCampaignPack({ context, items: [], title: 'cover', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('## Brand Context');
  });

  it('handles a missing item gracefully (title only, no crash)', () => {
    const orphan: CampaignPackItem = {
      approvalId: 'orphan', contentItemId: 'gone', title: 'Orphan', module: 'content',
      moduleLabel: 'Content Factory', item: undefined, deliveryStatus: 'not_delivered', provenance: null,
    };
    const pack = buildCampaignPack({ context, items: [orphan], title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('Source content item not found');
  });
});

// ---------------------------------------------------------------------------
// campaignPackFileStem
// ---------------------------------------------------------------------------

describe('campaignPackFileStem', () => {
  it('produces a safe, dated, separator-free slug', () => {
    const stem = campaignPackFileStem('Bản Khói — Tháng 6 Launch!', NOW);
    expect(stem).toBe('ban-khoi-thang-6-launch-20260624');
    expect(stem).not.toMatch(/[\\/\s]/);
  });

  it('falls back when the title is empty', () => {
    expect(campaignPackFileStem('', NOW)).toBe('campaign-pack-20260624');
  });
});
