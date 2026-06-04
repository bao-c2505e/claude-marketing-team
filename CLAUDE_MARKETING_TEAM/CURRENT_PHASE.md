# CURRENT PHASE — Phase H-lite: Manual Export Pack

Tài liệu này dùng để theo dõi tiến độ thực hiện và trạng thái của Phase hiện tại.

## 📌 Thông tin chung
- **Phase hiện tại:** Phase H-lite — Manual Export Pack
- **Mục tiêu:** Phát triển tính năng Manual Export Pack trên giao diện Web UI, cho phép sao chép nhanh dữ liệu chiến dịch Vị Cuốn chuẩn hóa (đã làm sạch) để chuyển tiếp thủ công cho các bộ phận Content/Design/Ads mà không sử dụng bất kỳ backend hay kết nối tự động nào.
- **Trạng thái:** COMPLETED

---

## 📋 Checklist các việc cần xong

### 1. Nâng cấp Giao diện Web UI (src/App.tsx)
- [x] Thêm tab/section "Manual Export Pack" vào Sidebar.
- [x] Triển khai 6 khối dữ liệu copy/export nhanh chuẩn định dạng text/markdown:
  1. **Copy Full Campaign Pack**: Toàn bộ chiến dịch tổng hợp.
  2. **Copy Client Summary**: Tóm tắt chiến lược cho khách hàng.
  3. **Copy Editor Handoff**: Kịch bản và chỉ dẫn dựng video dọc 9:16.
  4. **Copy Designer Handoff**: Bảng mood board và 3 prompt vẽ ảnh bằng AI.
  5. **Copy Ads Draft Pack**: Cấu hình tệp target Vinh và nội dung quảng cáo.
  6. **Copy Approval Checklist**: Checklist kiểm duyệt an toàn dành cho Owner.
- [x] Tích hợp ô hiển thị textarea readonly và nút "Copy" tương ứng cho từng khối.
- [x] Tích hợp đầy đủ disclaimer an toàn cho từng file text/markdown copy:
  - Demo/mock data only.
  - Draft only / Human approval required.
  - No auto-post / No real ads launched / No real customer messaging.

### 2. Kiểm duyệt & Đẩy code lên GitHub
- [x] Kiểm tra biên dịch và build local (`npm run build`, `npm run dev`) để đảm bảo không bị vỡ giao diện (PASS).
- [x] Push commit `1eb9fdc` lên GitHub main branch.
- [x] Theo dõi Vercel deploy lên production.

---

## 🛠️ Hành động tiếp theo (Next Action)
- Nhận phản hồi kiểm duyệt Vercel production từ Owner.
- Tạo bàn giao (handoff) chốt Phase H-lite.
- Lên kế hoạch cho các phase tiếp theo dựa trên ranh giới bảo mật nghiêm ngặt.
