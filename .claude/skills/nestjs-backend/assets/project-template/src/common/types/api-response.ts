/**
 * The single response contract for the whole API (FORMAT RESPONSE).
 * Success is wrapped by ResponseEnvelopeInterceptor; errors by GlobalExceptionFilter.
 * Clients can always branch on `success` and read `error.code` programmatically.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PageMeta | Record<string, unknown>;
  correlationId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // stable machine-readable code (ErrorCode enum)
    message: string; // human-readable, safe to display
    details?: unknown; // e.g. field-level validation errors
  };
  correlationId: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
