# WORKFLOW — Luồng Phối Hợp Nhóm AI Marketing

Tài liệu này định nghĩa quy trình phối hợp làm việc tự động và tuần tự giữa Người vận hành (Human Owner), Người điều phối AI (AI Coordinator) và 5 vai trò chuyên môn.

---

## 🔄 Chi Tiết Luồng Vận Hành (Step-by-Step Flow)

### 📌 Bước 1: Tiếp Nhận Brief Từ Owner (Owner Brief Input)
- **Hành động:** Human Owner điền và lưu file brief tại thư mục `01_campaign_briefs/` dựa trên template sẵn có.
- **Dữ liệu chuyển giao:** File `campaign_brief_template.md` đã hoàn thiện.

### 📌 Bước 2: AI Coordinator Đọc Và Phân Tích (Analysis & Task Assignment)
- **Hành động:** AI Coordinator quét thư mục brief chiến dịch mới, phân tích mục tiêu, ngân sách giả lập và chia nhỏ task cho từng Agent.
- **Dữ liệu chuyển giao:** Giao việc (tasks) tới 5 agent.

### 📌 Bước 3: Triển Khai Chuyên Môn Song Song & Tuần Tự (Agent Implementation)
1. **Copywriter** làm việc trước: Đọc brief và sản xuất các bài đăng mẫu (Caption, kịch bản thô). Lưu đầu ra vào `02_outputs/copywriter/`.
2. **Designer** và **Video Editor** làm việc tiếp theo:
   - **Designer:** Nhận caption từ Copywriter, tạo ý tưởng visual và prompt tiếng Anh chuẩn tại `02_outputs/designer/`.
   - **Video Editor:** Nhận ý tưởng, biên soạn kịch bản video chi tiết tại `02_outputs/video_editor/`.
3. **Ads Manager** làm việc song song: Đọc brief tổng để lập cấu hình target đối tượng và phân bổ ngân sách tại `02_outputs/ads_manager/`.

### 📌 Bước 4: Tổng Hợp Gói Chiến Dịch (Compile Final Campaign Pack)
- **Hành động:** AI Coordinator thu thập toàn bộ output của 4 agent trên, đóng gói thành một file báo cáo duy nhất tại thư mục `02_outputs/final_campaign_pack/`.
- **Dữ liệu chuyển giao:** File `final_pack_[YYYYMMDD].md`.

### 📌 Bước 5: Phê Duyệt Của Con Người (Human Approval)
- **Hành động:** Owner mở gói chiến dịch để kiểm tra.
- **Các lựa chọn:**
  - **APPROVED:** Bấm duyệt để kích hoạt cơ chế giả lập chạy quảng cáo.
  - **REJECTED:** Nhập lý do yêu cầu sửa đổi, Coordinator sẽ phân bổ lại task cho các agent tương ứng để làm lại.

### 📌 Bước 6: Giả Lập Chiến Dịch & Báo Cáo Hiệu Quả (Simulation & Data Reporting)
- **Hành động:** Khi được APPROVED, động cơ mô phỏng (Simulation Engine) sẽ tính toán dữ liệu phân phối giả định dựa trên ngân sách và target.
- **Data Reporter** lấy dữ liệu này, phân tích cấu trúc kết quả và viết file báo cáo hiệu quả tại `02_outputs/data_reporter/`.
