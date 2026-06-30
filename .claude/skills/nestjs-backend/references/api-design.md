# API design — DTOs, serialization, contracts

## DTO discipline

- **In**: `CreateOrderDto` etc., class-validator decorated, `readonly` fields. Update DTOs via `PartialType(CreateOrderDto)` (from `@nestjs/swagger` so docs inherit, or `@nestjs/mapped-types`). Pick/Omit/Intersection types compose instead of duplicating.
- **Out**: explicit response DTOs (`OrderResponseDto`) with a static/`plainToInstance` mapper, or entities through `ClassSerializerInterceptor` with `@Exclude`/`@Expose` — follow the repo's existing choice. Out-DTOs decouple API shape from DB shape: you can rename a column without breaking clients.
- Shared enums/constants live once (e.g. `OrderStatus`) and are imported by entity + DTO; duplicated string unions drift.

## Status codes & verbs (deliberate, not default)

- POST create → **201** + body (and `Location` if the repo does REST strictly). Nest defaults POST to 201 already; don't `@HttpCode(200)` it away without reason.
- DELETE → **204** no body (or 200 + body if repo convention).
- Validation fail → 400; unauthenticated → 401; authenticated-but-forbidden → 403 (or 404 to avoid resource enumeration — be consistent); missing → 404; duplicate/state conflict → **409**; un-processable domain rule → 422 if repo uses it; throttle → 429.
- PATCH = partial update (the norm); PUT = full replace (rare; don't mix semantics).
- Idempotency: GET/PUT/DELETE naturally; POST that clients may retry (payments) accepts an `Idempotency-Key` header backed by a unique column.

## Pagination / filtering / sorting contract

One shared `PaginationQueryDto` (page/limit or cursor, validated, capped) reused everywhere; response `{ data, meta }`. Filters are explicit DTO fields (`status?: OrderStatus`), not a free-form `filter` string; sort is a whitelisted enum. (Implementation details in `data-access.md` §6.)

## Versioning

If the API is consumed by others, enable URI versioning (`/v1/...`) from day one — adding it later breaks every client. `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`; `@Version('2')` per controller/route for divergence. Internal-only APIs can skip versioning; breaking changes then ride deploys + coordinated clients.

## Errors — one shape

Global exception filter emits a stable envelope, e.g.:

```json
{ "statusCode": 409, "error": "ORDER_NOT_CANCELLABLE",
  "message": "Đơn đã giao không thể hủy", "correlationId": "…" }
```

- Machine-readable `error` code (enum, documented) for clients to branch on; human `message` for display; never internals.
- Services throw domain-flavored `HttpException` subclasses (or domain errors mapped in the filter) — controllers don't try/catch-and-translate per route.
- Validation errors keep class-validator's per-field detail (clients need to know *which* field).

## Swagger / OpenAPI

- `@nestjs/swagger` with CLI plugin (auto-infers `@ApiProperty` from types — less decorator noise). Tag per module, `@ApiOperation` summaries, response types declared (`@ApiOkResponse({ type: OrderResponseDto })`), auth scheme declared and applied.
- The spec is a contract artifact: if the repo generates clients from it, breaking-change review = diff the spec in CI.
- Gate the UI in production (off or behind auth).

## File upload & streaming

- `FileInterceptor` + `ParseFilePipe` with `MaxFileSizeValidator` + `FileTypeValidator` (and magic-byte check for real safety — `security.md` §8). Large files: stream to object storage, don't buffer in memory.
- Server-sent events via `@Sse()` for one-way streams; WebSocket gateways for duplex — same auth rigor as HTTP (guard the handshake).

## Webhooks (outbound to partners / inbound from providers)

- Inbound (Stripe-style): verify signature on the **raw body** (configure raw-body for that route — global JSON parsing destroys the signature base), respond 2xx fast, process async via queue, dedupe by event id (providers redeliver).
- Outbound: sign payloads (HMAC), retry with backoff, include event id + timestamp; document the contract.

## GraphQL notes (when the repo uses it)

- Code-first (`@ObjectType`/`@Resolver`) is the common Nest path. Guards/interceptors apply via `GqlExecutionContext`.
- N+1 is the default failure mode of resolvers → DataLoader per request for relation fields.
- Depth/complexity limits on the schema (query bombs are a DoS); disable introspection/playground in prod unless intended.
- Errors: map domain errors to GraphQL error codes; don't leak internals in `extensions`.

## Backwards compatibility rules of thumb

Additive is safe (new optional field, new endpoint). Breaking: removing/renaming fields, changing types/semantics, tightening validation on existing fields, changing error codes clients branch on. Breaking ⇒ new version (or coordinated deploy for internal APIs) + changelog note.
