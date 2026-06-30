import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { databaseConfig } from '../config/database.config';
import { PrismaClient } from '../generated/prisma/client';

/**
 * The one PrismaClient of the app. Prisma 7 has no bundled engine — the pg
 * driver adapter owns the connection pool. Lifecycle is explicit: $connect on
 * boot (fail fast, not on first query), $disconnect on shutdown (requires
 * enableShutdownHooks in main.ts). Tests override this provider with a stub.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor(@Inject(databaseConfig.KEY) db: ConfigType<typeof databaseConfig>) {
    super({ adapter: new PrismaPg({ connectionString: db.url }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
