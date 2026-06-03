# ANTIGRAVITY COMMAND — start_campaign

Lệnh chỉ dẫn AI Agent bắt đầu khởi tạo chiến dịch marketing dựa trên Brief yêu cầu của Owner.

---

## 🎯 Mục Tiêu Lệnh
Giúp Owner tự động hóa việc đọc Brief chiến dịch, chia việc và yêu cầu 5 phòng ban AI sản xuất sản phẩm thô một cách có hệ thống.

---

## 🛠️ Chỉ Dẫn Thực Thi Dành Cho Agent (Execution Instructions)

### 📌 Bước 1: Thu nhận và Đọc Brief đầu vào
1. Đọc tệp brief chiến dịch tại đường dẫn: [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md) hoặc file brief chiến dịch cụ thể do Owner chỉ định (Ví dụ: `campaign_brief_[Tên_Chiến_Dịch].md`).
2. Trích xuất toàn bộ các thông số kinh doanh của thương hiệu và mục tiêu chiến dịch.

### 📌 Bước 2: Xác thực thông tin (Brief Validation)
1. Kiểm tra xem các trường thông tin quan trọng có bị bỏ trống hay không (Tên thương hiệu, sản phẩm chính, giá bán, khuyến mãi chính, khu vực nhắm chọn).
2. **Xử lý thông tin thiếu:**
   - *Nếu thiếu thông tin nghiêm trọng:* Stop lệnh và gửi câu hỏi yêu cầu Owner làm rõ.
   - *Nếu thiếu thông tin không nghiêm trọng (Ví dụ: Tone of voice, nội dung cần tránh, asset có sẵn):* Hãy tự đề xuất giả định hợp lý dựa trên định vị ngành hàng và ghi rõ các đề xuất đó vào phần **"Assumptions (Giả định hệ thống)"** ở đầu các tệp tin kết quả.

### 📌 Bước 3: Triển khai sản xuất Asset cho 5 vai trò
Kích hoạt lần lượt kỹ năng (Skills) của 5 AI Agent tại thư mục `05_skills/` để sản xuất:
- **Copywriter:** Soạn bài đăng mạng xã hội và hooks. Lưu tại `02_outputs/copywriter/`.
- **Designer:** Lên layout và prompts tiếng Anh vẽ ảnh. Lưu tại `02_outputs/designer/`.
- **Video Editor:** Lên kịch bản video dọc 9:16. Lưu tại `02_outputs/video_editor/`.
- **Ads Manager:** Cấu hình ads giả lập và target. Lưu tại `02_outputs/ads_manager/`.

### 📌 Bước 4: Đóng gói và Ghi nhật ký
1. Đóng gói toàn bộ sản phẩm thành file Pack tổng hợp và lưu tại thư mục `02_outputs/final_campaign_pack/`.
2. Ghi nhận nhật ký hoạt động của phiên làm việc vào tệp [agent_activity_log.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/08_logs/agent_activity_log.md).
