import { describe, expect, it } from 'vitest';
import {
  classifyRequest,
  modulePreviewLabel,
  splitCaption,
  parseItemMetadata,
  moduleFieldLabels,
  MODULE_META,
} from './approvalClassify';
import type { ContentPlanItem } from '../../types/core';

// Minimal ContentPlanItem factory — only the fields the classifier reads matter.
function makeItem(partial: Partial<ContentPlanItem>): ContentPlanItem {
  return {
    id: 'item-1',
    generation_job_id: 'job-1',
    brief_id: 'brief-1',
    campaign_id: 'campaign-1',
    brand_id: 'brand-1',
    client_id: 'client-1',
    day_number: 1,
    planned_date: null,
    channel: 'Facebook',
    content_type: 'caption',
    pillar: 'Món signature',
    angle: 'Giới thiệu món',
    hook: 'Hook here',
    caption: 'Body here',
    visual_brief: 'Visual',
    cta: 'Inbox',
    hashtags: '#brand',
    status: 'needs_review',
    created_at: '2026-06-18T00:00:00.000Z',
    updated_at: '2026-06-18T00:00:00.000Z',
    ...partial,
  };
}

// A caption shaped like what the factories actually produce.
function captionWith(body: string, meta: Record<string, string>, header = 'Content Factory V1 metadata:'): string {
  const metaLines = Object.entries(meta).map(([k, v]) => `${k}: ${v}`);
  return [body, '', '---', header, ...metaLines].join('\n');
}

describe('classifyRequest', () => {
  it('classifies by workflow_type metadata (preferred signal)', () => {
    const cases: Array<[string, string]> = [
      ['content_pack', 'content'],
      ['design_factory', 'design'],
      ['video_scripts', 'video'],
      ['ads_pack', 'ads'],
      ['report_draft', 'report'],
    ];
    for (const [workflow, expected] of cases) {
      const item = makeItem({ caption: captionWith('Body', { workflow_type: workflow, source: 'n8n', generation_mode: 'external_module' }) });
      expect(classifyRequest(item).module).toBe(expected);
    }
  });

  it('falls back to structured content_type when workflow_type is absent', () => {
    expect(classifyRequest(makeItem({ content_type: 'design_brief', caption: 'no metadata' })).module).toBe('design');
    expect(classifyRequest(makeItem({ content_type: 'video_script', caption: 'no metadata' })).module).toBe('video');
    expect(classifyRequest(makeItem({ content_type: 'caption', caption: 'no metadata' })).module).toBe('content');
  });

  it('treats unknown / metadata-less items as other', () => {
    expect(classifyRequest(makeItem({ content_type: 'mystery', caption: 'legacy seed' })).module).toBe('other');
    expect(classifyRequest(undefined).module).toBe('other');
  });

  it('detects n8n source from generation_mode or source metadata', () => {
    expect(classifyRequest(makeItem({ caption: captionWith('b', { generation_mode: 'external_module' }) })).source).toBe('n8n');
    expect(classifyRequest(makeItem({ caption: captionWith('b', { source: 'n8n' }) })).source).toBe('n8n');
  });

  it('detects local source from V1 metadata in fallback', () => {
    expect(classifyRequest(makeItem({ caption: captionWith('b', { workflow_type: 'content_pack', generation_mode: 'mock' }) })).source).toBe('local');
    expect(classifyRequest(makeItem({ caption: captionWith('b', { source: 'local_mock' }) })).source).toBe('local');
  });

  it('treats metadata-less items as legacy source', () => {
    expect(classifyRequest(makeItem({ content_type: 'caption', caption: 'old demo seed, no metadata' })).source).toBe('legacy');
    expect(classifyRequest(undefined).source).toBe('legacy');
  });
});

describe('modulePreviewLabel', () => {
  it('returns module-aware preview headers (D1)', () => {
    expect(modulePreviewLabel('content')).toBe('Content Preview');
    expect(modulePreviewLabel('design')).toBe('Design Brief Preview');
    expect(modulePreviewLabel('video')).toBe('Video Script Preview');
    expect(modulePreviewLabel('ads')).toBe('Ads Draft Preview');
    expect(modulePreviewLabel('report')).toBe('Report Draft Preview');
  });

  it('falls back to "Output Preview" for other/legacy', () => {
    expect(modulePreviewLabel('other')).toBe('Output Preview');
  });
});

describe('splitCaption', () => {
  it('separates the human body from the metadata block', () => {
    const caption = captionWith('Day 1 hook\nLine two', { workflow_type: 'content_pack', status: 'pending_approval' });
    const { body, metadata } = splitCaption(caption);
    expect(body).toBe('Day 1 hook\nLine two');
    expect(metadata).toContain('Content Factory V1 metadata:');
    expect(metadata).toContain('workflow_type: content_pack');
    expect(body).not.toContain('---');
    expect(body).not.toContain('metadata:');
  });

  it('returns the whole caption as body when there is no metadata block', () => {
    expect(splitCaption('just a plain caption')).toEqual({ body: 'just a plain caption', metadata: '' });
  });

  it('handles empty captions safely', () => {
    expect(splitCaption('')).toEqual({ body: '', metadata: '' });
  });
});

describe('parseItemMetadata', () => {
  it('parses provenance + safety flags from the caption', () => {
    const caption = captionWith('Body', {
      generated_by: 'n8n-ai-provider',
      workflow_type: 'report_draft',
      content_type: 'report_draft',
      status: 'pending_approval',
      owner_approval_required: 'true',
      source: 'n8n',
      generation_mode: 'external_module',
      safety: 'no_auto_post=true; no_live_analytics_pull=true; no_unverified_metrics=true',
    }, 'Report Draft V1 metadata:');
    const meta = parseItemMetadata(caption);
    expect(meta.workflowType).toBe('report_draft');
    expect(meta.status).toBe('pending_approval');
    expect(meta.ownerApprovalRequired).toBe('true');
    expect(meta.source).toBe('n8n');
    expect(meta.generationMode).toBe('external_module');
    expect(meta.safetyFlags).toEqual(['no_auto_post=true', 'no_live_analytics_pull=true', 'no_unverified_metrics=true']);
  });

  it('returns empty safetyFlags when no safety line is present', () => {
    expect(parseItemMetadata('plain caption').safetyFlags).toEqual([]);
  });
});

describe('moduleFieldLabels', () => {
  it('relabels shared fields per module without inventing fields', () => {
    expect(moduleFieldLabels('report').visual).toBe('Focus / Key Observation');
    expect(moduleFieldLabels('design').cta).toBe('Handoff / Output Note');
    expect(moduleFieldLabels('video').headline).toBe('Hook (0–3s)');
    expect(moduleFieldLabels('content').body).toBe('Caption');
    expect(moduleFieldLabels('other').body).toBe('Output');
  });
});

describe('MODULE_META', () => {
  it('has a preview label and safety note for every module', () => {
    for (const key of Object.keys(MODULE_META) as Array<keyof typeof MODULE_META>) {
      expect(MODULE_META[key].previewLabel).toBeTruthy();
      expect(MODULE_META[key].safety).toBeTruthy();
    }
  });
});
