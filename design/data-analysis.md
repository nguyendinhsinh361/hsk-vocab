# Phân tích dữ liệu `backend/prisma/data` + đề xuất đặt tên bảng

Dữ liệu thật (CSV) sẽ đưa vào DB. **Tổ chức theo thư mục cấp độ**: `data/hsk1/`, `data/hsk2/`, …
(hiện `hsk1/` đã có đầy đủ 7 file, `hsk2/` còn trống). → `hskLevel` suy ra từ **tên thư mục**; script import lặp qua từng thư mục `data/<level>/`.

## 1. Tổng quan 7 file

| File | Số dòng | Ý nghĩa | Khoá |
|---|---|---|---|
| `topics.csv` | 54 | Nhóm chủ đề học (topic_group) theo HSK level | `id` |
| `words.csv` | 458 | Từ vựng (chữ Hán, pinyin, Hán-Việt, nghĩa, ví dụ) | `id` |
| `roots.csv` | 79 | Gốc từ (chữ gốc) + mảng `patterns` (công thức ghép) | `id` |
| `pattern_root.csv` | 111 | **Flatten** từng pattern của gốc (formula/meaning/words) — 78 gốc | `id`(lặp) |
| `topic_words.csv` | 458 | Nối **N–N** topic ↔ word (có `order`) | (topicId, wordId) |
| `word_roots.csv` | 260 | Nối **N–N** word ↔ root (có `order`) | (wordId, rootId) |
| `exercises.csv` | 5.429 | Câu hỏi luyện tập, 13 dạng | (không có id) |

## 2. Chi tiết từng bảng

### topics
`id, hskLevel, order, title, groupType, estimatedMinutes`
- `title` = JSON đa ngữ `{"vi","en"}`.
- `groupType` hiện chỉ `topic_group`. `hskLevel` chỉ `HSK1`.

### words
`id, hz, py, hv, pos, mn, audioUrl, mw, exSample, exPinyin, exMeaning, hskLevel, hanVietLevel, isPublished, createdAt`
- `hz` chữ Hán · `py` pinyin · `hv` Hán-Việt · `pos` từ loại · `mn`/`exMeaning` = JSON `{vi,en}`.
- `pos`: n(214) v(100) pron(45) adj(23) adv(16) num(16) mw(13) part(6) prep(2) conj(2) aux(1) interj(1) + rỗng(19).
- `hanVietLevel`: M1(67) M2(135) M3(256) — mức độ Hán-Việt.
- `mw` = lượng từ, `exSample/exPinyin/exMeaning` = câu ví dụ.

### roots + pattern_root  ⚠️ 1 root có NHIỀU pattern
- `roots`: `id, hz, py, hv, level, topicId, patterns`. `patterns` = JSON `[{formula, meaning, wordIds[]}]`.
- `pattern_root`: `id, hz, py, hv, level, formula, meaning, words` — **`id` ở đây chính là ROOT id, LẶP LẠI** (mỗi dòng = 1 pattern của root đó). `words` = danh sách chữ Hán ví dụ (text).
- 111 dòng / **78 root** → **26 root có >1 pattern** (vd `r-shang` 上 có **6 pattern**: 上+__ / __+上 với nhiều nghĩa khác nhau).
- → `pattern_root` = `roots.patterns` tách phẳng → **trùng thông tin**. Đề xuất: 1 bảng chuẩn hoá `root_patterns` (PK riêng tự tăng, FK `rootId`), bỏ cột JSON `patterns`. Quan hệ **Root 1 — N RootPattern**.

### topic_words / word_roots
Bảng nối N–N thuần, đều có `order` để sắp xếp hiển thị.

### exercises
`topicId, rootId, wordId, type, group, title, question, answers, correctAnswer, explanation, audio_script, image_description, wordGroup, level, order`
- `title/question/answers/correctAnswer/explanation` = JSON đa ngữ (answers = `{"vi":[...]}`).
- Luôn có `wordId` (5429), phần lớn có `topicId` (5242), có `rootId` (3271, chủ yếu nhóm D).
- **13 dạng → 4 nhóm** (khớp các tab luyện tập trong Figma):

