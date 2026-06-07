import type { LocalReportType, LocalReport, ReportMetrics, Campaign } from '../../types/core';
import type { CoreDataStore, GenerationDataStore, ApprovalDataStore, AssetDataStore } from './coreData';
import { generateId } from './coreData';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const REPORT_TYPE_LABEL: Record<LocalReportType, string> = {
  internal_summary:  'Internal Summary',
  client_summary:    'Client Summary',
  campaign_progress: 'Campaign Progress',
  content_status:    'Content Status',
  approval_status:   'Approval Status',
  asset_status:      'Asset Status',
};

export const REPORT_TYPE_COLOR: Record<LocalReportType, string> = {
  internal_summary:  '#818cf8',
  client_summary:    '#34d399',
  campaign_progress: '#60a5fa',
  content_status:    '#f59e0b',
  approval_status:   '#fb923c',
  asset_status:      '#a78bfa',
};

export const REPORT_TYPES: LocalReportType[] = [
  'internal_summary',
  'client_summary',
  'campaign_progress',
  'content_status',
  'approval_status',
  'asset_status',
];

export const CLIENT_ACCESSIBLE_REPORT_TYPES: LocalReportType[] = [
  'client_summary',
  'campaign_progress',
];

// ---------------------------------------------------------------------------
// Content status display (for breakdown)
// ---------------------------------------------------------------------------

export const CONTENT_STATUS_LABEL: Record<string, string> = {
  generated:          'Generated',
  needs_review:       'Needs Review',
  revision_requested: 'Revision Requested',
  approved:           'Approved',
  scheduled:          'Scheduled',
  published:          'Published',
  rejected:           'Rejected',
  archived:           'Archived',
};

export const CONTENT_STATUS_COLOR: Record<string, string> = {
  generated:          '#60a5fa',
  needs_review:       '#f59e0b',
  revision_requested: '#fb923c',
  approved:           '#34d399',
  scheduled:          '#818cf8',
  published:          '#10b981',
  rejected:           '#f87171',
  archived:           '#71717a',
};

export const APPROVAL_STATUS_LABEL: Record<string, string> = {
  draft:              'Draft',
  submitted:          'Submitted',
  approved:           'Approved',
  rejected:           'Rejected',
  revision_requested: 'Revision Requested',
  cancelled:          'Cancelled',
};

export const APPROVAL_STATUS_COLOR: Record<string, string> = {
  draft:              '#94a3b8',
  submitted:          '#60a5fa',
  approved:           '#34d399',
  rejected:           '#f87171',
  revision_requested: '#fb923c',
  cancelled:          '#71717a',
};

export const ASSET_STATUS_LABEL: Record<string, string> = {
  draft:        'Draft',
  needs_review: 'Needs Review',
  approved:     'Approved',
  rejected:     'Rejected',
  archived:     'Archived',
};

export const ASSET_STATUS_COLOR: Record<string, string> = {
  draft:        '#94a3b8',
  needs_review: '#f59e0b',
  approved:     '#34d399',
  rejected:     '#f87171',
  archived:     '#71717a',
};

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

interface GenerateParams {
  coreData: CoreDataStore;
  genData: GenerationDataStore;
  approvalData: ApprovalDataStore;
  assetData: AssetDataStore;
  report_type: LocalReportType;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  generated_by: string;
}

