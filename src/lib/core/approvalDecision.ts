// ---------------------------------------------------------------------------
// Approval decision & revision-loop helpers (Phase P) — display only
//
// The approval state machine (coreData.executeApprovalAction) already records a
// ContentApprovalEvent for every decision (approved / rejected / revision_requested
// / cancelled), preserving the original AI output and the full audit history. These
// pure helpers READ that event log so the Approval Queue can surface the latest
// decision + feedback note clearly and render an explicit "changes requested —
// awaiting revised output" state.
//
// IMPORTANT: everything here is READ-ONLY. No mutation, no status changes, no
// regeneration, no network. It never publishes, posts, launches, or approves —
// it only describes decisions that already exist.
// ---------------------------------------------------------------------------

import type { ContentApprovalEvent, ContentApprovalStatus, ApprovalActionType } from '../../types/core';

/** Reviewer decisions (a subset of ApprovalActionType) — excludes submitted/commented. */
export const DECISION_ACTIONS: ApprovalActionType[] = ['approved', 'rejected', 'revision_requested', 'cancelled'];

const DECISION_SET = new Set<ApprovalActionType>(DECISION_ACTIONS);

export interface LatestDecision {
  action: ApprovalActionType;
  status: ContentApprovalStatus | null;
  /** The reviewer's feedback note for this decision (may be empty). */
  comment: string | null;
  actorLabel: string;
  at: string;
}

/**
 * The most recent reviewer decision from an event log, or null if none yet.
 * Sorts by created_at descending itself so callers need not pre-sort.
 */
export function deriveLatestDecision(events: ContentApprovalEvent[]): LatestDecision | null {
  const decisions = events
    .filter(e => DECISION_SET.has(e.action))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latest = decisions[0];
  if (!latest) return null;
  return {
    action: latest.action,
    status: latest.new_status,
    comment: latest.comment,
    actorLabel: latest.actor_label,
    at: latest.created_at,
  };
}

/** True when the request is in the revision loop — awaiting a revised output. */
export function isAwaitingRevision(status: ContentApprovalStatus): boolean {
  return status === 'revision_requested';
}

/** Count decisions by action across an event log (for a compact audit summary). */
export function summarizeDecisions(events: ContentApprovalEvent[]): Record<ApprovalActionType, number> {
  const counts = { submitted: 0, approved: 0, rejected: 0, revision_requested: 0, commented: 0, cancelled: 0 } as Record<ApprovalActionType, number>;
  for (const e of events) {
    if (e.action in counts) counts[e.action] += 1;
  }
  return counts;
}

// Standing copy for the "changes requested — awaiting revised output" placeholder.
// Pinned by tests so the safety guarantees stay visible and verbatim.
export const REVISION_LOOP_COPY = {
  heading: 'Changes Requested — Awaiting Revised Output',
  preservedDraft: 'The original AI draft is preserved — requesting changes never deletes it.',
  preservedSnapshot: 'The Brand Context Snapshot that grounded this version is kept for the revised output.',
  awaiting: 'Waiting for a revised output. Core does not auto-regenerate — a new draft is produced only through the normal approval-first generation flow.',
  noPublish: 'Nothing is published, posted, or launched. Approved ≠ Published.',
} as const;
