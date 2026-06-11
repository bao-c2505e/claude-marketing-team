import { useState, useMemo } from 'react';
import {
  FolderOpen, Image, Video, FileText, Award, Film, Link2, Box,
  Plus, Shield, ChevronDown, ChevronUp, AlertCircle, Edit2, X, Check,
} from 'lucide-react';
import type { Client, Brand, Campaign, AssetItem, LocalAssetCollection, AssetType, AssetApprovalStatus, RoleName } from '../../types/core';
import type { AssetDataStore } from '../../lib/core/coreData';
import type { AssetCreateInput, AssetUpdatePatch } from '../../lib/core/coreRepository';
import {
  ASSET_TYPE_LABEL, ASSET_TYPE_COLOR,
  ASSET_SOURCE_LABEL, ASSET_APPROVAL_LABEL, ASSET_APPROVAL_COLOR,
  ASSET_TYPES, ASSET_APPROVAL_STATUSES,
} from '../../lib/core/coreData';
import { can, isInternalRole } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  assetData: AssetDataStore;
  onAssetCreate: (input: AssetCreateInput) => Promise<void>;
  onAssetEdit: (asset: AssetItem, patch: AssetUpdatePatch) => Promise<void>;
  onAssetArchive: (asset: AssetItem) => Promise<void>;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

interface AssetFormState {
  name: string;
  asset_type: AssetType;
  client_id: string;
  brand_id: string;
  campaign_id: string;
  asset_collection_id: string;
  url: string;
  file_name: string;
  file_size_note: string;
  tags: string;
  usage_rights_note: string;
  notes: string;
  approval_status: AssetApprovalStatus;
}

