# Billing Module

This module handles invoice generation, payment status synchronization, and billing notifications.

## 1. Mục tiêu (Objective)
Nhận thông tin đơn hàng, khách hàng và số tiền từ n8n/Core. Gọi API cổng thanh toán (Stripe, vnpay) để sinh hóa đơn (invoice) hoặc link thanh toán, trả kết quả link về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Cấm tự ý trừ tiền**: Không tự động kích hoạt trừ tiền (charge credit cards) hoặc gửi yêu cầu đòi nợ nếu chưa có sự phê duyệt rõ ràng từ Core (`safety.final_approval_granted = true`).
- **Hành động bị cấm trong V1**:
  - Không tự hoàn tiền (No auto-refunds).
  - Không thay đổi bảng giá (pricing tiers) tự động.
- **Biến môi trường mẫu**:
  - `STRIPE_SECRET_KEY`: API Key kết nối Stripe (Placeholder).
  - `BILLING_CURRENCY`: Đơn vị tiền tệ mặc định (`VND`, `USD`).
