import { useEffect, useMemo, useState } from 'react';
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
import type { ContentFactoryOptions, ContentFactoryResult, ContentFactoryRunInput } from '../../lib/core/contentFactory';
import { getContentFactoryWebhookUrl } from '../../lib/core/contentFactory';
import type { DesignFactoryResult } from '../../lib/core/designFactory';
import { getDesignFactoryWebhookUrl } from '../../lib/core/designFactory';
import type { VideoFactoryResult } from '../../lib/core/videoFactory';
import { getVideoFactoryWebhookUrl } from '../../lib/core/videoFactory';
import type { AdsFactoryResult } from '../../lib/core/adsFactory';
import { getAdsFactoryWebhookUrl } from '../../lib/core/adsFactory';
import type { ReportFactoryResult } from '../../lib/core/reportFactory';
import { getReportFactoryWebhookUrl } from '../../lib/core/reportFactory';

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
  onGenerateContentPack: (input: ContentFactoryRunInput) => Promise<ContentFactoryResult>;
  onGenerateDesignBriefs: (input: ContentFactoryRunInput) => Promise<DesignFactoryResult>;
  onGenerateVideoScripts: (input: ContentFactoryRunInput) => Promise<VideoFactoryResult>;
  onGenerateAdsPack: (input: ContentFactoryRunInput) => Promise<AdsFactoryResult>;
  onGenerateReportDraft: (input: ContentFactoryRunInput) => Promise<ReportFactoryResult>;
  actorLabel: string;
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
  onGenerateContentPack,
  onGenerateDesignBriefs,
  onGenerateVideoScripts,
  onGenerateAdsPack,
  onGenerateReportDraft,
  actorLabel,
}: Props) {
  const [drafts, setDrafts] = useState<DraftWorkflow[]>([]);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedBriefId, setSelectedBriefId] = useState('');
  const [contentOptions, setContentOptions] = useState<ContentFactoryOptions>({
    planLengthDays: 7,
    channel: 'Facebook',
    goal: 'branding',
  });
  const [isGeneratingContentPack, setIsGeneratingContentPack] = useState(false);
  const [contentPackMessage, setContentPackMessage] = useState<string | null>(null);
  const [contentPackError, setContentPackError] = useState<string | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [designMessage, setDesignMessage] = useState<string | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isGeneratingAds, setIsGeneratingAds] = useState(false);
  const [adsMessage, setAdsMessage] = useState<string | null>(null);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const canUseFactory = userRole === 'owner' || userRole === 'manager';
  // n8n AI provider is active when its webhook env is configured; otherwise the
  // workflow runs the local fallback generator. Drives the labels. Content Pack
  // and Design Brief each have their own webhook env / external_module path.
  const n8nConfigured = getContentFactoryWebhookUrl() !== null;
  const designConfigured = getDesignFactoryWebhookUrl() !== null;
  const videoConfigured = getVideoFactoryWebhookUrl() !== null;
  const adsConfigured = getAdsFactoryWebhookUrl() !== null;
  const reportConfigured = getReportFactoryWebhookUrl() !== null;

  const readyBriefs = useMemo(
    () => briefs.filter(brief => brief.status === 'approved_for_generation').length,
    [briefs],
  );

  const pendingApprovals = useMemo(
    () => approvalRequests.filter(request => request.status === 'submitted').length,
    [approvalRequests],
  );

  const availableBrands = useMemo(
    () => brands.filter(brand => !selectedClientId || brand.client_id === selectedClientId),
    [brands, selectedClientId],
  );

  const availableCampaigns = useMemo(
    () => campaigns.filter(campaign =>
      (!selectedClientId || campaign.client_id === selectedClientId) &&
      (!selectedBrandId || campaign.brand_id === selectedBrandId)
    ),
    [campaigns, selectedBrandId, selectedClientId],
  );

  const availableBriefs = useMemo(
    () => briefs.filter(brief =>
      (!selectedClientId || brief.client_id === selectedClientId) &&
      (!selectedBrandId || brief.brand_id === selectedBrandId) &&
      (!selectedCampaignId || brief.campaign_id === selectedCampaignId)
    ),
    [briefs, selectedBrandId, selectedCampaignId, selectedClientId],
  );

  const selectedClient = clients.find(client => client.id === selectedClientId) ?? null;
  const selectedBrand = brands.find(brand => brand.id === selectedBrandId) ?? null;
  const selectedCampaign = campaigns.find(campaign => campaign.id === selectedCampaignId) ?? null;
  const selectedBrief = briefs.find(brief => brief.id === selectedBriefId) ?? null;

  useEffect(() => {
    if (!selectedClientId && clients[0]) setSelectedClientId(clients[0].id);
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (!availableBrands.some(brand => brand.id === selectedBrandId)) {
      setSelectedBrandId(availableBrands[0]?.id ?? '');
    }
  }, [availableBrands, selectedBrandId]);

  useEffect(() => {
    if (!availableCampaigns.some(campaign => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(availableCampaigns[0]?.id ?? '');
    }
  }, [availableCampaigns, selectedCampaignId]);

  useEffect(() => {
    if (!availableBriefs.some(brief => brief.id === selectedBriefId)) {
      const approved = availableBriefs.find(brief => brief.status === 'approved_for_generation');
      setSelectedBriefId((approved ?? availableBriefs[0])?.id ?? '');
    }
  }, [availableBriefs, selectedBriefId]);

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

  const handleGenerateContentPack = async () => {
    setContentPackError(null);
    setContentPackMessage(null);
    if (!selectedClient || !selectedBrand || !selectedCampaign || !selectedBrief) {
      setContentPackError('Select a client, brand, campaign, and brief first.');
      return;
    }
    setIsGeneratingContentPack(true);
    try {
      const result = await onGenerateContentPack({
        client: selectedClient,
        brand: selectedBrand,
        campaign: selectedCampaign,
        brief: selectedBrief,
        options: contentOptions,
        requestedBy: actorLabel,
      });
      const source = result.mode === 'n8n' ? 'n8n AI Provider' : 'Local fallback mode';
      setContentPackMessage(`${result.items.length} pending approval items were created via ${source}. Nothing was posted or launched.`);
    } catch (err) {
      setContentPackError(err instanceof Error ? err.message : 'Content Pack generation failed. No content was created.');
    } finally {
      setIsGeneratingContentPack(false);
    }
  };

  const handleGenerateDesignBriefs = async () => {
    setDesignError(null);
    setDesignMessage(null);
    if (!selectedClient || !selectedBrand || !selectedCampaign || !selectedBrief) {
      setDesignError('Select a client, brand, campaign, and brief first.');
      return;
    }
    setIsGeneratingDesign(true);
    try {
      const result = await onGenerateDesignBriefs({
        client: selectedClient,
        brand: selectedBrand,
        campaign: selectedCampaign,
        brief: selectedBrief,
        options: contentOptions,
        requestedBy: actorLabel,
      });
      const source = result.mode === 'n8n' ? 'n8n AI Provider' : 'Local fallback mode';
      setDesignMessage(`${result.items.length} design brief approval items were created via ${source}. Nothing was posted or launched.`);
    } catch (err) {
      setDesignError(err instanceof Error ? err.message : 'Design brief generation failed. No design briefs were created.');
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleGenerateVideoScripts = async () => {
    setVideoError(null);
    setVideoMessage(null);
    if (!selectedClient || !selectedBrand || !selectedCampaign || !selectedBrief) {
      setVideoError('Select a client, brand, campaign, and brief first.');
      return;
    }
    setIsGeneratingVideo(true);
    try {
      const result = await onGenerateVideoScripts({
        client: selectedClient,
        brand: selectedBrand,
        campaign: selectedCampaign,
        brief: selectedBrief,
        options: contentOptions,
        requestedBy: actorLabel,
      });
      const source = result.mode === 'n8n' ? 'n8n AI Provider' : 'Local fallback mode';
      setVideoMessage(`${result.items.length} video script approval items were created via ${source}. Nothing was posted or launched.`);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Video script generation failed. No video scripts were created.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateAdsPack = async () => {
    setAdsError(null);
    setAdsMessage(null);
    if (!selectedClient || !selectedBrand || !selectedCampaign || !selectedBrief) {
      setAdsError('Select a client, brand, campaign, and brief first.');
      return;
    }
    setIsGeneratingAds(true);
    try {
      const result = await onGenerateAdsPack({
        client: selectedClient,
        brand: selectedBrand,
        campaign: selectedCampaign,
        brief: selectedBrief,
        options: contentOptions,
        requestedBy: actorLabel,
      });
      const source = result.mode === 'n8n' ? 'n8n AI Provider' : 'Local fallback mode';
      setAdsMessage(`${result.items.length} ads draft approval items were created via ${source}. These are drafts only — no ads were created, launched, scheduled, or spent.`);
    } catch (err) {
      setAdsError(err instanceof Error ? err.message : 'Ads pack generation failed. No ads draft items were created and no ads were launched.');
    } finally {
      setIsGeneratingAds(false);
    }
  };

  const handleGenerateReportDraft = async () => {
    setReportError(null);
    setReportMessage(null);
    if (!selectedClient || !selectedBrand || !selectedCampaign || !selectedBrief) {
      setReportError('Select a client, brand, campaign, and brief first.');
      return;
    }
    setIsGeneratingReport(true);
    try {
      const result = await onGenerateReportDraft({
        client: selectedClient,
        brand: selectedBrand,
        campaign: selectedCampaign,
        brief: selectedBrief,
        options: contentOptions,
        requestedBy: actorLabel,
      });
      const source = result.mode === 'n8n' ? 'n8n AI Provider' : 'Local fallback mode';
      setReportMessage(`${result.items.length} report draft approval items were created via ${source}. These are drafts only — no live analytics were pulled and nothing was posted or launched.`);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Report draft generation failed. No report draft items were created and no analytics were pulled.');
    } finally {
      setIsGeneratingReport(false);
    }
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
                {n8nConfigured ? 'n8n AI Provider · Approval-first' : 'Local fallback mode · Approval-first'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: '760px' }}>
              Internal control surface for generating work packages. The Content Pack workflow runs through the
              {n8nConfigured ? ' n8n AI Provider' : ' local fallback generator'} as an external module job and creates
              pending approval items only. Other starters create local drafts. Nothing is posted, launched, or sent to any
              live platform connector.
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
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Workflow Starters</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Content Pack, Design Briefs, Video Scripts, Ads Pack, and Report Draft run as external module jobs
              (n8n AI Provider when the webhook is configured, otherwise local fallback) and create pending approval
              items only — approval-first, no posting or launching. Design Briefs, Video Scripts, Ads Pack, and Report
              Draft are text/spec/draft only (no image or video generation; Ads Pack creates, launches, schedules, and
              spends nothing; Report Draft pulls no live analytics and claims no unverified metrics). Other starters
              create local UI draft records only.
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
                  {workflow.id === 'content-pack' ? (
                    <span style={{ fontSize: '0.68rem', color: n8nConfigured ? '#34d399' : '#f59e0b' }}>
                      {n8nConfigured ? 'n8n AI Provider · External module job' : 'Local fallback mode · External module job'}
                    </span>
                  ) : workflow.id === 'design-briefs' ? (
                    <span style={{ fontSize: '0.68rem', color: designConfigured ? '#34d399' : '#f59e0b' }}>
                      {designConfigured ? 'n8n AI Provider · External module job' : 'Local fallback mode · External module job'}
                    </span>
                  ) : workflow.id === 'video-scripts' ? (
                    <span style={{ fontSize: '0.68rem', color: videoConfigured ? '#34d399' : '#f59e0b' }}>
                      {videoConfigured ? 'n8n AI Provider · External module job' : 'Local fallback mode · External module job'}
                    </span>
                  ) : workflow.id === 'ads-pack' ? (
                    <span style={{ fontSize: '0.68rem', color: adsConfigured ? '#34d399' : '#f59e0b' }}>
                      {adsConfigured ? 'n8n AI Provider · External module job' : 'Local fallback mode · External module job'}
                    </span>
                  ) : workflow.id === 'report-draft' ? (
                    <span style={{ fontSize: '0.68rem', color: reportConfigured ? '#34d399' : '#f59e0b' }}>
                      {reportConfigured ? 'n8n AI Provider · External module job' : 'Local fallback mode · External module job'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>Coming next / draft workflow</span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {workflow.description}
              </p>
              {workflow.id === 'content-pack' ? (
                <ContentPackControls
                  clients={clients}
                  brands={availableBrands}
                  campaigns={availableCampaigns}
                  briefs={availableBriefs}
                  selectedClientId={selectedClientId}
                  selectedBrandId={selectedBrandId}
                  selectedCampaignId={selectedCampaignId}
                  selectedBriefId={selectedBriefId}
                  options={contentOptions}
                  isGenerating={isGeneratingContentPack}
                  message={contentPackMessage}
                  error={contentPackError}
                  n8nConfigured={n8nConfigured}
                  onClientChange={setSelectedClientId}
                  onBrandChange={setSelectedBrandId}
                  onCampaignChange={setSelectedCampaignId}
                  onBriefChange={setSelectedBriefId}
                  onOptionsChange={setContentOptions}
                  onGenerate={handleGenerateContentPack}
                />
              ) : workflow.id === 'design-briefs' ? (
                <DesignBriefControls
                  isGenerating={isGeneratingDesign}
                  message={designMessage}
                  error={designError}
                  designConfigured={designConfigured}
                  selectedBriefTitle={selectedBrief?.brief_title || selectedBrief?.brand_name || null}
                  channel={contentOptions.channel}
                  onGenerate={handleGenerateDesignBriefs}
                />
              ) : workflow.id === 'video-scripts' ? (
                <VideoScriptControls
                  isGenerating={isGeneratingVideo}
                  message={videoMessage}
                  error={videoError}
                  videoConfigured={videoConfigured}
                  selectedBriefTitle={selectedBrief?.brief_title || selectedBrief?.brand_name || null}
                  channel={contentOptions.channel}
                  onGenerate={handleGenerateVideoScripts}
                />
              ) : workflow.id === 'ads-pack' ? (
                <AdsPackControls
                  isGenerating={isGeneratingAds}
                  message={adsMessage}
                  error={adsError}
                  adsConfigured={adsConfigured}
                  selectedBriefTitle={selectedBrief?.brief_title || selectedBrief?.brand_name || null}
                  channel={contentOptions.channel}
                  onGenerate={handleGenerateAdsPack}
                />
              ) : workflow.id === 'report-draft' ? (
                <ReportDraftControls
                  isGenerating={isGeneratingReport}
                  message={reportMessage}
                  error={reportError}
                  reportConfigured={reportConfigured}
                  selectedBriefTitle={selectedBrief?.brief_title || selectedBrief?.brand_name || null}
                  channel={contentOptions.channel}
                  onGenerate={handleGenerateReportDraft}
                />
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => createDraft(workflow.id)}
                  style={{ justifyContent: 'center', fontSize: '0.82rem', marginTop: 'auto' }}
                >
                  <Factory size={14} /> Create Local Draft
                </button>
              )}
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

function ContentPackControls({
  clients,
  brands,
  campaigns,
  briefs,
  selectedClientId,
  selectedBrandId,
  selectedCampaignId,
  selectedBriefId,
  options,
  isGenerating,
  message,
  error,
  n8nConfigured,
  onClientChange,
  onBrandChange,
  onCampaignChange,
  onBriefChange,
  onOptionsChange,
  onGenerate,
}: {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  selectedClientId: string;
  selectedBrandId: string;
  selectedCampaignId: string;
  selectedBriefId: string;
  options: ContentFactoryOptions;
  isGenerating: boolean;
  message: string | null;
  error: string | null;
  n8nConfigured: boolean;
  onClientChange: (id: string) => void;
  onBrandChange: (id: string) => void;
  onCampaignChange: (id: string) => void;
  onBriefChange: (id: string) => void;
  onOptionsChange: (options: ContentFactoryOptions) => void;
  onGenerate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        <CompactSelect label="Client" value={selectedClientId} onChange={onClientChange} options={clients.map(item => ({ value: item.id, label: item.name }))} />
        <CompactSelect label="Brand" value={selectedBrandId} onChange={onBrandChange} options={brands.map(item => ({ value: item.id, label: item.name }))} />
        <CompactSelect label="Campaign" value={selectedCampaignId} onChange={onCampaignChange} options={campaigns.map(item => ({ value: item.id, label: item.name }))} />
        <CompactSelect
          label="Brief"
          value={selectedBriefId}
          onChange={onBriefChange}
          options={briefs.map(item => ({ value: item.id, label: `${item.brief_title || item.brand_name} (${item.status || 'draft'})` }))}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {[7, 15, 30].map(days => (
          <button
            key={days}
            type="button"
            onClick={() => onOptionsChange({ ...options, planLengthDays: days as ContentFactoryOptions['planLengthDays'] })}
            style={{ padding: '6px 8px', borderRadius: '6px', border: options.planLengthDays === days ? '1px solid rgba(251,146,60,0.6)' : '1px solid var(--border-color)', background: options.planLengthDays === days ? 'rgba(244,122,31,0.12)' : 'rgba(255,255,255,0.02)', color: options.planLengthDays === days ? '#fb923c' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
          >
            {days} days
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <CompactSelect
          label="Channel"
          value={options.channel}
          onChange={channel => onOptionsChange({ ...options, channel: channel as ContentFactoryOptions['channel'] })}
          options={['Facebook', 'TikTok', 'Zalo'].map(channel => ({ value: channel, label: channel }))}
        />
        <CompactSelect
          label="Goal"
          value={options.goal}
          onChange={goal => onOptionsChange({ ...options, goal: goal as ContentFactoryOptions['goal'] })}
          options={[
            { value: 'branding', label: 'Branding' },
            { value: 'sales', label: 'Sales' },
            { value: 'khai_truong', label: 'Khai truong' },
            { value: 'lead', label: 'Lead' },
            { value: 'tuyen_sinh', label: 'Tuyen sinh' },
          ]}
        />
      </div>

      <div>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: n8nConfigured ? '#34d399' : '#f59e0b', background: n8nConfigured ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${n8nConfigured ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '5px', padding: '2px 7px' }}>
          {n8nConfigured ? 'n8n AI Provider' : 'Local fallback mode'}
        </span>
      </div>

      {message && <p style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.45, margin: 0 }}>{message}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.45, margin: 0 }}>{error}</p>}

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
      >
        <Wand2 size={14} /> {isGenerating
          ? (n8nConfigured ? 'Generating via n8n AI Provider...' : 'Generating (local fallback)...')
          : (n8nConfigured ? 'Generate with n8n AI Provider' : 'Generate with Local fallback')}
      </button>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        Approval-first: no auto-post, no auto-ads. Creates Pending Approval outputs only. No platform connector.
      </p>
    </div>
  );
}

function DesignBriefControls({
  isGenerating,
  message,
  error,
  designConfigured,
  selectedBriefTitle,
  channel,
  onGenerate,
}: {
  isGenerating: boolean;
  message: string | null;
  error: string | null;
  designConfigured: boolean;
  selectedBriefTitle: string | null;
  channel: string;
  onGenerate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
        Generates 5 design brief specs (Facebook post, Story/Reels cover, menu/promo visual, key visual
        direction, designer handoff). Text/spec only — no images, no Canva/ComfyUI/Fal.ai.
      </p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
        Target: {selectedBriefTitle ?? '— select a brief in Content Pack above —'} · {channel}
      </p>

      <div>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: designConfigured ? '#34d399' : '#f59e0b', background: designConfigured ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${designConfigured ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '5px', padding: '2px 7px' }}>
          {designConfigured ? 'n8n AI Provider' : 'Local fallback mode'}
        </span>
      </div>

      {message && <p style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.45, margin: 0 }}>{message}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.45, margin: 0 }}>{error}</p>}

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
      >
        <PenTool size={14} /> {isGenerating
          ? (designConfigured ? 'Generating via n8n AI Provider...' : 'Generating (local fallback)...')
          : (designConfigured ? 'Generate Design Briefs with n8n AI Provider' : 'Generate Design Briefs with Local fallback')}
      </button>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        Approval-first: design briefs only. Nothing is posted or launched. No auto-post, no auto-ads, no image generation.
      </p>
    </div>
  );
}

function VideoScriptControls({
  isGenerating,
  message,
  error,
  videoConfigured,
  selectedBriefTitle,
  channel,
  onGenerate,
}: {
  isGenerating: boolean;
  message: string | null;
  error: string | null;
  videoConfigured: boolean;
  selectedBriefTitle: string | null;
  channel: string;
  onGenerate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
        Generates 5 video scripts (hook / first 3s, short-form Reels/TikTok 15–30s, voiceover/caption,
        shot list + B-roll, editor handoff). Text/script only — no video, no images, no Canva/ComfyUI/Fal.ai.
      </p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
        Target: {selectedBriefTitle ?? '— select a brief in Content Pack above —'} · {channel}
      </p>

      <div>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: videoConfigured ? '#34d399' : '#f59e0b', background: videoConfigured ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${videoConfigured ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '5px', padding: '2px 7px' }}>
          {videoConfigured ? 'n8n AI Provider' : 'Local fallback mode'}
        </span>
      </div>

      {message && <p style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.45, margin: 0 }}>{message}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.45, margin: 0 }}>{error}</p>}

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
      >
        <Video size={14} /> {isGenerating
          ? (videoConfigured ? 'Generating via n8n AI Provider...' : 'Generating (local fallback)...')
          : (videoConfigured ? 'Generate Video Scripts with n8n AI Provider' : 'Generate Video Scripts with Local fallback')}
      </button>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        Approval-first: video scripts only. Nothing is posted or launched. No auto-post, no auto-ads, no image or video generation.
      </p>
    </div>
  );
}

