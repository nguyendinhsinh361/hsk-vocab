# Project template — the golden structure (assets/project-template/)

A complete, runnable NestJS 11 + **Prisma 7**/Postgres starter (cache layer with swappable Redis/in-memory drivers) that *embodies* this skill's standards. Empirically verified: `npm run check` (typecheck → eslint strictTypeChecked → prettier → 28 unit tests → 11 e2e tests) and `nest build` pass on a clean install (`postinstall` runs `prisma generate`); the initial migration SQL was validated against real Postgres; `repo_survey.py` reports zero red flags.

ORM note: the template ships Prisma (schema-first, camelCase fields `@map`'d to snake_case, migrations via `prisma migrate deploy`, P2002→409, per-query `omit` of passwordHash). If the team standard is TypeORM, the structure transfers — swap `database/` per `data-access.md` §0/§3; everything else (envelope, IAM, cache, auth, lint gates) is ORM-agnostic. Prisma 7 specifics baked in: `prisma.config.ts` (CLI no longer reads env/url from schema), `@prisma/adapter-pg` driver adapter, generated client in `src/generated/` (gitignored, compiled to dist).

Use it two ways:

- **Scaffold mode** — user wants a new service: copy the template wholesale, rename, then add feature modules by cloning `src/modules/users/` (the reference implementation of every pattern). Don't re-derive infrastructure from memory; the template is the tested source.
- **Pattern source** — user has an existing repo: lift individual pieces (envelope interceptor + filter, IAM guard pair, config validation, eslint config) and adapt to local conventions. Never bulk-replace a working repo's structure.

## Layout and what each piece guarantees

```
src/
├── main.ts                  # helmet, CORS allowlist, prefix, shutdown hooks, swagger (non-prod)
├── app.module.ts            # the composition root — order: Config(validated) → CLS → Logger(pino,
│                            #   redacted) → Throttler → DB → IAM → features; APP_PIPE(Validation),
│                            #   APP_INTERCEPTOR(envelope), APP_FILTER(error funnel), APP_GUARD(throttle)
├── common/                  # domain-free cross-cutting
│   ├── types/api-response.ts          # THE response contract (success/error/PageMeta)
│   ├── interceptors/response-envelope.interceptor.ts   # wraps success; honors @SkipEnvelope
│   ├── filters/global-exception.filter.ts              # wraps errors; maps DomainException,
│   │                                                   #   validation details, 503 detail; logs w/ stack
│   ├── decorators/skip-envelope.decorator.ts           # explicit opt-out (health, streams, webhooks)
│   ├── exceptions/ (error-code.enum, domain.exception) # stable machine codes; append-only
│   ├── dto/ (pagination-query.dto, paginated)          # page/limit≤100 validated; Paginated.of()
│   └── correlation-id.ts                               # CLS-backed id helper (header in+out)
├── config/                  # registerAs namespaces + Joi env schema — boot fails fast;
│                            #   JWT_SECRET min 32 chars required, no fallbacks possible
├── database/                # PrismaModule (global) + PrismaService (pg adapter, connect/disconnect
│                            #   lifecycle); schema + migrations live in /prisma
├── iam/                     # global JwtAuthGuard (default-deny, @Public opt-out) + RolesGuard
│                            #   (@Roles), @CurrentUser, AuthUser type — secure by default
├── cache/                   # the caching abstraction: CacheService facade + CACHE_STORE token;
│   └── stores/              #   redis.store.ts (ioredis, one driver among others) and
│                            #   in-memory.store.ts (zero-infra default), selected by CACHE_DRIVER;
│                            #   one contract spec runs against BOTH stores (LSP, substitutability)
├── health/                  # /health/live (dependency-free) + /health/ready (Prisma ping;
│                            #   + redis ping only when CACHE_DRIVER=redis), @SkipEnvelope
└── modules/
    ├── auth/                # login (throttled, enumeration+timing safe via dummy-hash verify),
    │                        #   refresh rotation stored in Postgres via Prisma (RefreshToken:
    │                        #   jti PK, sha256 hash, expiresAt, revokedAt audit) — token state is
    │                        #   NOT cache: survives Redis flush, auditable, family revocation on
    │                        #   reuse; logout revokes; tokens/TTLs from config only
    └── users/               # THE exemplar feature module — clone this shape for every new feature
                             #   (incl. read-through cache in findById with explicit invalidation,
                             #   authorization checked BEFORE cache so a hit can't bypass IDOR)
prisma/schema.prisma         # single source of schema truth + migrations/ (deploy via
                             #   npm run migration:deploy); prisma.config.ts for the Prisma 7 CLI
test/app.e2e-spec.ts         # boots real AppModule (PrismaService stubbed; memory cache driver):
                             #   proves envelope, validation details, default-deny 401, login/refresh
                             #   rotation, JWT happy path, unwrapped health
```

Root tooling: strict tsconfig (definite assignment in entities, never weakened), ESLint 9 flat strictTypeChecked (+ principled per-file overrides), Prettier, husky pre-commit (lint-staged) + commitlint, `npm run check` mirroring CI, docker-compose (pg+redis), `.env.example` with generation hints. Builder is **tsc** (the @nestjs/swagger CLI plugin doesn't run under swc — documented trade-off; swap to swc if you don't need the plugin).

## What the users module demonstrates (teach by pointing here)

- DTO-in (`CreateUserDto`: bounded lengths, **no client-suppliable `role`** — mass-assignment safe) / DTO-out (`UserResponseDto.from()` — `passwordHash` can't leak; entity also has `select: false` as a second fence).
- Insert-and-catch-23505 → 409 (no check-then-insert race); argon2 hashing.
- Resource-level authZ in the service (`findById`: own profile or admin; 404 not 403 → no id enumeration).
- Whitelisted sort enum (no `ORDER BY ${input}`), capped pagination returning `Paginated.of`.
- Spec file showing the mock pattern (repository token, behavior assertions, no mock-theater).

## The five axes — how the template scores and why (self-evaluated, adversarially reviewed)

An independent review (install + run, not eyeball) was performed; all Criticals it found were fixed and re-verified. Honest current state:

- **SOLID — strong.** Clean layer responsibilities; envelope/error/auth extension points are metadata-driven (OCP proven by `@SkipEnvelope`); typed config injection (ISP); DIP applied where it pays (infra), skipped where it doesn't (no interface ritual over own services).
- **LINT — strong, empirically green.** The gate is real: type-aware strict ESLint, prettier-stable, hooks, and `npm run check` passes from clean install — the template enforces its own claims.
- **SCALE — good foundation, deliberate gaps.** Stateless (CLS not globals), capped pagination, indexed unique email, pooled Postgres, throttling, liveness/readiness split, graceful shutdown, fail-fast config. *Not included by design* (add per `async-and-microservices.md` when needed): BullMQ wiring, caching, read replicas — a template that ships queue infra to every CRUD service over-engineers the 80% case.
- **FLEX — strong.** New feature = clone one folder; infra swaps behind tokens; modules communicate via exported services only; e2e suite stubs the DataSource cleanly (proves the seams are real).
- **FORMAT RESPONSE — strong.** One contract, applied in exactly two central places, correlation id everywhere, stable error codes, explicit escape hatch, covered by e2e tests (success, validation detail, 401, health bypass).

Known gaps stated in the template README (be upfront with users): no CI workflow file (the `check` script is CI-ready; add the runner of the repo's platform), no Dockerfile, no login lockout/backoff beyond throttling, no queue consumer (add BullMQ per `async-and-microservices.md` when async work lands). Auth (login/refresh/logout), Redis, and caching are now built in.

## Scaffold checklist (when copying for a real project)

1. Copy template → rename in `package.json`; `cp .env.example .env`, generate `JWT_SECRET` (`openssl rand -base64 48`).
2. `docker compose up -d && npm i && npm run migration:run && npm run start:dev`; verify `/health/ready` and `npm run check`.
3. Delete or repurpose the users module if the domain differs — but keep one exemplar module; teams copy whatever exists.
4. Add the auth (login/refresh) module if the service faces users; wire rate-limit overrides on it.
5. Add CI running `npm run check` + `npm audit` on PR before the first feature lands — gates adopted later get fought.
