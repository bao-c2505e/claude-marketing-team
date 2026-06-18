import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  PackageCheck,
  Check,
  ChevronDown,
  AlertCircle,
  FileText,
  ClipboardCopy,
  Download,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import type { RoleName, Client, Brand, Campaign, ContentPlanItem } from '../../types/core';
import type { ApprovalDataStore } from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';
import { MODULE_META, type ModuleKey } from '../../lib/core/approvalClassify';
import {
  loadManualDelivery,
  MANUAL_DELIVERY_LABEL,
  MANUAL_DELIVERY_COLOR,
  type ManualDeliveryMap,
} from '../../lib/core/manualDelivery';
import {
  collectHandoffCandidates,
  groupHandoffCandidates,
  buildHandoffPack,
  handoffFileStem,
  HANDOFF_FORMAT_LABEL,
  HANDOFF_MODULE_ORDER,
  HANDOFF_APPROVED_NOT_PUBLISHED,
  HANDOFF_SAFETY_NOTE,
  type HandoffFormat,
  type HandoffPack,
} from '../../lib/core/handoffPack';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  contentItems: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

// ---------------------------------------------------------------------------
// Shared styles (match ExportPackTab conventions)
// ---------------------------------------------------------------------------

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '16px',
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600,
      color, background: `${color}18`,
      borderRadius: '5px', padding: '2px 8px',
      border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClientHandoffTab({
  clients, brands, campaigns, contentItems, approvalData,
  userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  // ── Filter / option state ─────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId]     = useState('');
  const [selectedBrandId, setSelectedBrandId]       = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [moduleFilter, setModuleFilter]             = useState<ModuleKey | ''>('');
  const [packTitle, setPackTitle]                   = useState('');
  const [format, setFormat]                         = useState<HandoffFormat>('markdown');

  // ── Selection / output state ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [generatedPack, setGeneratedPack] = useState<HandoffPack | null>(null);
  const [copied, setCopied]             = useState(false);
  const [downloaded, setDownloaded]     = useState(false);

  // Manual delivery (Phase E) — read-only, local. Loaded once.
  const [deliveryMap, setDeliveryMap] = useState<ManualDeliveryMap>({});
  useEffect(() => { setDeliveryMap(loadManualDelivery()); }, []);

  // ── Permissions ───────────────────────────────────────────────────────────
  const canView  = can.viewExportPacks(userRole);
  const canBuild = can.exportPacks(userRole);

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredBrands    = selectedClientId ? brands.filter(b => b.client_id === selectedClientId) : brands;
  const filteredCampaigns = selectedBrandId
    ? campaigns.filter(c => c.brand_id === selectedBrandId)
    : selectedClientId
      ? campaigns.filter(c => c.client_id === selectedClientId)
      : campaigns;

  const candidates = useMemo(() => collectHandoffCandidates({
    clients, brands, campaigns,
    contentItems,
    approvalRequests: approvalData.approvalRequests,
    deliveryMap,
    scope: {
      clientId:   selectedClientId  || null,
      brandId:    selectedBrandId   || null,
      campaignId: selectedCampaignId || null,
      module:     moduleFilter      || null,
    },
  }), [clients, brands, campaigns, contentItems, approvalData.approvalRequests, deliveryMap,
       selectedClientId, selectedBrandId, selectedCampaignId, moduleFilter]);

  const groups = useMemo(() => groupHandoffCandidates(candidates), [candidates]);

  const selectedCandidates = useMemo(
    () => candidates.filter(c => selectedIds.has(c.approvalId)),
    [candidates, selectedIds],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClientChange = (id: string) => {
    setSelectedClientId(id); setSelectedBrandId(''); setSelectedCampaignId('');
  };
  const handleBrandChange = (id: string) => {
    setSelectedBrandId(id); setSelectedCampaignId('');
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroup = (ids: string[], allSelected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(i => next.delete(i));
      else ids.forEach(i => next.add(i));
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(candidates.map(c => c.approvalId)));
  const clearAll  = () => setSelectedIds(new Set());

  const handleBuild = useCallback(() => {
    if (!canBuild) return;
    const pack = buildHandoffPack({
      candidates: selectedCandidates,
      title: packTitle,
      format,
      generatedBy: actorLabel,
    });
    setGeneratedPack(pack);
  }, [canBuild, selectedCandidates, packTitle, format, actorLabel]);

  const handleCopy = async () => {
    if (!generatedPack) return;
    try {
      await navigator.clipboard.writeText(generatedPack.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('handoff-pack-preview') as HTMLTextAreaElement | null;
      if (el) el.select();
    }
  };

  // Local browser download only — Blob + object URL. No network, no upload.
  const handleDownload = () => {
    if (!generatedPack) return;
    const ext = generatedPack.format === 'markdown' ? 'md' : 'txt';
    const mime = generatedPack.format === 'markdown' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([generatedPack.content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${handoffFileStem(generatedPack.title)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  if (!canView) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={32} style={{ marginBottom: '12px' }} />
        <p>You do not have permission to access the Client Handoff Pack.</p>
      </div>
    );
  }

  const totalApproved = candidates.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Safety Banner ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <ShieldCheck size={16} style={{ color: '#34d399', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>
          <strong>{HANDOFF_SAFETY_NOTE}</strong>{' '}
          {HANDOFF_APPROVED_NOT_PUBLISHED} Building a pack only gathers approved drafts for copy/export — it does not email, upload, post, schedule, launch, spend, or pull live analytics.
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PackageCheck size={20} style={{ color: '#34d399' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Client Handoff Pack</h2>
          <StatusBadge label="Internal · copy/export only" color="#34d399" />
          {!isSupabaseConfigured && <StatusBadge label="Local Data Only" color="#f59e0b" />}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {totalApproved} approved output{totalApproved === 1 ? '' : 's'} available · {selectedIds.size} selected
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }} className="dash-cols">

        {/* ── Left: Configure Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Scope */}
          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>1. Filter scope</div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client</label>
              <div style={{ position: 'relative' }}>
                <select className="form-control" value={selectedClientId} onChange={e => handleClientChange(e.target.value)} style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}>
                  <option value="">All clients</option>
                  {clients.filter(c => c.status !== 'archived').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Brand</label>
              <div style={{ position: 'relative' }}>
                <select className="form-control" value={selectedBrandId} onChange={e => handleBrandChange(e.target.value)} style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}>
                  <option value="">All brands</option>
                  {filteredBrands.filter(b => b.status !== 'archived').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Campaign</label>
              <div style={{ position: 'relative' }}>
                <select className="form-control" value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}>
                  <option value="">All campaigns</option>
                  {filteredCampaigns.filter(c => c.status !== 'archived').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Module / type</label>
              <div style={{ position: 'relative' }}>
                <select className="form-control" value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleKey | '')} style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}>
                  <option value="">All modules</option>
                  {HANDOFF_MODULE_ORDER.map(m => <option key={m} value={m}>{MODULE_META[m].label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Pack title */}
          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>2. Pack title</div>
            <input
              className="form-control"
              value={packTitle}
              onChange={e => setPackTitle(e.target.value)}
              placeholder="e.g. June Content Handoff — Bản Khói"
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          {/* Format */}
          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>3. Export format</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['markdown', 'plain_text'] as HandoffFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  style={{
                    flex: 1, padding: '7px 6px', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600,
                    background: format === fmt ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${format === fmt ? 'rgba(52,211,153,0.5)' : 'var(--border-color)'}`,
                    color: format === fmt ? '#34d399' : 'var(--text-secondary)', cursor: 'pointer',
                  }}
                >
                  {HANDOFF_FORMAT_LABEL[fmt]}
                </button>
              ))}
            </div>
          </div>

          {/* Build button */}
          {canBuild ? (
            <button
              onClick={handleBuild}
              disabled={selectedIds.size === 0}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '9px', fontSize: '0.9rem', fontWeight: 700,
                background: selectedIds.size === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(52,211,153,0.18)',
                border: `1px solid ${selectedIds.size === 0 ? 'var(--border-color)' : 'rgba(52,211,153,0.5)'}`,
                color: selectedIds.size === 0 ? 'var(--text-muted)' : '#34d399',
                cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}
            >
              <PackageCheck size={16} />
              {selectedIds.size === 0 ? 'Select items to build' : `Build handoff pack (${selectedIds.size})`}
            </button>
          ) : (
            <div style={{ padding: '12px', borderRadius: '9px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              View-only access — you can review approved outputs but not build packs.
            </div>
          )}
        </div>

        {/* ── Right: Selection + Preview ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

          {/* Selection list */}
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ ...SECTION_LABEL_STYLE, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13} /> Approved outputs — grouped by client / brand / campaign
              </div>
              {canBuild && totalApproved > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={selectAll} style={miniBtn}>Select all</button>
                  <button onClick={clearAll} style={miniBtn}>Clear</button>
                </div>
              )}
            </div>

            {totalApproved === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                <FileText size={32} style={{ opacity: 0.4 }} />
                <div>
                  <p style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>No approved outputs in this scope</p>
                  <p style={{ fontSize: '0.78rem', margin: 0 }}>Approve outputs in the Approval Queue first — only approved items can be handed off.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto' }}>
                {groups.map(group => {
                  const groupIds = group.items.map(i => i.approvalId);
                  const allSelected = groupIds.every(id => selectedIds.has(id));
                  return (
                    <div key={group.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {group.clientName} · {group.brandName} · {group.campaignName}
                        </div>
                        {canBuild && (
                          <button onClick={() => toggleGroup(groupIds, allSelected)} style={{ ...miniBtn, fontSize: '0.68rem' }}>
                            {allSelected ? 'Deselect group' : 'Select group'}
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {group.items.map(c => {
                          const checked = selectedIds.has(c.approvalId);
                          const mColor = MODULE_META[c.module].color;
                          return (
                            <label
                              key={c.approvalId}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '9px 12px', borderRadius: '8px', cursor: canBuild ? 'pointer' : 'default',
                                background: checked ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${checked ? 'rgba(52,211,153,0.4)' : 'var(--border-color)'}`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canBuild}
                                onChange={() => toggleItem(c.approvalId)}
                                style={{ marginTop: '3px', accentColor: '#34d399', cursor: canBuild ? 'pointer' : 'default' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  <StatusBadge label={c.moduleLabel} color={mColor} />
                                  <StatusBadge label="Approved" color="#34d399" />
                                  {c.deliveryStatus !== 'not_delivered' && (
                                    <StatusBadge label={MANUAL_DELIVERY_LABEL[c.deliveryStatus]} color={MANUAL_DELIVERY_COLOR[c.deliveryStatus]} />
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          {generatedPack && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{generatedPack.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {HANDOFF_FORMAT_LABEL[generatedPack.format]} · {generatedPack.itemCount} item{generatedPack.itemCount === 1 ? '' : 's'} · Built {new Date(generatedPack.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleDownload} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
                    background: downloaded ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${downloaded ? 'rgba(96,165,250,0.4)' : 'var(--border-color)'}`,
                    color: downloaded ? '#60a5fa' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {downloaded ? <Check size={13} /> : <Download size={13} />}
                    {downloaded ? 'Saved' : `Download .${generatedPack.format === 'markdown' ? 'md' : 'txt'}`}
                  </button>
                  <button onClick={handleCopy} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
                    background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.15)',
                    border: `1px solid ${copied ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.4)'}`,
                    color: '#34d399', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>

              <textarea
                id="handoff-pack-preview"
                readOnly
                value={generatedPack.content}
                style={{
                  width: '100%', minHeight: '460px', background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px',
                  fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: '1.6', color: '#e2e8f0',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                If "Copy to clipboard" is unavailable, click inside the preview box and press Ctrl+A then Ctrl+C.
              </p>

              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Handoff reminders</div>
                <div>• {HANDOFF_APPROVED_NOT_PUBLISHED}</div>
                <div>• {HANDOFF_SAFETY_NOTE}</div>
                <div>• Items marked "Manually posted outside Core" were posted by the Owner/staff outside Core — Core did not post them.</div>
                <div>• Report data labels (Provided / Simulated / Missing / Owner input required) come from the draft; no metrics are invented.</div>
                <div>• Usage rights for all assets must be verified before any external publication.</div>
              </div>
            </>
          )}

          {!generatedPack && totalApproved > 0 && (
            <div style={{ ...CARD_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px', gap: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <PackageCheck size={32} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                Select approved items above and click <strong>Build handoff pack</strong> to preview, copy, or export.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)', cursor: 'pointer',
};