| Nhóm | Dạng | Tên |
|---|---|---|
| **A** – Nhận biết nghĩa | A1 | Nhìn chữ Hán → Chọn nghĩa |
| | A2 | Nghe audio → Chọn từ |
| | A3 | Đúng/Sai nghĩa |
| | A4 | Nhìn chữ Hán → Chọn pinyin + nghĩa |
| **B** – Tái tạo | B1 | Nhìn nghĩa → Chọn chữ Hán |
| | B2 | Nhìn ảnh → Chọn từ |
| | B3 | Đọc nghĩa → Gõ chữ Hán |
| **C** – Ngữ cảnh câu | C1 | Điền trống — câu đơn |
| | C2 | Chọn câu đúng |
| | C3 | Đúng/Sai cách dùng |
| | C4 | Điền trống — hội thoại |
| **D** – Gốc từ | D1 | Cho gốc ghép từ |
| | D2 | Chọn pattern nghĩa |
| | D3 | Nối từ |

- `audio_script` chỉ có ở dạng nghe (A2…); `image_description` cho dạng ảnh (B2); `wordGroup` hiện `[]`.

## 3. Sơ đồ quan hệ

```
Topic ──< TopicWord >── Word ──< WordRoot >── Root ──< RootPattern
  │                       │                    │
  └──────────── Exercise ─┴────────────────────┘   (exercise gắn word, tuỳ chọn topic/root)
```

## 4. Đề xuất ĐẶT TÊN BẢNG

**Quy ước:** bảng = `snake_case số nhiều`; model Prisma = `PascalCase số ít` + `@@map`; cột giữ `camelCase` (khớp CSV). JSON đa ngữ → kiểu `Json`.

| CSV | Model Prisma | Tên bảng (`@@map`) |
|---|---|---|
| topics | `Topic` | `topics` |
| words | `Word` | `words` |
| roots | `Root` | `roots` |
| pattern_root | `RootPattern` (PK tự tăng · FK `rootId` = cột `id` trong CSV · **N pattern / 1 root**) | `root_patterns` |
| topic_words | `TopicWord` | `topic_words` |
| word_roots | `WordRoot` | `word_roots` |
| exercises | `Exercise` | `exercises` |

**Enum đề xuất:**
- `HskLevel { HSK1 … HSK6 }`
- `PartOfSpeech { N V ADJ ADV PRON NUM MW AUX PREP CONJ INTERJ PART }` (map `pos`)
- `HanVietLevel { M1 M2 M3 }`
- `ExerciseGroup { A B C D }`
- `ExerciseType { A1 A2 A3 A4 B1 B2 B3 C1 C2 C3 C4 D1 D2 D3 }`
- `TopicGroupType { TOPIC_GROUP }`

**Bảng phía người dùng (thêm mới, tách khỏi dữ liệu nội dung):**
- `User` → `users`
- `UserWordProgress` → `user_word_progress` (mastery theo từng `word`)
- `PracticeSession` → `practice_sessions` (thay `quiz_session`; 1 phiên luyện tập theo topic)
- `PracticeAnswer` → `practice_answers` (đáp án từng `exercise`)

## 5. Khuyến nghị

1. **Bỏ trùng `roots.patterns` vs `pattern_root`** → chỉ dùng bảng chuẩn hoá `root_patterns` (FK `rootId`), liên kết ví dụ qua `wordId` thay vì text `words`.
2. **JSON đa ngữ** (`title, mn, exMeaning, question, answers…`) để kiểu `Json` — sẵn sàng thêm `en` sau.
3. Đổi model app hiện tại cho khớp dữ liệu thật: **`Deck`→`Topic`, `Card`→`Word`** (+ thêm `Root`); nguồn câu hỏi lấy từ bảng `exercises` thay vì tự sinh.
4. Thêm index: `words(hskLevel)`, `topics(hskLevel, order)`, `exercises(topicId)`, `exercises(wordId)`, `exercises(type)`, unique `topic_words(topicId,wordId)`, `word_roots(wordId,rootId)`.
5. `order` giữ ở các bảng nối để sắp xếp hiển thị đúng thứ tự sư phạm.
6. **`hskLevel` lấy từ tên thư mục** khi import (`data/hsk1` → HSK1…); vẫn giữ cột `hskLevel` trong bảng để query nhanh. Thêm index `root_patterns(rootId)`.
7. **`RootPattern` PK tự tăng** (vì `pattern_root.id` không duy nhất — là root id lặp). Import: đọc mỗi dòng `pattern_root` thành 1 bản ghi `root_patterns` gắn `rootId = id`.
