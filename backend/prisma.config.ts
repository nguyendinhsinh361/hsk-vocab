import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Prisma 7: khi có prisma.config.ts thì package.json#prisma.seed bị bỏ qua,
    // phải khai báo seed ở đây để `migrate reset` / `db seed` chạy seed.
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
