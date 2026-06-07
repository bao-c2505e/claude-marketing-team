import React, { useState } from 'react';
import {
  Network,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Inbox,
  Layers,
  Plug,
  Settings,
} from 'lucide-react';
import type {
  RoleName,
  Client,
  Brand,
  Campaign,
  LocalConnectorStatus,
  LocalModuleStatus,
  LocalModuleEventType,
  ModuleEventDirection,
  LocalModuleEventStatus,
} from '../../types/core';
import {
  loadConnectorRegistryData,
  saveConnectorRegistryData,
  updateConnectorStatus,
  simulateHealthCheck,
  updateModuleStatus,
  updateEventStatus,
  addMockEvent,
  CONNECTOR_TYPE_LABEL,
  CONNECTOR_STATUS_LABEL,
  CONNECTOR_STATUS_COLOR,
  CONNECTOR_MODE_LABEL,
  CONNECTOR_MODE_COLOR,
  MODULE_NAME_LABEL,
  MODULE_STATUS_LABEL,
  MODULE_STATUS_COLOR,
  MODULE_EVENT_TYPE_LABEL,
  MODULE_EVENT_STATUS_LABEL,
  MODULE_EVENT_STATUS_COLOR,
  MODULE_EVENT_TYPES,
} from '../../lib/core/connectorRegistry';
import type { ConnectorRegistryStore } from '../../lib/core/connectorRegistry';
import { can } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

// ---------------------------------------------------------------------------
// Sub-tab type
// ---------------------------------------------------------------------------

type SubTab = 'connectors' | 'modules' | 'event_inbox';

