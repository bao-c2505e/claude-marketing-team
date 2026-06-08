# Facebook Publisher Module

This module interacts with the Facebook Pages API to publish posts, stories, and media content.

## 1. Mục tiêu (Objective)
Nhận nội dung bài đăng (text, images, video URLs) và thông tin fanpage từ n8n/Core. Gọi Facebook Graph API để xuất bản hoặc lên lịch (schedule) bài đăng, báo cáo kết quả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Cấm tự động đăng bài (No Auto-Post)**: Chặn đứng hành động publish lên trang facebook thật nếu cờ `safety.allow_auto_publish` hoặc `safety.final_approval_granted` không bằng `true`.
- **Hành động bị cấm trong V1**:
  - Không tự ý trả lời bình luận bằng AI (No auto-replies).
  - Không tự ý xóa bài viết cũ.
- **Biến môi trường mẫu**:
  - `FB_PAGE_ID`: ID trang Facebook mục tiêu (Placeholder).
  - `FB_PAGE_ACCESS_TOKEN`: Token trang có quyền đăng bài (Placeholder).
