# Canva Connector Module

This module connects with the Canva API to generate and modify design templates based on assets and guidelines.

## 1. Mục tiêu (Objective)
Nhận asset links, template IDs và text/brand guidelines từ n8n/Core. Gọi Canva API để update template, generate designs và callback asset URLs trả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Approval**: Module này không đăng bài trực tiếp, nhưng việc sinh thiết kế thương mại (commercial designs) có thể yêu cầu phê duyệt thông số nếu được bật `safety.requires_approval = true`.
- **Hành động bị cấm**: Không tự ý publish template ra công chúng (public templates) hoặc sửa đổi thiết kế đã chốt mà không có yêu cầu từ Core.
- **Biến môi trường mẫu**:
  - `CANVA_API_KEY`: API Key kết nối tài khoản Canva Developer (Placeholder).
  - `CANVA_BRAND_FOLDER_ID`: Thư mục lưu trữ assets thương hiệu.
