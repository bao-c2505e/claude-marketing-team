import { describe, expect, it } from 'vitest';
import {
  deriveClosureStatus,
  buildDeliveryClosure,
  renderDeliveryClosureText,
  isClientAccepted,
  isClosed,
  hasSafeClosureReadiness,
  canMarkManualPublished,
  canCloseDelivery,
  appendClosureAudit,
  buildClosureAuditEntry,
  listClosureAudit,
  sampleClosureAudit,
  DELIVERY_CLOSURE_STATUSES,
  DELIVERY_CLOSURE_STATUS_LABEL,
  CLOSURE_CHECKLIST_KEYS,
  CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED,
  CLOSURE_PUBLISH_OUTSIDE_CORE,
  CLOSURE_LOCAL_ONLY_BADGES,
  type ClosureChecklistConfirms,
  type ClosureAuditEntry,
  type ClosureStatusInput,
} from './deliveryClosure';
import type { DeliveryFeedbackSummary } from './deliveryAcceptance';
import type { OverallReadinessStatus } from './manualPublishingChecklist';

const NOW = '2026-06-25T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

const READY: OverallReadinessStatus = 'ready_for_manual_publishing';
const NOT_READY: OverallReadinessStatus = 'needs_review_before_manual_publishing';
const PUB_BLOCKED: OverallReadinessStatus = 'blocked';

