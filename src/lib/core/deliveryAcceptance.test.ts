import { describe, expect, it } from 'vitest';
import {
  addDeliveryFeedback,
  setDeliveryFeedbackStatus,
  removeDeliveryFeedback,
  listDeliveryFeedback,
  canTransitionFeedback,
  transitionAcceptance,
  nextAcceptanceStates,
  isPublishingChecklistReady,
  buildDeliveryAcceptanceRoom,
  renderDeliveryAcceptanceText,
  sampleDeliveryFeedback,
  DELIVERY_ACCEPTANCE_STATES,
  DELIVERY_ACCEPTANCE_TRANSITIONS,
  DELIVERY_ACCEPTANCE_LOCAL_ONLY_BADGES,
  DELIVERY_ACCEPTANCE_NOT_PUBLISHED,
  DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST,
  DEFAULT_FEEDBACK_AUTHOR_LABEL,
  type DeliveryAcceptanceState,
  type DeliveryFeedbackEntry,
} from './deliveryAcceptance';
import type { OverallReadinessStatus } from './manualPublishingChecklist';

const NOW = '2026-06-24T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

// ---------------------------------------------------------------------------
// Feedback creation
// ---------------------------------------------------------------------------

describe('addDeliveryFeedback', () => {
  it('appends a new entry with defaults and a safe sample author label', () => {
    const list = addDeliveryFeedback([], { message: '  Looks great  ' }, { id: 'f1', now: NOW });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: 'f1',
      type: 'general_comment',
      status: 'open',
      message: 'Looks great',
      author_label: DEFAULT_FEEDBACK_AUTHOR_LABEL,
      createdAt: NOW,
      updatedAt: NOW,
    });
  });

  it('does not mutate the input array (pure)', () => {
    const before: DeliveryFeedbackEntry[] = [];
    const after = addDeliveryFeedback(before, { message: 'x', type: 'revision_request' }, { id: 'f2', now: NOW });
    expect(before).toHaveLength(0);
    expect(after).toHaveLength(1);
    expect(after[0].type).toBe('revision_request');
  });

  it('coerces an unknown type/status back to safe defaults', () => {
    const list = addDeliveryFeedback(
      [],
      // @ts-expect-error — deliberately invalid to test coercion
      { message: 'x', type: 'spam', status: 'launched' },
      { id: 'f3', now: NOW },
    );
    expect(list[0].type).toBe('general_comment');
    expect(list[0].status).toBe('open');
  });
});

// ---------------------------------------------------------------------------
// Feedback status transitions
// ---------------------------------------------------------------------------

describe('feedback status transitions', () => {
  it('allows open → acknowledged → resolved and same-status no-op', () => {
    expect(canTransitionFeedback('open', 'acknowledged')).toBe(true);
    expect(canTransitionFeedback('acknowledged', 'resolved')).toBe(true);
    expect(canTransitionFeedback('open', 'resolved')).toBe(true);
    expect(canTransitionFeedback('open', 'open')).toBe(true);
  });

  it('allows reopening from resolved/acknowledged', () => {
    expect(canTransitionFeedback('resolved', 'open')).toBe(true);
    expect(canTransitionFeedback('acknowledged', 'open')).toBe(true);
  });

  it('setDeliveryFeedbackStatus updates the entry and bumps updatedAt', () => {
    const list = addDeliveryFeedback([], { message: 'x' }, { id: 'f1', now: NOW });
    const later = '2026-06-24T11:00:00.000Z';
    const next = setDeliveryFeedbackStatus(list, 'f1', 'acknowledged', { now: later });
    expect(next[0].status).toBe('acknowledged');
    expect(next[0].updatedAt).toBe(later);
    // pure: original untouched
    expect(list[0].status).toBe('open');
  });

  it('returns the same array for an unknown id (no change)', () => {
    const list = addDeliveryFeedback([], { message: 'x' }, { id: 'f1', now: NOW });
    const next = setDeliveryFeedbackStatus(list, 'nope', 'resolved', { now: NOW });
    expect(next).toBe(list);
  });

  it('removeDeliveryFeedback drops the entry, no-op for unknown id', () => {
    const list = addDeliveryFeedback([], { message: 'x' }, { id: 'f1', now: NOW });
    expect(removeDeliveryFeedback(list, 'f1')).toHaveLength(0);
    expect(removeDeliveryFeedback(list, 'nope')).toBe(list);
  });

  it('listDeliveryFeedback orders newest-first', () => {
    let list: DeliveryFeedbackEntry[] = [];
    list = addDeliveryFeedback(list, { message: 'old' }, { id: 'a', now: '2026-06-24T09:00:00.000Z' });
    list = addDeliveryFeedback(list, { message: 'new' }, { id: 'b', now: '2026-06-24T10:00:00.000Z' });
    expect(listDeliveryFeedback(list).map(e => e.id)).toEqual(['b', 'a']);
  });
});

