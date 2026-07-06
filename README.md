# Migii HSK Vocab

Web/mobile app học **từ vựng tiếng Trung theo HSK** (giao diện tiếng Việt) — concept "cây từ gốc":
từ 1 ký tự gốc (vd 人 *rén*) suy ra hàng loạt từ ghép.

> Tài liệu thiết kế giao diện: xem [`design/`](./design/).
> Phân tích dữ liệu HSK: xem [`design/data-analysis.md`](./design/data-analysis.md).

## Tech stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS |
| Backend | NestJS 11 + Prisma 7 (MySQL 8.0) |
| Cache | Redis (ioredis) — tuỳ chọn, tăng tốc lấy nội dung luyện tập |

- **Package manager: pnpm.** Node >= 20.9.
- **MySQL 8.0 chạy NGOÀI** (không docker). Prisma dùng driver adapter `@prisma/adapter-mariadb`
  (connector `mariadb`, tương thích MySQL 8 — hỗ trợ `caching_sha2_password`).
- **Redis** (docker-compose) là **tuỳ chọn**: nếu chưa bật, app vẫn chạy (tự rơi về DB).
- Deploy do team system đảm nhận; phía dev chỉ cung cấp **Dockerfile** (BE + FE).

## Cấu trúc

```
backend/          NestJS API (prefix /api)
  src/
    prisma/          PrismaService (adapter MySQL)
    redis/           RedisService (cache-aside, degrade an toàn)
    common/          helpers dùng chung (i18n-json, string, current-user)
    auth/            JWT (TokenService HS256 + JwtAuthGuard global soft)
    gamification/    XP / level / streak / mastery — nguồn sự thật duy nhất
    exercise-plan/   THUẬT TOÁN SINH BÀI (spec BNPD) — thuần, dùng chung
    practice/        luyện tập: bundle builder + session store + grading + orchestrator
    review/          hàng đợi ôn tập (lịch ôn + queue + phiên ôn)
    home/  users/  health/
  prisma/         schema.prisma (nội dung HSK + tiến độ user) + migrations/ + data/ (CSV) + seed.ts
frontend/         Next.js
  app/
    page.tsx           / — splash → onboarding
    onboarding/        intro · example · level · (chọn gốc) · summary
    practice/[root]/   luồng luyện tập (Trailer → Pattern → Test → Nối từ → tổng kết)
    review/            phiên ôn tập (các từ đến hạn)
    home/  profile/  premium/  login/  register/
  components/
    layout/            Sidebar (dùng chung Home/Profile/Premium)
    common/            Carousel generic, ErrorState, BrandBackdrop
    practice/          FlowScreen (khung chung) + Teach/Pattern/Quiz/Match/Summary
    home/  onboarding/  payment/  profile/  mobile/
  hooks/             usePracticeFlow (state machine), useApi (fetch chung)
  lib/               api.ts, types.ts, session.ts (JWT), cn.ts
design/           tài liệu thiết kế + thuật toán (exercise-generation.md)
Makefile          lệnh dev/build/db/test
```

## Mô hình dữ liệu (Prisma)

Nội dung HSK: `Topic` — `Word` — `Root` — `RootPattern` — `PatternWord` (+ bảng nối
`TopicWord`, `WordRoot`) và `Exercise` (13 dạng, nhóm A/B/C/D). Phía người dùng:
`User`, `UserWordProgress`, `PracticeSession`, `PracticeAnswer`.
Chi tiết & nguồn CSV: [`design/data-analysis.md`](./design/data-analysis.md).

## Bắt đầu (dev)

```bash
# 1. Cài đặt
make install                             # cài deps BE + FE (pnpm)
cp backend/.env.example backend/.env     # sửa DATABASE_URL trỏ MySQL 8.0 ngoài
                                         # + đặt JWT_SECRET (bắt buộc cho production)

# 2. Database (chạy lại mỗi khi pull code có migration mới)
make db-setup                            # prisma migrate dev + generate + seed

# 3. Chạy
make redis-up                            # bật Redis (docker) — cần cho phiên luyện tập
make dev                                 # BE :4000 + FE :3000 (đợi BE lên rồi mới chạy FE)
```

Mở http://localhost:3000 → splash → `/onboarding`.

**Lệnh hằng ngày:**

