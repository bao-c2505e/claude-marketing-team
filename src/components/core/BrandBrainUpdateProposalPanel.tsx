// Brand Brain Update Proposal & Owner Merge Gate (Phase Y) — SAFE, LOCAL/DEMO panel
// ---------------------------------------------------------------------------
// Sits BELOW the Phase X Brand Brain Learning Review panel inside the Campaign
// Production Workspace. It turns the Owner-ACCEPTED Phase X learning candidates
// into an explicit BRAND BRAIN UPDATE PROPOSAL — a before/after preview, a visible
// diff, safety flags, and a SEPARATE Owner merge-approval gate:
//
//   • Accepted learning does not automatically update Brand Brain. Preparing a
//     proposal only builds a preview; this panel NEVER writes to / mutates /
//     auto-updates the Brand Brain source of truth.
//   • Only ACCEPTED candidates feed the proposal; rejected / pending are ignored.
//   • The Brand Brain update is a SEPARATE, explicit Owner decision (approve /
//     request revision / reject). Owner approval only marks the proposal
//     `ready_for_manual_apply` — a later manual step, never auto-apply.
//   • Owner-only authority (can.publishContent). Local/demo only: no network, no
//     connector, no AI/API call, no live analytics. Copy is clipboard-only.
//
// Proposal + owner-decision state is held locally here (React state). The pure
// model is unit-tested in brandBrainUpdateProposal.test.ts; a source-scan test
// enforces this panel's safety posture. See CLAUDE.md §3/§4/§6/§7.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
  ClipboardCopy,
  Eye,
  EyeOff,
  GitCompare,
  History,
  AlertTriangle,
  FilePlus2,
} from 'lucide-react';
import type { Campaign, Client, Brand, CampaignBrief, AssetItem, RoleName } from '../../types/core';
import { can } from '../../lib/auth/permissions';
import { buildBrandBrain } from '../../lib/core/brandBrain';
import type { LearningCandidateReview } from '../../lib/core/brandBrainLearning';
import {
  generateBrandBrainUpdateProposal,
  approveBrandBrainUpdateProposal,
  rejectBrandBrainUpdateProposal,
  requestBrandBrainUpdateRevision,
  listProposalAudit,
  renderBrandBrainUpdateProposalText,
  BRAND_BRAIN_PROPOSAL_STATUS_LABEL,
  BRAND_BRAIN_PROPOSAL_STATUS_COLOR,
  BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_LABEL,
  BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_COLOR,
  BRAND_BRAIN_PROPOSAL_LOCAL_ONLY_BADGES,
  type BrandBrainUpdateProposal,
} from '../../lib/core/brandBrainUpdateProposal';

interface Props {
  campaign: Campaign;
  brand: Brand | null;
  client: Client | null;
  brief: CampaignBrief | null;
  assets: AssetItem[];
  userRole: RoleName | null;
  actorLabel: string;
  /** Phase X Owner review list — only ACCEPTED entries feed the proposal. */
  reviews: LearningCandidateReview[];
}

const ACCENT = '#2dd4bf';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 700, color,
      background: `${color}18`, borderRadius: '5px', padding: '2px 8px',
      border: `1px solid ${color}40`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: '10px',
  padding: '14px', background: 'rgba(255,255,255,0.02)',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px',
};
const sectionTitle: React.CSSProperties = {
  ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '5px',
};

function kindColor(kind: string): string {
  return kind === 'repeat' ? '#34d399' : kind === 'avoid' ? '#f87171' : '#fbbf24';
}

