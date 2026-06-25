import { describe, expect, it } from 'vitest';
import {
  createEvidence,
  addEvidence,
  updateEvidence,
  setEvidenceStatus,
  removeEvidence,
  listEvidence,
  validateEvidence,
  buildPublishingEvidenceReport,
  renderPublishingEvidenceReportText,
  isManuallyPublished,
  isScheduledNotPublished,
  isPublishedRecord,
  metricsRealClaimAllowed,
  metricsPresentation,
  hasAnyMetric,
  cleanMetrics,
  sampleManualPublishingEvidence,
  PUBLISH_STATUSES,
  PUBLISH_STATUS_LABEL,
  RESULT_DATA_SOURCES,
  RESULT_METRIC_KEYS,
  EVIDENCE_CORE_DOES_NOT_PUBLISH,
  EVIDENCE_NO_LIVE_ANALYTICS,
  EVIDENCE_MANUAL_ONLY,
  EVIDENCE_APPROVED_NOT_PUBLISHED,
  EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED,
  EVIDENCE_LOCAL_ONLY_BADGES,
  type ManualPublishingEvidence,
  type EvidenceInput,
} from './manualPublishingEvidence';

const NOW = '2026-06-25T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

function ev(over: Partial<EvidenceInput> = {}, id = 'mpe-1'): ManualPublishingEvidence {
  return createEvidence({ campaignId: 'c1', ...over }, { id, now: NOW });
}

// ---------------------------------------------------------------------------
// Status model — no Core-set published/launched; manual is the only "published"
// ---------------------------------------------------------------------------