```bash
make dev            # chạy cả 2 (hoặc make dev-be / make dev-fe riêng lẻ)
make test           # unit tests backend (jest — 50 tests)
make lint           # eslint BE + FE
make build          # build BE + FE
make db-seed        # seed lại dữ liệu HSK (không đổi schema)
make db-reset       # xoá + migrate + seed từ đầu
```

**Sau khi pull code:** nếu có migration mới trong `backend/prisma/migrations/`
(vd `add_review_queue`) → chạy `make db-setup`; production dùng
`pnpm exec prisma migrate deploy && pnpm exec prisma generate`.

**Cache Redis:** nội dung bài theo gốc từ (`practice:bundle:v6:<rootId>`, TTL 1h,
dùng chung mọi user) và phiên đang làm (`practice:session:<id>`, TTL 2h).
Nội dung lỗi Redis → tự dựng lại từ DB; riêng PHIÊN luyện tập cần Redis
(session store duy nhất) → dev nên bật `make redis-up`.

**Env backend:** `DATABASE_URL` (bắt buộc) · `JWT_SECRET` (bắt buộc production,
thiếu sẽ dùng secret dev + cảnh báo log) · `REDIS_URL` (mặc định
`redis://localhost:6379`) · `PORT` (4000) · `FRONTEND_URL` (CORS).

## Luồng màn (đã dựng)

```
/  →  /onboarding/intro → /onboarding/example → /onboarding/level
   →  /onboarding (chọn gốc)  →  /onboarding/summary  →  /practice/[root]
/home  →  /practice/[root]  ·  /review (khi có từ đến hạn ôn)  ·  /profile  ·  /premium
```

`/practice/[root]` chạy chuỗi: **Trailer** (dạy từ) → **Pattern** (lộ công thức gốc) →
**Test** (bài sinh theo thuật toán BNPD — xem
[`design/exercise-generation.md`](./design/exercise-generation.md)) →
**Nối từ** (D3) → **Tổng kết**. `[root]` là alias FE (`people`/`family`/…) → map sang
rootId DB. `/review` là phiên ôn các từ trong hàng đợi (trả lời sai trước đó),
dùng chung khung UI với practice.

## API

Xác thực: đăng nhập/đăng ký trả `accessToken` (JWT HS256) → FE gửi
`Authorization: Bearer <token>`. Không có token = khách (demo user seed).

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/health` | Healthcheck (public) |
| POST | `/api/auth/register` | Đăng ký `{email, name, password}` → `{user, accessToken}` |
| POST | `/api/auth/login` | Đăng nhập `{email, password}` → `{user, accessToken}` |
| GET | `/api/users/me` | Profile user hiện tại |
| GET | `/api/home` | Trang chủ: tiến độ + nhóm gốc + số từ đến hạn ôn |
| POST | `/api/practice/sessions` | Tạo phiên luyện tập `{root}` → steps (sinh theo BNPD, per-user) |
| POST | `/api/practice/answer` | Chấm 1 câu `{sessionId, exerciseId, optionIndex, text?}` |
| POST | `/api/practice/complete` | Hoàn thành phiên (idempotent) → XP/level/streak |
| GET | `/api/practice/history` | Lịch sử các phiên đã hoàn thành |
| GET | `/api/review/queue` | Số từ đến hạn ôn + preview |
| POST | `/api/review/sessions` | Tạo phiên ôn tập (chấm/hoàn thành dùng chung practice) |

## ⚠️ Chưa làm (mở rộng sau)

- Google Sign-In (JWT email/password đã có); refresh token.
- Layout FE cho dạng bài B2 (nhìn ảnh — cần asset) và C5 (đặt câu — cần UI nhập tự do).
- Sau `prisma generate` trên máy dev: thay raw SQL trong `review.repository.ts`
  bằng delegate typed (chữ ký giữ nguyên).
- Leaderboard, achievement, TTS phát âm.
- E2E tests (flow start → answer → complete với DB test); sửa ESLint config frontend.
- Bộ deploy (do team system phụ trách).

## Build Docker

```bash
make docker-build      # tạo image migii-hsk-backend, migii-hsk-frontend
```

Backend cần `DATABASE_URL` (MySQL 8.0 ngoài) lúc chạy; entrypoint tự `prisma migrate deploy`.
`REDIS_URL` là tuỳ chọn (bật cache). Frontend dùng `BACKEND_URL` để rewrite `/api`, `/static`.
