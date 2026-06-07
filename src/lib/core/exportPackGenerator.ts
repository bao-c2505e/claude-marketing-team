import type {
  ExportPackType,
  ExportPackFormat,
  ExportPackStatus,
  LocalExportPack,
} from '../../types/core';
import type {
  CoreDataStore,
  GenerationDataStore,
  ApprovalDataStore,
  AssetDataStore,
} from './coreData';
import { generateId } from './coreData';
import { generateLocalReport } from './reportGenerator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EXPORT_PACK_TYPE_LABEL: Record<ExportPackType, string> = {
  campaign_summary:   'Campaign Summary',
  content_calendar:   'Content Calendar',
  approved_content:   'Approved Content Pack',
  client_report:      'Client Report Summary',
  asset_checklist:    'Asset Checklist',
  full_campaign_pack: 'Full Campaign Pack',
};

export const EXPORT_PACK_TYPE_DESCRIPTION: Record<ExportPackType, string> = {
  campaign_summary:   'Client/brand/campaign overview, brief summary, timeline and status.',
  content_calendar:   'All content items with dates, channels, hooks, captions and CTAs.',
  approved_content:   'Only approved items — caption, visual brief, CTA, hashtags.',
  client_report:      'Client-facing progress report with metrics summary.',
  asset_checklist:    'Asset inventory with type, approval status and usage rights.',
  full_campaign_pack: 'All sections combined into one exportable document.',
};

export const EXPORT_PACK_FORMAT_LABEL: Record<ExportPackFormat, string> = {
  markdown:    'Markdown',
  plain_text:  'Plain Text',
  json_preview: 'JSON Preview',
};

export const EXPORT_PACK_STATUS_LABEL: Record<ExportPackStatus, string> = {
  draft:    'Draft',
  generated: 'Generated',
  copied:   'Copied',
  archived: 'Archived',
};

export const EXPORT_PACK_TYPES: ExportPackType[] = [
  'campaign_summary',
  'content_calendar',
  'approved_content',
  'client_report',
  'asset_checklist',
  'full_campaign_pack',
];

// Types visible to client/viewer roles (no internal logs/job internals)
export const CLIENT_SAFE_EXPORT_TYPES: ExportPackType[] = [
  'campaign_summary',
  'approved_content',
  'client_report',
];

// ---------------------------------------------------------------------------
// Generator params
// ---------------------------------------------------------------------------

