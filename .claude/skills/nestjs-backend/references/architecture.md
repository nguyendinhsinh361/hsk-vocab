# Architecture — modules, DI, structure, and when NOT to add complexity

## Project structure: feature-foldered modular monolith

Group by feature/domain, not by technical layer. Each feature module owns everything it needs:

```
src/
├── main.ts                 # bootstrap: pipes, filters, swagger, shutdown hooks
├── app.module.ts           # composition root: Config, ORM, feature modules
├── common/                 # truly cross-cutting only: filters, interceptors,
│   │                       # decorators (@CurrentUser), base DTOs (pagination)
├── config/                 # typed config + validation schema
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── dto/ (create-order.dto.ts, order-response.dto.ts, …)
│   ├── entities/ | schemas/
│   └── orders.service.spec.ts
└── users/ …
```

Rules that keep this healthy:

- **A module owns its providers.** Other modules consume its *exported* service, never reach into its internals or its repository. If `OrdersService` needs user data, it calls `UsersService` (imported via `UsersModule`), not `User` repository directly — repository access across module lines is the #1 coupling smell.
- **`common/` is for the truly generic.** If only two modules share something domain-flavored, make a real domain module for it; `common/` becoming a junk drawer is how monoliths rot.
- **No circular module imports.** If A needs B and B needs A, you've drawn the boundary wrong — extract the shared concern into a third module, or invert with events. `forwardRef()` is a last resort and a design smell to call out, not a habit.
- **Thin controllers, fat-ish services, dumb entities.** Controller: HTTP in/out only. Service: use cases and rules. If a service grows past ~400 lines or 8+ dependencies, split by use case (e.g. `OrdersQueryService` / `OrdersCommandService` or extract a sub-domain).

## Dependency injection patterns

- Constructor injection, `private readonly`. Avoid property injection and `ModuleRef` lookups except in dynamic edge cases.
- **Inject abstractions for swappable infrastructure**: define a token + interface (`PAYMENT_GATEWAY`) and bind the implementation in the module. Worth it for: payment, mail, SMS, storage, external APIs — anything you'd mock in tests or swap by env. NOT worth it for your own services (inject the class directly; don't ritualize interfaces).
- **Scopes**: default singleton for nearly everything. `Scope.REQUEST` is contagious (everything injecting it becomes request-scoped) and costs per-request instantiation — avoid for hot paths; prefer `AsyncLocalStorage`/CLS for request context (user, correlation id).
- **Lifecycle**: use `onModuleInit` for warmup/connection checks, `onApplicationShutdown`/`enableShutdownHooks()` for graceful close (DB pools, queue workers, Kafka consumers). Production containers get SIGTERM — handle it.
- **Dynamic modules** (`forRoot/forRootAsync/forFeature`) for configurable infrastructure modules; always provide the async variant reading from `ConfigService`.

## Configuration

- `ConfigModule.forRoot({ isGlobal: true, validationSchema })` with Joi or zod — **boot must fail** on missing/invalid env, not at first request 3 hours later.
- Typed accessors: a `config/` namespace (`registerAs('db', …)`) injected as `ConfigType<typeof dbConfig>` beats stringly `configService.get('DB_HOST')` scattered everywhere.
- One source of truth per environment; no `process.env` reads outside the config layer.

## Layering and where logic lives

Pragmatic default (not full Clean Architecture ceremony):

- **Controller** — transport: parse/validate via DTO, call one service method, map to response DTO. No branching business logic.
- **Service (use case)** — orchestration + business rules + transaction boundary.
- **Repository/data layer** — query construction. With TypeORM, custom repositories or query methods on the service are both acceptable — follow the repo. With Prisma, a thin `PrismaService` and feature services querying it is the norm; extract a repository class when queries get reused/complex.
- **Entities/models** — data shape; light invariants OK (e.g. status transition method), no I/O.

Full hexagonal/Clean Architecture (ports/adapters, use-case classes) is justified when: core domain with complex rules, multiple delivery mechanisms (HTTP + queue + cron all triggering same use cases), or a team that already practices it. Don't impose it on a CRUD app — the indirection tax is real.

## CQRS, events, and other patterns — decision ladder

Escalate only when the previous rung demonstrably hurts:

1. **Plain services** — default. Most apps end here happily.
2. **In-process events** (`@nestjs/event-emitter` or CQRS events) — when side effects multiply (order created → email + analytics + loyalty). Keep the *transaction-critical* part synchronous in the use case; events for the optional tails. Remember in-process events die with the process — anything that must survive goes to a queue/outbox (see `async-and-microservices.md`).
3. **@nestjs/cqrs** (commands/queries/handlers; v11 has strongly-typed commands and request-scoped provider support) — when use cases are numerous and audit/replay matters. It's structure, not magic; don't adopt for 5 endpoints.
4. **Modular monolith with enforced boundaries** — modules communicate only via exported services/events; consider one schema per module. This is the sweet spot for most teams scaling up.
5. **Extract a microservice** — only when a module needs independent scaling, independent deploys, or a different tech, AND you have the ops maturity (tracing, contracts, on-call). Network boundaries turn method calls into failure modes; the ladder exists because step 5 is expensive.

## main.ts production checklist

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new GlobalExceptionFilter());   // or APP_FILTER provider
app.enableVersioning({ type: VersioningType.URI });   // if the API versions
app.enableShutdownHooks();
helmet(); CORS with explicit origins; swagger gated to non-prod (or auth-walled);
listen on 0.0.0.0 for containers.
```

Prefer `APP_PIPE`/`APP_FILTER`/`APP_GUARD`/`APP_INTERCEPTOR` providers in `AppModule` over `useGlobal*` when anything needs DI (e.g. a guard needing `Reflector` + `ConfigService`) — `useGlobal*` instances live outside DI.

## Naming & misc conventions (when the repo has none)

- Files: `kebab-case.type.ts` (`create-order.dto.ts`, `orders.service.ts`). Classes: `PascalCase` with suffix (`CreateOrderDto`, `OrdersService`).
- One class per file; no default exports; path aliases (`@app/...`) if tsconfig has them.
- Keep module count honest: a 6-entity app doesn't need 14 modules; a `god.module.ts` importing everything needs splitting.
