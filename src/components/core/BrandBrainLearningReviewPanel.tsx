// Owner-approved Campaign Learning Memory — Brand Brain Learning Candidate
// Approval (Phase X) — SAFE, LOCAL/DEMO review panel
// ---------------------------------------------------------------------------
// Sits below the Phase W Manual Result Review panel inside the Campaign
// Production Workspace. It turns the Phase W Brand Brain LEARNING CANDIDATES into
// an Owner-only ACCEPT / REJECT / RESET decision flow and previews a PREPARED
// Brand Brain update proposal built from the accepted candidates only:
//
//   • Owner-only authority. Accept/Reject/Reset are gated on the Owner role
//     (can.publishContent) — a manager cannot decide learning here.
//   • Accepted ≠ applied. Accepting only marks a candidate for a prepared
//     proposal. This panel NEVER writes to, mutates, or auto-updates the Brand
//     Brain source of truth. Brand Brain is not updated automatically.
//   • Rejected / not used candidates never reach the proposal. Prepared only,
//     not persisted; applying a proposal is a separate, later Owner-approved step.
//   • Reviews only the candidates derived from the Owner-provided manual evidence
//     (Phase V/W) passed in — it seeds no sample of its own and invents no metrics.
//   • Local/demo only: no network, no connector, no AI/API call, no analytics,
//     no auto-post, no auto-ads. Copy is clipboard-only.
//
// Decision + audit state is held locally here (React state). The pure model is
// unit-tested in brandBrainLearning.test.ts; a source-scan test enforces this
// panel's safety posture. See CLAUDE.md §3/§4/§6/§7.
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
  ListChecks,
  History,
} from 'lucide-react';
import type { Campaign, RoleName } from '../../types/core';
import { can } from '../../lib/auth/permissions';
import type { ManualPublishingEvidence } from '../../lib/core/manualPublishingEvidence';
import { buildManualResultReview } from '../../lib/core/manualResultReview';
import {
  initLearningReviews,
  applyLearningDecision,
  buildBrandBrainUpdateProposal,
  summarizeLearningReviews,
  listLearningAudit,
  renderBrandBrainUpdateProposalText,
  candidateKey,
  LEARNING_DECISION_LABEL,
  LEARNING_DECISION_COLOR,
  LEARNING_ACTION_LABEL,
  BRAND_BRAIN_LEARNING_LOCAL_ONLY_BADGES,
  type LearningCandidateReview,
  type LearningReviewAuditEntry,
  type LearningDecision,
} from '../../lib/core/brandBrainLearning';

interface Props {
  campaign: Campaign;
  userRole: RoleName | null;
  actorLabel: string;
  /** The ACTUAL Owner-provided manual publishing evidence (shared, lifted from the section). */
  evidence: ManualPublishingEvidence[];
  /**
   * Optional — mirror the current review list up to the parent so a sibling panel
   * (Phase Y Brand Brain Update Proposal) can consume the ACCEPTED candidates.
   * This panel stays authoritative over its own decision state; the callback only reports.
   */
  onReviewsChange?: (reviews: LearningCandidateReview[]) => void;
}

const ACCENT = '#a78bfa';

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

