import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HealthCheck, HealthCheckService, HealthIndicatorFunction } from '@nestjs/terminus';

import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { cacheConfig } from '../config/cache.config';
import { Public } from '../iam/decorators/public.decorator';
import { CacheHealthIndicator } from './cache-health.indicator';
import { PrismaHealthIndicator } from './prisma-health.indicator';

/** @SkipEnvelope: terminus output is a contract monitoring tools rely on —
 *  it must not be wrapped. Failures (503) still flow through the exception
 *  filter, which maps them to SERVICE_UNAVAILABLE and keeps per-check detail. */
@SkipEnvelope()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly cache: CacheHealthIndicator,
    @Inject(cacheConfig.KEY) private readonly cacheCfg: ConfigType<typeof cacheConfig>,
  ) {}

  /** Liveness: process is up. Keep dependency-free. */
  @Public()
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  /** Readiness: database always; the cache backend only when it is an external
   *  dependency (redis) — the in-memory driver must never fail readiness. */
  @Public()
  @Get('ready')
  @HealthCheck()
  ready() {
    const checks: HealthIndicatorFunction[] = [() => this.db.isHealthy('database')];
    if (this.cacheCfg.driver === 'redis') checks.push(() => this.cache.isHealthy('redis'));
    return this.health.check(checks);
  }
}
