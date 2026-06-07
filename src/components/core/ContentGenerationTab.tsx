import { useState, useEffect } from 'react';
import { Wand2, ArrowLeft, ChevronDown, ChevronRight, AlertTriangle, Zap } from 'lucide-react';
import type {
  Client, Brand, Campaign, CampaignBrief,
  ContentPlanJob, ContentPlanItem, PlanLengthDays, RoleName,
} from '../../types/core';
import type { GenerationDataStore } from '../../lib/core/coreData';
import {
  JOB_STATUS_LABEL, JOB_STATUS_COLOR,
  CONTENT_ITEM_STATUS_LABEL, CONTENT_ITEM_STATUS_COLOR,
  BRIEF_STATUS_COLOR,
} from '../../lib/core/coreData';
import { generateContentPlan } from '../../lib/core/contentGenerator';
import { can } from '../../lib/auth/permissions';

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  generationJobs: ContentPlanJob[];
  contentItems: ContentPlanItem[];
  onUpdate: (updated: GenerationDataStore) => void;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  initialBriefId?: string;
  onNavigateToApprovals?: () => void;
  submittableItemIds?: Set<string>;
}

type Mode = 'list' | 'detail';

const PLAN_LENGTHS: PlanLengthDays[] = [7, 15, 30];

function SafetyBanner() {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: '8px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        <strong style={{ color: '#f59e0b' }}>Mock Generation — AI API not connected.</strong>
        {' '}Content is deterministic template output derived from brief fields.{' '}
        <strong>Generated ≠ Approved. Approved ≠ Published.</strong>{' '}
        No auto-post. No real ads. All content requires human review before any real-world use.
      </p>
    </div>
  );
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600,
      color, background: `${color}18`,
      borderRadius: '5px', padding: '2px 7px',
    }}>
      {label}
    </span>
  );
}

