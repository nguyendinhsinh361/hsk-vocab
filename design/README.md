# Migii HSK Vocab — Web App Design

Tài liệu thiết kế giao diện **web app** của Migii HSK Vocab, trích xuất từ Figma (page `WEB`).
Mục tiêu: làm nguồn tham chiếu cho dev/design khi dựng và bảo trì giao diện web.

> Nguồn: Figma file `[ DESIGN ] - UNKNS` → page `↳ WEB`.
> Cập nhật: 29/06/2026. Design system dùng chung với bản mobile của app.

## Sản phẩm là gì

Web app học **từ vựng tiếng Trung theo HSK** (giao diện tiếng Việt). Concept cốt lõi: **"cây từ gốc"** — từ 1 ký tự gốc (vd 人 *rén* – nhân/người) suy ra hàng loạt từ ghép liên quan. Bản web là giao diện desktop (khung **1440px**) với layout 3 cột: điều hướng trái, danh sách từ giữa, vùng khám phá/minh hoạ phải.

## Tài liệu trong folder này

| File | Nội dung |
|---|---|
| [`README.md`](./README.md) | Tổng quan, luồng, danh mục màn hình (file này) |
| [`screens.md`](./screens.md) | Mô tả chi tiết từng màn web |
| [`design-tokens.md`](./design-tokens.md) | Màu, typography, spacing, radius (Figma variables) |
| [`components.md`](./components.md) | Spec component & layout: sidebar, card, button, header, grid |

## Danh mục màn hình (page WEB)

Page WEB có **16 artboard**: 11 bản desktop (1440px) và 5 bản mobile-web (375px).

| Màn | Node | Kích thước | Loại | Trạng thái |
|---|---|---|---|---|
| Desktop - 3 (Dashboard) | `222:1094` | 1440×1000 | Desktop | ✅ Hoàn chỉnh — màn chính |
| Desktop - 4 | `243:9432` | 1440×1000 | Desktop | Có nội dung |
| Desktop - 5 | `243:9989` | 1440×1000 | Desktop | Có nội dung |
| Desktop - 6 | `257:4336` | 1440×900 | Desktop | Có nội dung |
| Desktop - 8 | `371:11409` | 1440×900 | Desktop | Có nội dung |
| OB1 | `486:8807` | 1440×900 | Onboarding web | ⚠️ Trống (WIP) |
| OB2 | `486:8806` | 1440×900 | Onboarding web | ⚠️ Trống (WIP) |
| Chọn LV | `486:8239` | 1440×900 | Onboarding web | Nền hoàn chỉnh (chọn level) |
| Screen ×3 | `257:4767`, `382:11368`, `257:5617` | 1440×900 | Desktop | Có nội dung |
| Pre-Test | `243:9299` | 375×812 | Mobile-web | Có nội dung |
| Screen 1–4 | `648:6573/6721/6847/6961` | 375×812 | Mobile-web | Có nội dung |

> Lưu ý đặt tên: có **3 frame cùng tên "Screen"** và nhóm Desktop đánh số ngắt quãng (3,4,5,6,8 — thiếu 7). Nên đổi tên theo chức năng trước khi handoff (xem phần khuyến nghị bên dưới).

## Luồng tổng thể (web)

```
Onboarding (OB1 → OB2 → Chọn LV)  →  Dashboard (Desktop-3)  →  Học / Họ từ / Flashcards / Luyện tập …
```

- **Onboarding**: giới thiệu concept cây từ gốc + chọn level HSK (tương ứng luồng mobile Splash → Screen 1/2 → Chọn level).
- **Dashboard**: trung tâm điều hướng. Sidebar trái dẫn tới các khu vực; cột giữa hiển thị "Danh sách nhóm từ" và "Gốc từ phổ biến"; cột phải là vùng khám phá cây từ + tóm tắt bài học.

## Design system (tóm tắt)

- **Khung desktop:** 1440px; sidebar cố định **272px**; nội dung dạng card bo góc lớn.
- **Màu thương hiệu:** Primary `#00B2A5` (thang 100→800). Phụ trợ: blue, red, neutral slate. Chi tiết: [`design-tokens.md`](./design-tokens.md).
- **Font:** **Quicksand** cho toàn UI (Latin/tiếng Việt) + **Huninn** riêng cho ký tự Hán. Thang Heading H3–H6, Label 1–3, Caption.
- **Component chính:** `nav sidebar`, `Card/Default`, `Card/Sellect`, `Card Nhóm`, `Button`, `_Tabbar/*`, `Header`, `Progress`. Chi tiết: [`components.md`](./components.md).

## Khuyến nghị trước khi handoff

1. Đổi tên artboard theo chức năng (vd `Web-01-Dashboard`, `Web-OB-01`…); tránh 3 frame cùng tên "Screen".
2. Hoàn thiện **OB1, OB2** (hiện trống).
3. Thống nhất chính tả token gradient ("Gardient" → "Gradient") và nhãn tiến trình (đồng bộ với bản mobile).
4. Bổ sung thang spacing đầy đủ (hiện variables chỉ expose `md=8`, `2xl=16`).
