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
}

export const sampleCampaigns: Campaign[] = [
  {
    id: "CAMP-TOMTEP-001",
    name: "Chiến dịch Hè Rực Rỡ — Trà Sữa Ngập Topping",
    phase: "Phase B — First Demo Campaign Pack",
    status: "Needs Review",
    brief: {
      brandName: "Trà Sữa Tôm Tép",
      industry: "F&B - Trà sữa & Ăn vặt",
      heroProduct: "Trà sữa nướng khoai dẻo",
      pricing: "25.000 - 32.000 VND / cốc",
      targetCustomer: "Học sinh THPT (15-18 tuổi), Sinh viên ĐH Vinh, dân văn phòng ăn chiều",
      location: "TP. Vinh, Nghệ An (bán kính 5km quanh đường Lê Hồng Phong)",
      goal: "Tăng 30% doanh số ship, kéo khách check-in và đẩy món mới",
      duration: "7 ngày (01/06/2026 - 07/06/2026)",
      offer: "Mua 1 tặng 1 size L dòng trà sữa nướng khoai dẻo (3 ngày đầu) + Free trân châu trắng",
      channels: ["Facebook", "TikTok"],
      toneOfVoice: "Năng động, trẻ trung, gần gũi, sử dụng từ ngữ trendy giới trẻ",
      exclusions: "Không dùng từ sáo rỗng, tránh ngôn từ phản cảm",
      assets: "Ảnh sản phẩm nét cao, logo PNG tách nền, view ban công đẹp"
    },
    outputs: {
      copywriter: {
        slogans: [
          "Hè nóng nực, có Tôm Tép cực mát lạnh!",
          "Trân châu tự nấu — Ngon sạch chuẩn gu!",
          "Đập tan nóng hè, tràn lề topping!"
        ],
        hooks: [
          "Đừng xem video này nếu bạn đang thèm trà sữa béo ngậy đầy topping!",
          "MUA 1 TẶNG 1 trà sữa nướng khoai dẻo độc quyền lần đầu xuất hiện tại Vinh!",
          "Hé lộ quy trình tự nấu trân châu đen dai giòn sạch 100% tại Tôm Tép..."
        ],
        ctas: [
          "👉 Nhắn tin cho Fanpage ngay để nhận ưu đãi mua 1 tặng 1!",
          "📞 Hotline 0989 845 675 luôn sẵn sàng, chỉ 15 phút trà sữa mát lạnh gõ cửa!",
          "🔥 Đặt hàng ngay hôm nay để nhận thêm trân châu nhà làm miễn phí!"
        ],
        captions: [
          {
            title: "Bài 1 (Ngày 1): Mừng ra mắt MUA 1 TẶNG 1",
            body: "MUA 1 TẶNG 1 — ĐẬP TAN NÓNG HÈ CÙNG DÒNG SIÊU PHẨM MỚI!\n\nGiới trẻ Thành Vinh ơi! Hè nóng đỉnh điểm thế này thì làm sao sống thiếu một ly trà sữa mát lạnh béo ngậy được đúng không?\n\nĐể thổi bay cái nóng 40 độ, Trà Sữa Tôm Tép chính thức trình làng dòng sản phẩm mới: Trà Sữa Nướng Khoai Dẻo thơm lừng caramel, kết hợp cùng khoai dẻo siêu mịn mượt!\n\n🎉 ƯU ĐÃI ĐẶC BIỆT:\n👉 MUA 1 size L TẶNG 1 size L cùng dòng từ 01/06 đến 03/06.\n👉 Tặng thêm trân châu trắng cho toàn bộ đơn ship!\n\n======Gọi ship ngay======\nGọi ship: 0989 845 675\nĐịa chỉ: Số 12, đường Lê Hồng Phong, TP. Vinh",
            visual: "Product Hero (Cận cảnh ly trà sữa nướng khoai dẻo tươi ngon)"
          },
          {
            title: "Bài 2 (Ngày 2): Câu chuyện trân châu nhà làm sạch 100%",
            body: "BẬT MÍ HẬU TRƯỜNG: VÌ SAO TRÂN CHÂU TẠI TÔM TÉP LUÔN DA GIÒN KHÁC BIỆT?\n\nCâu trả lời cực kỳ đơn giản: Bởi vì Tôm Tép tự nhào bột và nấu mới mỗi ngày!\n✔️ Nói KHÔNG với chất bảo quản và bột màu công nghiệp.\n✔️ Trân châu được luộc đủ lửa, ủ mật ong nguyên chất ngọt thanh thanh.\n✔️ Chỉ bán trong ngày để đảm bảo mẻ mới sáng hôm sau luôn tươi mới.\n\n======Gọi ship ngay======\nGọi ship: 0989 845 675\nĐịa chỉ: Số 12, đường Lê Hồng Phong, TP. Vinh",
            visual: "Detail Shot (Nồi trân châu đen đang nấu sôi óng ánh)"
          }
        ]
      },
      videoEditor: {
        scripts: [
          {
            title: "Kịch bản TikTok 1: ASMR Rót Sữa nướng & Topping",
            sceneCount: 4,
            scenes: [
              {
                scene: "Cảnh 1 (Hook)",
                visual: "Rót dòng sữa béo ngậy tràn ngập ly trà sữa đầy đá lạnh xoáy tròn.",
                audio: "VO: 'Chờ đã! Đây là siêu phẩm sẽ thống trị mùa hè này tại Vinh!' SFX: Tiếng nước rót róc rách sống động.",
                note: "Chuyển cảnh nhanh, nhạc bắt tai (Trending Beat)"
              },
              {
                scene: "Cảnh 2",
                visual: "Múc thạch khoai dẻo vàng mịn đặt ngập tràn lên bề mặt ly nước.",
                audio: "VO: 'Khoai dẻo tự tay nhào nặn siêu mịn mượt cùng sốt caramel nướng độc quyền.' Nhạc nền lofi vui tươi.",
                note: "Quay cận cảnh Macro cực nét"
              }
            ]
          }
        ]
      },
      designer: {
        briefs: [
          {
            title: "Thiết kế 1: Banner Mua 1 Tặng 1",
            layout: "Ly trà sữa đặt lệch phải làm chủ thể chính, khoảng trống góc trái đặt chữ text overlay to nổi bật.",
            textOverlay: "MUA 1 TẶNG 1 - Dòng Trà Sữa Nướng Khoai Dẻo mới ra mắt!",
            prompt: "A glass of premium milk tea with boba pearls and yellow taro balls on top, rustic wooden table, bright summer sunlight, warm yellow and green color palette, micro food photography, 85mm lens, f/1.8, cinematic lighting, 8k resolution, photorealistic --ar 1:1"
          }
        ]
      },
      adsManager: {
        angles: [
          "Góc 1: Giá trị kinh tế (Mua 1 tặng 1 siêu hời)",
          "Góc 2: Sức khỏe & Vệ sinh (Trân châu thủ công tự nấu sạch 100%)",
          "Góc 3: Tránh nóng ngày hè Vinh (Gọi ship 15 phút đá mát lịm)"
        ],
        objectives: [
          "Facebook Messages (Thu hút tin nhắn đặt hàng)",
          "Facebook Traffic (Kéo truy cập xem menu)",
          "TikTok Video Views (Tăng viral thương hiệu sạch)"
        ],
        adSets: [
          {
            name: "Học sinh THPT Vinh (Reels Video)",
            budget: "2.500.000 VND (50%)",
            targeting: "Tuổi 15-22, bán kính 5km quanh quán, thích ăn vặt, trà sữa",
            format: "Video Reels bắt trend"
          },
          {
            name: "Dân văn phòng xế chiều (Feed Photo)",
            budget: "1.500.000 VND (30%)",
            targeting: "Tuổi 23-30, khu vực công sở trung tâm Vinh, thích order chiều",
            format: "Hình ảnh Combo nem chua + trà sữa"
          }
        ],
        testIdeas: [
          "Thử nghiệm Video Reels vs Ảnh banner tĩnh",
          "Thử nghiệm Nhạc lofi chill vs Nhạc remix bốc",
          "Thử nghiệm Video UGC review tự nhiên vs video bếp sạch cam kết"
        ]
      },
      dataReporter: {
        metrics: [
          { name: "Tổng ngân sách chi", target: "5.000.000 VND", actual: "4.950.000 VND", completion: "99.0%", status: "Đạt" },
          { name: "Lượt hiển thị (Impressions)", target: "100.000", actual: "112.500", completion: "112.5%", status: "Vượt" },
          { name: "Lượt click (Link Clicks)", target: "1.500", actual: "1.890", completion: "126.0%", status: "Vượt" },
          { name: "Số đơn chốt (Conversions)", target: "100 đơn", actual: "118 đơn", completion: "118.0%", status: "Vượt" },
          { name: "ROI giả định", target: "200.0%", actual: "257.57%", completion: "128.78%", status: "Vượt" }
        ],
        audienceBreakdown: [
          { name: "Học sinh THPT (Reels Video)", budget: "2.475.000 VND", ctr: "2.0%", conversions: "77 đơn", cpa: "32.142 VND" },
          { name: "Dân văn phòng (Feed Combo)", budget: "1.485.000 VND", ctr: "1.2%", conversions: "31 đơn", cpa: "47.903 VND" }
        ],
        recommendations: [
          "Tăng ngân sách nhóm Reels Học sinh lên 65% tổng ngân sách.",
          "Dừng các banner tĩnh thông thường có CTR dưới 1% để tối ưu CPA.",
          "Đẩy quảng cáo tệp combo xế chiều tập trung vào khung giờ 13h - 15h."
        ]
      }
    }
  }
];
