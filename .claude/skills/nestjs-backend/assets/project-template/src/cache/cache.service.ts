import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { cacheConfig } from '../config/cache.config';
import { CACHE_STORE, CacheStore } from './stores/cache-store.interface';

/** Namespaced key builder: cacheKey('users', 42) → 'cache:users:42'. */
export function cacheKey(...parts: (string | number)[]): string {
  return ['cache', ...parts.map(String)].join(':');
}

/**
 * The cache facade the app codes against: typed JSON over whichever CacheStore
 * the driver config selected. Deliberately not cache-manager/Keyv: one narrow
 * store contract, one serialization format (JSON), no extra moving parts.
 * Every entry has a TTL — an entry that cannot expire is a bug.
 */
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_STORE) private readonly store: CacheStore,
    @Inject(cacheConfig.KEY) private readonly config: ConfigType<typeof cacheConfig>,
  ) {}

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.store.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null; // corrupt entry = cache miss; the read-through path repairs it
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.store.set(key, JSON.stringify(value), ttlSeconds ?? this.config.ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.store.del(key);
  }

  /** e.g. delByPrefix(cacheKey('users')) wipes every cached user. */
  delByPrefix(prefix: string): Promise<number> {
    return this.store.delByPrefix(prefix);
  }
}
