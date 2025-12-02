/**
 * Request logging middleware module
 *
 * This module provides middleware that logs incoming requests and their completions,
 * including request method, URL, status code, duration, and a unique request ID
 * for distributed tracing.
 *
 * @module middleware/logger
 */

import type { Context, Next } from 'hono';
import { logger } from '@/utils/logger';

/**
 * Request logging middleware
 *
 * Logs all incoming HTTP requests and their completions with:
 * - Request ID (generated UUID) attached to context for tracing
 * - Request method and URL
 * - Response status code
 * - Request duration in milliseconds
 *
 * The request ID is also stored in the Hono context and can be accessed
 * in other middleware and handlers via `c.get('requestId')`.
 *
 * @param {Context} c - Hono context object
 * @param {Next} next - Next middleware function
 *
 * @example
 * ```typescript
 * app.use('*', loggerMiddleware);
 *
 * // Access request ID in handlers
 * app.get('/example', (c) => {
 *   const requestId = c.get('requestId');
 *   logger.info({ requestId }, 'Processing request');
 * });
 * ```
 *
 * @example
 * Example log output (development mode):
 * ```
 * INFO: Incoming request
 *   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *   method: "GET"
 *   url: "/api/v1/documents"
 *
 * INFO: Request completed
 *   requestId: "550e8400-e29b-41d4-a716-446655440000"
 *   method: "GET"
 *   url: "/api/v1/documents"
 *   status: 200
 *   duration: "45ms"
 * ```
 */
export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;

  // Generate request ID
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  logger.info({
    requestId,
    method,
    url,
    msg: 'Incoming request',
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({
    requestId,
    method,
    url,
    status,
    duration: `${duration}ms`,
    msg: 'Request completed',
  });
};
