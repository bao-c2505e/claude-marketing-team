// Brand Brain Manual Apply Room & Versioned Audit Trail (Phase Z) — SAFE, LOCAL/DEMO panel
// ---------------------------------------------------------------------------
// Sits BELOW the Phase Y Brand Brain Update Proposal panel inside the Campaign
// Production Workspace. It is the SEPARATE, explicit Owner MANUAL APPLY step for a
// Phase Y proposal that the Owner has already APPROVED:
//
//   • Approving a proposal (Phase Y) only marks it `ready_for_manual_apply`. It is
//     NEVER auto-applied and Brand Brain changes are NOT active until the Owner
//     explicitly applies them here.
//   • ONLY an Owner-approved proposal can be applied. Pending / rejected /
//     revision-requested proposals are blocked with a visible reason.
//   • Applying APPENDS a new Brand Brain version built from the proposal's proposed
//     after-snapshot. Every previous version is preserved (append-only). A
//     before/after diff preview is shown before apply.
//   • Version history + a full audit trail (baseline, proposal approved, apply
//     requested, version created). A NON-DESTRUCTIVE rollback PREVIEW only — no
//     version is ever overwritten or deleted.
//   • Owner-only authority (can.publishContent). Local/demo only: no network, no
//     connector, no AI/API call, no live analytics, no persistence. Copy is
//     clipboard-only.
//
// Version history state is held locally here (React state). The pure model is
// unit-tested in brandBrainVersioning.test.ts; a source-scan test enforces this
// panel's safety posture. See CLAUDE.md §3/§4/§6/§7.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Check,
  ClipboardCopy,
  Eye,
  EyeOff,
  GitCompare,
  History,
  Layers,
  Undo2,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import type { Campaign, Client, Brand, CampaignBrief, AssetItem, RoleName } from '../../types/core';
import { can } from '../../lib/auth/permissions';
import { buildBrandBrain } from '../../lib/core/brandBrain';
import { toSectionSnapshot, type BrandBrainUpdateProposal } from '../../lib/core/brandBrainUpdateProposal';
import {
  initBrandBrainVersionHistory,
  applyApprovedProposal,
  checkApplyEligibility,
  previewApply,
  previewRollback,
  listApplyAudit,
  renderVersionHistoryText,
  APPLY_BLOCK_REASON_LABEL,
  BRAND_BRAIN_APPLY_ACTION_LABEL,
  BRAND_BRAIN_APPLY_LOCAL_ONLY_BADGES,
  BRAND_BRAIN_APPLY_SAFETY_NOTES,
  type BrandBrainVersionHistory,
  type VersionDiff,
} from '../../lib/core/brandBrainVersioning';

