# Async work — queues, events, transporters, microservices

The rule from SKILL.md: anything slow, retryable, or third-party leaves the request path. This file is *how*.

## Decision ladder (escalate only when the rung below hurts)

1. **Fire-and-forget in-process event** (`@nestjs/event-emitter`) — optional side effects where loss-on-crash is acceptable (analytics ping). Dies with the process; never for must-happen work.
2. **BullMQ queue (Redis)** — the default for must-happen async: email, push, webhooks, exports, image processing, retries against flaky third parties. Survives crashes, has retry/backoff/DLQ semantics, in-process workers, zero new infra if Redis exists. **Most "we need Kafka" requirements are a BullMQ queue.**
3. **Nest transporters / message broker (RabbitMQ, Kafka, NATS, Redis pub/sub)** — when *separate deployables* must communicate, or event streams need replay/multiple independent consumer groups (Kafka), or routing topologies (RabbitMQ).
4. **Separate microservice** — independent scaling/deploy/tech needed AND ops maturity exists (see `architecture.md` decision ladder).

## BullMQ patterns (`@nestjs/bullmq`)

Producer: `queue.add('send-mail', payload, { attempts: 5, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, jobId })`. Worker: `@Processor('mail')` class extending `WorkerHost`, `process(job)` switch on `job.name`.

- **Idempotent jobs, always**: retries and at-least-once delivery mean a job can run twice. Natural keys (`jobId: order-confirm-${orderId}` dedupes in-queue) + idempotent effects (upsert; check-processed-marker before side effect; idempotency key on outbound API calls).
- **Retry with exponential backoff** on transient failures; throw to retry, `UnrecoverableError` to fail fast on permanent ones (bad payload). After max attempts the job lands in failed state — monitor it (Bull Board / metrics / alert on failed count); a silent failed queue is data loss with extra steps.
- Payloads carry **ids, not fat objects** (job data is serialized; stale snapshots lie — refetch in the worker).
- Workers do their own transactions; a worker is a second entry point to the domain — it calls the same service layer, not raw repos.
- Graceful shutdown: close workers on `onApplicationShutdown` so in-flight jobs finish/release (BullMQ handles re-delivery of stalled jobs, but don't rely on it as routine).
- Scheduling: repeatable jobs (`repeat: { pattern: '0 3 * * *' }`) or `@nestjs/schedule` `@Cron` for in-process tasks. **In multi-instance deployments `@Cron` runs on every instance** — guard with a distributed lock (Redis) or use BullMQ repeatable jobs (single execution) instead.

## Transactional outbox (when DB write + event publish must both happen)

Problem: `save(order)` then `queue.add(...)` — crash between them loses the event; queue-first risks event-without-order. Inside one DB transaction, write the domain change AND an `outbox` row (event type, payload, status). A relay (cron/worker) reads pending outbox rows, publishes, marks sent (consumers still dedupe — at-least-once). This is the correct answer whenever "X must happen if and only if the order was created" matters (payments, inventory, cross-service events). Skip it for best-effort side effects — the outbox is consistency bought with infrastructure.

## Nest transporters (`@nestjs/microservices`)

- Two styles: `@MessagePattern` (request-response — caller waits; couples availability) and `@EventPattern` (fire-and-forget events — prefer for decoupling).
- Hybrid app (HTTP + consumer in one process): `connectMicroservice()` on the main app — common and fine.
- **Kafka**: consumer groups for scaling; ordering only within a partition (choose the partition key deliberately — e.g. orderId); commits ≠ processed-exactly-once → consumers idempotent. Schema discipline on event payloads (versioned, additive evolution).
- **RabbitMQ**: ack/nack explicitly (`noAck: false`); design the DLX (dead-letter exchange) before you need it; prefetch tuned to worker capacity.
- Serialization errors and poison messages: catch, log with correlation id, dead-letter — an uncaught deserialize crash-loops the consumer on the same message.
- v11 note: transporter internals were overhauled (better flexibility/control, e.g. graceful shutdown and consumer options) — check the installed minor's docs before fighting the framework.

## Sagas / multi-service workflows

Long flow across services (order → payment → shipping): choreography (each service reacts to events) up to ~3 steps; beyond that orchestration (an explicit state machine — DB status fields driven by a process manager/queue, or Temporal if the repo has it) keeps the flow debuggable. Every step needs a compensation path (refund, release stock) — design compensations when designing the happy path, not during the incident.

## Observability for async (don't skip)

Correlation id flows from request → job payload → event headers → logs. Metrics: queue depth, job duration, failed count, consumer lag (Kafka). An async system without these is unmonitorable by construction (see `observability.md`).
