# ANTIGRAVITY COMMAND — finalize_pack

Lệnh chỉ dẫn AI Agent tổng hợp và làm sạch gói chiến dịch cuối cùng (Final Campaign Pack).

---

## 🎯 Mục Tiêu Lệnh
Gộp tất cả các đầu ra đã qua rà soát chất lượng thành một tệp tin đóng gói duy nhất, định dạng sạch đẹp, dễ đọc để gửi trực tiếp cho Owner thẩm định và bấm nút duyệt.

---

## 🛠️ Hướng Dẫn Các Bước Đóng Gói (Compilation Steps)

### 📌 Bước 1: Thu thập sản phẩm đã duyệt
1. Đọc kết quả rà soát từ lệnh `review_outputs`. Nếu có lỗi hoặc thiếu sót, yêu cầu chỉnh sửa xong trước khi chạy lệnh này.
2. Thu thập phiên bản mới nhất của:
   - Bài đăng & kịch bản từ Copywriter.
   - Kịch bản phân cảnh chi tiết từ Video Editor.
   - Bố cục và prompts vẽ ảnh từ Designer.
   - Cấu hình ads target địa phương từ Ads Manager.

### 📌 Bước 2: Định dạng cấu trúc sạch đẹp
Sử dụng tệp mẫu [final_campaign_pack_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/03_templates/final_campaign_pack_template.md) để ráp thông tin:
1. Điền phần Tổng quan chiến dịch và Ý tưởng chủ đạo ở đầu trang.
2. Thiết lập bảng Lịch trình đăng bài 7 ngày (Content Calendar) đồng bộ.
3. Ráp chi tiết văn bản bài viết, kịch bản, và prompt ảnh theo từng ngày tương ứng.
4. Đính kèm cấu hình ads phân phối giả lập.
5. Thêm bảng biểu đồ/số liệu báo cáo hiệu suất mô phỏng.

### 📌 Bước 3: Định dạng Markdown và Liên kết
1. Định dạng tài liệu bằng cú pháp Markdown chuẩn, sử dụng các tiêu đề `##`, bảng biểu `|` và khối mã code `> ` cho bài viết để làm nổi bật nội dung.
2. Đính kèm liên kết clickable dẫn đến các file nguồn để Owner dễ dàng tra cứu chéo.

### 📌 Bước 4: Thiết lập bảng duyệt (Human Approval Checklist)
Đảm bảo phần cuối cùng của tài liệu có bảng duyệt thủ công với 2 lựa chọn rõ ràng: `APPROVED` và `REJECTED` kèm theo chỗ ghi phản hồi để kết thúc quy trình làm việc.
