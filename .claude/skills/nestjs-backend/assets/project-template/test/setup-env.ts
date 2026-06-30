/**
 * Must be imported BEFORE AppModule: ConfigModule.forRoot validates the env
 * eagerly (Joi), so a complete env has to exist at import time.
 * No real database is needed — the e2e suite overrides PrismaService.
 * CACHE_DRIVER is intentionally unset: it defaults to 'memory', so the cache
 * needs no infrastructure either.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'e2e-test-secret-e2e-test-secret-e2e-test';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';

export {};
