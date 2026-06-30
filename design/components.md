# Component & Layout Spec — Web App

Kích thước trích từ Figma metadata (page WEB). Đơn vị px @1x. Màu/typography xem [`design-tokens.md`](./design-tokens.md).

## Layout khung desktop

- **Khung:** 1440px (artboard 1440×900 hoặc 1440×1000).
- **3 cột:** Sidebar **272** · cột danh sách **368** · cột khám phá **740**.
- **Padding khung:** 16px. Card lớn bo góc ~16–24px; nút/chip bo tròn (radius-rounded = pill).

```
┌────────────┬───────────────────┬──────────────────────────┐
│ Sidebar    │ Word-list column  │ Explore / illustration   │
│ 272        │ 368               │ 740                      │
│ LOGO       │ Lời chào          │ Level card (Progress)    │
│ Nav items  │ Từ trong ngày     │ Cây từ (mind-map)        │
│ …          │ Danh sách nhóm từ │ Tóm tắt bài học + CTA    │
│ Get Pro    │ Gốc từ phổ biến   │                          │
└────────────┴───────────────────┴──────────────────────────┘
```

## Components

### Nav sidebar (`nav sidebar 1`)
- **Width cố định 272px**; cao theo artboard (1000 hoặc 900).
- Chứa: LOGO (106×29), danh sách nav item, khối Get Pro CTA ở đáy.

### Nav item — `_Tabbar/Home`, `_Tabbar/Premium`
- Kích thước **232×56**. Cấu trúc: Icon (slot 44×44, glyph 24–32) + label (Label-1) + (tuỳ chọn) `arrow-right-01`.
- Trạng thái active: nền Primary nhạt + chữ/icon Primary.
- `Link` phụ trong sidebar: 120×56 hoặc 82×56 (item co theo nội dung, có `Migii/Outline/Arrow-down` khi mở rộng).

### Button
- Biến thể theo ngữ cảnh (width tuỳ chỗ), cao **36 / 40 / 48 / 54**:
  - CTA lớn (vd "Làm bài ngay"): **400×54**.
  - Nút trong ô tìm kiếm/list: **328×40**.
  - Nút Get Pro ("Nâng cấp ngay"): **200×48**.
  - Nút nhỏ trong card: **79×36**, **124×36**, **79×40**.
  - Mobile primary: **343×48**.
- Bo tròn pill; nền Primary/500, hover Primary/700; chữ trắng (Label-1 SemiBold).

### Card/Default
- Component dùng nhiều nhất (~194 instance). Thẻ "ký tự Hán + pinyin + nghĩa".
- Kích thước phổ biến:
  - **158×82** — thẻ gốc từ trong list (mặc định).
  - **194×194** — thẻ gốc trung tâm (hero) trong mind-map.
  - **183/184/169/166/157×72** — thẻ con (nhánh) trong mind-map.
  - **50×50** — thẻ mini "từ trong ngày".
  - **134×48** — chip "+N gốc từ...".
- Nội dung: ký tự Hán (font Huninn) + pinyin (Label) + nghĩa tiếng Việt; viền/màu theo nhánh (blue/red/purple/green).

### Card/Sellect (thẻ chủ đề)
- **156×102** (biến thể full-width 368×102). Dùng ở "Danh sách nhóm từ".
- Nội dung: icon chủ đề + (badge "Đang học") + tên chủ đề + "N gốc từ" + `arrow-right-02`.

### Card Nhóm
- **247×144** (đồng đều). Thẻ nhóm từ khổ lớn (dùng ở các màn danh sách khác).

### Header (mobile-web)
- **375×104**. Thay cho sidebar trên bản responsive khổ điện thoại.

### Progress (thanh tiến trình)
- Cao **12px**, width theo container: 328 / 343 / 430 / 640.
- Dùng trong Level card và các bước onboarding.

### Pagetitle
- **206×40**. Tiêu đề khu vực trong sidebar/khối.

### Icon
- Slot icon ~**44×44** bao glyph **24–32**. Bộ icon: `arrow-right-01/02`, `Migii/Outline/Arrow-down`, `alphabet-chinese`, `diamond-02`, `user-circle`, `search-01`, `tick-01`, `biscuit`, `location-user-01`…

## Trạng thái & quy ước

- **Active/selected:** nền Primary/100–300, chữ Primary/500–700.
- **Disabled:** text `#717680` (Text/text-disabled).
- **Badge "Đang học":** nền Primary nhạt, chữ Primary, bo pill, dùng Caption-1/Label-3.
- **Divider:** Neutral/200 `#E2E8F0`.
- **Card surface:** nền trắng, viền Neutral/200–300, đổ bóng nhẹ.

---

*Nguồn: `get_metadata` page WEB + `get_variable_defs`. Trạng thái hover/focus/error chưa định nghĩa đầy đủ trong file — nên bổ sung khi dựng component library.*
