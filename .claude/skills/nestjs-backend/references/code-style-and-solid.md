# Code style — SOLID in NestJS terms, lint/format gates, response contract

Three pillars the codebase must hold regardless of feature pressure: principled boundaries (SOLID), mechanical enforcement (lint/format/CI), and one response contract (FORMAT RESPONSE). The working implementation of everything here lives in `assets/project-template/` — copy from it rather than re-deriving.

## SOLID, translated to NestJS (with the failure smell for each)

- **S — Single Responsibility.** Controller = transport; service = use case; repository/data layer = queries; entity = shape. *Smell:* a controller branching on business rules; a service formatting HTTP responses; one service with 8+ injected deps doing three domains' work → split by use case.
- **O — Open/Closed.** Extend by adding providers/modules, not by editing core. Cross-cutting changes ride decorators/interceptors/filters: a new response field touches only `ResponseEnvelopeInterceptor`; a new error code only extends `ErrorCode` + filter mapping; `@SkipEnvelope()` shows the pattern — opt-out via metadata, no interceptor surgery per controller. *Smell:* a PR that edits `common/` every time a feature lands.
- **L — Liskov Substitution.** Any implementation bound to a token must honor the token's contract (`PAYMENT_GATEWAY`, `MAIL_PROVIDER`): same error semantics, same idempotency expectations — tests written against the interface must pass for every adapter. *Smell:* `if (provider instanceof StripeGateway)` in a service.
- **I — Interface Segregation.** Inject the narrowest thing that serves the use case. Don't pass `ConfigService` everywhere — inject the typed namespace (`ConfigType<typeof authConfig>`); don't export a 20-method service when consumers need 2 — split or expose a focused facade. *Smell:* mocks in tests that stub 1 of 15 methods.
- **D — Dependency Inversion.** Domain/services depend on abstractions for *infrastructure that varies* (mail, payment, storage, external APIs): interface + injection token, implementation bound in the module. Don't ritualize it for your own stable services — inject classes directly; an interface with exactly one forever-implementation is noise. *Smell:* `new SomeClient()` inside a service (untestable, unswappable); equally, `IUserService` wrappers over every service (cargo cult).

Rule of thumb for the right amount of abstraction: **would you swap or fake it in tests?** Yes → token + interface. No → concrete class.

## Lint / format / hooks — the mechanical gate

Quality that depends on memory decays; encode it in tooling (template has all of this wired):

- **tsconfig strict, non-negotiable**: `strict: true` + `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`. Entities/DTOs use definite assignment (`id!: number`) rather than weakening `strictPropertyInitialization`.
- **ESLint 9 flat config** with `typescript-eslint` **strictTypeChecked + stylisticTypeChecked** (type-aware). Highest-value rules: `no-floating-promises` (the silent-async-failure killer), `no-misused-promises`, `no-explicit-any` (error in prod code), `no-console`, `max-lines-per-function`/`complexity` as warn-level pressure gauges. Principle: per-file overrides where the rule misfits the file class (`no-extraneous-class` off for `*.module.ts`; `no-unsafe-*` relaxed in tests for supertest/jest) — **fix code rather than disabling rules** elsewhere.
- **Prettier owns formatting** (singleQuote, trailingComma all, printWidth 100); ESLint defers via `eslint-config-prettier`. Format arguments end here.
- **Husky + lint-staged**: pre-commit runs eslint --fix + prettier on staged files; commit-msg runs commitlint (Conventional Commits — gives parseable history and changelog automation).
- **One CI-mirrored command**: `npm run check` = typecheck → lint → format:check → unit → e2e. Local green must equal CI green; a check that only exists in CI gets discovered after the push.
- New-repo order of adoption when retrofitting an old codebase: prettier (one giant commit) → eslint with errors-as-warnings → ratchet to errors rule-by-rule. Never mix a format-everything commit with logic changes.

## FORMAT RESPONSE — one envelope, applied in exactly one place

The contract (see `common/types/api-response.ts`):

```jsonc
// success
{ "success": true,  "data": <DTO>, "meta": { "page": 1, "limit": 20, "totalItems": 113, "totalPages": 6 }, "correlationId": "uuid" }
// error
{ "success": false, "error": { "code": "CONFLICT", "message": "human-readable", "details": [/* field errors */] }, "correlationId": "uuid" }
```

Rules that keep it trustworthy:

1. **Controllers never build envelopes.** They return plain DTOs or `Paginated.of(rows, total, page, limit)`; `ResponseEnvelopeInterceptor` wraps success, `GlobalExceptionFilter` wraps failure. Hand-built envelopes drift (and double-wrap) within a month.
2. **`error.code` is the machine contract**: stable enum (`ErrorCode`), append-only — clients branch on it; renaming one is a breaking change. `message` is for humans; `details` carries field-level validation errors.
3. **`correlationId` in every response**, success or failure, sourced from CLS (one id per request, also the `x-request-id` response header and the log field) — support can trace any user report to exact log lines.
4. **Escape hatch is explicit**: `@SkipEnvelope()` for endpoints that own their format (health/terminus, file streams, webhooks with provider-dictated shapes, SSE). Opt-out metadata, never if/else path lists inside the interceptor.
5. **Map every infrastructure error** at the filter: 503 with detail for readiness, Postgres `23505` → CONFLICT at the service layer, unknown → INTERNAL with internals logged (never leaked).
6. When the repo already has its own envelope: follow it (codebase is the spec), but audit that it covers errors AND success consistently — half-enveloped APIs (success wrapped, errors raw framework JSON) are the most common drift.
