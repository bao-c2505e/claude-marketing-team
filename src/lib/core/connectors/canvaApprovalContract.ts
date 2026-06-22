// Canva Approval Contract — SANDBOX MODE ONLY (status/contract mapping)
// ---------------------------------------------------------------------------
// Phase I-S2 — Canva Approval Contract Mapping.
//
// This module standardises HOW a Canva Sandbox preview item is represented as
// it moves through the Core Approval Queue, so a future real Canva connector can
// reuse the same shape. It is PURE / OFFLINE and adds NO real connector:
//   • no real Canva API / SDK / OAuth / token / env,
//   • no external Canva URL,
//   • no image/video generation,
//   • no publish / post / ads launch.
//
// The contract makes the safety boundary structurally explicit and testable:
//   - `mode` is always 'sandbox',
//   - `preview_status` is always 'sandbox_preview_only',
//   - `publish_status` is always 'not_published' (no transition can change it),
//   - `real_connector_action` is always 'none' (approval NEVER triggers a real
//     connector action),
//   - `approval_status` is the ONLY field that moves, and even `approved` means
//     INTERNAL approval only — it never implies published / live.
//
// See CLAUDE.md §4 (Safety Principles), §6 (Output Status Model), §7 (Connector
// Roadmap — approval-gated, future). Reuses CANVA_SANDBOX_COPY / safety flags
// from `canvaSandboxConnector.ts` so the UI copy stays single-sourced.
// ---------------------------------------------------------------------------
import type { ContentItemStatus6 } from '../../../types/core';

// ---------------------------------------------------------------------------
// Lifecycle: the ONLY mutable axis of the contract.
// ---------------------------------------------------------------------------
// `approved` and `rejected` are both INTERNAL-only terminal decisions. There is
// deliberately NO 'published' / 'launched' / 'live' member here — a sandbox item
// can never reach an external-world state through this contract.
export type CanvaApprovalStatus =
  | 'sandbox_created' // mock preview generated; not yet routed for review
  | 'needs_review'    // routed to an internal reviewer
  | 'submitted'       // submitted for Owner decision (ceiling for AI/sandbox)
  | 'approved'        // Owner approved for INTERNAL use only (≠ published)
  | 'rejected';       // Owner rejected; stays internal

// These three axes are immutable for the entire sandbox lifecycle. Encoding them
// as single-literal unions means TypeScript itself forbids assigning a
// "published" / "real action" value anywhere in the codebase.
export type CanvaPreviewStatus = 'sandbox_preview_only';
export type CanvaPublishStatus = 'not_published';
export type CanvaRealConnectorAction = 'none';

export interface CanvaContractSafetyFlags {
  no_live_canva_api: true;
  no_publish: true;
  approval_required: true;
}

export interface CanvaApprovalContract {
  connector: 'canva';
  mode: 'sandbox';
  preview_status: CanvaPreviewStatus;
  approval_status: CanvaApprovalStatus;
  publish_status: CanvaPublishStatus;
  real_connector_action: CanvaRealConnectorAction;
  safety_flags: CanvaContractSafetyFlags;
}

export const CANVA_CONTRACT_SAFETY_FLAGS: CanvaContractSafetyFlags = {
  no_live_canva_api: true,
  no_publish: true,
  approval_required: true,
};

// All Canva approval statuses, in lifecycle order. Used by tests / UI.
export const CANVA_APPROVAL_STATUSES: CanvaApprovalStatus[] = [
  'sandbox_created',
  'needs_review',
  'submitted',
  'approved',
  'rejected',
];

// ---------------------------------------------------------------------------
// User-facing labels. NONE of these may imply published / live / launched —
// this is asserted in the tests.
// ---------------------------------------------------------------------------
export const CANVA_APPROVAL_STATUS_LABEL: Record<CanvaApprovalStatus, string> = {
  sandbox_created: 'Sandbox preview created',
  needs_review:    'Needs internal review',
  submitted:       'Submitted for Owner approval',
  approved:        'Approved (internal use only)',
  rejected:        'Rejected (internal)',
};

export const CANVA_APPROVAL_STATUS_COLOR: Record<CanvaApprovalStatus, string> = {
  sandbox_created: '#22d3ee',
  needs_review:    '#f59e0b',
  submitted:       '#60a5fa',
  approved:        '#34d399',
  rejected:        '#f87171',
};

