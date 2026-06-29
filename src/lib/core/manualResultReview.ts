// ---------------------------------------------------------------------------
// Manual Publishing Result Review & Campaign Learning Loop (Phase W) — pure, local
//
// A SAFE, deterministic REVIEW layer that sits ON TOP of Phase V (Manual Publishing
// Evidence & Result Intake). It REVIEWS — never gathers — Owner-provided manual
// result data already captured as Phase V `ManualPublishingEvidence`, and produces a
// deterministic result summary, risk flags, and a Brand Brain LEARNING CANDIDATE
// PREVIEW for the Owner to review.
//
//   • Reviews ONLY what the Owner manually provided. CORE pulls nothing: no live
//     analytics, no connector, no Meta/TikTok/Zalo/Google/Canva call, no network,
//     no AI API call, no credentials, no external endpoint. Every number echoed here is a
//     value the Owner already typed in the evidence room — missing data is labeled, never invented.
//   • Published semantics are UNCHANGED. "Published" still means only a manual Owner
//     record (Phase V `manually_published`, surfaced via `isPublishedRecord`). This
//     layer never sets `published`/`launched`, and `scheduled_outside_core`/approved/
//     client-accepted are never treated as published. `core_published` is always false.
//   • The Brand Brain output is a CANDIDATE PREVIEW ONLY. Brand Brain is structured,
//     derived/read-only data — this layer does NOT persist, mutate, or auto-update it.
//     Every candidate is flagged `persisted: false` and `is_brand_brain_update: false`.
//   • Performance language is conservative: every insight is phrased "Based on provided
//     manual data…", never "analytics shows", and a campaign is never declared a
//     success/failure from absent or simulated data.
//
// Pure & deterministic: the review is a fixed function of explicit inputs (plus an
// injectable `now`), with no browser storage / DB / network / connector — trivially unit-testable.
// Reuses the Phase V model rather than re-deriving it. See CLAUDE.md §3/§4/§6/§7.
// ---------------------------------------------------------------------------

import {
  isPublishedRecord,
  isScheduledNotPublished,
  metricsRealClaimAllowed,
  metricsPresentation,
  sampleManualPublishingEvidence,
  RESULT_METRIC_KEYS,
  RESULT_METRIC_LABEL,
  RESULT_DATA_SOURCE_LABEL,
  PUBLISH_STATUS_LABEL,
  EVIDENCE_NO_LIVE_ANALYTICS,
  EVIDENCE_APPROVED_NOT_PUBLISHED,
  EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED,
  type ManualPublishingEvidence,
  type ResultMetricKey,
  type ResultDataSource,
  type PublishStatus,
  type MetricsPresentation,
} from './manualPublishingEvidence';

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so the panel + tests reference one source.
// ---------------------------------------------------------------------------

/** This layer reviews only what the Owner provided manually. */
export const RESULT_REVIEW_MANUAL_ONLY = 'Manual review only — uses Owner-provided manual result data.';

/** No analytics connector is wired — reused verbatim from Phase V. */
export const RESULT_REVIEW_NO_LIVE_ANALYTICS = EVIDENCE_NO_LIVE_ANALYTICS;

/** Reviewing a result never changes the (manual-only) Published status. */
export const RESULT_REVIEW_NO_PUBLISHED_CHANGE = 'Does not change Published status.';

/** Learnings are candidates for the Owner — not applied automatically. */
export const RESULT_REVIEW_LEARNING_CANDIDATE_ONLY = 'Learning candidate only.';

/** Brand Brain is NOT written to here. */
export const RESULT_REVIEW_NOT_PERSISTED_BRAND_BRAIN = 'Not persisted to Brand Brain yet.';

/** Standing note carried on every Brand Brain learning-candidate preview. */
export const RESULT_REVIEW_BRAND_BRAIN_NOTE =
  'Learning candidate for Owner review — not persisted to Brand Brain yet.';

/** Full safety note carried on the rendered review text. */
export const RESULT_REVIEW_SAFETY_NOTE =
  'Manual result review is local/demo state only. CORE reviews ONLY Owner-provided manual result data — it pulls no live ' +
  'analytics, calls no connector, makes no AI/API/network call, and never changes the Published status. Learnings are ' +
  'candidates for Owner review and are NOT persisted to Brand Brain.';

/** Standing disclaimers shown on the review + copied text. */
export const RESULT_REVIEW_SAFETY_DISCLAIMERS: string[] = [
  RESULT_REVIEW_MANUAL_ONLY,
  RESULT_REVIEW_NO_LIVE_ANALYTICS,
  RESULT_REVIEW_NO_PUBLISHED_CHANGE,
  RESULT_REVIEW_LEARNING_CANDIDATE_ONLY,
  RESULT_REVIEW_NOT_PERSISTED_BRAND_BRAIN,
  EVIDENCE_APPROVED_NOT_PUBLISHED,
  EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED,
];

