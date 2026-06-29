// Manual Publishing Result Review & Campaign Learning Loop — Phase W
// ---------------------------------------------------------------------------
// A SAFE, LOCAL/DEMO REVIEW layer that sits below the Phase V Manual Publishing
// Evidence panel inside the Campaign Production Workspace. It REVIEWS — never
// gathers — Owner-provided manual result data (Phase V evidence) and shows a
// deterministic result summary, risk flags, repeat/avoid recommendations, next
// actions, and a Brand Brain LEARNING CANDIDATE PREVIEW for the Owner to review:
//
//   • Manual review only. CORE pulls nothing: NO live analytics, NO connector,
//     NO live Meta/TikTok/Zalo/Google/Canva call, NO AI/API/network call, no
//     credentials, no external endpoint. Every value shown is one the Owner already typed.
//   • Does not change Published status. Published still means only a manual Owner
//     record (Phase V); approved / client-accepted / scheduled are never published.
//   • Learning candidate only — NOT persisted to Brand Brain yet. Brand Brain is
//     never written to or auto-updated from here; candidates are previews for the
//     Owner. Approved ≠ Published and Client Accepted ≠ Published stay explicit.
//
// Self-contained on purpose so the parent CampaignWorkspace stays stateless. A
// source-scan test (`ManualResultReviewPanel.source.test.ts`) enforces the safety
// posture. The pure model logic is unit-tested in `manualResultReview.test.ts`.
// See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status), §7 (Connectors).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Eye,
  EyeOff,
  Check,
  Brain,
  TrendingUp,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import type { Campaign, RoleName } from '../../types/core';
import { can } from '../../lib/auth/permissions';
import type { ManualPublishingEvidence } from '../../lib/core/manualPublishingEvidence';
import {
  buildManualResultReview,
  renderManualResultReviewText,
  REVIEW_STATUS_COLOR,
  REVIEW_STATUS_DESCRIPTION,
  PERFORMANCE_SIGNAL_COLOR,
  RISK_FLAG_COLOR,
  RESULT_REVIEW_LOCAL_ONLY_BADGES,
  type ManualResultReviewEntryInput,
} from '../../lib/core/manualResultReview';

