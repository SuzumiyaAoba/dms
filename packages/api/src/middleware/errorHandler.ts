import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

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