/** Local/demo provenance badges shown on the panel. */
export const RESULT_REVIEW_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo state only',
  'Manual review only',
  'No live analytics',
  'Learning candidate only',
];

// ---------------------------------------------------------------------------
// Review status — distinguishes planned/approved vs accepted vs published vs
// observed vs learning. The ONLY way to reach a real review is Owner-provided
// manual result data on a manually-published record.
// ---------------------------------------------------------------------------

export type ResultReviewStatus =
  | 'no_manual_evidence'
  | 'evidence_logged_result_pending'
  | 'provided_manual_result_reviewed';

export const REVIEW_STATUS_LABEL: Record<ResultReviewStatus, string> = {
  no_manual_evidence:               'No manual evidence — cannot review',
  evidence_logged_result_pending:   'Evidence logged — result pending',
  provided_manual_result_reviewed:  'Provided manual result — reviewed',
};

export const REVIEW_STATUS_DESCRIPTION: Record<ResultReviewStatus, string> = {
  no_manual_evidence:
    'Cannot review a result because the Owner has not recorded any manually-published evidence yet.',
  evidence_logged_result_pending:
    'Manual publishing evidence exists, but no Owner/Client-provided result metrics yet — the result is pending.',
  provided_manual_result_reviewed:
    'The Owner provided manual result data, so CORE generated a deterministic review from that provided data only.',
};

export const REVIEW_STATUS_COLOR: Record<ResultReviewStatus, string> = {
  no_manual_evidence:               '#94a3b8',
  evidence_logged_result_pending:   '#fbbf24',
  provided_manual_result_reviewed:  '#34d399',
};

// ---------------------------------------------------------------------------
// Conservative performance signal — derived ONLY from provided manual data and
// always labeled as such. Never a success/failure verdict from absent data.
// ---------------------------------------------------------------------------

export type PerformanceSignal =
  | 'insufficient_data'
  | 'limited_provided_data'
  | 'provided_data_positive'
  | 'provided_data_mixed'
  | 'provided_data_concern';

export const PERFORMANCE_SIGNAL_LABEL: Record<PerformanceSignal, string> = {
  insufficient_data:      'Insufficient data (no review yet)',
  limited_provided_data:  'Limited — provided manual data only',
  provided_data_positive: 'Positive — based on provided manual data',
  provided_data_mixed:    'Mixed — based on provided manual data',
  provided_data_concern:  'Concern — based on provided manual data',
};

export const PERFORMANCE_SIGNAL_COLOR: Record<PerformanceSignal, string> = {
  insufficient_data:      '#94a3b8',
  limited_provided_data:  '#60a5fa',
  provided_data_positive: '#34d399',
  provided_data_mixed:    '#fbbf24',
  provided_data_concern:  '#f87171',
};

export type ConfidenceLevel = 'none' | 'low' | 'medium' | 'high';

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  none:   'None',
  low:    'Low',
  medium: 'Medium',
  high:   'High',
};

export type EvidenceQuality = 'none' | 'weak' | 'adequate' | 'strong';

export const EVIDENCE_QUALITY_LABEL: Record<EvidenceQuality, string> = {
  none:     'None',
  weak:     'Weak',
  adequate: 'Adequate',
  strong:   'Strong',
};

export type AttributionQuality = 'none' | 'weak' | 'moderate' | 'clear';

export const ATTRIBUTION_QUALITY_LABEL: Record<AttributionQuality, string> = {
  none:     'None',
  weak:     'Weak',
  moderate: 'Moderate',
  clear:    'Clear',
};

// ---------------------------------------------------------------------------
// Risk flags — incomplete or risky result data. Closed union; stable order.
// ---------------------------------------------------------------------------

export type ResultRiskFlag =
  | 'incomplete_conversion_data'
  | 'weak_attribution'
  | 'customer_complaint'
  | 'stockout_or_capacity_issue'
  | 'content_accuracy_issue'
  | 'timing_issue'
  | 'unverified_metrics';

/** Stable display/dedupe order for risk flags. */
export const RISK_FLAG_ORDER: ResultRiskFlag[] = [
  'incomplete_conversion_data',
  'weak_attribution',
  'customer_complaint',
  'stockout_or_capacity_issue',
  'content_accuracy_issue',
  'timing_issue',
  'unverified_metrics',
];

