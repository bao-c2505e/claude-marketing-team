// ---------------------------------------------------------------------------
// Delivery Closure & Manual Publishing Handoff Control (Phase U) — pure, local
//
// A SAFE, deterministic CLOSEOUT layer that sits ON TOP of Phase T (Client
// Feedback Intake & Delivery Acceptance) and Phase R (Manual Publishing
// Checklist). After a client has accepted a delivery in the local/mock review,
// this layer makes the after-acceptance situation explicit:
//
//   • Client accepted is NOT published. Acceptance authorizes the delivery to be
//     handed off — it never publishes anything. Publishing remains a separate,
//     manual step completed OUTSIDE Core by a human.
//   • The Owner/team can SEE the final closure status, unresolved feedback, the
//     manual-publishing readiness, and closure notes in one place — and close a
//     delivery safely without implying any live connector or auto-publishing.
//   • "Manually marked as published" only RECORDS that a person published the
//     delivery manually outside Core. Core itself never publishes, posts,
//     schedules, launches, spends, notifies, or calls any connector. This state
//     is NEVER derived automatically — it requires an explicit manual mark.
//
// Pure & deterministic: status derivation is a fixed function of explicit inputs,
// the closure checklist is derived from those inputs, and audit helpers return
// NEW arrays (no in-place mutation). No localStorage, no DB, no network, no
// connectors — trivially unit-testable. The UI panel holds the mock closure
// state in local React state. See CLAUDE.md §4 (Safety), §6 (Output Status).
//
// Reuses (no duplication): Phase T `DeliveryAcceptanceState` + the Phase T
// `DeliveryFeedbackSummary`, and the Phase R `OverallReadinessStatus`.
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import type {
  DeliveryAcceptanceState,
  DeliveryFeedbackSummary,
} from './deliveryAcceptance';
import type { OverallReadinessStatus } from './manualPublishingChecklist';

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so the panel + tests reference one source.
// ---------------------------------------------------------------------------

/** Required, visible "client accepted is not published" safety label. */
export const CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED = 'Client accepted ≠ Published.';

/** Required, visible "publishing happens manually outside Core" label. */
export const CLOSURE_PUBLISH_OUTSIDE_CORE =
  'Publishing must be completed manually outside CORE.';

/** Full safety note carried on the closure summary + copied text. */
export const CLOSURE_SAFETY_NOTE =
  'Delivery closure is local/demo state only. Core never publishes, posts, schedules, ' +
  'launches, or spends, and uses no connector. Marking a delivery "published" only records ' +
  'that a person published it manually outside CORE — Core never publishes anything itself.';

/** Short manual-only reminder (no auto-post / no auto-ads). */
export const CLOSURE_NO_AUTOMATION_NOTE =
  'Core never auto-posts and never auto-launches ads. The Owner/team publishes manually outside CORE.';

/** Local/demo provenance badges shown on the panel. */
export const CLOSURE_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo state only',
  'No publishing by CORE',
  'No public URL created',
  'No connector used',
];

// ---------------------------------------------------------------------------
// Closure status — the explicit, required status labels.
//
// NOTE: there is intentionally NO Core-set `published`/`launched` state. The only
// status that mentions "published" is `manually_marked_published`, which is an
// operator annotation that a human published OUTSIDE Core — never something Core
// did, and never derived automatically (it requires an explicit manual mark).
// ---------------------------------------------------------------------------

export type DeliveryClosureStatus =
  | 'not_accepted'
  | 'client_accepted_not_published'
  | 'ready_for_manual_publishing'
  | 'manually_marked_published'
  | 'closed_without_publishing';

export const DELIVERY_CLOSURE_STATUSES: DeliveryClosureStatus[] = [
  'not_accepted',
  'client_accepted_not_published',
  'ready_for_manual_publishing',
  'manually_marked_published',
  'closed_without_publishing',
];

