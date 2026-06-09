import { useState } from 'react';
import { Plus, ChevronRight, ArrowLeft, Users, Tag } from 'lucide-react';
import type { Client, Brand, Campaign, ResourceStatus } from '../../types/core';
import type { ClientFormData } from '../../lib/core/coreData';
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_COLOR } from '../../lib/core/coreData';
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
  onClientCreate: (data: ClientFormData) => Promise<void>;
  onClientUpdate: (id: string, patch: Partial<Client>) => Promise<void>;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  onNavigate: (tab: string, filter?: { clientId?: string; brandId?: string }) => void;
}

const EMPTY_FORM: ClientFormData = {
  name: '',
  industry: '',
  contact_name: '',
  contact_email: '',
  notes: '',
};

export default function ClientsTab({
  clients,
  brands,
  campaigns,
  onClientCreate,
  onClientUpdate,
  userRole,
  isSupabaseConfigured,
  onNavigate,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = can.manageClients(userRole);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const brandsForClient = (clientId: string) => brands.filter(b => b.client_id === clientId);
  const campaignsForClient = (clientId: string) => campaigns.filter(c => c.client_id === clientId);

  // ── Mutations (routed through repos in App.tsx) ──────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError('Client name is required.'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      await onClientCreate(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create client. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (clientId: string) => {
    setActionError(null);
    try {
      await onClientUpdate(clientId, { status: 'archived' as ResourceStatus });
      if (selectedId === clientId) setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to archive client.');
    }
  };

  const handleActivate = async (clientId: string) => {
    setActionError(null);
    try {
      await onClientUpdate(clientId, { status: 'active' as ResourceStatus });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to activate client.');
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────

  if (selectedId) {
    const client = clients.find(c => c.id === selectedId);
    if (!client) { setSelectedId(null); return null; }
    const clientBrands = brandsForClient(client.id);
    const clientCampaigns = campaignsForClient(client.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setSelectedId(null)}>
            <ArrowLeft size={14} /> Back to Clients
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clients / {client.name}</span>
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{client.name}</h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: CLIENT_STATUS_COLOR[client.status], background: `${CLIENT_STATUS_COLOR[client.status]}18`, borderRadius: '5px', padding: '2px 8px' }}>
                  {CLIENT_STATUS_LABEL[client.status]}
                </span>
              </div>
              {client.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>{client.notes}</p>}
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {client.status === 'archived'
                  ? <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} onClick={() => handleActivate(client.id)}>Reactivate</button>
                  : <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px', color: '#f59e0b' }} onClick={() => handleArchive(client.id)}>Archive</button>
                }
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Contact', value: client.contact_name || '—' },
              { label: 'Email', value: client.contact_email || '—' },
              { label: 'Brands', value: `${clientBrands.length}` },
              { label: 'Campaigns', value: `${clientCampaigns.length}` },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brands for this client */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Brands ({clientBrands.length})</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              onClick={() => onNavigate('brands', { clientId: client.id })}>
              View All Brands <ChevronRight size={13} />
            </button>
          </div>
          {clientBrands.length === 0
            ? <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No brands yet. Create one in the Brands tab.</p>
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {clientBrands.map(b => (
                  <button key={b.id}
                    onClick={() => onNavigate('brands', { clientId: client.id })}
                    style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>
                    {b.name}
                  </button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={20} style={{ color: 'var(--accent-indigo)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Clients</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.12)', borderRadius: '5px', padding: '2px 8px' }}>
            {clients.length}
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Local demo data · Supabase not configured
            </span>
          )}
        </div>
        {canManage && (
          <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(s => !s); setFormError(''); }}>
            <Plus size={15} /> New Client
          </button>
        )}
      </div>

      {/* Action-level error (archive / activate) */}
      {actionError && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>⚠ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
        </div>
      )}

      {/* Create form */}
      {showForm && canManage && (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-indigo)' }}>New Client</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {([
              { key: 'name',          label: 'Client Name *', placeholder: 'e.g. Vị Cuốn' },
              { key: 'industry',      label: 'Industry',      placeholder: 'e.g. F&B / Street Food' },
              { key: 'contact_name',  label: 'Contact Name',  placeholder: 'e.g. Nguyễn Văn A' },
              { key: 'contact_email', label: 'Contact Email', placeholder: 'e.g. owner@brand.vn' },
            ] as { key: keyof ClientFormData; label: string; placeholder: string }[]).map(f => (
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
          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Notes</label>
            <textarea
              className="form-control"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this client"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
              disabled={formLoading}
            />
          </div>
          {formError && <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '8px' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem', opacity: formLoading ? 0.6 : 1 }} onClick={handleCreate} disabled={formLoading}>
              {formLoading ? 'Saving…' : 'Create Client'}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(''); }} disabled={formLoading}>Cancel</button>
          </div>
        </div>
      )}

      {/* Client table */}
      <div className="glass-panel" style={{ padding: '4px 0', overflow: 'hidden' }}>
        {clients.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Tag size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No clients yet.{canManage ? ' Click "+ New Client" to add one.' : ''}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Client Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Contact</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Brands</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Campaigns</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                    {c.contact_name || '—'}<br />
                    {c.contact_email && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{c.contact_email}</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{brandsForClient(c.id).length}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{campaignsForClient(c.id).length}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: CLIENT_STATUS_COLOR[c.status], background: `${CLIENT_STATUS_COLOR[c.status]}18`, borderRadius: '5px', padding: '2px 8px' }}>
                      {CLIENT_STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setSelectedId(c.id)}>
                        View <ChevronRight size={13} />
                      </button>
                      {canManage && c.status !== 'archived' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#f59e0b' }} onClick={() => handleArchive(c.id)}>
                          Archive
                        </button>
                      )}
                      {canManage && c.status === 'archived' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#34d399' }} onClick={() => handleActivate(c.id)}>
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!canManage && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Read-only access — your role does not have client management permissions.
        </p>
      )}
    </div>
  );
}