export default function BrandBrainUpdateProposalPanel({
  campaign, brand, client, brief, assets, userRole, actorLabel, reviews,
}: Props) {
  const canDecide = can.publishContent(userRole);

  // The current Brand Brain source of truth (read-only — never mutated here).
  const brain = useMemo(
    () => brand
      ? buildBrandBrain({
          brand,
          client,
          campaigns: [campaign],
          briefs: brief ? [brief] : [],
          assets,
        })
      : null,
    [brand, client, campaign, brief, assets],
  );

  // Accepted candidates that would feed a proposal (rejected/pending ignored).
  const acceptedReviews = useMemo(() => reviews.filter(r => r.decision === 'accepted'), [reviews]);
  const acceptedSig = useMemo(
    () => acceptedReviews.map(r => r.id).sort().join('|'),
    [acceptedReviews],
  );

  // The prepared proposal + local decision state (held only after an explicit
  // "prepare" — accepting learning does NOT auto-generate or auto-apply anything).
  const [proposal, setProposal] = useState<BrandBrainUpdateProposal | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // If the accepted set changes after a proposal was prepared, mark it stale so
  // the Owner must re-prepare (a prior approval can't carry to a new change set).
  const proposalStale = useMemo(
    () => !!proposal && proposal.sourceLearningCandidateIds.slice().sort().join('|') !== acceptedSig,
    [proposal, acceptedSig],
  );

  // Drop a stale proposal so no outdated approval lingers on screen.
  useEffect(() => {
    if (proposalStale) setProposal(null);
  }, [proposalStale]);

  const prepare = useCallback(() => {
    if (!canDecide || !brain || acceptedReviews.length === 0) return;
    setProposal(generateBrandBrainUpdateProposal({
      brain,
      reviews,
      sourceCampaignId: campaign.id,
    }));
    setDecisionNote('');
  }, [canDecide, brain, acceptedReviews.length, reviews, campaign.id]);

  const decide = useCallback((action: 'approve' | 'reject' | 'revision') => {
    if (!canDecide) return;
    setProposal(prev => {
      if (!prev) return prev;
      const opts = { actor: actorLabel || 'Owner', notes: decisionNote };
      if (action === 'approve') return approveBrandBrainUpdateProposal(prev, opts);
      if (action === 'reject') return rejectBrandBrainUpdateProposal(prev, opts);
      return requestBrandBrainUpdateRevision(prev, opts);
    });
  }, [canDecide, actorLabel, decisionNote]);

  const previewText = useMemo(
    () => (proposal ? renderBrandBrainUpdateProposalText(proposal, campaign.name) : ''),
    [proposal, campaign.name],
  );
  const orderedAudit = useMemo(() => (proposal ? listProposalAudit(proposal) : []), [proposal]);

  const handleCopy = useCallback(async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('bbup-report-text') as HTMLTextAreaElement | null;
      if (el) { el.value = previewText; el.select(); }
    }
  }, [previewText]);

  const decidable = !!proposal && (proposal.proposalStatus === 'pending_owner_approval' || proposal.proposalStatus === 'revision_requested');

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Brain size={18} style={{ color: ACCENT }} /> Brand Brain Update Proposal — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {BRAND_BRAIN_PROPOSAL_LOCAL_ONLY_BADGES.map(b => <Badge key={b} label={b} color={ACCENT} />)}
        </div>
      </div>

      {/* ── Safety banner ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ccfbf1' }}>
          <strong>Accepted learning does not automatically update Brand Brain.</strong>{' '}
          <strong>Brand Brain update requires explicit Owner approval.</strong>{' '}
          <strong>This proposal is not based on live analytics.</strong>{' '}
          Owner approval only marks the proposal ready for a separate, manual apply step — it is never auto-applied.
          Approved ≠ Published. Client Accepted ≠ Published.
        </div>
      </div>

      {/* ── 1. Accepted learning candidates feeding the proposal ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><Check size={12} /> 1 · Accepted learning candidates feeding the proposal</div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {acceptedReviews.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              No accepted learning candidates yet. Accept one or more candidates in the Brand Brain Learning Review above —
              only accepted candidates feed a Brand Brain update proposal (rejected / pending are ignored).
            </div>
          ) : acceptedReviews.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: 'rgba(0,0,0,0.18)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                <Badge label={r.label} color={kindColor(r.kind)} />
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{r.basis}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{r.insight}</div>
            </div>
          ))}
        </div>
        {!canDecide && (
          <p style={{ fontSize: '0.72rem', color: '#fbbf24', margin: '10px 0 0' }}>
            Owner role required to prepare or decide a Brand Brain update proposal. Owner is the only approval authority.
          </p>
        )}
        {canDecide && (
          <button
            onClick={prepare}
            disabled={acceptedReviews.length === 0 || !brain}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '8px 14px', borderRadius: '7px',
              fontSize: '0.78rem', fontWeight: 600,
              background: acceptedReviews.length === 0 || !brain ? 'rgba(255,255,255,0.04)' : `${ACCENT}26`,
              border: `1px solid ${ACCENT}73`, color: ACCENT,
              cursor: acceptedReviews.length === 0 || !brain ? 'default' : 'pointer',
              opacity: acceptedReviews.length === 0 || !brain ? 0.5 : 1,
            }}
          >
            <FilePlus2 size={14} /> {proposal ? 'Re-prepare proposal from accepted candidates' : 'Prepare Brand Brain update proposal'}
          </button>
        )}
      </div>

      {!brain && (
        <div style={{ ...cardStyle, marginBottom: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          No brand context available for this campaign yet — a Brand Brain is required to preview an update proposal.
        </div>
      )}

      {proposal && (
        <>
          {/* ── 2. Proposal status ── */}
          <div style={{ ...cardStyle, marginBottom: '12px', borderColor: 'rgba(45,212,191,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={sectionTitle}><Brain size={12} /> 2 · Proposal status</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <Badge label={BRAND_BRAIN_PROPOSAL_STATUS_LABEL[proposal.proposalStatus]} color={BRAND_BRAIN_PROPOSAL_STATUS_COLOR[proposal.proposalStatus]} />
                <Badge label="Applied to Brand Brain: NO" color="#fbbf24" />
                <Badge label={proposal.ready_for_manual_apply ? 'Ready for manual apply (not auto-applied)' : 'Requires Owner approval'} color="#60a5fa" />
              </div>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
              Brand: <strong>{proposal.brandName}</strong> · {proposal.sourceLearningCandidateIds.length} accepted candidate(s) ·
              {' '}{proposal.diffSummary.changedSections} section(s) changed · {proposal.diffSummary.totalAdditions} addition(s).
            </p>
          </div>

          {/* ── 3. Safety flags ── */}
          {proposal.safetyFlags.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: '12px' }}>
              <div style={sectionTitle}><AlertTriangle size={12} /> 3 · Safety flags</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {proposal.safetyFlags.map(f => (
                  <Badge key={f} label={BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_LABEL[f]} color={BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_COLOR[f]} />
                ))}
              </div>
            </div>
          )}

          {/* ── 4. Before / after diff preview ── */}
          <div style={{ ...cardStyle, marginBottom: '12px' }}>
            <div style={sectionTitle}><GitCompare size={12} /> 4 · Before / after diff preview</div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!proposal.diffSummary.hasChanges ? (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  No net-new changes — every accepted insight already exists in the Brand Brain.
                </div>
              ) : proposal.diffSummary.entries.map(e => (
                <div key={e.section} style={{ border: '1px solid var(--border-color)', borderRadius: '9px', padding: '11px 13px', background: 'rgba(0,0,0,0.18)' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '7px' }}>{e.sectionLabel}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={labelStyle}>Existing</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {e.before.length ? e.before.join(' · ') : <em>(empty)</em>}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Proposed</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {e.proposedAfter.map((v, i) => (
                          <span key={i} style={{ color: e.additions.some(a => a.toLowerCase() === v.toLowerCase()) ? ACCENT : 'var(--text-muted)' }}>
                            {v}{i < e.proposedAfter.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '8px' }}>Reason / evidence: {e.reason}</div>
                  {e.risk && (
                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', marginTop: '4px', display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={11} style={{ marginTop: '2px', flexShrink: 0 }} /> {e.risk}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Owner merge gate ── */}
          <div style={{ ...cardStyle, marginBottom: '12px', borderColor: 'rgba(45,212,191,0.35)' }}>
            <div style={sectionTitle}><ShieldCheck size={12} /> 5 · Owner merge gate</div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '8px 0' }}>
              Approving marks this proposal <strong>ready for a separate, manual apply step</strong> — it is not auto-applied and
              nothing is written to Brand Brain automatically. This decision is separate from accepting the learning candidates.
            </p>
            {canDecide && decidable ? (
              <>
                <textarea
                  value={decisionNote}
                  onChange={e => setDecisionNote(e.target.value)}
                  placeholder="Optional Owner note for this decision"
                  style={{
                    width: '100%', boxSizing: 'border-box', minHeight: '54px', marginBottom: '9px', padding: '7px 10px',
                    fontSize: '0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => decide('approve')} style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600,
                    background: 'rgba(52,211,153,0.22)', border: '1px solid #34d39973', color: '#34d399', cursor: 'pointer',
                  }}>
                    <Check size={13} /> Approve proposal
                  </button>
                  <button onClick={() => decide('revision')} style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600,
                    background: 'rgba(96,165,250,0.18)', border: '1px solid #60a5fa73', color: '#60a5fa', cursor: 'pointer',
                  }}>
                    <RotateCcw size={13} /> Request revision
                  </button>
                  <button onClick={() => decide('reject')} style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '7px', fontSize: '0.76rem', fontWeight: 600,
                    background: 'rgba(248,113,113,0.22)', border: '1px solid #f8717173', color: '#f87171', cursor: 'pointer',
                  }}>
                    <X size={13} /> Reject proposal
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {proposal.ownerDecision.decision
                  ? <>Owner decision recorded: <strong style={{ color: BRAND_BRAIN_PROPOSAL_STATUS_COLOR[proposal.proposalStatus] }}>{BRAND_BRAIN_PROPOSAL_STATUS_LABEL[proposal.proposalStatus]}</strong>{proposal.ownerDecision.decidedBy ? ` by ${proposal.ownerDecision.decidedBy}` : ''}. Re-prepare to decide again.</>
                  : 'Owner role required to decide this proposal.'}
              </div>
            )}
          </div>

          {/* ── 6. Decision audit trail ── */}
          <div style={{ ...cardStyle, marginBottom: '14px' }}>
            <div style={sectionTitle}><History size={12} /> 6 · Decision audit trail (local)</div>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {orderedAudit.map(a => (
                <div key={a.id} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{a.at}</span>
                  <span><strong>{a.action}</strong>{a.actor ? ` · ${a.actor}` : ''} → {BRAND_BRAIN_PROPOSAL_STATUS_LABEL[a.toStatus]}{a.notes ? ` — ${a.notes}` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Local helper actions (no external service, no network) ── */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
            }}>
              {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copied ? 'Copied!' : 'Copy proposal'}
            </button>
            <button onClick={() => setShowPreview(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? 'Hide proposal text' : 'Preview proposal text'}
            </button>
          </div>

          {showPreview && (
            <textarea
              readOnly
              value={previewText}
              style={{
                width: '100%', minHeight: '260px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
                fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          )}
        </>
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="bbup-report-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo Brand Brain update proposal for {actorLabel || 'the Owner'}. Accepted learning does not automatically update
        Brand Brain — the update requires explicit Owner approval, nothing is persisted, and applying an approved proposal is a
        separate, later manual step (never auto-applied). This proposal is not based on live analytics; no connector,
        no AI/API/network call, no auto-post, no auto-ads.
      </p>
    </div>
  );
}
