// ---------------------------------------------------------------------------
// Manual Publishing Checklist & Delivery Readiness (Phase R) — pure, read-only
//
// A SAFE, deterministic readiness layer ON TOP of the Phase Q Campaign Pack.
// Given a campaign's resolved Brand-Context cover (`resolveCampaignPackContext`)
// and its Owner-APPROVED deliverables (`collectCampaignPackItems`), it derives a
// manual-publishing CHECKLIST — sections + items + a campaign-level readiness
// summary — so the Owner/team can SEE whether a campaign pack is ready to be
// MANUALLY published, WITHOUT performing any publishing action.
//
// It is NOT automation:
//   • Core never posts, schedules, launches, or spends. This layer only DESCRIBES
//     readiness; every actual publish is a separate, manual human step.
//   • "Ready for manual publishing" means approved + nothing blocking — the
//     remaining `manual_action_required` items ARE the human publish steps, never
//     something Core does on its own.
//   • Approved ≠ Published stays explicit on the summary `safety_notice`.
//
// Pure: reads plain in-memory objects (the Phase Q context + items, optionally the
// campaign's approval requests) and returns plain objects/strings. No localStorage,
// no DB, no network, no connectors — trivially unit-testable and side-effect free.
//
// Reuses (no duplication): Phase Q `CampaignPackContext`/`CampaignPackItem`,
// `approvalClassify` module classification + `splitCaption`, and the standing
// `APPROVED_NOT_PUBLISHED_REMINDER` from `brandBrain`.
// ---------------------------------------------------------------------------

import type { ContentApprovalRequest } from '../../types/core';
import { splitCaption, type ModuleKey } from './approvalClassify';
import { APPROVED_NOT_PUBLISHED_REMINDER } from './brandBrain';
import type { CampaignPackContext, CampaignPackItem } from './campaignPack';

// ---------------------------------------------------------------------------
// Safety copy — verbatim strings the checklist + UI MUST carry. Exported so the
// panel and the safety-regression test reference the same source of truth.
// ---------------------------------------------------------------------------

/** Summary-level safety notice — Approved ≠ Published + manual-publishing-required. */
export const MANUAL_PUBLISHING_SAFETY_NOTICE =
  'Approved ≠ Published. Core never auto-posts, auto-launches, schedules, or spends — ' +
  'every channel must be published manually by the Owner/team after approval.';

/** Short manual-only reminder shown on the panel and in the copied checklist. */
export const MANUAL_PUBLISHING_ONLY_NOTE =
  'No auto-posting. Owner/team must publish manually.';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistStatus =
  | 'ready'
  | 'needs_owner_review'
  | 'blocked'
  | 'manual_action_required';

export type ChecklistSeverity = 'info' | 'warning' | 'critical';

export type ChecklistOwner = 'owner' | 'internal_team' | 'client';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  severity: ChecklistSeverity;
  owner: ChecklistOwner;
  /** Short provenance/evidence label, e.g. "3 approved deliverables". */
  source_label?: string;
  action_hint: string;
}

export type ChecklistSectionKey =
  | 'owner_approval'
  | 'approved_not_published'
  | 'copy_captions'
  | 'creative_assets'
  | 'channel_formatting'
  | 'manual_publishing_prep'
  | 'client_handoff'
  | 'metrics_disclaimer';

export interface ChecklistSection {
  key: ChecklistSectionKey;
  title: string;
  description: string;
  items: ChecklistItem[];
}

export type OverallReadinessStatus =
  | 'ready_for_manual_publishing'
  | 'needs_review_before_manual_publishing'
  | 'blocked';

export interface ReadinessSummary {
  total_items: number;
  ready_count: number;
  blocked_count: number;
  needs_owner_review_count: number;
  manual_action_required_count: number;
  overall_status: OverallReadinessStatus;
  /** Explicit Approved ≠ Published + manual-publishing-required notice. */
  safety_notice: string;
}

export interface ManualPublishingChecklist {
  sections: ChecklistSection[];
  summary: ReadinessSummary;
  /** ISO timestamp; injectable for deterministic tests. */
  generatedAt: string;
}

export interface ManualPublishingChecklistParams {
  context: CampaignPackContext;
  /** Owner-APPROVED deliverables (Phase Q `collectCampaignPackItems` output). */
  items: CampaignPackItem[];
  /** Optional: all approval requests for the campaign, to flag still-pending items. */
  approvalRequests?: ContentApprovalRequest[];
  /** Render timestamp; injectable for deterministic tests. */
  now?: Date;
}

