import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ClipboardList, ChevronRight, Zap } from 'lucide-react';
import type { Client, Brand, Campaign, CampaignBrief, BriefStatus, RoleName } from '../../types/core';
import type { BriefFormData } from '../../lib/core/coreData';
import type { BriefUpdatePatch } from '../../lib/core/coreRepository';
import {
  BRIEF_STATUS_LABEL, BRIEF_STATUS_COLOR, EMPTY_BRIEF_FORM,
  parseLines, parseComma,
} from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  onBriefCreate: (data: BriefFormData) => Promise<CampaignBrief>;
  onBriefUpdate: (brief: CampaignBrief, patch: BriefUpdatePatch) => Promise<void>;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  onNavigateToGenerate?: (briefId: string) => void;
}

type Mode = 'list' | 'detail' | 'create' | 'edit';

function StatusBadge({ status }: { status: BriefStatus | null }) {
  const s = status ?? 'draft';
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600,
      color: BRIEF_STATUS_COLOR[s],
      background: `${BRIEF_STATUS_COLOR[s]}18`,
      borderRadius: '5px', padding: '2px 8px',
    }}>
      {BRIEF_STATUS_LABEL[s] ?? s}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginTop: '8px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-indigo)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

export default function BriefIntakeTab({ clients, brands, campaigns, briefs, onBriefCreate, onBriefUpdate, userRole, isSupabaseConfigured, onNavigateToGenerate }: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<BriefFormData>(EMPTY_BRIEF_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState('');
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');

  const canEdit = can.createCampaigns(userRole) || can.generateContent(userRole);
  const canApprove = can.approveContent(userRole);

  const brandsForClient = (cid: string) => brands.filter(b => b.client_id === cid);
  const campaignsForBrand = (bid: string) => campaigns.filter(c => c.brand_id === bid);
  const briefForCampaign = (cid: string) => briefs.find(b => b.campaign_id === cid);

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? '—';
  const brandName = (id: string) => brands.find(b => b.id === id)?.name ?? '—';
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—';

  const filteredBriefs = briefs.filter(b => {
    if (filterClientId && b.client_id !== filterClientId) return false;
    if (filterBrandId && b.brand_id !== filterBrandId) return false;
    if (filterCampaignId && b.campaign_id !== filterCampaignId) return false;
    return true;
  });

  // Auto-populate form from brand/campaign when creating
  useEffect(() => {
    if (mode === 'create' && form.brand_id) {
      const brand = brands.find(b => b.id === form.brand_id);
      if (brand) {
        setForm(p => ({
          ...p,
          tone_of_voice: p.tone_of_voice || brand.tone_of_voice || '',
          target_audience: p.target_audience || brand.target_audience || '',
          channels: p.channels || (brand.primary_channels ?? []).join(', '),
          product_focus: p.product_focus || brand.hero_product || '',
        }));
      }
    }
  }, [form.brand_id, mode, brands]);

  const validate = (): boolean => {
    if (mode === 'create') {
      if (!form.client_id) { setFormError('Please select a client.'); return false; }
      if (!form.brand_id) { setFormError('Please select a brand.'); return false; }
    }
    if (!form.campaign_id) { setFormError('Please select a campaign.'); return false; }
    if (!form.brief_title.trim()) { setFormError('Brief title is required.'); return false; }
    if (!form.campaign_goal.trim()) { setFormError('Campaign goal is required.'); return false; }
    if (!form.product_focus.trim()) { setFormError('Product focus is required.'); return false; }
    if (!form.target_audience.trim()) { setFormError('Target audience is required.'); return false; }
    if (!form.channels.trim()) { setFormError('At least one channel is required.'); return false; }
    if (!form.tone_of_voice.trim()) { setFormError('Tone of voice is required.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setFormLoading(true);
    setFormError('');
    try {
      if (mode === 'edit' && selectedId) {
        const brief = briefs.find(b => b.id === selectedId);
        if (!brief) throw new Error('Brief not found.');
        await onBriefUpdate(brief, {
          brief_title: form.brief_title,
          campaign_goal: form.campaign_goal,
          product_focus: form.product_focus,
          hero_product: form.product_focus,
          offer: form.offer || null,
          target_audience: form.target_audience,
          tone_of_voice: form.tone_of_voice,
          tone: form.tone_of_voice,
          channels: parseComma(form.channels),
          content_pillars: form.content_pillars ? parseLines(form.content_pillars) : null,
          key_messages: form.key_messages ? parseLines(form.key_messages) : null,
          campaign_goals: [form.campaign_goal],
          must_include: form.must_include || null,
          must_avoid: form.must_avoid || null,
          competitors: form.competitors || null,
          reference_links: form.reference_links || null,
          budget_note: form.budget_note || null,
          timeline_note: form.timeline_note || null,
          approval_requirements: form.approval_requirements || null,
        });
        setMode('detail');
        return;
      }

      // create
      const brand = brands.find(b => b.id === form.brand_id);
      const created = await onBriefCreate({
        ...form,
        brand_name: brand?.name ?? '',
        industry: brand?.industry ?? '',
      });
      setSelectedId(created.id);
      setMode('detail');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save brief. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (brief: CampaignBrief, newStatus: BriefStatus) => {
    setActionError(null);
    try {
      await onBriefUpdate(brief, { status: newStatus });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update brief status.');
    }
  };

  const openEdit = (brief: CampaignBrief) => {
    setForm({
      campaign_id: brief.campaign_id,
      brand_id: brief.brand_id ?? '',
      client_id: brief.client_id ?? '',
      brand_name: brief.brand_name ?? '',
      industry: brief.industry ?? '',
      brief_title: brief.brief_title ?? '',
      campaign_goal: brief.campaign_goal ?? (brief.campaign_goals?.[0] ?? ''),
      product_focus: brief.product_focus ?? brief.hero_product ?? '',
      offer: brief.offer ?? '',
      target_audience: brief.target_audience ?? '',
      channels: (brief.channels ?? []).join(', '),
      tone_of_voice: brief.tone_of_voice ?? brief.tone ?? '',
      content_pillars: (brief.content_pillars ?? []).join('\n'),
      key_messages: (brief.key_messages ?? []).join('\n'),
      must_include: brief.must_include ?? '',
      must_avoid: brief.must_avoid ?? '',
      competitors: brief.competitors ?? '',
      reference_links: brief.reference_links ?? '',
      budget_note: brief.budget_note ?? '',
      timeline_note: brief.timeline_note ?? '',
      approval_requirements: brief.approval_requirements ?? '',
    });
    setFormError('');
    setMode('edit');
  };

  const openCreate = (preselectedCampaignId?: string) => {
    const c = preselectedCampaignId ? campaigns.find(x => x.id === preselectedCampaignId) : null;
    setForm({
      ...EMPTY_BRIEF_FORM,
      campaign_id: preselectedCampaignId ?? '',
      brand_id: c?.brand_id ?? '',
      client_id: c?.client_id ?? '',
    });
    setFormError('');
    setSelectedId(null);
    setMode('create');
  };

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────

  if (mode === 'detail' && selectedId) {
    const brief = briefs.find(b => b.id === selectedId);
    if (!brief) { setMode('list'); return null; }

    const Row = ({ label, value }: { label: string; value: string | null | undefined }) =>
      value ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>{value}</p>
        </div>
      ) : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setMode('list')}>
            <ArrowLeft size={14} /> Back
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Brief Intake / {brief.brand_name} / {brief.brief_title}
          </span>
        </div>

        {actionError && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: '#f87171' }}>⚠ {actionError}</span>
            <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{brief.brief_title}</h2>
                <StatusBadge status={brief.status} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {clientName(brief.client_id ?? '')} · {brandName(brief.brand_id ?? '')} · {campaignName(brief.campaign_id)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {canEdit && <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '5px 12px' }} onClick={() => openEdit(brief)}>Edit Brief</button>}
              {canEdit && brief.status === 'draft' && (
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '5px 12px', color: '#60a5fa' }} onClick={() => handleStatusChange(brief, 'ready_for_generation')}>
                  Mark Ready for Generation
                </button>
              )}
              {canApprove && brief.status === 'ready_for_generation' && (
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '5px 12px', color: '#34d399' }} onClick={() => handleStatusChange(brief, 'approved_for_generation')}>
                  Approve for Generation
                </button>
              )}
              {canEdit && brief.status !== 'draft' && brief.status !== 'archived' && (
                <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '5px 12px', color: '#f59e0b' }} onClick={() => handleStatusChange(brief, 'needs_revision')}>
                  Needs Revision
                </button>
              )}
              {/* Phase 6: navigate to content generation */}
              {brief.status === 'approved_for_generation' && canEdit && onNavigateToGenerate ? (
                <button
                  onClick={() => onNavigateToGenerate(brief.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(244, 122, 31,0.5)', background: 'rgba(244, 122, 31,0.15)', color: '#fb923c', cursor: 'pointer' }}
                >
                  <Zap size={13} /> Generate Content
                </button>
              ) : (
                <button disabled style={{ opacity: 0.45, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(244, 122, 31,0.3)', background: 'rgba(244, 122, 31,0.08)', color: '#fb923c' }}>
                  <Zap size={13} /> Generate Content
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <Row label="Campaign Goal"      value={brief.campaign_goal} />
            <Row label="Product Focus"      value={brief.product_focus ?? brief.hero_product} />
            <Row label="Offer / Promotion"  value={brief.offer} />
            <Row label="Target Audience"    value={brief.target_audience} />
            <Row label="Tone of Voice"      value={brief.tone_of_voice ?? brief.tone} />
            <Row label="Channels"           value={(brief.channels ?? []).join(', ')} />
            <Row label="Content Pillars"    value={(brief.content_pillars ?? []).join(' · ')} />
            <Row label="Key Messages"       value={(brief.key_messages ?? []).join(' · ')} />
            <Row label="Must Include"       value={brief.must_include} />
            <Row label="Must Avoid"         value={brief.must_avoid} />
            <Row label="Competitors"        value={brief.competitors} />
            <Row label="Reference Links"    value={brief.reference_links} />
            <Row label="Budget Note"        value={brief.budget_note} />
            <Row label="Timeline Note"      value={brief.timeline_note} />
            <Row label="Approval Requirements" value={brief.approval_requirements} />
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#f59e0b' }}>
          🔒 Safety: Brief = Input only. Generation runs in the Content Generation tab. Generated ≠ Approved. Approved ≠ Published. No auto-post.
        </div>
      </div>
    );
  }

  // ── CREATE / EDIT FORM ────────────────────────────────────────────────────

  if (mode === 'create' || mode === 'edit') {
    const formBrandsForClient = form.client_id ? brandsForClient(form.client_id) : brands;
    const formCampaigns = form.brand_id ? campaignsForBrand(form.brand_id) : campaigns;

    const Field = ({ fkey, label, required, placeholder, half }: { fkey: keyof BriefFormData; label: string; required?: boolean; placeholder?: string; half?: boolean }) => (
      <div style={half ? {} : { gridColumn: 'span 2' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          {label}{required && ' *'}
        </label>
        <input
          className="form-control"
          value={form[fkey]}
          onChange={e => setForm(p => ({ ...p, [fkey]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: '100%' }}
        />
      </div>
    );

    const TextArea = ({ fkey, label, required, placeholder, rows }: { fkey: keyof BriefFormData; label: string; required?: boolean; placeholder?: string; rows?: number }) => (
      <div style={{ gridColumn: 'span 2' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
          {label}{required && ' *'}
        </label>
        <textarea
          className="form-control"
          value={form[fkey]}
          onChange={e => setForm(p => ({ ...p, [fkey]: e.target.value }))}
          placeholder={placeholder}
          rows={rows ?? 2}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={() => { mode === 'edit' ? setMode('detail') : setMode('list'); }}>
            <ArrowLeft size={14} /> Cancel
          </button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{mode === 'edit' ? 'Edit Brief' : 'New Campaign Brief'}</h2>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            <SectionLabel>Campaign Selection</SectionLabel>

            {mode === 'create' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Client *</label>
                  <select className="form-control" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, brand_id: '', campaign_id: '' }))} style={{ width: '100%' }}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Brand *</label>
                  <select className="form-control" value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value, campaign_id: '' }))} style={{ width: '100%' }}>
                    <option value="">Select brand…</option>
                    {formBrandsForClient.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Campaign *</label>
                  <select className="form-control" value={form.campaign_id} onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))} style={{ width: '100%' }}>
                    <option value="">Select campaign…</option>
                    {formCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </>
            )}
            {mode === 'edit' && (
              <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Campaign: <strong>{campaignName(form.campaign_id)}</strong> · Brand: <strong>{brandName(form.brand_id)}</strong>
              </div>
            )}

            <Field fkey="brief_title" label="Brief Title" required half placeholder="e.g. Brief Heo Quay Mùa Hè 2026" />
            <div /> {/* spacer */}

            <SectionLabel>Core Brief</SectionLabel>
            <TextArea fkey="campaign_goal" label="Campaign Goal" required rows={2} placeholder="Mục tiêu chính của chiến dịch…" />
            <Field fkey="product_focus" label="Product Focus" required half placeholder="e.g. Bánh tráng cuốn heo quay" />
            <Field fkey="offer" label="Offer / Promotion" half placeholder="e.g. Combo 2 người giảm 20%" />
            <TextArea fkey="target_audience" label="Target Audience" required rows={2} placeholder="Đối tượng khách hàng mục tiêu…" />

            <SectionLabel>Content Strategy</SectionLabel>
            <Field fkey="channels" label="Channels (comma-separated)" required half placeholder="Facebook, TikTok, Instagram" />
            <Field fkey="tone_of_voice" label="Tone of Voice" required half placeholder="e.g. Gần gũi, ngon miệng, thực tế" />
            <TextArea fkey="content_pillars" label="Content Pillars (one per line)" rows={2} placeholder="Ẩm thực địa phương&#10;Combo tiết kiệm&#10;Behind the kitchen" />
            <TextArea fkey="key_messages" label="Key Messages (one per line)" rows={2} placeholder="Da heo quay giòn rụm&#10;Street food premium" />

            <SectionLabel>Constraints &amp; Safety</SectionLabel>
            <TextArea fkey="must_include" label="Must Include" rows={2} placeholder="Bắt buộc có trong nội dung…" />
            <TextArea fkey="must_avoid" label="Must Avoid" rows={2} placeholder="Tuyệt đối không xuất hiện trong nội dung…" />
            <Field fkey="competitors" label="Competitors" half placeholder="e.g. Quán A, Quán B" />
            <Field fkey="reference_links" label="Reference Links" half placeholder="https://…" />

            <SectionLabel>Admin &amp; Approval</SectionLabel>
            <Field fkey="budget_note" label="Budget Note" half placeholder="e.g. 5,000,000 VND — 15 ngày" />
            <Field fkey="timeline_note" label="Timeline Note" half placeholder="e.g. 15 ngày bắt đầu Q3 2026" />
            <TextArea fkey="approval_requirements" label="Approval Requirements" rows={2} placeholder="Quy trình phê duyệt nội dung, người có quyền duyệt…" />

          </div>

          {formError && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', fontSize: '0.82rem', color: '#f87171' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={handleSave} disabled={formLoading}>
              {formLoading ? 'Saving…' : (mode === 'edit' ? 'Save Changes' : 'Save Brief as Draft')}
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} disabled={formLoading} onClick={() => { mode === 'edit' ? setMode('detail') : setMode('list'); }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────

  const filterBrandsForClient = filterClientId ? brandsForClient(filterClientId) : brands;
  const filterCampaignsForBrand = filterBrandId ? campaignsForBrand(filterBrandId) : campaigns;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={20} style={{ color: 'var(--accent-indigo)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Brief Intake</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fb923c', background: 'rgba(244, 122, 31,0.12)', borderRadius: '5px', padding: '2px 8px' }}>
            {filteredBriefs.length}
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Local demo data · Supabase not configured
            </span>
          )}
        </div>
        {canEdit && (
          <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => openCreate()}>
            <Plus size={15} /> New Brief
          </button>
        )}
      </div>

      {actionError && (
        <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#f87171' }}>⚠ {actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-control" value={filterClientId} onChange={e => { setFilterClientId(e.target.value); setFilterBrandId(''); setFilterCampaignId(''); }} style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" value={filterBrandId} onChange={e => { setFilterBrandId(e.target.value); setFilterCampaignId(''); }} style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}>
          <option value="">All Brands</option>
          {filterBrandsForClient.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="form-control" value={filterCampaignId} onChange={e => setFilterCampaignId(e.target.value)} style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'auto' }}>
          <option value="">All Campaigns</option>
          {filterCampaignsForBrand.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Brief cards */}
      {filteredBriefs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <ClipboardList size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No briefs found.{canEdit ? ' Click "+ New Brief" to create one.' : ''}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBriefs.map(b => {
            const hasMissingFields = !b.brief_title || !b.campaign_goal || !b.target_audience;
            return (
              <div key={b.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{b.brief_title ?? '(Untitled Brief)'}</span>
                    <StatusBadge status={b.status} />
                    {hasMissingFields && <span style={{ fontSize: '0.68rem', color: '#f87171', background: 'rgba(248,113,113,0.1)', borderRadius: '4px', padding: '1px 6px' }}>Incomplete</span>}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {clientName(b.client_id ?? '')} · {brandName(b.brand_id ?? '')} · {campaignName(b.campaign_id)}
                  </p>
                  {b.channels && b.channels.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {b.channels.map(ch => (
                        <span key={ch} style={{ fontSize: '0.68rem', color: '#fb923c', background: 'rgba(244, 122, 31,0.1)', borderRadius: '4px', padding: '1px 6px' }}>{ch}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {canEdit && b.status === 'draft' && (
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#60a5fa' }}
                      onClick={() => handleStatusChange(b, 'ready_for_generation')}>
                      Mark Ready
                    </button>
                  )}
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={() => { setSelectedId(b.id); setMode('detail'); }}>
                    View <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaigns without a brief */}
      {canEdit && (() => {
        const campaignsWithoutBrief = campaigns.filter(c => !briefForCampaign(c.id));
        if (campaignsWithoutBrief.length === 0) return null;
        return (
          <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '3px solid rgba(244, 122, 31,0.4)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '10px' }}>
              Campaigns without a brief ({campaignsWithoutBrief.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {campaignsWithoutBrief.map(c => (
                <button key={c.id} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px', color: '#fb923c' }}
                  onClick={() => openCreate(c.id)}>
                  + Brief for {c.name}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {!canEdit && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Read-only access — your role does not have brief creation permissions.
        </p>
      )}
    </div>
  );
}