export const DELIVERY_CLOSURE_STATUS_LABEL: Record<DeliveryClosureStatus, string> = {
  not_accepted:                  'Not accepted',
  client_accepted_not_published: 'Client accepted — not published',
  ready_for_manual_publishing:   'Ready for manual publishing',
  manually_marked_published:     'Manually marked as published',
  closed_without_publishing:     'Closed without publishing',
};

export const DELIVERY_CLOSURE_STATUS_COLOR: Record<DeliveryClosureStatus, string> = {
  not_accepted:                  '#94a3b8',
  client_accepted_not_published: '#fbbf24',
  ready_for_manual_publishing:   '#34d399',
  manually_marked_published:     '#a78bfa',
  closed_without_publishing:     '#60a5fa',
};

export const DELIVERY_CLOSURE_STATUS_DESCRIPTION: Record<DeliveryClosureStatus, string> = {
  not_accepted:
    'The client has not accepted this delivery yet — there is nothing to close out.',
  client_accepted_not_published:
    'Client accepted in the local/mock review. This is NOT published — the manual publishing checklist is not clear yet, or feedback is still open.',
  ready_for_manual_publishing:
    'Accepted, the manual publishing checklist is clear, and feedback is resolved or explicitly carried forward. Still NOT published — a person publishes manually outside CORE.',
  manually_marked_published:
    'A person recorded that this delivery was published MANUALLY outside CORE. Core did no publishing — this is an operator annotation only.',
  closed_without_publishing:
    'Closed without publishing — the delivery was wrapped up and intentionally not published. No publishing occurred.',
};

/**
 * Operator's explicit manual publish mark. This is the ONLY way the closure status
 * can reach a terminal state — it is never inferred. `none` keeps the delivery in a
 * derived (non-terminal, never-published) state.
 */
export type ManualPublishMark = 'none' | 'marked_published' | 'closed_unpublished';

export const MANUAL_PUBLISH_MARK_LABEL: Record<ManualPublishMark, string> = {
  none:              'Not marked',
  marked_published:  'Marked published manually (outside CORE)',
  closed_unpublished:'Closed without publishing',
};

// ---------------------------------------------------------------------------
// Closure checklist — the required manual gates a human reviews before closing.
// Each item is a manual confirmation the operator checks off; some carry a
// derived advisory warning computed from the live inputs.
// ---------------------------------------------------------------------------

export type ClosureChecklistKey =
  | 'client_acceptance_reviewed'
  | 'final_pack_reviewed'
  | 'feedback_resolved_or_carried'
  | 'manual_publishing_checklist_reviewed'
  | 'external_publishing_owner_assigned'
  | 'external_publishing_status_marked';

export const CLOSURE_CHECKLIST_KEYS: ClosureChecklistKey[] = [
  'client_acceptance_reviewed',
  'final_pack_reviewed',
  'feedback_resolved_or_carried',
  'manual_publishing_checklist_reviewed',
  'external_publishing_owner_assigned',
  'external_publishing_status_marked',
];

export const CLOSURE_CHECKLIST_LABEL: Record<ClosureChecklistKey, string> = {
  client_acceptance_reviewed:           'Client acceptance reviewed',
  final_pack_reviewed:                  'Final campaign pack reviewed by Owner',
  feedback_resolved_or_carried:         'Feedback resolved or explicitly carried forward',
  manual_publishing_checklist_reviewed: 'Manual publishing checklist reviewed',
  external_publishing_owner_assigned:   'External publishing owner assigned',
  external_publishing_status_marked:    'External publishing status marked manually',
};

export const CLOSURE_CHECKLIST_DESCRIPTION: Record<ClosureChecklistKey, string> = {
  client_acceptance_reviewed:
    'Confirm the client acceptance (local/mock) has been reviewed before closing.',
  final_pack_reviewed:
    'Confirm the Owner has reviewed the final approved campaign pack.',
  feedback_resolved_or_carried:
    'Every piece of client feedback is resolved, or explicitly carried forward as a follow-up.',
  manual_publishing_checklist_reviewed:
    'The Phase R manual publishing checklist has been reviewed — Core does not publish.',
  external_publishing_owner_assigned:
    'A person is named as responsible for publishing each item manually outside CORE.',
  external_publishing_status_marked:
    'The external publishing status is set manually — either marked published (outside CORE) or closed without publishing.',
};

