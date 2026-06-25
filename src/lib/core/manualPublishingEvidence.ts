// ---------------------------------------------------------------------------
// Manual Publishing Evidence & Result Intake (Phase V) — pure, local/demo
//
// A SAFE, deterministic post-delivery EVIDENCE layer that sits ON TOP of Phase U
// (Delivery Closure) and Phase T (Delivery Acceptance). After a delivery has been
// accepted/closed, this layer lets the Owner MANUALLY RECORD whether the delivered
// assets were actually published OUTSIDE CORE — without CORE publishing anything:
//
//   • CORE never publishes. Every value here is Owner-provided (or client-provided,
//     or simulated demo) EVIDENCE — Core itself posts nothing, schedules nothing,
//     launches no ads, spends nothing, calls no connector, opens no external endpoint,
//     pulls no analytics, and creates no public link. A recorded `publicUrl` is the Owner
//     pasting where THEY published manually — it is data, not an action Core took.
//   • Approved ≠ Published and Client Accepted ≠ Published stay explicit. The ONLY
//     status that means "published" is `manually_published`, which RECORDS that a
//     person published manually outside CORE. `scheduled_outside_core` is NOT
//     published. Nothing here is ever derived automatically.
//   • Result metrics (reach/impressions/engagement/messages/leads/orders/revenue)
//     can NEVER be presented as real unless the source is `owner_provided` or
//     `client_provided`. `simulated_demo` / `not_provided` metrics are labeled as
//     simulated/unverified — there is no live analytics pull and no fake metric.
//
// Pure & deterministic: validation/report are fixed functions of explicit inputs,
// and mutators return NEW arrays (no in-place mutation). No localStorage, no DB, no
// network, no connectors — trivially unit-testable. The UI panel holds the evidence
// list in local React state. See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------

import { generateId } from './coreData';

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so the panel + tests reference one source.
// ---------------------------------------------------------------------------

/** Required, visible "CORE does not publish" evidence-only label. */
export const EVIDENCE_CORE_DOES_NOT_PUBLISH =
  'CORE does not publish. This is Owner-provided evidence only.';

/** Approved ≠ Published stays explicit. */
export const EVIDENCE_APPROVED_NOT_PUBLISHED = 'Approved ≠ Published.';

/** Client Accepted ≠ Published stays explicit. */
export const EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED = 'Client Accepted ≠ Published.';

/** "Published" only ever means a manual Owner record, never a Core action. */
export const EVIDENCE_PUBLISHED_MEANS_MANUAL =
  'Published means manually recorded by the Owner — it is never an action CORE carried out.';

/** Required report notice: no analytics connector is wired. */
export const EVIDENCE_NO_LIVE_ANALYTICS = 'No live analytics connected.';

/** Required report notice: everything here is manual evidence. */
export const EVIDENCE_MANUAL_ONLY = 'Manual evidence only.';

/** Full safety note carried on the report + copied text. */
export const EVIDENCE_SAFETY_NOTE =
  'Manual publishing evidence is local/demo state only. Core never publishes, posts, schedules, ' +
  'launches, spends, calls any connector, opens any external endpoint, or pulls any analytics. Marking ' +
  'an asset "manually published" only records that a person published it manually outside CORE.';

/** Local/demo provenance badges shown on the panel. */
export const EVIDENCE_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo state only',
  'No publishing by CORE',
  'No live analytics',
  'No connector used',
];

// ---------------------------------------------------------------------------
// Publish status — what the Owner manually recorded about a delivered asset.
//
// NOTE: there is intentionally NO Core-set `published`/`launched` state. The only
// status meaning "published" is `manually_published`, an Owner annotation that a
// human published OUTSIDE Core. `scheduled_outside_core` is explicitly NOT published.
// ---------------------------------------------------------------------------

export type PublishStatus =
  | 'not_published'
  | 'manually_published'
  | 'scheduled_outside_core'
  | 'blocked_or_cancelled';

export const PUBLISH_STATUSES: PublishStatus[] = [
  'not_published',
  'manually_published',
  'scheduled_outside_core',
  'blocked_or_cancelled',
];

export const DEFAULT_PUBLISH_STATUS: PublishStatus = 'not_published';

export const PUBLISH_STATUS_LABEL: Record<PublishStatus, string> = {
  not_published:          'Not published',
  manually_published:     'Manually published (outside CORE)',
  scheduled_outside_core: 'Scheduled outside CORE',
  blocked_or_cancelled:   'Blocked / cancelled',
};

