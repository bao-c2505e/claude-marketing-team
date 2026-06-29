import { describe, expect, it } from 'vitest';
import {
  createEvidence,
  type EvidenceInput,
  type ManualPublishingEvidence,
} from './manualPublishingEvidence';
import {
  buildManualResultReview,
  reviewEntry,
  renderManualResultReviewText,
  sampleManualResultEntries,
  RESULT_REVIEW_SAFETY_DISCLAIMERS,
  type ManualResultReviewEntryInput,
} from './manualResultReview';

const NOW = '2026-06-25T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

function ev(over: Partial<EvidenceInput> = {}, id = 'mpe-1'): ManualPublishingEvidence {
  return createEvidence({ campaignId: 'c1', ...over }, { id, now: NOW });
}

function entry(over: Partial<EvidenceInput> = {}, opts: { id?: string; spend?: number } = {}): ManualResultReviewEntryInput {
  const e = ev(over, opts.id ?? 'mpe-1');
  return opts.spend !== undefined ? { evidence: e, spend: opts.spend } : { evidence: e };
}

// A fully-attributed, reviewable published entry (channel + publishedBy + url + note + real metrics).
function reviewablePublished(over: Partial<EvidenceInput> = {}, opts: { id?: string; spend?: number } = {}) {
  return entry(
    {
      publishStatus: 'manually_published',
      channel: 'Facebook Page',
      publishedBy: 'Owner (sample)',
      evidenceNote: 'Screenshot saved (sample).',
      publicUrl: 'fb.example/p/sample',
      resultDataSource: 'owner_provided',
      metrics: { reach: 4200, engagement: 310, messages: 18, orders: 7 },
      ...over,
    },
    opts,
  );
}

// ---------------------------------------------------------------------------
// 1. No manual evidence => cannot review result.
// ---------------------------------------------------------------------------

describe('no manual evidence => cannot review', () => {
  it('not_published / scheduled / empty input all yield no_manual_evidence with no learning', () => {
    const r = buildManualResultReview([entry({ publishStatus: 'not_published', channel: 'Facebook Page' })], { now: NOW_DATE });
    expect(r.reviewStatus).toBe('no_manual_evidence');
    expect(r.publishedEntryCount).toBe(0);
    expect(r.reviewedEntryCount).toBe(0);
    expect(r.learningCandidates).toHaveLength(0);
    expect(r.repeatRecommendations).toHaveLength(0);
    expect(r.performanceSignal).toBe('insufficient_data');
    expect(r.brandBrainLearningCandidatePreview.sufficiency).toBe('insufficient');
    expect(r.nextActionSuggestions.join(' ')).toMatch(/before any result review is possible/i);

    // scheduled_outside_core is NOT published — still no_manual_evidence
    const sched = buildManualResultReview([entry({ publishStatus: 'scheduled_outside_core', channel: 'TikTok' })], { now: NOW_DATE });
    expect(sched.reviewStatus).toBe('no_manual_evidence');

    // empty input
    expect(buildManualResultReview([], { now: NOW_DATE }).reviewStatus).toBe('no_manual_evidence');
  });

  it('empty evidence (the panel default) fabricates nothing — no metrics, no learning, no published claim', () => {
    const r = buildManualResultReview([], { now: NOW_DATE });
    expect(r.reviewStatus).toBe('no_manual_evidence');
    expect(r.entries).toHaveLength(0);
    expect(r.publishedEntryCount).toBe(0);
    expect(r.reviewedEntryCount).toBe(0);
    expect(r.resultSummary.providedMetricLines).toHaveLength(0);
    expect(r.learningCandidates).toHaveLength(0);
    expect(r.brandBrainLearningCandidatePreview.sufficiency).toBe('insufficient');
    expect(r.core_published).toBe(false);
    const text = renderManualResultReviewText(r, 'Empty');
    expect(text).not.toMatch(/Reach: \d|Impressions: \d|Engagement: \d|Messages: \d|Leads: \d|Orders: \d|Revenue: \d/);
    expect(text).not.toMatch(/\blaunched\b/i);
  });
});

