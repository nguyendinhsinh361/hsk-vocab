import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { isFakeData } from '../fake/fake.util';

/** Tạo adapter MySQL từ DATABASE_URL (mysql://user:pass@host:port/db). */
export function createMysqlAdapter(): PrismaMariaDb {
  // Fallback để fake mode (chưa cấu hình DB) không crash khi parse URL rỗng.
  const url = new URL(
    process.env.DATABASE_URL || 'mysql://root@localhost:3306/migii_hsk',
  );
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 5,
  });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: createMysqlAdapter() });
  }

  async onModuleInit() {
    // Fake mode: không kết nối DB (FE chạy bằng fixtures).
    if (isFakeData()) return;
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
