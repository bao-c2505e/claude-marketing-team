// CORE V1 Flow Panel — CORE V1 Integration Closure
// ---------------------------------------------------------------------------
// The final "integration status" surface embedded in the Campaign Production
// Workspace (Phase K). It COMPOSES the already-built CORE modules into ONE
// visible, auditable, approval-first flow for the Owner:
//
//   • Official context — shows which APPLIED Brand Brain version grounds this
//     campaign (a draft / proposal / learning candidate is never official).
//   • Connector command handoff — turns this campaign's Owner-APPROVED assets into
//     approval-gated connector command previews. Every command carries "This
//     command does not publish content by itself"; building one runs no connector.
//   • Connector readiness — a read-only projection of the offline activation
//     ledger (all connectors live-blocked, read-only) + pending/blocked command
//     counts. No live health check is fired from here.
//   • Publishing evidence bridge — points the Owner to the Manual Publishing
//     Evidence section (below) to record what was published manually. Nothing here
//     marks anything Published.
//   • CORE V1 Flow status — the whole 9-stage chain with complete / blocked /
//     manual-required per step.
//
// It owns its own local UI state (target connector selection, built commands,
// copy flags), which is why it lives in a separate component — the parent
// CampaignWorkspace stays stateless (its Phase K source-scan test forbids state).
// Pure read of existing local data — no network client, no external auth, no
// callback URL, no secret, no persistence, no live connector run. A source-scan
// test enforces this. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output
// Status), §7 (Connectors).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  Workflow,
  ShieldCheck,
  ClipboardCopy,
  Check,
  Send,
  GitBranch,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type {
  RoleName,
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalEvent,
} from '../../types/core';
import { can } from '../../lib/auth/permissions';
import { buildBrandBrain, buildBrandContextSnapshot } from '../../lib/core/brandBrain';
import { initBrandBrainVersionHistory } from '../../lib/core/brandBrainVersioning';
import { collectCampaignPackItems } from '../../lib/core/campaignPack';
import {
  resolveActiveBrandBrainContext,
  buildCoreV1IntegrationStatus,
  summarizeCoreV1Flow,
  renderCoreV1FlowText,
  CORE_V1_FLOW_SAFETY_NOTES,
  CORE_V1_STAGE_STATUS_LABEL,
  CORE_V1_STAGE_STATUS_COLOR,
  type ActiveBrandBrainContext,
} from '../../lib/core/coreV1Integration';
import {
  buildConnectorCommands,
  setConnectorCommandStatus,
  summarizeConnectorCommands,
  renderConnectorCommandsText,
  suggestConnectorForModule,
  connectorTargetLabel,
  type ConnectorCommandStatus,
  CONNECTOR_COMMAND_TARGETS,
  CONNECTOR_COMMAND_STATUS_LABEL,
  CONNECTOR_COMMAND_STATUS_COLOR,
  CONNECTOR_COMMAND_DOES_NOT_PUBLISH,
  CONNECTOR_COMMAND_APPROVED_NOT_PUBLISHED,
  CONNECTOR_COMMAND_REQUIRES_EVIDENCE,
} from '../../lib/core/connectors/connectorCommand';
import { buildConnectorLedgerSummary } from '../../lib/core/connectors/connectorLedger';
import {
  getConnectorGovernance,
  CONNECTOR_ACTIVATION_STATUS_LABEL,
  type GovernedConnectorKey,
} from '../../lib/core/connectors/connectorGovernance';

interface Props {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  approvalRequests: ContentApprovalRequest[];
  approvalEvents: ContentApprovalEvent[];
  userRole: RoleName | null;
  actorLabel: string;
  /**
   * Receipt signals for the 9-stage flow projection, derived from the ONE shared
   * evidence state owned by ManualPublishingEvidenceSection (which renders this
   * panel — T4-11-B). Optional with a false default so a standalone render still
   * honestly shows those stages as manual-required / pending.
   */
  hasManualPublishingEvidence?: boolean;
  hasReviewedResult?: boolean;
}

const LEDGER_SUMMARY = buildConnectorLedgerSummary();

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '16px',
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px',
};

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

// Connectors offered as command targets for THIS campaign's approved modules.
const TARGET_CONNECTORS: GovernedConnectorKey[] = CONNECTOR_COMMAND_TARGETS;