// ---------------------------------------------------------------------------
// 2. Evidence exists but no metrics => result pending.
// ---------------------------------------------------------------------------

describe('evidence logged but no metrics => result pending', () => {
  it('manually_published with evidence but no metrics is pending, with an empty/insufficient learning candidate', () => {
    const r = buildManualResultReview([
      entry({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).' }),
    ], { now: NOW_DATE });
    expect(r.reviewStatus).toBe('evidence_logged_result_pending');
    expect(r.publishedEntryCount).toBe(1);
    expect(r.reviewedEntryCount).toBe(0);
    expect(r.resultSummary.providedMetricLines).toHaveLength(0);
    expect(r.learningCandidates).toHaveLength(0);
    expect(r.brandBrainLearningCandidatePreview.sufficiency).toBe('insufficient');
    expect(r.nextActionSuggestions.join(' ')).toMatch(/24h|3 days|7 days/i);
  });
});

// ---------------------------------------------------------------------------
// 3. Evidence + provided metrics => review generated.
// ---------------------------------------------------------------------------

describe('evidence + provided metrics => review generated', () => {
  it('manually_published + owner-provided metrics is reviewed with summary, confidence + repeat suggestion', () => {
    const r = buildManualResultReview([reviewablePublished()], { now: NOW_DATE });
    expect(r.reviewStatus).toBe('provided_manual_result_reviewed');
    expect(r.reviewedEntryCount).toBe(1);
    expect(r.brandBrainLearningCandidatePreview.sufficiency).toBe('sufficient');
    expect(r.resultSummary.providedMetricLines.length).toBeGreaterThan(0);
    expect(r.riskFlags).toHaveLength(0);
    expect(r.confidenceLevel).toBe('high'); // url + note + 4 metrics
    expect(r.evidenceQuality).toBe('strong');
    expect(r.attributionQuality).toBe('clear');
    expect(r.performanceSignal).toBe('provided_data_positive');
    expect(r.repeatRecommendations.length).toBeGreaterThan(0);
    expect(r.repeatRecommendations[0]).toMatch(/Based on provided manual data/i);
  });
});

// ---------------------------------------------------------------------------
// 4. Spend without conversion metrics => incomplete conversion data flag.
// ---------------------------------------------------------------------------

describe('spend without conversion => incomplete_conversion_data', () => {
  it('flags incomplete conversion when spend is recorded but messages/orders/revenue are missing', () => {
    const r = buildManualResultReview([
      entry(
        { publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).', resultDataSource: 'owner_provided', metrics: { reach: 5000 } },
        { spend: 500_000 },
      ),
    ], { now: NOW_DATE });
    expect(r.riskFlags).toContain('incomplete_conversion_data');
    expect(r.nextActionSuggestions.join(' ')).toMatch(/conversion metrics/i);
  });
});

// ---------------------------------------------------------------------------
// 5. Orders/revenue without evidence/source => weak attribution flag.
// ---------------------------------------------------------------------------

describe('orders/revenue without evidence/source => weak_attribution', () => {
  it('flags weak attribution when conversions lack supporting evidence and a real data source', () => {
    const r = buildManualResultReview([
      entry({ publishStatus: 'manually_published', channel: 'TikTok', resultDataSource: 'not_provided', metrics: { orders: 9, revenue: 1_500_000 } }),
    ], { now: NOW_DATE });
    expect(r.riskFlags).toContain('weak_attribution');
    expect(r.nextActionSuggestions.join(' ')).toMatch(/evidence.*data source|data source.*evidence/i);
  });
});

// ---------------------------------------------------------------------------
// 6-9. Owner-note risk flags (English + Vietnamese keywords).
// ---------------------------------------------------------------------------

describe('owner-note risk flags', () => {
  function flagsFor(notes: string) {
    const r = buildManualResultReview([
      entry({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).', resultDataSource: 'owner_provided', metrics: { reach: 1000 }, notes }),
    ], { now: NOW_DATE });
    return r;
  }

  it('6. complaint notes => customer_complaint', () => {
    const r = flagsFor('Khách chê hơi mặn so với mọi lần.');
    expect(r.riskFlags).toContain('customer_complaint');
    expect(r.avoidRecommendations.join(' ')).toMatch(/complaint/i);
  });

  it('7. stockout notes => stockout_or_capacity_issue', () => {
    const r = flagsFor('Trưa cao điểm bị hết hàng, không kịp làm.');
    expect(r.riskFlags).toContain('stockout_or_capacity_issue');
  });

  it('8. wrong-price / wrong-info notes => content_accuracy_issue', () => {
    const r = flagsFor('Bài đăng bị sai giá combo, phải sửa lại.');
    expect(r.riskFlags).toContain('content_accuracy_issue');
  });

  it('9. late-post notes => timing_issue', () => {
    const r = flagsFor('Đăng muộn so với giờ ăn trưa nên ít người thấy.');
    expect(r.riskFlags).toContain('timing_issue');
  });
});

// ---------------------------------------------------------------------------
// 10. Learning candidate does not claim a persisted Brand Brain update.
// ---------------------------------------------------------------------------

describe('learning candidate is a preview only, never a Brand Brain write', () => {
  it('every candidate + the preview + the review are flagged not-persisted / not-an-update', () => {
    const r = buildManualResultReview(sampleManualResultEntries('c1', NOW_DATE), { now: NOW_DATE });
    expect(r.persisted_to_brand_brain).toBe(false);
    expect(r.brandBrainLearningCandidatePreview.persisted_to_brand_brain).toBe(false);
    expect(r.brandBrainLearningCandidatePreview.is_brand_brain_update).toBe(false);
    expect(r.brandBrainLearningCandidatePreview.requires_owner_review).toBe(true);
    expect(r.brandBrainLearningCandidatePreview.note).toMatch(/not persisted to Brand Brain yet/i);
    expect(r.learningCandidates.length).toBeGreaterThan(0);
    for (const c of r.learningCandidates) expect(c.persisted).toBe(false);

    const text = renderManualResultReviewText(r, 'Test');
    expect(text).toMatch(/not persisted to Brand Brain yet/i);
    // never claims an AFFIRMATIVE write/update to Brand Brain (negated "not persisted"/"nothing is written" are fine)
    expect(text).not.toMatch(/Brand Brain (was )?updated|updated Brand Brain|saved to Brand Brain|wrote to Brand Brain|writes to Brand Brain/i);
  });
});

// ---------------------------------------------------------------------------
// 11. Published semantics unchanged.
// ---------------------------------------------------------------------------

describe('published semantics unchanged', () => {
  it('only manually_published counts as published; scheduled never does; no published/launched is set', () => {
    const r = buildManualResultReview([
      reviewablePublished({}, { id: 'mpe-1' }),
      entry({ publishStatus: 'scheduled_outside_core', channel: 'TikTok', publishedBy: 'Owner (sample)' }, { id: 'mpe-2' }),
    ], { now: NOW_DATE });

    expect(r.core_published).toBe(false);
    expect(r.published_semantics_unchanged).toBe(true);
    expect(r.no_live_analytics).toBe(true);

    const byId = Object.fromEntries(r.entries.map(e => [e.id, e]));
    expect(byId['mpe-1'].is_published_record).toBe(true);
    expect(byId['mpe-2'].is_published_record).toBe(false);
    expect(byId['mpe-2'].is_scheduled_not_published).toBe(true);

    // entries only ever carry the four Phase V manual statuses — never published/launched
    const VALID = ['not_published', 'manually_published', 'scheduled_outside_core', 'blocked_or_cancelled'];
    for (const e of r.entries) expect(VALID).toContain(e.publishStatus);

    const text = renderManualResultReviewText(r);
    expect(text).not.toMatch(/\blaunched\b/i);
  });
});

// ---------------------------------------------------------------------------
// 12. No fake metrics are generated.
// ---------------------------------------------------------------------------

describe('no fake metrics are generated', () => {
  it('an evidence-only entry surfaces no metric values, and the text invents no numbers', () => {
    const r = buildManualResultReview([
      entry({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).' }),
    ], { now: NOW_DATE });
    expect(r.entries[0].providedMetrics).toHaveLength(0);
    expect(r.resultSummary.providedMetricLines).toHaveLength(0);
    const text = renderManualResultReviewText(r, 'Test');
    expect(text).not.toMatch(/Reach: \d|Impressions: \d|Engagement: \d|Messages: \d|Leads: \d|Orders: \d|Revenue: \d/);
  });

  it('simulated metrics are flagged unverified, never treated as real or reviewable', () => {
    const sim = buildManualResultReview([
      entry({ publishStatus: 'manually_published', channel: 'Instagram', publishedBy: 'Owner (sample)', evidenceNote: 'note', resultDataSource: 'simulated_demo', metrics: { reach: 999 } }),
    ], { now: NOW_DATE });
    expect(sim.entries[0].metrics_are_real).toBe(false);
    expect(sim.reviewedEntryCount).toBe(0);
    expect(sim.reviewStatus).toBe('evidence_logged_result_pending');
    expect(sim.riskFlags).toContain('unverified_metrics');
  });
});

// ---------------------------------------------------------------------------
// Review copy safety — disclaimers present, no connector/URL/auto wording.
// ---------------------------------------------------------------------------

describe('review copy safety', () => {
  it('carries required disclaimers and no forbidden / off-domain wording', () => {
    const r = buildManualResultReview(sampleManualResultEntries('c1', NOW_DATE), { now: NOW_DATE });
    const text = renderManualResultReviewText(r, 'Vị Cuốn');

    expect(text).toContain('Manual review only');
    expect(text).toContain('No live analytics');
    expect(text).toContain('Does not change Published status.');
    expect(text).toContain('Learning candidate only.');
    expect(text).toContain('Not persisted to Brand Brain yet.');
    expect(text).toMatch(/Approved ≠ Published/);
    expect(text).toMatch(/Client Accepted ≠ Published/);
    expect(RESULT_REVIEW_SAFETY_DISCLAIMERS).toContain('Does not change Published status.');

    const forbidden = [
      /https?:\/\//i, /www\./i, /\bwebhook\b/i, /OAuth/i, /mailto:/i,
      /access_token|client_secret|api_key/i,
      /fetchAnalytics|getAnalytics|liveMetrics|pull(Live)?Metrics/i,
      /synced from (Meta|TikTok|Google|Canva|Zalo)/i,
    ];
    for (const re of forbidden) expect(text).not.toMatch(re);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?post/i);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?ads/i);
    expect(text).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});

// ---------------------------------------------------------------------------
// Determinism + purity of the sample seed and per-entry analysis.
// ---------------------------------------------------------------------------

describe('determinism + purity', () => {
  it('sampleManualResultEntries + buildManualResultReview are deterministic', () => {
    const a = buildManualResultReview(sampleManualResultEntries('c1', NOW_DATE), { now: NOW_DATE });
    const b = buildManualResultReview(sampleManualResultEntries('c1', NOW_DATE), { now: NOW_DATE });
    expect(a).toEqual(b);
    expect(a.reviewStatus).toBe('provided_manual_result_reviewed');
    expect(a.repeatRecommendations.length).toBeGreaterThan(0);
  });

  it('reviewEntry does not mutate the input evidence record', () => {
    const input = reviewablePublished();
    const snapshot = JSON.parse(JSON.stringify(input));
    reviewEntry(input);
    expect(input).toEqual(snapshot);
  });
});