export const PUBLISH_STATUS_COLOR: Record<PublishStatus, string> = {
  not_published:          '#94a3b8',
  manually_published:     '#a78bfa',
  scheduled_outside_core: '#60a5fa',
  blocked_or_cancelled:   '#f87171',
};

export const PUBLISH_STATUS_DESCRIPTION: Record<PublishStatus, string> = {
  not_published:
    'Not published anywhere yet. Nothing has gone live — Core has done no publishing.',
  manually_published:
    'A person recorded that this asset was published MANUALLY outside CORE. Core did no publishing — this is Owner-provided evidence only.',
  scheduled_outside_core:
    'A person scheduled this asset on an external tool/channel OUTSIDE CORE. This is NOT published — it is a manual schedule the Owner recorded.',
  blocked_or_cancelled:
    'Publishing was blocked or cancelled. The asset is not live and was not published.',
};

// ---------------------------------------------------------------------------
// Result data source — provenance of any recorded metrics. Metrics may only be
// presented as REAL when the source is owner_provided or client_provided.
// ---------------------------------------------------------------------------

export type ResultDataSource =
  | 'not_provided'
  | 'owner_provided'
  | 'client_provided'
  | 'simulated_demo';

export const RESULT_DATA_SOURCES: ResultDataSource[] = [
  'not_provided',
  'owner_provided',
  'client_provided',
  'simulated_demo',
];

export const DEFAULT_RESULT_DATA_SOURCE: ResultDataSource = 'not_provided';

export const RESULT_DATA_SOURCE_LABEL: Record<ResultDataSource, string> = {
  not_provided:   'Not provided',
  owner_provided: 'Owner-provided',
  client_provided:'Client-provided',
  simulated_demo: 'Simulated / demo',
};

export const RESULT_DATA_SOURCE_COLOR: Record<ResultDataSource, string> = {
  not_provided:   '#94a3b8',
  owner_provided: '#34d399',
  client_provided:'#60a5fa',
  simulated_demo: '#fbbf24',
};

// ---------------------------------------------------------------------------
// Result metrics — optional, manual-only. Never pulled from any analytics API.
// ---------------------------------------------------------------------------

export type ResultMetricKey =
  | 'reach'
  | 'impressions'
  | 'engagement'
  | 'messages'
  | 'leads'
  | 'orders'
  | 'revenue';

export const RESULT_METRIC_KEYS: ResultMetricKey[] = [
  'reach',
  'impressions',
  'engagement',
  'messages',
  'leads',
  'orders',
  'revenue',
];

export const RESULT_METRIC_LABEL: Record<ResultMetricKey, string> = {
  reach:       'Reach',
  impressions: 'Impressions',
  engagement:  'Engagement',
  messages:    'Messages',
  leads:       'Leads',
  orders:      'Orders',
  revenue:     'Revenue',
};

/** A bag of manual-only metric values. All optional — only what the Owner typed. */
export type ResultMetrics = Partial<Record<ResultMetricKey, number>>;

/** Suggested manual channels for the UI dropdown — display-only labels, not connectors. */
export const SAMPLE_PUBLISH_CHANNELS: string[] = [
  'Facebook Page',
  'Instagram',
  'TikTok',
  'Zalo OA',
  'Google Business Profile',
  'Website / Blog',
  'Other channel',
];

// ---------------------------------------------------------------------------
// Status semantics — small, explicit predicates so the rules stay one source.
// ---------------------------------------------------------------------------

/** The ONLY status that records a (manual, outside-CORE) publish. */
export function isManuallyPublished(status: PublishStatus): boolean {
  return status === 'manually_published';
}

/** Scheduled outside CORE is explicitly NOT published. */
export function isScheduledNotPublished(status: PublishStatus): boolean {
  return status === 'scheduled_outside_core';
}

/**
 * Whether THIS record counts as "published" — true ONLY for the manual annotation.
 * Approved/accepted/scheduled never count, and Core itself never publishes.
 */
export function isPublishedRecord(status: PublishStatus): boolean {
  return status === 'manually_published';
}

/** Metrics may only be presented as REAL when owner- or client-provided. */
export function metricsRealClaimAllowed(source: ResultDataSource): boolean {
  return source === 'owner_provided' || source === 'client_provided';
}

