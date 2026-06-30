import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV as 'development' | 'test' | 'production',
  port: Number(process.env.PORT),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()),
  logLevel: process.env.LOG_LEVEL ?? 'info',
}));
