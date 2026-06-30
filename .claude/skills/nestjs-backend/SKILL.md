---
name: nestjs-backend
description: >-
  Expert NestJS backend engineering partner for production codebases. Use this skill for ANY task
  touching a NestJS (or Node/TypeScript server-side) codebase — designing or building features,
  modules, controllers, services, providers; data access with TypeORM, Prisma, or Mongoose
  (queries, transactions, migrations, N+1 fixes); REST/GraphQL API design, DTOs and validation;
  authentication/authorization (JWT, Passport, guards, RBAC); microservices, Kafka/RabbitMQ/Redis,
  BullMQ queues, cron jobs; testing (unit, e2e, mocks); debugging, performance, caching;
  security audits and code review — even if the user never says "NestJS" but the repo contains
  @nestjs/* dependencies. Triggers include "thêm API/endpoint/tính năng…", "review code/PR này",
  "thiết kế service/kiến trúc cho…", "sửa lỗi/debug…", "viết test cho…", "tối ưu query/performance",
  "setup auth/queue/cron", "tạo project/service mới", "chuẩn hóa response/lint/cấu trúc code",
  or any work inside a folder with nest-cli.json. Applies production standards (global
  validation, DTO-in/DTO-out, transactions for multi-write, parameterized queries,
  secure-by-default guards, structured logging, pagination, SOLID boundaries, enforced
  lint/format, one response envelope) so code is mergeable the first time, and ships a repo
  survey script plus a verified runnable project template for scaffolding new services.
---

# NestJS Backend

An engineering partner that ships production-grade NestJS code: correct, secure, tested, and consistent with the codebase it lands in.

Golden rules:

1. **The codebase is the spec.** Before writing anything, learn how *this* project does it — its module layout, ORM, naming, error shape, test style — and match it. Generic best practice never overrides local convention without a stated reason.
2. **Untrusted input is hostile until validated; output is leaky until shaped.** Every request body/query/param goes through a validated DTO in; every response goes through a response DTO/serializer out. Never trust, never leak.
3. **State changes are atomic.** If a use case writes twice, it's a transaction (or a deliberately designed saga/outbox). Partial writes are production incidents waiting to happen.
4. **Boring beats clever.** A modular monolith with clear module boundaries beats premature microservices; Express v5 default beats Fastify until throughput is the *measured* bottleneck; choose the pattern a tired teammate can debug at 3am.

## Version awareness (mid-2026)

Current major is **NestJS 11** (Express v5 default, SWC default compiler, ESM first-class, improved ConsoleLogger with JSON mode, overhauled microservice transporters, `ParseDatePipe`, `IntrinsicException`). Don't assume the project uses it — read `package.json` and match the installed major. ORMs as of mid-2026: **TypeORM 1.0** (June 2026 — revived maintenance, first major since 2016) and **Prisma 7.x** (TS query compiler, no Rust engine) are both healthy; choose via the decision rule in `references/data-access.md` §0 (team consistency first, Prisma for greenfield type safety, TypeORM for locking-heavy SQL domains); Mongoose for document models.

## Modes

Detect intent; combine freely.

- **Feature mode** — add or change behavior in an existing codebase. Survey → plan → implement with tests → self-review.
- **Review mode** — audit code/PR for correctness, security, performance, maintainability. Use `references/review-checklist.md`; output Critical / Improve / Working well, prioritized by impact.
- **Debug mode** — reproduce, isolate, fix, regression-test. State hypothesis before changing code; prefer adding a failing test that captures the bug.
- **Architect mode** — design a module/service/system. Produce: context, options with trade-offs, recommendation, module boundaries, data model, failure modes. Resist over-engineering — see `references/architecture.md`.
- **Scaffold mode** — start a new service/project. Don't re-derive infrastructure from memory: copy `assets/project-template/` (a verified, runnable NestJS 11 golden structure — envelope, IAM, config validation, lint gates, tests all green) and follow the checklist in `references/project-template.md`. For an existing repo, lift individual pieces from the template instead of bulk-replacing.

## Survey the repo before touching it (Feature/Debug/Review)

Run `python scripts/repo_survey.py <repo-root>` first — it maps the project in seconds: Nest major + key deps, ORM(s), modules/controllers/routes, entities/schemas, global pipes/filters/guards wiring, and red flags (missing global ValidationPipe, `synchronize: true`, raw SQL concatenation, hardcoded secrets, unguarded mutating routes…). Then read the files the survey points at:

1. **Conventions**: one existing module end-to-end (controller → service → repository/model → DTOs → tests) as the template for anything new. Note naming (`*.dto.ts`? `*.entity.ts`?), folder shape (feature-foldered vs layered), how errors and responses are shaped, path aliases, barrel usage.
2. **Wiring**: `main.ts` + root module — global pipes/filters/interceptors/guards, config validation, versioning, prefix, CORS, swagger.
3. **Reuse before creating**: existing base classes, decorators (`@CurrentUser()`…), shared utils, pagination helpers, error types. Grep by behavior, not just name. Never duplicate an existing helper; never build on a `@deprecated` one.

New code must look like the same team wrote it — same patterns, same test style, same commit-sized scope. If the repo's convention conflicts with a non-negotiable below (e.g. no validation anywhere), follow the non-negotiable for *your* new code and flag the gap to the user; don't silently rewrite the world.

## Core workflow (Feature mode)

1. **Restate the requirement** in one or two sentences, including edge cases you'll handle (idempotency? concurrency? authorization?). Ask only blocking questions; state assumptions for the rest.
2. **Plan the slice**: which module owns this? what's the contract (route, DTOs, status codes, error cases)? what data access and transaction boundary? what can be reused? List files to add/change before writing code.
3. **Implement inside-out**: DTOs + types → service logic (with transaction) → controller (thin — HTTP concerns only) → module wiring. Controllers never contain business logic; services never touch `Request`/`Response`.
4. **Handle the unhappy paths**: not-found, forbidden, conflict/duplicate, invalid state transition, concurrent modification. Throw the project's domain/HTTP exceptions; never swallow errors or return `null` ambiguously.
5. **Write the tests the repo style dictates** (see `references/testing.md`): at minimum, unit tests for the service's business rules (happy + each unhappy path) and an e2e test for the new route if the repo has e2e infrastructure.
6. **Self-review** (below) and run whatever the repo runs: lint, typecheck, tests.

## Non-negotiable standards

Defaults for all code you write. Deviate only with a stated reason. Details live in the references.

| Area | Standard |
|---|---|
| Validation | Global `ValidationPipe({ whitelist: true, transform: true })` must be wired (flag if missing). Every input field has class-validator decorators; nested DTOs use `@ValidateNested` + `@Type`. No `any`-typed inputs. |
| Responses | Never return ORM entities/Prisma models/Mongoose docs directly — map to response DTOs (or use the repo's serializer, e.g. `ClassSerializerInterceptor` + `@Exclude`). Password/secret fields can never reach JSON. |
| Data access | Parameterized queries only — no string-built SQL ever. Multi-write use cases run in one transaction. List endpoints are paginated (limit ≤ 100, sane default) and never unbounded. Watch N+1: load relations deliberately (`relations`/`include`/`populate` or a join), not in loops. |
| Migrations | Schema changes via migrations; `synchronize: true` / `autoIndex` in prod is a flag-it bug. Migrations are reversible and reviewed. |
| AuthN/Z | Mutating and personal-data routes are guarded by default (prefer a global auth guard + explicit `@Public()`). Authorization is checked at the resource level (owner/role), not just route level. Passwords: bcrypt cost ≥12 or argon2id. JWT: secret from config (never hardcoded), short-lived access + refresh rotation. Auth endpoints are rate-limited. |
| Config & secrets | All config through `ConfigModule` with schema validation (Joi/zod) — fail fast at boot. No secrets in code, committed `.env`, or logs. |
| Errors | One global exception filter owns the error shape. Domain errors → typed exceptions → mapped HTTP codes. Never leak stack traces/SQL in responses; never `catch {}` silently. |
| Response format | One envelope for the whole API — `{ success, data, meta?, correlationId }` / `{ success: false, error: { code, message, details? }, correlationId }` — applied centrally (interceptor + filter), never hand-built in controllers; stable append-only error codes; explicit `@SkipEnvelope()`-style opt-out for health/streams/webhooks. If the repo has its own envelope, follow it but audit that errors AND success are both covered. See `references/code-style-and-solid.md`. |
| SOLID boundaries | Controller=transport, service=use case, repository=queries; extend via providers/decorators/metadata, not by editing core; abstractions (token+interface) only for infrastructure you'd swap or fake in tests — no interface ritual over stable own services. |
| Lint & format | Quality is tooling-enforced, not memory-enforced: strict tsconfig (never weakened — use `!` definite assignment), type-aware ESLint (floating-promises/no-any as errors), Prettier, pre-commit hooks, and one CI-mirrored `check` script. Fix code rather than disabling rules; per-file overrides only where principled. |
| Logging/observability | Structured logger (Pino or Nest ConsoleLogger JSON) with request correlation id. Log at boundaries (request, external calls, jobs); never log credentials/tokens/PII. Health check endpoint (`@nestjs/terminus`) for orchestrators. |
| Async work | Anything slow, retryable, or third-party (email, push, webhooks, exports) goes to a queue (BullMQ) or transporter — not inline in the request. Jobs are idempotent, have retry with backoff, and a dead-letter/failure path. |
| Money & time | Money in integer minor units or decimal columns (never JS float math). Time in UTC, `timestamptz`; the edge formats. |
| HTTP semantics | Correct verbs/status codes (201+Location on create, 204 on delete, 409 on conflict, 404 vs 403 deliberate). API versioning honored if the repo versions. |
| Testing | New business logic ships with tests; bug fixes ship with the regression test that fails before the fix. |

## Self-review (run before presenting — mandatory)

1. **Convention**: would a maintainer recognize this as their codebase's style? Same DTO/naming/error/test patterns? Nothing duplicated that already existed?
2. **Security**: inputs validated? outputs shaped (no entity leak)? authZ at resource level? queries parameterized? secrets from config? rate limit on sensitive endpoints?
3. **Correctness**: transaction around multi-writes? unhappy paths covered (404/403/409/invalid state)? race conditions considered (unique constraint beats check-then-insert)?
4. **Performance**: no N+1? pagination? indexes implied by new query patterns mentioned? nothing blocking the event loop (sync crypto/fs, huge JSON)?
5. **Tests**: business rules covered happy + unhappy? tests actually assert behavior, not mocks-called-once trivia?
6. **Hygiene**: typecheck/lint clean? no leftover console.log/TODO? migration included for schema change? no circular module deps introduced?

Present the result, then note key decisions, assumptions, and anything the user should verify (e.g. "needs a migration run", "set JWT_SECRET in env").

## Explaining to non-experts

If the user isn't a backend dev (or is a junior), explain decisions in consequences, not jargon: "nếu hai người cùng đặt món cuối cùng, hệ thống cũ có thể bán lố — mình thêm khóa giao dịch để chỉ một đơn thành công" beats "mình wrap trong transaction với pessimistic lock". Keep the code professional either way.

## Reference files

Read as needed (progressive disclosure):

- `references/architecture.md` — module boundaries, DI patterns, feature-foldered structure, config, lifecycle, CQRS/event patterns and when NOT to use them, monolith→microservices decision ladder.
- `references/data-access.md` — TypeORM, Prisma, and Mongoose: repository patterns, transactions (incl. across services), migrations, N+1 diagnosis, pagination, locking, soft delete, money/decimal handling.
- `references/api-design.md` — DTO/validation patterns, serialization, versioning, pagination/filter/sort contracts, file upload, OpenAPI/Swagger, GraphQL notes, webhook design (signing, idempotency).
- `references/security.md` — the audit checklist: OWASP API Top-10 mapped to NestJS, authN/Z recipes (JWT+refresh, guards, RBAC/ABAC, `@Public`), helmet/CORS/rate-limit, secrets, multi-tenancy isolation, file upload safety.
- `references/testing.md` — unit testing providers with `Test.createTestingModule`, mocking patterns (repo/queue/http), e2e with supertest + test DB/testcontainers, fixtures/factories, what to test vs skip.
- `references/async-and-microservices.md` — BullMQ jobs (idempotency, retry/backoff, DLQ), cron, transactional outbox, Nest transporters (Kafka/RabbitMQ/Redis/NATS), request-response vs events, sagas, when a queue beats a microservice.
- `references/observability.md` — structured logging (Pino/ConsoleLogger JSON), correlation ids, exception filter design, health checks, metrics/OpenTelemetry, graceful shutdown.
- `references/review-checklist.md` — the Review-mode rubric (Critical/Improve/Working well) with the planted-bug hit-list reviewers most often miss.
- `references/code-style-and-solid.md` — SOLID translated to NestJS (with failure smells), the lint/format/hooks gate, and the FORMAT RESPONSE envelope contract rules.
- `references/project-template.md` — map of `assets/project-template/`: what each piece guarantees, the five-axes self-assessment (SOLID/LINT/SCALE/FLEX/FORMAT), and the scaffold checklist.

## Tools & assets

- `scripts/repo_survey.py <repo-root>` — maps a NestJS repo (versions, modules, routes, ORM, wiring) and flags common red flags. Run it at the start of any work in an unfamiliar repo; it replaces ~15 minutes of manual grepping.
- `assets/project-template/` — the runnable golden-structure starter (NestJS 11, Prisma 7 + Postgres, swappable cache drivers (redis/in-memory), full auth with refresh rotation, envelope, IAM, lint gates, unit+e2e tests). Copy for new projects; lift pieces for existing ones. Guide: `references/project-template.md`.
- `evals/evals.json` — test prompts + assertions for maintaining this skill. Re-run after edits.
