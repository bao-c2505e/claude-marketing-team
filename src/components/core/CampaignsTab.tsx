import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ChevronRight, Zap } from 'lucide-react';
import type { Client, Brand, Campaign, CampaignStatus } from '../../types/core';
import type { CampaignFormData } from '../../lib/core/coreData';
import { CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_COLOR } from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';
import type { RoleName } from '../../types/core';

// ---------------------------------------------------------------------------
// Phase 16B-1: mutations are routed through async repo handlers in App.tsx.
// generateId / onUpdate(CoreDataStore) removed — IDs come from the database row.
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  onCampaignCreate: (data: CampaignFormData) => Promise<void>;
  onCampaignUpdate: (campaign: Campaign, patch: Partial<Campaign>) => Promise<void>;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  initialFilterClientId?: string;
  initialFilterBrandId?: string;
}

const EMPTY_FORM: CampaignFormData = {
  client_id: '',
  brand_id: '',
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget_estimate: '',
  status: 'draft',
};

const STATUSES: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];

export default function CampaignsTab({ clients, brands, campaigns, onCampaignCreate, onCampaignUpdate, userRole, isSupabaseConfigured, initialFilterClientId, initialFilterBrandId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CampaignFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>(initialFilterClientId ?? '');
  const [filterBrandId, setFilterBrandId] = useState<string>(initialFilterBrandId ?? '');

  useEffect(() => {
    if (initialFilterClientId !== undefined) setFilterClientId(initialFilterClientId);
    if (initialFilterBrandId !== undefined) setFilterBrandId(initialFilterBrandId);
  }, [initialFilterClientId, initialFilterBrandId]);

  const canCreate = can.createCampaigns(userRole);
  const canEdit = can.editCampaigns(userRole);

  const brandsForClient = (clientId: string) => brands.filter(b => b.client_id === clientId);
  const clientName = (clientId: string) => clients.find(c => c.id === clientId)?.name ?? '—';
  const brandName = (brandId: string) => brands.find(b => b.id === brandId)?.name ?? '—';

  const filteredCampaigns = campaigns.filter(c => {
    if (filterClientId && c.client_id !== filterClientId) return false;
    if (filterBrandId && c.brand_id !== filterBrandId) return false;
    return true;
  });

  const formBrands = form.client_id ? brandsForClient(form.client_id) : brands;

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.client_id) { setFormError('Please select a client.'); return; }
    if (!form.brand_id) { setFormError('Please select a brand.'); return; }
    if (!form.name.trim()) { setFormError('Campaign name is required.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      await onCampaignCreate(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create campaign. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: CampaignStatus) => {
    setActionError(null);
    try {
      await onCampaignUpdate(campaign, { status: newStatus });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update campaign status.');
    }
  };

  // ── Detail view ───────────────────────────────────────────────────────────

  if (selectedId) {
    const campaign = campaigns.find(c => c.id === selectedId);
    if (!campaign) { setSelectedId(null); return null; }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setSelectedId(null)}>
            <ArrowLeft size={14} /> Back to Campaigns
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Campaigns / {clientName(campaign.client_id)} / {brandName(campaign.brand_id)} / {campaign.name}
          </span>
        </div>

        {actionError && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#f87171' }}>⚠ {actionError}</span>
            <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{campaign.name}</h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: CAMPAIGN_STATUS_COLOR[campaign.status], background: `${CAMPAIGN_STATUS_COLOR[campaign.status]}18`, borderRadius: '5px', padding: '2px 8px' }}>
                  {CAMPAIGN_STATUS_LABEL[campaign.status]}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{clientName(campaign.client_id)}</span>
                <span>·</span>
                <span>{brandName(campaign.brand_id)}</span>
              </div>
            </div>

            {canEdit && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Status</label>
                <select
                  className="form-control"
                  value={campaign.status}
                  onChange={e => handleStatusChange(campaign, e.target.value as CampaignStatus)}
                  style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{CAMPAIGN_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Start Date',    value: campaign.start_date ?? '—' },
              { label: 'End Date',      value: campaign.end_date ?? '—' },
              { label: 'Budget',        value: campaign.budget_estimate ? `${campaign.budget_estimate.toLocaleString()} ${campaign.currency}` : '—' },
              { label: 'Campaign Type', value: campaign.campaign_type.replace('_', ' ') },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {campaign.description && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Objective / Description</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{campaign.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {actionError && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>⚠ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} style={{ color: 'var(--accent-indigo)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Campaigns</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.12)', borderRadius: '5px', padding: '2px 8px' }}>
            {filteredCampaigns.length}
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Local demo data · Supabase not configured
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={filterClientId}
            onChange={e => { setFilterClientId(e.target.value); setFilterBrandId(''); }}
            style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="form-control"
            value={filterBrandId}
            onChange={e => setFilterBrandId(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}
          >
            <option value="">All Brands</option>
            {(filterClientId ? brandsForClient(filterClientId) : brands).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {canCreate && (
            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(s => !s); setFormError(''); setForm(f => ({ ...f, client_id: filterClientId || '', brand_id: filterBrandId || '' })); }}>
              <Plus size={15} /> New Campaign
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && canCreate && (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-indigo)' }}>New Campaign</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Client *</label>
              <select className="form-control" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, brand_id: '' }))} style={{ width: '100%' }}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Brand *</label>
              <select className="form-control" value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))} style={{ width: '100%' }}>
                <option value="">Select brand…</option>
                {formBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Campaign Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Heo Quay Mùa Hè 2026" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Start Date</label>
              <input type="date" className="form-control" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>End Date</label>
              <input type="date" className="form-control" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Budget (VND)</label>
              <input className="form-control" value={form.budget_estimate} onChange={e => setForm(p => ({ ...p, budget_estimate: e.target.value }))} placeholder="e.g. 5000000" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Initial Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as CampaignStatus }))} style={{ width: '100%' }}>
                {STATUSES.map(s => <option key={s} value={s}>{CAMPAIGN_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Objective / Description</label>
              <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Campaign objective, target channel, key message…" rows={2} style={{ width: '100%', resize: 'vertical' }} />
            </div>
          </div>
          {formError && <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '8px' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem', opacity: formLoading ? 0.6 : 1 }} onClick={handleCreate} disabled={formLoading}>
              {formLoading ? 'Saving…' : 'Create Campaign'}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }} disabled={formLoading}>Cancel</button>
          </div>
        </div>
      )}

      {/* Campaigns table */}
      <div className="glass-panel" style={{ padding: '4px 0', overflow: 'hidden' }}>
        {filteredCampaigns.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Zap size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No campaigns found.{canCreate ? ' Click "+ New Campaign" to add one.' : ''}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Campaign Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Client / Brand</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Dates</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Budget</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(c => (
                <tr key={c.id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.88rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {clientName(c.client_id)}<br />
                    <span style={{ color: 'var(--text-muted)' }}>{brandName(c.brand_id)}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {c.start_date ?? '—'}<br />
                    <span style={{ color: 'var(--text-muted)' }}>{c.end_date ?? '—'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {c.budget_estimate ? `${c.budget_estimate.toLocaleString()} VND` : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {canEdit ? (
                      <select
                        className="form-control"
                        value={c.status}
                        onChange={e => handleStatusChange(c, e.target.value as CampaignStatus)}
                        style={{ fontSize: '0.78rem', padding: '3px 8px', width: 'auto', color: CAMPAIGN_STATUS_COLOR[c.status] }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{CAMPAIGN_STATUS_LABEL[s]}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: CAMPAIGN_STATUS_COLOR[c.status], background: `${CAMPAIGN_STATUS_COLOR[c.status]}18`, borderRadius: '5px', padding: '2px 8px' }}>
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setSelectedId(c.id)}>
                      View <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!canCreate && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Read-only access — your role does not have campaign creation permissions.
        </p>
      )}
    </div>
  );
}
