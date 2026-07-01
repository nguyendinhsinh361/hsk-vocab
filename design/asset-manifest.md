# Asset manifest — file ảnh cần đặt vào `frontend/public/img/`

Các màn pixel-accurate tham chiếu ảnh theo đường dẫn cố định dưới đây. Code đã có **fallback**:
nếu chưa có file, ảnh tự ẩn (màn vẫn hiển thị gradient + card), nên bạn có thể thả asset dần.

> Quy ước: tất cả đặt trong `frontend/public/img/` đúng tên file ở cột "Đường dẫn".

| Đường dẫn (trong /public) | Nội dung | Figma node / layer | Export |
|---|---|---|---|
| `img/tablet-bg.png` | **Ảnh nền cloud-sky phủ kín màn** (dùng cho MỌI màn onboarding mobile) | Frame nền tablet/onboarding | PNG (portrait, cover) |
| `img/onboarding-illustration.png` | *(cũ — không còn dùng)* cụm mây-trời trong suốt | `Frame 2147226183` | PNG @3x |
| `img/splash-bg.png` | Hoạ tiết hình học mờ của Splash *(tuỳ chọn — không có thì dùng gradient)* | **Splash** (`666:24042`) | PNG @2x |
| `img/logo-migii-white.svg` | Logo chữ "migii" màu trắng | `Website/Logo Migii` (trong Splash) | **SVG** (hoặc PNG @3x nền trong suốt) |

## Cách export trong Figma (view mode vẫn export được)

1. Chọn layer/frame theo cột "Figma node".
2. Panel **Properties → Export → +** → chọn định dạng + scale như cột "Export".
3. Bấm **Export <tên>** → file tải về **Downloads**.
4. Đổi tên đúng cột "Đường dẫn" rồi chép vào `frontend/public/img/`.

## Đã export sẵn (trong Downloads của bạn — chỉ cần đổi tên + chép vào `frontend/public/img/`)

- Onboarding illustration (Frame 2147226183 @3x) → đổi tên **`onboarding-illustration.png`**.
- Web background (Chọn LV @2x) → đổi tên **`web-bg.png`** (dùng cho `/onboarding/level`).
- Logo migii (Website/Logo Migii, **SVG**) → đổi tên **`logo-migii-white.svg`**.
- Cây mẫu onboarding web (Frame `500:18164`, 287×447 @3x) → đổi tên **`onboarding-tree.png`**
  (dùng ở `/onboarding`; lưu ý KHÁC `onboarding-illustration.png` 619×588 — phân biệt theo kích thước).

> Còn `splash-bg.png` (hoạ tiết hình học của Splash) là **tuỳ chọn** — chưa có thì màn Splash
> dùng gradient nền là đủ đẹp. Muốn y hệt thì export frame **Splash** (`666:24042`) @2x.

> Khi đã thả đủ asset, các màn `/m/*` sẽ hiển thị **y hệt** Figma. Thiếu asset thì chỉ thiếu phần
> hình minh hoạ, layout/màu/typography vẫn chuẩn.
