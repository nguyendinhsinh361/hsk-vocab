# Service template

Production-grade NestJS 11 starter enforcing: SOLID boundaries, strict lint/format,
scalable defaults, swappable infrastructure, and a single response contract.

## Quick start
```bash
cp .env.example .env       # fill JWT_SECRET: openssl rand -base64 48
docker compose up -d       # postgres + redis (redis optional — see cache drivers)
npm i                      # postinstall runs `prisma generate` (client → src/generated/prisma)
npm run migration:deploy   # applies prisma/migrations (an initial migration ships with the template)
npm run start:dev
```
`npm run check` = typecheck + lint + format + unit tests + e2e tests. It must pass
before every PR (wire the same command into CI). The e2e suite overrides
`PrismaService` with a stub and runs the cache on the in-memory driver, so `check`
needs no database and no Redis — but it does need the generated Prisma client,
which `npm i` produces via the `postinstall` hook (or run `npm run prisma:generate`).

At runtime Postgres is required; Redis only when `CACHE_DRIVER=redis`.
`/health/ready` reports exactly the dependencies in play.

Build notes: `nest build` uses the **tsc** builder (see `nest-cli.json` /
`tsconfig.build.json`). The generated client lives in `src/generated/` (gitignored,
lint/format-ignored) and compiles into `dist/` with the app. `prisma.config.ts` is
CLI-only and excluded from the build so the `dist/` layout stays flat.

## The response contract
Every endpoint returns:
```json
{ "success": true,  "data": { … }, "meta": { "page": 1 }, "correlationId": "…" }
{ "success": false, "error": { "code": "CONFLICT", "message": "…", "details": [] }, "correlationId": "…" }
```
Controllers return plain DTOs (or `Paginated.of(...)`); the envelope is applied by
`ResponseEnvelopeInterceptor`, errors by `GlobalExceptionFilter`. Don't hand-build envelopes.

The correlation id comes from the inbound `x-request-id` header (or is generated),
is stored in CLS by the `nestjs-cls` middleware, echoed as a response header, and
used as pino's request id — one id joins the log line, the envelope, and the client.

Endpoints whose body shape is mandated externally (terminus health checks, webhooks)
opt out with `@SkipEnvelope()` — see `src/health/health.controller.ts`. Failed health
checks still flow through the filter as `503 SERVICE_UNAVAILABLE` with the terminus
per-check results preserved in `error.details`.

## Data access (Prisma 7)
- `prisma/schema.prisma` is the single source of truth. Field names are camelCase
  on the TypeScript side and `@map`'ed to snake_case tables/columns — conventional
  Postgres style, no quoted identifiers in raw SQL.
- Prisma 7 has no Rust query engine: `PrismaService` passes the **pg driver
  adapter** (`@prisma/adapter-pg`) to the client, and the connection URL lives in
  `DATABASE_URL` (runtime) + `prisma.config.ts` (CLI) — not in the schema.
- The generated client is written to `src/generated/prisma` by `prisma generate`
  (wired as `postinstall`, so a fresh clone is immediately type-checkable).
- Migrations: `npm run migration:dev` locally (creates + applies + regenerates),
  `npm run migration:deploy` in CI/prod, `npm run migration:status` to inspect.
  Schema change ⇒ migration file in the same PR; never hand-edit the database.
- Service rules (see `users.service.ts`): map models to response DTOs (never
  return Prisma models from controllers), catch `P2002` → 409, `omit` the
  password hash at the query level, whitelist `orderBy` fields.

## Auth (login / refresh / logout)
- `POST /api/auth/login` (`@Public`, throttled 5/min) — email + password →
  `{ accessToken, refreshToken, user }`. Unknown email and wrong password return the
  **same** generic 401 (no user enumeration; both branches cost one argon2.verify).
- `POST /api/auth/refresh` (`@Public`, throttled 10/min) — **rotation**: every refresh
  token is single-use; the old row is revoked when a new pair is issued. Presenting a
  rotated-out token (valid signature, revoked/missing row) is treated as theft —
  **the user's entire session family is revoked** (reuse detection).
- `POST /api/auth/logout` (authenticated) — revokes the presented refresh token; the
  short-lived access token simply expires. "Log out everywhere" =
  `AuthService.revokeAllSessions(userId)`.

