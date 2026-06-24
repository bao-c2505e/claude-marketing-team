// Campaign Pack Panel — Phase Q (Client-ready Campaign Pack Export / Handoff)
// ---------------------------------------------------------------------------
// A SAFE, campaign-scoped export panel embedded in the Campaign Production
// Workspace (Phase K). It lets the Owner gather ONE campaign's Owner-APPROVED
// deliverables into a client-presentation-grade pack and COPY or DOWNLOAD it
// locally — nothing else.
//
//   • Pure read of existing local data (the campaign's content items, approval
//     requests + events, and the Phase E manual-delivery map). No DB write, no
//     network call, no upload.
//   • Building a pack does NOT change any approval state — only items already in
//     status `approved` become deliverables (collectCampaignPackItems filters).
//   • Copy = clipboard; Download = a local Blob/object-URL .md/.txt file. Core
//     never emails, posts, schedules, launches, spends, or pulls live analytics.
//   • "Approved ≠ Published" stays on every pack (campaignPack.ts safety copy).
//
// This panel owns its own UI state, which is exactly why it lives in a separate
// component: the parent CampaignWorkspace stays stateless / display-only so its
// Phase K source-scan safety test (no useState, no mutation) keeps holding.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  PackageCheck,
  Check,
  ClipboardCopy,
  Download,
  ShieldCheck,
  FileText,
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
import { MODULE_META } from '../../lib/core/approvalClassify';
import {
  loadManualDelivery,
  MANUAL_DELIVERY_LABEL,
  MANUAL_DELIVERY_COLOR,
  type ManualDeliveryMap,
} from '../../lib/core/manualDelivery';
import {
  resolveCampaignPackContext,
  collectCampaignPackItems,
  campaignModuleBreakdown,
  buildCampaignPack,
  campaignPackFileStem,
  CAMPAIGN_PACK_FORMAT_LABEL,
  CAMPAIGN_PACK_SAFETY_NOTE,
  CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED,
  type CampaignPackFormat,
  type CampaignPack,
} from '../../lib/core/campaignPack';

interface Props {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  /** Briefs already scoped to this campaign (may be empty). */
  briefs: CampaignBrief[];
  /** Content plan items already scoped to this campaign. */
  contentItems: ContentPlanItem[];
  /** Approval requests already scoped to this campaign. */
  approvalRequests: ContentApprovalRequest[];
  /** Approval events already scoped to this campaign (Phase P audit trail). */
  approvalEvents: ContentApprovalEvent[];
  userRole: RoleName | null;
  actorLabel: string;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '16px',
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
};

const miniBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)', cursor: 'pointer',
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, color,
      background: `${color}18`, borderRadius: '5px', padding: '2px 8px',
      border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

