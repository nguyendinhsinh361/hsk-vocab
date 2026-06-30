import { HttpException, HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-code.enum';

/**
 * Base for business-rule violations. Services throw these (or standard
 * HttpExceptions); the GlobalExceptionFilter maps them to the envelope.
 * Subclass per domain when useful: `class OrderNotCancellableException extends DomainException`.
 */
export class DomainException extends HttpException {
  constructor(
    readonly code: ErrorCode | string,
    message: string,
    status: HttpStatus = HttpStatus.CONFLICT,
    readonly details?: unknown,
  ) {
    super(message, status);
  }
}
