# Thuật toán sinh bài tập (BNPD)

Tài liệu logic **sinh bài tập từ vựng** trong luồng luyện tập, cài đặt theo spec
`BNPD - Logic bài tập (Final - BS).xlsx` (3 sheet: `00. Tổng hợp dạng bài`,
`06. Quy tắc sinh bài`, `07. Quy tắc không trùng`).

> Code: `backend/src/exercise-plan/` (thuật toán thuần, dùng chung) +
> `backend/src/practice/practice-content.builder.ts` (tích hợp vào luyện tập).
> Cập nhật: 04/07/2026.

## 1. Bài toán

Cho một **cluster từ** (các từ cùng gốc từ, hoặc cùng chủ đề) đã sắp theo thứ tự học,
sinh ra **danh sách bài tập có thứ tự** sao cho: số bài và nhóm chức năng của mỗi từ
phụ thuộc độ liên kết Hán Việt của từ đó; hai từ liền kề không lặp lại cùng một dạng bài;
và cluster luôn kết thúc bằng các bài tổng kết.

Đầu vào của thuật toán chỉ gồm dữ liệu thuần (không phụ thuộc DB/HTTP), nên tái sử dụng
được cho luyện tập theo gốc từ, theo chủ đề, và ôn tập sau này:

```
generateExercisePlan(words, options) → PlannedExercise[]

words:   [{ wordId, hanViet: M1|M2|M3, learned?, availableTypes: [...] }]
options: { mode: ROOT|TOPIC, userLevel?, patternCount?, d3MaxPairs? }
```

## 2. Khái niệm

**15 dạng bài, 4 nhóm chức năng** (sheet 00). Nhóm A kiểm tra *nhận diện* (thấy chữ Hán
→ nhớ nghĩa), nhóm B kiểm tra *ghi nhớ chủ động* (không thấy chữ Hán → tự nhớ ra),
nhóm C kiểm tra *vận dụng trong câu*, nhóm D xoay quanh *gốc từ và tổng kết*.

| Nhóm | Dạng | Mô tả | Ghi chú |
|---|---|---|---|
| A | A1 | Nhìn chữ Hán → chọn nghĩa | — |
| A | A2 | Nghe audio → chọn từ | Optional — cần audio |
| A | A3 | Đúng/Sai (nghĩa) | — |
| A | A4 | Nhìn chữ Hán → chọn phiên âm & nghĩa | — |
| B | B1 | Nhìn nghĩa → chọn chữ Hán | — |
| B | B2 | Nhìn ảnh → chọn từ | Optional — cần ảnh; FE chưa có layout |
| B | B3 | Gõ phiên âm → chọn chữ Hán | — |
| C | C1 | Điền trống (câu đơn) | — |
| C | C2 | Chọn câu đúng | Cần dữ liệu câu sai |
| C | C3 | Đúng/Sai (cách dùng) | — |
| C | C4 | Điền trống (hội thoại) | — |
| C | C5 | Đặt câu | Chỉ level 3+; FE chưa có layout |
| D | D1 | Cho gốc ghép từ | Từng từ, chỉ mode gốc từ |
| D | D2 | Chọn pattern nghĩa | Tổng kết gốc, ×n pattern |
| D | D3 | Nối từ | Tổng kết — **luôn là bài cuối cùng** |

**Độ liên kết Hán Việt** của từ (`Word.hanVietLevel`): `M1` khớp hoàn toàn (âm HV dẫn
thẳng sang nghĩa), `M2` lệch một phần, `M3` lệch / dễ nhầm. **Từ đã học** (`learned`)
là từ user từng đạt mastery FAMILIAR trở lên ở gốc/chủ đề trước — không xét Hán Việt nữa.

## 3. Công thức theo từ (sheet 06)

Số bài và trình tự nhóm cho mỗi từ, theo 2 chế độ:

