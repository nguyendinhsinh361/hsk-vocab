# Testing — what to test, how, and what to skip

The repo's existing tests define the style (runner, mock patterns, file placement). NestJS 11 scaffolds default to Vitest+SWC; many existing repos use Jest — match what's installed, the patterns below work in both.

## What to test (priority order)

1. **Service business rules** — unit tests, every rule: happy path + each unhappy path (not found, forbidden, invalid state, conflict). This is where bugs live.
2. **Tricky pure logic** (price calc, state machines, date math) — extract to pure functions; test exhaustively, cheap.
3. **One e2e per route** (if repo has e2e infra) — the contract: status codes, response shape, auth behavior, validation rejects.
4. **Regression test per bug fix** — write it failing first; it's the proof the fix fixes.

What to skip: controllers that only delegate (e2e covers them), trivial getters/mappers, the framework itself, and mock-theater tests that only assert "service called repo once" without asserting behavior/outcome.

## Unit testing a service

```ts
describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<Repository<Order>>;   // or a hand-rolled mock object

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: createMock<Repository<Order>>() },
        { provide: UsersService, useValue: { findById: jest.fn() } },
        { provide: getQueueToken('mail'), useValue: { add: jest.fn() } },
      ],
    }).compile();
    service = module.get(OrdersService);
    repo = module.get(getRepositoryToken(Order));
  });

  it('refuses to cancel a shipped order', async () => {
    repo.findOne.mockResolvedValue({ id: 1, status: 'SHIPPED', userId: 7 } as Order);
    await expect(service.cancel(1, { id: 7, role: 'user' }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
```

Patterns:

- Mock at the injection boundary (repository/PrismaService/queue/http), not deeper. Provide mocks via the testing module tokens: `getRepositoryToken(Entity)`, `getModelToken(Name)` (Mongoose), `getQueueToken(name)` (BullMQ), or the custom provider token.
- Prisma: mock the `PrismaService` methods the service calls (`prisma.order.findUnique` etc.) — `jest-mock-extended`'s `mockDeep<PrismaClient>()` is the common trick.
- Transactions in unit tests: `dataSource.transaction` mock that just invokes the callback with a mock manager (`(cb) => cb(mockEm)`); assert the *manager's* methods were used (catches the "ambient repo inside transaction" bug).
- Time: inject/fake the clock (`jest.useFakeTimers` or a `Clock` provider) for expiry/scheduling logic; never sleep in tests.
- Assert behavior and outcomes (returned value, thrown type, state passed to save), not call counts for their own sake. One behavior per test; name tests as specs ("refuses to cancel a shipped order").

## e2e tests

```ts
const app = moduleRef.createNestApplication();
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })); // mirror main.ts!
await app.init();
await request(app.getHttpServer())
  .post('/orders').set('Authorization', `Bearer ${token}`)
  .send({ items: [...] })
  .expect(201)
  .expect(({ body }) => expect(body.data.status).toBe('PENDING'));
```

- **Mirror main.ts wiring** (pipes/filters/prefix/versioning) in the test app, or your e2e passes while prod 400s. If the repo has a `createApp(app)` helper shared by main.ts and tests, use it; if not, suggest one.
- Real DB beats mocked DB for e2e: Testcontainers (Postgres/Mongo/Redis ephemeral per suite) or a dockerized test DB with per-test truncation. Each test seeds its own data via factories; tests never depend on each other's leftovers or on execution order.
- Auth in e2e: a test helper that mints a real JWT (test secret) or hits the login route once — don't disable guards (then you're not testing the contract).
- External services (payment, mail): fake at the HTTP boundary (nock/msw) or override the provider with a stub via `overrideProvider` — never call real third parties in CI.

## Fixtures & factories

A `test/factories/` with builder functions (`makeUser(overrides)`, `makeOrder(...)`) beats fat JSON fixtures: defaults valid, overrides explicit, types enforced. For DB seeding, factories insert via the real layer (repo/Prisma) so constraints hold.

## Coverage & CI sanity

- Don't chase a number; chase risk: services and money/state logic near 100%, glue layers via e2e.
- Tests must be parallel-safe (unique emails/ids per test, isolated schema/db per worker if the runner parallelizes DB suites).
- Flaky test = bug (usually time, order dependence, or shared state). Quarantine and fix; never `retry: 3` it into silence.
