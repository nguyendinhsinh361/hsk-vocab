# Data access — TypeORM, Prisma, Mongoose

Match the repo's ORM. The same four invariants apply to all three: parameterized queries, explicit transactions for multi-write, deliberate relation loading (no N+1), bounded result sets.

## Contents
0. Choosing TypeORM vs Prisma (decision rule)
1. Transactions (the part everyone gets wrong)
2. N+1 — diagnosis and fixes
3. TypeORM specifics
4. Prisma specifics
5. Mongoose specifics
6. Pagination contracts
7. Concurrency & locking
8. Migrations
9. Money, time, soft delete

---

## 0. Choosing TypeORM vs Prisma (state of mid-2026)

Both are healthy now — this is no longer a maintenance argument. TypeORM shipped **1.0** (June 2026) after new maintainers revived the project (575 PRs merged in 2025 vs 63 the year before); Prisma **7.x** dropped the Rust engine for a TypeScript query compiler (~3x faster queries, ~90% smaller bundles, query caching since 7.4).

Decision rule, in priority order:

1. **Team consistency wins.** If the team's existing services use one ORM, new services use the same one — two ORMs across a team doubles review knowledge, helper libraries, and onboarding. This usually decides it; don't relitigate per project.
2. **Greenfield, no legacy**: Prisma — schema-first migrations workflow, end-to-end type safety (where clauses, selects, and results are all compile-checked — the strongest junior-bug prevention), guided consistency.
3. **Transaction/locking-heavy SQL domains** (orders/inventory/payments with pessimistic locks, conditional atomic updates, decimal columns, hand-tuned joins): TypeORM expresses these natively (`setLock`, `increment`, query builder); Prisma can do all of it but pushes you to `$queryRaw` sooner.
4. Runtime performance is **not** a deciding factor anymore for typical DB-bound services — both are fine; your indexes and N+1s dominate.

Trade-off cheat sheet: Prisma = better types/DX/migrations, schema.prisma as single source, weaker at exotic SQL without raw escape hatches; TypeORM = entities-as-classes fits Nest DI/decorator culture, stronger query builder and locking ergonomics, weaker compile-time safety (typos in `where` keys survive to runtime) — compensate with strict DTOs and tests.

## 1. Transactions

A use case that performs 2+ writes that must succeed or fail together = one transaction. The classic bug: create order, then decrement stock — crash in between, stock and orders disagree forever.

- **TypeORM**: `dataSource.transaction(async (em) => { … })` — and *every* operation inside must use `em` (or repositories derived from it: `em.getRepository(Order)`), not the ambient repositories. Mixing ambient repos into a transaction block silently runs them outside the transaction — the most common TypeORM transaction bug.
- **Prisma**: `prisma.$transaction(async (tx) => { … })` (interactive) or array form for independent statements. Same rule: use `tx.*` inside, never `this.prisma.*`.
- **Mongoose**: `const session = await conn.startSession(); session.withTransaction(…)` — requires replica set; pass `{ session }` to every op. If the deployment has no replica set, design for single-document atomicity instead (embed, `findOneAndUpdate`).

Cross-service writes: the service that owns the use case opens the transaction and passes the manager/tx down (explicit parameter beats magic CLS, unless repo already uses `typeorm-transactional` CLS — then follow it). Transaction + external call (HTTP, queue publish, email) = wrong: do the external part after commit, or use the outbox pattern (`async-and-microservices.md`).

Read-modify-write under concurrency (balance, stock): don't `find` then `save` — use an atomic conditional update and check affected rows:

```ts
const r = await em.update(Product,
  { id, stock: MoreThanOrEqual(qty) },
  { stock: () => `stock - ${Number(qty)}` });  // or parameterized decrement
if (!r.affected) throw new ConflictException('Out of stock');
```

(Prisma: `updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })`; Mongoose: `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`.)

## 2. N+1 — diagnosis and fixes

Symptom: a list endpoint fires 1 query for N rows, then N queries for a relation (often invisible behind lazy access or a `for…of` with `await` inside).

- Detect: enable query logging in dev (`logging: true` / Prisma `log: ['query']`), or count queries in a test; a loop containing `await repo.find*` is guilty until proven innocent.
- Fix by loading deliberately: TypeORM `relations: { items: true }` or a `leftJoinAndSelect`; Prisma `include`; Mongoose `.populate()` (which batches) or an aggregation `$lookup`.
- For aggregates (counts per row), one `GROUP BY` query beats N counts: fetch all aggregates keyed by id, then zip in memory.
- DataLoader pattern for GraphQL resolvers — N+1 is the default failure mode of naive resolvers.

## 3. TypeORM specifics

