import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';

import { CacheModule } from './cache/cache.module';
import {
  CLS_CORRELATION_ID,
  CORRELATION_ID_HEADER,
  correlationIdFrom,
} from './common/correlation-id';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { cacheConfig } from './config/cache.config';
import { databaseConfig } from './config/database.config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { IamModule } from './iam/iam.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, cacheConfig],
      validationSchema: envValidationSchema,
    }),
    // nestjs-cls owns the request context: its mounted middleware wraps every
    // request in cls.run(), so the correlation id is available to the envelope
    // interceptor, the exception filter, and anything else — no parameter threading.
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => correlationIdFrom(req),
        setup: (cls: ClsService, _req: Request, res: Response) => {
          cls.set(CLS_CORRELATION_ID, cls.getId());
          res.setHeader(CORRELATION_ID_HEADER, cls.getId());
        },
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        // same id as the envelope, so any log line can be joined to its response
        genReqId: (req) => correlationIdFrom(req),
        redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
        transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    CacheModule,
    IamModule,
    HealthModule,
    // feature modules
    AuthModule,
    UsersModule,
  ],
  providers: [
    // order: throttling → auth (IamModule) → validation → envelope → error funnel
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
