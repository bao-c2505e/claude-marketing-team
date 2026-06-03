# WORKFLOW — Kế Hoạch Chiến Dịch 7 Ngày Cho Local Business (Mẫu)

Tài liệu hướng dẫn luồng triển khai thực tế trong 7 ngày giả định cho chiến dịch **"Hè Rực Rỡ — Trà Sữa Ngập Topping"** của thương hiệu Trà Sữa Tôm Tép tại Vinh.

---

## 📅 Lịch Trình Thực Thi 7 Ngày (7-Day Schedule)

### 🗓️ Ngày 1: Nhận Brief & Sáng Tạo Ý Tưởng Chủ Đạo (Big Idea)
- **Hành động:** 
  - Owner upload brief chiến dịch lên hệ thống.
  - AI Coordinator họp bàn và đưa ra Concept chính: *"Giải nhiệt mùa hè cùng trân châu tự nấu tươi ngon mỗi ngày"*.
- **Kết quả đầu ra:** Xác định moodboard tông ấm, trẻ trung; thông điệp chính thống nhất.

### 🗓️ Ngày 2: Sản Xuất Nội Dung Thô (Copywriting)
- **Hành động:** 
  - **Copywriter Agent** viết 3 bài post Facebook (1 bài giới thiệu ưu đãi Mua 1 Tặng 1, 1 bài chia sẻ quy trình làm thạch sạch, 1 bài mini-game).
- **Kết quả đầu ra:** 3 file nháp caption được lưu vào `02_outputs/copywriter/`.

### 🗓️ Ngày 3: Thiết Kế Visual & Kịch Bản Video
- **Hành động:**
  - **Designer Agent** lấy bài post số 1 & 2 để sinh các visual prompt tiếng Anh (mô tả sản phẩm, góc chụp detail cận cảnh).
  - **Video Editor Agent** lên kịch bản video ngắn quay cảnh múc trân châu bóng mịn đổ vào cốc trà sữa mát lạnh.
- **Kết quả đầu ra:** Prompts tại `02_outputs/designer/` và kịch bản video tại `02_outputs/video_editor/`.

### 🗓️ Ngày 4: Thiết Lập Quảng Cáo & Đóng Gói (Compilation & Ads Plan)
- **Hành động:**
  - **Ads Manager Agent** lên sơ đồ quảng cáo giả lập: Thiết lập target nhóm học sinh THPT trong bán kính 5km quanh Vinh.
  - AI Coordinator tổng hợp tất cả thành **Final Campaign Pack** tại `02_outputs/final_campaign_pack/`.
- **Kết quả đầu ra:** File đóng gói chiến dịch hoàn chỉnh sẵn sàng cho Owner xem xét.

### 🗓️ Ngày 5: Kiểm Duyệt & Kích Hoạt Giả Lập (Approval & Go-live)
- **Hành động:** 
  - Owner kiểm duyệt nội dung, hình ảnh thiết kế (prompt) và kịch bản video.
  - Thực hiện lệnh duyệt **APPROVED** trên hệ thống mô phỏng.
- **Kết quả đầu ra:** Kích hoạt giả lập chạy chiến dịch, ghi nhận log sự kiện quảng cáo.

### 🗓️ Ngày 6: Theo Dõi & Tối Ưu Hóa Nháp (Mid-Campaign Monitor)
- **Hành động:** 
  - Hệ thống giả lập xuất dữ liệu hiệu suất 2 ngày đầu chạy ads.
  - **Ads Manager** điều chỉnh nhẹ phân bổ ngân sách: chuyển 15% ngân sách từ nhóm ảnh tĩnh sang nhóm Reels.
- **Kết quả đầu ra:** Log cập nhật điều chỉnh ads.

### 🗓️ Ngày 7: Kết Thúc Chiến Dịch & Báo Cáo Hiệu Quả (Closing & Reporting)
- **Hành động:**
  - Kết thúc 7 ngày chạy giả lập.
  - **Data Reporter Agent** tập hợp dữ liệu click, hiển thị, chi phí giả định từ file log.
  - Tạo biểu đồ và báo cáo đánh giá ROI giả lập.
- **Kết quả đầu ra:** Báo cáo Markdown chi tiết lưu tại `02_outputs/data_reporter/`.
