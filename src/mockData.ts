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
      toneOfVoice: "Gần gũi, ngon miệng, thực tế, mang chất địa phương Vinh",
      exclusions: "Không ghi giá bán lẻ hay ưu đãi giả; không chứa claim sức khỏe quá đà; không bịa số liệu đơn hàng",
      assets: "Hình ảnh món ăn thực tế tại quán, logo PNG, video thô quay bằng điện thoại"
    },
    outputs: {
      copywriter: {
        slogans: [
          "Giòn rôm rả — Cuốn đậm đà",
          "Heo quay da giòn, cuốn vị Vinh",
          "Một cuốn đủ rau, đủ thịt, đủ thèm"
        ],
        hooks: [
          "ASMR chặt heo quay da giòn nổ rôm rả trên thớt gỗ sạch...",
          "Tay cuốn bánh tráng, thêm rau tươi rói, chấm đẫm mắm nêm sánh quyện...",
          "Hộp cuốn heo quay đóng gói lịch sự sẵn sàng ship tận tay văn phòng tránh nắng."
        ],
        ctas: [
          "👉 [Inbox đặt món]",
          "📞 [Hotline: OWNER CUNG CẤP]",
          "📍 [Địa chỉ: OWNER CUNG CẤP]"
        ],
        captions: [
          {
            title: "Bài 1 (Ngày 1): Giới thiệu Heo quay nướng lu da giòn",
            body: "🥓 HEO QUAY NƯỚNG LU DA GIÒN RÔM RẢ — CUỐN NGON TRỌN VỊ!\n\nBữa trưa nay ăn gì để vừa ngon, vừa sạch, lại không lo béo ngấy? Hãy thử ngay Bánh tráng cuốn heo quay tại Vị Cuốn!\n\nTừng miếng thịt heo quay nướng lu thơm lừng với lớp da giòn tan rôm rả, cuốn cùng rau sống đa dạng rửa sạch chuẩn vệ sinh, chấm đẫm nước mắm nêm đậm vị độc quyền của quán.\n\nBữa trưa chất lượng tiếp thêm năng lượng chạy deadline văn phòng!\n\n====== Đặt món ngay ======\n👉 [Inbox đặt món]\n📞 Hotline đặt ship: [Hotline: OWNER CUNG CẤP]\n📍 Địa chỉ: [Địa chỉ: OWNER CUNG CẤP]",
            visual: "Cận cảnh đĩa thịt heo quay lu da nổ giòn, khói nghi ngút thơm lừng"
          },
          {
            title: "Bài 2 (Ngày 2): Giải pháp ăn trưa văn phòng tiện lợi",
            body: "💻 BỮA TRƯA VĂN PHÒNG TIỆN LỢI & SẠCH SẼ CÙNG VỊ CUỐN\n\nKhông cần đội nắng ra đường tìm quán ăn trưa. Vị Cuốn mang đến cho văn phòng bạn hộp bánh tráng cuốn heo quay được đóng gói sạch sẽ, chỉn chu, ngon mắt.\n\nCuốn ngập tràn rau tươi và thịt giòn béo ngậy, ăn no bụng nhưng cực kỳ nhẹ nhàng cho buổi chiều làm việc hiệu quả.\n\n====== Đặt món ngay ======\n👉 [Inbox đặt món]\n📞 Hotline: [Hotline: OWNER CUNG CẤP]\n📍 Địa chỉ: [Địa chỉ: OWNER CUNG CẤP]",
            visual: "Hộp giấy đóng gói sang trọng đựng 6 cuộn bánh tráng heo quay xếp đều đặn"
          },
          {
            title: "Bài 3 (Ngày 3): Bún trộn mắm nêm đổi gió",
            body: "🍹 ĐỔI GIÓ HÔM NAY VỚI BÚN TRỘN MẮM NÊM VỊ CUỐN\n\nNếu đã quen với món cuốn, hôm nay hãy thử bún trộn mắm nêm đậm đà. Thịt heo quay lu cắt lát, rau sống tươi ngon cùng lạc rang giòn bùi, quyện trong bát mắm nêm đậm vị tỏi ớt đặc trưng Vinh.\n\nĂn no bụng, mát lòng, giải nhiệt hiệu quả ngày nắng nóng!\n\n====== Đặt món ngay ======\n👉 [Inbox đặt món]\n📞 Hotline: [Hotline: OWNER CUNG CẤP]\n📍 Địa chỉ: [Địa chỉ: OWNER CUNG CẤP]",
            visual: "Bát bún trộn đầy ắp topping rau thơm, thịt heo nướng lu vàng ruộm"
          }
        ]
      },
      videoEditor: {
        scripts: [
          {
            title: "Kịch bản video 1: ASMR chặt heo quay da giòn",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (Hook)",
                visual: "Cận cảnh dao thái dứt khoát lên miếng thịt heo quay nướng lu vàng óng.",
                audio: "SFX: Tiếng da heo nổ nứt giòn rụm rôm rả vang lên chân thực. Nhạc lofi nhẹ nhàng.",
                note: "Quay sát thớt gỗ (Macro shot), chuyển cảnh nhanh kích thích vị giác"
              },
              {
                scene: "Cảnh 2",
                visual: "Tay nhân viên bày đĩa thịt heo quay bên cạnh mẹt rau sống tươi đa dạng.",
                audio: "VO: 'Heo quay nướng lu nóng hổi, da siêu giòn thơm lừng tại Vị Cuốn.'",
                note: "Góc quay từ trên xuống (Top-down shot)"
              },
              {
                scene: "Cảnh 3 (CTA)",
                visual: "Text overlay hiển thị logo Vị Cuốn và placeholder liên hệ ship hàng.",
                audio: "VO: 'Đặt món ngay để bữa trưa sẵn sàng gõ cửa văn phòng bạn!'",
                note: "Nhạc nền tăng dần, kết thúc bằng CTA"
              }
            ]
          },
          {
            title: "Kịch bản video 2: Tay cuốn bánh tráng & chấm mắm nêm",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1 (Hook)",
                visual: "Tay một bạn trẻ trải bánh tráng, đặt rau sống tươi xanh, dưa chuột và cuộn chặt tay với thịt heo nướng.",
                audio: "SFX: Tiếng xào xạc nhẹ của rau tươi. VO: 'Một chiếc cuốn đầy đặn đủ rau, đủ thịt cho bữa chiều nhẹ bụng.'",
                note: "Góc quay cận trung (Medium close-up)"
              },
              {
                scene: "Cảnh 2",
                visual: "Cuộn bánh tráng được chấm đẫm vào bát mắm nêm sánh mịn đầy tỏi ớt băm nhỏ.",
                audio: "SFX: Tiếng chấm sốt sánh quyện thơm ngon. VO: 'Mắm nêm pha theo công thức riêng đậm đà vị local Vinh.'",
                note: "Góc quay Macro cực nét đặc tả nước chấm"
              },
              {
                scene: "Cảnh 3 (CTA)",
                visual: "Text overlay: [Inbox đặt món] | [Hotline: OWNER CUNG CẤP].",
                audio: "VO: 'Rủ hội bạn văn phòng cùng cuốn chiều nay thôi nào!'",
                note: "Slide hiển thị thông tin đặt ship"
              }
            ]
          },
          {
            title: "Kịch bản video 3: Đóng hộp ship văn phòng",
            sceneCount: 3,
            scenes: [
              {
                scene: "Cảnh 1",
                visual: "Nhân viên cẩn thận xếp từng cuộn bánh tráng heo quay vào hộp giấy sạch sẽ, thắt nơ đính kèm logo quán.",
                audio: "VO: 'Chuẩn sạch premium từ khâu đóng gói chỉn chu gửi đến văn phòng của bạn.' Nhạc nền năng động.",
                note: "Góc quay ngang tầm mắt (Eye-level shot)"
              },
              {
                scene: "Cảnh 2",
                visual: "Shipper xách túi đồ ăn đi dưới trời nắng của TP. Vinh giao tới tòa nhà công sở.",
                audio: "VO: 'Tránh nắng chiều hè, cơm trưa giao tận bàn chỉ sau 20 phút.'",
                note: "Quay chuyển động (Tracking shot)"
              },
              {
                scene: "Cảnh 3 (CTA)",
                visual: "Text overlay: [Gọi hotline: OWNER CUNG CẤP].",
                audio: "VO: 'Inbox Vị Cuốn để trưa nay ăn ngon sạch tiện lợi nhé!'",
                note: "Hiển thị thông tin liên hệ đặt hàng"
              }
            ]
          }
        ]
      },
      designer: {
        briefs: [
          {
            title: "Thiết kế 1: Ảnh cận heo quay da giòn",
            layout: "Thịt heo quay lu vàng óng thái miếng đặt lệch góc trái, góc phải đặt logo và tiêu đề món ăn sạch sẽ.",
            textOverlay: "HEO QUAY NƯỚNG LU DA GIÒN RÔM RẢ - VỊ CUỐN",
            prompt: "A close-up shot of freshly sliced roasted pork belly with crispy skin, on a white clean plate, hot steam rising, dining table setting in a modern restaurant, warm natural lighting, high resolution, 8k --ar 16:9"
          },
          {
            title: "Thiết kế 2: Mẹt cuốn rau tươi xanh",
            layout: "Mẹt tre lớn đựng đầy đủ bánh tráng, rau sống tươi mát, thịt heo quay thái mỏng xếp vòng tròn đồng tâm, bát nước chấm ở trung tâm.",
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
          "Angle 1: Bữa trưa tiện lợi tránh nắng, ship tận văn phòng cho công sở Vinh",
          "Angle 2: Trải nghiệm ẩm thực heo quay lu da giòn tan kết hợp mắm nêm đậm vị",
          "Angle 3: Món ăn cuốn nhẹ bụng, nhiều rau mát mẻ chiều lòng người sợ béo",
          "Angle 4: Đặt nhóm đông người ăn trưa/tối tại văn phòng nhận ưu đãi tiện lợi"
        ],
        objectives: [
          "Facebook Messages (Thu hút tin nhắn inbox đặt món trực tiếp)",
          "Facebook Traffic (Kéo khách hàng xem menu món cuốn trên page)",
          "TikTok Video Views (Viral video ASMR tiếng thịt giòn nổ lu)"
        ],
        adSets: [
          {
            name: "Dân văn phòng xế chiều TP Vinh (Feed Photo)",
            budget: "[Ví dụ mô phỏng: 150.000 VND/ngày]",
            targeting: "Tuổi 22-35, khu vực trung tâm TP Vinh, nhân viên công sở, sở thích ăn trưa, món cuốn",
            format: "Ảnh Combo / Hộp giấy ship cơm trưa"
          },
          {
            name: "Giới trẻ & Sinh viên Vinh (Reels Video)",
            budget: "[Ví dụ mô phỏng: 100.000 VND/ngày]",
            targeting: "Tuổi 18-24, bán kính 4km quanh trung tâm Vinh, thích street food, ăn vặt",
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
          { name: "Lượt hiển thị (Impressions)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 35.000 lượt]", completion: "Mô phỏng", status: "Mô phỏng" },
          { name: "Lượt tương tác đặt món (Clicks/inbox)", target: "[Mục tiêu giả định]", actual: "[Ví dụ mô phỏng: 850 tương tác]", completion: "Mô phỏng", status: "Mô phỏng" }
        ],
        audienceBreakdown: [
          { name: "Dân văn phòng (Ăn trưa/ship)", budget: "[Mô phỏng: 60% ngân sách]", ctr: "[Ví dụ mô phỏng: 2.1%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: Thấp]" },
          { name: "Giới trẻ (ASMR video)", budget: "[Mô phỏng: 40% ngân sách]", ctr: "[Ví dụ mô phỏng: 1.8%]", conversions: "[Chờ dữ liệu thật]", cpa: "[Mô phỏng: Trung bình]" }
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