**Storage rationale:** refresh tokens live in **Postgres** (`RefreshToken` model),
not in the cache. Token state is durable auth data: it must survive a Redis flush
or driver swap, and revoked rows (`revokedAt`) remain as an audit trail that powers
family revocation. Only the **sha256** of the token is stored (a DB dump cannot mint
a session); `expiresAt` enforces TTL at refresh time. Purge expired/revoked rows
with a periodic cleanup job (`deleteMany where expiresAt < now() OR revokedAt IS NOT
NULL`) — e.g. a cron/queue worker; the table is append-mostly until then.
Auth does not touch the cache module at all.

## Caching (read-through, explicit invalidation, swappable backend)
`src/cache/` owns the concept; **Redis is just one driver of it**:

- `CacheService` is the facade the app codes against — `getJson`/`setJson` (TTL
  always set, `CACHE_TTL_SECONDS` default 60s), `del`, `delByPrefix`, and the
  `cacheKey('users', 42)` → `cache:users:42` key builder.
- Behind it sits the `CACHE_STORE` token (`stores/cache-store.interface.ts`) with
  two implementations: `RedisCacheStore` (ioredis, SCAN-based prefix deletes, owns
  the client lifecycle) and `InMemoryCacheStore` (Map + expiry timestamps — the
  zero-infrastructure default for dev/test).
- `CACHE_DRIVER=redis|memory` selects the driver (Joi-validated; redis vars are
  only required when the redis driver is selected). **LSP enforced by test**:
  `stores/cache-store.contract.spec.ts` runs one shared spec (`describe.each`)
  against every implementation — substitutability is proven, not assumed.
- `/health/ready` includes the redis ping **only when the driver is redis**; the
  memory driver has no external dependency and must never fail readiness.

`UsersService.findById` demonstrates the pattern: authorize first (a cache hit must
never bypass the ownership check), then read through `cache:users:<id>`.
**Invalidation story:** every write to a user row must call
`usersService.invalidateCachedUser(id)` — the TTL is only the backstop for missed
invalidations, not the strategy. Cache the response DTO, never the model.

## Adding a feature module (the only workflow you need)
1. Copy the `src/modules/users` shape: `dto/`, controller, service, module, spec.
2. Add the model to `prisma/schema.prisma`; models never leave the service — map to a `*ResponseDto`.
3. Multi-write use case → one transaction (`prisma.$transaction(async (tx) => …)`), `tx`-only inside.
4. Schema change → `npm run migration:dev -- --name <change>` (needs a running DB).
5. Routes are guarded by default; opt out with `@Public()`, restrict with `@Roles('admin')`,
   and enforce *ownership* in the service (see `users.service.findById`).
6. `npm run check` must pass before PR.

## Layout
- `prisma/` — schema (source of truth) + SQL migrations + lockfile
- `common/` — envelope, filter, pagination, correlation id, @SkipEnvelope (cross-cutting, domain-free)
- `config/` — typed namespaces + Joi env validation (boot fails fast)
- `database/` — global PrismaModule + PrismaService (pg adapter, connect/disconnect lifecycle)
- `cache/` — CacheService facade + CACHE_STORE drivers (redis | in-memory), shared contract spec
- `iam/` — global JWT guard (@Public opt-out), RBAC, @CurrentUser
- `health/` — /health/live + /health/ready (db ping always, redis ping only for the redis driver)
- `modules/auth/` — login/refresh/logout: issuance, rotation, reuse detection (tokens in Postgres)
- `modules/<feature>/` — one folder per domain feature; modules talk via exported services
- `src/generated/` — prisma-generated client (gitignored; recreated by postinstall)
- `test/` — e2e smoke suite proving envelope + auth + validation with PrismaService stubbed

## Known gaps (by design, document before you ship)
- No periodic cleanup job for expired/revoked refresh tokens yet (add a cron or BullMQ worker calling `deleteMany`).
- No queue/jobs consumer; if you add BullMQ, give it its own Redis connection (not the cache store's).
- No Dockerfile/CI workflow included; run `npm run check` in your pipeline.
- No account lockout/backoff on repeated login failures beyond the per-route throttle.
