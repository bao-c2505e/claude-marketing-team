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

## 🏆 Thành tựu mới nhất (Phase H.2 Completed)
- **Client Demo Mode:** Thêm tab mới vào Web UI cho phép trình bày bối cảnh chiến dịch và workflow phê duyệt trực tiếp trong trình duyệt — commit `75ac881`.
  - **Client View:** Campaign Overview, Key Deliverables, What Client Can Approve.
  - **Approval Status Demo:** 3 trạng thái rõ ràng — Draft ✓ → Waiting for Owner Review (Pending) → Approved for Manual Use.
  - **AI Team Workspace:** Đủ 5 role cards — Copywriter, Video Editor, Designer, Ads Manager, Data Reporter — mỗi role có nhiệm vụ, demo output và nhãn Human Sign-off Required.
- **Manual Export Pack (Phase H.1/H-lite):** 6 copy blocks còn nguyên — Full Campaign Pack, Client Summary, Editor Handoff, Designer Handoff, Ads Draft Pack, Approval Checklist.
- **Codex Review:** PASS. Production Owner checked: PASS.
- **Code Stability:** `src/App.tsx` build PASS, 0 errors. Git working tree clean. main = origin/main.

## ➡️ Các bước tiếp theo (Next Steps)
1. **Phase H.3 — Demo Polish & Sales Readiness** *(Next recommended)*:
   - Đánh bóng trải nghiệm demo Client Demo Mode cho buổi giới thiệu khách hàng SME thực tế.
   - Chuẩn bị bộ materials sales pitch bổ sung nếu cần (one-pager, FAQ, pricing overview).
   - Giữ vững ranh giới: no backend / no real API / no auto-post / no secrets.
2. **Tiếp tục bảo trì Safety Guard:** Mọi phase tiếp theo phải qua Codex review và Owner production check trước khi đóng.