/** True when at least one metric carries a finite, non-negative number. */
export function hasAnyMetric(metrics: ResultMetrics | undefined): boolean {
  if (!metrics) return false;
  return RESULT_METRIC_KEYS.some(k => {
    const v = metrics[k];
    return typeof v === 'number' && Number.isFinite(v);
  });
}

export type MetricsPresentation = 'none' | 'manual_provided_real' | 'simulated_or_unverified';

export const METRICS_PRESENTATION_LABEL: Record<MetricsPresentation, string> = {
  none:                    'No metrics recorded',
  manual_provided_real:    'Manual provided data (Owner/Client)',
  simulated_or_unverified: 'Simulated / unverified — not real',
};

/** Classify how any recorded metrics may be presented, given their source. */
export function metricsPresentation(source: ResultDataSource, metrics: ResultMetrics | undefined): MetricsPresentation {
  if (!hasAnyMetric(metrics)) return 'none';
  return metricsRealClaimAllowed(source) ? 'manual_provided_real' : 'simulated_or_unverified';
}

// ---------------------------------------------------------------------------
// Evidence record + pure mutators (array-based; each returns a NEW array)
// ---------------------------------------------------------------------------

export interface ManualPublishingEvidence {
  id: string;
  campaignId: string;
  /** Optional asset/content item this evidence is about. */
  contentItemId?: string;
  /** Free-text channel/platform where it was published manually (display only). */
  channel: string;
  publishStatus: PublishStatus;
  /** ISO time the Owner says it was manually published (display only). */
  publishedAt?: string;
  /** ISO time the Owner says it was manually scheduled outside CORE (display only). */
  manualScheduledAt?: string;
  /** Who published it manually (sample/display label — Owner-provided). */
  publishedBy?: string;
  /** Owner-pasted public URL where THEY published — evidence data, not a Core action. */
  publicUrl?: string;
  /** Screenshot / evidence note (free text). */
  evidenceNote?: string;
  resultDataSource: ResultDataSource;
  /** Optional manual-only result metrics. */
  metrics?: ResultMetrics;
  /** Free-text notes. */
  notes?: string;
  /** Every evidence row is local/mock/demo state — never a real action. */
  local_mock: true;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceInput {
  campaignId: string;
  contentItemId?: string;
  channel?: string;
  publishStatus?: PublishStatus;
  publishedAt?: string;
  manualScheduledAt?: string;
  publishedBy?: string;
  publicUrl?: string;
  evidenceNote?: string;
  resultDataSource?: ResultDataSource;
  metrics?: ResultMetrics;
  notes?: string;
}

export interface EvidenceMutateOpts {
  id?: string;
  now?: string;
}

const PUBLISH_STATUS_SET = new Set<string>(PUBLISH_STATUSES);
const RESULT_DATA_SOURCE_SET = new Set<string>(RESULT_DATA_SOURCES);

function coercePublishStatus(v: unknown): PublishStatus {
  return typeof v === 'string' && PUBLISH_STATUS_SET.has(v) ? (v as PublishStatus) : DEFAULT_PUBLISH_STATUS;
}

function coerceResultDataSource(v: unknown): ResultDataSource {
  return typeof v === 'string' && RESULT_DATA_SOURCE_SET.has(v) ? (v as ResultDataSource) : DEFAULT_RESULT_DATA_SOURCE;
}

/** Keep only finite, non-negative numbers; drop everything else. Returns undefined when empty. */
export function cleanMetrics(metrics: ResultMetrics | undefined): ResultMetrics | undefined {
  if (!metrics) return undefined;
  const out: ResultMetrics = {};
  for (const k of RESULT_METRIC_KEYS) {
    const v = metrics[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function trimOrUndef(v: string | undefined): string | undefined {
  const t = (v ?? '').trim();
  return t.length > 0 ? t : undefined;
}

/** Build a single evidence record (pure). Coerces enums + cleans metrics. */
export function createEvidence(input: EvidenceInput, opts: EvidenceMutateOpts = {}): ManualPublishingEvidence {
  const now = opts.now ?? new Date().toISOString();
  return {
    id: opts.id ?? generateId('mpe'),
    campaignId: input.campaignId,
    contentItemId: trimOrUndef(input.contentItemId),
    channel: (input.channel ?? '').trim(),
    publishStatus: coercePublishStatus(input.publishStatus),
    publishedAt: trimOrUndef(input.publishedAt),
    manualScheduledAt: trimOrUndef(input.manualScheduledAt),
    publishedBy: trimOrUndef(input.publishedBy),
    publicUrl: trimOrUndef(input.publicUrl),
    evidenceNote: trimOrUndef(input.evidenceNote),
    resultDataSource: coerceResultDataSource(input.resultDataSource),
    metrics: cleanMetrics(input.metrics),
    notes: trimOrUndef(input.notes),
    local_mock: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Append a new evidence record. Pure — returns a NEW array. */
export function addEvidence(
  list: ManualPublishingEvidence[],
  input: EvidenceInput,
  opts: EvidenceMutateOpts = {},
): ManualPublishingEvidence[] {
  return [...list, createEvidence(input, opts)];
}

/** Patch an existing evidence record. Pure — returns a NEW array; unknown id is a no-op. */
export function updateEvidence(
  list: ManualPublishingEvidence[],
  id: string,
  patch: Partial<EvidenceInput>,
  opts: EvidenceMutateOpts = {},
): ManualPublishingEvidence[] {
  const now = opts.now ?? new Date().toISOString();
  let changed = false;
  const next = list.map(e => {
    if (e.id !== id) return e;
    changed = true;
    const merged: ManualPublishingEvidence = {
      ...e,
      ...(patch.contentItemId !== undefined ? { contentItemId: trimOrUndef(patch.contentItemId) } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel.trim() } : {}),
      ...(patch.publishStatus !== undefined ? { publishStatus: coercePublishStatus(patch.publishStatus) } : {}),
      ...(patch.publishedAt !== undefined ? { publishedAt: trimOrUndef(patch.publishedAt) } : {}),
      ...(patch.manualScheduledAt !== undefined ? { manualScheduledAt: trimOrUndef(patch.manualScheduledAt) } : {}),
      ...(patch.publishedBy !== undefined ? { publishedBy: trimOrUndef(patch.publishedBy) } : {}),
      ...(patch.publicUrl !== undefined ? { publicUrl: trimOrUndef(patch.publicUrl) } : {}),
      ...(patch.evidenceNote !== undefined ? { evidenceNote: trimOrUndef(patch.evidenceNote) } : {}),
      ...(patch.resultDataSource !== undefined ? { resultDataSource: coerceResultDataSource(patch.resultDataSource) } : {}),
      ...(patch.metrics !== undefined ? { metrics: cleanMetrics(patch.metrics) } : {}),
      ...(patch.notes !== undefined ? { notes: trimOrUndef(patch.notes) } : {}),
      updatedAt: now,
    };
    return merged;
  });
  return changed ? next : list;
}

/** Set just the publish status. Pure — returns a NEW array; unknown id is a no-op. */
export function setEvidenceStatus(
  list: ManualPublishingEvidence[],
  id: string,
  status: PublishStatus,
  opts: EvidenceMutateOpts = {},
): ManualPublishingEvidence[] {
  return updateEvidence(list, id, { publishStatus: status }, opts);
}

/** Remove an evidence record. Pure — returns a NEW array. */
export function removeEvidence(list: ManualPublishingEvidence[], id: string): ManualPublishingEvidence[] {
  const next = list.filter(e => e.id !== id);
  return next.length === list.length ? list : next;
}

/** Newest-first ordered list (stable display). */
export function listEvidence(list: ManualPublishingEvidence[]): ManualPublishingEvidence[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------------------------------------------------------------------
// Validation — fixed, pure rules. Errors block; warnings advise.
// ---------------------------------------------------------------------------

export interface EvidenceValidation {
  /** No blocking errors. */
  ok: boolean;
  errors: string[];
  warnings: string[];
  /** How any recorded metrics may be presented. */
  metrics_presentation: MetricsPresentation;
  metrics_real_claim_allowed: boolean;
  /** True only for `manually_published` (the manual outside-CORE record). */
  is_published_record: boolean;
  /** True for `scheduled_outside_core` — recorded, but explicitly NOT published. */
  is_scheduled_not_published: boolean;
}

export function validateEvidence(e: ManualPublishingEvidence): EvidenceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const channel = (e.channel ?? '').trim();
  const publishedBy = (e.publishedBy ?? '').trim();
  const evidenceNote = (e.evidenceNote ?? '').trim();
  const publicUrl = (e.publicUrl ?? '').trim();

  // ── manually_published requires platform + publishedBy + (evidence note OR public URL) ──
  if (e.publishStatus === 'manually_published') {
    if (!channel) errors.push('Manually published requires a channel/platform.');
    if (!publishedBy) errors.push('Manually published requires who published it (publishedBy).');
    if (!evidenceNote && !publicUrl) {
      errors.push('Manually published requires an evidence note or a public URL (Owner-provided).');
    }
  }

  // ── scheduled_outside_core must NOT be treated as published ──
  if (e.publishStatus === 'scheduled_outside_core') {
    warnings.push('Scheduled outside CORE is NOT published — it is a manual schedule the Owner recorded.');
    if (!(e.manualScheduledAt ?? '').trim()) {
      warnings.push('No manual schedule time recorded for the outside-CORE schedule.');
    }
  }

  // ── metrics may only be presented as real when owner/client-provided ──
  const presentation = metricsPresentation(e.resultDataSource, e.metrics);
  const realAllowed = metricsRealClaimAllowed(e.resultDataSource);
  if (presentation === 'simulated_or_unverified') {
    warnings.push(
      `Result metrics are ${RESULT_DATA_SOURCE_LABEL[e.resultDataSource].toLowerCase()} — they must NOT be presented as real (no live analytics).`,
    );
    if (e.resultDataSource === 'not_provided') {
      warnings.push('Set a result data source (Owner-provided / Client-provided) before treating metrics as real.');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metrics_presentation: presentation,
    metrics_real_claim_allowed: realAllowed,
    is_published_record: isPublishedRecord(e.publishStatus),
    is_scheduled_not_published: isScheduledNotPublished(e.publishStatus),
  };
}

// ---------------------------------------------------------------------------
// Post-publish report draft — summarize ONLY what was manually recorded, label
// metric provenance, and flag missing data. No live analytics, manual only.
// ---------------------------------------------------------------------------

export interface EvidenceMetricCell {
  key: ResultMetricKey;
  label: string;
  /** The recorded value, or null when not provided. */
  value: number | null;
  provided: boolean;
}

export interface EvidenceReportRow {
  id: string;
  campaignId: string;
  contentItemId: string | null;
  channel: string | null;
  publishStatus: PublishStatus;
  publish_status_label: string;
  is_published_record: boolean;
  is_scheduled_not_published: boolean;
  publishedBy: string | null;
  publicUrl: string | null;
  evidenceNote: string | null;
  resultDataSource: ResultDataSource;
  result_data_source_label: string;
  metrics_presentation: MetricsPresentation;
  metrics_presentation_label: string;
  /** True only when metrics exist AND source is owner/client provided. */
  metrics_are_real: boolean;
  metric_cells: EvidenceMetricCell[];
  /** Field names that were left blank (flagged as missing). */
  missing_fields: string[];
  validation: EvidenceValidation;
}

export interface PublishingEvidenceReport {
  total: number;
  by_status: Record<PublishStatus, number>;
  manually_published_count: number;
  scheduled_count: number;
  not_published_count: number;
  blocked_count: number;
  rows: EvidenceReportRow[];
  /** How many rows carry at least one metric value. */
  rows_with_metrics_count: number;
  /** How many rows carry metrics that may be presented as real (owner/client). */
  rows_with_real_metrics_count: number;
  has_any_real_metrics: boolean;
  /** Standing notices always shown on the report. */
  notices: string[];
  no_live_analytics_note: string;
  manual_evidence_only_note: string;
  core_does_not_publish_note: string;
  /** Core itself never publishes — structural guarantee, always false. */
  core_published: false;
  local_only_badges: string[];
  generatedAt: string;
}

export interface PublishingEvidenceReportParams {
  now?: Date;
}

function emptyByStatus(): Record<PublishStatus, number> {
  return {
    not_published: 0,
    manually_published: 0,
    scheduled_outside_core: 0,
    blocked_or_cancelled: 0,
  };
}

function buildReportRow(e: ManualPublishingEvidence): EvidenceReportRow {
  const validation = validateEvidence(e);
  const metric_cells: EvidenceMetricCell[] = RESULT_METRIC_KEYS.map(key => {
    const v = e.metrics?.[key];
    const provided = typeof v === 'number' && Number.isFinite(v);
    return { key, label: RESULT_METRIC_LABEL[key], value: provided ? (v as number) : null, provided };
  });

  const missing_fields: string[] = [];
  if (!(e.channel ?? '').trim()) missing_fields.push('channel');
  if (!(e.publishedBy ?? '').trim()) missing_fields.push('publishedBy');
  if (!(e.evidenceNote ?? '').trim() && !(e.publicUrl ?? '').trim()) missing_fields.push('evidence (note or URL)');
  if (!hasAnyMetric(e.metrics)) missing_fields.push('result metrics');

  const presentation = validation.metrics_presentation;

  return {
    id: e.id,
    campaignId: e.campaignId,
    contentItemId: trimOrUndef(e.contentItemId) ?? null,
    channel: (e.channel ?? '').trim() || null,
    publishStatus: e.publishStatus,
    publish_status_label: PUBLISH_STATUS_LABEL[e.publishStatus],
    is_published_record: validation.is_published_record,
    is_scheduled_not_published: validation.is_scheduled_not_published,
    publishedBy: trimOrUndef(e.publishedBy) ?? null,
    publicUrl: trimOrUndef(e.publicUrl) ?? null,
    evidenceNote: trimOrUndef(e.evidenceNote) ?? null,
    resultDataSource: e.resultDataSource,
    result_data_source_label: RESULT_DATA_SOURCE_LABEL[e.resultDataSource],
    metrics_presentation: presentation,
    metrics_presentation_label: METRICS_PRESENTATION_LABEL[presentation],
    metrics_are_real: presentation === 'manual_provided_real',
    metric_cells,
    missing_fields,
    validation,
  };
}

export function buildPublishingEvidenceReport(
  list: ManualPublishingEvidence[],
  params: PublishingEvidenceReportParams = {},
): PublishingEvidenceReport {
  const now = params.now ?? new Date();
  const ordered = listEvidence(list);
  const rows = ordered.map(buildReportRow);

  const by_status = emptyByStatus();
  for (const e of ordered) by_status[e.publishStatus] += 1;

  const rows_with_metrics_count = rows.filter(r => r.metrics_presentation !== 'none').length;
  const rows_with_real_metrics_count = rows.filter(r => r.metrics_are_real).length;

  return {
    total: ordered.length,
    by_status,
    manually_published_count: by_status.manually_published,
    scheduled_count: by_status.scheduled_outside_core,
    not_published_count: by_status.not_published,
    blocked_count: by_status.blocked_or_cancelled,
    rows,
    rows_with_metrics_count,
    rows_with_real_metrics_count,
    has_any_real_metrics: rows_with_real_metrics_count > 0,
    notices: [
      EVIDENCE_CORE_DOES_NOT_PUBLISH,
      EVIDENCE_NO_LIVE_ANALYTICS,
      EVIDENCE_MANUAL_ONLY,
      EVIDENCE_APPROVED_NOT_PUBLISHED,
      EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED,
    ],
    no_live_analytics_note: EVIDENCE_NO_LIVE_ANALYTICS,
    manual_evidence_only_note: EVIDENCE_MANUAL_ONLY,
    core_does_not_publish_note: EVIDENCE_CORE_DOES_NOT_PUBLISH,
    core_published: false,
    local_only_badges: [...EVIDENCE_LOCAL_ONLY_BADGES],
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network. Any URL printed is the Owner-provided evidence
// value, never one Core created.
// ---------------------------------------------------------------------------

function fmtMetric(key: ResultMetricKey, value: number): string {
  if (key === 'revenue') return `${RESULT_METRIC_LABEL[key]}: ${value.toLocaleString('en-US')}`;
  return `${RESULT_METRIC_LABEL[key]}: ${value.toLocaleString('en-US')}`;
}

export function renderPublishingEvidenceReportText(
  report: PublishingEvidenceReport,
  title = 'Manual Publishing Evidence',
): string {
  const lines: string[] = [];
  lines.push(`MANUAL PUBLISHING EVIDENCE (LOCAL/DEMO) — ${title}`);
  lines.push(report.core_does_not_publish_note);
  lines.push(`${report.no_live_analytics_note} ${report.manual_evidence_only_note}`);
  lines.push(EVIDENCE_SAFETY_NOTE);
  lines.push('');
  lines.push(`Local-only: ${report.local_only_badges.join(' · ')}`);
  lines.push('');

  lines.push('STATUS SUMMARY (manually recorded only)');
  lines.push(`- Total evidence rows: ${report.total}`);
  lines.push(`- Manually published (outside CORE): ${report.manually_published_count}`);
  lines.push(`- Scheduled outside CORE (NOT published): ${report.scheduled_count}`);
  lines.push(`- Not published: ${report.not_published_count}`);
  lines.push(`- Blocked / cancelled: ${report.blocked_count}`);
  lines.push('');

  lines.push('EVIDENCE ROWS');
  if (report.rows.length === 0) {
    lines.push('- (No manual publishing evidence recorded yet.)');
  } else {
    for (const r of report.rows) {
      lines.push(`- [${r.publish_status_label}] ${r.channel ?? '(no channel)'}${r.contentItemId ? ` · item ${r.contentItemId}` : ''}`);
      if (r.is_scheduled_not_published) lines.push('    · Scheduled outside CORE — NOT published.');
      if (r.publishedBy) lines.push(`    · By: ${r.publishedBy}`);
      if (r.publicUrl) lines.push(`    · Evidence URL (Owner-provided): ${r.publicUrl}`);
      if (r.evidenceNote) lines.push(`    · Evidence note: ${r.evidenceNote}`);

      const provided = r.metric_cells.filter(c => c.provided);
      if (provided.length > 0) {
        const label = r.metrics_are_real
          ? `${r.result_data_source_label} (manual provided data)`
          : `${r.result_data_source_label} — SIMULATED / UNVERIFIED, not real`;
        lines.push(`    · Metrics [${label}]: ${provided.map(c => fmtMetric(c.key, c.value as number)).join(' · ')}`);
      } else {
        lines.push('    · Metrics: none provided (missing data).');
      }

      if (r.missing_fields.length > 0) lines.push(`    · Missing: ${r.missing_fields.join(', ')}`);
      for (const w of r.validation.warnings) lines.push(`    · WARNING: ${w}`);
      for (const er of r.validation.errors) lines.push(`    · INCOMPLETE: ${er}`);
    }
  }
  lines.push('');

  lines.push('SAFETY');
  lines.push(`- ${EVIDENCE_APPROVED_NOT_PUBLISHED} ${EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED}`);
  lines.push(`- ${EVIDENCE_PUBLISHED_MEANS_MANUAL}`);
  lines.push('- No live analytics pull, no connector, no auto-post, no auto-ads, no external call — local/demo evidence only.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Deterministic mock seed — sample evidence for the local preview. Author/URL
// values are explicitly SAMPLE values (never a real identity/link); timestamps
// derive from an injectable base time so tests/UI stay stable.
// ---------------------------------------------------------------------------

export function sampleManualPublishingEvidence(
  campaignId = 'campaign-sample',
  now: Date = new Date('2026-06-25T10:00:00.000Z'),
): ManualPublishingEvidence[] {
  const base = now.getTime();
  const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000).toISOString();
  return [
    createEvidence(
      {
        campaignId,
        contentItemId: 'item-day1-vicuon',
        channel: 'Facebook Page',
        publishStatus: 'manually_published',
        publishedAt: at(120),
        publishedBy: 'Owner (sample)',
        publicUrl: 'fb.example/vicuon/posts/sample-001',
        evidenceNote: 'Screenshot saved in the shared drive (sample).',
        resultDataSource: 'owner_provided',
        metrics: { reach: 4200, engagement: 310, messages: 18, orders: 7 },
        notes: 'Đăng tay trưa thứ Bảy, tương tác tốt. (sample)',
      },
      { id: 'mpe-sample-1', now: at(120) },
    ),
    createEvidence(
      {
        campaignId,
        contentItemId: 'item-day3-vicuon',
        channel: 'TikTok',
        publishStatus: 'scheduled_outside_core',
        manualScheduledAt: at(-1440),
        publishedBy: 'Owner (sample)',
        evidenceNote: 'Hẹn lịch tay trên app TikTok, chưa lên sóng. (sample)',
        resultDataSource: 'not_provided',
      },
      { id: 'mpe-sample-2', now: at(60) },
    ),
    createEvidence(
      {
        campaignId,
        contentItemId: 'item-combo-weekend',
        channel: 'Instagram',
        publishStatus: 'not_published',
        resultDataSource: 'simulated_demo',
        metrics: { reach: 1000, engagement: 50 },
        notes: 'Số liệu demo để minh hoạ — KHÔNG phải số thật. (sample)',
      },
      { id: 'mpe-sample-3', now: at(30) },
    ),
  ];
}
