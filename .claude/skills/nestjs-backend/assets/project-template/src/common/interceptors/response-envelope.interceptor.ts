import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { Observable, map } from 'rxjs';

import { CLS_CORRELATION_ID } from '../correlation-id';
import { SKIP_ENVELOPE_KEY } from '../decorators/skip-envelope.decorator';
import { Paginated } from '../dto/paginated';
import { ApiResponse } from '../types/api-response';

/**
 * Wraps every successful controller return into the ApiResponse envelope.
 * Controllers return plain DTOs (or Paginated<T>) and stay envelope-agnostic —
 * the contract lives in exactly one place (OCP: change the envelope here only).
 * Endpoints with an externally mandated body shape opt out via @SkipEnvelope().
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(
    private readonly cls: ClsService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    return next.handle().pipe(
      map((payload) => {
        const correlationId = this.cls.get<string | undefined>(CLS_CORRELATION_ID) ?? 'n/a';
        if (payload instanceof Paginated) {
          return {
            success: true as const,
            data: payload.data as T,
            meta: payload.meta,
            correlationId,
          };
        }
        return { success: true as const, data: payload, correlationId };
      }),
    );
  }
}
