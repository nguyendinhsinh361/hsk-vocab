import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';

export const CORRELATION_ID_HEADER = 'x-request-id';
export const CLS_CORRELATION_ID = 'correlationId';

/**
 * Read the inbound x-request-id (or mint one) and pin it back onto the request
 * headers, so every consumer that runs later (CLS middleware, pino-http) agrees
 * on a single id per request regardless of middleware order.
 */
export function correlationIdFrom(req: IncomingMessage): string {
  const header = req.headers[CORRELATION_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  const id = value ?? randomUUID();
  req.headers[CORRELATION_ID_HEADER] = id;
  return id;
}