// ---------------------------------------------------------------------------
// Display labels / colors — exported for the UI; pure look-up tables.
// ---------------------------------------------------------------------------

export const CHECKLIST_STATUS_LABEL: Record<ChecklistStatus, string> = {
  ready:                  'Ready',
  needs_owner_review:     'Needs Owner review',
  blocked:                'Blocked',
  manual_action_required: 'Manual action required',
};

export const CHECKLIST_STATUS_COLOR: Record<ChecklistStatus, string> = {
  ready:                  '#34d399',
  needs_owner_review:     '#fbbf24',
  blocked:                '#f87171',
  manual_action_required: '#60a5fa',
};

export const CHECKLIST_OWNER_LABEL: Record<ChecklistOwner, string> = {
  owner:         'Owner',
  internal_team: 'Internal team',
  client:        'Client',
};

export const OVERALL_STATUS_LABEL: Record<OverallReadinessStatus, string> = {
  ready_for_manual_publishing:           'Ready for manual publishing',
  needs_review_before_manual_publishing: 'Needs review before manual publishing',
  blocked:                               'Blocked',
};

export const OVERALL_STATUS_COLOR: Record<OverallReadinessStatus, string> = {
  ready_for_manual_publishing:           '#34d399',
  needs_review_before_manual_publishing: '#fbbf24',
  blocked:                               '#f87171',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Modules whose deliverable is text the human will publish (caption / script / ads copy). */
const COPY_MODULES: ModuleKey[] = ['content', 'video', 'ads'];

/** Approval requests that are still open (not yet an Owner decision of approved). */
const PENDING_STATUSES = new Set<ContentApprovalRequest['status']>([
  'draft',
  'submitted',
  'revision_requested',
]);

/** Clean human-readable body of a deliverable (metadata stripped). */
function bodyOf(c: CampaignPackItem): string {
  if (!c.item) return '';
  return splitCaption(c.item.caption).body.trim();
}

/** Visual brief / direction text of a deliverable, if any. */
function visualOf(c: CampaignPackItem): string {
  return c.item?.visual_brief?.trim() ?? '';
}

/** Distinct target channels across the deliverables; falls back to brand channels. */
function channelsOf(items: CampaignPackItem[], context: CampaignPackContext): string[] {
  const set = new Set<string>();
  for (const c of items) {
    const ch = c.item?.channel?.trim();
    if (ch) set.add(ch);
  }
  if (set.size === 0) {
    for (const ch of context.brand?.primary_channels ?? []) {
      if (ch && ch.trim()) set.add(ch.trim());
    }
  }
  return [...set];
}

function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

// ── Item constructors (keep section bodies readable) ────────────────────────

function mk(
  id: string,
  status: ChecklistStatus,
  severity: ChecklistSeverity,
  owner: ChecklistOwner,
  label: string,
  description: string,
  source_label: string,
  action_hint: string,
): ChecklistItem {
  return { id, label, description, status, severity, owner, source_label, action_hint };
}

const mkReady = (id: string, owner: ChecklistOwner, label: string, description: string, source_label: string, action_hint: string): ChecklistItem =>
  mk(id, 'ready', 'info', owner, label, description, source_label, action_hint);

const mkBlocked = (id: string, owner: ChecklistOwner, label: string, description: string, source_label: string, action_hint: string): ChecklistItem =>
  mk(id, 'blocked', 'critical', owner, label, description, source_label, action_hint);

const mkReview = (id: string, owner: ChecklistOwner, label: string, description: string, source_label: string, action_hint: string): ChecklistItem =>
  mk(id, 'needs_owner_review', 'warning', owner, label, description, source_label, action_hint);

const mkManual = (id: string, owner: ChecklistOwner, label: string, description: string, source_label: string, action_hint: string, severity: ChecklistSeverity = 'info'): ChecklistItem =>
  mk(id, 'manual_action_required', severity, owner, label, description, source_label, action_hint);

// ---------------------------------------------------------------------------
// Build — derive the full checklist + summary from Phase Q data shapes.
// ---------------------------------------------------------------------------

export function buildManualPublishingChecklist(
  params: ManualPublishingChecklistParams,
): ManualPublishingChecklist {
  const { context, items } = params;
  const approvalRequests = params.approvalRequests ?? [];
  const now = params.now ?? new Date();

  const hasItems = items.length > 0;

  const copyItems = items.filter(c => COPY_MODULES.includes(c.module));
  const missingCopy = copyItems.filter(c => !bodyOf(c));
  const designItems = items.filter(c => c.module === 'design');
  const missingDesignBrief = designItems.filter(c => !bodyOf(c) && !visualOf(c));
  const reportItems = items.filter(c => c.module === 'report');
  const missingProvenance = items.filter(c => !c.provenance);
  const pending = approvalRequests.filter(r => PENDING_STATUSES.has(r.status));
  const channels = channelsOf(items, context);

  const sections: ChecklistSection[] = [
    // ── 1. Owner Approval ──
    {
      key: 'owner_approval',
      title: 'Owner Approval',
      description: 'Only Owner-approved deliverables may enter a manual publishing handoff.',
      items: [
        hasItems
          ? mkReady('owner_approval_all', 'owner',
              'Deliverables are Owner-approved',
              'Every item in this pack is in status `approved` — the AI ceiling (pending_approval) was cleared by a human Owner decision.',
              `${items.length} approved ${plural(items.length, 'deliverable')}`,
              'Approval is recorded — proceed to the manual publishing steps.')
          : mkBlocked('owner_approval_all', 'owner',
              'No Owner-approved deliverables',
              'There are no approved deliverables for this campaign, so nothing is ready to be packaged or manually published.',
              'No approved items',
              'Approve outputs in the Approval Queue first — Approved ≠ Published.'),
        pending.length > 0
          ? mkReview('owner_approval_pending', 'owner',
              'Items still awaiting approval',
              `${pending.length} ${plural(pending.length, 'item')} are still pending or awaiting revision and are NOT included in this pack.`,
              `${pending.length} pending`,
              'Review the remaining items in the Approval Queue before final handoff.')
          : mkReady('owner_approval_pending', 'owner',
              'No items awaiting approval',
              'No deliverables for this campaign are stuck in submitted / revision-requested state.',
              'None pending',
              'Nothing to review here.'),
        ...(hasItems
          ? [
              missingProvenance.length > 0
                ? mkReview('owner_approval_provenance', 'owner',
                    'Approval provenance incomplete',
                    `${missingProvenance.length} ${plural(missingProvenance.length, 'deliverable')} do not record who approved them or when.`,
                    `${missingProvenance.length} missing provenance`,
                    'Confirm the approver and date for audit clarity before handing off.')
                : mkReady('owner_approval_provenance', 'owner',
                    'Approval provenance recorded',
                    'Each deliverable records who approved it and when (Phase P audit trail).',
                    'Provenance present',
                    'No action needed.'),
            ]
          : []),
      ],
    },

    // ── 2. Approved ≠ Published Safety ──
    {
      key: 'approved_not_published',
      title: 'Approved ≠ Published Safety',
      description: 'Approval authorizes internal use only — publishing is a separate, manual step.',
      items: [
        mkReady('anp_internal_only', 'owner',
          'Approved status is internal only — not published',
          APPROVED_NOT_PUBLISHED_REMINDER,
          'Approved ≠ Published',
          'No action — this is a standing safety guarantee.'),
        mkManual('anp_separate_step', 'owner',
          'Publishing / launching is a separate manual step',
          'Approval does not publish or launch anything. A human must publish manually on each channel after this checklist clears.',
          'Manual publish required',
          'Publish manually outside Core when ready.'),
        mkReady('anp_no_automation', 'owner',
          'Core ran no auto-post, ad launch, schedule, or spend',
          'Core only prepared drafts and this readiness checklist. No content was posted, no ad launch occurred, no schedule was set, and no spend happened.',
          'No automation ran',
          'No action needed.'),
      ],
    },

    // ── 3. Copy & Captions ──
    {
      key: 'copy_captions',
      title: 'Copy & Captions',
      description: 'Caption / script copy must be present and proofread before manual publishing.',
      items: [
        copyItems.length === 0
          ? mkReady('copy_present', 'internal_team',
              'No copy-based deliverables to check',
              'This campaign has no caption / script / ads-copy deliverables in the pack.',
              'N/A',
              'Nothing to check here.')
          : missingCopy.length > 0
            ? mkBlocked('copy_present', 'internal_team',
                'Caption / script copy is missing',
                `${missingCopy.length} of ${copyItems.length} copy ${plural(copyItems.length, 'deliverable')} have no draft text — they cannot be published as-is.`,
                `${missingCopy.length} missing copy`,
                'Add the missing caption/script text (or remove the item) before handoff.')
            : mkReady('copy_present', 'internal_team',
                'Caption / script copy present',
                `All ${copyItems.length} copy ${plural(copyItems.length, 'deliverable')} carry draft text.`,
                `${copyItems.length} with copy`,
                'Proceed to proofreading.'),
        ...(copyItems.length > 0
          ? [
              mkManual('copy_proofread', 'internal_team',
                'Copy proofread for each channel',
                'A human must proofread captions/scripts for tone, typos, and channel fit — Core does not validate copy quality.',
                `${copyItems.length} to proofread`,
                'Proofread each caption/script before manual publishing.',
                'warning'),
            ]
          : []),
      ],
    },

    // ── 4. Creative Assets / Design Briefs ──
    {
      key: 'creative_assets',
      title: 'Creative Assets / Design Briefs',
      description: 'Core produces briefs/specs only — final creative must be produced and attached manually.',
      items: [
        designItems.length === 0
          ? mkReady('creative_briefs', 'internal_team',
              'No design deliverables to check',
              'This campaign has no design-brief deliverables in the pack.',
              'N/A',
              'Nothing to check here.')
          : missingDesignBrief.length > 0
            ? mkReview('creative_briefs', 'internal_team',
                'Design briefs incomplete',
                `${missingDesignBrief.length} of ${designItems.length} design ${plural(designItems.length, 'deliverable')} have no brief / visual direction text.`,
                `${missingDesignBrief.length} incomplete`,
                'Complete the design brief / visual direction before handoff.')
            : mkReady('creative_briefs', 'internal_team',
                'Design briefs present',
                `All ${designItems.length} design ${plural(designItems.length, 'deliverable')} carry a brief / visual direction.`,
                `${designItems.length} ${plural(designItems.length, 'brief')}`,
                'Proceed to asset production.'),
        ...(hasItems
          ? [
              mkManual('creative_assets_attach', 'internal_team',
                'Final creative produced & attached manually',
                'Core never generates real images or video — it outputs briefs/specs only. A human must produce/source the final creative and attach it before publishing.',
                'Briefs/specs only',
                'Produce and attach the real assets manually, outside Core.',
                'warning'),
            ]
          : []),
      ],
    },

    // ── 5. Channel Formatting ──
    {
      key: 'channel_formatting',
      title: 'Channel Formatting',
      description: "Each target channel's format must be verified manually before publishing.",
      items: [
        channels.length > 0
          ? mkManual('channel_format', 'internal_team',
              "Verify each channel's format manually",
              'Confirm dimensions, length, hashtags, and link rules for each target channel — Core does not format or validate per-channel output.',
              channels.join(' · '),
              "Check each channel's formatting requirements before manual publishing.")
          : mkManual('channel_format', 'owner',
              'Confirm the target channel before publishing',
              'No target channel is set on these deliverables; the Owner/team must confirm where each item will be manually published.',
              'No channel set',
              'Set/confirm the target channel, then verify its formatting.',
              'warning'),
      ],
    },

    // ── 6. Manual Publishing Prep ──
    {
      key: 'manual_publishing_prep',
      title: 'Manual Publishing Prep',
      description: 'Publishing is done manually by a human — Core does not post or schedule.',
      items: [
        mkManual('prep_schedule', 'owner',
          'Owner sets the publishing schedule / timing',
          'Decide the manual posting date/time for each item. Core does not schedule or queue posts.',
          'Manual timing',
          'Plan the manual posting timeline.'),
        mkManual('prep_publish', 'owner',
          'Publish manually on each channel',
          `${MANUAL_PUBLISHING_ONLY_NOTE} Each item is published by a human directly on the channel after this checklist clears.`,
          'Manual publish',
          'Publish each approved item manually when ready.'),
      ],
    },

    // ── 7. Client Handoff ──
    {
      key: 'client_handoff',
      title: 'Client Handoff',
      description: 'The exported pack is copied/downloaded locally and shared manually — Core never sends it.',
      items: [
        hasItems
          ? mkReady('handoff_pack', 'owner',
              'Campaign pack assembled for handoff',
              `${items.length} approved ${plural(items.length, 'deliverable')} can be exported (copy/download) into a client-ready pack.`,
              `${items.length} ${plural(items.length, 'deliverable')}`,
              'Export the campaign pack, then share it manually.')
          : mkReview('handoff_pack', 'owner',
              'Nothing to hand off yet',
              'There are no approved deliverables to assemble into a client handoff pack.',
              'No approved items',
              'Approve outputs first, then assemble the pack.'),
        mkManual('handoff_usage_rights', 'owner',
          'Usage rights verified before external publication',
          'Confirm fonts, images, music, and any third-party assets are licensed for the intended channels before anything is published externally.',
          'Manual verification',
          'Verify usage rights before publishing externally.',
          'warning'),
        mkManual('handoff_share', 'owner',
          'Share the pack with the client manually',
          'Core never emails, uploads, or sends. Share the exported pack with the client through your own channel.',
          'Manual share',
          'Send the exported pack manually.'),
      ],
    },

    // ── 8. Metrics & Claims Disclaimer ──
    {
      key: 'metrics_disclaimer',
      title: 'Metrics & Claims Disclaimer',
      description: 'No metric is fabricated — every figure must be labeled and Owner-confirmed.',
      items: [
        mkReady('metrics_no_fabrication', 'owner',
          'No fabricated metrics in this pack',
          'Core invents no prices, percentages, view counts, ratings, or results. Any data is labeled as Provided / Simulated / Missing / Owner input required.',
          'No invented metrics',
          'No action — standing guarantee.'),
        reportItems.length > 0
          ? mkManual('metrics_report_labels', 'owner',
              'Verify report data labels (Provided / Simulated / Missing / Owner input required)',
              `${reportItems.length} report ${plural(reportItems.length, 'draft')} carry data-status labels verbatim. Confirm each metric is Owner-supplied or simulated — never present simulated data as real.`,
              `${reportItems.length} report ${plural(reportItems.length, 'draft')}`,
              'Review every metric label before sharing results.',
              'warning')
          : mkReady('metrics_report_labels', 'owner',
              'No report metrics to verify',
              'This pack contains no report drafts, so there are no metrics to label or verify.',
              'No reports',
              'Nothing to verify here.'),
      ],
    },
  ];

  return { sections, summary: summarize(sections), generatedAt: now.toISOString() };
}

// ---------------------------------------------------------------------------
// Summary — roll the items up into campaign-level readiness counts + status.
//
// `manual_action_required` items are the EXPECTED manual publish steps; they do
// NOT block "ready_for_manual_publishing". Only a hard `blocked` item blocks, and
// any `needs_owner_review` downgrades to "needs review before manual publishing".
// ---------------------------------------------------------------------------

export function summarize(sections: ChecklistSection[]): ReadinessSummary {
  const all = sections.flatMap(s => s.items);
  const ready_count = all.filter(i => i.status === 'ready').length;
  const blocked_count = all.filter(i => i.status === 'blocked').length;
  const needs_owner_review_count = all.filter(i => i.status === 'needs_owner_review').length;
  const manual_action_required_count = all.filter(i => i.status === 'manual_action_required').length;

  let overall_status: OverallReadinessStatus;
  if (blocked_count > 0) overall_status = 'blocked';
  else if (needs_owner_review_count > 0) overall_status = 'needs_review_before_manual_publishing';
  else overall_status = 'ready_for_manual_publishing';

  return {
    total_items: all.length,
    ready_count,
    blocked_count,
    needs_owner_review_count,
    manual_action_required_count,
    overall_status,
    safety_notice: MANUAL_PUBLISHING_SAFETY_NOTICE,
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — a copyable checklist for "Copy manual checklist". Pure:
// returns a string, never touches the clipboard/DOM (the panel does that).
// ---------------------------------------------------------------------------

export function renderManualPublishingChecklistText(
  checklist: ManualPublishingChecklist,
  title?: string,
): string {
  const { summary } = checklist;
  const lines: string[] = [];

  lines.push(`MANUAL PUBLISHING CHECKLIST${title ? ` — ${title}` : ''}`);
  lines.push(MANUAL_PUBLISHING_SAFETY_NOTICE);
  lines.push(
    `Overall: ${OVERALL_STATUS_LABEL[summary.overall_status]} · ` +
    `${summary.ready_count} ready / ${summary.blocked_count} blocked / ` +
    `${summary.needs_owner_review_count} needs review / ` +
    `${summary.manual_action_required_count} manual action`,
  );
  lines.push('');

  for (const s of checklist.sections) {
    lines.push(`## ${s.title}`);
    for (const it of s.items) {
      lines.push(`- [${CHECKLIST_STATUS_LABEL[it.status]}] ${it.label} (${CHECKLIST_OWNER_LABEL[it.owner]})`);
      if (it.source_label) lines.push(`    · ${it.source_label}`);
      lines.push(`    → ${it.action_hint}`);
    }
    lines.push('');
  }

  lines.push(MANUAL_PUBLISHING_ONLY_NOTE);
  return lines.join('\n');
}
