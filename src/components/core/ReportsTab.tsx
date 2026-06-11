import { useState, useMemo } from 'react';
import {
  BarChart2, Shield, RefreshCw, Copy, Check, AlertCircle,
  TrendingUp, FileText, Clock, RotateCcw, XCircle, FolderOpen,
} from 'lucide-react';
import type { Client, Brand, Campaign, CampaignBrief, LocalReport, LocalReportType, RoleName } from '../../types/core';
import type { GenerationDataStore, ApprovalDataStore, AssetDataStore, CoreDataStore } from '../../lib/core/coreData';
import {
  generateLocalReport,
  REPORT_TYPES, CLIENT_ACCESSIBLE_REPORT_TYPES,
  REPORT_TYPE_LABEL, REPORT_TYPE_COLOR,
  CONTENT_STATUS_LABEL, CONTENT_STATUS_COLOR,
  APPROVAL_STATUS_LABEL, APPROVAL_STATUS_COLOR,
  ASSET_STATUS_LABEL, ASSET_STATUS_COLOR,
} from '../../lib/core/reportGenerator';
import { can, isInternalRole } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  genData: GenerationDataStore;
  approvalData: ApprovalDataStore;
  assetData: AssetDataStore;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

// ---------------------------------------------------------------------------
// Safety banner
// ---------------------------------------------------------------------------

function ReportSafetyBanner() {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: '8px',
      background: 'rgba(244, 122, 31,0.07)', border: '1px solid rgba(244, 122, 31,0.28)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <Shield size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', color: '#fb923c', lineHeight: 1.5 }}>
        <strong>Reports use Core workspace data only.</strong>{' '}
        No real platform analytics (Meta, Google, TikTok) are connected in this MVP.
        No ads spend data. Report figures are workspace progress metrics, not real campaign performance.
        Approved content ≠ published content.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar row
// ---------------------------------------------------------------------------

function BreakdownRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breakdown section
// ---------------------------------------------------------------------------