export default function ContentGenerationTab({
  clients, brands, campaigns, briefs,
  generationJobs, contentItems,
  onUpdate, userRole, isSupabaseConfigured, initialBriefId,
  onNavigateToApprovals, submittableItemIds,
}: Props) {
  const [mode, setMode] = useState<Mode>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState<string>(initialBriefId ?? '');
  const [planLength, setPlanLength] = useState<PlanLengthDays>(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (initialBriefId) setSelectedBriefId(initialBriefId);
  }, [initialBriefId]);

  const canGenerate = can.generateContent(userRole);
  const canView     = can.viewContent(userRole);
  const approvedBriefs = briefs.filter(b => b.status === 'approved_for_generation');

  const clientName = (id: string | null) => id ? (clients.find(c => c.id === id)?.name ?? '—') : '—';
  const brandName  = (id: string | null) => id ? (brands.find(b => b.id === id)?.name ?? '—') : '—';
  const campName   = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—';
  const briefFor   = (id: string) => briefs.find(b => b.id === id);

  const handleGenerate = () => {
    const brief = briefs.find(b => b.id === selectedBriefId);
    if (!brief || brief.status !== 'approved_for_generation') return;
    setIsGenerating(true);
    setTimeout(() => {
      const { job, items } = generateContentPlan(brief, planLength, userRole);
      onUpdate({
        generationJobs: [job, ...generationJobs],
        contentItems: [...items, ...contentItems],
      });
      setSelectedJobId(job.id);
      setExpandedItemId(null);
      setMode('detail');
      setIsGenerating(false);
    }, 600);
  };

  const openDetail = (jobId: string) => {
    setSelectedJobId(jobId);
    setExpandedItemId(null);
    setMode('detail');
  };

  // ── Detail view ─────────────────────────────────────────────────────────────

  if (mode === 'detail' && selectedJobId) {
    const job      = generationJobs.find(j => j.id === selectedJobId);
    if (!job) { setMode('list'); return null; }
    const brief    = briefFor(job.brief_id);
    const jobItems = contentItems.filter(i => i.generation_job_id === selectedJobId)
                                 .sort((a, b) => a.day_number - b.day_number);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={() => setMode('list')}>
            <ArrowLeft size={14} /> Back to Content Generation
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Content Generation / {brief?.brief_title || job.brief_id}
          </span>
        </div>

        <SafetyBanner />

        {/* Job summary */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Wand2 size={16} style={{ color: '#818cf8' }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {brief?.brief_title || 'Content Plan'}
                </h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {campName(job.campaign_id)} · {brandName(job.brand_id)} · {clientName(job.client_id)}
              </p>
            </div>
            <StatusChip label={JOB_STATUS_LABEL[job.status] ?? job.status} color={JOB_STATUS_COLOR[job.status] ?? '#94a3b8'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            {[
              { label: 'Plan Length', value: `${job.plan_length_days} days` },
              { label: 'Content Items', value: `${job.item_count}` },
              { label: 'Generation Mode', value: job.generation_mode === 'mock' ? 'Mock (No AI)' : job.generation_mode },
              { label: 'Created', value: new Date(job.created_at).toLocaleDateString('vi-VN') },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{item.label}</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Mock badge */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Mock Generation / AI API Not Connected
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '5px', padding: '2px 8px' }}>
              Generated ≠ Approved ≠ Published
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '5px', padding: '2px 8px' }}>
              {isSupabaseConfigured ? 'Supabase' : 'Local demo data'}
            </span>
          </div>
        </div>

        {/* Content items */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Content Items ({jobItems.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              All items require human review before use
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {jobItems.map(item => {
              const isExpanded = expandedItemId === item.id;
              return (
                <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Row header */}
                  <div
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                      cursor: 'pointer', background: isExpanded ? 'rgba(99,102,241,0.05)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Day badge */}
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, minWidth: '40px', textAlign: 'center',
                      color: '#818cf8', background: 'rgba(99,102,241,0.12)', borderRadius: '5px', padding: '2px 6px',
                    }}>
                      D{item.day_number}
                    </span>

                    {/* Channel */}
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', borderRadius: '5px', padding: '2px 7px' }}>
                      {item.channel}
                    </span>

                    {/* Pillar */}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', padding: '2px 7px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.pillar}
                    </span>

                    {/* Angle */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}>
                      {item.angle}
                    </span>

                    {/* Hook preview (truncated) */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'none' }}
                      className="hook-preview">
                      {item.hook}
                    </span>

                    {/* Status */}
                    <StatusChip
                      label={CONTENT_ITEM_STATUS_LABEL[item.status] ?? item.status}
                      color={CONTENT_ITEM_STATUS_COLOR[item.status] ?? '#94a3b8'}
                    />

                    {/* Planned date */}
                    {item.planned_date && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.planned_date}
                      </span>
                    )}

                    {/* Expand toggle */}
                    {isExpanded
                      ? <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      : <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    }
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0,0,0,0.15)' }}>

                      {/* Hook */}
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hook</p>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>{item.hook}</p>
                      </div>

                      {/* Caption */}
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#60a5fa', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Caption</p>
                        <pre style={{ fontSize: '0.83rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'inherit', margin: 0 }}>{item.caption}</pre>
                      </div>

                      {/* Visual Brief */}
                      <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Visual Brief</p>
                        <p style={{ fontSize: '0.83rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>{item.visual_brief}</p>
                      </div>

                      {/* CTA + Hashtags row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CTA</p>
                          <p style={{ fontSize: '0.83rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>{item.cta}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hashtags</p>
                          <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#a78bfa', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)', wordBreak: 'break-word' }}>{item.hashtags}</p>
                        </div>
                      </div>

                      {/* Approval action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                        <p style={{ flex: 1, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          🔒 This content requires human review and approval before publishing. No auto-post.
                        </p>
                        {onNavigateToApprovals && submittableItemIds?.has(item.id) && (
                          <button
                            onClick={e => { e.stopPropagation(); onNavigateToApprovals(); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa', cursor: 'pointer', flexShrink: 0 }}
                          >
                            → Submit for Approval
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────

  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your role does not have permission to view content generation.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wand2 size={20} style={{ color: '#818cf8' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Content Generation</h2>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.12)', borderRadius: '5px', padding: '2px 8px' }}>
            {generationJobs.length} {generationJobs.length === 1 ? 'job' : 'jobs'}
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px', padding: '2px 8px' }}>
              Local demo data
            </span>
          )}
        </div>
      </div>

      <SafetyBanner />

      {/* Generate form */}
      {canGenerate && (
        <div className="glass-panel" style={{ padding: '20px', border: approvedBriefs.length > 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-indigo)' }}>
            Generate New Content Plan
          </h3>

          {approvedBriefs.length === 0 ? (
            <div style={{ padding: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', margin: 0 }}>
                No approved briefs found. Go to <strong>Brief Intake</strong> and approve a brief before generating content.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Brief selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Brief (Approved for Generation)
                </label>
                <select
                  className="form-control"
                  value={selectedBriefId}
                  onChange={e => setSelectedBriefId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">— Select a brief —</option>
                  {approvedBriefs.map(b => {
                    const campaign = campaigns.find(c => c.id === b.campaign_id);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.brief_title || b.brand_name} · {campaign?.name ?? b.campaign_id}
                      </option>
                    );
                  })}
                </select>
                {selectedBriefId && (() => {
                  const b = briefs.find(br => br.id === selectedBriefId);
                  return b ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                      {brandName(b.brand_id)} · {clientName(b.client_id)} · Goal: {b.campaign_goal?.split('.')[0] ?? '—'}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Plan length */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Plan Length
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PLAN_LENGTHS.map(len => (
                    <button
                      key={len}
                      onClick={() => setPlanLength(len)}
                      style={{
                        padding: '7px 20px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600,
                        border: planLength === len ? '1px solid rgba(99,102,241,0.6)' : '1px solid var(--border-color)',
                        background: planLength === len ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        color: planLength === len ? '#818cf8' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {len} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.88rem', fontWeight: 700 }}
                  onClick={handleGenerate}
                  disabled={!selectedBriefId || isGenerating}
                >
                  {isGenerating
                    ? <><Zap size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : <><Wand2 size={14} /> Generate {planLength}-Day Plan</>
                  }
                </button>
                {!selectedBriefId && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select a brief first.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approved briefs at a glance */}
      {approvedBriefs.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Approved Briefs Ready to Generate ({approvedBriefs.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {approvedBriefs.map(b => (
              <div
                key={b.id}
                onClick={() => { setSelectedBriefId(b.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px', borderRadius: '8px', cursor: canGenerate ? 'pointer' : 'default',
                  background: selectedBriefId === b.id ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.02)',
                  border: selectedBriefId === b.id ? '1px solid rgba(52,211,153,0.4)' : '1px solid var(--border-color)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{b.brief_title || b.brand_name}</span>
                <StatusChip label="Approved" color={BRIEF_STATUS_COLOR['approved_for_generation']} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation history */}
      <div className="glass-panel" style={{ padding: '4px 0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Generation History</h3>
          {generationJobs.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {contentItems.length} total content items generated
            </span>
          )}
        </div>

        {generationJobs.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center' }}>
            <Wand2 size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '4px' }}>No content plans generated yet.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              {approvedBriefs.length > 0
                ? 'Select an approved brief above and click "Generate" to create your first content plan.'
                : 'Approve a brief in Brief Intake first, then generate a content plan here.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Brief</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Campaign</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Items</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Mode</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {generationJobs.map(job => {
                const brief = briefFor(job.brief_id);
                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {brief?.brief_title || brief?.brand_name || job.brief_id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {campName(job.campaign_id)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {job.plan_length_days} days
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {job.item_count}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: '4px', padding: '1px 6px' }}>
                        Mock
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusChip label={JOB_STATUS_LABEL[job.status] ?? job.status} color={JOB_STATUS_COLOR[job.status] ?? '#94a3b8'} />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(job.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => openDetail(job.id)}>
                        View <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!canGenerate && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Read-only — your role does not have content generation permission.
        </p>
      )}
    </div>
  );
}