| Loại từ | GỐC TỪ (ROOT) | CHỦ ĐỀ (TOPIC — không dùng D1/D2) |
|---|---|---|
| M1 — khớp HV | 2 bài: **D1 → C** (HV đã dẫn thẳng sang nghĩa nên bỏ nhóm A/B) | 2 bài: **A → C** (thêm nhóm A thay D1) |
| M2 — lệch một phần | 3 bài: **A → D1 → C** (thiếu dữ liệu D1 thì thay bằng nhóm B) | 3 bài: **A → B → C** |
| M3 — dễ nhầm | 4 bài: **A1(cảnh báo) → B → A2/A3 → C** | giữ nguyên |
| ★ Đã học | ≤2 bài: **C1/C3** (sai → hàng đợi ôn tập) + vẫn xuất hiện ở D3 | giữ nguyên |
| Sau tất cả từ | **D2 × n pattern + D3 ×1** (D3 luôn cuối) | **D3 ×1**; chủ đề >8 từ → chia nhiều bài D3 nhỏ 3–5 cặp |

Chi tiết M3: bài 1 và bài 3 cùng nhóm A nên **phải khác dạng** — bài 1 cố định A1 kèm
cờ `confusionWarning` (FE hiện badge "Từ dễ nhầm"), bài 3 xoay giữa A3/A2. Nhóm C của
M3 ưu tiên theo level: level 1–3 ưu tiên C1/C3/C4, level 4+ ưu tiên C2/C5.

## 4. Quy tắc không trùng & vòng xoay (sheet 07)

Nguyên tắc: **2 từ liền kề trong cùng cluster, nếu cả hai có bài cùng nhóm chức năng
→ 2 bài đó phải khác dạng.** Không xét vị trí bài, chỉ xét nhóm.

Cài đặt bằng **con trỏ xoay vòng dùng chung cho cả chuỗi từ** (class `Rotor`): mỗi nhóm
giữ một con trỏ; khi một từ lấy dạng nào, con trỏ tiến qua dạng đó, nên từ kế tiếp cùng
nhóm tự động nhận dạng khác.

| Nhóm | Thứ tự xoay vòng | Ngoại lệ |
|---|---|---|
| A | A1 → A3 → A4 → A2 | M3 cố định A1, không xoay — 2 từ M3 liền kề đều dùng A1 |
| B | B1 → B2 → B3 | B2 optional (cần ảnh) — thiếu dữ liệu thì tự bị bỏ qua |
| C | C1 → C3 → C4 → C2 | C5 vào cuối vòng xoay từ level 3+; C2 cần dữ liệu câu sai |
| D1 | cố định | **Được phép trùng dạng** giữa các từ (mỗi từ ra câu hỏi khác nhau: 生+___=cuộc sống → 活; 生+___=sinh nhật → 日) |

Hai quy tắc xử lý khi xoay: (1) dạng **thiếu dữ liệu** (`availableTypes` không có) bị bỏ
qua, con trỏ nhảy tới dạng khả dụng kế tiếp; (2) dạng **trùng với từ liền trước** chỉ được
dùng khi không còn lựa chọn nào khác trong nhóm.

Ví dụ vòng xoay nhóm C trong gốc 生 (lấy từ sheet 07, được cover bằng unit test):
生活 (M1) → C1 · 生日 (M1) → C3 · 医生 (M3) → theo ưu tiên level · 学生 (M2) → C4.

## 5. Khối tổng kết

Mode ROOT: sau tất cả từ, sinh **D2 × n** (n = số pattern của gốc, mỗi bài mang
`patternIndex`) rồi **D3 ×1** chứa toàn bộ từ của gốc — kể cả từ đã học. Mode TOPIC:
chỉ D3; chủ đề trên 8 từ được chia thành nhiều bài D3 nhỏ **3–5 cặp/bài, chia đều**
(10 từ → 5+5; 11 từ → 4+4+3 — hàm `chunkForD3`). D3 luôn là bài cuối cùng.

