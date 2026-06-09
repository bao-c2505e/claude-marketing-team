import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ChevronRight, Store } from 'lucide-react';
import type { Client, Brand, Campaign } from '../../types/core';
import type { BrandFormData } from '../../lib/core/coreData';
import { CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_COLOR } from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';
import type { RoleName } from '../../types/core';

// ---------------------------------------------------------------------------
// Phase 16A fix: mutations are routed through async repo handlers in App.tsx.
// generateId / onUpdate(CoreDataStore) removed — IDs come from the database row.
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  onBrandCreate: (data: BrandFormData) => Promise<void>;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  initialFilterClientId?: string;
  onNavigate: (tab: string, filter?: { clientId?: string; brandId?: string }) => void;
}

const EMPTY_FORM: BrandFormData = {
  client_id: '',
  name: '',
  industry: '',
  hero_product: '',
  tone_of_voice: '',
  target_audience: '',
  primary_channels: 'Facebook',
};

export default function BrandsTab({
  clients,
  brands,
  campaigns,
  onBrandCreate,
  userRole,
  isSupabaseConfigured,
  initialFilterClientId,
  onNavigate,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BrandFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [filterClientId, setFilterClientId] = useState<string>(initialFilterClientId ?? '');

  useEffect(() => {
    if (initialFilterClientId) setFilterClientId(initialFilterClientId);
  }, [initialFilterClientId]);

  const canManage = can.manageBrands(userRole);

  const filteredBrands = filterClientId ? brands.filter(b => b.client_id === filterClientId) : brands;
  const campaignsForBrand = (brandId: string) => campaigns.filter(c => c.brand_id === brandId);
  const clientName = (clientId: string) => clients.find(c => c.id === clientId)?.name ?? '—';

  // ── Create (routed through repo in App.tsx) ───────────────────────────────

  const handleCreate = async () => {
    if (!form.client_id) { setFormError('Please select a client.'); return; }
    if (!form.name.trim()) { setFormError('Brand name is required.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      await onBrandCreate(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create brand. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Detail view ───────────────────────────────────────────────────────────

  if (selectedId) {
    const brand = brands.find(b => b.id === selectedId);
    if (!brand) { setSelectedId(null); return null; }
    const brandCampaigns = campaignsForBrand(brand.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setSelectedId(null)}>
            <ArrowLeft size={14} /> Back to Brands
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Brands / {clientName(brand.client_id)} / {brand.name}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{brand.name}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', padding: '2px 8px' }}>
              {clientName(brand.client_id)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Industry',        value: brand.industry ?? '—' },
              { label: 'Hero Product',    value: brand.hero_product ?? '—' },
              { label: 'Tone of Voice',   value: brand.tone_of_voice ?? '—' },
              { label: 'Target Audience', value: brand.target_audience ?? '—' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.88rem' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {brand.primary_channels && brand.primary_channels.length > 0 && (
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Channels</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {brand.primary_channels.map(ch => (
                  <span key={ch} style={{ fontSize: '0.78rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '5px', padding: '2px 10px' }}>{ch}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Campaigns for this brand */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Campaigns ({brandCampaigns.length})</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              onClick={() => onNavigate('campaigns', { brandId: brand.id })}>
              View Campaigns <ChevronRight size={13} />
            </button>
          </div>
          {brandCampaigns.length === 0
            ? <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No campaigns yet. Create one in the Campaigns tab.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {brandCampaigns.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: CAMPAIGN_STATUS_COLOR[c.status], background: `${CAMPAIGN_STATUS_COLOR[c.status]}18`, borderRadius: '5px', padding: '2px 8px' }}>
                      {CAMPAIGN_STATUS_LABEL[c.status]}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Store size={20} style={{ color: 'var(--accent-indigo)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Brands</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.12)', borderRadius: '5px', padding: '2px 8px' }}>
            {filteredBrands.length}
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Local demo data · Supabase not configured
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            value={filterClientId}
            onChange={e => setFilterClientId(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {canManage && (
            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(s => !s); setFormError(''); setForm(f => ({ ...f, client_id: filterClientId || '' })); }}>
              <Plus size={15} /> New Brand
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && canManage && (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-indigo)' }}>New Brand</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Client *</label>
              <select className="form-control" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} style={{ width: '100%' }} disabled={formLoading}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {([
              { key: 'name',            label: 'Brand Name *',      placeholder: 'e.g. Vị Cuốn' },
              { key: 'industry',        label: 'Industry',           placeholder: 'e.g. F&B / Street Food' },
              { key: 'hero_product',    label: 'Hero Product',       placeholder: 'e.g. Bánh tráng cuốn heo quay' },
              { key: 'tone_of_voice',   label: 'Tone of Voice',      placeholder: 'e.g. Gần gũi, ngon miệng' },
              { key: 'target_audience', label: 'Target Audience',    placeholder: 'e.g. Dân văn phòng 22-35 tại Vinh' },
              { key: 'primary_channels',label: 'Channels (comma-separated)', placeholder: 'Facebook, TikTok, Instagram' },
            ] as { key: keyof BrandFormData; label: string; placeholder: string }[]).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>{f.label}</label>
                <input
                  className="form-control"
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%' }}
                  disabled={formLoading}
                />
              </div>
            ))}
          </div>
          {formError && <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '8px' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem', opacity: formLoading ? 0.6 : 1 }} onClick={handleCreate} disabled={formLoading}>
              {formLoading ? 'Saving…' : 'Create Brand'}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }} disabled={formLoading}>Cancel</button>
          </div>
        </div>
      )}

      {/* Brand cards */}
      {filteredBrands.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Store size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No brands found.{canManage ? ' Click "+ New Brand" to add one.' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredBrands.map(b => {
            const bCampaigns = campaignsForBrand(b.id);
            return (
              <div key={b.id} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>{b.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{clientName(b.client_id)}</p>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: '5px', padding: '2px 8px' }}>Active</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  {b.industry && <span style={{ color: 'var(--text-secondary)' }}>{b.industry}</span>}
                  {b.hero_product && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{b.hero_product}</span>}
                </div>

                {b.primary_channels && b.primary_channels.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {b.primary_channels.map(ch => (
                      <span key={ch} style={{ fontSize: '0.7rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', borderRadius: '4px', padding: '1px 7px' }}>{ch}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bCampaigns.length} campaign{bCampaigns.length !== 1 ? 's' : ''}</span>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setSelectedId(b.id)}>
                    View <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!canManage && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Read-only access — your role does not have brand management permissions.
        </p>
      )}
    </div>
  );
}