function summary(over: Partial<DeliveryFeedbackSummary> = {}): DeliveryFeedbackSummary {
  return {
    total: 0,
    open_count: 0,
    acknowledged_count: 0,
    resolved_count: 0,
    by_type: { general_comment: 0, revision_request: 0, approval_note: 0, publishing_question: 0 },
    has_open_revision_request: false,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

describe('deriveClosureStatus', () => {
  it('is not_accepted before the client accepts', () => {
    expect(deriveClosureStatus({
      acceptanceState: 'shared_for_review_mock',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe('not_accepted');
  });

  it('accepted + checklist ready + no unresolved feedback ⇒ ready_for_manual_publishing (still NOT published)', () => {
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe('ready_for_manual_publishing');
  });

  it('accepted but checklist NOT ready ⇒ client_accepted_not_published', () => {
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: NOT_READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe('client_accepted_not_published');
  });

  it('accepted + unresolved feedback (not carried) ⇒ client_accepted_not_published', () => {
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: READY,
      unresolvedFeedbackCount: 2,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe('client_accepted_not_published');
  });

  it('unresolved feedback can be explicitly carried forward to reach readiness', () => {
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: READY,
      unresolvedFeedbackCount: 2,
      feedbackCarriedForward: true,
      manualPublishMark: 'none',
    })).toBe('ready_for_manual_publishing');
  });

  it('manually_marked_published REQUIRES an explicit manual mark — never auto-derived', () => {
    // Everything ready, but no manual mark ⇒ still NOT published.
    expect(deriveClosureStatus({
      acceptanceState: 'owner_ready_for_manual_publish',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe('ready_for_manual_publishing');
    // Only the explicit mark flips it — and ONLY behind the safe-close gate.
    expect(deriveClosureStatus({
      acceptanceState: 'owner_ready_for_manual_publish',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'marked_published',
      closureGatesComplete: true,
    })).toBe('manually_marked_published');
  });

  it('closed_without_publishing requires the explicit closed mark AND the safe-close gate', () => {
    // Safe ⇒ honored.
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'closed_unpublished',
      closureGatesComplete: true,
    })).toBe('closed_without_publishing');
    // Unsafe (Phase R blocked + unresolved feedback) ⇒ the close mark is ignored.
    expect(deriveClosureStatus({
      acceptanceState: 'client_accepted',
      publishingOverall: PUB_BLOCKED,
      unresolvedFeedbackCount: 1,
      feedbackCarriedForward: false,
      manualPublishMark: 'closed_unpublished',
      closureGatesComplete: false,
    })).toBe('client_accepted_not_published');
  });

  it('the closure model never contains a Core-set published/launched status', () => {
    const labels = DELIVERY_CLOSURE_STATUSES as string[];
    expect(labels).not.toContain('published');
    expect(labels).not.toContain('launched');
    // The only "published" status is the explicit manual annotation.
    expect(DELIVERY_CLOSURE_STATUS_LABEL.manually_marked_published).toMatch(/Manually marked as published/);
  });

  it('isClientAccepted / isClosed helpers behave', () => {
    expect(isClientAccepted('client_accepted')).toBe(true);
    expect(isClientAccepted('owner_ready_for_manual_publish')).toBe(true);
    expect(isClientAccepted('shared_for_review_mock')).toBe(false);
    expect(isClosed('manually_marked_published')).toBe(true);
    expect(isClosed('closed_without_publishing')).toBe(true);
    expect(isClosed('ready_for_manual_publishing')).toBe(false);
    expect(isClosed('client_accepted_not_published')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Safe-close gate — an explicit manual mark must NEVER override the gates
// ---------------------------------------------------------------------------

/** A fully safe-to-close input; individual tests override one field to make it unsafe. */
function safeInput(over: Partial<ClosureStatusInput> = {}): ClosureStatusInput {
  return {
    acceptanceState: 'client_accepted',
    publishingOverall: READY,
    unresolvedFeedbackCount: 0,
    feedbackCarriedForward: false,
    manualPublishMark: 'none',
    closureGatesComplete: true,
    ...over,
  };
}

describe('deriveClosureStatus — safe-close gate (marks never bypass the gates)', () => {
  it('marked_published is IGNORED when acceptance is not client_accepted / owner_ready', () => {
    const r = deriveClosureStatus(safeInput({ acceptanceState: 'shared_for_review_mock', manualPublishMark: 'marked_published' }));
    expect(r).not.toBe('manually_marked_published');
    expect(r).toBe('not_accepted');
  });

  it('marked_published is IGNORED when unresolved feedback is not carried forward', () => {
    const r = deriveClosureStatus(safeInput({ unresolvedFeedbackCount: 2, feedbackCarriedForward: false, manualPublishMark: 'marked_published' }));
    expect(r).not.toBe('manually_marked_published');
    expect(r).toBe('client_accepted_not_published');
  });

  it('marked_published is IGNORED when Phase R / manual-publishing readiness is not ready', () => {
    expect(deriveClosureStatus(safeInput({ publishingOverall: NOT_READY, manualPublishMark: 'marked_published' }))).toBe('client_accepted_not_published');
    expect(deriveClosureStatus(safeInput({ publishingOverall: PUB_BLOCKED, manualPublishMark: 'marked_published' }))).toBe('client_accepted_not_published');
  });

  it('marked_published is IGNORED when required closure gates / owner assignment are incomplete', () => {
    const r = deriveClosureStatus(safeInput({ closureGatesComplete: false, manualPublishMark: 'marked_published' }));
    expect(r).not.toBe('manually_marked_published');
    expect(r).toBe('ready_for_manual_publishing'); // safe fall-through, still NOT published
  });

  it('closed_unpublished is IGNORED under the same unsafe conditions (no bypass either)', () => {
    expect(deriveClosureStatus(safeInput({ acceptanceState: 'shared_for_review_mock', manualPublishMark: 'closed_unpublished' }))).toBe('not_accepted');
    expect(deriveClosureStatus(safeInput({ unresolvedFeedbackCount: 1, manualPublishMark: 'closed_unpublished' }))).toBe('client_accepted_not_published');
    expect(deriveClosureStatus(safeInput({ publishingOverall: PUB_BLOCKED, manualPublishMark: 'closed_unpublished' }))).toBe('client_accepted_not_published');
    expect(deriveClosureStatus(safeInput({ closureGatesComplete: false, manualPublishMark: 'closed_unpublished' }))).toBe('ready_for_manual_publishing');
  });

  it('marked_published is HONORED only when ALL safe-close conditions are satisfied', () => {
    expect(deriveClosureStatus(safeInput({ manualPublishMark: 'marked_published' }))).toBe('manually_marked_published');
    expect(deriveClosureStatus(safeInput({ acceptanceState: 'owner_ready_for_manual_publish', manualPublishMark: 'marked_published' }))).toBe('manually_marked_published');
    // feedback carried forward also counts as clear
    expect(deriveClosureStatus(safeInput({ unresolvedFeedbackCount: 3, feedbackCarriedForward: true, manualPublishMark: 'marked_published' }))).toBe('manually_marked_published');
  });

  it('the guard predicates agree with the gate (and default closed when gates omitted)', () => {
    expect(hasSafeClosureReadiness(safeInput())).toBe(true);
    expect(canMarkManualPublished(safeInput())).toBe(true);
    expect(canCloseDelivery(safeInput())).toBe(true);
    // omitting closureGatesComplete defaults the gate closed
    expect(hasSafeClosureReadiness({
      acceptanceState: 'client_accepted',
      publishingOverall: READY,
      unresolvedFeedbackCount: 0,
      feedbackCarriedForward: false,
      manualPublishMark: 'none',
    })).toBe(false);
    // any single unsafe condition closes the gate
    expect(canMarkManualPublished(safeInput({ acceptanceState: 'revision_needed' }))).toBe(false);
    expect(canMarkManualPublished(safeInput({ publishingOverall: NOT_READY }))).toBe(false);
    expect(canMarkManualPublished(safeInput({ unresolvedFeedbackCount: 1 }))).toBe(false);
    expect(canCloseDelivery(safeInput({ closureGatesComplete: false }))).toBe(false);
  });
});

describe('buildDeliveryClosure — manual mark is gated end-to-end', () => {
  it('an explicit marked_published with an UNASSIGNED owner is not applied (gates incomplete)', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: '', // owner gate unsatisfied
      manualPublishMark: 'marked_published',
      now: NOW_DATE,
    });
    expect(v.closure_gates_complete).toBe(false);
    expect(v.safe_closure_ready).toBe(false);
    expect(v.manual_publish_mark_requested).toBe('marked_published');
    expect(v.manual_publish_mark_applied).toBe(false);
    expect(v.manual_publish_mark).toBe('none'); // effective mark not applied
    expect(v.status).not.toBe('manually_marked_published');
    expect(v.status).toBe('ready_for_manual_publishing');
    expect(v.core_published).toBe(false);
  });

  it('an explicit marked_published with Phase R NOT ready is not applied', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: NOT_READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      manualPublishMark: 'marked_published',
      now: NOW_DATE,
    });
    expect(v.manual_publish_mark_applied).toBe(false);
    expect(v.status).toBe('client_accepted_not_published');
  });

  it('marked_published IS applied once every gate (owner + Phase R + feedback + checklist) is satisfied', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'owner_ready_for_manual_publish',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      manualPublishMark: 'marked_published',
      now: NOW_DATE,
    });
    expect(v.safe_closure_ready).toBe(true);
    expect(v.manual_publish_mark_applied).toBe(true);
    expect(v.manual_publish_mark).toBe('marked_published');
    expect(v.status).toBe('manually_marked_published');
    expect(v.core_published).toBe(false); // Core itself still never publishes
  });
});

