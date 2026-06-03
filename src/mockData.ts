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

export interface AgentOutput {
  copywriter: {
    captions: { title: string; body: string; visual: string }[];
    slogans: string[];
    hooks: string[];
    ctas: string[];
  };
  videoEditor: {
    scripts: { title: string; sceneCount: number; scenes: { scene: string; visual: string; audio: string; note: string }[] }[];
  };
  designer: {
    briefs: { title: string; layout: string; textOverlay: string; prompt: string }[];
  };
  adsManager: {
    angles: string[];
    objectives: string[];
    adSets: { name: string; budget: string; targeting: string; format: string }[];
    testIdeas: string[];
  };
  dataReporter: {
    metrics: { name: string; target: string; actual: string; completion: string; status: string }[];
    audienceBreakdown: { name: string; budget: string; ctr: string; conversions: string; cpa: string }[];
    recommendations: string[];
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
    phase: "Phase B — First Demo Campaign Pack",
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
      { id: "brand_accuracy", label: "Brand accuracy: Hình ảnh và giọng điệu bài đăng đúng phong cách \"Street food meets Premium\" của Vị Cuốn?", checked: false },
      { id: "product_accuracy", label: "Product accuracy: Bánh tráng cuốn heo quay nướng lu và các món phụ cải cuốn, bún trộn có sẵn tại quán?", checked: false },
      { id: "price_approval", label: "Price approval: Giá bán lẻ và giá combo chính thức đã được cập nhật chính xác?", checked: false },
      { id: "promotion_approval", label: "Promotion approval: Duyệt chương trình ưu đãi chính thức của tuần lễ chiến dịch?", checked: false },
      { id: "address_hotline_approval", label: "Address/hotline approval: Số điện thoại hotline và địa chỉ quán tại Vinh đã chính xác chưa?", checked: false },
      { id: "visual_approval", label: "Visual approval: Hình ảnh chụp món thật và kịch bản video đảm bảo tính chân thực, sạch sẽ?", checked: false },
      { id: "ads_budget_approval", label: "Ads budget approval: Phê duyệt ngân sách quảng cáo thực tế cho chiến dịch?", checked: false },
      { id: "publishing_approval", label: "Publishing approval: Cho phép đăng bài thủ công lên Fanpage/TikTok?", checked: false },
      { id: "customer_messaging_approval", label: "Customer messaging approval: Cho phép nhân viên trực page phản hồi khách đặt món?", checked: false },
      { id: "final_owner_approval", label: "Final owner approval: Phê duyệt tổng thể chiến dịch để đưa vào triển khai thủ công.", checked: false }
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
            sceneCount: 4,
            scenes: [
              {
                scene: "Cảnh 1 (0-3s)",
                visual: "Cận cảnh chiếc lu đất nướng heo quay, nhân viên mở nắp để khói thơm tỏa ra. Heo quay vàng ruộm óng ả.",
                audio: "SFX: Tiếng lửa lò nổ lách tách nhẹ. Nhạc nền nhẹ nhàng, không quá dồn dập.",
                note: "Close-up (Cận cảnh góc lu đất)."
              },
              {
                scene: "Cảnh 2 (3-8s)",
                visual: "Dao thái dứt khoát lên miếng thịt heo quay nướng lu trên thớt gỗ sạch. Thớ thịt heo quay chín tới, ẩm mềm, phần da heo nổ đều giòn cứng.",
                audio: "SFX: Tiếng \"rôm rả\" rõ nét khi dao cắt qua lớp da heo giòn rụm.",
                note: "Macro shot (Góc cắt sát tiếng động thớt)."
              },
              {
                scene: "Cảnh 3 (8-12s)",
                visual: "Tay người cuốn bánh tráng đầy đặn rau sống, dưa chuột, khế chua và lát heo quay, chấm ngập vào bát mắm nêm tỏi ớt.",
                audio: "VO: 'Bánh tráng cuốn heo quay nướng lu thơm lừng, chấm đẫm mắm nêm chuẩn Vị Cuốn...'",
                note: "Extreme Close-up (Góc quay cận cảnh chấm nước sốt)."
              },
              {
                scene: "Cảnh 4 (12-15s)",
                visual: "Slide tĩnh chứa logo Vị Cuốn và CTA thông tin liên hệ: [Gọi hotline: OWNER CUNG CẤP] hoặc [Địa chỉ: OWNER CUNG CẤP].",
                audio: "VO: 'Đặt món ngay cho bữa trưa nay nhé!'",
                note: "Slide tĩnh hiển thị logo và thông tin đặt ship."
              }
            ]
          },
          {
            title: "Kịch bản video 2: Quy trình chuẩn sạch của mẹt cuốn văn phòng (15s)",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-5s)",
                visual: "Tay nhân viên xếp từng cuộn bánh tráng heo quay tròn trịa vào hộp giấy kraft sạch sẽ, dán tem nhãn logo Vị Cuốn chỉn chu.",
                audio: "VO: 'Cơm trưa văn phòng chuẩn sạch premium đóng gói gọn gàng.' Nhạc nền tươi vui, nhẹ nhàng.",
                note: "Góc quay ngang tầm mắt (Eye-level shot) thắp sáng."
              },
              {
                scene: "Cảnh 2 (5-10s)",
                visual: "Shipper chuyên nghiệp xách túi đồ ăn của quán đi giao tới văn phòng. Nhân viên văn phòng mở hộp hào hứng.",
                audio: "VO: 'Giao tận nơi nhanh chóng, giữ trọn độ giòn của thịt heo quay lu.'",
                note: "Quay chuyển động (Tracking shot) mượt mà."
              },
              {
                scene: "Cảnh 3 (10-15s)",
                visual: "Text overlay: 👉 [Inbox đặt món ngay] | 📞 Hotline: [OWNER CUNG CẤP].",
                audio: "VO: 'Rủ đồng nghiệp đặt nhóm ăn trưa tránh nắng ngay nhé!'",
                note: "Slide CTA thương hiệu sắc nét."
              }
            ]
          },
          {
            title: "Kịch bản video 3: Hội bạn thân tụ tập ăn gỏi cuốn chiều mát (15s)",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (0-5s)",
                visual: "Nhóm bạn trẻ đẩy cửa quán bước vào không gian Vị Cuốn sạch sẽ, thoáng mát, nhân viên chào đón nhiệt tình.",
                audio: "SFX: Tiếng cười nói vui vẻ. Nhạc nền lofi nhẹ nhàng thư giãn.",
                note: "Góc quay rộng (Wide shot) toàn cảnh quán."
              },
              {
                scene: "Cảnh 2 (5-10s)",
                visual: "Mẹt cuốn heo quay lu khổng lồ ngập tràn màu sắc rau xanh được bày lên bàn gỗ. Các bạn cùng cuốn và chấm mắm nêm ngon lành.",
                audio: "VO: 'Chiều mát rủ hội bạn thân tụ tập giải nhiệt bằng những cuốn heo quay thanh nhẹ bụng.'",
                note: "Góc quay từ trên xuống (Top-down shot) chụp trọn mẹt cuốn."
              },
              {
                scene: "Cảnh 3 (10-15s)",
                visual: "Logo Vị Cuốn và địa chỉ quán: [📍 Địa chỉ: OWNER CUNG CẤP] hiện lên màn hình.",
                audio: "VO: 'Ghé ngay Vị Cuốn chiều nay thôi bạn ơi!'",
                note: "Slide CTA địa chỉ và hotline đặt bàn."
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
            prompt: "A clean overhead photograph of a premium Vietnamese roasted pork platter with fresh herbs, rice paper rolls, and a bowl of anchovy sauce on a light-colored wooden table, cozy high-quality restaurant interior background, daylight, photorealistic --ar 16:9"
          },
          {
            title: "Thiết kế 2: Mẹt cuốn rau tươi xanh",
            layout: "Mẹt tre lớn đựng đầy đủ bánh tráng, rau sống tươi mát rửa sạch ozone, thịt heo quay nướng lu thái mỏng xếp vòng tròn đồng tâm, bát mắm nêm ở trung tâm.",
            textOverlay: "MỘT CUỐN ĐỦ RAU - ĐỦ THỊT - ĐỦ THÈM",
            prompt: "A beautiful Vietnamese food platter with fresh rice paper rolls ingredients: sliced roasted pork belly, cucumber, herbs, rice vermicelli, dipping sauce bowl in center, rustic top-down perspective, organic food photography, cinematic lighting --ar 4:3"
          },
          {
            title: "Thiết kế 3: Canva brief cho post ăn trưa văn phòng",
            layout: "Bố cục chia hai nửa, nửa trên là hình ảnh văn phòng tươi vui ngồi ăn món cuốn sạch sẽ, nửa dưới là hộp giấy ship cơm trưa chỉn chu kèm thông tin hotline.",
            textOverlay: "BỮA TRƯA VĂN PHÒNG CHUẨN SẠCH PREMIUM - SHIPPED TO YOU",
            prompt: "A clean eco-friendly cardboard lunch box filled with neatly cut rice paper rolls, office desk background with a laptop, modern professional work lifestyle, soft lighting, sharp focus --ar 1:1"
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
        ]
      }
    }
  }
];
