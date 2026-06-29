// Manual Publishing Evidence & Result Intake Room — Phase V
// ---------------------------------------------------------------------------
// A SAFE, LOCAL/DEMO post-delivery evidence layer that sits below the Phase U
// Delivery Closure panel inside the Campaign Production Workspace. After a delivery
// has been accepted/closed, it lets the Owner MANUALLY RECORD whether the delivered
// assets were actually published OUTSIDE CORE — without CORE publishing anything:
//
//   • Local/demo only: NO publishing, NO ads, NO live Meta/TikTok/Zalo/Google/Canva
//     connector, NO real endpoint call, NO live credentials/API, NO live analytics pull,
//     NO network call. The evidence rows / statuses / manual result metrics are CONTROLLED
//     via props — the shared state is lifted to <ManualPublishingEvidenceSection> and defaults
//     EMPTY; the deterministic `sampleManualPublishingEvidence` mock is loaded ONLY via the
//     explicit, clearly-labeled "Load example data (sample)" opt-in, never auto-seeded as real data.
//   • CORE does not publish. Every value is Owner/Client-provided (or simulated demo)
//     EVIDENCE. A recorded `publicUrl` is the Owner pasting where THEY published — it is
//     data, not an action Core took. "Manually published" only RECORDS a manual outside-
//     CORE publish; `scheduled_outside_core` is explicitly NOT published.
//   • Approved ≠ Published and Client Accepted ≠ Published stay explicit. Result metrics
//     are labeled Owner/Client-provided vs simulated/unverified — never presented as real
//     unless owner/client-provided, and there is no live analytics anywhere.
//   • Nothing here mutates approval state. Approval decisions stay in the Approval Queue.
//
// The shared evidence/result state is OWNED by <ManualPublishingEvidenceSection> (so the parent
// CampaignWorkspace stays stateless and its Phase K source-scan safety test keeps holding), and
// the Phase W <ManualResultReviewPanel> reviews the SAME state. A source-scan test
// (`ManualPublishingEvidencePanel.source.test.ts`) enforces the safety posture.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Trash2,
  ClipboardCopy,
  Eye,
  EyeOff,
  BarChart3,
  Link2,
  Check,
} from 'lucide-react';
import type { Campaign, RoleName } from '../../types/core';
import { can } from '../../lib/auth/permissions';
import {
  addEvidence,
  updateEvidence,
  removeEvidence,
  listEvidence,
  validateEvidence,
  buildPublishingEvidenceReport,
  renderPublishingEvidenceReportText,
  sampleManualPublishingEvidence,
  PUBLISH_STATUSES,
  PUBLISH_STATUS_LABEL,
  PUBLISH_STATUS_COLOR,
  RESULT_DATA_SOURCES,
  RESULT_DATA_SOURCE_LABEL,
  RESULT_DATA_SOURCE_COLOR,
  RESULT_METRIC_KEYS,
  RESULT_METRIC_LABEL,
  SAMPLE_PUBLISH_CHANNELS,
  type ManualPublishingEvidence,
  type PublishStatus,
  type ResultDataSource,
  type ResultMetricKey,
  type ResultMetrics,
} from '../../lib/core/manualPublishingEvidence';

interface Props {
  campaign: Campaign;
  userRole: RoleName | null;
  actorLabel: string;
  /**
   * Controlled: the shared manual publishing evidence/result state, lifted to the section
   * wrapper so the Phase W result-review panel reviews the SAME Owner-provided evidence.
   * Defaults to empty there — nothing is presented as published until the Owner records it.
   */
  evidence: ManualPublishingEvidence[];
  /** Controlled: report a NEW evidence array up to the owning section (pure transforms). */
  onChange: (next: ManualPublishingEvidence[]) => void;
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
const ctrlStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
  borderRadius: '7px', padding: '7px 10px', color: 'var(--text-primary)',
  fontSize: '0.8rem', fontFamily: 'inherit',
};
const fieldLabel: React.CSSProperties = {
  fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px',
};