// ---------------------------------------------------------------------------
// Acceptance state transitions (graph + owner-ready gate)
// ---------------------------------------------------------------------------

const READY: OverallReadinessStatus = 'ready_for_manual_publishing';
const NOT_READY: OverallReadinessStatus = 'needs_review_before_manual_publishing';
const BLOCKED: OverallReadinessStatus = 'blocked';

describe('transitionAcceptance — graph', () => {
  it('allows valid forward transitions', () => {
    expect(transitionAcceptance('draft_preview', 'shared_for_review_mock').ok).toBe(true);
    expect(transitionAcceptance('shared_for_review_mock', 'client_feedback_open').ok).toBe(true);
    expect(transitionAcceptance('client_feedback_open', 'revision_needed').ok).toBe(true);
    expect(transitionAcceptance('revision_needed', 'shared_for_review_mock').ok).toBe(true);
    expect(transitionAcceptance('shared_for_review_mock', 'client_accepted').ok).toBe(true);
  });

  it('rejects transitions not in the graph and keeps the from-state', () => {
    const r = transitionAcceptance('draft_preview', 'client_accepted');
    expect(r.ok).toBe(false);
    expect(r.state).toBe('draft_preview');
    expect(r.blockedReason).toMatch(/not allowed/i);
  });

  it('nextAcceptanceStates mirrors the transition graph', () => {
    expect(nextAcceptanceStates('client_accepted')).toEqual(
      DELIVERY_ACCEPTANCE_TRANSITIONS.client_accepted,
    );
  });
});