// Canonical contract-level UI copy. Mirrors CANVA_SANDBOX_COPY (kept as literals
// here to avoid a circular import — the connector imports this module) and adds
// the "internal approval only" line the Owner must always see. The connector
// test pins these exact strings, so any drift is caught.
export const CANVA_CONTRACT_COPY = {
  title: 'Canva Sandbox Preview',
  internalApprovalOnly: 'Internal approval only',
  noDesign: 'No Canva design was created',
  noPublish: 'Nothing was published',
  approvalRequired: 'Approval required before any real connector action',
} as const;

// ---------------------------------------------------------------------------
// Mapping to / from the underlying ContentPlanItem status (ContentItemStatus6).
// The approval queue stores items as ContentPlanItem; this keeps the Canva
// lifecycle and the stored status in sync WITHOUT introducing a parallel store.
// Note: there is no 'published' / 'scheduled' target — `approved` maps to the
// internal `approved` status and stops there.
// ---------------------------------------------------------------------------
export function canvaStatusToItemStatus(status: CanvaApprovalStatus): ContentItemStatus6 {
  switch (status) {
    case 'sandbox_created': return 'generated';
    case 'needs_review':    return 'needs_review';
    case 'submitted':       return 'needs_review'; // pending Owner; ceiling for sandbox
    case 'approved':        return 'approved';     // INTERNAL approval only
    case 'rejected':        return 'rejected';
  }
}

export function itemStatusToCanvaStatus(status: ContentItemStatus6): CanvaApprovalStatus {
  switch (status) {
    case 'generated':           return 'sandbox_created';
    case 'needs_review':        return 'needs_review';
    case 'revision_requested':  return 'needs_review';
    case 'approved':            return 'approved';
    case 'rejected':            return 'rejected';
    // External-world / scheduling states are NOT reachable for a sandbox item.
    // If one is ever seen, treat it as needs_review (fail safe — never trust a
    // "published"/"scheduled" status on a sandbox preview).
    case 'scheduled':
    case 'published':
    case 'archived':
    default:                    return 'needs_review';
  }
}

// ---------------------------------------------------------------------------
// Contract construction + transitions (pure).
// ---------------------------------------------------------------------------

/**
 * Build a fresh Canva approval contract. `publish_status`, `real_connector_action`,
 * `preview_status`, `mode`, and `safety_flags` are fixed — only `approval_status`
 * is configurable (defaults to the sandbox entry state).
 */
export function buildCanvaApprovalContract(
  approval_status: CanvaApprovalStatus = 'sandbox_created',
): CanvaApprovalContract {
  return {
    connector: 'canva',
    mode: 'sandbox',
    preview_status: 'sandbox_preview_only',
    approval_status,
    publish_status: 'not_published',
    real_connector_action: 'none',
    safety_flags: { ...CANVA_CONTRACT_SAFETY_FLAGS },
  };
}

export type CanvaApprovalDecision = 'submit' | 'approve' | 'reject';

/**
 * Apply an approval decision to a contract. This is the ONLY mutation path.
 *
 * Critically: it changes `approval_status` and NOTHING ELSE. `publish_status`
 * stays 'not_published' and `real_connector_action` stays 'none' for EVERY
 * decision — including `approve`. Approval authorises internal use only; it
 * never publishes and never triggers a real connector action.
 */
export function applyCanvaApprovalDecision(
  contract: CanvaApprovalContract,
  decision: CanvaApprovalDecision,
): CanvaApprovalContract {
  const approval_status: CanvaApprovalStatus =
    decision === 'submit' ? 'submitted'
    : decision === 'approve' ? 'approved'
    : 'rejected';

  return {
    ...contract,
    approval_status,
    // Re-assert the immutable safety axes so no decision can ever drift them.
    mode: 'sandbox',
    preview_status: 'sandbox_preview_only',
    publish_status: 'not_published',
    real_connector_action: 'none',
    safety_flags: { ...CANVA_CONTRACT_SAFETY_FLAGS },
  };
}

/** True only for the internal `approved` decision (never implies published). */
export function isCanvaInternallyApproved(contract: CanvaApprovalContract): boolean {
  return contract.approval_status === 'approved';
}