/** Which checklist items the operator has explicitly confirmed (manual gates). */
export type ClosureChecklistConfirms = Partial<Record<ClosureChecklistKey, boolean>>;

export interface ClosureChecklistItem {
  key: ClosureChecklistKey;
  label: string;
  description: string;
  /** Whether the operator has confirmed this manual gate. */
  confirmed: boolean;
  /** Whether the item is satisfied (confirmed AND any derived requirement met). */
  satisfied: boolean;
  /** Optional advisory derived from live inputs (e.g. unresolved feedback). */
  advisory?: string;
}

// ---------------------------------------------------------------------------
// Status derivation — a fixed, pure function of explicit inputs.
// ---------------------------------------------------------------------------

export interface ClosureStatusInput {
  acceptanceState: DeliveryAcceptanceState;
  publishingOverall: OverallReadinessStatus;
  /** Count of feedback that is not yet resolved (open + acknowledged). */
  unresolvedFeedbackCount: number;
  /** Explicit Owner decision to carry unresolved feedback forward as follow-up. */
  feedbackCarriedForward: boolean;
  /** Operator's explicit manual mark. Honored ONLY behind the safe-close gate. */
  manualPublishMark: ManualPublishMark;
  /**
   * Whether every required closure gate (the closure checklist EXCEPT the
   * status-mark gate itself, plus the external-publishing-owner assignment) is
   * satisfied. The status-mark gate is excluded on purpose: it is satisfied BY
   * setting the mark, so including it here would be circular. Defaults to `false`
   * (gate closed) when omitted, so a bare mark can never force a terminal state.
   */
  closureGatesComplete?: boolean;
}

/** True when the client has accepted the delivery in the Phase T review. */
export function isClientAccepted(state: DeliveryAcceptanceState): boolean {
  return state === 'client_accepted' || state === 'owner_ready_for_manual_publish';
}

/** Feedback is either fully resolved or explicitly carried forward as a follow-up. */
export function feedbackIsClear(input: ClosureStatusInput): boolean {
  return input.unresolvedFeedbackCount === 0 || input.feedbackCarriedForward;
}

/**
 * The single, shared SAFE-CLOSE gate. An explicit manual publish/close mark may
 * only produce a terminal closure status when ALL of these hold — a mark NEVER
 * overrides these gates. Requires:
 *   • acceptance is `client_accepted` OR `owner_ready_for_manual_publish`,
 *   • unresolved feedback is resolved OR explicitly carried forward,
 *   • Phase R / manual-publishing readiness is `ready_for_manual_publishing`,
 *   • every required closure gate (incl. external-publishing-owner assignment) is
 *     complete (the status-mark gate is excluded — see `closureGatesComplete`).
 */
export function hasSafeClosureReadiness(input: ClosureStatusInput): boolean {
  return (
    isClientAccepted(input.acceptanceState) &&
    feedbackIsClear(input) &&
    input.publishingOverall === 'ready_for_manual_publishing' &&
    input.closureGatesComplete === true
  );
}

/** May the delivery be MARKED published manually? Only behind the safe-close gate. */
export function canMarkManualPublished(input: ClosureStatusInput): boolean {
  return hasSafeClosureReadiness(input);
}

/** May the delivery be CLOSED without publishing? Same safe-close gate (no bypass). */
export function canCloseDelivery(input: ClosureStatusInput): boolean {
  return hasSafeClosureReadiness(input);
}

