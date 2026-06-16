import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  CheckSquare,
  Plus,
  Play,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Copy,
  FileText,
  Shield,
  Monitor,
  BookOpen,
  Store,
  Eye,
  LogOut,
  Lock,
  Zap,
  ClipboardList,
  Wand2,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  FolderOpen,
  BarChart2,
  Package,
  Network,
  Activity,
  Factory,
} from 'lucide-react';
import { sampleCampaigns, Campaign, CampaignBrief, CalendarItem, ChecklistItem } from './mockData';
import { useAuth } from './lib/auth/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from './lib/auth/permissions';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { createPhase16aRepositories } from './lib/core/repositoryFactory';
import { LocalStorageApprovalRepository, LocalStorageAssetRepository } from './lib/core/localStorageRepositories';
import type { BriefUpdatePatch, GenerationDetailResult, ResolvingApprovalAction, ApprovalRepository, AssetRepository, AssetCreateInput, AssetUpdatePatch, AssetScopedParams } from './lib/core/coreRepository';
import type { Client, Brand, Campaign as CoreCampaign, CampaignBrief as CoreCampaignBrief, PlanLengthDays, ContentPlanItem, ContentApprovalRequest, AssetItem } from './types/core';
import LoginScreen from './components/auth/LoginScreen';
import ClientsTab from './components/core/ClientsTab';
import BrandsTab from './components/core/BrandsTab';
import CampaignsTab from './components/core/CampaignsTab';
import BriefIntakeTab from './components/core/BriefIntakeTab';
import ContentGenerationTab from './components/core/ContentGenerationTab';
import ContentCalendarTab from './components/core/ContentCalendarTab';
import ApprovalsTab from './components/core/ApprovalsTab';
import ClientViewTab from './components/core/ClientViewTab';
import AssetLibraryTab from './components/core/AssetLibraryTab';
import ReportsTab from './components/core/ReportsTab';
import ExportPackTab from './components/core/ExportPackTab';
import ConnectorRegistryTab from './components/core/ConnectorRegistryTab';
import AutomationLogsTab from './components/core/AutomationLogsTab';
import AutomationFactoryTab from './components/core/AutomationFactoryTab';
import { loadCoreData, saveCoreData, loadGenerationData, saveGenerationData, loadApprovalData, saveApprovalData, loadAssetData, saveAssetData, canSubmitItem, submitForApproval } from './lib/core/coreData';
import { assetScopeIsSupabaseSafe, approvalScopeIsSupabaseSafe } from './lib/core/repoRouting';
import type { AssetRouteIds, ApprovalRouteIds } from './lib/core/repoRouting';
import type { CoreDataStore, GenerationDataStore, ApprovalDataStore, AssetDataStore, ClientFormData, BrandFormData, CampaignFormData, BriefFormData } from './lib/core/coreData';
import { loadAutomationLogData, saveAutomationLogData } from './lib/core/automationLogs';
import type { AutomationLogStore } from './lib/core/automationLogs';
import { runContentFactory, getContentFactoryWebhookUrl } from './lib/core/contentFactory';
import { runDesignFactory } from './lib/core/designFactory';
import type { DesignFactoryResult } from './lib/core/designFactory';
import { runVideoFactory } from './lib/core/videoFactory';
import type { VideoFactoryResult } from './lib/core/videoFactory';
import type { ContentFactoryResult, ContentFactoryRunInput } from './lib/core/contentFactory';

const manualExportBlocks = [
  {
    title: "Copy Full Campaign Pack",
    description: "Full markdown campaign pack for internal/client review.",
    content: `# FULL CAMPAIGN PACK: VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## A. BRAND BRIEF SUMMARY
- Tên thương hiệu: Vị Cuốn
- Ngành hàng: F&B / premium street food tại TP Vinh, Nghệ An
- Sản phẩm chính: Bánh tráng cuốn heo quay
- Tone giọng: Gần gũi, ngon miệng, thực tế mang chất địa phương Vinh

## B. CAMPAIGN SLOGANS
1. "Cuốn ngon chuẩn vị, da giòn rôm rả - Bữa trưa thảnh thơi cùng Vị Cuốn!"
2. "Thèm heo quay giòn lu, ghé ngay Vị Cuốn!"

## C. 7-DAY CONTENT SCHEDULE
- Ngày 1: Giới thiệu heo quay lu đất truyền thống
- Ngày 2: Sự tiện lợi cho dân văn phòng Vinh (Reels/TikTok)
- Ngày 3: Review mắm nêm đậm đà chuẩn vị miền Trung
- Ngày 4: Menu đa dạng các món cuốn tươi thanh mát
- Ngày 5: Trải nghiệm tụ họp cuối tuần cùng bạn bè
- Ngày 6: Quy trình bếp sạch và vệ sinh an toàn thực phẩm
- Ngày 7: Bữa tối ấm cúng cùng gia đình`
  },
  {
    title: "Copy Client Summary",
    description: "Client-facing overview of the campaign strategy and outputs.",
    content: `# CLIENT PRESENTATION SUMMARY - VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## TỔNG QUAN CHIẾN DỊCH
Chiến dịch truyền thông tích hợp cho thương hiệu "Vị Cuốn", hướng tới mục tiêu là dân văn phòng, học sinh sinh viên và các gia đình trẻ tại khu vực TP Vinh, Nghệ An.

## ĐIỂM SÁNG CHIẾN LƯỢC
- Khái niệm chủ đạo: "Street Food meets Premium" (Món ăn đường phố nâng tầm cao cấp)
- Kênh truyền thông chính: Facebook (Bài viết) & TikTok/Reels (Video dọc ngắn)
- Trọng tâm: Thông điệp gần gũi địa phương, âm thanh ASMR kích thích vị giác và hình ảnh sản phẩm sạch sẽ, cao cấp.`
  },
  {
    title: "Copy Editor Handoff",
    description: "Guidelines and instructions for video editing.",
    content: `# VIDEO EDITOR HANDOFF DOCUMENT - VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## PHONG CÁCH VIDEO & CHỈ DẪN DỰNG
- Tỷ lệ khung hình: 9:16 Vertical (Dọc)
- Thời lượng mục tiêu: 15 giây
- Phong cách âm thanh: Tiếng động ASMR thực tế, nhạc nền nhẹ nhàng thư giãn
- Phong cách hình ảnh: Sáng sủa, sạch sẽ, tập trung cận cảnh nguyên liệu tươi ngon và lát cắt thịt quay giòn rụm

## KỊCH BẢN VIDEO 1 (ASMR Heo quay giòn rụm)
- Phân cảnh 1 (0-3s): Cảnh mở lu đất bốc hơi nghi ngút nóng hổi.
- Phân cảnh 2 (3-8s): Tiếng gõ giòn rôm rả của lớp da heo quay dưới lưỡi dao bếp sạch sẽ.
- Phân cảnh 3 (8-12s): Đĩa thịt heo quay đầy đặn bày cùng rau rừng, cuốn bánh tráng chấm ngập mắm nêm.
- Phân cảnh 4 (12-15s): Banner kêu gọi hành động hiển thị thông tin địa chỉ/hotline của Vị Cuốn tại Vinh.`
  },
  {
    title: "Copy Designer Handoff",
    description: "Visual design requirements and AI prompts.",
    content: `# DESIGNER HANDOFF DOCUMENT - VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## TÔNG MÀU & PHONG CÁCH THIẾT KẾ
- Mood: Hiện đại, ấm cúng, sạch sẽ
- Tông màu chủ đạo: Xanh lá cây tươi của lá, màu nâu ấm của thớt gỗ
- Chữ đè lên hình (Text Overlay): "BÁNH TRÁNG CUỐN HEO QUAY NƯỚNG LU - STREET FOOD meets PREMIUM"

## PROMPTS TẠO ẢNH AI (FAL.AI / MIDJOURNEY)
- Prompt 1: "A clean overhead photograph of a premium Vietnamese roasted pork platter with fresh herbs, rice paper rolls, and a bowl of anchovy sauce on a light-colored wooden table, cozy high-quality restaurant interior background, daylight, photorealistic --ar 16:9"`
  },
  {
    title: "Copy Ads Draft Pack",
    description: "Local campaign audience targets and draft ad units.",
    content: `# ADS MANAGER CONFIGURATION PACK - VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## PHÂN KHÚC KHÁCH HÀNG MỤC TIÊU (TARGETING)
- Vị trí địa lý: TP Vinh, Nghệ An (Bán kính 4km quanh cửa hàng)
- Độ tuổi mục tiêu: 18 - 35
- Sở thích hành vi: Ẩm thực địa phương, món ăn Việt Nam, dịch vụ giao đồ ăn

## MẪU NỘI DUNG QUẢNG CÁO DỰ THẢO (AD DRAFT)
- Mục tiêu chiến dịch: Nhắn tin (Messaging) / Lượt tương tác
- Tiêu đề quảng cáo: Vị Cuốn - Món ăn đường phố nâng tầm cao cấp
- Thân bài quảng cáo: Thịt heo quay lu giòn rụm, rau rừng tươi xanh xứ Nghệ, mắm nêm đậm đà chuẩn vị. Đặt ngay suất trưa thảnh thơi giao tận nơi của Vị Cuốn!`
  },
  {
    title: "Copy Approval Checklist",
    description: "Mandatory human sign-off checklist.",
    content: `# OWNER COMPLIANCE & SAFETY CHECKLIST - VỊ CUỐN

## DISCLAIMER
- Sample Data Only
- Draft only
- Human approval required
- No auto-post
- No real ads launched
- No real customer messaging

## CÁC TIÊU CHÍ KIỂM DUYỆT BẮT BUỘC
1. [ ] Kiểm tra tính đồng nhất thương hiệu: Thông điệp đã đúng định vị premium của Vị Cuốn chưa?
2. [ ] Xác thực giá bán lẻ: Chủ thương hiệu (Owner) đã điền mức giá bán thực tế của đĩa cuốn chưa?
3. [ ] Xác thực thông tin liên hệ: Địa chỉ cụ thể và hotline tại TP Vinh đã chính xác chưa?
4. [ ] Kiểm tra kênh phân phối quảng cáo: Đảm bảo không có bất kỳ hệ thống tự động đăng bài nào được liên kết.
5. [ ] Kiểm duyệt ngân sách: Ngân sách chiến dịch đã được xác nhận thủ công bởi Owner hay chưa?`
  }
];

