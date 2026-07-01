// ---------------------------------------------------------------------------
// Brand Brain Manual Apply Room & Versioned Audit Trail (Phase Z) — pure, local,
// deterministic
//
// Sits ON TOP of Phase Y (`brandBrainUpdateProposal.ts`). Phase Y lets the Owner
// APPROVE / REJECT / request-revision a BRAND BRAIN UPDATE PROPOSAL. An approved
// proposal is ONLY `ready_for_manual_apply` — it is NEVER auto-applied to the
// Brand Brain. Phase Z is the SEPARATE, explicit Owner MANUAL APPLY step: it turns
// an owner-approved proposal into a NEW versioned Brand Brain SNAPSHOT with a full
// audit trail, while preserving every previous version.
//
//   • Brand Brain is NOT auto-updated. Approving a proposal (Phase Y) does nothing
//     to the version history here. Only an EXPLICIT Owner apply creates a version.
//   • ONLY an `owner_approved` + `ready_for_manual_apply` proposal can be applied.
//     Pending / rejected / revision-requested / draft proposals are blocked with a
//     reason — never silently applied.
//   • Applying APPENDS a new version (v(N+1)) built from the proposal's proposed
//     after-snapshot. The previous version is preserved unchanged (append-only) —
//     nothing is overwritten or deleted.
//   • Before/after diff preview (current version → proposed) and a NON-DESTRUCTIVE
//     rollback PREVIEW (current → an older version). Rollback here is preview-only:
//     this layer never mutates or deletes a version, so there is no destructive
//     rollback path.
//   • Full local audit trail: baseline creation, the carried proposal-approved
//     evidence, the apply request, and the resulting version-created entry — each
//     an immutable record (actor, action, from/to version, proposal id, timestamp).
//   • No live analytics, no fabricated metrics, no connector, no AI/API/network
//     call, no persistence/DB, no URL/webhook/secret. `based_on_live_analytics` is
//     always false. Everything is local/demo and in-memory.
//
// Pure & deterministic: `initBrandBrainVersionHistory` and `applyApprovedProposal`
// are fixed functions of their inputs (plus injectable `now` / ids); apply returns
// a NEW history (append-only, no in-place mutation) or the SAME reference with a
// block reason. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status),
// §7 (Connectors).
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import type { BrandBrain } from './brandBrain';
import { toSectionSnapshot } from './brandBrainUpdateProposal';
import type {
  BrandBrainSectionSnapshot,
  BrandBrainSectionKey,
  BrandBrainUpdateProposal,
} from './brandBrainUpdateProposal';
import { BRAND_BRAIN_SECTION_LABEL, BRAND_BRAIN_SECTION_FIELD } from './brandBrainUpdateProposal';

// ---------------------------------------------------------------------------
// Version-diff preview — pure snapshot-to-snapshot comparison (additions +
// removals). Reused for BOTH the apply preview (current → proposed) and the
// rollback preview (current → an older version).
// ---------------------------------------------------------------------------

export interface VersionDiffEntry {
  section: BrandBrainSectionKey;
  sectionLabel: string;
  before: string[];
  after: string[];
  /** Present in `after`, not in `before` (case-insensitive). */
  additions: string[];
  /** Present in `before`, not in `after` (case-insensitive). */
  removals: string[];
}

export interface VersionDiff {
  entries: VersionDiffEntry[];
  totalAdditions: number;
  totalRemovals: number;
  changedSections: number;
  hasChanges: boolean;
}

/** Stable section display order (mirrors the Phase Y diff order). */
const SECTION_ORDER: BrandBrainSectionKey[] = [
  'positioning', 'audience', 'tone', 'offer', 'productPriority',
  'creativeDirection', 'dos', 'donts', 'evidenceNotes',
];

function notIn(source: string[], other: string[]): string[] {
  return source.filter(s => !other.some(o => o.toLowerCase() === s.toLowerCase()));
}

/**
 * Pure diff between two section snapshots. Lists every section that changed with
 * its net additions and removals. No side effects; input snapshots are not mutated.
 */