export interface ExportPackParams {
  coreData: CoreDataStore;
  genData: GenerationDataStore;
  approvalData: ApprovalDataStore;
  assetData: AssetDataStore;
  export_type: ExportPackType;
  client_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  format: ExportPackFormat;
  isClientSafe: boolean;
  generatedBy: string;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateExportPack(params: ExportPackParams): LocalExportPack {
  const { export_type, format, client_id, brand_id, campaign_id, isClientSafe } = params;

  // Enforce client-safe restriction
  const effectiveType: ExportPackType =
    isClientSafe && !CLIENT_SAFE_EXPORT_TYPES.includes(export_type)
      ? 'client_report'
      : export_type;

  const markdown = buildMarkdown(params, effectiveType);
  const content  = formatContent(markdown, format);

  const { coreData } = params;
  const campaign = coreData.campaigns.find(c => c.id === campaign_id);
  const brand    = coreData.brands.find(b => b.id === brand_id);
  const client   = coreData.clients.find(c => c.id === client_id);
  const scopeLabel = campaign?.name ?? brand?.name ?? client?.name ?? 'All Campaigns';

  const now = new Date().toISOString();
  return {
    id:          generateId('exp'),
    client_id,
    brand_id,
    campaign_id,
    export_type: effectiveType,
    title:       `${EXPORT_PACK_TYPE_LABEL[effectiveType]} — ${scopeLabel}`,
    format,
    status:      'generated',
    content,
    created_at:  now,
    updated_at:  now,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

function buildMarkdown(params: ExportPackParams, type: ExportPackType): string {
  switch (type) {
    case 'campaign_summary':   return buildCampaignSummary(params);
    case 'content_calendar':   return buildContentCalendar(params);
    case 'approved_content':   return buildApprovedContent(params);
    case 'client_report':      return buildClientReport(params);
    case 'asset_checklist':    return buildAssetChecklist(params);
    case 'full_campaign_pack': return buildFullCampaignPack(params);
    default:                   return buildCampaignSummary(params);
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function todayLabel(): string {
  return new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function disclaimer(): string {
  return [
    '> **⚠️ DISCLAIMER — Export Pack is prepared from Core workspace data.**',
    '> - Local export only — no file upload, no email, no cloud sync.',
    '> - Export does **not** publish content.',
    '> - Export does **not** schedule posts.',
    '> - Export does **not** send messages.',
    '> - Approved content is **NOT** automatically published.',
    '> - Usage rights must be verified before any publication.',
    '',
  ].join('\n');
}

function divider(): string {
  return '\n---\n';
}

// ---------------------------------------------------------------------------
// 1. Campaign Summary
// ---------------------------------------------------------------------------

function buildCampaignSummary(params: ExportPackParams): string {
  const { coreData, client_id, brand_id, campaign_id } = params;

  const client   = coreData.clients.find(c => c.id === client_id) ?? null;
  const brand    = coreData.brands.find(b => b.id === brand_id)   ?? null;
  const campaign = coreData.campaigns.find(c => c.id === campaign_id) ?? null;
  const brief    = campaign
    ? coreData.briefs.find(b => b.campaign_id === campaign.id) ?? null
    : null;

  const lines: string[] = [
    `# CAMPAIGN SUMMARY`,
    `Generated by The Core Agency — ${todayLabel()}`,
    '',
    disclaimer(),
  ];

  // Client
  lines.push('## Client Information');
  if (client) {
    lines.push(`- **Name:** ${client.name}`);
    if (client.contact_name) {
      lines.push(`- **Contact:** ${client.contact_name}${client.contact_email ? ` (${client.contact_email})` : ''}`);
    }
    lines.push(`- **Status:** ${client.status}`);
    if (client.notes) lines.push(`- **Notes:** ${client.notes}`);
  } else {
    lines.push('_(No client selected)_');
  }
  lines.push('');

  // Brand
  lines.push('## Brand Profile');
  if (brand) {
    lines.push(`- **Name:** ${brand.name}`);
    if (brand.industry)        lines.push(`- **Industry:** ${brand.industry}`);
    if (brand.hero_product)    lines.push(`- **Hero Product:** ${brand.hero_product}`);
    if (brand.tone_of_voice)   lines.push(`- **Tone of Voice:** ${brand.tone_of_voice}`);
    if (brand.target_audience) lines.push(`- **Target Audience:** ${brand.target_audience}`);
    if (brand.primary_channels?.length) {
      lines.push(`- **Channels:** ${brand.primary_channels.join(', ')}`);
    }
  } else {
    lines.push('_(No brand selected)_');
  }
  lines.push('');

  // Campaign
  lines.push('## Campaign Details');
  if (campaign) {
    lines.push(`- **Name:** ${campaign.name}`);
    if (campaign.description) lines.push(`- **Description:** ${campaign.description}`);
    lines.push(`- **Type:** ${campaign.campaign_type.replace('_', ' ')} campaign`);
    lines.push(`- **Duration:** ${campaign.duration_days} days`);
    if (campaign.start_date) {
      lines.push(`- **Period:** ${campaign.start_date} → ${campaign.end_date ?? 'TBD'}`);
    }
    lines.push(`- **Status:** ${campaign.status.toUpperCase()}`);
    if (campaign.budget_estimate) {
      lines.push(`- **Budget Estimate:** ${campaign.budget_estimate.toLocaleString('vi-VN')} ${campaign.currency}`);
    }
  } else {
    lines.push('_(No campaign selected)_');
  }
  lines.push('');

  // Brief
  lines.push('## Brief Summary');
  if (brief) {
    if (brief.brief_title)     lines.push(`- **Brief Title:** ${brief.brief_title}`);
    if (brief.campaign_goal)   lines.push(`- **Campaign Goal:** ${brief.campaign_goal}`);
    if (brief.product_focus)   lines.push(`- **Product Focus:** ${brief.product_focus}`);
    if (brief.offer)           lines.push(`- **Offer:** ${brief.offer}`);
    if (brief.tone_of_voice)   lines.push(`- **Tone:** ${brief.tone_of_voice}`);
    if (brief.target_audience) lines.push(`- **Target Audience:** ${brief.target_audience}`);
    if (brief.channels?.length) {
      lines.push(`- **Channels:** ${brief.channels.join(', ')}`);
    }
    if (brief.content_pillars?.length) {
      lines.push(`- **Content Pillars:** ${brief.content_pillars.join(', ')}`);
    }
    if (brief.must_include)           lines.push(`- **Must Include:** ${brief.must_include}`);
    if (brief.must_avoid)             lines.push(`- **Must Avoid:** ${brief.must_avoid}`);
    if (brief.budget_note)            lines.push(`- **Budget Note:** ${brief.budget_note}`);
    if (brief.timeline_note)          lines.push(`- **Timeline Note:** ${brief.timeline_note}`);
    if (brief.approval_requirements)  lines.push(`- **Approval Requirements:** ${brief.approval_requirements}`);
    lines.push(`- **Brief Status:** ${brief.status ?? 'N/A'}`);
  } else {
    lines.push('_(No brief found for this campaign)_');
  }
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 2. Content Calendar
// ---------------------------------------------------------------------------

function buildContentCalendar(params: ExportPackParams): string {
  const { coreData, genData, campaign_id, isClientSafe } = params;

  let items = campaign_id
    ? genData.contentItems.filter(i => i.campaign_id === campaign_id)
    : genData.contentItems;

  items = [...items].sort((a, b) => {
    if (a.planned_date && b.planned_date) return a.planned_date.localeCompare(b.planned_date);
    return a.day_number - b.day_number;
  });

  const campaign = coreData.campaigns.find(c => c.id === campaign_id);
  const scopeLabel = campaign?.name ?? 'All Campaigns';

  const lines: string[] = [
    `# CONTENT CALENDAR — ${scopeLabel}`,
    `Generated by The Core Agency — ${todayLabel()}`,
    '',
    disclaimer(),
    `**Total items:** ${items.length}`,
    '',
  ];

  if (items.length === 0) {
    lines.push('_(No content items found for this scope. Generate content in the Content Generation tab first.)_');
    lines.push('');
    return lines.join('\n');
  }

  for (const item of items) {
    const dateLabel = item.planned_date ?? `Day ${item.day_number}`;
    lines.push('---');
    lines.push(`### ${dateLabel} — ${item.channel} — ${item.content_type}`);
    lines.push(`- **Status:** ${item.status.toUpperCase().replace(/_/g, ' ')}`);
    lines.push(`- **Pillar:** ${item.pillar}`);
    lines.push('');
    lines.push(`**Hook:**`);
    lines.push(item.hook);
    lines.push('');
    lines.push(`**Caption:**`);
    lines.push(item.caption);
    lines.push('');
    lines.push(`- **Visual Brief:** ${item.visual_brief}`);
    lines.push(`- **CTA:** ${item.cta}`);
    if (item.hashtags) lines.push(`- **Hashtags:** ${item.hashtags}`);
    if (!isClientSafe) {
      lines.push(`- **Angle:** ${item.angle}`);
      if (item.scheduled_time) lines.push(`- **Scheduled Time:** ${item.scheduled_time}`);
      if (item.owner_note)     lines.push(`- **Owner Note:** ${item.owner_note}`);
      if (item.publish_note)   lines.push(`- **Publish Note:** ${item.publish_note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 3. Approved Content Pack
// ---------------------------------------------------------------------------

function buildApprovedContent(params: ExportPackParams): string {
  const { coreData, genData, campaign_id } = params;

  let items = campaign_id
    ? genData.contentItems.filter(i => i.campaign_id === campaign_id && i.status === 'approved')
    : genData.contentItems.filter(i => i.status === 'approved');

  items = [...items].sort((a, b) => {
    if (a.planned_date && b.planned_date) return a.planned_date.localeCompare(b.planned_date);
    return a.day_number - b.day_number;
  });

  const campaign  = coreData.campaigns.find(c => c.id === campaign_id);
  const scopeLabel = campaign?.name ?? 'All Campaigns';

  const lines: string[] = [
    `# APPROVED CONTENT PACK — ${scopeLabel}`,
    `Generated by The Core Agency — ${todayLabel()}`,
    '',
    disclaimer(),
    `> **Note:** Approved ≠ Published. No auto-post activated. Publish manually after owner sign-off.`,
    '',
    `**Total approved items:** ${items.length}`,
    '',
  ];

  if (items.length === 0) {
    lines.push('_(No approved content items found. Submit and approve content via the Approvals tab first.)_');
    lines.push('');
    return lines.join('\n');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const dateLabel = item.planned_date ?? `Day ${item.day_number}`;
    lines.push('---');
    lines.push(`### Item ${i + 1} — ${dateLabel} — ${item.channel}`);
    lines.push('');
    lines.push(`**Hook:**`);
    lines.push(item.hook);
    lines.push('');
    lines.push(`**Caption:**`);
    lines.push(item.caption);
    lines.push('');
    lines.push(`- **Visual Brief:** ${item.visual_brief}`);
    lines.push(`- **CTA:** ${item.cta}`);
    if (item.hashtags) lines.push(`- **Hashtags:** ${item.hashtags}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 4. Client Report Summary
// ---------------------------------------------------------------------------

function buildClientReport(params: ExportPackParams): string {
  const { coreData, genData, approvalData, assetData, client_id, brand_id, campaign_id, generatedBy } = params;

  const report = generateLocalReport({
    coreData,
    genData,
    approvalData,
    assetData,
    report_type: 'client_summary',
    client_id,
    brand_id,
    campaign_id,
    generated_by: generatedBy,
  });

  const campaign  = coreData.campaigns.find(c => c.id === campaign_id);
  const brand     = coreData.brands.find(b => b.id === brand_id);
  const client    = coreData.clients.find(c => c.id === client_id);
  const scopeLabel = campaign?.name ?? brand?.name ?? client?.name ?? 'All Campaigns';

  return [
    `# CLIENT REPORT SUMMARY — ${scopeLabel}`,
    `Generated by The Core Agency — ${todayLabel()}`,
    '',
    disclaimer(),
    divider(),
    report.client_summary_text,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 5. Asset Checklist
// ---------------------------------------------------------------------------

function buildAssetChecklist(params: ExportPackParams): string {
  const { coreData, assetData, client_id, brand_id, campaign_id, isClientSafe } = params;

  let assets = assetData.assets;
  if (campaign_id)    assets = assets.filter(a => a.campaign_id === campaign_id);
  else if (brand_id)  assets = assets.filter(a => a.brand_id === brand_id);
  else if (client_id) assets = assets.filter(a => a.client_id === client_id);

  const campaign   = coreData.campaigns.find(c => c.id === campaign_id);
  const brand      = coreData.brands.find(b => b.id === brand_id);
  const client     = coreData.clients.find(c => c.id === client_id);
  const scopeLabel = campaign?.name ?? brand?.name ?? client?.name ?? 'All';

  const approvedCount    = assets.filter(a => a.approval_status === 'approved').length;
  const needsReviewCount = assets.filter(a => a.approval_status === 'needs_review').length;
  const draftCount       = assets.filter(a => a.approval_status === 'draft').length;

  const lines: string[] = [
    `# ASSET CHECKLIST — ${scopeLabel}`,
    `Generated by The Core Agency — ${todayLabel()}`,
    '',
    disclaimer(),
    `**Total assets:** ${assets.length} | **Approved:** ${approvedCount} | **Needs Review:** ${needsReviewCount} | **Draft:** ${draftCount}`,
    '',
  ];

  if (assets.length === 0) {
    lines.push('_(No assets found for this scope. Add assets via the Asset Library tab first.)_');
    lines.push('');
    return lines.join('\n');
  }

  for (const asset of assets) {
    lines.push('---');
    lines.push(`### ${asset.name}`);
    lines.push(`- **Type:** ${asset.asset_type}`);
    lines.push(`- **Approval Status:** ${asset.approval_status.toUpperCase().replace(/_/g, ' ')}`);
    lines.push(`- **Source:** ${asset.source_type}`);
    if (asset.file_name) {
      lines.push(`- **File:** ${asset.file_name}${asset.file_size_note ? ` (${asset.file_size_note})` : ''}`);
    }
    if (asset.usage_rights_note) lines.push(`- **Usage Rights:** ${asset.usage_rights_note}`);
    if (asset.tags?.length)      lines.push(`- **Tags:** ${asset.tags.join(', ')}`);
    if (asset.campaign_id) {
      const linkedCampaign = coreData.campaigns.find(c => c.id === asset.campaign_id);
      if (linkedCampaign) lines.push(`- **Linked Campaign:** ${linkedCampaign.name}`);
    }
    if (asset.content_item_id) {
      lines.push(`- **Linked Content Item:** ${asset.content_item_id}`);
    }
    if (!isClientSafe && asset.notes) lines.push(`- **Notes:** ${asset.notes}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 6. Full Campaign Pack
// ---------------------------------------------------------------------------

function buildFullCampaignPack(params: ExportPackParams): string {
  const SEP = '\n\n' + '='.repeat(80) + '\n\n';
  return [
    buildCampaignSummary(params),
    SEP,
    buildContentCalendar(params),
    SEP,
    buildApprovedContent(params),
    SEP,
    buildClientReport(params),
    SEP,
    buildAssetChecklist(params),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Format conversion
// ---------------------------------------------------------------------------

function formatContent(markdown: string, format: ExportPackFormat): string {
  if (format === 'markdown') return markdown;

  if (format === 'plain_text') {
    return markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^>\s+/gm, '  ')
      .replace(/^-\s+/gm, '• ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1');
  }

  if (format === 'json_preview') {
    return JSON.stringify(
      { content: markdown, generated_at: new Date().toISOString(), format: 'json_preview' },
      null,
      2,
    );
  }

  return markdown;
}
