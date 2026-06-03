# SOP — Quy Trình Vận Hành Tiêu Chuẩn Từ Brief Đến Output

Tài liệu này định nghĩa Quy trình vận hành tiêu chuẩn (Standard Operating Procedure - SOP) giúp biến Workspace thành một cỗ máy marketing hoạt động trơn tru dựa trên input của Owner.

---

## 📋 Chi Tiết Quy Trình 7 Bước (SOP Steps)

### 🚪 Bước 1: Owner điền brief (Brief Input)
- **Người thực hiện:** Human Owner (Chủ thương hiệu).
- **Hành động:** 
  1. Mở tệp [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md).
  2. Điền đầy đủ thông tin chiến dịch của mình.
  3. Lưu file vào thư mục `01_campaign_briefs/` dưới tên `campaign_brief_[Tên_Chiến_Dịch].md`.

### 🔍 Bước 2: AI Coordinator đọc và phân tích brief (Brief Ingestion)
- **Người thực hiện:** AI Coordinator.
- **Hành động:** 
  1. Quét thư mục `01_campaign_briefs/` để tìm file brief mới nhất.
  2. Phân tích các thông số cốt lõi: Thông điệp chính, ngân sách giả lập, ưu đãi và kênh đăng tải.
  3. Lên ý tưởng chủ đạo (Big Idea) cho chiến dịch.

### 🗺️ Bước 3: Chia việc cho 5 vai trò (Task Delegation)
- **Người thực hiện:** AI Coordinator.
- **Hành động:**
  1. Phân bổ nhiệm vụ cho **Copywriter** soạn bài đăng & kịch bản.
  2. Yêu cầu **Designer** lên bố cục thiết kế và prompts vẽ ảnh.
  3. Yêu cầu **Video Editor** viết kịch bản phân cảnh video ngắn.
  4. Yêu cầu **Ads Manager** thiết lập target đối tượng & phân bổ ngân sách.
  5. Đăng ký tiến độ dự kiến lên bảng nhật ký hoạt động.

### ✍️ Bước 4: Mỗi vai trò tạo sản phẩm (Asset Production)
- **Người thực hiện:** 5 AI Agent.
- **Hành động:**
  - Các Agent thực thi tuần tự hoặc song song dựa trên Kỹ năng (Skills) của mình:
    - **Copywriter** xuất sản phẩm tại `02_outputs/copywriter/`.
    - **Designer** và **Video Editor** kế thừa bài đăng của Copywriter để xuất sản phẩm tại thư mục tương ứng.
    - **Ads Manager** thiết lập sơ đồ nhóm ads tại `02_outputs/ads_manager/`.

### 📦 Bước 5: Tổng hợp gói chiến dịch cuối cùng (Compilation)
- **Người thực hiện:** AI Coordinator.
- **Hành động:**
  1. Đọc và thu thập toàn bộ các file đầu ra riêng rẽ của 4 Agent tại `02_outputs/`.
  2. Tích hợp chúng thành một file đóng gói duy nhất theo mẫu tại [final_campaign_pack_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/03_templates/final_campaign_pack_template.md).
  3. Lưu file hoàn thiện vào `02_outputs/final_campaign_pack/` dưới tên `final_campaign_pack_[Tên_Chiến_Dịch].md`.

### 👁️ Bước 6: Owner duyệt (Human Review & Approval)
- **Người thực hiện:** Human Owner (Chủ thương hiệu).
- **Hành động:**
  1. Mở file pack đã đóng gói ở Bước 5 để duyệt nội dung.
  2. Đánh giá checklist phê duyệt:
     - Nếu **APPROVED:** Kích hoạt giả lập chạy thử nghiệm chiến dịch để Data Reporter thu thập log và viết báo cáo hiệu quả tại `02_outputs/data_reporter/`.
     - Nếu **REJECTED:** Ghi lại phản hồi chi tiết vào log, yêu cầu Coordinator điều phối Agent sửa đổi lại cho đúng ý.

### 📢 Bước 7: Triển khai thật ngoài đời (Optional Real-World Execution)
- **Người thực hiện:** Nhân sự thật của doanh nghiệp (Con người).
- **Hành động:**
  1. Copy-paste caption đã duyệt đăng lên trang Facebook/Instagram của quán.
  2. Copy kịch bản video chuyển cho Editor quay dựng thật.
  3. Dùng prompt tiếng Anh đưa vào công cụ AI để sinh ảnh chèn logo làm banner.
  4. Dùng cấu hình nhóm đối tượng để thiết lập ads trên Meta/TikTok Ads Manager thật.
