import { describe, expect, it } from 'vitest';
import {
  CANVA_SANDBOX_RELEASE_LOCK,
  CANVA_RELEASE_LOCK_COPY,
  buildCanvaOwnerQaReport,
  type CanvaQaCheckId,
} from './canvaReleaseLock';

// Any copy that would falsely affirm a live/published/launched Canva state.
const unsafeLiveCopy =
  /(live connector enabled|now live|went live|successfully published|has been published|ads? (launched|are live)|oauth (connected|enabled)|api key required)/i;

describe('canvaReleaseLock', () => {
  it('locks every outward-facing capability to false / sandbox', () => {
    const lock = CANVA_SANDBOX_RELEASE_LOCK;
    expect(lock.connector).toBe('canva');
    expect(lock.releaseMode).toBe('sandbox_locked');
    expect(lock.liveConnectorEnabled).toBe(false);
    expect(lock.publishEnabled).toBe(false);
    expect(lock.requiresEnv).toBe(false);
    expect(lock.oauthEnabled).toBe(false);
    expect(lock.externalUrlEnabled).toBe(false);
    expect(lock.webhookEnabled).toBe(false);
    expect(lock.approvalRequired).toBe(true);
    expect(lock.approvedDoesNotPublish).toBe(true);
  });

  it('builds an Owner QA report where every safety check passes', () => {
    const report = buildCanvaOwnerQaReport();
    expect(report.releaseMode).toBe('sandbox_locked');
    expect(report.allPassed).toBe(true);
    expect(report.checks.every(c => c.passed)).toBe(true);
  });

  it('covers all required QA dimensions', () => {
    const report = buildCanvaOwnerQaReport();
    const ids = report.checks.map(c => c.id).sort();
    const expected: CanvaQaCheckId[] = [
      'approval_preview_exists',
      'approved_not_published',
      'no_external_url_webhook',
      'no_live_env_api_oauth',
      'no_publish_action',
      'owner_can_review_preview',
      'release_locked_sandbox',
      'sandbox_mock_only',
    ];
    expect(ids).toEqual(expected.sort());
  });

  it('requires no env keys and exposes no live connector state', () => {
    const report = buildCanvaOwnerQaReport();
    expect(report.lock.requiresEnv).toBe(false);
    expect(report.lock.liveConnectorEnabled).toBe(false);
    expect(report.lock.publishEnabled).toBe(false);
    // The QA check that asserts no live env/API/OAuth must pass.
    const envCheck = report.checks.find(c => c.id === 'no_live_env_api_oauth');
    expect(envCheck?.passed).toBe(true);
  });

  it('keeps Approved ≠ Published explicit and structural', () => {
    const report = buildCanvaOwnerQaReport();
    expect(report.lock.approvedDoesNotPublish).toBe(true);
    expect(CANVA_RELEASE_LOCK_COPY.approvedNotPublished).toBe('Approved ≠ Published');
    const approvedCheck = report.checks.find(c => c.id === 'approved_not_published');
    expect(approvedCheck?.passed).toBe(true);
  });

  it('release-lock copy never affirms a live/published state', () => {
    const blob = JSON.stringify(CANVA_RELEASE_LOCK_COPY) + JSON.stringify(buildCanvaOwnerQaReport());
    expect(unsafeLiveCopy.test(blob)).toBe(false);
    // Badge labels the release as sandbox-locked, not live.
    expect(CANVA_RELEASE_LOCK_COPY.badge).toBe('Sandbox Release Locked');
  });

  it('introduces no external URL / API endpoint / OAuth / token / env references', () => {
    const blob = JSON.stringify(CANVA_SANDBOX_RELEASE_LOCK) + JSON.stringify(buildCanvaOwnerQaReport()) + JSON.stringify(CANVA_RELEASE_LOCK_COPY);
    // No live URL/endpoint and no secret/env key names appear anywhere.
    expect(blob).not.toMatch(/https?:\/\//i);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    // Webhook + external URL are named only to LOCK them off (set to false).
    expect(CANVA_SANDBOX_RELEASE_LOCK.webhookEnabled).toBe(false);
    expect(CANVA_SANDBOX_RELEASE_LOCK.externalUrlEnabled).toBe(false);
  });
});