- `synchronize: true` outside local dev is a flag-it-immediately bug (silent destructive schema changes). Migrations only.
- Repositories via `@InjectRepository(Entity)` + `TypeOrmModule.forFeature([Entity])` in the module. Custom query logic: either service-level query builder or a custom repository class — follow the repo's existing pattern.
- Query builder is parameterized via `:params` — never template-string user input into `where` raw SQL. `dataSource.query()` with string concatenation = SQL injection, full stop; if raw SQL is needed use `$1`/`?` placeholders.
- `relations` loading is explicit by default — good. Avoid `{ eager: true }` on entities (hides cost everywhere); avoid lazy relations (`Promise<…>`) — they're the N+1 factory.
- `select` only what you need on hot paths; entities with `@Exclude()` password fields still load the column — `select: false` on the column keeps it out of queries entirely (then `addSelect` explicitly for auth).
- `save()` does upsert-ish magic and extra SELECTs; for updates by id prefer `update()`/`increment()`; check `affected`.
- Indexes: every column used in `WHERE`/`ORDER BY`/FK joins on a non-trivial table — declare with `@Index()` so the migration captures it. Unique business keys get unique constraints (the DB is the last line of defense against duplicates, not application checks).

## 4. Prisma specifics

- One `PrismaService extends PrismaClient` (`onModuleInit` → `$connect`, shutdown hook → `$disconnect`), provided by a global `PrismaModule`.
- **Never return Prisma models from controllers**: `Decimal` serializes as a string, `DateTime` formatting drifts, and you'll leak columns added later. Map to response DTOs.
- `select`/`include` narrow at the query — Prisma has no lazy loading, which prevents accidental N+1 but tempts over-`include`; include only what the use case needs.
- Unique-violation handling: catch `PrismaClientKnownRequestError` `P2002` → 409; `P2025` (not found on update/delete) → 404. Don't let raw Prisma errors reach the client.
- Migrations: `prisma migrate dev` locally, `prisma migrate deploy` in CI/prod. Schema drift = the schema file is the truth; hotfixing the DB by hand breaks the chain.
- Raw queries: `$queryRaw` tagged template is parameterized (safe); `$queryRawUnsafe` with concatenation is the injection hole — the name is the warning.

## 5. Mongoose specifics

- Schemas via `@Schema()/@Prop()` classes + `SchemaFactory`; register with `MongooseModule.forFeature`.
- Model the document for the read patterns: embed what's read together (order + items), reference what's shared/unbounded (user). Avoid unbounded growing arrays in one doc (16MB cap, write contention).
- `.lean()` for read-only queries (plain objects, ~5-10x faster, no hydration) — but then virtuals/methods don't exist.
- Validation in DTOs still applies — Mongoose schema validation is the backstop, not the front door.
- Indexes declared in schema; `autoIndex: false` in prod (build via migration/script); compound indexes must match query field order.
- Multi-doc atomicity needs transactions (replica set) — otherwise restructure for single-doc atomic ops (`$inc`, `$push` with `findOneAndUpdate`).

## 6. Pagination contracts

- Offset (`?page=&limit=`, return `{ data, meta: { total, page, limit } }`) — fine for admin tables; degrades on deep pages.
- Cursor (`?cursor=&limit=`, return `nextCursor`) — for feeds/infinite scroll and big tables; cursor = encoded (createdAt, id) tuple for stable order.
- Always: server-side max limit (e.g. 100), default (e.g. 20), deterministic `ORDER BY` (tiebreak on id), validated/whitelisted sort fields (sort injection via `ORDER BY ${sort}` is real).

## 7. Concurrency & locking

- First choice: atomic conditional updates (§1) and DB unique constraints (check-then-insert is a race; insert-and-catch-unique is correct).
- Pessimistic: `setLock('pessimistic_write')` / `SELECT … FOR UPDATE` inside a transaction for hot contended rows (seat booking). Keep the critical section tiny.
- Optimistic: `@VersionColumn()` and retry-on-conflict for low-contention edits.
- Idempotency for retried requests: unique idempotency key column + catch duplicate → return original result.

## 8. Migrations

- Every schema change = a migration file in the same PR as the code. Reversible `down` where feasible.
- Safe-deploy discipline (zero-downtime): additive first (add nullable column, backfill, then constrain), never drop/rename in the same deploy that stops writing the old shape. Index creation on big tables: `CONCURRENTLY` (Postgres, outside transaction).
- Migrations don't import app code (entities drift) — write raw SQL or the generated diff, reviewed.

## 9. Money, time, soft delete

- Money: integer minor units (`amount_cents bigint`) or `numeric/decimal` column mapped to a decimal library — never float, never JS arithmetic on parsed floats. Currency stored alongside amount.
- Time: store UTC `timestamptz`; never `Date.now()` math for business dates across timezones — the edge (client) localizes.
- Soft delete: TypeORM `@DeleteDateColumn` + `softDelete()` (finds auto-exclude); Prisma: `deletedAt` + middleware/extension or explicit `where: { deletedAt: null }` everywhere (be honest about which the repo does). Remember unique constraints must include `deletedAt` semantics (partial unique index) or re-creation breaks.
