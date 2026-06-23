import { describe, expect, it } from 'vitest';
import {
  buildCanvaApprovalContract,
  applyCanvaApprovalDecision,
  isCanvaInternallyApproved,
  canvaStatusToItemStatus,
  itemStatusToCanvaStatus,
  buildCanvaSandboxHandoffRecord,
  buildCanvaApprovalHistory,
  CANVA_APPROVAL_STATUSES,
  CANVA_APPROVAL_STATUS_LABEL,
  CANVA_CONTRACT_COPY,
  CANVA_CONTRACT_SAFETY_FLAGS,
} from './canvaApprovalContract';

// Any label/value that would imply an external-world / published / live state.
const publishedOrLive = /(publish|published|publishing|live|launch|launched|posted|scheduled|went live)/i;

describe('canvaApprovalContract', () => {
  it('builds a sandbox contract with the fixed safety axes', () => {
    const c = buildCanvaApprovalContract();
    expect(c.connector).toBe('canva');
    expect(c.mode).toBe('sandbox');
    expect(c.preview_status).toBe('sandbox_preview_only');
    expect(c.approval_status).toBe('sandbox_created');
    expect(c.publish_status).toBe('not_published');
    expect(c.real_connector_action).toBe('none');
    expect(c.safety_flags).toMatchObject({
      no_live_canva_api: true,
      no_publish: true,
      approval_required: true,
    });
  });

  it('only enumerates internal approval statuses (no published/live state exists)', () => {
    expect(CANVA_APPROVAL_STATUSES).toEqual([
      'sandbox_created', 'needs_review', 'submitted', 'approved', 'rejected',
    ]);
    expect(CANVA_APPROVAL_STATUSES.some(s => publishedOrLive.test(s))).toBe(false);
  });

  it('approve does NOT change publish_status (stays not_published)', () => {
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract('submitted'), 'approve');
    expect(c.approval_status).toBe('approved');
    expect(c.publish_status).toBe('not_published');
  });

  it('approve does NOT set a real_connector_action (stays none)', () => {
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract('submitted'), 'approve');
    expect(c.real_connector_action).toBe('none');
    expect(isCanvaInternallyApproved(c)).toBe(true);
  });

  it('approve means INTERNAL approval only — never implies published/live', () => {
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract(), 'approve');
    // approved status maps to the internal `approved` item status, not published.
    expect(canvaStatusToItemStatus(c.approval_status)).toBe('approved');
    expect(canvaStatusToItemStatus(c.approval_status)).not.toBe('published');
    expect(c.mode).toBe('sandbox');
    expect(c.preview_status).toBe('sandbox_preview_only');
  });

  it('rejected stays internal only — no publish, no real action', () => {
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract('submitted'), 'reject');
    expect(c.approval_status).toBe('rejected');
    expect(c.publish_status).toBe('not_published');
    expect(c.real_connector_action).toBe('none');
    expect(c.mode).toBe('sandbox');
    expect(canvaStatusToItemStatus(c.approval_status)).toBe('rejected');
  });

  it('submit keeps the item at the sandbox ceiling (never auto-approved)', () => {
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract(), 'submit');
    expect(c.approval_status).toBe('submitted');
    expect(c.publish_status).toBe('not_published');
    expect(c.real_connector_action).toBe('none');
    // submitted is not yet approved.
    expect(isCanvaInternallyApproved(c)).toBe(false);
  });

  it('NO decision can flip the immutable safety axes', () => {
    for (const decision of ['submit', 'approve', 'reject'] as const) {
      const c = applyCanvaApprovalDecision(buildCanvaApprovalContract(), decision);
      expect(c.publish_status).toBe('not_published');
      expect(c.real_connector_action).toBe('none');
      expect(c.mode).toBe('sandbox');
      expect(c.preview_status).toBe('sandbox_preview_only');
      expect(c.safety_flags).toMatchObject(CANVA_CONTRACT_SAFETY_FLAGS);
    }
  });

  it('status labels never include published/live wording', () => {
    for (const label of Object.values(CANVA_APPROVAL_STATUS_LABEL)) {
      expect(publishedOrLive.test(label)).toBe(false);
    }
  });

  it('contract copy surfaces internal-approval-only and never claims publish', () => {
    expect(CANVA_CONTRACT_COPY.internalApprovalOnly).toBe('Internal approval only');
    expect(CANVA_CONTRACT_COPY.title).toBe('Canva Sandbox Preview');
    expect(CANVA_CONTRACT_COPY.noDesign).toBe('No Canva design was created');
    expect(CANVA_CONTRACT_COPY.noPublish).toBe('Nothing was published');
  });

  it('maps external-world item statuses back to a safe (non-published) Canva status', () => {
    // A sandbox item should never be in these states, but if seen, fail safe.
    expect(itemStatusToCanvaStatus('published')).toBe('needs_review');
    expect(itemStatusToCanvaStatus('scheduled')).toBe('needs_review');
    expect(itemStatusToCanvaStatus('approved')).toBe('approved');
    expect(itemStatusToCanvaStatus('rejected')).toBe('rejected');
    expect(itemStatusToCanvaStatus('needs_review')).toBe('needs_review');
  });

  it('sandbox mode does not require env vars to build/transition a contract', () => {
    expect(import.meta.env.CANVA_API_KEY).toBeUndefined();
    expect(import.meta.env.VITE_CANVA_API_KEY).toBeUndefined();
    expect(import.meta.env.CANVA_CLIENT_ID).toBeUndefined();
    expect(import.meta.env.CANVA_CLIENT_SECRET).toBeUndefined();
    const c = applyCanvaApprovalDecision(buildCanvaApprovalContract(), 'approve');
    expect(c.approval_status).toBe('approved');
    expect(c.publish_status).toBe('not_published');
  });

  describe('handoff record', () => {
    it('exposes the fixed sandbox capability flags (no external call, no env, no publish)', () => {
      const r = buildCanvaSandboxHandoffRecord(buildCanvaApprovalContract('needs_review'));
      expect(r.provider).toBe('canva');
      expect(r.mode).toBe('sandbox');
      expect(r.external_call).toBe(false);
      expect(r.requires_env).toBe(false);
      expect(r.publish_capability).toBe(false);
      expect(r.approval_required).toBe(true);
      expect(r.approval_status).toBe('needs_review');
      expect(r.publish_status).toBe('not_published');
    });

    it('keeps the capability flags fixed across EVERY approval decision (incl. approve)', () => {
      for (const decision of ['submit', 'approve', 'reject'] as const) {
        const c = applyCanvaApprovalDecision(buildCanvaApprovalContract(), decision);
        const r = buildCanvaSandboxHandoffRecord(c);
        // Approved ≠ Published: approval never grants a publish capability.
        expect(r.external_call).toBe(false);
        expect(r.requires_env).toBe(false);
        expect(r.publish_capability).toBe(false);
        expect(r.approval_required).toBe(true);
        expect(r.publish_status).toBe('not_published');
      }
    });
  });

  describe('approval history', () => {
    it('always preserves the draft → preview → submit → decision lifecycle (no published step)', () => {
      const steps = buildCanvaApprovalHistory('submitted').map(e => e.step);
      expect(steps).toEqual([
        'generated_draft', 'sandbox_preview_created', 'submitted_for_approval', 'approved',
      ]);
      // No history step ever AFFIRMS a published/launched/live state (the
      // approved label legitimately negates it with "not published").
      const affirmsLive = /(was published|is published|published live|is now live|went live|launched|posted live)/i;
      for (const status of CANVA_APPROVAL_STATUSES) {
        for (const entry of buildCanvaApprovalHistory(status)) {
          expect(affirmsLive.test(entry.label)).toBe(false);
        }
      }
    });

    it('marks submit/approve/reject as reached and reflects an internal Approved (not published)', () => {
      const approved = buildCanvaApprovalHistory('approved');
      const submit = approved.find(e => e.step === 'submitted_for_approval');
      const decision = approved.find(e => e.step === 'approved');
      expect(submit?.reached).toBe(true);
      expect(decision?.reached).toBe(true);
      expect(decision?.label).toMatch(/internal/i);
      expect(decision?.label).toMatch(/not published/i);
    });

    it('shows a Rejected (internal) terminal step when rejected', () => {
      const rejected = buildCanvaApprovalHistory('rejected');
      const terminal = rejected[rejected.length - 1];
      expect(terminal.step).toBe('rejected');
      expect(terminal.reached).toBe(true);
      expect(terminal.label).toMatch(/internal/i);
    });

    it('keeps later steps un-reached for a freshly created sandbox preview', () => {
      const created = buildCanvaApprovalHistory('sandbox_created');
      expect(created.find(e => e.step === 'generated_draft')?.reached).toBe(true);
      expect(created.find(e => e.step === 'sandbox_preview_created')?.reached).toBe(true);
      expect(created.find(e => e.step === 'submitted_for_approval')?.reached).toBe(false);
      expect(created.find(e => e.step === 'approved')?.reached).toBe(false);
    });
  });
});
