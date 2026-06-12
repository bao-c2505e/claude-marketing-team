import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Filter,
  Search,
  Shield,
  Eye,
  Check,
  X,
} from 'lucide-react';
import type { RoleName, AutomationLogType, AutomationLogSource, AutomationLogSeverity, AutomationLogStatus } from '../../types/core';
import type { AutomationLogStore } from '../../lib/core/automationLogs';
import {
  LOG_TYPE_LABEL,
  LOG_SOURCE_LABEL,
  LOG_SEVERITY_LABEL,
  LOG_SEVERITY_COLOR,
  LOG_STATUS_LABEL,
  LOG_STATUS_COLOR,
  LOG_TYPES,
  LOG_SOURCES,
  LOG_SEVERITIES,
  LOG_STATUSES,
  createAutomationLog,
  updateLogStatus,
  computeLogStats,
} from '../../lib/core/automationLogs';
import { can } from '../../lib/auth/permissions';

interface Props {
  logData: AutomationLogStore;
  onLogUpdate: (data: AutomationLogStore) => void;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

const SEVERITY_ICON: Record<AutomationLogSeverity, React.ReactNode> = {
  info:    <Info    size={13} />,
  warning: <AlertTriangle size={13} />,
  error:   <XCircle size={13} />,
  success: <CheckCircle size={13} />,
};

const MOCK_LOG_TEMPLATES: Array<{
  label: string;
  log_type: AutomationLogType;
  source: AutomationLogSource;
  severity: AutomationLogSeverity;
  title: string;
  message: string;
  payload_preview: string;
}> = [
  {
    label: 'Connector Health Check',
    log_type: 'connector',
    source: 'connector',
    severity: 'info',
    title: 'Connector Health Check Simulated',
    message: '[Mock] Health check simulated. No real API call made. Phase 14 — local only.',
    payload_preview: '{"action":"health_check","real_call":false,"phase":"14"}',
  },
  {
    label: 'Content Generation',
    log_type: 'module',
    source: 'module',
    severity: 'success',
    title: 'Mock Content Generation Completed',
    message: '[Mock] Content generation job completed. No real AI API called. Local simulation only.',
    payload_preview: '{"action":"generation_completed","mode":"mock","real_api":false}',
  },
  {
    label: 'Safety Gate Warning',
    log_type: 'safety',
    source: 'system',
    severity: 'warning',
    title: 'Safety Gate — Action Requires Approval',
    message: '[Mock] Action requires owner approval before execution. No real action taken. Phase 14.',
    payload_preview: '{"gate":"safety","action_blocked":true,"real_action":false}',
  },
  {
    label: 'Approval Submitted',
    log_type: 'approval',
    source: 'core',
    severity: 'info',
    title: 'Approval Request Submitted',
    message: '[Mock] Content approval request submitted for manager review. Awaiting decision.',
    payload_preview: '{"action":"approval_submitted","assigned_to":"manager","source":"core"}',
  },
  {
    label: 'System Error',
    log_type: 'error',
    source: 'system',
    severity: 'error',
    title: 'Mock System Error Recorded',
    message: '[Mock] Simulated system error for testing. No real failure. Phase 14 — local logs only.',
    payload_preview: '{"error_type":"mock_error","real_failure":false,"phase":"14"}',
  },
];

export default function AutomationLogsTab({
  logData,
  onLogUpdate,
  userRole,
  isSupabaseConfigured,
}: Props) {
  const canView   = can.viewAutomationLogs(userRole);
  const canManage = can.manageConnectors(userRole) || userRole === 'owner' || userRole === 'manager';

  const [filterType,     setFilterType]     = useState<AutomationLogType | ''>('');
  const [filterSource,   setFilterSource]   = useState<AutomationLogSource | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<AutomationLogSeverity | ''>('');
  const [filterStatus,   setFilterStatus]   = useState<AutomationLogStatus | ''>('');
  const [searchText,     setSearchText]     = useState('');
  const [expandedIds,    setExpandedIds]    = useState<Set<string>>(new Set());
  const [showMockForm,   setShowMockForm]   = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const filteredLogs = useMemo(() => {
    let list = logData.logs;
    if (filterType)     list = list.filter(l => l.log_type === filterType);
    if (filterSource)   list = list.filter(l => l.source === filterSource);
    if (filterSeverity) list = list.filter(l => l.severity === filterSeverity);
    if (filterStatus)   list = list.filter(l => l.status === filterStatus);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        (l.payload_preview ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [logData.logs, filterType, filterSource, filterSeverity, filterStatus, searchText]);

  const stats = useMemo(() => computeLogStats(logData.logs), [logData.logs]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleStatusUpdate = (logId: string, status: AutomationLogStatus) => {
    const updated = updateLogStatus(logData, logId, status);
    onLogUpdate(updated);
  };

  const handleCreateMock = () => {
    const tpl = MOCK_LOG_TEMPLATES[selectedTemplate];
    const updated = createAutomationLog(logData, {
      log_type:                tpl.log_type,
      source:                  tpl.source,
      severity:                tpl.severity,
      status:                  'recorded',
      title:                   tpl.title,
      message:                 tpl.message,
      payload_preview:         tpl.payload_preview,
      related_connector_id:    null,
      related_module_id:       null,
      related_event_id:        null,
      related_client_id:       null,
      related_brand_id:        null,
      related_campaign_id:     null,
      related_content_item_id: null,
    });
    onLogUpdate(updated);
    setShowMockForm(false);
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterSource('');
    setFilterSeverity('');
    setFilterStatus('');
    setSearchText('');
  };

  const hasFilters = filterType || filterSource || filterSeverity || filterStatus || searchText.trim();

  // Permission gate
  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <Shield size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Automation Logs are restricted to internal staff (owner / manager) only.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #fb923c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Activity size={20} style={{ color: '#fb923c' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Automation Logs
              </h2>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', padding: '2px 7px' }}>
                Local / Mock — No Live Automation
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Internal automation event log. No real workflow executed. No real webhook sent. No external API called.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isSupabaseConfigured && (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', padding: '3px 8px' }}>
                localStorage mode
              </span>
            )}
            {canManage && (
              <button
                onClick={() => setShowMockForm(v => !v)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Plus size={14} /> Create Mock Log
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Safety disclaimer */}
      <div style={{ padding: '10px 16px', background: 'rgba(244, 122, 31,0.06)', border: '1px solid rgba(244, 122, 31,0.2)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <Shield size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#fb923c' }}>Safety:</strong> Logs are local/mock only &nbsp;·&nbsp; No real workflow execution &nbsp;·&nbsp; No real webhook retry &nbsp;·&nbsp; No external API calls &nbsp;·&nbsp; No auto-post &nbsp;·&nbsp; No real ads &nbsp;·&nbsp; No customer messaging &nbsp;·&nbsp; Production automation requires owner approval.
        </span>
      </div>

      {/* Create mock log form */}
      {showMockForm && canManage && (
        <div className="glass-panel" style={{ padding: '18px 20px', border: '1px solid rgba(244, 122, 31,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Create Mock Log</span>
            <button onClick={() => setShowMockForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(Number(e.target.value))}
              className="form-control"
              style={{ flex: 1, minWidth: '200px', fontSize: '0.82rem' }}
            >
              {MOCK_LOG_TEMPLATES.map((tpl, i) => (
                <option key={i} value={i}>{tpl.label} — {LOG_SEVERITY_LABEL[tpl.severity]}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 2, minWidth: '180px' }}>
              {MOCK_LOG_TEMPLATES[selectedTemplate].title}
            </div>
            <button onClick={handleCreateMock} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RefreshCw size={13} /> Create
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            No real action taken. Mock log only. No webhook. No API call.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Logs',    value: stats.total,      color: '#fb923c', icon: <Activity size={16} /> },
          { label: 'Warnings',      value: stats.warnings,   color: '#f59e0b', icon: <AlertTriangle size={16} /> },
          { label: 'Errors',        value: stats.errors,     color: '#f87171', icon: <XCircle size={16} /> },
          { label: 'Unresolved',    value: stats.unresolved, color: '#fb923c', icon: <Eye size={16} /> },
          { label: 'Success',       value: stats.success,    color: '#34d399', icon: <CheckCircle size={16} /> },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color, margin: '4px 0 0' }}>{stat.value}</h3>
            </div>
            <div style={{ color: stat.color, opacity: 0.6 }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Logs</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#fb923c' }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {/* Search */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="form-control"
              placeholder="Search title / message / payload…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ paddingLeft: '30px', fontSize: '0.82rem' }}
            />
          </div>
          <select className="form-control" style={{ fontSize: '0.82rem' }} value={filterType} onChange={e => setFilterType(e.target.value as AutomationLogType | '')}>
            <option value="">All types</option>
            {LOG_TYPES.map(t => <option key={t} value={t}>{LOG_TYPE_LABEL[t]}</option>)}
          </select>
          <select className="form-control" style={{ fontSize: '0.82rem' }} value={filterSource} onChange={e => setFilterSource(e.target.value as AutomationLogSource | '')}>
            <option value="">All sources</option>
            {LOG_SOURCES.map(s => <option key={s} value={s}>{LOG_SOURCE_LABEL[s]}</option>)}
          </select>
          <select className="form-control" style={{ fontSize: '0.82rem' }} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as AutomationLogSeverity | '')}>
            <option value="">All severities</option>
            {LOG_SEVERITIES.map(s => <option key={s} value={s}>{LOG_SEVERITY_LABEL[s]}</option>)}
          </select>
          <select className="form-control" style={{ fontSize: '0.82rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as AutomationLogStatus | '')}>
            <option value="">All statuses</option>
            {LOG_STATUSES.map(s => <option key={s} value={s}>{LOG_STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Showing <strong style={{ color: 'var(--text-secondary)' }}>{filteredLogs.length}</strong> of {logData.logs.length} logs
        </p>
      </div>

      {/* Log List */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Activity size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No logs match current filters.</p>
          </div>
        ) : (
          <div>
            {filteredLogs.map((log, idx) => {
              const isExpanded = expandedIds.has(log.id);
              const isLast = idx === filteredLogs.length - 1;
              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Summary row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(log.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Expand toggle */}
                    <div style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>

                    {/* Severity icon */}
                    <div style={{ marginTop: '2px', flexShrink: 0, color: LOG_SEVERITY_COLOR[log.severity] }}>
                      {SEVERITY_ICON[log.severity]}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: LOG_SEVERITY_COLOR[log.severity], background: `${LOG_SEVERITY_COLOR[log.severity]}18`, border: `1px solid ${LOG_SEVERITY_COLOR[log.severity]}40`, borderRadius: '4px', padding: '1px 6px' }}>
                          {LOG_SEVERITY_LABEL[log.severity]}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '1px 6px' }}>
                          {LOG_TYPE_LABEL[log.log_type]}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '1px 6px' }}>
                          {LOG_SOURCE_LABEL[log.source]}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                        {log.message}
                      </p>
                    </div>

                    {/* Status + timestamp */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: LOG_STATUS_COLOR[log.status], background: `${LOG_STATUS_COLOR[log.status]}18`, border: `1px solid ${LOG_STATUS_COLOR[log.status]}40`, borderRadius: '4px', padding: '2px 7px' }}>
                        {LOG_STATUS_LABEL[log.status]}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 18px 16px 42px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      {/* Full message */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Message</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>{log.message}</p>
                      </div>

                      {/* Payload preview */}
                      {log.payload_preview && (
                        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px' }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Payload Preview</p>
                          <pre style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {(() => {
                              try { return JSON.stringify(JSON.parse(log.payload_preview!), null, 2); }
                              catch { return log.payload_preview; }
                            })()}
                          </pre>
                        </div>
                      )}

                      {/* Related refs */}
                      {(log.related_connector_id || log.related_module_id || log.related_event_id || log.related_client_id || log.related_campaign_id) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {log.related_connector_id && <RelatedChip label="Connector" value={log.related_connector_id} />}
                          {log.related_module_id    && <RelatedChip label="Module"    value={log.related_module_id} />}
                          {log.related_event_id     && <RelatedChip label="Event"     value={log.related_event_id} />}
                          {log.related_client_id    && <RelatedChip label="Client"    value={log.related_client_id} />}
                          {log.related_brand_id     && <RelatedChip label="Brand"     value={log.related_brand_id} />}
                          {log.related_campaign_id  && <RelatedChip label="Campaign"  value={log.related_campaign_id} />}
                          {log.related_content_item_id && <RelatedChip label="Content Item" value={log.related_content_item_id} />}
                        </div>
                      )}

                      {/* Timestamps */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <TimestampItem label="Created" value={log.created_at} />
                        {log.reviewed_at && <TimestampItem label="Reviewed" value={log.reviewed_at} />}
                        {log.resolved_at && <TimestampItem label="Resolved" value={log.resolved_at} />}
                      </div>

                      {/* Actions */}
                      {canManage && log.status !== 'resolved' && log.status !== 'ignored' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {log.status !== 'reviewed' && (
                            <button
                              onClick={() => handleStatusUpdate(log.id, 'reviewed')}
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(251, 146, 60,0.4)', cursor: 'pointer', background: 'rgba(244, 122, 31,0.1)', color: '#fb923c' }}
                            >
                              <Eye size={12} /> Mark Reviewed
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(log.id, 'resolved')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(52,211,153,0.4)', cursor: 'pointer', background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
                          >
                            <Check size={12} /> Mark Resolved
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(log.id, 'ignored')}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(113,113,122,0.4)', cursor: 'pointer', background: 'rgba(113,113,122,0.1)', color: '#71717a' }}
                          >
                            <X size={12} /> Ignore
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          <strong style={{ color: '#f59e0b' }}>Local Mode:</strong> All logs are stored locally in localStorage. No Supabase persistence yet. No real automation events. Logs are hidden from client/viewer roles. Production automation wiring is planned for a later phase.
        </p>
      </div>
    </div>
  );
}

function RelatedChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}:</span>
      <span style={{ fontSize: '0.68rem', color: '#fb923c', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function TimestampItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '4px' }}>{label}:</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        {new Date(value).toLocaleString('vi-VN')}
      </span>
    </div>
  );
}
