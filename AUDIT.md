# Audit Clean Code & Clean Architecture — Migii HSK Vocab

Ngày: 2026-07-04 · Phạm vi: toàn bộ `backend/` (NestJS 11 + Prisma 7 + Redis) và `frontend/` (Next.js 16 + React 19). Mức độ đề xuất: **mạnh tay** (chấp nhận đổi API nội bộ, thêm layer).

Tổng quan: codebase nhỏ (~6.2k dòng TS/TSX), comment tiếng Việt tốt, module NestJS chia theo feature đúng hướng, FE chia component theo màn hình rõ ràng. Vấn đề lớn nhất không phải là "code bẩn" mà là **các quyết định MVP đang rò rỉ vào kiến trúc**: mất type-safety Prisma, god service, state toàn cục, auth giả, và logic nghiệp vụ trùng lặp giữa FE/BE. Chưa có một test nào.

---

## A. Vấn đề nghiêm trọng (P0 — sửa trước, ảnh hưởng dữ liệu & bảo mật)

### A1. `this.prisma as any` — vô hiệu hóa toàn bộ type-safety (10 chỗ)
`practice.service.ts`, `home.service.ts`, `auth.service.ts` đều ép `prisma as any` rồi truy cập delegate. Mọi query, select, kết quả trả về đều là `any` — sai tên field, sai kiểu sẽ chỉ phát hiện lúc runtime. Đây là lỗ hổng lớn nhất của backend vì nó lan `any` ra khắp nơi (`rows.map((r: any) => ...)`).

**Đề xuất:** xóa toàn bộ `as any`, chạy `prisma generate` và sửa theo type thật. Nếu lý do ban đầu là client chưa generate kịp schema, thì `postinstall: prisma generate` đã có sẵn — không còn lý do giữ.

### A2. Session luyện tập lưu trong `Map` toàn cục module-level
`practice.service.ts:53`: `const sessions = new Map<string, StoredSession>()` — state mutable toàn cục, không TTL, không cleanup → memory leak; sai hoàn toàn khi chạy >1 instance; và vì Map được đọc **trước** Redis nên dữ liệu stale trong Map thắng dữ liệu Redis.

**Đề xuất:** bỏ hẳn Map, Redis là session store duy nhất (RedisService đã degrade an toàn). Nếu cần fallback khi Redis chết, dùng LRU có TTL bọc trong một `PracticeSessionStore` injectable — không phải biến module-level.

### A3. Không có auth thật — `x-user-id` tự khai
Client gửi header `x-user-id` tùy ý → mạo danh bất kỳ user nào (đọc profile, ghi tiến trình, cộng XP). Thêm nữa, `UsersService.resolveUserId()` fallback về demo user khi id sai → lỗi dữ liệu bị che giấu: tiến trình của user "ma" được ghi nhầm vào demo user.

**Đề xuất:** phát JWT access token ở `auth/login|register`, `JwtAuthGuard` global + decorator `@Public()` cho auth/health, `@CurrentUser()` đọc từ token. Xóa fallback demo user khỏi đường đi production (chỉ giữ cho seed/dev qua env flag). FE đổi `x-user-id` → `Authorization: Bearer`.

### A4. Multi-write không transaction + nuốt lỗi im lặng
`persistAnswer()` ghi `practiceAnswer.create` + `userWordProgress.upsert` rời rạc; `complete()` ghi `practiceSession.update` + `user.update` rời rạc. Tất cả bọc try/catch chỉ `logger.warn` → partial write và mất dữ liệu không ai biết. Ngoài ra `userWordProgress` tính `mastery` bằng read-then-write (`findUnique` rồi `upsert`) → race condition khi 2 request song song.

**Đề xuất:** mỗi use-case ghi nhiều bảng = 1 `prisma.$transaction`. "Best-effort" chỉ nên áp dụng cho cache, không áp dụng cho ghi tiến trình học — nếu DB lỗi, trả 500 để FE retry, đừng trả kết quả giả thành công.

### A5. `complete()` không idempotent — cộng XP trùng
BE không kiểm tra `completedAt` trước khi cộng XP → gọi `/practice/complete` 2 lần là XP nhân đôi. Hiện đang "vá" ở FE bằng `completedRef` chống StrictMode — refresh trang ở màn summary vẫn cộng trùng được.

**Đề xuất:** trong transaction, `update ... where completedAt IS NULL`; nếu đã complete thì trả kết quả cũ. Xóa được luôn ref workaround ở FE.

