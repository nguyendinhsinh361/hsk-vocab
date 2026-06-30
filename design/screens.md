# Mô tả màn hình — Web App

Mô tả từng màn trên page WEB theo thứ tự ưu tiên. Node id để tra cứu trong Figma.

---

## 1. Dashboard — `Desktop - 3` (`222:1094`, 1440×1000)

Màn chính của web app. Layout **3 cột**: sidebar trái (272px) · cột danh sách từ (368px) · cột khám phá/minh hoạ (740px).

### Cột trái — Nav sidebar (`214:11666`, 272×1000)
- **LOGO** (106×29) ở trên cùng.
- Menu điều hướng (item dạng `_Tabbar/*`, mỗi item 232×56):
  - **Trang chủ** (icon Home) — đang active.
  - Các `Link` phụ ("Action" + mũi tên xuống — nhóm menu mở rộng).
  - **Nạp VJP** (icon diamond) — nâng cấp/premium.
  - **Hồ sơ** (icon user-circle).
- **Get Pro CTA** (232×136) ở đáy sidebar: tiêu đề "Nâng cấp để mở khoá tất cả chủ đề và gốc từ" + nút **"Nâng cấp ngay"** (200×48).

### Cột giữa — Danh sách từ (`228:7793`, 368×948)
- **Lời chào:** "Chào bạn! 👋" + "Khám phá thế giới từ vựng ngay!"
- **Từ trong ngày** (`Frame 2147226075`, 368×74): thẻ nhỏ `Card/Default` 50×50 hiển thị **人**, kèm **Rén** / **Nhân - người** và 1 nút (79×36).
- **Danh sách nhóm từ** (`Frame 2147226091`, 368×292):
  - Header: "Danh sách nhóm từ" + link "Xem thêm ›".
  - Lưới thẻ **`Card/Sellect`** (156×102): ví dụ "Ăn uống · 12 gốc từ" (badge *Đang học*), "Con người · 12 gốc từ"… mỗi thẻ có icon chủ đề + mũi tên.
- **Gốc từ phổ biến** (`Frame 2147226092`, 368×538):
  - Header: "Gốc từ phổ biến" + "Xem thêm ›".
  - Ô **tìm kiếm** (328×40): placeholder "Tìm kiếm gốc từ...".
  - Lưới ~22 thẻ **`Card/Default`** (158×82) dạng cặp: ký tự **人** + nghĩa "Nhân - người"; một số thẻ có menu "...".

### Cột phải — Khám phá (`229:8396`, 740×948)
- **Home Card / Level** (`224:1583`, 680×124): icon + "Level 1" + "Bạn đã học 20/100 gốc từ" + nút + thanh **Progress** (640×12).
- **Cây từ (mind-map)** (`Frame 2147226172`, 657×458): thẻ gốc trung tâm `Card/Default` 194×194 = **人 / rén / nhân - người** (badge "4 từ"); các thẻ con 72px toả ra nối bằng đường cong nhiều màu: "Nhóm người", "Bác sĩ", "Người ngợm", "Con người", "Côn nhân", và chip "+10 gốc từ...".
- **Tóm tắt bài học** (`243:9226`, 432×218): "Tóm tắt bài học" + 'Thêm "人" vào bất kỳ khái niệm nào' + "Để cho ra được từ có nghĩa" + nút **"Làm bài ngay"** (400×54).

---

## 2. Onboarding web

### Chọn LV (`486:8239`, 1440×900)
Màn chọn level HSK (tương ứng "Chọn level" bản mobile). Nền là **đồ hoạ mây-trời**: gradient teal→trắng (`#5ECEC6 → #FFFFFF`) + mây, sao, quả địa cầu. Đây là background web đã export riêng. Nội dung chọn level (HSK 1–6) đặt trên nền này.

### OB1 (`486:8807`) · OB2 (`486:8806`) — 1440×900
⚠️ **Hiện trống** (artboard placeholder, chưa có nội dung). Dự kiến là 2 bước giới thiệu concept trước màn chọn level. Cần hoàn thiện.

---

## 3. Các bản desktop khác

`Desktop - 4` (`243:9432`, 1440×1000), `Desktop - 5` (`243:9989`, 1440×1000), `Desktop - 6` (`257:4336`, 1440×900), `Desktop - 8` (`371:11409`, 1440×900) và 3 frame tên **`Screen`** (`257:4767`, `382:11368`, `257:5617`, đều 1440×900).

Đây là các trạng thái/biến thể khác của web app (chi tiết nhóm từ, kết quả, danh sách…) dùng chung sidebar 272px và hệ component. Khi handoff nên đổi tên rõ ràng theo chức năng — hiện 3 frame cùng tên "Screen" và đánh số Desktop ngắt quãng (thiếu 7) gây khó tra cứu.

---

## 4. Mobile-web (375×812)

`Pre-Test` (`243:9299`), `Screen 1` (`648:6573`), `Screen 2` (`648:6721`), `Screen 3` (`648:6847`), `Screen 4` (`648:6961`).

Các bản responsive khổ điện thoại cho web (dùng `Header` 375×104 thay cho sidebar). Nội dung tương ứng luồng học/cây từ như bản app mobile.
