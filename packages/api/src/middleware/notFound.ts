/**
 * 404 Not Found handler module
 *
 * This module provides a handler for routes that don't match any defined endpoints.
 * It returns a standardized 404 error response with details about the requested
 * route that was not found.
 *
 * @module middleware/notFound
 */

import type { Context } from 'hono';
import { ERROR_CODES, HTTP_STATUS } from '@/config/constants';
import { errorResponse } from '@/utils/response';

/**
 * 404 Not Found handler
 *
 * Returns a standardized error response for requests to undefined routes.
 * The error message includes the HTTP method and path that was not found.
 *
 * This handler should be registered after all route definitions to catch
 * any requests that don't match defined endpoints.
 *
 * @param {Context} c - Hono context object
 * @returns {Response} 404 error response with route information
 *
 * @example
 * Usage in Hono app:
 * ```typescript
 * import { notFound } from './middleware/notFound';
 *
 * const app = new Hono();
 *
 * // Define all routes first
 * app.get('/documents', ...);
 * app.post('/documents', ...);
 *
 * // Register 404 handler last
 * app.notFound(notFound);
 * ```
 *
 * @example
 * Response for undefined route:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Route GET /api/unknown not found"
 *   },
 *   "meta": {
 *     "timestamp": "2025-11-30T12:00:00.000Z",
 *     "requestId": "550e8400-e29b-41d4-a716-446655440000"
 *   }
 * }
 * ```
 */
export const notFound = (c: Context) => {
  return errorResponse(
    c,
    ERROR_CODES.NOT_FOUND,
    `Route ${c.req.method} ${c.req.path} not found`,
    HTTP_STATUS.NOT_FOUND,
  );
};
