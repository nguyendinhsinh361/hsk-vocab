import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { PrismaService } from '../database/prisma.service';

/** Custom terminus indicator: readiness flips to 503 when Postgres is
 *  unreachable. $queryRaw is a tagged template (parameterized); SELECT 1 is
 *  the canonical liveness probe of the connection pool. */
@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly healthIndicators: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicators.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch {
      return indicator.down();
    }
  }
}