export default function BrandBrainLearningReviewPanel({ campaign, userRole, actorLabel, evidence, onReviewsChange }: Props) {
  // ── Candidates come from Phase W, derived from the SAME shared evidence. ──
  const review = useMemo(
    () => buildManualResultReview(evidence.map(e => ({ evidence: e }))),
    [evidence],
  );
  const candidates = review.learningCandidates;
  const candSig = useMemo(() => candidates.map(candidateKey).join('|'), [candidates]);

  // ── Owner decision + audit state (local only). Decisions survive Phase W
  //    re-deriving candidates because they are keyed by a stable candidate id. ──
  const [reviews, setReviews] = useState<LearningCandidateReview[]>(() => initLearningReviews(candidates));
  const [audit, setAudit] = useState<LearningReviewAuditEntry[]>([]);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Re-init when the candidate set changes, carrying prior decisions forward by id.
  useEffect(() => {
    setReviews(prev => initLearningReviews(candidates, prev));
    // candSig is the stable signature of `candidates`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candSig]);

  // Mirror the current reviews up (read-only) so a sibling panel can read the
  // ACCEPTED candidates. This panel remains authoritative over its own state.
  useEffect(() => {
    onReviewsChange?.(reviews);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  // Owner-only authority for learning decisions (not manager).
  const canDecide = can.publishContent(userRole);

  const summary = useMemo(() => summarizeLearningReviews(reviews), [reviews]);
  const proposal = useMemo(() => buildBrandBrainUpdateProposal(reviews), [reviews]);
  const orderedAudit = useMemo(() => listLearningAudit(audit), [audit]);
  const previewText = useMemo(
    () => renderBrandBrainUpdateProposalText(proposal, reviews, campaign.name),
    [proposal, reviews, campaign.name],
  );

  const decide = useCallback((id: string, decision: LearningDecision) => {
    if (!canDecide) return;
    setReviews(prevReviews => {
      const res = applyLearningDecision(prevReviews, audit, id, decision, {
        reason: reasonDraft[id],
        actor: actorLabel || 'Owner',
      });
      setAudit(res.audit);
      return res.reviews;
    });
  }, [canDecide, audit, reasonDraft, actorLabel]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('bbl-report-text') as HTMLTextAreaElement | null;
      if (el) { el.value = previewText; el.select(); }
    }
  }, [previewText]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Brain size={18} style={{ color: ACCENT }} /> Brand Brain Learning Review — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {BRAND_BRAIN_LEARNING_LOCAL_ONLY_BADGES.map(b => <Badge key={b} label={b} color={ACCENT} />)}
        </div>
      </div>

      {/* ── Safety banner ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ede9fe' }}>
          <strong>Owner-only learning review.</strong> These are <strong>Learning candidate</strong> items from the manual result review above.{' '}
          Accepting marks a candidate as <strong>Accepted for Brand Brain update</strong> — a <strong>prepared proposal only, not applied</strong>.{' '}
          <strong>Accepted ≠</strong> already written to Brand Brain. <strong>Brand Brain is not updated automatically</strong>; applying a proposal is a separate, later Owner-approved step.{' '}
          Rejected candidates are marked <strong>Rejected / not used</strong>. Approved ≠ Published. Client Accepted ≠ Published.
        </div>
      </div>

      {/* ── 1. Decision summary ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><ListChecks size={12} /> 1 · Decision summary</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
          <Badge label={`${summary.total} candidates`} color="#a78bfa" />
          <Badge label={`${summary.pending} pending`} color={LEARNING_DECISION_COLOR.pending} />
          <Badge label={`${summary.accepted} accepted`} color={LEARNING_DECISION_COLOR.accepted} />
          <Badge label={`${summary.rejected} rejected`} color={LEARNING_DECISION_COLOR.rejected} />
        </div>
        {!canDecide && (
          <p style={{ fontSize: '0.72rem', color: '#fbbf24', margin: '8px 0 0' }}>
            Owner role required to accept or reject learning candidates. Owner is the only approval authority.
          </p>
        )}
      </div>

      {/* ── 2. Learning candidates — accept / reject / reset ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><Brain size={12} /> 2 · Learning candidates</div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reviews.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              No learning candidates yet — record manual publishing evidence and a reviewed result above to generate candidates.
            </div>
          ) : reviews.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--border-color)', borderRadius: '9px', padding: '11px 13px', background: 'rgba(0,0,0,0.18)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '5px' }}>
                <Badge label={r.label} color={kindColor(r.kind)} />
                <Badge label={LEARNING_DECISION_LABEL[r.decision]} color={LEARNING_DECISION_COLOR[r.decision]} />
                {r.decidedBy && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>by {r.decidedBy}</span>}
              </div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{r.insight}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Basis: {r.basis}</div>
              {r.reason && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
                  Note: {r.reason}
                </div>
              )}
              {canDecide && (
                <>
                  <input
                    type="text"
                    value={reasonDraft[r.id] ?? ''}
                    onChange={e => setReasonDraft(d => ({ ...d, [r.id]: e.target.value }))}
                    placeholder="Optional reason / note for this decision"
                    style={{
                      width: '100%', boxSizing: 'border-box', marginBottom: '8px', padding: '6px 9px',
                      fontSize: '0.74rem', borderRadius: '6px', border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.25)', color: 'var(--text-primary)',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    <button onClick={() => decide(r.id, 'accepted')} disabled={r.decision === 'accepted'} style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600,
                      background: r.decision === 'accepted' ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.22)',
                      border: '1px solid #34d39973', color: '#34d399', cursor: r.decision === 'accepted' ? 'default' : 'pointer', opacity: r.decision === 'accepted' ? 0.6 : 1,
                    }}>
                      <Check size={13} /> Accept for Brand Brain update
                    </button>
                    <button onClick={() => decide(r.id, 'rejected')} disabled={r.decision === 'rejected'} style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600,
                      background: r.decision === 'rejected' ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.22)',
                      border: '1px solid #f8717173', color: '#f87171', cursor: r.decision === 'rejected' ? 'default' : 'pointer', opacity: r.decision === 'rejected' ? 0.6 : 1,
                    }}>
                      <X size={13} /> Reject / not used
                    </button>
                    {r.decision !== 'pending' && (
                      <button onClick={() => decide(r.id, 'pending')} style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                      }}>
                        <RotateCcw size={13} /> Reset
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Prepared Brand Brain update proposal (accepted only) ── */}
      <div style={{ ...cardStyle, marginBottom: '12px', borderColor: 'rgba(167,139,250,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={sectionTitle}><Brain size={12} /> 3 · Prepared Brand Brain update proposal</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Badge label="Prepared only — not applied" color={ACCENT} />
            <Badge label="Applied to Brand Brain: NO" color="#fbbf24" />
            <Badge label="Requires separate Owner approval" color="#60a5fa" />
          </div>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '8px 0 8px' }}>
          {proposal.note}
        </p>
        {proposal.proposedAdditions.length === 0 ? (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            No accepted candidates — nothing is proposed. Rejected and pending candidates are not used.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {proposal.proposedAdditions.map(a => (
              <div key={a.candidateId} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: 'rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px' }}>
                  <Badge label={a.kind} color={kindColor(a.kind)} />
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{a.basis}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.insight}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Decision audit trail ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={sectionTitle}><History size={12} /> 4 · Decision audit trail (local)</div>
        <div style={{ marginTop: '8px' }}>
          {orderedAudit.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>No decisions recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {orderedAudit.map(a => (
                <div key={a.id} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{a.at}</span>
                  <span><strong>{LEARNING_ACTION_LABEL[a.action]}</strong>{a.actor ? ` · ${a.actor}` : ''}{a.reason ? ` — ${a.reason}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Local helper actions (no external service, no network) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={handleCopy} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
        }}>
          {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
          {copied ? 'Copied!' : 'Copy learning review'}
        </button>
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide proposal preview' : 'Preview proposal text'}
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

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="bbl-report-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo learning review for {actorLabel || 'the Owner'}. Accepting a candidate prepares a Brand Brain update proposal only —
        Brand Brain is not updated automatically, nothing is persisted, and applying a proposal is a separate, later Owner-approved step.
        No live analytics, no connector, no AI/API/network call, no auto-post, no auto-ads.
      </p>
    </div>
  );
}