export default function CoreV1FlowPanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole,
  hasManualPublishingEvidence = false,
  hasReviewedResult = false,
}: Props) {
  const canBuild = can.exportPacks(userRole);

  const [target, setTarget] = useState<GovernedConnectorKey>('canva');
  const [built, setBuilt] = useState<boolean>(false);
  // Local-only lifecycle overrides for built command previews (keyed by command id).
  // Purely presentational state — never persisted, never sent anywhere.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ConnectorCommandStatus>>({});
  const [copiedFlow, setCopiedFlow] = useState(false);
  const [copiedCmds, setCopiedCmds] = useState(false);

  // ── Official active context: only an APPLIED Brand Brain version (local/demo
  //    adapter — capture the current Brand Brain as a baseline version and read
  //    its current version). A draft/proposal/learning candidate is never used. ──
  const activeContext: ActiveBrandBrainContext | null = useMemo(() => {
    if (!brand) return null;
    const brain = buildBrandBrain({ brand, client, campaigns: [campaign], briefs, assets: [] });
    const history = initBrandBrainVersionHistory({ brain });
    return resolveActiveBrandBrainContext({ history, snapshot: buildBrandContextSnapshot(brain) });
  }, [brand, client, campaign, briefs]);

  // ── Approved deliverables for this campaign (approved-only by construction). ──
  const approvedItems = useMemo(() => collectCampaignPackItems({
    campaignId: campaign.id,
    contentItems,
    approvalRequests,
    approvalEvents,
    deliveryMap: {},
  }), [campaign.id, contentItems, approvalRequests, approvalEvents]);

  // Suggest a sensible default target from the first approved module.
  const suggested = approvedItems.length > 0 ? suggestConnectorForModule(approvedItems[0].module) : 'canva';

  // ── Connector command previews (built on demand, approval-gated). ──
  const baseCommands = useMemo(() => {
    if (!built || approvedItems.length === 0) return [];
    return buildConnectorCommands({ campaignId: campaign.id, items: approvedItems, targetConnector: target });
  }, [built, approvedItems, campaign.id, target]);

  // Apply the Owner's local lifecycle choices via the pure status transition —
  // safety flags are re-asserted on every transition and never change.
  const commands = useMemo(
    () => baseCommands.map(c => (statusOverrides[c.id] ? setConnectorCommandStatus(c, statusOverrides[c.id]) : c)),
    [baseCommands, statusOverrides],
  );

  const cmdSummary = useMemo(() => summarizeConnectorCommands(commands), [commands]);

  // ── Integration status projection (derived from local campaign state only). ──
  const pendingApprovalCount = approvalRequests.filter(r => r.status === 'submitted').length;
  const flowStates = useMemo(() => buildCoreV1IntegrationStatus({
    hasAppliedBrandBrainVersion: !!activeContext,
    appliedVersionLabel: activeContext?.versionLabel ?? null,
    hasCampaign: true,
    draftCount: contentItems.length,
    pendingApprovalCount,
    approvedCount: approvedItems.length,
    connectorCommandCount: commands.length,
    blockedConnectorCommandCount: cmdSummary.blocked,
    // Evidence / review receipts come from props, derived by the owning section
    // from the ONE shared evidence state (default false when rendered standalone).
    hasManualPublishingEvidence,
    hasReviewedResult,
    // Learning / proposal / apply are owned by the sibling stateful section —
    // this display panel can't read that local state, so those stages honestly
    // show as manual-required / pending here.
    learningCandidateCount: 0,
    hasBrandBrainProposal: false,
    proposalApproved: false,
    appliedNewVersion: false,
  }), [activeContext, contentItems.length, pendingApprovalCount, approvedItems.length, commands.length, cmdSummary.blocked, hasManualPublishingEvidence, hasReviewedResult]);

  const flowSummary = summarizeCoreV1Flow(flowStates);

  const handleBuild = useCallback(() => {
    if (!canBuild) return;
    setBuilt(true);
    setStatusOverrides({});
  }, [canBuild]);

  // Owner's per-command lifecycle choice — local state only. Marking a preview
  // simulated / approved-for-manual-run never runs, publishes, or sends anything.
  const markCommandStatus = useCallback((id: string, status: ConnectorCommandStatus) => {
    setStatusOverrides(prev => ({ ...prev, [id]: status }));
  }, []);

  const copyText = async (text: string, mark: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      mark(true);
      setTimeout(() => mark(false), 2000);
    } catch {
      /* clipboard unavailable — no-op; text is also visible on screen */
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--brand)' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Workflow size={18} style={{ color: 'var(--brand)' }} /> CORE V1 Flow — Integration Status
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Badge label="Approval-first" color="#fbbf24" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {flowSummary.complete}/{flowSummary.total} complete
            {flowSummary.blocked > 0 ? ` · ${flowSummary.blocked} blocked` : ''}
          </span>
        </div>
      </div>

      {/* ── Safety line ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(244,122,31,0.07)', border: '1px solid rgba(244,122,31,0.25)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <ShieldCheck size={15} style={{ color: 'var(--brand)', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <strong>{CONNECTOR_COMMAND_APPROVED_NOT_PUBLISHED}</strong>{' '}
          This screen connects the built CORE modules into one flow. It runs no connector, publishes nothing, and marks nothing Published — every step below is Owner-gated and manual.
        </div>
      </div>

      {/* ── 1. Official active context ── */}
      <div style={{ ...CARD_STYLE, marginBottom: '14px' }}>
        <div style={SECTION_LABEL_STYLE}><GitBranch size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />1. Official Brand Brain context</div>
        {activeContext ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Badge label={activeContext.versionLabel} color="#34d399" />
              <Badge label="Applied version = official" color="#60a5fa" />
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Brand: {activeContext.brandName}</span>
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0 }}>
              Campaign generation and previews use the applied Brand Brain version only. A draft, an update proposal, or a learning candidate is never used as official context.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            No brand resolved for this campaign yet — no applied Brand Brain version to use as official context.
          </p>
        )}
      </div>

      {/* ── 2. Connector command handoff ── */}
      <div style={{ ...CARD_STYLE, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <div style={{ ...SECTION_LABEL_STYLE, marginBottom: 0 }}><Send size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />2. Connector command handoff (approval-gated)</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{approvedItems.length} approved asset{approvedItems.length === 1 ? '' : 's'}</span>
        </div>
        <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>{CONNECTOR_COMMAND_DOES_NOT_PUBLISH}</strong> {CONNECTOR_COMMAND_REQUIRES_EVIDENCE}
        </p>

        {approvedItems.length === 0 ? (
          <div style={{ padding: '14px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '9px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            No approved assets yet. Approve this campaign's outputs in the Approval Queue — only approved assets can produce connector commands.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Target connector:</label>
              <select
                value={target}
                onChange={e => { setTarget(e.target.value as GovernedConnectorKey); setBuilt(false); setStatusOverrides({}); }}
                className="form-control"
                style={{ fontSize: '0.78rem', padding: '5px 8px', width: 'auto' }}
              >
                {TARGET_CONNECTORS.map(key => (
                  <option key={key} value={key}>{connectorTargetLabel(key)}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>suggested: {connectorTargetLabel(suggested)}</span>
              {canBuild ? (
                <button
                  onClick={handleBuild}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px',
                    fontSize: '0.78rem', fontWeight: 700, background: 'rgba(244,122,31,0.15)',
                    border: '1px solid rgba(244,122,31,0.5)', color: 'var(--brand)', cursor: 'pointer',
                  }}
                >
                  <Send size={13} /> Build command previews ({approvedItems.length})
                </button>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View-only — cannot build commands.</span>
              )}
            </div>

            {built && commands.length > 0 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {commands.map(c => {
                    // Lifecycle buttons: enabled for draft / ready_for_owner, shown
                    // disabled when blocked, hidden once the Owner already chose.
                    const showLifecycle = c.status === 'draft' || c.status === 'ready_for_owner' || c.status === 'blocked';
                    const lifecycleDisabled = c.status === 'blocked';
                    const lifecycleBtnStyle: React.CSSProperties = {
                      padding: '4px 9px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                      color: lifecycleDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: lifecycleDisabled ? 'not-allowed' : 'pointer',
                      opacity: lifecycleDisabled ? 0.5 : 1, whiteSpace: 'nowrap',
                    };
                    return (
                      <div key={c.id} className="op-row" style={{ padding: '9px 11px', alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.79rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.sourceAssetTypeLabel} <ArrowRight size={11} style={{ verticalAlign: '-1px' }} /> {c.targetConnectorLabel}: {c.sourceAssetTitle}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                            from approved asset {c.sourceApprovalId} · approved by {c.approvalEvidence.approvedBy}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {showLifecycle && (
                            <>
                              <button
                                disabled={lifecycleDisabled}
                                onClick={() => markCommandStatus(c.id, 'simulated')}
                                style={lifecycleBtnStyle}
                              >
                                Mark simulated (dry-run)
                              </button>
                              <button
                                disabled={lifecycleDisabled}
                                onClick={() => markCommandStatus(c.id, 'approved_for_manual_run')}
                                style={lifecycleBtnStyle}
                              >
                                Approve for manual run
                              </button>
                            </>
                          )}
                          <Badge label={CONNECTOR_COMMAND_STATUS_LABEL[c.status]} color={CONNECTOR_COMMAND_STATUS_COLOR[c.status]} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => copyText(renderConnectorCommandsText(commands, campaign.name), setCopiedCmds)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px',
                    fontSize: '0.76rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  {copiedCmds ? <Check size={13} /> : <ClipboardCopy size={13} />} {copiedCmds ? 'Copied!' : 'Copy command handoff'}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── 3. Connector readiness (read-only projection of offline ledger) ── */}
      <div style={{ ...CARD_STYLE, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ ...SECTION_LABEL_STYLE, marginBottom: 0 }}><Lock size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />3. Connector readiness</div>
          <Badge label={`${LEDGER_SUMMARY.liveCount} of ${LEDGER_SUMMARY.total} live`} color="#34d399" />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '8px 0 10px' }}>
          Read-only — no connector is live and no live health check is fired from here. Last safety check: read-only ledger (always live-blocked).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
          {(['n8n', 'google_drive', 'canva', 'meta'] as GovernedConnectorKey[]).map(key => {
            const gov = getConnectorGovernance(key);
            return (
              <div key={key} style={{ border: '1px solid var(--border-subtle)', borderRadius: '9px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{gov?.displayName ?? key}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {gov ? CONNECTOR_ACTIVATION_STATUS_LABEL[gov.activationStatus] : 'Future only'} · live blocked
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <Badge label={`${cmdSummary.readyForOwner} command${cmdSummary.readyForOwner === 1 ? '' : 's'} ready for Owner`} color="#60a5fa" />
          <Badge label={`${cmdSummary.blocked} blocked`} color={cmdSummary.blocked > 0 ? '#f87171' : '#94a3b8'} />
        </div>
      </div>

      {/* ── 4. Publishing evidence bridge ── */}
      <div style={{ ...CARD_STYLE, marginBottom: '14px', borderLeft: '3px solid var(--warning)' }}>
        <div style={SECTION_LABEL_STYLE}>4. Manual publishing evidence — required before Published</div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
          A connector command being run or simulated is <strong>not Published</strong>. To mark anything published, the Owner must record manual evidence (link / screenshot / time / note) in the <strong>Manual Publishing Evidence</strong> section below. CORE never marks anything Published automatically.
        </p>
      </div>

      {/* ── 5. Whole-flow status chain ── */}
      <div style={CARD_STYLE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div style={{ ...SECTION_LABEL_STYLE, marginBottom: 0 }}>5. CORE V1 flow — end to end</div>
          <button
            onClick={() => copyText(renderCoreV1FlowText(flowStates, activeContext, campaign.name), setCopiedFlow)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '7px',
              fontSize: '0.74rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {copiedFlow ? <Check size={12} /> : <ClipboardCopy size={12} />} {copiedFlow ? 'Copied!' : 'Copy flow status'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {flowStates.map(st => {
            const color = CORE_V1_STAGE_STATUS_COLOR[st.status];
            return (
              <div key={st.key} className="op-row" style={{ padding: '9px 11px', alignItems: 'center', borderLeft: `3px solid ${color}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.79rem', fontWeight: 600 }}>{st.order}. {st.label}</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{st.detail}</div>
                </div>
                <Badge label={CORE_V1_STAGE_STATUS_LABEL[st.status]} color={color} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>Flow safety</div>
          {CORE_V1_FLOW_SAFETY_NOTES.map((note, i) => (
            <div key={i} style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>• {note}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
