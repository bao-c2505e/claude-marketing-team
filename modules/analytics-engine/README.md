# Analytics Engine Module

This module performs metric aggregation, reporting, and ROI calculations for marketing campaigns.

## 1. Mục tiêu (Objective)
Nhận yêu cầu phân tích từ n8n/Core. Truy vấn số liệu thô từ các nền tảng (Meta Ads, Google Analytics, Database) và tính toán KPIs (CPA, CTR, ROI), trả báo cáo dạng JSON về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Read-only operations**: Vì đây là module phân tích (analytics), nó chỉ đọc dữ liệu và không thực hiện các hành động ghi hoặc thay đổi thiết lập quảng cáo/chi phí thật.
- **Hành động bị cấm trong V1**:
  - Không thay đổi trạng thái chiến dịch hay ngân sách quảng cáo dựa trên phân tích (No auto-optimization feedback loop to meta ads).
- **Biến môi trường mẫu**:
  - `ANALYTICS_DB_URL`: Chuỗi kết nối tới cơ sở dữ liệu số liệu (Placeholder).
  - `GA4_PROPERTY_ID`: ID tài sản Google Analytics 4 (Placeholder).