export default function CampaignPackPanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole, actorLabel,
}: Props) {
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [packTitle, setPackTitle]         = useState('');
  const [format, setFormat]               = useState<CampaignPackFormat>('markdown');
  const [generatedPack, setGeneratedPack] = useState<CampaignPack | null>(null);
  const [copied, setCopied]               = useState(false);
  const [downloaded, setDownloaded]       = useState(false);

  // Manual delivery (Phase E) — read-only, local. Loaded once.
  const [deliveryMap, setDeliveryMap] = useState<ManualDeliveryMap>({});
  useEffect(() => { setDeliveryMap(loadManualDelivery()); }, []);

  const canBuild = can.exportPacks(userRole);

  // Resolve the campaign's brand-context cover from the SAME normalizer the AI
  // Factory + Approval Queue use (internal / draft-only — never a live source).
  const context = useMemo(() => resolveCampaignPackContext({
    campaign,
    clients: client ? [client] : [],
    brands: brand ? [brand] : [],
    briefs,
  }), [campaign, client, brand, briefs]);

  // Only items in status `approved` for this campaign become deliverables.
  const items = useMemo(() => collectCampaignPackItems({
    campaignId: campaign.id,
    contentItems,
    approvalRequests,
    approvalEvents,
    deliveryMap,
  }), [campaign.id, contentItems, approvalRequests, approvalEvents, deliveryMap]);

  const breakdown = useMemo(() => campaignModuleBreakdown(items), [items]);

  const selectedItems = useMemo(
    () => items.filter(i => selectedIds.has(i.approvalId)),
    [items, selectedIds],
  );

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(items.map(i => i.approvalId)));
  const clearAll  = () => setSelectedIds(new Set());

  const handleBuild = useCallback(() => {
    if (!canBuild) return;
    setGeneratedPack(buildCampaignPack({
      context,
      items: selectedItems,
      title: packTitle,
      format,
      generatedBy: actorLabel,
    }));
  }, [canBuild, context, selectedItems, packTitle, format, actorLabel]);

  const handleCopy = async () => {
    if (!generatedPack) return;
    try {
      await navigator.clipboard.writeText(generatedPack.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('campaign-pack-preview') as HTMLTextAreaElement | null;
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
    a.download = `${campaignPackFileStem(generatedPack.title)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const totalApproved = items.length;

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #34d399' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <PackageCheck size={18} style={{ color: '#34d399' }} /> Campaign Pack — Client-ready Export
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge label="Internal · copy/export only" color="#34d399" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {totalApproved} approved · {selectedIds.size} selected
          </span>
        </div>
      </div>

      {/* ── Safety line ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: '#34d399', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>
          <strong>{CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED}</strong>{' '}
          {CAMPAIGN_PACK_SAFETY_NOTE} Building a pack only gathers this campaign's approved drafts for copy/export — it does not email, upload, schedule, spend, or pull live analytics.
        </div>
      </div>

      {totalApproved === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '34px 20px', gap: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <FileText size={30} style={{ opacity: 0.4 }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>No approved deliverables for this campaign yet</p>
            <p style={{ fontSize: '0.77rem', margin: 0 }}>Approve this campaign's outputs in the Approval Queue first — only approved items can be packed.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start' }} className="dash-cols">

          {/* ── Left: configure + select ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={CARD_STYLE}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                <div style={{ ...SECTION_LABEL_STYLE, marginBottom: 0 }}>1. Select approved deliverables</div>
                {canBuild && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={selectAll} style={miniBtn}>All</button>
                    <button onClick={clearAll} style={miniBtn}>Clear</button>
                  </div>
                )}
              </div>
              {breakdown.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                  {breakdown.map(b => (
                    <StatusBadge key={b.module} label={`${b.label}: ${b.count}`} color={MODULE_META[b.module].color} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                {items.map(c => {
                  const checked = selectedIds.has(c.approvalId);
                  const mColor = MODULE_META[c.module].color;
                  return (
                    <label
                      key={c.approvalId}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '9px',
                        padding: '9px 11px', borderRadius: '8px', cursor: canBuild ? 'pointer' : 'default',
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
                        <div style={{ fontSize: '0.81rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
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

            <div style={CARD_STYLE}>
              <div style={SECTION_LABEL_STYLE}>2. Pack title</div>
              <input
                className="form-control"
                value={packTitle}
                onChange={e => setPackTitle(e.target.value)}
                placeholder={`e.g. ${brand?.name ?? 'Campaign'} — ${campaign.name}`}
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            <div style={CARD_STYLE}>
              <div style={SECTION_LABEL_STYLE}>3. Export format</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['markdown', 'plain_text'] as CampaignPackFormat[]).map(fmt => (
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
                    {CAMPAIGN_PACK_FORMAT_LABEL[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {canBuild ? (
              <button
                onClick={handleBuild}
                disabled={selectedIds.size === 0}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '11px', borderRadius: '9px', fontSize: '0.88rem', fontWeight: 700,
                  background: selectedIds.size === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(52,211,153,0.18)',
                  border: `1px solid ${selectedIds.size === 0 ? 'var(--border-color)' : 'rgba(52,211,153,0.5)'}`,
                  color: selectedIds.size === 0 ? 'var(--text-muted)' : '#34d399',
                  cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <PackageCheck size={15} />
                {selectedIds.size === 0 ? 'Select items to build' : `Build campaign pack (${selectedIds.size})`}
              </button>
            ) : (
              <div style={{ padding: '11px', borderRadius: '9px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                View-only access — you can review approved outputs but not build packs.
              </div>
            )}
          </div>

          {/* ── Right: preview ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
            {generatedPack ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{generatedPack.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {CAMPAIGN_PACK_FORMAT_LABEL[generatedPack.format]} · {generatedPack.itemCount} item{generatedPack.itemCount === 1 ? '' : 's'} · Built {new Date(generatedPack.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDownload} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '7px', fontSize: '0.79rem', fontWeight: 600,
                      background: downloaded ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${downloaded ? 'rgba(96,165,250,0.4)' : 'var(--border-color)'}`,
                      color: downloaded ? '#60a5fa' : 'var(--text-secondary)', cursor: 'pointer',
                    }}>
                      {downloaded ? <Check size={13} /> : <Download size={13} />}
                      {downloaded ? 'Saved' : `Download .${generatedPack.format === 'markdown' ? 'md' : 'txt'}`}
                    </button>
                    <button onClick={handleCopy} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '7px', fontSize: '0.79rem', fontWeight: 600,
                      background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.45)',
                      color: '#34d399', cursor: 'pointer',
                    }}>
                      {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
                      {copied ? 'Copied!' : 'Copy to clipboard'}
                    </button>
                  </div>
                </div>

                <textarea
                  id="campaign-pack-preview"
                  readOnly
                  value={generatedPack.content}
                  style={{
                    width: '100%', minHeight: '420px', background: 'rgba(0,0,0,0.35)',
                    border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px',
                    fontFamily: 'monospace', fontSize: '0.77rem', lineHeight: '1.6', color: '#e2e8f0',
                    resize: 'vertical', boxSizing: 'border-box',
                  }}
                />

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  If "Copy to clipboard" is unavailable, click inside the preview box and press Ctrl+A then Ctrl+C.
                </p>

                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Pack reminders</div>
                  <div>• {CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED}</div>
                  <div>• {CAMPAIGN_PACK_SAFETY_NOTE}</div>
                  <div>• Items marked "Manually posted outside Core" were handled by the Owner/staff outside Core — Core did not post them.</div>
                  <div>• Report data labels (Provided / Simulated / Missing / Owner input required) come from the draft; no metrics are invented.</div>
                  <div>• Usage rights for all assets must be verified before any external publication.</div>
                </div>
              </>
            ) : (
              <div style={{ ...CARD_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px', gap: '10px', color: 'var(--text-muted)', textAlign: 'center', minHeight: '200px' }}>
                <PackageCheck size={30} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: '0.81rem', margin: 0 }}>
                  Select approved items and click <strong>Build campaign pack</strong> to preview, copy, or download.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
