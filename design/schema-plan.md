# Kế hoạch: `schema.prisma` + `seed.ts`

Dựa trên `design/data-analysis.md`. DB **MySQL 8.0** (PrismaMariaDb adapter). Dữ liệu nguồn: `backend/prisma/data/<level>/*.csv`.

---

## A. Enums

```prisma
enum HskLevel { HSK1 HSK2 HSK3 HSK4 HSK5 HSK6 }
enum HanVietLevel { M1 M2 M3 }
enum PartOfSpeech { N V ADJ ADV PRON NUM MW AUX PREP CONJ INTERJ PART UNKNOWN } // '' → UNKNOWN
enum TopicGroupType { TOPIC_GROUP }
enum ExerciseGroup { A B C D }
enum ExerciseType { A1 A2 A3 A4 B1 B2 B3 C1 C2 C3 C4 D1 D2 D3 }
enum MasteryLevel { NEW LEARNING FAMILIAR MASTERED }
```

## B. Models nội dung (từ CSV)

| Model / `@@map` | Trường chính | Quan hệ · Index |
|---|---|---|
| **Topic** `topics` | `id`, `hskLevel`, `order`, `title Json`, `groupType`, `estimatedMinutes` | 1‑N TopicWord, 1‑N Exercise · idx `(hskLevel, order)` |
| **Word** `words` | `id`, `hz`, `py`, `hv`, `pos`, `meaning Json`(=mn), `audioUrl?`, `mw?`, `exSample?`, `exPinyin?`, `exMeaning Json?`, `hskLevel`, `hanVietLevel`, `isPublished`, `createdAt` | 1‑N TopicWord, 1‑N WordRoot, 1‑N Exercise · idx `(hskLevel)`, `(isPublished)` |
| **Root** `roots` | `id`, `hz`, `py`, `hv`, `hskLevel`(=level), `topicId?` | N‑1 Topic, 1‑N RootPattern, 1‑N WordRoot · idx `(hskLevel)`, `(topicId)` |
| **RootPattern** `root_patterns` | `id @default(cuid())`, `rootId`, `formula`, `meaning`, `wordsText?`, `order` | N‑1 Root · idx `(rootId)` — **1 root N pattern** |
| **TopicWord** `topic_words` | `topicId`, `wordId`, `order` | `@@id([topicId, wordId])` |
| **WordRoot** `word_roots` | `wordId`, `rootId`, `order` | `@@id([wordId, rootId])` |
| **Exercise** `exercises` | `id @default(cuid())`, `topicId?`, `rootId?`, `wordId`, `type`, `group`, `title Json`, `question Json`, `answers Json`, `correctAnswer Json`, `explanation Json?`, `audioScript?`, `imageDescription?`, `hskLevel`(=level), `order` | N‑1 Word/Topic/Root · idx `(topicId)`,`(wordId)`,`(type)`,`(group)`,`(hskLevel)` |

Ghi chú:
- **JSON đa ngữ** → kiểu `Json` (`title, meaning, exMeaning, question, answers, correctAnswer, explanation`).
- **Bỏ cột `patterns`** trên Root (đã tách sang `root_patterns`).
- `RootPattern.wordsText` = cột `words` (text ví dụ). Giai đoạn sau có thể thêm bảng nối pattern↔word.
- `Exercise` không có id trong CSV → `cuid()`; giữ `order` để sắp xếp.

## C. Models người dùng / luyện tập (thêm mới)

| Model / `@@map` | Trường | Ghi chú |
|---|---|---|
| **User** `users` | `id`, `email @unique`, `name`, `avatar?`, `xp`, `level`, `streak`, `lastActiveDate?`, timestamps | chưa auth → seed demo user |
| **UserWordProgress** `user_word_progress` | `id`, `userId`, `wordId`, `mastery`, `correctCount`, `seenCount`, `lastSeenAt?` | `@@unique([userId, wordId])` |
| **PracticeSession** `practice_sessions` | `id`, `userId`, `topicId?`, `total`, `correctCount`, `xpEarned`, `completedAt?`, `createdAt` | thay `QuizSession` cũ |
| **PracticeAnswer** `practice_answers` | `id`, `sessionId`, `exerciseId`, `isCorrect`, `createdAt` | idx `(sessionId)` |

