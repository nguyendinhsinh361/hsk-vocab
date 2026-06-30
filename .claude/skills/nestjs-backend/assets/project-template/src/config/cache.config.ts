import { registerAs } from '@nestjs/config';

export type CacheDriver = 'redis' | 'memory';

/** Caching is the concept; redis is just one backend of it. The driver picks
 *  the CacheStore implementation: redis for shared/prod caches, memory for
 *  zero-infrastructure dev and test. */
export const cacheConfig = registerAs('cache', () => ({
  driver: (process.env.CACHE_DRIVER ?? 'memory') as CacheDriver,
  ttlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 60),
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    // empty string in .env means "no auth" — ioredis expects undefined for that
    password: process.env.REDIS_PASSWORD === '' ? undefined : process.env.REDIS_PASSWORD,
  },
}));
