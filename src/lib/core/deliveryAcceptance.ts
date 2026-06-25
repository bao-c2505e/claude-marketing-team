// ---------------------------------------------------------------------------
// Client Feedback Intake & Delivery Acceptance (Phase T) — local/mock, pure
//
// Extends the Phase S Client Delivery Room from a read-only handoff PREVIEW into
// a SAFE local/mock client review workflow. It lets the Owner/internal team see
// how client feedback and delivery acceptance WOULD be captured — without sending
// anything externally and without ever creating a real public share link.
//
// This is NOT a real client portal and NOT automation:
//   • Core never emails, messages, posts, schedules, launches, spends, calls n8n,
//     triggers OpenAI/Canva/Meta/TikTok/Zalo/Google, fetches live analytics, or
//     creates any public/share URL. Feedback here is a LOCAL MOCK preview only —
//     nothing is sent, notified, synced, or made public.
//   • Recording feedback NEVER mutates approval state. Approval decisions are made
//     ONLY by an authenticated Core UI action in the Approval Queue.
//   • Approved ≠ Published is enforced structurally. `client_accepted` is NOT a
//     published state, and `owner_ready_for_manual_publish` is gated behind the
//     Phase R manual publishing checklist being ready — it still requires a
//     separate, manual, Owner-controlled human publish step that lives outside
//     this module. There is deliberately NO `published`/`launched` state here.
//
// Pure & deterministic: feedback mutators return NEW arrays (no in-place mutation),
// acceptance transitions are a fixed graph + an explicit gate, and the room builder
// returns plain objects/strings. No localStorage, no DB, no network, no connectors —
// trivially unit-testable. The UI panel holds the mock feedback/state in local React
// state seeded by `sampleDeliveryFeedback`. See CLAUDE.md §4 (Safety), §6 (Status).
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import type { OverallReadinessStatus } from './manualPublishingChecklist';

// ---------------------------------------------------------------------------
// Feedback enums + labels/colors
// ---------------------------------------------------------------------------

/** Local/mock client feedback categories on a delivered campaign pack. */
export type DeliveryFeedbackType =
  | 'general_comment'
  | 'revision_request'
  | 'approval_note'
  | 'publishing_question';

/** Lifecycle of a single mock feedback entry. */
export type DeliveryFeedbackStatus = 'open' | 'acknowledged' | 'resolved';

export const DELIVERY_FEEDBACK_TYPES: DeliveryFeedbackType[] = [
  'general_comment',
  'revision_request',
  'approval_note',
  'publishing_question',
];

export const DELIVERY_FEEDBACK_STATUSES: DeliveryFeedbackStatus[] = [
  'open',
  'acknowledged',
  'resolved',
];

export const DELIVERY_FEEDBACK_TYPE_LABEL: Record<DeliveryFeedbackType, string> = {
  general_comment:     'General comment',
  revision_request:    'Revision request',
  approval_note:       'Approval note',
  publishing_question: 'Publishing question',
};

export const DELIVERY_FEEDBACK_TYPE_COLOR: Record<DeliveryFeedbackType, string> = {
  general_comment:     '#60a5fa',
  revision_request:    '#fbbf24',
  approval_note:       '#34d399',
  publishing_question: '#a78bfa',
};