> Bỏ 2 model scaffold cũ **Deck, Card, QuizSession, QuizAnswer, UserCardProgress** (thay bằng Topic/Word + Practice*).

## D. `seed.ts` — kế hoạch

**Ý tưởng:** đọc lần lượt các thư mục `data/<level>/`, parse CSV, insert theo đúng thứ tự phụ thuộc khoá ngoại, idempotent (upsert / `skipDuplicates`).

1. **Thư viện**: parse CSV bằng `csv-parse/sync` (thêm devDep) — xử lý đúng field JSON có dấu phẩy/nháy. Prisma qua `PrismaPg`→ đổi `PrismaMariaDb`.
2. **Duyệt cấp độ**: `for (level of fs.readdirSync('prisma/data'))` → lấy `hskLevel` từ tên thư mục.
3. **Thứ tự insert (tôn trọng FK):**
   1. `Topic` (createMany, skipDuplicates)
   2. `Word`
   3. `Root` (FK topicId)
   4. `RootPattern` (đọc `pattern_root.csv`, mỗi dòng → 1 bản ghi, `rootId = id`)
   5. `TopicWord`, `WordRoot` (bảng nối)
   6. `Exercise` (batch ~1000 dòng/lần vì có 5.4k dòng)
4. **Parse field:**
   - JSON: `JSON.parse` cho `title, mn→meaning, exMeaning, question, answers, correctAnswer, explanation`.
   - Enum: map `pos` '' → `UNKNOWN`, uppercase; `type`/`group`/`hanVietLevel` uppercase.
   - `isPublished`: `'true'→true`. `createdAt`: `new Date(...)`.
   - `hskLevel`: từ tên thư mục (ưu tiên) — bỏ qua cột `level` trong CSV nếu lệch.
5. **Idempotent**: dùng `createMany({ skipDuplicates: true })`; hoặc `deleteMany` sạch trước khi seed lại (tuỳ chọn `--reset`).
6. **Demo user**: upsert `demo@migii.local` để FE (fake off) vẫn có user cho progress.
7. **Log**: in số bản ghi mỗi bảng sau seed.

Khai báo lệnh seed trong `prisma.config.ts` (đã có `migrations.seed = 'ts-node prisma/seed.ts'`).

## E. Các bước triển khai

1. Viết `schema.prisma` (enums + models B, C).
2. `pnpm add -D csv-parse` (nếu chưa có).
3. `pnpm exec prisma migrate dev --name init_hsk_content` (DB MySQL ngoài phải chạy).
4. `pnpm exec prisma generate`.
5. `pnpm run db:seed` → import `data/hsk1` (và hsk2 khi có).
6. Cập nhật fake-data/module BE (`decks→topics`, quiz→exercises) hoặc tạm giữ; đặt `USE_FAKE_DATA=false` khi seed xong.
7. Cập nhật `design/data-analysis.md` nếu schema đổi.

## F. Điểm cần bạn quyết trước khi code

1. **Bỏ hẳn Deck/Card/Quiz cũ** và thay bằng Topic/Word/Root/Exercise? (khuyến nghị: có)
2. `RootPattern.wordsText` giữ dạng **text** (như CSV) hay chuẩn hoá thành bảng nối pattern↔word? (khuyến nghị: text trước, tối ưu sau)
3. Seed **idempotent bằng skipDuplicates** hay **xoá sạch rồi seed lại**? (khuyến nghị: skipDuplicates, thêm cờ `--reset` để nạp lại)
4. Có cần map cột DB sang `snake_case` (qua `@map`) hay giữ `camelCase` khớp CSV? (khuyến nghị: giữ camelCase)
