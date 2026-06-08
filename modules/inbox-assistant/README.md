# Inbox Assistant Module

This module processes incoming customer queries, classifies intent, and drafts contextual replies.

## 1. Mục tiêu (Objective)
Nhận tin nhắn đến (incoming messages) từ n8n/Core. Gọi LLM/API để phân tích chủ đề, phân loại cảm xúc (sentiment), soạn bản thảo phản hồi (draft response) và callback kết quả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Cấm tự động nhắn tin cho khách thật (No Auto-Message)**: Tuyệt đối không được tự động gửi tin nhắn phản hồi trực tiếp tới khách hàng mà không qua bước duyệt thủ công tại Core UI (`safety.allow_customer_messaging` phải bằng `true`).
- **Hành động bị cấm trong V1**:
  - Không auto-reply trực tiếp (No direct auto-replies).
  - Không tự ý phân bổ lại nhân viên hỗ trợ.
- **Biến môi trường mẫu**:
  - `OPENAI_API_KEY`: API Key để phân tích tin nhắn (Placeholder).
  - `LLM_MODEL`: Tên model sử dụng (ví dụ: `gpt-4o-mini`).