## 6. Kiến trúc & luồng dữ liệu

```
backend/src/exercise-plan/            ← THUẬT TOÁN (thuần, dùng chung)
├── exercise-plan.types.ts            15 dạng bài, PlanWordInput, PlannedExercise...
├── exercise-plan.generator.ts        generateExercisePlan() + Rotor + chunkForD3()
├── exercise-plan.service.ts          wrapper Injectable (cho consumer cần DI)
└── exercise-plan.generator.spec.ts   21 unit tests bám từng quy tắc của spec

backend/src/practice/                 ← TÍCH HỢP vào luyện tập theo gốc từ
├── practice-content.builder.ts       bundle (cache) + assemblePracticeSteps()
└── practice.service.ts               start(): bundle + learned per-user → steps
```

Luồng khi user bắt đầu phiên (`POST /practice/sessions`):

```
getBundle(rootId)  ──[cache Redis practice:bundle:v6, TTL 1h, user-agnostic]──►
  { baseSteps (TEACH+PATTERN), words (hanVietLevel...), quizCandidates, patternCount, levelNum }

learnedWordIds(userId)  ──[UserWordProgress, mastery ∈ {FAMILIAR, MASTERED}]──►  Set<wordId>

assemblePracticeSteps(bundle, learned)   ← hàm thuần, chạy mỗi phiên
  1. generateExercisePlan(mode=ROOT, level=levelNum, patternCount)
  2. map từng bài trong plan → Exercise thật trong kho (lấy 1 lần, không dùng lại)
  3. D3 → tổng hợp bài MATCH (nối từ) từ chính words — không cần row Exercise
  4. kho không khớp plan (seed cũ) → fallback QUIZ_TAKE bài đầu, không trắng bài

steps snapshot vào Redis session → chấm bài/complete đọc từ session
```

Cache 2 tầng là quyết định quan trọng: **bundle** là nội dung dùng chung mọi user nên
cache theo `rootId`; phần **phụ thuộc user** (cờ `learned`) chỉ là bước lắp ráp thuần,
rẻ, chạy mỗi lần tạo phiên — vừa cá nhân hóa được vừa không phá cache.

## 7. Các quyết định cài đặt (và lý do)

**Mâu thuẫn spec — M3 nhóm C.** Sheet 06 ghi M3 level 1–3 ưu tiên C1/C3/C4, level 4+
ưu tiên C2/C5; nhưng ví dụ ở sheet 07 lại cho 医生 (M3) dùng C2 ngay. Cài đặt **theo
sheet 06** (bảng công thức chính thức); muốn đổi chỉ cần sửa hàm `m3CPreference()`.

**Mâu thuẫn spec — M3 bài 1.** Sheet 06 ghi "A1 hoặc A4 (xoay vòng)", sheet 07 ghi
"M3 bắt buộc dùng A1 — không xoay". Cài đặt **theo sheet 07** (quy tắc chuyên về xoay
vòng): luôn A1, chỉ rơi về A4 khi A1 thiếu dữ liệu.

**"Level" = level nội dung.** Spec không định nghĩa rõ "Level 1–3". Cài đặt lấy từ
`Root.hskLevel` (HSK1 → 1) — deterministic, cache được; không dùng level gamification
(XP) của user vì bản chất khác nhau.

**"Đã học" = mastery FAMILIAR trở lên** (≥3 lần đúng, xem `gamification.service.ts`).
Ngưỡng nằm ở một query duy nhất trong `PracticeService.learnedWordIds()`.

**D3 tổng hợp, không cần dữ liệu riêng.** Bài nối từ dựng trực tiếp từ hz/py/nghĩa của
words trong plan — mọi gốc từ đều có bài kết thúc dù DB không có row Exercise D3.
FE chấm cục bộ (`MatchScreen`), không tính vào điểm QUIZ.