export const RISK_FLAG_LABEL: Record<ResultRiskFlag, string> = {
  incomplete_conversion_data: 'Incomplete conversion data',
  weak_attribution:           'Weak attribution',
  customer_complaint:         'Customer complaint',
  stockout_or_capacity_issue: 'Stockout / capacity issue',
  content_accuracy_issue:     'Content accuracy issue',
  timing_issue:               'Timing issue',
  unverified_metrics:         'Unverified metrics',
};

export const RISK_FLAG_DETAIL: Record<ResultRiskFlag, string> = {
  incomplete_conversion_data:
    'Spend was recorded but conversion metrics (messages / orders / revenue) are missing.',
  weak_attribution:
    'Orders/revenue were recorded without supporting evidence or an Owner/Client-provided data source.',
  customer_complaint:
    'Owner notes mention a customer complaint (e.g. chê / phàn nàn).',
  stockout_or_capacity_issue:
    'Owner notes mention a stockout or capacity problem (e.g. hết hàng).',
  content_accuracy_issue:
    'Owner notes mention wrong price / wrong info / wrong item (e.g. sai giá / sai món).',
  timing_issue:
    'Owner notes mention a late or wrong-time post (e.g. đăng muộn / sai giờ).',
  unverified_metrics:
    'Metrics were provided but the data source is simulated / not provided — not treated as real.',
};

export const RISK_FLAG_COLOR: Record<ResultRiskFlag, string> = {
  incomplete_conversion_data: '#fbbf24',
  weak_attribution:           '#fbbf24',
  customer_complaint:         '#f87171',
  stockout_or_capacity_issue: '#f87171',
  content_accuracy_issue:     '#f87171',
  timing_issue:               '#fb923c',
  unverified_metrics:         '#fbbf24',
};

// ---------------------------------------------------------------------------
// Note keyword matchers (English + Vietnamese, with/without diacritics).
// Pure substring scans over Owner-provided free text — no inference beyond words.
// ---------------------------------------------------------------------------

const COMPLAINT_KEYWORDS = [
  'complaint', 'complain', 'chê', 'phàn nàn', 'phan nan', 'khách chê', 'khach che',
  'bị chê', 'bi che', 'negative review', 'bad review', '1 sao', 'một sao', 'mot sao',
];
const STOCKOUT_KEYWORDS = [
  'stockout', 'out of stock', 'sold out', 'hết hàng', 'het hang', 'cháy hàng', 'chay hang',
  'quá tải', 'qua tai', 'không đủ hàng', 'khong du hang', 'hết món', 'het mon', 'overcapacity',
];
const CONTENT_ACCURACY_KEYWORDS = [
  'wrong price', 'incorrect price', 'sai giá', 'sai gia', 'sai thông tin', 'sai thong tin',
  'sai món', 'sai mon', 'wrong info', 'wrong information', 'sai nội dung', 'sai noi dung',
  'sai chính tả', 'sai chinh ta', 'typo',
];
const TIMING_KEYWORDS = [
  'late post', 'posted late', 'đăng muộn', 'dang muon', 'đăng trễ', 'dang tre',
  'trễ giờ', 'tre gio', 'sai giờ', 'sai gio', 'wrong time', 'off schedule', 'muộn giờ', 'muon gio',
];

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(k => text.includes(k));
}

// ---------------------------------------------------------------------------
// Metric groupings used by the deterministic rules.
// ---------------------------------------------------------------------------

/** Conversion metrics checked against recorded spend (rule: spend without conversion). */
const CONVERSION_KEYS_FOR_SPEND: ResultMetricKey[] = ['messages', 'orders', 'revenue'];
/** Conversion metrics whose presence demands attribution evidence (rule: weak attribution). */
const ATTRIBUTION_CONVERSION_KEYS: ResultMetricKey[] = ['orders', 'revenue'];
/** Positive-signal metrics used to compare entries for a "repeat this angle" suggestion. */
const SIGNAL_SCORE_KEYS: ResultMetricKey[] = ['engagement', 'messages', 'leads', 'orders'];

// ---------------------------------------------------------------------------
// Input + output contracts
// ---------------------------------------------------------------------------

/**
 * One unit of Owner-provided manual result data to review: a Phase V evidence
 * record, plus an OPTIONAL Owner-provided manual `spend` (Phase V has no spend
 * field). `spend` is local-only — never pulled from any ads connector.
 */
export interface ManualResultReviewEntryInput {
  evidence: ManualPublishingEvidence;
  /** Owner-provided manual ad spend for this item (optional, local-only). */
  spend?: number;
}

export interface EntryMetricCell {
  key: ResultMetricKey;
  label: string;
  value: number;
}

