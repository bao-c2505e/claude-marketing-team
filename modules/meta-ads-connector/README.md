# Meta Ads Connector Module

This module interacts with the Meta Graph API to manage advertising campaigns, budgets, and creatives.

## 1. Mục tiêu (Objective)
Nhận thông tin chiến dịch, đối tượng mục tiêu, ngân sách và thiết kế sáng tạo từ n8n/Core. Gọi Meta Ads API để set up campaigns, update ad sets và upload ad creatives, báo kết quả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Cấm tự ý tiêu tiền (No Auto-Ads Spending)**: Phải chặn đứng mọi hành động tạo campaign/adset thật hoặc thay đổi ngân sách nếu `safety.allow_ads_spend` không bằng `true`.
- **Hành động bị cấm trong V1**:
  - Không tự ý tăng ngân sách (No auto-scale budget).
  - Không tự ý chạy quảng cáo ngoài đối tượng được định nghĩa.
- **Biến môi trường mẫu**:
  - `META_API_VERSION`: Phiên bản API Graph (ví dụ: `v19.0`).
  - `META_ACCESS_TOKEN`: Access token có quyền quản lý ads (Placeholder).
  - `META_AD_ACCOUNT_ID`: ID tài khoản quảng cáo của agency (Placeholder).