// ---------------------------------------------------------------------------
// Shared badge helpers
// ---------------------------------------------------------------------------

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, color,
      background: `${color}18`, borderRadius: '5px',
      padding: '2px 8px', border: `1px solid ${color}40`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function EnvKeyChip({ k }: { k: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontFamily: 'monospace',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '4px', padding: '1px 6px', color: '#94a3b8',
    }}>
      {k}
    </span>
  );
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '16px',
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ConnectorRegistryTab({
  campaigns, userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('connectors');
  const [store, setStore] = useState<ConnectorRegistryStore>(() => loadConnectorRegistryData());

  // Event inbox filter state
  const [filterModule, setFilterModule]       = useState('');
  const [filterConnector, setFilterConnector] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Create mock event form
  const [showCreateForm, setShowCreateForm]         = useState(false);
  const [newEventType, setNewEventType]             = useState<LocalModuleEventType>('generation_completed');
  const [newEventDirection, setNewEventDirection]   = useState<ModuleEventDirection>('inbound');
  const [newEventModuleId, setNewEventModuleId]     = useState('');
  const [newEventConnectorId, setNewEventConnectorId] = useState('');
  const [newEventCampaignId, setNewEventCampaignId] = useState('');
  const [newEventPayload, setNewEventPayload]       = useState('');

  // Permission
  const canManage   = can.manageConnectors(userRole);
  const canViewLogs = can.viewAutomationLogs(userRole);
  const canViewConn = can.viewConnectors(userRole);

  if (!canViewConn) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={32} style={{ marginBottom: '12px' }} />
        <p>You do not have permission to view Connector Registry.</p>
        <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Required: owner or manager role.</p>
      </div>
    );
  }

  const saveStore = (updated: ConnectorRegistryStore) => {
    setStore(updated);
    saveConnectorRegistryData(updated);
  };

  // ── Connector actions ─────────────────────────────────────────────────────

  const handleConnectorStatus = (id: string, status: LocalConnectorStatus) => {
    saveStore(updateConnectorStatus(store, id, status));
  };

  const handleHealthCheck = (id: string) => {
    saveStore(simulateHealthCheck(store, id));
  };

  // ── Module actions ────────────────────────────────────────────────────────

  const handleModuleStatus = (id: string, status: LocalModuleStatus) => {
    saveStore(updateModuleStatus(store, id, status));
  };

  // ── Event actions ─────────────────────────────────────────────────────────

  const handleEventStatus = (id: string, status: LocalModuleEventStatus) => {
    saveStore(updateEventStatus(store, id, status));
  };

  const handleCreateEvent = () => {
    const now = new Date().toISOString();
    const campaign = campaigns.find(c => c.id === newEventCampaignId);
    saveStore(addMockEvent(store, {
      module_id:    newEventModuleId    || null,
      connector_id: newEventConnectorId || null,
      event_type:   newEventType,
      direction:    newEventDirection,
      status:       'received',
      related_client_id:    campaign?.client_id ?? null,
      related_brand_id:     campaign?.brand_id  ?? null,
      related_campaign_id:  newEventCampaignId   || null,
      related_content_item_id: null,
      payload_preview: newEventPayload || `{"source":"mock_manual","event":"${newEventType}","created_by":"${actorLabel}","timestamp":"${now}"}`,
      error_message: null,
      received_at:  now,
      processed_at: null,
    }));
    setShowCreateForm(false);
    setNewEventPayload('');
    setNewEventModuleId('');
    setNewEventConnectorId('');
    setNewEventCampaignId('');
  };

  // ── Filtered events ───────────────────────────────────────────────────────

  const filteredEvents = store.events.filter(e => {
    if (filterModule    && e.module_id    !== filterModule)    return false;
    if (filterConnector && e.connector_id !== filterConnector) return false;
    if (filterDirection && e.direction    !== filterDirection) return false;
    if (filterStatus    && e.status       !== filterStatus)    return false;
    if (filterEventType && e.event_type   !== filterEventType) return false;
    return true;
  });

  // ── Pending counts ────────────────────────────────────────────────────────
  const pendingEventsCount = store.events.filter(e => e.status === 'received' || e.status === 'needs_review').length;

  // ============================================================================
  // RENDER — Connectors section
  // ============================================================================

  const renderConnectors = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {store.connectors.length} connector{store.connectors.length !== 1 ? 's' : ''} registered
          &nbsp;·&nbsp;
          {store.connectors.filter(c => c.status === 'connected').length} connected
          &nbsp;·&nbsp;
          {store.connectors.filter(c => c.status === 'not_configured').length} not configured
        </div>
        {!canManage && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View-only (owner required to manage)</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
        {store.connectors.map(conn => (
          <div key={conn.id} style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{conn.name}</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <StatusBadge label={CONNECTOR_TYPE_LABEL[conn.connector_type]} color="#818cf8" />
                <StatusBadge label={CONNECTOR_STATUS_LABEL[conn.status]} color={CONNECTOR_STATUS_COLOR[conn.status]} />
                <StatusBadge label={CONNECTOR_MODE_LABEL[conn.mode]} color={CONNECTOR_MODE_COLOR[conn.mode]} />
              </div>
            </div>

            {conn.description && (
              <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: '1.5' }}>
                {conn.description}
              </p>
            )}

            {conn.required_env_keys.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={SECTION_LABEL}>Required Env Keys</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                  {conn.required_env_keys.map(k => <EnvKeyChip key={k} k={k} />)}
                </div>
              </div>
            )}

            {conn.safety_note && (
              <div style={{ padding: '7px 10px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#fcd34d', marginBottom: '10px' }}>
                {conn.safety_note}
              </div>
            )}

            {conn.last_checked_at && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Last checked: {new Date(conn.last_checked_at).toLocaleString('vi-VN')}
                {conn.health_note && <span style={{ display: 'block', marginTop: '3px', color: '#34d399' }}>{conn.health_note}</span>}
              </div>
            )}

            {canManage && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <button
                  onClick={() => handleHealthCheck(conn.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <RefreshCw size={11} /> Simulate Health Check
                </button>
                {conn.status !== 'configured' && conn.status !== 'connected' && conn.status !== 'disabled' && (
                  <button
                    onClick={() => handleConnectorStatus(conn.id, 'configured')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}
                  >
                    <CheckCircle size={11} /> Mark Configured
                  </button>
                )}
                {conn.status === 'configured' && (
                  <button
                    onClick={() => handleConnectorStatus(conn.id, 'not_configured')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    Reset to Not Configured
                  </button>
                )}
                {conn.status !== 'disabled' ? (
                  <button
                    onClick={() => handleConnectorStatus(conn.id, 'disabled')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
                  >
                    <XCircle size={11} /> Disable
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectorStatus(conn.id, 'not_configured')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}
                  >
                    Re-enable
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER — Modules section
  // ============================================================================

  const renderModules = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {store.modules.length} module{store.modules.length !== 1 ? 's' : ''} registered
          &nbsp;·&nbsp;
          {store.modules.filter(m => m.status === 'mock_ready').length} mock ready
          &nbsp;·&nbsp;
          {store.modules.filter(m => m.status === 'planned').length} planned
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
        {store.modules.map(mod => (
          <div key={mod.id} style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{MODULE_NAME_LABEL[mod.module_name]}</div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <StatusBadge label={mod.module_type} color="#818cf8" />
                <StatusBadge label={MODULE_STATUS_LABEL[mod.status]} color={MODULE_STATUS_COLOR[mod.status]} />
              </div>
            </div>

            {mod.description && (
              <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: '1.5' }}>
                {mod.description}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              {mod.input_contract_name && (
                <div>
                  <div style={SECTION_LABEL}>Input Contract</div>
                  <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{mod.input_contract_name}</code>
                </div>
              )}
              {mod.output_contract_name && (
                <div>
                  <div style={SECTION_LABEL}>Output Contract</div>
                  <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{mod.output_contract_name}</code>
                </div>
              )}
              {mod.callback_endpoint_note && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={SECTION_LABEL}>Callback Endpoint</div>
                  <code style={{ fontSize: '0.72rem', color: '#71717a' }}>{mod.callback_endpoint_note}</code>
                </div>
              )}
              {mod.owner && (
                <div>
                  <div style={SECTION_LABEL}>Owner Role</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mod.owner}</span>
                </div>
              )}
            </div>

            {canManage && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                {mod.status === 'planned' && (
                  <button
                    onClick={() => handleModuleStatus(mod.id, 'mock_ready')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
                  >
                    <CheckCircle size={11} /> Mark Mock Ready
                  </button>
                )}
                {mod.status === 'mock_ready' && (
                  <button
                    onClick={() => handleModuleStatus(mod.id, 'planned')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    Reset to Planned
                  </button>
                )}
                {mod.status !== 'disabled' ? (
                  <button
                    onClick={() => handleModuleStatus(mod.id, 'disabled')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
                  >
                    <XCircle size={11} /> Disable
                  </button>
                ) : (
                  <button
                    onClick={() => handleModuleStatus(mod.id, 'planned')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}
                  >
                    Re-enable
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER — Event Inbox section
  // ============================================================================

  const renderEventInbox = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Module filter */}
        <div style={{ position: 'relative' }}>
          <select className="form-control" value={filterModule} onChange={e => setFilterModule(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}>
            <option value="">All modules</option>
            {store.modules.map(m => <option key={m.id} value={m.id}>{MODULE_NAME_LABEL[m.module_name]}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        {/* Connector filter */}
        <div style={{ position: 'relative' }}>
          <select className="form-control" value={filterConnector} onChange={e => setFilterConnector(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}>
            <option value="">All connectors</option>
            {store.connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        {/* Direction filter */}
        <div style={{ position: 'relative' }}>
          <select className="form-control" value={filterDirection} onChange={e => setFilterDirection(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}>
            <option value="">All directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}>
            <option value="">All statuses</option>
            <option value="received">Received</option>
            <option value="processed">Processed</option>
            <option value="needs_review">Needs Review</option>
            <option value="failed">Failed</option>
            <option value="ignored">Ignored</option>
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        {/* Event type filter */}
        <div style={{ position: 'relative' }}>
          <select className="form-control" value={filterEventType} onChange={e => setFilterEventType(e.target.value)}
            style={{ fontSize: '0.78rem', padding: '5px 24px 5px 8px' }}>
            <option value="">All event types</option>
            {MODULE_EVENT_TYPES.map(t => <option key={t} value={t}>{MODULE_EVENT_TYPE_LABEL[t]}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </span>

        {canManage && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', background: showCreateForm ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showCreateForm ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`, color: showCreateForm ? '#818cf8' : 'var(--text-secondary)' }}
          >
            <Plus size={13} /> Create Mock Event
          </button>
        )}
      </div>

      {/* Create mock event form */}
      {showCreateForm && canManage && (
        <div style={{ ...CARD, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Create Mock Event (local only — no real webhook sent)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Event Type *</label>
              <select className="form-control" value={newEventType} onChange={e => setNewEventType(e.target.value as LocalModuleEventType)} style={{ fontSize: '0.8rem', width: '100%' }}>
                {MODULE_EVENT_TYPES.map(t => <option key={t} value={t}>{MODULE_EVENT_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Direction</label>
              <select className="form-control" value={newEventDirection} onChange={e => setNewEventDirection(e.target.value as ModuleEventDirection)} style={{ fontSize: '0.8rem', width: '100%' }}>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Module (optional)</label>
              <select className="form-control" value={newEventModuleId} onChange={e => setNewEventModuleId(e.target.value)} style={{ fontSize: '0.8rem', width: '100%' }}>
                <option value="">— none —</option>
                {store.modules.map(m => <option key={m.id} value={m.id}>{MODULE_NAME_LABEL[m.module_name]}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Connector (optional)</label>
              <select className="form-control" value={newEventConnectorId} onChange={e => setNewEventConnectorId(e.target.value)} style={{ fontSize: '0.8rem', width: '100%' }}>
                <option value="">— none —</option>
                {store.connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Campaign (optional)</label>
              <select className="form-control" value={newEventCampaignId} onChange={e => setNewEventCampaignId(e.target.value)} style={{ fontSize: '0.8rem', width: '100%' }}>
                <option value="">— none —</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Payload Preview (optional JSON)</label>
            <textarea
              className="form-control"
              rows={3}
              value={newEventPayload}
              onChange={e => setNewEventPayload(e.target.value)}
              placeholder='{"key": "value", "source": "mock"}'
              style={{ fontSize: '0.78rem', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateEvent}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.45)', color: '#818cf8' }}
            >
              <Plus size={13} /> Create Event
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '0.82rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Event list */}
      {filteredEvents.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Inbox size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No events match the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredEvents.map(evt => {
            const isExpanded = expandedEventId === evt.id;
            const module    = store.modules.find(m => m.id === evt.module_id);
            const connector = store.connectors.find(c => c.id === evt.connector_id);
            const campaign  = campaigns.find(c => c.id === evt.related_campaign_id);
            const statusColor = MODULE_EVENT_STATUS_COLOR[evt.status];

            return (
              <div key={evt.id} style={{ ...CARD, padding: '12px 14px', borderLeft: `3px solid ${statusColor}` }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {isExpanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{MODULE_EVENT_TYPE_LABEL[evt.event_type]}</span>
                    <StatusBadge label={evt.direction} color={evt.direction === 'inbound' ? '#60a5fa' : '#a78bfa'} />
                    <StatusBadge label={MODULE_EVENT_STATUS_LABEL[evt.status]} color={statusColor} />
                    {module    && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {MODULE_NAME_LABEL[module.module_name]}</span>}
                    {connector && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>via {connector.name}</span>}
                    {campaign  && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>· {campaign.name}</span>}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(evt.received_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {evt.payload_preview && (
                      <div>
                        <div style={SECTION_LABEL}>Payload Preview</div>
                        <pre style={{ fontSize: '0.73rem', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', overflow: 'auto', margin: 0, maxHeight: '120px' }}>
                          {evt.payload_preview}
                        </pre>
                      </div>
                    )}

                    {evt.error_message && (
                      <div style={{ padding: '8px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', fontSize: '0.76rem', color: '#fca5a5' }}>
                        <strong>Error:</strong> {evt.error_message}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      <span>Received: {new Date(evt.received_at).toLocaleString('vi-VN')}</span>
                      {evt.processed_at && <span>Processed: {new Date(evt.processed_at).toLocaleString('vi-VN')}</span>}
                      <span>ID: {evt.id}</span>
                    </div>

                    {canViewLogs && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {evt.status !== 'processed' && (
                          <button
                            onClick={() => handleEventStatus(evt.id, 'processed')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
                          >
                            <CheckCircle size={11} /> Mark Processed
                          </button>
                        )}
                        {evt.status !== 'needs_review' && (
                          <button
                            onClick={() => handleEventStatus(evt.id, 'needs_review')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
                          >
                            Needs Review
                          </button>
                        )}
                        {evt.status !== 'ignored' && (
                          <button
                            onClick={() => handleEventStatus(evt.id, 'ignored')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.73rem', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                          >
                            Ignore
                          </button>
                        )}
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
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Safety banner */}
      <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <AlertCircle size={16} style={{ color: '#fbbf24', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#fcd34d' }}>
          <strong>Connector Registry — Phase 13 — Registry only.</strong>{' '}
          No real API calls. No real webhooks sent. No auto-post. No real ads. No customer messaging.
          Production mode requires manual env setup and owner approval before activation.
          Mock events are simulated locally only.
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={20} style={{ color: '#818cf8' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Connector Registry</h2>
          <StatusBadge label="Phase 13" color="#818cf8" />
          <StatusBadge label="Registry only" color="#f59e0b" />
          {!isSupabaseConfigured && <StatusBadge label="Demo mode" color="#71717a" />}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {store.connectors.length} connectors · {store.modules.length} modules · {store.events.length} events
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {([
          { id: 'connectors',  icon: <Plug size={13} />,   label: 'Connectors',  count: store.connectors.length, badge: false },
          { id: 'modules',     icon: <Layers size={13} />, label: 'Modules',     count: store.modules.length,    badge: false },
          { id: 'event_inbox', icon: <Inbox size={13} />,  label: 'Event Inbox', count: pendingEventsCount,      badge: pendingEventsCount > 0 },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: activeSubTab === tab.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeSubTab === tab.id ? '#818cf8' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon}
            {tab.label}
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: tab.badge ? '#f87171' : (activeSubTab === tab.id ? '#818cf8' : 'var(--text-muted)'),
              background: tab.badge ? 'rgba(248,113,113,0.2)' : (activeSubTab === tab.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'),
              borderRadius: '10px', padding: '1px 6px',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'connectors'   && renderConnectors()}
      {activeSubTab === 'modules'      && renderModules()}
      {activeSubTab === 'event_inbox'  && renderEventInbox()}

      {/* Governance footer */}
      <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <Settings size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Governance reminders
        </div>
        <div>• All connectors are in registry-only state. No real API connection in Phase 13.</div>
        <div>• Production connector activation requires owner approval and .env setup on the backend.</div>
        <div>• API keys and tokens must NEVER appear in frontend code — use backend proxy.</div>
        <div>• No real ads will be created, no real messages sent, no real webhooks dispatched.</div>
        <div>• Mock events are simulated locally. Real n8n/module callbacks wired in Phase 14+.</div>
      </div>
    </div>
  );
}
