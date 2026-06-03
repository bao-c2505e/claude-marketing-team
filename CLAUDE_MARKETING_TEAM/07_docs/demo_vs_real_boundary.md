# ĐỊNH VỊ RANH GIỚI — Demo/Mô phỏng vs Vận hành thủ công vs Kết nối thật

Tài liệu này phân biệt rõ ràng 3 cấp độ vận hành trong Workspace để giúp người dùng hiểu rõ phần nào là mô phỏng an toàn, phần nào có thể làm thủ công ngoài đời và phần nào có thể tự động hóa bằng API thật trong tương lai.

---

## 📊 Bảng Phân Tích Ranh Giới (Operation Boundary Matrix)

| Lĩnh vực hoạt động | Cấp độ 1: Mô phỏng (Demo / Simulation trong Workspace) | Cấp độ 2: Thực thi thủ công (Manual Copy-paste ngoài đời thực) | Cấp độ 3: Tự động hóa API thật (Future Real Connectors) |
| :--- | :--- | :--- | :--- |
| **Sáng tạo bài viết (Copywriting)** | AI Agent tạo ra các caption bản nháp lưu tại `02_outputs/copywriter/` dưới dạng file Markdown. | Người dùng mở file Markdown, copy đoạn chữ, chèn emoji và tự bấm đăng lên Fanpage Facebook thật. | Tích hợp Facebook API/Buffer API để tự động đăng trực tiếp bài viết lên Fanpage ngay khi Owner bấm duyệt. |
| **Thiết kế hình ảnh (Visual Design)** | Designer Agent tạo ra bản vẽ bố cục và viết Prompt mô tả bằng tiếng Anh chuẩn. | Người dùng copy Prompt tiếng Anh dán vào Fal.ai/Midjourney để tải ảnh về, chèn thêm logo và đăng bài. | Tích hợp trực tiếp Canva API / Fal.ai SDK để tự động vẽ ảnh, chèn chữ logo tự động và đính kèm vào bài viết. |
| **Kịch bản video (Video Editing)** | Video Editor Agent viết kịch bản phân cảnh chi tiết (visual, audio, hiệu ứng chuyển cảnh). | Người dùng đưa kịch bản cho nhân sự quay dựng thật bằng điện thoại và tải lên TikTok/CapCut thủ công. | Kết nối CapCut API hoặc các AI Video Generator (như Sora, Runway API) để tự động sinh video demo thô từ kịch bản. |
| **Chạy quảng cáo (Ads Management)** | Ads Manager Agent lên kế hoạch ngân sách và nhóm target giả định. Chạy quảng cáo bằng số liệu mô phỏng. | Người dùng mở Trình quản lý quảng cáo Meta, copy đúng nhóm đối tượng target địa lý và ngân sách để setup chiến dịch thật. | Kết nối Meta Ads API. Khi chiến dịch được phê duyệt, hệ thống tự động đẩy tham số ads lên tài khoản Meta Business thật để chạy. |
| **Báo cáo dữ liệu (Data Reporting)** | Data Reporter Agent tính toán số liệu hiển thị, CTR, CPA và doanh thu bằng dữ liệu mô phỏng (Simulated Data). | Người dùng tự mở trang quản lý của Fanpage và tài khoản quảng cáo thật để tự điền số liệu thực tế vào file Google Sheets báo cáo. | Kết nối API Google Sheets & Meta Graph API để tự động đồng bộ hóa và cập nhật báo cáo trực tuyến thời gian thực. |
| **Kiểm duyệt bài (Approval Flow)** | Ghi nhận trạng thái `APPROVED` hoặc `REJECTED` bằng cách chỉnh sửa trực tiếp ký tự trong tệp Markdown. | Owner trao đổi trực tiếp với nhân viên marketing qua Zalo/Messenger để chỉnh sửa các chi tiết bài viết. | Xây dựng Telegram Bot. Khi bài viết sẵn sàng, bot gửi ảnh và caption kèm nút nhấn Duyệt/Sửa trực tiếp trên điện thoại của Owner. |

---

## 🔒 Nguyên Tắc Cốt Lõi Về Ranh Giới (Golden Rules)
1. **Không tiêu tiền thật ở Cấp độ 1:** Toàn bộ Workspace hiện tại nằm ở **Cấp độ 1**. Tuyệt đối không yêu cầu người dùng liên kết thẻ visa hay thanh toán thực tế.
2. **Không post bài thật tự động ở Cấp độ 1:** Mọi nội dung chỉ nằm trong các file Markdown nội bộ, đảm bảo thông tin nội bộ của thương hiệu không bị rò rỉ hoặc tự động xuất bản lỗi lên trang công chúng.
3. **Mã nguồn an toàn:** Không lưu trữ API keys hay secrets trong bất kỳ tệp tin nào thuộc Workspace này.
