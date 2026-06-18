import { describe, expect, it } from 'vitest';
import {
  collectHandoffCandidates,
  groupHandoffCandidates,
  moduleBreakdown,
  buildHandoffPack,
  toPlainText,
  handoffFileStem,
  HANDOFF_SAFETY_NOTE,
  HANDOFF_APPROVED_NOT_PUBLISHED,
  HANDOFF_MANUALLY_POSTED_NOTE,
  type HandoffCandidate,
} from './handoffPack';
import type {
  Client,
  Brand,
  Campaign,
  ContentPlanItem,
  ContentApprovalRequest,
} from '../../types/core';
import type { ManualDeliveryMap } from './manualDelivery';

const NOW = new Date('2026-06-18T10:00:00.000Z');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const clients: Client[] = [
  { id: 'cli-1', name: 'Cơm Tấm Bản Khói', status: 'active', created_at: '', updated_at: '' } as Client,
];
const brands: Brand[] = [
  { id: 'br-1', client_id: 'cli-1', name: 'Bản Khói', status: 'active', created_at: '', updated_at: '' } as Brand,
];
const campaigns: Campaign[] = [
  { id: 'cmp-1', client_id: 'cli-1', brand_id: 'br-1', name: 'Tháng 6 Launch', status: 'active', created_at: '', updated_at: '' } as Campaign,
];

function makeItem(id: string, contentType: string, caption: string, extra: Partial<ContentPlanItem> = {}): ContentPlanItem {
  return {
    id,
    generation_job_id: 'job-1',
    brief_id: 'brief-1',
    campaign_id: 'cmp-1',
    brand_id: 'br-1',
    client_id: 'cli-1',
    day_number: 1,
    planned_date: null,
    channel: 'Facebook',
    content_type: contentType,
    pillar: 'Món signature',
    angle: 'Giới thiệu món',
    hook: `${id} hook`,
    caption,
    visual_brief: `${id} visual`,
    cta: `${id} cta`,
    hashtags: '#banhkhoi',
    status: 'approved',
    created_at: '',
    updated_at: '',
    ...extra,
  };
}

const contentBody = 'Hôm nay quán có món signature thơm lừng.';
const contentCaption = `${contentBody}\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack\ncontent_type: caption\nsource: n8n\ngeneration_mode: external_module\nsafety: no_auto_post=true`;

const reportBody = 'Tổng quan chiến dịch.\nData source status: Provided (owner cấp), Simulated (demo), Missing, Owner input required.';
const reportCaption = `${reportBody}\n\n---\nReport Draft V1 metadata:\nworkflow_type: report_draft\ncontent_type: report_draft\nsource: n8n`;

const items: ContentPlanItem[] = [
  makeItem('item-content', 'caption', contentCaption),
  makeItem('item-report', 'report_draft', reportCaption),
  makeItem('item-design', 'design_brief', 'Brief thiết kế poster.'),
];

function req(id: string, contentItemId: string, status: ContentApprovalRequest['status'], title: string): ContentApprovalRequest {
  return {
    id,
    content_item_id: contentItemId,
    generation_job_id: 'job-1',
    brief_id: 'brief-1',
    campaign_id: 'cmp-1',
    brand_id: 'br-1',
    client_id: 'cli-1',
    title,
    status,
    priority: 'normal',
    requested_by: 'owner',
    assigned_to_role: null,
    due_date: null,
    created_at: '2026-06-18T09:00:00.000Z',
    updated_at: '2026-06-18T09:30:00.000Z',
    resolved_at: '2026-06-18T09:30:00.000Z',
  };
}

const approvalRequests: ContentApprovalRequest[] = [
  req('appr-content', 'item-content', 'approved', 'Content Day 1'),
  req('appr-report', 'item-report', 'approved', 'Report Draft'),
  req('appr-design', 'item-design', 'approved', 'Design Poster'),
  req('appr-pending', 'item-content', 'submitted', 'Pending item'),
  req('appr-rejected', 'item-design', 'rejected', 'Rejected item'),
];

const baseParams = {
  clients,
  brands,
  campaigns,
  contentItems: items,
  approvalRequests,
  deliveryMap: {} as ManualDeliveryMap,
};

// ---------------------------------------------------------------------------
// collectHandoffCandidates
// ---------------------------------------------------------------------------

describe('collectHandoffCandidates', () => {
  it('includes ONLY approved requests (never pending/rejected/revision)', () => {
    const out = collectHandoffCandidates(baseParams);
    const ids = out.map(c => c.approvalId).sort();
    expect(ids).toEqual(['appr-content', 'appr-design', 'appr-report']);
    expect(out.every(c => c.approvalStatus === 'approved')).toBe(true);
  });

  it('classifies module from caption metadata / content_type', () => {
    const out = collectHandoffCandidates(baseParams);
    const byId = Object.fromEntries(out.map(c => [c.approvalId, c.module]));
    expect(byId['appr-content']).toBe('content');
    expect(byId['appr-report']).toBe('report');
    expect(byId['appr-design']).toBe('design');
  });

  it('resolves client/brand/campaign names', () => {
    const c = collectHandoffCandidates(baseParams).find(x => x.approvalId === 'appr-content')!;
    expect(c.clientName).toBe('Cơm Tấm Bản Khói');
    expect(c.brandName).toBe('Bản Khói');
    expect(c.campaignName).toBe('Tháng 6 Launch');
  });

  it('applies scope filters (campaign + module)', () => {
    const all = collectHandoffCandidates({ ...baseParams, scope: { campaignId: 'cmp-1' } });
    expect(all.length).toBe(3);
    const onlyReport = collectHandoffCandidates({ ...baseParams, scope: { module: 'report' } });
    expect(onlyReport.map(c => c.approvalId)).toEqual(['appr-report']);
    const noMatch = collectHandoffCandidates({ ...baseParams, scope: { clientId: 'cli-zzz' } });
    expect(noMatch).toEqual([]);
  });

  it('reads manual-delivery status/note/link from the Phase E map', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'Đăng FB hôm qua', link: 'https://fb.com/post/1', updatedAt: NOW.toISOString(), updatedBy: 'owner' },
    };
    const c = collectHandoffCandidates({ ...baseParams, deliveryMap }).find(x => x.approvalId === 'appr-content')!;
    expect(c.deliveryStatus).toBe('manually_posted');
    expect(c.deliveryNote).toBe('Đăng FB hôm qua');
    expect(c.deliveryLink).toBe('https://fb.com/post/1');
  });
});

