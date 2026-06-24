// ---------------------------------------------------------------------------
// Client Delivery Room / Shareable Handoff View (Phase S) — pure, read-only
//
// A SAFE, deterministic "delivery room" model that COMPOSES the Phase Q Campaign
// Pack (resolved context + APPROVED deliverables) and the Phase R Manual
// Publishing Checklist into ONE clean, client-facing handoff surface the Owner can
// COPY or manually share with a client/team. It performs NO sharing of its own.
//
// It is NOT automation and creates NO link:
//   • Core never posts, schedules, launches, spends, emails, or uploads. This
//     model only DESCRIBES a handoff; sharing is a manual human action (copy/paste).
//   • NO public/share URL is ever generated — the room is plain text/objects only.
//   • Approved ≠ Published: the room always carries `published: false`, an explicit
//     "Approved does not mean Published" message, and a "Manual publishing only"
//     message; an approved campaign is NEVER rendered as published.
//
// Pure: reads the Phase Q context + items + the Phase R checklist (plus optionally
// the campaign's approval requests) and returns plain objects/strings. No
// localStorage, no DB, no network, no connectors — trivially unit-testable.
//
// Reuses (no duplication): Phase Q `campaignModuleBreakdown` + `CampaignPackContext`/
// `CampaignPackItem`, `handoffPack` module ordering + section titles, and the Phase R
// `ManualPublishingChecklist` summary + `OVERALL_STATUS_LABEL`.
// ---------------------------------------------------------------------------

import type { ContentApprovalRequest } from '../../types/core';
import type { ModuleKey } from './approvalClassify';
import {
  campaignModuleBreakdown,
  type CampaignPackContext,
  type CampaignPackItem,
} from './campaignPack';
import { HANDOFF_MODULE_ORDER, HANDOFF_MODULE_SECTION } from './handoffPack';
import {
  OVERALL_STATUS_LABEL,
  type ManualPublishingChecklist,
  type OverallReadinessStatus,
} from './manualPublishingChecklist';

// ---------------------------------------------------------------------------
// Safety copy — verbatim strings the room + UI MUST carry. Exported so the panel
// and the safety-regression tests reference the same source of truth.
// ---------------------------------------------------------------------------

/** Explicit "Approved does not mean Published" message. */
export const DELIVERY_ROOM_APPROVED_NOT_PUBLISHED =
  'Approved does not mean Published. Owner approval authorizes internal client handoff only — nothing here has been posted, scheduled, launched, or spent.';

/** Explicit "Manual publishing only" message. */
export const DELIVERY_ROOM_MANUAL_ONLY =
  'Manual publishing only. The Core Agency does not auto-post, auto-launch, schedule, or run ads — a person publishes each item manually after handoff.';

