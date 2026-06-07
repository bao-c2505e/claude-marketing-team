import React, { useState, useCallback } from 'react';
import {
  Package,
  Check,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  FileText,
  Archive,
  Eye,
  ClipboardCopy,
} from 'lucide-react';
import type { RoleName, Client, Brand, Campaign, CampaignBrief, ExportPackType, ExportPackFormat } from '../../types/core';
import type { GenerationDataStore, ApprovalDataStore, AssetDataStore, CoreDataStore } from '../../lib/core/coreData';
import { loadExportPackData, saveExportPackData } from '../../lib/core/coreData';
import {
  generateExportPack,
  EXPORT_PACK_TYPE_LABEL,
  EXPORT_PACK_TYPE_DESCRIPTION,
  EXPORT_PACK_FORMAT_LABEL,
  EXPORT_PACK_TYPES,
  CLIENT_SAFE_EXPORT_TYPES,
} from '../../lib/core/exportPackGenerator';
import type { LocalExportPack } from '../../types/core';
import { can } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Props
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
// Helpers
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

export default function ExportPackTab({
  clients, brands, campaigns, briefs,
  genData, approvalData, assetData,
  userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId]   = useState('');
  const [selectedBrandId, setSelectedBrandId]     = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedExportType, setSelectedExportType] = useState<ExportPackType>('campaign_summary');
  const [selectedFormat, setSelectedFormat]       = useState<ExportPackFormat>('markdown');

  // ── Output state ──────────────────────────────────────────────────────────
  const [generatedPack, setGeneratedPack]   = useState<LocalExportPack | null>(null);
  const [historyPacks, setHistoryPacks]     = useState<LocalExportPack[]>(() => loadExportPackData().packs);
  const [showHistory, setShowHistory]       = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [isGenerating, setIsGenerating]     = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isClientRole = userRole === 'client' || userRole === 'viewer';
  const canGenerate  = can.exportPacks(userRole);
  const canView      = can.viewExportPacks(userRole);

  const availableExportTypes = isClientRole ? CLIENT_SAFE_EXPORT_TYPES : EXPORT_PACK_TYPES;

  const filteredBrands    = selectedClientId ? brands.filter(b => b.client_id === selectedClientId) : brands;
  const filteredCampaigns = selectedBrandId
    ? campaigns.filter(c => c.brand_id === selectedBrandId)
    : selectedClientId
      ? campaigns.filter(c => c.client_id === selectedClientId)
      : campaigns;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    setSelectedBrandId('');
    setSelectedCampaignId('');
  };

  const handleBrandChange = (id: string) => {
    setSelectedBrandId(id);
    setSelectedCampaignId('');
  };

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setIsGenerating(true);

    const coreData: CoreDataStore = { clients, brands, campaigns, briefs };

    const pack = generateExportPack({
      coreData,
      genData,
      approvalData,
      assetData,
      export_type:  selectedExportType,
      client_id:    selectedClientId  || null,
      brand_id:     selectedBrandId   || null,
      campaign_id:  selectedCampaignId || null,
      format:       selectedFormat,
      isClientSafe: isClientRole,
      generatedBy:  actorLabel,
    });

    setGeneratedPack(pack);

    // Persist to history
    const newHistory = [pack, ...historyPacks].slice(0, 50);
    setHistoryPacks(newHistory);
    saveExportPackData({ packs: newHistory });

    setIsGenerating(false);
  }, [canGenerate, clients, brands, campaigns, briefs, genData, approvalData, assetData,
      selectedExportType, selectedClientId, selectedBrandId, selectedCampaignId,
      selectedFormat, isClientRole, actorLabel, historyPacks]);

  const handleCopy = async () => {
    if (!generatedPack) return;
    try {
      await navigator.clipboard.writeText(generatedPack.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea
      const el = document.getElementById('export-pack-preview') as HTMLTextAreaElement | null;
      if (el) { el.select(); }
    }
  };

  const handleRegenerate = () => {
    setGeneratedPack(null);
    setTimeout(handleGenerate, 50);
  };

  const handleLoadHistoryPack = (pack: LocalExportPack) => {
    setGeneratedPack(pack);
    setShowHistory(false);
  };

  if (!canView) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <AlertCircle size={32} style={{ marginBottom: '12px' }} />
        <p>You do not have permission to access Export Pack.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Safety Banner ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <AlertCircle size={16} style={{ color: '#fbbf24', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#fcd34d' }}>
          <strong>Export Pack — Local Only.</strong>{' '}
          Export pack is prepared from Core workspace data. Export does not publish content, does not schedule posts, does not send messages, and does not upload files. Approved content is still NOT automatically published. Usage rights must be checked before publishing.
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={20} style={{ color: '#818cf8' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Export Pack</h2>
          <StatusBadge label="Phase 12" color="#818cf8" />
          <StatusBadge label="Local export only" color="#f59e0b" />
          {!isSupabaseConfigured && <StatusBadge label="Demo mode" color="#71717a" />}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '7px', fontSize: '0.8rem',
              background: showHistory ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showHistory ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
              color: showHistory ? '#818cf8' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Archive size={14} />
            History ({historyPacks.length})
          </button>
        </div>
      </div>

      {/* ── History Panel ── */}
      {showHistory && (
        <div style={CARD_STYLE}>
          <div style={SECTION_LABEL_STYLE}>Recent exports ({historyPacks.length})</div>
          {historyPacks.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No exports generated yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {historyPacks.map(pack => (
                <div
                  key={pack.id}
                  onClick={() => handleLoadHistoryPack(pack)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)', borderRadius: '7px',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{pack.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {EXPORT_PACK_FORMAT_LABEL[pack.format]} · {new Date(pack.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <Eye size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Left: Configure Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>1. Select scope</div>

            {/* Client */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Client
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={selectedClientId}
                  onChange={e => handleClientChange(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}
                >
                  <option value="">All clients</option>
                  {clients.filter(c => c.status !== 'archived').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Brand */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Brand
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={selectedBrandId}
                  onChange={e => handleBrandChange(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}
                >
                  <option value="">All brands</option>
                  {filteredBrands.filter(b => b.status !== 'archived').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Campaign */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Campaign
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem', paddingRight: '28px' }}
                >
                  <option value="">All campaigns</option>
                  {filteredCampaigns.filter(c => c.status !== 'archived').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>2. Export type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {availableExportTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedExportType(type)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                    background: selectedExportType === type ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedExportType === type ? 'rgba(99,102,241,0.45)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: selectedExportType === type ? '#818cf8' : 'var(--text-primary)' }}>
                    {EXPORT_PACK_TYPE_LABEL[type]}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {EXPORT_PACK_TYPE_DESCRIPTION[type]}
                  </span>
                </button>
              ))}
            </div>
            {isClientRole && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
                Client-safe export types only. Internal calendar and asset details are not included.
              </p>
            )}
          </div>

          <div style={CARD_STYLE}>
            <div style={SECTION_LABEL_STYLE}>3. Format</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['markdown', 'plain_text', 'json_preview'] as ExportPackFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  style={{
                    flex: 1, padding: '7px 6px', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600,
                    background: selectedFormat === fmt ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedFormat === fmt ? 'rgba(99,102,241,0.5)' : 'var(--border-color)'}`,
                    color: selectedFormat === fmt ? '#818cf8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {EXPORT_PACK_FORMAT_LABEL[fmt]}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {canGenerate ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '9px', fontSize: '0.9rem', fontWeight: 700,
                background: isGenerating ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.5)',
                color: '#818cf8', cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Package size={16} />
              {isGenerating ? 'Generating…' : 'Generate Export Pack'}
            </button>
          ) : (
            <div style={{ padding: '12px', borderRadius: '9px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
              View-only access — you can view generated packs but not generate new ones.
            </div>
          )}
        </div>

        {/* ── Right: Preview Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {!generatedPack ? (
            <div style={{ ...CARD_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '14px', minHeight: '400px' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                  No export generated yet
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Select scope and export type on the left, then click Generate.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Pack meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{generatedPack.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {EXPORT_PACK_FORMAT_LABEL[generatedPack.format]} · Generated {new Date(generatedPack.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRegenerate}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
                      background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)',
                      border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.4)'}`,
                      color: copied ? '#34d399' : '#818cf8', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
                    {copied ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
              </div>

              {/* Preview textarea */}
              <textarea
                id="export-pack-preview"
                readOnly
                value={generatedPack.content}
                style={{
                  width: '100%',
                  minHeight: '520px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {/* Copy fallback note */}
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                If "Copy to clipboard" is unavailable, click inside the preview box and press Ctrl+A then Ctrl+C.
              </p>

              {/* Governance note */}
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Governance reminders</div>
                <div>• Export pack is sourced from Core workspace data only — no real platform analytics.</div>
                <div>• Approved content is NOT published until a manual publish action is taken.</div>
                <div>• Usage rights for all assets must be verified before any external use.</div>
                <div>• This export does not schedule posts, send messages, or upload to any service.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