/**
 * Derive the closure status. Pure and deterministic.
 *
 *  • Terminal states (`manually_marked_published`, `closed_without_publishing`) are
 *    reachable ONLY via an explicit `manualPublishMark` AND ONLY when
 *    `hasSafeClosureReadiness` holds — a mark NEVER overrides the safe-close gates.
 *    This keeps "published" a manual, human-confirmed annotation that can never be
 *    forced onto an unaccepted / unresolved / not-ready / incomplete delivery.
 *  • An explicit mark on an UNSAFE delivery is ignored: the function falls through
 *    to the appropriate safer derived status (`not_accepted` /
 *    `client_accepted_not_published` / `ready_for_manual_publishing`).
 *  • Without a (honored) mark, an accepted delivery is `client_accepted_not_published`
 *    until the Phase R checklist is ready AND feedback is resolved/carried forward,
 *    at which point it becomes `ready_for_manual_publishing` — which is STILL not
 *    published. Both non-terminal accepted states are explicitly NOT published.
 */
export function deriveClosureStatus(input: ClosureStatusInput): DeliveryClosureStatus {
  const safe = hasSafeClosureReadiness(input);

  // Explicit marks are honored ONLY behind the safe-close gate. An unsafe mark is
  // never allowed to force a terminal state — it falls through to the safe status.
  if (input.manualPublishMark === 'marked_published' && safe) return 'manually_marked_published';
  if (input.manualPublishMark === 'closed_unpublished' && safe) return 'closed_without_publishing';

  if (!isClientAccepted(input.acceptanceState)) return 'not_accepted';

  const publishingReady = input.publishingOverall === 'ready_for_manual_publishing';
  if (publishingReady && feedbackIsClear(input)) return 'ready_for_manual_publishing';

  return 'client_accepted_not_published';
}

/**
 * True only for the two terminal, manually-set states. A delivery in any other
 * status is still open/not-published.
 */
export function isClosed(status: DeliveryClosureStatus): boolean {
  return status === 'manually_marked_published' || status === 'closed_without_publishing';
}

// ---------------------------------------------------------------------------
// Closure view builder — composes status + acceptance + feedback + Phase R
// readiness + the manual checklist into a stable object the panel renders.
// ---------------------------------------------------------------------------

export interface DeliveryClosureParams {
  acceptanceState: DeliveryAcceptanceState;
  feedbackSummary: DeliveryFeedbackSummary;
  publishingOverall: OverallReadinessStatus;
  /** Operator confirmations for the manual closure gates. */
  checklistConfirms?: ClosureChecklistConfirms;
  /** Explicit decision to carry unresolved feedback forward. */
  feedbackCarriedForward?: boolean;
  /** Operator's explicit manual publish mark. */
  manualPublishMark?: ManualPublishMark;
  /** Free-text label of who will publish manually outside CORE (display only). */
  externalPublishingOwner?: string;
  /** Free-text closure notes (display only). */
  closureNotes?: string;
  /** Render timestamp; injectable for deterministic tests. */
  now?: Date;
}

export interface DeliveryClosureView {
  status: DeliveryClosureStatus;
  status_label: string;
  status_description: string;
  /** Acceptance roll-up. */
  acceptance_state: DeliveryAcceptanceState;
  client_accepted: boolean;
  /** Feedback roll-up. */
  unresolved_feedback_count: number;
  resolved_feedback_count: number;
  has_open_revision_request: boolean;
  feedback_carried_forward: boolean;
  /** Warning copy shown when unresolved feedback is not carried forward. */
  unresolved_feedback_warning: string | null;
  /** Phase R publishing readiness roll-up. */
  publishing_overall: OverallReadinessStatus;
  publishing_checklist_ready: boolean;
  /** Manual closure checklist + completeness. */
  checklist: ClosureChecklistItem[];
  checklist_complete: boolean;
  /** Whether the required closure gates (except the status-mark) are complete. */
  closure_gates_complete: boolean;
  /**
   * The shared safe-close gate (`hasSafeClosureReadiness`). Whether the operator
   * may now safely mark published / close without publishing. `ready_to_close` is
   * an alias kept for the panel/back-compat.
   */
  safe_closure_ready: boolean;
  ready_to_close: boolean;
  /**
   * EFFECTIVE manual publish mark — equals the requested mark ONLY when it was
   * honored (safe-close gate held); otherwise `none`. The display never claims a
   * published/closed state that the safe gate did not allow.
   */
  manual_publish_mark: ManualPublishMark;
  /** The mark the operator requested (raw), regardless of whether it was honored. */
  manual_publish_mark_requested: ManualPublishMark;
  /** Whether the requested mark actually drove a terminal closure status. */
  manual_publish_mark_applied: boolean;
  manual_publish_mark_label: string;
  external_publishing_owner: string;
  closure_notes: string;
  /** Core itself never publishes — structural guarantee, always false. */
  core_published: false;
  local_only_badges: string[];
  client_accepted_not_published_message: string;
  publish_outside_core_message: string;
  safety_note: string;
  no_automation_note: string;
  generatedAt: string;
}