// ---------------------------------------------------------------------------
// Accepted ≠ Published is structurally distinct
// ---------------------------------------------------------------------------

describe('Client accepted ≠ Published guardrail', () => {
  it('client_accepted_not_published and ready_for_manual_publishing are BOTH non-published and distinct from any mark', () => {
    const accepted = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: NOT_READY,
      now: NOW_DATE,
    });
    expect(accepted.status).toBe('client_accepted_not_published');
    expect(accepted.core_published).toBe(false);
    expect(accepted.client_accepted).toBe(true);

    const ready = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      now: NOW_DATE,
    });
    expect(ready.status).toBe('ready_for_manual_publishing');
    expect(ready.core_published).toBe(false);
    // Distinct statuses for the same accepted client.
    expect(ready.status).not.toBe(accepted.status);
  });

  it('always exposes the verbatim "Client accepted ≠ Published" + "outside CORE" labels', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      now: NOW_DATE,
    });
    expect(v.client_accepted_not_published_message).toBe(CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED);
    expect(v.publish_outside_core_message).toBe(CLOSURE_PUBLISH_OUTSIDE_CORE);
    expect(v.client_accepted_not_published_message).toMatch(/Client accepted ≠ Published/);
    expect(v.publish_outside_core_message).toMatch(/manually outside CORE/);
    expect(v.local_only_badges).toEqual(CLOSURE_LOCAL_ONLY_BADGES);
    expect(v.core_published).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unresolved feedback warns/blocks closure readiness
