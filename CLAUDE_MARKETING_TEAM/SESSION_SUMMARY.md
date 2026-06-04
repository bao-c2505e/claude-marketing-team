# SESSION SUMMARY — Tóm Tắt Phiên Làm Việc

Tài liệu này tóm tắt bối cảnh, ranh giới an toàn hiện tại của dự án và các bước tiếp theo cần triển khai.

## 📝 Bối cảnh dự án (Project Context)
Chúng ta đang xây dựng **AI Marketing Team Workspace** giả lập — một môi trường offline sandbox hoàn toàn độc lập cho phép chuẩn hóa dữ liệu chiến dịch của thương hiệu **Vị Cuốn** (TP Vinh). 
Workspace cung cấp giao diện trực quan cao cấp, hỗ trợ chuẩn hóa brief sáng tạo, mô phỏng hoạt động sáng tạo của 5 AI Agents và cung cấp bộ tài liệu xuất bản thủ công (Manual Export Pack) cùng checklist an toàn nghiêm ngặt cho Owner duyệt trước khi triển khai thực tế.

## 🔒 Ranh giới an toàn cốt lõi (Safety Boundaries)
- **Độc lập tuyệt đối:** Dự án nằm tại thư mục `CLAUDE_MARKETING_TEAM/` và hoàn toàn tách biệt khỏi FnB OS V1.
- **Không tự động đăng tải bài viết (Auto-post: NO):** Toàn bộ bài đăng Facebook, kịch bản video dọc, brief thiết kế, prompts AI và ads draft được sao chép thủ công (Manual Copy) để đăng tay. Không kích hoạt auto-post API.
- **Không chạy quảng cáo thật (Real Ads: NO):** Mọi cấu hình ngân sách quảng cáo chỉ có tính chất tham khảo hoặc sao chép để thiết lập thủ công trên Facebook Ads Manager.
- **Không nhắn tin khách hàng thật (Real Messaging: NO):** Không kết nối API nhắn tin/CRM thật.
- **Không lưu credentials (Secrets: NO):** Không lưu giữ API keys, passwords hay các thông tin bảo mật khác.
- **Dữ liệu giả lập (Demo/Mock Only: YES):** Mọi chỉ số hiệu quả và báo cáo doanh thu là giả lập phục vụ cho mục đích trực quan hóa, không đại diện cho dữ liệu thực.

## 🏆 Thành tựu mới nhất (Phase H-lite Completed)
- **Manual Export Pack:** Tích hợp thành công 6 khối sao chép dữ liệu dạng Markdown/text chuẩn hóa kèm nút Copy nhanh trên Web UI:
  1. Full Campaign Pack (Tổng hợp 7 ngày).
  2. Client Summary (Tóm tắt trình bày).
  3. Editor Handoff (Kịch bản video dọc ASMR 9:16).
  4. Designer Handoff (Mood board & Prompts tiếng Anh vẽ ảnh AI).
  5. Ads Draft Pack (Tệp target Vinh 4km & Ad Copy).
  6. Approval Checklist (Checklist phê duyệt an toàn của Owner).
- **Compliance Disclaimers:** Tự động gắn kèm các nhãn cảnh báo bảo mật, yêu cầu sự duyệt của con người (Human Approval Required) và khẳng định dữ liệu giả lập trong mọi văn bản được export.
- **Code Stability:** Sửa đổi và tối ưu hóa file `src/App.tsx` chạy biên dịch PASS, build thành công cục bộ và đẩy lên GitHub repository.

## ➡️ Các bước tiếp theo (Next Steps)
1. **Kiểm duyệt Vercel Deployment:** Theo dõi và xác nhận việc build deploy commit `1eb9fdc` lên Vercel Production.
2. **Ký duyệt bàn giao (Handoff) Phase H-lite:** Nhận phê duyệt chính thức từ Owner để chốt Phase H-lite.
3. **Lập Kế Hoạch Phase Tiếp Theo (Phase H hoặc Phase I):**
   - Đề xuất các cải tiến về tính năng tương tác UI offline (ví dụ: cho phép sửa nhanh caption/slogan trước khi copy, tải về file `.zip` thủ công, hoặc cải thiện trải nghiệm chấm điểm chiến dịch).
   - Tiếp tục giữ vững ranh giới an toàn không backend/không API connector.