function bool(v: boolean | undefined): boolean {
  return v === true;
}

export function buildDeliveryClosure(params: DeliveryClosureParams): DeliveryClosureView {
  const now = params.now ?? new Date();
  const confirms = params.checklistConfirms ?? {};
  const feedbackCarriedForward = bool(params.feedbackCarriedForward);
  const manualPublishMark = params.manualPublishMark ?? 'none';
  const externalPublishingOwner = (params.externalPublishingOwner ?? '').trim();
  const closureNotes = (params.closureNotes ?? '').trim();

  const fs = params.feedbackSummary;
  const unresolved = fs.open_count + fs.acknowledged_count;
  const clientAccepted = isClientAccepted(params.acceptanceState);
  const publishingReady = params.publishingOverall === 'ready_for_manual_publishing';

  const unresolvedWarning =
    unresolved > 0 && !feedbackCarriedForward
      ? `${unresolved} feedback ${unresolved === 1 ? 'item is' : 'items are'} still unresolved — resolve them or explicitly carry them forward before closing.`
      : null;

  // ── Manual closure checklist (derived advisories + manual confirmations) ──
  // Built BEFORE the status so closure-gate completeness can gate the manual marks.
  const checklist: ClosureChecklistItem[] = CLOSURE_CHECKLIST_KEYS.map(key => {
    const confirmed = bool(confirms[key]);
    let satisfied = confirmed;
    let advisory: string | undefined;

    switch (key) {
      case 'client_acceptance_reviewed':
        if (!clientAccepted) advisory = 'The client has not accepted yet.';
        break;
      case 'feedback_resolved_or_carried':
        if (unresolved > 0 && !feedbackCarriedForward) {
          advisory = `${unresolved} unresolved — resolve or carry forward.`;
        }
        // Only satisfiable once feedback is actually clear.
        satisfied = confirmed && (unresolved === 0 || feedbackCarriedForward);
        break;
      case 'manual_publishing_checklist_reviewed':
        if (!publishingReady) advisory = 'Phase R checklist is not ready for manual publishing yet.';
        break;
      case 'external_publishing_owner_assigned':
        // Needs an actual named owner, not just a checkbox.
        satisfied = confirmed && externalPublishingOwner.length > 0;
        if (!externalPublishingOwner) advisory = 'No external publishing owner named yet.';
        break;
      case 'external_publishing_status_marked':
        // Needs an explicit manual mark, not just a checkbox.
        satisfied = confirmed && manualPublishMark !== 'none';
        if (manualPublishMark === 'none') advisory = 'External publishing status not marked yet.';
        break;
      default:
        break;
    }

    return {
      key,
      label: CLOSURE_CHECKLIST_LABEL[key],
      description: CLOSURE_CHECKLIST_DESCRIPTION[key],
      confirmed,
      satisfied,
      advisory,
    };
  });

  const checklist_complete = checklist.every(i => i.satisfied);

  // Required closure gates EXCEPT the status-mark itself (that gate is satisfied BY
  // setting the mark, so it is excluded here to avoid a circular dependency).
  const closure_gates_complete = checklist
    .filter(i => i.key !== 'external_publishing_status_marked')
    .every(i => i.satisfied);

  // Derive the status with the full safe-close picture. The mark is honored ONLY
  // behind `hasSafeClosureReadiness`; an unsafe mark falls through to a safe status.
  const statusInput: ClosureStatusInput = {
    acceptanceState: params.acceptanceState,
    publishingOverall: params.publishingOverall,
    unresolvedFeedbackCount: unresolved,
    feedbackCarriedForward,
    manualPublishMark,
    closureGatesComplete: closure_gates_complete,
  };
  const safe_closure_ready = hasSafeClosureReadiness(statusInput);
  const status = deriveClosureStatus(statusInput);

  // The mark only "applies" when it drove a terminal status; otherwise the display
  // reports `none` so nothing ever claims published/closed without the safe gate.
  const manual_publish_mark_applied = isClosed(status);
  const effectiveMark: ManualPublishMark = manual_publish_mark_applied ? manualPublishMark : 'none';

  return {
    status,
    status_label: DELIVERY_CLOSURE_STATUS_LABEL[status],
    status_description: DELIVERY_CLOSURE_STATUS_DESCRIPTION[status],
    acceptance_state: params.acceptanceState,
    client_accepted: clientAccepted,
    unresolved_feedback_count: unresolved,
    resolved_feedback_count: fs.resolved_count,
    has_open_revision_request: fs.has_open_revision_request,
    feedback_carried_forward: feedbackCarriedForward,
    unresolved_feedback_warning: unresolvedWarning,
    publishing_overall: params.publishingOverall,
    publishing_checklist_ready: publishingReady,
    checklist,
    checklist_complete,
    closure_gates_complete,
    safe_closure_ready,
    ready_to_close: safe_closure_ready,
    manual_publish_mark: effectiveMark,
    manual_publish_mark_requested: manualPublishMark,
    manual_publish_mark_applied,
    manual_publish_mark_label: MANUAL_PUBLISH_MARK_LABEL[effectiveMark],
    external_publishing_owner: externalPublishingOwner,
    closure_notes: closureNotes,
    core_published: false,
    local_only_badges: [...CLOSURE_LOCAL_ONLY_BADGES],
    client_accepted_not_published_message: CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED,
    publish_outside_core_message: CLOSURE_PUBLISH_OUTSIDE_CORE,
    safety_note: CLOSURE_SAFETY_NOTE,
    no_automation_note: CLOSURE_NO_AUTOMATION_NOTE,
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Audit trail — pure helpers. Each entry is flagged local/mock/demo and the
// append helper returns a NEW array (no in-place mutation).
// ---------------------------------------------------------------------------

export type ClosureAuditEventType =
  | 'client_acceptance_recorded'
  | 'closure_checklist_reviewed'
  | 'ready_for_manual_publishing_marked'
  | 'manually_marked_published'
  | 'closed_without_publishing';

export const CLOSURE_AUDIT_EVENT_TYPES: ClosureAuditEventType[] = [
  'client_acceptance_recorded',
  'closure_checklist_reviewed',
  'ready_for_manual_publishing_marked',
  'manually_marked_published',
  'closed_without_publishing',
];

export const CLOSURE_AUDIT_EVENT_LABEL: Record<ClosureAuditEventType, string> = {
  client_acceptance_recorded:         'Client acceptance recorded',
  closure_checklist_reviewed:         'Closure checklist reviewed',
  ready_for_manual_publishing_marked: 'Ready for manual publishing marked',
  manually_marked_published:          'Manually marked as published (outside CORE)',
  closed_without_publishing:          'Closed without publishing',
};

export interface ClosureAuditEntry {
  id: string;
  type: ClosureAuditEventType;
  label: string;
  /** Optional free-text detail (e.g. who/what). */
  detail?: string;
  /** Every closure audit event is local/mock/demo state — never a real action. */
  local_mock: true;
  at: string;
}

export interface ClosureAuditOpts {
  id?: string;
  now?: string;
  detail?: string;
}

export function buildClosureAuditEntry(type: ClosureAuditEventType, opts: ClosureAuditOpts = {}): ClosureAuditEntry {
  return {
    id: opts.id ?? generateId('cae'),
    type,
    label: CLOSURE_AUDIT_EVENT_LABEL[type],
    detail: opts.detail?.trim() || undefined,
    local_mock: true,
    at: opts.now ?? new Date().toISOString(),
  };
}

/** Append a new audit entry. Pure — returns a NEW array. */
export function appendClosureAudit(
  list: ClosureAuditEntry[],
  type: ClosureAuditEventType,
  opts: ClosureAuditOpts = {},
): ClosureAuditEntry[] {
  return [...list, buildClosureAuditEntry(type, opts)];
}

/** Newest-first ordered list (stable display). */
export function listClosureAudit(list: ClosureAuditEntry[]): ClosureAuditEntry[] {
  return [...list].sort((a, b) => b.at.localeCompare(a.at));
}

/** Deterministic sample audit trail for the local preview. */
export function sampleClosureAudit(now: Date = new Date('2026-06-25T10:00:00.000Z')): ClosureAuditEntry[] {
  const base = now.getTime();
  const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000).toISOString();
  return [
    buildClosureAuditEntry('client_acceptance_recorded', {
      id: 'cae-sample-1',
      now: at(45),
      detail: 'Client accepted in the local/mock review (sample).',
    }),
    buildClosureAuditEntry('closure_checklist_reviewed', {
      id: 'cae-sample-2',
      now: at(20),
      detail: 'Owner reviewed the closure checklist (sample).',
    }),
  ];
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network, and never emits a URL/link.
// ---------------------------------------------------------------------------

export function renderDeliveryClosureText(
  view: DeliveryClosureView,
  audit: ClosureAuditEntry[] = [],
  title = 'Delivery Closure',
): string {
  const lines: string[] = [];
  lines.push(`DELIVERY CLOSURE (LOCAL/DEMO) — ${title}`);
  lines.push(view.client_accepted_not_published_message);
  lines.push(view.publish_outside_core_message);
  lines.push(view.safety_note);
  lines.push('');
  lines.push(`Local-only: ${view.local_only_badges.join(' · ')}`);
  lines.push('');

  lines.push(`Closure status: ${view.status_label} (Not published by CORE)`);
  lines.push(`- ${view.status_description}`);
  lines.push('');

  lines.push('ACCEPTANCE & FEEDBACK');
  lines.push(`- Client accepted: ${view.client_accepted ? 'yes' : 'no'} (acceptance state: ${view.acceptance_state})`);
  lines.push(`- Feedback: ${view.unresolved_feedback_count} unresolved · ${view.resolved_feedback_count} resolved · carried forward: ${view.feedback_carried_forward ? 'yes' : 'no'}`);
  if (view.unresolved_feedback_warning) lines.push(`- WARNING: ${view.unresolved_feedback_warning}`);
  lines.push(`- Manual publishing checklist (Phase R): ${view.publishing_checklist_ready ? 'ready' : 'not ready yet'}`);
  lines.push('');

  lines.push('MANUAL PUBLISHING CHECKLIST (closure)');
  for (const it of view.checklist) {
    lines.push(`- [${it.satisfied ? 'x' : ' '}] ${it.label}`);
    if (it.advisory) lines.push(`    · ${it.advisory}`);
  }
  lines.push('');

  lines.push('MANUAL PUBLISHING HANDOFF');
  lines.push(`- External publishing owner: ${view.external_publishing_owner || '(unassigned)'}`);
  lines.push(`- External publishing status: ${view.manual_publish_mark_label}`);
  lines.push(`- ${view.no_automation_note}`);
  lines.push('');

  if (view.closure_notes) {
    lines.push('CLOSURE NOTES');
    lines.push(view.closure_notes);
    lines.push('');
  }

  if (audit.length > 0) {
    lines.push('AUDIT TRAIL (local/mock/demo)');
    for (const e of listClosureAudit(audit)) {
      lines.push(`- ${e.label}${e.detail ? ` — ${e.detail}` : ''}`);
    }
    lines.push('');
  }

  lines.push('SAFETY');
  lines.push(`- ${CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED} ${CLOSURE_PUBLISH_OUTSIDE_CORE}`);
  lines.push('- No email, no public link, no notification, no connector — local/demo closure state only.');

  return lines.join('\n');
}