### A6. `GET /practice/session` có side-effect (tạo session)
GET tạo `PracticeSession` trong DB — vi phạm ngữ nghĩa REST, và chính là nguồn gốc của workaround `loadedRootRef` chống StrictMode gọi 2 lần ở `usePracticeFlow`. Khi FE phải viết ref để "đỡ đạn" cho BE, đó là code smell kiến trúc.

**Đề xuất:** đổi thành `POST /practice/sessions`. Hai ref workaround trong hook xóa được.

---

## B. Vấn đề kiến trúc (P1 — tách layer, gom logic)

### B1. `PracticeService` là god service (536 dòng, 6 trách nhiệm)
Đang trộn: (1) alias mapping FE→DB, (2) cache steps, (3) session store, (4) dựng nội dung bài học từ DB (`buildStepsFromDb` ~150 dòng), (5) chấm điểm, (6) gamification XP/level/streak, (7) lịch sử. Đề xuất tách trong `backend/src/practice/`:

| File mới | Trách nhiệm |
|---|---|
| `practice-content.builder.ts` | Dựng `PracticeStep[]` từ DB (TEACH/PATTERN/QUIZ) + cache-aside |
| `practice-session.store.ts` | CRUD session trên Redis (thay Map) |
| `practice-grading.service.ts` | Chấm câu, ghi answer + word progress (transaction) |
| `gamification/gamification.service.ts` (module riêng) | XP, level, streak, mastery — dùng chung cho mọi feature |
| `practice.service.ts` | Chỉ orchestrate 4 use-case: start / answer / complete / history |

`nextStreak`, `masteryFrom`, `levelFromXp` là logic nghiệp vụ thuần → nằm trong gamification, dễ unit-test nhất codebase, test đầu tiên nên viết ở đây.

### B2. Helper trùng lặp giữa các module
`vi()`, `viList()`, `cap()` bị copy giữa `home.service.ts` và `practice.service.ts`. Tạo `src/common/i18n-json.util.ts` (đọc field JSON đa ngữ) và `src/common/string.util.ts`. Tương tự, `ROOT_ALIAS`, `QUIZ_TYPES`, các TTL nên vào `src/practice/practice.constants.ts` — hoặc tốt hơn, `ROOT_ALIAS` nên là cột `slug` trong bảng `Root` thay vì hardcode trong code.

### B3. Logic XP trùng lặp FE/BE — và FE đang hiển thị số tự tính
`XP_PER_CORRECT = 10` tồn tại ở cả `practice.service.ts` lẫn `usePracticeFlow.ts` (comment "khớp FE" là lời thú nhận). Tệ hơn: FE gọi `practiceComplete()` kiểu fire-and-forget (`.catch(() => {})`) rồi **vứt response**, màn Summary hiển thị XP do FE tự nhân — lệch với BE là chắc chắn xảy ra khi đổi công thức.

**Đề xuất:** BE là nguồn sự thật duy nhất. `usePracticeFlow` await `practiceComplete`, hiển thị `xpEarned/totalXp/level/streak` từ response, xóa `XP_PER_CORRECT` khỏi FE.

### B4. DTO tầng service chưa tách khỏi tầng HTTP
Controllers mỏng là đúng, nhưng service trả thẳng object literal khớp `practice.types.ts` — types này lại được FE copy tay sang `frontend/lib/types.ts`. Hai bản types trôi dạt độc lập. Với monorepo sẵn có, tạo `packages/shared-types` (hoặc tối thiểu: một file types được generate/copy có kiểm chứng) để FE/BE dùng chung contract.

---

## C. Frontend (P2)

### C1. `HomeWeb.tsx` 513 dòng chứa 9 component — và `Sidebar` bị import chéo
`ProfileWeb`, `PremiumWeb`, `PaymentWebShell` đang `import { Sidebar } from '@/components/home/HomeWeb'` — component layout chung sống nhờ trong file màn hình Home. Tách:

```
components/layout/Sidebar.tsx        ← dùng chung 4 màn
components/layout/UserPanel.tsx
components/home/HomeCard.tsx
components/home/AdBanner.tsx
components/home/RootCard.tsx
components/common/Carousel.tsx       ← gộp RootsCarousel + TopicCarousel (logic phân trang giống hệt)
components/home/TopicCard.tsx
```

`RootsCarousel` và `TopicCarousel` trùng ~80% (chia trang, translateX, controls) → 1 component `Carousel<T>` generic.

### C2. Design tokens hardcode rải rác
`#00b2a5`, `#12D18E`, gradient teal... xuất hiện ≥20 lần trong 8 file (HomeWeb 9 lần, gradient progress bị copy giữa HomeWeb và practice page). Đưa vào `tailwind.config` theme (`primary`, `gradient-card`, `gradient-progress`) hoặc CSS variables trong `globals.css`. Đổi brand color sau này là 1 dòng thay vì 20 file.