/** Per-entry analysis (reused by the aggregate review + the panel's row detail). */
export interface ResultEntryReview {
  id: string;
  campaignId: string;
  channel: string | null;
  contentItemId: string | null;
  publishStatus: PublishStatus;
  publish_status_label: string;
  /** True only for Phase V `manually_published` — reused via isPublishedRecord. */
  is_published_record: boolean;
  is_scheduled_not_published: boolean;
  resultDataSource: ResultDataSource;
  result_data_source_label: string;
  metrics_presentation: MetricsPresentation;
  /** Metrics may be presented as real (published + owner/client-provided + present). */
  metrics_are_real: boolean;
  providedMetrics: EntryMetricCell[];
  spend: number | null;
  spendProvided: boolean;
  hasConversion: boolean;
  hasAttributionEvidence: boolean;
  evidenceQuality: EvidenceQuality;
  attributionQuality: AttributionQuality;
  confidenceLevel: ConfidenceLevel;
  /** Sum of positive-signal provided metrics; 0 unless metrics are real. */
  signalScore: number;
  riskFlags: ResultRiskFlag[];
}

export type LearningCandidateKind = 'repeat' | 'avoid' | 'investigate';

export interface LearningCandidate {
  kind: LearningCandidateKind;
  label: string;
  /** Always phrased "Based on provided manual data…" — never "analytics shows". */
  insight: string;
  basis: string;
  /** Structural guarantee: a candidate is NEVER persisted to Brand Brain. */
  persisted: false;
}

export interface BrandBrainLearningCandidatePreview {
  note: string;
  /** Structural guarantees — Brand Brain is never written to from here. */
  persisted_to_brand_brain: false;
  is_brand_brain_update: false;
  requires_owner_review: true;
  /** Whether the provided data is enough to draw a learning at all. */
  sufficiency: 'insufficient' | 'sufficient';
  candidates: LearningCandidate[];
}

export interface ResultSummary {
  headline: string;
  publishedItemCount: number;
  reviewedItemCount: number;
  /** One line per reviewed entry, listing ONLY provided metric values. */
  providedMetricLines: string[];
  basis: string;
}

export interface ManualResultReview {
  campaignId: string | null;
  reviewStatus: ResultReviewStatus;
  review_status_label: string;
  resultSummary: ResultSummary;
  performanceSignal: PerformanceSignal;
  performance_signal_label: string;
  confidenceLevel: ConfidenceLevel;
  confidence_label: string;
  evidenceQuality: EvidenceQuality;
  evidence_quality_label: string;
  attributionQuality: AttributionQuality;
  attribution_quality_label: string;
  riskFlags: ResultRiskFlag[];
  risk_flag_details: { flag: ResultRiskFlag; label: string; detail: string }[];
  learningCandidates: LearningCandidate[];
  repeatRecommendations: string[];
  avoidRecommendations: string[];
  nextActionSuggestions: string[];
  brandBrainLearningCandidatePreview: BrandBrainLearningCandidatePreview;
  safetyDisclaimers: string[];
  entries: ResultEntryReview[];
  publishedEntryCount: number;
  reviewedEntryCount: number;
  /** CORE itself never publishes — structural guarantee, always false. */
  core_published: false;
  /** This review never changes Published semantics — structural guarantee. */
  published_semantics_unchanged: true;
  /** No analytics connector is wired — structural guarantee. */
  no_live_analytics: true;
  /** Brand Brain is never written to from here — structural guarantee. */
  persisted_to_brand_brain: false;
  generatedAt: string;
}

export interface ManualResultReviewParams {
  now?: Date;
}

// ---------------------------------------------------------------------------
// Small rank helpers for "best across entries" aggregation.
// ---------------------------------------------------------------------------

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };
const EVIDENCE_RANK: Record<EvidenceQuality, number> = { none: 0, weak: 1, adequate: 2, strong: 3 };
const ATTRIBUTION_RANK: Record<AttributionQuality, number> = { none: 0, weak: 1, moderate: 2, clear: 3 };

function bestBy<T extends string>(values: T[], rank: Record<T, number>, fallback: T): T {
  let best = fallback;
  for (const v of values) if (rank[v] > rank[best]) best = v;
  return best;
}

