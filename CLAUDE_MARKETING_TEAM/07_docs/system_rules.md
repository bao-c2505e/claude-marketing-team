# SYSTEM RULES — Quy Tắc Vận Hành Hệ Thống

Tài liệu quy định các nguyên tắc hoạt động, lưu trữ dữ liệu và phối hợp kỹ thuật trong dự án **CLAUDE_MARKETING_TEAM**.

---

## 1. Quy Tắc Tổ Chức Thư Mục (Directory Rules)
- Mọi tài nguyên của dự án phải nằm hoàn toàn trong thư mục `CLAUDE_MARKETING_TEAM/`.
- Không ghi đè hoặc tạo các thư mục bên ngoài phạm vi dự án này trừ khi có sự đồng ý rõ ràng từ Owner.
- Tên các file output của Agent phải tuân thủ định dạng chữ thường, ngăn cách bằng dấu gạch dưới và ghi rõ mã định danh (Ví dụ: `post_01_promo.md`).

## 2. Quy Tắc Đọc Ghi File Của Agent (Agent File Access Rules)
- **Copywriter Agent:** Có quyền đọc `00_brand_inputs/` và `01_campaign_briefs/`. Chỉ có quyền ghi vào `02_outputs/copywriter/`.
- **Designer Agent:** Có quyền đọc output của Copywriter tại `02_outputs/copywriter/`. Chỉ có quyền ghi vào `02_outputs/designer/`.
- **Video Editor Agent:** Có quyền đọc brief chiến dịch và ý tưởng Copywriter. Chỉ có quyền ghi vào `02_outputs/video_editor/`.
- **Ads Manager Agent:** Có quyền đọc brief chiến dịch. Chỉ có quyền ghi vào `02_outputs/ads_manager/`.
- **AI Coordinator:** Có quyền đọc toàn bộ thư mục `02_outputs/` để tổng hợp và ghi vào `02_outputs/final_campaign_pack/`.
- **Data Reporter Agent:** Chỉ đọc log từ `08_logs/` và ghi báo cáo vào `02_outputs/data_reporter/`.

## 3. Quy Tắc Đặt Tên Phiên Bản Tài Liệu (Versioning Rules)
- Gói chiến dịch tổng hợp (Final Campaign Pack) phải sử dụng hậu tố phiên bản khi có chỉnh sửa: `final_campaign_pack_v1.md`, `final_campaign_pack_v2.md`.
- Các file sửa đổi cần ghi nhận lý do sửa đổi vào phần đầu của file nháp.

## 4. Quản Lý Nhật Ký (Log Management)
- Nhật ký hoạt động của Agent phải được cập nhật sau mỗi bước xử lý chính tại `08_logs/agent_activity_log.md`.
- Log lỗi hệ thống hoặc các thay đổi về phase hoạt động phải ghi nhận tại `08_logs/phase_log.md`.
