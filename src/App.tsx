import React, { useState } from 'react';
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
  Info 
} from 'lucide-react';
import { sampleCampaigns, Campaign, CampaignBrief } from './mockData';

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(sampleCampaigns);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(sampleCampaigns[0].id);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [outputSubTab, setOutputSubTab] = useState<string>('calendar');
  
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
            phase: "Phase B — First Demo Campaign Pack",
            status: "Needs Review",
            brief: { ...briefForm },
            // Inherit mock structures but customized with form inputs
            outputs: {
              ...activeCampaign.outputs,
              copywriter: {
                ...activeCampaign.outputs.copywriter,
                slogans: [`Giòn rôm rả cùng ${briefForm.heroProduct}!`, `Thèm heo quay có ${briefForm.brandName} lo!`],
                captions: activeCampaign.outputs.copywriter.captions.map((cap) => ({
                  ...cap,
                  body: cap.body.replace(/Vị Cuốn/g, briefForm.brandName).replace(/Bánh tráng cuốn heo quay/g, briefForm.heroProduct)
                }))
              }
            }
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
          checklist: c.checklist.map(item => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
          )
        };
      }
      return c;
    }));
  };

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-glow"></div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CLAUDE MARKETING TEAM
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Agent Marketing Workspace Simulation</p>
          </div>
        </div>
        <div>
          <span className="badge badge-indigo" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)', border: '1px solid' }}>
            Phase E — Local Web UI Prototype
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', minHeight: 'calc(100vh - 150px)' }}>
        
        {/* Navigation Sidebar */}
        <aside className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            
            <button 
              className={`btn btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'dashboard' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.1)' : '' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'new-campaign' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'new-campaign' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'new-campaign' ? 'rgba(99, 102, 241, 0.1)' : '' }}
              onClick={() => setActiveTab('new-campaign')}
            >
              <Plus size={18} /> New Campaign Brief
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'team-board' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'team-board' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'team-board' ? 'rgba(99, 102, 241, 0.1)' : '' }}
              onClick={() => setActiveTab('team-board')}
            >
              <Users size={18} /> AI Team Board
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'outputs' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'outputs' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'outputs' ? 'rgba(99, 102, 241, 0.1)' : '' }}
              onClick={() => setActiveTab('outputs')}
            >
              <Layers size={18} /> Campaign Outputs
            </button>

            <button 
              className={`btn btn-secondary ${activeTab === 'approval' ? 'active' : ''}`} 
              style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'approval' ? '1px solid var(--accent-indigo)' : '', background: activeTab === 'approval' ? 'rgba(99, 102, 241, 0.1)' : '' }}
              onClick={() => setActiveTab('approval')}
            >
              <CheckSquare size={18} /> Approval Checklist
            </button>

          </div>

          <div style={{ marginTop: '40px', padding: '12px', borderTop: '1px solid var(--border-color)', width: '100%' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Campaign:</p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
              <span>🛡️ Safety Guard Status</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Auto-post:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Ads:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Message:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Real Connectors:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Secrets Added:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FnB OS V1:</span> <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>NO</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Demo/Mock Only:</span> <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>YES</span></div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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

          {!isSimulating && (
            <>
              {/* 1. DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
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
                      <div className="badge badge-blue">Mock Data</div>
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
                      <h2 style={{ fontSize: '1.25rem' }}>Danh sách Demo Campaign</h2>
                      <button className="btn btn-primary" onClick={() => setActiveTab('new-campaign')}>
                        <Plus size={16} /> New Campaign
                      </button>
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
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem' }}>FnB OS V1 Touched:</span>
                        <span className="badge badge-rose" style={{ fontWeight: 'bold' }}>NO</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.85rem' }}>Demo/Mock Data Only:</span>
                        <span className="badge badge-emerald" style={{ fontWeight: 'bold' }}>YES</span>
                      </div>
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
                        Brand: **{activeCampaign.brief.brandName}** | HERO Product: **{activeCampaign.brief.heroProduct}**
                      </p>
                    </div>
                    <span className={`badge ${
                      activeCampaign.status === 'Approved' ? 'badge-emerald' : 
                      activeCampaign.status === 'Rejected' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {activeCampaign.status}
                    </span>
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
                      <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Lịch trình Phân Phối 7 Ngày (Final Calendar):</h4>
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
                            {activeCampaign.calendar?.map((item, idx) => (
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
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Campaign Slogans:</h4>
                        <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          {activeCampaign.outputs.copywriter.slogans.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Sample Caption:</h4>
                        {activeCampaign.outputs.copywriter.captions.map((cap, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '12px' }}>
                            <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>{cap.title}</h5>
                            <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '8px' }}>Visual: {cap.visual}</p>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'inherit', lineHeight: 1.5 }}>{cap.body}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video scripts tab */}
                  {outputSubTab === 'video' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeCampaign.outputs.videoEditor.scripts.map((script, idx) => (
                        <div key={idx}>
                          <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '12px' }}>{script.title}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {script.scenes.map((scene, sIdx) => (
                              <div key={sIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{scene.scene}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}><strong>Visual:</strong> {scene.visual}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}><strong>Audio:</strong> {scene.audio}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)', marginTop: '4px' }}><strong>Note:</strong> {scene.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Design briefs tab */}
                  {outputSubTab === 'design' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeCampaign.outputs.designer.briefs.map((brief, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: '10px' }}>{brief.title}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}><strong>Layout:</strong> {brief.layout}</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}><strong>Text Overlay:</strong> {brief.textOverlay}</p>
                          
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', marginTop: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, textTransform: 'uppercase' }}>AI Design Prompt:</p>
                            <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>{brief.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ads manager tab */}
                  {outputSubTab === 'ads' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>5 Góc tiếp cận (Angles):</h4>
                        <ul style={{ listStyleType: 'decimal', paddingLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeCampaign.outputs.adsManager.angles.map((a, idx) => <li key={idx}>{a}</li>)}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--accent-indigo)' }}>Nhóm Target đối tượng giả lập (Ad Sets):</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                          {activeCampaign.outputs.adsManager.adSets.map((ad, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <h5 style={{ fontWeight: 600, marginBottom: '6px' }}>{ad.name}</h5>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Ngân sách:</strong> {ad.budget}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Target:</strong> {ad.targeting}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Định dạng:</strong> {ad.format}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simulated reports tab */}
                  {outputSubTab === 'report' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>🔒 SIMULATED DATA ONLY - DỮ LIỆU MÔ PHỎNG</div>
                      
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
                    </div>
                  )}

                  {/* Final pack tab */}
                  {outputSubTab === 'final' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ background: 'rgba(99,102,241,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-glow)' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--accent-indigo)' }}>Gói Chiến Dịch Đóng Gói (Final Campaign Pack)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          Đây là sản phẩm đã được AI Coordinator tổng hợp sạch đẹp từ tất cả các Agent, sẵn sàng đưa vào phê duyệt hoặc copy-paste để đăng tải thực tế.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong>1. Slogans:</strong> "{activeCampaign.outputs.copywriter.slogans[0]}"
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <strong>2. Bài viết chính (Facebook):</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{activeCampaign.outputs.copywriter.captions[0].body}</pre>
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
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Kiểm Duyệt Chiến Dịch Thủ Công</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Với vai trò là Chủ thương hiệu (Owner), bạn có quyền duyệt hoặc từ chối gói sản phẩm marketing dưới đây.
                    </p>
                  </div>

                  {/* Human Approval Checklist */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📋 Owner Review & Human Approval Checklist
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Vui lòng tích chọn phê duyệt từng tiêu chí dưới đây trước khi tiến hành triển khai thủ công ngoài thực tế:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeCampaign.checklist?.map((item) => (
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
                  <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                    <AlertCircle style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left' }}>
                      <strong>Lời khuyên khi duyệt:</strong> Đảm bảo thông tin về Bánh tráng cuốn heo quay đã khớp với định vị Street food meets Premium của Vị Cuốn. Hãy copy prompt hình ảnh mang sang Canva/Fal.ai để tự thiết kế nếu bạn đã duyệt sản phẩm.
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
