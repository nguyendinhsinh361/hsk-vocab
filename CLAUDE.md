# CLAUDE.md — Migii HSK Vocab

Hướng dẫn cho Claude (và dev mới) khi làm việc trong repo này.
App học từ vựng tiếng Trung theo HSK, concept "cây từ gốc". Giao diện tiếng Việt.

## Lệnh thường dùng

```bash
make dev          # BE :4000 + FE :3000 (đợi BE lên trước; cần MySQL ngoài + Redis)
make dev-be       # chỉ backend (pnpm start:dev)
make dev-fe       # chỉ frontend (pnpm dev)
make test         # unit tests backend — PHẢI pass trước khi kết thúc task
make lint         # eslint BE + FE (BE có prettier check, script tự --fix)
make build        # build cả hai
make db-setup     # prisma migrate dev + generate + seed (chạy sau khi pull migration mới)
make db-seed      # seed lại dữ liệu HSK
make redis-up     # bật Redis (docker) — BẮT BUỘC cho phiên luyện tập
```

Typecheck nhanh không cần build: `cd backend && pnpm exec tsc --noEmit`
(tương tự cho `frontend`). Chạy 1 file test: `cd backend && pnpm exec jest <tên-file>`.

## Kiến trúc — đọc trước khi sửa

```
backend/src/
  exercise-plan/   Thuật toán sinh bài tập (spec BNPD) — HÀM THUẦN, không DB/HTTP.
                   Spec gốc: design/exercise-generation.md. Sửa logic sinh bài Ở ĐÂY.
  practice/        practice-content.builder  → bundle nội dung (cache Redis, user-agnostic)
                   assemblePracticeSteps()   → lắp steps per-user (hàm thuần)
                   practice-session.store    → phiên đang làm (CHỈ Redis, không Map)
                   practice-grading.service  → chấm + ghi tiến trình (transaction)
                   practice.service          → orchestrator mỏng (start/answer/complete/history)
  gamification/    XP / level / streak / mastery — NGUỒN SỰ THẬT DUY NHẤT.
                   FE không tự tính XP; module khác không copy công thức.
  review/          Hàng đợi ôn tập: review.schedule (lịch ôn thuần) + repository
                   (raw SQL cô lập — xem Gotchas) + service/controller.
  auth/            JWT HS256 tự cài bằng node:crypto (TokenService) — KHÔNG thêm dep.
                   JwtAuthGuard global kiểu "soft": không token = khách/demo user.
  common/          vi()/viList() đọc JSON đa ngữ {vi,en}, cap(), CurrentUserId.

frontend/
  hooks/usePracticeFlow.ts   state machine luyện tập (key + fetcher — dùng cho cả /review)
  components/practice/FlowScreen.tsx   khung UI chung practice + review
  components/layout/Sidebar.tsx        sidebar chung (KHÔNG import từ HomeWeb)
  lib/session.ts   token JWT trong localStorage; api.ts gửi Bearer
```

## Quy ước bắt buộc

1. **KHÔNG dùng `as any` với Prisma** — client đã typed, sai kiểu là sửa schema/generate.
2. **Ghi nhiều bảng = 1 `$transaction`.** Không nuốt lỗi ghi dữ liệu học tập
   (best-effort chỉ dành cho cache và tính năng phụ trợ như queue ôn — có logger.warn).
3. **Endpoint có side-effect dùng POST** (tạo session là POST, không GET).
4. **XP/level/streak/mastery chỉ tính ở `gamification/`**; FE hiển thị từ response BE.
5. **Đổi cấu trúc cache Redis → bump version key** trong `practice.constants.ts`
   (hiện `practice:bundle:v6`). Quên bump = user ăn cache cũ sai cấu trúc.
6. **Logic thuần tách khỏi DI** để unit-test (xem exercise-plan, review.schedule,
   assemblePracticeSteps) — thêm logic mới thì viết theo kiểu này + kèm test.
7. **Style:** single quotes (backend/.prettierrc), comment tiếng Việt giải thích
   "tại sao". FE không hardcode hex màu/gradient — dùng token Tailwind
   (`bg-primary`, `bg-card-teal`, `bg-progress-teal`... trong tailwind.config.ts).
8. Types API FE (`frontend/lib/types.ts`) phải khớp BE (`practice.types.ts`,
   `home.types.ts`) — sửa 1 bên thì sửa cả 2 (chưa có shared package).

## Gotchas

- **Redis là BẮT BUỘC cho phiên luyện tập** (session store duy nhất). Nội dung
  bài thì degrade về DB được, phiên thì không.
- **`review.repository.ts` dùng raw SQL có chủ đích** (3 cột dueAt/reviewInterval/lapses):
  Prisma client trong node_modules có thể chưa regenerate sau migration
  `add_review_queue`. Sau khi `pnpm exec prisma generate` chạy OK, có thể thay
  ruột repo bằng typed delegate — giữ nguyên chữ ký.
- **Sinh bài:** dạng FE chưa render được (B2/C5) bị lọc ở `assemblePracticeSteps`
  qua `QUIZ_TYPES`, KHÔNG lọc trong generator — generator luôn sinh plan đầy đủ theo spec.
- **D3 nối từ** không cần row Exercise trong DB (tổng hợp từ words → step MATCH);
  FE chấm cục bộ, không tính điểm QUIZ.
- **`complete()` idempotent** bằng guard `updateMany({completedAt: null})` — đừng
  bỏ guard này, sẽ cộng XP trùng khi refresh.
- **2 chỗ spec BNPD tự mâu thuẫn** đã chọn phương án có chủ đích (M3 nhóm C theo
  sheet 06; M3 bài 1 luôn A1 theo sheet 07) — xem design/exercise-generation.md §7
  trước khi "sửa bug" các chỗ này.
- ESLint frontend đang crash do config (lỗi có sẵn, chưa sửa) — verify FE bằng
  `tsc --noEmit`.

## Tài liệu

- `design/exercise-generation.md` — thuật toán sinh bài (spec BNPD): công thức
  M1/M2/M3, vòng xoay không trùng, D2/D3, hàng đợi ôn tập. ĐỌC TRƯỚC khi đụng
  vào exercise-plan/practice/review.
- `design/` — thiết kế UI (screens, tokens, components), phân tích dữ liệu HSK.
- `AUDIT.md` — audit kiến trúc + lộ trình refactor (P0–P3 đã hoàn thành 07/2026).

## Definition of done

Task chỉ xong khi: `tsc --noEmit` pass cả 2 workspace, `make test` pass
(50+ tests), `cd backend && pnpm run lint` sạch, và logic mới có unit test
nếu là hàm thuần. Thay đổi hành vi sinh bài/lịch ôn → cập nhật
`design/exercise-generation.md`.