**Dạng chưa render được bị lọc lúc lắp ráp, không lọc trong thuật toán.** Generator sinh
plan đầy đủ theo spec (kể cả B2/C5/D3); `assemblePracticeSteps` mới là nơi lọc theo
`QUIZ_TYPES` + tổng hợp MATCH. Nhờ vậy khi FE có layout mới chỉ cần mở filter.

**Fallback an toàn.** Dữ liệu seed cũ chưa gắn `wordId`/`hanVietLevel` đầy đủ → plan
không khớp kho bài → tự rơi về cách chọn cũ (8 bài đầu theo `order`) để không trắng màn.

## 8. Kiểm thử

`exercise-plan.generator.spec.ts` (21 test) cover từng quy tắc: công thức M1/M2/M3/đã học
× 2 mode, fallback D1→B, vòng xoay A/C đúng thứ tự spec, không trùng liền kề, D1 và
M3-A1 được phép trùng, bỏ qua dạng thiếu dữ liệu, C5 theo level, D2×n + D3 cuối,
chia nhỏ D3. `practice-content.builder.spec.ts` cover tầng lắp ráp: chọn bài theo plan,
cờ `learned`/`confusionWarning`/`reviewOnWrong` truyền xuống step, MATCH cuối cùng,
fallback. Chạy: `pnpm -C backend test`.

## 9. Dùng lại cho luyện tập theo chủ đề

Chỉ cần gọi generator với mode TOPIC — thuật toán tự bỏ D1/D2 và chia nhỏ D3:

```ts
const plan = generateExercisePlan(
  topicWords.map((w) => ({
    wordId: w.id,
    hanViet: w.hanVietLevel,
    learned: learnedSet.has(w.id),
    availableTypes: typesByWord.get(w.id) ?? [],
  })),
  { mode: 'TOPIC', userLevel: hskLevelNum(topic.hskLevel) },
);
```

## 10. Hàng đợi ôn tập (đã triển khai)

Khép kín vòng học của spec: từ đã học trả lời sai → vào queue → đến hạn → phiên ôn.

**Dữ liệu:** 3 cột trên `UserWordProgress` — `dueAt` (hạn ôn, NULL = không trong queue),
`reviewInterval` (ngày), `lapses` (số lần rơi vào queue). Migration
`20260704100000_add_review_queue`. Vì Prisma client cần regenerate trên máy dev,
truy cập các cột này tạm dùng raw SQL **cô lập trong `review.repository.ts`**
(tham số bind qua tagged template) — sau khi chạy `prisma generate` chỉ cần thay ruột repo.

**Lịch ôn** (`review.schedule.ts` — hàm thuần): rơi vào queue → ôn sau 1 ngày;
ôn đúng → giãn ×2 (1 → 2 ngày); đúng 2 lần liên tiếp → rời queue; ôn sai → reset 1 ngày
+ 1 lapse.

**Luồng:** grading (sau transaction ghi answer, best-effort) — phiên luyện tập sai bài
`reviewOnWrong` → `markLapse`; phiên ôn (session `mode: REVIEW`) → `applyReviewAnswer`.
Phiên ôn tạo qua `POST /review/sessions`: lấy ≤10 từ đến hạn, mọi từ đi công thức
"đã học" của generator (C1/C3 xoay vòng + MATCH nối từ cuối) — đúng như thiết kế
tái sử dụng ở §9. Chấm & hoàn thành dùng chung `/practice/answer` + `/practice/complete`.
`GET /review/queue` trả số từ đến hạn; Home hiện nút "Ôn tập X từ" → route `/review`
(FE tái dùng khung `FlowScreen` của luyện tập).

## 11. Việc còn mở

FE chưa có layout cho B2 (cần dữ liệu ảnh) và C5 (nhập tự do + chấm) — đang bị lọc
lúc lắp ráp. Sau khi chạy `pnpm prisma generate` + migration trên máy dev, có thể thay
raw SQL trong `review.repository.ts` bằng delegate typed.
