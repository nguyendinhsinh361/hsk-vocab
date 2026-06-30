import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { cacheConfig } from '../config/cache.config';
import { CacheService } from './cache.service';
import { CACHE_STORE, CacheStore } from './stores/cache-store.interface';
import { InMemoryCacheStore } from './stores/in-memory.store';
import { RedisCacheStore, createRedisClient } from './stores/redis.store';

/**
 * Caching is the top-level concept; Redis is just one backend of it.
 * CACHE_DRIVER selects the store behind the CACHE_STORE token — consumers
 * (CacheService, readiness) never know which one they got (DIP/LSP).
 * Global for the same reason IamModule is: cross-cutting infrastructure.
 */
@Global()
@Module({
  providers: [
    {
      provide: CACHE_STORE,
      inject: [cacheConfig.KEY],
      useFactory: (cfg: ConfigType<typeof cacheConfig>): CacheStore =>
        cfg.driver === 'redis'
          ? new RedisCacheStore(createRedisClient(cfg.redis))
          : new InMemoryCacheStore(),
    },
    CacheService,
  ],
  exports: [CACHE_STORE, CacheService],
})
export class CacheModule implements OnApplicationShutdown {
  constructor(@Inject(CACHE_STORE) private readonly store: CacheStore) {}

  /** Graceful shutdown of whichever backend is live (requires enableShutdownHooks). */
  async onApplicationShutdown(): Promise<void> {
    await this.store.disconnect();
  }
}
