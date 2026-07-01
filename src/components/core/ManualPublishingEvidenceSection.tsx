// Manual Publishing Evidence + Result Review Section — Phase V/W/X/Y/Z glue
// ---------------------------------------------------------------------------
// A tiny stateful container that owns ONE shared, local/demo source of truth for the
// Owner-provided manual publishing evidence/result, and renders the sibling panels
// against it:
//
//   • <ManualPublishingEvidencePanel> (Phase V) — the Owner records/edits evidence
//     (controlled via `evidence` + `onChange`).
//   • <ManualResultReviewPanel> (Phase W) — REVIEWS that SAME evidence (read-only),
//     so the review always reflects the actual Owner-provided state, never a private copy.
//   • <BrandBrainLearningReviewPanel> (Phase X) — Owner-only ACCEPT/REJECT of the Phase W
//     learning candidates (derived from the SAME evidence) into a PREPARED Brand Brain
//     update proposal. Never writes to / auto-updates the Brand Brain source of truth.
//     It mirrors its review list up (`onReviewsChange`) so Phase Y can read the ACCEPTED ones.
//   • <BrandBrainUpdateProposalPanel> (Phase Y) — turns the Owner-ACCEPTED Phase X
//     candidates into an explicit Brand Brain UPDATE PROPOSAL with a before/after diff and
//     a SEPARATE Owner merge-approval gate. Accepted learning does NOT auto-update Brand
//     Brain; approval only marks the proposal ready for a separate, manual apply step. It
//     mirrors the current proposal up (`onProposalChange`) so Phase Z can act on it.
//   • <BrandBrainManualApplyPanel> (Phase Z) — the SEPARATE, explicit Owner MANUAL APPLY
//     room. Only an Owner-APPROVED proposal can be applied; applying APPENDS a new
//     versioned Brand Brain snapshot (preserving every previous version) with a full audit
//     trail. Approval alone never auto-applies — Brand Brain changes are not active until
//     the Owner explicitly applies them.
//
// Why this wrapper exists: the parent CampaignWorkspace is intentionally STATELESS
// (enforced by its Phase K source-scan test — no useState/useReducer), so the lifted
// shared state lives here instead. The default evidence state is an EMPTY list: nothing is
// presented as published or reviewed until the Owner actually records manual evidence
// (so the review correctly shows `no_manual_evidence` / "cannot review" by default).
//
// Pure presentational + local React state only — no persistence, no network, no
// connector. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status), §7 (Connectors).
// ---------------------------------------------------------------------------
import { useState } from 'react';
import type { Campaign, Client, Brand, CampaignBrief, AssetItem, RoleName } from '../../types/core';
import type { ManualPublishingEvidence } from '../../lib/core/manualPublishingEvidence';
import type { LearningCandidateReview } from '../../lib/core/brandBrainLearning';
import type { BrandBrainUpdateProposal } from '../../lib/core/brandBrainUpdateProposal';
import ManualPublishingEvidencePanel from './ManualPublishingEvidencePanel';
import ManualResultReviewPanel from './ManualResultReviewPanel';
import BrandBrainLearningReviewPanel from './BrandBrainLearningReviewPanel';
import BrandBrainUpdateProposalPanel from './BrandBrainUpdateProposalPanel';
import BrandBrainManualApplyPanel from './BrandBrainManualApplyPanel';

interface Props {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  brief: CampaignBrief | null;
  assets: AssetItem[];
  userRole: RoleName | null;
  actorLabel: string;
}

export default function ManualPublishingEvidenceSection({
  campaign, client, brand, brief, assets, userRole, actorLabel,
}: Props) {
  // Single source of truth for Owner-provided manual publishing evidence/result.
  // Default EMPTY — no sample is auto-loaded, so nothing implies a published/reviewed post.
  const [evidence, setEvidence] = useState<ManualPublishingEvidence[]>(() => []);

  // Mirror of the Phase X learning-review decisions (owned by the Phase X panel).
  // Phase Y reads the ACCEPTED candidates from here — nothing is auto-updated.
  const [learningReviews, setLearningReviews] = useState<LearningCandidateReview[]>([]);

  // Mirror of the Phase Y proposal (owned by the Phase Y panel). Phase Z reads an
  // Owner-APPROVED proposal from here — approving never auto-applies it.
  const [proposal, setProposal] = useState<BrandBrainUpdateProposal | null>(null);

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
      <BrandBrainLearningReviewPanel
        campaign={campaign}
        userRole={userRole}
        actorLabel={actorLabel}
        evidence={evidence}
        onReviewsChange={setLearningReviews}
      />
      <BrandBrainUpdateProposalPanel
        campaign={campaign}
        brand={brand}
        client={client}
        brief={brief}
        assets={assets}
        userRole={userRole}
        actorLabel={actorLabel}
        reviews={learningReviews}
        onProposalChange={setProposal}
      />
      <BrandBrainManualApplyPanel
        campaign={campaign}
        brand={brand}
        client={client}
        brief={brief}
        assets={assets}
        userRole={userRole}
        actorLabel={actorLabel}
        proposal={proposal}
      />
    </>
  );
}