function BreakdownSection({ title, data, labelMap, colorMap, showIfEmpty = false }: {
  title: string;
  data: Record<string, number>;
  labelMap: Record<string, string>;
  colorMap: Record<string, string>;
  showIfEmpty?: boolean;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0 && !showIfEmpty) return null;

  return (
    <div>
      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
        {title}
      </h4>
      {entries.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No data in this scope.</p>
      ) : (
        entries.sort(([, a], [, b]) => b - a).map(([key, count]) => (
          <BreakdownRow
            key={key}
            label={labelMap[key] ?? key}
            count={count}
            total={total}
            color={colorMap[key] ?? '#94a3b8'}
          />
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReportsTab({
  clients, brands, campaigns, briefs,
  genData, approvalData, assetData,
  userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  const [filterClientId,   setFilterClientId]   = useState('');
  const [filterBrandId,    setFilterBrandId]    = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [reportType, setReportType] = useState<LocalReportType>('internal_summary');
  const [generatedReport, setGeneratedReport]   = useState<LocalReport | null>(null);
  const [copied, setCopied] = useState(false);

  const canView     = can.viewReports(userRole);
  const canGenerate = can.generateReports(userRole);
  const isInternal  = isInternalRole(userRole);

  const accessibleTypes = isInternal ? REPORT_TYPES : CLIENT_ACCESSIBLE_REPORT_TYPES;

  // Cascading brand/campaign filters
  const filteredBrands    = brands.filter(b => !filterClientId || b.client_id === filterClientId);
  const filteredCampaigns = campaigns.filter(c => {
    if (filterBrandId)  return c.brand_id   === filterBrandId;
    if (filterClientId) return c.client_id  === filterClientId;
    return true;
  });

  // Auto-select valid report type for client
  useMemo(() => {
    if (!isInternal && !CLIENT_ACCESSIBLE_REPORT_TYPES.includes(reportType)) {
      setReportType('client_summary');
    }
  }, [isInternal, reportType]);

  const coreDataForGen: CoreDataStore = useMemo(() => ({
    clients, brands, campaigns, briefs,
  }), [clients, brands, campaigns, briefs]);

  // ---------- handlers ----------

  const handleGenerate = () => {
    const report = generateLocalReport({
      coreData:     coreDataForGen,
      genData,
      approvalData,
      assetData,
      report_type:  reportType,
      client_id:    filterClientId  || null,
      brand_id:     filterBrandId   || null,
      campaign_id:  filterCampaignId || null,
      generated_by: actorLabel,
    });
    setGeneratedReport(report);
    setCopied(false);
  };

  const handleCopyClientSummary = () => {
    if (!generatedReport) return;
    navigator.clipboard.writeText(generatedReport.client_summary_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyInternalSummary = () => {
    if (!generatedReport) return;
    navigator.clipboard.writeText(generatedReport.summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ---------- guard ----------

  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: '#f87171', marginBottom: '12px' }} />
        <p style={{ color: '#f87171', fontWeight: 600 }}>Access denied.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>You do not have permission to view Reports.</p>
      </div>
    );
  }

  const m = generatedReport?.metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={22} style={{ color: '#fb923c' }} /> Reports
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Campaign progress, content status, and approval summaries.
          </p>
        </div>
        {!isSupabaseConfigured && (
          <span style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '3px 8px' }}>Offline Mode</span>
        )}
      </div>

      <ReportSafetyBanner />

      {/* Filter + Generate panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px' }}>Generate Report</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {/* Report type */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Report Type</label>
            <select className="form-control" value={reportType}
              onChange={e => { setReportType(e.target.value as LocalReportType); setGeneratedReport(null); }}>
              {accessibleTypes.map(t => <option key={t} value={t}>{REPORT_TYPE_LABEL[t]}</option>)}
            </select>
          </div>

          {/* Client filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Client</label>
            <select className="form-control" value={filterClientId}
              onChange={e => { setFilterClientId(e.target.value); setFilterBrandId(''); setFilterCampaignId(''); setGeneratedReport(null); }}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Brand filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Brand</label>
            <select className="form-control" value={filterBrandId}
              onChange={e => { setFilterBrandId(e.target.value); setFilterCampaignId(''); setGeneratedReport(null); }}>
              <option value="">All Brands</option>
              {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Campaign filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Campaign</label>
            <select className="form-control" value={filterCampaignId}
              onChange={e => { setFilterCampaignId(e.target.value); setGeneratedReport(null); }}>
              <option value="">All Campaigns</option>
              {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {canGenerate ? (
            <button
              onClick={handleGenerate}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(244, 122, 31,0.15)', border: '1px solid rgba(244, 122, 31,0.4)', color: '#fb923c', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
            >
              <RefreshCw size={14} /> Generate Report
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Report generation requires Owner or Manager role.
            </span>
          )}
          {generatedReport && (
            <span style={{ fontSize: '0.78rem', color: '#34d399' }}>
              Report generated at {new Date(generatedReport.created_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Empty state — no report yet */}
      {!generatedReport && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <BarChart2 size={40} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No report generated yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
            {canGenerate
              ? 'Select a scope and report type above, then click "Generate Report".'
              : 'Ask your account manager to generate a report for you.'}
          </p>
        </div>
      )}

      {/* Generated report panel */}
      {generatedReport && m && (
        <>
          {/* Report header */}
          <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {generatedReport.title}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${REPORT_TYPE_COLOR[generatedReport.report_type]}18`, color: REPORT_TYPE_COLOR[generatedReport.report_type], border: `1px solid ${REPORT_TYPE_COLOR[generatedReport.report_type]}40` }}>
                  {REPORT_TYPE_LABEL[generatedReport.report_type]}
                </span>
                {generatedReport.period_start && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {generatedReport.period_start} → {generatedReport.period_end ?? 'TBD'}
                  </span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  by {generatedReport.generated_by}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleGenerate}
                title="Refresh report"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem' }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            <MetricCard
              label="Total Content Items"
              value={m.total_content_items}
              sub={`${m.total_generation_jobs} generation job${m.total_generation_jobs !== 1 ? 's' : ''}`}
              color="#60a5fa"
              icon={<FileText size={16} style={{ color: '#60a5fa' }} />}
            />
            <MetricCard
              label="Approved Content"
              value={m.approved_content_count}
              sub={m.total_content_items > 0 ? `${Math.round((m.approved_content_count / m.total_content_items) * 100)}% of total` : '—'}
              color="#34d399"
              icon={<Check size={16} style={{ color: '#34d399' }} />}
            />
            <MetricCard
              label="Pending Review"
              value={m.pending_approval_count}
              sub="Needs approval decision"
              color="#f59e0b"
              icon={<Clock size={16} style={{ color: '#f59e0b' }} />}
            />
            <MetricCard
              label="Revision Requested"
              value={m.revision_requested_count}
              sub="Requires updates from team"
              color="#fb923c"
              icon={<RotateCcw size={16} style={{ color: '#fb923c' }} />}
            />
            <MetricCard
              label="Total Assets"
              value={m.asset_count}
              sub={`${m.approved_asset_count} approved`}
              color="#a78bfa"
              icon={<FolderOpen size={16} style={{ color: '#a78bfa' }} />}
            />
            <MetricCard
              label="Campaign Progress"
              value={`${m.campaign_progress_percent}%`}
              sub="Content approved / total"
              color="#fb923c"
              icon={<TrendingUp size={16} style={{ color: '#fb923c' }} />}
            />
          </div>

          {/* Progress bar visual */}
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Campaign Approval Progress</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb923c' }}>{m.campaign_progress_percent}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${m.campaign_progress_percent}%`, height: '100%', background: 'linear-gradient(90deg, #fb923c, #34d399)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Approved', count: m.approved_content_count, color: '#34d399' },
                { label: 'Pending', count: m.pending_approval_count, color: '#f59e0b' },
                { label: 'Revision', count: m.revision_requested_count, color: '#fb923c' },
                { label: 'Rejected', count: m.rejected_count, color: '#f87171' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}: <strong style={{ color }}>{count}</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdowns (internal only for most) */}
          {isInternal && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '20px' }}>Detailed Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                <BreakdownSection
                  title="Content by Status"
                  data={m.content_by_status}
                  labelMap={CONTENT_STATUS_LABEL}
                  colorMap={CONTENT_STATUS_COLOR}
                  showIfEmpty
                />
                <BreakdownSection
                  title="Content by Channel"
                  data={m.content_by_channel}
                  labelMap={{}}
                  colorMap={{ Facebook: '#60a5fa', TikTok: '#fb923c', Instagram: '#a78bfa', YouTube: '#f87171', Other: '#94a3b8' }}
                  showIfEmpty
                />
                <BreakdownSection
                  title="Approval Requests by Status"
                  data={m.approval_by_status}
                  labelMap={APPROVAL_STATUS_LABEL}
                  colorMap={APPROVAL_STATUS_COLOR}
                  showIfEmpty
                />
                <BreakdownSection
                  title="Assets by Approval Status"
                  data={(() => {
                    const d: Record<string, number> = {};
                    assetData.assets
                      .filter(a =>
                        (!filterCampaignId || a.campaign_id === filterCampaignId) &&
                        (!filterBrandId    || a.brand_id    === filterBrandId)    &&
                        (!filterClientId   || a.client_id   === filterClientId)
                      )
                      .forEach(a => { d[a.approval_status] = (d[a.approval_status] ?? 0) + 1; });
                    return d;
                  })()}
                  labelMap={ASSET_STATUS_LABEL}
                  colorMap={ASSET_STATUS_COLOR}
                  showIfEmpty
                />
              </div>
            </div>
          )}

          {/* Client summary text */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Client Summary Text
                <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>(copy-paste ready)</span>
              </h3>
              <button
                onClick={handleCopyClientSummary}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'var(--border-color)'}`, color: copied ? '#34d399' : 'var(--text-muted)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
              {generatedReport.client_summary_text}
            </pre>
          </div>

          {/* Internal raw summary (owner/manager only) */}
          {isInternal && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Internal Summary</h3>
                <button
                  onClick={handleCopyInternalSummary}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                {generatedReport.summary}
              </pre>
            </div>
          )}

          {/* Governance note */}
          <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(113,113,122,0.06)', border: '1px solid rgba(113,113,122,0.2)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <XCircle size={14} style={{ color: '#71717a', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              This report is generated from The Core Agency local workspace data only.
              No real Meta/Google/TikTok analytics are connected. No ads spend data is included.
              Approved content ≠ published content. No auto-post or auto-ads has been activated.
              {!isSupabaseConfigured && ' Running in offline mode — Supabase not connected.'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
