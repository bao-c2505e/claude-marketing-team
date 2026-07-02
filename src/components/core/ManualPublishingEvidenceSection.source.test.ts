import { describe, expect, it } from 'vitest';
// Static source scan (?raw) + pure unit tests — no DOM test runner in this project.
// T4-11-B: this section now renders <CoreV1FlowPanel> co-located with the ONE shared
// evidence state, so the panel's 9-stage projection reads REAL receipts instead of
// hardcoded defaults, while CampaignWorkspace stays stateless (Phase K invariant).
import SOURCE from './ManualPublishingEvidenceSection.tsx?raw';
import {
  deriveHasManualPublishingEvidence,
  deriveHasReviewedResult,
} from './ManualPublishingEvidenceSection';
import { createEvidence, type EvidenceInput } from '../../lib/core/manualPublishingEvidence';

const NOW = '2026-07-02T10:00:00.000Z';

function ev(over: Partial<EvidenceInput> = {}, id = 'mpe-1') {
  return createEvidence({ campaignId: 'c1', ...over }, { id, now: NOW });
}

describe('ManualPublishingEvidenceSection — CORE V1 flow co-location (T4-11-B source guard)', () => {
  it('imports and renders CoreV1FlowPanel inside the section', () => {
    expect(SOURCE).toMatch(/import\s+CoreV1FlowPanel\s+from\s+'\.\/CoreV1FlowPanel'/);
    expect(SOURCE).toMatch(/<CoreV1FlowPanel/);
  });

  it('derives receipts from the ONE shared evidence state and passes them to the panel', () => {
    expect(SOURCE).toMatch(/evidence\.length > 0/);
    expect(SOURCE).toMatch(/buildManualResultReview/);
    expect(SOURCE).toMatch(/hasManualPublishingEvidence=\{hasManualPublishingEvidence\}/);
    expect(SOURCE).toMatch(/hasReviewedResult=\{hasReviewedResult\}/);
  });

  it('introduces no network / emit / send capability', () => {
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|OAuth|webhook|\bemit\b|send command|gửi lệnh/i);
  });

  it('never flips a publish/spend permission on', () => {
    expect(SOURCE).not.toMatch(/allow_publish:\s*true|allow_spend:\s*true/i);
    expect(SOURCE).not.toMatch(/publishesContent:\s*true|launchesAds:\s*true|spends:\s*true/);
  });
});

describe('receipt derives (pure, from the shared evidence list)', () => {
  it('deriveHasManualPublishingEvidence — false on empty, true once one entry exists', () => {
    expect(deriveHasManualPublishingEvidence([])).toBe(false);
    expect(deriveHasManualPublishingEvidence([ev({ publishStatus: 'not_published' })])).toBe(true);
  });

  it('deriveHasReviewedResult — false for empty / unpublished / metrics-pending evidence', () => {
    expect(deriveHasReviewedResult([])).toBe(false);
    expect(deriveHasReviewedResult([ev({ publishStatus: 'not_published', channel: 'Facebook Page' })])).toBe(false);
    // Published but no real metrics yet → evidence logged, result still pending.
    expect(deriveHasReviewedResult([
      ev({ publishStatus: 'manually_published', channel: 'Facebook Page', publishedBy: 'Owner (sample)', evidenceNote: 'Screenshot (sample).' }),
    ])).toBe(false);
  });

  it('deriveHasReviewedResult — true once a published entry carries real provided metrics', () => {
    expect(deriveHasReviewedResult([
      ev({
        publishStatus: 'manually_published',
        channel: 'Facebook Page',
        publishedBy: 'Owner (sample)',
        evidenceNote: 'Screenshot saved (sample).',
        publicUrl: 'fb.example/p/sample',
        resultDataSource: 'owner_provided',
        metrics: { reach: 4200, engagement: 310, messages: 18, orders: 7 },
      }),
    ])).toBe(true);
  });
});