describe('publish status model', () => {
  it('exposes exactly the four manual statuses and no Core-set published/launched', () => {
    expect(PUBLISH_STATUSES).toEqual([
      'not_published',
      'manually_published',
      'scheduled_outside_core',
      'blocked_or_cancelled',
    ]);
    const labels = PUBLISH_STATUSES as string[];
    expect(labels).not.toContain('published');
    expect(labels).not.toContain('launched');
    // The only status mentioning "published" is the explicit manual annotation.
    expect(PUBLISH_STATUS_LABEL.manually_published).toMatch(/Manually published \(outside CORE\)/);
  });

  it('only manually_published counts as a published record — scheduled does NOT', () => {
    expect(isPublishedRecord('manually_published')).toBe(true);
    expect(isManuallyPublished('manually_published')).toBe(true);
    expect(isPublishedRecord('scheduled_outside_core')).toBe(false);
    expect(isScheduledNotPublished('scheduled_outside_core')).toBe(true);
    expect(isPublishedRecord('not_published')).toBe(false);
    expect(isPublishedRecord('blocked_or_cancelled')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Status transitions via the pure mutators (returns NEW arrays)
// ---------------------------------------------------------------------------

describe('evidence mutators (pure, status transitions)', () => {
  it('addEvidence appends purely and flags local_mock', () => {
    const before: ManualPublishingEvidence[] = [];
    const after = addEvidence(before, { campaignId: 'c1', channel: 'Facebook Page' }, { id: 'a1', now: NOW });
    expect(before).toHaveLength(0);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: 'a1', campaignId: 'c1', channel: 'Facebook Page', local_mock: true });
    // default status is the safe not_published
    expect(after[0].publishStatus).toBe('not_published');
  });

  it('setEvidenceStatus transitions a single record without mutating the input', () => {
    const list = [ev({ channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'note' }, 'x1')];
    const next = setEvidenceStatus(list, 'x1', 'manually_published', { now: NOW });
    expect(list[0].publishStatus).toBe('not_published');
    expect(next[0].publishStatus).toBe('manually_published');
    expect(next).not.toBe(list);
  });

  it('updateEvidence patches fields, cleans metrics, and is a no-op for unknown ids', () => {
    const list = [ev({}, 'x1')];
    const patched = updateEvidence(list, 'x1', { metrics: { reach: 100, impressions: -5, leads: Number.NaN } }, { now: NOW });
    expect(patched[0].metrics).toEqual({ reach: 100 }); // negative + NaN dropped
    const same = updateEvidence(list, 'nope', { channel: 'X' });
    expect(same).toBe(list);
  });

  it('removeEvidence + listEvidence (newest-first) behave purely', () => {
    const a = ev({}, 'a'); const b = ev({}, 'b');
    const list = [
      { ...a, createdAt: '2026-06-25T09:00:00.000Z' },
      { ...b, createdAt: '2026-06-25T10:00:00.000Z' },
    ];
    expect(listEvidence(list).map(e => e.id)).toEqual(['b', 'a']);
    const removed = removeEvidence(list, 'a');
    expect(removed).toHaveLength(1);
    expect(removeEvidence(list, 'missing')).toBe(list);
  });
});

// ---------------------------------------------------------------------------
// Approved / Client Accepted ≠ Published — structural guardrail
// ---------------------------------------------------------------------------

describe('Approved / Client Accepted ≠ Published guardrail', () => {
  it('the report is always core_published:false and carries both ≠-published notices', () => {
    const report = buildPublishingEvidenceReport(sampleManualPublishingEvidence('c1', NOW_DATE), { now: NOW_DATE });
    expect(report.core_published).toBe(false);
    expect(report.notices).toContain(EVIDENCE_APPROVED_NOT_PUBLISHED);
    expect(report.notices).toContain(EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED);
    expect(EVIDENCE_APPROVED_NOT_PUBLISHED).toMatch(/Approved ≠ Published/);
    expect(EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED).toMatch(/Client Accepted ≠ Published/);
  });

  it('a scheduled_outside_core row is NOT counted as published', () => {
    const list = [ev({ channel: 'TikTok', publishStatus: 'scheduled_outside_core', publishedBy: 'Owner (sample)' }, 's1')];
    const report = buildPublishingEvidenceReport(list, { now: NOW_DATE });
    expect(report.manually_published_count).toBe(0);
    expect(report.scheduled_count).toBe(1);
    expect(report.rows[0].is_published_record).toBe(false);
    expect(report.rows[0].is_scheduled_not_published).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Manual published validation
// ---------------------------------------------------------------------------

describe('validateEvidence — manually_published requires platform + publishedBy + evidence', () => {
  it('blocks manually_published when channel/publishedBy/evidence are all missing', () => {
    const v = validateEvidence(ev({ publishStatus: 'manually_published' }));
    expect(v.ok).toBe(false);
    expect(v.errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/requires a channel\/platform/i),
      expect.stringMatching(/requires who published it/i),
      expect.stringMatching(/requires an evidence note or a public URL/i),
    ]));
  });

  it('passes manually_published with channel + publishedBy + an evidence note', () => {
    const v = validateEvidence(ev({
      publishStatus: 'manually_published',
      channel: 'Facebook Page',
      publishedBy: 'Owner (sample)',
      evidenceNote: 'Screenshot saved (sample).',
    }));
    expect(v.ok).toBe(true);
    expect(v.errors).toHaveLength(0);
    expect(v.is_published_record).toBe(true);
  });

  it('passes manually_published when a public URL stands in for the evidence note', () => {
    const v = validateEvidence(ev({
      publishStatus: 'manually_published',
      channel: 'Instagram',
      publishedBy: 'Owner (sample)',
      publicUrl: 'ig.example/p/sample',
    }));
    expect(v.ok).toBe(true);
  });

  it('warns that scheduled_outside_core is NOT published (never an error/published record)', () => {
    const v = validateEvidence(ev({ publishStatus: 'scheduled_outside_core', channel: 'TikTok' }));
    expect(v.ok).toBe(true); // not blocking
    expect(v.is_scheduled_not_published).toBe(true);
    expect(v.is_published_record).toBe(false);
    expect(v.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/NOT published/i)]));
  });
});

// ---------------------------------------------------------------------------
// Metrics source labeling — real only when owner/client provided
// ---------------------------------------------------------------------------

describe('metrics source labeling', () => {
  it('metricsRealClaimAllowed only for owner_provided / client_provided', () => {
    expect(metricsRealClaimAllowed('owner_provided')).toBe(true);
    expect(metricsRealClaimAllowed('client_provided')).toBe(true);
    expect(metricsRealClaimAllowed('simulated_demo')).toBe(false);
    expect(metricsRealClaimAllowed('not_provided')).toBe(false);
    // exhaustive over the union
    for (const s of RESULT_DATA_SOURCES) {
      expect(typeof metricsRealClaimAllowed(s)).toBe('boolean');
    }
  });

  it('metricsPresentation classifies provenance correctly', () => {
    expect(metricsPresentation('owner_provided', { reach: 10 })).toBe('manual_provided_real');
    expect(metricsPresentation('client_provided', { leads: 3 })).toBe('manual_provided_real');
    expect(metricsPresentation('simulated_demo', { reach: 10 })).toBe('simulated_or_unverified');
    expect(metricsPresentation('owner_provided', {})).toBe('none');
    expect(metricsPresentation('owner_provided', undefined)).toBe('none');
  });

  it('hasAnyMetric / cleanMetrics treat only finite non-negative numbers as metrics', () => {
    expect(hasAnyMetric({ reach: 0 })).toBe(true);
    expect(hasAnyMetric({})).toBe(false);
    expect(hasAnyMetric(undefined)).toBe(false);
    expect(cleanMetrics({ reach: 5, impressions: -1, leads: Number.NaN })).toEqual({ reach: 5 });
    expect(cleanMetrics({ impressions: -1 })).toBeUndefined();
  });

  it('simulated/not_provided metrics warn they must NOT be presented as real', () => {
    const sim = validateEvidence(ev({ resultDataSource: 'simulated_demo', metrics: { reach: 999 } }));
    expect(sim.metrics_presentation).toBe('simulated_or_unverified');
    expect(sim.metrics_real_claim_allowed).toBe(false);
    expect(sim.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/must NOT be presented as real/i)]));

    const real = validateEvidence(ev({ resultDataSource: 'owner_provided', metrics: { reach: 999 } }));
    expect(real.metrics_presentation).toBe('manual_provided_real');
    expect(real.metrics_real_claim_allowed).toBe(true);
    expect(real.warnings.some(w => /must NOT be presented as real/i.test(w))).toBe(false);
  });

  it('report rows label metric provenance and flag missing metrics', () => {
    const list = [
      ev({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'n', resultDataSource: 'owner_provided', metrics: { reach: 100 } }, 'r1'),
      ev({ resultDataSource: 'simulated_demo', metrics: { reach: 5 } }, 'r2'),
      ev({}, 'r3'),
    ];
    const report = buildPublishingEvidenceReport(list, { now: NOW_DATE });
    const byId = Object.fromEntries(report.rows.map(r => [r.id, r]));
    expect(byId.r1.metrics_are_real).toBe(true);
    expect(byId.r1.metrics_presentation_label).toMatch(/Manual provided data/i);
    expect(byId.r2.metrics_are_real).toBe(false);
    expect(byId.r2.metrics_presentation_label).toMatch(/Simulated \/ unverified — not real/i);
    expect(byId.r3.metrics_presentation).toBe('none');
    expect(byId.r3.missing_fields).toEqual(expect.arrayContaining(['channel', 'publishedBy', 'result metrics']));
    expect(report.has_any_real_metrics).toBe(true);
    expect(report.rows_with_real_metrics_count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Report copy safety — notices present, no URL/connector/analytics/auto wording
// ---------------------------------------------------------------------------

describe('renderPublishingEvidenceReportText — report copy safety', () => {
  it('carries the required safety notices and the "manually recorded only" framing', () => {
    const report = buildPublishingEvidenceReport(sampleManualPublishingEvidence('c1', NOW_DATE), { now: NOW_DATE });
    const text = renderPublishingEvidenceReportText(report, 'Test Campaign');
    expect(text).toContain('MANUAL PUBLISHING EVIDENCE (LOCAL/DEMO)');
    expect(text).toContain(EVIDENCE_CORE_DOES_NOT_PUBLISH);
    expect(text).toContain(EVIDENCE_NO_LIVE_ANALYTICS);
    expect(text).toContain(EVIDENCE_MANUAL_ONLY);
    expect(text).toContain(EVIDENCE_APPROVED_NOT_PUBLISHED);
    expect(text).toContain(EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED);
    expect(text).toMatch(/Scheduled outside CORE \(NOT published\)/);
    expect(report.local_only_badges).toEqual(EVIDENCE_LOCAL_ONLY_BADGES);
  });

  it('labels simulated metrics as SIMULATED / UNVERIFIED in the rendered text', () => {
    const list = [ev({ resultDataSource: 'simulated_demo', metrics: { reach: 1000, engagement: 50 } }, 'sim')];
    const report = buildPublishingEvidenceReport(list, { now: NOW_DATE });
    const text = renderPublishingEvidenceReportText(report);
    expect(text).toMatch(/SIMULATED \/ UNVERIFIED, not real/i);
  });

  it('the template emits no system URL / webhook / token / connector / analytics call', () => {
    // Build a report WITHOUT any owner-provided URL so only the template text is scanned.
    const list = [
      ev({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).', resultDataSource: 'owner_provided', metrics: { reach: 10 } }, 'n1'),
    ];
    const report = buildPublishingEvidenceReport(list, { now: NOW_DATE });
    const text = renderPublishingEvidenceReportText(report);
    const forbidden = [
      /https?:\/\//i, /www\./i, /\bwebhook\b/i, /share[_-]?url/i,
      /access_token|client_secret|api_key/i, /mailto:/i,
      /fetchAnalytics|getAnalytics|liveMetrics|pull(Live)?Metrics/i,
      /OAuth/i,
    ];
    for (const re of forbidden) expect(text).not.toMatch(re);
    // auto-post / auto-ads only ever appear negated
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?post/i);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?ads/i);
  });

  it('an Owner-provided publicUrl is passed through as evidence, labeled Owner-provided', () => {
    const list = [ev({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', publicUrl: 'fb.example/p/sample', resultDataSource: 'owner_provided' }, 'u1')];
    const report = buildPublishingEvidenceReport(list, { now: NOW_DATE });
    const text = renderPublishingEvidenceReportText(report);
    expect(text).toMatch(/Evidence URL \(Owner-provided\): fb\.example\/p\/sample/);
  });

  it('carries no off-domain contamination', () => {
    const report = buildPublishingEvidenceReport(sampleManualPublishingEvidence('c1', NOW_DATE), { now: NOW_DATE });
    const text = renderPublishingEvidenceReportText(report);
    expect(text).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});

// ---------------------------------------------------------------------------
// Sample seed is deterministic and entirely local/mock
// ---------------------------------------------------------------------------

describe('sampleManualPublishingEvidence', () => {
  it('is deterministic and every row is local_mock with a coherent status', () => {
    const a = sampleManualPublishingEvidence('c1', NOW_DATE);
    const b = sampleManualPublishingEvidence('c1', NOW_DATE);
    expect(a).toEqual(b);
    for (const e of a) {
      expect(e.local_mock).toBe(true);
      expect(PUBLISH_STATUSES).toContain(e.publishStatus);
      expect(RESULT_DATA_SOURCES).toContain(e.resultDataSource);
    }
    // the demo metrics row is explicitly simulated, never presented as real
    const sim = a.find(e => e.resultDataSource === 'simulated_demo');
    expect(sim && metricsRealClaimAllowed(sim.resultDataSource)).toBe(false);
  });

  it('covers all metric keys across the model labels', () => {
    expect(RESULT_METRIC_KEYS).toEqual(['reach', 'impressions', 'engagement', 'messages', 'leads', 'orders', 'revenue']);
  });
});
