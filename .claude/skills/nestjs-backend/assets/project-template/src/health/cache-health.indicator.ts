import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { CACHE_STORE, CacheStore } from '../cache/stores/cache-store.interface';

/** Pings whichever CacheStore is live. Only wired into /health/ready when the
 *  driver is an external dependency (redis) — see HealthController. */
@Injectable()
export class CacheHealthIndicator {
  constructor(
    private readonly healthIndicators: HealthIndicatorService,
    @Inject(CACHE_STORE) private readonly store: CacheStore,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicators.check(key);
    try {
      await this.store.ping();
      return indicator.up();
    } catch {
      return indicator.down();
    }
  }
}