function dedupeFlags(flags: ResultRiskFlag[]): ResultRiskFlag[] {
  const set = new Set(flags);
  return RISK_FLAG_ORDER.filter(f => set.has(f));
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Per-entry analysis (pure)
// ---------------------------------------------------------------------------

function entryConfidence(args: {
  metricsAreReal: boolean;
  metricCount: number;
  hasUrl: boolean;
  hasNote: boolean;
  source: ResultDataSource;
}): ConfidenceLevel {
  if (!args.metricsAreReal) return 'none';
  const adequate = args.hasUrl || args.hasNote;
  const strong = args.hasUrl && args.hasNote;
  // Owner estimate without any evidence link/note → never high (rule: estimate-only).
  const ownerEstimateOnly = args.source === 'owner_provided' && !adequate;
  if (ownerEstimateOnly) return 'low';
  if (strong && args.metricCount >= 3) return 'high';
  if (adequate && args.metricCount >= 2) return 'medium';
  return 'low';
}

/** Analyze ONE Owner-provided manual result entry. Pure — reads, never mutates. */
export function reviewEntry(input: ManualResultReviewEntryInput): ResultEntryReview {
  const e = input.evidence;
  const metrics = e.metrics ?? {};

  const providedMetrics: EntryMetricCell[] = RESULT_METRIC_KEYS
    .filter(k => {
      const v = metrics[k];
      return typeof v === 'number' && Number.isFinite(v);
    })
    .map(k => ({ key: k, label: RESULT_METRIC_LABEL[k], value: metrics[k] as number }));
  const providedKeys = providedMetrics.map(c => c.key);

  const isPublished = isPublishedRecord(e.publishStatus);
  const realSource = metricsRealClaimAllowed(e.resultDataSource);
  const anyMetric = providedMetrics.length > 0;
  const metricsAreReal = isPublished && anyMetric && realSource;

  const hasUrl = !!(e.publicUrl && e.publicUrl.trim());
  const hasNote = !!(e.evidenceNote && e.evidenceNote.trim());
  const hasAttributionEvidence = hasUrl || hasNote;

  const spend =
    typeof input.spend === 'number' && Number.isFinite(input.spend) && input.spend >= 0
      ? input.spend
      : null;
  const spendProvided = spend !== null && spend > 0;

  const hasConversion = ATTRIBUTION_CONVERSION_KEYS.some(k => providedKeys.includes(k));
  const hasSpendConversion = CONVERSION_KEYS_FOR_SPEND.some(k => providedKeys.includes(k));

  // Evidence quality (only meaningful once manually published).
  let evidenceQuality: EvidenceQuality = 'none';
  if (isPublished) {
    if (hasUrl && hasNote) evidenceQuality = 'strong';
    else if (hasAttributionEvidence) evidenceQuality = 'adequate';
    else evidenceQuality = 'weak';
  }

  // Attribution quality.
  let attributionQuality: AttributionQuality = 'none';
  if (isPublished) {
    if (hasAttributionEvidence && realSource) attributionQuality = 'clear';
    else if (hasAttributionEvidence || realSource) attributionQuality = 'moderate';
    else attributionQuality = 'weak';
  }

  // Risk flags — only for published items (we review the result of a publish).
  const flags: ResultRiskFlag[] = [];
  if (isPublished) {
    if (spendProvided && !hasSpendConversion) flags.push('incomplete_conversion_data');
    if (hasConversion && (!hasAttributionEvidence || !realSource)) flags.push('weak_attribution');
    const text = [e.evidenceNote, e.notes].map(s => (s ?? '').toLowerCase()).join('  ·  ');
    if (matchesAny(text, COMPLAINT_KEYWORDS)) flags.push('customer_complaint');
    if (matchesAny(text, STOCKOUT_KEYWORDS)) flags.push('stockout_or_capacity_issue');
    if (matchesAny(text, CONTENT_ACCURACY_KEYWORDS)) flags.push('content_accuracy_issue');
    if (matchesAny(text, TIMING_KEYWORDS)) flags.push('timing_issue');
    if (anyMetric && !realSource) flags.push('unverified_metrics');
  }

  // Positive-signal score for "repeat this angle" — only when metrics are real.
  let signalScore = 0;
  if (metricsAreReal) {
    for (const c of providedMetrics) {
      if (SIGNAL_SCORE_KEYS.includes(c.key)) signalScore += c.value;
    }
  }

  const confidenceLevel = entryConfidence({
    metricsAreReal,
    metricCount: providedMetrics.length,
    hasUrl,
    hasNote,
    source: e.resultDataSource,
  });

  return {
    id: e.id,
    campaignId: e.campaignId,
    channel: (e.channel ?? '').trim() || null,
    contentItemId: (e.contentItemId ?? '').trim() || null,
    publishStatus: e.publishStatus,
    publish_status_label: PUBLISH_STATUS_LABEL[e.publishStatus],
    is_published_record: isPublished,
    is_scheduled_not_published: isScheduledNotPublished(e.publishStatus),
    resultDataSource: e.resultDataSource,
    result_data_source_label: RESULT_DATA_SOURCE_LABEL[e.resultDataSource],
    metrics_presentation: metricsPresentation(e.resultDataSource, e.metrics),
    metrics_are_real: metricsAreReal,
    providedMetrics,
    spend,
    spendProvided,
    hasConversion,
    hasAttributionEvidence,
    evidenceQuality,
    attributionQuality,
    confidenceLevel,
    signalScore,
    riskFlags: dedupeFlags(flags),
  };
}

// ---------------------------------------------------------------------------
// Aggregate derivations (pure)
// ---------------------------------------------------------------------------

function derivePerformanceSignal(
  status: ResultReviewStatus,
  reviewable: ResultEntryReview[],
  flags: ResultRiskFlag[],
): PerformanceSignal {
  if (status !== 'provided_manual_result_reviewed') return 'insufficient_data';
  const concern = flags.some(
    f => f === 'customer_complaint' || f === 'content_accuracy_issue' || f === 'stockout_or_capacity_issue',
  );
  const hasConversion = reviewable.some(e => e.hasConversion);
  if (concern && hasConversion) return 'provided_data_mixed';
  if (concern) return 'provided_data_concern';
  if (hasConversion) return 'provided_data_positive';
  return 'limited_provided_data';
}

function buildResultSummary(
  status: ResultReviewStatus,
  published: ResultEntryReview[],
  reviewable: ResultEntryReview[],
): ResultSummary {
  let headline: string;
  if (status === 'no_manual_evidence') {
    headline = 'No manually-published evidence yet — there is no result to review.';
  } else if (status === 'evidence_logged_result_pending') {
    headline = `${published.length} item(s) recorded as manually published, but no Owner/Client-provided result metrics yet — result pending.`;
  } else {
    headline = `${reviewable.length} of ${published.length} manually-published item(s) have Owner/Client-provided result data — reviewed from provided manual data only.`;
  }

  const providedMetricLines = reviewable.map(e => {
    const where = e.channel ?? 'item';
    const metricsStr = e.providedMetrics.map(c => `${c.label}: ${fmtNum(c.value)}`).join(' · ');
    return `${where} — ${metricsStr} (${e.result_data_source_label})`;
  });

  return {
    headline,
    publishedItemCount: published.length,
    reviewedItemCount: reviewable.length,
    providedMetricLines,
    basis: 'Based on Owner/Client-provided manual data only — no live analytics, no connector.',
  };
}

function buildRepeatRecommendations(reviewable: ResultEntryReview[]): string[] {
  const scored = reviewable.filter(e => e.signalScore > 0);
  if (scored.length === 0) return [];
  const max = Math.max(...scored.map(e => e.signalScore));
  const top = scored.find(e => e.signalScore === max);
  if (!top) return [];
  const where = top.channel ?? 'this item';
  const item = top.contentItemId ? ` (item ${top.contentItemId})` : '';
  return [
    `Based on provided manual data, "${where}"${item} showed the strongest provided engagement/conversion signals — consider repeating this angle. (Owner-provided manual data only, not analytics.)`,
  ];
}

function buildAvoidRecommendations(flags: ResultRiskFlag[]): string[] {
  const out: string[] = [];
  if (flags.includes('customer_complaint')) {
    out.push('Based on provided manual data, a customer complaint was noted — resolve it before repeating this content.');
  }
  if (flags.includes('content_accuracy_issue')) {
    out.push('Based on provided manual data, a content accuracy issue (wrong price/info) was noted — fix and double-check before repeating.');
  }
  if (flags.includes('timing_issue')) {
    out.push('Based on provided manual data, a timing / late-post issue was noted — plan the publish slot before repeating.');
  }
  if (flags.includes('stockout_or_capacity_issue')) {
    out.push('Based on provided manual data, a stockout / capacity issue was noted — align stock and capacity before driving more demand.');
  }
  return out;
}

function buildNextActions(status: ResultReviewStatus, flags: ResultRiskFlag[]): string[] {
  if (status === 'no_manual_evidence') {
    return ['Record manual publishing evidence (channel, who published, screenshot or URL) before any result review is possible.'];
  }
  const out: string[] = [];
  if (status === 'evidence_logged_result_pending') {
    out.push('After 24h / 3 days / 7 days, record manual result metrics (reach, messages, orders, revenue) for the published item so CORE can review it.');
  }
  if (flags.includes('incomplete_conversion_data')) {
    out.push('Record conversion metrics (messages / orders / revenue) to match the recorded spend.');
  }
  if (flags.includes('weak_attribution')) {
    out.push('Add evidence (screenshot or URL) and set the result data source to Owner-provided or Client-provided to support the orders/revenue figures.');
  }
  if (flags.includes('unverified_metrics')) {
    out.push('Set the result data source to Owner-provided or Client-provided — simulated / unverified metrics are not treated as real.');
  }
  if (status === 'provided_manual_result_reviewed') {
    out.push('Owner to review the learning candidates below. Nothing is written to Brand Brain automatically — these are previews only.');
  }
  return out;
}

function buildLearningCandidates(
  repeatRecommendations: string[],
  avoidRecommendations: string[],
  flags: ResultRiskFlag[],
): LearningCandidate[] {
  const out: LearningCandidate[] = [];
  for (const r of repeatRecommendations) {
    out.push({ kind: 'repeat', label: 'Repeat candidate', insight: r, basis: 'Owner/Client-provided manual result data', persisted: false });
  }
  for (const a of avoidRecommendations) {
    out.push({ kind: 'avoid', label: 'Avoid candidate', insight: a, basis: 'Owner-provided manual notes', persisted: false });
  }
  if (flags.includes('weak_attribution') || flags.includes('incomplete_conversion_data')) {
    out.push({
      kind: 'investigate',
      label: 'Investigate candidate',
      insight: 'Based on provided manual data, attribution/conversion data is incomplete — gather more Owner-provided result data before drawing a learning.',
      basis: 'Owner-provided manual result data (incomplete)',
      persisted: false,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Top-level review builder (pure)
// ---------------------------------------------------------------------------

/**
 * Build a deterministic review over Owner-provided manual result entries. Pure:
 * a fixed function of the inputs plus an injectable `now`. Never pulls analytics,
 * never changes Published status, never writes Brand Brain.
 */
export function buildManualResultReview(
  inputs: ManualResultReviewEntryInput[],
  params: ManualResultReviewParams = {},
): ManualResultReview {
  const now = params.now ?? new Date();
  const entries = inputs.map(reviewEntry);

  const published = entries.filter(e => e.is_published_record);
  const reviewable = published.filter(e => e.metrics_are_real);

  let reviewStatus: ResultReviewStatus;
  if (published.length === 0) reviewStatus = 'no_manual_evidence';
  else if (reviewable.length === 0) reviewStatus = 'evidence_logged_result_pending';
  else reviewStatus = 'provided_manual_result_reviewed';

  // Risk flags are reviewed only for published items.
  const riskFlags = dedupeFlags(published.flatMap(e => e.riskFlags));

  const evidenceQuality = bestBy(published.map(e => e.evidenceQuality), EVIDENCE_RANK, 'none');
  const attributionQuality = bestBy(published.map(e => e.attributionQuality), ATTRIBUTION_RANK, 'none');
  const confidenceLevel = bestBy(reviewable.map(e => e.confidenceLevel), CONFIDENCE_RANK, 'none');

  const performanceSignal = derivePerformanceSignal(reviewStatus, reviewable, riskFlags);
  const resultSummary = buildResultSummary(reviewStatus, published, reviewable);

  // Repeat learnings need real metrics; avoid learnings come from explicit notes.
  const repeatRecommendations = reviewStatus === 'provided_manual_result_reviewed'
    ? buildRepeatRecommendations(reviewable)
    : [];
  const avoidRecommendations = buildAvoidRecommendations(riskFlags);
  const nextActionSuggestions = buildNextActions(reviewStatus, riskFlags);
  const learningCandidates = buildLearningCandidates(repeatRecommendations, avoidRecommendations, riskFlags);

  const brandBrainLearningCandidatePreview: BrandBrainLearningCandidatePreview = {
    note: RESULT_REVIEW_BRAND_BRAIN_NOTE,
    persisted_to_brand_brain: false,
    is_brand_brain_update: false,
    requires_owner_review: true,
    sufficiency: reviewStatus === 'provided_manual_result_reviewed' ? 'sufficient' : 'insufficient',
    candidates: learningCandidates,
  };

  return {
    campaignId: entries[0]?.campaignId ?? null,
    reviewStatus,
    review_status_label: REVIEW_STATUS_LABEL[reviewStatus],
    resultSummary,
    performanceSignal,
    performance_signal_label: PERFORMANCE_SIGNAL_LABEL[performanceSignal],
    confidenceLevel,
    confidence_label: CONFIDENCE_LABEL[confidenceLevel],
    evidenceQuality,
    evidence_quality_label: EVIDENCE_QUALITY_LABEL[evidenceQuality],
    attributionQuality,
    attribution_quality_label: ATTRIBUTION_QUALITY_LABEL[attributionQuality],
    riskFlags,
    risk_flag_details: riskFlags.map(f => ({ flag: f, label: RISK_FLAG_LABEL[f], detail: RISK_FLAG_DETAIL[f] })),
    learningCandidates,
    repeatRecommendations,
    avoidRecommendations,
    nextActionSuggestions,
    brandBrainLearningCandidatePreview,
    safetyDisclaimers: [...RESULT_REVIEW_SAFETY_DISCLAIMERS],
    entries,
    publishedEntryCount: published.length,
    reviewedEntryCount: reviewable.length,
    core_published: false,
    published_semantics_unchanged: true,
    no_live_analytics: true,
    persisted_to_brand_brain: false,
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network. Prints ONLY provided values; no URLs are emitted.
// ---------------------------------------------------------------------------

export function renderManualResultReviewText(
  review: ManualResultReview,
  title = 'Manual Result Review',
): string {
  const lines: string[] = [];
  lines.push(`MANUAL RESULT REVIEW (LOCAL/DEMO) — ${title}`);
  lines.push(RESULT_REVIEW_MANUAL_ONLY);
  lines.push(`${RESULT_REVIEW_NO_LIVE_ANALYTICS} ${RESULT_REVIEW_NO_PUBLISHED_CHANGE}`);
  lines.push(`${RESULT_REVIEW_LEARNING_CANDIDATE_ONLY} ${RESULT_REVIEW_NOT_PERSISTED_BRAND_BRAIN}`);
  lines.push(RESULT_REVIEW_SAFETY_NOTE);
  lines.push(`${EVIDENCE_APPROVED_NOT_PUBLISHED} ${EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED}`);
  lines.push('');

  lines.push(`Review status: ${review.review_status_label}`);
  lines.push(`- ${review.resultSummary.headline}`);
  lines.push(`Performance signal: ${review.performance_signal_label}`);
  lines.push(`Confidence: ${review.confidence_label} · Evidence: ${review.evidence_quality_label} · Attribution: ${review.attribution_quality_label}`);
  lines.push('');

  if (review.resultSummary.providedMetricLines.length > 0) {
    lines.push('PROVIDED MANUAL RESULT DATA (Owner/Client-provided only)');
    for (const m of review.resultSummary.providedMetricLines) lines.push(`- ${m}`);
    lines.push('');
  }

  if (review.riskFlags.length > 0) {
    lines.push('RISK FLAGS (incomplete / risky provided data)');
    for (const d of review.risk_flag_details) lines.push(`- ${d.label}: ${d.detail}`);
    lines.push('');
  }

  if (review.repeatRecommendations.length > 0) {
    lines.push('REPEAT (based on provided manual data)');
    for (const r of review.repeatRecommendations) lines.push(`- ${r}`);
    lines.push('');
  }

  if (review.avoidRecommendations.length > 0) {
    lines.push('AVOID (based on provided manual data)');
    for (const r of review.avoidRecommendations) lines.push(`- ${r}`);
    lines.push('');
  }

  lines.push('NEXT ACTION SUGGESTIONS (Owner data needed next)');
  if (review.nextActionSuggestions.length === 0) lines.push('- (None.)');
  for (const n of review.nextActionSuggestions) lines.push(`- ${n}`);
  lines.push('');

  lines.push('BRAND BRAIN LEARNING CANDIDATE (PREVIEW ONLY)');
  lines.push(`- ${review.brandBrainLearningCandidatePreview.note}`);
  lines.push(`- Sufficiency: ${review.brandBrainLearningCandidatePreview.sufficiency}`);
  if (review.brandBrainLearningCandidatePreview.candidates.length === 0) {
    lines.push('- (No learning candidates yet — insufficient provided data.)');
  } else {
    for (const c of review.brandBrainLearningCandidatePreview.candidates) {
      lines.push(`- [${c.kind}] ${c.insight}`);
    }
  }
  lines.push('');

  lines.push('SAFETY');
  for (const s of review.safetyDisclaimers) lines.push(`- ${s}`);
  lines.push('- No live analytics pull, no connector, no AI/API/network call, no auto-post, no auto-ads — local/demo review only.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Deterministic mock seed — sample Owner-provided result entries for the local
// preview. Built from the Phase V evidence sample plus a SAMPLE manual spend on
// the manually-published row. All values are explicitly SAMPLE/local.
// ---------------------------------------------------------------------------

export function sampleManualResultEntries(
  campaignId = 'campaign-sample',
  now: Date = new Date('2026-06-25T10:00:00.000Z'),
): ManualResultReviewEntryInput[] {
  const evidence = sampleManualPublishingEvidence(campaignId, now);
  return evidence.map(e =>
    isPublishedRecord(e.publishStatus)
      ? { evidence: e, spend: 300_000 } // SAMPLE Owner-provided manual spend (VND), local-only
      : { evidence: e },
  );
}