function AdsPackControls({
  isGenerating,
  message,
  error,
  adsConfigured,
  selectedBriefTitle,
  channel,
  onGenerate,
}: {
  isGenerating: boolean;
  message: string | null;
  error: string | null;
  adsConfigured: boolean;
  selectedBriefTitle: string | null;
  channel: string;
  onGenerate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
        Generates 5 ads draft items (campaign angle &amp; offer, ad copy variants, audience &amp; targeting notes,
        budget &amp; testing plan, Ads Manager handoff checklist). Strategy/draft notes only — no ads are created,
        launched, scheduled, or spent. No Meta/TikTok/Zalo/Google Ads connector.
      </p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
        Target: {selectedBriefTitle ?? '— select a brief in Content Pack above —'} · {channel}
      </p>

      <div>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: adsConfigured ? '#34d399' : '#f59e0b', background: adsConfigured ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${adsConfigured ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '5px', padding: '2px 7px' }}>
          {adsConfigured ? 'n8n AI Provider' : 'Local fallback mode'}
        </span>
      </div>

      {message && <p style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.45, margin: 0 }}>{message}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.45, margin: 0 }}>{error}</p>}

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
      >
        <Megaphone size={14} /> {isGenerating
          ? (adsConfigured ? 'Generating via n8n AI Provider...' : 'Generating (local fallback)...')
          : (adsConfigured ? 'Generate Ads Pack with n8n AI Provider' : 'Generate Ads Pack with Local fallback')}
      </button>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        Approval-first: ads drafts only. Nothing is posted or launched. No auto-post, no auto-ads, no platform launch. Approved ≠ Published.
      </p>
    </div>
  );
}

