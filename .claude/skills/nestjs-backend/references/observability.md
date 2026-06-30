# Observability — logging, errors, health, metrics, shutdown

If you can't see it, you can't run it. Minimum bar for production: structured logs with correlation ids, one error funnel, a health endpoint, graceful shutdown.

## Structured logging

- **Pino** (`nestjs-pino`) is the de facto choice: JSON logs, fast, request auto-logging with serializers. Nest 11's built-in `ConsoleLogger({ json: true })` is now a viable lightweight alternative — match the repo.
- One logger, injected (`private readonly logger = new Logger(OrdersService.name)` or pino's), never `console.log` (uncorrelated, unleveled, sync-ish under load).
- **Correlation id**: accept `x-request-id` or generate per request (middleware/interceptor + `AsyncLocalStorage`/CLS so every log in the request carries it without parameter-threading); propagate into queue job payloads and outbound HTTP headers. Without it, multi-service debugging is archaeology.
- Levels with intent: `error` = needs human attention, `warn` = unexpected but handled, `log/info` = business events (order created), `debug` = diagnostics (off in prod). Log at boundaries: request in/out (auto), external calls (target, duration, outcome), job start/finish/fail.
- **Redaction**: configure the logger to redact `authorization`, `password`, `token`, cookie headers, PII fields. Leaked tokens in logs = breach via the log platform.

## Error funnel

- One global exception filter (`APP_FILTER`) → stable response envelope (see `api-design.md`) + structured error log with stack + correlation id. HttpExceptions logged at `warn` (4xx) vs `error` (5xx) — alert noise discipline.
- Unhandled rejections/exceptions: process-level handlers that log fatally and exit non-zero (let the orchestrator restart a known-bad process; don't limp on corrupted state).
- Error tracker (Sentry & co.) if the repo has one: capture in the filter with request context; release tagging so regressions map to deploys.
- v11 `IntrinsicException`: throw when you don't want the framework auto-logging an expected control-flow exception.

## Health & readiness

- `@nestjs/terminus`: `/health` checking DB ping, Redis, critical disk/memory. Distinguish **liveness** (process alive — keep cheap, no dependencies) from **readiness** (dependencies up — gate traffic) when running on Kubernetes; a liveness probe that checks the DB turns a DB blip into a restart storm.
- Don't auth-gate health endpoints; do keep them information-poor (no version/dependency details publicly if exposed).

## Metrics & tracing (when the repo is ready)

- Metrics: `prom-client` (or vendor agent) — RED basics per route (rate, errors, duration histogram), plus domain counters (orders_created), queue depth/failed jobs, DB pool saturation. Expose `/metrics` on an internal port/path.
- Tracing: OpenTelemetry auto-instrumentations (`http`, `express`, `pg`/`prisma`, `ioredis`) wired in a tracing bootstrap *imported before Nest* — gives spans across HTTP → service → DB → queue with the same trace id. Sample (e.g. 10%) under load.
- Don't hand-build dashboards before instrumenting the basics; RED + queue + pool covers 90% of incidents.

## Graceful shutdown

`app.enableShutdownHooks()` + `onApplicationShutdown` in providers owning resources: stop accepting work (server close), finish in-flight requests/jobs (deadline), close pools (DB, Redis, Kafka producers/consumers), then exit. Kubernetes default grace is 30s — finish under it or raise `terminationGracePeriodSeconds`. Symptom of skipping this: 502s and half-processed jobs on every deploy.

## Performance triage order (when "it's slow")

1. Measure first: which route/job, p50 vs p99, since when (deploy? data growth?).
2. DB almost always: missing index (EXPLAIN the slow query), N+1 (query log), unbounded result, pool exhaustion (waiting connections).
3. Event-loop blockers: sync crypto/zlib/fs, giant JSON parse/stringify, hot loops — `node --prof`/clinic or event-loop-lag metric.
4. Then caching (`@nestjs/cache-manager` + Redis): cache reads that are hot, expensive, and tolerant of staleness; every cache needs an invalidation story (TTL at minimum) — a cache without one is a bug factory.
5. Fastify adapter only after the above: it helps JSON-throughput-bound services, not DB-bound ones (most are DB-bound).
