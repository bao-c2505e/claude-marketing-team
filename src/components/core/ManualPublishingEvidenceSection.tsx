// Manual Publishing Evidence + Result Review Section — Phase V + Phase W glue
// ---------------------------------------------------------------------------
// A tiny stateful container that owns ONE shared, local/demo source of truth for the
// Owner-provided manual publishing evidence/result, and renders the two sibling panels
// against it:
//
//   • <ManualPublishingEvidencePanel> (Phase V) — the Owner records/edits evidence
//     (controlled via `evidence` + `onChange`).
//   • <ManualResultReviewPanel> (Phase W) — REVIEWS that SAME evidence (read-only),
//     so the review always reflects the actual Owner-provided state, never a private copy.
//
// Why this wrapper exists: the parent CampaignWorkspace is intentionally STATELESS
// (enforced by its Phase K source-scan test — no useState/useReducer), so the lifted
// shared state lives here instead. The default state is an EMPTY list: nothing is
// presented as published or reviewed until the Owner actually records manual evidence
// (so the review correctly shows `no_manual_evidence` / "cannot review" by default).
//
// Pure presentational + local React state only — no persistence, no network, no
// connector. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status), §7 (Connectors).
// ---------------------------------------------------------------------------
import { useState } from 'react';
import type { Campaign, RoleName } from '../../types/core';
import type { ManualPublishingEvidence } from '../../lib/core/manualPublishingEvidence';
import ManualPublishingEvidencePanel from './ManualPublishingEvidencePanel';
import ManualResultReviewPanel from './ManualResultReviewPanel';

interface Props {
  campaign: Campaign;
  userRole: RoleName | null;
  actorLabel: string;
}

export default function ManualPublishingEvidenceSection({ campaign, userRole, actorLabel }: Props) {
  // Single source of truth for Owner-provided manual publishing evidence/result.
  // Default EMPTY — no sample is auto-loaded, so nothing implies a published/reviewed post.
  const [evidence, setEvidence] = useState<ManualPublishingEvidence[]>(() => []);

  return (
    <>
      <ManualPublishingEvidencePanel
        campaign={campaign}
        userRole={userRole}
        actorLabel={actorLabel}
        evidence={evidence}
        onChange={setEvidence}
      />
      <ManualResultReviewPanel
        campaign={campaign}
        userRole={userRole}
        actorLabel={actorLabel}
        evidence={evidence}
      />
    </>
  );
}
