import Redis from 'ioredis';

import { CacheStore } from './cache-store.interface';

/**
 * The slice of ioredis the store actually uses (ISP): the contract spec fakes
 * it with a Map instead of a real Redis. ioredis' `Redis` satisfies it
 * structurally — no adapter needed.
 */
export interface RedisLike {
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, secondsToken: 'EX', seconds: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  scan(
    cursor: string,
    matchToken: 'MATCH',
    pattern: string,
    countToken: 'COUNT',
    count: number,
  ): Promise<[cursor: string, keys: string[]]>;
  quit(): Promise<unknown>;
}

export function createRedisClient(options: {
  host?: string;
  port: number;
  password?: string;
}): RedisLike {
  return new Redis({
    host: options.host,
    port: options.port,
    password: options.password,
    maxRetriesPerRequest: 3, // fail commands fast; readiness reports the outage
  });
}

/** Redis-backed CacheStore. Owns the client lifecycle: created via
 *  createRedisClient in CacheModule's factory, closed in disconnect(). */
export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisLike) {}

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** SCAN-based prefix deletion (never KEYS — it blocks Redis on large keyspaces). */
  async delByPrefix(prefix: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      if (keys.length > 0) deleted += await this.redis.del(...keys);
      cursor = next;
    } while (cursor !== '0');
    return deleted;
  }

  async ping(): Promise<void> {
    await this.redis.ping();
  }

  /** QUIT waits for pending replies; already-closed connections reject — ignore. */
  async disconnect(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}