function ReportDraftControls({
  isGenerating,
  message,
  error,
  reportConfigured,
  selectedBriefTitle,
  channel,
  onGenerate,
}: {
  isGenerating: boolean;
  message: string | null;
  error: string | null;
  reportConfigured: boolean;
  selectedBriefTitle: string | null;
  channel: string;
  onGenerate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
        Generates 5 report draft items (campaign status summary, performance insight notes, content &amp; creative
        review, risks/learnings/next actions, owner/client report handoff). Report draft notes only — no live
        analytics is pulled and no real metrics are claimed unless owner-provided.
      </p>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
        Target: {selectedBriefTitle ?? '— select a brief in Content Pack above —'} · {channel}
      </p>

      <div>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: reportConfigured ? '#34d399' : '#f59e0b', background: reportConfigured ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${reportConfigured ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.35)'}`, borderRadius: '5px', padding: '2px 7px' }}>
          {reportConfigured ? 'n8n AI Provider' : 'Local fallback mode'}
        </span>
      </div>

      {message && <p style={{ fontSize: '0.72rem', color: '#34d399', lineHeight: 1.45, margin: 0 }}>{message}</p>}
      {error && <p style={{ fontSize: '0.72rem', color: '#f87171', lineHeight: 1.45, margin: 0 }}>{error}</p>}

      <button
        className="btn btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ justifyContent: 'center', fontSize: '0.82rem' }}
      >
        <FileText size={14} /> {isGenerating
          ? (reportConfigured ? 'Generating via n8n AI Provider...' : 'Generating (local fallback)...')
          : (reportConfigured ? 'Generate Report Draft with n8n AI Provider' : 'Generate Report Draft with Local fallback')}
      </button>
      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
        Approval-first: report drafts only. No live analytics pull, no unverified metrics. Nothing is posted or launched. Approved ≠ Published.
      </p>
    </div>
  );
}

function CompactSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
      {label}
      <select
        className="form-control"
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{ padding: '7px 8px', borderRadius: '7px', fontSize: '0.74rem' }}
      >
        <option value="">Select...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
