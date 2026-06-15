import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Factory,
  FileText,
  Megaphone,
  PenTool,
  Shield,
  Video,
  Wand2,
} from 'lucide-react';
import type {
  Brand,
  Campaign,
  CampaignBrief,
  Client,
  ContentApprovalRequest,
  ContentPlanJob,
  ContentPlanItem,
  RoleName,
} from '../../types/core';

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  generationJobs: ContentPlanJob[];
  contentItems: ContentPlanItem[];
  approvalRequests: ContentApprovalRequest[];
  assetCount: number;
  reportCount: number;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
}

type WorkflowId = 'content-pack' | 'design-briefs' | 'video-scripts' | 'ads-pack' | 'report-draft';

type DraftWorkflow = {
  id: string;
  workflowId: WorkflowId;
  title: string;
  createdAt: string;
  status: 'draft';
};

const WORKFLOWS: Array<{
  id: WorkflowId;
  title: string;
  description: string;
  output: string;
  icon: JSX.Element;
}> = [
  {
    id: 'content-pack',
    title: 'Generate Content Pack',
    description: 'Draft captions, angles, channel notes, and handoff items from approved briefs.',
    output: 'Draft content pack',
    icon: <Wand2 size={18} />,
  },
  {
    id: 'design-briefs',
    title: 'Generate Design Briefs',
    description: 'Prepare visual direction, layout notes, asset references, and designer prompts.',
    output: 'Draft design briefs',
    icon: <PenTool size={18} />,
  },
  {
    id: 'video-scripts',
    title: 'Generate Video Scripts',
    description: 'Outline short-form scenes, hooks, overlays, and editor handoff notes.',
    output: 'Draft video scripts',
    icon: <Video size={18} />,
  },
  {
    id: 'ads-pack',
    title: 'Generate Ads Pack',
    description: 'Prepare draft ad angles, copy variants, audience notes, and budget questions.',
    output: 'Draft ads pack',
    icon: <Megaphone size={18} />,
  },
  {
    id: 'report-draft',
    title: 'Generate Report Draft',
    description: 'Summarize campaign status, approvals, assets, and reporting notes for Owner review.',
    output: 'Draft report',
    icon: <FileText size={18} />,
  },
];

export default function AutomationFactoryTab({
  clients,
  brands,
  campaigns,
  briefs,
  generationJobs,
  contentItems,
  approvalRequests,
  assetCount,
  reportCount,
  userRole,
  isSupabaseConfigured,
}: Props) {
  const [drafts, setDrafts] = useState<DraftWorkflow[]>([]);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const canUseFactory = userRole === 'owner' || userRole === 'manager';

  const readyBriefs = useMemo(
    () => briefs.filter(brief => brief.status === 'approved_for_generation').length,
    [briefs],
  );

  const pendingApprovals = useMemo(
    () => approvalRequests.filter(request => request.status === 'submitted').length,
    [approvalRequests],
  );

  const createDraft = (workflowId: WorkflowId) => {
    const workflow = WORKFLOWS.find(item => item.id === workflowId);
    if (!workflow) return;
    const draft: DraftWorkflow = {
      id: `factory-draft-${Date.now()}`,
      workflowId,
      title: workflow.output,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
    setDrafts(prev => [draft, ...prev]);
    setLastCreatedId(draft.id);
  };

  if (!canUseFactory) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <Shield size={34} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Automation Factory is restricted to internal Owner and Manager roles.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px', borderLeft: '4px solid #fb923c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Factory size={21} style={{ color: '#fb923c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Automation Factory
              </h2>
              <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                Draft workflows only
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: '760px' }}>
              Internal control surface for preparing draft work packages. These buttons do not call external APIs,
              do not connect to live platforms, and do not publish or launch anything.
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: isSupabaseConfigured ? '#60a5fa' : '#f59e0b', background: isSupabaseConfigured ? 'rgba(96,165,250,0.1)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '4px 9px' }}>
            {isSupabaseConfigured ? 'Supabase gated' : 'localStorage fallback'}
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Shield size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: '#f59e0b' }}>Approval-first safety:</strong> No auto-post. No auto-ads.
          No live connectors. No secrets. Owner approval required before use.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Clients', value: clients.length },
          { label: 'Brands', value: brands.length },
          { label: 'Campaigns', value: campaigns.length },
          { label: 'Briefs', value: briefs.length },
          { label: 'Ready Briefs', value: readyBriefs },
          { label: 'Generated Items', value: contentItems.length },
          { label: 'Pending Approvals', value: pendingApprovals },
          { label: 'Assets', value: assetCount },
          { label: 'Reports', value: reportCount },
        ].map(item => (
          <div key={item.label} className="glass-panel" style={{ padding: '13px 14px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</p>
            <h3 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', margin: 0 }}>{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Draft Workflow Starters</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Buttons create local UI draft records only. Real automation wiring is intentionally absent.
            </p>
          </div>
          <span className="badge badge-brand" style={{ fontSize: '0.68rem' }}>
            {generationJobs.length} generation jobs available
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
          {WORKFLOWS.map(workflow => (
            <div key={workflow.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#fb923c', background: 'rgba(244,122,31,0.1)', border: '1px solid rgba(244,122,31,0.25)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  {workflow.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>{workflow.title}</h4>
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>Coming next / draft workflow</span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {workflow.description}
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => createDraft(workflow.id)}
                style={{ justifyContent: 'center', fontSize: '0.82rem', marginTop: 'auto' }}
              >
                <Factory size={14} /> Create Local Draft
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: drafts.length ? '12px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={17} style={{ color: '#34d399' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Local Draft Queue</h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{drafts.length} draft records this session</span>
        </div>

        {drafts.length === 0 ? (
          <div style={{ padding: '22px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
            <AlertTriangle size={22} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              No draft workflows yet. Create one above to stage internal work without calling any connector.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drafts.map(draft => {
              const workflow = WORKFLOWS.find(item => item.id === draft.workflowId);
              const isNew = draft.id === lastCreatedId;
              return (
                <div key={draft.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', padding: '11px 12px', borderRadius: '8px', border: isNew ? '1px solid rgba(52,211,153,0.35)' : '1px solid var(--border-color)', background: isNew ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <p style={{ fontSize: '0.86rem', fontWeight: 700, margin: 0 }}>{draft.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {workflow?.title ?? draft.workflowId} - created {new Date(draft.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    Owner review required
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
