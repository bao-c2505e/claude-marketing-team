# SAFETY RULES — Quy Tắc An Toàn & Bảo Mật

Tài liệu này xác định các ranh giới an toàn tuyệt đối mà hệ thống AI Agent Marketing và Người vận hành phải tuân thủ nghiêm ngặt để tránh rủi ro về chi phí, pháp lý và bảo mật dữ liệu.

---

## 🔒 1. Ranh Giới Mô Phỏng Hóa (Simulation Boundaries)

> [!WARNING]
> Mọi hành vi vi phạm các ranh giới an toàn dưới đây sẽ bị coi là lỗi nghiêm trọng của hệ thống.

- **KHÔNG TỰ ĐỘNG ĐĂNG TẢI (NO AUTO-POST):** 
  Hệ thống tuyệt đối không có quyền tự động kết nối và đăng tải nội dung (caption, video, hình ảnh) lên các trang mạng xã hội thực tế (Facebook Fanpage, Instagram Business Account, TikTok Business) mà không có sự kiểm duyệt thủ công và bấm nút phê duyệt trực tiếp của con người bên ngoài hệ thống.
- **KHÔNG CHẠY QUẢNG CÁO THẬT (NO REAL ADS):**
  Không tích hợp API Meta Ads Manager hoặc Google Ads Manager để khởi tạo chiến dịch thật. Mọi quảng cáo đều được chạy thông qua động cơ mô phỏng tính toán dữ liệu giả lập dựa trên thuật toán nội bộ.
- **KHÔNG CHI TIÊU NGÂN SÁCH THẬT (NO BUDGET SPENDING):**
  Ngân sách ghi nhận trong hệ thống hoàn toàn là ngân sách giả lập (mô hình hóa). Không có bất kỳ thẻ tín dụng hay phương thức thanh toán thực tế nào được liên kết với Workspace này.
- **KHÔNG NHẮN TIN CHO KHÁCH HÀNG THẬT (NO REAL MESSAGING):**
  Hệ thống không tự động gửi tin nhắn SMS, Zalo, hay Facebook Messenger tới danh sách số điện thoại của người dùng thực. Các tương tác phản hồi của khách hàng (nếu có) được tạo ra ngẫu nhiên bởi cơ chế mô phỏng để huấn luyện AI phản hồi.

## 🔑 2. Bảo Mật Thông Tin Nhạy Cảm (Secrets & Credentials)

- **KHÔNG LƯU API KEY / TOKEN / PASSWORD:**
  Tuyệt đối không ghi đè, ghi chép hoặc lưu trữ bất kỳ API Key (như OpenAI Key, Anthropic Key, Meta Ads Token, Canva Dev Token...) hoặc mật khẩu vào các file markdown hay file cấu hình trong dự án.
- **Cơ chế nạp Key ngoại vi:** 
  Nếu các phase sau có tích hợp công cụ thật, các biến môi trường này phải được đọc từ file `.env` được cấu hình riêng biệt nằm ngoài phạm vi Git tracking và được mã hóa đúng tiêu chuẩn an toàn của hệ thống.
