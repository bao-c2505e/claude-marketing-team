import { describe, expect, it } from 'vitest';
import {
  deriveLatestDecision,
  isAwaitingRevision,
  summarizeDecisions,
  DECISION_ACTIONS,
  REVISION_LOOP_COPY,
} from './approvalDecision';
import type { ContentApprovalEvent, ApprovalActionType } from '../../types/core';

let seq = 0;
function ev(action: ApprovalActionType, opts: Partial<ContentApprovalEvent> = {}): ContentApprovalEvent {
  seq += 1;
  return {
    id: `aev-${seq}`,
    approval_request_id: 'req-1',
    content_item_id: 'item-1',
    action,
    actor_label: opts.actor_label ?? 'owner',
    comment: opts.comment ?? null,
    previous_status: opts.previous_status ?? null,
    new_status: opts.new_status ?? null,
    created_at: opts.created_at ?? `2026-06-24T00:00:0${seq}.000Z`,
  };
}

describe('approvalDecision — revision loop & audit helpers (Phase P)', () => {
  it('returns null when there is no decision yet', () => {
    expect(deriveLatestDecision([])).toBeNull();
    // submitted / commented are history but not reviewer decisions.
    expect(deriveLatestDecision([ev('submitted'), ev('commented')])).toBeNull();
  });

  it('surfaces the latest decision with its feedback note (request changes)', () => {
    const events = [
      ev('submitted', { created_at: '2026-06-24T00:00:01.000Z' }),
      ev('revision_requested', {
        created_at: '2026-06-24T00:00:05.000Z',
        new_status: 'revision_requested',
        comment: 'Đổi hook ngày 1 cho tự nhiên hơn, bỏ emoji.',
        actor_label: 'owner',
      }),
    ];
    const latest = deriveLatestDecision(events);
    expect(latest?.action).toBe('revision_requested');
    expect(latest?.status).toBe('revision_requested');
    expect(latest?.comment).toBe('Đổi hook ngày 1 cho tự nhiên hơn, bỏ emoji.');
    expect(latest?.actorLabel).toBe('owner');
  });

  it('picks the most recent decision even when events are unsorted', () => {
    const events = [
      ev('revision_requested', { created_at: '2026-06-24T00:00:05.000Z', new_status: 'revision_requested', comment: 'first pass' }),
      ev('approved', { created_at: '2026-06-24T00:00:09.000Z', new_status: 'approved', comment: 'looks good now' }),
      ev('commented', { created_at: '2026-06-24T00:00:11.000Z', comment: 'note only' }),
    ];
    const latest = deriveLatestDecision(events);
    expect(latest?.action).toBe('approved');
    expect(latest?.comment).toBe('looks good now');
  });

  it('detects the rejected decision', () => {
    const latest = deriveLatestDecision([ev('rejected', { new_status: 'rejected', comment: 'off-brand' })]);
    expect(latest?.action).toBe('rejected');
    expect(latest?.status).toBe('rejected');
  });

  it('flags the revision loop (awaiting revised output) by status', () => {
    expect(isAwaitingRevision('revision_requested')).toBe(true);
    expect(isAwaitingRevision('approved')).toBe(false);
    expect(isAwaitingRevision('rejected')).toBe(false);
    expect(isAwaitingRevision('submitted')).toBe(false);
  });

  it('summarizes decisions for a compact audit count', () => {
    const counts = summarizeDecisions([
      ev('submitted'), ev('revision_requested'), ev('commented'), ev('approved'),
    ]);
    expect(counts.submitted).toBe(1);
    expect(counts.revision_requested).toBe(1);
    expect(counts.approved).toBe(1);
    expect(counts.commented).toBe(1);
    expect(counts.rejected).toBe(0);
  });

  it('only treats approve/reject/revision/cancel as decisions', () => {
    expect(DECISION_ACTIONS).toEqual(['approved', 'rejected', 'revision_requested', 'cancelled']);
  });

  it('keeps revision-loop copy approval-first and non-destructive', () => {
    expect(REVISION_LOOP_COPY.preservedDraft).toMatch(/never deletes/i);
    expect(REVISION_LOOP_COPY.preservedSnapshot).toMatch(/Brand Context Snapshot/);
    expect(REVISION_LOOP_COPY.awaiting).toMatch(/does not auto-regenerate/i);
    expect(REVISION_LOOP_COPY.noPublish).toMatch(/Approved ≠ Published/);
    expect(REVISION_LOOP_COPY.noPublish).toMatch(/Nothing is published/i);
  });
});
