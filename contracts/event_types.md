# Standard Event Types

This document defines the standard events sent from Core to n8n, along with their safety rules and target modules.

| Event Type | Purpose | Source | Target | Requires Approval | Can Trigger Real-World Action | Required Safety Flags | Expected Module | Expected Callback Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **CONTENT_GENERATION_REQUESTED** | Yêu cầu sinh nội dung văn bản (bài đăng, bài viết quảng cáo) | Core | n8n | NO | NO | None | `content-generator` / Inbox assistant | `COMPLETED` / `FAILED` |
| **DESIGN_ASSET_REQUESTED** | Yêu cầu sinh thiết kế đồ họa mẫu (Canva template) | Core | n8n | NO | NO | None | `canva-connector` | `COMPLETED` / `FAILED` |
| **COMFYUI_GENERATION_REQUESTED** | Yêu cầu sinh ảnh/video chất lượng cao bằng ComfyUI | Core | n8n | YES | NO | `safety.requires_approval` | `comfyui-pipeline` | `COMPLETED` / `FAILED` |
| **ADS_PACK_REQUESTED** | Yêu cầu đóng gói bộ tư liệu quảng cáo (ad sets) | Core | n8n | NO | NO | None | `meta-ads-connector` | `COMPLETED` / `FAILED` |
| **CAMPAIGN_PUBLISH_REQUESTED** | Yêu cầu xuất bản chiến dịch bài đăng lên Facebook Page | Core | n8n | YES | YES | `safety.allow_auto_publish`, `safety.final_approval_granted`, `safety.allow_real_world_action` | `facebook-publisher` | `COMPLETED` / `FAILED` / `REJECTED_BY_SAFETY` |
| **ADS_SPEND_REQUESTED** | Yêu cầu kích hoạt ngân sách chạy quảng cáo Meta Ads | Core | n8n | YES | YES | `safety.allow_ads_spend`, `safety.final_approval_granted`, `safety.allow_real_world_action` | `meta-ads-connector` | `COMPLETED` / `FAILED` / `REJECTED_BY_SAFETY` |
| **INBOX_REPLY_DRAFT_REQUESTED** | Yêu cầu LLM soạn nháp tin nhắn phản hồi khách hàng | Core | n8n | NO | NO | None | `inbox-assistant` | `COMPLETED` / `FAILED` |
| **ANALYTICS_REPORT_REQUESTED** | Yêu cầu thống kê dữ liệu hiệu suất chiến dịch | Core | n8n | NO | NO | None | `analytics-engine` | `COMPLETED` / `FAILED` |
| **BILLING_SYNC_REQUESTED** | Đồng bộ dữ liệu hóa đơn/thanh toán hóa đơn | Core | n8n | YES | YES | `safety.final_approval_granted`, `safety.allow_real_world_action` | `billing-module` | `COMPLETED` / `FAILED` / `REJECTED_BY_SAFETY` |
| **MODULE_RESULT_RECEIVED** | Báo cáo kết quả xử lý của module về n8n/Core | Module | n8n / Core | NO | NO | None | Core Callback Webhook | None |
| **APPROVAL_STATUS_CHANGED** | Core thông báo trạng thái phê duyệt thay đổi | Core | n8n | NO | NO | None | `core_event_router` / downstream | None |

---

## Chi tiết các Event Types

### 1. CONTENT_GENERATION_REQUESTED
- **Mục tiêu**: Kích hoạt việc tạo nội dung văn bản (copywriting, posts).
- **Quy tắc an toàn**: Không yêu cầu phê duyệt trước khi sinh nội dung nháp.

### 2. DESIGN_ASSET_REQUESTED
- **Mục tiêu**: Tạo thiết kế Canva nháp từ template.
- **Quy tắc an toàn**: Cho phép chạy tự động tạo nháp, trả URL Canva để xem trước.

### 3. COMFYUI_GENERATION_REQUESTED
- **Mục tiêu**: Gọi API ComfyUI sinh ảnh/video.
- **Quy tắc an toàn**: Do tác vụ nặng và tốn GPU, cần kiểm tra cờ phê duyệt `safety.requires_approval` trước khi chạy.

### 4. ADS_PACK_REQUESTED
- **Mục tiêu**: Gom nhóm bài đăng và ảnh/video thành gói quảng cáo nháp trong Meta Ads Manager.
- **Quy tắc an toàn**: Chỉ tạo bản nháp (Draft Campaign), không được kích hoạt chạy quảng cáo thật (Active status).

### 5. CAMPAIGN_PUBLISH_REQUESTED
- **Mục tiêu**: Đăng tải bài đăng lên trang Facebook Page.
- **Quy tắc an toàn**: Đây là hành động tác động thực tế. Bắt buộc phải có `final_approval_granted == true` và `allow_auto_publish == true`. Nếu thiếu, n8n phải dừng luồng và báo lỗi `REJECTED_BY_SAFETY`.

### 6. ADS_SPEND_REQUESTED
- **Mục tiêu**: Chi tiêu ngân sách quảng cáo Meta Ads thật.
- **Quy tắc an toàn**: Yêu cầu kiểm tra cờ `allow_ads_spend == true` và `final_approval_granted == true`. Tuyệt đối không được bỏ qua cổng kiểm tra (Safety Gate).

### 7. INBOX_REPLY_DRAFT_REQUESTED
- **Mục tiêu**: Phân tích tin nhắn của khách hàng và soạn thảo bản nháp phản hồi.
- **Quy tắc an toàn**: Không tự động gửi tin nhắn cho khách hàng thật (`allow_customer_messaging` phải bằng `false` trong giai đoạn sinh nháp).

### 8. ANALYTICS_REPORT_REQUESTED
- **Mục tiêu**: Đọc dữ liệu quảng cáo và báo cáo KPIs.
- **Quy tắc an toàn**: Read-only, không yêu cầu phê duyệt.

### 9. BILLING_SYNC_REQUESTED
- **Mục tiêu**: Sinh hóa đơn và link checkout.
- **Quy tắc an toàn**: Cần xác thực tính hợp lý của số tiền giao dịch và phê duyệt trước khi tạo hóa đơn thực trên hệ thống bên thứ ba.