export function generateLocalReport(params: GenerateParams): LocalReport {
  const {
    coreData, genData, approvalData, assetData,
    report_type, client_id, brand_id, campaign_id, generated_by,
  } = params;
  const now = new Date().toISOString();

  // Scoped slices
  let { briefs } = coreData;
  let { campaigns } = coreData;
  let { brands } = coreData;
  let { clients } = coreData;

  if (client_id)   { clients   = clients.filter(c => c.id === client_id); }
  if (brand_id)    { brands    = brands.filter(b => b.id === brand_id); }
  if (client_id)   { brands    = brands.filter(b => b.client_id === client_id); }
  if (campaign_id) { campaigns = campaigns.filter(c => c.id === campaign_id); }
  else if (brand_id)   { campaigns = campaigns.filter(c => c.brand_id === brand_id); }
  else if (client_id)  { campaigns = campaigns.filter(c => c.client_id === client_id); }
  if (campaign_id) { briefs = briefs.filter(b => b.campaign_id === campaign_id); }
  else if (brand_id)   { briefs = briefs.filter(b => b.brand_id === brand_id); }
  else if (client_id)  { briefs = briefs.filter(b => b.client_id === client_id); }

  const campaignIds = new Set(campaigns.map(c => c.id));

  const contentItems = genData.contentItems.filter(i => campaignIds.has(i.campaign_id));
  const genJobs      = genData.generationJobs.filter(j => campaignIds.has(j.campaign_id));
  const approvalRequests = approvalData.approvalRequests.filter(r => campaignIds.has(r.campaign_id));

  let assets = assetData.assets;
  if (campaign_id)      assets = assets.filter(a => a.campaign_id === campaign_id);
  else if (brand_id)    assets = assets.filter(a => a.brand_id === brand_id);
  else if (client_id)   assets = assets.filter(a => a.client_id === client_id);

  // content_by_status
  const content_by_status: Record<string, number> = {};
  for (const item of contentItems) {
    content_by_status[item.status] = (content_by_status[item.status] ?? 0) + 1;
  }

  // content_by_channel
  const content_by_channel: Record<string, number> = {};
  for (const item of contentItems) {
    const ch = item.channel || 'Other';
    content_by_channel[ch] = (content_by_channel[ch] ?? 0) + 1;
  }

  // approval_by_status
  const approval_by_status: Record<string, number> = {};
  for (const req of approvalRequests) {
    approval_by_status[req.status] = (approval_by_status[req.status] ?? 0) + 1;
  }

  // asset_by_status
  const asset_by_status: Record<string, number> = {};
  for (const a of assets) {
    asset_by_status[a.approval_status] = (asset_by_status[a.approval_status] ?? 0) + 1;
  }

  const approved_content_count    = content_by_status['approved']           ?? 0;
  const pending_approval_count    = content_by_status['needs_review']       ?? 0;
  const revision_requested_count  = content_by_status['revision_requested'] ?? 0;
  const rejected_count            = content_by_status['rejected']           ?? 0;
  const total                     = contentItems.length;

  const campaign_progress_percent = total > 0
    ? Math.round((approved_content_count / total) * 100)
    : 0;

  const metrics: ReportMetrics = {
    total_briefs:             briefs.length,
    total_generation_jobs:    genJobs.length,
    total_content_items:      total,
    content_by_status,
    content_by_channel,
    approval_requests_total:  approvalRequests.length,
    approval_by_status,
    pending_approval_count,
    approved_content_count,
    revision_requested_count,
    rejected_count,
    asset_count:              assets.length,
    approved_asset_count:     assets.filter(a => a.approval_status === 'approved').length,
    campaign_progress_percent,
  };

  const scopeClient   = clients.find(c => c.id === client_id);
  const scopeBrand    = brands.find(b => b.id === brand_id);
  const scopeCampaign = campaigns.find(c => c.id === campaign_id);
  const scopeLabel    = scopeCampaign?.name ?? scopeBrand?.name ?? scopeClient?.name ?? 'All Campaigns';

  const title  = `${REPORT_TYPE_LABEL[report_type]} — ${scopeLabel}`;
  const summary = buildSummaryText(metrics, scopeLabel);
  const client_summary_text = buildClientSummaryText(metrics, scopeLabel, scopeCampaign ?? null);

  return {
    id:                  generateId('rpt'),
    client_id,
    brand_id,
    campaign_id,
    report_type,
    title,
    period_start:        scopeCampaign?.start_date ?? null,
    period_end:          scopeCampaign?.end_date   ?? null,
    summary,
    metrics,
    client_summary_text,
    status:              'generated',
    generated_by,
    created_at:          now,
  };
}

function buildSummaryText(m: ReportMetrics, scope: string): string {
  return [
    `Scope: ${scope}`,
    `Content: ${m.total_content_items} total | ${m.approved_content_count} approved | ${m.pending_approval_count} pending | ${m.revision_requested_count} revision | ${m.rejected_count} rejected`,
    `Progress: ${m.campaign_progress_percent}% approved`,
    `Assets: ${m.asset_count} total | ${m.approved_asset_count} approved`,
    `Approval requests: ${m.approval_requests_total}`,
    `Note: Generated from Core workspace data only. No real platform analytics connected.`,
  ].join('\n');
}

function buildClientSummaryText(m: ReportMetrics, scope: string, campaign: Campaign | null): string {
  const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const lines: string[] = [
    `CAMPAIGN PROGRESS REPORT`,
    `Scope: ${scope.toUpperCase()}`,
    `Generated by The Core Agency — ${today}`,
  ];
  if (campaign?.start_date) {
    lines.push(`Campaign period: ${campaign.start_date} → ${campaign.end_date ?? 'TBD'}`);
  }
  lines.push(
    ``,
    `DISCLAIMER`,
    `This report is generated from The Core Agency's internal workspace data.`,
    `No real platform analytics (Meta, Google, TikTok, etc.) are connected at this stage.`,
    `Approved content ≠ Published content. No auto-post has been activated.`,
    ``,
    `CONTENT PRODUCTION SUMMARY`,
    `• Total content items planned: ${m.total_content_items}`,
    `• Approved for use: ${m.approved_content_count}`,
    `• Pending review: ${m.pending_approval_count}`,
    `• Revision requested: ${m.revision_requested_count}`,
    ``,
    `OVERALL PROGRESS: ${m.campaign_progress_percent}% of content approved`,
    ``,
    `ASSET LIBRARY`,
    `• Total asset records: ${m.asset_count}`,
    `• Assets approved: ${m.approved_asset_count}`,
    ``,
    `NEXT STEPS`,
    `• Owner review and approve remaining content items before any publication.`,
    `• Client feedback via Client Portal is recorded and visible to the team.`,
    `• No content will be published without explicit owner approval.`,
    `• Real performance analytics will be available once platform connectors are activated.`,
  );
  return lines.join('\n');
}