// ---------------------------------------------------------------------------

describe('unresolved feedback warning', () => {
  it('warns when there is unresolved feedback not carried forward, and blocks ready_to_close', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary({ total: 2, open_count: 1, acknowledged_count: 1, has_open_revision_request: true }),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      now: NOW_DATE,
    });
    expect(v.unresolved_feedback_count).toBe(2);
    expect(v.unresolved_feedback_warning).toMatch(/still unresolved/i);
    expect(v.ready_to_close).toBe(false);
    expect(v.status).toBe('client_accepted_not_published');
  });

  it('clears the warning and allows ready_to_close once feedback is carried forward', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary({ total: 2, open_count: 2 }),
      publishingOverall: READY,
      feedbackCarriedForward: true,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      now: NOW_DATE,
    });
    expect(v.unresolved_feedback_warning).toBeNull();
    expect(v.ready_to_close).toBe(true);
    expect(v.status).toBe('ready_for_manual_publishing');
  });
});

// ---------------------------------------------------------------------------
// Closure checklist derivation
// ---------------------------------------------------------------------------

function allConfirmed(): ClosureChecklistConfirms {
  const c: ClosureChecklistConfirms = {};
  for (const k of CLOSURE_CHECKLIST_KEYS) c[k] = true;
  return c;
}

describe('closure checklist', () => {
  it('lists exactly the six required manual gates', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      now: NOW_DATE,
    });
    expect(v.checklist.map(i => i.key)).toEqual([
      'client_acceptance_reviewed',
      'final_pack_reviewed',
      'feedback_resolved_or_carried',
      'manual_publishing_checklist_reviewed',
      'external_publishing_owner_assigned',
      'external_publishing_status_marked',
    ]);
  });

  it('owner-assigned gate is unsatisfied without a named owner even if confirmed', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      now: NOW_DATE,
    });
    const owner = v.checklist.find(i => i.key === 'external_publishing_owner_assigned')!;
    expect(owner.confirmed).toBe(true);
    expect(owner.satisfied).toBe(false); // no owner label
    expect(owner.advisory).toMatch(/No external publishing owner/i);
  });

  it('status-marked gate needs an explicit manual mark, not just a checkbox', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      manualPublishMark: 'none',
      now: NOW_DATE,
    });
    const marked = v.checklist.find(i => i.key === 'external_publishing_status_marked')!;
    expect(marked.satisfied).toBe(false);
    expect(v.checklist_complete).toBe(false);
  });

  it('checklist_complete only when every gate is satisfied (owner named + mark set)', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'owner_ready_for_manual_publish',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      externalPublishingOwner: 'Owner (sample)',
      manualPublishMark: 'marked_published',
      now: NOW_DATE,
    });
    expect(v.checklist_complete).toBe(true);
    expect(v.status).toBe('manually_marked_published');
    expect(v.core_published).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