describe('transitionAcceptance — owner-ready gate (Phase R checklist)', () => {
  it('blocks owner_ready_for_manual_publish when the checklist is NOT ready', () => {
    const r = transitionAcceptance('client_accepted', 'owner_ready_for_manual_publish', { publishingOverall: NOT_READY });
    expect(r.ok).toBe(false);
    expect(r.state).toBe('client_accepted');
    expect(r.blockedReason).toBe(DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST);
  });

  it('blocks owner_ready when the checklist is blocked', () => {
    expect(transitionAcceptance('client_accepted', 'owner_ready_for_manual_publish', { publishingOverall: BLOCKED }).ok).toBe(false);
  });

  it('blocks owner_ready when the checklist status is omitted (gate closed by default)', () => {
    expect(transitionAcceptance('client_accepted', 'owner_ready_for_manual_publish').ok).toBe(false);
  });

  it('allows owner_ready only from client_accepted AND when the checklist is ready', () => {
    const r = transitionAcceptance('client_accepted', 'owner_ready_for_manual_publish', { publishingOverall: READY });
    expect(r.ok).toBe(true);
    expect(r.state).toBe('owner_ready_for_manual_publish');
  });

  it('never allows owner_ready directly from a non-accepted state even if the checklist is ready', () => {
    // not in the graph at all from client_feedback_open
    expect(transitionAcceptance('client_feedback_open', 'owner_ready_for_manual_publish', { publishingOverall: READY }).ok).toBe(false);
  });

  it('isPublishingChecklistReady is true only for ready_for_manual_publishing', () => {
    expect(isPublishingChecklistReady(READY)).toBe(true);
    expect(isPublishingChecklistReady(NOT_READY)).toBe(false);
    expect(isPublishingChecklistReady(BLOCKED)).toBe(false);
    expect(isPublishingChecklistReady(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Approved/accepted ≠ Published — there is NO published/launched state
// ---------------------------------------------------------------------------

describe('Approved/accepted ≠ Published guardrail', () => {
  it('the acceptance model never contains a published or launched state', () => {
    const states = DELIVERY_ACCEPTANCE_STATES as string[];
    expect(states).not.toContain('published');
    expect(states).not.toContain('launched');
  });

  it('owner_ready_for_manual_publish is terminal — it never transitions to a published state', () => {
    for (const target of DELIVERY_ACCEPTANCE_TRANSITIONS.owner_ready_for_manual_publish) {
      expect(target).not.toBe('published');
      expect(target).not.toBe('launched');
    }
  });
});

// ---------------------------------------------------------------------------
// buildDeliveryAcceptanceRoom
// ---------------------------------------------------------------------------

function room(state: DeliveryAcceptanceState, overall: OverallReadinessStatus, feedback: DeliveryFeedbackEntry[] = []) {
  return buildDeliveryAcceptanceRoom({ state, feedback, publishingOverall: overall, now: NOW_DATE });
}

describe('buildDeliveryAcceptanceRoom', () => {
  it('always carries published:false, local-only badges, and the not-published message', () => {
    const r = room('client_accepted', READY);
    expect(r.published).toBe(false);
    expect(r.local_only_badges).toEqual(DELIVERY_ACCEPTANCE_LOCAL_ONLY_BADGES);
    expect(r.client_accepted_not_published_message).toBe(DELIVERY_ACCEPTANCE_NOT_PUBLISHED);
    expect(r.client_accepted_not_published_message).toMatch(/Client accepted ≠ Published/);
  });

  it('summarizes feedback counts and flags open revision requests', () => {
    const r = room('client_feedback_open', NOT_READY, sampleDeliveryFeedback(NOW_DATE));
    expect(r.feedback_summary.total).toBe(3);
    expect(r.feedback_summary.open_count).toBe(2);
    expect(r.feedback_summary.acknowledged_count).toBe(1);
    expect(r.feedback_summary.by_type.revision_request).toBe(1);
    expect(r.feedback_summary.has_open_revision_request).toBe(true);
    // newest-first ordering carried through
    expect(r.feedback[0].id).toBe('dfb-sample-3');
  });

  it('client_accepted + checklist ready ⇒ owner-ready transition allowed', () => {
    const r = room('client_accepted', READY);
    expect(r.publishing_checklist_ready).toBe(true);
    expect(r.can_mark_owner_ready_for_manual_publish).toBe(true);
    expect(r.owner_ready_blocked_reason).toBeNull();
  });

  it('client_accepted + checklist NOT ready ⇒ owner-ready blocked with a reason', () => {
    const r = room('client_accepted', NOT_READY);
    expect(r.publishing_checklist_ready).toBe(false);
    expect(r.can_mark_owner_ready_for_manual_publish).toBe(false);
    expect(r.owner_ready_blocked_reason).toBe(DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST);
  });

  it('owner-ready is never offered from a non-accepted state', () => {
    const r = room('shared_for_review_mock', READY);
    expect(r.can_mark_owner_ready_for_manual_publish).toBe(false);
    expect(r.owner_ready_blocked_reason).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// renderDeliveryAcceptanceText — no URL/link; carries the safety copy
// ---------------------------------------------------------------------------

describe('renderDeliveryAcceptanceText', () => {
  it('renders the safety copy and Not Published, and contains no URL / webhook / share link', () => {
    const text = renderDeliveryAcceptanceText(room('client_accepted', READY, sampleDeliveryFeedback(NOW_DATE)));
    expect(text).toContain('DELIVERY ACCEPTANCE (LOCAL MOCK)');
    expect(text).toContain(DELIVERY_ACCEPTANCE_NOT_PUBLISHED);
    expect(text).toMatch(/State: Client accepted \(Not Published\)/);
    expect(text).toContain('CLIENT FEEDBACK (mock)');
    const forbidden = [/https?:\/\//i, /www\./i, /\bwebhook\b/i, /share[_-]?url/i, /public[_-]?url/i, /access_token|client_secret|api_key/i];
    for (const re of forbidden) expect(text).not.toMatch(re);
  });

  it('only ever uses negated auto-post / publish wording (never affirmative)', () => {
    const text = renderDeliveryAcceptanceText(room('owner_ready_for_manual_publish', READY));
    expect(text).not.toMatch(/(?<!no |not |never )\bauto[-\s]?post/i);
    expect(text).not.toMatch(/\bpublish now\b/i);
    expect(text).not.toMatch(/\bauto[-\s]?publish\b/i);
  });
});

// ---------------------------------------------------------------------------
// sampleDeliveryFeedback — deterministic, sample author labels only
// ---------------------------------------------------------------------------

describe('sampleDeliveryFeedback', () => {
  it('is deterministic for a fixed base time and uses explicit sample author labels', () => {
    const a = sampleDeliveryFeedback(NOW_DATE);
    const b = sampleDeliveryFeedback(NOW_DATE);
    expect(a).toEqual(b);
    for (const e of a) expect(e.author_label).toMatch(/\(sample\)/);
  });
});