interface Props {
  campaign: Campaign;
  brand: Brand | null;
  client: Client | null;
  brief: CampaignBrief | null;
  assets: AssetItem[];
  userRole: RoleName | null;
  actorLabel: string;
  /** The current Phase Y proposal (any status) mirrored up from the panel above. */
  proposal: BrandBrainUpdateProposal | null;
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

/** Small before/after diff renderer reused for apply + rollback previews. */
function DiffPreview({ diff }: { diff: VersionDiff }) {
  if (!diff.hasChanges) {
    return (
      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        No net-new changes between these versions.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {diff.entries.map(e => (
        <div key={e.section} style={{ border: '1px solid var(--border-color)', borderRadius: '9px', padding: '11px 13px', background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '7px' }}>{e.sectionLabel}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}>Before</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                {e.before.length ? e.before.join(' · ') : <em>(empty)</em>}
              </div>
            </div>
            <div>
              <div style={labelStyle}>After</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                {e.after.length ? e.after.map((v, i) => (
                  <span key={i} style={{ color: e.additions.some(a => a.toLowerCase() === v.toLowerCase()) ? ACCENT : 'var(--text-muted)' }}>
                    {v}{i < e.after.length - 1 ? ' · ' : ''}
                  </span>
                )) : <em>(empty)</em>}
              </div>
            </div>
          </div>
          {e.additions.length > 0 && (
            <div style={{ fontSize: '0.66rem', color: ACCENT, marginTop: '7px' }}>+ adds: {e.additions.join(' · ')}</div>
          )}
          {e.removals.length > 0 && (
            <div style={{ fontSize: '0.66rem', color: '#f87171', marginTop: '4px' }}>− removes: {e.removals.join(' · ')}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BrandBrainManualApplyPanel({
  campaign, brand, client, brief, assets, userRole, actorLabel, proposal,
}: Props) {
  const canApply = can.publishContent(userRole);

  // The current Brand Brain source of truth (read-only — never mutated here).
  const brain = useMemo(
    () => brand
      ? buildBrandBrain({ brand, client, campaigns: [campaign], briefs: brief ? [brief] : [], assets })
      : null,
    [brand, client, campaign, brief, assets],
  );

  // Local/demo version history. Initialized from the current Brand Brain baseline
  // (v1). Applying an approved proposal APPENDS versions — nothing is persisted.
  const [history, setHistory] = useState<BrandBrainVersionHistory | null>(null);

  // (Re)capture the baseline whenever the underlying Brand Brain changes. A change
  // to the baseline snapshot means a fresh history (previous local versions drop).
  const baselineSig = useMemo(
    () => (brain ? JSON.stringify(toSectionSnapshot(brain)) : ''),
    [brain],
  );
  useEffect(() => {
    if (!brain) { setHistory(null); return; }
    setHistory(initBrandBrainVersionHistory({ brain }));
    setRollbackTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineSig]);

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<number | null>(null);

  // Only an owner-approved, ready-for-manual-apply proposal is eligible.
  const blockReason = useMemo(
    () => (history && proposal ? checkApplyEligibility(history, proposal) : null),
    [history, proposal],
  );
  const applyPreview = useMemo(
    () => (history && proposal && !blockReason ? previewApply(history, proposal) : null),
    [history, proposal, blockReason],
  );
  const rollbackPreview = useMemo(
    () => (history && rollbackTarget != null ? previewRollback(history, rollbackTarget) : null),
    [history, rollbackTarget],
  );

  const doApply = useCallback(() => {
    if (!canApply || !proposal) return;
    setHistory(prev => {
      if (!prev) return prev;
      const outcome = applyApprovedProposal(prev, proposal, { actor: actorLabel || 'Owner' });
      return outcome.applied ? outcome.history : prev;
    });
  }, [canApply, proposal, actorLabel]);

  const previewText = useMemo(
    () => (history ? renderVersionHistoryText(history, campaign.name) : ''),
    [history, campaign.name],
  );
  const orderedAudit = useMemo(() => (history ? listApplyAudit(history) : []), [history]);

  const handleCopy = useCallback(async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('bbma-report-text') as HTMLTextAreaElement | null;
      if (el) { el.value = previewText; el.select(); }
    }
  }, [previewText]);

  const proposalApproved = proposal?.proposalStatus === 'owner_approved' && proposal.ready_for_manual_apply;

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Layers size={18} style={{ color: ACCENT }} /> Brand Brain Manual Apply Room — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {BRAND_BRAIN_APPLY_LOCAL_ONLY_BADGES.map(b => <Badge key={b} label={b} color={ACCENT} />)}
        </div>
      </div>

      {/* ── Safety banner ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ede9fe' }}>
          <strong>Approved proposal is only ready for manual apply.</strong>{' '}
          <strong>Brand Brain changes are not active until the Owner applies them.</strong>{' '}
          Applying appends a new Brand Brain version and preserves every previous version — it is never auto-applied.
          Approved ≠ Published. Client Accepted ≠ Published. This is not based on live analytics.
        </div>
      </div>

      {/* ── 1. Approved proposal ── */}
      <div style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={sectionTitle}><Brain size={12} /> 1 · Approved proposal to apply</div>
        <div style={{ marginTop: '10px' }}>
          {!proposal ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              No proposal prepared yet. Prepare and approve a Brand Brain update proposal in the panel above — only an
              Owner-approved proposal is ready for a manual apply here.
            </div>
          ) : proposalApproved ? (
            <div style={{ border: '1px solid rgba(52,211,153,0.4)', borderRadius: '8px', padding: '10px 12px', background: 'rgba(52,211,153,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '5px' }}>
                <Badge label="Owner-approved" color="#34d399" />
                <Badge label="Ready for manual apply (not auto-applied)" color="#60a5fa" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Brand <strong>{proposal.brandName}</strong> · {proposal.diffSummary.changedSections} section(s) ·
                {' '}{proposal.diffSummary.totalAdditions} addition(s){proposal.ownerDecision.decidedBy ? ` · approved by ${proposal.ownerDecision.decidedBy}` : ''}.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.76rem', color: '#fbbf24', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              <AlertTriangle size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
              This proposal is not Owner-approved yet. Only an approved proposal can be applied — approve it in the panel above first.
            </div>
          )}
        </div>
      </div>

      {!brain && (
        <div style={{ ...cardStyle, marginBottom: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          No brand context available for this campaign yet — a Brand Brain baseline is required before any version can be applied.
        </div>
      )}

      {history && (
        <>
          {/* ── 2. Before / after diff preview (apply) ── */}
          <div style={{ ...cardStyle, marginBottom: '12px' }}>
            <div style={sectionTitle}><GitCompare size={12} /> 2 · Before / after diff preview (current version → proposed)</div>
            <div style={{ marginTop: '10px' }}>
              {applyPreview ? (
                <DiffPreview diff={applyPreview} />
              ) : (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {blockReason
                    ? APPLY_BLOCK_REASON_LABEL[blockReason]
                    : 'Approve a proposal above to preview the change it would apply to the Brand Brain.'}
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Manual apply gate ── */}
          <div style={{ ...cardStyle, marginBottom: '12px', borderColor: 'rgba(167,139,250,0.35)' }}>
            <div style={sectionTitle}><PlayCircle size={12} /> 3 · Manual apply gate</div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '8px 0' }}>
              Applying creates a <strong>new Brand Brain version</strong> from the approved proposal and preserves every
              previous version. Brand Brain changes are <strong>not active until you apply them</strong> — the change is
              never auto-applied, never published, and never launched.
            </p>
            {!canApply ? (
              <p style={{ fontSize: '0.72rem', color: '#fbbf24', margin: 0 }}>
                Owner role required to apply a Brand Brain update. Owner is the only approval authority.
              </p>
            ) : (
              <button
                onClick={doApply}
                disabled={!!blockReason || !proposal}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px',
                  fontSize: '0.78rem', fontWeight: 600,
                  background: blockReason || !proposal ? 'rgba(255,255,255,0.04)' : `${ACCENT}26`,
                  border: `1px solid ${ACCENT}73`, color: ACCENT,
                  cursor: blockReason || !proposal ? 'default' : 'pointer',
                  opacity: blockReason || !proposal ? 0.5 : 1,
                }}
              >
                <PlayCircle size={14} /> Apply approved proposal → create Brand Brain v{history.currentVersionNumber + 1}
              </button>
            )}
            {blockReason && proposal && (
              <p style={{ fontSize: '0.72rem', color: '#fbbf24', margin: '10px 0 0' }}>{APPLY_BLOCK_REASON_LABEL[blockReason]}</p>
            )}
          </div>

          {/* ── 4. Version history (append-only) ── */}
          <div style={{ ...cardStyle, marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={sectionTitle}><Layers size={12} /> 4 · Version history (append-only)</div>
              <Badge label={`Current: v${history.currentVersionNumber} of ${history.versions.length}`} color={ACCENT} />
            </div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {history.versions.map(v => {
                const isCurrent = v.versionNumber === history.currentVersionNumber;
                return (
                  <div key={v.versionId} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: isCurrent ? 'rgba(167,139,250,0.08)' : 'rgba(0,0,0,0.18)' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge label={`v${v.versionNumber}`} color={isCurrent ? ACCENT : '#94a3b8'} />
                      <Badge label={v.origin === 'baseline' ? 'Baseline' : 'Manual apply'} color={v.origin === 'baseline' ? '#94a3b8' : '#34d399'} />
                      {isCurrent && <Badge label="Current" color={ACCENT} />}
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{v.createdAt}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {v.appliedBy ? `Applied by ${v.appliedBy}` : 'Captured baseline'}
                      {v.sourceProposalId ? ` · from proposal ${v.sourceProposalId}` : ''}
                      {v.note ? ` · ${v.note}` : ''}
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => setRollbackTarget(t => (t === v.versionNumber ? null : v.versionNumber))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px', marginTop: '7px', padding: '5px 10px', borderRadius: '6px',
                          fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                        }}
                      >
                        <Eye size={11} /> {rollbackTarget === v.versionNumber ? 'Hide rollback preview' : `Preview rollback to v${v.versionNumber}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5. Rollback preview (non-destructive, read-only) ── */}
          {rollbackPreview && (
            <div style={{ ...cardStyle, marginBottom: '12px' }}>
              <div style={sectionTitle}><Undo2 size={12} /> 5 · Rollback preview → v{rollbackTarget} (read-only, non-destructive)</div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '7px 0 10px' }}>
                This is a preview only. No version is overwritten or deleted — rolling back is not applied.
              </p>
              <DiffPreview diff={rollbackPreview} />
            </div>
          )}

          {/* ── 6. Audit trail ── */}
          <div style={{ ...cardStyle, marginBottom: '14px' }}>
            <div style={sectionTitle}><History size={12} /> 6 · Apply audit trail (local)</div>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {orderedAudit.map(a => (
                <div key={a.id} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{a.at}</span>
                  <span>
                    <strong>{BRAND_BRAIN_APPLY_ACTION_LABEL[a.action]}</strong>
                    {a.actor ? ` · ${a.actor}` : ''}
                    {a.toVersion != null ? ` → v${a.toVersion}` : ''}
                    {a.notes ? ` — ${a.notes}` : ''}
                  </span>
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
              {copied ? 'Copied!' : 'Copy version history'}
            </button>
            <button onClick={() => setShowPreview(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? 'Hide history text' : 'Preview history text'}
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
      <textarea id="bbma-report-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo Brand Brain manual apply room for {actorLabel || 'the Owner'}. {BRAND_BRAIN_APPLY_SAFETY_NOTES[1]} Applying an
        approved proposal appends a new version and preserves every previous version; rollback here is a preview only, never
        destructive. This is not based on live analytics; no connector, no AI/API/network call, no auto-post, no auto-ads.
      </p>
    </div>
  );
}