const EMPTY_FORM: AssetFormState = {
  name: '',
  asset_type: 'image',
  client_id: '',
  brand_id: '',
  campaign_id: '',
  asset_collection_id: '',
  url: '',
  file_name: '',
  file_size_note: '',
  tags: '',
  usage_rights_note: '',
  notes: '',
  approval_status: 'draft',
};

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function AssetTypeIcon({ type, size = 14 }: { type: AssetType; size?: number }) {
  const color = ASSET_TYPE_COLOR[type];
  const props = { size, style: { color } };
  switch (type) {
    case 'image':       return <Image {...props} />;
    case 'video':       return <Video {...props} />;
    case 'design':      return <Edit2 {...props} />;
    case 'document':    return <FileText {...props} />;
    case 'logo':        return <Award {...props} />;
    case 'raw_footage': return <Film {...props} />;
    case 'reference':   return <Link2 {...props} />;
    default:            return <Box {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Safety banner
// ---------------------------------------------------------------------------

function AssetSafetyBanner() {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: '8px',
      background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.28)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <Shield size={14} style={{ color: '#34d399', flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', color: '#34d399', lineHeight: 1.5 }}>
        <strong>Asset Library — metadata only in Phase 10.</strong>{' '}
        No real file upload. No auto-publish. Usage rights must be verified before publishing.
        Approved asset ≠ published content.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset form (create / edit)
// ---------------------------------------------------------------------------

function AssetForm({
  initial, clients, brands, campaigns, collections,
  onSave, onCancel, canSetStatus, mode, saving, error,
}: {
  initial: AssetFormState;
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  collections: LocalAssetCollection[];
  onSave: (form: AssetFormState) => void;
  onCancel: () => void;
  canSetStatus: boolean;
  mode: 'create' | 'edit';
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<AssetFormState>(initial);
  const set = (k: keyof AssetFormState) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const filteredBrands  = brands.filter(b => !form.client_id || b.client_id === form.client_id);
  const filteredCampaigns = campaigns.filter(c => !form.brand_id || c.brand_id === form.brand_id);
  const filteredCollections = collections.filter(c =>
    (!form.client_id || c.client_id === form.client_id) &&
    (!form.brand_id  || c.brand_id  === form.brand_id)
  );

  const valid = form.name.trim().length > 0;

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const };
  const label = (text: string, req = false) => (
    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
      {text}{req && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
    </label>
  );

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {error && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#f87171' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Name */}
        <div style={{ gridColumn: 'span 2' }}>
          {label('Asset Name', true)}
          <input
            className="form-control" style={inputStyle}
            value={form.name} onChange={e => set('name')(e.target.value)}
            placeholder="e.g. Vị Cuốn Hero Shot #1"
          />
        </div>

        {/* Type */}
        <div>
          {label('Asset Type', true)}
          <select className="form-control" style={inputStyle} value={form.asset_type}
            onChange={e => set('asset_type')(e.target.value as AssetType)}>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>)}
          </select>
        </div>

        {/* Approval status (owner/manager only) */}
        {canSetStatus ? (
          <div>
            {label('Approval Status')}
            <select className="form-control" style={inputStyle} value={form.approval_status}
              onChange={e => set('approval_status')(e.target.value as AssetApprovalStatus)}>
              {ASSET_APPROVAL_STATUSES.map(s => <option key={s} value={s}>{ASSET_APPROVAL_LABEL[s]}</option>)}
            </select>
          </div>
        ) : <div />}

        {/* Tenant scope is fixed after creation (Phase 16D) */}
        {mode === 'edit' && (
          <div style={{ gridColumn: 'span 2' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Client / Brand / Campaign are set when an asset is created and cannot be changed afterwards.
            </p>
          </div>
        )}

        {/* Client */}
        <div>
          {label('Client')}
          <select className="form-control" style={inputStyle} value={form.client_id} disabled={mode === 'edit'}
            onChange={e => { set('client_id')(e.target.value); set('brand_id')(''); set('campaign_id')(''); }}>
            <option value="">— All Clients —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Brand */}
        <div>
          {label('Brand')}
          <select className="form-control" style={inputStyle} value={form.brand_id} disabled={mode === 'edit'}
            onChange={e => { set('brand_id')(e.target.value); set('campaign_id')(''); }}>
            <option value="">— All Brands —</option>
            {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* Campaign (optional) */}
        <div>
          {label('Campaign (optional)')}
          <select className="form-control" style={inputStyle} value={form.campaign_id} disabled={mode === 'edit'}
            onChange={e => set('campaign_id')(e.target.value)}>
            <option value="">— Not campaign-specific —</option>
            {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Collection (optional) */}
        <div>
          {label('Asset Collection (optional)')}
          <select className="form-control" style={inputStyle} value={form.asset_collection_id}
            onChange={e => set('asset_collection_id')(e.target.value)}>
            <option value="">— No collection —</option>
            {filteredCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* URL (optional) */}
        <div style={{ gridColumn: 'span 2' }}>
          {label('External URL (optional)')}
          <input
            className="form-control" style={inputStyle} type="url"
            value={form.url} onChange={e => set('url')(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* File info */}
        <div>
          {label('File Name (optional)')}
          <input
            className="form-control" style={inputStyle}
            value={form.file_name} onChange={e => set('file_name')(e.target.value)}
            placeholder="e.g. hero-shot-01.jpg"
          />
        </div>

        <div>
          {label('File Size Note (optional)')}
          <input
            className="form-control" style={inputStyle}
            value={form.file_size_note} onChange={e => set('file_size_note')(e.target.value)}
            placeholder="e.g. ~3MB JPEG"
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Storage upload deferred to a later phase.
          </p>
        </div>

        {/* Tags */}
        <div style={{ gridColumn: 'span 2' }}>
          {label('Tags (comma-separated)')}
          <input
            className="form-control" style={inputStyle}
            value={form.tags} onChange={e => set('tags')(e.target.value)}
            placeholder="e.g. logo, brand-identity, official"
          />
        </div>

        {/* Usage rights */}
        <div style={{ gridColumn: 'span 2' }}>
          {label('Usage Rights Note')}
          <textarea
            className="form-control" style={{ ...inputStyle, resize: 'vertical' }}
            rows={2} value={form.usage_rights_note}
            onChange={e => set('usage_rights_note')(e.target.value)}
            placeholder="Who owns this asset? Where/how can it be used?"
          />
        </div>

        {/* Notes */}
        <div style={{ gridColumn: 'span 2' }}>
          {label('Internal Notes')}
          <textarea
            className="form-control" style={{ ...inputStyle, resize: 'vertical' }}
            rows={2} value={form.notes}
            onChange={e => set('notes')(e.target.value)}
            placeholder="Internal notes, production context, next steps..."
          />
        </div>

      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '7px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Cancel
        </button>
        <button
          onClick={() => valid && !saving && onSave(form)}
          disabled={!valid || saving}
          style={{ background: (valid && !saving) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${(valid && !saving) ? 'rgba(99,102,241,0.5)' : 'var(--border-color)'}`, color: (valid && !saving) ? '#818cf8' : 'var(--text-muted)', borderRadius: '7px', padding: '8px 20px', cursor: (valid && !saving) ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Check size={14} /> {saving ? 'Saving…' : 'Save Asset'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset card (expandable)
// ---------------------------------------------------------------------------

function AssetCard({
  asset, brands, campaigns, collections, expanded, onToggle,
  canManage, onEdit, onArchive,
}: {
  asset: AssetItem;
  brands: Brand[];
  campaigns: Campaign[];
  collections: LocalAssetCollection[];
  expanded: boolean;
  onToggle: () => void;
  canManage: boolean;
  onEdit: (a: AssetItem) => void;
  onArchive: (id: string) => void;
}) {
  const brand    = brands.find(b => b.id === asset.brand_id);
  const campaign = campaigns.find(c => c.id === asset.campaign_id);
  const col      = collections.find(c => c.id === asset.asset_collection_id);

  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}
      >
        {/* Type icon */}
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${ASSET_TYPE_COLOR[asset.asset_type]}18`, border: `1px solid ${ASSET_TYPE_COLOR[asset.asset_type]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AssetTypeIcon type={asset.asset_type} size={16} />
        </div>

        {/* Name + brand */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {brand?.name ?? '—'}{campaign ? ` · ${campaign.name}` : ''}
          </div>
        </div>

        {/* Tags (3 max) */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {asset.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ fontSize: '0.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              {tag}
            </span>
          ))}
          {asset.tags.length > 2 && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{asset.tags.length - 2}</span>}
        </div>

        {/* Type badge */}
        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: `${ASSET_TYPE_COLOR[asset.asset_type]}18`, color: ASSET_TYPE_COLOR[asset.asset_type], border: `1px solid ${ASSET_TYPE_COLOR[asset.asset_type]}40`, flexShrink: 0 }}>
          {ASSET_TYPE_LABEL[asset.asset_type]}
        </span>

        {/* Approval status */}
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: `${ASSET_APPROVAL_COLOR[asset.approval_status]}18`, color: ASSET_APPROVAL_COLOR[asset.approval_status], border: `1px solid ${ASSET_APPROVAL_COLOR[asset.approval_status]}40`, flexShrink: 0 }}>
          {ASSET_APPROVAL_LABEL[asset.approval_status]}
        </span>

        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Source Type</p>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>{ASSET_SOURCE_LABEL[asset.source_type]}</p>
            </div>

            {asset.file_name && (
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>File</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {asset.file_name}
                  {asset.file_size_note && <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>({asset.file_size_note})</span>}
                </p>
              </div>
            )}

            {asset.url && (
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>URL</p>
                <p style={{ fontSize: '0.82rem', color: '#60a5fa', wordBreak: 'break-all' }}>{asset.url}</p>
              </div>
            )}

            {col && (
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Collection</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{col.name}</p>
              </div>
            )}

            {asset.usage_rights_note && (
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Usage Rights</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{asset.usage_rights_note}</p>
              </div>
            )}

            {asset.notes && (
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Notes</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{asset.notes}</p>
              </div>
            )}

            {asset.tags.length > 0 && (
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Tags</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {asset.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Storage upload note */}
          <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', fontSize: '0.75rem', color: '#f59e0b' }}>
            Storage upload (Supabase/Drive) deferred to a later phase. Metadata only in Phase 10.
          </div>

          {/* Actions */}
          {canManage && asset.approval_status !== 'archived' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onEdit(asset)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '7px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <Edit2 size={12} /> Edit Metadata
              </button>
              <button
                onClick={() => onArchive(asset.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(113,113,122,0.08)', border: '1px solid rgba(113,113,122,0.25)', color: '#71717a', borderRadius: '7px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                <X size={12} /> Archive
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AssetLibraryTab({
  clients, brands, campaigns, assetData, onAssetCreate, onAssetEdit, onAssetArchive,
  userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  const [filterClientId,  setFilterClientId]  = useState('');
  const [filterBrandId,   setFilterBrandId]   = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterType,      setFilterType]      = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [showCollections, setShowCollections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = can.manageAssets(userRole);
  const canView   = can.viewAssets(userRole);
  const isInternal = isInternalRole(userRole);

  // Client-facing users only see approved assets
  const visibleAssets = useMemo(() => {
    let list = assetData.assets;
    if (!isInternal) list = list.filter(a => a.approval_status === 'approved');
    if (filterClientId)   list = list.filter(a => a.client_id === filterClientId);
    if (filterBrandId)    list = list.filter(a => a.brand_id  === filterBrandId);
    if (filterCampaignId) list = list.filter(a => a.campaign_id === filterCampaignId);
    if (filterType)       list = list.filter(a => a.asset_type  === filterType);
    if (filterStatus)     list = list.filter(a => a.approval_status === filterStatus);
    return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [assetData.assets, filterClientId, filterBrandId, filterCampaignId, filterType, filterStatus, isInternal]);

  const filteredBrands   = brands.filter(b => !filterClientId || b.client_id === filterClientId);
  const filteredCampaigns = campaigns.filter(c => !filterBrandId || c.brand_id === filterBrandId);

  const totalByType   = ASSET_TYPES.map(t => ({ type: t, count: assetData.assets.filter(a => a.asset_type === t).length })).filter(x => x.count > 0);
  const pendingCount  = assetData.assets.filter(a => a.approval_status === 'needs_review').length;

  // ---------- handlers ----------

  const handleCreateSave = async (form: AssetFormState) => {
    setError(null);
    setSaving(true);
    try {
      await onAssetCreate({
        clientId:     form.client_id  || null,
        brandId:      form.brand_id   || null,
        campaignId:   form.campaign_id || null,
        briefId:      null,
        generationId: null,
        contentItemId: null,
        data: {
          asset_collection_id: form.asset_collection_id || null,
          name:                form.name.trim(),
          asset_type:          form.asset_type,
          source_type:         form.url.trim() ? 'external_url' : 'local_placeholder',
          url:                 form.url.trim() || null,
          thumbnail_url:       null,
          file_name:           form.file_name.trim() || null,
          file_size_note:      form.file_size_note.trim() || null,
          mime_type:           null,
          tags:                form.tags.split(',').map(t => t.trim()).filter(Boolean),
          usage_rights_note:   form.usage_rights_note.trim() || null,
          approval_status:     canManage ? form.approval_status : 'draft',
          notes:               form.notes.trim() || null,
          created_by:          actorLabel,
        },
      });
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (form: AssetFormState) => {
    if (!editingAsset) return;
    setError(null);
    setSaving(true);
    try {
      await onAssetEdit(editingAsset, {
        name:                form.name.trim(),
        asset_type:          form.asset_type,
        asset_collection_id: form.asset_collection_id || null,
        source_type:         form.url.trim() ? 'external_url' : 'local_placeholder',
        url:                 form.url.trim() || null,
        file_name:           form.file_name.trim() || null,
        file_size_note:      form.file_size_note.trim() || null,
        tags:                form.tags.split(',').map(t => t.trim()).filter(Boolean),
        usage_rights_note:   form.usage_rights_note.trim() || null,
        approval_status:     canManage ? form.approval_status : editingAsset.approval_status,
        notes:               form.notes.trim() || null,
      });
      setEditingAsset(null);
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    const asset = assetData.assets.find(a => a.id === id);
    if (!asset) return;
    setError(null);
    try {
      await onAssetArchive(asset);
      setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive asset.');
    }
  };

  const openEdit = (asset: AssetItem) => {
    setError(null);
    setEditingAsset(asset);
    setView('edit');
  };

  const editInitial = (a: AssetItem): AssetFormState => ({
    name:                a.name,
    asset_type:          a.asset_type,
    client_id:           a.client_id  ?? '',
    brand_id:            a.brand_id   ?? '',
    campaign_id:         a.campaign_id ?? '',
    asset_collection_id: a.asset_collection_id ?? '',
    url:                 a.url ?? '',
    file_name:           a.file_name ?? '',
    file_size_note:      a.file_size_note ?? '',
    tags:                a.tags.join(', '),
    usage_rights_note:   a.usage_rights_note ?? '',
    notes:               a.notes ?? '',
    approval_status:     a.approval_status,
  });

  // ---------- guard ----------

  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: '#f87171', marginBottom: '12px' }} />
        <p style={{ color: '#f87171', fontWeight: 600 }}>Access denied.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>You do not have permission to view the Asset Library.</p>
      </div>
    );
  }

  // ---------- create / edit form views ----------

  if (view === 'create') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setView('list')} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>← Back to Library</button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Asset Metadata</h2>
        </div>
        <AssetSafetyBanner />
        <AssetForm
          initial={EMPTY_FORM} clients={clients} brands={brands}
          campaigns={campaigns} collections={assetData.collections}
          onSave={handleCreateSave} onCancel={() => setView('list')} canSetStatus={canManage}
          mode="create" saving={saving} error={error}
        />
      </div>
    );
  }

  if (view === 'edit' && editingAsset) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { setView('list'); setEditingAsset(null); }} style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>← Back to Library</button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Asset — {editingAsset.name}</h2>
        </div>
        <AssetSafetyBanner />
        <AssetForm
          initial={editInitial(editingAsset)} clients={clients} brands={brands}
          campaigns={campaigns} collections={assetData.collections}
          onSave={handleEditSave} onCancel={() => { setView('list'); setEditingAsset(null); }} canSetStatus={canManage}
          mode="edit" saving={saving} error={error}
        />
      </div>
    );
  }

  // ---------- list view ----------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={22} style={{ color: '#f59e0b' }} /> Asset Library
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Brand assets, creative references, and campaign media metadata.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '3px 8px' }}>Offline Mode</span>
          )}
          {pendingCount > 0 && canManage && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '6px', padding: '3px 8px' }}>
              {pendingCount} pending review
            </span>
          )}
          {canManage && (
            <button
              onClick={() => setView('create')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <Plus size={14} /> New Asset
            </button>
          )}
        </div>
      </div>

      <AssetSafetyBanner />

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
          <FolderOpen size={16} style={{ color: '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{assetData.assets.length}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Assets</div>
          </div>
        </div>
        {totalByType.slice(0, 5).map(x => (
          <div key={x.type} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AssetTypeIcon type={x.type as AssetType} size={14} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: ASSET_TYPE_COLOR[x.type as AssetType] }}>{x.count}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{ASSET_TYPE_LABEL[x.type as AssetType]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Collections panel (collapsible) */}
      {assetData.collections.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <button
            onClick={() => setShowCollections(!showCollections)}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={14} style={{ color: '#f59e0b' }} /> Collections ({assetData.collections.length})
            </span>
            {showCollections ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>
          {showCollections && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginTop: '14px' }}>
              {assetData.collections.map(col => {
                const colAssets = assetData.assets.filter(a => a.asset_collection_id === col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => { setFilterBrandId(col.brand_id ?? ''); setFilterClientId(col.client_id ?? ''); }}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{col.name}</div>
                    {col.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.4 }}>{col.description}</div>}
                    <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>{colAssets.length} asset{colAssets.length !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-control" style={{ minWidth: '140px', flex: 1 }} value={filterClientId}
          onChange={e => { setFilterClientId(e.target.value); setFilterBrandId(''); setFilterCampaignId(''); }}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" style={{ minWidth: '140px', flex: 1 }} value={filterBrandId}
          onChange={e => { setFilterBrandId(e.target.value); setFilterCampaignId(''); }}>
          <option value="">All Brands</option>
          {filteredBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="form-control" style={{ minWidth: '140px', flex: 1 }} value={filterCampaignId}
          onChange={e => setFilterCampaignId(e.target.value)}>
          <option value="">All Campaigns</option>
          {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" style={{ minWidth: '130px', flex: 1 }} value={filterType}
          onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ASSET_TYPES.map(t => <option key={t} value={t}>{ASSET_TYPE_LABEL[t]}</option>)}
        </select>
        {isInternal && (
          <select className="form-control" style={{ minWidth: '130px', flex: 1 }} value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {ASSET_APPROVAL_STATUSES.map(s => <option key={s} value={s}>{ASSET_APPROVAL_LABEL[s]}</option>)}
          </select>
        )}
        {(filterClientId || filterBrandId || filterCampaignId || filterType || filterStatus) && (
          <button
            onClick={() => { setFilterClientId(''); setFilterBrandId(''); setFilterCampaignId(''); setFilterType(''); setFilterStatus(''); }}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Asset list */}
      {visibleAssets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No assets match the current filters.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
            {canManage ? 'Create your first asset metadata record using the "New Asset" button above.' : 'No approved assets are available for this selection.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 4px' }}>
            {visibleAssets.length} asset{visibleAssets.length !== 1 ? 's' : ''} found
          </div>
          {visibleAssets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              brands={brands}
              campaigns={campaigns}
              collections={assetData.collections}
              expanded={expandedId === asset.id}
              onToggle={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
              canManage={canManage}
              onEdit={openEdit}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
