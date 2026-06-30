# Design Tokens — Web App

Trích từ Figma variables (page WEB, dashboard `222:1094`). Dùng chung với bản mobile.

## 1. Màu (Color)

### Primary (thương hiệu)

| Token | Hex | Dùng cho |
|---|---|---|
| Primary/100 | `#E5F7F6` | Nền nhạt, hover nhẹ |
| Primary/200 | `#91DED8` | Viền/nền phụ |
| Primary/300 | `#5ECEC6` | Gradient nền, trạng thái |
| Primary/500 | `#00B2A5` | **Màu chính** — nút CTA, nhấn |
| Primary/700 | `#008F85` | Primary đậm / hover nút |
| Primary/800 | `#00655E` | Primary đậm nhất |

### Neutral (slate)

| Token | Hex | Dùng cho |
|---|---|---|
| Neutral/50 | `#F8FAFC` | Nền trang |
| Neutral/100 | `#F1F5F9` | Nền card phụ |
| Neutral/200 | `#E2E8F0` | Đường kẻ / divider |
| Neutral/300 | `#CBD5E1` | Viền |
| Neutral/400 | `#94A3B8` | Icon mờ, text phụ |
| Neutral/500 | `#64748B` | Text phụ |
| Neutral/800 | `#1E293B` | Text tiêu đề |
| Neutral/900 | `#0F172A` | Text đậm nhất |
| Neutral/6 | `#F8F7F7` | Nền xám rất nhạt |
| neutral/white | `#FFFFFF` | Nền card, chữ trên nền màu |
| white-alpha/800 | `#FFFFFF99` | Lớp phủ trắng 60% |
| Text/text-disabled | `#717680` | Text vô hiệu hoá |

### Blue (nhánh từ "xanh")

| Token | Hex |  | Token | Hex |
|---|---|---|---|---|
| blue/50 | `#E3F2FD` | | blue/600 | `#1E88E5` |
| blue/200 | `#90CAF9` | | blue/700 | `#1976D2` |
| blue/400 | `#42A5F5` | | blue/800 | `#1565C0` |
| | | | blue/900 | `#0D47A1` |

### Red (nhánh từ "đỏ")

| Token | Hex |  | Token | Hex |
|---|---|---|---|---|
| red/50 | `#FFEBEE` | | red/600 | `#E53935` |
| red/200 | `#EF9A9A` | | red/700 | `#D32F2F` |
| red/400 | `#EF5350` | | | |

### Khác

| Token | Hex |
|---|---|
| blue-grey/500 | `#607D8B` |
| Schemes/On Surface Variant | `#49454F` |

### Gradient

Định nghĩa dạng gradient (Figma không expose hex từng stop ở variable):
`Gardient/Primary`, `Gardient/Green`, `Gardient/Blue`, `Gardient/Purple`, `Gardient/Orange`, `Gardient/Red`.

- **Gradient/Primary** (nền onboarding/web): Linear `#5ECEC6` (Primary/300) → `#FFFFFF`.
- Các nhánh từ dùng cặp màu blue/red/purple/green/orange để phân biệt nhóm nghĩa.

> ⚠️ Token đang viết sai chính tả là **"Gardient"** trong file Figma — nên sửa thành "Gradient" khi đồng bộ code.

## 2. Typography

**Font UI:** `Quicksand` (toàn bộ Latin/tiếng Việt).
**Font ký tự Hán:** `Huninn` (riêng cho Hán tự — dùng chung với bản mobile).
**Weights:** Regular `400`, Medium `500`, SemiBold `600`, Bold `700`.

| Style | Size / Line-height | Letter-spacing | Weight có sẵn |
|---|---|---|---|
| Heading/H3 | 40 / 48 | -0.30 | SemiBold |
| Heading/H4 | 32 / 38 | -0.20 | Bold |
| Heading/H5 | 24 / 30 | -0.15 | SemiBold, Bold |
| Heading/H6 | 20 / 24 | 0 | Medium, SemiBold |
| Label/Label-1 | 16 / 24 | -0.18 | Medium, SemiBold |
| Label/Label-2 | 14 / 20 | -0.16 | Regular, Medium, SemiBold, Bold |
| Label/Label-3 | 12 / 16 | -0.12 | SemiBold |
| Caption/Caption-1 | 10 / 12 | 0 | SemiBold |

## 3. Border radius

| Token | Giá trị |
|---|---|
| radius-none | `0` |
| radius-rounded | `1000` (pill — bo tròn hoàn toàn, dùng cho nút/chip) |

Card lớn dùng bo góc ~16–24px (xem [`components.md`](./components.md)).

## 4. Spacing

Figma variables hiện chỉ expose:

| Token | Giá trị |
|---|---|
| spacing-md | `8px` |
| spacing-2xl | `16px` |

> Thang spacing chưa đầy đủ. Đề xuất bổ sung `xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24` để dev nhất quán. Padding khung quan sát được trong layout là **16px**.

---

*Nguồn: `get_variable_defs` trên node `222:1094`. Một số giá trị (gradient stops, spacing đầy đủ) cần lấy trực tiếp từ layer trong Dev Mode.*