export function diffSnapshots(
  before: BrandBrainSectionSnapshot,
  after: BrandBrainSectionSnapshot,
): VersionDiff {
  const entries: VersionDiffEntry[] = [];
  for (const section of SECTION_ORDER) {
    const field = BRAND_BRAIN_SECTION_FIELD[section];
    const b = before[field];
    const a = after[field];
    const additions = notIn(a, b);
    const removals = notIn(b, a);
    if (additions.length === 0 && removals.length === 0) continue;
    entries.push({
      section,
      sectionLabel: BRAND_BRAIN_SECTION_LABEL[section],
      before: [...b],
      after: [...a],
      additions,
      removals,
    });
  }
  const totalAdditions = entries.reduce((n, e) => n + e.additions.length, 0);
  const totalRemovals = entries.reduce((n, e) => n + e.removals.length, 0);
  return {
    entries,
    totalAdditions,
    totalRemovals,
    changedSections: entries.length,
    hasChanges: entries.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Version + history contracts
// ---------------------------------------------------------------------------

/** How a version came to exist. `baseline` = the initial captured Brand Brain. */
export type BrandBrainVersionOrigin = 'baseline' | 'manual_apply';

/** One immutable, versioned Brand Brain snapshot (append-only in the history). */
export interface BrandBrainVersion {
  versionId: string;
  /** 1-based, monotonically increasing. v1 is always the baseline. */
  versionNumber: number;
  brandId: string | null;
  brandName: string;
  origin: BrandBrainVersionOrigin;
  /** The full diffable section snapshot captured for this version. */
  snapshot: BrandBrainSectionSnapshot;
  /** The Phase Y proposal this version was applied from (null for the baseline). */
  sourceProposalId: string | null;
  /** Owner who applied the version (null for the baseline). */
  appliedBy: string | null;
  /** Optional Owner note recorded at apply time. */
  note: string | null;
  createdAt: string;
}

export type BrandBrainApplyAuditAction =
  | 'baseline_created'
  | 'proposal_approved'
  | 'apply_requested'
  | 'version_created';

export interface BrandBrainApplyAuditEntry {
  id: string;
  at: string;
  actor: string | null;
  action: BrandBrainApplyAuditAction;
  fromVersion: number | null;
  toVersion: number | null;
  proposalId: string | null;
  notes: string | null;
}

/**
 * The append-only version history + audit trail for ONE brand's Brand Brain.
 * Never persisted, never applied to any external world — local/demo only.
 */
export interface BrandBrainVersionHistory {
  brandId: string | null;
  brandName: string;
  /** Append-only, ordered v1..vN. Never overwritten or deleted. */
  versions: BrandBrainVersion[];
  /** = versions.length (the latest / active version number). */
  currentVersionNumber: number;
  auditTrail: BrandBrainApplyAuditEntry[];
  // ── Structural guarantees — a version history is never a live/published state. ──
  based_on_live_analytics: false;
  persisted: false;
  auto_applied: false;
  createdAt: string;
  updatedAt: string;
}

export const BRAND_BRAIN_APPLY_ACTION_LABEL: Record<BrandBrainApplyAuditAction, string> = {
  baseline_created:  'Baseline Brand Brain version captured',
  proposal_approved: 'Owner approved proposal (Phase Y)',
  apply_requested:   'Owner requested manual apply',
  version_created:   'New Brand Brain version created',
};

/** Standing safety notes carried by the apply room (asserted by tests + UI). */
export const BRAND_BRAIN_APPLY_SAFETY_NOTES: string[] = [
  'Approved proposal is only ready for manual apply — it is never auto-applied.',
  'Brand Brain changes are not active until the Owner explicitly applies them.',
  'Applying appends a new Brand Brain version; every previous version is preserved.',
  'Only an Owner-approved proposal can be applied — pending / rejected / revision proposals are blocked.',
  'Rollback here is a preview only — no version is ever overwritten or deleted.',
  'Approved ≠ Published. Client Accepted ≠ Published. This is not based on live analytics.',
  'No fabricated metrics, no connector, no AI/API/network call, no auto-post, no auto-ads — local/demo only.',
];

/** Local/demo provenance badges shown on the panel. */
export const BRAND_BRAIN_APPLY_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo only',
  'Manual apply room',
  'Owner-only apply gate',
  'Versioned + append-only',
  'Not active until applied',
];

// ---------------------------------------------------------------------------
// Baseline — capture the current Brand Brain as version 1.
// ---------------------------------------------------------------------------

export interface InitVersionHistoryParams {
  brain: BrandBrain;
  now?: Date;
  /** Injectable ids for deterministic tests. */
  versionId?: string;
  auditId?: string;
}

/**
 * Capture the current Brand Brain as the baseline (v1) of a fresh version
 * history. Pure & read-only — never mutates the Brand Brain. Applying a proposal
 * later appends v2, v3, … onto this baseline.
 */
export function initBrandBrainVersionHistory(params: InitVersionHistoryParams): BrandBrainVersionHistory {
  const { brain } = params;
  const now = params.now ?? new Date();
  const iso = now.toISOString();

  const baseline: BrandBrainVersion = {
    versionId: params.versionId ?? generateId('bbver'),
    versionNumber: 1,
    brandId: brain.brandId ?? null,
    brandName: brain.brandName,
    origin: 'baseline',
    snapshot: toSectionSnapshot(brain),
    sourceProposalId: null,
    appliedBy: null,
    note: null,
    createdAt: iso,
  };

  const audit: BrandBrainApplyAuditEntry = {
    id: params.auditId ?? generateId('bbver-audit'),
    at: iso,
    actor: null,
    action: 'baseline_created',
    fromVersion: null,
    toVersion: 1,
    proposalId: null,
    notes: 'Baseline Brand Brain version captured (local/demo). Not applied to any external world.',
  };

  return {
    brandId: brain.brandId ?? null,
    brandName: brain.brandName,
    versions: [baseline],
    currentVersionNumber: 1,
    auditTrail: [audit],
    based_on_live_analytics: false,
    persisted: false,
    auto_applied: false,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** The latest (active) version in a history. Always defined (baseline at minimum). */
export function currentVersion(history: BrandBrainVersionHistory): BrandBrainVersion {
  return history.versions[history.versions.length - 1];
}

// ---------------------------------------------------------------------------
// Manual apply gate — only an owner-approved proposal can be applied.
// ---------------------------------------------------------------------------

/** Why a manual apply was refused (never silently applied). */
export type ApplyBlockReason =
  | 'not_owner_approved'
  | 'not_ready_for_manual_apply'
  | 'proposal_brand_mismatch'
  | 'no_net_new_changes';

export const APPLY_BLOCK_REASON_LABEL: Record<ApplyBlockReason, string> = {
  not_owner_approved:         'Proposal is not Owner-approved — only an approved proposal can be applied.',
  not_ready_for_manual_apply: 'Proposal is not marked ready for manual apply.',
  proposal_brand_mismatch:    'Proposal belongs to a different brand than this version history.',
  no_net_new_changes:         'Proposal has no net-new changes over the current version — nothing to apply.',
};

export interface ApplyProposalOpts {
  actor?: string;
  notes?: string;
  now?: string;
  /** Injectable ids for deterministic tests. */
  versionId?: string;
  auditIdApproved?: string;
  auditIdRequested?: string;
  auditIdCreated?: string;
}

export interface ApplyProposalOutcome {
  applied: boolean;
  reason: ApplyBlockReason | null;
  /** New history on success; the SAME reference on a blocked apply. */
  history: BrandBrainVersionHistory;
  /** The version created on success; null when blocked. */
  createdVersion: BrandBrainVersion | null;
}

/**
 * Pre-check whether a proposal may be manually applied against a history. Pure —
 * returns null when the apply is allowed, otherwise the block reason. Used by both
 * `applyApprovedProposal` and the UI (to explain a disabled apply button).
 */
export function checkApplyEligibility(
  history: BrandBrainVersionHistory,
  proposal: BrandBrainUpdateProposal,
): ApplyBlockReason | null {
  // Belt-and-suspenders: BOTH the explicit approved status AND the readiness flag
  // must hold. A proposal only reaches `ready_for_manual_apply` via Owner approval.
  if (proposal.proposalStatus !== 'owner_approved') return 'not_owner_approved';
  if (!proposal.ready_for_manual_apply) return 'not_ready_for_manual_apply';
  if ((proposal.brandId ?? null) !== (history.brandId ?? null)) return 'proposal_brand_mismatch';
  const diff = diffSnapshots(currentVersion(history).snapshot, proposal.proposedAfterSnapshot);
  if (!diff.hasChanges) return 'no_net_new_changes';
  return null;
}

/**
 * The MANUAL APPLY step. Applies an OWNER-APPROVED proposal by APPENDING a new
 * version built from the proposal's proposed after-snapshot, preserving every
 * previous version. Records the carried approval evidence, the apply request, and
 * the version-created entry in the audit trail.
 *
 * Returns `{ applied: true, ... }` with a NEW history on success, or
 * `{ applied: false, reason, history: <same ref> }` when blocked — a pending,
 * rejected, revision-requested, or draft proposal is NEVER applied. Pure &
 * deterministic; never mutates the input history or proposal, never persists,
 * never touches an external world.
 */
export function applyApprovedProposal(
  history: BrandBrainVersionHistory,
  proposal: BrandBrainUpdateProposal,
  opts: ApplyProposalOpts = {},
): ApplyProposalOutcome {
  const reason = checkApplyEligibility(history, proposal);
  if (reason) return { applied: false, reason, history, createdVersion: null };

  const at = opts.now ?? new Date().toISOString();
  const actor = opts.actor?.trim() || null;
  const notes = opts.notes?.trim() || null;
  const fromVersion = history.currentVersionNumber;
  const toVersion = fromVersion + 1;

  const newVersion: BrandBrainVersion = {
    versionId: opts.versionId ?? generateId('bbver'),
    versionNumber: toVersion,
    brandId: history.brandId,
    brandName: history.brandName,
    origin: 'manual_apply',
    // Clone so the new version can never share a mutable reference with the proposal.
    snapshot: cloneSnapshot(proposal.proposedAfterSnapshot),
    sourceProposalId: proposal.proposalId,
    appliedBy: actor,
    note: notes,
    createdAt: at,
  };

  // Three immutable audit entries capture the full manual-apply evidence chain.
  const approvedEvidence: BrandBrainApplyAuditEntry = {
    id: opts.auditIdApproved ?? generateId('bbver-audit'),
    at,
    actor: proposal.ownerDecision.decidedBy ?? actor,
    action: 'proposal_approved',
    fromVersion,
    toVersion: null,
    proposalId: proposal.proposalId,
    notes: proposal.ownerDecision.notes
      ? `Proposal approved (Phase Y) — ${proposal.ownerDecision.notes}`
      : 'Proposal approved (Phase Y).',
  };
  const applyRequested: BrandBrainApplyAuditEntry = {
    id: opts.auditIdRequested ?? generateId('bbver-audit'),
    at,
    actor,
    action: 'apply_requested',
    fromVersion,
    toVersion,
    proposalId: proposal.proposalId,
    notes: notes ? `Manual apply requested — ${notes}` : 'Manual apply requested by Owner.',
  };
  const versionCreated: BrandBrainApplyAuditEntry = {
    id: opts.auditIdCreated ?? generateId('bbver-audit'),
    at,
    actor,
    action: 'version_created',
    fromVersion,
    toVersion,
    proposalId: proposal.proposalId,
    notes: `Brand Brain version ${toVersion} created from proposal ${proposal.proposalId} (local/demo — not published/launched).`,
  };

  const nextHistory: BrandBrainVersionHistory = {
    ...history,
    versions: [...history.versions, newVersion],
    currentVersionNumber: toVersion,
    auditTrail: [...history.auditTrail, approvedEvidence, applyRequested, versionCreated],
    updatedAt: at,
  };

  return { applied: true, reason: null, history: nextHistory, createdVersion: newVersion };
}

function cloneSnapshot(s: BrandBrainSectionSnapshot): BrandBrainSectionSnapshot {
  return {
    positioning:       [...s.positioning],
    audience:          [...s.audience],
    tone:              [...s.tone],
    offer:             [...s.offer],
    productPriority:   [...s.productPriority],
    creativeDirection: [...s.creativeDirection],
    dos:               [...s.dos],
    donts:             [...s.donts],
    evidenceNotes:     [...s.evidenceNotes],
  };
}

// ---------------------------------------------------------------------------
// Diff + rollback previews — read-only, non-destructive.
// ---------------------------------------------------------------------------

/**
 * Preview the change an apply WOULD make: current version → the proposal's
 * proposed after-snapshot. Pure & read-only — nothing is applied.
 */
export function previewApply(
  history: BrandBrainVersionHistory,
  proposal: BrandBrainUpdateProposal,
): VersionDiff {
  return diffSnapshots(currentVersion(history).snapshot, proposal.proposedAfterSnapshot);
}

/**
 * NON-DESTRUCTIVE rollback PREVIEW: what the Brand Brain WOULD look like if it
 * were reverted from the current version back to `targetVersionNumber`. This never
 * mutates or deletes any version — it only computes a diff for the Owner to review.
 * Returns null when the target version does not exist or is the current version.
 */
export function previewRollback(
  history: BrandBrainVersionHistory,
  targetVersionNumber: number,
): VersionDiff | null {
  if (targetVersionNumber >= history.currentVersionNumber) return null;
  const target = history.versions.find(v => v.versionNumber === targetVersionNumber);
  if (!target) return null;
  return diffSnapshots(currentVersion(history).snapshot, target.snapshot);
}

/**
 * Newest-first ordered audit list (stable display). A single manual apply appends
 * several entries that share one timestamp, so ties fall back to append order
 * (later-appended = newer) to keep the evidence chain in a sensible reverse order.
 */
export function listApplyAudit(history: BrandBrainVersionHistory): BrandBrainApplyAuditEntry[] {
  return history.auditTrail
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.at.localeCompare(a.entry.at) || b.index - a.index)
    .map(x => x.entry);
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network, and never emits a URL/link.
// ---------------------------------------------------------------------------

export function renderVersionHistoryText(
  history: BrandBrainVersionHistory,
  title = 'Brand Brain Version History',
): string {
  const lines: string[] = [];
  lines.push(`BRAND BRAIN MANUAL APPLY — VERSION HISTORY (LOCAL/DEMO) — ${title}`);
  lines.push(`Brand: ${history.brandName}`);
  lines.push(`Current version: v${history.currentVersionNumber} of ${history.versions.length}`);
  lines.push('Approved proposal is only ready for manual apply — Brand Brain changes are not active until the Owner applies them.');
  lines.push('');

  lines.push('VERSIONS (append-only — previous versions preserved)');
  for (const v of history.versions) {
    const who = v.appliedBy ? ` by ${v.appliedBy}` : '';
    const src = v.sourceProposalId ? ` · from proposal ${v.sourceProposalId}` : '';
    const tag = v.versionNumber === history.currentVersionNumber ? ' [current]' : '';
    lines.push(`- v${v.versionNumber} (${v.origin})${tag}${who}${src} · ${v.createdAt}`);
    if (v.note) lines.push(`    note: ${v.note}`);
  }
  lines.push('');

  lines.push('AUDIT TRAIL (newest first)');
  for (const a of listApplyAudit(history)) {
    const who = a.actor ? ` · ${a.actor}` : '';
    const ver = a.toVersion != null ? ` → v${a.toVersion}` : '';
    lines.push(`- ${a.at} ${BRAND_BRAIN_APPLY_ACTION_LABEL[a.action]}${who}${ver}${a.notes ? ` — ${a.notes}` : ''}`);
  }
  lines.push('');

  lines.push('SAFETY');
  for (const s of BRAND_BRAIN_APPLY_SAFETY_NOTES) lines.push(`- ${s}`);

  return lines.join('\n');
}