interface Props {
  campaign: Campaign;
  userRole: RoleName | null;
  actorLabel: string;
  /**
   * The ACTUAL Owner-provided manual publishing evidence/result state (shared, lifted
   * from the section wrapper). This panel reviews ONLY this — it seeds no sample of its
   * own, so an empty list correctly yields `no_manual_evidence` (cannot review).
   */
  evidence: ManualPublishingEvidence[];
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

function bulletList(items: string[], color: string, empty: string) {
  if (items.length === 0) {
    return <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{empty}</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
          <span style={{ color, flexShrink: 0, marginTop: '1px' }}>•</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

export default function ManualResultReviewPanel({ campaign, userRole, actorLabel, evidence }: Props) {
  // ── UI-only local state. The result data reviewed here is the ACTUAL shared evidence
  //    passed in via props — this panel invents/seeds nothing. Phase V carries no spend
  //    field, so no spend is assumed (the spend rule stays a domain capability). ──
  const entries = useMemo<ManualResultReviewEntryInput[]>(
    () => evidence.map(e => ({ evidence: e })),
    [evidence],
  );
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAct = can.exportPacks(userRole);

  const review = useMemo(() => buildManualResultReview(entries), [entries]);
  const previewText = useMemo(() => renderManualResultReviewText(review, campaign.name), [review, campaign.name]);

  // ── Owner data needed next — a focused, deterministic checklist. ──
  const dataNeeded = useMemo(() => {
    const out: string[] = [];
    if (review.reviewStatus === 'no_manual_evidence') {
      out.push('Manual publishing evidence: channel, who published, and a screenshot or public URL.');
    }
    if (review.reviewStatus === 'evidence_logged_result_pending') {
      out.push('Result metrics after 24h / 3 days / 7 days: reach, messages, orders, revenue.');
    }
    if (review.riskFlags.includes('incomplete_conversion_data')) {
      out.push('Conversion metrics (messages / orders / revenue) to match the recorded spend.');
    }
    if (review.riskFlags.includes('weak_attribution')) {
      out.push('Evidence (screenshot or URL) + an Owner/Client-provided data source for orders/revenue.');
    }
    if (review.riskFlags.includes('unverified_metrics')) {
      out.push('A real data source (Owner-provided or Client-provided) so metrics count as real.');
    }
    if (out.length === 0) {
      out.push('No additional Owner data strictly required — optional: add more data points to raise confidence.');
    }
    return out;
  }, [review]);

  const handleCopy = useCallback(async () => {
    if (!canAct) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('mrr-report-text') as HTMLTextAreaElement | null;
      if (el) { el.value = previewText; el.select(); }
    }
  }, [canAct, previewText]);

  const statusColor = REVIEW_STATUS_COLOR[review.reviewStatus];
  const signalColor = PERFORMANCE_SIGNAL_COLOR[review.performanceSignal];

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Brain size={18} style={{ color: ACCENT }} /> Manual Result Review &amp; Learning Loop — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {RESULT_REVIEW_LOCAL_ONLY_BADGES.map(b => <Badge key={b} label={b} color={ACCENT} />)}
          <Badge label="Does not change Published status" color="#fbbf24" />
        </div>
      </div>

      {/* ── Safety banner: manual review only, no live analytics, learning candidate only ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ede9fe' }}>
          <strong>Manual review only.</strong> Reviews only the manual publishing evidence recorded above — nothing is invented.{' '}
          Uses Owner-provided manual result data. <strong>No live analytics</strong> connected.{' '}
          <strong>Does not change Published status.</strong> <strong>Learning candidate only</strong> — Not persisted to Brand Brain yet.{' '}
          Approved ≠ Published. Client Accepted ≠ Published.
        </div>
      </div>

      {/* ── 1. Review status ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><CheckCircle2 size={12} /> 1 · Review status</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 6px' }}>
          <Badge label={review.review_status_label} color={statusColor} />
          <Badge label={`${review.publishedEntryCount} manually published`} color="#a78bfa" />
          <Badge label={`${review.reviewedEntryCount} reviewed`} color="#34d399" />
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
          {REVIEW_STATUS_DESCRIPTION[review.reviewStatus]}
        </p>
      </div>

      {/* ── 2. Evidence quality ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><ShieldCheck size={12} /> 2 · Evidence quality</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
          <Badge label={`Evidence: ${review.evidence_quality_label}`} color="#60a5fa" />
          <Badge label={`Attribution: ${review.attribution_quality_label}`} color="#60a5fa" />
          <Badge label={`Confidence: ${review.confidence_label}`} color="#34d399" />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
          Quality reflects Owner-provided evidence (screenshot/URL) and data source only — never a live analytics pull.
        </p>
      </div>

      {/* ── 3. Result summary ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><BarChart3 size={12} /> 3 · Result summary</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, margin: '8px 0 6px' }}>{review.resultSummary.headline}</p>
        {review.resultSummary.providedMetricLines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
            {review.resultSummary.providedMetricLines.map((m, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m}</div>
            ))}
          </div>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{review.resultSummary.basis}</p>
      </div>

      {/* ── 4. Performance signal ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><TrendingUp size={12} /> 4 · Performance signal</div>
        <div style={{ marginTop: '8px' }}>
          <Badge label={review.performance_signal_label} color={signalColor} />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
          Based on provided manual data only — this is not a live-analytics verdict and does not declare success/failure from absent data.
        </p>
      </div>

      {/* ── 5. Risk flags ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><AlertTriangle size={12} /> 5 · Risk flags (incomplete / risky data)</div>
        <div style={{ marginTop: '8px' }}>
          {review.risk_flag_details.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>No risk flags detected in the provided manual data.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {review.risk_flag_details.map(d => (
                <div key={d.flag} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Badge label={d.label} color={RISK_FLAG_COLOR[d.flag]} />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{d.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 6 + 7. Repeat / Avoid recommendations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div style={cardStyle}>
          <div style={sectionTitle}><Sparkles size={12} /> 6 · Repeat recommendations</div>
          <div style={{ marginTop: '8px' }}>
            {bulletList(review.repeatRecommendations, '#34d399', 'No repeat recommendation yet — needs reviewed result data.')}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={sectionTitle}><AlertTriangle size={12} /> 7 · Avoid recommendations</div>
          <div style={{ marginTop: '8px' }}>
            {bulletList(review.avoidRecommendations, '#f87171', 'No avoid recommendation from the provided notes.')}
          </div>
        </div>
      </div>

      {/* ── 8. Next action suggestions ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><ListChecks size={12} /> 8 · Next action suggestions</div>
        <div style={{ marginTop: '8px' }}>
          {bulletList(review.nextActionSuggestions, ACCENT, 'No next action.')}
        </div>
      </div>

      {/* ── 9. Brand Brain learning candidate preview ── */}
      <div style={{ ...cardStyle, marginBottom: '12px', borderColor: 'rgba(167,139,250,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={sectionTitle}><Brain size={12} /> 9 · Brand Brain learning candidate (preview)</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Badge label="Preview only" color={ACCENT} />
            <Badge label="Not persisted to Brand Brain yet" color="#fbbf24" />
            <Badge label={`Sufficiency: ${review.brandBrainLearningCandidatePreview.sufficiency}`} color="#94a3b8" />
          </div>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '8px 0 8px' }}>
          {review.brandBrainLearningCandidatePreview.note} Brand Brain is never written to or changed here — these are candidates for Owner review.
        </p>
        {review.brandBrainLearningCandidatePreview.candidates.length === 0 ? (
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>No learning candidates yet — insufficient provided data.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {review.brandBrainLearningCandidatePreview.candidates.map((c, i) => (
              <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: 'rgba(0,0,0,0.18)' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px' }}>
                  <Badge label={c.label} color={c.kind === 'repeat' ? '#34d399' : c.kind === 'avoid' ? '#f87171' : '#fbbf24'} />
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{c.basis}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.insight}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 10. Owner data needed next ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={sectionTitle}><ListChecks size={12} /> 10 · Owner data needed next</div>
        <div style={{ marginTop: '8px' }}>
          {bulletList(dataNeeded, '#60a5fa', 'No additional data needed.')}
        </div>
      </div>

      {/* ── Local helper actions (no external service, no network) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {canAct && (
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
            background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
          }}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copied!' : 'Copy review summary'}
          </button>
        )}
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide review preview' : 'Preview review summary'}
        </button>
      </div>

      {showPreview && (
        <textarea
          readOnly
          value={previewText}
          style={{
            width: '100%', minHeight: '300px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="mrr-report-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo manual result review for {actorLabel || 'the Owner/team'}. CORE reviews ONLY Owner-provided manual result data —
        it pulls no live analytics, calls no connector, makes no AI/API/network call, and never changes the Published status.
        Learnings are candidates for Owner review and are not persisted to Brand Brain.
      </p>
    </div>
  );
}
