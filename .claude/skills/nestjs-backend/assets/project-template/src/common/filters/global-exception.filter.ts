import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Response } from 'express';

import { ApiErrorResponse } from '../types/api-response';
import { CLS_CORRELATION_ID } from '../correlation-id';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorCode } from '../exceptions/error-code.enum';

const STATUS_TO_CODE: Readonly<Record<number, ErrorCode>> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.UNAUTHENTICATED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  429: ErrorCode.RATE_LIMITED,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

/** One funnel for every error: stable envelope out, structured log in.
 *  Internals (stack, SQL, driver errors) never reach the client. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const correlationId = this.cls.get<string | undefined>(CLS_CORRELATION_ID) ?? 'n/a';

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL;
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof DomainException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_TO_CODE[status] ?? ErrorCode.INTERNAL;
      const responseBody = exception.getResponse();
      message = exception.message;
      if (typeof responseBody === 'object') {
        const maybeMessage = (responseBody as { message?: unknown }).message;
        if (Array.isArray(maybeMessage)) {
          // class-validator detail: keep per-field messages for clients
          details = maybeMessage;
        } else if (status === 503) {
          // terminus puts per-check results in the body — preserve them
          details = responseBody;
        }
      }
    }

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled exception [${correlationId}]: ${message}`, stack);
    } else {
      this.logger.warn(`[${correlationId}] ${String(status)} ${code}: ${message}`);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, details },
      correlationId,
    };
    res.status(status).json(body);
  }
}