export const DELIVERY_FEEDBACK_STATUS_LABEL: Record<DeliveryFeedbackStatus, string> = {
  open:         'Open',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

export const DELIVERY_FEEDBACK_STATUS_COLOR: Record<DeliveryFeedbackStatus, string> = {
  open:         '#fb923c',
  acknowledged: '#60a5fa',
  resolved:     '#34d399',
};

export const DEFAULT_DELIVERY_FEEDBACK_TYPE: DeliveryFeedbackType = 'general_comment';
export const DEFAULT_DELIVERY_FEEDBACK_STATUS: DeliveryFeedbackStatus = 'open';

const FEEDBACK_TYPE_SET = new Set<string>(DELIVERY_FEEDBACK_TYPES);
const FEEDBACK_STATUS_SET = new Set<string>(DELIVERY_FEEDBACK_STATUSES);

// ---------------------------------------------------------------------------
// Acceptance state enums + labels/colors
// ---------------------------------------------------------------------------

/**
 * Delivery acceptance lifecycle. NOTE: there is NO `published`/`launched` state —
 * `client_accepted` ≠ Published, and `owner_ready_for_manual_publish` is the
 * terminal state of THIS mock model. Real publishing is a separate manual step.
 */
export type DeliveryAcceptanceState =
  | 'draft_preview'
  | 'shared_for_review_mock'
  | 'client_feedback_open'
  | 'revision_needed'
  | 'client_accepted'
  | 'owner_ready_for_manual_publish';

export const DELIVERY_ACCEPTANCE_STATES: DeliveryAcceptanceState[] = [
  'draft_preview',
  'shared_for_review_mock',
  'client_feedback_open',
  'revision_needed',
  'client_accepted',
  'owner_ready_for_manual_publish',
];

export const DEFAULT_DELIVERY_ACCEPTANCE_STATE: DeliveryAcceptanceState = 'draft_preview';

export const DELIVERY_ACCEPTANCE_STATE_LABEL: Record<DeliveryAcceptanceState, string> = {
  draft_preview:                  'Draft preview',
  shared_for_review_mock:         'Shared for review (mock)',
  client_feedback_open:           'Client feedback open',
  revision_needed:                'Revision needed',
  client_accepted:                'Client accepted',
  owner_ready_for_manual_publish: 'Owner: ready for manual publish',
};

export const DELIVERY_ACCEPTANCE_STATE_COLOR: Record<DeliveryAcceptanceState, string> = {
  draft_preview:                  '#94a3b8',
  shared_for_review_mock:         '#60a5fa',
  client_feedback_open:           '#fbbf24',
  revision_needed:                '#f87171',
  client_accepted:                '#34d399',
  owner_ready_for_manual_publish: '#a78bfa',
};

export const DELIVERY_ACCEPTANCE_STATE_DESCRIPTION: Record<DeliveryAcceptanceState, string> = {
  draft_preview:
    'Internal draft preview only — not shared with anyone yet.',
  shared_for_review_mock:
    'Mock "shared for review" — no public URL, no email, no notification was sent. Local preview only.',
  client_feedback_open:
    'Mock client feedback is open and awaiting internal acknowledgement/resolution.',
  revision_needed:
    'A revision was requested — route back to the campaign for internal edits, then re-share (mock).',
  client_accepted:
    'Client accepted in this mock review. This is NOT published — publishing remains a separate manual, Owner-controlled step.',
  owner_ready_for_manual_publish:
    'Queued for the Owner\'s manual publishing checklist (Phase R). Still NOT published — a person publishes each item manually.',
};

/**
 * Fixed transition graph. Deterministic and testable. `owner_ready_for_manual_publish`
 * is additionally GATED at runtime (see `transitionAcceptance`) so it can only be
 * reached from `client_accepted` AND only when the Phase R checklist is ready.
 */
export const DELIVERY_ACCEPTANCE_TRANSITIONS: Record<DeliveryAcceptanceState, DeliveryAcceptanceState[]> = {
  draft_preview:                  ['shared_for_review_mock'],
  shared_for_review_mock:         ['client_feedback_open', 'client_accepted', 'draft_preview'],
  client_feedback_open:           ['revision_needed', 'client_accepted', 'shared_for_review_mock'],
  revision_needed:                ['shared_for_review_mock', 'client_feedback_open'],
  client_accepted:                ['owner_ready_for_manual_publish', 'revision_needed'],
  owner_ready_for_manual_publish: ['revision_needed'],
};

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so the panel + tests reference one source.
// ---------------------------------------------------------------------------

/** Required local/mock badges shown on the panel. */
export const DELIVERY_ACCEPTANCE_LOCAL_ONLY_BADGES: string[] = [
  'Local preview only',
  'No public URL created',
  'No notification sent',
  'No connector used',
];

/** Explicit "client accepted is not published" copy (required verbatim). */
export const DELIVERY_ACCEPTANCE_NOT_PUBLISHED =
  'Client accepted ≠ Published. Publishing remains manual and owner-controlled.';

/** Explicit "this is a local mock, not a real client portal" copy. */
export const DELIVERY_ACCEPTANCE_MOCK_NOTE =
  'Local mock review only — this is not a real client portal. No email is sent, no public link is created, no notification is delivered, and nothing is synced to any external service.';

/** Explicit copy that owner_ready_for_manual_publish still needs the Phase R checklist. */
export const DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST =
  'Owner: ready for manual publish still requires the Phase R manual publishing checklist to be ready — it does not publish anything.';

// ---------------------------------------------------------------------------
// Feedback record + pure mutators (array-based; each returns a NEW array)
// ---------------------------------------------------------------------------

export interface DeliveryFeedbackEntry {
  id: string;
  type: DeliveryFeedbackType;
  status: DeliveryFeedbackStatus;
  /** Free-text mock feedback message. */
  message: string;
  /** Sample/display author label only — NOT a real client identity. */
  author_label: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryFeedbackInput {
  message: string;
  type?: DeliveryFeedbackType;
  status?: DeliveryFeedbackStatus;
  /** Optional sample author label; falls back to a safe generic sample label. */
  author_label?: string;
}

export interface FeedbackMutateOpts {
  id?: string;
  now?: string;
}

/** Default sample author label — explicitly a sample, never a real identity. */
export const DEFAULT_FEEDBACK_AUTHOR_LABEL = 'Client reviewer (sample)';

function coerceFeedbackType(v: unknown): DeliveryFeedbackType {
  return typeof v === 'string' && FEEDBACK_TYPE_SET.has(v) ? (v as DeliveryFeedbackType) : DEFAULT_DELIVERY_FEEDBACK_TYPE;
}

function coerceFeedbackStatus(v: unknown): DeliveryFeedbackStatus {
  return typeof v === 'string' && FEEDBACK_STATUS_SET.has(v) ? (v as DeliveryFeedbackStatus) : DEFAULT_DELIVERY_FEEDBACK_STATUS;
}

/** Append a new mock feedback entry. Pure — returns a NEW array. */
export function addDeliveryFeedback(
  list: DeliveryFeedbackEntry[],
  input: DeliveryFeedbackInput,
  opts: FeedbackMutateOpts = {},
): DeliveryFeedbackEntry[] {
  const now = opts.now ?? new Date().toISOString();
  const id = opts.id ?? generateId('dfb');
  const entry: DeliveryFeedbackEntry = {
    id,
    type: coerceFeedbackType(input.type),
    status: coerceFeedbackStatus(input.status),
    message: input.message.trim(),
    author_label: input.author_label?.trim() || DEFAULT_FEEDBACK_AUTHOR_LABEL,
    createdAt: now,
    updatedAt: now,
  };
  return [...list, entry];
}

/**
 * Allowed feedback status transitions. Linear forward (open → acknowledged →
 * resolved) with explicit reopen paths. Same-status is a no-op (allowed).
 */
export const DELIVERY_FEEDBACK_TRANSITIONS: Record<DeliveryFeedbackStatus, DeliveryFeedbackStatus[]> = {
  open:         ['acknowledged', 'resolved'],
  acknowledged: ['resolved', 'open'],
  resolved:     ['open', 'acknowledged'],
};

export function canTransitionFeedback(from: DeliveryFeedbackStatus, to: DeliveryFeedbackStatus): boolean {
  if (from === to) return true;
  return DELIVERY_FEEDBACK_TRANSITIONS[from].includes(to);
}

/**
 * Set a feedback entry's status if the transition is allowed. Pure — returns a NEW
 * array; an unknown id or a disallowed transition returns the input array unchanged.
 */
export function setDeliveryFeedbackStatus(
  list: DeliveryFeedbackEntry[],
  id: string,
  status: DeliveryFeedbackStatus,
  opts: FeedbackMutateOpts = {},
): DeliveryFeedbackEntry[] {
  const now = opts.now ?? new Date().toISOString();
  let changed = false;
  const next = list.map(e => {
    if (e.id !== id) return e;
    if (!canTransitionFeedback(e.status, status)) return e;
    changed = true;
    return { ...e, status, updatedAt: now };
  });
  return changed ? next : list;
}

/** Remove a feedback entry. Pure — returns a NEW array. */
export function removeDeliveryFeedback(list: DeliveryFeedbackEntry[], id: string): DeliveryFeedbackEntry[] {
  const next = list.filter(e => e.id !== id);
  return next.length === list.length ? list : next;
}

/** Newest-first ordered list (stable display). */
export function listDeliveryFeedback(list: DeliveryFeedbackEntry[]): DeliveryFeedbackEntry[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------------------------------------------------------------------
// Acceptance transitions — fixed graph + the owner-ready gate.
// ---------------------------------------------------------------------------

export interface AcceptanceTransitionResult {
  ok: boolean;
  /** Resulting state — equals `from` when the transition is rejected. */
  state: DeliveryAcceptanceState;
  /** Human-readable reason when rejected (or the gate that blocked owner-ready). */
  blockedReason?: string;
}

export interface AcceptanceTransitionOpts {
  /**
   * Phase R rollup. Moving to `owner_ready_for_manual_publish` requires this to be
   * exactly `ready_for_manual_publishing`. Defaults to a non-ready value so the gate
   * is closed unless an explicit ready status is supplied.
   */
  publishingOverall?: OverallReadinessStatus;
}

/** True only when the Phase R checklist is ready for manual publishing. */
export function isPublishingChecklistReady(overall: OverallReadinessStatus | undefined): boolean {
  return overall === 'ready_for_manual_publishing';
}

/**
 * Validate + apply an acceptance transition. Pure and deterministic.
 *  • Rejects transitions not in `DELIVERY_ACCEPTANCE_TRANSITIONS`.
 *  • GATE: `owner_ready_for_manual_publish` is only reachable from `client_accepted`
 *    AND only when the Phase R checklist is ready. It is NEVER a published state.
 */
export function transitionAcceptance(
  from: DeliveryAcceptanceState,
  to: DeliveryAcceptanceState,
  opts: AcceptanceTransitionOpts = {},
): AcceptanceTransitionResult {
  if (!DELIVERY_ACCEPTANCE_TRANSITIONS[from].includes(to)) {
    return { ok: false, state: from, blockedReason: `Transition ${from} → ${to} is not allowed.` };
  }
  if (to === 'owner_ready_for_manual_publish') {
    if (from !== 'client_accepted') {
      return { ok: false, state: from, blockedReason: 'Owner-ready requires the client to have accepted first.' };
    }
    if (!isPublishingChecklistReady(opts.publishingOverall)) {
      return {
        ok: false,
        state: from,
        blockedReason: DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST,
      };
    }
  }
  return { ok: true, state: to };
}

/** Allowed next states from `from` (graph only — does not evaluate the owner-ready gate). */
export function nextAcceptanceStates(from: DeliveryAcceptanceState): DeliveryAcceptanceState[] {
  return [...DELIVERY_ACCEPTANCE_TRANSITIONS[from]];
}

// ---------------------------------------------------------------------------
// Room builder — composes feedback + acceptance + the Phase R gate into a stable
// view object the panel renders. Always carries `published: false`.
// ---------------------------------------------------------------------------

export interface DeliveryFeedbackSummary {
  total: number;
  open_count: number;
  acknowledged_count: number;
  resolved_count: number;
  by_type: Record<DeliveryFeedbackType, number>;
  /** True when there is at least one open revision_request. */
  has_open_revision_request: boolean;
}

export interface DeliveryAcceptanceRoom {
  state: DeliveryAcceptanceState;
  state_label: string;
  state_description: string;
  feedback: DeliveryFeedbackEntry[];
  feedback_summary: DeliveryFeedbackSummary;
  /** Whether the Phase R checklist is ready (the owner-ready gate input). */
  publishing_checklist_ready: boolean;
  /** Whether the owner-ready transition is currently allowed. */
  can_mark_owner_ready_for_manual_publish: boolean;
  /** Reason the owner-ready transition is blocked, when it is. */
  owner_ready_blocked_reason: string | null;
  next_states: DeliveryAcceptanceState[];
  next_actions: string[];
  local_only_badges: string[];
  /** Approved/accepted ≠ Published is enforced structurally: always false. */
  published: false;
  client_accepted_not_published_message: string;
  mock_note: string;
  generatedAt: string;
}

export interface DeliveryAcceptanceRoomParams {
  state: DeliveryAcceptanceState;
  feedback: DeliveryFeedbackEntry[];
  /** Phase R rollup — gates owner_ready_for_manual_publish. */
  publishingOverall: OverallReadinessStatus;
  /** Render timestamp; injectable for deterministic tests. */
  now?: Date;
}

function summarizeFeedback(list: DeliveryFeedbackEntry[]): DeliveryFeedbackSummary {
  const by_type: Record<DeliveryFeedbackType, number> = {
    general_comment: 0,
    revision_request: 0,
    approval_note: 0,
    publishing_question: 0,
  };
  let open_count = 0, acknowledged_count = 0, resolved_count = 0;
  let has_open_revision_request = false;
  for (const e of list) {
    by_type[e.type] += 1;
    if (e.status === 'open') open_count += 1;
    else if (e.status === 'acknowledged') acknowledged_count += 1;
    else resolved_count += 1;
    if (e.type === 'revision_request' && e.status !== 'resolved') has_open_revision_request = true;
  }
  return {
    total: list.length,
    open_count,
    acknowledged_count,
    resolved_count,
    by_type,
    has_open_revision_request,
  };
}

export function buildDeliveryAcceptanceRoom(params: DeliveryAcceptanceRoomParams): DeliveryAcceptanceRoom {
  const { state, publishingOverall } = params;
  const now = params.now ?? new Date();
  const feedback = listDeliveryFeedback(params.feedback);
  const feedback_summary = summarizeFeedback(feedback);

  const publishing_checklist_ready = isPublishingChecklistReady(publishingOverall);
  const ownerReady = transitionAcceptance(state, 'owner_ready_for_manual_publish', { publishingOverall });
  const can_mark_owner_ready_for_manual_publish =
    state === 'client_accepted' && ownerReady.ok;
  const owner_ready_blocked_reason =
    state === 'client_accepted' && !ownerReady.ok ? (ownerReady.blockedReason ?? null) : null;

  // ── Deterministic, manual-only next-action guidance ──
  const next_actions: string[] = [];
  switch (state) {
    case 'draft_preview':
      next_actions.push('Share for review (mock) when the internal team is ready — no link or notification is sent.');
      break;
    case 'shared_for_review_mock':
      next_actions.push('Record any mock client feedback, or mark client-accepted if there are no comments.');
      break;
    case 'client_feedback_open':
      if (feedback_summary.has_open_revision_request) {
        next_actions.push('Resolve the open revision request, then route to "Revision needed".');
      }
      next_actions.push('Acknowledge / resolve open feedback, then move to "Revision needed" or "Client accepted".');
      break;
    case 'revision_needed':
      next_actions.push('Make edits in the campaign, then re-share for review (mock).');
      break;
    case 'client_accepted':
      next_actions.push(
        publishing_checklist_ready
          ? 'Move to "Owner: ready for manual publish" — then publish manually via the Phase R checklist.'
          : 'Resolve the Phase R manual publishing checklist before Owner-ready is available.',
      );
      break;
    case 'owner_ready_for_manual_publish':
      next_actions.push('Publish each item manually using the Phase R manual publishing checklist. Core does not auto-post.');
      break;
  }

  return {
    state,
    state_label: DELIVERY_ACCEPTANCE_STATE_LABEL[state],
    state_description: DELIVERY_ACCEPTANCE_STATE_DESCRIPTION[state],
    feedback,
    feedback_summary,
    publishing_checklist_ready,
    can_mark_owner_ready_for_manual_publish,
    owner_ready_blocked_reason,
    next_states: nextAcceptanceStates(state),
    next_actions,
    local_only_badges: [...DELIVERY_ACCEPTANCE_LOCAL_ONLY_BADGES],
    published: false,
    client_accepted_not_published_message: DELIVERY_ACCEPTANCE_NOT_PUBLISHED,
    mock_note: DELIVERY_ACCEPTANCE_MOCK_NOTE,
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network, and never emits a URL/link.
// ---------------------------------------------------------------------------

export function renderDeliveryAcceptanceText(room: DeliveryAcceptanceRoom, title = 'Delivery Acceptance'): string {
  const lines: string[] = [];
  lines.push(`DELIVERY ACCEPTANCE (LOCAL MOCK) — ${title}`);
  lines.push(room.client_accepted_not_published_message);
  lines.push(room.mock_note);
  lines.push('');
  lines.push(`Local-only: ${room.local_only_badges.join(' · ')}`);
  lines.push('');
  lines.push(`State: ${room.state_label} (Not Published)`);
  lines.push(`- ${room.state_description}`);
  lines.push('');

  lines.push('CLIENT FEEDBACK (mock)');
  const fs = room.feedback_summary;
  lines.push(`- ${fs.total} total · ${fs.open_count} open · ${fs.acknowledged_count} acknowledged · ${fs.resolved_count} resolved`);
  if (room.feedback.length === 0) {
    lines.push('- (No mock feedback recorded yet.)');
  } else {
    for (const f of room.feedback) {
      lines.push(
        `- [${DELIVERY_FEEDBACK_TYPE_LABEL[f.type]} · ${DELIVERY_FEEDBACK_STATUS_LABEL[f.status]}] ` +
        `${f.author_label}: ${f.message}`,
      );
    }
  }
  lines.push('');

  lines.push('NEXT ACTIONS (manual)');
  for (const a of room.next_actions) lines.push(`- ${a}`);
  if (room.owner_ready_blocked_reason) lines.push(`- Blocked: ${room.owner_ready_blocked_reason}`);
  lines.push('');

  lines.push('SAFETY');
  lines.push(`- ${DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST}`);
  lines.push('- No email, no public link, no notification, no connector — local mock preview only.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Deterministic mock seed — sample feedback for the local preview. Author labels
// are explicitly SAMPLE labels (never a real client identity); timestamps are
// derived from an injectable base time so tests/UI are stable.
// ---------------------------------------------------------------------------

export function sampleDeliveryFeedback(now: Date = new Date('2026-06-24T10:00:00.000Z')): DeliveryFeedbackEntry[] {
  const base = now.getTime();
  const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000).toISOString();
  return [
    {
      id: 'dfb-sample-1',
      type: 'general_comment',
      status: 'open',
      message: 'Tổng thể nhìn ngon, caption ngày 1 rất bắt vị. (sample)',
      author_label: 'Client reviewer (sample)',
      createdAt: at(90),
      updatedAt: at(90),
    },
    {
      id: 'dfb-sample-2',
      type: 'revision_request',
      status: 'open',
      message: 'Xin đổi hook ngày 3 cho tự nhiên hơn, tránh nghe quảng cáo. (sample)',
      author_label: 'Client reviewer (sample)',
      createdAt: at(60),
      updatedAt: at(60),
    },
    {
      id: 'dfb-sample-3',
      type: 'publishing_question',
      status: 'acknowledged',
      message: 'Khi nào nên đăng bài combo cuối tuần? (sample)',
      author_label: 'Owner note (sample)',
      createdAt: at(30),
      updatedAt: at(20),
    },
  ];
}