export default function App() {
  const { user, loading: authLoading, isAuthenticated, signOut, mode } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const stored = localStorage.getItem('claude_marketing_team_campaigns_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasViCuon = JSON.stringify(parsed).includes('Vị Cuốn');
        const hasOldData = JSON.stringify(parsed).includes('Tôm Tép') || 
                           JSON.stringify(parsed).includes('Trà Sữa') || 
                           JSON.stringify(parsed).includes('Matcha') || 
                           JSON.stringify(parsed).includes('khoai dẻo');
        if (hasViCuon && !hasOldData) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return sampleCampaigns;
  });

  const [activeCampaignId, setActiveCampaignId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem('claude_marketing_team_active_campaign_v3');
      const storedCampaigns = localStorage.getItem('claude_marketing_team_campaigns_v3');
      if (storedCampaigns) {
        const parsedCampaigns = JSON.parse(storedCampaigns);
        const hasViCuon = JSON.stringify(parsedCampaigns).includes('Vị Cuốn');
        const hasOldData = JSON.stringify(parsedCampaigns).includes('Tôm Tép') || 
                           JSON.stringify(parsedCampaigns).includes('Trà Sữa') || 
                           JSON.stringify(parsedCampaigns).includes('Matcha') || 
                           JSON.stringify(parsedCampaigns).includes('khoai dẻo');
        if (hasViCuon && !hasOldData && storedId && parsedCampaigns.some((c: any) => c.id === storedId)) {
          return storedId;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return sampleCampaigns[0].id;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [outputSubTab, setOutputSubTab] = useState<string>('calendar');
  const [viewMode, setViewMode] = useState<'owner' | 'client'>('owner');

  // Phase 4 — Core data (clients, brands, campaigns)
  const [coreData, setCoreData] = useState<CoreDataStore>(() => loadCoreData());
  const [coreNavFilter, setCoreNavFilter] = useState<{ clientId?: string; brandId?: string }>({});

  // Phase 16A — Repository layer (Supabase when configured, localStorage otherwise)
  const repos = useMemo(
    () => createPhase16aRepositories(supabase, isSupabaseConfigured),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Phase 16C-2 — Always-available localStorage approval repo, used as the
  // per-operation fallback when scope IDs are not valid UUIDs (local/demo data).
  const localApprovals = useMemo(() => new LocalStorageApprovalRepository(), []);

  // Phase 16D — Always-available localStorage asset repo, used as the
  // per-operation fallback when scope IDs are not valid UUIDs (local/demo data).
  const localAssets = useMemo(() => new LocalStorageAssetRepository(), []);

  // Phase 16A — Non-blocking error state for Supabase data load failures
  const [supabaseLoadError, setSupabaseLoadError] = useState<string | null>(null);

  // Phase 16A — On mount: if Supabase is configured, fetch clients+brands and
  // override the localStorage seed. Errors are non-fatal (localStorage fallback stays active).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const load = async () => {
      const clients = await repos.clients.list();
      // Load brands scoped per client to prevent cross-client data leakage
      const brandArrays = await Promise.all(clients.map(c => repos.brands.list(c.id)));
      const brands = brandArrays.flat();
      // Load campaigns scoped per client to prevent cross-client data leakage
      const campaignArrays = await Promise.all(clients.map(c => repos.campaigns.list({ clientId: c.id })));
      const loadedCampaigns = campaignArrays.flat();
      // Load briefs scoped per campaign to prevent cross-tenant data leakage
      const briefArrays = await Promise.all(
        loadedCampaigns.map(c => repos.briefs.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id })),
      );
      const loadedBriefs = briefArrays.flat();
      // Load generation jobs/items scoped per client/brand/campaign/brief —
      // never by briefId/generationId alone (Phase 16C-1)
      const generationArrays = await Promise.all(
        loadedCampaigns.flatMap((c, idx) =>
          briefArrays[idx].map(b =>
            repos.generations.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id, briefId: b.id }),
          ),
        ),
      );
      const loadedGenerationJobs = generationArrays.flatMap(r => r.jobs);
      const loadedContentItems = generationArrays.flatMap(r => r.items);
      // Load approval requests/events/comments scoped per generation job —
      // never by approvalId/generationId alone (Phase 16C-2)
      const approvalArrays = await Promise.all(
        loadedGenerationJobs
          .filter(job => job.client_id && job.brand_id)
          .map(job => repos.approvals.list({
            clientId: job.client_id as string,
            brandId: job.brand_id as string,
            campaignId: job.campaign_id,
            briefId: job.brief_id,
            generationId: job.id,
          })),
      );
      const loadedApprovalRequests = approvalArrays.flatMap(r => r.requests);
      const loadedApprovalEvents = approvalArrays.flatMap(r => r.events);
      const loadedApprovalComments = approvalArrays.flatMap(r => r.comments);
      // Load assets/collections scoped per client+brand — never by assetId
      // alone (Phase 16D). campaign/brief/generation/content-item scope is
      // left unfiltered here to load every asset under each brand.
      const assetArrays = await Promise.all(
        brands.map(b => repos.assets.list({ clientId: b.client_id, brandId: b.id })),
      );
      const loadedAssets = assetArrays.flat();
      const collectionArrays = await Promise.all(
        brands.map(b => repos.assetCollections.list({ clientId: b.client_id, brandId: b.id })),
      );
      const loadedCollections = collectionArrays.flat();
      if (cancelled) return;
      setCoreData(prev => {
        const next = { ...prev, clients, brands, campaigns: loadedCampaigns, briefs: loadedBriefs };
        saveCoreData(next);
        return next;
      });
      setGenData(() => {
        const next = { generationJobs: loadedGenerationJobs, contentItems: loadedContentItems };
        saveGenerationData(next);
        return next;
      });
      setApprovalData(() => {
        const next = {
          approvalRequests: loadedApprovalRequests,
          approvalEvents: loadedApprovalEvents,
          approvalComments: loadedApprovalComments,
        };
        saveApprovalData(next);
        return next;
      });
      setAssetData(() => {
        const next: AssetDataStore = { assets: loadedAssets, collections: loadedCollections };
        saveAssetData(next);
        return next;
      });
    };
    load().catch((err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : String(err);
      setSupabaseLoadError(`Supabase load failed (using local data): ${msg}`);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Phase 16A — typed repo handlers: mutations go through repos, return DB rows with real IDs.
  // Errors propagate to the calling tab so the user sees them in the form/action error display.

  const handleClientCreate = async (data: ClientFormData): Promise<void> => {
    const client: Client = await repos.clients.create(data);
    setCoreData(prev => {
      const next = { ...prev, clients: [client, ...prev.clients] };
      saveCoreData(next);
      return next;
    });
  };

  const handleClientUpdate = async (id: string, patch: Partial<Client>): Promise<void> => {
    const updated: Client = await repos.clients.update(id, patch);
    setCoreData(prev => {
      const next = { ...prev, clients: prev.clients.map(c => c.id === id ? updated : c) };
      saveCoreData(next);
      return next;
    });
  };

  const handleBrandCreate = async (data: BrandFormData): Promise<void> => {
    const brand: Brand = await repos.brands.create(data);
    setCoreData(prev => {
      const next = { ...prev, brands: [brand, ...prev.brands] };
      saveCoreData(next);
      return next;
    });
  };

  // Phase 16B-1 — typed campaign repo handlers (clientId/brandId/campaignId scoped)
  const handleCampaignCreate = async (data: CampaignFormData): Promise<void> => {
    const campaign: CoreCampaign = await repos.campaigns.create(data);
    setCoreData(prev => {
      const next = { ...prev, campaigns: [campaign, ...prev.campaigns] };
      saveCoreData(next);
      return next;
    });
  };

  const handleCampaignUpdate = async (campaign: CoreCampaign, patch: Partial<CoreCampaign>): Promise<void> => {
    const updated: CoreCampaign = await repos.campaigns.update(
      { clientId: campaign.client_id, brandId: campaign.brand_id, campaignId: campaign.id },
      patch,
    );
    setCoreData(prev => {
      const next = { ...prev, campaigns: prev.campaigns.map(c => c.id === updated.id ? updated : c) };
      saveCoreData(next);
      return next;
    });
  };

  // Phase 16B-2 — typed brief repo handlers (clientId/brandId/campaignId scoped)
  const handleBriefCreate = async (data: BriefFormData): Promise<CoreCampaignBrief> => {
    const brief: CoreCampaignBrief = await repos.briefs.create(data);
    setCoreData(prev => {
      const next = { ...prev, briefs: [brief, ...prev.briefs] };
      saveCoreData(next);
      return next;
    });
    return brief;
  };

  const handleBriefUpdate = async (brief: CoreCampaignBrief, patch: BriefUpdatePatch): Promise<void> => {
    const campaign = coreData.campaigns.find(c => c.id === brief.campaign_id);
    if (!campaign) throw new Error(`Campaign ${brief.campaign_id} not found for brief ${brief.id}`);
    const updated: CoreCampaignBrief = await repos.briefs.update(
      { clientId: campaign.client_id, brandId: campaign.brand_id, campaignId: campaign.id, briefId: brief.id },
      patch,
    );
    setCoreData(prev => {
      const next = { ...prev, briefs: prev.briefs.map(b => b.id === updated.id ? updated : b) };
      saveCoreData(next);
      return next;
    });
  };

  const handleCoreNavigate = (tab: string, filter?: { clientId?: string; brandId?: string }) => {
    setActiveTab(tab);
    setCoreNavFilter(filter ?? {});
  };

  // Phase 6 — Generation data (separate store to avoid cascade prop changes)
  const [genData, setGenData] = useState<GenerationDataStore>(() => loadGenerationData());
  const [genNavBriefId, setGenNavBriefId] = useState<string | undefined>(undefined);

  const handleGenerationUpdate = (updated: GenerationDataStore) => {
    setGenData(updated);
    saveGenerationData(updated);
  };

  // Phase 16C-1 — typed generation repo handler, scoped by
  // clientId/brandId/campaignId/briefId (never by generationId alone).
  const handleGenerationCreate = async (
    brief: CoreCampaignBrief,
    planLengthDays: PlanLengthDays,
  ): Promise<GenerationDetailResult> => {
    const campaign = coreData.campaigns.find(c => c.id === brief.campaign_id);
    if (!campaign) throw new Error(`Campaign ${brief.campaign_id} not found for brief ${brief.id}`);
    return repos.generations.create({
      brief,
      clientId: campaign.client_id,
      brandId: campaign.brand_id,
      campaignId: campaign.id,
      briefId: brief.id,
      planLengthDays,
      requestedBy: user?.role ?? null,
    });
  };

  const handleNavigateToGenerate = (briefId: string) => {
    setGenNavBriefId(briefId);
    setActiveTab('content-gen');
  };

  // Phase 8 — Approval data (separate store)
  const [approvalData, setApprovalData] = useState<ApprovalDataStore>(() => loadApprovalData());

  const handleNavigateToApprovals = () => {
    setActiveTab('approvals');
  };

  // Phase 10 — Asset Library data (separate store)
  const [assetData, setAssetData] = useState<AssetDataStore>(() => loadAssetData());

  // Phase 16D — Asset Library CRUD: per-operation repo selection. client_id/
  // brand_id are required for Supabase routing (content_assets.client_id/
  // brand_id are NOT NULL); campaign_id/brief_id/generation_job_id/
  // content_item_id/asset_collection_id are optional — null or undefined skip
  // the UUID check and only validated when present. Local-format ids
  // (asset-*/ast-*/col-*/collection-*/asset-collection-*/campaign-*/brand-*/
  // client-*/brief-*/generation-*/job-*/item-*/content-item-*) always fall
  // back to localStorage.
  //
  // Codex Fix Round (2026-06-11): asset_collection_id / assetCollectionId is
  // now part of the gate. content_assets.asset_collection_id is a UUID FK to
  // content_asset_collections — a local collection id (col-*/collection-*/
  // asset-collection-*) must never be sent there, so any operation touching
  // such a collection id falls back to localStorage too.
  //
  // Phase 17: the gate predicate is extracted verbatim into
  // repoRouting.ts (assetScopeIsSupabaseSafe) so it is unit-testable.
  const assetRepoFor = (ids: AssetRouteIds): AssetRepository => {
    if (isSupabaseConfigured && assetScopeIsSupabaseSafe(ids)) {
      return repos.assets;
    }
    return localAssets;
  };

  // Phase 16D — Create an asset, scoped by the client/brand/campaign chosen in
  // the form. The Asset Library UI does not expose brief/generation/
  // content-item linkage, so new assets always have those set to null.
  // asset_collection_id (input.data.asset_collection_id) is included in the
  // routing check — a local collection id routes the create to localStorage
  // even if client/brand are valid Supabase UUIDs.
  const handleAssetCreate = async (input: AssetCreateInput): Promise<void> => {
    const repo = assetRepoFor({
      clientId: input.clientId,
      brandId: input.brandId,
      campaignId: input.campaignId,
      briefId: input.briefId,
      generationId: input.generationId,
      contentItemId: input.contentItemId,
      assetCollectionId: input.data.asset_collection_id,
    });
    const created = await repo.create(input);
    setAssetData(prev => {
      const next: AssetDataStore = { ...prev, assets: [created, ...prev.assets] };
      saveAssetData(next);
      return next;
    });
  };

  // Phase 16D — Update an asset, scoped by its own full tenant chain (never by
  // assetId alone). Tenant/audit/identity fields are stripped from the patch
  // by the repository (sanitizeAssetPatch).
  //
  // Codex Fix Round (2026-06-11): scope.assetCollectionId is the asset's
  // CURRENT collection (used to match the existing row); nextCollectionId is
  // whichever collection id the operation will actually write (the patch's
  // new value if it changes the collection, otherwise the current one).
  //
  // Codex Fix Round 2 (2026-06-11): both the CURRENT and NEXT collection ids
  // must be gated. If the asset's current asset_collection_id is a local id
  // (col-*/collection-*/asset-collection-*), the operation must stay on
  // localStorage even when the patch changes the collection to null or a
  // valid UUID — Supabase has no row to match by that local id. currentAssetCollectionId
  // covers this; assetCollectionId (set to nextCollectionId) covers the
  // write-side check as before.
  const handleAssetEdit = async (asset: AssetItem, patch: AssetUpdatePatch): Promise<void> => {
    const scope: AssetScopedParams = {
      clientId: asset.client_id,
      brandId: asset.brand_id,
      campaignId: asset.campaign_id,
      briefId: asset.brief_id,
      generationId: asset.generation_job_id,
      contentItemId: asset.content_item_id,
      assetCollectionId: asset.asset_collection_id,
      assetId: asset.id,
    };
    const nextCollectionId = patch.asset_collection_id !== undefined ? patch.asset_collection_id : asset.asset_collection_id;
    const repo = assetRepoFor({ ...scope, assetCollectionId: nextCollectionId, currentAssetCollectionId: asset.asset_collection_id });
    const updated = await repo.update(scope, patch);
    setAssetData(prev => {
      const next: AssetDataStore = { ...prev, assets: prev.assets.map(a => a.id === updated.id ? updated : a) };
      saveAssetData(next);
      return next;
    });
  };

  // Phase 16D — Archive an asset (approval_status -> 'archived'), scoped by
  // its own full tenant chain (never by assetId alone). Non-destructive — no
  // hard delete (no DELETE policy on content_assets).
  const handleAssetArchive = async (asset: AssetItem): Promise<void> => {
    await handleAssetEdit(asset, { approval_status: 'archived' });
  };

  // Phase 14 — Automation Logs
  const [logData, setLogData] = useState<AutomationLogStore>(() => loadAutomationLogData());

  const handleLogUpdate = (data: AutomationLogStore) => {
    setLogData(data);
    saveAutomationLogData(data);
  };

  const actorLabel = user?.email ?? user?.role ?? 'System';

  const handleContentFactoryGenerate = async (input: ContentFactoryRunInput): Promise<ContentFactoryResult> => {
    const result = await runContentFactory(input);
    const baseGen: GenerationDataStore = {
      generationJobs: [result.job, ...genData.generationJobs],
      contentItems: [...result.items, ...genData.contentItems],
    };

    let nextGen = baseGen;
    let nextApproval = approvalData;
    for (const item of result.items) {
      const submitted = submitForApproval(nextApproval, nextGen, item, actorLabel, { priority: 'normal' });
      nextApproval = submitted.approval;
      nextGen = submitted.gen;
    }

    setGenData(nextGen);
    saveGenerationData(nextGen);
    setApprovalData(nextApproval);
    saveApprovalData(nextApproval);
    return result;
  };

  // Design Brief Factory V1 — reuses the same external_module job/item/approval
  // path as the Content Factory. Produces design brief (text/spec) approval
  // items only; never images, never a live connector. Auto-submits each item
  // for approval exactly like content packs, so design briefs land in the
  // Approval Board as pending items.
  const handleDesignFactoryGenerate = async (input: ContentFactoryRunInput): Promise<DesignFactoryResult> => {
    const result = await runDesignFactory(input);
    const baseGen: GenerationDataStore = {
      generationJobs: [result.job, ...genData.generationJobs],
      contentItems: [...result.items, ...genData.contentItems],
    };

    let nextGen = baseGen;
    let nextApproval = approvalData;
    for (const item of result.items) {
      const submitted = submitForApproval(nextApproval, nextGen, item, actorLabel, { priority: 'normal' });
      nextApproval = submitted.approval;
      nextGen = submitted.gen;
    }

    setGenData(nextGen);
    saveGenerationData(nextGen);
    setApprovalData(nextApproval);
    saveApprovalData(nextApproval);
    return result;
  };

  // Video Scripts Factory V1 — reuses the same external_module job/item/approval
  // path as the Content and Design Factories. Produces video script (text/script)
  // approval items only; never images, never video, never a live connector.
  // Auto-submits each item for approval exactly like content/design packs, so
  // video scripts land in the Approval Board as pending items.
  const handleVideoFactoryGenerate = async (input: ContentFactoryRunInput): Promise<VideoFactoryResult> => {
    const result = await runVideoFactory(input);
    const baseGen: GenerationDataStore = {
      generationJobs: [result.job, ...genData.generationJobs],
      contentItems: [...result.items, ...genData.contentItems],
    };

    let nextGen = baseGen;
    let nextApproval = approvalData;
    for (const item of result.items) {
      const submitted = submitForApproval(nextApproval, nextGen, item, actorLabel, { priority: 'normal' });
      nextApproval = submitted.approval;
      nextGen = submitted.gen;
    }

    setGenData(nextGen);
    saveGenerationData(nextGen);
    setApprovalData(nextApproval);
    saveApprovalData(nextApproval);
    return result;
  };

  // Phase 16C-2 — Approval CRUD: per-operation repo selection. Falls back to
  // localStorage whenever any ID *used by that operation* — tenant scope,
  // approvalId, and/or contentItemId — is not a valid UUID (local/demo data),
  // so local-format ids (approval-*/item-*/generation-*/job-*) are never sent
  // into a Supabase UUID column, even if Supabase is configured.
  //
  // Phase 17: the gate predicate is extracted verbatim into
  // repoRouting.ts (approvalScopeIsSupabaseSafe) so it is unit-testable.
  const approvalRepoFor = (ids: ApprovalRouteIds): ApprovalRepository => {
    if (isSupabaseConfigured && approvalScopeIsSupabaseSafe(ids)) {
      return repos.approvals;
    }
    return localApprovals;
  };

  // Phase 16C-2 — Submit a content item for approval, scoped by its full
  // tenant chain (clientId/brandId/campaignId/briefId/generationId).
  const handleApprovalSubmit = async (item: ContentPlanItem): Promise<void> => {
    const scope = {
      clientId: item.client_id,
      brandId: item.brand_id,
      campaignId: item.campaign_id,
      briefId: item.brief_id,
      generationId: item.generation_job_id,
      contentItemId: item.id,
    };
    if (!scope.clientId || !scope.brandId) {
      throw new Error(`Content item ${item.id} is missing client/brand scope`);
    }
    const repo = approvalRepoFor(scope);
    const result = await repo.create({
      contentItem: item,
      clientId: scope.clientId,
      brandId: scope.brandId,
      campaignId: scope.campaignId,
      briefId: scope.briefId,
      generationId: scope.generationId,
      actorLabel,
    });
    setApprovalData(prev => {
      const next: ApprovalDataStore = {
        approvalRequests: [result.request, ...prev.approvalRequests],
        approvalEvents: [result.event, ...prev.approvalEvents],
        approvalComments: prev.approvalComments,
      };
      saveApprovalData(next);
      return next;
    });
    setGenData(prev => {
      const next: GenerationDataStore = {
        ...prev,
        contentItems: prev.contentItems.map(i => i.id === result.updatedItem.id ? result.updatedItem : i),
      };
      saveGenerationData(next);
      return next;
    });
  };

  // Phase 16C-2 — Approve/reject/request revision/cancel an approval request,
  // scoped by its full tenant chain (never by approvalId alone).
  const handleApprovalAction = async (
    request: ContentApprovalRequest,
    action: ResolvingApprovalAction,
    comment?: string,
  ): Promise<void> => {
    const { client_id: clientId, brand_id: brandId, campaign_id: campaignId, brief_id: briefId, generation_job_id: generationId, content_item_id: contentItemId } = request;
    if (!clientId || !brandId || !briefId || !generationId) {
      throw new Error(`Approval request ${request.id} is missing tenant scope`);
    }
    const scope = { clientId, brandId, campaignId, briefId, generationId, approvalId: request.id, contentItemId };
    const repo = approvalRepoFor(scope);
    const result = await repo.executeAction(scope, action, actorLabel, comment);
    setApprovalData(prev => {
      const next: ApprovalDataStore = {
        approvalRequests: prev.approvalRequests.map(r => r.id === result.request.id ? result.request : r),
        approvalEvents: [result.event, ...prev.approvalEvents],
        approvalComments: prev.approvalComments,
      };
      saveApprovalData(next);
      return next;
    });
    setGenData(prev => {
      const next: GenerationDataStore = {
        ...prev,
        contentItems: prev.contentItems.map(i => i.id === result.updatedItem.id ? result.updatedItem : i),
      };
      saveGenerationData(next);
      return next;
    });
  };

  // Phase 16C-2 — Add a comment to an approval request, scoped by its full
  // tenant chain (never by approvalId alone).
  const handleApprovalComment = async (
    request: ContentApprovalRequest,
    commentText: string,
    isInternal = true,
  ): Promise<void> => {
    const { client_id: clientId, brand_id: brandId, campaign_id: campaignId, brief_id: briefId, generation_job_id: generationId, content_item_id: contentItemId } = request;
    if (!clientId || !brandId || !briefId || !generationId) {
      throw new Error(`Approval request ${request.id} is missing tenant scope`);
    }
    const scope = { clientId, brandId, campaignId, briefId, generationId, approvalId: request.id, contentItemId };
    const repo = approvalRepoFor(scope);
    const result = await repo.addComment(scope, actorLabel, commentText, isInternal);
    setApprovalData(prev => {
      const next: ApprovalDataStore = {
        ...prev,
        approvalEvents: [result.event, ...prev.approvalEvents],
        approvalComments: [result.comment, ...prev.approvalComments],
      };
      saveApprovalData(next);
      return next;
    });
  };

  const submittableItemIds = new Set(
    genData.contentItems.filter(i => canSubmitItem(approvalData, i)).map(i => i.id)
  );
  const handleViewModeSwitch = (mode: 'owner' | 'client') => {
    setViewMode(mode);
    if (mode === 'client') {
      const ownerOnlyTabs = ['new-campaign', 'team-board', 'manual-export', 'client-demo', 'automation-factory', 'automation-logs'];
      if (ownerOnlyTabs.includes(activeTab)) setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('claude_marketing_team_campaigns_v3', JSON.stringify(campaigns));
    } catch (e) {
      console.error(e);
    }
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem('claude_marketing_team_active_campaign_v3', activeCampaignId);
    } catch (e) {
      console.error(e);
    }
  }, [activeCampaignId]);

  useEffect(() => {
    try {
      // Clear legacy storage keys
      localStorage.removeItem('campaigns');
      localStorage.removeItem('activeCampaignId');
      localStorage.removeItem('claude_marketing_team_campaigns_v2');
      localStorage.removeItem('claude_marketing_team_active_campaign_v2');

      let shouldReset = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val) {
            const lower = val.toLowerCase();
            if (
              lower.includes('tôm tép') || 
              lower.includes('khoai dẻo') || 
              lower.includes('trà sữa') ||
              lower.includes('matcha')
            ) {
              shouldReset = true;
              break;
            }
          }
        }
      }
      if (shouldReset) {
        localStorage.clear();
        setCampaigns(sampleCampaigns);
        setActiveCampaignId(sampleCampaigns[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  // Phase H.4 state — Client Approval Sheet
  const [approvalSheetItems, setApprovalSheetItems] = useState([
    { id: 'a1', item: 'Campaign Summary',        owner: 'AI Coordinator', status: 'Approved',              note: 'Strategy approved',        nextAction: 'Distribute to team' },
    { id: 'a2', item: '7-Day Content Plan',      owner: 'Copywriter',     status: 'Ready for review',      note: '',                          nextAction: 'Owner review' },
    { id: 'a3', item: 'Video Script Pack',       owner: 'Video Editor',   status: 'Ready for review',      note: '',                          nextAction: 'Send to video team' },
    { id: 'a4', item: 'Design Brief Pack',       owner: 'Designer',       status: 'Ready for review',      note: '',                          nextAction: 'Send to design team' },
    { id: 'a5', item: 'Ads Angle Pack',          owner: 'Ads Manager',    status: 'Waiting owner approval', note: 'Budget needed from owner', nextAction: 'Owner confirm budget' },
    { id: 'a6', item: 'Data Reporter Summary',   owner: 'Data Reporter',  status: 'Approved',              note: 'KPIs look reasonable',      nextAction: 'Use as baseline' },
    { id: 'a7', item: 'Human Approval Checklist',owner: 'Owner',          status: 'Needs edit',            note: 'Price to be filled in',     nextAction: 'Owner fill real price' },
  ]);

  // Phase H.4 state — Export Readiness Checklist
  const [exportChecklist, setExportChecklist] = useState([
    { id: 'e1', label: 'Brand brief complete',                        checked: true,  fixed: false },
    { id: 'e2', label: 'Product/customer clearly defined',            checked: true,  fixed: false },
    { id: 'e3', label: 'All outputs reviewed by owner',               checked: false, fixed: false },
    { id: 'e4', label: 'Human approval sign-off completed',           checked: false, fixed: false },
    { id: 'e5', label: 'Manual publishing only — no auto-scheduler',  checked: true,  fixed: true  },
    { id: 'e6', label: 'No real ads launched from workspace',         checked: true,  fixed: true  },
    { id: 'e7', label: 'No customer messaging sent',                  checked: true,  fixed: true  },
  ]);

  // Copy states
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
      });
  };
  
  // Simulation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(0);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  
  // Brief form state
  const [briefForm, setBriefForm] = useState<CampaignBrief>({
    brandName: '',
    industry: '',
    heroProduct: '',
    pricing: '',
    targetCustomer: '',
    location: '',
    goal: '',
    duration: '7 ngày',
    offer: '',
    channels: ['Facebook'],
    toneOfVoice: 'Gần gũi, ngon miệng, thực tế, mang chất địa phương Vinh',
    exclusions: '',
    assets: ''
  });

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  const handleBriefSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulatedProgress(0);
    setSimulatedLogs([
      "🔋 [SYSTEM]: Bắt đầu tiếp nhận Brief chiến dịch mới...",
      "🔍 [AI Coordinator]: Đang phân tích thông điệp chính và ưu đãi...",
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSimulatedProgress(progress);
      
      if (progress === 30) {
        setSimulatedLogs(prev => [...prev, "✍️ [Copywriter Agent]: Khởi chạy kỹ năng. Soạn thảo 7 caption bài đăng Facebook..."]);
      } else if (progress === 50) {
        setSimulatedLogs(prev => [...prev, "🎬 [Video Editor Agent]: Thiết kế kịch bản phân cảnh video TikTok 9:16..."]);
      } else if (progress === 70) {
        setSimulatedLogs(prev => [...prev, "🎨 [Designer Agent]: Lên bố cục và dịch 7 prompt tiếng Anh vẽ ảnh AI..."]);
      } else if (progress === 90) {
        setSimulatedLogs(prev => [...prev, "⚙️ [Ads Manager Agent]: Cấu hình ngân sách & target tệp khách tại Vinh..."]);
        setSimulatedLogs(prev => [...prev, "📦 [AI Coordinator]: Đóng gói gói chiến dịch cuối cùng (Final Pack)..."]);
      } else if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newCampaign: Campaign = {
            id: `CAMP-NEW-${Date.now()}`,
            name: `Chiến dịch ${briefForm.heroProduct} — ${briefForm.brandName}`,
            phase: "Phase G+ — Workspace Utility Upgrade",
            status: "Needs Review",
            brief: { ...briefForm },
            // Inherit mock structures but customized with form inputs
            outputs: {
              ...activeCampaign.outputs,
              copywriter: {
                ...activeCampaign.outputs.copywriter,
                slogans: [
                  `Cuốn ngon chuẩn vị, da giòn rôm rả — Bữa trưa thảnh thơi cùng ${briefForm.brandName}!`,
                  `Thèm heo quay giòn lu, ghé ngay ${briefForm.brandName}!`,
                  `Cuốn sạch premium — Tròn vị ${briefForm.brandName}`
                ],
                hooks: activeCampaign.outputs.copywriter.hooks.map(h => h.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)),
                ctas: activeCampaign.outputs.copywriter.ctas,
                shortCaptions: activeCampaign.outputs.copywriter.shortCaptions.map(s => s.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)),
                hashtags: activeCampaign.outputs.copywriter.hashtags,
                captions: activeCampaign.outputs.copywriter.captions.map((cap) => ({
                  ...cap,
                  body: cap.body.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                }))
              },
              videoEditor: {
                scripts: activeCampaign.outputs.videoEditor.scripts.map(s => ({
                  ...s,
                  title: s.title.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  hook: s.hook.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  scenes: s.scenes.map(sc => ({
                    ...sc,
                    visual: sc.visual.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                    audio: sc.audio.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                    textOverlay: sc.textOverlay.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                  }))
                }))
              },
              designer: {
                briefs: activeCampaign.outputs.designer.briefs.map(b => ({
                  ...b,
                  title: b.title.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  layout: b.layout.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  textOverlay: b.textOverlay.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  prompt: b.prompt.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  visualDirection: b.visualDirection.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  colorStyleNote: b.colorStyleNote.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                }))
              },
              adsManager: {
                ...activeCampaign.outputs.adsManager,
                angles: activeCampaign.outputs.adsManager.angles.map(a => a.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)),
                adSets: activeCampaign.outputs.adsManager.adSets.map(as => ({
                  ...as,
                  targeting: as.targeting.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                })),
                mockAds: activeCampaign.outputs.adsManager.mockAds.map(ma => ({
                  ...ma,
                  name: ma.name.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  angle: ma.angle.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  primaryText: ma.primaryText.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  headline: ma.headline.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
                  description: ma.description.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                }))
              },
              dataReporter: {
                ...activeCampaign.outputs.dataReporter,
                reportTemplate: activeCampaign.outputs.dataReporter.reportTemplate.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
              }
            },
            calendar: activeCampaign.calendar?.map(cal => ({
              ...cal,
              content: cal.content.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct),
              visual: cal.visual.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
            })),
            checklist: sampleCampaigns[0].checklist?.map(item => ({ ...item, checked: false }))
          };

          setCampaigns(prev => [newCampaign, ...prev]);
          setActiveCampaignId(newCampaign.id);
          setIsSimulating(false);
          setActiveTab('outputs');
        }, 800);
      }
    }, 400);
  };

  const updateCampaignStatus = (status: 'Approved' | 'Rejected', _feedback?: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === activeCampaignId) {
        return {
          ...c,
          status,
          // Simulated simulation log action
          outputs: {
            ...c.outputs,
            dataReporter: status === 'Approved' ? {
              ...c.outputs.dataReporter,
              // Keep original mock data
            } : c.outputs.dataReporter
          }
        };
      }
      return c;
    }));
  };

  const toggleChecklistItem = (campaignId: string, itemId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId && c.checklist) {
        return {
          ...c,
          checklist: c.checklist.map((item: ChecklistItem) => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
          )
        };
      }
      return c;
    }));
  };

  // Auth gate — must be after all hooks
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading The Core Agency — Internal OS…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="app-header">
        <div className="logo-section">
          <img src="/brand/core-icon.png" alt="The Core Agency — Internal OS" className="brand-mark" width={42} height={42} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.02em', background: 'linear-gradient(135deg, #fff 40%, #fdba74)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              The Core Agency — Internal OS
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FnB agency control center · Owner-approved workflows only</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-brand" style={{ background: 'rgba(244, 122, 31, 0.15)', color: '#fb923c', borderColor: 'rgba(244, 122, 31, 0.3)', border: '1px solid' }}>
              Core MVP — Internal Demo
            </span>
            <span
              title={isSupabaseConfigured
                ? 'Connected to Supabase. Data persists to your Supabase project (local-format records stay in this browser).'
                : 'Supabase is not configured. All data stays in this browser (localStorage).'}
              style={{
                fontSize: '0.68rem', fontWeight: 600, borderRadius: '5px', padding: '2px 8px', cursor: 'default',
                color: isSupabaseConfigured ? '#34d399' : '#f59e0b',
                background: isSupabaseConfigured ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                border: isSupabaseConfigured ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {isSupabaseConfigured ? 'Supabase Data' : 'Local Data Only'}
            </span>
            {/* User status */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '5px 10px' }}>
                <Lock size={11} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: ROLE_COLORS[user.role] ?? '#fb923c', background: `${ROLE_COLORS[user.role] ?? '#fb923c'}18`, borderRadius: '4px', padding: '1px 6px' }}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                {mode === 'demo' && (
                  <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: '4px', padding: '1px 5px' }}>DEMO</span>
                )}
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => handleViewModeSwitch('owner')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'owner' ? 'rgba(244, 122, 31,0.25)' : 'transparent',
                color: viewMode === 'owner' ? '#fb923c' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              🔧 Owner View
            </button>
            <button
              onClick={() => handleViewModeSwitch('client')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'client' ? 'rgba(16,185,129,0.25)' : 'transparent',
                color: viewMode === 'client' ? '#34d399' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              <Eye size={13} /> Client View
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="app-main-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', minHeight: 'calc(100vh - 150px)' }}>

        {/* Navigation Sidebar */}
        <aside className="glass-panel app-sidebar" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            
            <button
              className={`btn btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'dashboard' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'dashboard' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>

            {/* ── Core Management ── */}
            <div style={{ margin: '4px 0 2px', padding: '0 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Core</div>

            <button
              className={`btn btn-secondary ${activeTab === 'clients' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'clients' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'clients' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('clients')}
            >
              <Users size={18} /> Clients
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'brands' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'brands' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'brands' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('brands')}
            >
              <Store size={18} /> Brands
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'campaigns' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'campaigns' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'campaigns' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('campaigns')}
            >
              <Zap size={18} /> Campaigns
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'brief-intake' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'brief-intake' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'brief-intake' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('brief-intake')}
            >
              <ClipboardList size={18} /> Brief Intake
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'content-gen' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'content-gen' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'content-gen' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => { setGenNavBriefId(undefined); setActiveTab('content-gen'); }}
            >
              <Wand2 size={18} /> Content Generation
            </button>
            {viewMode === 'owner' && (user?.role === 'owner' || user?.role === 'manager') && (
              <button
                className={`btn btn-secondary ${activeTab === 'automation-factory' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'automation-factory' ? '1px solid rgba(251, 146, 60,0.5)' : '', background: activeTab === 'automation-factory' ? 'rgba(244, 122, 31,0.1)' : '' }}
                onClick={() => setActiveTab('automation-factory')}
              >
                <Factory size={18} /> Automation Factory
              </button>
            )}

            <button
              className={`btn btn-secondary ${activeTab === 'content-calendar' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'content-calendar' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'content-calendar' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('content-calendar')}
            >
              <CalendarDays size={18} /> Content Calendar
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'approvals' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'approvals' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'approvals' ? 'rgba(244, 122, 31, 0.1)' : '', position: 'relative' }}
              onClick={() => setActiveTab('approvals')}
            >
              <ClipboardCheck size={18} /> Approvals
              {approvalData.approvalRequests.filter(r => r.status === 'submitted').length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.2)', borderRadius: '10px', padding: '1px 6px' }}>
                  {approvalData.approvalRequests.filter(r => r.status === 'submitted').length}
                </span>
              )}
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'reports' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'reports' ? '1px solid rgba(251, 146, 60,0.5)' : '', background: activeTab === 'reports' ? 'rgba(244, 122, 31,0.1)' : '' }}
              onClick={() => setActiveTab('reports')}
            >
              <BarChart2 size={18} /> Reports
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'export-pack' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'export-pack' ? '1px solid rgba(251, 146, 60,0.5)' : '', background: activeTab === 'export-pack' ? 'rgba(244, 122, 31,0.1)' : '' }}
              onClick={() => setActiveTab('export-pack')}
            >
              <Package size={18} /> Export Pack
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'connector-registry' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'connector-registry' ? '1px solid rgba(251, 146, 60,0.5)' : '', background: activeTab === 'connector-registry' ? 'rgba(244, 122, 31,0.1)' : '' }}
              onClick={() => setActiveTab('connector-registry')}
            >
              <Network size={18} /> Connector Registry
            </button>

            {viewMode === 'owner' && (user?.role === 'owner' || user?.role === 'manager') && (
              <button
                className={`btn btn-secondary ${activeTab === 'automation-logs' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'automation-logs' ? '1px solid rgba(251, 146, 60,0.5)' : '', background: activeTab === 'automation-logs' ? 'rgba(244, 122, 31,0.1)' : '', position: 'relative' }}
                onClick={() => setActiveTab('automation-logs')}
              >
                <Activity size={18} /> Automation Logs
                {logData.logs.filter(l => l.status === 'recorded' && l.severity === 'error').length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.2)', borderRadius: '10px', padding: '1px 6px' }}>
                    {logData.logs.filter(l => l.status === 'recorded' && l.severity === 'error').length}
                  </span>
                )}
              </button>
            )}

            {/* ── Client ── */}
            <div style={{ margin: '4px 0 2px', padding: '0 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Client</div>

            <button
              className={`btn btn-secondary ${activeTab === 'client-view' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'client-view' ? '1px solid rgba(52,211,153,0.5)' : '', background: activeTab === 'client-view' ? 'rgba(16,185,129,0.1)' : '' }}
              onClick={() => setActiveTab('client-view')}
            >
              <UserCheck size={18} /> Client Portal
            </button>

            <button
              className={`btn btn-secondary ${activeTab === 'asset-library' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'asset-library' ? '1px solid rgba(245,158,11,0.5)' : '', background: activeTab === 'asset-library' ? 'rgba(245,158,11,0.08)' : '' }}
              onClick={() => setActiveTab('asset-library')}
            >
              <FolderOpen size={18} /> Asset Library
            </button>

            <div style={{ margin: '4px 0 2px', padding: '0 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Workspace</div>

            <button
              className={`btn btn-secondary ${activeTab === 'brand-gallery' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'brand-gallery' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'brand-gallery' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('brand-gallery')}
            >
              <Store size={18} /> Brand Workspace
            </button>

            {viewMode === 'owner' && (
              <button
                className={`btn btn-secondary ${activeTab === 'new-campaign' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'new-campaign' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'new-campaign' ? 'rgba(244, 122, 31, 0.1)' : '' }}
                onClick={() => setActiveTab('new-campaign')}
              >
                <Plus size={18} /> New Campaign Brief
              </button>
            )}

            {viewMode === 'owner' && (
              <button
                className={`btn btn-secondary ${activeTab === 'team-board' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'team-board' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'team-board' ? 'rgba(244, 122, 31, 0.1)' : '' }}
                onClick={() => setActiveTab('team-board')}
              >
                <Users size={18} /> AI Team Board
              </button>
            )}

            <button 
              className={`btn btn-secondary ${activeTab === 'outputs' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'outputs' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'outputs' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('outputs')}
            >
              <Layers size={18} /> Campaign Outputs
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'approval' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'approval' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'approval' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('approval')}
            >
              <CheckSquare size={18} /> Approval Checklist
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'demo-pack' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'demo-pack' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'demo-pack' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('demo-pack')}
            >
              <FileText size={18} /> Client Presentation Pack
            </button>

            {viewMode === 'owner' && (
              <button
                className={`btn btn-secondary ${activeTab === 'client-demo' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'client-demo' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'client-demo' ? 'rgba(244, 122, 31, 0.1)' : '' }}
                onClick={() => setActiveTab('client-demo')}
              >
                <Monitor size={18} /> Client Workspace View
              </button>
            )}

            {viewMode === 'owner' && (
              <button
                className={`btn btn-secondary ${activeTab === 'manual-export' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'manual-export' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'manual-export' ? 'rgba(244, 122, 31, 0.1)' : '' }}
                onClick={() => setActiveTab('manual-export')}
              >
                <Copy size={18} /> Manual Export Pack
              </button>
            )}

            <button
              className={`btn btn-secondary ${activeTab === 'presentation-export' ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'presentation-export' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'presentation-export' ? 'rgba(244, 122, 31, 0.1)' : '' }}
              onClick={() => setActiveTab('presentation-export')}
            >
              <BookOpen size={18} /> Presentation & Export
            </button>

          </div>

          <div style={{ marginTop: '40px', padding: '12px', borderTop: '1px solid var(--border-color)', width: '100%' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Brand:</p>
            <select 
              value={activeCampaignId} 
              onChange={(e) => setActiveCampaignId(e.target.value)}
              className="form-control" 
              style={{ marginTop: '8px', fontSize: '0.85rem', padding: '6px' }}
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.brief.brandName} - {c.brief.heroProduct}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', borderTop: '1px solid var(--border-color)', width: '100%', fontSize: '0.8rem' }}>
            {viewMode === 'owner' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                  <span>🛡️ Safety Guard Status</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Auto-post:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Ads:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Message:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Connectors:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Secrets Added:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sample Data Only:</span> <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>YES</span></div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                  <span>🛡️ Trust &amp; Safety</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sample Data:</span> <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>YES</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Approval Required:</span> <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>YES</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No Live Publishing:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>✓</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>No Real Ads:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>✓</span></div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0, maxWidth: '100%' }}>
          
          {/* Simulation Loading overlay overlay */}
          {isSimulating && (
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'rgba(3, 7, 18, 0.95)' }}>
              <Sparkles size={48} className="logo-glow" style={{ animation: 'spin 3s linear infinite' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>AI Team Sáng Tạo Đang Thực Thi...</h2>
              <div style={{ width: '100%', maxWidth: '500px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${simulatedProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-blue))', transition: 'width 0.3s ease-index' }}></div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tiến độ: {simulatedProgress}%</p>
              
              <div style={{ width: '100%', maxWidth: '600px', height: '180px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'center' }}>
                {simulatedLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.includes('SYSTEM') ? '#34d399' : '#e2e8f0' }}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 16A — Supabase load error banner (non-blocking, dismissible) */}
          {supabaseLoadError && (
            <div style={{ margin: '0 0 12px', padding: '10px 14px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: '#fb923c' }}>⚠ {supabaseLoadError}</span>
              <button onClick={() => setSupabaseLoadError(null)} style={{ background: 'none', border: 'none', color: '#fb923c', cursor: 'pointer', fontSize: '0.85rem', padding: '0 4px' }}>✕</button>
            </div>
          )}

          {!isSimulating && (
            <>
              {/* ── Phase 4: Clients Tab ── */}
              {activeTab === 'clients' && (
                <ClientsTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  onClientCreate={handleClientCreate}
                  onClientUpdate={handleClientUpdate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  onNavigate={handleCoreNavigate}
                />
              )}

              {/* ── Phase 4: Brands Tab ── */}
              {activeTab === 'brands' && (
                <BrandsTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  onBrandCreate={handleBrandCreate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  initialFilterClientId={coreNavFilter.clientId}
                  onNavigate={handleCoreNavigate}
                />
              )}

              {/* ── Phase 4: Campaigns Tab ── */}
              {activeTab === 'campaigns' && (
                <CampaignsTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  onCampaignCreate={handleCampaignCreate}
                  onCampaignUpdate={handleCampaignUpdate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  initialFilterClientId={coreNavFilter.clientId}
                  initialFilterBrandId={coreNavFilter.brandId}
                />
              )}

              {/* ── Phase 5: Brief Intake Tab ── */}
              {activeTab === 'brief-intake' && (
                <BriefIntakeTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  onBriefCreate={handleBriefCreate}
                  onBriefUpdate={handleBriefUpdate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  onNavigateToGenerate={handleNavigateToGenerate}
                />
              )}

              {/* ── Phase 6: Content Generation Tab ── */}
              {activeTab === 'content-gen' && (
                <ContentGenerationTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  generationJobs={genData.generationJobs}
                  contentItems={genData.contentItems}
                  onUpdate={handleGenerationUpdate}
                  onGenerate={handleGenerationCreate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  initialBriefId={genNavBriefId}
                  onNavigateToApprovals={handleNavigateToApprovals}
                  submittableItemIds={submittableItemIds}
                />
              )}

              {/* ── Phase 7: Content Calendar Tab ── */}
              {activeTab === 'content-calendar' && (
                <ContentCalendarTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  generationJobs={genData.generationJobs}
                  contentItems={genData.contentItems}
                  onUpdate={handleGenerationUpdate}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  approvalRequests={approvalData.approvalRequests}
                  onNavigateToApprovals={handleNavigateToApprovals}
                />
              )}

              {/* ── Phase 8: Approvals Tab ── */}
              {activeTab === 'approvals' && (
                <ApprovalsTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  contentItems={genData.contentItems}
                  approvalData={approvalData}
                  onSubmit={handleApprovalSubmit}
                  onAction={handleApprovalAction}
                  onComment={handleApprovalComment}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Phase 9: Client Portal Tab ── */}
              {activeTab === 'client-view' && (
                <ClientViewTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  contentItems={genData.contentItems}
                  approvalData={approvalData}
                  onComment={handleApprovalComment}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Phase 10: Asset Library Tab ── */}
              {activeTab === 'asset-library' && (
                <AssetLibraryTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  assetData={assetData}
                  onAssetCreate={handleAssetCreate}
                  onAssetEdit={handleAssetEdit}
                  onAssetArchive={handleAssetArchive}
                  userRole={user?.role ?? null}
                  actorLabel={actorLabel}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Phase 11: Reports Tab ── */}
              {activeTab === 'reports' && (
                <ReportsTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  genData={genData}
                  approvalData={approvalData}
                  assetData={assetData}
                  userRole={user?.role ?? null}
                  actorLabel={actorLabel}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Phase 12: Export Pack Tab ── */}
              {activeTab === 'export-pack' && (
                <ExportPackTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  genData={genData}
                  approvalData={approvalData}
                  assetData={assetData}
                  userRole={user?.role ?? null}
                  actorLabel={actorLabel}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Phase 13: Connector Registry Tab ── */}
              {activeTab === 'connector-registry' && (
                <ConnectorRegistryTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  userRole={user?.role ?? null}
                  actorLabel={actorLabel}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* ── Internal Automation Factory Tab ── */}
              {activeTab === 'automation-factory' && (
                <AutomationFactoryTab
                  clients={coreData.clients}
                  brands={coreData.brands}
                  campaigns={coreData.campaigns}
                  briefs={coreData.briefs}
                  generationJobs={genData.generationJobs}
                  contentItems={genData.contentItems}
                  approvalRequests={approvalData.approvalRequests}
                  assetCount={assetData.assets.length}
                  reportCount={genData.generationJobs.length}
                  userRole={user?.role ?? null}
                  isSupabaseConfigured={isSupabaseConfigured}
                  onGenerateContentPack={handleContentFactoryGenerate}
                  onGenerateDesignBriefs={handleDesignFactoryGenerate}
                  onGenerateVideoScripts={handleVideoFactoryGenerate}
                  actorLabel={actorLabel}
                />
              )}
              {/* ── Phase 14: Automation Logs Tab ── */}
              {activeTab === 'automation-logs' && (
                <AutomationLogsTab
                  logData={logData}
                  onLogUpdate={handleLogUpdate}
                  userRole={user?.role ?? null}
                  actorLabel={actorLabel}
                  isSupabaseConfigured={isSupabaseConfigured}
                />
              )}

              {/* 1. DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* ── View Mode Context Card — Phase H.7 ── */}
                  {viewMode === 'owner' ? (
                    <div style={{ padding: '14px 18px', background: 'rgba(244, 122, 31,0.06)', border: '1px solid rgba(244, 122, 31,0.25)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔧</span>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fb923c' }}>Owner View — Internal Workspace</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Control clients, brands, campaigns, briefs, AI outputs, approvals, assets, and reports. Owner approval is required before any output is used.</p>
                        </div>
                      </div>
                      <button onClick={() => handleViewModeSwitch('client')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', background: 'rgba(16,185,129,0.08)', color: '#34d399' }}>
                        <Eye size={13} /> Switch to Client View
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>👁</span>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399' }}>Client View — Campaign Presentation</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Present campaign plan and outputs to your client. Internal tools hidden. Sample data — approval required before export.</p>
                        </div>
                      </div>
                      <button onClick={() => handleViewModeSwitch('owner')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(244, 122, 31,0.3)', cursor: 'pointer', background: 'rgba(244, 122, 31,0.08)', color: '#fb923c' }}>
                        🔧 Back to Owner View
                      </button>
                    </div>
                  )}

                  {viewMode === 'owner' && (
                    <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid #fb923c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '5px' }}>The Core Agency — Internal OS</h2>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Daily-use control center for FnB client work. AI and automation can draft, but Owner approval decides what is usable.
                          </p>
                        </div>
                        <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Approval-first</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                        {[
                          { label: 'Clients', value: coreData.clients.length, tab: 'clients', note: 'Accounts and relationships' },
                          { label: 'Brands', value: coreData.brands.length, tab: 'brands', note: 'FnB brand profiles' },
                          { label: 'Campaigns', value: coreData.campaigns.length, tab: 'campaigns', note: 'Active marketing work' },
                          { label: 'Briefs', value: coreData.briefs.length, tab: 'brief-intake', note: 'Owner-reviewed inputs' },
                          { label: 'Automation Factory', value: genData.generationJobs.length, tab: 'automation-factory', note: getContentFactoryWebhookUrl() !== null ? 'n8n AI provider · approval-first' : 'Local fallback mode · approval-first' },
                          { label: 'Approval Board', value: approvalData.approvalRequests.length, tab: 'approvals', note: 'Human sign-off queue' },
                          { label: 'Asset Library', value: assetData.assets.length, tab: 'asset-library', note: 'Creative assets' },
                          { label: 'Reports', value: genData.generationJobs.length, tab: 'reports', note: 'Draft reporting workspace' },
                        ].map(section => (
                          <button
                            key={section.label}
                            className="btn btn-secondary"
                            onClick={() => setActiveTab(section.tab)}
                            style={{ height: 'auto', alignItems: 'flex-start', flexDirection: 'column', gap: '5px', padding: '14px', borderRadius: '8px', textAlign: 'left' }}
                          >
                            <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '8px', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.86rem' }}>{section.label}</strong>
                              <span style={{ color: '#fb923c', fontWeight: 700, fontSize: '0.9rem' }}>{section.value}</span>
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{section.note}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* ── Brand Switcher — Phase H.5 ── */}
                  <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-indigo)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-indigo)', margin: 0 }}>
                          Brand Workspace
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Select a brand to load its campaign workspace. All data is sample/seed data.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className="badge badge-brand" style={{ fontSize: '0.68rem', background: 'rgba(244, 122, 31,0.12)', color: '#fb923c', border: '1px solid rgba(244, 122, 31,0.3)' }}>
                          {campaigns.length} Brand{campaigns.length !== 1 ? 's' : ''}
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                          Sandbox Safe Mode
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                      {campaigns.slice(0, 6).map((c) => {
                        const isActive = c.id === activeCampaignId;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setActiveCampaignId(c.id)}
                            style={{
                              background: isActive ? 'rgba(244, 122, 31,0.1)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${isActive ? 'rgba(244, 122, 31,0.5)' : 'var(--border-color)'}`,
                              borderRadius: '10px',
                              padding: '12px 14px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(244, 122, 31,0.06)'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isActive ? '#fb923c' : 'var(--text-primary)' }}>
                                {c.brief.brandName}
                              </span>
                              {isActive && (
                                <span className="badge badge-brand" style={{ fontSize: '0.6rem', background: 'rgba(244, 122, 31,0.2)', color: '#fb923c', border: '1px solid rgba(244, 122, 31,0.4)', padding: '2px 6px' }}>
                                  Active
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                              {c.brief.industry.split('/')[0].trim()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              {c.brief.heroProduct}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                      * Sample data only. No real connectors. Approve all outputs manually before any external use.
                    </p>
                  </div>

                  {/* Top quick stats cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Môi trường hệ thống</p>
                        <h3 style={{ fontSize: '1.6rem', marginTop: '8px', color: 'var(--accent-indigo)' }}>OFFLINE</h3>
                      </div>
                      <div className="badge badge-emerald">Mô Phỏng An Toàn</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Campaigns hiện tại</p>
                        <h3 style={{ fontSize: '1.6rem', marginTop: '8px' }}>{campaigns.length} Chiến dịch</h3>
                      </div>
                      <div className="badge badge-blue">Sample Data</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trạng thái Chiến dịch này</p>
                        <h3 style={{ fontSize: '1.6rem', marginTop: '8px' }}>
                          {activeCampaign.status === 'Approved' && <span style={{ color: 'var(--accent-emerald)' }}>APPROVED</span>}
                          {activeCampaign.status === 'Rejected' && <span style={{ color: 'var(--accent-rose)' }}>REJECTED</span>}
                          {activeCampaign.status === 'Needs Review' && <span style={{ color: 'var(--accent-amber)' }}>NEEDS REVIEW</span>}
                        </h3>
                      </div>
                      <div className={`badge ${
                        activeCampaign.status === 'Approved' ? 'badge-emerald' : 
                        activeCampaign.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                      }`}>
                        {activeCampaign.status}
                      </div>
                    </div>
                  </div>

                  {/* Active Campaigns Table */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '1.25rem' }}>Danh sách Campaign Workspace</h2>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                          onClick={() => {
                            localStorage.removeItem('campaigns');
                            localStorage.removeItem('activeCampaignId');
                            localStorage.removeItem('claude_marketing_team_campaigns_v3');
                            localStorage.removeItem('claude_marketing_team_active_campaign_v3');
                            setCampaigns(sampleCampaigns);
                            setActiveCampaignId(sampleCampaigns[0].id);
                          }}
                        >
                          Reset Default
                        </button>
                        <button className="btn btn-primary" onClick={() => setActiveTab('new-campaign')}>
                          <Plus size={16} /> New Campaign
                        </button>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          <th style={{ padding: '12px' }}>Tên thương hiệu</th>
                          <th style={{ padding: '12px' }}>Sản phẩm chính</th>
                          <th style={{ padding: '12px' }}>Thời gian</th>
                          <th style={{ padding: '12px' }}>Trạng thái</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }} className="table-row">
                            <td style={{ padding: '16px 12px', fontWeight: 600 }}>{c.brief.brandName}</td>
                            <td style={{ padding: '16px 12px' }}>{c.brief.heroProduct}</td>
                            <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{c.brief.duration}</td>
                            <td style={{ padding: '16px 12px' }}>
                              <span className={`badge ${
                                c.status === 'Approved' ? 'badge-emerald' : 
                                c.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  setActiveCampaignId(c.id);
                                  setActiveTab('outputs');
                                }}
                              >
                                Xem Outputs <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Safety Guard Panel */}
                  <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-emerald)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🛡️ Safety Guard & Simulation Status
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Hệ thống đang chạy trong chế độ Sandbox mô phỏng biệt lập. Cam kết bảo mật và ranh giới an toàn:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Auto-post:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Real Ads:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Real Messaging:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Real Connectors:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>Secrets Added:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.85rem' }}>Sample Data Only:</span>
                        <span className="badge badge-emerald" style={{ fontWeight: 'bold' }}>YES</span>
                      </div>
                    </div>
                  </div>

                  {/* How to Use This Workspace — Phase H.6 Owner/Client Guide */}
                  <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-emerald)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📖 How to Use This Workspace
                      </h3>
                      <span className="badge badge-emerald" style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>Owner / Client Guide</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      6-step guide for brand owners and clients — from choosing a brand to exporting your campaign pack.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                      {[
                        { step: '1', icon: '🏪', label: 'Choose Brand', desc: 'Select a brand from the Brand Workspace tab or the sidebar dropdown. Each brand has its own campaign workspace.', tab: 'brand-gallery' },
                        { step: '2', icon: '📋', label: 'Review Campaign Plan', desc: 'Open Dashboard → view the active campaign brief, 7-day calendar, and campaign strategy summary.', tab: 'dashboard' },
                        { step: '3', icon: '📦', label: 'Review AI Team Outputs', desc: 'Go to Campaign Outputs → review Captions, Video Scripts, Design Prompts, Ads Plan from each AI agent.', tab: 'outputs' },
                        { step: '4', icon: '✅', label: 'Approve or Request Edits', desc: 'Open Approval Checklist → review 10-point checklist. Mark Approved or add notes for revision before anything is used.', tab: 'approval' },
                        { step: '5', icon: '📤', label: 'Export / Present Pack', desc: 'Go to Manual Export Pack → copy the full campaign pack, client summary, editor handoff, or designer handoff.', tab: 'manual-export' },
                        { step: '6', icon: '🔜', label: 'Real Connectors: Phase I Only', desc: 'This workspace is fully offline. Real social media connectors, auto-scheduling, and API integrations are planned for Phase I.', tab: 'brand-gallery' },
                      ].map((item) => (
                        <button
                          key={item.step}
                          onClick={() => setActiveTab(item.tab)}
                          style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.03)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--accent-emerald)', color: '#fff', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>{item.step}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.icon} {item.label}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{item.desc}</p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Bấm để chuyển →</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Presenter Walkthrough Guide */}
                  <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--accent-indigo)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🎯 Presenter Walkthrough Guide
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Hướng dẫn 5 bước walkthrough nhanh cho khách hàng — dưới 5 phút, không cần chuẩn bị trước.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                      {[
                        { step: '1', icon: '📋', label: 'Dashboard', desc: 'Giới thiệu tổng quan: hệ thống chạy offline, an toàn — không auto-post, không real ads.', tab: 'dashboard' },
                        { step: '2', icon: '✍️', label: 'New Campaign Brief', desc: 'Điền brief thương hiệu của khách → bấm "Kích hoạt AI" → xem AI team chạy sinh output trong 3 phút.', tab: 'new-campaign' },
                        { step: '3', icon: '📦', label: 'Campaign Outputs', desc: 'Mở từng tab: Captions, Video Scripts, Design Prompts, Ads Plan — show toàn bộ gói sáng tạo AI tạo ra.', tab: 'outputs' },
                        { step: '4', icon: '🖥️', label: 'Client Workspace View', desc: 'Góc nhìn khách hàng: problem/solution, approval flow, value prop, before/after comparison.', tab: 'client-demo' },
                        { step: '5', icon: '📤', label: 'Manual Export Pack', desc: 'Xuất file gửi khách thủ công — Client Summary, Editor Handoff, Designer Handoff, Approval Checklist.', tab: 'manual-export' },
                      ].map((item) => (
                        <button
                          key={item.step}
                          onClick={() => setActiveTab(item.tab)}
                          style={{ background: 'rgba(244, 122, 31, 0.04)', border: '1px solid rgba(244, 122, 31, 0.2)', borderRadius: '10px', padding: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244, 122, 31, 0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(244, 122, 31, 0.04)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 'bold', flexShrink: 0 }}>{item.step}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.icon} {item.label}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{item.desc}</p>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>Bấm để chuyển →</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* 2. CAMPAIGN BRIEF FORM TAB */}
              {activeTab === 'new-campaign' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Tạo Brief Chiến Dịch Mới</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Nhập thông tin chiến dịch của bạn vào biểu mẫu bên dưới. Đội ngũ AI Agent Marketing sẽ tự động phân tích và tạo outputs.
                    </p>
                  </div>

                  <form onSubmit={handleBriefSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      
                      <div className="form-group">
                        <label className="form-label">Tên thương hiệu</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: Vị Cuốn" 
                          value={briefForm.brandName}
                          onChange={(e) => setBriefForm({...briefForm, brandName: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ngành hàng kinh doanh</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: F&B / món cuốn / street food premium tại TP Vinh" 
                          value={briefForm.industry}
                          onChange={(e) => setBriefForm({...briefForm, industry: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sản phẩm / Dịch vụ chính</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: Bánh tráng cuốn heo quay" 
                          value={briefForm.heroProduct}
                          onChange={(e) => setBriefForm({...briefForm, heroProduct: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Giá bán sản phẩm</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: [OWNER CUNG CẤP]" 
                          value={briefForm.pricing}
                          onChange={(e) => setBriefForm({...briefForm, pricing: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Khách hàng mục tiêu</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: Nhân viên văn phòng, sinh viên, gia đình trẻ tại Vinh" 
                          value={briefForm.targetCustomer}
                          onChange={(e) => setBriefForm({...briefForm, targetCustomer: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Khu vực phân phối</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: TP. Vinh, Nghệ An" 
                          value={briefForm.location}
                          onChange={(e) => setBriefForm({...briefForm, location: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mục tiêu chiến dịch (Goal)</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: Tăng nhận diện thương hiệu Bánh tráng cuốn heo quay và kéo đơn trưa/tối" 
                          value={briefForm.goal}
                          onChange={(e) => setBriefForm({...briefForm, goal: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ưu đãi / Chương trình khuyến mãi (Offer)</label>
                        <input 
                          type="text" 
                          required 
                          className="form-control" 
                          placeholder="Ví dụ: [OWNER CUNG CẤP]" 
                          value={briefForm.offer}
                          onChange={(e) => setBriefForm({...briefForm, offer: e.target.value})}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Tone giọng thương hiệu (Tone of Voice)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Ví dụ: Gần gũi, ngon miệng, thực tế, mang chất địa phương Vinh" 
                          value={briefForm.toneOfVoice}
                          onChange={(e) => setBriefForm({...briefForm, toneOfVoice: e.target.value})}
                        />
                      </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>Hủy bỏ</button>
                      <button type="submit" className="btn btn-primary">
                        <Play size={16} /> Kích hoạt AI Agent Team
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 3. AI TEAM BOARD TAB */}
              {activeTab === 'team-board' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>AI Team Board</h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mô hình phối hợp công việc của 5 AI Agent trong dự án.</p>
                    </div>
                    <div className="badge badge-emerald">Toàn Bộ Sẵn Sàng</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    {/* Role 1: Copywriter */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-blue">Copywriter</span>
                        <span className="badge badge-emerald">Done</span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem' }}>Sáng tạo nội dung chữ</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Viết caption mạng xã hội chuẩn tone giọng, kịch bản thô và ctas kêu gọi hành động.
                      </p>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👉 Output: 7 captions, 7 hooks, ctas
                      </div>
                    </div>

                    {/* Role 2: Video Editor */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-blue">Video Editor</span>
                        <span className="badge badge-emerald">Done</span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem' }}>Lập kịch bản phân cảnh</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Soạn kịch bản chi tiết cho Reels/TikTok gồm hình ảnh, âm thanh lồng tiếng và góc máy quay.
                      </p>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👉 Output: 7 scripts TikTok/Reels
                      </div>
                    </div>

                    {/* Role 3: Designer */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-blue">Designer</span>
                        <span className="badge badge-emerald">Done</span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem' }}>Ý tưởng Visual & Prompts AI</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Mô tả bố cục ảnh, style, moodboard và viết prompts tiếng Anh chuẩn để tạo ảnh qua Fal.ai.
                      </p>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👉 Output: 7 prompts tiếng Anh chuẩn
                      </div>
                    </div>

                    {/* Role 4: Ads Manager */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-blue">Ads Manager</span>
                        <span className="badge badge-emerald">Done</span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem' }}>Phân bổ Ads giả lập</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Lập kế hoạch ads angle, nhắm target vị trí địa lý Vinh và thiết lập cấu trúc nhóm A/B test.
                      </p>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👉 Output: Target map, ad sets plan
                      </div>
                    </div>

                    {/* Role 5: Data Reporter */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-blue">Data Reporter</span>
                        <span className="badge badge-emerald">Done</span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem' }}>Báo cáo dữ liệu mô phỏng</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Đọc log tương tác ads giả định, tính toán các chỉ số CTR, CPC, CPA và đề xuất tối ưu.
                      </p>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        👉 Output: Báo cáo hiệu quả + Đề xuất
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 4. CAMPAIGN OUTPUT TAB */}
              {activeTab === 'outputs' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  
                  {/* Campaign context bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>{activeCampaign.name}</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Brand: <strong style={{color: 'var(--text-primary)'}}>{activeCampaign.brief.brandName}</strong> | HERO Product: <strong style={{color: 'var(--text-primary)'}}>{activeCampaign.brief.heroProduct}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-brand" style={{ background: 'rgba(244, 122, 31, 0.15)', color: '#fb923c', borderColor: 'rgba(244, 122, 31, 0.3)', border: '1px solid' }}>Sample Data Only</span>
                      <span className="badge badge-emerald" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)', border: '1px solid' }}>🛡️ Safety Guard</span>
                      <span className={`badge ${
                        activeCampaign.status === 'Approved' ? 'badge-emerald' : 
                        activeCampaign.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                      }`}>
                        {activeCampaign.status}
                      </span>
                    </div>
                  </div>

                  {/* Sub-tabs selection */}
                  <div className="tabs-header">
                    <button className={`tab-btn ${outputSubTab === 'calendar' ? 'active' : ''}`} onClick={() => setOutputSubTab('calendar')}>7-Day Content Plan</button>
                    <button className={`tab-btn ${outputSubTab === 'copy' ? 'active' : ''}`} onClick={() => setOutputSubTab('copy')}>Copywriting</button>
                    <button className={`tab-btn ${outputSubTab === 'video' ? 'active' : ''}`} onClick={() => setOutputSubTab('video')}>Video Scripts</button>
                    <button className={`tab-btn ${outputSubTab === 'design' ? 'active' : ''}`} onClick={() => setOutputSubTab('design')}>Designs & Prompts</button>
                    <button className={`tab-btn ${outputSubTab === 'ads' ? 'active' : ''}`} onClick={() => setOutputSubTab('ads')}>Ads Manager Plan</button>
                    <button className={`tab-btn ${outputSubTab === 'report' ? 'active' : ''}`} onClick={() => setOutputSubTab('report')}>Simulated Report</button>
                    <button className={`tab-btn ${outputSubTab === 'final' ? 'active' : ''}`} onClick={() => setOutputSubTab('final')}>Final Pack</button>
                  </div>

                  {/* SUB TAB CONTENTS */}
                  
                  {/* 7-Day Plan tab */}
                  {outputSubTab === 'calendar' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Lịch trình Phân Phối 7 Ngày (Final Calendar):</h4>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => {
                            const calMarkdown = `| Ngày | Chủ đề (Theme) | Kênh | Nội dung chính | Visual gợi ý | CTA | Approval needed |\n` +
                              `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
                              (activeCampaign.calendar?.map((item) => 
                                `| **${item.day}** | ${item.theme} | ${item.channel} | ${item.content} | ${item.visual} | ${item.cta} | ${item.approval} |`
                              ).join('\n') || '');
                            copyToClipboard(calMarkdown, 'calendar');
                          }}
                        >
                          {copiedStates['calendar'] ? <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Copied!</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Copy size={14} /> Copy Content Plan</span>}
                        </button>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              <th style={{ padding: '12px 8px' }}>Ngày</th>
                              <th style={{ padding: '12px 8px' }}>Chủ đề (Theme)</th>
                              <th style={{ padding: '12px 8px' }}>Kênh</th>
                              <th style={{ padding: '12px 8px' }}>Nội dung chính</th>
                              <th style={{ padding: '12px 8px' }}>Visual gợi ý</th>
                              <th style={{ padding: '12px 8px' }}>CTA</th>
                              <th style={{ padding: '12px 8px' }}>Approval Needed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeCampaign.calendar?.map((item: CalendarItem, idx: number) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>{item.day}</td>
                                <td style={{ padding: '12px 8px' }}>{item.theme}</td>
                                <td style={{ padding: '12px 8px' }}>
                                  <span className={`badge ${item.channel.toLowerCase() === 'facebook' ? 'badge-blue' : 'badge-rose'}`}>
                                    {item.channel}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 8px' }}>{item.content}</td>
                                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{item.visual}</td>
                                <td style={{ padding: '12px 8px' }}><code>{item.cta}</code></td>
                                <td style={{ padding: '12px 8px', color: 'var(--accent-amber)' }}>{item.approval}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Copywriting tab */}
                  {outputSubTab === 'copy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Campaign Slogans:</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => copyToClipboard(activeCampaign.outputs.copywriter.slogans.join('\n'), 'slogans')}
                            >
                              {copiedStates['slogans'] ? 'Copied! ✓' : 'Copy All Slogans'}
                            </button>
                          </div>
                          <ul style={{ listStyleType: 'circle', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {activeCampaign.outputs.copywriter.slogans.map((s, idx) => <li key={idx} style={{ lineHeight: 1.4 }}>{s}</li>)}
                          </ul>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Short Captions:</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => copyToClipboard(activeCampaign.outputs.copywriter.shortCaptions.join('\n'), 'short_captions')}
                            >
                              {copiedStates['short_captions'] ? 'Copied! ✓' : 'Copy Short Captions'}
                            </button>
                          </div>
                          <ul style={{ listStyleType: 'circle', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {activeCampaign.outputs.copywriter.shortCaptions.map((sc, idx) => <li key={idx} style={{ lineHeight: 1.4 }}>{sc}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Calls To Action (CTA):</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => copyToClipboard(activeCampaign.outputs.copywriter.ctas.join('\n'), 'ctas')}
                            >
                              {copiedStates['ctas'] ? 'Copied! ✓' : 'Copy CTAs'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {activeCampaign.outputs.copywriter.ctas.map((c, idx) => (
                              <code key={idx} style={{ background: 'rgba(244, 122, 31, 0.1)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(244, 122, 31, 0.2)', fontSize: '0.85rem' }}>{c}</code>
                            ))}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Hashtags:</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => copyToClipboard(activeCampaign.outputs.copywriter.hashtags.join(' '), 'hashtags')}
                            >
                              {copiedStates['hashtags'] ? 'Copied! ✓' : 'Copy Hashtags'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {activeCampaign.outputs.copywriter.hashtags.map((h, idx) => (
                              <span key={idx} className="badge badge-blue" style={{ fontSize: '0.85rem', textTransform: 'lowercase' }}>{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '16px' }}>7 Facebook Captions:</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {activeCampaign.outputs.copywriter.captions.map((cap, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <h5 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{cap.title}</h5>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '4px' }}>Visual suggestion: {cap.visual}</p>
                                </div>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  onClick={() => copyToClipboard(cap.body, `caption_${idx}`)}
                                >
                                  {copiedStates[`caption_${idx}`] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy Caption'}
                                </button>
                              </div>
                              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'inherit', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>{cap.body}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video scripts tab */}
                  {outputSubTab === 'video' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '8px' }}>TikTok/Reels/Shorts Hooks gợi ý:</h4>
                        <ul style={{ listStyleType: 'decimal', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeCampaign.outputs.copywriter.hooks.map((h, idx) => <li key={idx}>{h}</li>)}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '12px' }}>
                        {activeCampaign.outputs.videoEditor.scripts.map((script, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <div>
                                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{script.title}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: '4px' }}><strong>Hook chính:</strong> "{script.hook}"</p>
                              </div>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                onClick={() => {
                                  const scriptText = `${script.title}\nHook: ${script.hook}\n\nKịch bản phân cảnh:\n` +
                                    script.scenes.map(s => `[${s.scene}]\n- Hình ảnh: ${s.visual}\n- Âm thanh: ${s.audio}\n- Góc quay: ${s.note}\n- Chữ đè (Overlay): ${s.textOverlay}`).join('\n\n');
                                  copyToClipboard(scriptText, `video_${idx}`);
                                }}
                              >
                                {copiedStates[`video_${idx}`] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy Video Script'}
                              </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {script.scenes.map((scene, sIdx) => (
                                <div key={sIdx} style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-indigo)', fontSize: '0.9rem' }}>{scene.scene}</span>
                                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{scene.note}</span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <div><strong>Visual:</strong> {scene.visual}</div>
                                    <div><strong>Audio:</strong> {scene.audio}</div>
                                  </div>
                                  {scene.textOverlay && (
                                    <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                                      <strong>Text Overlay:</strong> "{scene.textOverlay}"
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Design briefs tab */}
                  {outputSubTab === 'design' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {activeCampaign.outputs.designer.briefs.map((brief, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{brief.title}</h4>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => {
                                const briefText = `${brief.title}\nLayout: ${brief.layout}\nVisual Direction: ${brief.visualDirection}\nColor & Style Note: ${brief.colorStyleNote}\nText Overlay: ${brief.textOverlay}\nAI Image Prompt: ${brief.prompt}`;
                                copyToClipboard(briefText, `design_${idx}`);
                              }}
                            >
                              {copiedStates[`design_${idx}`] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy Design Brief'}
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            <p><strong>Bố cục (Layout):</strong> {brief.layout}</p>
                            <p><strong>Visual Direction (Chi tiết bố cục):</strong> {brief.visualDirection}</p>
                            <p><strong>Ghi chú màu sắc / Mood note:</strong> {brief.colorStyleNote}</p>
                            <p><strong>Text Overlay:</strong> <code style={{ color: 'var(--text-primary)' }}>{brief.textOverlay}</code></p>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ width: '80%' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase' }}>AI Design Prompt:</p>
                              <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '6px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{brief.prompt}</p>
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => copyToClipboard(brief.prompt, `prompt_${idx}`)}
                            >
                              {copiedStates[`prompt_${idx}`] ? 'Copied!' : 'Copy Prompt'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ads manager tab */}
                  {outputSubTab === 'ads' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>5 Góc tiếp cận quảng cáo (Ads Angles):</h4>
                        <ul style={{ listStyleType: 'decimal', paddingLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeCampaign.outputs.adsManager.angles.map((a, idx) => <li key={idx}>{a}</li>)}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Phân bổ nhóm Target giả lập (Ad Sets Map):</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                          {activeCampaign.outputs.adsManager.adSets.map((ad, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <h5 style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>{ad.name}</h5>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Ngân sách mô phỏng:</strong> {ad.budget}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Target:</strong> {ad.targeting}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Định dạng quảng cáo:</strong> {ad.format}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '12px' }}>Bản nháp mẫu thiết lập Ads (Sample Ad Units):</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {activeCampaign.outputs.adsManager.mockAds?.map((ad, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h5 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ad.name}</h5>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Angle: {ad.angle}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span className="badge badge-rose" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.2)' }}>⚠️ DRAFT ONLY - NOT LAUNCHED</span>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    onClick={() => {
                                      const adText = `Ad Unit: ${ad.name}\nPrimary Text: ${ad.primaryText}\nHeadline: ${ad.headline}\nDescription: ${ad.description}\nCTA: ${ad.cta}`;
                                      copyToClipboard(adText, `ad_copy_${idx}`);
                                    }}
                                  >
                                    {copiedStates[`ad_copy_${idx}`] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy Ads Copy'}
                                  </button>
                                </div>
                              </div>

                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ad.primaryText}</pre>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ad.headline}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ad.description}</div>
                                  </div>
                                  <span className="badge badge-blue" style={{ padding: '6px 12px', borderRadius: '4px' }}>{ad.cta}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simulated reports tab */}
                  {outputSubTab === 'report' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>🔒 SIMULATED DATA ONLY - DỮ LIỆU MÔ PHỎNG DỰ TOÁN</div>
                      
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '8px' }}>Giả định chỉ số KPI mô phỏng (Simulated Assumptions):</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {activeCampaign.outputs.dataReporter.kpiAssumptions?.map((kpi, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{kpi.metric}:</strong>
                              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{kpi.assumption}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <th style={{ padding: '8px' }}>Chỉ số đo lường</th>
                            <th style={{ padding: '8px' }}>KPI Target</th>
                            <th style={{ padding: '8px' }}>Thực tế mô phỏng</th>
                            <th style={{ padding: '8px' }}>Tỷ lệ hoàn thành</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeCampaign.outputs.dataReporter.metrics.map((m, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                              <td style={{ padding: '12px 8px', fontWeight: 600 }}>{m.name}</td>
                              <td style={{ padding: '12px 8px' }}>{m.target}</td>
                              <td style={{ padding: '12px 8px', color: 'var(--accent-emerald)' }}>{m.actual}</td>
                              <td style={{ padding: '12px 8px' }}>{m.completion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Đề xuất tối ưu hóa cho tuần sau:</h4>
                        <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeCampaign.outputs.dataReporter.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Mẫu Báo Cáo Tuần (Weekly Report Template):</h4>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => copyToClipboard(activeCampaign.outputs.dataReporter.reportTemplate, 'weekly_report')}
                          >
                            {copiedStates['weekly_report'] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy Weekly Report'}
                          </button>
                        </div>
                        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{activeCampaign.outputs.dataReporter.reportTemplate}</pre>
                      </div>
                    </div>
                  )}

                  {/* Final pack tab */}
                  {outputSubTab === 'final' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ background: 'rgba(244, 122, 31,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--accent-indigo)' }}>Gói Chiến Dịch Đóng Gói (Final Campaign Pack)</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Đây là sản phẩm đã được AI Coordinator tổng hợp sạch đẹp từ tất cả các Agent, sẵn sàng đưa vào phê duyệt hoặc copy-paste để đăng tải thực tế.
                          </p>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            const summaryText = `--- CHIẾN DỊCH: ${activeCampaign.name} ---\n` +
                              `Thương hiệu: ${activeCampaign.brief.brandName}\n` +
                              `Sản phẩm cốt lõi: ${activeCampaign.brief.heroProduct}\n\n` +
                              `1. SLOGANS CHÍNH:\n` +
                              activeCampaign.outputs.copywriter.slogans.map(s => `- ${s}`).join('\n') + `\n\n` +
                              `2. BÀI VIẾT NỔI BẬT (Facebook):\n` +
                              activeCampaign.outputs.copywriter.captions[0].body + `\n\n` +
                              `3. KỊCH BẢN VIDEO HẤP DẪN (15s):\n` +
                              `Hook: ${activeCampaign.outputs.videoEditor.scripts[0].hook}\n` +
                              `Scenes:\n` +
                              activeCampaign.outputs.videoEditor.scripts[0].scenes.map(s => `- ${s.scene}: ${s.visual} [Overlay: ${s.textOverlay}]`).join('\n') + `\n\n` +
                              `4. MÔ TẢ HÌNH ẢNH DESIGN PROMPT:\n` +
                              `- Ý tưởng: ${activeCampaign.outputs.designer.briefs[0].layout}\n` +
                              `- Prompt: ${activeCampaign.outputs.designer.briefs[0].prompt}\n\n` +
                              `Disclaimer: Toàn bộ dữ liệu hiệu năng giả lập chỉ sử dụng cho mục đích minh họa sandbox.`;
                            copyToClipboard(summaryText, 'client_summary');
                          }}
                        >
                          {copiedStates['client_summary'] ? 'Copied! ✓' : 'Copy Client Summary'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong>1. Slogans:</strong> "{activeCampaign.outputs.copywriter.slogans[0]}"
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong>2. Bài viết chính (Facebook):</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px' }}>{activeCampaign.outputs.copywriter.captions[0].body}</pre>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong>3. Prompt ảnh AI:</strong> <code style={{ fontSize: '0.8rem', color: 'var(--accent-blue)' }}>{activeCampaign.outputs.designer.briefs[0].prompt}</code>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* 5. APPROVAL CHECKLIST TAB */}
              {activeTab === 'approval' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  
                  {/* Campaign context bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Kiểm Duyệt Chiến Dịch Thủ Công</h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Với vai trò là Chủ thương hiệu (Owner), bạn có quyền duyệt hoặc từ chối gói sản phẩm marketing dưới đây.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-brand" style={{ background: 'rgba(244, 122, 31, 0.15)', color: '#fb923c', borderColor: 'rgba(244, 122, 31, 0.3)', border: '1px solid' }}>Human Approval Required</span>
                    </div>
                  </div>

                  {/* Checklist progress bar */}
                  {(() => {
                    const checkedCount = activeCampaign.checklist?.filter(c => c.checked).length || 0;
                    const totalCount = activeCampaign.checklist?.length || 0;
                    const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                    return (
                      <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tiến độ kiểm duyệt an toàn:</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: percentage === 100 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{checkedCount} / {totalCount} ({percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', background: percentage === 100 ? 'linear-gradient(90deg, var(--accent-emerald), #059669)' : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-blue))', transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Human Approval Checklist */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📋 Owner Review & Human Approval Checklist
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Vui lòng tích chọn phê duyệt từng tiêu chí dưới đây trước khi tiến hành triển khai thủ công ngoài thực tế:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeCampaign.checklist?.map((item: ChecklistItem) => (
                        <label 
                          key={item.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '12px', 
                            cursor: 'pointer', 
                            padding: '12px', 
                            background: item.checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)', 
                            borderRadius: '8px', 
                            border: '1px solid', 
                            borderColor: item.checked ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={item.checked} 
                            onChange={() => toggleChecklistItem(activeCampaign.id, item.id)}
                            style={{ marginTop: '3px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Quyết định phê duyệt:</h3>
                    
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                      <button 
                        className="btn" 
                        style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', gap: '8px' }}
                        onClick={() => updateCampaignStatus('Approved')}
                      >
                        <Check size={18} /> Phê Duyệt (APPROVED)
                      </button>

                      <button 
                        className="btn" 
                        style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', gap: '8px' }}
                        onClick={() => updateCampaignStatus('Rejected')}
                      >
                        <X size={18} /> Từ Chối & Yêu Cầu Sửa (REJECTED)
                      </button>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Trạng thái hiện tại: 
                        <span className={`badge ${
                          activeCampaign.status === 'Approved' ? 'badge-emerald' : 
                          activeCampaign.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                        }`} style={{ marginLeft: '8px' }}>
                          {activeCampaign.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Review rules help alert */}
                  <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(244, 122, 31, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                    <AlertCircle style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>
                      <strong>Lời khuyên khi duyệt:</strong> Đảm bảo thông tin về <em>{activeCampaign.brief.heroProduct}</em> đã khớp với định vị thương hiệu của <em>{activeCampaign.brief.brandName}</em>. Hãy copy prompt hình ảnh mang sang Canva/Fal.ai để tự thiết kế nếu bạn đã duyệt nội dung.
                    </div>
                  </div>

                </div>
              )}

              {/* 6. CLIENT DEMO PACK TAB */}
              {activeTab === 'demo-pack' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  
                  {/* Campaign context bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Client Presentation Pack</h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Tài liệu giới thiệu giải pháp AI Marketing Team cho đối tác & khách hàng doanh nghiệp.
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const pitchText = `--- PITCH GIỚI THIỆU AI MARKETING TEAM ---\n` +
                          `Thương hiệu: ${activeCampaign.brief.brandName} — Sản phẩm: ${activeCampaign.brief.heroProduct}\n\n` +
                          `Chào đối tác,\n` +
                          `AI Marketing Team đã xây dựng trọn gói chiến dịch tích hợp 7 ngày cho thương hiệu ${activeCampaign.brief.brandName}:\n` +
                          `- Lên lịch trình phân phối 7 ngày đa kênh (Facebook, TikTok).\n` +
                          `- Soạn thảo 7 bài viết Caption Facebook chuẩn tone giọng Premium Street Food.\n` +
                          `- Lên 3 kịch bản video dọc ASMR 15s chi tiết phân cảnh và âm thanh.\n` +
                          `- Viết 3 prompt thiết kế ảnh AI chuyên nghiệp độ phân giải cao.\n` +
                          `- Cấu hình tệp quảng cáo địa phương và target khách hàng tại Vinh.\n` +
                          `- Báo cáo hiệu quả giả lập hỗ trợ Owner đưa ra quyết định.\n\n` +
                          `Ranh giới an toàn: Hệ thống chạy hoàn toàn ở chế độ Offline Sandbox (Auto-post: NO, Real Ads: NO, Real Message: NO).\n` +
                          `Quy trình phê duyệt (Owner Review) là bắt buộc trước khi lấy nội dung chạy thực tế.\n\n` +
                          `Trân trọng,\n` +
                          `Đội ngũ The Core Agency`;
                        copyToClipboard(pitchText, 'pitch_summary');
                      }}
                    >
                      {copiedStates['pitch_summary'] ? 'Copied Pitch!' : <><Copy size={16} /> Copy Presentation Pitch</>}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* What AI Created */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-indigo)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={18} /> Kết quả AI Team đã thiết lập
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Copywriter Agent:</strong>
                            <p style={{ marginTop: '4px' }}>3 Slogans chiến dịch, 7 bài viết Facebook hoàn chỉnh, danh sách hashtags và ctas.</p>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Video Editor Agent:</strong>
                            <p style={{ marginTop: '4px' }}>3 kịch bản dọc 15s (Reels/TikTok) chi tiết phân cảnh, hiệu ứng ASMR và góc máy.</p>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Designer Agent:</strong>
                            <p style={{ marginTop: '4px' }}>3 brief thiết kế hình ảnh chi tiết kèm 3 prompt thiết kế AI chuyên nghiệp.</p>
                          </div>
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Ads Manager & Data Reporter:</strong>
                            <p style={{ marginTop: '4px' }}>Target địa phương TP Vinh, cấu hình 2 Ad sets, bản nháp ad copy và báo cáo mô phỏng.</p>
                          </div>
                        </div>
                      </div>

                      {/* Suggested Next Actions */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-indigo)', marginBottom: '14px' }}>💡 Đề xuất hành động tiếp theo</h3>
                        <ol style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.4 }}>
                          <li><strong>Duyệt checklist 10 điểm:</strong> Chuyển trạng thái chiến dịch thành APPROVED để kết thúc bước lập kế hoạch.</li>
                          <li><strong>Tạo hình ảnh AI:</strong> Sao chép prompt ở tab Designer sang công cụ Fal.ai hoặc Midjourney để vẽ ảnh.</li>
                          <li><strong>Sản xuất video:</strong> Sử dụng điện thoại quay cảnh cắt thịt heo quay nổ lu tại quán theo đúng kịch bản ASMR.</li>
                          <li><strong>Đăng bài thủ công:</strong> Bổ sung mức giá chính thức của quán và đăng bài lên Facebook Fanpage của Vị Cuốn.</li>
                        </ol>
                      </div>

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* What needs approval */}
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <h4 style={{ color: 'var(--accent-amber)', fontSize: '1rem', fontWeight: 600, marginBottom: '10px' }}>⚠️ Cần duyệt thủ công</h4>
                        <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.3 }}>
                          <li>Owner cung cấp giá bán Suất cuốn heo quay.</li>
                          <li>Owner điền địa chỉ thật & số hotline tại TP Vinh.</li>
                          <li>Quyết định chương trình ưu đãi tuần.</li>
                          <li>Duyệt ngân sách thực tế để tự lên Ads thủ công.</li>
                        </ul>
                      </div>

                      {/* Disclaimer warning */}
                      <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <h4 style={{ color: 'var(--accent-rose)', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shield size={16} /> Disclaimer & Safety
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          Đây là không gian làm việc mô phỏng 100% (Sandbox Safe Mode). Không kết nối mạng, không lưu giữ secret keys, không chạy quảng cáo hay đăng bài tự động để bảo vệ an toàn thương hiệu.
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Service Packages Teaser — Phase H.3 */}
                  <div style={{ marginTop: '8px', padding: '28px', background: 'rgba(244, 122, 31, 0.04)', border: '1px solid rgba(244, 122, 31, 0.2)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: '4px' }}>Gói dịch vụ AI Marketing Team</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Chọn gói phù hợp với quy mô thương hiệu của bạn</p>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>Sample Pricing — Sandbox Mode</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {[
                        {
                          name: 'Starter',
                          tag: 'Dành cho 1 thương hiệu',
                          color: 'var(--accent-blue)',
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                          bg: 'rgba(59, 130, 246, 0.04)',
                          items: ['1 thương hiệu', '1 campaign/tháng', 'Full campaign pack', 'Manual export', 'Owner approval flow'],
                          cta: 'Liên hệ báo giá',
                          highlight: false,
                        },
                        {
                          name: 'Growth',
                          tag: 'Phổ biến nhất',
                          color: 'var(--accent-indigo)',
                          borderColor: 'rgba(244, 122, 31, 0.5)',
                          bg: 'rgba(244, 122, 31, 0.08)',
                          items: ['3 thương hiệu', '4 campaigns/tháng', 'Full campaign pack', 'Client Workspace View', 'Priority support'],
                          cta: 'Liên hệ báo giá',
                          highlight: true,
                        },
                        {
                          name: 'Scale',
                          tag: 'Agency & Enterprise',
                          color: 'var(--accent-emerald)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          bg: 'rgba(16, 185, 129, 0.04)',
                          items: ['Không giới hạn thương hiệu', 'Campaigns không giới hạn', 'White-label workspace', 'Dedicated support', 'Custom onboarding'],
                          cta: 'Liên hệ báo giá',
                          highlight: false,
                        },
                      ].map((pkg, idx) => (
                        <div key={idx} style={{ background: pkg.bg, border: `1px solid ${pkg.borderColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                          {pkg.highlight && (
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-indigo)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                              ⭐ PHỔ BIẾN NHẤT
                            </div>
                          )}
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: pkg.color }}>{pkg.name}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pkg.tag}</p>
                          </div>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {pkg.items.map((item, i) => (
                              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: pkg.color, fontWeight: 700, fontSize: '0.75rem' }}>✓</span> {item}
                              </li>
                            ))}
                          </ul>
                          <button
                            className="btn btn-secondary"
                            style={{ marginTop: 'auto', fontSize: '0.8rem', padding: '8px', border: `1px solid ${pkg.borderColor}`, color: pkg.color }}
                            onClick={() => copyToClipboard(`Liên hệ báo giá gói ${pkg.name} — AI Marketing Team`, `pkg_${idx}`)}
                          >
                            {copiedStates[`pkg_${idx}`] ? '✓ Đã copy!' : pkg.cta}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '14px' }}>
                      * Gói dịch vụ và định giá trên là dữ liệu mẫu — liên hệ trực tiếp để nhận báo giá chính thức.
                    </p>
                  </div>

                </div>
              )}

              {/* 7. MANUAL EXPORT PACK TAB */}
              {activeTab === 'manual-export' && (
                <div className="glass-panel" style={{ padding: '32px' }}>
                  
                  {/* Header & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Manual Export Pack
<span className="badge" style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)', border: '1px solid', borderRadius: '9999px', fontWeight: 600 }}>
                          Production Ready
                        </span>
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Sao chép trực tiếp các gói dữ liệu đã định cấu hình sạch để sử dụng thủ công.
                      </p>
                    </div>
                  </div>

                  {/* Instruction Box */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.85rem', color: '#93c5fd', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                      ℹ️ <strong>Instructions:</strong> Use this pack to manually copy outputs to client, editor, designer, ads setup, and owner approval. This does not auto-post, run ads, or message customers.
                    </p>
                  </div>

                  {/* Recommended Usage Order */}
                  <div style={{ background: 'rgba(244, 122, 31, 0.03)', border: '1px solid rgba(244, 122, 31, 0.15)', padding: '20px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📋 Quy trình khuyên dùng (Recommended usage order):
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                      {[
                        { step: "1", text: "Copy Client Summary", note: "Tóm tắt chiến lược cho khách hàng" },
                        { step: "2", text: "Copy Editor Handoff", note: "Chỉ dẫn kịch bản & dựng video" },
                        { step: "3", text: "Copy Designer Handoff", note: "Mô tả hình ảnh & prompt AI" },
                        { step: "4", text: "Copy Ads Draft Pack", note: "Mẫu quảng cáo & target địa phương" },
                        { step: "5", text: "Copy Approval Checklist", note: "Checklist kiểm soát an toàn" },
                        { step: "6", text: "Copy Full Campaign Pack", note: "Lưu trữ toàn bộ chiến dịch" }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: 'var(--accent-indigo)', color: '#fff', borderRadius: '50%', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                            {item.step}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.text}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Grid of Blocks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {manualExportBlocks.map((block, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{block.title}</h4>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            onClick={() => copyToClipboard(block.content, `manual_${idx}`)}
                          >
                            {copiedStates[`manual_${idx}`] ? <span style={{ color: 'var(--accent-emerald)' }}>Copied! ✓</span> : 'Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{block.description}</p>
                        <textarea
                          readOnly
                          value={block.content}
                          style={{
                            width: '100%',
                            height: '180px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '10px',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                            resize: 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. CLIENT DEMO MODE TAB */}
              {activeTab === 'client-demo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  
                  {/* Title and Header Area */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Client Workspace View
                        <span className="badge badge-brand" style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(244, 122, 31, 0.15)', color: '#fb923c', borderColor: 'rgba(244, 122, 31, 0.3)', border: '1px solid', borderRadius: '9999px', fontWeight: 600 }}>
                          Client-Ready
                        </span>
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Không gian workspace phía khách hàng — bối cảnh chiến dịch, luồng phê duyệt và vai trò đội ngũ AI.
                      </p>
                    </div>
                  </div>

                  {/* Sales Readiness Section — Phase H.3 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {[
                      {
                        icon: '❓',
                        label: 'Vấn đề khách hàng',
                        body: 'SME tốn 10–15h/tuần chỉ để lên kế hoạch content, brief team và duyệt bài — chưa tính thực thi.',
                        color: 'var(--accent-rose)',
                        borderColor: 'rgba(244,63,94,0.25)',
                        bg: 'rgba(244,63,94,0.04)',
                      },
                      {
                        icon: '🤖',
                        label: 'Giải pháp AI Team',
                        body: 'Nhập brief một lần → 5 AI Agents song song tạo full campaign pack: captions, video scripts, design prompts, ads plan.',
                        color: 'var(--accent-indigo)',
                        borderColor: 'rgba(244, 122, 31,0.25)',
                        bg: 'rgba(244, 122, 31,0.04)',
                      },
                      {
                        icon: '📦',
                        label: 'Khách nhận được',
                        body: 'Lịch 7 ngày, 7 Facebook captions, 3 video scripts, 3 design prompts, ads targeting plan + approval checklist.',
                        color: 'var(--accent-blue)',
                        borderColor: 'rgba(59,130,246,0.25)',
                        bg: 'rgba(59,130,246,0.04)',
                      },
                      {
                        icon: '✍️',
                        label: 'Cần duyệt thủ công',
                        body: 'Owner phê duyệt 100% nội dung trước khi ra ngoài. Không một bài đăng, một đồng ads nào chạy mà không có chữ ký Owner.',
                        color: 'var(--accent-amber)',
                        borderColor: 'rgba(245,158,11,0.25)',
                        bg: 'rgba(245,158,11,0.04)',
                      },
                      {
                        icon: '🛡️',
                        label: 'Tại sao an toàn',
                        body: '100% offline sandbox. Không backend, không connector thật, không auto-post. Sample data only. Safety Guard luôn bật.',
                        color: 'var(--accent-emerald)',
                        borderColor: 'rgba(16,185,129,0.25)',
                        bg: 'rgba(16,185,129,0.04)',
                      },
                    ].map((card, idx) => (
                      <div key={idx} style={{ background: card.bg, border: `1px solid ${card.borderColor}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '1.4rem' }}>{card.icon}</div>
                        <strong style={{ fontSize: '0.82rem', color: card.color, lineHeight: 1.3 }}>{card.label}</strong>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{card.body}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Client View
                        </h3>
                      </div>
                      
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>📋 Campaign Overview</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Thương hiệu:</span> <strong style={{ color: '#fff' }}>{activeCampaign.brief.brandName}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Sản phẩm:</span> <strong style={{ color: '#fff' }}>{activeCampaign.brief.heroProduct}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Ngành hàng:</span> <strong style={{ color: 'var(--accent-emerald)' }}>{activeCampaign.brief.industry.split('/')[0].trim()}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Kênh phân phối:</span> <strong style={{ color: 'var(--accent-blue)' }}>{activeCampaign.brief.channels.join(', ')}</strong>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', margin: '4px 0 0 0' }}>
                          {activeCampaign.brief.goal}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>📦 Key Deliverables</strong>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', gap: '6px', textAlign: 'left', margin: 0 }}>
                            <li>7-day content plan</li>
                            <li>Facebook caption pack</li>
                            <li>TikTok/Reels script pack</li>
                            <li>Video editor handoff</li>
                          </ul>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>✔️ What Client Can Approve</strong>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', gap: '6px', textAlign: 'left', margin: 0 }}>
                            <li>Campaign direction</li>
                            <li>Caption tone</li>
                            <li>Video script</li>
                            <li>Design direction</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-amber)' }}>Approval Status Preview</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                        {/* State 1: Draft */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald)', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>✓</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Draft</strong>
                              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Completed</span>
                            </div>
                          </div>
                        </div>

                        {/* State 2: Waiting for Owner Review */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>2</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>Waiting for Owner Review</strong>
                              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Pending</span>
                            </div>
                          </div>
                        </div>

                        {/* State 3: Approved for Manual Use */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: 0.5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--text-muted)', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>3</div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Approved for Manual Use</strong>
                              <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>Awaiting</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Value Proposition — Phase H.3 */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '4px solid var(--accent-indigo)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-indigo)' }}>Tại sao chọn AI Marketing Team?</h3>
                      <span className="badge badge-brand" style={{ fontSize: '0.7rem', background: 'rgba(244, 122, 31,0.12)', color: '#fb923c', border: '1px solid rgba(244, 122, 31,0.3)' }}>Value Proposition</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      {[
                        { icon: '⚡', title: 'Triển khai trong 3 phút', desc: 'Nhập brief → AI tạo toàn bộ campaign pack: captions, video scripts, design prompts, ads plan — ngay lập tức.', color: 'var(--accent-amber)' },
                        { icon: '🤝', title: 'Human-in-the-loop', desc: 'Owner phê duyệt mọi nội dung trước khi ra ngoài. Không một chữ, một đồng ngân sách nào chạy mà không có chữ ký bạn.', color: 'var(--accent-emerald)' },
                        { icon: '🎯', title: '5 chuyên gia trong 1 workspace', desc: 'Copywriter, Video Editor, Designer, Ads Manager và Data Reporter — phối hợp đồng bộ, không bỏ sót bước nào.', color: 'var(--accent-blue)' },
                        { icon: '📊', title: 'Tiết kiệm 15h/tuần (sample est.)', desc: 'So với quy trình làm marketing thủ công: briefing → viết → thiết kế → duyệt. AI xử lý phần nặng nhất.', color: 'var(--accent-rose)' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '1.6rem' }}>{item.icon}</div>
                          <strong style={{ fontSize: '0.95rem', color: item.color }}>{item.title}</strong>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', margin: 0 }}>
                      * Số liệu tiết kiệm thời gian là ước tính mô phỏng (sample estimate) — chỉ dùng cho mục đích minh họa.
                    </p>
                  </div>

                  {/* Before / After — Manual vs AI-Assisted — Phase H.3 */}
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Làm thủ công vs. AI Marketing Team</h3>
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>Sample Estimate — Sandbox Only</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* BEFORE */}
                      <div style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '1.1rem' }}>⏳</span>
                          <strong style={{ color: 'var(--accent-rose)', fontSize: '1rem' }}>TRƯỚC — Làm thủ công</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            ['Họp brief với team', '1–2 giờ'],
                            ['Viết caption Facebook (7 bài)', '3–4 giờ'],
                            ['Lên kịch bản video TikTok', '2–3 giờ'],
                            ['Brief designer (visual, prompt)', '1–2 giờ'],
                            ['Cấu hình ads targeting', '2–3 giờ'],
                            ['Duyệt nội dung (Owner review)', '1–2 giờ'],
                          ].map(([task, time], i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{task}</span>
                              <span style={{ color: 'var(--accent-rose)', fontWeight: 600, whiteSpace: 'nowrap' }}>{time}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid rgba(244,63,94,0.3)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                            <span style={{ color: 'var(--text-primary)' }}>Tổng ước tính</span>
                            <span style={{ color: 'var(--accent-rose)', fontSize: '1.1rem' }}>10–16 giờ</span>
                          </div>
                        </div>
                      </div>
                      {/* AFTER */}
                      <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '1.1rem' }}>⚡</span>
                          <strong style={{ color: 'var(--accent-emerald)', fontSize: '1rem' }}>SAU — AI Marketing Team</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            ['Điền brief form', '5–10 phút'],
                            ['AI sinh toàn bộ campaign pack', '~3 phút (sim.)'],
                            ['Video scripts & design prompts', '✅ Included'],
                            ['Ads targeting plan', '✅ Included'],
                            ['Owner review & approve', '30–60 phút'],
                            ['Điều chỉnh thủ công (nếu cần)', '30–60 phút'],
                          ].map(([task, time], i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{task}</span>
                              <span style={{ color: time.startsWith('✅') ? 'var(--accent-emerald)' : 'var(--accent-emerald)', fontWeight: 600, whiteSpace: 'nowrap' }}>{time}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid rgba(16,185,129,0.3)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                            <span style={{ color: 'var(--text-primary)' }}>Tổng ước tính</span>
                            <span style={{ color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>~2 giờ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
                      * Số liệu thời gian là ước tính mô phỏng — không phải cam kết thực tế. Owner vẫn phải duyệt thủ công trước khi triển khai.
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>AI Team Workspace</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      {/* Role 1: Copywriter */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)' }}>Copywriter</strong>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhiệm vụ chính:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Viết caption Facebook, kịch bản TikTok/Reels và slogan chiến dịch.</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Sample Output:</strong> {activeCampaign.outputs.copywriter.captions.length} captions + {activeCampaign.outputs.copywriter.slogans.length} slogans cho {activeCampaign.brief.brandName}.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cần duyệt (Human Sign-off):</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>YES</span>
                        </div>
                      </div>

                      {/* Role 2: Video Editor */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)' }}>Video Editor</strong>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhiệm vụ chính:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Dựng storyboard video ASMR 9:16, chỉ định âm thanh và cảnh quay chi tiết.</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Sample Output:</strong> {activeCampaign.outputs.videoEditor.scripts.length} video scripts — {activeCampaign.outputs.videoEditor.scripts[0]?.sceneCount} scenes each cho {activeCampaign.brief.brandName}.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cần duyệt (Human Sign-off):</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>YES</span>
                        </div>
                      </div>

                      {/* Role 3: Designer */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)' }}>Designer</strong>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhiệm vụ chính:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tạo prompt ảnh AI (Fal.ai/Midjourney), định nghĩa tông màu và visual identity.</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Sample Output:</strong> {activeCampaign.outputs.designer.briefs.length} design briefs + AI image prompts cho {activeCampaign.brief.brandName}.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cần duyệt (Human Sign-off):</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>YES</span>
                        </div>
                      </div>

                      {/* Role 4: Ads Manager */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)' }}>Ads Manager</strong>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhiệm vụ chính:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Lập plan ad sets, target tệp địa phương và cấu hình ngân sách ads.</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Sample Output:</strong> {activeCampaign.outputs.adsManager.adSets.length} ad sets + sample ads cho {activeCampaign.brief.location.split('(')[0].trim()}.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cần duyệt (Human Sign-off):</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>YES</span>
                        </div>
                      </div>

                      {/* Role 5: Data Reporter */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)' }}>Data Reporter</strong>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhiệm vụ chính:</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Đọc log tương tác ads giả lập, tính chỉ số CTR/CPC/CPA & đề xuất tối ưu.</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Sample Output:</strong> Simulated performance report + {activeCampaign.outputs.dataReporter.recommendations.length} optimization recommendations.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cần duyệt (Human Sign-off):</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>YES</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* CTA Block — Phase H.3 */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(244, 122, 31,0.08), rgba(16,185,129,0.05))', border: '1px solid rgba(244, 122, 31,0.25)', borderRadius: '16px', padding: '28px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Bước tiếp theo</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chọn hành động phù hợp với giai đoạn hiện tại của chiến dịch</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flexDirection: 'column', gap: '8px', padding: '18px', height: 'auto', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}
                        onClick={() => setActiveTab('approval')}
                      >
                        <span style={{ fontSize: '1.4rem' }}>✅</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>Duyệt Campaign Pack</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4 }}>Mở Approval Checklist → Owner phê duyệt hoặc từ chối</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flexDirection: 'column', gap: '8px', padding: '18px', height: 'auto', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.06)' }}
                        onClick={() => setActiveTab('manual-export')}
                      >
                        <span style={{ fontSize: '1.4rem' }}>📤</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.9rem' }}>Xuất File Gửi Khách</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4 }}>Manual Export Pack → Copy nội dung gửi editor, designer, owner</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flexDirection: 'column', gap: '8px', padding: '18px', height: 'auto', border: '1px solid rgba(244, 122, 31,0.3)', background: 'rgba(244, 122, 31,0.06)' }}
                        onClick={() => { setActiveTab('new-campaign'); }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>✍️</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-indigo)', fontSize: '0.9rem' }}>Chuẩn Bị Brief Tiếp Theo</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.4 }}>New Campaign Brief → Nhập thương hiệu mới để AI tạo chiến dịch kế tiếp</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* H.5 BRAND WORKSPACE GALLERY TAB */}
              {activeTab === 'brand-gallery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Brand Workspace Gallery
                        <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(244, 122, 31,0.15)', color: '#fb923c', borderColor: 'rgba(244, 122, 31,0.3)', border: '1px solid', borderRadius: '9999px', fontWeight: 600 }}>
                          {campaigns.length} Brands
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px', fontWeight: 600 }}>
                          Sandbox Safe Mode
                        </span>
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Multi-brand AI Marketing Team Workspace. Each brand has its own campaign workspace with seed data. No real connectors active.
                      </p>
                    </div>
                  </div>

                  {/* Brand Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {campaigns.map((c) => {
                      const isActive = c.id === activeCampaignId;
                      return (
                        <div
                          key={c.id}
                          className="glass-panel"
                          style={{
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            border: isActive ? '1px solid rgba(244, 122, 31,0.5)' : '1px solid var(--border-color)',
                            borderLeft: isActive ? '4px solid var(--accent-indigo)' : '4px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {/* Brand header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: isActive ? '#fb923c' : 'var(--text-primary)', margin: 0 }}>
                                {c.brief.brandName}
                              </h3>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {c.brief.industry}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                              {isActive && (
                                <span className="badge badge-brand" style={{ fontSize: '0.62rem', background: 'rgba(244, 122, 31,0.2)', color: '#fb923c', border: '1px solid rgba(244, 122, 31,0.4)' }}>
                                  ● Active
                                </span>
                              )}
                              <span className="badge badge-emerald" style={{ fontSize: '0.6rem', background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                                Sample Data
                              </span>
                            </div>
                          </div>

                          {/* Brand details */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '90px' }}>Hero Product</span>
                              <strong style={{ color: 'var(--text-primary)' }}>{c.brief.heroProduct}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '90px' }}>Target</span>
                              <span style={{ lineHeight: 1.35 }}>{c.brief.targetCustomer}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '90px' }}>Location</span>
                              <span>{c.brief.location.split('(')[0].trim()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '90px' }}>Channels</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {c.brief.channels.map((ch, i) => (
                                  <span key={i} className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{ch}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Campaign goal */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign Goal</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{c.brief.goal}</p>
                          </div>

                          {/* AI Outputs summary */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.72rem' }}>
                            {[
                              { label: 'Copywriter', count: `${c.outputs.copywriter.captions.length} captions` },
                              { label: 'Video Editor', count: `${c.outputs.videoEditor.scripts.length} scripts` },
                              { label: 'Designer', count: `${c.outputs.designer.briefs.length} briefs` },
                              { label: 'Ads Manager', count: `${c.outputs.adsManager.adSets.length} ad sets` },
                            ].map((item, idx) => (
                              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>{item.label}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>— {item.count}</span>
                              </div>
                            ))}
                          </div>

                          {/* Workspace status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                            <span>Auto-post: <strong style={{ color: 'var(--accent-rose)' }}>OFF</strong></span>
                            <span>Real Ads: <strong style={{ color: 'var(--accent-rose)' }}>OFF</strong></span>
                            <span>Approval Required: <strong style={{ color: 'var(--accent-amber)' }}>YES</strong></span>
                          </div>

                          {/* Select / active button */}
                          {isActive ? (
                            <button
                              className="btn btn-secondary"
                              style={{ border: '1px solid rgba(244, 122, 31,0.4)', color: '#fb923c', background: 'rgba(244, 122, 31,0.08)', cursor: 'default' }}
                              disabled
                            >
                              ● Currently Active Workspace
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => { setActiveCampaignId(c.id); setActiveTab('dashboard'); }}
                            >
                              Select Brand →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Phase I connector boundary note — conditional by view mode */}
                  {viewMode === 'owner' ? (
                    <div style={{ padding: '20px', background: 'rgba(244, 122, 31,0.04)', border: '1px solid rgba(244, 122, 31,0.2)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '10px' }}>
                        ⚡ Workspace Architecture — Phase I Connector Boundary
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                        {[
                          { label: 'Current (H.7)', desc: 'Sample/seed data. Static frontend. No real connectors.', color: 'var(--accent-emerald)', icon: '✅' },
                          { label: 'Phase I (Future)', desc: 'Real brand data input. Real connectors pending approval.', color: 'var(--accent-amber)', icon: '🔜' },
                          { label: 'Never (Boundary)', desc: 'No auto-post, no real ads without explicit Owner approval.', color: 'var(--accent-rose)', icon: '🛡️' },
                        ].map((item, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 600, color: item.color, marginBottom: '4px' }}>{item.icon} {item.label}</div>
                            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '10px' }}>
                        🛡️ Workspace Scope
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <p style={{ margin: 0 }}>This workspace uses <strong>sample data</strong> for campaign review and planning.</p>
                        <p style={{ margin: 0 }}>Publishing, ads, messaging, and live connectors require <strong>owner approval</strong> before any real action is taken.</p>
                        <p style={{ margin: 0 }}>Live connector setup is handled in a future approved phase.</p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* H.4. PRESENTATION & EXPORT TAB */}
              {activeTab === 'presentation-export' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                  {/* ── SECTION 1: Presentation View ── */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          Presentation View
                          <span className="badge badge-brand" style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(244, 122, 31,0.12)', color: '#fb923c', border: '1px solid rgba(244, 122, 31,0.3)', borderRadius: '9999px' }}>Client-Ready</span>
                        </h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          A step-by-step walkthrough: problem, AI solution, outputs, approval flow, manual publishing, and safety.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { step: '01', icon: '❓', title: 'Client Problem', color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.25)', bg: 'rgba(244,63,94,0.04)', body: 'SME owners spend 10–15 hours per week planning content, briefing teams, and reviewing posts — before any actual publishing. Manual marketing is slow, inconsistent, and hard to scale.' },
                        { step: '02', icon: '🤖', title: 'AI Marketing Team Solution', color: 'var(--accent-indigo)', borderColor: 'rgba(244, 122, 31,0.25)', bg: 'rgba(244, 122, 31,0.04)', body: 'Enter one brand brief → 5 specialized AI Agents run in parallel: Copywriter, Video Editor, Designer, Ads Manager, Data Reporter. Full campaign pack delivered in minutes.' },
                        { step: '03', icon: '📦', title: 'Campaign Outputs', color: 'var(--accent-blue)', borderColor: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.04)', body: '7-day content calendar, 7 Facebook captions, 3 TikTok/Reels scripts, 3 AI design prompts (Fal.ai/Midjourney), local ads targeting plan, and simulated performance report — all in one exportable pack.' },
                        { step: '04', icon: '✍️', title: 'Approval Process', color: 'var(--accent-amber)', borderColor: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.04)', body: 'Owner reviews every piece of content via the Approval Checklist tab before anything leaves this workspace. No post, no ad, no message is sent without explicit human sign-off.' },
                        { step: '05', icon: '📤', title: 'Manual Publishing & Manual Ads Execution', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.25)', bg: 'rgba(167,139,250,0.04)', body: 'After Owner approves, all content is copy-pasted manually to Facebook, TikTok, or the Ads Manager platform. No auto-scheduler, no API connection, no direct publishing from this workspace.' },
                        { step: '06', icon: '🛡️', title: 'Safety Boundaries', color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.04)', body: viewMode === 'client' ? 'All outputs use sample data only. Approval is required before any content is published, any ad is run, or any message is sent. No live publishing happens from this workspace without explicit owner sign-off.' : '100% offline sandbox. No backend, no database, no real API calls, no secrets, no auto-post, no real ads launched, no customer messaging. Every output uses sample data only until live connectors are approved. Safety Guard is always on.' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: item.bg, border: `1px solid ${item.borderColor}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: item.bg, border: `1px solid ${item.borderColor}`, borderRadius: '50%', fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>
                            {item.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.62rem', color: item.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>Step {item.step}</span>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color, margin: 0 }}>{item.title}</h4>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 2: Export Pack Preview ── */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Pack Preview</h2>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        What the client receives — 7 deliverables ready for review and manual execution.
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
                      {[
                        { icon: '📋', title: 'Campaign Summary',        desc: 'Full overview of brand, campaign concept, channels, and strategy direction. Client-facing language.',                                 badge: 'Ready',               badgeColor: 'badge-emerald', tag: 'AI Coordinator', linkTab: 'outputs',   linkSub: 'final'     },
                        { icon: '📅', title: '7-Day Content Plan',      desc: 'Day-by-day publishing schedule: theme, channel, content hint, visual, CTA, and approval column.',                                   badge: 'Ready',               badgeColor: 'badge-emerald', tag: 'Copywriter',     linkTab: 'outputs',   linkSub: 'calendar'  },
                        { icon: '🎬', title: 'Video Script Pack',       desc: '3 TikTok/Reels storyboard scripts — scene-by-scene breakdown with ASMR audio cues and text overlays.',                           badge: 'Ready',               badgeColor: 'badge-emerald', tag: 'Video Editor',   linkTab: 'outputs',   linkSub: 'video'     },
                        { icon: '🎨', title: 'Design Brief Pack',       desc: '3 visual design briefs with layout direction, color mood, and AI image prompts (Fal.ai/Midjourney ready).',                       badge: 'Ready',               badgeColor: 'badge-emerald', tag: 'Designer',       linkTab: 'outputs',   linkSub: 'design'    },
                        { icon: '📣', title: 'Ads Angle Pack',          desc: '5 ad angles + 2 ad set configs + 2 sample ad copy units. Target: local area, 18–35 demographic.',                                   badge: 'Needs owner budget',  badgeColor: 'badge-amber',   tag: 'Ads Manager',    linkTab: 'outputs',   linkSub: 'ads'       },
                        { icon: '📊', title: 'Data Reporter Summary',   desc: 'Simulated week-1 KPIs and performance metrics (CTR, CPC, CPA, Reach) with 3 optimization recommendations.',                      badge: 'Sample data',         badgeColor: 'badge-blue',    tag: 'Data Reporter',  linkTab: 'outputs',   linkSub: 'report'    },
                        { icon: '✅', title: 'Human Approval Checklist',desc: '10-point owner sign-off covering brand consistency, pricing, contact info, budget, and safety compliance.',                        badge: 'Owner required',      badgeColor: 'badge-rose',    tag: 'Owner',          linkTab: 'approval',  linkSub: ''          },
                      ].map((pack, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.4rem' }}>{pack.icon}</span>
                              <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{pack.title}</h4>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pack.tag}</span>
                              </div>
                            </div>
                            <span className={`badge ${pack.badgeColor}`} style={{ fontSize: '0.62rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{pack.badge}</span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{pack.desc}</p>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '6px 10px', marginTop: 'auto' }}
                            onClick={() => {
                              setActiveTab(pack.linkTab);
                              if (pack.linkSub) setOutputSubTab(pack.linkSub);
                            }}
                          >
                            View in workspace →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 3: Client Approval Sheet Preview ── */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Client Approval Sheet Preview</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          Static approval table. Click any status badge to cycle through states.
                        </p>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Sample Data Only — Not Live Data</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                            <th style={{ padding: '10px 12px' }}>Item</th>
                            <th style={{ padding: '10px 12px' }}>Owner Role</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>Client Note</th>
                            <th style={{ padding: '10px 12px' }}>Next Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvalSheetItems.map((row) => {
                            const statusStyles: Record<string, { badge: string; border: string; bg: string }> = {
                              'Ready for review':        { badge: 'badge-blue',    border: 'rgba(59,130,246,0.3)',  bg: 'rgba(59,130,246,0.03)'  },
                              'Approved':                { badge: 'badge-emerald', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.03)'  },
                              'Needs edit':              { badge: 'badge-rose',    border: 'rgba(244,63,94,0.3)',   bg: 'rgba(244,63,94,0.03)'   },
                              'Waiting owner approval':  { badge: 'badge-amber',   border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.03)'  },
                            };
                            const s = statusStyles[row.status] || statusStyles['Ready for review'];
                            const statuses = ['Ready for review', 'Approved', 'Needs edit', 'Waiting owner approval'];
                            return (
                              <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: s.bg }}>
                                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{row.item}</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{row.owner}</td>
                                <td style={{ padding: '12px' }}>
                                  <button
                                    className={`badge ${s.badge}`}
                                    style={{ cursor: 'pointer', fontSize: '0.7rem', border: `1px solid ${s.border}`, background: 'transparent' }}
                                    title="Click to cycle status"
                                    onClick={() => {
                                      const nextIdx = (statuses.indexOf(row.status) + 1) % statuses.length;
                                      setApprovalSheetItems(prev => prev.map(r => r.id === row.id ? { ...r, status: statuses[nextIdx] } : r));
                                    }}
                                  >
                                    {row.status}
                                  </button>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: row.note ? 'normal' : 'italic' }}>
                                  {row.note || '—'}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{row.nextAction}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                      * Click any status badge to cycle: Ready for review → Approved → Needs edit → Waiting owner approval. Sample data only.
                    </p>
                  </div>

                  {/* ── SECTION 4: Sales Demo Script ── */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Presenter Walkthrough Script</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          5–7 minute client workspace walkthrough. Follow this when presenting to a potential client.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>~6 min</span>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          onClick={() => copyToClipboard(
                            `PRESENTER WALKTHROUGH SCRIPT — AI MARKETING TEAM\n\n[0:00–0:30] INTRODUCE THE PROBLEM\n"Most F&B/SME owners spend 10–15 hours per week on marketing — writing posts, briefing teams, reviewing content, configuring ads. It's repetitive, expensive, and slow."\n\n[0:30–1:30] SHOW AI TEAM ROLES\n"This workspace gives you a full AI Marketing Team — 5 specialists in parallel."\n→ Action: Click AI Team Board tab — show all 5 role cards.\n\n[1:30–3:00] SHOW THE CAMPAIGN PACK\n"Let me enter a quick brief — just brand, product, audience, location."\n→ Action: New Campaign Brief → fill sample data → Activate AI → Campaign Outputs → cycle sub-tabs (Calendar, Captions, Video, Design, Ads).\n"This is the full campaign pack — everything copy-paste ready."\n\n[3:00–4:00] SHOW APPROVAL & SAFETY\n"Nothing leaves without your signature."\n→ Action: Approval Checklist tab → show 10-point list → Safety Guard panel.\n"Auto-post: NO. Real Ads: NO. You control everything."\n\n[4:00–5:00] EXPLAIN NEXT STEP\n"After you approve, you copy-paste manually to Facebook, TikTok, or your Ads Manager. We never touch your accounts."\n→ Action: Manual Export Pack → show copy buttons.\n\n[5:00–5:30] CLOSE — ASK FOR REAL BRIEF\n"That's the full workspace walkthrough. Do you have a real brief ready? Send me your brand name, hero product, and audience — and we can run a real campaign pack for your business right now."`,
                            'sales_script'
                          )}
                        >
                          {copiedStates['sales_script'] ? 'Copied! ✓' : <><Copy size={14} /> Copy Script</>}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {([
                        { time: '0:00–0:30', title: 'Introduce the Problem',     color: 'var(--accent-rose)',    borderColor: 'rgba(244,63,94,0.3)',   bg: 'rgba(244,63,94,0.04)',   say: '"Most F&B/SME owners spend 10–15 hours per week on marketing — writing posts, briefing teams, reviewing content, configuring ads. It\'s repetitive, expensive, and slow. And it still doesn\'t guarantee results."', action: null },
                        { time: '0:30–1:30', title: 'Show AI Team Roles',        color: 'var(--accent-indigo)', borderColor: 'rgba(244, 122, 31,0.3)',  bg: 'rgba(244, 122, 31,0.04)',  say: '"This workspace gives you a full AI Marketing Team — 5 specialists running in parallel. Let me show you the AI Team Board."', action: '→ Click: AI Team Board → show all 5 role cards (Copywriter, Video Editor, Designer, Ads Manager, Data Reporter)' },
                        { time: '1:30–3:00', title: 'Show the Campaign Pack',    color: 'var(--accent-blue)',   borderColor: 'rgba(59,130,246,0.3)',  bg: 'rgba(59,130,246,0.04)',  say: '"Let me enter a quick brief. Just brand name, product, audience, and location." … "Watch the AI run — about 3 seconds in this workspace." … "Here\'s the full campaign pack — 7-day calendar, captions, video scripts, design prompts, ads plan. Copy-paste ready."', action: '→ Click: New Campaign Brief → fill sample data → Activate AI → Campaign Outputs → cycle sub-tabs' },
                        { time: '3:00–4:00', title: 'Show Approval & Safety',   color: 'var(--accent-amber)',  borderColor: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.04)', say: '"Nothing leaves this workspace without your signature. This is a 10-point safety checklist. Auto-post: NO. Real Ads: NO. No messaging to customers. You control everything."', action: '→ Click: Approval Checklist → show progress bar + items → Safety Guard panel on Dashboard' },
                        { time: '4:00–5:00', title: 'Explain Next Step',         color: '#a78bfa',              borderColor: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.04)', say: '"After you approve, all content is copy-pasted manually to Facebook or TikTok. We never touch your accounts, your passwords, or your ad budget."', action: '→ Click: Manual Export Pack → show the 6 copy blocks' },
                        { time: '5:00–5:30', title: 'Close — Ask for Real Brief', color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.04)', say: '"That\'s the full workspace walkthrough. The only question now is: do you have a real brand brief ready? Send me your brand name, hero product, and audience — and we can run a real campaign pack for your business right now."', action: null },
                      ] as { time: string; title: string; color: string; borderColor: string; bg: string; say: string; action: string | null }[]).map((step, idx, arr) => (
                        <div key={idx} style={{ display: 'flex', gap: '0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: step.color, flexShrink: 0, marginTop: '24px' }} />
                            {idx < arr.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', minHeight: '12px', marginTop: '4px' }} />}
                          </div>
                          <div style={{ flex: 1, background: step.bg, border: `1px solid ${step.borderColor}`, borderRadius: '10px', padding: '16px 20px', marginBottom: idx < arr.length - 1 ? '8px' : '0', marginLeft: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <span className="badge" style={{ fontSize: '0.62rem', background: step.bg, color: step.color, border: `1px solid ${step.borderColor}` }}>{step.time}</span>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: step.color, margin: 0 }}>{step.title}</h4>
                            </div>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{step.say}</p>
                            {step.action && (
                              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', borderLeft: `3px solid ${step.color}`, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {step.action}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 5: Export Readiness Checklist ── */}
                  <div className="glass-panel" style={{ padding: '32px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Readiness Checklist</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          Confirm all conditions before exporting the campaign pack to the client.
                        </p>
                      </div>
                      {(() => {
                        const total = exportChecklist.length;
                        const done = exportChecklist.filter(i => i.checked).length;
                        return (
                          <span className={`badge ${done === total ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            {done}/{total} Ready
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {exportChecklist.map((item) => (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: item.fixed ? 'default' : 'pointer',
                            padding: '14px 16px',
                            background: item.checked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.01)',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: item.checked ? 'rgba(16,185,129,0.3)' : 'var(--border-color)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            disabled={item.fixed}
                            onChange={() => !item.fixed && setExportChecklist(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                            style={{ cursor: item.fixed ? 'default' : 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '0.9rem', color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: item.checked ? 500 : 400, flex: 1 }}>
                            {item.label}
                          </span>
                          {item.fixed && (
                            <span className="badge badge-rose" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>Safety lock</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      <strong style={{ color: 'var(--accent-emerald)' }}>🛡️ Safety reminder:</strong> Even when all items are checked, all outputs must be published <strong>manually</strong> by the Owner. No auto-scheduling, no direct platform publishing, and no real ads should be launched from this workspace.
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </main>

      </div>
    </div>
  );
}
