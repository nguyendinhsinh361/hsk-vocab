# Security — audit checklist and recipes

Use this both to *write* secure code and to *audit* (Review mode). Ordered roughly by how often it's the breach.

## Contents
1. Input validation
2. Authentication (JWT done right)
3. Authorization (the part audits actually fail)
4. Injection
5. Secrets & config
6. Data exposure
7. HTTP hardening (helmet, CORS, rate limit)
8. File uploads
9. Multi-tenancy
10. Audit quick-list

---

## 1. Input validation

- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: false→true if repo tolerates, transform: true })`. **Without the global pipe, every class-validator decorator in the codebase is dead code** — the single most common NestJS vulnerability. Verify in `main.ts`/`APP_PIPE`; the survey script checks this.
- Every DTO field decorated; optional fields `@IsOptional()` + type check; nested: `@ValidateNested({ each: true }) @Type(() => ChildDto)`; arrays bounded (`@ArrayMaxSize`); strings bounded (`@MaxLength`) — unbounded strings are a DoS and storage bomb.
- `whitelist: true` strips unknown fields → kills **mass assignment** (user POSTs `{"role":"admin"}` into a permissive update). Also never spread `req.body`-derived DTOs straight into `repo.update()` for fields the user shouldn't control — pick fields explicitly.
- Params/queries validated too: `ParseIntPipe`/`ParseUUIDPipe` on ids, DTO with validators for query strings (pagination, filters). v11 adds `ParseDatePipe`.

## 2. Authentication

JWT + Passport is the norm:

- Access token short-lived (5–15 min) + refresh token (rotated, stored hashed, revocable). Long-lived access tokens = stolen token works for weeks.
- Secrets: `JWT_SECRET` from config validation (≥32 random bytes) — hardcoded secret or `'secret'` fallback is a Critical finding. Prefer RS256/ES256 when multiple services verify.
- Password hashing: bcrypt cost **≥12** (default 10 is below 2026 par) or argon2id. Async APIs only (`bcrypt.hash`, not `hashSync` — sync blocks the event loop under load). Login compares with `bcrypt.compare` always (no early return revealing user-exists; same error message + same timing path for unknown email and wrong password).
- Account safety: rate-limit login/register/forgot (`@nestjs/throttler` stricter override per-route), lockout/backoff on repeated failures, generic responses on forgot-password (no user enumeration).
- Cookies if used: `httpOnly, secure, sameSite`, CSRF protection for cookie-based sessions (token-in-header schemes don't need CSRF, cookie schemes do).

## 3. Authorization

Route-level guards are step one; **resource-level checks are where real apps fail**:

- Secure by default: global `JwtAuthGuard` via `APP_GUARD` + explicit `@Public()` decorator for the few open routes. The opposite (opt-in guards) guarantees someone forgets one — an unguarded mutating route is a Critical finding.
- **IDOR/BOLA** (OWASP API #1): `GET/PATCH/DELETE /orders/:id` must verify the order belongs to `req.user` (or role admin) *in the query* (`where: { id, userId }`) — fetching then comparing in code is fine too, but returning 404-not-403 consistently avoids resource enumeration. Every `:id` route gets this check; "the frontend only shows your own" is not a control.
- Roles/permissions: `@Roles('admin')` + `RolesGuard` reading `Reflector` is fine for simple RBAC; CASL for ability-based (own-resource edits). Authorize the *action on the object*, not just "is admin somewhere".
- Privilege changes (role grant, price override) are server-decided, never client-supplied fields.

## 4. Injection

- SQL: parameterized only. Red flags to grep: template literals inside `.query(` / `$queryRawUnsafe` / `whereRaw`-style strings; `ORDER BY ${sort}` (whitelist sort fields instead).
- NoSQL: never pass raw body into Mongo filters — `{ email: { $gt: "" } }` bypasses equality logins. With validated DTOs (strings validated as strings) this is largely neutralized — another reason validation is non-negotiable. Sanitize/reject `$`-prefixed keys in any dynamic filter builder.
- Command/path: no `exec(userInput)`; path-join user filenames against a fixed dir + reject `..`.

## 5. Secrets & config

- No secrets in code, in committed `.env`, in logs, in error responses, in Swagger examples. `.env` in `.gitignore`; `.env.example` with placeholders. Found a committed secret in an audit → Critical + rotate it (deleting the line later doesn't un-leak git history).
- Config schema validation makes missing secrets fail at boot (no `|| 'default-secret'` fallbacks — that fallback IS the vulnerability).

## 6. Data exposure

- Response DTOs / `ClassSerializerInterceptor` + `@Exclude()` so password hashes, tokens, internal flags can't leak — returning entities raw is how `passwordHash` ends up in JSON.
- Error hygiene: global filter returns stable shapes; no stack traces, SQL, or ORM error dumps to clients (Prisma errors are chatty — map them). Log the detail server-side with correlation id instead.
- Logs: never log credentials, tokens, full card/PII; redact known fields in the logger config.

## 7. HTTP hardening

- `helmet()` on; CORS with an explicit origin allowlist from config (`origin: true`/`*` with credentials is a finding).
- `@nestjs/throttler` globally (sane default like 100/min) + strict overrides on auth/expensive routes; behind a proxy set the real-IP resolution correctly.
- Body size limits (default ~100kb–1mb json; don't raise globally for one endpoint — raise per-route).
- Swagger in prod: off or auth-gated.

## 8. File uploads

- Validate MIME by magic bytes (not extension/client header), cap size, randomize stored names, store outside web root / in object storage, never execute or serve raw from upload dir without content-type lock. Image processing in a queue, not inline.

## 9. Multi-tenancy

- Tenant id comes from the authenticated context (token/org membership), never from body/query. Every query in tenant scope filters by it — a missing `tenantId` in one `where` is a cross-tenant leak; centralize via scoped repository/middleware if the repo has the pattern.

## 10. Audit quick-list (grep-able order)

1. `main.ts`: global ValidationPipe? helmet? CORS allowlist? shutdown hooks?
2. Guards: global auth guard or any unguarded mutating route? `@Public()` audited?
3. Resource-level ownership checks on every `:id` route?
4. Grep: hardcoded secrets / `|| 'secret'` / committed `.env`?
5. Grep: string-built SQL, `$queryRawUnsafe`, `ORDER BY ${`?
6. Entities returned raw anywhere? password column `select: false`/`@Exclude`?
7. bcrypt cost / argon2? sync hashing? login user-enumeration?
8. Rate limiting on auth + expensive routes?
9. `synchronize: true` in prod config?
10. Unbounded list endpoints / `@ArrayMaxSize` / `@MaxLength` missing?
11. JWT expiry + refresh rotation + secret strength?
12. Error responses leaking internals?
