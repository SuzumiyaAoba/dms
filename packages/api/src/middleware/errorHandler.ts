/**
 * Global error handling middleware module
 *
 * This module provides centralized error handling for the entire application.
 * It catches all errors thrown in route handlers and other middleware, logs them,
 * and returns standardized error responses to clients.
 *
 * @module middleware/errorHandler
 */

import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

/**
 * Global error handling middleware
 *
 * Catches and processes all errors thrown during request handling.
 * Provides specialized handling for:
 * - **Zod validation errors**: Returns 400 with validation details
 * - **Custom AppError instances**: Returns error with appropriate status code
 * - **Unknown errors**: Returns 500 internal server error
 *
 * All errors are logged with request ID and stack trace for debugging.
 *
 * @param {Context} c - Hono context object
 * @param {Next} next - Next middleware function
 *
 * @example
 * Usage in Hono app:
 * ```typescript
 * import { errorHandler } from './middleware/errorHandler';
 *
 * app.use('*', errorHandler);
 *
 * // Errors thrown anywhere will be caught and handled
 * app.get('/example', () => {
 *   throw new NotFoundError('Document', '123');
 *   // Returns: { success: false, error: { code: 'NOT_FOUND', ... }, ... }
 * });
 * ```
 *
 * @example
 * Zod validation error handling:
 * ```typescript
 * app.post('/documents', zValidator('json', documentSchema), async (c) => {
 *   // If validation fails, ZodError is caught and returns:
 *   // {
 *   //   success: false,
 *   //   error: {
 *   //     code: 'VALIDATION_ERROR',
 *   //     message: 'Validation failed',
 *   //     details: [{ path: ['title'], message: 'Required' }]
 *   //   }
 *   // }
 * });
 * ```
 *
 * @example
 * Custom error handling:
 * ```typescript
 * app.delete('/documents/:id', async (c) => {
 *   const doc = await findDocument(id);
 *   if (!doc) {
 *     throw new NotFoundError('Document', id);
 *     // Returns: { success: false, error: { code: 'NOT_FOUND', ... }, ... }
 *   }
 *   if (!canDelete(doc)) {
 *     throw new ForbiddenError('Cannot delete this document');
 *     // Returns: { success: false, error: { code: 'FORBIDDEN', ... }, ... }
 *   }
 * });
 * ```
 */
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    const requestId = c.get('requestId');

    // Log error
    logger.error({
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return errorResponse(
        c,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        error.errors,
      );
    }

    // Handle custom AppError
    if (error instanceof AppError) {
      return errorResponse(c, error.code, error.message, error.statusCode, error.details);
    }

    // Handle unknown errors
    return errorResponse(
      c,
      ERROR_CODES.INTERNAL_ERROR,
      'Internal server error',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};
