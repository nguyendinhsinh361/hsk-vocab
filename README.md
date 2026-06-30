# Migii HSK Vocab

Web app học **từ vựng tiếng Trung theo HSK** (giao diện tiếng Việt) — concept "cây từ gốc":
từ 1 ký tự gốc (vd 人 *rén*) suy ra hàng loạt từ ghép. Base dự án tham khảo cấu trúc shin-chloe.

> Tài liệu thiết kế giao diện: xem [`design/`](./design/).

## Tech stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS |
| Backend | NestJS 11 + Prisma 7 (MySQL 8.0) + Redis (ioredis) |
| Cache | Redis (chấm điểm quiz server-side) |

- **Package manager: pnpm.** Node >= 20.9.
- **MySQL 8.0 chạy NGOÀI** (không docker). Chỉ **Redis** chạy bằng docker-compose.
- Prisma dùng **driver adapter `@prisma/adapter-mariadb`** (connector `mariadb`, tương thích MySQL 8 — hỗ trợ `caching_sha2_password`).
- Deploy do team system đảm nhận; phía dev chỉ cung cấp **Dockerfile** (BE + FE).

## Cấu trúc

```
backend/          NestJS API (prefix /api)
  src/
    prisma/       PrismaService (PrismaPg adapter)
    redis/        RedisService
    common/       current-user.decorator (tạm, chưa có auth)
    health/       GET /api/health
    users/        GET /api/users/me
    decks/        list deck, cards, cây từ (/tree)
    cards/        chi tiết card
    quiz/         start → answer → complete (Redis chấm điểm)
    progress/     tiến độ theo card (mastery)
  prisma/         schema.prisma + seed.ts
frontend/         Next.js
  app/(app)/      dashboard, quiz/[deckId]  (+ layout sidebar 272px)
  components/      DeckCard, WordCard, ui/Button
  hooks/useQuiz.ts state machine quiz
  lib/            api.ts, types.ts, cn.ts
docker-compose.yml  chỉ Redis
Makefile            lệnh dev/build/db
```

## Bắt đầu (dev)

```bash
make install            # cài deps BE + FE
cp backend/.env.example backend/.env   # sửa DATABASE_URL trỏ MySQL 8.0 ngoài
make redis-up           # bật Redis (docker)
make db-setup           # migrate + generate + seed dữ liệu mẫu
make dev                # BE :4000 + FE :3000
```

Mở http://localhost:3000 → `/dashboard`.

## Luồng màn web (đã dựng)

```
/onboarding  →  /onboarding/level  →  /dashboard  →  /decks/[id]  →  /quiz/[id] (→ kết quả)
 (giới thiệu)     (chọn HSK level)      (hub)          ├ /decks/[id]/tree (cây từ)
```

| Route | Màn | API gọi |
|---|---|---|
| `/onboarding` | Giới thiệu concept | — |
| `/onboarding/level` | Chọn level HSK (lưu localStorage) | — |
| `/dashboard` | Hub: greeting + level + nhóm từ | `GET /users/me`, `GET /decks?level=` |
| `/decks/[id]` | Chi tiết nhóm từ (Họ từ) | `GET /decks/:id/cards` |
| `/decks/[id]/tree` | Cây từ gốc → ghép | `GET /decks/:id/tree` |
| `/quiz/[id]` | Luyện tập + kết quả | `POST /quiz/start`, `/quiz/answer`, `/quiz/:id/complete` |

Onboarding ở full-screen (không sidebar); dashboard/decks/quiz nằm trong layout có sidebar 272px.

## Fake data (chưa cần DB)

Backend mặc định **`USE_FAKE_DATA=true`** → mọi endpoint trả **dữ liệu giả** từ
`backend/src/fake/fixtures.ts` (4 nhóm từ: Con người, Gia đình, Học tập, Ăn uống — kèm cây từ).
Ở chế độ này app **chạy được ngay không cần MySQL/Redis** (quiz dùng store in-memory).
Khi có dữ liệu thật: seed vào MySQL rồi đặt `USE_FAKE_DATA=false` — shape fixtures khớp Prisma model.

## API chính

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/health` | Healthcheck (public) |
| GET | `/api/users/me` | Profile (header `x-user-id`, fallback demo) |
| GET | `/api/decks` | Danh sách nhóm từ |
| GET | `/api/decks/:id/cards` | Card trong deck |
| GET | `/api/decks/:id/tree` | Cây từ gốc → từ ghép |
| GET | `/api/cards/:id` | Chi tiết card |
| POST | `/api/quiz/start` | Bắt đầu quiz `{deckId, mode}` |
| POST | `/api/quiz/answer` | Chấm 1 câu `{sessionId, cardId, answer}` |
| POST | `/api/quiz/:sessionId/complete` | Kết thúc, tính XP |
| GET | `/api/progress/deck/:deckId` | Tiến độ theo deck |

## ⚠️ Chưa làm (mở rộng sau)

- **Auth (JWT + Google Sign-In)** — hiện dùng header `x-user-id` + demo user seed.
  Khi thêm: tạo `auth/` module + `JwtGuard`, thay `CurrentUserId` đọc từ `req.user`.
- Gamification (leaderboard, streak, achievement), TTS phát âm, mã hoá response.
- Bộ deploy (do team system phụ trách).

## Build Docker

```bash
make docker-build      # tạo image migii-hsk-backend, migii-hsk-frontend
```

Backend cần `DATABASE_URL` (MySQL 8.0 ngoài) + `REDIS_URL` lúc chạy; entrypoint tự
`prisma migrate deploy`. Frontend dùng `BACKEND_URL` để rewrite `/api`, `/static`.
