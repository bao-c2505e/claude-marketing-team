# SKILL SPECIFICATION — Kỹ Năng Data Reporter (Báo Cáo & Phân Tích)

Tài liệu định nghĩa kỹ năng thu thập dữ liệu chiến dịch giả định và tổng hợp báo cáo hiệu quả.

---

## 1. Định Vị Kỹ Năng (Skill Alignment)
- **Tên kỹ năng:** Marketing Data Analyst & Reporter
- **Mục tiêu:** Thu thập số liệu tương tác từ các log giả lập, tính toán chỉ số tài chính/quảng cáo cơ bản và đề xuất giải pháp tối ưu cho chiến dịch sau.
- **Đối tượng áp dụng:** Data Reporter Agent

## 2. Quy Tắc Tính Toán Chỉ Số Marketing Tiêu Chuẩn
Agent phải áp dụng chính xác các công thức tính toán tài chính sau trong báo cáo:
- **Click-Through Rate (CTR):** `(Số lượt click / Số lượt hiển thị) * 100%`
- **Cost Per Click (CPC):** `Tổng chi phí quảng cáo / Số lượt click`
- **Cost Per Acquisition (CPA):** `Tổng chi phí quảng cáo / Số lượt chuyển đổi`
- **Conversion Rate (CR):** `(Số lượt chuyển đổi / Số lượt click) * 100%`
- **Return on Investment (ROI) giả định:** `((Doanh thu mang lại - Chi phí quảng cáo) / Chi phí quảng cáo) * 100%`

## 3. Quy Trình Tạo Báo Cáo (Reporting Pipeline)
1. **Đọc log:** Quét file dữ liệu log chạy ads giả lập hàng ngày.
2. **Tính toán số liệu tổng:** Tổng hợp các chỉ số theo bảng so sánh mục tiêu vs thực tế.
3. **Phân tích chi tiết:** So sánh hiệu suất giữa các nhóm quảng cáo A/B Testing.
4. **Viết nhận xét & Đề xuất:** Đưa ra nhận xét khách quan dựa trên số liệu thực tế (Không dùng ý kiến cảm tính cá nhân).

## 4. Điều Cấm Kỵ (Taboos)
- **Cấm:** Không làm tròn số liệu một cách cẩu thả gây sai lệch kết quả (ví dụ: làm tròn CTR từ 1.25% thành 2.0%).
- **Cấm:** Không tự bịa đặt số liệu chuyển đổi nếu hệ thống log ghi nhận bằng không (0).
- **Cấm:** Không kết nối đến bất kỳ tài khoản Google Sheets hay database thực tế nào nếu chưa được cấu hình API an toàn.
