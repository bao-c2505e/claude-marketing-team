# FUTURE CONNECTORS — Hướng Dẫn Tích Hợp Công Cụ Thật (Phase Tương Lai)

Tài liệu định hướng kiến trúc kỹ thuật để nâng cấp hệ thống từ **Mô phỏng** lên **Vận hành thực tế** ở các phase sau.

---

## 🛠️ Các Điểm Kết Nối Đề Xuất (Suggested Integration Points)

### 1. Canva API (Tự động hóa Visual)
- **Mục đích:** Thay vì Designer chỉ xuất ra prompt bằng chữ, Canva API sẽ giúp tự động đưa các hình ảnh do AI tạo ra vào khung mẫu thiết kế có sẵn của thương hiệu, chèn chữ logo và xuất bản ảnh hoàn chỉnh.
- **Cách tích hợp:** Sử dụng Canva Developer API để gọi template thiết kế và cập nhật các layer hình ảnh/chữ thông qua script Python.

### 2. Meta Ads API & TikTok Ads API (Đẩy Ads Thật)
- **Mục đích:** Kích hoạt và quản lý chiến dịch ads thật trực tiếp từ Workspace.
- **Cách tích hợp:** Kết nối API Meta Graph để tạo Ad Campaigns, Ad Sets, và Ads từ cấu hình mà Ads Manager Agent xuất ra sau khi đã được Owner duyệt.

### 3. Google Drive & Google Sheets API (Quản lý Tài nguyên & Báo cáo)
- **Mục đích:**
  - Tự động lưu trữ bài viết, ảnh, kịch bản video lên thư mục Google Drive chung để lưu trữ lâu dài.
  - Cập nhật số liệu chi tiêu và báo cáo tương tác quảng cáo hàng ngày vào Google Sheets để chủ thương hiệu dễ theo dõi trực tuyến.
- **Cách tích hợp:** Dùng Google API Client Libraries kết hợp Service Account để ghi chép dữ liệu lên file Sheets được chia sẻ.

### 4. Hệ Thống Duyệt Qua Telegram (Telegram Approval Bot)
- **Mục đích:** Giúp Owner duyệt nhanh chiến dịch ngay trên điện thoại thay vì phải mở mã nguồn.
- **Cách tích hợp:** 
  - Tích hợp một Telegram Bot. Khi AI Coordinator tổng hợp xong gói chiến dịch, hệ thống tự động gửi tin nhắn kèm file PDF và các nút bấm: `[Duyệt - APPROVED]` / `[Yêu cầu sửa - REJECTED]`.
  - Phản hồi của Owner qua bot sẽ được gửi ngược lại hệ thống để thực hiện bước tiếp theo.

### 5. Tự Động Hóa Qua n8n (Workflow Automation)
- **Mục đích:** Thay vì viết code script kéo dữ liệu phức tạp, sử dụng công cụ n8n (self-hosted) để làm cầu nối trung gian điều phối các Agent làm việc và đẩy dữ liệu qua lại giữa Slack, Drive, Telegram và Facebook.
