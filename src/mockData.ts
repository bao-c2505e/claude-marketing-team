export interface CampaignBrief {
  brandName: string;
  industry: string;
  heroProduct: string;
  pricing: string;
  targetCustomer: string;
  location: string;
  goal: string;
  duration: string;
  offer: string;
  channels: string[];
  toneOfVoice: string;
  exclusions: string;
  assets: string;
}

export interface CalendarItem {
  day: string;
  theme: string;
  channel: string;
  content: string;
  visual: string;
  cta: string;
  approval: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Scene {
  scene: string;
  visual: string;
  audio: string;
  note: string;
  textOverlay: string;
}

export interface VideoScript {
  title: string;
  hook: string;
  sceneCount: number;
  scenes: Scene[];
}

export interface DesignBrief {
  title: string;
  layout: string;
  textOverlay: string;
  prompt: string;
  visualDirection: string;
  colorStyleNote: string;
}

export interface MockAdUnit {
  name: string;
  angle: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
}

export interface KpiAssumption {
  metric: string;
  assumption: string;
}

export interface AgentOutput {
  copywriter: {
    captions: { title: string; body: string; visual: string }[];
    slogans: string[];
    hooks: string[];
    ctas: string[];
    shortCaptions: string[];
    hashtags: string[];
  };
  videoEditor: {
    scripts: VideoScript[];
  };
  designer: {
    briefs: DesignBrief[];
  };
  adsManager: {
    angles: string[];
    objectives: string[];
    adSets: { name: string; budget: string; targeting: string; format: string }[];
    testIdeas: string[];
    mockAds: MockAdUnit[];
  };
  dataReporter: {
    metrics: { name: string; target: string; actual: string; completion: string; status: string }[];
    audienceBreakdown: { name: string; budget: string; ctr: string; conversions: string; cpa: string }[];
    recommendations: string[];
    kpiAssumptions: KpiAssumption[];
    reportTemplate: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  phase: string;
  status: 'Draft' | 'Needs Review' | 'Approved' | 'Rejected';
  brief: CampaignBrief;
  outputs: AgentOutput;
  calendar?: CalendarItem[];
  checklist?: ChecklistItem[];
}

export const sampleCampaigns: Campaign[] = [
  {
    id: "CAMP-VICUON-001",
    name: "Chiến dịch Bánh tráng cuốn heo quay — Vị Cuốn",
    phase: "Phase G+ — Workspace Utility Upgrade",
    status: "Needs Review",
    brief: {
      brandName: "Vị Cuốn",
      industry: "F&B / món cuốn / street food premium tại TP Vinh",
      heroProduct: "Bánh tráng cuốn heo quay",
      pricing: "[Chưa cung cấp - OWNER CUNG CẤP]",
      targetCustomer: "Nhân viên văn phòng, sinh viên, gia đình trẻ tại TP Vinh",
      location: "TP. Vinh, Nghệ An (bán kính ship linh hoạt)",
      goal: "Tăng nhận diện thương hiệu Bánh tráng cuốn heo quay và kéo đơn hàng ăn trưa/ăn tối",
      duration: "7 ngày (Chiến dịch thử nghiệm)",
      offer: "[Chưa chốt ưu đãi - OWNER CUNG CẤP]",
      channels: ["Facebook", "TikTok / Reels"],
      toneOfVoice: "Sạch sẽ, ngon mắt, gần gũi, hiện đại, premium nhưng không phóng đại",
      exclusions: "Không ghi giá bán lẻ hay ưu đãi giả; không chứa claim sức khỏe quá đà; không bịa số liệu đơn hàng",
      assets: "Hình ảnh món ăn thực tế tại quán, logo PNG, video thô quay bằng điện thoại"
    },
    calendar: [
      { 
        day: "Day 1", 
        theme: "Giới thiệu heo quay lu", 
        channel: "Facebook", 
        content: "Heo quay nướng lu da giòn [Giá: OWNER CUNG CẤP]", 
        visual: "Ảnh chụp đĩa heo quay lu thật", 
        cta: "[Inbox đặt món]", 
        approval: "Duyệt giá chính thức" 
      },
      { 
        day: "Day 2", 
        theme: "Tiện lợi văn phòng", 
        channel: "TikTok", 
        content: "Video ngắn 15s giao hộp cuốn sạch", 
        visual: "Video nhân viên gói đồ ship", 
        cta: "[Gọi hotline]", 
        approval: "Duyệt hotline & địa chỉ" 
      },
      { 
        day: "Day 3", 
        theme: "Linh hồn mắm nêm", 
        channel: "Facebook", 
        content: "Công thức mắm nêm đậm vị", 
        visual: "Ảnh chụp cận cảnh bát mắm nêm", 
        cta: "[Inbox đặt món]", 
        approval: "Duyệt chất lượng ảnh" 
      },
      { 
        day: "Day 4", 
        theme: "Thực đơn thanh mát", 
        channel: "Facebook", 
        content: "Giới thiệu cải cuốn, bún trộn", 
        visual: "Ảnh ghép 3 món cuốn nhẹ bụng", 
        cta: "[Inbox đặt món]", 
        approval: "Duyệt ưu đãi combo" 
      },
      { 
        day: "Day 5", 
        theme: "Tụ tập cuối tuần", 
        channel: "TikTok", 
        content: "Video nhóm bạn cùng ăn rôm rả", 
        visual: "Video quay trải nghiệm tại quán", 
        cta: "[Đặt bàn ngay]", 
        approval: "Duyệt hotline đặt bàn" 
      },
      { 
        day: "Day 6", 
        theme: "Quy trình sạch sẽ", 
        channel: "Facebook", 
        content: "Cam kết rau sạch rửa ozone", 
        visual: "Ảnh chụp rổ rau tươi sạch", 
        cta: "[Inbox đặt món]", 
        approval: "Xác minh quy trình bếp" 
      },
      { 
        day: "Day 7", 
        theme: "Bữa tối gia đình", 
        channel: "Facebook", 
        content: "Mẹ sum vầy bên mẹt cuốn đầy", 
        visual: "Ảnh gia đình trẻ ngồi ăn cuốn", 
        cta: "[Inbox đặt món]", 
        approval: "Duyệt toàn bộ lịch đăng" 
      }
    ],
    checklist: [
      { id: "brand_voice_checked", label: "Brand voice checked: Đúng phong cách sạch sẽ, gần gũi, premium nhưng không phóng đại.", checked: false },
      { id: "product_info_checked", label: "Product info checked: Đúng thông tin món ăn cốt lõi (Bánh tráng cuốn heo quay).", checked: false },
      { id: "price_promo_not_fabricated", label: "Price/promotion not fabricated: Không bịa đặt giá cả hoặc khuyến mãi ảo.", checked: false },
      { id: "visual_concept_approved", label: "Visual concept approved: Ý tưởng hình ảnh chân thực, sạch sẽ và chuyên nghiệp.", checked: false },
      { id: "caption_approved", label: "Caption approved: Nội dung bài đăng Facebook được kiểm duyệt từ ngữ kỹ càng.", checked: false },
      { id: "ads_copy_approved", label: "Ads copy approved: Nội dung quảng cáo nhắm đúng tệp đối tượng Vinh.", checked: false },
      { id: "no_autopost", label: "No auto-post: Xác nhận hệ thống không tự động đăng bài lên các kênh.", checked: false },
      { id: "no_real_ads", label: "No real ads launched: Xác nhận không tự động kích hoạt tài khoản quảng cáo.", checked: false },
      { id: "no_real_messaging", label: "No real messaging: Xác nhận không tự động gửi tin nhắn hay spam khách hàng.", checked: false },
      { id: "human_approval_required", label: "Human approval required: Yêu cầu sự duyệt của người trước khi sử dụng công khai.", checked: false }
    ],
    outputs: {
      copywriter: {
        slogans: [
          "Cuốn ngon chuẩn vị, da giòn rôm rả — Bữa trưa thảnh thơi cùng Vị Cuốn!",
          "Thèm heo quay giòn lu, ghé ngay Vị Cuốn!",
          "Cuốn sạch premium — Tròn vị phố Vinh"
        ],
        hooks: [
          "Hộp bánh tráng cuốn heo quay da giòn lu tiện lợi cho dân văn phòng Vinh.",
          "Quy trình cuộn chiếc bánh tráng cuốn heo quay premium đầy đặn.",
          "Đi trốn nóng chiều hè cùng mẹt cuốn mắm nêm đậm vị.",
          "Khi món street food quen thuộc được nâng tầm sạch sẽ premium.",
          "Bữa trưa no bụng nhưng thanh nhẹ, không lo béo ngấy của nhóm bạn trẻ.",
          "ASMR tiếng da heo nổ lu giòn tan giòn tan rôm rả.",
          "Mẹo ăn bún trộn mắm nêm heo quay chuẩn ngon cho dân sành ăn Vinh."
        ],
        ctas: [
          "👉 [Inbox đặt món ngay]",
          "📞 Hotline đặt ship: [OWNER CUNG CẤP]",
          "📍 Địa chỉ: [OWNER CUNG CẤP]"
        ],
        shortCaptions: [
          "Trưa nay ăn nhẹ bụng mà vẫn cuốn? Mẹt bánh tráng cuốn heo quay da giòn rôm rả tại Vị Cuốn sẵn sàng giao tận văn phòng.",
          "Mắm nêm đậm vị, rau sạch rửa ozone, heo quay lu nóng hổi. Đầy đủ cho bữa tối sum vầy cùng gia đình.",
          "ASMR da heo giòn rụm! Thèm cuốn heo quay ngon sạch chuẩn premium ghé ngay Vị Cuốn Vinh nhé."
        ],
        hashtags: ["#vicuon", "#monvietpremium", "#anngonvinh", "#banhtrangcuonheoquay"],
        captions: [
          {
            title: "Bài 1 (Ngày 1): Giới thiệu Heo quay nướng lu da giòn",
            body: "🥓 HEO QUAY NƯỚNG LU DA GIÒN RÔM RẢ — CUỐN NGON TRỌN VỊ!\n\nBữa trưa nay ăn gì để vừa ngon, vừa sạch, lại không lo béo ngấy? Hãy thử ngay Bánh tráng cuốn heo quay tại Vị Cuốn!\n\nTừng miếng thịt heo quay nướng lu thơm lừng với lớp da giòn tan rôm rả, cuốn cùng rau sống đa dạng rửa sạch chuẩn vệ sinh, chấm đẫm nước mắm nêm đậm vị độc quyền của quán. Bữa trưa chất lượng tiếp thêm năng lượng chạy deadline!\n\n👉 [Inbox đặt món ngay]\n📞 Hotline đặt ship: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Cận cảnh đĩa thịt heo quay lu da nổ giòn, khói nghi ngút thơm lừng"
          },
          {
            title: "Bài 2 (Ngày 2): Giải pháp ăn trưa văn phòng tiện lợi",
            body: "💻 BỮA TRƯA VĂN PHÒNG TIỆN LỢI & SẠCH SẼ CÙNG VỊ CUỐN\n\nKhông cần đội nắng ra đường tìm quán ăn trưa. Vị Cuốn mang đến cho văn phòng bạn hộp bánh tráng cuốn heo quay được đóng gói sạch sẽ, chỉn chu, ngon mắt. Cuốn ngập tràn rau tươi và thịt giòn béo ngậy, ăn no bụng nhưng cực kỳ nhẹ nhàng cho buổi chiều làm việc hiệu quả. Đặt nhóm để nhận ngay ưu đãi giờ vàng!\n\n👉 [Inbox đặt món ngay]\n📞 Hotline: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Hộp giấy đóng gói sang trọng đựng 6 cuộn bánh tráng heo quay xếp đều đặn"
          },
          {
            title: "Bài 3 (Ngày 3): Nước chấm thần thánh - Linh hồn món Việt Premium",
            body: "🍹 NƯỚC CHẤM THẦN THÁNH — LINH HỒN CỦA MÓN VIỆT PREMIUM\n\nĐiều làm nên thương hiệu Vị Cuốn chính là bát mắm nêm đậm vị, thơm nồng đúng chất miền Trung. Hòa quyện cùng vị ngọt của thịt heo nướng lu và vị thanh mát của rau sống tươi rói. Cắn một miếng là cảm nhận trọn vẹn vị ngon khó cưỡng!\n\n👉 [Inbox đặt món ngay]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Cận cảnh bát mắm nêm đậm đà tỏi ớt kế bên lát thịt heo quay"
          },
          {
            title: "Bài 4 (Ngày 4): Đa dạng thực đơn món cuốn cả tuần không chán",
            body: "ĐA DẠNG THỰC ĐƠN MÓN CUỐN CHO CẢ TUẦN KHÔNG CHÁN 🥬\n\nBên cạnh bánh tráng heo quay, Vị Cuốn còn sẵn sàng phục vụ bạn bún trộn mắm nêm đậm đà, gỏi cuốn tôm thịt đầy đặn và cải cuốn tôm thịt thanh mát, giàu chất xơ cho bữa ăn nhẹ bụng, tốt cho sức khỏe. Tất cả rau xanh tại quán đều được tuyển lựa kỹ càng và rửa sạch kỹ lưỡng.\n\n👉 [Inbox đặt món ngay]\n📞 Hotline: [OWNER CUNG CẤP]",
            visual: "Ảnh ghép 3 món cuốn (Bún trộn mắm nêm, cải cuốn, gỏi cuốn tôm thịt) thanh mát"
          },
          {
            title: "Bài 5 (Ngày 5): Lập hội trốn nóng cuối tuần cùng Vị Cuốn",
            body: "👥 LẬP HỘI TRỐN NÓNG CUỐI TUẦN CÙNG VỊ CUỐN\n\nCuối tuần thảnh thơi rủ nhóm bạn thân hay gia đình ghé Vị Cuốn để cùng quây quản bên những mẹt cuốn heo quay premium ngon mắt. Không gian hiện đại, sạch sẽ và các món cuốn đậm đà đang chờ đón bạn chiều nay!\n\n📞 Đặt bàn/đặt ship: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Video nhóm bạn trẻ ngồi ăn cuốn trải nghiệm không gian mát mẻ tại quán"
          },
          {
            title: "Bài 6 (Ngày 6): Cam kết chuẩn sạch Premium",
            body: "CHUẨN SẠCH PREMIUM — AN TÂM THƯỞNG THỨC MỖI NGÀY\n\nVị Cuốn tin rằng một món ăn ngon trước hết phải là món ăn sạch. Từ khâu tuyển chọn rau sống tươi xanh mỗi sáng, quy trình chế biến thịt heo quay lu vàng óng cho đến chiếc hộp giấy đóng gói ship đi — tất cả đều được chúng tôi thực hiện chỉn chu, gọn gàng nhất.\n\n👉 [Inbox đặt món ngay]\n📞 Hotline: [OWNER CUNG CẤP]",
            visual: "Ảnh chụp rổ rau tươi sạch chuẩn vệ sinh và quy trình sơ chế chuyên nghiệp"
          },
          {
            title: "Bài 7 (Ngày 7): Tận hưởng bữa tối ấm cúng cùng gia đình",
            body: "⏰ TẬN HƯỞNG BỮA TỐI ẤM CÚNG CÙNG GIA ĐÌNH VỚI VỊ CUỐN\n\nTạm gác lại âu lo công việc, dành buổi tối cuối tuần bên gia đình với mẹt cuốn heo quay đầy màu sắc. Đầy đủ dưỡng chất, dễ ăn cho cả người lớn và trẻ nhỏ. Đặt giao hàng tận nhà nhanh chóng để bữa tối sẵn sàng chỉ sau 20 phút.\n\n👉 [Inbox đặt món ngay]\n📞 Hotline: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]\n\n#vicuon #monvietpremium #anngonvinh",
            visual: "Ảnh gia đình trẻ ngồi sum vầy ấm cúng bên mẹt cuốn heo quay lu tại nhà"
          }
        ]
      },
      videoEditor: {
        scripts: [
          {
            title: "Kịch bản video 1: ASMR da heo quay nướng lu giòn rụm (15s)",
            hook: "ASMR tiếng da heo nổ lu giòn tan giòn tan rôm rả.",
            sceneCount: 4,
            scenes: [
              {
                scene: "Cảnh 1 (0-3s)",
                visual: "Cận cảnh chiếc lu đất nướng heo quay, nhân viên mở nắp để khói thơm tỏa ra. Heo quay vàng ruộm óng ả.",
                audio: "SFX: Tiếng lửa lò nổ lách tách nhẹ. Nhạc nền nhẹ nhàng, không quá dồn dập.",
                note: "Close-up (Cận cảnh góc lu đất).",
                textOverlay: "HEO QUAY NƯỚNG LU DA GIÒN"
              },
              {
                scene: "Cảnh 2 (3-8s)",
                visual: "Dao thái dứt khoát lên miếng thịt heo quay nướng lu trên thớt gỗ sạch. Thớ thịt heo quay chín tới, ẩm mềm, phần da heo nổ đều giòn cứng.",
                audio: "SFX: Tiếng \"rôm rả\" rõ nét khi dao cắt qua lớp da heo giòn rụm.",
                note: "Macro shot (Góc cắt sát tiếng động thớt).",
                textOverlay: "GIÒN TAN RÔM RẢ"
              },
              {
                scene: "Cảnh 3 (8-12s)",
                visual: "Tay người cuốn bánh tráng đầy đặn rau sống, dưa chuột, khế chua và lát heo quay, chấm ngập vào bát mắm nêm tỏi ớt.",
                audio: "VO: 'Bánh tráng cuốn heo quay nướng lu thơm lừng, chấm đẫm mắm nêm chuẩn Vị Cuốn...'",
                note: "Extreme Close-up (Góc quay cận cảnh chấm nước sốt).",
                textOverlay: "CHẤM ĐẪM MẮM NÊM ĐẬM VỊ"
              },
              {
                scene: "Cảnh 4 (12-15s)",
                visual: "Slide tĩnh chứa logo Vị Cuốn và CTA thông tin liên hệ: [Gọi hotline: OWNER CUNG CẤP] hoặc [Địa chỉ: OWNER CUNG CẤP].",
                audio: "VO: 'Đặt món ngay cho bữa trưa nay nhé!'",
                note: "Slide tĩnh hiển thị logo và thông tin đặt ship.",
                textOverlay: "👉 INBOX ĐẶT MÓN | HOTLINE: [OWNER CUNG CẤP]"
              }
            ]
          },
          {
            title: "Kịch bản video 2: Quy trình chuẩn sạch của mẹt cuốn văn phòng (15s)",
            hook: "Hộp bánh tráng cuốn heo quay da giòn lu tiện lợi cho dân văn phòng Vinh.",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-5s)",
                visual: "Tay nhân viên xếp từng cuộn bánh tráng heo quay tròn trịa vào hộp giấy kraft sạch sẽ, dán tem nhãn logo Vị Cuốn chỉn chu.",
                audio: "VO: 'Cơm trưa văn phòng chuẩn sạch premium đóng gói gọn gàng.' Nhạc nền tươi vui, nhẹ nhàng.",
                note: "Góc quay ngang tầm mắt (Eye-level shot) thắp sáng.",
                textOverlay: "BỮA TRƯA CHUẨN SẠCH PREMIUM"
              },
              {
                scene: "Cảnh 2 (5-10s)",
                visual: "Shipper chuyên nghiệp xách túi đồ ăn của quán đi giao tới văn phòng. Nhân viên văn phòng mở hộp hào hứng.",
                audio: "VO: 'Giao tận nơi nhanh chóng, giữ trọn độ giòn của thịt heo quay lu.'",
                note: "Quay chuyển động (Tracking shot) mượt mà.",
                textOverlay: "GIAO NHANH 20 PHÚT"
              },
              {
                scene: "Cảnh 3 (10-15s)",
                visual: "Text overlay: 👉 [Inbox đặt món ngay] | 📞 Hotline: [OWNER CUNG CẤP].",
                audio: "VO: 'Rủ đồng nghiệp đặt nhóm ăn trưa tránh nắng ngay nhé!'",
                note: "Slide CTA thương hiệu sắc nét.",
                textOverlay: "📞 HOTLINE: [OWNER CUNG CẤP]"
              }
            ]
          },
          {
            title: "Kịch bản video 3: Hội bạn thân tụ tập ăn gỏi cuốn chiều mát (15s)",
            hook: "Đi trốn nóng chiều hè cùng mẹt cuốn mắm nêm đậm vị.",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-5s)",
                visual: "Nhóm bạn trẻ đẩy cửa quán bước vào không gian Vị Cuốn sạch sẽ, thoáng mát, nhân viên chào đón nhiệt tình.",
                audio: "SFX: Tiếng cười nói vui vẻ. Nhạc nền lofi nhẹ nhàng thư giãn.",
                note: "Góc quay rộng (Wide shot) toàn cảnh quán.",
                textOverlay: "TRỐN NÓNG CHIỀU HÈ"
              },
              {
                scene: "Cảnh 2 (5-10s)",
                visual: "Mẹt cuốn heo quay lu khổng lồ ngập tràn màu sắc rau xanh được bày lên bàn gỗ. Các bạn cùng cuốn và chấm mắm nêm ngon lành.",
                audio: "VO: 'Chiều mát rủ hội bạn thân tụ tập giải nhiệt bằng những cuốn heo quay thanh nhẹ bụng.'",
                note: "Góc quay từ trên xuống (Top-down shot) chụp trọn mẹt cuốn.",
                textOverlay: "MẸT CUỐN HEO QUAY KHỔNG LỒ"
              },
              {
                scene: "Cảnh 3 (10-15s)",
                visual: "Logo Vị Cuốn và địa chỉ quán: [📍 Địa chỉ: OWNER CUNG CẤP] hiện lên màn hình.",
                audio: "VO: 'Ghé ngay Vị Cuốn chiều nay thôi bạn ơi!'",
                note: "Slide CTA địa chỉ và hotline đặt bàn.",
                textOverlay: "📍 ĐỊA CHỈ: [OWNER CUNG CẤP]"
              }
            ]
          }
        ]
      },
      designer: {
        briefs: [
          {
            title: "Thiết kế 1: Banner Facebook giới thiệu Bánh tráng cuốn heo quay",
            layout: "Bố cục đĩa cuốn heo quay được bày trí gọn gàng, sạch sẽ trên bàn gỗ sáng màu. Xung quanh là rau xanh tươi rói và chén nước chấm mắm nêm đậm vị.",
            textOverlay: "BÁNH TRÁNG CUỐN HEO QUAY NƯỚNG LU — STREET FOOD meets PREMIUM",
            prompt: "A clean overhead photograph of a premium Vietnamese roasted pork platter with fresh herbs, rice paper rolls, and a bowl of anchovy sauce on a light-colored wooden table, cozy high-quality restaurant interior background, daylight, photorealistic --ar 16:9",
            visualDirection: "Góc chụp từ trên xuống thẳng (flatlay overhead), ánh sáng ban ngày tự nhiên (daylight), làm nổi bật thớ thịt heo quay lu da giòn óng ả và rổ rau tươi xanh mướt rửa sạch.",
            colorStyleNote: "Tông màu tươi sáng, kết hợp sắc xanh lá tươi mát của rau sống với màu vàng gỗ ấm áp của mặt bàn, tạo cảm giác sang trọng (Premium) và sạch sẽ."
          },
          {
            title: "Thiết kế 2: Mẹt cuốn rau tươi xanh",
            layout: "Mẹt tre lớn đựng đầy đủ bánh tráng, rau sống tươi mát rửa sạch ozone, thịt heo quay nướng lu thái mỏng xếp vòng tròn đồng tâm, bát mắm nêm ở trung tâm.",
            textOverlay: "MỘT CUỐN ĐỦ RAU - ĐỦ THỊT - ĐỦ THÈM",
            prompt: "A beautiful Vietnamese food platter with fresh rice paper rolls ingredients: sliced roasted pork belly, cucumber, herbs, rice vermicelli, dipping sauce bowl in center, rustic top-down perspective, organic food photography, cinematic lighting --ar 4:3",
            visualDirection: "Góc chụp nghiêng 45 độ (isometric perspective), ánh sáng cinematic tập trung vào mẹt cuốn tre dân dã để tạo chiều sâu và độ tương phản cao.",
            colorStyleNote: "Tông màu gỗ mộc mạc, kết hợp màu nâu sẫm của mẹt tre và màu đỏ tỏi ớt nổi bật trong bát mắm nêm trung tâm."
          },
          {
            title: "Thiết kế 3: Canva brief cho post ăn trưa văn phòng",
            layout: "Bố cục chia hai nửa, nửa trên là hình ảnh văn phòng tươi vui ngồi ăn món cuốn sạch sẽ, nửa dưới là hộp giấy ship cơm trưa chỉn chu kèm thông tin hotline.",
            textOverlay: "BỮA TRƯA VĂN PHÒNG CHUẨN SẠCH PREMIUM - SHIPPED TO YOU",
            prompt: "A clean eco-friendly cardboard lunch box filled with neatly cut rice paper rolls, office desk background with a laptop, modern professional work lifestyle, soft lighting, sharp focus --ar 1:1",
            visualDirection: "Góc chụp ngang tầm mắt cận cảnh chiếc hộp giấy mở nắp (close-up open box), nền mờ là góc làm việc văn phòng hiện đại với laptop và sổ ghi chép.",
            colorStyleNote: "Tông màu sáng, sạch sẽ, chuyên nghiệp, sử dụng chất liệu giấy kraft bảo vệ môi trường mang cảm giác an tâm sức khỏe."
          }
        ]
      },
      adsManager: {
        angles: [
          "Angle 1: Bữa trưa sạch sẽ, gọn gàng giao tận nơi cho dân văn phòng Vinh (Tránh nắng chiều hè).",
          "Angle 2: Trải nghiệm street food Việt quen thuộc nâng tầm \"Premium\" sạch sẽ và trình bày đẹp mắt.",
          "Angle 3: Lập hội ăn cuốn xế chiều giải nhiệt cho nhóm bạn trẻ và sinh viên TP Vinh.",
          "Angle 4: Mẹ sum vầy chuẩn bị bữa tối cuối tuần ấm cúng đầy đủ dưỡng chất dễ ăn cho cả nhà."
        ],
        objectives: [
          "Facebook Messages (Thu hút tin nhắn inbox đặt món trực tiếp)",
          "Facebook Traffic (Kéo khách hàng xem menu món cuốn trên page)",
          "TikTok Video Views (Viral video ASMR tiếng thịt giòn nổ lu)"
        ],
        adSets: [
          {
            name: "Dân văn phòng TP Vinh (Feed Photo)",
            budget: "[Ví dụ mô phỏng: 150.000 VND/ngày]",
            targeting: "Tuổi 22-35, khu vực trung tâm TP Vinh, nhân viên công sở, sở thích ăn trưa, món cuốn",
            format: "Ảnh đĩa cuốn heo quay lu thật"
          },
          {
            name: "Giới trẻ & Sinh viên Vinh (Reels Video)",
            budget: "[Ví dụ mô phỏng: 100.000 VND/ngày]",
            targeting: "Tuổi 18-24, bán kính 4km quanh Vinh, thích street food, ăn vặt",
            format: "Video ngắn ASMR da heo nổ lu giòn tan"
          }
        ],
        testIdeas: [
          "Thử nghiệm Banner món ăn cận cảnh chân thực vs Banner thiết kế graphic chữ lớn",
          "Thử nghiệm Video quá trình cuộn bánh tráng vs Video ASMR dao chặt heo quay lu",
          "Thử nghiệm Tệp target nhân viên văn phòng vs Tệp target chung giới trẻ thích ăn uống"
        ],
        mockAds: [
          {
            name: "Facebook Post Ad - Văn phòng Vinh",
            angle: "Bữa trưa sạch sẽ giao tận nơi tránh nắng văn phòng TP Vinh",
            primaryText: "💻 TRƯA NAY ĂN GÌ ĐỂ TRÁNH NẮNG VINH? ĐẶT NGAY BÁNH TRÁNG CUỐN HEO QUAY SẠCH PREMIUM!\n\nKhông cần ra ngoài nắng nóng, Vị Cuốn ship tận nơi hộp bánh tráng cuốn heo quay da lu giòn rụm, đóng gói chỉn chu, rau xanh rửa sạch ozone. Đặt nhóm cùng đồng nghiệp nhận ưu đãi ngay hôm nay!\n\n👉 [Inbox đặt món ngay]\n📞 Hotline: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            headline: "Bánh tráng cuốn heo quay nướng lu - Ship tận văn phòng Vinh",
            description: "Hộp giấy kraft sạch sẽ, cuốn sẵn tiện lợi, kèm mắm nêm đậm đà.",
            cta: "Gửi tin nhắn (Send Message)"
          },
          {
            name: "TikTok Video Ad - ASMR Da Giòn",
            angle: "ASMR tiếng da heo nổ lu giòn tan giòn tan rôm rả kích thích vị giác",
            primaryText: "🔊 Bật âm lượng nghe tiếng da heo quay nướng lu giòn tan rôm rả chỉ có tại Vị Cuốn! Món ngon chuẩn vị, da giòn ngập răng cùng nước chấm mắm nêm miền Trung thần thánh. Ghé ngay Vị Cuốn Vinh chiều nay nhé bạn ơi! #vicuon #anngonvinh #monvietpremium",
            headline: "Heo quay nướng lu da giòn rôm rả - Ghé ngay Vị Cuốn!",
            description: "Thịt ngọt mọng nước, da giòn rụm, chấm mắm nêm miền Trung miền Trung.",
            cta: "Tìm hiểu thêm (Learn More)"
          }
        ]
      },
      dataReporter: {
        metrics: [
          { name: "Tổng ngân sách chi quảng cáo", target: "[Owner phê duyệt]", actual: "[Ví dụ mô phỏng: 1.050.000 VND]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt hiển thị (Impressions)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 30.000 lượt]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt tương tác đặt món (Clicks/inbox)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 600 - 800 tương tác]", completion: "Mô phỏng", status: "Mô phỏng" }
        ],
        audienceBreakdown: [
          { name: "Dân văn phòng (Ăn trưa/ship)", budget: "[Mô phỏng: 60% ngân sách]", ctr: "[Ví dụ mô phỏng: 2.1%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 12.000 - 15.000 VND/inbox]" },
          { name: "Giới trẻ Vinh (ASMR video)", budget: "[Mô phỏng: 40% ngân sách]", ctr: "[Ví dụ mô phỏng: 1.8%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 15.000 - 18.000 VND/inbox]" }
        ],
        recommendations: [
          "Báo cáo này chứa SIMULATED DATA — NOT REAL ADS PERFORMANCE.",
          "Đề xuất Owner cập nhật báo cáo thật sau khi tiến hành đăng bài/chạy ads thủ công.",
          "Tập trung ngân sách vào khung giờ 10h00 - 11h30 và 16h00 - 17h30 để đón đầu nhu cầu đặt trưa/tối."
        ],
        kpiAssumptions: [
          { metric: "Chi phí mỗi tin nhắn (CPA/Cost per Message)", assumption: "Mô phỏng khoảng 12.000 - 15.000 VND dựa trên tệp local TP Vinh" },
          { metric: "Tỷ lệ nhấp (CTR - Click-Through Rate)", assumption: "Mô phỏng 1.8% - 2.2% đối với định dạng banner/video ẩm thực bắt mắt" },
          { metric: "Tần suất hiển thị (Frequency)", assumption: "Khống chế ở mức 1.3 - 1.5 lần/người trong thời gian chiến dịch 7 ngày" },
          { metric: "Tỷ lệ chuyển đổi đơn hàng (Conversion Rate)", assumption: "Kỳ vọng khoảng 8% - 10% trên tổng số inbox khách đặt hàng" }
        ],
        reportTemplate: `--- BÁO CÁO HIỆU QUẢ CHIẾN DỊCH TUẦN (MÔ PHỎNG) ---
Thương hiệu: Vị Cuốn
Sản phẩm: Bánh tráng cuốn heo quay
Trạng thái: [SIMULATED DATA ONLY]

1. Chỉ số chính:
- Ngân sách tiêu thụ: 1.050.000 VND
- Lượt hiển thị (Impressions): 30.000 lượt
- Lượt nhấp (Clicks): 630 lượt (CTR ~2.1%)
- Lượt inbox đặt món mới: ~75 inbox (CPA ~14.000 VND)

2. Đánh giá tệp đối tượng:
- Tệp văn phòng (22-35 tuổi): 60% ngân sách, CTR tốt ở định dạng ảnh đĩa cuốn heo quay nướng lu da giòn.
- Tệp giới trẻ (18-24 tuổi): 40% ngân sách, CTR cao từ video ASMR da heo quay giòn rôm rả trên TikTok/Reels.

3. Đề xuất tối ưu (Manual Actions):
- Tiếp tục duy trì chạy bài viết giới thiệu Heo quay nướng lu da giòn vì có CPA thấp nhất.
- Bổ sung địa chỉ và hotline thật vào bài đăng để tăng tỷ lệ chốt đơn tự nhiên không qua quảng cáo.`
      }
    }
  },
  {
    id: "CAMP-COMTAM-001",
    name: "Chiến dịch Cơm Tấm Sườn Bì Chả — Cơm Tấm Bản Khói",
    phase: "Phase H.5 — Multi-brand Workspace Readiness",
    status: "Needs Review",
    brief: {
      brandName: "Cơm Tấm Bản Khói",
      industry: "F&B / cơm tấm / quán ăn địa phương tại TP.HCM",
      heroProduct: "Cơm tấm sườn bì chả",
      pricing: "[Chưa cung cấp — OWNER CUNG CẤP]",
      targetCustomer: "Nhân viên văn phòng, sinh viên, gia đình tại Quận Bình Thạnh và Quận 1, TP.HCM",
      location: "TP.HCM — Quận Bình Thạnh (bán kính ship 5km)",
      goal: "Tăng nhận diện thương hiệu và kéo khách ăn trưa/tối, đặt hàng qua Facebook/Zalo",
      duration: "7 ngày (Chiến dịch thử nghiệm)",
      offer: "[Chưa chốt ưu đãi — OWNER CUNG CẤP]",
      channels: ["Facebook", "Zalo OA"],
      toneOfVoice: "Thân thiện, gần gũi, hoài cổ ấm áp, thực tế địa phương Sài Gòn",
      exclusions: "Không ghi giá bán lẻ hay ưu đãi giả; không bịa số liệu; không claim sức khỏe quá đà",
      assets: "Ảnh cơm tấm thực tế tại quán, video bếp than nướng sườn, logo PNG"
    },
    calendar: [
      { day: "Day 1", theme: "Giới thiệu sườn nướng than", channel: "Facebook", content: "Sườn nướng bếp than đúng vị — da giòn vàng óng [Giá: OWNER CUNG CẤP]", visual: "Ảnh đĩa cơm tấm sườn bì chả nóng hổi, khói nhẹ bốc lên", cta: "[Inbox đặt bàn]", approval: "Duyệt giá chính thức" },
      { day: "Day 2", theme: "Video bếp than nướng sườn", channel: "Facebook", content: "Video 15s lửa than bùng, tiếng sườn xèo xèo hấp dẫn", visual: "Video lửa than bùng, sườn nướng trên lò", cta: "[Gọi hotline]", approval: "Duyệt hotline & địa chỉ" },
      { day: "Day 3", theme: "Bí quyết cơm tấm ngon", channel: "Zalo OA", content: "Tip nhận biết gạo tấm chuẩn — giáo dục khách hàng", visual: "Ảnh hạt gạo tấm đặc trưng cận cảnh", cta: "[Xem menu]", approval: "Duyệt thông tin sản phẩm" },
      { day: "Day 4", theme: "Bữa trưa văn phòng tiện lợi", channel: "Facebook", content: "Ship cơm tấm tận văn phòng — sườn bì chả đầy đặn", visual: "Ảnh hộp cơm đóng gói sạch sẽ trên bàn làm việc", cta: "[Inbox đặt ship]", approval: "Duyệt dịch vụ giao hàng" },
      { day: "Day 5", theme: "Tụ tập gia đình cuối tuần", channel: "Facebook", content: "Bàn ăn gia đình 4 người — cơm tấm sum vầy cuối tuần", visual: "Ảnh bàn ăn gia đình với nhiều đĩa cơm tấm", cta: "[Đặt bàn ngay]", approval: "Duyệt hotline đặt bàn" },
      { day: "Day 6", theme: "Cam kết bếp sạch", channel: "Zalo OA", content: "Nguyên liệu tươi mỗi sáng — bếp gọn gàng sạch sẽ", visual: "Ảnh bếp sạch sẽ, sườn ướp tươi, rau củ chuẩn bị mỗi sáng", cta: "[Inbox hỏi menu]", approval: "Xác minh quy trình bếp" },
      { day: "Day 7", theme: "Truyền thống đúng vị", channel: "Facebook", content: "Cơm Tấm Bản Khói — giữ vị xưa giữa Sài Gòn hôm nay", visual: "Ảnh toàn cảnh quán ấm cúng, khách đang thưởng thức", cta: "[Inbox đặt món]", approval: "Duyệt toàn bộ lịch đăng" }
    ],
    checklist: [
      { id: "ct_brand_voice", label: "Brand voice checked: Đúng phong cách thân thiện, gần gũi, hoài cổ ấm áp của Cơm Tấm Bản Khói.", checked: false },
      { id: "ct_product_info", label: "Product info checked: Đúng thông tin cơm tấm sườn bì chả.", checked: false },
      { id: "ct_price_not_fabricated", label: "Price/promotion not fabricated: Không bịa đặt giá cả hoặc khuyến mãi ảo.", checked: false },
      { id: "ct_visual_approved", label: "Visual concept approved: Ý tưởng hình ảnh thực tế, sạch sẽ, đúng không khí quán.", checked: false },
      { id: "ct_caption_approved", label: "Caption approved: Nội dung bài đăng Facebook/Zalo được kiểm duyệt kỹ càng.", checked: false },
      { id: "ct_ads_copy_approved", label: "Ads copy approved: Nội dung quảng cáo nhắm đúng tệp đối tượng tại TP.HCM.", checked: false },
      { id: "ct_no_autopost", label: "No auto-post: Xác nhận hệ thống không tự động đăng bài lên các kênh.", checked: false },
      { id: "ct_no_real_ads", label: "No real ads launched: Xác nhận không tự động kích hoạt tài khoản quảng cáo.", checked: false },
      { id: "ct_no_real_messaging", label: "No real messaging: Xác nhận không tự động gửi tin nhắn hay spam khách hàng.", checked: false },
      { id: "ct_human_approval", label: "Human approval required: Yêu cầu sự duyệt thủ công của Owner trước khi sử dụng.", checked: false }
    ],
    outputs: {
      copywriter: {
        slogans: [
          "Cơm tấm sườn bì chả — Đúng vị xưa, bếp than ấm!",
          "Bản Khói — Nơi bếp than nói chuyện với ký ức Sài Gòn",
          "Gạo tấm thơm, sườn nướng đượm khói — Bữa trưa đúng nghĩa"
        ],
        hooks: [
          "Tiếng lửa than bùng, mùi sườn nướng thoảng qua — Cơm Tấm Bản Khói nhắc bạn về bữa trưa đúng nghĩa.",
          "Gạo tấm đặc trưng, sườn nướng than thật, bì trộn đều tay — Bản Khói giữ trọn vị xưa giữa lòng Sài Gòn.",
          "Bữa trưa văn phòng ngon — sạch — đúng giờ, không cần phải đánh đổi.",
          "Ký ức bếp than của mẹ, nay có mặt ở quận Bình Thạnh.",
          "Đĩa cơm đủ đầy: sườn + bì + chả + cà chua + dưa leo. Bản Khói sẵn sàng."
        ],
        ctas: [
          "👉 [Inbox đặt bàn ngay]",
          "📞 Hotline đặt ship: [OWNER CUNG CẤP]",
          "📍 Địa chỉ: [OWNER CUNG CẤP]"
        ],
        shortCaptions: [
          "Trưa nay ăn gì? Đĩa cơm tấm sườn bì chả nướng than đượm khói tại Bản Khói — ngon đúng vị, ship tận nơi.",
          "Bếp than nướng sườn từ sáng sớm, đĩa cơm tấm đặc trưng thơm lừng. Cơm Tấm Bản Khói — bữa trưa đúng nghĩa Sài Gòn."
        ],
        hashtags: ["#comtambankhoi", "#comtamsaigon", "#anngonhcm", "#comtamsuonbicha"],
        captions: [
          {
            title: "Bài 1 (Ngày 1): Giới thiệu sườn nướng than đúng vị",
            body: "🔥 SƯỜN NƯỚNG THAN THẬT — CƠM TẤM ĐÚNG VỊ XƯA!\n\nMột đĩa cơm tấm đúng nghĩa không chỉ là cơm với sườn... Đó là tiếng lửa than bùng, mùi sườn nướng thoảng xa, lớp bì trộn đều tay, chả ướp thơm lừng — tất cả cộng lại thành ký ức bữa trưa Sài Gòn bạn không thể quên.\n\n🍚 Cơm Tấm Bản Khói — giữ trọn vị xưa, phục vụ bữa nay.\n\n👉 [Inbox đặt bàn ngay]\n📞 Hotline: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Đĩa cơm tấm sườn bì chả nóng hổi, khói nhẹ bốc lên dưới ánh sáng tự nhiên ấm"
          },
          {
            title: "Bài 2 (Ngày 4): Bữa trưa văn phòng nhanh ngon",
            body: "💼 BỮA TRƯA VĂN PHÒNG — NGON, SẠCH, ĐÚNG GIỜ\n\nKhông cần ra đường đội nắng, không cần chờ lâu. Cơm Tấm Bản Khói ship tận văn phòng — đĩa sườn bì chả đúng vị, hộp giấy gọn gàng, giữ nóng suốt đường đi.\n\nĐặt nhóm cùng đồng nghiệp — nhanh hơn, tiện hơn.\n\n👉 [Inbox đặt ship ngay]\n📞 Hotline: [OWNER CUNG CẤP]",
            visual: "Hộp cơm tấm đóng gói sạch sẽ trên bàn làm việc văn phòng, nắp hộp hé mở"
          },
          {
            title: "Bài 3 (Ngày 6): Cam kết bếp sạch nguyên liệu tươi",
            body: "🌿 NGUYÊN LIỆU TƯƠI — BẾP SẠCH — CƠM NGON MỖI NGÀY\n\nTại Bản Khói, chúng tôi tin rằng một đĩa cơm ngon bắt đầu từ nguyên liệu tươi mỗi sáng. Sườn tươi ướp kỹ, gạo tấm đặc trưng, bì trộn tay đều — quy trình không thay đổi từ ngày đầu mở quán.\n\n👉 [Inbox đặt bàn]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            visual: "Bếp gọn gàng sạch sẽ, sườn ướp tươi, rau củ chuẩn bị mỗi buổi sáng"
          }
        ]
      },
      videoEditor: {
        scripts: [
          {
            title: "Kịch bản video 1: ASMR Bếp than nướng sườn (15s)",
            hook: "Tiếng lửa than bùng, mùi sườn nướng thoảng qua...",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-4s)",
                visual: "Cận cảnh bếp than đỏ rực, từng thanh sườn đặt lên vỉ nướng, khói thơm bốc lên nghi ngút.",
                audio: "SFX: Tiếng than hồng lách tách, tiếng sườn xèo xèo trên vỉ nướng nóng.",
                note: "Macro shot bếp than — ánh lửa làm nổi bật màu vàng óng của sườn.",
                textOverlay: "SƯỜN NƯỚNG THAN THẬT"
              },
              {
                scene: "Cảnh 2 (4-11s)",
                visual: "Tay đầu bếp lật sườn khéo léo, lớp da vàng giòn bóng, đĩa cơm tấm sườn bì chả đủ đầy được bày ra bàn.",
                audio: "VO: 'Cơm tấm sườn bì chả đúng vị xưa — bếp than Bản Khói nấu cho bạn mỗi ngày.'",
                note: "Eye-level shot — nhìn ngang đĩa cơm đầy đặn để thấy rõ các lớp topping.",
                textOverlay: "CƠM TẤM ĐỦ ĐẦY — BÌ TRỘN TAY"
              },
              {
                scene: "Cảnh 3 (11-15s)",
                visual: "Slide hiển thị logo Cơm Tấm Bản Khói, thông tin địa chỉ và hotline: [OWNER CUNG CẤP].",
                audio: "VO: 'Inbox đặt bàn hoặc ship tận nơi ngay nhé!'",
                note: "Slide CTA sắc nét — nền tối, chữ trắng, logo nổi bật.",
                textOverlay: "📞 HOTLINE: [OWNER CUNG CẤP] | 📍 [ĐỊA CHỈ]"
              }
            ]
          },
          {
            title: "Kịch bản video 2: Quy trình đĩa cơm tấm đầy đặn (15s)",
            hook: "Gạo tấm, sườn, bì, chả — đủ đầy như ký ức bữa trưa Sài Gòn.",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-5s)",
                visual: "Tay đầu bếp múc cơm tấm trắng ngần vào đĩa, thêm sườn nướng vàng óng, bì trộn đều, chả nướng mềm thơm.",
                audio: "Nhạc nền nhẹ nhàng hoài cổ. Tiếng muỗng cơm chạm đĩa nhẹ.",
                note: "Top-down shot — thấy rõ quy trình bày đĩa đẹp mắt.",
                textOverlay: "CƠM TẤM BẢN KHÓI"
              },
              {
                scene: "Cảnh 2 (5-11s)",
                visual: "Khách hàng mở hộp cơm ship, nét mặt hài lòng, cầm đũa thưởng thức miếng sườn đầu tiên.",
                audio: "VO: 'Ship tận nơi — sườn vẫn nóng, bì vẫn đủ đầy.'",
                note: "Tracking shot theo khách mở hộp — cảm giác thực tế, chân thật.",
                textOverlay: "SHIP TẬN NƠI — NÓNG HỔI"
              },
              {
                scene: "Cảnh 3 (11-15s)",
                visual: "Text overlay thông tin đặt hàng: inbox/hotline/địa chỉ của Cơm Tấm Bản Khói.",
                audio: "VO: 'Đặt ngay bữa trưa hôm nay nhé!'",
                note: "Slide CTA đơn giản, dễ đọc.",
                textOverlay: "👉 INBOX ĐẶT MÓN | 📞 [OWNER CUNG CẤP]"
              }
            ]
          }
        ]
      },
      designer: {
        briefs: [
          {
            title: "Thiết kế 1: Banner Facebook giới thiệu sườn nướng than",
            layout: "Ảnh đĩa cơm tấm sườn bì chả nhìn từ trên xuống (flatlay), ánh sáng ấm vàng từ bên trái, nền gỗ cũ mộc mạc.",
            textOverlay: "CƠM TẤM SƯỜN BÌ CHẢ — BẾPHAN BẢN KHÓI",
            prompt: "A Vietnamese broken rice plate (com tam) with grilled pork ribs, shredded pork skin, Vietnamese pork cake, pickled vegetables, and tomato, overhead flatlay on rustic wooden surface, warm golden lighting, authentic street food photography, photorealistic --ar 16:9",
            visualDirection: "Flatlay overhead, ánh sáng vàng ấm từ bên trái chiếu chéo, nền gỗ cũ mộc mạc, topping đĩa cơm đầy đặn rõ nét.",
            colorStyleNote: "Tông màu nâu ấm của gỗ kết hợp với màu vàng óng của sườn nướng và màu trắng của cơm tấm — cảm giác thân quen, truyền thống Sài Gòn."
          },
          {
            title: "Thiết kế 2: Post ship cơm tấm cho dân văn phòng",
            layout: "Hộp giấy kraft đóng gói cơm tấm đặt trên bàn làm việc văn phòng, nắp hộp hé mở, nhìn thấy sườn nướng bên trong.",
            textOverlay: "BỮA TRƯA VĂN PHÒNG — SHIP TẬN NƠI",
            prompt: "An open kraft paper lunchbox containing Vietnamese com tam (broken rice with grilled pork ribs), placed on a clean office desk with laptop in background, modern professional workspace, soft natural lighting --ar 1:1",
            visualDirection: "Eye-level shot, nắp hộp mở 45 độ để thấy rõ cơm trong hộp, laptop mờ ở hậu cảnh tạo cảm giác văn phòng.",
            colorStyleNote: "Kraft nâu tự nhiên + nền trắng văn phòng sạch sẽ — tạo cảm giác tiện lợi, hiện đại và an toàn thực phẩm."
          }
        ]
      },
      adsManager: {
        angles: [
          "Angle 1: Cơm tấm sườn nướng than thật — đúng vị xưa cho dân văn phòng Sài Gòn muốn ăn trưa nhanh gọn ngon.",
          "Angle 2: Ship tận văn phòng — đĩa cơm đầy đặn không cần ra đường đội nắng trưa HCM.",
          "Angle 3: Ký ức bếp than của mẹ — Bản Khói giữ trọn vị xưa giữa lòng Sài Gòn hiện đại."
        ],
        objectives: [
          "Facebook Messages (Thu hút inbox đặt bàn/đặt ship trực tiếp)",
          "Facebook Traffic (Kéo khách xem menu và địa chỉ trên Fanpage)"
        ],
        adSets: [
          {
            name: "Dân văn phòng Bình Thạnh & Q.1 (Feed Photo)",
            budget: "[Ví dụ mô phỏng: 120.000 VND/ngày]",
            targeting: "Tuổi 22-38, bán kính 3km Quận Bình Thạnh và Quận 1, sở thích ẩm thực, cơm tấm, đặt đồ ăn",
            format: "Ảnh đĩa cơm sườn bì chả đầy đặn"
          },
          {
            name: "Gia đình & Sinh viên HCM (Reels Video)",
            budget: "[Ví dụ mô phỏng: 80.000 VND/ngày]",
            targeting: "Tuổi 18-40, bán kính 5km HCM, thích street food, cơm nhà, ẩm thực Sài Gòn",
            format: "Video ngắn ASMR bếp than nướng sườn"
          }
        ],
        testIdeas: [
          "Thử nghiệm Ảnh flatlay đĩa cơm tấm vs Ảnh hộp cơm ship văn phòng",
          "Thử nghiệm Video ASMR bếp than vs Video quy trình bày đĩa cơm"
        ],
        mockAds: [
          {
            name: "Facebook Post Ad - Văn phòng HCM",
            angle: "Ship cơm tấm tận văn phòng — không cần ra đường đội nắng trưa Sài Gòn",
            primaryText: "🍚 TRƯA NAY ĂN CƠM TẤM BẢN KHÓI — SHIP TẬN VĂN PHÒNG!\n\nSườn nướng bếp than vàng giòn, bì trộn tay đều, chả nướng thơm lừng — đủ đầy như bữa cơm nhà. Không cần ra đường đội nắng trưa Sài Gòn, Bản Khói ship tận bàn làm việc của bạn.\n\n👉 [Inbox đặt ship ngay]\n📞 Hotline: [OWNER CUNG CẤP]\n📍 Địa chỉ: [OWNER CUNG CẤP]",
            headline: "Cơm Tấm Bản Khói — Ship tận văn phòng Q.Bình Thạnh & Q.1",
            description: "Sườn nướng than đúng vị, bì trộn đều, chả nướng thơm — ship nóng tận nơi.",
            cta: "Gửi tin nhắn (Send Message)"
          },
          {
            name: "Facebook Video Ad - ASMR Bếp Than",
            angle: "ASMR tiếng than hồng nướng sườn kích thích vị giác dân Sài Gòn",
            primaryText: "🔥 Bật âm lượng nghe tiếng than hồng nướng sườn đúng vị tại Cơm Tấm Bản Khói! Sườn vàng giòn + bì trộn tay đều + chả nướng thơm = đĩa cơm tấm ký ức Sài Gòn. Ghé ngay hoặc inbox đặt ship! #comtambankhoi #saigonfood",
            headline: "Cơm Tấm Bản Khói — Sườn nướng than đúng vị xưa",
            description: "Bếp than thật, nguyên liệu tươi mỗi ngày, giữ vị xưa giữa Sài Gòn hôm nay.",
            cta: "Tìm hiểu thêm (Learn More)"
          }
        ]
      },
      dataReporter: {
        metrics: [
          { name: "Tổng ngân sách chi quảng cáo", target: "[Owner phê duyệt]", actual: "[Ví dụ mô phỏng: 700.000 VND]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt hiển thị (Impressions)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 22.000 lượt]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt inbox đặt bàn/ship", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 45–60 inbox]", completion: "Mô phỏng", status: "Mô phỏng" }
        ],
        audienceBreakdown: [
          { name: "Văn phòng Bình Thạnh & Q.1", budget: "[Mô phỏng: 55% ngân sách]", ctr: "[Ví dụ mô phỏng: 2.3%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 11.000–14.000 VND/inbox]" },
          { name: "Gia đình & Sinh viên HCM", budget: "[Mô phỏng: 45% ngân sách]", ctr: "[Ví dụ mô phỏng: 1.9%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 13.000–16.000 VND/inbox]" }
        ],
        recommendations: [
          "Báo cáo này chứa SIMULATED DATA — NOT REAL ADS PERFORMANCE.",
          "Đề xuất Owner cập nhật báo cáo thật sau khi đăng bài/chạy ads thủ công.",
          "Tập trung khung giờ 10h30–11h30 và 17h00–18h30 để đón đầu nhu cầu đặt cơm trưa/tối."
        ],
        kpiAssumptions: [
          { metric: "Chi phí mỗi inbox (CPA)", assumption: "Mô phỏng khoảng 11.000–14.000 VND dựa trên tệp địa phương HCM" },
          { metric: "Tỷ lệ nhấp (CTR)", assumption: "Mô phỏng 1.9%–2.3% đối với ảnh/video ẩm thực đường phố hấp dẫn" },
          { metric: "Tỷ lệ chuyển đổi đơn", assumption: "Kỳ vọng 7%–10% trên tổng số inbox khách thực sự đặt bàn/ship" }
        ],
        reportTemplate: `--- BÁO CÁO HIỆU QUẢ CHIẾN DỊCH TUẦN (MÔ PHỎNG) ---
Thương hiệu: Cơm Tấm Bản Khói
Sản phẩm: Cơm tấm sườn bì chả
Trạng thái: [SIMULATED DATA ONLY — Sandbox Safe Mode]

1. Chỉ số chính:
- Ngân sách tiêu thụ: 700.000 VND
- Lượt hiển thị (Impressions): 22.000 lượt
- Lượt nhấp (Clicks): ~440 lượt (CTR ~2.0%)
- Lượt inbox đặt bàn/ship mới: ~50 inbox (CPA ~14.000 VND)

2. Đánh giá tệp đối tượng:
- Tệp văn phòng (22-38 tuổi): CTR tốt từ ảnh đĩa cơm tấm đầy đặn.
- Tệp gia đình/sinh viên: CTR cao từ video ASMR bếp than nướng sườn.

3. Đề xuất tối ưu (Manual Actions):
- Bổ sung địa chỉ và hotline thật vào bài đăng để tăng tỷ lệ chốt đơn.
- Tập trung khung giờ 10h30–11h30 và 17h–18h30 cho quảng cáo.`
      }
    }
  },
  {
    id: "CAMP-FORME-001",
    name: "Chiến dịch Ra mắt Sofa Series F-1 — Forme",
    phase: "Phase H.5 — Multi-brand Workspace Readiness",
    status: "Needs Review",
    brief: {
      brandName: "Forme",
      industry: "Nội thất cao cấp / sofa và bàn ghế / premium furniture",
      heroProduct: "Sofa da Series F-1",
      pricing: "[Liên hệ để nhận báo giá — OWNER CUNG CẤP]",
      targetCustomer: "Chủ nhà trẻ 28-45 tuổi, yêu thiết kế nội thất hiện đại tại TP.HCM và Hà Nội",
      location: "TP.HCM và Hà Nội (showroom + online)",
      goal: "Tăng traffic đến showroom và generate qualified leads cho bộ sưu tập Sofa F-1",
      duration: "14 ngày (Chiến dịch ra mắt BST)",
      offer: "[Chính sách ưu đãi ra mắt — OWNER CUNG CẤP]",
      channels: ["Facebook", "Instagram"],
      toneOfVoice: "Tối giản, sang trọng, tinh tế — English-forward với tiếng Việt tự nhiên",
      exclusions: "Không bịa giá bán; không claim chất liệu sai; không hứa hẹn giao hàng cụ thể",
      assets: "Ảnh studio sofa, video lookbook, ảnh full-room setup, logo SVG"
    },
    calendar: [
      { day: "Day 1", theme: "Ra mắt Series F-1", channel: "Facebook", content: "Introducing Series F-1 — where design meets living", visual: "Studio shot sofa trắng kem, nền minimalist", cta: "[Đặt lịch xem showroom]", approval: "Duyệt thông tin BST chính xác" },
      { day: "Day 2", theme: "Sit differently.", channel: "Instagram", content: "'Sit differently.' — lifestyle statement post", visual: "Lifestyle photo phòng khách hiện đại với sofa F-1", cta: "[Xem lookbook]", approval: "Duyệt visual direction" },
      { day: "Day 3", theme: "Câu chuyện thương hiệu", channel: "Facebook", content: "Forme được tạo ra vì sao — brand story short video", visual: "Behind-the-scenes ngắn tại xưởng thiết kế", cta: "[Ghé showroom]", approval: "Duyệt brand story" },
      { day: "Day 4", theme: "Color palette F-1", channel: "Instagram", content: "3 màu sắc của Series F-1 — chọn màu của bạn", visual: "3 sofa 3 màu chụp studio cạnh nhau", cta: "[Inbox tư vấn màu]", approval: "Duyệt màu sắc chính xác" },
      { day: "Day 5", theme: "Chất liệu & Độ bền", channel: "Facebook", content: "Chất liệu thật hay tổng hợp? — giáo dục khách hàng", visual: "Close-up texture bề mặt sofa F-1, ánh sáng chiếu nghiêng", cta: "[Inbox tư vấn chất liệu]", approval: "Duyệt thông tin chất liệu chính xác" },
      { day: "Day 6", theme: "Full room setup", channel: "Facebook", content: "Phòng khách với Forme — không gian sống hoàn chỉnh", visual: "Full room shot showroom với sofa F-1 là điểm nhấn", cta: "[Đặt lịch tham quan]", approval: "Duyệt nội dung phòng mẫu" },
      { day: "Day 7", theme: "CTA Tuần 1", channel: "Facebook", content: "7 ngày, một quyết định — Series F-1 đang chờ bạn", visual: "Tổng hợp visual đẹp nhất của tuần", cta: "[Đặt lịch ngay]", approval: "Duyệt toàn bộ lịch tuần 1" }
    ],
    checklist: [
      { id: "fr_brand_voice", label: "Brand voice checked: Đúng tone tối giản, sang trọng, English-forward của Forme.", checked: false },
      { id: "fr_product_info", label: "Product info checked: Thông tin Sofa Series F-1 chính xác (chất liệu, kích thước, màu sắc).", checked: false },
      { id: "fr_price_not_fabricated", label: "Price/promotion not fabricated: Không bịa giá bán hay ưu đãi không có thật.", checked: false },
      { id: "fr_visual_approved", label: "Visual concept approved: Ý tưởng hình ảnh sang trọng, minimalist đúng brand Forme.", checked: false },
      { id: "fr_caption_approved", label: "Caption approved: Nội dung bài đăng Facebook/Instagram đúng tone thương hiệu Forme.", checked: false },
      { id: "fr_ads_copy_approved", label: "Ads copy approved: Ad copy nhắm đúng tệp homeowner 28-45 tại HCM và Hà Nội.", checked: false },
      { id: "fr_no_autopost", label: "No auto-post: Xác nhận hệ thống không tự động đăng bài lên các kênh.", checked: false },
      { id: "fr_no_real_ads", label: "No real ads launched: Xác nhận không tự động kích hoạt tài khoản quảng cáo.", checked: false },
      { id: "fr_no_real_messaging", label: "No real messaging: Xác nhận không tự động gửi tin nhắn hay DM cho khách hàng.", checked: false },
      { id: "fr_human_approval", label: "Human approval required: Yêu cầu Owner duyệt thủ công trước khi triển khai.", checked: false }
    ],
    outputs: {
      copywriter: {
        slogans: [
          "Forme — Where design lives.",
          "Series F-1: Sit differently.",
          "Không gian sống của bạn, định nghĩa lại bởi Forme."
        ],
        hooks: [
          "The sofa you choose says everything about how you live.",
          "Series F-1 — crafted for those who design every corner with intention.",
          "Không gian phòng khách của bạn xứng đáng hơn những lựa chọn thông thường.",
          "Premium leather, clean lines, lasting form. Forme F-1.",
          "Từng đường may, từng đường cong — Series F-1 được thiết kế để ở lại lâu dài."
        ],
        ctas: [
          "📅 [Đặt lịch tham quan showroom]",
          "💬 Inbox để tư vấn chất liệu và màu sắc",
          "🔗 [Xem lookbook đầy đủ — OWNER CUNG CẤP]"
        ],
        shortCaptions: [
          "Series F-1. Premium leather. Clean form. Built to last. — Ghé showroom Forme để trải nghiệm trực tiếp.",
          "Không gian sống phản ánh cách bạn sống. Sofa Forme F-1 — thiết kế có chủ ý cho những người có chủ ý."
        ],
        hashtags: ["#Forme", "#FormeFurniture", "#SeriesF1", "#noithatcaocap", "#sofahcm"],
        captions: [
          {
            title: "Bài 1 (Ngày 1): Ra mắt Series F-1",
            body: "INTRODUCING SERIES F-1 — FORME\n\nDesigned for the ones who live with intention.\n\nSeries F-1 là bộ sưu tập sofa đầu tiên của Forme — được tạo ra để làm chủ không gian phòng khách của bạn. Đường nét tối giản, chất liệu [OWNER CUNG CẤP], khung gỗ tự nhiên — bền theo thời gian, đẹp trong mọi góc nhìn.\n\n📅 [Đặt lịch tham quan showroom]\n💬 Inbox để được tư vấn màu sắc và chất liệu\n📍 Showroom: [OWNER CUNG CẤP]",
            visual: "Studio shot sofa F-1 màu trắng kem, ánh sáng tự nhiên mềm, phông nền minimalist trắng"
          },
          {
            title: "Bài 2 (Ngày 2): Sit differently.",
            body: "SIT DIFFERENTLY.\n\nNhững lựa chọn về nội thất bạn làm hôm nay sẽ định hình cách bạn sống trong nhiều năm tới.\n\nSofa Forme F-1 không chỉ là chỗ ngồi — đó là trung tâm của không gian sống bạn tạo ra. Premium leather, clean lines, solid wood frame.\n\nCome see it in person.\n📅 [Đặt lịch tham quan]\n📍 Showroom: [OWNER CUNG CẤP]",
            visual: "Lifestyle photo — phòng khách hiện đại, sofa F-1 là điểm nhấn, ánh sáng tự nhiên vàng ấm"
          },
          {
            title: "Bài 3 (Ngày 5): Chất liệu — Sự khác biệt cốt lõi",
            body: "CHẤT LIỆU THẬT HAY TỔNG HỢP? ĐÂY LÀ SỰ KHÁC BIỆT BẠN CẦN BIẾT.\n\nSeries F-1 của Forme sử dụng [chất liệu — OWNER CUNG CẤP] với độ bền và cảm giác khác biệt hoàn toàn so với vật liệu tổng hợp thông thường. Bề mặt thở tốt hơn, mềm dần theo thời gian, dễ vệ sinh.\n\nChi tiết kỹ thuật đầy đủ có tại showroom. Inbox để nhận tư vấn riêng.\n💬 [Inbox tư vấn ngay]\n📍 Showroom: [OWNER CUNG CẤP]",
            visual: "Close-up texture bề mặt sofa F-1, ánh sáng chiếu nghiêng để thấy rõ grain chất liệu"
          }
        ]
      },
      videoEditor: {
        scripts: [
          {
            title: "Kịch bản video 1: Series F-1 — First Look (30s)",
            hook: "The sofa you choose says everything about how you live.",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-8s)",
                visual: "Slow reveal: camera pan từ góc showroom tối dần sáng, tiêu điểm là sofa F-1 màu trắng kem đặt giữa không gian minimal sáng.",
                audio: "Nhạc nền ambient minimalist, không lời. Tiếng bước chân nhẹ trên sàn gỗ.",
                note: "Slow pan shot — wide to close-up focus on sofa silhouette.",
                textOverlay: "FORME — SERIES F-1"
              },
              {
                scene: "Cảnh 2 (8-22s)",
                visual: "Tay nhẹ nhàng chạm vào bề mặt sofa, detail shot texture chất liệu, toàn cảnh phòng khách với sofa là điểm nhấn, góc lifestyle tự nhiên.",
                audio: "VO (Eng): 'Crafted for those who design every corner with intention.' Nhạc nền tiếp tục.",
                note: "Macro shot texture → medium shot full room → lifestyle shot.",
                textOverlay: "DESIGNED TO LAST"
              },
              {
                scene: "Cảnh 3 (22-30s)",
                visual: "Logo Forme hiện ra trên nền trắng tối giản, kèm thông tin showroom và CTA.",
                audio: "VO: 'Visit our showroom. Find your space.'",
                note: "Fade to white — clean brand slide.",
                textOverlay: "FORME | [SHOWROOM — OWNER CUNG CẤP]"
              }
            ]
          },
          {
            title: "Kịch bản video 2: The Forme Difference (15s)",
            hook: "Premium leather, clean lines, lasting form.",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-4s)",
                visual: "Cận cảnh texture bề mặt sofa F-1 — ánh sáng chiếu nghiêng làm nổi bật grain của chất liệu.",
                audio: "Nhạc nền minimal, tiếng ambient nhẹ.",
                note: "Extreme close-up macro shot.",
                textOverlay: "PREMIUM MATERIAL"
              },
              {
                scene: "Cảnh 2 (4-11s)",
                visual: "Pull back từ close-up ra toàn cảnh sofa trong phòng khách hiện đại, ánh sáng tự nhiên đẹp.",
                audio: "VO: 'Series F-1 — sit differently.'",
                note: "Pull-back shot từ close-up ra wide.",
                textOverlay: "SERIES F-1 — SIT DIFFERENTLY"
              },
              {
                scene: "Cảnh 3 (11-15s)",
                visual: "Logo Forme + CTA đặt lịch tham quan showroom.",
                audio: "VO: 'Book a showroom visit today.'",
                note: "Clean CTA slide.",
                textOverlay: "📅 ĐẶT LỊCH THAM QUAN | FORME SHOWROOM"
              }
            ]
          }
        ]
      },
      designer: {
        briefs: [
          {
            title: "Thiết kế 1: Hero banner ra mắt Series F-1",
            layout: "Sofa F-1 màu trắng kem đặt giữa nền trắng tối giản, ánh sáng tự nhiên từ bên trái, bố cục cân đối, tỉ lệ 16:9.",
            textOverlay: "FORME — SERIES F-1 | WHERE DESIGN LIVES",
            prompt: "A minimalist luxury sofa in cream white leather on a pure white background, soft natural side lighting, modern premium furniture photography, clean lines, editorial style --ar 16:9",
            visualDirection: "Studio shot tuyệt đối tối giản — sofa là nhân vật chính. Ánh sáng tự nhiên mềm từ bên trái, bóng đổ tinh tế.",
            colorStyleNote: "Trắng kem chủ đạo trên nền trắng — contrast tạo ra từ bóng đổ và texture chất liệu, không phải màu sắc. Cảm giác premium, editorial."
          },
          {
            title: "Thiết kế 2: Instagram square — Lifestyle room shot",
            layout: "Full room setup với sofa F-1 là điểm nhấn trung tâm — phòng khách hiện đại với cây xanh, bàn cà phê, ánh sáng tự nhiên từ cửa sổ lớn.",
            textOverlay: "SIT DIFFERENTLY.",
            prompt: "A modern living room interior with a premium cream leather sofa as the focal point, natural light from large windows, indoor plants, minimalist coffee table, clean Scandinavian-inspired decor, lifestyle photography --ar 1:1",
            visualDirection: "Lifestyle shot góc 3/4 — sofa trong context phòng khách thật. Ánh sáng tự nhiên vàng ấm từ cửa sổ.",
            colorStyleNote: "Bảng màu trung tính ấm: trắng kem, be, nâu nhạt, xanh lá nhạt từ cây — tông màu không gian sống hiện đại."
          }
        ]
      },
      adsManager: {
        angles: [
          "Angle 1: Investment framing — sofa là khoản đầu tư cho không gian sống, không chỉ là đồ nội thất.",
          "Angle 2: Lifestyle statement — người chọn Forme là người sống có chủ ý, thiết kế từng chi tiết.",
          "Angle 3: New collection launch — Series F-1 ra mắt lần đầu, trải nghiệm trực tiếp tại showroom."
        ],
        objectives: [
          "Facebook/Instagram Lead Generation (Thu thập lead form đăng ký tham quan showroom)",
          "Facebook/Instagram Reach & Brand Awareness (Tăng nhận diện Forme với tệp homeowner HCM/HN)"
        ],
        adSets: [
          {
            name: "Homeowners HCM (Facebook Lead Ad)",
            budget: "[Ví dụ mô phỏng: 200.000 VND/ngày]",
            targeting: "Tuổi 28-45, TP.HCM, sở thích nội thất, thiết kế nhà, luxury goods, homeowners",
            format: "Lead form ad — ảnh studio sofa F-1"
          },
          {
            name: "Design enthusiasts HN & HCM (Instagram)",
            budget: "[Ví dụ mô phỏng: 150.000 VND/ngày]",
            targeting: "Tuổi 25-40, HCM và HN, theo dõi interior design pages, sở thích minimalist design",
            format: "Instagram carousel — lifestyle + product shots"
          }
        ],
        testIdeas: [
          "Thử nghiệm Studio white background vs Lifestyle room setup — cái nào generate lead nhiều hơn",
          "Thử nghiệm English-only copy vs Bilingual copy (Eng + Việt)"
        ],
        mockAds: [
          {
            name: "Facebook Lead Ad — Homeowners HCM",
            angle: "Đặt lịch tham quan showroom — trải nghiệm trực tiếp Series F-1 của Forme",
            primaryText: "INTRODUCING SERIES F-1 — FORME\n\nDesigned for the ones who live with intention. Premium leather, clean lines, lasting form.\n\nGhé showroom Forme để trải nghiệm trực tiếp bộ sưu tập Series F-1. Đặt lịch trong hôm nay — chuyên viên tư vấn sẽ liên hệ để sắp xếp.\n\n📅 [Đặt lịch tham quan showroom]\n📍 Showroom: [OWNER CUNG CẤP]",
            headline: "Forme Series F-1 — Premium Furniture Showroom HCM",
            description: "Đặt lịch tham quan miễn phí. Tư vấn chất liệu và màu sắc theo không gian của bạn.",
            cta: "Đăng ký ngay (Sign Up)"
          },
          {
            name: "Instagram Post Ad — Design Lifestyle",
            angle: "Lifestyle statement — sofa là trung tâm của không gian sống bạn tạo ra",
            primaryText: "Sit differently. ✦\n\nSeries F-1 was designed for those who approach their home the same way they approach their life — with intention, clarity, and an eye for what lasts.\n\nBook a showroom visit → Link in bio.\n📍 [Showroom: OWNER CUNG CẤP]\n#Forme #SeriesF1 #noithatcaocap",
            headline: "Forme — Where Design Lives",
            description: "Series F-1. Premium leather sofa collection. Now at Forme showroom.",
            cta: "Tìm hiểu thêm (Learn More)"
          }
        ]
      },
      dataReporter: {
        metrics: [
          { name: "Tổng ngân sách chi quảng cáo", target: "[Owner phê duyệt]", actual: "[Ví dụ mô phỏng: 2.450.000 VND]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt tiếp cận (Reach)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 45.000–60.000 người]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Leads đặt lịch showroom", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 25–40 leads]", completion: "Mô phỏng", status: "Mô phỏng" }
        ],
        audienceBreakdown: [
          { name: "Homeowners HCM (Lead Ad)", budget: "[Mô phỏng: 55% ngân sách]", ctr: "[Ví dụ mô phỏng: 1.2%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 50.000–80.000 VND/lead]" },
          { name: "Design enthusiasts HN & HCM", budget: "[Mô phỏng: 45% ngân sách]", ctr: "[Ví dụ mô phỏng: 2.1%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: 45.000–70.000 VND/engagement]" }
        ],
        recommendations: [
          "Báo cáo này chứa SIMULATED DATA — NOT REAL ADS PERFORMANCE.",
          "Đề xuất Owner cập nhật với dữ liệu thật sau khi chạy ads thủ công.",
          "Lead Gen objective thường hiệu quả hơn Traffic objective cho ngành nội thất cao cấp — nên test trực tiếp."
        ],
        kpiAssumptions: [
          { metric: "Chi phí mỗi lead showroom (CPL)", assumption: "Mô phỏng 50.000–80.000 VND/lead cho tệp homeowner HCM" },
          { metric: "Tỷ lệ nhấp (CTR)", assumption: "Mô phỏng 1.2%–2.1% cho creative lifestyle cao cấp" },
          { metric: "Tỷ lệ chuyển đổi showroom", assumption: "Kỳ vọng 20%–35% leads đặt lịch thực sự đến showroom" }
        ],
        reportTemplate: `--- BÁO CÁO HIỆU QUẢ CHIẾN DỊCH RA MẮT (MÔ PHỎNG) ---
Thương hiệu: Forme
Sản phẩm: Sofa da Series F-1
Trạng thái: [SIMULATED DATA ONLY — Sandbox Safe Mode]

1. Chỉ số chính:
- Ngân sách tiêu thụ: 2.450.000 VND
- Lượt tiếp cận (Reach): ~52.000 người
- Lượt nhấp (Clicks): ~800 lượt (CTR ~1.5%)
- Leads đặt lịch showroom: ~32 leads (CPL ~76.000 VND)

2. Đánh giá tệp đối tượng:
- Homeowners HCM: Lead Ad với studio photo → CPL thấp nhất.
- Design enthusiasts: Instagram carousel → engagement cao, ít lead form hơn.

3. Đề xuất tối ưu (Manual Actions):
- Test lifestyle room photo vs studio white → cái nào cho CPL thấp hơn.
- Ưu tiên remarketing tệp đã xem video >50% — họ đã có intent rõ ràng hơn.`
      }
    }
  }
];
