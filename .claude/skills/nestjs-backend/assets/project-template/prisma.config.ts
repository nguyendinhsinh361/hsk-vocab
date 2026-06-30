// Prisma 7 CLI config. The CLI no longer auto-loads .env, so migrate
// dev/deploy/status get DATABASE_URL via the dotenv import below.
// Excluded from tsconfig.build.json (CLI-only file; compiling it would shift
// the dist/ layout).
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // optional for `prisma generate` (postinstall works without an env);
  // required for migrate/introspection commands, which connect to the DB
  datasource: { url: process.env.DATABASE_URL },
});