export default function ManualPublishingEvidencePanel({ campaign, userRole, actorLabel, evidence, onChange }: Props) {
  // ── UI-only local state (no persistence, no network). Evidence is lifted/controlled. ──
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAct = can.exportPacks(userRole);

  const rows = useMemo(() => listEvidence(evidence), [evidence]);
  const report = useMemo(() => buildPublishingEvidenceReport(evidence), [evidence]);
  const previewText = useMemo(() => renderPublishingEvidenceReportText(report, campaign.name), [report, campaign.name]);

  // ── Local mutators — pure transforms reported up via onChange (no external effect). ──
  const handleAdd = useCallback(() => {
    if (!canAct) return;
    onChange(addEvidence(evidence, {
      campaignId: campaign.id,
      channel: '',
      publishStatus: 'not_published',
      resultDataSource: 'not_provided',
    }));
  }, [canAct, campaign.id, evidence, onChange]);

  // Opt-in EXAMPLE seed — clearly labeled sample data, NOT real Owner results. Never auto-loaded.
  const handleLoadExample = useCallback(() => {
    if (!canAct) return;
    onChange(sampleManualPublishingEvidence(campaign.id));
  }, [canAct, campaign.id, onChange]);

  const handleRemove = useCallback((id: string) => {
    if (!canAct) return;
    onChange(removeEvidence(evidence, id));
  }, [canAct, evidence, onChange]);

  const patch = useCallback((id: string, p: Partial<Parameters<typeof updateEvidence>[2]>) => {
    if (!canAct) return;
    onChange(updateEvidence(evidence, id, p));
  }, [canAct, evidence, onChange]);

  const patchMetric = useCallback((row: ManualPublishingEvidence, key: ResultMetricKey, raw: string) => {
    if (!canAct) return;
    const next: ResultMetrics = { ...(row.metrics ?? {}) };
    if (raw.trim() === '') {
      delete next[key];
    } else {
      const n = Number(raw);
      if (Number.isFinite(n)) next[key] = n;
    }
    onChange(updateEvidence(evidence, row.id, { metrics: next }));
  }, [canAct, evidence, onChange]);

  const handleCopy = useCallback(async () => {
    if (!canAct) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('mpe-report-text') as HTMLTextAreaElement | null;
      if (el) { el.value = previewText; el.select(); }
    }
  }, [canAct, previewText]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ClipboardList size={18} style={{ color: ACCENT }} /> Manual Publishing Evidence — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {report.local_only_badges.map(b => <Badge key={b} label={b} color={ACCENT} />)}
          <Badge label="Not Published by CORE" color="#fbbf24" />
        </div>
      </div>

      {/* ── Warning banner: CORE does not publish — Owner-provided evidence only ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ccfbf1' }}>
          <strong>{report.core_does_not_publish_note}</strong>{' '}
          <strong>{report.no_live_analytics_note}</strong> {report.manual_evidence_only_note}{' '}
          Approved ≠ Published. Client Accepted ≠ Published.
        </div>
      </div>

      {/* ── Publishing status summary ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><CheckCircle2 size={11} style={{ marginRight: '4px' }} />Publishing Status (manually recorded only)</div>
          {canAct && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={handleAdd} style={miniBtn(ACCENT, false)}>
                <PlusCircle size={12} /> Add evidence row
              </button>
              {evidence.length === 0 && (
                <button onClick={handleLoadExample} style={miniBtn('#94a3b8', false)} title="Load example (sample) evidence — NOT real Owner data">
                  Load example data (sample)
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
          <Badge label={`${report.total} total`} color="#94a3b8" />
          <Badge label={`${report.manually_published_count} manually published`} color={PUBLISH_STATUS_COLOR.manually_published} />
          <Badge label={`${report.scheduled_count} scheduled (not published)`} color={PUBLISH_STATUS_COLOR.scheduled_outside_core} />
          <Badge label={`${report.not_published_count} not published`} color={PUBLISH_STATUS_COLOR.not_published} />
          <Badge label={`${report.blocked_count} blocked/cancelled`} color={PUBLISH_STATUS_COLOR.blocked_or_cancelled} />
        </div>
      </div>

      {/* ── Evidence rows: status + evidence + manual result intake ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
        {rows.length === 0 && (
          <div style={{ ...cardStyle, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            No manual publishing evidence recorded yet. {canAct ? 'Use “Add evidence row” to record what was published manually outside CORE, or “Load example data (sample)” to preview with clearly-labeled sample data.' : ''}
          </div>
        )}
        {rows.map(row => {
          const v = validateEvidence(row);
          const statusColor = PUBLISH_STATUS_COLOR[row.publishStatus];
          const sourceColor = RESULT_DATA_SOURCE_COLOR[row.resultDataSource];
          return (
            <div key={row.id} style={cardStyle}>
              {/* Row header: status + remove */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge label={PUBLISH_STATUS_LABEL[row.publishStatus]} color={statusColor} />
                  {v.is_scheduled_not_published && <Badge label="Not published" color="#fbbf24" />}
                  {row.contentItemId && <Badge label={`item ${row.contentItemId}`} color="#94a3b8" />}
                </div>
                {canAct && (
                  <button onClick={() => handleRemove(row.id)} style={miniBtn('#f87171', false)} title="Remove this evidence row">
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>

              {/* Publishing status + channel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={fieldLabel}>Publishing status</label>
                  <select value={row.publishStatus} disabled={!canAct}
                    onChange={e => patch(row.id, { publishStatus: e.target.value as PublishStatus })}
                    style={{ ...ctrlStyle, width: '100%', cursor: canAct ? 'pointer' : 'default' }}>
                    {PUBLISH_STATUSES.map(s => <option key={s} value={s}>{PUBLISH_STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>Channel / platform</label>
                  <input list="mpe-channels" value={row.channel} disabled={!canAct}
                    onChange={e => patch(row.id, { channel: e.target.value })}
                    placeholder="Where it was published manually (sample)…"
                    style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={fieldLabel}>Published by</label>
                  <input value={row.publishedBy ?? ''} disabled={!canAct}
                    onChange={e => patch(row.id, { publishedBy: e.target.value })}
                    placeholder="Who published it manually (sample)…"
                    style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Evidence / URL / screenshot note */}
              <div style={{ ...labelStyle, marginTop: '4px' }}><Link2 size={11} style={{ marginRight: '4px' }} />Evidence / URL / Screenshot note</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={fieldLabel}>Public URL (Owner-provided evidence)</label>
                  <input value={row.publicUrl ?? ''} disabled={!canAct}
                    onChange={e => patch(row.id, { publicUrl: e.target.value })}
                    placeholder="Paste the public post URL you published manually…"
                    style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={fieldLabel}>Screenshot / evidence note</label>
                  <input value={row.evidenceNote ?? ''} disabled={!canAct}
                    onChange={e => patch(row.id, { evidenceNote: e.target.value })}
                    placeholder="e.g. screenshot saved in shared drive (sample)…"
                    style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* ── Manual result intake ── */}
              <div style={{ ...labelStyle, marginTop: '4px' }}><BarChart3 size={11} style={{ marginRight: '4px' }} />Manual Result Intake</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Result data source:</span>
                <select value={row.resultDataSource} disabled={!canAct}
                  onChange={e => patch(row.id, { resultDataSource: e.target.value as ResultDataSource })}
                  style={{ ...ctrlStyle, cursor: canAct ? 'pointer' : 'default' }}>
                  {RESULT_DATA_SOURCES.map(s => <option key={s} value={s}>{RESULT_DATA_SOURCE_LABEL[s]}</option>)}
                </select>
                <Badge label={v.metrics_real_claim_allowed ? 'May show as provided data' : 'Simulated / unverified — not real'} color={sourceColor} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                {RESULT_METRIC_KEYS.map(key => (
                  <div key={key}>
                    <label style={fieldLabel}>{RESULT_METRIC_LABEL[key]}</label>
                    <input type="number" min={0} inputMode="numeric"
                      value={row.metrics?.[key] ?? ''} disabled={!canAct}
                      onChange={e => patchMetric(row, key, e.target.value)}
                      placeholder="—"
                      style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Validation: blocking errors + advisories */}
              {(v.errors.length > 0 || v.warnings.length > 0) && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {v.errors.map((er, i) => (
                    <div key={`e${i}`} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.72rem', color: '#f87171' }}>
                      <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} /> {er}
                    </div>
                  ))}
                  {v.warnings.map((w, i) => (
                    <div key={`w${i}`} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.72rem', color: '#fbbf24' }}>
                      <AlertTriangle size={12} style={{ marginTop: '1px', flexShrink: 0 }} /> {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {canAct ? (
                <input value={row.notes ?? ''} onChange={e => patch(row.id, { notes: e.target.value })}
                  placeholder="Notes (sample)…"
                  style={{ ...ctrlStyle, width: '100%', boxSizing: 'border-box', marginTop: '10px' }} />
              ) : row.notes ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '10px' }}>{row.notes}</div>
              ) : null}
            </div>
          );
        })}
      </div>

      <datalist id="mpe-channels">
        {SAMPLE_PUBLISH_CHANNELS.map(c => <option key={c} value={c} />)}
      </datalist>

      {/* ── Post-publish report draft ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><BarChart3 size={11} style={{ marginRight: '4px' }} />Post-Publish Report Draft</div>
          <Badge label={report.has_any_real_metrics ? `${report.rows_with_real_metrics_count} rows with provided data` : 'No provided real metrics'} color={report.has_any_real_metrics ? '#34d399' : '#94a3b8'} />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Summarizes ONLY what was manually recorded. <strong style={{ color: ACCENT }}>{report.no_live_analytics_note}</strong>{' '}
          <strong style={{ color: ACCENT }}>{report.manual_evidence_only_note}</strong> Missing data is labeled.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {report.rows.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>No evidence rows to summarize.</div>
          ) : report.rows.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: 'rgba(0,0,0,0.18)' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                <Badge label={r.publish_status_label} color={PUBLISH_STATUS_COLOR[r.publishStatus]} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{r.channel ?? '(no channel)'}</span>
                <Badge label={r.metrics_presentation_label} color={r.metrics_are_real ? '#34d399' : '#fbbf24'} />
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                {r.metric_cells.filter(c => c.provided).length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Metrics: none provided (missing data).</span>
                ) : (
                  <span>
                    {r.metrics_are_real ? 'Provided data' : 'Simulated / unverified'}:{' '}
                    {r.metric_cells.filter(c => c.provided).map(c => `${c.label} ${c.value}`).join(' · ')}
                  </span>
                )}
              </div>
              {r.missing_fields.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Missing / not provided: {r.missing_fields.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '10px 0 0' }}>
          {report.core_does_not_publish_note} Metrics are presented as real only when Owner-provided or Client-provided; everything else is simulated/unverified.
        </p>
      </div>

      {/* ── Local helper actions (no external service, no public link by CORE) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {canAct && (
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
            background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
          }}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copied!' : 'Copy evidence report'}
          </button>
        )}
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide report preview' : 'Preview evidence report'}
        </button>
      </div>

      {showPreview && (
        <textarea
          readOnly
          value={previewText}
          style={{
            width: '100%', minHeight: '280px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="mpe-report-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo manual publishing evidence for {actorLabel || 'the Owner/team'}. Core publishes nothing, calls no connector,
        opens no external endpoint, and pulls no analytics. "Manually published" only records a person's manual outside-CORE
        publish; scheduled outside CORE is not published; metrics are real only when Owner/Client-provided.
      </p>
    </div>
  );
}

function miniBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px',
    fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
    background: disabled ? 'rgba(255,255,255,0.03)' : `${color}1a`,
    border: `1px solid ${disabled ? 'var(--border-color)' : `${color}40`}`,
    color: disabled ? 'var(--text-muted)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1,
  };
}
