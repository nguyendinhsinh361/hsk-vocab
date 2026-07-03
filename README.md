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
    prisma/       PrismaService (adapter MySQL)
    redis/        RedisService (cache-aside, degrade an toàn)
    common/       current-user.decorator (tạm, chưa có auth)
    health/       GET /api/health
    users/        GET /api/users/me
    practice/     luồng luyện tập: GET /practice/session, POST /practice/answer
  prisma/         schema.prisma (nội dung HSK + tiến độ user) + data/ (CSV) + seed.ts
frontend/         Next.js
  app/
    page.tsx           / — splash → onboarding
    onboarding/        intro · example · level · (chọn gốc) · summary
    practice/[root]/   luồng luyện tập (Trailer → Pattern → Test → tổng kết)
  components/
    mobile/            PhoneFrame, ProgressPill, TopNav, WordTree
    onboarding/        ChooseRootMobile, ChooseRootWeb
    practice/          TeachScreen, PatternScreen, QuizScreen, SummaryScreen, …
  hooks/usePracticeFlow.ts   state machine luồng luyện tập
  lib/               api.ts, types.ts, cn.ts
Makefile            lệnh dev/build/db
```

## Mô hình dữ liệu (Prisma)

Nội dung HSK: `Topic` — `Word` — `Root` — `RootPattern` — `PatternWord` (+ bảng nối
`TopicWord`, `WordRoot`) và `Exercise` (13 dạng, nhóm A/B/C/D). Phía người dùng:
`User`, `UserWordProgress`, `PracticeSession`, `PracticeAnswer`.
Chi tiết & nguồn CSV: [`design/data-analysis.md`](./design/data-analysis.md).

## Bắt đầu (dev)

```bash
make install                             # cài deps BE + FE
cp backend/.env.example backend/.env     # sửa DATABASE_URL trỏ MySQL 8.0 ngoài
make db-setup                            # prisma migrate + generate + seed
make redis-up                            # (tuỳ chọn) bật Redis cache
make dev                                 # BE :4000 + FE :3000
```

Mở http://localhost:3000 → splash → `/onboarding`.

**Cache:** `GET /practice/session` cache nội dung bài theo gốc từ vào Redis
(`practice:steps:<rootId>`, TTL 1h) và lưu phiên (`practice:session:<id>`, TTL 2h).
Redis lỗi/tắt → tự dựng lại từ DB, không ảnh hưởng chức năng.

## Luồng màn (đã dựng)

```
/  →  /onboarding/intro → /onboarding/example → /onboarding/level
   →  /onboarding (chọn gốc)  →  /onboarding/summary  →  /practice/[root]
```

`/practice/[root]` chạy chuỗi: **Trailer** (dạy từ: chữ Hán + phân tích chữ + chọn nghĩa +
giải thích) → **Pattern** (lộ công thức gốc từ) → **Test** (chọn nghĩa, dạng A1) → **Tổng kết**.
`[root]` là alias FE (`people`/`family`/`study`/`food`) → map sang rootId DB trong `practice.service`.

## API

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/health` | Healthcheck (public) |
| GET | `/api/users/me` | Profile (header `x-user-id`, fallback demo user) |
| GET | `/api/practice/session?root=people` | Payload Trailer + Pattern + Test |
| POST | `/api/practice/answer` | Chấm 1 câu QUIZ `{sessionId, exerciseId, optionIndex}` |

## ⚠️ Chưa làm (mở rộng sau)

- **Auth (JWT + Google Sign-In)** — hiện dùng header `x-user-id` + demo user seed.
  Khi thêm: tạo `auth/` module + `JwtGuard`, thay `CurrentUserId` đọc từ `req.user`.
- Thêm dạng bài B/C/D vào luồng luyện tập; lưu tiến độ (`UserWordProgress`) sau mỗi phiên.
- Gamification (leaderboard, streak, achievement), TTS phát âm.
- Bộ deploy (do team system phụ trách).

## Build Docker

```bash
make docker-build      # tạo image migii-hsk-backend, migii-hsk-frontend
```

Backend cần `DATABASE_URL` (MySQL 8.0 ngoài) lúc chạy; entrypoint tự `prisma migrate deploy`.
`REDIS_URL` là tuỳ chọn (bật cache). Frontend dùng `BACKEND_URL` để rewrite `/api`, `/static`.
