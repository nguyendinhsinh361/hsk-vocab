import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
}));
