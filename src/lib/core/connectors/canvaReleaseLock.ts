// Canva Sandbox Owner QA & Release Lock — SANDBOX MODE ONLY
// ---------------------------------------------------------------------------
// Phase I-S5 — Canva Sandbox Owner QA & Release Lock.
//
// This module makes ONE thing explicit and testable: the Canva connector is
// cleared for DEMO / INTERNAL release in SANDBOX mode ONLY, and is structurally
// LOCKED out of anything live. It adds NO real connector:
//   • no real Canva API / SDK / OAuth / token / env,
//   • no external Canva URL / webhook,
//   • no image/video generation,
//   • no publish / post / ads launch / schedule.
//
// It provides two things:
//   1. A machine-readable RELEASE LOCK contract whose outward-facing capability
//      flags are hard `false` literals — TypeScript itself forbids flipping the
//      sandbox into a live/publish-capable state through this contract.
//   2. An Owner QA checklist that an Owner reads before signing off the sandbox
//      for internal release. Every check derives from the existing sandbox
//      safety flags / handoff record (single-sourced — no drift).
//
// See CLAUDE.md §4 (Safety Principles), §6 (Output Status Model), §7 (Connector
// Roadmap — approval-gated, future). A real Canva connector remains future-only,
// behind the connector activation runbook + Owner sign-off.
// ---------------------------------------------------------------------------
import {
  CANVA_SANDBOX_SAFETY_FLAGS,
  type CanvaSandboxSafetyFlags,
} from './canvaSandboxConnector';
import {
  buildCanvaApprovalContract,
  buildCanvaSandboxHandoffRecord,
  type CanvaSandboxHandoffRecord,
} from './canvaApprovalContract';

// ---------------------------------------------------------------------------
// Machine-readable release lock contract.
// ---------------------------------------------------------------------------
// `releaseMode` is the single-literal lock value. Every outward-facing
// capability is a hard `false`/`true` literal, so the type system forbids ever
// representing this connector as live / publish-capable / env-requiring.
export interface CanvaSandboxReleaseLock {
  connector: 'canva';
  releaseMode: 'sandbox_locked';
  liveConnectorEnabled: false;
  publishEnabled: false;
  requiresEnv: false;
  oauthEnabled: false;
  externalUrlEnabled: false;
  webhookEnabled: false;
  approvalRequired: true;
  approvedDoesNotPublish: true;
}

export const CANVA_SANDBOX_RELEASE_LOCK: CanvaSandboxReleaseLock = {
  connector: 'canva',
  releaseMode: 'sandbox_locked',
  liveConnectorEnabled: false,
  publishEnabled: false,
  requiresEnv: false,
  oauthEnabled: false,
  externalUrlEnabled: false,
  webhookEnabled: false,
  approvalRequired: true,
  approvedDoesNotPublish: true,
};

// Canonical user-facing release-lock copy. Surfaced in the UI and pinned by
// tests so the lock label can never silently drift into a "live" claim.
export const CANVA_RELEASE_LOCK_COPY = {
  badge: 'Sandbox Release Locked',
  status: 'Internal QA Ready · Mock-only Canva Preview',
  approvedNotPublished: 'Approved ≠ Published',
  summary:
    'Canva is cleared for internal/demo release in sandbox mode only. Live ' +
    'connector, publishing, OAuth, env keys, external URL and webhooks are ' +
    'locked off. Approval authorises internal use only — never published.',
} as const;

// ---------------------------------------------------------------------------
// Owner QA checklist.
// ---------------------------------------------------------------------------
// Each check is a boolean assertion the Owner reads before signing off. The
// values derive from the sandbox safety flags / handoff record / release lock,
// so the checklist can never claim "pass" while the underlying flags say live.
export type CanvaQaCheckId =
  | 'sandbox_mock_only'
  | 'approval_preview_exists'
  | 'owner_can_review_preview'
  | 'approved_not_published'
  | 'no_publish_action'
  | 'no_live_env_api_oauth'
  | 'no_external_url_webhook'
  | 'release_locked_sandbox';

export interface CanvaQaCheck {
  id: CanvaQaCheckId;
  label: string;
  passed: boolean;
}

export interface CanvaOwnerQaReport {
  releaseMode: 'sandbox_locked';
  allPassed: boolean;
  checks: CanvaQaCheck[];
  lock: CanvaSandboxReleaseLock;
}

/**
 * Build the Owner QA report for the Canva sandbox. Pure & offline. Every check
 * is computed from the single-sourced sandbox safety flags / handoff record /
 * release lock — there is no separate "is it safe?" toggle that could disagree
 * with the actual sandbox behaviour.
 */
export function buildCanvaOwnerQaReport(): CanvaOwnerQaReport {
  const flags: CanvaSandboxSafetyFlags = CANVA_SANDBOX_SAFETY_FLAGS;
  const handoff: CanvaSandboxHandoffRecord = buildCanvaSandboxHandoffRecord(
    buildCanvaApprovalContract('needs_review'),
  );
  const lock = CANVA_SANDBOX_RELEASE_LOCK;

  const checks: CanvaQaCheck[] = [
    {
      id: 'sandbox_mock_only',
      label: 'Canva runs in sandbox/mock mode only',
      passed: handoff.mode === 'sandbox' && lock.releaseMode === 'sandbox_locked',
    },
    {
      id: 'approval_preview_exists',
      label: 'Approval preview exists for sandbox output',
      passed: handoff.approval_required === true && flags.approval_required === true,
    },
    {
      id: 'owner_can_review_preview',
      label: 'Owner can review preview output before any decision',
      passed: lock.approvalRequired === true && handoff.approval_status === 'needs_review',
    },
    {
      id: 'approved_not_published',
      label: 'Approved does NOT mean published (Approved ≠ Published)',
      passed: lock.approvedDoesNotPublish === true && handoff.publish_status === 'not_published',
    },
    {
      id: 'no_publish_action',
      label: 'No publish/post/ads/launch action exists',
      passed: lock.publishEnabled === false && handoff.publish_capability === false && flags.no_publish === true,
    },
    {
      id: 'no_live_env_api_oauth',
      label: 'No live Canva env/API/OAuth required',
      passed:
        lock.requiresEnv === false &&
        lock.oauthEnabled === false &&
        lock.liveConnectorEnabled === false &&
        handoff.requires_env === false &&
        flags.no_live_canva_api === true,
    },
    {
      id: 'no_external_url_webhook',
      label: 'No external Canva URL/webhook',
      passed: lock.externalUrlEnabled === false && lock.webhookEnabled === false && handoff.external_call === false,
    },
    {
      id: 'release_locked_sandbox',
      label: 'Release status locked as sandbox/internal-release only',
      passed: lock.releaseMode === 'sandbox_locked' && lock.liveConnectorEnabled === false,
    },
  ];

  return {
    releaseMode: 'sandbox_locked',
    allPassed: checks.every(c => c.passed),
    checks,
    lock,
  };
}
