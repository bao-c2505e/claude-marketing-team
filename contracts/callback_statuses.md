# Standard Callback Statuses

This document defines the lifecycle statuses used in callbacks and database updates within The Core Agency.

| Status | Meaning | Used By | Is Terminal Status | Should Notify Owner |
| :--- | :--- | :--- | :---: | :---: |
| **RECEIVED** | Đã nhận sự kiện ban đầu từ Core | n8n | NO | NO |
| **VALIDATING** | Đang xác thực Schema hoặc điều kiện phê duyệt | n8n | NO | NO |
| **INVALID_CONTRACT** | Lỗi do Payload gửi sang sai cấu trúc hoặc không khớp JSON Schema | n8n | YES | YES |
| **REJECTED_BY_SAFETY** | Hành động bị chặn do không vượt qua được cổng an toàn (thiếu approval hoặc cờ cho phép) | n8n / Module | YES | YES |
| **QUEUED** | Tác vụ hợp lệ đã được đưa vào hàng đợi của Module | n8n / Module | NO | NO |
| **RUNNING** | Module đang thực thi tác vụ nền | Module | NO | NO |
| **NEEDS_REVIEW** | Tác vụ hoàn tất và cần người dùng kiểm tra/duyệt thủ công trên Core UI | Module / Core | NO | YES |
| **APPROVED** | Sự kiện được người dùng phê duyệt trên Core UI | Core | NO | NO |
| **REJECTED** | Sự kiện bị từ chối bởi người dùng trên Core UI | Core | YES | YES |
| **COMPLETED** | Tác vụ hoàn thành thành công và đã xuất dữ liệu kết quả | Module | YES | NO |
| **FAILED** | Xảy ra lỗi trong quá trình thực thi của Module | Module / n8n | YES | YES |
| **CANCELLED** | Tác vụ bị hủy bởi người dùng hoặc hệ thống trước khi hoàn tất | Core / n8n | YES | NO |

---

## Chi tiết các Statuses

### 1. INVALID_CONTRACT
- **Ý nghĩa**: Báo lỗi cấu trúc payload gửi từ Core sang n8n bị lỗi cú pháp hoặc thiếu trường bắt buộc.
- **Xử lý**: n8n gửi trả ngay lập tức lỗi này về Core, không gửi tiếp sang Module. Nhà phát triển Core cần kiểm tra lại logic phát sự kiện.

### 2. REJECTED_BY_SAFETY
- **Ý nghĩa**: Luồng xử lý bị chặn đứng do vi phạm chính sách an toàn (Ví dụ: sự kiện yêu cầu đăng tải bài viết thật nhưng cờ `allow_auto_publish` lại bằng `false`).
- **Xử lý**: n8n gửi phản hồi từ chối ngay lập tức, ghi nhận vào audit log.

### 3. QUEUED
- **Ý nghĩa**: Tác vụ bất đồng bộ nặng (như sinh ảnh ComfyUI) đã được nhận và xếp vào hàng đợi xử lý.

### 4. RUNNING
- **Ý nghĩa**: Tác vụ đang được chạy trực tiếp trên worker (ví dụ: GPU đang chạy workflow stable diffusion).

### 5. COMPLETED
- **Ý nghĩa**: Tác vụ kết thúc tốt đẹp. Đối với ComfyUI, trường này báo ảnh/video đã sinh xong và được cập nhật link vào payload.

### 6. FAILED
- **Ý nghĩa**: Module gặp lỗi phần cứng, lỗi API timeout, hoặc lỗi logic không thể tự khắc phục trong lúc xử lý.
- **Xử lý**: Module hoặc n8n gửi lại mã lỗi chi tiết để hiển thị lên Core UI cho quản trị viên xử lý.