/** Standing safety warnings every delivery room carries. */
export const DELIVERY_ROOM_STANDING_WARNINGS: string[] = [
  'No live connectors — nothing is sent, posted, scheduled, launched, or spent by Core.',
  'No public share link is created — copy and share this handoff manually.',
  'No fabricated metrics — report figures are labeled Provided / Simulated / Missing / Owner input required.',
  'Usage rights must be verified before any external publication.',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryRoomReadiness =
  | 'ready_for_manual_client_handoff'
  | 'delivery_not_ready'
  | 'not_client_ready';

export const DELIVERY_ROOM_READINESS_LABEL: Record<DeliveryRoomReadiness, string> = {
  ready_for_manual_client_handoff: 'Ready for manual client handoff',
  delivery_not_ready:              'Delivery not ready',
  not_client_ready:                'Not client-ready',
};

export const DELIVERY_ROOM_READINESS_COLOR: Record<DeliveryRoomReadiness, string> = {
  ready_for_manual_client_handoff: '#34d399',
  delivery_not_ready:              '#fbbf24',
  not_client_ready:                '#f87171',
};

export interface DeliveryRoomModuleCount {
  module: ModuleKey;
  label: string;
  count: number;
}

export interface DeliveryRoomClientSummary {
  client_name: string;
  brand_name: string;
  campaign_name: string;
  campaign_status: string;
  duration_label: string | null;
  approved_deliverables: number;
  module_breakdown: DeliveryRoomModuleCount[];
}

/** Compact brand-context summary — internal/draft-only by construction. */
export interface DeliveryRoomBrandSnapshot {
  positioning: string | null;
  target_customers: string[];
  brand_voice: string[];
  content_pillars: string[];
  key_messages: string[];
  channels: string[];
  source: string;
  draft_only: true;
  internal_only: true;
}

export interface DeliveryRoomSection {
  module: ModuleKey;
  title: string;
  count: number;
  item_titles: string[];
}

export interface DeliveryRoomApproval {
  approved_count: number;
  pending_count: number;
  total_requests: number;
  all_approved: boolean;
  label: string;
}

export interface DeliveryRoomReadinessStatus {
  status: DeliveryRoomReadiness;
  label: string;
  /** Phase R publishing-readiness rollup carried through. */
  publishing_overall: OverallReadinessStatus;
  publishing_overall_label: string;
  ready_count: number;
  blocked_count: number;
  needs_review_count: number;
  manual_action_count: number;
}

export interface ClientDeliveryRoom {
  title: string;
  client_summary: DeliveryRoomClientSummary;
  brand_snapshot: DeliveryRoomBrandSnapshot | null;
  sections: DeliveryRoomSection[];
  approval: DeliveryRoomApproval;
  readiness: DeliveryRoomReadinessStatus;
  next_steps: string[];
  safety_warnings: string[];
  /** Approved ≠ Published is enforced structurally: this is always false. */
  published: false;
  approved_not_published_message: string;
  manual_publishing_only_message: string;
  generatedAt: string;
}

export interface ClientDeliveryRoomParams {
  context: CampaignPackContext;
  /** Owner-APPROVED deliverables (Phase Q `collectCampaignPackItems` output). */
  items: CampaignPackItem[];
  /** Phase R manual-publishing checklist for the same campaign. */
  checklist: ManualPublishingChecklist;
  /** Optional: all approval requests for the campaign, to report pending counts. */
  approvalRequests?: ContentApprovalRequest[];
  /** Optional room title override. */
  title?: string;
  /** Render timestamp; injectable for deterministic tests. */
  now?: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Approval requests still open (not an Owner-approved decision yet). */
const OPEN_APPROVAL_STATUSES = new Set<ContentApprovalRequest['status']>([
  'draft',
  'submitted',
  'revision_requested',
]);

function durationLabel(durationDays: unknown): string | null {
  return typeof durationDays === 'number'
    ? `${durationDays} day${durationDays === 1 ? '' : 's'}`
    : null;
}

// ---------------------------------------------------------------------------
// Build — compose the Phase Q + Phase R outputs into a delivery room.
// ---------------------------------------------------------------------------

export function buildClientDeliveryRoom(params: ClientDeliveryRoomParams): ClientDeliveryRoom {
  const { context, items, checklist } = params;
  const approvalRequests = params.approvalRequests ?? [];
  const now = params.now ?? new Date();
  const { campaign, client, brand, snapshot } = context;

  const breakdown = campaignModuleBreakdown(items);

  const title = (params.title || '').trim()
    || `${brand?.name ?? 'Campaign'} — ${campaign.name} · Client Delivery Room`;

  // ── Client / campaign summary ──
  const client_summary: DeliveryRoomClientSummary = {
    client_name: client?.name ?? 'Unassigned client',
    brand_name: brand?.name ?? 'Unassigned brand',
    campaign_name: campaign.name,
    campaign_status: campaign.status,
    duration_label: durationLabel(campaign.duration_days),
    approved_deliverables: items.length,
    module_breakdown: breakdown,
  };

  // ── Brand context snapshot summary (internal / draft-only) ──
  const brand_snapshot: DeliveryRoomBrandSnapshot | null = snapshot
    ? {
        positioning: snapshot.positioning,
        target_customers: snapshot.target_customers,
        brand_voice: snapshot.brand_voice,
        content_pillars: snapshot.content_pillars,
        key_messages: snapshot.key_messages,
        channels: snapshot.channels,
        source: snapshot.source,
        draft_only: true,
        internal_only: true,
      }
    : null;

  // ── Included handoff sections (grouped by module, deterministic order) ──
  const sections: DeliveryRoomSection[] = HANDOFF_MODULE_ORDER
    .map((m): DeliveryRoomSection | null => {
      const inModule = items.filter(i => i.module === m);
      if (inModule.length === 0) return null;
      return {
        module: m,
        title: HANDOFF_MODULE_SECTION[m],
        count: inModule.length,
        item_titles: inModule.map(i => i.title),
      };
    })
    .filter((s): s is DeliveryRoomSection => s !== null);

  // ── Approval status ──
  const approved_count = items.length;
  const pending_count = approvalRequests.filter(r => OPEN_APPROVAL_STATUSES.has(r.status)).length;
  const all_approved = approved_count > 0 && pending_count === 0;
  const approval: DeliveryRoomApproval = {
    approved_count,
    pending_count,
    total_requests: approvalRequests.length,
    all_approved,
    label:
      approved_count === 0
        ? 'No approved deliverables yet'
        : pending_count > 0
          ? `${approved_count} approved · ${pending_count} still pending approval`
          : `All ${approved_count} packaged deliverable${approved_count === 1 ? '' : 's'} approved`,
  };

  // ── Publishing readiness (composed: approval gate × Phase R rollup) ──
  const overall = checklist.summary.overall_status;
  let status: DeliveryRoomReadiness;
  if (approved_count === 0) {
    status = 'not_client_ready';
  } else if (overall === 'ready_for_manual_publishing') {
    status = 'ready_for_manual_client_handoff';
  } else {
    status = 'delivery_not_ready';
  }

  const readiness: DeliveryRoomReadinessStatus = {
    status,
    label: DELIVERY_ROOM_READINESS_LABEL[status],
    publishing_overall: overall,
    publishing_overall_label: OVERALL_STATUS_LABEL[overall],
    ready_count: checklist.summary.ready_count,
    blocked_count: checklist.summary.blocked_count,
    needs_review_count: checklist.summary.needs_owner_review_count,
    manual_action_count: checklist.summary.manual_action_required_count,
  };

  // ── Manual next steps (from the Phase R checklist, deterministic order) ──
  const allChecklistItems = checklist.sections.flatMap(s => s.items);
  const next_steps: string[] = [];
  for (const it of allChecklistItems) {
    if (it.status === 'blocked') next_steps.push(`Resolve blocker — ${it.label}: ${it.action_hint}`);
  }
  for (const it of allChecklistItems) {
    if (it.status === 'needs_owner_review') next_steps.push(`Owner review — ${it.label}: ${it.action_hint}`);
  }
  for (const it of allChecklistItems) {
    if (it.status === 'manual_action_required') next_steps.push(`Manual step — ${it.label}: ${it.action_hint}`);
  }

  // ── Safety warnings (readiness caveat first when not ready) ──
  const safety_warnings: string[] = [...DELIVERY_ROOM_STANDING_WARNINGS];
  if (status !== 'ready_for_manual_client_handoff') {
    safety_warnings.unshift(
      `${DELIVERY_ROOM_READINESS_LABEL[status]} — do not present this to the client as final until it is resolved.`,
    );
  }

  return {
    title,
    client_summary,
    brand_snapshot,
    sections,
    approval,
    readiness,
    next_steps,
    safety_warnings,
    published: false,
    approved_not_published_message: DELIVERY_ROOM_APPROVED_NOT_PUBLISHED,
    manual_publishing_only_message: DELIVERY_ROOM_MANUAL_ONLY,
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — a copyable client handoff summary for the "Copy client
// handoff summary" CTA. Pure: returns a string, never touches clipboard/DOM/
// network, and never emits a URL/link.
// ---------------------------------------------------------------------------

function listLine(label: string, values: string[]): string | null {
  return values.length ? `- ${label}: ${values.join(' · ')}` : null;
}

export function renderClientDeliveryRoomText(room: ClientDeliveryRoom): string {
  const lines: string[] = [];

  lines.push(`CLIENT DELIVERY ROOM — ${room.title}`);
  lines.push(room.approved_not_published_message);
  lines.push(room.manual_publishing_only_message);
  lines.push('');
  lines.push(`Status: ${room.readiness.label} (Not Published)`);
  lines.push(`Publishing readiness: ${room.readiness.publishing_overall_label}`);
  lines.push('');

  // Client / campaign
  const cs = room.client_summary;
  lines.push('CLIENT / CAMPAIGN');
  lines.push(`- Client: ${cs.client_name}`);
  lines.push(`- Brand: ${cs.brand_name}`);
  lines.push(`- Campaign: ${cs.campaign_name} (${cs.campaign_status})`);
  if (cs.duration_label) lines.push(`- Duration: ${cs.duration_label}`);
  lines.push(`- Approved deliverables: ${cs.approved_deliverables}`);
  if (cs.module_breakdown.length) {
    lines.push(`- Modules: ${cs.module_breakdown.map(b => `${b.label} (${b.count})`).join(', ')}`);
  }
  lines.push('');

  // Brand context
  if (room.brand_snapshot) {
    const bs = room.brand_snapshot;
    lines.push('BRAND CONTEXT (internal / draft-only)');
    if (bs.positioning) lines.push(`- Positioning: ${bs.positioning}`);
    for (const l of [
      listLine('Target customers', bs.target_customers),
      listLine('Brand voice', bs.brand_voice),
      listLine('Content pillars', bs.content_pillars),
      listLine('Key messages', bs.key_messages),
      listLine('Channels', bs.channels),
    ]) if (l) lines.push(l);
    lines.push('');
  }

  // Sections
  lines.push('INCLUDED HANDOFF SECTIONS');
  if (room.sections.length === 0) {
    lines.push('- (No approved deliverables yet — approve outputs in the Approval Queue first.)');
  } else {
    for (const s of room.sections) {
      lines.push(`## ${s.title} (${s.count})`);
      for (const t of s.item_titles) lines.push(`- ${t}`);
    }
  }
  lines.push('');

  // Approval
  lines.push('APPROVAL');
  lines.push(`- ${room.approval.label}`);
  lines.push('');

  // Publishing readiness
  lines.push('PUBLISHING READINESS (manual)');
  lines.push(`- ${room.readiness.label}`);
  lines.push(
    `- ${room.readiness.ready_count} ready / ${room.readiness.manual_action_count} manual action / ` +
    `${room.readiness.needs_review_count} needs review / ${room.readiness.blocked_count} blocked`,
  );
  lines.push('');

  // Manual next steps
  lines.push('MANUAL NEXT STEPS');
  if (room.next_steps.length === 0) {
    lines.push('- (None — nothing outstanding.)');
  } else {
    for (const step of room.next_steps) lines.push(`- ${step}`);
  }
  lines.push('');

  // Safety
  lines.push('SAFETY');
  for (const w of room.safety_warnings) lines.push(`- ${w}`);

  return lines.join('\n');
}
