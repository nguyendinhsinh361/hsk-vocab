import * as Joi from 'joi';

/** Boot fails fast on invalid env — misconfiguration is a deploy-time error,
 *  never a 3am runtime surprise. */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('900s'),
  JWT_REFRESH_TTL: Joi.string().default('30d'),
  // cache: the memory driver needs no infrastructure (default, e.g. for test);
  // redis connection vars are only required when that driver is selected
  CACHE_DRIVER: Joi.string().valid('redis', 'memory').default('memory'),
  REDIS_HOST: Joi.string().when('CACHE_DRIVER', {
    is: 'redis',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(60),
  CORS_ORIGINS: Joi.string().required(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
});