// ---------------------------------------------------------------------------
// grouping + breakdown
// ---------------------------------------------------------------------------

describe('groupHandoffCandidates', () => {
  it('groups by client/brand/campaign', () => {
    const groups = groupHandoffCandidates(collectHandoffCandidates(baseParams));
    expect(groups.length).toBe(1);
    expect(groups[0].campaignName).toBe('Tháng 6 Launch');
    expect(groups[0].items.length).toBe(3);
  });
});

describe('moduleBreakdown', () => {
  it('counts per module in canonical order', () => {
    const bd = moduleBreakdown(collectHandoffCandidates(baseParams));
    expect(bd.map(b => b.module)).toEqual(['content', 'design', 'report']);
    expect(bd.every(b => b.count === 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildHandoffPack
// ---------------------------------------------------------------------------

describe('buildHandoffPack', () => {
  const candidates = collectHandoffCandidates(baseParams);

  it('always carries the verbatim Approved≠Published + internal-handoff safety copy', () => {
    const pack = buildHandoffPack({ candidates, title: 'My Pack', format: 'markdown', generatedBy: 'Owner', now: NOW });
    expect(pack.content).toContain(HANDOFF_APPROVED_NOT_PUBLISHED);
    expect(pack.content).toContain(HANDOFF_SAFETY_NOTE);
    expect(pack.itemCount).toBe(3);
  });

  it('includes module sections and uses the clean caption body (no metadata block leaked)', () => {
    const pack = buildHandoffPack({ candidates, title: 'My Pack', format: 'markdown', generatedBy: 'Owner', now: NOW });
    expect(pack.content).toContain('Approved Content Items');
    expect(pack.content).toContain('Report Drafts');
    expect(pack.content).toContain('Design Briefs');
    expect(pack.content).toContain(contentBody);
    // The appended metadata block must NOT bleed into the client-facing pack.
    expect(pack.content).not.toContain('workflow_type: content_pack');
    expect(pack.content).not.toContain('generation_mode: external_module');
  });

  it('labels a manually-posted item with the verbatim note', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'posted', updatedAt: NOW.toISOString() },
    };
    const c2 = collectHandoffCandidates({ ...baseParams, deliveryMap });
    const pack = buildHandoffPack({ candidates: c2, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain(HANDOFF_MANUALLY_POSTED_NOTE);
  });

  it('carries report data-status labels verbatim and invents no metrics', () => {
    const pack = buildHandoffPack({ candidates, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toContain('Data source status');
    expect(pack.content).toContain('No metrics are invented');
  });

  it('never implies publishing / launching / spend / live analytics (safety regression)', () => {
    const deliveryMap: ManualDeliveryMap = {
      'appr-content': { status: 'manually_posted', note: 'n', updatedAt: NOW.toISOString() },
    };
    const pack = buildHandoffPack({
      candidates: collectHandoffCandidates({ ...baseParams, deliveryMap }),
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
    const pack = buildHandoffPack({ candidates: [], title: '', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.itemCount).toBe(0);
    expect(pack.content).toContain('No approved items selected');
    expect(pack.content).toContain(HANDOFF_SAFETY_NOTE);
  });

  it('plain_text format strips markdown syntax', () => {
    const pack = buildHandoffPack({ candidates, title: 'My Pack', format: 'plain_text', generatedBy: 'Owner', now: NOW });
    expect(pack.content).not.toMatch(/^#\s/m);
    expect(pack.content).not.toContain('**');
  });

  it('summarises multiple clients in the overview when items span clients', () => {
    const mixed: HandoffCandidate[] = [
      { ...candidates[0], clientName: 'Client A' },
      { ...candidates[1], clientName: 'Client B' },
    ];
    const pack = buildHandoffPack({ candidates: mixed, title: 'p', format: 'markdown', generatedBy: '', now: NOW });
    expect(pack.content).toMatch(/Client:\*\*\s+Multiple/);
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

describe('toPlainText', () => {
  it('strips headings, bold, list markers and links', () => {
    const md = '# Title\n- **bold** item\n[link](http://x)\n> quote';
    const txt = toPlainText(md);
    expect(txt).toContain('Title');
    expect(txt).toContain('• bold item');
    expect(txt).toContain('link');
    expect(txt).not.toContain('#');
    expect(txt).not.toContain('**');
  });
});

describe('handoffFileStem', () => {
  it('produces a safe, dated, separator-free slug', () => {
    const stem = handoffFileStem('Cơm Tấm — Handoff Pack!', NOW);
    expect(stem).toBe('com-tam-handoff-pack-20260618');
    expect(stem).not.toMatch(/[\\/\s]/);
  });

  it('falls back when the title is empty', () => {
    expect(handoffFileStem('', NOW)).toBe('client-handoff-pack-20260618');
  });
});