### C3. Data fetching thủ công lặp lại từng page
Mỗi page tự `useState + useEffect + load()` (home, profile, practice...) — không cache, không dedupe, không revalidate. Với quy mô hiện tại chưa cần React Query; tối thiểu viết 1 hook `useApi<T>(fetcher)` dùng chung (loading/error/retry) để xóa boilerplate lặp ở 5+ page. Khi có JWT trong cookie, cân nhắc chuyển catalog (home, onboarding) sang Server Components — dữ liệu tĩnh cache được ở server.

### C4. Session/profile trong localStorage bị stale
`UserPanel` đọc `getStoredUser()` từ localStorage — XP/level đổi sau mỗi bài luyện nhưng panel không bao giờ cập nhật cho tới lần login sau. Sau khi có JWT: localStorage chỉ giữ token, profile luôn fetch từ `/users/me`.

### C5. Chi tiết nhỏ
Inline SVG arrow lặp ≥4 lần → `components/common/Icon.tsx`. Nút back trong practice hardcode `/onboarding/summary` → nên `router.back()` hoặc nhận prop. `onError` xử lý ảnh vỡ bằng `outerHTML` trong `app/page.tsx` là hack — dùng state fallback.

---

## D. Chất lượng chung (P3)

**Test = 0.** Repo có sẵn skill `.claude/skills/nestjs-backend` với chuẩn production và template test — nhưng chưa áp dụng. Thứ tự viết test theo giá trị:
1. Unit: `nextStreak`, `masteryFrom`, `levelFromXp`, `letterToIndex`, `stripLetter` (thuần, không mock — 1 buổi là xong).
2. Unit: `PracticeGradingService.answer` (mock Prisma) — chấm mcq/boolean/input.
3. E2E: flow start → answer → complete với DB test, assert idempotency của complete.

**CI:** Makefile đã có — thêm target `check` chạy `lint + tsc --noEmit + test` cho cả 2 workspace, gắn vào pre-push hoặc CI.

---

## E. Kiến trúc đích (tóm tắt)

```
backend/src/
├── common/            # i18n-json.util, string.util, decorators, guards
├── auth/              # + jwt.strategy, jwt-auth.guard (global), @Public()
├── gamification/      # XP / level / streak / mastery — nguồn sự thật duy nhất
├── practice/
│   ├── practice.controller.ts      # POST /sessions, POST /answer, POST /complete, GET /history
│   ├── practice.service.ts         # orchestrator mỏng
│   ├── practice-content.builder.ts # dựng steps + cache
│   ├── practice-session.store.ts   # Redis-only session
│   ├── practice-grading.service.ts # chấm + ghi tiến trình (transaction)
│   └── practice.constants.ts
├── home/  users/  redis/  prisma/  health/   # giữ nguyên, xóa `as any` + helper trùng

frontend/
├── lib/api.ts         # Bearer token; types import từ shared package
├── components/layout/ # Sidebar, UserPanel tách khỏi HomeWeb
├── components/common/ # Carousel generic, Icon
└── hooks/useApi.ts    # fetch state dùng chung
```

## F. Lộ trình đề xuất

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **P0** | Xóa `as any`; bỏ Map global; transaction + idempotent complete; POST session; FE dùng XP từ BE | ✅ Hoàn thành 2026-07-04 |
| **P1** | Tách PracticeService (5 file); gamification module; gom helper/constants; JWT auth (soft guard, HS256 tự cài — không thêm dep) | ✅ Hoàn thành 2026-07-04 |
| **P2** | Tách HomeWeb; Carousel generic; design tokens (bg-card-teal/bg-progress-teal...); useApi hook; fix stale UserPanel | ✅ Hoàn thành 2026-07-04 |
| **P3** | Unit tests (gamification, token, practice utils — 21 tests) | ✅ Hoàn thành 2026-07-04 · e2e + CI còn lại |

Còn lại (chưa làm): e2e test flow practice với DB test; sửa ESLint config frontend (crash có sẵn với eslint 9 + FlatCompat); shared types FE/BE (mục B4); Icon component gom SVG lặp; chuyển guard JWT sang strict + @Public() khi bỏ luồng khách.

Điểm đáng khen giữ nguyên: RedisService degrade an toàn là thiết kế tốt; controllers mỏng đúng chuẩn; ValidationPipe global với whitelist đã bật; comment tiếng Việt giải thích *tại sao* chứ không chỉ *cái gì*; FE chia component theo màn hình dễ tìm.