describe('closure audit trail', () => {
  it('appends entries purely (new array) and flags every entry local/mock', () => {
    const before: ClosureAuditEntry[] = [];
    const after = appendClosureAudit(before, 'client_acceptance_recorded', { id: 'a1', now: NOW });
    expect(before).toHaveLength(0);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: 'a1', type: 'client_acceptance_recorded', local_mock: true, at: NOW });
    expect(after[0].label).toMatch(/Client acceptance recorded/);
  });

  it('builds a labeled entry and orders newest-first', () => {
    const e1 = buildClosureAuditEntry('closure_checklist_reviewed', { id: 'a', now: '2026-06-25T09:00:00.000Z' });
    const e2 = buildClosureAuditEntry('manually_marked_published', { id: 'b', now: '2026-06-25T10:00:00.000Z' });
    expect(listClosureAudit([e1, e2]).map(e => e.id)).toEqual(['b', 'a']);
    expect(e1.local_mock).toBe(true);
    expect(e2.local_mock).toBe(true);
  });

  it('sample audit is deterministic and entirely local/mock', () => {
    const a = sampleClosureAudit(NOW_DATE);
    const b = sampleClosureAudit(NOW_DATE);
    expect(a).toEqual(b);
    for (const e of a) expect(e.local_mock).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Plain-text render — safety copy present, no URL / connector / auto wording
// ---------------------------------------------------------------------------

describe('renderDeliveryClosureText', () => {
  it('carries the safety copy and "Not published by CORE", and contains no URL / webhook / token', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary({ total: 1, open_count: 1, has_open_revision_request: true }),
      publishingOverall: NOT_READY,
      closureNotes: 'Wrap up next week. (sample)',
      now: NOW_DATE,
    });
    const text = renderDeliveryClosureText(v, sampleClosureAudit(NOW_DATE), 'Test Campaign');
    expect(text).toContain('DELIVERY CLOSURE (LOCAL/DEMO)');
    expect(text).toContain(CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED);
    expect(text).toContain(CLOSURE_PUBLISH_OUTSIDE_CORE);
    expect(text).toMatch(/Closure status: .* \(Not published by CORE\)/);
    expect(text).toContain('AUDIT TRAIL (local/mock/demo)');
    expect(text).toContain('CLOSURE NOTES');

    const forbidden = [/https?:\/\//i, /www\./i, /\bwebhook\b/i, /share[_-]?url/i, /public[_-]?url/i, /access_token|client_secret|api_key/i, /mailto:/i];
    for (const re of forbidden) expect(text).not.toMatch(re);
  });

  it('uses only negated auto-post / auto-ads wording (never affirmative), and never claims Core published', () => {
    // Fully safe-to-close so the mark is actually APPLIED (status manually_marked_published).
    const v = buildDeliveryClosure({
      acceptanceState: 'owner_ready_for_manual_publish',
      feedbackSummary: summary(),
      publishingOverall: READY,
      checklistConfirms: allConfirmed(),
      manualPublishMark: 'marked_published',
      externalPublishingOwner: 'Owner (sample)',
      now: NOW_DATE,
    });
    expect(v.status).toBe('manually_marked_published');
    const text = renderDeliveryClosureText(v);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?post/i);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?publish/i);
    expect(text).not.toMatch(/(?<!no |not |never )auto[-\s]?launch/i);
    expect(text).not.toMatch(/\bpublish now\b/i);
    // Even when "manually marked published", the text says publishing is outside CORE.
    expect(text).toContain(CLOSURE_PUBLISH_OUTSIDE_CORE);
  });

  it('carries no off-domain contamination', () => {
    const v = buildDeliveryClosure({
      acceptanceState: 'client_accepted',
      feedbackSummary: summary(),
      publishingOverall: READY,
      now: NOW_DATE,
    });
    const text = renderDeliveryClosureText(v);
    expect(text).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
