import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  // Joi guarantees presence at boot; the fallback only narrows the type.
  url: process.env.DATABASE_URL ?? '',
}));
